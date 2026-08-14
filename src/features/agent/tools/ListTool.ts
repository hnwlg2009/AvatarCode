import { Tool, ToolExecutionResult } from '../types/agent.types';
import fileSystemService from '../../../services/FileSystemService';

const MAX_ENTRIES = 200;

async function executeList(
  args: Record<string, any>,
  toolName: string
): Promise<ToolExecutionResult> {
  const dir = args.path as string | undefined;
  if (args.path !== undefined && typeof args.path !== 'string') {
    return { success: false, result: null, error: 'Argument "path" must be a string' };
  }

  try {
    const entries = await fileSystemService.readdir(dir || '/workspace');
    if (!entries || entries.length === 0) {
      return { success: true, result: `Directory ${dir || '/workspace'} is empty` };
    }

    const lines = entries.slice(0, MAX_ENTRIES).map((entry) => {
      const kind = entry.type === 'directory' ? 'dir ' : entry.type === 'symlink' ? 'link' : 'file';
      const size =
        entry.type === 'file' ? ` (${entry.size} bytes)` : '';
      return `${kind} ${entry.name}${size}`;
    });

    if (entries.length > MAX_ENTRIES) {
      lines.push(`... ${entries.length - MAX_ENTRIES} more entries (truncated)`);
    }

    return {
      success: true,
      result: `Directory listing of ${dir || '/workspace'} (${entries.length} entries):\n${lines.join('\n')}`,
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: `${toolName}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export const listFilesTool: Tool = {
  name: 'list_files',
  description: 'List files and directories in a directory',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Directory path to list (optional, defaults to project root)' },
    },
  },
  async execute(args: Record<string, any>): Promise<ToolExecutionResult> {
    return executeList(args, 'list_files');
  },
};

export const readDirTool: Tool = {
  name: 'read_dir',
  description: 'Read the entries of a directory (alias of list_files)',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Directory path to read (optional, defaults to project root)' },
    },
  },
  async execute(args: Record<string, any>): Promise<ToolExecutionResult> {
    return executeList(args, 'read_dir');
  },
};

export default listFilesTool;
