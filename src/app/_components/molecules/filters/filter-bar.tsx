import type { ReactNode } from 'react';

import { Button } from '@/app/_components/atoms/button';

import { AddFilterPopover, type FilterOption } from './add-filter-popover';
import { FilterChip } from './filter-chip';

export interface ActiveFilter extends FilterOption {
  initialOpen?: boolean;
  renderEditor: (close: () => void) => ReactNode;
  valueSummary: string;
}

interface FilterBarProps<TOption extends FilterOption> {
  activeFilters: readonly ActiveFilter[];
  actions?: ReactNode;
  inactiveFilters: readonly TOption[];
  onClear: (id: string) => void;
  onClearAll: () => void;
  onPick: (id: string) => void;
}

export function FilterBar<TOption extends FilterOption>({
  activeFilters,
  actions = null,
  inactiveFilters,
  onClear,
  onClearAll,
  onPick,
}: FilterBarProps<TOption>): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {activeFilters.map((filter) => (
          <FilterChip
            key={filter.id}
            initialOpen={filter.initialOpen}
            label={filter.label}
            onClear={() => onClear(filter.id)}
            renderEditor={filter.renderEditor}
            valueSummary={filter.valueSummary}
          />
        ))}
        <AddFilterPopover dimensions={inactiveFilters} onPick={onPick} />
        {activeFilters.length > 0 ? (
          <Button onClick={onClearAll} size="sm" type="button" variant="ghost">
            Clear all
          </Button>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
