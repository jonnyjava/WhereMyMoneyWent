import { date, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { expensesSchema, expenseCategories, expenseSubcategories } from './expense-category.model';

/**
 * An amount spent on a date. Deleting the category or the subcategory it is attributed to deletes
 * the expense with it, so an expense never points at a target that no longer exists.
 */
export const expenses = expensesSchema.table(
  'expenses',
  {
    id: text('id').primaryKey(),
    ownerEmail: text('owner_email').notNull(),
    amountCents: integer('amount_cents').notNull(),
    spentOn: date('spent_on', { mode: 'string' }).notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => expenseCategories.id, { onDelete: 'cascade' }),
    subcategoryId: text('subcategory_id').references(() => expenseSubcategories.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('expenses_owner_spent_on_created_at_idx').on(table.ownerEmail, table.spentOn, table.createdAt),
  ],
);

export type ExpenseRow = typeof expenses.$inferSelect;