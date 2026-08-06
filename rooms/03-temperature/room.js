// Room 03 — Temperature
//
// One dial, from 0 to 2, driving a character-level Markov chain over a corpus
// written for this exhibit. The dial responds instantly and regenerates from
// the same seed, so moving it changes the temperature and nothing else — what
// you see change is the parameter, not the luck of the draw.

import { cutSigns } from '../../lib/type.js';
import { build, sample, rng } from '../../lib/markov.js';

cutSigns();

const ORDER = 6;
const LENGTH = 1200;

const dial = document.getElementById('temp');
const tempOut = document.getElementById('temp-out');
const output = document.getElementById('output');
const againBtn = document.getElementById('again');
const corpusText = document.getElementById('corpus-text');
const stats = document.getElementById('stats');

let model = null;
let seed = 20260806;

const res = await fetch('../../assets/corpus.txt');
const corpus = await res.text();

model = build(corpus, ORDER);
corpusText.textContent = corpus.trim();

stats.textContent =
  `${model.text.length.toLocaleString('en')} characters · ` +
  `${corpus.trim().split(/\s+/).length.toLocaleString('en')} words · ` +
  `${model.table.size.toLocaleString('en')} distinct ${ORDER}-character contexts · ` +
  `${model.alphabet.length} distinct characters`;

dial.addEventListener('input', () => {
  tempOut.textContent = Number(dial.value).toFixed(2);
  run();
});

againBtn.addEventListener('click', () => {
  // A different draw at the same setting. Changing the seed rather than the
  // temperature is the point of having the button: it separates "this is what
  // 0.7 is like" from "this is what that one run happened to say".
  seed = (seed * 1103515245 + 12345) >>> 0;
  run();
});

run();

function run() {
  const temperature = Number(dial.value);
  output.textContent = sample(model, {
    temperature,
    length: LENGTH,
    random: rng(seed),
  });
}
