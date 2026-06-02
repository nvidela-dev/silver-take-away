// Centralized sink for errors that fall through domain-specific handling.
//
// Each domain maps its *expected* failures (auth, conflicts, not-found,
// validation, invalid transitions) to user-facing results. Anything that
// reaches a catch-all branch is unexpected — a bug, a downed dependency, a
// driver error — and would otherwise be invisible in production because the
// user only ever sees a generic, safe message.
//
// We log the full error (stack included) server-side so those failures stay
// debuggable, while callers keep returning the generic message so internals
// are never leaked to the client.
export function reportUnexpectedError(context: string, error: unknown): void {
  // eslint-disable-next-line no-console -- server-side error sink; see module doc.
  console.error(`[unexpected:${context}]`, error);
}
