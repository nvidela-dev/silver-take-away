import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';

import { MockUserSwitcher } from '@/app/(dashboard)/_components/mock-user-switcher';
import { mockUserProfiles } from '@/lib/auth/mock-users';

const refresh = vi.fn();
const selectMockUser = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/lib/actions/mock-user/select', () => ({
  selectMockUser: (key: string) => selectMockUser(key),
}));

afterEach(() => {
  cleanup();
  refresh.mockReset();
  selectMockUser.mockReset();
});

describe('MockUserSwitcher', () => {
  it('selects a mock identity and refreshes server-rendered data', async () => {
    const user = userEvent.setup();
    selectMockUser.mockResolvedValue(undefined);

    render(<MockUserSwitcher selectedUser={mockUserProfiles[0]} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Act as user' }), 'approver');

    expect(selectMockUser).toHaveBeenCalledWith('approver');
    expect(refresh).toHaveBeenCalledOnce();
  });
});
