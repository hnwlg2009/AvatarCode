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

export type ChatMode = 'build' | 'plan';
export type ChatStrength = 'default' | 'low' | 'high' | 'max';

export interface ChatAttachment {
  id: string;
  type: 'file' | 'image';
  name: string;
  path: string;
  content?: string;
  dataUrl?: string;
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
  mode: ChatMode;
  strength: ChatStrength;
  model: string | null;
  attachments: ChatAttachment[];
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
  stopGeneration: () => void;
  updateContext: (context: Partial<ChatContext>) => void;
  setMode: (mode: ChatMode) => void;
  setStrength: (strength: ChatStrength) => void;
  setModel: (model: string | null) => void;
  addAttachment: (attachment: ChatAttachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

export const STRENGTH_PRESETS: Record<
  ChatStrength,
  { maxTokens: number; temperature: number }
> = {
  default: { maxTokens: 2048, temperature: 0.7 },
  low: { maxTokens: 1024, temperature: 0.9 },
  high: { maxTokens: 4096, temperature: 0.5 },
  max: { maxTokens: 8192, temperature: 0.3 },
};

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const DEFAULT_PROVIDER = 'openai';

let activeRequestId: string | null = null;
let cancelledRequestId: string | null = null;

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
  mode: 'build',
  strength: 'default',
  model: null,
  attachments: [],

  sendMessage: async (content: string) => {
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const attachments = get().attachments;
    set((state) => ({
      messages: [...state.messages, userMessage],
      attachments: [],
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

      // 附件内容注入（文件全文 + 图片说明）
      if (attachments.length > 0) {
        const parts = attachments.map((att) => {
          if (att.type === 'image') {
            return `[Image attachment: ${att.name} (${att.path})]`;
          }
          return `[File: ${att.path}]\n${att.content ?? ''}`;
        });
        contextMessages.push({
          id: generateMessageId(),
          role: 'system',
          content: `Attached materials:\n${parts.join('\n\n---\n\n')}`,
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

      const requestId = crypto.randomUUID();
      activeRequestId = requestId;

      // 模式决定 system prompt：plan 只做分析与方案，不修改文件/执行命令
      const systemPrompt =
        state.mode === 'plan'
          ? 'You are a planning assistant. Analyze the request and provide a detailed plan. Do NOT modify files and do NOT execute commands — read-only analysis mode.'
          : state.config.systemPrompt;

      const preset = STRENGTH_PRESETS[state.strength];

      const llmMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...contextMessages.map((m) => ({ role: m.role as 'system', content: m.content })),
        ...state.messages
          .filter((m) => m.role !== 'system')
          .slice(-20)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      const result = await api.generate(DEFAULT_PROVIDER, llmMessages, {
        model: state.model ?? undefined,
        temperature: preset.temperature,
        maxTokens: preset.maxTokens,
        requestId,
        timeoutMs: 300000,
      });
      if (activeRequestId === requestId) {
        activeRequestId = null;
      }

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: result.content || '',
        timestamp: Date.now(),
        metadata: {
          model: result.model || state.model || undefined,
          duration: Date.now() - startedAt,
        },
      };

      set((state) => ({
        messages: [...state.messages, ...contextMessages, assistantMessage],
        status: 'success',
      }));
    } catch (error) {
      const requestId = activeRequestId;
      activeRequestId = null;

      // 手动停止的请求：静默丢弃，不追加错误消息
      if (requestId && requestId === cancelledRequestId) {
        cancelledRequestId = null;
        return;
      }

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
    // 真正取消主进程在途请求，避免结果稍后仍被追加进对话
    if (activeRequestId) {
      cancelledRequestId = activeRequestId;
      window.electronAPI?.llm?.cancel(activeRequestId).catch(() => {});
      activeRequestId = null;
    }
    set({ status: 'idle' });
  },

  updateContext: (context: Partial<ChatContext>) => {
    set((state) => ({ context: { ...state.context, ...context } }));
  },

  setMode: (mode: ChatMode) => {
    set({ mode });
  },

  setStrength: (strength: ChatStrength) => {
    set({ strength });
  },

  setModel: (model: string | null) => {
    set({ model });
  },

  addAttachment: (attachment: ChatAttachment) => {
    set((state) => ({ attachments: [...state.attachments, attachment] }));
  },

  removeAttachment: (id: string) => {
    set((state) => ({
      attachments: state.attachments.filter((att) => att.id !== id),
    }));
  },

  clearAttachments: () => {
    set({ attachments: [] });
  },
}));

export default useChatStore;
