import { getContainer } from '@/composition/container';
import { loanNotFoundToResponse } from '../../http';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await getContainer().getLoan.execute({ loanId: id });
  return result.ok ? Response.json(result.value) : loanNotFoundToResponse(result.error);
}
