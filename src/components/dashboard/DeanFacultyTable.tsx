'use client';

import React, { useState, useMemo } from 'react';
import { FacultyInspectorDrawer } from './FacultyInspectorDrawer';

export type DeanFacultyRow = {
  id: string;
  name: string;
  sectionsCount: number;
  responsesReceived: number;
  overallRating: number | null;
  ratingLabel: string;
  isFlagged: boolean;
};

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

export function DeanFacultyTable({
  faculty,
  semesterId,
  semesterLabel,
}: {
  faculty: DeanFacultyRow[];
  semesterId: string | null;
  semesterLabel: string;
}) {
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selected, setSelected] = useState<DeanFacultyRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return faculty.filter(
      (f) => (!q || f.name.toLowerCase().includes(q)) && (!flaggedOnly || f.isFlagged),
    );
  }, [faculty, search, flaggedOnly]);

  return (
    <>
      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 px-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold text-base text-foreground tracking-tight">
              Faculty Performance Roster
            </h2>
            <p className="text-xs text-muted-foreground">
              Ranked by mean appraisal score · {semesterLabel}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <input
                type="search"
                placeholder="Search faculty name"
                aria-label="Search faculty name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card border border-border text-xs text-foreground pl-8 pr-3 py-1.5 rounded-lg w-56 focus:outline-none focus:border-brand"
              />
              <svg
                className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <button
              type="button"
              onClick={() => setFlaggedOnly((v) => !v)}
              aria-pressed={flaggedOnly}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                flaggedOnly
                  ? 'bg-negative/10 text-negative border-negative/30'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              Review queue only
            </button>

            <span className="text-xs text-muted-foreground tabular-nums">
              {filtered.length} of {faculty.length} faculty
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted text-[11px] uppercase text-muted-foreground tracking-wider">
                <th className="py-3 px-5 font-semibold">Faculty Instructor</th>
                <th className="py-3 px-4 font-semibold text-center">Sections</th>
                <th className="py-3 px-4 font-semibold text-center">Responses</th>
                <th className="py-3 px-4 font-semibold">Appraisal Score</th>
                <th className="py-3 px-5 font-semibold text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filtered.map((f) => {
                const isSelected = selected?.id === f.id;
                return (
                  <tr
                    key={f.id}
                    onClick={() => setSelected(f)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            f.isFlagged
                              ? 'bg-negative/15 text-negative border border-negative/30'
                              : 'bg-card text-foreground border border-border'
                          }`}
                        >
                          {getInitials(f.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span className="truncate">{f.name}</span>
                            {f.isFlagged && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-negative/15 text-negative border border-negative/30 shrink-0">
                                REVIEW
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {f.sectionsCount} section{f.sectionsCount === 1 ? '' : 's'} this term
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center tabular-nums">{f.sectionsCount}</td>

                    <td className="py-3.5 px-4 text-center tabular-nums">{f.responsesReceived}</td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm tabular-nums ${
                            f.isFlagged ? 'text-negative' : 'text-foreground'
                          }`}
                        >
                          {f.overallRating != null ? f.overallRating.toFixed(2) : '—'}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] border ${
                            f.isFlagged
                              ? 'bg-negative/10 text-negative border-negative/30'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {f.ratingLabel}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(f);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-muted hover:bg-accent text-foreground font-medium text-[11px] transition-colors"
                      >
                        {isSelected ? 'Inspecting' : 'View dossier'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground text-xs">
                    {faculty.length === 0
                      ? 'No faculty have evaluated results for this semester yet.'
                      : 'No faculty match this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <FacultyInspectorDrawer
        faculty={selected}
        semesterId={semesterId}
        semesterLabel={semesterLabel}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
