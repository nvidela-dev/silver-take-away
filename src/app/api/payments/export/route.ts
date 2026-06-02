import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { PAYMENT_EXPORT_COLUMN_IDS } from '@/lib/export/columns';
import { parseSelectedColumns, searchParamsToRecord } from '@/lib/export/csv';
import {
  csvDownloadResponse,
  csvExportErrorResponse,
} from '@/lib/export/http';
import { buildPaymentsCsv } from '@/lib/export/payments-csv';
import { listPaymentsForTab } from '@/lib/queries';
import {
  paymentFiltersSchema,
  scopedFiltersForTab,
} from '@/lib/validators/payment-filter-spec';
import { paymentSortSpec } from '@/lib/validators/payment-sort-spec';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const paymentTabSchema = z.enum(['upcoming', 'processing', 'history']);

export async function GET(request: NextRequest) {
  const params = searchParamsToRecord(request.nextUrl.searchParams);
  const tabResult = paymentTabSchema.safeParse(params.tab);
  const filtersResult = paymentFiltersSchema.safeParse(params);

  if (!tabResult.success || !filtersResult.success) {
    return NextResponse.json({ error: 'Invalid payment export parameters.' }, { status: 400 });
  }

  const tab = tabResult.data;
  try {
    const result = await listPaymentsForTab(tab, {
      filters: scopedFiltersForTab(tab, filtersResult.data),
      sort: paymentSortSpec.parseSearchParams(params),
    });
    const csv = buildPaymentsCsv(
      result.items,
      parseSelectedColumns(
        request.nextUrl.searchParams.get('columns'),
        PAYMENT_EXPORT_COLUMN_IDS,
      ),
    );

    return csvDownloadResponse(csv, `payments-${tab}.csv`);
  } catch (error) {
    return csvExportErrorResponse(error);
  }
}
