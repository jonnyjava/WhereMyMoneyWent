import { defineConfig } from '@playwright/test';

const port = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: './e2e',
  testIgnore: 'postdeploy/**',
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${port}` },
  // Builds and serves the production bundle, so build errors fail e2e too.
  webServer: {
    command: `pnpm build && pnpm start --port ${port}`,
    url: `http://localhost:${port}/api/health`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/where_my_money_went',
    },
  },
});
