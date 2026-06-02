'use client';

import type { useRouter } from 'next/navigation';
import {
  useCallback, useMemo, useState, useTransition,
} from 'react';

import { deleteWorkspaceTabPreference } from '@/lib/actions/workspace-preferences/delete';
import { saveWorkspaceTabPreference } from '@/lib/actions/workspace-preferences/save';
import {
  WORKSPACE_PREFERENCES_VERSION,
  type WorkspaceKey,
  type WorkspaceTabPreferences,
} from '@/lib/types/workspace-preferences';

// Treat null / undefined / empty arrays as "unset" so a missing key in
// saved prefs compares equal to a controller value of null.
function normaliseFilters(filters: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(filters).reduce<Record<string, unknown>>((out, [key, value]) => {
    if (
      value !== null
      && value !== undefined
      && (!Array.isArray(value) || value.length > 0)
      && (typeof value !== 'string' || value.length > 0)
    ) {
      return { ...out, [key]: value };
    }
    return out;
  }, {});
}

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isDeepEqual(item, b[index]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => isDeepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ));
  }
  return false;
}

interface UseSavedViewOptions {
  workspaceKey: WorkspaceKey;
  savedPreferences: WorkspaceTabPreferences | null;
  currentFilters: Record<string, unknown>;
  currentSort: { by: string; dir: 'asc' | 'desc' };
  currentPageSize: number;
  currentHiddenColumns: readonly string[];
  applyFilters: (filters: Record<string, unknown>) => void;
  applySort: (sort: { by: string; dir: 'asc' | 'desc' }) => void;
  applyPageSize: (pageSize: number) => void;
  applyHiddenColumns: (hidden: readonly string[]) => void;
  router: ReturnType<typeof useRouter>;
}

export interface SavedViewController {
  hasSaved: boolean;
  currentMatchesSaved: boolean;
  hasActiveFilters: boolean;
  isPending: boolean;
  error: string | null;
  save: () => void;
  resetToSaved: () => void;
  resetFilters: () => void;
  deleteSaved: () => void;
  // The local copy of saved prefs; updated optimistically so the UI
  // reflects changes immediately even though the server-rendered prop
  // is frozen for the request.
  savedPreferences: WorkspaceTabPreferences | null;
}

export function useSavedView({
  workspaceKey,
  savedPreferences,
  currentFilters,
  currentSort,
  currentPageSize,
  currentHiddenColumns,
  applyFilters,
  applySort,
  applyPageSize,
  applyHiddenColumns,
  router,
}: UseSavedViewOptions): SavedViewController {
  const [localSaved, setLocalSaved] = useState<WorkspaceTabPreferences | null>(savedPreferences);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentSnapshot = useMemo<WorkspaceTabPreferences>(() => ({
    version: WORKSPACE_PREFERENCES_VERSION,
    filters: normaliseFilters(currentFilters),
    sort: currentSort,
    pageSize: currentPageSize,
    hiddenColumns: [...currentHiddenColumns].sort(),
  }), [currentFilters, currentHiddenColumns, currentPageSize, currentSort]);

  const normalisedSaved = useMemo<WorkspaceTabPreferences | null>(() => {
    if (!localSaved) return null;
    return {
      version: WORKSPACE_PREFERENCES_VERSION,
      filters: normaliseFilters(localSaved.filters),
      sort: localSaved.sort,
      pageSize: localSaved.pageSize,
      hiddenColumns: [...localSaved.hiddenColumns].sort(),
    };
  }, [localSaved]);

  const currentMatchesSaved = useMemo(() => (
    normalisedSaved !== null && isDeepEqual(currentSnapshot, normalisedSaved)
  ), [currentSnapshot, normalisedSaved]);

  const hasActiveFilters = useMemo(
    () => Object.keys(currentSnapshot.filters).length > 0,
    [currentSnapshot.filters],
  );

  const save = useCallback(() => {
    setError(null);
    const snapshot = currentSnapshot;
    startTransition(async () => {
      const result = await saveWorkspaceTabPreference({
        workspaceKey,
        preferences: snapshot,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setLocalSaved(snapshot);
    });
  }, [currentSnapshot, workspaceKey]);

  const resetToSaved = useCallback(() => {
    if (!normalisedSaved) return;
    setError(null);
    applyFilters(normalisedSaved.filters);
    applySort(normalisedSaved.sort);
    applyPageSize(normalisedSaved.pageSize);
    applyHiddenColumns(normalisedSaved.hiddenColumns);
    router.refresh();
  }, [applyFilters, applyHiddenColumns, applyPageSize, applySort, normalisedSaved, router]);

  const resetFilters = useCallback(() => {
    setError(null);
    applyFilters({});
    router.refresh();
  }, [applyFilters, router]);

  const deleteSaved = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await deleteWorkspaceTabPreference({ workspaceKey });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setLocalSaved(null);
    });
  }, [workspaceKey]);

  return {
    hasSaved: normalisedSaved !== null,
    currentMatchesSaved,
    hasActiveFilters,
    isPending,
    error,
    save,
    resetToSaved,
    resetFilters,
    deleteSaved,
    savedPreferences: localSaved,
  };
}
