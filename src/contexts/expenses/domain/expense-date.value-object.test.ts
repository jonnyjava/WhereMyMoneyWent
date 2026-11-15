import { describe, expect, it } from 'vitest';
import { ExpenseDate } from './expense-date.value-object';

describe('ExpenseDate', () => {
  it('keeps a real calendar day', () => {
    const date = ExpenseDate.create('2026-01-15');

    expect(date.ok && date.value.value).toBe('2026-01-15');
  });

  it('trims the input', () => {
    const date = ExpenseDate.create(' 2026-01-15 ');

    expect(date.ok && date.value.value).toBe('2026-01-15');
  });

  it('refuses a day that does not exist', () => {
    expect(ExpenseDate.create('2026-02-30').ok).toBe(false);
    expect(ExpenseDate.create('2026-13-01').ok).toBe(false);
  });

  it('refuses a date that is not written as YYYY-MM-DD', () => {
    expect(ExpenseDate.create('15-01-2026').ok).toBe(false);
    expect(ExpenseDate.create('today').ok).toBe(false);
    expect(ExpenseDate.create('').ok).toBe(false);
  });

  it('is today in UTC when it is built from the clock', () => {
    const date = ExpenseDate.today(new Date('2026-01-15T23:30:00.000Z'));

    expect(date.value).toBe('2026-01-15');
  });

  it('compares two dates by value', () => {
    const one = ExpenseDate.create('2026-01-15');
    const same = ExpenseDate.reconstitute('2026-01-15');
    const other = ExpenseDate.create('2026-01-16');

    expect(one.ok && one.value.equals(same)).toBe(true);
    expect(one.ok && other.ok && one.value.equals(other.value)).toBe(false);
  });
});