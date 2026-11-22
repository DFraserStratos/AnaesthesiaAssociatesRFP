# B05 · Server write model: implementation plan

## Context

Board-fixes Buildbook, phase B05 (serial order: B01 to B04 and B08 are COMPLETE). The board server rebuilds
whole files from a parsed model on every save, so anything the model does not hold is lost (R-37: an
artifact rename drops a `cited_as` mapping, Source prose and unknown keys, and writes `pad: wide` as `.nan`).
Stale writes overwrite concurrent disk changes. Multi-file changes can land half done (R-56: a lane rename
renames the stories, then the lane-list save fails). Every record in a batch re-runs the full check (R-26).
Lane rules refuse drags they did not cause (R-55). Creates need hard links (R-64). `artifact:new` moves
files before claiming its ID and stages them (R-67). A reused ID inherits the deleted card's history (R-54).
B05 fixes all seven, builds the server halves of R-45 and R-111 for B06, and records the write protocol
that B07 and B06 build on.

All work happens in the worktree `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-board`
on branch `board-fixes` (entered with EnterWorktree `path`). It is at `429b35ce` (B08) with a clean tree,
and master has nothing it lacks; recheck at start and `git merge master` if that has changed. The board is
1.17.0 and goes to **1.18.0**.

## Decisions (record as accepted decision 20, before building)

- **D-05: already accepted** (decision 19, B08 session: reuse stays; restore continues; journal cut only at
  a committed deletion). Not reopened. No deleted-ID list, so no seeding and no migration.
