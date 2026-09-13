import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { AvgBar, SentimentPie } from '@/components/Charts';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import Stagger, { StaggerItem } from '@/components/Stagger';
import type { DeanOverview, Semester } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Dean overview is the heaviest aggregate and contains no student identity,
 * so it is fetched with the service key and cached 60s under the 'evals' tag
 * (revalidated on every submitted evaluation). Role checks stay in the page.
 */
const getDeanOverview = unstable_cache(
  async (semesterId: string | null): Promise<DeanOverview> => {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data } = await supabase.rpc('rpc_dean_overview', { p_semester_id: semesterId });
    return (data ?? {}) as DeanOverview;
  },
  ['dean-overview'],
  { revalidate: 60, tags: ['evals'] },
);

export default async function DeanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole('dean', 'admin');
  const { sem } = await searchParams;
  const supabase = await createClient();

  const semesterId = typeof sem === 'string' ? sem : null;
  const [{ data: semesters }, overview] = await Promise.all([
    supabase.from('semesters').select('*').order('academic_year', { ascending: false }),
    getDeanOverview(semesterId),
  ]);
  const semester = overview.semester as Semester | null;
  const label = semester ? `${semester.academic_year} ${semester.term}` : 'No semester';

  const participationPct =
    overview.participation?.enrolled
      ? Math.round((overview.participation.submitted / overview.participation.enrolled) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Department Dashboard</h1>
          <p className="text-sm text-cream-muted">
            {label}
            {semester?.is_open ? ' · evaluation period open' : ' · period closed'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form method="get" className="flex items-center gap-2">
            <select name="sem" defaultValue={semesterId ?? ''} className="input w-48">
              <option value="">Current semester</option>
              {(semesters as Semester[] | null)?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.academic_year} {s.term}
                  {s.is_current ? ' (current)' : ''}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-outline px-3 py-1.5 text-xs">
              Filter
            </button>
          </form>
          <Link href="/dean/history" className="btn-outline px-3 py-1.5 text-xs">
            History
          </Link>
          <Link href="/reports" className="btn-outline px-3 py-1.5 text-xs">
            Reports
          </Link>
          <PdfDownloadButton
            type="department"
            filename={`department-overview-${label.replace(/\s+/g, '-')}.pdf`}
            data={{ overview, label }}
          />
        </div>
      </div>

      <Stagger className="grid gap-4 sm:grid-cols-4">
        <StaggerItem className="card card-hover">
          <p className="stat-label">Participation</p>
          <p className="stat-value">{participationPct}%</p>
          <p className="mt-1 text-xs text-cream-faint">
            {overview.participation?.submitted ?? 0} of {overview.participation?.enrolled ?? 0} students
          </p>
        </StaggerItem>
        <StaggerItem className="card card-hover">
          <p className="stat-label">Evaluations</p>
          <p className="stat-value">{overview.participation?.total_evals ?? 0}</p>
        </StaggerItem>
        <StaggerItem className="card card-hover">
          <p className="stat-label">Faculty evaluated</p>
          <p className="stat-value">
            {(overview.faculty ?? []).filter((f) => f.evals > 0).length}
            <span className="text-base font-normal text-cream-faint"> / {(overview.faculty ?? []).length}</span>
          </p>
        </StaggerItem>
        <StaggerItem className="card card-hover">
          <p className="stat-label">Comment sentiment</p>
          <div className="mt-2">
            <SentimentPie counts={overview.sentiment ?? { positive: 0, neutral: 0, negative: 0 }} />
          </div>
        </StaggerItem>
      </Stagger>

      <Stagger className="grid gap-4 lg:grid-cols-2">
        <StaggerItem className="card">
          <h2 className="panel-title">Faculty overall ranking</h2>
          <AvgBar
            data={(overview.faculty ?? []).map((f) => ({ name: f.full_name.split(' ')[0], value: f.overall }))}
          />
        </StaggerItem>
        <StaggerItem className="card">
          <h2 className="panel-title">Average per criterion</h2>
          <AvgBar
            data={(overview.per_criterion ?? []).map((c) => ({ name: c.category, value: c.avg_rating }))}
          />
        </StaggerItem>
      </Stagger>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-sm font-semibold">Faculty</h2>
        <table className="table">
          <thead>
            <tr className="border-b border-subtle">
              <th className="th">Name</th>
              <th className="th">Subject loads</th>
              <th className="th">Evaluations</th>
              <th className="th">Overall</th>
            </tr>
          </thead>
          <tbody>
            {(overview.faculty ?? []).map((f) => (
              <tr key={f.id} className="border-b border-subtle">
                <td className="td font-medium">{f.full_name}</td>
                <td className="td">{f.loads}</td>
                <td className="td">{f.evals}</td>
                <td className="td font-medium">{f.overall?.toFixed(2) ?? '—'}</td>
              </tr>
            ))}
            {(overview.faculty ?? []).length === 0 && (
              <tr>
                <td className="td text-cream-faint">No faculty profiles yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
