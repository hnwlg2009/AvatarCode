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
    include: ['tests/services/LSPClient.test.ts', 'tests/services/ProductionLSPClient.test.ts', 'tests/services/FileWatcherService.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
    },
  },
});
