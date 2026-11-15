export type ExpenseCategoryNotFound = { readonly kind: 'ExpenseCategoryNotFound'; readonly categoryId: string };

export const expenseCategoryNotFound = (categoryId: string): ExpenseCategoryNotFound => ({
  kind: 'ExpenseCategoryNotFound',
  categoryId,
});