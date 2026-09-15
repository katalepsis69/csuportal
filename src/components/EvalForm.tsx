'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad, { type Strokes } from '@/components/SignaturePad';
import { saveDraft, submitEvaluation } from '@/lib/actions/evaluation';
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

  const categoryAnchors = categories.map((cat, idx) => {
    const catQuestions = questions.filter((q) => (q.category || 'General Criteria') === cat);
    const catRated = catQuestions.filter((q) => ratings[q.id] != null).length;
    return {
      id: `cat-${idx}`,
      name: cat,
      completed: catRated === catQuestions.length && catQuestions.length > 0,
      count: `${catRated}/${catQuestions.length}`,
    };
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-28">
      {/* 1. INSTRUCTOR & COURSE HERO CARD (Matching download.htm) */}
      <section className="bg-panel/75 backdrop-blur-xl border border-subtle/80 rounded-2xl p-6 relative overflow-hidden shadow-xl amber-glow-box">
        {/* Subtle warm ambient top-right specular gradient */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand/12 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Faculty Details */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-panel2 border border-brand/35 flex items-center justify-center shrink-0 shadow-md text-brand">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-brand/15 text-brand-text rounded border border-brand/30">
                  Faculty Member
                </span>
                <span className="text-xs font-mono text-cream-muted">Cotabato State University</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-cream tracking-tight">
                {facultyName}
              </h2>
              <p className="text-sm font-medium text-cream-dim">
                {subjectCode} — {subjectName}
              </p>
            </div>
          </div>

          {/* Right Class Meta Metrics */}
          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 border-t md:border-t-0 md:border-l border-subtle/60 pt-4 md:pt-0 md:pl-6 text-xs font-mono">
            <div className="flex items-center gap-2 text-cream">
              <span>Curriculum: <strong className="font-semibold text-brand-text">CETC Core</strong></span>
            </div>
            {closesAt && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-panel2 border border-brand/30 text-brand-text text-[11px] mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                <span>Closes: {new Date(closesAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. STICKY FROSTED PROGRESS CAPSULE WITH ANCHOR JUMPS */}
      <EvaluationProgressCapsule
        ratedCount={ratedCount}
        totalCount={questions.length}
        savingDraft={savingDraft}
        draftSaved={draftSaved}
        categories={categoryAnchors}
      />

      {/* Error alert if any */}
      {error && (
        <div className="rounded-xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-negative">
          {error}
        </div>
      )}

      {/* 3. QUESTIONNAIRE RUBRIC BODY */}
      <div className="space-y-8">
        {categories.map((cat, catIdx) => {
          const catQuestions = questions.filter((q) => (q.category || 'General Criteria') === cat);
          const catRated = catQuestions.filter((q) => ratings[q.id] != null).length;
          const catComplete = catRated === catQuestions.length;

          return (
            <div key={cat} id={`cat-${catIdx}`} className="space-y-4 pt-2">
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-subtle/80 pb-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-brand font-semibold">
                    Criterion Set {String.fromCharCode(65 + catIdx)}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-display text-cream">
                    {cat}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono border tabular-nums ${
                    catComplete
                      ? 'bg-positive/15 text-positive border-positive/30 font-semibold'
                      : 'bg-panel2 text-cream-muted border-subtle'
                  }`}
                >
                  {catRated} of {catQuestions.length} Completed
                </span>
              </div>

              {/* Question Cards in Category */}
              <div className="space-y-4">
                {catQuestions.map((q, qIdx) => (
                  <article
                    key={q.id}
                    className="p-5 rounded-2xl bg-panel/75 backdrop-blur-xl border border-subtle/80 hover:border-brand/40 transition-colors shadow-sm space-y-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="w-6 h-6 rounded-full bg-panel2 border border-brand/30 text-xs font-mono font-bold text-brand flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                        {qIdx + 1}
                      </span>
                      <p className="text-sm font-medium text-cream leading-relaxed">
                        {q.text}
                      </p>
                    </div>

                    {/* Tactile Inset Segmented Rating Well */}
                    <TactileRatingGroup
                      questionId={q.id}
                      questionText={q.text}
                      value={ratings[q.id]}
                      onChange={(r) => setRatings((prev) => ({ ...prev, [q.id]: r }))}
                    />
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. QUALITATIVE FEEDBACK CONTAINER */}
      <section className="p-6 rounded-2xl bg-panel/75 backdrop-blur-xl border border-subtle/80 shadow-md space-y-4">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold font-display text-cream">
            Qualitative Remarks &amp; Constructive Feedback
          </h3>
          <p className="text-xs text-cream-muted">
            Your observations directly inform faculty development and departmental curriculum evaluations.
          </p>
        </div>
        <div className="space-y-2">
          <textarea
            className="w-full bg-inset-well border border-subtle/80 rounded-xl p-4 text-sm text-cream placeholder:text-cream-faint focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all shadow-inner leading-relaxed min-h-[110px]"
            placeholder="Highlight instructional strengths or specific areas where teaching methodology could be enhanced…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
          <div className="flex items-center justify-between text-xs font-mono text-cream-muted pt-1">
            <span className="flex items-center gap-1.5 text-gold-text">
              {sentiment ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                  <span>Silent sentiment tone: <strong className="capitalize text-cream">{sentiment.label}</strong></span>
                </>
              ) : (
                <span>Silent sentiment analysis enabled</span>
              )}
            </span>
            <span className="tabular-nums text-cream-faint">{comment.length} / 2,000</span>
          </div>
        </div>
      </section>

      {/* 5. VECTOR E-SIGNATURE & ANONYMITY CONTROLS */}
      <section className="p-6 rounded-2xl bg-panel/75 backdrop-blur-xl border border-subtle/80 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display text-cream">
              Verification &amp; Attestation
            </h3>
            <p className="text-xs text-cream-muted">
              Digital cryptographic signature compliant with CSU Academic Evaluation Policy.
            </p>
          </div>

          {/* Anonymity Control Toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer bg-panel2 px-3.5 py-2 rounded-xl border border-brand/30 select-none">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-brand bg-inset-well border-subtle focus:ring-brand"
            />
            <span className="text-xs font-semibold text-cream">Submit Anonymously</span>
          </label>
        </div>

        {/* Signature Pad Area */}
        <div className="space-y-2">
          <div className="relative rounded-xl border border-subtle/80 bg-inset-well p-3 shadow-inner overflow-hidden">
            <SignaturePad strokes={strokes} onChange={setStrokes} />
          </div>

          <p className="text-[11px] text-cream-muted flex items-center gap-1.5 px-1 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" />
            <span>Anonymity enabled: Student identity is decoupled and blinded prior to faculty reporting.</span>
          </p>
        </div>
      </section>

      {/* 6. FLOATING GLASS ACTION DOCK (Bottom Pinned Bar) */}
      <aside className="fixed bottom-0 inset-x-0 md:pl-[84px] z-40 bg-panel/95 backdrop-blur-2xl border-t border-subtle/80 py-3.5 px-6 sm:px-8 shadow-2xl flex items-center justify-between">
        {/* Left Progress Recap */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-panel2 border border-brand/30 flex items-center justify-center text-brand font-bold text-xs font-mono">
            {ratedCount}
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-semibold text-cream">
              {ratedCount} of {questions.length} Questions Answered
            </span>
            <span className="text-[11px] text-cream-muted font-mono hidden sm:inline">
              {allRated && signed ? 'Ready for final encrypted submission' : 'Answer all questions & sign to submit'}
            </span>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || busy}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-subtle bg-bg2 text-cream text-xs font-semibold hover:bg-panel2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <span>{savingDraft ? 'Saving…' : 'Save Draft'}</span>
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-[0_4px_20px_rgba(216,106,18,0.35)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{busy ? 'Submitting…' : 'Submit Evaluation'}</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </aside>
    </form>
  );
}
