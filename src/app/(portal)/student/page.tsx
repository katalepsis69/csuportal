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
    <div className="space-y-6">
      {/* Submission Confirmation Banner */}
      {submitted === '1' && (
        <div className="rounded-2xl border border-positive/30 bg-positive/10 backdrop-blur-md p-4 text-sm text-positive flex items-start gap-3 shadow-beautiful-sm">
          <IconSealCheck className="h-5 w-5 shrink-0 text-positive mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-cream">Evaluation Submitted Successfully</div>
            <p className="text-xs text-cream-muted mt-0.5">
              Your feedback has been recorded anonymously and encrypted with a digital tamper seal.
            </p>
            {hash && (
              <div className="mt-2 rounded-lg bg-panel/60 border border-positive/20 px-3 py-1.5 font-mono text-[11px] text-cream-dim break-all">
                <span className="text-cream-faint select-none mr-1.5">Verification Hash:</span>
                {hash}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-subtle/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-brand font-semibold">
              Student Academic Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-cream font-mono">
            Faculty Appraisals
          </h1>
          {dash.current_semester && (
            <p className="text-xs sm:text-sm text-cream-muted mt-1">
              {dash.current_semester.academic_year} · {dash.current_semester.term} Semester
              {dash.current_semester.is_open
                ? dash.current_semester.closes_at
                  ? ` · Open until ${new Date(dash.current_semester.closes_at).toLocaleDateString()}`
                  : ' · Open for Submissions'
                : ' · Evaluation Period Closed'}
            </p>
          )}
        </div>

        {dash.current_semester?.is_open && pending.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-brand/10 border border-brand/30 px-3.5 py-1.5 text-xs text-brand font-mono font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
            {pending.length} Action{pending.length > 1 ? 's' : ''} Required
          </div>
        )}
      </div>

      {/* 3-Col Metric Bento Grid */}
      {dash.subjects.length > 0 && (
        <div className="grid gap-3.5 sm:grid-cols-3">
          {/* Pending Card */}
          <div className="rounded-2xl border border-subtle/80 bg-panel/30 backdrop-blur-md p-4 sm:p-5 shadow-beautiful-sm flex items-center gap-4 hover:border-gold/40 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold">
              <IconHourglass className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-cream-muted font-mono uppercase tracking-wider">
                Pending Appraisals
              </div>
              <div className="text-2xl font-bold text-gold-text font-mono tabular-nums mt-0.5">
                {pending.length}
              </div>
              <div className="text-[11px] text-cream-faint mt-0.5">
                {pending.length === 0 ? 'All caught up' : 'Awaiting your feedback'}
              </div>
            </div>
          </div>

          {/* Completed Card */}
          <div className="rounded-2xl border border-subtle/80 bg-panel/30 backdrop-blur-md p-4 sm:p-5 shadow-beautiful-sm flex items-center gap-4 hover:border-positive/40 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-positive/10 border border-positive/20 text-positive">
              <IconSealCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-cream-muted font-mono uppercase tracking-wider">
                Completed
              </div>
              <div className="text-2xl font-bold text-positive font-mono tabular-nums mt-0.5">
                {done.length}
              </div>
              <div className="text-[11px] text-cream-faint mt-0.5">Encrypted & submitted</div>
            </div>
          </div>

          {/* Total Subjects Card */}
          <div className="rounded-2xl border border-subtle/80 bg-panel/30 backdrop-blur-md p-4 sm:p-5 shadow-beautiful-sm flex items-center gap-4 hover:border-brand/40 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 border border-brand/20 text-brand">
              <IconClipboardText className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-cream-muted font-mono uppercase tracking-wider">
                Enrolled Courses
              </div>
              <div className="text-2xl font-bold text-cream font-mono tabular-nums mt-0.5">
                {dash.subjects.length}
              </div>
              <div className="text-[11px] text-cream-faint mt-0.5">Assigned this semester</div>
            </div>
          </div>
        </div>
      )}

      {dash.subjects.length === 0 && (
        <div className="rounded-2xl border border-subtle bg-panel/30 backdrop-blur-md p-8 text-center text-cream-muted text-sm">
          No courses currently assigned to your account. Please contact the CETC Dean’s Office if you are officially enrolled.
        </div>
      )}

      {/* Pending Evaluations List */}
      {pending.length > 0 && (
        <div id="pending" className="rounded-2xl border border-subtle/80 bg-panel/30 backdrop-blur-md overflow-hidden shadow-beautiful-sm">
          <div className="flex items-center justify-between p-4 border-b border-subtle/80 bg-panel/40">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <h2 className="text-sm font-bold text-cream font-mono">
                Pending Appraisals ({pending.length})
              </h2>
            </div>
            <span className="text-xs text-cream-muted font-mono">
              Complete before semester close
            </span>
          </div>

          <div className="divide-y divide-subtle/40">
            {pending.map((s) => (
              <div
                key={s.section_subject_id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-panel2/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cream font-mono text-sm">
                      {s.subject_code}
                    </span>
                    <span className="rounded-md bg-panel px-2 py-0.5 text-xs font-mono text-cream-muted border border-subtle">
                      {s.section_name}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-cream-dim">{s.subject_name}</div>
                  <div className="text-xs text-cream-muted flex items-center gap-1.5 pt-0.5">
                    <span className="text-cream-faint">Instructor:</span>
                    <span className="font-medium text-cream">{s.faculty_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2.5">
                  {s.is_open ? (
                    <Link
                      href={`/student/eval/${s.section_subject_id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-cream shadow-sm hover:bg-brand-hover active:scale-[0.98] active:translate-y-[1px] transition-all min-h-[38px]"
                    >
                      Start Appraisal
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-text border border-gold/30 font-mono">
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
        <div className="rounded-2xl border border-subtle/80 bg-panel/30 backdrop-blur-md overflow-hidden shadow-beautiful-sm">
          <div className="flex items-center justify-between p-4 border-b border-subtle/80 bg-panel/40">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-positive" />
              <h2 className="text-sm font-bold text-cream font-mono">
                Completed Appraisals ({done.length})
              </h2>
            </div>
            <span className="text-xs text-positive font-mono font-medium">
              Verified on record
            </span>
          </div>

          <div className="divide-y divide-subtle/40">
            {done.map((s) => (
              <div
                key={s.section_subject_id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-panel2/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cream font-mono text-sm">
                      {s.subject_code}
                    </span>
                    <span className="rounded-md bg-panel px-2 py-0.5 text-xs font-mono text-cream-muted border border-subtle">
                      {s.section_name}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-cream-dim">{s.subject_name}</div>
                  <div className="text-xs text-cream-muted flex items-center gap-1.5 pt-0.5">
                    <span className="text-cream-faint">Instructor:</span>
                    <span className="font-medium text-cream">{s.faculty_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/15 px-3 py-1 text-xs font-semibold text-positive border border-positive/30 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                    Submitted & Sealed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Semesters Section */}
      {dash.past.length > 0 && (
        <div className="rounded-2xl border border-subtle/80 bg-panel/30 backdrop-blur-md overflow-hidden shadow-beautiful-sm">
          <div className="p-4 border-b border-subtle/80 bg-panel/40">
            <h2 className="text-sm font-bold text-cream font-mono">
              Evaluation History by Academic Year
            </h2>
          </div>

          <div className="divide-y divide-subtle/40">
            {dash.past.map((p) => (
              <div
                key={p.semester_id}
                className="p-4 flex items-center justify-between text-xs text-cream-dim hover:bg-panel2/30 transition-colors"
              >
                <div className="font-medium text-cream">
                  {p.academic_year} · {p.term} Semester
                </div>
                <div className="font-mono text-cream-muted tabular-nums">
                  <span className="font-semibold text-cream">{p.completed}</span> of {p.total} completed
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
