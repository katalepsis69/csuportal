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
  password: string;
}): Promise<{ ok: boolean; error?: string; email?: string }> {
  const fullName = input.fullName.trim();
  const studentNo = input.studentNo.trim();
  const password = input.password;

  if (!fullName) return { ok: false, error: 'Please enter your name.' };
  if (!studentNo) return { ok: false, error: 'Please enter your student ID.' };
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

  const clean = studentNo.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const email = `${clean}@student.cetc.edu`;

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'student',
      full_name: fullName,
      student_no: studentNo,
    },
  });

  if (createError) {
    if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
      return { ok: false, error: 'An account for this Student ID already exists. Please log in.' };
    }
    return { ok: false, error: createError.message };
  }

  return { ok: true, email };
}

