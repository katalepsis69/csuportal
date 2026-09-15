'use client';

import React from 'react';

const ANCHORS: Record<number, string> = {
  1: 'Poor / Strongly Disagree',
  2: 'Fair / Disagree',
  3: 'Satisfactory / Neutral',
  4: 'Very Good / Agree',
  5: 'Outstanding / Strongly Agree',
};

export function TactileRatingGroup({
  questionId,
  questionText,
  value,
  onChange,
}: {
  questionId: string;
  questionText: string;
  value?: number;
  onChange: (rating: number) => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent, currentNum: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(5, (value ?? currentNum) + 1);
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, (value ?? currentNum) - 1);
      onChange(prev);
    } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
      e.preventDefault();
      onChange(Number(e.key));
    }
  }

  return (
    <div className="space-y-1.5 pt-1">
      {/* Recessed 3D tactile rating strip */}
      <div
        id={`rating-group-${questionId}`}
        role="radiogroup"
        aria-label={`Rating for: ${questionText}`}
        className="flex w-full items-stretch rounded-xl bg-inset-well p-1 border border-subtle/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const isSelected = value === n;
          const isPast = value != null && value >= n;

          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${n} of 5 — ${ANCHORS[n]}`}
              tabIndex={value === n || (value == null && n === 1) ? 0 : -1}
              onClick={() => onChange(n)}
              onKeyDown={(e) => handleKeyDown(e, n)}
              className={`group relative flex-1 flex flex-col items-center justify-center py-2.5 sm:py-3 px-2 rounded-lg font-mono text-sm sm:text-base font-bold transition-all duration-150 ease-out cursor-pointer select-none ${
                isSelected
                  ? 'bg-brand text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_16px_rgba(216,106,18,0.45)] ring-1 ring-brand-light/60 translate-y-[1px]'
                  : isPast
                  ? 'bg-brand/20 text-brand-text hover:bg-brand/30 border border-brand/20'
                  : 'bg-panel/85 text-cream-muted hover:bg-panel hover:text-cream border border-subtle/40 active:translate-y-[1px]'
              }`}
            >
              <span className="tabular-nums transition-transform duration-150 group-active:scale-95">
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* Semantic scale anchor labels */}
      <div className="flex items-center justify-between px-1 text-[11px] font-medium text-cream-faint select-none">
        <span>1: Poor</span>
        {value ? (
          <span className="font-semibold text-brand-text transition-all">
            {ANCHORS[value]}
          </span>
        ) : (
          <span className="hidden sm:inline text-cream-faint">Select a rating (1 to 5)</span>
        )}
        <span>5: Outstanding</span>
      </div>
    </div>
  );
}
