'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/lib/auth';
import {
  IconChartPie,
  IconClipboardText,
  IconFileText,
  IconGauge,
  IconGear,
  IconHistory,
  IconUsers,
} from '@/components/icons';

type Item = { href: string; label: string; icon: React.ReactNode };

const SIDE: Record<Role, { section: string; items: Item[] }[]> = {
  student: [
    {
      section: 'Main',
      items: [
        { href: '/student', label: 'Dashboard', icon: <IconGauge /> },
        { href: '/student#pending', label: 'Evaluate Faculty', icon: <IconClipboardText /> },
      ],
    },
  ],
  faculty: [
    {
      section: 'Main',
      items: [{ href: '/faculty', label: 'My Results', icon: <IconChartPie /> }],
    },
  ],
  dean: [
    {
      section: 'Main',
      items: [{ href: '/dean', label: 'Dashboard', icon: <IconGauge /> }],
    },
    {
      section: 'Analytics',
      items: [
        { href: '/dean/history', label: 'History', icon: <IconHistory /> },
        { href: '/reports', label: 'Reports', icon: <IconFileText /> },
      ],
    },
  ],
  admin: [
    {
      section: 'Main',
      items: [
        { href: '/admin', label: 'Admin', icon: <IconGear /> },
        { href: '/dean', label: 'Dashboard', icon: <IconUsers /> },
      ],
    },
    {
      section: 'Analytics',
      items: [{ href: '/reports', label: 'Reports', icon: <IconFileText /> }],
    },
  ],
};

function useActive() {
  const pathname = usePathname();
  return (href: string) => {
    const base = href.split('#')[0];
    return pathname === base || (base !== '/' && pathname.startsWith(base + '/'));
  };
}

export function SideNav({ role }: { role: Role }) {
  const isActive = useActive();
  return (
    <aside className="sticky top-[73px] hidden h-fit w-60 shrink-0 self-start rounded-xl border border-subtle bg-panel p-3 md:block">
      {SIDE[role].map((group) => (
        <div key={group.section}>
          <div className="side-section-h">{group.section}</div>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`side-link ${isActive(item.href) ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}

export function TopNav({ role }: { role: Role }) {
  const isActive = useActive();
  const items = SIDE[role].flatMap((g) => g.items);
  return (
    <nav
      className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto md:gap-7"
      aria-label="Primary"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link shrink-0 ${isActive(item.href) ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
