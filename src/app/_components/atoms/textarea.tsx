import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'block w-full rounded-md border border-slate-300 bg-white px-3 py-2',
        'text-sm text-slate-950 placeholder:text-slate-400',
        'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300',
        className,
      )}
      {...props}
    />
  );
}
