import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ClipboardList, GraduationCap } from 'lucide-react';

import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import {
  GRADE_STATUS_BADGE_CLASS,
  RESULT_STATUS_BADGE_CLASS,
} from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { getGradePassSettings } from '@/lib/grade-settings';
import { listFailedSubjectsForRetake } from '@/lib/subject-retakes';
import { formatTermRef } from '@/lib/subject-retake-helpers';
import { getStudentAcademicRecord } from '@/features/dashboard/lib/get-student-academic-record';
import { canAccessStudentCourse, getDashboardAccess } from '@/lib/staff-access';
import EvaluationHistory from '@/app/dashboard/students/[id]/evaluate/evaluation-history';
import { listStudentEvaluations } from '@/lib/evaluation-service';
import { ConfirmRetakesPanel } from '@/features/dashboard/components/confirm-retakes-panel';

import StudentRecordByTerm from './student-record-by-term';
import RecordCurriculumTabs from './record-curriculum-tabs';

export const metadata: Metadata = {
  title: 'Student Academic Record',
  description: 'Full curriculum grades and evaluations by year level and semester',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentRecordPage({ params }: PageProps) {
  const [access, session] = await Promise.all([getDashboardAccess(), auth()]);
  if (!access) {
    redirect('/auth/login');
  }

  const { id } = await params;
  const [record, gradePassSettings, evaluationHistory, failedRetakes] =
    await Promise.all([
      getStudentAcademicRecord(id),
      getGradePassSettings(),
      listStudentEvaluations(id),
      listFailedSubjectsForRetake(id),
    ]);

  if (!record) notFound();

  if (!canAccessStudentCourse(access, record.student.course)) {
    redirect('/dashboard/records');
  }

  const { student, curriculum, terms, existingGrades, gradeSummary, priorCurriculums, maxYearLevel } =
    record;
  const currentTermKey = `${student.yearLevel}-${student.currentSemester}`;
  const currentTermLabel = formatTermRef(
    { yearLevel: student.yearLevel, semester: student.currentSemester },
    maxYearLevel
  );
  const currentTerm = terms.find((term) => term.key === currentTermKey);
  const currentTermClosed = currentTerm?.evaluationStatus === 'COMPLETED';

  if (!student.curriculumId || !curriculum) {
    return (
      <div className="flex-col md:flex">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">{student.fullName}</h2>
              <p className="text-sm text-muted-foreground">
                {student.studentId} • {student.course}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/records">
                <ArrowLeft className="h-4 w-4" />
                Back to Records
              </Link>
            </Button>
          </div>
          <Empty className="border border-dashed py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GraduationCap />
              </EmptyMedia>
              <EmptyTitle>No curriculum assigned</EmptyTitle>
              <EmptyDescription>
                Assign a curriculum to this student before managing their academic record.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/dashboard/students">Go to Students</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{student.fullName}</h2>
            <p className="text-sm text-muted-foreground">
              {student.studentId} • {student.course} • Current: {currentTermLabel}
            </p>
            <p className="text-sm">
              <span className="font-medium">Curriculum:</span> {curriculum.programCode} —{' '}
              {curriculum.title} ({curriculum.batchLabel}, batch {curriculum.batchYear})
            </p>
            {priorCurriculums.length > 0 && (
              <p className="text-sm text-muted-foreground">
                This student shifted from{' '}
                {priorCurriculums.map((item) => item.programCode).join(', ')}. Prior
                course records are kept below.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={RESULT_STATUS_BADGE_CLASS.passed}>
                {gradeSummary.passed} passed
              </Badge>
              <Badge variant="outline" className={GRADE_STATUS_BADGE_CLASS.FAILED}>
                {gradeSummary.failed} failed
              </Badge>
              <Badge variant="outline" className={GRADE_STATUS_BADGE_CLASS.INCOMPLETE}>
                {gradeSummary.pending} pending / incomplete
              </Badge>
              <Badge variant="outline" className={RESULT_STATUS_BADGE_CLASS.eligible}>
                {gradeSummary.withGrade} graded • {gradeSummary.totalSubjects} subjects
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/records">
                <ArrowLeft className="h-4 w-4" />
                Back to Records
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/dashboard/students/${student.id}/evaluate`}>
                <ClipboardList className="h-4 w-4" />
                {access.role === 'ADMIN' ? 'Review current-term evaluation' : 'Current-term evaluation'}
              </Link>
            </Button>
          </div>
        </div>

        <RecordCurriculumTabs
          currentLabel={`${curriculum.programCode} ${curriculum.batchLabel}`}
          current={
            <>
              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">Current course record.</strong>{' '}
                Enter or update grades for any year level and semester in this
                curriculum — including transferees who need credit for subjects taken
                before their current term. Saving grades for a term marks that
                term&apos;s evaluation as pending until the department head evaluates
                that term and the registrar or admin approves it. Transferees and
                irregular students can be evaluated and approved on every term,
                not only the current one. Approval of a past term does not
                advance the student&apos;s standing.
              </div>

              <ConfirmRetakesPanel
                studentId={student.id}
                studentYearLevel={student.yearLevel}
                studentSemester={student.currentSemester}
                maxYearLevel={maxYearLevel}
                currentTermClosed={currentTermClosed}
                failedSubjects={failedRetakes}
              />

              <StudentRecordByTerm
                studentId={student.id}
                studentName={student.fullName}
                studentCourse={student.course}
                curriculumId={student.curriculumId!}
                terms={terms}
                existingGrades={existingGrades}
                gradePassSettings={gradePassSettings}
                currentTermKey={currentTermKey}
                defaultCompleterName={session?.user?.name ?? ''}
                staffRole={access.role}
              />
            </>
          }
          prior={priorCurriculums.map((prior) => ({
            id: prior.curriculumId,
            label: prior.programCode,
            content: (
              <>
                <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <strong className="text-foreground">Prior course record.</strong>{' '}
                  {prior.label}
                  {prior.title ? ` — ${prior.title}` : ''}. This is the academic
                  record from before the student shifted. Grades here are kept for
                  history and cannot be edited from the current course.
                  {prior.shiftedAt
                    ? ` Shifted on ${new Intl.DateTimeFormat('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                      }).format(new Date(prior.shiftedAt))}.`
                    : ''}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={RESULT_STATUS_BADGE_CLASS.passed}>
                    {prior.gradeSummary.passed} passed
                  </Badge>
                  <Badge variant="outline" className={GRADE_STATUS_BADGE_CLASS.FAILED}>
                    {prior.gradeSummary.failed} failed
                  </Badge>
                  <Badge
                    variant="outline"
                    className={GRADE_STATUS_BADGE_CLASS.INCOMPLETE}
                  >
                    {prior.gradeSummary.pending} pending / incomplete
                  </Badge>
                  <Badge variant="outline" className={RESULT_STATUS_BADGE_CLASS.eligible}>
                    {prior.gradeSummary.withGrade} graded •{' '}
                    {prior.gradeSummary.totalSubjects} subjects
                  </Badge>
                </div>

                <StudentRecordByTerm
                  studentId={student.id}
                  studentName={student.fullName}
                  studentCourse={prior.programCode}
                  curriculumId={prior.curriculumId}
                  terms={prior.terms}
                  existingGrades={existingGrades}
                  gradePassSettings={gradePassSettings}
                  currentTermKey=""
                  defaultCompleterName=""
                  staffRole={access.role}
                  readOnly
                />
              </>
            ),
          }))}
        />

        {evaluationHistory.length > 0 && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Evaluation History</CardTitle>
              <CardDescription>
                Completed, evaluated, and pending term evaluations across all year levels and
                semesters.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <EvaluationHistory records={evaluationHistory} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
