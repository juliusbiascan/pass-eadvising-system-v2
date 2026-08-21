import { db } from '@/lib/db';
import { parseEvaluationSnapshot } from '@/lib/evaluation';
import { formatSemesterLabel } from '@/lib/semester-terms';
import type { EvaluationStatus, SemesterTerm } from '@/app/generated/prisma/enums';

export type RecordSubjectOffering = {
  id: string;
  subjectId: string;
  code: string;
  description: string;
  units: number;
  yearLevel: number;
  semester: SemesterTerm;
  displayOrder: number;
};

export type RecordTermGroup = {
  key: string;
  yearLevel: number;
  semester: SemesterTerm;
  label: string;
  subjects: RecordSubjectOffering[];
  evaluationStatus: EvaluationStatus | null;
  evaluationSubmittedAt: string | null;
  evaluationSubmittedBy: string | null;
  evaluationCompletedByName: string | null;
  evaluationCompletedByPosition: string | null;
  evaluationRemarks: string | null;
  evaluationApprovedAt: string | null;
  evaluationApprovedByName: string | null;
  evaluationApprovedByPosition: string | null;
};

export type CurriculumRecordSummary = {
  totalSubjects: number;
  withGrade: number;
  passed: number;
  failed: number;
  pending: number;
};

export type PriorCurriculumRecord = {
  curriculumId: string;
  programCode: string;
  title: string;
  batchLabel: string;
  batchYear: number;
  label: string;
  shiftedAt: string | null;
  terms: RecordTermGroup[];
  gradeSummary: CurriculumRecordSummary;
};

export type StudentAcademicRecord = {
  student: {
    id: string;
    studentId: string;
    fullName: string;
    email: string | null;
    course: string;
    yearLevel: number;
    currentSemester: SemesterTerm;
    curriculum: string;
    curriculumId: string | null;
  };
  curriculum: {
    id: string;
    programCode: string;
    title: string;
    batchLabel: string;
    batchYear: number;
  } | null;
  terms: RecordTermGroup[];
  existingGrades: Record<string, { grade?: string; status?: string }>;
  gradeSummary: CurriculumRecordSummary;
  priorCurriculums: PriorCurriculumRecord[];
};

type GradeRow = {
  curriculumSubjectId: string;
  curriculumId: string;
  grade: string | null;
  status: string;
};

type EvaluationRow = {
  curriculumId: string;
  yearLevel: number;
  semester: SemesterTerm;
  status: EvaluationStatus;
  submittedAt: Date | null;
  submittedBy: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  summary: string | null;
};

function emptySummary(): CurriculumRecordSummary {
  return {
    totalSubjects: 0,
    withGrade: 0,
    passed: 0,
    failed: 0,
    pending: 0,
  };
}

function summarizeGrades(
  grades: GradeRow[],
  offeringIds: Set<string>
): CurriculumRecordSummary {
  const summary = emptySummary();
  summary.totalSubjects = offeringIds.size;

  for (const grade of grades) {
    if (!offeringIds.has(grade.curriculumSubjectId)) {
      continue;
    }

    if (grade.grade) summary.withGrade += 1;
    if (grade.status === 'PASSED') summary.passed += 1;
    else if (grade.status === 'FAILED') summary.failed += 1;
    else if (grade.status === 'PENDING' || grade.status === 'INCOMPLETE') {
      summary.pending += 1;
    }
  }

  return summary;
}

function buildTerms(
  offerings: Array<{
    id: string;
    subjectId: string;
    code: string;
    description: string;
    units: number;
    yearLevel: number;
    semester: SemesterTerm;
    displayOrder: number;
  }>,
  evaluations: EvaluationRow[],
  curriculumId: string
): RecordTermGroup[] {
  const evaluationByTerm = new Map(
    evaluations
      .filter((evaluation) => evaluation.curriculumId === curriculumId)
      .map((evaluation) => [`${evaluation.yearLevel}-${evaluation.semester}`, evaluation])
  );

  const groupMap = new Map<string, RecordTermGroup>();

  for (const offering of offerings) {
    const key = `${offering.yearLevel}-${offering.semester}`;
    let group = groupMap.get(key);
    if (!group) {
      const evalRecord = evaluationByTerm.get(key);
      const snapshot = evalRecord?.summary
        ? parseEvaluationSnapshot(evalRecord.summary)
        : null;
      group = {
        key,
        yearLevel: offering.yearLevel,
        semester: offering.semester,
        label: `Year ${offering.yearLevel} • ${formatSemesterLabel(offering.semester)}`,
        subjects: [],
        evaluationStatus: evalRecord?.status ?? null,
        evaluationSubmittedAt: evalRecord?.submittedAt?.toISOString() ?? null,
        evaluationSubmittedBy: evalRecord?.submittedBy ?? null,
        evaluationCompletedByName: snapshot?.completedByName ?? null,
        evaluationCompletedByPosition: snapshot?.completedByPosition ?? null,
        evaluationRemarks: snapshot?.remarks ?? null,
        evaluationApprovedAt:
          evalRecord?.approvedAt?.toISOString() ?? snapshot?.approvedAt ?? null,
        evaluationApprovedByName: snapshot?.approvedByName ?? null,
        evaluationApprovedByPosition: snapshot?.approvedByPosition ?? null,
      };
      groupMap.set(key, group);
    }

    group.subjects.push({
      id: offering.id,
      subjectId: offering.subjectId,
      code: offering.code,
      description: offering.description,
      units: offering.units,
      yearLevel: offering.yearLevel,
      semester: offering.semester,
      displayOrder: offering.displayOrder,
    });
  }

  return Array.from(groupMap.values());
}

