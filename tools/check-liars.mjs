// tools/check-liars.mjs
//
// Room 11 makes claims of the form "no base catches this" and "this is the
// smallest one that does X". Those are exhaustive claims, so they are checked
// exhaustively rather than looked up.
//
//   node tools/check-liars.mjs

import {
  gcd,
  modPow,
  ladder,
  split,
  fermat,
  millerRabin,
  sweep,
  smallestFactor,
  factorise,
  isCarmichael,
} from '../lib/modpow.js';

let failures = 0;

function eq(label, got, want) {
  const ok = String(got) === String(want);
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}`);
  if (!ok) console.log(`         got  ${got}\n         want ${want}`);
}

function ok(label, cond) {
  if (!cond) failures++;
  console.log(`${cond ? '  ok  ' : ' FAIL '} ${label}`);
}

console.log('\nThe arithmetic underneath');

// modPow against a slow but obviously-correct reference.
function slowPow(b, e, m) {
  let r = 1n;
  for (let i = 0n; i < e; i++) r = (r * b) % m;
  return r;
}
for (const [b, e, m] of [
  [2n, 560n, 561n],
  [7n, 100n, 91n],
  [3n, 1023n, 2047n],
  [10n, 12n, 13n],
]) {
  eq(`${b}^${e} mod ${m}`, modPow(b, e, m), slowPow(b, e, m));
}

// The ladder must compute the same thing it is used to illustrate.
for (const a of [2n, 5n, 50n, 100n]) {
  const steps = ladder(a, 560n, 561n);
  eq(`the ladder for ${a}^560 mod 561 ends where modPow does`, steps[steps.length - 1].running, modPow(a, 560n, 561n));
  eq(`and it has one step per bit of 560`, steps.length, 560n.toString(2).length);
}

eq('560 = 2^4 × 35', `2^${split(561n).s} × ${split(561n).d}`, '2^4 × 35');
eq('2046 = 2^1 × 1023', `2^${split(2047n).s} × ${split(2047n).d}`, '2^1 × 1023');

console.log('\n561 is composite, and Fermat never finds out');

eq('561 = 3 × 11 × 17', factorise(561n).join(' × '), '3 × 11 × 17');
ok('561 is composite', smallestFactor(561n) === 3n);

// The central claim, by exhaustion over every base.
const f561 = sweep(561n, (n, a) => fermat(n, a).passes);
console.log(`         of ${f561.total} bases: ${f561.liars} lie, ${f561.witnesses} catch it honestly, ${f561.sharing} share a factor`);
eq('not one coprime base catches 561', f561.witnesses, 0);
eq('318 bases lie about it', f561.liars, 318);
eq('240 only "catch" it by sharing a factor', f561.sharing, 240);
ok('561 is a Carmichael number', isCarmichael(561n));

// The other two the room offers.
for (const n of [1105n, 1729n]) {
  const s = sweep(n, (m, a) => fermat(m, a).passes);
  eq(`no coprime base catches ${n} either`, s.witnesses, 0);
  ok(`${n} is a Carmichael number`, isCarmichael(n));
}
eq('1105 = 5 × 13 × 17', factorise(1105n).join(' × '), '5 × 13 × 17');
eq('1729 = 7 × 13 × 19', factorise(1729n).join(' × '), '7 × 13 × 19');

// And 561 is the smallest such number, which the room says.
let smallestCarmichael = null;
for (let n = 3n; n < 561n; n += 2n) {
  if (isCarmichael(n)) {
    smallestCarmichael = n;
    break;
  }
}
eq('nothing below 561 is a Carmichael number', smallestCarmichael, 'null');

console.log('\nMiller–Rabin catches it, and says how');

const mr = millerRabin(561n, 2n);
ok('base 2 catches 561', !mr.passes);
eq('the sequence from 2^35', mr.sequence.join(' → '), '263 → 166 → 67 → 1 → 1');
eq('the culprit is 67', mr.culprit, 67n);
ok('67 really does square to 1 mod 561', (67n * 67n) % 561n === 1n);
ok('and 67 is neither 1 nor 560', mr.culprit !== 1n && mr.culprit !== 560n);

// The part that is better than a verdict: the witness hands over a factor.
eq('gcd(67 − 1, 561) is a real factor', mr.factor, 33n);
ok('33 divides 561', 561n % 33n === 0n);
ok('and it is not the trivial one', mr.factor > 1n && mr.factor < 561n);

// Miller–Rabin is much better, and not perfect.
const m561 = sweep(561n, (n, a) => millerRabin(n, a).passes);
console.log(`         of the coprime bases, ${m561.liars} still fool Miller–Rabin (Fermat: ${f561.liars})`);
eq('only 8 bases fool Miller–Rabin on 561', m561.liars, 8);
ok('which is far fewer than Fermat’s 318', m561.liars * 30 < f561.liars);

console.log('\nThe honest ending: 2047');

eq('2047 = 23 × 89', factorise(2047n).join(' × '), '23 × 89');
const mr2047 = millerRabin(2047n, 2n);
ok('Miller–Rabin base 2 says 2047 is prime', mr2047.passes);
eq('because 2^1023 is already 1', mr2047.sequence[0], 1n);

// And it is the smallest composite that fools it at base 2 — checked, not
// quoted. Only odd composites are candidates; even ones are caught by 2 | n.
let smallestSpsp = null;
for (let n = 9n; n < 2047n; n += 2n) {
  if (smallestFactor(n) !== null && millerRabin(n, 2n).passes) {
    smallestSpsp = n;
    break;
  }
}
eq('nothing composite below 2047 fools base 2', smallestSpsp, 'null');

// But another base catches it immediately, which is the point of using several.
ok('base 3 catches 2047', !millerRabin(2047n, 3n).passes);

// And the ending under the ending: bases 2, 3, 5 and 7 together are still not
// a proof. This is the number the room names.
const HARD = 3215031751n;
eq('3215031751 = 151 × 751 × 28351', factorise(HARD).join(' × '), '151 × 751 × 28351');
for (const a of [2n, 3n, 5n, 7n]) {
  ok(`base ${a} is fooled by 3215031751`, millerRabin(HARD, a).passes);
}
ok('but base 11 catches it', !millerRabin(HARD, 11n).passes);

console.log('\nThe tests agree with the truth where they should');

// A real prime must pass every base, for both tests. If this failed, the room
// would be showing a test that is broken rather than a test that is fooled.
for (const p of [563n, 1013n]) {
  ok(`${p} is prime`, smallestFactor(p) === null);
  const sf = sweep(p, (n, a) => fermat(n, a).passes);
  const sm = sweep(p, (n, a) => millerRabin(n, a).passes);
  eq(`every base passes ${p} under Fermat`, sf.witnesses, 0);
  eq(`every base passes ${p} under Miller–Rabin`, sm.witnesses, 0);
  eq(`and no base shares a factor with ${p}`, sf.sharing, 0);
}

// An ordinary composite is caught easily by both — the contrast that makes 561
// remarkable rather than typical.
const f91 = sweep(91n, (n, a) => fermat(n, a).passes);
console.log(`         91 = 7 × 13: ${f91.liars} liars against ${f91.witnesses} witnesses`);
ok('most bases catch an ordinary composite', f91.witnesses > f91.liars);

console.log(
  failures === 0
    ? '\nRoom 11’s claims survive every base there is.\n'
    : `\n${failures} of room 11’s claims are wrong.\n`,
);

process.exit(failures === 0 ? 0 : 1);
