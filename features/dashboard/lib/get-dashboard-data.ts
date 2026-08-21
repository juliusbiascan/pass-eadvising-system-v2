'use server';

import { db } from '@/lib/db';
import { studentScopeWhere } from '@/lib/staff-access';
import { formatSemesterLabel } from '@/lib/semester-terms';

export type CourseScope = string[] | null;

function evaluationScopeWhere(courseCodes: CourseScope) {
  if (courseCodes === null) {
    return {};
  }

  return { student: { course: { in: courseCodes } } };
}

function gradeScopeWhere(courseCodes: CourseScope) {
  if (courseCodes === null) {
    return {};
  }

  return { student: { course: { in: courseCodes } } };
}

function curriculumScopeWhere(courseCodes: CourseScope) {
  if (courseCodes === null) {
    return { isActive: true };
  }

  return { isActive: true, programCode: { in: courseCodes } };
}

export async function getDashboardStats(courseCodes: CourseScope = null) {
  const studentWhere = studentScopeWhere(courseCodes);
  const evaluationWhere = evaluationScopeWhere(courseCodes);
  const curriculumWhere = curriculumScopeWhere(courseCodes);

  const [totalStudents, totalCurriculums, totalSubjects, completedEvaluations, pendingEvaluations] =
    await Promise.all([
      db.student.count({ where: studentWhere }),
      db.curriculum.count({ where: curriculumWhere }),
      courseCodes === null
        ? db.subject.count()
        : db.subject.count({
            where: {
              offerings: {
                some: {
                  curriculum: { programCode: { in: courseCodes } },
                },
              },
            },
          }),
      db.evaluationResult.count({
        where: { status: 'COMPLETED', ...evaluationWhere },
      }),
      db.evaluationResult.count({
        where: { status: { in: ['PENDING', 'EVALUATED'] }, ...evaluationWhere },
      }),
    ]);

  return {
    totalStudents,
    totalCurriculums,
    totalSubjects,
    completedEvaluations,
    pendingEvaluations,
  };
}

