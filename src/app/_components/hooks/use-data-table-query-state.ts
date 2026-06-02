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

interface ParserWithDefault<TValue> {
  defaultValue: TValue;
  parse: (value: string) => TValue | null;
  serialize: (value: TValue) => string;
}

interface PaginationParsers {
  page: ParserWithDefault<number>;
  pageSize: ParserWithDefault<number>;
}

interface SortParsers<TSortKey extends string> {
  sort: ParserWithDefault<TSortKey>;
  dir: ParserWithDefault<SortDirection>;
}

interface UseDataTableQueryStateOptions<
  TFilterParsers extends UseQueryStatesKeysMap,
  TSortKey extends string,
> {
  clearedFilters: ClearedFilters<TFilterParsers>;
  filterParsers: TFilterParsers;
  pageSizeOptions: readonly number[];
  paginationParsers: PaginationParsers;
  sortParsers: SortParsers<TSortKey>;
}

export function useDataTableQueryState<
  TFilterParsers extends UseQueryStatesKeysMap,
  TSortKey extends string,
>({
  clearedFilters,
  filterParsers,
  pageSizeOptions,
  paginationParsers,
  sortParsers,
}: UseDataTableQueryStateOptions<
  TFilterParsers,
  TSortKey
>) {
  const [isPending, startTransition] = useTransition();
  const queryOptions = useMemo(
    () => ({ shallow: false, history: 'push' as const, startTransition }),
    [startTransition],
  );

  const [values, setValuesRaw] = useQueryStates(filterParsers, queryOptions);
  const [pagination, setPagination] = useQueryStates({
    page: paginationParsers.page,
    pageSize: paginationParsers.pageSize,
  }, queryOptions);
  const [sortRaw, setSortValues] = useQueryStates({
    sort: sortParsers.sort,
    dir: sortParsers.dir,
  }, queryOptions);
  const sort = useMemo(
    () => ({
      by: sortRaw.sort,
      dir: sortRaw.dir,
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
