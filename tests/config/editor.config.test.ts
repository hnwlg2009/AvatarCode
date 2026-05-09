import { describe, it, expect, beforeEach } from 'vitest';
import { defaultEditorConfig, largeFileConfig, getEditorOptions, IEditorConfig } from '../../../src/config/editor.config';

describe('EditorConfig', () => {
  describe('defaultEditorConfig', () => {
    it('should have correct default values', () => {
      expect(defaultEditorConfig.autoClosingBrackets).toBe(true);
      expect(defaultEditorConfig.autoSurround).toBe(true);
      expect(defaultEditorConfig.folding).toBe(true);
      expect(defaultEditorConfig.lineNumbers).toBe(true);
      expect(defaultEditorConfig.minimap).toBe(false);
      expect(defaultEditorConfig.theme).toBe('vs-dark');
      expect(defaultEditorConfig.fontSize).toBe(14);
      expect(defaultEditorConfig.tabSize).toBe(2);
      expect(defaultEditorConfig.semanticHighlighting).toBe(true);
      expect(defaultEditorConfig.automaticLayout).toBe(true);
      expect(defaultEditorConfig.scrollBeyondLastLine).toBe(false);
    });

    it('should have cursor configuration', () => {
      expect(defaultEditorConfig.cursorStyle).toBe('line');
      expect(defaultEditorConfig.cursorBlinking).toBe('smooth');
    });

    it('should have suggestion configuration', () => {
      expect(defaultEditorConfig.quickSuggestions).toEqual({
        other: true,
        comments: false,
        strings: false,
      });
      expect(defaultEditorConfig.suggestOnTriggerCharacters).toBe(true);
      expect(defaultEditorConfig.acceptSuggestionOnEnter).toBe('smart');
    });

    it('should have bracket colorization enabled', () => {
      expect(defaultEditorConfig.bracketPairColorization?.enabled).toBe(true);
    });

    it('should have guides configuration', () => {
      expect(defaultEditorConfig.guides?.indentation).toBe(true);
      expect(defaultEditorConfig.guides?.bracketPairs).toBe(false);
    });

    it('should have padding configuration', () => {
      expect(defaultEditorConfig.padding?.top).toBe(8);
      expect(defaultEditorConfig.padding?.bottom).toBe(8);
    });
  });

  describe('largeFileConfig', () => {
    it('should disable minimap for large files', () => {
      expect(largeFileConfig.minimap).toBe(false);
    });

    it('should disable folding for large files', () => {
      expect(largeFileConfig.folding).toBe(false);
    });

    it('should disable whitespace rendering for large files', () => {
      expect(largeFileConfig.renderWhitespace).toBe('none');
    });

    it('should disable quick suggestions for large files', () => {
      expect(largeFileConfig.quickSuggestions).toBe(false);
    });

    it('should disable suggestion triggers for large files', () => {
      expect(largeFileConfig.suggestOnTriggerCharacters).toBe(false);
    });

    it('should disable semantic highlighting for large files', () => {
      expect(largeFileConfig.semanticHighlighting).toBe(false);
    });
  });

  describe('getEditorOptions', () => {
    it('should convert config to Monaco options', () => {
      const options = getEditorOptions(defaultEditorConfig);
      
      expect(options.theme).toBe('vs-dark');
      expect(options.fontSize).toBe(14);
      expect(options.tabSize).toBe(2);
      expect(options.lineHeight).toBe(24);
      expect(options.folding).toBe(true);
      expect(options.automaticLayout).toBe(true);
      expect(options.scrollBeyondLastLine).toBe(false);
    });

    it('should set minimap options', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.minimap).toEqual({ enabled: false });
    });

    it('should set line numbers option', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.lineNumbers).toBe('on');
    });

    it('should set cursor options', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.cursorStyle).toBe('line');
      expect(options.cursorBlinking).toBe('smooth');
    });

    it('should set auto-closing brackets', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.autoClosingBrackets).toBe('always');
      expect(options.autoSurround).toBe('always');
    });

    it('should set quick suggestions', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.quickSuggestions).toEqual({
        other: true,
        comments: false,
        strings: false,
      });
    });

    it('should set scrollbar options', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.scrollbar).toBeDefined();
      expect(options.scrollbar?.verticalScrollbarSize).toBe(10);
      expect(options.scrollbar?.horizontalScrollbarSize).toBe(10);
    });

    it('should set wordWrap to on', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.wordWrap).toBe('on');
    });

    it('should enable format on paste and type', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.formatOnPaste).toBe(true);
      expect(options.formatOnType).toBe(true);
    });

    it('should disable detect indentation', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.detectIndentation).toBe(false);
    });

    it('should enable smooth scrolling', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.smoothScrolling).toBe(true);
      expect(options.cursorSmoothCaretAnimation).toBe('on');
    });

    it('should set selection and occurrences highlight', () => {
      const options = getEditorOptions(defaultEditorConfig);
      expect(options.selectionHighlight).toBe(true);
      expect(options.occurrencesHighlight).toBe(true);
    });

    it('should merge custom config with defaults', () => {
      const customConfig: IEditorConfig = {
        ...defaultEditorConfig,
        fontSize: 16,
        theme: 'vs-light',
      };
      
      const options = getEditorOptions(customConfig);
      expect(options.fontSize).toBe(16);
      expect(options.theme).toBe('vs-light');
      expect(options.tabSize).toBe(2); // from defaults
    });

    it('should handle readOnly option', () => {
      const config: IEditorConfig = {
        ...defaultEditorConfig,
        readOnly: true,
      };
      const options = getEditorOptions(config);
      expect(options.readOnly).toBe(true);
    });

    it('should handle custom tab size', () => {
      const config: IEditorConfig = {
        ...defaultEditorConfig,
        tabSize: 4,
      };
      const options = getEditorOptions(config);
      expect(options.tabSize).toBe(4);
    });

    it('should disable line numbers when configured', () => {
      const config: IEditorConfig = {
        ...defaultEditorConfig,
        lineNumbers: false,
      };
      const options = getEditorOptions(config);
      expect(options.lineNumbers).toBe('off');
    });
  });
});
