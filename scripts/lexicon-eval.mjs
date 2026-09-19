/**
 * Lexicon accuracy harness (decision 1's measured gate).
 *
 * Give it hand-labeled comments and it prints accuracy + confusion counts.
 * Input: JSONL or CSV of {text, label} where label is
 * positive | neutral | negative - pulled from REAL paper forms, not invented.
 *
 *   node scripts/lexicon-eval.mjs path/to/labeled.jsonl
 *   node scripts/lexicon-eval.mjs path/to/labeled.csv
 */
import { readFileSync } from 'node:fs';

const LABELS = new Set(['positive', 'neutral', 'negative']);

function parse(file) {
  const raw = readFileSync(file, 'utf8').trim();
  const rows = [];
  if (raw.startsWith('{') || raw.startsWith('[')) {
    for (const line of raw.split('\n')) {
      const l = line.trim();
      if (!l) continue;
      const o = JSON.parse(l);
      rows.push({ text: String(o.text ?? o.comment ?? ''), label: String(o.label) });
    }
  } else {
    for (const line of raw.split('\n').slice(1)) {
      const i = line.lastIndexOf(',');
      if (i < 0) continue;
      rows.push({
        text: line.slice(0, i).replace(/^"|"$/g, '').replace(/""/g, '"'),
        label: line.slice(i + 1).trim(),
      });
    }
  }
  return rows.filter((r) => LABELS.has(r.label) && r.text.length > 0);
}

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/lexicon-eval.mjs <labeled.jsonl|labeled.csv>');
  process.exit(1);
}

const { classifyComment } = await import('../src/lib/sentiment.ts');

const rows = parse(file);
let correct = 0;
let correctNonAbstain = 0;
let abstained = 0;
const confusion = {};

for (const r of rows) {
  const out = await classifyComment(r.text);
  // abstain is stored as neutral by the app (submit action: `?? 'neutral'`),
  // so score it that way and still report the abstain count separately
  const got = out?.label ?? 'neutral';
  if (!out) abstained++;
  else if (got === r.label) correctNonAbstain++;
  const key = `${r.label} -> ${got}${out ? '' : ' (abstain)'}`;
  confusion[key] = (confusion[key] ?? 0) + 1;
  if (got === r.label) correct++;
}

console.log(`labeled comments: ${rows.length}`);
console.log(`abstained:        ${abstained}`);
console.log(`accuracy:         ${rows.length ? ((correct / rows.length) * 100).toFixed(1) : '0.0'}%`);
const scored = rows.length - abstained;
if (scored > 0) {
  console.log(`accuracy (scored only, excl. abstain): ${((correctNonAbstain / scored) * 100).toFixed(1)}%`);
}
console.log('\nconfusion:');
for (const [k, v] of Object.entries(confusion).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(28)} ${v}`);
}