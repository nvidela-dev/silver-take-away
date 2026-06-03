'use client';

import type { ReactNode } from 'react';

import { FilterBar } from '@/app/_components/molecules/filters/filter-bar';
import type { PaymentReferenceData } from '@/lib/types/payment/filters';
import type { PaymentFilterTab } from '@/lib/types/payment/tabs';

import type { PaymentFiltersController } from '../hooks/use-payment-filters';
import { usePaymentFilterBar } from '../hooks/use-payment-filter-bar';

interface PaymentFilterBarProps {
  actions?: ReactNode;
  controller: PaymentFiltersController;
  options: PaymentReferenceData;
  tab: PaymentFilterTab;
}

export function PaymentFilterBar({
  actions = null,
  controller,
  options,
  tab,
}: PaymentFilterBarProps): React.ReactElement {
  const bar = usePaymentFilterBar({ controller, tab });
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
