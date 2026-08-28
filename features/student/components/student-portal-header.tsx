'use client';

import Image from 'next/image';

import { UserButton } from '@/features/auth/components/user-button';
import ThemeModeToggle from '@/features/dashboard/components/mode-toggle';

import type { StudentPortalStudent } from '../lib/types';

interface StudentPortalHeaderProps {
  student: StudentPortalStudent;
}

export function StudentPortalHeader({ student }: StudentPortalHeaderProps) {
  return (
    <header className="student-portal-header-enter sticky top-[3px] z-40 border-b border-border/80 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative shrink-0">
            <span
              className="student-portal-brand-glow absolute inset-0 rounded-xl bg-(--pass-gold)/50 blur-md"
              aria-hidden
            />
            <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-xl bg-card ring-1 ring-(--pass-gold)/45 sm:size-11">
              <Image
                src="/passlogo-small.png"
                width={40}
                height={40}
                alt="PASS College"
                className="size-8 object-contain sm:size-9"
                priority
              />
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-semibold leading-tight tracking-tight sm:text-base">
              Student Portal
            </p>
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.16em] text-(--pass-gold) sm:text-xs">
              PASS e-Advising
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden max-w-[16rem] px-2 py-1 text-right lg:block">
            <p className="truncate text-sm font-medium">{student.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {student.studentId} · Year {student.yearLevel}
            </p>
          </div>
          <ThemeModeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
