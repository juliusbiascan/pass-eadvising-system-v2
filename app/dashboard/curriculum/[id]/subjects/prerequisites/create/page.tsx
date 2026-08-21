import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';

import PrerequisiteManager from '../prerequisite-manager';

export const metadata: Metadata = {
  title: 'Create Subject Prerequisite',
  description: 'Add a subject prerequisite mapping',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreateSubjectPrerequisitePage({ params }: PageProps) {
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

  const offerings = await db.curriculumSubject.findMany({
    where: { curriculumId: curriculum.id },
    select: {
      subject: {
        select: {
          id: true,
          code: true,
        },
      },
    },
    orderBy: [{ yearLevel: 'asc' }, { semester: 'asc' }, { displayOrder: 'asc' }],
  });

  const subjects = offerings.map((item) => ({
    id: item.subject.id,
    code: item.subject.code,
  }));

  const prerequisites = await db.subjectPrerequisite.findMany({
    where: {
      subjectId: {
        in: subjects.map((subject) => subject.id),
      },
    },
    include: {
      subject: {
        select: {
          code: true,
        },
      },
      prerequisite: {
        select: {
          code: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const prerequisiteData = prerequisites.map((item) => ({
    id: item.id,
    subjectId: item.subjectId,
    prerequisiteId: item.prerequisiteId,
    subjectCode: item.subject.code,
    prerequisiteCode: item.prerequisite.code,
  }));

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Create Prerequisite for {curriculum.programCode} {curriculum.batchLabel} ({curriculum.versionTag})
          </h2>
          <Button asChild variant="outline">
            <Link href={`/dashboard/curriculum/${curriculum.id}/subjects/prerequisites`}>
              Back to Prerequisites
            </Link>
          </Button>
        </div>
        <PrerequisiteManager subjects={subjects} prerequisites={prerequisiteData} />
      </div>
    </div>
  );
}
