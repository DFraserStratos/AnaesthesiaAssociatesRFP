# Phase B13: Consistency and linking tools tell the truth and touch only what was approved

**Status:** PLANNED

**Requirements:** R-08, R-09, R-20, R-21, R-34, R-133, R-140, R-141, R-142, R-143, R-144, R-145,
R-146, R-147, each in [FINDINGS.md](../../FINDINGS.md) under its `#### R-nn` heading (detail
sections; ranked summary table at the top). Systemic issue 4 ("the same rule is coded twice")
covers R-141. Programme outcome 7 in [PLAN.md](../../PLAN.md): agent tools and docs tell the truth.

**Owns:**
- `requirements-board/agent/skills/consistency-review/` (SKILL.md and every script in `scripts/`:
  `apply.mjs`, `build-packs.mjs`, `build-review.mjs`, `decisions.mjs`, `page-kit.mjs`, `ref-kit.mjs`,
  `render-rulings.mjs`).
- `requirements-board/agent/workflows/consistency-rulings.js`, `consistency-changes.js`,
  `link-requirements.js` (including each workflow's `meta` text, which is the only "skill" text
  link-requirements has).
- `requirements-board/scripts/apply-links.ts`, `requirements-board/scripts/linkProposals.ts` and
  `requirements-board/scripts/link-index.ts` (accepted decision 5), and their tests, including
  `tests/linkProposals.test.ts`.
- The sentences of other SKILL.md files that describe these tools (PLAN territory; see B13-REQ-14),
  and the doc lines that describe behaviour B13 changes (convention 12).
- New regression tests for the agent tools, placed where `verify:board` finds them (every
  `*.test.mjs` under `requirements-board/agent/`, accepted decision 6).
- A disposition and proof for every owned finding; the phase's board version bump and CHANGELOG entry.

**Excludes:**
- Board-side text rules: `slugify`, heading slugs, code masking, spot parsing, `shared/sources.ts`
  note resolution, `shared/links.ts` (B04). B13 consumes them; it does not change them.
- The decision on how agent `.mjs` tools share `shared/*.ts` rules (D-03, owned by B04).
- Other scripts (`export-kit`, `new-artifact`, `capture`, `install-skills`, `shoot-steps`), the R-31
  path sweep across every script, which edits `link-index.ts` and `apply-links.ts` after B13, and the
  whole-file docs truth pass over README, ADOPTING, SCHEMA, starter and About install text (B14).
- run-build-phase and update-build-plan tools and skills (B12).
- Server path guards and the file API (B01). B13's path safety is for the consistency review's own
  apply step only.

**Depends on:** B04 for B13-REQ-07b only (D-03), as PLAN states.
- B13-REQ-07b uses B04's committed note-cite resolution rule (note slug, longest-prefix match and the
  words/spot split, B04-REQ-09.2) in the shape D-03 settles. D-03 is settled in a B04 planning
  conversation before B04 builds, and B13-REQ-07b builds after B04 has landed.
- Every other requirement is independent. B13 runs in its own worktree, in parallel with the serial
  app phases (B01, B02, B03, B04, B08, B05, B07, B06, B09, B10, B11), and before B14.
- PLAN says `linkProposals.ts` adopts B04's code-masking helper (R-60/R-61). If B04 has landed when
  B13 builds B13-REQ-12, B13 uses it. If not, B13 does not wait, and records the remaining copy
  (see Dependencies and handoffs).

**Unblocks:**
- B14: its R-31 path sweep (on `link-index.ts` and `apply-links.ts` after B13), docs truth pass and
  kit export take B13's final skill, workflow and script behaviour as input.
- B05: `apply-links.ts` writes through `writeItem`, which B05 changes. If B13 merges first, B05 keeps
  B13's merged `apply-links` and `linkProposals` tests green.
- B15: closing audit of B13's dispositions.

**Binding constraints:** PLAN "Binding constraints" and PROGRESS conventions 1 to 14, in
particular:
- Findings are the source of truth and each ends with one disposition (conventions 1 and 2).
- Existing stack (conventions 3 and 4). The consistency-review
  scripts are plain `.mjs` run with `node` (Node >= 22.18), with no build step; the board's
  `yaml` dependency is the only package they load today (`build-packs.mjs:33-34`). New dependencies
  need a recorded reason.
- **Workflow API.** The three workflows run under the Workflow tool, not as importable modules:
  top-level `args`, `log`, `phase`, `agent`, `parallel`, `pipeline`, and a top-level `return`.
  `agent()` may return `null` (every caller already filters it), and structured output is enforced by
  JSON schemas passed to `agent()`. Resume replays only the longest unchanged prefix (SKILL
  "Ground rules"). Any change keeps these conventions.
- **Journal contract.** `build-review.mjs` reads the stage-2 journal by agent label prefix
  (`find:`, `verify:`, `consolidate:`) and by result shape. Journals and run folders made before
  this phase must still build (B13-REQ-15).
- **Project-generic code.** Scripts and workflows carry no project vocabulary; project facts live
  only in each skill's "This repo" block (PROGRESS convention 4; root CLAUDE.md kit rules).
- **No catalogue content change.** Proofs run on fixture catalogues or scratch copies. Neither
  `apply.mjs` nor `links:apply` is run without `--dry-run` against the real catalogue during the phase
  (PROGRESS convention 7).
- **Live agents.** update-requirements Stage 5 calls `links:index`, the link-requirements workflow and
  `links:apply`; other sessions use them. Command shapes stay backward compatible, or the skill text
  changes in the same commit (PROGRESS convention 8).
