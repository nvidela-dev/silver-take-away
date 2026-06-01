'use client';

import { FilterBar } from '@/app/_components/molecules/filters/filter-bar';
import type { BillReferenceData } from '@/lib/types/bill/filters';
import type { BillFilterTab } from '@/lib/types/bill/tabs';

import type { BillFiltersController } from '../hooks/use-bill-filters';
import { useBillFilterBar } from '../hooks/use-bill-filter-bar';

interface BillFilterBarProps {
  controller: BillFiltersController;
  options: BillReferenceData;
  tab: BillFilterTab | 'overview';
}

export function BillFilterBar({ controller, options, tab }: BillFilterBarProps) {
  const bar = useBillFilterBar({ controller, tab });
  const activeFilters = bar.activeDimensions.map((dimension) => {
    const { Editor } = dimension;
    return {
      id: dimension.id,
      initialOpen: dimension.id === bar.pendingOpenId,
      label: dimension.label,
      renderEditor: (close: () => void) => (
        <Editor controller={controller} onClose={close} options={options} />
      ),
      valueSummary: dimension.summarise(controller, options),
    };
  });

  return (
    <FilterBar
      activeFilters={activeFilters}
      inactiveFilters={bar.inactiveDimensions}
      onClear={(id) => {
        const dimension = bar.activeDimensions.find((item) => item.id === id);
        if (dimension) bar.clearDimension(dimension);
      }}
      onClearAll={bar.clearAll}
      onPick={bar.pickDimension}
    />
  );
}
