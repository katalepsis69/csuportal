'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

type FormDataLike = FormData;
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function str(fd: FormDataLike, key: string): string {
  return String(fd.get(key) ?? '').trim();
}

async function adminClient() {
  await requireRole('admin'); // RLS also enforces this — belt and suspenders
  return createClient();
}

// Every mutation ends by redirecting back to its tab: success clears any stale
// error banner, failure carries a plain-language message (audit P10).
function back(tab: string, message?: string): never {
  redirect(message ? `/admin?tab=${tab}&error=${encodeURIComponent(message)}` : `/admin?tab=${tab}`);
}

function dbMessage(error: { code?: string | null; message: string }): string {
  if (error.code === '23503' || /foreign key/i.test(error.message)) {
    return 'This record is still referenced by other data, so that change is not possible.';
  }
  if (error.code === '23505' || /duplicate key/i.test(error.message)) {
    return 'A record with these exact values already exists.';
  }
  return error.message;
}

// Minimal audit trail (0007 admin_audit): one row per admin mutation.
async function audit(
  supabase: SupabaseClient,
  action: string,
  details: Record<string, unknown>,
  error?: string | null,
) {
  const { error: auditError } = await supabase
    .from('admin_audit')
    .insert({ action, details, error: error ?? null });
  if (auditError) console.error('[admin:audit] insert failed:', auditError.message);
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0].message;
}

// ponytail: the campus is Manila (+08:00, no DST). datetime-local input is
// interpreted in campus time, not the server's (UTC) clock (audit P20).
function manilaToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}:00+08:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const uuidField = z.string().uuid('Invalid record selected.');

function requireUuid(fd: FormDataLike, tab: string): string {
  const id = str(fd, 'id');
  if (!uuidField.safeParse(id).success) back(tab, 'Invalid record selected.');
  return id;
}

// ── semesters / eval period ──────────────────────────────────

const semesterSchema = z.object({
  academic_year: z.string().trim().min(4, 'Academic year is required.').max(20, 'Academic year is too long.'),
  term: z.enum(['1st', '2nd', 'midyear'], { message: 'Invalid term.' }),
  is_current: z.boolean(),
  opens_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid open time.').or(z.literal('')),
  closes_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid close time.').or(z.literal('')),
});

export async function createSemester(fd: FormDataLike) {
  const tab = 'semesters';
  const supabase = await adminClient();
  const parsed = semesterSchema.safeParse({
    academic_year: str(fd, 'academic_year'),
    term: str(fd, 'term'),
    is_current: fd.get('is_current') === 'on',
    opens_at: str(fd, 'opens_at'),
    closes_at: str(fd, 'closes_at'),
  });
  if (!parsed.success) back(tab, firstIssue(parsed.error));
  const v = parsed.data;
  const opensAt = manilaToIso(v.opens_at);
  const closesAt = manilaToIso(v.closes_at);
  if (v.opens_at && !opensAt) back(tab, 'Invalid open time.');
  if (v.closes_at && !closesAt) back(tab, 'Invalid close time.');
  if (opensAt && closesAt && new Date(closesAt) <= new Date(opensAt)) {
    back(tab, 'The close time must be after the open time.');
  }

  if (v.is_current) {
    const { error: clearError } = await supabase
      .from('semesters')
      .update({ is_current: false })
      .eq('is_current', true);
    if (clearError) {
      await audit(supabase, 'create_semester', { academic_year: v.academic_year }, clearError.message);
      back(tab, dbMessage(clearError));
    }
  }

  const { error } = await supabase.from('semesters').insert({
    academic_year: v.academic_year,
    term: v.term,
    is_current: v.is_current,
    is_open: false,
    opens_at: opensAt,
    closes_at: closesAt,
  });
  await audit(
    supabase,
    'create_semester',
    { academic_year: v.academic_year, term: v.term, is_current: v.is_current },
    error?.message ?? null,
  );
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}

