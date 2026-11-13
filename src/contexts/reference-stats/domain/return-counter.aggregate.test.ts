import { describe, expect, it } from 'vitest';
import { ReturnCounter } from './return-counter.aggregate';

describe('ReturnCounter', () => {
  it('counts each returned loan once', () => {
    const counter = ReturnCounter.create();

    counter.recordReturn('loan-1');
    counter.recordReturn('loan-2');

    expect(counter.toSnapshot().count).toBe(2);
  });

  it('ignores the same loan reported twice (idempotent)', () => {
    const counter = ReturnCounter.create();

    counter.recordReturn('loan-1');
    counter.recordReturn('loan-1');

    expect(counter.toSnapshot().count).toBe(1);
  });
});
