import type { LoanDto } from '../application/dto/loan.dto';
import { Email } from '../domain/email.value-object';
import { Loan } from '../domain/loan.aggregate';
import type { LoanRow } from './loan.model';

export const loanMapper = {
  toDomain(row: LoanRow): Loan {
    return Loan.reconstitute({
      id: row.id,
      bookId: row.bookId,
      borrower: Email.reconstitute(row.borrowerEmail),
      dueDate: row.dueDate,
      extensions: row.extensions,
      returnedAt: row.returnedAt,
    });
  },

  toRow(loan: Loan): LoanRow {
    const s = loan.toSnapshot();
    return {
      id: s.id,
      bookId: s.bookId,
      borrowerEmail: s.borrower.value,
      dueDate: s.dueDate,
      extensions: s.extensions,
      returnedAt: s.returnedAt,
    };
  },

  toDto(row: LoanRow): LoanDto {
    return {
      id: row.id,
      bookId: row.bookId,
      borrowerEmail: row.borrowerEmail,
      dueDate: row.dueDate.toISOString(),
      extensions: row.extensions,
      returned: row.returnedAt !== null,
    };
  },
};
