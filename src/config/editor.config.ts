export interface IEditorConfig {
  autoClosingBrackets?: boolean;
  autoSurround?: boolean;
  folding?: boolean;
  lineNumbers?: boolean;
  minimap?: boolean;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize?: number;
  tabSize?: number;
  semanticHighlighting?: boolean;
  automaticLayout?: boolean;
  scrollBeyondLastLine?: boolean;
  renderWhitespace?: 'none' | 'boundary' | 'selection' | 'all';
  letterSpacing?: number;
  lineHeight?: number;
  cursorStyle?: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  cursorBlinking?: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  quickSuggestions?: boolean | { other: boolean; comments: boolean; strings: boolean };
  suggestOnTriggerCharacters?: boolean;
  acceptSuggestionOnEnter?: 'on' | 'smart' | 'off';
  bracketPairColorization?: { enabled: boolean };
  guides?: { indentation: boolean; bracketPairs: boolean };
  padding?: { top: number; bottom: number };
  readOnly?: boolean;
  disableValidation?: boolean;
}

export const defaultEditorConfig: IEditorConfig = {
  autoClosingBrackets: true,
  autoSurround: true,
  folding: true,
  lineNumbers: true,
  minimap: false,
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  semanticHighlighting: true,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  renderWhitespace: 'none',
  letterSpacing: 0.5,
  lineHeight: 24,
  cursorStyle: 'line',
  cursorBlinking: 'smooth',
  quickSuggestions: { other: true, comments: false, strings: false },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'smart',
  bracketPairColorization: { enabled: true },
  guides: { indentation: true, bracketPairs: false },
  padding: { top: 8, bottom: 8 },
  readOnly: false,
  disableValidation: false,
};

export const largeFileConfig: Partial<IEditorConfig> = {
  minimap: false,
  folding: false,
  renderWhitespace: 'none',
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  semanticHighlighting: false,
};

export function getEditorOptions(config: IEditorConfig) {
  return {
    value: '',
    language: 'typescript',
    theme: config.theme,
    fontSize: config.fontSize,
    lineHeight: config.lineHeight,
    letterSpacing: config.letterSpacing,
    minimap: { enabled: config.minimap ?? false },
    folding: config.folding,
    lineNumbers: config.lineNumbers ? 'on' : 'off',
    automaticLayout: config.automaticLayout ?? true,
    scrollBeyondLastLine: config.scrollBeyondLastLine ?? false,
    renderWhitespace: config.renderWhitespace,
    cursorStyle: config.cursorStyle,
    cursorBlinking: config.cursorBlinking,
    autoClosingBrackets: config.autoClosingBrackets ? 'always' : 'never',
    autoSurround: config.autoSurround ? 'always' : 'never',
    quickSuggestions: config.quickSuggestions,
    suggestOnTriggerCharacters: config.suggestOnTriggerCharacters,
    acceptSuggestionOnEnter: config.acceptSuggestionOnEnter,
    bracketPairColorization: config.bracketPairColorization,
    guides: config.guides,
    padding: config.padding,
    readOnly: config.readOnly ?? false,
    tabSize: config.tabSize,
    semanticHighlighting: config.semanticHighlighting,
    wordWrap: 'on',
    formatOnPaste: true,
    formatOnType: true,
    detectIndentation: false,
    smoothScrolling: true,
    cursorSmoothCaretAnimation: 'on',
    selectionHighlight: true,
    occurrencesHighlight: true,
    renderLineHighlight: 'all',
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
  } as any;
}
