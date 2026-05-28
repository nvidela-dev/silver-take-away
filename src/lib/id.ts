export function createUuid(): string {
  // Next.js 16 requires Node >=20.9; this lint rule has not caught up.
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  return crypto.randomUUID();
}
