import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileSystemService } from '../../src/services/FileSystemService';

// Mock window.electronAPI
const mockElectronAPI = {
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  fileExists: vi.fn(),
};

describe('FileSystemService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
      configurable: true,
    });
  });

  describe('openFileDialog', () => {
    it('should open file dialog and return selected path', async () => {
      mockElectronAPI.showOpenDialog.mockResolvedValueOnce({
        canceled: false,
        filePaths: ['/path/to/file.ts'],
      });

      const result = await FileSystemService.openFileDialog();
      expect(result).toBe('/path/to/file.ts');
      expect(mockElectronAPI.showOpenDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: ['openFile'],
        })
      );
    });

    it('should return null when dialog is canceled', async () => {
      mockElectronAPI.showOpenDialog.mockResolvedValueOnce({
        canceled: true,
        filePaths: [],
      });

      const result = await FileSystemService.openFileDialog();
      expect(result).toBeNull();
    });

    it('should return null when no file selected', async () => {
      mockElectronAPI.showOpenDialog.mockResolvedValueOnce({
        canceled: false,
        filePaths: [],
      });

      const result = await FileSystemService.openFileDialog();
      expect(result).toBeNull();
    });

    it('should use custom filters when provided', async () => {
      mockElectronAPI.showOpenDialog.mockResolvedValueOnce({
        canceled: false,
        filePaths: ['/path/to/file.py'],
      });

      const customFilters = [{ name: 'Python', extensions: ['py'] }];
      await FileSystemService.openFileDialog(customFilters);

      expect(mockElectronAPI.showOpenDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: customFilters,
        })
      );
    });

    it('should return null when Electron API is not available', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
      });

      const result = await FileSystemService.openFileDialog();
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockElectronAPI.showOpenDialog.mockRejectedValueOnce(new Error('Dialog failed'));

      const result = await FileSystemService.openFileDialog();
      expect(result).toBeNull();
    });
  });

  describe('saveFileDialog', () => {
    it('should open save dialog and return file path', async () => {
      mockElectronAPI.showSaveDialog.mockResolvedValueOnce({
        canceled: false,
        filePath: '/path/to/save.ts',
      });

      const result = await FileSystemService.saveFileDialog();
      expect(result).toBe('/path/to/save.ts');
    });

    it('should return null when dialog is canceled', async () => {
      mockElectronAPI.showSaveDialog.mockResolvedValueOnce({
        canceled: true,
        filePath: null,
      });

      const result = await FileSystemService.saveFileDialog();
      expect(result).toBeNull();
    });

    it('should use default path when provided', async () => {
      mockElectronAPI.showSaveDialog.mockResolvedValueOnce({
        canceled: false,
        filePath: '/path/to/save.ts',
      });

      await FileSystemService.saveFileDialog('/default/path.ts');

      expect(mockElectronAPI.showSaveDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultPath: '/default/path.ts',
        })
      );
    });

    it('should return null when Electron API is not available', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
      });

      const result = await FileSystemService.saveFileDialog();
      expect(result).toBeNull();
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const content = 'console.log("hello");';
      mockElectronAPI.readFile.mockResolvedValueOnce(content);

      const result = await FileSystemService.readFile('/path/to/file.ts');
      expect(result).toBe(content);
      expect(mockElectronAPI.readFile).toHaveBeenCalledWith('/path/to/file.ts');
    });

    it('should throw error when read fails', async () => {
      mockElectronAPI.readFile.mockRejectedValueOnce(new Error('Read failed'));

      await expect(FileSystemService.readFile('/path/to/file.ts'))
        .rejects
        .toThrow('Failed to read file: /path/to/file.ts');
    });

    it('should throw error when Electron API is not available', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
      });

      await expect(FileSystemService.readFile('/path/to/file.ts'))
        .rejects
        .toThrow('Electron API not available');
    });
  });

  describe('writeFile', () => {
    it('should write file content', async () => {
      const content = 'console.log("hello");';
      mockElectronAPI.writeFile.mockResolvedValueOnce(undefined);

      await FileSystemService.writeFile('/path/to/file.ts', content);
      expect(mockElectronAPI.writeFile).toHaveBeenCalledWith('/path/to/file.ts', content);
    });

    it('should throw error when write fails', async () => {
      mockElectronAPI.writeFile.mockRejectedValueOnce(new Error('Write failed'));

      await expect(FileSystemService.writeFile('/path/to/file.ts', 'content'))
        .rejects
        .toThrow('Failed to write file: /path/to/file.ts');
    });

    it('should throw error when Electron API is not available', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
      });

      await expect(FileSystemService.writeFile('/path/to/file.ts', 'content'))
        .rejects
        .toThrow('Electron API not available');
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockElectronAPI.fileExists.mockResolvedValueOnce(true);

      const result = await FileSystemService.fileExists('/path/to/file.ts');
      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      mockElectronAPI.fileExists.mockResolvedValueOnce(false);

      const result = await FileSystemService.fileExists('/path/to/nonexistent.ts');
      expect(result).toBe(false);
    });

    it('should return false when check fails', async () => {
      mockElectronAPI.fileExists.mockRejectedValueOnce(new Error('Check failed'));

      const result = await FileSystemService.fileExists('/path/to/file.ts');
      expect(result).toBe(false);
    });

    it('should return false when Electron API is not available', async () => {
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
      });

      const result = await FileSystemService.fileExists('/path/to/file.ts');
      expect(result).toBe(false);
    });
  });

  describe('getFileLanguage', () => {
    it('should detect typescript from path', () => {
      const language = FileSystemService.getFileLanguage('/path/to/file.ts');
      expect(language).toBe('typescript');
    });

    it('should detect python from path', () => {
      const language = FileSystemService.getFileLanguage('/path/to/file.py');
      expect(language).toBe('python');
    });

    it('should detect rust from path', () => {
      const language = FileSystemService.getFileLanguage('/path/to/file.rs');
      expect(language).toBe('rust');
    });
  });

  describe('isLargeFile', () => {
    it('should return false for small files', async () => {
      mockElectronAPI.readFile.mockResolvedValueOnce('small content');

      const result = await FileSystemService.isLargeFile('/path/to/small.ts');
      expect(result.isLarge).toBe(false);
      expect(result.size).toBeLessThan(1024 * 1024);
    });

    it('should return true for large files', async () => {
      const largeContent = 'x'.repeat(1024 * 1024 * 2); // 2MB
      mockElectronAPI.readFile.mockResolvedValueOnce(largeContent);

      const result = await FileSystemService.isLargeFile('/path/to/large.ts');
      expect(result.isLarge).toBe(true);
      expect(result.size).toBeGreaterThan(1024 * 1024);
    });

    it('should return false when check fails', async () => {
      mockElectronAPI.readFile.mockRejectedValueOnce(new Error('Read failed'));

      const result = await FileSystemService.isLargeFile('/path/to/file.ts');
      expect(result).toEqual({ isLarge: false, size: 0 });
    });
  });
});
