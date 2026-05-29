import { Button } from '@/app/_components/ui/button';
import type { BulkActionDescriptor, RowActionDescriptor } from '@/types';

interface ActionToolbarProps {
  actions?: readonly RowActionDescriptor[];
  bulkActions?: readonly BulkActionDescriptor[];
}

export function ActionToolbar({ actions = [], bulkActions = [] }: ActionToolbarProps) {
  const hasActions = actions.length > 0 || bulkActions.length > 0;

  if (!hasActions) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          disabled
          key={action.id}
          size="sm"
          variant={action.isDestructive ? 'destructive' : 'secondary'}
        >
          {action.label}
        </Button>
      ))}
      {bulkActions.map((action) => (
        <Button disabled key={action.id} size="sm" variant="outline">
          {action.label}
        </Button>
      ))}
    </div>
  );
}

ActionToolbar.defaultProps = {
  actions: [],
  bulkActions: [],
};
