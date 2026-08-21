export const UNASSIGNED_PROGRAM_CODE = "Not in any curriculum";

export type SubjectProgramCodeGroup<T> = {
  programCode: string;
  items: T[];
};

export function groupSubjectsByProgramCode<T extends { code: string; programCodes: string[] }>(
  subjects: T[]
): SubjectProgramCodeGroup<T>[] {
  const byProgramCode = new Map<string, T[]>();

  for (const subject of subjects) {
    const codes =
      subject.programCodes.length > 0
        ? [...new Set(subject.programCodes)].sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
          )
        : [UNASSIGNED_PROGRAM_CODE];

    for (const programCode of codes) {
      const list = byProgramCode.get(programCode) ?? [];
      if (!list.some((item) => item.code === subject.code)) {
        list.push(subject);
      }
      byProgramCode.set(programCode, list);
    }
  }

  const programCodes = [...byProgramCode.keys()].sort((a, b) => {
    if (a === UNASSIGNED_PROGRAM_CODE) return 1;
    if (b === UNASSIGNED_PROGRAM_CODE) return -1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });

  return programCodes.map((programCode) => ({
    programCode,
    items: (byProgramCode.get(programCode) ?? []).sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { sensitivity: "base" })
    ),
  }));
}

export function countSubjectsInProgramCodeGroups<T extends { code: string }>(
  groups: SubjectProgramCodeGroup<T>[]
): number {
  const seen = new Set<string>();
  for (const group of groups) {
    for (const item of group.items) {
      seen.add(item.code);
    }
  }
  return seen.size;
}
