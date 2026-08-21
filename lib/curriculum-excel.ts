import * as XLSX from "xlsx";

import {
  splitPrerequisiteTokens,
  tokenizePrerequisiteCell,
  type CurriculumUnitsRequirement,
  type StandingRequirement,
} from "@/lib/curriculum-prerequisites";
import type { SemesterTermValue } from "@/lib/semester-terms";

export type CurriculumExcelSubject = {
  code: string;
  description: string;
  units: number;
  prerequisites: string[];
};

export type CurriculumExcelOffering = {
  code: string;
  yearLevel: number;
  semester: SemesterTermValue;
  /** Order within the same year level and semester (matches Excel row order). */
  displayOrder: number;
  subjectPrerequisiteCodes: string[];
  standing: StandingRequirement | null;
  curriculumUnits: CurriculumUnitsRequirement | null;
};

export type ParsedCurriculumExcel = {
  sheetName: string;
  title: string;
  batchLabel: string;
  batchYear: number;
  subjects: Map<string, CurriculumExcelSubject>;
  offerings: CurriculumExcelOffering[];
  error?: string;
};

export type CurriculumExportRow = {
  code: string;
  description: string;
  units: number;
  prerequisiteCodes: string[];
};

export type CurriculumExportOffering = {
  id: string;
  yearLevel: number;
  semester: SemesterTermValue;
  displayOrder: number;
  subject: CurriculumExportRow;
};

function parseUnits(value: unknown): number {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const match = raw.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function parsePrerequisiteCell(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw || raw.toLowerCase() === "none") {
    return {
      subjectCodes: [],
      standing: null,
      curriculumUnits: null,
      customLabels: [],
    };
  }
  return splitPrerequisiteTokens(tokenizePrerequisiteCell(raw));
}

function normalizeCode(code: string): string {
  return code.trim().replace(/\s+/g, " ").toUpperCase();
}

function isColumnHeaderRow(leftCode: string, rightCode: string): boolean {
  return /^code$/i.test(leftCode) && /^code$/i.test(rightCode);
}

function isSubjectRowCode(code: string): boolean {
  const normalized = normalizeCode(code);
  return (
    normalized.length > 0 &&
    !/^total$/i.test(normalized) &&
    !/^code$/i.test(normalized)
  );
}

function isSubjectRowDescription(description: string): boolean {
  const value = description.trim();
  return value.length > 0 && !/^subject\s+description$/i.test(value);
}

