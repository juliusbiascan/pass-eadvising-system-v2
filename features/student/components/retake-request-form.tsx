'use client';

import { useMemo } from 'react';
import { Download, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { printHtmlDocument } from '../lib/print-html-document';
import {
  buildRetakeRequestHtml,
  buildRetakeRequestRows,
  slugifyFilePart,
  type RetakeRequestDocument,
} from '../lib/retake-request-document';
import type { CurriculumItem, ExistingGrade, StudentPortalStudent } from '../lib/types';

interface RetakeRequestFormProps {
  student: StudentPortalStudent;
  termLabel: string;
  failedSubjects: CurriculumItem[];
  existingGrades: Record<string, ExistingGrade>;
  variant?: 'failed' | 'leftover';
}

function SubjectsTable({ document }: { document: RetakeRequestDocument }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="border border-[#1a1617] bg-[#f3f3f4] px-2 py-2 text-left font-semibold sm:px-3">
            Code
          </th>
          <th className="border border-[#1a1617] bg-[#f3f3f4] px-2 py-2 text-left font-semibold sm:px-3">
            Subject
          </th>
          <th className="w-14 border border-[#1a1617] bg-[#f3f3f4] px-1 py-2 text-center font-semibold sm:px-3">
            Units
          </th>
          <th className="w-16 border border-[#1a1617] bg-[#f3f3f4] px-1 py-2 text-center font-semibold sm:px-3">
            Grade
          </th>
          <th className="border border-[#1a1617] bg-[#f3f3f4] px-2 py-2 text-left font-semibold sm:px-3">
            {document.variant === 'leftover' ? 'Original term' : 'Failed in'}
          </th>
          <th className="border border-[#1a1617] bg-[#f3f3f4] px-2 py-2 text-left font-semibold sm:px-3">
            When to take
          </th>
        </tr>
      </thead>
      <tbody>
        {document.rows.map((row) => (
          <tr key={row.id}>
            <td className="border border-[#1a1617] px-2 py-2 font-medium sm:px-3">{row.code}</td>
            <td className="border border-[#1a1617] px-2 py-2 wrap-break-word sm:px-3">
              {row.description}
            </td>
            <td className="border border-[#1a1617] px-1 py-2 text-center tabular-nums sm:px-3">
              {row.units}
            </td>
            <td className="border border-[#1a1617] px-1 py-2 text-center tabular-nums sm:px-3">
              {row.grade}
            </td>
            <td className="border border-[#1a1617] px-2 py-2 sm:px-3">{row.failedTerm}</td>
            <td className="border border-[#1a1617] px-2 py-2 text-xs sm:px-3">
              ☐ Next semester &nbsp; ☐ Next year
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RetakeRequestForm({
  student,
  termLabel,
  failedSubjects,
  existingGrades,
  variant = 'failed',
}: RetakeRequestFormProps) {
  const document = useMemo<RetakeRequestDocument>(
    () => ({
      studentName: student.fullName,
      studentId: student.studentId,
      course: student.course,
      yearLevel: student.yearLevel,
      termLabel,
      variant,
      rows: buildRetakeRequestRows(failedSubjects, existingGrades),
    }),
    [student, termLabel, failedSubjects, existingGrades, variant]
  );

  if (document.rows.length === 0) {
    return null;
  }

  const handlePrint = () => {
    printHtmlDocument(buildRetakeRequestHtml(document));
  };

  const handleDownload = () => {
    const html = buildRetakeRequestHtml(document);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `retake-request-${student.studentId}-${slugifyFilePart(termLabel)}.html`;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="grade-submission-actions grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 touch-manipulation px-2 text-xs sm:h-9 sm:px-2.5 sm:text-sm"
          onClick={handlePrint}
        >
          <Printer />
          Print request
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 touch-manipulation px-2 text-xs sm:h-9 sm:px-2.5 sm:text-sm"
          onClick={handleDownload}
        >
          <Download />
          Download
        </Button>
      </div>
      <p className="text-pretty text-xs text-muted-foreground">
        Print this form and submit it to an administrator. After they confirm, the subject
        will appear on your grade form for the approved term.
      </p>

      <article className="overflow-hidden rounded-xl border border-border bg-white p-4 text-[#1a1617] shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9121f]">
          PASS College
        </p>
        <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight sm:text-2xl">
          {variant === 'leftover' ? 'Request to Take Leftover Subject' : 'Request to Retake Subject'}
        </h2>
        <p className="mt-1 text-pretty text-sm text-[#6b6566]">
          e-Advising System · Submit this form to an administrator
        </p>

        <dl className="mt-5 grid gap-3 text-sm sm:mt-6 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs text-[#6b6566]">Name</dt>
            <dd className="wrap-break-word font-medium">{student.fullName}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-[#6b6566]">Student ID</dt>
            <dd className="font-medium tabular-nums">{student.studentId}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-[#6b6566]">Course</dt>
            <dd className="wrap-break-word font-medium">{student.course}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-[#6b6566]">Current term</dt>
            <dd className="wrap-break-word font-medium">
              Year {student.yearLevel} · {termLabel}
            </dd>
          </div>
        </dl>

        <p className="mt-5 text-pretty text-sm leading-relaxed text-[#3d3839]">
          {variant === 'leftover'
            ? 'I respectfully request permission to take the unfinished subject(s) listed below, which remain pending or incomplete from an earlier term. The administrator will confirm whether each subject may be taken next semester or next year.'
            : 'I respectfully request permission to retake the failed subject(s) listed below. The administrator will confirm whether each subject may be taken next semester or next year.'}
        </p>

        <div className="mt-5 space-y-2 sm:hidden">
          {document.rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-[#1a1617] bg-[#fafafa] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{row.code}</p>
                  <p className="mt-0.5 text-sm leading-snug text-[#6b6566]">{row.description}</p>
                  <p className="mt-1 text-xs text-[#6b6566]">
                    {row.units} units · {variant === 'leftover' ? 'From' : 'Failed in'}{' '}
                    {row.failedTerm} · Grade {row.grade}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#6b6566]">☐ Next semester &nbsp; ☐ Next year</p>
            </div>
          ))}
        </div>

        <div className="mt-6 hidden overflow-x-auto sm:block">
          <SubjectsTable document={document} />
        </div>
      </article>
    </div>
  );
}
