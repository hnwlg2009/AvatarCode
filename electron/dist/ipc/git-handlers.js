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
exports.setupGitIpcHandlers = setupGitIpcHandlers;
const electron_1 = require("electron");
const isomorphicGit = __importStar(require("isomorphic-git"));
let gitRepoDir = null;
function getFs() {
    try {
        return require('fs');
    }
    catch {
        return null;
    }
}
function setupGitIpcHandlers(mainWindow, workspacePath) {
    // 初始化 Git 服务
    electron_1.ipcMain.handle('git:init', async (_, repoPath) => {
        try {
            // 安全：校验路径
            if (workspacePath && !repoPath.startsWith(workspacePath)) {
                return { success: false, error: 'Repository must be within workspace' };
            }
            gitRepoDir = repoPath;
            const fs = getFs();
            if (!fs)
                return { success: false, error: 'FS unavailable' };
            try {
                await isomorphicGit.resolveRef({ fs, dir: repoPath, ref: 'HEAD' });
                return { success: true, isRepo: true };
            }
            catch {
                return { success: true, isRepo: false };
            }
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // 获取配置
    electron_1.ipcMain.handle('git:getConfig', async (_, key) => {
        if (!gitRepoDir)
            return '';
        try {
            const fs = getFs();
            if (!fs)
                return '';
            return (await isomorphicGit.getConfig({ fs, dir: gitRepoDir, path: key })) || '';
        }
        catch {
            return '';
        }
    });
    // 保存配置
    electron_1.ipcMain.handle('git:setConfig', async (_, key, value) => {
        if (!gitRepoDir)
            return { success: false };
        try {
            const fs = getFs();
            if (!fs)
                return { success: false };
            await isomorphicGit.setConfig({ fs, dir: gitRepoDir, path: key, value });
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // 获取状态
    electron_1.ipcMain.handle('git:getStatus', async () => {
        if (!gitRepoDir)
            return { files: [], branch: 'HEAD' };
        try {
            const fs = getFs();
            const matrix = await isomorphicGit.statusMatrix({ fs, dir: gitRepoDir });
            return {
                files: matrix
                    .map(([f, h, w]) => ({
                    path: f,
                    status: h === 1 && w === 2
                        ? 'modified'
                        : h === 0 && w === 2
                            ? 'added'
                            : h === 1 && w === 0
                                ? 'deleted'
                                : 'unmodified',
                }))
                    .filter((f) => f.status !== 'unmodified'),
                branch: 'HEAD',
            };
        }
        catch {
            return { files: [], branch: 'HEAD' };
        }
    });
    // 暂存文件
    electron_1.ipcMain.handle('git:add', async (_, files) => {
        if (!gitRepoDir)
            return { success: false };
        try {
            const fs = getFs();
            for (const f of Array.isArray(files) ? files : [files]) {
                await isomorphicGit.add({ fs, dir: gitRepoDir, filepath: f });
            }
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // 提交
    electron_1.ipcMain.handle('git:commit', async (_, msg) => {
        if (!gitRepoDir)
            return { success: false, oid: '' };
        try {
            const fs = getFs();
            const oid = await isomorphicGit.commit({
                fs,
                dir: gitRepoDir,
                message: msg,
                author: { name: 'User', email: 'user@example.com' },
            });
            return { success: true, oid };
        }
        catch (e) {
            return { success: false, error: e.message, oid: '' };
        }
    });
    // 获取提交历史
    electron_1.ipcMain.handle('git:getLog', async (_, count = 10) => {
        if (!gitRepoDir)
            return [];
        try {
            const fs = getFs();
            const log = await isomorphicGit.log({ fs, dir: gitRepoDir, depth: count });
            return log.map((c) => ({
                oid: c.oid,
                message: c.commit.message,
                author: c.commit.author.name,
                date: new Date(c.commit.author.timestamp * 1000).toISOString(),
            }));
        }
        catch {
            return [];
        }
    });
    // 获取当前分支
    electron_1.ipcMain.handle('git:getCurrentBranch', async () => {
        if (!gitRepoDir)
            return 'HEAD';
        try {
            const fs = getFs();
            return ((await isomorphicGit.currentBranch({ fs, dir: gitRepoDir, fullname: false })) || 'HEAD');
        }
        catch {
            return 'HEAD';
        }
    });
    // 选择仓库目录
    electron_1.ipcMain.handle('git:selectRepo', async () => {
        const r = await electron_1.dialog.showOpenDialog({ properties: ['openDirectory'] });
        return r.canceled ? { canceled: true } : { canceled: false, path: r.filePaths[0] };
    });
}
exports.default = setupGitIpcHandlers;
