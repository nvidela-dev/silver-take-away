'use client';

import { useId, useState } from 'react';

import { Button } from '@/app/_components/ui/button';

interface DateRangeEditorProps {
  from: string | null;
  to: string | null;
  onApply: (range: { from: string | null; to: string | null }) => void;
  onCancel: () => void;
}

function toInputValue(value: string | null): string {
  return value ?? '';
}

function fromInputValue(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

export function DateRangeEditor({
  from,
  to,
  onApply,
  onCancel,
}: DateRangeEditorProps) {
  const fromId = useId();
  const toId = useId();
  const [fromDraft, setFromDraft] = useState(toInputValue(from));
  const [toDraft, setToDraft] = useState(toInputValue(to));

  const handleApply = () => {
    onApply({
      from: fromInputValue(fromDraft),
      to: fromInputValue(toDraft),
    });
  };

  return (
    <div className="grid gap-2 p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1" htmlFor={fromId}>
          <span className="text-xs font-medium text-slate-700">From</span>
          <input
            className={[
              'block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5',
              'text-sm text-slate-950',
              'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300',
            ].join(' ')}
            id={fromId}
            onChange={(event) => setFromDraft(event.target.value)}
            type="date"
            value={fromDraft}
          />
        </label>
        <label className="grid gap-1" htmlFor={toId}>
          <span className="text-xs font-medium text-slate-700">To</span>
          <input
            className={[
              'block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5',
              'text-sm text-slate-950',
              'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300',
            ].join(' ')}
            id={toId}
            onChange={(event) => setToDraft(event.target.value)}
            type="date"
            value={toDraft}
          />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} size="sm" type="button" variant="ghost">
          Cancel
        </Button>
        <Button onClick={handleApply} size="sm" type="button" variant="accent">
          Apply
        </Button>
      </div>
    </div>
  );
}
