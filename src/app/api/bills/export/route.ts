import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  buildBillsCsv,
  filterExportableBills,
} from '@/lib/export/bills-csv';
import { BILL_EXPORT_COLUMN_IDS } from '@/lib/export/columns';
import {
  parseSelectedColumns,
  searchParamsToRecord,
} from '@/lib/export/csv';
import {
  csvDownloadResponse,
  csvExportErrorResponse,
} from '@/lib/export/http';
import { listBillsForTab } from '@/lib/queries';
import {
  billFiltersSchema,
  scopedFiltersForTab,
} from '@/lib/validators/bill-filter-spec';
import { billSortSpec } from '@/lib/validators/bill-sort-spec';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const exportableBillTabSchema = z.enum(['approvals', 'payment', 'history']);

export async function GET(request: NextRequest) {
  const params = searchParamsToRecord(request.nextUrl.searchParams);
  const tabResult = exportableBillTabSchema.safeParse(params.tab);
  const filtersResult = billFiltersSchema.safeParse(params);

  if (!tabResult.success || !filtersResult.success) {
    return NextResponse.json({ error: 'Invalid bill export parameters.' }, { status: 400 });
  }

  const tab = tabResult.data;
  try {
    const result = await listBillsForTab(tab, {
      filters: scopedFiltersForTab(tab, filtersResult.data),
      sort: billSortSpec.parseSearchParams(params),
    });
    const csv = buildBillsCsv(
      filterExportableBills(result.items),
      parseSelectedColumns(
        request.nextUrl.searchParams.get('columns'),
        BILL_EXPORT_COLUMN_IDS,
      ),
    );

    return csvDownloadResponse(csv, `bills-${tab}.csv`);
  } catch (error) {
    return csvExportErrorResponse(error);
  }
}
