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
    <div className="bg-muted/40 border border-border rounded-xl p-2.5">
      {/* Top scale anchors */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 mb-2 select-none">
        <span>1: Poor / Strongly Disagree</span>
        {value ? (
          <span className="font-semibold text-primary transition-all">
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
              className={`py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] border ${
                isSelected
                  ? 'bg-primary text-primary-foreground font-extrabold border-primary shadow-xs'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground shadow-xs'
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
