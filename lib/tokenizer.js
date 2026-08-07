// lib/tokenizer.js
//
// A thin wrapper around the vendored js-tiktoken, pinned to the cl100k_base
// encoding. Everything the museum knows about how text is cut up comes through
// here: room 01 draws the cuts, room 05 counts them, and tools/gen-signage.mjs
// uses this same file to precompute the header cells.
//
// The merge table is 1.1 MB, so loading is explicit and asynchronous. Call
// load() and await it before calling tokenize().

let encoder = null;
let loading = null;

/**
 * Load the encoding. Safe to call repeatedly; the work happens once.
 * @returns {Promise<void>}
 */
export function load() {
  if (loading) return loading;
  loading = (async () => {
    const [{ Tiktoken }, ranks] = await Promise.all([
      import('../vendor/js-tiktoken/lite.js'),
      import('../vendor/js-tiktoken/ranks/cl100k_base.js'),
    ]);
    encoder = new Tiktoken(ranks.default);
  })();
  return loading;
}

/** @returns {boolean} whether tokenize() can be called right now. */
export function ready() {
  return encoder !== null;
}

/** The name of the encoding these seams belong to. */
export const ENCODING = 'cl100k_base';

const utf8 = new TextDecoder('utf-8', { fatal: true });
const lossy = new TextDecoder('utf-8');

/**
 * @typedef {object} Token
 * @property {number} id        the BPE token id
 * @property {string} text      the token decoded on its own, when that is possible
 * @property {Uint8Array} bytes the exact bytes this token stands for
 * @property {number} start     byte offset of the first byte, into the whole input
 * @property {number} end       byte offset one past the last byte
 * @property {boolean} whole    true if these bytes are valid UTF-8 by themselves
 * @property {string} hex       the bytes as spaced uppercase hex, e.g. "F0 9F"
 */

/**
 * Cut a string into tokens, with exact byte offsets.
 *
 * A token is a run of bytes, not a run of characters. Most of the time those
 * bytes happen to be a whole piece of text and `whole` is true. Sometimes they
 * are the first two bytes of an emoji and nothing else — then `whole` is false,
 * `text` is what the decoder makes of it, and `hex` is what is actually there.
 *
 * @param {string} input
 * @returns {{ tokens: Token[], chars: number, bytes: number }}
 */
export function tokenize(input) {
  if (!encoder) throw new Error('tokenizer: call load() and await it first');

  const ids = input ? encoder.encode(input) : [];
  const tokens = [];
  let offset = 0;

  for (const id of ids) {
    const bytes = bytesFor(id);
    tokens.push({
      id,
      bytes,
      start: offset,
      end: offset + bytes.length,
      ...describeBytes(bytes),
    });
    offset += bytes.length;
  }

  return {
    tokens,
    chars: [...input].length,
    bytes: offset,
  };
}

/**
 * Count tokens without building the per-token detail. Room 05 calls this on
 * every keystroke, so it stays cheap.
 * @param {string} input
 * @returns {number}
 */
export function count(input) {
  if (!encoder) throw new Error('tokenizer: call load() and await it first');
  return input ? encoder.encode(input).length : 0;
}

/**
 * Decode a run of token ids back to text. Used by room 05 to rebuild what is
 * left after the oldest tokens have fallen off the front.
 * @param {number[]} ids
 * @returns {string}
 */
export function decode(ids) {
  if (!encoder) throw new Error('tokenizer: call load() and await it first');
  return encoder.decode(ids);
}

/**
 * Encode to bare ids.
 * @param {string} input
 * @returns {number[]}
 */
export function encode(input) {
  if (!encoder) throw new Error('tokenizer: call load() and await it first');
  return input ? encoder.encode(input) : [];
}

/**
 * Split the input the way the encoding does before any merging happens.
 *
 * Before a single pair is joined, the text is cut by a fixed regular expression
 * that the encoding carries with it. Merging is then allowed inside each of
 * those pieces and never across them, which is why `hot dog` cannot become one
 * token however often the two words appear together. Room 07 draws these
 * boundaries, so it needs the same cut the encoder makes.
 *
 * @param {string} input
 * @returns {{ text: string, bytes: Uint8Array, start: number }[]}
 */
export function pretokens(input) {
  if (!encoder) throw new Error('tokenizer: call load() and await it first');
  const pieces = [];
  let start = 0;
  for (const match of input.matchAll(new RegExp(encoder.patStr, 'ug'))) {
    const bytes = new TextEncoder().encode(match[0]);
    pieces.push({ text: match[0], bytes, start });
    start += bytes.length;
  }
  return pieces;
}

/**
 * The merge table's entry number for a run of bytes, or null if it has none.
 *
 * In this encoding a token's entry number is also its id, and both are the
 * position at which that merge was learned — so a low number means the pair was
 * common enough to be counted early. The null matters as much as the number:
 * it is what makes a word stop merging partway, and room 07 is largely about
 * where those nulls fall.
 *
 * @param {Uint8Array | number[]} bytes
 * @returns {number | null}
 */
export function rankOf(bytes) {
  if (!encoder) throw new Error('tokenizer: call load() and await it first');
  const rank = encoder.rankMap.get(Array.from(bytes).join(','));
  return rank === undefined ? null : rank;
}

/**
 * What a run of bytes looks like on its own: the text it makes, whether it is
 * text at all, and the bytes themselves.
 *
 * Most runs are a whole piece of text. Some are the first two bytes of an emoji
 * and nothing else — those are not a character and never will be, so `whole` is
 * false and `hex` is what is honestly there. Room 01 draws finished tokens this
 * way and room 07 draws half-built ones the same way, which is the point: at the
 * start of a merge sequence almost nothing is text yet.
 *
 * @param {Uint8Array} bytes
 * @returns {{ text: string, whole: boolean, hex: string }}
 */
export function describeBytes(bytes) {
  try {
    return { text: utf8.decode(bytes), whole: true, hex: toHex(bytes) };
  } catch {
    return { text: lossy.decode(bytes), whole: false, hex: toHex(bytes) };
  }
}

function bytesFor(id) {
  // js-tiktoken keeps the id -> bytes table on the instance. Going through it
  // directly is what makes the byte offsets exact: decoding a token to a string
  // and re-encoding would turn a half-character into a three-byte U+FFFD.
  const bytes = encoder.textMap.get(id);
  if (bytes) return bytes;
  // Special tokens (<|endoftext|> and friends) are not in textMap. Nothing in
  // this museum feeds them in, but if one appears, show it as its literal text.
  return new TextEncoder().encode(encoder.inverseSpecialTokens?.[id] ?? '');
}

function toHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    if (i) out += ' ';
    out += bytes[i].toString(16).toUpperCase().padStart(2, '0');
  }
  return out;
}
