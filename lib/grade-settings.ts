import { db } from '@/lib/db';
import {
  DEFAULT_GRADE_PASS_SETTINGS,
  GRADE_SETTING_KEYS,
  type GradePassSettings,
  resolveGradePassSettings,
} from '@/lib/grade-evaluation';

export async function getGradePassSettings(): Promise<GradePassSettings> {
  const [thresholdSetting, scaleSetting] = await Promise.all([
    db.systemSetting.findUnique({ where: { key: GRADE_SETTING_KEYS.passingThreshold } }),
    db.systemSetting.findUnique({ where: { key: GRADE_SETTING_KEYS.gradeScale } }),
  ]);

  return resolveGradePassSettings(thresholdSetting?.value, scaleSetting?.value);
}

export { DEFAULT_GRADE_PASS_SETTINGS, GRADE_SETTING_KEYS };
