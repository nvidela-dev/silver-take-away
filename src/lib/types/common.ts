// Cross-domain primitives used by every backend layer. Keep this file
// free of domain-specific types.

export type ActionResult<T> = | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
}
