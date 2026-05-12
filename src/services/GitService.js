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
exports.GitService = void 0;
const isomorphicGit = __importStar(require("isomorphic-git"));
// 动态导入 fs 以避免测试问题
function getFs() {
    if (typeof require !== 'undefined') {
        try {
            return require('fs');
        }
        catch {
            return null;
        }
    }
    return null;
}
/**
 * Git 服务 - 基于 isomorphic-git
 */
class GitService {
    constructor(dir) {
        this.dir = dir;
    }
    /**
     * 检查目录是否是 git 仓库
     */
    async isGitRepo() {
        try {
            const fs = getFs();
            if (!fs)
                return false;
            await isomorphicGit.resolveRef({ fs, dir: this.dir, ref: 'HEAD' });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 获取当前状态
     */
    async getStatus() {
        const fs = getFs();
        if (!fs) {
            return { files: [], branch: 'HEAD', ahead: 0, behind: 0 };
        }
        const statusMatrix = await isomorphicGit.statusMatrix({ fs, dir: this.dir });
        const files = statusMatrix.map(([filepath, head, worktree, staged]) => {
            let status = 'untracked';
            if (head === 1 && worktree === 1) {
                status = 'modified';
            }
            else if (head === 1 && worktree === 2) {
                status = 'added';
            }
            else if (head === 1 && worktree === 0) {
                status = 'deleted';
            }
            else if (head === 0 && worktree === 2) {
                status = 'added';
            }
            return { path: filepath, status };
        });
        const currentBranch = await this.getCurrentBranch();
        return {
            files,
            branch: currentBranch,
            ahead: 0,
            behind: 0,
        };
    }
    /**
     * 获取当前分支
     */
    async getCurrentBranch() {
        try {
            const fs = getFs();
            if (!fs)
                return 'HEAD';
            const branch = await isomorphicGit.currentBranch({
                fs,
                dir: this.dir,
                fullname: false,
            });
            return branch || 'HEAD';
        }
        catch {
            return 'HEAD';
        }
    }
    /**
     * 获取所有分支
     */
    async getBranches() {
        const fs = getFs();
        if (!fs)
            return [];
        const branches = await isomorphicGit.listBranches({ fs, dir: this.dir });
        const current = await this.getCurrentBranch();
        return branches.map((name) => ({
            name,
            current: name === current,
        }));
    }
    /**
     * 获取提交历史
     */
    async getLog(count = 10) {
        const fs = getFs();
        if (!fs)
            return [];
        try {
            const log = await isomorphicGit.log({
                fs,
                dir: this.dir,
                depth: count,
            });
            return log.map((commit) => ({
                oid: commit.oid || commit.commit?.oid || '',
                message: commit.commit?.message || commit.message || '',
                author: commit.commit?.author?.name || commit.author?.name || 'Unknown',
                date: new Date((commit.commit?.author?.timestamp || 0) * 1000).toISOString(),
            }));
        }
        catch {
            return [];
        }
    }
    /**
     * 暂存文件
     */
    async add(files) {
        const fs = getFs();
        if (!fs)
            return;
        const fileArray = Array.isArray(files) ? files : [files];
        for (const file of fileArray) {
            await isomorphicGit.add({ fs, dir: this.dir, filepath: file });
        }
    }
    /**
     * 取消暂存文件
     */
    async remove(files) {
        const fs = getFs();
        if (!fs)
            return;
        const fileArray = Array.isArray(files) ? files : [files];
        for (const file of fileArray) {
            await isomorphicGit.remove({ fs, dir: this.dir, filepath: file });
        }
    }
    /**
     * 提交更改
     */
    async commit(message, author) {
        const fs = getFs();
        if (!fs)
            return '';
        const authorInfo = author || { name: 'User', email: 'user@example.com' };
        const oid = await isomorphicGit.commit({
            fs,
            dir: this.dir,
            message,
            author: authorInfo,
        });
        return oid;
    }
    /**
     * 创建分支
     */
    async createBranch(name) {
        const fs = getFs();
        if (!fs)
            return;
        await isomorphicGit.branch({ fs, dir: this.dir, ref: name });
    }
    /**
     * 切换分支
     */
    async checkout(branch) {
        const fs = getFs();
        if (!fs)
            return;
        await isomorphicGit.checkout({ fs, dir: this.dir, ref: branch });
    }
    /**
     * 获取文件差异
     */
    async diff(filepath) {
        const fs = getFs();
        if (!fs)
            return '';
        try {
            // 使用 isomorphic-git 的 status 和 readCommit 来实现 diff
            const status = await isomorphicGit.statusMatrix({
                fs,
                dir: this.dir,
                filepaths: [filepath],
            });
            if (status.length === 0)
                return '';
            const [, head, worktree] = status[0];
            // 简单实现：返回状态信息
            if (head === 1 && worktree === 2) {
                return `Modified: ${filepath}`;
            }
            else if (head === 0 && worktree === 2) {
                return `New file: ${filepath}`;
            }
            else if (head === 1 && worktree === 0) {
                return `Deleted: ${filepath}`;
            }
            return '';
        }
        catch {
            return '';
        }
    }
}
exports.GitService = GitService;
exports.default = GitService;
