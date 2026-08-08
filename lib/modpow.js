// lib/modpow.js
//
// The two primality tests behind room 11, both instrumented so the room can
// show the working rather than the verdict.
//
// Everything is BigInt. Not for size — the numbers here are small — but because
// modular arithmetic on doubles goes wrong silently the moment a product passes
// 2^53, and room 09 is two doors down explaining exactly why. A room about a
// test that is right until it isn't should not be built on arithmetic that is
// right until it isn't.

/** @param {bigint} a @param {bigint} b @returns {bigint} */
export function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a < 0n ? -a : a;
}

/**
 * base**exp mod m, by square-and-multiply.
 * @param {bigint} base @param {bigint} exp @param {bigint} m
 * @returns {bigint}
 */
export function modPow(base, exp, m) {
  let result = 1n;
  let b = base % m;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return result;
}

/**
 * The same computation, with every step kept.
 *
 * The room draws this because "raise to the power of five hundred and sixty"
 * sounds like something a computer does and nothing a person can watch. Ten
 * squarings is something a person can watch.
 *
 * @param {bigint} base @param {bigint} exp @param {bigint} m
 * @returns {{ bit: number, square: bigint, multiplied: boolean, running: bigint }[]}
 */
export function ladder(base, exp, m) {
  const steps = [];
  let result = 1n;
  let b = base % m;
  let e = exp;
  while (e > 0n) {
    const bit = Number(e & 1n);
    if (bit) result = (result * b) % m;
    steps.push({ bit, square: b, multiplied: Boolean(bit), running: result });
    b = (b * b) % m;
    e >>= 1n;
  }
  return steps;
}

/**
 * Write n − 1 as 2^s · d with d odd.
 * @param {bigint} n
 * @returns {{ s: number, d: bigint }}
 */
export function split(n) {
  let d = n - 1n;
  let s = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    s++;
  }
  return { s, d };
}

/**
 * Fermat's test: if n is prime then a^(n−1) ≡ 1 for every a not divisible by n.
 * The converse is what this room is about.
 *
 * @param {bigint} n @param {bigint} a
 * @returns {{ value: bigint, passes: boolean, coprime: boolean, steps: ReturnType<typeof ladder> }}
 */
export function fermat(n, a) {
  const value = modPow(a, n - 1n, n);
  return {
    value,
    passes: value === 1n,
    coprime: gcd(a, n) === 1n,
    steps: ladder(a, n - 1n, n),
  };
}

/**
 * Miller–Rabin: the same exponentiation, watched on the way up.
 *
 * If n is prime the only square roots of 1 are ±1. So instead of computing
 * a^(n−1) in one go, take a^d and square it s times — that reaches a^(n−1)
 * either way — and look at what passes through. If the sequence arrives at 1
 * from something that is not ±1, that something is a square root of 1 which
 * should not exist, and n is composite. The extra information costs nothing:
 * it is the same multiplications, with someone watching.
 *
 * @param {bigint} n @param {bigint} a
 * @returns {{ passes: boolean, s: number, d: bigint, sequence: bigint[],
 *             why: string, culprit: bigint | null, factor: bigint | null }}
 */
export function millerRabin(n, a) {
  const { s, d } = split(n);
  const sequence = [modPow(a, d, n)];
  for (let i = 0; i < s; i++) {
    sequence.push((sequence[sequence.length - 1] ** 2n) % n);
  }

  const first = sequence[0];
  if (first === 1n || first === n - 1n) {
    return {
      passes: true,
      s,
      d,
      sequence,
      why:
        first === 1n
          ? 'a^d is already 1, so every squaring after it is 1 too. Nothing suspicious ever happens.'
          : 'a^d is −1, and −1 squared is 1. That is a legitimate way to reach 1.',
      culprit: null,
      factor: null,
    };
  }

  for (let i = 1; i <= s; i++) {
    if (sequence[i] === n - 1n) {
      return {
        passes: true,
        s,
        d,
        sequence,
        why: 'the sequence reaches −1, which squares to 1 legitimately.',
        culprit: null,
        factor: null,
      };
    }
    if (sequence[i] === 1n) {
      // Arrived at 1 from something that is not ±1. That value is a square root
      // of 1 that a prime modulus cannot have — and it does more than convict:
      // if x² ≡ 1 then n divides (x−1)(x+1) while dividing neither, so a
      // common factor with either one is a genuine factor of n.
      const culprit = sequence[i - 1];
      return {
        passes: false,
        s,
        d,
        sequence,
        why: `${culprit} squares to 1, and it is neither 1 nor ${n - 1n}. A prime has only two square roots of 1, so n is not prime.`,
        culprit,
        factor: gcd(culprit - 1n, n),
      };
    }
  }

  return {
    passes: false,
    s,
    d,
    sequence,
    why: 'the sequence never reaches 1 or −1 at all, so a^(n−1) is not even 1 — plain Fermat would have caught this one.',
    culprit: null,
    factor: null,
  };
}

/**
 * Try every base from 2 to n−2 and count what happens.
 *
 * The three-way split is the point. A base can lie, or it can catch n honestly,
 * or it can "catch" n only because it happens to share a factor with it — which
 * is not a primality test doing its job, it is a trial division getting lucky.
 *
 * @param {bigint} n
 * @param {(n: bigint, a: bigint) => boolean} passes
 * @returns {{ liars: number, witnesses: number, sharing: number, total: number }}
 */
export function sweep(n, passes) {
  let liars = 0;
  let witnesses = 0;
  let sharing = 0;
  for (let a = 2n; a < n - 1n; a++) {
    if (gcd(a, n) > 1n) {
      sharing++;
      continue;
    }
    if (passes(n, a)) liars++;
    else witnesses++;
  }
  return { liars, witnesses, sharing, total: Number(n) - 3 };
}

/**
 * The smallest prime factor, by trial division. Only ever called on the room's
 * own small examples, and it is how the room knows the truth it is comparing
 * the tests against.
 *
 * @param {bigint} n
 * @returns {bigint | null} null if n is prime
 */
export function smallestFactor(n) {
  if (n < 2n) return null;
  if (n % 2n === 0n) return n === 2n ? null : 2n;
  for (let f = 3n; f * f <= n; f += 2n) if (n % f === 0n) return f;
  return null;
}

/**
 * The full factorisation, for the wall.
 * @param {bigint} n
 * @returns {bigint[]}
 */
export function factorise(n) {
  const out = [];
  let m = n;
  for (let f = 2n; f * f <= m; f += f === 2n ? 1n : 2n) {
    while (m % f === 0n) {
      out.push(f);
      m /= f;
    }
  }
  if (m > 1n) out.push(m);
  return out;
}

/**
 * Is n a Carmichael number — composite, and yet passing Fermat's test for
 * every base that does not share a factor with it?
 *
 * Computed by exhaustion rather than by Korselt's criterion, because the room's
 * claim is the exhaustive one: *no* base catches it.
 *
 * @param {bigint} n
 * @returns {boolean}
 */
export function isCarmichael(n) {
  if (smallestFactor(n) === null) return false;
  for (let a = 2n; a < n - 1n; a++) {
    if (gcd(a, n) === 1n && modPow(a, n - 1n, n) !== 1n) return false;
  }
  return true;
}
