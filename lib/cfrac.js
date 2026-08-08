// lib/cfrac.js
//
// Continued fractions, and the constants to run them on.
//
// The constants are computed here rather than stored. A room about how well a
// fraction can approximate π should not open by pasting in a hundred digits of
// π from somewhere and asking to be believed — the digits would be the one
// unchecked thing holding up everything else. So π comes out of Machin's
// formula, e out of its series, and √2 and φ out of an integer square root, all
// in BigInt at a precision the caller names. Nothing here is quoted.
//
// Everything is exact. A "constant" in this file is a pair — a huge integer and
// the power of ten it is scaled by — so it is really a rational that agrees
// with the real number to that many digits, and every comparison against it is
// integer arithmetic.

/** @typedef {{ scaled: bigint, digits: number }} Scaled a value × 10**digits */

/**
 * Integer square root, by Newton's method. Exact: returns floor(√n).
 * @param {bigint} n
 * @returns {bigint}
 */
export function isqrt(n) {
  if (n < 0n) throw new RangeError('isqrt of a negative');
  if (n < 2n) return n;
  // A good starting guess matters: from the bit length, so the iteration starts
  // within a factor of two rather than at n/2 and taking hundreds of rounds.
  let x = 1n << (BigInt(n.toString(2).length) / 2n + 1n);
  for (;;) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
}

/** 10**d as a BigInt. */
const pow10 = (d) => 10n ** BigInt(d);

/**
 * arctan(1/x), scaled by 10**digits, by its alternating series.
 * @param {bigint} x
 * @param {number} digits
 * @returns {bigint}
 */
function arctanInv(x, digits) {
  const S = pow10(digits);
  const x2 = x * x;
  let term = S / x;
  let sum = term;
  let k = 1n;
  while (term !== 0n) {
    term = term / x2;
    const t = term / (2n * k + 1n);
    sum += k % 2n === 1n ? -t : t;
    k++;
  }
  return sum;
}

/**
 * π, by Machin's formula: π = 16 arctan(1/5) − 4 arctan(1/239).
 *
 * Computed with ten guard digits and then truncated, so the digits returned are
 * not carrying the series' own rounding at the end.
 *
 * @param {number} digits
 * @returns {Scaled}
 */
export function pi(digits) {
  const g = digits + 12;
  const raw = 16n * arctanInv(5n, g) - 4n * arctanInv(239n, g);
  return { scaled: raw / pow10(g - digits), digits };
}

/**
 * e, by the sum of the reciprocal factorials.
 * @param {number} digits
 * @returns {Scaled}
 */
export function e(digits) {
  const g = digits + 12;
  let sum = 0n;
  let term = pow10(g);
  let k = 1n;
  while (term !== 0n) {
    sum += term;
    term = term / k;
    k++;
  }
  return { scaled: sum / pow10(g - digits), digits };
}

/**
 * √n for a whole n, by integer square root at twice the precision.
 * @param {bigint} n
 * @param {number} digits
 * @returns {Scaled}
 */
export function sqrt(n, digits) {
  return { scaled: isqrt(n * pow10(2 * digits)), digits };
}

/**
 * φ = (1 + √5) / 2.
 * @param {number} digits
 * @returns {Scaled}
 */
export function phi(digits) {
  const g = digits + 12;
  const root5 = isqrt(5n * pow10(2 * g));
  return { scaled: (pow10(g) + root5) / 2n / pow10(g - digits), digits };
}

/**
 * The continued fraction expansion of a rational p/q.
 *
 * @param {bigint} p
 * @param {bigint} q
 * @param {number} maxTerms
 * @returns {bigint[]} [a0; a1, a2, …]
 */
export function expand(p, q, maxTerms = 40) {
  const terms = [];
  while (terms.length < maxTerms && q !== 0n) {
    const a = p / q;
    terms.push(a);
    [p, q] = [q, p - a * q];
  }
  return terms;
}

/**
 * The convergents of a continued fraction, by the standard recurrence:
 * hₖ = aₖhₖ₋₁ + hₖ₋₂ and the same for the denominators.
 *
 * @param {bigint[]} terms
 * @returns {{ p: bigint, q: bigint, term: bigint }[]}
 */
export function convergents(terms) {
  const out = [];
  // h₋₁ = 1, h₋₂ = 0 for the numerators; k₋₁ = 0, k₋₂ = 1 for the
  // denominators. Getting these the wrong way round produces a sequence that
  // passes every structural test — the |pₖqₖ₋₁ − pₖ₋₁qₖ| = 1 identity is
  // symmetric — and is simply every fraction upside down.
  let [pPrev, p] = [0n, 1n];
  let [qPrev, q] = [1n, 0n];
  for (const a of terms) {
    [pPrev, p] = [p, a * p + pPrev];
    [qPrev, q] = [q, a * q + qPrev];
    out.push({ p, q, term: a });
  }
  return out;
}