export async function getEvaluationSummary(courseCodes: CourseScope = null) {
  const data = await db.evaluationResult.findMany({
    where: evaluationScopeWhere(courseCodes),
    select: {
      status: true,
      yearLevel: true,
      semester: true,
      submittedAt: true,
      student: {
        select: {
          studentId: true,
          fullName: true,
          course: true,
        },
      },
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 10,
  });

  return data.map((record) => ({
    studentId: record.student.studentId,
    fullName: record.student.fullName,
    course: record.student.course,
    evaluationStatus: record.status,
    yearLevel: record.yearLevel,
    semester: record.semester,
    completedAt: (record.submittedAt ?? record.updatedAt).toISOString(),
  }));
}

/** Students with a completed evaluation for their current term, per curriculum. */
export async function getCurriculumProgress(courseCodes: CourseScope = null) {
  const curriculums = await db.curriculum.findMany({
    where: curriculumScopeWhere(courseCodes),
    select: {
      id: true,
      programCode: true,
      title: true,
      batchYear: true,
      students: {
        where: studentScopeWhere(courseCodes),
        select: {
          id: true,
          yearLevel: true,
          currentSemester: true,
        },
      },
    },
    orderBy: {
      batchYear: 'desc',
    },
  });

  const curriculumIds = curriculums.map((c) => c.id);
  const completedEvaluations =
    curriculumIds.length > 0
      ? await db.evaluationResult.findMany({
          where: {
            curriculumId: { in: curriculumIds },
            status: 'COMPLETED',
            ...evaluationScopeWhere(courseCodes),
          },
          select: {
            studentId: true,
            curriculumId: true,
            yearLevel: true,
            semester: true,
          },
        })
      : [];

  const completedTermKeys = new Set(
    completedEvaluations.map(
      (e) => `${e.curriculumId}:${e.studentId}:${e.yearLevel}:${e.semester}`
    )
  );

  return curriculums.map((curriculum) => {
    const totalStudents = curriculum.students.length;
    let completedStudents = 0;

    for (const student of curriculum.students) {
      const key = `${curriculum.id}:${student.id}:${student.yearLevel}:${student.currentSemester}`;
      if (completedTermKeys.has(key)) {
        completedStudents += 1;
      }
    }

    const pendingStudents = totalStudents - completedStudents;
    const progressPercentage =
      totalStudents > 0 ? Math.min(100, (completedStudents / totalStudents) * 100) : 0;

    return {
      programCode: curriculum.programCode,
      title: curriculum.title,
      batchYear: curriculum.batchYear,
      totalStudents,
      completedStudents,
      pendingStudents,
      progressPercentage,
      status:
        totalStudents > 0 && completedStudents === totalStudents
          ? 'Completed'
          : 'In Progress',
    };
  });
}

export async function getFailedSubjects(courseCodes: CourseScope = null) {
  const failedGrades = await db.studentGrade.groupBy({
    by: ['curriculumSubjectId'],
    where: {
      status: 'FAILED',
      ...gradeScopeWhere(courseCodes),
    },
    _count: true,
  });

  const failedSubjectsData = await Promise.all(
    failedGrades.map(async (record) => {
      const curriculumSubject = await db.curriculumSubject.findUnique({
        where: { id: record.curriculumSubjectId },
        select: {
          subject: {
            select: {
              code: true,
              description: true,
            },
          },
        },
      });

      const totalEnrolled = await db.studentGrade.count({
        where: {
          curriculumSubjectId: record.curriculumSubjectId,
          ...gradeScopeWhere(courseCodes),
        },
      });

      return {
        subjectCode: curriculumSubject?.subject.code || 'N/A',
        subjectDescription: curriculumSubject?.subject.description || 'Unknown',
        failureCount: record._count,
        totalEnrolled,
        failureRate: totalEnrolled > 0 ? (record._count / totalEnrolled) * 100 : 0,
      };
    })
  );

  return failedSubjectsData.sort((a, b) => b.failureRate - a.failureRate);
}

export async function getEvaluationStatusBreakdown(courseCodes: CourseScope = null) {
  const grouped = await db.evaluationResult.groupBy({
    by: ['status'],
    where: evaluationScopeWhere(courseCodes),
    _count: { id: true },
  });

  const statusLabel: Record<string, string> = {
    PENDING: 'Pending',
    EVALUATED: 'Evaluated',
    COMPLETED: 'Approved',
  };

  return grouped.map((row) => ({
    status: statusLabel[row.status] ?? row.status,
    count: row._count.id,
  }));
}

export async function getStudentsByYearLevel(courseCodes: CourseScope = null) {
  const grouped = await db.student.groupBy({
    by: ['yearLevel'],
    where: studentScopeWhere(courseCodes),
    _count: { id: true },
    orderBy: { yearLevel: 'asc' },
  });

  return grouped.map((row) => ({
    label: `Year ${row.yearLevel}`,
    count: row._count.id,
  }));
}

export async function getStudentsBySemester(courseCodes: CourseScope = null) {
  const grouped = await db.student.groupBy({
    by: ['currentSemester'],
    where: studentScopeWhere(courseCodes),
    _count: { id: true },
  });

  const order = ['FIRST', 'SECOND'] as const;
  return order
    .map((semester) => {
      const row = grouped.find((g) => g.currentSemester === semester);
      return {
        label: formatSemesterLabel(semester),
        count: row?._count.id ?? 0,
      };
    })
    .filter((row) => row.count > 0);
}

export async function getGradeStatusBreakdown(courseCodes: CourseScope = null) {
  const grouped = await db.studentGrade.groupBy({
    by: ['status'],
    where: gradeScopeWhere(courseCodes),
    _count: { id: true },
  });

  const labelMap: Record<string, string> = {
    PASSED: 'Passed',
    FAILED: 'Failed',
    INCOMPLETE: 'Incomplete',
    PENDING: 'Pending',
  };

  return grouped.map((row) => ({
    status: labelMap[row.status] ?? row.status,
    count: row._count.id,
  }));
}
