import { Tool, ToolResult } from './types/agent.types';

/**
 * 工具管理器
 * 负责工具的注册、验证、执行、权限控制
 */
export class ToolManager {
  private tools: Map<string, Tool> = new Map();

  /**
   * 注册工具
   */
  registerTool(tool: Tool): void {
    if (!tool.name || !tool.description) {
      throw new Error('工具必须有 name 和 description');
    }
    this.tools.set(tool.name, tool);
    console.log(`工具已注册：${tool.name}`);
  }

  /**
   * 获取工具
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * 执行工具
   */
  async executeTool(name: string, params: Record<string, any>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `工具不存在：${name}`,
      };
    }

    try {
      const result = await tool.execute(params);
      console.log(`工具执行成功：${name}`);
      return result;
    } catch (error: any) {
      console.error(`工具执行失败：${name}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取可用工具列表
   */
  getAvailableTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取工具描述
   */
  getToolDescriptions(): string {
    return this.getAvailableTools()
      .map((tool: any) => {
        const params = (tool.parameters as any).properties || {};
        const paramDesc = Object.entries(params)
          .map(
            ([key, value]: [string, any]) =>
              `    ${key}: ${value.type}${value.required ? ' (required)' : ''} - ${value.description || ''}`
          )
          .join('\n');

        return `${tool.name}: ${tool.description}\n    Parameters:\n${paramDesc || '    None'}`;
      })
      .join('\n\n');
  }

  /**
   * 移除工具
   */
  removeTool(name: string): void {
    this.tools.delete(name);
  }

  /**
   * 清空所有工具
   */
  clearTools(): void {
    this.tools.clear();
  }
}

export default ToolManager;
