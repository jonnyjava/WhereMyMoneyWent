import { integer, pgSchema, text, timestamp } from 'drizzle-orm/pg-core';

// Reference tables live in their own Postgres schema so they never mingle with
// product tables and can be dropped later by a deliberate, human-approved migration.
export const referenceSchema = pgSchema('reference');

export const loans = referenceSchema.table('loans', {
  id: text('id').primaryKey(),
  bookId: text('book_id').notNull(),
  borrowerEmail: text('borrower_email').notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  extensions: integer('extensions').notNull().default(0),
  returnedAt: timestamp('returned_at', { withTimezone: true }),
});

export type LoanRow = typeof loans.$inferSelect;
