import type { User } from "@/types";

/**
 * Resolves the current Clerk session to the local `users` row.
 *
 * Stubbed in PR-0 — the real implementation lands in PR-1 once Clerk is wired
 * up. Server actions and queries should import from here from day one so the
 * later swap is a no-op for callers.
 */
export async function requireAuth(): Promise<User> {
  throw new Error("requireAuth() is not implemented yet — wired up in PR-1.");
}
