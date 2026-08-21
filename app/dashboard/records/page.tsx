import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { listStudentRecordSummaries } from '@/features/dashboard/lib/get-student-academic-record';
import { getDashboardAccess } from '@/lib/staff-access';

import RecordsTable from './records-table';

export const metadata: Metadata = {
  title: 'Record Management',
  description:
    'Master academic records — full curriculum grades and evaluations by year level and semester',
};

export default async function RecordManagementPage() {
  const access = await getDashboardAccess();

  if (!access) {
    redirect('/auth/login');
  }

  const data = await listStudentRecordSummaries(access.courseCodes);

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Record Management</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Central master view of each student&apos;s full academic record
            {access.role === 'HEAD' && access.courses.length > 0
              ? ` for ${access.courses.map((course) => course.code).join(', ')}`
              : ''}
            . Open a student to see every subject in their current curriculum,
            prior course records after a shift, edit grades for any term, and
            review evaluation history. Heads evaluate the current term by date;
            the registrar or admin then checks and approves by date.
          </p>
        </div>
        <RecordsTable data={data} canRegister={access.role === 'ADMIN'} />
      </div>
    </div>
  );
}
