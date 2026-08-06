// Room 02 — The Garden of Forking Paths
//
// Walk forward through a hand-authored branching structure. At each step the
// candidate continuations are shown as a ranked fan, reweighted by temperature.
//
// The weights come from tree.js and I wrote every one of them. They are not
// measured and they are not sampled from a model. What is honest here is the
// *shape*: that at each point there are several things a sentence could become,
// that they are not equally likely, and that choosing one closes the others.

import { cutSigns } from '../../lib/type.js';
import tree from './tree.js';

cutSigns();

const seedRow = document.getElementById('seeds');
const pathEl = document.getElementById('path');
// The route is announced only when a branch is actually taken. Hovering draws a
// ghost continuation into the path, and putting that in a live region would
// read the whole sentence aloud every time the cursor crossed an option.
const pathLive = document.getElementById('path-live');
const fanEl = document.getElementById('fan');
const tempDial = document.getElementById('temp');
const tempOut = document.getElementById('temp-out');
const stepCount = document.getElementById('step-count');
const backBtn = document.getElementById('back');
const againBtn = document.getElementById('again');

let seed = tree.seeds[0];
let node = seed.root; // null once the sentence is finished
let taken = []; // [{ text, from }] — the route behind us
let temperature = 1;

for (const s of tree.seeds) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn';
  btn.textContent = s.label;
  btn.addEventListener('click', () => start(s));
  btn.dataset.seed = s.id;
  seedRow.append(btn);
}

tempDial.addEventListener('input', () => {
  temperature = Number(tempDial.value);
  tempOut.textContent = temperature.toFixed(2);
  drawFan();
});

backBtn.addEventListener('click', () => {
  if (!taken.length) return;
  const last = taken.pop();
  node = last.from;
  draw();
});

againBtn.addEventListener('click', () => start(seed));

start(seed);

function start(s) {
  seed = s;
  node = s.root;
  taken = [];
  for (const btn of seedRow.children) {
    btn.setAttribute('aria-pressed', String(btn.dataset.seed === s.id));
  }
  draw();
}

function draw() {
  drawPath();
  drawFan();
  backBtn.disabled = taken.length === 0;
  const depth = taken.length;
  stepCount.textContent = node
    ? `Step ${depth + 1}`
    : `Finished in ${depth} step${depth === 1 ? '' : 's'}`;
  pathLive.textContent = seed.text + taken.map((s) => s.text).join('');
}

function drawPath(ghost) {
  pathEl.replaceChildren();

  const seedSpan = document.createElement('span');
  seedSpan.className = 'path-seed';
  seedSpan.textContent = seed.text;
  pathEl.append(seedSpan);

  for (const step of taken) {
    const span = document.createElement('span');
    span.className = 'step';
    span.textContent = step.text;
    pathEl.append(span);
  }

  if (ghost != null) {
    const span = document.createElement('span');
    span.className = 'step-ghost';
    span.textContent = ghost;
    pathEl.append(span);
  }
}

function drawFan() {
  fanEl.replaceChildren();

  if (!node) {
    const done = document.createElement('li');
    done.className = 'ended';
    done.textContent =
      'The sentence is finished, and so is the tree — it was written three steps deep and this is the bottom of it. Step back to take a different branch, or start somewhere else.';
    fanEl.append(done);
    return;
  }

  const options = tree.nodes[node];
  const probs = reweight(
    options.map((o) => o.w),
    temperature
  );

  // Ranked, so the fan reads top to bottom as most to least likely and the
  // ordering itself changes nothing when temperature does — only the widths.
  const order = options
    .map((o, i) => ({ o, p: probs[i] }))
    .sort((a, b) => b.p - a.p);

  for (const { o, p } of order) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fan-opt';
    btn.style.setProperty('--p', (p * 100).toFixed(1) + '%');

    const bar = document.createElement('span');
    bar.className = 'fan-bar';

    const text = document.createElement('span');
    text.className = 'fan-text';
    text.textContent = o.t;

    const pct = document.createElement('span');
    pct.className = 'fan-p';
    pct.textContent = (p * 100).toFixed(0) + '%';

    btn.append(bar, text, pct);
    btn.setAttribute(
      'aria-label',
      `Continue with "${o.t.trim()}" — ${(p * 100).toFixed(0)} per cent at this temperature`
    );

    btn.addEventListener('click', () => choose(o));
    btn.addEventListener('mouseenter', () => drawPath(o.t));
    btn.addEventListener('focus', () => drawPath(o.t));
    btn.addEventListener('mouseleave', () => drawPath());
    btn.addEventListener('blur', () => drawPath());

    li.append(btn);
    fanEl.append(li);
  }
}

function choose(option) {
  taken.push({ text: option.t, from: node });
  node = option.to;
  draw();
}

/**
 * Temperature applied to a set of weights.
 *
 * Normalise to probabilities, raise each to the power 1/T, normalise again.
 * Below 1 that sharpens the distribution until one branch has all of it; above
 * 1 it flattens toward every branch being equally likely. This is the same
 * arithmetic a sampler does to a model's output distribution — it is the one
 * part of this room that is not invented.
 *
 * @param {number[]} weights
 * @param {number} t
 * @returns {number[]} probabilities, summing to 1
 */
function reweight(weights, t) {
  const total = weights.reduce((a, b) => a + b, 0);
  const powered = weights.map((w) => Math.pow(w / total, 1 / t));
  const sum = powered.reduce((a, b) => a + b, 0);
  return powered.map((p) => p / sum);
}
