/**
 * Generates an Ed25519 receipt-signing key and appends it to .env.local.
 * Run once per environment: node scripts/gen-receipt-key.mjs
 * (production: generate a separate key, store it as a secret, never commit it)
 */
import { generateKeyPairSync } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const envPath = '.env.local';
const existing = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
if (/^RECEIPT_SIGNING_KEY=/m.test(existing)) {
  console.log('RECEIPT_SIGNING_KEY already present - leaving it alone');
  process.exit(0);
}

const { privateKey } = generateKeyPairSync('ed25519');
const pkcs8 = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
appendFileSync(envPath, `${existing.endsWith('\n') || !existing ? '' : '\n'}RECEIPT_SIGNING_KEY=${pkcs8}\n`, 'utf8');
console.log('RECEIPT_SIGNING_KEY written to .env.local');
