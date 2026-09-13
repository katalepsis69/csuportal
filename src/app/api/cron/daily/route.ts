import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Daily Vercel Cron (free: once/day, ±59 min precision).
 * 1. Any API request counts as activity — keeps the Supabase free project
 *    from hitting the 1-week inactivity pause.
 * 2. Auto open/close evaluation periods based on opens_at / closes_at.
 * Uses the service role key (server-only env var) — no DB password needed.
 * Manual open/close is still available to the admin.
 */
export async function GET(request: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey);
  const nowIso = new Date().toISOString();

  // keep-alive
  await supabase.from('semesters').select('id', { count: 'exact', head: true });

  const { error: closeErr } = await supabase
    .from('semesters')
    .update({ is_open: false })
    .eq('is_open', true)
    .lt('closes_at', nowIso);

  const { error: openErr } = await supabase
    .from('semesters')
    .update({ is_open: true })
    .eq('is_open', false)
    .lte('opens_at', nowIso)
    .gt('closes_at', nowIso);

  if (closeErr || openErr) {
    return NextResponse.json({ ok: false, closeErr: closeErr?.message, openErr: openErr?.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, at: nowIso });
}
