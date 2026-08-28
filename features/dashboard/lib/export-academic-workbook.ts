import ExcelJS from 'exceljs';

import { schoolBrand } from '@/config/school';
import { formatYearLevelLabel } from '@/lib/group-curriculum-offerings';
import { formatSemesterLabel } from '@/lib/semester-terms';
import {
  EVALUATION_STATUS_LABEL,
  formatEvaluatorLabel,
} from '@/lib/evaluation';

import type {
  ReportExportType,
  ReportInsight,
  ReportKpi,
  ReportsBundle,
} from './report-types';

const FONT = 'Arial';
const PASS_RED = 'FFC9121F';
const PASS_GOLD = 'FFEBC42E';
const PASS_COD = 'FF1A1617';
const HEADER_FILL = 'FF1A1617';
const ZEBRA = 'FFF7F4F4';

type WorkbookOptions = {
  logo?: Buffer | Uint8Array | ArrayBuffer | null;
};

function formatGeneratedAt(iso: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function evaluationStatusLabel(status: string) {
  return (
    EVALUATION_STATUS_LABEL[status as keyof typeof EVALUATION_STATUS_LABEL] ?? status
  );
}

function applyHeaderCell(cell: ExcelJS.Cell, value: string) {
  cell.value = value;
  cell.font = { name: FONT, bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: PASS_COD } },
    left: { style: 'thin', color: { argb: PASS_COD } },
    bottom: { style: 'thin', color: { argb: PASS_COD } },
    right: { style: 'thin', color: { argb: PASS_COD } },
  };
}

function applyDataCell(
  cell: ExcelJS.Cell,
  value: string | number,
  zebra: boolean
) {
  cell.value = value;
  cell.font = { name: FONT, size: 10, color: { argb: PASS_COD } };
  cell.alignment = { vertical: 'middle', wrapText: true };
  if (zebra) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
  }
  cell.border = {
    top: { style: 'hair', color: { argb: 'FFD4D0D1' } },
    left: { style: 'hair', color: { argb: 'FFD4D0D1' } },
    bottom: { style: 'hair', color: { argb: 'FFD4D0D1' } },
    right: { style: 'hair', color: { argb: 'FFD4D0D1' } },
  };
}

function setPrint(sheet: ExcelJS.Worksheet, title: string) {
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.7,
      bottom: 0.6,
      header: 0.3,
      footer: 0.3,
    },
  };
  sheet.headerFooter = {
    oddHeader: `&C&B${schoolBrand.name} — ${title}`,
    oddFooter: `&L${schoolBrand.systemName}&CInternal academic report&RPage &P of &N`,
  };
}

function writeLetterhead(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  subtitle: string,
  meta: ReportsBundle['meta'],
  logoId: number | null
) {
  sheet.mergeCells('C1:L1');
  sheet.mergeCells('C2:L2');
  sheet.mergeCells('C3:L3');
  sheet.mergeCells('A5:L5');
  sheet.mergeCells('A6:L6');

  const name = sheet.getCell('C1');
  name.value = schoolBrand.name;
  name.font = { name: FONT, bold: true, size: 18, color: { argb: PASS_RED } };
  name.alignment = { vertical: 'middle' };

  const address = sheet.getCell('C2');
  address.value = `${schoolBrand.address} · ${schoolBrand.locality}`;
  address.font = { name: FONT, size: 11, color: { argb: PASS_COD } };

  const system = sheet.getCell('C3');
  system.value = `${schoolBrand.systemName} · ${schoolBrand.tagline}`;
  system.font = { name: FONT, italic: true, size: 10, color: { argb: 'FF6B6566' } };

  sheet.getRow(1).height = 24;
  sheet.getRow(2).height = 18;
  sheet.getRow(3).height = 18;

  if (logoId !== null) {
    sheet.addImage(logoId, {
      tl: { col: 0.15, row: 0.15 },
      ext: { width: 58, height: 58 },
    });
  }

  const title = sheet.getCell('A5');
  title.value = subtitle;
  title.font = { name: FONT, bold: true, size: 14, color: { argb: PASS_COD } };

  const metaCell = sheet.getCell('A6');
  metaCell.value = `Generated ${formatGeneratedAt(meta.generatedAt)}  ·  Scope: ${meta.scopeLabel}  ·  Prepared for ${meta.roleLabel}`;
  metaCell.font = { name: FONT, size: 10, color: { argb: 'FF6B6566' } };

  const gold = sheet.getCell('A4');
  sheet.mergeCells('A4:L4');
  gold.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PASS_GOLD } };
  sheet.getRow(4).height = 6;
}

