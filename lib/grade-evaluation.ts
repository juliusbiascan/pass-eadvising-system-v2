import type { GradeStatus } from '@/app/generated/prisma/enums';

export const GRADE_SETTING_KEYS = {
  passingThreshold: 'passingGradeThreshold',
  gradeScale: 'gradeScale',
} as const;

export type GradeScale = 'percentage' | 'gwa';

export type GradePassSettings = {
  passingThreshold: number;
  gradeScale: GradeScale;
};

export const DEFAULT_GRADE_PASS_SETTINGS: GradePassSettings = {
  passingThreshold: 75,
  gradeScale: 'percentage',
};

export function parseNumericGrade(grade: string | null | undefined): number | null {
  if (!grade?.trim()) return null;
  const value = Number(grade.trim().replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  return value;
}

/**
 * Derives PASSED/FAILED from a numeric grade using the configured scale and threshold.
 * Returns null when the grade is empty or not numeric (caller keeps manual/existing status).
 */
export function deriveStatusFromGrade(
  grade: string | null | undefined,
  settings: GradePassSettings = DEFAULT_GRADE_PASS_SETTINGS
): GradeStatus | null {
  const value = parseNumericGrade(grade);
  if (value === null) return null;

  if (settings.gradeScale === 'gwa') {
    return value <= settings.passingThreshold ? 'PASSED' : 'FAILED';
  }

  return value >= settings.passingThreshold ? 'PASSED' : 'FAILED';
}

export function resolveGradePassSettings(
  thresholdRaw: string | null | undefined,
  scaleRaw: string | null | undefined
): GradePassSettings {
  const parsedThreshold = thresholdRaw ? Number(thresholdRaw) : NaN;
  const passingThreshold =
    Number.isFinite(parsedThreshold) && parsedThreshold > 0
      ? parsedThreshold
      : DEFAULT_GRADE_PASS_SETTINGS.passingThreshold;

  const gradeScale: GradeScale =
    scaleRaw === 'gwa' || scaleRaw === 'percentage' ? scaleRaw : DEFAULT_GRADE_PASS_SETTINGS.gradeScale;

  return { passingThreshold, gradeScale };
}

export function formatPassingRule(settings: GradePassSettings): string {
  if (settings.gradeScale === 'gwa') {
    return `GWA scale: grade ≤ ${settings.passingThreshold} = PASSED`;
  }
  return `Percentage scale: grade ≥ ${settings.passingThreshold} = PASSED`;
}
