import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ListPlus } from 'lucide-react';

import { db } from '@/lib/db';
import { getDashboardAccess, studentScopeWhere } from '@/lib/staff-access';
import { Button } from '@/components/ui/button';

import StudentsTable from './students-table';

export const metadata: Metadata = {
  title: 'Students',
  description: 'Student registration and records',
};

export default async function Page() {
  const access = await getDashboardAccess();

  if (!access) {
    redirect('/auth/login');
  }

  const isAdmin = access.role === 'ADMIN';

  const data = await db.student.findMany({
    where: studentScopeWhere(access.courseCodes),
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      studentId: true,
      email: true,
      fullName: true,
      course: true,
      yearLevel: true,
      currentSemester: true,
      curriculum: true,
      curriculumId: true,
      createdAt: true,
    },
  });

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Students</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {isAdmin
                ? 'Registered students, assigned curricula, and current year and semester. Open a row to review evaluation, view the academic record, edit details, or shift curriculum.'
                : `Students in ${access.courses.map((course) => course.code).join(', ') || 'your assigned departments'}. Open a row to evaluate by date or view the academic record.`}
            </p>
          </div>
          {isAdmin ? (
            <Button asChild>
              <Link href="/dashboard/students/register">
                <ListPlus className="mr-2 h-4 w-4" />
                Register Student
              </Link>
            </Button>
          ) : null}
        </div>
        <StudentsTable data={data} canRegister={isAdmin} canManageProfile={isAdmin} />
      </div>
    </div>
  );
}