export async function setCurrentSemester(fd: FormDataLike) {
  const tab = str(fd, 'tab') || 'semesters';
  const supabase = await adminClient();
  const id = requireUuid(fd, tab);
  const { error: clearError } = await supabase
    .from('semesters')
    .update({ is_current: false })
    .neq('id', id);
  if (clearError) {
    await audit(supabase, 'set_current_semester', { id }, clearError.message);
    back(tab, dbMessage(clearError));
  }
  const { error } = await supabase.from('semesters').update({ is_current: true }).eq('id', id);
  await audit(supabase, 'set_current_semester', { id }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}

export async function togglePeriod(fd: FormDataLike) {
  const tab = str(fd, 'tab') || 'semesters';
  const supabase = await adminClient();
  const id = requireUuid(fd, tab);
  const open = str(fd, 'open') === 'true';
  // manual override trumps the derived time window (see lib/types.ts)
  const { error } = await supabase
    .from('semesters')
    .update({ manual_override: open ? 'open' : 'closed' })
    .eq('id', id);
  await audit(supabase, 'toggle_period', { id, override: open ? 'open' : 'closed' }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}

export async function clearOverride(fd: FormDataLike) {
  const tab = str(fd, 'tab') || 'semesters';
  const supabase = await adminClient();
  const id = requireUuid(fd, tab);
  // return this semester to its derived window (opens_at..closes_at)
  const { error } = await supabase.from('semesters').update({ manual_override: null }).eq('id', id);
  await audit(supabase, 'clear_override', { id }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}

// ── programs / sections / subjects / questions ───────────────

const codeNameSchema = z.object({
  code: z.string().trim().min(1, 'Code is required.').max(20, 'Code is too long.'),
  name: z.string().trim().min(1, 'Name is required.').max(120, 'Name is too long.'),
});

export async function createProgram(fd: FormDataLike) {
  const tab = 'programs';
  const supabase = await adminClient();
  const parsed = codeNameSchema.safeParse({ code: str(fd, 'code').toUpperCase(), name: str(fd, 'name') });
  if (!parsed.success) back(tab, firstIssue(parsed.error));
  const { error } = await supabase.from('programs').insert(parsed.data);
  await audit(supabase, 'create_program', { code: parsed.data.code }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}

export async function createSubject(fd: FormDataLike) {
  const tab = 'subjects';
  const supabase = await adminClient();
  const parsed = codeNameSchema.safeParse({ code: str(fd, 'code').toUpperCase(), name: str(fd, 'name') });
  if (!parsed.success) back(tab, firstIssue(parsed.error));
  const { error } = await supabase.from('subjects').insert(parsed.data);
  await audit(supabase, 'create_subject', { code: parsed.data.code }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}

const sectionSchema = z.object({
  program_id: z.string().uuid('Invalid program selected.'),
  year_level: z.coerce
    .number({ invalid_type_error: 'Year level must be a number.' })
    .int('Year level must be a whole number.')
    .min(1, 'Year level must be between 1 and 9.')
    .max(9, 'Year level must be between 1 and 9.'),
  name: z.string().trim().min(1, 'Section name is required.').max(50, 'Section name is too long.'),
});

export async function createSection(fd: FormDataLike) {
  const tab = 'sections';
  const supabase = await adminClient();
  const parsed = sectionSchema.safeParse({
    program_id: str(fd, 'program_id'),
    year_level: str(fd, 'year_level'),
    name: str(fd, 'name'),
  });
  if (!parsed.success) back(tab, firstIssue(parsed.error));
  const { error } = await supabase.from('sections').insert(parsed.data);
  await audit(supabase, 'create_section', { program_id: parsed.data.program_id, name: parsed.data.name }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}

const questionSchema = z.object({
  text: z.string().trim().min(1, 'Question text is required.').max(300, 'Question is too long.'),
  category: z.string().trim().min(1, 'Category is required.').max(60, 'Category is too long.'),
  sort_order: z.coerce
    .number({ invalid_type_error: 'Order must be a number.' })
    .int('Order must be a whole number.')
    .min(0, 'Order must be 0 or greater.')
    .max(999, 'Order is too large.')
    .default(0),
});

export async function createQuestion(fd: FormDataLike) {
  const tab = 'questions';
  const supabase = await adminClient();
  const parsed = questionSchema.safeParse({
    text: str(fd, 'text'),
    category: str(fd, 'category'),
    sort_order: str(fd, 'sort_order') || '0',
  });
  if (!parsed.success) back(tab, firstIssue(parsed.error));
  const { error } = await supabase.from('questions').insert(parsed.data);
  await audit(supabase, 'create_question', { category: parsed.data.category, sort_order: parsed.data.sort_order }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}

export async function toggleQuestion(fd: FormDataLike) {
  const tab = str(fd, 'tab') || 'questions';
  const supabase = await adminClient();
  const id = requireUuid(fd, tab);
  const active = str(fd, 'active') === 'true';
  const { error } = await supabase.from('questions').update({ active }).eq('id', id);
  await audit(supabase, 'toggle_question', { id, active }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}

// ── assignments & enrollments ────────────────────────────────

const assignmentSchema = z.object({
  semester_id: z.string().uuid('Invalid semester selected.'),
  section_id: z.string().uuid('Invalid section selected.'),
  subject_id: z.string().uuid('Invalid subject selected.'),
  faculty_id: z.string().uuid('Invalid faculty selected.'),
});

export async function createAssignment(fd: FormDataLike) {
  const tab = 'assignments';
  const supabase = await adminClient();
  const parsed = assignmentSchema.safeParse({
    semester_id: str(fd, 'semester_id'),
    section_id: str(fd, 'section_id'),
    subject_id: str(fd, 'subject_id'),
    faculty_id: str(fd, 'faculty_id'),
  });
  if (!parsed.success) back(tab, firstIssue(parsed.error));
  const { error } = await supabase.from('section_subjects').insert(parsed.data);
  await audit(supabase, 'create_assignment', { subject_id: parsed.data.subject_id, faculty_id: parsed.data.faculty_id }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}

const enrollmentSchema = z.object({
  student_id: z.string().uuid('Invalid student selected.'),
  section_subject_id: z.string().uuid('Invalid class selected.'),
});

export async function createEnrollment(fd: FormDataLike) {
  const tab = 'enrollments';
  const supabase = await adminClient();
  const parsed = enrollmentSchema.safeParse({
    student_id: str(fd, 'student_id'),
    section_subject_id: str(fd, 'section_subject_id'),
  });
  if (!parsed.success) back(tab, firstIssue(parsed.error));
  const { error } = await supabase.from('enrollments').insert(parsed.data);
  await audit(supabase, 'create_enrollment', { student_id: parsed.data.student_id, class: parsed.data.section_subject_id }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
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
  const tab = str(fd, 'tab') || 'users';
  const table = str(fd, 'table');
  if (!DELETABLE.has(table as (typeof DELETABLE extends Set<infer T> ? T : never))) {
    back(tab, 'Unknown record type.');
  }
  const supabase = await adminClient();
  const id = requireUuid(fd, tab);
  const { error } = await supabase.from(table).delete().eq('id', id);
  await audit(supabase, 'delete', { table, id }, error?.message ?? null);
  if (error) back(tab, dbMessage(error));
  revalidatePath('/admin');
  back(tab);
}
