'use client';

import { useCallback, useMemo, useState } from 'react';

import type { BillFilterTab } from '@/lib/types/bill/tabs';

import {
  BILL_FILTER_DIMENSIONS,
  type BillFilterDimension,
} from '../filters/bill-filter-dimensions';
import type { BillFiltersController } from './use-bill-filters';

interface UseBillFilterBarOptions {
  controller: BillFiltersController;
  tab: BillFilterTab;
}

export interface BillFilterBarController {
  activeDimensions: BillFilterDimension[];
  inactiveDimensions: BillFilterDimension[];
  pendingOpenId: string | null;
  pickDimension: (id: string) => void;
  clearDimension: (dimension: BillFilterDimension) => void;
  clearAll: () => void;
}

export function useBillFilterBar({
  controller,
  tab,
}: UseBillFilterBarOptions): BillFilterBarController {
  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);

  const tabDimensions = useMemo(
    () => BILL_FILTER_DIMENSIONS.filter((d) => d.applicableTabs.includes(tab)),
    [tab],
  );

  const activeDimensions = useMemo(
    () => tabDimensions.filter((d) => d.isActive(controller) || d.id === pendingOpenId),
    [tabDimensions, controller, pendingOpenId],
  );

  const inactiveDimensions = useMemo(
    () => tabDimensions.filter((d) => !d.isActive(controller) && d.id !== pendingOpenId),
    [tabDimensions, controller, pendingOpenId],
  );

  const pickDimension = useCallback((id: string) => {
    setPendingOpenId(id);
  }, []);

  const clearDimension = useCallback((dimension: BillFilterDimension) => {
    setPendingOpenId((prev) => (prev === dimension.id ? null : prev));
    dimension.clear(controller);
  }, [controller]);

  const clearAll = useCallback(() => {
    setPendingOpenId(null);
    void controller.clearAll();
  }, [controller]);

  return {
    activeDimensions,
    inactiveDimensions,
    pendingOpenId,
    pickDimension,
    clearDimension,
    clearAll,
  };
}