export async function getStudentAcademicRecord(
  studentId: string
): Promise<StudentAcademicRecord | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      studentId: true,
      fullName: true,
      email: true,
      course: true,
      yearLevel: true,
      currentSemester: true,
      curriculum: true,
      curriculumId: true,
      grades: {
        select: {
          curriculumSubjectId: true,
          grade: true,
          status: true,
          curriculumSubject: {
            select: { curriculumId: true },
          },
        },
      },
      evaluations: {
        select: {
          curriculumId: true,
          yearLevel: true,
          semester: true,
          status: true,
          submittedAt: true,
          submittedBy: true,
          approvedAt: true,
          approvedBy: true,
          summary: true,
        },
      },
      curriculumShifts: {
        orderBy: { createdAt: 'desc' },
        select: {
          fromCurriculumId: true,
          fromProgramCode: true,
          fromCurriculumLabel: true,
          createdAt: true,
        },
      },
      curriculumRef: {
        select: {
          id: true,
          programCode: true,
          title: true,
          batchLabel: true,
          batchYear: true,
        },
      },
    },
  });

  if (!student) return null;

  const grades: GradeRow[] = student.grades.map((grade) => ({
    curriculumSubjectId: grade.curriculumSubjectId,
    curriculumId: grade.curriculumSubject.curriculumId,
    grade: grade.grade ? String(grade.grade) : null,
    status: grade.status,
  }));

  const existingGrades: Record<string, { grade?: string; status?: string }> = {};
  for (const grade of grades) {
    existingGrades[grade.curriculumSubjectId] = {
      grade: grade.grade ?? undefined,
      status: grade.status,
    };
  }

  const priorCurriculumIds = new Set<string>();
  const shiftedAtByCurriculum = new Map<string, string>();

  for (const shift of student.curriculumShifts) {
    if (shift.fromCurriculumId && shift.fromCurriculumId !== student.curriculumId) {
      priorCurriculumIds.add(shift.fromCurriculumId);
      if (!shiftedAtByCurriculum.has(shift.fromCurriculumId)) {
        shiftedAtByCurriculum.set(
          shift.fromCurriculumId,
          shift.createdAt.toISOString()
        );
      }
    }
  }

  for (const evaluation of student.evaluations) {
    if (evaluation.curriculumId !== student.curriculumId) {
      priorCurriculumIds.add(evaluation.curriculumId);
    }
  }

  for (const grade of grades) {
    if (grade.curriculumId !== student.curriculumId) {
      priorCurriculumIds.add(grade.curriculumId);
    }
  }

  const curriculumIds = [
    ...(student.curriculumId ? [student.curriculumId] : []),
    ...priorCurriculumIds,
  ];

  const offerings =
    curriculumIds.length > 0
      ? await db.curriculumSubject.findMany({
          where: { curriculumId: { in: curriculumIds } },
          include: {
            subject: {
              select: { id: true, code: true, description: true, units: true },
            },
            curriculum: {
              select: {
                id: true,
                programCode: true,
                title: true,
                batchLabel: true,
                batchYear: true,
              },
            },
          },
          orderBy: [
            { yearLevel: 'asc' },
            { semester: 'asc' },
            { displayOrder: 'asc' },
          ],
        })
      : [];

  const offeringsByCurriculum = new Map<string, typeof offerings>();
  for (const offering of offerings) {
    const current = offeringsByCurriculum.get(offering.curriculumId) ?? [];
    current.push(offering);
    offeringsByCurriculum.set(offering.curriculumId, current);
  }

  const mapOfferings = (curriculumId: string) =>
    (offeringsByCurriculum.get(curriculumId) ?? []).map((offering) => ({
      id: offering.id,
      subjectId: offering.subject.id,
      code: offering.subject.code,
      description: offering.subject.description,
      units: offering.subject.units,
      yearLevel: offering.yearLevel,
      semester: offering.semester,
      displayOrder: offering.displayOrder,
    }));

  let terms: RecordTermGroup[] = [];
  let gradeSummary = emptySummary();

  if (student.curriculumId) {
    const currentOfferings = mapOfferings(student.curriculumId);
    terms = buildTerms(currentOfferings, student.evaluations, student.curriculumId);
    gradeSummary = summarizeGrades(
      grades,
      new Set(currentOfferings.map((offering) => offering.id))
    );
  }

  const missingPriorIds = [...priorCurriculumIds].filter(
    (id) => !offeringsByCurriculum.has(id)
  );
  const missingCurriculums =
    missingPriorIds.length > 0
      ? await db.curriculum.findMany({
          where: { id: { in: missingPriorIds } },
          select: {
            id: true,
            programCode: true,
            title: true,
            batchLabel: true,
            batchYear: true,
          },
        })
      : [];
  const curriculumById = new Map(
    [
      ...offerings.map((offering) => offering.curriculum),
      ...missingCurriculums,
    ].map((curriculum) => [curriculum.id, curriculum])
  );

  const priorCurriculums: PriorCurriculumRecord[] = [...priorCurriculumIds]
    .map((curriculumId) => {
      const curriculum = curriculumById.get(curriculumId);
      const shift = student.curriculumShifts.find(
        (item) => item.fromCurriculumId === curriculumId
      );
      const priorOfferings = mapOfferings(curriculumId);
      const priorTerms = buildTerms(
        priorOfferings,
        student.evaluations,
        curriculumId
      );

      return {
        curriculumId,
        programCode: curriculum?.programCode ?? shift?.fromProgramCode ?? 'Unknown',
        title: curriculum?.title ?? '',
        batchLabel: curriculum?.batchLabel ?? '',
        batchYear: curriculum?.batchYear ?? 0,
        label:
          curriculum
            ? `${curriculum.programCode} - ${curriculum.batchLabel}`
            : (shift?.fromCurriculumLabel ?? 'Previous curriculum'),
        shiftedAt: shiftedAtByCurriculum.get(curriculumId) ?? null,
        terms: priorTerms,
        gradeSummary: summarizeGrades(
          grades,
          new Set(priorOfferings.map((offering) => offering.id))
        ),
      };
    })
    .sort((a, b) => {
      const aTime = a.shiftedAt ? new Date(a.shiftedAt).getTime() : 0;
      const bTime = b.shiftedAt ? new Date(b.shiftedAt).getTime() : 0;
      return bTime - aTime;
    });

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      email: student.email,
      course: student.course,
      yearLevel: student.yearLevel,
      currentSemester: student.currentSemester,
      curriculum: student.curriculum,
      curriculumId: student.curriculumId,
    },
    curriculum: student.curriculumRef,
    terms,
    existingGrades,
    gradeSummary,
    priorCurriculums,
  };
}

