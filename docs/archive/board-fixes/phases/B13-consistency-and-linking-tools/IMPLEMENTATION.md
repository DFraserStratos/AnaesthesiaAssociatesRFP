# B13 implementation plan

Branch `board-fixes-b13`, worktree `AnaesthesiaAssociatesRFP-board-B13` (ports 5673, 5674, 5680).
Caught up: `board-fixes` = branch start; master merged (`git merge master`, catalogue and plan files
only, no board code). Baseline `verify:board` green (two known load-timeout flakes, `originLive` and
one `api` history test, pass alone); agent `node --test` suites 29 of 29.

Decisions: accepted decision 27 (B13-Q1 to Q5, and how a decision binds). D-03 consumed as B04 shipped
it: `resolveNoteCite(loadSourceIndex(req), cite)` imported from `<req>/../shared/sources.ts` and
`<req>/../server/sourceIndex.ts`; `noteWords` for the words/spot split; `codeRanges` from
`shared/markdownCode.ts` for code masking. B04 has landed, so B13-REQ-07b is not blocked.

All findings reproduce at HEAD: the owned files are unchanged since `d4341735` apart from line drift.

## Technical choices per requirement

Paths relative to `requirements-board/`; `K` = `agent/skills/consistency-review/scripts`.

- **New `K/guard.mjs`** (shared by `build-review.mjs` and `apply.mjs`): `editRefusal(file, old, ctx)`
  returns null or a reason. Refuses: a path that resolves (after `realpath` of the file or its nearest
  existing parent) outside `<repo>/<REQ>`; `notes/`, `changes/`, `reference/`; a protected artifact's
  sidecar or drawn file (drawn file resolved as the board does: `/`-rooted from the repository, else
  from the catalogue); a retired item (status with role `retired` in `board.config.json`) or retired
  artifact (`status: Retired` or `superseded_by`); a question edit whose `old` text lies at or after
  its `## Answer` line. Missing file is `file not found`. Also `fingerprint(change)` and
  `questionFingerprint(q)`: sha256 of canonical JSON, 12 hex characters; edits sorted, `fixed` and
  problem fields ignored.
- **R-34, R-140 (`apply.mjs`):** reads `req` and `protected` from `changes.json` (new fields, written
  by `build-review.mjs`; `--req` and `--protected` override; defaults for a pre-phase file). Accepted
  changes apply in id order on an in-memory copy; each change's edits run in sequence on a scratch copy
  and commit only if all pass; otherwise `FAIL` per failing edit plus `HELD <id>: whole change held
  back`. Missing files are `FAIL`, never a crash. Writes only files of committed changes.
- **R-140 (`build-review.mjs`):** exact duplicates (file, old, new) merge; same file and old with a
  different new both stay and both are flagged; each change's edits are run in sequence and an edit
  that fails only after an earlier edit of the same change is flagged. Cross-change clash check as
  today. Every edit shows its full repo-relative path beside the friendly label.
- **R-09:** fingerprints on every change and question in `changes.json` (`fp`) and on each card
  (`data-fp`). Page state keyed by fingerprint (`{ [fp]: { v, note, id } }`), so a change keeps its
  decision under a new id; legacy entries keyed by id with no fingerprint are listed on the page as
  "decided on an earlier build" and never shown as current. Exports carry `id@fp` (saved file:
  `{ version: 2, baseline, decisions: { id: { v, note, fp } } }`; copied text: `ACCEPT: L-01@fp ...`).
  `decisions.mjs` matches by fingerprint, reports moved ids, stale and unverified entries, and writes
  `accepted-ids.txt` as `id@fp`. `apply.mjs` checks each `id@fp` against the change's fingerprint
  (computed from `changes.json`, so pre-phase files work); a mismatch is `FAIL ... decided on an
  earlier build`; a bare id is `UNVERIFIED` and applied only with `--unverified`.
  Question fixups: keys `Q-nn@fp` (checked) or plain `Q-nn` (legacy: honoured, then pinned in
  `changes.json` `questionPins`; skipped with a warning once that id names another question).
  Consolidator questions keep their numbering, so a plain key means what it meant on the same journal.
