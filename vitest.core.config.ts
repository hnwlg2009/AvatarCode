import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/config/editor.config.test.ts',
      'tests/services/FileService.test.ts',
      'tests/stores/editorStore.test.ts',
    ],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text'],
    },
  },
});
