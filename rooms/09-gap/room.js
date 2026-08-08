// rooms/09-gap/room.js
//
// Three mechanisms, all of them reading the real storage rather than describing
// it: the bits of whatever you type, an accumulator that drifts, and a ladder
// showing the grid getting coarser as the numbers get bigger.
//
// All the arithmetic is in lib/binary64.js so tools/check-gap.mjs can verify it
// without a browser.

import { cutSigns } from '../../lib/type.js';
import {
  decompose,
  bitString,
  exactDecimal,
  nextUp,
  gap,
  errorAgainst,
} from '../../lib/binary64.js';

cutSigns();

const $ = (id) => document.getElementById(id);
const announce = $('announce');

/* --- the bits ------------------------------------------------------------- */

const FIELDS = [
  { name: 'sign', from: 0, to: 1, cls: 'is-sign' },
  { name: 'exponent', from: 1, to: 12, cls: 'is-exp' },
  { name: 'fraction', from: 12, to: 64, cls: 'is-man' },
];

function drawBits(x) {
  const bits = bitString(x);
  const wrap = $('bits');
  wrap.replaceChildren();

  for (const field of FIELDS) {
    const group = document.createElement('span');
    group.className = `bit-group ${field.cls}`;
    for (let i = field.from; i < field.to; i++) {
      const cell = document.createElement('span');
      cell.className = `bit${bits[i] === '1' ? ' is-set' : ''}`;
      cell.textContent = bits[i];
      group.append(cell);
    }
    wrap.append(group);
  }
}

/* --- the number you typed ------------------------------------------------- */

const EXAMPLES = [
  ['0.1', 'the classic'],
  ['0.5', 'exact — a half is a power of two'],
  ['0.3', 'stored low, where 0.1 is stored high'],
  ['1e-7', 'small, and still not exact'],
  ['9007199254740993', '2⁵³ + 1 — not a number a double can hold'],
  ['1e-320', 'subnormal: below the smallest ordinary exponent'],
];

function render(raw) {
  const text = raw.trim();
  const x = Number(text);

  if (text === '' || Number.isNaN(x)) {
    $('status').textContent = text === '' ? 'Type a number.' : `“${text}” is not a number.`;
    for (const id of ['v-exact', 'v-error', 'v-next', 'v-gap']) $(id).textContent = '—';
    $('v-asked').textContent = text || '—';
    drawBits(0);
    return;
  }

  drawBits(x);
  $('v-asked').textContent = text;
  $('v-exact').textContent = exactDecimal(x);

  const err = errorAgainst(text);
  if (!Number.isFinite(x)) {
    $('v-error').textContent = '—';
    $('v-next').textContent = '—';
    $('v-gap').textContent = '—';
    $('status').textContent =
      'That is past the largest double there is, so the format has stopped counting and gone to infinity.';
    return;
  }

  if (err === null) {
    $('v-error').textContent = 'not a plain decimal';
    $('v-error').classList.remove('is-live');
  } else if (err.error === '0') {
    $('v-error').textContent = 'nothing — this one is exact';
    $('v-error').classList.remove('is-live');
  } else {
    $('v-error').textContent = err.error;
    $('v-error').classList.add('is-live');
  }

  const up = nextUp(x);
  $('v-next').textContent = exactDecimal(up);
  $('v-gap').textContent = exactDecimal(gap(x));

  const { subnormal } = decompose(x);
  const same = String(x) === text.replace(/^\+/, '');
  $('status').textContent = subnormal
    ? 'This one is subnormal: below the smallest ordinary exponent, where the format trades precision for the chance to get nearer zero.'
    : err && err.error === '0'
      ? 'Exact, because this number is a whole number of halves, quarters or eighths — a sum of powers of two, which is the only kind the grid holds exactly.'
      : same
        ? 'Your language prints this back as what you typed. It is not what you typed.'
        : `Your language prints this as ${x}.`;
}

const examples = $('examples');
for (const [value, note] of EXAMPLES) {
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.type = 'button';
  btn.textContent = value;
  btn.title = note;
  btn.addEventListener('click', () => {
    $('input').value = value;
    render(value);
    announce.textContent = `${value}: ${note}`;
  });
  examples.append(btn);
}

