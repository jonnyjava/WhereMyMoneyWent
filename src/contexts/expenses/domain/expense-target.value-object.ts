/**
 * What an expense is attributed to: one of the user's expense-categories, or one of its
 * expense-subcategories. A subcategory target also names its category, so the target can be
 * checked against the category in one step.
 */
export type ExpenseTarget =
  | { readonly kind: 'category'; readonly categoryId: string }
  | { readonly kind: 'subcategory'; readonly categoryId: string; readonly subcategoryId: string };

export const categoryTarget = (categoryId: string): ExpenseTarget => ({ kind: 'category', categoryId });

export const subcategoryTarget = (categoryId: string, subcategoryId: string): ExpenseTarget => ({
  kind: 'subcategory',
  categoryId,
  subcategoryId,
});

/** The target of a command: a subcategory only when the caller named one. */
export const targetFrom = (categoryId: string, subcategoryId: string | undefined): ExpenseTarget =>
  subcategoryId === undefined || subcategoryId === ''
    ? categoryTarget(categoryId)
    : subcategoryTarget(categoryId, subcategoryId);