# Primordial Light design system replaces the oxblood theme

The site-wide theme moved from "oxblood/ivory editorial" to **Primordial
Light**: living blacks (night `#050505` / ink `#0b0b0d`), pearl/moon whites,
and restrained lamp gold, grounded in the order's own doctrine — the Verse of
Light ladder (24:35), *min aẓ-ẓulumāt ilā n-nūr*, and the muraqqaʿa read as
one Light refracted into twelve colours ("the divine names as the colors of a
noble rainbow"). Spec of record: `DESIGN.md`.

Decisions and their reasons:

- **Constant-night ceremonial panels.** The hero, footer, and the journey's
  dark zone (`.kk-night-panel`, `.kk-journey-dark`) are night in *both* modes,
  succeeding the old constant-oxblood panel. This makes the light/dark mode
  choice low-stakes (first impression identical) and lets the homepage's
  dark→light scroll journey read honestly in light mode. Page grounds use ink
  `#0b0b0d`, not `#050505` — deep black is reserved for the panels; long-form
  reading needs the lift.
- **`.kk-journey-dark` remaps fd tokens locally** (`--color-fd-foreground`,
  `-muted-foreground`, `-card`, `-border`, `-primary`, plus `--kk-gold*`)
  instead of giving dark-zone sections bespoke colors. Components written
  against fd tokens are automatically correct inside the zone in both modes —
  no per-component discipline required.
- **Gold text goes through `--kk-gold-ink`, never `--kk-gold`.** Lamp gold
  `#d7a83f` is ~2.6:1 on pearl — decorative only in light mode. `--kk-gold-ink`
  resolves to an AA value per mode (`#8a6a24` light / ember dark), so the
  contrast rule is encoded in the token, not in review comments.
- **`--kk-ray-1..12` luminous patch variants** (80 % patch + white, oklch) for
  thin strokes and beams on night grounds; the base patches 8/11/12 were
  lifted slightly (`#4653c4`, `#c43a50`, `#237c54`) so small fills don't go
  muddy on black. Fills use patches; anything under ~3 px on night uses rays.
- **Motion (`motion/react`), not GSAP**, for the prism hero. The library was
  already installed and already powers `reveal.tsx`/`motion-primitives.tsx`; GSAP would
  add a dependency and a second animation mental model for nothing SVG
  transforms + springs can't do. The prism animates only SVG `transform`
  *attributes* via MotionValue subscriptions (`rotate(a cx cy)`) — no CSS
  transforms on SVG (transform-origin/transform-box quirks), no SVG filters,
  zero React re-renders per frame, and the SSR markup is a finished static
  fan, so no-JS and `prefers-reduced-motion` renders are complete.
- **Hex duplicates are deliberate in three places** that CSS variables can't
  reach: `app/og/[...slug]/route.tsx` (OG image runtime) and
  `deploy/root/{index,404}.html` (standalone static files). Each carries a
  `keep in sync with karkari-theme.css` comment; drift check:
  `grep -rn '7a2230\|f4ece0\|160a0c\|d49a52' app components deploy` → empty.

**Revision: pure black/white palette (2026-07).** The warm neutrals (pearl
`#f7f4ea`, moon `#ede8da`, milk, parchment) and blue-tinted blacks (`#07111f`
midnight, `#10141c`) were replaced by a literal black-and-white ground: white
`#ffffff` / pure neutral grays in light mode, ink `#0a0a0a` / pure black
`#000000` (ceremonial panels) in dark — every gray R = G = B, zero colour
cast. The legacy light-token *names* (`--kk-pearl`, `--kk-moon`, `--kk-glass`,
…) were re-pointed at neutral values rather than removed, so consumers keep
working. The gold family and the twelve patches/rays are unchanged — they are
the identity and now the *only* colour on the ground. The sewn language became
first-class: `patchOf(key)` in `lib/patch.ts` (deterministic djb2 → patch
1..12; colours are assigned, never arrayed), `.kk-swatch` and
`.kk-stitch-border` motif primitives, and the grout doctrine (grout is the
darkness the patches emerge from; it dominates only in transition states — at
rest everything is neatly stitched). Updated contrast matrix and doctrine live
in `DESIGN.md` §1/§3.
