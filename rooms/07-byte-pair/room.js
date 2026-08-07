// Room 07 — Byte-Pair Playback
//
// The merge table applied one pair at a time. Everything drawn here comes out
// of lib/bpe.js, which runs the vendored encoder's own merge loop; the room
// only decides what to put on the wall and when. The scrub bar is the state:
// every frame is rebuilt from a step number rather than accumulated, so going
// backwards is exactly as true as going forwards.

import { cutSigns } from '../../lib/type.js';
import { load, pretokens } from '../../lib/tokenizer.js';
import { mergePlan, stateAt } from '../../lib/bpe.js';

cutSigns();

// Long enough for a phrase, short enough that the ledger stays a list rather
// than a wall. Rounded down to a whole pre-token piece, so no word is cut in
// half and made to merge differently than it would on its own.
const MAX_CHARS = 120;

// Slow enough to watch a single join land, fast enough that seventeen of them
// is not a wait.
const STEP_MS = 340;

const still = matchMedia('(prefers-reduced-motion: reduce)');

const input = document.getElementById('input');
const examplesRow = document.getElementById('examples');
const stage = document.getElementById('stage');
const status = document.getElementById('status');
const capped = document.getElementById('capped');
const caption = document.getElementById('caption');
const announce = document.getElementById('announce');
const playBtn = document.getElementById('play');
const stepBtn = document.getElementById('step');
const scrub = document.getElementById('scrub');
const scrubEnd = document.getElementById('scrub-end');
const ledger = document.getElementById('ledger');
const halt = document.getElementById('halt');
const counts = {
  merges: document.getElementById('n-merges'),
  entry: document.getElementById('n-entry'),
  pieces: document.getElementById('n-pieces'),
};

// Every one of these earns its place by showing something the others don't.
// The first is the room: the same ten letters twice, and only one of them
// makes it all the way down.
const EXAMPLES = [
  ['the same word, twice', 'strawberry strawberry'],
  ['one long word', 'antidisestablishmentarianism'],
  ['a boundary', 'hot dog'],
  ['an emoji', '🍓'],
  ["this museum's own sign", 'Anaphora'],
];

let plan = null;
let at = 0;
let timer = null;

for (const [label, text] of EXAMPLES) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn';
  btn.textContent = label;
  btn.addEventListener('click', () => {
    input.value = text;
    rebuild();
    if (!still.matches) start();
  });
  examplesRow.append(btn);
}

await load();

status.remove();
playBtn.disabled = false;
stepBtn.disabled = false;
scrub.disabled = false;

input.value = EXAMPLES[0][1];
rebuild();
if (!still.matches) start();

input.addEventListener('input', () => {
  // Typing lands on the finished tokens rather than replaying from the bytes on
  // every keystroke, which would be unwatchable. The scrub bar rewinds it.
  rebuild({ to: Infinity });
});

playBtn.addEventListener('click', () => {
  if (timer) return stop();
  if (at >= plan.steps.length) setStep(0);
  start();
});

stepBtn.addEventListener('click', () => {
  stop();
  setStep(at + 1);
  say(spoken());
});

scrub.addEventListener('input', () => {
  stop();
  setStep(Number(scrub.value));
});

scrub.addEventListener('change', () => say(spoken()));

/**
 * Cut the input down to something playable and work out its merge sequence.
 * @param {{ to?: number }} [opts] where to land; defaults to the start
 */
function rebuild({ to = 0 } = {}) {
  stop();

  // Keep whole pre-token pieces only. Truncating mid-word would show that word
  // merging in a way it never actually merges.
  const pieces = pretokens(input.value);
  let text = '';
  let dropped = 0;
  for (const piece of pieces) {
    // Once one piece has been dropped, everything after it goes too — the
    // remainder is no longer a run of text, and drawing it as one would lie
    // about where the boundaries are.
    if (dropped || (text && text.length + piece.text.length > MAX_CHARS)) dropped++;
    else text += piece.text;
  }

  capped.hidden = dropped === 0;
  if (dropped) {
    capped.textContent =
      `Playing back the first ${text.length} characters — ` +
      `${dropped} more piece${dropped === 1 ? '' : 's'} not drawn.`;
  }

  plan = mergePlan(text);
  scrub.max = String(Math.max(1, plan.steps.length));
  scrub.disabled = plan.steps.length === 0;
  scrubEnd.textContent = plan.steps.length ? 'tokens' : 'nothing to merge';
  counts.pieces.textContent = String(plan.pieces.length);

  setStep(Math.min(to, plan.steps.length));
}

function setStep(n) {
  at = Math.max(0, Math.min(n, plan.steps.length));
  scrub.value = String(at);
  render();
}

