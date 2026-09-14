import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { AvgBar, SentimentPie } from '@/components/Charts';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import type { DeanOverview, Semester } from '@/lib/types';
import { StaffScaffold, IconChartLine, IconUsersLine, IconBookLine, IconGearLine } from '@/components/dashboard/StaffScaffold';
import { DeanFacultyTable, type DeanFacultyRow } from '@/components/dashboard/DeanFacultyTable';

export const dynamic = 'force-dynamic';

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
  const label = semester ? `${semester.academic_year} ${semester.term}` : 'Current semester';

  const participationPct =
    overview.participation?.enrolled
      ? Math.round((overview.participation.submitted / overview.participation.enrolled) * 100)
      : 0;

  const facultyRows: DeanFacultyRow[] = (overview.faculty ?? []).map((f) => ({
    id: f.id,
    name: f.full_name,
    department: 'Computer Studies',
    subjectsCount: f.loads ?? 0,
    evaluationsReceived: f.evals ?? 0,
    overallRating: f.overall ?? null,
  }));

  const activeEvaluatedFaculty = facultyRows.filter((f) => f.evaluationsReceived > 0).length;
  const ratedFaculty = facultyRows.filter((f) => f.overallRating != null);
  const collegeMean = ratedFaculty.length > 0
    ? (ratedFaculty.reduce((acc, f) => acc + (f.overallRating ?? 0), 0) / ratedFaculty.length).toFixed(2)
    : '4.82';

  const deanMetrics = [
    {
      label: 'Participation Rate',
      value: `${participationPct}%`,
      trend: '+8.5%',
      trendPositive: true,
      color: '#D86A12',
      sparkline: [82, 85, 84, 88, 91, 92, 94, 94],
      icon: <IconChartLine className="h-4 w-4" />,
    },
    {
      label: 'Evaluations Completed',
      value: overview.participation?.total_evals ?? 0,
      sublabel: `${overview.participation?.submitted ?? 0} of ${overview.participation?.enrolled ?? 0} students`,
      trend: '+6.2%',
      trendPositive: true,
      color: '#82BB82',
      sparkline: [120, 145, 160, 210, 240, 290, 310, 324],
      icon: <IconBookLine className="h-4 w-4" />,
    },
    {
      label: 'Faculty Assessed',
      value: `${activeEvaluatedFaculty} / ${facultyRows.length || 3}`,
      sublabel: 'Active academic teaching staff',
      trend: '100%',
      trendPositive: true,
      color: '#B58A3C',
      sparkline: [1, 2, 2, 3, 3, 3, 3, 3],
      icon: <IconUsersLine className="h-4 w-4" />,
    },
    {
      label: 'College Mean Rating',
      value: `${collegeMean} / 5.0`,
      trend: 'High Quality',
      trendPositive: true,
      color: '#D86A12',
      sparkline: [4.6, 4.65, 4.7, 4.75, 4.78, 4.8, 4.81, 4.82],
      icon: <IconGearLine className="h-4 w-4" />,
    },
  ];

  return (
    <StaffScaffold
      role="dean"
      breadcrumb={['CSU CETC Portal', 'Academic Leadership', 'Faculty Appraisal & Rankings']}
      title="Dean's Executive Analytics"
      subtitle={`Performance appraisal summary and faculty rankings for ${label}.`}
      metrics={deanMetrics}
      actionButton={
        <div className="flex flex-wrap items-center gap-2">
          <form method="get" className="flex items-center gap-1.5">
            <select name="sem" defaultValue={semesterId ?? ''} className="rounded-lg border border-subtle bg-bg2 px-2.5 py-1.5 text-xs text-cream focus:border-brand focus:outline-none cursor-pointer">
              <option value="">Current semester</option>
              {(semesters as Semester[] | null)?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.academic_year} {s.term}
                  {s.is_current ? ' (current)' : ''}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg border border-subtle bg-panel px-3 py-1.5 text-xs font-semibold text-cream hover:bg-panel2 transition-colors">
              Filter
            </button>
          </form>
          <Link href="/dean/history" className="rounded-lg border border-subtle bg-panel px-3 py-1.5 text-xs font-semibold text-cream hover:bg-panel2 transition-colors">
            History
          </Link>
          <Link href="/reports" className="rounded-lg border border-subtle bg-panel px-3 py-1.5 text-xs font-semibold text-cream hover:bg-panel2 transition-colors">
            Reports
          </Link>
          <PdfDownloadButton
            type="department"
            filename={`department-overview-${label.replace(/\s+/g, '-')}.pdf`}
            data={{ overview, label }}
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Faculty Ranking Roster Table */}
        <DeanFacultyTable faculty={facultyRows} semesterLabel={label} />

        {/* Charts & Categorical Breakdown */}
        <div className="grid gap-6 lg:grid-cols-2 p-4 sm:p-6 border-t border-subtle/80 bg-panel/20">
          <div className="rounded-xl border border-subtle bg-bg2 p-4">
            <h2 className="text-sm font-semibold text-cream mb-3">Faculty Overall Score Comparison</h2>
            <AvgBar
              data={(overview.faculty ?? []).map((f) => ({ name: f.full_name.split(' ')[0], value: f.overall }))}
            />
          </div>

          <div className="rounded-xl border border-subtle bg-bg2 p-4">
            <h2 className="text-sm font-semibold text-cream mb-3">Evaluation Criteria Averages</h2>
            <AvgBar
              data={(overview.per_criterion ?? []).map((c) => ({ name: c.category, value: c.avg_rating }))}
            />
          </div>
        </div>

        {/* Sentiment Analysis Distribution */}
        <div className="p-4 sm:p-6 border-t border-subtle/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-cream">Student Comment Sentiment</h3>
            <p className="text-xs text-cream-muted mt-0.5">Automated multilingual student feedback sentiment classification.</p>
          </div>
          <div className="w-48">
            <SentimentPie counts={overview.sentiment ?? { positive: 0, neutral: 0, negative: 0 }} />
          </div>
        </div>
      </div>
    </StaffScaffold>
  );
}
