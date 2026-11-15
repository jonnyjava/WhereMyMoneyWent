'use client';

import { useActionState } from 'react';
import { Alert } from '@/ui/alert';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { createSubcategoryAction } from './actions';
import { initialFormState } from './form-state';

// A client island: it exists only for the pending state and the messages.
export function CreateSubcategoryForm({
  categoryId,
  categoryName,
  userEmail,
}: {
  categoryId: string;
  categoryName: string;
  userEmail: string;
}) {
  const [state, formAction, pending] = useActionState(createSubcategoryAction, initialFormState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="userEmail" value={userEmail} />
      <TextField
        name="name"
        label={`New subcategory under ${categoryName}`}
        required
        defaultValue={state.values?.name}
      />
      {state.status === 'error' ? <Alert tone="error">{state.message}</Alert> : null}
      {state.status === 'success' ? <Alert tone="success">{state.message}</Alert> : null}
      <div>
        <Button type="submit" variant="secondary" pending={pending}>
          {`Add subcategory to ${categoryName}`}
        </Button>
      </div>
    </form>
  );
}