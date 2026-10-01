'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export type UserRow = {
  id: string;
  full_name: string;
  role: string;
  student_no?: string | null;
  program: { code: string } | null;
  created_at?: string | null;
};

// Read-only directory: profile deletion is an operator action (rows are tied to
// auth users and protected by FKs), so this table has no action buttons.
export function AdminUsersTable({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');

  const programCodes = useMemo(
    () => [...new Set(users.map((u) => u.program?.code).filter((c): c is string => Boolean(c)))].sort(),
    [users],
  );

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        (u.student_no && u.student_no.toLowerCase().includes(q)) ||
        (u.program?.code && u.program.code.toLowerCase().includes(q));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchProgram = programFilter === 'all' || u.program?.code === programFilter;

      return matchSearch && matchRole && matchProgram;
    });
  }, [users, search, roleFilter, programFilter]);

  function getInitials(name: string) {
    return (
      name
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U'
    );
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case 'admin':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'dean':
        return 'bg-gold/10 text-gold-text border-gold/30';
      case 'faculty':
        return 'bg-positive/10 text-positive border-positive/30';
      default:
        return 'bg-muted text-foreground border-border';
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      {/* Table Toolbar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 sm:px-6 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">User Directory</span>
          <span className="rounded-full bg-card px-2.5 py-0.5 text-xs text-muted-foreground border border-border tabular-nums shrink-0">
            {filtered.length} of {users.length} accounts
          </span>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-auto min-w-0 flex-1 sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID, or program…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-8 pr-3 py-2 sm:py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px] sm:min-h-[38px] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter user role"
              className="flex-1 sm:flex-none rounded-xl border border-border bg-card px-3 py-2 sm:py-1.5 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer min-h-[40px] sm:min-h-[38px] transition-colors"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="dean">Deans</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              aria-label="Filter user program"
              className="flex-1 sm:flex-none rounded-xl border border-border bg-card px-3 py-2 sm:py-1.5 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer min-h-[40px] sm:min-h-[38px] transition-colors"
            >
              <option value="all">All Programs</option>
              {programCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
              <th className="py-3 px-5 font-semibold">User</th>
              <th className="py-3 px-4 font-semibold">Student ID</th>
              <th className="py-3 px-4 font-semibold">Role</th>
              <th className="py-3 px-4 font-semibold">Program</th>
              <th className="py-3 px-5 font-semibold">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-muted transition-colors">
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border text-xs font-bold text-primary">
                      {getInitials(u.full_name)}
                    </div>
                    <div className="font-semibold text-foreground text-sm">{u.full_name}</div>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                  {u.student_no ?? '—'}
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(
                      u.role,
                    )}`}
                  >
                    {u.role}
                  </span>
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-medium text-foreground">{u.program?.code ?? '—'}</span>
                </td>

                <td className="py-3.5 px-5 whitespace-nowrap text-muted-foreground tabular-nums">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : '—'}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                  No user records match your search query or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
