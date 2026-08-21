import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { PortalErrorState } from '@/features/student/components/portal-error-state';
import { StudentPortalShell } from '@/features/student/components/student-portal-shell';
import { getStudentPortalData } from '@/features/student/lib/get-student-portal-data';
import { FORCE_PASSWORD_CHANGE_REDIRECT } from '@/routes';

export default async function DefaultStudentPage() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { mustChangePassword: true },
    });

    if (user?.mustChangePassword) {
      redirect(FORCE_PASSWORD_CHANGE_REDIRECT);
    }
  }

  let data;
  try {
    data = await getStudentPortalData();
  } catch {
    redirect('/auth/login');
  }

  if ('type' in data) {
    if (data.type === 'no-student') {
      return (
        <PortalErrorState
          title="No student record found"
          description="Your account is not linked to a student profile yet. Ask the admin to register you first."
        />
      );
    }

    return (
      <PortalErrorState
        title="Curriculum not assigned"
        description="Ask the admin to assign your curriculum before entering grades and running evaluation."
      />
    );
  }

  return <StudentPortalShell data={data} />;
}
