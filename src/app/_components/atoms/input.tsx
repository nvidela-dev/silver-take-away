import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends ComponentPropsWithRef<'input'> {
  controlSize?: 'default' | 'sm';
}

export function Input({
  className,
  controlSize = 'default',
  ...props
}: InputProps): React.ReactElement {
  return (
    <input
      className={cn(
        'block w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950',
        'placeholder:text-slate-400 focus:border-slate-400 focus:outline-none',
        'focus:ring-2 focus:ring-slate-300',
        controlSize === 'default' ? 'h-10' : 'py-1.5',
        className,
      )}
      {...props}
    />
  );
}
