'use client';

import { useCallback, useMemo, useState } from 'react';

import type { PaymentFilterTab } from '@/lib/types/payment/tabs';

import {
  PAYMENT_FILTER_DIMENSIONS,
  type PaymentFilterDimension,
} from '../filters/payment-filter-dimensions';
import type { PaymentFiltersController } from './use-payment-filters';

interface UsePaymentFilterBarOptions {
  controller: PaymentFiltersController;
  tab: PaymentFilterTab;
}

export interface PaymentFilterBarController {
  activeDimensions: PaymentFilterDimension[];
  inactiveDimensions: PaymentFilterDimension[];
  pendingOpenId: string | null;
  pickDimension: (id: string) => void;
  clearDimension: (dimension: PaymentFilterDimension) => void;
  clearAll: () => void;
}

export function usePaymentFilterBar({
  controller,
  tab,
}: UsePaymentFilterBarOptions): PaymentFilterBarController {
  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);

  const tabDimensions = useMemo(
    () => PAYMENT_FILTER_DIMENSIONS.filter((d) => d.applicableTabs.includes(tab)),
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

  const clearDimension = useCallback((dimension: PaymentFilterDimension) => {
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
