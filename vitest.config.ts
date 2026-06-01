import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/__tests__/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'components',
          include: ['src/__tests__/components/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['src/__tests__/setup/vitest-dom.ts'],
        },
      },
    ],
  },
});
