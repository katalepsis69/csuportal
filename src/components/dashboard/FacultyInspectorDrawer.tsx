'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { DeanFacultyRow } from './DeanFacultyTable';

interface FacultyInspectorDrawerProps {
  faculty: DeanFacultyRow | null;
  onClose: () => void;
  isOpen?: boolean;
}

export function FacultyInspectorDrawer({
  faculty,
  onClose,
  isOpen = true,
}: FacultyInspectorDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  // Escape closes; focus moves into the dialog on open and returns on close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (faculty && isOpen) {
      const previouslyFocused = document.activeElement as HTMLElement | null;
      closeRef.current?.focus();
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        previouslyFocused?.focus();
      };
    }
  }, [faculty, isOpen, onClose]);

  // keep Tab inside the dialog while it is open
  function handleTab(e: React.KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const scope = drawerRef.current;
    if (!scope) return;
    const focusables = Array.from(
      scope.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!faculty || !isOpen) return null;

  const rating = faculty.overallRating;
  const ratingStr = rating != null ? rating.toFixed(2) : '—';

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto animate-[fade-in_200ms_ease-out]"
        aria-hidden="true"
      />

      {/* Right pinned drawer */}
      <aside
        ref={drawerRef}
        onKeyDown={handleTab}
        className="w-full sm:w-[440px] fixed top-0 right-0 bottom-0 z-50 bg-card border-l border-border flex flex-col shadow-xl overflow-y-auto pointer-events-auto animate-[slide-in-right_220ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-border bg-card relative shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-primary/10 text-primary border border-primary/25">
              FACULTY DOSSIER
            </span>

            {/* Close trigger */}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Close Panel"
              aria-label="Close dossier"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Instructor Identity Card */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground border border-primary/30 flex items-center justify-center font-display font-bold text-lg shadow-xs shrink-0">
              {getInitials(faculty.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="drawer-title" className="font-display font-bold text-lg text-foreground leading-snug">
                {faculty.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Faculty</p>

              <div className="flex items-center gap-2 mt-2">
                {rating != null && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-positive/10 text-positive border border-positive/25 font-semibold">
                    ★ {ratingStr} {faculty.ratingLabel || 'Rated'}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {faculty.responsesReceived} evaluations received
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Body Content */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1">
          {/* Summary Card (real counts only) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-muted/30 border border-border shadow-xs">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              Evaluation Summary
            </h4>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-card border border-border">
                <dt className="text-[10px] text-muted-foreground uppercase font-semibold">Sections</dt>
                <dd className="text-base font-bold text-foreground tabular-nums">{faculty.sectionsCount}</dd>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border">
                <dt className="text-[10px] text-muted-foreground uppercase font-semibold">Responses</dt>
                <dd className="text-base font-bold text-foreground tabular-nums">{faculty.responsesReceived}</dd>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border">
                <dt className="text-[10px] text-muted-foreground uppercase font-semibold">Overall</dt>
                <dd className="text-base font-bold text-primary tabular-nums">{ratingStr}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Per-question breakdowns and anonymous comment rosters live on the faculty results page and the Accreditation Reports center.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
