import { LLMProvider } from './types';
import type { LLMConfig } from './types';
import { IPCLLMProvider } from './IPCLLMProvider';
import { MockProvider } from './MockProvider';

export class LLMFactory {
  private static providers: Map<string, LLMProvider> = new Map();

  static createProvider(config: LLMConfig): LLMProvider {
    if (config.provider === 'mock') {
      return this.createMockProvider();
    }

    const cacheKey = `${config.provider}-${config.model || 'default'}`;

    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!;
    }

    const provider = new IPCLLMProvider({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
    });

    this.providers.set(cacheKey, provider);
    return provider;
  }

  static createMockProvider(): LLMProvider {
    // Mock 不缓存，避免状态共享
    return new MockProvider();
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

export default LLMFactory;