export type CreateExpenseSubcategoryCommand = {
  readonly categoryId: string;
  readonly subcategoryId: string;
  readonly userEmail: string;
  readonly name: string;
};