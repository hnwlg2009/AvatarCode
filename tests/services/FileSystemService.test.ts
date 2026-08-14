import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileSystemService } from '../../src/services/FileSystemService';

// 每个用例用独立实例，避免模块级单例的读缓存串扰
function newService(): FileSystemService {
  return new FileSystemService();
}

// Mock window.electronAPI（与 electron/preload.ts 暴露的对象形态一致）
const mockElectronAPI = {
  file: {
    read: vi.fn(),
    readBinary: vi.fn(),
    write: vi.fn(),
    writeBinary: vi.fn(),
    exists: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    create: vi.fn(),
    createDirectory: vi.fn(),
    delete: vi.fn(),
    rename: vi.fn(),
    copy: vi.fn(),
    search: vi.fn(),
    searchCode: vi.fn(),
  },
  openFileDialog: vi.fn(),
  saveFileDialog: vi.fn(),
  openDirectoryDialog: vi.fn(),
};

function setApi(api: any) {
  Object.defineProperty(window, 'electronAPI', {
    value: api,
    writable: true,
    configurable: true,
  });
}

let svc: FileSystemService;

beforeEach(() => {
  vi.clearAllMocks();
  setApi(mockElectronAPI);
  svc = new FileSystemService();
});

describe('FileSystemService', () => {
  describe('openFileDialog', () => {
    it('should open file dialog and return selected path', async () => {
      mockElectronAPI.openFileDialog.mockResolvedValueOnce('/path/to/file.ts');

      const svc = newService();
      const result = await svc.openFileDialog();
      expect(result).toBe('/path/to/file.ts');
      expect(mockElectronAPI.openFileDialog).toHaveBeenCalled();
    });

    it('should return null when dialog is canceled', async () => {
      mockElectronAPI.openFileDialog.mockResolvedValueOnce(null);

      const svc = newService();
      const result = await svc.openFileDialog();
      expect(result).toBeNull();
    });

    it('should return null when Electron API is not available', async () => {
      setApi(undefined);

      const svc = newService();
      const result = await svc.openFileDialog();
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockElectronAPI.openFileDialog.mockRejectedValueOnce(new Error('Dialog failed'));

      const svc = newService();
      const result = await svc.openFileDialog();
      expect(result).toBeNull();
    });
  });

  describe('saveFileDialog', () => {
    it('should open save dialog and return file path', async () => {
      mockElectronAPI.saveFileDialog.mockResolvedValueOnce('/path/to/save.ts');

      const result = await svc.saveFileDialog();
      expect(result).toBe('/path/to/save.ts');
    });

    it('should return null when dialog is canceled', async () => {
      mockElectronAPI.saveFileDialog.mockResolvedValueOnce(null);

      const result = await svc.saveFileDialog();
      expect(result).toBeNull();
    });

    it('should return null when Electron API is not available', async () => {
      setApi(undefined);

      const result = await svc.saveFileDialog();
      expect(result).toBeNull();
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const content = 'console.log("hello");';
      mockElectronAPI.file.read.mockResolvedValueOnce(content);

      const result = await svc.readFile('/path/to/file.ts');
      expect(result).toBe(content);
      expect(mockElectronAPI.file.read).toHaveBeenCalledWith('/path/to/file.ts');
    });

    it('should use cache for repeated reads within TTL', async () => {
      mockElectronAPI.file.read.mockResolvedValueOnce('cached content');

      const first = await svc.readFile('/path/to/file.ts');
      const second = await svc.readFile('/path/to/file.ts');
      expect(first).toBe('cached content');
      expect(second).toBe('cached content');
      expect(mockElectronAPI.file.read).toHaveBeenCalledTimes(1);
    });

    it('should throw error when read fails', async () => {
      mockElectronAPI.file.read.mockRejectedValueOnce(new Error('Read failed'));

      await expect(svc.readFile('/path/to/file.ts')).rejects.toThrow('Read failed');
    });

    it('should throw error when Electron API is not available', async () => {
      setApi(undefined);

      await expect(svc.readFile('/path/to/file.ts')).rejects.toThrow(
        'electronAPI is not available'
      );
    });
  });

  describe('writeFile', () => {
    it('should write file content and clear cache', async () => {
      mockElectronAPI.file.read.mockResolvedValueOnce('old');
      await svc.readFile('/path/to/file.ts');

      mockElectronAPI.file.write.mockResolvedValueOnce(undefined);
      await svc.writeFile('/path/to/file.ts', 'new content');
      expect(mockElectronAPI.file.write).toHaveBeenCalledWith('/path/to/file.ts', 'new content');

      mockElectronAPI.file.read.mockResolvedValueOnce('new content');
      const reread = await svc.readFile('/path/to/file.ts');
      expect(reread).toBe('new content');
      expect(mockElectronAPI.file.read).toHaveBeenCalledTimes(2);
    });

    it('should throw error when write fails', async () => {
      mockElectronAPI.file.write.mockRejectedValueOnce(new Error('Write failed'));

      await expect(svc.writeFile('/path/to/file.ts', 'content')).rejects.toThrow(
        'Write failed'
      );
    });

    it('should throw error when Electron API is not available', async () => {
      setApi(undefined);

      await expect(svc.writeFile('/path/to/file.ts', 'content')).rejects.toThrow(
        'electronAPI is not available'
      );
    });
  });

  describe('exists', () => {
    it('should return true when file exists', async () => {
      mockElectronAPI.file.stat.mockResolvedValueOnce({ isFile: true, isDirectory: false });

      const result = await svc.exists('/path/to/file.ts');
      expect(result).toBe(true);
    });

    it('should return false when stat fails', async () => {
      mockElectronAPI.file.stat.mockRejectedValueOnce(new Error('ENOENT'));

      const result = await svc.exists('/path/to/nonexistent.ts');
      expect(result).toBe(false);
    });
  });

  describe('getFileLanguage', () => {
    let svc: FileSystemService;
    beforeEach(() => {
      svc = new FileSystemService();
    });

    it('should detect typescript from path', () => {
      expect(svc.getFileLanguage('/path/to/file.ts')).toBe('typescript');
    });

    it('should detect python from path', () => {
      expect(svc.getFileLanguage('/path/to/file.py')).toBe('python');
    });

    it('should detect rust from path', () => {
      expect(svc.getFileLanguage('/path/to/file.rs')).toBe('rust');
    });
  });

  describe('searchCode', () => {
    it('should delegate to electronAPI.file.searchCode', async () => {
      const results = [{ path: '/p/a.ts', line: 3, snippet: 'const x = 1;' }];
      mockElectronAPI.file.searchCode.mockResolvedValueOnce(results);

      const out = await svc.searchCode('x', '/root', 10);
      expect(out).toEqual(results);
      expect(mockElectronAPI.file.searchCode).toHaveBeenCalledWith('x', '/root', 10);
    });
  });
});
