import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ReportsWorkspace } from '@/features/dashboard/components/reports/reports-workspace';
import { getReportsBundle } from '@/features/dashboard/lib/get-reports-data';
import { getDashboardAccess } from '@/lib/staff-access';

export const metadata: Metadata = {
  title: 'Reports',
  description:
    'PASS College academic reports with figures, analysis, and Excel or PDF export',
};

export default async function ReportsPage() {
  const access = await getDashboardAccess();

  if (!access) {
    redirect('/auth/login');
  }

  const scopeLabel =
    access.role === 'HEAD'
      ? access.courses.length > 0
        ? access.courses.map((course) => course.code).join(', ')
        : 'Assigned departments'
      : 'All programs';

  const reports = await getReportsBundle(access.courseCodes, {
    scopeLabel,
    roleLabel: access.role === 'HEAD' ? 'Department Head' : 'Administrator',
  });

  return <ReportsWorkspace data={reports} />;
}
