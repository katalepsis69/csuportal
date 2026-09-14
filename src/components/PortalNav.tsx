'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/actions/auth';
import type { Role } from '@/lib/auth';
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

// ponytail: one nav map for all four portals; desktop rail and mobile bar render it
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
    `flex h-11 w-11 items-center justify-center rounded-xl transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.97] ${
      active ? 'bg-brand font-bold text-canvas' : 'text-cream-muted hover:bg-panel hover:text-cream'
    }`;

  return (
    <>
      {/* Desktop slim rail — primary navigation */}
      <aside className="sticky top-3 hidden h-fit w-14 shrink-0 flex-col items-center justify-between self-start rounded-2xl border border-subtle bg-bg2/90 py-3 shadow-xl md:flex">
        <div className="flex flex-col items-center gap-3">
          <Link href="/" title="CSU CETC home" aria-label="CSU CETC home" className="flex h-9 w-9 items-center justify-center">
            <img src="/csu-cetc-logo.png" alt="" className="h-7 w-7 object-contain drop-shadow" />
          </Link>
          <div className="my-1 h-px w-8 bg-subtle/80" />
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

        <div className="flex w-full flex-col items-center gap-3 border-t border-subtle/80 pt-4">
          <div
            role="img"
            aria-label={fullName}
            title={fullName}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-panel2 text-xs font-bold text-cream"
          >
            {initials}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-cream-muted transition-[color,background-color,transform] duration-150 ease-out hover:bg-panel hover:text-cream active:scale-[0.97]"
            >
              <IconSignOutLine className="h-5 w-5" />
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-subtle bg-bg2/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur md:hidden"
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
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-cream-muted transition-[color,transform] duration-150 ease-out hover:text-cream active:scale-[0.97]"
          >
            <IconSignOutLine className="h-5 w-5" />
          </button>
        </form>
      </nav>
    </>
  );
}
