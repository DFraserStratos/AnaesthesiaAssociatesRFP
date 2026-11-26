# Phase 71 · Sources and confirming unchanged Lists

**Requirements covered:**
[US-02.1.7](../../../requirements-board/requirements/stories/US-02.1.7.md) See each source's state (status 3, graded **Missing**, size M: no Sources view, no per-source receiving, last-sent or today's count, no held-with-reason list, no not-connected listing, no inbound-only line). Built whole.
[US-02.1.6](../../../requirements-board/requirements/stories/US-02.1.6.md) Confirm unchanged Lists together (status 3, graded **Partial**, size M: a row with no difference is classed No change and marked matched one at a time; no unchanged-Lists grouping, no one-click confirm). Built whole.
[DM-14](../analysis/domain-model-delta.md) A source is an entity with a state (stored `connected` and `receiving`, seeded by 68; last sent, today's messages and what each became derived from arrivals). The derived half is built here.
[DM-21](../analysis/domain-model-delta.md) Identical re-arrivals shown as unchanged Lists, not skipped (68 stages them, D124; 71 shows and confirms them).
**Answered, built as answered** (owner, 26 November, for the build, not yet seen by AA): D117 (two views; the matches-exactly and held-message benches), D118 (confirming unchanged Lists is one change set), D119 (the sixth demo action, 'A feed message fails', also on Sources), D121 and D122 (lanes; test once), D123 (the Wave 5 boundaries), D124 (this phase's stories and files), D125's unchanged reading (an identical re-arrival whose earlier rows are all decided still waits for a person's confirm).
**Open, built to a default:** [OQ-109](../../../requirements-board/requirements/questions/OQ-109.md) part 1 (which hospitals are connected): St George's and Southern Cross connected and receiving, the rooms' mailbox reading, Forte Health and the other hospitals listed as not connected with their Lists coming by PDF to the mailbox, all as 68 seeded them (D125). No captions.

**Depends on:** 68 (the routes, `SourcesView.tsx` stub, the two bench stubs, the read models, arrival records and source state, `intakeDecide.ts`, the seed, the six demo actions), complete on `lane/d`.
**Estimated:** 1 session.

**Runs in:** Lane F of the Intake build lanes, Wave 7 ([LANES-INTAKE.md](../LANES-INTAKE.md)), alongside 69, 70 and 72, which share no file with it. It owns the files LANES-INTAKE.md lists for Lane F, plus the held-message dismiss and the raw-view target below. The owner tests 71 once, with 68 to 72, from `TEST-68-72.md` after the join.

## Goal

The office sees each source's state in Intake's second view, and confirms the Lists that match exactly together. Layout: [intake-ideas.html](../../explorations/intake-ideas.html) `#sources` (section 8: the Sources view and its message table), `#idea1` (matches exactly in the feed) and `#reco`.

- **Sources view** (`/admin/intake/sources`, 68's route): the line "AA reads from these sources and never writes back to them" as a `Notice` at the top, then one row per source: St George's and Southern Cross (connected), the rooms' mailbox (reading). Each shows whether it is receiving, when it last sent (a time today, else the date), how many messages came today and what each became (a new List, an update, a cancellation, unchanged Lists, held, as counts), and a held count. Then Today's messages, a table (Received, Source, Message, Became, State) with one row per message: five messages today read as five rows. Then each source's anything-held list: the message, the reason and View raw. Last, the hospitals not connected (Forte Health among them), each with "Not connected" and "Lists come by PDF to the mailbox". No retry, alert or write-back control anywhere (US-14.5.1 is Future Work).
- **Matches-exactly bench** (`workbench/MatchesExactlyBench.tsx`): the arrival's Lists that match what AA holds with no difference, listed (hospital, day, session, surgeon, Bookings count), a primary **Confirm unchanged (N)** and a one-line explanation that nothing on the schedule changes. One click decides all N Lists as one change set, changing no List or Booking. Never automatic: they wait until a person confirms. A List with any difference is not in this bench; it is decided on its own in 69's or 70's.
- **Held-message bench** (`workbench/HeldMessageBench.tsx`): the message, its source, its reason, View raw (restricted), and Dismiss with a reason. A dismissed message leaves Intake's count (D125) and shows under Decided.

## Before you start

**Test once, at the end (D122).** Finish on the quick checks only: `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed` and `npm run lint` in `aa-prototype/`. No full gate, adversarial review, screen-proof or checklist run: the Wave 7 join does them.

1. **Drift check** against the plan baseline `8637b65`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-02.1.7,US-02.1.6,US-02.1.2,US-02.1.4,US-14.5.1,OQ-109
   ```

   Re-read anything changed after `8637b65`. Stop and tell the user if US-02.1.7 or US-02.1.6 is Retired or Future, or if the Each source, Today's messages, Held with the reason, Not connected, Inbound only, Shown as unchanged, One click or Not automatic criteria change. An answer to OQ-109's part 1 is not a stop: log it, and a change of which hospitals are connected is seed content (note it for the join).
2. **Confirm** 68 DONE and `68 complete:` merged into `lane/f` (LANES-INTAKE.md's sync). Read its PROGRESS entry and `notes.md` (the file contract as shipped), and note:
   - **68:** the source record (its id, `connected`, `receiving`, last-sent, where it lives in `AppState`); the arrival record (its source, received time, kind, rows, and what it "became"); the held-message record (its reason, whether it has a raw payload and an id `RawRowSheet` can take, its dismissed state); the arrival kinds and the unchanged-List read model (`domain/intake/unchanged.ts`); `intakeDecide.ts`'s List-level path and the decision it uses for a row that matches with nothing to change; `intakeSelectors.ts`'s exports; the `{ arrival, actor, onDone }` bench props; how `SourcesView.tsx` and the two bench stubs were left; the ids and screens of 'A feed message fails' and 'St George's sends the day-before List'; where `matching-raw-row-other-role` was re-homed and which row it targets; whether `processMessage` is still called by anything beyond `/demo/integrations`.
3. **Built as answered, no label:** the Sources view and its measures, the two benches, one change set for Confirm unchanged, never automatic, inbound only.
4. **Open or chosen here, built to a default** (each a line on the owner's review list, none gets a caption):
   - **"Today" is the demo day** (`DEMO_TODAY` through the demo clock, never `Date.now()`); a message counts by its received time's date; the table lists today's only.
   - **What each message became**, from 68's arrival kind: New List, Update, Cancellation, Unchanged (N Lists), Held; a hospital file is one message row ("6 Lists for Wed 25 Nov") with its mix in Became; State reads Waiting on you, Decided, or Held until dismissed.
   - **Receiving** is the stored flag; **last sent** is the newest arrival's time for that source; a source with none reads "Nothing received yet". No quiet-source alert or threshold (Future Work); no control that switches a source.
   - **Held and unreadable.** Under a source: held messages only (a Southern Cross message with no patient). An unreadable PDF is 70's bench and shows under the mailbox as read-failed with its reason and no raw view (a PDF has none); a dismissed one drops from the list but stays in Today's messages as Dismissed.
   - **The raw view** is `RawRowSheet`, imported unchanged (`apps/admin/matching/RawRowSheet`, props `rowId`, `patientName`, `actor`, `onClose`) and nothing else from `apps/admin/matching/`. `rawRowActions.ts` makes a held message eligible while it is held and undismissed, keeping `viewRawImportRow`'s and `rawRowTarget`'s signatures, the office-only rule, the reason, the masking and the audit, and `rawRowTarget` also finds the oldest held message so the harness entry works on Sources and Arrivals. If `RawRowSheet` cannot take a held message unchanged, build the smallest adapter in `rawRowActions.ts` and note it for the join; never edit `RawRowSheet` (69 keeps it).
   - **Dismiss with a reason.** If 68's `intakeDecide.ts` (or notes) ships a dismiss for a held message, call it; otherwise build `dismissHeldMessage` in `intakeBulk.ts`: office only, a reason required, one audited change set, setting 68's dismissed state and nothing else. Note it for the join.
   - **Confirm unchanged** is `confirmUnchangedLists(api, actor, arrivalId)` in the new `store/intakeBulk.ts`, calling 68's `intakeDecide.ts` once over every unchanged List of the arrival with the row decision 68 uses for "matches, nothing to change", in one `withChangeSet`, audited; it refuses an arrival with none and any List that is not unchanged (re-checked at the click, so a List that gained a difference since is skipped and named). It never runs from an ingest or a demo action.
   - **Identical re-arrivals** wait, as D125 says: if an arrival's unchanged Lists do not reach the feed, note it for the join and do not edit 68's ingest.
   - **The simulator.** `integrationActions.ts` changes only to hand Sources a processed message through 68's ingest if `processMessage` is still reachable from the simulator and 68 did not already; the default is no change. `correctEthnicityCode` and every exported signature stay unchanged (the join's patient-page flag calls it). `/demo/integrations` stays Future scope.
5. **Reads beyond the run-build-phase standard list:**
   - **[LANES-INTAKE.md](../LANES-INTAKE.md), whole first** (it overrides the prompt, the skill and CLAUDE.md): "How a lane session runs", "Who owns what in Wave 7" (Lane F's row), "Never touched".
   - **Design:** [intake-ideas.html](../../explorations/intake-ideas.html) `#sources` (the source rows, the message table, the six actions, the table's Became and State wording), `#idea1` (Lists that match exactly in the feed, the bench) and `#reco`; `docs/design/` Admin pages for table, Pill and rail patterns (Admin Review, Admin Day).
   - **ROADMAP.md:** D117 to D119, D121 to D125; the sequencing rule that names 71 (own files, `RawRowSheet` unchanged, `correctEthnicityCode` kept); the OQ-109 row.
   - **GAP-ANALYSIS.md:** the US-02.1.7 and US-02.1.6 rows; the EP-02 table's 71 entries.
   - **Catalogue:** US-02.1.7 and US-02.1.6 in full; [domain-model-delta.md](../analysis/domain-model-delta.md) DM-14 and DM-21 (Impact and Verified lines); `domain-model.md`'s "Matching screen" glossary row and the hospital-integrations row (AA only reads and never writes back); [AR-21](../../../requirements-board/requirements/artifacts/AR-21.md) regions `hospital-systems` and `other-hospitals`; OQ-109.
   - **DECISIONS.md:** line 14 (a save is one change set; 69 rewrites it), "Controls stay buttons" (Dismiss, View raw and Confirm are buttons). Supersedes none.
   - **BACKLOG.md:** closes none; add a line for anything left (the quiet-source switch, hospital connection state beyond the seed).
   - **PROGRESS.md:** 68's entry (on `lane/f` after the sync), for the names in item 2.
   - **Code, by grep:** `store/rawRowActions.ts` (`viewRawImportRow`, `rawRowTarget`, `rawRowEligible`), `apps/admin/matching/RawRowSheet.tsx`, `store/integrationActions.ts` (`processMessage`, `correctEthnicityCode`), the masking in `domain/privacy/mask.ts`, `shared/format.ts` time and date helpers.
   - **Parallel reads (D121), one subagent each, reporting names and file:line only:** (a) 68's shipped contract (`notes.md`, the source, arrival, held and unchanged shapes, `intakeDecide.ts`); (b) `rawRowActions.ts`, `RawRowSheet.tsx` and their tests, and the `matching-raw-row-other-role` trigger; (c) `integrationActions.ts`, its test and its callers; (d) `shared/ui`, `shared/table` for the table and rail parts. The session decides.

## Reference

- **Code (68's):** `screens/intake/SourcesView.tsx` (stub), `workbench/MatchesExactlyBench.tsx` and `HeldMessageBench.tsx` (stubs), `domain/intake/arrivals.ts` and `unchanged.ts`, `store/intakeSelectors.ts`, `store/intakeDecide.ts`, `domain/seed/intakeSeed.ts`.
- **Code (71's):** `store/rawRowActions.ts`, `store/integrationActions.ts`, `apps/admin/matching/RawRowSheet.tsx` (imported unchanged).
- **Tests:** `rawRowActions.test.ts`, `integrationActions.test.ts` (kept green); new tests below.

## Work items

Own files (LANES-INTAKE.md Lane F): `screens/intake/SourcesView.tsx` and new `screens/intake/sources/`, `workbench/MatchesExactlyBench.tsx`, `workbench/HeldMessageBench.tsx`, new `domain/intake/sources.ts`, new `store/intakeBulk.ts`, `store/rawRowActions.ts`, `store/integrationActions.ts`. Add-only to the shared files LANES-INTAKE.md lists (`domain/intake/index.ts`, `store/index.ts` exports, audit labels, `AdminCatalogue.tsx` rows). Never edit 68's files.

1. **Source measures** (new `domain/intake/sources.ts` with `sources.test.ts`; pure, no React or store): from 68's sources and arrivals and the demo day, `sourceRows` (receiving, last sent, today's count, what each became, held count), `todaysMessages` (one per message, newest first, with Became and State), `heldBySource` and `notConnected`. Tests from the stories: three sources each with receiving and last sent; five messages today shown as five with what each became; a held message under its source with its reason; a hospital not connected; yesterday's messages not counted.
2. **The Sources view** (`SourcesView.tsx` and `screens/intake/sources/`: `SourceRow`, `TodaysMessages`, `HeldBySource`, `NotConnected`): per Goal, from item 1 through 68's selectors and the shared `Notice`, `Pill`, `Card`, `RailSection`/`DefList`, `TableShell`, `EmptyState`, `Button`/`TextAction`; hooks `shot` on each part and `data-shot="intake-sources"` on the view; no private Pill, Row or Card. An empty state where nothing came today. A test: the inbound-only line shows; a not-connected hospital shows; a held message's reason shows with View raw.
3. **Confirm unchanged** (new `store/intakeBulk.ts` with `intakeBulk.test.ts`): `confirmUnchangedLists` per Before you start 4. Tests: four unchanged Lists and a fifth with a difference, the four shown unchanged (through `unchanged.ts`) and the fifth not; one confirm decides all four and changes no List, Booking or Slot (state outside the intake slice and audit deep-equal); one change set; unchanged Lists wait until confirmed (nothing decides them at ingest); an identical re-arrival whose earlier rows are all decided is still waiting; refuses another role and an arrival with none.
4. **The matches-exactly bench** (`MatchesExactlyBench.tsx`): the list and Confirm unchanged (N) per Goal, calling item 3, `onDone` after; `data-shot` hooks on the list and the button; the count in the button is the number of Lists shown.
5. **The held-message bench and the raw view** (`HeldMessageBench.tsx`, `rawRowActions.ts`, and `dismissHeldMessage` if needed): per Goal and Before you start 4; tests: View raw is refused and audited for another role (the existing `matching-raw-row-other-role` case still passes), allowed for office with a reason, masked; a held message is eligible while held and undismissed; Dismiss needs a reason, is one audited change set, and removes it from Intake's count.
6. **Specs and rows:** re-point the Playwright steps this phase's screens change (`admin-matching` and `intake-pdf-lists` are 68's; add Sources steps to the spec 68 left for it, only your own cases), not run. Add or update `/demo/catalogue/admin` rows only for new shared parts (none expected: no new shared component or variant).
7. **Build on the shared components.** Every part of the Sources view and the two benches uses the shared `Notice`, `Pill`, `Card`, `RailSection`/`DefList`, `TableShell`, `EmptyState`, `Button`/`TextAction` and `shared/surface` (src/shared/ui, surface, table; read its README first); extend with a variant or prop that matches `docs/design/` if one is short, never copy; no private `Pill`, `Row`, `Card`, `Th`/`Td`; no raw `<button>` with its own style (oneComponentPerJob.test.ts); shared components keep `shot` and `data-*`.
8. **Finish** on the quick checks (D122). No en or em dashes, "slot", "swap", "timesheet", phase numbers or vendor name in copy; Booking never Card; tokens only; teal the only action colour, crimson never. No seed change and no `PERSIST_VERSION` bump.

**Subagents (D121):** after the reads, one for items 1 and 2 (the Sources view and its measures), one for items 3 and 4 (`intakeBulk.ts` and the matches-exactly bench), one for item 5 (the held-message bench and the raw view), each told exactly which files are its own; the session keeps the contract with 68, the joins, the specs and the checks.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| 68's 'A feed message fails' (also on Sources) | as 68 registered | Admin, Intake, Arrivals and Sources | bar | a Southern Cross message with no patient is held with its reason; shows under Southern Cross on Sources | as 68 |
| 68's 'St George's sends the day-before List' | as 68 registered | Admin, Intake, Arrivals | bar | the day-before batch: the update plus Lists that match exactly, confirmed together here | as 68 |
| `matching-raw-row-other-role` (re-homed by 68) | as registered | Admin, Intake | bar | shows the restricted raw view as another role (refused, audited) | as today |
| (product) | Confirm unchanged, View raw, Dismiss | Intake | none | normal use | |
| PWA | none (Admin only) | | | | |

No new trigger; the registry is 68's. A need for one goes in `notes.md` for the join.

## Out of scope

- Retry, alerting and the adapter matrix (US-14.5.1, Future Work), a control that switches a source on or off, the HL7 and FHIR simulator at `/demo/integrations` (Future scope), any write to a source.
- The update, new List, unreadable PDF and Needs NHI benches (69, 70, 72), 68's files (routes, `IntakeSection.tsx`, the feed, `Workbench.tsx`, read models, ingest, selectors, seed, registry), `RawRowSheet` (69 keeps it; edited by nobody here), `PatientRecord`'s data-quality flag and `correctEthnicityCode`'s callers (the join), the Finances files, seed and `PERSIST_VERSION`, capture recipes, ATLAS and the demo guide (the owner's sweep).

## Manual test checklist

Material for the Wave 7 join and `TEST-68-72.md`. Do not run it in this phase (D122).

- [ ] Intake, Sources: St George's and Southern Cross connected and receiving, the rooms' mailbox reading, each with its last sent; Forte Health and the other hospitals listed as not connected; the line that AA only reads and never writes back; no button that writes to a source.
- [ ] Today's messages lists each message once with what it became; play 'A feed message fails': a held message appears under Southern Cross with its reason, never dropped, and Intake's badge goes up by one.
- [ ] View raw on the held message asks for a reason and shows the masked payload; the other-role action is refused and audited.
- [ ] Dismiss the held message with a reason: it leaves the badge and shows as Dismissed.
- [ ] Play 'St George's sends the day-before List': its Lists that match exactly open the matches-exactly bench with their count; Confirm unchanged (N) decides them all at once, and no List or Booking changes; they never confirm by themselves, and a List with a difference is decided on its own.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS. Keep `demoGuideSync.test.ts` green. **For the sweep**, list in the progress entry: the Sources view and the matches-exactly bench (new screenshots); US-02.1.6's and US-02.1.7's capture steps; any guide line naming a per-row "matched, nothing to change" step.

## Adversarial review (at the Wave 7 join)

Steer for the join's one review of 68 to 72; not run in this phase.

- **Confirm unchanged.** One change set over the unchanged Lists, audited; no List, Booking or Slot changes; never run by an ingest or a demo action; a List that gained a difference since is not confirmed; an identical re-arrival still waits.
- **Sources.** Counts on the demo clock, never `Date.now()`; five messages read as five; held under the right source with its reason; not-connected hospitals listed; inbound only stated and nothing writes to a source.
- **Raw view.** Office only, a reason, masked and audited per view; another role refused and audited; `RawRowSheet` untouched; `correctEthnicityCode` and the simulator unchanged.
- **Own files.** No edit to 68's files or the Finances files; shared components used, and a new private copy of a shared component (Pill, Card, Row, table cells, button) is a finding; no vendor name in copy.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (today on the demo clock; what each became; receiving and last sent, no quiet alert; held and unreadable under their source; the raw view through `RawRowSheet`; Dismiss with a reason; Confirm unchanged and its re-check; the simulator unchanged), plus OQ-109's part 1 as built.
- **For the sweep:** the list under Demo guide updates.
- **For the merge:** a field, filter or trigger needed in 68's files, if unchanged Lists do not reach the feed, a dismiss path 68 lacked, and that `RawRowSheet` is now used by 71 (the join deletes it only if nothing uses it).
- Status row and phase entry: drift check against `8637b65`; the names from 68 this phase used; the names it ships (`domain/intake/sources.ts`, `store/intakeBulk.ts`, `confirmUnchangedLists`, `dismissHeldMessage` if built, the Sources parts); tests added; `PERSIST_VERSION` (unchanged); BACKLOG lines added. Decisions log: Sources derive from arrivals and the stored state; Confirm unchanged is one change set and never automatic. Then the lane steps in LANES-INTAKE.md: the `71 complete:` commit, the status file and the `notes.md` entry.
