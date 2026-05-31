'use client';

import { Button } from '@/app/_components/ui/button';
import type { BillReferenceData } from '@/lib/types/bill/filters';
import type { BillFilterTab } from '@/lib/types/bill/tabs';

import type { BillFiltersController } from '../hooks/use-bill-filters';
import { useBillFilterBar } from '../hooks/use-bill-filter-bar';
import { AddFilterPopover } from './add-filter-popover';
import { BillFilterChip } from './bill-filter-chip';

interface BillFilterBarProps {
  controller: BillFiltersController;
  options: BillReferenceData;
  tab: BillFilterTab;
}

export function BillFilterBar({ controller, options, tab }: BillFilterBarProps) {
  const bar = useBillFilterBar({ controller, tab });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {bar.activeDimensions.map((dimension) => {
        const { Editor } = dimension;
        return (
          <BillFilterChip
            initialOpen={dimension.id === bar.pendingOpenId}
            key={dimension.id}
            label={dimension.label}
            onClear={() => bar.clearDimension(dimension)}
            renderEditor={(close) => (
              <Editor controller={controller} onClose={close} options={options} />
            )}
            valueSummary={dimension.summarise(controller, options)}
          />
        );
      })}
      <AddFilterPopover
        dimensions={bar.inactiveDimensions}
        onPick={bar.pickDimension}
      />
      {bar.activeDimensions.length > 0 ? (
        <Button onClick={bar.clearAll} size="sm" type="button" variant="ghost">
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
