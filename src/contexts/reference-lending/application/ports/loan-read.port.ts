import type { LoanDto } from '../dto/loan.dto';

/** Read port for queries: reads straight from storage, bypassing aggregates. */
export interface LoanReadPort {
  findDto(id: string): Promise<LoanDto | null>;
}
