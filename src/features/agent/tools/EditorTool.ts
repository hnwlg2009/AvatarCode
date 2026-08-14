import { Tool, ToolExecutionResult } from '../types/agent.types';
import { useTabManagerStore } from '../../../stores/tabManagerStore';
import fileSystemService from '../../../services/FileSystemService';

export const editorTool: Tool = {
  name: 'editor_action',
  description: 'Open or focus a file in the editor',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', description: 'Action to perform (open, focus)' },
      path: { type: 'string', description: 'File path to open or focus' },
    },
    required: ['action', 'path'],
  },
  async execute(args: Record<string, any>): Promise<ToolExecutionResult> {
    const action = args.action as string;
    const filePath = args.path as string;

    if (!action || !filePath) {
      return {
        success: false,
        result: null,
        error: 'Missing required arguments: action and path',
      };
    }

    try {
      const store = useTabManagerStore.getState();
      const existing = store.getTabByPath(filePath);

      if (existing) {
        store.activateTab(existing.id);
        return { success: true, result: `Focused file: ${filePath}` };
      }

      if (action === 'open' || action === 'focus') {
        const content = await fileSystemService.readFile(filePath);
        const name = filePath.split('/').pop() || 'Untitled';
        const language = fileSystemService.getFileLanguage(filePath);
        store.addTab({
          path: filePath,
          name,
          language,
          id: filePath,
          content,
          isDirty: false,
          isLoading: false,
          config: { theme: 'vs-dark' as const },
        });
        return { success: true, result: `Opened file: ${filePath}` };
      }

      return { success: false, result: null, error: `Unsupported editor action: ${action}` };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

export default editorTool;