import { ipcMain } from 'electron';
import * as path from 'path';

interface PTYProcess {
  pty: any;
  cwd: string;
}

const ptyProcesses: Map<string, PTYProcess> = new Map();

export function registerTerminalHandlers(): void {
  ipcMain.handle('terminal:create', async (event, options: { cwd?: string; shell?: string }) => {
    let pty: any;
    try {
      pty = require('node-pty');
    } catch {
      return { id: null, error: 'node-pty 未安装' };
    }

    const shell = options.shell || (process.platform === 'win32' ? 'powershell.exe' : 'bash');
    const cwd = options.cwd || process.env.HOME || '/root';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: process.env,
    });

    const id = `pty-${Date.now()}`;
    ptyProcesses.set(id, { pty: ptyProcess, cwd });

    ptyProcess.onData((data: string) => {
      event.sender.send('terminal:data', { id, data });
    });

    ptyProcess.onExit(() => {
      ptyProcesses.delete(id);
      event.sender.send('terminal:exit', { id });
    });

    return { id, cwd };
  });

  ipcMain.handle('terminal:write', async (_event, { id, data }: { id: string; data: string }) => {
    const proc = ptyProcesses.get(id);
    if (!proc) {
      throw new Error(`Terminal 进程不存在：${id}`);
    }
    proc.pty.write(data);
  });

  ipcMain.handle('terminal:resize', async (_event, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
    const proc = ptyProcesses.get(id);
    if (!proc) {
      throw new Error(`Terminal 进程不存在：${id}`);
    }
    proc.pty.resize(cols, rows);
  });

  ipcMain.handle('terminal:kill', async (_event, id: string) => {
    const proc = ptyProcesses.get(id);
    if (!proc) return;
    proc.pty.kill();
    ptyProcesses.delete(id);
  });

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
