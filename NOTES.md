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

---

## Room 07

Added after the other six were finished. `EXHIBITS.md` had nominated it and also explained
why it was cut — a second tokenizer room — so the first thing to settle was whether that
objection still held. It doesn't, and the reason is in `EXHIBITS.md` under *Later built*.

**The one design question was whether the timeline could be shared.** The encoder merges each
pre-token piece separately. Showing that literally means one timeline per piece, which for
`strawberry strawberry` is two scrub bars and no way to see that the two copies move in step —
and the two copies moving in step and then not is the entire room. A single timeline sorted by
entry number shows it, but only if sorting doesn't reorder anything within a piece.

It doesn't, and that isn't luck. An entry for `AB` can only be counted once `A` and `B` both
exist, so it is always learned after both, so a piece's own merges are already in ascending
order. Checked before building on it, and again in CI: no piece in this repository's prose
ever goes backwards.

**The check was wrong before the code was.** The first monotonicity sweep tested `<=` and
reported 19 failures, which for about ten minutes looked like the room's premise collapsing.
They were all ties — the same entry firing at two positions in one word, like the two `an`s
in *antidisestablishmentarianism*. Strict decreases: zero. The ties are real and the room
shows them, because a tie is what "this entry applies twice here" looks like.

**The halt names different pairs than I expected.** Planning this, I assumed the bare
`strawberry` stops for want of `straw` and `strawberry`. It stops for want of `straw` and
`awberry` — those are the two adjacent pairs actually left at the end, and `strawberry` never
gets to be a candidate because reaching it would require `straw` first. The room reports the
pairs the loop was actually refused rather than the ones I would have guessed, which is the
whole reason to have the mechanism generate the sentence instead of writing it.

**Cut a number from the wall.** The Machinery note quoted "6,765 pre-token pieces checked",
and then I added a paragraph to this file and it became 7,418. A figure that moves when you
edit an unrelated document is a lie with a delay on it. The note now says "several thousand"
and the checker prints the real count.

**Four things caught by looking at it rather than by testing it.** The just-merged cell
animated back to `--token-a` explicitly, which would have left any even-positioned cell on
the wrong fill forever — the keyframes now name only the `from` colour, so the cell settles
to whatever its position calls for. The halt sentence rendered twice, once in the caption
and once below. The caption is a filled slab, so blanking it at the end left a hole in the
page instead of a blank line; it is hidden now. And the halt sentence put raw bytes in
quotation marks — `“F0 9F 8D”` — presenting a pair of bytes as a string the table might
have held, when the point of drawing them as hex is that they are not a string at all.

**Typing and the example buttons do different things, on purpose.** Replaying from the
bytes on every keystroke is unwatchable, so typing lands on the finished tokens and the
scrub bar rewinds. The example buttons play from the start, because that is what they are
for. Under `prefers-reduced-motion` nothing plays by itself at all and the room opens on
the bytes.

The measurement then exposed something better than the thing I was chasing. Past the prompt
the panes agree for **zero** characters at almost any temperature, and the reason is that in
a corpus this small most contexts were followed by several different characters exactly once
each. Those counts are tied, and temperature cannot break a tie — raising equal probabilities
to the same power leaves them equal. An earlier draft of the Machinery note claimed low
temperature would hold them together for a long way; that was wrong, and testing caught it.
Opened the dial down to 0, where the chain goes deterministic and all twelve collapse into
one pane, and rewrote the note around what actually happens.

---

# Wing Two

Added after the first seven rooms were finished. The reason to add anything was that
Wing One had turned out to be about something more general than it said: a tokenizer is
a discrete grid laid over a continuous thing, and `str|aw|berry` is the residue. That
sentence is true of a great many mechanisms which have nothing to do with language, and
four of them make better exhibits than a further room about tokens would have.

The house rules did not change. Real mechanisms, no network, no build step, a Machinery
note per room, and every figure on a wall recomputed by a script in CI.

