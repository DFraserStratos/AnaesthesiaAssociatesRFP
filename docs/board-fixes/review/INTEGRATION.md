# Board fixes: integration review

## Recheck (2026-11-18)

I re-read PLAN.md and PROGRESS.md (accepted decisions 1 to 12, conventions 1 to 14, planning-only
gates, version-at-merge rule, the split-delivery note, the new shared-files rows) and all 15 specs as
corrected.

**Counts.** Original findings INT-01 to INT-28: **28 Resolved**, 0 partly resolved, 0 not resolved.
New findings introduced or exposed by the corrections: **4** (INT-29 should-fix; INT-30, INT-31,
INT-32 minor). Nothing is blocking. The original findings below are kept as written, for the record.
All four new findings were then applied and verified (see "Final recheck" below): 32 of 32 resolved.

### Dispositions of INT-01 to INT-28

| ID | Disposition | Evidence |
|---|---|---|
| INT-01 | Resolved | B07 owns D-10 (Owns, B07-REQ-08, owned-decision section, D-10 proof row); B09-REQ-13 consumes it with B09-Q1 answered and B07 a hard dependency; B10-Q1 answered, B10 depends on B07 (D-10); B01 P-05 accepts the token. |
| INT-02 | Resolved | B08 Owns the deletion bound (B08-REQ-11, R-54 support proof row, B08-Q4 answered, Unblocks B05); B05 depends on B08 (hard), B05-Q1 answered, REQ-20 applies B08's bound; B09 R-54 row updated. |
| INT-03 | Resolved | PLAN D-05 row "B08 build (planning-only gate)" and "Planning-only gates"; PROGRESS B08 gate and accepted decision 8; B08 Depends on and B05 gates and execution step 2. |
| INT-04 | Resolved | B12 lists R-07 (plan-tool half, B12 closes), B12-REQ-14 and proof row 14; B02-REQ-05 limited to the board, B02-Q2 answered, "To B12" names the rule. |
| INT-05 | Resolved | B05 Owns and B05-REQ-13 switch the store's `renameLane`/`deleteLane`, R-56 proof row covers the store path; B07 Excludes lane work. |
| INT-06 | Resolved | B10-REQ-11 (HistoryView `Shot` label) with its proof row and disposition duty; B09 Excludes it to B10; PLAN `HistoryView.tsx` row. |
| INT-07 | Resolved | B02-REQ-07 and A-2 proof; B12-REQ-15 and proof row 15 (A-4, A-10), B12-Q5 answered; B15-REQ-10/11 confirm owners' verdicts, B15-Q1 answered. |
| INT-08 | Resolved | B03 Owns Freeform cycle placement and cycle naming; B03-REQ-02.4 and .5; R-10 proof row covers both; B03-Q1, Q6 answered; collisions resolved by the table. |
| INT-09 | Resolved | PLAN B02/B14 territory reworded; every spec's obligations list doc lines under "Doc facts"; B01-Q4, B04-Q4 answered; B14 reads "Doc facts". |
| INT-10 | Resolved | PLAN split-delivery note (R-01, R-07, R-45, R-54, R-56, R-68, R-111, R-119); accepted decision 7; B02, B05, B06 headers; B15-REQ-02 handles split closes. See INT-31 for a residual table count. |
| INT-11 | Resolved | PLAN D-03 row and planning-only gate; PROGRESS B04 and B12 notes; B12 Depends on (conditional on D-02's rule). |
| INT-12 | Resolved | Convention 14 and PLAN "Version numbers in worktree phases"; B12 and B13 binding constraints; B15-REQ-25 checks merge-order versions. |
| INT-13 | Resolved | Accepted decision 6 (every `*.test.mjs` under `agent/`); B12-REQ-16 with a fail-first proof; B13 obligations place tests where the glob finds them and run them until B12 lands. |
| INT-14 | Resolved | B10 Depends on, Consumed and REQ-10 name D-01c and B01-Q2; PROGRESS B10 gate. |
| INT-15 | Resolved | B05 Excludes the merge form; B11-REQ-07 extends B05's lane route under touch rights (accepted decision 7); PLAN `catalogueApi.ts` row lists B11. |
| INT-16 | Resolved | B07 preserved behaviour and REQ-06.5/REQ-07 carry config base tokens, damage state and the R-54 journal step; B11 Depends on and preserved list keep B07's node identity reuse. |
| INT-17 | Resolved | B06 Owns `nav.ts`, the details form and save actions; B07 a hard dependency; B06-Q1, Q6 answered; B06-Q4 partly answered (B06 adds the signal itself). See INT-30. |
| INT-18 | Resolved | B12 Owns `capture.ts` R-139 fix, deny terms and starter placeholders, the `verify` script; Depends on B02; B12-Q1, Q2, Q4 answered. |
| INT-19 | Resolved | B04-REQ-09.2/09.3 commit the whole note-cite resolver with parity proof; B13-REQ-07(b) uses it; PLAN D-03 row covers it. |
| INT-20 | Resolved | B14: B14-Q1 answered in part, Depends on B11, `link-index.ts` and `deny.txt` notes, B14-REQ-14 (B05-Q6 handoff), R-127 corrected. |
| INT-21 | Resolved | B15 uses D-01 to D-10 throughout; B15-Q6 answered; PLAN.md and index.html take closing-status edits only. |
| INT-22 | Resolved | Answered questions marked in place in every spec (B11 states none of its own is answered, which is correct); accepted decision 10 lists them. |
| INT-23 | Resolved | Every spec cites conventions 1 to 14. |
| INT-24 | Resolved | No "Wave 1", "parallel-safe", "recommended first" or "no producing phase" text remains; headers use PLAN's Depends on and the serial order. |
| INT-25 | Resolved | PLAN rows added for `ProblemPill.tsx`, `HistoryView.tsx`, `link-index.ts`, `shared/config.ts`, B07 on `catalogueFs.ts`, B08 and B11 on `catalogueApi.ts`. See INT-29 for two rows still missing. |
| INT-26 | Resolved | PROGRESS notes: B02 "can plan now", B04 and B08 early gates, B10 gate with D-01c, B01-Q2 and D-10. |
| INT-27 | Resolved | B03 Owns `ProblemPill.tsx` and hands an issue-surface contract to later phases. |
| INT-28 | Resolved | B05 Owns the `src/api.ts` transport; Unblocks keeps B13's merged `apply-links` tests green. |

### Final recheck of INT-29 to INT-32 (2026-11-18)

**Counts.** INT-29 to INT-32: **4 Resolved**. No new integration issue. Programme total: 32 findings,
32 resolved, none open.

| ID | Disposition | Evidence |
|---|---|---|
| INT-29 | Resolved | B03:306 keeps B02's R-46 no-prune rule in the view-preferences reader, and :69, :382-383 hand the rule to B09, B10 and B11; B10:68, :319, :410, :488 read the prefs through B03-REQ-06.2; B11:197, :214, :272, :318 build collapsed lanes and the Outline collapse set on it; PLAN `src/store.ts` and `src/artifactIndex.ts` rows list "B03 (shared browser-storage reader)". |
| INT-30 | Resolved | B06:288-293 and :358: the signal travels on the snapshot and on B07's config delivery, and B06 makes the minimal shape edit after B07 under touch rights. |
| INT-31 | Resolved | PLAN B06 row: "closes R-01 (lock-out UI; B02 owns the board half)". The B02 row still reads plain "R-01" and the B05 row does not mark the R-45/R-111 server halves. That wording is cosmetic: the split-delivery note and B15-REQ-02 cover it. |
| INT-32 | Resolved | B07:441-445 (D-10): the token goes in the query string that B01 P-05 preserves. Any other placement needs a minimal B01 guard edit under touch rights, with B01's proofs re-run. |

### New findings from the recheck

#### INT-29 · Should-fix · B03's shared browser-storage rule has consumers that do not know about it

- **Phases / sections:** B03 (Owns "one shared rule for reading JSON from browser storage";
  B03-REQ-06; R-51 proof row; "Files outside B03's own territory"); B10 (B10-REQ-08.3, R-106 prefs
  "dropped on read"); B11 (B11-REQ-08 collapsed-lane state, B11-Q4 pruning; Outline collapse set);
  B02 (R-46 status-filter persistence in `src/store.ts`); PLAN shared-files rows for `src/store.ts`
  and `src/artifactIndex.ts`.
- **Issue.** Answering B03-Q5 (accepted decision 10) made B03 put one shape-checking reader under
  every browser JSON store: view preferences in `src/store.ts` (where B02's status-filter rule and
  B11's `collapsedLanes` live), artifact preferences in `src/artifactIndex.ts` (B10's filter prefs),
  the board viewport in `BoardView.tsx` and the Outline collapse set (B11). B03 says "B10 ... puts its
  filter preferences on the shared storage reading rule". But B10, B11 and B02 never mention the rule
  (`grep -i "storage" phases/B10*/SPEC.md phases/B11*/SPEC.md` finds nothing relevant). B10-REQ-08.3
  still offers to drop unknown kinds "on read" in its own code. PLAN's `src/store.ts` row lists B03
  only for `descendantsOf`, and the `src/artifactIndex.ts` row lists B04 and B10, not B03.
- **Consequence.** B10 and B11 may write their own pruning or reading next to B03's, which brings
  back the systemic issue 4 pattern (one rule coded twice) inside the programme. B03's edit to
  `src/store.ts` view preferences must also keep B02's R-46 rule (do not prune while a list is
  damaged), and nothing states that handoff.
