// tools/check-bpe.mjs
//
// Room 07 claims that what it plays back is the real thing: the encoder's own
// merge sequence, in the order the table learned it. That is a checkable claim,
// so this checks it.
//
// Three assertions, over every pre-token piece in this repository's own prose —
// the corpus, the notes, the README, and the room's examples:
//
//   1. A finished merge plan lands on exactly the tokens encode() returns.
//   2. Merge entry numbers within a piece never decrease. This is what lets the
//      room show one timeline across several pieces instead of one per piece:
//      if a piece's own merges are already in ascending order, sorting all the
//      pieces together by entry number reorders nothing within any of them.
//   3. The five examples on the wall make the number of merges the wall says.
//
//   node tools/check-bpe.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { load, encode, pretokens } from '../lib/tokenizer.js';
import { mergePlan, stateAt } from '../lib/bpe.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = (f) => readFileSync(join(root, f), 'utf8');

// What the wall text says, in the form it can be checked in. If a number here
// stops matching, either the room is wrong or the vendored table moved; both
// are worth failing over.
const EXAMPLES = [
  { text: 'strawberry strawberry', pieces: 2, merges: 17, tokens: 4 },
  { text: 'antidisestablishmentarianism', pieces: 1, merges: 22, tokens: 6 },
  { text: 'hot dog', pieces: 2, merges: 5, tokens: 2 },
  { text: '🍓', pieces: 1, merges: 1, tokens: 3 },
  { text: 'Anaphora', pieces: 1, merges: 5, tokens: 3 },
];

await load();

let failures = 0;
const fail = (...why) => {
  failures++;
  console.error('  FAIL', ...why);
};

// --- 1 and 2: over every piece of the museum's own writing --------------------

const prose = ['assets/corpus.txt', 'NOTES.md', 'README.md', 'EXHIBITS.md']
  .map(read)
  .join('\n');

let checked = 0;
let ties = 0;

for (const piece of pretokens(prose)) {
  const plan = mergePlan(piece.text);
  checked++;

  const mine = plan.final.flat().map((p) => p.entry);
  const theirs = encode(piece.text);
  if (mine.join(',') !== theirs.join(',')) {
    fail('replay differs from encode() on', JSON.stringify(piece.text), mine, theirs);
  }

  for (let i = 1; i < plan.steps.length; i++) {
    const drop = plan.steps[i].entry - plan.steps[i - 1].entry;
    if (drop < 0) fail('entry numbers went backwards in', JSON.stringify(piece.text));
    if (drop === 0) ties++;
  }
}

console.log(`  ${checked.toLocaleString('en')} pre-token pieces replayed`);
console.log(`  ${ties} ties (one entry firing at more than one position)`);

// --- 3: the examples on the wall ---------------------------------------------

for (const want of EXAMPLES) {
  const plan = mergePlan(want.text);
  const final = plan.final.flat();
  const label = JSON.stringify(want.text);

  if (plan.pieces.length !== want.pieces)
    fail(label, `is ${plan.pieces.length} pre-tokens, wall says ${want.pieces}`);
  if (plan.steps.length !== want.merges)
    fail(label, `takes ${plan.steps.length} merges, wall says ${want.merges}`);
  if (final.length !== want.tokens)
    fail(label, `ends on ${final.length} tokens, wall says ${want.tokens}`);

  // Scrubbing must be a pure function of the step number: the last frame of a
  // walk forward has to equal the state asked for directly.
  const walked = stateAt(plan, plan.steps.length).pieces.flat();
  if (walked.map((p) => p.entry).join(',') !== final.map((p) => p.entry).join(','))
    fail(label, 'stateAt() at the last step disagrees with the finished plan');

  const shape = final.map((p) => (p.whole ? p.text : p.hex)).join('·');
  console.log(
    `  ${label.padEnd(32)} ${String(plan.steps.length).padStart(2)} merges  ->  ${shape}`
  );
}

// --- and the claim the room makes about the two missing entries ---------------

const berry = mergePlan('strawberry strawberry');
const stranded = berry.refusals.filter((r) => r.piece === 0).map((r) => r.text);
if (stranded.join(',') !== 'straw,awberry') {
  fail('the bare "strawberry" halts on', stranded, '— the wall text names straw and awberry');
}
if (berry.refusals.some((r) => r.piece === 1)) {
  fail('the spaced " strawberry" should merge all the way and refuse nothing');
}
console.log(`  bare "strawberry" halts for want of: ${stranded.join(', ')}`);

if (failures) {
  console.error(`\n${failures} check${failures === 1 ? '' : 's'} failed.`);
  process.exit(1);
}
console.log('\nRoom 07 plays back what the encoder does.');
