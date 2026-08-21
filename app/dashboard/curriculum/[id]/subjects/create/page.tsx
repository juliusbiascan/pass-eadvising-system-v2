import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';

import CreateCurriculumSubjectForm from './create-curriculum-subject-form';

export const metadata: Metadata = {
  title: 'Create Curriculum Subject',
  description: 'Create a new subject and assign it to a curriculum',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreateCurriculumSubjectPage({ params }: PageProps) {
  const session = await auth();

  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { id } = await params;

  const curriculum = await db.curriculum.findUnique({
    where: { id },
    select: {
      id: true,
      programCode: true,
      batchLabel: true,
      versionTag: true,
      title: true,
    },
  });

  if (!curriculum) {
    notFound();
  }

  const prerequisiteOptions = await db.curriculumSubject.findMany({
    where: { curriculumId: curriculum.id },
    select: {
      subject: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
    },
    orderBy: [{ yearLevel: 'asc' }, { semester: 'asc' }, { displayOrder: 'asc' }],
  });

  const subjects = prerequisiteOptions.map((item) => item.subject);

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Create Subject for {curriculum.programCode} {curriculum.batchLabel} ({curriculum.versionTag})
          </h2>
          <Button asChild variant="outline">
            <Link href={`/dashboard/curriculum/${curriculum.id}/subjects`}>Back to Subjects</Link>
          </Button>
        </div>
        <CreateCurriculumSubjectForm curriculumId={curriculum.id} prerequisiteOptions={subjects} />
      </div>
    </div>
  );
}
