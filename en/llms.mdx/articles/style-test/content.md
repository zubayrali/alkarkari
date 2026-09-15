# Style Test (/articles/style-test)



This page exercises the reading affordances. Delete it when everything checks out.

## Sidenotes & marginalia [#sidenotes--marginalia]

The simplest form is a bare note in double braces.[^_sn_2] The text flows on as if nothing happened.

Notes support inline markdown: emphasis, links, code.[^_sn_3] They can be as short[^_sn_4] or as long as a small paragraph.[^_sn_5]

The labeled form keeps a phrase in the prose and hangs the note off it. The doctrine of spiritual poverty faqr[^_sn_1] is central to the path.

Classic GFM footnotes render exactly the same way, so all three syntaxes coexist in one note.

###### Sources [#sources]

This one was written as a standard `[^classic]` footnote — same rendering, no bottom footnote section.

Double braces inside code are left alone:

```txt
Handlebars templates use {{variables}} — this is not a sidenote.
```

And neither is inline code like `{{date}}`.

A final paragraph with one more note to test stacking near the end of the article.[^_sn_6] That's the whole tour.

## Inline annotations [#inline-annotations]

Here is a <span className="rough-ann" data-ann-type="highlight">highlighted phrase</span> inside a sentence. This one is <span className="rough-ann" data-ann-type="underline">underlined by hand</span>, and this is <span className="rough-ann" data-ann-type="box">boxed in orange</span>. The engine can also draw a <span className="rough-ann" data-ann-type="circle">circle</span> around words, or put <span className="rough-ann" data-ann-type="bracket">brackets around a phrase</span> like an editor's note.

Two in one line: <span className="rough-ann" data-ann-type="highlight">first mark</span> and then <span className="rough-ann" data-ann-type="circle">second mark</span> right after.

An unclosed ==delimiter should render as plain text without breaking anything.

## Annotations in headings are ==ignored== [#annotations-in-headings-are-ignored]

The heading above must render its `==` literally — annotations are skipped inside headings.

## Block annotation [#block-annotation]

<p className="rough-ann" data-ann-type="highlight">
  This entire sentence gets one continuous multiline highlight drawn over it.
</p>

## Sidenotes [#sidenotes]

Standard footnotes become margin sidenotes on wide screens, and collapse to click-to-expand inline notes on narrow ones. A second reference tests multi-paragraph footnote content, and the same note can even be referenced twice.

The [Wird](/dictionary/wird) is recited daily.

A short sidenote. It should appear in the margin next to its reference number.

A longer footnote with two paragraphs.

The second paragraph should render as a separate block inside the sidenote, not break the page layout.

Sidenotes can contain *formatting* and `code` too.

## Callouts [#callouts]

> \[!note] Note
> In the vault this is authored as `> [!note]`. The title is a small ledger label; the thread bar and hairline carry the type colour — gold for notes and quotes.

> \[!question] Question
> Questions, help, and FAQ callouts take the violet patch from the muraqqaʿa spectrum.

> \[!warning] Warning
> Warnings keep the Fumadocs warning token so they read consistently with the rest of the UI.

> \[!danger] Danger
> Danger, bug, and failure callouts take the crimson patch. In dark mode every patch swaps to its luminous ray variant.

[^_sn_1]: From the Arabic root ف-ق-ر — the recognition that one possesses nothing before God.

[^_sn_2]: This is a bare marginal note — unlabeled, auto-numbered, sitting in the margin when there's room.

[^_sn_3]: A note with **bold**, *italics*, and a [link to the Tariqa](https://en.wikipedia.org/wiki/Tariqa) — even `inline code` works.

[^_sn_4]: like this

[^_sn_5]: A longer note: the margin engine stacks notes vertically and lets them drift downward a little to avoid collisions. When both margins are free, consecutive notes alternate between the right and left side of the article.

[^_sn_6]: The engine adds bottom padding when a margin note extends past the article, so the prev/next footer never overlaps it.
