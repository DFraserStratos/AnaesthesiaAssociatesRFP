# Phase 33 · Hospital download and the matching screen

**Requirements covered:**
[EP-02](../../../../requirements-board/requirements/stories/EP-02.md) Booking intake and change handling (the hospital-download source and "applied with its source recorded: a new Booking goes onto its List, and an update edits the existing Booking"; Confirmed) ·
[FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md) Hospital booking download and matching screen (Verify) ·
[US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md) Import hospital bookings (Confirmed; retitled 2026-10-02: the system imports hospital bookings "however each hospital provides them", not a file or a download) ·
[US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) Match rows to Lists and Bookings (Confirmed; "create a Draft List when nobody is assigned yet" is now its own decision) ·
[US-02.1.3](../../../../requirements-board/requirements/stories/US-02.1.3.md) Show differences on match (Confirmed, was Proposed; an update to an already matched Booking still goes through this approval) ·
[US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) Unmatched queue (Confirmed) ·
[FT-02.5](../../../../requirements-board/requirements/stories/FT-02.5.md) Change types and audit (Confirmed: every inbound change classified before it is applied, then applied with source and history; here the office applies it) ·
[DM-34](../analysis/domain-model-delta.md#dm-34) Intake: import rows, admin match/create/reject decisions, unmatched queue (the row, decision and queue half; bringing the two hospitals' rows in is Phase 34, with no sync state now that US-02.1.5 dropped it) ·
[RV-13](../analysis/reverse-check.md#rv-13-hospital-messages-create-and-change-bookings-with-no-admin-matching-step) Hospital messages create and change Bookings with no admin matching step (Rework) ·
[RV-28](../analysis/reverse-check.md#rv-28-automated-modification-reschedule-and-cancellation-from-hospital-messages-is-shown-working-and-with-the-wrong-clash-rule) Automated modification, reschedule and cancellation from hospital messages is shown working (Hide from demo: the canned S13 to S15 messages stage rows and never apply themselves, and stay out of the scripted demo).
Also touches, without closing:
[US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) (at 3d3a18c its only criterion is "No silent apply", met here for every row that arrives; the schedule, pull-on-open, sync-button and last-synced criteria were dropped on 2026-10-02; bringing St George's and Southern Cross rows in without a hand import is Phase 34),
[US-02.5.1](../../../../requirements-board/requirements/stories/US-02.5.1.md), [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md), [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md), [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) and [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md) (moved to the Future Work swimlane on 2026-10-02: they are now the **automated** path, a change from an integration applied with no admin deciding it, with [US-14.6.2](../../../../requirements-board/requirements/stories/US-14.6.2.md). This phase builds none of it. The office-decided Modification, Reschedule and Cancellation on the matching screen are US-02.1.2, US-02.1.3 and FT-02.5's; their capture recipes become partial analogues, see Catalogue screenshots),
[US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md) (Matches; "every entry records its source": a decided row's History line names the office who applied it and the hospital row it came from),
[US-01.6.1](../../../../requirements-board/requirements/stories/US-01.6.1.md) (Confirmed 2026-10-02, the four attributes stay required: a Draft List created from a hospital row, with hospital, surgeon, day and session, holding the row's Booking; the Draft List itself is Phase 31),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (a created Booking takes the default Contract; the rule is Phase 20's, and the Contract defines the billable party, D17, Phase 21's; OQ-78, whether default Contracts stay, is Open and Phase 20's to carry),
[US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md) (the unpaid-balance alert "at Booking create or match": mild under and strong over the threshold counted from the invoice date, mild for a credit balance (D24), never a block; Phase 40 registers it as a rule in Phase 15a's warning routine and shows it on this screen),
[DM-03](../analysis/domain-model-delta.md#dm-03) (a Draft List can hold Bookings; "a matching-screen row can create one"),
[DM-12](../analysis/domain-model-delta.md#dm-12) (insurer and funding source on neither the Booking nor the Patient, so a row's payer details are shown, never stored),
[RV-05](../analysis/reverse-check.md#rv-05-admin-integrations-monitor-presents-future-reliability-tooling-dead-letter-queue-retries-per-hospital-mapping-as-product) and [RV-06](../analysis/reverse-check.md#rv-06-hl7-to-fhir-simulator-live-drip-and-scenario-s1-built-on-them) (the HL7/FHIR tooling keeps Phase 14's Future-scope badges; Phase 34 demotes it).
**Open questions:** [OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md) (how each hospital provides its bookings, their fields and cadence; still Open at 3d3a18c, with Stratos Tech to ask. US-02.1.1's note now gives it to the integration team and says a download holds only for HL7 v2, while FHIR is a REST interface, so the story speaks of importing bookings. The 2026-10-01 meeting added that two HL7 hospitals may not send the same shape, that the download is not comprehensive, so the theatre list is still needed for the insurer or Contract, and that the first release may need matching like the current system). [OQ-87](../../../../requirements-board/requirements/questions/OQ-87.md) (the automated reschedule rules, Open) belongs to US-02.5.2's Future Work and is not built. [OQ-34](../../../../requirements-board/requirements/questions/OQ-34.md) is Answered (the hospital download carries the most bookings) and is why this screen is the priority pathway.
**Answered and built as answered:** [OQ-44](../../../../requirements-board/requirements/questions/OQ-44.md) (2026-10-01: a Draft List is a List with no anaesthetist; hospital, surgeon, day and session are all required, which US-01.6.1 confirmed on 2026-10-02; Bookings can be added before an anaesthetist is assigned; an unfilled one is removed or re-dated, US-01.6.4; only the office assigns it). OQ-44's answer, and US-01.6.1's note, left creating a Draft List from the matching screen "for later"; US-02.1.2 (Confirmed) lists it as one of the row decisions, so it is built on US-02.1.2's authority, with OQ-44's contents rule: "Create a Draft List" saves all four fields and puts the row's Booking on the new Draft List in the same decision. [OQ-55](../../../../requirements-board/requirements/questions/OQ-55.md) (owner decision D2: insurer and funding source are on neither the Booking nor the Patient; the Contract says who pays), so a row's insurer or funder is shown beside the Procedure's Contract and the admin may pick another Contract; nothing is written to a Booking insurer field. [OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) (D17: the Contract always defines the billable party), so a row never sets a billable party; the Booking it creates follows its Contract like any other. [OQ-52](../../../../requirements-board/requirements/questions/OQ-52.md) (the HPI CPN is the surgeon's unique index), so a row's surgeon resolves by HPI CPN first, then by name.
**Depends on:** Phase 20 (one Contract per Procedure, `defaultContractForBooking` and `createBooking`'s default-at-creation rule, `contractOptionsFor` and the guarded `setProcedureContract`; no Booking `insurerId` or `fundingSource`, per D2) and Phase 31 (Draft Lists with the four required fields that hold Bookings, the pairing rule and Phase 30's conflict raising on every path). Through them: Phase 14 (built: the demo-trigger registry, `useDemoTriggerContext`, `OFFICE_SIMULATION_ACTOR` in `store/demoActors.ts`, `store/officeStandIn.ts`, the PWA demo sheet and the Future-scope badges), Phase 15 (built: Booking vocabulary and `Booking.source`, whose `hospitalDownload` value the HL7/FHIR path stamps as an interim "until Phase 33", `integrationActions.ts` :161), Phase 15a (the warning routine: a Booking created or changed from a row shows its warning triangle and its warning on opening, like any other), Phase 17 (the surgeon master with `hpiId`, the HPI CPN, and the blacklist warning inside List assignment), Phases 19 and 19a (the Procedure master, and base units read from the procedure's default RVG Contract, via 20) and Phase 28 (Slots, `assignListToSlot`, `placeListOnSlot`, `slotFor`/`listInSlot`, and the S12/S13 park-on-no-List seam, which this phase replaces, together with Phase 31's interim `pairingIncomplete` park if 31 left one). **Not guaranteed before 33** (outside its dependency chain, though normally done first by number): Phase 21 (the Contract-defined billable party), Phase 23 (the primary Procedure) and Phase 25 (the AUTHORISED lock). Where a work item names them, use them if DONE; otherwise a procedure change edits the Booking's first Procedure and the AUTHORISED refusal is today's `editRefusal` `listAuthorised`. Record which in the drift-check result. First phase of the Intake track; 34 and 35 build on it.
**Estimated:** 2 sessions. Session 1 is the model, the pure matcher, the fixtures, the store actions and the HL7/FHIR re-route, re-greened (work items 1 to 9): after it the demo still works, because the Integrations monitor shows each message as "Sent to matching", and a temporary check in `demoScenarios.test.ts` drives S1 through the store. Session 2 is the Admin matching screen, the triggers and PWA stand-in, Playwright, capture recipes and the demo guide (work items 10 to 17).

## Goal

Today a hospital booking reaches the schedule only as a simulated HL7 v2 or FHIR message, and
`processMessage` applies it at once: it creates, moves, edits and cancels Bookings as an
`integration` actor, and parks only what it cannot apply (RV-13). The canned S13, S14 and S15
messages show automated reschedules, modifications and cancellations working, which the catalogue
now puts in Future Work (US-02.5.1 to US-02.5.4, US-14.6.2; RV-28). There is no hospital import, no
matching screen, no field diff and no way for the office to say "not this one". The catalogue
reverses that. Importing hospital bookings is the priority pathway (OQ-34), every row gets an admin
decision, an update to an already matched Booking goes through the same approval with its
differences shown (US-02.1.3), and nothing reaches a Booking until an admin decides (US-02.1.5
"No silent apply").

This phase:

- adds a staged **intake model**: an `ImportBatch` (one hospital import, one manual sheet, or one
  feed message) holding `ImportRow`s, each carrying the hospital's incoming fields, its status
  (open, applied, rejected) and, once decided, the admin's **decision**: match to a Booking and
  apply, create a Booking on a List, create a List in an anaesthetist's Slot, create a Draft List
  that holds the row's Booking (US-02.1.2's own decision; its contents per OQ-44, answered), or reject;
- adds one **pure matcher** (`src/domain/intake/`) that, for each open row, finds the Booking or
  List it belongs to, classifies the change in plain language (**New, Modification, Reschedule,
  Cancellation**, or **No change**; FT-02.5), lists the **field-level differences** (US-02.1.3),
  and suggests a decision. Suggestions are derived at read time and never stored, so they never go
  stale. A row the matcher cannot place is **unmatched** and stays in the unmatched queue until
  someone decides (US-02.1.4). A later row for an appointment already matched finds the Booking the
  earlier decision created or changed and is diffed and approved like any other;
- adds an Admin **Matching** screen in the Admin Review pattern, with a product **Import hospital
  bookings** control (US-02.1.1's title) whose picker offers four labelled samples (St George's, a
  later St George's update, Southern Cross and a manual sheet from Forte Health) while how each
  hospital provides its bookings is still open (OQ-13);
- applies a decision only through the existing guarded write paths, as the office actor, with the
  Booking's source (`hospitalDownload`) and a Booking-side history row naming the hospital row, so
  "applied with its source and history recorded" (FT-02.5, EP-02) is visible on the Booking;
- widens what a Modification row can change to patient (name, date of birth), procedure
  (description and code) and the Contract as well as time and note (US-02.1.3: "time, patient or
  procedure"), and appends a hospital note instead of overwriting the Booking's own notes. Per D2
  the hospital's insurer or funder is never stored on the Booking: the row shows it beside the
  Procedure's current Contract, and the admin may pick another Contract from Phase 20's picker as
  part of the decision. A row never sets a Contract by itself (US-04.3.6 is Future Work);
- lets the admin match a Reschedule row onto any List at the row's hospital, date, session and
  surgeon, including another anaesthetist's, and **parks** a reschedule to a date with no List as
  unmatched rather than silently retiming it in place (US-02.1.4: nothing is dropped); the admin
  resolves it by creating a List in an anaesthetist's session (a Slot) or a Draft List there, and the Booking moves onto it.
  US-02.5.2's automated rule (a clash accepted and turned into a Draft List with no admin) is Future
  Work and not built;
- re-routes the HL7/FHIR simulator: a parsed message, the canned S13 to S15 included, now lands as a
  row on the matching screen and applies nothing (RV-13, RV-28), and `manualIntervention` is
  retired because every applicable message now waits for a decision. Retry, dedupe and dead-letter
  stay as they are, under Phase 14's Future-scope badge, until Phase 34 demotes them. No scripted
  beat fires S13 to S15;
- registers the demo triggers: two harness-bar entries on the Matching screen ("Send unmatched row"
  and "Reschedule to a date with no List") and a PWA-only office stand-in on Mobile Lists ("Hospital
  row arrives and the office matches it") so S1 still runs on a handset.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff EP-02,FT-02.1,US-02.1.1,US-02.1.2,US-02.1.3,US-02.1.4,US-02.1.5,FT-02.5,US-02.5.1,US-02.5.2,US-02.5.3,US-02.5.4,US-02.5.5,US-02.5.6,US-14.6.2,US-01.6.1,US-01.6.4,US-04.3.3,US-04.3.6,US-11.3.2,OQ-13,OQ-34,OQ-44,OQ-55,OQ-67,OQ-52,OQ-87
   ```

   If an item changed, re-read it and adjust the work items before planning. If any covered item is
   now Retired or Future, drop it from this phase and say so in the PROGRESS entry. Dropping
   US-02.1.2 or FT-02.1 drops the screen; the RV-13 re-route (no silent apply) still stands while
   US-02.1.5 or US-02.1.3's note says a hospital change goes through the admin's review. If
   acceptance criteria have been added to any covered story, map each to a work item (at 3d3a18c
   only US-02.1.5, with its single "No silent apply", US-01.6.1 with its four, US-01.6.4 and
   US-11.3.2, which is Phase 40's, have them among the stories this phase builds on; the criteria on
   US-02.5.1 to US-02.5.4 are for the automated path, Future Work, and are not built). A new intake
   item on the same screen (for example bulk apply) comes in only if it is small; otherwise note it
   for Phase 34 or 44. If US-02.5.1 to US-02.5.4 or US-14.6.2 (automated application) have left the
   Future Work lane, or US-04.3.6 (the hospital sets the Contract) has, keep this doc's rule (every
   row waits for an admin decision and never sets a Contract by itself), build the rest, and put it
   on the "For the owner's review" list.
2. **OQ-13 (how each hospital provides its bookings).** Still Open at 3d3a18c, with the integration
   team (US-02.1.1's note). Build what this doc describes: the four samples are **labelled
   fixtures** (a "Sample file" badge in the picker and on each batch, and one line on the screen:
   "Sample files stand in for each hospital's bookings while the integration team confirms how each
   hospital provides them."). App copy says "import" and "hospital bookings", not "download"
   (US-02.1.1 was retitled because FHIR is a REST interface, not a file). The incoming row carries a
   superset of the plausible fields, and **every field except hospital, date, session and patient
   name is optional**, because OQ-13 records that Contract and patient details sometimes do not come
   through and that the download is not comprehensive. A field the hospital did not supply is shown
   as "Not supplied" and is **never** a change: it can never blank a Booking field. If OQ-13 has
   since been answered, reshape the fixtures and `IncomingBookingFields` to the answer's field list
   (keep the optional-field rule unless the answer says otherwise), drop the interim line, and
   record the answer in the Decisions log. Cadence belongs to Phase 34.
3. **FT-02.1 (Verify).** Still Verify at 3d3a18c. If it is now Confirmed, drop the Verify note from
   the PROGRESS entry. This doc assumes every row needs an admin decision, and the 2026-10-02 notes
   confirm it: on US-02.1.2 Greg challenged the manual step and Donald kept an import gate for the
   first release ("Okay"), and on US-02.1.3 an update to an already matched Booking still goes
   through the manual approval. If FT-02.1 has been reshaped so matching becomes partly automatic,
   keep the admin decision on every row and log it for the owner's review.
4. **OQ-44 (Draft List contents), Answered.** Build the answer: "Create a Draft List" creates the
   Draft List with hospital, surgeon, day and session (all four required; US-01.6.1, Confirmed on
   2026-10-02, keeps them required) and puts the row's Booking on it in the same decision (a New
   row's Booking is created there; a Reschedule row's Booking is moved there). The row is then
   applied; nothing waits on the Draft List. OQ-44's answer and US-01.6.1's note left "created from
   the matching screen" for later, but US-02.1.2 (Confirmed) lists "create a Draft List when nobody
   is assigned yet" as its own decision and DM-03 says a row can create one, so build it as a
   decision in its own right on US-02.1.2's authority. If US-02.1.2 has dropped that decision, drop
   Create a Draft List from the panel and log it; if OQ-44 has been reopened, build it as this doc
   says and log it.
5. **Automated application stays out (RV-28).** At 3d3a18c US-02.5.1 to US-02.5.4 and US-02.5.6
   sit in the Future Work swimlane as the automated path: a modification, reschedule or cancellation
   from an integration applied with no admin deciding it, a reschedule clash accepted as a Draft
   List (US-02.5.2, its open rules in OQ-87), and the lock on a submitted List. Build none of it.
   Every hospital row, the canned S13 to S15 messages included, waits for the admin's decision, and
   no scripted beat fires S13 to S15. The office-decided equivalents on the matching screen are
   US-02.1.2, US-02.1.3 and FT-02.5's.
6. **Baseline.** Confirm Phases 15a, 17, 19, 19a, 20, 28, 30 and 31 are DONE in PROGRESS.md (14 and
   15 are built), and note whether 21, 23 and 25 are (they are outside the dependency chain; see Depends on). Then read
   what they left, because this doc names today's files:
   - Phase 15 (built; Phase 15b then removed Copy, so `'copy'` may be gone from `BookingSource`):
     `createBooking` and `CreateBookingInput` (with the required `source`),
     `editBooking`/`BookingPatch`, `cancelBooking`, `reassignBooking`, `findBookingByCorrelation`,
     `bookingsOnListByNhi`, `bookingsForList`, `BOOKING_SOURCE_LABELS` (in `shared/format.ts`), and
     the Booking detail route `/admin/day/:dateISO/bookings/:bookingId`.
   - Phase 20: `defaultContractForBooking` (pure; `createBooking` stores it with
     `contractSetBy: 'default'` when no `contractId` is passed), `createBooking`'s optional
     `contractId`, `contractOptionsFor` and the office Contract picker, the guarded
     `setProcedureContract`, and the flag for a Contract that no longer applies. Confirm D2 held:
     there is no Booking or Patient `insurerId` or `fundingSource` to write.
   - Phase 15a: the warning routine in `src/domain/warnings` (`WARNING_RULES`) and the
     `store/warnings.ts` selectors (`warningsForBooking`, `warningsForList`),
     how a Booking's warning triangle and its on-open warning are derived, so the Booking a decision
     creates or changes shows its warnings with no extra code here.
   - Phases 19, 19a and 23: the Procedure code path (Procedure master, base units read from the
     procedure's default RVG Contract) and the primary Procedure, since a procedure change from the
     hospital edits the primary.
   - Phase 21 if DONE: the Contract-defined billable party (D17) and the payer name and email a
     default Contract asks for, which a Booking created from a row shows like any other.
   - Phase 17: the surgeon master (`masters.surgeons`, `Surgeon.hpiId` labelled "HPI CPN"), the
     blacklist warning inside `assignListToSlot`, `partitionAnaesthetistsForSurgeon`,
     `SurgeonSelect` and `BlacklistWarning`.
   - Phase 28: `Slot`, `slotFor`, `listInSlot`, `slotViewsForAnaesthetist`, `assignListToSlot`,
     `placeListOnSlot`, `ListKind`, and the integration park rule it added to `integrationActions.ts`
     (S12 and S13 park `noTargetList` when the Slot has no List).
   - Phases 30 and 31: which conflicts `assignListToSlot` raises (an unavailable Slot is accepted and
     flagged), the Draft List record (31 planned it as a List with no anaesthetist and no Slot, so it has a
     `ListId` and `isDraftList` tells it apart), its create action (planned as `createDraftList(api,
     actor, { hospitalId, surgeonId, dateISO, session, kind?, note?, source }, origin)`, every one of
     the four required, refusing `pairingIncomplete`, `datePassed` and `outsideCanvas`), how a Booking is put on a Draft
     List (`createBooking` and `reassignBooking` onto it, or 31's own action), the assign, remove
     and re-date actions (US-01.6.4), `DraftOrigin`'s reserved `'hospitalRow'` value and any
     source reference, and `pairingIssues`. Use the names 31's entry records.
   - Phase 31's interim `pairingIncomplete` park in `integrationActions.ts` (S12, S13), if 31 left
     one, which goes with the Phase 28 park rule in work item 6.
   - Phase 14 (built): `DemoTrigger` (`choices`, `when`, `badge`), `DemoContextValues`, the re-homed
     `fire-hospital-message` and `replay-hospital-message` entries (`shared/demoTriggers/registry.ts`
     :450 and :475 at 3d3a18c) and their routes and surfaces,
     `src/store/demoActors.ts` (`OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`), `src/store/officeStandIn.ts`, `src/pwa/PwaDemoActions.tsx`
     and `DemoBadge`'s `tone` prop.
   - Phase 25 if DONE: `editRefusal` after the lock (office on DRAFT and SUBMITTED, nobody on
     AUTHORISED). At 3d3a18c `editRefusal` (`store/lifecycle.ts` :48) already refuses
     `listAuthorised`, so the rule holds either way.
   - Run `grep -rn "processMessage\|applyEffect\|manualIntervention\|resultBookingId\|noTargetList\|pairingIncomplete" aa-prototype/src aa-prototype/visual requirements-board/capture/recipes`
     to see every consumer of the auto-apply path after 15a to 32.
   - Read the current `PERSIST_VERSION` in `src/store/appStore.ts` (16 at 3d3a18c, after Phase 15a
     session 1; later phases will have bumped it) and bump it by one from whatever it is now.

## Reference

**Design files (convention 17):**
- `docs/design/Admin Review.dc.html` is the **layout reference** for the Matching screen. Keep its
  anatomy: a title and one-line context under it; a stats strip of micro-cap labels over
  tabular-mono figures (here OPEN, NEW, MODIFICATIONS, RESCHEDULES, CANCELLATIONS, UNMATCHED); one
  table with a flags column of warning-tint pills; a footer action bar with a secondary button and a
  teal primary; and its choreography when an item is done (`bannerIn` banner with who and when, the
  `tickDraw` tick, the row dims, the side-nav badge decrements, "Next in queue" becomes "Next row").
- `docs/design/Admin Day.dc.html` for the dark side nav, the amber attention badge and the right-hand
  List drawer, whose width, elevation and slide-in the row detail panel reuses.
- `docs/design/Design Language.dc.html` for the tokens: warning `#A16207` with tint `#F9F0DC` and
  on-tint `#7C4D08` (changed-field highlight, unmatched pill, "Needs correction"); error tint
  `#FAE9E7` / on-tint `#9C332F` only for the Cancellation change-type pill and an invalid NHI; success
  for the Applied state; neutral sunken with slate for New, Modification, Reschedule, No change and
  Rejected; pills at radius 999; Spline Sans Mono with tabular-nums for NHIs, times, dates and ids.
- Teal `#0D6E63` is the only action colour ("Import hospital bookings", the Apply button). Crimson
  stays identity only: the new side-nav item's active state follows the existing items, and its
  badge is amber (`badgeTone: 'warn'`) like Integrations, never crimson.

**Catalogue:** the covered items above; `domain-model.md` section 1 (the "Hospital HL7 integrations
exist but are unreliable" row: manual matching review, St George's and Southern Cross only,
HL7/FHIR Future; its sync-cadence wording predates US-02.1.5's 2026-10-02 trim, which wins),
"Booking" (sources; mutable from all sources until SUBMITTED, office-only until AUTHORISED, then
immutable; append-only history), "Slot, List and Draft List" (a Draft List holds Bookings before
assignment), the Contract section (the Contract defines who pays, not a Booking insurer field), and
the glossary's "Matching screen". EP-02's technical discussion: every change is validated against
the internal data model rather than the incoming message. US-14.6.2 (Future Work): automatic
matching and routine updates, the later state this screen leads to.

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 8 ("Intake becomes a matching screen"),
  the "Structural first" line for DM-02 then DM-03 (Draft Lists, which this phase creates), the
  "Remove or rework" line for automatic apply (US-02.1.5, DM-34), the "Hide or badge" line (the
  automated S13 to S15, RV-28), the RV-13, RV-28 and RV-05/RV-06 rows, "Demo impact" (S1 Beat 1
  waits for a match decision; S4 Beat 4 needs rethinking once auto-apply goes),
  the "Intake and drafts" line of "Demo-trigger buttons", the OQ-13 line under "Uncertainty", and the
  EP-02 table with its structural note;
- `docs/prototype-build/catch-up/epics/EP-02.md` (#ep-02, #ft-02.1, #us-02.1.1 to #us-02.1.5,
  #ft-02.5);
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (#dm-34; also DM-01, DM-02, DM-03,
  DM-12 and DM-39, which this phase builds on);
- `docs/prototype-build/catch-up/analysis/reverse-check.md` (RV-13 and RV-28; RV-05 and RV-06 for
  what stays badged);
- `analysis/prototype-map-admin.md` section 8 (Integration monitor), `prototype-map-store-seed.md`,
  `prototype-map-domain.md`, `prototype-map-shared.md` and `prototype-map-shell-demo-pwa.md`
  (sections 5.3 and 7).

**Code entry points (as at 3d3a18c, after Phases 14, 15 and 15a session 1; Phases 15a to 32 will
have renamed or moved some):**
- `aa-prototype/src/store/integrationActions.ts`: `applyEffect` (:137-228, removed here; :161 is
  the "Interim until Phase 33" comment), `attemptMessage` (:229-308; the park codes in it go),
  `processMessage` (:309), `retryMessage`, `reprocessMessage` (:339),
  `createMessageRow`/`updateMessageRow`, `integrationActor`, `timeToSession`, `ingestPdfRow` (:434,
  unchanged), `wireIntegrationRetry`.
- `aa-prototype/src/domain/integrations/`: `messages.ts` (`CANNED_MESSAGES`, `APPT`, `STG_LIST`,
  `STG_MODIFY_LIST`, `SX_LIST`, `CPH_LIST`, `routing`), `feeds.ts` (`FEED`, `FEED_META`),
  `hl7.ts`/`fhir.ts` (`ParsedMessage`, `extractViaMapping`, `extractFromFhir`), `pdfSamples.ts` (the
  fixture and facsimile pattern the download samples follow), `index.ts`.
- `aa-prototype/src/domain/types.ts`: `BookingSource` (:371), `IntegrationMessageStatus` (:844) and
  `IntegrationMessage` (:852; `manualIntervention` retired, `resultBookingId` (:869) replaced by
  `resultImportRowId`), `IntegrationCorrelationRef`, `Booking.correlationRef`, `Booking.source`,
  `AuditSource`.
- `aa-prototype/src/store/appStore.ts`: `IntegrationsSlice` (:66), `AppState` (:75),
  `PERSIST_VERSION` (:136, 16) and its history comment, `emptyIntegrationsSlice` (:144),
  `seededIntegrationsSlice`, `freshAppState`.
- `aa-prototype/src/store/mutate.ts`: `ID_FORMATS` (:61), `allocateId`, `mutate` with a
  `MutationMeta[]`, `DomainPatch` (:131), `resetDomainState` (:222), `clockISO`, `refuse`, `ok`.
- `aa-prototype/src/store/selectors.ts`: `entityCounts` (:873), `findBookingByCorrelation` (:912),
  `bookingsOnListByNhi` (:925), `displayStatusFor` (:953) and `integrationMonitor` (:971),
  `integrationAttentionCount` (:995).
- `aa-prototype/src/store/intake.ts`: `upsertPatient` (patient dedupe by NHI, the only patient path)
  and `editPatient` (`PatientEditPatch`: name, dobISO, phone, email, address; no NHI).
- `aa-prototype/src/store/lifecycle.ts`: `editRefusal` (:48), `cancelBooking` (:348),
  `editBooking` (:402), `editProcedure` (:438), `reassignBooking` (:635);
  `store/bookingActions.ts`: `createBooking`.
- Admin: `router.tsx` (the admin children, :88-106), `apps/admin/routes.tsx`,
  `apps/admin/AdminApp.tsx` (`sectionForPath`, `SECTION_PATH`, the badge counts, :28-245),
  `apps/admin/components/SideNav.tsx` (`NavSection`, the items, `badgeTone`),
  `apps/admin/components/ListDrawer.tsx` (the drawer pattern), `apps/admin/screens/ReviewScreen.tsx`
  and `ReviewQueue.tsx` (the queue and authorised choreography), `apps/admin/tableChrome.ts`,
  `apps/admin/screens/IntegrationMonitorScreen.tsx` (Messages tab status chip and "Reprocess",
  `PdfReview`'s `RowField` for inline correction), `apps/admin/RolesInfo.tsx` (the Integration role
  line), `apps/admin/flows/PhoneAdviceBooking.tsx` (a List-then-Booking office path to mirror).
- Demo: `apps/demo/DemoIntegrations.tsx` (pane 3 "schedule change" :259, `resultBookingId` :109,
  `statusSentence` :557), `apps/demo/DemoControlPanel.tsx` (S1 text :260, S4 :303, S5 :320),
  `apps/demo/DemoData.tsx` (renders `entityCounts`).
- Demo triggers: `src/shared/demoTriggers/registry.ts`, `types.ts`, `context.ts`, `match.ts`,
  `demoTriggers.test.ts`; `src/store/demoActors.ts`; `src/pwa/PwaDemoActions.tsx`.
- Audit reading layer: `shared/audit/actionLabels.ts` (`'integration.receive'` :88),
  `shared/audit/fieldLabels.ts`, `shared/audit/auditNarrative.ts`; `shared/booking/HistorySheet.tsx`
  (filters by `entityIds`).
- Tests to change: `store/integrationActions.test.ts`, `store/demoScenarios.test.ts` (:37 fires
  MSG-STG-1001 and expects a Booking), `domain/integrations/integrations.test.ts`,
  `store/persistMigrate.test.ts`, `domain/seed/seed.test.ts`, `pwa/pwaPurity.test.ts`,
  `visual/phase11.spec.ts`, `visual/phase12.spec.ts`, `visual/screens.spec.ts`,
  `visual/pwa-device.spec.ts`.
- Outside the app: `requirements-board/capture/recipes/US-02.1.1.json`, `US-02.1.2.json`,
  `US-02.1.3.json`, `US-02.1.4.json`, `US-02.1.5.json`, `US-02.5.1.json`, `US-02.5.2.json`,
  `US-02.5.3.json` and `US-02.5.4.json` (captured from the simulator's auto-apply or the PDF
  analogue).

## Work items

Build in this order: types and slice, pure matcher and fixtures, store actions, the message re-route,
audit labels, a green checkpoint, then the screen, the triggers and PWA stand-in, shots, recipes and
the guide.

### Session 1 · Model, matcher, store and the re-route

1. **Domain types** (`src/domain/types.ts`) (DM-34; US-02.1.1, US-02.1.2, US-02.1.4):
   - Id aliases `ImportBatchId`, `ImportRowId`.
   - `ImportChannel = 'download' | 'manualSheet' | 'feedMessage'`. `download` is the code name for a
     hospital import (app copy says "import", per US-02.1.1's retitle); `feedMessage` is the
     Future-scope HL7/FHIR simulator's channel, kept so its rows are honest about where they came
     from.
   - `IncomingBookingFields` (what the hospital sent; every field optional except the four marked):

     ```ts
     interface IncomingBookingFields {
       hospitalId: HospitalId                       // required
       dateISO: IsoDate                             // required
       session: Session                             // required
       externalRef?: string                         // the hospital's appointment id (SCH-2 or equivalent)
       surgeon?: { name: string; hpiId?: string }   // hpiId: the HPI CPN (OQ-52), matched first
       scheduledTime?: WallTime
       patient: { name: string; nhi?: string; dobISO?: IsoDate; ethnicityCode?: string } // name required
       procedure?: { description?: string; rvgCode?: string }
       payer?: { text: string; insurerId?: InsurerId } // the insurer or funder as sent; shown, never stored on the Booking (D2)
       note?: string
       hospitalStatus: 'booked' | 'cancelled'       // default 'booked'
       cancelReason?: string
     }
     ```

     There is no `fundingSource` or Booking insurer to write (D2, DM-12). `payer` exists only so the
     admin can see what the hospital said about who pays next to the Procedure's Contract; when its
     text names a seeded insurer, the fixture sets `insurerId` so the panel can show "Contract held
     by nib" against it (nib is the seeded insurer `I-NIB`).

   - `ImportDecision`, a discriminated union recorded once a row is decided:

     ```ts
     type ImportDecision =
       | { kind: 'match'; bookingId: BookingId; changeType: ChangeType; fieldsApplied: IncomingFieldKey[]; contractId?: ContractId }
       | { kind: 'createBooking'; listId: ListId; bookingId: BookingId; contractId?: ContractId }
       | { kind: 'createList'; slotId: SlotId; listId: ListId; bookingId: BookingId; contractId?: ContractId }
       | { kind: 'createDraft'; listId: ListId; bookingId: BookingId; contractId?: ContractId }   // a Draft List is a List (Phase 31)
       | { kind: 'reject'; reason: string }
     ```

     `bookingId` on `createList` and `createDraft` is the Booking created (a New row) or moved (a
     Reschedule row) onto the new List or Draft List: a Draft List holds Bookings (OQ-44), so neither
     decision leaves the row waiting. `contractId` is set only when the admin picked a Contract other
     than the one the Booking has (or would get by default); it is the admin's pick, never the row's.

   - `ChangeType = 'new' | 'modification' | 'reschedule' | 'cancellation' | 'noChange'`.
   - `ImportRow`: `id`, `batchId`, `channel`, `receivedAtISO`, `incoming: IncomingBookingFields`,
     `corrections?: Partial<...>` (office corrections to the incoming data, kept separate so the
     original is never lost), `status: 'open' | 'applied' | 'rejected'`, `decision?: ImportDecision`,
     `decidedBy?`, `decidedAtISO?`, and for a feed message `messageId?`. Note that "unmatched" is
     **not** a status: it is derived (work item 2), so a row cannot be unmatched and forgotten.
   - `ImportBatch`: `id`, `channel`, `hospitalId`, `label` ("St George's bookings, 28 Jul to
     4 Aug"), `sampleId?` (the fixture it came from), `importedBy`, `importedAtISO`, `rowIds`,
     `skippedCount` (rows already imported, see work item 4).
   - `IntegrationMessage`: add `resultImportRowId?: ImportRowId`; remove `resultBookingId` and
     remove `'manualIntervention'` from `IntegrationMessageStatus`.
     A parsed message no longer applies anything, so nothing parks; the persisted state reseeds on
     the `PERSIST_VERSION` bump, so no migration of old rows is needed.
2. **Pure matcher** (`src/domain/intake/matching.ts`, exported from `src/domain/intake/index.ts`; no
   React, no store import, PWA-safe; Vitest in `matching.test.ts`) (US-02.1.2, US-02.1.3, US-02.1.4,
   FT-02.5):
   - Input is a plain `MatchingView` built by a selector (work item 5): Bookings with their patient
     NHI, name and DOB, primary Procedure description, code and Contract (id, name, holder), notes,
     scheduled time, correlation ref and cancellation; Lists with hospital, surgeon, date, session,
     anaesthetist, approval state and Slot; open Slots by anaesthetist, date and session with their
     availability; Draft Lists (hospital, surgeon, date, session, still unassigned or not); surgeons
     with `hpiId`; and the other open rows (for the duplicate flag).
   - `effectiveIncoming(row)`: `incoming` with `corrections` laid over it. Every function below reads
     this, never `incoming` directly.
   - `findMatch(view, fields)`: first by correlation (`externalRef` against the Booking's
     `correlationRef` for that hospital's source key, work item 3, the key a feed message and a
     download row share), basis `'appointmentRef'`; else by
     valid normalised NHI on a non-cancelled Booking at the same hospital and date, basis
     `'nhiAndDate'`; else none. Never by name alone. A Booking created or changed by an earlier
     decision carries the row's correlation ref, so a later row for the same appointment (an update
     to an already matched Booking) finds it and goes through the same diff and approval
     (US-02.1.3's note); it is never applied because it matched before.
   - `resolveSurgeon(view, fields)`: by `hpiId` (the HPI CPN, OQ-52) when the row carries one, else
     by normalised name; unresolved gives the "Surgeon not recognised" flag.
   - `diffFields(booking, fields)` returns `FieldDiff[]` (`{ key, label, current, incoming }`) for
     date and session, time, List (surgeon), patient name, date of birth, NHI, procedure
     description, RVG code and note. A field the hospital did not supply is skipped (never a
     change). NHI is compared but flagged, never applied (see work item 4). The surgeon is shown as a
     difference only when it moves the Booking to a different List. The row's `payer` is not a
     field diff (no Booking field holds it, D2): it is returned as `payerNote` (`{ text, current:
     the primary Procedure's Contract name and holder, differs }`), where `differs` is true when
     `payer.insurerId` is set and is not the Contract's holder. The panel shows it as a Contract line
     the admin may act on; the classifier ignores it.
   - `classifyChange(match, fields, diffs)`: no match gives `'new'`; `hospitalStatus === 'cancelled'`
     gives `'cancellation'`; a different date, session or List gives `'reschedule'` (other diffs are
     listed as "also changed"); any other diff gives `'modification'`; none gives `'noChange'`.
     Plain-language labels in one map, `CHANGE_TYPE_LABELS`: "New", "Modification", "Reschedule",
     "Cancellation", "No change".
   - `suggestDecision(view, row)` returns `{ changeType, match?, diffs, suggestion, unmatchedReason?,
     flags }`:
     - `new`: the List in the Slot at the row's hospital, date, session and surgeon gives
       `createBooking` on it; failing that, an unassigned Draft List with the same four fields gives
       `createBooking` on the Draft List (it holds Bookings, OQ-44). With neither, the row is
       **unmatched**, `unmatchedReason` "No List at St George's for Mr Hale on Thu 6 Aug AM", and
       the screen offers Create a List in a session (anaesthetists whose Slot is open that session, via
       Phase 17's `partitionAnaesthetistsForSurgeon` order) or Create Draft List.
     - `modification`, `cancellation`, `noChange`: `match` on the found Booking with every diff
       ticked. A modification or cancellation whose appointment is not found is **unmatched**: "No
       Booking matches appointment 1661999 at St George's".
     - `reschedule`: the target List at the new hospital, date, session and surgeon, which may be
       **any anaesthetist's** List, or an unassigned Draft List with those four fields. With no
       target the row is **unmatched** ("Reschedule to Thu 6 Aug AM: no List there yet"); the
       Booking is not touched and the date change is not dropped. The admin resolves it with Create
       List in a session or Create Draft List, and the Booking moves onto the new one.
     - A row whose surgeon does not resolve can still get `createBooking` on an existing List or
       Draft List (it already has its surgeon), but `createList` and `createDraft` need a surgeon
       chosen by the admin in the decision panel: a List needs exactly one surgeon (Phase 31's
       `pairingIssues`) and a Draft List cannot be saved without one (US-01.6.1, OQ-44).
   - `rowFlags` (warning pills, never blocks unless stated): "NHI invalid" (from `validateNhi`;
     **blocks** Apply until corrected), "NHI differs from the Booking's patient", "Surgeon not
     recognised" (the name does not resolve in the surgeon master; proposals ignore the surgeon),
     "List submitted" (the office may still apply until AUTHORISED, per the domain model's Booking
     rule), "List authorised" (**blocks** Apply: locked; reject with a reason or resolve off-line),
     "Booking cancelled" (a modification to a cancelled Booking is not applied; the suggestion
     becomes reject), "Earlier row for this appointment still open" (links the other row; the admin
     rejects one), "No NHI supplied" (never
     blocks: the Booking proceeds and Phase 40 adds the missing-NHI problem list and the authorise
     guard, OQ-49), and "Hospital names a different payer" (from `payerNote.differs`; the admin
     checks the Contract).
   - `matchingQueue(view, rows)`: each open row's queue, `'ready'` (a suggestion exists) or
     `'unmatched'` (no suggestion), plus counts by change type for the stats strip. There is no
     waiting state: a Draft List created from a row already holds its Booking.
   - Tests: each change type; correlation beats NHI and date; NHI and date on another hospital does
     not match; surgeon by HPI CPN beats a name that differs; a missing incoming field is never a
     diff; a payer is never a diff and sets `differs` only against another holder; a reschedule to
     another anaesthetist's List; a new row and a reschedule both target an unassigned Draft List
     with the same four fields; a reschedule to a date with no List or Draft List is unmatched with
     the reason and no suggestion; an appointment id that matches nothing is unmatched; the
     AUTHORISED, cancelled, invalid-NHI, no-NHI and duplicate-row flags; a later row for an
     appointment whose first row was applied matches the Booking that decision created and is a
     Modification with its diffs, not applied; corrections override incoming; determinism (same
     view, same output).
3. **Sample files** (`src/domain/intake/hospitalDownloads.ts`, pure fixtures in the `pdfSamples.ts`
   style; `hospitalDownloads.test.ts` for fixture integrity) (US-02.1.1; OQ-13 interim):
   - `HOSPITAL_DOWNLOAD_SAMPLES`, four entries, each `{ id, channel, hospitalId, label, description,
     rows: IncomingBookingFields[] }`. Every patient is synthetic. Author the modify targets against
     the seeded Bookings Phase 11 planted (the `APPT` correlation refs on Aug 3 and 4) and the three
     booked cases on Souter's Tue 28 Jul AM List, and pin each in the seed test:
     - `SAMPLE_STG` **St George's bookings, Tue 28 Jul to Tue 4 Aug** (channel `download`),
       five rows: (R1) **Sarah Mitchell**, NHI `CQY9304` and DOB 1988-04-12 (the seeded patient, so
       `upsertPatient` reuses her), `externalRef` `APPT.s12`, Tue 28 AM 08:30, Mr Hale,
       "Appendicectomy, laparoscopic", code 20950: New, suggested Create Booking on Dr Souter's Tue
       28 Jul AM List (the S1 row); (R2) the 07:45 Booking already on that List (code 49558, ref
       `SG-2026-0911`; its patient comes from the seed's `takePatient()`, so read the NHI from a fresh
       seed once and pin it in the fixture test), no appointment id, same fields: No change, matched
       by NHI and date; (R3) the `APPT.s14` Booking
       with a new time 12:15, a changed procedure description and a booking-office note: Modification
       (time, procedure, note); (R4) the `APPT.s13Move` Booking moving to the day of an existing St
       George's Mr Hale List: Reschedule; (R5) the `APPT.s15` Booking, `hospitalStatus: 'cancelled'`:
       Cancellation.
     - `SAMPLE_STG_UPDATE` **St George's bookings, a day later** (channel `download`), one row: Sarah
       Mitchell's appointment `APPT.s12` again, now at 09:00 with a booking-office note. Once
       `SAMPLE_STG` R1 has been applied it is a **Modification** of the Booking that decision created
       (time and note side by side, waiting for approval: US-02.1.3's "an update to an already
       matched Booking still goes through this manual approval"); while R1 is still open it carries
       the "Earlier row for this appointment still open" flag.
     - `SAMPLE_SX` **Southern Cross bookings, Tue 28 Jul** (channel `download`), three rows:
       (R1) **Priya Nair** (existing patient, NHI `MYY54SL`), Tue 28 PM 14:30, Ms Patel, "Diagnostic
       knee arthroscopy": New on Dr Souter's Tue 28 Jul PM List; (R2) a seeded DRAFT Southern Cross
       Booking after 21 Jul (record which in the PROGRESS entry) with a corrected patient name, a
       date-of-birth fix, a `payer` naming nib (`I-NIB`) where the Procedure is on
       the hospital's default Contract, and a booking-office note: Modification (patient and note,
       with the "Hospital names a different payer" Contract line; the note-append and Contract-pick
       check). Pick an nib-held Contract that Phase 20's `contractOptionsFor` offers for that
       Procedure and hospital (if none is, use another holder Phase 18 seeded and record which), and
       pin it in the fixture test. (R3) a late procedure-description correction for the Booking on
       a seeded **AUTHORISED** Southern Cross List (at 3d3a18c the historical `oa08` List in
       `seed/history.ts`: Ms Patel, Wed 18 Mar, knee arthroscopy; later phases may have reshaped the
       history seed, so record which), no appointment id, matched by NHI and date: Modification
       flagged "List authorised", Apply disabled (the locked-target check, and the US-02.5.4
       recipe's second row).
     - `SAMPLE_FORTE_SHEET` **Forte Health daily sheet, keyed by the office** (channel `manualSheet`),
       three rows: (R1) a New row onto an existing Forte List; (R2) a row with a mistyped NHI check
       digit (flagged "NHI invalid", corrected inline, the manual-keying story); (R3) a row for a
       session with no Forte List, with a surgeon who resolves: unmatched, resolved by Create Draft
       List, which holds the row's new Booking.
   - `hospitalSourceKey(hospitalId)`: the seeded feed id (`FEED.stg`, `FEED.sx`) where one exists,
     else `MANUAL-<hospitalId>`, so a download row and a feed message about the same appointment
     correlate to the same Booking through the existing `correlationRef` shape. Keep the field name
     `sourceFeedId`; say in a comment that it is now the hospital's source key.
   - Fixture tests: row keys unique per sample; every row validates except Forte R2;
     `SAMPLE_STG_UPDATE` R1 shares `SAMPLE_STG` R1's appointment and differs only in time and note;
     the seeded
     targets the rows name exist on a fresh seed (R2 to R5 of St George's, R2 of Southern Cross and
     its Contract pick, R3 of Southern Cross on an AUTHORISED List); the unmatched Forte row's session has no Forte List and no Draft List, and
     its surgeon resolves.
4. **Store actions** (new `src/store/matchingActions.ts`, exported from `src/store/index.ts`; every
   write through `mutate()` with before and after metas and clock timestamps; office only unless
   stated; Vitest in `matchingActions.test.ts`):
   - **Slice.** A new top-level `intake: { batches: Record<ImportBatchId, ImportBatch>; rows:
     Record<ImportRowId, ImportRow> }`, seeded empty. Add it everywhere `integrations` is listed:
     `AppState`, `freshAppState`, `resetDomainState`, `DomainPatch`, the persisted payload and the
     Data Inspector's `entityCounts` (batches, rows). No sync state: US-02.1.5 dropped the
     last-synced and failed-sync criteria (DM-34).
   - **Ids.** `ID_FORMATS` gains `importBatch` (`IB`, pad 4) and `importRow` (`IR`, pad 4).
   - **`stageImportRows(api, actor, channel, hospitalId, label, rows, extras)`** (exported from
     `matchingActions.ts` but not from `store/index.ts`; the one place rows enter, and the name Phase
     34's plan already uses for its sync and delivered sheets): one commit creating the batch and its
     rows, audited `importBatch.create` plus one `importRow.receive` per row. **Dedupe:** a row whose
     `(hospitalId, externalRef)` (or, with no `externalRef`, its normalised NHI, date and session)
     matches an existing row of any status (open, applied or rejected) **with identical `incoming`
     fields** (compare what the hospital sent, not the office's corrections, so a corrected row is
     not restaged on the next import, and a rejected row does not return on every sync) is skipped
     and counted in `skippedCount`; a changed row for
     the same appointment is staged and carries the "Earlier row" flag if the first is still open.
     Nothing is ever merged or decided automatically.
   - **`importHospitalDownload(api, actor, sampleId)`** (US-02.1.1; the action keeps this name,
     which Phases 34 and 40 use, while its button reads "Import hospital bookings"): refuses `officeOnly` and
     `unknownSample`; stages the sample's rows; returns `{ batchId, added, skipped }`. Re-importing
     the same sample adds nothing ("All 5 rows were already imported. Nothing new.").
   - **`correctImportRow(api, actor, rowId, patch)`**: corrections to the incoming data (NHI, name,
     date of birth, time, procedure description, surgeon), open rows only, audited
     `importRow.correct`. The NHI is validated on entry (EP-02: validated against the internal
     model).
   - **`decideImportRow(api, actor, rowId, decision)`** (US-02.1.2, US-02.1.3, FT-02.5): the one
     place a row reaches the schedule.
     - Common refusals: `officeOnly`, `notFound`, `alreadyDecided`, `invalidNhi` ("Correct the NHI
       before applying"), `listLocked` (AUTHORISED target), `hospitalMismatch` (a target List or
       Draft List at another hospital), `surgeonRequired` (`createList` or `createDraft` with no
       resolved or picked surgeon), `contractNotOffered` (a picked Contract that
       `contractOptionsFor` does not offer for that Procedure and hospital), and `staleSuggestion`
       when the decision's target no longer fits what `suggestDecision` would allow now.
     - **Pre-check, then apply in refusable-first order, then record.** Validate every guard the
       write paths will apply before the first write (the Phase 11 review-fix rule: a refused move
       must strand nothing). Then call the existing guarded actions as the office actor, and write
       the row's `decision`, `status`, `decidedBy` and `decidedAtISO` last, in one commit carrying
       two metas: `importRow.decide` on the row and `booking.fromHospitalRow` on the Booking
       (`after: { importRowId, hospital, channel, changeType, fields }`), so the Booking's History
       shows "Hospital row applied: Modification (time, procedure)". A refusal returns the reason and
       leaves the row open; a test proves the schedule is unchanged.
     - `match` + `modification`: apply only the ticked `fieldsApplied`: time through `editBooking`;
       patient name and DOB through `editPatient`; procedure description and code on the **primary
       Procedure** (Phase 23 if DONE, else the Booking's first Procedure) through `editProcedure` (the
       Phase 19 code path, so base units re-resolve as they would for a manual edit). Nothing is
       written for the row's `payer`: there is no Booking insurer or funding source (D2). When the
       admin picked a Contract in the panel (`contractId`), it is set on the primary Procedure
       through Phase 20's `setProcedureContract` as the office actor (`contractSetBy: 'office'`),
       the same guarded write the Booking detail's picker uses. The row never sets a Contract by
       itself (US-04.3.6 is Future Work). A hospital note is
       **appended** to the Booking's notes as one line ("St George's, 21 Jul: ...") instead of
       overwriting them (the S14 overwrite in gaps.json). An NHI difference is never applied: the
       admin rejects the row or fixes the patient record (Phase 40 adds attach and merge).
     - `match` + `reschedule`: `reassignBooking` to the target List (any anaesthetist's), then
       `editBooking` for the time, with the Booking id, Procedures and history unchanged. Moving the
       Booking is the refusable step, so it goes first.
     - `match` + `cancellation`: `cancelBooking` with reason "Cancelled by St George's (hospital row
       IR0005)" or the row's `cancelReason`. Soft-cancel as today: the Booking stays visible on its
     List, marked cancelled.
     - `match` + `noChange`: records the decision ("Matched, nothing to change") and writes nothing
       else.
     - `createBooking`: `createBooking(api, actor, listId, { patient, operation, scheduledTime,
       correlationRef: { sourceFeedId: hospitalSourceKey(hospitalId), externalAppointmentId },
       source: 'hospitalDownload', contractId? })` on a List or an unassigned Draft List. With no
       `contractId` (the usual case), Phase 20's rule stores `defaultContractForBooking` for the List
       with `contractSetBy: 'default'` (US-04.3.3); with the admin's pick it stores that, checked as
       `setProcedureContract` checks it. No insurer or funding source is passed (D2). The patient
       goes through `upsertPatient`, so an existing NHI is reused, not duplicated. Stamp `source:
       'hospitalDownload'` for every channel, including `manualSheet` and `feedMessage`: all three are
       the hospital pathway in `BookingSource`.
     - **What follows with no code here.** Because every decision goes through the guarded actions,
       15a's warning routine re-runs, the billable party follows the Contract (D17; on a default
       Contract Phase 21 asks for the payer's name and email as on any Booking, if 21 is DONE), and
       Phase 27's prepayment re-check runs on create, move and procedure change (if 27 is DONE; a
       moved prepaid Booking keeps its agreed amount, D20). A row never sets the billable party, an
       invoice email or a prepayment itself.
     - `createList`: `assignListToSlot(api, actor, slotId, { hospitalId, surgeonId, kind: 'private'
       unless the row says otherwise })` first, with the row's resolved surgeon or the one the admin
       picked in the panel (refused `surgeonRequired` otherwise) (Phase 17's blacklist warning and acknowledgement,
       Phase 30's conflict flag on an unavailable Slot and Phase 31's pairing check all apply as they
       do in the Day view), then `createBooking` on the new List for a New row, or `reassignBooking`
       onto it for a Reschedule row. A refusal of the second step after the List is created is
       prevented by the pre-check; if it still happens, the List stays (an empty List is a valid
       state), the row stays open and the outcome says so.
     - `createDraft` (US-01.6.1, OQ-44 answered): `createDraftList(api, actor, { hospitalId,
       surgeonId, dateISO, session, note }, 'hospitalRow')` with all four of hospital, surgeon, day
       and session (the row's resolved surgeon or the admin's pick; refused `surgeonRequired`
       otherwise), Phase 31's reserved `'hospitalRow'` origin (its request `source`, phone, email,
       PDF or other, belongs to origin `'request'` only, so pass none unless 31's signature requires
       one), 31's `datePassed` and `outsideCanvas` refusals checked in the pre-check, and an
       `importRowId` source reference on the Draft List if 31 did not add one, with a note built from the row ("From St
       George's bookings: Sarah Mitchell, 08:30, appendicectomy"). It takes no Slot and no
       anaesthetist. Then the row's Booking goes onto it through 31's path for Bookings on a Draft
       List: `createBooking` for a New row, `reassignBooking` for a Reschedule row (the Booking
       keeps its id and history). The same pre-check and refusable-first rule applies; if the second
       step still fails, the Draft List stays (an empty Draft List is valid and shows on Phase 31's
       page), the row stays open and the outcome says so. When the office later assigns the Draft
       List, its Bookings come with it (31's rule); 31's `redateDraftList` takes its Bookings
       with it, and `removeDraftList` refuses while it holds an active Booking (US-01.6.4). Neither
       reopens the row.
     - `reject`: a reason is required (`reasonRequired`); nothing else changes.
   - **Tests:** import stages rows and a re-import skips them (including a rejected row and a row the
     office corrected); every refusal above; each decision
     kind end to end; a refusal leaves both the row and the schedule unchanged; a created Booking has
     `source: 'hospitalDownload'`, the default Contract with `contractSetBy: 'default'`, the
     correlation ref and a reused patient for Sarah Mitchell and Priya Nair; a picked Contract lands
     with `contractSetBy: 'office'` and an unoffered one is refused; no decision writes an insurer or
     funding source anywhere; a modification applies only ticked fields and appends the note; a
     reschedule to another anaesthetist's List keeps the Booking id and history; `SAMPLE_STG_UPDATE`
     after `SAMPLE_STG` R1 is applied matches the created Booking and changes nothing until decided,
     then applies its time and appends its note; a reschedule row
     with no target List stays open and the Booking is untouched; `createList` goes through
     `assignListToSlot` (a blacklisted pairing is acknowledged, not refused); `createDraft` for a New
     row creates the Draft List holding the new Booking, for a Reschedule row moves the Booking onto
     it, and with no surgeon is refused; the two audit metas land in one commit and the Booking's
     History shows the row.
5. **Selectors** (`store/selectors.ts`, or a `store/matchingSelectors.ts` beside it): `matchingView`
   (built from stable records; components derive with `useMemo`, as the file's header comment
   requires), `importRowViews(state, filter)` (row, effective fields, suggestion, queue, flags,
   batch label), `matchingCounts(state)` and `matchingAttentionCount(state)` (open rows, for the
   side-nav badge). `integrationAttentionCount` now counts dead-letter rows only.
6. **The HL7/FHIR re-route: no silent apply** (RV-13, RV-28; US-02.1.5 "No silent apply"):
   - Delete `applyEffect`, the S12/S13 park rule Phase 28 added and Phase 31's interim
     `pairingIncomplete` park if 31 left one (a row with no resolvable surgeon now simply stages and
     shows "Surgeon not recognised"). `attemptMessage` now parses as
     today, then validates the extracted NHI with `validateNhi`: an invalid NHI is a feed-mapping
     fault, so it keeps today's path (`retrying`, then `deadLetter` after `MAX_ATTEMPTS`), and
     MSG-CPH-2001 still dead-letters until its mapping is fixed. A clean parse calls
     `stageImportRows` with channel `feedMessage`, the feed's hospital, a batch label ("St George's
     webPAS message MSG-STG-1001") and one row built from the parsed fields: S12 gives a booked row,
     S13 and S14 a booked row with the new date, time and fields, S15 a cancelled row. The canned
     `routing` supplies the surgeon and session that the extractor does not read (the §10 fence note
     stays). The message is marked `processed` with `resultImportRowId`. This is what retires
     RV-28: the canned S13, S14 and S15 messages (the automated reschedule, modification and
     cancellation, Future Work in US-02.5.1 to US-02.5.3) no longer change anything by themselves;
     they become Reschedule, Modification and Cancellation rows for the office to decide.
   - The transient-fault path, MSH-10 dedupe, `reprocessMessage` and `wireIntegrationRetry` are
     unchanged. `reprocessMessage` after the Christchurch Public mapping fix now stages a row.
   - `displayStatusFor` shows a processed message with a row as **"Sent to matching"**. The Messages
     tab loses the manual-intervention chip and its Reprocess case; its footnote says "Parsed messages
     are sent to the matching screen for the office to decide. Nothing is applied automatically."
   - `DemoIntegrations.tsx` pane 3 becomes "Sent to matching": the row's change type, the suggested
     decision in words and "Open Admin, Matching to decide" (text, as the Phase 11 note on cross-app
     links allows). Keep `data-shot="integrations-schedule-change"` so recipes keep an anchor. Any
     label on the S13 to S15 entries that says the change is applied ("moves the Booking", "cancels
     it") now says the row is staged, and MSG-STG-1014's label "S14 · Locked target (manual
     intervention)" becomes "S14 · Change to a submitted List".
   - `RolesInfo.tsx`: the Integration role line becomes "Integration (hospital feeds): brings rows in
     for the office to match. It never changes a Booking itself." The integration actor no longer
     writes Bookings anywhere; leave `editRefusal`'s integration branch in place (the Data Inspector's
     guard console still exercises it) and say so in a comment, but reword its refusal copy to drop
     "manual intervention" ("An integration update cannot change a submitted List.").
   - Tests (`integrationActions.test.ts`, reworked): **every** canned message processed on a fresh
     seed changes no Booking, List or patient (snapshot the schedule before and after) and stages
     exactly one row with the expected change type; replay is still a `duplicate` no-op; the
     transient message stages on attempt 2; MSG-CPH-2001 dead-letters, and after `setFeedMapping` to
     PID-3 and `reprocessMessage` it stages a valid row; MSG-STG-1014 (the old locked target) stages a
     row flagged "List submitted", which the office can apply.
7. **Audit reading layer** (`shared/audit/actionLabels.ts`, `fieldLabels.ts`, `auditNarrative.ts`):
   `importBatch.create` "Hospital bookings imported", `importRow.receive` "Hospital row received",
   `importRow.correct` "Hospital row corrected", `importRow.decide` "Hospital row decided",
   `booking.fromHospitalRow` "Hospital row applied to this Booking"; field labels for every
   `IncomingBookingFields` key (`payer` as "Payer (as sent)", the surgeon's `hpiId` as "HPI CPN") and
   for `changeType`, `decision`, `fieldsApplied` and `contractId`. The narrative
   reads "Kirsty W. applied a St George's row: Modification (time, procedure, note)". Remove the
   `manualIntervention` wording from any label.
8. **Seed and `PERSIST_VERSION`.** No seeded batches or rows: the screen starts empty on a reset and
   the presenter imports. Bump `PERSIST_VERSION` by one with a history comment line ("intake slice
   (import batches and rows); HL7/FHIR messages stage rows instead of applying; manualIntervention
   retired"). Seed tests (`seed.test.ts`): the fixture targets from work item 3 exist; for the two
   triggers (below) a future St George's Mr Hale session with no List and a Southern Cross Ms Patel
   session with no List exist within the canvas and are not holidays; none of them is a scripted-beat
   List. `persistMigrate.test.ts`: an old payload reseeds.
9. **Checkpoint: green.** `npm run build`, `npm run build:pwa` and `npx vitest run`.
   `demoScenarios.test.ts`'s S1 case now imports `SAMPLE_STG`, decides R1 with its suggestion and
   finds Sarah Mitchell on Souter's Tue 28 Jul AM List at 08:30 on the St George's default Contract,
   source `hospitalDownload`. This is the stopping point for session 1.

### Session 2 · The screen, triggers, PWA and shots

10. **Admin Matching screen** (`apps/admin/screens/MatchingScreen.tsx`, with parts in
    `apps/admin/matching/`; route `/admin/matching`, `AdminMatchingRoute` in `routes.tsx`, a child in
    `router.tsx`) (US-02.1.1 to US-02.1.4, FT-02.5):
    - **Nav.** `NavSection` gains `'matching'`, placed directly under Day view ("Matching"), with an
      amber `badgeTone: 'warn'` badge from `matchingAttentionCount`; `sectionForPath` and
      `SECTION_PATH` gain it.
    - **Header.** Title "Matching"; one line: "Hospital bookings and sheets land here. Match each row
      to a Booking or List, create what is missing, or reject it. Nothing changes the schedule until
      you decide, including updates to Bookings already matched." The OQ-13 interim line under it.
      On the right, the teal **Import hospital bookings** button.
    - **Import dialog** (a desktop dialog, `useSurface().Overlay`): a `DemoBadge label="Sample file"`
      heading, one row per `HOSPITAL_DOWNLOAD_SAMPLES` entry (four: hospital, label, row count, a
      one-line description), and Import. The result reads "5 rows imported from St George's" or "All 5 rows
      were already imported. Nothing new." and selects the first new row.
    - **Stats strip** in the Admin Review style: OPEN, NEW, MODIFICATIONS, RESCHEDULES,
      CANCELLATIONS, UNMATCHED.
    - **Filter** (a segmented control): **Open** (default; ready rows first, then unmatched, each
      oldest first), **Unmatched** (the unmatched queue, US-02.1.4) and
      **Decided** (applied and rejected, newest first, with who and when).
    - **Table** (`tableChrome`): Received, Hospital (and "Sample file" or "Feed message" micro-cap
      for the channel), Patient and NHI, Date, session and time, Procedure, Change (the change-type
      pill), Suggested (plain words: "Create Booking on Dr Souter, Tue 28 Jul AM"; "Unmatched: no
      List at Southern Cross for Ms Patel on Thu 6 Aug PM"), Flags (warning pills). Rows are
      clickable in the `ReviewQueue` and `InvoicesScreen` way (the pattern
      `screens/ClickableTableRows.test.tsx` covers; there is no shared component, so follow theirs and
      add the Matching table to that test). An empty state per filter ("No rows waiting.
      Import hospital bookings to start.").
    - **Row detail panel** (the `ListDrawer` pattern on the right, published through
      `useDemoTriggerContext('matching.selectedRowId', rowId)`; add the key to `DemoContextValues`):
      - header: hospital, channel, received time, the change-type pill, the batch label and any flags;
      - **side-by-side field diff** (US-02.1.3): columns Field, "On the Booking now", "From the
        hospital"; changed rows in warning tint with a tick box (default ticked) on a Modification;
        "Not supplied" in mist where the hospital sent nothing; the matched Booking named with a
        link to its Booking detail and the match basis ("Matched by appointment id 1661303", "Matched
        by NHI and date"; for an update to a Booking an earlier row created, "Matched by appointment
        id, first applied from IR0001"). For a New or unmatched row, the incoming fields alone;
      - **Contract line** under the diff, for every decision that creates or matches a Booking: "Contract",
        then the Contract's name and AA identifier as Phase 18 seeded them (the matched Procedure's
        Contract, or the default a new Booking would get), with "From the hospital: nib" beside it when the row carries a `payer`, the
        "Hospital names a different payer" pill when they differ, and **Change** opening Phase 20's
        office Contract picker (`contractOptionsFor` for that Procedure and hospital, default first).
        Nothing is changed unless the admin picks; the footer label then counts the Contract as a
        change. The hospital's payer text is never written to the Booking (D2);
      - inline correction for an invalid NHI (and the other correctable fields), reusing `RowField`
        from `PdfReview` (move it to `apps/admin/matching/` or `tableChrome` rather than copying);
      - **Decision** (radio cards, the suggested one preselected and marked "Suggested"): Match and
        apply; Create a Booking on a List (a picker of Lists and unassigned Draft Lists at the row's
        hospital on that date and session, then others that day); Create a List in a session (a picker
        of anaesthetists free that session, labelled by name and AM or PM, grouped by Phase 17's partition, showing
        `BlacklistWarning` if a blacklisted anaesthetist is picked); Create a Draft List ("Holds this
        Booking until the office assigns an anaesthetist"); Reject (reason required, with three quick
        reasons: "Not an AA booking", "Duplicate of another row", "Wrong hospital or date"). Phase
        17's `SurgeonSelect` shows under Create a List and Create a Draft List when the row's surgeon
        did not resolve, because both need one;
      - footer action bar: secondary **Reject** and the teal primary whose label follows the decision
        ("Create Booking", "Apply 3 changes", "Move Booking", "Cancel Booking", "Create List and
        Booking", "Create Draft List and Booking", "Move to new Draft List", "Mark as matched");
        disabled with the blocking flag's reason shown ("Correct the NHI before applying", "This
        List is authorised and locked", "Choose the surgeon first");
      - on success, the Admin Review choreography: a `bannerIn` banner ("Applied: Booking created on
        Dr Souter's Tue 28 Jul AM List · Kirsty W. 09:14", with a link to the Booking), the `tickDraw`
        tick, the row dims into Decided, the badge decrements, and **Next row** moves to the next open
        row.
    - Keyboard: the table rows and the decision radios are focusable; Escape closes the panel.
11. **Where the Booking shows its intake.** Phase 15's "SOURCE · Hospital download" line already shows
    on a created Booking. The Booking's History (via `booking.fromHospitalRow`) names the row, the
    hospital and the change type, on all three surfaces through `BookingDetailBody`. The Admin Booking
    detail adds a quiet "From hospital row IR0003" link to `/admin/matching` with that row selected
    (pass the row id in router `state`, like the Invoices List column's `openListId`).
12. **Re-point Phase 14's hospital-message entries.** `fire-hospital-message` and
    `replay-hospital-message` keep `badge: 'future-scope'` and their routes, but become **bar only**
    (the PWA gets the stand-in in work item 13, because a row on a handset has no office to decide
    it). Their descriptions say "Stages the hospital's row on Admin, Matching. The Booking changes
    only once the office applies it." On Mobile Lists in the framed build the result message adds
    "Switch to Admin, Matching to apply it." The S13 to S15 choices stay, badged, so a presenter
    asked about feeds can show one landing as a row, but no scripted beat uses them (RV-28).
13. **Demo triggers** (registry entries; see the next section for labels and effects). Bodies in
    `src/store/matchingDemo.ts` (or beside `demoActors.ts`) so the PWA closure stays pure:
    `stageUnmatchedRow`, `stageRescheduleToEmptyDate` and `officeMatchesHospitalRow`. Every body stages
    rows through `stageImportRows` (channel `download`, a batch labelled "Demo row") and picks its
    date deterministically from the demo clock: the first future session after today, within the
    canvas, not a holiday, with no List at that hospital for that surgeon. Registry tests: routes,
    surfaces, disabled states, determinism, and that `officeMatchesHospitalRow` goes through
    `decideImportRow` (never `createBooking` directly).
14. **Playwright** (`npm run shots`): a new `visual/admin-matching.spec.ts` (import St George's, the
    table and stats, the diff panel on R3 with a field unticked, apply, the banner and Decided, a
    reject with a reason, the St George's update after R1 is applied showing its Modification and
    leaving the Booking unchanged until applied, the unmatched queue after "Send unmatched row",
    Create a List in a session);
    update `phase11.spec.ts` (the simulator's pane 3 says "Sent to matching"; no manual-intervention
    chip) and `phase12.spec.ts` (S1 through the matching screen); add `/admin/matching` to
    `screens.spec.ts`; add the PWA stand-in to `pwa-device.spec.ts`. `data-shot` hooks:
    `matching-import`, `matching-stats`, `matching-table`, `matching-row-<n>`, `matching-diff`,
    `matching-decision`, `matching-apply`, `matching-banner`, `matching-unmatched`.
15. **Capture recipes** (`requirements-board/capture/recipes/`): re-shoot US-02.1.1 (the import
    dialog and the landed rows), US-02.1.2 (the decision panel), US-02.1.3 (the diff, and the update
    to an already matched Booking) and US-02.1.4 (the Unmatched filter; set `status` to captured and
    drop the `absentReason`); turn US-02.5.1, US-02.5.2 and US-02.5.3 (Future Work: the automated
    path) into partial analogues showing the office deciding the Modification, Reschedule and
    Cancellation rows on the matching screen, then the Booking and its History; US-02.5.4 likewise
    (a row flagged "List submitted" applied by the office). Replace every caption that says a
    message was "applied" by itself (RV-28). This
    is the short list; the full step, with the rest of the covered items and the recipes this phase
    breaks, is the Catalogue screenshots section below, run after the review pass. Run
    `npm run verify:board` from the repo root.
16. **Demo guide** (see Demo guide updates below), in this session.
17. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    then the adversarial review pass.

## Demo triggers

"Import hospital bookings" is a **product control** on the Matching screen (with a badged sample-file
picker), not a harness-bar entry, per the ROADMAP rule. Matching itself is normal Admin use. Three
things are not: a hospital sending a row that matches nothing, a hospital moving a Booking to a day
with no List, and the office's side of S1 on a handset, where there is no Admin app. All entries
register in Phase 14's registry; nothing is added to the Control Panel page, which lists them under
their screens.

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `matching-send-unmatched-row` | Send unmatched row | Admin · Matching (`/admin/matching`) | bar | `choices`: **"New booking, no List yet"** (a Southern Cross row for Ms Patel on the first future session with no Southern Cross Ms Patel List or Draft List, a synthetic patient) and **"Change for an appointment AA has never seen"** (a St George's modification whose `externalRef` and NHI match nothing). Runs `stageUnmatchedRow`, then selects the new row. Message (the date as picked): "Southern Cross sent a row for Thu 6 Aug PM. No List there yet, so it waits in the unmatched queue." | no qualifying session in the canvas ("No empty session left on the canvas") |
| `matching-reschedule-no-list` | Reschedule to a date with no List | Admin · Matching | bar | Acts on the Booking matched by the row selected in `matching.selectedRowId` if it has one and is not cancelled or AUTHORISED; otherwise on the seeded `APPT.s13Time` Booking. Stages a Reschedule row moving it to the first future session with no List or Draft List at its hospital for its surgeon. Runs `stageRescheduleToEmptyDate`. Message (the patient and date as picked): "St George's moved this booking to Thu 6 Aug AM. There is no List there yet, so the row is parked and the Booking has not moved." | no eligible Booking ("Select a row matched to an open Booking"), or no empty session |
| `matching-office-matches-row` | Hospital row arrives and the office matches it | Mobile · Lists (`/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`) | pwa | `choices`: **"Sarah Mitchell, Tue 28 Jul AM (S1)"** (stages `SAMPLE_STG` R1 alone) and, on a List route whose List is the persona's, DRAFT and at St George's or Southern Cross, **"A new hospital booking on this List"** (a row built from a small fixture pool of three synthetic patients, the next unused one). Then `decideImportRow` as `OFFICE_SIMULATION_ACTOR` with the derived suggestion. Message: "St George's sent Sarah Mitchell's booking and the office matched it. She is now on your Tue 28 Jul AM List." `badge: 'office-stand-in'` | S1 choice: Sarah Mitchell already on that List ("Already on your Tue 28 Jul AM List"); List choice: pool used up, or the List is not DRAFT |

The PWA entry is an office stand-in: it shows only in the installed PWA's demo sheet, never in the
harness bar, because in the framed build the presenter plays the office in Admin, Matching. The
re-homed "Fire hospital message" and "Replay last message" stay in the bar only, badged Future scope
(work item 12); they stage rows and never apply a change, and no scripted beat uses the S13 to S15
messages (RV-28).

## Out of scope

- **Bringing St George's and Southern Cross rows in without a hand import** (US-02.1.5, whose
  schedule, pull-on-open, sync-button and last-synced criteria were dropped on 2026-10-02, leaving
  "No silent apply", which this phase meets): Phase 34, through `stageImportRows`. There is no sync
  state to keep.
- **Manual-provider sheets delivered by the hospital** with a demo auto-match toggle, demoting the
  HL7/FHIR simulator and hiding the monitor's Future tabs, badging the Surgeon PDFs tab (surgeon
  PDF ingest, US-02.2.1, is Future Work; RV-26), and the S1 rebuild: Phase 34. This phase keeps the
  Surgeon PDFs inbox unchanged.
- **Automated change application** (US-02.5.1 to US-02.5.4 and US-02.5.6, Future Work since
  2026-10-02, with US-14.6.2): a hospital modification, reschedule or cancellation applied with no
  admin deciding it, a reschedule clash accepted as a Draft List with no admin (US-02.5.2; its open
  rules are OQ-87), the lock on a submitted List for automated changes, and concurrent edits
  between an integration and a person. Not built anywhere in the plan; the canned S13 to S15 stage
  rows and stay out of the scripted demo (RV-28).
- **Automatic matching** or a bulk "apply all suggestions": Future Work (US-14.6.2; FT-02.1 says
  matching stays a manual admin review, and on US-02.1.2 Greg's "why is this a manual task" was
  answered with an import gate for the first release). Every row gets its own decision; raise bulk
  apply as a discovery point.
- **A real file upload and parser.** How each hospital provides its bookings is OQ-13; the samples
  stand in.
- **Applying an NHI change** from a row, and the missing-NHI problem list with attach and merge:
  Phase 40. **The unpaid-balance alert at match** (US-11.3.2: mild or strong by the invoice's age
  from its date, mild for a credit balance, always waved through; D24): Phase 40 registers it in
  Phase 15a's warning routine and shows it in the row panel.
- **A hospital setting the Contract** (US-04.3.6, Future Work lane). A row only shows what the
  hospital said about the payer; the admin picks a Contract or leaves the default. No insurer or
  funding source is stored on the Booking (D2), and the billable party comes from the Contract
  (D17).
- **Removing, re-dating or assigning a Draft List** (US-01.6.4, US-01.6.3): Phase 31's actions and
  pages. This phase only creates one from a row, holding the row's Booking.
- **Explicit save and the update email to the rooms or the hospital** (US-02.3.2, US-02.3.3, and the
  per-kind templates of US-02.3.4): Phase 35. The update email is an on-demand button on a Booking
  that picks changes from its change history (D19), never a prompt after a match.
- **Adding a Booking to a List that already has Bookings from admin entry** (EP-02's other admin-entry
  gap): Phase 35. This phase creates Bookings on booked Lists only through a matched row. The four
  intake sources on `Booking.source` are Phase 15's.
- **Estimated duration** arriving on a row (Phase 27's seam): not carried in this phase.
- **A refund for a cancelled prepaid Booking** (US-02.5.3's pointer to US-06.5.2, OQ-40): Phase 41.
  A Cancellation decision calls `cancelBooking`, so whatever 27 and 41 hang on it follows.
- **Re-deciding a decided row** (undo). A wrong decision is corrected on the Booking through normal
  edits; the row's history stays as it was.
- The full S1 and S4 rewrites: Phases 34 and 44. This phase patches S1 Beat 1, S4 Beat 4 and S5 Beat 2.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin side nav shows "Matching" under Day view with no badge; the screen shows the
  empty state, the OQ-13 interim line and the teal "Import hospital bookings" button; no copy on
  the screen says "download".
- [ ] Import, St George's: the dialog shows the "Sample file" badge and four samples; "5 rows
  imported"; the stats strip reads OPEN 5, NEW 1, MODIFICATIONS 1, RESCHEDULES 1, CANCELLATIONS 1,
  UNMATCHED 0 (R2 is the No change row); the badge shows 5. Importing it again says nothing new was added.
- [ ] Open R1 (Sarah Mitchell): New, suggested "Create Booking on Dr Souter, Tue 28 Jul AM".
  Create Booking: the banner, tick and dimmed row show, the badge drops to 4, "Next row" opens R2.
  Mobile Lists, Tue 28 Jul AM: Sarah Mitchell is the fourth Booking at 08:30, "SOURCE · Hospital
  download", on the St George's default Contract, and her existing patient record was reused.
- [ ] Import "St George's bookings, a day later": its row is a Modification of the Booking R1
  created ("Matched by appointment id, first applied from IR0001"), with time 08:30 against 09:00
  and the note side by side. Sarah Mitchell's Booking still reads 08:30 until "Apply 2 changes";
  then it reads 09:00 with the note appended. (Imported before R1 is decided, the row instead shows
  "Earlier row for this appointment still open".)
- [ ] R2: No change, "Matched by NHI and date"; "Mark as matched" records it and writes nothing.
- [ ] R3: Modification with time, procedure and note in warning tint side by side. Untick the note,
  apply "2 changes": the Booking shows the new time and procedure; its notes are unchanged; its
  History shows "Hospital row applied: Modification (time, procedure)" by Kirsty W.
- [ ] Import St George's again after deciding R3: nothing new (identical rows, including R3, are
  skipped). The note-append check is Southern Cross R2 below.
- [ ] R4: Reschedule to another day's List; "Move Booking"; the Booking keeps its id and History on
  the new List. R5: Cancellation; "Cancel Booking" soft-cancels it (still visible, excluded from
  billing).
- [ ] Southern Cross sample: Priya Nair lands on the Tue 28 PM List; R2 shows patient name, DOB
  and note diffs, and a Contract line with "From the hospital: nib" and the "Hospital names a
  different payer" pill. Change the Contract to the nib-held one and apply: the patient is updated,
  the Procedure is on the picked Contract (set by the office), the hospital note is appended below
  the Booking's existing notes (never overwriting them), and no insurer or funding-source field
  appears anywhere on the Booking. Leaving the Contract alone keeps the default.
- [ ] Forte sheet: R2 shows "NHI invalid" and Apply is disabled with the reason; correct the NHI
  inline and apply. R3 is Unmatched ("No List at Forte Health ..."); Create Draft List and Booking
  creates the Draft List with hospital, surgeon, day and session (origin "Hospital row", no Slot or
  anaesthetist taken) holding the row's Booking, and the row moves to Decided. The Draft List shows
  on Phase 31's Draft Lists page and the Day view band with one Booking; assign it to an
  anaesthetist there and the Booking comes with it.
- [ ] Demo actions, **Send unmatched row, New booking, no List yet**: the row appears under Unmatched
  with its reason. Create a List in a session: pick an anaesthetist (a blacklisted one shows the warning
  and can still go ahead); the List and Booking appear on the Day view for that date. The other
  choice gives "No Booking matches appointment ..."; Reject it with "Not an AA booking" and see it
  under Decided with the reason.
- [ ] Select a matched row, then Demo actions, **Reschedule to a date with no List**: a Reschedule
  row appears under Unmatched ("no List there yet"); the Booking has not moved. Create a List in a
  session on that date and the Booking moves onto it, keeping its id and History. Run it again on
  another Booking and choose Create a Draft List: "Move to new Draft List" puts the Booking on the
  new Draft List.
- [ ] A row whose surgeon is not recognised: Create a List and Create a Draft List show the surgeon
  picker and stay disabled with "Choose the surgeon first" until one is picked; Create a Booking on
  an existing List does not need it.
- [ ] Southern Cross R3 (the row whose List is AUTHORISED): "List authorised" flag, the button is
  disabled with "This List is authorised and locked"; Reject works.
- [ ] Admin Integrations (Future-scope badge): Demo actions, Fire hospital message MSG-STG-1001 after
  a reset: the message reads "Sent to matching", Souter's List is unchanged, and a Feed message row
  waits on Matching. Replay is a duplicate. MSG-CPH-2001 still dead-letters; fix the mapping to
  PID-3 and reprocess: a row lands on Matching. No "Manual intervention" wording remains.
- [ ] RV-28: fire each S13, S14 and S15 message (MSG-STG-1010 to MSG-STG-1014): every target
  Booking is unchanged (time, List, notes, not cancelled), and a Reschedule, Modification or
  Cancellation row waits on Matching for each. No scripted beat in the run sheet or the Control
  Panel fires them.
- [ ] The Integrations simulator's pane 3 reads "Sent to matching" with the change type and the
  suggestion, and never "applied".
- [ ] The Demo actions pill is absent on Admin screens with no entries; the Control Panel lists the two
  Matching entries under Admin · Matching with an Open screen link, and the stand-in as "Shown in the
  installed PWA".
- [ ] PWA (`npm run build:pwa` and preview), after a reset: Mobile Lists shows the Demo chip; **Hospital
  row arrives and the office matches it, Sarah Mitchell** puts her on the Tue 28 Jul AM List; the
  choice is then disabled. On an open St George's List, "A new hospital booking on this List" adds a
  synthetic patient. "Fire hospital message" is no longer in the PWA sheet.
- [ ] S1 Beats 1 to 3 run from a reset as patched below; S4 Beat 4 and S5 Beat 2 run as patched.
- [ ] No en or em dash in any new copy, and no "slot" in app copy (OQ-64: say session, AM or PM);
  teal is the only action colour; no crimson on the new nav badge, pills, banner or buttons.
- [ ] Catalogue screenshots: the recipes for US-02.1.1 to US-02.1.5, US-02.3.1 to US-02.3.4, US-02.4.4 and US-02.5.1 to US-02.5.6 are created or updated (US-02.5.1 to US-02.5.4 as partial analogues that never show an automated apply), any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session (ROADMAP rule). Phase 34 rebuilds S1 around the sync; this phase
makes S1 honest now.
- `docs/demo-guide/03-demo-script.md`:
  - **S1 · Stage it and Beat 1** ("the booking arrives from the hospital"):
    - **Click:** Mobile Lists, open Tue 28 Jul St George's AM and read the three booked cases; then
      Admin, Matching, **Import hospital bookings**, St George's; open Sarah Mitchell's row, read the
      suggestion, **Create Booking**; back to Mobile, reopen the Tue 28 Jul AM List. Handset variant:
      Mobile Lists, Demo, **Hospital row arrives and the office matches it**.
    - **Say:** "Hospital bookings are how most bookings reach AA today. They land on the matching
      screen, the office sees exactly what each row would change, and nothing reaches the schedule
      until someone decides, even an update to a Booking already matched. This one is new, so it
      becomes a Booking on Dr Souter's List, on the hospital's default Contract."
    - **Expected:** Sarah Mitchell as the fourth Booking at 08:30, source "Hospital download", her
      existing patient record reused. Replace the "near real time HL7 and FHIR" line; Phase 14's
      Future-scope caveat now only needs to say the simulator is not how S1 is shown.
    - Optional beat 1b: open R3 to show the side-by-side diff and untick a field, or import "St
      George's bookings, a day later" to show Sarah Mitchell's update waiting for approval.
    - Do not fire the S13 to S15 hospital messages in any beat (RV-28): automated changes are Future
      Work. If asked, say "Applying hospital changes automatically comes after the first release;
      until then every change waits for the office here."
  - **S1 Serves** line: "importing hospital bookings and the matching screen" replaces "the RFP's
    near-real-time hospital integration".
  - **S4 Beat 4** becomes **"the unmatched queue"**: Click: Admin, Matching, Demo actions, Send
    unmatched row, New booking, no List yet; open it under Unmatched; Create a List in a session. Say:
    "Nothing from a hospital is ever dropped. A row that matches nothing waits here until someone
    decides: create the List, put the Booking on a Draft List for the office to fill, or reject it
    with a reason." Expected: the row
    in Unmatched, then the new List and Booking on the Day view and the row under Decided. Move the
    feed-mapping dead-letter to "What to narrate rather than click" as Future scope (HL7 v2).
  - **S4 Discovery points:** replace "how inbound messages targeting a submitted or authorised List
    are parked for manual intervention" with "a hospital row for a submitted List waits for the
    office, and one for an authorised List cannot be applied; applying hospital changes
    automatically is Future Work".
  - **S5 Beat 2** (MSG-STG-1002, the new-format NHI): Expected now reads "the message is sent to
    matching; the row on Admin, Matching shows the validated new-format NHI". Or point S5 Beat 2 at
    the Forte sheet's invalid-NHI row, whichever reads better; say which in the PROGRESS entry.
  - **Direct URLs:** add Matching `/admin/matching`.
  - **Recovery from demo accidents:** "Imported the same sample twice: nothing new is added. Applied
    the wrong row: fix the Booking by hand; the row's decision stays in the history."
  - **Discovery points** (S1): OQ-13 (how each hospital provides its bookings, the fields and
    cadence, and whether they carry the insurer or Contract), bulk apply, and whether St George's
    sends an appointment id AA can match on. If Greg's "why is this a manual task" comes up: the
    first release keeps the import gate, and automatic matching and updates are Future Work
    (US-14.6.2).
- `docs/demo-guide/02-workflows-and-handoffs.md`: **Workflow 1** readiness line and triggers ("hospital
  bookings or a sheet arrive"); main path step 5 becomes "Hospital rows are matched on the
  matching screen: the office applies, creates (a Booking, a List, or a Draft List holding the
  Booking) or rejects each one; anaesthetists and the office
  change Bookings directly while the List is DRAFT"; add the matching-screen handoff (office to
  anaesthetist: the Booking appears on her List). **Integration failure** becomes "Hospital rows":
  an unmatched row waits in the unmatched queue; a duplicate row is skipped; a row for a submitted
  List waits for the office; a row for an authorised List cannot be applied. The HL7 dead-letter line
  moves under a Future-scope note, beside one line that automated hospital changes are Future Work.
  The readiness table gains "Hospital import and matching screen, Phase 33" and the HL7/FHIR row
  says Future scope.
- `docs/demo-guide/01-personas-and-responsibilities.md`: the office gains "Import hospital bookings
  and match each row"; the integration-operator section says the matching screen is the in-scope
  surface and the HL7/FHIR monitor is Future scope.
- `docs/demo-guide/04-presenter-cheat-sheet.md`: rewrite "How do late hospital changes work?" (rows
  land on the matching screen; the office applies them up to AUTHORISED; nothing applies itself;
  automated application comes after the first release, US-02.5.1 to US-02.5.4);
  the roles table's System/integration column ("brings rows in; never changes a Booking"); one line
  for the two Matching triggers and the PWA stand-in.
- `docs/demo-guide/master-demo-guide.html`: mirror every edit above (S1 stage and Beat 1, S4 Beat 4,
  S4 discovery points, S5 Beat 2, Direct URLs, recovery, Workflow 1, integration failure, personas,
  cheat sheet).
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`): S1's message becomes "Reset to a
  clean S1 state. Start in Mobile, then import the St George's bookings on Admin, Matching and create
  Sarah Mitchell's Booking. ..." with the rest unchanged, and the old "Fire hospital message" step
  and its "arrives in a later build" caveat gone; S4's Beat 4 line points at Admin, Matching,
  Demo actions, Send unmatched row; S5's MSG-STG-1002 line says it is sent to matching.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 33` first: earlier phases may have
changed these recipes since this plan was written. The harness bar is hidden in shots, so recipes
stage rows through the product's Import hospital bookings dialog (the badged sample picker); for the
bar-only triggers ("Send unmatched row", "Reschedule to a date with no List") use the matching
`/demo/control` entry in `setup`, as ATLAS.md's Shell notes say. This section is work item 15's full form; work item 15 stays as its short
list.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md) Import hospital bookings | partial · admin-surgeon-pdf-import[inbox,review-rows] | captured. Re-shoot on `/admin/matching` (admin): `matching-import` open (the Sample file dialog listing the four samples: St George's, St George's a day later, Southern Cross and Forte) and the landed rows (`matching-table` after importing `SAMPLE_STG`, "5 rows imported from St George's"). The surgeon PDF shots go: surgeon PDF ingest is Future Work (US-02.2.1), so it is no longer an analogue. Drop the partial reason. Caption: "Hospital bookings imported; their rows appear on the matching screen" |
| [US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) Match rows to Lists and Bookings | partial · admin-pdf-row-matching | captured (admin). Shots on the row panel (`matching-decision`): `match` (Match and apply on the suggested row), `create-booking` (Create a Booking on a List picker), `create-list` (Create a List in a session), `create-draft` (Create a Draft List holding the row's Booking), `reject` (reason required, quick reasons). Highlight `matching-decision`. Drop the PDF matching shot (Future Work) and the partial reason |
| [US-02.1.3](../../../../requirements-board/requirements/stories/US-02.1.3.md) Show differences on match | absent | captured (admin). Import `SAMPLE_STG`, open R3 (the `APPT.s14` Modification): `diff` with time, procedure and note in warning tint side by side (`matching-diff`), and `diff-unticked` with the note unticked and the footer label counting 2 changes. Add `matched-update`: after R1 is applied, import `SAMPLE_STG_UPDATE` and open its row, a Modification of the Booking R1 created, waiting for approval. Caption: "Field-level differences shown before they are applied, including updates to a Booking already matched". Remove the absent reason |
| [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) Unmatched queue | partial · admin-needs-attention-queue | captured (admin). Import `SAMPLE_FORTE_SHEET`, switch the filter to Unmatched (`matching-unmatched`): R3 waits with its reason "No List at Forte Health ...", and the nav badge is amber. Add a `decided` state after Create Draft List shows the row left the queue with nothing dropped. Retire the old integration-log shot (its S14 manual-intervention message no longer exists). Drop the partial reason |
| [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) Automatic sync from St George's and Southern Cross | absent (placeholder: "Not built yet: catch-up Phase 34 builds this.") | partial (admin). Shot `rows-wait-for-decision`: after importing `SAMPLE_STG`, the Open table with the "Nothing changes the schedule until you decide" header line, and the Booking R3 targets unchanged (second state on the Booking). `absentReason`: "Rows wait for the admin's decision, so No silent apply is shown. Bringing St George's and Southern Cross rows in without a hand import is built in Phase 34." Phase 34 turns it to captured |
| [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md) Read, correct and ingest a surgeon PDF list | captured · admin-surgeon-pdf[inbox,extracted] | unchanged by this phase; Future Work since 2026-10-02. The Surgeon PDFs inbox stays on `/admin/integrations`; re-check the shot still passes after the Integrations tabs change. Phase 34 badges the tab Future scope (RV-26) |
| [US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md) Create or amend a Booking | partial · admin-phone-advice-booking[free-list,form], admin-amend-booking | stays partial. This phase creates Bookings on booked Lists only through a matched row, shown in the US-02.1.2 `create-booking` shot. Reword the reason: the office adding a Booking to a List that already has one by hand is Phase 35 |
| [US-02.3.2](../../../../requirements-board/requirements/stories/US-02.3.2.md) Save Booking changes explicitly | absent (placeholder) | unchanged: absent until Phase 35. No shots |
| [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md) Draft a booking update email | absent (placeholder) | unchanged: absent until Phase 35 (the on-demand update email, D19). No shots |
| [US-02.3.4](../../../../requirements-board/requirements/stories/US-02.3.4.md) Update email templates per kind of change | none (create it) | create it as absent: "Update email templates per kind of change are built in Phase 35." No shots |
| [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking, manually or from a photo | captured · web-add-card[choose,manual], mobile-add-card[choose,manual] | unchanged (Phase 15b re-shot it without photo capture). Check it still passes (web and mobile) |
| [US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md) Add a Booking from a photo of the booking card | none (create it); Phase 15b may have created it | Future Work. If Phase 15b left no recipe, create it as absent: "Future Work: a booking from a photo of the booking card is not part of the first release." No shots |
| [US-02.5.1](../../../../requirements-board/requirements/stories/US-02.5.1.md) Apply a modification | captured · simulator-inbound-message[received,applied], admin-card-history | partial (Future Work: the automated path). Re-shoot as the first-release analogue: the Modification row (R3) on the matching screen before apply (`received`), then after the office applies it the changed Booking and its History line "From hospital row" (admin `card-history`, applied through the store setup, not a replay). `absentReason`: "Automated application from an integration is Future Work (US-14.6.2). In the first release the office applies a hospital modification on the matching screen, shown here." Drop the simulator "applied" shot (RV-28) |
| [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md) Apply a reschedule | captured · simulator-inbound-message[received,applied], web-rescheduled-card | partial (Future Work: the automated path, with its clash rule, OQ-87). Re-shoot as the analogue: the Reschedule row (R4) on the matching screen (`received`), the Booking moved by the office onto the web List (`/web/lists/<new list>`) with its History intact (`applied`), and the "no List there yet" Reschedule waiting as unmatched in a third state. `absentReason`: "Automated reschedules, and a clash becoming a Draft List with no admin, are Future Work. In the first release the office decides each reschedule on the matching screen." Drop the simulator "applied" shot |
| [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md) Record a cancellation | captured · simulator-inbound-message[received,applied], web-cancelled-card | partial (Future Work: the automated path). Re-shoot as the analogue: the Cancellation row (R5) on the matching screen (`received`), then the Booking the office cancelled kept visible on the web List, marked cancelled (`applied`). `absentReason`: "Automated cancellation from an integration is Future Work. In the first release the office records a hospital cancellation on the matching screen." Drop the simulator "applied" shot |
| [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) Changes accepted until the procedure | partial · simulator-change-cutoff | stays partial (Future Work: the automated path), re-shot on the matching screen (admin): a row for a submitted List (MSG-STG-1014, "List submitted") that the office can still apply, beside a row for an authorised List (`SAMPLE_SX` R3) with its flag and the disabled apply ("This List is authorised and locked"). Reword the reason: "Automated changes, and their lock once the List is submitted, are Future Work. In the first release every hospital change waits for the office, who may apply it until the List is authorised." The "parks for manual intervention" wording goes |
| [US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md) Append-only change history | captured · admin-card-history, admin-audit-log | unchanged. Check the History now names the hospital row and the office who applied it for a Booking created from one; no new shot required |
| [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md) Concurrent edits | absent | stays absent; reword the reason: "Future Work: concurrent edits between an automated update and a person." Nothing visible here |

**Recipes this phase breaks.** The Integrations monitor stays, but its messages stage rows instead of
applying, and `manualIntervention`, the park codes and the S14 "Locked target (manual intervention)"
label are retired. Found at plan time, with the re-point for each:
- `US-02.5.1`, `US-02.5.2`, `US-02.5.3`: their `inbound-message` simulator shots and the `setup`
  steps of `card-history`, `rescheduled-card` and `cancelled-card` replay S14, S13 and S15 and expect
  the Booking to change. Re-point as in the table (matching screen, then the office decides), as
  partial analogues: no recipe may show an automated apply (RV-28).
- `US-02.5.4`: `change-cutoff` uses S14 "Locked target (manual intervention)" and the
  `integrations-schedule-change` pane. Re-point as above.
- `US-02.1.4`: `needs-attention-queue` uses S12 and S14 and `integrations-attention`. Replaced above.
- `US-14.1.1`: `hl7-siu-message` state `applied` reads the schedule-change pane, which now says "Sent
  to matching"; keep the shot, change the caption to "Staged on the matching screen" and highlight the
  same pane. `message-log` (setup replays one message) keeps working; check the log wording.
- `US-14.5.1`: `dead-letter` still dead-letters (MSG-CPH-2001); check only. `US-14.2.1`, `US-14.3.1`
  (the FHIR model and the live feed): check the live-feed result text, which now says rows were sent
  to matching. Phase 34 moves all of these to the Future-scope surface and re-points them again.
- `US-02.2.2`, `FT-02.2`, `US-11.1.2` use `/admin/integrations` tabs (Surgeon PDFs, Validators):
  unchanged here; check they pass.
- Anything else that opens `/admin/integrations` or `/demo/integrations`: the `--dry` run is the check.

**ATLAS.md.** Update Routes (`/admin/matching`, the Matching nav item and its amber badge), Existing
hooks (`matching-import`, `matching-stats`, `matching-table`, `matching-row-<n>`, `matching-diff`,
`matching-decision`, `matching-apply`, `matching-banner`, `matching-unmatched`), Overlays (the
Import hospital bookings dialog), the Integration simulator description (messages stage rows; the
S14 locked-target label and "manual intervention" are gone; S13 to S15 never apply) and a note on
the sample files (`SAMPLE_STG`, `SAMPLE_STG_UPDATE`, `SAMPLE_SX`, `SAMPLE_FORTE_SHEET`) and the row
ids they land as.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:
- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, with the catalogue files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the
  pass in the phase entry;
- do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**
- **No silent apply, anywhere.** Grep for every caller of `createBooking`, `editBooking`,
  `editPatient`, `editProcedure`, `reassignBooking` and `cancelBooking` reachable from
  `integrationActions.ts`, the fixtures and the trigger bodies: the only path from a hospital row to
  the schedule is `decideImportRow`, and only with an explicit decision (the PWA stand-in included).
  Every canned message, S13 to S15 included, leaves the schedule byte-identical (RV-28). An update
  to an already matched Booking is never applied because the appointment matched before: it is
  diffed and waits like any other row (US-02.1.3).
- **Nothing is dropped.** A row that matches nothing, a reschedule to a date with no List, a
  modification for an unknown appointment all stay open and visible; "unmatched" is derived, so no
  code path can clear it without a decision. A Draft List created from a row holds the row's
  Booking (OQ-44), so no row is left waiting on one, and a failed second step leaves the row open.
  A skipped re-import is counted and said.
- **A missing field is never a change.** No incoming "not supplied" value blanks a Booking field; the
  diff, the classifier and the apply agree on this.
- **D2 holds.** No decision writes an insurer or funding source to a Booking, Procedure or Patient;
  the row's payer is display only. A Contract changes only by the admin's pick, through
  `setProcedureContract` or `createBooking`'s checked `contractId`, and only from
  `contractOptionsFor`'s offer.
- **The Draft List rules hold.** `createDraft` never saves without hospital, surgeon, day and
  session, takes no Slot or anaesthetist, and puts the Booking on the Draft List through Phase 31's
  path, not a second copy.
- **Atomic decisions.** Pre-check then refusable-first: a refused move, a locked List, a stale
  suggestion or an invalid NHI leaves the row open and the schedule unchanged. The decision and its
  Booking-side history row land in one commit. Look for races: the clock passing the session, the
  List being submitted or authorised, the Booking cancelled or moved by hand between suggestion and
  apply.
- **One set of rules.** Created Bookings go through `createBooking` (default Contract, `source:
  'hospitalDownload'`, `upsertPatient` dedupe); new Lists through `assignListToSlot` (blacklist,
  conflicts, pairing); Draft Lists through Phase 31's action; reschedules through `reassignBooking`.
  No second copy of any of them in `matchingActions.ts`.
- **The matcher is pure and deterministic.** No store, React, `Date.now()`, `new Date()` or
  `Math.random()` in `src/domain/intake/`; trigger dates come from the demo clock; the fixtures are
  synthetic and pinned by tests.
- **Future scope stays badged and inert.** The HL7/FHIR entries are bar only and badged; no
  `manualIntervention` value, chip or copy remains; the simulator never says a message "applied";
  no run-sheet beat, Control Panel scenario or capture recipe shows S13 to S15 changing a Booking
  by itself; nothing builds US-02.5.2's automated clash-to-Draft-List rule.
- **Triggers and PWA purity.** The two Matching entries are bar only and scoped to `/admin/matching`;
  the stand-in is PWA only; bodies live in `src/store`; nothing in the PWA closure imports
  `apps/admin`, `apps/demo` or `shell`.
- **Design and copy.** The screen follows Admin Review (stats strip, one table, flags as warning
  pills, footer action bar, the authorise choreography); the panel follows the List drawer; change
  types in plain language; teal-only actions; no crimson on the badge, pills or banner; no en or em
  dashes; no "slot" in app copy (OQ-64) and "import", not "download", on the screen (US-02.1.1);
  mono tabular figures for NHIs, times and ids.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions (the labelled sample files while OQ-13 is
  open; the "Session has started" flag not built, since US-02.5.4 now ties the lock to submission),
  anything logged rather than fixed (any covered item that left the Future Work lane), and the
  screens worth a look, each with its route and persona (Admin, Matching `/admin/matching` as
  Kirsty W.; the Booking History of a row-created Booking; Mobile Lists Tue 28 Jul AM as Dr Souter).
- **Status row** for catch-up Phase 33, and a phase entry with:
  - the drift-check result against 3d3a18c (items changed or not; OQ-13 and FT-02.1 status; OQ-44
    built as answered, with how the Booking is put on the Draft List; D2 and D17 confirmed;
    US-02.5.1 to US-02.5.4 still Future Work and not built);
  - what was built, and what was removed (`applyEffect`, the park codes, `manualIntervention`, the
    Phase 28 park-on-no-List seam, `resultBookingId`);
  - the `PERSIST_VERSION` bump (from and to);
  - the seeded Bookings the fixtures name, and the dates the two triggers pick on a fresh seed, for
    the demo guide;
  - tests added (matcher, fixtures, store, the no-silent-apply sweep over every canned message,
    triggers, Playwright);
  - the Catalogue screenshots result: recipes created or changed, the REPORT.md counts (captured,
    partial, absent, failed) before and after, and any partial reason handed to a later phase (US-02.1.5
    to 34; US-02.3.1 to 35; US-02.5.1 to US-02.5.4 as Future Work analogues);
  - the review pass.
- **Decisions log:**
  1. **Supersedes** the 2026-07-24 "Phase 11 message-shape and feed decisions" items (5) and (6) in
     part: a parsed hospital message no longer creates, moves, edits or cancels a Booking through an
     `integration` actor. It stages a row on the matching screen and the office applies it (RV-13;
     US-02.1.5 "No silent apply"). The automated S13 to S15 changes are Future Work (US-02.5.1 to
     US-02.5.4, US-14.6.2) and leave the demo (RV-28). `manualIntervention` is retired. MSH-10
     dedupe, the transient retry and the mapping dead-letter stay, as Future-scope tooling, until
     Phase 34.
  2. Matching suggestions, the unmatched queue and the change type are **derived** at read time from
     the row and the current schedule, never stored; only the incoming fields, office corrections and
     the decision are stored. An update to an already matched Booking is matched by correlation and
     approved like any other row (US-02.1.3).
  3. A field the hospital did not supply is never a change (OQ-13's "sometimes do not come through").
     A hospital note is appended, never overwritten. An NHI difference is shown, never applied.
  4. A hospital row never sets a Contract (US-04.3.6 is Future Work): a created Booking takes the
     default (Phase 20) unless the admin picks another in the panel, the hospital's payer text is
     shown beside the Contract, never stored on the Booking (D2, OQ-55), and the billable party
     comes from the Contract (D17).
  5. "Create a Draft List" from a row creates it with all four of hospital, surgeon, day and session
     and puts the row's Booking on it in the same decision (US-02.1.2's own decision; the contents
     per OQ-44 and US-01.6.1, Confirmed 2026-10-02, whose notes left creation from the matching
     screen for later); a row never waits on a Draft List.
  6. The admin may match a Reschedule row onto another anaesthetist's List; a reschedule with no
     target List parks as unmatched (US-02.1.4). This replaces the Phase 11 behaviour that retimed in
     place. US-02.5.2's automated rule (a clash accepted as a Draft List with no admin, OQ-87) is
     Future Work and not built.
  7. Every hospital-pathway channel (import, manual sheet, feed message) stamps `source:
     'hospitalDownload'`; the channel lives on the row and in the Booking's History.
  8. The samples are labelled fixtures while OQ-13 (how each hospital provides its bookings) is
     open; app copy says "import", per US-02.1.1's retitle.
  9. A row's surgeon resolves by HPI CPN first, then by name (OQ-52); `createList` and `createDraft`
     need a resolved or admin-picked surgeon.
- **Handoff notes:**
  - For **34**: `stageImportRows` is the entry point a sync or a delivered sheet calls; there is no
    sync state to add (US-02.1.5 dropped it); the manual-sheet auto-match toggle should call
    `decideImportRow` with the suggestion, never a write path directly; the button is "Import
    hospital bookings" and `importHospitalDownload` keeps its name; demote the simulator and hide the
    monitor's Future tabs; rebuild S1 from this phase's Beat 1.
  - For **35**: the on-demand update email (D19) picks changes from the Booking's change history,
    and a decided row's `booking.fromHospitalRow` entry (with `fieldsApplied`) is one of the changes
    it can pick, sent to the surgeon's rooms or the hospital from the per-kind template (US-02.3.4).
    Concurrent edits (US-02.5.6) are Future Work.
  - For **40**: register the unpaid-balance alert (US-11.3.2: mild under, strong over the threshold
    counted from the invoice date, mild for a credit balance, always waved through; D24) as a Phase
    15a warning rule and show it in the row panel at create and match; NHI attach and merge replace
    the "NHI differs" dead end; the "No NHI supplied" pill is where the missing-NHI problem list
    starts (OQ-49).
  - For **42 and 43**: the samples are not master data; 43's restricted raw-row view can read
    `ImportRow.incoming`.
  - For **44**: S1 Beat 1, S4 Beat 4 and S5 Beat 2 were patched, not rewritten; keep S13 to S15 out
    of the rewrite (RV-28); the PWA parity audit should walk S1 on a handset with the stand-in.
