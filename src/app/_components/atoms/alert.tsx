import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'error' | 'warning';
}

export function Alert({
  className,
  role = 'alert',
  tone = 'error',
  ...props
}: AlertProps): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-md border p-4 text-sm',
        tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-950'
          : 'border-amber-200 bg-amber-50 text-amber-950',
        className,
      )}
      role={role}
      {...props}
    />
  );
}
