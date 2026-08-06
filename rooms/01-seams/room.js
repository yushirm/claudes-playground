// Room 01 — Seams
//
// A live tokenizer. The visitor types; the text is cut into tokens as they go.
// Everything here comes from the real cl100k_base merge table by way of
// lib/tokenizer.js. Nothing in this room is approximated.

import { cutSigns } from '../../lib/type.js';
import { load, tokenize } from '../../lib/tokenizer.js';

cutSigns();

const input = document.getElementById('input');
const strip = document.getElementById('strip');
const status = document.getElementById('status');
const inspector = document.getElementById('inspector');
const examplesRow = document.getElementById('examples');
const counts = {
  tokens: document.getElementById('n-tokens'),
  chars: document.getElementById('n-chars'),
  bytes: document.getElementById('n-bytes'),
};

// Past this the strip stops being legible and starts being a wall of confetti.
// The counts stay honest either way.
const MAX_CELLS = 400;

// Chosen by running them through the tokenizer and keeping the ones where the
// seams are visible to the naked eye. Every one of these is here for a reason
// the visitor can see without being told.
const EXAMPLES = [
  ['the same word, twice', 'strawberry strawberry'],
  ['one long word', 'antidisestablishmentarianism'],
  ['numbers', 'The year 2026, and the number 1234567.'],
  ['an emoji', '🍓 a strawberry'],
  ['whitespace', 'a\n\n\n      b'],
  ['three scripts', 'Ich möchte 日本語のテキスト читать.'],
];

let tokens = [];
let selected = -1;

for (const [label, text] of EXAMPLES) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn';
  btn.textContent = label;
  btn.addEventListener('click', () => {
    input.value = text;
    input.focus();
    render();
  });
  examplesRow.append(btn);
}

await load();

status.remove();
input.value = 'strawberry strawberry';
render();

input.addEventListener('input', render);

function render() {
  const result = tokenize(input.value);
  tokens = result.tokens;
  selected = -1;

  counts.tokens.textContent = result.tokens.length.toLocaleString('en');
  counts.chars.textContent = result.chars.toLocaleString('en');
  counts.bytes.textContent = result.bytes.toLocaleString('en');

  strip.replaceChildren();

  if (!tokens.length) {
    const empty = document.createElement('li');
    empty.className = 'status';
    empty.textContent = 'Nothing yet.';
    strip.append(empty);
    setInspector('Choose a token to look at it. The strip takes arrow keys.');
    return;
  }

  const shown = Math.min(tokens.length, MAX_CELLS);
  for (let i = 0; i < shown; i++) strip.append(cellFor(tokens[i], i));

  if (tokens.length > shown) {
    const more = document.createElement('li');
    more.className = 'status';
    more.textContent = `…and ${(tokens.length - shown).toLocaleString('en')} more, not drawn.`;
    strip.append(more);
  }

  setInspector('Choose a token to look at it. The strip takes arrow keys.');
}

function cellFor(token, i) {
  const cell = document.createElement('li');
  cell.className = 'tok';
  cell.setAttribute('role', 'option');
  cell.setAttribute('aria-selected', 'false');
  cell.tabIndex = i === 0 ? 0 : -1;
  cell.dataset.i = String(i);

  const text = document.createElement('span');
  text.className = 'tok-text';

  if (token.whole) {
    // A visible glyph for the invisible ones, so an empty-looking cell is not
    // mistaken for a bug. The token's real text is what goes in the inspector.
    text.textContent = token.text.replace(/\n/g, '⏎').replace(/\t/g, '⇥');
  } else {
    cell.classList.add('is-fragment');
    text.textContent = token.hex;
  }
  cell.setAttribute('aria-label', describePlain(token, i));

  const off = document.createElement('span');
  off.className = 'tok-off';
  off.textContent = String(token.start);

  cell.append(text, off);
  cell.addEventListener('click', () => select(i));
  cell.addEventListener('mouseenter', () => setInspector(describe(token, i)));
  cell.addEventListener('focus', () => select(i));
  return cell;
}

strip.addEventListener('keydown', (e) => {
  const cells = strip.querySelectorAll('.tok');
  if (!cells.length) return;
  const last = cells.length - 1;
  let next = null;

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(last, selected + 1);
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(0, selected - 1);
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = last;
  else return;

  e.preventDefault();
  cells[next].focus();
});

strip.addEventListener('mouseleave', () => {
  if (selected >= 0 && tokens[selected]) setInspector(describe(tokens[selected], selected));
  else setInspector('Choose a token to look at it. The strip takes arrow keys.');
});

function select(i) {
  selected = i;
  for (const cell of strip.querySelectorAll('.tok')) {
    const isIt = Number(cell.dataset.i) === i;
    cell.setAttribute('aria-selected', String(isIt));
    cell.tabIndex = isIt ? 0 : -1;
  }
  setInspector(describe(tokens[i], i));
}

/**
 * The four facts about a token: where it sits, which entry it is, which bytes
 * of the input it covers, and what those bytes are.
 */
function facts(token, i) {
  return {
    where: `token ${i + 1} of ${tokens.length}`,
    id: `id ${token.id}`,
    span:
      token.bytes.length === 1
        ? `byte ${token.start}`
        : `bytes ${token.start}–${token.end - 1}`,
    hex: token.hex,
    body: token.whole
      ? JSON.stringify(token.text)
      : `not a character — ${token.bytes.length} byte${
          token.bytes.length === 1 ? '' : 's'
        } that only mean something joined to the ones beside them`,
  };
}

/** For the inspector line, with the four facts emphasised. */
function describe(token, i) {
  const f = facts(token, i);
  return (
    `token <b>${i + 1}</b> of ${tokens.length} &nbsp; ` +
    `id <b>${token.id}</b> &nbsp; ` +
    `${f.span.replace(/(\d+)/g, '<b>$1</b>')} &nbsp; ` +
    `${escape(f.hex)} &nbsp; ` +
    `<b>${escape(f.body)}</b>`
  );
}

/** For the cell's accessible name. Plain text — a screen reader must not be
 *  handed markup to read out. */
function describePlain(token, i) {
  const f = facts(token, i);
  return `${f.where}, ${f.id}, ${f.span}, ${f.hex}, ${f.body}`;
}

function setInspector(html) {
  inspector.innerHTML = html;
}

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
