import { Agent, AgentState, AgentMessage, TaskStep } from '../types/agent.types';

interface Plan {
  steps: PlanStep[];
  estimatedTime: number;
  complexity: 'low' | 'medium' | 'high';
}

interface PlanStep {
  id: string;
  description: string;
  agent: 'explore' | 'plan' | 'execute' | 'review';
  estimatedTime: number;
}

/**
 * Plan Agent - 任务规划专家
 * 负责将复杂任务分解为可执行的步骤
 */
export class PlanAgent {
  private agent: Agent;

  constructor() {
    this.agent = {
      id: 'plan',
      role: 'plan',
      name: 'Plan Agent',
      description: '任务规划专家',
      state: AgentState.IDLE,
      messages: [],
    };
  }

  /**
   * 制定任务计划
   */
  async createPlan(taskDescription: string, context?: any): Promise<Plan> {
    this.agent.state = AgentState.PLANNING;
    this.addSystemMessage(`开始制定计划：${taskDescription}`);

    try {
      // 1. 理解任务目标
      const goal = this.understandTask(taskDescription);

      // 2. 分解任务为步骤
      const steps = await this.decomposeTask(goal, context);

      // 3. 评估复杂度
      const complexity = this.assessComplexity(steps);

      // 4. 估算时间
      const estimatedTime = this.estimateTime(steps);

      const plan: Plan = { steps, estimatedTime, complexity };

      this.agent.state = AgentState.IDLE;
      this.addSystemMessage(`计划制定完成：${steps.length} 个步骤`);

      return plan;
    } catch (error: any) {
      this.agent.state = AgentState.ERROR;
      this.addSystemMessage(`计划失败：${error.message}`);
      throw error;
    }
  }

  private understandTask(description: string): string {
    // TODO: 使用 LLM 理解任务
    return description;
  }

  private async decomposeTask(goal: string, context?: any): Promise<PlanStep[]> {
    // TODO: 使用 LLM 分解任务
    return [];
  }

  private assessComplexity(steps: PlanStep[]): 'low' | 'medium' | 'high' {
    if (steps.length <= 3) return 'low';
    if (steps.length <= 10) return 'medium';
    return 'high';
  }

  private estimateTime(steps: PlanStep[]): number {
    return steps.reduce((sum, step) => sum + step.estimatedTime, 0);
  }

  private addSystemMessage(content: string): void {
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content,
      timestamp: Date.now(),
    };
    this.agent.messages.push(message);
  }

  getAgent(): Agent {
    return { ...this.agent };
  }

  reset(): void {
    this.agent.messages = [];
    this.agent.state = AgentState.IDLE;
  }
}

export default PlanAgent;
