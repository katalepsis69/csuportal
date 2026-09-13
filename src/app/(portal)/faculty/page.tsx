import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import { AvgBar, SentimentPie } from '@/components/Charts';
import type { FacultyOverview, Semester } from '@/lib/types';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">My Results</h1>
          <p className="text-sm text-cream-muted">{semesterLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <form method="get" className="flex items-center gap-2">
            <select name="sem" defaultValue={semesterId ?? ''} className="input w-48">
              <option value="">All semesters</option>
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
          <PdfDownloadButton
            type="faculty"
            filename={`faculty-results-${semesterLabel.replace(/\s+/g, '-')}.pdf`}
            data={{ overview, facultyName: profile.full_name, semesterLabel }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs font-semibold tracking-wide text-cream-muted uppercase">Overall rating</p>
          <p className="mt-1 text-3xl font-semibold">
            {overview.overall != null ? overview.overall.toFixed(2) : '—'}
            <span className="text-base font-normal text-cream-faint"> / 5</span>
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold tracking-wide text-cream-muted uppercase">Evaluations received</p>
          <p className="mt-1 text-3xl font-semibold">{overview.per_question?.[0]?.responses ?? 0}</p>
          <p className="text-xs text-cream-faint">total answers per question</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold tracking-wide text-cream-muted uppercase">Sentiment</p>
          <p className="mt-1 text-sm text-cream-muted">
            {sentimentTotal === 0
              ? 'No comments yet'
              : `${Math.round(((overview.sentiment.positive ?? 0) / sentimentTotal) * 100)}% positive · ${Math.round(
                  ((overview.sentiment.negative ?? 0) / sentimentTotal) * 100,
                )}% negative`}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold">Average per question</h2>
          <AvgBar
            data={(overview.per_question ?? []).map((q) => ({
              name: `Q${q.sort_order}`,
              value: q.avg_rating,
            }))}
          />
          <table className="table mt-3">
            <tbody>
              {(overview.per_question ?? []).map((q) => (
                <tr key={q.id ?? q.text} className="border-b border-subtle">
                  <td className="td">
                    <span className="mr-2 rounded bg-panel2 px-1.5 py-0.5 text-xs text-cream-muted">
                      {q.category}
                    </span>
                    {q.text}
                  </td>
                  <td className="td text-right font-medium">{q.avg_rating?.toFixed(2) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold">Comment sentiment</h2>
          <SentimentPie counts={overview.sentiment ?? { positive: 0, neutral: 0, negative: 0 }} />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-sm font-semibold">Per subject / section</h2>
        <table className="table">
          <thead>
            <tr className="border-b border-subtle">
              <th className="th">Subject</th>
              <th className="th">Section</th>
              <th className="th">Evaluations</th>
              <th className="th">Average</th>
            </tr>
          </thead>
          <tbody>
            {(overview.per_subject ?? []).map((s) => (
              <tr key={`${s.subject_code}-${s.section_name}`} className="border-b border-subtle">
                <td className="td">
                  <span className="font-medium">{s.subject_code}</span> — {s.subject_name}
                </td>
                <td className="td">{s.section_name}</td>
                <td className="td">{s.evals}</td>
                <td className="td font-medium">{s.avg_rating?.toFixed(2) ?? '—'}</td>
              </tr>
            ))}
            {(overview.per_subject ?? []).length === 0 && (
              <tr>
                <td className="td text-cream-faint">No evaluations yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold">Student comments (anonymous)</h2>
        <div className="space-y-3">
          {(overview.comments ?? []).map((c, i) => (
            <div key={i} className="rounded-md border border-subtle bg-bg2 px-4 py-3">
              <p className="text-sm text-cream-dim">{c.comment}</p>
              <p className="mt-1 text-xs text-cream-faint">
                {new Date(c.at).toLocaleDateString()} ·{' '}
                <span
                  className={
                    c.label === 'positive'
                      ? 'text-positive'
                      : c.label === 'negative'
                        ? 'text-negative'
                        : 'text-cream-faint'
                  }
                >
                  {c.label ?? 'neutral'}
                </span>
              </p>
            </div>
          ))}
          {(overview.comments ?? []).length === 0 && (
            <p className="text-sm text-cream-faint">No comments yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
