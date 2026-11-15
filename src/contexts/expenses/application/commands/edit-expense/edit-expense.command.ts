export type EditExpenseCommand = {
  readonly expenseId: string;
  readonly userEmail: string;
  readonly amountCents: number;
  /** `YYYY-MM-DD`. Defaults to today when omitted. */
  readonly spentOn?: string;
  readonly categoryId: string;
  readonly subcategoryId?: string;
};