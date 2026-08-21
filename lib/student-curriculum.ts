import { db } from "@/lib/db";

export type CurriculumAssignment = {
  id: string;
  programCode: string;
  batchLabel: string;
  versionTag: string;
};

export function formatCurriculumAssignmentLabel(
  curriculum: CurriculumAssignment
) {
  return `${curriculum.programCode} - ${curriculum.batchLabel} (${curriculum.versionTag})`;
}

export function studentCurriculumFields(curriculum: CurriculumAssignment) {
  return {
    course: curriculum.programCode.toUpperCase(),
    curriculum: formatCurriculumAssignmentLabel(curriculum),
    curriculumId: curriculum.id,
  };
}

export type CurriculumShiftSummary = {
  copiedGrades: number;
  remappedRetakes: number;
  droppedRetakes: number;
};

type ShiftTransaction = Parameters<
  Extract<Parameters<typeof db.$transaction>[0], (tx: never) => unknown>
>[0];

type ShiftSource = {
  curriculumId: string | null;
  programCode: string;
  curriculumLabel: string;
};

export async function applyStudentCurriculumShift(
  tx: ShiftTransaction,
  params: {
    studentId: string;
    from: ShiftSource;
    toCurriculum: CurriculumAssignment;
  }
): Promise<CurriculumShiftSummary> {
  const { studentId, from, toCurriculum } = params;

  const targetOfferings = await tx.curriculumSubject.findMany({
    where: { curriculumId: toCurriculum.id },
    select: { id: true, subjectId: true },
  });

  const targetOfferingBySubjectId = new Map(
    targetOfferings.map((offering) => [offering.subjectId, offering.id])
  );
  const targetOfferingIds = new Set(targetOfferings.map((offering) => offering.id));

  const grades = await tx.studentGrade.findMany({
    where: { studentId },
    select: {
      id: true,
      grade: true,
      status: true,
      remarks: true,
      curriculumSubjectId: true,
      curriculumSubject: { select: { subjectId: true } },
    },
  });

  const occupiedGradeOfferings = new Set(
    grades
      .filter((grade) => targetOfferingIds.has(grade.curriculumSubjectId))
      .map((grade) => grade.curriculumSubjectId)
  );

  let copiedGrades = 0;

  for (const grade of grades) {
    const hasRecord = grade.grade != null || grade.status !== "PENDING";
    if (!hasRecord) {
      continue;
    }

    const targetOfferingId = targetOfferingBySubjectId.get(
      grade.curriculumSubject.subjectId
    );

    if (!targetOfferingId || grade.curriculumSubjectId === targetOfferingId) {
      continue;
    }

    if (occupiedGradeOfferings.has(targetOfferingId)) {
      continue;
    }

    await tx.studentGrade.create({
      data: {
        studentId,
        curriculumSubjectId: targetOfferingId,
        grade: grade.grade,
        status: grade.status,
        remarks: grade.remarks,
      },
    });
    occupiedGradeOfferings.add(targetOfferingId);
    copiedGrades += 1;
  }

  const retakes = await tx.subjectRetake.findMany({
    where: { studentId },
    select: {
      id: true,
      curriculumSubjectId: true,
      curriculumSubject: { select: { subjectId: true } },
    },
  });

  const occupiedRetakeOfferings = new Set(
    retakes
      .filter((retake) => targetOfferingIds.has(retake.curriculumSubjectId))
      .map((retake) => retake.curriculumSubjectId)
  );

  let remappedRetakes = 0;
  let droppedRetakes = 0;

  for (const retake of retakes) {
    const targetOfferingId = targetOfferingBySubjectId.get(
      retake.curriculumSubject.subjectId
    );

    if (!targetOfferingId) {
      await tx.subjectRetake.delete({ where: { id: retake.id } });
      droppedRetakes += 1;
      continue;
    }

    if (retake.curriculumSubjectId === targetOfferingId) {
      continue;
    }

    if (occupiedRetakeOfferings.has(targetOfferingId)) {
      await tx.subjectRetake.delete({ where: { id: retake.id } });
      droppedRetakes += 1;
      continue;
    }

    await tx.subjectRetake.update({
      where: { id: retake.id },
      data: { curriculumSubjectId: targetOfferingId },
    });
    occupiedRetakeOfferings.add(targetOfferingId);
    remappedRetakes += 1;
  }

  if (from.curriculumId && from.curriculumId !== toCurriculum.id) {
    await tx.studentCurriculumShift.create({
      data: {
        studentId,
        fromCurriculumId: from.curriculumId,
        toCurriculumId: toCurriculum.id,
        fromProgramCode: from.programCode,
        fromCurriculumLabel: from.curriculumLabel,
        toProgramCode: toCurriculum.programCode,
        toCurriculumLabel: formatCurriculumAssignmentLabel(toCurriculum),
        copiedGrades,
      },
    });
  }

  return { copiedGrades, remappedRetakes, droppedRetakes };
}
