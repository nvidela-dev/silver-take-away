'use client';

import { useEffect, useRef } from 'react';

interface SelectionCheckboxProps {
  ariaLabel: string;
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}

export function SelectionCheckbox({
  ariaLabel,
  checked,
  indeterminate = false,
  onChange,
}: SelectionCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate && !checked;
    }
  }, [checked, indeterminate]);

  return (
    <input
      aria-label={ariaLabel}
      checked={checked}
      className="size-4 cursor-pointer rounded border-slate-300"
      onChange={onChange}
      ref={ref}
      type="checkbox"
    />
  );
}
