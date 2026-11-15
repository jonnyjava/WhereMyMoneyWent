import { describe, expect, it } from 'vitest';
import { Expense } from './expense.aggregate';
import { Email } from './email.value-object';
import { categoryTarget, subcategoryTarget } from './expense-target.value-object';

const owner = Email.reconstitute('ada@example.com');
const now = new Date('2026-01-15T10:00:00Z');
const other = new Date('2026-01-16T10:00:00Z');

describe('Expense', () => {
  it('registers an expense with a positive amount and a date', () => {
    const expense = Expense.create(
      { id: 'expense-1', amountCents: 1250, spentOn: '2026-01-10', target: categoryTarget('category-1'), ownerEmail: owner },
      now,
    );

    expect(expense.ok).toBe(true);
    expect(expense.ok && expense.value.amount.cents).toBe(1250);
    expect(expense.ok && expense.value.spentOn.value).toBe('2026-01-10');
    expect(expense.ok && expense.value.ownerEmail.equals(owner)).toBe(true);
    expect(expense.ok && expense.value.toSnapshot().createdAt).toBe(now);
  });

  it('defaults the date to today when it is omitted', () => {
    const expense = Expense.create(
      { id: 'expense-1', amountCents: 1250, target: categoryTarget('category-1'), ownerEmail: owner },
      now,
    );

    expect(expense.ok && expense.value.spentOn.value).toBe('2026-01-15');
  });

  it('refuses an amount of 0 or less', () => {
    const expense = Expense.create(
      { id: 'expense-1', amountCents: 0, spentOn: '2026-01-10', target: categoryTarget('category-1'), ownerEmail: owner },
      now,
    );

    expect(expense.ok).toBe(false);
    expect(!expense.ok && expense.error.kind).toBe('InvalidAmount');
  });

  it('refuses a date that is not a real day', () => {
    const expense = Expense.create(
      { id: 'expense-1', amountCents: 1250, spentOn: '2026-02-30', target: categoryTarget('category-1'), ownerEmail: owner },
      now,
    );

    expect(expense.ok).toBe(false);
    expect(!expense.ok && expense.error.kind).toBe('InvalidExpenseDate');
  });

  it('edits the amount, the date and the target', () => {
    const expense = Expense.create(
      { id: 'expense-1', amountCents: 1250, spentOn: '2026-01-10', target: categoryTarget('category-1'), ownerEmail: owner },
      now,
    );
    if (!expense.ok) throw new Error('fixture must be valid');

    const edited = expense.value.edit(
      { amountCents: 2000, spentOn: '2026-01-12', target: subcategoryTarget('category-1', 'subcategory-1') },
      other,
    );

    expect(edited.ok).toBe(true);
    expect(expense.value.amount.cents).toBe(2000);
    expect(expense.value.spentOn.value).toBe('2026-01-12');
    expect(expense.value.target).toEqual(subcategoryTarget('category-1', 'subcategory-1'));
  });

  it('refuses an edit to an amount of 0 or less and keeps the old amount', () => {
    const expense = Expense.create(
      { id: 'expense-1', amountCents: 1250, spentOn: '2026-01-10', target: categoryTarget('category-1'), ownerEmail: owner },
      now,
    );
    if (!expense.ok) throw new Error('fixture must be valid');

    const edited = expense.value.edit(
      { amountCents: -1, spentOn: '2026-01-12', target: categoryTarget('category-1') },
      other,
    );

    expect(edited.ok).toBe(false);
    expect(!edited.ok && edited.error.kind).toBe('InvalidAmount');
    expect(expense.value.amount.cents).toBe(1250);
    expect(expense.value.spentOn.value).toBe('2026-01-10');
  });
});