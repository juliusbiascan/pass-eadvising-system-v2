'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SidebarNavItem } from '@/types';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

interface SidebarNavProps {
  items: SidebarNavItem[];
  onNavigate?: () => void;
}

function isActive(path: string, href: string) {
  if (path === href) return true;
  if (href !== '/dashboard' && path.startsWith(`${href}/`)) return true;
  return false;
}

const SidebarNav = ({ items, onNavigate }: SidebarNavProps) => {
  const path = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Main navigation">
      {items.map((item, index) => {
        const Icon = Icons[item.icon || 'arrowRight'];
        const active = item.href ? isActive(path, item.href) : false;

        if (!item.href) return null;

        return (
          <Link
            key={item.href}
            href={item.disabled ? '/' : item.href}
            onClick={onNavigate}
            style={{ animationDelay: `${index * 55}ms` }}
            className={cn(
              'dashboard-nav-item group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
              active
                ? 'bg-(--pass-sidebar-active) text-(--pass-gold) shadow-[inset_0_0_0_1px_rgb(235_196_46/0.28)]'
                : 'text-(--pass-sidebar-fg)/75 hover:translate-x-0.5 hover:bg-(--pass-sidebar-hover) hover:text-(--pass-sidebar-fg)',
              item.disabled && 'pointer-events-none opacity-50'
            )}
          >
            {active ? (
              <span
                className="dashboard-nav-rail absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-(--pass-gold)"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300',
                active
                  ? 'bg-(--pass-gold)/15 text-(--pass-gold)'
                  : 'bg-(--pass-sidebar-icon-bg) text-(--pass-sidebar-muted) group-hover:bg-(--pass-red)/15 group-hover:text-(--pass-sidebar-fg)'
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default SidebarNav;
