# Phase B04: One rule, one helper

**Status:** COMPLETE (2026-11-19; see PROGRESS.md)

**Requirements:** R-27, R-28, R-38, R-60, R-61, R-62, R-75, R-76, R-77, R-78, R-79, R-80, R-81,
R-82, R-83, R-84, R-85, R-101 (18 findings, each under "#### R-nn" in
[FINDINGS.md](../../FINDINGS.md)); systemic issue 4 ("The same rule is coded twice and the copies
disagree") in the same file. Owned deferred decision: **D-03** ([PLAN.md](../../PLAN.md) Deferred
decisions; [PROGRESS.md](../../PROGRESS.md) register).

**Owns:**
- One shared implementation, used by every consumer, for each of these text rules: code masking
  (what counts as code in a Markdown body), heading text and heading slugs taken from the source,
  quote text and Unicode normalisation on both sides of an anchor comparison, mermaid flowchart node
  IDs, simple CSS selector matching, source-string parsing, spot existence, and frontmatter lint
  (including `cited_as`).
- Their homes in `requirements-board/shared/`: `links.ts`, `remove.ts` (`unlink`, and the code rule it
  shares with `mentions`), `sources.ts`, `artifacts.ts`, `check.ts`, and the lint in `files.ts`.
- The client consumers that must use them: `src/artifactIndex.ts` (mention extraction),
  `src/artifacts/MarkdownReader.tsx` (heading slugs and the `heading=` match only) and
  `src/artifacts/regionsDom.ts` (`quoteRange` normalisation).
- Resolving D-03 and making the note-cite resolution rule (note slug, longest-prefix match and the
  words/spot split) usable by agent `.mjs` tools in the chosen way, so B13 can fix R-141 against it
  without re-implementing resolution.
- A disposition and proof for every owned finding.

**Excludes:**
- R-141, the consistency review's `ref-kit.mjs` / `build-packs.mjs` note-cite mismatch and its skill
  text: **B13** (B13-REQ-07b), which consumes B04's note-cite resolver in the way D-03 settles.
  `scripts/link-index.ts` and `scripts/linkProposals.ts` are B13's; B13 adopts B04's helpers there.
- Naming parent cycles in the check (`shared/check.ts`): **B03** (accepted decision 10, B03-Q6).
  B04 accepts B03's cycle rule and its wording as its starting shape and does not change it.
- R-66, a UTF-8 BOM in a record (`shared/files.ts:28-29`): **B03**.
- R-48, `decodeEntities` RangeError (`shared/artifacts.ts:45-53`): **B03**.
- R-100, MarkdownReader and PdfReader region refresh (effect keys, `MarkdownReader.tsx:87, :133`):
  **B10**. B04 touches MarkdownReader only for slugs (lines 76-85) and the `heading=` match (line 108).
- R-37, the artifact-details PUT that drops `cited_as` keys on save, and in-place YAML writes in
  `files.ts`: **B05**.
- How Prose renders bare record IDs as titles (`src/components/Prose.tsx`): unchanged; Prose
  changes belong to B06 (R-108) and B07 (R-159).
- The whole-file docs pass and the SCHEMA status sections: **B14**. B04 updates the doc lines that
  describe rules it changes (convention 12).
- The server's delete guard in `server/catalogueApi.ts` (B01, B02, B05 territory): B04 changes the
  shared rules it calls, not the route.

**Depends on:** B03 (`shared/artifacts.ts` entities), per PLAN. Serial order: B01, B02, B03, **B04**,
B08, B05, B07, B06, B09, B10, B11, B14, B15. B03's edits to `shared/artifacts.ts` (`decodeEntities`,
R-48), `shared/files.ts` (BOM), `shared/remove.ts` (`descendantsOf`) and `shared/check.ts` (parent
cycles) are B04's starting shape. Decision gate: **D-03** resolved and recorded in PROGRESS.md before
B04 builds; it is also a planning-only gate, settled in a B04 planning conversation before B12 builds
if B12 needs shared code (accepted decision 8) and before B13-REQ-07b.

**Unblocks:**
- **B13** (B13-REQ-07b, R-141): the note-cite resolver agent tools can use, in the D-03 shape, with
  its parity proof.
- **B12**: the D-03 mechanism, only if B12 needs shared code (not needed if D-02 picks the no-overlap
  status rule; accepted decision 8).
- **B05** (PLAN: depends on B04): `files.ts` lint and `check.ts` rules in their B04 shape before
  in-place YAML writes and the lane-list rule; B05 keeps the `cited_as` lint wording true.
- **B10** (PLAN: depends on B04): viewers built on the corrected shared rules; MarkdownReader handed
  over with source slugs.
- **B06**: `check.ts` in its B04 shape before B06's component-vocabulary change (R-123).

**Binding constraints** (PLAN.md "Binding constraints", PROGRESS.md conventions 1 to 14, notably 11
touch rights, 12 doc lines, 13 proof fails first):
- Existing stack: Vite, React 18, zustand, @xyflow/react, TypeScript, Node >= 22.18 running `.ts`
  directly, Vitest, Playwright. A new direct dependency (for example a Markdown parser package used by
  `shared/`) needs a recorded reason, even if it is already a transitive dependency.
