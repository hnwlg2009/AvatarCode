import { LLMProvider, LLMConfig } from './types';
import { OpenAIProvider, OpenAIConfig } from './OpenAIProvider';
import { AnthropicProvider, AnthropicConfig } from './AnthropicProvider';

export class LLMFactory {
  private static providers: Map<string, LLMProvider> = new Map();

  static createProvider(config: LLMConfig): LLMProvider {
    const cacheKey = `${config.provider}-${config.model || 'default'}`;

    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!;
    }

    let provider: LLMProvider;

    switch (config.provider) {
      case 'openai': {
        const openAIConfig = config as OpenAIConfig;
        if (!openAIConfig.apiKey) {
          throw new Error('OpenAI API Key 未配置');
        }
        provider = new OpenAIProvider(openAIConfig);
        break;
      }
      case 'anthropic': {
        const anthropicConfig = config as AnthropicConfig;
        if (!anthropicConfig.apiKey) {
          throw new Error('Anthropic API Key 未配置');
        }
        provider = new AnthropicProvider(anthropicConfig);
        break;
      }
      default:
        throw new Error(`不支持的 LLM 提供商：${config.provider}`);
    }

    this.providers.set(cacheKey, provider);
    return provider;
  }

  static getProvider(providerId: string): LLMProvider | undefined {
    return this.providers.get(providerId);
  }

  static removeProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  static clearProviders(): void {
    this.providers.clear();
  }
}

export type { LLMProvider, LLMConfig };
export * from './types';
