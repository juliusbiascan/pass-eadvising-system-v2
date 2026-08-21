import Link from 'next/link';
import { Metadata } from 'next';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Academic Years',
  description: 'Academic year overview',
};

export default async function AcademicYearsPage() {
  const session = await auth();

  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const curriculums = await db.curriculum.findMany({
    select: {
      batchYear: true,
      batchLabel: true,
      programCode: true,
      versionTag: true,
    },
    orderBy: [{ batchYear: 'desc' }, { programCode: 'asc' }],
  });

  const grouped = curriculums.reduce<Record<number, typeof curriculums>>((acc, curriculum) => {
    if (!acc[curriculum.batchYear]) {
      acc[curriculum.batchYear] = [];
    }
    acc[curriculum.batchYear].push(curriculum);
    return acc;
  }, {});

  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Academic Years</h2>
            <p className="text-sm text-muted-foreground">
              Review curriculum batches grouped by academic year.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/terms">Back to Terms</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {years.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No academic years found. Create a curriculum first.
              </CardContent>
            </Card>
          ) : (
            years.map((year) => (
              <Card key={year}>
                <CardHeader>
                  <CardTitle>{year}</CardTitle>
                  <CardDescription>{grouped[year].length} curriculum version(s)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {grouped[year].map((curriculum) => (
                    <div key={`${curriculum.programCode}-${curriculum.batchLabel}-${curriculum.versionTag}`} className="rounded-md border p-3">
                      <p className="font-medium">
                        {curriculum.programCode} {curriculum.batchLabel}
                      </p>
                      <p className="text-muted-foreground">{curriculum.versionTag} version</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
