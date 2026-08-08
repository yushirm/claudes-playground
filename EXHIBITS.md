# Exhibits

Rooms that were considered and not built, and why. One line each, mostly.

All six rooms in the brief were built. Nothing was cut for time. What follows are the
ones that did not make it into the plan, and two that were designed and then abandoned
partway.

One of them has since been built. It is at the bottom of this file.

---

## Considered, not built

**The Attention Room** — a heatmap of which earlier words a model looks at while producing
the next one. Cut because any honest version needs real attention weights, and I have
none; a hand-drawn heatmap would have been a picture of a claim rather than a mechanism,
which is exactly what this museum is against.

**The Embedding Field** — a 2-D projection of word vectors, king − man + woman and so on.
Cut because it needs a real embedding matrix. Bundling one is tens of megabytes, and
hand-placing the points would make the famous analogies true by construction. The
demonstration would have been of my own arrangement.

**The Refusal Room** — the same request phrased six ways, some answered and some declined,
showing where the boundary sits. Cut because I would have been authoring both the requests
and my own reactions to them, which makes it a self-portrait posing as an instrument.

**The Instruction Room** — the same paragraph rewritten under six system prompts, to show
how much of a voice is set before the conversation starts. Genuinely tempting. Cut because
without a model in the loop I would be writing all six outputs myself, and "here are six
things I wrote" is not an exhibit about instruction-following.

**The Hallucination Room** — a plausible, fluent, entirely fabricated citation, next to the
real one. Cut because it is a demonstration of a failure I would have to fake in order to
show, and a faked failure teaches nothing about the real one.

**Stop Sequences** — a generator that runs until it hits a token that ends it. Cut for
being a true but thin idea: about fifteen seconds of interest, and room 03 already puts a
generator under the visitor's hand.

**The Pooling Room** — a paragraph collapsing into a single vector, to show what a summary
costs. Cut because the interesting part is what the collapse loses, and without real
vectors I could only assert the loss, not show it.

**Byte-Pair Playback** — watching BPE merges apply one at a time, from characters up to
tokens. This one nearly made it, and it is the best of the unbuilt: the vendored merge
table is right there and the animation would be entirely real. Cut because it is a second
tokenizer room, and room 01 already owns that material. If a seventh room is ever added,
it should be this one. **— Built. It is room 07, and the note below says what changed.**

## Designed, then abandoned

**Room 02 as a five-step tree.** A six-seed tree at depth 5 and fan 4 is about a thousand
leaves per seed. Written at that scale the branches would have had to be near-synonyms,
which defeats the only thing the room is for. Cut to three steps so the branches could
diverge in meaning. Also cut: converging the tails into a shared graph to save writing —
endings that fit several different contexts turn out to be exactly the generic ones.

**Room 06 with a long unison.** The first design searched the corpus for a prompt whose
continuation stayed identical across all twelve panes for a long stretch, so the "start in
unison" would be visually dramatic. The best available was eighteen characters. Rather
than force it, the room now gives all twelve a real shared prompt and measures how far
past it they agree — which turned out to expose something better: the answer is usually
zero, because tied counts cannot be separated by temperature.

## Cut from rooms that were built

**A live tokenizer in every page header.** Every sign in the museum is genuinely cut by
the real merge table, but doing it in the browser meant every page downloading 1.1 MB to
draw its own name — including room 04, which is supposed to be the smallest room in the
building. The cuts are made ahead of time by `tools/gen-signage.mjs` and committed, with
a `--check` mode so the file can be proven current.

**Hairline rules.** Not an exhibit, but the largest single thing cut. There is not one
rule anywhere in this building. Separation is done with the token grid and with space.

## Later built

**Byte-Pair Playback is room 07.** The objection above was that it is a second tokenizer
room. That was the right thing to worry about and the wrong conclusion, and what changed
my mind was noticing what room 01 cannot do rather than what room 07 could.

Room 01 shows that `strawberry` is cut three ways and ` strawberry` arrives whole, and
then its wall text *tells* you why. The telling was doing real work there, which in this
building is a smell. The reason is a process — a sequence of joins that runs out — and a
room that only draws the outcome can assert it but cannot show it. Room 07 shows it: the
two copies merge in step, one keeps going through entry 31107 and 73700 to a single
token, the other stops dead because the table holds no `straw` and no `awberry`. That is
not the same material as room 01. It is the material room 01 was standing on.

