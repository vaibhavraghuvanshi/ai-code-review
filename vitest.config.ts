import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['server/__tests__/**/*.{test,spec}.ts', 'server/**/?(*.)+(test|spec).ts'],
    environment: 'node',
    reporters: ['default'],
    watch: false,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
});