- Finish green with `npm run verify:board`, plus every agent `node --test` suite until B12 adds them
  to `verify:board` (convention 6).
- Bump the board version (minor: agents see the behaviour change) and add a CHANGELOG entry
  (convention 5). The version is picked at merge time: `board-fixes`' version plus the bump, the entry on
  top, the lock file regenerated with `npm install` (convention 14).
- Git rules (convention 9). B13 runs in its own worktree (`AnaesthesiaAssociatesRFP-board-B13`, branch
  `board-fixes-b13`, convention 10) with its own ports, and finishes by fast-forwarding `board-fixes`
  (PROGRESS convention 16, steps 1 to 5).
- Touch rights (convention 11): minimal edits in other phases' files, named in the entry. Doc lines
  (convention 12): every doc line describing changed behaviour is updated and listed under "Doc
  facts".
- Proof fails first (convention 13): every regression proof fails on the code before the fix and
  passes after it.

## Objective and outcomes

The consistency review and the linking workflow are how agents propose bulk edits to the catalogue
and how the user approves them. Today both can change the catalogue in ways the user did not
approve: an approval can land on a different change, an edit can land outside the catalogue, half a
change can apply, an old link run can restore links the user removed, and a link can land on the
wrong word. They also lose or mislabel what the user needs to decide: verifier questions vanish,
flags read as "needs redrawing", and some note cites resolve to the wrong note or to nothing.

When B13 is delivered:

1. **Only approved edits reach the catalogue, and only inside it.** An accepted decision applies to
   exactly the change the user saw; an edit outside the catalogue folder or on a protected artifact
   is refused; a change applies whole or not at all.
2. **Nothing the reviewers raise is lost or mislabelled.** Every verifier question reaches the page,
   every change says whether it is an edit, a redraw or a flag, and change ids never open the wrong
   popover.
3. **Note cites mean the same thing everywhere.** The review pages, the reading packs and the board
   resolve a note cite to the same note, or all report it unresolved; the prompts teach the form
   that resolves.
4. **The review covers the right material.** Retired diagrams are not reviewed for drift, diagram
   files are found where the board finds them, and consolidation groups that match no topic are
   reported.
5. **A link run applies its own proposals, on the words the agents chose**, and accepts the batch
   shapes its docs describe.
6. **Existing run folders, review pages and link runs keep working**, and the skills and docs say
   what the tools now do.

## Sources and current-state evidence

Verified at HEAD `d4341735` (board 1.12.3), the commit FINDINGS.md was produced against. None of the
owned files has changed since; every line reference in FINDINGS still holds. All 14 findings
reproduce. Paths below are relative to `requirements-board/`.

