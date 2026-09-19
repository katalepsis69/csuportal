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
    <section className="sticky top-3 z-30 bg-card backdrop-blur-xl border border-border rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 mb-6 ">
      {/* Progress Info & Percentage */}
      <div className="w-full md:w-5/12 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-display text-sm font-bold text-foreground tabular-nums">
            {ratedCount} of {totalCount} Questions Rated
          </span>
          <span className="text-primary font-bold tabular-nums">{percentage}% Completed</span>
        </div>
        <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-border">
          <div
            className="bg-gradient-to-r from-primary to-primary h-full rounded-full shadow-[0_0_12px_rgba(127,29,29,0.5)] transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {savingDraft ? (
            <span className="text-muted-foreground animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
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
                  ? 'bg-white text-foreground border-status-sage/40 hover:border-status-sage'
                  : 'bg-white/60 text-muted-foreground border-border hover:border-primary/40 hover:text-white'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  cat.completed ? 'bg-status-sage' : 'bg-primary'
                }`}
              />
              <span className="truncate max-w-[150px]">{cat.name}</span>
              <span className="text-[10px] text-muted-foreground/60">({cat.count})</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
