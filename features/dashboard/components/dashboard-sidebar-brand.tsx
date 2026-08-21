'use client';

import Image from 'next/image';
import Link from 'next/link';

type DashboardSidebarBrandProps = {
  onNavigate?: () => void;
  roleLabel?: string;
};

export function DashboardSidebarBrand({
  onNavigate,
  roleLabel = 'Admin',
}: DashboardSidebarBrandProps) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className="group flex min-w-0 items-center gap-3 rounded-xl outline-none ring-(--pass-gold) transition-transform duration-300 hover:translate-x-0.5 focus-visible:ring-2"
    >
      <span className="relative shrink-0">
        <span
          className="dashboard-brand-glow absolute inset-0 rounded-xl bg-(--pass-gold)/50 blur-md"
          aria-hidden
        />
        <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-xl bg-(--pass-iron) ring-1 ring-(--pass-gold)/50 transition-transform duration-300 group-hover:scale-105">
          <Image
            src="/passlogo-small.png"
            width={40}
            height={40}
            alt="PASS College"
            className="size-9 object-contain"
          />
        </span>
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight tracking-tight text-(--pass-sidebar-fg)">
          PASS E-Advising
        </p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-(--pass-gold)">
          {roleLabel}
        </p>
      </div>
    </Link>
  );
}
