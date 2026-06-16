# notes-index.json chunking (v2)

**State**: ready-for-agent

## What

`public/notes-index.json` is a single flat file containing all NoteRecords. For large vaults this can grow to hundreds of KB before gzip. Currently fetched lazily (only on first view switch), but repeated across all Base pages.

## Approach when needed

Chunk by top-level folder: emit `public/notes-index-dictionary.json`, `public/notes-index-books.json`, etc. Each Base fetches only the chunk(s) its filter touches. The `BasesInlineView` client component already knows which folders a filter targets (from the compiled bytecode metadata) — it would fetch only relevant chunks.

This requires no change to the NoteRecord schema or the VM — only the fetch URL and the chunk-assembly logic.

## Trigger

Implement when a vault produces a `notes-index.json` larger than ~200KB gzipped.
