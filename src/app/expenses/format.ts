import type { ExpenseCategoryDto, ExpenseDto, ExpenseSubcategoryDto } from '@/contexts/expenses';

/** A choice in the "category or subcategory" select. The value is `categoryId` or `categoryId:subcategoryId`. */
export type ExpenseTargetOption = { readonly value: string; readonly label: string };

export type SubcategoriesByCategory = ReadonlyMap<string, readonly ExpenseSubcategoryDto[]>;

export function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** "Food" or "Food › Groceries", for a person reading the list. */
export function targetLabel(
  expense: ExpenseDto,
  categories: readonly ExpenseCategoryDto[],
  subcategories: SubcategoriesByCategory,
): string {
  const category = categories.find((candidate) => candidate.id === expense.categoryId);
  const categoryName = category === undefined ? expense.categoryId : category.name;
  if (expense.subcategoryId === null) return categoryName;

  const subcategory = (subcategories.get(expense.categoryId) ?? []).find(
    (candidate) => candidate.id === expense.subcategoryId,
  );
  return subcategory === undefined ? categoryName : `${categoryName} › ${subcategory.name}`;
}

/** The value the select shows for an expense. */
export function targetValue(expense: ExpenseDto): string {
  return expense.subcategoryId === null
    ? expense.categoryId
    : `${expense.categoryId}:${expense.subcategoryId}`;
}

/**
 * The targets an expense may be attributed to: every expense-subcategory, and every
 * expense-category that has none (a category with expense-subcategories is refused as a target).
 */
export function expenseTargetOptions(
  categories: readonly ExpenseCategoryDto[],
  subcategories: SubcategoriesByCategory,
): ExpenseTargetOption[] {
  const options: ExpenseTargetOption[] = [];
  for (const category of categories) {
    const children = subcategories.get(category.id) ?? [];
    if (children.length === 0) options.push({ value: category.id, label: category.name });
    for (const subcategory of children) {
      options.push({ value: `${category.id}:${subcategory.id}`, label: `${category.name} › ${subcategory.name}` });
    }
  }
  return options;
}