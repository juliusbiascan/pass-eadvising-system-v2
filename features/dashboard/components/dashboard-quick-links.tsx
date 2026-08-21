import Link from 'next/link';
import {
  BookMarked,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  Settings,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const links: Array<{
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    href: '/dashboard/students',
    title: 'Students',
    description: 'Register and manage records',
    icon: GraduationCap,
  },
  {
    href: '/dashboard/records',
    title: 'Records',
    description: 'View academic history',
    icon: ClipboardList,
  },
  {
    href: '/dashboard/courses',
    title: 'Courses',
    description: 'Degree programs for curriculum',
    icon: BookMarked,
  },
  {
    href: '/dashboard/curriculum',
    title: 'Curriculum',
    description: 'Programs and subjects',
    icon: Layers,
  },
  {
    href: '/dashboard/reports',
    title: 'Reports',
    description: 'Full analytics export',
    icon: FileText,
  },
  {
    href: '/dashboard/settings',
    title: 'Settings',
    description: 'Grades and system config',
    icon: Settings,
  },
];

export function DashboardQuickLinks({
  role = 'ADMIN',
}: {
  role?: 'ADMIN' | 'HEAD';
}) {
  const visibleLinks =
    role === 'HEAD'
      ? links.filter(
          (link) =>
            link.href === '/dashboard/students' ||
            link.href === '/dashboard/records' ||
            link.href === '/dashboard/reports'
        )
      : links;
  return (
    <nav className="space-y-1" aria-label="Quick navigation">
      {visibleLinks.map(({ href, title, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-lg border-2 border-transparent px-3 py-2.5',
            'transition-colors hover:border-border hover:bg-muted/60'
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium leading-none">{title}</span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {description}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
