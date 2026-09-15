import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowRightLeft, BookOpen, FolderOpen, GraduationCap, Pencil } from 'lucide-react';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import GradeForm from './grade-form';
import { evaluateStudent } from '@/actions/curriculum';
import { Badge } from '@/components/ui/badge';
import { EvaluationStatusBadge } from '@/components/status-badge';
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
import { resolveEvaluationDisplay } from '@/lib/evaluation';
import { getTermEvaluationRecord, listStudentEvaluations } from '@/lib/evaluation-service';
import { canAccessStudentCourse, getDashboardAccess } from '@/lib/staff-access';
import { getMaxYearLevel } from '@/lib/student-progression';
import { formatTermRef, listConfirmedRetakeOfferings } from '@/lib/subject-retakes';
import { EvaluationStatusPanel } from '@/features/dashboard/components/evaluation-status-panel';
import EvaluationHistory from './evaluation-history';
import EvaluationResults from './evaluation-results';

export const metadata: Metadata = {
  title: 'Student Evaluation',
  description: 'Input grades and run evaluation for a student',
};

type EvaluationResult =
  | { error: string }
  | {
      eligible: Array<{ id: string; code: string; description: string; percent?: number }>;
      blocked: Array<{ id: string; code: string; description: string; percent: number }>;
      passed: Array<{ id: string; code: string; description: string }>;
      nextEnrollmentTerm?: { yearLevel: number; semester: string } | null;
    };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentEvaluationPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/dashboard');

  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      grades: true,
      curriculumRef: {
        select: {
          programCode: true,
          title: true,
          batchLabel: true,
          batchYear: true,
        },
      },
    },
  });
  if (!student) notFound();

  const access = await getDashboardAccess();
  const isAdmin = session.user.role === 'ADMIN';
  const isHead = session.user.role === 'HEAD';
  const isSelf = session.user.email === student.email;

  if (!isAdmin && !isSelf && !(isHead && access && canAccessStudentCourse(access, student.course))) {
    redirect('/dashboard');
  }

  const isStaff = isAdmin || isHead;
  const curriculumId = student.curriculumId;

  if (!curriculumId) {
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
            {isStaff && (
              <Button asChild variant="outline">
                <Link href="/dashboard/students">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Students
                </Link>
              </Button>
            )}
          </div>
          <Empty className="border border-dashed py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GraduationCap />
              </EmptyMedia>
              <EmptyTitle>No curriculum assigned</EmptyTitle>
              <EmptyDescription>
                Assign a curriculum to this student before entering grades or running
                evaluation.
              </EmptyDescription>
            </EmptyHeader>
            {isAdmin && (
              <EmptyContent>
                <Button asChild>
                  <Link href={`/dashboard/students/${student.id}/shift`}>
                    Shift Curriculum
                  </Link>
                </Button>
              </EmptyContent>
            )}
          </Empty>
        </div>
      </div>
    );
  }

  const currentSemester = student.currentSemester;
  const termKey = {
    studentId: id,
    curriculumId,
    yearLevel: student.yearLevel,
    semester: currentSemester,
  };

  const offerings = await db.curriculumSubject.findMany({
    where: {
      curriculumId,
      yearLevel: student.yearLevel,
      semester: currentSemester,
    },
    include: {
      subject: { select: { id: true, code: true, description: true, units: true } },
    },
    orderBy: [{ displayOrder: 'asc' }],
  });

  const offeringData = offerings.map((o) => ({
    id: o.id,
    subjectId: o.subject?.id ?? '',
    code: o.subject?.code ?? '',
    description: o.subject?.description ?? '',
    units: o.subject?.units,
    semester: o.semester,
  }));

  const existingGrades: { [key: string]: { grade?: string; status?: string } } = {};
  for (const g of student.grades) {
    existingGrades[g.curriculumSubjectId] = {
      grade: g.grade ? String(g.grade) : undefined,
      status: g.status,
    };
  }

  const gradePassSettings = await getGradePassSettings();
  const maxYearLevel = await getMaxYearLevel(curriculumId);

  const [evaluation, storedEvaluation, evaluationHistory, confirmedRetakes] = await Promise.all([
    evaluateStudent({
      studentId: id,
      curriculumId,
      yearLevel: student.yearLevel,
      semester: currentSemester,
    }) as Promise<EvaluationResult>,
    getTermEvaluationRecord(termKey),
    listStudentEvaluations(id),
    listConfirmedRetakeOfferings(id, student.yearLevel, currentSemester),
  ]);

  const retakeOfferingData = confirmedRetakes
    .filter((item) => !offeringData.some((offering) => offering.id === item.id))
    .map((item) => ({
      id: item.id,
      subjectId: item.subjectId,
      code: item.code,
      description: item.description,
      units: item.units,
      semester: item.semester,
    }));
  const gradeFormOfferings = [...retakeOfferingData, ...offeringData];

  const currentTermLabel = formatTermRef(
    { yearLevel: student.yearLevel, semester: currentSemester },
    maxYearLevel
  );
  const nextEnrollmentLabel =
    !('error' in evaluation) && evaluation.nextEnrollmentTerm
      ? formatTermRef(
          {
            yearLevel: evaluation.nextEnrollmentTerm.yearLevel,
            semester: evaluation.nextEnrollmentTerm.semester as typeof currentSemester,
          },
          maxYearLevel
        )
      : null;

  const liveEvaluation =
    'error' in evaluation
      ? { passed: [], eligible: [], blocked: [] }
      : {
          passed: evaluation.passed,
          eligible: evaluation.eligible,
          blocked: evaluation.blocked,
        };

  const displayEvaluation = resolveEvaluationDisplay(storedEvaluation, liveEvaluation);
  const termEvaluationLists = {
    passed: displayEvaluation.passed,
    eligible: displayEvaluation.eligible,
    blocked: displayEvaluation.blocked,
  };
  const curriculum = student.curriculumRef;

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{student.fullName}</h2>
            <p className="text-sm text-muted-foreground">
              {student.studentId} • {student.course} • {currentTermLabel}
            </p>
            {curriculum && (
              <p className="text-sm">
                <span className="font-medium">Curriculum:</span> {curriculum.programCode} —{' '}
                {curriculum.title} ({curriculum.batchLabel}, batch {curriculum.batchYear})
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <EvaluationStatusBadge status={displayEvaluation.status} />
              <Badge variant="outline">{gradeFormOfferings.length} current-term subjects</Badge>
              {student.yearLevel > maxYearLevel ? (
                <Badge
                  variant="outline"
                  className="border-transparent bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                >
                  Makeup term
                </Badge>
              ) : null}
            </div>
          </div>
          {isStaff && (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/students">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Students
                </Link>
              </Button>
              {isAdmin ? (
                <>
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/students/${student.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      Edit Student
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/students/${student.id}/shift`}>
                      <ArrowRightLeft className="h-4 w-4" />
                      Shift Curriculum
                    </Link>
                  </Button>
                </>
              ) : null}
              <Button asChild variant="secondary">
                <Link href={`/dashboard/records/${student.id}`}>
                  <FolderOpen className="h-4 w-4" />
                  Open Record
                </Link>
              </Button>
            </div>
          )}
        </div>

        <EvaluationStatusPanel
          status={displayEvaluation.status}
          submittedAt={displayEvaluation.submittedAt}
          submittedBy={displayEvaluation.submittedBy}
          completedByName={displayEvaluation.completedByName}
          completedByPosition={displayEvaluation.completedByPosition}
          remarks={displayEvaluation.remarks}
          approvedAt={displayEvaluation.approvedAt}
          approvedByName={displayEvaluation.approvedByName}
          approvedByPosition={displayEvaluation.approvedByPosition}
          approvalRemarks={displayEvaluation.approvalRemarks}
          yearLevel={student.yearLevel}
          semester={currentSemester}
          termLabel={currentTermLabel}
          isStoredResult={displayEvaluation.isStoredResult}
        />

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Grade Input</CardTitle>
            <CardDescription>
              Enter grades for {currentTermLabel}. Numeric grades set status automatically
              on save.
              {retakeOfferingData.length > 0
                ? ' Confirmed leftover and retake subjects for this term are included.'
                : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gradeFormOfferings.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpen />
                  </EmptyMedia>
                  <EmptyTitle>No subjects this term</EmptyTitle>
                  <EmptyDescription>
                    {student.yearLevel > maxYearLevel
                      ? `This is a makeup term. Assign leftover or failed subjects under Records → Subjects to take later so they appear here.`
                      : `No subjects were found for ${currentTermLabel} in this curriculum.`}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <GradeForm
                studentId={id}
                curriculumId={curriculumId}
                semester={currentSemester}
                termYearLevel={student.yearLevel}
                termSemester={currentSemester}
                offerings={gradeFormOfferings}
                existingGrades={existingGrades}
                isAdmin={isStaff}
                staffRole={isHead ? 'HEAD' : isAdmin ? 'ADMIN' : undefined}
                gradePassSettings={gradePassSettings}
                evaluationStatus={displayEvaluation.status}
                evaluatedByName={displayEvaluation.completedByName}
                evaluatedByPosition={displayEvaluation.completedByPosition}
                evaluatedAt={displayEvaluation.submittedAt}
                layout="table"
                showHelpText={false}
                studentName={student.fullName}
                studentCourse={student.course}
                termLabel={currentTermLabel}
                nextEnrollmentLabel={nextEnrollmentLabel}
                evaluationReview={termEvaluationLists}
                defaultCompleterName={session.user.name ?? ''}
              />
            )}
          </CardContent>
        </Card>

        <EvaluationResults
          error={'error' in evaluation ? evaluation.error : undefined}
          currentTermLabel={currentTermLabel}
          nextEnrollmentLabel={nextEnrollmentLabel}
          passed={termEvaluationLists.passed}
          eligible={termEvaluationLists.eligible}
          blocked={termEvaluationLists.blocked}
        />

        {isStaff && evaluationHistory.length > 0 && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Evaluation History</CardTitle>
              <CardDescription>
                Completed, evaluated, and pending term evaluations across all year levels and semesters.
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
