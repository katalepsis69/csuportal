'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { CommentRow, PerQuestion } from '@/lib/types';

export type FacultyDetail = { perQuestion: PerQuestion[]; comments: CommentRow[] };

/**
 * Per-faculty dossier for the dean inspector drawer. Reads rpc_history, which
 * is dean/admin-gated in SQL and returns identity-free comments.
 */
export async function getFacultyDetail(
  semesterId: string,
  facultyId: string,
): Promise<FacultyDetail> {
  await requireRole('dean', 'admin');
  const supabase = await createClient();

  const { data: semester } = await supabase
    .from('semesters')
    .select('academic_year, term')
    .eq('id', semesterId)
    .maybeSingle<{ academic_year: string; term: '1st' | '2nd' | 'midyear' }>();
  if (!semester) return { perQuestion: [], comments: [] };

  const { data } = await supabase.rpc('rpc_history', {
    p_academic_year: semester.academic_year,
    p_term: semester.term,
    p_subject_id: null,
    p_faculty_id: facultyId,
  });

  const detail = (data ?? {}) as { per_question?: PerQuestion[]; comments?: CommentRow[] };
  return { perQuestion: detail.per_question ?? [], comments: detail.comments ?? [] };
}
