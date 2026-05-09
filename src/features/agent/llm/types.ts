export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  model?: string;
  stream?: boolean;
}

export interface LLMTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface LLMResponse {
  content: string;
  toolCalls?: LLMToolCall[];
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  generate(prompt: string | LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  generateWithTools?(
    prompt: string | LLMMessage[],
    tools: LLMTool[],
    options?: LLMOptions
  ): Promise<LLMResponse>;
  getModels(): Promise<LLMModel[]>;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
}
