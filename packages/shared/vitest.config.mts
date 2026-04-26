import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    pool: 'threads',
    fileParallelism: false,
    maxWorkers: 1,
    hookTimeout: 30000,
  },
});
