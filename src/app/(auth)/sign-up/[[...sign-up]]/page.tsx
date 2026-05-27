import { SignUp } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-8">
      {clerkEnabled ? (
        <SignUp />
      ) : (
        <p className="text-center text-slate-600">
          Clerk is not configured. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to enable sign-up.
        </p>
      )}
    </main>
  );
}
