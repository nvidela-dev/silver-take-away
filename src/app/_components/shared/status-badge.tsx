import { Badge } from '@/app/_components/ui/badge';
import type { StatusDisplayMeta, SurfaceTone } from '@/types';

const dotToneClass: Record<SurfaceTone, string> = {
  slate: 'bg-slate-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
};

export function StatusBadge({ status }: { status: StatusDisplayMeta }) {
  return (
    <Badge tone={status.tone}>
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${dotToneClass[status.tone]}`}
      />
      {status.label}
    </Badge>
  );
}