- **D-04a, stale writes merge when nothing overlaps** (user). A write carries `patch` (the changed fields),
  `baseRev`, and optionally `base` (each patched field's value as the client started from it). If the disk
  rev equals `baseRev`, the patch applies. Otherwise, with `base`, each patched field's disk value is
  compared with its base value: none changed means the patch merges onto the disk version; any changed
  means 409 naming them. Without `base` the check stays strict (today's batch rule). "Keep mine" resends
  the same patch on the current rev.
- **D-04b, conflict body** keeps `{ error, current }` and adds `collisions?: string[]` and, for
  multi-record writes, `blocked: [{ id, current, collisions? }]` listing every blocker (`current` = the
  first blocker, so today's store rollback still works). The status codes keep their meanings
  (400/404/409/422/503).
- **D-04c, in place for items and questions too** (user). Every save to an existing file changes only the
  changed fields' lines. Creates stay canonical. A change that cannot be written losslessly is refused
  with 422 and the file is left untouched.
- **D-04d, config bases per section.** `config.revs` holds `{ project, components, statuses,
  questionStatuses }` (the revs of the raw on-disk JSON of each section). They are derived and never
  written, and they reach the client in the snapshot and in config events. `PUT /api/config` takes an
  optional `bases`; a stale section gets 409 `{ error, section, current: { data, rev } }`. B02's 422
  guards run on the merged result.
- **D-04e, transition.** The legacy shapes (`{ record, baseRev }`, a base-less config write, a base-less
  `lanes`) stay accepted, at least as safe as today. A legacy whole record whose base matches is reduced
  to the fields that differ from disk, so REQ-05 and REQ-09 hold. Each legacy shape is retired by the
  phase that removes its last caller (B06 for record and config, B11 or B07 for `setLanes`), which
  records it.
- **D-04f, lanes.** A dedicated route, `POST /api/lanes { op: 'rename'|'remove', from, to?, lanesRev,
  stories: { [id]: rev } }`, all or nothing. A rename onto an existing lane is refused as a lane-rule
  breach (B11 later adds the merge).
- **B05-Q5, lane lists carry a base** (user). `layout.lanesRev` is derived (never written). The lane
  route requires it, and a layout write that sends `lanes` or `firstLane` may send it. Position patches
  never carry a precondition.
- **B05-Q6, `artifact:new` never stages** (kick-off prompt, convention 9). It moves with a plain,
  non-overwriting rename (git sees the move unstaged; B08 follows unchanged moves) and prints a note.
- **R-54 bare mentions: keep and document** (user). README says it now; the SCHEMA line goes to B14 under
  Doc facts.
- **R-54 history rule** (from decision 19 and the B08 contract):
  1. A board create at an ID with a leftover journal sets that journal aside first (a create is never a
     restore).
  2. `created` journal entries carry the record (`item`).
  3. A card that reappears in `syncFromDisk` as a *different* record gets a `created` entry. Old lines
     stay in the file (cut on read), so nothing is lost.
  4. `buildTimeline` cuts at the newest life start. That is either a committed `deleted` version whose
     two neighbours differ (a restore continues), or a journal `created` entry whose record differs from
     the newest git version before it (a legacy entry without `item` cuts only if its source is
     `board`). Git versions and journal lines before the cut are dropped.
  5. `buildArtifactTimeline` applies the deletion-bound cut the same way.
  - Residuals (recorded): an artifact or card re-created by hand at a freed ID with no commit in between,
    and `-M`-paired cards, get no cut.
- **Discovered item taken in:** `guard()` backstops a throwing check (B03 found it; assigned to B05).

## Design (files)

- **New `shared/inPlace.ts`:** `editRecordText(kind, text, next)`.
  - Frontmatter splice by yaml 2.9.1 `parseDocument` node ranges: replace a changed key's span, insert a
    new key after its nearest preceding canonical key, delete a removed key's lines. Changed values are
    written in canonical style; a flow sequence stays flow.
  - Body splice by section: item lead plus Acceptance, Technical and Notes in any order; question lead
    plus Answer; artifact lead only, with `## Source` never touched. Add or remove a section at its
    canonical place.
  - CRLF files are edited as LF and written back as CRLF; mixed line endings, anchors and aliases, or a
    flow-mapping frontmatter fall back as below. The BOM is kept by `writeAtomic`.
  - **Safety net:** reparse the result, which must equal the intended record, with every untouched key's
    raw value unchanged. Failing that, use the canonical form only if it is lossless (no unknown data
    dropped), else throw `LossyEditError`, which the routes return as a 422 naming what would be lost.
- **New `shared/patch.ts`:** the patchable fields per kind (item: title, status, components, sources,
  order, swimlane, related, artifacts, images, parent, description, acceptance, technical, notes,
  per-key `extra`; question; artifact = `ARTIFACT_EDITABLE`), `applyPatch`, `changedFields(disk, next)`,
  `collisions(disk, base, patch)` (deep equality on normalised values).
- **`server/catalogueFs.ts`:**
  - `writeItem`, `writeQuestion` and `writeArtifact` edit an existing readable file in place (canonical
    on create or on an unreadable file), so `apply-links` and `capture` benefit unchanged.
  - `createAtomic` falls back when `link` fails with EPERM/ENOTSUP/EXDEV/ENOSYS: it claims an empty file
    with `wx`, then renames the temp file over it. The temp file is always removed. The gap (a moment of
    empty file; a crash leaves an empty file that the check reports) is recorded in IMPLEMENTATION.md.
    `claimNext(taken, next, write, attempts)` is shared by the API and `artifact:new`.
  - `readLayout` reports dropped lanes and adds `lanesRev`; `serialiseLayout` never writes it.
- **`shared/config.ts`:** `revs` in `parseConfig`.
- **`shared/move.ts`:** `laneListProblems` (all problems; `laneListProblem` stays as the first).
- **`shared/check.ts`:** reports lane-list problems (input gains `firstLane`) as errors, with the same
  rule implementation.
- **`server/catalogueApi.ts`:**
  - The patch routes plus the legacy reduction, batch blockers, the no-op answer (no write, no journal,
    no event; the current rev is returned) and the config bases.
  - Lane route and layout PUT: lane validation only when `lanes` or `firstLane` change, refusing only
    *new* problems.
  - Per-request notifier: writes collect their item events, and the request emits them, then one check
    (`refreshIssues`) and one `issues` event, including the adoptions in `itemOnDisk`.
  - `writeAll` with put-back on failure (batch, delete with removed files restored, lanes), guard
    backstop, journal step, route comment.
- **`server/historyJournal.ts`** (`item` on `created`, `fresh` option), **`shared/history.ts`** (cut
  rules).
- **`src/api.ts`:** `patchItem`, `patchQuestion`, `patchArtifact`, `changeLane`, `putConfig(patch,
  bases?)`, `putLayout(..., lanesRev?)`; `ApiError` gains `collisions` and `blocked`. Old functions stay.
- **`src/store.ts`:** `renameLane` and `deleteLane` (named lanes) send one `changeLane`. On success they
  apply the records and layout from the response; on refusal nothing changes and `moveError` says why.
  The first-lane rename stays layout-only. Lane changes stay outside undo.
- **`scripts/new-artifact.ts`:** claim loop first, then the exclusive copy (`COPYFILE_EXCL`) or the
  non-overwriting move (link plus unlink, falling back to an exclusive copy plus unlink), with no
  `git mv`. If that step fails, the sidecar is removed and the original stays in place. CLI and output
  stay compatible.
- **Touch rights (named in the entry):** `src/store.ts` (lanes only), `server/historyJournal.ts`,
  `syncFromDisk`, `shared/history.ts`, `shared/check.ts`, `scripts/new-artifact.ts`, `shared/config.ts`,
  `shared/move.ts`, `docs/board-fixes/index.html`.

## Bites (each keeps the current client working; tests first, each shown failing on the old code)

0. Enter the worktree and do the merge check. Reverify each SPEC evidence row at HEAD. Record decision 20
   (Accepted decisions, D-04 row, status row), then save `phases/B05-server-write-model/IMPLEMENTATION.md`.
1. In-place editor plus writers (R-37, REQ-09 to 11) and the lint wording (`cited_as` "ignored", image
   keys, `order`).
2. Patch protocol on every record route, conflicts, no-op, legacy reduction (REQ-01 to 05, 08).
3. Notifier and guard backstop (R-26, REQ-14).
4. `writeAll` and put-back; lane route plus `lanesRev`; store lanes (R-56, REQ-12, 13, Q5).
5. Lane rule (R-55, REQ-15, 16), SCHEMA's 40 characters.
6. Config section bases (R-45 server half, REQ-06).
7. `createAtomic` fallback and `claimNext`; `artifact:new` (R-64, R-67, REQ-17 to 19).
8. History cut and journal steps (R-54, REQ-20).
9. Docs, version 1.18.0, CHANGELOG; full verification; review; PROGRESS entry; plan page; commit.

## Proofs (new: `tests/writeModel.test.ts`, `tests/inPlace.test.ts`, `tests/inPlaceReal.test.ts`, store and journal additions)

- **R-37:** sidecar fixture (mapping `cited_as`, mistyped key, unknown region, step and move keys, a
  non-mapping row, `pad: wide`, comments, prose plus fences in Source): a title save changes only that
  line. A lossy case gets 422 with the file untouched.
- **Real round trip:** in a scratch copy, change each editable field of **every** story, question and
  sidecar. Only the changed field's lines differ, and on canonical files the output equals
  `serialise(next)` byte for byte. The same holds with BOM and CRLF variants.
- **R-26:** a batch of k and a delete with rewrites give one `issues` event and one post-write check,
  whatever k (spy count). Time a 40-story rename before and after.
- **R-55:** a 46-character lane, a case duplicate or an `Unassigned` clash: a positions-only write
  succeeds; the check reports it; a lane write that fixes it or leaves it no worse succeeds, and one that
  adds a problem is refused.
- **R-56, server:** an unreadable layout, a refused name, one stale story, or a stale `lanesRev` changes
  no file (byte-identical); a good rename changes the list and every story; an injected write failure
  part way restores the files. **Store:** one request; a refusal leaves stories, lanes and disk
  unchanged with `moveError`; success applies the response.
- **R-64:** with link forced to fail (EPERM, ENOTSUP, EXDEV), create succeeds, refuses an existing
  target and leaves no temp file; two creators end with two IDs. Plus a manual create on a real exFAT
  image (`hdiutil create -fs ExFAT`, attach, create, detach).
- **R-67:** the script under an `--import` preload that hides one sidecar (a stale snapshot) ends on the
  next ID with its own file. A failed file step leaves no sidecar, nothing moved or staged (`git status`
  index unchanged) and the original in place. A drawing copy never overwrites.
- **R-54:**
  - board delete, then create: History shows only the new card, from the journal and from git.
  - hand delete, then commit, then create: cut at B08's bound.
  - commit, board delete, create the reused ID, commit: the new card only (fails today).
  - delete then restore: history continues.
  - allocators agree (API and script).
  - keep `historyJournal.test.ts:173`.
- **R-45 and R-111, server halves:** two writes to one config section from one base: the second gets a
  409 with the current section; another section succeeds; B02's 422s still fire. An unchanged save, an
  empty patch and an identical whole record leave the file, journal and events untouched.
- **Protocol:** a description patch after concurrent parent, order, swimlane, artifacts and unknown-key
  changes on disk keeps both; an overlap gives 409 with current, collisions and rev; Keep mine keeps the
  concurrent change; a multi-record conflict names every blocker; a second patch on the returned rev
  succeeds. REQ-07: the same position patch twice gives an identical file; a refused patch retried
  succeeds.
- **Before-proofs:** run the new tests against `git archive 429b35ce` of the board in the scratchpad; the
  expected failures are recorded, and the passes are only preservation checks.

## Verification

- `npm run verify:board` from the repo root (typecheck, Vitest, check) green. Real catalogue
  `npm run check` output byte-identical before and after; no file under `requirements/` changes except
  SCHEMA.md (doc lines).
- Playwright: `board-mapped.spec.ts` (lane rename), `item-delete.spec.ts`, `settings.spec.ts` and
  `artifacts.spec.ts` on the fixture board (5182, or another free port; never 5173, 5174, 5180 or 5181),
  then the full fixture suite.
- B13's merged `apply-links` tests (if present), the capture tests and the agent `node --test` suites if
  `agent/` is touched (it should not be).

## Review, record, commit

- Light review (convention 15): two fresh Sonnet reviewers in parallel, given the SPEC, the owned
  findings and the diff. Reviewer 1 checks completeness against every finding and acceptance row, plus
  bugs. Reviewer 2 checks quality plus **data integrity** (in-place lossless writes, put-back, journal
  cuts). I verify each claim myself, fix what is confirmed with regression tests, and rerun.
- **Doc facts:**
  - the route comment in `catalogueApi.ts`.
  - README "How it works" (saves, conflicts, creates, artifact details, lanes, delete, ID reuse and bare
    mentions) and the server map.
  - SCHEMA's `lanes` (40 characters) and its `cited_as` "board keeps it" line.
  - the add-artifact SKILL.md `git mv` line, if present.
  - the About page, if it says any of this.
  - the CHANGELOG 1.18.0 entry.
  - SCHEMA's ID-reuse wording is handed to B14.
- **PROGRESS.md last:**
  - the phase entry: dispositions for R-26, R-37, R-54, R-55, R-56, R-64, R-67, with the R-45 and R-111
    server halves delivered.
  - the **write protocol contract** for B07 and B06 (outputs 1 to 9).
  - the tests that changed on purpose, touch-rights edits, deviations, verification and review.
  - the status row; Discovered items.
- Then the PHASE STATUS block in `docs/board-fixes/index.html` (B05 COMPLETE, date, one line; next phase
  B07). Commit only B05's files, staged by path, on `board-fixes`; never push.

## As built (differences from the plan above)

- **Shared pieces.** `shared/files.ts` now exports each kind's frontmatter builder (`itemMeta`,
  `questionMeta`, `artifactMeta`) and `YAML_OPTIONS`, so the in-place editor writes a changed key exactly
  as `serialise*` would. `shared/move.ts` gained `laneListProblems`, `addedProblems` and `lanesRevOf`;
  `shared/config.ts` `CONFIG_SECTIONS`, `configRevs` and `BoardConfig.revs`; `Layout.lanesRev` is optional
  and never written (`serialiseLayout` lists its fields).
- **The in-place editor** splices by line spans from yaml's node ranges. A one-line value keeps a comment
  after it on the same line. A flow list stays flow only when it held items (the board writes every
  empty list as `[]`). The read-back check compares the parsed result with `parse(serialise(next))` and
  every untouched raw key with its old value; failing that, the canonical form is used only when the
  same raw-key comparison passes (and, for an artifact, the `## Source` block is unchanged), else
  `LossyEditError` names the keys.
- **`writeItem` / `writeQuestion` / `writeArtifact`** edit in place for every caller (API, `apply-links`,
  `capture`); `capture` now decides "changed" from the returned rev (a touch in B12/B14's file).
- **Creates** go through `claimNext` (API and `artifact:new`); `createAtomic` takes an injectable `link`.
- **Per-request notifier** (`pending` in `createCatalogueApi`): record events wait, the issues are
  checked once and sent once at the end, even after a refusal (adoptions still go out). `guard` first
  refreshes issues stale from adoptions in the same request. `syncFromDisk` routes its events through
  the same notifier when a request calls it (delete, lanes).
- **The lane route re-reads the folder first** (as delete does). Measured on 400 synthetic cards, a
  40-story rename: before (batch then layout, two requests) 58 ms and 82 events; the batch path now
  46 ms and 43 events; the lane route 117 ms and 42 events, the extra being that one folder load.
- **History cut** is `currentLife` in `shared/history.ts`, used by `buildTimeline` and
  `buildArtifactTimeline` (an artifact file's own deletion bound through `assetLife`). Per-file
  screenshot bounds within one card's life (`screenshotsEnded`) are not cut: a screenshot deleted and
  re-added under the same card is the same card's history (B09 may draw it).
- **Store**: `renameLane` and `deleteLane` call a new `changeLane` action (one request, no optimistic
  change, newer copies of blocking stories adopted). `lanesRev` is carried through the start-up load,
  layout events, `setLanes` and the first-lane rename, so a stale copy never blocks the next lane change.

## Recovery

- All changes are board code, tests and docs; reverting the B05 commit restores the old behaviour. No
  catalogue data was migrated; no file under `requirements/` changed but SCHEMA.md (doc lines).
- A crash between `createAtomic`'s exclusive claim and its rename (filesystems without hard links only)
  leaves an empty record file: `npm run check` reports it ("could not be read"); delete it.
- A write of several files that fails part way puts back what it wrote; if a put-back itself fails, the
  500 names the files that may hold part of the change: restore them from git or the journal.
- A journal set aside by mistake (a board create at an ID with a leftover journal) is in
  `.history/deleted/`, renamed with a timestamp; move it back by hand.

## Handoff

The write protocol contract for B07 and B06 is in the B05 entry of PROGRESS.md and at the top of
`server/catalogueApi.ts`.

## After the review

- The in-place yardstick takes the body as `next` holds it (a body the canonical form would read
  differently stays as written); the read-back requires the result to parse as intended; the canonical
  fallback may add default keys but never change or drop one. An empty value ends at its colon, so a
  comment after it survives a new value.
- `writeAll` runs every step's dry run (`check`) before writing any file, reads only ENOENT as "no file",
  and puts back a step that wrote and then failed.
- `syncFromDisk` passes `reappeared` only when the file was missing, not unreadable, in the previous load.
- `currentLife` and `buildTimeline` compare commit times to the second.
- `artifact:new` takes the next ID when a drawing's `AR-nn.<ext>` already exists, and removes its own copy
  after a late failure.
- `sameValue` (`shared/patch.ts`) is the one JSON equality for B05's code.
