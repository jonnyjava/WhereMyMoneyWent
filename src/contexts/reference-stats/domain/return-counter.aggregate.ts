export type ReturnCounterProps = {
  id: string;
  count: number;
  countedLoanIds: string[];
};

/** Counts returned loans. Idempotent: the same loan is never counted twice. */
export class ReturnCounter {
  static readonly SINGLETON_ID = 'global';

  private constructor(private props: ReturnCounterProps) {}

  static create(): ReturnCounter {
    return new ReturnCounter({ id: ReturnCounter.SINGLETON_ID, count: 0, countedLoanIds: [] });
  }

  static reconstitute(props: ReturnCounterProps): ReturnCounter {
    return new ReturnCounter({ ...props, countedLoanIds: [...props.countedLoanIds] });
  }

  toSnapshot(): Readonly<ReturnCounterProps> {
    return { ...this.props, countedLoanIds: [...this.props.countedLoanIds] };
  }

  recordReturn(loanId: string): void {
    if (this.props.countedLoanIds.includes(loanId)) return;
    this.props.countedLoanIds.push(loanId);
    this.props.count += 1;
  }
}
