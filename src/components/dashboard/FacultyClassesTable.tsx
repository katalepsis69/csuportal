'use client';

import React, { useState, useMemo } from 'react';
import { IconSearchLine } from '@/components/dashboard/StaffScaffold';

export type FacultySubjectRow = {
  subject_code: string;
  subject_name: string;
  section_name: string;
  evals: number;
  avg_rating: number | null;
};

export function FacultyClassesTable({
  classes,
}: {
  classes: FacultySubjectRow[];
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return classes.filter((c) => {
      const q = search.toLowerCase().trim();
      return (
        !q ||
        c.subject_code.toLowerCase().includes(q) ||
        c.subject_name.toLowerCase().includes(q) ||
        c.section_name.toLowerCase().includes(q)
      );
    });
  }, [classes, search]);

  return (
    <div>
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-subtle/80 bg-panel/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-cream">Assigned Teaching Loads</span>
          <span className="rounded-full bg-panel px-2.5 py-0.5 text-xs font-mono text-cream-muted border border-subtle tabular-nums">
            {filtered.length} of {classes.length} classes
          </span>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <IconSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream-muted" />
          <input
            type="text"
            placeholder="Search classes by code or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-subtle bg-bg2 pl-8 pr-3 py-1.5 text-xs text-cream placeholder:text-cream-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {/* Classes Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-subtle bg-panel/20 text-cream-muted uppercase tracking-wider font-semibold">
              <th className="py-2 px-3">Subject</th>
              <th className="py-2 px-3">Section</th>
              <th className="py-2 px-3">Student Submissions</th>
              <th className="py-2 px-3">Class Rating</th>
              <th className="py-2 px-3">Evaluation Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/60">
            {filtered.map((c, i) => (
              <tr key={i} className="hover:bg-panel/40 transition-colors">
                {/* Subject Code & Name */}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div>
                    <span className="font-bold text-cream font-mono text-sm mr-2">{c.subject_code}</span>
                    <span className="text-cream-dim font-medium">{c.subject_name}</span>
                  </div>
                </td>

                {/* Section */}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <span className="rounded-md bg-panel px-2 py-0.5 text-xs font-semibold text-cream-muted border border-subtle">
                    {c.section_name}
                  </span>
                </td>

                {/* Student Evals */}
                <td className="py-2.5 px-3 whitespace-nowrap tabular-nums text-cream-dim">
                  <span className="font-semibold text-cream">{c.evals}</span> evaluations received
                </td>

                {/* Class Rating */}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-cream font-mono tabular-nums">
                      {c.avg_rating != null ? c.avg_rating.toFixed(2) : '—'}
                    </span>
                    <span className="text-[10px] text-cream-faint">/ 5.0</span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/15 px-2.5 py-0.5 text-[10px] font-semibold text-positive border border-positive/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                    Active Term
                  </span>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-cream-muted text-xs">
                  No assigned teaching subjects found for this semester.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
