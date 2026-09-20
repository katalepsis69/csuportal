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
    <section className="sticky top-2 sm:top-3 z-30 bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 mb-6">
      {/* Progress Info & Percentage */}
      <div className="w-full md:w-5/12 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-display text-sm font-bold text-foreground tabular-nums">
            {ratedCount} of {totalCount} Questions Rated
          </span>
          <span className="text-primary font-bold tabular-nums">{percentage}% Completed</span>
        </div>
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border/80">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
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
            <span className="text-gold-text font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-text" />
              Draft auto-saved &amp; encrypted
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
                  ? 'bg-card text-foreground border-positive/40 hover:border-positive'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  cat.completed ? 'bg-positive' : 'bg-primary'
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
