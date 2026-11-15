'use server';

import { revalidatePath } from 'next/cache';
import { getContainer } from '@/composition/container';
import type { FormState } from './form-state';
import {
  createCategoryMessage,
  createSubcategoryMessage,
  deleteCategoryMessage,
  deleteExpenseMessage,
  deleteSubcategoryMessage,
  editExpenseMessage,
  registerExpenseMessage,
  renameCategoryMessage,
  renameSubcategoryMessage,
} from './messages';

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

export async function createSubcategoryAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const categoryId = text(formData, 'categoryId');
  const userEmail = text(formData, 'userEmail');
  const name = text(formData, 'name');
  const values = { name };
  if (name === '') {
    return { status: 'error', message: 'Enter a name for the subcategory.', values };
  }
  const result = await getContainer().createExpenseSubcategory.execute({
    categoryId,
    subcategoryId: crypto.randomUUID(),
    userEmail,
    name,
  });
  if (!result.ok) return { status: 'error', message: createSubcategoryMessage(result.error), values };
  revalidatePath(PATH);
  return { status: 'success', message: 'Subcategory added.' };
}

export async function renameSubcategoryAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const categoryId = text(formData, 'categoryId');
  const subcategoryId = text(formData, 'subcategoryId');
  const userEmail = text(formData, 'userEmail');
  const name = text(formData, 'name');
  const values = { name };
  if (name === '') {
    return { status: 'error', message: 'Enter a name for the subcategory.', values };
  }
  const result = await getContainer().renameExpenseSubcategory.execute({
    categoryId,
    subcategoryId,
    userEmail,
    name,
  });
  if (!result.ok) return { status: 'error', message: renameSubcategoryMessage(result.error), values };
  revalidatePath(PATH);
  return { status: 'success', message: 'Subcategory renamed.' };
}

export async function deleteSubcategoryAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const result = await getContainer().deleteExpenseSubcategory.execute({
    categoryId: text(formData, 'categoryId'),
    subcategoryId: text(formData, 'subcategoryId'),
    userEmail: text(formData, 'userEmail'),
  });
  if (!result.ok) return { status: 'error', message: deleteSubcategoryMessage(result.error) };
  revalidatePath(PATH);
  return { status: 'success', message: 'Subcategory deleted.' };
}
export async function registerExpenseAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const userEmail = text(formData, 'userEmail');
  const amount = text(formData, 'amount');
  const spentOn = text(formData, 'spentOn');
  const target = text(formData, 'target');
  const values = { amount, spentOn, target }; // given back on error, so the form keeps what was typed
  const amountCents = parseAmountToCents(amount);
  if (amountCents === null) {
    return { status: 'error', message: 'Enter an amount, such as 12.50.', values };
  }
  const { categoryId, subcategoryId } = splitTarget(target);
  const result = await getContainer().registerExpense.execute({
    expenseId: crypto.randomUUID(),
    userEmail,
    amountCents,
    spentOn,
    categoryId,
    subcategoryId,
  });
  if (!result.ok) return { status: 'error', message: registerExpenseMessage(result.error), values };
  revalidatePath(PATH);
  return { status: 'success', message: 'Expense registered.' };
}

export async function editExpenseAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const expenseId = text(formData, 'expenseId');
  const userEmail = text(formData, 'userEmail');
  const amount = text(formData, 'amount');
  const spentOn = text(formData, 'spentOn');
  const target = text(formData, 'target');
  const values = { amount, spentOn, target };
  const amountCents = parseAmountToCents(amount);
  if (amountCents === null) {
    return { status: 'error', message: 'Enter an amount, such as 12.50.', values };
  }
  const { categoryId, subcategoryId } = splitTarget(target);
  const result = await getContainer().editExpense.execute({
    expenseId,
    userEmail,
    amountCents,
    spentOn,
    categoryId,
    subcategoryId,
  });
  if (!result.ok) return { status: 'error', message: editExpenseMessage(result.error), values };
  revalidatePath(PATH);
  return { status: 'success', message: 'Expense updated.' };
}

export async function deleteExpenseAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const result = await getContainer().deleteExpense.execute({
    expenseId: text(formData, 'expenseId'),
    userEmail: text(formData, 'userEmail'),
  });
  if (!result.ok) return { status: 'error', message: deleteExpenseMessage(result.error) };
  revalidatePath(PATH);
  return { status: 'success', message: 'Expense deleted.' };
}

/** "12.50" is 1250 cents. Null when the text is not a number at all. */
function parseAmountToCents(raw: string): number | null {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/** A select value is "categoryId" or "categoryId:subcategoryId". */
function splitTarget(target: string): { categoryId: string; subcategoryId?: string } {
  const separator = target.indexOf(':');
  if (separator === -1) return { categoryId: target };
  return { categoryId: target.slice(0, separator), subcategoryId: target.slice(separator + 1) };
}
