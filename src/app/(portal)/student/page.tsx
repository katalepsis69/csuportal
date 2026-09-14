import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { StudentDashboard } from '@/lib/types';
import { IconClipboardText, IconHourglass, IconSealCheck } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole('student');
  const { submitted, h } = await searchParams;
  const hash = typeof h === 'string' && /^[0-9a-f]{6,64}$/i.test(h) ? h : null;
  const supabase = await createClient();
  const { data } = await supabase.rpc('rpc_student_dashboard');
  const dash = (data ?? { current_semester: null, subjects: [], past: [] }) as StudentDashboard;

  const pending = dash.subjects.filter((s) => !s.completed);
  const done = dash.subjects.filter((s) => s.completed);

  return (
    <div className="space-y-3">
      {submitted === '1' && (
        <div className="success-banner">
          Evaluation submitted. Thank you!
          {hash && (
            <span className="mt-1 block font-mono text-xs opacity-80">
              Verification hash: {hash}…
            </span>
          )}
        </div>
      )}

      <div>
        <h1 className="page-title">My Evaluations</h1>
        {dash.current_semester && (
          <p className="page-subtitle !mb-4">
            {dash.current_semester.academic_year} · {dash.current_semester.term} semester
            {dash.current_semester.is_open
              ? dash.current_semester.closes_at
                ? ` · open until ${new Date(dash.current_semester.closes_at).toLocaleDateString()}`
                : ' · open'
              : ' · evaluation period closed'}
          </p>
        )}
      </div>

      {dash.subjects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card card-hover flex items-center gap-4">
            <IconHourglass className="h-8 w-8 shrink-0 text-gold" />
            <div>
              <div className="stat-label">Pending</div>
              <div className="stat-value text-gold-text">{pending.length}</div>
            </div>
          </div>
          <div className="card card-hover flex items-center gap-4">
            <IconSealCheck className="h-8 w-8 shrink-0 text-positive-fill" />
            <div>
              <div className="stat-label">Completed</div>
              <div className="stat-value text-positive">{done.length}</div>
            </div>
          </div>
          <div className="card card-hover flex items-center gap-4">
            <IconClipboardText className="h-8 w-8 shrink-0 text-brand" />
            <div>
              <div className="stat-label">Total this semester</div>
              <div className="stat-value">{dash.subjects.length}</div>
            </div>
          </div>
        </div>
      )}

      {dash.subjects.length === 0 && (
        <div className="card text-sm text-cream-muted">
          No subjects assigned yet. Your department will enroll you when the semester starts.
        </div>
      )}

      {pending.length > 0 && (
        <div id="pending" className="card overflow-x-auto">
          <h2 className="mb-3 text-sm font-bold">Pending ({pending.length})</h2>
          <table className="table">
            <thead>
              <tr className="border-b border-subtle">
                <th className="th">Subject</th>
                <th className="th">Faculty</th>
                <th className="th">Section</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((s) => (
                <tr key={s.section_subject_id} className="border-b border-subtle">
                  <td className="td">
                    <span className="font-medium">{s.subject_code}</span> — {s.subject_name}
                  </td>
                  <td className="td">{s.faculty_name}</td>
                  <td className="td">{s.section_name}</td>
                  <td className="td">
                    {s.is_open ? (
                      <Link href={`/student/eval/${s.section_subject_id}`} className="btn px-3 py-1.5 text-xs">
                        Evaluate
                      </Link>
                    ) : (
                      <span className="badge-gold">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {done.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="mb-3 text-sm font-semibold">Completed ({done.length})</h2>
          <table className="table">
            <thead>
              <tr className="border-b border-subtle">
                <th className="th">Subject</th>
                <th className="th">Faculty</th>
                <th className="th">Section</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {done.map((s) => (
                <tr key={s.section_subject_id} className="border-b border-subtle">
                  <td className="td">
                    <span className="font-medium">{s.subject_code}</span> — {s.subject_name}
                  </td>
                  <td className="td">{s.faculty_name}</td>
                  <td className="td">{s.section_name}</td>
                  <td className="td">
                    <span className="badge-positive">Submitted</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dash.past.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="mb-3 text-sm font-semibold">Past semesters</h2>
          <table className="table">
            <thead>
              <tr className="border-b border-subtle">
                <th className="th">Semester</th>
                <th className="th">Completed</th>
              </tr>
            </thead>
            <tbody>
              {dash.past.map((p) => (
                <tr key={p.semester_id} className="border-b border-subtle">
                  <td className="td">
                    {p.academic_year} · {p.term}
                  </td>
                  <td className="td">
                    {p.completed} / {p.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
