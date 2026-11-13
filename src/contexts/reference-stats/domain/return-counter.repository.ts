import type { ReturnCounter } from './return-counter.aggregate';

export interface ReturnCounterRepository {
  find(): Promise<ReturnCounter | null>;
  save(counter: ReturnCounter): Promise<void>;
}
