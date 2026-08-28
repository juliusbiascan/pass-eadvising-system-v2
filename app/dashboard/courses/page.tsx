import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { DEFAULT_COURSES } from '@/lib/courses';
import { db } from '@/lib/db';

import CoursesManager from './courses-manager';

export const metadata: Metadata = {
  title: 'Courses',
  description: 'Manage degree programs used by curriculum and students',
};

export default async function CoursesPage() {
  const session = await auth();

  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [courses, studentGroups] = await Promise.all([
    db.course.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: {
            curriculums: true,
            headCourses: true,
          },
        },
      },
    }),
    db.student.groupBy({
      by: ['course'],
      _count: { id: true },
    }),
  ]);

  const studentsByCode = new Map(
    studentGroups.map((row) => [row.course, row._count.id])
  );

  const data = courses.map((course) => ({
    id: course.id,
    code: course.code,
    title: course.title,
    isActive: course.isActive,
    curriculumsCount: course._count.curriculums,
    headsCount: course._count.headCourses,
    studentsCount: studentsByCode.get(course.code) ?? 0,
    createdAt: course.createdAt,
  }));

  return (
    <CoursesManager
      courses={data}
      templateCourses={DEFAULT_COURSES.map((course) => ({
        code: course.code,
        title: course.title,
      }))}
    />
  );
}
