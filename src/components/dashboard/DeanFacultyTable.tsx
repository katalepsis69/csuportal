'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { IconSearchLine, IconDotsLine } from '@/components/dashboard/StaffScaffold';
import PdfDownloadButton from '@/components/PdfDownloadButton';

export type DeanFacultyRow = {
  id: string;
  name: string;
  department?: string;
  subjectsCount: number;
  evaluationsReceived: number;
  overallRating: number | null;
  sentimentRatio?: { positive: number; negative: number };
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

  const filtered = useMemo(() => {
    return faculty.filter((f) => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || f.name.toLowerCase().includes(q) || (f.department && f.department.toLowerCase().includes(q));
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
        .toUpperCase() || 'F'
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-subtle/80 bg-panel/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-cream">Faculty Roster & Appraisal</span>
          <span className="rounded-full bg-panel px-2.5 py-0.5 text-xs font-mono text-cream-muted border border-subtle tabular-nums">
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
              className="w-full rounded-lg border border-subtle bg-bg2 pl-8 pr-3 py-1.5 text-xs text-cream placeholder:text-cream-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-subtle bg-bg2 px-2.5 py-1.5 text-xs text-cream focus:border-brand focus:outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Computer Science">Computer Science</option>
          </select>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-subtle bg-panel/20 text-cream-muted uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Faculty Member</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Subjects Handled</th>
              <th className="py-3 px-4">Student Responses</th>
              <th className="py-3 px-4">Overall Score</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/60">
            {filtered.map((f) => (
              <tr key={f.id} className="hover:bg-panel/40 transition-colors">
                {/* Faculty avatar + name */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel border border-subtle text-xs font-bold text-positive font-mono">
                      {getInitials(f.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-cream text-sm">{f.name}</div>
                      <div className="text-[11px] text-cream-muted font-mono">ID: {f.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td className="py-3.5 px-4 whitespace-nowrap text-cream-dim font-medium">
                  {f.department ?? 'Computer Studies'}
                </td>

                {/* Subjects Handled */}
                <td className="py-3.5 px-4 whitespace-nowrap tabular-nums text-cream-dim">
                  {f.subjectsCount} Subjects
                </td>

                {/* Responses */}
                <td className="py-3.5 px-4 whitespace-nowrap tabular-nums text-cream-dim">
                  <span className="font-semibold text-cream">{f.evaluationsReceived}</span> evaluations
                </td>

                {/* Mean score */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-cream font-mono tabular-nums">
                      {f.overallRating != null ? f.overallRating.toFixed(2) : '—'}
                    </span>
                    <span className="text-[10px] text-cream-faint">/ 5.0</span>
                  </div>
                </td>

                {/* Status Pill */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/15 px-2.5 py-0.5 text-[10px] font-semibold text-positive border border-positive/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                    Evaluated
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap relative">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/reports?type=faculty_detailed&faculty=${f.id}`}
                      className="rounded border border-subtle bg-panel/80 px-2.5 py-1 text-xs font-semibold text-cream hover:bg-panel hover:border-brand/40 transition-all"
                    >
                      Report
                    </Link>
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === f.id ? null : f.id)}
                      className="rounded p-1 text-cream-muted hover:text-cream hover:bg-panel transition-colors"
                      aria-label="More actions"
                    >
                      <IconDotsLine className="h-4 w-4" />
                    </button>
                  </div>

                  {activeMenuId === f.id && (
                    <div className="absolute right-4 top-10 z-20 w-44 rounded-xl border border-subtle bg-panel p-1.5 shadow-2xl text-left">
                      <Link
                        href={`/reports?type=faculty_detailed&faculty=${f.id}`}
                        className="block w-full rounded-lg px-2.5 py-1.5 text-xs text-cream hover:bg-panel2 transition-colors"
                      >
                        Detailed Analytics
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
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-cream-muted text-xs">
                  No faculty records found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
