import { Tool, ToolExecutionResult } from '../types/agent.types';
import useSettingsStore from '../../../stores/settingsStore';

function waitForApproval(nonce: string, timeoutMs: number = 300_000): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const api = window.electronAPI;
    if (!api?.on) {
      reject(new Error('Electron command API is not available'));
      return;
    }

    const timer = setTimeout(() => {
      off();
      reject(new Error('Command approval timed out'));
    }, timeoutMs);

    const off = api.on('command:approval-result', (payload: any) => {
      if (payload?.nonce !== nonce) return;
      clearTimeout(timer);
      off();
      resolve(payload);
    });
  });
}

export const terminalTool: Tool = {
  name: 'execute_command',
  description: 'Request execution of a shell command (requires user approval)',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Command to execute' },
    },
    required: ['command'],
  },
  async execute(args: Record<string, any>): Promise<ToolExecutionResult> {
    const command = args.command as string;
    if (!command || typeof command !== 'string') {
      return { success: false, result: null, error: 'Missing required argument: command' };
    }

    const api = window.electronAPI;
    if (!api?.command?.requestApproval) {
      return {
        success: false,
        result: null,
        error: 'Command execution requires the desktop app. Approve commands in the app.',
      };
    }

    const cwd = useSettingsStore.getState().workspacePath || undefined;

    try {
      const { nonce } = await api.command.requestApproval(command, cwd);
      const result = await waitForApproval(nonce);

      if (result.denied) {
        return {
          success: false,
          result: null,
          error: `Command denied by user: ${command || ''}`,
        };
      }

      return {
        success: true,
        result: {
          command,
          exitCode: result.exitCode ?? null,
          stdout: result.stdout ?? '',
          stderr: result.stderr ?? '',
          timedOut: result.timedOut ?? false,
        },
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

export default terminalTool;