function start() {
  if (!plan || at >= plan.steps.length) return;
  stop();
  timer = setInterval(() => {
    if (at >= plan.steps.length) {
      stop();
      say(spoken());
      return;
    }
    setStep(at + 1);
  }, STEP_MS);
  playBtn.textContent = 'Pause';
  playBtn.classList.add('is-on');
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
  playBtn.classList.remove('is-on');
  playBtn.textContent = plan && at >= plan.steps.length ? 'Play again' : 'Play';
}

function render() {
  const state = stateAt(plan, at);
  const { pieces, pending } = state;
  const made = at > 0 ? plan.steps[at - 1] : null;

  stage.replaceChildren();
  pieces.forEach((parts, p) => {
    const group = document.createElement('div');
    group.className = 'bp-piece';

    const row = document.createElement('div');
    row.className = 'cells';

    parts.forEach((cell, i) => {
      const el = document.createElement('span');
      el.className = 'cell';
      if (!cell.whole) el.classList.add('is-fragment');
      if (made && made.piece === p && made.at === i) el.classList.add('is-made');
      if (pending && pending.piece === p && (i === pending.at || i === pending.at + 1))
        el.classList.add('is-joining');
      el.textContent = cell.whole ? visible(cell.text) : cell.hex;
      row.append(el);
    });

    group.append(row);
    stage.append(group);
  });

  counts.merges.textContent = `${at} / ${plan.steps.length}`;
  counts.entry.textContent = made ? String(made.entry) : '—';
  counts.entry.classList.toggle('is-live', Boolean(made));

  renderLedger();

  const done = at >= plan.steps.length;
  // The caption is a filled slab, so an empty one is a hole in the page rather
  // than a blank line. When there is no next join it goes away entirely and the
  // halt sentence takes its place.
  caption.hidden = done;
  if (!done) caption.innerHTML = captionHTML(state);
  halt.hidden = !done;
  if (done) halt.textContent = haltText();
  stepBtn.disabled = done;
  if (!timer) playBtn.textContent = done ? 'Play again' : 'Play';
}

function renderLedger() {
  ledger.replaceChildren();
  for (let i = 0; i < at; i++) {
    const step = plan.steps[i];
    const li = document.createElement('li');

    const entry = document.createElement('span');
    entry.className = 'bp-entry';
    entry.textContent = String(step.entry);

    const cell = document.createElement('span');
    cell.className = 'bp-made';
    if (!step.whole) cell.classList.add('is-fragment');
    cell.textContent = step.whole ? visible(step.text) : step.hex;

    li.append(entry, cell);
    ledger.append(li);
  }
}

/**
 * The line under the pieces: what is about to happen next. Once nothing is,
 * it clears and the halt paragraph below says why — the same sentence in two
 * places would just be the room repeating itself.
 */
function captionHTML({ pieces, pending }) {
  if (!pending) return '&nbsp;';

  const parts = pieces[pending.piece];
  const left = show(parts[pending.at]);
  const right = show(parts[pending.at + 1]);
  return (
    `Entry <b>${pending.entry}</b> joins ` +
    `${escape(left)} and ${escape(right)} to make ` +
    `<b>${escape(pending.whole ? visible(pending.text) : pending.hex)}</b>`
  );
}

/**
 * What to say out loud about where the playback has stopped: the join coming
 * up, or — once there isn't one — the reason there isn't.
 */
function spoken() {
  if (at >= plan.steps.length) return haltText();
  return captionHTML(stateAt(plan, at))
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function haltText() {
  const refusals = plan.refusals;
  const tokens = plan.final.flat().length;

  if (!plan.steps.length) return 'Nothing to merge — every piece is already a single byte.';

  if (!refusals.length) {
    return tokens === 1
      ? 'Nothing left to join. The whole of it merged down to one token.'
      : `Nothing left to join. Every piece merged all the way down — ${tokens} tokens, one per piece.`;
  }

  // show() leaves raw bytes unquoted. Quoting them would present them as a
  // string the table might have held, and they are not a string at all.
  const named = refusals.slice(0, 3).map(show);
  const more = refusals.length - named.length;
  const list =
    named.length === 1
      ? named[0]
      : `${named.slice(0, -1).join(', ')} or ${named[named.length - 1]}`;

  return (
    `It stops here. The table has no entry for ${list}` +
    `${more > 0 ? `, or ${more} other pair${more === 1 ? '' : 's'} above` : ''}, ` +
    `so nothing adjacent can be joined. These ${tokens} pieces are the tokens.`
  );
}

function show(part) {
  return part.whole ? `“${visible(part.text)}”` : part.hex;
}

/** A glyph for the invisible ones, so an empty cell is not read as a fault. */
function visible(text) {
  return text.replace(/\n/g, '⏎').replace(/\t/g, '⇥');
}

/**
 * Announced only when the visitor has stopped somewhere — a step, a scrub, the
 * end of a run. Announcing every tick of a playing sequence would read the
 * whole room aloud on a timer.
 */
function say(text) {
  announce.textContent = text;
}

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
