# Homepage Seven Thresholds Skeleton

**Date:** 2026-07-18

**Status:** Approved design; implementation pending

**Scope:** Phase-one structural rewrite of the home page at `/`

## Goal

Turn the home page into a calm introduction to the Tariqa Karkariya through its seven founding principles. Phase one establishes the complete responsive composition without attempting to finish the three major animated set pieces. The resulting skeleton must be coherent enough to judge as a whole and modular enough to refine one principle at a time later.

The home page remains the hand-maintained shell page established by ADR-0003. Generated pages and the Fumadocs documentation shell are unchanged.

## Canonical content model

The home page uses this canonical order:

1. Subha
2. Siyaha
3. Hadra
4. Muraqqaʿa
5. Ism
6. Khalwa
7. Sirr

Muraqqaʿa means the patched garment. Murāqaba means spiritual watchfulness. They are distinct concepts and must never share a title, slug, summary, or visual treatment.

Wird, commitment, biography, lineage, and teachings about the Light may supply context, but they do not replace a principle in the seven-part sequence.

The detailed foundation notes currently in the vault are placeholders. Phase one does not treat their prose or numbering as canonical.

## Narrative architecture

The page has five parts.

### 1. Threshold hero

A quiet, asymmetric photograph-and-text composition replaces the generative patchwork hero. It contains the Arabic wordmark, one concise statement of purpose, and a subtle invitation to continue. Phase one uses a static image and no major animation.

### 2. Contextual prelude

One compact editorial passage answers three questions: what is this way, who transmits it, and why Light matters. The Tariqa, Shaykh, initiatic lineage, and Light no longer receive separate homepage chapters. The prelude links readers toward deeper pages without reproducing the official organization site's navigation taxonomy.

### 3. Seven thresholds

Each principle receives a dedicated section of approximately one viewport or more. Every section has:

- the canonical name and transliteration;
- a concise provisional explanation;
- a distinct composition that can later accept a bespoke visual;
- semantic section markup and a stable fragment identifier;
- an optional deeper-reading link only when a verified destination exists.

Phase one renders the three future set-piece locations as intentional static compositions:

- Hadra: reserved rhythmic field;
- Muraqqaʿa: reserved sewn-patch field;
- Ism: reserved typographic light field.

Subha, Siyaha, Khalwa, and Sirr use photography, typography, repetition, and negative space. The page does not simulate unfinished animations with generic placeholders.

### 4. Continue studying

A typographic index replaces the navigation-card, recent-note, key-term, testimony, and boxed-call-to-action grids. It provides a small number of verified routes into the knowledge base, such as learning terms, reading teachings, and hearing lived accounts.

### 5. Footer

The existing night footer remains, simplified where necessary. The patched garment appears as a narrow, mostly static sewn hem. It is a quiet reprise, not a fourth animated set piece.

## Material removed from the homepage story

Phase one removes these from the active home-page composition:

- the standalone Shaykh biography and date chronology;
- the sticky wandering biography sequence;
- the standalone Silsila timeline;
- the large Light chapter and Mishkat carousel;
- the testimony-card grid;
- the boxed “Begin” call to action;
- recent-note, key-term, and navigation-card grids;
- the scroll-progress spine.

The underlying modules are not deleted in phase one. `/design` remains a temporary workshop, and some retired modules are still useful references there. Deletion and dependency cleanup happen only after the replacement is visually accepted.

## Visual grammar

Phase one keeps the Primordial Light design system from ADR-0014 and uses it more strictly:

- neutral black and white form the ground;
- lamp gold marks orientation, links, and emphasis;
- the twelve patch colors remain restrained until Muraqqaʿa;
- Spectral carries English narrative text;
- Amiri carries Arabic;
- IBM Plex Mono carries labels and navigation markers;
- Inter remains in Fumadocs chrome but is not the primary homepage voice;
- photographs use deliberate square-edged crops and archival captions;
- rounded card grids are absent from the narrative;
- stitching appears only where concepts are joined.

Ordinary fades and small entrance transitions are optional polish, not major set pieces. Phase one may ship with no section animation.

