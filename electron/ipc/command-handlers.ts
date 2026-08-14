import { ipcMain } from 'electron';
import { spawn } from 'child_process';
import crypto from 'crypto';

interface PendingApproval {
  command: string;
  cwd: string;
  expiresAt: number;
}

const pendingApprovals = new Map<string, PendingApproval>();
const APPROVAL_TTL_MS = 5 * 60 * 1000;
const COMMAND_TIMEOUT_MS = 30 * 1000;

const DANGEROUS_PATTERNS: RegExp[] = [
  /^\s*(rm|rmdir|del|format)\s+(-rf\s+)?[\\/]($|[*?.])/i,
  /^\s*rm\s+-rf\s+[a-zA-Z]:[\\/]($|[*?.])/i,
  /^\s*(shutdown|reboot|mkfs|dd)\b/i,
];

function isDangerous(command: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(command));
}

function executeCommand(command: string, cwd: string): Promise<any> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      windowsHide: true,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (exitCode: number | null, timedOut = false) => {
      if (settled) return;
      settled = true;
      resolve({ exitCode, stdout, stderr, timedOut });
    };

    const timer = setTimeout(() => {
      child.kill();
      finish(null, true);
    }, COMMAND_TIMEOUT_MS);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
      if (stdout.length > 200_000) {
        stdout = stdout.slice(0, 200_000) + '\n[output truncated]';
      }
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > 200_000) {
        stderr = stderr.slice(0, 200_000) + '\n[output truncated]';
      }
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      finish(code);
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      finish(null, false);
      stderr += `\n${error.message}`;
    });
  });
}

export function registerCommandHandlers(): void {
  // 请求审批：同一命令在挂起期间返回同一 nonce（供 UI 与工具侧协同）
  ipcMain.handle('command:requestApproval', async (event, command: string, cwd?: string) => {
    if (!command || typeof command !== 'string') {
      throw new Error('Invalid command');
    }
    if (isDangerous(command)) {
      throw new Error('Command blocked by security policy');
    }

    for (const [nonce, pending] of pendingApprovals) {
      if (pending.command === command) {
        return { nonce, command };
      }
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    pendingApprovals.set(nonce, {
      command,
      cwd: cwd || process.cwd(),
      expiresAt: Date.now() + APPROVAL_TTL_MS,
    });

    setTimeout(() => {
      pendingApprovals.delete(nonce);
    }, APPROVAL_TTL_MS);

    return { nonce, command };
  });

  // 用户决策：批准则执行命令，拒绝则返回 denied；结果广播给渲染进程
  ipcMain.handle('command:decideApproval', async (event, nonce: string, approved: boolean) => {
    const pending = pendingApprovals.get(nonce);
    if (!pending) {
      return { denied: true, reason: 'approval expired' };
    }
    pendingApprovals.delete(nonce);

    if (!approved) {
      const payload = { nonce, denied: true, reason: 'user denied' };
      event.sender.send('command:approval-result', payload);
      return payload;
    }

    const result = await executeCommand(pending.command, pending.cwd);
    const payload = { nonce, ...result, approved: true };
    event.sender.send('command:approval-result', payload);
    return payload;
  });
}

export default registerCommandHandlers;