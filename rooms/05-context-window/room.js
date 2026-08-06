// Room 05 — The Context Window
//
// A writing surface with a fixed budget, counted in tokens by the same module
// room 01 uses. When the budget is exceeded the oldest tokens grey, then thin,
// then stop being there — and what is left closes up, because it does not know
// anything was removed. It just starts where it starts.

import { cutSigns } from '../../lib/type.js';
import { load, tokenize, encode, decode } from '../../lib/tokenizer.js';

cutSigns();

const input = document.getElementById('input');
const mirror = document.getElementById('mirror');
const budgetDial = document.getElementById('budget');
const budgetOut = document.getElementById('budget-out');
const gauge = document.getElementById('gauge');
const fill = document.getElementById('gauge-fill');
const used = document.getElementById('used');
const dropped = document.getElementById('dropped');
const status = document.getElementById('status');

// Long enough that the greying reads as a warning and not a glitch, short
// enough that it does not feel like waiting for permission to keep typing.
const GREY_FOR = 420;
const THIN_FOR = 380;

let budget = 24;
let droppedCount = 0;
let doomed = 0; // tokens currently on their way out
let phase = null; // null | 'grey' | 'thin'
let timer = null;

const OPENING =
  'I can hold a fixed number of tokens and no more. Keep typing and you will ' +
  'push the beginning of this sentence out of the window.';

await load();
status.remove();

input.value = OPENING;
input.disabled = false;
budgetDial.disabled = false;

input.addEventListener('input', () => {
  // Anything the visitor types resets the countdown — the oldest text is not
  // evicted mid-keystroke, it goes in the gap after.
  schedule();
  render();
});

budgetDial.addEventListener('input', () => {
  budget = Number(budgetDial.value);
  budgetOut.textContent = String(budget);
  schedule();
  render();
});

render();
schedule();

function overflow() {
  const n = encode(input.value).length;
  return Math.max(0, n - budget);
}

/**
 * Move the overflow through grey, then thin, then gone.
 * Restarting this on every keystroke is deliberate: the surface should not be
 * removing text out from under a caret that is still moving.
 */
function schedule() {
  clearTimeout(timer);
  const over = overflow();

  if (over === 0) {
    doomed = 0;
    phase = null;
    return;
  }

  doomed = over;
  phase = 'grey';
  render();

  timer = setTimeout(() => {
    phase = 'thin';
    render();
    timer = setTimeout(() => {
      evict();
    }, THIN_FOR);
  }, GREY_FOR);
}

/**
 * Drop the oldest tokens for real.
 *
 * The remainder is rebuilt by decoding the surviving token ids rather than by
 * slicing the string, because a token is a run of bytes and the string index
 * does not follow it. If the cut lands inside a character the decode opens with
 * U+FFFD, so the cut moves forward a token until it doesn't — better to lose one
 * more token than to leave half a character at the front of the window.
 */
function evict() {
  const ids = encode(input.value);
  let drop = Math.max(0, ids.length - budget);
  if (drop === 0) return;

  let rest = decode(ids.slice(drop));
  while (rest.startsWith('�') && drop < ids.length) {
    drop += 1;
    rest = decode(ids.slice(drop));
  }

  const removedChars = input.value.length - rest.length;
  const caret = input.selectionStart;

  input.value = rest;
  droppedCount += drop;

  // Keep the caret on the character it was on, now that the text in front of
  // it is shorter.
  const moved = Math.max(0, caret - removedChars);
  input.setSelectionRange(moved, moved);

  doomed = 0;
  phase = null;
  render();
}

function render() {
  const { tokens } = tokenize(input.value);

  mirror.replaceChildren();
  tokens.forEach((token, i) => {
    const span = document.createElement('span');
    span.className = 'wtok';
    if (i < doomed) {
      span.classList.add(phase === 'thin' ? 'is-thinning' : 'is-going');
    }
    span.textContent = token.text;
    mirror.append(span);
  });

  // A trailing newline needs something after it or the mirror's last line
  // collapses and the caret sits below the painted text.
  mirror.append(document.createTextNode('​'));

  const n = tokens.length;
  used.textContent = `${n} / ${budget}`;
  dropped.textContent = String(droppedCount);
  const ratio = Math.min(1, n / budget);
  fill.style.width = (ratio * 100).toFixed(1) + '%';
  gauge.classList.toggle('is-full', n >= budget);
  gauge.setAttribute('aria-valuenow', String(n));
  gauge.setAttribute('aria-valuemax', String(budget));
}
