import type { User, UserRole } from '@/types';

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN';

  constructor(message = 'You are not authorized to perform this action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Throws `ForbiddenError` if the user's role is not in the allowed set.
 * Returns the user untouched on success for ergonomic chaining.
 *
 * Stub in PR-0 — exercised by tests, wired into actions in PR-1+.
 */
export function requireRole(user: User, allowed: readonly UserRole[]): User {
  if (!allowed.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}
