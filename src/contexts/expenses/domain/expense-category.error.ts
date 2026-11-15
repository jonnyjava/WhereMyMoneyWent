export type InvalidCategoryName = { readonly kind: 'InvalidCategoryName'; readonly input: string };

export const invalidCategoryName = (input: string): InvalidCategoryName => ({
  kind: 'InvalidCategoryName',
  input,
});

export type ExpenseCategoryNameAlreadyExists = {
  readonly kind: 'ExpenseCategoryNameAlreadyExists';
  readonly name: string;
};

export const expenseCategoryNameAlreadyExists = (name: string): ExpenseCategoryNameAlreadyExists => ({
  kind: 'ExpenseCategoryNameAlreadyExists',
  name,
});
export type ExpenseCategoryHasSubcategories = {
  readonly kind: 'ExpenseCategoryHasSubcategories';
  readonly categoryId: string;
};

export const expenseCategoryHasSubcategories = (categoryId: string): ExpenseCategoryHasSubcategories => ({
  kind: 'ExpenseCategoryHasSubcategories',
  categoryId,
});
