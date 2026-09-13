/**
 * Applies every .sql file in supabase/migrations in filename order.
 * Tracks applied files in the _migrations table. Run: npm run db:apply
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing (put it in .env.local — Supabase pooler, port 6543)');
  process.exit(1);
}
if (!existsSync('supabase/migrations')) {
  console.error('supabase/migrations not found — run `npm run db:generate` first');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'prefer' });

async function main() {
  await sql`create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`;
  const files = readdirSync('supabase/migrations')
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const done = await sql`select 1 from _migrations where name = ${file}`;
    if (done.length) {
      console.log('skip  ', file);
      continue;
    }
    const content = readFileSync(path.join('supabase/migrations', file), 'utf8');
    if (content.includes('--> statement-breakpoint')) {
      // drizzle-kit generated: one statement per chunk
      for (const stmt of content.split('--> statement-breakpoint')) {
        const s = stmt.trim();
        if (s) await sql.unsafe(s);
      }
    } else {
      // hand-written SQL (functions with $$ bodies): simple protocol
      // allows multiple statements in one call
      await sql.unsafe(content).simple();
    }
    await sql`insert into _migrations (name) values (${file})`;
    console.log('apply ', file);
  }
  await sql.end();
  console.log('done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
