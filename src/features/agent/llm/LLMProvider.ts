import { LLMProvider as ILLMProvider, LLMMessage, LLMOptions, LLMResponse, LLMTool, LLMModel, LLMConfig } from './types';

export abstract class BaseLLMProvider implements ILLMProvider {
  protected readonly config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  abstract generate(prompt: string | LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;

  generateWithTools?(
    prompt: string | LLMMessage[],
    tools: LLMTool[],
    options?: LLMOptions
  ): Promise<LLMResponse> {
    throw new Error('不支持 Tool Calling');
  }

  abstract getModels(): Promise<LLMModel[]>;

  protected buildMessages(prompt: string | LLMMessage[]): LLMMessage[] {
    if (typeof prompt === 'string') {
      return [{ role: 'user', content: prompt }];
    }
    return prompt;
  }

  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export type { ILLMProvider };
