import { describe, expect, it } from 'vitest';
import { Email } from './email.value-object';

describe('Email', () => {
  it('normalizes a valid address', () => {
    const result = Email.create('  Ada@Example.COM ');
    expect(result.ok && result.value.value).toBe('ada@example.com');
  });

  it('rejects an address without a domain', () => {
    expect(Email.create('ada@')).toEqual({
      ok: false,
      error: { kind: 'InvalidEmail', input: 'ada@' },
    });
  });

  it('compares by value', () => {
    expect(Email.reconstitute('a@b.co').equals(Email.reconstitute('a@b.co'))).toBe(true);
    expect(Email.reconstitute('a@b.co').equals(Email.reconstitute('c@d.co'))).toBe(false);
  });
});
