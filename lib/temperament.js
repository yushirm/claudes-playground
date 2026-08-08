// lib/temperament.js
//
// The arithmetic behind room 08. No audio in here — this file computes ratios,
// cents and beat rates, and nothing else, so the claims on the room's wall can
// be checked by a script with no browser and no speakers (tools/check-comma.mjs).
//
// Two number systems are used on purpose, and the split is the whole point of
// the module:
//
//   - Just intervals are exact rationals, held as BigInt pairs. The Pythagorean
//     comma is not a measurement. It is 531441/524288, and it is that whether
//     or not anyone ever listens to it. Computing it in floating point would be
//     a small joke at room 09's expense but it would also make this room's
//     central number an approximation of an approximation.
//   - Equal temperament is irrational by construction — 2^(1/12) is not a
//     ratio of whole numbers, which is precisely why the compromise exists — so
//     anything touching it is a float, and says so.

/* --- exact rationals ------------------------------------------------------ */

/** @typedef {{ n: bigint, d: bigint }} Rational */

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a < 0n ? -a : a;
}

/**
 * @param {bigint|number} n
 * @param {bigint|number} d
 * @returns {Rational} in lowest terms
 */
export function rat(n, d = 1n) {
  let [a, b] = [BigInt(n), BigInt(d)];
  const g = gcd(a, b) || 1n;
  return { n: a / g, d: b / g };
}

/** @param {Rational} x @param {Rational} y @returns {Rational} */
export function mul(x, y) {
  return rat(x.n * y.n, x.d * y.d);
}

/** @param {Rational} x @returns {number} */
export function toNumber(x) {
  // Not x.n / x.d in BigInt — that truncates. Divide as floats, but keep the
  // exact pair around for anything that needs it.
  return Number(x.n) / Number(x.d);
}

/** @param {Rational} x @returns {string} e.g. "531441/524288" */
export function fraction(x) {
  return x.d === 1n ? `${x.n}` : `${x.n}/${x.d}`;
}

/**
 * Fold a ratio into the octave above 1 — halve it until it is in [1, 2).
 *
 * Stays exact: halving a rational is multiplying its denominator by two, and
 * the comparison that decides when to stop is done on the integers rather than
 * on a float, so a ratio sitting a hair under 2 is never pushed over by rounding.
 *
 * @param {Rational} x
 * @returns {Rational}
 */
export function fold(x) {
  let { n, d } = x;
  while (n >= 2n * d) d *= 2n;
  while (n < d) n *= 2n;
  return rat(n, d);
}

/* --- cents ---------------------------------------------------------------- */

/**
 * The interval between 1 and a ratio, in cents. A cent is 1/1200 of an octave,
 * and the unit exists because the ear hears ratios, not differences: the same
 * *multiplication* sounds like the same step wherever you start from.
 *
 * @param {Rational|number} x
 * @returns {number}
 */
export function cents(x) {
  const r = typeof x === 'number' ? x : toNumber(x);
  return 1200 * Math.log2(r);
}

/* --- the two systems ------------------------------------------------------ */

/** A perfect fifth as Pythagoras had it: three lengths of string against two. */
export const FIFTH = rat(3n, 2n);

/** The octave. The one interval both systems agree on exactly. */
export const OCTAVE = rat(2n, 1n);

/**
 * Twelve fifths stacked, each one folded back into the starting octave.
 *
 * Step 0 is the root. Step 12 is where you arrive after going round the circle
 * of fifths — which is *not* where you started, and the ratio between the two
 * is this function's reason for existing.
 *
 * @param {number} steps
 * @returns {Rational[]} steps + 1 entries, folded into [1, 2)
 */
export function circleOfFifths(steps = 12) {
  const out = [rat(1n, 1n)];
  let here = rat(1n, 1n);
  for (let i = 0; i < steps; i++) {
    here = fold(mul(here, FIFTH));
    out.push(here);
  }
  return out;
}

/**
 * The Pythagorean comma: what twelve fifths overshoot seven octaves by.
 *
 * 3^12 / 2^19. Held exactly, because the interesting fact about it is that it
 * is not zero and *cannot* be zero — no power of 3 is ever a power of 2, so no
 * number of perfect fifths ever lands on a perfect octave, and the circle of
 * fifths is not a circle in any tuning that keeps both intervals pure. This is
 * not a limitation of instruments. It is a fact about the integers.
 */
export const COMMA = rat(3n ** 12n, 2n ** 19n);

/**
 * Equal temperament: the octave cut into twelve identical multiplications.
 *
 * @param {number} semitones
 * @returns {number} a ratio, irrational for every semitone but 0 and 12
 */
export function equal(semitones) {
  return 2 ** (semitones / 12);
}

/**
 * The just intervals of the ordinary major scale's neighbourhood, by semitone.
 *
 * These are the small-whole-number ratios the ear picks out as "in tune",
 * because that is exactly when two notes' harmonics coincide instead of
 * beating. Where a choice exists (the tritone has no uncontested just form)
 * the room does not use the interval, and it is left out rather than invented.
 *
 * @type {Record<number, Rational>}
 */
export const JUST = {
  0: rat(1n, 1n), //  unison
  3: rat(6n, 5n), //  minor third
  4: rat(5n, 4n), //  major third
  5: rat(4n, 3n), //  fourth
  7: rat(3n, 2n), //  fifth
  8: rat(8n, 5n), //  minor sixth
  9: rat(5n, 3n), //  major sixth
  12: rat(2n, 1n), // octave
};

/**
 * Interpolate between the just interval and the equal-tempered one.
 *
 * The blend is done in cents, not in ratios. Halfway between 5/4 and 2^(4/12)
 * by ratio and halfway by cents are different numbers, and cents is the right
 * one: it is the log scale, which is the scale the ear is actually on, so
 * dragging the dial at a constant speed sounds like a constant drift.
 *
 * @param {number} semitones
 * @param {number} t 0 = just, 1 = equal
 * @returns {number} a ratio
 */
export function temper(semitones, t) {
  const just = JUST[semitones];
  if (!just) return equal(semitones);
  const from = cents(just);
  const to = semitones * 100;
  return 2 ** ((from + (to - from) * t) / 1200);
}

/* --- what you actually hear ----------------------------------------------- */

/**
 * The beat rate between two frequencies, in beats per second.
 *
 * Two near-identical tones sum to one tone at the average frequency whose
 * amplitude swells and fades at the *difference* frequency. That throb is the
 * only part of this entire subject you do not need to be told about, and it is
 * why the room can put a number on the wall and then let you check it with your
 * ears rather than with your trust.
 *
 * @param {number} a Hz
 * @param {number} b Hz
 * @returns {number} Hz
 */
export function beatHz(a, b) {
  return Math.abs(a - b);
}

/**
 * Nearest coinciding partials of two tones, which is what actually beats when
 * the interval is wide. A fifth's tones are 1.5 apart and do not beat against
 * each other directly — what beats is the third harmonic of the lower note
 * against the second harmonic of the upper.
 *
 * @param {number} lower Hz
 * @param {number} upper Hz
 * @param {number} num numerator of the just ratio being approximated (e.g. 3)
 * @param {number} den denominator (e.g. 2)
 * @returns {number} Hz, the rate at which the interval throbs
 */
export function partialBeatHz(lower, upper, num, den) {
  return Math.abs(lower * num - upper * den);
}
