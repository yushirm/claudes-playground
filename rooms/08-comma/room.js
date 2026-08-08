// rooms/08-comma/room.js
//
// Two mechanisms. The wheel walks the circle of fifths and fails to close it.
// The triad lets you hear what closing it cost.
//
// All the arithmetic lives in lib/temperament.js so that a script with no
// browser can check it. This file is the wheel, the meter, and the sound.

import { cutSigns } from '../../lib/type.js';
import {
  circleOfFifths,
  fraction,
  toNumber,
  cents,
  temper,
  beatHz,
  partialBeatHz,
  COMMA,
  JUST,
} from '../../lib/temperament.js';

cutSigns();

const ROOT = 220;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (id) => document.getElementById(id);
const announce = $('announce');

/* --- sound ---------------------------------------------------------------- */
//
// One AudioContext, created on the first click and never before — an unasked-for
// context is a small rudeness and some browsers refuse it anyway.

const audio = { ctx: null, master: null, wave: null, voices: [], timer: 0 };

/** How long a sound runs before fading on its own. The slowest thing here beats
 *  at 0.745 Hz, so anything under about six seconds cuts off before the visitor
 *  has heard a second swell and the meter looks like a lie. */
const SUSTAIN = 8;

function ensureAudio() {
  if (audio.ctx) return audio.ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;

  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  // Six harmonics at 1/n. This is the load-bearing decision in the room: the
  // beating being demonstrated happens *between harmonics* — the fifth harmonic
  // of the root against the fourth harmonic of the third — so a sine wave, which
  // has none, would render a badly tuned third perfectly smooth. Six is enough
  // to carry every partial the meter names and few enough to stay soft.
  const N = 7;
  const real = new Float32Array(N);
  const imag = new Float32Array(N);
  for (let n = 1; n < N; n++) imag[n] = 1 / n;

  audio.ctx = ctx;
  audio.master = master;
  audio.wave = ctx.createPeriodicWave(real, imag);
  return ctx;
}

function stopSound(message = 'Nothing sounds until you ask it to.') {
  clearTimeout(audio.timer);
  const ctx = audio.ctx;
  if (ctx) {
    const now = ctx.currentTime;
    for (const { osc, gain } of audio.voices) {
      // Cancel first, then pin the current value, or the ramp starts from
      // whatever was scheduled rather than from where the envelope actually is,
      // and a stop mid-attack clicks.
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);
      osc.stop(now + 0.15);
    }
  }
  audio.voices = [];
  if (message) $('audio-status').textContent = message;
}

/**
 * Sound a set of frequencies together until stopped.
 * @param {number[]} freqs
 * @param {string} label what to say on the status line
 * @param {boolean} pure sine tones instead of the six-harmonic voice, for
 *   sounding bare partials
 */
function play(freqs, label, pure = false) {
  const ctx = ensureAudio();
  if (!ctx) {
    $('audio-status').textContent =
      'This browser has no Web Audio, so the sounding parts of this room will not run. Everything else does.';
    return;
  }
  stopSound(null);
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  for (const f of freqs) {
    const osc = ctx.createOscillator();
    if (pure) osc.type = 'sine';
    else osc.setPeriodicWave(audio.wave);
    osc.frequency.value = f;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.34 / freqs.length, now + 0.03);

    osc.connect(gain).connect(audio.master);
    osc.start(now);
    audio.voices.push({ osc, gain });
  }

  $('audio-status').textContent = `${label} Sounding — it stops on its own after eight seconds.`;
  announce.textContent = label;
  audio.timer = setTimeout(() => stopSound(), SUSTAIN * 1000);
}

/* --- the wheel ------------------------------------------------------------ */

const CIRCLE = circleOfFifths(12);
let step = 0;

const CX = 160;
const CY = 160;
const R = 116;

