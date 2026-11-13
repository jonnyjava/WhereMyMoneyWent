import { getContainer } from '@/composition/container';

export const dynamic = 'force-dynamic';

export async function GET() {
  const returned = await getContainer().getReturnCount.execute({});
  return Response.json({ returned });
}
