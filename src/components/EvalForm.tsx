'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad, { type Strokes } from '@/components/SignaturePad';
import { saveDraft, submitEvaluation } from '@/lib/actions/evaluation';
import { IconFloppyDisk } from '@/components/icons';
import { TactileRatingGroup } from '@/components/TactileRatingGroup';
import { EvaluationProgressCapsule } from '@/components/EvaluationProgressCapsule';
import type { SentimentResult } from '@/lib/sentiment';

type Question = { id: string; text: string; category: string };

type Draft = {
  answers: { question_id: string; rating: number }[];
  comment: string | null;
  anonymous: boolean;
} | null;

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function EvalForm({
  sectionSubjectId,
  subjectCode,
  subjectName,
  facultyName,
  closesAt,
  questions,
  draft = null,
}: {
  sectionSubjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  closesAt: string | null;
  questions: Question[];
  draft?: Draft;
}) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const a of draft?.answers ?? []) initial[a.question_id] = a.rating;
    return initial;
  });
  const [comment, setComment] = useState(draft?.comment ?? '');
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [anonymous, setAnonymous] = useState(draft?.anonymous ?? true);
  const [strokes, setStrokes] = useState<Strokes>([]);
  const [busy, setBusy] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(draft != null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // client-side sentiment — lazy-loaded
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (comment.trim().length < 3) {
        setSentiment(null);
        return;
      }
      try {
        const { classifyComment } = await import('@/lib/sentiment');
        setSentiment(await classifyComment(comment));
      } catch {
        setSentiment(null);
      }
    }, 700);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [comment]);

  const ratedCount = questions.filter((q) => ratings[q.id] != null).length;
  const allRated = questions.length > 0 && ratedCount === questions.length;
  const signed = strokes.length > 0 && strokes.some((s) => s.length > 0);
  const canSubmit = allRated && signed && !busy;

  function currentAnswers() {
    return questions
      .filter((q) => ratings[q.id])
      .map((q) => ({ question_id: q.id, rating: ratings[q.id] }));
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    setError(null);
    const result = await saveDraft({
      sectionSubjectId,
      anonymous,
      comment,
      answers: currentAnswers(),
    });
    setSavingDraft(false);
    if (result.ok) {
      setDraftSaved(true);
    } else {
      setError(result.error ?? 'Could not save draft.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);

    // integrity marker: SHA-256 over the submitted payload
    const payloadHash = await sha256Hex(
      JSON.stringify({
        a: currentAnswers(),
        c: comment.trim(),
        anon: anonymous,
        sig: strokes,
      }),
    );

    const result = await submitEvaluation({
      sectionSubjectId,
      anonymous,
      comment,
      sentiment,
      signaturePoints: strokes,
      answers: currentAnswers(),
      payloadHash,
    });
    if (result.ok) {
      router.push(`/student?submitted=1&h=${payloadHash.slice(0, 16)}`);
      router.refresh();
    } else {
      setError(result.error ?? 'Submission failed.');
      setBusy(false);
    }
  }

  // Group questions by category
  const categories = Array.from(new Set(questions.map((q) => q.category || 'General Criteria')));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Course & Instructor Header Hero */}
      <div className="card rounded-2xl p-4 sm:p-5 border border-subtle/80 shadow-beautiful-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-brand font-bold">
              Course Appraisal Rubric
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-cream mt-0.5">
              {subjectCode} — {subjectName}
            </h1>
          </div>
          {closesAt && (
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand-text border border-brand/30">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              Closes {new Date(closesAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-cream-muted">
          Evaluating Instructor: <span className="font-semibold text-cream">{facultyName}</span>
        </p>
      </div>

      {/* Sticky Frosted Progress Capsule */}
      <EvaluationProgressCapsule
        ratedCount={ratedCount}
        totalCount={questions.length}
        savingDraft={savingDraft}
        draftSaved={draftSaved}
      />

      {/* Category-Grouped Question Rubric */}
      {categories.map((cat, catIdx) => {
        const catQuestions = questions.filter((q) => (q.category || 'General Criteria') === cat);
        const catRated = catQuestions.filter((q) => ratings[q.id] != null).length;
        const catComplete = catRated === catQuestions.length;

        return (
          <section
            key={cat}
            className="card rounded-2xl p-4 sm:p-6 border border-subtle/80 shadow-beautiful-sm space-y-5"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between border-b border-subtle/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/15 text-xs font-mono font-bold text-brand-text border border-brand/30">
                  {catIdx + 1}
                </span>
                <h2 className="text-base font-bold font-display text-cream tracking-tight">
                  {cat}
                </h2>
              </div>
              <span
                className={`text-xs font-mono px-2.5 py-0.5 rounded-full border tabular-nums ${
                  catComplete
                    ? 'bg-positive/15 text-positive border-positive/30 font-semibold'
                    : 'bg-panel2 text-cream-muted border-subtle'
                }`}
              >
                {catRated} / {catQuestions.length}
              </span>
            </div>

            {/* Questions in Category */}
            <div className="space-y-6">
              {catQuestions.map((q, qIdx) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono text-cream-faint">{catIdx + 1}.{qIdx + 1}</span>
                    <p className="text-sm font-medium text-cream leading-relaxed max-w-prose">
                      {q.text}
                    </p>
                  </div>
                  <TactileRatingGroup
                    questionId={q.id}
                    questionText={q.text}
                    value={ratings[q.id]}
                    onChange={(r) => setRatings((prev) => ({ ...prev, [q.id]: r }))}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Qualitative Feedback & Signature Area */}
      <div className="card rounded-2xl p-4 sm:p-6 border border-subtle/80 shadow-beautiful-sm space-y-5">
        <div>
          <label className="label" htmlFor="comment">
            Qualitative Observations & Constructive Remarks (Optional)
          </label>
          <textarea
            id="comment"
            className="input min-h-24 leading-relaxed"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Highlight instructional strengths or specific areas where teaching methodology could be enhanced…"
          />
          {sentiment && (
            <p className="mt-1.5 text-xs text-cream-faint flex items-center gap-1.5">
              <span>Feedback tone:</span>
              <span className="font-semibold text-gold-text capitalize">{sentiment.sentiment}</span>
            </p>
          )}
        </div>

        <div>
          <label className="label">E-Signature Verification (Required)</label>
          <div className="rounded-xl border border-subtle/80 bg-inset-well p-3">
            <SignaturePad strokes={strokes} onChange={setStrokes} />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-cream-dim select-none cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-subtle bg-bg2 accent-[#D86A12] cursor-pointer"
          />
          <span>Submit anonymously (identity cryptographically blinded from faculty)</span>
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-negative font-medium">
          {error}
        </div>
      )}

      {/* Floating Frosted Glass Action Dock */}
      <div className="glass-panel sticky bottom-3 z-30 rounded-2xl p-3.5 sm:p-4 shadow-beautiful-lg backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-glass-border">
        <div className="text-xs text-cream-muted">
          {!allRated ? (
            <span className="text-gold-text font-medium">
              Please rate all {questions.length} questions before final submission
            </span>
          ) : !signed ? (
            <span className="text-gold-text font-medium">
              Please provide your digital e-signature above
            </span>
          ) : (
            <span className="text-positive font-semibold">
              Ready to submit — all criteria and signature verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="btn-outline"
            onClick={handleSaveDraft}
            disabled={savingDraft}
          >
            <IconFloppyDisk className="h-4 w-4" />
            {savingDraft ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="submit"
            className="btn"
            disabled={!canSubmit}
          >
            {busy ? 'Submitting…' : 'Submit Evaluation'}
          </button>
        </div>
      </div>
    </form>
  );
}
