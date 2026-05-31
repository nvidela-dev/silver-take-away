'use client';

import type { ComponentType } from 'react';

import { billStatusDisplay } from '@/app/_display';
import { formatDate, formatMoney } from '@/lib/utils';
import type { BillStatus } from '@/lib/types/enums';

import type { BillFiltersController } from '../hooks/use-bill-filters';
import { DateRangeEditor } from './editors/date-range-editor';
import { MultiSelectEditor } from './editors/multi-select-editor';
import { NumberRangeEditor } from './editors/number-range-editor';
import { SelectEditor, type SelectEditorOption } from './editors/select-editor';
import { TextEditor } from './editors/text-editor';

export type BillFilterTab = 'drafts' | 'approvals' | 'payment';

export interface BillFilterOptionsBag {
  vendors: { id: string; name: string }[];
  owners: { id: string; fullName: string | null; email: string }[];
  categories: { id: string; name: string }[];
  statuses: BillStatus[];
}

export interface BillFilterDimensionEditorProps {
  controller: BillFiltersController;
  // eslint-disable-next-line react/no-unused-prop-types
  options: BillFilterOptionsBag;
  onClose: () => void;
}

export interface BillFilterDimension {
  id: string;
  label: string;
  applicableTabs: readonly BillFilterTab[];
  isActive: (controller: BillFiltersController) => boolean;
  clear: (controller: BillFiltersController) => void;
  summarise: (controller: BillFiltersController, options: BillFilterOptionsBag) => string;
  Editor: ComponentType<BillFilterDimensionEditorProps>;
}

const ALL_LIST_TABS: readonly BillFilterTab[] = ['drafts', 'approvals', 'payment'];

function vendorOptions(options: BillFilterOptionsBag): SelectEditorOption[] {
  return options.vendors.map((v) => ({ id: v.id, label: v.name }));
}

function ownerOptions(options: BillFilterOptionsBag): SelectEditorOption[] {
  return options.owners.map((o) => ({
    id: o.id,
    label: o.fullName ?? o.email,
    description: o.fullName ? o.email : undefined,
  }));
}

