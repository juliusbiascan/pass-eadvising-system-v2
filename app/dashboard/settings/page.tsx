import { Metadata } from 'next';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import ManageTerms from '../terms/manage-terms';
import ManageGradeSettings from './manage-grade-settings';
import { getGradePassSettings } from '@/lib/grade-settings';
import { formatPassingRule } from '@/lib/grade-evaluation';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'System settings',
};

export default async function SettingsPage() {
  const session = await auth();

  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [currentSemester, gradePassSettings] = await Promise.all([
    db.systemSetting.findUnique({ where: { key: 'activeSemester' } }).then((s) => s?.value || null),
    getGradePassSettings(),
  ]);

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage system-wide settings such as the active semester and pass/fail grade rules.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Academic terms</CardTitle>
              <CardDescription>Configure the active semester for the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <ManageTerms currentSemester={currentSemester} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pass / fail rules</CardTitle>
              <CardDescription>
                Numeric grades automatically set PASSED or FAILED on save. Current rule:{' '}
                {formatPassingRule(gradePassSettings)}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManageGradeSettings
                currentThreshold={gradePassSettings.passingThreshold}
                currentScale={gradePassSettings.gradeScale}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