Two things were considered for it and cut:

**A vocabulary browser** — search the hundred thousand entries, see what was learned when.
Cut because it is a database with a text field in front of it, not a mechanism, and the
one fact it would carry (entry numbers are chronological) the playback already carries
by moving.

**Animating the merge as motion** — cells sliding together rather than being redrawn
joined. Not tried, decided against: two cells travelling toward each other reads as
*these two are related*, which is a weaker and vaguer claim than the true one, that at
this instant the pair became a single entry in a table. The join is discrete and a slide
would soften it. What the room animates instead is the new cell cooling back to an
ordinary one, which is a change of attention rather than a claim about the mechanism.

The one presentation choice that survived — a single timeline across all pre-token pieces
instead of one per piece — is stated in full in the room's Machinery note, along with the
reason it is faithful rather than a rearrangement, and it is checked in CI.

---

# Wing Two

Four rooms built, and these considered. Same rule as above: one line each, mostly, and
the reason has to be a real reason.

## Considered, not built

**The Penrose Room** — an aperiodic tiling, generated live, that almost repeats and never
does. Genuinely beautiful and genuinely "almost". Cut because it is the one candidate
where nothing ever *fails*: the tiling does exactly what it is supposed to, forever, and
a visitor would be admiring a pattern rather than watching a mechanism come up short.
Wing Two's rooms all have a gap you can put a number on. This one has a mood.

**Lossy compression** — a real DCT with the quantization table under your hand, so you
can throw away coefficients until you can tell. A strong idea, and the loss is exactly
the wing's subject. Cut because the interesting version needs a real photograph, and
then the exhibit is about that photograph — which face degrades first, which texture
survives — and it becomes an art project with a slider. Also the one candidate that
would have needed a large binary asset.

**The Alabama paradox** — apportioning seats to states, where the only honest answer is
fractional and the grid is whole people. Politically resonant, exactly the right shape,
and I wanted it. Cut because every version I sketched was a table that changes when you
press a button. The mechanism is a sorting rule, and a sorting rule is not something you
can put your hands on the way a dial or a wheel is.

**0.999… = 1** — the most famous "almost" there is, and the anti-room. Cut for being
true: there is no gap at all, that is the whole point, and a room in this wing whose
residue is exactly zero would undo the argument the other four are making. It is a good
paragraph and not an exhibit.

**Zeno, drawn** — halving the distance forever. Cut as the same problem as 0.999… with
worse arithmetic, and because room 10 already shows an infinite sequence closing on
something it never reaches, with the advantage of a theorem underneath it.

**The Birthday Room** — 23 people, better than even odds. A genuine surprise, but it is a
surprise about a formula rather than a near miss, and nothing in it is *almost*
anything.

**Rounding modes** — the same sum computed under round-to-nearest, toward zero, and the
two directed modes, with interval arithmetic bracketing the truth. This is the best of
the unbuilt and it is named in room 09's Machinery note. Cut because room 09 already owns
the floating-point material and a second float room would be to Wing Two what a second
tokenizer room nearly was to Wing One. If a twelfth room is ever added it should be this
one.

## Cut from rooms that were built

**A wolf-fifth keyboard in room 08.** The historical tunings — meantone, the well
temperaments — put the comma in different places, and one of those places is a single
unusable fifth. A keyboard you could play to find the wolf would have been the best
interactive in the wing. Cut on size: it needs twelve tunings' worth of tables and a
playable layout, and room 08 was already the largest room in the building. The dial
between just and equal is the honest small version, and its Machinery note says that the
straight line it draws between them is invented and that the historical temperaments are
not points on it.

**Baillie–PSW in room 11.** Named in that room's Machinery note as the best "almost" in
the subject: no composite has ever been found that fools it, none has been proved not to
exist, and it has been in production for forty years. Not built because the exhibit
would be an absence. You cannot hand someone a mechanism whose interesting property is
that nobody has managed to break it.

**A vocabulary browser for room 10's terms.** Same objection as the one raised against
room 07's, and this time it held.
