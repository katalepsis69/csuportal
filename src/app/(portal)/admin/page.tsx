import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  adminDelete,
  createAssignment,
  createEnrollment,
  createProgram,
  createQuestion,
  createSection,
  createSemester,
  createSubject,
  setCurrentSemester,
  togglePeriod,
  toggleQuestion,
} from '@/lib/actions/admin';
import type { Semester } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'semesters', label: 'Semesters / Period' },
  { key: 'programs', label: 'Programs' },
  { key: 'sections', label: 'Sections' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'questions', label: 'Questions' },
  { key: 'enrollments', label: 'Enrollments' },
] as const;

type Tab = (typeof TABS)[number]['key'];

function Del({ table, id }: { table: string; id: string }) {
  return (
    <form action={adminDelete}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-danger">
        Delete
      </button>
    </form>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole('admin');
  const sp = await searchParams;
  const tab: Tab = (typeof sp.tab === 'string' && TABS.some((t) => t.key === sp.tab)
    ? sp.tab
    : 'semesters') as Tab;

  const supabase = await createClient();
  const [{ data: semesters }, { data: programs }, { data: sections }, { data: subjects }, { data: faculty }, { data: students }, { data: assignments }, { data: questions }] =
    await Promise.all([
      supabase.from('semesters').select('*').order('academic_year', { ascending: false }),
      supabase.from('programs').select('*').order('code'),
      supabase.from('sections').select('*, program:programs(code, name)').order('year_level'),
      supabase.from('subjects').select('*').order('code'),
      supabase.from('profiles').select('id, full_name').eq('role', 'faculty').order('full_name'),
      supabase.from('profiles').select('id, full_name, student_no').eq('role', 'student').order('full_name'),
      supabase
        .from('section_subjects')
        .select(
          '*, semester:semesters(academic_year, term), section:sections(name), subject:subjects(code, name), faculty:profiles(full_name)',
        )
        .order('created_at'),
      supabase.from('questions').select('*').order('sort_order'),
    ]);

  const sems = (semesters ?? []) as unknown as Semester[];
  const secs = (sections ?? []) as unknown as {
    id: string;
    name: string;
    year_level: number;
    program: { code: string; name: string };
  }[];
  const assigns = (assignments ?? []) as unknown as {
    id: string;
    semester: { academic_year: string; term: string } | null;
    section: { name: string } | null;
    subject: { code: string; name: string } | null;
    faculty: { full_name: string } | null;
  }[];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin</h1>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              t.key === tab ? 'bg-brand text-canvas' : 'bg-panel text-cream-muted hover:bg-panel2'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'semesters' && (
        <>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="th">AY / Term</th>
                  <th className="th">Current</th>
                  <th className="th">Period</th>
                  <th className="th">Opens / Closes</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sems.map((s) => (
                  <tr key={s.id} className="border-b border-subtle">
                    <td className="td font-medium">
                      {s.academic_year} · {s.term}
                    </td>
                    <td className="td">{s.is_current ? '✓' : ''}</td>
                    <td className="td">
                      <span className={`badge ${s.is_open ? 'bg-green-100 text-positive' : 'bg-panel2 text-cream-muted'}`}>
                        {s.is_open ? 'open' : 'closed'}
                      </span>
                    </td>
                    <td className="td text-xs text-cream-muted">
                      {s.opens_at ? new Date(s.opens_at).toLocaleString() : '—'} →{' '}
                      {s.closes_at ? new Date(s.closes_at).toLocaleString() : '—'}
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        {!s.is_current && (
                          <form action={setCurrentSemester}>
                            <input type="hidden" name="id" value={s.id} />
                            <button type="submit" className="text-xs text-cream-muted hover:underline">
                              Set current
                            </button>
                          </form>
                        )}
                        <form action={togglePeriod}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="open" value={(!s.is_open).toString()} />
                          <button type="submit" className="text-xs text-cream-muted hover:underline">
                            {s.is_open ? 'Close period' : 'Open period'}
                          </button>
                        </form>
                        <Del table="semesters" id={s.id} />
                      </div>
                    </td>
                  </tr>
                ))}
                {sems.length === 0 && (
                  <tr>
                    <td className="td text-cream-faint">No semesters yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold">Add semester</h2>
            <form action={createSemester} className="grid gap-3 sm:grid-cols-5">
              <div>
                <label className="label">Academic year</label>
                <input name="academic_year" className="input" placeholder="2026-2027" required />
              </div>
              <div>
                <label className="label">Term</label>
                <select name="term" className="input">
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="midyear">Midyear</option>
                </select>
              </div>
              <div>
                <label className="label">Opens at</label>
                <input name="opens_at" type="datetime-local" className="input" />
              </div>
              <div>
                <label className="label">Closes at</label>
                <input name="closes_at" type="datetime-local" className="input" />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" name="is_current" /> current
                </label>
                <button type="submit" className="btn">Add</button>
              </div>
            </form>
          </div>
        </>
      )}

      {tab === 'programs' && (
        <>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="th">Code</th>
                  <th className="th">Name</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {(programs ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-subtle">
                    <td className="td font-medium">{p.code}</td>
                    <td className="td">{p.name}</td>
                    <td className="td">
                      <Del table="programs" id={p.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <form action={createProgram} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="label">Code</label>
                <input name="code" className="input w-32" placeholder="BSIT" required />
              </div>
              <div>
                <label className="label">Name</label>
                <input name="name" className="input w-72" placeholder="BS Information Technology" required />
              </div>
              <button type="submit" className="btn">Add</button>
            </form>
          </div>
        </>
      )}

      {tab === 'sections' && (
        <>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="th">Program</th>
                  <th className="th">Year</th>
                  <th className="th">Section</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {secs.map((s) => (
                  <tr key={s.id} className="border-b border-subtle">
                    <td className="td font-medium">{s.program?.code}</td>
                    <td className="td">{s.year_level}</td>
                    <td className="td">{s.name}</td>
                    <td className="td">
                      <Del table="sections" id={s.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <form action={createSection} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="label">Program</label>
                <select name="program_id" className="input" required>
                  {(programs ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select name="year_level" className="input">
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Name</label>
                <input name="name" className="input w-24" placeholder="A" required />
              </div>
              <button type="submit" className="btn">Add</button>
            </form>
          </div>
        </>
      )}

      {tab === 'subjects' && (
        <>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="th">Code</th>
                  <th className="th">Name</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {(subjects ?? []).map((s) => (
                  <tr key={s.id} className="border-b border-subtle">
                    <td className="td font-medium">{s.code}</td>
                    <td className="td">{s.name}</td>
                    <td className="td">
                      <Del table="subjects" id={s.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <form action={createSubject} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="label">Code</label>
                <input name="code" className="input w-32" placeholder="IT101" required />
              </div>
              <div>
                <label className="label">Name</label>
                <input name="name" className="input w-72" placeholder="Introduction to Computing" required />
              </div>
              <button type="submit" className="btn">Add</button>
            </form>
          </div>
        </>
      )}

      {tab === 'assignments' && (
        <>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="th">Semester</th>
                  <th className="th">Section</th>
                  <th className="th">Subject</th>
                  <th className="th">Faculty</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {assigns.map((a) => (
                  <tr key={a.id} className="border-b border-subtle">
                    <td className="td">
                      {a.semester?.academic_year} {a.semester?.term}
                    </td>
                    <td className="td">{a.section?.name}</td>
                    <td className="td">
                      <span className="font-medium">{a.subject?.code}</span> — {a.subject?.name}
                    </td>
                    <td className="td">{a.faculty?.full_name}</td>
                    <td className="td">
                      <Del table="section_subjects" id={a.id} />
                    </td>
                  </tr>
                ))}
                {assigns.length === 0 && (
                  <tr>
                    <td className="td text-cream-faint">No assignments yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold">Assign faculty to subject</h2>
            <form action={createAssignment} className="grid gap-3 sm:grid-cols-5">
              <div>
                <label className="label">Semester</label>
                <select name="semester_id" className="input" required>
                  {sems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.academic_year} {s.term}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Section</label>
                <select name="section_id" className="input" required>
                  {secs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.program?.code} {s.year_level}-{s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Subject</label>
                <select name="subject_id" className="input" required>
                  {(subjects ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Faculty</label>
                <select name="faculty_id" className="input" required>
                  {(faculty ?? []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn">Add</button>
              </div>
            </form>
          </div>
        </>
      )}

      {tab === 'questions' && (
        <>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="th">#</th>
                  <th className="th">Category</th>
                  <th className="th">Question</th>
                  <th className="th">Active</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(questions ?? []).map((q) => (
                  <tr key={q.id} className="border-b border-subtle">
                    <td className="td">{q.sort_order}</td>
                    <td className="td">
                      <span className="rounded bg-panel2 px-1.5 py-0.5 text-xs text-cream-muted">
                        {q.category}
                      </span>
                    </td>
                    <td className="td whitespace-normal">{q.text}</td>
                    <td className="td">{q.active ? '✓' : ''}</td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <form action={toggleQuestion}>
                          <input type="hidden" name="id" value={q.id} />
                          <input type="hidden" name="active" value={(!q.active).toString()} />
                          <button type="submit" className="text-xs text-cream-muted hover:underline">
                            {q.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </form>
                        <Del table="questions" id={q.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <form action={createQuestion} className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="label">Category</label>
                <input name="category" className="input" placeholder="Teaching" required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Question</label>
                <input name="text" className="input" placeholder="Explains lessons clearly" required />
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <label className="label">Order</label>
                  <input name="sort_order" type="number" className="input w-16" defaultValue={10} />
                </div>
                <button type="submit" className="btn">Add</button>
              </div>
            </form>
          </div>
        </>
      )}

      {tab === 'enrollments' && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold">Enroll student in subject</h2>
          <form action={createEnrollment} className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Student</label>
              <select name="student_id" className="input" required>
                {(students ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} {s.student_no ? `(${s.student_no})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Class (semester · section · subject · faculty)</label>
              <select name="section_subject_id" className="input" required>
                {assigns.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.semester?.academic_year} {a.semester?.term} · {a.section?.name} · {a.subject?.code} ·{' '}
                    {a.faculty?.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn">Enroll</button>
            </div>
          </form>
          <p className="mt-4 text-xs text-cream-faint">
            {secs.length} sections · {assigns.length} classes · {(students ?? []).length} students enrolled via
            this form
          </p>
        </div>
      )}
    </div>
  );
}
