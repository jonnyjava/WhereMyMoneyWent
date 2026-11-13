import type { ReturnCountReadPort } from '../../ports/return-count-read.port';
import type { GetReturnCountQuery } from './get-return-count.query';

export class GetReturnCountHandler {
  constructor(private readonly reads: ReturnCountReadPort) {}

  async execute(query: GetReturnCountQuery): Promise<number> {
    void query;
    return this.reads.readCount();
  }
}
