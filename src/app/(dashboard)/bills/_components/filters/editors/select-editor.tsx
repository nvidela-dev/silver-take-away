'use client';

import {
  useEffect, useMemo, useRef, useState,
} from 'react';

import { Button } from '@/app/_components/ui/button';

export interface SelectEditorOption {
  id: string;
  label: string;
  description?: string;
}

interface SelectEditorProps {
  value: string | null;
  options: readonly SelectEditorOption[];
  emptyMessage?: string;
  onApply: (value: string | null) => void;
  onCancel: () => void;
}

export function SelectEditor({
  value,
  options,
  emptyMessage = 'No options available.',
  onApply,
  onCancel,
}: SelectEditorProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, search]);

  return (
    <div className="grid gap-2 p-3">
      <input
        className={[
          'block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5',
          'text-sm text-slate-950 placeholder:text-slate-400',
          'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300',
        ].join(' ')}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search…"
        ref={inputRef}
        type="search"
        value={search}
      />
      <ul className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-2 py-2 text-xs text-slate-500">{emptyMessage}</li>
        ) : (
          filtered.map((option) => {
            const isSelected = option.id === value;
            return (
              <li key={option.id}>
                <button
                  className={[
                    'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left',
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-800 hover:bg-slate-100',
                  ].join(' ')}
                  onClick={() => onApply(option.id)}
                  type="button"
                >
                  <span className="block">
                    <span className="block text-sm">{option.label}</span>
                    {option.description ? (
                      <span
                        className={[
                          'block text-xs',
                          isSelected ? 'text-slate-300' : 'text-slate-500',
                        ].join(' ')}
                      >
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} size="sm" type="button" variant="ghost">
          Cancel
        </Button>
        {value ? (
          <Button
            onClick={() => onApply(null)}
            size="sm"
            type="button"
            variant="outline"
          >
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
