/**
 * Seed script — demo data for local dev and the thesis defense.
 *
 *   npm run db:apply   (migrations first)
 *   npm run db:seed
 *
 * Reference data (programs/subjects/questions/semesters) is inserted with
 * ON CONFLICT DO NOTHING — safe to re-run. Users + demo enrollments +
 * historical evaluations are only created when SUPABASE_SERVICE_ROLE_KEY
 * is set, and only once (skips if profiles already exist).
 */
import { existsSync, readFileSync } from 'node:fs';
import postgres from 'postgres';

for (const line of existsSync('.env.local') ? readFileSync('.env.local', 'utf8').split('\n') : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing in .env.local');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'prefer' });

const QUESTIONS: [string, string, number][] = [
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

const COMMENTS: [string, 'positive' | 'neutral' | 'negative'][] = [
  ['Ang galing mag-explain ni Ma’am, naiintindihan ko yung lesson kahit mahirap.', 'positive'],
  ['Clear ang discussions at approachable si Sir sa mga questions.', 'positive'],
  ['Sobrang helpful ng mga examples, mas naging madali yung programming.', 'positive'],
  ['Okay lang yung pacing pero medyo mabilis minsan sa difficult topics.', 'neutral'],
  ['Dapat mas maraming hands-on exercises sa programming.', 'neutral'],
  ['Late minsan magbalik ng grades, pero magaling naman magturo.', 'neutral'],
  ['Hirap akong maintindihan yung explanations, sana mas simple.', 'negative'],
  ['Malayo ang exam sa tinuro, nakakalito.', 'negative'],
];

const DEMO_USERS = [
  { email: 'admin@cetc.test', role: 'admin', full_name: 'Portal Admin', student_no: null, program: null },
  { email: 'dean@cetc.test', role: 'dean', full_name: 'Dr. Elena Reyes', student_no: null, program: null },
  { email: 'maria@cetc.test', role: 'faculty', full_name: 'Maria Santos', student_no: null, program: null },
  { email: 'jose@cetc.test', role: 'faculty', full_name: 'Jose Rizal Jr.', student_no: null, program: null },
  { email: 'ana@cetc.test', role: 'faculty', full_name: 'Ana Lim', student_no: null, program: null },
  { email: 'student1@cetc.test', role: 'student', full_name: 'Juan Dela Cruz', student_no: '2026-0001', program: 'BSIT' },
  { email: 'student2@cetc.test', role: 'student', full_name: 'Pedro Ramos', student_no: '2026-0002', program: 'BSIT' },
  { email: 'student3@cetc.test', role: 'student', full_name: 'Maria Clara', student_no: '2026-0003', program: 'BSIT' },
  { email: 'student4@cetc.test', role: 'student', full_name: 'Sisa Bautista', student_no: '2026-0004', program: 'BSCS' },
  { email: 'student5@cetc.test', role: 'student', full_name: 'Crisostomo Ibarra', student_no: '2026-0005', program: 'BSCS' },
];
const DEMO_PASSWORD = 'eval1234';

async function seedReference() {
  console.log('— reference data');
  await sql`insert into programs (code, name) values ('BSIT', 'BS Information Technology'), ('BSCS', 'BS Computer Science') on conflict (code) do nothing`;
  await sql`insert into subjects (code, name) values
    ('IT101', 'Introduction to Computing'),
    ('IT102', 'Computer Programming 1'),
    ('IT201', 'Data Structures and Algorithms'),
    ('IT211', 'Web Systems and Technologies'),
    ('CS101', 'Discrete Structures'),
    ('CS201', 'Programming Languages')
  on conflict (code) do nothing`;
  for (const [text, category, order] of QUESTIONS) {
    await sql`insert into questions (text, category, sort_order) select ${text}, ${category}, ${order}
      where not exists (select 1 from questions where text = ${text})`;
  }
  await sql`insert into sections (program_id, year_level, name)
    select p.id, v.y, v.n from programs p
    cross join (values (1, 'A'), (2, 'A')) as v(y, n)
    where p.code = 'BSIT'
    on conflict do nothing`;
  await sql`insert into sections (program_id, year_level, name)
    select p.id, 1, 'A' from programs p where p.code = 'BSCS'
    on conflict do nothing`;

  const now = Date.now();
  await sql`insert into semesters (academic_year, term, is_current, is_open, opens_at, closes_at) values
    ('2025-2026', '2nd', false, false,
      to_timestamp(${(now - 190 * 864e5) / 1000}), to_timestamp(${(now - 120 * 864e5) / 1000})),
    ('2026-2027', '1st', true, true,
      to_timestamp(${(now - 1 * 864e5) / 1000}), to_timestamp(${(now + 30 * 864e5) / 1000}))
    on conflict (academic_year, term) do nothing`;
}

async function seedDemo() {
  if (!URL || !SERVICE_KEY) {
    console.log('— SUPABASE_SERVICE_ROLE_KEY not set: skipping users/enrollments/demo evaluations');
    console.log('  (create users manually in Supabase → Authentication → Add user, with metadata:');
    console.log('   { "role": "student", "full_name": "...", "student_no": "..." })');
    return;
  }

  const existing = await sql`select count(*)::int as n from profiles`;
  if (existing[0].n > 0) {
    console.log('— profiles exist: skipping demo users/enrollments (already seeded)');
    return;
  }

  console.log('— creating demo users (password: eval1234)');
  const { createClient: createSupa } = await import('@supabase/supabase-js');
  const admin = createSupa(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const byEmail = new Map((list?.users ?? []).map((u) => [u.email, u.id]));

  for (const u of DEMO_USERS) {
    let id = byEmail.get(u.email);
    if (!id) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { role: u.role, full_name: u.full_name, student_no: u.student_no },
      });
      if (error) {
        console.error(`  failed to create ${u.email}: ${error.message}`);
        continue;
      }
      id = data.user.id;
    } else {
      // user exists but may lack a profile row (pre-trigger)
      await sql`insert into profiles (id, role, full_name, student_no)
        values (${id}, ${u.role}, ${u.full_name}, ${u.student_no}) on conflict (id) do nothing`;
    }
    byEmail.set(u.email, id);
  }

  const uid = (email: string) => byEmail.get(email);
  const maria = uid('maria@cetc.test');
  const jose = uid('jose@cetc.test');
  const ana = uid('ana@cetc.test');
  if (!maria || !jose || !ana) {
    console.error('  faculty users missing — aborting demo data');
    return;
  }

  const sec = await sql`select s.id, p.code as program, s.year_level, s.name
    from sections s join programs p on p.id = s.program_id`;
  const sub = await sql`select id, code from subjects`;
  const sem = await sql`select id, academic_year, term from semesters`;
  const secId = (program: string, year: number) => sec.find((s) => s.program === program && s.year_level === year)?.id;
  const subId = (code: string) => sub.find((s) => s.code === code)?.id;
  const semId = (ay: string, term: string) => sem.find((s) => s.academic_year === ay && s.term === term)?.id;
  if (!secId('BSIT', 1) || !subId('IT101') || !semId('2026-2027', '1st')) {
    console.error('  reference data missing — run seedReference part first');
    return;
  }

  console.log('— assignments + enrollments');
  const cur = semId('2026-2027', '1st')!;
  const past = semId('2025-2026', '2nd')!;
  const classes: [string, number, string, string, string][] = [
    // [program, year, subject, facultyEmail, semesterKey]
    ['BSIT', 1, 'IT101', 'maria@cetc.test', 'cur'],
    ['BSIT', 1, 'IT102', 'jose@cetc.test', 'cur'],
    ['BSIT', 2, 'IT201', 'maria@cetc.test', 'cur'],
    ['BSIT', 2, 'IT211', 'ana@cetc.test', 'cur'],
    ['BSCS', 1, 'CS101', 'jose@cetc.test', 'cur'],
    ['BSCS', 1, 'CS201', 'ana@cetc.test', 'cur'],
    ['BSIT', 1, 'IT101', 'maria@cetc.test', 'past'],
    ['BSIT', 1, 'IT102', 'jose@cetc.test', 'past'],
  ];
  const classIds: Record<string, { id: string; semester: string; students: string[] }> = {};
  for (const [program, year, code, facultyEmail, key] of classes) {
    const sid = key === 'cur' ? cur : past;
    const res = await sql`insert into section_subjects (section_id, subject_id, semester_id, faculty_id)
      values (${secId(program, year)}, ${subId(code)}, ${sid}, ${uid(facultyEmail)!})
      on conflict (section_id, subject_id, semester_id) do nothing
      returning id`;
    if (res[0]) classIds[`${key}:${program}:${year}:${code}`] = { id: res[0].id, semester: key, students: [] };
  }

  const studentsBySection: [string, number, string[]][] = [
    ['BSIT', 1, ['student1@cetc.test', 'student2@cetc.test', 'student3@cetc.test']],
    ['BSCS', 1, ['student4@cetc.test', 'student5@cetc.test']],
  ];
  for (const [program, year, emails] of studentsBySection) {
    for (const key of ['cur', 'past'] as const) {
      for (const [k, c] of Object.entries(classIds)) {
        const [, p, y] = k.split(':');
        if (c.semester === key && p === program && Number(y) === year) {
          for (const email of emails) {
            const sid = uid(email);
            if (!sid) continue;
            await sql`insert into enrollments (student_id, section_subject_id)
              values (${sid}, ${c.id}) on conflict do nothing`;
            c.students.push(sid);
          }
        }
      }
    }
  }

  console.log('— historical evaluations (past semester, incl. Taglish comments + sentiment)');
  const qids = await sql`select id from questions where active order by sort_order`;
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
  for (const c of Object.values(classIds)) {
    if (c.semester !== 'past') continue;
    for (const studentId of c.students) {
      const [comment, label] = COMMENTS[i % COMMENTS.length];
      const score = label === 'positive' ? 0.91 : label === 'negative' ? 0.87 : 0.62;
      const evals = await sql`insert into evaluations
        (enrollment_id, student_id, section_subject_id, semester_id, anonymous, comment, sentiment_label, sentiment_score, signature_points, submitted_at)
        select en.id, en.student_id, en.section_subject_id, ${past}, ${i % 3 !== 0}, ${comment}, ${label}, ${score}, ${sig}::jsonb, now() - ${80 - i} * interval '1 day'
        from enrollments en where en.student_id = ${studentId} and en.section_subject_id = ${c.id}
        on conflict do nothing returning id`;
      if (evals[0]) {
        for (const q of qids) {
          const rating = 3 + ((i + q.id.charCodeAt(0)) % 3); // 3..5 deterministic-ish
          await sql`insert into evaluation_answers (evaluation_id, question_id, rating)
            values (${evals[0].id}, ${q.id}, ${rating}) on conflict do nothing`;
        }
      }
      i++;
    }
  }

  console.log('\nDemo accounts (password: eval1234):');
  for (const u of DEMO_USERS) console.log(`  ${u.role.padEnd(8)} ${u.email} — ${u.full_name}`);
}

async function main() {
  await seedReference();
  await seedDemo();
  await sql.end();
  console.log('\nSeed complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
