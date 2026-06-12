'use client';

import { UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { userRoleDisplay } from '@/app/_display';
import { Select } from '@/app/_components/atoms/select';
import { selectMockUser } from '@/lib/actions/mock-user/select';
import {
  mockUserProfiles,
  type MockUserProfile,
} from '@/lib/auth/mock-users';

export function MockUserSwitcher({
  selectedUser,
  compact = false,
}: {
  selectedUser: MockUserProfile;
  compact?: boolean;
}): React.ReactElement {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState(selectedUser.key);
  const [isPending, startTransition] = useTransition();

  function handleChange(key: string): void {
    setSelectedKey(key);
    startTransition(async () => {
      await selectMockUser(key);
      router.refresh();
    });
  }

  if (compact) {
    return (
      <Select
        aria-label="Act as user"
        className="max-w-44"
        controlSize="sm"
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value)}
        value={selectedKey}
      >
        {mockUserProfiles.map((profile) => (
          <option key={profile.key} value={profile.key}>
            {profile.fullName}
            {' - '}
            {userRoleDisplay[profile.role].label}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2 text-slate-600">
        <UserRound aria-hidden className="size-4 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-950">
            {selectedUser.fullName}
          </p>
          <p className="text-xs">{userRoleDisplay[selectedUser.role].label}</p>
        </div>
      </div>
      <Select
        aria-label="Act as user"
        controlSize="sm"
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value)}
        value={selectedKey}
      >
        {mockUserProfiles.map((profile) => (
          <option key={profile.key} value={profile.key}>
            {profile.fullName}
            {' - '}
            {userRoleDisplay[profile.role].label}
          </option>
        ))}
      </Select>
    </div>
  );
}
