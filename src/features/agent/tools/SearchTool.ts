import { Tool, ToolExecutionResult } from '../types/agent.types';
import fileSystemService from '../../../services/FileSystemService';

export const searchTool: Tool = {
  name: 'search_code',
  description: 'Search for a keyword across source files in the project',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query (case-insensitive)' },
      path: { type: 'string', description: 'Directory to search in (optional, defaults to project root)' },
    },
    required: ['query'],
  },
  async execute(args: Record<string, any>): Promise<ToolExecutionResult> {
    const query = args.query as string;
    if (!query || typeof query !== 'string') {
      return { success: false, result: null, error: 'Missing required argument: query' };
    }

    try {
      const matches = await fileSystemService.searchCode(query, args.path as string | undefined);
      if (!matches || matches.length === 0) {
        return { success: true, result: `No matches found for "${query}"` };
      }
      const formatted = matches
        .map((m) => `${m.path}:${m.line}: ${m.snippet}`)
        .join('\n');
      return { success: true, result: formatted };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

export default searchTool;