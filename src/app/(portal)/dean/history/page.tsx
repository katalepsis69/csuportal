import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { HistoryRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Level = 'years' | 'terms' | 'subjects' | 'faculty' | 'detail';

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole('dean', 'admin');
  const sp = await searchParams;
  const ay = typeof sp.ay === 'string' && sp.ay ? sp.ay : null;
  const term = typeof sp.term === 'string' && sp.term ? (sp.term as '1st' | '2nd' | 'midyear') : null;
  const subject = typeof sp.subject === 'string' && sp.subject ? sp.subject : null;
  const faculty = typeof sp.faculty === 'string' && sp.faculty ? sp.faculty : null;

  const supabase = await createClient();
  const { data } = await supabase.rpc('rpc_history', {
    p_academic_year: ay,
    p_term: term,
    p_subject_id: subject,
    p_faculty_id: faculty,
  });
  const payload = (data ?? []) as unknown;
  const rows = Array.isArray(payload) ? (payload as HistoryRow[]) : [];
  const detail = !Array.isArray(payload)
    ? (payload as { per_question: HistoryRow[]; comments: HistoryRow[] })
    : { per_question: [], comments: [] };

  const level: Level = !ay
    ? 'years'
    : !term
      ? 'terms'
      : !subject
        ? 'subjects'
        : !faculty
          ? 'faculty'
          : 'detail';

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (ay) p.set('ay', ay);
    if (term) p.set('term', term);
    if (subject) p.set('subject', subject);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    const s = p.toString();
    return s ? `/dean/history?${s}` : '/dean/history';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Evaluation History</h1>
        <nav className="mt-1 flex flex-wrap items-center gap-1 text-sm text-slate-500">
          <Link href="/dean/history" className="hover:text-slate-900">
            Academic years
          </Link>
          {ay && (
            <>
              <span>›</span>
              <Link href={qs({ term: '', subject: '', faculty: '' })} className="hover:text-slate-900">
                {ay}
              </Link>
            </>
          )}
          {term && (
            <>
              <span>›</span>
              <Link href={qs({ subject: '', faculty: '' })} className="hover:text-slate-900">
                {term} semester
              </Link>
            </>
          )}
          {subject && (
            <>
              <span>›</span>
              <Link href={qs({ faculty: '' })} className="hover:text-slate-900">
                Subject {String(rows[0]?.code ?? subject).slice(0, 8)}
              </Link>
            </>
          )}
          {faculty && (
            <>
              <span>›</span>
              <span className="text-slate-900">Faculty detail</span>
            </>
          )}
        </nav>
      </div>

      {level !== 'detail' ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="border-b border-slate-200">
                {level === 'years' && <th className="th">Academic year</th>}
                {level === 'terms' && <th className="th">Semester</th>}
                {(level === 'subjects' || level === 'faculty') && <th className="th">Code</th>}
                {level === 'subjects' && <th className="th">Subject</th>}
                {level === 'faculty' && <th className="th">Faculty / Section</th>}
                <th className="th">Evaluations</th>
                <th className="th">Average</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                let href: string;
                if (level === 'years') {
                  href = qs({ ay: String(r.academic_year), term: '', subject: '', faculty: '' });
                } else if (level === 'terms') {
                  href = qs({ term: String(r.term), subject: '', faculty: '' });
                } else if (level === 'subjects') {
                  href = qs({ subject: String(r.subject_id), faculty: '' });
                } else if (level === 'faculty') {
                  href = qs({ faculty: String(r.faculty_id) });
                }
                return (
                  <tr key={i} className="border-b border-slate-100">
                    {level === 'years' && (
                      <td className="td">
                        <Link href={href!} className="font-medium text-slate-900 hover:underline">
                          {String(r.academic_year)}
                        </Link>
                      </td>
                    )}
                    {level === 'terms' && (
                      <td className="td">
                        <Link href={href!} className="font-medium text-slate-900 hover:underline">
                          {String(r.term)} semester
                        </Link>
                      </td>
                    )}
                    {level === 'subjects' && (
                      <>
                        <td className="td font-medium">{String(r.code)}</td>
                        <td className="td">
                          <Link href={href!} className="text-slate-900 hover:underline">
                            {String(r.name)}
                          </Link>
                        </td>
                      </>
                    )}
                    {level === 'faculty' && (
                      <>
                        <td className="td font-medium">{String(r.code)}</td>
                        <td className="td">
                          <Link href={href!} className="text-slate-900 hover:underline">
                            {String(r.full_name)} · {String(r.section_name)}
                          </Link>
                        </td>
                      </>
                    )}
                    <td className="td">{Number(r.evals ?? 0)}</td>
                    <td className="td font-medium">
                      {r.avg_rating != null ? Number(r.avg_rating).toFixed(2) : '—'}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && detail.per_question.length === 0 && (
                <tr>
                  <td className="td text-slate-400">No data at this level yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold">Per-question averages</h2>
            <table className="table">
              <tbody>
                {detail.per_question.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="td">
                      <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        {String(r.category)}
                      </span>
                      {String(r.text)}
                    </td>
                    <td className="td text-right font-medium">
                      {r.avg_rating != null ? Number(r.avg_rating).toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold">Comments</h2>
            <div className="space-y-3">
              {detail.comments.map((r, i) => (
                <div key={i} className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-700">{String(r.comment)}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(String(r.at)).toLocaleDateString()} ·{' '}
                    <span
                      className={
                        r.label === 'positive'
                          ? 'text-green-600'
                          : r.label === 'negative'
                            ? 'text-red-600'
                            : 'text-slate-400'
                      }
                    >
                      {String(r.label ?? 'neutral')}
                    </span>
                  </p>
                </div>
              ))}
              {rows.length === 0 && <p className="text-sm text-slate-400">No comments</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
