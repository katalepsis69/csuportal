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
    <div className="rounded-2xl border border-white/[0.08] bg-espresso-850/80 backdrop-blur-md overflow-hidden amber-glow-box">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 px-6 border-b border-white/[0.06] bg-espresso-900/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white font-mono">Assigned Teaching Loads</span>
          <span className="rounded-full bg-espresso-800 px-2.5 py-0.5 text-xs font-mono text-[#A1A1AA] border border-white/10 tabular-nums">
            {filtered.length} of {classes.length} classes
          </span>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <IconSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Search classes by code or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-espresso-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#A1A1AA]/50 focus:border-amber-glow focus:outline-none focus:ring-1 focus:ring-amber-glow min-h-[38px]"
          />
        </div>
      </div>

      {/* Classes Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-espresso-900/30 text-[#A1A1AA] uppercase tracking-wider font-mono text-[10px]">
              <th className="py-3 px-5 font-semibold">Subject Code &amp; Title</th>
              <th className="py-3 px-4 font-semibold">Section</th>
              <th className="py-3 px-4 font-semibold">Student Submissions</th>
              <th className="py-3 px-4 font-semibold">Class Rating</th>
              <th className="py-3 px-5 text-right font-semibold">Term Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((c, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                {/* Subject Code & Name */}
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white font-mono text-sm">{c.subject_code}</span>
                    <span className="text-[#EDEDED] font-medium">{c.subject_name}</span>
                  </div>
                </td>

                {/* Section */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="rounded-md bg-white/[0.05] px-2.5 py-0.5 text-xs font-semibold text-[#EDEDED] border border-white/10 font-mono">
                    {c.section_name}
                  </span>
                </td>

                {/* Student Evals */}
                <td className="py-3.5 px-4 whitespace-nowrap tabular-nums text-[#A1A1AA] font-mono">
                  <span className="font-semibold text-white">{c.evals}</span> evaluations received
                </td>

                {/* Class Rating */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-amber-light font-mono tabular-nums">
                      {c.avg_rating != null ? c.avg_rating.toFixed(2) : '—'}
                    </span>
                    <span className="text-[10px] text-[#A1A1AA]/60 font-mono">/ 5.0</span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-5 text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-status-sage/15 px-2.5 py-0.5 text-[10px] font-semibold text-status-sage border border-status-sage/30 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-sage" />
                    Active Term
                  </span>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#A1A1AA] text-xs font-mono">
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
