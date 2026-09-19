'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

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

// trust boundary schemas (client payloads are untrusted by definition)
const SubmitSchema = z.object({
  sectionSubjectId: z.string().uuid(),
  anonymous: z.boolean(),
  comment: z.string().max(2000, 'Comment is too long (max 2,000 characters).'),
  sentiment: z
    .object({
      label: z.enum(['positive', 'neutral', 'negative']),
      score: z.number(),
    })
    .nullable()
    .optional(),
  signaturePoints: z
    .array(z.array(z.object({ x: z.number(), y: z.number() })))
    .max(200, 'Signature has too many strokes.'),
  answers: z
    .array(
      z.object({
        question_id: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
      }),
    )
    .max(200),
  payloadHash: z.string().max(128).optional(),
});

const DraftSchema = z.object({
  sectionSubjectId: z.string().uuid(),
  anonymous: z.boolean(),
  comment: z.string().max(2000, 'Comment is too long (max 2,000 characters).'),
  answers: z
    .array(z.object({ question_id: z.string().uuid(), rating: z.number().int().min(1).max(5) }))
    .max(200),
});

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

  // trust boundary: validate shape before it reaches the RPC
  const parsed = SubmitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid submission payload.' };
  const valid = parsed.data;

  if (valid.signaturePoints.length === 0) {
    return { ok: false, error: 'Signature is required.' };
  }
  if (valid.answers.length === 0) {
    return { ok: false, error: 'Please rate all questions.' };
  }

  // server-side lexicon is authoritative; the client tag is display-only
  const { classifyComment } = await import('@/lib/sentiment');
  const sentiment = await classifyComment(valid.comment);

  const { data, error } = await supabase.rpc('rpc_submit_evaluation', {
    p_section_subject_id: valid.sectionSubjectId,
    p_anonymous: valid.anonymous,
    p_comment: valid.comment,
    p_sentiment: sentiment?.label ?? 'neutral',
    p_sentiment_score: sentiment?.score ?? 0,
    p_signature: valid.signaturePoints,
    p_answers: valid.answers,
    p_payload_hash: valid.payloadHash ?? null,
  });

  if (error) return { ok: false, error: error.message };

  const result = data as SubmitResult;
  if (!result?.ok) {
    return { ok: false, error: FRIENDLY[result?.error ?? ''] ?? 'Submission failed.' };
  }
  revalidateTag('evals', 'max'); // refresh the cached dean overview
  return { ok: true };
}

/** Upserts the student's draft for one subject (RLS: own drafts only). */
export async function saveDraft(input: DraftInput): Promise<SubmitResult> {
  const supabase = await getClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: 'Please sign in again.' };

  // trust boundary: validate shape before it reaches the RPC
  const parsed = DraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Could not save draft.' };
  const valid = parsed.data;

  const { data, error } = await supabase.rpc('rpc_save_draft', {
    p_section_subject_id: valid.sectionSubjectId,
    p_answers: valid.answers,
    p_comment: valid.comment,
    p_anonymous: valid.anonymous,
  });

  if (error) return { ok: false, error: error.message };

  const result = data as SubmitResult;
  if (!result?.ok) {
    return { ok: false, error: FRIENDLY[result?.error ?? ''] ?? 'Could not save draft.' };
  }
  return { ok: true };
}
