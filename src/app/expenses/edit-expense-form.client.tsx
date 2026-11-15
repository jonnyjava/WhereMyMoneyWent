'use client';

import { useId, useActionState } from 'react';
import { Alert } from '@/ui/alert';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { editExpenseAction } from './actions';
import type { ExpenseTargetOption } from './format';
import { initialFormState } from './form-state';

// A client island: it exists only for the pending state and the messages.
export function EditExpenseForm({
  expenseId,
  amount,
  spentOn,
  target,
  options,
  userEmail,
}: {
  expenseId: string;
  amount: string;
  spentOn: string;
  target: string;
  options: readonly ExpenseTargetOption[];
  userEmail: string;
}) {
  const [state, formAction, pending] = useActionState(editExpenseAction, initialFormState);
  const targetId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="expenseId" value={expenseId} />
      <input type="hidden" name="userEmail" value={userEmail} />
      <TextField
        name="amount"
        label="Amount"
        type="number"
        min="0"
        step="0.01"
        required
        defaultValue={state.values?.amount ?? amount}
      />
      <TextField
        name="spentOn"
        label="Date"
        type="date"
        required
        defaultValue={state.values?.spentOn ?? spentOn}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor={targetId} className="text-sm font-medium text-ink">
          Category or subcategory
        </label>
        <select
          id={targetId}
          name="target"
          defaultValue={state.values?.target ?? target}
          className="rounded-control border border-field bg-surface px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {state.status === 'error' ? <Alert tone="error">{state.message}</Alert> : null}
      {state.status === 'success' ? <Alert tone="success">{state.message}</Alert> : null}
      <div>
        <Button type="submit" variant="secondary" pending={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}