'use client';

import type { ComponentType } from 'react';

import { DateRangeEditor } from '@/app/_components/molecules/filters/editors/date-range-editor';
import { MultiSelectEditor } from '@/app/_components/molecules/filters/editors/multi-select-editor';
import { NumberRangeEditor } from '@/app/_components/molecules/filters/editors/number-range-editor';
import {
  SelectEditor,
  type SelectEditorOption,
} from '@/app/_components/molecules/filters/editors/select-editor';
import { TextEditor } from '@/app/_components/molecules/filters/editors/text-editor';
import { paymentMethodDisplay, paymentStatusDisplay } from '@/app/_display';
import { formatDate, formatMoney } from '@/lib/utils';
import type { PaymentReferenceData } from '@/lib/types/payment/filters';
import type { PaymentFilterTab } from '@/lib/types/payment/tabs';
import { PAYMENT_FILTER_FIELD_SPECS } from '@/lib/validators/payment-filter-spec';
import type { PaymentMethodType, PaymentStatus } from '@/lib/types/enums';

import type { PaymentFiltersController } from '../hooks/use-payment-filters';

export type { PaymentFilterTab };

const PAYMENT_STATUS_OPTIONS: readonly PaymentStatus[] = [
  'pending',
  'scheduled',
  'initiated',
  'in_transit',
  'paid',
  'failed',
  'cancelled',
];

const PAYMENT_METHOD_OPTIONS: readonly PaymentMethodType[] = [
  'ach',
  'wire',
  'check',
  'card',
];

export interface PaymentFilterDimensionEditorProps {
  controller: PaymentFiltersController;
  // eslint-disable-next-line react/no-unused-prop-types
  options: PaymentReferenceData;
  onClose: () => void;
}

export interface PaymentFilterDimension {
  id: string;
  label: string;
  applicableTabs: readonly PaymentFilterTab[];
  isActive: (controller: PaymentFiltersController) => boolean;
  clear: (controller: PaymentFiltersController) => void;
  summarise: (controller: PaymentFiltersController, options: PaymentReferenceData) => string;
  Editor: ComponentType<PaymentFilterDimensionEditorProps>;
}

function vendorOptions(options: PaymentReferenceData): SelectEditorOption[] {
  return options.vendors.map((v) => ({ id: v.id, label: v.name }));
}

function ownerOptions(options: PaymentReferenceData): SelectEditorOption[] {
  return options.owners.map((o) => ({
    id: o.id,
    label: o.fullName ?? o.email,
    description: o.fullName ? o.email : undefined,
  }));
}

function summariseSelect(value: string | null, options: SelectEditorOption[]): string {
  if (!value) return 'None';
  return options.find((o) => o.id === value)?.label ?? value;
}

function summariseAmount(min: number | null, max: number | null): string {
  if (min !== null && max !== null) {
    return `${formatMoney(min.toFixed(2), 'USD')} – ${formatMoney(max.toFixed(2), 'USD')}`;
  }
  if (min !== null) return `≥ ${formatMoney(min.toFixed(2), 'USD')}`;
  if (max !== null) return `≤ ${formatMoney(max.toFixed(2), 'USD')}`;
  return 'Any';
}

function summariseDateRange(from: string | null, to: string | null): string {
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  if (from) return `from ${formatDate(from)}`;
  if (to) return `until ${formatDate(to)}`;
  return 'Any';
}

const searchDimension: PaymentFilterDimension = {
  id: 'search',
  label: 'Search',
  applicableTabs: PAYMENT_FILTER_FIELD_SPECS.search.applicableTabs,
  isActive: (c) => Boolean(c.values.search),
  clear: (c) => {
    void c.setValues({ search: null });
  },
  summarise: (c) => c.values.search ?? 'Empty',
  Editor: ({ controller, onClose }: PaymentFilterDimensionEditorProps) => (
    <TextEditor
      onApply={(v) => {
        void controller.setValues({ search: v });
        onClose();
      }}
      onCancel={onClose}
      placeholder="Vendor, invoice #, description"
      value={controller.values.search}
    />
  ),
};

const statusDimension: PaymentFilterDimension = {
  id: 'status',
  label: 'Status',
  applicableTabs: PAYMENT_FILTER_FIELD_SPECS.status.applicableTabs,
  isActive: (c) => Array.isArray(c.values.status) && c.values.status.length > 0,
  clear: (c) => {
    void c.setValues({ status: null });
  },
  summarise: (c) => {
    if (!c.status || c.status.length === 0) return 'None';
    if (c.status.length === 1) return paymentStatusDisplay[c.status[0]].label;
    return `${c.status.length} selected`;
  },
  Editor: ({ controller, onClose }: PaymentFilterDimensionEditorProps) => (
    <MultiSelectEditor
      onApply={(v) => {
        void controller.setValues({ status: v });
        onClose();
      }}
      onCancel={onClose}
      options={PAYMENT_STATUS_OPTIONS.map((s) => ({
        id: s,
        label: paymentStatusDisplay[s].label,
      }))}
      value={controller.status}
    />
  ),
};