/**
 * Convergents of a scaled constant, cut off where the precision runs out.
 *
 * This is the part that has to be careful. A continued fraction expanded from a
 * truncated decimal is only the *real* constant's expansion for as long as the
 * truncation has not yet mattered, and after that it silently becomes the
 * expansion of the truncation instead — with terms that look exactly as
 * plausible as the true ones. A convergent p/q is within about 1/q² of the
 * value, so once q² approaches the precision the terms stop being trustworthy.
 * The cut here is deliberately well short of that boundary, and CI checks the
 * result against a run at double the precision.
 *
 * @param {Scaled} value
 * @param {number} maxTerms
 * @returns {{ p: bigint, q: bigint, term: bigint }[]}
 */
export function convergentsOf(value, maxTerms = 20) {
  const all = convergents(expand(value.scaled, pow10(value.digits), maxTerms + 8));
  // Keep only those whose denominator squared stays inside a third of the
  // available precision — a wide margin, cheap to buy.
  const limit = pow10(Math.floor(value.digits / 3));
  return all.filter((c) => c.q < limit).slice(0, maxTerms);
}

/**
 * The signed error of p/q against a scaled value, as a decimal string.
 *
 * Positive means the fraction is above the constant. Computed as an exact
 * integer comparison first, so the sign is never a floating-point guess.
 *
 * @param {bigint} p
 * @param {bigint} q
 * @param {Scaled} value
 * @param {number} places
 * @returns {{ sign: number, text: string }}
 */
export function errorOf(p, q, value, places = 24) {
  const S = pow10(value.digits);
  // p/q − v  =  (p·S − v·q) / (q·S)
  const num = p * S - value.scaled * q;
  const den = q * S;
  const sign = num === 0n ? 0 : num < 0n ? -1 : 1;
  const mag = num < 0n ? -num : num;

  const scaledMag = (mag * pow10(places)) / den;
  const s = scaledMag.toString().padStart(places + 1, '0');
  const whole = s.slice(0, s.length - places);
  const frac = s.slice(s.length - places);
  return { sign, text: `${sign < 0 ? '−' : '+'}${whole}.${frac}` };
}

/**
 * p/q as a decimal string.
 * @param {bigint} p
 * @param {bigint} q
 * @param {number} places
 * @returns {string}
 */
export function decimalOf(p, q, places = 20) {
  const neg = p < 0n !== q < 0n;
  const [a, b] = [p < 0n ? -p : p, q < 0n ? -q : q];
  const scaled = (a * pow10(places)) / b;
  const s = scaled.toString().padStart(places + 1, '0');
  return `${neg ? '−' : ''}${s.slice(0, s.length - places)}.${s.slice(s.length - places)}`;
}

/**
 * Search every denominator below `limit` for a fraction closer to the value
 * than the one given. This is the room's proof by exhaustion of the
 * best-approximation theorem, and it is a real search — the answer is not
 * assumed.
 *
 * Errors are compared as exact rationals by cross-multiplication, so nothing
 * here rounds. For each q the only candidate worth testing is the nearest
 * integer to q·v, since any other numerator is further away.
 *
 * @param {Scaled} value
 * @param {bigint} limit exclusive
 * @param {{p: bigint, q: bigint}} beat the convergent to be beaten
 * @returns {{ found: {p: bigint, q: bigint} | null, tested: number }}
 */
export function searchBelow(value, limit, beat) {
  const S = pow10(value.digits);
  // |p/q − v| as the pair (|p·S − v·q|, q) — the common S cancels in every
  // comparison, so it is left out.
  const errNum = (p, q) => {
    const n = p * S - value.scaled * q;
    return n < 0n ? -n : n;
  };

  const bestN = errNum(beat.p, beat.q);
  const bestQ = beat.q;

  let tested = 0;
  for (let q = 1n; q < limit; q++) {
    tested++;
    // Nearest integer to q·v, computed by rounding the exact quotient.
    const p = (value.scaled * q * 2n + S) / (S * 2n);
    // |a/qa| < |b/qb|  ⟺  a·qb < b·qa
    if (errNum(p, q) * bestQ < bestN * q) return { found: { p, q }, tested };
  }
  return { found: null, tested };
}
