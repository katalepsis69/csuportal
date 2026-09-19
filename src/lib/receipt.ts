/**
 * Tamper-evident submission receipts.
 *
 * A receipt is an Ed25519 (JWS) signature over the stored evaluation's
 * identity fields. The DB is the source of truth; the signature proves the
 * receipt came from this server and was not altered. Anyone can verify it
 * against the public key at /.well-known/receipt-jwks.json - no shared secret.
 *
 * Key: RECEIPT_SIGNING_KEY in .env.local (base64 PKCS8 Ed25519 private key).
 * Missing key => receipts degrade to unsigned hash display (never blocks submit).
 */
import { SignJWT, importPKCS8, exportJWK, type JWK } from 'jose';

export type ReceiptClaims = {
  evaluation_id: string;
  payload_hash: string | null;
  section_subject_id: string;
  semester_id: string;
};

const ALG = 'EdDSA';

let privateKeyPromise: Promise<CryptoKey | null> | null = null;

function loadKey(): Promise<CryptoKey | null> {
  if (!privateKeyPromise) {
    const raw = process.env.RECEIPT_SIGNING_KEY;
    if (!raw) {
      privateKeyPromise = Promise.resolve(null);
    } else {
      // accept raw base64 PKCS8 (npm run db:key output) or a full PEM
      const pem = raw.startsWith('-----')
        ? raw
        : `-----BEGIN PRIVATE KEY-----\n${raw}\n-----END PRIVATE KEY-----`;
      privateKeyPromise = importPKCS8(pem, ALG, { extractable: true }).catch(() => null);
    }
  }
  return privateKeyPromise;
}

/** Signs a receipt. Returns null when no signing key is configured. */
export async function signReceipt(claims: ReceiptClaims): Promise<string | null> {
  const key = await loadKey();
  if (!key) return null;
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: ALG, typ: 'JWT', kid: 'cetc-receipt-v1' })
    .setIssuer('cetc-portal')
    .setIssuedAt()
    .sign(key);
}

/** Public JWKS for offline verification (empty set when no key configured). */
export async function receiptJwks(): Promise<{ keys: JWK[] }> {
  const key = await loadKey();
  if (!key) return { keys: [] };
  const jwk = await exportJWK(key);
  // strip private material - this endpoint is public
  const publicJwk: JWK = { ...jwk };
  delete (publicJwk as Record<string, unknown>).d;
  return { keys: [{ ...publicJwk, use: 'sig', alg: ALG, kid: 'cetc-receipt-v1' }] };
}