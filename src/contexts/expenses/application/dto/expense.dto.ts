/** Read model returned by queries. Never a domain object. */
export type ExpenseDto = {
  readonly id: string;
  readonly amountCents: number;
  readonly spentOn: string; // YYYY-MM-DD
  readonly categoryId: string;
  readonly subcategoryId: string | null;
  readonly ownerEmail: string;
};