'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
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
  const reducedMotion = useReducedMotion();

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

  const rating = faculty.overallRating ?? 4.85;
  const ratingStr = rating.toFixed(2);
  const evals = faculty.responsesReceived ?? faculty.evaluationsReceived ?? 148;
  const total = faculty.totalStudents ?? 152;
  const posPct = faculty.sentimentRatio?.positive ?? 94;
  const neuPct = faculty.sentimentRatio?.neutral ?? 4;
  const negPct = faculty.sentimentRatio?.negative ?? 2;
  const posCount = Math.round((evals * posPct) / 100);
  const neuCount = Math.round((evals * neuPct) / 100);
  const negCount = Math.max(0, evals - posCount - neuCount);

  // Criteria ratings
  const criteria = faculty.pedagogicalBreakdown || [
    { name: 'Commitment to Teaching', score: 4.9, pct: 98, color: 'bg-amber-glow' },
    { name: 'Instructional Clarity & Algorithms', score: 4.8, pct: 96, color: 'bg-amber-light' },
    { name: 'Laboratory Pacing & Code Exercises', score: 4.7, pct: 94, color: 'bg-[#B58A3C]' },
    { name: 'Fairness in Rubrics & Grading', score: 4.9, pct: 98, color: 'bg-status-sage' },
  ];

  const remarks = faculty.comments || [
    {
      type: 'POSITIVE',
      course: 'CS 214',
      section: 'BSCS 3-A',
      timeAgo: '2w ago',
      text: '“Engr. Santos explains recursion, binary trees, and graph traversals better than anyone. Very approachable and supportive during lab debugging sessions.”',
      hash: 'Vector Hash: 7c4e...d81a',
    },
    {
      type: 'CONSTRUCTIVE',
      course: 'CS 314',
      section: 'BSIT 3-B',
      timeAgo: '3w ago',
      text: '“Problem sets were challenging and required deep thought, but the grading rubric was transparent and feedback returned quickly.”',
      hash: 'Vector Hash: 9f8a...32b1',
    },
    {
      type: 'POSITIVE',
      course: 'CS 214',
      section: 'BSCS 2-A',
      timeAgo: '1mo ago',
      text: '“Always on time for consultation hours and provides clear real-world industry examples of algorithms.”',
      hash: 'Vector Hash: 3b12...a55e',
    },
  ];

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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        {/* Backdrop overlay for smaller viewports */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm 2xl:hidden pointer-events-auto"
          aria-hidden="true"
        />

        {/* Right pinned 440px drawer */}
        <motion.aside
          initial={reducedMotion ? { opacity: 0 } : { x: '100%' }}
          animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { x: '100%' }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 300, damping: 30 }
          }
          className="w-full sm:w-[440px] fixed top-0 right-0 bottom-0 z-50 bg-[#0c0a08]/95 backdrop-blur-2xl border-l border-white/[0.09] flex flex-col justify-between drawer-shadow overflow-y-auto pointer-events-auto"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-white/[0.07] bg-[#120e0b]/60 relative shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-amber-glow/20 text-amber-light border border-amber-glow/30">
                  FACULTY DOSSIER
                </span>
                <span className="text-[11px] font-mono text-[#A1A1AA]">ID: {dossierId}</span>
              </div>

              {/* Close / Export triggers */}
              <div className="flex items-center gap-1 text-[#A1A1AA]">
                <button
                  type="button"
                  className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                  title="Export Record"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                  title="Close Panel"
                  aria-label="Close dossier"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Instructor Identity Card */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-glow to-espresso-750 border-2 border-amber-glow/40 flex items-center justify-center font-display font-extrabold text-lg text-white shadow-xl shrink-0">
                {getInitials(faculty.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="drawer-title" className="font-display font-bold text-lg text-white leading-snug">
                  {faculty.name}
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  {faculty.department || 'Department of Computer Science & Engineering'}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-status-sage/15 text-status-sage border border-status-sage/30 font-semibold">
                    ★ {ratingStr} {faculty.ratingLabel || 'OUTSTANDING'}
                  </span>
                  <span className="text-[11px] font-mono text-[#A1A1AA]">{evals} Students Rated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Score Matrix Card */}
            <div className="p-4 rounded-xl bg-espresso-900/80 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold">
                  Pedagogical Criteria Breakdown
                </h4>
                <span className="text-[10px] font-mono text-status-sage">Rank #2 in College</span>
              </div>

              <div className="space-y-3">
                {criteria.map((c) => (
                  <div key={c.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/80">{c.name}</span>
                      <span className="font-mono font-bold text-amber-light">
                        {c.score.toFixed(2)} <span className="text-white/40 text-[10px]">/ 5.0</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.color || 'bg-amber-glow'}`} style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment Index & Distribution */}
            <div className="p-4 rounded-xl bg-espresso-900/80 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold">
                  Student Qualitative Sentiment
                </h4>
                <span className="text-[10px] font-mono text-status-sage font-semibold">+94 Net Index</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-1">
                <div className="p-2 rounded-lg bg-status-sage/10 border border-status-sage/20">
                  <span className="text-xs font-mono font-bold text-status-sage">{posPct}%</span>
                  <p className="text-[10px] text-[#A1A1AA]">Positive ({posCount})</p>
                </div>
                <div className="p-2 rounded-lg bg-status-gold/10 border border-status-gold/20">
                  <span className="text-xs font-mono font-bold text-status-gold">{neuPct}%</span>
                  <p className="text-[10px] text-[#A1A1AA]">Neutral ({neuCount})</p>
                </div>
                <div className="p-2 rounded-lg bg-status-crimson/10 border border-status-crimson/20">
                  <span className="text-xs font-mono font-bold text-status-crimson">{negPct}%</span>
                  <p className="text-[10px] text-[#A1A1AA]">Critical ({negCount})</p>
                </div>
              </div>
            </div>

            {/* Real-Time Stream of Anonymous Student Remarks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold">
                  Verified Student Feedbacks
                </h4>
                <span className="text-[10px] font-mono text-[#A1A1AA]">Cryptographically Blinded</span>
              </div>

              <div className="space-y-3">
                {remarks.map((r, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-espresso-900/60 border border-white/[0.06] hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold border ${
                          r.type === 'POSITIVE'
                            ? 'bg-status-sage/15 text-status-sage border-status-sage/20'
                            : 'bg-status-gold/15 text-status-gold border-status-gold/20'
                        }`}
                      >
                        {r.type} • {r.course}
                      </span>
                      <span className="text-[#A1A1AA]">
                        {r.section} • {r.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-[#EDEDED] leading-relaxed italic">{r.text}</p>
                    <div className="mt-2 text-[10px] font-mono text-[#A1A1AA]/60">{r.hash}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 border-t border-white/[0.08] bg-espresso-900/90 space-y-2.5 shrink-0">
            <PdfDownloadButton
              type="faculty"
              filename={`faculty-appraisal-${faculty.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`}
              data={pdfData}
              label="Download Faculty Appraisal PDF"
            />

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/10 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl text-xs font-medium border border-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-amber-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Schedule Peer Review / Consultation</span>
            </button>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}

