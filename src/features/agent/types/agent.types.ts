/**
 * Agent Mode 类型定义
 */

/** Agent 状态枚举 */
export enum AgentState {
  IDLE = 'idle',
  THINKING = 'thinking',
  PLANNING = 'planning',
  EXECUTING = 'executing',
  WAITING = 'waiting',
  FINISHED = 'finished',
  ERROR = 'error',
}

/** Agent 角色类型 */
export type AgentRole = 'explore' | 'plan' | 'execute' | 'review';

/** Agent 基础接口 */
export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  state: AgentState;
  messages: AgentMessage[];
  currentTask?: AgentTask;
}

/** Agent 消息 */
export interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    agentId?: string;
    taskId?: string;
    toolName?: string;
    error?: string;
  };
}

/** Agent 任务 */
export interface AgentTask {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  steps: TaskStep[];
  result?: string;
  error?: string;
}

/** 任务步骤 */
export interface TaskStep {
  id: string;
  description: string;
  agent: AgentRole;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: any;
  output?: any;
  error?: string;
}

/** 工具接口 */
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  execute: (params: Record<string, any>) => Promise<ToolResult>;
}

/** LLM Tool (兼容 OpenAI/Anthropic) */
export interface LLMTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/** 工具参数 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

/** 工具结果 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/** Agent Orchestrator 状态 */
export interface OrchestratorState {
  currentTask?: AgentTask;
  activeAgent?: AgentRole;
  agents: Record<AgentRole, Agent>;
  state: AgentState;
  history: AgentTask[];
}

/** Agent 配置 */
export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  maxIterations: number;
}

export default AgentState;
