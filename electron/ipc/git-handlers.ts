import { ipcMain } from 'electron';
import * as isomorphicGit from 'isomorphic-git';
import pathSecurity from './file-handlers';

function getFs() {
  try {
    return require('fs');
  } catch {
    return null;
  }
}

function assertRepoAllowed(repoPath: string): void {
  if (!repoPath || typeof repoPath !== 'string') {
    throw new Error('Invalid repository path');
  }
  if (!pathSecurity.isPathAllowed(repoPath)) {
    throw new Error('Repository path is not allowed');
  }
}

function mapStatusMatrix(matrix: any[][]): any[] {
  return matrix
    .map(([f, h, w]: any) => ({
      path: f,
      status:
        h === 1 && w === 2
          ? 'modified'
          : h === 0 && w === 2
            ? 'added'
            : h === 1 && w === 0
              ? 'deleted'
              : 'untracked',
    }))
    .filter((f: any) => f.status !== 'unmodified');
}

export function setupGitIpcHandlers(): void {
  // 初始化 Git 服务（校验路径并探测仓库）
  ipcMain.handle('git:init', async (_, repoPath: string) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      if (!fs) return { success: false, error: 'FS unavailable' };
      try {
        await isomorphicGit.resolveRef({ fs, dir: repoPath, ref: 'HEAD' });
        return { success: true, isRepo: true };
      } catch {
        return { success: true, isRepo: false };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // 获取配置
  ipcMain.handle('git:getConfig', async (_, repoPath: string, key: string) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      if (!fs) return '';
      return (await isomorphicGit.getConfig({ fs, dir: repoPath, path: key })) || '';
    } catch {
      return '';
    }
  });

  // 保存配置
  ipcMain.handle('git:setConfig', async (_, repoPath: string, key: string, value: string) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      if (!fs) return { success: false };
      await isomorphicGit.setConfig({ fs, dir: repoPath, path: key, value });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // 获取状态
  ipcMain.handle('git:getStatus', async (_, repoPath: string) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      const matrix = await isomorphicGit.statusMatrix({ fs, dir: repoPath });
      const branch =
        (await isomorphicGit.currentBranch({ fs, dir: repoPath, fullname: false })) || 'HEAD';
      return { files: mapStatusMatrix(matrix), branch };
    } catch (e: any) {
      return { files: [], branch: 'HEAD', error: e.message };
    }
  });

  // 暂存文件
  ipcMain.handle('git:add', async (_, repoPath: string, files: string | string[]) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      if (!fs) return { success: false };
      for (const f of Array.isArray(files) ? files : [files]) {
        await isomorphicGit.add({ fs, dir: repoPath, filepath: f });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // 取消暂存
  ipcMain.handle('git:remove', async (_, repoPath: string, files: string | string[]) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      if (!fs) return { success: false };
      for (const f of Array.isArray(files) ? files : [files]) {
        await isomorphicGit.remove({ fs, dir: repoPath, filepath: f });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // 提交
  ipcMain.handle(
    'git:commit',
    async (
      _,
      repoPath: string,
      msg: string,
      author?: { name?: string; email?: string }
    ) => {
      try {
        assertRepoAllowed(repoPath);
        const fs = getFs();
        if (!fs) return { success: false, oid: '' };
        const oid = await isomorphicGit.commit({
          fs,
          dir: repoPath,
          message: msg,
          author: {
            name: author?.name || 'User',
            email: author?.email || 'user@example.com',
          },
        });
        return { success: true, oid };
      } catch (e: any) {
        return { success: false, error: e.message, oid: '' };
      }
    }
  );

  // 获取提交历史
  ipcMain.handle('git:getLog', async (_, repoPath: string, count = 10) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      const log = await isomorphicGit.log({ fs, dir: repoPath, depth: count });
      return log.map((c: any) => ({
        oid: c.oid,
        message: c.commit.message,
        author: c.commit.author.name,
        date: new Date(c.commit.author.timestamp * 1000).toISOString(),
      }));
    } catch {
      return [];
    }
  });

  // 获取当前分支
  ipcMain.handle('git:getCurrentBranch', async (_, repoPath: string) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      return (
        (await isomorphicGit.currentBranch({ fs, dir: repoPath, fullname: false })) || 'HEAD'
      );
    } catch {
      return 'HEAD';
    }
  });

  // 获取所有分支
  ipcMain.handle('git:getBranches', async (_, repoPath: string) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      const branches = await isomorphicGit.listBranches({ fs, dir: repoPath });
      const current =
        (await isomorphicGit.currentBranch({ fs, dir: repoPath, fullname: false })) || 'HEAD';
      return branches.map((name: string) => ({ name, current: name === current }));
    } catch {
      return [];
    }
  });

  // 创建分支
  ipcMain.handle('git:createBranch', async (_, repoPath: string, name: string) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      if (!fs) return { success: false };
      await isomorphicGit.branch({ fs, dir: repoPath, ref: name });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // 切换分支
  ipcMain.handle('git:checkout', async (_, repoPath: string, branch: string) => {
    try {
      assertRepoAllowed(repoPath);
      const fs = getFs();
      if (!fs) return { success: false };
      await isomorphicGit.checkout({ fs, dir: repoPath, ref: branch });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
}

export default setupGitIpcHandlers;
