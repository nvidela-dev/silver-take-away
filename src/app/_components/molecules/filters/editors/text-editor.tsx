'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { Input } from '@/app/_components/atoms/input';

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
      <Input
        controlSize="sm"
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
