import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import { BulkActionsMenu } from '@/app/_components/molecules/bulk-actions-menu';

afterEach(() => {
  cleanup();
});

describe('BulkActionsMenu', () => {
  it('renders a disabled trigger when nothing is selected', () => {
    render(
      <BulkActionsMenu
        actions={[{ id: 'approve', label: 'Approve', onClick: () => {} }]}
        count={0}
        entityLabel="bill"
        onClear={() => {}}
      />,
    );
    const trigger = screen.getByRole('button', { name: /bulk actions/i });
    expect(trigger).toBeDisabled();
  });

  it('shows the selected count on the trigger badge', () => {
    render(
      <BulkActionsMenu
        actions={[{ id: 'approve', label: 'Approve', onClick: () => {} }]}
        count={3}
        entityLabel="bill"
        onClear={() => {}}
      />,
    );
    const trigger = screen.getByRole('button', { name: /bulk actions/i });
    expect(trigger).toHaveTextContent('3');
  });

  it('opens a menu listing every action when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionsMenu
        actions={[
          { id: 'approve', label: 'Approve', onClick: () => {} },
          {
            id: 'reject', label: 'Reject', variant: 'destructive', onClick: () => {},
          },
        ]}
        count={2}
        entityLabel="bill"
        onClear={() => {}}
      />,
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /bulk actions/i }));

    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveTextContent('2 bills selected');
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('fires an action handler and closes the menu on click', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(
      <BulkActionsMenu
        actions={[{ id: 'approve', label: 'Approve', onClick: onApprove }]}
        count={2}
        entityLabel="bill"
        onClear={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /bulk actions/i }));
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onClear when Clear selection is clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <BulkActionsMenu
        actions={[{ id: 'approve', label: 'Approve', onClick: () => {} }]}
        count={2}
        entityLabel="bill"
        onClear={onClear}
      />,
    );

    await user.click(screen.getByRole('button', { name: /bulk actions/i }));
    await user.click(screen.getByRole('button', { name: /clear selection/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('disables the trigger while pending', async () => {
    render(
      <BulkActionsMenu
        actions={[{ id: 'approve', label: 'Approve', onClick: () => {} }]}
        count={2}
        entityLabel="bill"
        isPending
        onClear={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /bulk actions/i })).toBeDisabled();
  });

  it('uses the supplied entity label for payment workspaces', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionsMenu
        actions={[{ id: 'release', label: 'Release', onClick: () => {} }]}
        count={2}
        entityLabel="payment"
        onClear={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /bulk actions/i }));
    expect(screen.getByRole('menu')).toHaveTextContent('2 payments selected');
  });
});
