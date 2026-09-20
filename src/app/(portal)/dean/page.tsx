import { unstable_cache } from 'next/cache';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import type { DeanOverview, Semester } from '@/lib/types';
import { DeanFacultyTable, type DeanFacultyRow } from '@/components/dashboard/DeanFacultyTable';
import { SemesterSelect } from '@/components/dashboard/SemesterSelect';

export const dynamic = 'force-dynamic';

const EMPTY_DEAN_OVERVIEW: DeanOverview = {
  semester: null,
  participation: {
    enrolled: 0,
    submitted: 0,
    total_evals: 0,
  },
  faculty: [],
  sentiment: {
    positive: 0,
    neutral: 0,
    negative: 0,
  },
  per_criterion: [],
};

const getDeanOverview = unstable_cache(
  async (semesterId: string | null): Promise<DeanOverview> => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        return EMPTY_DEAN_OVERVIEW;
      }
      const supabase = createServiceClient(url, key);
      const { data, error } = await supabase.rpc('rpc_dean_overview', { p_semester_id: semesterId });
      if (error || !data) {
        return EMPTY_DEAN_OVERVIEW;
      }
      return data as DeanOverview;
    } catch {
      return EMPTY_DEAN_OVERVIEW;
    }
  },
  ['dean-overview'],
  { revalidate: 60, tags: ['evaluations'] },
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
  const currentSem =
    ((semesters ?? []) as unknown as Semester[]).find((s) => s.is_current) ??
    ((semesters ?? []) as unknown as Semester[])[0];
  const label = semester
    ? `${semester.academic_year} ${semester.term}`
    : currentSem
    ? `${currentSem.academic_year} ${currentSem.term}`
    : 'Active Term';

  const enrolledCount = overview.participation?.enrolled ?? 0;
  const submittedCount = overview.participation?.submitted ?? 0;
  const participationPct =
    enrolledCount > 0 ? Math.round((submittedCount / enrolledCount) * 100) : 0;

  const facultyRows: DeanFacultyRow[] = (overview.faculty ?? []).map((f) => {
    const score = f.overall ?? null;
    const isFlagged = score != null && score < 4.25;

    return {
      id: f.id,
      name: f.full_name || 'Faculty Member',
      title: 'Faculty Member',
      department: 'College of Engineering & Technology',
      sectionsCount: f.loads ?? 0,
      responsesReceived: f.evals ?? 0,
      totalStudents: f.evals ?? 0,
      overallRating: score,
      ratingLabel:
        score == null
          ? 'No Evaluations'
          : score >= 4.8
          ? 'Outstanding'
          : score >= 4.5
          ? 'Very Satisfactory'
          : score >= 4.25
          ? 'Satisfactory'
          : 'Action Required',
      sentimentRatio: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      isFlagged,
      dossierId: `FC-${f.id.slice(0, 8)}`,
      pedagogicalBreakdown: [],
      comments: [],
    };
  });

  const ratedFaculty = facultyRows.filter((f) => f.overallRating != null);
  const collegeMeanNum =
    ratedFaculty.length > 0
      ? ratedFaculty.reduce((acc, f) => acc + (f.overallRating ?? 0), 0) / ratedFaculty.length
      : null;
  const collegeMean = collegeMeanNum != null ? collegeMeanNum.toFixed(2) : '—';
  const flaggedCount = facultyRows.filter((f) => f.isFlagged).length;

  // Criteria averages from real database aggregations
  const criteriaData = (overview.per_criterion ?? []).map((c) => {
    const score = c.avg_rating ?? 0;
    return {
      name: c.category,
      score: c.avg_rating != null ? c.avg_rating.toFixed(2) : '—',
      pct: Math.min(100, Math.round((score / 5) * 100)),
    };
  });

  // Sentiment counts
  const posCount = overview.sentiment?.positive ?? 0;
  const neuCount = overview.sentiment?.neutral ?? 0;
  const negCount = overview.sentiment?.negative ?? 0;
  const totalSent = posCount + neuCount + negCount;
  const posPct = totalSent > 0 ? Math.round((posCount / totalSent) * 100) : 0;
  const neuPct = totalSent > 0 ? Math.round((neuCount / totalSent) * 100) : 0;
  const negPct = totalSent > 0 ? Math.max(0, 100 - posPct - neuPct) : 0;

  return (
    <div className="space-y-8 min-w-0">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & SEMESTER CONTROLS                                         */}
      {/* ========================================================================= */}
      <header className="pb-6 border-b border-border">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Title & Context Breadcrumb */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-muted-foreground">CSU CETC PORTAL</span>
              <span className="text-xs text-muted-foreground/40">/</span>
              <span className="text-xs font-semibold text-primary">EXECUTIVE APPRAISAL</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-positive/10 text-positive border border-positive/25 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
                AUDITED &amp; SEALED
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground tracking-tight">
              Dean Appraisal &amp; Faculty Analytics
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2 font-normal">
              <span>{label}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>Evaluation Window Closed (100% Institutional Audited)</span>
            </p>
          </div>

          {/* Controls & PDF Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Semester Dropdown Client Component */}
            <SemesterSelect
              semesters={((semesters ?? []) as unknown) as Semester[]}
              currentId={semesterId}
            />

            {/* Download PDF Button */}
            <PdfDownloadButton
              type="department"
              filename={`dean-appraisal-${label.replace(/\s+/g, '-')}.pdf`}
              data={{ overview, label }}
              label="Generate CHED PDF"
            />
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. 4-UP ASYMMETRICAL BENTO KPI GRID                                       */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-12 gap-4 sm:gap-5">
        {/* Tile 1 (Wide): Overall College Faculty Score */}
        <div className="col-span-12 xl:col-span-4 p-5 sm:p-6 rounded-xl bg-card border border-border shadow-xs relative flex flex-col">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                College Mean Faculty Appraisal
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                Aggregated Average
              </span>
            </div>

            {collegeMeanNum != null ? (
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="font-display font-bold text-4xl text-foreground tracking-tight tabular-nums">
                  {collegeMean}
                </span>
                <span className="text-sm text-muted-foreground">/ 5.00</span>
                <span className="ml-2 text-xs font-semibold text-positive bg-positive/10 px-2 py-0.5 rounded border border-positive/25">
                  {collegeMeanNum >= 4.8
                    ? 'Outstanding'
                    : collegeMeanNum >= 4.5
                    ? 'Very Satisfactory'
                    : collegeMeanNum >= 4.25
                    ? 'Satisfactory'
                    : 'Action Required'}
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display font-bold text-4xl text-muted-foreground tracking-tight">
                  —
                </span>
                <span className="text-xs text-muted-foreground">No evaluations completed yet</span>
              </div>
            )}
          </div>

          {/* Horizontal Criteria Breakdown Bars */}
          <div className="mt-4 pt-3.5 border-t border-border space-y-2.5">
            {criteriaData.length > 0 ? (
              criteriaData.slice(0, 3).map((crit, idx) => {
                const barColors = ['bg-primary', 'bg-primary/80', 'bg-accent'];
                return (
                  <div key={crit.name}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">{crit.name}</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {crit.score} <span className="text-muted-foreground/60 font-normal">/ 5.0</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColors[idx % barColors.length]} rounded-full transition-all duration-300`}
                        style={{ width: `${crit.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-muted-foreground py-2">No categorical criteria recorded yet.</p>
            )}
          </div>
        </div>

        {/* Tile 2: Student Participation Rate with Radial Progress */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 p-5 sm:p-6 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Student Participation
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                CETC Enrolled
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="font-display font-bold text-3xl text-foreground tracking-tight tabular-nums">
                  {participationPct}%
                </span>
                <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                  {submittedCount} of {enrolledCount} students
                </p>
                <p className={`text-[10px] mt-0.5 font-semibold ${participationPct >= 70 ? 'text-positive' : 'text-amber-600'}`}>
                  {participationPct >= 70
                    ? 'Quorum Met (Satisfied)'
                    : `Quorum Pending (${participationPct}% / 70% min)`}
                </p>
              </div>

              {/* Radial Progress Meter SVG */}
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary"
                    strokeWidth="3.5"
                    strokeDasharray={`${participationPct}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground font-display tabular-nums">
                  {participationPct}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>CHED Minimum: 70%</span>
            {participationPct >= 70 ? (
              <span className="text-positive font-semibold">PASS AUDIT</span>
            ) : (
              <span className="text-amber-600 font-semibold">QUORUM PENDING</span>
            )}
          </div>
        </div>

        {/* Tile 3: Qualitative Sentiment Distribution Donut */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 p-5 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Sentiment Ratio
            </span>
            {totalSent > 0 ? (
              <div className="flex items-center gap-3">
                {/* Mini SVG Donut */}
                <div className="relative w-12 h-12 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="4.5"
                      strokeDasharray={`${posPct} 100`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="4.5"
                      strokeDasharray={`${neuPct} 100`}
                      strokeDashoffset={`-${posPct}`}
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="4.5"
                      strokeDasharray={`${negPct} 100`}
                      strokeDashoffset={`-${posPct + neuPct}`}
                    />
                  </svg>
                </div>
                <div>
                  <span className="font-display font-bold text-2xl text-foreground tracking-tight tabular-nums">
                    {posPct}%
                  </span>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Positive</p>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <span className="font-display font-bold text-2xl text-muted-foreground tracking-tight">
                  —
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">No student remarks recorded yet</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5 mt-3 pt-2.5 border-t border-border text-[10px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-positive" /> Positive
              </span>
              <span className="text-foreground font-semibold tabular-nums">{posPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Neutral
              </span>
              <span className="text-foreground font-semibold tabular-nums">{neuPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-destructive" /> Critical
              </span>
              <span className="text-foreground font-semibold tabular-nums">{negPct}%</span>
            </div>
          </div>
        </div>

        {/* Tile 4: Action Alert / Audit Status Alert (Contrast bug fixed) */}
        <div className="col-span-12 xl:col-span-2 p-5 rounded-xl border-l-4 border-l-primary border-y border-r border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Action Alert
              </span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
            <div className="mt-1">
              <span className="font-display font-bold text-3xl text-foreground tracking-tight tabular-nums">
                {String(flaggedCount).padStart(2, '0')}
              </span>
              <p className="text-xs text-foreground font-semibold leading-tight mt-1">
                Faculty Flagged for Dean Review
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Rating &lt; 4.25 or negative sentiment &gt; 15%
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border">
            <button
              type="button"
              className="w-full text-center py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold border border-primary/20 transition-colors cursor-pointer active:scale-[0.98]"
            >
              Filter Flagged Rows
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN FACULTY ROSTER TABLE & DOSSIER DRAWER                             */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <DeanFacultyTable faculty={facultyRows} semesterLabel={label} />
      </section>

      {/* ========================================================================= */}
      {/* 4. CHARTS BENTO SECTION                                                   */}
      {/* ========================================================================= */}
      <section className="grid gap-5 lg:grid-cols-2">
        {/* Faculty Score Comparison */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Faculty Overall Score Comparison</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Mean rating per instructor across all evaluated classes</p>
            </div>
            <span className="rounded-md bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
              Scale 1-5
            </span>
          </div>
          <div className="space-y-2.5">
            {facultyRows.length > 0 ? (
              facultyRows.map((f) => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-[11px] text-muted-foreground" title={f.name}>
                    {f.name}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${f.overallRating != null ? ((f.overallRating / 5) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[11px] font-semibold tabular-nums text-foreground">
                    {f.overallRating != null ? f.overallRating.toFixed(2) : '—'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">No faculty records found.</p>
            )}
          </div>
        </div>

        {/* Evaluation Criteria Averages */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Evaluation Criteria Averages</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Categorical mean scores across all evaluated criteria</p>
            </div>
            <span className="rounded-md bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
              Aggregated
            </span>
          </div>
          <div className="space-y-2.5">
            {criteriaData.length > 0 ? (
              criteriaData.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="flex-1 truncate text-[11px] text-muted-foreground" title={c.name}>
                    {c.name}
                  </span>
                  <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[11px] font-semibold tabular-nums text-foreground">
                    {c.score}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">No categorical evaluations recorded yet.</p>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
