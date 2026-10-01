'use client';

import React, { useState, useMemo } from 'react';
import { FacultyInspectorDrawer } from './FacultyInspectorDrawer';

export type DeanFacultyRow = {
  id: string;
  name: string;
  sectionsCount: number;
  responsesReceived: number;
  overallRating: number | null;
  ratingLabel?: string;
  isFlagged?: boolean;
};

export function DeanFacultyTable({
  faculty,
  semesterLabel,
}: {
  faculty: DeanFacultyRow[];
  semesterLabel: string;
}) {
  const [search, setSearch] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<DeanFacultyRow | null>(
    faculty.length > 0 ? faculty[0] : null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return faculty.filter((f) => {
      const q = search.toLowerCase().trim();
      return !q || f.name.toLowerCase().includes(q);
    });
  }, [faculty, search]);

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

  function handleSelect(f: DeanFacultyRow) {
    setSelectedFaculty(f);
    setIsDrawerOpen(true);
  }

  return (
    <>
      <section className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Table Top Utility Bar */}
        <div className="p-4 sm:px-6 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-base text-foreground tracking-tight">
              College Faculty Performance Roster
            </h2>
            <p className="text-xs text-muted-foreground">
              Evaluated faculty across the college · {semesterLabel}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Search bar */}
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search faculty name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card border border-border text-xs text-foreground pl-8 pr-3 py-2 sm:py-1.5 rounded-lg w-full sm:w-56 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground font-normal transition-colors min-h-[40px] sm:min-h-[36px]"
              />
              <svg className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-3 sm:top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <span className="rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground border border-border tabular-nums shrink-0 self-start sm:self-auto">
              {filtered.length} Faculty Records
            </span>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase text-muted-foreground tracking-wider">
                <th className="py-3 px-5 font-semibold">Faculty Instructor</th>
                <th className="py-3 px-4 font-semibold text-center">Sections</th>
                <th className="py-3 px-4 font-semibold text-center">Responses</th>
                <th className="py-3 px-4 font-semibold">Appraisal Score</th>
                <th className="py-3 px-5 font-semibold text-right">Dossier Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filtered.map((f) => {
                const isSelected = selectedFaculty?.id === f.id && isDrawerOpen;
                const score = f.overallRating != null ? f.overallRating.toFixed(2) : '—';

                return (
                  <tr
                    key={f.id}
                    onClick={() => handleSelect(f)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : f.isFlagged
                        ? 'hover:bg-destructive/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {/* Faculty avatar + name */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${
                            f.isFlagged
                              ? 'bg-destructive/15 text-destructive border border-destructive/25'
                              : isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground border border-border'
                          }`}
                        >
                          {getInitials(f.name)}
                        </div>
                        <div>
                          <div
                            className={`font-semibold transition-colors flex items-center gap-1.5 ${
                              isSelected
                                ? 'text-primary'
                                : f.isFlagged
                                ? 'text-foreground group-hover:text-destructive'
                                : 'text-foreground group-hover:text-primary'
                            }`}
                          >
                            <span>{f.name}</span>
                            {f.isFlagged && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-destructive/15 text-destructive border border-destructive/25">
                                FLAGGED
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">Faculty</span>
                        </div>
                      </div>
                    </td>

                    {/* Sections */}
                    <td className="py-3.5 px-4 text-center font-medium tabular-nums">{f.sectionsCount}</td>

                    {/* Responses */}
                    <td className="py-3.5 px-4 text-center tabular-nums">
                      <span className="font-medium text-foreground">{f.responsesReceived}</span>
                    </td>

                    {/* Appraisal Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm tabular-nums ${
                            f.isFlagged
                              ? 'text-destructive'
                              : isSelected
                              ? 'text-primary'
                              : 'text-foreground'
                          }`}
                        >
                          {score}
                        </span>
                        {f.overallRating != null && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                              f.isFlagged
                                ? 'bg-destructive/10 text-destructive border-destructive/25'
                                : f.overallRating >= 4.8
                                ? 'bg-positive/10 text-positive border-positive/25'
                                : 'bg-muted text-foreground border-border'
                            }`}
                          >
                            {f.ratingLabel || (f.overallRating >= 4.8 ? 'Outstanding' : 'Very Satisfactory')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dossier Action Button */}
                    <td className="py-3.5 px-5 text-right">
                      {isSelected ? (
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-semibold text-[11px] shadow-xs hover:brightness-105 transition-all flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span>Inspecting</span>
                          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(f);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium text-[11px] border border-border transition-colors cursor-pointer"
                        >
                          View Dossier
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                    No faculty records matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Slide-over / Pinned Faculty Inspector Drawer */}
      <FacultyInspectorDrawer
        faculty={selectedFaculty}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
