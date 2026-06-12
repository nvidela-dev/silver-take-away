import type { ReactNode } from 'react';

import { getSelectedMockUserProfile } from '@/lib/auth/current-user';

import { DashboardShell } from './_components/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.ReactElement> {
  const selectedUser = await getSelectedMockUserProfile();

  return (
    <DashboardShell selectedUser={selectedUser}>
      {children}
    </DashboardShell>
  );
}
