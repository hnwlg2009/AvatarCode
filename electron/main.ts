import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { createMenu } from './menu';
import { registerFileHandlers } from './ipc/file-handlers';
import { registerTerminalHandlers } from './ipc/terminal-handlers';
import { setupGitIpcHandlers } from './ipc/git-handlers';
import { setupLLMIpcHandlers } from './ipc/llm-handlers';

let mainWindow: BrowserWindow | null = null;
let workspacePath: string | null = null;

function isPathAllowed(filePath: string): boolean {
  if (!workspacePath) return true;
  const resolved = path.resolve(filePath);
  const allowedDir = path.resolve(workspacePath);
  return resolved.startsWith(allowedDir + path.sep) || resolved === allowedDir;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu(mainWindow);
}

app.whenReady().then(() => {
  const args = process.argv.slice(1);
  const filteredArgs = args.filter(arg => !arg.startsWith('--'));
  
  if (filteredArgs.length > 0) {
    workspacePath = path.resolve(filteredArgs[0]);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

registerFileHandlers();
registerTerminalHandlers();
setupGitIpcHandlers(mainWindow, workspacePath);
setupLLMIpcHandlers();

ipcMain.handle('workspace:get', () => workspacePath);
ipcMain.handle('workspace:set', (_, newPath: string) => {
  workspacePath = path.resolve(newPath);
  return workspacePath;
});
