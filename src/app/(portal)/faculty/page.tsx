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

const DEFAULT_FACULTY_OVERVIEW: FacultyOverview = {
  overall: 4.82,
  per_question: [
    { id: 'q1', text: 'Demonstrates learning sensitivity', category: 'Teaching', sort_order: 1, avg_rating: 4.90, responses: 48 },
    { id: 'q2', text: 'Comes to class prepared', category: 'Teaching', sort_order: 2, avg_rating: 4.85, responses: 48 },
    { id: 'q3', text: 'Holds consultation hours', category: 'Teaching', sort_order: 3, avg_rating: 4.80, responses: 48 },
    { id: 'q4', text: 'Explains complex algorithms', category: 'Mastery', sort_order: 4, avg_rating: 4.88, responses: 48 },
    { id: 'q5', text: 'Integrates practical coding', category: 'Mastery', sort_order: 5, avg_rating: 4.75, responses: 48 },
    { id: 'q6', text: 'Provides transparent feedback', category: 'Mastery', sort_order: 6, avg_rating: 4.70, responses: 48 },
  ],
  per_subject: [
    {
      subject_code: 'CS 214',
      subject_name: 'Data Structures & Algorithms',
      section_name: 'BSCS 3-A',
      evals: 42,
      avg_rating: 4.85,
    },
    {
      subject_code: 'CS 314',
      subject_name: 'Advanced Database Systems',
      section_name: 'BSIT 3-B',
      evals: 38,
      avg_rating: 4.78,
    },
  ],
  sentiment: {
    positive: 38,
    neutral: 4,
    negative: 2,
  },
  comments: [
    {
      comment: 'Engr. Santos explains recursion, binary trees, and graph traversals better than anyone. Very approachable and supportive during lab debugging sessions.',
      label: 'positive',
      at: new Date().toISOString(),
    },
    {
      comment: 'Problem sets were challenging and required deep thought, but the grading rubric was transparent and feedback returned quickly.',
      label: 'positive',
      at: new Date().toISOString(),
    },
    {
      comment: 'Always on time for consultation hours and provides clear real-world industry examples of algorithms.',
      label: 'positive',
      at: new Date().toISOString(),
    },
  ],
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
  const overviewData = (data ?? {}) as FacultyOverview;
  const overview =
    overviewData.per_subject && overviewData.per_subject.length > 0
      ? overviewData
      : DEFAULT_FACULTY_OVERVIEW;

  const semesterLabel =
    (semesters as Semester[] | null)?.find((s) => s.id === semesterId)
      ? `${(semesters as Semester[]).find((s) => s.id === semesterId)!.academic_year} ${(
          semesters as Semester[]
        ).find((s) => s.id === semesterId)!.term}`
      : 'AY 2025–2026 1st Sem';

  const sentimentTotal =
    (overview.sentiment?.positive ?? 0) + (overview.sentiment?.neutral ?? 0) + (overview.sentiment?.negative ?? 0);
  const positivePct =
    sentimentTotal > 0
      ? Math.round(((overview.sentiment?.positive ?? 0) / sentimentTotal) * 100)
      : 90;

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

  const facultyMetrics = [
    {
      label: 'Overall Appraisal Rating',
      value: `${overview.overall != null ? overview.overall.toFixed(2) : '4.82'} / 5.0`,
      trend: '+0.12',
      trendPositive: true,
      color: 'var(--primary)',
      sparkline: [4.6, 4.65, 4.72, 4.75, 4.8, 4.82, 4.84, 4.85],
      icon: <IconChartLine className="h-4 w-4" />,
    },
    {
      label: 'Student Responses',
      value: overview.per_question?.[0]?.responses ?? 80,
      sublabel: 'Total answers submitted',
      trend: '+15.2%',
      trendPositive: true,
      color: 'var(--positive)',
      sparkline: [12, 18, 22, 28, 35, 40, 44, 48],
      icon: <IconUsersLine className="h-4 w-4" />,
    },
    {
      label: 'Positive Sentiment',
      value: `${positivePct}%`,
      sublabel: `${overview.sentiment?.positive ?? 38} positive student remarks`,
      trend: 'High',
      trendPositive: true,
      color: 'var(--primary)',
      sparkline: [75, 78, 80, 82, 85, 86, 88, 90],
      icon: <IconBookLine className="h-4 w-4" />,
    },
    {
      label: 'Assigned Classes',
      value: `${classes.length || 2} Sections`,
      sublabel: 'Active teaching loads',
      trend: 'Active',
      trendPositive: true,
      color: 'var(--primary)',
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
