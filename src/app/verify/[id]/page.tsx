import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import QRCode from 'qrcode';
import { signReceipt } from '@/lib/receipt';
import { manilaDateTime } from '@/lib/time';

export const dynamic = 'force-dynamic';

type ReceiptRow = {
  id: string;
  payload_hash: string | null;
  submitted_at: string | null;
  section_subject_id: string;
  semester_id: string;
};

/**
 * Public receipt verification. Reads through rpc_receipt_for (0007), a
 * SECURITY DEFINER function that returns exactly the five non-identifying
 * fields for exactly one id, via the anonymous client. The public path holds
 * no service-role credential, and the function signature - not a select
 * string - is the anonymity boundary.
 */
export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .rpc('rpc_receipt_for', { p_evaluation_id: id })
    .maybeSingle<ReceiptRow>();

  if (!data) notFound();

  const receipt = await signReceipt({
    evaluation_id: data.id,
    payload_hash: data.payload_hash,
    section_subject_id: data.section_subject_id,
    semester_id: data.semester_id,
  });

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const verifyUrl = `${base}/verify/${data.id}`;
  const qrSvg = await QRCode.toString(verifyUrl, { type: 'svg', margin: 1, width: 160 });

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          CSU CETC Portal
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Evaluation receipt</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This receipt is issued from the stored evaluation record and signed with the
          portal&apos;s Ed25519 key. It proves these fields existed in the portal&apos;s record
          when it was signed; it does not prove the record was unchanged afterwards. It contains
          no student identity and no comment text.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Client integrity hash
          </p>
          <p className="mt-1 font-mono text-sm break-all">{data.payload_hash ?? 'not recorded'}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Computed by the submitting browser over the submitted payload and recorded as-is.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Evaluation
          </p>
          <p className="mt-1 text-sm break-all">{data.id}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Submitted
          </p>
          <p className="mt-1 text-sm tabular-nums">
            {data.submitted_at ? manilaDateTime(data.submitted_at) : '-'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Signature (JWS, Ed25519)
          </p>
          <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
            {receipt ?? 'signing key not configured'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="h-[160px] w-[160px] shrink-0" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div className="space-y-2 text-xs text-muted-foreground text-center sm:text-left">
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
