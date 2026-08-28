import type { Metadata } from 'next';

import { getDashboardSidebarNav } from '@/config/dashboard';
import { RoleGate } from '@/features/auth/components/role-gate';
import { StaffPasswordGate } from '@/features/auth/components/staff-password-gate';
import { DashboardShell } from '@/features/dashboard/components/dashboard-shell';
import { UserRole } from '@/app/generated/prisma/client';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Admin dashboard',
  description: 'PASS E-Advising admin dashboard',
};

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  const role = session?.user?.role;
  const isHead = role === UserRole.HEAD;
  const isRoot = Boolean(session?.user?.isRoot);

  return (
    <DashboardShell
      sidebarItems={getDashboardSidebarNav(role)}
      roleLabel={isHead ? 'Head' : isRoot ? 'Root' : 'Admin'}
      settingsHref={isHead ? undefined : '/dashboard/settings'}
      teamsHref={role === UserRole.ADMIN ? '/dashboard/teams' : undefined}
    >
      <RoleGate allowedRole={[UserRole.ADMIN, UserRole.HEAD]}>
        <StaffPasswordGate>{children}</StaffPasswordGate>
      </RoleGate>
    </DashboardShell>
  );
};

export default DashboardLayout;
