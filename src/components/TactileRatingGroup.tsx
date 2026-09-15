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
    <div className="bg-inset-well/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-subtle/40 rounded-xl p-2.5">
      {/* Top scale anchors */}
      <div className="flex items-center justify-between text-[11px] font-mono text-cream-muted px-1 mb-2 select-none">
        <span>1: Poor / Strongly Disagree</span>
        {value ? (
          <span className="font-semibold text-brand transition-all">
            {ANCHORS[value]}
          </span>
        ) : null}
        <span>5: Outstanding / Strongly Agree</span>
      </div>

      {/* 5-Button Tactile Grid */}
      <div
        id={`rating-group-${questionId}`}
        role="radiogroup"
        aria-label={`Rating for: ${questionText}`}
        className="grid grid-cols-5 gap-2"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const isSelected = value === n;

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
              className={`py-2.5 sm:py-3 rounded-lg font-mono text-sm sm:text-base font-bold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                isSelected
                  ? 'bg-brand text-white font-extrabold shadow-[inset_0_2px_6px_rgba(0,0,0,0.5),0_0_16px_rgba(216,106,18,0.4)] border border-brand-light ring-1 ring-brand/50'
                  : 'bg-panel border border-subtle/50 text-cream-dim hover:bg-panel2 hover:text-cream shadow-[0_2px_4px_rgba(0,0,0,0.3)] hover:border-brand/40'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
