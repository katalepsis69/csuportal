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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold font-display tracking-tight text-foreground">Evaluation History</h1>
        <nav className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/dean/history" className="hover:text-foreground transition-colors font-medium">
            Academic years
          </Link>
          {ay && (
            <>
              <span className="text-muted-foreground/60">›</span>
              <Link href={qs({ term: '', subject: '', faculty: '' })} className="hover:text-foreground transition-colors font-medium">
                {ay}
              </Link>
            </>
          )}
          {term && (
            <>
              <span className="text-muted-foreground/60">›</span>
              <Link href={qs({ subject: '', faculty: '' })} className="hover:text-foreground transition-colors font-medium">
                {term} semester
              </Link>
            </>
          )}
          {subject && (
            <>
              <span className="text-muted-foreground/60">›</span>
              <Link href={qs({ faculty: '' })} className="hover:text-foreground transition-colors font-medium">
                Subject {String(rows[0]?.code ?? subject).slice(0, 8)}
              </Link>
            </>
          )}
          {faculty && (
            <>
              <span className="text-muted-foreground/60">›</span>
              <span className="text-foreground font-semibold">Faculty detail</span>
            </>
          )}
        </nav>
      </div>

      {level !== 'detail' ? (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase text-muted-foreground tracking-wider">
                  {level === 'years' && <th className="py-3 px-4 sm:px-5 font-semibold">Academic year</th>}
                  {level === 'terms' && <th className="py-3 px-4 sm:px-5 font-semibold">Semester</th>}
                  {(level === 'subjects' || level === 'faculty') && <th className="py-3 px-4 sm:px-5 font-semibold">Code</th>}
                  {level === 'subjects' && <th className="py-3 px-4 font-semibold">Subject</th>}
                  {level === 'faculty' && <th className="py-3 px-4 font-semibold">Faculty / Section</th>}
                  <th className="py-3 px-4 font-semibold">Evaluations</th>
                  <th className="py-3 px-4 sm:px-5 font-semibold">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
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
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      {level === 'years' && (
                        <td className="py-3.5 px-4 sm:px-5">
                          <Link href={href!} className="font-semibold text-foreground hover:text-primary transition-colors">
                            {String(r.academic_year)}
                          </Link>
                        </td>
                      )}
                      {level === 'terms' && (
                        <td className="py-3.5 px-4 sm:px-5">
                          <Link href={href!} className="font-semibold text-foreground hover:text-primary transition-colors">
                            {String(r.term)} semester
                          </Link>
                        </td>
                      )}
                      {level === 'subjects' && (
                        <>
                          <td className="py-3.5 px-4 sm:px-5 font-bold text-foreground">{String(r.code)}</td>
                          <td className="py-3.5 px-4">
                            <Link href={href!} className="text-foreground hover:text-primary transition-colors font-medium">
                              {String(r.name)}
                            </Link>
                          </td>
                        </>
                      )}
                      {level === 'faculty' && (
                        <>
                          <td className="py-3.5 px-4 sm:px-5 font-bold text-foreground">{String(r.code)}</td>
                          <td className="py-3.5 px-4">
                            <Link href={href!} className="text-foreground hover:text-primary transition-colors font-medium">
                              {String(r.full_name)} · {String(r.section_name)}
                            </Link>
                          </td>
                        </>
                      )}
                      <td className="py-3.5 px-4 text-muted-foreground tabular-nums">{Number(r.evals ?? 0)}</td>
                      <td className="py-3.5 px-4 sm:px-5 font-bold text-primary tabular-nums">
                        {r.avg_rating != null ? Number(r.avg_rating).toFixed(2) : '—'}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && detail.per_question.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                      No data at this level yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Per-question averages</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <tbody className="divide-y divide-border">
                  {detail.per_question.map((r, i) => (
                    <tr key={i} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-2">
                        <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                          {String(r.category)}
                        </span>
                        <span className="text-foreground">{String(r.text)}</span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-primary tabular-nums">
                        {r.avg_rating != null ? Number(r.avg_rating).toFixed(2) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Comments</h2>
            <div className="space-y-2.5">
              {detail.comments.map((r, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/30 p-3.5 shadow-xs">
                  <p className="text-xs text-foreground leading-relaxed italic">{String(r.comment)}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {new Date(String(r.at)).toLocaleDateString()} ·{' '}
                    <span
                      className={
                        r.label === 'positive'
                          ? 'text-positive font-semibold'
                          : r.label === 'negative'
                            ? 'text-destructive font-semibold'
                            : 'text-muted-foreground'
                      }
                    >
                      {String(r.label ?? 'neutral')}
                    </span>
                  </p>
                </div>
              ))}
              {rows.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No comments recorded.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
