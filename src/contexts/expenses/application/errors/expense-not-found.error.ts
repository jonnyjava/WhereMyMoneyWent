export type ExpenseNotFound = { readonly kind: 'ExpenseNotFound'; readonly expenseId: string };

export const expenseNotFound = (expenseId: string): ExpenseNotFound => ({
  kind: 'ExpenseNotFound',
  expenseId,
});