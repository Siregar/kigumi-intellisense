import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['tests/setup/vscode-mock.ts'],
    include: ['tests/**/*.test.ts'],
  },
});
