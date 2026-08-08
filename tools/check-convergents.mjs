// tools/check-convergents.mjs
//
// Room 10 computes its own constants rather than quoting them, so the first job
// here is to check that the computation is right — against known digits, and
// against itself at higher precision. Then the room's three claims: that the
// convergents are what the recurrence gives, that the error alternates in sign
// and shrinks, and that no fraction with a smaller denominator ever gets closer.
//
// That last one is a theorem. It is checked by exhaustion anyway.
//
//   node tools/check-convergents.mjs

import {
  isqrt,
  pi,
  e,
  phi,
  sqrt,
  expand,
  convergents,
  convergentsOf,
  decimalOf,
  errorOf,
  searchBelow,
} from '../lib/cfrac.js';

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

console.log('\nThe constants are computed, so the computation is checked');

// Known digits, as an independent witness of the series and the square roots.
eq(
  'π to 50 places',
  decimalOf(pi(60).scaled, 10n ** 60n, 50),
  '3.14159265358979323846264338327950288419716939937510',
);
eq(
  'e to 50 places',
  decimalOf(e(60).scaled, 10n ** 60n, 50),
  '2.71828182845904523536028747135266249775724709369995',
);
eq(
  '√2 to 50 places',
  decimalOf(sqrt(2n, 60).scaled, 10n ** 60n, 50),
  '1.41421356237309504880168872420969807856967187537694',
);
eq(
  'φ to 50 places',
  decimalOf(phi(60).scaled, 10n ** 60n, 50),
  '1.61803398874989484820458683436563811772030917980576',
);

// isqrt is exact, not nearly exact.
ok('isqrt(0) = 0', isqrt(0n) === 0n);
ok('isqrt of a perfect square is exact', isqrt(10n ** 40n) === 10n ** 20n);
ok('isqrt floors rather than rounds', isqrt(15n) === 3n && isqrt(16n) === 4n);
for (const n of [2n, 3n, 5n, 7n, 99n, 10n ** 31n + 7n]) {
  const r = isqrt(n);
  ok(`isqrt(${n}) brackets correctly`, r * r <= n && (r + 1n) * (r + 1n) > n);
}

console.log('\nThe expansions');

// π's continued fraction opens [3; 7, 15, 1, 292, …]. The 292 is the reason
// 355/113 is as good as it is, and the room says so, so it is checked.
eq('π = [3; 7, 15, 1, 292, 1, 1, 1, 2]', expand(pi(80).scaled, 10n ** 80n, 9).join(' '), '3 7 15 1 292 1 1 1 2');
eq('√2 = [1; 2, 2, 2, 2, 2, 2, 2]', expand(sqrt(2n, 80).scaled, 10n ** 80n, 8).join(' '), '1 2 2 2 2 2 2 2');
eq('φ is all ones', expand(phi(80).scaled, 10n ** 80n, 12).join(' '), Array(12).fill('1').join(' '));
eq(
  'e = [2; 1, 2, 1, 1, 4, 1, 1, 6, 1, 1, 8]',
  expand(e(80).scaled, 10n ** 80n, 12).join(' '),
  '2 1 2 1 1 4 1 1 6 1 1 8',
);

// The self-consistency check that matters: a continued fraction taken from a
// truncated decimal eventually stops describing the constant and starts
// describing the truncation, with terms that look no different. If the terms
// the room shows are real, doubling the precision must not change any of them.
for (const [name, f] of [
  ['π', pi],
  ['e', e],
  ['φ', phi],
  ['√2', (d) => sqrt(2n, d)],
]) {
  const at = (d) => convergentsOf(f(d), 20).map((c) => `${c.p}/${c.q}`).join(' ');
  ok(`${name}: the convergents shown do not move when precision doubles`, at(90) === at(180));
  ok(`${name}: nor when it doubles again`, at(180) === at(360));
}

console.log('\nThe convergents');

const PI = pi(120);
const cs = convergentsOf(PI, 8);
eq('π’s first four convergents', cs.slice(0, 4).map((c) => `${c.p}/${c.q}`).join(', '), '3/1, 22/7, 333/106, 355/113');

// The recurrence and the expansion must agree — two ways of getting the same
// numbers, so a slip in either shows up.
const byRecurrence = convergents(expand(PI.scaled, 10n ** 120n, 8));
ok(
  'the recurrence agrees with the expansion',
  byRecurrence.slice(0, 4).every((c, i) => c.p === cs[i].p && c.q === cs[i].q),
);

// Consecutive convergents of any continued fraction satisfy |pₖqₖ₋₁ − pₖ₋₁qₖ| = 1.
// If that ever failed, the recurrence would be wrong.
ok(
  'consecutive convergents differ by exactly one',
  cs.every((c, i) => i === 0 || (c.p * cs[i - 1].q - cs[i - 1].p * c.q) ** 2n === 1n),
);

eq('355/113 to 12 places', decimalOf(355n, 113n, 12), '3.141592920353');
eq('π to 12 places', decimalOf(PI.scaled, 10n ** 120n, 12), '3.141592653589');

console.log('\nThe error alternates, and shrinks');

