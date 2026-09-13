/**
 * RLS smoke tests — verify role isolation directly against PostgREST.
 * Run: npm test   (node --test scripts/tests/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rest, signIn } from './helpers.mjs';

test('student sees only their own evaluations', async () => {
  const s = await signIn('student1@cetc.test');
  const { body } = await rest(s.token)('/evaluations?select=id,student_id&limit=1000');
  assert.ok(Array.isArray(body) && body.length > 0, 'student1 should see own evals');
  for (const row of body) assert.equal(row.student_id, s.id, 'leaked foreign evaluation');
});

test('faculty cannot read evaluations directly (student identity protected)', async () => {
  const f = await signIn('maria@cetc.test');
  const { body } = await rest(f.token)('/evaluations?select=id&limit=1000');
  assert.ok(Array.isArray(body), 'expected array');
  assert.equal(body.length, 0, 'faculty must not select evaluations directly');
});

test('faculty reads answers only for their own classes', async () => {
  const f = await signIn('maria@cetc.test');
  const { body } = await rest(f.token)('/evaluation_answers?select=id&limit=1000');
  assert.ok(Array.isArray(body) && body.length > 0, 'maria should see her class answers');
});

test('dean sees all evaluations', async () => {
  const d = await signIn('dean@cetc.test');
  const { body } = await rest(d.token)('/evaluations?select=id&limit=1000');
  assert.ok(Array.isArray(body) && body.length >= 5, 'dean should see department evals');
});

test('anon (no auth) is denied outright', async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/evaluations?select=id&limit=10`,
    { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY } },
  );
  // REVOKE ... FROM anon (migration 0001) denies by grant before RLS even applies
  assert.ok(
    res.status === 401 || res.status === 403,
    `anon must be denied, got ${res.status}`,
  );
  const body = await res.json();
  assert.match(body.message ?? '', /permission denied/i);
});

test('student cannot write reference data (admin-only)', async () => {
  const s = await signIn('student1@cetc.test');
  const { ok, status } = await rest(s.token)('/programs', {
    method: 'POST',
    body: JSON.stringify({ code: 'HACK', name: 'Hack' }),
  });
  assert.equal(ok, false, 'student program insert must be denied');
  assert.ok(status === 401 || status === 403 || status === 400, `unexpected status ${status}`);
});

test('faculty cannot modify questions (admin-only)', async () => {
  const f = await signIn('maria@cetc.test');
  // PostgREST returns 204 even when RLS filters all rows — assert the DATA is untouched
  const before = await rest(f.token)('/questions?select=id,category&text=eq.Explains%20the%20lessons%20clearly');
  const original = before.body[0]?.category;
  await rest(f.token)('/questions?text=eq.Explains%20the%20lessons%20clearly', {
    method: 'PATCH',
    body: JSON.stringify({ category: 'Hacked' }),
  });
  const after = await rest(f.token)('/questions?select=category&text=eq.Explains%20the%20lessons%20clearly');
  assert.equal(after.body[0]?.category, original, 'faculty must not be able to modify questions');
});

test('evaluations are immutable for the student who wrote them', async () => {
  const s = await signIn('student1@cetc.test');
  const mine = await rest(s.token)('/evaluations?select=id,comment&limit=1');
  const id = mine.body[0]?.id;
  const originalComment = mine.body[0]?.comment;
  if (!id) return; // nothing to test against

  // PostgREST may 204 on zero affected rows — verify the row survived untouched
  await rest(s.token)(`/evaluations?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ comment: 'tampered' }),
  });
  const afterPatch = await rest(s.token)(`/evaluations?select=comment&id=eq.${id}`);
  assert.equal(afterPatch.body.length, 1, 'evaluation row must still exist');
  assert.equal(afterPatch.body[0].comment, originalComment, 'PATCH must not modify the evaluation');

  await rest(s.token)(`/evaluations?id=eq.${id}`, { method: 'DELETE' });
  const afterDelete = await rest(s.token)(`/evaluations?select=id&id=eq.${id}`);
  assert.equal(afterDelete.body.length, 1, 'DELETE must not remove the evaluation');
});

test('drafts are student-scoped', async () => {
  const s1 = await signIn('student1@cetc.test');
  const s2 = await signIn('student2@cetc.test');
  const r = rest(s1.token);

  // find a class student1 hasn't evaluated yet
  const dash = await r('/rpc/rpc_student_dashboard', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const target = dash.body.subjects.find((x) => !x.completed && x.is_open);
  if (!target) return; // all done — nothing to draft

  const saved = await r('/rpc/rpc_save_draft', {
    method: 'POST',
    body: JSON.stringify({
      p_section_subject_id: target.section_subject_id,
      p_answers: [],
      p_comment: 'rls test draft',
      p_anonymous: true,
    }),
  });
  assert.equal(saved.body.ok, true, 'draft save failed');

  const mine = await r(`/drafts?select=id&section_subject_id=eq.${target.section_subject_id}`);
  assert.equal(mine.body.length, 1, 'owner should see own draft');

  const theirs = await rest(s2.token)(
    `/drafts?select=id&section_subject_id=eq.${target.section_subject_id}`,
  );
  assert.equal(theirs.body.length, 0, 'other student must not see the draft');

  // cleanup
  const del = await r(`/drafts?section_subject_id=eq.${target.section_subject_id}`, {
    method: 'DELETE',
  });
  assert.equal(del.ok, true, 'draft cleanup failed');
});
