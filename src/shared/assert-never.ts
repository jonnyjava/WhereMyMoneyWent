/** Makes a `switch` exhaustive: adding a new error kind fails the typechecker. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
