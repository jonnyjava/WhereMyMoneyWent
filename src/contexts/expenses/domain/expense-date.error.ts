export type InvalidExpenseDate = { readonly kind: 'InvalidExpenseDate'; readonly input: string };

export const invalidExpenseDate = (input: string): InvalidExpenseDate => ({
  kind: 'InvalidExpenseDate',
  input,
});