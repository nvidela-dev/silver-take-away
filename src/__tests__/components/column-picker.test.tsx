import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import { ColumnPicker } from '@/app/(dashboard)/bills/_components/column-picker';
import type { BillsTableColumn } from '@/app/(dashboard)/bills/_components/bills-table';

const noopRender: BillsTableColumn['render'] = () => null;

const configurableColumns: BillsTableColumn[] = [
  { id: 'status', header: 'Status', render: noopRender },
  { id: 'amount', header: 'Amount', render: noopRender },
  { id: 'dueDate', header: 'Due date', render: noopRender },
];

afterEach(() => {
  cleanup();
});

describe('ColumnPicker', () => {
  it('renders nothing when there are no configurable columns', () => {
    const { container } = render(
      <ColumnPicker columns={[]} hiddenIds={new Set()} onToggle={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('opens the menu and lists one checkbox per configurable column', async () => {
    const user = userEvent.setup();
    render(
      <ColumnPicker
        columns={configurableColumns}
        hiddenIds={new Set()}
        onToggle={() => {}}
      />,
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /columns/i }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Status' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Amount' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Due date' })).toBeChecked();
  });

  it('marks hidden columns as unchecked', async () => {
    const user = userEvent.setup();
    render(
      <ColumnPicker
        columns={configurableColumns}
        hiddenIds={new Set(['amount'])}
        onToggle={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /columns/i }));

    expect(screen.getByRole('checkbox', { name: 'Status' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Amount' })).not.toBeChecked();
  });

  it('calls onToggle with the column id when a checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <ColumnPicker
        columns={configurableColumns}
        hiddenIds={new Set()}
        onToggle={onToggle}
      />,
    );

    await user.click(screen.getByRole('button', { name: /columns/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Amount' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('amount');
  });

  it('closes the menu when the user presses Escape', async () => {
    const user = userEvent.setup();
    render(
      <ColumnPicker
        columns={configurableColumns}
        hiddenIds={new Set()}
        onToggle={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /columns/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
