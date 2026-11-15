export type InvalidAmount = { readonly kind: 'InvalidAmount'; readonly cents: number };

export const invalidAmount = (cents: number): InvalidAmount => ({ kind: 'InvalidAmount', cents });