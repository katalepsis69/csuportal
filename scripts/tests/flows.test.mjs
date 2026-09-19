/**
 * End-to-end flow tests: draft → submit (with hash) → dedupe → persistence.
 * Uses a throwaway student so the suite is repeatable and cleans up after
 * itself. Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  admin,
  cleanupTestStudent,
  createTestStudent,
  pickOpenClass,
  rest,
  signIn,
} from './helpers.mjs';

test('full evaluation flow: draft, submit with hash, dedupe, persistence', async () => {
  // ── setup: throwaway student enrolled in one open class ──
  const student = await createTestStudent();
  const classId = await pickOpenClass();
  try {
    const { error: enrollErr } = await admin
      .from('enrollments')
      .insert({ student_id: student.id, section_subject_id: classId });
    assert.ok(!enrollErr, `enroll failed: ${enrollErr?.message}`);

    const { data: questions } = await admin
      .from('questions')
      .select('id')
      .eq('active', true)
      .order('sort_order');
    const answers = (questions ?? []).map((q, i) => ({
      question_id: q.id,
      rating: 3 + (i % 3),
    }));

    const s = await signIn(student.email, student.password);
    const r = rest(s.token);

    // ── 1. not-enrolled guard: a class the student is NOT in ──
    const { data: otherClass } = await admin
      .from('section_subjects')
      .select('id, semesters!inner(is_current, is_open)')
      .eq('semesters.is_current', true)
      .eq('semesters.is_open', true)
      .neq('id', classId)
      .limit(1);
    if (otherClass?.length) {
      const nope = await r('/rpc/rpc_save_draft', {
        method: 'POST',
        body: JSON.stringify({
          p_section_subject_id: otherClass[0].id,
          p_answers: [],
          p_comment: '',
          p_anonymous: true,
        }),
      });
      assert.equal(nope.body.error, 'not_enrolled', 'draft on foreign class must be rejected');
    }

    // ── 2. draft save + read-back ──
    const draft = await r('/rpc/rpc_save_draft', {
      method: 'POST',
      body: JSON.stringify({
        p_section_subject_id: classId,
        p_answers: answers.slice(0, 2),
        p_comment: 'flow test draft comment',
        p_anonymous: false,
      }),
    });
    assert.equal(draft.body.ok, true, `draft save failed: ${JSON.stringify(draft.body)}`);
    const readBack = await r(`/drafts?select=answers,comment,anonymous&section_subject_id=eq.${classId}`);
    assert.equal(readBack.body.length, 1);
    assert.equal(readBack.body[0].comment, 'flow test draft comment');
    assert.equal(readBack.body[0].answers.length, 2);

    // ── 3. submit with payload hash ──
    const payloadHash = 'f'.repeat(64);
    const submit = await r('/rpc/rpc_submit_evaluation', {
      method: 'POST',
      body: JSON.stringify({
        p_section_subject_id: classId,
        p_anonymous: false,
        p_comment: 'flow test final comment',
        p_sentiment: 'positive',
        p_sentiment_score: 0.88,
        p_signature: [[{ x: 0.1, y: 0.5 }, { x: 0.5, y: 0.2 }]],
        p_answers: answers,
        p_payload_hash: payloadHash,
      }),
    });
    assert.equal(submit.body.ok, true, `submit failed: ${JSON.stringify(submit.body)}`);

    // ── 4. draft cleared by submit ──
    const draftsLeft = await r(`/drafts?select=id&section_subject_id=eq.${classId}`);
    assert.equal(draftsLeft.body.length, 0, 'draft must be deleted on submit');

    // ── 5. duplicate submit rejected ──
    const dup = await r('/rpc/rpc_submit_evaluation', {
      method: 'POST',
      body: JSON.stringify({
        p_section_subject_id: classId,
        p_anonymous: true,
        p_comment: '',
        p_sentiment: 'neutral',
        p_sentiment_score: 0,
        p_signature: [[{ x: 0.1, y: 0.5 }]],
        p_answers: answers,
      }),
    });
    assert.equal(dup.body.error, 'already_submitted');

    // ── 6. persistence: hash, answers, dashboard state ──
    const { data: evalRow } = await admin
      .from('evaluations')
      .select('payload_hash')
      .eq('student_id', student.id)
      .eq('section_subject_id', classId)
      .single();
    assert.equal(evalRow?.payload_hash, payloadHash, 'hash must persist');

    // comment persistence: identity-free table (no student column at all)
    const { data: commentRow } = await admin
      .from('evaluation_comments')
      .select('comment, sentiment_label')
      .eq('evaluation_id', submit.body.evaluation_id)
      .single();
    assert.equal(commentRow?.comment, 'flow test final comment', 'comment must persist');
    assert.equal(commentRow?.sentiment_label, 'positive');

    const { count } = await admin
      .from('evaluation_answers')
      .select('id', { count: 'exact', head: true })
      .eq('evaluation_id', submit.body.evaluation_id);
    assert.equal(count, answers.length, 'all answers must persist');

    const dash = await r('/rpc/rpc_student_dashboard', { method: 'POST', body: JSON.stringify({}) });
    const row = dash.body.subjects.find((x) => x.section_subject_id === classId);
    assert.equal(row?.completed, true, 'dashboard must show the eval as completed');
  } finally {
    await cleanupTestStudent(student.id);
  }
});
