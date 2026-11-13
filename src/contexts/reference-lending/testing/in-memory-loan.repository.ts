import type { LoanDto } from '../application/dto/loan.dto';
import type { LoanReadPort } from '../application/ports/loan-read.port';
import { Loan, type LoanProps } from '../domain/loan.aggregate';
import type { LoanRepository } from '../domain/loan.repository';

/** Fake for the loan ports. Stores snapshots, like a real database would. */
export class InMemoryLoanRepository implements LoanRepository, LoanReadPort {
  private readonly stored = new Map<string, LoanProps>();

  async find(id: string): Promise<Loan | null> {
    const props = this.stored.get(id);
    return props ? Loan.reconstitute(props) : null;
  }

  async save(loan: Loan): Promise<void> {
    this.stored.set(loan.id, { ...loan.toSnapshot() });
  }

  async findDto(id: string): Promise<LoanDto | null> {
    const props = this.stored.get(id);
    if (!props) return null;
    return {
      id: props.id,
      bookId: props.bookId,
      borrowerEmail: props.borrower.value,
      dueDate: props.dueDate.toISOString(),
      extensions: props.extensions,
      returned: props.returnedAt !== null,
    };
  }
}
