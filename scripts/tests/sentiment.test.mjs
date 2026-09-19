/**
 * Runnable check for the lexicon (ponytail: one test, no framework).
 * Run: npm test  (node --test picks up scripts/tests/*.test.mjs)
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { classifyComment } = await import('../../src/lib/sentiment.ts');

test('lexicon: obvious English', async () => {
  assert.equal((await classifyComment('The instructor was very helpful and clear'))?.label, 'positive');
  assert.equal((await classifyComment('Classes were disorganized and the teacher was rude'))?.label, 'negative');
});

test('lexicon: Tagalog + Taglish', async () => {
  assert.equal((await classifyComment('Magaling magturo si sir, malinaw lahat'))?.label, 'positive');
  assert.equal((await classifyComment('Sobrang hirap ng exam at unfair ang grading'))?.label, 'negative');
});

test('lexicon: negation flips polarity', async () => {
  assert.equal((await classifyComment('Hindi magaling magturo si sir'))?.label, 'negative');
  assert.equal((await classifyComment('Hindi mabait ang instructor'))?.label, 'negative');
});

test('lexicon: multi-word phrases', async () => {
  assert.equal((await classifyComment('Walang kwenta ang mga handout'))?.label, 'negative');
});

test('lexicon: abstains on no signal', async () => {
  assert.equal(await classifyComment('ok'), null);
  assert.equal(await classifyComment(''), null);
});
