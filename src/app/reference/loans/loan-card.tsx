import type { ReactNode } from 'react';
import type { LoanDto } from '@/contexts/reference-lending';
import { Card } from '@/ui/card';

// UTC date, so the page reads the same in every time zone.
const day = (iso: string) => iso.slice(0, 10);

export function LoanCard({ loan, children }: { loan: LoanDto; children?: ReactNode }) {
  return (
    <Card title="Loan">
      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
        <dt className="text-muted">Book</dt>
        <dd>{loan.bookId}</dd>
        <dt className="text-muted">Borrower</dt>
        <dd>{loan.borrowerEmail}</dd>
        <dt className="text-muted">Due</dt>
        <dd>
          <time dateTime={loan.dueDate}>{day(loan.dueDate)}</time>
        </dd>
        <dt className="text-muted">Extensions used</dt>
        <dd>{loan.extensions}</dd>
        <dt className="text-muted">Status</dt>
        <dd>{loan.returned ? 'Returned' : 'Not returned'}</dd>
      </dl>
      {children}
    </Card>
  );
}