- Board code stays project-generic; visual changes follow `requirements-board/DESIGN.md`; the About
  page stays in step with the skills.
- Fixes do not change requirement content. The real catalogue must stay check-green.
- Agent-tool changes stay backward compatible with the live catch-up plan and its lanes.
- `npm run verify:board` green at the end; board version bump and `CHANGELOG.md` entry. Every
  regression proof fails on the code before the fix and passes after it (convention 13).
- Touch rights (convention 11): B04 may make minimal edits in another phase's file where a B04 fix
  needs it, naming them in its PROGRESS entry.
- Git: commit and merge, never push; stage by path at commit time only; never stage mid-phase.

## Objective and outcomes

PLAN outcome 4: **each catalogue rule has one implementation, used by the checker, the server and
the viewer.** Today the same rule is coded two or three times and the copies disagree, so the check
accepts what the board cannot show, refuses what the board shows correctly, or a delete is refused
after its dialog has promised to tidy the links.

When B04 is delivered:

1. What counts as code in a Markdown body is decided in one place, follows CommonMark for the cases
   the catalogue uses, and gives the same answer to the check, backlinks, the artifact index, delete
   planning and the linking scripts. A delete the dialog allows is never refused for a link the
   dialog said it would unlink.
2. A Markdown heading has one text and one slug, taken from the source, used by the server, the check,
   the Sections list and the viewer. Every slug and `heading=` anchor the check accepts is found by the
   viewer, and the reverse.
3. A `quote=` anchor matches on the same normalised text in the check and in both document viewers.
4. The check reads mermaid node IDs and simple selectors the way the board resolves them.
5. A source string or `cited_as` spot is parsed and validated by one rule: what the check accepts, the
   board can open; what the check flags names the right artifact, file and reason.
6. Frontmatter lint warns about real data loss (including mistyped or misshaped `cited_as`) and stops
   warning about values the board itself writes correctly.
7. Agent tools have a decided, proven way to use the same rules (D-03), including the whole note-cite
   resolution rule, so B13 resolves note cites exactly as the board does.

## Sources and current-state evidence

All findings were re-checked at HEAD `d4341735` (board 1.12.3), which is the review commit, so line
numbers in FINDINGS.md still hold. Experiments ran the real shared functions under Node from a
scratch folder. **Every owned finding reproduces at HEAD; none is "Not reproducible".**

