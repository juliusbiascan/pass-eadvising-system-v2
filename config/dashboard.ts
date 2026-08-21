import { DashboardConfig, SidebarNavItem } from '@/types';

export const HEAD_SIDEBAR_HREFS = [
  '/dashboard',
  '/dashboard/students',
  '/dashboard/records',
  '/dashboard/reports',
] as const;

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: 'Documentation',
      href: '/dashboard/documentation',
    },
    {
      title: 'Support',
      href: '/dashboard/support',
    },
  ],
  sidebarNav: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: 'dashboard',
    },
    {
      title: 'Students',
      href: '/dashboard/students',
      icon: 'student',
    },
    {
      title: 'Records',
      href: '/dashboard/records',
      icon: 'records',
    },
    {
      title: 'Heads',
      href: '/dashboard/heads',
      icon: 'head',
    },
    {
      title: 'Courses',
      href: '/dashboard/courses',
      icon: 'course',
    },
    {
      title: 'Curriculum',
      href: '/dashboard/curriculum',
      icon: 'curriculum',
    },
    {
      title: 'Reports',
      href: '/dashboard/reports',
      icon: 'report',
    },
    {
      title: 'Terms',
      href: '/dashboard/terms',
      icon: 'terms',
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: 'settings',
    },
  ],
};

export function getDashboardSidebarNav(role?: string | null): SidebarNavItem[] {
  if (role === 'HEAD') {
    const allowed = new Set<string>(HEAD_SIDEBAR_HREFS);
    return dashboardConfig.sidebarNav.filter(
      (item) => item.href && allowed.has(item.href)
    );
  }

  return dashboardConfig.sidebarNav;
}
