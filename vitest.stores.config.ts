import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@stores': path.resolve(__dirname, './src/stores'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/stores/editorStore.test.ts',
      'tests/stores/chatStore.test.ts',
      'tests/stores/lspStore.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
    },
  },
});