- **Owner of fix:** B10 and B11 authors; B03 author for the B02 handoff; orchestrator for the rows.
- **Correction.** B10: REQ-08.3's read-time handling of saved prefs uses B03's storage reading rule,
  and Depends on (B03) names it. B11: REQ-08 and B11-Q4 build collapsed-lane and Outline collapse
  state on B03's rule. B03: preserved behaviour includes B02's R-46 pruning rule in the view
  preferences reader. PLAN: add "B03 (storage reader)" to the `src/store.ts` and
  `src/artifactIndex.ts` rows, between the existing entries in serial order.

#### INT-30 · Minor · B06-Q4's per-field signal has no stated path to the client

- **Phases / sections:** B06 (Owns, B06-Q4, added-scope note); PLAN B06 territory and
  `shared/config.ts` row; B07 (event shape and snapshot, built before B06).
- **Issue.** If the user accepts B06-Q4, B06 adds a per-field damage signal for `components` and
  `project` in `shared/config.ts`. The client reads damage state from the snapshot and the config
  delivery, which B07 owns and which B07 builds before B06 (B07 carries only B02's per-list status
  damage state). B06 names only `shared/config.ts`.
- **Consequence.** The signal is either computed client-side from data the server has already
  normalised away, which B06-REQ-12 forbids ("must not infer damage on its own"), or B06 edits the
  snapshot and delivery shape without saying so.
- **Owner:** B06 author.
- **Correction.** In B06's added scope, state that the signal travels on the snapshot and B07's
  config delivery beside B02's status damage state, and that B06 makes that minimal edit under touch
  rights. Add `src/store.ts`/event-shape files to the touch-rights list it names in its entry.

#### INT-31 · Minor · PLAN's phase table does not reflect the R-01 split

- **Phases / sections:** PLAN.md phase table (B02 and B06 rows); B06 Requirements ("16 findings
  closed by B06").
- **Issue.** The split-delivery note says B06 closes R-01, and B06's spec counts 16 findings. The B06
  row still lists 15 findings without R-01, and the B02 row lists R-01 without "(board and server
  half)". The B12 row already marks its R-07 share ("15, R-07 shared with B02").
- **Consequence.** B15-REQ-02's mechanical check, run against the phase table, reports R-01 as
  closed by a phase that is not its listed owner unless it reads the note.
- **Owner:** orchestrator.
- **Correction.** B02 row: "R-01 (board and server half)". B06 row: "plus R-01 (closes; board half
  B02), 16". Consider the same marking for R-45/R-111 (B05 server halves) in the B05 row.

#### INT-32 · Minor · B01 fixes the D-10 URL form before D-10 is decided

