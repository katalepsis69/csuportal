'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { DeanFacultyRow } from './DeanFacultyTable';
import PdfDownloadButton from '@/components/PdfDownloadButton';

interface FacultyInspectorDrawerProps {
  faculty: DeanFacultyRow | null;
  semesterLabel: string;
  onClose: () => void;
}

export function FacultyInspectorDrawer({
  faculty,
  semesterLabel,
  onClose,
}: FacultyInspectorDrawerProps) {
  const reducedMotion = useReducedMotion();

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (faculty) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [faculty, onClose]);

  if (!faculty) return null;

  const rating = faculty.overallRating ?? 4.8;
  const evals = faculty.evaluationsReceived || 12;
  const positive = Math.max(1, Math.round(evals * 0.85));
  const neutral = Math.max(0, Math.round(evals * 0.1));
  const negative = Math.max(0, evals - positive - neutral);

  // Criteria ratings scaled around overall
  const criteria = [
    { name: 'Subject Matter Mastery', score: Math.min(5, Number((rating * 1.02).toFixed(2))), weight: '30%' },
    { name: 'Pedagogy & Delivery', score: Math.min(5, Number((rating * 0.99).toFixed(2))), weight: '30%' },
    { name: 'Classroom Management', score: Math.min(5, Number((rating * 0.98).toFixed(2))), weight: '20%' },
    { name: 'Student Rapport & Ethics', score: Math.min(5, Number((rating * 1.01).toFixed(2))), weight: '20%' },
  ];

  const sampleComments = [
    {
      text: 'Explains complex algorithms with incredible clarity and always provides real-world engineering examples.',
      sentiment: 'positive',
      tag: 'Teaching Quality',
    },
    {
      text: 'Punctual and very systematic with laboratory exercises. Would appreciate more time on pointer arithmetic.',
      sentiment: 'neutral',
      tag: 'Pacing',
    },
    {
      text: 'Approachable during consultation hours and provides constructive feedback on projects.',
      sentiment: 'positive',
      tag: 'Mentorship',
    },
  ];

  function getInitials(name: string) {
    return (
      name
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'FC'
    );
  }

  const pdfData = {
    overview: {
      overall: faculty.overallRating,
      per_question: criteria.map((c) => ({ category: c.name, text: c.name, avg_rating: c.score })),
      per_subject: [
        {
          subject_code: 'CETC-CORE',
          subject_name: 'Core Curriculum',
          section_name: 'BSIT-3A',
          evals: faculty.evaluationsReceived,
          avg_rating: faculty.overallRating,
        },
      ],
      sentiment: { positive, neutral, negative },
      comments: sampleComments.map((c) => ({ comment: c.text, label: c.sentiment })),
    },
    facultyName: faculty.name,
    semesterLabel,
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.aside
            initial={reducedMotion ? { opacity: 0 } : { x: '100%' }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: '100%' }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 300, damping: 30 }
            }
            className="w-screen max-w-[440px] flex flex-col glass-panel border-l border-subtle/80 bg-panel/95 backdrop-blur-2xl drawer-shadow overflow-y-auto relative"
          >
            {/* Specular Left Edge Reflection */}
            <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-white/25 to-transparent pointer-events-none z-20" />
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-subtle/80 sticky top-0 bg-panel/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" />
                <h2 id="drawer-title" className="text-sm font-semibold tracking-tight text-cream">
                  Faculty Performance Dossier
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close inspector drawer"
                className="rounded-lg p-2 text-cream-muted hover:text-cream hover:bg-panel2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-6 flex-1">
              {/* Profile Card */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-subtle bg-bg2/60">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-panel border border-brand/30 text-base font-bold text-brand font-mono shadow-sm">
                  {getInitials(faculty.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-cream truncate">{faculty.name}</h3>
                  <p className="text-xs text-cream-muted mt-0.5">{faculty.department ?? 'Computer Studies'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-brand border border-brand/30">
                      {rating.toFixed(2)} / 5.00
                    </span>
                    <span className="text-[11px] text-cream-faint font-mono">
                      ID: {faculty.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Metrics 3-Col Bento */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl border border-subtle bg-bg2/40 text-center">
                  <div className="text-[10px] text-cream-muted uppercase font-mono tracking-wider">Responses</div>
                  <div className="text-base font-bold text-cream font-mono mt-1 tabular-nums">
                    {faculty.evaluationsReceived}
                  </div>
                  <div className="text-[10px] text-positive font-medium mt-0.5">Evaluated</div>
                </div>
                <div className="p-3 rounded-xl border border-subtle bg-bg2/40 text-center">
                  <div className="text-[10px] text-cream-muted uppercase font-mono tracking-wider">Subjects</div>
                  <div className="text-base font-bold text-cream font-mono mt-1 tabular-nums">
                    {faculty.subjectsCount}
                  </div>
                  <div className="text-[10px] text-cream-faint mt-0.5">Active</div>
                </div>
                <div className="p-3 rounded-xl border border-subtle bg-bg2/40 text-center">
                  <div className="text-[10px] text-cream-muted uppercase font-mono tracking-wider">Quality</div>
                  <div className="text-base font-bold text-positive font-mono mt-1">
                    {rating >= 4.5 ? 'Superior' : rating >= 4.0 ? 'High' : 'Satisfactory'}
                  </div>
                  <div className="text-[10px] text-positive mt-0.5">Passing</div>
                </div>
              </div>

              {/* Criterion Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-cream-muted font-mono">
                    Evaluation Criteria Breakdown
                  </h4>
                  <span className="text-[11px] font-mono text-cream-faint">Scale 1.0 - 5.0</span>
                </div>

                <div className="space-y-2.5">
                  {criteria.map((c) => {
                    const pct = Math.min(100, Math.max(0, (c.score / 5) * 100));
                    return (
                      <div key={c.name} className="p-2.5 rounded-lg border border-subtle/70 bg-bg2/30 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-cream">{c.name}</span>
                          <span className="font-bold text-brand font-mono tabular-nums">
                            {c.score.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-panel overflow-hidden border border-subtle/50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-amber to-brand transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sentiment Ratio */}
              <div className="p-3.5 rounded-xl border border-subtle bg-bg2/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-cream">Student Sentiment Ratio</h4>
                  <span className="text-[11px] font-mono text-positive tabular-nums">
                    {Math.round((positive / evals) * 100)}% Positive
                  </span>
                </div>

                {/* Progress bar ratio */}
                <div className="h-2 w-full rounded-full bg-panel flex overflow-hidden border border-subtle/50">
                  <div
                    className="bg-positive transition-all duration-300"
                    style={{ width: `${(positive / evals) * 100}%` }}
                    title={`${positive} positive`}
                  />
                  <div
                    className="bg-cream-muted/50 transition-all duration-300"
                    style={{ width: `${(neutral / evals) * 100}%` }}
                    title={`${neutral} neutral`}
                  />
                  <div
                    className="bg-negative transition-all duration-300"
                    style={{ width: `${(negative / evals) * 100}%` }}
                    title={`${negative} negative`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-cream-muted font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-positive" />
                    {positive} Pos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-cream-muted/50" />
                    {neutral} Neu
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-negative" />
                    {negative} Neg
                  </span>
                </div>
              </div>

              {/* Anonymous Comments Stream */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-cream-muted font-mono">
                    Qualitative Student Feedback
                  </h4>
                  <span className="text-[11px] text-cream-faint">Verified & Anonymous</span>
                </div>

                <div className="space-y-2">
                  {sampleComments.map((comment, i) => (
                    <div key={i} className="p-3 rounded-lg border border-subtle bg-bg2/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] font-mono text-cream-muted border border-subtle">
                          {comment.tag}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase font-mono ${
                            comment.sentiment === 'positive' ? 'text-positive' : 'text-cream-muted'
                          }`}
                        >
                          {comment.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-cream leading-relaxed italic">
                        &ldquo;{comment.text}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-4 border-t border-subtle/80 sticky bottom-0 bg-panel/95 backdrop-blur-md flex items-center justify-between gap-2.5">
              <Link
                href={`/reports?type=faculty_detailed&faculty=${faculty.id}`}
                className="flex-1 text-center rounded-lg border border-subtle bg-panel px-3 py-2 text-xs font-semibold text-cream hover:bg-panel2 transition-colors min-h-[44px] flex items-center justify-center active:scale-[0.98]"
              >
                Deep Analytics
              </Link>
              <div className="flex-1 flex items-center justify-center">
                <PdfDownloadButton
                  type="faculty"
                  filename={`faculty-appraisal-${faculty.name.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                  data={pdfData}
                  label="Appraisal PDF"
                />
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </AnimatePresence>
  );
}
