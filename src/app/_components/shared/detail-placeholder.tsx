import { EmptyState } from '@/app/_components/shared/empty-state';
import { PageHeader } from '@/app/_components/shared/page-header';

interface DetailPlaceholderProps {
  eyebrow: string;
  title: string;
  id: string;
  description: string;
}

export function DetailPlaceholder({
  description,
  eyebrow,
  id,
  title,
}: DetailPlaceholderProps) {
  return (
    <div className="grid gap-6">
      <PageHeader
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      <EmptyState
        description={`Route parameter captured: ${id}. Data wiring lands in a feature PR.`}
        title="Detail route placeholder"
      />
    </div>
  );
}
