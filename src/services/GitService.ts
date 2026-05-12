import * as isomorphicGit from 'isomorphic-git';
import * as fs from 'fs';

// 动态获取 fs 模块（兼容测试环境）
function getFs(): typeof fs | null {
  try {
    return fs;
  } catch {
    return null;
  }
}

export interface GitStatus {
  files: Array<{
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'untracked';
  }>;
  branch: string;
  ahead: number;
  behind: number;
}

export interface GitCommit {
  oid: string;
  message: string;
  author: string;
  date: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
}

/**
 * Git 服务 - 基于 isomorphic-git
 */
export class GitService {
  private dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  /**
   * 检查目录是否是 git 仓库
   */
  async isGitRepo(): Promise<boolean> {
    try {
      const fs = getFs();
      if (!fs) return false;

      await isomorphicGit.resolveRef({ fs, dir: this.dir, ref: 'HEAD' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取当前状态
   */
  async getStatus(): Promise<GitStatus> {
    const fs = getFs();
    if (!fs) {
      return { files: [], branch: 'HEAD', ahead: 0, behind: 0 };
    }

    const statusMatrix = await isomorphicGit.statusMatrix({ fs, dir: this.dir });

    const files = statusMatrix.map(([filepath, head, worktree, staged]) => {
      let status: GitStatus['files'][0]['status'] = 'untracked';

      if (head === 1 && worktree === 1) {
        status = 'modified';
      } else if (head === 1 && worktree === 2) {
        status = 'added';
      } else if (head === 1 && worktree === 0) {
        status = 'deleted';
      } else if (head === 0 && worktree === 2) {
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
  async getCurrentBranch(): Promise<string> {
    try {
      const fs = getFs();
      if (!fs) return 'HEAD';
      
      const branch = await isomorphicGit.currentBranch({
        fs,
        dir: this.dir,
        fullname: false,
      });
      return branch || 'HEAD';
    } catch {
      return 'HEAD';
    }
  }

  /**
   * 获取所有分支
   */
  async getBranches(): Promise<GitBranch[]> {
    const fs = getFs();
    if (!fs) return [];

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
  async getLog(count: number = 10): Promise<GitCommit[]> {
    const fs = getFs();
    if (!fs) return [];

    try {
      const log = await isomorphicGit.log({
        fs,
        dir: this.dir,
        depth: count,
      });

      return log.map((commit: any) => ({
        oid: commit.oid || commit.commit?.oid || '',
        message: commit.commit?.message || commit.message || '',
        author: commit.commit?.author?.name || commit.author?.name || 'Unknown',
        date: new Date((commit.commit?.author?.timestamp || 0) * 1000).toISOString(),
      }));
    } catch {
      return [];
    }
  }

  /**
   * 暂存文件
   */
  async add(files: string | string[]): Promise<void> {
    const fs = getFs();
    if (!fs) return;

    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      await isomorphicGit.add({ fs, dir: this.dir, filepath: file });
    }
  }

  /**
   * 取消暂存文件
   */
  async remove(files: string | string[]): Promise<void> {
    const fs = getFs();
    if (!fs) return;

    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      await isomorphicGit.remove({ fs, dir: this.dir, filepath: file });
    }
  }

  /**
   * 提交更改
   */
  async commit(message: string, author?: { name: string; email: string }): Promise<string> {
    const fs = getFs();
    if (!fs) return '';

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
  async createBranch(name: string): Promise<void> {
    const fs = getFs();
    if (!fs) return;

    await isomorphicGit.branch({ fs, dir: this.dir, ref: name });
  }

  /**
   * 切换分支
   */
  async checkout(branch: string): Promise<void> {
    const fs = getFs();
    if (!fs) return;

    await isomorphicGit.checkout({ fs, dir: this.dir, ref: branch });
  }

  /**
   * 获取文件差异
   */
  async diff(filepath: string): Promise<string> {
    const fs = getFs();
    if (!fs) return '';

    try {
      // 使用 isomorphic-git 的 status 和 readCommit 来实现 diff
      const status = await isomorphicGit.statusMatrix({
        fs,
        dir: this.dir,
        filepaths: [filepath],
      });

      if (status.length === 0) return '';

      const [, head, worktree] = status[0];
      
      // 简单实现：返回状态信息
      if (head === 1 && worktree === 2) {
        return `Modified: ${filepath}`;
      } else if (head === 0 && worktree === 2) {
        return `New file: ${filepath}`;
      } else if (head === 1 && worktree === 0) {
        return `Deleted: ${filepath}`;
      }
      
      return '';
    } catch {
      return '';
    }
  }
}

export default GitService;
