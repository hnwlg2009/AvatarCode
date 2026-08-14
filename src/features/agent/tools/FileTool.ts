import { Tool, ToolExecutionResult } from '../types/agent.types';
import fileSystemService from '../../../services/FileSystemService';

export const fileTool: Tool = {
  name: 'read_file',
  description: 'Read the content of a file',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to read' },
    },
    required: ['path'],
  },
  async execute(args: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const content = await fileSystemService.readFile(args.path as string);
      return { success: true, result: content };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

export const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to write' },
      content: { type: 'string', description: 'Content to write' },
    },
    required: ['path', 'content'],
  },
  async execute(args: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      await fileSystemService.writeFile(args.path as string, args.content as string);
      return { success: true, result: `File written: ${args.path}` };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
