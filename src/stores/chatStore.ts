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

const DEFAULT_PROVIDER = 'openai';

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
    }));

    const startedAt = Date.now();

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

      const api = window.electronAPI?.llm;
      if (!api) {
        throw new Error('Electron LLM API is not available. Run inside the desktop app.');
      }

      const hasKey = await api.hasAPIKey(DEFAULT_PROVIDER);
      if (!hasKey) {
        throw new Error(
          `No ${DEFAULT_PROVIDER} API key configured. Add one in Settings > API.`
        );
      }

      const llmMessages = [
        { role: 'system' as const, content: state.config.systemPrompt },
        ...contextMessages.map((m) => ({ role: m.role as 'system', content: m.content })),
        ...state.messages
          .filter((m) => m.role !== 'system')
          .slice(-20)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      const result = await api.generate(DEFAULT_PROVIDER, llmMessages, {
        temperature: 0.7,
        maxTokens: 2048,
      });

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: result.content || '',
        timestamp: Date.now(),
        metadata: {
          model: result.model,
          duration: Date.now() - startedAt,
        },
      };

      set((state) => ({
        messages: [...state.messages, ...contextMessages, assistantMessage],
        status: 'success',
      }));
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Error generating response.',
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