- **Phases / sections:** B01 (Unblocks B07 line 58-59, P-05); B07 (B07-REQ-08.4, D-10 "Token form,
  also open").
- **Issue.** B01 builds first and promises to preserve "query-string tokens on asset URLs". D-10,
  decided later in B07's planning, leaves the URL placement open: it requires only that "the token
  can be placed in an asset URL that B01's guarded `/requirements/` route accepts".
- **Consequence.** If B07 picks a path-segment token, B01's guard refuses or misroutes it and B07
  must change B01's guard, which B07's spec does not foresee.
- **Owner:** B07 author (or B01 author).
- **Correction.** In D-10, record that the token goes in the query string (the form B01 preserves),
  or say that any other form needs a minimal guard edit under touch rights with B01's PR-04 and PR-05
  proofs re-run.

---

## Original review

Fresh, independent integration review of the Buildbook (`docs/BUILD-BOOK.md` Step 5), 2026-11-18.

**Read in full:** `docs/BUILD-BOOK.md` Sections 1 to 4; `docs/board-fixes/PLAN.md`;
`docs/board-fixes/PROGRESS.md`; all 15 `docs/board-fixes/phases/*/SPEC.md`. FINDINGS.md and code were
consulted only to settle claims. Fidelity to FINDINGS is the other reviewer's lens and is not repeated.

**Authority used.** PLAN.md and the PROGRESS.md "Accepted decisions" (dated 2026-11-18, made after the
specs) are authoritative for structure (BUILD-BOOK Section 3, order item 2). Where a spec lags them,
the finding names the spec text that must be aligned. Paths below are relative to `docs/board-fixes/`
unless they start with `requirements-board/`.

**Summary.** 5 blocking, 17 should-fix, 6 minor. The seven outcomes are covered by the phase set and
the serial order is feasible, but four accepted re-homings (R-54's history cut to B08, R-07's plan-tool
half to B12, D-10 to B07, A-2/A-4/A-10 adjudication) have not reached the specs, so as written two
deliverables have no building owner, one is claimed by the wrong phase, and one dependency runs
backwards. Every spec needs at least a small alignment pass; B05, B07, B08, B09, B10 and B12 need
substantive ones.

---

## Blocking

### INT-01 · D-10 (asset version and change signal) has no owner in any spec; B09 claims to produce it

- **Phases / sections:** B07 (Owns; Deferred decisions "Owned shared decisions: none"; Produces), B09
  (B09-REQ-13.3; Outputs; B09-Q1; Unblocks), B10 (B10-REQ-06; B10-Q1; Depends on).
- **Issue.** PLAN.md (B07 row, B07 territory, D-10 row) and PROGRESS accepted decision 5 give B07 the
  asset version and change signal that B09 (R-96) and B10 (R-104) consume. No spec mentions D-10
  (`grep -l D-10 phases/*/SPEC.md` finds nothing). `phases/B07-store-sync-and-layout/SPEC.md:344`
  says "Owned shared decisions: none" and has no requirement for the signal. `phases/B09-diff-and-history-ui/SPEC.md:354-355`
  says B09 owns the signal and B09-Q1 recommends "B09 produces it, B10 consumes it".
  `phases/B10-artifact-viewers/SPEC.md:409` (B10-Q1) still asks where the version comes from and
  offers to move it to B07.
- **Consequence.** B07 builds and closes without the signal; B09 then builds it in server and store
  files it does not own, after B07 has fixed the event shape, or B09 and B07 both build it. B10-REQ-06
  stays blocked on a question already answered. D-10's "resolve before B07 build" gate cannot be met
  because B07's planner has no requirement telling it D-10 exists.
- **Owner of fix:** B07 author (primary), B09 and B10 authors.
- **Correction.** B07: add D-10 to Owns and to "Deferred decisions" as owned (options: an assets event
  kind on the batched delivery, a per-asset fingerprint in the snapshot and events, an `mtime`/hash
  version in the asset list; plus the URL token form that B01's guard accepts); add a requirement
  (for example B07-REQ-08) stating the observable contract: a screenshot or asset rewritten on disk
  produces one signal per re-sync naming the cards or assets changed and a version token, carried on
  the B07 delivery, ignored safely by consumers that do not use it, and usable in an asset URL under
  B01's guard; add acceptance (rewrite one screenshot: one signal, correct card, new token; unchanged
  asset: token unchanged across events) and list B09 and B10 under Unblocks. B09: B09-REQ-13 consumes
  D-10 (remove "produces"), B09-Q1 marked answered (B07 produces), add B07 (D-10) as a hard dependency,
  drop "B10" from Unblocks. B10: B10-Q1 marked answered by D-10; B10-REQ-06 "blocked on D-10 recorded
  by B07"; add B07 (D-10) to Depends on.

### INT-02 · R-54's history cut: B08 excludes it, B05 assumes it runs first and owns it

- **Phases / sections:** B08 (Owns, Excludes, B08-REQ-03.2, B08-REQ-10.4, Produces for B05,
  Unblocks, B08-Q4, Risks), B05 (Depends on, Unblocks, B05-REQ-20, boundary flags, B05-Q1), B09
  (Depends on, Dependencies table).
- **Issue.** PLAN.md (B08 row "owns cutting history at a deletion"; B08 territory "cutting history at
  a rename or deletion bound"; build order "B08 moves ahead of B05 so that B05's ID-reuse fix can use
  B08's deletion bound") and PROGRESS accepted decision 4 ("R-54 ... history cut by B08's deletion
  bound (B05 closes)"). But `phases/B08-git-history-reader/SPEC.md:31-32` excludes the deletion cut
  ("R-54, B05"), `:163-164` says re-adding after deletion "is R-54 (B05), not this requirement",
  `:257-258` says "R-54 (B05) cuts history there; B08 must not drop or move it", and B08-Q4 is still
  open. `phases/B05-server-write-model/SPEC.md:57` lists B08 under **Unblocks** ("inherit the R-54
  history behaviour"), `:360-364` says "B08 is parallel-safe with B05 and in the serial order runs
  after it" and that B05 changes `gitHistory.ts` first, and B05-Q1 (`:458-461`) defaults to B05
  delivering in B08's files.
- **Consequence.** B08 builds (before B05) with no deletion bound; B05 then edits `gitHistory.ts`
  after B08 has finished, which is the collision the re-ordering was meant to remove, or nobody builds
  the git cut and R-54 cannot close. B05's dependency list omits its real producer.
- **Owner of fix:** B08 and B05 authors (B09 minor).
- **Correction.** B08: add to Owns "a deletion bound: the git history readers expose where a path's
  history ends at a deletion, so a later record at that path does not inherit it"; add a requirement
  (deletion bound beside B08-REQ-03's rename bound) with its fixture scenario (delete a card, commit,
  re-add a different card at the path: the reader marks the bound; restore-by-revert per D-05/B05-Q3);
  keep REQ-10.4 (the deletion version stays listed) and state how the bound is exposed to B05 as part
  of D-07 ("deletion and rename bounds" is already in PLAN's D-07 wording); mark B08-Q4 answered;
  Unblocks "B05 (deletion bound, D-07)". B05: Depends on "B08 (hard): the deletion bound and D-07";
  remove B08/B09 from Unblocks; rewrite the R-54 boundary flag and REQ-20 to "B05 applies B08's bound
  (journal step and timeline cut through B08's output); B05 closes R-54"; mark B05-Q1 answered. B09:
  the R-54 row reads "B05 applies B08's deletion bound in `buildTimeline`; B09 keeps it".

### INT-03 · D-05 is resolved too late for the phase that needs it first (B08), and so are B05-Q2/Q3

- **Phases / sections:** PLAN.md and PROGRESS.md D-05 row; B08 (Depends on); B05 (D-05, B05-Q2,
  B05-Q3).
- **Issue.** PLAN's D-05 row says "Waits on it: B08 (deletion bound use), B14" but "Resolve before:
  B05 build". B08 builds before B05 in the serial order. Whether a deletion bound is needed at all,
  and how it treats a restore (revert) versus a reuse and a branch switch that removes and restores
  files, are D-05, B05-Q2 and B05-Q3, all gated at B05 build. B08's spec has no D-05 gate
  (`phases/B08-git-history-reader/SPEC.md:39`: "no producing phase").
- **Consequence.** B08 must either guess the bound's semantics or wait; as planned, its gate passes
  without the answer, and B05 may later find B08's bound does not fit the chosen rule.
- **Owner of fix:** orchestrator (PLAN, PROGRESS), then B05 and B08 authors.
- **Correction.** Make D-05, B05-Q2 and B05-Q3 an early planning-only gate: "resolve in a B05
  planning conversation before B08 builds" (B05's planning can run before B08's build; BUILD-BOOK
  Step 2 allows an earlier planning-only decision gate). Update PLAN D-05 row "Resolve before: B08
  build", PROGRESS phase-status row for B08 ("D-05, B05-Q2/Q3 recorded"), B08 Depends on, and B05's
  D-05 and question gates.

### INT-04 · R-07's plan-tool half is owned by nobody in the specs

- **Phases / sections:** B12 (Requirements, Excludes, Depends on, acceptance table, collisions), B02
  (B02-REQ-05, Excludes, B02-Q2, Dependencies "To B12 and B15").
- **Issue.** PLAN.md (B02 row "R-07 (board half)", B12 row "R-07 (plan-tool half)", note under the
  phase table "B12 closes R-07") and PROGRESS accepted decision 4. `phases/B12-build-plan-tools/SPEC.md`
  does not list R-07 among its requirements, excludes it (`:25-26`, "Status registry and recode
  versioning (R-07, D-02): B02") and has no requirement or acceptance row for it. B02-REQ-05
  (`phases/B02-status-identity/SPEC.md:156-168`) still requires proof "in every listed consumer,
  including the plan tools' separate copy", with B02-Q2 open on whether to Move it.
- **Consequence.** B02 either builds into B12's territory (`scope.mjs` and callers) against the
  accepted decision, or leaves it for a B12 that does not know it owns it; R-07 cannot close.
- **Owner of fix:** B12 author (primary), B02 author.
- **Correction.** B12: add R-07 (plan-tool half) to Requirements; add a requirement that the plan
  tools' status normalisation (`scope.mjs` and its callers `req-changes.mjs`, `assemble-gaps.mjs`,
  `build-args.mjs`, `phase-context.mjs`) follows B02's accepted D-02 rule (version-scoped or
  no-overlap), with backward compatibility for `status-recodes.json` as B02-REQ-09 defines it; add an
  acceptance row (the R-07 overlapping-renumber scenario through each listed tool, or the no-overlap
  idempotence check if D-02b chose it; the 2026-10-20 entry reads as today); Depends on "B02 (status
  rule, D-02)"; state that B12 closes R-07 with B02's proof of the board half. B02: B02-REQ-05 limited
  to the shared rule, the diff and the history route; mark B02-Q2 answered (Moved half to B12 per
  accepted decision 4); "To B12" handoff names the exact rule B12 must apply.

### INT-05 · The client wiring of R-56 (store `renameLane`/`deleteLane` to the one-write lane request) has no owner

- **Phases / sections:** B05 (B05-REQ-13 last sentence; boundary flag on `src/api.ts`), B07 (Depends
  on; Excludes; Consumes).
- **Issue.** `phases/B05-server-write-model/SPEC.md:255-256`: "Wiring the store to this request, and
  whether a lane change enters undo, is B07", and `:375-376`: B05 "does not change any caller in
  `src/store.ts`". `phases/B07-store-sync-and-layout/SPEC.md:38-40` and `:298-299` say B07 consumes
  "R-56's single lane-rename write (in `store.ts`)" which B05 "edits". PLAN's shared-files row for
  `src/store.ts` lists "B05 (lane rename)", and touch rights say the owner of R-56 (B05) delivers the
  whole fix.
- **Consequence.** Each spec assumes the other wires the store; the server request ships unused and
  R-56's observable failure (half-applied rename from the board) persists. B11-REQ-07 also builds on
  the wired path and would find none.
- **Owner of fix:** B05 author (primary), B07 author.
- **Correction.** B05: B05-REQ-13 states B05 also switches the store's `renameLane` and `deleteLane`
  to the one-write request (minimal edit in `src/store.ts`, per the PLAN row and touch rights), and
  its R-56 acceptance includes the store path (a refused rename leaves stories and lanes unchanged in
  the store and on disk). Whether lane changes enter undo stays as today unless the B05 planner
  decides otherwise and records it. B07: Consumes "the store's lane rename and delete as B05 wired
  them"; no lane-rename work in B07.

---

## Should-fix

### INT-06 · B10 lacks the HistoryView screenshot failure label it was given

- **Phases / sections:** B10 (Requirements, Owns, detailed requirements, acceptance), B09 (collision 6).
- **Issue.** PLAN B10 row ("plus the HistoryView screenshot failure label") and territory ("the
  screenshot failure label in `HistoryView`"), PROGRESS accepted decision 5 and "Discovered for later".
  `phases/B10-artifact-viewers/SPEC.md` never mentions `HistoryView` or `Shot`.
  `phases/B09-diff-and-history-ui/SPEC.md:374-377` still records it as an unowned observation.
- **Consequence.** The item has an owner on paper and no requirement, acceptance or disposition;
  B15's coverage audit would find an unaccounted PLAN deliverable.
- **Owner:** B10 author; B09 author for the note.
- **Correction.** B10: add a requirement mirroring B10-REQ-05's label table for the card timeline's
  screenshot `Shot` (404 "Not kept", decode failure "Could not be drawn", other failures "Could not be
  read"), an acceptance row, a disposition line in the execution obligations, and a dependency on
  B01's R-22 404s. Note the shared file `src/components/HistoryView.tsx` (B09 owns it; B10 edits only
  the label after B09). B09: collision 6 reads "assigned to B10 (accepted decision 5)".

### INT-07 · A-2, A-4 and A-10 adjudication is still placed on B15 in three specs

- **Phases / sections:** B02 (Requirements line 7, Excludes, Dependencies "To B12 and B15", B02-Q5,
  Risks A-2), B12 (Excludes `:28`, collisions item 4, B12-Q5, outputs to B15), B15 (Owns,
  B15-REQ-10 to REQ-12, B15-Q1, acceptance item 3, "What keeps the programme open").
- **Issue.** PROGRESS accepted decision 3: A-2 to B02, A-4 and A-10 to B12 ("adjudicates and fixes"
  per PLAN B12 row); "B15 confirms all of A-1 to A-10". The specs still have B15 re-adjudicating A-2
  and A-4 and treating a fix as outside every building phase (B15-Q1).
- **Consequence.** Duplicate ownership of the adjudication, and a confirmed A-4 or A-2 with no
  building owner (B15 builds no behaviour).
- **Owner:** B02, B12, B15 authors.
- **Correction.** B02: add a requirement to adjudicate A-2 against B02's final recode ordering (the
  scratch reproduction must exercise the journal pass, as B15-REQ-10(b) describes) and fix it if
  confirmed, with acceptance and a disposition; remove "B15 re-adjudicates". B12: own A-4 and A-10
  (adjudicate, fix if confirmed, prove; A-10 against B02's D-02 rule), mark B12-Q5 answered. B15:
  B15-REQ-10/11 become "confirm B02's A-2 and B12's A-4/A-10 verdicts at the audit commit"; drop
  B15-Q1 or narrow it to "a verdict B15 overturns"; keep A-1 to A-10 confirmation.

### INT-08 · B03 lacks requirements for two deliverables PLAN now gives it (cycle naming in the check, Freeform cycle placement), and its scope collisions are answered

- **Phases / sections:** B03 (Owns, B03-REQ-02, B03-Q1, B03-Q6, collisions 1 to 9), B04 (Excludes).
- **Issue.** PLAN B03 territory includes "Freeform placement of cycle members" and "naming parent
  cycles in the check"; the shared-files table puts B03 first on `shared/check.ts` ("cycles"),
  `src/board/autoLayout.ts`, `App.tsx`, `BoardView.tsx`, `ItemModal.tsx`, `QuestionsView.tsx`,
  `find.ts`, `viewedStore.ts`, `catalogueApi.ts`, `.gitignore`. `phases/B03-load-resilience/SPEC.md`
  still treats Freeform placement as B03-Q1 (orchestrator) and cycle naming as B03-Q6 ("B04 owns
  `shared/check.ts`; B03 proposes"); neither has a requirement or acceptance row. B04's spec does not
  pick cycle naming up either.
- **Consequence.** Two PLAN deliverables with no requirement or proof; B03's planner will re-ask the
  orchestrator questions already settled.
- **Owner:** B03 author.
- **Correction.** Add requirements and acceptance for (a) Freeform placing cycle members in the orphan
  stack (R-10's "what") and (b) the check naming a parent cycle and its members (severity per a B03
  question; must keep the real catalogue green). Mark B03-Q1 and B03-Q6 answered (B03 delivers), mark
  collisions 1 to 9 answered by the shared-files table (the `ItemModal.tsx:223` throw is B03's).
  Clarify whether PLAN's "safe type lookups (canParent, labels, ...)" answers B03-Q4 (labels fall
  back) or leaves it open; ask the orchestrator if unclear.

### INT-09 · Convention 12 (doc lines) is contradicted by several specs and by one PLAN sentence

- **Phases / sections:** PLAN.md B02 territory ("SCHEMA and starter status docs are B14's") and B14
  territory ("SCHEMA status and ID sections"); B01 (B01-Q4, boundary flag on README); B02 (Excludes,
  "To B14"); B04 (B04-Q4); B05 (ID wording to B14); B06 (Excludes "README ... B14"; outputs); B14
  (Depends on, REQ-13.3: facts read from "Discovered for later").
- **Issue.** PROGRESS convention 12 and PLAN "Doc lines": each phase updates the README, SCHEMA,
  About, DESIGN and SKILL.md lines that describe behaviour it changes and lists them under "Doc
  facts" in its entry; B14 does the whole-file pass. B05 and B04 (proposal) follow this; B02 and B06
  hand all doc edits to B14; B01 asks (B01-Q4); B14 expects facts under "Discovered for later". No
  spec mentions a "Doc facts" list except B14's own name for it. PLAN's B02 territory sentence reads as
  forbidding B02 from touching SCHEMA's status lines.
- **Consequence.** Docs lag behaviour for several phases; B14 finds facts in the wrong ledger
  section; B02 and B14 may both rewrite SCHEMA's status passage.
- **Owner:** orchestrator (PLAN wording), then B01, B02, B04, B06, B14 authors.
- **Correction.** Orchestrator: reword PLAN so B14 owns R-149 (project-number pins), the starter
  config and docs, and the whole-file pass, while the phase changing a rule updates the lines that
  state it (convention 12). B01-Q4 and B04-Q4: marked answered (the phase edits its own lines). B02,
  B06: replace "hand to B14" with "update the lines; list them under Doc facts". Every spec's
  execution obligations: add "list doc lines changed under Doc facts in the PROGRESS entry". B14:
  read "Doc facts" in phase entries (and "Discovered for later" for anything not done).

### INT-10 · Split deliveries are not recorded the way R-07 and R-54 are

- **Phases / sections:** PLAN.md note under the phase table; B02/B06 (R-01); B05/B06 (R-45, R-111
  server halves); B05/B07 (R-56, see INT-05).
- **Issue.** PLAN records only R-07 and R-54 as split. In the specs: R-01 is B02's but its lock-out UI
  is rendered by B06 (PLAN B02 territory says so; B06 acceptance has an "R-01 (render)" row); R-45
  and R-111 are B06's findings whose server halves B05 builds (B05-REQ-05, REQ-06; PLAN D-04 "covers
  config writes"). Touch rights say the owner delivers the whole fix, so these are exceptions.
  B02-Q1 is half answered by the PLAN (UI in B06) but R-68's allocation call site in
  `SettingsView.tsx` remains unassigned.
- **Consequence.** Unclear who closes R-01, R-45 and R-111; B15-REQ-02 requires the recording phase
  to be the PLAN owner or a recorded move.
- **Owner:** orchestrator, then B02, B05, B06 authors.
- **Correction.** Add to the PLAN note: R-01 board/server half B02, lock-out UI B06, B06 closes (or
  B02 closes on B06's render proof; pick one); R-45 and R-111 server halves B05, B06 closes; R-56
  whole in B05 including the store wiring. Answer B02-Q1: UI in B06; R-68's call site in Settings is a
  minimal B02 edit under touch rights (or B06; state which). Specs record the same.

### INT-11 · B12's gate omits D-03 although PLAN says B12 waits on it

- **Phases / sections:** PLAN.md D-03 row ("Waits on it: B13 (REQ-07b), B12") versus Build order
  ("B12 (after B02)") and PROGRESS phase-status row for B12; B12 Depends on.
- **Issue.** B12 may run in its worktree before B04 plans, so D-03 may not exist when B12 builds.
  B12's R-07 half (INT-04) needs B02's rule in the plan tools; if D-02b chooses version scoping, the
  plan tools must either import `shared/statuses.ts` or mirror it, which is exactly D-03.
- **Consequence.** B12 picks its own sharing mechanism, or mirrors a rule that D-03 later says must be
  imported, or waits with no gate saying so.
- **Owner:** orchestrator.
- **Correction.** Either make D-03 an early planning-only gate ("resolved in B04 planning before B12
  builds"), or record that B12 does not need D-03 when D-02b is "no overlap" and is gated on D-03
  otherwise. Update PLAN build order, PROGRESS B12 gate and B12 Depends on.

### INT-12 · Parallel worktrees and the per-phase version bump will collide; "versions rising" is unspecified

- **Phases / sections:** PLAN binding constraints (version per phase), "Safe in parallel"; PROGRESS
  convention 5; B12, B13 execution obligations; B15-REQ-25 and REQ-28.
- **Issue.** B12 and B13 run in parallel worktrees alongside serial app phases, and every phase bumps
  `requirements-board/package.json`, the lock file and `CHANGELOG.md`. B12 also edits the `verify`
  script in the same `package.json`. B15-REQ-25 requires "versions rising" in CHANGELOG.
- **Consequence.** Merge conflicts on three shared lines every time a worktree phase merges, and
  possible duplicate or out-of-order version numbers.
- **Owner:** orchestrator.
- **Correction.** Add a convention: a worktree phase picks its version at merge time (master's
  current version plus its bump, rebased onto the newest CHANGELOG entry) and resolves the lock file
  by re-running `npm install` in the board folder; B12's `verify` script edit is merged by hand.
  Mention in B12 and B13 execution obligations.

### INT-13 · The agent-tool test gate is narrower in B12 than B15 expects, and B13 omits convention 6

- **Phases / sections:** B12 (gate; B12-Q1), B13 (execution obligations; acceptance), B15-REQ-19.
- **Issue.** Accepted decision 6 has B12 add agent-tool tests to `verify:board`. B12's spec speaks of
  "both skills' `node --test` suites" (`phases/B12-build-plan-tools/SPEC.md:368-369`). B13 may add
  tests for consistency-review scripts and workflows (none exist today) and never mentions running
  `node --test` (PROGRESS convention 6). B15-REQ-19 expects "every `*.test.mjs` under
  `requirements-board/agent/`".
- **Consequence.** B13's regression tests may sit outside the gate and rot; B15 finds proofs no suite
  runs.
- **Owner:** B12 and B13 authors.
- **Correction.** B12: the `verify` addition runs every `*.test.mjs` under `agent/` (glob, not two
  named suites), and B12-Q1 is marked answered. B13: execution obligations add "run all agent
  `node --test` suites (in `verify:board` once B12 has landed); place new tool tests where the B12
  glob finds them".

### INT-14 · B10 does not consume B01-Q2 and D-01c, which B01 and PROGRESS gate it on

- **Phases / sections:** B10 (Depends on, "Consumed"), B01 (Unblocks, Deferred decisions intro),
  PROGRESS phase-status row for B10 ("B01-Q2 answered").
- **Issue.** `phases/B01-origin-security/SPEC.md:360` says "Downstream B10 is blocked on D-01c and
  B01-Q2 only"; D-01c (page CSP) "constrains anything B10 loads, for example pdf.js workers or blob
  images" (`:298-299`). B10 lists D-01 only for the asset URL form (`phases/B10-artifact-viewers/SPEC.md:397-398`)
  and never names B01-Q2 (fragment links: inert or reveal, which uses the camera code B10 reworks in
  B10-REQ-04).
- **Consequence.** B10's pdf.js and object-URL changes (REQ-01, REQ-02) may break under a page CSP,
  and its placement rework may undo B01-Q2's reveal behaviour.
- **Owner:** B10 author.
- **Correction.** Add to B10 Depends on and Consumed: D-01c (any page CSP must admit B10's workers,
  `blob:` URLs and thumbnails; proof re-run under it) and B01-Q2 (if "reveal", B10-REQ-04 keeps the
  reveal path working). Add to REQ-10 preserved behaviour.

### INT-15 · B11's lane merge needs a merge semantics B05's lane request refuses

- **Phases / sections:** B11-REQ-07; B05-REQ-13.
- **Issue.** B11-REQ-07 requires renaming a band onto an existing lane (any case) to merge into it,
  in one write, "through the lane-rename path as B05 leaves it". B05-REQ-13 refuses a rename when "the
  new name breaks a lane rule", and a duplicate (case-insensitive) is a lane rule breach
  (`laneListProblem`).
- **Consequence.** B11 cannot deliver R-119 on B05's request without extending B05's route after B05
  closed, with no spec saying so.
- **Owner:** B05 and B11 authors.
- **Correction.** Either B05-REQ-13 includes a merge form (rename onto an existing lane moves its
  stories and drops the source lane, all or nothing) with its acceptance, or B11 states it extends the
  lane route under touch rights, after B05 and B07, keeping B05's all-or-nothing guarantees. Record in
  PLAN's shared-files row for `server/catalogueApi.ts` if B11 edits it.

### INT-16 · B07 and B11 do not promise to keep what earlier phases put in the files they rework

- **Phases / sections:** B07 (Preserved behaviour, Consumes), B11 (Dependencies, preserved).
- **Issue.** B05-REQ-06 adds per-section config base tokens to the snapshot and config events; B05's
  R-54 work adds a journal step to `syncFromDisk`; B02 adds the per-list damage state to the snapshot
  and config event (B02 acceptance R-01(e)). B07 replaces event delivery and makes `syncFromDisk`
  incremental, but its preserved list names none of these. B07 produces node identity reuse in
  `src/board/graph.ts` that "B11 must keep" (B07 Produces), but B11's spec never mentions it.
- **Consequence.** B07's batched delivery or incremental re-sync can silently drop the config tokens
  (breaking B06's Settings conflicts), the damage signal (breaking B06's lock-out) or the R-54 journal
  step; B11 can undo B07's render bound.
- **Owner:** B07 and B11 authors.
- **Correction.** B07: preserved behaviour and REQ-06.5 equivalence include config section base
  tokens, the per-list status damage state and the hand-delete journal handling as B02 and B05 leave
  them; REQ-07 lists them as carried by the batched delivery. B11: preserved behaviour includes B07's
  node and `data` identity reuse (`tests/graph.test.ts` from B07 stays green).

### INT-17 · B06's ownership and dependencies lag the PLAN; B06-Q4 is gated too late

- **Phases / sections:** B06 (Owns, Depends on, boundary flags, B06-Q1, B06-Q4, B06-Q6).
- **Issue.** Accepted decision 5 gives B06 `src/nav.ts` and the artifact details form in
  `ArtifactPanel.tsx`; PLAN lists B06 on `src/store.ts` and `src/api.ts` after B07; PLAN's D-04 "covers
  config writes". B06 still asks for these (B06-Q1, B06-Q6) and calls B07 "recommended first" while
  PLAN makes it a hard gate. B06-Q4 (extend the lock-out to components and project) "may need a
  field-level signal from B02/B03" but is gated at B06 planning, after B02 and B03 have built.
- **Consequence.** Re-asking settled questions; if B06-Q4 is "yes" (the author's recommendation), the
  producer phases are already closed and B06 must infer damage, which B06-REQ-12 forbids.
- **Owner:** B06 author; orchestrator for the B06-Q4 gate.
- **Correction.** B06 Owns adds `src/nav.ts`, the details form in `ArtifactPanel.tsx`, and its save
  actions in `store.ts`/`api.ts`; B07 becomes a hard dependency; B06-Q1 and B06-Q6 marked answered.
  B06-Q4: move its gate to "before B02 build" (so B02 can emit a per-field signal for components and
  project) or record that B06 may add the signal itself in `shared/config.ts` under touch rights.

### INT-18 · B12's territory and gates lag four accepted decisions

- **Phases / sections:** B12 (Excludes, Depends on, REQ-10, REQ-11, collisions 2 and 3, B12-Q1, Q2,
  Q4, Q5).
- **Issue.** Accepted decisions 5 and 6 and PLAN B12 territory: B12 owns the R-139 fix in
  `scripts/capture.ts`, the deny terms and starter "This repo" placeholders R-150 needs, and adding
  agent-tool tests to `verify:board`; B12 builds after B02. The spec excludes `capture.ts` and
  `starter/`, says "no producer phase", and leaves Q1, Q2, Q4 and Q5 open (Q5 is INT-07).
- **Consequence.** B12's planner will hand work to B14 that is now B12's, or re-ask the orchestrator.
- **Owner:** B12 author.
- **Correction.** Excludes: remove `capture.ts` (R-139) and `starter/deny.txt`/`starter/this-repo/run-build-phase.md`
  (R-150); keep the rest of `starter/` with B14. Depends on: B02 (and D-03 per INT-11). Mark B12-Q1,
  Q2, Q4, Q5 answered. Outputs to B14: what B12 changed in `starter/`, for verification rather than
  re-doing.

### INT-19 · B04 promises a slug helper; B13 needs the note resolver

- **Phases / sections:** B04-REQ-09.2, "Behavioural interface expectations"; B13-REQ-07(b), (c).
- **Issue.** B04 commits that "at least the note and heading slug rule" is usable by agent tools and
  "states which function gives the note-file slug". B13-REQ-07(b) requires ref-kit and build-packs to
  "resolve a note cite to the same note the board's source resolver does", which includes the
  longest-prefix match and words/spot split in `shared/sources.ts` (B04 also changes that split for
  R-81).
- **Consequence.** B13 gets a slug helper but must re-implement resolution, recreating the duplicate
  systemic issue 4 targets.
- **Owner:** B04 author (with B13).
- **Correction.** B04-REQ-09.2 commits the note-cite resolution rule (slug plus prefix match plus
  words/spot split), not only the slug, in the D-03 shape, with parity proof over the real notes; or
  B13 records that slug-only parity is accepted and why.

### INT-20 · B14 territory and dependencies lag the PLAN

- **Phases / sections:** B14 (Owns, Excludes, Depends on, REQ-03.4, REQ-07.7, B14-Q1, Dependencies).
- **Issue.** PLAN B14 territory includes "the R-31 path sweep across every script and the server's
  environment paths"; B14 Excludes server env handling and treats it as needing orchestrator
  agreement (B14-Q1). PLAN Depends on includes B11 (AboutView order); B14's header omits it. B13 now
  owns `scripts/link-index.ts` (accepted decision 5) while B14's R-31 sweep edits its path handling.
  B12 now edits `starter/deny.txt`. PROGRESS "Discovered for later" routes B05-Q6 (`git mv` staging in
  `artifact:new`) to "B05, then B14"; B14 does not mention it. B14's Excludes cites "About page
  scrolling (R-126, B11)"; About scrolling is R-127 (R-126 is the Outline twisty).
- **Owner:** B14 author.
- **Correction.** B14-Q1: the change is B14's to make if chosen (touch rights granted); only the
  choice remains. Add B11 to Depends on. Note `link-index.ts` (B13 owns, B14 path sweep after B13) and
  `deny.txt` (B12 adds terms, B14 verifies). Add the B05-Q6 handoff (if B05 did not remove `git mv`,
  B14 does or records why). Fix R-126 to R-127.

### INT-21 · B15 lags D-10 and the PLAN's closing rights

- **Phases / sections:** B15 (Depends on, B15-REQ-09, REQ-17, Excludes, B15-Q6).
- **Issue.** B15 checks "D-01 to D-09" (`phases/B15-closing-audit/SPEC.md:21, 141, 220`); PLAN has
  D-10. PLAN B15 territory says B15 "may mark the programme closed in `PLAN.md`, `index.html` and
  `PROGRESS.md`", while B15 lists PLAN.md as read-only and asks B15-Q6.
- **Owner:** B15 author.
- **Correction.** D-01 to D-10 throughout; B15-Q6 marked answered; Excludes allows the closing-status
  edit to PLAN.md and index.html only.

### INT-22 · Many spec questions are already answered by the accepted decisions but still read as open

- **Phases / sections:** all specs' "Deferred decisions" and "boundary flags" sections.
- **Issue.** BUILD-BOOK Step 6 requires honest decision gates. These are answered by PLAN or PROGRESS
  accepted decisions yet still open in the specs: B01-Q4 (convention 12); B02-Q1 (in part, INT-10),
  B02-Q2 (INT-04), B02 boundary flag 3 (`catalogueDiff.ts` in the table; B08 now serial after B02);
  B03-Q1, B03-Q6 and collisions 1 to 9 (INT-08); B04-Q4 (convention 12) and B04's collision list (all
  rows now in the table); B05-Q1 (INT-02), B05-Q4 (rows added; `src/api.ts` now B05's); B06-Q1,
  B06-Q6 (INT-17); B07-Q1 (B07 on the `catalogueApi.ts` row), B07-Q2 (B07 owns the event shape),
  B07-Q3 (B07 does node reuse "where its render bound needs it"), B07-Q4 (`ProblemPill` is B03's; B07
  edits its text under touch rights); B08-Q4 (INT-02), B08-Q6 (PLAN: B08 investigates and records it);
  B09-Q1 and collisions 1 to 4 and 6 (INT-01, INT-06); B10-Q1, B10 boundary items 1 to 3 (INT-01;
  `artifactIndex.ts` filter prefs and `.lightbox` styles are B10's); B12-Q1, Q2, Q4, Q5 (INT-07,
  INT-18); B13 boundary item 2 (`link-index.ts` is B13's); B14-Q1 (in part, INT-20); B15-Q6 (INT-21).
- **Consequence.** Planners re-litigate settled structure and may answer differently.
- **Owner:** each author; the orchestrator records the answers in PROGRESS's register.
- **Correction.** Mark each "Answered (PLAN / accepted decision n, 2026-11-18): ..." in place, and
  keep only genuinely open questions with an owner and gate. Still open and needing the orchestrator
  before the owning phase plans: B03-Q5 (other browser stores; note its owner list is stale:
  `artifactIndex.ts readPrefs` is now B10's), B03-Q4 if PLAN's "labels" does not settle it.

---

## Minor

### INT-23 · Every spec cites "PROGRESS.md conventions 1 to 10"
- **Phases:** B01 to B15 (binding constraints). Conventions 11 (touch rights) and 12 (doc lines) now
  exist and change how specs should treat neighbouring files and docs.
- **Owner:** each author. **Correction:** "conventions 1 to 12".

### INT-24 · Stale sequencing language
- **Phases:** B03 header "Depends on: none (Wave 1)" and "Inputs: none" (PLAN: after B01, using its
  real-path rule); B04 "No hard producer dependency (PLAN wave 1)" (PLAN: B03); B08 Risks and B02 flag 3
  ("B08 safe in parallel with B02 to B05"); B05 "B08 is parallel-safe"; B09 collision 3 (B09 and B10
  "safe in parallel"); B11 boundary 5; B06 "B07 recommended".
- **Owner:** each author. **Correction:** use the serial order and PLAN "Depends on" column.

### INT-25 · Shared-files table gaps
- **Phases:** PLAN.md "Shared files and sequencing".
- **Issue.** Missing rows found while reading the specs: `src/components/HistoryView.tsx` (B09, B10
  label); `scripts/link-index.ts` (B13, B14 path sweep); `src/components/ProblemPill.tsx` (B03 issue
  surface, B07 text); `server/catalogueFs.ts` lacks B07 (additive read helpers for incremental
  re-sync, B07-Q1 proposal); `server/catalogueApi.ts` lacks B08 (history routes, if signatures
  change) and B11 (if INT-15 lands there); `shared/config.ts` (B02 parsing, B06 if INT-17 adds a
  field signal).
- **Owner:** orchestrator. **Correction:** add the rows.

### INT-26 · PROGRESS phase-status notes and readiness wording
- **Issue.** PROGRESS says all phases are ready for implementation planning, but the B02 note reads
  "ready to plan after B01" (B02 needs B01 only for file order, so it can plan now and build after
  B01). Early planning-only gates from INT-03 (D-05 before B08) and INT-11 (D-03 before B12) are not
  shown. B10's gate says "B01-Q2 answered" but not D-01c (INT-14).
- **Owner:** orchestrator. **Correction:** fix the notes and gates.

### INT-27 · B03 does not name the issue surface it now owns
- **Issue.** PLAN B03 row and accepted decision 5 give B03 "the issue surface (`ProblemPill` and
  D-06)". B03 Owns names the boundary and D-06 but not `ProblemPill.tsx`, which B06, B07, B10 and B11
  report into.
- **Owner:** B03 author. **Correction:** add it to Owns and Unblocks (the pill's grouping contract for
  later phases).

### INT-28 · B05 wording on `src/api.ts` and its Unblocks list
- **Issue.** `phases/B05-server-write-model/SPEC.md:375-376` calls `src/api.ts` "unassigned";
  accepted decision 5 makes the transport B05's (B07 and B06 edit after it). B05 Unblocks lists B13
  and B14 as inheriting `writeItem`; B13 may land before B05 in its worktree, so B05 must also keep
  B13's merged `apply-links` tests green (already implied by B05-REQ-21; say so).
- **Owner:** B05 author. **Correction:** align wording.

---

## Coherence check

- **Outcomes covered.** 1 (B05, B06, B07), 2 (B02, B12), 3 (B03, B11), 4 (B04, B13 parity), 5 (B08,
  B09), 6 (B01, B13 apply paths), 7 (B12, B13, B14). Each outcome has at least one owning phase with
  acceptance; B15 owns the integration proof. With INT-01 to INT-05 fixed the set is coherent.
- **Cycles.** None in the hard dependencies once INT-02 is fixed (B05 currently lists B08 as a
  consumer, which with PLAN's B08-before-B05 order reads as a cycle).
- **Serial order feasibility.** Feasible: B01, B02, B03, B04, B08, B05, B07, B06, B09, B10, B11, B14,
  B15, with B12 after B02 and B13 (REQ-07b) after B04, both before B14, provided D-05 (with B05-Q2/Q3)
  is answered before B08 builds (INT-03) and D-03 before B12 builds where B12 needs it (INT-11).
- **Template structure.** All 15 specs have the header block and the eight sections. Acceptance has a
  row per owned finding in every spec, except the gaps named above (B12 lacks R-07, INT-04; B10 lacks
  the HistoryView label, INT-06; B02 and B12 lack A-2 and A-4/A-10, INT-07; B03 lacks cycle naming and
  Freeform placement, INT-08). Every spec has the version bump, CHANGELOG, `verify:board` and
  disposition duties; none has the "Doc facts" duty (INT-09); B13 lacks the `node --test` duty
  (INT-13).
- **Statuses.** All PLANNED, consistent with PROGRESS; none claims ready to build.

---

## Alignment list per spec

**B01 (Origin security)**
- Mark B01-Q4 answered (convention 12: B01 edits README lines 190-196 itself and lists them under Doc
  facts). (INT-09, INT-22)
- Boundary flag "`artifactFiles.ts` not in the shared-files table": now in the table; mark resolved.
- Unblocks: state that B10 consumes D-01c and B01-Q2 (already), and B08 (blob-route edits after B01).
- Conventions 1 to 12; add the Doc facts duty. (INT-23, INT-09)

**B02 (Status identity)**
- B02-REQ-05 limited to the shared rule, diff and history route; R-07 plan-tool half Moved to B12;
  mark B02-Q2 answered; "To B12" names the exact rule to apply. (INT-04)
- Add A-2 adjudication and fix-if-confirmed with acceptance and disposition; remove "B15
  re-adjudicates" (lines 7, 17, 248, 367, 381-385); A-10 is B12's. (INT-07)
- B02-Q1: UI in B06; state who makes R-68's Settings call site. Record R-01 split. (INT-10)
- Boundary flag 3 resolved (`catalogueDiff.ts` row; B08 serial after B02). (INT-22, INT-24)
- Update SCHEMA status lines B02 makes false (Doc facts) instead of handing all to B14; B14 keeps R-149
  and the starter. (INT-09)
- If B06-Q4 moves before B02 (INT-17), add the per-field signal for components and project.
- Conventions 1 to 12. (INT-23)

**B03 (Load resilience)**
- Depends on B01 (`artifactFiles.ts` real-path rule); drop "Wave 1" and "Inputs: none". (INT-24)
- Add requirements and acceptance for Freeform cycle-member placement and the check naming parent
  cycles; mark B03-Q1, B03-Q6 answered. (INT-08)
- Mark collisions 1 to 9 answered by the shared-files table. (INT-22)
- Add `ProblemPill.tsx` (issue surface) to Owns and its contract to Unblocks. (INT-27)
- B03-Q5: correct the owner list (`artifactIndex.ts` prefs are B10's) and get the orchestrator's answer
  before planning; settle B03-Q4 against PLAN's "labels". (INT-22)
- Conventions 1 to 12; Doc facts duty.

**B04 (One rule, one helper)**
- Depends on B03 (not "wave 1"). (INT-24)
- B04-REQ-09.2: commit the note-cite resolution rule, not only the slug. (INT-19)
- Mark B04-Q4 answered (convention 12) and the collision list resolved. (INT-09, INT-22)
- Unblocks: B12 only if INT-11 says B12 needs D-03.
- Conventions 1 to 12; Doc facts duty.

**B05 (Server write model)**
- Depends on B08 (deletion bound, D-07); remove B08/B09 from Unblocks; REQ-20 and the R-54 boundary
  flag rewritten to apply B08's bound; mark B05-Q1 answered. (INT-02)
- D-05, B05-Q2, B05-Q3 gated before B08 builds. (INT-03)
- B05-REQ-13: B05 wires store `renameLane`/`deleteLane` to the one-write request; acceptance covers
  the store path. (INT-05)
- B05-REQ-13: add a merge form for renaming onto an existing lane, or record B11 extends it. (INT-15)
- `src/api.ts` is B05's transport; mark B05-Q4 answered. (INT-28, INT-22)
- Record R-45/R-111 server halves as B05 deliveries closed by B06. (INT-10)
- Conventions 1 to 12.

**B06 (Edit sheets and Settings)**
- Owns adds `src/nav.ts`, the artifact details form in `ArtifactPanel.tsx`, and its store/api save
  actions; B07 a hard dependency; mark B06-Q1, B06-Q6 answered. (INT-17)
- B06-Q4 gate moved before B02 build, or B06 adds the field signal itself under touch rights. (INT-17)
- Replace "README ... B14" with own doc lines plus Doc facts. (INT-09)
- R-01 render row: record who closes R-01. (INT-10)
- Conventions 1 to 12.

**B07 (Store sync and layout)**
- Own D-10: add to Owns and Deferred decisions, add a requirement and acceptance, list B09 and B10
  under Unblocks. (INT-01)
- Remove the assumption that B05 wired `renameLane`. (INT-05)
- Preserved/equivalence: config section base tokens, status damage state, R-54 journal handling;
  batched delivery carries them. (INT-16)
- Mark B07-Q1 to Q4 answered (Q4: `ProblemPill` is B03's; text edit under touch rights). (INT-22)
- Conventions 1 to 12; Doc facts duty.

**B08 (Git history reader)**
- Own the deletion bound (Owns, a requirement, a fixture scenario, the D-07 exposure to B05); revise
  REQ-03.2, REQ-10.4, Produces for B05, Unblocks; mark B08-Q4 answered. (INT-02)
- Depends on D-05, B05-Q2, B05-Q3 recorded before build. (INT-03)
- D-07 dependants: B05 and B09. Mark B08-Q6 answered (investigate; record under Discovered for
  later). (INT-22)
- Risks: shared-file and parallel-safety text replaced by the serial order. (INT-24)
- Conventions 1 to 12.

**B09 (Diff and history UI)**
- B09-REQ-13 consumes D-10 from B07; mark B09-Q1 answered; Depends on B07 (D-10) hard; remove the
  signal from Outputs and B10 from Unblocks. (INT-01)
- R-54 row: B05 applies B08's bound. (INT-02)
- Collisions 1 to 4 resolved by the table; collision 6 assigned to B10. (INT-06, INT-22)
- Conventions 1 to 12; Doc facts duty.

**B10 (Artifact viewers)**
- Add the HistoryView screenshot failure label requirement, acceptance and disposition. (INT-06)
- Mark B10-Q1 answered by D-10; REQ-06 blocked on D-10; Depends on B07 (D-10). (INT-01)
- Consume D-01c and B01-Q2. (INT-14)
- Boundary items 2 and 3 resolved (filter prefs and `.lightbox` styles are B10's). (INT-22)
- Note `ArtifactPanel.tsx` (B06 then B10) and `HistoryView.tsx` (B09 then B10).
- Conventions 1 to 12; Doc facts duty.

**B11 (Board canvas and views)**
- B11-REQ-07: build on B05's merge form, or state the touch-rights extension of the lane route.
  (INT-15)
- Preserve B07's node identity reuse in `graph.ts`/`BoardView`. (INT-16)
- Boundary items 2, 3, 5 resolved by the table and PLAN dependencies. (INT-24)
- Conventions 1 to 12; Doc facts duty.

**B12 (Build-plan tools)**
- Add R-07 plan-tool half (requirement, acceptance, closes R-07); Depends on B02 (and D-03 per
  INT-11). (INT-04, INT-11)
- Own A-4 and A-10 adjudication and fixes; mark B12-Q5 answered. (INT-07)
- Excludes: drop `capture.ts` (R-139) and the R-150 starter lines; mark B12-Q1, Q2, Q4 answered.
  (INT-18)
- `verify` runs every `*.test.mjs` under `agent/`. (INT-13)
- Version picked at merge time; `verify` script merge. (INT-12)
- Conventions 1 to 12; Doc facts duty.

**B13 (Consistency and linking tools)**
- Mark boundary item 2 answered (`link-index.ts` is B13's); note B14's later path sweep. (INT-22)
- Execution obligations: run all agent `node --test` suites; put new tool tests where B12's glob
  finds them. (INT-13)
- Version picked at merge time. (INT-12)
- REQ-07(b) against B04's resolver commitment (INT-19).
- Conventions 1 to 12; Doc facts duty.

**B14 (Scripts, kit and docs)**
- B14-Q1: B14 owns server env paths if chosen; Depends on B11; `link-index.ts` and `deny.txt` shared
  notes; B05-Q6 handoff; R-126 corrected to R-127. (INT-20)
- Read Doc facts from phase entries; SCHEMA status work limited to R-149, the starter and the
  whole-file pass. (INT-09)
- Conventions 1 to 12.

**B15 (Closing audit)**
- B15-REQ-10/11/12 and B15-Q1: confirm B02's A-2 and B12's A-4/A-10 verdicts, not adjudicate. (INT-07)
- D-01 to D-10; mark B15-Q6 answered; allow the closing-status edit to PLAN.md and index.html.
  (INT-21)
- Conventions 1 to 12.

**Orchestrator (PLAN.md, PROGRESS.md)**
- D-05 (with B05-Q2/Q3) resolved before B08 builds. (INT-03)
- D-03 gate for B12, or a recorded exemption. (INT-11)
- Record split deliveries R-01, R-45, R-111, R-56. (INT-10)
- Reword PLAN's B02/B14 SCHEMA sentences to match convention 12. (INT-09)
- Version-at-merge convention for worktree phases. (INT-12)
- Shared-files rows: HistoryView, link-index.ts, ProblemPill, catalogueFs (B07), catalogueApi (B08,
  B11), shared/config.ts. (INT-25)
- PROGRESS status notes and early gates; answer B03-Q5 (and B03-Q4 if needed); record answered spec
  questions in the register. (INT-22, INT-26)
