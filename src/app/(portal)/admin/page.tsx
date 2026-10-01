import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import {
  adminDelete,
  clearOverride,
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
import { semesterIsOpen } from '@/lib/types';
import { manilaDate } from '@/lib/time';
import { StaffScaffold } from '@/components/dashboard/StaffScaffold';
import { Users, BookOpen, PieChart, Settings } from 'lucide-react';
import { AdminUsersTable } from '@/components/dashboard/AdminUsersTable';

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

function Del({ table, id, tab }: { table: string; id: string; tab: string }) {
  return (
    <form action={adminDelete}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="tab" value={tab} />
      <button
        type="submit"
        className="inline-flex cursor-pointer items-center rounded-lg px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors border border-destructive/20 min-h-[32px]"
      >
        Delete
      </button>
    </form>
  );
}

type ProfileRow = {
  id: string;
  full_name: string;
  role: string;
  student_no: string | null;
  program: { code: string } | null;
  created_at: string | null;
};

type ProgramRow = { id: string; code: string; name: string };
type SectionRow = {
  id: string;
  name: string;
  year_level: number;
  program: { code: string; name: string } | null;
};
type SubjectRow = { id: string; code: string; name: string };
type PersonRow = { id: string; full_name: string; student_no?: string | null };
type AssignmentRow = {
  id: string;
  semester: { academic_year: string; term: string } | null;
  section: { name: string } | null;
  subject: { code: string; name: string } | null;
  faculty: { full_name: string } | null;
};
type QuestionRow = { id: string; text: string; category: string; sort_order: number; active: boolean };

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
  const errorMsg = typeof sp.error === 'string' ? sp.error : null;

  const supabase = await createClient();

  // common, cheap: semester list + dean participation + per-semester trend
  const [semestersRes, deanRes, trendRes] = await Promise.all([
    supabase.from('semesters').select('*').order('academic_year', { ascending: false }),
    supabase.rpc('rpc_dean_overview'),
    supabase.rpc('rpc_semester_trend'),
  ]);
  const sems = (semestersRes.data ?? []) as unknown as Semester[];
  const trendList = (trendRes.data ?? []) as { evals?: number }[];

  // profile counts: full list only on the users tab, head counts elsewhere
  let profilesList: ProfileRow[] = [];
  let counts = { total: 0, students: 0, faculty: 0 };
  if (tab === 'users') {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, student_no, program:programs(code), created_at')
      .order('created_at', { ascending: true });
    profilesList = (data ?? []) as unknown as ProfileRow[];
    counts = {
      total: profilesList.length,
      students: profilesList.filter((p) => p.role === 'student').length,
      faculty: profilesList.filter((p) => p.role === 'faculty').length,
    };
  } else {
    const [t, s, f] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'faculty'),
    ]);
    counts = { total: t.count ?? 0, students: s.count ?? 0, faculty: f.count ?? 0 };
  }

  // tab-scoped data (audit P27: no more 11-query fanout on every view)
  let programs: ProgramRow[] = [];
  let sections: SectionRow[] = [];
  let subjects: SubjectRow[] = [];
  let faculty: PersonRow[] = [];
  let students: PersonRow[] = [];
  let assignments: AssignmentRow[] = [];
  let questions: QuestionRow[] = [];

  if (tab === 'programs') {
    const { data } = await supabase.from('programs').select('*').order('code');
    programs = (data ?? []) as ProgramRow[];
  } else if (tab === 'sections') {
    const [secRes, progRes] = await Promise.all([
      supabase.from('sections').select('*, program:programs(code, name)').order('year_level'),
      supabase.from('programs').select('*').order('code'),
    ]);
    sections = (secRes.data ?? []) as unknown as SectionRow[];
    programs = (progRes.data ?? []) as ProgramRow[];
  } else if (tab === 'subjects') {
    const { data } = await supabase.from('subjects').select('*').order('code');
    subjects = (data ?? []) as SubjectRow[];
  } else if (tab === 'assignments') {
    const [assignRes, secRes, subRes, facRes] = await Promise.all([
      supabase
        .from('section_subjects')
        .select(
          '*, semester:semesters(academic_year, term), section:sections(name), subject:subjects(code, name), faculty:profiles(full_name)',
        )
        .order('semester_id'),
      supabase.from('sections').select('*, program:programs(code, name)').order('year_level'),
      supabase.from('subjects').select('*').order('code'),
      supabase.from('profiles').select('id, full_name').eq('role', 'faculty').order('full_name'),
    ]);
    assignments = (assignRes.data ?? []) as unknown as AssignmentRow[];
    sections = (secRes.data ?? []) as unknown as SectionRow[];
    subjects = (subRes.data ?? []) as SubjectRow[];
    faculty = (facRes.data ?? []) as PersonRow[];
  } else if (tab === 'questions') {
    const { data } = await supabase.from('questions').select('*').order('sort_order');
    questions = (data ?? []) as QuestionRow[];
  } else if (tab === 'enrollments') {
    const [assignRes, stuRes, secRes] = await Promise.all([
      supabase
        .from('section_subjects')
        .select(
          '*, semester:semesters(academic_year, term), section:sections(name), subject:subjects(code, name), faculty:profiles(full_name)',
        )
        .order('semester_id'),
      supabase.from('profiles').select('id, full_name, student_no').eq('role', 'student').order('full_name'),
      supabase.from('sections').select('*, program:programs(code, name)').order('year_level'),
    ]);
    assignments = (assignRes.data ?? []) as unknown as AssignmentRow[];
    students = (stuRes.data ?? []) as PersonRow[];
    sections = (secRes.data ?? []) as unknown as SectionRow[];
  }

  // real KPIs only (audit P12): participation from the dean aggregate, trend
  // evals from semester trend; no invented fallbacks anywhere
  const deanData = deanRes.data as { participation?: { enrolled?: number; submitted?: number } } | null;
  const enrolledCount = deanData?.participation?.enrolled ?? 0;
  const submittedCount = deanData?.participation?.submitted ?? 0;
  const realTurnout = enrolledCount > 0 ? (submittedCount / enrolledCount) * 100 : null;

  const userSparkline = profilesList.length > 0 ? profilesList.map((_, i) => i + 1) : undefined;
  const complianceSparkline = trendList.length > 1 ? trendList.map((t) => t.evals ?? 0) : undefined;

  const usersForTable = [...profilesList].sort((a, b) => a.full_name.localeCompare(b.full_name));

  const adminMetrics = [
    {
      label: 'Total Users',
      value: counts.total,
      sublabel: `${counts.students} Students · ${counts.faculty} Faculty`,
      sparkline: userSparkline,
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
    },
    {
      label: 'Active Students',
      value: counts.students,
      sublabel: 'Enrolled in portal',
      icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
    },
    {
      label: 'Faculty Assigned',
      value: counts.faculty,
      sublabel: 'Teaching assignments',
      icon: <PieChart className="h-4 w-4" aria-hidden="true" />,
    },
    {
      label: 'Student Participation',
      value: realTurnout != null ? `${realTurnout.toFixed(1)}%` : '—',
      sublabel: enrolledCount > 0 ? `${submittedCount} of ${enrolledCount} students submitted` : 'No enrollment data yet',
      sparkline: complianceSparkline,
      icon: <Settings className="h-4 w-4" aria-hidden="true" />,
    },
  ];

  return (
    <StaffScaffold
      breadcrumb={['CSU CETC Portal', 'Administration', tab === 'users' ? 'Users Directory' : 'System Setup']}
      title="Administration & System Setup"
      subtitle="Manage user accounts, faculty assignments, curriculum structure, and evaluation periods."
      metrics={adminMetrics}
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1.5 border border-border bg-muted/60 rounded-xl overflow-x-auto no-scrollbar flex-nowrap">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin?tab=${t.key}`}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap min-h-[36px] flex items-center ${
                t.key === tab
                  ? 'bg-card text-foreground font-bold shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Tab 1: Users Directory (read-only directory; profile deletion is an
            operator action because rows are protected by FKs and audits) */}
        {tab === 'users' && <AdminUsersTable users={usersForTable} />}

        {/* Tab 2: Semesters / Period */}
        {tab === 'semesters' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-border bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Semesters &amp; Evaluation Periods</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] uppercase text-muted-foreground tracking-wider">
                      <th className="py-3 px-4 sm:px-5 font-semibold">AY</th>
                      <th className="py-3 px-4 font-semibold">Term</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Window (Manila)</th>
                      <th className="py-3 px-4 sm:px-5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sems.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-5 font-semibold text-foreground">{s.academic_year}</td>
                        <td className="py-3.5 px-4 text-foreground">{s.term}</td>
                        <td className="py-3.5 px-4">
                          {s.is_current && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/25 uppercase mr-2">
                              Current
                            </span>
                          )}
                          {semesterIsOpen(s) ? (
                            <span className="inline-flex items-center rounded-full bg-positive/10 px-2.5 py-0.5 text-[10px] font-semibold text-positive border border-positive/25 uppercase mr-2">
                              Open
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-700/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-700/25 uppercase mr-2">
                              Closed
                            </span>
                          )}
                          {s.manual_override && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border uppercase">
                              Override: {s.manual_override}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground tabular-nums">
                          {manilaDate(s.opens_at)} → {manilaDate(s.closes_at)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="flex items-center gap-2">
                            {!s.is_current && (
                              <form action={setCurrentSemester}>
                                <input type="hidden" name="id" value={s.id} />
                                <input type="hidden" name="tab" value="semesters" />
                                <button type="submit" className="text-xs text-primary font-medium hover:underline cursor-pointer min-h-[32px] px-1">
                                  Set current
                                </button>
                              </form>
                            )}
                            <form action={togglePeriod}>
                              <input type="hidden" name="id" value={s.id} />
                              <input type="hidden" name="open" value={(!semesterIsOpen(s)).toString()} />
                              <input type="hidden" name="tab" value="semesters" />
                              <button type="submit" className="text-xs text-muted-foreground hover:text-foreground font-medium hover:underline cursor-pointer min-h-[32px] px-1">
                                {semesterIsOpen(s) ? 'Close' : 'Open'}
                              </button>
                            </form>
                            {s.manual_override && (
                              <form action={clearOverride}>
                                <input type="hidden" name="id" value={s.id} />
                                <input type="hidden" name="tab" value="semesters" />
                                <button type="submit" className="text-xs text-muted-foreground hover:text-foreground font-medium hover:underline cursor-pointer min-h-[32px] px-1">
                                  Use schedule
                                </button>
                              </form>
                            )}
                            <Del table="semesters" id={s.id} tab="semesters" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Add semester</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Window times are entered and shown in campus time (Asia/Manila).
              </p>
              <form action={createSemester} className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Academic Year</label>
                  <input
                    name="academic_year"
                    placeholder="2026-2027"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Term</label>
                  <select
                    name="term"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
                    required
                  >
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="midyear">Midyear</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Opens at</label>
                  <input
                    type="datetime-local"
                    name="opens_at"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Closes at</label>
                  <input
                    type="datetime-local"
                    name="closes_at"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[40px]"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Programs */}
        {tab === 'programs' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-border bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Degree Programs</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] uppercase text-muted-foreground tracking-wider">
                      <th className="py-3 px-4 sm:px-5 font-semibold">Code</th>
                      <th className="py-3 px-4 font-semibold">Name</th>
                      <th className="py-3 px-4 sm:px-5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {programs.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-5 font-bold text-foreground">{p.code}</td>
                        <td className="py-3.5 px-4 text-foreground">{p.name}</td>
                        <td className="py-3.5 px-4 sm:px-5">
                          <Del table="programs" id={p.id} tab="programs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Add program</h2>
              <form action={createProgram} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
                <div className="w-full sm:w-28">
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Code</label>
                  <input
                    name="code"
                    placeholder="BSIT"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                    required
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Program Name</label>
                  <input
                    name="name"
                    placeholder="BS Information Technology"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                    required
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[40px]"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 4: Sections */}
        {tab === 'sections' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-border bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Academic Sections</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] uppercase text-muted-foreground tracking-wider">
                      <th className="py-3 px-4 sm:px-5 font-semibold">Program</th>
                      <th className="py-3 px-4 font-semibold">Year</th>
                      <th className="py-3 px-4 font-semibold">Section</th>
                      <th className="py-3 px-4 sm:px-5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sections.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-5 font-semibold text-foreground">{s.program?.code}</td>
                        <td className="py-3.5 px-4 text-foreground">{s.year_level}</td>
                        <td className="py-3.5 px-4 text-foreground">{s.name}</td>
                        <td className="py-3.5 px-4 sm:px-5">
                          <Del table="sections" id={s.id} tab="sections" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Add section</h2>
              <form action={createSection} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
                <div className="w-full sm:w-48">
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Program</label>
                  <select
                    name="program_id"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
                    required
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-24">
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Year</label>
                  <input
                    name="year_level"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={1}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                    required
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Section name</label>
                  <input
                    name="name"
                    placeholder="e.g. A"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                    required
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[40px]"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 5: Subjects */}
        {tab === 'subjects' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-border bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Curriculum Subjects</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] uppercase text-muted-foreground tracking-wider">
                      <th className="py-3 px-4 sm:px-5 font-semibold">Code</th>
                      <th className="py-3 px-4 font-semibold">Name</th>
                      <th className="py-3 px-4 sm:px-5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subjects.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-5 font-bold text-foreground">{s.code}</td>
                        <td className="py-3.5 px-4 text-foreground">{s.name}</td>
                        <td className="py-3.5 px-4 sm:px-5">
                          <Del table="subjects" id={s.id} tab="subjects" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Add subject</h2>
              <form action={createSubject} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
                <div className="w-full sm:w-28">
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Code</label>
                  <input
                    name="code"
                    placeholder="IT101"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                    required
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Subject Name</label>
                  <input
                    name="name"
                    placeholder="Introduction to Computing"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                    required
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[40px]"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 6: Assignments */}
        {tab === 'assignments' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-border bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Teaching Load Assignments</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] uppercase text-muted-foreground tracking-wider">
                      <th className="py-3 px-4 sm:px-5 font-semibold">Semester</th>
                      <th className="py-3 px-4 font-semibold">Section</th>
                      <th className="py-3 px-4 font-semibold">Subject</th>
                      <th className="py-3 px-4 font-semibold">Faculty</th>
                      <th className="py-3 px-4 sm:px-5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-5 text-muted-foreground">{a.semester?.academic_year} {a.semester?.term}</td>
                        <td className="py-3.5 px-4 font-medium text-foreground">{a.section?.name}</td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">{a.subject?.code} — {a.subject?.name}</td>
                        <td className="py-3.5 px-4 text-foreground">{a.faculty?.full_name}</td>
                        <td className="py-3.5 px-4 sm:px-5"><Del table="section_subjects" id={a.id} tab="assignments" /></td>
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                          No assignments yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Assign faculty to subject</h2>
              <form action={createAssignment} className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Semester</label>
                  <select
                    name="semester_id"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
                    required
                  >
                    {sems.map((s) => (
                      <option key={s.id} value={s.id}>{s.academic_year} {s.term}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Section</label>
                  <select
                    name="section_id"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
                    required
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.program?.code} {s.year_level}-{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Subject</label>
                  <select
                    name="subject_id"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Faculty</label>
                  <select
                    name="faculty_id"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
                    required
                  >
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>{f.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[40px]"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 7: Questions */}
        {tab === 'questions' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-border bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Evaluation Criteria &amp; Questions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] uppercase text-muted-foreground tracking-wider">
                      <th className="py-3 px-4 sm:px-5 font-semibold">#</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Question</th>
                      <th className="py-3 px-4 font-semibold">Active</th>
                      <th className="py-3 px-4 sm:px-5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {questions.map((q) => (
                      <tr key={q.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-muted-foreground">{q.sort_order}</td>
                        <td className="py-3.5 px-4">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border">
                            {q.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-normal text-foreground leading-relaxed">{q.text}</td>
                        <td className="py-3.5 px-4">
                          {q.active ? (
                            <span className="inline-flex items-center rounded-full bg-positive/10 px-2.5 py-0.5 text-[10px] font-semibold text-positive border border-positive/25">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="flex items-center gap-2">
                            <form action={toggleQuestion}>
                              <input type="hidden" name="id" value={q.id} />
                              <input type="hidden" name="active" value={(!q.active).toString()} />
                              <input type="hidden" name="tab" value="questions" />
                              <button type="submit" className="text-xs text-muted-foreground hover:text-foreground font-medium hover:underline cursor-pointer min-h-[32px] px-1">
                                {q.active ? 'Deactivate' : 'Activate'}
                              </button>
                            </form>
                            <Del table="questions" id={q.id} tab="questions" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Add question</h2>
              <form action={createQuestion} className="grid gap-3 grid-cols-1 sm:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Category</label>
                  <input
                    name="category"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                    placeholder="Teaching"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Question</label>
                  <input
                    name="text"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                    placeholder="Explains lessons clearly"
                    required
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-20">
                    <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Order</label>
                    <input
                      name="sort_order"
                      type="number"
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors"
                      defaultValue={10}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[40px]"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 8: Enrollments */}
        {tab === 'enrollments' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Enroll student in subject</h2>
              <form action={createEnrollment} className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Student</label>
                  <select
                    name="student_id"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} {s.student_no ? `(${s.student_no})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Class (semester · section · subject · faculty)</label>
                  <select
                    name="section_subject_id"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] transition-colors cursor-pointer"
                    required
                  >
                    {assignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.semester?.academic_year} {a.semester?.term} · {a.section?.name} · {a.subject?.code} · {a.faculty?.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-xs min-h-[40px]"
                  >
                    Enroll
                  </button>
                </div>
              </form>
              <p className="mt-4 text-xs text-muted-foreground">
                {sections.length} sections · {assignments.length} classes · {students.length} registered students
              </p>
            </div>
          </div>
        )}
      </div>
    </StaffScaffold>
  );
}
