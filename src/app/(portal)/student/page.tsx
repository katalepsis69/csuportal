import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { semesterIsOpen, type StudentDashboard } from '@/lib/types';
import { IconClipboardText, IconHourglass, IconSealCheck } from '@/components/icons';

export const dynamic = 'force-dynamic';

function daysLeft(closesAt: string | null): string | null {
  if (!closesAt) return null;
  const ms = new Date(closesAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  const days = Math.ceil(ms / 86_400_000);
  if (days < 0) return null;
  return days === 0 ? 'closes today' : `${days} day${days === 1 ? '' : 's'} left`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole('student');
  const { submitted, h, r } = await searchParams;
  const hash = typeof h === 'string' && /^[0-9a-f]{6,64}$/i.test(h) ? h : null;
  const receiptId = typeof r === 'string' && UUID.test(r) ? r : null;

  const supabase = await createClient();
  const { data } = await supabase.rpc('rpc_student_dashboard');
  const dash = (data ?? null) as StudentDashboard | null;

  const subjects = dash?.subjects ?? [];
  const semester = dash?.current_semester ?? null;
  const open = semester ? semesterIsOpen(semester) : false;
  const pending = subjects.filter((s) => !s.completed);
  const done = subjects.filter((s) => s.completed);
  const window = semester ? daysLeft(semester.closes_at) : null;

  return (
    <div className="space-y-6">
      {submitted === '1' && (
        <div className="rounded-2xl border border-positive/30 bg-positive/10 p-4 text-sm text-positive flex items-start gap-3">
          <IconSealCheck className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-foreground">Evaluation submitted</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your ratings are recorded and your comment is stored without any link to your account.
            </p>
            {hash && (
              <div className="mt-2 rounded-lg bg-card border border-positive/20 px-3 py-1.5 text-[11px] text-foreground break-all">
                <span className="text-muted-foreground mr-1.5">Submission hash:</span>
                {hash}
              </div>
            )}
            {receiptId && (
              <Link
                href={`/verify/${receiptId}`}
                className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
              >
                View signed receipt
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[11px] uppercase tracking-widest text-primary font-semibold">
              Student workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Faculty Evaluations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {semester
              ? `${semester.academic_year} · ${semester.term} semester${
                  open ? (window ? ` · open, ${window}` : ' · open') : ' · evaluation period closed'
                }`
              : 'No active semester on record'}
          </p>
        </div>

        {open && pending.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-3.5 py-1.5 text-xs text-primary font-semibold">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {pending.length} to complete
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ['Pending', pending.length, 'Awaiting your feedback', 'bg-gold/10 text-gold-text border-gold/20', IconHourglass],
            ['Completed', done.length, 'Sealed with a signed receipt', 'bg-positive/10 text-positive border-positive/20', IconSealCheck],
            ['Enrolled subjects', subjects.length, 'Assigned this semester', 'bg-primary/10 text-primary border-primary/20', IconClipboardText],
          ] as const
        ).map(([label, value, sub, tone, Icon]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tone}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
              </div>
              <div className="text-2xl font-bold text-foreground font-display tabular-nums mt-0.5">
                {value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-sm font-semibold text-foreground">Nothing to evaluate yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            You have no subjects assigned for this semester. Ask your class adviser to confirm your
            enrollment, or check back once the evaluation window opens.
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <div id="pending" className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <h2 className="text-sm font-bold text-foreground">Pending ({pending.length})</h2>
            </div>
            <span className="text-xs text-muted-foreground">Complete before the window closes</span>
          </div>

          <div className="divide-y divide-border">
            {pending.map((s) => (
              <div
                key={s.section_subject_id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{s.subject_code}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground border border-border">
                      {s.section_name}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground">{s.subject_name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                    <span>Instructor:</span>
                    <span className="font-medium text-foreground">{s.faculty_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2.5">
                  {s.is_open ? (
                    <Link
                      href={`/student/eval/${s.section_subject_id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-brand-hover active:scale-[0.98] transition-all min-h-[38px]"
                    >
                      Start evaluation
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-text border border-gold/30">
                      Period closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div id="completed" className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-positive" />
              <h2 className="text-sm font-semibold text-foreground">Completed ({done.length})</h2>
            </div>
            <span className="text-xs text-positive font-medium">Receipt issued</span>
          </div>

          <div className="divide-y divide-border">
            {done.map((s) => (
              <div
                key={s.section_subject_id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{s.subject_code}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground border border-border">
                      {s.section_name}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground">{s.subject_name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                    <span>Instructor:</span>
                    <span className="font-medium text-foreground">{s.faculty_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {s.evaluation_id ? (
                    <Link
                      href={`/verify/${s.evaluation_id}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-positive/15 px-3 py-1 text-xs font-semibold text-positive border border-positive/30 hover:bg-positive/20"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                      Submitted · view receipt
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/15 px-3 py-1 text-xs font-semibold text-positive border border-positive/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                      Submitted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(dash?.past.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">Past semesters</h2>
          </div>
          <div className="divide-y divide-border">
            {(dash?.past ?? []).map((p) => (
              <div
                key={p.semester_id}
                className="p-4 flex items-center justify-between text-xs text-muted-foreground"
              >
                <div className="font-medium text-foreground">
                  {p.academic_year} · {p.term} semester
                </div>
                <div className="tabular-nums">
                  <span className="font-semibold text-foreground">{p.completed}</span> of {p.total}{' '}
                  completed
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
