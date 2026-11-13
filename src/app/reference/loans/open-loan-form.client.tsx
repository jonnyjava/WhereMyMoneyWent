'use client';

import { useActionState } from 'react';
import { Alert } from '@/ui/alert';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { openLoanAction } from './actions';
import { initialFormState } from './form-state';

// A client island: it exists only for the pending state and the error message.
// It imports nothing from the backend: it calls a server action.
// Fields use the values the action sent back as their defaults: React resets uncontrolled fields after an action.
export function OpenLoanForm() {
  const [state, formAction, pending] = useActionState(openLoanAction, initialFormState);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField name="bookId" label="Book" required defaultValue={state.values?.bookId} />
      <TextField name="borrowerEmail" label="Borrower email" type="email" required hint="Identifies the member." defaultValue={state.values?.borrowerEmail} />
      <TextField name="days" label="Loan length in days" type="number" min={1} required defaultValue={state.values?.days ?? '14'} />
      {state.status === 'error' ? <Alert tone="error">{state.message}</Alert> : null}
      <div>
        <Button type="submit" pending={pending}>
          Open loan
        </Button>
      </div>
    </form>
  );
}
