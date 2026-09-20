import { redirect } from 'next/navigation';
import EvalForm from '@/components/EvalForm';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function EvalPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('student');
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: row }, { data: questions, error: qErr }, { data: draft }] = await Promise.all([
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

  if (!row || row.evaluation_id || !row.is_open || qErr || !questions || questions.length === 0) {
    redirect('/student');
  }

  return (
    <EvalForm
      sectionSubjectId={id}
      subjectCode={row.subject_code}
      subjectName={row.subject_name}
      facultyName={row.faculty_name}
      closesAt={row.closes_at}
      questions={questions}
      draft={draft ?? null}
    />
  );
}