$('input').addEventListener('input', (e) => render(e.target.value));

/* --- ten tenths ----------------------------------------------------------- */
//
// The point is not that the total is wrong. It is that every step is correctly
// rounded and the total is wrong anyway, so each line shows its own exact value
// and the visitor can see the error appear at step three and never leave.

let total = 0;
let steps = 0;

/** @type {{n: number, value: number}[]} */
const history = [];

function renderTenths() {
  const list = $('tenths');
  list.replaceChildren();
  for (const { n, value } of history) {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'tenths-n';
    label.textContent = `+0.1 × ${n}`;
    const val = document.createElement('span');
    val.className = 'num tenths-v';
    val.textContent = exactDecimal(value);
    // Mark the lines where the running total is not even the same double you
    // would have got by writing the tidy decimal down directly. Every line is
    // inexact; these are the ones where the accumulation has actually moved you
    // to a different square, which is the thing worth pointing at.
    if (String(value) !== String(n / 10)) val.classList.add('is-live');
    li.append(label, val);
    list.append(li);
  }
  $('add-tenth').disabled = steps >= 10;
  $('run-tenths').disabled = steps >= 10;
}

function addTenth() {
  if (steps >= 10) return;
  total += 0.1;
  steps++;
  history.push({ n: steps, value: total });
  renderTenths();
  if (steps === 10) {
    announce.textContent =
      total === 1
        ? 'Ten tenths came to one.'
        : `Ten tenths came to ${total}, which is not one.`;
  }
}

$('add-tenth').addEventListener('click', addTenth);
$('run-tenths').addEventListener('click', () => {
  while (steps < 10) addTenth();
});
$('reset-tenths').addEventListener('click', () => {
  total = 0;
  steps = 0;
  history.length = 0;
  renderTenths();
});

/* --- the ladder ----------------------------------------------------------- */
//
// Where the grid gets coarse. Each row is one binade — the numbers between a
// power of two and the next — because the spacing is constant inside one and
// doubles at every boundary.

const BINADES = [-1022, -20, -1, 0, 10, 52, 53, 62, 100, 1023];

const SUPERS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

function short(x) {
  // Long expansions belong in the panel above; the ladder needs to be read at a
  // glance, so anything unwieldy falls back to the exponent form the number
  // actually has. Set in real superscripts rather than with a caret, so this
  // column and the one beside it are speaking the same notation.
  const exact = exactDecimal(x);
  if (exact.length <= 24) return exact;
  const [mant, exp] = x.toExponential(4).split('e');
  return `${mant} × 10${[...exp.replace('+', '')].map((c) => SUPERS[c]).join('')}`;
}

const body = $('ladder-body');
for (const e of BINADES) {
  const lo = 2 ** e;
  const hi = 2 ** (e + 1);
  const step = gap(lo);

  /** "2" with a real superscript, so 2^0 does not read as twenty. */
  const power = (exp) => {
    const span = document.createElement('span');
    span.className = 'ladder-power';
    const sup = document.createElement('sup');
    sup.textContent = String(exp);
    span.append(document.createTextNode('2'), sup);
    return span;
  };

  const tr = document.createElement('tr');
  const cells = [
    [power(e), short(lo)],
    [power(e + 1), short(hi)],
    [null, short(step)],
    [null, null, power(Math.round(Math.log2(step)))],
  ];

  cells.forEach(([prefix, value, only], i) => {
    const td = document.createElement(i === 0 ? 'th' : 'td');
    if (i === 0) td.setAttribute('scope', 'row');
    td.className = 'num';
    if (only) {
      td.append(only);
    } else {
      if (prefix) td.append(prefix, document.createTextNode(' '));
      td.append(document.createTextNode(value));
    }
    tr.append(td);
  });

  // The row where whole numbers start going missing is the one worth finding.
  if (e === 52 || e === 53) tr.className = 'is-live';
  body.append(tr);
}

/* --- go ------------------------------------------------------------------- */

render($('input').value);
renderTenths();
