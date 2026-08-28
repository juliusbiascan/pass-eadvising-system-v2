'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  heads: 'Heads',
  teams: 'Teams',
  students: 'Students',
  records: 'Records',
  curriculum: 'Curriculum',
  reports: 'Reports',
  terms: 'Terms',
  settings: 'Settings',
  documentation: 'Documentation',
  support: 'Support',
  evaluate: 'Evaluate',
  subjects: 'Subjects',
  create: 'Create',
  edit: 'Edit',
  assign: 'Assign',
  'assign-students': 'Assign students',
  prerequisites: 'Prerequisites',
  import: 'Import',
  register: 'Register',
  'academic-years': 'Academic years',
  semesters: 'Semesters',
};

function isDynamicSegment(segment: string) {
  return (
    /^c[a-z0-9]{20,}$/i.test(segment) ||
    /^[0-9a-f-]{20,}$/i.test(segment) ||
    /^\d+$/.test(segment)
  );
}

function labelFor(segment: string) {
  if (isDynamicSegment(segment)) return 'Details';
  return (
    SEGMENT_LABELS[segment] ??
    segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);

  const crumbs = parts.map((segment, index) => {
    const href = `/${parts.slice(0, index + 1).join('/')}`;
    return {
      href,
      label: labelFor(segment),
      current: index === parts.length - 1,
    };
  });

  const current = crumbs.at(-1);

  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold tracking-tight text-foreground">
        {current?.label ?? 'Overview'}
      </p>
      <nav aria-label="Breadcrumb" className="mt-0.5 hidden min-w-0 sm:block">
        <ol className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
          {crumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="size-3 shrink-0 opacity-50" aria-hidden />
              ) : null}
              {crumb.current ? (
                <span className="truncate font-medium text-foreground/80">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate transition-colors hover:text-(--pass-gold)"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
