'use client';

import React, { useState, useMemo } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import { adminDelete } from '@/lib/actions/admin';

export type UserRow = {
  id: string;
  full_name: string;
  email?: string | null;
  role: 'student' | 'faculty' | 'dean' | 'admin';
  student_no?: string | null;
  program_code?: string | null;
  created_at?: string | null;
};

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.student_no && u.student_no.toLowerCase().includes(q));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchProgram = programFilter === 'all' || u.program_code === programFilter;

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

  function getRoleBadge(role: UserRow['role']) {
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
          <span className="text-sm font-bold text-foreground">User Management</span>
          <span className="rounded-full bg-card px-2.5 py-0.5 text-xs text-muted-foreground border border-border tabular-nums shrink-0">
            {filtered.length} of {users.length} accounts
          </span>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto min-w-0 flex-1 sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-8 pr-3 py-2 sm:py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px] sm:min-h-[38px] transition-colors"
            />
          </div>

          {/* Filter row for mobile */}
          <div className="flex items-center gap-2">
            {/* Role Filter */}
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

            {/* Program Filter */}
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              aria-label="Filter user program"
              className="flex-1 sm:flex-none rounded-xl border border-border bg-card px-3 py-2 sm:py-1.5 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer min-h-[40px] sm:min-h-[38px] transition-colors"
            >
              <option value="all">All Programs</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-white/30 text-muted-foreground uppercase tracking-wider text-[10px]">
              <th className="py-3 px-5 font-semibold">User Member</th>
              <th className="py-3 px-4 font-semibold">Identifier / Email</th>
              <th className="py-3 px-4 font-semibold">Role</th>
              <th className="py-3 px-4 font-semibold">Program</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-muted transition-colors">
                {/* User column (Avatar + Name) */}
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50 border border-border text-xs font-bold text-primary">
                      {getInitials(u.full_name)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{u.full_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {u.student_no ? `ID: ${u.student_no}` : `Staff: ${u.id.slice(0, 8)}`}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Email / Identifier */}
                <td className="py-3.5 px-4 text-muted-foreground text-xs whitespace-nowrap">
                  {u.email ?? (u.student_no ? `${u.student_no}@student.cetc.edu.ph` : `${u.full_name.toLowerCase().replace(/^(dr\.|engr\.|prof\.)\s*/, '').replace(/[^a-z0-9]/g, '.')}@cetc.edu.ph`)}
                </td>

                {/* Role Badge */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(
                      u.role,
                    )}`}
                  >
                    {u.role}
                  </span>
                </td>

                {/* Program Code */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-medium text-foreground">
                    {u.program_code ?? (u.role === 'student' ? 'BSIT' : 'Dept Staff')}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/15 px-2.5 py-0.5 text-[10px] font-semibold text-positive border border-positive/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                    Active
                  </span>
                </td>

                {/* Actions Dropdown / Delete */}
                <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                  <div className="inline-flex items-center gap-2">
                    <form action={adminDelete}>
                      <input type="hidden" name="table" value="profiles" />
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors active:scale-[0.98] min-h-[36px] flex items-center justify-center border border-destructive/20 cursor-pointer"
                        title="Delete profile"
                      >
                        Remove
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-[0.98] cursor-pointer"
                      aria-label="More actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {activeMenuId === u.id && (
                    <div className="absolute right-5 top-12 z-20 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xs text-left">
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Reset password email queued for ${u.full_name}`);
                          setActiveMenuId(null);
                        }}
                        className="w-full rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
                      >
                        Send Reset Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Viewing record dossier for ${u.full_name}`);
                          setActiveMenuId(null);
                        }}
                        className="w-full rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
                      >
                        Account Dossier
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
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
