'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { usePathname } from 'next/navigation';

import { MainNavItem } from '@/types';
//import { siteConfig } from "@/config/site"
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { MobileNav } from './mobile-nav';

interface MainNavProps {
  items?: MainNavItem[];
  children?: React.ReactNode;
}

const MainNav = ({ items, children }: MainNavProps) => {
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false);

  return (
    <div className="flex gap-6 w-full md:gap-10">
      <Link href="/" className="hidden items-center space-x-2 md:flex">
        <Image src="/passlogo-small.png" width={48} height={48} alt="Logo" />
        <span className="hidden font-bold sm:inline-block">
          {/* {siteConfig.name} */}
        </span>
      </Link>
      {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items?.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? '#' : item.href}
              className={cn(
                'flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm',
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
                  ? 'text-foreground'
                  : 'text-foreground/60',
                item.disabled && 'cursor-not-allowed opacity-80'
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? (
          <Icons.close />
        ) : (
          <Image src="/passlogo-small.png" width={48} height={48} alt="Logo" />
        )}
        <span className="font-bold">Menu</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items}>{children}</MobileNav>
      )}
    </div>
  );
};

export default MainNav;