"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFileHandlers = registerFileHandlers;
const electron_1 = require("electron");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class PathSecurity {
    constructor() {
        this.allowedPaths = new Set();
        // 默认允许应用数据目录
        this.allowedPaths.add(electron_1.app.getPath('userData'));
        this.allowedPaths.add(electron_1.app.getPath('temp'));
    }
    addAllowedPath(workspacePath) {
        this.allowedPaths.add(workspacePath);
    }
    isPathAllowed(targetPath) {
        const normalized = path_1.default.normalize(targetPath);
        for (const allowed of this.allowedPaths) {
            if (normalized.startsWith(allowed)) {
                return true;
            }
        }
        return false;
    }
    validatePath(targetPath) {
        const normalized = normalizedPath(targetPath);
        if (!this.isPathAllowed(normalized)) {
            throw new Error(`路径不允许访问：${targetPath}`);
        }
        // 防止路径遍历攻击
        if (normalized.includes('..')) {
            const resolved = path_1.default.resolve(normalized);
            if (!this.isPathAllowed(resolved)) {
                throw new Error('路径遍历攻击被阻止');
            }
        }
    }
}
const pathSecurity = new PathSecurity();
function normalizedPath(filePath) {
    return path_1.default.normalize(filePath);
}
function registerFileHandlers() {
    // FS-001: file:read handler ✅
    electron_1.ipcMain.handle('file:read', async (event, filePath) => {
        pathSecurity.validatePath(filePath);
        return await promises_1.default.readFile(filePath, 'utf-8');
    });
    // FS-002: file:write handler ✅
    electron_1.ipcMain.handle('file:write', async (event, filePath, content) => {
        pathSecurity.validatePath(filePath);
        await promises_1.default.writeFile(filePath, content, 'utf-8');
    });
    // FS-001: file:readBinary handler ✅
    electron_1.ipcMain.handle('file:readBinary', async (event, filePath) => {
        pathSecurity.validatePath(filePath);
        const buffer = await promises_1.default.readFile(filePath);
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    });
    // FS-002: file:writeBinary handler ✅
    electron_1.ipcMain.handle('file:writeBinary', async (event, filePath, data) => {
        pathSecurity.validatePath(filePath);
        await promises_1.default.writeFile(filePath, Buffer.from(data));
    });
    // FS-003: file:readdir handler 🆕
    electron_1.ipcMain.handle('file:readdir', async (event, dirPath) => {
        pathSecurity.validatePath(dirPath);
        const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
        const fileEntries = [];
        for (const entry of entries) {
            const fullPath = path_1.default.join(dirPath, entry.name);
            const stat = await promises_1.default.stat(fullPath);
            fileEntries.push({
                name: entry.name,
                path: fullPath,
                type: entry.isFile() ? 'file' : entry.isDirectory() ? 'directory' : 'symlink',
                size: stat.size,
                modifiedTime: stat.mtime,
                createdTime: stat.birthtime,
            });
        }
        return fileEntries;
    });
    // FS-004: file:stat handler 🆕
    electron_1.ipcMain.handle('file:stat', async (event, filePath) => {
        pathSecurity.validatePath(filePath);
        const stat = await promises_1.default.stat(filePath);
        return {
            isFile: stat.isFile(),
            isDirectory: stat.isDirectory(),
            isSymlink: stat.isSymbolicLink(),
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            mode: stat.mode,
        };
    });
    // FS-005: file:delete handler 🆕
    electron_1.ipcMain.handle('file:delete', async (event, filePath, recursive = false) => {
        pathSecurity.validatePath(filePath);
        if (recursive) {
            await promises_1.default.rm(filePath, { recursive: true, force: true });
        }
        else {
            await promises_1.default.unlink(filePath);
        }
    });
    // FS-006: file:rename handler 🆕
    electron_1.ipcMain.handle('file:rename', async (event, oldPath, newPath) => {
        pathSecurity.validatePath(oldPath);
        pathSecurity.validatePath(newPath);
        await promises_1.default.rename(oldPath, newPath);
    });
    // FS-006: file:copy handler 🆕
    electron_1.ipcMain.handle('file:copy', async (event, sourcePath, destPath) => {
        pathSecurity.validatePath(sourcePath);
        pathSecurity.validatePath(destPath);
        await promises_1.default.copyFile(sourcePath, destPath);
    });
    // FS-003: file:create handler 🆕
    electron_1.ipcMain.handle('file:create', async (event, filePath, content = '') => {
        pathSecurity.validatePath(filePath);
        await promises_1.default.writeFile(filePath, content, 'utf-8');
    });
    // FS-003: file:createDirectory handler 🆕
    electron_1.ipcMain.handle('file:createDirectory', async (event, dirPath) => {
        pathSecurity.validatePath(dirPath);
        await promises_1.default.mkdir(dirPath, { recursive: true });
    });
    // 工作空间路径管理
    electron_1.ipcMain.handle('file:addWorkspacePath', async (event, workspacePath) => {
        pathSecurity.addAllowedPath(workspacePath);
    });
}
exports.default = pathSecurity;
// 文件对话框
electron_1.ipcMain.handle('dialog:openFile', async () => {
    const result = await electron_1.dialog.showOpenDialog({
        properties: ['openFile'],
    });
    return result;
});
electron_1.ipcMain.handle('dialog:saveFile', async () => {
    const result = await electron_1.dialog.showSaveDialog({});
    return result;
});
