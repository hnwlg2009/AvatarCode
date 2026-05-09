import { LLMProvider, LLMMessage, LLMOptions, LLMResponse, LLMModel, LLMConfig } from './types';

export interface AnthropicConfig extends LLMConfig {
  provider: 'anthropic';
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
}

export class AnthropicProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: AnthropicConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-3-sonnet-20240229';
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.timeout = config.timeout || 30000;

    if (!config.apiKey) {
      throw new Error('Anthropic API Key 未配置');
    }
  }

  async generate(prompt: string | LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const messages = Array.isArray(prompt) ? prompt : [{ role: 'user' as const, content: prompt }];
    const model = options?.model || this.model;

    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        } as any,
        body: JSON.stringify({
          model,
          max_tokens: options?.maxTokens || 2048,
          system: systemMessage?.content,
          messages: userMessages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Anthropic API 错误：${response.status} - ${error.error?.message || 'Unknown error'}`
        );
      }

      const data = await response.json();
      return {
        content: data.content[0].text,
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
      };
    } catch (error: any) {
      throw new Error(`Anthropic 请求失败：${error.message}`);
    }
  }

  async getModels(): Promise<LLMModel[]> {
    return [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        maxTokens: 200000,
        supportsStreaming: true,
        supportsToolCalling: true,
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        maxTokens: 200000,
        supportsStreaming: true,
        supportsToolCalling: true,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        maxTokens: 200000,
        supportsStreaming: true,
        supportsToolCalling: true,
      },
    ];
  }
}
