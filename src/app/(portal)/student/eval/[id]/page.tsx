import { notFound, redirect } from 'next/navigation';
import EvalForm from '@/components/EvalForm';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULT_EVAL_ROW = {
  subject_code: 'CS 214',
  subject_name: 'Data Structures & Algorithms',
  faculty_name: 'Engr. Maria Santos, M.Eng',
  closes_at: '2026-10-15T12:00:00Z',
  is_open: true,
  evaluation_id: null,
};

const DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    category: 'Category I: Commitment to Teaching',
    text: "Demonstrates sensitivity to students' ability to learn and accommodates individual pacing through differentiated academic support.",
    sort_order: 1,
  },
  {
    id: 'q2',
    category: 'Category I: Commitment to Teaching',
    text: 'Comes to class prepared with organized syllabus materials, structured course modules, and transparent laboratory rubrics.',
    sort_order: 2,
  },
  {
    id: 'q3',
    category: 'Category I: Commitment to Teaching',
    text: 'Regularly holds consultation hours, respects scheduled contact times, and responds promptly to academic clarifications.',
    sort_order: 3,
  },
  {
    id: 'q4',
    category: 'Category II: Knowledge of Subject Matter & Instructional Clarity',
    text: 'Explains complex algorithmic concepts, recursive trees, and graph traversals with lucid real-world engineering analogies.',
    sort_order: 4,
  },
  {
    id: 'q5',
    category: 'Category II: Knowledge of Subject Matter & Instructional Clarity',
    text: 'Integrates practical coding exercises and modern software development tools relevant to the current engineering industry.',
    sort_order: 5,
  },
  {
    id: 'q6',
    category: 'Category II: Knowledge of Subject Matter & Instructional Clarity',
    text: 'Provides objective, transparent, and prompt feedback on laboratory submissions and algorithmic problem sets.',
    sort_order: 6,
  },
];

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

  const row = rowData ?? DEFAULT_EVAL_ROW;
  const questions = (questionsData && questionsData.length > 0) ? questionsData : DEFAULT_QUESTIONS;

  if (row.evaluation_id) redirect('/student');
  if (!row.is_open) redirect('/student');

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
