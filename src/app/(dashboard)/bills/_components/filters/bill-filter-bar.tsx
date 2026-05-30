'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/app/_components/ui/button';
import { billStatusDisplay } from '@/app/_display';
import { formatDate, formatMoney } from '@/lib/utils';
import type { BillStatus } from '@/lib/types/enums';

import type { BillFiltersController } from '../hooks/use-bill-filters';
import { AddFilterPopover } from './add-filter-popover';
import { BillFilterChip } from './bill-filter-chip';
import {
  BILL_FILTER_DIMENSIONS,
  clearDimension,
  isDimensionActive,
  type BillFilterDimensionId,
  type BillFilterTab,
} from './bill-filter-registry';
import { DateRangeEditor } from './editors/date-range-editor';
import { MultiSelectEditor } from './editors/multi-select-editor';
import { NumberRangeEditor } from './editors/number-range-editor';
import { SelectEditor, type SelectEditorOption } from './editors/select-editor';
import { TextEditor } from './editors/text-editor';

export interface BillFilterOptionsBag {
  vendors: { id: string; name: string }[];
  owners: { id: string; fullName: string | null; email: string }[];
  categories: { id: string; name: string }[];
  statuses: BillStatus[];
}

interface BillFilterBarProps {
  controller: BillFiltersController;
  options: BillFilterOptionsBag;
  tab: BillFilterTab;
}

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

function summariseSelect(
  value: string | null,
  options: SelectEditorOption[],
  fallback = 'None',
): string {
  if (!value) return fallback;
  return options.find((o) => o.id === value)?.label ?? value;
}

function summariseStatus(value: BillStatus[] | null): string {
  if (!value || value.length === 0) return 'None';
  if (value.length === 1) return billStatusDisplay[value[0]].label;
  return `${value.length} selected`;
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

export function BillFilterBar({ controller, options, tab }: BillFilterBarProps) {
  const {
    values, status, setValues, clearAll,
  } = controller;
  const [pendingOpenId, setPendingOpenId] = useState<BillFilterDimensionId | null>(null);

  const tabDimensions = useMemo(
    () => BILL_FILTER_DIMENSIONS.filter((d) => d.applicableTabs.includes(tab)),
    [tab],
  );

  const activeDimensions = useMemo(
    () => tabDimensions.filter((d) => isDimensionActive(d.id, values) || d.id === pendingOpenId),
    [tabDimensions, values, pendingOpenId],
  );

  const inactiveDimensions = useMemo(
    () => tabDimensions.filter((d) => !isDimensionActive(d.id, values) && d.id !== pendingOpenId),
    [tabDimensions, values, pendingOpenId],
  );

  const handleClear = (id: BillFilterDimensionId) => {
    setPendingOpenId(null);
    void setValues(clearDimension(id));
  };

  const handlePick = (id: BillFilterDimensionId) => {
    setPendingOpenId(id);
  };

  const renderEditor = (id: BillFilterDimensionId, close: () => void) => {
    const cancel = () => {
      if (pendingOpenId === id) setPendingOpenId(null);
      close();
    };
    const apply = <T,>(updates: T, fn: (v: T) => void) => {
      setPendingOpenId(null);
      fn(updates);
      close();
    };

    switch (id) {
      case 'search':
        return (
          <TextEditor
            onApply={(v) => apply(v, (next) => {
              void setValues({ search: next });
            })}
            onCancel={cancel}
            placeholder="Vendor, invoice #, description"
            value={values.search}
          />
        );
      case 'status': {
        const statusOptions = options.statuses.map((s) => ({
          id: s,
          label: billStatusDisplay[s].label,
        }));
        return (
          <MultiSelectEditor
            onApply={(v) => apply(v, (next) => {
              void setValues({ status: next });
            })}
            onCancel={cancel}
            options={statusOptions}
            value={status}
          />
        );
      }
      case 'vendor':
        return (
          <SelectEditor
            emptyMessage="No vendors found."
            onApply={(v) => apply(v, (next) => {
              void setValues({ vendorId: next });
            })}
            onCancel={cancel}
            options={vendorOptions(options)}
            value={values.vendorId}
          />
        );
      case 'vendorOwner':
        return (
          <SelectEditor
            emptyMessage="No owners found."
            onApply={(v) => apply(v, (next) => {
              void setValues({ vendorOwnerId: next });
            })}
            onCancel={cancel}
            options={ownerOptions(options)}
            value={values.vendorOwnerId}
          />
        );
      case 'category':
        return (
          <SelectEditor
            emptyMessage="No categories found."
            onApply={(v) => apply(v, (next) => {
              void setValues({ categoryId: next });
            })}
            onCancel={cancel}
            options={categoryOptions(options)}
            value={values.categoryId}
          />
        );
      case 'amount':
        return (
          <NumberRangeEditor
            max={values.amountMax}
            min={values.amountMin}
            onApply={(range) => apply(range, (next) => {
              void setValues({ amountMin: next.min, amountMax: next.max });
            })}
            onCancel={cancel}
          />
        );
      case 'invoiceDate':
        return (
          <DateRangeEditor
            from={values.invoiceDateFrom}
            onApply={(range) => apply(range, (next) => {
              void setValues({
                invoiceDateFrom: next.from,
                invoiceDateTo: next.to,
              });
            })}
            onCancel={cancel}
            to={values.invoiceDateTo}
          />
        );
      case 'dueDate':
        return (
          <DateRangeEditor
            from={values.dueDateFrom}
            onApply={(range) => apply(range, (next) => {
              void setValues({
                dueDateFrom: next.from,
                dueDateTo: next.to,
              });
            })}
            onCancel={cancel}
            to={values.dueDateTo}
          />
        );
      default:
        return null;
    }
  };

  const summaryFor = (id: BillFilterDimensionId): string => {
    switch (id) {
      case 'search':
        return values.search ?? 'Empty';
      case 'status':
        return summariseStatus(status);
      case 'vendor':
        return summariseSelect(values.vendorId, vendorOptions(options));
      case 'vendorOwner':
        return summariseSelect(values.vendorOwnerId, ownerOptions(options));
      case 'category':
        return summariseSelect(values.categoryId, categoryOptions(options));
      case 'amount':
        return summariseAmount(values.amountMin, values.amountMax);
      case 'invoiceDate':
        return summariseDateRange(values.invoiceDateFrom, values.invoiceDateTo);
      case 'dueDate':
        return summariseDateRange(values.dueDateFrom, values.dueDateTo);
      default:
        return '';
    }
  };

  const hasAnyActive = activeDimensions.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeDimensions.map((dimension) => (
        <BillFilterChip
          initialOpen={dimension.id === pendingOpenId}
          key={dimension.id}
          label={dimension.label}
          onClear={() => handleClear(dimension.id)}
          renderEditor={(close) => renderEditor(dimension.id, close)}
          valueSummary={summaryFor(dimension.id)}
        />
      ))}
      <AddFilterPopover dimensions={inactiveDimensions} onPick={handlePick} />
      {hasAnyActive ? (
        <Button
          onClick={() => {
            setPendingOpenId(null);
            void clearAll();
          }}
          size="sm"
          type="button"
          variant="ghost"
        >
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
