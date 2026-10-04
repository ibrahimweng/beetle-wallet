import { defineConfig } from 'vitest/config';

/* The logic under test is plain TypeScript with no React Native in it, so the
   tests run in Node with nothing mocked. */
export default defineConfig({
  test: { include: ['test/**/*.test.ts', 'test/**/*.test.mjs'], globals: true, environment: 'node' },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
});
