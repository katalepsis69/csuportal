'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad, { type Strokes } from '@/components/SignaturePad';
import { saveDraft, submitEvaluation } from '@/lib/actions/evaluation';
import { IconFloppyDisk, IconStar } from '@/components/icons';
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

  // silent client-side sentiment — lazy-loaded, never shown, never blocks submit
  // ponytail: dynamic import keeps ~136MB WASM out of initial bundle
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

  const allRated = questions.every((q) => ratings[q.id]);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="card">
        <h2 className="panel-title">
          {subjectCode} — {subjectName}
        </h2>
        <p className="text-sm text-cream-muted">
          Faculty: <span className="font-medium text-cream-dim">{facultyName}</span>
          {closesAt && <> · Open until {new Date(closesAt).toLocaleString()}</>}
        </p>
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-bold">Rate your instructor</h3>
        {questions.map((q) => (
          <div key={q.id} className="border-b border-subtle pb-3 last:border-0 last:pb-0">
            <p className="mb-2 text-sm text-cream-dim">
              <span className="chip mr-2">{q.category}</span>
              {q.text}
            </p>
            <div className="flex gap-1" role="group" aria-label={`Rate: ${q.text}`}>
              {[1, 2, 3, 4, 5].map((n) => {
                const active = ratings[q.id] != null && ratings[q.id] >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} of 5`}
                    aria-pressed={ratings[q.id] === n}
                    onClick={() => setRatings((r) => ({ ...r, [q.id]: n }))}
                    className={`cursor-pointer rounded-md p-1 transition-transform duration-150 hover:scale-110 ${
                      active ? 'text-gold' : 'text-cream-faint'
                    }`}
                  >
                    <IconStar className="h-6 w-6" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label" htmlFor="comment">
            Comments (optional, English or Tagalog)
          </label>
          <textarea
            id="comment"
            className="input min-h-24"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like? What can be improved?"
          />
        </div>
        <div>
          <label className="label">E-signature (required)</label>
          <SignaturePad strokes={strokes} onChange={setStrokes} />
        </div>
        <label className="flex items-center gap-2 text-sm text-cream-dim">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="h-4 w-4 accent-[#D86A12]"
          />
          Submit anonymously (your name stays hidden from the faculty)
        </label>
      </div>

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn" disabled={!canSubmit}>
          {busy ? 'Submitting…' : 'Submit Evaluation'}
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={handleSaveDraft}
          disabled={savingDraft}
        >
          <IconFloppyDisk className="h-4 w-4" />
          {savingDraft ? 'Saving…' : 'Save Draft'}
        </button>
        {draftSaved && !allRated && (
          <span className="text-xs text-gold-text">Draft restored — finish anytime</span>
        )}
        {!allRated && <span className="text-xs text-cream-faint">Rate all questions to submit</span>}
        {!signed && <span className="text-xs text-cream-faint">Sign above to submit</span>}
      </div>
    </form>
  );
}
