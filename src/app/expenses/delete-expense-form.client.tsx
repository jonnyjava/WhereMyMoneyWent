'use client';

import { useActionState } from 'react';
import { Alert } from '@/ui/alert';
import { Button } from '@/ui/button';
import { deleteExpenseAction } from './actions';
import { initialFormState } from './form-state';

// A client island: it exists only for the pending state and the messages.
export function DeleteExpenseForm({
  expenseId,
  label,
  userEmail,
}: {
  expenseId: string;
  label: string;
  userEmail: string;
}) {
  const [state, formAction, pending] = useActionState(deleteExpenseAction, initialFormState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="expenseId" value={expenseId} />
      <input type="hidden" name="userEmail" value={userEmail} />
      {state.status === 'error' ? <Alert tone="error">{state.message}</Alert> : null}
      {state.status === 'success' ? <Alert tone="success">{state.message}</Alert> : null}
      <div>
        <Button type="submit" variant="secondary" pending={pending}>
          {`Delete ${label}`}
        </Button>
      </div>
    </form>
  );
}