| Finding | Evidence at HEAD | Reproduced how |
|---|---|---|
| R-34 | `apply.mjs:22-23` joins `repo` and `e.file` with no containment check and reads with `readFileSync` (throws on a missing file). `build-review.mjs:65` (`norm`) turns an absolute outside path into `../../..`; `:97` reads it as valid; `:160` labels an edit by basename only. Protected artifacts exist only in the prompt (`consistency-changes.js:157`). | Fixture journal with an edit to an absolute scratch path outside the repo: build-review reported no problem, `apply.mjs --dry-run` printed `ok` for it. |
| R-140 | `build-review.mjs:79` dedupes edits on `file + old`, dropping a second edit with a different `new`; `:115-127` checks clashes only between different changes; `apply.mjs:20-28` applies edit by edit, so a change can half-apply. | Fixture: two edits with the same `old` and different `new` in one change; only the first survived, no warning. |
| R-09 | `build-review.mjs:257` keys localStorage on `storage-key + baseline`; `:99-103` gives ids by sort position. `decisions.mjs:17-18,30` warns only on ids missing from changes.json. SKILL Stage 3.1 claims ids are stable while the journal is unchanged; Stage 4.2 tells the agent to rebuild the page when the catalogue has moved, which renumbers. `question-fixups.json` is also keyed by position-based `Q-nn` (`:128-138`). | Code reading; confirmed by the original three verifiers. |
| R-20 | `build-review.mjs:36,42` collects `proposedQuestions`, never read; `:89` takes questions only from consolidators. `consistency-changes.js:273` skips groups with no findings; `:291` tells consolidators to keep only questions that block a fix in their group. | Fixture: a verifier returned a question; changes.json had `questions: []`. |
| R-21 | `build-review.mjs:113` `needsRedraw = edits.length === 0`; `:170` paints the pill; `:282` counts it. SKILL Stage 4.6 redraws every accepted "needs redrawing" change. | Fixture: an edit-less flag on protected, retired AR-30 came out `needsRedraw: true`. |
| R-144 | `ref-kit.mjs:22` pattern list puts `S-\d{3}` (ruling) before `[LMSQ]-\d{2}` (change id); `:203` and `:249` recognise change ids only as two digits. | Scratch run of `makeResolver`: "S-104" resolved as the ruling S-104; "L-100" was not recognised at all. |
| R-141 | `ref-kit.mjs:51` slug turns `'` into `-` (the board's `shared/artifacts.ts:227 slugify` drops it); `:126` note slug is the file name; `:178` exact or prefix slug match; `:179` falls back to `same[0]`; `:14` the page matcher only takes words that are a note's H1 title or are followed by `#n`. `build-packs.mjs:75,94` has a third slug. Prompts say "title words": `consistency-rulings.js:64,139`; `agent/skills/update-requirements/SKILL.md:49`. `agent/skills/add-artifact/SKILL.md:44` says a note "resolves by its file name" under the heading "title words". 6 of the 26 notes have a file slug that differs from their title (apostrophes, "AA's", colons). The catalogue itself cites by slug words (for example 154 sources read "Notes 2026-11-05 · Donald contract model decisions"). | Scratch run: "Notes 2026-11-05 · Donald's contract model decisions #9" unresolved; "Notes 2026-11-05 · Donald contract model decisions" (no points) opened "AA meeting with Ben and Vanessa". |
| R-142 | `ref-kit.mjs:57` key pattern `[A-Z][A-Za-z]*\d+`; `:59` lookahead terminator `[A-Z]+(?:\d+|<date>)`. | Scratch run: with `G1016 = ... · Bv1105 = ...`, Bv1105 got no entry and G1016's words ran on into it. |
| R-143 | `build-packs.mjs:175` packs every `kind: diagram` sidecar regardless of `status`/`superseded_by`; live AR-30 and AR-52 are Retired diagrams. `:178` joins a `/`-rooted `file:` onto the catalogue folder, where the board treats it as repo-rooted (`server/artifactFiles.ts:62-64`); `:198` builds `svg` the same way, and `consistency-changes.js:163` passes it on. | Sidecar survey at HEAD. |
| R-145 | `consistency-rulings.js:33` default owner "the product owner"; `:149` heading uses its first word. | Code reading: default gives "## Conflicts for the". |
| R-147 | `consistency-changes.js:239-240` exact string match of group topics, no validation; topics outside every group fall to the catch-all. In SKILL "This repo", 10 of the 13 listed group topics match none of the 20 suggested topics (FINDINGS counted 11 of 13 against an earlier topic list). | Parsed the SKILL JSON block. |
| R-08 | `apply-links.ts:21-24` reads every `*.verified.json` in the folder; `link-requirements.js:27,89,109` names files by batch grouping, which varies by run; nothing clears or archives the folder. The live `.links/` holds 14 verified files dated 10, 17 and 18 November with overlapping groupings (EP-06, EP-04+EP-06, EP-06+EP-12). `linkProposals.ts:92` skips only already-applied or no-longer-fitting proposals. | Folder listing at HEAD. |
| R-133 | `linkProposals.ts:96-102` counts `occurrence` in the field as already changed by earlier proposals of the same run, where the agents counted in the original text (`link-requirements.js:40,100`). | Scratch run: "price" occurrence 1 and occurrence 2 to two targets; the second landed on the third mention, reported as applied. |
| R-146 | `link-requirements.js:28` accepts any array; `:64` `epics.join` and `:68` `e.replace` assume an array of arrays. `meta.whenToUse` (`:5`) says "pass `batches` (the epics touched ...)", and update-requirements SKILL.md:180-181 says "`batches` set to the touched epics". | Code reading: a flat `["EP-04","EP-06"]` throws `epics.join is not a function` before any agent runs. |

Related facts:
- `tests/linkProposals.test.ts` pins today's link semantics: occurrence choice, several links per
  field, one link per target per field, skips with reasons, relations once, idempotence. No test
  covers the consistency-review scripts or the workflows.
- `linkProposals.ts:25-31` has its own code and link masking, with the same cross-blank-line code
  span pattern that R-61 (B04) reports in `shared/links.ts`.
- The run folder named in consistency-review's "This repo" block (`/Users/d.fraser/Local Dev/AA
  consistency review/`) does not exist on this machine, so no real past run was inspected.
  Assumption: real run folders follow the shape the scripts write (`changes.json`, `review.html`,
  `fixups.json`, `question-fixups.json`, a saved journal path).

## Detailed requirements

### Consistency review: applying edits

**B13-REQ-01 · Applied edits stay inside the catalogue and off protected artifacts** (R-34)
- The apply step writes only to files inside the run's catalogue folder (`<repo>/<REQ>`). An edit
  whose path resolves outside it, by `..`, an absolute path, or a symbolic link, is refused with a
  `FAIL` line naming the path and the reason, and nothing is written for that change.
- An edit to a protected artifact named for the run (its sidecar or its drawn file) is refused the
  same way. The protected list must reach the apply step from the run itself, not from memory of the
  prompt; how it is carried is an implementation choice.
- An edit to a file that does not exist is a `FAIL` line, not a crash, and the rest of the run
  proceeds.
- The review page shows each edit's full repo-relative path (beside the friendly label) and marks an
  out-of-bounds or protected edit as one that will not apply, before the user decides.
- Whether the apply step also refuses the folders the prompts forbid (notes, change logs, reference,
  question answers, retired records) is B13-Q1.

**B13-REQ-02 · A change applies whole or not at all, and its own edits are checked together** (R-140)
- If any edit of an accepted change cannot apply (not found, found more than once, refused by
  B13-REQ-01, or broken by an earlier edit of the same change), none of that change's edits is
  written, and the report says which edit failed and that the change was held back whole.
- The review page checks each change's edits against each other, as it already checks between
  changes: edits of one change that cannot all apply in sequence are flagged on the card.
- Two edits with the same file and `old` text but different `new` text are never silently reduced to
  one: the card flags them as conflicting. Exact duplicates (same file, `old` and `new`) may still
  be merged.

### Consistency review: decisions and the review page

**B13-REQ-03 · A decision binds to the change the user saw** (R-09)
- A decision recorded against one build of the review page is applied only to a change whose
  proposed effect is identical: the same edits (file, `old`, `new`), or, for a change without edits,
  the same title, items and action (B13-REQ-05). Any difference counts as a different change.
- This holds on every route a decision travels: reopening or rebuilding the page (the browser's
  saved decisions), the saved decisions file through `decisions.mjs`, the accepted-ids file into
  `apply.mjs`, and the pasted "Copy decisions" text that SKILL Stage 4.1 allows.
- A decision whose change has changed or gone is never shown or applied as current. It is dropped or
  shown as "decided on an earlier build, decide again", and `decisions.mjs` and `apply.mjs` name it.
- A decision that carries no means of checking (a decisions file or pasted text from before this
  phase) is reported as unverified; it is not applied silently.
- Decisions on questions get the same protection. `question-fixups.json` entries written against one
  build never act on a different question in a later build, including when B13-REQ-04 adds
  questions that were previously lost.
- SKILL Stage 3.1's stability claim is rewritten to state the real guarantee.

**B13-REQ-04 · Every verifier question reaches the user** (R-20)
- Every question a verifier returns appears on the review page, either as kept or merged by a
  consolidator, or marked "not reviewed by the final pass" (the existing wording for unreviewed
  changes). This includes runs where no consolidator ran (no findings, or the group's agent
  returned `null`).
- A verifier question may leave the page only when a consolidator explicitly dismissed it with a
  reason that the run output records, so the dismissal can be inspected.
- Duplicate questions are merged as they are today (case-insensitive title), and the build's printed
  counts include questions not reviewed by the final pass.
- Candidate (FINDINGS): add unkept `proposedQuestions` in build-review, matched by lower-cased
  title; or always run a catch-all consolidator when questions exist.

**B13-REQ-05 · Each change says what action it needs** (R-21)
- Every change is one of: an **edit** (it has edits to apply), a **redraw** (a diagram change too big
  for a text swap, on an artifact that is neither protected nor retired), or a **flag only** (no
  edits and no redraw: protected-artifact flags, decision-blocked findings, any other edit-less
  change).
- Only redraws carry "needs redrawing"; flags carry a distinct "flag only" marking. The build's
  printed counts report redraws and flags separately.
- SKILL Stage 4.6 redraws only accepted redraws, and says what accepting a flag means (an
  acknowledgement, with any follow-up handled by hand or as a question).
- Journals from before this phase, which carry no explicit action, still build: their edit-less
  changes are classified by the same rule from what the journal holds (for example, the source
  label and the protected list).
- Candidate (FINDINGS): an `action: edit|redraw|flag` field in the verify and consolidate schemas.

**B13-REQ-06 · Change ids never collide with ruling codes** (R-144)
- On every page the review scripts render, a change or question id of any length (including past
  99) opens or jumps to its own card, and a ruling code (F-, R-, S-, C-) opens its ruling. No text
  is ambiguous between the two.
- `decisions.mjs` and `apply.mjs` accept every id the page can produce. Run folders whose
  `changes.json` holds two-digit ids still apply (B13-REQ-15).

### Consistency review: references and inputs

**B13-REQ-07 · Note cites resolve as the board resolves them** (R-141, R-142)
- (a) **Teach the form that resolves.** Every prompt and skill sentence that tells an agent how to
  write or abbreviate a note cite says that the words are the note file's slug words, with a real
  example where the title and slug differ, not "title words". This covers
  `consistency-rulings.js:64` and `:139` (the cite field and the "Cite shorthand" line), the
  update-requirements SKILL.md source forms (line 49), and add-artifact SKILL.md's note bullet
  (line 44). Agents producing cites are given the valid note cite prefixes for the run.
- (b) **Same rule as the board** (waits on B04 and D-03). `ref-kit.mjs` (cites and shorthands) and
  `build-packs.mjs` (cited note points) resolve note cites with B04's committed note-cite resolution
  rule: note slug, longest-prefix match and the words/spot split (B04-REQ-09.2). They do not keep a
  separate resolver. They give the same note the board's source resolver gives, or report a cite
  unresolved when the board would. Parity covers apostrophes, `&`, `_`, non-ASCII letters and
  colons. How the tools reach the rule (shared import, or a mirrored copy held by B04's parity
  check) follows the accepted D-03 answer.
- (c) **No guessing.** A cite naming a date but no note words resolves only if exactly one note fits
  it unambiguously; otherwise it is unresolved. It never falls back to the first note of that date.
  (The board's resolver needs words after the date. If parity under (b) means such a cite is always
  unresolved, that is acceptable.)
- (d) **Whole cites recognised.** A cite in the catalogue's form, with or without points, is
  recognised on the page as one reference and opens the note it names. Today a cite without points
  is cut back to its date.
- (e) **Shorthand line parses every key** (R-142). The "Cite shorthand" line yields one entry per
  key, whatever the key's case pattern (for example `Bv1105`), and no entry's words run into the
  next.
- Unresolved cites keep appearing in the `ref stats` line, as SKILL Stage 1.3 relies on.

**B13-REQ-08 · Only live diagrams are reviewed, found where the board finds them** (R-143)
- A Retired diagram (`status: Retired`, with or without `superseded_by`) receives no proposed edits
  or redraws. Whether it is left out of the packs or packed with a clear "retired, do not edit"
  marking is B13-Q4.
- A diagram's `file:` resolves exactly as the board resolves it, including a `/`-rooted
  (repo-rooted) path. The pack's drawn text and the SVG path given to the diagram verifiers point at
  the real file.

**B13-REQ-09 · The rulings heading reads properly with the default owner** (R-145)
- With no `owner` argument, the Conflicts heading in `rulings.md` is a grammatical phrase, never a
  stray article ("Conflicts for the"). With `owner` "Donald" it stays "Conflicts for Donald".
- SKILL Stage 1.5's rename to `## Conflicts decided by <owner> (<date>)` and `render-rulings.mjs`'s
  parsing of both headings keep working.

**B13-REQ-10 · Consolidation groups are checked against the topics** (R-147)
- Before consolidation runs, every group topic that matches no topic in the run's `topics` is named
  in the workflow log and in its returned result, with how many findings fall to the catch-all group.
  A silent pass is not allowed. Whether a mismatch also stops the run is B13-Q3.
- The consistency-review "This repo" `groups` agree with the "This repo" suggested `topics`, so a
  run on this repo starts with no mismatch. SKILL keeps telling the agent to check groups against
  `index.json` topics after stage 1.

### Linking

**B13-REQ-11 · A link run applies only its own proposals** (R-08)
- `links:apply` applies the verified proposals of one link run: the run the user just reviewed.
  Proposals from earlier runs are never applied unless the user names that run explicitly.
- The report (`links-report.md`) says which run it applied, and lives with that run.
- Re-applying the same run stays safe: anything already applied is skipped, as today.
- The workflow and `links:apply` agree on where a run's files are, with no manual copying. The
  update-requirements Stage 5 steps work as written after the change.
- Existing `.links/` contents (14 verified files from 10 to 18 November) are not applied by the
  first run after the fix. What happens to them is B13-Q2; they are not deleted unreported.
- `links:index` (`scripts/link-index.ts`, B13's) may change where it writes the index and batches if
  the chosen fix needs it. Its documented default output stays usable by the workflow.
- Candidate (FINDINGS): a folder per run passed to `links:apply`; or archive batch files before
  proposing; or move applied files to `.links/applied/`.

**B13-REQ-12 · Links land on the word the agent chose** (R-133)
- Each inline proposal's `occurrence` is counted in the field's text as the agents read it, before
  any proposal of the same run was applied, counting only occurrences outside links and code (the
  meaning `link-requirements.js` SHAPES gives).
- Two proposals in one run whose anchors overlap in the same field are not both applied. The second
  is skipped with a reason; neither is shifted onto another word.
- The report never says "applied" for a link placed anywhere other than the chosen occurrence.
- Code and link masking for anchor positions matches the board's rule (B04's helper when landed),
  so a code span cannot cross a blank line and hide a real occurrence (see R-61, owned by B04).
- Existing semantics in `tests/linkProposals.test.ts` hold: one link per target per field, family,
  retired and missing-target skips, relations once, idempotence. A skip reason may change wording
  where the cause is now an overlap.

**B13-REQ-13 · link-requirements accepts the batch shapes its docs describe** (R-146)
- `batches` given as a list of epic groups (`[["EP-06"]]`, or `batches.json`) works as today.
- `batches` given as a flat list of epic IDs (`["EP-04","EP-06"]`), or a mix of IDs and groups, runs
  without error. The workflow log states the grouping it used. Whether each bare ID becomes its own
  batch or the flat list becomes one batch is B13-Q5; FINDINGS' candidate is "normalise each element
  to an array" (one batch per bare ID).
- An element that is neither an epic ID nor a list of them is reported before any agent runs, and
  the run stops cleanly with a returned error, not a TypeError.
- The workflow's `meta.whenToUse`, its args comment and update-requirements SKILL.md Stage 5 step 2
  show the accepted shapes with an example.

### Cross-cutting

**B13-REQ-14 · Skills and docs say what the tools now do** (all owned findings)
- consistency-review SKILL.md: Stage 3.1 (id stability, B13-REQ-03), Stage 3 page description
  (actions and paths, B13-REQ-01/05), Stage 4.1 to 4.3 (decision checks, whole-change apply), Stage
  4.6 (redraws only), "This repo" groups (B13-REQ-10).
- Workflow `meta` text and args comments for all three workflows, where behaviour or accepted
  arguments change.
- update-requirements SKILL.md lines 49 and 180-182, and add-artifact SKILL.md line 44 (B13-REQ-07a,
  -11, -13), limited to those sentences.
- README.md's "Linking requirements" steps (about lines 320 to 335) if B13-REQ-11 changes the folder
  or command shape (convention 12).
- Every doc line changed is listed under "Doc facts" in B13's PROGRESS entry, for B14's whole-file
  pass.
- The About page (`src/views/AboutView.tsx`) only if its skill text becomes untrue (today it is not
  specific enough to change).
- Generic text stays generic: examples in scripts and workflow prompts use no project names.

**B13-REQ-15 · Preserved behaviour (must not regress)**
- `build-review.mjs` builds `changes.json` and `review.html` from a stage-2 journal made before this
  phase, honouring `fixups.json` and `question-fixups.json` with their documented shapes.
- Static `review.html` and `rulings.html` pages already in run folders are not regenerated by this
  phase. Decisions saved from them are handled under B13-REQ-03 (reported as unverified, never
  silently applied to a different change).
- `apply.mjs` still applies a pre-phase `changes.json` (two-digit ids, no action field), with its
  documented arguments (`--ids-file`, `--dry-run`, positional ids).
- `decisions.mjs` still prints accept, reject, change (with notes) and undecided for changes and
  questions, warns on baseline mismatch, and writes `accepted-ids.txt` with `--write`.
- `render-rulings.mjs` and the ref popovers keep resolving every code they resolve today (items,
  questions, artifacts and regions, rulings, CL/TD, correctly formed note cites and shorthands).
- `build-packs.mjs` output keeps its `index.json` fields (`units`, `diagrams`, `notes`, `changes`,
  `answeredQuestions`, `topics`, `counts`) for the workflows.
- `links:apply` keeps `-- <run dir>` and `--dry-run`, refuses to write when the result adds a check
  error, writes through the board's serialiser, and writes a report on every run.
- Workflows keep returning their summary objects and keep tolerating `null` agent results.

## Dependencies and handoffs

- **Consumes B04's note-cite resolver through D-03.** B04-REQ-09.2 commits the whole note-cite
  resolution rule (slug, longest-prefix match, words/spot split) to agent tools in the D-03 shape,
  with a parity proof over the real notes. B13-REQ-07b calls it from `ref-kit.mjs` and
  `build-packs.mjs` and does not re-implement it. B13 does not choose the mechanism. Until D-03 is
  recorded in PROGRESS and B04 has landed, B13-REQ-07b is blocked. B13-REQ-07a, c, d and e, and
  every other requirement, are not.
- **Consumes B04's code-masking helper if it exists** (B13-REQ-12). If B04 has not landed, B13
  fixes R-133 without it and records the remaining duplicate masking in "Discovered for later"
  for B04 or B15.
- **Hands to B14:** the final command shapes of `links:index`/`links:apply` and the workflow
  arguments, for B14's R-31 path sweep (which edits `link-index.ts` and `apply-links.ts` after B13),
  docs truth pass and kit export. The doc lines B13 changed are listed under "Doc facts" in its
  PROGRESS entry.
- **Hands to B05:** `apply-links.ts` writes through `writeItem`. If B13 merges before B05, B05 keeps
  B13's merged `apply-links` and `linkProposals` tests green.
- **Integration proof owner:** B13 proves its own findings; B15 re-audits.
- No new technical interface is mandated. How decisions are fingerprinted, how a run folder is
  named, how the protected list reaches `apply.mjs`, and how actions are recorded are execution
  choices, recorded in `IMPLEMENTATION.md`.

### Boundary notes

1. **Other skills' docs.** R-141 and R-146 need sentence fixes in
   `agent/skills/update-requirements/SKILL.md` (lines 49, 180-182) and
   `agent/skills/add-artifact/SKILL.md` (line 44). Answered (PLAN territory; conventions 11 and 12,
   2026-11-18): B13 owns the sentences of other SKILL.md files that describe its tools, and edits
   only those.
2. **`scripts/link-index.ts`.** Answered (accepted decision 5, 2026-11-18): it is B13's. B14's R-31
   path sweep edits it after B13.
3. **README.md** is a B14 kit doc. Answered (convention 12, 2026-11-18): B13 updates only the linking
   steps that describe behaviour it changes, lists them under "Doc facts", and B14 does the
   whole-file pass.
4. **Masking duplicate.** `linkProposals.ts` repeats the R-61 code-span defect locally. R-61 is B04's,
   and PLAN has `linkProposals.ts` adopt B04's helper. B13 runs in parallel and may build B13-REQ-12
   before B04 lands. If so, B13 records the remaining local copy in "Discovered for later" for B15
   to confirm or close.

## Acceptance and evidence

Unconditional proofs. Each is a fixture run, a test, or a recorded manual check; the execution plan
chooses which. **Every proof must fail on the code at the phase's start (or the recorded manual check
must show the failure) and pass after the fix (convention 13).** Automated proofs for agent tools are
`*.test.mjs` files under `requirements-board/agent/`, where `verify:board` finds them once B12 lands
(accepted decision 6). Proofs for `scripts/` live in the board's Vitest suite. Workflow behaviour may be proven with stubbed `agent()`/`parallel()`/`pipeline()`/`log()`
or a recorded run on a fixture catalogue. Real-catalogue runs are dry runs only.

