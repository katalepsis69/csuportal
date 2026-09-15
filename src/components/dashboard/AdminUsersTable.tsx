'use client';

import React, { useState, useMemo } from 'react';
import { IconSearchLine, IconDotsLine } from '@/components/dashboard/StaffScaffold';
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
        return 'bg-amber-glow/20 text-amber-light border-amber-glow/30';
      case 'dean':
        return 'bg-status-gold/20 text-status-gold border-status-gold/30';
      case 'faculty':
        return 'bg-status-sage/20 text-status-sage border-status-sage/30';
      default:
        return 'bg-white/[0.05] text-[#EDEDED] border-white/10';
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-espresso-850/80 backdrop-blur-md overflow-hidden amber-glow-box">
      {/* Table Toolbar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 px-6 border-b border-white/[0.06] bg-espresso-900/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white font-mono">User Management</span>
          <span className="rounded-full bg-espresso-800 px-2.5 py-0.5 text-xs font-mono text-[#A1A1AA] border border-white/10 tabular-nums">
            {filtered.length} of {users.length} accounts
          </span>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <IconSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search by name, ID, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-espresso-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#A1A1AA]/50 focus:border-amber-glow focus:outline-none focus:ring-1 focus:ring-amber-glow min-h-[38px]"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-espresso-900 px-3 py-1.5 text-xs text-white focus:border-amber-glow focus:outline-none cursor-pointer min-h-[38px]"
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
            className="rounded-xl border border-white/10 bg-espresso-900 px-3 py-1.5 text-xs text-white focus:border-amber-glow focus:outline-none cursor-pointer min-h-[38px]"
          >
            <option value="all">All Programs</option>
            <option value="BSIT">BSIT</option>
            <option value="BSCS">BSCS</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-espresso-900/30 text-[#A1A1AA] uppercase tracking-wider font-mono text-[10px]">
              <th className="py-3 px-5 font-semibold">User Member</th>
              <th className="py-3 px-4 font-semibold">Identifier / Email</th>
              <th className="py-3 px-4 font-semibold">Role</th>
              <th className="py-3 px-4 font-semibold">Program</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                {/* User column (Avatar + Name) */}
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-espresso-750 border border-white/10 text-xs font-bold text-amber-light font-mono">
                      {getInitials(u.full_name)}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{u.full_name}</div>
                      <div className="text-[11px] text-[#A1A1AA] font-mono">
                        {u.student_no ? `ID: ${u.student_no}` : `Staff: ${u.id.slice(0, 8)}`}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Email / Identifier */}
                <td className="py-3.5 px-4 font-mono text-[#A1A1AA] text-xs whitespace-nowrap">
                  {u.email ?? (u.student_no ? `${u.student_no}@student.cetc.edu` : 'No email registered')}
                </td>

                {/* Role Badge */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border font-mono ${getRoleBadge(
                      u.role,
                    )}`}
                  >
                    {u.role}
                  </span>
                </td>

                {/* Program Code */}
                <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                  <span className="font-medium text-[#EDEDED]">
                    {u.program_code ?? (u.role === 'student' ? 'BSIT' : 'Dept Staff')}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-status-sage/15 px-2.5 py-0.5 text-[10px] font-semibold text-status-sage border border-status-sage/30 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-sage" />
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
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-status-crimson hover:bg-status-crimson/15 transition-colors active:scale-[0.98] min-h-[32px] flex items-center justify-center border border-status-crimson/20"
                        title="Delete profile"
                      >
                        Remove
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                      className="rounded-lg p-1.5 text-[#A1A1AA] hover:text-white hover:bg-white/[0.05] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center active:scale-[0.98]"
                      aria-label="More actions"
                    >
                      <IconDotsLine className="h-4 w-4" />
                    </button>
                  </div>

                  {activeMenuId === u.id && (
                    <div className="absolute right-5 top-12 z-20 w-44 rounded-xl border border-white/10 bg-espresso-900/95 backdrop-blur-xl p-1.5 shadow-2xl text-left">
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Reset password email queued for ${u.full_name}`);
                          setActiveMenuId(null);
                        }}
                        className="w-full rounded-lg px-2.5 py-1.5 text-xs text-white hover:bg-white/[0.05] transition-colors text-left"
                      >
                        Send Reset Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Viewing record dossier for ${u.full_name}`);
                          setActiveMenuId(null);
                        }}
                        className="w-full rounded-lg px-2.5 py-1.5 text-xs text-[#A1A1AA] hover:text-white hover:bg-white/[0.05] transition-colors text-left"
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
                <td colSpan={6} className="py-8 text-center text-[#A1A1AA] text-xs font-mono">
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
