import { getContainer } from '@/composition/container';
import { badRequest, openLoanErrorToResponse, readJson } from '../http';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const body = await readJson(request);
  if (
    body === null ||
    typeof body.bookId !== 'string' ||
    typeof body.borrowerEmail !== 'string' ||
    typeof body.days !== 'number'
  ) {
    return badRequest('Expected { bookId: string, borrowerEmail: string, days: number }');
  }

  const loanId = crypto.randomUUID();
  const result = await getContainer().openLoan.execute({
    loanId,
    bookId: body.bookId,
    borrowerEmail: body.borrowerEmail,
    dueDate: new Date(Date.now() + body.days * DAY_MS),
  });

  return result.ok ? Response.json({ loanId }, { status: 201 }) : openLoanErrorToResponse(result.error);
}
