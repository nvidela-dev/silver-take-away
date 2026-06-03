import type { UserRole } from '@/lib/types/enums';
import type { User } from '@/lib/types/user';

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN';

  constructor(message: string = 'You are not authorized to perform this action.') {
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
