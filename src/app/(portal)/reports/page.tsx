/* eslint-disable @typescript-eslint/no-explicit-any */
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

  let pdf: { type: string; data: any; filename: string } | null = null;
  let preview: React.ReactNode = null;

  if (type === 'department') {
    const { data } = await supabase.rpc('rpc_dean_overview', { p_semester_id: sem });
    const label = semester ? `${semester.academic_year} ${semester.term}` : 'Current semester';
    pdf = { type: 'department', data: { overview: data, label }, filename: `department-overview.pdf` };
    const p = data?.participation ?? {};
    preview = (
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold">Department overview — {label}</h2>
        <p className="text-sm text-cream-muted">
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
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold">
            {name} — {label}
          </h2>
          <p className="text-sm text-cream-muted">
            {(data?.per_question ?? []).length} questions aggregated ·{' '}
            {(data?.comments ?? []).length} comments
          </p>
        </div>
      );
    } else {
      preview = (
        <div className="card text-sm text-cream-muted">
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
        <div className="card overflow-x-auto">
          <h2 className="mb-3 text-sm font-semibold">Subjects — {label}</h2>
          <table className="table">
            <thead>
              <tr className="border-b border-subtle">
                <th className="th">Code</th>
                <th className="th">Subject</th>
                <th className="th">Evals</th>
                <th className="th">Avg</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r: any, i: number) => (
                <tr key={i} className="border-b border-subtle">
                  <td className="td font-medium">{r.code}</td>
                  <td className="td">{r.name}</td>
                  <td className="td">{r.evals}</td>
                  <td className="td">{r.avg_rating?.toFixed(2) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  } else if (type === 'sentiment') {
    const { data } = await supabase.rpc('rpc_sentiment_report', { p_semester_id: sem });
    const label = semester ? `${semester.academic_year} ${semester.term}` : 'Current semester';
    pdf = { type: 'sentiment', data: { report: data, label }, filename: 'sentiment-report.pdf' };
    const c = data?.counts ?? {};
    preview = (
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold">Sentiment — {label}</h2>
        <p className="text-sm text-cream-muted">
          {c.positive ?? 0} positive · {c.neutral ?? 0} neutral · {c.negative ?? 0} negative ·{' '}
          {(data?.comments ?? []).length} total comments
        </p>
      </div>
    );
  } else if (type === 'trend') {
    const { data } = await supabase.rpc('rpc_semester_trend');
    pdf = { type: 'trend', data: { rows: data }, filename: 'semester-trend.pdf' };
    preview = (
      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-sm font-semibold">Semester trend</h2>
        <table className="table">
          <thead>
            <tr className="border-b border-subtle">
              <th className="th">Semester</th>
              <th className="th">Evals</th>
              <th className="th">Avg</th>
              <th className="th">Sentiment (+/−)</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r: any, i: number) => (
              <tr key={i} className="border-b border-subtle">
                <td className="td font-medium">
                  {r.academic_year} {r.term}
                </td>
                <td className="td">{r.evals}</td>
                <td className="td">{r.avg_rating?.toFixed(2) ?? '—'}</td>
                <td className="td">
                  <span className="text-positive">{r.positive}</span> /{' '}
                  <span className="text-negative">{r.negative}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Reports</h1>
        {pdf && <PdfDownloadButton type={pdf.type} data={pdf.data} filename={pdf.filename} />}
      </div>

      <form method="get" className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Report type</label>
          <select name="type" defaultValue={type} className="input w-52">
            {TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {type !== 'trend' && (
          <div>
            <label className="label">Semester</label>
            <select name="sem" defaultValue={sem ?? ''} className="input w-48">
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
          <div>
            <label className="label">Faculty</label>
            <select name="faculty" defaultValue={facultyId ?? ''} className="input w-48">
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
          <button type="submit" className="btn">
            Generate
          </button>
        </div>
      </form>

      {preview}
    </div>
  );
}
