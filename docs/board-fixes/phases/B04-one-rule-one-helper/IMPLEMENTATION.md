# B04 · One rule, one helper · implementation plan

Written before the build (2026-11-19). HEAD at start `85af0de0`; master merged first (`b45ab027`,
catalogue and plan files only, no board code). Decisions: accepted decision 18 (D-03 = A, B04-Q1 ignore
images in both, B04-Q2 three point-list forms, B04-Q3 every new report a warning).

## Reverification at HEAD

Every finding's code is as the SPEC describes (B03 changed `decodeEntities`, `descendantsOf`,
`splitFrontmatter` and the check's cycle block; line numbers drift by a few). Baseline on the real
catalogue (after the master merge): 15 epics, 70 features, 302 stories, 140 questions, 65 artifacts; `OK,
no errors`; check 1.9 to 2.5 s wall. 45 Markdown artifacts hold 602 headings, 15 of them with a record ID
in the text (the SPEC counted 14; the merge added one). No mermaid artifact. 3,384 source strings.

Baselines (scratchpad `b04/`): `check-before.txt`; `before.json` from `snapshot.mjs` (per-field
mentions of every record, every Markdown artifact's headings, points, line count and loose length,
mermaid ids, every source's resolution); `pre/`, an archive of the pre-B04 board for before-proofs.

## Technical choices

- **Code rule** (`shared/markdownCode.ts`, new): `fenceMask(lines)` (line-based: a fence opens with up
  to three spaces then three or more backticks or tildes, a backtick fence's info string holds no
  backtick; it closes on a line of the same character, at least as long, up to three spaces indent and
  nothing after; unclosed runs to the end) and `codeRanges(md)` (fenced blocks, then backtick spans
  with equal-length runs that never cross a blank line; a run with no partner is literal, and scanning
  goes on after it). `maskCode(md)` blanks those ranges. `links.ts mentions` and `remove.ts unlink` use
  `codeRanges`; `artifacts.ts` headings, points and line reader use `fenceMask`. One `LINK` pattern in
  links.ts, `(?<!!)\[...\](...)`: images are not links (Q1). Both files import it.
- **Per field:** `check.ts linksIn` and `artifactIndex.ts` call `mentions` per text and merge in order,
  first appearance wins (explicit before bare of the same record is kept within a field; across fields
  the first field's form wins, as a joined text would have given).
- **Heading text** (`artifacts.ts inlinePlain` rewritten, `markdownHeadings` passes the document's link
  definitions): code spans first (content kept as is); then backslash escapes held as literals,
  autolinks `<scheme:...>` and `<a@b>` kept as their text, HTML tags dropped, entities decoded, inline
  and reference links (`[t](u)`, `[t][ref]`, `[t][]`, `[t]` when defined) to their words, images to
  their alt, `~~x~~` to x, emphasis delimiter runs of `*` dropped, `_` runs dropped only at a word edge
  (an intraword `_` is literal, as CommonMark). ATX closing sequence removed only when preceded by a
  space or tab (or the whole content is `#`s). `slugify` unchanged.
- **Viewer slugs:** MarkdownReader sets `data-slug` from `markdownHeadings(text)` by source line
  (`data-ls` from `rehypeLines` equals `heading.line` for ATX and setext alike). `heading=` finds the
  source heading by `normText` equality, then the DOM heading on that line. No change to Prose,
  ArtifactViewer or the region-refresh effect keys (B10).
- **Quotes:** `artifacts.ts looseChars(s)`: one entry per kept character after NFC, each with the
  source offsets it came from (a base character and its combining marks are normalised together).
  `looseText` is their join. `regionsDom.quoteRange` builds through `looseChars` per text node; a bare
  record-ID link (Prose's `data-bare` link) contributes its source ID instead of its title, via a
  `data-id-text` attribute added to the bare link in Prose (touch rights; nothing visible changes).
- **Mermaid:** statements split on `;` and new lines; directives, `style`, `classDef`, `class`,
  `click`, `linkStyle`, comments skipped; `subgraph id[...]` adds id; quoted strings, `@{...}`, `:::x`
  and both edge-label forms removed; the remainder split on link operators (any of `<`, `o`, `x` heads
  on `--`, `==`, `-.`, `~~~` runs); each piece split on `&`; a node is the leading ID before any shape
  opener.
- **Selectors:** `matchSimpleSelector` returns `'invalid'` for an empty selector or an empty comma part;
  the check warns.
- **Spots:** `sources.ts spotExists(a, spot, facts)`; `check.ts regionExists` calls it with its facts
  mapped to `SpotFacts` (pages from the PDF facts, headings and lines from Markdown, `canvas` from the
  format). `spotProblem` gives the warning text for page, line and point spots, used by `spotsFor`.
  `latest()` now runs first and spots are worked out on the final artifact.
- **Grammar:** question head `^OQ-\d{2,}` plus a word boundary; `parseRest` reads a points run
  `#n` separated by spaces, nothing, or `, ` (Q2); `noteSplit(tail)` is the one words/spot split.
  `buildSourceIndex` de-duplicates an artifact's own prefixes and lists `noteClashes` and `fileClashes`;
  the check warns for each.
- **Lint:** `lintFrontmatter` walks lines tracking block scalars (`key: |`, `|-`, `>`, `>-`, with
  indentation indicators, also after `- key:`), strips a list-item key before the quote test, and keeps a
  `#` warning only when the parsed frontmatter's strings lack the text after the `#`. `lintArtifact`
  lints `cited_as` (not a list, entry neither string nor mapping, unknown keys with a did-you-mean).
- **D-03 resolver:** `sources.ts resolveNoteCite(cite, notes)` returns the note's file (or `null`):
  `notes` is the list of note-file paths relative to the catalogue. `resolveSource` uses it for the
  note half. The agent proof imports shared by file URL from the catalogue path and runs with plain
  `node`.

## Bites and checks

1. Code rule, per-field, unlink and withoutFences (R-60, R-61, R-62). 2. Heading text and viewer
   slugs (R-28, R-83 heading part). 3. Quotes (R-101, R-83 quote part). 4. Mermaid (R-27).
   5. Selector (R-84). 6. Spots and hand-on (R-75, R-76, R-77, R-79). 7. Grammar and clashes (R-78,
   R-80, R-81, R-82). 8. Lint (R-38, R-85). 9. Note-cite resolver, agent proof, Node 22.18 run.
   10. Docs, version 1.16.0, CHANGELOG.

After each bite: `npx vitest run` on the touched tests, `tsc -b`, `node scripts/check.ts`. After all:
`npm run verify:board`, fixture e2e on 5182 (`sources`, `artifacts`, `item-delete`, `item-links` and a
new `b04-rules.spec.ts`), the real-catalogue artifacts spec on a free port, `snapshot.mjs` after vs
before (every difference explained), `check` output diff, timing.

Proof fails first: the new tests are copied into `pre/` (the pre-B04 board) and run there; they must
fail, and pass on the fixed board.

Existing tests changed because they encode a fixed defect: `tests/remove.test.ts` (image link left
alone now matches `mentions`, which also ignores it), any mermaid expectation in
`tests/artifacts.test.ts` that encodes a lost or invented ID.

## Recovery

Each bite is one rule and can be reverted alone. No catalogue data changes. A new error on the real
catalogue, or a referenced slug that changes, stops the build until the user has seen it.

## Handoff

PROGRESS entry: dispositions; the resolver's contract for B13; facts for B05 (`cited_as` lint
wording), B06 (`check.ts` shape), B10 (MarkdownReader slug and `heading=` by source line; `quoteRange`
reads `data-source-text`); touch-rights edits; Doc facts.

## As built (changes from the plan above)

- The attribute is `data-source-text` (not `data-id-text`), set on a wrapper span by
  `recordLinkComponents` in Prose; `regionsDom.ts` exports its name as `SOURCE_TEXT_ATTR`.
- `codeRanges` tags each range `fence` or `span`; `maskCode` keeps the text's length (code turned to
  spaces), and `unlink` finds links in the masked text and splices from the original, so a link whose
  own words hold code is one link for both `mentions` and `unlink` (review finding).
- Images contribute no text anywhere (heading text and quote text alike), as the page draws them.
- `normText` normalises to NFC, so `text=` and `heading=` compare one form on both sides, and heading
  slugs come from NFC text (review finding, B04-REQ-03.4).
- `looseText` and `looseChars` share one rule, with a fast path for text already in NFC (found by the
  timing check: the per-character path made Markdown facts ten times slower).
- An agent builds the source index with the new `server/sourceIndex.ts` (`loadSourceIndex(req)`), and
  `resolveNoteCite` answers for notes only (review findings); the agent proof uses both.
- A malformed `OQ-` source (`OQ-01.5`) still names a question, so it still warns (review finding).
- `spotName` (`src/artifactIndex.ts`) decides existence through `spotExists`.
- `BOARD_E2E_REAL_PORT` lets the real-catalogue e2e run off 5181 (needed for the R-28 real proof).
- Left as they are, recorded for later: `shared/proseDiff.ts` keeps its own fence and backtick
  heuristics (the Diff review's display splitter, B09); `files.ts mermaidOf` finds the diagram's own
  fenced block (not a "what is code" rule); `scripts/linkProposals.ts` has a copy (B13 adopts).
