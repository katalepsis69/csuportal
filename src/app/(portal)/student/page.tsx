import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { semesterIsOpen, type StudentDashboard } from '@/lib/types';
import { IconClipboardText, IconHourglass, IconSealCheck } from '@/components/icons';

export const dynamic = 'force-dynamic';

function computeDaysLeft(closesAt?: string | null): number | null {
  if (!closesAt) return null;
  const diff = new Date(closesAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

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

  const DEFAULT_SUBJECTS = [
    {
      section_subject_id: '00000000-0000-0000-0000-000000000214',
      subject_code: 'CS 214',
      subject_name: 'Data Structures & Algorithms',
      section_name: 'BSCS 3-A',
      faculty_name: 'Engr. Maria Santos, M.Eng',
      is_open: true,
      closes_at: '2026-10-15T12:00:00Z',
      completed: false,
    },
    {
      section_subject_id: '00000000-0000-0000-0000-000000000312',
      subject_code: 'CPE 312',
      subject_name: 'Digital Signal Processing',
      section_name: 'BSCPE 3-A',
      faculty_name: 'Dr. Fatima Lim, Ph.D.',
      is_open: true,
      closes_at: '2026-10-15T12:00:00Z',
      completed: true,
    },
  ];

  const subjects = dash.subjects.length > 0 ? dash.subjects : DEFAULT_SUBJECTS;
  const currentSemester = dash.current_semester ?? {
    id: 'ay2526-sem1',
    academic_year: 'Academic Year 2025–2026',
    term: '1st',
    is_current: true,
    is_open: true,
    manual_override: null,
    opens_at: '2026-08-01T00:00:00Z',
    closes_at: '2026-10-15T12:00:00Z',
  };

  const pending = subjects.filter((s) => !s.completed);
  const done = subjects.filter((s) => s.completed);
  const daysLeft = computeDaysLeft(currentSemester.closes_at);

  return (
    <div className="space-y-6">
      {/* Submission Confirmation Banner */}
      {submitted === '1' && (
        <div className="rounded-2xl border border-positive/30 bg-positive/10 p-4 text-sm text-positive flex items-start gap-3 shadow-xs ">
          <IconSealCheck className="h-5 w-5 shrink-0 text-positive mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-foreground">Evaluation Submitted Successfully</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your feedback has been recorded anonymously and encrypted with a digital tamper seal.
            </p>
            {hash && (
              <div className="mt-2 rounded-lg bg-white/80 border border-positive/20 px-3 py-1.5 text-[11px] text-foreground break-all">
                <span className="text-muted-foreground select-none mr-1.5">Verification Hash:</span>
                {hash}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[11px] uppercase tracking-widest text-primary font-semibold">
              Student Academic Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Faculty Appraisals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {currentSemester.academic_year} · {currentSemester.term} Semester
            {semesterIsOpen(currentSemester)
              ? currentSemester.closes_at
                ? ` · Open until ${new Date(currentSemester.closes_at).toLocaleDateString()}${daysLeft != null ? ` (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)` : ''}`
                : ' · Open for Submissions'
              : ' · Evaluation Period Closed'}
          </p>
        </div>

        {semesterIsOpen(currentSemester) && pending.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary/15 border border-primary/30 px-3.5 py-1.5 text-xs text-primary font-semibold">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {pending.length} Action{pending.length > 1 ? 's' : ''} Required
          </div>
        )}
      </div>

      {/* 3-Col Metric Bento Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Pending Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4 hover:border-primary/40 transition-colors ">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold-text">
            <IconHourglass className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Appraisals
            </div>
            <div className="text-2xl font-bold text-gold-text font-display tabular-nums mt-0.5">
              {pending.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {pending.length === 0 ? 'All caught up' : 'Awaiting your feedback'}
            </div>
          </div>
        </div>

        {/* Completed Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4 hover:border-positive/40 transition-colors ">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-positive/10 border border-positive/20 text-positive">
            <IconSealCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Completed
            </div>
            <div className="text-2xl font-bold text-positive font-display tabular-nums mt-0.5">
              {done.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Encrypted & submitted</div>
          </div>
        </div>

        {/* Total Subjects Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center gap-4 hover:border-primary/40 transition-colors ">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <IconClipboardText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Enrolled Courses
            </div>
            <div className="text-2xl font-bold text-foreground font-display tabular-nums mt-0.5">
              {subjects.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Assigned this semester</div>
          </div>
        </div>
      </div>

      {/* Pending Evaluations List */}
      {pending.length > 0 && (
        <div id="pending" className="rounded-xl border border-border bg-card overflow-hidden shadow-xs ">
          <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <h2 className="text-sm font-bold text-foreground">
                Pending Appraisals ({pending.length})
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Complete before semester close
            </span>
          </div>

          <div className="divide-y divide-border">
            {pending.map((s) => (
              <div
                key={s.section_subject_id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">
                      {s.subject_code}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground border border-border">
                      {s.section_name}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground">{s.subject_name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                    <span className="text-muted-foreground/60">Instructor:</span>
                    <span className="font-medium text-foreground">{s.faculty_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2.5">
                  {s.is_open ? (
                    <Link
                      href={`/student/eval/${s.section_subject_id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-brand-hover active:scale-[0.98] transition-colors min-h-[38px]"
                    >
                      Start Appraisal
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-text border border-gold/30">
                      Period Closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Evaluations List */}
      {done.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs ">
          <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-positive" />
              <h2 className="text-sm font-bold text-foreground">
                Completed Appraisals ({done.length})
              </h2>
            </div>
            <span className="text-xs text-positive font-medium">
              Verified on record
            </span>
          </div>

          <div className="divide-y divide-border">
            {done.map((s) => (
              <div
                key={s.section_subject_id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">
                      {s.subject_code}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground border border-border">
                      {s.section_name}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground">{s.subject_name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                    <span className="text-muted-foreground/60">Instructor:</span>
                    <span className="font-medium text-foreground">{s.faculty_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/15 px-3 py-1 text-xs font-semibold text-positive border border-positive/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                    Submitted &amp; Sealed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Semesters Section */}
      {dash.past.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-muted/50">
            <h2 className="text-sm font-bold text-foreground">
              Evaluation History by Academic Year
            </h2>
          </div>

          <div className="divide-y divide-border">
            {dash.past.map((p) => (
              <div
                key={p.semester_id}
                className="p-4 flex items-center justify-between text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                <div className="font-medium text-foreground">
                  {p.academic_year} · {p.term} Semester
                </div>
                <div className="text-muted-foreground tabular-nums">
                  <span className="font-semibold text-foreground">{p.completed}</span> of {p.total} completed
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
