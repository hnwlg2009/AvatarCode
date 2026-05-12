"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTerminalHandlers = registerTerminalHandlers;
const electron_1 = require("electron");
const ptyProcesses = new Map();
function registerTerminalHandlers() {
    electron_1.ipcMain.handle('terminal:create', async (event, options) => {
        let pty;
        try {
            pty = require('node-pty');
        }
        catch {
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
        ptyProcess.onData((data) => {
            event.sender.send('terminal:data', { id, data });
        });
        ptyProcess.onExit(() => {
            ptyProcesses.delete(id);
            event.sender.send('terminal:exit', { id });
        });
        return { id, cwd };
    });
    electron_1.ipcMain.handle('terminal:write', async (_event, { id, data }) => {
        const proc = ptyProcesses.get(id);
        if (!proc) {
            throw new Error(`Terminal 进程不存在：${id}`);
        }
        proc.pty.write(data);
    });
    electron_1.ipcMain.handle('terminal:resize', async (_event, { id, cols, rows }) => {
        const proc = ptyProcesses.get(id);
        if (!proc) {
            throw new Error(`Terminal 进程不存在：${id}`);
        }
        proc.pty.resize(cols, rows);
    });
    electron_1.ipcMain.handle('terminal:kill', async (_event, id) => {
        const proc = ptyProcesses.get(id);
        if (!proc)
            return;
        proc.pty.kill();
        ptyProcesses.delete(id);
    });
    electron_1.ipcMain.handle('terminal:getShells', async () => {
        const shells = [];
        if (process.platform === 'win32') {
            shells.push('powershell.exe', 'cmd.exe');
        }
        else {
            shells.push('/bin/bash', '/bin/zsh');
        }
        return shells;
    });
}
exports.default = registerTerminalHandlers;
