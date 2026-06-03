'use client';

import {
  ChevronDown,
  Filter,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { ComponentType } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { usePopoverDismiss } from '@/app/_components/hooks/use-popover-dismiss';
import { PopoverPanel } from '@/app/_components/molecules/popover-panel';
import type { SavedViewController } from '@/app/_components/hooks/use-saved-view';

interface SavedViewControlsProps {
  controller: SavedViewController;
}

interface OptionItemProps {
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled: boolean;
  onSelect: () => void;
}

function OptionItem({
  label,
  icon: Icon,
  disabled,
  onSelect,
}: OptionItemProps): React.ReactElement {
  return (
    <button
      className={[
        'flex w-full items-center justify-between gap-6 rounded-sm px-3 py-2',
        'text-left text-xs text-slate-700 hover:bg-slate-50',
        'disabled:pointer-events-none disabled:opacity-40',
      ].join(' ')}
      disabled={disabled}
      onClick={onSelect}
      role="menuitem"
      type="button"
    >
      {label}
      <Icon aria-hidden className="size-3.5 text-slate-500" />
    </button>
  );
}

export function SavedViewControls({ controller }: SavedViewControlsProps): React.ReactElement {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  usePopoverDismiss({
    containerRef: menuRef,
    enabled: isMenuOpen,
    onDismiss: () => setMenuOpen(false),
  });

  const {
    hasSaved,
    currentMatchesSaved,
    hasActiveFilters,
    isPending,
    error,
    save,
    resetToSaved,
    resetFilters,
  } = controller;

  // "Save as new view" stays available until a saved snapshot already
  // matches current state — saving again would be a no-op.
  const canSave = !currentMatchesSaved;
  // "Reset view" only makes sense once a saved snapshot exists *and*
  // current state differs from it.
  const canResetView = hasSaved && !currentMatchesSaved;
  const canResetFilters = hasActiveFilters;

  const runItem = (action: () => void): void => {
    setMenuOpen(false);
    action();
  };

  return (
    <div className="flex items-center gap-2">
      {error ? (
        <span className="text-xs text-rose-700" role="status">{error}</span>
      ) : null}
      <div className="relative inline-flex" ref={menuRef}>
        <Button
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          disabled={isPending}
          onClick={() => setMenuOpen((open) => !open)}
          size="sm"
          type="button"
          variant="outline"
        >
          Options
          <ChevronDown aria-hidden className="size-3.5" />
        </Button>
        {isMenuOpen ? (
          <PopoverPanel align="right">
            <div className="p-1" role="menu">
              <OptionItem
                disabled={isPending || !canResetFilters}
                icon={Filter}
                label="Reset filters"
                onSelect={() => runItem(resetFilters)}
              />
              <OptionItem
                disabled={isPending || !canResetView}
                icon={RotateCcw}
                label="Reset view"
                onSelect={() => runItem(resetToSaved)}
              />
              <OptionItem
                disabled={isPending || !canSave}
                icon={Plus}
                label="Save as new view"
                onSelect={() => runItem(save)}
              />
            </div>
          </PopoverPanel>
        ) : null}
      </div>
    </div>
  );
}
