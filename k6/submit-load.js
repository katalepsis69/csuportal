/**
 * Load test for the §7 gate: N concurrent students signing in and submitting
 * evaluations through the real path (auth → PostgREST → Supavisor → RPC).
 * Prereq: node scripts/loadtest-setup.mjs [N]  (N ≥ VUS)
 * Run:    k6 run -e VUS=500 k6/submit-load.js
 */
import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

const cfg = JSON.parse(open('./loadtest-env.json'));
const BASE = cfg.url;
const ANON = cfg.anon;
const VUS = Number(__ENV.VUS || 20);

export const options = {
  scenarios: {
    deadline_burst: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: VUS },
        { duration: '1m', target: VUS },
        { duration: '15s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

const students = new SharedArray('students', () => cfg.students);

// one login per VU (real students sign in once, then submit) — avoids
// tripping Supabase's per-IP auth rate limit, which the first smoke run
// measured at ~60 logins/minute per IP
let vuToken = null;

export default function () {
  const s = students[(__VU - 1) % students.length];
  const cls = cfg.classIds[(__VU - 1) % cfg.classIds.length];

  if (!vuToken) {
    // pre-minted token from setup (tests pure submit concurrency); fall back
    // to a live login when no token is present (small runs)
    if (s.token) {
      vuToken = s.token;
    } else {
      const login = http.post(
        `${BASE}/auth/v1/token?grant_type=password`,
        JSON.stringify({ email: s.email, password: s.password }),
        { headers: { apikey: ANON, 'Content-Type': 'application/json' } },
      );
      check(login, { 'login 200': (r) => r.status === 200 });
      if (login.status !== 200) return;
      vuToken = login.json('access_token');
    }
  }

  // submit evaluation via RPC (subsequent iterations → already_submitted, still valid)
  const answers = cfg.questions.map((q, i) => ({ question_id: q, rating: 3 + (i % 3) }));
  const submit = http.post(
    `${BASE}/rest/v1/rpc/rpc_submit_evaluation`,
    JSON.stringify({
      p_section_subject_id: cls,
      p_anonymous: true,
      p_comment: 'load test',
      p_sentiment: 'neutral',
      p_sentiment_score: 0,
      p_signature: [[{ x: 0.1, y: 0.5 }]],
      p_answers: answers,
      p_payload_hash: 'loadtest',
    }),
    {
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${vuToken}`,
        'Content-Type': 'application/json',
      },
    },
  );
  check(submit, {
    'submit ok': (r) =>
      r.status === 200 && (r.json('ok') === true || r.json('error') === 'already_submitted'),
  });
}
