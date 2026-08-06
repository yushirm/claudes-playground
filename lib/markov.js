// lib/markov.js
//
// A character-level Markov chain with a temperature control, shared by room 03
// (one of these) and room 06 (twelve of them, differing only in seed).
//
// Character-level rather than word-level on purpose. A word-level chain fails
// at high temperature by picking an unlikely *word*, which reads as a non
// sequitur but still reads as words; to make it come apart into noise you have
// to rig something extra, and that rigging would then need confessing. A
// character chain comes apart on its own, in the right order: sense first, then
// words, then letters. Nothing has to be added to make the arc happen.

/**
 * A seeded pseudo-random generator. mulberry32 — small, fast, and good enough
 * that twelve panes started from twelve seeds look genuinely unrelated.
 *
 * Seeded rather than Math.random because room 06 needs to be able to say "the
 * only difference between these panes is the seed" and mean it.
 *
 * @param {number} seed
 * @returns {() => number} a function returning floats in [0, 1)
 */
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build the chain: for every run of `order` characters seen in the text, the
 * characters that followed it and how often.
 *
 * @param {string} text
 * @param {number} order how many characters of context to condition on
 * @returns {object} an opaque model for sample()
 */
export function build(text, order = 5) {
  // Collapse runs of whitespace to single spaces. Without this the chain spends
  // most of its probability mass learning the shape of the line wrapping in the
  // source file, which is not a fact about the prose.
  const clean = text.replace(/\s+/g, ' ').trim();

  /** @type {Map<string, Map<string, number>>} */
  const table = new Map();

  for (let i = 0; i + order < clean.length; i++) {
    const context = clean.slice(i, i + order);
    const next = clean[i + order];
    let counts = table.get(context);
    if (!counts) table.set(context, (counts = new Map()));
    counts.set(next, (counts.get(next) ?? 0) + 1);
  }

  // Sentence openings, so a run begins where a sentence begins. A capital after
  // a space is not enough — that catches "of English, which", and a chain that
  // opens mid-clause looks broken before it has done anything wrong. Require
  // the capital to follow a full stop.
  const starts = [];
  for (let i = 0; i + order < clean.length; i++) {
    const opensText = i === 0;
    const opensSentence =
      i >= 2 &&
      clean[i - 1] === ' ' &&
      /[.?!]/.test(clean[i - 2]) &&
      /[A-Z]/.test(clean[i]);
    if (opensText || opensSentence) starts.push(clean.slice(i, i + order));
  }

  const alphabet = [...new Set(clean)].sort();

  return { table, starts, order, alphabet, text: clean };
}

// Every character in the corpus gets this much of a pseudo-count after every
// context, whether it was ever seen there or not.
//
// This is not a trick to make the room more dramatic — it repairs a real
// difference between this toy and the thing it stands for. A language model
// holds a probability for *every* token at every step, most of them tiny but
// none of them zero, and raising the temperature is what lifts those tiny ones
// into contention. A raw Markov chain has hard zeros instead: characters it
// never saw after a given context can never appear, at any temperature, so the
// text can degrade in its choice of words but never in its choice of letters.
// The floor gives the chain the same shape of distribution the real mechanism
// has. At temperature 1 it is far too small to notice. Past 1.5 it is what
// lets the words come apart into letters.
const FLOOR = 0.0006;

/**
 * Reweight a distribution by temperature and draw from it.
 *
 * At T close to 0 this is argmax — always the commonest continuation, which is
 * deterministic and therefore eventually periodic. At T = 1 it is the observed
 * distribution. Above 1 it flattens toward every seen continuation being equally
 * likely, which is where the text comes apart.
 */
function draw(counts, alphabet, temperature, random) {
  // Below this the exponent stops being numerically meaningful, and taking the
  // commonest continuation is exactly what the limit means anyway. This is the
  // deterministic setting, and deterministic means eventually periodic: it is
  // why the dial at zero produces a loop.
  if (temperature < 0.05) {
    let best = null;
    let bestN = -1;
    for (const [ch, n] of counts) {
      if (n > bestN) {
        bestN = n;
        best = ch;
      }
    }
    return best;
  }

  const observed = [...counts].reduce((a, [, n]) => a + n, 0);
  const total = observed + FLOOR * alphabet.length;

  let sum = 0;
  const weights = new Array(alphabet.length);
  for (let i = 0; i < alphabet.length; i++) {
    const p = ((counts.get(alphabet[i]) ?? 0) + FLOOR) / total;
    sum += weights[i] = Math.pow(p, 1 / temperature);
  }

  let r = random() * sum;
  for (let i = 0; i < alphabet.length; i++) {
    r -= weights[i];
    if (r <= 0) return alphabet[i];
  }
  return alphabet[alphabet.length - 1];
}

/**
 * Generate text from the chain.
 *
 * @param {object} model            from build()
 * @param {object} opts
 * @param {number} opts.temperature 0 to 2
 * @param {number} opts.length      characters to produce
 * @param {() => number} opts.random
 * @param {string} [opts.start]     starting context; picked from sentence
 *                                  openings if not given
 * @returns {string}
 */
export function sample(model, { temperature = 0.7, length = 600, random = Math.random, start } = {}) {
  const { table, starts, order, alphabet } = model;

  const prompted = Boolean(start && start.length >= order);

  // The chain only ever conditions on the last `order` characters, but a caller
  // that supplied a prompt expects the prompt back in the output — room 06
  // shows twelve panes sharing one, and a prompt that vanished from the text
  // would make the thing it is demonstrating invisible.
  let context = prompted
    ? start.slice(-order)
    : starts[Math.floor(random() * starts.length)];

  let out = prompted ? start : context;

  for (let i = 0; i < length; i++) {
    let counts = table.get(context);

    // An unseen context. This only happens if a caller supplies a `start` the
    // corpus never contained — the chain's own output is always a context it
    // has seen. Back off to any context sharing the tail, and if there is
    // nothing, restart from a sentence opening rather than stopping dead.
    if (!counts) {
      const fallback = backoff(model, context);
      if (!fallback) {
        context = starts[Math.floor(random() * starts.length)];
        out += ' ' + context;
        continue;
      }
      counts = fallback;
    }

    const next = draw(counts, alphabet, temperature, random);
    out += next;
    context = (context + next).slice(-order);
  }

  return out;
}

/**
 * Find counts for the longest suffix of `context` the chain has actually seen.
 * @returns {Map<string, number> | null}
 */
function backoff(model, context) {
  for (let n = context.length - 1; n >= 1; n--) {
    const tail = context.slice(-n);
    for (const [ctx, counts] of model.table) {
      if (ctx.endsWith(tail)) return counts;
    }
  }
  return null;
}
