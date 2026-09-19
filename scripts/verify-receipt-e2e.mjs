// one-off: end-to-end receipt verification (page HTML -> JWS -> JWKS verify)
const id = process.argv[2];
const base = 'http://localhost:3000';

const html = await (await fetch(`${base}/verify/${id}`)).text();
const m = html.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
if (!m) {
  console.log('FAIL: no JWS found in page HTML');
  process.exit(1);
}
console.log('JWS found:', m[0].slice(0, 40) + '...');

const jwks = await (await fetch(`${base}/.well-known/receipt-jwks.json`)).json();
const { jwtVerify, createLocalJWKSet } = await import('jose');
const set = createLocalJWKSet(jwks);
const { payload, protectedHeader } = await jwtVerify(m[0], set, { issuer: 'cetc-portal' });
console.log('verified. alg:', protectedHeader.alg, 'kid:', protectedHeader.kid);
console.log('claims:', JSON.stringify(payload));
console.log(payload.evaluation_id === id ? 'PASS: receipt verifies offline against public JWKS' : 'FAIL: id mismatch');