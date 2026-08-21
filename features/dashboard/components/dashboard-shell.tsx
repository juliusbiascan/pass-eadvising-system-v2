'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { MainNavItem, SidebarNavItem } from '@/types';

import { dashboardContentPadding } from './dashboard-layout.constants';
import { DashboardHeader } from './dashboard-header';
import { DashboardSidebar } from './dashboard-sidebar';
import ProgressBarProvider from './progressbar-provider';

import '../styles/dashboard-shell.css';

type DashboardShellProps = {
  children: React.ReactNode;
  sidebarItems: SidebarNavItem[];
  secondaryItems?: MainNavItem[];
  roleLabel?: string;
  settingsHref?: string;
};

export function DashboardShell({
  children,
  sidebarItems,
  secondaryItems,
  roleLabel,
  settingsHref,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <ProgressBarProvider>
      <div className="dashboard-shell relative min-h-svh bg-background text-foreground">
        <div className="dashboard-accent-bar sticky top-0 z-50" aria-hidden />

        <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="dashboard-sidebar-enter relative hidden overflow-hidden border-r border-(--pass-sidebar-border) bg-(--pass-sidebar-bg) text-(--pass-sidebar-fg) transition-colors duration-300 lg:sticky lg:top-[3px] lg:z-30 lg:block lg:h-[calc(100svh-3px)]">
            <div
              className="dashboard-orb pointer-events-none absolute -top-16 -left-10 size-44 rounded-full bg-(--pass-sidebar-orb-a) blur-3xl"
              aria-hidden
            />
            <div
              className="dashboard-orb-delayed pointer-events-none absolute -bottom-20 -right-12 size-52 rounded-full bg-(--pass-sidebar-orb-b) blur-3xl"
              aria-hidden
            />
            <DashboardSidebar
              sidebarItems={sidebarItems}
              secondaryItems={secondaryItems}
              roleLabel={roleLabel}
              showBrand
              className="relative z-10 h-full"
            />
          </aside>

          <div className="flex min-h-[calc(100svh-3px)] min-w-0 flex-col">
            <DashboardHeader
              onMenuClick={() => setMobileOpen(true)}
              settingsHref={settingsHref}
            />

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetContent
                side="left"
                className="dashboard-sidebar-surface flex h-full w-80 flex-col gap-0 overflow-hidden border-0 bg-(--pass-sidebar-bg) p-0 text-(--pass-sidebar-fg) transition-colors duration-300 sm:max-w-xs [&>button]:text-(--pass-sidebar-fg) [&>button]:hover:bg-(--pass-sidebar-hover) [&>button]:hover:text-(--pass-gold)"
                showCloseButton
              >
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <div
                  className="pointer-events-none absolute -top-16 -left-10 size-44 rounded-full bg-(--pass-sidebar-orb-a) blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-20 -right-12 size-52 rounded-full bg-(--pass-sidebar-orb-b) blur-3xl"
                  aria-hidden
                />
                <DashboardSidebar
                  sidebarItems={sidebarItems}
                  secondaryItems={secondaryItems}
                  roleLabel={roleLabel}
                  onNavigate={() => setMobileOpen(false)}
                  showBrand
                  className="relative z-10 h-full"
                />
              </SheetContent>
            </Sheet>

            <main
              key={pathname}
              className={cn(
                'dashboard-page-enter flex-1 py-6 lg:py-8',
                dashboardContentPadding
              )}
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProgressBarProvider>
  );
}
