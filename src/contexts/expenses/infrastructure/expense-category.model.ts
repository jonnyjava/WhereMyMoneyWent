import { pgSchema, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// Product tables live in their own Postgres schema, so they never mingle with the
// reference examples' schema.
export const expensesSchema = pgSchema('expenses');

export const expenseCategories = expensesSchema.table(
  'expense_categories',
  {
    id: text('id').primaryKey(),
    ownerEmail: text('owner_email').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex('expense_categories_owner_name_key').on(table.ownerEmail, table.name)],
);

// Deleting an expense-category deletes its expense-subcategories with it.
export const expenseSubcategories = expensesSchema.table('expense_subcategories', {
  id: text('id').primaryKey(),
  categoryId: text('category_id')
    .notNull()
    .references(() => expenseCategories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
});

export type ExpenseCategoryRow = typeof expenseCategories.$inferSelect;
export type ExpenseSubcategoryRow = typeof expenseSubcategories.$inferSelect;