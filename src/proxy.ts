// Clerk authentication proxy — implemented in PR-1.
//
// Next.js 16 deprecates the `middleware.ts` file convention in favor of
// `proxy.ts`. We adopt the new convention now so PR-1 can wire Clerk directly
// without a migration step.

import { NextResponse } from 'next/server';

export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
