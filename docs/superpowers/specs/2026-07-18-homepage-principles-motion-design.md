# Homepage Principles Motion Pass

**Date:** 2026-07-18

**Status:** Approved design; implementation pending

**Scope:** A focused phase-two motion pass for the existing Seven Thresholds homepage skeleton

## Goal

Give the clean Seven Thresholds homepage more character by making motion explain three practices rather than decorate the page. The pass adds major set pieces for Subha, Hadra, and Muraqqaʿa, restores the Muraqqaʿa as the footer's closing material, and introduces restrained scroll affordances elsewhere.

This specification supersedes the earlier provisional allocation of Hadra, Muraqqaʿa, and Ism. Ism remains static in this phase. The page is still capped at three major set pieces.

## Source-grounded interpretation

### Subha

The Subha is treated as a repeated embodied act, not a diagram of circles. Official Karkariya material connects wearing it close to the body with remembrance, divine proximity, and struggle against the ego. The animation therefore emphasizes a strand moving through a fixed point of touch, one bead after another, without a celebratory endpoint.

### Hadra

Official Karkariya explanations describe Hadra through presence, proximity, swaying, and the gathering of the Divine Names within the letter Hā of the Name Allāh. The user's visual reference adds the physical formation: the Shaykh conducts from the center while disciples gather around him. The set piece combines these layers without attempting a literal portrait or bodily simulation.

### Muraqqaʿa

Official material describes the Muraqqaʿa as clothing made from numerous pieces of wool, fur, leather, or other fabric stitched together, often from material that would otherwise be discarded. Its meaning depends on humility, reuse, irregularity, thickness, and joining. Equal color swatches are therefore rejected as the primary visual.

## Motion hierarchy

### Major set pieces

1. Subha — a scroll-driven strand passing through repetition.
2. Hadra — two counter-moving gatherings around a conducting center.
3. Muraqqaʿa — the existing generative garment field revealed inside its own principle.

### Reprise

The footer reuses the Muraqqaʿa field as a rising cloth floor. It is part of the third set piece, not an independent fourth effect.

### Micro-motion

Other sections may use only:

- a 12–16px heading rise with opacity clarification;
- a 2–3% photographic drift;
- a divider drawing once as its section arrives.

There is no global progress spine, particle field, pinned chapter, universal stagger, or autoplaying ambient effect.

## Set piece 1: Subha strand

### Composition

Replace the current 11-by-3 bead grid with a single necklace-like loop on a visible thread. The loop remains spacious and shares the existing split layout with the principle copy.

A fixed gold touch marker sits near the bottom of the loop. The marker suggests the point where a bead passes through the hand without drawing a literal hand.

### Scroll behavior

- Section scroll progress moves the strand through one complete visible circuit.
- Individual beads pass beneath the fixed touch marker in sequence.
- Each passage produces a small compression and warm gold response at the touch point.
- A faint afterglow recedes behind the current bead.
- Reaching the end of the scroll range does not trigger completion, confetti, or a final count. The visual remains a loop.

The implementation may use thirty-three beads as a quiet visual rhythm, but it must not label the count as a doctrinal assertion or make counting the entire meaning.

### Interaction constraints

- Scroll drives the strand; it does not autoplay.
- No sound, vibration, drag interaction, or click counter.
- Bead motion remains slow enough to read as handling rather than a loading spinner.

## Set piece 2: Hadra gathering

### Composition

Two concentric rings carry repeated instances of `الله`:

- the outer gathering travels clockwise;
- the inner gathering travels counterclockwise;
- each written Name remains upright while its position travels around the ring;
- a restrained gold axis or marker at the center represents the conducting guide;
- a large, low-contrast `ه` behind the formation connects the physical gathering to the order's explanation of the Names gathered within the Hā.

The center marker is not a portrait, avatar, haloed person, or claim that the letter Hā represents the Shaykh. The human formation and doctrinal symbol remain visually related but distinct.

### Scroll behavior

The sequence has three phases:

1. Gather — the repeated Names begin loose and faint, then settle into two rings.
2. Turn — the rings move in opposite directions through modest arcs, not continuous revolutions.
3. Settle — movement decelerates as the section leaves the viewport.

The effect is scroll-scrubbed and reversible. It does not spin indefinitely after the user stops.

### Accuracy boundary

This pass communicates the user's stated formation and the official symbolic description. Exact numbers of participants, spacing, direction, tempo, bodily swaying, and the Shaykh's conducting gestures remain subject to later refinement from a representative video and timestamp. A video reference is more useful for that refinement than a transcript; transcripts remain useful for copy.

## Set piece 3: Muraqqaʿa garment

### Composition

Remove the static twenty-four-swatch grid from the Muraqqaʿa threshold. Keep the doorway photograph as the human anchor and place the existing generative garment field in the adjoining visual area.

