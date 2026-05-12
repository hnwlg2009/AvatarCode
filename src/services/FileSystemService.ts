import { ipcRenderer } from 'electron';

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modifiedTime: Date;
  createdTime: Date;
}

export interface FileStat {
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
  size: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  mode: number;
}

export interface SearchOptions {
  pattern: string;
  exclude?: string[];
  maxResults?: number;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  mtime: Date;
}

class FileSystemService {
  private fileCache = new Map<string, { content: string; timestamp: number }>();
  private readonly CACHE_TTL = 5000;

  async readFile(path: string): Promise<string> {
    const cached = this.fileCache.get(path);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.content;
    }

    const content = await ipcRenderer.invoke('file:read', path);
    this.fileCache.set(path, { content, timestamp: Date.now() });
    return content;
  }

  async readBinaryFile(path: string): Promise<Uint8Array> {
    return await ipcRenderer.invoke('file:readBinary', path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    await ipcRenderer.invoke('file:write', path, content);
    this.fileCache.delete(path);
  }

  async writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
    await ipcRenderer.invoke('file:writeBinary', path, data);
  }

  async readdir(path: string): Promise<FileEntry[]> {
    return await ipcRenderer.invoke('file:readdir', path);
  }

  async stat(path: string): Promise<FileStat> {
    return await ipcRenderer.invoke('file:stat', path);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  async createFile(path: string, content = ''): Promise<void> {
    await ipcRenderer.invoke('file:create', path, content);
  }

  async createDirectory(path: string): Promise<void> {
    await ipcRenderer.invoke('file:createDirectory', path);
  }

  async delete(path: string, recursive = false): Promise<void> {
    await ipcRenderer.invoke('file:delete', path, recursive);
    this.fileCache.delete(path);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await ipcRenderer.invoke('file:rename', oldPath, newPath);
    const cached = this.fileCache.get(oldPath);
    if (cached) {
      this.fileCache.delete(oldPath);
      this.fileCache.set(newPath, cached);
    }
  }

  async copy(sourcePath: string, destPath: string): Promise<void> {
    await ipcRenderer.invoke('file:copy', sourcePath, destPath);
  }

  async searchFiles(
    pattern: string,
    options?: SearchOptions
  ): Promise<FileInfo[]> {
    return await ipcRenderer.invoke('file:search', pattern, options);
  }

  async openFileDialog(): Promise<string | null> {
    const { filePaths } = await ipcRenderer.invoke('dialog:openFile');
    return filePaths[0] || null;
  }

  getFileLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      html: 'html',
      css: 'css',
      scss: 'scss',
      less: 'less',
      json: 'json',
      md: 'markdown',
      sh: 'shell',
      sql: 'sql',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      vue: 'vue',
      svelte: 'svelte',
    };
    return languageMap[ext] || 'plaintext';
  }
}

export const fileSystemService = new FileSystemService();
export { FileSystemService };
export default fileSystemService;
