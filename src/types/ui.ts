export type SurfaceTone = 'slate' | 'sky' | 'blue' | 'amber' | 'emerald' | 'rose' | 'violet';

export interface NavigationItem {
  href: string;
  label: string;
  description: string;
  icon?: 'receipt' | 'credit-card';
}

export interface SurfaceTab {
  value: string;
  label: string;
  href: string;
  description: string;
}

export interface StatusDisplayMeta {
  label: string;
  tone: SurfaceTone;
}

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
