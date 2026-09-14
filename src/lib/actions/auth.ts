'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Resolves a login identifier (email or student_no) to the auth.users email.
 */
export async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) return trimmed;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient: createAdmin } = await import('@supabase/supabase-js');
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .ilike('student_no', trimmed)
      .maybeSingle();

    if (profile) {
      const { data: userRes } = await admin.auth.admin.getUserById(profile.id);
      if (userRes?.user?.email) {
        return userRes.user.email;
      }
    }
  }

  const clean = trimmed.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return `${clean}@student.cetc.edu`;
}

/**
 * Registers a student with their Student ID and password.
 */
export async function registerStudent(input: {
  fullName: string;
  studentNo: string;
  email?: string;
  password: string;
  programCode?: string;
  yearLevel?: number;
}): Promise<{ ok: boolean; error?: string; email?: string }> {
  const fullName = input.fullName.trim();
  const studentNo = input.studentNo.trim();
  const emailInput = input.email?.trim();
  const password = input.password;

  if (!fullName) return { ok: false, error: 'Please enter your name.' };
  if (!studentNo) return { ok: false, error: 'Please enter your student ID.' };
  if (emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (!password || password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: 'Authentication service not configured.' };
  }

  const { createClient: createAdmin } = await import('@supabase/supabase-js');
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if student_no already in profiles
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .ilike('student_no', studentNo)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: 'This Student ID is already registered. Please log in.' };
  }

  // Lookup program ID if programCode provided
  let programId: string | null = null;
  if (input.programCode) {
    const { data: prog } = await admin
      .from('programs')
      .select('id')
      .eq('code', input.programCode)
      .maybeSingle();
    programId = prog?.id ?? null;
  }

  const clean = studentNo.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const email = emailInput || `${clean}@student.cetc.edu`;

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'student',
      full_name: fullName,
      student_no: studentNo,
      program_code: input.programCode ?? null,
      year_level: input.yearLevel ?? null,
    },
  });

  if (createError) {
    if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
      return { ok: false, error: 'An account for this Student ID or email already exists. Please log in.' };
    }
    return { ok: false, error: createError.message };
  }

  // If programId found, link it to the newly created profile
  if (programId && newUser?.user?.id) {
    await admin
      .from('profiles')
      .update({ program_id: programId })
      .eq('id', newUser.user.id);
  }

  return { ok: true, email };
}


/**
 * Sends a password reset email for a given student ID or email.
 */
export async function requestPasswordReset(identifier: string): Promise<{ ok: boolean; error?: string }> {
  const email = await resolveLoginEmail(identifier);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}


