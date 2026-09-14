import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { signOut } from '@/lib/actions/auth';
import { SideNav, TopNav } from '@/components/PortalNav';
import { IconSignOut } from '@/components/icons';

export const dynamic = 'force-dynamic';

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[rgba(216,106,18,0.2)] bg-canvas">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[22px] font-extrabold tracking-[0.03em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <img src="/csu-cetc-logo.png" alt="CSU CETC" className="h-7 w-7 object-contain" />
            <span>CSU <span className="text-brand">CETC</span></span>
          </Link>

          <TopNav role={profile.role} />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-full border border-subtle bg-panel px-3 py-1.5 text-[13px]">
              <div
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-brand text-xs font-bold text-canvas"
                aria-hidden="true"
              >
                {initials(profile.full_name)}
              </div>
              <span className="hidden font-medium sm:inline">{profile.full_name}</span>
              <span className="chip">{profile.role}</span>
            </div>
            <form action={signOut}>
              <button type="submit" className="btn-outline px-3 py-1.5 text-xs">
                <IconSignOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <SideNav role={profile.role} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
