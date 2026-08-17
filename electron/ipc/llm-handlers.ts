import { ipcMain, app } from 'electron';
import path from 'path';

interface APIKeys {
  openai?: string | AIProviderConfig;
  anthropic?: string | AIProviderConfig;
}

interface AIProviderConfig {
  key?: string;
  baseUrl?: string;
  model?: string;
}

interface LLMToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

class APIKeyManager {
  private keys: APIKeys = {};
  private readonly storagePath: string;

  constructor() {
    this.storagePath = path.join(app.getPath('userData'), 'api-keys.json');
    this.loadKeys();
  }

  private async loadKeys() {
    try {
      const fs = await import('fs/promises');
      const exists = await fs
        .access(this.storagePath)
        .then(() => true)
        .catch(() => false);
      if (exists) {
        const content = await fs.readFile(this.storagePath, 'utf-8');
        this.keys = JSON.parse(content);
      }
    } catch (error) {
      console.error('加载 API Keys 失败:', error);
    }
  }

  private async saveKeys() {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(this.storagePath, JSON.stringify(this.keys, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存 API Keys 失败:', error);
      throw error;
    }
  }

  async setKey(provider: string, config: string | AIProviderConfig): Promise<void> {
    (this.keys as Record<string, any>)[provider] =
      typeof config === 'string' ? { key: config } : { ...this.getConfig(provider), ...config };
    await this.saveKeys();
  }

  getConfig(provider: string): AIProviderConfig {
    const entry = (this.keys as Record<string, any>)[provider];
    if (typeof entry === 'string') {
      return { key: entry };
    }
    return entry ?? {};
  }

  getKey(provider: string): string | undefined {
    return this.getConfig(provider).key;
  }

  getBaseUrl(provider: string): string | undefined {
    return this.getConfig(provider).baseUrl;
  }

  getModel(provider: string): string | undefined {
    return this.getConfig(provider).model;
  }

  hasKey(provider: string): boolean {
    return !!this.getKey(provider);
  }
}

const keyManager = new APIKeyManager();

function parseToolCalls(message: any): any[] | undefined {
  if (!message?.tool_calls || message.tool_calls.length === 0) {
    return undefined;
  }
  return message.tool_calls.map((tc: any) => {
    let args: Record<string, any> = {};
    try {
      args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
    } catch {
      args = {};
    }
    return { id: tc.id, name: tc.function.name, arguments: args };
  });
}

const LLM_TIMEOUT_MS = 300_000;

// 在途请求登记表：渲染层可通过 requestId 取消
const inFlightRequests = new Map<string, AbortController>();

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs?: number,
  cancelSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? LLM_TIMEOUT_MS);
  const signal = cancelSignal
    ? AbortSignal.any([controller.signal, cancelSignal])
    : controller.signal;
  try {
    return await fetch(url, { ...init, signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      if (cancelSignal?.aborted) {
        throw new Error('请求已取消');
      }
      throw new Error(`LLM 请求超时（${(timeoutMs ?? LLM_TIMEOUT_MS) / 1000}s）`);
    }
    // 附上底层原因与目标地址，便于诊断（如 ECONNREFUSED / ENOTFOUND）
    const cause = error?.cause?.message || error?.message || String(error);
    throw new Error(`LLM 连接失败：${cause} (${url})`);
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(
  apiKey: string,
  messages: any[],
  options?: any,
  cancelSignal?: AbortSignal
): Promise<any> {
  const model = options?.model || keyManager.getModel('openai') || 'gpt-4';
  const baseUrl = options?.baseUrl || keyManager.getBaseUrl('openai') || 'https://api.openai.com/v1';

  const body: any = {
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
  };

  if (options?.tools && Array.isArray(options.tools) && options.tools.length > 0) {
    body.tools = options.tools.map((tool: LLMToolSchema) => ({
      type: 'function',
      function: tool,
    }));
  }

  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    options?.timeoutMs,
    cancelSignal
  );

  if (!response.ok) {
    const error: any = await response.json();
    throw new Error(`OpenAI API 错误：${error.error?.message || 'Unknown error'}`);
  }

  const data: any = await response.json();
  const message = data.choices[0]?.message;
  return {
    // 推理模型可能仅返回 reasoning_content，此时回退使用
    content: message?.content ?? message?.reasoning_content ?? null,
    toolCalls: parseToolCalls(message),
    usage: data.usage,
    model: data.model,
  };
}

function toAnthropicMessages(messages: any[]): any[] {
  return messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => {
      if (m.role === 'assistant' && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
        const content: any[] = [];
        if (m.content) content.push({ type: 'text', text: m.content });
        for (const tc of m.tool_calls) {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function?.name ?? '',
            input:
              typeof tc.function?.arguments === 'string'
                ? JSON.parse(tc.function.arguments)
                : (tc.function?.arguments ?? {}),
          });
        }
        return { role: 'assistant', content };
      }
      if (m.role === 'tool') {
        return {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: m.tool_call_id,
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });
}

