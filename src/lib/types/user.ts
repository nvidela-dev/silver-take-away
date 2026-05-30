// User domain. Mirrors the `users` table in the database schema.

import type { UserRole } from './enums';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
