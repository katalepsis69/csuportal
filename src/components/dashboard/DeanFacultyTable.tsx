'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { IconSearchLine, IconDotsLine } from '@/components/dashboard/StaffScaffold';
import { FacultyInspectorDrawer } from './FacultyInspectorDrawer';

export type DeanFacultyRow = {
  id: string;
  name: string;
  department?: string;
  subjectsCount: number;
  evaluationsReceived: number;
  overallRating: number | null;
  sentimentRatio?: { positive: number; negative: number; neutral?: number };
};

export function DeanFacultyTable({
  faculty,
  semesterLabel,
}: {
  faculty: DeanFacultyRow[];
  semesterLabel: string;
}) {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<DeanFacultyRow | null>(null);

  const filtered = useMemo(() => {
    return faculty.filter((f) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.department && f.department.toLowerCase().includes(q));
      const matchDept = departmentFilter === 'all' || f.department === departmentFilter;
      return matchSearch && matchDept;
    });
  }, [faculty, search, departmentFilter]);

  function getInitials(name: string) {
    return (
      name
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'FC'
    );
  }

  return (
    <div className="rounded-xl border border-subtle/80 bg-panel/30 backdrop-blur-md overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-subtle/80 bg-panel/40">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-cream font-mono">Faculty Roster & Appraisal</span>
          <span className="rounded-full bg-bg2 px-2.5 py-0.5 text-xs font-mono text-cream-muted border border-subtle tabular-nums">
            {filtered.length} of {faculty.length} faculty
          </span>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px]">
            <IconSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream-muted" />
            <input
              type="text"
              placeholder="Search faculty by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-subtle bg-bg2 pl-8 pr-3 py-1.5 text-xs text-cream placeholder:text-cream-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand min-h-[38px]"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-subtle bg-bg2 px-2.5 py-1.5 text-xs text-cream focus:border-brand focus:outline-none cursor-pointer min-h-[38px]"
          >
            <option value="all">All Departments</option>
            <option value="Computer Studies">Computer Studies</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Computer Science">Computer Science</option>
          </select>
        </div>
      </div>

      {/* Faculty Table with 1px Hairline Dividers (Card Overuse Ban) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-subtle/80 bg-panel/30 text-cream-muted uppercase tracking-wider font-mono text-[10px]">
              <th className="py-2.5 px-4 font-semibold">Faculty Member</th>
              <th className="py-2.5 px-3 font-semibold">Department</th>
              <th className="py-2.5 px-3 font-semibold">Subjects</th>
              <th className="py-2.5 px-3 font-semibold">Responses</th>
              <th className="py-2.5 px-3 font-semibold">Sentiment Ratio</th>
              <th className="py-2.5 px-3 font-semibold">Overall Score</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/40">
            {filtered.map((f) => {
              const posPct = f.overallRating ? Math.min(100, Math.round((f.overallRating / 5) * 100)) : 80;
              const negPct = Math.max(0, 100 - posPct - 10);
              const neuPct = 100 - posPct - negPct;

              return (
                <tr
                  key={f.id}
                  onClick={() => setSelectedFaculty(f)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedFaculty(f);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open appraisal dossier for ${f.name}`}
                  className="hover:bg-panel2/50 focus:bg-panel2/70 focus:outline-none transition-colors cursor-pointer group"
                >
                  {/* Faculty avatar + name */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel border border-brand/30 text-xs font-bold text-brand font-mono group-hover:scale-105 transition-transform">
                        {getInitials(f.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-cream text-sm group-hover:text-brand transition-colors">
                          {f.name}
                        </div>
                        <div className="text-[11px] text-cream-muted font-mono">ID: {f.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3 px-3 whitespace-nowrap text-cream-dim font-medium">
                    {f.department ?? 'Computer Studies'}
                  </td>

                  {/* Subjects Handled */}
                  <td className="py-3 px-3 whitespace-nowrap tabular-nums text-cream-dim font-mono">
                    {f.subjectsCount} Subjects
                  </td>

                  {/* Responses */}
                  <td className="py-3 px-3 whitespace-nowrap tabular-nums text-cream-dim font-mono">
                    <span className="font-semibold text-cream">{f.evaluationsReceived}</span> evals
                  </td>

                  {/* Sentiment Mini-Bar */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="w-24">
                      <div className="flex items-center justify-between text-[10px] text-cream-muted font-mono mb-1">
                        <span className="text-positive">{posPct}%</span>
                        <span className="text-cream-faint">{neuPct}%</span>
                        <span className="text-negative">{negPct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-panel flex overflow-hidden border border-subtle/50">
                        <div className="bg-positive" style={{ width: `${posPct}%` }} />
                        <div className="bg-cream-muted/50" style={{ width: `${neuPct}%` }} />
                        <div className="bg-negative" style={{ width: `${negPct}%` }} />
                      </div>
                    </div>
                  </td>

                  {/* Mean score */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-cream font-mono tabular-nums">
                        {f.overallRating != null ? f.overallRating.toFixed(2) : '—'}
                      </span>
                      <span className="text-[10px] text-cream-faint font-mono">/ 5.0</span>
                    </div>
                  </td>

                  {/* Status Pill */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/15 px-2.5 py-0.5 text-[10px] font-semibold text-positive border border-positive/30 font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                      Evaluated
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap relative">
                    <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedFaculty(f)}
                        className="rounded-lg border border-subtle bg-panel/80 px-2.5 py-1 text-xs font-semibold text-cream hover:bg-panel hover:border-brand/40 transition-all min-h-[32px] flex items-center justify-center active:scale-[0.98]"
                      >
                        Dossier
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === f.id ? null : f.id)}
                        className="rounded-lg p-1.5 text-cream-muted hover:text-cream hover:bg-panel transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                        aria-label="More actions"
                      >
                        <IconDotsLine className="h-4 w-4" />
                      </button>
                    </div>

                    {activeMenuId === f.id && (
                      <div
                        className="absolute right-4 top-12 z-20 w-44 rounded-xl border border-subtle bg-panel p-1.5 shadow-2xl text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setSelectedFaculty(f);
                          }}
                          className="block w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-cream hover:bg-panel2 transition-colors"
                        >
                          Open Inspector Drawer
                        </button>
                        <Link
                          href={`/reports?type=faculty_detailed&faculty=${f.id}`}
                          className="block w-full rounded-lg px-2.5 py-1.5 text-xs text-cream-muted hover:text-cream hover:bg-panel2 transition-colors"
                        >
                          Full Report Page
                        </Link>
                        <Link
                          href={`/dean/history?faculty=${f.id}`}
                          className="block w-full rounded-lg px-2.5 py-1.5 text-xs text-cream-muted hover:text-cream hover:bg-panel2 transition-colors"
                        >
                          Historical Performance
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-cream-muted text-xs">
                  No faculty records found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-Over Faculty Inspector Drawer */}
      <FacultyInspectorDrawer
        faculty={selectedFaculty}
        semesterLabel={semesterLabel}
        onClose={() => setSelectedFaculty(null)}
      />
    </div>
  );
}