| Req | Finding | Proof obligation |
|---|---|---|
| B13-REQ-01 | R-34 | A fixture change with edits to (i) an absolute path outside the repo, (ii) a `../` path, (iii) a symlink inside REQ pointing outside, (iv) a protected artifact's sidecar and SVG, (v) a missing file. The page marks (i) to (iv) as not applying and shows full paths. `apply.mjs --dry-run` and a real run on a scratch copy print `FAIL` for each and write nothing outside REQ. A file outside REQ is byte-identical afterwards. |
| B13-REQ-02 | R-140 | A fixture change with two dependent edits where the second cannot apply after the first, and a change with same-`old`/different-`new` edits. Both cards are flagged. On apply, neither change writes anything and the report names the failing edit. A healthy change in the same run still applies. |
| B13-REQ-03 | R-09 | Build a page, accept L-01, rebuild from a journal where the sorted order changes. The new L-01 (a different change) is not shown as accepted, and the original change keeps its decision under its new id. `decisions.mjs` and `apply.mjs` name the mismatch and apply nothing for it. Repeat with pasted decision text and with a pre-phase decisions file (reported unverified). A question-fixup written for one build does not act on a different question after questions are added. |
| B13-REQ-04 | R-20 | Fixture journals: (i) a verifier with `verified: []` and one question, no consolidation; (ii) a consolidator that returned `null`; (iii) a consolidator that keeps a different group's question out. Every question appears on the page, marked unreviewed where applicable. An explicit dismissal with a reason is recorded in the run output. |
| B13-REQ-05 | R-21 | Fixture: a protected-artifact flag, a retired-diagram flag, a decision-blocked edit-less finding, and a genuine redraw on a live, unprotected diagram. Only the last shows "needs redrawing"; the others show "flag only". Counts report them separately. A pre-phase journal builds with the same classification. |
| B13-REQ-06 | R-144 | A fixture page with more than 99 small changes and a rulings file containing S-104. "clashes with an edit in S-104" (the change) jumps to the change card; the ruling S-104 opens the ruling. Two- and three-digit change ids are accepted by `decisions.mjs` and `apply.mjs`. |
| B13-REQ-07 | R-141, R-142 | (a) the prompt and skill texts show slug words with an example where title and slug differ. (b) after D-03, a parity check over every note in a fixture (or the live catalogue, read-only) shows ref-kit, build-packs and the board's resolver give the same note or all unresolved, including apostrophe, `&`, colon and non-ASCII cases. (c) "Notes <date>" with no words on a date with two notes is unresolved. (d) "Notes 2026-11-05 · Donald contract model decisions" with no points opens that note. (e) a shorthand line with `G1016` then `Bv1105` yields both entries with the right words. |
| B13-REQ-08 | R-143 | A fixture catalogue with a retired diagram and a diagram whose `file:` is `/`-rooted. No edits or redraws are proposed for the retired one (or it is absent, per B13-Q4). The other's pack holds its drawn text, and its verifier gets its real SVG path. |
| B13-REQ-09 | R-145 | The rulings prompt built with no `owner` contains a grammatical Conflicts heading; with `owner: "Donald"` it contains "Conflicts for Donald". `render-rulings.mjs` still recognises "Conflicts decided by ..." |
| B13-REQ-10 | R-147 | A stubbed stage-2 run with one group topic not in `topics`: the log and result name it, with the catch-all count. The consistency-review "This repo" groups parse and match its topics list (a mechanical check). |
| B13-REQ-11 | R-08 | A scratch catalogue: run 1's proposal applied, then the link removed by hand; run 2 over a different batch grouping. `links:apply` for run 2 does not restore run 1's link, and its report names run 2. Re-applying run 2 changes nothing. The pre-existing `.links/` files are not applied, and what was done with them is reported. |
| B13-REQ-12 | R-133 | Unit cases: two proposals for "price" occurrence 1 and 2 to different targets link the first and second mentions; overlapping anchors in one field give one link and one skip with a reason; a code span across a blank line does not hide a later occurrence. The existing linkProposals tests still pass (skip-reason wording updates allowed where the cause changed). |
| B13-REQ-13 | R-146 | A stubbed workflow run with `[["EP-06"]]`, `["EP-04","EP-06"]`, a mixed list and an invalid element: the first three run with the grouping logged, and the last returns an error before any agent call. |
| B13-REQ-14 | all | A reviewer reads each changed skill and doc passage against the new behaviour; no claim is untrue (Reviewer B checks this explicitly). |
| B13-REQ-15 | all | A pre-phase journal and `changes.json` fixture (two-digit ids, no action field, with `fixups.json` and `question-fixups.json`) builds and applies (dry run). `decisions.mjs` output keeps its sections. `links:apply -- <dir> --dry-run` works. `npm run verify:board` is green. |

