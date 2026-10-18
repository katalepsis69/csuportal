'use client';

import React, { useState, useMemo } from 'react';
import { IconSearchLine } from '@/components/dashboard/StaffScaffold';

export type UserRow = {
  id: string;
  full_name: string;
  role: 'student' | 'faculty' | 'dean' | 'admin';
  student_no?: string | null;
  created_at?: string | null;
};

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
      return 'bg-gold/20 text-gold-text border-gold/30';
    case 'faculty':
      return 'bg-positive/20 text-positive border-positive/30';
    default:
      return 'bg-muted text-foreground border-border';
  }
}

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(
      (u) =>
        (!q ||
          u.full_name.toLowerCase().includes(q) ||
          (u.student_no?.toLowerCase().includes(q) ?? false)) &&
        (roleFilter === 'all' || u.role === roleFilter),
    );
  }, [users, search, roleFilter]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 px-6 border-b border-border bg-muted/60">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Accounts</span>
          <span className="rounded-full bg-card px-2.5 py-0.5 text-xs text-muted-foreground border border-border tabular-nums">
            {filtered.length} of {users.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px]">
            <IconSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by name or student ID…"
              aria-label="Search accounts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none min-h-[38px]"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer min-h-[38px]"
          >
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="dean">Deans</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
              <th className="py-3 px-5 font-semibold">Member</th>
              <th className="py-3 px-4 font-semibold">Identifier</th>
              <th className="py-3 px-4 font-semibold">Role</th>
              <th className="py-3 px-5 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-muted transition-colors">
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card border border-border text-xs font-bold text-primary">
                      {getInitials(u.full_name)}
                    </div>
                    <span className="font-semibold text-foreground text-sm">{u.full_name}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap tabular-nums">
                  {u.student_no ?? u.id.slice(0, 8)}
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

                <td className="py-3.5 px-5 text-muted-foreground whitespace-nowrap tabular-nums">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-muted-foreground text-xs">
                  {users.length === 0
                    ? 'No accounts yet. Create users in Supabase Auth; the profile trigger registers them here.'
                    : 'No accounts match this filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="p-4 px-6 border-t border-border text-[11px] text-muted-foreground">
        Passwords, email changes and account removal happen in Supabase Auth. Roles here come from
        each user&rsquo;s profile metadata.
      </p>
    </div>
  );
}
