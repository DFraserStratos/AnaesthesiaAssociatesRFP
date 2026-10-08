# Phase 33 · Hospital download and the matching screen

**Requirements covered:**
[EP-02](../../../../requirements-board/requirements/stories/EP-02.md) Booking intake and change handling (Partial: the hospital-download source and "applied with its source recorded: a new Booking goes onto its List, and an update edits the existing Booking"; Confirmed) ·
[FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md) Hospital booking download and matching screen (Verify, Contradicts; its 2026-10-07 note: **no automated decisions in the first version**, downloads land in the matching and creating screen, staff see the patient details and what is missing, then save a Draft List or assign an anaesthetist; automated approvals come once the matching is trusted) ·
[US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md) Import hospital bookings (Confirmed, Partial: the system imports hospital bookings "however each hospital provides them", not a file or a download) ·
[US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) Match rows to Lists and Bookings (Confirmed, Contradicts; **changed 2026-10-08**: each row shows its procedure text exactly as received, a new acceptance criterion; the Draft List is its own decision) ·
[US-02.1.3](../../../../requirements-board/requirements/stories/US-02.1.3.md) Show differences on match (Confirmed, Contradicts; **changed 2026-10-07**: a later update for an already matched Booking arrives in the same screen, **matched by date, surgeon, location and session**, and the admin approves it) ·
[US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) Unmatched queue (Confirmed, Partial) ·
[FT-02.5](../../../../requirements-board/requirements/stories/FT-02.5.md) Change types and audit (Confirmed, Partial: every inbound change classified before it is applied, then applied with source and history; here the office applies it) ·
[DM-34](../analysis/domain-model-delta.md#dm-34) Intake: import rows, each showing its text as received, admin match/create/reject decisions, later updates shown as differences for approval, the unmatched queue (the row, decision and queue half; bringing the two hospitals' rows in is Phase 34, with no sync state now that US-02.1.5 dropped it) ·
[RV-13](../analysis/reverse-check.md#rv-13-hospital-messages-create-and-change-bookings-with-no-admin-matching-step) Hospital messages create and change Bookings with no admin matching step (Rework) ·
[RV-28](../analysis/reverse-check.md#rv-28-automated-modification-reschedule-and-cancellation-from-hospital-messages-is-shown-working-and-with-the-wrong-clash-rule) Automated modification, reschedule and cancellation from hospital messages is shown working (Hide from demo: the canned S13 to S15 messages stage rows and never apply themselves, and stay out of the scripted demo).
Also touches, without closing:
[US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) (Proposed; its only criterion is "No silent apply", met here for every row that arrives; bringing St George's and Southern Cross rows in without a hand import is Phase 34),
[US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) and [DM-51](../analysis/domain-model-delta.md#dm-51) (Phase 20a's source wording: every row decision that creates or changes a Booking writes the row's wording through 20a's `addSourceText` or `createBooking`'s source text, verbatim, added beside what the Procedure already holds, never overwriting it),
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) (Phase 20a's three-part stack; this phase puts it on the matching screen, which completes 20a's partial recipe),
[US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) (the "matched" half: "Admins apply the Contract to each Procedure at booking setup, when the Booking is created or matched"; the office may pick the procedure and Contract in the row panel, and a created Booking without a Contract waits on Phase 20's "Needs a Contract" list),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (No contract (RVG) first; "There are no hospital, insurer or procedure default Contracts, and nothing is derived from the List's location", so a row's hospital never sets a Contract),
[US-02.5.1](../../../../requirements-board/requirements/stories/US-02.5.1.md), [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md), [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md), [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) and [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md) (Future Work: the **automated** path, a change from an integration applied with no admin deciding it, with [US-14.6.2](../../../../requirements-board/requirements/stories/US-14.6.2.md). This phase builds none of it. The office-decided Modification, Reschedule and Cancellation on the matching screen are US-02.1.2, US-02.1.3 and FT-02.5's; their capture recipes become partial analogues, see Catalogue screenshots),
[US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md) (Matches; "every entry records its source": a decided row's History line names the office who applied it and the hospital row it came from),
[US-01.6.1](../../../../requirements-board/requirements/stories/US-01.6.1.md) (Confirmed, the four attributes required: a Draft List created from a hospital row, with hospital, surgeon, day and session, holding the row's Booking; the Draft List itself is Phase 31),
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) (the payer on the Booking, Phase 21's: a Booking created from a row gets the patient as payer like any other; a row never names a guardian or a billable party),
[US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md) (the unpaid-balance alert "at Booking create or match": mild under and strong over the threshold counted from the invoice date, mild for a credit balance (D24), never a block; Phase 40 registers it as a rule in Phase 15a's warning routine and shows it on this screen),
[DM-03](../analysis/domain-model-delta.md#dm-03) (a Draft List can hold Bookings; "a matching-screen row can create one"),
[DM-12](../analysis/domain-model-delta.md#dm-12) (the insurance indication on the Booking, OQ-93's default D28, Phase 21's: a row's insurer is shown and offered to the office as the indication, applied only when the office ticks it; it never decides who is billed),
[RV-05](../analysis/reverse-check.md#rv-05-admin-integrations-monitor-presents-future-reliability-tooling-dead-letter-queue-retries-per-hospital-mapping-as-product) and [RV-06](../analysis/reverse-check.md#rv-06-hl7-to-fhir-simulator-live-drip-and-scenario-s1-built-on-them) (the HL7/FHIR tooling keeps Phase 14's Future-scope badges; Phase 34 demotes it).
**Changed by the 2026-10-08 update (catalogue `60e2d1e`):** the match key for a later update is the
List's date, surgeon, location and session, then the patient, not the hospital's appointment id
(US-02.1.3, AR-21 `look-for-match`); every row shows its procedure wording as received and the
Bookings it creates or changes keep that wording (US-02.1.2, US-02.5.7, Phase 20a), so a hospital's
procedure text is now **added beside** the Procedure's wording instead of editing the procedure; a
created Booking carries **no default Contract** (OQ-78 answered, US-04.3.3): the office picks the
procedure and Contract in the panel or later from Phase 20's "Needs a Contract" list, and the
procedure may be left blank (OQ-99, D33); the row's insurer becomes an offered insurance indication
(D28) rather than display-only text (D2 superseded); FT-02.1's "no automated decisions" note; the List
states are DRAFT (a Draft List), ACTIVE, SUBMITTED and AUTHORISED (15b, 31); "blacklist" is now
Phase 17's private not-preferred pairing with a tier-ordered picker (D44); a move re-checks no
prepayment (D20). The phase now depends on 20a.
**Open questions:** [OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md) (how each hospital provides its bookings, their fields and cadence; still Open at `60e2d1e`, with the integration team. Its 2026-10-07 update: the format is still not known; the first version has no automated intake; a later update for the same booking is matched by "the date, the surgeon, the location, the slot" and staff "just say approve update". The 2026-10-01 meeting added that two HL7 hospitals may not send the same shape and that the download is not comprehensive, so the theatre list is still needed for the insurer or Contract). [OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md) (Open, owner decision D33: a Booking set up without a matched procedure; built as its default, below). [OQ-93](../../../../requirements-board/requirements/questions/OQ-93.md) (Open, D28: the insurance indication on the Booking; Phase 21 builds its default, this phase only offers a row's insurer to it). [OQ-49](../../../../requirements-board/requirements/questions/OQ-49.md) (Open, D11, leaning to a mandatory NHI; Phase 40's rule: this phase shows a "No NHI supplied" pill and never blocks on it). [OQ-87](../../../../requirements-board/requirements/questions/OQ-87.md) (the automated reschedule rules, Open) belongs to US-02.5.2's Future Work and is not built. AR-21's region `open-after-submit` ("Not yet decided: a change arriving after submission") is undecided: this phase keeps the domain model's rule (the office may apply until AUTHORISED, flagged "List submitted") and logs it. [OQ-34](../../../../requirements-board/requirements/questions/OQ-34.md) is Answered (the hospital download carries the most bookings) and is why this screen is the priority pathway.
**Answered and built as answered:** [OQ-44](../../../../requirements-board/requirements/questions/OQ-44.md) (a Draft List is a List with no anaesthetist; hospital, surgeon, day and session are all required, which US-01.6.1 confirms; Bookings can be added before an anaesthetist is assigned; an unfilled one is removed or re-dated, US-01.6.4; only the office assigns it, OQ-86 and D46). US-02.1.2 lists "create a Draft List when nobody is assigned yet" as one of the row decisions and FT-02.1's note names it, so it is built with OQ-44's contents rule: "Create a Draft List" saves all four fields and puts the row's Booking on the new Draft List in the same decision. [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (Answered 2026-10-08: No contract (RVG) is the one default, offered first for every procedure; no hospital, insurer or procedure default Contracts), so a created Booking has no Contract until the office picks one. [OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) and D17 as superseded 2026-10-08 (the Contract bills its holder, or the payer named on the Booking), so a row never sets a billable party or a payer. [OQ-55](../../../../requirements-board/requirements/questions/OQ-55.md) and D2 as superseded 2026-10-08 (an insurance indication on the Booking guides the Contract and never decides who is billed; D28). [OQ-52](../../../../requirements-board/requirements/questions/OQ-52.md) (the HPI CPN is the surgeon's unique index), so a row's surgeon resolves by HPI CPN first, then by name. [OQ-43](../../../../requirements-board/requirements/questions/OQ-43.md) (D44: private two-way pairing preferences; the office gets a soft not-preferred warning when it assigns a List, never a block), which "Create a List in a session" shows like every office pairing path.
**Depends on:** Phase 20a (source wording: `Procedure.sourceTexts`, `SourceText`, `SourceTextChannel`, `addSourceText`, `createBooking`'s `sourceText` input and its "Choose the procedure, or type it as given." refusal, `procedureStackView` and `ProcedureStack` in `domain/billing/procedureStack.ts` and `shared/booking/`, and its re-pointed "Fire hospital message" on the Booking routes) and Phase 31 (Draft Lists with the four required fields that hold Bookings, `createDraftList(..., 'hospitalRow')`, `pairingIssues` and Phase 30's conflict raising on every path). Through them: Phase 20 (one Contract per Procedure: `createBooking`'s optional Contract pick, `contractCandidatesFor` and its selectors, `ContractPickerSheet` with No contract (RVG) first, `setProcedureContract`, `needsContractBookings` and the "Needs a Contract" card; no billing route and no Procedure `insurerId`), Phase 19 (`ProcedurePickerSheet`, the two tabs, `pickProcedure`, each RVG group's general procedure), Phases 19a and 19b (the starting-units resolver and the locked modifiers, refreshed by 20's actions), Phase 18 (holders, the AA code, the one stored No contract (RVG)), Phase 17 (the surgeon master with `hpiId`, the HPI CPN; `rankAnaesthetistCandidates`, `AnaesthetistCandidates`, `NotPreferredWarning` and the acknowledgement on the office write paths), Phase 15a (the warning routine), Phase 15b (ACTIVE for an assigned List), Phase 14 (built: the registry, `useDemoTriggerContext`, `OFFICE_SIMULATION_ACTOR` in `store/demoActors.ts`, `store/officeStandIn.ts`, the PWA demo sheet and the Future-scope badges), Phase 15 (built: Booking vocabulary and `Booking.source`, whose `hospitalDownload` value the HL7/FHIR path stamps as an interim "until Phase 33", `integrationActions.ts` :161) and Phase 28 (Slots, `assignListToSlot`, `placeListOnSlot`, `slotFor`/`listInSlot`, and the S12/S13 park-on-no-List seam, which this phase replaces, with Phase 31's interim `pairingIncomplete` park if 31 left one). **Not guaranteed before 33** (outside its dependency chain, though normally done first by number): Phase 21 (the payer on the Booking, `setInsuranceIndication`), Phase 23 (the primary Procedure), Phase 25 (the AUTHORISED lock) and Phase 27 (the prepayment re-check on a change of Procedures, Contract or payer). Where a work item names them, use them if DONE; otherwise the row's wording goes on the Booking's first Procedure, the insurer stays display only, and the AUTHORISED refusal is today's `editRefusal` `listAuthorised`. Record which in the drift-check result. First phase of the Intake track; 34 and 35 build on it.
**Estimated:** 2 sessions. Session 1 is the model, the pure matcher, the fixtures, the store actions and the HL7/FHIR re-route, re-greened (work items 1 to 9): after it the demo still works, because the Integrations monitor shows each message as "Sent to matching", and a temporary check in `demoScenarios.test.ts` drives S1 through the store. Session 2 is the Admin matching screen with the procedure stack, the triggers and PWA stand-in, Playwright, capture recipes and the demo guide (work items 10 to 17).

## Goal

Today a hospital booking reaches the schedule only as a simulated HL7 v2 or FHIR message, and
`processMessage` applies it at once: it creates, moves, edits and cancels Bookings as an
`integration` actor, finds the Booking by the hospital's appointment id, and parks only what it
cannot apply (RV-13). The canned S13, S14 and S15 messages show automated reschedules, modifications
and cancellations working, which the catalogue puts in Future Work (US-02.5.1 to US-02.5.4,
US-14.6.2; RV-28). There is no hospital import, no matching screen, no field diff and no way for the
office to say "not this one". The catalogue reverses that. Importing hospital bookings is the
priority pathway (OQ-34); the first version makes **no automated decisions** (FT-02.1); every row
gets an admin decision and shows its procedure text exactly as received (US-02.1.2); a later update
to an already matched Booking arrives in the same screen, matched by date, surgeon, location and
session, and waits for the admin to approve it with its differences shown (US-02.1.3); and nothing
reaches a Booking until an admin decides (US-02.1.5 "No silent apply"). AR-21 (the Booking/List
update diagram) is the picture: regions `matching-screen`, `rows-wait`, `look-for-match`,
`match-found`, `review-differences`, `create-booking`, `apply-change` and `record-change`.

This phase:

- adds a staged **intake model**: an `ImportBatch` (one hospital import, one manual sheet, or one
  feed message) holding `ImportRow`s, each carrying the hospital's incoming fields (its procedure
  wording verbatim among them), its status (open, applied, rejected) and, once decided, the admin's
  **decision**: match to a Booking and apply, create a Booking on a List, create a List in an
  anaesthetist's session, create a Draft List that holds the row's Booking (its contents per OQ-44),
  or reject;
- adds one **pure matcher** (`src/domain/intake/`) that, for each open row, finds the List by the
  row's **date, surgeon, hospital and session** and then the Booking on it by the **patient** (NHI
  first), classifies the change in plain language (**New, Modification, Reschedule, Cancellation**,
  or **No change**; FT-02.5), lists the **field-level differences** (US-02.1.3), and suggests a
  decision. A reschedule, which by definition changes the date or session, is found by the same
  patient on another of that hospital's Bookings, or by the hospital's appointment id when it sends
  one (OQ-13). Suggestions are derived at read time and never stored, so they never go stale. A row
  the matcher cannot place is **unmatched** and stays in the unmatched queue until someone decides
  (US-02.1.4). The admin can also search for the Booking by hand (AR-21 `look-for-match`);
- adds an Admin **Matching** screen in the Admin Review pattern, with a product **Import hospital
  bookings** control (US-02.1.1's title) whose picker offers four labelled samples (St George's, a
  later St George's update, Southern Cross and a manual sheet from Forte Health) while how each
  hospital provides its bookings is still open (OQ-13). Every row shows its **procedure text as
  received** in the table, and the row panel shows each Procedure as **Phase 20a's three-part
  stack** (as received, procedure and RVG code, Contract);
- applies a decision only through the existing guarded write paths, as the office actor, with the
  Booking's source (`hospitalDownload`) and a Booking-side history row naming the hospital row, so
  "applied with its source and history recorded" (FT-02.5, EP-02) is visible on the Booking;
- **keeps the wording as received**: a created Booking's Procedure starts with the row's wording
  through `createBooking`'s `sourceText`; a matched row with wording the Procedure does not already
  hold **adds it beside** the earlier texts through `addSourceText` (US-02.5.7: never edited, never
  overwritten). The hospital's wording never changes the Procedure's procedure pick or its Contract;
- **sets no Contract and no procedure by itself**: a created Booking carries no Contract (OQ-78: no
  hospital default, nothing derived from the location) and, unless the office picks one, no
  procedure (OQ-99's default, D33). The row panel offers the office Phase 19's two-tab procedure
  picker and Phase 20's Contract picker (No contract (RVG) first) as part of the decision, both
  optional; a Booking left without a Contract, or with its procedure blank, lands on Phase 20's
  "Needs a Contract" list (US-04.3.4). The hospital's insurer is shown beside the Contract and, if
  Phase 21 built the insurance indication (D28), offered as a tickable difference;
- widens what a Modification row can change to patient (name, date of birth), the procedure wording
  (added beside) and, by the office's pick, the procedure and Contract, as well as time and note
  (US-02.1.3: "time, patient or procedure"), and appends a hospital note instead of overwriting the
  Booking's own notes;
- lets the admin match a Reschedule row onto any List at the row's hospital, date, session and
  surgeon, including another anaesthetist's, and **parks** a reschedule to a date with no List as
  unmatched rather than silently retiming it in place (US-02.1.4: nothing is dropped); the admin
  resolves it by creating a List in an anaesthetist's session or a Draft List there, and the Booking
  moves onto it. US-02.5.2's automated rule (a clash accepted and turned into a Draft List with no
  admin) is Future Work and not built;
- re-routes the HL7/FHIR simulator: a parsed message, the canned S13 to S15 included, now lands as a
  row on the matching screen and applies nothing (RV-13, RV-28), and `manualIntervention` is
  retired because every applicable message now waits for a decision. Retry, dedupe and dead-letter
  stay as they are, under Phase 14's Future-scope badge, until Phase 34 demotes them. No scripted
  beat fires S13 to S15. Phase 20a's wording beat on Diane Foster's Booking (MSG-STG-1012 adding the
  hospital's fuller wording) now goes through the matching screen;
- registers the demo triggers: three harness-bar entries on the Matching screen ("Send unmatched
  row", "Send update for a matched Booking" and "Reschedule to a date with no List") and a PWA-only
  office stand-in on Mobile Lists and the Booking screen ("Hospital row arrives and the office
  matches it") so S1 and the wording beat still run on a handset.

This phase builds **no pricing structure**. It reads Contract candidates, the procedure pick and the
stack only through Phase 19, 20 and 20a's modules in `aa-prototype/src/domain/billing` (the draft
technical design [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) at
`contract-selection` and `billable-party`, its ERD
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) at `booking-procedure`, and the
plain-language guide [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md)), never a
second copy, so a later change to the draft pricing design (a v5 may follow) stays out of this
phase's files.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot, catalogue commit
   `60e2d1e` (rename-aware; never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff EP-02,FT-02.1,US-02.1.1,US-02.1.2,US-02.1.3,US-02.1.4,US-02.1.5,FT-02.5,US-02.5.1,US-02.5.2,US-02.5.3,US-02.5.4,US-02.5.5,US-02.5.6,US-02.5.7,US-03.1.9,US-14.6.2,US-01.6.1,US-01.6.4,US-04.3.3,US-04.3.4,US-04.3.6,US-11.2.2,US-11.3.2,OQ-13,OQ-34,OQ-44,OQ-49,OQ-52,OQ-55,OQ-67,OQ-78,OQ-87,OQ-93,OQ-99
   ```

   At plan time (2026-10-08, `3d3a18c..60e2d1e`) the changes that touch this phase were: US-02.1.2
   gained "each row shows its procedure text exactly as received" (with its acceptance criterion);
   US-02.1.3 now matches a later update by date, surgeon, location and session, and the admin
   approves it; FT-02.1 gained the "no automated decisions" note; US-02.5.7 (source wording) is new
   and Confirmed; US-04.3.3 now says there are no hospital, insurer or procedure default Contracts
   (OQ-78 answered); US-04.3.4 sets the Contract "when the Booking is created or matched" and notes
   OQ-99; OQ-13 recorded the 2026-10-07 meeting; OQ-99 and OQ-93 are new and Open; EP-02, US-02.1.1,
   US-02.1.4 and US-02.1.5 changed only in links and artifacts. If an item changed after `60e2d1e`,
   re-read it and adjust the work items before planning. If any covered item is now Retired or
   Future, drop it from this phase and say so in the PROGRESS entry. Dropping US-02.1.2 or FT-02.1
   drops the screen; the RV-13 re-route (no silent apply) still stands while US-02.1.5 or US-02.1.3
   says a hospital change goes through the admin's review. If acceptance criteria have been added to
   any covered story, map each to a work item (at `60e2d1e` US-02.1.2's "procedure text exactly as
   sent", US-02.1.5's "No silent apply", US-02.5.7's three, US-01.6.1's four, US-01.6.4 and
   US-11.3.2, which is Phase 40's, have them; the criteria on US-02.5.1 to US-02.5.4 are for the
   automated path, Future Work, and are not built). A new intake item on the same screen (for example
   bulk apply) comes in only if it is small; otherwise note it for Phase 34 or 44. If US-02.5.1 to
   US-02.5.4 or US-14.6.2 (automated application) have left the Future Work lane, or US-04.3.6 (the
   hospital sets the Contract) has, keep this doc's rule (every row waits for an admin decision and
   never sets a Contract or a procedure by itself), build the rest, and put it on the "For the
   owner's review" list.
2. **OQ-13 (how each hospital provides its bookings).** Still Open at `60e2d1e`, with the integration
   team (US-02.1.1's note). Build what this doc describes: the four samples are **labelled
   fixtures** (a "Sample file" badge in the picker and on each batch, and one line on the screen:
   "Sample files stand in for each hospital's bookings while the integration team confirms how each
   hospital provides them."). App copy says "import" and "hospital bookings", not "download"
   (US-02.1.1 was retitled because FHIR is a REST interface, not a file). The incoming row carries a
   superset of the plausible fields, and **every field except hospital, date, session and patient
   name is optional**, because OQ-13 records that Contract and patient details sometimes do not come
   through and that the download is not comprehensive; whether a hospital sends an appointment id at
   all is not known, which is why it is never the main match key. A field the hospital did not supply
   is shown as "Not supplied" and is **never** a change: it can never blank a Booking field. If
   OQ-13 has since been answered, reshape the fixtures and `IncomingBookingFields` to the answer's
   field list (keep the optional-field rule unless the answer says otherwise), drop the interim line,
   and record the answer in the Decisions log. Cadence belongs to Phase 34.
3. **FT-02.1 (Verify) and "no automated decisions".** Still Verify at `60e2d1e`; its 2026-10-07 note
   says the first version has no automated decisions and automated approvals come once the matching
   is trusted. If it is now Confirmed, drop the Verify note from the PROGRESS entry. On US-02.1.2
   Greg challenged the manual step and Donald kept an import gate for the first release ("Okay"); on
   US-02.1.3 an update to an already matched Booking still goes through the manual approval. If
   FT-02.1 has been reshaped so matching becomes partly automatic, keep the admin decision on every
   row and log it for the owner's review.
4. **US-02.1.3's match key.** At `60e2d1e` a later update is matched by "the date, the surgeon, the
   location, the slot" (OQ-13's 2026-10-07 update; AR-21 `look-for-match` adds the patient's NHI and
   that the admin can also search by hand). Build the matcher as work item 2 says: the List by those
   four, then the patient on it; the appointment id only as a reschedule fallback and the duplicate
   key. If the catalogue has since named a different key, change only `findMatch` and its tests.
5. **OQ-44 (Draft List contents), Answered.** Build the answer: "Create a Draft List" creates the
   Draft List with hospital, surgeon, day and session (all four required; US-01.6.1) and puts the
   row's Booking on it in the same decision (a New row's Booking is created there; a Reschedule row's
   Booking is moved there). The row is then applied; nothing waits on the Draft List. If US-02.1.2
   has dropped that decision, drop Create a Draft List from the panel and log it; if OQ-44 has been
   reopened, build it as this doc says and log it.
6. **OQ-99 (a Booking set up without a matched procedure), Open: build D33's default.** The office
   may leave the procedure blank when it creates a Booking from a row, or pick a group's general
   procedure from the RVG codes tab; the Contract is chosen by holder or No contract (RVG), or left
   for later; a procedure is required before the anaesthetist can mark the Booking complete (Phase
   21's completion block, not this phase's); Bookings with a blank procedure show on the office's
   "Needs a Contract" list (Phase 20's "Procedure to choose" reason). Phase 20's picker already
   carries D33's one provisional caption; add no other label. Log it on the "For the owner's review"
   list. If OQ-99 has been answered, build the answer and record it.
7. **No default Contract (OQ-78, answered).** Confirm Phase 20 left no `defaultContractForBooking`,
   no `contractSetBy` and no hospital or insurer default Contract: `createBooking` with no Contract
   pick leaves the Procedure without one and the Booking appears on `needsContractBookings`. If any
   default survived, stop and record it; this phase never adds one.
8. **Automated application stays out (RV-28).** At `60e2d1e` US-02.5.1 to US-02.5.4 and US-02.5.6
   sit in the Future Work swimlane as the automated path: a modification, reschedule or cancellation
   from an integration applied with no admin deciding it, a reschedule clash accepted as a Draft
   List (US-02.5.2, its open rules in OQ-87), and the lock on a submitted List. Build none of it.
   Every hospital row, the canned S13 to S15 messages included, waits for the admin's decision, and
   no scripted beat fires S13 to S15. The office-decided equivalents on the matching screen are
   US-02.1.2, US-02.1.3 and FT-02.5's.
9. **Baseline.** Confirm Phases 15a, 15b, 17, 18, 19, 19a, 19b, 20, 20a, 28, 30 and 31 are DONE in
   PROGRESS.md (14 and 15 are built), and note whether 21, 23, 25 and 27 are (they are outside the
   dependency chain; see Depends on). Then read what they left, because this doc names planned
   names, which those phases may have changed (use the names their entries record):
   - Phase 15 (built; Phase 15b then removed Copy, so `'copy'` is gone from `BookingSource`):
     `createBooking` and `CreateBookingInput` (with the required `source`),
     `editBooking`/`BookingPatch`, `cancelBooking`, `reassignBooking`, `findBookingByCorrelation`,
     `bookingsOnListByNhi`, `bookingsForList`, `BOOKING_SOURCE_LABELS` (in `shared/format.ts`), and
     the Booking detail route `/admin/day/:dateISO/bookings/:bookingId`.
   - Phase 20a: `Procedure.sourceTexts`, `SourceText`, `SourceTextChannel` and
     `SOURCE_TEXT_CHANNEL_LABELS`, `addSourceText` (verbatim, append-only, an identical text adds
     nothing, `added: false`), `createBooking`'s `sourceText` input and its refusal with neither a
     procedure nor a text, `procedureStackView` and `ProcedureStackView`, `ProcedureStack` (full and
     compact density, `data-shot="procedure-stack"`), the re-pointed "Fire hospital message" (Booking
     routes, defaulting MSG-STG-1012 on Diane Foster's Booking) and what 20a did to the S12, S13 and
     S14 apply paths (which this phase removes), and the AR-35 wording it seeded (MSG-STG-1001's
     `lap appy ?conv to open`, Foster's `WLE MM`).
   - Phase 20: `createBooking`'s optional Contract pick, `contractCandidatesFor`,
     `contractCandidatesForProcedure`, `contractCandidatesForNewBooking`, `ContractPickerSheet`
     (No contract (RVG) first, holder headings, composite search, the RVG codes route),
     `setProcedureContract(api, actor, procedureId, { contractId, lineId? })` and its refusals
     (`contractNotInEffect`, `contractOutOfScope`), `needsContractBookings` and the Admin Day "Needs a
     Contract" card. Confirm no Procedure `insurerId` or billing route remains.
   - Phase 19: `ProcedurePickerSheet` (the two tabs), `pickProcedure`, `Procedure.procedureTypeId`
     (optional per D33), the general procedure per RVG group.
   - Phase 15a: the warning routine in `src/domain/warnings` (`WARNING_RULES`) and the
     `store/warnings.ts` selectors (`warningsForBooking`, `warningsForList`), so the Booking a
     decision creates or changes shows its warnings with no extra code here.
   - Phase 23 if DONE: the primary Procedure, the target of a row's wording and of a procedure or
     Contract pick on a matched Booking (else the Booking's first Procedure).
   - Phase 21 if DONE: `Booking.payer` (a created Booking gets `{ kind: 'patient' }` through
     `createBooking`), `Booking.insuranceIndication`, `setInsuranceIndication(api, actor, bookingId,
     { insurerId, source: 'intake' })` and its `suggestedHolderIds` for the Contract picker.
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
     List (`createBooking` and `reassignBooking` onto it), `assignDraftList`, `redateDraftList`,
     `removeDraftList` (US-01.6.4), and `pairingIssues`.
   - Phase 31's interim `pairingIncomplete` park in `integrationActions.ts` (S12, S13), if 31 left
     one, which goes with the Phase 28 park rule in work item 6.
   - Phase 14 (built): `DemoTrigger` (`choices`, `when`, `badge`), `DemoContextValues`, the re-homed
     `fire-hospital-message` and `replay-hospital-message` entries (`shared/demoTriggers/registry.ts`
     :450 and :475 at `60e2d1e`, before 20a re-pointed the first) and their routes and surfaces,
     `src/store/demoActors.ts` (`OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`), `src/store/officeStandIn.ts`,
     `src/pwa/PwaDemoActions.tsx` and `DemoBadge`'s `tone` prop.
   - Phase 25 if DONE: `editRefusal` after the lock (office on ACTIVE and SUBMITTED, nobody on
     AUTHORISED). At `60e2d1e` `editRefusal` (`store/lifecycle.ts` :48) already refuses
     `listAuthorised`, so the rule holds either way.
   - Run `grep -rn "processMessage\|applyEffect\|manualIntervention\|resultBookingId\|noTargetList\|pairingIncomplete\|addSourceText" aa-prototype/src aa-prototype/visual requirements-board/capture/recipes`
     to see every consumer of the auto-apply path after 15a to 32a, including the wording appends
     20a added to it.
   - Read the current `PERSIST_VERSION` in `src/store/appStore.ts` (16 at `60e2d1e`, after Phase 15a
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
  Rejected; pills at radius 999; Spline Sans Mono with tabular-nums for NHIs, times, dates, ids and
  the procedure wording as received (quoted, as Phase 20a's stack shows it).
- Teal `#0D6E63` is the only action colour ("Import hospital bookings", the Apply button, "Choose
  procedure", "Choose Contract"). Crimson stays identity only: the new side-nav item's active state
  follows the existing items, and its badge is amber (`badgeTone: 'warn'`) like Integrations, never
  crimson.

**Catalogue:** the covered items above; AR-21 (`requirements-board/requirements/artifacts/AR-21.md`,
the Booking/List update diagram) at regions `matching-screen`, `rows-wait`, `look-for-match` (the
proposed match on surgeon, hospital, day and session, and the patient's NHI; search by hand),
`match-found`, `review-differences` (changed fields highlighted; approve or reject), `create-booking`
(existing List, new List, Draft List or reject), `new-booking`, `apply-change`, `record-change`,
`matching-notes`, `another-change` (later changes loop back through the matching screen),
`list-submitted` (the diagram's "no changes once the anaesthetist submits the List", which describes
the automated path; this phase keeps the domain model's office rule up to AUTHORISED and logs it) and
`open-after-submit` (undecided); AR-35's note
(`requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md`, its
"Illustrative source wording" heading: AI-made wording, not from AA; AR-35 declares no regions, so
cite the heading by name and never edit the artifact), from which the sample rows' wording comes;
`domain-model.md` section 1 (the "Hospital HL7 integrations exist but are unreliable" row: manual
matching review, St George's and Southern Cross only, HL7/FHIR Future; its sync-cadence wording
predates US-02.1.5's trim, which wins), "Booking" (sources; each Procedure keeps the source wording;
mutable from all sources until SUBMITTED, office-only until AUTHORISED, then immutable; append-only
history), "Slot, List and Draft List" (a Draft List holds Bookings before assignment; the List states
DRAFT, ACTIVE, SUBMITTED, AUTHORISED), the Contract section (the Contract decides who is billed;
No contract (RVG) the one default) and the glossary's "Matching screen" and "Source wording". EP-02's
technical discussion: every change is validated against the internal data model rather than the
incoming message. US-14.6.2 (Future Work): automatic matching and routine updates, the later state
this screen leads to. AI-assisted matching was floated at the 2026-10-07 client meeting with no
decision; it is not built.

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 8 ("Intake becomes a matching screen"),
  the "Structural first" line for DM-02 then DM-03 (Draft Lists, which this phase creates), the
  "Remove or rework" line for automatic apply (US-02.1.5, DM-34), the "Hide or badge" line (the
  automated S13 to S15, RV-28), the RV-13, RV-28 and RV-05/RV-06 rows, "Demo impact" (S1 Beat 1
  waits for a match decision; S4 Beat 4 needs rethinking once auto-apply goes), the "Intake and
  drafts" line of "Demo-trigger buttons", the OQ-13 line under "Uncertainty", and the EP-02 table
  with its structural note (US-02.1.2 and US-02.1.3 Contradicts; US-02.5.7 Contradicts, built by
  20a);
- `docs/prototype-build/catch-up/epics/EP-02.md` (#ep-02, #ft-02.1, #us-02.1.1 to #us-02.1.5,
  #ft-02.5, #us-02.5.7);
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (#dm-34; also DM-02, DM-03, DM-12,
  DM-39 and DM-51, which this phase builds on);
- `docs/prototype-build/catch-up/analysis/reverse-check.md` (RV-13 and RV-28; RV-05 and RV-06 for
  what stays badged);
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
- Outside the app: `requirements-board/capture/recipes/US-02.1.1.json`, `US-02.1.2.json`,
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
   - `IncomingBookingFields` (what the hospital sent; every field optional except the four marked):

     ```ts
     interface IncomingBookingFields {
       hospitalId: HospitalId                       // required
       dateISO: IsoDate                             // required
       session: Session                             // required
       externalRef?: string                         // the hospital's appointment id, when it sends one (OQ-13): a reschedule fallback and the duplicate key, never the main match key
       surgeon?: { name: string; hpiId?: string }   // hpiId: the HPI CPN (OQ-52), matched first
       scheduledTime?: WallTime
       patient: { name: string; nhi?: string; dobISO?: IsoDate; ethnicityCode?: string } // name required
       procedure?: { text?: string; code?: string } // text: the wording exactly as sent, never trimmed (US-02.1.2, US-02.5.7); code: the hospital's own code as sent, shown, never mapped
       insurer?: { text: string; insurerId?: InsurerId } // as sent; shown, and offered as the insurance indication (D28) only when ticked; never a Contract or a billable party
       note?: string
       hospitalStatus: 'booked' | 'cancelled'       // default 'booked'
       cancelReason?: string
     }
     ```

     A row never names a procedure pick, a Contract, a payer or a billable party: the hospital does
     not set the Contract (US-04.3.6 is Future Work), there is no default (OQ-78), and the Contract
     decides who is billed through its holder or the payer on the Booking (D17). When the
     `insurer` text names a seeded insurer, the fixture sets `insurerId` so the panel can show "Held
     by nib" against it (nib is the seeded insurer `I-NIB`).

   - `ImportDecision`, a discriminated union recorded once a row is decided:

     ```ts
     type OfficePicks = { procedureTypeId?: ProcedureTypeId; contract?: { contractId: ContractId; lineId?: ContractLineId } }
     type ImportDecision =
       | { kind: 'match'; bookingId: BookingId; changeType: ChangeType; fieldsApplied: IncomingFieldKey[]; picks?: OfficePicks }
       | { kind: 'createBooking'; listId: ListId; bookingId: BookingId; picks?: OfficePicks }
       | { kind: 'createList'; slotId: SlotId; listId: ListId; bookingId: BookingId; picks?: OfficePicks }
       | { kind: 'createDraft'; listId: ListId; bookingId: BookingId; picks?: OfficePicks }   // a Draft List is a List (Phase 31)
       | { kind: 'reject'; reason: string }
     ```

     Use the type names 19 and 20 actually left for the procedure-list id, the Contract line id and
     the pick. `bookingId` on `createList` and `createDraft` is the Booking created (a New row) or
     moved (a Reschedule row) onto the new List or Draft List: a Draft List holds Bookings (OQ-44),
     so neither decision leaves the row waiting. `picks` holds only what the office chose in the
     panel (the procedure from the two tabs, the Contract from Phase 20's picker); it is never
     derived from the row.

   - `ChangeType = 'new' | 'modification' | 'reschedule' | 'cancellation' | 'noChange'`.
   - `IncomingFieldKey`: `'dateSession' | 'time' | 'list' | 'patientName' | 'dob' | 'nhi' |
     'procedureText' | 'insurer' | 'note'`.
   - `ImportRow`: `id`, `batchId`, `channel`, `receivedAtISO`, `incoming: IncomingBookingFields`,
     `corrections?: Partial<...>` (office corrections to the identifying fields: NHI, name, date of
     birth, time and surgeon; kept separate so the original is never lost, and **never the procedure
     wording**, which is kept exactly as received), `status: 'open' | 'applied' | 'rejected'`,
     `decision?: ImportDecision`, `decidedBy?`, `decidedAtISO?`, and for a feed message
     `messageId?`. "Unmatched" is **not** a status: it is derived (work item 2), so a row cannot be
     unmatched and forgotten.
   - `ImportBatch`: `id`, `channel`, `hospitalId`, `label` ("St George's bookings, 28 Jul to
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
     NHI, name and DOB, their Procedures (each with its source texts, procedure pick and Contract id,
     name and holder; the primary marked if 23 is DONE), notes, scheduled time, correlation ref,
     cancellation and, if 21 is DONE, the insurance indication; Lists with hospital, surgeon, date,
     session, anaesthetist, state (DRAFT for a Draft List, ACTIVE, SUBMITTED, AUTHORISED) and Slot;
     open Slots by anaesthetist, date and session with their availability; surgeons with `hpiId`;
     and the other open rows (for the duplicate flag).
   - `effectiveIncoming(row)`: `incoming` with `corrections` laid over it. Every function below reads
     this, never `incoming` directly. The procedure wording is never correctable, so it always reads
     as received.
   - `resolveSurgeon(view, fields)`: by `hpiId` (the HPI CPN, OQ-52) when the row carries one, else
     by normalised name; unresolved gives the "Surgeon not recognised" flag.
   - `findMatch(view, fields)` (US-02.1.3's key, one function, so a change of key is one edit):
     1. **The List, then the patient.** The List at the row's hospital, date and session with the
        resolved surgeon (an ACTIVE, SUBMITTED or AUTHORISED List, or an unassigned Draft List), then
        the non-cancelled Booking on it for the same patient: valid normalised NHI first, else
        normalised name and date of birth together. Basis `'listAndPatient'` ("Matched by date,
        surgeon, hospital and session, then NHI").
     2. **The patient elsewhere (a reschedule).** No such Booking on that List: the same patient
        (valid NHI only) on a non-cancelled Booking at the same hospital, today or later, on another
        date, session or List; or, when the hospital sent an `externalRef`, the Booking whose
        `correlationRef` carries it. Basis `'patientElsewhere'` or `'appointmentRef'`. Never by name
        alone across Lists.
     3. **Surgeon not recognised.** Step 1 cannot use the full key: look for the patient's NHI on that
        hospital's Lists on that date and session, basis `'patientOnDay'`, with the flag.
     4. Else none.
     A Booking created or changed by an earlier decision is found the same way, so a later row for it
     (an update to an already matched Booking) goes through the same diff and approval (US-02.1.3);
     it is never applied because it matched before.
   - `searchBookingsForRow(view, fields, query)`: the admin's search by hand (AR-21: "the admin can
     also search by hand"), by patient name or NHI across that hospital's non-cancelled Bookings
     from today, at most 20, for the "Match to another Booking" control.
   - `diffFields(booking, procedure, fields)` returns `FieldDiff[]` (`{ key, label, current,
     incoming, effect }`) for date and session, time, List (surgeon), patient name, date of birth,
     NHI, procedure wording, insurer and note. A field the hospital did not supply is skipped (never a
     change). NHI is compared but flagged, never applied (see work item 4). The surgeon is shown as a
     difference only when it moves the Booking to a different List. **Procedure wording:** compared
     character for character against every source text the target Procedure already holds (the
     primary if 23 is DONE, else the first); identical to one of them, no diff; otherwise a diff whose
     `effect` is `'addBeside'` ("Add the hospital's wording beside the current text"), never a
     replacement. The hospital's `code` is shown in the panel and is never a diff. **Insurer:** a
     diff only when Phase 21 built the insurance indication (against `booking.insuranceIndication`);
     otherwise it is returned as `insurerNote` (`{ text, contractHolders, differs }`, `differs` true
     when the row names an insurer that holds none of the Booking's Contracts) and shown beside the
     stack, never a field to apply. The procedure pick and the Contract are never diffs: the row
     never names them.
   - `classifyChange(match, fields, diffs)`: no match gives `'new'`; `hospitalStatus === 'cancelled'`
     gives `'cancellation'`; a different date, session or List gives `'reschedule'` (other diffs are
     listed as "also changed"); any other diff (a wording-only one included) gives `'modification'`;
     none gives `'noChange'`. Plain-language labels in one map, `CHANGE_TYPE_LABELS`: "New",
     "Modification", "Reschedule", "Cancellation", "No change".
   - `suggestDecision(view, row)` returns `{ changeType, match?, diffs, suggestion, unmatchedReason?,
     flags }`. **A suggestion never includes a procedure or Contract pick** (no automated decisions,
     FT-02.1; no default Contract, OQ-78):
     - `new`: the List in the Slot at the row's hospital, date, session and surgeon gives
       `createBooking` on it; failing that, an unassigned Draft List with the same four fields gives
       `createBooking` on the Draft List (it holds Bookings, OQ-44). With neither, the row is
       **unmatched**, `unmatchedReason` "No List at St George's for Mr Hale on Thu 6 Aug AM", and
       the screen offers Create a List in a session (anaesthetists whose Slot is open that session,
       in Phase 17's `rankAnaesthetistCandidates` order) or Create Draft List.
     - `modification`, `cancellation`, `noChange`: `match` on the found Booking with every diff
       ticked. A modification or cancellation that finds no Booking is **unmatched**: "No Booking for
       this patient on Mr Hale's List at St George's on Thu 30 Jul AM".
     - `reschedule`: the target List at the new hospital, date, session and surgeon, which may be
       **any anaesthetist's** List, or an unassigned Draft List with those four fields. With no
       target the row is **unmatched** ("Reschedule to Thu 6 Aug AM: no List there yet"); the
       Booking is not touched and the date change is not dropped. The admin resolves it with Create
       List in a session or Create Draft List, and the Booking moves onto it.
     - A row whose surgeon does not resolve can still get `createBooking` on an existing List or
       Draft List (it already has its surgeon), but `createList` and `createDraft` need a surgeon
       chosen by the admin in the decision panel: a List needs exactly one surgeon (Phase 31's
       `pairingIssues`) and a Draft List cannot be saved without one (US-01.6.1, OQ-44).
   - `rowFlags` (warning pills, never blocks unless stated): "NHI invalid" (from `validateNhi`;
     **blocks** Apply until corrected), "NHI differs from the Booking's patient" (matched by name and
     date of birth or by appointment id), "Surgeon not recognised" (the name does not resolve in the
     surgeon master), "List submitted" (the office may still apply until AUTHORISED, per the domain
     model's Booking rule; AR-21 `open-after-submit` is undecided, logged), "List authorised"
     (**blocks** Apply: locked; reject with a reason or resolve off-line), "Booking cancelled" (a
     modification to a cancelled Booking is not applied; the suggestion becomes reject), "Earlier
     row for this Booking still open" (links the other row; the admin rejects one), "No NHI
     supplied" (never blocks: the Booking proceeds and Phase 40 adds the missing-NHI problem list and
     the authorise guard, OQ-49, D11), "No procedure wording sent" (mild: a created Booking then needs
     the office's procedure pick, work item 4) and "Hospital names a different insurer" (from
     `insurerNote.differs`, or the indication diff; the admin checks the Contract).
   - `matchingQueue(view, rows)`: each open row's queue, `'ready'` (a suggestion exists) or
     `'unmatched'` (no suggestion), plus counts by change type for the stats strip. There is no
     waiting state: a Draft List created from a row already holds its Booking.
   - Tests: each change type; the List-then-patient key finds the Booking by NHI, and by name and
     date of birth when the row has no NHI; the same patient on another hospital's List does not
     match; a reschedule is found by NHI on another date, and by appointment id when one is sent;
     surgeon by HPI CPN beats a name that differs; an unrecognised surgeon falls back to the
     patient on that day with the flag; a missing incoming field is never a diff; wording identical to
     a held text is no diff, different wording is an `addBeside` diff and never a replacement;
     leading spaces, "?conv" and "+/-" in the wording survive into the diff unchanged; a code is never
     a diff; an insurer is a diff only with 21's indication; a reschedule to another anaesthetist's
     List; a new row and a reschedule both target an unassigned Draft List with the same four fields;
     a reschedule to a date with no List or Draft List is unmatched with the reason and no
     suggestion; a modification that finds no Booking is unmatched; the AUTHORISED, cancelled,
     invalid-NHI, no-NHI, no-wording and duplicate-row flags; a later row for a Booking an earlier
     decision created matches it and is a Modification with its diffs, not applied; no suggestion
     ever carries a procedure or Contract pick; corrections override incoming and never touch the
     wording; determinism (same view, same output).
3. **Sample files** (`src/domain/intake/hospitalDownloads.ts`, pure fixtures in the `pdfSamples.ts`
   style; `hospitalDownloads.test.ts` for fixture integrity) (US-02.1.1, US-02.1.2; OQ-13 interim):
   - `HOSPITAL_DOWNLOAD_SAMPLES`, four entries, each `{ id, channel, hospitalId, label, description,
     rows: IncomingBookingFields[] }`. Every patient is synthetic. **The procedure wording comes from
     AR-35's "Illustrative source wording" table** (AI-made, not from AA; a header comment says so and
     cites the note and heading by name), as received, never trimmed, and agrees with what Phase 20a
     seeded on the same Bookings. Author the modify targets against the seeded Bookings Phase 11
     planted (the `APPT` correlation refs on Aug 3 and 4) and the three booked cases on Souter's Tue
     28 Jul AM List, and pin each in the seed test:
     - `SAMPLE_STG` **St George's bookings, Tue 28 Jul to Tue 4 Aug** (channel `download`),
       five rows: (R1) **Sarah Mitchell**, NHI `CQY9304` and DOB 1988-04-12 (the seeded patient, so
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
       (R4) the `APPT.s13Move` Booking moving to the day of an existing St George's Mr Hale List:
       Reschedule, found by its NHI; (R5) the `APPT.s15` Booking, `hospitalStatus: 'cancelled'`:
       Cancellation.
     - `SAMPLE_STG_UPDATE` **St George's bookings, a day later** (channel `download`), one row: Sarah
       Mitchell on the same List again, now at 09:00 with a booking-office note and the hospital's
       fuller wording `Laparoscopic appendicectomy, may convert to open` (AR-35 row 14's meaning,
       written as a hospital would spell it; say so in the fixture comment). Once `SAMPLE_STG` R1 has
       been applied it is a **Modification** of the Booking that decision created, matched by date,
       surgeon, hospital and session, then NHI (time, note, and the wording added beside `lap appy
       ?conv to open`, waiting for approval: US-02.1.3's "The admin then approves the update"); while
       R1 is still open it carries the "Earlier row for this Booking still open" flag.
     - `SAMPLE_SX` **Southern Cross bookings, Tue 28 Jul** (channel `download`), three rows:
       (R1) **Priya Nair** (existing patient, NHI `MYY54SL`), Tue 28 PM 14:30, Ms Patel, wording
       `ACL recon R` (AR-35 row 7, a hospital download): New on Dr Souter's Tue 28 Jul PM List;
       (R2) a seeded ACTIVE Southern Cross Booking after 21 Jul (record which in the PROGRESS entry)
       whose Procedure is on a Contract not held by nib, with a corrected patient name, a
       date-of-birth fix, an `insurer` naming nib (`I-NIB`) and a booking-office note: Modification
       (patient and note, with the "Hospital names a different insurer" flag and, if 21 is DONE, an
       insurance indication diff; the note-append and Contract-pick check). Pick an nib-held Contract
       that Phase 20's `contractCandidatesForProcedure` offers for that Procedure (if none is, use
       another holder Phase 18 seeded and record which), and pin it in the fixture test. (R3) a late
       time correction for the Booking on a seeded **AUTHORISED** Southern Cross List (at `60e2d1e`
       the historical `oa08` List in `seed/history.ts`: Ms Patel, Wed 18 Mar, knee arthroscopy;
       later phases may have reshaped the history seed, so record which), no appointment id, matched
       by the List and NHI: Modification flagged "List authorised", Apply disabled (the locked-target
       check, and the US-02.5.4 recipe's second row).
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
   - Fixture tests: row keys unique per sample; every row validates except Forte R2; every wording
     appears in AR-35's table or is R14's meaning (the test holds the expected strings); Foster's R3
     wording equals the MSG-STG-1012 text 20a seeded and Sarah's R1 equals MSG-STG-1001's;
     `SAMPLE_STG_UPDATE` R1 shares `SAMPLE_STG` R1's List and patient and differs only in time, note
     and wording; the seeded targets the rows name exist on a fresh seed (R2 to R5 of St George's, R2
     of Southern Cross and its Contract pick, R3 of Southern Cross on an AUTHORISED List); the
     unmatched Forte row's session has no Forte List and no Draft List, and its surgeon resolves;
     and every row classifies as this item says against a fresh seed through `suggestDecision` (so
     `SAMPLE_STG` R1 and `SAMPLE_SX` R1 read New, not Reschedule: neither Sarah Mitchell nor Priya
     Nair has another non-cancelled Booking at that hospital from today; at `60e2d1e` Sarah's other
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
     kept as received."). The NHI is validated on entry (EP-02: validated against the internal model).
   - **`decideImportRow(api, actor, rowId, decision)`** (US-02.1.2, US-02.1.3, FT-02.5; AR-21
     `create-booking`, `apply-change`, `record-change`): the one place a row reaches the schedule.
     - Common refusals: `officeOnly`, `notFound`, `alreadyDecided`, `invalidNhi` ("Correct the NHI
       before applying"), `listLocked` (AUTHORISED target), `hospitalMismatch` (a target List or
       Draft List at another hospital), `surgeonRequired` (`createList` or `createDraft` with no
       resolved or picked surgeon), `procedureRequired` (a create for a row with no wording and no
       procedure pick: 20a's `createBooking` would refuse a Procedure with neither; "This row has no
       procedure wording. Choose the procedure first."), the refusals of Phase 20's Contract check for
       a picked Contract (`contractNotInEffect`, `contractOutOfScope`) and of 19's procedure pick, and
       `staleSuggestion` when the decision's target no longer fits what `suggestDecision` would allow
       now.
     - **Pre-check, then apply in refusable-first order, then record.** Validate every guard the
       write paths will apply before the first write (the Phase 11 review-fix rule: a refused move
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
       others; no path edits or removes a text, and the hospital's wording never changes the
       procedure pick or the Contract.
     - **The office's picks (US-04.3.4, D33).** When `picks.procedureTypeId` is set, it goes through
       19's `pickProcedure` (or `createBooking`'s procedure input) and when `picks.contract` is set
       through Phase 20's `setProcedureContract` (or `createBooking`'s Contract pick), both on the
       target Procedure, as the office actor, with 20's refresh (procedure, units, locked modifiers)
       in their commits. With no picks a created Booking has **no Contract and, unless the wording is
       blank, no procedure**: it appears on `needsContractBookings` ("No Contract", "Procedure to
       choose") for the office to settle, and nothing is derived from the hospital (OQ-78,
       US-04.3.3). A matched Booking keeps its procedure and Contract unless the office picks.
     - `match` + `modification`: apply only the ticked `fieldsApplied`: time through `editBooking`;
       patient name and DOB through `editPatient`; the wording through `addSourceText` (above); the
       insurer, when Phase 21 is DONE and the diff is ticked, through `setInsuranceIndication(api,
       actor, bookingId, { insurerId, source: 'intake' })` (D28: a hint that guides the Contract,
       never who is billed), and otherwise nothing is written for it. The picks as above. A hospital
       note is **appended** to the Booking's notes as one line ("St George's, 21 Jul: ...") instead
       of overwriting them (the S14 overwrite in gaps.json). An NHI difference is never applied: the
       admin rejects the row or fixes the patient record (Phase 40 adds attach and merge).
     - `match` + `reschedule`: `reassignBooking` to the target List (any anaesthetist's), then
       `editBooking` for the time, then the wording, with the Booking id, Procedures, Contracts and
       history unchanged. Moving the Booking is the refusable step, so it goes first. No prepayment
       re-check runs on a move (D20, honour system); whatever Phase 41 later hangs on
       `reassignBooking` (the payee repoint) follows with no code here.
     - `match` + `cancellation`: `cancelBooking` with reason "Cancelled by St George's (hospital row
       IR0005)" or the row's `cancelReason`. Soft-cancel as today: the Booking stays visible on its
       List, marked cancelled.
     - `match` + `noChange`: records the decision ("Matched, nothing to change") and writes nothing
       else.
     - `createBooking`: `createBooking(api, actor, listId, { patient, sourceText, procedure and
       Contract picks if any, scheduledTime, correlationRef: { sourceFeedId:
       hospitalSourceKey(hospitalId), externalAppointmentId } (when the row sent one), source:
       'hospitalDownload' })` on an ACTIVE List or an unassigned Draft List. The patient goes through
       `upsertPatient`, so an existing NHI is reused, not duplicated. If Phase 21 is DONE the Booking's
       payer is the patient, as on every create path (US-11.2.2); a row never sets another payer.
       Stamp `source: 'hospitalDownload'` for every channel, including `manualSheet` and
       `feedMessage`: all three are the hospital pathway in `BookingSource`; the channel lives on the
       row, on the source text and in the History.
     - **What follows with no code here.** Because every decision goes through the guarded actions,
       15a's warning routine re-runs (including 21's insurance-indication review warning, if DONE),
       a Booking without a Contract or procedure shows on "Needs a Contract", who is billed follows
       the Contract's holder or the payer on the Booking (D17), and, if Phase 27 is DONE, its
       prepayment re-check runs on a change of Procedures, Contract or payer, never on a move (D20).
       A row never sets a billable party, a payer, an invoice email or a prepayment itself.
     - `createList`: `assignListToSlot(api, actor, slotId, { hospitalId, surgeonId, kind: 'private'
       unless the row says otherwise })` first, with the row's resolved surgeon or the one the admin
       picked in the panel (refused `surgeonRequired` otherwise). Phase 17's not-preferred warning and
       its acknowledgement (a soft warning, never a block; D44), Phase 30's conflict flag on an
       unavailable Slot and Phase 31's pairing check all apply as they do in the Day view. Then
       `createBooking` on the new List for a New row, or `reassignBooking` onto it for a Reschedule
       row. A refusal of the second step after the List is created is prevented by the pre-check; if
       it still happens, the List stays (an empty List is a valid state), the row stays open and the
       outcome says so.
     - `createDraft` (US-01.6.1, OQ-44 answered): `createDraftList(api, actor, { hospitalId,
       surgeonId, dateISO, session, note }, 'hospitalRow')` with all four of hospital, surgeon, day
       and session (the row's resolved surgeon or the admin's pick; refused `surgeonRequired`
       otherwise), Phase 31's reserved `'hospitalRow'` origin (no request `source`), 31's
       `datePassed` and `outsideCanvas` refusals checked in the pre-check, and an `importRowId`
       source reference on the Draft List if 31 did not add one, with a note built from the row
       ("From St George's bookings: Sarah Mitchell, 08:30, lap appy ?conv to open"). It takes no Slot
       and no anaesthetist. Then the row's Booking goes onto it through 31's path for Bookings on a
       Draft List: `createBooking` for a New row, `reassignBooking` for a Reschedule row (the Booking
       keeps its id and history). The same pre-check and refusable-first rule applies; if the second
       step still fails, the Draft List stays (an empty Draft List is valid and shows on Phase 31's
       page), the row stays open and the outcome says so. When the office later assigns the Draft
       List (`assignDraftList`, with 17's not-preferred warning), its Bookings come with it;
       `redateDraftList` takes its Bookings with it, and `removeDraftList` refuses while it holds an
       active Booking (US-01.6.4). Neither reopens the row.
     - `reject`: a reason is required (`reasonRequired`); nothing else changes.
   - **Tests:** import stages rows and a re-import skips them (including a rejected row and a row the
     office corrected); a correction to the wording is refused; every refusal above; each decision
     kind end to end; a refusal leaves both the row and the schedule unchanged; a created Booking has
     `source: 'hospitalDownload'`, the row's wording verbatim as its first source text with the right
     channel, `from` and time, **no Contract** and no procedure when nothing was picked (and appears
     on `needsContractBookings`), the correlation ref when one was sent, and a reused patient for
     Sarah Mitchell and Priya Nair; picks land through `pickProcedure` and `setProcedureContract`'s
     checks and an unoffered Contract is refused; a row with no wording and no pick is refused
     `procedureRequired`; no decision writes a billable party, a payer or (without a ticked 21 diff)
     an insurance indication; a modification applies only ticked fields, appends the note and adds
     the wording beside the earlier text (Foster's `WLE MM` kept first, the hospital's long line
     second), and replaying the same row adds no second text; a reschedule to another anaesthetist's
     List keeps the Booking id, its Contract and its history and runs no prepayment re-check;
     `SAMPLE_STG_UPDATE` after `SAMPLE_STG` R1 is applied matches the created Booking by the List and
     NHI and changes nothing until decided, then applies its time, appends its note and adds its
     wording beside; a reschedule row with no target List stays open and the Booking is untouched;
     `createList` goes through `assignListToSlot` (a not-preferred pairing is acknowledged, not
     refused); `createDraft` for a New row creates the Draft List holding the new Booking, for a
     Reschedule row moves the Booking onto it, and with no surgeon is refused; the two audit metas
     land in one commit and the Booking's History shows the row.
5. **Selectors** (`store/selectors.ts`, or a `store/matchingSelectors.ts` beside it): `matchingView`
   (built from stable records; components derive with `useMemo`, as the file's header comment
   requires), `importRowViews(state, filter)` (row, effective fields, suggestion, queue, flags,
   batch label), `rowStackViews(state, rowId, picks)` (the matched Booking's Procedures through 20a's
   `procedureStackView`; for a New row, a preview built by passing a draft Procedure value held in
   memory, never stored, with the row's wording as a `SourceText` and the office's picks, to the same
   `procedureStackView`, so the stack logic stays in 20a's one module), `matchingCounts(state)` and
   `matchingAttentionCount(state)` (open rows, for the side-nav badge).
   `integrationAttentionCount` now counts dead-letter rows only.
6. **The HL7/FHIR re-route: no silent apply** (RV-13, RV-28; US-02.1.5 "No silent apply"):
   - Delete `applyEffect` (with the S12 create and the S13 and S14 wording appends Phase 20a put in
     it), the S12/S13 park rule Phase 28 added and Phase 31's interim `pairingIncomplete` park if 31
     left one (a row with no resolvable surgeon now simply stages and shows "Surgeon not
     recognised"). `attemptMessage` now parses as today, then validates the extracted NHI with
     `validateNhi`: an invalid NHI is a feed-mapping fault, so it keeps today's path (`retrying`,
     then `deadLetter` after `MAX_ATTEMPTS`), and MSG-CPH-2001 still dead-letters until its mapping is
     fixed. A clean parse calls `stageImportRows` with channel `feedMessage`, the feed's hospital, a
     batch label ("St George's webPAS message MSG-STG-1001") and one row built from the parsed fields,
     its procedure wording exactly as the message carried it (SCH-7's description, or FHIR's
     `Appointment.description`): S12 gives a booked row, S13 and S14 a booked row with the new date,
     time and fields, S15 a cancelled row. The canned `routing` supplies the surgeon and session
     that the extractor does not read (the §10 fence note stays). The message is marked `processed`
     with `resultImportRowId`. This is what retires RV-28: the canned S13, S14 and S15 messages (the
     automated reschedule, modification and cancellation, Future Work in US-02.5.1 to US-02.5.3) no
     longer change anything by themselves; they become Reschedule, Modification and Cancellation rows
     for the office to decide, and MSG-STG-1012's fuller wording reaches Foster's Booking only when
     the office applies its row.
   - The transient-fault path, MSH-10 dedupe, `reprocessMessage` and `wireIntegrationRetry` are
     unchanged. `reprocessMessage` after the Christchurch Public mapping fix now stages a row.
   - `displayStatusFor` shows a processed message with a row as **"Sent to matching"**. The Messages
     tab loses the manual-intervention chip and its Reprocess case; its footnote says "Parsed messages
     are sent to the matching screen for the office to decide. Nothing is applied automatically."
   - `DemoIntegrations.tsx` pane 3 becomes "Sent to matching": the row's change type, the suggested
     decision in words, the wording as received, and "Open Admin, Matching to decide" (text, as the
     Phase 11 note on cross-app links allows). Keep `data-shot="integrations-schedule-change"` so
     recipes keep an anchor. Any label on the S13 to S15 entries that says the change is applied
     ("moves the Booking", "cancels it", "adds the hospital's wording") now says the row is staged,
     and MSG-STG-1014's label "S14 · Locked target (manual intervention)" becomes "S14 · Change to a
     submitted List".
   - `RolesInfo.tsx`: the Integration role line becomes "Integration (hospital feeds): brings rows in
     for the office to match. It never changes a Booking itself." The integration actor no longer
     writes Bookings or wording anywhere; leave `editRefusal`'s integration branch in place (the Data
     Inspector's guard console still exercises it) and say so in a comment, but reword its refusal
     copy to drop "manual intervention" ("An integration update cannot change a submitted List.").
   - Tests (`integrationActions.test.ts`, reworked; 20a's `sourceText.test.ts` feed cases re-pointed
     to the row decision): **every** canned message processed on a fresh seed changes no Booking,
     List, patient or source text (snapshot the schedule before and after) and stages exactly one row
     with the expected change type and its wording verbatim; replay is still a `duplicate` no-op; the
     transient message stages on attempt 2; MSG-CPH-2001 dead-letters, and after `setFeedMapping` to
     PID-3 and `reprocessMessage` it stages a valid row; MSG-STG-1014 (the old locked target) stages a
     row flagged "List submitted", which the office can apply; MSG-STG-1012's row, applied, adds the
     hospital's wording beside Foster's `WLE MM` and changes neither her procedure pick nor her
     Contract.
7. **Audit reading layer** (`shared/audit/actionLabels.ts`, `fieldLabels.ts`, `auditNarrative.ts`):
   `importBatch.create` "Hospital bookings imported", `importRow.receive` "Hospital row received",
   `importRow.correct` "Hospital row corrected", `importRow.decide` "Hospital row decided",
   `booking.fromHospitalRow` "Hospital row applied to this Booking"; field labels for every
   `IncomingBookingFields` key (`procedure.text` as "Procedure as received", `procedure.code` as
   "Hospital's code", `insurer` as "Insurer (as sent)", the surgeon's `hpiId` as "HPI CPN") and for
   `changeType`, `decision`, `fieldsApplied` and `picks`. The narrative reads "Kirsty W. applied a
   St George's row: Modification (time, wording, note)"; 20a's "Wording added as received" entry
   follows it in the History. Remove the `manualIntervention` wording from any label.
8. **Seed and `PERSIST_VERSION`.** No seeded batches or rows: the screen starts empty on a reset and
   the presenter imports. Bump `PERSIST_VERSION` by one with a history comment line ("intake slice
   (import batches and rows); HL7/FHIR messages stage rows instead of applying; manualIntervention
   retired"). Seed tests (`seed.test.ts`): the fixture targets from work item 3 exist and carry the
   wording 20a seeded; for the triggers (below) a future St George's Mr Hale session with no List and
   a Southern Cross Ms Patel session with no List exist within the canvas and are not holidays; none
   of them is a scripted-beat List. `persistMigrate.test.ts`: an old payload reseeds.
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
      5 rows were already imported. Nothing new." and selects the first new row.
    - **Stats strip** in the Admin Review style: OPEN, NEW, MODIFICATIONS, RESCHEDULES,
      CANCELLATIONS, UNMATCHED.
    - **Filter** (a segmented control): **Open** (default; ready rows first, then unmatched, each
      oldest first), **Unmatched** (the unmatched queue, US-02.1.4) and **Decided** (applied and
      rejected, newest first, with who and when).
    - **Table** (`tableChrome`): Received, Hospital (and "Sample file" or "Feed message" micro-cap
      for the channel), Patient and NHI, Date, session and time, **Procedure as received** (the row's
      wording verbatim in mono, quoted, one line with an ellipsis and the full text in a `title`;
      "Not supplied" in mist; `data-shot="matching-received"`; US-02.1.2's new criterion), Change (the
      change-type pill), Suggested (plain words: "Create Booking on Dr Souter, Tue 28 Jul AM";
      "Unmatched: no List at Southern Cross for Ms Patel on Thu 6 Aug PM"), Flags (warning pills).
      Rows are clickable in the `ReviewQueue` and `InvoicesScreen` way (the pattern
      `screens/ClickableTableRows.test.tsx` covers; there is no shared component, so follow theirs and
      add the Matching table to that test). An empty state per filter ("No rows waiting. Import
      hospital bookings to start.").
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
        current text listed (never "replace"); "Not supplied" in mist where the hospital sent
        nothing; the matched Booking named with a link to its Booking detail and the match basis
        ("Matched by date, surgeon, hospital and session, then NHI"; "Matched by NHI at St George's on
        another date"; "Matched by appointment id 1661303"); a "Match to another Booking" link opening
        a search (`searchBookingsForRow`) for the admin to pick a different one by hand. For a New or
        unmatched row, the incoming fields alone;
      - **Procedure and Contract** under the diff, for every decision that creates or matches a
        Booking: each Procedure as Phase 20a's `ProcedureStack` in full density (`rowStackViews`): for
        a matched Booking its current stack with the hospital's wording shown as the text to be added;
        for a New row the preview (the row's wording, then "Procedure to choose", then "Contract to
        choose"). Under it, teal text links **Choose procedure** (Phase 19's `ProcedurePickerSheet`,
        two tabs, one search; an RVG-code pick flows into the Contract step as 20 built it) and
        **Choose Contract** (Phase 20's `ContractPickerSheet`: No contract (RVG) first, then the
        fitting Contracts under holder headings, composite search; with 21's `suggestedHolderIds` if
        DONE). Both are optional; a mist caption says "Leave either to choose later: the Booking waits
        on Needs a Contract." The row's insurer shows beside the stack ("Insurer from the hospital:
        nib") with the "Hospital names a different insurer" pill when it holds none of the Booking's
        Contracts; with Phase 21 DONE it is also a tickable diff row ("Insurance indication"). The
        footer label counts a pick as a change. Nothing is set unless the admin picks or ticks;
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
        ("Create Booking", "Apply 3 changes", "Move Booking", "Cancel Booking", "Create List and
        Booking", "Create Draft List and Booking", "Move to new Draft List", "Mark as matched");
        disabled with the blocking flag's reason shown ("Correct the NHI before applying", "This
        List is authorised and locked", "Choose the surgeon first", "This row has no procedure
        wording. Choose the procedure first.");
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
    message adds "Switch to Admin, Matching to apply it." The S13 to S15 choices stay, badged, so a
    presenter asked about feeds can show one landing as a row, but no scripted beat uses them
    (RV-28).
13. **Demo triggers** (registry entries; see the next section for labels and effects). Bodies in
    `src/store/matchingDemo.ts` (or beside `demoActors.ts`) so the PWA closure stays pure:
    `stageUnmatchedRow`, `stageUpdateForBooking`, `stageRescheduleToEmptyDate` and
    `officeMatchesHospitalRow`. Every body stages rows through `stageImportRows` (channel `download`,
    a batch labelled "Demo row"), with AR-35 wording where it stages a new row, and picks its date
    deterministically from the demo clock: the first future session after today, within the canvas,
    not a holiday, with no List at that hospital for that surgeon. Registry tests: routes, surfaces,
    disabled states, determinism, and that `officeMatchesHospitalRow` goes through `decideImportRow`
    with the derived suggestion and no picks (never `createBooking` or `addSourceText` directly).
14. **Playwright** (`npm run shots`): a new `visual/admin-matching.spec.ts` (import St George's, the
    table with the "Procedure as received" column and stats, the panel on R3 (Foster) with the
    wording to add beside `WLE MM`, a field unticked, apply, the banner and Decided, the Booking's
    stack showing both texts; R1 with Choose Contract opening the picker with No contract (RVG)
    first, then Create Booking leaving it on Needs a Contract; a reject with a reason; the St
    George's update after R1 is applied showing its Modification and leaving the Booking unchanged
    until applied; the unmatched queue after "Send unmatched row"; Create a List in a session);
    update `phase11.spec.ts` (the simulator's pane 3 says "Sent to matching"; no manual-intervention
    chip) and `phase12.spec.ts` (S1 through the matching screen); add `/admin/matching` to
    `screens.spec.ts`; add the PWA stand-in to `pwa-device.spec.ts`. `data-shot` hooks:
    `matching-import`, `matching-stats`, `matching-table`, `matching-row-<n>`, `matching-received`,
    `matching-diff`, `matching-stack`, `matching-decision`, `matching-apply`, `matching-banner`,
    `matching-unmatched`.
15. **Capture recipes** (`requirements-board/capture/recipes/`): re-shoot US-02.1.1 (the import
    dialog and the landed rows), US-02.1.2 (the wording as received, and the decision panel),
    US-02.1.3 (the diff, and the update to an already matched Booking) and US-02.1.4 (the Unmatched
    filter; set `status` to captured and drop the `absentReason`); turn US-02.5.1, US-02.5.2 and
    US-02.5.3 (Future Work: the automated path) into partial analogues showing the office deciding
    the Modification, Reschedule and Cancellation rows on the matching screen, then the Booking and
    its History; US-02.5.4 likewise (a row flagged "List submitted" applied by the office); re-point
    20a's US-02.5.7 `hospital-update` state through the matching screen and complete 20a's US-03.1.9
    with the matching-row stack. Replace every caption that says a message was "applied" by itself
    (RV-28) and every stale caption the table below names. This is the short list; the full step,
    with the rest of the covered items and the recipes this phase breaks, is the Catalogue
    screenshots section below, run after the review pass. Run `npm run verify:board` from the repo
    root.
16. **Demo guide** (see Demo guide updates below), in this session.
17. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    then the adversarial review pass.

## Demo triggers

"Import hospital bookings" is a **product control** on the Matching screen (with a badged sample-file
picker), not a harness-bar entry, per the ROADMAP rule. Matching itself is normal Admin use, and so
are Choose procedure and Choose Contract in the panel. Four things are not: a hospital sending a row
that matches nothing, a hospital sending a later update for a Booking already matched, a hospital
moving a Booking to a day with no List, and the office's side on a handset, where there is no Admin
app. All entries register in Phase 14's registry; nothing is added to the Control Panel page, which
lists them under their screens.

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `matching-send-unmatched-row` | Send unmatched row | Admin · Matching (`/admin/matching`) | bar | `choices`: **"New booking, no List yet"** (a Southern Cross row for Ms Patel on the first future session with no Southern Cross Ms Patel List or Draft List, a synthetic patient, wording `T&A` from AR-35 row 20) and **"Change for a Booking AA has never seen"** (a St George's modification for a synthetic patient whose NHI is on no Booking and with no appointment id AA holds). Runs `stageUnmatchedRow`, then selects the new row. Message (the date as picked): "Southern Cross sent a row for Thu 6 Aug PM. No List there yet, so it waits in the unmatched queue." | no qualifying session in the canvas ("No empty session left on the canvas") |
| `matching-send-update` | Send update for a matched Booking | Admin · Matching | bar | Acts on the Booking matched by the row selected in `matching.selectedRowId` if it is open and not AUTHORISED; otherwise on Diane Foster's Booking (Tue 4 Aug AM, 20a's `WLE MM`). Runs `stageUpdateForBooking`: a row for the same List and patient with a time 30 minutes later (Foster: MSG-STG-1012's time) and the hospital's fuller wording (Foster: AR-35 row 27; Sarah Mitchell: `Laparoscopic appendicectomy, may convert to open`; any other Booking: its procedure-list entry's name as the hospital would spell it, or no wording when none is picked), then selects it. Message: "St George's sent an update for Diane Foster: a new time and fuller wording. Check the differences and approve it." | no eligible Booking ("Select a row matched to an open Booking"), or the same update is already waiting ("This update is already waiting on Matching") |
| `matching-reschedule-no-list` | Reschedule to a date with no List | Admin · Matching | bar | Acts on the Booking matched by the row selected in `matching.selectedRowId` if it has one and is not cancelled or AUTHORISED; otherwise on the seeded `APPT.s13Time` Booking. Stages a Reschedule row moving it to the first future session with no List or Draft List at its hospital for its surgeon. Runs `stageRescheduleToEmptyDate`. Message (the patient and date as picked): "St George's moved this booking to Thu 6 Aug AM. There is no List there yet, so the row is parked and the Booking has not moved." | no eligible Booking ("Select a row matched to an open Booking"), or no empty session |
| `matching-office-matches-row` | Hospital row arrives and the office matches it | Mobile · Lists and the Booking screen (`/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`) | pwa | `choices`: **"Sarah Mitchell, Tue 28 Jul AM (S1)"** (stages `SAMPLE_STG` R1 alone); on a List route whose List is the persona's, ACTIVE and at St George's or Southern Cross, **"A new hospital booking on this List"** (a row built from a small fixture pool of three synthetic patients with AR-35 wording, the next unused one); and on a Booking route, **"A hospital update for this Booking, approved by the office"** (the same row as `matching-send-update`; on Diane Foster's Booking the hospital's fuller wording, replacing 20a's PWA "Fire hospital message" beat). Then `decideImportRow` as `OFFICE_SIMULATION_ACTOR` with the derived suggestion, every difference ticked and no procedure or Contract pick. Message: "St George's sent Sarah Mitchell's booking and the office matched it. She is now on your Tue 28 Jul AM List; the office will set her Contract." `badge: 'office-stand-in'` | S1 choice: Sarah Mitchell already on that List ("Already on your Tue 28 Jul AM List"); List choice: pool used up, or the List is not ACTIVE; Booking choice: the Booking's List is SUBMITTED or AUTHORISED, or the update was already applied |

The PWA entry is an office stand-in: it shows only in the installed PWA's demo sheet, never in the
harness bar, because in the framed build the presenter plays the office in Admin, Matching. The
re-homed "Fire hospital message" and "Replay last message" stay in the bar only, badged Future scope
(work item 12); they stage rows and never apply a change, and no scripted beat uses the S13 to S15
messages (RV-28).

## Out of scope

- **Bringing St George's and Southern Cross rows in without a hand import** (US-02.1.5, whose
  schedule, pull-on-open, sync-button and last-synced criteria were dropped, leaving "No silent
  apply", which this phase meets): Phase 34, through `stageImportRows`. There is no sync state to
  keep.
- **Manual-provider sheets delivered by the hospital** with a demo auto-match toggle, demoting the
  HL7/FHIR simulator and hiding the monitor's Future tabs, badging the Surgeon PDFs tab (surgeon
  PDF ingest, US-02.2.1, is Future Work; RV-26), and the S1 rebuild around sync, match, the source
  wording and the office's Contract choice: Phase 34. This phase keeps the Surgeon PDFs inbox
  unchanged.
- **Automated change application** (US-02.5.1 to US-02.5.4 and US-02.5.6, Future Work, with
  US-14.6.2): a hospital modification, reschedule or cancellation applied with no admin deciding it,
  a reschedule clash accepted as a Draft List with no admin (US-02.5.2; its open rules are OQ-87),
  the lock on a submitted List for automated changes, and concurrent edits between an integration
  and a person. Not built anywhere in the plan; the canned S13 to S15 stage rows and stay out of the
  scripted demo (RV-28).
- **Automatic matching, AI-assisted matching** or a bulk "apply all suggestions": Future Work
  (US-14.6.2; FT-02.1 says the first version makes no automated decisions, and on US-02.1.2 Greg's
  "why is this a manual task" was answered with an import gate for the first release). Every row
  gets its own decision; raise bulk apply as a discovery point.
- **A hospital setting the procedure or the Contract** (US-04.3.6, Future Work lane), and any default
  Contract (OQ-78: none). A row only shows its wording, code and insurer; the office picks the
  procedure and Contract, in the panel or later.
- **A real file upload and parser.** How each hospital provides its bookings is OQ-13; the samples
  stand in.
- **Applying an NHI change** from a row, and the missing-NHI problem list with attach and merge:
  Phase 40. **The unpaid-balance alert at match** (US-11.3.2: mild or strong by the invoice's age
  from its date, mild for a credit balance, always waved through; D24): Phase 40 registers it in
  Phase 15a's warning routine and shows it in the row panel.
- **The payer on the Booking and the insurance indication themselves** (US-11.2.2, DM-12, D28):
  Phase 21. This phase only offers a row's insurer to 21's setter when the office ticks it.
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
  imported"; the stats strip reads OPEN 5, NEW 1, MODIFICATIONS 1, RESCHEDULES 1, CANCELLATIONS 1,
  UNMATCHED 0 (R2 is the No change row); the badge shows 5. Every row's "Procedure as received"
  cell shows the wording exactly as the sample holds it (`lap appy ?conv to open` with its question
  mark; R2 "Not supplied"). Importing it again says nothing new was added.
- [ ] Open R1 (Sarah Mitchell): New, suggested "Create Booking on Dr Souter, Tue 28 Jul AM"; the
  stack preview reads the wording, "Procedure to choose", "Contract to choose". Choose Contract opens
  the picker with No contract (RVG) first and no hospital default preselected; close it without
  picking. Create Booking: the banner (with "Needs a Contract"), tick and dimmed row show, the badge
  drops to 4, "Next row" opens R2. Mobile Lists, Tue 28 Jul AM: Sarah Mitchell is the fourth Booking
  at 08:30, "SOURCE · Hospital download", her stack showing `lap appy ?conv to open` (Hospital
  download · St George's) and "Procedure to choose", her existing patient record reused. Admin Day:
  she is on the "Needs a Contract" card; setting the Contract there as Phase 20's S1 Beat 1 does
  takes her off it.
- [ ] Import "St George's bookings, a day later": its row is a Modification of the Booking R1
  created ("Matched by date, surgeon, hospital and session, then NHI"), with time 08:30 against
  09:00, the note, and the wording row "Add beside the current text". Sarah Mitchell's Booking still
  reads 08:30 with one text until "Apply 3 changes"; then it reads 09:00, the note is appended, and
  her stack shows `lap appy ?conv to open` then `Laparoscopic appendicectomy, may convert to open`
  below it. Her procedure and Contract are unchanged. (Imported before R1 is decided, the row instead
  shows "Earlier row for this Booking still open".)
- [ ] R2: No change, "Matched by date, surgeon, hospital and session, then NHI"; the panel's
  "Missing from the hospital" line names the procedure wording, which is not a change; "Mark as
  matched" records it and writes nothing.
- [ ] R3 (Diane Foster): Modification with time, wording and note in warning tint side by side. Untick
  the note, apply "2 changes": the Booking shows the new time; its stack shows `WLE MM` (rooms) then
  the hospital's long line below it; her procedure pick and Contract are unchanged; her notes are
  unchanged; her History shows "Hospital row applied: Modification (time, wording)" by Kirsty W. and
  "Wording added as received".
- [ ] Import St George's again after deciding R3: nothing new (identical rows, including R3, are
  skipped). The note-append check is Southern Cross R2 below.
- [ ] R4: Reschedule found by NHI on another day ("Matched by NHI at St George's on another date");
  "Move Booking"; the Booking keeps its id, Contract and History on the new List. R5: Cancellation;
  "Cancel Booking" soft-cancels it (still visible, excluded from billing).
- [ ] Southern Cross sample: Priya Nair lands on the Tue 28 PM List with `ACL recon R` as received
  and on "Needs a Contract"; R2 shows patient name, DOB and note diffs, "Insurer from the hospital:
  nib" with the "Hospital names a different insurer" pill (and, with Phase 21 DONE, an "Insurance
  indication" diff). Choose Contract, pick the nib-held one, and apply: the patient is updated, the
  Procedure is on the picked Contract, the hospital note is appended below the Booking's existing
  notes (never overwriting them), and the indication is set only if its diff was ticked. Leaving the
  Contract alone keeps the Booking's current Contract.
- [ ] Forte sheet: R2 shows "NHI invalid" and Apply is disabled with the reason; correct the NHI
  inline (the wording has no edit field) and apply. R3 is Unmatched ("No List at Forte Health ...");
  Create Draft List and Booking creates the Draft List with hospital, surgeon, day and session
  (origin "Hospital row", no Slot or anaesthetist taken) holding the row's Booking with `TURBT` as
  received (channel "Hospital sheet"), and the row moves to Decided. The Draft List shows on Phase
  31's Draft Lists page and the Day view band with one Booking; assign it to an anaesthetist there
  and the Booking comes with it.
- [ ] A row with no wording and no procedure pick: "Create Booking" is disabled with "This row has no
  procedure wording. Choose the procedure first."; Choose procedure (two tabs) enables it.
- [ ] Demo actions, **Send unmatched row, New booking, no List yet**: the row appears under Unmatched
  with its reason and its wording. Create a List in a session: the candidates are tier-ordered with
  "Not preferred with ..." apart; picking a not-preferred anaesthetist shows the warning and can
  still go ahead; the List and Booking appear on the Day view for that date. The other choice gives
  "No Booking for this patient on ..."; Reject it with "Not an AA booking" and see it under Decided
  with the reason.
- [ ] Demo actions, **Send update for a matched Booking**, with nothing selected after a reset: a
  Modification row for Diane Foster with the new time and the hospital's long wording waits; Foster's
  Booking is unchanged until the office applies it. Running it again says the update is already
  waiting. "Match to another Booking" finds a Booking by NHI and re-targets the row.
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
  with `lap appy ?conv to open` waits on Matching. Replay is a duplicate. MSG-CPH-2001 still
  dead-letters; fix the mapping to PID-3 and reprocess: a row lands on Matching. No "Manual
  intervention" wording remains.
- [ ] RV-28: fire each S13, S14 and S15 message (MSG-STG-1010 to MSG-STG-1014): every target
  Booking is unchanged (time, List, notes, wording, not cancelled), and a Reschedule, Modification or
  Cancellation row waits on Matching for each. On Diane Foster's Booking, Fire hospital message
  (MSG-STG-1012) adds no wording until its row is applied. No scripted beat in the run sheet or the
  Control Panel fires them.
- [ ] The Integrations simulator's pane 3 reads "Sent to matching" with the change type, the
  suggestion and the wording, and never "applied".
- [ ] The Demo actions pill is absent on Admin screens with no entries; the Control Panel lists the
  three Matching entries under Admin · Matching with an Open screen link, and the stand-in as "Shown
  in the installed PWA".
- [ ] PWA (`npm run build:pwa` and preview), after a reset: Mobile Lists shows the Demo chip; **Hospital
  row arrives and the office matches it, Sarah Mitchell** puts her on the Tue 28 Jul AM List with her
  wording as received; the choice is then disabled. On an ACTIVE St George's List, "A new hospital
  booking on this List" adds a synthetic patient. On Diane Foster's Booking, "A hospital update for
  this Booking, approved by the office" adds the hospital's long wording below `WLE MM`. "Fire
  hospital message" is no longer in the PWA sheet.
- [ ] S1 Beats 1 to 3 run from a reset as patched below; S4 Beat 4 and S5 Beat 2 run as patched.
- [ ] No en or em dash in any new copy, no "slot" in app copy (OQ-64: say session, AM or PM), no
  "blacklist", and no "DRAFT" for an assigned List; teal is the only action colour; no crimson on
  the new nav badge, pills, banner or buttons.
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
      (RVG) first in the list), leaving the procedure blank for Dr Souter; **Create Booking**; back to
      Mobile, reopen the Tue 28 Jul AM List. Handset variant: Mobile Lists, Demo, **Hospital row
      arrives and the office matches it** (the office then sets her Contract from the "Needs a
      Contract" card, or the presenter narrates it).
    - **Say:** "Hospital bookings are how most bookings reach AA today. They land on the matching
      screen with the hospital's wording exactly as sent, the office sees what each row would change,
      and nothing reaches the schedule until someone decides, even an update to a Booking already
      matched. This one is new, so it becomes a Booking on Dr Souter's List. The hospital does not
      choose the Contract; the office does, here or from its Needs a Contract list."
    - **Expected:** Sarah Mitchell as the fourth Booking at 08:30, source "Hospital download", her
      stack showing the wording as received and "Procedure to choose", her existing patient record
      reused, on the Contract the office picked. Remove any "on the hospital's default Contract"
      wording and replace the "near real time HL7 and FHIR" line; Phase 14's Future-scope caveat now
      only needs to say the simulator is not how S1 is shown.
    - Optional beat 1b: open R3 (Diane Foster) to show the side-by-side diff, the hospital's long
      wording to be added beside `WLE MM`, and untick a field; or import "St George's bookings, a day
      later" to show Sarah Mitchell's update waiting for approval, matched by date, surgeon, hospital
      and session.
    - Do not fire the S13 to S15 hospital messages in any beat (RV-28): automated changes are Future
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
  - **S4 Beat 4** becomes **"the unmatched queue"**: Click: Admin, Matching, Demo actions, Send
    unmatched row, New booking, no List yet; open it under Unmatched; Create a List in a session. Say:
    "Nothing from a hospital is ever dropped. A row that matches nothing waits here until someone
    decides: create the List, put the Booking on a Draft List for the office to fill, or reject it
    with a reason." Expected: the row in Unmatched with its wording, then the new List and Booking on
    the Day view and the row under Decided. Move the feed-mapping dead-letter to "What to narrate
    rather than click" as Future scope (HL7 v2).
  - **S4 Discovery points:** replace "how inbound messages targeting a submitted or authorised List
    are parked for manual intervention" with "a hospital row for a submitted List waits for the
    office, and one for an authorised List cannot be applied (what happens to a change arriving after
    submission is still to decide); applying hospital changes automatically is Future Work".
  - **S5 Beat 2** (MSG-STG-1002, the new-format NHI): Expected now reads "the message is sent to
    matching; the row on Admin, Matching shows the validated new-format NHI". Or point S5 Beat 2 at
    the Forte sheet's invalid-NHI row, whichever reads better; say which in the PROGRESS entry.
  - **Direct URLs:** add Matching `/admin/matching`.
  - **Recovery from demo accidents:** "Imported the same sample twice: nothing new is added. Applied
    the wrong row: fix the Booking by hand; the row's decision and any wording it added stay in the
    history."
  - **Discovery points** (S1): OQ-13 (how each hospital provides its bookings, the fields and
    cadence, and whether they carry the insurer, the procedure wording and an appointment id), OQ-99
    (leaving the procedure blank at setup), bulk apply, and AI-assisted matching later. If Greg's
    "why is this a manual task" comes up: the first release keeps the import gate with no automated
    decisions, and automatic matching and updates are Future Work (US-14.6.2).
- `docs/demo-guide/02-workflows-and-handoffs.md`: **Workflow 1** readiness line and triggers ("hospital
  bookings or a sheet arrive"); main path step 5 becomes "Hospital rows are matched on the matching
  screen: the office applies, creates (a Booking, a List, or a Draft List holding the Booking) or
  rejects each one, and sets the procedure and Contract there or from Needs a Contract; anaesthetists
  and the office change Bookings directly while the List is ACTIVE"; add the matching-screen handoff
  (office to anaesthetist: the Booking appears on her List with the hospital's wording). **Integration
  failure** becomes "Hospital rows": an unmatched row waits in the unmatched queue; a duplicate row is
  skipped; a later update waits for approval, matched by date, surgeon, hospital and session; a row
  for a submitted List waits for the office; a row for an authorised List cannot be applied. The HL7
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
  Matching, Demo actions, Send unmatched row; S5's MSG-STG-1002 line says it is sent to matching.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 33` first: earlier phases (20a above all)
may have changed these recipes since this plan was written. The harness bar is hidden in shots, so
recipes stage rows through the product's Import hospital bookings dialog (the badged sample picker);
for the bar-only triggers ("Send unmatched row", "Send update for a matched Booking", "Reschedule to a
date with no List") use the matching `/demo/control` entry in `setup`, as ATLAS.md's Shell notes say.
Several current captions describe old behaviour (a surgeon PDF analogue, messages "held for manual
intervention", a message applied by itself); replace each when its recipe is updated. This section
is work item 15's full form; work item 15 stays as its short list.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md) Import hospital bookings | partial · admin-surgeon-pdf-import[inbox,review-rows] | captured. Re-shoot on `/admin/matching` (admin): `matching-import` open (the Sample file dialog listing the four samples: St George's, St George's a day later, Southern Cross and Forte) and the landed rows (`matching-table` after importing `SAMPLE_STG`, "5 rows imported from St George's", the "Procedure as received" column visible). The surgeon PDF shots go: surgeon PDF ingest is Future Work (US-02.2.1), so it is no longer an analogue. Drop the partial reason. Replace both stale captions ("Surgeon PDF inbox, the nearest analogue to a booking download"; "Extracted rows reviewed beside the PDF before ingesting") with "Hospital bookings imported from a sample file" and "Each imported row lands on the matching screen with its procedure text as received" |
| [US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) Match rows to Lists and Bookings | partial · admin-pdf-row-matching | captured (admin). Add `as-received` first (the table and Sarah Mitchell's panel with `lap appy ?conv to open` exactly as sent; highlight `matching-received`; caption "Each row shows its procedure text exactly as the hospital sent it", the new criterion). Then shots on the row panel (`matching-decision`): `match` (Match and apply on the suggested row), `create-booking` (Create a Booking on a List picker, with the stack preview and Choose Contract), `create-list` (Create a List in a session, tier-ordered candidates), `create-draft` (Create a Draft List holding the row's Booking), `reject` (reason required, quick reasons). Drop the PDF matching shot (Future Work), its stale caption ("Surgeon PDF rows matched to a target List, an existing Booking is updated rather than duplicated") and the partial reason |
| [US-02.1.3](../../../../requirements-board/requirements/stories/US-02.1.3.md) Show differences on match | absent | captured (admin). Import `SAMPLE_STG`, open R3 (Diane Foster's Modification): `diff` with time, wording ("Add beside the current text") and note in warning tint side by side (`matching-diff`), and `diff-unticked` with the note unticked and the footer label counting 2 changes. Add `matched-update`: after R1 is applied, import `SAMPLE_STG_UPDATE` and open its row, a Modification of the Booking R1 created, "Matched by date, surgeon, hospital and session, then NHI", waiting for approval. Caption: "Field-level differences shown before they are applied, including a later update matched by date, surgeon, location and session". Remove the absent reason |
| [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) Unmatched queue | partial · admin-needs-attention-queue | captured (admin). Import `SAMPLE_FORTE_SHEET`, switch the filter to Unmatched (`matching-unmatched`): R3 waits with its reason "No List at Forte Health ...", and the nav badge is amber. Add a `decided` state after Create Draft List shows the row left the queue with nothing dropped. Retire the old integration-log shot (its S14 manual-intervention message no longer exists) and its stale caption ("Messages that could not be applied, held for manual intervention"); new caption "Rows that match nothing wait in the unmatched queue until the office decides". Drop the partial reason |
| [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) Automatic sync from St George's and Southern Cross | absent (placeholder: "Not built yet: catch-up Phase 34 builds this.") | partial (admin). Shot `rows-wait-for-decision`: after importing `SAMPLE_STG`, the Open table with the "Nothing changes the schedule until you decide" header line, and the Booking R3 targets unchanged (second state on Diane Foster's Booking, still holding only `WLE MM`). `absentReason`: "Rows wait for the admin's decision, so No silent apply is shown. Bringing St George's and Southern Cross rows in without a hand import is built in Phase 34." Phase 34 turns it to captured |
| [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md) Read, correct and ingest a surgeon PDF list | captured · admin-surgeon-pdf[inbox,extracted] | unchanged by this phase; Future Work. The Surgeon PDFs inbox stays on `/admin/integrations`; re-check the shot still passes after the Integrations tabs change. Phase 34 badges the tab Future scope (RV-26) |
| [US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md) Create or amend a Booking | partial · admin-phone-advice-booking[free-list,form], admin-amend-booking | stays partial. This phase creates Bookings on booked Lists only through a matched row, shown in the US-02.1.2 `create-booking` shot. Reword the reason: the office adding a Booking to a List that already has one by hand, with its optional "as given", is Phase 35 |
| [US-02.3.2](../../../../requirements-board/requirements/stories/US-02.3.2.md) Save Booking changes explicitly | absent (placeholder) | unchanged: absent until Phase 35. No shots |
| [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md) Draft a booking update email | absent (placeholder) | unchanged: absent until Phase 35 (the on-demand update email, D19, manual only). No shots |
| [US-02.3.4](../../../../requirements-board/requirements/stories/US-02.3.4.md) Update email templates per kind of change | none (create it) | create it as absent if no earlier phase did: "Update email templates per kind of change are built in Phase 35." No shots |
| [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking, manually or from a photo | captured · web-add-card[choose,manual], mobile-add-card[choose,manual] | unchanged (Phase 15b re-shot it without photo capture; Phase 20a added the "as given" state). Check it still passes (web and mobile) |
| [US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md) Add a Booking from a photo of the booking card | none (create it); Phase 15b may have created it | Future Work. If no earlier phase left a recipe, create it as absent: "Future Work: a booking from a photo of the booking card is not part of the first release." No shots |
| [US-02.5.1](../../../../requirements-board/requirements/stories/US-02.5.1.md) Apply a modification | captured · simulator-inbound-message[received,applied], admin-card-history | partial (Future Work: the automated path). Re-shoot as the first-release analogue: the Modification row (R3, Diane Foster) on the matching screen before apply (`received`), then after the office applies it the changed Booking and its History lines "Hospital row applied" and "Wording added as received" (admin `card-history`, applied through the store setup, not a replay). `absentReason`: "Automated application from an integration is Future Work (US-14.6.2). In the first release the office applies a hospital modification on the matching screen, shown here." Drop the simulator "applied" shot (RV-28) and its caption ("Modification applied to the existing Booking"); replace "Hospital modification message received (new time and a booking office note)" with "A hospital modification waits on the matching screen with its differences" and caption the History "The office applied it: the History records who, when, the hospital row and what changed" |
| [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md) Apply a reschedule | captured · simulator-inbound-message[received,applied], web-rescheduled-card | partial (Future Work: the automated path, with its clash rule, OQ-87). Re-shoot as the analogue: the Reschedule row (R4) on the matching screen (`received`), the Booking moved by the office onto the web List (`/web/lists/<new list>`) with its History intact (`applied`), and the "no List there yet" Reschedule waiting as unmatched in a third state. `absentReason`: "Automated reschedules, and a clash becoming a Draft List with no admin, are Future Work. In the first release the office decides each reschedule on the matching screen." Drop the simulator "applied" shot and its caption ("Reschedule applied, the Booking moves to the new List"); captions now "A hospital reschedule waits on the matching screen", "Moved by the office onto the new List, its History intact" and "A reschedule to a day with no List waits in the unmatched queue" |
| [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md) Record a cancellation | captured · simulator-inbound-message[received,applied], web-cancelled-card | partial (Future Work: the automated path). Re-shoot as the analogue: the Cancellation row (R5) on the matching screen (`received`), then the Booking the office cancelled kept visible on the web List, marked cancelled (`applied`). `absentReason`: "Automated cancellation from an integration is Future Work. In the first release the office records a hospital cancellation on the matching screen." Drop the simulator "applied" shot and its caption ("Cancellation applied, the Booking is soft-cancelled"); captions now "A hospital cancellation waits on the matching screen" and "Cancelled by the office, the Booking stays visible on the List" |
| [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) Changes accepted until the procedure | partial · simulator-change-cutoff | stays partial (Future Work: the automated path), re-shot on the matching screen (admin): a row for a submitted List (MSG-STG-1014, "List submitted") that the office can still apply, beside a row for an authorised List (`SAMPLE_SX` R3) with its flag and the disabled apply ("This List is authorised and locked"). Reword the reason: "Automated changes, and their lock once the List is submitted, are Future Work. In the first release every hospital change waits for the office, who may apply it until the List is authorised." The "parks for manual intervention" wording goes, and the caption "A change to a submitted List is held for manual intervention" becomes "A change to a submitted List waits for the office; one to an authorised List cannot be applied" |
| [US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md) Append-only change history | captured · admin-card-history, admin-audit-log | unchanged. Check the History now names the hospital row, the office who applied it and the wording added, for a Booking created or changed from one; no new shot required |
| [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md) Concurrent edits | absent | stays absent; reword the reason: "Future Work: concurrent edits between an automated update and a person." Nothing visible here |
| [US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) Keep the procedure text as received | none at plan time; Phase 20a creates it captured (`source-wording[rooms,hospital-update]`, `source-wording-two-sources`) | stays captured. Its `hospital-update` state fired MSG-STG-1012, which now only stages a row: re-point its `setup` to stage Foster's update (the `matching-send-update` Control Panel entry, or `SAMPLE_STG` R3) and apply it on Admin, Matching, then shoot the Booking on web, mobile and admin as before. Caption: "A later hospital update, approved on the matching screen, is added beside it, never overwriting it". Add a state `matching-row` on the row panel (the wording to be added beside `WLE MM`, highlight `matching-diff`). If 20a left no recipe, create it as 20a's table describes, with this re-point |

**Recipes this phase completes.**
- `US-03.1.9` (Source wording, procedure and Contract shown together): Phase 20a creates it partial
  with "The hospital matching screen does not exist yet: Phase 33 adds the stack to each row." Turn
  it to captured: add shot `matching-stack` on `/admin/matching` (Sarah Mitchell's row panel after
  Choose Contract: the wording as received, "Procedure to choose", then the Contract; highlight
  `matching-stack`; caption "The matching screen shows each Procedure as received, then the
  procedure, then the Contract") and drop the `absentReason`.

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
- `US-02.5.7` (20a): the `hospital-update` trigger step. Re-pointed above.
- `US-04.3.4` (20's `needs-contract` state): a Booking created from a row now also lands on the card;
  check the shot still passes from a reset (no row is imported in its setup) and re-point only if it
  pins a row count.
- `US-14.1.1` (Future): `hl7-siu-message` state `applied` reads the schedule-change pane, which now
  says "Sent to matching"; keep the shot and highlight the same pane. Both its captions read
  "Inbound HL7 SIU message, translated to FHIR and applied to the schedule"; replace them with
  "Inbound HL7 SIU message, translated to FHIR · received" and "... · staged on the matching screen,
  nothing applied". `message-log` (setup replays one message) keeps working; check the log wording.
- `US-14.5.1`: `dead-letter` still dead-letters (MSG-CPH-2001); check only. `US-14.2.1`, `US-14.3.1`
  (the FHIR model and the live feed): check the live-feed result text, which now says rows were sent
  to matching. Phase 34 moves all of these to the Future-scope surface and re-points them again.
- `US-02.2.2`, `FT-02.2`, `US-11.1.2` use `/admin/integrations` tabs (Surgeon PDFs, Validators):
  unchanged here; check they pass.
- Anything else that opens `/admin/integrations` or `/demo/integrations`, or fires "Fire hospital
  message" from a Booking route: the `--dry` run is the check.

**ATLAS.md.** Update Routes (`/admin/matching`, the Matching nav item and its amber badge), Existing
hooks (`matching-import`, `matching-stats`, `matching-table`, `matching-row-<n>`, `matching-received`,
`matching-diff`, `matching-stack`, `matching-decision`, `matching-apply`, `matching-banner`,
`matching-unmatched`), Overlays (the Import hospital bookings dialog; the procedure and Contract
pickers opened from the row panel), the Integration simulator description (messages stage rows; the
S14 locked-target label and "manual intervention" are gone; S13 to S15 never apply; MSG-STG-1012's
wording arrives only through its row), the trigger list (the three Matching entries; "Fire hospital
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
  `createBooking`, `editBooking`, `editPatient`, `editProcedure`, `addSourceText`, `pickProcedure`,
  `setProcedureContract`, `setInsuranceIndication`, `reassignBooking` and `cancelBooking` reachable
  from `integrationActions.ts`, the fixtures and the trigger bodies: the only path from a hospital row
  to the schedule is `decideImportRow`, and only with an explicit decision (the PWA stand-in
  included, with no picks). Every canned message, S13 to S15 included, leaves the schedule and every
  source text byte-identical (RV-28). An update to an already matched Booking is never applied
  because it matched before: it is diffed and waits like any other row (US-02.1.3).
- **The match key is US-02.1.3's.** `findMatch` finds the List by date, surgeon, hospital and session
  and then the patient; the appointment id is only a reschedule fallback and a dedupe key; nothing
  matches by name alone across Lists; the key lives in that one function with its tests.
- **The wording is kept as received.** Every row's wording reaches the Procedure verbatim (no trim,
  no case change), through `createBooking`'s source text or `addSourceText` only, beside earlier
  texts and never replacing them; a replay adds nothing; `correctImportRow` cannot touch it; the
  wording never sets or changes a procedure pick or a Contract; the table and panel show it exactly
  as stored.
- **No Contract or procedure from a row.** No suggestion, trigger body or stand-in carries a
  procedure or Contract pick; a created Booking with no office pick has no Contract and appears on
  "Needs a Contract"; no default Contract exists or is reintroduced (OQ-78); the picker offers No
  contract (RVG) first through 20's module; a pick goes through `setProcedureContract`'s or
  `createBooking`'s checks only.
- **Nothing is dropped.** A row that matches nothing, a reschedule to a date with no List, a
  modification for an unknown Booking all stay open and visible; "unmatched" is derived, so no code
  path can clear it without a decision. A Draft List created from a row holds the row's Booking
  (OQ-44), so no row is left waiting on one, and a failed second step leaves the row open. A skipped
  re-import is counted and said.
- **A missing field is never a change.** No incoming "not supplied" value blanks a Booking field; the
  diff, the classifier and the apply agree on this.
- **Who is billed is untouched.** No decision writes a billable party, a payer or a Procedure insurer;
  the row's insurer becomes an insurance indication only through Phase 21's setter when ticked, and
  never decides who is billed (D17, D28).
- **The Draft List rules hold.** `createDraft` never saves without hospital, surgeon, day and
  session, takes no Slot or anaesthetist, and puts the Booking on the Draft List through Phase 31's
  path, not a second copy.
- **Atomic decisions.** Pre-check then refusable-first: a refused move, a locked List, a stale
  suggestion, an invalid NHI, a refused pick or a missing procedure leaves the row open and the
  schedule unchanged. The decision and its Booking-side history row land in one commit. Look for
  races: the clock passing the session, the List being submitted or authorised, the Booking
  cancelled or moved by hand between suggestion and apply.
- **One set of rules.** Created Bookings go through `createBooking` (`source: 'hospitalDownload'`,
  `upsertPatient` dedupe, the source text, 21's payer); new Lists through `assignListToSlot`
  (not-preferred warning and acknowledgement, conflicts, pairing); Draft Lists through Phase 31's
  action; reschedules through `reassignBooking` (no prepayment re-check, D20); the stack through 20a's
  `procedureStackView`. No second copy of any of them in `matchingActions.ts` or the screen.
- **The matcher is pure and deterministic.** No store, React, `Date.now()`, `new Date()` or
  `Math.random()` in `src/domain/intake/`; trigger dates come from the demo clock; the fixtures are
  synthetic, their wording from AR-35, and pinned by tests.
- **Future scope stays badged and inert.** The HL7/FHIR entries are bar only and badged; no
  `manualIntervention` value, chip or copy remains; the simulator never says a message "applied";
  no run-sheet beat, Control Panel scenario or capture recipe shows S13 to S15 changing a Booking
  by itself; nothing builds US-02.5.2's automated clash-to-Draft-List rule.
- **Triggers and PWA purity.** The three Matching entries are bar only and scoped to
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
  themselves"): the defaults built for open questions (the labelled sample files while OQ-13 is
  open; D33's blank procedure at setup, OQ-99; a row for a submitted List applied by the office until
  AUTHORISED, AR-21 `open-after-submit` undecided; the appointment id used only as a reschedule
  fallback where US-02.1.3 names date, surgeon, location and session; the "Session has started" flag
  not built, since US-02.5.4 ties the lock to submission; the `hospitalSheet` source-text channel
  added for a manual sheet), anything logged rather than fixed (any covered item that left the
  Future Work lane), and the screens worth a look, each with its route and persona (Admin, Matching
  `/admin/matching` as Kirsty W.; the Booking History and stack of a row-created Booking; Mobile Lists
  Tue 28 Jul AM as Dr Souter; Diane Foster's Booking after the update).
- **Status row** for catch-up Phase 33, and a phase entry with:
  - the drift-check result against `60e2d1e` (items changed or not; OQ-13, OQ-99 and FT-02.1 status;
    OQ-44 and OQ-78 built as answered, with how the Booking is put on the Draft List; D17 and D28 as
    built; whether 21, 23, 25 and 27 were DONE and which fallbacks were used; US-02.5.1 to US-02.5.4
    still Future Work and not built);
  - what was built, and what was removed (`applyEffect` with 20a's feed wording appends, the park
    codes, `manualIntervention`, the Phase 28 park-on-no-List seam, `resultBookingId`);
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
     US-14.6.2) and leave the demo (RV-28). `manualIntervention` is retired. MSH-10 dedupe, the
     transient retry and the mapping dead-letter stay, as Future-scope tooling, until Phase 34.
  2. Matching suggestions, the unmatched queue and the change type are **derived** at read time from
     the row and the current schedule, never stored; only the incoming fields, office corrections and
     the decision are stored. An update to an already matched Booking is matched and approved like
     any other row (US-02.1.3).
  3. **The match key** is US-02.1.3's: the List by date, surgeon, hospital and session, then the
     patient (NHI, else name and date of birth). A reschedule is found by the patient's NHI on another
     of the hospital's Bookings, or by the hospital's appointment id when it sends one (OQ-13 open);
     never by name alone across Lists.
  4. A field the hospital did not supply is never a change (OQ-13's "sometimes do not come
     through"). A hospital note is appended, never overwritten. An NHI difference is shown, never
     applied. **The hospital's procedure wording is kept as received** and added beside the
     Procedure's earlier texts (US-02.5.7); it is never corrected and never changes the procedure
     pick or the Contract.
  5. A hospital row never sets a procedure or a Contract (US-04.3.6 Future Work; OQ-78: no default
     Contract): a created Booking has neither unless the office picks them in the panel, and waits on
     "Needs a Contract" (US-04.3.4; D33's blank procedure, OQ-99 open). The hospital's insurer is
     shown, and becomes the Booking's insurance indication only when the office ticks it (D28, Phase
     21); who is billed comes from the Contract's holder or the payer on the Booking (D17).
  6. "Create a Draft List" from a row creates it with all four of hospital, surgeon, day and session
     and puts the row's Booking on it in the same decision (US-02.1.2's own decision; contents per
     OQ-44 and US-01.6.1); a row never waits on a Draft List.
  7. The admin may match a Reschedule row onto another anaesthetist's List; a reschedule with no
     target List parks as unmatched (US-02.1.4). This replaces the Phase 11 behaviour that retimed in
     place. US-02.5.2's automated rule (a clash accepted as a Draft List with no admin, OQ-87) is
     Future Work and not built. A hospital reschedule runs no prepayment re-check (D20).
  8. Every hospital-pathway channel (import, manual sheet, feed message) stamps `source:
     'hospitalDownload'`; the channel lives on the row, on the source text (`hospitalDownload`,
     `hospitalSheet`, `hospitalFeed`) and in the Booking's History.
  9. The samples are labelled fixtures while OQ-13 (how each hospital provides its bookings) is
     open; their wording is AR-35's illustrative wording, not AA's; app copy says "import", per
     US-02.1.1's retitle.
  10. A row's surgeon resolves by HPI CPN first, then by name (OQ-52); `createList` and `createDraft`
      need a resolved or admin-picked surgeon, and "Create a List in a session" shows Phase 17's
      tier-ordered candidates and soft not-preferred warning (D44).
- **Handoff notes:**
  - For **34**: `stageImportRows` is the entry point a sync or a delivered sheet calls; there is no
    sync state to add (US-02.1.5 dropped it); the manual-sheet auto-match toggle should call
    `decideImportRow` with the suggestion and no procedure or Contract pick, never a write path
    directly; the button is "Import hospital bookings" and `importHospitalDownload` keeps its name;
    demote the simulator and hide the monitor's Future tabs; rebuild S1 from this phase's Beat 1,
    around the sync, the match, the wording as received and the office's Contract choice.
  - For **35**: the on-demand update email (D19, manual only) picks changes from the Booking's change
    history, and a decided row's `booking.fromHospitalRow` entry (with `fieldsApplied`) is one of the
    changes it can pick, sent to the surgeon's rooms or the hospital from the per-kind template
    (US-02.3.4). Adding a Booking to a booked List by hand reuses 20a's "as given". Concurrent edits
    (US-02.5.6) are Future Work.
  - For **40**: register the unpaid-balance alert (US-11.3.2: mild under, strong over the threshold
    counted from the invoice date, mild for a credit balance, always waved through; D24) as a Phase
    15a warning rule and show it in the row panel at create and match; NHI attach and merge replace
    the "NHI differs" dead end; the "No NHI supplied" pill is where the missing-NHI problem list
    starts (OQ-49, D11, leaning to a mandatory NHI).
  - For **41**: a hospital reschedule moves a Booking through `reassignBooking`; if the payee repoint
    hooks that path, it follows here too.
  - For **42 and 43**: the samples are not master data; 43's restricted raw-row view can read
    `ImportRow.incoming`, and its generator, if it makes import rows, builds them through
    `stageImportRows` with AR-35-style wording.
  - For **44**: S1 Beats 1 and 2, S4 Beat 4 and S5 Beat 2 were patched, not rewritten; keep S13 to
    S15 out of the rewrite (RV-28); the PWA parity audit should walk S1 and the Foster wording beat on
    a handset with the stand-in.