async function callAnthropic(
  apiKey: string,
  messages: any[],
  tools?: any[],
  options?: any,
  cancelSignal?: AbortSignal
): Promise<any> {
  const model = options?.model || keyManager.getModel('anthropic') || 'claude-3-sonnet-20240229';
  const baseUrl = options?.baseUrl || keyManager.getBaseUrl('anthropic') || 'https://api.anthropic.com/v1';

  const systemMessages = messages.filter((m: any) => m.role === 'system');

  const body: any = {
    model,
    max_tokens: options?.maxTokens ?? 2048,
    messages: toAnthropicMessages(messages),
  };

  if (systemMessages.length > 0) {
    body.system = systemMessages.map((m: any) => m.content).join('\n');
  }

  if (tools && Array.isArray(tools) && tools.length > 0) {
    body.tools = tools.map((t: LLMToolSchema) => ({
      name: t.name,
      description: t.description,
      input_schema: {
        type: 'object',
        properties: t.parameters?.properties ?? {},
        required: t.parameters?.required ?? [],
      },
    }));
  }

  const response = await fetchWithTimeout(
    `${baseUrl}/messages`,
    {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      } as any,
      body: JSON.stringify(body),
    },
    options?.timeoutMs,
    cancelSignal
  );

  if (!response.ok) {
    const error: any = await response.json();
    throw new Error(`Anthropic API 错误：${error.error?.message || 'Unknown error'}`);
  }

  const data: any = await response.json();
  const contentBlocks: any[] = data.content || [];
  const textBlocks = contentBlocks.filter((b: any) => b.type === 'text');
  const toolBlocks = contentBlocks.filter((b: any) => b.type === 'tool_use');

  const toolCalls = toolBlocks.map((b: any) => ({
    id: b.id,
    name: b.name,
    arguments: typeof b.input === 'string' ? JSON.parse(b.input) : (b.input ?? {}),
  }));

  return {
    content: textBlocks.map((b: any) => b.text).join('') || null,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      input_tokens: data.usage?.input_tokens,
      output_tokens: data.usage?.output_tokens,
    },
    model: data.model,
  };
}

export function setupLLMIpcHandlers(): void {
  // 设置 API Key（支持 string 或 { key, baseUrl, model }）
  ipcMain.handle('llm:setAPIKey', async (event, provider: string, config: string | AIProviderConfig) => {
    await keyManager.setKey(provider, config);
    return { success: true };
  });

  // 检查 API Key 是否存在
  ipcMain.handle('llm:hasAPIKey', async (event, provider: string) => {
    return keyManager.hasKey(provider);
  });

  // 获取提供商配置（不含 key 本身，供 UI 回显 baseUrl/model）
  ipcMain.handle('llm:getProviderConfig', async (event, provider: string) => {
    const config = keyManager.getConfig(provider);
    return {
      hasKey: !!config.key,
      baseUrl: config.baseUrl ?? '',
      model: config.model ?? '',
    };
  });

  // 获取 API Key（仅用于内部验证，不返回给 renderer）
  ipcMain.handle('llm:validateAPIKey', async (event, provider: string) => {
    const key = keyManager.getKey(provider);
    if (!key) {
      throw new Error(`${provider} API Key 未配置`);
    }
    return { valid: true };
  });

  // 调用 LLM（使用主进程的 API Key），支持工具调用与按 requestId 取消
  ipcMain.handle(
    'llm:generate',
    async (event, provider: string, messages: any[], options?: any) => {
      const apiKey = keyManager.getKey(provider);
      if (!apiKey) {
        throw new Error(`${provider} API Key 未配置`);
      }

      const tools: LLMToolSchema[] = options?.tools ?? [];
      const requestId: string | undefined = options?.requestId;
      const cancelController = new AbortController();
      if (requestId) {
        inFlightRequests.set(requestId, cancelController);
      }

      try {
        if (provider === 'openai') {
          return await callOpenAI(apiKey, messages, options, cancelController.signal);
        } else if (provider === 'anthropic') {
          return await callAnthropic(apiKey, messages, tools, options, cancelController.signal);
        } else {
          throw new Error(`不支持的 LLM 提供商：${provider}`);
        }
      } catch (error: any) {
        throw new Error(`LLM 请求失败：${error.message}`);
      } finally {
        if (requestId) {
          inFlightRequests.delete(requestId);
        }
      }
    }
  );

  // 取消在途的 LLM 请求
  ipcMain.handle('llm:cancel', (event, requestId: string) => {
    const controller = inFlightRequests.get(requestId);
    if (controller) {
      controller.abort();
      return { cancelled: true };
    }
    return { cancelled: false };
  });

  // 从 baseUrl 拉取模型列表（OpenAI 兼容服务，如 LM Studio / Ollama）
  ipcMain.handle('llm:listModels', async (event, provider: string) => {
    const config = keyManager.getConfig(provider);
    const baseUrl = config.baseUrl;
    if (!baseUrl) {
      return { models: [], error: 'baseUrl 未配置' };
    }
    try {
      const response = await fetchWithTimeout(`${baseUrl}/models`, {
        method: 'GET',
        headers: config.key ? { Authorization: `Bearer ${config.key}` } : {},
      });
      if (!response.ok) {
        return { models: [], error: `HTTP ${response.status}` };
      }
      const data: any = await response.json();
      const models: string[] = (data?.data ?? []).map((m: any) => m.id).filter(Boolean);
      return { models, error: null };
    } catch (error: any) {
      return { models: [], error: error?.message || String(error) };
    }
  });
}

export default keyManager;