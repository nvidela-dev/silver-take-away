import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import { ExportCsvButton } from '@/app/_components/molecules/export-csv-button';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(
    'tab=history&status=paid&sort=amount&dir=asc&page=3&pageSize=25',
  ),
}));

afterEach(() => {
  cleanup();
});

describe('ExportCsvButton', () => {
  it('exports active filters and sort without limiting the CSV to the visible page', () => {
    render(
      <ExportCsvButton
        columnIds={['vendor', 'amount']}
        resource="bills"
        tab="history"
      />,
    );

    expect(screen.getByRole('link', { name: 'Export CSV' })).toHaveAttribute(
      'href',
      '/api/bills/export?tab=history&status=paid&sort=amount&dir=asc&columns=vendor%2Camount',
    );
  });
});
