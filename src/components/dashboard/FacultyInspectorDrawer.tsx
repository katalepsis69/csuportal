'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { DeanFacultyRow } from './DeanFacultyTable';
import PdfDownloadButton from '@/components/PdfDownloadButton';

interface FacultyInspectorDrawerProps {
  faculty: DeanFacultyRow | null;
  semesterLabel: string;
  onClose: () => void;
  isOpen?: boolean;
}

export function FacultyInspectorDrawer({
  faculty,
  semesterLabel,
  onClose,
  isOpen = true,
}: FacultyInspectorDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (faculty && isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [faculty, isOpen, onClose]);

  if (!faculty || !isOpen) return null;

  const rating = faculty.overallRating;
  const ratingStr = rating != null ? rating.toFixed(2) : '—';
  const evals = faculty.responsesReceived ?? faculty.evaluationsReceived ?? 0;
  const posPct = faculty.sentimentRatio?.positive ?? 0;
  const neuPct = faculty.sentimentRatio?.neutral ?? 0;
  const negPct = faculty.sentimentRatio?.negative ?? 0;
  const posCount = Math.round((evals * posPct) / 100);
  const neuCount = Math.round((evals * neuPct) / 100);
  const negCount = Math.max(0, evals - posCount - neuCount);

  const criteria = faculty.pedagogicalBreakdown || [];
  const remarks = faculty.comments || [];

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

  const dossierId = faculty.dossierId || `FC-${faculty.id.slice(0, 4).toUpperCase() || '2018'}-09`;

  const pdfData = {
    overview: {
      overall: rating,
      per_question: criteria.map((c) => ({ category: c.name, text: c.name, avg_rating: c.score })),
      per_subject: [
        {
          subject_code: 'CS 214',
          subject_name: 'Data Structures & Algorithms',
          section_name: 'BSCS 3-A',
          evals,
          avg_rating: rating,
        },
      ],
      sentiment: { positive: posCount, neutral: neuCount, negative: negCount },
      comments: remarks.map((c) => ({ comment: c.text, label: c.type.toLowerCase() })),
    },
    facultyName: faculty.name,
    semesterLabel,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      {/* Backdrop overlay for smaller viewports */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto animate-[fade-in_200ms_ease-out]"
        aria-hidden="true"
      />

      {/* Right pinned 440px drawer */}
      <aside
        className="w-full sm:w-[440px] fixed top-0 right-0 bottom-0 z-50 bg-card border-l border-border flex flex-col justify-between shadow-xl overflow-y-auto pointer-events-auto animate-[slide-in-right_220ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-border bg-card relative shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-primary/10 text-primary border border-primary/25">
                FACULTY DOSSIER
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">ID: {dossierId}</span>
            </div>

            {/* Close trigger */}
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Close Panel"
              aria-label="Close dossier"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Instructor Identity Card */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground border border-primary/30 flex items-center justify-center font-display font-bold text-lg shadow-xs shrink-0">
              {getInitials(faculty.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="drawer-title" className="font-display font-bold text-lg text-foreground leading-snug">
                {faculty.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {faculty.department || 'Department of Computer Science & Engineering'}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded text-[10px] bg-positive/10 text-positive border border-positive/25 font-semibold">
                  ★ {ratingStr} {faculty.ratingLabel || 'OUTSTANDING'}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{evals} Students Rated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Body Content */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 overflow-y-auto">
          {/* Score Matrix Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-muted/30 border border-border shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Pedagogical Criteria Breakdown
              </h4>
            </div>

            <div className="space-y-3">
              {criteria.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground/90">{c.name}</span>
                    <span className="font-bold text-primary tabular-nums">
                      {c.score.toFixed(2)} <span className="text-muted-foreground/60 font-normal text-[10px]">/ 5.0</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.color || 'bg-primary'}`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
              {criteria.length === 0 && (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  Pedagogical criteria breakdown pending evaluation responses.
                </p>
              )}
            </div>
          </div>

          {/* Sentiment Index & Distribution */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-muted/30 border border-border shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Student Qualitative Sentiment
              </h4>
              <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                {evals} Total Remarks
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center mb-1">
              <div className="p-2 sm:p-2.5 rounded-lg bg-positive/10 border border-positive/25">
                <span className="text-xs font-bold text-positive tabular-nums">{posPct}%</span>
                <p className="text-[10px] text-muted-foreground tabular-nums">Positive ({posCount})</p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
                <span className="text-xs font-bold text-amber-600 tabular-nums">{neuPct}%</span>
                <p className="text-[10px] text-muted-foreground tabular-nums">Neutral ({neuCount})</p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-lg bg-destructive/10 border border-destructive/25">
                <span className="text-xs font-bold text-destructive tabular-nums">{negPct}%</span>
                <p className="text-[10px] text-muted-foreground tabular-nums">Critical ({negCount})</p>
              </div>
            </div>
          </div>

          {/* Stream of Anonymous Student Remarks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Verified Student Feedbacks
              </h4>
              <span className="text-[10px] text-muted-foreground/70 font-mono">Cryptographically Blinded</span>
            </div>

            <div className="space-y-3">
              {remarks.map((r, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between text-[10px] mb-2">
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold border ${
                        r.type === 'POSITIVE'
                          ? 'bg-positive/10 text-positive border-positive/25'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                      }`}
                    >
                      {r.type} • {r.course}
                    </span>
                    <span className="text-muted-foreground">
                      {r.section} • {r.timeAgo}
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed italic">{r.text}</p>
                  <div className="mt-2 text-[10px] text-muted-foreground/60 font-mono break-all">{r.hash}</div>
                </div>
              ))}
              {remarks.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No student feedback comments submitted for this faculty member yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-card shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <PdfDownloadButton
            type="faculty"
            filename={`faculty-appraisal-${faculty.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`}
            data={pdfData}
            label="Download Faculty Appraisal PDF"
          />
        </div>
      </aside>
    </div>
  );
}

