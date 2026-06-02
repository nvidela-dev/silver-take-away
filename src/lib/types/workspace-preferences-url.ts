// Build a query-string URL from saved workspace preferences so the page
// can redirect a "bare" /bills?tab=... or /payments?tab=... request to a
// hydrated URL. Kept dependency-free of any nuqs runtime so it can be
// called from server components.

import type { WorkspaceTabPreferences } from './workspace-preferences';

interface BuildOptions {
  basePath: string;
  tabParam: string;
  tabValue: string;
  preferences: WorkspaceTabPreferences;
}

export function buildSavedPreferencesUrl({
  basePath,
  tabParam,
  tabValue,
  preferences,
}: BuildOptions): string {
  const params = new URLSearchParams();
  params.set(tabParam, tabValue);
  // Filters: arrays go in as comma-joined strings (matches nuqs's
  // parseAsArrayOf default); scalars as themselves; null/empty omitted.
  Object.entries(preferences.filters).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(','));
      return;
    }
    const str = String(value);
    if (str.length > 0) params.set(key, str);
  });
  params.set('sort', preferences.sort.by);
  params.set('dir', preferences.sort.dir);
  params.set('pageSize', String(preferences.pageSize));
  return `${basePath}?${params.toString()}`;
}

// True when the given search params include any key from `viewKeys`,
// signaling the user explicitly chose a view via the URL and we should
// not override it from saved prefs.
export function urlHasViewParams(
  params: Record<string, unknown>,
  viewKeys: readonly string[],
): boolean {
  return viewKeys.some((key) => params[key] !== undefined);
}
