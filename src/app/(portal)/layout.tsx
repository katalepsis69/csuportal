import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { signOut } from '@/lib/actions/auth';
import type { Profile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const NAV: Record<Profile['role'], { href: string; label: string }[]> = {
  student: [{ href: '/student', label: 'My Evaluations' }],
  faculty: [{ href: '/faculty', label: 'My Results' }],
  dean: [
    { href: '/dean', label: 'Dashboard' },
    { href: '/dean/history', label: 'History' },
    { href: '/reports', label: 'Reports' },
  ],
  admin: [
    { href: '/admin', label: 'Admin' },
    { href: '/dean', label: 'Dashboard' },
    { href: '/reports', label: 'Reports' },
  ],
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-bold tracking-tight">
              CETC <span className="text-slate-400">Eval</span>
            </Link>
            <nav className="flex items-center gap-4">
              {NAV[profile.role].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {profile.full_name}{' '}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {profile.role}
              </span>
            </span>
            <form action={signOut}>
              <button type="submit" className="btn-outline px-3 py-1.5 text-xs">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
