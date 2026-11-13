import { expect, test } from '@playwright/test';

// Runs against a deployed URL (BASE_URL), not a local server.
test('deployment is healthy', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('home page is served', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
});