const paymentMethodDimension: PaymentFilterDimension = {
  id: 'paymentMethod',
  label: 'Method',
  applicableTabs: PAYMENT_FILTER_FIELD_SPECS.paymentMethod.applicableTabs,
  isActive: (c) => Array.isArray(c.values.paymentMethod) && c.values.paymentMethod.length > 0,
  clear: (c) => {
    void c.setValues({ paymentMethod: null });
  },
  summarise: (c) => {
    if (!c.paymentMethod || c.paymentMethod.length === 0) return 'None';
    if (c.paymentMethod.length === 1) return paymentMethodDisplay[c.paymentMethod[0]].label;
    return `${c.paymentMethod.length} selected`;
  },
  Editor: ({ controller, onClose }: PaymentFilterDimensionEditorProps) => (
    <MultiSelectEditor
      onApply={(v) => {
        void controller.setValues({ paymentMethod: v });
        onClose();
      }}
      onCancel={onClose}
      options={PAYMENT_METHOD_OPTIONS.map((m) => ({
        id: m,
        label: paymentMethodDisplay[m].label,
      }))}
      value={controller.paymentMethod}
    />
  ),
};

const vendorDimension: PaymentFilterDimension = {
  id: 'vendor',
  label: 'Vendor',
  applicableTabs: PAYMENT_FILTER_FIELD_SPECS.vendorId.applicableTabs,
  isActive: (c) => Boolean(c.values.vendorId),
  clear: (c) => {
    void c.setValues({ vendorId: null });
  },
  summarise: (c, options) => summariseSelect(c.values.vendorId, vendorOptions(options)),
  Editor: ({ controller, options, onClose }: PaymentFilterDimensionEditorProps) => (
    <SelectEditor
      emptyMessage="No vendors found."
      onApply={(v) => {
        void controller.setValues({ vendorId: v });
        onClose();
      }}
      onCancel={onClose}
      options={vendorOptions(options)}
      value={controller.values.vendorId}
    />
  ),
};

const vendorOwnerDimension: PaymentFilterDimension = {
  id: 'vendorOwner',
  label: 'Vendor owner',
  applicableTabs: PAYMENT_FILTER_FIELD_SPECS.vendorOwnerId.applicableTabs,
  isActive: (c) => Boolean(c.values.vendorOwnerId),
  clear: (c) => {
    void c.setValues({ vendorOwnerId: null });
  },
  summarise: (c, options) => summariseSelect(c.values.vendorOwnerId, ownerOptions(options)),
  Editor: ({ controller, options, onClose }: PaymentFilterDimensionEditorProps) => (
    <SelectEditor
      emptyMessage="No owners found."
      onApply={(v) => {
        void controller.setValues({ vendorOwnerId: v });
        onClose();
      }}
      onCancel={onClose}
      options={ownerOptions(options)}
      value={controller.values.vendorOwnerId}
    />
  ),
};

const amountDimension: PaymentFilterDimension = {
  id: 'amount',
  label: 'Amount',
  applicableTabs: PAYMENT_FILTER_FIELD_SPECS.amountMin.applicableTabs,
  isActive: (c) => c.values.amountMin !== null || c.values.amountMax !== null,
  clear: (c) => {
    void c.setValues({ amountMin: null, amountMax: null });
  },
  summarise: (c) => summariseAmount(c.values.amountMin, c.values.amountMax),
  Editor: ({ controller, onClose }: PaymentFilterDimensionEditorProps) => (
    <NumberRangeEditor
      max={controller.values.amountMax}
      min={controller.values.amountMin}
      onApply={(range) => {
        void controller.setValues({ amountMin: range.min, amountMax: range.max });
        onClose();
      }}
      onCancel={onClose}
    />
  ),
};

const scheduledDateDimension: PaymentFilterDimension = {
  id: 'scheduledDate',
  label: 'Scheduled date',
  applicableTabs: PAYMENT_FILTER_FIELD_SPECS.scheduledDateFrom.applicableTabs,
  isActive: (c) => Boolean(c.values.scheduledDateFrom) || Boolean(c.values.scheduledDateTo),
  clear: (c) => {
    void c.setValues({ scheduledDateFrom: null, scheduledDateTo: null });
  },
  summarise: (c) => summariseDateRange(c.values.scheduledDateFrom, c.values.scheduledDateTo),
  Editor: ({ controller, onClose }: PaymentFilterDimensionEditorProps) => (
    <DateRangeEditor
      from={controller.values.scheduledDateFrom}
      onApply={(range) => {
        void controller.setValues({
          scheduledDateFrom: range.from,
          scheduledDateTo: range.to,
        });
        onClose();
      }}
      onCancel={onClose}
      to={controller.values.scheduledDateTo}
    />
  ),
};

const arrivalDateDimension: PaymentFilterDimension = {
  id: 'arrivalDate',
  label: 'Arrival date',
  applicableTabs: PAYMENT_FILTER_FIELD_SPECS.arrivalDateFrom.applicableTabs,
  isActive: (c) => Boolean(c.values.arrivalDateFrom) || Boolean(c.values.arrivalDateTo),
  clear: (c) => {
    void c.setValues({ arrivalDateFrom: null, arrivalDateTo: null });
  },
  summarise: (c) => summariseDateRange(c.values.arrivalDateFrom, c.values.arrivalDateTo),
  Editor: ({ controller, onClose }: PaymentFilterDimensionEditorProps) => (
    <DateRangeEditor
      from={controller.values.arrivalDateFrom}
      onApply={(range) => {
        void controller.setValues({
          arrivalDateFrom: range.from,
          arrivalDateTo: range.to,
        });
        onClose();
      }}
      onCancel={onClose}
      to={controller.values.arrivalDateTo}
    />
  ),
};

export const PAYMENT_FILTER_DIMENSIONS: readonly PaymentFilterDimension[] = [
  searchDimension,
  statusDimension,
  paymentMethodDimension,
  vendorDimension,
  vendorOwnerDimension,
  amountDimension,
  scheduledDateDimension,
  arrivalDateDimension,
];
