'use client';

import {
  ChevronDown,
  Columns3,
  FolderOpen,
  Save,
  Trash2,
} from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { usePopoverDismiss } from '@/app/_components/hooks/use-popover-dismiss';
import { PopoverPanel } from '@/app/_components/molecules/popover-panel';
import type { SavedViewController } from '@/app/_components/hooks/use-saved-view';

interface SavedViewControlsProps {
  columns?: readonly SavedViewColumnOption[];
  controller: SavedViewController;
}

export interface SavedViewColumnOption {
  id: string;
  isVisible: boolean;
  label: string;
  onToggle: () => void;
}

interface OptionItemProps {
  description: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled: boolean;
  onSelect: () => void;
}

function OptionItem({
  description,
  label,
  icon: Icon,
  disabled,
  onSelect,
}: OptionItemProps): React.ReactElement {
  return (
    <button
      className={[
        'flex w-full items-start justify-between gap-4 rounded-sm px-3 py-2',
        'text-left text-slate-700 hover:bg-slate-50',
        'disabled:pointer-events-none disabled:opacity-40',
      ].join(' ')}
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      <span className="grid gap-0.5">
        <span className="text-xs font-medium text-slate-800">{label}</span>
        <span className="text-[11px] leading-4 text-slate-500">{description}</span>
      </span>
      <Icon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-slate-500" />
    </button>
  );
}

export function SavedViewControls({
  columns = [],
  controller,
}: SavedViewControlsProps): React.ReactElement {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const columnGroupId = useId();

  usePopoverDismiss({
    containerRef: menuRef,
    enabled: isMenuOpen,
    onDismiss: () => setMenuOpen(false),
  });

  const {
    hasSaved,
    currentMatchesSaved,
    isPending,
    error,
    save,
    resetToSaved,
    deleteSaved,
  } = controller;

  const canSave = !currentMatchesSaved;
  const canLoad = hasSaved && !currentMatchesSaved;
  const canClear = hasSaved;

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
          aria-haspopup="dialog"
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
          <PopoverPanel align="right" className="w-72 p-1" role="dialog">
            <div>
              <p
                className={[
                  'px-3 pb-1 pt-2 text-xs font-medium uppercase',
                  'tracking-wide text-slate-500',
                ].join(' ')}
              >
                Saved view
              </p>
              <OptionItem
                description="Save filters, sort, page size, and visible columns."
                disabled={isPending || !canSave}
                icon={Save}
                label="Save View"
                onSelect={() => runItem(save)}
              />
              <OptionItem
                description="Restore the settings from your saved view."
                disabled={isPending || !canLoad}
                icon={FolderOpen}
                label="Load Saved View"
                onSelect={() => runItem(resetToSaved)}
              />
              <OptionItem
                description="Delete the saved view for this tab."
                disabled={isPending || !canClear}
                icon={Trash2}
                label="Clear Saved View"
                onSelect={() => runItem(deleteSaved)}
              />
              {columns.length > 0 ? (
                <>
                  <div className="mx-2 my-1 border-t border-slate-100" />
                  <p
                    className={[
                      'flex items-center gap-1.5 px-3 pb-1 pt-2 text-xs',
                      'font-medium uppercase tracking-wide text-slate-500',
                    ].join(' ')}
                  >
                    <Columns3 aria-hidden className="size-3.5" />
                    Visible columns
                  </p>
                  <ul className="grid pb-1">
                    {columns.map((column) => {
                      const checkboxId = `${columnGroupId}-${column.id}`;
                      return (
                        <li key={column.id}>
                          <label
                            className={[
                              'flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5',
                              'text-sm text-slate-800 hover:bg-slate-100',
                            ].join(' ')}
                            htmlFor={checkboxId}
                          >
                            <input
                              checked={column.isVisible}
                              className="size-4 rounded border-slate-300"
                              id={checkboxId}
                              onChange={column.onToggle}
                              type="checkbox"
                            />
                            <span>{column.label}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}
            </div>
          </PopoverPanel>
        ) : null}
      </div>
    </div>
  );
}
