/**
 * Shared helpers for the API-level test suite (node --test scripts/tests/).
 * Tests run against the LIVE Supabase project using real role JWTs; anything
 * created is cleaned up in afterEach/finally.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of existsSync('.env.local') ? readFileSync('.env.local', 'utf8').split('\n') : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

export const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / ANON / SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

export const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function signIn(email, password = 'eval1234') {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`sign-in failed for ${email}: HTTP ${res.status}`);
  const body = await res.json();
  return { token: body.access_token, id: body.user.id, email };
}

/** REST helper bound to a user's JWT. */
export function rest(token) {
  return async (path, opts = {}) => {
    const res = await fetch(`${URL}/rest/v1${path}`, {
      ...opts,
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(opts.headers ?? {}),
      },
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, body };
  };
}

/** Creates a throwaway auth student (profile via trigger). Returns creds. */
export async function createTestStudent() {
  const email = `apitest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@cetc.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'eval1234',
    email_confirm: true,
    user_metadata: { role: 'student', full_name: 'API Test Student' },
  });
  if (error) throw new Error(`createUser: ${error.message}`);
  return { email, id: data.user?.id ?? data.id, password: 'eval1234' };
}

/** Full cleanup for a throwaway student (order matters: FKs). */
export async function cleanupTestStudent(id) {
  await admin.from('evaluations').delete().eq('student_id', id);
  await admin.from('drafts').delete().eq('student_id', id);
  await admin.from('enrollments').delete().eq('student_id', id);
  await admin.from('profiles').delete().eq('id', id);
  await admin.auth.admin.deleteUser(id);
}

/** Any section_subject in the current, open semester. */
export async function pickOpenClass() {
  const { data, error } = await admin
    .from('section_subjects')
    .select('id, semesters!inner(is_current, is_open)')
    .eq('semesters.is_current', true)
    .eq('semesters.is_open', true)
    .limit(1);
  if (error) throw new Error(`pickOpenClass: ${error.message}`);
  if (!data?.length) throw new Error('no open class found — seed first');
  return data[0].id;
}
