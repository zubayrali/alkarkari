# Alkarkari knowledge-base roadmap

## Implemented foundation

- Guided **Start here** learning paths for newcomer, foundations, and deeper study
- Searchable official-channel media catalog with series and topic filters
- Editorial transcript states rather than presenting machine output as authoritative
- Visual AFFiNE-driven books library using the Geist Book interaction
- Native right-side table of contents with active scroll tracking and mobile popover
- Multilingual publishing, graph navigation, backlinks, glossary, testimony archive,
  canvases, citations, reader mode, and protected pages

## Editorial media model

The AFFiNE media review queue uses: `Content Type`, `YouTube ID`, `Source URL`,
`Series`, `Topics`, `Audience`, `Transcript Status`, `Review Status`, and `Rights`.
Seed pages are drafts with `Publish=false`, `Draft=true`, `Rights=Embed Only`.

Transcripts should follow this order:

1. Prefer official channel captions.
2. If unavailable, create a timestamp-preserving local ASR draft.
3. Keep generated summaries separate from verbatim transcript text.
4. Have an editor check names, Arabic terms, Qurʾān and hadith references.
5. Change `Transcript Status` to `Reviewed`, record reviewer/date, then publish.

Run `pnpm publisher:seed-media` through a temporary authoring bridge to reconcile
the official English starter catalog. It is idempotent by YouTube ID.

## Next large modules

1. **Practice center** — reviewed wird text, follow-along audio, invocations,
   adab, downloads, and audience controls for sensitive material.
2. **Silsila explorer** — chronological chain with linked biographies, places,
   primary sources, and graph connections.
3. **Editorial trust layer** — visible source, speaker, translator, transcript
   type, review status, reviewer, and correction link on every teaching.
4. **Series learning context** — previous/next lesson, completion state, and
   related terms/sources beside long-form pages.
5. **Translation parity dashboard** — missing/stale translations grouped by
   Translation Key and locale.

The official English channel is
[`Tariqa Karkariya – English`](https://www.youtube.com/channel/UCiJv5y0Ah6cEo0iEnGFFpfQ),
linked by the order's official English website. Other order sites informed the
feature prioritization, especially the Golden Sufi Center media library,
Shadhiliyya Sufi Communities practice/program catalog, Threshold Society media,
and the Naqshbandi linked lineage chain.
