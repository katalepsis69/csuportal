import { requireProfile } from '@/lib/auth';
import { RailNav } from '@/components/PortalNav';
import { ThemeProvider } from '@/components/ThemeProvider';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <ThemeProvider>
      <div className="flex w-full items-start gap-3 px-3 py-3 sm:px-4 sm:py-4 min-h-[100dvh]">
        <RailNav role={profile.role} fullName={profile.full_name} />
        <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
      </div>
    </ThemeProvider>
  );
}
