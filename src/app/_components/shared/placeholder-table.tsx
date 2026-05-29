import { ActionToolbar } from '@/app/_components/shared/action-toolbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_components/ui/card';
import type { PlaceholderTableState } from '@/types';

interface PlaceholderTableProps {
  state: PlaceholderTableState;
}

export function PlaceholderTable({ state }: PlaceholderTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{state.title}</CardTitle>
            <CardDescription>{state.description}</CardDescription>
          </div>
          <ActionToolbar
            actions={state.actions}
            bulkActions={state.bulkActions}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div
            className={[
              'grid grid-cols-2 bg-slate-50 text-xs font-semibold',
              'uppercase tracking-wide text-slate-500 md:grid-cols-6',
            ].join(' ')}
          >
            {state.columns.map((column) => (
              <div
                className="border-b border-slate-200 px-3 py-2"
                key={column.id}
              >
                {column.label || 'Select'}
              </div>
            ))}
          </div>
          <div
            className={[
              'grid min-h-32 place-items-center px-4 py-8',
              'text-center text-sm text-slate-600',
            ].join(' ')}
          >
            {state.emptyMessage}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