function writeKpis(sheet: ExcelJS.Worksheet, kpis: ReportKpi[], startRow: number) {
  kpis.slice(0, 4).forEach((kpi, index) => {
    const col = 1 + index * 3;
    sheet.mergeCells(startRow, col, startRow, col + 2);
    sheet.mergeCells(startRow + 1, col, startRow + 1, col + 2);
    sheet.mergeCells(startRow + 2, col, startRow + 2, col + 2);

    const label = sheet.getCell(startRow, col);
    label.value = kpi.label.toUpperCase();
    label.font = { name: FONT, bold: true, size: 8, color: { argb: 'FF6B6566' } };

    const value = sheet.getCell(startRow + 1, col);
    value.value = kpi.value;
    value.font = { name: FONT, bold: true, size: 16, color: { argb: PASS_COD } };

    const hint = sheet.getCell(startRow + 2, col);
    hint.value = kpi.hint;
    hint.font = { name: FONT, size: 9, color: { argb: 'FF6B6566' } };
  });
}

function writeInsights(
  sheet: ExcelJS.Worksheet,
  insights: ReportInsight[],
  startRow: number
) {
  sheet.mergeCells(startRow, 1, startRow, 12);
  const heading = sheet.getCell(startRow, 1);
  heading.value = 'Analysis';
  heading.font = { name: FONT, bold: true, size: 12, color: { argb: PASS_COD } };

  insights.forEach((insight, index) => {
    const row = startRow + 1 + index;
    sheet.mergeCells(row, 1, row, 12);
    const cell = sheet.getCell(row, 1);
    cell.value = `${insight.title} — ${insight.detail}`;
    cell.font = { name: FONT, size: 10, color: { argb: PASS_COD } };
    cell.alignment = { wrapText: true, vertical: 'top' };
    sheet.getRow(row).height = 32;
  });
}

function writeTable(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  headers: string[],
  rows: Array<Array<string | number>>,
  widths: number[]
) {
  sheet.columns = widths.map((width) => ({ width }));
  headers.forEach((header, index) => {
    applyHeaderCell(sheet.getRow(startRow).getCell(index + 1), header);
  });
  sheet.getRow(startRow).height = 22;

  rows.forEach((values, rowIndex) => {
    const excelRow = sheet.getRow(startRow + 1 + rowIndex);
    values.forEach((value, colIndex) => {
      applyDataCell(excelRow.getCell(colIndex + 1), value, rowIndex % 2 === 1);
    });
    excelRow.height = 18;
  });
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  bundle: ReportsBundle,
  logoId: number | null
) {
  const sheet = workbook.addWorksheet('Summary');
  writeLetterhead(
    workbook,
    sheet,
    'Academic Advising Report — Executive Summary',
    bundle.meta,
    logoId
  );
  setPrint(sheet, 'Academic Advising Report');

  const overview: ReportKpi[] = [
    {
      label: 'Evaluations',
      value: String(bundle.evaluations.analytics.total),
      hint: `${bundle.evaluations.analytics.approvalRate}% approved`,
    },
    {
      label: 'Curriculum batches',
      value: String(bundle.curriculum.analytics.total),
      hint: `${bundle.curriculum.analytics.totalStudents} students assigned`,
    },
    {
      label: 'High-risk subjects',
      value: String(bundle.performance.analytics.highRiskCount),
      hint: `${bundle.performance.analytics.avgFailureRate}% avg. failure rate`,
    },
    {
      label: 'Avg. student progress',
      value: `${bundle.progress.analytics.avgProgress}%`,
      hint: `${bundle.progress.analytics.atRiskCount} need advising`,
    },
  ];
  writeKpis(sheet, overview, 8);

  const allInsights = [
    ...bundle.evaluations.analytics.insights,
    ...bundle.curriculum.analytics.insights,
    ...bundle.performance.analytics.insights,
    ...bundle.progress.analytics.insights,
  ];
  writeInsights(sheet, allInsights, 12);

  sheet.getColumn(1).width = 14;
  for (let col = 2; col <= 12; col += 1) {
    sheet.getColumn(col).width = 12;
  }
}

