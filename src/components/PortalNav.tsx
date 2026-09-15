'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/actions/auth';
import type { Role } from '@/lib/auth';
import { useTheme } from '@/components/ThemeProvider';
import { IconSun, IconMoon } from '@/components/icons';
import {
  IconBookLine,
  IconChartLine,
  IconClipboardLine,
  IconGaugeLine,
  IconGearLine,
  IconSignOutLine,
  IconUsersLine,
} from '@/components/dashboard/StaffScaffold';

type Item = { href: string; label: string; icon: React.ReactNode };

const NAV: Record<Role, Item[]> = {
  student: [
    { href: '/student', label: 'Dashboard', icon: <IconGaugeLine /> },
    { href: '/student#pending', label: 'Evaluate Faculty', icon: <IconClipboardLine /> },
  ],
  faculty: [{ href: '/faculty', label: 'My Results', icon: <IconChartLine /> }],
  dean: [
    { href: '/dean', label: 'Dashboard', icon: <IconGaugeLine /> },
    { href: '/dean/history', label: 'History & Archive', icon: <IconBookLine /> },
    { href: '/reports', label: 'Reports & PDF', icon: <IconChartLine /> },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard', icon: <IconGaugeLine /> },
    { href: '/admin?tab=users', label: 'Users Directory', icon: <IconUsersLine /> },
    { href: '/dean/history', label: 'History & Archive', icon: <IconBookLine /> },
    { href: '/reports', label: 'Reports & PDF', icon: <IconChartLine /> },
    { href: '/admin?tab=semesters', label: 'System Control', icon: <IconGearLine /> },
  ],
};

function useActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href.includes('?')) {
      const search = typeof window === 'undefined' ? '' : window.location.search;
      return pathname + search === href;
    }
    const base = href.split('#')[0];
    return pathname === base || (base !== '/' && pathname.startsWith(base + '/'));
  };
}

export function RailNav({ role, fullName }: { role: Role; fullName: string }) {
  const isActive = useActive();
  const { resolvedTheme, toggleTheme } = useTheme();
  const items = NAV[role];
  const initials =
    fullName
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const iconClass = (active: boolean) =>
    `flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 ease-out active:scale-[0.97] active:translate-y-[1px] ${
      active
        ? 'bg-brand font-bold text-white shadow-[0_0_16px_rgba(216,106,18,0.4)] ring-1 ring-brand-light/50'
        : 'text-cream-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-cream'
    }`;

  return (
    <>
      {/* Desktop frosted slim rail */}
      <aside className="sticky top-3 hidden h-fit w-14 shrink-0 flex-col items-center justify-between self-start rounded-2xl glass-panel py-3 shadow-beautiful-md md:flex z-30">
        <div className="flex flex-col items-center gap-2.5">
          <Link
            href="/"
            title="CSU CETC home"
            aria-label="CSU CETC home"
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform hover:scale-105"
          >
            <img src="/csu-cetc-logo.png" alt="" className="h-7 w-7 object-contain drop-shadow" />
          </Link>
          <div className="my-1 h-px w-8 bg-subtle" />
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={iconClass(isActive(item.href))}
            >
              {item.icon}
            </Link>
          ))}
        </div>

        <div className="flex w-full flex-col items-center gap-2.5 border-t border-subtle pt-3 mt-2">
          {/* Theme switcher toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-cream-muted transition-all duration-150 ease-out hover:bg-black/5 dark:hover:bg-white/5 hover:text-cream active:scale-[0.97]"
          >
            {resolvedTheme === 'dark' ? (
              <IconSun className="h-5 w-5 text-gold-text" />
            ) : (
              <IconMoon className="h-5 w-5 text-brand" />
            )}
          </button>

          {/* User initials */}
          <div
            role="img"
            aria-label={fullName}
            title={`${fullName} (${role.toUpperCase()})`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-panel2 text-xs font-bold text-cream border border-subtle"
          >
            {initials}
          </div>

          {/* Sign out */}
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-cream-muted transition-all duration-150 ease-out hover:bg-negative/10 hover:text-negative active:scale-[0.97]"
            >
              <IconSignOutLine className="h-5 w-5" />
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom frosted glass bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-glass-border glass-panel px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl md:hidden"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={iconClass(isActive(item.href))}
          >
            {item.icon}
          </Link>
        ))}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle light or dark theme"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-cream-muted transition-all duration-150 ease-out hover:text-cream active:scale-[0.97]"
        >
          {resolvedTheme === 'dark' ? (
            <IconSun className="h-5 w-5 text-gold-text" />
          ) : (
            <IconMoon className="h-5 w-5 text-brand" />
          )}
        </button>

        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-cream-muted transition-all duration-150 ease-out hover:text-negative active:scale-[0.97]"
          >
            <IconSignOutLine className="h-5 w-5" />
          </button>
        </form>
      </nav>
    </>
  );
}
