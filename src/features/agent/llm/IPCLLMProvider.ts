import { LLMProvider, LLMMessage, LLMOptions, LLMResponse, LLMTool, LLMModel, LLMConfig, LLMStreamChunk } from './types';

const MAX_RETRIES = 3;

export interface IPCLLMConfig extends LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey?: string;
  model?: string;
}

export class IPCLLMProvider implements LLMProvider {
  private readonly config: IPCLLMConfig;

  constructor(config: IPCLLMConfig) {
    this.config = config;
  }

  private getApi(): Window['electronAPI'] | undefined {
    return window.electronAPI;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(500 * Math.pow(2, attempt));
        }
      }
    }
    throw lastError;
  }

  private toResponse(result: any): LLMResponse {
    const usage = result?.usage;
    return {
      content: result?.content ?? '',
      toolCalls: result?.toolCalls,
      model: result?.model ?? this.config.model ?? 'unknown',
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens ?? usage.input_tokens ?? 0,
            completionTokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
            totalTokens:
              (usage.prompt_tokens ?? usage.input_tokens ?? 0) +
              (usage.completion_tokens ?? usage.output_tokens ?? 0),
          }
        : undefined,
    };
  }

  private normalizeMessages(prompt: string | LLMMessage[]): any[] {
    if (typeof prompt === 'string') {
      return [{ role: 'user', content: prompt }];
    }
    return prompt.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool',
          content: m.content,
          name: m.name,
          tool_call_id: m.toolCallId,
        };
      }
      if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
        return {
          role: 'assistant',
          content: m.content || '',
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments:
                typeof tc.arguments === 'string'
                  ? tc.arguments
                  : JSON.stringify(tc.arguments ?? {}),
            },
          })),
        };
      }
      return { role: m.role, content: m.content, name: m.name };
    });
  }

  async generate(prompt: string | LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const api = this.getApi();
    if (!api?.llm?.generate) {
      throw new Error('Electron LLM API is not available. Run inside the desktop app.');
    }

    return this.retry(async () => {
      const result = await api.llm.generate(
        this.config.provider,
        this.normalizeMessages(prompt),
        {
          model: options?.model || this.config.model,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
        }
      );
      return this.toResponse(result);
    });
  }

  async generateWithTools(
    prompt: string | LLMMessage[],
    tools: LLMTool[],
    options?: LLMOptions
  ): Promise<LLMResponse> {
    const api = this.getApi();
    if (!api?.llm?.generate) {
      throw new Error('Electron LLM API is not available. Run inside the desktop app.');
    }

    return this.retry(async () => {
      const result = await api.llm.generate(
        this.config.provider,
        this.normalizeMessages(prompt),
        {
          model: options?.model || this.config.model,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
          tools,
        }
      );
      return this.toResponse(result);
    });
  }

  stream(
    prompt: string | LLMMessage[],
    options?: LLMOptions
  ): AsyncIterable<LLMStreamChunk> {
    // 一期以整段返回模拟流式；真实 SSE 留待二期
    const resultPromise = this.generate(prompt, options);
    return (async function* () {
      const result = await resultPromise;
      yield { type: 'content', content: result.content } as LLMStreamChunk;
      for (const toolCall of result.toolCalls || []) {
        yield { type: 'tool_call', toolCall } as LLMStreamChunk;
      }
      yield { type: 'done' } as LLMStreamChunk;
    })();
  }

  async getModels(): Promise<LLMModel[]> {
    const api = this.getApi();
    if (!api?.llm?.generate) {
      return [];
    }
    try {
      const hasKey = await api.llm.hasAPIKey(this.config.provider);
      if (!hasKey) {
        return [];
      }
      const models: LLMModel[] =
        this.config.provider === 'openai'
          ? [
              { id: 'gpt-4', name: 'GPT-4', provider: 'openai', maxTokens: 8192, supportsStreaming: true, supportsToolCalling: true },
              { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000, supportsStreaming: true, supportsToolCalling: true },
              { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 16385, supportsStreaming: true, supportsToolCalling: true },
            ]
          : [
              { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', maxTokens: 200000, supportsStreaming: true, supportsToolCalling: true },
              { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', maxTokens: 200000, supportsStreaming: true, supportsToolCalling: true },
              { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', maxTokens: 200000, supportsStreaming: true, supportsToolCalling: true },
            ];
      return models;
    } catch {
      return [];
    }
  }
}

export default IPCLLMProvider;