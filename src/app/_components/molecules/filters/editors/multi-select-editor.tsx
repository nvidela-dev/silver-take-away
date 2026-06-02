'use client';

import { useId, useState } from 'react';

import { Button } from '@/app/_components/atoms/button';

export interface MultiSelectOption<TValue extends string = string> {
  id: TValue;
  label: string;
}

interface MultiSelectEditorProps<TValue extends string> {
  value: readonly TValue[] | null;
  options: readonly MultiSelectOption<TValue>[];
  onApply: (value: TValue[] | null) => void;
  onCancel: () => void;
}

export function MultiSelectEditor<TValue extends string>({
  value,
  options,
  onApply,
  onCancel,
}: MultiSelectEditorProps<TValue>) {
  const groupId = useId();
  const [selected, setSelected] = useState<Set<TValue>>(new Set(value ?? []));

  const toggle = (id: TValue) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApply = () => {
    onApply(selected.size > 0 ? Array.from(selected) : null);
  };

  return (
    <div className="grid gap-2 p-3">
      <ul className="max-h-56 overflow-y-auto">
        {options.map((option) => {
          const isChecked = selected.has(option.id);
          const checkboxId = `${groupId}-${option.id}`;
          return (
            <li key={option.id}>
              <label
                className={[
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5',
                  'text-sm text-slate-800 hover:bg-slate-100',
                ].join(' ')}
                htmlFor={checkboxId}
              >
                <input
                  checked={isChecked}
                  className="size-4 rounded border-slate-300"
                  id={checkboxId}
                  onChange={() => toggle(option.id)}
                  type="checkbox"
                />
                <span>{option.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
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
