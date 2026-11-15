import { describe, expect, it } from 'vitest';
import { ExpenseAmount } from './expense-amount.value-object';

describe('ExpenseAmount', () => {
  it('keeps a positive amount in cents', () => {
    const amount = ExpenseAmount.create(1250);

    expect(amount.ok && amount.value.cents).toBe(1250);
  });

  it('refuses an amount of 0 or less', () => {
    const zero = ExpenseAmount.create(0);
    const negative = ExpenseAmount.create(-1);

    expect(zero.ok).toBe(false);
    expect(!zero.ok && zero.error.kind).toBe('InvalidAmount');
    expect(negative.ok).toBe(false);
    expect(!negative.ok && negative.error.kind).toBe('InvalidAmount');
  });

  it('refuses an amount that is not a whole number of cents', () => {
    expect(ExpenseAmount.create(1.5).ok).toBe(false);
  });

  it('compares two amounts by value', () => {
    const one = ExpenseAmount.create(1250);
    const same = ExpenseAmount.create(1250);
    const other = ExpenseAmount.create(1300);

    expect(one.ok && same.ok && one.value.equals(same.value)).toBe(true);
    expect(one.ok && other.ok && one.value.equals(other.value)).toBe(false);
  });
});