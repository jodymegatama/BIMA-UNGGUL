import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    // Muat backend/.env untuk semua suite: Prisma client (runtime) tidak membaca
    // .env sendiri, hanya process.env — beda dengan Prisma CLI.
    setupFiles: ['./tests/setup-env.js'],
    // ponytail: satu DB dev bersama — file test jalan serial (default), paralel nanti saat ada DB test terpisah.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
