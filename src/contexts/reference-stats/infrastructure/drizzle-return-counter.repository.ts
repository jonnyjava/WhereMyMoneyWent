import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { ReturnCountReadPort } from '../application/ports/return-count-read.port';
import { ReturnCounter } from '../domain/return-counter.aggregate';
import type { ReturnCounterRepository } from '../domain/return-counter.repository';
import { returnCounterMapper } from './return-counter.mapper';
import { returnCounters } from './return-counter.model';

export class DrizzleReturnCounterRepository implements ReturnCounterRepository, ReturnCountReadPort {
  constructor(private readonly db: PostgresJsDatabase) {}

  async find(): Promise<ReturnCounter | null> {
    const [row] = await this.db
      .select()
      .from(returnCounters)
      .where(eq(returnCounters.id, ReturnCounter.SINGLETON_ID));
    return row ? returnCounterMapper.toDomain(row) : null;
  }

  async save(counter: ReturnCounter): Promise<void> {
    const row = returnCounterMapper.toRow(counter);
    await this.db.transaction(async (tx) => {
      await tx
        .insert(returnCounters)
        .values(row)
        .onConflictDoUpdate({ target: returnCounters.id, set: row });
    });
  }

  async readCount(): Promise<number> {
    const [row] = await this.db
      .select()
      .from(returnCounters)
      .where(eq(returnCounters.id, ReturnCounter.SINGLETON_ID));
    return row?.count ?? 0;
  }
}
