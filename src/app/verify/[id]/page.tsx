import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { signReceipt } from '@/lib/receipt';

export const dynamic = 'force-dynamic';

type Receipt = {
  evaluation_id: string;
  payload_hash: string | null;
  submitted_at: string | null;
  section_subject_id: string;
  semester_id: string;
};

/**
 * Public receipt verification. Reads through rpc_receipt_for (anon role,
 * SECURITY DEFINER) which returns only non-identifying columns — the service
 * role never touches this route. No student identity, no comment text: those
 * columns are not in the function's output.
 */
export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data } = await supabase.rpc('rpc_receipt_for', { p_evaluation_id: id });
  const row = data as Receipt | null;
  if (!row?.evaluation_id) notFound();

  const receipt = await signReceipt({
    evaluation_id: row.evaluation_id,
    payload_hash: row.payload_hash,
    section_subject_id: row.section_subject_id,
    semester_id: row.semester_id,
  });

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? `https://${process.env.VERCEL_URL ?? 'localhost:3000'}`;
  const verifyUrl = `${origin}/verify/${row.evaluation_id}`;
  const qrSvg = await QRCode.toString(verifyUrl, { type: 'svg', margin: 1, width: 160 });

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6 sm:p-10">
      <div>
        <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          CSU CETC Portal
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Evaluation receipt</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This receipt is issued from the stored evaluation record and signed with the
          portal&apos;s Ed25519 key. It contains no student identity and no comment text.
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Submission hash
          </p>
          <p className="mt-1 font-mono text-sm break-all">{row.payload_hash ?? 'not recorded'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Evaluation
          </p>
          <p className="mt-1 text-sm break-all">{row.evaluation_id}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Submitted
          </p>
          <p className="mt-1 text-sm tabular-nums">
            {row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '-'}
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Signature (JWS, Ed25519)
          </p>
          <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
            {receipt ?? 'signing key not configured'}
          </p>
        </div>
        <div className="flex items-start gap-6">
          <div className="h-[160px] w-[160px]" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Scan to open this receipt.</p>
            <p>
              Verify offline with the public key at{' '}
              <span className="font-mono">/.well-known/receipt-jwks.json</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}