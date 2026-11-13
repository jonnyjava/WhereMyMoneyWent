import { getContainer } from '@/composition/container';
import { badRequest, extendLoanErrorToResponse, readJson } from '../../../http';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await readJson(request);
  if (body === null || typeof body.days !== 'number') return badRequest('Expected { days: number }');

  const result = await getContainer().extendLoan.execute({ loanId: id, days: body.days });
  return result.ok ? new Response(null, { status: 204 }) : extendLoanErrorToResponse(result.error);
}
