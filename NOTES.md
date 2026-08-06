# Notes

A running log kept while building. What was tried, what was cut, why.

---

## The floor

**Vendored the tokenizer rather than writing one.** `js-tiktoken@1.0.21`, pinned, MIT,
`cl100k_base`. The alternative in the brief — implement BPE and train merges on the room 03
corpus — would have meant every seam in the building was a toy's seam, and the room 01 wall
text would have had to spend a paragraph apologising instead of pointing at something true.
The real merge table costs 1.1 MB and is worth it.

Chose `cl100k_base` over `o200k_base` on two counts: half the weight, and `🍓` splits into
three invalid byte fragments instead of two, which is a better exhibit. The classic
`str|aw|berry` split is `cl100k`'s; `o200k` gives `st|raw|berry`. Either would have served.

One modification to the vendored code, and only one: `chunk-VL2OQCWN.js` line 1 imported the
npm package `base64-js`, which browsers can't resolve and which is CommonJS anyway. It now
imports a six-line local shim around the platform's `atob`. Recorded in
`vendor/js-tiktoken/VENDORED.md` so the diff against the published tarball is one line.

**Byte offsets are exact, not reconstructed.** The obvious way to get per-token byte lengths
is to decode each token to a string and re-encode it. That is wrong: a token holding the
first two bytes of an emoji decodes to `U+FFFD`, which re-encodes to three bytes, and the
offsets drift. `lib/tokenizer.js` reads `encoder.textMap` instead, which is the id → bytes
table the library already keeps, so offsets are the real thing and a token can be *asked*
whether its bytes are valid UTF-8 on their own. Room 01 draws the ones that aren't as hex.

**Signage is precomputed.** Every sign is cut by the real merge table, but doing that in the
browser would mean each page downloading 1.1 MB to draw its own name — including room 04,
which is meant to be the smallest room in the building. So `tools/gen-signage.mjs` runs the
same `lib/tokenizer.js` over the nine sign strings and writes `assets/signage.js`. It is not
a build step; nothing has to run for the site to work. It has a `--check` mode so the
committed file can be proven current.

Started as `signage.json` loaded with `fetch`. Switched to an ES module: `fetch` fails on
`file://` and modules were already required everywhere, so this removes a failure mode
rather than adding one.

### The one place the brief cannot be satisfied

The brief asks for vanilla ES modules **and** for the site to run by opening `index.html`
from disk. Those are mutually exclusive in current browsers. Measured, not assumed:

| from `file://` | works |
|---|---|
| CSS, self-hosted fonts | yes |
| classic `<script src>` | yes |
| `<script type="module">`, `import` | **no** — CORS, origin `null` |
| `fetch()` | **no** — scheme not supported |

Everything else the constraint was protecting is intact: no build step, no bundler, no
framework, every link relative, deploys to Pages with nothing configured. So the modules
stayed, and every page now detects `file:` in a two-line classic script and shows a notice
in the museum's own voice saying what isn't running and how to run it. A building that is
honest about its machinery should be honest about its own front door.

### Design

Wrote the design plan before the CSS, and checked it against the three drifts the brief
names. The one that needed a written rule was broadsheet: **no hairline rules anywhere in
the building.** Separation is done with the token grid — cells, gutters, fills — and with
space. There is not a single `border` on a layout element.

Palette kept, with one addition and one correction:

- Added `--paper` and `--recess`. The starting palette had no surface distinct from the
  wall, so a text input had nothing to sit in and floated.
- First pass set `--paper: #EDEFEC`, two steps off the ground. On screen the floor-plan
  rooms barely separated from the wall — it read as a rendering fault, not a surface.
  Lifted to `#F1F3F0`.
- Kept `--token-a` and `--token-b` at near-identical lightness on purpose, so alternation
  reads as segmentation and never as emphasis. Checked on the first render: they don't read
  as candy at signage scale, so the planned desaturation wasn't needed.

**The floor plan is drawn in poché.** First attempt was light blocks on the light ground with
a small gap, which looked like a grid of cards — the exact drift the brief warns about. Now
the grid sits on a `--recess` field and the rooms are light blocks punched into it, so the
gutters read as walls. Room 04 is one grid unit and is visibly the smallest room.

First render also clipped the room numbers on the one-row blocks: `minmax(5.75rem, 7vw)`
resolved to a max below its own min, and the content overflowed into `overflow: hidden`.
Now `minmax(7.25rem, auto)`.

Statement was centred under a left-aligned building on the first pass, which read as a
different document. Left-aligned to the same margin.