/** Cents around the octave to a point on the wheel. 0 cents sits at the top. */
function at(c, r = R) {
  const a = ((c / 1200) * 2 * Math.PI) - Math.PI / 2;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function svg(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function drawTicks() {
  const g = $('wheel-ticks');
  g.replaceChildren();
  g.append(svg('circle', { cx: CX, cy: CY, r: R, class: 'wheel-ring' }));
  // The twelve equal-tempered positions, as the grid the walk is measured
  // against. Faint on purpose: they are the ruler, not the reading.
  for (let i = 0; i < 12; i++) {
    const [x1, y1] = at(i * 100, R - 7);
    const [x2, y2] = at(i * 100, R + 7);
    g.append(svg('line', { x1, y1, x2, y2, class: 'wheel-tick' }));
  }
}

function drawWheel() {
  const chords = $('wheel-chords');
  const dots = $('wheel-dots');
  const gap = $('wheel-gap');
  chords.replaceChildren();
  dots.replaceChildren();
  gap.replaceChildren();

  // Each fifth drawn as a chord across the circle. Twelve of them make a
  // twelve-pointed star, which is the shape of the whole problem: the walk is
  // not going round the rim, it is leaping across and landing near the start.
  for (let i = 0; i < step; i++) {
    const [x1, y1] = at(cents(CIRCLE[i]));
    const [x2, y2] = at(cents(CIRCLE[i + 1]));
    chords.append(svg('line', { x1, y1, x2, y2, class: 'wheel-chord' }));
  }

  for (let i = 0; i <= step; i++) {
    const [x, y] = at(cents(CIRCLE[i]));
    const last = i === step && step > 0;
    dots.append(
      svg('circle', {
        cx: x,
        cy: y,
        r: last ? 6 : 4,
        class: `wheel-dot${last ? ' is-live' : ''}${i === 0 ? ' is-root' : ''}`,
      }),
    );
  }

  if (step === 12) {
    // The gap itself: a band across the rim between where you started and where
    // you came back to. 23.46 cents is 7.04 degrees — small, and not invisible.
    // Drawn as an annulus rather than a wedge from the centre, because a wedge
    // from the centre reads as a pointer at the rim and the thing being shown
    // is a distance along it.
    const end = cents(CIRCLE[12]);
    const r0 = R - 16;
    const r1 = R + 16;
    const [ax, ay] = at(0, r1);
    const [bx, by] = at(end, r1);
    const [cx, cy] = at(end, r0);
    const [dx, dy] = at(0, r0);
    gap.append(
      svg('path', {
        d: `M ${ax} ${ay} A ${r1} ${r1} 0 0 1 ${bx} ${by} L ${cx} ${cy} A ${r0} ${r0} 0 0 0 ${dx} ${dy} Z`,
        class: 'wheel-gap',
      }),
    );
  }
}

function drawVernier() {
  const g = $('vernier-body');
  g.replaceChildren();

  const x0 = 24;
  const w = 592; // 0 to 100 cents across the plate
  const y = 30;
  const px = (c) => x0 + (c / 100) * w;

  g.append(svg('line', { x1: x0, y1: y, x2: x0 + w, y2: y, class: 'vern-rule' }));

  for (let c = 0; c <= 100; c += 10) {
    const major = c % 50 === 0;
    g.append(
      svg('line', {
        x1: px(c),
        y1: y - (major ? 9 : 5),
        x2: px(c),
        y2: y + (major ? 9 : 5),
        class: 'vern-tick',
      }),
    );
  }

  const label = (x, t, cls) => {
    const el = svg('text', { x, y: y + 26, class: cls ?? 'vern-label' });
    el.textContent = t;
    return el;
  };
  g.append(label(px(0), 'the root', 'vern-label vern-start'));
  g.append(label(px(100), 'one semitone', 'vern-label vern-end'));

  const c = cents(COMMA);
  g.append(
    svg('rect', { x: px(0), y: y - 14, width: px(c) - px(0), height: 28, class: 'vern-fill' }),
  );
  g.append(svg('line', { x1: px(c), y1: y - 16, x2: px(c), y2: y + 16, class: 'vern-mark' }));
  const mark = svg('text', { x: px(c), y: y - 22, class: 'vern-label vern-mark-label' });
  mark.textContent = `after twelve fifths — ${c.toFixed(2)} cents`;
  g.append(mark);
}

function renderWheel() {
  const here = CIRCLE[step];
  const c = cents(here);
  const freq = ROOT * toNumber(here);

  $('n-step').textContent = `${step} / 12`;
  $('n-ratio').textContent = fraction(here);
  $('n-cents').textContent = `${c.toFixed(3)} cents`;
  $('n-freq').textContent = `${freq.toFixed(3)} Hz`;
  $('n-ratio').classList.toggle('is-live', step === 12);

  $('step-fifth').disabled = step === 12;
  $('hear-gap').disabled = step !== 12;
  $('gap-status').textContent =
    step === 12
      ? `Two notes, ${ROOT} Hz and ${(ROOT * toNumber(COMMA)).toFixed(2)} Hz, sounded together. They should be the same note.`
      : 'Walk all twelve fifths first, and this will play you the two notes at once.';

  if (step === 0) {
    $('wheel-status').textContent =
      'Start on the root. Twelve perfect fifths should bring you home.';
  } else if (step < 12) {
    const left = 12 - step;
    $('wheel-status').textContent = `${step} ${step === 1 ? 'fifth' : 'fifths'} taken, ${left} to go. Every one of them is exactly three to two.`;
  } else {
    $('wheel-status').textContent =
      `Twelve fifths, every one of them pure, and you have missed the root by ${fraction(COMMA)} — ${cents(COMMA).toFixed(2)} cents sharp. There is no thirteenth fifth that fixes it.`;
    announce.textContent = `Twelve fifths taken. Short of the root by ${cents(COMMA).toFixed(2)} cents.`;
  }

  drawWheel();
}

/* --- the triad ------------------------------------------------------------ */

function blend() {
  return Number($('blend').value) / 1000;
}

/** Frequencies of root, third and fifth at the current dial position. */
function triad() {
  const t = blend();
  return [ROOT, ROOT * temper(4, t), ROOT * temper(7, t)];
}

function renderTriad() {
  const t = blend();
  const [root, third, fifth] = triad();

  const c3 = cents(temper(4, t));
  const c5 = cents(temper(7, t));
  const b3 = partialBeatHz(root, third, 5, 4);
  const b5 = partialBeatHz(root, fifth, 3, 2);

  $('t3-cents').textContent = c3.toFixed(3);
  $('t5-cents').textContent = c5.toFixed(3);

  const off = (n) => (n === 0 ? '0.000' : `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(3)}`);
  $('t3-off').textContent = off(c3 - cents(JUST[4]));
  $('t5-off').textContent = off(c5 - cents(JUST[7]));

  $('t3-beat').textContent = b3.toFixed(2);
  $('t5-beat').textContent = b5.toFixed(2);
  $('t3-beat').classList.toggle('is-live', b3 > 0.005);
  $('t5-beat').classList.toggle('is-live', b5 > 0.005);
}

/* --- wiring --------------------------------------------------------------- */

drawTicks();
drawVernier();
renderWheel();
renderTriad();

$('step-fifth').addEventListener('click', () => {
  if (step < 12) step++;
  renderWheel();
});

$('walk-all').addEventListener('click', () => {
  if (REDUCED) {
    step = 12;
    renderWheel();
    return;
  }
  step = 0;
  renderWheel();
  const tick = () => {
    if (step >= 12) return;
    step++;
    renderWheel();
    setTimeout(tick, 260);
  };
  setTimeout(tick, 260);
});

$('reset-wheel').addEventListener('click', () => {
  step = 0;
  renderWheel();
});

$('hear-gap').addEventListener('click', () => {
  const arrived = ROOT * toNumber(COMMA);
  play(
    [ROOT, arrived],
    `The root at ${ROOT} Hz against ${arrived.toFixed(2)} Hz — ${beatHz(ROOT, arrived).toFixed(2)} beats a second.`,
  );
});

let isolate = false;

/**
 * An interval, either whole or reduced to the two partials that carry the beat.
 *
 * Isolate mode is what a piano tuner actually listens to. A tempered third
 * played whole is a busy sound: the pair being counted throbs at 8.73 Hz, but a
 * different pair of harmonics rubs at 48 Hz and is louder, so the slow beat is
 * in there and buried. Sounding only the two partials that the pure ratio would
 * have made coincide takes the rest of the note away and leaves the beat alone
 * in the room. Nothing is being faked: those two frequencies are already
 * present in the whole tone, at those amplitudes, doing exactly this.
 *
 * @param {number} semitones
 * @param {number} num numerator of the pure ratio
 * @param {number} den denominator
 * @param {string} name
 */
function hearInterval(semitones, num, den, name) {
  const t = blend();
  const upper = ROOT * temper(semitones, t);
  const beat = partialBeatHz(ROOT, upper, num, den);
  const rate = beat < 0.005 ? 'dead still' : `${beat.toFixed(2)} beats a second`;

  if (isolate) {
    play(
      [num * ROOT, den * upper],
      `Just the two partials that should coincide — ${(num * ROOT).toFixed(1)} Hz and ${(den * upper).toFixed(1)} Hz — ${rate}.`,
      true,
    );
  } else {
    play([ROOT, upper], `Root and ${name} — ${rate}.`);
  }
}

$('isolate').addEventListener('click', () => {
  isolate = !isolate;
  const btn = $('isolate');
  btn.setAttribute('aria-pressed', String(isolate));
  btn.classList.toggle('is-on', isolate);
  $('isolate-note').textContent = isolate
    ? 'Hearing only the two partials that the pure ratio would have made land on each other. This is what a tuner counts.'
    : 'Hearing the whole interval, six harmonics a note.';
});

$('hear-third').addEventListener('click', () => hearInterval(4, 5, 4, 'major third'));
$('hear-fifth').addEventListener('click', () => hearInterval(7, 3, 2, 'perfect fifth'));

$('hear-triad').addEventListener('click', () => {
  play(triad(), 'The whole triad.');
});

$('blend').addEventListener('input', () => {
  renderTriad();
  // Retune anything already sounding, so the dial can be dragged while
  // listening. That is the only way to hear the third go bad.
  if (audio.voices.length === 3) {
    const [root, third, fifth] = triad();
    const now = audio.ctx.currentTime;
    const freqs = [root, third, fifth];
    audio.voices.forEach((v, i) => v.osc.frequency.setValueAtTime(freqs[i], now));
  }
});

for (const id of ['stop-a', 'stop-b']) {
  $(id).addEventListener('click', () => stopSound());
}

// Leaving the room with a tone still playing would be rude.
addEventListener('pagehide', () => stopSound(null));
