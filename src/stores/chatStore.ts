import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isError?: boolean;
  metadata?: {
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model?: string;
    duration?: number;
  };
}

interface ChatContext {
  enabled: boolean;
  file: string | null;
  code: string | null;
}

interface ChatStoreState {
  messages: ChatMessage[];
  status: 'idle' | 'loading' | 'success' | 'error' | 'streaming';
  context: ChatContext;
  config: {
    systemPrompt: string;
  };
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
  stopGeneration: () => void;
  updateContext: (context: Partial<ChatContext>) => void;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  status: 'idle',
  context: {
    enabled: false,
    file: null,
    code: null,
  },
  config: {
    systemPrompt: 'You are a helpful coding assistant.',
  },

  sendMessage: async (content: string) => {
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      status: 'loading',
      error: null,
    }));

    try {
      const state = get();
      const contextMessages: ChatMessage[] = [];

      if (state.context.enabled && (state.context.file || state.context.code)) {
        contextMessages.push({
          id: generateMessageId(),
          role: 'system',
          content: `Context - File: ${state.context.file || 'none'}${
            state.context.code ? `\nSelected code:\n${state.context.code}` : ''
          }`,
          timestamp: Date.now(),
        });
      }

      // TODO: 调用实际的 LLM API
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'AI response placeholder. Implement LLM API integration.',
        timestamp: Date.now(),
      };

      await new Promise((resolve) => setTimeout(resolve, 1000));

      set((state) => ({
        messages: [...state.messages, ...contextMessages, assistantMessage],
        status: 'success',
      }));
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Error generating response. Please try again.',
        timestamp: Date.now(),
        isError: true,
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        status: 'error',
      }));
    }
  },

  clearMessages: () => {
    set({ messages: [], status: 'idle' });
  },

  retryLastMessage: async () => {
    const state = get();
    const lastUserMessage = state.messages
      .slice()
      .reverse()
      .find((msg) => msg.role === 'user');

    if (lastUserMessage) {
      await state.sendMessage(lastUserMessage.content);
    }
  },

  stopGeneration: () => {
    set({ status: 'idle' });
  },

  updateContext: (context: Partial<ChatContext>) => {
    set((state) => ({
      context: { ...state.context, ...context },
    }));
  },
}));

export default useChatStore;
