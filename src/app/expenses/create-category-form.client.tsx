'use client';

import { useActionState } from 'react';
import { Alert } from '@/ui/alert';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { createCategoryAction } from './actions';
import { initialFormState } from './form-state';

// A client island: it exists only for the pending state and the messages.
// It imports nothing from the backend: it calls a server action.
export function CreateCategoryForm({ userEmail }: { userEmail: string }) {
  const [state, formAction, pending] = useActionState(createCategoryAction, initialFormState);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="userEmail" value={userEmail} />
      <TextField name="name" label="Category name" required defaultValue={state.values?.name} />
      {state.status === 'error' ? <Alert tone="error">{state.message}</Alert> : null}
      {state.status === 'success' ? <Alert tone="success">{state.message}</Alert> : null}
      <div>
        <Button type="submit" pending={pending}>
          Create category
        </Button>
      </div>
    </form>
  );
}