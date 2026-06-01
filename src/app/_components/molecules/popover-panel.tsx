import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface PopoverPanelProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'right';
  width?: 'sm' | 'md';
}

export function PopoverPanel({
  align = 'left',
  className,
  width = 'sm',
  ...props
}: PopoverPanelProps) {
  return (
    <div
      className={cn(
        'absolute top-full z-30 mt-2 rounded-md border border-slate-200 bg-white shadow-lg',
        align === 'left' ? 'left-0' : 'right-0',
        width === 'sm' ? 'w-56' : 'w-72',
        className,
      )}
      {...props}
    />
  );
}