export type StudentRecordListItem = {
  id: string;
  studentId: string;
  fullName: string;
  course: string;
  yearLevel: number;
  currentSemester: string;
  curriculum: string;
  curriculumId: string | null;
  gradesEntered: number;
  totalSubjects: number;
  priorCurriculumCount: number;
};

export async function listStudentRecordSummaries(
  courseCodes: string[] | null = null
): Promise<StudentRecordListItem[]> {
  const students = await db.student.findMany({
    where: courseCodes === null ? undefined : { course: { in: courseCodes } },
    orderBy: { fullName: 'asc' },
    select: {
      id: true,
      studentId: true,
      fullName: true,
      course: true,
      yearLevel: true,
      currentSemester: true,
      curriculum: true,
      curriculumId: true,
      grades: {
        select: {
          curriculumSubject: {
            select: { curriculumId: true },
          },
        },
      },
      evaluations: {
        select: { curriculumId: true },
      },
      curriculumShifts: {
        select: { fromCurriculumId: true },
      },
    },
  });

  const curriculumIds = [
    ...new Set(students.map((s) => s.curriculumId).filter((id): id is string => !!id)),
  ];

  const subjectCounts =
    curriculumIds.length > 0
      ? await db.curriculumSubject.groupBy({
          by: ['curriculumId'],
          where: { curriculumId: { in: curriculumIds } },
          _count: { id: true },
        })
      : [];

  const countByCurriculum = new Map(
    subjectCounts.map((row) => [row.curriculumId, row._count.id])
  );

  return students.map((student) => {
    const currentGrades = student.grades.filter(
      (grade) => grade.curriculumSubject.curriculumId === student.curriculumId
    ).length;

    const priorIds = new Set<string>();
    for (const shift of student.curriculumShifts) {
      if (shift.fromCurriculumId && shift.fromCurriculumId !== student.curriculumId) {
        priorIds.add(shift.fromCurriculumId);
      }
    }
    for (const evaluation of student.evaluations) {
      if (evaluation.curriculumId !== student.curriculumId) {
        priorIds.add(evaluation.curriculumId);
      }
    }
    for (const grade of student.grades) {
      if (grade.curriculumSubject.curriculumId !== student.curriculumId) {
        priorIds.add(grade.curriculumSubject.curriculumId);
      }
    }

    return {
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      course: student.course,
      yearLevel: student.yearLevel,
      currentSemester: student.currentSemester,
      curriculum: student.curriculum,
      curriculumId: student.curriculumId,
      gradesEntered: currentGrades,
      totalSubjects: student.curriculumId
        ? (countByCurriculum.get(student.curriculumId) ?? 0)
        : 0,
      priorCurriculumCount: priorIds.size,
    };
  });
}
