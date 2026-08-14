import { LLMProvider, LLMMessage, LLMOptions, LLMResponse, LLMTool, LLMModel, LLMStreamChunk } from './types';

let mockCallCounter = 0;

export class MockProvider implements LLMProvider {
  async generate(prompt: string | LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const text = typeof prompt === 'string' ? prompt : prompt[prompt.length - 1]?.content ?? '';
    return {
      content: `[Mock] Received: "${text.slice(0, 120)}". Configure a real LLM API key in Settings > API to get real responses.`,
      model: 'mock',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  async generateWithTools(
    prompt: string | LLMMessage[],
    tools: LLMTool[],
    options?: LLMOptions
  ): Promise<LLMResponse> {
    const text = typeof prompt === 'string' ? prompt : prompt[prompt.length - 1]?.content ?? '';
    const lastRole = typeof prompt === 'string' ? 'user' : prompt[prompt.length - 1]?.role;

    // 模拟工具调用循环：第一轮返回工具调用，工具结果回填后返回最终答复
    if (lastRole !== 'tool') {
      const hasReadFileTool = tools.some((t) => t.name === 'read_file');
      if (hasReadFileTool && /read|file|open/i.test(text)) {
        mockCallCounter++;
        // 从用户请求中提取文件路径（匹配常见路径形式），否则用默认路径
        const pathMatch = text.match(/(?:[A-Za-z]:[\\/]|\/)[^\s"']+\.(?:ts|tsx|js|jsx|json|md|py|css|html)/i);
        return {
          content: '',
          toolCalls: [
            {
              id: `mock-call-${mockCallCounter}`,
              name: 'read_file',
              arguments: { path: pathMatch ? pathMatch[0] : '/workspace/README.md' },
            },
          ],
          model: 'mock',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
      }
      if (tools.some((t) => t.name === 'search_code') && /search|find|lookup/i.test(text)) {
        mockCallCounter++;
        return {
          content: '',
          toolCalls: [
            {
              id: `mock-call-${mockCallCounter}`,
              name: 'search_code',
              arguments: { query: text.replace(/search|find|lookup|for|the/gi, '').trim() || 'TODO' },
            },
          ],
          model: 'mock',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
      }
    }

    return {
      content: `[Mock] Processed: "${text.slice(0, 120)}". No tool call was triggered. Configure a real LLM API key in Settings > API.`,
      model: 'mock',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  stream(
    prompt: string | LLMMessage[],
    options?: LLMOptions
  ): AsyncIterable<LLMStreamChunk> {
    const responsePromise = this.generate(prompt, options);
    return (async function* () {
      const response = await responsePromise;
      yield { type: 'content', content: response.content } as LLMStreamChunk;
      yield { type: 'done' } as LLMStreamChunk;
    })();
  }

  async getModels(): Promise<LLMModel[]> {
    return [
      { id: 'mock', name: 'Mock (no API key)', provider: 'mock', maxTokens: 2048, supportsStreaming: true, supportsToolCalling: true },
    ];
  }
}

export default MockProvider;