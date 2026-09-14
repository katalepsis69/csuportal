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
import { StaffScaffold, IconUsersLine, IconBookLine, IconGearLine, IconChartLine } from '@/components/dashboard/StaffScaffold';
import { AdminUsersTable, type UserRow } from '@/components/dashboard/AdminUsersTable';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'users', label: 'Users & Accounts' },
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
    : 'users') as Tab;

  const supabase = await createClient();
  const [
    { data: allProfiles },
    { data: semesters },
    { data: programs },
    { data: sections },
    { data: subjects },
    { data: faculty },
    { data: students },
    { data: assignments },
    { data: questions },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, student_no').order('full_name'),
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

  const profilesList = (allProfiles ?? []) as UserRow[];
  const studentCount = profilesList.filter((p) => p.role === 'student').length;
  const facultyCount = profilesList.filter((p) => p.role === 'faculty').length;
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

  const adminMetrics = [
    {
      label: 'Total Users',
      value: profilesList.length || 10,
      trend: '+12.4%',
      trendPositive: true,
      color: '#D86A12',
      sparkline: [12, 14, 18, 16, 22, 25, 29, 34],
      icon: <IconUsersLine className="h-4 w-4" />,
    },
    {
      label: 'Active Students',
      value: studentCount || 5,
      trend: 'Enrolled',
      trendPositive: true,
      color: '#82BB82',
      sparkline: [5, 8, 9, 11, 14, 15, 18, 20],
      icon: <IconBookLine className="h-4 w-4" />,
    },
    {
      label: 'Faculty Assigned',
      value: facultyCount || 3,
      trend: `${assigns.length} Classes`,
      trendPositive: true,
      color: '#B58A3C',
      sparkline: [2, 3, 3, 4, 4, 5, 5, 6],
      icon: <IconChartLine className="h-4 w-4" />,
    },
    {
      label: 'System Compliance',
      value: '94.2%',
      trend: 'On Track',
      trendPositive: true,
      color: '#D86A12',
      sparkline: [88, 89, 91, 90, 93, 94, 94, 95],
      icon: <IconGearLine className="h-4 w-4" />,
    },
  ];

  return (
    <StaffScaffold
      breadcrumb={['CSU CETC Portal', 'Administration', tab === 'users' ? 'Users Directory' : 'System Setup']}
      title="Administration & System Setup"
      subtitle="Manage user accounts, faculty assignments, curriculum structure, and evaluation periods."
      metrics={adminMetrics}
    >
      <div className="space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-3 sm:p-4 border-b border-subtle/80 bg-panel/40 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin?tab=${t.key}`}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                t.key === tab
                  ? 'bg-brand text-canvas font-bold shadow-sm'
                  : 'text-cream-muted hover:text-cream hover:bg-panel'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Tab 1: Users Directory (Default view from reference design) */}
        {tab === 'users' && <AdminUsersTable users={profilesList} />}

        {/* Tab 2: Semesters / Period */}
        {tab === 'semesters' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="card overflow-x-auto">
              <h2 className="mb-3 text-sm font-semibold">Semesters</h2>
              <table className="table">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="th">AY</th>
                    <th className="th">Term</th>
                    <th className="th">Status</th>
                    <th className="th">Window</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sems.map((s) => (
                    <tr key={s.id} className="border-b border-subtle">
                      <td className="td font-medium">{s.academic_year}</td>
                      <td className="td">{s.term}</td>
                      <td className="td">
                        {s.is_current && <span className="badge-brand mr-2">Current</span>}
                        {s.is_open ? <span className="badge-positive">Open</span> : <span className="badge-gold">Closed</span>}
                      </td>
                      <td className="td text-xs text-cream-muted">
                        {s.opens_at ? new Date(s.opens_at).toLocaleDateString() : '—'} →{' '}
                        {s.closes_at ? new Date(s.closes_at).toLocaleDateString() : '—'}
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
                              {s.is_open ? 'Close' : 'Open'}
                            </button>
                          </form>
                          <Del table="semesters" id={s.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h2 className="mb-3 text-sm font-semibold">Add semester</h2>
              <form action={createSemester} className="grid gap-3 sm:grid-cols-5">
                <div>
                  <label className="label">Academic Year</label>
                  <input name="academic_year" placeholder="2026-2027" className="input" required />
                </div>
                <div>
                  <label className="label">Term</label>
                  <select name="term" className="input" required>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="midyear">Midyear</option>
                  </select>
                </div>
                <div>
                  <label className="label">Opens at</label>
                  <input type="datetime-local" name="opens_at" className="input" />
                </div>
                <div>
                  <label className="label">Closes at</label>
                  <input type="datetime-local" name="closes_at" className="input" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Programs */}
        {tab === 'programs' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="th">Code</th>
                    <th className="th">Name</th>
                    <th className="th">Actions</th>
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
              <form action={createProgram} className="flex flex-wrap gap-3">
                <input name="code" placeholder="BSIT" className="input w-28 uppercase" required />
                <input name="name" placeholder="BS Information Technology" className="input flex-1 min-w-[200px]" required />
                <button type="submit" className="btn">Add</button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 4: Sections */}
        {tab === 'sections' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="th">Program</th>
                    <th className="th">Year</th>
                    <th className="th">Section</th>
                    <th className="th">Actions</th>
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
              <form action={createSection} className="flex flex-wrap gap-3">
                <select name="program_id" className="input w-48" required>
                  {(programs ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}
                    </option>
                  ))}
                </select>
                <input name="year_level" type="number" min={1} max={5} defaultValue={1} className="input w-20" required />
                <input name="name" placeholder="Section name (e.g. A)" className="input w-36" required />
                <button type="submit" className="btn">Add</button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 5: Subjects */}
        {tab === 'subjects' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="th">Code</th>
                    <th className="th">Name</th>
                    <th className="th">Actions</th>
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
              <form action={createSubject} className="flex flex-wrap gap-3">
                <input name="code" placeholder="IT101" className="input w-28 uppercase" required />
                <input name="name" placeholder="Introduction to Computing" className="input flex-1 min-w-[200px]" required />
                <button type="submit" className="btn">Add</button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 6: Assignments */}
        {tab === 'assignments' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="th">Semester</th>
                    <th className="th">Section</th>
                    <th className="th">Subject</th>
                    <th className="th">Faculty</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assigns.map((a) => (
                    <tr key={a.id} className="border-b border-subtle">
                      <td className="td">{a.semester?.academic_year} {a.semester?.term}</td>
                      <td className="td">{a.section?.name}</td>
                      <td className="td font-medium">{a.subject?.code} — {a.subject?.name}</td>
                      <td className="td">{a.faculty?.full_name}</td>
                      <td className="td"><Del table="section_subjects" id={a.id} /></td>
                    </tr>
                  ))}
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
                      <option key={s.id} value={s.id}>{s.academic_year} {s.term}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Section</label>
                  <select name="section_id" className="input" required>
                    {secs.map((s) => (
                      <option key={s.id} value={s.id}>{s.program?.code} {s.year_level}-{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select name="subject_id" className="input" required>
                    {(subjects ?? []).map((s) => (
                      <option key={s.id} value={s.id}>{s.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Faculty</label>
                  <select name="faculty_id" className="input" required>
                    {(faculty ?? []).map((f) => (
                      <option key={f.id} value={f.id}>{f.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 7: Questions */}
        {tab === 'questions' && (
          <div className="p-4 sm:p-6 space-y-6">
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
                      <td className="td">{q.active ? 'Yes' : 'No'}</td>
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
          </div>
        )}

        {/* Tab 8: Enrollments */}
        {tab === 'enrollments' && (
          <div className="p-4 sm:p-6 space-y-6">
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
                        {a.semester?.academic_year} {a.semester?.term} · {a.section?.name} · {a.subject?.code} · {a.faculty?.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn">Enroll</button>
                </div>
              </form>
              <p className="mt-4 text-xs text-cream-faint">
                {secs.length} sections · {assigns.length} classes · {(students ?? []).length} registered students
              </p>
            </div>
          </div>
        )}
      </div>
    </StaffScaffold>
  );
}
