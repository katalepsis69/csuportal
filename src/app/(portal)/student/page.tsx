import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { StudentDashboard } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole('student');
  const { submitted } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc('rpc_student_dashboard');
  const dash = (data ?? { current_semester: null, subjects: [], past: [] }) as StudentDashboard;

  const pending = dash.subjects.filter((s) => !s.completed);
  const done = dash.subjects.filter((s) => s.completed);

  return (
    <div className="space-y-6">
      {submitted === '1' && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Evaluation submitted. Thank you!
        </div>
      )}

      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">My Evaluations</h1>
        {dash.current_semester && (
          <p className="text-sm text-slate-500">
            {dash.current_semester.academic_year} · {dash.current_semester.term} semester
            {dash.current_semester.is_open
              ? dash.current_semester.closes_at
                ? ` · open until ${new Date(dash.current_semester.closes_at).toLocaleDateString()}`
                : ' · open'
              : ' · evaluation period closed'}
          </p>
        )}
      </div>

      {dash.subjects.length === 0 && (
        <div className="card text-sm text-slate-500">
          No subjects assigned yet. Your department will enroll you when the semester starts.
        </div>
      )}

      {pending.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="mb-3 text-sm font-semibold">Pending ({pending.length})</h2>
          <table className="table">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="th">Subject</th>
                <th className="th">Faculty</th>
                <th className="th">Section</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((s) => (
                <tr key={s.section_subject_id} className="border-b border-slate-100">
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
                      <span className="badge bg-slate-100 text-slate-500">Closed</span>
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
              <tr className="border-b border-slate-200">
                <th className="th">Subject</th>
                <th className="th">Faculty</th>
                <th className="th">Section</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {done.map((s) => (
                <tr key={s.section_subject_id} className="border-b border-slate-100">
                  <td className="td">
                    <span className="font-medium">{s.subject_code}</span> — {s.subject_name}
                  </td>
                  <td className="td">{s.faculty_name}</td>
                  <td className="td">{s.section_name}</td>
                  <td className="td">
                    <span className="badge bg-green-100 text-green-700">Submitted</span>
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
              <tr className="border-b border-slate-200">
                <th className="th">Semester</th>
                <th className="th">Completed</th>
              </tr>
            </thead>
            <tbody>
              {dash.past.map((p) => (
                <tr key={p.semester_id} className="border-b border-slate-100">
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
