import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import { AvgBar, SentimentPie } from '@/components/Charts';
import type { FacultyOverview, Semester } from '@/lib/types';
import {
  StaffScaffold,
  IconChartLine,
  IconBookLine,
  IconUsersLine,
  IconGearLine,
} from '@/components/dashboard/StaffScaffold';
import { FacultyClassesTable, type FacultySubjectRow } from '@/components/dashboard/FacultyClassesTable';

export const dynamic = 'force-dynamic';

export default async function FacultyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireRole('faculty');
  const { sem } = await searchParams;
  const supabase = await createClient();

  const semesterId = typeof sem === 'string' && sem ? sem : null;
  const [{ data: semesters }, { data, error }] = await Promise.all([
    supabase.from('semesters').select('*').order('academic_year', { ascending: false }),
    supabase.rpc('rpc_faculty_overview', { p_semester_id: semesterId }),
  ]);
  const overview = (error ? null : (data as FacultyOverview | null)) ?? {
    per_question: [],
    per_subject: [],
    sentiment: { positive: 0, neutral: 0, negative: 0 },
    comments: [],
    overall: null,
  };

  const semestersList = (semesters ?? []) as Semester[];
  const selected =
    semestersList.find((s) => s.id === semesterId) ??
    semestersList.find((s) => s.is_current) ??
    null;
  const semesterLabel = selected ? `${selected.academic_year} ${selected.term}` : 'All semesters';

  const sentiment = overview.sentiment ?? { positive: 0, neutral: 0, negative: 0 };
  const sentimentTotal = sentiment.positive + sentiment.neutral + sentiment.negative;
  const positivePct = sentimentTotal > 0 ? Math.round((sentiment.positive / sentimentTotal) * 100) : null;
  const responseCount = (overview.per_subject ?? []).reduce((sum, s) => sum + s.evals, 0);

  const classes: FacultySubjectRow[] = (overview.per_subject ?? []).map((s) => ({
    subject_code: s.subject_code,
    subject_name: s.subject_name,
    section_name: s.section_name,
    evals: s.evals,
    avg_rating: s.avg_rating,
  }));

  const metrics = [
    {
      label: 'Overall rating',
      value: overview.overall != null ? `${overview.overall.toFixed(2)} / 5.0` : '—',
      sublabel: 'Mean of all questions',
      color: 'var(--primary)',
      icon: <IconChartLine className="h-4 w-4" />,
    },
    {
      label: 'Student responses',
      value: String(responseCount),
      sublabel: 'Evaluations received',
      color: 'var(--positive)',
      icon: <IconUsersLine className="h-4 w-4" />,
    },
    {
      label: 'Positive sentiment',
      value: positivePct != null ? `${positivePct}%` : '—',
      sublabel:
        sentimentTotal > 0
          ? `${sentiment.positive} positive · ${sentiment.negative} critical of ${sentimentTotal} comments`
          : 'No comments yet',
      color: 'var(--gold)',
      icon: <IconBookLine className="h-4 w-4" />,
    },
    {
      label: 'Assigned classes',
      value: String(classes.length),
      sublabel: semesterLabel,
      color: 'var(--primary)',
      icon: <IconGearLine className="h-4 w-4" />,
    },
  ];

  const noData = responseCount === 0;

  return (
    <StaffScaffold
      breadcrumb={['CSU CETC Portal', 'Faculty Space', 'My evaluation results']}
      title="Teaching performance and feedback"
      subtitle={`Student evaluation summaries for ${semesterLabel}. Results appear only after students submit; comments carry no identifying information. ${profile.full_name}`}
      metrics={metrics}
      actionButton={
        <div className="flex flex-wrap items-center gap-2">
          <form method="get" className="flex items-center gap-1.5">
            <select
              name="sem"
              defaultValue={semesterId ?? ''}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary cursor-pointer min-h-[36px]"
            >
              <option value="">All semesters</option>
              {semestersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.academic_year} {s.term}
                  {s.is_current ? ' (current)' : ''}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors min-h-[36px]"
            >
              Filter
            </button>
          </form>
          <PdfDownloadButton
            type="faculty"
            filename={`faculty-results-${semesterLabel.replace(/\s+/g, '-')}.pdf`}
            data={{ overview, facultyName: profile.full_name, semesterLabel }}
            label="Download results PDF"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {noData && (
          <div className="card text-center py-10">
            <p className="text-sm font-semibold text-foreground">No results yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Nothing has been submitted for {semesterLabel}. Your scores and comments appear here
              once your students complete their evaluations.
            </p>
          </div>
        )}

        <FacultyClassesTable classes={classes} />

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Average rating per question</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Mean score for each rubric question</p>
              </div>
              <span className="rounded-md bg-muted px-2.5 py-0.5 text-[10px] text-muted-foreground border border-border">
                Scale 1-5
              </span>
            </div>
            <AvgBar
              data={(overview.per_question ?? []).map((q) => ({
                name: `Q${q.sort_order}`,
                value: q.avg_rating,
              }))}
            />
          </div>

          <div className="card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-foreground">Student feedback sentiment</h2>
                {positivePct != null && (
                  <span className="inline-flex items-center rounded-full bg-positive/10 px-2 py-0.5 text-[10px] text-positive border border-positive/25">
                    {positivePct}% positive
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {sentimentTotal === 0
                  ? 'No comments submitted for this period.'
                  : `${sentiment.positive} positive · ${sentiment.neutral} neutral · ${sentiment.negative} critical`}
              </p>
            </div>
            <div className="w-full h-36 flex items-center justify-center">
              <SentimentPie counts={sentiment} />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Anonymous student comments ({overview.comments?.length ?? 0})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Written feedback as submitted. Names are never attached to comments.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">Identity-free by schema</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(overview.comments ?? []).slice(0, 20).map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-foreground leading-relaxed"
              >
                <span
                  className={`inline-block mb-2 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase border ${
                    c.label === 'positive'
                      ? 'bg-positive/10 text-positive border-positive/20'
                      : c.label === 'negative'
                        ? 'bg-negative/10 text-negative border-negative/20'
                        : 'bg-card text-muted-foreground border-border'
                  }`}
                >
                  {c.label ?? 'neutral'}
                </span>
                <p>{c.comment}</p>
              </div>
            ))}
            {(overview.comments ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground col-span-2 py-4 text-center">
                No written comments recorded for this period.
              </p>
            )}
          </div>
        </div>
      </div>
    </StaffScaffold>
  );
}
