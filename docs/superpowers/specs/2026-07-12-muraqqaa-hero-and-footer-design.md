# Muraqqaʿa hero + footer — "min aẓ-ẓulumāt ilā n-nūr"

Status: design — pending user review
Owner: homepage hero/footer redesign
Scope: the two **bookends** of the home page only (hero + footer). NOT the
7-chapter scroll story (`.scratch/home-scroll-story/plan.md`) — that stays a
separate, later effort.

## Concept

The Karkariya carries two brand identities: the **muraqqaʿa** (the faqīr's
patched cloak — the humble outer garment) and, behind it, the **Light** (the
Shaykh, the Tariqa, and at the center of it all the Divine Name **الله**). The
photos of the zāwiya show both at once: a whole wall tiled as a grid of solid
vivid patches, with **الله** set luminous at its heart.

The hero enacts the order's own spine — *min aẓ-ẓulumāt ilā n-nūr*, from
darkness to light — as a scroll-scrubbed arc:

> **muraqqaʿa in the dark → the Light blooms → الله, the Name of pure light.**

The footer reprises the muraqqaʿa, closing the loop: **patches → Light →
patches**.

Replaces the current passive `NightVeil` "warm smoke" shader, which carries no
muraqqaʿa, no light arc, and no interaction.

## The arc (scroll 0→1)

The hero pins for ~200vh; `scrollYProgress` drives one shader uniform.

| progress | phase | what the reader sees |
|---|---|---|
| 0.00–0.35 | **muraqqaʿa in the dark** | black grout dominates; a few patch-cells ignite from the 12-colour spectrum, dim and scattered ("exploded and adrift" — PRD emergence doctrine) |
| 0.35–0.70 | **the grid tightens** | more cells ignite into the jittered grid; a white light kindles at center; `الله` begins to glow through |
| 0.70–1.00 | **into the Light** | the bloom overtakes the patchwork near the core (patches wash toward white); **الله** resolves as luminous letters; wordmark **الطريقة الكركرية**, translit, Light Verse, tagline land |

Pin releases into the existing dawn→light page, untouched.

## Components

### 1. `MuraqqaaLightField` — `components/ui/muraqqaa-light-field.tsx` (new)

Hand-rolled raw-WebGL fragment shader. **Structural clone of `NightVeil`**:
same full-screen-triangle setup, DPR/pixel-cap (2MP), `ResizeObserver`,
`IntersectionObserver` + `visibilitychange` pause, `WEBGL_lose_context`
cleanup, `prefers-reduced-motion` handling. Zero new dependencies.

**Palette:** the 12 `--kk-patch-*` hexes hardcoded as an RGB array with a
`// keep in sync with karkari-theme.css` comment (mirrors NightVeil's PALETTE
pattern). Grout = `#0a0a0a` (`--kk-night-2`). Light = warm white → lamp-gold
core (`#d7a83f`).

**Fragment shader — jittered grid + light bloom:**
- **Grid cells:** screen UV → grid coordinates (~9 cols scaled by aspect).
  Per-cell hash-jittered seam offsets so edges are hand-cut, not ruled.
