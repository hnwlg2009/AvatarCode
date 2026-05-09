import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as isomorphicGit from 'isomorphic-git';
import * as fs from 'fs';

let gitRepoDir: string | null = null;

export function setupGitIpcHandlers(
  mainWindow: BrowserWindow | null,
  workspacePath: string | null
): void {
  ipcMain.handle('git:init', async (_, repoPath: string) => {
    try {
      if (workspacePath && !repoPath.startsWith(workspacePath)) {
        return { success: false, error: 'Repository must be within workspace' };
      }
      gitRepoDir = repoPath;
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

  ipcMain.handle('git:getConfig', async (_, key: string) => {
    if (!gitRepoDir) return '';
    try {
      return (await isomorphicGit.getConfig({ fs, dir: gitRepoDir, path: key })) || '';
    } catch {
      return '';
    }
  });

  ipcMain.handle('git:setConfig', async (_, key: string, value: string) => {
    if (!gitRepoDir) return { success: false };
    try {
      await isomorphicGit.setConfig({ fs, dir: gitRepoDir, path: key, value });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('git:getStatus', async () => {
    if (!gitRepoDir) return { files: [], branch: 'HEAD' };
    try {
      const matrix = await isomorphicGit.statusMatrix({ fs, dir: gitRepoDir });
      return {
        files: matrix
          .map(([f, h, w]: any) => ({
            path: f,
            status:
              h === 1 && w === 2
                ? 'modified'
                : h === 0 && w === 2
                  ? 'added'
                  : h === 1 && w === 0
                    ? 'deleted'
                    : 'unmodified',
          }))
          .filter((f: any) => f.status !== 'unmodified'),
        branch: 'HEAD',
      };
    } catch {
      return { files: [], branch: 'HEAD' };
    }
  });

  ipcMain.handle('git:add', async (_, files: string | string[]) => {
    if (!gitRepoDir) return { success: false };
    try {
      for (const f of Array.isArray(files) ? files : [files]) {
        await isomorphicGit.add({ fs, dir: gitRepoDir, filepath: f });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('git:commit', async (_, msg: string) => {
    if (!gitRepoDir) return { success: false, oid: '' };
    try {
      const oid = await isomorphicGit.commit({
        fs,
        dir: gitRepoDir,
        message: msg,
        author: { name: 'User', email: 'user@example.com' },
      });
      return { success: true, oid };
    } catch (e: any) {
      return { success: false, error: e.message, oid: '' };
    }
  });

  ipcMain.handle('git:getLog', async (_, count = 10) => {
    if (!gitRepoDir) return [];
    try {
      const log = await isomorphicGit.log({ fs, dir: gitRepoDir, depth: count });
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

  ipcMain.handle('git:getCurrentBranch', async () => {
    if (!gitRepoDir) return 'HEAD';
    try {
      return (
        (await isomorphicGit.currentBranch({ fs, dir: gitRepoDir, fullname: false })) || 'HEAD'
      );
    } catch {
      return 'HEAD';
    }
  });

  ipcMain.handle('git:selectRepo', async () => {
    const r = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return r.canceled ? { canceled: true } : { canceled: false, path: r.filePaths[0] };
  });
}

export default setupGitIpcHandlers;
