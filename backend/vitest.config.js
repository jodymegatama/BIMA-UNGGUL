import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    // ponytail: satu DB dev bersama — file test jalan serial (default), paralel nanti saat ada DB test terpisah.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
