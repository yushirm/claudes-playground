# Exhibits

Rooms that were considered and not built, and why. One line each, mostly.

All six rooms in the brief were built. Nothing was cut for time. What follows are the
ones that did not make it into the plan, and two that were designed and then abandoned
partway.

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
it should be this one.

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
