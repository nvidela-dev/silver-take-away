'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/app/_components/atoms/button';

interface TextEditorProps {
  value: string | null;
  placeholder?: string;
  onApply: (value: string | null) => void;
  onCancel: () => void;
}

export function TextEditor({
  value,
  placeholder = '',
  onApply,
  onCancel,
}: TextEditorProps) {
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleApply = () => {
    const trimmed = draft.trim();
    onApply(trimmed.length > 0 ? trimmed : null);
  };

  return (
    <div className="grid gap-2 p-3">
      <input
        className={[
          'block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5',
          'text-sm text-slate-950 placeholder:text-slate-400',
          'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300',
        ].join(' ')}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleApply();
          }
        }}
        placeholder={placeholder}
        ref={inputRef}
        type="text"
        value={draft}
      />
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
