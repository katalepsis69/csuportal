import { requireProfile } from '@/lib/auth';
import { RailNav } from '@/components/PortalNav';
import { ThemeProvider } from '@/components/ThemeProvider';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <ThemeProvider>
      <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-canvas text-cream">
        {/* Ambient Golden/Amber Glow Layer behind canvas (Stitch Luxury Depth) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[650px] h-[520px] bg-brand/12 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 left-1/3 w-[450px] h-[350px] bg-brand/8 rounded-full blur-[120px]" />
        </div>

        {/* Executive Frosted Navigation (Hover-rail on desktop, hamburger drawer on mobile) */}
        <RailNav role={profile.role} fullName={profile.full_name} />

        {/* Main Content Area (Offset by desktop w-64 rail width) */}
        <div className="relative z-10 md:pl-64 transition-all duration-300">
          <main className="min-w-0 max-w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
