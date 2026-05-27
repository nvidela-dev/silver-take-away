import type { User, UserRole } from '@/types';

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN';

  constructor(message = 'You are not authorized to perform this action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function requireRole(user: User, allowed: readonly UserRole[]): User {
  if (!allowed.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}
