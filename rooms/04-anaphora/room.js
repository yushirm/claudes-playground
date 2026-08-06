// Room 04 — The Anaphora Room
//
// One sentence, one toggle, one arrow. The arrow's movement is the exhibit, so
// it is drawn rather than animated with CSS: the curve has to be recomputed
// continuously as the endpoint travels, because a curve that cross-fades
// between two positions does not read as the same arrow having moved.

import { cutSigns } from '../../lib/type.js';

cutSigns();

const svg = document.getElementById('arrows');
const line = document.getElementById('arrow-line');
const casing = document.getElementById('arrow-casing');
const head = document.getElementById('arrow-head');
const anchor = document.getElementById('arrow-anchor');
const pronoun = document.getElementById('pronoun');
const blank = document.getElementById('blank');
const live = document.getElementById('referent-live');
const nouns = {
  big: document.getElementById('trophy'),
  small: document.getElementById('suitcase'),
};

const DURATION = 520;

let adjective = 'big';
let current = null; // {x, y} the arrow's live endpoint
let frame = null;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

for (const input of document.querySelectorAll('input[name="adj"]')) {
  input.addEventListener('change', () => {
    if (input.checked) setAdjective(input.value);
  });
}

// The geometry depends on where the words wrapped, so it has to be redone
// whenever the line breaks move.
const resize = new ResizeObserver(() => snap());
resize.observe(svg.parentElement);
if (document.fonts) document.fonts.ready.then(() => snap());

setAdjective('big', true);

function setAdjective(value, immediate = false) {
  adjective = value;
  blank.textContent = value;

  for (const [key, el] of Object.entries(nouns)) {
    el.classList.toggle('is-referent', key === value);
  }

  live.textContent =
    value === 'big'
      ? 'it refers to the trophy'
      : 'it refers to the suitcase';

  const target = endpointFor(nouns[value]);
  if (immediate || reduced.matches || !current) {
    current = target;
    render();
  } else {
    swingTo(target);
  }
}

/** Recompute without animating — after a resize or a font swap. */
function snap() {
  current = endpointFor(nouns[adjective]);
  render();
}

/**
 * Where the arrow starts: just under the pronoun.
 * Coordinates are relative to the SVG, which overlays the sentence exactly.
 */
function startPoint() {
  return anchorPoint(pronoun);
}

function endpointFor(el) {
  return anchorPoint(el);
}

function anchorPoint(el) {
  const box = el.getBoundingClientRect();
  const frameBox = svg.getBoundingClientRect();
  return {
    x: box.left - frameBox.left + box.width / 2,
    y: box.bottom - frameBox.top + 2,
  };
}

function swingTo(target) {
  const from = { ...current };
  const started = performance.now();
  if (frame) cancelAnimationFrame(frame);

  const step = (now) => {
    const t = Math.min(1, (now - started) / DURATION);
    const e = easeSwing(t);
    current = {
      x: from.x + (target.x - from.x) * e,
      y: from.y + (target.y - from.y) * e,
    };
    render();
    if (t < 1) frame = requestAnimationFrame(step);
    else frame = null;
  };

  frame = requestAnimationFrame(step);
}

/**
 * Ease out with a small overshoot, so the arrow arrives and settles rather
 * than decelerating politely into place. This is the whole feel of the room.
 */
function easeSwing(t) {
  const c = 1.2;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

function render() {
  const a = startPoint();
  const b = current;
  if (!b) return;

  // The dip scales with how far the arrow has to reach, so the short hop to
  // the suitcase is a shallower curve than the long one back to the trophy.
  // A fixed dip makes both hops look like the same gesture at two sizes.
  const dx = Math.abs(b.x - a.x);
  const dip = Math.min(64, 22 + dx * 0.14);

  const c1 = { x: a.x, y: a.y + dip };
  const c2 = { x: b.x, y: b.y + dip };

  const d = `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
  line.setAttribute('d', d);
  casing.setAttribute('d', d);

  // The tangent at the end of a cubic is P3 − P2, which here points straight up
  // into the word the arrow has landed on.
  const angle = (Math.atan2(b.y - c2.y, b.x - c2.x) * 180) / Math.PI;
  head.setAttribute('transform', `translate(${b.x} ${b.y}) rotate(${angle})`);

  anchor.setAttribute('cx', a.x);
  anchor.setAttribute('cy', a.y);
}