function addEvaluationsSheet(
  workbook: ExcelJS.Workbook,
  bundle: ReportsBundle,
  logoId: number | null
) {
  const sheet = workbook.addWorksheet('Evaluations');
  writeLetterhead(workbook, sheet, 'Student Evaluation Report', bundle.meta, logoId);
  setPrint(sheet, 'Student Evaluation Report');
  writeKpis(sheet, bundle.evaluations.analytics.kpis, 8);
  writeInsights(sheet, bundle.evaluations.analytics.insights, 12);

  const tableStart = 13 + bundle.evaluations.analytics.insights.length;
  writeTable(
    sheet,
    tableStart,
    [
      'Student ID',
      'Name',
      'Course',
      'Year',
      'Semester',
      'Curriculum',
      'Status',
      'Passed',
      'Eligible',
      'Blocked',
      'Evaluator',
      'Date',
    ],
    bundle.evaluations.rows.map((row) => [
      row.studentId,
      row.fullName,
      row.course,
      formatYearLevelLabel(row.yearLevel),
      formatSemesterLabel(row.semester),
      row.curriculum,
      evaluationStatusLabel(row.evaluationStatus),
      row.passedCount,
      row.eligibleCount,
      row.blockedCount,
      formatEvaluatorLabel(row.completedByName, row.completedByPosition),
      row.completedAt ? new Date(row.completedAt).toLocaleDateString('en-PH') : 'N/A',
    ]),
    [14, 24, 12, 12, 14, 28, 18, 10, 10, 10, 22, 14]
  );
}

function addCurriculumSheet(
  workbook: ExcelJS.Workbook,
  bundle: ReportsBundle,
  logoId: number | null
) {
  const sheet = workbook.addWorksheet('Curriculum');
  writeLetterhead(workbook, sheet, 'Curriculum Report', bundle.meta, logoId);
  setPrint(sheet, 'Curriculum Report');
  writeKpis(sheet, bundle.curriculum.analytics.kpis, 8);
  writeInsights(sheet, bundle.curriculum.analytics.insights, 12);

  const tableStart = 13 + bundle.curriculum.analytics.insights.length;
  writeTable(
    sheet,
    tableStart,
    [
      'Program',
      'Title',
      'Batch',
      'Year',
      'Version',
      'Status',
      'Subjects',
      'Students',
      'Offerings by term',
    ],
    bundle.curriculum.rows.map((row) => [
      row.programCode,
      row.title,
      row.batchLabel,
      row.batchYear,
      row.versionTag === 'OLD' ? 'Old' : 'New',
      row.isActive ? 'Active' : 'Inactive',
      row.subjectsCount,
      row.studentsCount,
      Object.entries(row.semesterBreakdown)
        .map(([term, count]) => `${term}: ${count}`)
        .join(' · ') || 'No subjects',
    ]),
    [12, 36, 22, 10, 10, 12, 12, 12, 48]
  );
}

