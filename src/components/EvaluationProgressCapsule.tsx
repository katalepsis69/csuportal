'use client';

import React from 'react';

export type CategoryAnchor = {
  id: string;
  name: string;
  completed: boolean;
  count: string;
};

export function EvaluationProgressCapsule({
  ratedCount,
  totalCount,
  savingDraft,
  draftSaved,
  categories = [],
}: {
  ratedCount: number;
  totalCount: number;
  savingDraft: boolean;
  draftSaved: boolean;
  categories?: CategoryAnchor[];
}) {
  const percentage = totalCount > 0 ? Math.round((ratedCount / totalCount) * 100) : 0;
  const isComplete = ratedCount === totalCount && totalCount > 0;

  return (
    <section className="sticky top-3 z-30 bg-espresso-850/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 mb-6 amber-glow-box">
      {/* Progress Info & Percentage */}
      <div className="w-full md:w-5/12 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-display text-sm font-bold text-white tabular-nums">
            {ratedCount} of {totalCount} Questions Rated
          </span>
          <span className="text-amber-light font-bold tabular-nums">{percentage}% Completed</span>
        </div>
        <div className="w-full bg-espresso-950 h-2 rounded-full overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-amber-glow to-amber-light h-full rounded-full shadow-[0_0_12px_rgba(216,106,18,0.5)] transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA] font-mono">
          {savingDraft ? (
            <span className="text-[#A1A1AA] animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-glow animate-ping" />
              Auto-saving draft…
            </span>
          ) : draftSaved ? (
            <span className="text-status-gold font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-status-gold" />
              Draft auto-saved &amp; encrypted
            </span>
          ) : isComplete ? (
            <span className="text-status-sage font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-status-sage" />
              All criteria satisfied
            </span>
          ) : (
            <span>{totalCount - ratedCount} questions remaining</span>
          )}
        </div>
      </div>

      {/* Quick Jump Section Anchor Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-1 text-xs select-none">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium shrink-0 transition-all ${
                cat.completed
                  ? 'bg-espresso-800 text-white border-status-sage/40 hover:border-status-sage'
                  : 'bg-espresso-800/60 text-[#A1A1AA] border-white/10 hover:border-amber-glow/40 hover:text-white'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  cat.completed ? 'bg-status-sage' : 'bg-amber-glow'
                }`}
              />
              <span className="truncate max-w-[150px]">{cat.name}</span>
              <span className="text-[10px] font-mono text-[#A1A1AA]/60">({cat.count})</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
