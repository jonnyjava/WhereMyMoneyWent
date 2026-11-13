import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { LoanReturned } from '@/contexts/reference-lending';
import { ExtendLoanHandler } from '@/contexts/reference-lending/application/commands/extend-loan/extend-loan.handler';
import { OpenLoanHandler } from '@/contexts/reference-lending/application/commands/open-loan/open-loan.handler';
import { ReturnLoanHandler } from '@/contexts/reference-lending/application/commands/return-loan/return-loan.handler';
import { GetLoanHandler } from '@/contexts/reference-lending/application/queries/get-loan/get-loan.handler';
import { DrizzleLoanRepository } from '@/contexts/reference-lending/infrastructure/drizzle-loan.repository';
import { RecordReturnHandler } from '@/contexts/reference-stats/application/commands/record-return/record-return.handler';
import { OnLoanReturnedHandler } from '@/contexts/reference-stats/application/event-handlers/on-loan-returned.event-handler';
import { GetReturnCountHandler } from '@/contexts/reference-stats/application/queries/get-return-count/get-return-count.handler';
import { DrizzleReturnCounterRepository } from '@/contexts/reference-stats/infrastructure/drizzle-return-counter.repository';
import { systemClock, type Clock } from '@/shared/clock';
import type { EventBus } from '@/shared/event-bus';
import { InProcessEventBus } from '@/shared/in-process-event-bus';

export type Container = {
  openLoan: OpenLoanHandler;
  extendLoan: ExtendLoanHandler;
  returnLoan: ReturnLoanHandler;
  getLoan: GetLoanHandler;
  getReturnCount: GetReturnCountHandler;
  close(): Promise<void>;
};

export type ContainerOptions = { databaseUrl: string; clock?: Clock; eventBus?: EventBus };

/** Wires repositories, handlers and event subscriptions. No other code constructs these. */
export function createContainer(options: ContainerOptions): Container {
  const sql = postgres(options.databaseUrl, { onnotice: () => {} });
  const db = drizzle(sql);
  const clock = options.clock ?? systemClock;
  const events = options.eventBus ?? new InProcessEventBus();

  const loans = new DrizzleLoanRepository(db);
  const counters = new DrizzleReturnCounterRepository(db);

  // Cross-context reaction: reference-stats subscribes to reference-lending's event.
  const onLoanReturned = new OnLoanReturnedHandler(new RecordReturnHandler(counters));
  events.subscribe<LoanReturned>(OnLoanReturnedHandler.EVENT_NAME, (event) =>
    onLoanReturned.handle(event),
  );

  return {
    openLoan: new OpenLoanHandler(loans, events, clock),
    extendLoan: new ExtendLoanHandler(loans, events, clock),
    returnLoan: new ReturnLoanHandler(loans, events, clock),
    getLoan: new GetLoanHandler(loans),
    getReturnCount: new GetReturnCountHandler(counters),
    close: () => sql.end(),
  };
}
