import { describe, expect, it } from 'vitest';
import { Email } from './email.value-object';

describe('Email', () => {
  it('normalizes a valid address to lower case without surrounding spaces', () => {
    const email = Email.create('  Ada@Example.com ');

    expect(email.ok && email.value.value).toBe('ada@example.com');
  });

  it('refuses an address without a domain', () => {
    const email = Email.create('ada@example');

    expect(email.ok).toBe(false);
    expect(!email.ok && email.error.kind).toBe('InvalidEmail');
  });

  it('refuses an empty address', () => {
    expect(Email.create('   ').ok).toBe(false);
  });

  it('compares two addresses by value', () => {
    const one = Email.create('ada@example.com');
    const same = Email.create('ADA@example.com');
    const other = Email.create('grace@example.com');

    expect(one.ok && same.ok && one.value.equals(same.value)).toBe(true);
    expect(one.ok && other.ok && one.value.equals(other.value)).toBe(false);
  });
});