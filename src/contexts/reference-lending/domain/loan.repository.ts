import type { Loan } from './loan.aggregate';

/** Port: implemented in infrastructure/ (Drizzle) and testing/ (in-memory). */
export interface LoanRepository {
  find(id: string): Promise<Loan | null>;
  save(loan: Loan): Promise<void>;
}
