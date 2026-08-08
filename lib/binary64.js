// lib/binary64.js
//
// Taking a double apart, exactly. Room 09 needs three things a browser will
// not tell you: which 64 bits a number is actually stored as, what those bits
// are worth as a decimal *exactly* rather than as many digits as printing feels
// like showing, and which number comes next.
//
// The exactness is the whole point of the file. `(0.1).toString()` is "0.1",
// which is a lie of omission — it is the shortest decimal that reads back as
// the same double, not the value of the double. `toFixed(20)` gets closer and
// then stops, mid-number. The real value is 55 digits long and it is not
// approximately anything: a double is an integer times a power of two, so its
// decimal expansion always terminates, and it can be written out in full.
//
// Nothing here uses floating point to describe floating point. All the
// arithmetic is BigInt.

/** A scratch view. One allocation, reused — these functions get called per
 *  keystroke and per row of the ladder. */
const view = new DataView(new ArrayBuffer(8));

/**
 * The raw fields of a binary64 value.
 *
 * @param {number} x
 * @returns {{ sign: number, biasedExponent: number, storedMantissa: bigint,
 *             significand: bigint, exponent: number, subnormal: boolean }}
 *   `significand * 2**exponent` is the value exactly.
 */
export function decompose(x) {
  view.setFloat64(0, x);
  const bits = view.getBigUint64(0);

  const sign = Number(bits >> 63n);
  const biasedExponent = Number((bits >> 52n) & 0x7ffn);
  const storedMantissa = bits & 0xf_ffff_ffff_ffffn;

  // A biased exponent of 0 means the leading 1 is not there — the subnormals,
  // which is how the format gets closer to zero than its exponent range allows.
  const subnormal = biasedExponent === 0;
  const significand = subnormal ? storedMantissa : storedMantissa | (1n << 52n);
  const exponent = (subnormal ? 1 : biasedExponent) - 1075;

  return { sign, biasedExponent, storedMantissa, significand, exponent, subnormal };
}

/**
 * The 64 bits, as a string of '0' and '1'.
 * @param {number} x
 * @returns {string} 64 characters
 */
export function bitString(x) {
  view.setFloat64(0, x);
  return view.getBigUint64(0).toString(2).padStart(64, '0');
}

/**
 * The exact value of a double, written out in full as a decimal.
 *
 * Every double is `m * 2**e` for integers m and e. When e is negative that is
 * `m / 2**k`, and multiplying top and bottom by `5**k` turns the denominator
 * into `10**k` — so the exact decimal is the integer `m * 5**k` with the point
 * moved k places left. No rounding happens anywhere, and the expansion always
 * terminates, because every negative power of two is a terminating decimal.
 *
 * @param {number} x
 * @returns {string}
 */
export function exactDecimal(x) {
  if (!Number.isFinite(x)) return String(x);

  const { sign, significand, exponent } = decompose(x);
  const minus = sign ? '-' : '';
  if (significand === 0n) return `${minus}0`;

  if (exponent >= 0) return minus + (significand << BigInt(exponent)).toString();

  const k = -exponent;
  const scaled = (significand * 5n ** BigInt(k)).toString().padStart(k + 1, '0');
  const whole = scaled.slice(0, scaled.length - k);
  const frac = scaled.slice(scaled.length - k).replace(/0+$/, '');
  return minus + (frac ? `${whole}.${frac}` : whole);
}

/**
 * The next representable double above x. The real `nextafter`: increment the
 * bit pattern, because for positive numbers the ordering of doubles is exactly
 * the ordering of their bit patterns read as integers. That is not a
 * coincidence — the format was designed so that it would be true.
 *
 * @param {number} x
 * @returns {number}
 */
export function nextUp(x) {
  if (Number.isNaN(x) || x === Infinity) return x;
  if (x === 0) return Number.MIN_VALUE; // steps off both +0 and −0
  view.setFloat64(0, x);
  view.setBigUint64(0, view.getBigUint64(0) + (x > 0 ? 1n : -1n));
  return view.getFloat64(0);
}

/**
 * The next representable double below x.
 * @param {number} x
 * @returns {number}
 */
export function nextDown(x) {
  if (Number.isNaN(x) || x === -Infinity) return x;
  if (x === 0) return -Number.MIN_VALUE;
  view.setFloat64(0, x);
  view.setBigUint64(0, view.getBigUint64(0) + (x > 0 ? -1n : 1n));
  return view.getFloat64(0);
}

/**
 * The distance to the next representable value above — the size of one square
 * of the grid at this magnitude. This is the number the room is about.
 *
 * @param {number} x
 * @returns {number}
 */
export function gap(x) {
  return nextUp(Math.abs(x)) - Math.abs(x);
}

/**
 * How far a double is from the decimal that was typed to get it.
 *
 * Both sides are turned into exact rationals over a common power of ten first,
 * so the answer is the true error and not another rounded number. Returned as
 * a decimal string with a sign, because the whole point is that it is not zero.
 *
 * @param {string} typed a decimal literal, e.g. "0.1"
 * @returns {{ error: string, low: boolean } | null} null if `typed` is not a
 *   plain decimal (exponents, hex and the like are the caller's problem)
 */
export function errorAgainst(typed) {
  const m = /^\s*(-?)(\d*)(?:\.(\d*))?\s*$/.exec(typed);
  if (!m || (!m[2] && !m[3])) return null;

  const [, neg, whole = '', frac = ''] = m;
  const asked = BigInt((whole || '0') + frac); // over 10**frac.length
  const scale = BigInt(frac.length);

  const got = decompose(Number(typed));
  if (got.significand === 0n && asked === 0n) return { error: '0', low: false };

  // Put both over 10**scale * 2**k so they can be subtracted as integers.
  const k = got.exponent < 0 ? BigInt(-got.exponent) : 0n;
  const gotScaled =
    got.exponent >= 0
      ? got.significand << BigInt(got.exponent)
      : got.significand * 5n ** k; // over 10**k
  const gotOver = got.exponent >= 0 ? 0n : k;

  // Common denominator 10**max(scale, gotOver).
  const d = scale > gotOver ? scale : gotOver;
  const askedN = asked * 10n ** (d - scale) * (neg ? -1n : 1n);
  const gotN = gotScaled * 10n ** (d - gotOver) * (got.sign ? -1n : 1n);

  const diff = gotN - askedN;
  if (diff === 0n) return { error: '0', low: false };

  const sign = diff < 0n ? '-' : '+';
  const mag = (diff < 0n ? -diff : diff).toString().padStart(Number(d) + 1, '0');
  const whole2 = mag.slice(0, mag.length - Number(d));
  const frac2 = mag.slice(mag.length - Number(d)).replace(/0+$/, '');

  return {
    error: sign + (frac2 ? `${whole2}.${frac2}` : whole2),
    low: diff < 0n,
  };
}
