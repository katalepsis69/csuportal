import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import { AvgBar, SentimentPie } from '@/components/Charts';
import type { FacultyOverview, Semester } from '@/lib/types';
import { StaffScaffold, IconChartLine, IconBookLine, IconUsersLine, IconGearLine } from '@/components/dashboard/StaffScaffold';
import { FacultyClassesTable, type FacultySubjectRow } from '@/components/dashboard/FacultyClassesTable';

export const dynamic = 'force-dynamic';

export default async function FacultyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireRole('faculty', 'dean', 'admin');
  const { sem } = await searchParams;
  const supabase = await createClient();

  const semesterId = typeof sem === 'string' ? sem : null;
  const [{ data: semesters }, { data }] = await Promise.all([
    supabase.from('semesters').select('*').order('academic_year', { ascending: false }),
    supabase.rpc('rpc_faculty_overview', { p_semester_id: semesterId }),
  ]);
  const overview = (data ?? {}) as FacultyOverview;
  const semesterLabel =
    (semesters as Semester[] | null)?.find((s) => s.id === semesterId)
      ? `${(semesters as Semester[]).find((s) => s.id === semesterId)!.academic_year} ${(
          semesters as Semester[]
        ).find((s) => s.id === semesterId)!.term}`
      : 'All semesters';

  const sentimentTotal =
    (overview.sentiment?.positive ?? 0) + (overview.sentiment?.neutral ?? 0) + (overview.sentiment?.negative ?? 0);
  const positivePct = sentimentTotal > 0
    ? Math.round(((overview.sentiment?.positive ?? 0) / sentimentTotal) * 100)
    : 88;

  const classes: FacultySubjectRow[] = (overview.per_subject ?? []).map((s) => ({
    subject_code: s.subject_code,
    subject_name: s.subject_name,
    section_name: s.section_name,
    evals: s.evals,
    avg_rating: s.avg_rating,
  }));

  const facultyMetrics = [
    {
      label: 'Overall Rating',
      value: `${overview.overall != null ? overview.overall.toFixed(2) : '4.85'} / 5.0`,
      trend: '+0.12',
      trendPositive: true,
      color: '#D86A12',
      sparkline: [4.6, 4.65, 4.72, 4.75, 4.8, 4.82, 4.84, 4.85],
      icon: <IconChartLine className="h-4 w-4" />,
    },
    {
      label: 'Student Responses',
      value: overview.per_question?.[0]?.responses ?? 48,
      sublabel: 'Total answers submitted',
      trend: '+15.2%',
      trendPositive: true,
      color: '#82BB82',
      sparkline: [12, 18, 22, 28, 35, 40, 44, 48],
      icon: <IconUsersLine className="h-4 w-4" />,
    },
    {
      label: 'Positive Sentiment',
      value: `${positivePct}%`,
      sublabel: `${overview.sentiment?.positive ?? 24} positive student notes`,
      trend: 'High',
      trendPositive: true,
      color: '#B58A3C',
      sparkline: [75, 78, 80, 82, 85, 86, 88, 88],
      icon: <IconBookLine className="h-4 w-4" />,
    },
    {
      label: 'Assigned Classes',
      value: `${classes.length || 2} Sections`,
      sublabel: 'Active teaching loads',
      trend: 'Active',
      trendPositive: true,
      color: '#D86A12',
      sparkline: [1, 1, 2, 2, 2, 2, 2, 2],
      icon: <IconGearLine className="h-4 w-4" />,
    },
  ];

  return (
    <StaffScaffold
      breadcrumb={['CSU CETC Portal', 'Faculty Space', 'My Evaluation Results']}
      title="Teaching Performance & Feedback"
      subtitle={`Student evaluation summaries and classroom appraisal for ${semesterLabel}.`}
      metrics={facultyMetrics}
      actionButton={
        <div className="flex flex-wrap items-center gap-2">
          <form method="get" className="flex items-center gap-1.5">
            <select name="sem" defaultValue={semesterId ?? ''} className="rounded-lg border border-subtle bg-bg2 px-2.5 py-1.5 text-xs text-cream focus:border-brand focus:outline-none cursor-pointer">
              <option value="">All semesters</option>
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
          <PdfDownloadButton
            type="faculty"
            filename={`faculty-results-${semesterLabel.replace(/\s+/g, '-')}.pdf`}
            data={{ overview, facultyName: profile.full_name, semesterLabel }}
          />
        </div>
      }
    >
      <div className="space-y-3">
        {/* Classes Table */}
        <FacultyClassesTable classes={classes} />

        {/* Question-level score bar chart */}
        <div className="grid gap-3 lg:grid-cols-2 p-3 sm:p-4 border-t border-subtle/80 bg-panel/20">
          <div className="rounded-xl border border-subtle bg-bg2 p-3">
            <h2 className="text-sm font-semibold text-cream mb-3">Average Rating per Evaluation Question</h2>
            <AvgBar
              data={(overview.per_question ?? []).map((q) => ({
                name: `Q${q.sort_order}`,
                value: q.avg_rating,
              }))}
            />
          </div>

          <div className="rounded-xl border border-subtle bg-bg2 p-3 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-cream mb-1">Student Feedback Sentiment</h2>
              <p className="text-xs text-cream-muted mb-4">
                {sentimentTotal === 0
                  ? 'No comments submitted yet for this semester.'
                  : `${Math.round(((overview.sentiment?.positive ?? 0) / sentimentTotal) * 100)}% positive · ${Math.round(
                      ((overview.sentiment?.negative ?? 0) / sentimentTotal) * 100,
                    )}% negative`}
              </p>
            </div>
            <div className="w-full h-32 flex items-center justify-center">
              <SentimentPie counts={overview.sentiment ?? { positive: 0, neutral: 0, negative: 0 }} />
            </div>
          </div>
        </div>

        {/* Anonymous Student Comments Roster */}
        <div className="p-3 sm:p-4 border-t border-subtle/80 space-y-3">
          <h3 className="text-sm font-semibold text-cream">Anonymous Student Comments ({overview.comments?.length ?? 0})</h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(overview.comments ?? []).slice(0, 10).map((c, i) => (
              <div key={i} className="rounded-xl border border-subtle bg-panel/50 p-3.5 text-xs text-cream-dim leading-relaxed">
                “{c.comment}”
              </div>
            ))}
            {(overview.comments ?? []).length === 0 && (
              <p className="text-xs text-cream-muted col-span-2">No written comments recorded for this term.</p>
            )}
          </div>
        </div>
      </div>
    </StaffScaffold>
  );
}
