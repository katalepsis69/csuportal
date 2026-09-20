import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import { SentimentPie } from '@/components/Charts';
import type { FacultyOverview, Semester } from '@/lib/types';
import {
  StaffScaffold,
  IconChartLine,
  IconBookLine,
  IconUsersLine,
  IconGearLine,
} from '@/components/dashboard/StaffScaffold';
import { FacultyClassesTable, type FacultySubjectRow } from '@/components/dashboard/FacultyClassesTable';
import { SemesterSelect } from '@/components/dashboard/SemesterSelect';

export const dynamic = 'force-dynamic';

const EMPTY_FACULTY_OVERVIEW: FacultyOverview = {
  overall: null,
  per_question: [],
  per_subject: [],
  sentiment: { positive: 0, neutral: 0, negative: 0 },
  comments: [],
};

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
  const overview = (data ?? EMPTY_FACULTY_OVERVIEW) as FacultyOverview;

  const semesterLabel =
    (semesters as Semester[] | null)?.find((s) => s.id === semesterId)
      ? `${(semesters as Semester[]).find((s) => s.id === semesterId)!.academic_year} ${(
          semesters as Semester[]
        ).find((s) => s.id === semesterId)!.term}`
      : 'Current Semester';

  const sentimentTotal =
    (overview.sentiment?.positive ?? 0) + (overview.sentiment?.neutral ?? 0) + (overview.sentiment?.negative ?? 0);
  const positivePct =
    sentimentTotal > 0
      ? Math.round(((overview.sentiment?.positive ?? 0) / sentimentTotal) * 100)
      : 0;

  const classes: FacultySubjectRow[] = (overview.per_subject ?? []).map((s) => ({
    subject_code: s.subject_code,
    subject_name: s.subject_name,
    section_name: s.section_name,
    evals: s.evals,
    avg_rating: s.avg_rating,
  }));

  const perQuestion = overview.per_question ?? [];
  const questionGroups = perQuestion.reduce<Record<string, typeof perQuestion>>(
    (acc, q) => {
      (acc[q.category] ??= []).push(q);
      return acc;
    },
    {},
  );

  const questionRatings = perQuestion.map((q) => q.avg_rating ?? 0).filter((r) => r > 0);
  const ratingSparkline = questionRatings.length > 0 ? questionRatings : [0, 0];

  const classEvals = (overview.per_subject ?? []).map((s) => s.evals);
  const classSparkline = classEvals.length > 0 ? classEvals : [0, 0];

  const sentimentSparkline = [
    overview.sentiment?.negative ?? 0,
    overview.sentiment?.neutral ?? 0,
    overview.sentiment?.positive ?? 0,
  ];

  const loadsSparkline = classes.length > 0 ? classes.map((c, i) => c.evals || i + 1) : [0, 0];
  const totalEvals = classes.reduce((sum, c) => sum + (c.evals ?? 0), 0);

  const facultyMetrics = [
    {
      label: 'Overall Appraisal Rating',
      value: overview.overall != null ? `${overview.overall.toFixed(2)} / 5.0` : '—',
      trend: overview.overall != null ? 'OFFICIAL' : 'PENDING',
      trendPositive: overview.overall != null,
      sublabel: 'Based on institutional rubric',
      color: '#881337',
      sparkline: ratingSparkline,
      icon: <IconChartLine className="h-4 w-4" />,
    },
    {
      label: 'Student Responses',
      value: overview.per_question?.[0]?.responses ?? totalEvals,
      trend: totalEvals > 0 ? 'RECEIVED' : 'ENROLLED',
      trendPositive: true,
      sublabel: 'Total answers submitted',
      color: '#15803d',
      sparkline: classSparkline,
      icon: <IconUsersLine className="h-4 w-4" />,
    },
    {
      label: 'Positive Sentiment',
      value: sentimentTotal > 0 ? `${positivePct}%` : '—',
      sublabel: `${overview.sentiment?.positive ?? 0} positive student remarks`,
      trend: sentimentTotal > 0 ? 'LOGGED' : 'PENDING',
      trendPositive: sentimentTotal > 0,
      color: '#b45309',
      sparkline: sentimentSparkline,
      icon: <IconBookLine className="h-4 w-4" />,
    },
    {
      label: 'Assigned Classes',
      value: `${classes.length} Sections`,
      trend: `${totalEvals} EVALS`,
      trendPositive: true,
      sublabel: 'Active teaching loads',
      color: '#881337',
      sparkline: loadsSparkline,
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
          <SemesterSelect
            semesters={(semesters ?? []) as Semester[]}
            currentId={semesterId}
          />
          <PdfDownloadButton
            type="faculty"
            filename={`faculty-results-${semesterLabel.replace(/\s+/g, '-')}.pdf`}
            data={{ overview, facultyName: profile.full_name, semesterLabel }}
            label="Download Appraisal PDF"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Classes Table */}
        <FacultyClassesTable classes={classes} />

        {/* Question-level score bar chart & Sentiment Bento */}
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          {/* Rubric Breakdown by Category */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Rubric Breakdown by Category</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Mean score per rubric question, grouped by category</p>
              </div>
              <span className="rounded-md bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
                Scale 1-5
              </span>
            </div>
            <div className="space-y-4">
              {Object.entries(questionGroups).map(([category, questions]) => {
                const mean =
                  questions.reduce((a, q) => a + (q.avg_rating ?? 0), 0) / questions.length;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">{category}</span>
                      <span className="text-xs font-bold text-primary tabular-nums">
                        {mean.toFixed(2)} <span className="text-muted-foreground/60 font-normal">mean</span>
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {questions.map((q) => (
                        <div key={q.id} className="flex items-center gap-3">
                          <span className="flex-1 text-[11px] text-muted-foreground truncate" title={q.text}>
                            {q.text}
                          </span>
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${((q.avg_rating ?? 0) / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-foreground tabular-nums w-8 text-right">
                            {(q.avg_rating ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {perQuestion.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No rubric responses recorded for this term.
                </p>
              )}
            </div>
          </div>

          {/* Student Feedback Sentiment */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Student Feedback Sentiment</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-2.5 py-0.5 text-[10px] font-semibold text-positive border border-positive/25">
                {positivePct}% Positive
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-40 shrink-0">
                <SentimentPie counts={overview.sentiment ?? { positive: 0, neutral: 0, negative: 0 }} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                {(overview.comments ?? []).slice(0, 2).map((c, i) => (
                  <p
                    key={i}
                    className="rounded-lg border border-border bg-muted/30 p-3 text-[11px] text-foreground leading-relaxed italic line-clamp-3"
                  >
                    &ldquo;{c.comment}&rdquo;
                  </p>
                ))}
                {sentimentTotal === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No comments submitted yet for this semester.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Anonymous Student Comments Roster */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Anonymous Student Commentary ({overview.comments?.length ?? 0})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Direct, unedited feedback from enrolled students across all class sections.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground/70 font-mono">Encrypted &amp; De-identified</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(overview.comments ?? []).slice(0, 10).map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-foreground leading-relaxed hover:border-primary/30 transition-colors italic"
              >
                &ldquo;{c.comment}&rdquo;
              </div>
            ))}
            {(overview.comments ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground col-span-2 py-4 text-center">
                No written comments recorded for this term.
              </p>
            )}
          </div>
        </div>
      </div>
    </StaffScaffold>
  );
}
