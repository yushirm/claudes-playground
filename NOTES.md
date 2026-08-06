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

---

## Room 01

Picked the six examples by running candidates through the real tokenizer and keeping the
ones whose seams are visible without explanation. Two earned their place by doing two jobs
at once: `strawberry strawberry` shows the mid-morpheme split *and* the leading-space
difference in a single string, and `Ich möchte 日本語のテキスト читать.` splits 語 across two
tokens while showing 27 characters against 50 bytes.

Byte-fragment tokens are drawn as hex, not as `U+FFFD`. Showing the replacement glyph would
imply the tokenizer produced a character. It produced two bytes.

Wrote the accessible name for each cell as a separate plain-text function after noticing the
first version passed the inspector's marked-up HTML into `aria-label`, which a screen reader
would have read out including the tags.

---

## Room 02

312 continuations, hand-written, across 102 nodes and six seeds; 216 complete sentences
reachable. Validated the graph before building the room — no dangling pointers, no orphaned
nodes, every path exactly three steps.

**Depth three, not five.** A full six-seed tree at fan 4 and depth 5 is about a thousand
leaves per seed, which is not writable at any quality worth having. The brief's real
requirement was that the branches diverge in *meaning* rather than swapping synonyms, and
that is a writing problem, not a size problem. Three steps of phrase-sized continuations
produce a whole sentence; three steps of token-sized ones would produce about a word and a
half. Both simplifications are stated in the room.

Cut a plan to converge the tail nodes into a shared DAG. Endings that fit several different
contexts turn out to be exactly the generic ones, which fights the only thing the room is
for. Kept every branch's endings its own.

Each fan row *is* its own bar — the fill width is the probability. An earlier sketch had a
separate bar column beside the text, which meant reading two things to learn one.

The route is not a live region. Hovering a branch ghosts it into the path, and with
`aria-live` on the path that read the entire sentence aloud every time the cursor crossed an
option. Announced on choice instead.

---

## Room 03

Corpus is ~1,560 words written for this exhibit. Original, and about this museum, so the
machine is chewing its own account of itself.

**Chose character-level over word-level, then had to choose the order empirically.** Swept
orders 4–7 against the whole dial and read the output:

| order | at T=0 | at T=0.7 | at high T |
|---|---|---|---|
| 4 | loops | already too broken | strange but wordlike |
| 5 | tight loop | passable | good |
| 6 | loops | **reads best** | good |
| 7 | quotes the corpus | quotes the corpus | barely responds to T |

High orders memorise: most 6- and 7-grams in 8,000 characters have exactly one continuation,
so temperature had nothing to act on and rooms 03 and 06 would both have been dead. Order 6
with the floor below is the setting that has a real habitable band *and* a real arc.

**The one addition, and I went back and forth on it.** A raw Markov chain has hard zeros — a
character never seen after a context can never appear, at any temperature — so the text can
degrade in its choice of words but never in its choice of letters, and the top of the dial
just produces slightly odd words forever. My first instinct was that adding anything to fix
that was the exact "fudge to be impressive" the brief warns against, and I nearly shipped a
dial whose top half did nothing.

It is the opposite. A language model holds nonzero probability for *every* token, and
raising temperature is precisely what lifts those into contention; the hard zero is the toy's
inaccuracy, not its honesty. A pseudo-count of 0.0006 per character per context gives the
chain the same *shape* of distribution the real mechanism has. At T=1 it is far below
noticing. Past 1.5 it is what lets words come apart into letters. It is stated in full in the
room, including that I added it and why.

First version of the start-picker took any capital letter after a space, so every run opened
mid-clause at "English, which…". Now it requires the capital to follow a full stop, and T=0
opens with a clean loop: *Here is a shop. Here is a shop. Here is a shop.*

Found a layout bug from room 01 here: `.btn` had `white-space: pre`, so a button whose label
sat on its own line in the HTML rendered the surrounding newlines and came out double height.
Removed `pre` from `.btn` — nothing needed it.

---

## Room 04

The arrow is drawn, not transitioned. A CSS transition between two `d` values cross-fades,
and a cross-fade does not read as *the same arrow having moved* — which is the entire
exhibit. So the endpoint is animated on a rAF loop and the curve recomputed each frame.

The dip scales with the distance travelled (64px to the trophy, 51px to the suitcase). With
a fixed dip the two hops looked like one drawing at two widths instead of one gesture
covering two distances.

At 375px the sentence wraps and the arrow has to cross a line of text to reach the trophy.
Added a casing stroke in the wall colour underneath the line — the cartographic trick — so
the crossing reads as passing in front rather than as a collision.

Used real radio inputs with styled labels rather than buttons with `aria-pressed`, so arrow
keys and the single tab stop are the platform's behaviour and not an imitation of it.

---

## Room 05

The surface is two layers, because a textarea cannot style parts of its own content: a mirror
that renders token by token, and a transparent textarea on top holding the caret. The mirror
is in flow and defines the height, so no scroll syncing is needed.

Eviction rebuilds the remainder by decoding the surviving token ids, not by slicing the
string — a token is a run of bytes and a string index does not follow it. If a cut lands
inside a character the decode opens with `U+FFFD`, so the cut walks forward a token until it
doesn't. Tested with a run of emoji: evicts clean.

Considered and rejected: evicting on every keystroke. It deletes text out from under a moving
caret and the greying never becomes visible. It now waits for a pause.

The three-stage fade is the one invented thing in the room and the Machinery note says so. A
real window has no grey phase — a token is in or out and the transition takes no time. The
grey exists so a visitor can see which tokens are about to go, which is precisely the thing
I cannot do.

---

## Room 06

First build gave every pane the six-character context `'There '` and the twelve parted after
one generated character. Seven characters of shared text is not "starting in unison" in any
visible sense.

Searched the corpus for a prompt with a long shared continuation — best was 18 characters.
The chain simply diverges fast, and forcing otherwise would have been the fudge.

Reframed instead: give all twelve a real shared **prompt** — a full sentence — which is how
instances actually begin, and measure how far past it they stay together. That required a fix
in `lib/markov.js`, which was returning only the last `order` characters of a caller's prompt
rather than the prompt itself.

The measurement then exposed something better than the thing I was chasing. Past the prompt
the panes agree for **zero** characters at almost any temperature, and the reason is that in
a corpus this small most contexts were followed by several different characters exactly once
each. Those counts are tied, and temperature cannot break a tie — raising equal probabilities
to the same power leaves them equal. An earlier draft of the Machinery note claimed low
temperature would hold them together for a long way; that was wrong, and testing caught it.
Opened the dial down to 0, where the chain goes deterministic and all twelve collapse into
one pane, and rewrote the note around what actually happens.
