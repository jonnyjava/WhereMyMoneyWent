import { expect, test } from '@playwright/test';

test('loan lifecycle across two contexts, through the delivery layer', async ({ request }) => {
  const before = (await (await request.get('/api/reference/stats')).json()) as { returned: number };

  const opened = await request.post('/api/reference/loans', {
    data: { bookId: 'book-1', borrowerEmail: 'ada@example.com', days: 14 },
  });
  expect(opened.status()).toBe(201);
  const { loanId } = (await opened.json()) as { loanId: string };

  expect((await request.post(`/api/reference/loans/${loanId}/extend`, { data: { days: 7 } })).status()).toBe(204);

  const second = await request.post(`/api/reference/loans/${loanId}/extend`, { data: { days: 7 } });
  expect(second.status()).toBe(409);
  expect(await second.json()).toMatchObject({ error: { kind: 'ExtensionLimitReached' } });

  expect((await request.post(`/api/reference/loans/${loanId}/return`)).status()).toBe(204);

  const again = await request.post(`/api/reference/loans/${loanId}/return`);
  expect(again.status()).toBe(409);
  expect(await again.json()).toMatchObject({ error: { kind: 'LoanAlreadyReturned' } });

  const after = (await (await request.get('/api/reference/stats')).json()) as { returned: number };
  expect(after.returned).toBe(before.returned + 1);
});

test('rejects invalid input with typed errors', async ({ request }) => {
  const badShape = await request.post('/api/reference/loans', { data: { nope: true } });
  expect(badShape.status()).toBe(400);

  const badEmail = await request.post('/api/reference/loans', {
    data: { bookId: 'b', borrowerEmail: 'not-an-email', days: 14 },
  });
  expect(badEmail.status()).toBe(422);
  expect(await badEmail.json()).toMatchObject({ error: { kind: 'InvalidEmail' } });

  expect((await request.get('/api/reference/loans/does-not-exist')).status()).toBe(404);
});
