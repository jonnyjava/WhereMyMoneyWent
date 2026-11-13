import { getContainer } from '@/composition/container';
import { returnLoanErrorToResponse } from '../../../http';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await getContainer().returnLoan.execute({ loanId: id });
  return result.ok ? new Response(null, { status: 204 }) : returnLoanErrorToResponse(result.error);
}
