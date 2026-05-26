import { SignIn } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem 1rem',
      }}
    >
      {clerkEnabled ? (
        <SignIn />
      ) : (
        <p style={{ color: '#475569', textAlign: 'center' }}>
          Clerk is not configured. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to enable sign-in.
        </p>
      )}
    </main>
  );
}