| Finding | Location at HEAD | Reproduced at HEAD |
|---|---|---|
| R-27 | `shared/artifacts.ts:156-173` (shape loop :168, arrow strip :169) | `flowchart LR; A --> B[Label]; C[x] --> D[y]; E --o F; G@{ shape: rect }` gives `{A, C, E, o, F}`: B, D, G lost, `o` invented |
| R-28 | `src/artifacts/MarkdownReader.tsx:76-85` (slugs), :108 (`heading=`); IDs swapped to titles by `remarkRecordIds` in `src/components/Prose.tsx` | AR-58 line 947 `### 9.1 Catalogue, EP-04 Contracts`: server slug `91-catalogue-ep-04-contracts`, DOM slug `91-catalogue-contracts-contracts` (EP-04's title is "Contracts"). 14 headings in the catalogue's Markdown artifacts and notes hold a record ID outside code and are affected |
| R-38 | `shared/files.ts:348` (`CITATION_KEYS`, unused), :409-414 (`toCitation`), :436, `lintArtifact` :539-587 | `cited_as:` as a mapping gives `citedAs: []` and no lint; an entry with `pageOffset: 1` keeps `pageOffset: null` and no lint |
| R-60 | `shared/remove.ts:37-52` (`LINK`, `CODE`, `unlink`); `shared/links.ts:27-32` | "Press the \` key, then see [the other story](US-01.1.2)." plus a fenced block: `mentions` finds the link, `unlink` leaves it. `![x](US-01.1.2)`: `mentions` counts it, `unlink` leaves it |
| R-61 | `shared/links.ts:31`; `shared/remove.ts:38`; `shared/check.ts:337-339` joins fields | "A stray \` here.\n\nSee [the rule](US-01.1.1).\n\nAnd \` later." gives no mentions |
| R-62 | `src/artifactIndex.ts:48` (items), :52 (questions, same join) | a backtick in one field and one in the next hide `AR-03#step-2`; per field it is found. `check.ts:339` has the same join |
| R-75 | `shared/sources.ts:230`; contrast `shared/check.ts:168-176` | `spot: p27` and `spot: L1-10` both give "is not a region of AR-08" |
| R-76 | `shared/sources.ts:131, :137, :145-148, :159-168` | "Transcript A p.3" (Markdown), "Diagram X p.2" (SVG), "L33-27" and "L0" all resolve with no problem |
| R-77 | `shared/check.ts:321`; `shared/links.ts:79` (`pastedTarget`) | shape regex `[A-Za-z0-9-]+` is narrower than `slugify` (`\p{L}\p{N}_-`); latent, no such entry in the catalogue |
| R-78 | `shared/sources.ts:190`; `shared/links.ts:21` | "OQ-01 · answered by Sam" resolves as question ID "OQ-01 · answered by Sam" |
| R-79 | `shared/sources.ts:171-182, :214` | "Old spec p.40" opens AR-02 but warns "AR-01 has no page 40" |
| R-80 | `shared/sources.ts:102-112` | `#2#3` gives "Point NaN"; `#2, #9` checks only #2 |
| R-81 | `shared/sources.ts:195-212` | existing note, malformed tail: "no note notes/2026-10-09-gone-meeting-p3x.md" |
| R-82 | `shared/sources.ts:83`; `shared/check.ts:241-248, :392` | two sidecars on one note file: silent; one artifact listing a prefix twice: clash `ids: [AR-09, AR-09]` |
| R-83 | `shared/artifacts.ts:217-224` (`inlinePlain`), :264 (ATX), :314-329 (`markdownReadable`); `shared/check.ts:216-220` | `# fee_schedule rules` gives text "feeschedule rules"; `# Q&amp;A` gives slug `qampa`; `# C#` gives "C"; `~~old~~ new` keeps `~~`; `[text][ref]` kept; `<https://x.y>` deleted |
| R-84 | `shared/artifacts.ts:112-123, :130-145` | `rect.panel,` matches all 3 elements |
| R-85 | `shared/files.ts:193-215` | a `\|-` caption line "Pays invoice #3 in full" warns; `- as: "Board pack #2"` warns (the list-item key is not stripped) |
| R-101 | `src/artifacts/regionsDom.ts:87-115`; `shared/artifacts.ts:42`; `server/artifactFiles.ts:135` | `looseText` normalises to NFC; `quoteRange` normalises the quote but not the DOM text, so NFD text never matches. Latent: every catalogue `.md`/`.svg`/`.mmd` file (681) is NFC today |

Other verified facts:

- **Catalogue baseline.** `node scripts/check.ts` at HEAD: 15 epics, 70 features, 302 stories, 140
  questions, 65 artifacts, **no errors and no warnings**. Of 2,859 source strings that resolve to an
  artifact, none cites a page on a non-PDF, lines on a non-Markdown file, a reversed or zero line
  range, or points on a file without points; no `sources:` entry uses `#n#m`, `#n, #m` or
  `OQ-nn <words>`; no two sidecars share a `file`; no `node=` anchor exists; no catalogue heading uses
  `_`, an entity, `~~`, a reference link, an autolink, a backslash or a closing `#` run. So the
  findings above are latent in the real catalogue except R-28 (14 affected headings).
- **The check guards writes.** The dev server runs the check before every write and refuses a write
  that leaves errors, so a new error rule that the catalogue trips would block every save.
- **Shared rules already run under Node type stripping.** `scripts/check.ts` imports
  `server/catalogueFs.ts`, which imports `shared/*.ts`; an `.mjs` importing `shared/artifacts.ts` and
  `shared/sources.ts` by path ran cleanly on Node 24 (not tried on the minimum engine, 22.18).
- **Agent copies today.** `agent/skills/consistency-review/scripts/ref-kit.mjs` and `build-packs.mjs`
  each define their own `slug` (differing from `shared/artifacts.ts slugify`); update-build-plan's
  `scope.mjs` mirrors status normalisation. No agent tool imports `shared/` today. Skills run from
  `requirements-board/agent/...` in this repo (linked into `.claude/skills/`), but `install-skills`
  copies them into `.claude/skills/` in a shared kit, and workflows in `agent/workflows/*.js` run in
  the workflow runtime.
- **A third code rule.** `shared/artifacts.ts:245-256` (`withoutFences`, used for headings, points and
  line counts) recognises fences differently again (any indent, closing fence by character only).
- **Tests that encode current behaviour.** `tests/remove.test.ts:9` asserts an image link to a deleted
  item is left alone; `tests/artifacts.test.ts:229-233` covers mermaid without the failing forms;
  `tests/links.test.ts`, `tests/sources.test.ts` cover the other rules.
- **SCHEMA text.** `requirements/SCHEMA.md` describes `cited_as` `spot` as "the region a source with
  no spot of its own opens", spots as regions, steps, pages `p27`, heading slugs and `L27-33`, and
  promises a warning for "a point, page or line the file lacks".

Assumption (flagged): a heading's slug stays GitHub's rule as `slugify` implements it today; B04
changes the text it is given, not the slug rule itself.

## Detailed requirements

Each requirement states the behaviour after the fix. "Corpus" means a stated set of inputs the proof
runs both sides of the rule over; it is a proof device, not a test-file prescription.

### B04-REQ-01 One code rule for links (R-60, R-61, R-62)

1. One exported rule decides which parts of a Markdown text are code. `mentions`, `unlink`, the
   check's link rules, the artifact index and every other caller of `mentions` (link index and link
   proposal scripts) use it; no private copy of the rule remains in `remove.ts` or elsewhere in
   `shared/` and `src/`.
2. The rule follows CommonMark for at least: fenced blocks of backticks or tildes, opened with up to
   three spaces of indent and closed only by a fence of the same character and at least the same
   length (an unclosed fence runs to the end of that text); backtick code spans whose opening and
   closing runs have the same length; and a code span never crossing a blank line. A lone or unpaired
   backtick is literal text and never hides a link.
