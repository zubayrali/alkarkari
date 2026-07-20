# Design system — "Primordial Light"

This is the visual system for the Tariqa Karkariya wiki. It draws from two
sources central to the order's own teaching, used here as concrete design
constraints, not decoration:

- **The Qur'anic Verse of Light (24:35)** supplies the site's central image —
  one light, refracted. Light set-pieces are one-offs placed in exactly one
  spot each (see the effects budget below), never reusable primitives.
- **The muraqqaʿa** — the patched cloak historically worn by Sufi ascetics as
  a mark of humility — supplies the patchwork colour system: distinct
  solid-colour patches sewn into one garment. Two concrete rules follow:
  (1) a patch colour is assigned deterministically per item via `patchOf()`
  in `lib/patch.ts` (same key → same patch, everywhere) — never picked by
  hand, never laid out as an ordered rainbow; (2) patches render as solid
  fill with a visible seam between them, never as a blended gradient.

**Where things live.** This file holds the rules that can't be read off a
screen. The living reference — every component, variant, and state rendered
with real styles — is the `/design` page. History and rationale are in
ADR-0014. Component-by-component documentation lives in `CLAUDE.md`; this
file deliberately carries **no component inventory** (inventories drift —
that's how this document rotted once already).

**Content rule:** the site never depicts Allah or the Prophet ﷺ. Photography
of the order's Shaykh uses ordinary environmental lighting only — no halo, no
glow effect applied to a person, ever, and no AI-generated or retouched
likeness. Halos (`.kk-halo`) are reserved for objects: the logo, lamps, CTAs.

---

## 1. Colour tokens

`app/karkari-theme.css` overrides Fumadocs' `--color-fd-*` tokens (imported
last in `app/global.css`, so it wins the cascade without forking the theme).

**Mode semantics:** light mode = white ground, dark mode = near-black ("ink")
ground. The hero, footer, and the homepage's dark scroll zone are night in
*both* modes — those sections don't follow the light/dark toggle.

**Palette:** every gray is neutral (R = G = B — no warm off-whites, no
blue-blacks). The only colour on the ground comes from two families: gold
(the lamp) and the twelve muraqqaʿa patches (the refraction). Approximate
budget across a page: ~70% neutral ground, ~20% patch accents (chips, hems,
seals), ~10% full-colour set pieces.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-fd-background` | `#ffffff` | `#0a0a0a` | page ground |
| `--color-fd-foreground` | `#0a0a0a` | `#ededed` | body text |
| `--color-fd-muted` | `#f5f5f5` | `#161616` | muted surfaces |
| `--color-fd-muted-foreground` | `#595959` | `#a3a3a3` | secondary text |
| `--color-fd-primary` | `#8a6a24` (gold-ink) | `#d7a83f` (lamp) | links / primary |
| `--color-fd-border` | `#e5e5e5` | `#262626` | dividers |
| `--color-fd-card` | `#fafafa` | `#121212` | raised surfaces |

