import { LLMProvider } from './types';
import type { LLMConfig } from './types';
import { LLMFactory } from './LLMFactory';

export { LLMFactory };
export type { LLMProvider, LLMConfig };
export * from './types';

export function createProvider(config: LLMConfig): LLMProvider {
  return LLMFactory.createProvider(config);
}

export function createMockProvider(): LLMProvider {
  return LLMFactory.createMockProvider();
}