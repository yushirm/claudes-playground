// rooms/10-convergents/room.js
//
// The ladder, the zigzag, and the exhaustive search.
//
// Everything numeric is in lib/cfrac.js and every constant is computed there
// rather than stored, so tools/check-convergents.mjs can verify the whole room
// — including that the terms shown do not change when the working precision is
// doubled, which is the failure mode this material actually has.

import { cutSigns } from '../../lib/type.js';
import {
  pi,
  e,
  phi,
  sqrt,
  expand,
  convergentsOf,
  decimalOf,
  errorOf,
  searchBelow,
} from '../../lib/cfrac.js';

cutSigns();

const $ = (id) => document.getElementById(id);
const announce = $('announce');

/** Working precision. Well past anything the room shows; the cost is a few
 *  milliseconds once, at load. */
const DIGITS = 120;
const SCALE = 10n ** BigInt(DIGITS);

/** Above this the sweep stops feeling instant, and a button that hangs the page
 *  is worse than a button that says it will not. */
const SEARCH_LIMIT = 300000n;

const CONSTANTS = [
  { key: 'pi', label: 'π', value: pi(DIGITS), note: 'irrational, and famously' },
  { key: 'e', label: 'e', value: e(DIGITS), note: 'terms that grow, so bargains keep arriving' },
  { key: 'sqrt2', label: '√2', value: sqrt(2n, DIGITS), note: 'all twos' },
  { key: 'phi', label: 'φ', value: phi(DIGITS), note: 'all ones — the worst deal there is' },
];

let current = CONSTANTS[0];
let shown = 1;

/** All the convergents available for the current constant. */
let ladder = [];

function setConstant(c) {
  current = c;
  ladder = convergentsOf(c.value, 14);
  shown = 1;
  const terms = expand(c.value.scaled, SCALE, 8);
  $('n-target').textContent = `${c.label} = ${decimalOf(c.value.scaled, SCALE, 20)}…`;
  $('n-cf').textContent = `[${terms[0]}; ${terms.slice(1).join(', ')}, …]`;
  for (const btn of $('pick').children) {
    btn.classList.toggle('is-on', btn.dataset.key === c.key);
    btn.setAttribute('aria-pressed', String(btn.dataset.key === c.key));
  }
  render();
}

/* --- numbers for display -------------------------------------------------- */

/** log10 of a positive BigInt, as a float. Used only for plotting. */
function log10Big(n) {
  const s = n.toString();
  if (s.length <= 15) return Math.log10(Number(s));
  return s.length - 15 + Math.log10(Number(s.slice(0, 15)));
}

/** log10 of |p/q − α|. */
function log10Error(c) {
  const num = c.p * SCALE - current.value.scaled * c.q;
  const mag = num < 0n ? -num : num;
  if (mag === 0n) return -Infinity;
  return log10Big(mag) - log10Big(c.q) - DIGITS;
}

/** q²·|α − p/q| — how good the fraction is for the size of its denominator. */
function quality(c) {
  const num = c.p * SCALE - current.value.scaled * c.q;
  const mag = num < 0n ? -num : num;
  return Number((c.q * mag * 10n ** 20n) / SCALE) / 1e20;
}

/* --- the zigzag ----------------------------------------------------------- */

const W = 640;
const H = 240;
const MID = H / 2;
const PAD = 46;
/** Errors run from about 1 down to 10⁻²⁰ over the ladder; the axis is drawn to
 *  a fixed depth so switching constants does not rescale under you. */
const DEPTH = 22;

function svg(tag, attrs, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = text;
  return el;
}

