"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const menu_1 = require("./menu");
const i18n_1 = require("./i18n");
const file_handlers_1 = require("./ipc/file-handlers");
const terminal_handlers_1 = require("./ipc/terminal-handlers");
const git_handlers_1 = require("./ipc/git-handlers");
const llm_handlers_1 = require("./ipc/llm-handlers");
let mainWindow = null;
let workspacePath = null;
// 安全的路径校验函数
function isPathAllowed(filePath) {
    if (!workspacePath)
        return false;
    const resolved = path.resolve(filePath);
    const allowedDir = path.resolve(workspacePath);
    return resolved.startsWith(allowedDir + path.sep) || resolved === allowedDir;
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // 安全：限制导航范围
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const allowedOrigin = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'file://';
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== allowedOrigin) {
            event.preventDefault();
        }
    });
}
// 应用生命周期
electron_1.app.whenReady().then(async () => {
    (0, file_handlers_1.registerFileHandlers)();
    (0, terminal_handlers_1.registerTerminalHandlers)();
    (0, git_handlers_1.setupGitIpcHandlers)(mainWindow, workspacePath);
    (0, llm_handlers_1.setupLLMIpcHandlers)();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
            (0, menu_1.createMenu)(mainWindow);
            (0, git_handlers_1.setupGitIpcHandlers)(mainWindow, workspacePath);
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC 处理器
electron_1.ipcMain.handle('app:version', () => electron_1.app.getVersion());
electron_1.ipcMain.handle('app:platform', () => process.platform);
// 安全：文件读取需要路径校验
electron_1.ipcMain.handle('file:read', async (_, filePath) => {
    if (!isPathAllowed(filePath)) {
        throw new Error('Access denied: path outside workspace');
    }
    return await fs.readFile(filePath, 'utf-8');
});
// 安全：文件写入需要路径校验
electron_1.ipcMain.handle('file:write', async (_, filePath, content) => {
    if (!isPathAllowed(filePath)) {
        throw new Error('Access denied: path outside workspace');
    }
    await fs.writeFile(filePath, content, 'utf-8');
});
electron_1.ipcMain.handle('file:exists', async (_, filePath) => {
    if (!isPathAllowed(filePath)) {
        throw new Error('Access denied: path outside workspace');
    }
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
});
electron_1.ipcMain.handle('dialog:openFile', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
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
electron_1.ipcMain.handle('dialog:saveFile', async () => {
    const result = await electron_1.dialog.showSaveDialog(mainWindow, {
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
electron_1.ipcMain.handle('dialog:openDirectory', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
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
// 语言变更处理
electron_1.ipcMain.on('language-changed', (event, lang) => {
    i18n_1.electronI18n.loadTranslations(lang);
    (0, menu_1.createMenu)(mainWindow);
});
