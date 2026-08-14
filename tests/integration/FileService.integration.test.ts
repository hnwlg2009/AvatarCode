import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileService } from '../../src/services/FileService';

describe('FileService - Integration Tests', () => {
  describe('language detection workflow', () => {
    it('should handle complete file path workflow', () => {
      const files = [
        { path: '/project/src/index.ts', expected: 'typescript' },
        { path: '/project/src/App.tsx', expected: 'typescript' },
        { path: '/project/src/utils/helper.js', expected: 'javascript' },
        { path: '/project/src/components/Button.jsx', expected: 'javascript' },
        { path: '/project/api/routes.py', expected: 'python' },
        { path: '/project/main.go', expected: 'go' },
        { path: '/project/lib.rs', expected: 'rust' },
        { path: '/project/Makefile', expected: 'plaintext' }, // No extension
        { path: '/project/.gitignore', expected: 'plaintext' }, // Dotfile
      ];

      files.forEach(({ path, expected }) => {
        const language = FileService.getLanguageFromPath(path);
        expect(language).toBe(expected);
      });
    });

    it('should detect common web project files', () => {
      const webFiles = [
        'index.html',
        'styles.css',
        'app.scss',
        'config.json',
        'data.yaml',
        'schema.xml',
        'README.md',
      ];

      webFiles.forEach((file) => {
        const language = FileService.getLanguageFromPath(file);
        expect(language).not.toBe('plaintext');
      });
    });
  });

  describe('file size handling', () => {
    it('should correctly classify files by size', () => {
      const sizes = [
        { bytes: 100, isLarge: false },
        { bytes: 1024, isLarge: false },
        { bytes: 10240, isLarge: false },
        { bytes: 102400, isLarge: false },
        { bytes: 524288, isLarge: false }, // 512KB
        { bytes: 1048576, isLarge: true }, // 1MB - threshold
        { bytes: 2097152, isLarge: true }, // 2MB
        { bytes: 10485760, isLarge: true }, // 10MB
      ];

      sizes.forEach(({ bytes, isLarge }) => {
        expect(FileService.isLargeFile(bytes)).toBe(isLarge);
      });
    });

    it('should handle edge cases', () => {
      expect(FileService.isLargeFile(-1)).toBe(false); // Negative
      expect(FileService.isLargeFile(0)).toBe(false); // Zero
    });
  });

  describe('file statistics', () => {
    it('should handle various content types', () => {
      const testCases = [
        {
          name: 'Empty file',
          content: '',
          expected: { lines: 1, words: 0 },
        },
        {
          name: 'Single line',
          content: 'const x = 1;',
          expected: { lines: 1, words: 4 },
        },
        {
          name: 'Multi-line code',
          content: 'function test() {\n  return true;\n}',
          expected: { lines: 3, words: 6 },
        },
        {
          name: 'Code with comments',
          content: '// Comment\nconst x = 1; /* Block */',
          expected: { lines: 2, words: 6 },
        },
        {
          name: 'String with spaces',
          content: 'const str = "hello world";',
          expected: { lines: 1, words: 4 },
        },
        {
          name: 'Markdown',
          content: '# Heading\n\nParagraph with **bold**.\n\n- List\n- Items',
          expected: { lines: 6, words: 6 },
        },
      ];

      testCases.forEach(({ name, content, expected }) => {
        const stats = FileService.getFileStats(content);
        expect(stats.lines).toBeGreaterThanOrEqual(expected.lines);
        expect(stats.words).toBeGreaterThanOrEqual(expected.words);
      });
    });
  });
});
