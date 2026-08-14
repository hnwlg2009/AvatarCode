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

const LLM_TIMEOUT_MS = 120_000;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`LLM 请求超时（${LLM_TIMEOUT_MS / 1000}s）`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(apiKey: string, messages: any[], options?: any): Promise<any> {
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

  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: any = await response.json();
    throw new Error(`OpenAI API 错误：${error.error?.message || 'Unknown error'}`);
  }

  const data: any = await response.json();
  const message = data.choices[0]?.message;
  return {
    content: message?.content ?? null,
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

async function callAnthropic(apiKey: string, messages: any[], tools?: any[], options?: any): Promise<any> {
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

  const response = await fetchWithTimeout(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    } as any,
    body: JSON.stringify(body),
  });

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

  // 调用 LLM（使用主进程的 API Key），支持工具调用
  ipcMain.handle(
    'llm:generate',
    async (event, provider: string, messages: any[], options?: any) => {
      const apiKey = keyManager.getKey(provider);
      if (!apiKey) {
        throw new Error(`${provider} API Key 未配置`);
      }

      const tools: LLMToolSchema[] = options?.tools ?? [];

      try {
        if (provider === 'openai') {
          return await callOpenAI(apiKey, messages, options);
        } else if (provider === 'anthropic') {
          return await callAnthropic(apiKey, messages, tools, options);
        } else {
          throw new Error(`不支持的 LLM 提供商：${provider}`);
        }
      } catch (error: any) {
        throw new Error(`LLM 请求失败：${error.message}`);
      }
    }
  );
}

export default keyManager;