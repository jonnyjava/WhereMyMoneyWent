export type OpenLoanCommand = {
  readonly loanId: string;
  readonly bookId: string;
  readonly borrowerEmail: string;
  readonly dueDate: Date;
};
