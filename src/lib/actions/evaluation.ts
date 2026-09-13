'use server';

export type SubmitInput = {
  sectionSubjectId: string;
  anonymous: boolean;
  comment: string;
  sentiment: { label: 'positive' | 'neutral' | 'negative'; score: number } | null;
  signaturePoints: { x: number; y: number }[][];
  answers: { question_id: string; rating: number }[];
  payloadHash?: string;
};

export type DraftInput = {
  sectionSubjectId: string;
  anonymous: boolean;
  comment: string;
  answers: { question_id: string; rating: number }[];
};

export type SubmitResult = { ok: boolean; error?: string };

const FRIENDLY: Record<string, string> = {
  not_enrolled: 'You are not enrolled in this subject.',
  period_closed: 'The evaluation period is closed.',
  already_submitted: 'You already submitted an evaluation for this subject.',
  comment_too_long: 'Comment is too long (max 2,000 characters).',
  payload_too_large: 'Draft is too large.',
};

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

/**
 * Submits through rpc_submit_evaluation — one atomic transaction.
 * RLS re-checks ownership on every insert (invoker rights), so even a
 * tampered client can only submit its own enrolled subjects.
 */
export async function submitEvaluation(input: SubmitInput): Promise<SubmitResult> {
  const supabase = await getClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: 'Please sign in again.' };

  if (input.signaturePoints.length === 0) {
    return { ok: false, error: 'Signature is required.' };
  }
  if (input.answers.length === 0) {
    return { ok: false, error: 'Please rate all questions.' };
  }

  const { data, error } = await supabase.rpc('rpc_submit_evaluation', {
    p_section_subject_id: input.sectionSubjectId,
    p_anonymous: input.anonymous,
    p_comment: input.comment,
    p_sentiment: input.sentiment?.label ?? 'neutral',
    p_sentiment_score: input.sentiment?.score ?? 0,
    p_signature: input.signaturePoints,
    p_answers: input.answers,
    p_payload_hash: input.payloadHash ?? null,
  });

  if (error) return { ok: false, error: error.message };

  const result = data as SubmitResult;
  if (!result?.ok) {
    return { ok: false, error: FRIENDLY[result?.error ?? ''] ?? 'Submission failed.' };
  }
  return { ok: true };
}

/** Upserts the student's draft for one subject (RLS: own drafts only). */
export async function saveDraft(input: DraftInput): Promise<SubmitResult> {
  const supabase = await getClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: 'Please sign in again.' };

  const { data, error } = await supabase.rpc('rpc_save_draft', {
    p_section_subject_id: input.sectionSubjectId,
    p_answers: input.answers,
    p_comment: input.comment,
    p_anonymous: input.anonymous,
  });

  if (error) return { ok: false, error: error.message };

  const result = data as SubmitResult;
  if (!result?.ok) {
    return { ok: false, error: FRIENDLY[result?.error ?? ''] ?? 'Could not save draft.' };
  }
  return { ok: true };
}
