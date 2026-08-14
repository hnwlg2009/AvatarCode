import { ipcMain, app, dialog } from 'electron';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modifiedTime: Date;
  createdTime: Date;
}

interface FileStat {
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
  size: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  mode: number;
}

class PathSecurity {
  private allowedPaths: Set<string> = new Set();

  constructor() {
    // 默认允许应用数据目录
    this.allowedPaths.add(app.getPath('userData'));
    this.allowedPaths.add(app.getPath('temp'));
  }

  addAllowedPath(workspacePath: string): void {
    this.allowedPaths.add(workspacePath);
  }

  // 追根：目标若存在则解析真实路径（防 symlink 逃逸）；不存在则回退到最近真实祖先 + 剩余片段
  private toCanonical(targetPath: string): string {
    let resolved = path.resolve(targetPath);
    const suffix: string[] = [];

    while (true) {
      try {
        const real = fsSync.realpathSync(resolved);
        return path.join(real, ...suffix.reverse());
      } catch {
        const parent = path.dirname(resolved);
        if (parent === resolved) {
          return path.resolve(targetPath);
        }
        suffix.push(path.basename(resolved));
        resolved = parent;
      }
    }
  }

  isPathAllowed(targetPath: string): boolean {
    const target = this.toCanonical(targetPath).toLowerCase();

    for (const allowedRoot of this.allowedPaths) {
      const root = this.toCanonical(allowedRoot).toLowerCase();
      if (target === root || target.startsWith(root + path.sep)) {
        return true;
      }
    }
    return false;
  }

  validatePath(targetPath: string): void {
    if (!this.isPathAllowed(targetPath)) {
      throw new Error(`路径不允许访问：${targetPath}`);
    }
  }
}

const pathSecurity = new PathSecurity();

