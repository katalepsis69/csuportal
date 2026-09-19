import { requireProfile } from '@/lib/auth';
import { RailNav } from '@/components/PortalNav';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-background text-foreground">
      {/* Navigation: rail on desktop, drawer on mobile */}
      <RailNav role={profile.role} fullName={profile.full_name} />

      {/* Main content area (offset by desktop rail width) */}
      <div className="relative z-10 md:pl-64">
        <main className="mx-auto min-w-0 max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
