import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { createMenu } from './menu';
import { electronI18n } from './i18n';
import { registerFileHandlers, default as pathSecurity } from './ipc/file-handlers';
import { setupGitIpcHandlers } from './ipc/git-handlers';
import { setupLLMIpcHandlers } from './ipc/llm-handlers';
import { registerCommandHandlers } from './ipc/command-handlers';

let mainWindow: BrowserWindow | null = null;
let workspacePath: string | null = null;

function createWindow(): void {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    ...(isMac
      ? {
          titleBarStyle: 'hidden' as const,
          trafficLightPosition: { x: 10, y: 10 },
        }
      : {}),
    backgroundColor: '#0d0d0d',
    icon: path.join(__dirname, '../../build/icon-256.png'),
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
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
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
  registerAllIpcHandlers();

  createWindow();
  createMenu(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      createMenu(mainWindow);
    }
  });
});

function registerAllIpcHandlers(): void {
  registerFileHandlers();
  setupLLMIpcHandlers();
  setupGitIpcHandlers();
  registerCommandHandlers();
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 处理器
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:platform', () => process.platform);

// 当前工作区路径（单一事实源）
ipcMain.handle('workspace:getPath', (): string | null => workspacePath);

ipcMain.handle('workspace:setPath', (_event, dirPath: string): string | null => {
  if (typeof dirPath !== 'string' || dirPath.length === 0) {
    return null;
  }
  workspacePath = dirPath;
  pathSecurity.addAllowedPath(dirPath);
  return dirPath;
});

ipcMain.handle('dialog:openDirectory', async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const dirPath = result.filePaths[0];
  // 用户主动选择的目录即工作区根，自动授权
  workspacePath = dirPath;
  pathSecurity.addAllowedPath(dirPath);
  return dirPath;
});

// 语言变更处理
ipcMain.on('language-changed', (event, lang: string) => {
  electronI18n.loadTranslations(lang);
  createMenu(mainWindow);
});
