import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { LoanDto } from '../application/dto/loan.dto';
import type { LoanReadPort } from '../application/ports/loan-read.port';
import type { Loan } from '../domain/loan.aggregate';
import type { LoanRepository } from '../domain/loan.repository';
import { loanMapper } from './loan.mapper';
import { loans } from './loan.model';

export class DrizzleLoanRepository implements LoanRepository, LoanReadPort {
  constructor(private readonly db: PostgresJsDatabase) {}

  async find(id: string): Promise<Loan | null> {
    const [row] = await this.db.select().from(loans).where(eq(loans.id, id));
    return row ? loanMapper.toDomain(row) : null;
  }

  /** One aggregate per transaction. */
  async save(loan: Loan): Promise<void> {
    const row = loanMapper.toRow(loan);
    await this.db.transaction(async (tx) => {
      await tx.insert(loans).values(row).onConflictDoUpdate({ target: loans.id, set: row });
    });
  }

  async findDto(id: string): Promise<LoanDto | null> {
    const [row] = await this.db.select().from(loans).where(eq(loans.id, id));
    return row ? loanMapper.toDto(row) : null;
  }
}
