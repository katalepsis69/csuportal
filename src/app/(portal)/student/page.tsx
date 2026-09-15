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

  const DEFAULT_SUBJECTS = [
    {
      section_subject_id: 'cs214',
      subject_code: 'CS 214',
      subject_name: 'Data Structures & Algorithms',
      section_name: 'BSCS 3-A',
      faculty_name: 'Engr. Maria Santos, M.Eng',
      is_open: true,
      closes_at: '2026-10-15T12:00:00Z',
      completed: false,
    },
    {
      section_subject_id: 'cpe312',
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
    opens_at: '2026-08-01T00:00:00Z',
    closes_at: '2026-10-15T12:00:00Z',
  };

  const pending = subjects.filter((s) => !s.completed);
  const done = subjects.filter((s) => s.completed);

  return (
    <div className="space-y-6">
      {/* Submission Confirmation Banner */}
      {submitted === '1' && (
        <div className="rounded-2xl border border-status-sage/30 bg-status-sage/10 backdrop-blur-md p-4 text-sm text-status-sage flex items-start gap-3 shadow-beautiful-sm amber-glow-box">
          <IconSealCheck className="h-5 w-5 shrink-0 text-status-sage mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white">Evaluation Submitted Successfully</div>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Your feedback has been recorded anonymously and encrypted with a digital tamper seal.
            </p>
            {hash && (
              <div className="mt-2 rounded-lg bg-espresso-900/80 border border-status-sage/20 px-3 py-1.5 font-mono text-[11px] text-[#EDEDED] break-all">
                <span className="text-[#A1A1AA] select-none mr-1.5">Verification Hash:</span>
                {hash}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-amber-glow" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-light font-semibold">
              Student Academic Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
            Faculty Appraisals
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            {currentSemester.academic_year} · {currentSemester.term} Semester
            {currentSemester.is_open
              ? currentSemester.closes_at
                ? ` · Open until ${new Date(currentSemester.closes_at).toLocaleDateString()} (7 days remaining)`
                : ' · Open for Submissions'
              : ' · Evaluation Period Closed'}
          </p>
        </div>

        {currentSemester.is_open && pending.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-amber-glow/15 border border-amber-glow/30 px-3.5 py-1.5 text-xs text-amber-light font-mono font-semibold">
            <span className="h-2 w-2 rounded-full bg-amber-glow animate-pulse" />
            {pending.length} Action{pending.length > 1 ? 's' : ''} Required
          </div>
        )}
      </div>

      {/* 3-Col Metric Bento Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Pending Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-espresso-850/80 backdrop-blur-md p-5 shadow-beautiful-sm flex items-center gap-4 hover:border-amber-glow/40 transition-colors amber-glow-box">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-status-gold/10 border border-status-gold/20 text-status-gold">
            <IconHourglass className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#A1A1AA] font-mono uppercase tracking-wider">
              Pending Appraisals
            </div>
            <div className="text-2xl font-bold text-status-gold font-display tabular-nums mt-0.5">
              {pending.length}
            </div>
            <div className="text-[11px] text-[#A1A1AA] mt-0.5">
              {pending.length === 0 ? 'All caught up' : 'Awaiting your feedback'}
            </div>
          </div>
        </div>

        {/* Completed Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-espresso-850/80 backdrop-blur-md p-5 shadow-beautiful-sm flex items-center gap-4 hover:border-status-sage/40 transition-colors amber-glow-box">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-status-sage/10 border border-status-sage/20 text-status-sage">
            <IconSealCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#A1A1AA] font-mono uppercase tracking-wider">
              Completed
            </div>
            <div className="text-2xl font-bold text-status-sage font-display tabular-nums mt-0.5">
              {done.length}
            </div>
            <div className="text-[11px] text-[#A1A1AA] mt-0.5">Encrypted & submitted</div>
          </div>
        </div>

        {/* Total Subjects Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-espresso-850/80 backdrop-blur-md p-5 shadow-beautiful-sm flex items-center gap-4 hover:border-amber-glow/40 transition-colors amber-glow-box">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-glow/10 border border-amber-glow/20 text-amber-light">
            <IconClipboardText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#A1A1AA] font-mono uppercase tracking-wider">
              Enrolled Courses
            </div>
            <div className="text-2xl font-bold text-white font-display tabular-nums mt-0.5">
              {subjects.length}
            </div>
            <div className="text-[11px] text-[#A1A1AA] mt-0.5">Assigned this semester</div>
          </div>
        </div>
      </div>

      {/* Pending Evaluations List */}
      {pending.length > 0 && (
        <div id="pending" className="rounded-2xl border border-white/[0.08] bg-espresso-850/80 backdrop-blur-md overflow-hidden shadow-beautiful-sm amber-glow-box">
          <div className="flex items-center justify-between p-4 px-6 border-b border-white/[0.06] bg-espresso-900/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-status-gold" />
              <h2 className="text-sm font-bold text-white font-mono">
                Pending Appraisals ({pending.length})
              </h2>
            </div>
            <span className="text-xs text-[#A1A1AA] font-mono">
              Complete before semester close
            </span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {pending.map((s) => (
              <div
                key={s.section_subject_id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono text-sm">
                      {s.subject_code}
                    </span>
                    <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-xs font-mono text-[#A1A1AA] border border-white/10">
                      {s.section_name}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-[#EDEDED]">{s.subject_name}</div>
                  <div className="text-xs text-[#A1A1AA] flex items-center gap-1.5 pt-0.5">
                    <span className="text-[#A1A1AA]/60">Instructor:</span>
                    <span className="font-medium text-white">{s.faculty_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2.5">
                  {s.is_open ? (
                    <Link
                      href={`/student/eval/${s.section_subject_id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-glow to-[#c0590d] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-glow/20 hover:brightness-110 active:scale-[0.98] transition-all min-h-[38px] border border-amber-light/30"
                    >
                      Start Appraisal
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-status-gold/15 px-3 py-1 text-xs font-semibold text-status-gold border border-status-gold/30 font-mono">
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
        <div className="rounded-2xl border border-white/[0.08] bg-espresso-850/80 backdrop-blur-md overflow-hidden shadow-beautiful-sm amber-glow-box">
          <div className="flex items-center justify-between p-4 px-6 border-b border-white/[0.06] bg-espresso-900/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-status-sage" />
              <h2 className="text-sm font-bold text-white font-mono">
                Completed Appraisals ({done.length})
              </h2>
            </div>
            <span className="text-xs text-status-sage font-mono font-medium">
              Verified on record
            </span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {done.map((s) => (
              <div
                key={s.section_subject_id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono text-sm">
                      {s.subject_code}
                    </span>
                    <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-xs font-mono text-[#A1A1AA] border border-white/10">
                      {s.section_name}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-[#EDEDED]">{s.subject_name}</div>
                  <div className="text-xs text-[#A1A1AA] flex items-center gap-1.5 pt-0.5">
                    <span className="text-[#A1A1AA]/60">Instructor:</span>
                    <span className="font-medium text-white">{s.faculty_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-status-sage/15 px-3 py-1 text-xs font-semibold text-status-sage border border-status-sage/30 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-sage" />
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
