/**
 * Seeds the project without a DB password:
 *  - auth users via the Admin API (service key) — trigger creates profiles
 *  - reference data + demo classes/enrollments/evaluations via Management API SQL
 * Run: node scripts/seed-remote.mjs   (idempotent: safe to re-run)
 */
import { existsSync, readFileSync } from 'node:fs';

for (const line of existsSync('.env.local') ? readFileSync('.env.local', 'utf8').split('\n') : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;
if (!URL || !SERVICE || !TOKEN || !REF) {
  console.error('Missing env (see .env.local)');
  process.exit(1);
}

const esc = (s) => String(s).replace(/'/g, "''");

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`SQL HTTP ${res.status}: ${body.slice(0, 500)}\n${sql.slice(0, 200)}`);
  return JSON.parse(body);
}

const DEMO_USERS = [
  { email: 'admin@cetc.test', role: 'admin', full_name: 'Portal Admin', student_no: null },
  { email: 'dean@cetc.test', role: 'dean', full_name: 'Dr. Elena Reyes', student_no: null },
  { email: 'maria@cetc.test', role: 'faculty', full_name: 'Maria Santos', student_no: null },
  { email: 'jose@cetc.test', role: 'faculty', full_name: 'Jose Rizal Jr.', student_no: null },
  { email: 'ana@cetc.test', role: 'faculty', full_name: 'Ana Lim', student_no: null },
  { email: 'student1@cetc.test', role: 'student', full_name: 'Juan Dela Cruz', student_no: '2026-0001' },
  { email: 'student2@cetc.test', role: 'student', full_name: 'Pedro Ramos', student_no: '2026-0002' },
  { email: 'student3@cetc.test', role: 'student', full_name: 'Maria Clara', student_no: '2026-0003' },
  { email: 'student4@cetc.test', role: 'student', full_name: 'Sisa Bautista', student_no: '2026-0004' },
  { email: 'student5@cetc.test', role: 'student', full_name: 'Crisostomo Ibarra', student_no: '2026-0005' },
];
const PASSWORD = 'eval1234';

const QUESTIONS = [
  ['Explains the lessons clearly', 'Teaching', 10],
  ['Answers questions patiently and thoroughly', 'Teaching', 20],
  ['Uses examples that make topics easier to understand', 'Teaching', 30],
  ['Teaches at a pace the class can follow', 'Teaching', 40],
  ['Grading criteria are clear from the start', 'Assessment', 50],
  ['Quizzes and activities match the lessons taught', 'Assessment', 60],
  ['Returns graded work within a reasonable time', 'Assessment', 70],
  ['Starts and ends class on time', 'Management', 80],
  ['Maintains a respectful and inclusive classroom', 'Management', 90],
  ['Is available for consultation outside class hours', 'Management', 100],
];

const COMMENTS = [
  ['Ang galing mag-explain ni Ma’am, naiintindihan ko yung lesson kahit mahirap.', 'positive'],
  ['Clear ang discussions at approachable si Sir sa mga questions.', 'positive'],
  ['Sobrang helpful ng mga examples, mas naging madali yung programming.', 'positive'],
  ['Okay lang yung pacing pero medyo mabilis minsan sa difficult topics.', 'neutral'],
  ['Dapat mas maraming hands-on exercises sa programming.', 'neutral'],
  ['Late minsan magbalik ng grades, pero magaling naman magturo.', 'neutral'],
  ['Hirap akong maintindihan yung explanations, sana mas simple.', 'negative'],
  ['Malayo ang exam sa tinuro, nakakalito.', 'negative'],
];

const now = Date.now();
const ts = (days) => `to_timestamp(${((now + days * 864e5) / 1000).toFixed(0)})`;

