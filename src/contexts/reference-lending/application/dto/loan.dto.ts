/** Read model returned by queries. Never a domain object. */
export type LoanDto = {
  readonly id: string;
  readonly bookId: string;
  readonly borrowerEmail: string;
  readonly dueDate: string; // ISO 8601
  readonly extensions: number;
  readonly returned: boolean;
};
