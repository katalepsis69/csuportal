/**
 * Sentiment via a ~200-word Tagalog/English lexicon - deterministic, zero
 * network cost, instant. Runs client-side (live tag while typing) AND
 * server-side (authoritative result at submit). Replaces the 136MB
 * transformers.js browser model.
 *
 * ponytail: lexicon, not a model. Upgrade path: hand-label 50-100 real
 * comments, measure accuracy; swap this module for a model only if it misses
 * the bar - the exported interface is the contract, callers never change.
 */

export type SentimentResult = { label: 'positive' | 'neutral' | 'negative'; score: number };

const POSITIVE = new Set(
  `magaling mahusay husay galing salamat mabuti maayos malinaw tapat masipag matiyaga
   maasahan mabait maganda angkop epektibo mapagkumbaba mauunawaan mapagmalasakit
   masinop reliable good great excellent awesome amazing outstanding superb helpful
   approachable supportive dedicated passionate knowledgeable skilled competent
   thorough organized prepared responsive understanding considerate fair encouraging
   inspiring engaging effective efficient punctual consistent thoughtful generous
   humble hardworking professional articulate creative adaptive patient kind caring
   friendly respectful motivating insightful enjoy enjoyed appreciate appreciated
   grateful clear concise accessible accommodating flexible impressive commendable
   admirable wonderful fantastic brilliant thanks thank`
    .split(/\s+/)
    .filter(Boolean),
);

const NEGATIVE = new Set(
  `hirap nahihirapan magulo gulo malabo kulang maingay ingay nakakabagot nakakaantok
   nakakainis bwisit bastos mahirap bagal unreliable confusing unclear disorganized
   unprepared rude unfair biased arrogant dismissive impatient negligent lazy
   incompetent unresponsive unavailable absent tardy inconsistent harsh inconsiderate
   unhelpful useless boring dull monotone hostile condescending slow overwhelming
   punishing favoritism favorites unreasonable disrespectful insulting demoralizing
   intimidating terror late missing poor terrible awful bad worse worst hate hated
   dislike disappointed disappointing frustrated frustrating anger angry annoying
   annoyed strict vague mumbled rushed crammed outdated irresponsible unprofessional
   chaotic messy noisy unkind mean sarcastic`
    .split(/\s+/)
    .filter(Boolean),
);

// negators flip the polarity of the next sentiment-bearing word within window
const NEGATORS = new Set(
  `hindi hinde di wala walang wag huwag ayaw no not never none nothing without`
    .split(/\s+/)
    .filter(Boolean),
);

const WORD = /[a-z0-9][a-z0-9'-]*/g;

// multi-word Tagalog/Taglish phrases the token scan would otherwise miss
// (the accuracy harness surfaced these: "walang kwenta" scored as neutral)
const PHRASES: [string, number][] = [
  ['walang kwenta', -1],
  ['walang silbi', -1],
  ['walang pakialam', -1],
  ['walang malasakit', -1],
  ['hindi maayos', -1],
  ['hindi malinaw', -1],
  ['hindi magaling', -1],
  ['hindi mabait', -1],
  ['sobrang hirap', -1],
  ['hindi nagtuturo', -1],
  ['laging late', -1],
  ['hindi maintindihan', -1],
  ['sobrang bilis', -1],
  ['mabilis magsalita', -1],
  ['hindi nageexplain', -1],
  ['walang turo', -1],
  ['madaling maintindihan', 1],
  ['sobrang bait', 1],
  ['napakabait', 1],
  ['magaling magturo', 1],
  ['maayos magturo', 1],
  ['very good', 1],
  ['no comment', 0],
];

export async function classifyComment(text: string): Promise<SentimentResult | null> {
  const lowered = text.toLowerCase();
  let phrasePos = 0;
  let phraseNeg = 0;
  let haystack = lowered;
  for (const [phrase, polarity] of PHRASES) {
    if (!haystack.includes(phrase)) continue;
    if (polarity > 0) phrasePos++;
    else if (polarity < 0) phraseNeg++;
    haystack = haystack.split(phrase).join(' '); // consumed - don't double count
  }

  const tokens = (haystack.match(WORD) ?? []).map((t) => t.replace(/^'+|'+$/g, ''));
  if (text.trim().length < 3 || (tokens.length === 0 && phrasePos + phraseNeg === 0)) return null;

  let pos = phrasePos;
  let neg = phraseNeg;
  let negation = 0;
  for (const t of tokens) {
    if (NEGATORS.has(t)) {
      negation = 3; // flips the next sentiment word within 3 tokens
      continue;
    }
    const pol = POSITIVE.has(t) ? 1 : NEGATIVE.has(t) ? -1 : 0;
    if (pol === 0) {
      if (negation > 0) negation--;
      continue;
    }
    if (negation > 0) {
      negation--;
      neg++;
    } else if (pol > 0) {
      pos++;
    } else {
      neg++;
    }
  }

  const net = pos - neg;
  if (net === 0 && pos === 0 && neg === 0) return null;
  const label = net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral';
  // pseudo-confidence: 0.5 + margin, capped - a lexicon has no real confidence
  const score = Math.round(Math.min(0.9, 0.5 + 0.1 * Math.min(4, Math.abs(net))) * 1000) / 1000;
  return { label, score };
}
