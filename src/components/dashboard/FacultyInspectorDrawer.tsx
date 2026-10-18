'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { DeanFacultyRow } from './DeanFacultyTable';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import { getFacultyDetail, type FacultyDetail } from '@/lib/actions/dean';

function getInitials(name: string) {
  return (
    name
      .replace(/^(Engr\.|Dr\.|Prof\.)\s*/, '')
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'FC'
  );
}

export function FacultyInspectorDrawer({
  faculty,
  semesterId,
  semesterLabel,
  onClose,
}: {
  faculty: DeanFacultyRow | null;
  semesterId: string | null;
  semesterLabel: string;
  onClose: () => void;
}) {
  const [dossier, setDossier] = useState<{ key: string; detail: FacultyDetail } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (faculty) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [faculty, onClose]);

  const key = faculty && semesterId ? `${semesterId}:${faculty.id}` : null;

  useEffect(() => {
    if (!faculty || !semesterId) return;
    let alive = true;
    getFacultyDetail(semesterId, faculty.id)
      .then((detail) => alive && setDossier({ key: `${semesterId}:${faculty.id}`, detail }))
      .catch(() => alive && setFailedKey(`${semesterId}:${faculty.id}`));
    return () => {
      alive = false;
    };
  }, [faculty, semesterId]);

  if (!faculty) return null;

  const detail = dossier?.key === key ? dossier.detail : null;
  const failed = failedKey === key;

  const criteria = detail?.perQuestion ?? [];
  const comments = detail?.comments ?? [];
  const counts = comments.reduce(
    (acc, c) => ({ ...acc, [c.label ?? 'neutral']: (acc[c.label ?? 'neutral'] ?? 0) + 1 }),
    {} as Record<string, number>,
  );
  const sentiment = {
    positive: counts.positive ?? 0,
    neutral: counts.neutral ?? 0,
    negative: counts.negative ?? 0,
  };
  const pdfData = {
    facultyName: faculty.name,
    semesterLabel,
    detail: { per_question: criteria, comments },
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 2xl:hidden pointer-events-auto"
        aria-hidden="true"
      />

      <aside className="w-full sm:w-[440px] fixed top-0 right-0 bottom-0 z-50 bg-card border-l border-border flex flex-col drawer-shadow overflow-y-auto pointer-events-auto animate-[slide-in-right_220ms_cubic-bezier(0.16,1,0.3,1)]">
        <div className="p-6 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-primary/10 text-primary border border-primary/30">
              Faculty dossier
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Close panel"
              aria-label="Close dossier"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg shrink-0">
              {getInitials(faculty.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="drawer-title" className="font-display font-semibold text-lg text-foreground leading-snug">
                {faculty.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{semesterLabel}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] bg-muted text-foreground border border-border font-semibold tabular-nums">
                  {faculty.overallRating != null ? `${faculty.overallRating.toFixed(2)} / 5.0` : 'No rating yet'}
                  {' · '}
                  {faculty.ratingLabel}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {faculty.responsesReceived} responses · {faculty.sectionsCount} sections
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {!semesterId && (
            <p className="text-xs text-muted-foreground">
              Select a semester to load this faculty member&rsquo;s detail.
            </p>
          )}

          {failed && (
            <p className="text-xs text-negative">Could not load the dossier. Try again later.</p>
          )}

          {!failed && !detail && semesterId && (
            <p className="text-xs text-muted-foreground">Loading dossier…</p>
          )}

          {detail && (
            <>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Criteria breakdown
                </h4>
                <div className="space-y-3">
                  {criteria.map((c) => {
                    const score = c.avg_rating;
                    return (
                      <div key={`${c.category}-${c.text}`}>
                        <div className="flex justify-between text-xs mb-1 gap-2">
                          <span className="text-muted-foreground">{c.category}</span>
                          <span className="font-bold text-foreground tabular-nums shrink-0">
                            {score != null ? score.toFixed(2) : '—'}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground mb-1">{c.text}</p>
                        <div className="h-1.5 w-full bg-muted border border-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{ width: `${score != null ? Math.min(100, (score / 5) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {criteria.length === 0 && (
                    <p className="text-xs text-muted-foreground">No ratings recorded yet.</p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Comment sentiment
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {(
                    [
                      ['Positive', sentiment.positive, 'text-positive'],
                      ['Neutral', sentiment.neutral, 'text-muted-foreground'],
                      ['Critical', sentiment.negative, 'text-negative'],
                    ] as const
                  ).map(([name, count, tone]) => (
                    <div key={name} className="p-2 rounded-lg bg-card border border-border">
                      <span className={`text-xs font-bold tabular-nums ${tone}`}>{count}</span>
                      <p className="text-[10px] text-muted-foreground">{name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Anonymous student comments ({comments.length})
                </h4>
                <div className="space-y-3">
                  {comments.slice(0, 20).map((r, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-card border border-border">
                      <div className="flex items-center justify-between text-[10px] mb-2">
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold border uppercase ${
                            r.label === 'positive'
                              ? 'bg-positive/10 text-positive border-positive/20'
                              : r.label === 'negative'
                                ? 'bg-negative/10 text-negative border-negative/20'
                                : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {r.label ?? 'neutral'}
                        </span>
                        <span className="text-muted-foreground">
                          {r.at ? new Date(r.at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-xs text-muted-foreground">No comments recorded yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-border bg-card space-y-2.5 shrink-0">
          <PdfDownloadButton
            type="faculty_detailed"
            filename={`faculty-dossier-${faculty.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`}
            data={pdfData}
            label="Download dossier PDF"
          />
          <Link
            href={`/dean/history`}
            className="block w-full text-center bg-muted hover:bg-accent text-foreground py-2.5 px-4 rounded-xl text-xs font-medium border border-border transition-colors"
          >
            Open full history drill-down
          </Link>
        </div>
      </aside>
    </div>
  );
}
