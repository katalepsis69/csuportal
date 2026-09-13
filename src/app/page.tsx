import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const HOME: Record<Profile['role'], string> = {
  admin: '/admin',
  dean: '/dean',
  faculty: '/faculty',
  student: '/student',
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  redirect(HOME[(profile?.role ?? 'student') as Profile['role']]);
}
