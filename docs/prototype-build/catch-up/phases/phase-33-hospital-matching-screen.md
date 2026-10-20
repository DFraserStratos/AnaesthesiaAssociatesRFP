# Phase 33 · Hospital download and the matching screen

**Requirements covered:**
[EP-02](../../../../requirements-board/requirements/stories/EP-02.md) Booking intake and change handling (Confirmed; **changed 2026-10-20**: nothing is applied automatically, hospital data lands on a review and merge screen, a Booking that moves day is a cancellation plus a new Booking, and inbound changes are accepted until the office authorises the List) ·
[FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md) Hospital booking download and matching screen (Verify; its 2026-10-07 note: **no automated decisions in the first version**, downloads land in the matching and creating screen, staff see the patient details and what is missing, then save a Draft List or assign an anaesthetist; **changed 2026-10-16 and 20**: the hospital sends **one updated theatre list a day, for the next day**, with no repeated updates (format and fields still OQ-13), and it stays the priority intake pathway while OQ-108 is open, D51) ·
[US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md) Import hospital bookings (Confirmed; the system imports hospital bookings "however each hospital provides them", not a file or a download) ·
[US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) Match rows to Lists and Bookings (Confirmed; each row shows its procedure text exactly as received; **changed 2026-10-19: a row with no NHI cannot become a Booking and waits in the unmatched queue until the office adds the NHI**; the Draft List is its own decision) ·
[US-02.1.3](../../../../requirements-board/requirements/stories/US-02.1.3.md) Show differences on match (Confirmed; a later update for an already matched Booking arrives in the same screen, **matched by date, surgeon, location and session**, and the admin approves it) ·
[US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) Unmatched queue (Confirmed; **changed 2026-10-19**: rows not yet matched or accepted, and an incoming booking with no NHI, wait until the office decides or adds the NHI; there is no "NHI pending" Booking; Phase 40 builds the office's view of the rows waiting for an NHI) ·
[FT-02.5](../../../../requirements-board/requirements/stories/FT-02.5.md) Change types and audit (Confirmed; **changed 2026-10-19: three types, new, modification (a time change within the same List included) and cancellation**; a day move is not a type, it arrives as a cancellation plus a new Booking; every change is recorded with its source, and here the office applies it) ·
[DM-34](../analysis/domain-model-delta.md#dm-34) Intake: import rows, each showing its text as received, admin match/create/reject decisions, later updates shown as differences for approval, the unmatched queue including rows with no NHI (the row, decision and queue half; bringing the two hospitals' rows in is Phase 34, with no sync state now that US-02.1.5 dropped it) ·
[RV-13](../analysis/reverse-check.md#rv-13-automated-modify-reschedule-and-cancel-from-hospital-messages-is-shown-working-with-a-day-move-applied-as-a-move) Automated modify, reschedule and cancel from hospital messages is shown working, with a day move applied as a move (Hide from demo: the canned S13 to S15 messages stage rows and never apply themselves, a day move is a cancellation plus a new Booking, and none is in the scripted demo). The old RV-28, which this phase also covered, left when the reverse check renumbered on 2026-10-20: its work is RV-13's, and the new RV-28 (office edits write through with no Save) is Phase 35's.
Also touches, without closing:
[US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) (Proposed; its only criterion is "No silent apply", met here for every row that arrives; one list a day for the next day is its cadence; bringing St George's and Southern Cross rows in without a hand import is Phase 34),
[US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) and [DM-51](../analysis/domain-model-delta.md#dm-51) (Phase 20a's source wording: every row decision that creates or changes a Booking writes the row's wording through 20a's `addSourceText` or `createBooking`'s source text, verbatim, added beside what the Procedure already holds, never overwriting it; the hospital's wording stays apart from the rooms'),
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) (Open, OQ-103; Phase 20a's stack: the text as received with the rooms' and the hospital's apart, the Contract and the RVG code where the Contract prices from RVG units; this phase puts it on the matching screen, which completes 20a's partial recipe),
[US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) (the "matched" half: "Admins apply the Contract to each Procedure at booking setup, when the Booking is created or matched": the office picks holder, Contract and line in the row panel, the RVG code is the anaesthetist's, and a created Booking without a Contract waits on Phase 20's "Needs a Contract" list),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (No contract (RVG) first; "There are no hospital, insurer or procedure default Contracts, and nothing is derived from the List's location", so a row's hospital never sets a Contract; US-04.3.6, the hospital setting the Contract, is Proposed and not built),
[US-02.5.1](../../../../requirements-board/requirements/stories/US-02.5.1.md), [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md) (retitled "Reschedule to another day arrives as cancel and new Booking"), [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md), [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) (retitled "Inbound changes accepted until the List is authorised") and [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md) (Future Work: the **automated** path, with [US-14.6.2](../../../../requirements-board/requirements/stories/US-14.6.2.md). This phase builds none of it. The office-decided new Booking, modification and cancellation on the matching screen are US-02.1.2, US-02.1.3 and FT-02.5's, and US-02.5.4's window, until AUTHORISED, is the one the office's decision runs in; their capture recipes become partial analogues, see Catalogue screenshots),
[US-02.2.3](../../../../requirements-board/requirements/stories/US-02.2.3.md) (Future Work, new: detecting Bookings missing from a re-sent List; not built, a removal stays for the office to cancel by hand),
[US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md) (Matches; "every entry records its source": a decided row's History line names the office who applied it and the hospital row it came from),
[US-01.6.1](../../../../requirements-board/requirements/stories/US-01.6.1.md) (Confirmed, the four attributes required: a Draft List created from a hospital row, with hospital, surgeon, day and session, holding the row's Booking; the Draft List itself is Phase 31),
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) (the payer on the Booking, Phase 21's: a Booking created from a row gets the patient as payer like any other; a row never names a guardian or a billable party),
[US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md) (the unpaid-balance alert "at Booking create or match": mild under and strong over the threshold counted from the invoice date, mild for a credit balance (D24), never a block; Phase 40 registers it as a rule in Phase 15a's warning routine and shows it on this screen),
[DM-03](../analysis/domain-model-delta.md#dm-03) (a Draft List can hold Bookings; "a matching-screen row can create one"),
[DM-12](../analysis/domain-model-delta.md#dm-12) (the insurer and approval number on the Booking, OQ-93 answered in part, D28, Phase 21's `Booking.insurerId` and `insuranceApprovalNumber`: a row's insurer, taken from the source data, is recorded on the Booking by the office's decision; a hint, it never decides who is billed),
[RV-14](../analysis/reverse-check.md#rv-14-hl7-v2-to-fhir-simulator-live-drip-and-scenario-s1-built-on-them) and [RV-15](../analysis/reverse-check.md#rv-15-reliability-tooling-retries-dead-letter-queue-manual-intervention-residual-unbadged-nav-badge-patient-names-in-the-log) (the HL7/FHIR tooling keeps Phase 14's Future-scope badges; Phase 34 demotes it).
**Changed since the plan was written** (2026-10-08 to 2026-10-20, catalogue `60e2d1e` to `d4db277`): the match key for a later update is the List's date, surgeon, location and session, then the patient (US-02.1.3, AR-21 `look-for-match`); every row shows its procedure wording as received and the Bookings it creates or changes keep it, **added beside** what the Procedure holds (US-02.1.2, US-02.5.7, Phase 20a); a created Booking carries **no default Contract** (OQ-78) and **no procedure to match** (OQ-99 answered, D33): the office picks the Contract in the panel or later from Phase 20's "Needs a Contract" list, and the RVG code is the anaesthetist's; the hospital sends one theatre list a day for the next day; a **day move is a cancellation plus a new Booking** (D62, OQ-87: Lists never move day, so the "Reschedule" change type and the S13 cross-List move go); a **row with no NHI waits** in the unmatched queue and creates no patient or Booking (D11, OQ-49 answered); approved changes apply **until the List is AUTHORISED** (US-02.5.4), so a submitted List is an ordinary target; the insurer is stored on the Booking from the source data (D28, Phase 21), not offered as an indication; the List states are DRAFT (a Draft List), ACTIVE, SUBMITTED and AUTHORISED (15b, 31); "blacklist" is Phase 17's private not-preferred pairing with a tier-ordered picker (D44). The phase depends on 20a.
**Open questions:** [OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md) (Open: the cadence is settled for now, one theatre list a day for the next day with no repeated updates; the format and fields per hospital are not, and the Contract and patient details sometimes do not come through; the 2026-10-07 update: a later update for the same booking is matched by "the date, the surgeon, the location, the slot" and staff "just say approve update"; built as labelled sample files, see the drift check). [OQ-108](../../../../requirements-board/requirements/questions/OQ-108.md) (Open: which source starts a booking and which integration comes first; **D51 default, 2026-10-20: the hospital download stays the priority pathway and surgeon PDF ingest stays Future Work**; the Matching screen is built as the priority pathway and the Surgeon PDFs inbox is left alone). [OQ-109](../../../../requirements-board/requirements/questions/OQ-109.md) (are St George's and Southern Cross synced in the first release: Phase 34's). [OQ-34](../../../../requirements-board/requirements/questions/OQ-34.md) is Answered (the hospital download carries the most bookings).
**Answered and built as answered:** [OQ-49](../../../../requirements-board/requirements/questions/OQ-49.md) (D11, 2026-10-16 and 19: the NHI is mandatory and a Booking cannot be saved without one; an incoming booking with no NHI waits on the matching screen's unmatched queue, creating no Booking or patient, until the office adds the NHI; Phase 40 makes the NHI required on every form and builds the office's view of waiting rows). [OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md) (D33: there is no procedure to match; at setup the office identifies who pays, holder then Contract then line; the RVG code is optional and the anaesthetist's). [OQ-87](../../../../requirements-board/requirements/questions/OQ-87.md) (D62: a List does not move; a Booking moved to another day is a cancellation plus a new Booking, and detecting removals is US-02.2.3, Future Work). [OQ-93](../../../../requirements-board/requirements/questions/OQ-93.md) (answered in part, D28: the insurer and approval number are stored on the Booking and never decide who is billed; whether insurance narrows the Contract list is Phase 21's). [OQ-44](../../../../requirements-board/requirements/questions/OQ-44.md) (a Draft List is a List with no anaesthetist; hospital, surgeon, day and session are all required; Bookings can be added before an anaesthetist is assigned; only the office assigns it, OQ-86 and D46), so "Create a Draft List" saves all four fields and puts the row's Booking on the new Draft List in the same decision. [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (No contract (RVG) is the one default, offered first; no hospital, insurer or procedure default Contracts), so a created Booking has no Contract until the office picks one. [OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) and D17 (the Contract bills its holder, or the payer named on the Booking), so a row never sets a billable party or a payer. [OQ-52](../../../../requirements-board/requirements/questions/OQ-52.md) (the HPI CPN is the surgeon's unique index), so a row's surgeon resolves by HPI CPN first, then by name. [OQ-43](../../../../requirements-board/requirements/questions/OQ-43.md) (D44: private two-way pairing preferences; the office gets a soft not-preferred warning when it assigns a List, never a block), which "Create a List in a session" shows like every office pairing path.
**Depends on:** Phase 20a (the received text kept apart by source: `Procedure.sourceTexts`, `SourceText`, `SourceTextChannel`, `addSourceText`, `createBooking`'s `sourceText` input and its "Type the procedure as told, or choose an RVG code." refusal, `procedureStackView` and `ProcedureStack` in `domain/billing/procedureStack.ts` and `shared/booking/`, and its re-pointed "Fire hospital message" on the Booking routes) and Phase 31 (Draft Lists with the four required fields that hold Bookings, `createDraftList(..., 'hospitalRow')`, `pairingIssues` and Phase 30's conflict raising on every path). Through them: Phase 20 (one Contract per Procedure: `createBooking`'s optional Contract pick, `contractCandidatesFor` and its selectors, `ContractPickerSheet` with No contract (RVG) first, `setProcedureContract`, `needsContractBookings` and the "Needs a Contract" card; no billing route and no Procedure `insurerId`), Phase 19 (RVG groups with no procedure list: `rvgGroupId`, `pickRvgGroup`, the `CodePickerSheet` type-ahead), Phases 19a and 19b (starting values and the locked modifiers, refreshed by 20's actions), Phase 18 (holders, the AA code, the one stored No contract (RVG)), Phase 38a (the edit window until AUTHORISED, the office's and the anaesthetist's), Phase 17 (the surgeon master with `hpiId`, the HPI CPN; `rankAnaesthetistCandidates`, `AnaesthetistCandidates`, `NotPreferredWarning` and the acknowledgement on the office write paths), Phase 15a (the warning routine), Phase 15b (ACTIVE for an assigned List), Phase 14 (built: the registry, `useDemoTriggerContext`, `OFFICE_SIMULATION_ACTOR` in `store/demoActors.ts`, `store/officeStandIn.ts`, the PWA demo sheet and the Future-scope badges), Phase 15 (built: Booking vocabulary and `Booking.source`, whose `hospitalDownload` value the HL7/FHIR path stamps as an interim "until Phase 33", `integrationActions.ts` :161) and Phase 28 (Slots, `assignListToSlot`, `placeListOnSlot`, `slotFor`/`listInSlot`, and the S12/S13 park-on-no-List seam, which this phase replaces, with Phase 31's interim `pairingIncomplete` park if 31 left one). **Not guaranteed before 33** (outside its dependency chain, though normally done first by number): Phase 21 (the payer and the insurer with its approval number on the Booking: `Booking.payer`, `Booking.insurerId`, `setBookingInsurance`), Phase 23 (the primary Procedure) and Phase 25 (the AUTHORISED lock) and Phase 27 (the prepayment re-check on a change of Procedures, Contract or payer). Where a work item names them, use them if DONE; otherwise the row's wording goes on the Booking's first Procedure, the insurer stays display only, and the AUTHORISED refusal is today's `editRefusal` `listAuthorised`. Record which in the drift-check result. First phase of the Intake track; 34 and 35 build on it.
**Estimated:** 2 sessions. Session 1 is the model, the pure matcher, the fixtures, the store actions and the HL7/FHIR re-route, re-greened (work items 1 to 9): after it the demo still works, because the Integrations monitor shows each message as "Sent to matching", and a temporary check in `demoScenarios.test.ts` drives S1 through the store. Session 2 is the Admin matching screen with the stack, the triggers and PWA stand-in, Playwright, capture recipes and the demo guide (work items 10 to 17).

## Goal

Today a hospital booking reaches the schedule only as a simulated HL7 v2 or FHIR message, and
`processMessage` applies it at once: it creates, moves, edits and cancels Bookings as an
`integration` actor, finds the Booking by the hospital's appointment id, refuses once a List is
SUBMITTED, and parks only what it cannot apply (RV-13). The canned S13, S14 and S15 messages show
automated moves, modifications and cancellations working, which the catalogue puts in Future Work
(US-02.5.1 to US-02.5.4, US-14.6.2), and S13 moves a Booking across Lists to another day, which
US-02.5.2 now rules out (D62: Lists never move day). There is no hospital import, no matching
screen, no field diff and no way for the office to say "not this one". The catalogue reverses that.
The hospital sends one updated theatre list a day, for the next day (OQ-13), and importing it is the
priority pathway (OQ-34; D51 while OQ-108 is open); the first version makes **no automated
decisions** (FT-02.1); the list lands on a review and merge screen; every row gets an office decision
and shows its procedure text exactly as received (US-02.1.2); a later update to an already matched
Booking arrives in the same screen, matched by date, surgeon, location and session, and waits for the
office to approve it with its differences shown (US-02.1.3); a Booking that moves day arrives as a
cancellation plus a new Booking; a row with no NHI waits; and nothing reaches a Booking until the
office decides (US-02.1.5 "No silent apply"). Approved changes apply until the office authorises the
List (US-02.5.4). AR-21 (the Booking/List update diagram) is the picture: regions `matching-screen`,
`rows-wait`, `look-for-match`, `match-found`, `review-differences`, `create-booking`, `apply-change`
and `record-change`.

This phase:

- adds a staged **intake model**: an `ImportBatch` (one hospital import, one manual sheet, or one
  feed message) holding `ImportRow`s, each carrying the hospital's incoming fields (its procedure
  wording verbatim among them), its status (open, applied, rejected) and, once decided, the office's
  **decision**: match to a Booking and apply, create a Booking on a List, create a List in an
  anaesthetist's session, create a Draft List that holds the row's Booking (its contents per OQ-44),
  or reject;
- adds one **pure matcher** (`src/domain/intake/`) that, for each open row, finds the List by the
  row's **date, surgeon, hospital and session** and then the Booking on it by the patient's **NHI**,
  classifies the change in plain language (**New, Modification, Cancellation**, or **No change**;
  FT-02.5), lists the **field-level differences** (US-02.1.3), and suggests a decision. Suggestions are
  derived at read time and never stored, so they never go stale. A row the matcher cannot place, and
  a row with **no NHI**, is **unmatched** and stays in the unmatched queue until someone decides or
  adds the NHI (US-02.1.4). The office can also search for the Booking by hand (AR-21
  `look-for-match`). The hospital's appointment id is never a match key, so a Booking on another day
  is never found as "the same Booking moved" (D62);
- adds an Admin **Matching** screen in the Admin Review pattern, with a product **Import hospital
  bookings** control (US-02.1.1's title) whose picker offers four labelled samples (a St George's
  theatre list, a later St George's update, a Southern Cross list and a manual sheet from Forte
  Health) while how each hospital provides its bookings is still open (OQ-13). Every row shows its
  **procedure text as received** in the table, and the row panel shows each Procedure as **Phase
  20a's stack** (as received, Contract, RVG code), with what the row is missing named beside it;
- applies a decision only through the existing guarded write paths, as the office actor, with the
  Booking's source (`hospitalDownload`) and a Booking-side history row naming the hospital row, so
  "recorded with its source" (FT-02.5, EP-02) is visible on the Booking. A decision applies while the
  List is ACTIVE or SUBMITTED, and is refused once it is AUTHORISED (US-02.5.4);
- **keeps the wording as received**: a created Booking's Procedure starts with the row's wording
  through `createBooking`'s `sourceText`; a matched row with wording the Procedure does not already
  hold **adds it beside** the earlier texts through `addSourceText` (US-02.5.7: never edited, never
  overwritten; the hospital's channel stays apart from the rooms'). The hospital's wording never
  changes the Contract or the RVG code;
- **sets no Contract and no RVG code by itself**: a created Booking carries no Contract (OQ-78: no
  hospital default, nothing derived from the location) and, unless the office picks one, no RVG code
  (OQ-99 answered, D33: there is no procedure to match). The row panel offers the office Phase 20's
  Contract picker (No contract (RVG) first) and, quietly, Phase 19's RVG code type-ahead, both
  optional; a Booking left without a Contract lands on Phase 20's "Needs a Contract" list
  (US-04.3.4). The hospital's insurer and approval number, when the row carries them, are recorded
  on the Booking by the decision as source data (D28, Phase 21), never as who is billed;
- widens what a Modification row can change to patient (name, date of birth), the procedure wording
  (added beside) and the insurer, as well as time (a time change within the same List) and note
  (US-02.1.3: "time, patient or procedure"), and appends a hospital note instead of overwriting the
  Booking's own notes;
- treats **a day move as a cancellation plus a new Booking** (D62): the old day's row is a
  Cancellation, the new day's a New row for the same patient, decided one by one with nothing linking
  them (the system does not recognise a move; detecting a Booking missing from a re-sent List is
  US-02.2.3, Future Work). There is no Reschedule change type, no move of a Booking by a row, and no
  rule turning a clash into a Draft List (US-02.5.2, Future Work);
- holds a **row with no NHI** in the unmatched queue (D11): no patient, Booking or provisional record
  is made until the office types the NHI, which is validated on entry; the row can be rejected;
- re-routes the HL7/FHIR simulator: a parsed message, the canned S13 to S15 included, now lands as a
  row on the matching screen and applies nothing (RV-13), and `manualIntervention` is retired because
  every applicable message now waits for a decision. Retry, dedupe and dead-letter stay as they are,
  under Phase 14's Future-scope badge, until Phase 34 demotes them. No scripted beat fires S13 to S15.
  Phase 20a's wording beat on Diane Foster's Booking (MSG-STG-1012 adding the hospital's fuller
  wording) now goes through the matching screen;
- registers the demo triggers: two harness-bar entries on the Matching screen ("Receive tomorrow's
  theatre list" and "Send update for a matched Booking") and a PWA-only office stand-in on Mobile
  Lists and the Booking screen ("Hospital row arrives and the office matches it") so S1 and the
  wording beat still run on a handset.

This phase builds **no pricing structure**. It reads Contract candidates, the RVG code and the stack only through Phase 19, 20 and 20a's modules in `aa-prototype/src/domain/billing` (the draft
technical design [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) at
`contract-selection` and `billable-party`, its ERD
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) at `booking-procedure`, and the
plain-language guide [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md)), never a
second copy, so a later change to the draft pricing design (a v5 may follow) stays out of this
phase's files.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot, catalogue commit
   `d4db277` (rename-aware; never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff EP-02,FT-02.1,US-02.1.1,US-02.1.2,US-02.1.3,US-02.1.4,US-02.1.5,FT-02.5,US-02.2.3,US-02.5.1,US-02.5.2,US-02.5.3,US-02.5.4,US-02.5.5,US-02.5.6,US-02.5.7,US-03.1.9,US-14.6.2,US-01.6.1,US-01.6.4,US-04.3.3,US-04.3.4,US-04.3.6,US-11.2.2,US-11.3.2,OQ-13,OQ-34,OQ-44,OQ-49,OQ-52,OQ-78,OQ-87,OQ-93,OQ-99,OQ-108,OQ-109
   ```

   At plan time (2026-10-20, `60e2d1e..d4db277`) the changes that touch this phase were: FT-02.5 now has
   three types (a time change within the same List is a modification) and a day move is a cancellation
   plus a new Booking; US-02.5.2 retitled to that (OQ-87 answered, D62); US-02.5.4 accepts inbound
   changes until AUTHORISED; US-02.1.2 and US-02.1.4 say a row with no NHI waits in the unmatched
   queue (OQ-49 answered, D11); EP-02 and FT-02.1 say one theatre list a day, for the next day, review
   and merge only, hospital the priority pathway (OQ-108, D51); US-03.1.9 dropped the chosen procedure
   from the stack (OQ-99 answered, D33: no procedure to match); US-04.3.4 has the office pick holder,
   Contract and line and leave the RVG code; OQ-93 answered in part (the insurer on the Booking,
   D28); US-02.2.3 is new, Future Work. (The 2026-10-08 changes, `3d3a18c..60e2d1e`, are in "Changed
   since the plan was written" above.) If an item changed after `d4db277`, re-read it and adjust the work items
   before planning. If any covered item is now Retired or Future, drop it from this phase and say so
   in the PROGRESS entry. Dropping US-02.1.2 or FT-02.1 drops the screen; the RV-13 re-route (no
   silent apply) still stands while US-02.1.5 or US-02.1.3 says a hospital change goes through the
   office's review. If acceptance criteria have been added to any covered story, map each to a work
   item (at `d4db277` US-02.1.2's "procedure text exactly as sent", US-02.1.4's "No NHI", US-02.1.5's
   "No silent apply", US-02.5.7's three, US-01.6.1's four, US-01.6.4 and US-11.3.2, which is Phase
   40's, have them; the criteria on US-02.5.1 to US-02.5.4 are for the automated path, Future Work, and
   are not built, except US-02.5.4's "open until authorised", which the office's decision follows). A
   new intake item on the same screen (for example bulk apply) comes in only if it is small; otherwise
   note it for Phase 34 or 44. If US-02.5.1 to US-02.5.4 or US-14.6.2 (automated application) have left
   the Future Work lane, or US-04.3.6 (the hospital sets the Contract) has, keep this doc's rule (every
   row waits for an office decision and never sets a Contract or an RVG code by itself), build the
   rest, and put it on the "For the owner's review" list.
2. **OQ-13 (how each hospital provides its bookings).** Still Open at `d4db277`: the cadence is
   settled for now (one theatre list a day, for the next day, no repeated updates), the format and
   fields per hospital are not (US-02.1.1's note). Build what this doc describes: the four samples are
   **labelled fixtures** (a "Sample file" badge in the picker and on each batch, and one line on the
   screen: "Sample files stand in for each hospital's bookings while the integration team confirms how
   each hospital provides them."). A real list is one day's; the samples span a week so every case
   shows, and the line says so. App copy says "import" and "hospital bookings", not "download"
   (US-02.1.1 was retitled because FHIR is a REST interface, not a file). The incoming row carries a
   superset of the plausible fields, and **every field except hospital, date, session and patient
   name is optional**, because OQ-13 records that Contract and patient details sometimes do not come
   through and that the download is not comprehensive; whether a hospital sends an appointment id at
   all is not known, which is why it is never a match key. A field the hospital did not supply is
   shown as "Not supplied" and is **never** a change: it can never blank a Booking field. If OQ-13 has
   since been answered, reshape the fixtures and `IncomingBookingFields` to the answer's field list
   (keep the optional-field rule unless the answer says otherwise), drop the interim line, and record
   the answer in the Decisions log. The sync that delivers a list without a hand import is Phase 34.
3. **FT-02.1 (Verify) and "no automated decisions".** Still Verify at `d4db277`; its 2026-10-07 note
   says the first version has no automated decisions and automated approvals come once the matching
   is trusted, and its 2026-10-20 text says incoming data goes through a review and merge step. If it
   is now Confirmed, drop the Verify note from the PROGRESS entry. On US-02.1.2 Greg challenged the
   manual step and Donald kept an import gate for the first release; on US-02.1.3 an update to an
   already matched Booking still goes through the manual approval. If FT-02.1 has been reshaped so
   matching becomes partly automatic, keep the office decision on every row and log it for the owner's
   review.
4. **US-02.1.3's match key.** At `d4db277` a later update is matched by "the date, the surgeon, the
   location, the slot" (OQ-13's 2026-10-07 update; AR-21 `look-for-match` adds the patient's NHI and
   that the office can also search by hand). Build the matcher as work item 2 says: the List by those
   four, then the patient's NHI on it; the appointment id only the duplicate key. If the catalogue has
   since named a different key, change only `findMatch` and its tests.
5. **OQ-44 (Draft List contents), Answered.** Build the answer: "Create a Draft List" creates the
   Draft List with hospital, surgeon, day and session (all four required; US-01.6.1) and creates the
   row's Booking on it in the same decision. The row is then applied; nothing waits on the Draft List.
   If US-02.1.2 has dropped that decision, drop Create a Draft List from the panel and log it; if
   OQ-44 has been reopened, build it as this doc says and log it.
6. **OQ-99 and D33 (no procedure to match), Answered: build the answer.** The office identifies who pays
   when it creates a Booking from a row (holder, Contract, line, all optional in the panel, No contract
   (RVG) first); the RVG code is optional and the anaesthetist's; a Booking with no Contract waits on
   the office's "Needs a Contract" list (Phase 20). The row needs only something to show: its wording,
   or an RVG code the office picks (20a's `createBooking` refusal). No provisional label anywhere. If
   OQ-99 has been reopened, build it as this doc says and log it.
7. **No default Contract (OQ-78, answered).** Confirm Phase 20 left no `defaultContractForBooking`,
   no `contractSetBy` and no hospital or insurer default Contract: `createBooking` with no Contract
   pick leaves the Procedure without one and the Booking appears on `needsContractBookings`. If any
   default survived, stop and record it; this phase never adds one.
8. **Automated application stays out (RV-13), and a day move is cancel plus new (D62).** At `d4db277`
   US-02.5.1 to US-02.5.4 and US-02.5.6 sit in the Future Work swimlane as the automated path: a
   modification or cancellation from an integration applied with no one deciding it, and the day-move
   rule (US-02.5.2, answered by OQ-87: no clash or Draft List rule, no move). Build none of it. Every
   hospital row, the canned S13 to S15 messages included, waits for the office's decision, no scripted
   beat fires S13 to S15, and nothing here moves a Booking to another day. The office-decided
   equivalents on the matching screen are US-02.1.2, US-02.1.3 and FT-02.5's.
9. **No NHI waits (OQ-49 answered, D11).** Confirm which of Phase 40's work exists. This phase never
   reaches `intake.ts` `createdProvisional`: a row with no NHI creates no patient or Booking until the
   office adds the NHI; Phase 40 removes the provisional path everywhere else and builds the office's
   view of waiting rows.
10. **Baseline.** Confirm Phases 15a, 15b, 17, 18, 19, 19a, 19b, 20, 20a, 28, 30, 31 and 38a are DONE in
     PROGRESS.md (14 and 15 are built), and note whether 21, 23, 25 and 27 are (they are outside the
     dependency chain; see Depends on). Then read what they left, because this doc names planned
     names, which those phases may have changed (use the names their entries record):
    - Phase 15 (built; Phase 15b then removed Copy, so `'copy'` is gone from `BookingSource`):
      `createBooking` and `CreateBookingInput` (with the required `source`),
      `editBooking`/`BookingPatch`, `cancelBooking`, `findBookingByCorrelation`, `bookingsOnListByNhi`,
      `bookingsForList`, `BOOKING_SOURCE_LABELS` (in `shared/format.ts`), and the Booking detail route
      `/admin/day/:dateISO/bookings/:bookingId`.
    - Phase 20a: `Procedure.sourceTexts`, `SourceText`, `SourceTextChannel` and
      `SOURCE_TEXT_CHANNEL_LABELS`, `addSourceText` (verbatim, append-only, an identical text adds
      nothing, `added: false`), `createBooking`'s `sourceText` input and its refusal with neither text
      nor RVG code, `procedureStackView` and `ProcedureStackView` (received text grouped rooms,
      hospital, entered; invoice description; Contract; RVG code), `ProcedureStack` (full and compact
      density, `data-shot="procedure-stack"`), the re-pointed "Fire hospital message" (Booking routes,
      defaulting MSG-STG-1012 on Diane Foster's Booking) and what 20a did to the S12, S13 and S14 apply
      paths (which this phase removes), and the AR-35 wording it seeded (MSG-STG-1001's
      `lap appy ?conv to open`, Foster's `WLE MM`).
    - Phase 20: `createBooking`'s optional Contract pick, `contractCandidatesFor`,
      `contractCandidatesForProcedure`, `contractCandidatesForNewBooking`, `ContractPickerSheet`
      (No contract (RVG) first, holder headings, composite search, the RVG codes route),
      `setProcedureContract(api, actor, procedureId, { contractId, lineId? })` and its refusals
      (`contractNotInEffect`, `contractOutOfScope`), `needsContractBookings` and the Admin Day "Needs a
      Contract" card. Confirm no Procedure `insurerId` or billing route remains.
    - Phase 19: `Procedure.rvgGroupId` (optional), `pickRvgGroup`, the `CodePickerSheet` type-ahead,
      `RvgGroup`. There is no procedure master, procedure pick or `ProcedurePickerSheet`.
    - Phase 15a: the warning routine in `src/domain/warnings` (`WARNING_RULES`) and the
      `store/warnings.ts` selectors (`warningsForBooking`, `warningsForList`), so the Booking a
      decision creates or changes shows its warnings with no extra code here.
    - Phase 23 if DONE: the primary Procedure, the target of a row's wording on a matched Booking (else
      the Booking's first Procedure).
    - Phase 21 if DONE: `Booking.payer` (a created Booking gets `{ kind: 'patient' }` through
      `createBooking`), `Booking.insurerId` and `insuranceApprovalNumber`, and `setBookingInsurance(api,
      actor, bookingId, { insurerId, insuranceApprovalNumber })`, whose comment says Phase 33 sets it
      from rows.
    - Phase 27 if DONE: which store paths re-check a prepayment (a change of Procedures, Contract or
      payer; never a move, D20).
    - Phase 17: the surgeon master (`masters.surgeons`, `Surgeon.hpiId` labelled "HPI CPN",
      `normaliseHpiCpn`), `rankAnaesthetistCandidates`, `AnaesthetistCandidates`,
      `NotPreferredWarning`, `useNotPreferredWarning`, the acknowledgement the office write paths
      record, and the surgeon picker the office forms use.
    - Phase 28: `Slot`, `slotFor`, `listInSlot`, `slotViewsForAnaesthetist`, `assignListToSlot`,
      `placeListOnSlot`, `ListKind`, and the integration park rule it added to `integrationActions.ts`
      (S12 and S13 park `noTargetList` when the Slot has no List).
    - Phases 30 and 31: which conflicts `assignListToSlot` raises (an unavailable Slot is accepted and
      flagged), the Draft List record (a List with no anaesthetist and no Slot; `isDraftList` tells it
      apart), `createDraftList(api, actor, { hospitalId, surgeonId, dateISO, session, kind?, note?,
      source? }, origin)` with the reserved `'hospitalRow'` origin (no `source`) and its
      `pairingIncomplete`, `datePassed` and `outsideCanvas` refusals, how a Booking is put on a Draft
      List (`createBooking` onto it), `assignDraftList`, `redateDraftList`, `removeDraftList`
      (US-01.6.4), and `pairingIssues`.
    - Phase 31's interim `pairingIncomplete` park in `integrationActions.ts` (S12, S13), if 31 left
      one, which goes with the Phase 28 park rule in work item 6.
    - Phase 14 (built): `DemoTrigger` (`choices`, `when`, `badge`), `DemoContextValues`, the re-homed
      `fire-hospital-message` and `replay-hospital-message` entries (`shared/demoTriggers/registry.ts`
      :450 and :475 at `60e2d1e`, before 20a re-pointed the first) and their routes and surfaces,
      `src/store/demoActors.ts` (`OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`), `src/store/officeStandIn.ts`,
      `src/pwa/PwaDemoActions.tsx` and `DemoBadge`'s `tone` prop.
    - Phase 38a and 25 if DONE: `editRefusal` after the edit window (office and anaesthetist until
      AUTHORISED, nobody on AUTHORISED). At `60e2d1e` `editRefusal` (`store/lifecycle.ts` :48) already
      refuses `listAuthorised` and has an `integrationImmutable` branch on non-ACTIVE Lists, which work
      item 6 removes.
    - Run `grep -rn "processMessage\|applyEffect\|manualIntervention\|resultBookingId\|noTargetList\|pairingIncomplete\|addSourceText\|integrationImmutable" aa-prototype/src aa-prototype/visual requirements-board/requirements/capture/recipes`
      to see every consumer of the auto-apply path after 15a to 32a, including the wording appends
      20a added to it.
    - Read the current `PERSIST_VERSION` in `src/store/appStore.ts` (16 at `60e2d1e`, after Phase 15a
      session 1; later phases will have bumped it) and bump it by one from whatever it is now.

## Reference

**Design files (convention 17):**
- `docs/design/Admin Review.dc.html` is the **layout reference** for the Matching screen. Keep its
  anatomy: a title and one-line context under it; a stats strip of micro-cap labels over
  tabular-mono figures (here OPEN, NEW, MODIFICATIONS, CANCELLATIONS, UNMATCHED); one
  table with a flags column of warning-tint pills; a footer action bar with a secondary button and a
  teal primary; and its choreography when an item is done (`bannerIn` banner with who and when, the
  `tickDraw` tick, the row dims, the side-nav badge decrements, "Next in queue" becomes "Next row").
- `docs/design/Admin Day.dc.html` for the dark side nav, the amber attention badge and the right-hand
  List drawer, whose width, elevation and slide-in the row detail panel reuses.
- `docs/design/Design Language.dc.html` for the tokens: warning `#A16207` with tint `#F9F0DC` and
  on-tint `#7C4D08` (changed-field highlight, unmatched pill, "Needs correction"); error tint
  `#FAE9E7` / on-tint `#9C332F` only for the Cancellation change-type pill and an invalid NHI; success
  for the Applied state; neutral sunken with slate for New, Modification, No change and Rejected; pills at radius 999; Spline Sans Mono with tabular-nums for NHIs, times, dates, ids and
  the procedure wording as received (quoted, as Phase 20a's stack shows it).
- Teal `#0D6E63` is the only action colour ("Import hospital bookings", the Apply button, "Choose RVG code", "Choose Contract"). Crimson stays identity only: the new side-nav item's active state
  follows the existing items, and its badge is amber (`badgeTone: 'warn'`) like Integrations, never
  crimson.

**Catalogue:** the covered items above; AR-21 (`requirements-board/requirements/artifacts/AR-21.md`,
the Booking/List update diagram) at regions `matching-screen`, `rows-wait`, `look-for-match` (the
proposed match on surgeon, hospital, day and session, and the patient's NHI; search by hand),
`match-found`, `review-differences` (changed fields highlighted; approve or reject), `create-booking`
(existing List, new List, Draft List or reject), `new-booking`, `apply-change`, `record-change`,
`matching-notes`, `another-change` (later changes loop back through the matching screen),
`list-submitted` (the diagram's "no changes once the anaesthetist submits the List", superseded by US-02.5.4: inbound changes are accepted until AUTHORISED) and `open-after-submit` (decided by US-02.5.4, except what happens after AUTHORISED); AR-35's note
(`requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md`, its
"Illustrative source wording" heading: AI-made wording, not from AA; AR-35 declares no regions, so
cite the heading by name and never edit the artifact), from which the sample rows' wording comes;
`domain-model.md` section 1 (the "Hospital HL7 integrations exist but are unreliable" row: manual
matching review, St George's and Southern Cross only, HL7/FHIR Future; its sync-cadence wording
predates US-02.1.5's trim, which wins), "Booking" (sources; each Procedure keeps the source wording;
editable by every source, the office included, until AUTHORISED, then immutable; append-only history), "Slot, List and Draft List" (a Draft List holds Bookings before assignment; the List states
DRAFT, ACTIVE, SUBMITTED, AUTHORISED), the Contract section (the Contract decides who is billed;
No contract (RVG) the one default) and the glossary's "Matching screen" and "Source wording". EP-02's
technical discussion: every change is validated against the internal data model rather than the
incoming message. US-14.6.2 (Future Work): automatic matching and routine updates, the later state
this screen leads to. AI-assisted matching was floated at the 2026-10-07 client meeting with no
decision; it is not built.

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: the Themes (intake becomes a matching screen),
  "Structural first" for DM-02 then DM-03 (Draft Lists, which this phase creates), "Remove or rework
  (reverse check)" for automatic apply (US-02.1.5, DM-34), the RV-13, RV-14 and RV-15 rows, "Demo
  impact" (S1 Beat 1 waits for a match decision; S4 Beat 4 needs rethinking once auto-apply goes),
  "Demo-trigger buttons", the OQ-13 line under "Uncertainty", and the EP-02 table with its structural
  note (US-02.1.2 and US-02.1.3 Contradicts; US-02.5.7 Contradicts, built by 20a);
  20a);
- `docs/prototype-build/catch-up/epics/EP-02.md` (#ep-02, #ft-02.1, #us-02.1.1 to #us-02.1.5,
  #ft-02.5, #us-02.5.7);
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (#dm-34; also DM-02, DM-03, DM-12,
  DM-39 and DM-51, which this phase builds on);
- `docs/prototype-build/catch-up/analysis/reverse-check.md` (RV-13; RV-14 and RV-15 for what stays badged);
- `analysis/prototype-map-admin.md` section 8 (Integration monitor), `prototype-map-store-seed.md`,
  `prototype-map-domain.md`, `prototype-map-shared.md` and `prototype-map-shell-demo-pwa.md`
  (sections 5.3 and 7).

**Code entry points (as at `60e2d1e`, code unchanged since `b342a7d`, Phase 15a session 1; Phases
15a to 32a will have renamed or moved some, 20a among them in `integrationActions.ts`):**
- `aa-prototype/src/store/integrationActions.ts`: `applyEffect` (:137-228, removed here; :161 is
  the "Interim until Phase 33" comment), `attemptMessage` (:229-308; the park codes in it go),
  `processMessage` (:309), `retryMessage`, `reprocessMessage` (:339),
  `createMessageRow`/`updateMessageRow`, `integrationActor`, `timeToSession`, `ingestPdfRow` (:434,
  unchanged, Future scope), `wireIntegrationRetry`.
- `aa-prototype/src/domain/integrations/`: `messages.ts` (`CANNED_MESSAGES`, `APPT`, `STG_LIST`,
  `STG_MODIFY_LIST`, `SX_LIST`, `CPH_LIST`, `routing`), `feeds.ts` (`FEED`, `FEED_META`),
  `hl7.ts`/`fhir.ts` (`ParsedMessage`, `extractViaMapping`, `extractFromFhir`), `pdfSamples.ts` (the
  fixture and facsimile pattern the import samples follow), `index.ts`.
- `aa-prototype/src/domain/types.ts`: `BookingSource` (:371), `Procedure` (:453, `description` at
  :456, which 20a replaces with `sourceTexts`), `IntegrationMessageStatus` (:844) and
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
  `store/persistMigrate.test.ts`, `domain/seed/seed.test.ts`, `pwa/pwaPurity.test.ts`, 20a's
  `store/sourceText.test.ts` (its S12, S13 and MSG-STG-1012 cases assume a message applies),
  `visual/phase11.spec.ts`, `visual/phase12.spec.ts`, `visual/screens.spec.ts`,
  `visual/pwa-device.spec.ts`.
- Outside the app: `requirements-board/requirements/capture/recipes/US-02.1.1.json`, `US-02.1.2.json`,
  `US-02.1.3.json`, `US-02.1.4.json`, `US-02.1.5.json`, `US-02.5.1.json`, `US-02.5.2.json`,
  `US-02.5.3.json` and `US-02.5.4.json` (captured from the simulator's auto-apply or the PDF
  analogue), and 20a's `US-02.5.7.json` and `US-03.1.9.json`.

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
     from. Each maps to one of 20a's `SourceTextChannel` values in one pure function
     (`sourceTextChannelFor(channel)`): `download` to `hospitalDownload`, `feedMessage` to
     `hospitalFeed`, and `manualSheet` to a new `hospitalSheet` value ("Hospital sheet") added to
     20a's union and to `SOURCE_TEXT_CHANNEL_LABELS` (a sheet keyed by the office is not a download).
     20a's `procedureStackView` groups `hospitalSheet` with the hospital's texts, not the rooms'.
   - `IncomingBookingFields` (what the hospital sent; every field optional except the four marked):

     ```ts
     interface IncomingBookingFields {
       hospitalId: HospitalId                       // required
       dateISO: IsoDate                             // required
       session: Session                             // required
       externalRef?: string                         // the hospital's appointment id, when it sends one (OQ-13): the duplicate key and the Booking's correlation ref, never a match key
       surgeon?: { name: string; hpiId?: string }   // hpiId: the HPI CPN (OQ-52), matched first
       scheduledTime?: WallTime
       patient: { name: string; nhi?: string; dobISO?: IsoDate; ethnicityCode?: string } // name required; no nhi means the row waits (D11)
       procedure?: { text?: string; code?: string } // text: the wording exactly as sent, never trimmed (US-02.1.2, US-02.5.7); code: the hospital's own code as sent, shown, never mapped
       insurer?: { text: string; insurerId?: InsurerId; approvalNumber?: string } // as sent; recorded on the Booking by the decision as source data (D28), never a Contract or a billable party
       note?: string
       hospitalStatus: 'booked' | 'cancelled'       // default 'booked'
       cancelReason?: string
     }
     ```

     A row never names an RVG code, a Contract, a payer or a billable party: the hospital does not
     set the Contract (US-04.3.6 is Proposed), there is no default (OQ-78), and the Contract decides
     who is billed through its holder or the payer on the Booking (D17). When the `insurer` text names
     a seeded insurer, the fixture sets `insurerId` (nib is the seeded insurer `I-NIB`).

   - `ImportDecision`, a discriminated union recorded once a row is decided:

     ```ts
     type OfficePicks = { rvgGroupId?: RvgGroupId; contract?: { contractId: ContractId; lineId?: ContractLineId } }
     type ImportDecision =
       | { kind: 'match'; bookingId: BookingId; changeType: ChangeType; fieldsApplied: IncomingFieldKey[]; picks?: OfficePicks }
       | { kind: 'createBooking'; listId: ListId; bookingId: BookingId; picks?: OfficePicks }
       | { kind: 'createList'; slotId: SlotId; listId: ListId; bookingId: BookingId; picks?: OfficePicks }
       | { kind: 'createDraft'; listId: ListId; bookingId: BookingId; picks?: OfficePicks }   // a Draft List is a List (Phase 31)
       | { kind: 'reject'; reason: string }
     ```

     Use the type names 19 and 20 actually left for the RVG group id, the Contract line id and the
     pick. `bookingId` on `createList` and `createDraft` is the Booking created onto the new List or
     Draft List: a Draft List holds Bookings (OQ-44), so neither decision leaves the row waiting.
     `picks` holds only what the office chose in the panel; it is never derived from the row. There is
     no move decision: a Booking never changes List or day through a row (D62).

   - `ChangeType = 'new' | 'modification' | 'cancellation' | 'noChange'`.
   - `IncomingFieldKey`: `'time' | 'patientName' | 'dob' | 'nhi' | 'procedureText' | 'insurer' |
     'note'`.
   - `ImportRow`: `id`, `batchId`, `channel`, `receivedAtISO`, `incoming: IncomingBookingFields`,
     `corrections?: Partial<...>` (office corrections to the identifying fields: NHI, name, date of
     birth, time and surgeon; kept separate so the original is never lost, and **never the procedure
     wording**, which is kept exactly as received), `status: 'open' | 'applied' | 'rejected'`,
     `decision?: ImportDecision`, `decidedBy?`, `decidedAtISO?`, and for a feed message
     `messageId?`. "Unmatched" and "waiting for an NHI" are **not** statuses: they are derived (work
     item 2), so a row cannot be unmatched and forgotten.
   - `ImportBatch`: `id`, `channel`, `hospitalId`, `label` ("St George's theatre list, 28 Jul to
     4 Aug"), `sampleId?` (the fixture it came from), `importedBy`, `importedAtISO`, `rowIds`,
     `skippedCount` (rows already imported, see work item 4).
   - `IntegrationMessage`: add `resultImportRowId?: ImportRowId`; remove `resultBookingId` and
     remove `'manualIntervention'` from `IntegrationMessageStatus`.
     A parsed message no longer applies anything, so nothing parks; the persisted state reseeds on
     the `PERSIST_VERSION` bump, so no migration of old rows is needed.
2. **Pure matcher** (`src/domain/intake/matching.ts`, exported from `src/domain/intake/index.ts`; no
   React, no store import, PWA-safe; Vitest in `matching.test.ts`) (US-02.1.2, US-02.1.3, US-02.1.4,
   FT-02.5; AR-21 `look-for-match`, `match-found`, `review-differences`):
   - Input is a plain `MatchingView` built by a selector (work item 5): Bookings with their patient
     NHI, name and DOB, their Procedures (each with its source texts, RVG code and Contract id, name
     and holder; the primary marked if 23 is DONE), notes, scheduled time, correlation ref,
     cancellation and, if 21 is DONE, the insurer and approval number; Lists with hospital, surgeon,
     date, session, anaesthetist, state (DRAFT for a Draft List, ACTIVE, SUBMITTED, AUTHORISED) and
     Slot; open Slots by anaesthetist, date and session with their availability; surgeons with
     `hpiId`; and the other open rows (for the duplicate flag).
   - `effectiveIncoming(row)`: `incoming` with `corrections` laid over it. Every function below reads
     this, never `incoming` directly. The procedure wording is never correctable, so it always reads
     as received.
   - `resolveSurgeon(view, fields)`: by `hpiId` (the HPI CPN, OQ-52) when the row carries one, else
     by normalised name; unresolved gives the "Surgeon not recognised" flag.
   - `findMatch(view, fields)` (US-02.1.3's key, one function, so a change of key is one edit):
     1. **The List, then the patient.** The List at the row's hospital, date and session with the
        resolved surgeon (an ACTIVE, SUBMITTED or AUTHORISED List, or an unassigned Draft List), then
        the non-cancelled Booking on it for the same patient by valid normalised NHI. Basis
        `'listAndPatient'` ("Matched by date, surgeon, hospital and session, then NHI").
     2. **Surgeon not recognised.** Step 1 cannot use the full key: look for the patient's NHI on that
        hospital's Lists on that date and session, basis `'patientOnDay'`, with the flag.
     3. Else none.
     Never by name alone, never by the appointment id, never on another day: a Booking on another day
     is another Booking (D62). A row with no valid NHI finds nothing. A Booking created or changed by
     an earlier decision is found the same way, so a later row for it (an update to an already
     matched Booking) goes through the same diff and approval (US-02.1.3); it is never applied
     because it matched before.
   - `searchBookingsForRow(view, fields, query)`: the office's search by hand (AR-21: "the admin can
     also search by hand"), by patient name or NHI across that hospital's non-cancelled Bookings on
     the row's date, at most 20, for the "Match to another Booking" control (not offered to a row
     with no NHI).
   - `diffFields(booking, procedure, fields)` returns `FieldDiff[]` (`{ key, label, current,
     incoming, effect }`) for time (within the same List), patient name, date of birth, NHI,
     procedure wording, insurer and note. The date, session and List are the key, so they never
     differ. A field the hospital did not supply is skipped (never a change). NHI is compared but
     flagged, never applied (see work item 4). **Procedure wording:** compared character for
     character against every source text the target Procedure already holds, the rooms' included
     (the primary if 23 is DONE, else the first); identical to one of them, no diff; otherwise a
     diff whose `effect` is `'addBeside'` ("Add the hospital's wording beside the current text"),
     never a replacement. The hospital's `code` is shown in the panel and is never a diff.
     **Insurer:** a diff only when Phase 21 built the insurer on the Booking (against
     `booking.insurerId` and `insuranceApprovalNumber`); otherwise it is returned as `insurerNote`
     (`{ text, contractHolders, differs }`, `differs` true when the row names an insurer that holds
     none of the Booking's Contracts) and shown beside the stack, never a field to apply. The Contract
     and the RVG code are never diffs: the row never names them.
   - `classifyChange(match, fields, diffs)`: no match gives `'new'`; `hospitalStatus === 'cancelled'`
     gives `'cancellation'`; any diff (a wording-only one included) gives `'modification'`; none gives
     `'noChange'`. Plain-language labels in one map, `CHANGE_TYPE_LABELS`: "New", "Modification",
     "Cancellation", "No change".
   - `suggestDecision(view, row)` returns `{ changeType, match?, diffs, suggestion, unmatchedReason?,
     waitingForNhi?, flags }`. **A suggestion never includes a Contract or RVG code pick** (no
     automated decisions, FT-02.1; no default Contract, OQ-78):
     - **No NHI** (the effective NHI is blank): `waitingForNhi`, no suggestion, `unmatchedReason`
       "No NHI. Add the NHI to continue." The only decisions are adding the NHI (a correction) and
       Reject; a row stays here, creating nothing, until then (D11, US-02.1.4's "No NHI" criterion).
     - `new`: the List in the Slot at the row's hospital, date, session and surgeon gives
       `createBooking` on it; failing that, an unassigned Draft List with the same four fields gives
       `createBooking` on the Draft List (it holds Bookings, OQ-44). With neither, the row is
       **unmatched**, `unmatchedReason` "No List at St George's for Mr Hale on Thu 6 Aug AM", and
       the screen offers Create a List in a session (anaesthetists whose Slot is open that session,
       in Phase 17's `rankAnaesthetistCandidates` order) or Create Draft List.
     - `modification`, `cancellation`, `noChange`: `match` on the found Booking with every diff
       ticked. A modification or cancellation that finds no Booking is **unmatched**: "No Booking for
       this patient on Mr Hale's List at St George's on Thu 30 Jul AM". A cancellation on one day and
       a New row on another for the same patient are two rows, each decided alone.
     - A row whose surgeon does not resolve can still get `createBooking` on an existing List or
       Draft List (it already has its surgeon), but `createList` and `createDraft` need a surgeon
       chosen by the office in the decision panel: a List needs exactly one surgeon (Phase 31's
       `pairingIssues`) and a Draft List cannot be saved without one (US-01.6.1, OQ-44).
   - `rowFlags` (warning pills; **blocks** is stated): "NHI invalid" (from `validateNhi`; **blocks**
     until corrected), "No NHI" (the waiting state above; **blocks** every decision but Reject until
     the NHI is added), "Surgeon not recognised", "List authorised" (**blocks** Apply: locked, US-02.5.4;
     reject with a reason or resolve off-line, what happens to a change after AUTHORISED is not yet
     decided), "Booking cancelled" (a modification to a cancelled Booking is not applied; the
     suggestion becomes reject), "Earlier row for this Booking still open" (links the other row; the
     office rejects one), "No procedure wording sent" (mild: a created Booking then needs an RVG code
     the office picks, work item 4) and "Hospital names a different insurer" (from
     `insurerNote.differs`, or the insurer diff; the office checks the Contract). A SUBMITTED List is
     an ordinary target (the office's window runs to AUTHORISED), so it has no flag.
   - `matchingQueue(view, rows)`: each open row's queue, `'ready'` (a suggestion exists) or
     `'unmatched'` (no suggestion, a row waiting for an NHI included), plus counts by change type for
     the stats strip. There is no waiting state for a Draft List: one created from a row already
     holds its Booking.
   - Tests: each change type; the List-then-patient key finds the Booking by NHI; a row with no NHI
     finds nothing, is `waitingForNhi` and offers no create; a valid NHI added by a correction makes
     it a ready New row; the same patient on another hospital's List does not match; the same patient
     on another day is a New row, never a move, and a cancellation on the old day is its own row;
     surgeon by HPI CPN beats a name that differs; an unrecognised surgeon falls back to the patient
     on that day with the flag; a time change on the same List is a Modification; a missing incoming
     field is never a diff; wording identical to a held text (the rooms' included) is no diff,
     different wording is an `addBeside` diff and never a replacement; leading spaces, "?conv" and
     "+/-" in the wording survive into the diff unchanged; a code is never a diff; an insurer is a diff
     only with 21's field; a new row and a Draft List with the same four fields; a row for a session
     with no List or Draft List is unmatched with the reason and no suggestion; a modification that
     finds no Booking is unmatched; the AUTHORISED, cancelled, invalid-NHI, no-NHI, no-wording and
     duplicate-row flags, and no flag for a SUBMITTED List; a later row for a Booking an earlier
     decision created matches it and is a Modification with its diffs, not applied; no suggestion ever
     carries a Contract or RVG code pick; corrections override incoming and never touch the wording;
     determinism (same view, same output).
3. **Sample files** (`src/domain/intake/hospitalDownloads.ts`, pure fixtures in the `pdfSamples.ts`
   style; `hospitalDownloads.test.ts` for fixture integrity) (US-02.1.1, US-02.1.2; OQ-13 interim):
   - `HOSPITAL_DOWNLOAD_SAMPLES`, four entries, each `{ id, channel, hospitalId, label, description,
     rows: IncomingBookingFields[] }`. A real list is one day's, sent the evening before; each sample
     spans a few days so every case shows, and its description says so. Every patient is synthetic.
     **The procedure wording comes from AR-35's "Illustrative source wording" table** (AI-made, not
     from AA; a header comment says so and cites the note and heading by name), as received, never
     trimmed, and agrees with what Phase 20a seeded on the same Bookings. Every row that is meant to
     become a Booking carries an NHI, except the one that shows the waiting rule. Author the targets
     against the seeded Bookings Phase 11 planted (the `APPT` correlation refs on Aug 3 and 4) and the
     three booked cases on Souter's Tue 28 Jul AM List, and pin each in the seed test:
     - `SAMPLE_STG` **St George's theatre list, Tue 28 Jul to Tue 4 Aug** (channel `download`), five
       rows: (R1) **Sarah Mitchell**, NHI `CQY9304` and DOB 1988-04-12 (the seeded patient, so
       `upsertPatient` reuses her), `externalRef` `APPT.s12`, Tue 28 AM 08:30, Mr Hale, wording
       `lap appy ?conv to open` (AR-35 row 14, the same text 20a gave MSG-STG-1001, so both S1 routes
       read the same): New, suggested Create Booking on Dr Souter's Tue 28 Jul AM List (the S1 row);
       (R2) the 07:45 Booking already on that List (its patient comes from the seed's
       `takePatient()`, so read the NHI from a fresh seed once and pin it in the fixture test), no
       appointment id and no wording (the field shows "Not supplied"), same time: No change, matched
       by the List and NHI; (R3) **Diane Foster's** `APPT.s14` Booking (Tue 4 Aug AM, 20a's `WLE MM`
       from the rooms) with MSG-STG-1012's new time, a booking-office note and the hospital's fuller
       wording `WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC`
       (AR-35 row 27, as 20a put in MSG-STG-1012): Modification (time, wording added beside, note);
       (R4 and R5) **a day move, as the hospital sends it**: (R4) the `APPT.s13Move` Booking on its
       current day with `hospitalStatus: 'cancelled'`: Cancellation, found by its NHI; (R5) the same
       patient (same NHI) as a booked row on the day of an existing St George's Mr Hale List, with the
       Booking's wording: New, suggested Create Booking on that List. Nothing links R4 and R5 (D62).
     - `SAMPLE_STG_UPDATE` **St George's theatre list, a day later** (channel `download`), one row:
       Sarah Mitchell on the same List again, now at 09:00 with a booking-office note and the
       hospital's fuller wording `Laparoscopic appendicectomy, may convert to open` (AR-35 row 14's
       meaning, written as a hospital would spell it; say so in the fixture comment). Once
       `SAMPLE_STG` R1 has been applied it is a **Modification** of the Booking that decision created,
       matched by date, surgeon, hospital and session, then NHI (time, note, and the wording added
       beside `lap appy ?conv to open`, waiting for approval: US-02.1.3's "The admin then approves
       the update"); while R1 is still open it carries the "Earlier row for this Booking still open"
       flag.
     - `SAMPLE_SX` **Southern Cross theatre list, Tue 28 Jul to Thu 6 Aug** (channel `download`), five
       rows: (R1) **Priya Nair** (existing patient, NHI `MYY54SL`), Tue 28 PM 14:30, Ms Patel, wording
       `ACL recon R` (AR-35 row 7, a hospital download): New on Dr Souter's Tue 28 Jul PM List;
       (R2) a seeded ACTIVE Southern Cross Booking after 21 Jul (record which in the PROGRESS entry)
       whose Procedure is on a Contract not held by nib, with a corrected patient name, a
       date-of-birth fix, an `insurer` naming nib (`I-NIB`, with an approval number) and a
       booking-office note: Modification (patient, insurer and note, with the "Hospital names a
       different insurer" flag and, if 21 is DONE, the insurer diff). Pick an nib-held Contract that
       Phase 20's `contractCandidatesForProcedure` offers for that Procedure (if none is, use another
       holder Phase 18 seeded and record which), and pin it in the fixture test. (R3) a late time
       correction for the Booking on a seeded **AUTHORISED** Southern Cross List (at `60e2d1e` the
       historical `oa08` List in `seed/history.ts`: Ms Patel, Wed 18 Mar, knee arthroscopy; later
       phases may have reshaped the history seed, so record which), matched by the List and NHI:
       Modification flagged "List authorised", Apply disabled (the locked-target check, US-02.5.4's
       "locked once authorised"). (R4) **a row with no NHI**: a synthetic patient on Dr Souter's Tue 28
       Jul PM List, wording `T&A` (AR-35 row 20), no NHI: waits in the unmatched queue; once a valid NHI
       is typed it is a New row suggested Create Booking (the NHI is pinned in the fixture test as the
       value the manual test types). (R5) a New row for **Thu 6 Aug PM**, Ms Patel, a synthetic
       patient with a valid NHI, wording `lap chole` (AR-35 row 12, a hospital download): the session
       has no List or Draft List, so the row is unmatched, resolved by Create a List in a session or
       Create Draft List.
     - `SAMPLE_FORTE_SHEET` **Forte Health daily sheet, keyed by the office** (channel `manualSheet`),
       three rows: (R1) a New row onto an existing Forte List, wording `phaco + IOL R` (AR-35 row
       16); (R2) a row with a mistyped NHI check digit (flagged "NHI invalid", corrected inline, the
       manual-keying story), wording `carpal tunnel decomp L` (row 9); (R3) a row for a session with
       no Forte List, with a surgeon who resolves, wording `TURBT` (row 24): unmatched, resolved by
       Create Draft List, which holds the row's new Booking.
   - `hospitalSourceKey(hospitalId)`: the seeded feed id (`FEED.stg`, `FEED.sx`) where one exists,
     else `MANUAL-<hospitalId>`, so an import row and a feed message about the same appointment
     carry the same `correlationRef` shape. Keep the field name `sourceFeedId`; say in a comment that
     it is now the hospital's source key.
   - Fixture tests: row keys unique per sample; every row validates except Forte R2 and `SAMPLE_SX` R4
     (no NHI); every wording appears in AR-35's table or is R14's meaning (the test holds the expected
     strings); Foster's R3 wording equals the MSG-STG-1012 text 20a seeded and Sarah's R1 equals
     MSG-STG-1001's; `SAMPLE_STG_UPDATE` R1 shares `SAMPLE_STG` R1's List and patient and differs only
     in time, note and wording; the seeded targets the rows name exist on a fresh seed (R2 to R4 of St
     George's, R5's List, R2 of Southern Cross and its Contract pick, R3 of Southern Cross on an
     AUTHORISED List); `SAMPLE_SX` R5's and Forte R3's sessions have no List and no Draft List, and
     their surgeons resolve; and every row classifies as this item says against a fresh seed through
     `suggestDecision` (so `SAMPLE_STG` R1 and R5 and `SAMPLE_SX` R1 read New: Sarah Mitchell and Priya
     Nair have no other non-cancelled Booking that day at that hospital; at `60e2d1e` Sarah's other
     Bookings are Christchurch Public on Tue 14 Jul and Forte on Mon 27 Jul, and Priya's Forte on Fri
     24 Jul. If an earlier phase seeded one, pick another seeded patient and record it).
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
     hospital, date, session, surgeon and patient (normalised NHI, else name and date of birth), or
     whose `(hospitalId, externalRef)` when one is sent, matches an existing row of any status (open,
     applied or rejected) **with identical `incoming` fields** (compare what the hospital sent, the
     wording character for character, not the office's corrections, so a corrected row is not
     restaged on the next import, and a rejected row does not return on every sync) is skipped and
     counted in `skippedCount`; a changed row for the same Booking is staged and carries the
     "Earlier row" flag if the first is still open. Nothing is ever merged or decided automatically.
   - **`importHospitalDownload(api, actor, sampleId)`** (US-02.1.1; the action keeps this name,
     which Phases 34 and 40 use, while its button reads "Import hospital bookings"): refuses
     `officeOnly` and `unknownSample`; stages the sample's rows; returns `{ batchId, added, skipped }`.
     Re-importing the same sample adds nothing ("All 5 rows were already imported. Nothing new.").
   - **`correctImportRow(api, actor, rowId, patch)`**: corrections to the identifying fields (NHI,
     name, date of birth, time, surgeon), open rows only, audited `importRow.correct`; a patch
     carrying the procedure wording is refused (`wordingKeptAsReceived`, "The hospital's wording is
     kept as received."). The NHI is validated on entry (EP-02: validated against the internal model);
     typing a valid NHI into a row with none is how a waiting row is released.
   - **`decideImportRow(api, actor, rowId, decision)`** (US-02.1.2, US-02.1.3, FT-02.5; AR-21
     `create-booking`, `apply-change`, `record-change`): the one place a row reaches the schedule.
     - Common refusals: `officeOnly`, `notFound`, `alreadyDecided`, `nhiRequired` (a row with no NHI
       and any decision but reject: "Add the NHI first"; nothing is created, no patient and no
       Booking), `invalidNhi` ("Correct the NHI before applying"), `listLocked` (AUTHORISED target:
       `editRefusal`'s rule, so a SUBMITTED List is accepted, US-02.5.4), `hospitalMismatch` (a target
       List or Draft List at another hospital), `surgeonRequired` (`createList` or `createDraft`
       with no resolved or picked surgeon), `wordingOrCodeRequired` (a create for a row with no wording
       and no RVG code pick: 20a's `createBooking` would refuse a Procedure with neither; "This row
       has no procedure wording. Choose an RVG code first."), the refusals of Phase 20's Contract
       check for a picked Contract (`contractNotInEffect`, `contractOutOfScope`) and of 19's RVG
       pick, and `staleSuggestion` when the decision's target no longer fits what `suggestDecision`
       would allow now.
     - **Pre-check, then apply in refusable-first order, then record.** Validate every guard the
       write paths will apply before the first write (the Phase 11 review-fix rule: a refused step
       must strand nothing). Then call the existing guarded actions as the office actor, and write
       the row's `decision`, `status`, `decidedBy` and `decidedAtISO` last, in one commit carrying
       two metas: `importRow.decide` on the row and `booking.fromHospitalRow` on the Booking
       (`after: { importRowId, hospital, channel, changeType, fields }`), so the Booking's History
       shows "Hospital row applied: Modification (time, wording, note)". A refusal returns the reason
       and leaves the row open; a test proves the schedule is unchanged.
     - **The wording (US-02.5.7).** Every decision that creates or matches a Booking writes the row's
       wording, when it sent one, onto the target Procedure (the primary if 23 is DONE, else the
       first) exactly as received, with channel `sourceTextChannelFor(row.channel)`, `from` the
       hospital's name ("St George's", "Forte Health daily sheet") and the demo clock's time: through
       `createBooking`'s `sourceText` for a created Booking, through `addSourceText` for a matched
       one. An identical text adds nothing (`added: false`); a different one is added beside the
       others; no path edits or removes a text, and the hospital's wording never changes the Contract
       or the RVG code.
     - **The office's picks (US-04.3.4, D33).** When `picks.rvgGroupId` is set it goes through 19's
       `pickRvgGroup` (or `createBooking`'s RVG code input) and when `picks.contract` is set through
       Phase 20's `setProcedureContract` (or `createBooking`'s Contract pick), both on the target
       Procedure, as the office actor, with 20's refresh (starting values, locked modifiers) in their
       commits. With no picks a created Booking has **no Contract and no RVG code**: it appears on
       `needsContractBookings` ("No Contract") for the office to settle, and nothing is derived from
       the hospital (OQ-78, US-04.3.3). A matched Booking keeps its Contract and RVG code unless the
       office picks.
     - `match` + `modification`: apply only the ticked `fieldsApplied`: time through `editBooking`;
       patient name and DOB through `editPatient`; the wording through `addSourceText` (above); the
       insurer and its approval number, when Phase 21 is DONE and the diff is ticked, through
       `setBookingInsurance` (D28: source data and a hint, never who is billed), and otherwise
       nothing is written for it. The picks as above. A hospital note is **appended** to the
       Booking's notes as one line ("St George's, 21 Jul: ...") instead of overwriting them (the S14
       overwrite in gaps.json). An NHI difference is never applied: the office rejects the row or
       fixes the patient record (Phase 40 adds attach and merge).
     - `match` + `cancellation`: `cancelBooking` with reason "Cancelled by St George's (hospital row
       IR0005)" or the row's `cancelReason`. Soft-cancel as today: the Booking stays visible on its
       List, marked cancelled. Whatever Phases 27 and 41 hang on it (a prepayment refund) follows.
     - `match` + `noChange`: records the decision ("Matched, nothing to change") and writes nothing
       else.
     - `createBooking`: `createBooking(api, actor, listId, { patient, sourceText, RVG code and
       Contract picks if any, scheduledTime, correlationRef: { sourceFeedId:
       hospitalSourceKey(hospitalId), externalAppointmentId } (when the row sent one), source:
       'hospitalDownload' })` on an ACTIVE or SUBMITTED List or an unassigned Draft List. The patient
       goes through `upsertPatient`, so an existing NHI is reused, not duplicated; a row with no NHI
       never gets here (`nhiRequired`). If Phase 21 is DONE the Booking's payer is the patient, as on
       every create path (US-11.2.2), and the row's insurer and approval number, when it sent them,
       are recorded through `setBookingInsurance` (ticked by default in the panel; the office may
       untick); a row never sets another payer. Stamp `source: 'hospitalDownload'` for every channel,
       including `manualSheet` and `feedMessage`: all three are the hospital pathway in
       `BookingSource`; the channel lives on the row, on the source text and in the History.
     - **What follows with no code here.** Because every decision goes through the guarded actions,
       15a's warning routine re-runs (including 21's insurer warning, if DONE), a Booking without a
       Contract shows on "Needs a Contract", who is billed follows the Contract's holder or the payer
       on the Booking (D17), and, if Phase 27 is DONE, its prepayment re-check runs on a change of
       Procedures, Contract or payer. A row never sets a billable party, a payer, an invoice email or
       a prepayment itself.
     - `createList`: a New row only. `assignListToSlot(api, actor, slotId, { hospitalId, surgeonId,
       kind: 'private' unless the row says otherwise })` first, with the row's resolved surgeon or
       the one the office picked in the panel (refused `surgeonRequired` otherwise). Phase 17's
       not-preferred warning and its acknowledgement (a soft warning, never a block; D44), Phase 30's
       conflict flag on an unavailable Slot and Phase 31's pairing check all apply as they do in the
       Day view. Then `createBooking` on the new List. A refusal of the second step after the List is
       created is prevented by the pre-check; if it still happens, the List stays (an empty List is a
       valid state), the row stays open and the outcome says so.
     - `createDraft` (US-01.6.1, OQ-44 answered): a New row only. `createDraftList(api, actor, {
       hospitalId, surgeonId, dateISO, session, note }, 'hospitalRow')` with all four of hospital,
       surgeon, day and session (the row's resolved surgeon or the office's pick; refused
       `surgeonRequired` otherwise), Phase 31's reserved `'hospitalRow'` origin (no request `source`),
       31's `datePassed` and `outsideCanvas` refusals checked in the pre-check, and an `importRowId`
       source reference on the Draft List if 31 did not add one, with a note built from the row
       ("From St George's theatre list: Sarah Mitchell, 08:30, lap appy ?conv to open"). It takes no
       Slot and no anaesthetist. Then `createBooking` onto it through 31's path for Bookings on a
       Draft List. The same pre-check and refusable-first rule applies; if the second step still
       fails, the Draft List stays (an empty Draft List is valid and shows on Phase 31's page), the
       row stays open and the outcome says so. When the office later assigns the Draft List
       (`assignDraftList`, with 17's not-preferred warning), its Bookings come with it;
       `redateDraftList` takes its Bookings with it, and `removeDraftList` refuses while it holds an
       active Booking (US-01.6.4). Neither reopens the row.
     - `reject`: a reason is required (`reasonRequired`); nothing else changes. A row with no NHI can
       be rejected.
     - There is no move: `reassignBooking` is never called from a row (D62).
   - **Tests:** import stages rows and a re-import skips them (including a rejected row and a row the
     office corrected); a correction to the wording is refused; every refusal above; each decision
     kind end to end; a refusal leaves both the row and the schedule unchanged; a row with no NHI is
     refused every decision but reject and creates no patient, Booking or List, and after a valid NHI
     is typed it creates normally; a created Booking has `source: 'hospitalDownload'`, the row's
     wording verbatim as its first source text with the right channel, `from` and time, **no Contract**
     and no RVG code when nothing was picked (and appears on `needsContractBookings`), the correlation
     ref when one was sent, and a reused patient for Sarah Mitchell and Priya Nair; picks land
     through `pickRvgGroup` and `setProcedureContract`'s checks and an unoffered Contract is refused;
     a row with no wording and no RVG code is refused `wordingOrCodeRequired`; no decision writes a
     billable party or a payer, and the insurer lands only through `setBookingInsurance`; a
     modification applies only ticked fields, appends the note and adds the wording beside the earlier
     text (Foster's `WLE MM` kept first, the hospital's long line second), and replaying the same row
     adds no second text; a day move's cancellation row cancels the old Booking and its New row
     creates a separate one, neither touching the other; a decision on a SUBMITTED List applies and
     one on an AUTHORISED List is refused `listLocked`; `SAMPLE_STG_UPDATE` after `SAMPLE_STG` R1 is
     applied matches the created Booking by the List and NHI and changes nothing until decided, then
     applies its time, appends its note and adds its wording beside; `createList` goes through
     `assignListToSlot` (a not-preferred pairing is acknowledged, not refused); `createDraft` creates
     the Draft List holding the new Booking and with no surgeon is refused; the two audit metas land
     in one commit and the Booking's History shows the row.
5. **Selectors** (`store/selectors.ts`, or a `store/matchingSelectors.ts` beside it): `matchingView`
   (built from stable records; components derive with `useMemo`, as the file's header comment
   requires), `importRowViews(state, filter)` (row, effective fields, suggestion, queue, flags,
   batch label), `rowStackViews(state, rowId, picks)` (the matched Booking's Procedures through 20a's
   `procedureStackView`; for a New row, a preview built by passing a draft Procedure value held in
   memory, never stored, with the row's wording as a `SourceText` and the office's picks, to the same
   `procedureStackView`, so the stack logic stays in 20a's one module), `matchingCounts(state)` and
   `matchingAttentionCount(state)` (open rows, for the side-nav badge).
   `integrationAttentionCount` now counts dead-letter rows only.
6. **The HL7/FHIR re-route: no silent apply** (RV-13; US-02.1.5 "No silent apply"):
   - Delete `applyEffect` (with the S12 create and the S13 and S14 wording appends Phase 20a put in
     it), the S12/S13 park rule Phase 28 added and Phase 31's interim `pairingIncomplete` park if 31
     left one (a row with no resolvable surgeon now simply stages and shows "Surgeon not
     recognised"). `attemptMessage` now parses as today, then validates the extracted NHI with
     `validateNhi`: an invalid NHI is a feed-mapping fault, so it keeps today's path (`retrying`,
     then `deadLetter` after `MAX_ATTEMPTS`), and MSG-CPH-2001 still dead-letters until its mapping is
     fixed. A message with **no NHI** stages a row that waits (D11). A clean parse calls
     `stageImportRows` with channel `feedMessage`, the feed's hospital, a batch label ("St George's
     webPAS message MSG-STG-1001") and one row built from the parsed fields, its procedure wording
     exactly as the message carried it (SCH-7's description, or FHIR's `Appointment.description`): S12
     gives a booked row; the S13 that only retimes a Booking and S14 a booked row with the new
     time and fields (a Modification); the S13 that moves a Booking to another day (`APPT.s13Move`) a
     **booked row for the new day** (a New row: the hospital changed the date, the system does not
     recognise a move, D62, and the Booking on the old day is left for the office to cancel,
     US-02.2.3 being Future Work); S15 a cancelled row. The canned `routing` supplies the surgeon
     and session that the extractor does not read (the §10 fence note stays). The message is marked
     `processed` with `resultImportRowId`. This is what retires RV-13's behaviour: the canned S13, S14 and
     S15 messages (the automated move, modification and cancellation, Future Work in US-02.5.1 to
     US-02.5.3) no longer change anything by themselves; they become rows for the office to decide,
     and MSG-STG-1012's fuller wording reaches Foster's Booking only when the office applies its row.
   - The transient-fault path, MSH-10 dedupe, `reprocessMessage` and `wireIntegrationRetry` are
     unchanged. `reprocessMessage` after the Christchurch Public mapping fix now stages a row.
   - `displayStatusFor` shows a processed message with a row as **"Sent to matching"**. The Messages
     tab loses the manual-intervention chip and its Reprocess case; its footnote says "Parsed messages
     are sent to the matching screen for the office to decide. Nothing is applied automatically."
   - `DemoIntegrations.tsx` pane 3 becomes "Sent to matching": the row's change type, the suggested
     decision in words, the wording as received, and "Open Admin, Matching to decide" (text, as the
     Phase 11 note on cross-app links allows). Keep `data-shot="integrations-schedule-change"` so
     recipes keep an anchor. Any label on the S13 to S15 entries that says the change is applied
     ("moves the Booking", "cancels it", "adds the hospital's wording") now says the row is staged:
     the S13 message that moves a Booking to another day is labelled "S13 · Booking on another day
     (arrives as a new row)", and MSG-STG-1014's "S14 · Locked target (manual intervention)" becomes "S14 · Change to a
     submitted List".
   - `RolesInfo.tsx`: the Integration role line becomes "Integration (hospital feeds): brings rows in
     for the office to match. It never changes a Booking itself." The integration actor no longer
     writes Bookings or wording anywhere, and an approved row applies as the office, whose window
     runs to AUTHORISED (US-02.5.4, 38a), so **remove the integration branch of `editRefusal`**
     (`integrationImmutable`, a refusal on any non-ACTIVE List) and its copy; if the Data Inspector's
     guard console or a test still exercises it, retarget those to the office's AUTHORISED refusal.
   - Tests (`integrationActions.test.ts`, reworked; 20a's `sourceText.test.ts` feed cases re-pointed
     to the row decision): **every** canned message processed on a fresh seed changes no Booking,
     List, patient or source text (snapshot the schedule before and after) and stages exactly one row
     with the expected change type and its wording verbatim; replay is still a `duplicate` no-op; the
     transient message stages on attempt 2; MSG-CPH-2001 dead-letters, and after `setFeedMapping` to
     PID-3 and `reprocessMessage` it stages a valid row; MSG-STG-1014 (the old locked target) stages
     an ordinary row, which the office can apply while the List is SUBMITTED and not once AUTHORISED;
     the S13 message stages a New row for the new day and leaves the old Booking where it is;
     MSG-STG-1012's row, applied, adds the hospital's wording beside Foster's `WLE MM` and changes
     neither her Contract nor her RVG code.
7. **Audit reading layer** (`shared/audit/actionLabels.ts`, `fieldLabels.ts`, `auditNarrative.ts`):
   `importBatch.create` "Hospital bookings imported", `importRow.receive` "Hospital row received",
   `importRow.correct` "Hospital row corrected", `importRow.decide` "Hospital row decided",
   `booking.fromHospitalRow` "Hospital row applied to this Booking"; field labels for every
   `IncomingBookingFields` key (`procedure.text` as "Procedure as received", `procedure.code` as
   "Hospital's code", `insurer` as "Insurer (as sent)", the surgeon's `hpiId` as "HPI CPN") and for
   `changeType`, `decision`, `fieldsApplied` and `picks`. The narrative reads "Kirsty W. applied a
   St George's row: Modification (time, wording, note)"; 20a's "Description added as received" entry
   follows it in the History. Remove the `manualIntervention` wording from any label.
8. **Seed and `PERSIST_VERSION`.** No seeded batches or rows: the screen starts empty on a reset and
   the presenter imports or the trigger delivers. Bump `PERSIST_VERSION` by one with a history comment
   line ("intake slice (import batches and rows); HL7/FHIR messages stage rows instead of applying;
   manualIntervention and integrationImmutable retired"). Seed tests (`seed.test.ts`): the fixture
   targets from work item 3 exist and carry the wording 20a seeded; `SAMPLE_SX` R5's Southern Cross
   Ms Patel session (Thu 6 Aug PM) has no List or Draft List, is within the canvas, is not a holiday
   and is not a scripted-beat List. `persistMigrate.test.ts`: an old payload reseeds.
9. **Checkpoint: green.** `npm run build`, `npm run build:pwa` and `npx vitest run`.
   `demoScenarios.test.ts`'s S1 case now imports `SAMPLE_STG`, decides R1 with its suggestion and
   finds Sarah Mitchell on Souter's Tue 28 Jul AM List at 08:30 with `lap appy ?conv to open` as
   received, no Contract until the office sets it (then the Contract Phase 20's patched S1 Beat 1
   names), source `hospitalDownload`. This is the stopping point for session 1.

### Session 2 · The screen, triggers, PWA and shots

10. **Admin Matching screen** (`apps/admin/screens/MatchingScreen.tsx`, with parts in
    `apps/admin/matching/`; route `/admin/matching`, `AdminMatchingRoute` in `routes.tsx`, a child in
    `router.tsx`) (US-02.1.1 to US-02.1.4, FT-02.5; AR-21 `matching-screen`, `rows-wait`). Invoke the
    frontend-design skill first.
    - **Nav.** `NavSection` gains `'matching'`, placed directly under Day view ("Matching"), with an
      amber `badgeTone: 'warn'` badge from `matchingAttentionCount`; `sectionForPath` and
      `SECTION_PATH` gain it.
    - **Header.** Title "Matching"; one line: "Hospital bookings and sheets land here. Match each row
      to a Booking or List, create what is missing, or reject it. Nothing changes the schedule until
      you decide, including updates to Bookings already matched." The OQ-13 interim line under it.
      On the right, the teal **Import hospital bookings** button.
    - **Import dialog** (a desktop dialog, `useSurface().Overlay`): a `DemoBadge label="Sample file"`
      heading, one row per `HOSPITAL_DOWNLOAD_SAMPLES` entry (four: hospital, label, row count, a
      one-line description), and Import. The result reads "5 rows imported from St George's" or "All
      5 rows were already imported. Nothing new." and selects the first new row. (The hospital's own
      list arriving is the "Receive tomorrow's theatre list" trigger, which stages the same samples.)
    - **Stats strip** in the Admin Review style: OPEN, NEW, MODIFICATIONS, CANCELLATIONS, UNMATCHED
      (a row waiting for an NHI counts as unmatched).
    - **Filter** (a segmented control): **Open** (default; ready rows first, then unmatched, each
      oldest first), **Unmatched** (the unmatched queue, US-02.1.4, rows waiting for an NHI included)
      and **Decided** (applied and rejected, newest first, with who and when).
    - **Table** (`tableChrome`): Received, Hospital (and "Sample file" or "Feed message" micro-cap
      for the channel), Patient and NHI ("No NHI" in warning tint when blank), Date, session and
      time, **Procedure as received** (the row's wording verbatim in mono, quoted, one line with an
      ellipsis and the full text in a `title`; "Not supplied" in mist; `data-shot="matching-received"`;
      US-02.1.2's criterion), Change (the change-type pill), Suggested (plain words: "Create Booking
      on Dr Souter, Tue 28 Jul AM"; "Unmatched: no List at Southern Cross for Ms Patel on Thu 6 Aug
      PM"; "Waiting for an NHI"), Flags (warning pills). Rows are clickable in the `ReviewQueue` and
      `InvoicesScreen` way (the pattern `screens/ClickableTableRows.test.tsx` covers; there is no
      shared component, so follow theirs and add the Matching table to that test). An empty state per
      filter ("No rows waiting. Import hospital bookings to start.").
    - **Row detail panel** (the `ListDrawer` pattern on the right, published through
      `useDemoTriggerContext('matching.selectedRowId', rowId)`; add the key to `DemoContextValues`):
      - header: hospital, channel, received time, the change-type pill, the batch label and any flags,
        with one "Missing from the hospital" line naming every field the row did not supply (NHI,
        date of birth, surgeon, time, procedure wording), so the office sees the patient details and
        what is missing before it decides (FT-02.1's note);
      - **the wording as received**, in full, verbatim, with the hospital's code beside it when sent
        ("Hospital's code 1661"), never wrapped in an edit field;
      - **side-by-side field diff** (US-02.1.3; AR-21 `review-differences`): columns Field, "On the
        Booking now", "From the hospital"; changed rows in warning tint with a tick box (default
        ticked) on a Modification; the wording row reads "Add beside the current text" with every
        current text listed, the rooms' and the hospital's apart (never "replace"); "Not supplied" in
        mist where the hospital sent nothing; the matched Booking named with a link to its Booking
        detail and the match basis ("Matched by date, surgeon, hospital and session, then NHI";
        "Matched by NHI at St George's on that day"); a "Match to another Booking" link opening a
        search (`searchBookingsForRow`) for the office to pick a different one by hand. For a New or
        unmatched row, the incoming fields alone;
      - **Waiting for an NHI**: a row with none shows an NHI field first and foremost ("Add the NHI to
        continue", validated on entry, `RowField`), says that nothing is created until it is added, and
        leaves only Reject enabled; typing a valid NHI releases it into a ready New row;
      - **Contract and RVG code** under the diff, for every decision that creates or matches a
        Booking: each Procedure as Phase 20a's `ProcedureStack` in full density (`rowStackViews`): for
        a matched Booking its current stack with the hospital's wording shown as the text to be added;
        for a New row the preview (the row's wording, then "Contract to choose"). Under it, a teal text
        link **Choose Contract** (Phase 20's `ContractPickerSheet`: No contract (RVG) first, then the
        fitting Contracts under holder headings, composite search) and a quiet secondary link **Choose
        RVG code** (Phase 19's `CodePickerSheet`, the type-ahead; required only when the row sent no
        wording). Both are optional; a mist caption says "Leave either to choose later: the Booking
        waits on Needs a Contract, and the RVG code is the anaesthetist's." The row's insurer shows
        beside the stack ("Insurer from the hospital: nib") with the "Hospital names a different
        insurer" pill when it holds none of the Booking's Contracts; with Phase 21 DONE it is a tick
        ("Record on the Booking", default ticked) and, on a Modification, a diff row. The footer label
        counts a pick as a change. Nothing sets a Contract or an RVG code unless the office picks;
      - inline correction for an invalid NHI (and the other correctable identifying fields), reusing
        `RowField` from `PdfReview` (move it to `apps/admin/matching/` or `tableChrome` rather than
        copying); the wording has no correction field;
      - **Decision** (radio cards, the suggested one preselected and marked "Suggested"; AR-21
        `create-booking`): Match and apply; Create a Booking on a List (a picker of ACTIVE Lists and
        unassigned Draft Lists at the row's hospital on that date and session, then others that day);
        Create a List in a session (Phase 17's `AnaesthetistCandidates` for the free anaesthetists
        that session, labelled by name and AM or PM, the clear group first then "Not preferred with
        Mr Hale", each tier-ordered, showing `NotPreferredWarning` if a not-preferred anaesthetist is
        picked, never a block); Create a Draft List ("Holds this Booking until the office assigns an
        anaesthetist"); Reject (reason required, with three quick reasons: "Not an AA booking",
        "Duplicate of another row", "Wrong hospital or date"). Phase 17's surgeon picker shows under
        Create a List and Create a Draft List when the row's surgeon did not resolve, because both
        need one;
      - footer action bar: secondary **Reject** and the teal primary whose label follows the decision
        ("Create Booking", "Apply 3 changes", "Cancel Booking", "Create List and Booking", "Create
        Draft List and Booking", "Mark as matched"); disabled with the blocking flag's reason shown
        ("Add the NHI first", "Correct the NHI before applying", "This List is authorised and
        locked", "Choose the surgeon first", "This row has no procedure wording. Choose an RVG code
        first.");
      - on success, the Admin Review choreography: a `bannerIn` banner ("Applied: Booking created on
        Dr Souter's Tue 28 Jul AM List · Kirsty W. 09:14", with a link to the Booking, and "Needs a
        Contract" when none was picked), the `tickDraw` tick, the row dims into Decided, the badge
        decrements, and **Next row** moves to the next open row.
    - Keyboard: the table rows and the decision radios are focusable; Escape closes the panel.
11. **Where the Booking shows its intake.** Phase 15's "SOURCE · Hospital download" line already shows
    on a created Booking, and Phase 20a's stack shows the row's wording as received ("Hospital
    download · St George's · Tue 21 Jul"), with later wording below it. The Booking's History (via
    `booking.fromHospitalRow` and 20a's `procedure.sourceText.add`) names the row, the hospital and
    the change type, on all three surfaces through `BookingDetailBody`. The Admin Booking detail adds
    a quiet "From hospital row IR0003" link to `/admin/matching` with that row selected (pass the row
    id in router `state`, like the Invoices List column's `openListId`).
12. **Re-point Phase 14's hospital-message entries** (as 20a left them). `fire-hospital-message` and
    `replay-hospital-message` keep `badge: 'future-scope'` and their routes (20a's Booking routes
    included), but become **bar only** (the PWA gets the stand-in in work item 13, because a row on a
    handset has no office to decide it). Their descriptions say "Stages the hospital's row on Admin,
    Matching. The Booking changes only once the office applies it." 20a's success message for
    MSG-STG-1012 becomes "Sent MSG-STG-1012 to matching: the hospital's wording is added once the
    office applies the row." On Mobile Lists and the Booking routes in the framed build the result
    message adds "Switch to Admin, Matching, to apply it." The S13 to S15 choices stay, badged, so a
    presenter asked about feeds can show one landing as a row, but no scripted beat uses them
    (RV-13).
13. **Demo triggers** (registry entries; see the next section for labels and effects). Bodies in
    `src/store/matchingDemo.ts` (or beside `demoActors.ts`) so the PWA closure stays pure:
    `receiveTheatreList`, `stageUpdateForBooking` and `officeMatchesHospitalRow`. Every body stages
    rows through `stageImportRows` (channel `download`), with AR-35 wording where it stages a new
    row. Registry tests: routes, surfaces, disabled states, determinism, that `receiveTheatreList`
    stages exactly the sample's rows and applies nothing, and that `officeMatchesHospitalRow` goes
    through `decideImportRow` with the derived suggestion and no picks (never `createBooking` or
    `addSourceText` directly).
14. **Playwright** (`npm run shots`): a new `visual/admin-matching.spec.ts` (import St George's, the
    table with the "Procedure as received" column and stats, the panel on R3 (Foster) with the
    wording to add beside `WLE MM`, a field unticked, apply, the banner and Decided, the Booking's
    stack showing both texts; R1 with Choose Contract opening the picker with No contract (RVG)
    first, then Create Booking leaving it on Needs a Contract; R4 cancelled and R5 created as a day
    move's two rows; a reject with a reason; the St George's update after R1 is applied showing its
    Modification and leaving the Booking unchanged until applied; Southern Cross R4 waiting for an
    NHI, then released by typing one; Create a List in a session on R5); update `phase11.spec.ts`
    (the simulator's pane 3 says "Sent to matching"; no manual-intervention chip) and `phase12.spec.ts`
    (S1 through the matching screen); add `/admin/matching` to `screens.spec.ts`; add the PWA
    stand-in to `pwa-device.spec.ts`. `data-shot` hooks: `matching-import`, `matching-stats`,
    `matching-table`, `matching-row-<n>`, `matching-received`, `matching-diff`, `matching-stack`,
    `matching-decision`, `matching-apply`, `matching-banner`, `matching-unmatched`.
15. **Capture recipes** (`requirements-board/requirements/capture/recipes/`): re-shoot US-02.1.1 (the import
    dialog and the landed rows), US-02.1.2 (the wording as received, and the decision panel),
    US-02.1.3 (the diff, and the update to an already matched Booking) and US-02.1.4 (the Unmatched
    filter with the no-NHI row; set `status` to captured and drop the `absentReason`); turn US-02.5.1,
    US-02.5.2 and US-02.5.3 (Future Work: the automated path) into partial analogues showing the
    office deciding the Modification, the day move's two rows and the Cancellation on the matching
    screen, then the Booking and its History; US-02.5.4 likewise (a row for a submitted List applied
    by the office, one for an authorised List locked); re-point 20a's US-02.5.7 `hospital-update`
    state through the matching screen and complete 20a's US-03.1.9 with the matching-row stack.
    Replace every caption that says a message was "applied" by itself (RV-13) and every stale caption
    the table below names. This is the short list; the full step, with the rest of the covered items
    and the recipes this phase breaks, is the Catalogue screenshots section below, run after the
    review pass. Run `npm run verify:board` from the repo root.
16. **Demo guide** (see Demo guide updates below), in this session.
17. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    then the adversarial review pass.

## Demo triggers

"Import hospital bookings" is a **product control** on the Matching screen (with a badged sample-file
picker), not a harness-bar entry, per the ROADMAP rule: it is how the office brings in a list or a
sheet it has been given. Matching itself is normal Admin use, and so are Choose Contract and Choose
RVG code in the panel. Three things are not: the hospital sending its list on its own, the hospital
sending a later update for a Booking already matched, and the office's side on a handset, where there
is no Admin app. All entries register in Phase 14's registry; nothing is added to the Control Panel
page, which lists them under their screens. The old "Send unmatched row" and "Reschedule to a date
with no List" are gone: the Southern Cross list brings an unmatched row and a row waiting for an NHI,
and a day move is a cancellation plus a new Booking.

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `matching-receive-theatre-list` | Receive tomorrow's theatre list | Admin · Matching (`/admin/matching`) | bar | `choices`: **"St George's"** (stages `SAMPLE_STG`: a new Booking, a No change, a modification, and a day move as a cancellation plus a new Booking) and **"Southern Cross"** (stages `SAMPLE_SX`: a new Booking, a modification with a different insurer, a change for an authorised List, a row with no NHI and a row for a session with no List). Runs `receiveTheatreList` through `stageImportRows` (channel `download`, the batch labelled "<hospital> theatre list (sample)"), then selects the first new row. Message: "St George's sent its theatre list: 5 rows are waiting on Matching. Nothing changes the schedule until the office decides." | that hospital's list is already received ("This list is already on Matching") |
| `matching-send-update` | Send update for a matched Booking | Admin · Matching | bar | Acts on the Booking matched by the row selected in `matching.selectedRowId` if it is open and not AUTHORISED; otherwise on Diane Foster's Booking (Tue 4 Aug AM, 20a's `WLE MM`). Runs `stageUpdateForBooking`: a row for the same List and patient with a time 30 minutes later (Foster: MSG-STG-1012's time) and the hospital's fuller wording (Foster: AR-35 row 27; Sarah Mitchell: `Laparoscopic appendicectomy, may convert to open`; any other Booking: its RVG group's description or its held wording as the hospital would spell it, or no wording when it has none), then selects it. Message: "St George's sent an update for Diane Foster: a new time and fuller wording. Check the differences and approve it." | no eligible Booking ("Select a row matched to an open Booking"), or the same update is already waiting ("This update is already waiting on Matching") |
| `matching-office-matches-row` | Hospital row arrives and the office matches it | Mobile · Lists and the Booking screen (`/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`) | pwa | `choices`: **"Sarah Mitchell, Tue 28 Jul AM (S1)"** (stages `SAMPLE_STG` R1 alone); on a List route whose List is the persona's, ACTIVE and at St George's or Southern Cross, **"A new hospital booking on this List"** (a row built from a small fixture pool of three synthetic patients with AR-35 wording and valid NHIs, the next unused one); and on a Booking route, **"A hospital update for this Booking, approved by the office"** (the same row as `matching-send-update`; on Diane Foster's Booking the hospital's fuller wording, replacing 20a's PWA "Fire hospital message" beat). Then `decideImportRow` as `OFFICE_SIMULATION_ACTOR` with the derived suggestion, every difference ticked and no Contract or RVG code pick. Message: "St George's sent Sarah Mitchell's booking and the office matched it. She is now on your Tue 28 Jul AM List; the office will set her Contract." `badge: 'office-stand-in'` | S1 choice: Sarah Mitchell already on that List ("Already on your Tue 28 Jul AM List"); List choice: pool used up, or the List is not ACTIVE; Booking choice: the Booking's List is AUTHORISED, or the update was already applied |

The PWA entry is an office stand-in: it shows only in the installed PWA's demo sheet, never in the
harness bar, because in the framed build the presenter plays the office in Admin, Matching. The
re-homed "Fire hospital message" and "Replay last message" stay in the bar only, badged Future scope
(work item 12); they stage rows and never apply a change, and no scripted beat uses the S13 to S15
messages (RV-13).

## Out of scope

- **Bringing St George's and Southern Cross rows in without a hand import** (US-02.1.5, whose
  schedule, pull-on-open, sync-button and last-synced criteria were dropped, leaving "No silent
  apply", which this phase meets): Phase 34, through `stageImportRows`. There is no sync state to
  keep.
- **The simulator's demotion and the S1 rebuild**: Phase 34 (hiding the monitor's Future tabs,
  badging the Surgeon PDFs tab, surgeon PDF ingest US-02.2.1 and RV-12). This phase keeps the Surgeon PDFs inbox unchanged. Daily
  sheets from other providers with an auto-match toggle are not built (FT-14.6 is Future Work).
- **Automated change application** (US-02.5.1 to US-02.5.4 and US-02.5.6, Future Work, with
  US-14.6.2): a hospital modification or cancellation applied with no one deciding it, the automated
  handling of a Booking moved to another day (US-02.5.2; OQ-87 answered it: a cancellation plus a new
  Booking, with no clash rule), and concurrent edits between an integration and a person. Not built
  anywhere in the plan; the canned S13 to S15 stage rows and stay out of the scripted demo (RV-13).
- **Detecting Bookings removed from a re-sent List** (US-02.2.3, Future Work): a Booking missing from
  the next list is not noticed; the office cancels it by hand, or a hospital's cancelled row does.
- **Automatic matching, AI-assisted matching** or a bulk "apply all suggestions": Future Work
  (US-14.6.2; FT-02.1 says the first version makes no automated decisions, and on US-02.1.2 Greg's
  "why is this a manual task" was answered with an import gate for the first release). Every row
  gets its own decision; raise bulk apply as a discovery point.
- **A hospital setting the Contract** (US-04.3.6, Proposed), and any default Contract (OQ-78: none). A row only shows its wording, code and insurer; the office picks the Contract in the panel or later, and the RVG code is the anaesthetist's.
- **A real file upload and parser.** How each hospital provides its bookings is OQ-13; the samples
  stand in.
- **Applying an NHI change** from a row, the office's view of rows waiting for an NHI, attach and merge, and the NHI required on every other form: Phase 40. **The unpaid-balance alert at match** (US-11.3.2: mild or strong by the invoice's age
  from its date, mild for a credit balance, always waved through; D24): Phase 40 registers it in
  Phase 15a's warning routine and shows it in the row panel.
- **The payer and the insurer on the Booking themselves** (US-11.2.2, DM-12, D28): Phase 21. This phase only hands a row's insurer to 21's `setBookingInsurance`.
- **Removing, re-dating or assigning a Draft List** (US-01.6.4, US-01.6.3): Phase 31's actions and
  pages. This phase only creates one from a row, holding the row's Booking.
- **Explicit save and the update email to the rooms or the hospital** (US-02.3.2, US-02.3.3, and the
  per-kind templates of US-02.3.4): Phase 35. The update email is an on-demand button on a Booking
  that picks changes from its change history (D19), manual only (OQ-82 answered), never a prompt
  after a match.
- **Adding a Booking to a List that already has Bookings from admin entry**, with its optional "as
  given" (EP-02's other admin-entry gap): Phase 35. This phase creates Bookings on booked Lists only
  through a matched row. The intake sources on `Booking.source` are Phase 15's.
- **A refund for a cancelled prepaid Booking** (US-02.5.3's pointer to US-06.5.2, OQ-40): Phase 41.
  A Cancellation decision calls `cancelBooking`, so whatever 27 and 41 hang on it follows.
- **Re-deciding a decided row** (undo). A wrong decision is corrected on the Booking through normal
  edits; the row's history and any wording it added stay as they were (the wording is append-only).
- The full S1 and S4 rewrites: Phases 34 and 44. This phase patches S1 Beats 1 and 2, S4 Beat 4 and
  S5 Beat 2.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin side nav shows "Matching" under Day view with no badge; the screen shows the
  empty state, the OQ-13 interim line and the teal "Import hospital bookings" button; no copy on
  the screen says "download".
- [ ] Import, St George's: the dialog shows the "Sample file" badge and four samples; "5 rows
  imported"; the stats strip reads OPEN 5, NEW 2, MODIFICATIONS 1, CANCELLATIONS 1, UNMATCHED 0 (R2 is
  the No change row); the badge shows 5. Every row's "Procedure as received" cell shows the wording
  exactly as the sample holds it (`lap appy ?conv to open` with its question mark; R2 "Not
  supplied"). Importing it again says nothing new was added.
- [ ] Open R1 (Sarah Mitchell): New, suggested "Create Booking on Dr Souter, Tue 28 Jul AM"; the
  stack preview reads the wording, then "Contract to choose". Choose Contract opens the picker with
  No contract (RVG) first and no hospital default preselected; close it without picking. Create
  Booking: the banner (with "Needs a Contract"), tick and dimmed row show, the badge drops to 4,
  "Next row" opens R2. Mobile Lists, Tue 28 Jul AM: Sarah Mitchell is the fourth Booking at 08:30,
  "SOURCE · Hospital download", her stack showing `lap appy ?conv to open` (Hospital download · St
  George's) and no Contract, her existing patient record reused. Admin Day: she is on the "Needs a
  Contract" card; setting the Contract there as Phase 20's S1 Beat 1 does takes her off it.
- [ ] Import "St George's theatre list, a day later": its row is a Modification of the Booking R1
  created ("Matched by date, surgeon, hospital and session, then NHI"), with time 08:30 against
  09:00, the note, and the wording row "Add beside the current text". Sarah Mitchell's Booking still
  reads 08:30 with one text until "Apply 3 changes"; then it reads 09:00, the note is appended, and
  her stack shows `lap appy ?conv to open` then `Laparoscopic appendicectomy, may convert to open`
  below it, both from the hospital. Her Contract and RVG code are unchanged. (Imported before R1 is
  decided, the row instead shows "Earlier row for this Booking still open".)
- [ ] R2: No change, "Matched by date, surgeon, hospital and session, then NHI"; the panel's
  "Missing from the hospital" line names the procedure wording, which is not a change; "Mark as
  matched" records it and writes nothing.
- [ ] R3 (Diane Foster): Modification with time, wording and note in warning tint side by side. Untick
  the note, apply "2 changes": the Booking shows the new time; its stack shows `WLE MM` (rooms) then
  the hospital's long line below it, apart from the rooms'; her Contract and RVG code are unchanged;
  her notes are unchanged; her History shows "Hospital row applied: Modification (time, wording)" by
  Kirsty W. and "Description added as received".
- [ ] Import St George's again after deciding R3: nothing new (identical rows, including R3, are
  skipped). The note-append check is Southern Cross R2 below.
- [ ] R4 and R5, a day move: R4 is a Cancellation found by NHI on the Booking's current day: "Cancel
  Booking" soft-cancels it (still visible, excluded from billing). R5 is a New row for the same
  patient on another day's List: "Create Booking" makes a **separate** Booking there with the wording
  as received and no Contract; the cancelled Booking's History is untouched by it and nothing links
  the two. No "Reschedule" appears anywhere.
- [ ] Southern Cross sample (OPEN 5, NEW 3 with R4 waiting and R5 unmatched, MODIFICATIONS 2, UNMATCHED 2):
  Priya Nair lands on the Tue 28 PM List with `ACL recon R` as received and on "Needs a Contract"; R2
  shows patient name, DOB and note diffs, "Insurer from the hospital: nib" with the "Hospital names a
  different insurer" pill (and, with Phase 21 DONE, the insurer diff). Choose Contract, pick the
  nib-held one, and apply: the patient is updated, the Procedure is on the picked Contract, the
  hospital note is appended below the Booking's existing notes (never overwriting them), and the
  insurer is recorded only if ticked. Leaving the Contract alone keeps the Booking's current
  Contract.
- [ ] Southern Cross R4, no NHI: the row sits under Unmatched with "No NHI" and "Waiting for an NHI",
  the panel's NHI field leads, every decision but Reject is disabled with "Add the NHI first", and no
  patient or Booking exists for it (Data Inspector, Admin Day). Type an invalid NHI: "NHI invalid".
  Type the pinned valid NHI: the row becomes a ready New row suggesting Create Booking on Dr Souter's
  Tue 28 PM List, and creating it works. Rejecting an untouched copy works with a reason.
- [ ] Southern Cross R5: Unmatched ("No List at Southern Cross for Ms Patel on Thu 6 Aug PM"). Create a
  List in a session: the candidates are tier-ordered with "Not preferred with ..." apart; picking a
  not-preferred anaesthetist shows the warning and can still go ahead; the List and Booking appear on
  the Day view for that date. Create Draft List is offered on the same row (checked on Forte R3 below).
- [ ] Forte sheet: R2 shows "NHI invalid" and Apply is disabled with the reason; correct the NHI
  inline (the wording has no edit field) and apply. R3 is Unmatched ("No List at Forte Health ...");
  Create Draft List and Booking creates the Draft List with hospital, surgeon, day and session
  (origin "Hospital row", no Slot or anaesthetist taken) holding the row's Booking with `TURBT` as
  received (channel "Hospital sheet"), and the row moves to Decided. The Draft List shows on Phase
  31's Draft Lists page and the Day view band with one Booking; assign it to an anaesthetist there
  and the Booking comes with it.
- [ ] A row with no wording and no RVG code: "Create Booking" is disabled with "This row has no
  procedure wording. Choose an RVG code first."; Choose RVG code (the type-ahead) enables it.
- [ ] Demo actions, **Receive tomorrow's theatre list, Southern Cross** after a reset: the five rows
  wait and nothing on the schedule changes; running it again says "This list is already on Matching".
  **St George's** does the same for its five rows.
- [ ] Demo actions, **Send update for a matched Booking**, with nothing selected after a reset: a
  Modification row for Diane Foster with the new time and the hospital's long wording waits; Foster's
  Booking is unchanged until the office applies it. Running it again says the update is already
  waiting. "Match to another Booking" finds a Booking by NHI and re-targets the row.
- [ ] A row whose surgeon is not recognised: Create a List and Create a Draft List show the surgeon
  picker and stay disabled with "Choose the surgeon first" until one is picked; Create a Booking on
  an existing List does not need it.
- [ ] A row for a Booking on a SUBMITTED List (MSG-STG-1014's row): no special flag, and the office can
  apply it. Southern Cross R3 (an AUTHORISED List): "List authorised" flag, the button is disabled
  with "This List is authorised and locked"; Reject works.
- [ ] Admin Integrations (Future-scope badge): Demo actions, Fire hospital message MSG-STG-1001 after
  a reset: the message reads "Sent to matching", Souter's List is unchanged, and a Feed message row
  with `lap appy ?conv to open` waits on Matching. Replay is a duplicate. MSG-CPH-2001 still
  dead-letters; fix the mapping to PID-3 and reprocess: a row lands on Matching. No "Manual
  intervention" wording remains.
- [ ] RV-13: fire each S13, S14 and S15 message (MSG-STG-1010 to MSG-STG-1014): every target
  Booking is unchanged (time, List, notes, wording, not cancelled), and a row waits on Matching for
  each (the S13 that moves a Booking to another day is a New row for the new day; the old Booking
  stays). On Diane Foster's Booking, Fire hospital message (MSG-STG-1012) adds no wording until its
  row is applied. No scripted beat in the run sheet or the Control Panel fires them.
- [ ] The Integrations simulator's pane 3 reads "Sent to matching" with the change type, the
  suggestion and the wording, and never "applied".
- [ ] The Demo actions pill is absent on Admin screens with no entries; the Control Panel lists the
  two Matching entries under Admin · Matching with an Open screen link, and the stand-in as "Shown
  in the installed PWA".
- [ ] PWA (`npm run build:pwa` and preview), after a reset: Mobile Lists shows the Demo chip; **Hospital
  row arrives and the office matches it, Sarah Mitchell** puts her on the Tue 28 Jul AM List with her
  wording as received; the choice is then disabled. On an ACTIVE St George's List, "A new hospital
  booking on this List" adds a synthetic patient. On Diane Foster's Booking, "A hospital update for
  this Booking, approved by the office" adds the hospital's long wording below `WLE MM`. "Fire
  hospital message" is no longer in the PWA sheet.
- [ ] S1 Beats 1 to 3 run from a reset as patched below; S4 Beat 4 and S5 Beat 2 run as patched.
- [ ] No en or em dash in any new copy, no "slot" in app copy (OQ-64: say session, AM or PM), no
  "blacklist", no "Reschedule" as a change type, and no "DRAFT" for an assigned List; teal is the only
  action colour; no crimson on the new nav badge, pills, banner or buttons.
- [ ] Catalogue screenshots: the recipes in the Catalogue screenshots table are created or updated
  (US-02.5.1 to US-02.5.4 as partial analogues that never show an automated apply; US-02.5.7 and
  US-03.1.9 re-pointed or completed), any recipe this phase broke is re-pointed, a full `npm run
  capture` ends with no failed recipe and no story without a recipe, the covered items' new shots
  are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session (ROADMAP rule), locating each passage by its text: Phases 15a to 32a
edit the same files (20 S1 Beat 1's Contract, 20a S1 Beats 1 to 3's wording and the Foster aside, 19
and 19b S1 Beat 3's capture). Phase 34 rebuilds S1 around the sync; this phase makes S1 honest now.
- `docs/demo-guide/03-demo-script.md`:
  - **S1 · Stage it and Beat 1** ("the booking arrives from the hospital"):
    - **Click:** Mobile Lists, open Tue 28 Jul St George's AM and read the three booked cases (with
      the rooms' wording 20a seeded); then Admin, Matching, **Import hospital bookings**, St George's;
      open Sarah Mitchell's row, read `lap appy ?conv to open` as the hospital sent it and the
      suggestion; **Choose Contract** and set the Contract Phase 20's patched beat names (No contract
      (RVG) first in the list), leaving the RVG code to the anaesthetist; **Create Booking**; back to
      Mobile, reopen the Tue 28 Jul AM List. Handset variant: Mobile Lists, Demo, **Hospital row
      arrives and the office matches it** (the office then sets her Contract from the "Needs a
      Contract" card, or the presenter narrates it).
    - **Say:** "Hospital bookings are how most bookings reach AA today. They land on the matching
      screen with the hospital's wording exactly as sent, the office sees what each row would change,
      and nothing reaches the schedule until someone decides, even an update to a Booking already
      matched. This one is new, so it becomes a Booking on Dr Souter's List. The hospital does not
      choose the Contract; the office does, here or from its Needs a Contract list."
    - **Expected:** Sarah Mitchell as the fourth Booking at 08:30, source "Hospital download", her stack showing the wording as received, her existing patient record reused, on the Contract the office picked. Remove any "on the hospital's default Contract"
      wording and replace the "near real time HL7 and FHIR" line; Phase 14's Future-scope caveat now
      only needs to say the simulator is not how S1 is shown.
    - Optional beat 1b: open R3 (Diane Foster) to show the side-by-side diff, the hospital's long
      wording to be added beside `WLE MM`, and untick a field; or import "St George's bookings, a day
      later" to show Sarah Mitchell's update waiting for approval, matched by date, surgeon, hospital
      and session.
    - Do not fire the S13 to S15 hospital messages in any beat (RV-13): automated changes are Future
      Work. If asked, say "Applying hospital changes automatically comes after the first release;
      until then every change waits for the office here."
  - **S1 Beat 2 aside** (20a's "the rooms' and the hospital's wording" on Diane Foster's Booking):
    replace "Demo actions → Fire hospital message (MSG-STG-1012) to add the hospital's fuller wording
    live" with "on Admin, Matching, Demo actions → Send update for a matched Booking (or R3 of the St
    George's import), then Apply: the hospital's fuller wording is added beside 'WLE MM', never
    overwriting it". Handset: the stand-in's "A hospital update for this Booking, approved by the
    office".
  - **S1 Serves** line: "importing hospital bookings and the matching screen" replaces "the RFP's
    near-real-time hospital integration".
  - **S4 Beat 4** becomes **"the unmatched queue"**: Click: Admin, Matching, Demo actions, Receive
    tomorrow's theatre list, Southern Cross; open the row with no NHI under Unmatched and type the
    NHI; then open the row for a session with no List and Create a List in a session. Say: "Nothing
    from a hospital is ever dropped. A row with no NHI waits here until the office adds it, and no
    patient or Booking is made. A row that matches nothing waits until someone decides: create the
    List, put the Booking on a Draft List for the office to fill, or reject it with a reason."
    Expected: both rows in Unmatched, the first released into a ready row by the NHI, then the new
    List and Booking on the Day view and the row under Decided. Move the feed-mapping dead-letter to
    "What to narrate rather than click" as Future scope (HL7 v2).
  - **S4 Discovery points:** replace "how inbound messages targeting a submitted or authorised List are parked for manual intervention" with "a hospital row for a submitted List can still be applied by the office until the List is authorised (US-02.5.4), and one for an authorised List cannot (what happens then is not yet decided); a Booking moved to another day arrives as a cancellation plus a new Booking; applying hospital changes automatically is Future Work".
  - **S5 Beat 2** (MSG-STG-1002, the new-format NHI): Expected now reads "the message is sent to
    matching; the row on Admin, Matching shows the validated new-format NHI". Or point S5 Beat 2 at
    the Forte sheet's invalid-NHI row, whichever reads better; say which in the PROGRESS entry.
  - **Direct URLs:** add Matching `/admin/matching`.
  - **Recovery from demo accidents:** "Imported the same sample twice: nothing new is added. Applied
    the wrong row: fix the Booking by hand; the row's decision and any wording it added stay in the
    history."
  - **Discovery points** (S1): OQ-13 (how each hospital provides its bookings, the fields and
    cadence, and whether they carry the insurer, the procedure wording and an appointment id), OQ-108 (which source starts a booking: the hospital import stays the priority), removals from a re-sent list (US-02.2.3, Future), bulk apply, and AI-assisted matching later. If Greg's
    "why is this a manual task" comes up: the first release keeps the import gate with no automated
    decisions, and automatic matching and updates are Future Work (US-14.6.2).
- `docs/demo-guide/02-workflows-and-handoffs.md`: **Workflow 1** readiness line and triggers ("hospital
  bookings or a sheet arrive"); main path step 5 becomes "Hospital rows are matched on the matching
  screen: the office applies, creates (a Booking, a List, or a Draft List holding the Booking) or
  rejects each one, and sets the procedure and Contract there or from Needs a Contract; anaesthetists
  and the office change Bookings directly while the List is ACTIVE"; add the matching-screen handoff
  (office to anaesthetist: the Booking appears on her List with the hospital's wording). **Integration
  failure** becomes "Hospital rows": an unmatched row, or one with no NHI, waits in the unmatched queue; a duplicate row is skipped; a later update waits for approval, matched by date, surgeon, hospital and session; a Booking moved to another day arrives as a cancellation plus a new Booking; a row for a submitted List can still be applied by the office; a row for an authorised List cannot be applied. The HL7
  dead-letter line moves under a Future-scope note, beside one line that automated hospital changes
  are Future Work. The hospital-update paragraph 20a wrote says the hospital's later wording is added
  once the office applies its row. The readiness table gains "Hospital import and matching screen,
  Phase 33" and the HL7/FHIR row says Future scope.
- `docs/demo-guide/01-personas-and-responsibilities.md`: the office gains "Import hospital bookings,
  match each row, and set each new Booking's procedure and Contract"; the integration-operator
  section says the matching screen is the in-scope surface and the HL7/FHIR monitor is Future scope.
- `docs/demo-guide/04-presenter-cheat-sheet.md`: rewrite "How do late hospital changes work?" (rows
  land on the matching screen with their wording as received; a later update is matched by date,
  surgeon, hospital and session and approved; the office applies them up to AUTHORISED; nothing
  applies itself, and the hospital never sets the Contract; automated application comes after the
  first release, US-02.5.1 to US-02.5.4); the roles table's System/integration column ("brings rows
  in; never changes a Booking"); one line for the three Matching triggers and the PWA stand-in.
- `docs/demo-guide/master-demo-guide.html`: mirror every edit above (S1 stage, Beat 1 and the Beat 2
  aside, S4 Beat 4, S4 discovery points, S5 Beat 2, Direct URLs, recovery, Workflow 1, integration
  failure, personas, cheat sheet).
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`): S1's message becomes "Reset to a
  clean S1 state. Start in Mobile, then import the St George's bookings on Admin, Matching, set Sarah
  Mitchell's Contract and create her Booking. ..." with the rest unchanged, and the old "Fire hospital
  message" step and its "arrives in a later build" caveat gone; S4's Beat 4 line points at Admin,
  Matching, Demo actions, Receive tomorrow's theatre list; S5's MSG-STG-1002 line says it is sent to matching.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 33` first: earlier phases (20a above all)
may have changed these recipes since this plan was written. The harness bar is hidden in shots, so
recipes stage rows through the product's Import hospital bookings dialog (the badged sample picker);
for the bar-only triggers ("Receive tomorrow's theatre list", "Send update for a matched Booking") use
the matching `/demo/control` entry in `setup`, as ATLAS.md's Shell notes say. Several current captions
describe old behaviour (a surgeon PDF analogue, messages "held for manual intervention", a message
applied by itself); replace each when its recipe is updated. This section is work item 15's full form;
work item 15 stays as its short list. EP-02, FT-02.1 and FT-02.5 have no recipe of their own; their
stories carry the shots.

**Covered items.** When the phase is done, each recipe in `requirements-board/requirements/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md) Import hospital bookings | partial · admin-surgeon-pdf-import[inbox,review-rows] | captured. Re-shoot on `/admin/matching` (admin): `matching-import` (the Sample file dialog, four samples) and `matching-table` after importing `SAMPLE_STG` with the "Procedure as received" column. Drop the surgeon PDF shots and the partial reason; captions "Hospital bookings imported from a sample file" and "Each imported row lands on the matching screen with its procedure text as received" |
| [US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) Match rows to Lists and Bookings | partial · admin-pdf-row-matching | captured (admin). `as-received` first (Sarah Mitchell's `lap appy ?conv to open` exactly as sent; highlight `matching-received`; caption "Each row shows its procedure text exactly as the hospital sent it"), then the decision panel (`matching-decision`): `match`, `create-booking` (List picker, stack preview, Choose Contract), `create-list`, `create-draft` (holds the row's Booking), `reject` (reason required). Drop the PDF shot, its stale caption and the partial reason |
| [US-02.1.3](../../../../requirements-board/requirements/stories/US-02.1.3.md) Show differences on match | absent | captured (admin). Open R3 (Foster's Modification): `diff` (time, wording "Add beside the current text", note in warning tint; `matching-diff`) and `diff-unticked` (note unticked, footer counts 2 changes); `matched-update`: after R1 is applied, import `SAMPLE_STG_UPDATE`, its row matched by date, surgeon, hospital and session, then NHI, waiting for approval. Remove the absent reason |
| [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) Unmatched queue | partial · admin-needs-attention-queue | captured (admin). Import `SAMPLE_SX`, filter Unmatched (`matching-unmatched`): R4 "Waiting for an NHI" and R5 with its reason "No List at Southern Cross ...", amber nav badge; state `nhi-added` (a valid NHI typed, the row ready); state `decided` (R5 resolved, nothing dropped). Caption "A row with no NHI, or that matches nothing, waits in the unmatched queue until the office decides". Retire the integration-log shot and its stale caption ("held for manual intervention"); drop the partial reason |
| [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) Automatic sync from St George's and Southern Cross | absent | no change here (Phase 34 owns it) |
| [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md) Read, correct and ingest a surgeon PDF list | captured · admin-surgeon-pdf[inbox,extracted] | no change here (Future Work; Phase 34 badges the tab). Check the Surgeon PDFs inbox shot still passes |
| [US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md) to [US-02.3.4](../../../../requirements-board/requirements/stories/US-02.3.4.md) Create or amend, save, update email, templates | partial, absent, absent, none | no change here (Phase 35 owns them). US-02.3.1's partial reason: the office adding a Booking to a List that already has one by hand is Phase 35's; a matched row creates one only through this screen |
| [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking manually | captured · web-add-card, mobile-add-card | no change here (Phase 20a owns the "as given" state). Check it still passes |
| [US-02.5.1](../../../../requirements-board/requirements/stories/US-02.5.1.md) Apply a modification | captured · simulator-inbound-message[received,applied], admin-card-history | partial (Future Work: the automated path). `received`: Foster's Modification row on the matching screen; `card-history`: after the office applies it, the changed Booking and its History lines "Hospital row applied" and "Description added as received" (applied through store setup, not a replay). `absentReason`: "Automated application from an integration is Future Work (US-14.6.2). In the first release the office applies a hospital modification on the matching screen, shown here." Drop the simulator "applied" shot and its caption |
| [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md) Reschedule to another day arrives as cancel and new Booking | captured · simulator-inbound-message[received,applied], web-rescheduled-card | partial (Future Work: the automated path). `cancel-and-new`: `SAMPLE_STG` R4 (the old day's Cancellation) and R5 (the new day's New row) on the matching screen, then the web Lists showing the old Booking cancelled and the new one created; caption "A Booking that moves day arrives as a cancellation plus a new Booking, decided by the office". `absentReason`: "Detecting the move or the missing Booking from a re-sent List, and automated handling, are Future Work (US-02.2.3). In the first release the office decides each row." Drop the simulator "applied" shot, `web-rescheduled-card` and their captions ("Reschedule applied, the Booking moves to the new List") |
| [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md) Record a cancellation | captured · simulator-inbound-message[received,applied], web-cancelled-card | partial (Future Work: the automated path). `received`: the Cancellation row (R4) on the matching screen; `applied`: the Booking the office cancelled, kept visible on the web List, marked cancelled. `absentReason`: "Automated cancellation from an integration is Future Work. In the first release the office records a hospital cancellation on the matching screen." Drop the simulator "applied" shot and its caption |
| [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) Inbound changes accepted until the List is authorised | partial · simulator-change-cutoff | partial, re-shot on the matching screen (admin): a row for a submitted List (MSG-STG-1014) that the office can still apply, beside a row for an authorised List (`SAMPLE_SX` R3) with its "List authorised" flag and the disabled apply ("This List is authorised and locked"). Reason: "Automated changes are Future Work. In the first release every hospital change waits for the office, who may apply it until the List is authorised." Drop "held for manual intervention" and its caption |
| [US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md) Append-only change history | captured · admin-card-history, admin-audit-log | no change here. Check the History names the hospital row, the office who applied it and the wording added |
| [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md) Concurrent edits | absent | stays absent; reword the reason: "Future Work: concurrent edits between an automated update and a person." |
| [US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) Keep the procedure text as received | captured by 20a · source-wording[rooms,hospital-update] | stays captured. Re-point `hospital-update` (MSG-STG-1012 now only stages a row): stage Foster's update (the `matching-send-update` entry or `SAMPLE_STG` R3) and apply it on Admin, Matching, then shoot the Booking on web, mobile and admin as before. Caption "A later hospital update, approved on the matching screen, is added beside it, never overwriting it". Add state `matching-row` (the wording to add beside `WLE MM`, highlight `matching-diff`) |
| [US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) Booking descriptions and Contract shown together | partial (20a) | captured. Add `matching-stack` on `/admin/matching` (Sarah Mitchell's panel after Choose Contract: the wording as received, then the Contract; highlight `matching-stack`; caption "The matching screen shows each Procedure's text as received, then its Contract"). Drop the `absentReason` |
| [US-02.3.2](../../../../requirements-board/requirements/stories/US-02.3.2.md) | see Phase 35 | no change here (Phase 35 owns it) |
| [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md) | see Phase 35 | no change here (Phase 35 owns it) |

**Recipes this phase breaks.** The Integrations monitor stays, but its messages stage rows instead of
applying, and `manualIntervention`, the park codes and the S14 "Locked target (manual intervention)"
label are retired. Re-point as follows (no recipe may show an automated apply, RV-13):
- `US-02.5.1` to `US-02.5.4`: their simulator `inbound-message` shots and the `setup` steps of
  `card-history`, `rescheduled-card` and `cancelled-card` replay S13 to S15 and expect the Booking to
  change; `change-cutoff` uses the S14 locked-target label and the `integrations-schedule-change` pane.
  Re-point as in the table.
- `US-02.1.4`: `needs-attention-queue` uses S12 and S14 and `integrations-attention`. Replaced above.
- `US-02.5.7` (20a): the `hospital-update` trigger step. Re-pointed above.
- `US-04.3.4` (20's `needs-contract` state): a Booking created from a row also lands on the card;
  check the shot passes from a reset and re-point only if it pins a row count.
- `US-14.1.1` (Future): `hl7-siu-message` state `applied` reads the schedule-change pane, which now
  says "Sent to matching"; keep the shot, highlight the same pane, and caption it "Inbound HL7 SIU
  message, translated to FHIR · staged on the matching screen, nothing applied". `message-log` keeps
  working; check the log wording.
- `US-14.5.1` (`dead-letter` still dead-letters), `US-14.2.1`, `US-14.3.1` (the live-feed result text
  now says rows were sent to matching), and `US-02.2.2`, `FT-02.2`, `US-11.1.2` (the
  `/admin/integrations` tabs): check only. Phase 34 moves these to the Future-scope surface.
- Anything else that opens `/admin/integrations` or `/demo/integrations`, or fires "Fire hospital
  message" from a Booking route: the `--dry` run is the check.

**ATLAS.md.** Update Routes (`/admin/matching`, the Matching nav item and its amber badge), Existing
hooks (`matching-import`, `matching-stats`, `matching-table`, `matching-row-<n>`, `matching-received`,
`matching-diff`, `matching-stack`, `matching-decision`, `matching-apply`, `matching-banner`,
`matching-unmatched`), Overlays (the Import hospital bookings dialog; the Contract and RVG code
pickers opened from the row panel), the Integration simulator description (messages stage rows; the
S14 locked-target label and "manual intervention" are gone; S13 to S15 never apply; MSG-STG-1012's
wording arrives only through its row), the trigger list (the two Matching entries; "Fire hospital
message" bar only) and a note on the sample files (`SAMPLE_STG`, `SAMPLE_STG_UPDATE`, `SAMPLE_SX`,
`SAMPLE_FORTE_SHEET`), their AR-35 wording and the row ids they land as.

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
- **No silent apply, and no automated decisions, anywhere.** Grep for every caller of
  `createBooking`, `editBooking`, `editPatient`, `editProcedure`, `addSourceText`, `pickRvgGroup`,
  `setProcedureContract`, `setBookingInsurance`, `reassignBooking` and `cancelBooking` reachable
  from `integrationActions.ts`, the fixtures and the trigger bodies: the only path from a hospital row
  to the schedule is `decideImportRow`, and only with an explicit decision (the PWA stand-in
  included, with no picks). Every canned message, S13 to S15 included, leaves the schedule and every
  source text byte-identical (RV-13). An update to an already matched Booking is never applied
  because it matched before: it is diffed and waits like any other row (US-02.1.3).
- **A day move is a cancellation plus a new Booking (D62).** No Reschedule change type, label, flag,
  fixture, trigger or recipe remains; `reassignBooking` is never called from a row; the matcher never
  finds a Booking on another day, by NHI or by appointment id; nothing links the two rows of a move;
  no rule turns a clash into a Draft List (US-02.5.2 is Future Work).
- **A row with no NHI waits (D11).** It creates no patient, Booking, List or provisional record by any
  decision but reject; it stays in the unmatched queue and the stats until an NHI is typed (validated on
  entry), and then behaves as any row; `intake.ts`'s provisional path is never reached from a row.
- **The match key is US-02.1.3's.** `findMatch` finds the List by date, surgeon, hospital and session
  and then the patient by NHI; the appointment id is only a duplicate key; nothing matches by name
  alone; the key lives in that one function with its tests.
- **The wording is kept as received.** Every row's wording reaches the Procedure verbatim (no trim,
  no case change), through `createBooking`'s source text or `addSourceText` only, beside earlier
  texts and never replacing them, the hospital's apart from the rooms'; a replay adds nothing;
  `correctImportRow` cannot touch it; the wording never sets or changes a Contract or an RVG code; the
  table and panel show it exactly as stored.
- **No Contract or RVG code from a row.** No suggestion, trigger body or stand-in carries a Contract or
  RVG code pick; a created Booking with no office pick has no Contract and appears on "Needs a
  Contract"; no default Contract exists or is reintroduced (OQ-78); the picker offers No contract
  (RVG) first through 20's module; a pick goes through `setProcedureContract`'s, `pickRvgGroup`'s or
  `createBooking`'s checks only.
- **Applies until AUTHORISED (US-02.5.4).** A decision on a SUBMITTED List applies as the office;
  one on an AUTHORISED List is refused and the row stays open; the `integrationImmutable` refusal and
  its branch are gone and nothing writes as the integration actor.
- **Nothing is dropped.** A row that matches nothing, a modification for an unknown Booking and a row
  waiting for an NHI all stay open and visible; "unmatched" is derived, so no code path can clear it
  without a decision. A Draft List created from a row holds the row's Booking (OQ-44), so no row is
  left waiting on one, and a failed second step leaves the row open. A skipped re-import is counted
  and said.
- **A missing field is never a change.** No incoming "not supplied" value blanks a Booking field; the
  diff, the classifier and the apply agree on this.
- **Who is billed is untouched.** No decision writes a billable party or a payer; the row's insurer is
  recorded on the Booking only through Phase 21's `setBookingInsurance`, as source data, and never
  decides who is billed (D17, D28).
- **The Draft List rules hold.** `createDraft` never saves without hospital, surgeon, day and
  session, takes no Slot or anaesthetist, and puts the Booking on the Draft List through Phase 31's
  path, not a second copy.
- **Atomic decisions.** Pre-check then refusable-first: a locked List, a stale suggestion, an invalid
  or missing NHI, a refused pick or a missing wording and code leaves the row open and the schedule
  unchanged. The decision and its Booking-side history row land in one commit. Look for races: the
  clock passing the session, the List being authorised, the Booking cancelled or edited by hand
  between suggestion and apply.
- **One set of rules.** Created Bookings go through `createBooking` (`source: 'hospitalDownload'`,
  `upsertPatient` dedupe, the source text, 21's payer); new Lists through `assignListToSlot`
  (not-preferred warning and acknowledgement, conflicts, pairing); Draft Lists through Phase 31's
  action; the stack through 20a's `procedureStackView`. No second copy of any of them in
  `matchingActions.ts` or the screen.
- **The matcher is pure and deterministic.** No store, React, `Date.now()`, `new Date()` or
  `Math.random()` in `src/domain/intake/`; the fixtures are synthetic, their wording from AR-35, and
  pinned by tests.
- **Future scope stays badged and inert.** The HL7/FHIR entries are bar only and badged; no
  `manualIntervention` value, chip or copy remains; the simulator never says a message "applied";
  no run-sheet beat, Control Panel scenario or capture recipe shows S13 to S15 changing a Booking
  by itself; nothing builds US-02.5.2's automated rule or US-02.2.3's removal detection.
- **Triggers and PWA purity.** The two Matching entries are bar only and scoped to
  `/admin/matching`; the stand-in is PWA only; bodies live in `src/store`; nothing in the PWA closure
  imports `apps/admin`, `apps/demo`, `shell`, `store/officePrivate.ts` or the pairing helper.
- **Design and copy.** The screen follows Admin Review (stats strip, one table, flags as warning
  pills, footer action bar, the authorise choreography); the panel follows the List drawer and uses
  20a's `ProcedureStack` as it is; change types in plain language; teal-only actions; no crimson on
  the badge, pills or banner; no en or em dashes; no "slot", "blacklist" or "DRAFT" for an assigned
  List in app copy, and "import", not "download", on the screen (US-02.1.1); mono tabular figures for
  NHIs, times and ids.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions (the labelled sample files while OQ-13 is open,
  spanning several days where a real list is one day's; OQ-108's default, D51: the hospital import kept
  as the priority pathway and the Surgeon PDFs inbox left alone; a decision on a row for a SUBMITTED
  List applied by the office until AUTHORISED, and a change for an AUTHORISED List refused and left to
  reject or handle off-line, which US-02.5.4 says is not yet decided; the appointment id used only as a
  duplicate key, where US-02.1.3 names date, surgeon, location and session; the S13 message that moves
  a Booking staging only a New row for the new day, the old Booking left for the office to cancel
  (D62; detecting it is US-02.2.3, Future Work); the row's insurer recorded on the Booking by default
  through Phase 21's setter while OQ-93's open parts stand; the "Session has started" flag not built,
  since US-02.5.4 ties the lock to AUTHORISED; the `hospitalSheet` source-text channel added for a
  manual sheet), anything logged rather than fixed (any covered item that left the Future Work lane),
  and the screens worth a look, each with its route and persona (Admin, Matching `/admin/matching` as
  Kirsty W.; the Booking History and stack of a row-created Booking; Mobile Lists Tue 28 Jul AM as Dr
  Souter; Diane Foster's Booking after the update).
- **Status row** for catch-up Phase 33, and a phase entry with:
  - the drift-check result against `d4db277` (items changed or not; OQ-13, OQ-108 and FT-02.1 status; OQ-44, OQ-49, OQ-78, OQ-87 and OQ-99 built as answered, with how the Booking is put on the Draft List; D17 and D28 as
    built; whether 21, 23, 25 and 27 were DONE and which fallbacks were used; US-02.5.1 to US-02.5.4
    still Future Work and not built);
  - what was built, and what was removed (`applyEffect` with 20a's feed wording appends, the park
    codes, `manualIntervention`, `integrationImmutable`, the Phase 28 park-on-no-List seam, `resultBookingId`);
  - the `PERSIST_VERSION` bump (from and to);
  - the seeded Bookings the fixtures name, their wording, and the dates the triggers pick on a fresh
    seed, for the demo guide;
  - tests added (matcher, fixtures, store, the no-silent-apply sweep over every canned message,
    triggers, Playwright);
  - the Catalogue screenshots result: recipes created or changed, the REPORT.md counts (captured,
    partial, absent, failed) before and after, and any partial reason handed to a later phase (US-02.1.5
    to 34; US-02.3.1 to 35; US-02.5.1 to US-02.5.4 as Future Work analogues);
  - the review pass.
- **Decisions log:**
  1. **Supersedes** the 2026-07-24 "Phase 11 message-shape and feed decisions" items (5) and (6) in
     part (the ROADMAP's "hospital auto-apply"): a parsed hospital message no longer creates, moves,
     edits or cancels a Booking, or adds its wording, through an `integration` actor. It stages a row
     on the matching screen and the office applies it (RV-13; US-02.1.5 "No silent apply"; FT-02.1 "no
     automated decisions"). The automated S13 to S15 changes are Future Work (US-02.5.1 to US-02.5.4,
     US-14.6.2) and leave the demo (RV-13). `manualIntervention` and the `integrationImmutable` refusal
     are retired. MSH-10 dedupe, the transient retry and the mapping dead-letter stay, as Future-scope
     tooling, until Phase 34.
  2. Matching suggestions, the unmatched queue and the change type are **derived** at read time from
     the row and the current schedule, never stored; only the incoming fields, office corrections and
     the decision are stored. An update to an already matched Booking is matched and approved like
     any other row (US-02.1.3).
  3. **The match key** is US-02.1.3's: the List by date, surgeon, hospital and session, then the
     patient's NHI. Never by name alone, never by the hospital's appointment id (a duplicate key only),
     never on another day.
  4. A field the hospital did not supply is never a change (OQ-13's "sometimes do not come
     through"). A hospital note is appended, never overwritten. An NHI difference is shown, never
     applied. **The hospital's procedure wording is kept as received**, apart from the rooms', and added
     beside the Procedure's earlier texts (US-02.5.7); it is never corrected and never changes the
     Contract or the RVG code.
  5. A hospital row never sets a Contract or an RVG code (US-04.3.6 Proposed; OQ-78: no default
     Contract; OQ-99, D33: no procedure to match): a created Booking has neither unless the office
     picks them in the panel, and waits on "Needs a Contract" (US-04.3.4). The hospital's insurer and
     approval number are recorded on the Booking as source data through Phase 21's setter (D28) and
     never decide who is billed; who is billed comes from the Contract's holder or the payer on the
     Booking (D17).
  6. "Create a Draft List" from a row creates it with all four of hospital, surgeon, day and session
     and puts the row's Booking on it in the same decision (US-02.1.2's own decision; contents per
     OQ-44 and US-01.6.1); a row never waits on a Draft List.
  7. **A Booking moved to another day is a cancellation plus a new Booking** (D62, OQ-87, US-02.5.2):
     there is no Reschedule change type, no move of a Booking by a row and no link between the two
     rows; a time change within the same List is a Modification. This replaces the Phase 11 behaviour
     that retimed and moved in place. US-02.5.2's automated handling is Future Work and not built.
  8. Every hospital-pathway channel (import, manual sheet, feed message) stamps `source:
     'hospitalDownload'`; the channel lives on the row, on the source text (`hospitalDownload`,
     `hospitalSheet`, `hospitalFeed`) and in the Booking's History.
  9. The samples are labelled fixtures while OQ-13 (how each hospital provides its bookings) is
     open; their wording is AR-35's illustrative wording, not AA's; app copy says "import", per
     US-02.1.1's retitle. The hospital import stays the priority pathway while OQ-108 is open (D51).
  10. A row's surgeon resolves by HPI CPN first, then by name (OQ-52); `createList` and `createDraft`
      need a resolved or office-picked surgeon, and "Create a List in a session" shows Phase 17's
      tier-ordered candidates and soft not-preferred warning (D44).
  11. **A row with no NHI waits in the unmatched queue** and creates no patient, Booking or
      provisional record until the office adds a valid NHI (OQ-49 answered, D11, US-02.1.4).
  12. Approved rows apply as the office until the List is AUTHORISED (US-02.5.4); the integration
      actor writes no Booking, so the `integrationImmutable` branch of `editRefusal` is removed.
- **Handoff notes:**
  - For **34**: `stageImportRows` is the entry point a sync or a delivered sheet calls; there is no
    sync state to add (US-02.1.5 dropped it); the button is "Import hospital bookings" and
    `importHospitalDownload` keeps its name; the bar triggers are `matching-receive-theatre-list` and
    `matching-send-update` (the old send-unmatched and reschedule entries are gone); demote the
    simulator and hide the monitor's Future tabs; rebuild S1 from this phase's Beat 1, around the sync,
    the match, the wording as received and the office's Contract choice.
  - For **35**: the on-demand update email (D19, manual only) picks changes from the Booking's change
    history, and a decided row's `booking.fromHospitalRow` entry (with `fieldsApplied`) is one of the
    changes it can pick, sent to the surgeon's rooms or the hospital from the per-kind template
    (US-02.3.4). Adding a Booking to a booked List by hand reuses 20a's "as given". Concurrent edits
    (US-02.5.6) are Future Work.
  - For **40**: register the unpaid-balance alert (US-11.3.2: mild under, strong over the threshold
    counted from the invoice date, mild for a credit balance, always waved through; D24) as a Phase
    15a warning rule and show it in the row panel at create and match; NHI attach and merge replace
    the "NHI differs" dead end; rows waiting for an NHI (`waitingForNhi`, derived by the matcher) are
    the office's view to build; the NHI is required on every other form and the provisional patient
    path goes (OQ-49, D11).
  - For **41**: a hospital row never moves a Booking (D62), so the payee repoint has no hook here; a
    Cancellation row calls `cancelBooking`, which is where a prepaid refund hangs.
  - For **42 and 43**: the samples are not master data; 43's restricted raw-row view can read
    `ImportRow.incoming`, and its generator, if it makes import rows, builds them through
    `stageImportRows` with AR-35-style wording and a valid NHI.
  - For **44**: S1 Beats 1 and 2, S4 Beat 4 and S5 Beat 2 were patched, not rewritten; keep S13 to
    S15 out of the rewrite (RV-13); the PWA parity audit should walk S1 and the Foster wording beat on
    a handset with the stand-in.
