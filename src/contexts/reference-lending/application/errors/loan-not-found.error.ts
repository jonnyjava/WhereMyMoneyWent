export type LoanNotFound = { readonly kind: 'LoanNotFound'; readonly loanId: string };

export const loanNotFound = (loanId: string): LoanNotFound => ({ kind: 'LoanNotFound', loanId });
