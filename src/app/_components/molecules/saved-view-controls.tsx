'use client';

import { ChevronDown, RotateCcw, Save } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { usePopoverDismiss } from '@/app/_components/hooks/use-popover-dismiss';
import { PopoverPanel } from '@/app/_components/molecules/popover-panel';
import type { SavedViewController } from '@/app/_components/hooks/use-saved-view';

interface SavedViewControlsProps {
  controller: SavedViewController;
}

export function SavedViewControls({ controller }: SavedViewControlsProps) {
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
    isPending,
    error,
    save,
    resetToSaved,
    deleteSaved,
  } = controller;

  // "Save view" is shown until there's a saved snapshot that already
  // matches current state — after that, saving again would be a no-op.
  const canSave = !currentMatchesSaved;
  // "Reset to saved" only makes sense once a saved snapshot exists *and*
  // current state differs from it.
  const canReset = hasSaved && !currentMatchesSaved;

  return (
    <div className="flex items-center gap-2">
      {error ? (
        <span className="text-xs text-rose-700" role="status">{error}</span>
      ) : null}
      <Button
        disabled={!canSave || isPending}
        onClick={save}
        size="sm"
        type="button"
        variant="secondary"
      >
        <Save aria-hidden className="size-3.5" />
        Save view
      </Button>
      {canReset ? (
        <div className="relative inline-flex" ref={menuRef}>
          <Button
            className="rounded-r-none"
            disabled={isPending}
            onClick={resetToSaved}
            size="sm"
            type="button"
            variant="secondary"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            Reset to saved
          </Button>
          <Button
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-label="Saved view options"
            className="rounded-l-none border-l-0 px-1.5"
            disabled={isPending}
            onClick={() => setMenuOpen((open) => !open)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ChevronDown aria-hidden className="size-3.5" />
          </Button>
          {isMenuOpen ? (
            <PopoverPanel align="right">
              <div className="p-1" role="menu">
                <button
                  className="block w-full rounded-sm px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"
                  onClick={() => {
                    setMenuOpen(false);
                    deleteSaved();
                  }}
                  role="menuitem"
                  type="button"
                >
                  Delete saved values
                </button>
              </div>
            </PopoverPanel>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
