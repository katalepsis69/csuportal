import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { AvgBar, SentimentPie } from '@/components/Charts';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import type { DeanOverview, Semester } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DeanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole('dean', 'admin');
  const { sem } = await searchParams;
  const supabase = await createClient();

  const semesterId = typeof sem === 'string' ? sem : null;
  const [{ data: semesters }, { data }] = await Promise.all([
    supabase.from('semesters').select('*').order('academic_year', { ascending: false }),
    supabase.rpc('rpc_dean_overview', { p_semester_id: semesterId }),
  ]);
  const overview = (data ?? {}) as DeanOverview;
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
          <p className="text-sm text-slate-500">
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

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Participation</p>
          <p className="mt-1 text-3xl font-semibold">{participationPct}%</p>
          <p className="text-xs text-slate-400">
            {overview.participation?.submitted ?? 0} of {overview.participation?.enrolled ?? 0} students
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Evaluations</p>
          <p className="mt-1 text-3xl font-semibold">{overview.participation?.total_evals ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Faculty evaluated</p>
          <p className="mt-1 text-3xl font-semibold">
            {(overview.faculty ?? []).filter((f) => f.evals > 0).length}
            <span className="text-base font-normal text-slate-400"> / {(overview.faculty ?? []).length}</span>
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Comment sentiment</p>
          <div className="mt-2">
            <SentimentPie counts={overview.sentiment ?? { positive: 0, neutral: 0, negative: 0 }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold">Faculty overall ranking</h2>
          <AvgBar
            data={(overview.faculty ?? []).map((f) => ({ name: f.full_name.split(' ')[0], value: f.overall }))}
          />
        </div>
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold">Average per criterion</h2>
          <AvgBar
            data={(overview.per_criterion ?? []).map((c) => ({ name: c.category, value: c.avg_rating }))}
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-sm font-semibold">Faculty</h2>
        <table className="table">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="th">Name</th>
              <th className="th">Subject loads</th>
              <th className="th">Evaluations</th>
              <th className="th">Overall</th>
            </tr>
          </thead>
          <tbody>
            {(overview.faculty ?? []).map((f) => (
              <tr key={f.id} className="border-b border-slate-100">
                <td className="td font-medium">{f.full_name}</td>
                <td className="td">{f.loads}</td>
                <td className="td">{f.evals}</td>
                <td className="td font-medium">{f.overall?.toFixed(2) ?? '—'}</td>
              </tr>
            ))}
            {(overview.faculty ?? []).length === 0 && (
              <tr>
                <td className="td text-slate-400">No faculty profiles yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
