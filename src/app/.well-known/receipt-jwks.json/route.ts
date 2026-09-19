import { NextResponse } from 'next/server';
import { receiptJwks } from '@/lib/receipt';

export const dynamic = 'force-dynamic';

/** Public key for verifying submission receipts offline. */
export async function GET() {
  return NextResponse.json(await receiptJwks(), {
    headers: { 'cache-control': 'public, max-age=3600' },
  });
}