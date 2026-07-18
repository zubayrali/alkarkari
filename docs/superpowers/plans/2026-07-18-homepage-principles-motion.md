# Homepage Principles Motion Implementation Plan

**Goal:** Add three practice-driven, scroll-scrubbed set pieces to the approved Seven Thresholds homepage while preserving its calm reading rhythm, static fallbacks, and temporary `/design` workshop.

**Architecture:** `PrinciplesJourney` remains the server-rendered story composer. Each visual set piece is isolated behind a small client component that owns only its animation math. The Subha and Hadra use deterministic DOM geometry plus MotionValues; the Muraqqaʿa section and footer adapt the existing WebGL garment renderer through refs, without React state in the scroll path.

**Stack:** Next.js, React, TypeScript, Tailwind CSS, `motion/react`, existing `MuraqqaaHeroBackdrop` WebGL renderer.

---

## Task 1: Add the shared, readable entrance affordance

**Files:**

- Create: `components/home/principle-reveal.tsx`
- Modify: `components/home/principles-journey.tsx`

**Steps:**

1. Add a client wrapper that moves one block from 14px / 0.72 opacity to its final state once as it enters view.
2. Honor `prefers-reduced-motion` by rendering directly in the final state.
3. Keep the server state readable even if enhancement fails; do not reuse the existing fully-hidden stagger system.
4. Wrap principle heading blocks only, leaving structural content and links semantic.

## Task 2: Build the Subha strand set piece

**Files:**

- Create: `components/home/subha-strand.tsx`
- Modify: `components/home/principles-journey.tsx`

**Steps:**

1. Render a complete deterministic loop of 33 decorative beads and a visible thread in static markup.
2. Use section scroll progress to move the bead group through one circuit.
3. Keep a gold touch point fixed near the bottom of the loop and derive a restrained passage pulse from the same MotionValue.
4. Stop motion with scrolling and render a stationary complete loop for reduced motion.
5. Replace the current 11-by-3 circle grid with the module without changing the text-first responsive order.

## Task 3: Build the Hadra gathering set piece

**Files:**

- Create: `components/home/hadra-gathering.tsx`
- Modify: `components/home/principles-journey.tsx`

**Steps:**

1. Render two complete concentric rings of repeated `الله` tokens in static markup.
2. Derive modest clockwise and counterclockwise ring arcs from section scroll progress.
3. Counter-rotate token contents from ring-level MotionValues so each written Name remains upright.
4. Add the low-contrast central `ه` and restrained gold guide axis as distinct layers.
5. Express gather, turn, and settle with scroll-scrubbed scale, opacity, and rotation; no autoplay or infinite loops.
6. Replace the current abstract concentric-circle diagram with the module.

## Task 4: Recompose Muraqqaʿa as cloth

**Files:**

- Create: `components/home/muraqqaa-scroll-field.tsx`
- Modify: `components/home/principles-journey.tsx`

**Steps:**

1. Wrap `MuraqqaaHeroBackdrop` in a section-local client adapter.
2. Write scroll progress into the renderer's existing `progressRef` through a MotionValue subscription, not React state.
3. Use a stable seed and preserve a deliberate black fallback ground.
4. Render the completed cloth for reduced motion.
5. Remove the equal twenty-four-swatch grid and place the garment field beside the doorway photograph, never behind copy.

## Task 5: Restore the garment footer reprise

**Files:**

- Modify: `components/home/footer-cloth.tsx`
- Modify: `components/home/quiet-footer.tsx`

**Steps:**

1. Teach `FooterCloth` to honor reduced motion and pass a stable footer seed to the shared renderer.
2. Replace the thin static color hem with a shorter `FooterCloth` rise.
3. Keep footer identity, links, and logo static and fully legible.

## Task 6: Add restrained photographic drift

**Files:**

- Modify: `components/home/principles-journey.tsx`

**Steps:**

1. Reuse the existing `Parallax` primitive at a 12px range for the Siyaha and Muraqqaʿa images.
2. Overscan each image wrapper so movement never reveals an empty edge.
3. Preserve alt text, image sizing, and mobile crop priorities.

## Task 7: Verify behavior and protect the workshop route

**Files:**

- Verify: `app/(home)/page.tsx`
- Verify: `app/(home)/design/page.tsx`

**Steps:**

1. Run `pnpm vitest run`.
2. Run `pnpm types:check`.
3. Run `pnpm lint`, separating any pre-existing warnings from new failures.
4. Confirm `/` and `/design` respond successfully from the development server.
5. Inspect browser output for hydration/runtime errors and verify the reduced-motion static states where tooling permits.
6. Hand off the visual-QA checklist for desktop/mobile, light/dark, scroll reversal, reduced motion, and navigation.
