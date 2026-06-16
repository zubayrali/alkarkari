# Bases expression engine: port aarnphm's bytecode VM, ship to client

Implementing Obsidian Bases requires evaluating filter expressions like `file.hasTag("x")`, `status.containsAny("finished", "evergreen")`, `rating >= 8`, and `date < today() - 7 days`. No fumadocs API covers this. Two alternatives were considered: a simple regex-pattern evaluator (as lithos does) or a full Pratt parser → bytecode IR → stack VM (as aarnphm does).

We chose to port aarnphm's VM (`quartz/util/base/compiler/`) as a standalone module in `lib/base-compiler/`, with one key difference from aarnphm's own usage: rather than evaluating expressions only at build time and emitting pre-rendered HTML, we compile expressions to bytecode at generate time and **ship the compiled bytecode to the client** alongside the notes index. The in-browser VM then re-evaluates against the notes index for interactive view switching and live filtering.

This was chosen over the regex approach because the regex approach cannot handle arithmetic, date math, array operations, method chaining, or formula expressions — all of which appear in real `.base` files. It was chosen over a third-party expression library (filtrex, jexl) because those lack the Obsidian-specific value model (`isType("null")`, `icon()`, `containsAny()`), and compatibility gaps would surface only at runtime against real vault data.

The bytecode-to-client pattern is the specific improvement over aarnphm: aarnphm gains full expression power but loses client interactivity (view switching triggers a full rebuild). Shipping bytecode gives both.

Protected notes (frontmatter `protected: true`) appear in Base query results and in `notes-index.json`, but only with `title`, `description`, and `tags` — the same surface that ADR-0001 permits on the page itself before unlock. All other custom frontmatter is stripped from the index for protected notes. A Base can filter on `file.*` properties and the three permitted fields, but `note.customProp` returns nothing for protected notes.
