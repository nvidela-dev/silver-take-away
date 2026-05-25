// Clerk authentication middleware — implemented in PR-1.
//
// Note: Next.js 16 deprecates the `middleware.ts` convention in favor of
// `proxy.ts`. We keep `middleware.ts` here because Clerk's official middleware
// still ships as `clerkMiddleware`. We will reconcile naming in PR-1 once we
// validate Clerk's Next 16 compatibility.

import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