One rule was added: **Wing Two quotes no constant it does not compute.** Room 10 could
have opened by pasting in a hundred digits of π, and those digits would then have been
the single unchecked thing the whole room stood on. They come out of Machin's formula
instead.

---

## Room 08

**The measurement changed the room twice, and that is the main thing worth recording.**

`tools/check-comma.mjs` began as arithmetic — recompute the cents from the ratios,
compare with the wall. That part passed first time. Then I added a section that
synthesises the actual tones as arrays of samples and measures the beat rate in the
result, on the grounds that the room's real claim is that you can *hear* these numbers
and arithmetic does not check that.

It failed immediately, and both failures were the room's fault rather than the check's.

**First: the sine-wave trap, which I had already avoided and then under-estimated.** I
knew the voices could not be sine waves, because a mistuned third beats between its
harmonics and a sine has none. What I had not thought about is that six harmonics gives
you *several* beating pairs at once. A tempered third at a 220 Hz root beats at 8.73 Hz
between the fifth harmonic of the root and the fourth of the third — the pair the meter
names — and simultaneously at about 48 Hz between the fourth and third harmonics, which
is louder. The slow beat is genuinely in there and genuinely hard to pick out. A visitor
could press the button, hear a rough noise, and reasonably conclude the meter was
decorative. Hence the isolate mode, which sounds only the two partials that the pure
ratio would have made coincide. It adds nothing: those frequencies are already in the
whole tone at those amplitudes. It takes the rest of the note away.

**Second: the wall was overstating.** It said a pure interval is "completely still".
It is not. Two harmonic tones a just third apart still have fundamentals 55 Hz apart,
and that rubbing is simply what an interval sounds like. What goes to zero is the slow
beat specifically. The check now measures the 8.73 Hz component in both and finds the
tempered one about ninety-nine thousand times stronger, which is a better sentence than
"completely still" and has the advantage of being true.

The Hann window on the envelope transform is load-bearing and was not optional. Without
it the loud 48 Hz component leaks across the whole slow band and the search just reports
the edge of its own range — which is exactly what it did, for twenty minutes, while I
looked for a bug in the synthesis.

Everything is exact `BigInt` except equal temperament, which cannot be: `2^(1/12)` is
irrational, and that is the point of it rather than a shortcut.

---

## Room 09

The easiest room in the wing to get right and the one with the best single number in it.
A double is `m × 2^e`; when `e` is negative, multiplying top and bottom by `5^-e` turns
the denominator into a power of ten and the exact decimal falls out. Nothing anywhere in
`lib/binary64.js` uses floating point to describe floating point.

**The accumulator found a better fact than the one I built it for.** I put the
ten-tenths ladder in to show error accumulating. It does not accumulate. After five
additions the total is exactly `0.5` — on the nose, shorter expansion than any line near
it — and then it comes apart again. That is a much more interesting property than steady
drift, because it is the reason floating point is genuinely hard rather than merely
imprecise: you cannot reason about the error by watching it grow. The wall says so now,
and `check-gap.mjs` pins it.

The round-trip assertion is the one doing real work. Comparing a fifty-five digit string
against a fifty-five digit string I typed proves that I typed it correctly, which is not
the interesting question. Asserting `Number(exactDecimal(x)) === x` proves the digits
describe the number.

**A building-wide bug this room exposed.** `.lit` was `white-space: pre`. Fine for Wing
One, whose literals are token strings and entry numbers, all short. Room 09 quotes a
fifty-five digit number in the middle of a sentence, which at 375px is nearly twice the
width of the screen, and the whole page scrolled sideways. Now `pre-wrap` with
`overflow-wrap: anywhere` — the wrapping is added rather than the space-preserving taken
away, because room 01 needs a leading space inside a literal to survive.

Two other overflow bugs, both found by measuring rather than by looking: the tables in
rooms 08 and 09 needed scroll containers, and then room 08 *still* overflowed by three
pixels, from an `.sr-only` span. Those are `position: absolute` with no positioned
ancestor, so they resolve against the viewport and escape the scroller entirely — a
one-pixel invisible element pushing the page. `.table-wrap` is `position: relative` for
that reason alone.

