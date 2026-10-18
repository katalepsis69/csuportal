import { redirect } from 'next/navigation';
import EvalForm from '@/components/EvalForm';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function EvalPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('student');
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: rowData }, { data: questionsData }, { data: draft }] = await Promise.all([
    supabase.from('student_evals').select('*').eq('section_subject_id', id).maybeSingle(),
    supabase
      .from('questions')
      .select('id, text, category')
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('drafts')
      .select('answers, comment, anonymous')
      .eq('section_subject_id', id)
      .maybeSingle(),
  ]);

  const row = rowData as
    | {
        subject_code: string;
        subject_name: string;
        section_name: string;
        faculty_name: string;
        is_open: boolean;
        closes_at: string | null;
        evaluation_id: string | null;
      }
    | null;

  if (!row || row.evaluation_id || !row.is_open) redirect('/student');

  const questions = (questionsData ?? []) as { id: string; text: string; category: string }[];

  if (questions.length === 0) {
    return (
      <div className="card text-center py-10 max-w-xl mx-auto">
        <p className="text-sm font-semibold text-foreground">This questionnaire is not configured</p>
        <p className="text-xs text-muted-foreground mt-1">
          No evaluation questions are active yet. The college office must publish the rubric before
          submissions can be accepted.
        </p>
      </div>
    );
  }

  return (
    <EvalForm
      sectionSubjectId={id}
      subjectCode={row.subject_code}
      subjectName={row.subject_name}
      sectionName={row.section_name}
      facultyName={row.faculty_name}
      closesAt={row.closes_at}
      questions={questions}
      draft={draft ?? null}
    />
  );
}
