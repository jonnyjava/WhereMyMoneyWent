export type RenameExpenseSubcategoryCommand = {
  readonly categoryId: string;
  readonly subcategoryId: string;
  readonly userEmail: string;
  readonly name: string;
};