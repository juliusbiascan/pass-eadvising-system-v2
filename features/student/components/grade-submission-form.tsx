'use client';

import { useMemo, useState, useTransition } from 'react';
import { Download, Mail, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';

import { emailGradeSubmissionToSelf } from '../actions/email-grade-submission';
import {
  buildGradeSubmissionHtml,
  buildGradeSubmissionRows,
  slugifyFilePart,
  type GradeSubmissionDocument,
} from '../lib/grade-submission-document';
import { printHtmlDocument } from '../lib/print-html-document';
import type { CurriculumItem, ExistingGrade, StudentPortalStudent } from '../lib/types';

interface GradeSubmissionFormProps {
  student: StudentPortalStudent;
  termLabel: string;
  offerings: CurriculumItem[];
  existingGrades: Record<string, ExistingGrade>;
}

function SignatureBlock({
  printedName,
  role,
}: {
  printedName?: string;
  role: string;
}) {
  return (
    <div className="flex-1 text-center">
      <div className="mb-1 flex h-12 items-end justify-center border-b border-[#1a1617] sm:h-14">
        {printedName ? (
          <p className="wrap-break-word px-2 pb-1 text-sm font-semibold uppercase tracking-wide">
            {printedName}
          </p>
        ) : (
          <p className="px-2 pb-1 text-sm">&nbsp;</p>
        )}
      </div>
      <p className="text-[11px] text-[#6b6566]">Signature over printed name</p>
      <p className="mt-1 text-xs text-[#6b6566]">{role}</p>
    </div>
  );
}

function GradesTable({ document }: { document: GradeSubmissionDocument }) {
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
          <th className="w-14 border border-[#1a1617] bg-[#f3f3f4] px-1 py-2 text-center font-semibold sm:w-16 sm:px-3">
            Units
          </th>
          <th className="w-16 border border-[#1a1617] bg-[#f3f3f4] px-1 py-2 text-center font-semibold sm:w-20 sm:px-3">
            Grade
          </th>
        </tr>
      </thead>
      <tbody>
        {document.rows.length === 0 ? (
          <tr>
            <td colSpan={4} className="border border-[#1a1617] px-3 py-6 text-center text-[#6b6566]">
              No subjects for this term
            </td>
          </tr>
        ) : (
          document.rows.map((row) => (
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
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export function GradeSubmissionForm({
  student,
  termLabel,
  offerings,
  existingGrades,
}: GradeSubmissionFormProps) {
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isEmailing, startEmailTransition] = useTransition();

  const document = useMemo<GradeSubmissionDocument>(
    () => ({
      studentName: student.fullName,
      studentId: student.studentId,
      course: student.course,
      yearLevel: student.yearLevel,
      termLabel,
      rows: buildGradeSubmissionRows(offerings, existingGrades),
    }),
    [student, termLabel, offerings, existingGrades]
  );

  const handlePrint = () => {
    printHtmlDocument(buildGradeSubmissionHtml(document));
  };

  const handleDownload = () => {
    const html = buildGradeSubmissionHtml(document);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    const termSlug = slugifyFilePart(termLabel);
    link.href = url;
    link.download = `grade-submission-${student.studentId}-${termSlug}.html`;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    setError('');
    setSuccess('');
    startEmailTransition(() => {
      emailGradeSubmissionToSelf().then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }
        setSuccess(result?.success || 'Sent to your email');
      });
    });
  };

  return (
    <div className="min-w-0 space-y-4">
      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="grade-submission-actions grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 touch-manipulation px-2 text-xs sm:h-9 sm:px-2.5 sm:text-sm"
          onClick={handlePrint}
        >
          <Printer />
          Print
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
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 touch-manipulation px-2 text-xs sm:h-9 sm:px-2.5 sm:text-sm"
          onClick={handleEmail}
          disabled={isEmailing || !student.email}
        >
          <Mail />
          {isEmailing ? 'Sending...' : 'Email me'}
        </Button>
      </div>
      <p className="text-pretty text-xs text-muted-foreground">
        {student.email
          ? `Email sends a copy of this form only to ${student.email}.`
          : 'No email is linked to your account, so the form cannot be emailed.'}
      </p>

      <article className="overflow-hidden rounded-xl border border-border bg-white p-4 text-[#1a1617] shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9121f]">
          PASS College
        </p>
        <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight sm:text-2xl">
          Grade Submission Form
        </h2>
        <p className="mt-1 text-pretty text-sm text-[#6b6566]">
          e-Advising System · For student and administrator confirmation
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
            <dt className="text-xs text-[#6b6566]">Year / Term</dt>
            <dd className="wrap-break-word font-medium">
              Year {student.yearLevel} · {termLabel}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          {document.rows.length === 0 ? (
            <p className="rounded-lg border border-[#1a1617] px-3 py-8 text-center text-sm font-medium text-[#1a1617]">
              No subjects for this term
            </p>
          ) : (
            <>
              <div className="space-y-2 sm:hidden">
                {document.rows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-lg border border-[#1a1617] bg-[#fafafa] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{row.code}</p>
                        <p className="mt-0.5 text-sm leading-snug text-[#6b6566]">{row.description}</p>
                        <p className="mt-1 text-xs text-[#6b6566] tabular-nums">{row.units} units</p>
                      </div>
                      <p className="shrink-0 text-lg font-semibold tabular-nums">{row.grade}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <GradesTable document={document} />
              </div>
            </>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-10 sm:mt-16 sm:flex-row sm:gap-16">
          <SignatureBlock printedName={student.fullName} role="Student" />
          <SignatureBlock role="Administrator" />
        </div>
      </article>
    </div>
  );
}
