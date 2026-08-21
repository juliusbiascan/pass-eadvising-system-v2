import { formatSemesterLabel } from '@/lib/semester-terms';
import type { CurriculumItem, ExistingGrade } from './types';

export type RetakeRequestRow = {
  id: string;
  code: string;
  description: string;
  units: number;
  grade: string;
  failedTerm: string;
};

export type RetakeRequestDocument = {
  studentName: string;
  studentId: string;
  course: string;
  yearLevel: number;
  termLabel: string;
  variant?: 'failed' | 'leftover';
  rows: RetakeRequestRow[];
};

export function buildRetakeRequestRows(
  failedSubjects: CurriculumItem[],
  existingGrades: Record<string, ExistingGrade>
): RetakeRequestRow[] {
  return failedSubjects.map((subject) => ({
    id: subject.id,
    code: subject.code,
    description: subject.description,
    units: subject.units,
    grade: existingGrades[subject.id]?.grade?.trim()
      || (subject.scheduleKind === 'PENDING' || existingGrades[subject.id]?.status === 'PENDING'
        ? 'Pending'
        : existingGrades[subject.id]?.status === 'INCOMPLETE' || subject.scheduleKind === 'INCOMPLETE'
          ? 'Incomplete'
          : 'Failed'),
    failedTerm: `Year ${subject.yearLevel} • ${formatSemesterLabel(subject.semester)}`,
  }));
}

export function buildRetakeRequestHtml(doc: RetakeRequestDocument): string {
  const isLeftover = doc.variant === 'leftover';
  const title = isLeftover ? 'Request to Take Leftover Subject' : 'Request to Retake Subject';
  const originalTermLabel = isLeftover ? 'Original term' : 'Failed in';
  const whenLabel = isLeftover ? 'Admin: when to take' : 'Admin: when to retake';
  const note = isLeftover
    ? `I respectfully request permission to take the unfinished subject(s) listed below, which remain pending or incomplete from an earlier term.
      The administrator will confirm whether each subject may be taken <strong>next semester</strong> or <strong>next year</strong>.
      After confirmation, the subject will appear on my grade evaluation form for that term.`
    : `I respectfully request permission to retake the failed subject(s) listed below.
      The administrator will confirm whether each subject may be taken <strong>next semester</strong> or <strong>next year</strong>.
      After confirmation, the subject will appear on my grade evaluation form for that term.`;

  const rows = doc.rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.code)}</td>
          <td>${escapeHtml(row.description)}</td>
          <td style="text-align:center">${row.units}</td>
          <td style="text-align:center">${escapeHtml(row.grade)}</td>
          <td>${escapeHtml(row.failedTerm)}</td>
          <td style="text-align:center">☐ Next semester &nbsp; ☐ Next year</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — ${escapeHtml(doc.studentName)}</title>
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
    .meta { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-family: Arial, sans-serif; font-size: 14px; }
    .meta td { padding: 6px 0; vertical-align: top; }
    .meta .label { width: 140px; color: #6b6566; }
    .note { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; margin: 0 0 18px; }
    table.subjects { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 13px; }
    table.subjects th, table.subjects td { border: 1px solid #1a1617; padding: 8px 10px; }
    table.subjects th { background: #f3f3f4; text-align: left; }
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
      table.subjects tr { break-inside: avoid; }
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
    <h1>${escapeHtml(title)}</h1>
    <p class="subtitle">e-Advising System · Submit this form to an administrator</p>
    <table class="meta">
      <tr><td class="label">Name</td><td>${escapeHtml(doc.studentName)}</td></tr>
      <tr><td class="label">Student ID</td><td>${escapeHtml(doc.studentId)}</td></tr>
      <tr><td class="label">Course</td><td>${escapeHtml(doc.course)}</td></tr>
      <tr><td class="label">Current term</td><td>Year ${doc.yearLevel} · ${escapeHtml(doc.termLabel)}</td></tr>
    </table>
    <p class="note">
      ${note}
    </p>
    <table class="subjects">
      <thead>
        <tr>
          <th>Code</th>
          <th>Subject</th>
          <th style="text-align:center;width:60px">Units</th>
          <th style="text-align:center;width:80px">Grade</th>
          <th>${originalTermLabel}</th>
          <th style="width:210px">${whenLabel}</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="6" style="text-align:center">${isLeftover ? 'No leftover subjects' : 'No failed subjects'}</td></tr>`}
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function slugifyFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'student';
}
