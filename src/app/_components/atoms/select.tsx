import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  controlSize?: 'default' | 'sm';
}

export function Select({
  className,
  controlSize = 'default',
  ...props
}: SelectProps) {
  return (
    <select
      className={cn(
        'block w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950',
        'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300',
        controlSize === 'default' ? 'h-10' : 'py-1.5',
        className,
      )}
      {...props}
    />
  );
}
