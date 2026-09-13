import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Role = 'admin' | 'dean' | 'faculty' | 'student';

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  student_no: string | null;
};

const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/admin',
  dean: '/dean',
  faculty: '/faculty',
  student: '/student',
};

/**
 * Per-request dedup: the portal layout and each page both need the profile —
 * React.cache() makes that one auth.getUser + one profiles query per request.
 */
const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, role, full_name, student_no')
    .eq('id', user.id)
    .single();

  return (data as Profile) ?? null;
});

/** Returns the signed-in user's profile, or redirects to login. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  return profile;
}

/** Same as requireProfile but also enforces one of the allowed roles. */
export async function requireRole(...allowed: Role[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role)) redirect(HOME_BY_ROLE[profile.role]);
  return profile;
}
