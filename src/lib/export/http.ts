import { NextResponse } from 'next/server';

import {
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/auth';

export function csvDownloadResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
}

export function csvExportErrorResponse(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  return NextResponse.json({ error: 'CSV export failed.' }, { status: 500 });
}
