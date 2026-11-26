# Phase 68 · Intake groundwork: the shell, the feed, the read models and the arrivals

**Requirements covered:**
[EP-02](../../../requirements-board/requirements/stories/EP-02.md) Booking intake and change handling (status 3 Verify, graded **Partial**, size XL: four sources and their history exist, but there is no one front door: hospital rows need Import, PDFs sit on their own tab behind Send to matching, and decisions are per row).
[FT-02.1](../../../requirements-board/requirements/stories/FT-02.1.md) Matching screen for incoming Lists (status 3, **Contradicts**, XL: import button, row decisions, Waiting for NHI as its own tab, no source view).
[US-02.1.1](../../../requirements-board/requirements/stories/US-02.1.1.md) Hospital bookings reach the matching screen (status 3, **Contradicts**, S: the Import hospital file button and dialog).
[US-02.1.4](../../../requirements-board/requirements/stories/US-02.1.4.md) One feed of everything waiting (status 3, **Contradicts**, L: a flat row table, no grouping by List, no source filters, Needs NHI on its own tab, no unreadable PDF). It leaves built Phase 51's covers (D124).
[US-02.1.5](../../../requirements-board/requirements/stories/US-02.1.5.md) Hospital rows arrive on their own (status 3, **Contradicts**, S: rows appear only after Import).
[EP-14](../../../requirements-board/requirements/stories/EP-14.md) Health systems integration (status 1 Proposed, **Contradicts**, S: the import button; inbound only is right but unstated).
[DM-11](../analysis/domain-model-delta.md#dm-11--the-arriving-list-is-what-the-office-decides) (the arriving List is what the office decides) and [DM-15](../analysis/domain-model-delta.md#dm-15--rows-arrive-by-source-not-by-an-office-import) (rows arrive by source). Groundwork only, their units with the Wave 7 phase that shows them (D124): the stored shapes and read models of [DM-12](../analysis/domain-model-delta.md#dm-12--a-list-keeps-its-versions-and-a-match-shows-its-keys), [DM-13](../analysis/domain-model-delta.md#dm-13--bookings-missing-from-a-re-sent-list-are-offered-as-removals), [DM-14](../analysis/domain-model-delta.md#dm-14--a-source-is-an-entity-with-a-state), [DM-16](../analysis/domain-model-delta.md#dm-16--a-pdf-is-read-with-a-confidence-for-each-value-and-one-that-cannot-be-read-is-held), [DM-17](../analysis/domain-model-delta.md#dm-17--a-stub-is-resolved-by-a-later-arrival-that-carries-the-nhi), [DM-19](../analysis/domain-model-delta.md#dm-19--an-arrival-names-the-anaesthetist-it-was-meant-for-and-a-new-list-is-placed-with-that-slot-suggested) and [DM-21](../analysis/domain-model-delta.md#dm-21--identical-re-arrivals-are-shown-as-unchanged-lists-not-skipped).
Seed change and `PERSIST_VERSION` 80 to 82.
**Answered, built as answered** (owner, 26 November, for the build, not yet seen by AA): D117 (the shape), D118 (one change set per List), D119 (the six demo actions), D120 (the simulated reader), D121 to D124 (lanes, test once, boundaries, the split). OQ-109 part 2 (no import button, inbound only), as the stories read.
**Open, built to its default (D125):** [OQ-109](../../../requirements-board/requirements/questions/OQ-109.md) part 1 (which two hospitals are integrated: St George's and Southern Cross connected, Forte Health and the rest not connected) and [OQ-13](../../../requirements-board/requirements/questions/OQ-13.md) (format and fields: an optional named anaesthetist on the incoming fields). No provisional label on screen.

**Depends on:** none in the plan (45 to 59 DONE on `master`; Finances Wave 5 may be running).
**Estimated:** 2 sessions. **Checkpoint** after Work item 6 (types, read models, selectors, routes, `WorkbenchSplit`, the section, the feed and the stub benches). Session 2: items 7 to 16, in that order.

**Runs in:** Lane D of the Intake lanes, Wave 6, alone, on `lane/d` made from `master`; never lands on `master` before Wave 7's join. [LANES-INTAKE.md](../LANES-INTAKE.md) overrides this doc's and the skill's commit, port, gate, review, owner-test and plan-page steps (`68 checkpoint:`, then `68 complete:`, which starts Wave 7). The owner tests 68 once, with 69 to 72, from `TEST-68-72.md`.

## Goal

Intake becomes the front door for every List and change from the rooms and the hospitals, and everything Wave 7 builds on is laid down once.

- **Two views (D117):** Arrivals (`/admin/intake`) and Sources (`/admin/intake/sources`, a placeholder for 71); no import or upload button, only a quiet "Add a PDF by hand" (70 fills it); every old Intake URL redirects with replace, `selectRowId` carried.
- **The feed:** arrivals grouped by List (a hospital file a heading over its Lists, a PDF one List), each with its source mark, kind and flags; filters in the URL; J and K; beside a docked Workbench on the new shared `WorkbenchSplit`, one stub bench per kind.
- **Underneath:** pure read models, the simulated reader's output (D120), arrivals made by their source, the one List-level decision path (D118), the badge re-based (D125), the Okafor story seeded, the six demo actions (D119), the PWA stand-ins re-pointed, and the old screens and triggers gone.

## Before you start

**Test once, at the very end (D122):** quick checks only; no full gate, review, screen-proof or checklist run. Re-point the Playwright specs this phase moves; don't run them.

**Subagents as much as possible (D121),** each told exactly which files are its own (Work items name them); the session keeps the types, the route block, the decision path, the badge and the joins.

1. **Drift check** against the plan baseline `8637b65`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff EP-02,FT-02.1,US-02.1.1,US-02.1.4,US-02.1.5,EP-14,OQ-109,OQ-13
   ```

   **Stop** if any covered story is Retired or Future, or if a criterion of US-02.1.1 (No import step), US-02.1.4 (Nothing dropped, Grouped by List, By source, Needs NHI and Decided, Unreadable PDF, No NHI, Stub on the List) or US-02.1.5 (Arrives by itself, No silent apply, Inbound only) changes; or if OQ-109's part 2 brings back an import button. An answer to OQ-109 part 1 or OQ-13 is not a stop: build it if it only renames sources or fields, and log it. A wording change to EP-02, FT-02.1 or EP-14 is logged.
2. **Confirm** 45 to 59 DONE in `master`'s `PROGRESS.md` and Wave 6 current (LANES-INTAKE.md "Waves"). Note from the entries:
   - **51:** the Waiting for NHI tab, `matchingAttentionCount` (every open row once), `waitingNhiRows`, the no-List edge, `/admin/patients/waiting`'s redirect.
   - **53 and 58:** the section pattern (`PeopleSection.tsx`, `FinancesSection.tsx` with `financeTabs.ts` in its own file for oxlint, `peoplePaths.ts`, `financePaths.ts`), `FinanceLegacyRedirect` (replace, router state kept) and the route mirror in `src/test/adminRoutes.tsx`.
   - The shipped Intake is catch-up Phases 33, 34 and 40 (`docs/archive/`; read only if a behaviour puzzles you).
3. **Built defaults** (D125 and this doc; each a line on "For the owner's review"):
   - **The badge** (`matchingAttentionCount`, computed from `{ intake }` alone, because `AdminApp.tsx` is frozen): each arriving List with an undecided row not waiting for an NHI, once (unchanged Lists included); each unreadable PDF and held message once until dismissed; each row waiting for an NHI once, dropping by one when the NHI is added.
   - **Left out** is a decision of its own kind, under Decided and in the audit, never a reject.
   - **Removals:** a re-sent rooms' PDF stages one removal row per Booking the rooms brought that it lacks; a hospital List is never checked for missing Bookings; a left-out removal is offered again by a later re-send that still lacks it.
   - **Unchanged (DM-21):** every row is staged, identical ones included; `incomingKey` only stops a second row while an identical one is still open. An identical re-arrival whose earlier rows are all decided is an unchanged List waiting for a person's confirm.
   - **Needs NHI items:** each row waiting for an NHI is its own feed item (a "Waiting" group at the foot of To decide, and alone under Needs NHI); its List carries a "Needs NHI" flag while it is undecided.
   - **Sources:** St George's (HL7 v2) and Southern Cross (FHIR R4) receiving, the rooms' mailbox reading, Forte Health and the other hospitals not connected (their Lists come by PDF); stored and seeded.
   - **The Forte Health sheet** (channel `manualSheet`) becomes a rooms' mailbox PDF; the channel goes if nothing reads it.
   - **The arrival record** is `ImportBatch` extended in place (the name kept so its readers don't churn): its source, received time, `unreadableReason`, `heldReason` and `dismissed`; `importedBy` only for a PDF added by hand. `SurgeonPdfList` stays as the PDF attached to the arrival (70 reads it); its rows land on arrival, with no received-then-sent step.
   - **Data quality:** a display-only flag when an arriving row's patient is in `dataQualityItems` or its ethnicity code fails the same check; Apply code waits for the join's patient page.
   - **A Contract on new Bookings:** `intakeDecide.ts` keeps today's per-row input, picks included; the benches offer none (69, 70).
   - **Filters:** To decide (the default, no parameter), Needs NHI, Rooms PDFs, each connected hospital, Decided, and the search box, as the mock draws them.
   - **Okafor's Slot:** if Dr Rutherford's Wed 25 Nov AM Slot is not free in the core and practice seed, free it with the smallest seed change and log it.
4. **Reads beyond the run-build-phase standard list:**
   - **[LANES-INTAKE.md](../LANES-INTAKE.md), whole:** above all "The file contract 68 sets up", both "Who owns what" tables (what Wave 7 owns, so 68 never builds it) and "Never touched".
   - **Design:** [intake-ideas.html](../../explorations/intake-ideas.html) `#idea1` (A for the feed, the filters, the group headers, the items and the workbench frame; B only for where "Add a PDF by hand" sits), `#reco`, `#journey` (the Okafor story the seed and actions play), `#today` (where each tab goes), `#principles` (docked, not modal; never lose anything; inbound only), `#sources` (the strip and the six actions). The Day view's rail in [Admin Day.dc.html](../../design/Admin%20Day.dc.html) for `WorkbenchSplit`'s docked column; [Design Language.dc.html](../../design/Design%20Language.dc.html) for the source marks' and kinds' pills (status colours only where the token says).
   - **ROADMAP.md:** D117 to D125; the sequencing rules' Intake paragraph (68 the only phase on the shared Intake files); standing rules "Demo triggers" and "PWA parity".
   - **GAP-ANALYSIS.md:** "EP-02" (the rows for the six covered items, and for US-02.1.2, US-02.2.1, US-02.2.3, US-02.1.7 and US-11.1.5 only to see what Wave 7 builds) and "EP-14"; "Structural changes" DM-11, DM-15 and DM-21.
   - **[domain-model-delta.md](../analysis/domain-model-delta.md):** the order of work, DM-11 to DM-17, DM-19 and DM-21 (each "Impact").
   - **Catalogue:** the six covered items in full; [US-02.1.2](../../../requirements-board/requirements/stories/US-02.1.2.md) and [US-02.2.1](../../../requirements-board/requirements/stories/US-02.2.1.md) for the decision path and the reader; [the 26 November note](../../../requirements-board/requirements/notes/2026-11-26-donald-intake-front-door.md) #1 to #8, #11, #14, #16; `domain-model.md` "Booking" (the intake sources paragraph) and "Patient, payer and billable party" (waiting at intake); [AR-21](../../../requirements-board/requirements/artifacts/AR-21.md) `booking-sources`, `hospital-systems`, `surgeons-rooms`.
   - **DECISIONS.md:** honour "Audit is append-only; a save is one change set" (69 rewrites its "applied hospital row"), "IDs are deterministic", "The golden tests pin the seed", "Demo triggers live on their screen", "A PWA stand-in never dead-ends", "Trigger candidates skip the scripted beats", "Real routing in all three apps"; rewrite "Rows waiting for an NHI are Intake's, counted once" (item 10); add one ruling (item 15).
   - **BACKLOG.md:** re-check "Draft update email after S1's import ... Send update repeats" (`store/matchingDemo.ts`): delete it if the retired triggers take both faults, else reword. The matching panel's surgeon line is 69's; the S5 missing-NHI line is 72's.

## Reference

Paths under `aa-prototype/src/`; `screens/`, `components/`, `matching/` and `intake/` paths, and `routes.tsx`, are under `apps/admin/` (the new section is `apps/admin/screens/intake/`).

- **Shell:** `router.tsx` (the Intake block, `/admin/matching`, `/admin/patients/waiting`), `apps/admin/routes.tsx` (`AdminIntakeRoute`, `AdminIntakeRedirect`, `AdminMatchingRoute`, the four tab routes), `test/adminRoutes.tsx`, `screens/IntakeScreen.tsx` (frame and copy to replace), `components/StubResolveLink.tsx` and `screens/AdminBookingDetail.tsx` (`booking-from-hospital-row`) for links.
- **Intake domain:** `domain/intake/matching.ts` (`findMatch`, the row assessment, the noChange classification, `ImportDecision` kinds), `hospitalDownloads.ts` (samples, `NO_NHI_LIST`, `SAMPLE_FORTE_SHEET`), `pdfLists.ts`, `stubs.ts`, `rawRow.ts`; `domain/types.ts` (`IncomingBookingFields`, `ImportRowCorrections`, `ImportDecision`, `ImportRow`, `ImportBatch`, `ImportChannel`, `PdfRowCorrection`, `SurgeonPdfList`, `ListOrigin`).
- **Store:** `matchingActions.ts` (`incomingKey`, `stageImportRows`, `importHospitalDownload`, `decideImportRow`, `DecisionInput`), `matchingSelectors.ts`, `matchingDemo.ts`, `pdfListActions.ts`, `integrationActions.ts` (`integrationActorForHospital`, the dead-letter row, `correctEthnicityCode`), `officeStandIn.ts` (`addNhiAsSimulatedOffice`), `stubSettle.ts`, `mutate.ts` (`withChangeSet` nests: an inner one joins the outer), `selectors.ts` (`dataQualityItems`, read only), `appStore.ts`, `domain/seed/intakeSeed.ts`.
- **Screens kept for Wave 7:** `matching/RowPanel.tsx`, `DiffTable.tsx`, `DecisionCards.tsx`, `RawRowSheet.tsx`, `intake/WaitingNhiView.tsx`, `AddNhiSheet.tsx`, `PdfListReview.tsx`, `PdfUploadDialog.tsx`.
- **Triggers:** `shared/demoTriggers/registry.ts` (`ADMIN_MATCHING`, `ADMIN_PDF_LISTS`, the five retired entries, `matching-office-matches-row`, `matching-raw-row-other-role`), `demoGuideSync.test.ts` (`NOT_SCRIPTED`); `apps/demo/demoScenarios.ts`; `apps/demo/catalogue/AdminCatalogue.tsx`, `admin/patientExamples.tsx`.

## Work items

New files follow LANES-INTAKE.md's file contract; the files below beyond it (`store/intakeDecide.ts`, `domain/intake/stubMatch.ts`, `screens/intake/intakeTabs.ts`, `workbench/newList/AddPdfByHand.tsx`) are 68's too, and LANES-INTAKE.md lists them.

**Session 1 (to the checkpoint)**

1. **Types** (session; `domain/types.ts`, additive): the arrival record on `ImportBatch` (Before you start 3) with `ArrivalSource` (a hospital feed by `hospitalId`, the mailbox with the sender's address, by hand with the person and sender); `{ kind: 'leftOut' }` in `ImportDecision` and whatever row status it needs (every reader of `ImportRow.status` re-checked); `listId` on the match decision (DM-12); a removal row (`removalOfBookingId`); optional `anaesthetist` on `IncomingBookingFields`, resolved to the master as the surgeon is (DM-19); `PdfReadValue` (`confidence`, `box`: page, x, y, width, height) per read field (DM-16); `IntakeSource` and its state in `intake.sources` (DM-14); `ImportRowCorrections.ethnicityCode` and the from, to, who and when history `PdfRowCorrection` keeps (DM-15).
2. **Read models** (one subagent; `domain/intake/` new files, each with its test, exported through `domain/intake/index.ts`; pure, taking state slices; reuse the matcher, the row assessment and the noChange classification, never copy): `arrivals.ts` (arriving Lists: rows of one arrival sharing hospital, day, session and surgeon as sent, a stable key from the arrival id and those four, never parsed; kind: update, newList, cancellation, unreadable, matchesExactly, held, needsNhi; source mark; counts; flags: needsNhi, toCheck, dataQuality, removals; the arrival groups), `listChanges.ts` (added, changed, cancelled, unchanged and removed per List and per Booking), `matchBasis.ts` (surgeon, hospital, day and session each agreed or not, patients found by NHI; no score), `listVersions.ts` (origin plus change history across both sources), `unchanged.ts` (all rows noChange, identical re-arrivals included), `stubMatch.ts` (new, not in the contract: an arriving row matching a waiting stub's List, name and birth date, carrying its NHI; reads `stubs.ts`), `placement.ts` (the named anaesthetist's free Slot first, other free Slots that day, existing Lists, a Draft List; reuse the free-Slot reading the assign flows use), `pdfRead.ts` (the values with confidence and box, `PDF_CHECK_THRESHOLD`, unsure values, a scan's lower confidences, an unreadable PDF's reasons; no vendor anywhere).
3. **`store/intakeSelectors.ts`** (new, with test): the arrivals for a filter and search, one arrival by key, the feed counts per filter, the Decided list.
4. **Routes and paths** (session): `screens/intake/intakePaths.ts` (new, tested): `INTAKE_BASE`, `arrivalsPath({ filter?, q?, item? })`, `sourcesPath()`, the filter values (`needs-nhi`, `rooms-pdfs`, `hospital-<id>`, `decided`; none for To decide) and `intakePathFromLegacy(pathname, state)`: `/admin/intake/matching` to Arrivals with the `selectRowId` row's arrival as `item`, `/waiting` to Needs NHI, `/pdfs` to Rooms PDFs, `/quality` and `/validators` to Arrivals. `router.tsx`'s Intake block: `intake` index (Arrivals), `sources`, and the five old paths plus `/admin/matching` to one `IntakeLegacyRedirect` in `routes.tsx` (replace, state carried); `/admin/patients/waiting` lands on Needs NHI; `SECTION_PATH` untouched. Mirror in `test/adminRoutes.tsx`. Re-point `StubResolveLink`, `AdminBookingDetail`'s hospital-row link and `demoScenarios.ts`'s two paths through `intakePaths.ts`; leave `PdfListReview`'s `MATCHING_PATH` (70's) and the seed's notification path to the redirect.
5. **`shared/surface/WorkbenchSplit.tsx`** (one subagent; new, with test and its `/demo/catalogue/admin` row): a docked, non-modal two-column split at full height (the feed column at the mock's 400px and the workbench), focus and scroll staying in each column, no backdrop or focus trap; takes `shot`, passes `data-*` through; tokens only. Exported from `shared/surface/index.ts`. `SidePanel` untouched.
6. **The section, feed and workbench** (one subagent per file group; `screens/intake/`): `IntakeSection.tsx` and `intakeTabs.ts` (a `fit` `AdminPage`, the title and line from the mock, `LineTabs` Arrivals and Sources, the quiet sources strip with "Inbound only", and the quiet "Add a PDF by hand" `TextAction`, which opens `AddPdfByHand`, a stub 68 creates in `workbench/newList/AddPdfByHand.tsx` with props `{ open, onClose, actor }`, exporting `ADD_PDF_BY_HAND_READY = false`; the action is disabled while that constant is false, so 70 fills the file and flips the constant without editing `IntakeSection.tsx`; no copy about later work), `ArrivalsView.tsx` (the feed in `WorkbenchSplit`, the item in the URL, the first item selected when none), `SourcesView.tsx` (placeholder: the sources read from `intake.sources`, one line each); `feed/IntakeFeed.tsx`, `FeedFilters.tsx` (`FilterPills` with counts, `SearchBox`), `FeedGroupHeader.tsx` (Intake's own, never `GroupRow` or a shared name; note for the join whether it folds into `GroupRow`), `FeedItem.tsx` (every kind, from the read model, `data-arrival-kind`), `SourceMark.tsx`, `useFeedKeys.ts` (J and K, never inside a field); `workbench/Workbench.tsx` (the kind, source and time, title line, dispatcher) and the seven benches, each `{ arrival, actor, onDone }`, a working stub listing the rows read only. Shared components only, no dash in copy, no "slot" or "Card".

   **Checkpoint:** quick checks green, `68 checkpoint:`, the session 1 paragraph.

**Session 2**

7. **Ingest** (one subagent with item 9; `store/intakeIngest.ts` new, tested; `stageImportRows` in `matchingActions.ts`): each action run as its source (the hospital's integration actor; a mailbox actor constant), audited, never deciding: `receiveMailboxPdf` (sender from the email; rows land at once; a re-send stages the removal rows), `receiveHospitalBatch` (every row staged, DM-21), `receiveCancellation`, `receiveFailedMessage` (held with its reason in today's dead-letter shape, so `RawRowSheet` opens it), an unreadable PDF as an arrival with no rows. Re-check every "already received" refusal and `skippedCount` reader. `importHospitalDownload` goes once its callers have moved.
8. **`store/intakeDecide.ts`** (session; new, tested; not in the contract): `decideArrivingLists(api, actor, decisions)`, one or more Lists in one `withChangeSet`, each row `apply` (today's `DecisionInput`, picks included), `leaveOut`, `reject` (reason) or `confirmRemoval` (cancels the Booking through today's cancel action and guards, kept visible, marked cancelled); an optional List-level placement (a Slot, an existing List, a Draft List) turned into today's per-row decisions (the first row makes the List, the rest join it), so 69's `intakeApply.ts`, 70's `intakePlace.ts` and 71's `intakeBulk.ts` only map their bench to it. Returns the change set id and the rows per outcome; refuses as a whole. New audit codes labelled. Tests: a List decided with one row left out is one change set; reject; a removal confirmed; placement in a Slot and as a Draft List; two unchanged Lists confirmed in one change set.
9. **Seed and samples** (with item 7; `domain/seed/intakeSeed.ts`, `hospitalDownloads.ts`): the sources; the Okafor story's patients and the samples the actions play (the four-patient PDF with one no-NHI patient naming Dr Rutherford, the re-send, St George's day-before batch with matches-exactly Lists, the Southern Cross cancellation, the scan, the unreadable page, the failed message); today's seeded stub and PDF re-cast as arrivals by source; one decided arrival so Decided is not empty; the Forte sheet re-cast. Some hospital Lists carry a named anaesthetist. `PERSIST_VERSION` 82 with a comment line; re-pin the seed tests that move; write the `PERSIST_VERSION` line in both notes files (LANES-INTAKE.md).
10. **The badge** (session; `matchingSelectors.ts`): D125's unit from `{ intake }`; a test walking the six actions with the count after each. Rewrite DECISIONS.md "Rows waiting for an NHI are Intake's, counted once" for the Needs NHI filter and this unit.
11. **The six demo actions** (one subagent with item 12; `shared/demoTriggers/intakeArrivals.ts` new, registered in `registry.ts`): Demo triggers below. Re-home every kept trigger on an old Intake route. Run `demoGuideSync.test.ts` to see which old labels the run sheet presses; the action playing that beat keeps the label, the rest go on `NOT_SCRIPTED` with a reason.
12. **PWA stand-ins** (with item 11): `matchingDemo.ts`'s `officeImportsS1File` through `receiveHospitalBatch` and `officeMatchesHospitalRow` through `intakeDecide.ts` (still setting the Contract after); `officeStandIn.ts`'s `addNhiAsSimulatedOffice` staging through the ingest by the List's hospital's source (connected: a hospital batch; otherwise a mailbox PDF), never `manualSheet`. `pwa/officeSimulation.ts` untouched. Their tests green. `matchingDemo.ts` passes to 69 for Wave 7.
13. **Retire and delete** (one subagent; never deferred): the five triggers and the bodies only they used (`receiveTheatreList`, `stageUpdateForBooking`, `theatreListRefusal`, `sendUpdateRefusal`, `updateRowFor`, `updateTarget`, `THEATRE_LIST_SAMPLES`, whatever else is left unused); `IntakeScreen`, `MatchingScreen` (and `MatchingScreen.test`, `MatchingBalance.test`), `MatchingTable`, `ImportDialog`, `PdfListsTab`, `WaitingNhiTab` (its `waitingNhiTab.test.tsx` stays for 72: re-point it at `WaitingNhiView` if it imports the tab, so it compiles and passes), `DataQualityTab`, `ValidatorsTab`; their route components and `store/index.ts` exports. Move what those tests proved into the new tests; fix `ClickableTableRows`, `patients.test`, the trigger tests, `appCopy` and `oneComponentPerJob` (allow-list only shrinks); replace the catalogue rows of the deleted parts and `patientExamples.tsx`. Keep `correctEthnicityCode` and its test; keep the Wave 7 files compiling. Account for every removed `data-shot` (`git diff ... | grep '^-.*data-'`).
14. **Playwright, re-pointed, not run** (one subagent): the nine specs LANES-INTAKE.md names. Only this item may slip to "For the merge", logged.
15. **Finish.** DECISIONS.md gains: "Intake is two views, Arrivals and Sources: one feed grouped by List beside a docked workbench, arrivals made by their source with no import or upload button, every List decided through `intakeDecide.ts` as one change set, every link through `intakePaths.ts`; the old Intake links redirect and stay. Build plan Phase 68 (D117 to D119, D125)." Write the file contract as shipped (files, bench props, read model exports, selectors, ingest and decide signatures, kinds and flags, URL shapes, the six action ids and labels, the retired triggers, the story's seed ids, `PERSIST_VERSION`) in `notes.md` and the progress entry.
16. **Build on the shared components** (every subagent is told this, items 5, 6, 11 and 13 above all): `Button`, `Pill`, `FilterPills`, `SearchBox`, `LineTabs`, `Notice`, `TextAction`, `EmptyState` and the rest of `shared/ui`, `surface`, `table` and `calendar` (read `shared/ui/README.md` first); money, dates and names through `shared/format.ts`. No local `Pill`, `Row`, `Card`, `Th`/`Td`, `BackLink` or `Section`; no raw `<button>`, `<input>`, `<select>` or `<textarea>` with its own style; a gap is a variant or prop defaulting to today's look that matches `docs/design/`, never a copy. `WorkbenchSplit` is the one new shared component; tokens only; no `Date.now()`, `new Date()` or `Math.random()`; every shared component keeps `shot` and `data-*`. `oneComponentPerJob.test.ts` stays green (allow-list only shrinks).

## Demo triggers

On Arrivals ("Admin · Intake · Arrivals"), each run as its source, never the office, each with a disabled reason when it cannot run.

| id (new) | Label (D119) | What lands |
|---|---|---|
| `intake-rooms-email-list` | Rooms email a List | Mr Okafor's PDF, Wed 25 Nov AM, St George's, four patients (one no NHI), naming Dr Rutherford: New List |
| `intake-rooms-resend` | Rooms re-send it | A time change, one added, one missing: Update with a removal |
| `intake-stg-day-before` | St George's sends the day-before List | Okafor's List with fuller wording, an approval number, a time shift and the stub's NHI; plus Lists that match exactly |
| `intake-sx-cancels` | Southern Cross cancels a Booking | One cancellation |
| `intake-scanned-pdf` | A scanned PDF arrives | Choices: a scan with values to check; a page that cannot be read (lands with its reason) |
| `intake-feed-fails` | A feed message fails | A Southern Cross message with no patient, held; also on Sources |

- **Retired:** `matching-receive-theatre-list`, `matching-send-update`, `pdf-list-resend`, `receive-no-nhi-list`, `fire-hospital-message`. `replay-hospital-message` and the `/demo/integrations` screen stay unless they only served the retired one.
- **Re-homed:** `matching-raw-row-other-role` and any other entry on an old Intake route to Arrivals or Sources.
- **PWA:** `matching-office-matches-row`, `stub-office-adds-nhi`, `pwa-office-adds-nhi` keep their labels and work through the ingest and `intakeDecide.ts`.

## Out of scope

- Every bench's real content (69 to 72), Sources' content (71), "Add a PDF by hand" (70), the stub guard and Validators in Help (72), the patient page's data-quality flag (the join).
- The Finances files LANES-INTAKE.md lists; `AdminApp.tsx`, `SideNav.tsx`, `PatientRecord`, `ReviewScreen`, `store/selectors.ts`.
- Capture recipes, ATLAS, the demo guide.

## Manual test checklist

Material for the Wave 7 join's `TEST-68-72.md`. Not run in this phase (D122).

- [ ] `/admin/intake` opens on Arrivals: the feed beside the docked workbench (the page behind stays usable, no backdrop); Sources is the second tab; no Import or Upload button, only "Add a PDF by hand".
- [ ] Each old URL (`/admin/intake/matching` with a row selected, `/waiting`, `/pdfs`, `/quality`, `/validators`, `/admin/matching`, `/admin/patients/waiting`) lands where D117 says, with replace; Back does not loop; the Intake nav entry still opens Arrivals.
- [ ] Filters To decide, Needs NHI, Rooms PDFs, St George's, Southern Cross and Decided each narrow the feed and survive a reload; J and K move the selection, not while typing in search.
- [ ] Play the six actions in order: each lands as its kind with its source mark (New List with Needs NHI 1; Update with a removal; St George's file as a heading over an Update and Lists that match exactly; Cancellation; a scan with values to check and an unreadable page with its reason; a held message). The badge moves by the numbers in the progress entry.
- [ ] A row with an unrecognised ethnicity code shows the data quality flag; nothing on the arrival can apply a code.
- [ ] Handset: "Hospital file imported and my booking matched", "Office adds the NHI to this stub" and "Office adds the NHI" still work.
- [ ] `/demo/catalogue/admin` shows `WorkbenchSplit` and no row for a deleted part.

## Demo guide updates

None (D119). Keep `demoGuideSync.test.ts` green. **For the sweep**, in the progress entry: the recipes on Matching, the import dialog, PDF lists, Waiting for NHI, Data quality and Validators; ATLAS's Intake routes; the captions on US-02.1.1, US-02.1.2 ("Choose Contract"), US-02.1.4, US-02.2.1 and US-02.6.1; the guide's intake beats and any old label kept for them; `demoScenarios.ts`'s beat labels.

## Adversarial review (at the Wave 7 join)

- The ingest never decides and never runs as the office; nothing is applied before a decision; nothing is sent back.
- Every List decision is one change set through `intakeDecide.ts`; left out is its own kind; no second decision path in a lane.
- The badge: D125's unit from `{ intake }` alone; a waiting row counted once and never on Patients.
- Redirects with replace and `selectRowId` carried; `SECTION_PATH` untouched; no Finances file touched.
- `WorkbenchSplit` is non-modal and the one new shared component; a new private copy of a shared component (`GroupRow`, `SidePanel`, `Pill`, `Row`, table cells, buttons) is a finding; no vendor named; no hook lost with a deleted screen.

## PROGRESS.md updates

- **For the owner's review:** Before you start 3's defaults, the badge numbers through the story, which old labels the actions kept.
- **For the sweep:** Demo guide updates' list.
- **For the merge:** files touched beyond LANES-INTAKE.md's contract list (the "Who owns what in Wave 6" row names each: `hospitalDownloads.ts`, `officeStandIn.ts`, `StubResolveLink.tsx`, `AdminBookingDetail.tsx`, `demoScenarios.ts`, `test/adminRoutes.tsx`, `shared/surface/index.ts`, and `stageImportRows` in `matchingActions.ts`); the data-quality flag on `PatientRecord` with Apply code; whether `FeedGroupHeader` folds into `GroupRow`; any Playwright spec suspected to break.
- Status row and entry: drift check against `8637b65`; D117 to D125 as built; the file contract as shipped (also in `notes.md`); tests added; `PERSIST_VERSION` 82. Handoffs: 69 to 72 fill their benches and map to `intakeDecide.ts`; `matchingDemo.ts` to 69; `officeStandIn.ts` to 72.
- Decisions log: Intake's two views, arrivals by source, one decision path, the badge's unit (also in `docs/DECISIONS.md`).
