'use client';

import type { ReactNode } from 'react';

import { FilterBar } from '@/app/_components/molecules/filters/filter-bar';
import type { BillReferenceData } from '@/lib/types/bill/filters';
import type { BillFilterTab } from '@/lib/types/bill/tabs';

import type { BillFiltersController } from '../hooks/use-bill-filters';
import { useBillFilterBar } from '../hooks/use-bill-filter-bar';

interface BillFilterBarProps {
  actions?: ReactNode;
  controller: BillFiltersController;
  options: BillReferenceData;
  tab: BillFilterTab | 'overview';
}

export function BillFilterBar({
  actions = null,
  controller,
  options,
  tab,
}: BillFilterBarProps): React.ReactElement {
  const bar = useBillFilterBar({ controller, tab });
  // Overview borrows the drafts dimension set; coerce so editors always
  // receive a concrete list tab.
  const editorTab: BillFilterTab = tab === 'overview' ? 'drafts' : tab;
  const activeFilters = bar.activeDimensions.map((dimension) => {
    const { Editor } = dimension;
    return {
      id: dimension.id,
      initialOpen: dimension.id === bar.pendingOpenId,
      label: dimension.label,
      renderEditor: (close: () => void) => (
        <Editor controller={controller} onClose={close} options={options} tab={editorTab} />
      ),
      valueSummary: dimension.summarise(controller, options),
    };
  });

  return (
    <FilterBar
      activeFilters={activeFilters}
      actions={actions}
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
