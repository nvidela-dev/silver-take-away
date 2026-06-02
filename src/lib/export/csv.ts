import Papa from 'papaparse';

export interface CsvColumn<TRow> {
  header: string;
  sourceId: string;
  value: (row: TRow) => string | number;
}

export function buildCsv<TRow>(
  rows: readonly TRow[],
  columns: readonly CsvColumn<TRow>[],
  selectedSourceIds: readonly string[],
): string {
  const selected = new Set(selectedSourceIds);
  const activeColumns = columns.filter((column) => selected.has(column.sourceId));

  return Papa.unparse(
    rows.map((row) => Object.fromEntries(
      activeColumns.map((column) => [column.header, column.value(row)]),
    )),
    {
      columns: activeColumns.map((column) => column.header),
      escapeFormulae: true,
    },
  );
}

export function parseSelectedColumns(
  value: string | null,
  allowedSourceIds: readonly string[],
): string[] {
  const allowed = new Set(allowedSourceIds);
  const selected = value
    ?.split(',')
    .map((part) => part.trim())
    .filter((part) => allowed.has(part)) ?? [];
  return selected.length > 0 ? selected : [...allowedSourceIds];
}

export function searchParamsToRecord(searchParams: URLSearchParams): Record<string, string> {
  return Object.fromEntries(searchParams.entries());
}