function parseYearLevelFromHeader(value: string): number | null {
  const match = value.trim().match(/^(\d+)(?:st|nd|rd|th|rth)?\s+YEAR/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function extractBatchYear(batchLabel: string): number {
  const match = batchLabel.match(/(\d{4})/);
  return match ? Number.parseInt(match[1], 10) : new Date().getFullYear();
}

function emptyParsedSheet(
  sheetName: string,
  error?: string
): ParsedCurriculumExcel {
  return {
    sheetName,
    title: "",
    batchLabel: "",
    batchYear: new Date().getFullYear(),
    subjects: new Map(),
    offerings: [],
    error,
  };
}

export function detectProgramCodeFromSheet(
  sheetName: string,
  title: string,
  courses: { code: string; title: string }[]
): string | null {
  if (courses.length === 0) return null;

  const normalizedSheet = sheetName.trim().toUpperCase();
  const sorted = [...courses].sort((a, b) => b.code.length - a.code.length);

  for (const course of sorted) {
    const code = course.code.trim().toUpperCase();
    if (!code) continue;
    if (
      normalizedSheet === code ||
      normalizedSheet.startsWith(`${code} `) ||
      normalizedSheet.startsWith(`${code}-`) ||
      normalizedSheet.startsWith(`${code}_`)
    ) {
      return course.code;
    }
  }

  const normalizedTitle = title.trim().toLowerCase();
  if (normalizedTitle) {
    const exact = courses.find(
      (course) => course.title.trim().toLowerCase() === normalizedTitle
    );
    if (exact) return exact.code;

    const partial = courses.find((course) => {
      const courseTitle = course.title.trim().toLowerCase();
      return (
        courseTitle.length >= 8 &&
        (normalizedTitle.includes(courseTitle) ||
          courseTitle.includes(normalizedTitle))
      );
    });
    if (partial) return partial.code;
  }

  return null;
}

export type CurriculumVersionPeer = {
  programCode: string;
  batchYear: number;
};

export function detectCurriculumVersionTag(
  target: CurriculumVersionPeer,
  related: CurriculumVersionPeer[]
): { versionTag: "OLD" | "NEW"; reason: string } {
  const programCode = target.programCode.trim().toUpperCase();
  if (!programCode) {
    return {
      versionTag: "NEW",
      reason: "Select a course to detect Old vs New from batch years",
    };
  }

  const otherYears = related
    .filter(
      (item) => item.programCode.trim().toUpperCase() === programCode
    )
    .map((item) => item.batchYear)
    .filter((year) => year !== target.batchYear);

  if (otherYears.length === 0) {
    return {
      versionTag: "NEW",
      reason: `Only batch year detected for ${programCode}`,
    };
  }

  const newestOther = Math.max(...otherYears);
  if (target.batchYear < newestOther) {
    return {
      versionTag: "OLD",
      reason: `Older than ${programCode} ${newestOther}`,
    };
  }

  return {
    versionTag: "NEW",
    reason: `Newer than ${programCode} ${newestOther}`,
  };
}

function parseCurriculumWorksheet(
  worksheet: XLSX.WorkSheet | undefined,
  sheetName: string
): ParsedCurriculumExcel {
  if (!worksheet) {
    return emptyParsedSheet(sheetName, "Sheet is empty");
  }

  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  const title = String(data[3]?.[0] ?? "").trim() || "Curriculum";
  const batchLabel = String(data[4]?.[0] ?? "").trim() || "A.Y.";
  const batchYear = extractBatchYear(batchLabel);

  const subjects = new Map<string, CurriculumExcelSubject>();
  const offerings: CurriculumExcelOffering[] = [];
  const displayOrderByTerm = new Map<string, number>();
  let currentYearLevel = 0;

  const nextDisplayOrder = (yearLevel: number, semester: SemesterTermValue) => {
    const key = `${yearLevel}:${semester}`;
    const order = displayOrderByTerm.get(key) ?? 0;
    displayOrderByTerm.set(key, order + 1);
    return order;
  };

  const addSubject = (
    code: string,
    description: string,
    units: number,
    prereqCell: unknown,
    yearLevel: number,
    semester: SemesterTermValue
  ) => {
    const normalizedCode = normalizeCode(code);
    if (
      !isSubjectRowCode(normalizedCode) ||
      !isSubjectRowDescription(description) ||
      units <= 0
    ) {
      return;
    }

    const { subjectCodes, standing, curriculumUnits } =
      parsePrerequisiteCell(prereqCell);

    const existing = subjects.get(normalizedCode);
    const mergedPrereqs = new Set([
      ...(existing?.prerequisites ?? []),
      ...subjectCodes,
    ]);

    subjects.set(normalizedCode, {
      code: normalizedCode,
      description,
      units,
      prerequisites: [...mergedPrereqs],
    });

    offerings.push({
      code: normalizedCode,
      yearLevel,
      semester,
      displayOrder: nextDisplayOrder(yearLevel, semester),
      subjectPrerequisiteCodes: subjectCodes,
      standing,
      curriculumUnits,
    });
  };

  for (const row of data) {
    const cells = row as unknown[];
    const firstColValue = String(cells[0] ?? "").trim();
    const rightColValue = String(cells[5] ?? "").trim();

    const yearLevel = parseYearLevelFromHeader(firstColValue);
    if (yearLevel) {
      currentYearLevel = yearLevel;
      continue;
    }

    if (currentYearLevel <= 0) continue;

    const leftCode = firstColValue;
    if (isColumnHeaderRow(leftCode, rightColValue)) {
      continue;
    }

    if (isSubjectRowCode(leftCode)) {
      addSubject(
        leftCode,
        String(cells[2] ?? "").trim(),
        parseUnits(cells[3]),
        cells[1],
        currentYearLevel,
        "FIRST"
      );
    }

    if (isSubjectRowCode(rightColValue)) {
      addSubject(
        rightColValue,
        String(cells[7] ?? "").trim(),
        parseUnits(cells[8]),
        cells[6],
        currentYearLevel,
        "SECOND"
      );
    }
  }

  return {
    sheetName,
    title,
    batchLabel,
    batchYear,
    subjects,
    offerings,
  };
}

export function parseCurriculumExcelSheets(
  buffer: Buffer
): ParsedCurriculumExcel[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  if (!workbook.SheetNames.length) {
    throw new Error("Workbook has no sheets");
  }

  return workbook.SheetNames.map((sheetName) => {
    try {
      return parseCurriculumWorksheet(workbook.Sheets[sheetName], sheetName);
    } catch (error) {
      return emptyParsedSheet(
        sheetName,
        error instanceof Error ? error.message : "Failed to parse sheet"
      );
    }
  });
}

export function parseCurriculumExcelBuffer(buffer: Buffer): ParsedCurriculumExcel {
  const sheets = parseCurriculumExcelSheets(buffer);
  const firstSheet = sheets[0];
  if (!firstSheet) {
    throw new Error("Workbook has no sheets");
  }
  return firstSheet;
}

export type OfferingPrerequisiteDisplay = {
  subjectCodes: string[];
  standingLabel?: string | null;
};

/** Match prerequisite text to a subject code from the same import (handles spacing/case). */
export function resolveSubjectCodeInCatalog(
  code: string,
  catalog: Map<string, string> | Set<string>
): string | null {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const keys =
    catalog instanceof Set ? [...catalog] : [...catalog.keys()];

  if (keys.includes(normalized)) return normalized;

  const compact = normalized.replace(/\s/g, "");
  for (const key of keys) {
    if (key.replace(/\s/g, "") === compact) return key;
  }

  const alnumMatch = normalized.match(/^([A-Z]+)\s*(\d+)$/);
  if (alnumMatch) {
    const withSpace = `${alnumMatch[1]} ${alnumMatch[2]}`;
    if (keys.includes(withSpace)) return withSpace;
    for (const key of keys) {
      if (key.replace(/\s/g, "") === `${alnumMatch[1]}${alnumMatch[2]}`) {
        return key;
      }
    }
  }

  return null;
}
