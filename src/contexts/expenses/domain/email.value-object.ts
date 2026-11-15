import { err, ok, type Result } from '@/shared/result';
import { invalidEmail, type InvalidEmail } from './email.error';

/** A user is identified by their email address: there is no registration or login. */
export class Email {
  private constructor(readonly value: string) {}

  /** Validates. Use `reconstitute` for values that were already validated and stored. */
  static create(input: string): Result<Email, InvalidEmail> {
    const normalized = input.trim().toLowerCase();
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)
      ? ok(new Email(normalized))
      : err(invalidEmail(input));
  }

  static reconstitute(value: string): Email {
    return new Email(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}