## Motion budget for later phases

The final page is capped at three major animated set pieces:

1. Hadra — distinct elements resolving into collective rhythm.
2. Muraqqaʿa — separate patches drawing into a coherent sewn field.
3. Ism — a typographic field gathering toward the singular Name.

The hero, footer, and remaining principles cannot acquire competing spectacle without revisiting this design.

Every future effect must supply a static rendering, a reduced-motion rendering, and a no-JavaScript or failed-enhancement fallback.

## Module design

The shell page should become an assembler rather than a 350-line implementation.

### Canonical principle-data module

A React-free module in `lib/` owns the canonical identifiers, order, stable fragment IDs, and verified destination state. Its small interface accepts localized principle strings and returns the ordered home-page principle model. This creates one seam for ordering and terminology and prevents page JSX, navigation, and future set pieces from drifting independently.

Localized prose remains in the existing site-string system. Phase one reuses suitable strings and adds only the keys required by the new structure. Detailed doctrinal rewriting remains a separate content pass.

### Home-page story module

A home-page story module owns the prelude, seven-threshold sequence, and continue-studying handoff behind one small interface. Individual threshold implementations remain internal until their behavior becomes complex enough to justify a real seam. This preserves locality while allowing each section to be refined independently.

The existing `Hero` and `Footer` modules remain the external bookends. `Hero` is simplified to a static threshold. `Footer` is retained and quieted rather than rebuilt.

### Page assembler

`app/(home)/page.tsx` keeps server-side locale and home-data loading, the required `ViewTransition` wrapper, and assembly of the hero, story, and footer. It must not contain the internal markup of every narrative chapter.

## Data flow

1. The shell page resolves the active locale and site strings.
2. The canonical principle-data module combines localized strings with the fixed seven-principle order.
3. The page passes the resulting model to the home-page story module.
4. The story module renders stable semantic sections and verified links.
5. Static image imports provide build-time validation and blur placeholders.

Incorrect or missing principle destinations do not produce broken links. The deeper-reading affordance is omitted until the corresponding note has canonical content and a verified route.

## Responsive and accessibility requirements

- The narrative remains understandable with CSS and JavaScript disabled.
- Every principle is a labelled `<section>` with a stable heading hierarchy.
- Decorative visual fields are hidden from assistive technology.
- Images have localized meaningful alt text; captions do not duplicate alt text.
- Hero and principle layouts stack without horizontal scrolling on narrow screens.
- Text measure remains readable at desktop widths.
- Keyboard focus remains visible on every link.
- Reduced-motion settings cannot hide content or create empty reserved fields.
- Color is not the only signal for order or navigation.

## Failure behavior

- Missing required static images fail the build rather than silently producing an empty frame.
- Missing or malformed site strings fail the existing site-string validation.
- An unverified foundation route renders no deeper-reading link.
- If a future enhancement fails, the static composition remains the complete experience.

## Verification

Implementation is complete when:

- `pnpm types:check` passes;
- `pnpm lint` passes;
- the production build completes if the local generated content is current;
- `/` renders all five narrative parts and all seven principles in canonical order;
- no link on the new home page targets the inaccurate Muraqqaʿa/Murāqaba placeholder;
- the page works at narrow mobile and wide desktop widths;
- light mode, dark mode, keyboard navigation, and reduced motion receive a visual check;
- `/design` still renders because its temporary workshop modules were preserved.

Visual verification follows the repository's visual-QA handoff because automated browser tooling is not assumed to be available.

## Deferred work

- Final copy for the seven principles
- Rewriting and renaming the placeholder foundation notes
- Final image selection or acquisition
- Hadra, Muraqqaʿa, and Ism animated set pieces
- Fine-grained section transitions
- Deleting retired homepage modules
- Reducing or removing `/design`
- Broader customization of the Fumadocs documentation shell

## Acceptance statement

Phase one succeeds when the home page reads as a calm seven-part introduction, the three future set-piece locations are obvious without being falsely finished, and each principle can be refined later without restructuring the whole page.
