import { err, ok, type Result } from '@/shared/result';
import type { LoanDto } from '../../dto/loan.dto';
import { loanNotFound, type LoanNotFound } from '../../errors/loan-not-found.error';
import type { LoanReadPort } from '../../ports/loan-read.port';
import type { GetLoanQuery } from './get-loan.query';

export class GetLoanHandler {
  constructor(private readonly reads: LoanReadPort) {}

  async execute(query: GetLoanQuery): Promise<Result<LoanDto, LoanNotFound>> {
    const dto = await this.reads.findDto(query.loanId);
    return dto === null ? err(loanNotFound(query.loanId)) : ok(dto);
  }
}
