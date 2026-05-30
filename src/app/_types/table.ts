// Table shell primitives: column descriptors, row actions, and the
// placeholder-table state used by surfaces not yet wired to live data.
// Repository row shapes live in @/lib/types — these are UI contracts only.

import type { SurfaceTone } from './style';

export interface TableColumnDescriptor {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  isSortable?: boolean;
  isConfigurable?: boolean;
}

export interface RowActionDescriptor {
  id: string;
  label: string;
  tone?: SurfaceTone;
  isDestructive?: boolean;
}

export interface BulkActionDescriptor extends RowActionDescriptor {
  requiresSelection: true;
}

export interface PlaceholderTableState {
  title: string;
  description: string;
  columns: readonly TableColumnDescriptor[];
  emptyMessage: string;
  actions?: readonly RowActionDescriptor[];
  bulkActions?: readonly BulkActionDescriptor[];
}
