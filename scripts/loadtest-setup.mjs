/**
 * Load-test setup: creates a dedicated LOADTEST semester (open now), N
 * throwaway students enrolled in 2 classes, and writes k6/loadtest-env.json.
 * Run: node scripts/loadtest-setup.mjs [N]   (default 50; use 500 for §7)
 * Teardown: node scripts/loadtest-teardown.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of existsSync('.env.local') ? readFileSync('.env.local', 'utf8').split('\n') : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SERVICE) {
  console.error('Missing env in .env.local');
  process.exit(1);
}

const N = Number(process.argv[2] ?? 50);
const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  // ── loadtest semester (open for 2h) ──
  const { data: existing } = await admin
    .from('semesters')
    .select('id')
    .eq('academic_year', 'LOADTEST')
    .eq('term', '1st')
    .single();
  let semesterId = existing?.id;
  if (!semesterId) {
    const { data, error } = await admin
      .from('semesters')
      .insert({
        academic_year: 'LOADTEST',
        term: '1st',
        is_current: false,
        is_open: true,
        opens_at: new Date().toISOString(),
        closes_at: new Date(Date.now() + 2 * 3600e3).toISOString(),
      })
      .select('id')
      .single();
    if (error) throw error;
    semesterId = data.id;
  }

  // ── 2 classes in the loadtest semester (reuse a section + 2 subjects) ──
  const { data: section } = await admin.from('sections').select('id').limit(1).single();
  const { data: subjects } = await admin.from('subjects').select('id').order('code').limit(2);
  const { data: faculty } = await admin.from('profiles').select('id').eq('role', 'faculty').limit(2);
  for (let i = 0; i < 2; i++) {
    await admin
      .from('section_subjects')
      .insert({
        section_id: section.id,
        subject_id: subjects[i].id,
        semester_id: semesterId,
        faculty_id: faculty[i % faculty.length].id,
      })
      .select('id');
  }
  const { data: existingClasses } = await admin
    .from('section_subjects')
    .select('id')
    .eq('semester_id', semesterId);
  const ids = existingClasses.map((c) => c.id);

  const { data: questions } = await admin
    .from('questions')
    .select('id')
    .eq('active', true)
    .order('sort_order');
  const questionIds = questions.map((q) => q.id);

  // ── N throwaway students ──
  const students = [];
  const stamp = Date.now();
  for (let i = 0; i < N; i++) {
    const email = `load-${stamp}-${i}@cetc.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: 'eval1234',
      email_confirm: true,
      user_metadata: { role: 'student', full_name: `Load Test ${i}` },
    });
    if (error) throw error;
    const id = data.user?.id ?? data.id;
    students.push({ email, id, password: 'eval1234' });
    // enroll in one class (round-robin)
    await admin.from('enrollments').insert({ student_id: id, section_subject_id: ids[i % ids.length] });
    if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${N} students`);
  }

  // ── mint one token per student (paced ~1.1s to stay under Supabase's
  //    ~60 logins/min per IP) so k6 can test pure submit concurrency ──
  console.log('minting tokens (paced, ~1.1s each — grab coffee for large N)...');
  for (const s of students) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: s.email, password: s.password }),
      });
      if (res.ok) {
        s.token = (await res.json()).access_token;
        break;
      }
      await new Promise((r) => setTimeout(r, 5000)); // rate-limited — back off
    }
    await new Promise((r) => setTimeout(r, 1100));
    if (students.indexOf(s) % 25 === 24) console.log(`  tokens ${students.indexOf(s) + 1}/${N}`);
  }
  const minted = students.filter((s) => s.token).length;
  console.log(`minted ${minted}/${N} tokens`);

  writeFileSync(
    'k6/loadtest-env.json',
    JSON.stringify({ url: URL, anon: ANON, classIds: ids, questions: questionIds, students }, null, 2),
  );
  console.log(`\nSetup complete: ${N} students, ${ids.length} classes, ${minted} tokens`);
  console.log('Run: k6 run -e VUS=500 k6/submit-load.js   (VUS ≤ tokens)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
