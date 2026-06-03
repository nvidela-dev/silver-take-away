'use client';

import { Download } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { Button } from '@/app/_components/atoms/button';

interface ExportCsvButtonProps {
  columnIds: readonly string[];
  resource: 'bills' | 'payments';
  tab: string;
}

export function ExportCsvButton({
  columnIds,
  resource,
  tab,
}: ExportCsvButtonProps): React.ReactElement {
  const searchParams = useSearchParams();
  const href = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    params.delete('pageSize');
    params.set('tab', tab);
    params.set('columns', columnIds.join(','));
    return `/api/${resource}/export?${params.toString()}`;
  }, [columnIds, resource, searchParams, tab]);

  return (
    <Button asChild size="sm" variant="outline">
      <a download href={href}>
        <Download aria-hidden className="size-4" />
        Export CSV
      </a>
    </Button>
  );
}
