import { BaseLLMProvider } from './LLMProvider';
import { LLMMessage, LLMOptions, LLMResponse, LLMTool, LLMModel, LLMConfig } from './types';

export interface OpenAIConfig extends LLMConfig {
  provider: 'openai';
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class OpenAIProvider extends BaseLLMProvider {
  constructor(config: OpenAIConfig) {
    super(config);
    if (!config.apiKey) {
      throw new Error('OpenAI API Key 未配置');
    }
  }

  async generate(prompt: string | LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const messages = this.buildMessages(prompt);
    const model = options?.model || this.config.model || 'gpt-4';
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';

    try {
      const response = await this.fetchWithTimeout(
        `${baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: options?.temperature || 0.7,
            max_tokens: options?.maxTokens || 2048,
            top_p: options?.topP || 1,
            frequency_penalty: options?.frequencyPenalty || 0,
            presence_penalty: options?.presencePenalty || 0,
          }),
        },
        this.config.timeout || 30000
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `OpenAI API 错误：${response.status} - ${error.error?.message || 'Unknown error'}`
        );
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      throw new Error(`OpenAI 请求失败：${error.message}`);
    }
  }

  async generateWithTools(
    prompt: string | LLMMessage[],
    tools: LLMTool[],
    options?: LLMOptions
  ): Promise<LLMResponse> {
    const messages = this.buildMessages(prompt);
    const model = options?.model || this.config.model || 'gpt-4';
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';

    try {
      const response = await this.fetchWithTimeout(
        `${baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            tools: tools.map((tool) => ({
              type: 'function',
              function: tool,
            })),
            temperature: options?.temperature || 0.7,
            max_tokens: options?.maxTokens || 2048,
          }),
        },
        this.config.timeout || 30000
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `OpenAI API 错误：${response.status} - ${error.error?.message || 'Unknown error'}`
        );
      }

      const data = await response.json();
      const message = data.choices[0].message;

      const toolCalls = message.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      }));

      return {
        content: message.content,
        toolCalls,
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      throw new Error(`OpenAI 请求失败：${error.message}`);
    }
  }

  async getModels(): Promise<LLMModel[]> {
    return [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        maxTokens: 8192,
        supportsStreaming: true,
        supportsToolCalling: true,
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsToolCalling: true,
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        maxTokens: 16385,
        supportsStreaming: true,
        supportsToolCalling: true,
      },
    ];
  }
}
