import { Agent, AgentState, AgentMessage } from '../types/agent.types';
import { ToolManager } from '../ToolManager';

interface CodeGeneration {
  filePath: string;
  content: string;
  language: string;
  description: string;
}

interface ExecutionResult {
  success: boolean;
  files: CodeGeneration[];
  message?: string;
  error?: string;
}

/**
 * Execute Agent - 代码执行专家
 * 负责代码生成、文件修改、代码测试
 */
export class ExecuteAgent {
  private agent: Agent;
  private toolManager: ToolManager;

  constructor(toolManager: ToolManager) {
    this.toolManager = toolManager;
    this.agent = {
      id: 'execute',
      role: 'execute',
      name: 'Execute Agent',
      description: '代码执行专家',
      state: AgentState.IDLE,
      messages: [],
    };
  }

  /**
   * 执行代码生成任务
   */
  async executeTask(taskDescription: string, plan: any): Promise<ExecutionResult> {
    this.agent.state = AgentState.EXECUTING;
    this.addSystemMessage(`开始执行：${taskDescription}`);

    try {
      // 1. 解析计划
      const steps = this.parsePlan(plan);

      // 2. 逐步执行
      const results: CodeGeneration[] = [];
      for (const step of steps) {
        const result = await this.executeStep(step);
        if (result) results.push(result);
      }

      this.agent.state = AgentState.IDLE;
      this.addSystemMessage(`执行完成：生成 ${results.length} 个文件`);

      return {
        success: true,
        files: results,
        message: `Successfully generated ${results.length} files`,
      };
    } catch (error: any) {
      this.agent.state = AgentState.ERROR;
      this.addSystemMessage(`执行失败：${error.message}`);
      return {
        success: false,
        files: [],
        error: error.message,
      };
    }
  }

  private parsePlan(plan: any): any[] {
    // TODO: 解析计划步骤
    return [];
  }

  private async executeStep(step: any): Promise<CodeGeneration | null> {
    // 1. 使用 LLM 生成代码
    const code = await this.generateCode(step);

    // 2. 写入文件
    if (code.filePath && code.content) {
      await this.writeToFile(code.filePath, code.content);
    }

    return code;
  }

  private async generateCode(step: any): Promise<CodeGeneration> {
    // TODO: 调用 LLM 生成代码
    // 通过 AgentOrchestrator 调用 LLMProvider
    return {
      filePath: '',
      content: '',
      language: 'typescript',
      description: '',
    };
  }

  private async writeToFile(filePath: string, content: string): Promise<boolean> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return false;
    }

    try {
      await window.electronAPI.writeFile(filePath, content);
      this.addSystemMessage(`文件已写入：${filePath}`);
      return true;
    } catch (error: any) {
      this.addSystemMessage(`写入文件失败：${error.message}`);
      return false;
    }
  }

  /**
   * 修改现有文件
   */
  async modifyFile(filePath: string, modifications: string): Promise<boolean> {
    this.addSystemMessage(`修改文件：${filePath}`);

    try {
      // 1. 读取原文件
      const originalContent = await window.electronAPI?.readFile(filePath);
      if (!originalContent) return false;

      // 2. 应用修改 (使用 LLM)
      const modifiedContent = await this.applyModifications(originalContent, modifications);

      // 3. 写入修改后的内容
      await window.electronAPI?.writeFile(filePath, modifiedContent);

      this.addSystemMessage(`文件修改完成：${filePath}`);
      return true;
    } catch (error: any) {
      this.addSystemMessage(`修改文件失败：${error.message}`);
      return false;
    }
  }

  private async applyModifications(original: string, modifications: string): Promise<string> {
    // TODO: 调用 LLM 应用修改
    return original;
  }

  /**
   * 运行测试
   */
  async runTests(testCommand: string): Promise<{ passed: boolean; output: string }> {
    this.addSystemMessage(`运行测试：${testCommand}`);

    // TODO: 使用 TerminalTool 运行测试命令
    return {
      passed: true,
      output: 'Tests not yet implemented',
    };
  }

  private addSystemMessage(content: string): void {
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content,
      timestamp: Date.now(),
      metadata: { agentId: 'execute' },
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

export default ExecuteAgent;
