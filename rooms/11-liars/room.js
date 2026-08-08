// rooms/11-liars/room.js
//
// Two tests, the same base, the same multiplications, side by side — and the
// sweep that shows Fermat's test does not merely fail on 561 but cannot succeed.
//
// The arithmetic is all in lib/modpow.js, which tools/check-liars.mjs verifies
// by exhaustion.

import { cutSigns } from '../../lib/type.js';
import { gcd, fermat, millerRabin, sweep, factorise, smallestFactor } from '../../lib/modpow.js';

cutSigns();

const $ = (id) => document.getElementById(id);
const announce = $('announce');

const NUMBERS = [
  { n: 561n, note: 'the smallest Carmichael number' },
  { n: 1105n, note: 'the next one' },
  { n: 1729n, note: 'the taxicab number, also Carmichael' },
  { n: 2047n, note: 'fools Miller–Rabin at base 2' },
  { n: 91n, note: 'an ordinary composite, caught easily' },
  { n: 563n, note: 'genuinely prime' },
];

let current = NUMBERS[0];

function base() {
  const raw = BigInt(Math.max(2, Math.floor(Number($('base').value) || 2)));
  // A base at or above n tests the same thing as its remainder, and a base of
  // n − 1 always passes both tests trivially. Keep it inside the useful range
  // rather than silently doing something uninteresting.
  const n = current.n;
  if (raw >= n - 1n) return ((raw % (n - 3n)) + 2n);
  return raw;
}

/**
 * A strip of value cells, in the museum's grid.
 *
 * @param {HTMLElement} el
 * @param {{ value: bigint, note?: string, mark?: 'culprit' | 'result' }[]} cells
 */
function strip(el, cells) {
  el.replaceChildren();
  for (const { value, note, mark } of cells) {
    const cell = document.createElement('span');
    cell.className = `lad${mark ? ` is-${mark}` : ''}`;

    const v = document.createElement('span');
    v.className = 'lad-v';
    v.textContent = String(value);
    cell.append(v);

    // The exponent's bits, under the values they explain. Without them the
    // running total sits unchanged for four cells and looks broken, when what
    // it is doing is skipping the zero bits of the exponent.
    if (note !== undefined) {
      const n = document.createElement('span');
      n.className = 'lad-n';
      n.textContent = note;
      cell.append(n);
    }
    el.append(cell);
  }
}

function render() {
  const n = current.n;
  const a = base();
  $('nm1').textContent = String(n - 1n);

  /* --- Fermat --- */
  const f = fermat(n, a);
  // The running value after each step, with the exponent bit that decided
  // whether the step contributed anything. The exponent is read from the
  // bottom up, so the bits run in the same order as the cells.
  strip(
    $('fermat-strip'),
    f.steps.map((s, i) => ({
      value: s.running,
      note: String(s.bit),
      mark: i === f.steps.length - 1 ? 'result' : undefined,
    })),
  );
  const ones = f.steps.filter((s) => s.multiplied).length;
  $('fermat-caption').textContent =
    `${a}^${n - 1n} mod ${n} = ${f.value}. ${f.steps.length} squarings, and the running total only moves at the ${ones} ${ones === 1 ? 'step' : 'steps'} where ${n - 1n} has a 1 bit — that row of digits underneath is ${n - 1n} in binary, least significant first.`;

  const lying = f.passes && smallestFactor(n) !== null;
  $('fermat-verdict').textContent = f.passes
    ? `Says: prime.${lying ? ' It is lying.' : ''}`
    : f.coprime
      ? 'Says: composite. Correctly, and honestly.'
      : `Says: composite — but only because ${a} shares a factor with ${n}. That is not a primality test, it is a lucky division.`;
  $('fermat-verdict').className = `verdict${lying ? ' is-lie' : f.passes ? '' : ' is-caught'}`;

  /* --- Miller–Rabin --- */
  const m = millerRabin(n, a);
  $('mr-split').textContent = `${n - 1n} = 2^${m.s} × ${m.d}, so take ${a}^${m.d} and square it ${m.s} ${m.s === 1 ? 'time' : 'times'}:`;

  const culpritIndex = m.culprit === null ? -1 : m.sequence.indexOf(m.culprit);
  strip(
    $('mr-strip'),
    m.sequence.map((value, i) => ({
      value,
      note: i === 0 ? `a^${m.d}` : `squared ×${i}`,
      mark: i === culpritIndex ? 'culprit' : undefined,
    })),
  );
  $('mr-why').textContent = `Because ${m.why}`;

  const mrLying = m.passes && smallestFactor(n) !== null;
  $('mr-verdict').textContent = m.passes
    ? `Says: prime.${mrLying ? ' It is lying too.' : ''}`
    : 'Says: composite.';
  $('mr-verdict').className = `verdict${mrLying ? ' is-lie' : m.passes ? '' : ' is-caught'}`;

  if (m.factor && m.factor > 1n && m.factor < n) {
    $('mr-factor').hidden = false;
    $('mr-factor').textContent = `And it does better than a verdict: since ${m.culprit}² ≡ 1, the number ${n} divides ${m.culprit - 1n} × ${m.culprit + 1n} while dividing neither, so it has split its factors between them. gcd(${m.culprit - 1n}, ${n}) = ${m.factor}, which is a real factor of ${n}. The witness hands you a piece of the number.`;
  } else {
    $('mr-factor').hidden = true;
  }

  /* --- the truth --- */
  const factors = factorise(n);
  $('truth').textContent =
    factors.length === 1
      ? `${n} is prime. Both tests are right about it, at every base.`
      : `${n} = ${factors.join(' × ')}. It is composite, whatever the tests just said.`;

  $('sweep-out').hidden = true;
}