**Prohibited regressions:** any write outside the catalogue folder; any edit applied without a matching
decision; a previously working journal, changes.json, decisions file or link run folder that no longer
builds, reports or applies; a ref code that resolved before and now does not.

**Criteria awaiting a decision:** B13-REQ-07b (D-03); the exact refusal set in B13-REQ-01 (B13-Q1);
handling of old `.links/` files in B13-REQ-11 (B13-Q2); stop-or-warn in B13-REQ-10 (B13-Q3); retired
diagram packing in B13-REQ-08 (B13-Q4); flat batch grouping in B13-REQ-13 (B13-Q5).

## Deferred decisions for execution planning

Register: [PROGRESS.md "Deferred decisions"](../../PROGRESS.md). B13 owns none of the programme-level
decisions. No accepted decision in PLAN or PROGRESS answers B13-Q1 to B13-Q5: all five remain open,
owned by B13 (with the user), and gated on B13's implementation plan.

| ID | Question / source gap | Affects | Owner | Dependents | Resolve before | Boundary / acceptance impact |
|---|---|---|---|---|---|---|
| D-03 (consumed) | How agent `.mjs` tools share `shared/*.ts` rules, including the note-cite resolution rule: direct import with Node type stripping, or mirrored copies with parity tests | B13-REQ-07b | B04 | B12, B13 | B04 build; B13-REQ-07b builds after B04 lands with D-03 recorded | How ref-kit and build-packs call B04's resolver, and its parity proof |
| B13-Q1 | Beyond outside-REQ and protected artifacts, should `apply.mjs` also refuse edits to `notes/`, `changes/`, `reference/`, question answers and retired items or artifacts, which the prompts already forbid (`consistency-changes.js:139`)? If so, with or without an explicit override for a hand fix? | B13-REQ-01 | B13 (user) | none | B13 implementation plan | Refusal set and its fixtures |
| B13-Q2 | What happens to existing `.links/` contents (14 verified files from 10 to 18 November) and to `links:apply` with no folder argument: apply the latest run, refuse and ask for one, or archive old files first? | B13-REQ-11, B13-REQ-14 | B13 (user) | B14 (README text) | B13 implementation plan | Command shape in update-requirements Stage 5 and README |
| B13-Q3 | Should a consolidation group topic that matches no rulings topic stop stage 2, or warn and continue? | B13-REQ-10 | B13 (user) | none | B13 implementation plan | Whether a mismatched run produces a page at all |
| B13-Q4 | Retired diagrams: leave them out of the packs entirely, or pack them marked "retired, flag only" so verifiers can flag live items that still lean on them? | B13-REQ-08, B13-REQ-05 | B13 (user) | none | B13 implementation plan | Pack contents and flag counts |
| B13-Q5 | A flat `batches` list: one batch per bare epic ID (FINDINGS' candidate), or the whole flat list as one batch (what "the touched epics" may mean in update-requirements Stage 5)? | B13-REQ-13 | B13 (user) | none | B13 implementation plan | Agent count and proposal file names per run |

## Risks and recovery requirements

- **Safety fixes must fail closed.** Path, protection, whole-change and decision checks refuse and
  report. They never fall back to writing. A fixture for each refusal is part of acceptance.
- **Over-strict decision matching.** Too strict a fingerprint discards valid decisions after harmless
  rebuilds; too loose re-creates R-09. The user must be able to see which decisions carried over and
  which need deciding again. Losing a decision is acceptable; applying the wrong one is not.
- **Journal and run-folder compatibility.** Old journals, changes.json, fixups and decisions files must
  keep working or be reported clearly (B13-REQ-15). The user's real run folder was not available to
  this author, so the execution agent builds pre-phase fixtures from the current scripts' output
  shapes.
- **Workflow resume.** Changing prompts or schemas invalidates resume of a stage-2 run in flight.
  Ship when no consistency review is mid-run, or note in the CHANGELOG that an in-flight run should
  re-run stage 2. Old journals must still build either way.
- **Live linking.** update-requirements sessions may run `links:apply` during or after the phase. The
  command change and the skill text land in one commit. The old `.links/` files must not be applied
  by the first post-fix run (R-08's live failure).
- **Parity drift (R-141).** If D-03 chooses mirrored copies, B04's parity proof must fail when the
  board's rule changes, and B13's tools must use the copy that proof covers. B13-REQ-07b builds only
  after B04 lands, so it runs against B04's final rule (including its R-77, R-81 and R-83 changes).
- **Recovery.** Every change is in tracked files; a revert restores the previous tools. No catalogue
  data is migrated by this phase.

## Execution and handoff obligations

1. Read root `CLAUDE.md`, `PROGRESS.md` in full, the 14 FINDINGS sections, this spec, and the owned
   code. Re-verify the evidence table at the then-current HEAD (B04 or B12 may have landed). Record
   any finding that no longer reproduces as **Not reproducible at HEAD**, with evidence.
2. Check PROGRESS for an accepted D-03 answer and a landed B04. Without both, plan B13-REQ-07b as
   blocked and build the rest. Work in B13's own worktree with its own ports (convention 10).
3. Resolve B13-Q1 to B13-Q5 with the user in the implementation-planning conversation. Record the
   answers in PROGRESS "Accepted decisions" before building the affected requirements.
4. Write `phases/B13-consistency-and-linking-tools/IMPLEMENTATION.md` before building: resolved
   questions, chosen approach per requirement, fixtures, execution bites, checks, risks and recovery.
5. Build in small bites. Stage nothing mid-phase (use `mv`/`rm`, not `git mv`/`git rm`). Never run
   `apply.mjs` or `links:apply` for real against the live catalogue. Show each regression proof
   failing on the starting code before the fix, then passing (convention 13). Put new agent-tool
   tests where B12's glob finds them (every `*.test.mjs` under `requirements-board/agent/`).
6. Finish green: `npm run verify:board` from the repo root, plus every agent `node --test` suite
   (part of `verify:board` once B12 has landed; run them by hand until then, convention 6). At merge
   time, take the board version as `board-fixes`' current version plus a minor bump. Put the
   `CHANGELOG.md` entry above the newest one, and regenerate the lock file with `npm install` in the
   board folder (convention 14). The entry names the user- and agent-visible changes: decision
   checks, path refusals, whole-change apply, flag-only marking, link run scoping, accepted batch
   shapes.
7. Run the three review lenses in parallel (quality, completeness against this spec, correctness),
   plus a security-minded pass on B13-REQ-01 and B13-REQ-03. Verify each finding, fix confirmed
   ones, and re-run verification.
8. Give every owned finding exactly one disposition: **Fixed** (with its proof), **Not reproducible at
   HEAD** (evidence), **Won't fix** (user accepted, reason) or **Moved** (named owner, recorded in
   PROGRESS and both specs).
9. Write the PROGRESS phase entry last: what shipped, dispositions, decisions, deviations, proofs
   (with their fail-before evidence), review results, minimal edits made in other phases' files
   (convention 11), every doc line changed listed under "Doc facts" (convention 12), and handoffs
   for B14 (changed commands for the R-31 sweep and the docs pass), B05 (`apply-links` tests) and
   later work (masking duplicate if B04's helper was not yet available). Commit by path on `board-fixes-b13`
   (`B13 complete: ...`), then fast-forward `board-fixes` (convention 16, steps 3 to 5). Never push.
