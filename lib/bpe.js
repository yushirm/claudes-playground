// lib/bpe.js
//
// The merge replay behind room 07.
//
// Room 01 hands you the tokenizer's answer. This is the working: the same
// cl100k_base merge table applied one pair at a time, in the order the table
// learned those pairs, until nothing adjacent is left that it has an entry for.
//
// Nothing here is a reconstruction of the algorithm from a description of it.
// It is the algorithm — the same loop the vendored encoder runs in
// bytePairMerge(), instrumented so each join can be stopped on and looked at.
// tools/check-bpe.mjs asserts that a plan built here ends on exactly the tokens
// encode() returns, over every pre-token piece in the repository's own prose.

import { pretokens, rankOf, describeBytes } from './tokenizer.js';

/**
 * @typedef {object} Part
 * @property {Uint8Array} bytes  the bytes this part currently holds
 * @property {number|null} entry the merge table entry, once it has one
 * @property {string} text       the part decoded on its own, when that is possible
 * @property {boolean} whole     true if these bytes are valid UTF-8 by themselves
 * @property {string} hex        the bytes as spaced uppercase hex
 *
 * @typedef {object} Step
 * @property {number} entry  the merge table entry number applied
 * @property {number} piece  which pre-token piece it happened in
 * @property {number} at     index of the left part of the joined pair, at that moment
 * @property {string} text   what the join made, decoded if it can be
 * @property {boolean} whole whether what it made is text yet
 * @property {string} hex    the bytes it made
 *
 * @typedef {object} Refusal
 * @property {number} piece  which piece could not go further
 * @property {number} at     index of the left part of the pair that has no entry
 * @property {string} text   the pair joined, as it would have read
 * @property {boolean} whole whether that would have been text
 */

/**
 * Work out every merge the encoder would make on this input, in order.
 *
 * The encoder handles each pre-token piece separately. This returns one
 * timeline across all of them, sorted by entry number — see the room's
 * Machinery note for why that is faithful rather than a rearrangement, and
 * tools/check-bpe.mjs for the check that it is.
 *
 * @param {string} input
 * @returns {{
 *   pieces: { text: string, bytes: Uint8Array, start: number, merges: number }[],
 *   steps: Step[],
 *   refusals: Refusal[],
 *   final: Part[][]
 * }}
 */
export function mergePlan(input) {
  const pieces = pretokens(input);
  const steps = [];
  const refusals = [];
  const perPiece = [];

  for (let p = 0; p < pieces.length; p++) {
    const run = replay(pieces[p].bytes);
    perPiece.push(run.steps.length);
    for (const step of run.steps) steps.push({ ...step, piece: p });
    for (const pair of run.refusals) refusals.push({ ...pair, piece: p });
  }

  // Ascending entry number. Array.prototype.sort is stable, and the steps went
  // in piece by piece and in the order each piece made them, so two merges that
  // share an entry number stay in the order the encoder would have made them.
  steps.sort((a, b) => a.entry - b.entry);

  return {
    pieces: pieces.map((piece, p) => ({ ...piece, merges: perPiece[p] })),
    steps,
    refusals,
    final: stateAt({ pieces, steps }, steps.length).pieces,
  };
}

/**
 * The pieces as they stand after `step` merges.
 *
 * A pure function of the step number rather than a state the caller advances,
 * so the room's scrub bar can go backwards as freely as forwards and lands on
 * the same thing either way.
 *
 * @param {{ pieces: { bytes: Uint8Array }[], steps: Step[] }} plan
 * @param {number} step
 * @returns {{ pieces: Part[][], pending: Step|null }}
 */
export function stateAt(plan, step) {
  const applied = Math.max(0, Math.min(step, plan.steps.length));

  // How many of each piece's own merges fall within the first `applied` of the
  // shared timeline.
  const counts = new Array(plan.pieces.length).fill(0);
  for (let i = 0; i < applied; i++) counts[plan.steps[i].piece]++;

  return {
    pieces: plan.pieces.map((piece, p) => replay(piece.bytes, counts[p]).parts),
    pending: applied < plan.steps.length ? plan.steps[applied] : null,
  };
}

/**
 * Merge one pre-token piece, optionally stopping early.
 *
 * This is the vendored encoder's bytePairMerge loop: repeatedly find the
 * adjacent pair with the lowest entry number and join it, until no adjacent
 * pair has an entry at all. The only additions are that it records what it did
 * and, at the end, which pairs it was refused.
 *
 * @param {Uint8Array} bytes
 * @param {number} [limit] stop after this many merges; omit to run to the end
 * @returns {{ parts: Part[], steps: Omit<Step,'piece'>[], refusals: Omit<Refusal,'piece'>[] }}
 */
function replay(bytes, limit = Infinity) {
  let parts = Array.from(bytes, (_, i) => ({ start: i, end: i + 1 }));
  const steps = [];

  while (parts.length > 1 && steps.length < limit) {
    let best = null;
    for (let i = 0; i < parts.length - 1; i++) {
      const entry = rankOf(bytes.subarray(parts[i].start, parts[i + 1].end));
      if (entry === null) continue;
      if (best === null || entry < best.entry) best = { entry, at: i };
    }
    if (best === null) break;

    parts[best.at] = { start: parts[best.at].start, end: parts[best.at + 1].end };
    parts.splice(best.at + 1, 1);

    const made = bytes.slice(parts[best.at].start, parts[best.at].end);
    steps.push({ entry: best.entry, at: best.at, ...describeBytes(made) });
  }

  // Only meaningful once the piece has actually run out — mid-replay there are
  // plenty of pairs without entries and they are not why anything stopped.
  const refusals = [];
  if (steps.length < limit) {
    for (let i = 0; i < parts.length - 1; i++) {
      const span = bytes.slice(parts[i].start, parts[i + 1].end);
      if (rankOf(span) === null) refusals.push({ at: i, ...describeBytes(span) });
    }
  }

  return { parts: parts.map((p) => part(bytes, p)), steps, refusals };
}

function part(bytes, { start, end }) {
  const span = bytes.slice(start, end);
  return { bytes: span, entry: rankOf(span), ...describeBytes(span) };
}
