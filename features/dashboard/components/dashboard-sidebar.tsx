'use client';

import Link from 'next/link';
import { FileText, HelpCircle } from 'lucide-react';

import { dashboardConfig } from '@/config/dashboard';
import { cn } from '@/lib/utils';
import type { MainNavItem, SidebarNavItem } from '@/types';

import { DashboardSidebarBrand } from './dashboard-sidebar-brand';
import SidebarNav from './sidebar-nav';

type DashboardSidebarProps = {
  sidebarItems: SidebarNavItem[];
  secondaryItems?: MainNavItem[];
  onNavigate?: () => void;
  className?: string;
  /** When false, only nav + help (brand is rendered in the shell top row). */
  showBrand?: boolean;
  roleLabel?: string;
};

export function DashboardSidebar({
  sidebarItems,
  secondaryItems = dashboardConfig.mainNav,
  onNavigate,
  className,
  showBrand = true,
  roleLabel,
}: DashboardSidebarProps) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {showBrand ? (
        <div className="flex h-16 shrink-0 items-center px-4 lg:px-5">
          <DashboardSidebarBrand onNavigate={onNavigate} roleLabel={roleLabel} />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        <p className="mb-2 px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-(--pass-sidebar-muted)">
          Menu
        </p>
        <SidebarNav items={sidebarItems} onNavigate={onNavigate} />
      </div>

      {secondaryItems.length > 0 ? (
        <div className="shrink-0 border-t border-(--pass-sidebar-border) px-2 py-4 lg:px-3">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-(--pass-sidebar-muted)">
            Help
          </p>
          <div className="flex flex-col gap-0.5">
            {secondaryItems.map((item) => {
              const Icon =
                item.href.includes('documentation') ? FileText : HelpCircle;
              return (
                <Link
                  key={item.href}
                  href={item.disabled ? '#' : item.href}
                  onClick={onNavigate}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-(--pass-sidebar-muted) transition-all duration-300 hover:translate-x-0.5 hover:bg-(--pass-sidebar-hover) hover:text-(--pass-gold)"
                >
                  <Icon
                    className="size-4 shrink-0 transition-colors group-hover:text-(--pass-gold)"
                    aria-hidden
                  />
                  {item.title}
                </Link>
              );
            })}
          </div>
          <p className="mt-4 px-3 text-[10px] leading-relaxed text-(--pass-sidebar-subtle)">
            PASS College · e-Advising
          </p>
        </div>
      ) : null}
    </div>
  );
}
