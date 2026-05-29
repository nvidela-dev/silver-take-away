import type { ReactNode } from 'react';

import { Card, CardContent } from '@/app/_components/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="grid min-h-40 place-items-center text-center">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            {description}
          </p>
          {action ? (
            <div className="mt-4 flex justify-center">{action}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

EmptyState.defaultProps = {
  action: undefined,
};