function drawPlot() {
  const g = $('plot-body');
  g.replaceChildren();

  const visible = ladder.slice(0, shown);
  const step = (W - PAD - 20) / Math.max(ladder.length - 1, 1);
  const x = (i) => PAD + i * step;
  // Error of 10^0 sits at the outer edge, 10^-DEPTH at the centre line.
  const y = (c) => {
    const l = Math.max(Math.min(log10Error(c), 0), -DEPTH);
    const off = ((DEPTH + l) / DEPTH) * (MID - 22);
    return errorOf(c.p, c.q, current.value).sign > 0 ? MID - off : MID + off;
  };

  // The true value: the line none of them lands on. Labelled at the right-hand
  // end, clear of the depth scale on the left — the two collided at the origin,
  // which is exactly where the figure most needs to be readable.
  g.append(svg('line', { x1: PAD - 6, y1: MID, x2: W - 26, y2: MID, class: 'plot-axis' }));
  g.append(svg('text', { x: W - 20, y: MID + 5, class: 'plot-label plot-true' }, current.label));

  for (const [depth, label] of [
    [0, '±1'],
    [10, '±10⁻¹⁰'],
    [20, '±10⁻²⁰'],
  ]) {
    const off = ((DEPTH - depth) / DEPTH) * (MID - 22);
    // The scale is symmetric, so it is drawn once, below the axis.
    g.append(svg('text', { x: 2, y: MID + off + 4, class: 'plot-label' }, label));
    for (const sign of [-1, 1]) {
      g.append(
        svg('line', {
          x1: PAD - 6,
          y1: MID + sign * off,
          x2: W - 26,
          y2: MID + sign * off,
          class: 'plot-grid',
        }),
      );
    }
  }

  // The zigzag itself.
  if (visible.length > 1) {
    const d = visible.map((c, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(c)}`).join(' ');
    g.append(svg('path', { d, class: 'plot-line' }));
  }

  visible.forEach((c, i) => {
    // A stem down to the axis makes "which side" readable at a glance, which is
    // the whole point of the figure.
    g.append(svg('line', { x1: x(i), y1: MID, x2: x(i), y2: y(c), class: 'plot-stem' }));
    g.append(
      svg('circle', {
        cx: x(i),
        cy: y(c),
        r: i === visible.length - 1 ? 6 : 4,
        class: `plot-dot${i === visible.length - 1 ? ' is-live' : ''}`,
      }),
    );
  });
}

/* --- the table ------------------------------------------------------------ */

function render() {
  drawPlot();

  const body = $('rows');
  body.replaceChildren();

  ladder.slice(0, shown).forEach((c, i) => {
    const err = errorOf(c.p, c.q, current.value, 20);
    const tr = document.createElement('tr');
    if (i === shown - 1) tr.className = 'is-live';

    const cells = [
      String(c.term),
      `${c.p}/${c.q}`,
      decimalOf(c.p, c.q, 14),
      err.text,
      quality(c).toFixed(6),
    ];
    cells.forEach((text, j) => {
      const cell = document.createElement(j === 0 ? 'th' : 'td');
      if (j === 0) cell.setAttribute('scope', 'row');
      cell.className = 'num';
      cell.textContent = text;
      // A quality under 1/√5 is a fraction that did better than its
      // denominator entitled it to. Worth being able to spot down the column.
      if (j === 4 && quality(c) < 0.4472) cell.classList.add('is-bargain');
      tr.append(cell);
    });
    body.append(tr);
  });

  $('next-term').disabled = shown >= ladder.length;
  $('all-terms').disabled = shown >= ladder.length;

  const c = ladder[shown - 1];
  $('claim').textContent =
    c.q === 1n
      ? `${c.p}/${c.q} is the nearest whole number. There is nothing below denominator 1 to check.`
      : `No fraction with a denominator below ${c.q.toLocaleString('en')} is closer to ${current.label} than ${c.p}/${c.q}.`;

  const searchable = c.q > 1n && c.q <= SEARCH_LIMIT;
  $('search').disabled = !searchable;
  $('search-result').textContent = searchable
    ? 'Nothing has been checked yet.'
    : c.q === 1n
      ? 'Nothing to check at this step.'
      : `That denominator is past ${SEARCH_LIMIT.toLocaleString('en')}, where the sweep stops being instant. The claim still holds; this room just will not sit and prove it while you wait.`;
}

/* --- the search ----------------------------------------------------------- */

$('search').addEventListener('click', () => {
  const c = ladder[shown - 1];
  $('search-result').textContent = 'Checking…';

  // Yield first, so the button visibly commits before a sweep that can take a
  // moment. Without this the page freezes and then reports, which reads as
  // nothing having happened.
  setTimeout(() => {
    const started = performance.now();
    const { found, tested } = searchBelow(current.value, c.q, c);
    const ms = Math.round(performance.now() - started);

    const message = found
      ? `Found one: ${found.p}/${found.q} is closer. That should not happen for a convergent, and it means something in this room is wrong.`
      : `Checked all ${tested.toLocaleString('en')} denominators below ${c.q.toLocaleString('en')}, taking the nearest numerator to each, in ${ms} ms. Not one of them is closer to ${current.label} than ${c.p}/${c.q}.`;
    $('search-result').textContent = message;
    announce.textContent = message;
  }, 30);
});

/* --- wiring --------------------------------------------------------------- */

const pick = $('pick');
for (const c of CONSTANTS) {
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.type = 'button';
  btn.dataset.key = c.key;
  btn.textContent = c.label;
  btn.title = c.note;
  btn.setAttribute('aria-pressed', 'false');
  btn.addEventListener('click', () => setConstant(c));
  pick.append(btn);
}

$('next-term').addEventListener('click', () => {
  if (shown < ladder.length) shown++;
  render();
  const c = ladder[shown - 1];
  announce.textContent = `${c.p}/${c.q}, error ${errorOf(c.p, c.q, current.value, 20).text}`;
});

$('all-terms').addEventListener('click', () => {
  shown = ladder.length;
  render();
});

$('reset').addEventListener('click', () => {
  shown = 1;
  render();
});

setConstant(CONSTANTS[0]);
