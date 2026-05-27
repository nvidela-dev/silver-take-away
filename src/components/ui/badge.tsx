import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1',
  {
    variants: {
      tone: {
        slate: 'bg-slate-100 text-slate-800 ring-slate-200',
        sky: 'bg-sky-100 text-sky-900 ring-sky-200',
        blue: 'bg-blue-100 text-blue-900 ring-blue-200',
        amber: 'bg-amber-100 text-amber-950 ring-amber-200',
        emerald: 'bg-emerald-100 text-emerald-950 ring-emerald-200',
        rose: 'bg-rose-100 text-rose-950 ring-rose-200',
        violet: 'bg-violet-100 text-violet-950 ring-violet-200',
      },
    },
    defaultVariants: {
      tone: 'slate',
    },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement>
  & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}

export { badgeVariants };
