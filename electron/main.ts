import { app, BrowserWindow, ipcMain, dialog, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createMenu } from './menu';
import { registerFileHandlers, default as pathSecurity } from './ipc/file-handlers';
import { registerTerminalHandlers } from './ipc/terminal-handlers';
import { setupGitIpcHandlers } from './ipc/git-handlers';
import { setupLLMIpcHandlers } from './ipc/llm-handlers';

let mainWindow: BrowserWindow | null = null;
let workspacePath: string | null = null;

// 安全的路径校验函数
function isPathAllowed(filePath: string): boolean {
  if (!workspacePath) return false;
  const resolved = path.resolve(filePath);
  const allowedDir = path.resolve(workspacePath);
  return resolved.startsWith(allowedDir + path.sep) || resolved === allowedDir;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
    frame: true,
    backgroundColor: '#0d0d0d',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 安全：限制导航范围
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const allowedOrigin =
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'file://';
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== allowedOrigin) {
      event.preventDefault();
    }
  });
}

// 应用生命周期
app.whenReady().then(async () => {
  registerFileHandlers();
  registerTerminalHandlers();
  setupGitIpcHandlers(mainWindow, workspacePath);
  setupLLMIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      createMenu(mainWindow);
      setupGitIpcHandlers(mainWindow, workspacePath);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 处理器
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:platform', () => process.platform);

// 安全：文件读取需要路径校验
ipcMain.handle('file:read', async (_, filePath: string): Promise<string> => {
  if (!isPathAllowed(filePath)) {
    throw new Error('Access denied: path outside workspace');
  }
  return await fs.readFile(filePath, 'utf-8');
});

// 安全：文件写入需要路径校验
ipcMain.handle('file:write', async (_, filePath: string, content: string): Promise<void> => {
  if (!isPathAllowed(filePath)) {
    throw new Error('Access denied: path outside workspace');
  }
  await fs.writeFile(filePath, content, 'utf-8');
});

ipcMain.handle('file:exists', async (_, filePath: string): Promise<boolean> => {
  if (!isPathAllowed(filePath)) {
    throw new Error('Access denied: path outside workspace');
  }
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('dialog:openFile', async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'All Files', extensions: ['*'] }],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const filePath = result.filePaths[0];
  if (!isPathAllowed(filePath)) {
    throw new Error('Access denied: path outside workspace');
  }
  return filePath;
});

ipcMain.handle('dialog:saveFile', async (): Promise<string | null> => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    filters: [{ name: 'All Files', extensions: ['*'] }],
  });
  if (result.canceled || !result.filePath) {
    return null;
  }
  const filePath = result.filePath;
  if (!isPathAllowed(filePath)) {
    throw new Error('Access denied: path outside workspace');
  }
  return filePath;
});

ipcMain.handle('dialog:openDirectory', async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const dirPath = result.filePaths[0];
  if (!isPathAllowed(dirPath)) {
    throw new Error('Access denied: path outside workspace');
  }
  return dirPath;
});
