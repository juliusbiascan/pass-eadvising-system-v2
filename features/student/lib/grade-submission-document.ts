import type { CurriculumItem, ExistingGrade } from './types';

export type GradeSubmissionRow = {
  id: string;
  code: string;
  description: string;
  units: number;
  grade: string;
  isRetake?: boolean;
};

export type GradeSubmissionDocument = {
  studentName: string;
  studentId: string;
  course: string;
  yearLevel: number;
  termLabel: string;
  rows: GradeSubmissionRow[];
};

export function buildGradeSubmissionRows(
  offerings: CurriculumItem[],
  existingGrades: Record<string, ExistingGrade>
): GradeSubmissionRow[] {
  return offerings.map((offering) => ({
    id: offering.id,
    code: offering.code,
    description: offering.isRetake ? `${offering.description} (Retake)` : offering.description,
    units: offering.units,
    grade: existingGrades[offering.id]?.grade?.trim() || '—',
    isRetake: offering.isRetake,
  }));
}

export function buildGradeSubmissionPlainText(doc: GradeSubmissionDocument): string {
  const lines = [
    'PASS COLLEGE',
    'e-Advising System',
    'GRADE SUBMISSION FORM',
    '',
    `Name: ${doc.studentName}`,
    `Student ID: ${doc.studentId}`,
    `Course: ${doc.course}`,
    `Year / Term: Year ${doc.yearLevel} • ${doc.termLabel}`,
    '',
    'Grades',
    ...doc.rows.map(
      (row) => `${row.code} | ${row.description} | ${row.units} u | ${row.grade}`
    ),
    '',
    'Student signature over printed name:',
    doc.studentName,
    '',
    'Administrator signature over printed name:',
    '________________________',
  ];

  return lines.join('\n');
}

export function buildGradeSubmissionEmailBody(doc: GradeSubmissionDocument): string {
  const rows = doc.rows
    .map(
      (row) => `
        <tr>
          <td style="border:1px solid #1a1617;padding:8px 10px">${escapeHtml(row.code)}</td>
          <td style="border:1px solid #1a1617;padding:8px 10px">${escapeHtml(row.description)}</td>
          <td style="border:1px solid #1a1617;padding:8px 10px;text-align:center">${row.units}</td>
          <td style="border:1px solid #1a1617;padding:8px 10px;text-align:center">${escapeHtml(row.grade)}</td>
        </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;font-size:14px">
      <tr><td style="padding:4px 0;color:#6b6566;width:120px">Name</td><td>${escapeHtml(doc.studentName)}</td></tr>
      <tr><td style="padding:4px 0;color:#6b6566">Student ID</td><td>${escapeHtml(doc.studentId)}</td></tr>
      <tr><td style="padding:4px 0;color:#6b6566">Course</td><td>${escapeHtml(doc.course)}</td></tr>
      <tr><td style="padding:4px 0;color:#6b6566">Year / Term</td><td>Year ${doc.yearLevel} · ${escapeHtml(doc.termLabel)}</td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px">
      <thead>
        <tr>
          <th align="left" style="border:1px solid #1a1617;background:#f3f3f4;padding:8px 10px">Code</th>
          <th align="left" style="border:1px solid #1a1617;background:#f3f3f4;padding:8px 10px">Subject</th>
          <th align="center" style="border:1px solid #1a1617;background:#f3f3f4;padding:8px 10px">Units</th>
          <th align="center" style="border:1px solid #1a1617;background:#f3f3f4;padding:8px 10px">Grade</th>
        </tr>
      </thead>
      <tbody>${rows}
      </tbody>
    </table>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildGradeSubmissionHtml(doc: GradeSubmissionDocument): string {
  const rows = doc.rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.code)}</td>
          <td>${escapeHtml(row.description)}</td>
          <td style="text-align:center">${row.units}</td>
          <td style="text-align:center">${escapeHtml(row.grade)}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Grade Submission — ${escapeHtml(doc.studentName)}</title>
  <style>
    @page { margin: 16mm; }
    body {
      margin: 0;
      padding: 24px;
      font-family: Georgia, "Times New Roman", Times, serif;
      color: #1a1617;
      background: #fff;
    }
    .sheet { max-width: 800px; margin: 0 auto; }
    .brand { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #c9121f; font-family: Arial, sans-serif; font-weight: 700; }
    h1 { margin: 6px 0 4px; font-size: 22px; }
    .subtitle { margin: 0 0 20px; font-size: 13px; color: #6b6566; font-family: Arial, sans-serif; }
    .meta { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 14px; }
    .meta td { padding: 6px 0; vertical-align: top; }
    .meta .label { width: 140px; color: #6b6566; }
    table.grades { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 13px; }
    table.grades th, table.grades td { border: 1px solid #1a1617; padding: 8px 10px; }
    table.grades th { background: #f3f3f4; text-align: left; }
    .signs { display: flex; gap: 48px; margin-top: 56px; }
    .sign { flex: 1; text-align: center; }
    .line { border-bottom: 1px solid #1a1617; height: 48px; margin-bottom: 6px; }
    .caption { font-size: 11px; color: #6b6566; font-family: Arial, sans-serif; }
    .printed { margin-top: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; min-height: 1.4em; }
    .printed.blank { border-bottom: 1px solid #1a1617; width: 85%; margin: 10px auto 0; font-weight: 400; }
    .role { font-size: 12px; color: #6b6566; font-family: Arial, sans-serif; }
    @media print {
      body { padding: 0; }
      .signs { break-inside: avoid; }
      table.grades tr { break-inside: avoid; }
    }
    @media (max-width: 640px) {
      .signs { display: block; }
      .sign { margin-top: 40px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="brand">PASS College</div>
    <h1>Grade Submission Form</h1>
    <p class="subtitle">e-Advising System · For student and administrator confirmation</p>
    <table class="meta">
      <tr><td class="label">Name</td><td>${escapeHtml(doc.studentName)}</td></tr>
      <tr><td class="label">Student ID</td><td>${escapeHtml(doc.studentId)}</td></tr>
      <tr><td class="label">Course</td><td>${escapeHtml(doc.course)}</td></tr>
      <tr><td class="label">Year / Term</td><td>Year ${doc.yearLevel} · ${escapeHtml(doc.termLabel)}</td></tr>
    </table>
    <table class="grades">
      <thead>
        <tr>
          <th>Code</th>
          <th>Subject</th>
          <th style="text-align:center;width:70px">Units</th>
          <th style="text-align:center;width:90px">Grade</th>
        </tr>
      </thead>
      <tbody>${rows}
      </tbody>
    </table>
    <div class="signs">
      <div class="sign">
        <div class="line"></div>
        <div class="caption">Signature over printed name</div>
        <div class="printed">${escapeHtml(doc.studentName)}</div>
        <div class="role">Student</div>
      </div>
      <div class="sign">
        <div class="line"></div>
        <div class="caption">Signature over printed name</div>
        <div class="printed blank">&nbsp;</div>
        <div class="role">Administrator</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function slugifyFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'student';
}
