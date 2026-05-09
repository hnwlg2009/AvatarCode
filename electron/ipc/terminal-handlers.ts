import { ipcMain } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';

interface PTYProcess {
  pty: any;
  cwd: string;
}

const ptyProcesses: Map<string, PTYProcess> = new Map();

export function registerTerminalHandlers(): void {

  // Terminal create handler
  ipcMain.handle('terminal:create', async (event, options: { cwd?: string; shell?: string }) => {
    const shell = options.shell || (process.platform === 'win32' ? 'cmd.exe' : 'bash');
    const cwd = options.cwd || process.env.HOME || '/root';
    
    const proc = spawn(shell, [], {
      cwd,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const id = `pty-${Date.now()}`;
    ptyProcesses.set(id, { pty: proc, cwd });
    
    proc.stdout.on('data', (data: Buffer) => {
      event.sender.send('terminal:data', { id, data: data.toString() });
    });
    
    proc.stderr.on('data', (data: Buffer) => {
      event.sender.send('terminal:data', { id, data: data.toString() });
    });
    
    proc.on('exit', () => {
      ptyProcesses.delete(id);
      event.sender.send('terminal:exit', { id });
    });
    
    return { id, cwd };
  });

  // Terminal write handler
  ipcMain.handle('terminal:write', async (_event, { id, data }: { id: string; data: string }) => {
    const proc = ptyProcesses.get(id);
    if (!proc) {
      throw new Error(`Terminal 进程不存在：${id}`);
    }
    if (proc.pty.stdin) {
      proc.pty.stdin.write(data);
    }
  });

  // Terminal resize handler (降级方案不支持)
  ipcMain.handle('terminal:resize', async (_event, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
    const proc = ptyProcesses.get(id);
    if (!proc) {
      throw new Error(`Terminal 进程不存在：${id}`);
    }
    // child_process 不支持 resize，忽略
  });

  // Terminal kill handler
  ipcMain.handle('terminal:kill', async (_event, id: string) => {
    const proc = ptyProcesses.get(id);
    if (!proc) return;
    
    if (proc.pty.kill) {
      proc.pty.kill('SIGTERM');
    }
    
    ptyProcesses.delete(id);
  });

  // Get shells handler
  ipcMain.handle('terminal:getShells', async () => {
    const shells: string[] = [];
    if (process.platform === 'win32') {
      shells.push('powershell.exe', 'cmd.exe');
    } else {
      shells.push('/bin/bash', '/bin/zsh');
    }
    return shells;
  });
}

export default registerTerminalHandlers;
