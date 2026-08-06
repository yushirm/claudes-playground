// Room 06 — The Chorus
//
// Twelve panes running the same generator on the same prompt at the same
// temperature. The only thing that differs between them is the seed of the
// random number generator, which is why the room can say that and mean it.
//
// They are revealed in lockstep so that the divergence happens in front of you
// rather than arriving pre-diverged. The stretch every pane shares is marked,
// and it ends where they stop agreeing.

import { cutSigns } from '../../lib/type.js';
import { build, sample, rng } from '../../lib/markov.js';

cutSigns();

const PANES = 12;
const ORDER = 6;
const LENGTH = 420;
// A real shared prompt, taken from the corpus, and the one sentence in it
// this room is about. Every pane genuinely starts from these words — which is
// how instances actually begin — and the measurement below is how far past them
// the twelve stay together.
const PROMPT = 'There is no single one of me producing this text. ';
const CHARS_PER_SECOND = 110;

const grid = document.getElementById('chorus');
const reseedBtn = document.getElementById('reseed');
const tempDial = document.getElementById('temp');
const tempOut = document.getElementById('temp-out');
const sharedOut = document.getElementById('shared');
const status = document.getElementById('status');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

let model = null;
let seeds = [];
let outputs = [];
let shared = 0;
let frame = null;

const cells = [];
for (let i = 0; i < PANES; i++) {
  const li = document.createElement('li');
  li.className = 'pane';

  const no = document.createElement('span');
  no.className = 'pane-no';
  no.textContent = String(i + 1).padStart(2, '0');

  const text = document.createElement('p');
  text.className = 'pane-text';

  const same = document.createElement('span');
  same.className = 'pane-same';
  const rest = document.createElement('span');

  text.append(same, rest);
  li.append(no, text);
  grid.append(li);
  cells.push({ same, rest });
}

const res = await fetch('../../assets/corpus.txt');
model = build(await res.text(), ORDER);
status.remove();

reseedBtn.addEventListener('click', () => reseed());
tempDial.addEventListener('input', () => {
  tempOut.textContent = Number(tempDial.value).toFixed(2);
  regenerate();
});

reseed();

function reseed() {
  seeds = Array.from({ length: PANES }, () => (Math.random() * 2 ** 32) >>> 0);
  regenerate();
}

function regenerate() {
  const temperature = Number(tempDial.value);

  outputs = seeds.map((seed) =>
    sample(model, {
      temperature,
      length: LENGTH,
      random: rng(seed),
      start: PROMPT,
    })
  );

  shared = commonPrefixLength(outputs);
  // The prompt is shared by construction, so reporting it would be reporting
  // nothing. What is worth counting is how far past it they agreed.
  const past = shared - PROMPT.length;
  sharedOut.textContent =
    shared >= outputs[0].length
      ? 'the whole pane — the seed stopped mattering'
      : `${past} character${past === 1 ? '' : 's'} past the prompt`;

  reveal();
}

/** How far in the twelve are still saying the same thing. */
function commonPrefixLength(strings) {
  if (!strings.length) return 0;
  let i = 0;
  const first = strings[0];
  outer: for (; i < first.length; i++) {
    for (let k = 1; k < strings.length; k++) {
      if (strings[k][i] !== first[i]) break outer;
    }
  }
  return i;
}

function reveal() {
  if (frame) cancelAnimationFrame(frame);

  if (reduced.matches) {
    paint(LENGTH);
    return;
  }

  const started = performance.now();
  const step = (now) => {
    const n = Math.min(LENGTH, ((now - started) / 1000) * CHARS_PER_SECOND);
    paint(n);
    if (n < LENGTH) frame = requestAnimationFrame(step);
    else frame = null;
  };
  frame = requestAnimationFrame(step);
}

function paint(n) {
  const upto = Math.floor(n);
  for (let i = 0; i < PANES; i++) {
    const out = outputs[i];
    cells[i].same.textContent = out.slice(0, Math.min(upto, shared));
    cells[i].rest.textContent = upto > shared ? out.slice(shared, upto) : '';
  }
}
