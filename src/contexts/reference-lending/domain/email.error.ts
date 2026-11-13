export type InvalidEmail = { readonly kind: 'InvalidEmail'; readonly input: string };

export const invalidEmail = (input: string): InvalidEmail => ({ kind: 'InvalidEmail', input });