function categoryOptions(options: BillFilterOptionsBag): SelectEditorOption[] {
  return options.categories.map((c) => ({ id: c.id, label: c.name }));
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

const searchDimension: BillFilterDimension = {
  id: 'search',
  label: 'Search',
  applicableTabs: ALL_LIST_TABS,
  isActive: (c) => Boolean(c.values.search),
  clear: (c) => {
    void c.setValues({ search: null });
  },
  summarise: (c) => c.values.search ?? 'Empty',
  Editor: ({ controller, onClose }: BillFilterDimensionEditorProps) => (
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

const statusDimension: BillFilterDimension = {
  id: 'status',
  label: 'Status',
  applicableTabs: ['payment'],
  isActive: (c) => Array.isArray(c.values.status) && c.values.status.length > 0,
  clear: (c) => {
    void c.setValues({ status: null });
  },
  summarise: (c) => {
    if (!c.status || c.status.length === 0) return 'None';
    if (c.status.length === 1) return billStatusDisplay[c.status[0]].label;
    return `${c.status.length} selected`;
  },
  Editor: ({ controller, options, onClose }: BillFilterDimensionEditorProps) => (
    <MultiSelectEditor
      onApply={(v) => {
        void controller.setValues({ status: v });
        onClose();
      }}
      onCancel={onClose}
      options={options.statuses.map((s) => ({ id: s, label: billStatusDisplay[s].label }))}
      value={controller.status}
    />
  ),
};

const vendorDimension: BillFilterDimension = {
  id: 'vendor',
  label: 'Vendor',
  applicableTabs: ALL_LIST_TABS,
  isActive: (c) => Boolean(c.values.vendorId),
  clear: (c) => {
    void c.setValues({ vendorId: null });
  },
  summarise: (c, options) => summariseSelect(c.values.vendorId, vendorOptions(options)),
  Editor: ({ controller, options, onClose }: BillFilterDimensionEditorProps) => (
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

const vendorOwnerDimension: BillFilterDimension = {
  id: 'vendorOwner',
  label: 'Vendor owner',
  applicableTabs: ALL_LIST_TABS,
  isActive: (c) => Boolean(c.values.vendorOwnerId),
  clear: (c) => {
    void c.setValues({ vendorOwnerId: null });
  },
  summarise: (c, options) => summariseSelect(c.values.vendorOwnerId, ownerOptions(options)),
  Editor: ({ controller, options, onClose }: BillFilterDimensionEditorProps) => (
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

const categoryDimension: BillFilterDimension = {
  id: 'category',
  label: 'Category',
  applicableTabs: ALL_LIST_TABS,
  isActive: (c) => Boolean(c.values.categoryId),
  clear: (c) => {
    void c.setValues({ categoryId: null });
  },
  summarise: (c, options) => summariseSelect(c.values.categoryId, categoryOptions(options)),
  Editor: ({ controller, options, onClose }: BillFilterDimensionEditorProps) => (
    <SelectEditor
      emptyMessage="No categories found."
      onApply={(v) => {
        void controller.setValues({ categoryId: v });
        onClose();
      }}
      onCancel={onClose}
      options={categoryOptions(options)}
      value={controller.values.categoryId}
    />
  ),
};

const amountDimension: BillFilterDimension = {
  id: 'amount',
  label: 'Amount',
  applicableTabs: ALL_LIST_TABS,
  isActive: (c) => c.values.amountMin !== null || c.values.amountMax !== null,
  clear: (c) => {
    void c.setValues({ amountMin: null, amountMax: null });
  },
  summarise: (c) => summariseAmount(c.values.amountMin, c.values.amountMax),
  Editor: ({ controller, onClose }: BillFilterDimensionEditorProps) => (
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

const invoiceDateDimension: BillFilterDimension = {
  id: 'invoiceDate',
  label: 'Invoice date',
  applicableTabs: ALL_LIST_TABS,
  isActive: (c) => Boolean(c.values.invoiceDateFrom) || Boolean(c.values.invoiceDateTo),
  clear: (c) => {
    void c.setValues({ invoiceDateFrom: null, invoiceDateTo: null });
  },
  summarise: (c) => summariseDateRange(c.values.invoiceDateFrom, c.values.invoiceDateTo),
  Editor: ({ controller, onClose }: BillFilterDimensionEditorProps) => (
    <DateRangeEditor
      from={controller.values.invoiceDateFrom}
      onApply={(range) => {
        void controller.setValues({
          invoiceDateFrom: range.from,
          invoiceDateTo: range.to,
        });
        onClose();
      }}
      onCancel={onClose}
      to={controller.values.invoiceDateTo}
    />
  ),
};

const dueDateDimension: BillFilterDimension = {
  id: 'dueDate',
  label: 'Due date',
  applicableTabs: ALL_LIST_TABS,
  isActive: (c) => Boolean(c.values.dueDateFrom) || Boolean(c.values.dueDateTo),
  clear: (c) => {
    void c.setValues({ dueDateFrom: null, dueDateTo: null });
  },
  summarise: (c) => summariseDateRange(c.values.dueDateFrom, c.values.dueDateTo),
  Editor: ({ controller, onClose }: BillFilterDimensionEditorProps) => (
    <DateRangeEditor
      from={controller.values.dueDateFrom}
      onApply={(range) => {
        void controller.setValues({
          dueDateFrom: range.from,
          dueDateTo: range.to,
        });
        onClose();
      }}
      onCancel={onClose}
      to={controller.values.dueDateTo}
    />
  ),
};

export const BILL_FILTER_DIMENSIONS: readonly BillFilterDimension[] = [
  searchDimension,
  statusDimension,
  vendorDimension,
  vendorOwnerDimension,
  categoryDimension,
  amountDimension,
  invoiceDateDimension,
  dueDateDimension,
];
