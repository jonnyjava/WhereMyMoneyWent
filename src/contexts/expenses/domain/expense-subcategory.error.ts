export type InvalidSubcategoryName = { readonly kind: 'InvalidSubcategoryName'; readonly input: string };

export const invalidSubcategoryName = (input: string): InvalidSubcategoryName => ({
  kind: 'InvalidSubcategoryName',
  input,
});

export type SubcategoryNameAlreadyExists = {
  readonly kind: 'SubcategoryNameAlreadyExists';
  readonly name: string;
};

export const expenseSubcategoryNameAlreadyExists = (name: string): SubcategoryNameAlreadyExists => ({
  kind: 'SubcategoryNameAlreadyExists',
  name,
});

export type ExpenseSubcategoryNotFound = {
  readonly kind: 'ExpenseSubcategoryNotFound';
  readonly subcategoryId: string;
};

export const expenseSubcategoryNotFound = (subcategoryId: string): ExpenseSubcategoryNotFound => ({
  kind: 'ExpenseSubcategoryNotFound',
  subcategoryId,
});