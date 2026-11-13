import { defineConfig } from '@playwright/test';

// Smoke tests against an already deployed URL (BASE_URL).
// If Vercel deployment protection is on, the runner must send the automation
// bypass secret. Verify the header name against Vercel's current docs.
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: './e2e/postdeploy',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: bypass ? { 'x-vercel-protection-bypass': bypass } : {},
  },
});
