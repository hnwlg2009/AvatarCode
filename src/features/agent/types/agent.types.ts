import type { LLMProvider, LLMTool, LLMToolCall } from '../llm/types';

export enum AgentState {
  IDLE = 'idle',
  PLANNING = 'planning',
  EXECUTING = 'executing',
  REVIEWING = 'reviewing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export enum AgentType {
  EXPLORE = 'explore',
  PLAN = 'plan',
  EXECUTE = 'execute',
  REVIEW = 'review',
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  agentType?: AgentType;
  toolCalls?: LLMToolCall[];
  toolResult?: ToolResult;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: LLMTool['parameters'];
  execute: (args: Record<string, any>) => Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  success: boolean;
  result: any;
  error?: string;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agentType: AgentType;
  dependencies?: string[];
  result?: any;
  error?: string;
}

export interface AgentPlan {
  id: string;
  title: string;
  tasks: AgentTask[];
  status: 'draft' | 'approved' | 'executing' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export interface AgentContext {
  rootPath: string;
  llm: LLMProvider;
  toolManager: ToolManagerLike;
  onMessage: (message: AgentMessage) => void;
}

export interface ToolManagerLike {
  getAllTools(): Tool[];
  toLLMToolSchema(): LLMTool[];
  executeTool(name: string, args: Record<string, any>): Promise<ToolExecutionResult>;
}

export interface Agent {
  type: AgentType;
  systemPrompt: string;
  run(context: AgentContext, input: string): Promise<string>;
}

export interface AgentRunEvent {
  type: 'stateChanged' | 'toolStarted' | 'toolFinished' | 'messageGathered';
  state?: AgentState;
  toolCall?: LLMToolCall;
  toolResult?: ToolExecutionResult;
  message?: AgentMessage;
}

export type { LLMProvider, LLMTool, LLMToolCall };