'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getContainer } from '@/composition/container';
import type { FormState } from './form-state';
import { extendLoanMessage, openLoanMessage, returnLoanMessage } from './messages';

// Server actions are the only way the UI changes anything. Each one: reads the form (shape only),
// calls ONE command handler, and turns the Result into a FormState. Business rules stay in the domain.

const DAY_MS = 24 * 60 * 60 * 1000;
const PATH = '/reference/loans';

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export async function openLoanAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const bookId = text(formData, 'bookId');
  const borrowerEmail = text(formData, 'borrowerEmail');
  const rawDays = text(formData, 'days');
  const days = Number(rawDays);
  const values = { bookId, borrowerEmail, days: rawDays }; // given back on error, so the form keeps what was typed
  if (bookId === '' || borrowerEmail === '' || !Number.isFinite(days) || days < 1) {
    return { status: 'error', message: 'Enter a book, an email address and a loan length of 1 day or more.', values };
  }
  const loanId = crypto.randomUUID();
  const result = await getContainer().openLoan.execute({
    loanId,
    bookId,
    borrowerEmail,
    dueDate: new Date(Date.now() + days * DAY_MS),
  });
  if (!result.ok) return { status: 'error', message: openLoanMessage(result.error), values };
  redirect(`${PATH}?id=${encodeURIComponent(loanId)}`);
}

export async function extendLoanAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const days = Number(text(formData, 'days'));
  const result = await getContainer().extendLoan.execute({ loanId: text(formData, 'loanId'), days });
  if (!result.ok) return { status: 'error', message: extendLoanMessage(result.error) };
  revalidatePath(PATH);
  return { status: 'success', message: `Loan extended by ${days} days.` };
}

export async function returnLoanAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const result = await getContainer().returnLoan.execute({ loanId: text(formData, 'loanId') });
  if (!result.ok) return { status: 'error', message: returnLoanMessage(result.error) };
  revalidatePath(PATH);
  return { status: 'success', message: 'Book returned. Thank you.' };
}
