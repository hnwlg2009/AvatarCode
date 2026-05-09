import { ipcMain, app, dialog } from 'electron';
import fs from 'fs/promises';
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
    this.allowedPaths.add(app.getPath('userData'));
    this.allowedPaths.add(app.getPath('temp'));
  }

  addAllowedPath(workspacePath: string): void {
    this.allowedPaths.add(workspacePath);
  }

  isPathAllowed(targetPath: string): boolean {
    const normalized = path.normalize(targetPath);
    for (const allowed of this.allowedPaths) {
      if (normalized.startsWith(allowed)) {
        return true;
      }
    }
    return false;
  }

  validatePath(targetPath: string): void {
    const normalized = path.normalize(targetPath);
    if (!this.isPathAllowed(normalized)) {
      throw new Error(`路径不允许访问：${targetPath}`);
    }
    
    if (normalized.includes('..')) {
      const resolved = path.resolve(normalized);
      if (!this.isPathAllowed(resolved)) {
        throw new Error('路径遍历攻击被阻止');
      }
    }
  }
}

const pathSecurity = new PathSecurity();

function normalizedPath(filePath: string): string {
  return path.normalize(filePath);
}

export function registerFileHandlers(): void {
  ipcMain.handle('file:read', async (event, filePath: string) => {
    pathSecurity.validatePath(filePath);
    return await fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle('file:write', async (event, filePath: string, content: string) => {
    pathSecurity.validatePath(filePath);
    await fs.writeFile(filePath, content, 'utf-8');
  });

  ipcMain.handle('file:readBinary', async (event, filePath: string) => {
    pathSecurity.validatePath(filePath);
    const buffer = await fs.readFile(filePath);
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  });

  ipcMain.handle('file:writeBinary', async (event, filePath: string, data: Uint8Array) => {
    pathSecurity.validatePath(filePath);
    await fs.writeFile(filePath, Buffer.from(data));
  });

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

  ipcMain.handle('file:delete', async (event, filePath: string, recursive = false) => {
    pathSecurity.validatePath(filePath);
    if (recursive) {
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.unlink(filePath);
    }
  });

  ipcMain.handle('file:rename', async (event, oldPath: string, newPath: string) => {
    pathSecurity.validatePath(oldPath);
    pathSecurity.validatePath(newPath);
    await fs.rename(oldPath, newPath);
  });

  ipcMain.handle('file:copy', async (event, sourcePath: string, destPath: string) => {
    pathSecurity.validatePath(sourcePath);
    pathSecurity.validatePath(destPath);
    await fs.copyFile(sourcePath, destPath);
  });

  ipcMain.handle('file:create', async (event, filePath: string, content = '') => {
    pathSecurity.validatePath(filePath);
    await fs.writeFile(filePath, content, 'utf-8');
  });

  ipcMain.handle('file:createDirectory', async (event, dirPath: string) => {
    pathSecurity.validatePath(dirPath);
    await fs.mkdir(dirPath, { recursive: true });
  });

  ipcMain.handle('file:addWorkspacePath', async (event, workspacePath: string) => {
    pathSecurity.addAllowedPath(workspacePath);
  });

  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
    });
    return result;
  });

  ipcMain.handle('dialog:saveFile', async () => {
    const result = await dialog.showSaveDialog({});
    return result;
  });

  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result;
  });
}

export default pathSecurity;
