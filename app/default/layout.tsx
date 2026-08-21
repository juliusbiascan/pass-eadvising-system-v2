import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getStudentPortalProfile } from '@/features/student/lib/get-student-portal-profile';
import { StudentPortalHeader } from '@/features/student/components/student-portal-header';
import { RoleGate } from '@/features/auth/components/role-gate';
import { UserRole } from '@/app/generated/prisma/client';

import '@/features/student/styles/student-portal.css';

export const metadata: Metadata = {
  title: 'Student Portal',
  description: 'Curriculum, grades, evaluation results, and study plan',
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eaeaeb' },
    { media: '(prefers-color-scheme: dark)', color: '#121011' },
  ],
};

export default async function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const profile = await getStudentPortalProfile();

  return (
    <div className="student-portal relative min-h-svh overflow-x-hidden bg-background text-foreground">
      <div className="student-portal-accent-bar sticky top-0 z-50" aria-hidden />
      <div
        className="student-portal-orb pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-(--pass-orb-red) blur-3xl"
        aria-hidden
      />
      <div
        className="student-portal-orb-delayed pointer-events-none absolute top-40 -right-20 size-80 rounded-full bg-(--pass-orb-gold) blur-3xl"
        aria-hidden
      />

      {profile ? <StudentPortalHeader student={profile} /> : null}

      <main className="relative z-10">
        <RoleGate allowedRole={UserRole.USER}>{children}</RoleGate>
      </main>
    </div>
  );
}