- **R-20:** verifier `newQuestions` not kept by any consolidator (lower-cased title, or listed in a
  consolidator question's new optional `from` titles) are added after the consolidator questions,
  marked `unreviewed` ("not reviewed by the final pass"), unless a consolidator dismissed them in its
  new optional `dismissedQuestions: [{ title, reason }]`, which `changes.json` records. Prompt step 5
  asks consolidators to keep, merge (with `from`) or dismiss (with a reason) each proposed question
  that concerns their group. Counts print `questionsUnreviewed`.
- **R-21:** `action` (`edit`, `redraw`, `flag`) on every change. Optional `action` in the verify and
  consolidate schemas (optional, so old journals and in-flight shapes still validate). Classification
  in `build-review.mjs`: edits present = edit; else redraw only when the agent said redraw or the
  change comes from a diagram verifier, and it concerns an artifact that is neither protected nor
  retired; else flag. Pills "needs redrawing" and "flag only"; counts `redraw` and `flag`.
- **R-144:** change and question ids use two digits up to 99 and four past it (`S-0104`), never three,
  so they never read as a ruling (`S-\d{3}`). `ref-kit` change pattern `[LMSQ]-(?:\d{2}|\d{4,})`;
  `decisions.mjs` and `apply.mjs` accept `[LMSQ]-\d+`.
- **R-141, R-142:** `ref-kit.mjs` `makeResolver` becomes async and resolves note cites and shorthands
  with `resolveNoteCite` (no `same[0]` fallback, no private slug). The page matcher gets the exact cite
  strings the server resolved (found by trying each `Notes <date> · ` word prefix with the board's rule),
  so a cite without points is one reference; a generic words-before-`#n` form remains so unresolved
  cites still reach `ref stats`. Shorthand keys and terminators share one pattern. `build-packs.mjs`
  `citedPoints` resolves with `resolveNoteCite` and splits with `noteWords`. Prompts and skills teach
  slug words with a generic example (a note titled "Sam's pricing call" saved as
  `2026-10-16-sam-pricing-call.md` is cited `Notes 2026-10-16 · Sam pricing call #8`); the rulings
  workflow lists the valid note cite prefixes derived from the note file names it is given.
- **R-143:** `build-packs.mjs` skips Retired or superseded diagrams (`skippedDiagrams` in
  `index.json`) and resolves `/`-rooted `file:` from the repository; `svg` in `index.json` is
  repo-relative either way.
- **R-145:** heading uses `ownerShort` (default: the first word of `owner` when given, else "the product
  owner").
- **R-147:** `consistency-changes.js` checks group topics against `topics` before Find, logs unmatched
  topics, and returns `groupCheck: { unmatched, toCatchAll }` (count filled after Verify). "This repo"
  groups realigned to the suggested topics.
- **R-08:** new `scripts/linkRuns.ts`: `startLinkRun(root)` (moves an existing `current/` to
  `runs/<its start stamp>/`, creates `current/run.json`) and `pickLinkRun(root, dirArg)` (default
  `current/`; lists loose pre-fix `*.verified.json` in the root). `link-index.ts` calls `startLinkRun`
  when writing to a file; `apply-links.ts` uses `pickLinkRun`, names the run in output and report. The
  workflow's default `outDir` becomes `<board>/.links/current`; `indexPath` default unchanged.
- **R-133:** `applyProposals` resolves each inline anchor in the field's original text, refuses an
  anchor overlapping one placed earlier in the run (skip with reason), keeps one link per target per
  field across placed links, and splices from the end. Masking from `codeRanges` (B04) plus Markdown
  links (`LINK_SOURCE`).
- **R-146:** workflow normalises `batches`; validates every element; returns `{ error }` before any agent.

## Fixtures and proofs (each fails on the starting code first)

- `K/consistency-review.test.mjs` (`node --test`): a scratch repo with a tiny catalogue, rulings file and
  stage-2 journals built in the test; runs the real scripts with `node`. Covers REQ-01 (outside, `../`,
  symlink, protected sidecar and SVG, missing, notes, Answer, retired), REQ-02, REQ-03 (reorder, pasted
  text, pre-phase file, question fixups), REQ-04, REQ-05, REQ-06 (more than 99 small changes), REQ-07
  (b to e; ref-kit and build-packs against the board's resolver), REQ-08, REQ-15 (pre-phase journal and
  changes.json).
- `agent/workflows/workflows.test.mjs`: stubbed runtime (`args`, `log`, `agent`, `parallel`, `pipeline`,
  `phase`) for REQ-07a prefixes, REQ-09, REQ-10, REQ-13, REQ-04's prompt and schema.
- `tests/linkProposals.test.ts` (Vitest): REQ-12 cases; `tests/linkRuns.test.ts`: REQ-11 scenario.
- Fail-first: each new test file is run against the starting code (scripts restored from `HEAD` in a
  scratch copy) and its failures recorded before the fix.

## Execution bites

1. guard.mjs, apply.mjs, build-review.mjs (REQ-01 to 06, 15) with tests.
2. ref-kit, render-rulings, build-packs (REQ-07, 08) with tests.
3. Workflows (REQ-04 prompt, 07a, 09, 10, 13) with stubbed tests.
4. Link scripts (REQ-11, 12) with Vitest.
5. Skills and docs (REQ-14); version, CHANGELOG; verify; review; PROGRESS.

## Checks

`npm run verify:board` from the repo root; `node --test $(find requirements-board/agent -name '*.test.mjs')`;
a read-only dry run of `build-packs.mjs` and `render-rulings.mjs` over the real catalogue into the
scratchpad. Never `apply.mjs` or `links:apply` without `--dry-run` on the real catalogue.

## Recovery and handoff

Every change is in tracked files; reverting the B13 commit restores the old tools. No catalogue data
changes. In-flight stage-2 runs: prompts and schemas changed, so resume would replay nothing past the
first changed prompt; old journals still build. Handoff to B14: `links:index` starts a run folder
(`.links/current/`, earlier ones in `.links/runs/`), `links:apply [-- <dir>]` defaults to it, the
workflow's `outDir` default; `build-review.mjs --protected`; `apply.mjs --unverified`.
