import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { AvgBar, SentimentPie } from '@/components/Charts';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import { DbNotice } from '@/components/DbNotice';
import { semesterIsOpen, type DeanOverview, type Semester } from '@/lib/types';
import { DeanFacultyTable, type DeanFacultyRow } from '@/components/dashboard/DeanFacultyTable';

export const dynamic = 'force-dynamic';

/** Faculty scoring below this go to the dean's review queue. */
const FLAG_BELOW_REVIEW = 4.25;

function ratingLabel(score: number | null): string {
  if (score == null) return 'No data';
  if (score >= 4.8) return 'Outstanding';
  if (score >= 4.5) return 'Very Satisfactory';
  if (score >= FLAG_BELOW_REVIEW) return 'Satisfactory';
  return 'Action Required';
}

function pct(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

export default async function DeanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole('dean', 'admin');
  const { sem } = await searchParams;
  const supabase = await createClient();

  const semesterId = typeof sem === 'string' ? sem : null;
  const [
    { data: semesters, error: semestersError },
    { data, error },
  ] = await Promise.all([
    supabase.from('semesters').select('*').order('academic_year', { ascending: false }),
    supabase.rpc('rpc_dean_overview', { p_semester_id: semesterId }),
  ]);

  const loadError = semestersError ?? error;
  if (loadError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          Dean Appraisal &amp; Faculty Analytics
        </h1>
        <DbNotice detail={loadError.message} />
      </div>
    );
  }

  const overview = (data as DeanOverview | null) ?? null;
  const semestersList = (semesters ?? []) as Semester[];
  const current = semestersList.find((s) => s.is_current) ?? null;
  const semester = overview?.semester ?? current;

  const label = semester ? `${semester.academic_year} ${semester.term}` : 'No semester on record';
  const periodOpen = semester ? semesterIsOpen(semester) : false;

  const participation = overview?.participation ?? { enrolled: 0, submitted: 0, total_evals: 0 };
  const participationPct = pct(participation.submitted, participation.enrolled);

  const facultyRows: DeanFacultyRow[] = (overview?.faculty ?? []).map((f) => ({
    id: f.id,
    name: f.full_name,
    sectionsCount: f.loads,
    responsesReceived: f.evals,
    overallRating: f.overall,
    ratingLabel: ratingLabel(f.overall),
    isFlagged: f.overall != null && f.overall < FLAG_BELOW_REVIEW,
  }));
  const flaggedCount = facultyRows.filter((f) => f.isFlagged).length;

  const rated = facultyRows.filter((f) => f.overallRating != null);
  const collegeMean =
    rated.length > 0
      ? (rated.reduce((sum, f) => sum + (f.overallRating ?? 0), 0) / rated.length).toFixed(2)
      : null;

  const criteriaData = (overview?.per_criterion ?? []).map((c) => ({
    name: c.category,
    score: c.avg_rating != null ? c.avg_rating.toFixed(2) : null,
    pct: c.avg_rating != null ? Math.min(100, Math.round((c.avg_rating / 5) * 100)) : 0,
  }));

  const sentiment = overview?.sentiment ?? { positive: 0, neutral: 0, negative: 0 };
  const sentimentTotal = sentiment.positive + sentiment.neutral + sentiment.negative;
  const posPct = pct(sentiment.positive, sentimentTotal) ?? 0;
  const neuPct = pct(sentiment.neutral, sentimentTotal) ?? 0;
  const negPct = sentimentTotal > 0 ? Math.max(0, 100 - posPct - neuPct) : 0;

  const barColors = ['bg-brand', 'bg-gold', 'bg-positive'];
  const noData = facultyRows.length === 0;

  return (
    <div className="space-y-8 min-w-0 2xl:pr-[440px]">
      <header className="pb-6 border-b border-border">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">CSU CETC PORTAL</span>
              <span className="text-xs text-border">/</span>
              <span className="text-xs text-brand-text">EXECUTIVE APPRAISAL</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${
                  periodOpen
                    ? 'bg-positive/10 text-positive border-positive/25'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    periodOpen ? 'bg-positive animate-pulse' : 'bg-muted-foreground'
                  }`}
                />
                {periodOpen ? 'EVALUATION WINDOW OPEN' : 'EVALUATION WINDOW CLOSED'}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground tracking-tight">
              Dean Appraisal &amp; Faculty Analytics
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
              <span>{label}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>
                {participation.total_evals} evaluation{participation.total_evals === 1 ? '' : 's'} on record
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <form method="get" className="flex items-center gap-1.5">
              <select
                name="sem"
                defaultValue={semesterId ?? ''}
                className="appearance-none bg-card border border-border hover:border-brand/40 text-xs font-medium text-foreground px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-brand transition-colors cursor-pointer"
              >
                <option value="">Current semester</option>
                {semestersList.map((s) => (
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

            {overview && (
              <PdfDownloadButton
                type="department"
                filename={`dean-appraisal-${label.replace(/\s+/g, '-')}.pdf`}
                data={{ overview, label }}
                label="Download department report"
              />
            )}
          </div>
        </div>
      </header>

      {noData && (
        <div className="card text-center py-10">
          <p className="text-sm font-semibold text-foreground">No evaluation data yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Nothing has been submitted for {label}. These panels fill in as students submit.
          </p>
        </div>
      )}

      <section className="grid grid-cols-12 gap-5">
        {/* College mean */}
        <div className="col-span-12 xl:col-span-5 p-5 sm:p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              College Mean Faculty Appraisal
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand/10 text-brand-text border border-brand/30">
              {rated.length} rated faculty
            </span>
          </div>

          <div className="flex items-baseline gap-2.5 mt-1">
            <span className="font-display font-bold text-4xl text-foreground tracking-tight tabular-nums">
              {collegeMean ?? '—'}
            </span>
            <span className="text-sm text-muted-foreground">/ 5.00</span>
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              {ratingLabel(collegeMean ? Number(collegeMean) : null)}
            </span>
          </div>

          <div className="mt-4 pt-3.5 border-t border-border space-y-2.5">
            {criteriaData.slice(0, 4).map((crit, idx) => (
              <div key={crit.name}>
                <div className="flex justify-between text-[11px] mb-1 gap-2">
                  <span className="text-muted-foreground truncate">{crit.name}</span>
                  <span className="font-semibold text-foreground tabular-nums shrink-0">
                    {crit.score ?? '—'} <span className="text-muted-foreground">/ 5.0</span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColors[idx % barColors.length]} rounded-full`}
                    style={{ width: `${crit.pct}%` }}
                  />
                </div>
              </div>
            ))}
            {criteriaData.length === 0 && (
              <p className="text-[11px] text-muted-foreground">No criteria rated yet.</p>
            )}
          </div>
        </div>

        {/* Participation */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 p-5 sm:p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Student Participation
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                {participation.enrolled} enrolled
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div>
                <span className="font-display font-bold text-3xl text-foreground tracking-tight tabular-nums">
                  {participationPct != null ? `${participationPct}%` : '—'}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {participation.submitted} of {participation.enrolled} students
                </p>
                <p
                  className={`text-[10px] mt-0.5 font-medium ${
                    participationPct != null && participationPct >= 70
                      ? 'text-positive'
                      : 'text-muted-foreground'
                  }`}
                >
                  70% quorum {participationPct != null && participationPct >= 70 ? 'met' : 'not met'}
                </p>
              </div>

              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-border"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-brand"
                    strokeWidth="3.5"
                    strokeDasharray={`${participationPct ?? 0}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">
                  {participationPct != null ? `${participationPct}%` : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{participation.total_evals} evaluations</span>
            <span>{periodOpen ? 'Window open' : 'Window closed'}</span>
          </div>
        </div>

        {/* Sentiment ratio */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-2 p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
              Sentiment Ratio
            </span>
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--positive)"
                    strokeWidth="4.5"
                    strokeDasharray={`${posPct} 100`}
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--chart-neutral)"
                    strokeWidth="4.5"
                    strokeDasharray={`${neuPct} 100`}
                    strokeDashoffset={`-${posPct}`}
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--negative)"
                    strokeWidth="4.5"
                    strokeDasharray={`${negPct} 100`}
                    strokeDashoffset={`-${posPct + neuPct}`}
                  />
                </svg>
              </div>
              <div>
                <span className="font-display font-bold text-2xl text-foreground tracking-tight tabular-nums">
                  {sentimentTotal > 0 ? `${posPct}%` : '—'}
                </span>
                <p className="text-[10px] text-muted-foreground uppercase">Positive</p>
              </div>
            </div>
          </div>

          <div className="space-y-1 mt-3 pt-2 border-t border-border text-[10px]">
            {(
              [
                ['Positive', sentiment.positive, posPct, 'bg-positive'],
                ['Neutral', sentiment.neutral, neuPct, 'bg-muted-foreground'],
                ['Critical', sentiment.negative, negPct, 'bg-negative'],
              ] as const
            ).map(([name, count, share, dot]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${dot}`} /> {name}
                </span>
                <span className="text-foreground tabular-nums">
                  {count} ({share}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Review queue */}
        <div className="col-span-12 xl:col-span-2 p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Review Queue
              </span>
              {flaggedCount > 0 && <span className="w-2 h-2 rounded-full bg-negative animate-pulse" />}
            </div>
            <div className="mt-1">
              <span className="font-display font-bold text-3xl text-foreground tracking-tight tabular-nums">
                {String(flaggedCount).padStart(2, '0')}
              </span>
              <p className="text-xs text-muted-foreground leading-tight mt-1">
                Faculty rated below {FLAG_BELOW_REVIEW.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border">
            <a
              href="#roster"
              className="block w-full text-center py-1.5 rounded-lg bg-muted hover:bg-accent text-xs font-medium text-foreground transition-colors"
            >
              Jump to roster
            </a>
          </div>
        </div>
      </section>

      <section id="roster" className="space-y-4">
        <DeanFacultyTable
          faculty={facultyRows}
          semesterId={semester?.id ?? null}
          semesterLabel={label}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Faculty Score Comparison</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mean rating per instructor across evaluated classes
              </p>
            </div>
            <span className="rounded-md bg-muted px-2.5 py-1 text-[10px] text-muted-foreground border border-border">
              Scale 1-5
            </span>
          </div>
          <AvgBar
            data={(overview?.faculty ?? []).map((f) => ({
              name: f.full_name.split(' ')[0] ?? f.full_name,
              value: f.overall,
            }))}
          />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Criteria Averages</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mean score per evaluation criterion
              </p>
            </div>
            <span className="rounded-md bg-muted px-2.5 py-1 text-[10px] text-muted-foreground border border-border">
              Aggregated
            </span>
          </div>
          <AvgBar
            data={(overview?.per_criterion ?? []).map((c) => ({
              name: c.category,
              value: c.avg_rating,
            }))}
          />
        </div>
      </section>

      <section className="card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="max-w-md space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-positive" />
            <h3 className="text-sm font-semibold text-foreground">Student Feedback Sentiment</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Lexicon classification (English and Tagalog, including Taglish) of the optional comment
            field. Labels are computed server-side at submit, and comments are stored in a table with
            no link to the student who wrote them.
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs tabular-nums">
            <span className="text-positive font-semibold">{sentiment.positive} Positive</span>
            <span className="text-muted-foreground">{sentiment.neutral} Neutral</span>
            <span className="text-negative font-semibold">{sentiment.negative} Critical</span>
          </div>
        </div>
        <div className="w-52 shrink-0">
          <SentimentPie counts={sentiment} />
        </div>
      </section>
    </div>
  );
}
