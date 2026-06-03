import { redirect } from 'next/navigation';

export default function Home(): void {
  redirect('/bills?tab=drafts');
}
