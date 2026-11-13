import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Integration tests use the local Postgres from docker-compose.yml. CI sets
// DATABASE_URL itself. A missing database makes those tests FAIL, never skip.
process.env.DATABASE_URL ??= 'postgres://postgres:postgres@localhost:5432/app_test';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'], // UI tests opt into jsdom with a `// @vitest-environment jsdom` first line
    environment: 'node',
    fileParallelism: false, // integration tests share one database
  },
});
