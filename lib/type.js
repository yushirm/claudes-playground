// lib/type.js
//
// The museum's signs are cut up by the same tokenizer the museum is about.
// Every element with a data-sign attribute gets its text replaced by a row of
// cells, one per token, with the fills alternating so the seams are visible.
//
// The cuts come from assets/signage.js, produced by running the real
// cl100k_base merge table over these exact strings — see tools/gen-signage.mjs.
// They are not approximations and they are not drawn by hand. They are only
// made ahead of time, so that a page does not have to download a megabyte of
// merge ranks in order to draw its own name.

import signs from '../assets/signage.js';

/**
 * Cut every [data-sign] element on the page into cells.
 * @param {ParentNode} root
 */
export function cutSigns(root = document) {
  for (const el of root.querySelectorAll('[data-sign]')) {
    const key = el.getAttribute('data-sign');
    const cells = signs[key];
    if (!cells) continue;
    el.replaceChildren(renderCells(cells, key));
    el.classList.add('is-cut');
  }
}

/**
 * Build a row of token cells.
 *
 * The sign still has to read as a sign: a screen reader should hear "The
 * Anaphora Room", not "The An aph ora Room". So the whole string is the
 * accessible label and the individual cells are hidden from the accessibility
 * tree. The seams are a visual fact about the text, not part of its content.
 *
 * @param {string[]} cells
 * @param {string} label
 * @returns {HTMLElement}
 */
export function renderCells(cells, label) {
  const row = document.createElement('span');
  row.className = 'cells';
  row.setAttribute('role', 'img');
  row.setAttribute('aria-label', label);

  for (const text of cells) {
    const cell = document.createElement('span');
    cell.className = 'cell';
    cell.setAttribute('aria-hidden', 'true');
    // The leading space on a token like " Garden" is part of the token, so it
    // sits inside the cell. That is the whole reason these are worth drawing.
    cell.textContent = text;
    row.append(cell);
  }

  return row;
}

/** The signs, for anything that wants them directly. */
export { signs };
