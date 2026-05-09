import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../../src/stores/editorStore';

describe('EditorStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useEditorStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useEditorStore.getState();
      
      expect(state.currentFile).toBeNull();
      expect(state.fileContent).toBe('');
      expect(state.language).toBe('plaintext');
      expect(state.cursorPosition).toBeNull();
      expect(state.selection).toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should have default editor config', () => {
      const state = useEditorStore.getState();
      expect(state.config).toBeDefined();
      expect(state.config.theme).toBe('vs-dark');
      expect(state.config.fontSize).toBe(14);
    });
  });

  describe('setCurrentFile', () => {
    it('should set current file path', () => {
      const store = useEditorStore.getState();
      store.setCurrentFile('/path/to/file.ts');
      
      expect(useEditorStore.getState().currentFile).toBe('/path/to/file.ts');
    });

    it('should accept any string path', () => {
      const store = useEditorStore.getState();
      store.setCurrentFile('relative/path/file.py');
      
      expect(useEditorStore.getState().currentFile).toBe('relative/path/file.py');
    });
  });

  describe('setFileContent', () => {
    it('should set file content and mark as dirty', () => {
      const store = useEditorStore.getState();
      store.setFileContent('console.log("hello");');
      
      const state = useEditorStore.getState();
      expect(state.fileContent).toBe('console.log("hello");');
      expect(state.isDirty).toBe(true);
    });

    it('should handle empty content', () => {
      const store = useEditorStore.getState();
      store.setFileContent('');
      
      expect(useEditorStore.getState().fileContent).toBe('');
    });

    it('should handle multi-line content', () => {
      const store = useEditorStore.getState();
      const content = `function test() {
  return true;
}`;
      store.setFileContent(content);
      
      expect(useEditorStore.getState().fileContent).toBe(content);
    });
  });

  describe('setLanguage', () => {
    it('should set language', () => {
      const store = useEditorStore.getState();
      store.setLanguage('typescript');
      
      expect(useEditorStore.getState().language).toBe('typescript');
    });

    it('should accept any language string', () => {
      const store = useEditorStore.getState();
      store.setLanguage('python');
      expect(useEditorStore.getState().language).toBe('python');
      
      store.setLanguage('rust');
      expect(useEditorStore.getState().language).toBe('rust');
    });
  });

  describe('updateConfig', () => {
    it('should update partial config', () => {
      const store = useEditorStore.getState();
      store.updateConfig({ fontSize: 16 });
      
      expect(useEditorStore.getState().config.fontSize).toBe(16);
      expect(useEditorStore.getState().config.theme).toBe('vs-dark'); // unchanged
    });

    it('should merge multiple config properties', () => {
      const store = useEditorStore.getState();
      store.updateConfig({ 
        fontSize: 18,
        theme: 'vs-light',
        tabSize: 4,
      });
      
      const config = useEditorStore.getState().config;
      expect(config.fontSize).toBe(18);
      expect(config.theme).toBe('vs-light');
      expect(config.tabSize).toBe(4);
    });

    it('should preserve unchanged properties', () => {
      const store = useEditorStore.getState();
      const originalConfig = { ...store.config };
      
      store.updateConfig({ fontSize: 20 });
      
      const newConfig = useEditorStore.getState().config;
      expect(newConfig.theme).toBe(originalConfig.theme);
      expect(newConfig.tabSize).toBe(originalConfig.tabSize);
      expect(newConfig.fontSize).toBe(20);
    });
  });

  describe('setCursorPosition', () => {
    it('should set cursor position', () => {
      const store = useEditorStore.getState();
      store.setCursorPosition({ lineNumber: 10, column: 5 });
      
      expect(useEditorStore.getState().cursorPosition).toEqual({
        lineNumber: 10,
        column: 5,
      });
    });

    it('should accept position at start of file', () => {
      const store = useEditorStore.getState();
      store.setCursorPosition({ lineNumber: 1, column: 1 });
      
      expect(useEditorStore.getState().cursorPosition).toEqual({
        lineNumber: 1,
        column: 1,
      });
    });
  });

  describe('setSelection', () => {
    it('should set selection range', () => {
      const store = useEditorStore.getState();
      const selection = {
        startLineNumber: 5,
        startColumn: 1,
        endLineNumber: 10,
        endColumn: 20,
      };
      store.setSelection(selection);
      
      expect(useEditorStore.getState().selection).toEqual(selection);
    });

    it('should clear selection when passed null', () => {
      const store = useEditorStore.getState();
      store.setSelection({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 2,
        endColumn: 1,
      });
      store.setSelection(null);
      
      expect(useEditorStore.getState().selection).toBeNull();
    });
  });

  describe('markAsSaved and markAsDirty', () => {
    it('should mark as saved', () => {
      const store = useEditorStore.getState();
      store.setFileContent('content');
      expect(useEditorStore.getState().isDirty).toBe(true);
      
      store.markAsSaved();
      expect(useEditorStore.getState().isDirty).toBe(false);
    });

    it('should mark as dirty', () => {
      const store = useEditorStore.getState();
      store.markAsSaved();
      expect(useEditorStore.getState().isDirty).toBe(false);
      
      store.markAsDirty();
      expect(useEditorStore.getState().isDirty).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const store = useEditorStore.getState();
      store.setLoading(true);
      expect(useEditorStore.getState().isLoading).toBe(true);
      
      store.setLoading(false);
      expect(useEditorStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const store = useEditorStore.getState();
      store.setError('File not found');
      expect(useEditorStore.getState().error).toBe('File not found');
    });

    it('should clear error with null', () => {
      const store = useEditorStore.getState();
      store.setError('Some error');
      store.setError(null);
      expect(useEditorStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = useEditorStore.getState();
      
      // Modify state
      store.setCurrentFile('/test.ts');
      store.setFileContent('test');
      store.setLanguage('typescript');
      store.setError('error');
      
      // Reset
      store.reset();
      
      const state = useEditorStore.getState();
      expect(state.currentFile).toBeNull();
      expect(state.fileContent).toBe('');
      expect(state.language).toBe('plaintext');
      expect(state.error).toBeNull();
      expect(state.isDirty).toBe(false);
    });
  });
});
