import postgres from 'postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createContainer, type Container } from './create-container';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required for integration tests');
const admin = postgres(url, { max: 1, onnotice: () => {} });
let container: Container;

describe('composition root (both contexts, real Postgres, real event bus)', () => {
  beforeAll(async () => {
    await migrate(drizzle(admin), { migrationsFolder: 'drizzle' });
    container = createContainer({ databaseUrl: url });
  });
  beforeEach(async () => {
    await admin`TRUNCATE reference.loans, reference.return_counters`;
  });
  afterAll(async () => {
    await container.close();
    await admin.end();
  });

  it('returning a loan in one context updates the counter in the other', async () => {
    await container.openLoan.execute({
      loanId: 'loan-1',
      bookId: 'book-1',
      borrowerEmail: 'ada@example.com',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
    expect(await container.getReturnCount.execute({})).toBe(0);

    const returned = await container.returnLoan.execute({ loanId: 'loan-1' });

    expect(returned.ok).toBe(true);
    expect(await container.getReturnCount.execute({})).toBe(1);
    const loan = await container.getLoan.execute({ loanId: 'loan-1' });
    expect(loan.ok && loan.value.returned).toBe(true);
  });
});
