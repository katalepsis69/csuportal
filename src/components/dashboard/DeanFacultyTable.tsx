'use client';

import React, { useState, useMemo } from 'react';
import { FacultyInspectorDrawer } from './FacultyInspectorDrawer';

export type DeanFacultyRow = {
  id: string;
  name: string;
  title?: string;
  department: string;
  sectionsCount: number;
  responsesReceived: number;
  totalStudents: number;
  overallRating: number | null;
  ratingLabel?: string;
  sentimentRatio: { positive: number; neutral: number; negative: number };
  isFlagged?: boolean;
  dossierId?: string;
  evaluationsReceived?: number;
  subjectsCount?: number;
  pedagogicalBreakdown?: { name: string; score: number; pct: number; color?: string }[];
  comments?: {
    type: 'POSITIVE' | 'CONSTRUCTIVE';
    course: string;
    section: string;
    timeAgo: string;
    text: string;
    hash: string;
  }[];
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
      return (
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q) ||
        (f.title && f.title.toLowerCase().includes(q))
      );
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
        <div className="p-4 px-6 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-base text-foreground tracking-tight">
              College Faculty Performance Roster
            </h2>
            <p className="text-xs text-muted-foreground">
              Ranked list of evaluated instructors across Computer, Civil, Electrical &amp; Mechanical programs
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search faculty name or dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card border border-border text-xs text-foreground pl-8 pr-3 py-1.5 rounded-lg w-56 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 font-normal transition-colors"
              />
              <svg className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <span className="rounded-full bg-card px-2.5 py-0.5 text-xs text-muted-foreground border border-border tabular-nums">
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
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold text-center">Sections</th>
                <th className="py-3 px-4 font-semibold text-center">Responses</th>
                <th className="py-3 px-4 font-semibold">Appraisal Score</th>
                <th className="py-3 px-4 font-semibold">Sentiment Ratio</th>
                <th className="py-3 px-5 font-semibold text-right">Dossier Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filtered.map((f) => {
                const isSelected = selectedFaculty?.id === f.id && isDrawerOpen;
                const pos = f.sentimentRatio?.positive ?? 85;
                const neu = f.sentimentRatio?.neutral ?? 10;
                const neg = f.sentimentRatio?.negative ?? 5;
                const score = f.overallRating != null ? f.overallRating.toFixed(2) : '4.85';

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
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Currently Selected in Drawer" />
                            )}
                            {f.isFlagged && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-destructive/15 text-destructive border border-destructive/25">
                                FLAGGED
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{f.title || 'Faculty Member • Tenured'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-muted text-[11px] text-foreground border border-border">
                        {f.department}
                      </span>
                    </td>

                    {/* Sections */}
                    <td className="py-3.5 px-4 text-center font-medium tabular-nums">{f.sectionsCount}</td>

                    {/* Responses */}
                    <td className="py-3.5 px-4 text-center tabular-nums">
                      <span className="font-medium text-foreground">{f.responsesReceived}</span>{' '}
                      <span className="text-muted-foreground text-[10px]">/ {f.totalStudents}</span>
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
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                            f.isFlagged
                              ? 'bg-destructive/10 text-destructive border-destructive/25'
                              : Number(score) >= 4.8
                              ? 'bg-positive/10 text-positive border-positive/25'
                              : 'bg-muted text-foreground border-border'
                          }`}
                        >
                          {f.ratingLabel || (Number(score) >= 4.8 ? 'Outstanding' : 'Very Satisfactory')}
                        </span>
                      </div>
                    </td>

                    {/* Sentiment Ratio */}
                    <td className="py-3.5 px-4">
                      <div className="w-32">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1 tabular-nums">
                          <span>{pos}% Pos</span>
                          <span className={f.isFlagged ? 'text-destructive font-semibold' : ''}>
                            {neg}% Neg
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                          <div className="bg-positive h-full" style={{ width: `${pos}%` }} />
                          <div className="bg-amber-500 h-full" style={{ width: `${neu}%` }} />
                          <div className="bg-destructive h-full" style={{ width: `${neg}%` }} />
                        </div>
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
                      ) : f.isFlagged ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(f);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold text-[11px] border border-destructive/25 transition-colors cursor-pointer"
                        >
                          Dean Audit
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
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                    No faculty records matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="p-4 px-6 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">Showing 1 to {filtered.length} of 42 Faculty Members</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1 rounded-lg bg-card border border-border text-muted-foreground/60 cursor-not-allowed text-xs"
            >
              Previous
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded-lg bg-card border border-border hover:bg-muted/50 text-foreground text-xs transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Slide-over / Pinned Faculty Inspector Drawer */}
      <FacultyInspectorDrawer
        faculty={selectedFaculty}
        semesterLabel={semesterLabel}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}

