import { create } from 'zustand';
import type { AgentMessage, AgentPlan, LLMTool } from '../features/agent/types/agent.types';
import { AgentOrchestrator } from '../features/agent/AgentOrchestrator';
import { LLMFactory } from '../features/agent/llm/LLMFactory';
import {
  fileTool,
  writeFileTool,
  searchTool,
  editorTool,
  terminalTool,
  listFilesTool,
  readDirTool,
} from '../features/agent/tools';
import type { AgentRunEvent, ToolExecutionResult } from '../features/agent/types/agent.types';
import { useSettingsStore } from './settingsStore';

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolStatus {
  name: string;
  args: Record<string, any>;
  status: 'running' | 'done' | 'error';
  duration?: number;
  error?: string;
}

export type AgentStatus = 'idle' | 'loading' | 'executing' | 'error';

export interface PendingApproval {
  nonce: string;
  command: string;
}

interface AgentState {
  messages: AgentMessage[];
  status: AgentStatus;
  currentTask: string | null;
  plan: AgentPlan | null;
  tools: AgentTool[];
  toolStatus: ToolStatus[];
  pendingApproval: PendingApproval | null;
  error: string | null;

  // Actions
  addMessage: (message: Omit<AgentMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<AgentMessage>) => void;
  clearMessages: () => void;
  setStatus: (status: AgentStatus) => void;
  setCurrentTask: (task: string | null) => void;
  setError: (error: string | null) => void;
  setTools: (tools: AgentTool[]) => void;
  setPlan: (plan: AgentPlan | null) => void;
  setToolStatus: (toolStatus: ToolStatus[]) => void;
  sendMessage: (content: string) => Promise<void>;
  stopExecution: () => void;
  approvePendingCommand: () => Promise<void>;
  denyPendingCommand: () => Promise<void>;
}

const defaultTools: AgentTool[] = [
  { name: 'read_file', description: 'Read the content of a file', parameters: fileTool.parameters },
  { name: 'write_file', description: 'Write content to a file', parameters: writeFileTool.parameters },
  { name: 'execute_command', description: 'Execute a shell command', parameters: terminalTool.parameters },
  { name: 'search_code', description: 'Search code in the project', parameters: searchTool.parameters },
  { name: 'editor_action', description: 'Open or focus a file', parameters: editorTool.parameters },
  { name: 'list_files', description: 'List files and directories in a directory', parameters: listFilesTool.parameters },
  { name: 'read_dir', description: 'Read the entries of a directory', parameters: readDirTool.parameters },
];

let orchestrator: AgentOrchestrator | null = null;
let abortController: AbortController | null = null;

function getOrchestrator(): AgentOrchestrator {
  if (!orchestrator) {
    orchestrator = new AgentOrchestrator();
    orchestrator.getToolManager().registerTool(fileTool);
    orchestrator.getToolManager().registerTool(writeFileTool);
    orchestrator.getToolManager().registerTool(searchTool);
    orchestrator.getToolManager().registerTool(editorTool);
    orchestrator.getToolManager().registerTool(terminalTool);
    orchestrator.getToolManager().registerTool(listFilesTool);
    orchestrator.getToolManager().registerTool(readDirTool);
  }
  return orchestrator;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: [],
  status: 'idle',
  currentTask: null,
  plan: null,
  tools: defaultTools,
  toolStatus: [],
  pendingApproval: null,
  error: null,

  addMessage: (message) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      messages: [...state.messages, { ...message, id, timestamp: Date.now() }],
    }));
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },

  clearMessages: () => set({ messages: [], toolStatus: [], plan: null, error: null, status: 'idle', pendingApproval: null }),

  setStatus: (status) => set({ status }),

  setCurrentTask: (task) => set({ currentTask: task }),

  setError: (error) => set({ error }),

  setTools: (tools) => set({ tools }),

  setPlan: (plan) => set({ plan }),

  setToolStatus: (toolStatus) => set({ toolStatus }),

  sendMessage: async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || get().status === 'executing' || get().status === 'loading') return;

    set({
      status: 'executing',
      currentTask: trimmed.slice(0, 60),
      error: null,
      toolStatus: [],
    });

    abortController = new AbortController();

    const engine = getOrchestrator();
    const unsubscribe = engine.onEvent((event: AgentRunEvent) => {
      const state = get();
      if (event.type === 'toolStarted' && event.toolCall) {
        set({
          toolStatus: [
            ...state.toolStatus,
            {
              name: event.toolCall.name,
              args: event.toolCall.arguments,
              status: 'running',
            },
          ],
        });

        // 命令工具：同步挂起审批（与工具内部 dedupe 同 nonce）
        if (event.toolCall.name === 'execute_command') {
          const command = String(event.toolCall.arguments?.command ?? '');
          window.electronAPI?.command?.requestApproval(command).then(
            ({ nonce }) => {
              const latest = get();
              if (latest.toolStatus.some((t) => t.name === 'execute_command' && t.status === 'running')) {
                set({ pendingApproval: { nonce, command } });
              }
            },
            () => {}
          );
        }
      } else if (event.type === 'toolFinished' && event.toolCall) {
        const updated = state.toolStatus.map((t) =>
          t.name === event.toolCall!.name
            ? {
                ...t,
                status: event.toolResult?.success === false ? ('error' as const) : ('done' as const),
                error: event.toolResult?.error,
              }
            : t
        );
        set({ toolStatus: updated, pendingApproval: null });
      }
    });

    try {
      // 自动选择 LLM provider：有已配置的 key 用真实 provider，否则回退 mock
      let provider = 'openai';
      try {
        const hasKey = await window.electronAPI?.llm?.hasAPIKey('openai');
        if (!hasKey) {
          provider = 'mock';
        }
      } catch {
        provider = 'mock';
      }

      const rootPath = useSettingsStore.getState().workspacePath || '/workspace';

      // 授权 agent 可访问的工作区路径
      try {
        await window.electronAPI?.file?.addWorkspacePath(rootPath);
      } catch {
        // 忽略授权失败，工具执行时仍会受主进程路径安全校验约束
      }

      // 监听中断：AbortSignal 传给 run 循环（一期以信号量跳过下一轮）
      const runPromise = engine.run(trimmed, {
        rootPath,
        llm: LLMFactory.createProvider({ provider: provider as 'mock' | 'openai' | 'anthropic' }),
        onMessage: (message) => {
          set((state) => ({
            messages: [...state.messages, message],
          }));
        },
      });

      abortController.signal.addEventListener('abort', () => {
        // 无法强制中断 fetch，标记状态恢复 idle；下一轮 tool-calling 由轮次上限兜底
        set({ status: 'idle', currentTask: null, pendingApproval: null });
      });

      await runPromise;
      set({ status: 'idle', currentTask: null, pendingApproval: null });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        currentTask: null,
      });
    } finally {
      unsubscribe();
      abortController = null;
    }
  },

  stopExecution: () => {
    abortController?.abort();
    set({ status: 'idle', currentTask: null, pendingApproval: null });
  },

  approvePendingCommand: async () => {
    const pending = get().pendingApproval;
    if (!pending) return;
    await window.electronAPI?.command?.decideApproval(pending.nonce, true);
    set({ pendingApproval: null });
  },

  denyPendingCommand: async () => {
    const pending = get().pendingApproval;
    if (!pending) return;
    await window.electronAPI?.command?.decideApproval(pending.nonce, false);
    set({ pendingApproval: null });
  },
}));

export default useAgentStore;