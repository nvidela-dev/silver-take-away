import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import { BillsBulkActionsBar } from '@/app/(dashboard)/bills/_components/bills-bulk-actions-bar';

afterEach(() => {
  cleanup();
});

describe('BillsBulkActionsBar', () => {
  it('renders nothing when no rows are selected', () => {
    const { container } = render(
      <BillsBulkActionsBar actions={[]} count={0} onClear={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the selected count with correct pluralisation', () => {
    const { rerender } = render(
      <BillsBulkActionsBar
        actions={[]}
        count={1}
        onClear={() => {}}
      />,
    );
    expect(screen.getByText(/1 bill selected/)).toBeInTheDocument();

    rerender(
      <BillsBulkActionsBar
        actions={[]}
        count={3}
        onClear={() => {}}
      />,
    );
    expect(screen.getByText(/3 bills selected/)).toBeInTheDocument();
  });

  it('fires an action handler when its button is clicked', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(
      <BillsBulkActionsBar
        actions={[{ id: 'approve', label: 'Approve', onClick: onApprove }]}
        count={2}
        onClear={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('calls onClear when the clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<BillsBulkActionsBar actions={[]} count={2} onClear={onClear} />);

    await user.click(screen.getByRole('button', { name: /clear selection/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('disables all buttons while pending', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onClear = vi.fn();
    render(
      <BillsBulkActionsBar
        actions={[{ id: 'approve', label: 'Approve', onClick: onApprove }]}
        count={2}
        isPending
        onClear={onClear}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    await user.click(screen.getByRole('button', { name: /clear selection/i }));
    expect(onApprove).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });
});
