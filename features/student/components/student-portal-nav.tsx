'use client';

import { BookOpen, ClipboardList, GraduationCap, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { StudentPortalTab } from '../config/student-portal';
import { studentPortalNav } from '../config/student-portal';

const tabIcons: Record<StudentPortalTab, typeof BookOpen> = {
  curriculum: BookOpen,
  grades: ClipboardList,
  results: GraduationCap,
  progress: TrendingUp,
};

interface StudentPortalNavProps {
  activeTab: StudentPortalTab;
  onTabChange: (tab: StudentPortalTab) => void;
}

export function StudentPortalNav({ activeTab, onTabChange }: StudentPortalNavProps) {
  return (
    <>
      <nav
        aria-label="Student portal sections"
        className="hidden w-full shrink-0 lg:block lg:w-60 xl:w-64"
      >
        <ul className="sticky top-24 space-y-1.5">
          {studentPortalNav.map((item) => {
            const Icon = tabIcons[item.id];
            const isActive = activeTab === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'group relative flex w-full flex-col rounded-xl px-3 py-3 text-left transition-all duration-200',
                    isActive
                      ? 'bg-(--pass-gold)/18 text-foreground shadow-sm ring-1 ring-(--pass-gold)/35'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm'
                  )}
                >
                  {isActive ? (
                    <span
                      className="absolute inset-y-2 left-0 w-1 rounded-full bg-(--pass-gold)"
                      aria-hidden
                    />
                  ) : null}
                  <span className="flex items-center gap-2.5 text-sm font-medium">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-(--pass-gold) text-(--pass-cod)'
                          : 'bg-muted text-muted-foreground group-hover:text-foreground'
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    {item.title}
                  </span>
                  <span
                    className={cn(
                      'mt-1 pl-10 text-xs leading-snug',
                      isActive ? 'text-foreground/70' : 'text-muted-foreground'
                    )}
                  >
                    {item.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="Student portal sections"
        className="student-portal-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/90 shadow-[0_-8px_24px_rgb(26_22_23/0.06)] backdrop-blur-xl supports-backdrop-filter:bg-background/80 lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {studentPortalNav.map((item) => {
            const Icon = tabIcons[item.id];
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'relative flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 pt-1.5 text-[11px] font-medium transition-colors touch-manipulation',
                  isActive ? 'text-(--pass-red)' : 'text-muted-foreground active:text-foreground'
                )}
              >
                {isActive ? (
                  <span
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-(--pass-gold)"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-xl transition-all duration-200',
                    isActive ? 'bg-(--pass-gold)/20 text-(--pass-red)' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {item.shortTitle}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
