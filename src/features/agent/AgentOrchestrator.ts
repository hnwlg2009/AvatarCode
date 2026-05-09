import {
  Agent,
  AgentState,
  AgentRole,
  AgentTask,
  TaskStep,
  AgentMessage,
  OrchestratorState,
  Tool,
  LLMTool,
} from './types/agent.types';
import { LLMFactory, LLMProvider, LLMConfig, LLMMessage } from './llm/LLMFactory';

export class AgentOrchestrator {
  private agents: Record<AgentRole, Agent>;
  private tools: Map<string, Tool> = new Map();
  private llmProvider: LLMProvider | null = null;
  private history: AgentTask[] = [];

  constructor(config?: LLMConfig) {
    this.agents = {
      explore: this.createAgent('explore', 'Explore Agent', '代码库分析专家'),
      plan: this.createAgent('plan', 'Plan Agent', '任务规划专家'),
      execute: this.createAgent('execute', 'Execute Agent', '代码执行专家'),
      review: this.createAgent('review', 'Review Agent', '代码审查专家'),
    };

    if (config) {
      this.llmProvider = LLMFactory.createProvider(config);
    }
  }

  private createAgent(role: AgentRole, name: string, description: string): Agent {
    return {
      id: role,
      role,
      name,
      description,
      state: AgentState.IDLE,
      messages: [],
    };
  }

  initializeLLM(config: LLMConfig): void {
    this.llmProvider = LLMFactory.createProvider(config);
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async startTask(taskDescription: string): Promise<AgentTask> {
    const task: AgentTask = {
      id: `task-${Date.now()}`,
      description: taskDescription,
      status: 'in-progress',
      steps: [],
      result: '',
    };

    try {
      const exploreResult = await this.executeAgent('explore', `分析：${taskDescription}`);
      const planResult = await this.executeAgent(
        'plan',
        `计划：${taskDescription}\n分析：${exploreResult}`
      );
      task.steps = this.parsePlanToSteps(planResult);

      for (const step of task.steps) {
        step.status = 'running';
        try {
          const stepResult = await this.executeAgent('execute', `执行：${step.description}`);
          step.input = stepResult;
          step.status = 'completed';
        } catch (error: any) {
          step.error = error.message;
          step.status = 'failed';
        }
      }

      const reviewResult = await this.executeAgent('review', `审查：${taskDescription}`);
      task.result = reviewResult;
      task.status = 'completed';
      this.history.push(task);
      return task;
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      throw error;
    }
  }

  private async executeAgent(role: AgentRole, prompt: string): Promise<string> {
    const agent = this.agents[role];
    agent.state = AgentState.EXECUTING;

    try {
      if (!this.llmProvider) {
        return `[${role}] ${prompt} (LLM 未初始化)`;
      }

      const tools: LLMTool[] = Array.from(this.tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }));

      const messages: LLMMessage[] = [
        { role: 'system', content: `你是 ${agent.name} - ${agent.description}` },
        { role: 'user', content: prompt },
      ];

      let response;
      if (this.llmProvider.generateWithTools) {
        response = await this.llmProvider.generateWithTools(messages, tools);
      } else {
        response = await this.llmProvider.generate(messages);
      }

      const agentMessage: AgentMessage = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        content: response.content,
        timestamp: Date.now(),
        metadata: { agentId: agent.id },
      };
      agent.messages.push(agentMessage);

      return response.content;
    } finally {
      agent.state = AgentState.IDLE;
    }
  }

  private parsePlanToSteps(plan: string): TaskStep[] {
    const lines = plan.split('\n').filter((line) => line.trim());
    return lines.map((line, index) => ({
      id: `step-${index}`,
      description: line,
      agent: 'execute' as AgentRole,
      status: 'pending' as TaskStep['status'],
    }));
  }

  getState(): OrchestratorState {
    return {
      agents: { ...this.agents },
      state: AgentState.IDLE,
      history: [...this.history],
    };
  }

  reset(): void {
    Object.values(this.agents).forEach((agent) => {
      agent.state = AgentState.IDLE;
    });
  }
}
