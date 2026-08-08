// tools/check-comma.mjs
//
// Room 08 quotes eleven numbers on its wall. This recomputes every one of them
// from the ratios and fails if any has drifted, so the room cannot start lying
// after an edit. Same contract as tools/check-bpe.mjs: the wall text is not
// trusted, it is derived.
//
//   node tools/check-comma.mjs

import {
  rat,
  mul,
  fold,
  fraction,
  toNumber,
  cents,
  equal,
  temper,
  beatHz,
  partialBeatHz,
  circleOfFifths,
  COMMA,
  FIFTH,
  JUST,
} from '../lib/temperament.js';

let failures = 0;

function eq(label, got, want) {
  const ok = got === want;
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}: ${got}${ok ? '' : ` (expected ${want})`}`);
}

function near(label, got, want, tol = 5e-5) {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) failures++;
  console.log(
    `${ok ? '  ok  ' : ' FAIL '} ${label}: ${got.toFixed(4)}${ok ? '' : ` (expected ${want})`}`,
  );
}

console.log('\nThe comma is exactly a fraction, and exactly this one');

// The central claim. Twelve fifths do not equal seven octaves, and the gap is
// not approximately anything — it is 3^12 over 2^19, in whole numbers.
eq('3^12 / 2^19', fraction(COMMA), '531441/524288');
eq('numerator is 3^12', COMMA.n, 3n ** 12n);
eq('denominator is 2^19', COMMA.d, 2n ** 19n);

// Walking the circle one fifth at a time has to land on that same fraction. If
// this ever disagreed with the constant above, the wheel the room draws would
// not be the number the room quotes.
const circle = circleOfFifths(12);
eq('twelve folded fifths land on the comma', fraction(circle[12]), fraction(COMMA));
eq('the circle has thirteen positions', circle.length, 13);

// It cannot be zero, and the reason is arithmetic rather than acoustics: an
// odd number is never an even one. Checked rather than asserted.
eq('3^12 is odd, so it is never a power of two', (3n ** 12n) % 2n, 1n);

// Every intermediate step must sit inside one octave, or the wheel would be
// drawing a position it had not actually folded.
const folded = circle.every((r) => toNumber(r) >= 1 && toNumber(r) < 2);
eq('every step is folded into [1, 2)', folded, true);

console.log('\nThe two systems, in cents');

near('just fifth', cents(FIFTH), 701.955);
near('equal fifth is exactly 700', cents(equal(7)), 700);
near('tempered fifth is flat by', cents(FIFTH) - 700, 1.955);
near('just major third', cents(JUST[4]), 386.3137);
near('tempered major third is sharp by', 400 - cents(JUST[4]), 13.6863);
near('the comma, in cents', cents(COMMA), 23.46);

// The comma is also exactly twelve tempered-fifth deficits. This is the
// sentence the room puts on the wall — equal temperament pays the comma off by
// dividing it twelve ways — and it is checked here rather than believed.
near('twelve deficits make the comma', 12 * (cents(FIFTH) - 700), cents(COMMA));

console.log('\nWhat beats, at a 220 Hz root');

const ROOT = 220;
const just3 = ROOT * toNumber(JUST[4]);
const just5 = ROOT * toNumber(JUST[7]);
const et3 = ROOT * equal(4);
const et5 = ROOT * equal(7);

// The comma pair is two tones a comma apart. They are close enough that the
// fundamentals beat directly.
near('comma pair, upper tone', ROOT * toNumber(COMMA), 223.0015, 5e-4);
near('comma pair beats at', beatHz(ROOT, ROOT * toNumber(COMMA)), 3.0015, 5e-4);

// Wider intervals do not beat at their fundamentals — what beats is the pair of
// harmonics that the just ratio would have made coincide. This is why the room
// cannot use pure sine tones: a sine has no harmonics, so a sine third is
// perfectly smooth however badly it is tuned, and the exhibit would be silent
// exactly where it needs to be loudest.
near('just third: harmonics coincide', partialBeatHz(ROOT, just3, 5, 4), 0);
near('just fifth: harmonics coincide', partialBeatHz(ROOT, just5, 3, 2), 0);
near('tempered third beats at', partialBeatHz(ROOT, et3, 5, 4), 8.7305, 5e-4);
near('tempered fifth beats at', partialBeatHz(ROOT, et5, 3, 2), 0.7449, 5e-4);

// The wall says the tempered third is roughly a dozen times worse than the
// tempered fifth. Rather than quote a ratio that would need maintaining, check
// the ordering and the rough size.
const worse = partialBeatHz(ROOT, et3, 5, 4) / partialBeatHz(ROOT, et5, 3, 2);
eq('the third is more than ten times worse than the fifth', worse > 10, true);

console.log('\nThe dial');

// t = 0 must be exactly just and t = 1 exactly equal, or the two ends of the
// dial are not the two things the room says they are.
near('dial at 0 is the just third', temper(4, 0), toNumber(JUST[4]), 1e-12);
near('dial at 1 is the equal third', temper(4, 1), equal(4), 1e-12);
near('dial at 0 is the just fifth', temper(7, 0), toNumber(JUST[7]), 1e-12);
near('dial at 1 is the equal fifth', temper(7, 1), equal(7), 1e-12);

// The blend is linear in cents. Halfway must land halfway on the log scale,
// which is not the same as halfway between the ratios — checked so a future
// edit cannot quietly switch to the wrong midpoint.
near('halfway is halfway in cents', cents(temper(4, 0.5)), (cents(JUST[4]) + 400) / 2, 1e-9);

// The octave is the one interval both systems agree on. If tempering ever moved
// it, every fold in the wheel would be wrong.
near('the octave is untouched at either end', temper(12, 0), temper(12, 1), 1e-12);

// Folding must be exact. A ratio a hair under two must stay under two, and one
// exactly at two must come back to one.
eq('fold keeps a hair under the octave', fraction(fold(rat(2n ** 20n - 1n, 2n ** 19n))), '1048575/524288');
eq('fold brings the octave home', fraction(fold(mul(rat(1n), rat(2n)))), '1');

console.log('\nAnd the sound itself');

// Everything above is arithmetic about ratios. The room makes a stronger claim
// than that: it says you can *hear* these rates. So synthesise the actual tones
// the room builds — six harmonics at 1/n, the same recipe as rooms/08-comma —
// and measure the throb in the result. No audio library and no browser: this is
// sums of sines in an array, then a search for the slow amplitude wobble.

const RATE = 48000;
const HARMONICS = 6;

/** Sum of `freqs`, each rendered with the room's harmonic recipe. */
function render(freqs, seconds) {
  const n = Math.floor(RATE * seconds);
  const buf = new Float64Array(n);
  for (const f of freqs) {
    for (let h = 1; h <= HARMONICS; h++) {
      const w = (2 * Math.PI * f * h) / RATE;
      const a = 1 / h;
      // Bail out above Nyquist rather than aliasing a partial back down into
      // the band being measured, which would invent a beat that is not there.
      if (f * h >= RATE / 2) break;
      for (let i = 0; i < n; i++) buf[i] += a * Math.sin(w * i);
    }
  }
  return buf;
}

/** Short-time RMS — the amplitude envelope, sampled at `ENV_RATE` Hz. */
const ENV_RATE = 200;
function envelope(buf) {
  const win = Math.floor(RATE / ENV_RATE);
  const out = new Float64Array(Math.floor(buf.length / win));
  for (let k = 0; k < out.length; k++) {
    let s = 0;
    for (let i = k * win; i < (k + 1) * win; i++) s += buf[i] * buf[i];
    out[k] = Math.sqrt(s / win);
  }
  // Remove the mean: the beat is the wobble, not the loudness.
  const mean = out.reduce((a, b) => a + b, 0) / out.length;
  for (let k = 0; k < out.length; k++) out[k] -= mean;
  return out;
}

/**
 * Power of the envelope at one frequency, Hann-windowed.
 *
 * The window is not decoration. A mistuned third of harmonic tones wobbles at
 * several rates at once — the pair being listened for at 8.73 Hz, and a much
 * louder rubbing at 48 Hz between a different pair of partials — and without a
 * window the loud fast one leaks all over the slow band and the measurement
 * just reports the edge of the search range.
 */
function bandPower(env, hz) {
  const w = (2 * Math.PI * hz) / ENV_RATE;
  let re = 0;
  let im = 0;
  for (let k = 0; k < env.length; k++) {
    const win = 0.5 - 0.5 * Math.cos((2 * Math.PI * k) / (env.length - 1));
    re += win * env[k] * Math.cos(w * k);
    im += win * env[k] * Math.sin(w * k);
  }
  return Math.hypot(re, im) / env.length;
}

/** The strongest slow wobble in the rendered sound, in beats per second. */
function measureBeat(freqs, seconds, hi = 20) {
  const env = envelope(render(freqs, seconds));
  let best = 0;
  let bestP = 0;
  for (let hz = 0.05; hz <= hi; hz += 0.005) {
    const p = bandPower(env, hz);
    if (p > bestP) {
      bestP = p;
      best = hz;
    }
  }
  return { hz: best, power: bestP };
}

/** Render two bare partials — no harmonics — as the room's isolate mode does. */
function measurePartials(a, b, seconds, hi = 20) {
  const n = Math.floor(RATE * seconds);
  const buf = new Float64Array(n);
  for (const f of [a, b]) {
    const w = (2 * Math.PI * f) / RATE;
    for (let i = 0; i < n; i++) buf[i] += 0.5 * Math.sin(w * i);
  }
  const env = envelope(buf);
  let best = 0;
  let bestP = 0;
  for (let hz = 0.05; hz <= hi; hz += 0.005) {
    const p = bandPower(env, hz);
    if (p > bestP) {
      bestP = p;
      best = hz;
    }
  }
  return { hz: best, power: bestP };
}

// The comma pair is the one case where the two fundamentals themselves nearly
// coincide, so the whole sound throbs and the full tones can be measured
// directly. Three times a second, as the wall says.
const commaHeard = measureBeat([ROOT, ROOT * toNumber(COMMA)], 8);
near('the comma pair is heard beating at', commaHeard.hz, 3.0015, 0.02);

// Wider intervals are different, and this is the room's isolate mode: sound
// only the two partials that the pure ratio would have made coincide. That pair
// is what a piano tuner counts, and with nothing else in the air it is
// unmistakable.
near('isolated partials of the tempered third', measurePartials(5 * ROOT, 4 * et3, 8).hz, 8.7305, 0.02);
near('isolated partials of the tempered fifth', measurePartials(3 * ROOT, 2 * et5, 40, 4).hz, 0.7449, 0.02);

// The pure interval's partials do not merely nearly coincide. They are the same
// number, so there is no wobble to find at all.
eq('the pure third’s two partials are one frequency', 5 * ROOT === 4 * just3, true);
eq('the pure fifth’s two partials are one frequency', 3 * ROOT === 2 * just5, true);

// And in the full harmonic tones, the slow beat appears only when the interval
// is tempered. This is the honest version of the claim: a pure third of
// harmonic tones is not *silent* — its fundamentals are 55 Hz apart and that
// rubbing is simply what an interval sounds like — but the slow beat that the
// tempering introduces is either there or it is not.
const slowIn = (freqs) => bandPower(envelope(render(freqs, 8)), partialBeatHz(ROOT, et3, 5, 4));
const ratio = slowIn([ROOT, et3]) / slowIn([ROOT, just3]);
eq(
  `tempering adds the slow beat, 1000x over (measured ${ratio.toExponential(1)}x)`,
  ratio > 1000,
  true,
);

console.log(
  failures === 0
    ? '\nAll of room 08’s wall figures check out, including the audible ones.\n'
    : `\n${failures} of room 08’s figures are wrong.\n`,
);

process.exit(failures === 0 ? 0 : 1);