// ── 1. reference data ─────────────────────────────────────────
console.log('— reference data');
await query(`
drop table if exists _t1; drop table if exists _t2;
insert into programs (code, name) values ('BSIT', 'BS Information Technology'), ('BSCS', 'BS Computer Science') on conflict (code) do nothing;
insert into subjects (code, name) values
  ('IT101', 'Introduction to Computing'),
  ('IT102', 'Computer Programming 1'),
  ('IT201', 'Data Structures and Algorithms'),
  ('IT211', 'Web Systems and Technologies'),
  ('CS101', 'Discrete Structures'),
  ('CS201', 'Programming Languages')
on conflict (code) do nothing;
${QUESTIONS.map(([t, c, o]) => `insert into questions (text, category, sort_order) select '${esc(t)}', '${c}', ${o} where not exists (select 1 from questions where text = '${esc(t)}');`).join('\n')}
insert into sections (program_id, year_level, name)
  select p.id, v.y, v.n from programs p cross join (values (1, 'A'), (2, 'A')) as v(y, n) where p.code = 'BSIT'
  on conflict do nothing;
insert into sections (program_id, year_level, name)
  select p.id, 1, 'A' from programs p where p.code = 'BSCS'
  on conflict do nothing;
insert into semesters (academic_year, term, is_current, is_open, opens_at, closes_at) values
  ('2025-2026', '2nd', false, false, ${ts(-190)}, ${ts(-120)}),
  ('2026-2027', '1st', true, true, ${ts(-1)}, ${ts(30)})
on conflict (academic_year, term) do nothing;
`);

// ── 2. users ──────────────────────────────────────────────────
console.log('— demo users (password: eval1234)');
const listRes = await fetch(`${URL}/auth/v1/admin/users?per_page=1000`, {
  headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
});
const existing = new Map(((await listRes.json()).users ?? []).map((u) => [u.email, u.id]));