export function registerFileHandlers(): void {
  // FS-001: file:read handler ✅
  ipcMain.handle('file:read', async (event, filePath: string) => {
    pathSecurity.validatePath(filePath);
    return await fs.readFile(filePath, 'utf-8');
  });

  // FS-002: file:write handler ✅
  ipcMain.handle('file:write', async (event, filePath: string, content: string) => {
    pathSecurity.validatePath(filePath);
    await fs.writeFile(filePath, content, 'utf-8');
  });

  // FS-001: file:readBinary handler ✅
  ipcMain.handle('file:readBinary', async (event, filePath: string) => {
    pathSecurity.validatePath(filePath);
    const buffer = await fs.readFile(filePath);
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  });

  // FS-002: file:writeBinary handler ✅
  ipcMain.handle('file:writeBinary', async (event, filePath: string, data: Uint8Array) => {
    pathSecurity.validatePath(filePath);
    await fs.writeFile(filePath, Buffer.from(data));
  });

  // FS-001: file:exists handler
  ipcMain.handle('file:exists', async (event, filePath: string): Promise<boolean> => {
    pathSecurity.validatePath(filePath);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  // FS-003: file:readdir handler 🆕
  ipcMain.handle('file:readdir', async (event, dirPath: string): Promise<FileEntry[]> => {
    pathSecurity.validatePath(dirPath);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    const fileEntries: FileEntry[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const stat = await fs.stat(fullPath);

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
  ipcMain.handle('file:stat', async (event, filePath: string): Promise<FileStat> => {
    pathSecurity.validatePath(filePath);
    const stat = await fs.stat(filePath);

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
  ipcMain.handle('file:delete', async (event, filePath: string, recursive = false) => {
    pathSecurity.validatePath(filePath);
    if (recursive) {
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.unlink(filePath);
    }
  });

  // FS-006: file:rename handler 🆕
  ipcMain.handle('file:rename', async (event, oldPath: string, newPath: string) => {
    pathSecurity.validatePath(oldPath);
    pathSecurity.validatePath(newPath);
    await fs.rename(oldPath, newPath);
  });

  // FS-006: file:copy handler 🆕
  ipcMain.handle('file:copy', async (event, sourcePath: string, destPath: string) => {
    pathSecurity.validatePath(sourcePath);
    pathSecurity.validatePath(destPath);
    await fs.copyFile(sourcePath, destPath);
  });

  // FS-003: file:create handler 🆕
  ipcMain.handle('file:create', async (event, filePath: string, content = '') => {
    pathSecurity.validatePath(filePath);
    await fs.writeFile(filePath, content, 'utf-8');
  });

  // FS-003: file:createDirectory handler 🆕
  ipcMain.handle('file:createDirectory', async (event, dirPath: string) => {
    pathSecurity.validatePath(dirPath);
    await fs.mkdir(dirPath, { recursive: true });
  });

  // 工作空间路径管理
  ipcMain.handle('file:addWorkspacePath', async (event, workspacePath: string) => {
    pathSecurity.addAllowedPath(workspacePath);
  });

  // 代码搜索：递归目录，关键字匹配，返回 path/line/snippet
  ipcMain.handle(
    'file:searchCode',
    async (event, query: string, dirPath?: string, maxResults: number = 50) => {
      pathSecurity.validatePath(dirPath || app.getPath('userData'));

      const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out']);
      const TEXT_EXTS = new Set([
        'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'md', 'css', 'scss', 'less',
        'html', 'htm', 'vue', 'svelte', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs',
        'go', 'rs', 'rb', 'php', 'sql', 'yaml', 'yml', 'xml', 'sh', 'bat', 'toml',
        'ini', 'cfg', 'txt', 'graphql', 'prisma',
      ]);

      const results: { path: string; line: number; snippet: string }[] = [];
      const root = dirPath || app.getPath('userData');

      async function walk(dir: string): Promise<void> {
        if (results.length >= maxResults) return;
        let entries;
        try {
          entries = await fs.readdir(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          if (results.length >= maxResults) return;
          if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.has(entry.name)) continue;
            await walk(path.join(dir, entry.name));
          } else if (entry.isFile()) {
            const ext = entry.name.split('.').pop()?.toLowerCase() || '';
            if (!TEXT_EXTS.has(ext)) continue;
            const fullPath = path.join(dir, entry.name);
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              const lines = content.split(/\r?\n/);
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(query.toLowerCase())) {
                  results.push({
                    path: fullPath,
                    line: i + 1,
                    snippet: lines[i].trim().slice(0, 200),
                  });
                  if (results.length >= maxResults) return;
                }
              }
            } catch {
              // skip unreadable files
            }
          }
        }
      }

      await walk(root);
      return results;
    }
  );

  // 文件名搜索：递归目录，按名称匹配 pattern
  ipcMain.handle('file:search', async (event, pattern: string, options?: any) => {
    const root = app.getPath('userData');
    const exclude = options?.exclude || ['node_modules', '.git', 'dist', 'build', 'out'];
    const maxResults = options?.maxResults || 100;

    const results: { path: string; name: string; size: number; mtime: Date }[] = [];
    const needle = pattern.toLowerCase();

    async function walk(dir: string): Promise<void> {
      if (results.length >= maxResults) return;
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (results.length >= maxResults) return;
        if (entry.isDirectory()) {
          if (exclude.includes(entry.name)) continue;
          await walk(path.join(dir, entry.name));
        } else if (entry.name.toLowerCase().includes(needle)) {
          const fullPath = path.join(dir, entry.name);
          try {
            const stat = await fs.stat(fullPath);
            results.push({
              path: fullPath,
              name: entry.name,
              size: stat.size,
              mtime: stat.mtime,
            });
          } catch {
            // skip
          }
        }
      }
    }

    await walk(root);
    return results;
  });

  // 文件对话框
  ipcMain.handle('dialog:openFile', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      // 用户主动选择的文件，其所在目录自动授权，避免拒绝已选路径
      pathSecurity.addAllowedPath(path.dirname(result.filePaths[0]));
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('dialog:saveFile', async (): Promise<string | null> => {
    const result = await dialog.showSaveDialog({});
    if (!result.canceled && result.filePath) {
      pathSecurity.addAllowedPath(path.dirname(result.filePath));
      return result.filePath;
    }
    return null;
  });
}

export default pathSecurity;
