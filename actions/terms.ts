"use server";

import { revalidatePath } from "next/cache";

import { auth } from '@/auth';
import { db } from '@/lib/db';

const ensureAdmin = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') return false;
  return true;
};

export const setSystemSetting = async (key: string, value: string) => {
  if (!(await ensureAdmin())) return { error: 'Unauthorized' };
  if (!key?.trim()) return { error: 'Invalid key' };

  try {
    await db.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    revalidatePath('/dashboard/terms');
    revalidatePath('/dashboard/settings');
    revalidatePath('/default');
    return { success: 'Setting updated' };
  } catch (error) {
    console.error('Set system setting error:', error);
    return { error: 'Failed to update setting' };
  }
};

export const removeSystemSetting = async (key: string) => {
  if (!(await ensureAdmin())) return { error: 'Unauthorized' };
  if (!key?.trim()) return { error: 'Invalid key' };

  try {
    await db.systemSetting.deleteMany({ where: { key } });
    revalidatePath('/dashboard/terms');
    revalidatePath('/dashboard/settings');
    revalidatePath('/default');
    return { success: 'Setting removed' };
  } catch (error) {
    console.error('Remove system setting error:', error);
    return { error: 'Failed to remove setting' };
  }
};
