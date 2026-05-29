import { Badge } from '@/app/_components/ui/badge';
import type { StatusDisplayMeta } from '@/types';

export function StatusBadge({ status }: { status: StatusDisplayMeta }) {
  return <Badge tone={status.tone}>{status.label}</Badge>;
}
