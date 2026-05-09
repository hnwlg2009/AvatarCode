import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  Editor: vi.fn(() => null),
  DiffEditor: vi.fn(() => null),
  loader: {
    init: vi.fn(),
    config: vi.fn(),
  },
  useMonaco: vi.fn(() => null),
  MonacoEditor: vi.fn(() => null),
}));

// Mock monaco-editor
vi.mock('monaco-editor', () => {
  return {
    editor: {
      create: vi.fn(),
      createDiffEditor: vi.fn(),
      createModel: vi.fn(),
      onDidCreateEditor: vi.fn(),
      defineTheme: vi.fn(),
      setTheme: vi.fn(),
      addKeybindingRules: vi.fn(),
      addCommand: vi.fn(),
    },
    languages: {
      register: vi.fn(),
      setMonarchTokensProvider: vi.fn(),
      registerCompletionItemProvider: vi.fn(),
    },
  };
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