- **Cell colour:** `cellId → hash → 0..11` index into the patch palette.
  (No same-neighbour avoidance in-shader — acceptable; the JS garment handles
  that, the field doesn't need it.)
- **Grout seams:** distance-to-nearest-seam → thin dark lines (`--kk-night-2`)
  between cells.
- **Ignition:** a cell is lit when `hash2(cellId) < mix(0.15, 1.0, u_progress)`;
  unlit cells read as grout. Lit cells fade up with progress.
- **Bloom:** `center = mix(screenCenter, u_pointer, 0.35)`;
  `radius = mix(0.10, 1.4, u_progress)`. `wash = smoothstep(radius,
  radius*0.2, dist)`; lit cell colour mixes toward white by `wash * u_progress`.
  Additive gold-white core glow at the center.
- **Finish:** faint vignette + grain (reuse NightVeil), very-low-amplitude time
  shimmer on lit patches (glacial, atmosphere not animation).

**Uniforms driven at runtime:** `u_time` (subtle life), `u_progress` (scroll),
`u_pointer` (cursor, eased — "the light follows the hand").

**Progress wiring (no re-renders, no GSAP):** the component takes a
`progressRef: { current: number }` and a `pointerRef`. The render loop runs
continuously *while in view* (the time shimmer already needs it) and reads
`progressRef.current` + `pointerRef.current` each frame. The hero owns the refs
and updates `progressRef.current` from a motion `useScroll` change handler.
No React state on the hot path.

### 2. `الله` — the Name of pure light (DOM layer over the canvas)

Calligraphy must be crisp and accessible → **not** shader-drawn. A real
`<span lang="ar" dir="rtl">الله</span>` in the Amiri/Arabic face, **borderless**
(user choice): luminous white/gold letters with a soft gold glow
(`drop-shadow` from `--kk-lamp`), condensing straight out of the white bloom.
Opacity + blur + slight scale ramp in over `progress` 0.5→0.9 (driven by the
same motion value; CSS-transform only). Sits at the bloom center, above the
canvas, with the wordmark below it.

### 3. Hero restructure — `components/home/hero.tsx`

- Wrap the pinned content in the in-house sticky primitive
  (`components/home/story/sticky-scroll-story.tsx`) / motion `useScroll` —
  ~200vh tall section, inner `sticky top-0 h-screen`.
- Layer back→front: `.kk-night-panel` ground (fallback) · `MuraqqaaLightField`
  canvas · `الله` light-name · existing copy (wordmark, translit, Light Verse,
  tagline) with opacity timed to the late arc · scroll cue.
- Keep the home page's single-child `<ViewTransition>` wrapper intact
  (CLAUDE.md footgun) — the taller hero lives inside the existing wrapper.
- `FloatingParticles` (dust) may stay as a thin atmospheric overlay.

### 4. Footer reprise — `components/home/patchwork.tsx` + `footer.tsx`

Grow the existing thin `PatchworkBand` into the closing statement: a
**discrete solid-patch spectrum band** (never a blended rainbow — the
muraqqaafication of aliimam's "cosmos-spectrum") with a **pearl running-stitch**
threaded through it (`~1.2px, dash 6/5, rounded caps, currentColor-mixed` — the
canonical thread). Patches stagger in on scroll-into-view; the thread "sews"
itself (animated `stroke-dashoffset`). All motion/react — GSAP's job done
in-house. Bookends the hero: muraqqaʿa → Light → muraqqaʿa.

## Shared tokens / utilities

- Reuse `--kk-patch-1..12`, `--kk-night-2` (grout), `--kk-lamp` (light core),
  `--kk-gold`.
- Any new keyframes/utilities (thread sew, name-glow) go in `app/sewn.css`
  (the living-stitch library), consistent with the muraqqaafication PRD.

## Fallbacks (load-bearing)

- **No WebGL:** `getContext('webgl')` null → canvas stays blank, the
  `.kk-night-panel` radial ground shows; `الله` + copy render at their final
  (lit) state via a `data-static` class. Fully legible, no scroll needed.
- **`prefers-reduced-motion`:** shader renders **one static finished frame**
  (`u_progress = 1`, `u_time` frozen — NightVeil already freezes time); the arc
  does not animate on scroll; `الله` + copy show final state. No pin gymnastics.
- **No JS / SSR:** server markup renders the final-state hero (copy + a CSS
  night ground); the shader and scroll enhancement layer on after hydration.

## Constraints

- All copy via `lib/locale.ts` `home` block (never hardcoded) — add the `الله`
  string + any caption; `en` first, `fr`/`cn` follow.
- Deterministic: no `Math.random` in SSR paths; hash-based cell colour/jitter.
- Static export safe: everything client-scroll-driven, no server features.
- Effects budget (DESIGN.md): the field is a **one-off** hero shader replacing
  the one-off NightVeil — no net increase in shader instances.

## Process / verification

- Prototype on **`/design`** first (`app/(home)/design/`, noindex) — nothing
  touches the real home page until approved there (muraqqaafication PRD rule).
- Verify: eyeball the arc on `/design`; toggle `prefers-reduced-motion` (static
  frame); disable WebGL (fallback ground); check the footer band sews in.
  GLSL isn't unit-testable; visual QA on `/design` is the gate (`visual-qa`
  skill checklist).

## Files touched

- **new** `components/ui/muraqqaa-light-field.tsx` — the shader
- **edit** `components/home/hero.tsx` — sticky scroll wrap, layering, `الله`, timing
- **edit** `components/home/patchwork.tsx` — discrete-patch spectrum + sewing thread
- **edit** `components/home/footer.tsx` — grow the reprise band
- **edit** `app/sewn.css` — name-glow + thread-sew keyframes/utilities
- **edit** `lib/locale.ts` — `الله` + caption strings (en/fr/cn)
- **edit** `components/design/home-components.tsx` — live `/design` demo of both
- **retire** `NightVeil` usage in the hero (leave the file; it's a valid effect)

## Open questions

None blocking. Deferred: whether the pointer-follow bloom is too playful for the
threshold (tune on `/design`); exact pin height (200vh start, tune to copy).
