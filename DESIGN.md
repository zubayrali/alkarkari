# Tariqa Karkariya — Design System

The visual language is taken from the zāwiya itself, not a generic preset. Two
things carry it:

- **The Muraqqaʿa** — the patched cloak. The shaykh's cloak and the zāwiya wall
  are both **grids of solid, vivid colour** (crimson, orange, saffron, lime,
  emerald, teal, cobalt, indigo, violet, magenta). That patchwork — unity made
  of many colours — is the identity. Not earth tones.
- **Nūr** — light. Handled as light *through* the patchwork (stained glass), a
  glow glimpsed, never a spotlight.

Framed by **Moroccan geometry** (the khatim eight-point star, the mihrab arch,
thin grid lines) on a deep **oxblood** ground — editorial, like the institute's
own print work (the *NŪN* magazine, the Jeeran-style oxblood/rose palette).

> **The symbolism is shown, never captioned.** This is esoteric knowledge; the
> homepage alludes, it does not explain. Do not add "the twelve letters = twelve
> lights = the cloak" prose. Show the cloak; let it be.

---

## 1. Colour tokens

Fumadocs `--color-fd-*` tokens are **overridden** (not forked) in
`app/karkari-theme.css`, imported last in `app/global.css`.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-fd-background` | `#f4ece0` (warm ivory) | `#160a0c` (oxblood-black) | page |
| `--color-fd-foreground` | `#2a1418` | `#efe4d8` | text |
| `--color-fd-primary` | `#7a2230` (oxblood) | `#d49a52` (gold) | links / primary |
| `--color-fd-border` | `#e3d6c4` | `#3a1f23` | dividers |
| `--color-fd-card` | `#faf4ea` | `#1e0e10` | raised surfaces |

**Karkari accents**: `--kk-gold` (ochre, the logo colour), `--kk-rose`,
`--kk-green` (mihrab), `--kk-soft` (translucent gold).

**Oxblood panel** (constant in both themes — hero + footer):
`--kk-oxblood` `#2a0d11`, `--kk-oxblood-2` `#190709`, `--kk-oxblood-fg`
`#f1e6d8`, `--kk-oxblood-muted` `#b3938a`.

**The Muraqqaʿa spectrum** `--kk-patch-1..12` — the real cloak colours, vivid in
both themes. Use these for the mosaic and as accent rhythm; never raw hex.

---

## 2. Typography

Loaded in `app/layout.tsx` as `next/font` variables; bound in `karkari-theme.css`.

| Face | Variable | Used for |
|---|---|---|
| **Inter** | (body default) | body / UI |
| **Spectral** | `--font-spectral` | headings `h1–h6` (editorial serif) |
| **Amiri** | `--font-amiri` | Arabic / RTL — `[lang="ar"]`, `.kk-arabic` |
| **IBM Plex Mono** | `--font-mono-plex` | labels / meta (`.kk-label`) |

Arabic blocks must carry `dir="rtl" lang="ar"` (or `.kk-arabic`). `۞` (U+06DE,
rub-el-hizb) is the standard section bullet.

---

## 3. Motifs & effects — when to use each

| Effect | Component | Use for | Don't |
|---|---|---|---|
| **Khatim star mosaic** | `muraqqaa.tsx` → `MuraqqaaStar` | the hero visual only | repeat it; it's the centrepiece |
| **Cloak hem** | `muraqqaa.tsx` → `MuraqqaaHem` | section dividers, footer top | page chrome |
| **Khatim glyph `۞`** | inline | section bullets / accents | body prose |
| **Section reveals** | `reveal.tsx` | homepage sections (≤500ms, once) | long docs pages |
| **Nūr glow / shimmer** | CSS (`.kk-breathe`, `.kk-shimmer`) | behind/inside the mosaic | everywhere — keep light scarce |

All honour `prefers-reduced-motion`: mosaic appears instantly, shimmer/breathe/
spin stop, reveals become opacity-only.

---

## 4. Component inventory (`components/home/`)

- `muraqqaa.tsx` — `MuraqqaaStar` (khatim-clipped stained-glass mosaic, stitches
  in + backlit + shimmers) and `MuraqqaaHem` (cloak-hem divider band).
- `hero.tsx`, `zawiya-footer.tsx`, `sections.tsx` — server components composing
  the client primitives + `reveal.tsx` with data from `lib/home-data.ts`.
- `sections.tsx` → `ContextGallery` shows the real vault photos (cloak, ḥaḍra,
  zāwiya) with one-word Arabic captions — no explanation.

---

## 5. Imagery

Real photos live at `components/home/images/` (logo, cloak, hadra, shaykh,
zawiya, zawiya-wall, nun-magazine) and are **static-imported** — never in
`public/`, which `pnpm generate` wipes. `next/image` with `placeholder="blur"`;
pre-size files (`images.unoptimized` = no server resizing).

---

## 6. Accessibility

- **Reduced motion**: every animation degrades (see §3).
- **Contrast**: oxblood `#7a2230` and gold on ivory pass AA for text/UI; keep
  body copy on `--color-fd-foreground`. The oxblood panel uses `--kk-oxblood-fg`.
- **RTL**: Arabic carries `dir="rtl" lang="ar"`.
- The mosaic and glow are decorative (`aria-hidden`); meaning lives in real text.
