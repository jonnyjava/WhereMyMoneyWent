'use server';

import { revalidatePath } from 'next/cache';
import { getContainer } from '@/composition/container';
import type { FormState } from './form-state';
import { createCategoryMessage, deleteCategoryMessage, renameCategoryMessage } from './messages';

// Server actions are the only way the UI changes anything. Each one: reads the form (shape only),
// calls ONE command handler, and turns the Result into a FormState. Business rules stay in the domain.

const PATH = '/expenses';

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export async function createCategoryAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const userEmail = text(formData, 'userEmail');
  const name = text(formData, 'name');
  const values = { name }; // given back on error, so the form keeps what was typed
  if (name === '') {
    return { status: 'error', message: 'Enter a name for the category.', values };
  }
  const result = await getContainer().createExpenseCategory.execute({
    categoryId: crypto.randomUUID(),
    userEmail,
    name,
  });
  if (!result.ok) return { status: 'error', message: createCategoryMessage(result.error), values };
  revalidatePath(PATH);
  return { status: 'success', message: 'Category created.' };
}

export async function renameCategoryAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const userEmail = text(formData, 'userEmail');
  const categoryId = text(formData, 'categoryId');
  const name = text(formData, 'name');
  const values = { name };
  if (name === '') {
    return { status: 'error', message: 'Enter a name for the category.', values };
  }
  const result = await getContainer().renameExpenseCategory.execute({ categoryId, userEmail, name });
  if (!result.ok) return { status: 'error', message: renameCategoryMessage(result.error), values };
  revalidatePath(PATH);
  return { status: 'success', message: 'Category renamed.' };
}

export async function deleteCategoryAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const result = await getContainer().deleteExpenseCategory.execute({
    categoryId: text(formData, 'categoryId'),
    userEmail: text(formData, 'userEmail'),
  });
  if (!result.ok) return { status: 'error', message: deleteCategoryMessage(result.error) };
  revalidatePath(PATH);
  return { status: 'success', message: 'Category deleted.' };
}