/* --- the sweep ------------------------------------------------------------ */

$('sweep').addEventListener('click', () => {
  const n = current.n;
  const f = sweep(n, (m, a) => fermat(m, a).passes);
  const mr = sweep(n, (m, a) => millerRabin(m, a).passes);

  $('s-liars').textContent = String(f.liars);
  $('s-witnesses').textContent = String(f.witnesses);
  $('s-sharing').textContent = String(f.sharing);
  $('s-witnesses').classList.toggle('is-live', f.witnesses === 0);

  const prime = smallestFactor(n) === null;
  const note = prime
    ? `${n} is prime, so of course every base passes. The test is not being fooled here; it is being right.`
    : f.witnesses === 0
      ? `Not one of the ${f.total} bases catches ${n} honestly. The ${f.sharing} that report "composite" are the multiples of ${factorise(n).filter((v, i, arr) => arr.indexOf(v) === i).join(', ')} — they found a factor, they did not run a test. Trying more bases cannot help, because there is no base that would help. Miller–Rabin, on the same number, is fooled by ${mr.liars}.`
      : `${f.witnesses} of the ${f.total} bases catch it honestly, so a couple of random tries would almost certainly have found it out. Miller–Rabin does better still: ${mr.liars} liars instead of ${f.liars}.`;

  $('sweep-note').textContent = note;
  $('sweep-out').hidden = false;
  announce.textContent = note;
});

/* --- wiring --------------------------------------------------------------- */

const pick = $('pick');
for (const item of NUMBERS) {
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.type = 'button';
  btn.textContent = String(item.n);
  btn.title = item.note;
  btn.setAttribute('aria-pressed', 'false');
  btn.addEventListener('click', () => {
    current = item;
    for (const b of pick.children) {
      const on = b === btn;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    render();
    announce.textContent = `Testing ${item.n} — ${item.note}.`;
  });
  pick.append(btn);
}
pick.children[0].classList.add('is-on');
pick.children[0].setAttribute('aria-pressed', 'true');

$('base').addEventListener('input', render);

$('random-base').addEventListener('click', () => {
  // Any base coprime to n, so the result is a real test rather than a lucky
  // division. On a Carmichael number every one of these will lie, which is the
  // point of being able to keep pressing it.
  const n = current.n;
  let a;
  do {
    a = 2n + BigInt(Math.floor(Math.random() * (Number(n) - 3)));
  } while (gcd(a, n) !== 1n);
  $('base').value = String(a);
  render();
});

render();
