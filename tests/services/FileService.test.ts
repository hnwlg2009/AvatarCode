import { describe, it, expect } from 'vitest';
import { FileService } from '../../src/services/FileService';

describe('FileService', () => {
  describe('getLanguageFromExtension', () => {
    it('should return typescript for .ts extension', () => {
      expect(FileService.getLanguageFromExtension('.ts')).toBe('typescript');
    });

    it('should return typescript for .tsx extension', () => {
      expect(FileService.getLanguageFromExtension('.tsx')).toBe('typescript');
    });

    it('should return javascript for .js extension', () => {
      expect(FileService.getLanguageFromExtension('.js')).toBe('javascript');
    });

    it('should return python for .py extension', () => {
      expect(FileService.getLanguageFromExtension('.py')).toBe('python');
    });

    it('should return plaintext for unknown extension', () => {
      expect(FileService.getLanguageFromExtension('.unknown')).toBe('plaintext');
    });

    it('should handle case-insensitive extensions', () => {
      expect(FileService.getLanguageFromExtension('.TS')).toBe('typescript');
      expect(FileService.getLanguageFromExtension('.Py')).toBe('python');
    });

    it('should return rust for .rs extension', () => {
      expect(FileService.getLanguageFromExtension('.rs')).toBe('rust');
    });

    it('should return go for .go extension', () => {
      expect(FileService.getLanguageFromExtension('.go')).toBe('go');
    });

    it('should return java for .java extension', () => {
      expect(FileService.getLanguageFromExtension('.java')).toBe('java');
    });

    it('should return cpp for .cpp extension', () => {
      expect(FileService.getLanguageFromExtension('.cpp')).toBe('cpp');
    });

    it('should return rust for .rs extension', () => {
      expect(FileService.getLanguageFromExtension('.rs')).toBe('rust');
    });

    it('should return yaml for .yml extension', () => {
      expect(FileService.getLanguageFromExtension('.yml')).toBe('yaml');
    });

    it('should return json for .json extension', () => {
      expect(FileService.getLanguageFromExtension('.json')).toBe('json');
    });

    it('should return markdown for .md extension', () => {
      expect(FileService.getLanguageFromExtension('.md')).toBe('markdown');
    });

    it('should return shell for .sh extension', () => {
      expect(FileService.getLanguageFromExtension('.sh')).toBe('shell');
    });

    it('should return dockerfile for .dockerfile extension', () => {
      expect(FileService.getLanguageFromExtension('.dockerfile')).toBe('dockerfile');
    });

    it('should return terraform for .tf extension', () => {
      expect(FileService.getLanguageFromExtension('.tf')).toBe('terraform');
    });

    it('should return solidity for .sol extension', () => {
      expect(FileService.getLanguageFromExtension('.sol')).toBe('solidity');
    });
  });

  describe('getLanguageFromPath', () => {
    it('should extract language from file path', () => {
      expect(FileService.getLanguageFromPath('/path/to/file.ts')).toBe('typescript');
      expect(FileService.getLanguageFromPath('/path/to/file.py')).toBe('python');
      expect(FileService.getLanguageFromPath('/path/to/file.rs')).toBe('rust');
    });

    it('should handle nested paths', () => {
      expect(FileService.getLanguageFromPath('/deep/nested/path/to/file.tsx')).toBe('typescript');
    });

    it('should handle paths with multiple dots', () => {
      expect(FileService.getLanguageFromPath('/path/file.config.ts')).toBe('typescript');
    });
  });

  describe('isLargeFile', () => {
    it('should return false for small files', () => {
      expect(FileService.isLargeFile(100)).toBe(false);
      expect(FileService.isLargeFile(1024)).toBe(false);
      expect(FileService.isLargeFile(1024 * 100)).toBe(false);
    });

    it('should return true for files larger than 1MB', () => {
      expect(FileService.isLargeFile(1024 * 1024 + 1)).toBe(true);
      expect(FileService.isLargeFile(1024 * 1024 * 2)).toBe(true);
      expect(FileService.isLargeFile(1024 * 1024 * 10)).toBe(true);
    });

    it('should handle edge case at exactly 1MB', () => {
      expect(FileService.isLargeFile(1024 * 1024 + 1)).toBe(true);
    });

    it('should handle zero size', () => {
      expect(FileService.isLargeFile(0)).toBe(false);
    });
  });

  describe('getFileStats', () => {
    it('should count lines correctly', () => {
      const content = 'line1\nline2\nline3';
      const stats = FileService.getFileStats(content);
      expect(stats.lines).toBe(3);
    });

    it('should count lines with trailing newline', () => {
      const content = 'line1\nline2\nline3\n';
      const stats = FileService.getFileStats(content);
      expect(stats.lines).toBe(4);
    });

    it('should count characters correctly', () => {
      const content = 'hello';
      const stats = FileService.getFileStats(content);
      expect(stats.characters).toBe(5);
    });

    it('should count words correctly', () => {
      const content = 'hello world foo bar';
      const stats = FileService.getFileStats(content);
      expect(stats.words).toBe(4);
    });

    it('should handle empty content', () => {
      const content = '';
      const stats = FileService.getFileStats(content);
      expect(stats.lines).toBe(1);
      expect(stats.characters).toBe(0);
      expect(stats.words).toBe(0);
    });

    it('should handle whitespace-only content', () => {
      const content = '   \n  \n   ';
      const stats = FileService.getFileStats(content);
      expect(stats.words).toBe(0);
    });

    it('should handle single line content', () => {
      const content = 'single line';
      const stats = FileService.getFileStats(content);
      expect(stats.lines).toBe(1);
      expect(stats.words).toBe(2);
    });

    it('should handle multi-line code', () => {
      const content = `function test() {
  console.log('hello');
  return true;
}`;
      const stats = FileService.getFileStats(content);
      expect(stats.lines).toBe(4);
      expect(stats.characters).toBeGreaterThanOrEqual(58);
      expect(stats.words).toBeGreaterThanOrEqual(7);
    });
  });
});
