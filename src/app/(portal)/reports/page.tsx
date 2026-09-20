import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import type { Semester } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TYPES = [
  { key: 'department', label: 'Department Overview' },
  { key: 'faculty_detailed', label: 'Faculty Detailed' },
  { key: 'subject', label: 'Subject Report' },
  { key: 'sentiment', label: 'Sentiment Analysis' },
  { key: 'trend', label: 'Semester Trend' },
] as const;

type ReportType = (typeof TYPES)[number]['key'];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole('dean', 'admin');
  const sp = await searchParams;
  const type: ReportType = (
    typeof sp.type === 'string' && TYPES.some((t) => t.key === sp.type) ? sp.type : 'department'
  ) as ReportType;
  const sem = typeof sp.sem === 'string' && sp.sem ? sp.sem : null;
  const facultyId = typeof sp.faculty === 'string' && sp.faculty ? sp.faculty : null;

  const supabase = await createClient();
  const [{ data: semesters }, { data: faculty }] = await Promise.all([
    supabase.from('semesters').select('*').order('academic_year', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('role', 'faculty').order('full_name'),
  ]);
  const sems = (semesters ?? []) as unknown as Semester[];
  const semester = sems.find((s) => s.id === sem) ?? null;

  let pdf: { type: string; data: unknown; filename: string } | null = null;
  let preview: React.ReactNode = null;

  if (type === 'department') {
    const { data } = await supabase.rpc('rpc_dean_overview', { p_semester_id: sem });
    const label = semester ? `${semester.academic_year} ${semester.term}` : 'Current semester';
    pdf = { type: 'department', data: { overview: data, label }, filename: `department-overview.pdf` };
    const p = data?.participation ?? {};
    preview = (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Department overview — {label}</h2>
        <p className="text-sm text-muted-foreground">
          Participation {p.submitted ?? 0}/{p.enrolled ?? 0} · {p.total_evals ?? 0} evaluations ·{' '}
          {(data?.faculty ?? []).length} faculty
        </p>
      </div>
    );
  } else if (type === 'faculty_detailed') {
    if (facultyId && semester) {
      const { data } = await supabase.rpc('rpc_history', {
        p_academic_year: semester.academic_year,
        p_term: semester.term,
        p_subject_id: null,
        p_faculty_id: facultyId,
      });
      const name = (faculty ?? []).find((f) => f.id === facultyId)?.full_name ?? 'Faculty';
      const label = `${semester.academic_year} ${semester.term}`;
      pdf = {
        type: 'faculty_detailed',
        data: { facultyName: name, semesterLabel: label, detail: data },
        filename: `faculty-detailed-${name.replace(/\s+/g, '-')}.pdf`,
      };
      preview = (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            {name} — {label}
          </h2>
          <p className="text-sm text-muted-foreground">
            {(data?.per_question ?? []).length} questions aggregated ·{' '}
            {(data?.comments ?? []).length} comments
          </p>
        </div>
      );
    } else {
      preview = (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs text-sm text-muted-foreground">
          Pick a semester and a faculty member to generate the detailed report.
        </div>
      );
    }
  } else if (type === 'subject') {
    if (semester) {
      const { data } = await supabase.rpc('rpc_history', {
        p_academic_year: semester.academic_year,
        p_term: semester.term,
      });
      const label = `${semester.academic_year} ${semester.term}`;
      pdf = { type: 'subject', data: { rows: data, semesterLabel: label }, filename: 'subject-report.pdf' };
      preview = (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground">Subjects — {label}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase text-muted-foreground tracking-wider">
                  <th className="py-3 px-4 sm:px-5 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Subject</th>
                  <th className="py-3 px-4 font-semibold">Evals</th>
                  <th className="py-3 px-4 font-semibold">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data ?? []).map((r: { code?: string; name?: string; evals?: number; avg_rating?: number | null }, i: number) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 sm:px-5 font-medium text-foreground">{r.code}</td>
                    <td className="py-3 px-4 text-foreground">{r.name}</td>
                    <td className="py-3 px-4 text-muted-foreground tabular-nums">{r.evals}</td>
                    <td className="py-3 px-4 text-primary font-bold tabular-nums">{r.avg_rating?.toFixed(2) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  } else if (type === 'sentiment') {
    const { data } = await supabase.rpc('rpc_sentiment_report', { p_semester_id: sem });
    const label = semester ? `${semester.academic_year} ${semester.term}` : 'Current semester';
    pdf = { type: 'sentiment', data: { report: data, label }, filename: 'sentiment-report.pdf' };
    const c = data?.counts ?? {};
    preview = (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Sentiment — {label}</h2>
        <p className="text-sm text-muted-foreground">
          {c.positive ?? 0} positive · {c.neutral ?? 0} neutral · {c.negative ?? 0} negative ·{' '}
          {(data?.comments ?? []).length} total comments
        </p>
      </div>
    );
  } else if (type === 'trend') {
    const { data } = await supabase.rpc('rpc_semester_trend');
    pdf = { type: 'trend', data: { rows: data }, filename: 'semester-trend.pdf' };
    preview = (
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold text-foreground">Semester trend</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase text-muted-foreground tracking-wider">
                <th className="py-3 px-4 sm:px-5 font-semibold">Semester</th>
                <th className="py-3 px-4 font-semibold">Evals</th>
                <th className="py-3 px-4 font-semibold">Avg</th>
                <th className="py-3 px-4 font-semibold">Sentiment (+/−)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data ?? []).map(
                (
                  r: {
                    academic_year?: string;
                    term?: string;
                    evals?: number;
                    avg_rating?: number | null;
                    positive?: number;
                    negative?: number;
                  },
                  i: number
                ) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 sm:px-5 font-medium text-foreground">
                    {r.academic_year} {r.term}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground tabular-nums">{r.evals}</td>
                  <td className="py-3 px-4 text-primary font-bold tabular-nums">{r.avg_rating?.toFixed(2) ?? '—'}</td>
                  <td className="py-3 px-4 tabular-nums">
                    <span className="text-positive font-semibold">{r.positive}</span> /{' '}
                    <span className="text-destructive font-semibold">{r.negative}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold font-display tracking-tight text-foreground">Reports &amp; Analytics</h1>
        {pdf && <PdfDownloadButton type={pdf.type} data={pdf.data} filename={pdf.filename} />}
      </div>

      <form method="get" className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
        <div className="w-full sm:w-auto">
          <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Report type</label>
          <select
            name="type"
            defaultValue={type}
            className="w-full sm:w-52 rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
          >
            {TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {type !== 'trend' && (
          <div className="w-full sm:w-auto">
            <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Semester</label>
            <select
              name="sem"
              defaultValue={sem ?? ''}
              className="w-full sm:w-48 rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
            >
              <option value="">Current</option>
              {sems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.academic_year} {s.term}
                </option>
              ))}
            </select>
          </div>
        )}
        {type === 'faculty_detailed' && (
          <div className="w-full sm:w-auto">
            <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Faculty</label>
            <select
              name="faculty"
              defaultValue={facultyId ?? ''}
              className="w-full sm:w-48 rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
            >
              <option value="">— choose —</option>
              {(faculty ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[40px]"
          >
            Generate
          </button>
        </div>
      </form>

      {preview}
    </div>
  );
}
