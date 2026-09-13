/**
 * Applies supabase/migrations/*.sql through the Supabase Management API
 * (POST /v1/projects/{ref}/database/query) — no DB password needed.
 * Tracks applied files in the _migrations table. Run: node scripts/apply-mgmt-api.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

for (const line of existsSync('.env.local') ? readFileSync('.env.local', 'utf8').split('\n') : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;
if (!TOKEN || !REF) {
  console.error('SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF missing in .env.local');
  process.exit(1);
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 500)}`);
  return body;
}

const files = readdirSync('supabase/migrations')
  .filter((f) => f.endsWith('.sql'))
  .sort();

await query('create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())');

for (const file of files) {
  const done = JSON.parse(await query(`select 1 from _migrations where name = '${file}'`));
  if (done.length) {
    console.log('skip  ', file);
    continue;
  }
  const content = readFileSync(path.join('supabase/migrations', file), 'utf8')
    .split('--> statement-breakpoint')
    .join('\n');
  try {
    await query(content);
    await query(`insert into _migrations (name) values ('${file}')`);
    console.log('apply ', file);
  } catch (e) {
    console.error(`FAILED ${file}:`, e.message);
    process.exit(1);
  }
}
console.log('done.');
