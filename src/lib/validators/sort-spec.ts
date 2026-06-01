import { parseAsStringLiteral } from 'nuqs/server';
import { z } from 'zod';

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface SortValue<TKey extends string> {
  by: TKey;
  dir: SortDirection;
}

export interface SortSpec<TKey extends string> {
  allowedKeys: readonly TKey[];
  defaultKey: TKey;
  defaultDir: SortDirection;
  parsers: {
    sort: ReturnType<typeof parseAsStringLiteral<TKey>>;
    dir: ReturnType<typeof parseAsStringLiteral<SortDirection>>;
  };
  parseSearchParams: (params: Record<string, string>) => SortValue<TKey>;
}

export function createSortSpec<TKey extends string>(opts: {
  allowedKeys: readonly TKey[];
  defaultKey: TKey;
  defaultDir?: SortDirection;
}): SortSpec<TKey> {
  const { allowedKeys, defaultKey, defaultDir = 'desc' } = opts;

  const keyEnum = z.enum(allowedKeys as readonly [TKey, ...TKey[]]);
  const dirEnum = z.enum(SORT_DIRECTIONS);

  const schema = z.object({
    sort: keyEnum.optional(),
    dir: dirEnum.optional(),
  });

  return {
    allowedKeys,
    defaultKey,
    defaultDir,
    parsers: {
      sort: parseAsStringLiteral(allowedKeys).withDefault(defaultKey),
      dir: parseAsStringLiteral(SORT_DIRECTIONS).withDefault(defaultDir),
    },
    parseSearchParams(params) {
      const result = schema.safeParse(params);
      const parsed = result.success ? result.data : {};
      return {
        by: parsed.sort ?? defaultKey,
        dir: parsed.dir ?? defaultDir,
      };
    },
  };
}
