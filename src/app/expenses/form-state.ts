/**
 * What a server action tells the form that called it. Plain data, safe for the browser.
 * `values` returns what the person typed: React resets uncontrolled fields after every action,
 * so a form that shows an error must use these as its defaults, or the person loses their input.
 */
export type FormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: 'idle' };