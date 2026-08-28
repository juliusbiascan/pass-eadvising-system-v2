'use client';

import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UserButton } from '@/features/auth/components/user-button';
import { cn } from '@/lib/utils';

import { DashboardBreadcrumb } from './dashboard-breadcrumb';
import {
  dashboardContentPadding,
  dashboardTopBarHeight,
} from './dashboard-layout.constants';
import ThemeModeToggle from './mode-toggle';

type DashboardHeaderProps = {
  onMenuClick: () => void;
  className?: string;
  settingsHref?: string;
  teamsHref?: string;
};

export function DashboardHeader({
  onMenuClick,
  className,
  settingsHref,
  teamsHref,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        'dashboard-header-enter sticky top-[3px] z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/70',
        dashboardTopBarHeight,
        className
      )}
    >
      <div
        className={cn(
          'flex h-full items-center gap-3',
          dashboardContentPadding
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-xl border border-(--pass-sidebar-border) bg-(--pass-sidebar-bg) text-(--pass-sidebar-fg) shadow-sm transition-all duration-300 hover:scale-105 hover:text-(--pass-gold) lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="size-4" aria-hidden />
        </Button>

        <DashboardBreadcrumb />

        <div className="ml-auto flex items-center gap-2">
          <ThemeModeToggle />
          <UserButton settingsHref={settingsHref} teamsHref={teamsHref} />
        </div>
      </div>
    </header>
  );
}
