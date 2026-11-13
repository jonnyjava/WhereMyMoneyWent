import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; pending?: boolean };

const BASE =
  'inline-flex items-center justify-center rounded-control px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:opacity-90',
  secondary: 'border border-field bg-surface text-ink hover:bg-surface-raised',
};

/** A button. While `pending` it is disabled and announces that it is busy. */
export function Button({ variant = 'primary', pending = false, disabled, className = '', type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`${BASE} ${VARIANTS[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
