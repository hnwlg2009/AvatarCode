import '@testing-library/jest-dom';
import { vi } from 'vitest';

// This vitest/jsdom combination ships a broken localStorage stub
// (no methods at all + "--localstorage-file" warning from Node).
// Provide a working in-memory Storage implementation instead.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: memoryStorage,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: new MemoryStorage(),
});
if (window) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: memoryStorage,
  });
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: new MemoryStorage(),
  });
}

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
