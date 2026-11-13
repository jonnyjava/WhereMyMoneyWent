export type InvalidDueDate = { readonly kind: 'InvalidDueDate' };
export type LoanAlreadyReturned = { readonly kind: 'LoanAlreadyReturned'; readonly loanId: string };
export type ExtensionLimitReached = {
  readonly kind: 'ExtensionLimitReached';
  readonly loanId: string;
  readonly limit: number;
};

export const invalidDueDate = (): InvalidDueDate => ({ kind: 'InvalidDueDate' });
export const loanAlreadyReturned = (loanId: string): LoanAlreadyReturned => ({
  kind: 'LoanAlreadyReturned',
  loanId,
});
export const extensionLimitReached = (loanId: string, limit: number): ExtensionLimitReached => ({
  kind: 'ExtensionLimitReached',
  loanId,
  limit,
});
