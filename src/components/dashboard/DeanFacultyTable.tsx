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
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

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
      <section className="rounded-2xl bg-espresso-850/80 backdrop-blur-md border border-white/[0.08] overflow-hidden amber-glow-box">
        {/* Table Top Utility Bar */}
        <div className="p-4 px-6 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-base text-white tracking-tight">
              College Faculty Performance Roster
            </h2>
            <p className="text-xs text-[#A1A1AA]">
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
                className="bg-espresso-900 border border-white/10 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg w-56 focus:outline-none focus:border-amber-glow placeholder-[#A1A1AA]/50 font-normal"
              />
              <svg className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <span className="text-xs font-mono text-[#A1A1AA]">42 Faculty Records</span>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-espresso-900/50 text-[11px] font-mono uppercase text-[#A1A1AA] tracking-wider">
                <th className="py-3 px-5 font-semibold">Faculty Instructor</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold text-center">Sections</th>
                <th className="py-3 px-4 font-semibold text-center">Responses</th>
                <th className="py-3 px-4 font-semibold">Appraisal Score</th>
                <th className="py-3 px-4 font-semibold">Sentiment Ratio</th>
                <th className="py-3 px-5 font-semibold text-right">Dossier Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
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
                        ? 'bg-amber-glow/10 border-l-4 border-amber-glow'
                        : f.isFlagged
                        ? 'hover:bg-status-crimson/5'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Faculty avatar + name */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-xs shadow-md ${
                            f.isFlagged
                              ? 'bg-status-crimson/20 text-status-crimson border border-status-crimson/30'
                              : isSelected
                              ? 'bg-gradient-to-br from-amber-glow to-[#9e4606]'
                              : 'bg-espresso-750 text-[#EDEDED] border border-white/10'
                          }`}
                        >
                          {getInitials(f.name)}
                        </div>
                        <div>
                          <div
                            className={`font-semibold transition-colors flex items-center gap-1.5 ${
                              isSelected
                                ? 'text-amber-light'
                                : f.isFlagged
                                ? 'text-white group-hover:text-status-crimson'
                                : 'text-white group-hover:text-amber-light'
                            }`}
                          >
                            <span>{f.name}</span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-glow" title="Currently Selected in Drawer" />
                            )}
                            {f.isFlagged && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-status-crimson/20 text-status-crimson border border-status-crimson/30">
                                FLAGGED
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#A1A1AA]">{f.title || 'Faculty Member • Tenured'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[11px] text-[#EDEDED] font-mono">
                        {f.department}
                      </span>
                    </td>

                    {/* Sections */}
                    <td className="py-3.5 px-4 text-center font-mono">{f.sectionsCount}</td>

                    {/* Responses */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      {f.responsesReceived}{' '}
                      <span className="text-[#A1A1AA] text-[10px]">/ {f.totalStudents}</span>
                    </td>

                    {/* Appraisal Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-sm ${
                            f.isFlagged
                              ? 'text-status-crimson'
                              : isSelected
                              ? 'text-amber-light'
                              : 'text-white'
                          }`}
                        >
                          {score}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                            f.isFlagged
                              ? 'bg-status-crimson/15 text-status-crimson border-status-crimson/30'
                              : Number(score) >= 4.8
                              ? 'bg-status-sage/15 text-status-sage border-status-sage/20'
                              : 'bg-white/[0.08] text-[#EDEDED] border-white/10'
                          }`}
                        >
                          {f.ratingLabel || (Number(score) >= 4.8 ? 'Outstanding' : 'Very Satisfactory')}
                        </span>
                      </div>
                    </td>

                    {/* Sentiment Ratio */}
                    <td className="py-3.5 px-4">
                      <div className="w-32">
                        <div className="flex justify-between text-[10px] font-mono text-[#A1A1AA] mb-1">
                          <span>{pos}% Pos</span>
                          <span className={f.isFlagged ? 'text-status-crimson font-semibold' : ''}>
                            {neg}% Neg
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden flex">
                          <div className="bg-status-sage h-full" style={{ width: `${pos}%` }} />
                          <div className="bg-status-gold h-full" style={{ width: `${neu}%` }} />
                          <div className="bg-status-crimson h-full" style={{ width: `${neg}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Dossier Action Button */}
                    <td className="py-3.5 px-5 text-right">
                      {isSelected ? (
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-amber-glow text-white font-medium text-[11px] shadow-sm hover:brightness-110 transition-all flex items-center gap-1 ml-auto"
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
                          className="px-2.5 py-1 rounded-lg bg-status-crimson/20 hover:bg-status-crimson/30 text-status-crimson font-medium text-[11px] border border-status-crimson/30 transition-colors"
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
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 text-[#EDEDED] font-medium text-[11px] transition-colors"
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
                  <td colSpan={7} className="py-8 text-center text-[#A1A1AA] text-xs font-mono">
                    No faculty records matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="p-4 px-6 border-t border-white/[0.06] bg-espresso-900/30 flex items-center justify-between text-xs text-[#A1A1AA]">
          <span>Showing 1 to {filtered.length} of 42 Faculty Members</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1 rounded-lg bg-espresso-800 border border-white/10 text-white/50 cursor-not-allowed text-xs"
            >
              Previous
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded-lg bg-espresso-800 border border-white/10 hover:border-white/20 text-white text-xs transition-colors"
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

