import Link from 'next/link';
import { Metadata } from 'next';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ManageTerms from './manage-terms';

export const metadata: Metadata = {
  title: 'Terms Management',
  description: 'Academic year and semester management',
};

export default async function TermsDashboardPage() {
  const session = await auth();

  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [curriculums, offerings] = await Promise.all([
    db.curriculum.findMany({
      select: { batchYear: true },
      orderBy: { batchYear: 'desc' },
    }),
    db.curriculumSubject.findMany({
      select: { semester: true, curriculumId: true },
    }),
  ]);

  const academicYears = Array.from(new Set(curriculums.map((item) => item.batchYear))).sort((a, b) => b - a);
  const semesterCounts = offerings.reduce<Record<string, number>>((acc, item) => {
    acc[item.semester] = (acc[item.semester] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Terms Management</h2>
            <p className="text-sm text-muted-foreground">
              Track academic years and semester distribution used by the curriculum.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Academic Years</CardTitle>
              <CardDescription>Derived from curriculum batch years.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {academicYears.length} academic year{academicYears.length === 1 ? '' : 's'} currently present.
              </p>
              <Button asChild>
                <Link href="/dashboard/terms/academic-years">Open Academic Years</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Semesters</CardTitle>
              <CardDescription>View how many subject offerings exist per semester term.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                FIRST: {semesterCounts.FIRST || 0} • SECOND: {semesterCounts.SECOND || 0}
              </p>
              <Button asChild>
                <Link href="/dashboard/terms/semesters">Open Semesters</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Terms</CardTitle>
              <CardDescription>Set the active semester for the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <ManageTerms
                currentSemester={(await db.systemSetting.findUnique({ where: { key: 'activeSemester' } }))?.value || null}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
