'use client';

import React from 'react';

export function EvaluationProgressCapsule({
  ratedCount,
  totalCount,
  savingDraft,
  draftSaved,
}: {
  ratedCount: number;
  totalCount: number;
  savingDraft: boolean;
  draftSaved: boolean;
}) {
  const percentage = totalCount > 0 ? Math.round((ratedCount / totalCount) * 100) : 0;
  const isComplete = ratedCount === totalCount && totalCount > 0;

  return (
    <div className="sticky top-3 z-20 glass-panel rounded-2xl p-3.5 sm:p-4 shadow-beautiful-md backdrop-blur-md mb-4 border border-glass-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-sm sm:text-base font-bold text-cream tracking-tight">
            Evaluation Progress
          </span>
          <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-mono font-bold text-brand-text border border-brand/30 tabular-nums">
            {ratedCount} / {totalCount} Rated ({percentage}%)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {savingDraft ? (
            <span className="text-cream-muted animate-pulse flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand inline-block" />
              Saving draft…
            </span>
          ) : draftSaved ? (
            <span className="text-gold-text font-medium flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gold inline-block" />
              Draft auto-saved
            </span>
          ) : isComplete ? (
            <span className="text-positive font-semibold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-positive inline-block" />
              All questions completed
            </span>
          ) : (
            <span className="text-cream-faint">
              {totalCount - ratedCount} remaining
            </span>
          )}
        </div>
      </div>

      {/* Liquid molten amber progress track */}
      <div className="h-2 w-full rounded-full bg-inset-well overflow-hidden border border-subtle/60 relative">
        <div
          className="h-full bg-brand transition-all duration-300 ease-out shadow-[0_0_12px_rgba(216,106,18,0.5)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
