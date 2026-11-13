import { ReturnCounter } from '../../../domain/return-counter.aggregate';
import type { ReturnCounterRepository } from '../../../domain/return-counter.repository';
import { ok, type Result } from '@/shared/result';
import type { RecordReturnCommand } from './record-return.command';

export class RecordReturnHandler {
  constructor(private readonly counters: ReturnCounterRepository) {}

  async execute(command: RecordReturnCommand): Promise<Result<void, never>> {
    const counter = (await this.counters.find()) ?? ReturnCounter.create();
    counter.recordReturn(command.loanId);
    await this.counters.save(counter);
    return ok(undefined);
  }
}