---

## Room 10

**The recurrence had its initial conditions swapped and the obvious test did not
notice.** `h₋₁ = 1, h₋₂ = 0` for numerators, the mirror image for denominators. I had
them the wrong way round, which produces every fraction upside down — `1/3`, `7/22`,
`106/333`. The structural check I had written first, that consecutive convergents
satisfy `|pₖqₖ₋₁ − pₖ₋₁qₖ| = 1`, passed happily, because that identity is symmetric in
p and q. What caught it was comparing against the four fractions everybody knows.

**And then I measured the wrong quantity entirely.** The plan said φ is the hardest
number to approximate, and my first check asked which constant needs the biggest
denominator to reach one part in 10⁸. By that measure φ looks *easy* — it gets there at
q=6765 where π needs 33102 — because φ's denominators are the Fibonacci numbers and they
start small. The check failed, and it was right to.

The real measure is quality, `q²·|α − p/q|`: how good a fraction is for the size of its
denominator. Every irrational has infinitely many convergents below `1/√5`; φ is the
number where that bound is tight. Its quality settles onto 0.447214 and stays, while π
dips to 0.003406 at 355/113. So π gets a fraction more than a hundred times better value
than the best φ will ever be given. That is both the true statement and a much better
one, and I would not have found it by thinking harder — the failing test found it.

The precision cutoff is the room's one real hazard. A continued fraction taken from a
truncated decimal describes the constant only until the truncation matters, and after
that it describes the truncation, with terms that look exactly as plausible. The rule is
to keep only convergents whose denominator stays well inside a third of the working
precision, and the check recomputes every convergent shown at 2× and 4× the precision to
prove not one moves.

The exhaustive search is real, and fast enough to be a button: 112 denominators for
355/113 in under a millisecond. It is capped at 300,000 in the browser. CI runs it to
99,532.

---

## Room 11

The only room in the building whose residue is a probability rather than a size, which
is why it goes last.

**The best thing in it was not planned.** I built it to show that Miller–Rabin catches
what Fermat misses. It does more than that: when it catches 561 at base 2, the culprit
is 67, and `67² ≡ 1 (mod 561)` means 561 divides `66 × 68` while dividing neither — so
`gcd(66, 561) = 33` is a real factor. The witness does not merely convict. It hands you
a piece of the number. That is now the emotional centre of the room and I found it while
checking that the culprit really did square to 1.

The three-way sweep is what makes the Carmichael claim land. It is not enough to say
"318 bases lie". The number that matters is that **zero** bases catch 561 honestly, and
that the 240 which do report "composite" are the multiples of 3, 11 and 17 — trial
division wearing the test's clothes. Splitting the sweep three ways rather than two was
the single best presentation decision in the room.

`BigInt` throughout, and not for size. Modular arithmetic on doubles goes wrong silently
past 2⁵³ for exactly the reason room 09 is about, and building "a test that is right
until it isn't" on arithmetic that is right until it isn't would have been funny once.

The Fermat strip showed four identical `1`s in a row and looked broken. They are the
zero bits of the exponent — square-and-multiply only moves the running total where the
exponent has a 1 — so the strip now carries the bits underneath the values, and the row
of digits is 560 in binary, least significant first. A cell that looks like a bug and is
not needs to say which.

---

## The entrance

Two wings needed a sign apiece, cut by the same tokenizer as everything else.
`Convergents` comes out as `[Con][ver][g][ents]` — four pieces with a stranded `g` —
which is a word about approximation that the merge table can barely hold. Nothing was
arranged to make that happen; it is just what the table does, and it is the kind of thing
this building exists to notice.

The statement gained three paragraphs naming the through-line, and the sub-heading
stopped saying "seven rooms".

Wing One is otherwise untouched, apart from room 07 gaining a forward link.
