export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokens?: number;
    duration?: number;
    codeBlocks?: CodeBlock[];
  };
  isError?: boolean;
}

export interface CodeBlock {
  language: string;
  code: string;
  path?: string;
  range?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

export interface ChatContext {
  currentFile?: string;
  selectedCode?: string;
  cursorPosition?: {
    line: number;
    character: number;
  };
  visibleFiles?: string[];
}

export interface ChatConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  contextEnabled: boolean;
  codeSnippetEnabled: boolean;
}

export type ChatStatus = 'idle' | 'loading' | 'error' | 'streaming';

export const defaultChatConfig: ChatConfig = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: `你是一位专业的编程助手，帮助用户解答编程问题、解释代码、提供优化建议。
请用简洁清晰的语言回答，并在需要时提供代码示例。
如果用户询问特定语言的代码，请直接给出可运行的代码示例。`,
  contextEnabled: true,
  codeSnippetEnabled: true,
};
