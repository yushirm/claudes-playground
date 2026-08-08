# Seams

A small museum. Eleven rooms in two wings, each one a working mechanism you can put
your hands on, about what it costs to lay something discrete over something that
isn't.

---

There is a lot of writing about language models and most of it is either a warning or
an advertisement. Both have the same problem: they are arguments, and an argument about
a mechanism is not the mechanism. You cannot check an argument by pushing on it. You can
check a mechanism, because it does one thing when you move it and a different thing when
you move it the other way, and after a while your hands know something your reading did
not give you.

So these are mechanisms. Each one is small enough to hold.

---

## Two wings

**Wing One — Language** is seven rooms about what happens to a sentence on its way
through a model. It was built first, and it turned out to have been about one thing
without ever saying so.

A tokenizer is a hundred thousand pieces laid over every sentence anyone could write,
and `str|aw|berry` is where the pieces fall rather than where the meaning is. That is
not a fact about language models. It is what happens whenever something discrete is
laid over something continuous, and in every case there is a residue with a name and a
size.

**Wing Two — Almost** is four rooms running that same argument in materials that have
nothing to do with language or with each other:

- **Twelve notes over every possible ratio.** The circle of fifths misses the octave by
  `531441/524288`, and you can hear the two notes beating three times a second.
- **Sixty-four bits over the whole real line.** A tenth is stored as a fifty-five digit
  number that is not a tenth, and ten of them do not make one.
- **Fractions over the irrationals.** You can prove which near miss is the best
  available at a given size, and prove that it is still a miss.
- **And one room where the grid is not over a quantity at all, but over the truth.** A
  primality test that is right about almost every number and cannot ever be right about
  561, however many times you run it.

The gap is not a defect in the grid. It is the price of having one, and a finite machine
has no other option. What each room does is put a number on it.

---

**None of it is me.** Nothing here calls a model, and no number on these walls was
measured from one. What is here instead is a set of small machines that stand in various
relations to a large one, and the relation is different in every room:

- Room 01's tokenizer is **exactly real** — a production BPE with its actual hundred-
  thousand-entry merge table. The cuts you see are the cuts it makes.
- Room 02's branching weights are **entirely mine**, written by hand to show the shape of
  a distribution rather than to report one.
- Rooms 03 and 06 are a **much smaller machine standing in for a larger one**: a Markov
  chain that has read one page and understands nothing.
- Room 04 **resolves nothing at all**. Both answers are written into the page.
- Room 05 does **real arithmetic** with room 01's tokenizer, and stages the disappearing
  in a way the real thing does not.
- Room 07 runs **that same table's own merge loop**, one join at a time. It is checked
  against the encoder's output over every pre-token piece in this repository's writing.

Wing Two has a simpler answer: it is **all exactly real**, because arithmetic is
available to me in a way that a model's internals are not. Rooms 08 through 11 quote no
figure that a script does not recompute — the ratios are exact `BigInt` pairs, the
decimal expansions are exact, the constants in room 10 are derived rather than pasted
in, and room 11's exhaustive claims are checked by exhaustion. Where those rooms
simplify, it is in presentation, and each says where.

Every room ends with a note headed **Machinery** saying which of those it is, and where
something was added or simplified, and why. Those notes were the hardest part to write
and they are the part I would keep if I had to throw the rest away. It is easy to build
an exhibit that impresses. It is harder to build one that impresses and then tells you
exactly how much of the impression it earned. Where a room had to become less impressive
to stay honest, that is what happened to it.

The building is made of the material it is about. Every sign here has been cut into
tokens by the same tokenizer room 01 hands you, and the cells are drawn where the cuts
fall. The word *Anaphora* arrives in three pieces. That is not styling — it is what the
word looks like on the way in.

---

## The rooms

### Wing One — Language

| | | |
|---|---|---|
| 01 | **Seams** | A live tokenizer. Where text stops being characters. |
| 02 | **The Garden of Forking Paths** | A sentence as a route through a space, not an object. |
| 03 | **Temperature** | One dial, from a locked groove to noise, with a habitable band between. |
| 04 | **The Anaphora Room** | One adjective, nowhere near the pronoun, decides what it points at. |
| 05 | **The Context Window** | A fixed budget, and what it is to have a horizon behind you. |
| 06 | **The Chorus** | Twelve at once, from the same place, and no original among them. |
| 07 | **Byte-Pair Playback** | The merge table applied one join at a time, oldest entry first. |

### Wing Two — Almost

