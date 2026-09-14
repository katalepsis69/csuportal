import { requireProfile } from '@/lib/auth';
import { RailNav } from '@/components/PortalNav';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="mx-auto flex max-w-7xl items-start gap-4 px-4 py-6 sm:px-6 lg:gap-6">
      <RailNav role={profile.role} fullName={profile.full_name} />
      <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
    </div>
  );
}
