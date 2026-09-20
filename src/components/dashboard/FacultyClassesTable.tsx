'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

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
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">Assigned Teaching Loads</span>
          <span className="rounded-full bg-card px-2.5 py-0.5 text-xs text-muted-foreground border border-border tabular-nums shrink-0">
            {filtered.length} of {classes.length} classes
          </span>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search classes by code or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-8 pr-3 py-2 sm:py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px] sm:min-h-[38px] transition-colors"
          />
        </div>
      </div>

      {/* Classes Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
              <th className="py-3 px-5 font-semibold">Subject Code &amp; Title</th>
              <th className="py-3 px-4 font-semibold">Section</th>
              <th className="py-3 px-4 font-semibold">Student Submissions</th>
              <th className="py-3 px-4 font-semibold">Class Rating</th>
              <th className="py-3 px-5 text-right font-semibold">Term Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c, i) => (
              <tr key={i} className="hover:bg-muted/50 transition-colors">
                {/* Subject Code & Name */}
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-foreground text-sm">{c.subject_code}</span>
                    <span className="text-foreground font-medium">{c.subject_name}</span>
                  </div>
                </td>

                {/* Section */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border">
                    {c.section_name}
                  </span>
                </td>

                {/* Student Evals */}
                <td className="py-3.5 px-4 whitespace-nowrap tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{c.evals}</span> evaluations received
                </td>

                {/* Class Rating */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-primary tabular-nums">
                      {c.avg_rating != null ? c.avg_rating.toFixed(2) : '—'}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">/ 5.0</span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-5 text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-2.5 py-0.5 text-[10px] font-semibold text-positive border border-positive/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                    Active Term
                  </span>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
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
