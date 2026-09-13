/**
 * Load-test teardown: removes everything the setup created (LOADTEST semester
 * data + throwaway students). Run: node scripts/loadtest-teardown.mjs
 */
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of existsSync('.env.local') ? readFileSync('.env.local', 'utf8').split('\n') : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: semester } = await admin
    .from('semesters')
    .select('id')
    .eq('academic_year', 'LOADTEST')
    .single();
  if (semester) {
    const { data: classes } = await admin
      .from('section_subjects')
      .select('id')
      .eq('semester_id', semester.id);
    const ids = (classes ?? []).map((c) => c.id);
    if (ids.length) {
      const { data: evals } = await admin
        .from('evaluations')
        .select('id')
        .in('section_subject_id', ids);
      for (const e of evals ?? []) {
        await admin.from('evaluation_answers').delete().eq('evaluation_id', e.id);
      }
      await admin.from('evaluations').delete().in('section_subject_id', ids);
      await admin.from('drafts').delete().in('section_subject_id', ids);
      await admin.from('enrollments').delete().in('section_subject_id', ids);
      await admin.from('section_subjects').delete().eq('semester_id', semester.id);
    }
    await admin.from('semesters').delete().eq('id', semester.id);
    console.log(`removed semester ${semester.id} + ${ids.length} classes + data`);
  }

  const { data: loadProfiles } = await admin
    .from('profiles')
    .select('id')
    .like('full_name', 'Load Test %');
  for (const p of loadProfiles ?? []) {
    await admin.from('evaluations').delete().eq('student_id', p.id);
    await admin.from('drafts').delete().eq('student_id', p.id);
    await admin.from('enrollments').delete().eq('student_id', p.id);
    await admin.from('profiles').delete().eq('id', p.id);
    await admin.auth.admin.deleteUser(p.id);
  }
  console.log(`removed ${loadProfiles?.length ?? 0} load-test users`);

  if (existsSync('k6/loadtest-env.json')) {
    unlinkSync('k6/loadtest-env.json');
    console.log('removed k6/loadtest-env.json');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