3. `unlink` and `mentions` agree on what an explicit link is. Whatever B04-Q1 decides about an image
   whose target is a record ID, both functions treat it the same way.
4. Links are extracted per field: an item's description, acceptance, technical and notes, a question's
   question and answer, and an artifact's description and each step caption are read separately, so
   code marks in one field never pair with marks in another. This holds in the check
   (`check.ts linksIn`) and in the artifact index (items and questions).
5. After `planDelete` for any item, no rewritten record holds an explicit link into the deleted set
   (outside code), so the server's delete guard never refuses a delete for a link the plan should have
   unlinked. The delete dialog's promise ("links become plain text") is true.
6. The heading, point and line-count reader in `artifacts.ts` uses the same fence rule (one fence rule
   for the board), or the implementation plan records why it must differ and proves the real
   catalogue's headings, points and line counts are unchanged.

Preserved: a bare ID in running text stays on delete and is a warning; `related`/`affects` entries
naming a deleted item are dropped; links inside real code are never counted and never rewritten; a
link's own words never add a bare mention; mention order and de-duplication are unchanged.

### B04-REQ-02 Heading text and slugs from the source, one derivation (R-28, R-83)

1. A Markdown heading's text and slug are derived once, from the source, by one shared helper. The
   server's `meta.headings`, the Sections list, the check (`within`, `spot`, `AR-nn#slug`, `heading=`
   anchors, region-id collisions) and the viewer's `data-slug` all use that derivation.
2. The viewer gives each rendered heading the slug of the source heading it came from, whatever the
   rendered text shows (a bare record ID rendered as its title, a link rendered as its words). Clicking
   a section in the panel, or following any `AR-nn#slug` link the check accepts, finds the heading.
3. `heading=` anchors are matched on the same source-derived heading text in the check and in the
   viewer, so an anchor naming a heading that contains a record ID, emphasis or a link is accepted by
   the check exactly when the viewer draws it.
