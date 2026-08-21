'use server';

import { db } from '@/lib/db';
import { parseEvaluationSnapshot } from '@/lib/evaluation';
import { studentScopeWhere } from '@/lib/staff-access';

export type CourseScope = string[] | null;

export async function getFullEvaluationReport(courseCodes: CourseScope = null) {
  const data = await db.evaluationResult.findMany({
    where:
      courseCodes === null
        ? undefined
        : { student: { course: { in: courseCodes } } },
    select: {
      status: true,
      summary: true,
      yearLevel: true,
      semester: true,
      submittedAt: true,
      submittedBy: true,
      approvedAt: true,
      approvedBy: true,
      updatedAt: true,
      student: {
        select: {
          id: true,
          studentId: true,
          fullName: true,
          course: true,
          yearLevel: true,
        },
      },
      curriculum: {
        select: {
          programCode: true,
          batchLabel: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  return data.map((record) => {
    const snapshot = record.summary ? parseEvaluationSnapshot(record.summary) : null;

    return {
      studentRecordId: record.student.id,
      studentId: record.student.studentId,
      fullName: record.student.fullName,
      course: record.student.course,
      yearLevel: record.yearLevel,
      semester: record.semester,
      curriculum: `${record.curriculum.programCode} - ${record.curriculum.batchLabel}`,
      evaluationStatus: record.status,
      submittedBy: record.submittedBy,
      completedByName: snapshot?.completedByName ?? null,
      completedByPosition: snapshot?.completedByPosition ?? null,
      remarks: snapshot?.remarks ?? null,
      approvedByName: snapshot?.approvedByName ?? null,
      approvedByPosition: snapshot?.approvedByPosition ?? null,
      passedCount: snapshot?.counts.passed ?? 0,
      eligibleCount: snapshot?.counts.eligible ?? 0,
      blockedCount: snapshot?.counts.blocked ?? 0,
      completedAt: (record.approvedAt ?? record.submittedAt ?? record.updatedAt).toISOString(),
    };
  });
}

export async function getCurriculumReport(courseCodes: CourseScope = null) {
  const curriculums = await db.curriculum.findMany({
    where:
      courseCodes === null ? undefined : { programCode: { in: courseCodes } },
    orderBy: [{ programCode: 'asc' }, { batchYear: 'desc' }],
    include: {
      _count: {
        select: {
          subjects: true,
          students: true,
        },
      },
      subjects: {
        select: {
          semester: true,
          yearLevel: true,
        },
      },
    },
  });

  return curriculums.map((item) => {
    const semesterBreakdown = item.subjects.reduce<Record<string, number>>((acc, subject) => {
      const key = `Year ${subject.yearLevel} • ${subject.semester}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      id: item.id,
      programCode: item.programCode,
      title: item.title,
      batchLabel: item.batchLabel,
      batchYear: item.batchYear,
      versionTag: item.versionTag,
      isActive: item.isActive,
      subjectsCount: item._count.subjects,
      studentsCount: item._count.students,
      semesterBreakdown,
    };
  });
}

export async function getAcademicProgressReport(courseCodes: CourseScope = null) {
  const students = await db.student.findMany({
    where: { curriculumId: { not: null }, ...studentScopeWhere(courseCodes) },
    select: {
      id: true,
      studentId: true,
      fullName: true,
      course: true,
      yearLevel: true,
      curriculum: true,
      curriculumId: true,
      currentSemester: true,
      grades: {
        select: {
          status: true,
          curriculumSubject: {
            select: { curriculumId: true },
          },
        },
      },
      evaluations: {
        select: { status: true, yearLevel: true, semester: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
    orderBy: { fullName: 'asc' },
  });

  const curriculumSubjectCounts = await db.curriculumSubject.groupBy({
    by: ['curriculumId'],
    _count: true,
  });

  const totalByCurriculum = new Map(
    curriculumSubjectCounts.map((row) => [row.curriculumId, row._count])
  );

  return students.map((student) => {
    const curriculumId = student.curriculumId!;
    const relevantGrades = student.grades.filter(
      (g) => g.curriculumSubject.curriculumId === curriculumId
    );
    const passed = relevantGrades.filter((g) => g.status === 'PASSED').length;
    const failed = relevantGrades.filter((g) => g.status === 'FAILED').length;
    const totalSubjects = totalByCurriculum.get(curriculumId) || 0;
    const remaining = Math.max(totalSubjects - passed, 0);
    const progressPercentage =
      totalSubjects > 0 ? Math.round((passed / totalSubjects) * 100) : 0;

    const currentTermEvaluation = student.evaluations.find(
      (item) => item.yearLevel === student.yearLevel && item.semester === student.currentSemester
    );

    return {
      studentRecordId: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      course: student.course,
      yearLevel: student.yearLevel,
      curriculum: student.curriculum,
      passed,
      failed,
      remaining,
      totalSubjects,
      progressPercentage,
      latestEvaluationStatus: currentTermEvaluation?.status || 'PENDING',
    };
  });
}
