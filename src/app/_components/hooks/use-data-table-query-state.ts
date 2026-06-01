'use client';

import {
  useQueryStates,
  type UseQueryStatesKeysMap,
  type Values,
} from 'nuqs';
import {
  useCallback,
  useMemo,
  useTransition,
} from 'react';

import type { SortDirection, SortValue } from '@/lib/validators/sort-spec';

type ClearedFilters<TParsers extends UseQueryStatesKeysMap> = Partial<Values<TParsers>>;

type SetPagination = (updates: { page?: number; pageSize?: number }) => Promise<URLSearchParams>;
type SetSort<TSortKey extends string> = (
  updates: { dir: SortDirection; sort: TSortKey },
) => Promise<URLSearchParams>;

interface UseDataTableQueryStateOptions<
  TFilterParsers extends UseQueryStatesKeysMap,
  TPaginationParsers extends UseQueryStatesKeysMap,
  TSortParsers extends UseQueryStatesKeysMap,
> {
  clearedFilters: ClearedFilters<TFilterParsers>;
  filterParsers: TFilterParsers;
  pageSizeOptions: readonly number[];
  paginationParsers: TPaginationParsers;
  sortParsers: TSortParsers;
}

export function useDataTableQueryState<
  TFilterParsers extends UseQueryStatesKeysMap,
  TPaginationParsers extends UseQueryStatesKeysMap,
  TSortParsers extends UseQueryStatesKeysMap,
  TSortKey extends string,
>({
  clearedFilters,
  filterParsers,
  pageSizeOptions,
  paginationParsers,
  sortParsers,
}: UseDataTableQueryStateOptions<TFilterParsers, TPaginationParsers, TSortParsers>) {
  const [isPending, startTransition] = useTransition();
  const queryOptions = useMemo(
    () => ({ shallow: false, history: 'push' as const, startTransition }),
    [startTransition],
  );

  const [values, setValuesRaw] = useQueryStates(filterParsers, queryOptions);
  const [paginationRaw, setPaginationRaw] = useQueryStates(paginationParsers, queryOptions);
  const [sortRaw, setSortRaw] = useQueryStates(sortParsers, queryOptions);
  const setPagination = setPaginationRaw as unknown as SetPagination;
  const setSortValues = setSortRaw as unknown as SetSort<TSortKey>;
  const pagination = paginationRaw as { page: number; pageSize: number };
  const sort = useMemo(
    () => ({
      by: sortRaw.sort as TSortKey,
      dir: sortRaw.dir as SortDirection,
    }),
    [sortRaw.dir, sortRaw.sort],
  );

  const setValues = useCallback(
    (updates: Partial<Values<TFilterParsers>>) => {
      void setPagination({ page: 1 });
      return setValuesRaw(updates);
    },
    [setPagination, setValuesRaw],
  );

  const clearAll = useCallback(() => {
    void setPagination({ page: 1 });
    return setValuesRaw(clearedFilters);
  }, [clearedFilters, setPagination, setValuesRaw]);

  const setPage = useCallback(
    (page: number) => setPagination({ page }),
    [setPagination],
  );

  const setPageSize = useCallback(
    (pageSize: number) => setPagination({ pageSize, page: 1 }),
    [setPagination],
  );

  const setSort = useCallback(
    (next: SortValue<TSortKey>) => {
      void setPagination({ page: 1 });
      return setSortValues({ sort: next.by, dir: next.dir });
    },
    [setPagination, setSortValues],
  );

  const toggleSort = useCallback(
    (key: TSortKey) => {
      const nextDir: SortDirection = sort.by === key && sort.dir === 'desc' ? 'asc' : 'desc';
      void setPagination({ page: 1 });
      return setSortValues({ sort: key, dir: nextDir });
    },
    [setPagination, setSortValues, sort.by, sort.dir],
  );

  return {
    clearAll,
    isPending,
    pageSizeOptions,
    pagination,
    setPage,
    setPageSize,
    setSort,
    setValues,
    sort,
    toggleSort,
    values,
  };
}
