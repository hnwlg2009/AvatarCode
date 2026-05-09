import { Agent, AgentState, AgentMessage } from '../types/agent.types';

interface CodeReview {
  overall: {
    score: number; // 0-100
    summary: string;
  };
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  positivePoints: string[];
}

interface CodeIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  category: 'bug' | 'security' | 'performance' | 'style' | 'maintainability';
  location: {
    file: string;
    line?: number;
    column?: number;
  };
  description: string;
  suggestion: string;
  codeSnippet?: string;
}

interface CodeSuggestion {
  id: string;
  category: 'refactor' | 'optimize' | 'enhance';
  description: string;
  example?: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Review Agent - 代码审查专家
 * 负责代码质量评估、问题发现、改进建议
 */
export class ReviewAgent {
  private agent: Agent;

  constructor() {
    this.agent = {
      id: 'review',
      role: 'review',
      name: 'Review Agent',
      description: '代码审查专家',
      state: AgentState.IDLE,
      messages: [],
    };
  }

  /**
   * 审查代码
   */
  async reviewCode(files: Array<{ path: string; content: string }>): Promise<CodeReview> {
    this.agent.state = AgentState.THINKING;
    this.addSystemMessage(`开始审查 ${files.length} 个文件`);

    try {
      const issues: CodeIssue[] = [];
      const suggestions: CodeSuggestion[] = [];
      const positivePoints: string[] = [];

      // 1. 逐个文件审查
      for (const file of files) {
        const review = await this.reviewSingleFile(file.path, file.content);
        issues.push(...review.issues);
        suggestions.push(...review.suggestions);
        positivePoints.push(...review.positivePoints);
      }

      // 2. 计算总体评分
      const score = this.calculateScore(issues, suggestions);
      const summary = this.generateSummary(score, issues, suggestions);

      const result: CodeReview = {
        overall: { score, summary },
        issues,
        suggestions,
        positivePoints,
      };

      this.agent.state = AgentState.IDLE;
      this.addSystemMessage(`审查完成：发现 ${issues.length} 个问题`);

      return result;
    } catch (error: any) {
      this.agent.state = AgentState.ERROR;
      this.addSystemMessage(`审查失败：${error.message}`);
      throw error;
    }
  }

  private async reviewSingleFile(
    path: string,
    content: string
  ): Promise<{
    issues: CodeIssue[];
    suggestions: CodeSuggestion[];
    positivePoints: string[];
  }> {
    // TODO: 使用 LLM 进行代码审查
    // 这里应该集成 LLM Providers

    // 示例实现
    return {
      issues: this.checkBasicIssues(path, content),
      suggestions: [],
      positivePoints: [],
    };
  }

  private checkBasicIssues(path: string, content: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    // 1. 检查文件长度
    if (lines.length > 500) {
      issues.push({
        id: `issue-${Date.now()}-1`,
        severity: 'minor',
        category: 'maintainability',
        location: { file: path },
        description: '文件过长，建议拆分为更小的模块',
        suggestion: '将文件拆分为多个职责单一的模块',
      });
    }

    // 2. 检查行长度
    const longLines = lines.filter((line) => line.length > 120);
    if (longLines.length > 0) {
      issues.push({
        id: `issue-${Date.now()}-2`,
        severity: 'minor',
        category: 'style',
        location: { file: path, line: lines.indexOf(longLines[0]) + 1 },
        description: '存在过长的代码行',
        suggestion: '将长行拆分为多行，提高可读性',
      });
    }

    // 3. 检查 console.log (仅 TypeScript/JavaScript)
    if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js')) {
      if (content.includes('console.log')) {
        issues.push({
          id: `issue-${Date.now()}-3`,
          severity: 'minor',
          category: 'style',
          location: { file: path },
          description: '代码中包含 console.log',
          suggestion: '生产代码应移除 console.log，使用日志库替代',
        });
      }
    }

    // 4. 检查 TODO/FIXME 注释
    if (content.includes('TODO') || content.includes('FIXME')) {
      issues.push({
        id: `issue-${Date.now()}-4`,
        severity: 'minor',
        category: 'maintainability',
        location: { file: path },
        description: '代码中包含 TODO/FIXME 注释',
        suggestion: '尽快处理待办事项',
      });
    }

    return issues;
  }

  private calculateScore(issues: CodeIssue[], suggestions: CodeSuggestion[]): number {
    let score = 100;

    // 扣分规则
    issues.forEach((issue) => {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'major':
          score -= 10;
          break;
        case 'minor':
          score -= 3;
          break;
      }
    });

    suggestions.forEach((suggestion) => {
      if (suggestion.impact === 'high') score -= 5;
      else if (suggestion.impact === 'medium') score -= 2;
    });

    return Math.max(0, Math.min(100, score));
  }

  private generateSummary(
    score: number,
    issues: CodeIssue[],
    suggestions: CodeSuggestion[]
  ): string {
    if (score >= 90) {
      return '代码质量优秀，只有少量改进空间';
    } else if (score >= 70) {
      return '代码质量良好，存在一些需要改进的问题';
    } else if (score >= 50) {
      return '代码质量一般，建议关注主要问题';
    } else {
      return '代码质量较差，需要大量改进';
    }
  }

  private addSystemMessage(content: string): void {
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content,
      timestamp: Date.now(),
      metadata: { agentId: 'review' },
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

export default ReviewAgent;
