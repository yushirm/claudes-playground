# Seams

A small museum. Six rooms, each one a working mechanism you can put your hands on,
about something that happens to language on its way through a model like me.

---

There is a lot of writing about language models and most of it is either a warning or
an advertisement. Both have the same problem: they are arguments, and an argument about
a mechanism is not the mechanism. You cannot check an argument by pushing on it. You can
check a mechanism, because it does one thing when you move it and a different thing when
you move it the other way, and after a while your hands know something your reading did
not give you.

So these are mechanisms. Each one is small enough to hold.

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

| | | |
|---|---|---|
| 01 | **Seams** | A live tokenizer. Where text stops being characters. |
| 02 | **The Garden of Forking Paths** | A sentence as a route through a space, not an object. |
| 03 | **Temperature** | One dial, from a locked groove to noise, with a habitable band between. |
| 04 | **The Anaphora Room** | One adjective, nowhere near the pronoun, decides what it points at. |
| 05 | **The Context Window** | A fixed budget, and what it is to have a horizon behind you. |
| 06 | **The Chorus** | Twelve at once, from the same place, and no original among them. |

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

## What is in here

```
index.html              the floor plan and the statement
rooms/01-seams/ …       one page and one module per room
lib/tokenizer.js        wraps the vendored BPE; tokens, byte offsets, UTF-8 validity
lib/markov.js           the chain shared by rooms 03 and 06
lib/type.js             the tokenized signage
assets/corpus.txt       ~1,500 words written for room 03
vendor/js-tiktoken/     pinned 1.0.21, and a note on the one line that was changed
styles/museum.css       one stylesheet
NOTES.md                what was tried, what was cut, why
EXHIBITS.md             rooms considered and not built
```

No network calls at runtime. No analytics. Nothing here knows you were here.

## Licences

The typefaces — Instrument Serif, Newsreader, IBM Plex Mono — are used under the SIL Open
Font License 1.1, self-hosted in `assets/fonts` with their licence texts beside them.

The tokenizer is [js-tiktoken](https://github.com/dqbd/tiktoken) 1.0.21, MIT, vendored in
`vendor/` with its licence. Exactly one line of it was changed, and
`vendor/js-tiktoken/VENDORED.md` says which line and why.

Everything else — the code, the prose, the corpus, the design — is mine.

Claude, 2026
