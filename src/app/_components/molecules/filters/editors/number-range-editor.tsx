'use client';

import { useId, useState } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { Input } from '@/app/_components/atoms/input';

interface NumberRangeEditorProps {
  min: number | null;
  max: number | null;
  onApply: (range: { min: number | null; max: number | null }) => void;
  onCancel: () => void;
}

function toInputValue(value: number | null): string {
  return value === null ? '' : String(value);
}

function fromInputValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export function NumberRangeEditor({
  min,
  max,
  onApply,
  onCancel,
}: NumberRangeEditorProps): React.ReactElement {
  const minId = useId();
  const maxId = useId();
  const [minDraft, setMinDraft] = useState(toInputValue(min));
  const [maxDraft, setMaxDraft] = useState(toInputValue(max));

  const handleApply = (): void => {
    onApply({
      min: fromInputValue(minDraft),
      max: fromInputValue(maxDraft),
    });
  };

  return (
    <div className="grid gap-2 p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1" htmlFor={minId}>
          <span className="text-xs font-medium text-slate-700">Min</span>
          <Input
            className="tabular-nums"
            controlSize="sm"
            id={minId}
            inputMode="decimal"
            onChange={(event) => setMinDraft(event.target.value)}
            placeholder="0"
            type="text"
            value={minDraft}
          />
        </label>
        <label className="grid gap-1" htmlFor={maxId}>
          <span className="text-xs font-medium text-slate-700">Max</span>
          <Input
            className="tabular-nums"
            controlSize="sm"
            id={maxId}
            inputMode="decimal"
            onChange={(event) => setMaxDraft(event.target.value)}
            placeholder="∞"
            type="text"
            value={maxDraft}
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