The field must read as cloth:

- irregular pieces rather than equal tiles;
- visible seams or grout that imply joining;
- variation in scale and edge shape;
- a dark ground from which pieces emerge;
- the established twelve-color palette without presenting it as an ordered rainbow.

The existing `MuraqqaaHeroBackdrop` is the starting implementation. This phase relocates and composes it; it does not create a second garment renderer.

### Scroll behavior

- The field begins mostly in darkness as the threshold approaches.
- Scroll progress reveals and joins the pieces into a coherent field.
- The finished state remains stable long enough to inspect beside the doorway photograph.
- The canvas never sits behind body copy.

## Footer reprise

Replace the quiet footer's thin static swatch hem with the existing `FooterCloth` treatment, tuned to a shorter height if necessary.

As the footer enters, the garment rises from or unrolls into the night ground beneath the Arabic identity and navigation. The footer's text stays static and legible. The cloth is the only moving footer element; the logo receives no halo animation, and the links do not stagger.

## Shared scroll affordances

### Text entrance

Principle headings and their short explanatory paragraphs may clarify from `opacity: 0.72` and `translateY(12–16px)` to their final state once. The transition must remain readable if interrupted halfway.

### Image drift

The Siyaha and Muraqqaʿa photographs may move through at most 2–3% of their rendered height across the viewport passage. The drift cannot expose an empty edge; image overscan must cover the movement.

### Dividers

Major horizontal rules may draw once from inline start to inline end. They do not replay when the user makes small scroll corrections.

## Module design

The existing `PrinciplesJourney` remains the external interface for the homepage story. Major motion implementations sit behind internal seams:

- a Subha strand module;
- a Hadra gathering module;
- a Muraqqaʿa scroll-field adapter around the existing renderer;
- a small shared entrance-reveal module only if the existing `ScrollReveal` interface cannot express the approved micro-motion.

`PrinciplesJourney` passes localized copy and chooses placement; it does not own animation math. Scroll-driven implementations use the already-installed `motion/react` library and MotionValues. No new animation dependency is introduced.

The Muraqqaʿa section and footer are two adapters using one existing garment renderer, which makes the renderer seam real rather than hypothetical.

## Performance requirements

- Scroll hot paths write to MotionValues or refs, not React state.
- Hadra tokens share ring-level rotation values instead of creating independent animation loops.
- The Subha strand uses deterministic geometry and no random layout during render.
- The garment canvas retains its existing intersection, visibility, DPR, pixel-cap, and cleanup behavior.
- No effect runs continuously while fully outside the viewport.
- Server markup is complete before client enhancement.

## Accessibility and fallbacks

### Reduced motion

- Subha renders a complete stationary loop with one distinguished touch point.
- Hadra renders the final two-ring formation without rotation.
- Muraqqaʿa renders its completed static field.
- Footer cloth renders its completed visible state.
- Text and dividers appear without travel or drawing.

### No JavaScript or failed enhancement

- The Subha loop and Hadra formation remain present as meaningful static markup.
- The Muraqqaʿa doorway photograph remains visible if WebGL is unavailable.
- The Muraqqaʿa and footer containers retain a deliberate night ground rather than an empty hole.
- All explanatory text remains outside decorative canvases and is available to assistive technology.

### Semantics

- Decorative repeated Names, beads, rings, and cloth canvases are hidden from assistive technology.
- The visible Arabic principle names and explanatory headings remain normal semantic text.
- Motion conveys emphasis but never the only copy, sequence label, or navigation cue.

## Verification

Implementation is complete when:

- the three set pieces are scroll-driven and stop when scrolling stops;
- Ism remains static;
- the footer uses the same garment renderer as the Muraqqaʿa section;
- `prefers-reduced-motion` shows complete, legible static compositions;
- no principle content disappears with JavaScript disabled or WebGL unavailable;
- mobile layouts retain the text-first reading order and do not crop the main Arabic labels;
- `pnpm vitest run`, `pnpm types:check`, and `pnpm lint` pass;
- `/` and `/design` continue to render successfully;
- the human visual-QA pass checks mobile and desktop widths, light and dark mode, reduced motion, scroll reversal, and home-to-docs navigation.

The production-build caveat from the skeleton pass remains tracked separately if Turbopack again hangs without an actionable error.

## Deferred work

- Audio or haptic feedback
- Exact Hadra choreography derived from a chosen video timestamp
- A literal participant or Shaykh illustration
- Final doctrinal copy for the three principles
- Ism animation
- Bespoke motion for Siyaha, Khalwa, or Sirr
- Deleting the old `/design` workshop modules

## Acceptance statement

The pass succeeds when a reader can infer repetition from Subha, gathered remembrance from Hadra, and sewn humility from Muraqqaʿa before reading the explanatory copy, while the homepage still feels calm when viewed as a whole.
