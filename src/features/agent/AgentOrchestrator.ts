import { AgentState, AgentType, AgentTask, AgentPlan, AgentMessage, AgentRunEvent } from './types/agent.types';
import type { LLMMessage, LLMToolCall } from './llm/types';
import { ToolManager } from './ToolManager';

const MAX_ITERATIONS = 20;

export class AgentOrchestrator {
  private state: AgentState = AgentState.IDLE;
  private currentPlan: AgentPlan | null = null;
  private toolManager: ToolManager;
  private listeners: ((event: AgentRunEvent) => void)[] = [];
  private messages: AgentMessage[] = [];

  constructor() {
    this.toolManager = new ToolManager();
  }

  getState(): AgentState {
    return this.state;
  }

  setState(state: AgentState): void {
    this.state = state;
    this.emit({ type: 'stateChanged', state });
  }

  onEvent(listener: (event: AgentRunEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getToolManager(): ToolManager {
    return this.toolManager;
  }

  getMessages(): AgentMessage[] {
    return this.messages;
  }

  private emit(event: AgentRunEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  private toLLMMessages(): LLMMessage[] {
    return this.messages
      .filter((m) => m.role !== 'tool' || m.toolResult)
      .map((m) => {
        if (m.role === 'tool' && m.toolResult) {
          const toolCall = m.toolCalls?.[0];
          return {
            role: 'tool' as const,
            content: m.toolResult.result
              ? typeof m.toolResult.result === 'string'
                ? m.toolResult.result
                : JSON.stringify(m.toolResult.result)
              : (m.toolResult.error ?? ''),
            name: toolCall?.name,
            toolCallId: m.toolResult.toolCallId || toolCall?.id,
          };
        }
        if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
          return {
            role: 'assistant' as const,
            content: m.content || '',
            toolCalls: m.toolCalls,
          };
        }
        return { role: m.role as 'user' | 'assistant' | 'system', content: m.content };
      });
  }

  async run(
    input: string,
    context: {
      rootPath: string;
      llm: import('./llm/types').LLMProvider;
      onMessage: (message: AgentMessage) => void;
    }
  ): Promise<string> {
    this.setState(AgentState.EXECUTING);
    this.messages = [];

    const userMessage: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    this.messages.push(userMessage);
    context.onMessage(userMessage);

    try {
      let finalContent = '';

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const response = await context.llm.generateWithTools!(
          this.toLLMMessages(),
          this.toolManager.toLLMToolSchema()
        );

        if (!response.toolCalls || response.toolCalls.length === 0) {
          finalContent = response.content || '';
          const assistantMessage: AgentMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: finalContent,
            timestamp: Date.now(),
          };
          this.messages.push(assistantMessage);
          context.onMessage(assistantMessage);
          this.setState(AgentState.COMPLETED);
          return finalContent;
        }

        const assistantToolMessage: AgentMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: response.content || '',
          timestamp: Date.now(),
          toolCalls: response.toolCalls,
        };
        this.messages.push(assistantToolMessage);
        context.onMessage(assistantToolMessage);

        for (const toolCall of response.toolCalls) {
          this.emit({ type: 'toolStarted', toolCall });

          const result = await this.toolManager.executeTool(toolCall.name, toolCall.arguments);

          this.emit({
            type: 'toolFinished',
            toolCall,
            toolResult: result,
          });

          const toolResultMessage: AgentMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'tool',
            content: '',
            timestamp: Date.now(),
            toolCalls: [toolCall],
            toolResult: {
              toolCallId: toolCall.id,
              result: result.result,
              error: result.error,
            },
          };
          this.messages.push(toolResultMessage);
        }
      }

      finalContent = 'Reached maximum tool-call iterations without a final answer.';
      const assistantMessage: AgentMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: finalContent,
        timestamp: Date.now(),
      };
      this.messages.push(assistantMessage);
      context.onMessage(assistantMessage);
      this.setState(AgentState.COMPLETED);
      return finalContent;
    } catch (error) {
      this.setState(AgentState.ERROR);
      const errorMessage: AgentMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
      };
      this.messages.push(errorMessage);
      context.onMessage(errorMessage);
      throw error;
    }
  }

  // --- Legacy plan API (kept for compatibility) ---

  async createPlan(title: string, tasks: Omit<AgentTask, 'id' | 'status'>[]): Promise<AgentPlan> {
    const plan: AgentPlan = {
      id: `plan-${Date.now()}`,
      title,
      tasks: tasks.map((task, index) => ({
        ...task,
        id: `task-${Date.now()}-${index}`,
        status: 'pending',
      })),
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.currentPlan = plan;
    return plan;
  }

  async approvePlan(planId: string): Promise<void> {
    if (this.currentPlan && this.currentPlan.id === planId) {
      this.currentPlan.status = 'approved';
      this.currentPlan.updatedAt = Date.now();
    }
  }

  async executePlan(planId: string): Promise<void> {
    if (!this.currentPlan || this.currentPlan.id !== planId) {
      throw new Error('Plan not found');
    }

    this.setState(AgentState.EXECUTING);
    this.currentPlan.status = 'executing';
    this.currentPlan.updatedAt = Date.now();

    for (const task of this.currentPlan.tasks) {
      if (task.status === 'pending') {
        task.status = 'in_progress';
        try {
          task.status = 'completed';
        } catch (error) {
          task.status = 'failed';
          task.error = error instanceof Error ? error.message : String(error);
        }
        this.currentPlan.updatedAt = Date.now();
      }
    }

    this.currentPlan.status = 'completed';
    this.setState(AgentState.COMPLETED);
  }

  getCurrentPlan(): AgentPlan | null {
    return this.currentPlan;
  }
}

export default AgentOrchestrator;