**Dark tokens** (constant, don't flip with mode): `--kk-night` `#000000`
(ceremonial panels only — page grounds use ink, not pure black, for reading
comfort), `--kk-night-2` `#0a0a0a` (ink / grout), `--kk-veil-c` `#161616`,
`--kk-smoke` `#262626`, `--kk-midnight` `#111111`, `--kk-night-fg` `#ffffff`,
`--kk-night-muted` / `--kk-night-line` (white alphas).

**Light tokens** (legacy warm names kept for backward compatibility, all
re-pointed at neutrals): `--kk-white` = `--kk-pearl` = `--kk-milk` `#ffffff`,
`--kk-glass` `#f5f5f5`, `--kk-moon` = `--kk-parchment` `#ededed`, `--kk-mist`
`#d4d4d4`.

**Gold tokens:** `--kk-lamp` `#d7a83f`, `--kk-oil`, `--kk-ember` `#e8c766`,
`--kk-brass`, `--kk-halo-c` `#f3e6b0`. Use gold for thin lines, seals, halos,
and small accents — never as a large fill.

**Mode-varying accent aliases** (stable names, value depends on mode):
`--kk-gold` (decorative gold), `--kk-gold-ink` (the only gold safe for body
*text* — see contrast matrix below), `--kk-soft` (translucent gold wash).

**The patch spectrum:** `--kk-patch-1` through `--kk-patch-12` are the twelve
cloak colours — vivid in both light and dark mode, never neutralized.
`--kk-ray-1..12` are luminous variants (80% patch + white, mixed in oklch)
for thin strokes/beams on dark grounds — anything under ~3px on a black
background should use a ray token, not a patch token, or it goes muddy.

**Assignment rule:** never hardcode which patch a thing gets, and never lay
patches out in array/list order (that reads as a rainbow, which this system
deliberately isn't). Always go through `patchOf(key)` (`lib/patch.ts`), a
deterministic hash (djb2 → 1..12) so a given key always gets the same patch.
Two blessed exceptions may enumerate the spectrum in order: the `/design`
spec sheet, and `deploy/root/index.html`'s hem strip.

### Contrast matrix (WCAG 2.x, computed)

| Pair | Ratio | Verdict |
|---|---|---|
| white `#ffffff` on night `#000000` | 21:1 | body text on night panels |
| ink `#0a0a0a` on white `#ffffff` | 19.8:1 | body text, light mode |
| `#ededed` on ink `#0a0a0a` | 16.9:1 | body text, dark mode |
| muted `#595959` on white | 7.0:1 | secondary text, light mode |
| muted `#a3a3a3` on ink | 7.9:1 | secondary text, dark mode |
| lamp `#d7a83f` on ink `#0a0a0a` | 9.0:1 | gold text allowed in dark zones |
| ember `#e8c766` on ink | 12.1:1 | bright gold text on dark grounds |
| gold-ink `#8a6a24` on white | 5.0:1 | AA — the only gold *text* on light |
| white on gold-ink `#8a6a24` | 5.0:1 | primary button label |
| lamp `#d7a83f` on white | 2.2:1 | **decorative only** in light mode |

This is enforced through tokens rather than manual discipline: gold text
always resolves through `--kk-gold-ink`, which is pre-computed to an AA-safe
value per mode, and `.kk-journey-dark` remaps the fd tokens themselves to
night values — so a component written against standard fd tokens is
automatically correct inside that zone without special-casing.

### Grout and seam states

"Grout" is the near-black gap between patches (`--kk-night-2`). It's a state
indicator, not a fixed border style:

- **At rest**, patches sit adjacent, separated by a 1px stitched seam —
  grout reads as a hairline.
- **During an entrance or transition animation**, grout is wide: the patches
  are still visually "unsewn," and it narrows to the resting hairline as the
  animation settles.

---

## 2. Typography

Loaded in `app/layout.tsx` as `next/font` variables, bound in
`karkari-theme.css`.

| Face | Variable | Used for |
|---|---|---|
| **Inter** | (body default) | body / UI |
| **Spectral** | `--font-spectral` | headings `h1–h6` (editorial serif) |
| **Amiri** | `--font-amiri` | Arabic / RTL — `[lang="ar"]`, `.kk-arabic` |
| **IBM Plex Mono** | `--font-mono-plex` | labels / meta (`.kk-label`) |

Arabic text blocks must carry `dir="rtl" lang="ar"` (or the `.kk-arabic`
utility class). `۞` (U+06DE, rub el-hizb) is the standard section-break
glyph — use it for section bullets/accents, not inline in body prose.

---

## 3. Motifs — the CSS vocabulary, and when (not) to use it

Every class here is defined in `app/karkari-theme.css` or `app/sewn.css` and
demonstrated live on `/design`.

| Motif | Class / helper | Use for | Don't |
|---|---|---|---|
| **Halo** | `.kk-halo`, `.kk-halo-hover` | lamps, CTAs, the logo — objects only | on or behind a person, ever |
| **Veil** | `.kk-veil` + `.kk-veil-lift` | imagery that reveals on hover/focus | text content; don't use `backdrop-filter` |
| **Thread / alif** | `.kk-thread` | vertical dividers between homepage sections | dense/repeated use |
| **Stitch seam** | `.kk-stitch-t` / `.kk-stitch-b` | a single top or bottom edge on a card/section | full-perimeter borders — use stitch border instead |
| **Stitch border** | `.kk-stitch-border` | a full patch outline — chips, swatches, featured cards | the default border for every card/panel |
| **Swatch** | `.kk-swatch` + `--kk-swatch-color` | a small patch next to a term/link, coloured via `patchOf(key)` | decorative confetti; hand-picked colours |
| **Patch assignment** | `patchOf()`, `lib/patch.ts` | the only way to choose a patch colour for a key | ordered/rainbow arrays, random picks |
| **Niche** | `.kk-niche` | arched image frames (guide portrait, featured accents) | generic body containers |
| **Glow** | `.kk-breathe` | one breathing glow behind a light set-piece | more than one glow per view; any glow on a reading surface or a person |
| **Link stitch** | `.kk-link-stitch` | inline links whose underline stitches on hover | headings, buttons |
| **Tighten** | `.kk-tighten` | hover compaction on cards | anything without a hover affordance |
| **Section-break glyph `۞`** | inline text | section bullets/accents | body prose |

**Avoid everywhere:** neon/cyberpunk glow, glossy tech gradients, luxury-gold
branding, saturated rainbow fills on light grounds, horror-style darkness,
halos on people, fantasy/religious-icon lighting on a person.

**Effects budget — the catalog is capped.** An animated effect earns its place
by carrying meaning; decoration that needs a "keep this rare" warning is a cut
candidate, not a primitive. The load-bearing set is small and fixed: `patchOf`
swatches, the stitch family (`.kk-stitch-*` + `.kk-thread-run`),
`.kk-link-stitch`, `FlipLink` (the ways-in letter-roll link), `StitchFrame`,
`.kk-tighten`, and the night ground + gold.
Everything else — a light set-piece, a portrait treatment, a hem — is a
**one-off placed in exactly one spot**, never a reusable primitive. The
current one-offs: `NightVeil` (hero ground — glacial warm-smoke shader),
`LightBurstScroll` (the Light chapter), the wandering photograph chapters
(`StickyScrollStory`), and the foundations shelf (`FoundationsPanels`).
Retired: `.kk-shimmer`, `.kk-flicker`, `.kk-spin`, `.kk-bloom-petal`,
the pointer-glow border, the particle starfield, and the prism/mosaic/dust
generation of hero set-pieces — near-duplicate light effects that added
surface without meaning.

**Reduced motion:** every effect must have a static fallback under
`prefers-reduced-motion: reduce` — scroll-linked pieces render their final
state, staggers appear at full opacity, glows stop animating, and reveals
become an opacity-only fade. A new effect without its fallback doesn't ship.

### Notebook chrome

Notebook chrome is everything on a docs page that isn't article content:
sidebar, TOC, search, panels, footers, indicators. The motif table above
gives each motif a home; these rules govern how motifs combine on chrome so
that no single motif becomes a default skin.

1. **Default container treatment: hairline border + surface contrast.**
   Chrome containers (sidebar, TOC, properties panel, search panes,
   prev/next cards, locale switcher, backlink cards) use a 1px solid
   `--color-fd-border` border and background-color steps (`fd-card`,
   `fd-muted`) to create grouping and hierarchy — contrast, not decoration,
   does the structural work. The dashed border (`.kk-stitch-border`) is an
   accent treatment, not a container default. A single dashed edge
   (`.kk-stitch-t`/`.kk-stitch-b`) may serve as an internal divider — under
   a panel header, above a footer card — never a full dashed perimeter on a
   static container.

2. **Dashed strokes encode incomplete or inactive states.** A dashed stroke
   is only used where a solid stroke of the same element represents the
   completed/selected state: inactive locale entries (dashed underline) vs.
   the current one (solid), the unfilled track of the progress bar vs. its
   filled portion, hover-revealed edge highlights. Permanently dashed
   decoration is not allowed.

3. **Two accent-color roles, never mixed.**
   - **Categorical accents** — the 12-patch palette via `patchOf()` —
     identify *what something is* (tag, callout type, code language, folder,
     search section). In chrome they render only as small-scale elements:
     colour dots (`Swatch`) and 2–6px tabs or edge bars. Never as a
     background fill larger than a chip.
   - **Selection/progress accent** — gold (`--kk-gold-ink`) — marks *where
     the user is or how far along*: active nav item, active TOC entry,
     active sidebar item, heading underline, progress bar. One gold
     indicator per region, and position marks are never patch-coloured.

4. **Emphasis budget: one decorated focal component per view.** The full
   decorative frame (`StitchFrame`) is the highest-emphasis treatment and
   marks exactly one focal component per surface: the review card within
   article content, the search dialog as an overlay, the featured card on
   the homepage. All other components fall under rule 1.

| Surface | Treatment |
|---|---|
| Sidebar tree | plain ground; folder colour dots; active item = 2px gold bar |
| TOC | solid hairline rail; active entry = gold segment |
| Callouts | `fd-card` + hairline + solid patch tab (by callout type) |
| Properties panel | `fd-card` + hairline; dashed divider under header only |
| Sidenotes | plain Tufte marginalia — no box/border/fill; a smaller serif gloss with a quiet superscript reference; faint ink wash on hover/arrival only |
| Tag chips | `.kk-stitch-border` + colour dot (chips are the blessed stitch-border use) |
| Prev/next cards | ground card + destination colour dot + hover tighten |
| Backlinks | dashed top edge only (single-edge rule) |
| Code blocks | dark ground + patch language tab |
| Search dialog | `StitchFrame` (the view's one focal frame) |
| Review card | `StitchFrame` (ditto, within article content) |
| Locale switcher / nav progress | dashed→solid state pairs (rule 2 exemplars) |

---

## 4. Homepage composition — intent

`app/(home)/page.tsx` (hand-authored) is a single scroll narrative that
answers three questions in order — *what is the way, who is the guide, what
is the practice* — moving from darkness into light (*min aẓ-ẓulumāt ilā
n-nūr*):

1. **Hero** (night panel) — the Arabic wordmark and the site's one-line
   promise over the `NightVeil` shader ground (glacial warm smoke; static
   frame under reduced motion).
2. **Dark journey** (`.kk-journey-dark`, constant night, fd tokens remapped
   locally) — the Way (`#way`), the Shaykh (`#shaykh`, portrait in a
   `.kk-niche`, environmental lighting only), the wandering — full-bleed
   photograph chapters whose words rise through the pinned frame, ending in
   the khalwa — the Silsila (`#silsila`), and the Light (`#light`).
3. **Dawn transition** (`.kk-journey-dawn`) — a gradient dissolve from the
   dark zone into the page ground.
4. **Light zone** — the founding principles as an expanding-panel shelf
   (`#foundations`), voices/testimonies (`#voices`), the ways-in index
   (large serif `FlipLink` rows, a table of contents rather than cards),
   recent notes, key terms — on the white ground. (In dark mode the light
   zone doesn't switch to white — the transition is carried by rising gold
   intensity instead. Deliberate exception to the §1 mode rule.)
5. **Footer** (night panel) — the single return to night: one doctrinal
   close ("light upon light"), the logo with `.kk-halo`. No second dark
   finale before it.

All homepage copy comes from `lib/locale.ts`'s `home` block — never hardcode
homepage prose in components. Which components implement which chapter is
documented in `CLAUDE.md` and demonstrated on `/design`; this file only pins
the sequence and its meaning.

---

## 5. Imagery

Photos are static-imported from `components/home/images/` — never placed in
`public/`, since `pnpm generate` wipes that directory. Rendered via
`next/image` with `placeholder="blur"`; source files should be pre-sized
since `images.unoptimized` means no server-side resizing happens.

**Treatment rules:** gallery photos sit under a `.kk-veil` that lifts on
hover/focus. The Shaykh's portrait gets a diagonal room-light gradient only —
no halo, no glow effect on the figure, and no AI-generated or retouched
likeness (see the content rule at the top).

---

## 6. Accessibility

- **Reduced motion:** every animation has a static fallback (see §3).
- **Contrast:** see the matrix in §1. Body copy uses `--color-fd-foreground`;
  night panels use `--kk-night-fg`; gold text must go through
  `--kk-gold-ink`, never raw `--kk-gold`.
- **Focus:** interactive veils lift on `:focus-within`; `.kk-halo-hover` also
  fires on `:focus-visible`; default focus outlines are never removed.
- **RTL:** Arabic text carries `dir="rtl" lang="ar"`.
- Light set-pieces, hems, and glows are decorative (`aria-hidden`) — meaning
  always lives in real text, and image alt text comes from locale strings,
  not from the decorative layer.

---

## 7. Keeping colours in sync

CSS custom properties in `karkari-theme.css` are the single source of truth.
Three places have to hardcode hex values by necessity and carry a `keep in
sync with karkari-theme.css` comment: `app/og/[...slug]/route.tsx` (the OG
image runtime can't read CSS custom properties), and
`deploy/root/index.html` + `deploy/root/404.html` (standalone static files
outside the Next.js build).

Check for drift from the retired warm palette:

```
grep -rni 'f7f4ea\|ede8da\|fff9e8\|efe4cc\|e9f2f0\|d9dad2\|a6a296\|07111f\|10141c\|050505' app components lib deploy
```

This must return nothing.