function addPerformanceSheet(
  workbook: ExcelJS.Workbook,
  bundle: ReportsBundle,
  logoId: number | null
) {
  const sheet = workbook.addWorksheet('Subject Performance');
  writeLetterhead(workbook, sheet, 'Subject Performance Report', bundle.meta, logoId);
  setPrint(sheet, 'Subject Performance Report');
  writeKpis(sheet, bundle.performance.analytics.kpis, 8);
  writeInsights(sheet, bundle.performance.analytics.insights, 12);

  const tableStart = 13 + bundle.performance.analytics.insights.length;
  writeTable(
    sheet,
    tableStart,
    ['Subject code', 'Description', 'Failures', 'Grades recorded', 'Failure rate %', 'Risk'],
    bundle.performance.rows.map((row) => [
      row.subjectCode,
      row.subjectDescription,
      row.failureCount,
      row.totalEnrolled,
      Number(row.failureRate.toFixed(1)),
      row.failureRate >= 30 ? 'High' : row.failureRate >= 15 ? 'Moderate' : row.failureCount > 0 ? 'Low' : 'Clear',
    ]),
    [16, 48, 12, 18, 16, 12]
  );
}

function addProgressSheet(
  workbook: ExcelJS.Workbook,
  bundle: ReportsBundle,
  logoId: number | null
) {
  const sheet = workbook.addWorksheet('Academic Progress');
  writeLetterhead(workbook, sheet, 'Academic Progress Report', bundle.meta, logoId);
  setPrint(sheet, 'Academic Progress Report');
  writeKpis(sheet, bundle.progress.analytics.kpis, 8);
  writeInsights(sheet, bundle.progress.analytics.insights, 12);

  const tableStart = 13 + bundle.progress.analytics.insights.length;
  writeTable(
    sheet,
    tableStart,
    [
      'Student ID',
      'Name',
      'Course',
      'Year',
      'Curriculum',
      'Progress %',
      'Passed',
      'Failed',
      'Remaining',
      'Total subjects',
      'Current-term evaluation',
    ],
    bundle.progress.rows.map((row) => [
      row.studentId,
      row.fullName,
      row.course,
      formatYearLevelLabel(row.yearLevel),
      row.curriculum,
      row.progressPercentage,
      row.passed,
      row.failed,
      row.remaining,
      row.totalSubjects,
      evaluationStatusLabel(row.latestEvaluationStatus),
    ]),
    [14, 24, 12, 12, 28, 12, 10, 10, 12, 14, 22]
  );
}

export async function buildAcademicReportWorkbook(
  bundle: ReportsBundle,
  type: ReportExportType,
  options: WorkbookOptions = {}
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = schoolBrand.systemName;
  workbook.company = schoolBrand.name;
  workbook.created = new Date(bundle.meta.generatedAt);
  workbook.title = `${schoolBrand.name} Academic Advising Report`;

  let logoId: number | null = null;
  if (options.logo) {
    logoId = workbook.addImage({
      buffer: options.logo as ExcelJS.Buffer,
      extension: 'png',
    });
  }

  const includeAll = type === 'all';
  if (includeAll) {
    addSummarySheet(workbook, bundle, logoId);
  }
  if (includeAll || type === 'evaluations') {
    addEvaluationsSheet(workbook, bundle, logoId);
  }
  if (includeAll || type === 'curriculum') {
    addCurriculumSheet(workbook, bundle, logoId);
  }
  if (includeAll || type === 'performance') {
    addPerformanceSheet(workbook, bundle, logoId);
  }
  if (includeAll || type === 'progress') {
    addProgressSheet(workbook, bundle, logoId);
  }

  return workbook;
}

export function reportExportFilename(type: ReportExportType, generatedAt: string) {
  const date = new Date(generatedAt).toISOString().slice(0, 10);
  const slug =
    type === 'all'
      ? 'Academic-Report'
      : type === 'evaluations'
        ? 'Evaluations-Report'
        : type === 'curriculum'
          ? 'Curriculum-Report'
          : type === 'performance'
            ? 'Subject-Performance-Report'
            : 'Academic-Progress-Report';
  return `PASS-College-${slug}-${date}.xlsx`;
}
