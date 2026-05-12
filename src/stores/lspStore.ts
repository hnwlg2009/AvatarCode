import { create } from 'zustand';
import type { Position as LspPosition } from '../types/lsp.types';

function monacoPositionToLspPosition(lineNumber: number, column: number): LspPosition {
  return {
    line: lineNumber - 1,
    character: column - 1,
  };
}

interface LspState {
  connected: boolean;
  error: string | null;
}

export const useLspStore = create<LspState>(() => ({
  connected: false,
  error: null,
}));
