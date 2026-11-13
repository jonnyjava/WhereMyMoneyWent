'use client';

import { useActionState } from 'react';
import { Alert } from '@/ui/alert';
import { Button } from '@/ui/button';
import { extendLoanAction, returnLoanAction } from './actions';
import { initialFormState } from './form-state';

export function LoanActions({ loanId }: { loanId: string }) {
  const [extendState, extendAction, extending] = useActionState(extendLoanAction, initialFormState);
  const [returnState, returnAction, returning] = useActionState(returnLoanAction, initialFormState);
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <form action={extendAction}>
          <input type="hidden" name="loanId" value={loanId} />
          <input type="hidden" name="days" value="7" />
          <Button type="submit" variant="secondary" pending={extending}>
            Extend loan by 7 days
          </Button>
        </form>
        <form action={returnAction}>
          <input type="hidden" name="loanId" value={loanId} />
          <Button type="submit" pending={returning}>
            Return book
          </Button>
        </form>
      </div>
      {extendState.status !== 'idle' ? (
        <Alert tone={extendState.status === 'error' ? 'error' : 'success'}>{extendState.message}</Alert>
      ) : null}
      {returnState.status !== 'idle' ? (
        <Alert tone={returnState.status === 'error' ? 'error' : 'success'}>{returnState.message}</Alert>
      ) : null}
    </div>
  );
}