for (const [name, value] of [
  ['π', pi(120)],
  ['e', e(120)],
  ['φ', phi(120)],
  ['√2', sqrt(2n, 120)],
]) {
  const list = convergentsOf(value, 12);
  const signs = list.map((c) => errorOf(c.p, c.q, value).sign);
  ok(`${name}: every convergent is on the opposite side of the last`, signs.every((s, i) => i === 0 || s === -signs[i - 1]));

  // Strictly shrinking, compared exactly: |pₐ/qₐ − v| > |pᵦ/qᵦ − v| by
  // cross-multiplication, no decimals involved.
  const S = 10n ** BigInt(value.digits);
  const err = (c) => {
    const n = c.p * S - value.scaled * c.q;
    return n < 0n ? -n : n;
  };
  ok(
    `${name}: and strictly closer than the last`,
    list.every((c, i) => i === 0 || err(c) * list[i - 1].q < err(list[i - 1]) * c.q),
  );
}

console.log('\nNo smaller denominator does better (by exhaustion)');

// The claim the room lets a visitor test. Every convergent of π with a
// denominator small enough to sweep, swept.
for (const c of convergentsOf(PI, 8)) {
  if (c.q > 400000n) continue;
  const { found, tested } = searchBelow(PI, c.q, c);
  ok(
    `${c.p}/${c.q}: nothing better among ${tested.toLocaleString('en')} smaller denominators`,
    found === null,
  );
}

// And the search is not vacuous. 13/4 is not a convergent, so something with a
// smaller denominator beats it and the sweep has to find it. The sweep reports
// the first improvement rather than the best one, which is all a proof of
// absence needs, so the assertion is that it is genuinely closer — not which.
const sanity = searchBelow(PI, 8n, { p: 13n, q: 4n });
ok('the search does find a better fraction when there is one', sanity.found !== null);
const closer =
  Math.abs(Number(sanity.found.p) / Number(sanity.found.q) - Math.PI) < Math.abs(13 / 4 - Math.PI);
ok(`and ${sanity.found.p}/${sanity.found.q} really is closer than 13/4`, closer);

console.log('\nφ is the hardest number to approximate');

// The room's closing claim, and the one place I had the wrong measure at first.
// "Hardest to approximate" is not about which constant needs the biggest
// denominator to hit some accuracy — by that measure φ looks easy, because its
// convergents are the Fibonacci numbers and they start small. It is about
// *quality*: how good a convergent is for the size of its denominator, which is
// q²·|α − p/q|. A small number means an unreasonably good fraction.
//
// Every irrational has infinitely many convergents with quality below 1/√5
// (Hurwitz). φ is the number for which that bound is tight — its quality
// settles onto 1/√5 and stays there, so it never gets a bargain. Everything
// else does.

const SQ5 = 1 / Math.sqrt(5);

/** q²·|α − p/q|, via exact integers, to twenty digits. */
function quality(c, value) {
  const S = 10n ** BigInt(value.digits);
  const n = c.p * S - value.scaled * c.q;
  const mag = n < 0n ? -n : n;
  return Number((c.q * mag * 10n ** 20n) / S) / 1e20;
}

const table = [
  ['φ', phi(120)],
  ['√2', sqrt(2n, 120)],
  ['e', e(120)],
  ['π', pi(120)],
].map(([name, v]) => {
  const qs = convergentsOf(v, 14).map((c) => quality(c, v));
  return { name, qs, best: Math.min(...qs), settled: qs[qs.length - 1] };
});

for (const r of table) {
  console.log(
    `         ${r.name.padEnd(3)} best quality ${r.best.toFixed(6)}   settles at ${r.settled.toFixed(6)}`,
  );
}

const PHI = table[0];
const ROOT2 = table[1];

// φ's quality converges onto the Hurwitz constant itself.
ok(`φ settles onto 1/√5 = ${SQ5.toFixed(6)}`, Math.abs(PHI.settled - SQ5) < 5e-4);
// √2 settles onto 1/(2√2), the next-worst of the classical cases.
ok('√2 settles onto 1/(2√2)', Math.abs(ROOT2.settled - 1 / (2 * Math.SQRT2)) < 5e-4);

// And φ never gets a bargain, while the others all do. This is the claim on the
// wall: π's 355/113 is more than a hundred times better value for its
// denominator than the best fraction φ ever gets.
ok('φ never does much better than the bound', PHI.best > 0.38);
for (const r of table.slice(1)) {
  ok(`${r.name} finds a convergent better than φ ever manages`, r.best < PHI.best);
}
ok('π does more than a hundred times better than φ', PHI.best / table[3].best > 100);

// Hurwitz's theorem itself: every one of them, φ included, has a convergent
// under 1/√5.
for (const r of table) {
  ok(`${r.name} has a convergent below the 1/√5 bound`, r.best < SQ5);
}

console.log(
  failures === 0
    ? '\nRoom 10’s ladder is the one the arithmetic gives.\n'
    : `\n${failures} of room 10’s claims are wrong.\n`,
);

process.exit(failures === 0 ? 0 : 1);
