import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Email } from '../domain/email.value-object';
import { Loan } from '../domain/loan.aggregate';
import { DrizzleLoanRepository } from './drizzle-loan.repository';
import { loans } from './loan.model';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required for integration tests');
const sql = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(sql);
const repository = new DrizzleLoanRepository(db);
const now = new Date('2026-01-01T00:00:00Z');

function newLoan(id: string): Loan {
  const created = Loan.create(
    { id, bookId: 'book-1', borrower: Email.reconstitute('ada@example.com'), dueDate: new Date('2026-01-15T00:00:00Z') },
    now,
  );
  if (!created.ok) throw new Error('fixture must be valid');
  return created.value;
}

describe('DrizzleLoanRepository (real Postgres)', () => {
  beforeAll(async () => {
    await migrate(db, { migrationsFolder: 'drizzle' });
  });
  beforeEach(async () => {
    await db.delete(loans);
  });
  afterAll(async () => {
    await sql.end();
  });

  it('saves and loads a loan, preserving its state', async () => {
    await repository.save(newLoan('loan-1'));

    const loaded = await repository.find('loan-1');

    expect(loaded?.toSnapshot()).toMatchObject({
      id: 'loan-1',
      bookId: 'book-1',
      extensions: 0,
      returnedAt: null,
    });
    expect(loaded?.toSnapshot().borrower.value).toBe('ada@example.com');
  });

  it('updates an existing loan instead of inserting a duplicate', async () => {
    const loan = newLoan('loan-1');
    await repository.save(loan);
    loan.extend(7, now);
    await repository.save(loan);

    const loaded = await repository.find('loan-1');

    expect(loaded?.toSnapshot().extensions).toBe(1);
    expect(await db.select().from(loans)).toHaveLength(1);
  });

  it('returns null for an unknown loan', async () => {
    expect(await repository.find('missing')).toBeNull();
    expect(await repository.findDto('missing')).toBeNull();
  });

  it('serves the read model as a DTO', async () => {
    await repository.save(newLoan('loan-1'));

    expect(await repository.findDto('loan-1')).toEqual({
      id: 'loan-1',
      bookId: 'book-1',
      borrowerEmail: 'ada@example.com',
      dueDate: '2026-01-15T00:00:00.000Z',
      extensions: 0,
      returned: false,
    });
  });
});