for (const u of DEMO_USERS) {
  let id = existing.get(u.email);
  if (!id) {
    const res = await fetch(`${URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { role: u.role, full_name: u.full_name, student_no: u.student_no },
      }),
    });
    if (!res.ok && res.status !== 422) {
      console.error(`  ${u.email}: ${(await res.text()).slice(0, 120)}`);
      continue;
    }
    const body = await res.json();
    id = body.id ?? body.user?.id ?? existing.get(u.email);
  }
  if (id) existing.set(u.email, id);
}

const uid = (email) => existing.get(email);
if (!uid('maria@cetc.test') || !uid('jose@cetc.test') || !uid('ana@cetc.test')) {
  console.error('  faculty users missing — aborting');
  process.exit(1);
}

// profiles exist?
let profiles = await query('select count(*)::int as n from profiles');
if (profiles[0].n === 0) {
  // fallback if trigger didn't fire (pre-existing users)
  const rows = await query(`select id, email from auth.users where email like '%@cetc.test'`);
  for (const r of rows) {
    const u = DEMO_USERS.find((d) => d.email === r.email);
    if (u) {
      await query(`insert into profiles (id, role, full_name, student_no) values ('${r.id}', '${u.role}', '${esc(u.full_name)}', ${u.student_no ? `'${u.student_no}'` : 'null'}) on conflict (id) do nothing`);
    }
  }
  profiles = await query('select count(*)::int as n from profiles');
}

// ── 3. classes + enrollments ──────────────────────────────────
console.log('— classes + enrollments');
const [secs, subs, sems] = await Promise.all([
  query(`select s.id, p.code as program, s.year_level from sections s join programs p on p.id = s.program_id`),
  query('select id, code from subjects'),
  query('select id, academic_year, term from semesters'),
]);
const secId = (p, y) => secs.find((s) => s.program === p && Number(s.year_level) === y)?.id;
const subId = (c) => subs.find((s) => s.code === c)?.id;
const semId = (ay, t) => sems.find((s) => s.academic_year === ay && s.term === t)?.id;
const cur = semId('2026-2027', '1st');
const past = semId('2025-2026', '2nd');

const CLASSES = [
  ['BSIT', 1, 'IT101', 'maria@cetc.test', 'cur'],
  ['BSIT', 1, 'IT102', 'jose@cetc.test', 'cur'],
  ['BSIT', 2, 'IT201', 'maria@cetc.test', 'cur'],
  ['BSIT', 2, 'IT211', 'ana@cetc.test', 'cur'],
  ['BSCS', 1, 'CS101', 'jose@cetc.test', 'cur'],
  ['BSCS', 1, 'CS201', 'ana@cetc.test', 'cur'],
  ['BSIT', 1, 'IT101', 'maria@cetc.test', 'past'],
  ['BSIT', 1, 'IT102', 'jose@cetc.test', 'past'],
];
const classIds = [];
for (const [program, year, code, fac, key] of CLASSES) {
  const sid = key === 'cur' ? cur : past;
  const res = await query(`insert into section_subjects (section_id, subject_id, semester_id, faculty_id)
    values ('${secId(program, year)}', '${subId(code)}', '${sid}', '${uid(fac)}')
    on conflict (section_id, subject_id, semester_id) do nothing returning id`);
  if (res[0]) classIds.push({ key: `${key}:${program}`, id: res[0].id, sem: key });
}

const STUDENTS_BY_SECTION = [
  ['BSIT', 1, ['student1@cetc.test', 'student2@cetc.test', 'student3@cetc.test']],
  ['BSCS', 1, ['student4@cetc.test', 'student5@cetc.test']],
];
// enroll students into every class of their program (year-1 sections)
for (const [program, , emails] of STUDENTS_BY_SECTION) {
  for (const c of classIds) {
    if (!c.key.startsWith('cur:') && !c.key.startsWith('past:')) continue;
    const prog = c.key.split(':')[1];
    if (prog !== program) continue;
    for (const email of emails) {
      const sid = uid(email);
      if (sid) await query(`insert into enrollments (student_id, section_subject_id) values ('${sid}', '${c.id}') on conflict do nothing`);
    }
  }
}

// ── 4. historical evaluations (past semester) ─────────────────
console.log('— historical evaluations');
const qids = (await query('select id from questions where active order by sort_order')).map((r) => r.id);
const sig = JSON.stringify([
  [
    { x: 0.08, y: 0.55 },
    { x: 0.2, y: 0.25 },
    { x: 0.32, y: 0.6 },
    { x: 0.45, y: 0.3 },
  ],
  [
    { x: 0.55, y: 0.25 },
    { x: 0.6, y: 0.65 },
    { x: 0.66, y: 0.25 },
  ],
]);

let i = 0;
for (const c of classIds) {
  if (c.sem !== 'past') continue;
  const enr = await query(`select id, student_id from enrollments where section_subject_id = '${c.id}'`);
  for (const en of enr) {
    const [comment, label] = COMMENTS[i % COMMENTS.length];
    const score = label === 'positive' ? 0.91 : label === 'negative' ? 0.87 : 0.62;
    const evals = await query(`insert into evaluations
      (enrollment_id, student_id, section_subject_id, semester_id, anonymous, comment, sentiment_label, sentiment_score, signature_points, submitted_at)
      values ('${en.id}', '${en.student_id}', '${c.id}', '${past}', ${i % 3 !== 0}, '${esc(comment)}', '${label}', ${score}, '${esc(sig)}'::jsonb, now() - ${80 - i} * interval '1 day')
      on conflict do nothing returning id`);
    if (evals[0]) {
      for (const q of qids) {
        const rating = 3 + ((i + q.charCodeAt(0) - 97) % 3);
        await query(`insert into evaluation_answers (evaluation_id, question_id, rating) values ('${evals[0].id}', '${q}', ${rating}) on conflict do nothing`);
      }
    }
    i++;
  }
}

const summary = await query(`select
  (select count(*)::int from profiles) as profiles,
  (select count(*)::int from section_subjects) as classes,
  (select count(*)::int from enrollments) as enrollments,
  (select count(*)::int from evaluations) as evaluations,
  (select count(*)::int from evaluation_answers) as answers`);
console.log('— summary:', summary[0]);
console.log('\nDemo accounts (password: eval1234):');
for (const u of DEMO_USERS) console.log(`  ${u.role.padEnd(8)} ${u.email}`);
