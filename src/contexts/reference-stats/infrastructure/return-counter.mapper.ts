import { ReturnCounter } from '../domain/return-counter.aggregate';
import type { ReturnCounterRow } from './return-counter.model';

export const returnCounterMapper = {
  toDomain(row: ReturnCounterRow): ReturnCounter {
    return ReturnCounter.reconstitute({
      id: row.id,
      count: row.count,
      countedLoanIds: row.countedLoanIds,
    });
  },

  toRow(counter: ReturnCounter): ReturnCounterRow {
    const s = counter.toSnapshot();
    return { id: s.id, count: s.count, countedLoanIds: [...s.countedLoanIds] };
  },
};