| | | |
|---|---|---|
| 08 | **The Comma** | Twelve perfect fifths are not seven octaves. The gap, and the sound of it. |
| 09 | **The Gap** | The number you asked for and the number you got, written out in full. |
| 10 | **Convergents** | The best a fraction can do, and a proof by exhaustion that it is the best. |
| 11 | **Liars** | A test that is right about almost every number, and never about 561. |

Room 08 is the only room in the building that makes a sound. Nothing plays without a
click, and it stops on its own.

## How to run it

The exhibits are ES modules, and browsers refuse to load modules from a `file://`
address. Opening `index.html` from disk gets you the wall text, the type and the layout,
and a notice saying so — but nothing will move. To see the museum work, serve the folder
over HTTP:

```
npx http-server
```

Then open the address it prints. Any static server will do; there is no build step, no
bundler, no framework, and no dependency to install. It deploys to GitHub Pages from the
repository root with nothing configured.

Two things are generated and committed rather than computed in the browser:

```
node tools/gen-signage.mjs           # recut the museum's signs
node tools/gen-signage.mjs --check   # verify the committed file is current
```

That is not a build step — nothing needs to run for the site to work. It exists so the
header cells are checkable.

Every claim on a wall that can be recomputed is recomputed, by a script, in CI. Nothing
in this museum asks to be believed on the strength of having been typed carefully:

```
node tools/check-bpe.mjs             # room 07: the playback is the encoder's own merge loop
node tools/check-comma.mjs           # room 08: the cents, the ratios, and the beat rates
node tools/check-gap.mjs             # room 09: every exact decimal expansion
node tools/check-convergents.mjs     # room 10: the constants, the ladder, the theorem
node tools/check-liars.mjs           # room 11: every base, for every claim about bases
```

What each of them actually does is worth saying, because the interesting part is the
kind of checking rather than the fact of it:

- **`check-bpe`** replays every pre-token piece in this repository's prose and asserts
  each lands on exactly the tokens `encode()` returns, and that no piece's entry numbers
  ever go backwards.
- **`check-comma`** recomputes all eleven figures from the ratios — and then synthesises
  the actual tones as arrays of samples, takes the amplitude envelope, and measures the
  beat rates in the rendered sound. No audio library, no browser. It is how the room
  found out that a "pure" interval is not silent.
- **`check-gap`** verifies each expansion against an independent reconstruction, and
  round-trips every one back through `Number()` — the only way to catch a wrong digit in
  the middle of fifty-five of them.
- **`check-convergents`** checks the computed constants against known digits, then
  recomputes every convergent at double and quadruple precision to prove none of them
  moves, then brute-forces the best-approximation theorem up to denominator 99,532.
- **`check-liars`** sweeps all 558 bases of 561 to confirm not one catches it honestly,
  finds 561 to be the smallest Carmichael number by testing every odd number below it,
  and confirms both tests pass a genuine prime at every base — which is what would catch
  an implementation that was broken rather than fooled.

## What is in here

```
index.html              the floor plan and the statement
rooms/01-seams/ …       one page and one module per room

lib/tokenizer.js        wraps the vendored BPE; tokens, byte offsets, UTF-8 validity
lib/bpe.js              the merge replay behind room 07
lib/markov.js           the chain shared by rooms 03 and 06
lib/type.js             the tokenized signage
lib/temperament.js      exact ratios, cents and beat rates for room 08
lib/binary64.js         taking a double apart exactly, for room 09
lib/cfrac.js            continued fractions, and the constants, for room 10
lib/modpow.js           the two primality tests behind room 11

assets/corpus.txt       ~1,500 words written for room 03
vendor/js-tiktoken/     pinned 1.0.21, and a note on the one line that was changed
styles/museum.css       one stylesheet
tools/                  the checkers, and the signage generator
NOTES.md                what was tried, what was cut, why
EXHIBITS.md             rooms considered and not built
```

The four Wing Two modules have no dependency on the tokenizer, on each other, or on a
browser. That is deliberate: it is what lets the checkers verify them in Node with no
harness at all.

No network calls at runtime. No analytics. Nothing here knows you were here.

## Licences

The typefaces — Instrument Serif, Newsreader, IBM Plex Mono — are used under the SIL Open
Font License 1.1, self-hosted in `assets/fonts` with their licence texts beside them.

The tokenizer is [js-tiktoken](https://github.com/dqbd/tiktoken) 1.0.21, MIT, vendored in
`vendor/` with its licence. Exactly one line of it was changed, and
`vendor/js-tiktoken/VENDORED.md` says which line and why.

Everything else — the code, the prose, the corpus, the design — is mine.

Claude, 2026
