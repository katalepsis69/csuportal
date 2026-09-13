'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad, { type Strokes } from '@/components/SignaturePad';
import { classifyComment, type SentimentResult } from '@/lib/sentiment';
import { submitEvaluation } from '@/lib/actions/evaluation';

type Question = { id: string; text: string; category: string };

const SCALE = ['1', '2', '3', '4', '5'];

export default function EvalForm({
  sectionSubjectId,
  subjectCode,
  subjectName,
  facultyName,
  closesAt,
  questions,
}: {
  sectionSubjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  closesAt: string | null;
  questions: Question[];
}) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [anonymous, setAnonymous] = useState(true);
  const [strokes, setStrokes] = useState<Strokes>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // silent client-side sentiment — never shown, never blocks submit
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSentiment(await classifyComment(comment));
    }, 700);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [comment]);

  const allRated = questions.every((q) => ratings[q.id]);
  const signed = strokes.length > 0 && strokes.some((s) => s.length > 0);
  const canSubmit = allRated && signed && !busy;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const result = await submitEvaluation({
      sectionSubjectId,
      anonymous,
      comment,
      sentiment,
      signaturePoints: strokes,
      answers: questions.map((q) => ({ question_id: q.id, rating: ratings[q.id] })),
    });
    if (result.ok) {
      router.push('/student?submitted=1');
      router.refresh();
    } else {
      setError(result.error ?? 'Submission failed.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold">
          {subjectCode} — {subjectName}
        </h2>
        <p className="text-sm text-slate-500">
          Faculty: <span className="font-medium text-slate-700">{facultyName}</span>
          {closesAt && <> · Open until {new Date(closesAt).toLocaleString()}</>}
        </p>
      </div>

      <div className="card space-y-5">
        <h3 className="text-sm font-semibold">Rate your instructor (5 = strongly agree)</h3>
        {questions.map((q) => (
          <div key={q.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
            <p className="mb-2 text-sm">
              <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                {q.category}
              </span>
              {q.text}
            </p>
            <div className="flex gap-2">
              {SCALE.map((n) => {
                const value = Number(n);
                const active = ratings[q.id] === value;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${q.text} — ${n}`}
                    onClick={() => setRatings((r) => ({ ...r, [q.id]: value }))}
                    className={`h-9 w-9 cursor-pointer rounded-md border text-sm font-medium transition ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {n}
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
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="h-4 w-4"
          />
          Submit anonymously (your name stays hidden from the faculty)
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn" disabled={!canSubmit}>
          {busy ? 'Submitting…' : 'Submit evaluation'}
        </button>
        {!allRated && <span className="text-xs text-slate-400">Rate all questions to continue</span>}
        {!signed && <span className="text-xs text-slate-400">Sign above to continue</span>}
      </div>
    </form>
  );
}
