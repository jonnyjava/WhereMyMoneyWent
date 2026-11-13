import { getContainer } from '@/composition/container';
import { Alert } from '@/ui/alert';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { PageShell } from '@/ui/page-shell';
import { TextField } from '@/ui/text-field';
import { LoanActions } from './loan-actions.client';
import { LoanCard } from './loan-card';
import { loanNotFoundMessage } from './messages';
import { OpenLoanForm } from './open-loan-form.client';

export const dynamic = 'force-dynamic';

// A server component: it reads through the composition root and renders. No state, no business rules.
export default async function LoansPage({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const { id } = await searchParams;
  const loanId = typeof id === 'string' && id.trim() !== '' ? id.trim() : null;
  const container = getContainer();
  const returned = await container.getReturnCount.execute({});
  const found = loanId ? await container.getLoan.execute({ loanId }) : null;

  return (
    <PageShell title="Library loans">
      <p className="text-muted">A worked example of the UI conventions, built on the reference-lending context.</p>
      <Card title="Open a loan">
        <OpenLoanForm />
      </Card>
      <Card title="Find a loan">
        <form method="get" className="flex flex-col gap-4">
          <TextField name="id" label="Loan id" defaultValue={loanId ?? ''} />
          <div>
            <Button type="submit" variant="secondary">
              Find loan
            </Button>
          </div>
        </form>
      </Card>
      {found?.ok ? (
        <LoanCard loan={found.value}>
          <LoanActions loanId={found.value.id} />
        </LoanCard>
      ) : null}
      {found && !found.ok ? <Alert tone="error">{loanNotFoundMessage()}</Alert> : null}
      <p className="text-sm text-muted">
        Books returned so far: <strong>{returned}</strong>
      </p>
    </PageShell>
  );
}
