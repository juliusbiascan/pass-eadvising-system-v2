import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import {
  buildAcademicReportWorkbook,
  reportExportFilename,
} from '@/features/dashboard/lib/export-academic-workbook';
import { getReportsBundle } from '@/features/dashboard/lib/get-reports-data';
import type { ReportExportType } from '@/features/dashboard/lib/report-types';
import { getDashboardAccess } from '@/lib/staff-access';

const EXPORT_TYPES: ReportExportType[] = [
  'all',
  'evaluations',
  'curriculum',
  'performance',
  'progress',
];

function isExportType(value: string | null): value is ReportExportType {
  return EXPORT_TYPES.includes(value as ReportExportType);
}

async function loadSchoolLogo() {
  try {
    return await readFile(path.join(process.cwd(), 'public', 'passlogo-small.png'));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const access = await getDashboardAccess();
  if (!access) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type');
  const type: ReportExportType = isExportType(typeParam) ? typeParam : 'all';

  const scopeLabel =
    access.role === 'HEAD'
      ? access.courses.length > 0
        ? access.courses.map((course) => course.code).join(', ')
        : 'Assigned departments'
      : 'All programs';

  const [bundle, logo] = await Promise.all([
    getReportsBundle(access.courseCodes, {
      scopeLabel,
      roleLabel: access.role === 'HEAD' ? 'Department Head' : 'Administrator',
    }),
    loadSchoolLogo(),
  ]);

  const workbook = await buildAcademicReportWorkbook(bundle, type, { logo });
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const filename = reportExportFilename(type, bundle.meta.generatedAt);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
