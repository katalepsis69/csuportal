'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

type FormDataLike = FormData;

function str(fd: FormDataLike, key: string): string {
  return String(fd.get(key) ?? '').trim();
}

async function adminClient() {
  await requireRole('admin'); // RLS also enforces this — belt and suspenders
  return createClient();
}

function refresh() {
  revalidatePath('/admin');
}

// ── semesters / eval period ──────────────────────────────────

export async function createSemester(fd: FormDataLike) {
  const supabase = await adminClient();
  const opensAt = str(fd, 'opens_at');
  const closesAt = str(fd, 'closes_at');
  await supabase.from('semesters').insert({
    academic_year: str(fd, 'academic_year'),
    term: str(fd, 'term') as '1st' | '2nd' | 'midyear',
    is_current: fd.get('is_current') === 'on',
    is_open: false,
    opens_at: opensAt ? new Date(opensAt).toISOString() : null,
    closes_at: closesAt ? new Date(closesAt).toISOString() : null,
  });
  refresh();
}

export async function setCurrentSemester(fd: FormDataLike) {
  const supabase = await adminClient();
  const id = str(fd, 'id');
  await supabase.from('semesters').update({ is_current: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('semesters').update({ is_current: true }).eq('id', id);
  refresh();
}

export async function togglePeriod(fd: FormDataLike) {
  const supabase = await adminClient();
  const id = str(fd, 'id');
  const open = str(fd, 'open') === 'true';
  const patch: Record<string, unknown> = { is_open: open };
  if (open) {
    const { data } = await supabase.from('semesters').select('opens_at, closes_at').eq('id', id).single();
    if (!data?.opens_at) patch.opens_at = new Date().toISOString();
    if (!data?.closes_at) patch.closes_at = new Date(Date.now() + 14 * 864e5).toISOString();
  }
  await supabase.from('semesters').update(patch).eq('id', id);
  refresh();
}

// ── programs / sections / subjects / questions ───────────────

export async function createProgram(fd: FormDataLike) {
  const supabase = await adminClient();
  await supabase.from('programs').insert({ code: str(fd, 'code').toUpperCase(), name: str(fd, 'name') });
  refresh();
}

export async function createSection(fd: FormDataLike) {
  const supabase = await adminClient();
  await supabase.from('sections').insert({
    program_id: str(fd, 'program_id'),
    year_level: Number(str(fd, 'year_level')),
    name: str(fd, 'name'),
  });
  refresh();
}

export async function createSubject(fd: FormDataLike) {
  const supabase = await adminClient();
  await supabase.from('subjects').insert({ code: str(fd, 'code').toUpperCase(), name: str(fd, 'name') });
  refresh();
}

export async function createQuestion(fd: FormDataLike) {
  const supabase = await adminClient();
  await supabase.from('questions').insert({
    text: str(fd, 'text'),
    category: str(fd, 'category'),
    sort_order: Number(str(fd, 'sort_order') || '0'),
  });
  refresh();
}

export async function toggleQuestion(fd: FormDataLike) {
  const supabase = await adminClient();
  await supabase
    .from('questions')
    .update({ active: str(fd, 'active') === 'true' })
    .eq('id', str(fd, 'id'));
  refresh();
}

// ── assignments & enrollments ────────────────────────────────

export async function createAssignment(fd: FormDataLike) {
  const supabase = await adminClient();
  await supabase.from('section_subjects').insert({
    semester_id: str(fd, 'semester_id'),
    section_id: str(fd, 'section_id'),
    subject_id: str(fd, 'subject_id'),
    faculty_id: str(fd, 'faculty_id'),
  });
  refresh();
}

export async function createEnrollment(fd: FormDataLike) {
  const supabase = await adminClient();
  await supabase.from('enrollments').insert({
    student_id: str(fd, 'student_id'),
    section_subject_id: str(fd, 'section_subject_id'),
  });
  refresh();
}

// ── delete (allowlisted tables only) ─────────────────────────

const DELETABLE = new Set([
  'programs',
  'sections',
  'subjects',
  'questions',
  'semesters',
  'section_subjects',
  'enrollments',
] as const);

export async function adminDelete(fd: FormDataLike) {
  const table = str(fd, 'table');
  if (!DELETABLE.has(table as (typeof DELETABLE extends Set<infer T> ? T : never))) return;
  const supabase = await adminClient();
  await supabase.from(table).delete().eq('id', str(fd, 'id'));
  refresh();
}
