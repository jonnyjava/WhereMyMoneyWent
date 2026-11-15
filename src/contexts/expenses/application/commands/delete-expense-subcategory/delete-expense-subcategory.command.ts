export type DeleteExpenseSubcategoryCommand = {
  readonly categoryId: string;
  readonly subcategoryId: string;
  readonly userEmail: string;
};