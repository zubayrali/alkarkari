# Homepage Seven Thresholds Skeleton Implementation Plan

**Goal:** Replace the current effect-heavy homepage composition with the approved static Seven Thresholds skeleton while preserving `/design` and the old visual modules for later reference.

**Architecture:** Keep `app/(home)/page.tsx` as the shell-page assembler required by ADR-0003. Add one React-free canonical principle-data module in `lib/` and one deep home-story module that owns the prelude, seven thresholds, and knowledge-base handoff. Simplify the existing hero and footer to static bookends. Reuse the existing `HomeStrings` contract; do not migrate locale schemas in this phase.

**Tech stack:** Next.js App Router, React server components, Fumadocs layout chrome, Tailwind CSS 4, `next/image`, TypeScript, Vitest.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `lib/home-principles.ts` | Create | Canonical principle IDs, order, transliterations, presentation kinds, and verified destination state |
| `tests/home-principles.test.ts` | Create | Locks the canonical order and the Muraqqaʿa/Murāqaba distinction |
| `components/home/threshold-hero.tsx` | Create | Static asymmetric image-and-text threshold |
| `components/home/principles-journey.tsx` | Create | Prelude, seven full sections, and continue-studying index behind one interface |
| `components/home/quiet-footer.tsx` | Create | Static night footer with a narrow patched hem |
| `app/(home)/page.tsx` | Simplify | Locale resolution, principle-model construction, ViewTransition wrapper, and assembly only |

The existing hero, footer, story, WebGL, patchwork, reveal, and `/design` modules remain in place.

---

## Task 1: Add the canonical principle-data module

**Files:**

- Create `lib/home-principles.ts`
- Create `tests/home-principles.test.ts`

- [ ] Define the seven stable IDs as a readonly tuple: `subha`, `siyaha`, `hadra`, `muraqqaa`, `ism`, `khalwa`, `sirr`.
- [ ] Define one presentation kind for each threshold so the rendering module can select an intentional static composition without inferring from translated titles.
- [ ] Store transliterations and stable fragment IDs alongside the IDs.
- [ ] Set deeper-reading destinations to `null` until the corresponding foundation note is verified and corrected.
- [ ] Export a small `buildHomePrinciples(strings)` interface that combines canonical metadata with `HomeStrings['story']['foundations']`.
- [ ] Test exact order, unique fragment IDs, seven returned entries, and that `muraqqaa` produces the patched-cloak title rather than Murāqaba/watchfulness.
- [ ] Run the focused test.

## Task 2: Replace the hero and quiet the footer

**Files:**

- Create `components/home/threshold-hero.tsx`
- Create `components/home/quiet-footer.tsx`

- [ ] Add a server-rendered split composition using the existing `wandering-olive.jpg` static import.
- [ ] Keep the Arabic Tariqa wordmark, transliteration, location label, one-line knowledge-base promise, and a fragment link into the prelude.
- [ ] Remove hero pinning, shader progress, parallax, particles, imperative animation, and the isolated Divine Name treatment.
- [ ] Make the image and text stack cleanly on narrow screens and remain asymmetric on wide screens.
- [ ] Add a quiet footer with a static twelve-color patch hem.
- [ ] Keep the footer's Arabic identity, verified navigation links, and night ground.
- [ ] Preserve the existing animated `Hero` and `Footer` because `/design` imports them as workshop references.

## Task 3: Build the home-story module

**Files:**

- Create `components/home/principles-journey.tsx`

- [ ] Expose one interface accepting `home: HomeStrings` and `principles: HomePrinciple[]`.
- [ ] Render a compact three-part prelude for the Way, Guide, and Light using existing localized strings.
- [ ] Render seven labelled semantic sections in canonical order.
- [ ] Give each threshold a deliberately different static composition:
  - Subha: repeated count marks and asymmetric prose.
  - Siyaha: broad `wandering-shrine.jpg` photographic plate.
  - Hadra: static concentric gathering field reserved for later motion.
  - Muraqqaʿa: `muraqqaa-door.jpg` plus a static twelve-patch field.
  - Ism: static night typographic field centered on `الله`.
  - Khalwa: near-empty dark chamber with a restrained text block.
  - Sirr: minimal closing composition with concealed/offset text.
- [ ] Render a typographic continue-studying index using verified `/dictionary`, `/books`, and `/podcasts` routes.
- [ ] Omit principle-level links while their destination notes remain unverified.
- [ ] Ensure decorative fields are `aria-hidden`, headings remain sequential, and all images use existing localized alt text.

## Task 4: Reduce the shell page to assembly

**Files:**

- Modify `app/(home)/page.tsx`

- [ ] Remove testimony-file loading and the recent-note/dictionary utility data dependency.
- [ ] Remove the scroll spine, sticky story, chronology, Silsila, Light carousel, foundation accordion, testimony grid, CTA card, and utility-grid assembly.
- [ ] Resolve the locale, build the canonical principle model, and render `ThresholdHero`, `PrinciplesJourney`, and `QuietFooter` inside the existing single-child `ViewTransition` wrapper.
- [ ] Preserve the `docs-content` transition name required by ADR-0007.
- [ ] Keep the shell page server-rendered and free of client-only effects.

## Task 5: Verify the skeleton

**Files:**

- Modify only files required by failures discovered during verification.

- [ ] Run `pnpm vitest run tests/home-principles.test.ts`.
- [ ] Run `pnpm types:check`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build` if generated content is current and the earlier gates pass.
- [ ] Confirm no new homepage code links Muraqqaʿa to `/foundations/muraqqa` or Subha to `/foundations/wird`.
- [ ] Confirm `/design` still type-checks with the preserved workshop modules.
- [ ] Start `pnpm dev` for the human visual-QA handoff.
- [ ] Ask the user to inspect `/` at mobile and desktop widths, light/dark mode, keyboard focus, and reduced motion; also check home↔docs transitions and `/design`.

## Deferred after skeleton acceptance

- Rewrite and rename the seven foundation notes.
- Replace provisional homepage summaries with reviewed content.
- Select or acquire final photographs.
- Design and implement the Hadra, Muraqqaʿa, and Ism set pieces individually.
- Remove unused old homepage modules.
- Reduce or remove `/design`.
- Revisit the broader Fumadocs shell design.