4. Heading text follows how the board renders the heading's words, for at least this corpus: an
   underscore or asterisk inside a word is kept (`fee_schedule`), emphasis marks are dropped, a
   character entity is decoded (`Q&amp;A` reads "Q&A", slug `qa`), a closing `#` run is removed only
   when CommonMark removes it (`# C#` keeps "C#"), GFM strikethrough marks are dropped, a reference
   link reads as its words when defined and as written when not, an autolink keeps its URL text, a
   backslash escape yields the escaped character, inline code keeps its content, and a record ID keeps
   its ID text (so the 14 existing headings keep today's server slugs).
5. Duplicate headings still gain `-1`, `-2` in document order; an empty slug still falls back to
   `section`.

Preserved: every slug the server produces for the real catalogue today is unchanged (proof below);
Prose still renders bare IDs as their titles; `slugify` itself is unchanged (assumption above).

### B04-REQ-03 Quote text and normalisation on both sides (R-101, R-83 quote part)

1. A `quote=` anchor is compared on one normalised form on both sides: the check (Markdown and PDF
   page text) and the viewer's `quoteRange` (Markdown sheet and PDF text layer) apply the same
   Unicode normalisation and the same skipped characters to the anchor and to the document text.
2. The viewer's box covers exactly the matched characters of the rendered text, even where
   normalisation changes the length of the text (a decomposed letter composing to one character).
3. Where the rendered text differs from the source in ways the check reads (a bare record ID shown as
   its title, an entity, a link's words), a quote is accepted by the check exactly when the viewer
   draws it, for a corpus that includes an NFD passage ("Māori health" in NFD), a passage spanning a
   bare record ID, and a passage spanning an entity and emphasis.
4. Every other anchor or slug comparison the check and viewer share (`heading=`, `text=`, slug lookup)
   uses the same normalisation on both sides, or the implementation plan records why one does not need
   it.

Preserved: whitespace, emphasis marks, table pipes and escapes are still ignored in quote matching; a
quote broken across lines or PDF line wraps still matches.

### B04-REQ-04 Mermaid node IDs as the board resolves them (R-27)

1. For a flowchart, the check's node IDs are exactly the nodes the diagram declares, for a corpus that
   includes `A --> B[Label]`, every shape form (`[ ]`, `( )`, `{ }`, `>flag]`, `(( ))`, `[[ ]]`,
   `[( )]`, `{{ }}`), the Mermaid 11 `id@{ ... }` shape syntax, edge heads and tails `--o`, `--x`,
   `o--o`, `x--x`, `<-->`, long arrows, dotted and thick links, edge labels in both forms, `&` chains,
   `:::class` suffixes, comments, `style`/`classDef`/`click` lines and subgraphs. **Addition beyond
   R-27:** R-27 itself covers `A --> B[Label]`, the flag shape, `--o`/`--x` and `@{}`; the wider corpus
   (other shapes, long, dotted and thick links, subgraphs, `classDef`/`click` lines) is the same defect
   class, added as hardening. A gap in the extension does not mean R-27 is unfixed.
2. No ID is invented from an edge head (`o`, `x`) or a label word, and no declared target is lost.
3. A `node=` anchor the board highlights passes the check; one naming no node errors as now.

Preserved: a non-flowchart diagram still returns "not read" (the check warns, does not error).

### B04-REQ-05 Selector matching never counts what the browser rejects (R-84)

1. A selector the browser would reject (an empty comma part, a trailing or leading comma, an empty
   selector) is never reported as matching elements. The check reports it as invalid or as matching
   nothing (severity per B04-Q3), never as a box spanning every element.
2. Simple selectors keep their current counts; selectors beyond the matcher (combinators,
   pseudo-classes) still return "not checked here".

### B04-REQ-06 One spot-existence rule (R-75, R-76, R-77, R-79)

1. One shared rule answers "does spot S exist on artifact A, given what is known of its file", and the
   check's `regionExists`, the source resolver's spot problems, the supersede hand-on and
   `citationProblems` all use it.
2. The rule: named regions and steps exist on any artifact; a drawing (SVG, mermaid, raster) has no
   other spots; a page `pN` exists only on a PDF, for 1 <= N <= page count; a line spot exists only on
   a Markdown document, with 1 <= from <= to <= line count (`L0`, `L33-27` never exist); a heading slug
   exists only on a Markdown document that has it; points exist only on a document whose points are
   read, and only if that point number is there (within the `within` section when given). When the
   file's facts are unknown (the browser without facts), a spot is taken to exist, as now.
3. A `cited_as` `spot` may be any spot the rule accepts (region, step, page, line range or heading),
   matching SCHEMA's list of spots for `artifacts:` and the add-artifact skill.
4. A source naming a page, lines or points on a file without that dimension, or a reversed or zero
   line range, is a warning naming the artifact and the spot, as SCHEMA promises. Sources never raise
   errors.
5. A retired artifact with a replacement hands on first; spots, labels and problems are then worked
   out against the final artifact. A spot the replacement lacks still falls back to the whole
   replacement, as now.
6. An item's `artifacts:` entry, and a pasted `AR-nn#spot` (`pastedTarget`), accept any spot the slug
   rule can produce (underscores, non-ASCII letters and digits); whether it exists is decided by the
   spot rule, not by the entry's shape. A malformed entry (no `AR-nn`, whitespace) still errors.

### B04-REQ-07 One source-string grammar (R-78, R-80, R-81, R-82)

1. A source that starts with a question ID followed by words resolves to that question ID alone
   (`OQ-01 · answered by Sam` is OQ-01); a question ID with nothing after it resolves as now.
2. A points list is parsed completely or not at all: each point number written is either checked or
   the source is flagged; no point becomes `NaN` and no point after the first is silently skipped. The
   accepted forms (`#2 #3`, and `#2#3` and `#2, #3` per B04-Q2) are stated in SCHEMA.
3. The unresolved-note warning names the file the words actually slug to, using the same split of
   words and spot as resolution (so `p.3` is never slugged into the name), and says which failed: no
   such note, or the note exists but the text after its words is not a spot or reader words.
4. Two sidecars registering the same note file, or any two artifacts sharing one `file`, are reported
   naming both artifacts (severity per B04-Q3). An artifact listing the same prefix twice is not a
   clash with itself (it is ignored or reported as a duplicate on that artifact, not as "also claimed
   by" itself).

Preserved: the longest prefix wins; notes resolve by file-name slug with no entry; `within` scopes
points; `page_offset` and printed-page labels; the self-citation rule; a string whose first word is no
citation head stays plain; unresolved sources are warnings.

### B04-REQ-08 Frontmatter lint that tells the truth (R-38, R-85)

1. `cited_as` is linted: a value that is not a list, an entry that is neither a string nor a mapping,
   and unknown keys each give a warning; a known misspelling names the right key ("`pageOffset`: did
   you mean `page_offset`?"); the warning says the value is ignored, and says it is dropped on the next
   board save for as long as that is true (see Dependencies, B05).
2. The unquoted-`#` lint does not warn on lines inside YAML block scalars (`|`, `|-`, `>`, `>-` and
   their indented continuation lines), nor on a quoted value after a list-item key (`- as: "Board pack
   #2"`). Its advice never suggests a change that would corrupt the value.
3. It still warns on a real unquoted ` #` that YAML takes as a comment, including after a list-item key
   (`- as: Board pack #2`), and the number and boolean coercion warnings are unchanged.
4. A lint warning is confirmed against the parsed value where that is the reliable test (candidate in
   FINDINGS), so a warning means data was actually lost or altered.

### B04-REQ-09 Shared rules for agent tools (D-03)

1. D-03 is resolved with the user in B04's implementation planning and recorded in PROGRESS.md before
   B04 builds.
2. Whatever the answer, the **note-cite resolution rule** is available to agent `.mjs` tools in the
   chosen way: given a cite string and the catalogue's note files and sidecars, it returns the note the
   board's source resolver returns (or "unresolved"), using the same note slug, the same longest-prefix
   match over `cited_as` prefixes and notes, and the same split of words from the spot and reader words
   (as B04-REQ-07.3 leaves it), together with the heading slug rule. B13 calls it and does not
   re-implement any part of resolution. A cite with no points that matches no note's words is
   unresolved, never "the first note of that date".
3. Parity proof: over every note file and every `Notes <date> · <words> ...` source string in the real
   catalogue, plus the R-141 cases (apostrophes, "AA's", a cite without points), the agent-side
   resolver and the board's `resolveSource` give the same note (or both unresolved), run the way agent
   tools run. The proof fails before B04's change (no agent-side resolver exists) and passes after.
4. The chosen way works where the tools run today (from `requirements-board/agent/...`, and for the
   linked and copied install modes), on the minimum Node engine (22.18), and in a kit export; or the
   decision records which of these it does not support and B13/B14 accept that.
5. B04 does not itself change `ref-kit.mjs`, `build-packs.mjs` or any workflow (B13), nor plan tools
   (B12).

### B04-REQ-10 Catalogue stays green, and the change is visible (all)

1. `npm run check` on the real catalogue stays at no errors after B04. Its full output before and after
   B04 is compared; every difference (new warning, removed warning, changed message) is listed in the
   phase's PROGRESS entry with a reason. Any new warning on the real catalogue is a true positive shown
   to the user; fixes never edit requirement content to silence one.
2. No rule change adds an error that would block board saves on the real catalogue.
3. The set of heading slugs for every Markdown artifact and note in the catalogue is identical before
   and after B04, or each changed slug is listed and shown to be referenced nowhere (`within`, `spot`,
   `artifacts:`, text links, `heading=` anchors).
4. Wherever B04 changes a rule a user or agent reads about (source grammar, `cited_as` spot, new check
   messages), B04 updates the SCHEMA, add-artifact skill and About lines that state it, in the same
   phase, and lists them under "Doc facts" in its PROGRESS entry (convention 12).

## Dependencies and handoffs

**Inputs consumed**
- B03's shape of `shared/files.ts` (BOM stripped at read), `shared/remove.ts` (`descendantsOf` cycle
  guard), `shared/artifacts.ts` (`decodeEntities` safe on out-of-range entities) and `shared/check.ts`
  (B03's parent-cycle naming, accepted as is). B04 builds on them and must not reintroduce those
  defects.
- D-03 decision (B04 owns it).

**Outputs owned**
- The shared helpers listed under Owns, each with one home and every listed consumer using it.
- The D-03 decision and the note-cite resolver agent tools can use, with its parity proof.
- MarkdownReader with source-derived slugs and `heading=` matching, handed to B10 for R-100.

**Behavioural interface expectations**
- B13 (B13-REQ-07b, R-141) resolves note cites by calling B04's note-cite resolver in the D-03 way;
  B04 names the function and its inputs and outputs in its PROGRESS entry and guarantees it gives the
  same note as the board's `resolveSource`.
- B05 keeps the `cited_as` lint message true: if B05 stops dropping `cited_as` keys on save (R-37),
  B05 updates that wording.
- B10 inherits MarkdownReader; if B04's slug assignment needs data the viewer does not have today
  (for example source heading facts passed from `ArtifactViewer.tsx`, which is B10's file), B04 either
  stays within MarkdownReader (it already has the source text) or agrees the call-site change with
  B10's territory and records it.

**Shared files** (resolved: PLAN's shared-files table now orders them; touch rights per convention
11): `shared/artifacts.ts` (B03, B04), `shared/files.ts` (B03, B04, B05), `shared/check.ts` (B03, B04,
B05, B06), `shared/remove.ts` (B03, B04), `src/artifactIndex.ts` (B04 text joins, B10 filter prefs),
`src/artifacts/MarkdownReader.tsx` (B04 slugs, B10 region refresh). `shared/types.ts`
(`linesOfRegionId`) and `src/components/Prose.tsx` are not expected to need B04 edits; any minimal
edit there is named in the PROGRESS entry.

**Integration proof owner:** B04 proves its own rules; B15 re-runs the whole-board review.

## Acceptance and evidence

Unconditional checks:

- `npm run verify:board` passes (typecheck, Vitest, catalogue check).
- `npm run check` on the real catalogue: no errors; before/after output compared and differences listed
  (B04-REQ-10).
- Heading-slug set before/after compared for every Markdown artifact and note (B04-REQ-10.3).
- A search shows no second copy of the code rule, heading derivation or spot-existence rule left in
  `shared/` or `src/` (B04-REQ-01.1, 02.1, 06.1).
- Check run time on the real catalogue recorded before and after, with no material slowdown.

Proof per finding. Every proof must fail on the code before the fix and pass after it (convention
13): an automated test where practical, otherwise a recorded manual check run on both versions.

| Finding | Proof obligation |
|---|---|
| R-27 | R-27's own cases (`A --> B[Label]`, flag shape, `--o`/`--x`, `@{}`) give exactly the declared IDs and `around: [node=B]` on `A --> B[Label]` passes the check; the extension corpus of B04-REQ-04.1 is proved alongside as hardening; ideally compared against the IDs mermaid itself renders |
| R-28 | AR-58's `9.1 Catalogue, EP-04 Contracts` section opens from the Sections list and from `AR-58#91-catalogue-ep-04-contracts` in the running board; all 14 ID-bearing headings carry the server slug in the DOM |
| R-38 | A mapping-valued `cited_as` and a `pageOffset` key each give the stated warning |
| R-60 | The stray-backtick-plus-fence body: deleting US-01.1.2 succeeds through the API and leaves no link; the image case behaves the same in `unlink` and `mentions`; a property-style check that after any `planDelete` no explicit link into the gone set remains |
| R-61 | A stray backtick before a blank line no longer hides `[the rule](US-01.1.1)` from `mentions`, the check and `unlink` |
| R-62 | Cross-field backticks (and an unclosed fence in one field) no longer hide a link in the next field, in the artifact index and the check |
| R-75 | `cited_as` `spot: p27` (PDF with 27+ pages) and `spot: L1-10` (Markdown) pass; a missing page or line still errors |
| R-76 | "p.3" on Markdown, "p.2" on SVG, `L33-27`, `L0` and points on a file without points each warn; valid spots still pass |
| R-77 | `artifacts: [AR-05#te-reo-māori]` against a heading of that slug passes; pasting it links |
| R-78 | `OQ-01 · answered by Sam` resolves to OQ-01 |
| R-79 | "Old spec p.40" with AR-01 retired to AR-02 (50 pages) opens AR-02 p40 with no warning |
| R-80 | `#2#3` and `#2, #9` each either check every number or are flagged, per B04-Q2; never NaN |
| R-81 | The malformed-tail case names the existing note file and a tail-specific reason |
| R-82 | Two sidecars on one note file are reported naming both; a self-duplicated prefix is not reported as claimed by itself |
| R-83 | Each corpus case of B04-REQ-02.4 gives the same text in the check and the viewer; `heading=fee_schedule rules` passes and highlights; `Q&amp;A` lists slug `qa` and resolves |
| R-84 | `rect.panel,` is reported invalid or matching nothing, not "spans 3 elements" |
| R-85 | The `\|-` caption with `#3` and `- as: "Board pack #2"` give no warning; `- as: Board pack #2` still warns |
| R-101 | An NFD "Māori health" passage passes the check and draws a box over exactly that passage in the Markdown reader (and the PDF reader shares the fix through `quoteRange`) |
| D-03 | B04-REQ-09.3: the agent-side note-cite resolver and the board's `resolveSource` give the same note (or both unresolved) for every real note file and `Notes ...` source string and the R-141 cases, run the way agent tools run |

Prohibited regressions: any existing behaviour listed as Preserved above; any new error on the real
catalogue; any changed slug that something references; links detected inside real code; the board
rendering bare IDs differently.

Criteria awaiting decisions: the image-link case of R-60 (B04-Q1); the accepted point-list forms of
R-80 (B04-Q2); the severity of R-82 and R-84 reports (B04-Q3); the D-03 proof's run mode.

## Deferred decisions for execution planning

Shared register: [PROGRESS.md](../../PROGRESS.md) "Deferred decisions". Each open item is resolved in
B04's implementation planning, with the user where marked, before B04 builds.

**D-03 How agent `.mjs` tools share `shared/*.ts` rules, including the note-cite resolution rule**
(**Answered 2026-11-19, accepted decision 18: A, direct import from the catalogue path.** Was open; owner B04, with the user; dependents B13-REQ-07b and B12 if it needs shared code; gate: before
B04 builds, and as a planning-only gate before B12 builds if B12 needs shared code and before
B13-REQ-07b, accepted decision 8). Options and consequences, not chosen here:
- *A. Import `shared/*.ts` directly under Node type stripping.* One implementation, no drift. The
  engine floor (22.18) already runs `.ts` for the board's scripts, so shared files already must use
  only erasable TypeScript; that becomes a stated rule. Imports are relative paths from
  `agent/skills/<skill>/...` into the board, which break if a tool runs from a copied skill folder
  outside the board, and cannot reach code the workflow runtime or a generated HTML page needs inline
  (ref-kit builds a browser-side matcher from a string). Not yet confirmed on Node 22.18 itself.
- *B. Keep mirrored `.mjs` copies with parity tests.* Tools stay self-contained and run from any copy
  or runtime. Two implementations remain (the condition systemic issue 4 describes); safety rests on a
  parity test in `verify:board` over a corpus that includes the real catalogue's note names and
  headings, and on every future rule change touching both copies.
- *C. A variant of either:* the rule written once in a form both sides can load without type
  stripping (for example plain JavaScript in `shared/` typed for TypeScript), or a copy generated from
  `shared/` and checked for staleness. Trades a build or generation step for one source.
Boundary impact: decides the shape in which B13 calls the note-cite resolver for R-141 (under option
B the mirrored copy covers the whole resolution rule, not only the slug) and whether B12 can reuse
shared status rules; affects B14's kit export and install-skills docs if tools gain a path dependency
on `shared/`. Affected acceptance: the D-03 row.

**B04-Q1 What an image whose target is a record ID means** (**Answered, accepted decision 18: ignored by both.** Was open; source: R-60; affects
B04-REQ-01.3, `tests/remove.test.ts:9`; owner B04; gate: before B04 builds; no dependents). `![x](US-01.1.2)` renders as a broken image, not a
link. Options: count it as a link (the check catches a broken one; `unlink` must then rewrite it, and
to what), or ignore it in both `mentions` and `unlink` (matching the renderer). None exists in the
catalogue today.

**B04-Q2 Point-list grammar** (**Answered, accepted decision 18: all three forms are point lists.** Was open; source: R-80; affects B04-REQ-07.2, SCHEMA "Which spot" and
B04-REQ-09's resolver split; owner B04; gate: before B04 builds).
A comma after the spot currently starts reader words, so `#2, #3` is ambiguous: two points, or point 2
plus words. Decide whether `#2#3` and `#2, #3` are accepted point lists or flagged sources. No
`sources:` entry uses either form today (prose in `domain-model.md` does, but is not resolved).

**B04-Q3 Severity of the new reports** (**Answered, accepted decision 18: warnings.** Was open; sources: R-82, R-84; affects B04-REQ-05.1, 07.4; owner
B04; gate: before B04 builds).
A shared note file or shared `file` across artifacts, a self-duplicated prefix, and an invalid
selector: error (consistent with prefix clashes and "matches nothing") or warning. Either keeps the
real catalogue green today; an error blocks board saves if it ever trips.

**B04-Q4 Who updates SCHEMA and About text for rules B04 changes.** Answered (accepted decision 10,
convention 12, 2026-11-18): B04 updates the doc lines that state rules it changes (SCHEMA Sources
"Which spot" and "Check", `cited_as` `spot`; the add-artifact skill and About text where they state
those rules) and lists them under "Doc facts" in its PROGRESS entry; B14 does the whole-file pass.

## Risks and recovery requirements

- **Slug drift breaks links.** Changing heading derivation could rename slugs that `within`, `spot`,
  `artifacts:`, text links or `heading=` anchors use. Mitigation required: the slug-set comparison of
  B04-REQ-10.3 before merge; today's evidence is that no catalogue heading uses any construct whose
  text changes, apart from record IDs, which keep their text.
- **Hidden links surface as errors.** A truer code rule can reveal links that were wrongly masked; a
  broken one becomes a check error and blocks saves. Mitigation: the before/after check comparison;
  any new error is shown to the user before B04 merges, never silenced by a rule exception.
- **Stricter source rules add noise.** Spot and grammar rules are warnings only (SCHEMA), and the
  real catalogue shows no affected source today.
- **Viewer mapping errors.** Normalising DOM text while mapping offsets back can misplace a box; the
  proof must check the box covers the passage, not only that a match was found.
- **Live agents.** Link index, link proposals and apply scripts (B13 territory) consume `mentions`;
  their outputs may change where the old rule was wrong. No plan tool imports `shared/` today, so the
  live catch-up lanes are unaffected unless D-03 makes them import it.
- **Performance.** Per-field extraction and any parse-based heading derivation run in the check before
  every write; the recorded timing guards against a slowdown.
- **Recovery.** Each rule change is separable (one requirement each) so a regression found in review
  can be reverted alone without losing the others; no catalogue data is migrated.

## Execution and handoff obligations

1. Read PROGRESS.md (conventions 1 to 14, accepted decisions), PLAN.md, this SPEC and the owned
   FINDINGS entries; reconfirm HEAD and that B03 has landed (serial order: B01, B02, B03, B04, B08,
   ...).
2. Resolve D-03 (with the user) and B04-Q1 to B04-Q3; record answers in PROGRESS.md before building.
   If B12 or B13-REQ-07b needs D-03 earlier, settle it in a B04 planning conversation first.
3. Write `docs/board-fixes/phases/B04-one-rule-one-helper/IMPLEMENTATION.md` before building: approach
   per requirement, the corpora, the before/after catalogue and slug comparisons, bites, checks and
   rollback. Name any existing test changed because it encodes a fixed defect.
4. Capture the baselines first: `npm run check` full output, the heading-slug set, check run time.
5. Build in bites; keep `npm run verify:board` green; run any touched Playwright spec on a free port
   (never 5173, 5174, 5180, 5181).
6. Bump the board version (`requirements-board/package.json` and lock file; minor, since check results
   and viewer highlights change) and add a `CHANGELOG.md` entry; update the SCHEMA, skill and About
   lines that state rules B04 changed (convention 12).
   Confirm every regression proof fails on the pre-fix code and passes after (convention 13).
7. Run the three review lenses (quality, completeness against this SPEC, correctness), verify their
   findings, fix confirmed ones and re-run verification.
8. Record every owned finding's disposition: **Fixed** (with its proof), **Not reproducible at HEAD**
   (with evidence), **Won't fix** (user accepted, with reason) or **Moved** (named owner, recorded in
   PROGRESS and both SPECs). At planning time all 18 reproduce.
9. Write the PROGRESS.md phase entry last: what shipped, the D-03 answer and the note-cite resolver's
   name and contract for B13 (and B12 if used), the check and slug comparison results, facts B05, B06
   and B10 inherit, minimal edits made in other phases' files (convention 11), and every doc line
   changed listed under "Doc facts" (convention 12).
10. Commit only this phase's files, staged by path at commit time; never push.
