/** Special and subject-based prerequisites from curriculum Excel. */

export type StandingRequirement = {
  label: string;
  minYearLevel: number;
};

export type CurriculumUnitsRequirement = {
  label: string;
  minPercent: number;
};

export type ParsedPrerequisiteCell = {
  subjectCodes: string[];
  standing: StandingRequirement | null;
  curriculumUnits: CurriculumUnitsRequirement | null;
  /** Raw labels kept for display (e.g. combined note text). */
  customLabels: string[];
};

const STANDING_PATTERN =
  /standing|(?:\d+\s*-\s*\d+|\d+(?:st|nd|rd|th)?)\s*yr/i;

const CURRICULUM_UNITS_PATTERN =
  /\d+\s*%\s*(?:curri(?:culum)?\.?\s*)?units/i;

const IGNORED_PREREQUISITE_TOKENS =
  /^(?:pre-?\s*req\.?|subject\s+description|units|code|none)$/i;

export function isIgnoredPrerequisiteToken(value: string): boolean {
  return IGNORED_PREREQUISITE_TOKENS.test(value.trim());
}

export function isStandingRequirement(value: string): boolean {
  return STANDING_PATTERN.test(value.trim());
}

export function isCurriculumUnitsRequirement(value: string): boolean {
  return CURRICULUM_UNITS_PATTERN.test(value.trim());
}

export function parseStandingRequirement(value: string): StandingRequirement | null {
  const label = value.trim();
  if (!label || !isStandingRequirement(label)) {
    return null;
  }

  const rangeMatch = label.match(/(\d+)\s*-\s*(\d+)\s*yr/i);
  if (rangeMatch) {
    const endYear = Number.parseInt(rangeMatch[2], 10);
    return {
      label,
      minYearLevel: endYear,
    };
  }

  const singleMatch = label.match(/(\d+)(?:st|nd|rd|th)?\s*yr/i);
  if (singleMatch) {
    return {
      label,
      minYearLevel: Number.parseInt(singleMatch[1], 10),
    };
  }

  return null;
}

export function parseCurriculumUnitsRequirement(
  value: string
): CurriculumUnitsRequirement | null {
  const label = value.trim();
  if (!label || !isCurriculumUnitsRequirement(label)) {
    return null;
  }

  const percentMatch = label.match(/(\d+)\s*%/);
  if (!percentMatch) return null;

  return {
    label,
    minPercent: Number.parseInt(percentMatch[1], 10),
  };
}

/** Split a prerequisite cell into tokens (comma, semicolon, and ampersand lists). */
export function tokenizePrerequisiteCell(raw: string): string[] {
  const segments = raw
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const tokens: string[] = [];

  for (const segment of segments) {
    if (!segment.includes("&")) {
      tokens.push(segment);
      continue;
    }

    const ampParts = segment
      .split(/\s*&\s*/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (ampParts.length < 2) {
      tokens.push(segment);
      continue;
    }

    const prefixMatch = ampParts[0].match(/^([A-Za-z]+)\s*/i);
    const prefix = prefixMatch ? prefixMatch[1].toUpperCase() : "";

    for (let index = 0; index < ampParts.length; index++) {
      let token = ampParts[index];
      const numericOnly = /^\d+$/.test(token);
      if (index > 0 && numericOnly && prefix) {
        token = `${prefix} ${token}`;
      }
      tokens.push(token);
    }
  }

  return tokens;
}

export function splitPrerequisiteTokens(tokens: string[]): ParsedPrerequisiteCell {
  const subjectCodes: string[] = [];
  const customLabels: string[] = [];
  let standing: StandingRequirement | null = null;
  let curriculumUnits: CurriculumUnitsRequirement | null = null;

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed || isIgnoredPrerequisiteToken(trimmed)) continue;

    const parsedStanding = parseStandingRequirement(trimmed);
    if (parsedStanding) {
      standing = parsedStanding;
      customLabels.push(parsedStanding.label);
      continue;
    }

    const parsedUnits = parseCurriculumUnitsRequirement(trimmed);
    if (parsedUnits) {
      curriculumUnits = parsedUnits;
      customLabels.push(parsedUnits.label);
      continue;
    }

    subjectCodes.push(trimmed.replace(/\s+/g, " ").toUpperCase());
  }

  return { subjectCodes, standing, curriculumUnits, customLabels };
}

export function buildPrerequisiteNote(parts: {
  standing?: StandingRequirement | null;
  curriculumUnits?: CurriculumUnitsRequirement | null;
  customLabels?: string[];
}): string | null {
  const labels = new Set<string>();
  for (const label of parts.customLabels ?? []) {
    if (label.trim()) labels.add(label.trim());
  }
  if (parts.standing?.label) labels.add(parts.standing.label);
  if (parts.curriculumUnits?.label) labels.add(parts.curriculumUnits.label);

  if (labels.size === 0) return null;
  return [...labels].join(", ");
}

export function meetsYearStanding(
  studentYearLevel: number,
  minYearStanding: number | null | undefined
): boolean {
  if (minYearStanding == null) return true;
  return studentYearLevel >= minYearStanding;
}

export function formatPrerequisiteDisplay(
  subjectCodes: string[],
  note?: string | null
): string {
  const parts = [...subjectCodes];
  const trimmedNote = note?.trim();
  if (trimmedNote) parts.push(trimmedNote);
  if (parts.length === 0) return "none";
  return parts.join(", ");
}
