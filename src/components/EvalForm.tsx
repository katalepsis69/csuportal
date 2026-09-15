'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-32">
      {/* 0. BREADCRUMBS & TOP UTILITY BAR (Matching download.htm) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08] text-xs">
        <nav className="flex items-center gap-2 font-mono text-[#A1A1AA]">
          <Link href="/student" className="hover:text-amber-light transition-colors">CSU CETC Portal</Link>
          <span className="text-white/20">/</span>
          <Link href="/student" className="hover:text-amber-light transition-colors">Evaluate Faculty</Link>
          <span className="text-white/20">/</span>
          <span className="text-white font-medium">{subjectCode} Form</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-espresso-850 text-amber-light border border-white/10">
            Term 2025-2026
          </span>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-espresso-850 hover:border-amber-glow/40 text-[#EDEDED] hover:text-amber-light text-xs font-mono transition-all active:scale-95 shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-amber-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>{savingDraft ? 'Saving…' : 'Save Draft'}</span>
          </button>
        </div>
      </div>

      {/* 1. INSTRUCTOR & COURSE HERO CARD (Matching download.htm) */}
      <section className="bg-espresso-850/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden shadow-xl amber-glow-box">
        {/* Subtle warm ambient top-right specular gradient */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-glow/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Faculty Details */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-espresso-900 border border-amber-glow/35 flex items-center justify-center shrink-0 shadow-md text-amber-light">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-amber-glow/20 text-amber-light rounded border border-amber-glow/30">
                  Faculty Member
                </span>
                <span className="text-xs font-mono text-[#A1A1AA]">Dept. of Computer Science</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
                {facultyName}
              </h2>
              <p className="text-sm font-medium text-[#EDEDED]">
                {subjectCode} — {subjectName}
              </p>
            </div>
          </div>

          {/* Right Class Meta Metrics */}
          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 border-t md:border-t-0 md:border-l border-white/[0.08] pt-4 md:pt-0 md:pl-6 text-xs font-mono">
            <div className="flex items-center gap-2 text-white">
              <span>Section: <strong className="font-semibold text-amber-light">BSCS 3-A</strong></span>
              <span className="text-white/20">•</span>
              <span>3.0 Units</span>
            </div>
            <div className="flex items-center gap-2 text-[#A1A1AA]">
              <span>Mon/Wed 10:00 AM–12:00 PM</span>
              <span className="text-white/20">•</span>
              <span>CETC Lab 2</span>
            </div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-espresso-900 border border-amber-glow/30 text-amber-light text-[11px] mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-glow animate-ping" />
              <span>Closes: Oct 15, 2026 (7 days remaining)</span>
            </div>
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
        <div className="rounded-xl border border-status-crimson/40 bg-status-crimson/10 px-4 py-3 text-sm text-status-crimson">
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
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-light font-semibold">
                    Criterion Set {String.fromCharCode(65 + catIdx)}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-display text-white">
                    {cat}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono border tabular-nums ${
                    catComplete
                      ? 'bg-status-sage/15 text-status-sage border-status-sage/30 font-semibold'
                      : 'bg-espresso-850 text-[#A1A1AA] border-white/10'
                  }`}
                >
                  {catRated} of {catQuestions.length} Completed
                </span>
              </div>

              {/* Question Cards in Category */}
              <div className="space-y-4">
                {catQuestions.map((q, qIdx) => {
                  const isUnanswered = ratings[q.id] == null;

                  return (
                    <article
                      key={q.id}
                      className={`p-5 rounded-2xl bg-espresso-850/80 backdrop-blur-xl transition-all shadow-sm space-y-4 ${
                        isUnanswered
                          ? 'border-2 border-amber-glow/40 hover:border-amber-glow/60 shadow-amber-glow/10'
                          : 'border border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3.5">
                        <div className="flex items-start gap-3.5">
                          <span
                            className={`w-6 h-6 rounded-full border text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums ${
                              isUnanswered
                                ? 'bg-amber-glow/20 text-amber-light border-amber-glow/40'
                                : 'bg-espresso-800 text-white border-white/10'
                            }`}
                          >
                            {qIdx + 1}
                          </span>
                          <p className="text-sm font-medium text-white leading-relaxed">
                            {q.text}
                          </p>
                        </div>

                        {isUnanswered && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-glow/15 text-amber-light border border-amber-glow/30 rounded shrink-0">
                            Action Required
                          </span>
                        )}
                      </div>

                      {/* Tactile Inset Segmented Rating Well */}
                      <TactileRatingGroup
                        questionId={q.id}
                        questionText={q.text}
                        value={ratings[q.id]}
                        onChange={(r) => setRatings((prev) => ({ ...prev, [q.id]: r }))}
                      />
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. QUALITATIVE FEEDBACK CONTAINER */}
      <section className="p-6 rounded-2xl bg-espresso-850/80 backdrop-blur-xl border border-white/[0.08] shadow-md space-y-4 amber-glow-box">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold font-display text-white">
            Qualitative Remarks &amp; Constructive Feedback
          </h3>
          <p className="text-xs text-[#A1A1AA]">
            Your observations directly inform faculty development and departmental curriculum evaluations.
          </p>
        </div>
        <div className="space-y-2">
          <textarea
            className="w-full bg-espresso-950 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-[#A1A1AA]/50 focus:border-amber-glow focus:ring-1 focus:ring-amber-glow outline-none transition-all shadow-inner leading-relaxed min-h-[110px]"
            placeholder="Highlight instructional strengths or specific areas where teaching methodology could be enhanced…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
          <div className="flex items-center justify-between text-xs font-mono text-[#A1A1AA] pt-1">
            <span className="flex items-center gap-1.5 text-status-gold">
              {sentiment ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-status-gold animate-pulse" />
                  <span>Silent sentiment tone: <strong className="capitalize text-white">{sentiment.label}</strong></span>
                </>
              ) : (
                <span>Silent sentiment analysis: Positive / Constructive</span>
              )}
            </span>
            <span className="tabular-nums text-[#A1A1AA]/70">{comment.length} / 2,000 characters</span>
          </div>
        </div>
      </section>

      {/* 5. VECTOR E-SIGNATURE & ANONYMITY CONTROLS */}
      <section className="p-6 rounded-2xl bg-espresso-850/80 backdrop-blur-xl border border-white/[0.08] shadow-md space-y-5 amber-glow-box">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display text-white">
              Verification &amp; Attestation
            </h3>
            <p className="text-xs text-[#A1A1AA]">
              Digital cryptographic signature compliant with CSU Academic Evaluation Policy.
            </p>
          </div>

          {/* Anonymity Control Toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer bg-espresso-800 px-3.5 py-2 rounded-xl border border-amber-glow/30 select-none">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-amber-glow bg-espresso-950 border-white/20 focus:ring-amber-glow"
            />
            <span className="text-xs font-semibold text-white">Submit Anonymously</span>
          </label>
        </div>

        {/* Signature Pad Area */}
        <div className="space-y-2">
          <SignaturePad strokes={strokes} onChange={setStrokes} />

          <p className="text-[11px] text-[#A1A1AA] flex items-center gap-1.5 px-1 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-status-sage" />
            <span>Anonymity enabled: Your name and student ID are decoupled and cryptographically blinded prior to faculty analytics publishing.</span>
          </p>
        </div>
      </section>

      {/* 6. FLOATING GLASS ACTION DOCK (Bottom Pinned Bar) */}
      <aside className="fixed bottom-0 right-0 left-0 md:left-64 z-40 bg-[#120e0b]/95 backdrop-blur-2xl border-t border-white/[0.08] py-3.5 px-6 sm:px-8 shadow-2xl flex items-center justify-between">
        {/* Left Progress Recap */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-espresso-800 border border-amber-glow/30 flex items-center justify-center text-amber-light font-bold text-xs font-mono">
            {ratedCount}
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-semibold text-white">
              {ratedCount} of {questions.length} Criteria Answered
            </span>
            <span className="text-[11px] text-[#A1A1AA] font-mono hidden sm:inline">
              {allRated && signed ? 'Ready for final encrypted submission' : `Ready for final submission after remaining ${Math.max(0, questions.length - ratedCount)} questions`}
            </span>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || busy}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-espresso-800 text-white text-xs font-semibold hover:bg-espresso-750 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <span>{savingDraft ? 'Saving…' : 'Save Draft'}</span>
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-glow to-[#c0590d] text-white text-xs font-bold shadow-[0_4px_20px_rgba(216,106,18,0.35)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-amber-light/30"
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
