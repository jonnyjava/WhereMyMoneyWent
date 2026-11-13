import { integer, jsonb, pgSchema, text } from 'drizzle-orm/pg-core';

const referenceSchema = pgSchema('reference');

export const returnCounters = referenceSchema.table('return_counters', {
  id: text('id').primaryKey(),
  count: integer('count').notNull().default(0),
  countedLoanIds: jsonb('counted_loan_ids').$type<string[]>().notNull().default([]),
});

export type ReturnCounterRow = typeof returnCounters.$inferSelect;
