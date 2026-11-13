import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ReturnCounter } from '../domain/return-counter.aggregate';
import { DrizzleReturnCounterRepository } from './drizzle-return-counter.repository';
import { returnCounters } from './return-counter.model';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required for integration tests');
const sql = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(sql);
const repository = new DrizzleReturnCounterRepository(db);

describe('DrizzleReturnCounterRepository (real Postgres)', () => {
  beforeAll(async () => {
    await migrate(db, { migrationsFolder: 'drizzle' });
  });
  beforeEach(async () => {
    await db.delete(returnCounters);
  });
  afterAll(async () => {
    await sql.end();
  });

  it('starts empty', async () => {
    expect(await repository.find()).toBeNull();
    expect(await repository.readCount()).toBe(0);
  });

  it('persists the count and the counted loan ids', async () => {
    const counter = ReturnCounter.create();
    counter.recordReturn('loan-1');
    counter.recordReturn('loan-2');
    await repository.save(counter);

    const loaded = await repository.find();

    expect(loaded?.toSnapshot()).toMatchObject({ count: 2, countedLoanIds: ['loan-1', 'loan-2'] });
    expect(await repository.readCount()).toBe(2);
  });
});
