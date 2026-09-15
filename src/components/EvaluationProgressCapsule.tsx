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
    <section className="sticky top-3 z-30 glass-panel bg-panel/90 backdrop-blur-xl border border-subtle/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      {/* Progress Info & Percentage */}
      <div className="w-full md:w-5/12 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-display text-sm font-bold text-cream tabular-nums">
            {ratedCount} of {totalCount} Questions Rated
          </span>
          <span className="text-brand font-bold tabular-nums">{percentage}% Completed</span>
        </div>
        <div className="w-full bg-inset-well h-2 rounded-full overflow-hidden border border-subtle/50">
          <div
            className="bg-gradient-to-r from-brand-light to-brand h-full rounded-full shadow-[0_0_12px_rgba(216,106,18,0.5)] transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-cream-muted font-mono">
          {savingDraft ? (
            <span className="text-cream-muted animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-ping" />
              Auto-saving draft…
            </span>
          ) : draftSaved ? (
            <span className="text-gold-text font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Draft auto-saved & encrypted
            </span>
          ) : isComplete ? (
            <span className="text-positive font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" />
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
                  ? 'bg-panel2 text-cream border-positive/40 hover:border-positive'
                  : 'bg-panel2/60 text-cream-muted border-subtle hover:border-brand/40 hover:text-cream'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  cat.completed ? 'bg-positive' : 'bg-brand'
                }`}
              />
              <span className="truncate max-w-[130px]">{cat.name}</span>
              <span className="text-[10px] font-mono text-cream-faint">({cat.count})</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
