import type { ReturnCountReadPort } from '../application/ports/return-count-read.port';
import { ReturnCounter, type ReturnCounterProps } from '../domain/return-counter.aggregate';
import type { ReturnCounterRepository } from '../domain/return-counter.repository';

export class InMemoryReturnCounterRepository implements ReturnCounterRepository, ReturnCountReadPort {
  private stored: ReturnCounterProps | null = null;

  async find(): Promise<ReturnCounter | null> {
    return this.stored ? ReturnCounter.reconstitute(this.stored) : null;
  }

  async save(counter: ReturnCounter): Promise<void> {
    this.stored = { ...counter.toSnapshot() };
  }

  async readCount(): Promise<number> {
    return this.stored?.count ?? 0;
  }
}
