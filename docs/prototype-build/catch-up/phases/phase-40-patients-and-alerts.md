# Phase 40 · Patients: mandatory NHI, balance warning, patient view

**Requirements covered:**
[EP-11](../../../../requirements-board/requirements/stories/EP-11.md) Patients and billable parties (closes here) ·
[FT-11.3](../../../../requirements-board/requirements/stories/FT-11.3.md) Patient outstanding balances and alerts (now: a mild alert under the threshold, a strong one over it, a mild one for a credit balance) ·
[US-11.1.1](../../../../requirements-board/requirements/stories/US-11.1.1.md) Patient record keyed on NHI (reworked 2026-10-16 and 19: **the NHI is the patient identifier throughout, with no blank**; one record per NHI; any internal id is only an implementation detail; the NHI never reaches Xero) ·
[US-11.1.4](../../../../requirements-board/requirements/stories/US-11.1.4.md) Patient without NHI (reworked: **the NHI is mandatory, a Booking cannot be saved without one, an incoming booking without one waits at intake and creates no Booking and no patient**) ·
[US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md) Intake rows waiting for an NHI (retitled from "Missing NHI problem list": the office's view over Phase 33's unmatched queue) ·
[US-11.3.1](../../../../requirements-board/requirements/stories/US-11.3.1.md) Patient outstanding bills view ·
[US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md) Alert on booking a patient with unpaid bills (Verify, "still to check with Ben"; OQ-74's answer: days from the invoice date, a credit balance is mild, yellow versus red; **at `d4db277` it says the threshold is fixed until AA asks for a settings page**) ·
[US-11.3.3](../../../../requirements-board/requirements/stories/US-11.3.3.md) Follow-up tools ·
[US-13.2.2](../../../../requirements-board/requirements/stories/US-13.2.2.md) Per-patient balance (attributed to the patient whoever pays) ·
[US-03.1.5](../../../../requirements-board/requirements/stories/US-03.1.5.md) Anaesthetist sees the patient's NHI (always present now; no "NHI missing" state) ·
[DM-30](../analysis/domain-model-delta.md#dm-30) (NHI mandatory, waiting rows) ·
[RV-20](../analysis/reverse-check.md#rv-20-a-patient-without-an-nhi-is-allowed-provisional-record-nhi-pending) (the provisional patient and "NHI pending") ·
[RV-36](../analysis/reverse-check.md#rv-36-prior-balance-tag-has-no-threshold-and-sits-on-the-billing-monitor-after-authorisation) (the "Prior balance" tag with no threshold; it was RV-21 until the `d4db277` renumbering, and the old RV-21 is now a different item).
This phase also builds the patient-side remainder of [DM-23](../analysis/domain-model-delta.md#dm-23)
(Phase 36 covers the rest): the per-patient view, the balance warning and its threshold, and the
**follow-up actions and invoice re-send** (the former DM-47, merged into DM-23).
Read alongside (not closed here):
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) (the payer on the Booking, Phase 21's, which the warning's payer gate reads),
[FT-11.1](../../../../requirements-board/requirements/stories/FT-11.1.md),
[US-11.1.2](../../../../requirements-board/requirements/stories/US-11.1.2.md) (the NHI validators, kept under Admin Intake by 34),
[US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) and [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) (33's rows and unmatched queue, where a row with no NHI waits),
[FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md) and [US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md) to [US-13.7.3](../../../../requirements-board/requirements/stories/US-13.7.3.md) (15a's routine, which this phase registers a rule in),
[US-13.7.4](../../../../requirements-board/requirements/stories/US-13.7.4.md) (the warnings settings page: **Future**),
[US-15.0.6](../../../../requirements-board/requirements/stories/US-15.0.6.md) (data minimisation: why the balance warning is office-only),
[OQ-49](../../../../requirements-board/requirements/questions/OQ-49.md) (**Answered** 2026-10-16 and 19, owner decision **D11**: NHI mandatory, no blank),
[OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) (the Contract bills its holder when the holder pays AA, otherwise the payer on the Booking),
[OQ-41](../../../../requirements-board/requirements/questions/OQ-41.md) and [OQ-74](../../../../requirements-board/requirements/questions/OQ-74.md) (answered; **D24**),
[OQ-30](../../../../requirements-board/requirements/questions/OQ-30.md) (answered: no NHI or PII in Xero, only a unique id),
[OQ-33](../../../../requirements-board/requirements/questions/OQ-33.md) (90 days), and the "Patient and billable party" and "Warnings" sections of [domain-model.md](../../../../requirements-board/requirements/domain-model.md).

**Depends on:** 15a (`WarningRule`, `WarningFacts`, `WARNING_RULES`, `evaluateWarnings`,
`appSettings.warningRules` and its backfill, `warningFactsFor`, `warningsForBooking`, `openWarnings`,
`clearWarning`, the to-do list, `WarningTriangle`, `WarningsPanel`, `WARNING_SAMPLES`,
`SEED_WARNING_SAMPLE_BOOKINGS`), 33 and 34 (the rows: `ImportRow` with `corrections`,
`correctImportRow`, `suggestDecision`'s derived `waitingForNhi`, `matchingQueue`, `decideImportRow`,
`stageImportRows`, `importHospitalDownload`, `HOSPITAL_DOWNLOAD_SAMPLES`; 34's rebuilt S1 where Sarah
Mitchell's St George's row is matched and created), 36 (`patientPosition` and `patientLedgerPosition`:
rows carry the billable party and a signed outstanding) and 39 (a credited pair owes nothing and holds
`credit.heldForPayer`, which is where a patient's **credit balance** comes from; this includes the
anaesthetist's own credit note, US-08.6.5). By the roadmap order 14 (the trigger registry,
`OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`, `store/officeStandIn.ts`), 15 (`createBooking`,
`ManualBookingForm`, `AddBookingFlow`), 15b (an assigned List is ACTIVE, never "DRAFT"), 17 (surgeons'
rooms with a contact email and phone, the hospital contact email), 20a (`Procedure.sourceTexts`, the
three-part stack), 21 (`Booking.payer` (`BookingPayer`), `setBookingPayer`, `CounterpartyKind`
`'payer'`, `billablePartyForProcedure`, `isPayerBilled`, the child-payer rule), 22 (`resendInvoice` and
its send history), 27 (the prepayment pair created at generation), 31, 35 (`mailto` builder in
`src/domain/updateEmail.ts`, as-at views), 38a (`src/domain/bookingSearch.ts`, `patientMatches`) and 38b.
**Estimated:** 2 sessions, the upper limit. If session 2 cannot finish, stop green after item 14,
tell the user what remains and let them decide whether to split it; never cut coverage silently.
Session 1: items 1 to 10 (rule and threshold, pure rules, model, mandatory NHI at every create path,
the waiting-row actions, the balance stamps, selectors, seed, tests), ending green with the UI edited
only as far as it must compile. Session 2: items 11 to 19 (the Admin Patients screens, forms and
wording, surfaces, triggers, shots, guide).

## Goal

Admin gets a **patient record**, and the NHI becomes the patient's identifier everywhere. Today the
prototype lets a Booking go ahead with no NHI (a provisional patient shown as "NHI pending"), shows
patient money only as a boolean "Prior balance" pill on the Billing monitor, and has no patient screen.

This phase:

- makes the **NHI mandatory** (OQ-49 answered, D11: DM-30, RV-20, US-11.1.1, US-11.1.4, US-03.1.5).
  `Patient.nhi` becomes required; one record per NHI. **Every create path refuses to save without a
  valid NHI**: the anaesthetist's mobile and web add-booking forms, Admin's phone-advice form, and the
  surgeon PDF ingest, all through one guard in `createBooking`. The provisional patient,
  `createdProvisional`, the "NHI pending" and "NHI missing" labels, and the authorise block all go. The
  seeded provisional patient (PT0010 Noah Prescott) is given an NHI and his scenario link re-seeded. An
  incoming booking without an NHI **waits on 33's unmatched queue** and makes no Booking and no
  patient. The internal patient id stays the store key and Xero's only patient reference (OQ-30) but is
  never shown: the UI and the patient route use the NHI;
- builds the office's view of **intake rows waiting for an NHI** (US-11.1.5): each row shows the
  patient as received, the List or date, and the surgeon's rooms to chase, marks the ones whose date is
  close as urgent, and **Add NHI** (typed, validated, with a preview of the existing record it matches)
  releases the row so 33 matches it to the single record or creates the one new record. Nothing is
  applied without the office's decision. There is no authorise guard;
- adds **Admin · Patients**: search by name, NHI or date of birth, and a **patient record**: details
  (NHI as identifier, **ethnicity** shown and editable as an NZHIS Level 4 code, "Details differ"
  prompt when an NHI returns with different details, held for review, never silently written over),
  **every invoice across every anaesthetist and every payer** marked paid, part paid, unpaid or
  credited (US-11.3.1), the **balance attributed to the patient whoever pays**, net of credits, with a
  by-payer breakdown (US-13.2.2), all read from 36's ledger, and **follow-up actions**: log a call,
  add a note, set a reminder, and re-send an invoice through 22's `resendInvoice`, which keeps a send
  history (US-11.3.3);
- registers a **patient balance** rule in 15a's routine (US-11.3.2, RV-36, D24). When a Booking is
  created or matched for a patient who is the **payer on the Booking** (`Booking.payer.kind ===
  'patient'`) and who owes AA money on invoices billed to them, the Booking carries a before-procedure
  warning: **mild** (yellow) while the oldest unpaid invoice is within the threshold, **strong** (red)
  once older, counted from the **invoice date** (90 days to start), and **mild** for a patient in credit.
  It never blocks; the office clears it from 15a's to-do list. It is an **office warning**: the
  anaesthetist apps never show patient money. It replaces the Billing monitor's "Prior balance" tag;
- gives the admin **one threshold field**, "Patient balance warning after N days", in Master data (the
  outline's call, kept: US-11.3.2 now says the threshold is fixed until AA asks for a settings page, so
  the field is a demo convenience, not a catalogue criterion; logged on the owner's list). It is not the
  settings page US-13.7.4 keeps for Future Work.

New stored state: `Booking.balanceCheck`, a `patientCare` slice (follow-ups), `Patient.pendingDetails`,
and the `patientBalance` entry in 15a's `appSettings`. `Patient.nhi` is now required and PT0010 gets
an NHI, so `PERSIST_VERSION` is bumped. Nothing here touches the pricing model: the phase only reads
who was billed.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `d4db277` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff EP-11,FT-11.1,FT-11.3,US-11.1.1,US-11.1.4,US-11.1.5,US-11.3.1,US-11.3.2,US-11.3.3,US-13.2.2,US-03.1.5,US-02.1.2,US-02.1.4,US-11.2.2,US-11.1.2,FT-13.7,US-13.7.1,US-13.7.2,US-13.7.3,US-13.7.4,US-15.0.6,OQ-49,OQ-41,OQ-74,OQ-30,OQ-33,OQ-67
   ```

   Already folded into this plan (the `d4db277` to `d4db277` changes, so not drift):
   - **D11 / OQ-49 answered (16 and 19 October):** the NHI is mandatory with no blank and no pending
     state; an incoming row without one waits on 33's queue; the earlier problem list of Bookings,
     the provisional patient and the authorise block are dropped. US-11.1.1 now makes the NHI the
     identifier throughout and says any internal id is an implementation detail; US-11.1.5 is retitled
     "Intake rows waiting for an NHI"; US-03.1.5 drops "NHI missing".
   - **US-11.3.2 / FT-11.3 / EP-11:** a mild alert under the threshold, a strong one over it, a mild
     one for credit; US-11.3.2 now says the threshold is **fixed until a settings page** and has no
     "admin changes the threshold" criterion (see item 1).
   - Earlier and still in force: the payer on the Booking (21, OQ-67: the Contract bills its holder
     when the holder pays AA, otherwise the payer on the Booking; no `Procedure.payer`), DM-47 merged
     into DM-23, ACTIVE Lists (15b), 20a's source wording, 27's prepayment pair at generation, 39's
     credits (including the anaesthetist's own credit note), OQ-74 answered (no "provisional (OQ-74)"
     caption anywhere).

   If an item changed after `d4db277`, re-read it and adjust the work items; re-run the gap analysis for
   that item only, per `../README.md`. If an item is now Retired or Future, drop the work items that
   serve only it and note it in PROGRESS.md. Record the result in the phase entry.
2. **D11 is answered: build it, no default and no caption.** Check OQ-49 still reads mandatory. No
   "provisional" label anywhere for it.
3. **US-11.3.2 (Verify), OQ-41 and OQ-74.** Build both answers: the age counts from the **invoice date**
   (`invoiceAgeDays`, the only place the basis lives) and a **credit balance is a mild warning**. If Ben
   sets a different starting threshold, change only the rule's `defaultParams`. Record in the Decisions
   log, in two halves in the one rule file:
   - **Which earlier invoices count:** only receivables billed to the patient themself
     (counterparty `{ kind: 'patient', id }`). Hospital, insurer, ACC, other holder (`kind:
     'billableParty'`) and named-payer (`kind: 'payer'`, a guardian) invoices count toward the record's
     patient-centric **balance** (US-13.2.2) but not toward the **warning**.
   - **Which new Bookings are checked:** only one whose **payer on the Booking** is the patient. A
     guardian as payer raises no balance warning; evaluation is live, so `setBookingPayer` adds or
     removes it. The Contract does **not** gate it (at create or match time the Contract is often
     unchosen, D33). If AA wants it only when this Booking also bills the patient, add `isPayerBilled`
     to the one condition.
   - **Office audience against US-13.7.3** (flag for the owner): the balance rule is office-only
     (`audience: 'office'`), because US-11.3.2 alerts "AA staff" and the anaesthetist never sees patient
     money (US-15.0.6). Every other rule keeps `'all'`.
   - **The warning kind** (US-13.7.1 leaves it unset): `beforeProcedure`, in the one rule file.
   - **The threshold field against US-11.3.2 (fixed until a settings page) and US-13.7.4 (Future):** build
     the one Master data field and nothing else of the settings page; log the tension. If the owner
     prefers it fixed, drop item 12's Master data view and item 1's setter.
4. **One label, none for "missing".** The NHI is always present on a Booking, so `nhiBadge` renders the
   NHI only and the strings "NHI pending" and "NHI missing" must not exist in the app. The waiting view
   says "Waiting for an NHI".
5. **No standalone "New patient" form.** US-11.1.4's earlier "create a patient before the NHI is known"
   is dropped with the provisional patient; a patient record exists only with an NHI, made by a Booking.
6. **OQ-30:** the NHI never reaches Xero; `xeroNhi.test.ts` stays green. Nothing new sends it anywhere.
7. **Confirm the dependencies are DONE** and read their PROGRESS entries for the real names this doc
   anticipates, notably 33's `correctImportRow`, `suggestDecision`'s `waitingForNhi`, `matchingQueue`,
   its List-finding step (date, surgeon, hospital, session), its surgeon resolution (HPI CPN, then
   name) and `decideImportRow`'s `nhiRequired` and apply-to-existing branches; 15a's rule and warning
   names; 21's payer names; 22's send history (if it does not keep every send, extend it here rather than
   adding a second record); 36's `patientLedgerPosition` row fields (extend the selector if a field is
   missing, never join through `state.xero`); 39's `credit.heldForPayer`; 38a's `patientMatches` and NHI
   normalisation; 35's `mailto` builder and `MAILTO_MAX_LENGTH`; 14's actors; the current
   `PERSIST_VERSION` (16 after 15a; later phases bump it).

## Reference

**Design files** (convention 17: authoritative):
- [Design Language.dc.html](../../../design/Design%20Language.dc.html): tokens, the `warning` and `error`
  tints (mild and strong, as 15a maps them), neutral status pills, Spline Sans Mono with tabular numbers
  for NHI, dates and money, 4pt spacing, radii. Teal `#0D6E63` is the only action colour; no crimson on
  the new screens.
- [Admin Day.dc.html](../../../design/Admin%20Day.dc.html): the dark side nav (a new **Patients** item
  with a warn badge), page header rhythm, the right rail where 15a's to-do list sits.
- [Admin Review.dc.html](../../../design/Admin%20Review.dc.html): stat tiles, table anatomy and flag
  pills; the record's balance tiles and invoice table extend them.
- [Mobile App.dc.html](../../../design/Mobile%20App.dc.html): the List row (name, mono NHI line).
- No mockup covers a patient record or a waiting list: extend the Admin Review table and tiles and the
  Data quality list pattern (`dataQualityItems`); the balance warning uses 15a's `WarningsPanel` and
  triangle, not a new banner.

**Analysis files:** [GAP-ANALYSIS.md](../GAP-ANALYSIS.md) (before "## By epic", then the EP-11, EP-13,
EP-03 tables), [epics/EP-11.md](../epics/EP-11.md), [epics/EP-13.md](../epics/EP-13.md),
[epics/EP-03.md](../epics/EP-03.md); [domain-model-delta.md](../analysis/domain-model-delta.md) (DM-30,
DM-23, DM-31 for the routine and the threshold contradiction, DM-11, DM-22, DM-24);
[reverse-check.md](../analysis/reverse-check.md) RV-20 and RV-36; the prototype maps in `../analysis/`.
Evidence for the answer: `requirements-board/requirements/notes/2026-10-16-aa-meeting-with-greg.md` and
`2026-10-19-aa-meeting-with-greg.md` point 1 (read the cited passages with `npm --prefix
requirements-board run source -- --item OQ-49 --text`); for the balance rules, the 2026-10-02 notes
(OQ-74: invoice date, credit as mild, yellow versus red) and the 2026-10-02 review points 5, 14 to 16
and 85. The catalogue images for US-11.1.1, US-11.1.4, US-11.3.2 and US-11.3.3 are screenshots of the
**old** prototype.

**Code entry points** (lines as of 15a session 1; later phases moved many, use the real ones):
- Patient: `domain/types.ts` `Patient` (`hiddenInternalId`, `nhi` optional today, the `ethnicityPending`
  quarantine). `store/intake.ts` `upsertPatient` (reuses by NHI, enriches undefined fields, creates a
  `createdProvisional` record with no NHI: **delete that branch**), `editPatient` and `PatientEditPatch`
  (no NHI or ethnicity). Every Booking funnels through `createBooking` (`store/bookingActions.ts`);
  callers: `shared/flows/ManualBookingForm.tsx`, 33's `decideImportRow`, `ingestPdfRow`
  (`integrationActions.ts`, a Future-scope surface).
- The prior-balance boolean to remove: `store/selectors.ts` `patientHasOutstandingPriorEpisode`,
  `MonitorBookingRow.outstandingPriorBalance`, and the pill in `BillingMonitorScreen.tsx`.
- 15a's code: `src/domain/warnings/` (`types.ts`, `routine.ts`, `settings.ts`, `rules/index.ts`),
  `src/store/warnings.ts`, `src/shared/warnings/`, `src/store/warningSamples.ts`.
- NHI render sites: `shared/format.ts` `nhiBadge` (returns "NHI pending" for none), `BookingDetailBody`,
  web `BookingDetailView`, `AdminBookingDetail`, web `ListDetailView` (`?? 'NHI pending'`), mobile
  `ListDetailScreen` (renders nothing when absent), `ReviewScreen` (`?? 'NHI pending'`). About 16
  non-test files read the NHI.
- Editing: `shared/flows/EditPatientSheet.tsx` (no NHI, no ethnicity). Ethnicity: `domain/nzhis.ts`
  (`validateEthnicityCode`, `ETHNICITY_DEMO_SUBSET`).
- Admin shell: `SideNav.tsx`, `AdminApp.tsx`, `router.tsx`, `routes.tsx` (`RequireEntity`); Master
  data: `MasterData.tsx` (the `xeroArchiving` view is the pattern for an editable setting).
- Seed: `domain/seed/patients.ts` (`PAT.provisional` = PT0010 Noah Prescott, no NHI; `PAT.sinclair` =
  PT0019 Heather Sinclair, ZAN2219, in no S1 to S5 beat; `buildPatients` then 132 generated patients),
  `seed/bookings.ts` (Noah's Booking BK0035 on Souter's Mon 27 Jul AM List, Forte, Mr Okafor, wording
  "... (NHI pending)", and Sarah Mitchell's repeat Booking), `seed/history.ts` (Souter-only: `oa07`
  Mitchell $610.00 raised 2026-04-14, 98 days at `DEMO_TODAY`, **billed to St George's**; `oa06` Foster
  76 days to an organisation; `oa03` Chen 29 days and `oa08` Walker 125 days, hospital-billed),
  `seed/index.ts` (the `provisionalNoNhiPatient` Demo Data entity).
- Tests that pin today's behaviour and will move: `store/intake.test.ts`, `store/billingRun.test.ts`
  (the 8th-review test authorises an NHI-less provisional Booking), selector tests for the prior
  balance, 15a's `routine.test.ts` and `store/warnings.test.ts`, `seed.test.ts` (a provisional-patient
  check), `demoScenarios.test.ts`, `persistMigrate.test.ts`, `pwaPurity.test.ts`,
  `officeSimulation.test.ts`.

## Work items

### Session 1 · the rule, the model, the store and the seed

1. **The threshold, in 15a's app-settings record** (DM-31: business settings are not `DemoSettings`).
   - The `patientBalance` rule declares `defaultParams: { thresholdDays: 90 }` (OQ-33, OQ-41). 15a's
     backfill seeds and restores it; reset restores 90.
   - `setPatientBalanceThreshold(api, actor, days)`: office only; a whole number from 1 to 730, else
     "Enter a whole number of days from 1 to 730."; audited `settings.patientBalanceThreshold`. Warnings
     are evaluated live, so the new value applies at the next evaluation; nothing stored is rewritten.
   - The only rule parameter with a UI (item 12's one Master data field). No active switch, no other
     threshold, no rule list (US-13.7.4 is Future).

2. **Pure patient rules** (`src/domain/patients/`, no store import, covered by `domainPurity.test.ts`;
   Vitest beside each).
   - `patientBalance.ts`:
     - `invoiceAgeDays(raisedAtISO, todayISO)`: whole calendar days from the invoice date (the only
       place the basis lives);
     - `countsTowardPatientBalance(row, patientId)`: true only for a row billed to `{ kind: 'patient',
       id }`; false for hospital, insurer, ACC, other holder, named-payer (`'payer'`) and AA fee rows;
     - `checksPatientBalance(payer)`: true only for `{ kind: 'patient' }` (the one place the "which new
       Bookings are checked" half lives);
     - `patientBalanceSummary(rows, { patientId, todayISO, excludeBookingId })`: over the counting rows,
       excluding every invoice of the Booking being checked (its own prepayment invoice included: 27's
       warning covers that), returns `owing` (oldest first, each with `ageDays`; a credited row owes
       nothing), `owingTotal`, `oldestAgeDays` and `creditTotal` (credit held for the patient on their
       own rows, not yet refunded or reused);
     - `patientBalanceStrength(summary, thresholdDays)`: `'none' | 'mild' | 'strong'`. Owing with
       `oldestAgeDays > thresholdDays` is strong, owing within it mild, in credit with nothing owing
       mild; owing decides when both;
     - `patientCentricBalance(rows, patientId)` (US-13.2.2): over **every** row of the patient,
       whoever the billable party, AA fee rows excluded: `outstandingTotal` (signed, net of credits held;
       negative reads "in credit"), `byPayer` (one entry per billable party with kind, name, outstanding
       and credit held, the patient's own first) and `billedToPatient` (the counting subset, the
       warning's figure);
     - tests: 98 days at 90 strong; exactly 90 mild; 91 strong; a 100-day unpaid invoice strong; a
       30-day only invoice **mild**; a paid 200-day invoice none; part paid at 120 days strong with its
       outstanding amount; a hospital-billed 98-day invoice none; an organisation-billed 76-day invoice
       none; a named-payer row none; a credited invoice none as owing; the Booking's own invoices
       excluded; `checksPatientBalance` true for the patient and false for a guardian; credit alone mild;
       a credit held for a named payer is not the patient's credit; threshold 20 turns the 30-day case
       strong; `patientCentricBalance` counts the rows the warning ignores and nets held credit; same
       input gives deep-equal output.
   - `waitingNhi.ts`: `waitingNhiUrgency(dateISO, todayISO)` returns `'urgent' | 'normal'`, urgent when
     the row's date is within `WAITING_NHI_URGENT_WITHIN_DAYS = 3` days or has passed (our reading of
     US-11.1.5's "close"; logged). Tests at 4, 3, 1, 0 and -1 days.
   - `patientDetails.ts`: `detailDifferences(existing, incoming)` over name, DOB, phone, email and
     address (name and address trimmed and case-insensitive; phone digits only; DOB exact; a field the
     incoming side lacks is not a difference; a field the existing record lacks is enrichment). Returns
     `{ field, existing, incoming }[]`. Tests per field, none, and enrichment.
   - `nhiIndex.ts`: `buildNhiIndex(patients)` (normalised NHI to patient) that **reports** any duplicate
     NHI instead of silently picking one: the one-record-per-NHI check. Tests: the seed has none; a
     duplicate is reported.

3. **The `patientBalance` warning rule** (`src/domain/warnings/rules/patientBalance.ts`, added to
   `WARNING_RULES`; US-11.3.2, RV-36).
   - Widen `WarningRuleId` with `'patientBalance'`; add the optional fact `patientBalance?: {
     patientName; summary }` to `WarningFacts`, built by `warningFactsFor` from 36's
     `patientLedgerPosition` and item 2's summary **only when the Booking has a `balanceCheck` stamp**
     (item 7) **and** `checksPatientBalance(booking.payer)`. No stamp, no fact: seeded Bookings raise
     nothing until created or matched, so no scripted beat changes at reset.
   - `evaluate`: one finding, kind `beforeProcedure`, strength from `patientBalanceStrength` with
     `params.thresholdDays`. Texts (no en or em dash, money from the shared formatter):
     strong "Sarah Mitchell owes $610.00 on 1 invoice, unpaid 98 days (over the 90 day threshold).
     Follow up before the procedure."; mild owing "Losa Tuilagi owes $380.00 on 1 invoice, unpaid 30
     days (within the 90 day threshold)."; mild credit "Heather Sinclair is in credit by $260.00. Check
     before invoicing.". Mild and strong use 15a's warning and error tints; the rule picks only the
     strength.
   - **Office audience:** add `audience?: 'all' | 'office'` to 15a's `WarningRule` (default `'all'`),
     carried on each `Warning`; this rule is `'office'`. `useBookingWarnings`, the triangle, the
     `WarningsPanel` on opening a Booking and the PWA "Office clears this warning" choices drop
     office-audience warnings on mobile and web; Admin shows all. If 19's, 21's or 27's rules are already
     office-only by another mechanism, fold them into `audience` (one mechanism); otherwise leave them
     `'all'` and log it.
   - Live evaluation: paying removes the warning, ageing past the threshold turns mild to strong, and a
     cleared mild one re-opens when it turns strong (15a's clearance rule). Clearing is the wave-through.
   - Tests (rule and store): no stamp, no warning; the stamped S1 Booking gives one strong warning;
     advancing the clock 61 days turns a mild 30-day case strong and re-opens a cleared one; absent
     from `useBookingWarnings` on the mobile surface and present on Admin; Heather Sinclair gives one
     mild credit warning; a guardian payer through `setBookingPayer` removes it and the patient restores
     it; a Booking with the child-payer rule's warning and this one carries both.

4. **Model** (`domain/types.ts`; DM-30, DM-23).
   - `Patient.nhi` becomes **required** (string, normalised). Doc comment: the NHI is the patient
     identifier and the one-per-record dedupe key; `hiddenInternalId` is only the store key and Xero's
     ContactNumber (OQ-30), never shown. Remove `createdProvisional` and every read of it.
     `PatientEditPatch` gains `ethnicityCode` only (no NHI edit: a wrong NHI is out of scope).
   - `Patient.pendingDetails?: { receivedAtISO; source: 'hospital' | 'surgeon' | 'aa'; bookingId?;
     differences: { field: 'name' | 'dobISO' | 'phone' | 'email' | 'address'; existing?: string;
     incoming: string }[] }`, following the `ethnicityPending` quarantine: incoming values are held for
     review, never written over the record.
   - `Booking.balanceCheck?: { atISO; trigger: 'created' | 'matched' }`, written in the commit that
     creates or matches the Booking. The only stored part of the warning.
   - `PatientFollowUp { id; patientId; kind: 'call' | 'note' | 'reminder' | 'resend'; text; invoiceId?;
     warningKey?; dueDateISO?; atISO; by; doneAtISO?; doneBy? }` (a `resend` points at 22's send-history
     entry, not a second copy).
   - A `patientCare` slice `{ followUps: Record<id, PatientFollowUp> }` on `SeedState` and `AppState`,
     seeded empty; thread it through `freshAppState`, `backfillMerge`, `DomainPatch` and
     `resetDomainState`. `ID_FORMATS` gains `followUp` (`FUN`, pad 4).
   - **Every seeded patient has a valid NHI**: assert in `seed.test.ts` over all patients including the
     generated pool; check the ~16 NHI-reading files compile with a required field.

5. **Mandatory NHI on every create path, and the returning-NHI prompt** (`store/intake.ts`,
   `store/bookingActions.ts`; D11, US-11.1.1, US-11.1.4).
   - `createBooking` is the **one guard**: it refuses a missing or invalid NHI with `nhiRequired`
     ("An NHI is needed before this Booking can be saved.", or `validateNhi`'s own reason) before any
     write, so no path can create a Booking or patient without one. `upsertPatient` loses its
     no-NHI branch and takes a required NHI.
   - Forms (item 11) disable Save until a valid NHI is typed, with an inline reason; the store refusal
     is the backstop for every other caller. `ingestPdfRow` (the badged Future-scope PDF surface)
     refuses a row without an NHI with `nhiRequired`; the Surgeon PDFs review shows "No NHI: add it
     before this row can become a Booking" and the row stays in that review (33's queue has no PDF
     channel; logged). The HL7 path and hospital rows reach `createBooking` only through 33's
     `decideImportRow`, which already holds a row with no NHI.
   - `upsertPatient` reuses the record by NHI (keeping its enrich-if-undefined behaviour) and computes
     `detailDifferences`; any differences are stored as `pendingDetails` in the same `mutate` (source
     from the actor or intake origin), audited `patient.detailsPending`, and returned on `IntakeResult`.
     The record is never overwritten.
   - `resolvePatientDetails(api, actor, patientId, choices: Record<field, 'keep' | 'useIncoming'>)`:
     office only; applies the chosen values, clears `pendingDetails`, audits `patient.detailsResolved`;
     "Nothing to review." when none.
   - `editPatient` validates `ethnicityCode` with `validateEthnicityCode`, refuses a malformed code,
     quarantines a code outside the demo subset as `ethnicityPending`, and a valid code clears it.
   - Tests: every path (manual, Admin phone advice, PDF row, a `decideImportRow` create) refuses a
     blank or invalid NHI and writes nothing; Sarah Mitchell re-entered with a new address makes no
     second record and stores one pending difference; the same details store nothing; an office resolve
     applies "use incoming" for the address; an anaesthetist resolve is refused; an ethnicity edit
     validates and clears the quarantine; exactly one patient holds any NHI after any decision.

6. **Waiting rows: add the NHI, ask the rooms** (`store/patientActions.ts`, exported from the store
   index; US-11.1.5). The rows, `waitingForNhi` and `correctImportRow` are 33's; this item is the
   office's entry points.
   - `addNhiToWaitingRow(api, actor, rowId, nhi)`: office and `OFFICE_SIMULATION_ACTOR` only; refuses an
     anaesthetist ("The office adds the NHI."), an invalid NHI (the `validateNhi` reason, verbatim) and
     a row that already has one. It calls 33's `correctImportRow(rowId, { nhi })` (so the original
     stays untouched and the correction is audited by 33) and returns 33's new `suggestDecision` result,
     so the row **leaves the waiting view** and shows on the matching screen with its proposed match to
     the patient's single record, or Create Booking with one new record. **It applies nothing**: the
     office still decides the row (US-02.1.2), and only that decision makes a Booking and a patient.
   - `nhiRowPreview(state, rowId, typedNhi)`: for the Add NHI sheet: the existing record the NHI
     matches (name, DOB, earlier Bookings) or "no record", and the `detailDifferences` between the row's
     details and that record, so the office sees them before the decision.
   - `requestNhiFromRooms(api, actor, rowId)`: office only. Builds the email with a new
     `buildNhiRequestEmail` in `src/domain/updateEmail.ts`, reusing 35's `mailto` builder and
     `MAILTO_MAX_LENGTH`. Allowlist: patient name as received, the date, session, hospital, surgeon,
     time and the procedure wording as received; **never** a DOB, an NHI, notes, money, Contract or
     payer. Subject "NHI needed: {patient}, {date}". To: the surgeon's rooms email (17), else the
     hospital's contact email, else empty. Returns the `href` and audits `importRow.nhiRequested`, so
     the view can show "Requested 21 Jul 09:40".
   - Tests (`patientActions.test.ts`): adding a valid NHI releases the row (`waitingForNhi` false) and
     creates no patient and no Booking; deciding the released row for an NHI that exists leaves exactly
     one patient with it; for a new NHI makes exactly one; an invalid NHI, a second add and an
     anaesthetist are refused; the email body passes the allowlist (no DOB, no NHI pattern) and falls
     back to the hospital email.

7. **The balance check at booking time** (US-11.3.2, RV-36).
   - `stampBalanceCheck(draft, bookingId, trigger, atISO)` in `store/patientActions.ts`: sets
     `Booking.balanceCheck` if absent; called inside the commit of every create and match path:
     `createBooking` on every path that funnels through it (mobile and web manual entry, Admin phone
     advice, 33's create-from-row, PDF ingest), trigger `created`; 33's `decideImportRow`
     apply-to-existing and `ingestPdfRow`'s update-by-NHI branch, trigger `matched`.
   - `patientBalancePreview(state, { patientId } | { nhi }, payer)`: a selector the **office** create
     and match surfaces call before saving (Admin phone-advice form, matching-screen row), returning the
     strength and text the rule would raise. It reads the form's payer through `checksPatientBalance`,
     so a guardian payer hides it. It never stops the save; caption "Staff can go ahead. The warning
     stays on the to-do list until cleared."
   - **Remove the boolean:** `patientHasOutstandingPriorEpisode`, `MonitorBookingRow.outstandingPriorBalance`,
     its computation, the "Prior balance" pill and tooltip and the `billing-prior-balance` hook. The
     monitor row shows 15a's triangle when the Booking carries the open `patientBalance` warning (from
     `warningsForBooking`, never recomputed).
   - Tests: the S1 path (Sarah Mitchell, CQY9304) stamps `created` and raises one **strong** warning
     listing `oa07` at 98 days and $610.00; Losa Tuilagi (JKL1188, a 30-day patient-billed invoice)
     raises one **mild**; Heather Sinclair (ZAN2219, $260.00 held) one **mild credit**; Diane Foster
     (ZAK8873, organisation-billed) and David Chen (ZAE0310, hospital-billed) none; after
     `setPatientBalanceThreshold(20)` Tuilagi reads strong; a second stamp writes nothing; paying `oa07`
     removes the warning; creating as an anaesthetist still stamps; a Sarah Mitchell Booking with a
     guardian payer is stamped but raises none; the grep `patientHasOutstandingPriorEpisode|
     outstandingPriorBalance|Prior balance` over `aa-prototype/src` and `aa-prototype/visual` returns
     nothing.

8. **Selectors** (`store/patientSelectors.ts`, re-exported from the store index; `Pick`-narrowed).
   - `patientSearch(state, query)`: name (any word), NHI (normalised, so "zaa 0067" finds ZAA0067) or
     DOB (`YYYY-MM-DD` or `DD/MM/YYYY`). Name and NHI reuse 38a's `patientMatches`; only DOB is added
     beside it. At most 50 rows (name, NHI, DOB and age, next Booking, patient-centric balance, open
     balance warning strength), sorted by name; an empty query returns patients with a Booking in the
     next 14 days, then everyone with an open item. No internal id in the results.
   - `patientRecordView(state, nhi)`: the details, ethnicity label, pending details and quarantine,
     where the details came from, upcoming and past Bookings (List, hospital, anaesthetist, open
     warning), the follow-ups newest first, and the invoices from `patientLedgerPosition` **including
     seeded backdrop history** (the patient's whole history across every anaesthetist **and every
     payer**): number, anaesthetist, Booking date, billable party (kind, name), `countsTowardBalance`,
     raised date, age, total, outstanding, the paid, part paid, unpaid or credited state, any credit
     held, the send history from 22. Balances from item 2: the patient-centric balance and **billed to
     the patient** (owing total, count, oldest age, credit held, strength).
   - `waitingNhiRows(state)`: one row per open `ImportRow` that 33 derives as `waitingForNhi`: the
     patient as received (name, DOB if sent), the **List** found by 33's date, surgeon, hospital and
     session step (else the row's date and hospital), the Booking time and the wording as received, the
     surgeon (resolved by HPI CPN, then name) and the **rooms contact** (room name, email, phone; else
     "Hospital: {email}"), days to go, `waitingNhiUrgency`, and the last `importRow.nhiRequested` time.
     Sorted by date then time. Derived, never stored, so a row leaves the moment its NHI is added and
     stays until then.
   - `openBalanceWarnings(state)` (15a's `openWarnings` for `patientBalance`), `followUpsDue(state)`,
     `patientsWithPendingDetails(state)`, `patientAttentionCount(state)` (waiting rows plus open strong
     balance warnings plus due reminders plus pending details, for the nav badge).
   - Tests: search by each key; Sarah Mitchell's record lists both anaesthetists with the right states,
     billed to the patient $610.00 strong, and her patient-centric balance also counts a hospital-billed
     episode; Heather Sinclair reads "in credit by $260.00" mild; a named-payer pair (21's Hana Park,
     BP0001, or a fixture) counts to Grace Park's balance and not to billed-to-patient; the balance
     equals the sum of row outstanding less credits to the cent; a waiting row carries Mr Okafor's rooms
     email; the badge count adds up.

9. **Seed** (bump `PERSIST_VERSION` by one; extend `persistMigrate.test.ts`: an older version reseeds,
   and the `patientCare` slice and the `patientBalance` rule entry are backfilled).
   - **PT0010 Noah Prescott gets an NHI**, `ZAP3016` (valid mod 11; assert that no generated patient
     holds it and pick another valid unused NHI if one does). His Booking BK0035 (Souter, Mon 27 Jul AM,
     Forte, Mr Okafor) stays and is now an ordinary Booking. Change his Procedure's seeded wording
     "Inguinal hernia repair, booked from PDF referral (NHI pending)" **in the seed** to "Inguinal hernia
     repair" (a seed edit, not an edit path, so 20a's never-overwritten rule holds); check 20a's stack
     test and the US-03.1.2 and US-02.5.7 recipes do not pin the old text. No ids or RNG draws move.
   - Retire the `provisionalNoNhiPatient` Demo Data entity (and its "Provisional patient (NHI pending)"
     scenario link); in its place a Demo Data link "Intake rows waiting for an NHI" to
     `/admin/patients/waiting`.
   - **Sarah Mitchell's 98-day invoice is billed to her.** Re-point `oa07`'s counterparty from
     `HOSP_STG` to `{ kind: 'patient', id: PAT.mitchell }` (keep `hospitalId`; a backdrop Booking carries
     payer `{ kind: 'patient' }` and Contract No contract (RVG)). Without it S1 raises nothing under the
     billed-to-the-patient rule. Amount and dates unchanged, so Souter's totals are too; the change adds
     one patient Xero contact (hidden id as ContactNumber, no NHI). Re-run the pinned S3, web Accounts,
     dashboard and outstanding-list tests and re-pin only a by-payer label or contact count, with the
     reason.
   - **Cross-anaesthetist history under Dr Sharma** (generalise `buildHistory`'s anaesthetist, or add a
     small `seed/patientHistory.ts` using 36's pair constructors), on backdrop Lists before the canvas
     horizon in the `H` namespace, each billed to the patient (payer on the Booking the patient, Contract
     No contract (RVG)):
     - Sarah Mitchell, Sharma, 2026-02-10, $540.00, **paid** (her record shows two anaesthetists);
     - Losa Tuilagi, Sharma, raised **2026-06-21** (30 days at `DEMO_TODAY`), $380.00, **unpaid**: the
       mild case;
     - the patient of 15a's `SEED_WARNING_SAMPLE_BOOKINGS.multiWarning` Booking, Sharma, raised
       2026-03-23 (120 days), $290.00, **unpaid** (use their existing patient-billed unpaid invoice if
       they have one; name the patient in PROGRESS);
     - **the credit case** (D24): Heather Sinclair (`PAT.sinclair`), Sharma, raised 2026-05-12,
       $260.00, billed to her, **paid** 2026-05-19, not paid out, then credited in full on 2026-06-02
       through 39's pure path (`creditInFull`, `reversalPlan`, `xeroCorrectionPlan`, `applyCredit`), so
       the pair is `credited`, `credit.heldForPayer` is $260.00 and 36's `ledgerChecks` stay clean. Use a
       held credit another phase already seeded for a person paying for themself instead, if one exists.
     Souter's figures (S3, web Accounts, dashboard) are untouched; prove it with the pinned tests.
   - **The waiting-rows sample:** a new `HOSPITAL_DOWNLOAD_SAMPLES` entry `NO_NHI_LIST` (33's entry shape;
     one hospital, so Forte Health, channel `manualSheet`, imported by `importHospitalDownload`, not 34's
     `deliverDailySheet`, which is fixed to one Forte sample): two rows with **no NHI**, one dated within
     the urgent window (DEMO_TODAY + 1 or +2) and one later, e.g. Mon 27 Jul 10:30 on Souter's List with
     Mr Okafor. One is an existing patient as received (Losa Tuilagi, name and DOB, so Add NHI JKL1188
     matches her record and a Booking then raises the mild warning), the other a new synthetic patient with
     a valid NHI held in the fixture. A waiting row's List need not exist (it shows its date and
     hospital). Check the rows do not dedupe against `SAMPLE_FORTE_SHEET`. Name the Lists used in the
     PROGRESS entry.
   - No seeded `balanceCheck` stamp, no seeded follow-up, no seeded waiting row (the view is empty at
     reset, apart from any NHI-less row 33 or 34 staged, named in PROGRESS).
   - Seed tests: two fresh seeds deep-equal; PT0001 to PT0151 unchanged except Noah's NHI; every patient
     has a valid NHI and `buildNhiIndex` reports no duplicate; Sinclair's pair is credited with $260.00
     held and the ledger balances; Tuilagi's invoice is exactly 30 days old at `DEMO_TODAY`; `oa07` is
     patient-billed; no seeded Booking raises a `patientBalance` warning.

10. **Session 1 gate.** Build, PWA build and Vitest green, with the UI edited only to compile (the monitor
    pill removed, `nhiBadge` callers compiling). Record the counts. Tell the user session 1 is green so
    they can commit it.

### Session 2 · the screens, the wording, the triggers and the guide

11. **The NHI everywhere, and the forms** (US-03.1.5, US-11.1.4).
    - `nhiBadge(nhi)` returns the NHI text only ("NHI ABC1234", mono); the "missing" return and every
      `?? 'NHI pending'` fallback go. Every render site shows the NHI: `BookingDetailBody`'s Patient
      block, web `BookingDetailView`, `AdminBookingDetail`, web `ListDetailView`, mobile
      `ListDetailScreen` (render it where it rendered nothing), `ReviewScreen`'s patient cell.
    - Add-booking forms (`ManualBookingForm`, all three apps, as 15b, 19, 20a and 21 left them): the NHI
      field is required with a live `validateNhi` reason; Save is disabled until valid, with the caption
      "An NHI is needed to save a Booking." With an NHI that matches an existing record with different
      details, the "matched existing record" line adds "Some details differ. The office will review
      them." In **Admin's** phone-advice form only, `patientBalancePreview` shows beside the matched
      record while the form's payer is the patient, and hides for a guardian; the mobile and web forms
      never show it. Phase 40a adds the NHI lookup to the same field: keep its captions in one place.
    - Grep gate: `NHI pending`, `NHI missing` and `createdProvisional` appear nowhere in `aa-prototype/src`
      or `aa-prototype/visual`.

12. **Admin · Patients screens** (`apps/admin/screens/patients/`; routes in `router.tsx` and `routes.tsx`;
    a **Patients** item in `SideNav` after Invoices with a warn badge from `patientAttentionCount`;
    `AdminApp.tsx` maps `/admin/patients`). The route key is the **NHI**; the internal id is never shown.
    - Routes: `/admin/patients` Search (`data-shot="admin-patients"`); `/admin/patients/waiting` Waiting
      for NHI (`data-shot="admin-waiting-nhi"`); `/admin/patients/follow-up`
      (`data-shot="admin-patient-follow-up"`); `/admin/patients/:nhi` the record
      (`data-shot="admin-patient-record"`, through `RequireEntity`). A segmented control switches the
      three list views, each with its count.
    - **Search:** one field ("Name, NHI or date of birth"); table: Name, NHI (mono), DOB and age, Next
      Booking, Balance (patient-centric, mono; "In credit" when negative) and the warning strength pill.
    - **Waiting for NHI:** columns Patient as received (name, DOB), List (date, session, hospital,
      surgeon, time, or the date and hospital when no List exists), Surgeon's rooms (name, email, phone;
      or "Hospital: {email}"), Days to go with an **Urgent** pill (the error tint) on close rows,
      Requested ("Not yet" or the time). Actions: **Email rooms** (a real `<a href>` from
      `requestNhiFromRooms`, audited on click), **Add NHI** (the sheet) and **Open on matching**. Empty
      state "No intake rows are waiting for an NHI." A caption: "These rows are not Bookings yet. Nothing
      is created until the office adds the NHI and decides the row."
    - **Add NHI sheet** (a desktop dialog, convention 16): an NHI field with live `validateNhi`; the
      `nhiRowPreview` line, "No record holds this NHI: a new patient record is made when you decide this
      row." or "Matches Losa Tuilagi, born 27 Jan 1992, 3 earlier Bookings. The row uses this record; no
      second one is made."; a read-only differences table when the row's details differ from that record
      (they are held for review at the decision); a teal **Add NHI**; the refusal inline. After adding,
      the row leaves the list, the sheet confirms "Added. The row is ready on the matching screen" with an
      **Open on matching** link, and nothing is applied.
    - **Follow-up:** three lists. **Balance warnings** (`openBalanceWarnings`, strong first): Patient,
      Booking (date, List), strength pill, Owes, Oldest (days), Open record and 15a's **Clear** ("Clear
      (optional)" on a mild one). **Follow-ups due** (reminders due today or earlier, with Done).
      **Details to review** (patients with `pendingDetails`). Header line: "Strong when an invoice billed
      to the patient is unpaid more than 90 days from its invoice date. A patient in credit shows a mild
      warning. Change in Master data", the number read from the setting. No provisional caption.
    - **Patient record:**
      - Header: name, the NHI (mono, the identifier), DOB and age, a Search link back.
      - **Details** card (name, DOB, phone, email, address, **Ethnicity** as "11111 · New Zealand
        European" from `ETHNICITY_DEMO_SUBSET` or the quarantine note, "Details from: hospital"). Edit
        opens `EditPatientSheet` with the new Ethnicity code field (live check and label). If
        `pendingDetails` exists, a **Details differ** card above it holds a Keep or Use incoming table and
        Apply (`resolvePatientDetails`).
      - Three **balance tiles** (Admin Review anatomy), patient-centric first: **Balance** (whole
        balance whoever pays; "In credit $260.00" when negative), **Billed to the patient** (owing, the
        warning's strength pill, count and oldest age, or the credit held) and **Other payers**; under
        them a one-line **By payer** breakdown. Then 15a's `WarningsPanel` for any open balance warning
        on an upcoming Booking, with Clear.
      - The **Invoices** table (US-11.3.1): Number (links to the invoice), Anaesthetist, Booking date
        (links to the Booking or its 35 as-at view), Billable party (a "Patient" tag on counting rows),
        Raised, Age (unpaid rows), Total, Outstanding, Status (Paid, Part paid, Unpaid, Credited, with
        "Credit held $260.00" and a link to 39's credit note). Oldest unpaid first, then newest paid; one
        footer total; no ageing buckets. A row menu holds **Resend** (22's `resendInvoice`, appending to
        the send history rather than refusing a second send, and logging a `resend` follow-up; a portal
        invoice shows "Delivered via the {portal} portal") and **Log follow-up**. A row expands to its
        send history.
      - **Bookings:** upcoming and past, with List, hospital, anaesthetist and the triangle.
      - The **Follow-up log** (US-11.3.3): Log call, Add note, Set reminder (date and text). Newest first,
        each with who and when, the linked invoice number, and Done on open reminders.
        `logPatientFollowUp(api, actor, input)` and `completeFollowUp(api, actor, id)` in
        `patientActions.ts`: office only, non-empty text, a reminder on or after today, audited
        `patient.followUp` and `patient.followUpDone`. Clearing a balance warning with a note also logs a
        `note` follow-up linked by `warningKey`.
    - **Master data:** a "Patient balance warning" view beside "Xero & archiving"
      (`data-shot="master-patient-balance-threshold"`) with **one** number field ("Patient balance warning
      after N days"), Save (`setPatientBalanceThreshold`), the confirmation, the caption "Counts from the
      invoice date, and only amounts the patient owes on invoices billed to them. Under the threshold the
      warning is mild; over it, strong. A patient in credit gets a mild warning. A change applies at the
      next Booking check.", and a History link. Nothing else of US-13.7.4's page.
    - Add every new audit code to `ACTION_LABELS`: "Patient details differ", "Patient details reviewed",
      "NHI requested from rooms", "Follow-up logged", "Follow-up done", "Patient balance threshold
      changed". Entity labels: patient, settings.

13. **Where the warning and the waiting rows surface outside Patients.**
    - **Matching screen** (33, 34): a row whose NHI matches a record with a balance shows 15a's warning row
      inline before the decision (`patientBalancePreview`, "Sarah Mitchell owes $610.00 on 1 invoice,
      unpaid 98 days", an Open patient record link, the go-ahead caption); Create Booking is unchanged and
      the result repeats it ("Booking created. Strong balance warning on the to-do list."). The preview
      assumes the new Booking's payer is the patient (21's default). A row waiting for an NHI keeps 33's
      "No NHI" pill and gains a link to Waiting for NHI. McMurray's NHI-less row from 34 follows the same
      rule.
    - **Admin Booking detail:** the patient name links to the record; the balance warning shows in 15a's
      `WarningsPanel` and triangle (office only); a guardian as payer on 21's payer sheet removes it at
      once.
    - **Admin Day, Review:** 15a's to-do list and outline carry the balance warning with no change beyond
      the rule. Review has no NHI flag and no blocked Authorise (there is no authorise guard).
    - **Billing monitor:** 15a's triangle in place of "Prior balance" (item 7).

14. **Demo triggers** (`src/shared/demoTriggers/registry.ts`; see the next section). Bodies go in
    `src/shared/demoTriggers` or `src/store`, so `pwaPurity` holds. Add the `patientBalance` entry to
    15a's `WARNING_SAMPLES` (`stage` stamps `balanceCheck` on the `multiWarning` Booking as
    `DEMO_TRIGGER_ACTOR`; `unstage` removes the stamp and its clearance). The sample is office-audience,
    so it is skipped on 15a's mobile Booking route (bar and PWA) and on any Booking whose patient owes
    nothing or whose payer is not the patient. Skipped samples count as done for "Samples already
    raised", and the message names only the samples it staged.

15. **Copy and comment sweep.** Grep `src/` for `NHI pending`, `NHI missing`, `Prior balance`, `prior
    episode`, `unpaid alert`, `where available`, `provisional` (patient contexts) and `WI2a`; reword every
    user-visible string and fix stale comments (including `Patient`'s doc comment and the `intake.ts`
    header). The words are "balance warning", mild and strong, never "alert" in new copy. No en or em
    dashes in any string added or changed.

16. **Tests and shots.**
    - Component tests: the waiting row renders the rooms email, the Urgent pill and Add NHI; the Add NHI
      sheet shows the existing-record preview and calls `addNhiToWaitingRow`; the record's invoice table
      shows Paid (Sharma) and Unpaid (Souter) for Sarah Mitchell with billed to the patient $610.00 and
      the strong pill, and the Balance tile counts every payer; Heather Sinclair shows "In credit
      $260.00", the Credited pill and the mild pill; a second Resend appends to the send history; the
      threshold field refuses 0 and 731; every add-booking form disables Save with a blank NHI; the
      mobile Booking detail shows no triangle for an office-audience warning.
    - `demoScenarios.test.ts`: the S1 jump plus its Beat 1 steps leave one open strong `patientBalance`
      warning on Sarah Mitchell's new Booking.
    - Playwright: a new `visual/admin-patients.spec.ts` (search, record, Waiting for NHI with the trigger,
      Add NHI then the matching decision, follow-up view, Clear, the credit record, the Master data field);
      the S1 spec asserts the warning row on the matching screen and the to-do entry after Create Booking;
      the PWA device spec runs the "Office adds the NHI" entry; the billing monitor spec drops
      `billing-prior-balance`. `data-shot` hooks as named above.

17. **PWA parity check.** On the PWA the mandatory NHI shows in the add-booking form (Save disabled
    without a valid NHI) and in "Office adds the NHI" (below). The balance warning is office-only, so the
    PWA shows no triangle for it and 15a's "Office clears this warning" never lists it (pin both in a
    Vitest test over `demoTriggersFor`). The office screens have no PWA equivalent (the PWA has no Admin),
    which is expected.

18. **Demo guide** (see "Demo guide updates"), in the same session.

19. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`.

## Demo triggers

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Receive list with a missing NHI | Admin · Patients · Waiting for NHI (`/admin/patients/waiting`) | bar | Imports `NO_NHI_LIST` with 33's `importHospitalDownload(api, OFFICE_ACTOR, sampleId)` (Forte Health, channel `manualSheet`; not `deliverDailySheet`): two rows with no NHI, one urgent, land on 33's matching screen and show in this view. The message names the two NHIs the presenter types (the existing patient's and the new patient's). Nothing is applied. Disabled with "Already received" once that sample's batch exists |
| (no new trigger) Add NHI | Admin · Patients · Waiting for NHI | none | Product UI: type the NHI in the Add NHI sheet; the row leaves the view and is ready on the matching screen, matched to the single record. The existing-patient row (Losa Tuilagi, JKL1188) then shows the mild balance warning on Create Booking |
| (no new trigger) Strong balance warning on the S1 match | Admin · Intake matching screen | none | Existing S1 flow: 34's on-open sync stages Sarah Mitchell's St George's row, the row previews the warning, Create Booking raises the **strong** warning on the to-do list. Mild: add a Booking for Losa Tuilagi (JKL1188). Credit: add one for Heather Sinclair (ZAN2219). A guardian as payer removes the warning (product). The demo clock's menu ages invoices from their invoice date (`+61 days` turns Tuilagi's mild warning strong) |
| (no new trigger, product) Change the threshold | Admin · Master data · Patient balance warning | none | The one field: set 20 and Tuilagi's 30-day warning reads strong at the next check; set 90 and it reads mild again |
| Raise sample warnings (15a, shared) | Admin · Day and Admin · Booking detail | bar | Gains the `patientBalance` sample: stamps a balance check on the `multiWarning` Booking, whose patient carries a seeded 120-day patient-billed invoice, so a patient-owing Booking shows a strong balance warning beside the other rules' samples. "Clear sample warnings" removes the stamp. No new entry |
| Office adds the NHI | Mobile · List (`/mobile/lists/:listId`) and Booking (`/mobile/lists/:listId/bookings/:bookingId`, acting on that Booking's List) | PWA only, `badge: 'office-stand-in'` | `addNhiAsSimulatedOffice(api, listId)` in `src/store/officeStandIn.ts`: on an ACTIVE List of the persona's, stages the next unused of three synthetic fixture rows with **no NHI** (`stageImportRows`), which makes no Booking, then as `OFFICE_SIMULATION_ACTOR` adds the fixture's NHI (`addNhiToWaitingRow`) and decides the row (`decideImportRow` with the derived suggestion), so the Booking appears on the List with its NHI. If an open waiting row already targets that List it uses that row instead. Message: "The hospital sent a booking with no NHI, so it waited with the office. The office added the NHI and matched it: Tomasz Nowak is now on your List." Disabled with "No fixture rows left" or "The List is not ACTIVE". The outline put this on the mobile Booking; a waiting row has no Booking, so it sits on the List route and the Booking route acts on its List (logged) |

Not added: the Control Panel page gets nothing new; its index picks up the entries under their screens.
PWA parity: the mobile beat is "the booking waits, the office adds the NHI, it appears with its NHI";
the balance warning and the patient record are office-only (US-11.3.x are Admin App stories, and the
anaesthetist never sees patient money).

## Out of scope

- NHI lookup against the Health NZ Digital Services Hub and refresh from the register (FT-14.4, US-14.4.1;
  Phase 40a): `lookupNhi` stays as it is. The NHI validators stay under Admin Intake (US-11.1.2).
- Correcting or detaching an NHI on a record. Two NHIs are two people: never merged. (No merge exists
  now: no provisional patient to merge.)
- The full NZHIS Level 4 ethnicity table: `ETHNICITY_DEMO_SUBSET` stays, a well-formed code outside it
  is quarantined as today.
- Merging Xero contacts, or a Xero lookup by NHI (OQ-30: no patient data in Xero).
- The payer on the Booking, who is billed and the child-payer warning (21); invoice delivery itself (22).
  A named payer's own balance across several patients is not modelled: their invoices count toward each
  patient's patient-centric balance but never toward the patient's balance warning.
- The warnings settings page (US-13.7.4, Future); the prepayment warning, letters and reminders (27, 41);
  dunning letters, SMS and automated reminder emails (a reminder here is an office to-do).
- Ageing buckets (removed in 38); credit notes and rebills (39: this phase only reads them); refunding a
  held credit (US-08.6.5: a credit note is not a refund).
- Showing patient money or the balance warning to the anaesthetist; 38a's anaesthetist search does not
  link to the patient record.
- A standalone "New patient" form; anything in the pricing model; patient bulk loads (42), search at full
  scale and the NHI leak scan (43, which should cover the new NHI request email).
- Per-hospital or per-anaesthetist thresholds and a second urgency level for waiting rows: one global
  threshold and one labelled constant until AA asks for more.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to the
owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. The Admin side nav shows **Patients**. Waiting for NHI is empty (plus any NHI-less row 33 or
      34 staged, named). The Day to-do list holds no balance warning. Noah Prescott's Booking (Mon 27 Jul
      AM, Forte) shows NHI ZAP3016 on mobile, web and Admin. Nothing reads "NHI pending" or "NHI missing".
- [ ] No save without an NHI: in each of mobile, web and Admin phone advice, Add a booking with the NHI
      blank or invalid: Save is disabled with the reason; a valid NHI saves. A surgeon PDF row with no NHI
      is refused and stays in its review.
- [ ] Waiting for NHI, Demo actions, "Receive list with a missing NHI": two rows appear, one **Urgent**,
      each with the patient as received, the List or date, and the rooms email and phone (or the
      hospital's). The matching screen shows the same rows as waiting, creating nothing; no Booking and no
      patient exist for them.
- [ ] Email rooms opens a mail draft addressed to the rooms, subject "NHI needed: {patient}, {date}", with
      no DOB and no NHI in the body. The row reads "Requested" with the time; the Audit viewer shows "NHI
      requested from rooms".
- [ ] Add NHI on the existing-patient row, typing JKL1188: the sheet says it matches Losa Tuilagi and
      that no second record is made; the row leaves the view and is ready on the matching screen. Decide
      it (Create Booking): one Losa Tuilagi exists, the Booking carries a mild balance warning. An invalid
      NHI is refused with its reason. Add the new patient's NHI on the other row: deciding it makes
      exactly one new record.
- [ ] S1 Beat 1 as 34 built it: open Admin Intake, Sarah Mitchell's row shows the strong warning ("owes
      $610.00 on 1 invoice, unpaid 98 days") with the go-ahead caption. Create Booking: saved, the result
      says the strong warning is on the to-do list, the Day to-do list shows it red, her Admin Booking
      detail shows the triangle and `WarningsPanel`, and the Billing monitor (once billed) shows the
      triangle instead of "Prior balance". Mobile and web show no triangle for it.
- [ ] Payer on the Booking: make a named guardian the payer on Sarah Mitchell's new Booking: the warning
      leaves; set it back to the patient: it returns (strong). Her record's figures do not move.
- [ ] Sarah Mitchell's record (route `/admin/patients/CQY9304`): Balance is her whole balance whoever
      pays; Billed to the patient reads $610.00 (Strong), 1 unpaid invoice, 98 days. The table shows the
      Souter invoice (Unpaid, Patient tag) and the Sharma invoice (Paid). Log a call, set a reminder for
      today, and Resend the Souter invoice twice: the log shows the entries, the reminder appears under
      Follow-ups due, and the send history keeps both sends. Clear the warning from the record: it leaves
      the to-do list. No internal patient id appears anywhere.
- [ ] Mild case: add a Booking for Losa Tuilagi (JKL1188) on an ACTIVE List in Admin: the form previews a
      mild warning and saves; the to-do list shows "owes $380.00 on 1 invoice, unpaid 30 days" mild. Advance
      the demo clock 61 days: it re-opens strong. Reset the clock.
- [ ] Not the patient's bill: Bookings for Diane Foster (ZAK8873) and David Chen (ZAE0310) raise no balance
      warning; their records still list those invoices without the Patient tag and count them in Balance
      (patient-centric) under Other payers.
- [ ] Credit case: Heather Sinclair's record reads "In credit $260.00" with the Credited Sharma invoice.
      Add a Booking for her (ZAN2219): the form previews "Heather Sinclair is in credit by $260.00. Check
      before invoicing.", it saves, and the to-do list shows it mild (yellow).
- [ ] Threshold: Master data shows one "Patient balance warning" view with a single field. 0 and 731 are
      refused; set 20 and Tuilagi's warning reads strong; set 90 and it reads mild again.
- [ ] As Dr Souter on mobile, add a Booking for Losa Tuilagi: it saves with no warning on mobile, and the
      Admin to-do list shows the mild warning on it.
- [ ] Ethnicity: on a record, Edit, enter a malformed code (refused), then 21111 (shows "21111 · Māori").
      The Booking's Patient block shows it too.
- [ ] Details differ: add a Booking for Sarah Mitchell (CQY9304) with a new address from the web form: the
      form says "Some details differ". No second patient exists. Patients, Follow-up, Details to review
      lists her; on her record, Apply with "Use incoming" updates the address.
- [ ] On Admin Day, Raise sample warnings: the `multiWarning` Booking carries a strong balance warning
      beside the other rules' samples. Clear sample warnings removes it.
- [ ] PWA (`npm run build:pwa`, then preview): on an ACTIVE List, "Office adds the NHI" (office stand-in
      badge) adds a Booking with its NHI to the List and its message names the patient; the add-booking
      form refuses a blank NHI.
- [ ] Reset restores the threshold (90), no balance warnings and an empty Waiting for NHI.
- [ ] Catalogue screenshots: the recipes in the section below are created or updated, every recipe this
      phase broke is re-pointed, a full `npm run capture` ends with no failed recipe, the new shots are
      checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      are green.

## Demo guide updates

Patch these in the same session, and the same sections of `master-demo-guide.html`. The beats are as the
earlier phases left them (34's S1 sync and match, 20a's three-part stack, 21's payer, 15b's ACTIVE Lists);
this phase adds lines, it does not re-script them, and Phase 44 rewrites S1 to S5 afterwards.

- `03-demo-script.md`:
  - **S1 Beat 1:** on Sarah Mitchell's row and after Create Booking the **Expected** line adds the strong
    balance warning (1 invoice billed to her, unpaid 98 days, $610.00) and its to-do entry. **Say**:
    "Sarah owes AA for an earlier procedure, past the 90 day threshold, so the office gets a strong
    warning to follow up before this one goes ahead. It never stops the booking. The 90 days count from
    the invoice date; a newer bill would be a yellow, mild warning, and a bill the hospital or an insurer
    pays does not count. It is raised because she is the payer on this Booking."
  - **New optional S1 Beat 1d, "the patient's whole bill":** open the patient record from the warning;
    read the tiles and the two anaesthetists (paid under Sharma, unpaid under Souter); Log call; Resend
    the Souter invoice; Clear the warning. Optional: Losa Tuilagi for the mild case, Heather Sinclair for
    the credit case, a guardian as payer, the threshold field in Master data. Discovery points: whether
    the warning should also need this Booking's Contract to bill the patient, whether the anaesthetist
    should see it, the starting threshold (US-11.3.2 is still to check with Ben), and whether the
    threshold should be editable at all (US-11.3.2 says fixed until a settings page).
  - **S5, a new optional beat, "no NHI, no Booking":** the add-booking form refuses a blank NHI; Patients,
    Waiting for NHI after the trigger (the patient as received, the rooms contact, Urgent, Email rooms);
    Add NHI matches Losa Tuilagi's single record; decide the row on the matching screen. Discovery point:
    D11 is settled (the NHI is mandatory and the identifier); ask whether the surgeon's rooms should be
    contacted from here or by the office's own email.
  - "Direct URLs": `/admin/patients`, `/admin/patients/waiting`, `/admin/patients/follow-up`,
    `/admin/patients/CQY9304` (Sarah Mitchell). "Recovery": a decided row cannot be undone except by
    Reset; a cleared balance warning re-opens only if it turns strong.
- `04-presenter-cheat-sheet.md`: rewrite the patient balance section as "Patient balance warning" (one of
  the routine's rules; raised when a Booking is created or matched for a patient who is the payer on the
  Booking and owes AA money on invoices billed to them; mild within the threshold, strong over it, 90 days
  from the invoice date, one admin field; a patient in credit is mild; yellow and red; other payers' bills
  do not count toward the warning though the record's balance shows them; never blocks; office-only). Add
  a "The NHI is mandatory" item (no Booking without one; rows wait; the office adds it). Replace any
  "NHI pending" wording. Update "What each app is for" (Admin gains Patients).
- `02-workflows-and-handoffs.md`: in intake, a row without an NHI waits, the office emails the rooms and
  adds the NHI, then decides the row; a returning patient who owes money raises the balance warning. In
  billing follow-up: the patient record, the follow-up log, Resend and Clear.
- `01-personas-and-responsibilities.md`: the office persona chases waiting rows and follows up patients
  who owe; the anaesthetist always sees the NHI and never the patient's balance.
- The Control Panel's S1 scenario text (`DemoControlPanel.tsx`, as 34 left it): add "Creating her Booking
  raises a strong balance warning (98-day invoice billed to her)."; a one-line S5 mention of the waiting
  rows beat. The Demo Data entity labels (item 9).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 40` first: earlier phases may have changed
these recipes. Every Booking shot is on an ACTIVE List (15b), with 20a's stack as it renders, and the
record route is keyed by NHI. EP-11 and FT-11.3 have no recipe row (their shots are the stories'); confirm
with `recipe-status.mjs`. Two old captions are replaced: US-11.1.4's "shown as NHI pending" and US-11.3.2's
"Prior balance flag on a returning patient with unpaid invoices".

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-11.1.1](../../../../requirements-board/requirements/stories/US-11.1.1.md) Patient record keyed on NHI | partial · admin-patient-record, admin-edit-patient (on a Booking's patient block; reason "no standalone patient record screen") | captured. Re-point `patient-record` to `/admin/patients/CQY9304` (header with the NHI as identifier, details and ethnicity; highlight the Details card; no internal id) and `edit-patient` to the record's Edit sheet with the ethnicity field; add a `details-differ` state (the Details differ card after Sarah Mitchell returns with a new address). Keep the catalogue's image names; drop the partial reason |
| [US-11.1.2](../../../../requirements-board/requirements/stories/US-11.1.2.md) | captured · admin-nhi-validator | no change here (34 owns it); re-run `--dry` |
| [US-11.1.4](../../../../requirements-board/requirements/stories/US-11.1.4.md) Patient without NHI | partial · nhi-pending (BK0035, `[data-shot=booking-patient]`) | captured. Replace `nhi-pending` with `nhi-required`: state `form` (Admin phone advice with the NHI blank, Save disabled with the inline reason) and `waiting` (the matching screen after the trigger: the no-NHI row waiting, nothing created). Caption "A Booking cannot be saved without an NHI; an incoming row without one waits at intake". Drop the partial reason |
| [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md) Intake rows waiting for an NHI | absent (no shots) | captured. Admin shot `waiting-for-nhi` at `/admin/patients/waiting`: states `list` (after "Receive list with a missing NHI": two rows, one Urgent, rooms email and phone; highlight the urgent row), `add-nhi` (the sheet typing JKL1188: "Matches Losa Tuilagi ... no second one is made") and `ready` (the row on the matching screen, matched to her single record). Caption "Intake rows waiting for an NHI, with the surgeon's rooms" |
| US-11.2.1, US-11.2.2, US-11.2.3, US-11.2.4, US-11.4.2, US-11.4.3 | admin-default-payer, admin-guardian-payer, none and absent rows | no change here (Phase 21 owns them); re-run `--dry` |
| US-11.4.1 | captured · admin-insurers | no change here (Phase 42 owns it); re-run `--dry` |
| [US-11.3.1](../../../../requirements-board/requirements/stories/US-11.3.1.md) Patient outstanding bills view | absent | captured. Admin shot `patient-invoices` on `/admin/patients/CQY9304`, highlighting the invoice table: every invoice across anaesthetists (paid under Dr Sharma, unpaid under Dr Souter) with Paid, Part paid, Unpaid pills and the balance |
| [US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md) Alert on booking a patient with unpaid bills | partial · prior-balance (billing monitor, `[data-shot=billing-prior-balance]`) | captured. Replace with `balance-warning`, setup `{ "scenario": "S1" }`: states `preview` (the matching row's preview before Create Booking), `to-do` (after Create Booking, the strong red warning on 15a's to-do list: $610.00, 98 days), `credit` (Admin phone advice for Heather Sinclair: the mild yellow credit preview) and `threshold` (Master data, the one field at 90). Admin only. Caption "Balance warning when booking a patient who owes AA, strong over the threshold". Drop the partial reason and the `billing-prior-balance` hook |
| [US-11.3.3](../../../../requirements-board/requirements/stories/US-11.3.3.md) Follow-up tools | partial · resend-invoice[ready, sent] | captured. Keep `resend-invoice` (ready, sent), add `resent` (the send history lists both sends, no "already emailed" refusal) and `follow-up-log` on `/admin/patients/CQY9304` (Log call, Set reminder, Resend, completed entries with who, when and invoice number). Drop the partial reason |
| [US-13.2.2](../../../../requirements-board/requirements/stories/US-13.2.2.md) Per-patient balance | absent | captured. Admin shot `patient-balance` on `/admin/patients/CQY9304`, highlighting the balance tiles and By payer line (whole balance whoever pays, Billed to the patient, Other payers); add a `credit` state on Heather Sinclair ("In credit $260.00") |
| [US-03.1.5](../../../../requirements-board/requirements/stories/US-03.1.5.md) Anaesthetist sees the patient's NHI | absent (no shots) | captured. Mobile and web shot `nhi-shown` (the List row and a Booking, e.g. Sarah Mitchell, NHI in mono above 20a's stack); web start `/web/lists/:listId`, mobile `/mobile/lists/:listId` and `.../bookings/:bookingId`; highlight the NHI line. No "missing" state, and no patient money or balance warning in either app |

**Recipes this phase breaks.**
- `US-11.3.2.json` and `US-11.1.4.json` hold the removed pill and "NHI pending" wording (rewritten above);
  `US-11.1.4.json` uses Phase 15's `[data-shot=booking-patient]`: confirm the hook survives item 11, else
  move it.
- `US-11.1.1.json`: re-pointed above.
- `US-11.1.3.json` (`dedupe-nhi`, web and mobile, CQY9304) still produces the four images US-11.1.1 lists:
  keep it capturing; re-check its caption and highlight for the "Some details differ" prompt.
- Any recipe or spec that saves a Booking with a blank NHI (grep the recipes' Add a booking steps) now
  fails: give it an NHI. `US-14.4.1.json`, `US-02.4.1.json` and `US-02.4.2.json` start from Add a booking:
  re-run `--dry` (40a re-takes US-14.4.1 afterwards). Any 20a recipe showing Noah Prescott's wording
  changes with the seed edit; re-check its caption. `US-08.5.1.json` highlights Losa Tuilagi in the
  billing pipeline: the Sharma history invoices stay off the office Invoices list and monitor.
- Item 16 lists the specs; the `--dry` run is the check for anything else.

**ATLAS.md.** Update "Routes" (the `/admin/patients` family, keyed by NHI), "Personas and IDs" (Noah
Prescott ZAP3016, Sarah Mitchell CQY9304, Losa Tuilagi JKL1188, Heather Sinclair ZAN2219 for the credit
case), "Seed data worth shooting" (the patient-billed history invoices, the credited Sinclair invoice,
the `NO_NHI_LIST` rows), "Existing hooks" (the new patient, waiting, threshold and warning `data-shot`
hooks; remove `billing-prior-balance`) and the demo-trigger ids this phase registers.

## Adversarial review (after build)

Run the standard review-and-fix pass (PROGRESS convention 18): fan out three Opus review subagents (quality,
bugs, plan adherence) steered by the bullets below; independently verify each finding; fix the confirmed
ones; re-green build, PWA build, Vitest and shots; record the pass in the phase entry. Do not re-raise
anything settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**

- **The NHI is mandatory everywhere.** No path creates a Booking or a patient without a valid NHI:
  `createBooking` is the one guard (every caller: manual forms, Admin phone advice, `decideImportRow`,
  `ingestPdfRow`, the HL7 path through 33, the PWA stand-in), `upsertPatient` has no no-NHI branch, no
  `createdProvisional`, no seeded patient without an NHI. One record per NHI: `buildNhiIndex` reports no
  duplicate after any decision. A refusal writes nothing. No "NHI pending" or "NHI missing" string, and
  no authorise blocker or Review flag for it.
- **Waiting rows.** A row with no NHI makes no Booking and no patient until the office adds the NHI **and**
  decides it; Add NHI only releases it through 33's `correctImportRow` (the original is kept). The view is
  derived from 33's `waitingForNhi`, never stored, so a row leaves on add and stays until then. The rooms
  contact resolves surgeon by HPI CPN then name, else the hospital. The NHI request email passes the
  allowlist (no DOB, NHI, money or notes).
- **The internal id.** `hiddenInternalId` is the store key and Xero's ContactNumber only; it appears in no
  Admin screen, route, search result or copy. The NHI never enters Xero (`xeroNhi.test.ts` passes).
- **The balance rule.** One 15a rule, never a block, never a separate alert store. Only a Booking whose payer
  on the Booking is the patient is checked (`checksPatientBalance`, the only gate; the Contract does not
  gate it), and only patient-billed receivables count toward the warning (`countsTowardPatientBalance`);
  hospital, insurer, holder, named-payer, AA fee and credited rows never count as owing; the Booking's own
  invoices (its prepayment included) are excluded. A payer changed through `setBookingPayer` adds or
  removes the warning at the next evaluation. Strong is strictly older than the threshold, counted from the
  invoice date only in `invoiceAgeDays`; within it is mild (the 30-day case is mild, not silent); credit
  alone is mild. Only stamped Bookings warn, every create and match path stamps inside its own commit
  (grep every `createBooking` caller and apply-to-existing branch), and no seeded Booking is stamped. No
  trace of `patientHasOutstandingPriorEpisode`, "Prior balance" or `UnpaidAlert`. The threshold is one
  Master data field and nothing more of US-13.7.4's page.
- **Office audience.** The warning never reaches a mobile or web surface (triangle, `WarningsPanel`, the
  PWA clear entry); other rules still show there.
- **The ledger is the truth.** Invoices and balances read `patientLedgerPosition`, never `state.xero`;
  backdrop history appears on the record but stays off the office Invoices list and monitor. The record's
  Balance is patient-centric while the warning reads only the billed-to-patient subset; both equal their
  rows' outstanding less credits held, to the cent. Souter's pinned totals are unchanged by the `oa07`
  change and the Sharma seed.
- **Details differ.** Differences are held in `pendingDetails`, never written over the record without a
  choice; no second record is made by a returning NHI.
- **Triggers and PWA.** Entries show only on their routes; the PWA stand-in is PWA-only and badged; the
  sample is in 15a's shared body, not a new button; bodies live in `src/shared` or `src/store`
  (`pwaPurity` holds); no Control Panel additions; fixtures and any synthetic NHI are deterministic (no
  `Math.random`, `Date.now()` or `new Date()`).
- **Persistence and determinism.** `PERSIST_VERSION` bumped, the migrate test backfills `patientCare` and
  the `patientBalance` rule entry, two fresh seeds deep-equal, no id or RNG draw shifted, reset restores
  everything.
- **Design and copy.** The record and lists extend the Admin Review tile and table anatomy and 15a's warning
  components; mono for NHI, dates and money; teal-only actions; no crimson on the new screens; mild uses
  the warning tint and strong the error tint; no "DRAFT" or "Open" label for an assigned List; "payer on the
  Booking", never "billable party", in new app copy; no en or em dashes.
- **No pricing drift.** Nothing touches Contracts, holders, lines, the resolver or the price precedence in
  `src/domain/billing`.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test themselves"):
  readings logged rather than asked, each with its route and persona: the payer gate and the
  billed-to-the-patient count against the patient-centric balance (insurer included per Greg); the
  office-only audience against US-13.7.3's "either app"; `beforeProcedure` although US-13.7.1 leaves it
  unset; the one threshold field although US-11.3.2 now says fixed and US-13.7.4 is Future; the urgent
  constant (3 days); the NHI as route key with the internal id hidden; surgeon PDF rows without an NHI
  held in their own review (33's queue has no PDF channel); the "Office adds the NHI" PWA entry on the
  List rather than the Booking; no standalone "New patient" form; the waiting view as a filtered office
  view over 33's queue (US-11.1.5 says it could be folded into the queue if it adds nothing); who is the
  credit patient in the seed.
- **Status row** for catch-up Phase 40 and a phase entry with: the drift-check result against `d4db277`
  (items changed or not; D11 answered and built; OQ-74 built as answered, D24); what was built with a name
  map for later phases:
  - the `patientBalance` rule, its `thresholdDays` param and `setPatientBalanceThreshold`; the rule
    `audience` field on 15a's `WarningRule`;
  - `Booking.balanceCheck`, `stampBalanceCheck`, `patientBalancePreview`;
  - the `patientCare` slice (`PatientFollowUp`) and `Patient.pendingDetails`; `Patient.nhi` required;
  - `src/domain/patients/` (`invoiceAgeDays`, `checksPatientBalance`, `countsTowardPatientBalance`,
    `patientBalanceSummary`, `patientBalanceStrength`, `patientCentricBalance`, `waitingNhiUrgency`,
    `detailDifferences`, `buildNhiIndex`);
  - `patientActions.ts` (`addNhiToWaitingRow`, `nhiRowPreview`, `requestNhiFromRooms`,
    `resolvePatientDetails`, `logPatientFollowUp`, `completeFollowUp`) and `addNhiAsSimulatedOffice`;
  - `patientSelectors.ts` (`waitingNhiRows` among them); `createBooking`'s `nhiRequired` guard;
  - the Admin Patients routes (keyed by NHI); `NO_NHI_LIST` and the Lists it uses; the `oa07` payer
    change and the `multiWarning` patient's invoice; the trigger ids and the `patientBalance` sample;
  - removed: `patientHasOutstandingPriorEpisode`, `outstandingPriorBalance`, the "Prior balance" pill,
    `createdProvisional`, "NHI pending", and the `provisionalNoNhiPatient` Demo Data entity;
  - the `PERSIST_VERSION` bump (from and to), the tests added, the before and after Vitest and Playwright
    counts, and the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `REPORT.md` counts before and
  after (captured, partial, absent, failed), the recipes this phase broke and how they were re-pointed,
  and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Superseded:** the 2026-07-22 third external plan review, finding #5 (`nhi` optional, one seeded
     provisional "NHI pending" patient). The NHI is mandatory and the identifier; no provisional patient
     (D11, OQ-49 answered).
  2. **Superseded:** the Phase 10 WI2a reading (the intake balance banner on the billing monitor row) and
     the 2026-07-27 pre-workshop fix 10.2 ("Prior balance" reads any open prior episode). The patient
     balance is a 15a warning raised when a Booking is created or matched for a patient who is the payer
     on the Booking, counting only invoices billed to the patient, mild within and strong over an
     admin-set threshold (90 days from the invoice date, a credit mild; OQ-33, OQ-41, OQ-74, D24); the
     record's balance is patient-centric across every payer (US-13.2.2).
  3. **New:** an incoming row without an NHI waits on 33's queue and creates nothing; the office's view of
     those rows is derived, and adding the NHI only releases the row for the office's decision.
  4. **New:** the balance warning is office-only (a rule `audience`); the anaesthetist apps never show
     patient money. Departs from US-13.7.3's "either app" for this one rule.
  5. **New:** only Bookings stamped at create or match carry the balance warning; strength is derived live.
  6. **New:** the threshold is the one warning parameter with a UI, one Master data field; the settings page
     stays Future (US-13.7.4).
  7. **New:** returning-NHI details that differ are held for office review, never auto-applied.
  8. **New:** the internal patient id is never shown; the NHI is the identifier in routes, search and copy.
- **Handoff notes:**
  - For **40a**: the NHI lookup fills the NHI field on the add-booking forms and the Add NHI sheet; a
    looked-up NHI that already exists reuses the single record through `upsertPatient`, with
    `buildNhiIndex` as the uniqueness check; "refresh from the register" attaches to the patient record
    (`/admin/patients/:nhi`) and may use `detailDifferences`; the NHI field's captions on the forms sit
    in one place 40a extends.
  - For **41**: prepayment letters and reminders can log into the patient follow-up log (`kind`
    extended); a cancelled prepayment's credit shows on the patient record through the ledger. Heather
    Sinclair's seeded $260.00 held credit is the credit case. `patientBalanceSummary` counts a held credit
    only while it is not refunded: when 41 marks a trust refund paid it must also make
    `patientBalanceSummary` and `patientCentricBalance` drop that credit (one shared "credit still held"
    helper), or the mild warning outlives the refund.
  - For **42**: the threshold and the urgent constant are candidates for the reference-data screens if AA
    asks; US-13.7.4 stays Future.
  - For **43**: the NHI leak scan should cover `buildNhiRequestEmail`, the patient search results and the
    follow-up log; `patientSearch` must stay fast at full scale.
  - For **44**: S1 Beat 1's warning line, Beat 1d and the S5 beat were added here; re-read them in the
    rewrite and walk "Office adds the NHI" in the PWA-parity audit. If Ben changes the balance rule
    (US-11.3.2 is still Verify), the switch points are the rule's `defaultParams`,
    `patientBalanceStrength`, `checksPatientBalance` and `countsTowardPatientBalance`.
