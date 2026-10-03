# Phase 40 · Patients: missing NHI, balance warning, patient view

**Requirements covered:**
[US-11.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.4.md) Patient without NHI (Open; its working assumption is owner decision D11's default: go ahead flagged, authorising blocked) ·
[US-11.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.5.md) Missing NHI problem list ·
[US-11.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.1.md) Patient outstanding bills view ·
[US-11.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.2.md) Alert on booking a patient with unpaid bills (Verify, "still to check with Ben"; refined 2026-10-02 by OQ-74's answer: the days count from the invoice date, a credit balance is a mild warning, yellow versus red) ·
[US-11.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.3.md) Follow-up tools ·
[US-13.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.2.md) Per-patient balance (Missing; 2026-10-02: the balance is attached to the patient whoever pays, "a patient-centric view") ·
[US-03.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.5.md) Anaesthetist sees the patient's NHI ("NHI missing", never blank) ·
[DM-30](../analysis/domain-model-delta.md#dm-30) (NHI required, a missing-NHI problem list, the Booking proceeds but authorising is blocked) ·
[DM-47](../analysis/domain-model-delta.md#dm-47) (follow-up actions recorded against a patient's outstanding invoices, and a re-send that keeps a send history) ·
[RV-21](../analysis/reverse-check.md#rv-21-prior-balance-tag-has-no-threshold-and-lives-in-the-billing-monitor) (the "Prior balance" tag with no threshold, in the billing monitor).
Read alongside (not closed here):
[US-11.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.1.md) (Patient record key: **Matches** as built and left this phase on 2026-10-03; the record screen below still shows its identity block, ethnicity and the "details differ" prompt, because the patient record needs them, but closes nothing there),
[FT-11.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.1.md),
[FT-11.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.3.md),
[US-11.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.2.md) (the NHI validators, which Phase 34 keeps under Admin Intake),
[FT-13.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.7.md) (2026-10-02: the to-do list is for warnings that need action; notices go to the shared pool, FT-13.8) and
[US-13.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.1.md) to
[US-13.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.3.md) (15a's warning routine, which this phase registers a rule in; all three Confirmed 2026-10-02, and US-13.7.3 dropped tap-to-read and the submit confirm step),
[US-13.7.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.4.md) (the warnings settings page: **Future**, not built),
[US-15.0.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.6.md) (privacy and data minimisation: why the balance warning is office-only),
[OQ-49](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-49.md) (Booking without NHI, owner decision **D11**: still Open, the meeting leans to the default),
[OQ-41](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-41.md) (**Answered** 2026-10-01: mild under the threshold, strong over it, amounts owing only, always wave-through),
[OQ-74](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-74.md) (**Answered** 2026-10-02, owner decision **D24**: count from the invoice date; a credit balance is a mild warning),
[OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md) (**Answered**: no PII in Xero, so the NHI is never there; Xero holds only a unique id),
[OQ-33](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-33.md) (Answered: a 90 day threshold), and the
"Patient and billable party" and "Warnings" sections of [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 15a (the warning routine: `WarningRule`, `WarningFacts`, `WARNING_RULES`,
`evaluateWarnings`, the `appSettings.warningRules` record and its backfill, `warningFactsFor`,
`warningsForBooking`, `openWarnings`, `clearWarning`, the to-do list, `WarningTriangle`,
`WarningsPanel`, the warning visible on opening a Booking with no confirm step at submit,
`WARNING_SAMPLES` and `SEED_WARNING_SAMPLE_BOOKINGS`), 34 (hospital sync and the rebuilt S1: Sarah
Mitchell's St George's row is matched and created on the Admin Intake matching screen; the
manual-provider daily sheets and `deliverDailySheet`; through it, 33's `ImportRow`,
`HOSPITAL_DOWNLOAD_SAMPLES`, `importHospitalDownload`, `stageImportRows` and `decideImportRow`), 36
(the internal ledger: `LedgerPair` with the patient's hidden id on every Booking pair whoever pays,
`patientPosition` and `patientLedgerPosition`, whose rows carry the billable party and a signed
outstanding) and 39 (credit notes: a credited pair reads `credited`, owes nothing, and holds
`credit.heldForPayer` for the payer, which is where a patient's **credit balance** comes from, so the
D24 credit case needs it). By the roadmap order 14 (the trigger registry, `useDemoTriggerContext`,
`OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`, `authoriseAsSimulatedOffice` in `store/officeStandIn.ts`),
15 (Booking vocabulary, `createBooking`, `BookingDetailBody`), 17 (surgeons' rooms with a contact
email, the hospital contact email), 21 (`Procedure.payer` (`ContractPayer`: the patient, or a named
payer such as a guardian), `billablePartyForProcedure`, `isPersonParty`, `authoriseBlockersFor`, and
the child rule as a second registered warning), 22 (`resendInvoice` and its send history), 27 (the
prepayment rule's `mildWithinDays` / `strongWithinDays` escalation, whose pattern the Missing NHI
list reuses), 35 (explicit save, the `mailto` builder in `src/domain/updateEmail.ts`, as-at views),
37, 38 and 38b have also run.
**Estimated:** 2 sessions, at the upper limit (20 items across store, seed, four Admin screens and
three apps). 15a now carries the warning storage, the to-do list and the triangle, so this phase adds
a rule, not an alert subsystem. Two sessions is the limit (the owner's sizing rule): if session 2 cannot finish, stop green after
item 14 with the screens working, tell the user what remains (items 15 to 20) and let them decide
whether to split it out as a follow-up phase. Never cut coverage silently. Session 1: work items 1 to 11 (the rule
and its threshold, model, pure rules, store actions, the intake hooks, the authorise gate, seed,
tests), ending green with the UI edited only as far as it must compile. Session 2: items 12 to 20
(the Admin Patients screens, the Booking and review surfaces, mobile and web wording, triggers,
shots, the demo guide).

## Goal

Admin gets a **patient record**. Today the office can see a patient only as the Patient block of a
Booking, and patient money only as a boolean "Prior balance" pill on the Billing monitor, after a
List is billed, counting every payer's invoice. The catalogue asks for a record per patient that the
office can search for and open, with every invoice and the balance attributed to the patient
whoever pays (US-11.3.1, US-13.2.2), and a warning when a patient who pays their own bills owes AA
money or is in credit (US-11.3.2).

This phase:

- adds **Admin · Patients**, with search by name, NHI or date of birth, and a **patient record**. The
  record shows the details: the **patient id** (the existing hidden internal id, PT0005, the key) and
  the **NHI** (unique across records, or "NHI missing"), with **ethnicity** (NZHIS Level 4 code and
  label) shown and editable. When a returning NHI arrives with different details, a **"Details
  differ"** prompt appears instead of the change being silently dropped. (US-11.1.1 already Matches;
  these are the record's own presentation, not coverage.) It shows **every invoice across every
  anaesthetist and every payer**, each marked paid, part paid or unpaid (US-11.3.1), and the
  **balance attributed to the patient whoever the billable party is**, the patient themself, a person
  paying for them, a hospital, an insurer or ACC, net of any credit held for them, with a by-payer
  breakdown (US-13.2.2, Greg's "patient-centric view"), all read from Phase 36's ledger. And it has
  **follow-up actions**: log a call, add a note, set a reminder, and re-send an invoice through Phase
  22's `resendInvoice`, which keeps a send history instead of refusing a second send, all kept in a
  follow-up log against the patient and the invoice (US-11.3.3, DM-47);
- adds a **Missing NHI** problem list. Each row shows the patient, the List, and the surgeon's rooms
  contact (or the hospital's). Rows escalate, mild then strong, as the List date nears. The office can
  email the rooms, or **attach the NHI**. Attaching an NHI that already belongs to a record
  **merges** the provisional record into it in one action, so no duplicate is left (US-11.1.4,
  US-11.1.5);
- makes the NHI required, per owner decision **D11** (still open; the 2026-10-01 meeting leans to
  this default and US-11.1.4 states it as the working assumption, so it is built and labelled
  provisional). A Booking without an NHI goes ahead **flagged**: it can be created, it sits on the
  problem list, and its **List cannot be authorised** until the NHI is added. The anaesthetist's
  mobile and web apps say **"NHI missing"** instead of a blank or "NHI pending" (US-03.1.5);
- registers a **patient balance** rule in 15a's warning routine (OQ-41 and OQ-74 answered, D24). When
  a Booking is created or matched for a patient who is the billable party on invoices AA holds
  (invoices billed to the patient themself; hospital, insurer and named-payer invoices count to the
  record's balance but not to the warning), the Booking carries a before-procedure warning: **mild**
  (yellow, 15a's warning tint) while the oldest unpaid invoice is within the threshold, **strong**
  (red, the error tint) once it is older, counted from the **invoice date** (90 days to start), and
  **mild** for a patient **in credit** (a credit held for them after a Phase 39 credit note). It never
  blocks: staff go ahead, and the office clears it from 15a's to-do list (the list for warnings that
  need action, FT-13.7). It is an **office warning**: the anaesthetist apps never show patient money.
  It replaces the Billing monitor's "Prior balance" tag (RV-21);
- gives the admin **one threshold field**, "Patient balance warning after N days", in Admin Master
  data. The value lives in 15a's app-settings record, and a change applies to the next Booking check
  (US-11.3.2's "admin changes the threshold"). It is a single field, not the warnings settings page
  that US-13.7.4 keeps for Future Work.

New stored state: a `Booking.balanceCheck` stamp, a `patientCare` slice (follow-ups and merge
redirects), `Patient.pendingDetails`, and the `patientBalance` entry in 15a's `appSettings`. The seed
gains a prior record for Noah Prescott, patient-billed history invoices under Dr Sharma (one of them
credited through 39's credit path, so Heather Sinclair is in credit) and a re-pointed payer on Sarah
Mitchell's 98-day invoice, so `PERSIST_VERSION` is bumped.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.1.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.1.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.1.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.3.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.3.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.3.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.2.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-03.1.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-11.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-11.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.1.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-13.7.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.7.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.7.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.7.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.7.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-15.0.6.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-49.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-41.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-74.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-30.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-33.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   The plan was re-based on `3d3a18c` (the three 2026-10-02 meetings with Greg). What that update
   changed for this phase, already built into the items below:
   - **OQ-74 answered (D24):** the threshold's days count from the invoice date, and a credit balance
     is a mild warning; mild versus strong is yellow versus red. US-11.3.2 gained the matching two
     acceptance criteria (a credit balance gives a mild warning; an invoice dated 100 days ago gives a
     strong one) and its note now reads "still to check with Ben", so it stays Verify. Built as the
     answer: no "provisional (OQ-74)" caption anywhere.
   - **US-13.2.2 (Missing) is patient-centric:** the balance is attached to the patient even when a
     guardian pays, and Greg added that the same holds for an insurance claim (the catalogue text
     names only a guardian; the note records the insurer, 2026-10-02 review point 85). The record's
     headline balance therefore counts every invoice for the patient whoever pays; only the warning
     narrows to invoices billed to the patient.
   - **US-11.1.1 now Matches** and left this phase. Its images moved and a link was added; nothing to
     build for it. The identity block, ethnicity and "details differ" stay on the record (the record
     needs them), but drop nothing else and claim no coverage for it.
   - **DM-47 joined** (follow-up actions and an invoice re-send that keeps a send history). Work items
     4, 9 and 13 already build it on 22's `resendInvoice`.
   - **US-13.7.1 to US-13.7.3 Confirmed.** US-13.7.3 removed tap-to-read and the submit confirm step
     (the warning is visually clear on opening the Booking); 15a builds that. Nothing here reads a
     confirm step. US-13.7.1 still leaves the balance warning's kind unset. FT-13.7 now says the
     to-do list is for warnings that need action, which this warning is.
   - **D17 (OQ-67, Phase 21):** the Contract defines the billable party, with no per-Booking override
     and no guardian master; a default or patient-direct Contract captures the payer on the Procedure
     (`Procedure.payer`: the patient, or a named payer). Items 2, 6 and 9 read 21's shapes, not a
     `Booking.billableParty`.
   - **39 is now a dependency:** a patient credit balance is the `heldForPayer` a Phase 39 credit note
     leaves on a pair billed to the patient.

   If an item changed after `3d3a18c`, re-read it and adjust the work items; re-run the gap analysis
   for that item only, per `../README.md`. If an item is now Retired or Future, drop the work items
   that serve only it and note it in PROGRESS.md. Record the result in the phase entry.
2. **D11 / OQ-49 (Booking without NHI).** Check the ROADMAP decisions table and OQ-49's status.
   - **Still Open (build the default, as at `3d3a18c`):** the Booking goes ahead flagged, it is listed
     on Missing NHI, and `authoriseBlockersFor` blocks its List until the NHI is added. The manual
     form, the matching screen and the Review action bar carry one caption, "Provisional rule. AA to
     confirm whether a Booking can go ahead without an NHI (OQ-49).", from one constant.
   - **Answered "blocked":** `createBooking` refuses with `nhiRequired` on every path ("An NHI is
     required before this Booking can be created."). The manual form requires the NHI. A hospital or
     PDF row without one stays on the matching screen as a row, and Missing NHI lists those **rows**
     (patient, proposed List, rooms) instead of Bookings. The seeded Noah Prescott Booking becomes a
     staged Forte row, and the authorise blocker is dropped because it can never fire. Work items 4
     (the doc comment), 6 (attach works on a row, not a record), 8 (the gate), 9 (`missingNhiRows`
     over rows), 10 (Noah's Booking becomes a row) and 14 (the form and matching-screen captions)
     change accordingly.
   - **Answered "go ahead, no block":** keep everything except the authorise blocker, and keep the
     Review flag.
   - **Duplicates (part of OQ-49).** The meeting weighed a merge screen ("a big lift"), a "do not
     change" flag and accepting some duplicates. This phase keeps merge as **one action inside the
     attach** (no separate merge screen, no un-merge). If AA answers "accept duplicates", the attach
     still sets the NHI but the second record is kept and linked instead of merged: only
     `applyNhiAttach` changes.
3. **US-11.3.2 (Verify), OQ-41 and OQ-74 (both answered).** Build both answers as stated: the age
   counts from the **invoice date** (`invoiceAgeDays`, the only place the basis lives) and a **credit
   balance is a mild warning** (`patientBalanceStrength`). US-11.3.2 is still "to check with Ben": if
   Ben sets a different starting threshold, change only the rule's `defaultParams`.
   - **The reading of "a patient who is the billable party"** (record it in the Decisions log): the
     warning counts only receivables whose billable party is the patient themself (counterparty
     `{ kind: 'patient', id }`, which 21's `billablePartyForProcedure` gives when the Procedure's
     payer is the patient). Hospital, insurer, ACC, surgeon-group and named-payer (for example a
     guardian's, `kind: 'billableParty'`) invoices do not count toward the **warning**, though all of
     them count toward the record's patient-centric **balance** (US-13.2.2). The new Booking's own
     billable party does **not** gate the check, because at create or match time it is often not yet
     known (the Contract is chosen at capture). If AA reads it the other way (warn only when the new
     Booking also bills the patient), add that condition in the one rule file.
   - **Office audience against US-13.7.3** (record it in the Decisions log and flag it for the
     owner): US-13.7.3 (Confirmed) says a Booking with a warning carries the triangle "in either app"
     and the warning is visually clear when the anaesthetist opens it. This plan makes the balance
     warning office-only (item 3's `audience`), because US-11.3.2 alerts "AA staff" and the
     anaesthetist apps never show patient money (US-15.0.6 data minimisation). Every other rule keeps
     `audience: 'all'`, so US-13.7.3 holds for them. If the owner wants the anaesthetist to see it,
     set the rule's audience to `'all'` with an anaesthetist text that names no amount ("Patient has
     an outstanding balance with AA. The office is following up.").
   - **The warning kind.** US-13.7.1 lists this warning with "kind not yet set". It is built as
     `beforeProcedure` (it exists so AA can follow up before the next procedure), in the one rule
     file, and logged for the owner.
   - **US-13.7.4 is Future** ("until then the thresholds are fixed") while US-11.3.2 says "admins can
     change it" (its last criterion), and the domain-model delta lists the two as contradictory. This
     plan builds US-11.3.2's single threshold field in Master data and nothing else of the settings
     page (no active switches, no other thresholds, no rule list). Log the tension on the owner's
     review list; if the owner prefers the threshold fixed until US-13.7.4, drop item 13's Master data
     view and item 1's setter.
4. **US-11.1.4 (Open).** The catalogue still says "NHI pending"; US-03.1.5 says "NHI missing". This
   plan uses **one label, "NHI missing", on every surface** (so the same state never has two names)
   and records the reading in the Decisions log. If US-11.1.4 is confirmed with its own wording for
   the office, `nhiBadge` takes the surface as an argument; the change stays in that one function.
5. **OQ-30 (answered: no PII in Xero).** The prototype already follows it (hidden id as
   ContactNumber, NHI never sent). Nothing here sends the NHI anywhere new; `xeroNhi.test.ts` stays
   green. No branch to take.
6. **Confirm the dependencies are DONE** and read their PROGRESS entries for the real names this doc
   can only anticipate. Wherever this doc names a planned symbol, use the real one:
   - **14:** `OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`, `authoriseAsSimulatedOffice`, the
     `office-authorises-list` entry and its `disabledReason`, `demoTriggersFor`;
   - **15:** `createBooking`, `CreateBookingInput`, `BookingDetailBody`, `AdminBookingDetail`,
     `ManualBookingForm`, `AddBookingFlow`, `reviewFlagsForBooking`, `MonitorBookingRow`, the
     `/bookings/:bookingId` routes;
   - **15a:** the `WarningRuleId` union (today `'prepaymentUnpaid'` only, in
     `src/domain/warnings/types.ts`), `WarningFacts` and how later phases add optional facts,
     `WarningRule.defaultParams`, `AppSettings.warningRules` and its backfill (`persistMigrate` merges
     persisted rules over the current defaults), `defaultAppSettings`, `warningFactsFor`,
     `warningsForBooking`, `warningsForList`, `openWarnings`, `warningSummaryByList`, `clearWarning`
     (and that a clearance re-opens at a higher strength), `useBookingWarnings`, `WarningTriangle`,
     `WarningsPanel`, the to-do list card, `WARNING_SAMPLES` and its stage and unstage,
     `SEED_WARNING_SAMPLE_BOOKINGS.multiWarning`, `DEMO_TRIGGER_ACTOR`, and the PWA "Office clears this
     warning" entry;
   - **17:** `SurgeonRoom` (`contactEmail`, `phone`), `Surgeon.roomId`, `Hospital.contactEmail`;
   - **21:** `Procedure.payer` and `ContractPayer`, `contractNamesPayer`, `billablePartyForProcedure`,
     `isPersonParty`, `setProcedurePayer`, the child rule's file (the pattern for this rule),
     `authoriseBlockersFor` and its blocker kinds, and the Review action bar's blocked-state sentence;
   - **22:** `resendInvoice`, the invoice delivery union and the send history (DM-47's "append, do not
     overwrite"). If 22's send history does not keep every send, extend it here rather than adding a
     second record;
   - **27:** the prepayment rule's `mildWithinDays` / `strongWithinDays` params (the escalation
     pattern the Missing NHI list copies);
   - **33 and 34:** `ImportRow`, `HOSPITAL_DOWNLOAD_SAMPLES` (entry shape), `importHospitalDownload`,
     `stageImportRows`, `decideImportRow` (and its create and apply-to-existing branches), how 33's
     matcher proposes a target for a row whose NHI no Booking holds, the matching screen route
     (`/admin/intake/...`), the row decision rule, `MANUAL_PROVIDER_SHEETS`, `deliverDailySheet`, the
     McMurray row without an NHI, and the S1 beat as 34 rebuilt it;
   - **35:** the `mailto` builder and `MAILTO_MAX_LENGTH` in `src/domain/updateEmail.ts`, and the
     as-at view link for a Booking;
   - **36:** `LedgerPair` (kinds), `patientPosition` and `patientLedgerPosition` (rows: pair id,
     invoice id and number, payee anaesthetist, Booking, billable party with its kind, raised date,
     total, outstanding, status `paid | partPaid | unpaid`, plus the signed `outstandingTotal` and
     the oldest unpaid raised date). If a row lacks a field this phase needs, extend the selector
     rather than joining through `state.xero`;
   - **39:** `CreditNote`, `applyCredit` and the pair's `credit` (`heldForPayer`, `recoveryDue`),
     `creditedAmount`, `pairStatusLabel`'s `credited`, `creditNoteForInvoice`, and whether
     `patientLedgerPosition` rows already carry the credited state and the held credit (if not, extend
     the selector here). A credited invoice owes nothing; a credit held for the patient is the credit
     case;
   - the current `PERSIST_VERSION` (16 after 15a; later phases bump it).

## Reference

**Design files** (convention 17: authoritative):
- [Design Language.dc.html](../../../design/Design%20Language.dc.html): tokens, the `warning` and
  `error` tints (mild and strong, as 15a maps them; Greg's "yellow versus red", D24), neutral status pills, Spline Sans Mono with
  tabular numbers for NHI, patient id, dates and money, the 4pt spacing, radii and card elevation.
  Teal `#0D6E63` is the only action colour (Attach NHI, Log call, Save threshold, Go ahead);
  crimson is not used anywhere on the new screens.
- [Admin Day.dc.html](../../../design/Admin%20Day.dc.html): the dark side nav (a new **Patients**
  item with a warn badge), the page header rhythm, the right rail where 15a's to-do list sits, and
  the List drawer's "Needs attention" box.
- [Admin Review.dc.html](../../../design/Admin%20Review.dc.html): the stat tiles, the table anatomy
  and the flag pills. The patient record's balance tiles and invoice table extend these; the Review
  row's "NHI missing" flag uses the existing pill.
- [Mobile App.dc.html](../../../design/Mobile%20App.dc.html): the List row anatomy (name, mono NHI
  line, operation), where "NHI missing" takes the NHI line's place.
- No mockup covers a patient record or a problem list. Extend the Admin Review table and tiles and
  the existing Integrations Data quality list (the `dataQualityItems` pattern); the balance warning
  uses 15a's `WarningsPanel` and triangle, not a new banner. Do not invent a new visual language.

**Catalogue items:** the ten covered above, plus US-11.1.1 (Matches), FT-11.1, FT-11.3, US-11.1.2,
FT-13.7, US-13.7.1 to US-13.7.4, US-15.0.6, OQ-49, OQ-41, OQ-74, OQ-30, OQ-33, and the domain
model's "Patient and billable party" and "Warnings" sections. The evidence: for the 2026-10-01
changes, `catalogue/notes/2026-10-01-aa-meeting-with-greg.md` points 14, 17, 23, 28, 62 and 69; for
the 2026-10-02 changes, `catalogue/notes/2026-10-02-aa-meeting-with-greg.md` point 15 (OQ-74: invoice
date, credit as mild, yellow versus red) and point 35 (still for Ben), and
`catalogue/notes/2026-10-02-aa-requirements-review-with-greg.md` points 5 and 85 (US-13.2.2, the
patient-centric balance, guardian and insurer) and 14 to 16 (US-13.7.1 to US-13.7.3). The catalogue
images for US-11.1.1 (`admin-patient-record.png`, `admin-edit-patient.png`), US-11.1.4
(`admin-nhi-pending.png`), US-11.3.2 (`admin-prior-balance.png`) and US-11.3.3
(`admin-resend-invoice-*.png`) are screenshots of the **current** prototype. They show where things
sit today, not what the stories require.

**Analysis files:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): everything before "## By epic", then the EP-11, EP-13 and
  EP-03 tables; [epics/EP-11.md](../epics/EP-11.md), [epics/EP-13.md](../epics/EP-13.md) (US-13.2.2,
  now patient-centric, and FT-13.7 for the routine), [epics/EP-03.md](../epics/EP-03.md) (US-03.1.5).
  The re-graded US-11.3.2 entry names the missing create-and-match check, the invoice-date age, the
  admin threshold, the credit case and the billable-party condition.
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-30 and DM-47 (and DM-31 for
  the warning routine and its threshold-versus-settings contradiction, DM-22 and DM-23 for the ledger
  and the per-patient position you read, DM-24 for credits); [analysis/reverse-check.md](../analysis/reverse-check.md) RV-21.
- [analysis/prototype-map-admin.md](../analysis/prototype-map-admin.md) (routes and nav, Booking
  detail, Review, Invoices, Billing monitor, Integrations Data quality, Master data),
  [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md),
  [analysis/prototype-map-apps-mobile-web.md](../analysis/prototype-map-apps-mobile-web.md),
  [analysis/prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) (the PWA
  closure, `pwaPurity.test.ts`, the office simulation).

**Code entry points** (names and lines at `3d3a18c`, after Phases 14, 15 and 15a session 1. Phases
15a session 2 to 39 move many of them: use the real ones from their PROGRESS entries.)
- Patient model: `aa-prototype/src/domain/types.ts` (`Patient` :103, keyed by `hiddenInternalId`,
  with `nhi` optional and the `ethnicityPending` quarantine :118).
- Intake: `aa-prototype/src/store/intake.ts` (`upsertPatient` :52: the NHI match enriches only
  undefined fields and audits `patient.reuse`; `createdProvisional` :127; `PatientEditPatch` and
  `editPatient` :145, with no `nhi` or `ethnicityCode` in the patch).
- Every Booking creation funnels through `createBooking` (`store/bookingActions.ts`, which calls
  `upsertPatient`). Callers: `shared/flows/ManualBookingForm.tsx`, `integrationActions.ts` (HL7; 33
  re-points it to staging) and `ingestPdfRow` (whose update path reuses a Booking on the target List
  by NHI; 34 badges surgeon PDF ingest as Future scope, but the code path stays).
- The authorise guard: `store/lifecycle.ts` `authoriseList`, plus 21's `authoriseBlockersFor`.
  PWA: `src/pwa/officeSimulation.ts` calls `authoriseList` as the simulated office, and 14's
  `office-authorises-list` entry calls `authoriseAsSimulatedOffice` (`store/officeStandIn.ts`).
- The prior-balance boolean: `store/selectors.ts` `patientHasOutstandingPriorEpisode` (:285, which 36
  re-points to `patientPosition`; it counts every payer's invoice), `MonitorBookingRow.outstandingPriorBalance`
  (:400, set at :491) and the pill in `apps/admin/screens/BillingMonitorScreen.tsx:200-206`.
- 15a's warning code: `src/domain/warnings/` (`types.ts` with `WarningRuleId`, `WarningFacts`,
  `WarningRule`, `AppSettings`; `routine.ts`; `settings.ts` `defaultAppSettings`; `rules/index.ts`
  `WARNING_RULES` and one file per rule, `prepaymentUnpaid.ts` today), `src/store/warnings.ts`
  (`warningFactsFor` :58, `warningsForBooking` :73, `openWarnings` :111, `clearWarning` :173), the
  `appSettings` backfill in `store/appStore.ts` (:205), and, from 15a session 2,
  `src/shared/warnings/` and `src/store/warningSamples.ts`.
- The nearest problem-list pattern: `dataQualityItems` (`store/selectors.ts:1010`) and the Data quality
  tab (`IntegrationMonitorScreen.tsx`, under 34's Intake home).
- NHI render sites: `shared/format.ts:82-93` (`nhiBadge` returns "NHI pending");
  `shared/booking/BookingDetailBody.tsx` (the Patient block); `apps/web/screens/BookingDetailView.tsx`;
  `apps/admin/screens/AdminBookingDetail.tsx`; `apps/web/screens/ListDetailView.tsx:76` (falls back to
  "NHI pending", and misses an empty string); `apps/mobile/screens/ListDetailScreen.tsx:202` (renders
  nothing when the NHI is absent); `apps/admin/screens/ReviewScreen.tsx:258` (`?? 'NHI pending'`).
- Patient editing: `shared/flows/EditPatientSheet.tsx` (name, DOB, phone, email, address; no NHI, no
  ethnicity).
- Ethnicity: `domain/nzhis.ts` (`validateEthnicityCode`, `ETHNICITY_DEMO_SUBSET` with labels);
  `integrationActions.ts` `correctEthnicityCode`.
- Admin shell: `apps/admin/components/SideNav.tsx`, `AdminApp.tsx` (section from path, nav badges),
  `router.tsx`, `routes.tsx` (`RequireEntity`), `apps/admin/util.ts:111` `attentionReasons(list)` (the
  List drawer's "Needs attention"; today it takes only the List, so item 8 widens its signature).
- Master data: `apps/admin/screens/MasterData.tsx` (the entity list; the `xeroArchiving` view,
  "Xero & archiving", is the pattern for an editable setting).
- Seed: `domain/seed/patients.ts` (`PAT`, the 19 pinned rows PT0001 to PT0019; `PAT.provisional` =
  PT0010 Noah Prescott, no NHI; `PAT.sinclair` = PT0019 Heather Sinclair, ZAN2219, used by no S1 to
  S5 beat; `buildPatients` then generates `GENERIC_COUNT` = 132 patients numbered from
  `PINNED.length + 1`, so **PT0020 is already the first generated patient**; the patient counter in
  `seed/index.ts:471` is `patients.length + 1`); `domain/seed/bookings.ts` (Noah's Booking at :850
  and Sarah Mitchell's repeat Booking at :859, on Souter, Mon 27 Jul AM, Forte, Mr Okafor; the
  Procedure description "... (NHI pending)" at :854; Mitchell's first episode is Sharma, Tue 14 Jul,
  at :787); `domain/seed/history.ts` (Souter-only history, `buildHistory` :145 hardwired to
  `ANAE.souter` at :146: `oa07` Mitchell $610.00 raised 2026-04-14, 98 days at `DEMO_TODAY`, **billed
  to St George's** (`HOSP_STG`); `oa06` Foster 76 days, billed to an organisation (`ORG_COS`); `oa03`
  Chen 29 days and `oa08` Walker 125 days, both hospital-billed; `pa04` Riley shows the patient
  counterparty shape `{ kind: 'patient', id }`); `domain/seed/index.ts:663` (the
  `provisionalNoNhiPatient` Demo Data entity, labelled "Provisional patient (NHI pending)").
- Tests that pin today's behaviour and will move: `store/intake.test.ts`, `store/billingRun.test.ts`
  (the 8th-review test at :418 moves the NHI-less provisional Booking onto a SUBMITTED List and
  authorises it, which D11 now refuses), `store/selectors` tests for the prior balance, 15a's
  `routine.test.ts` and `store/warnings.test.ts` (the rule count and the sample set grow),
  `demoScenarios.test.ts`, `persistMigrate.test.ts`, `src/pwa/pwaPurity.test.ts`,
  `src/pwa/officeSimulation.test.ts`.

## Work items

### Session 1 · the rule, the model, the store and the seed

1. **The threshold, in 15a's app-settings record** (DM-31: business settings are not `DemoSettings`).
   - The `patientBalance` rule (item 3) declares `defaultParams: { thresholdDays: 90 }` (OQ-33 and
     OQ-41 answered: 90 to start, "may move"). 15a's backfill seeds and restores it; reset restores
     90.
   - `store/appSettingsActions.ts` (or beside 15a's warnings store, whichever 15a set up):
     `setPatientBalanceThreshold(api, actor, days)`. Office only; refuses anything that is not a whole
     number from 1 to 730 ("Enter a whole number of days from 1 to 730."). Audits
     `settings.patientBalanceThreshold` (entity `settings`, id `appSettings`, before and after).
     Warnings are evaluated live, so the new value applies at the **next** evaluation of every
     checked Booking (US-11.3.2: "the new value applies to the next Booking check"); nothing stored
     is rewritten.
   - This is the only rule parameter with a UI (item 13's one Master data field). No active switch,
     no other threshold, no rule list (US-13.7.4 is Future).

2. **Pure patient rules** (`src/domain/patients/`, no store import; covered by `domainPurity.test.ts`;
   Vitest beside each).
   - `patientBalance.ts`:
     - `invoiceAgeDays(raisedAtISO, todayISO)`: whole calendar days from the invoice date (OQ-74
       answered, D24; the only place the basis lives; 36's raised date is the invoice date);
     - `countsTowardPatientBalance(row, patientId)`: true only when the row's billable party is
       `{ kind: 'patient', id: patientId }` (21's `billablePartyForProcedure` result when the
       Procedure's payer is the patient); false for hospital, insurer, ACC, surgeon-group,
       named-payer (`kind: 'billableParty'`, for example a guardian) and AA fee rows. The one place
       the "billable patient only" reading of the **warning** lives;
     - `patientBalanceSummary(rows, { patientId, todayISO, excludeBookingId })`: over the counting
       rows, excluding the Booking being checked, returns `owing` (rows with outstanding above zero,
       oldest first, each with `ageDays`; a credited row owes nothing, per 39), `owingTotal`,
       `oldestAgeDays`, and `creditTotal` (the credit held for the patient on their own rows: 39's
       `credit.heldForPayer` not yet refunded or reused);
     - `patientBalanceStrength(summary, thresholdDays)`: `'none' | 'mild' | 'strong'`. Owing with
       `oldestAgeDays > thresholdDays` is strong; owing within it is mild; nothing owing but in
       credit is mild (OQ-74 answered, D24); otherwise none. Owing decides when the patient both owes
       and holds a credit (the record shows both);
     - `patientCentricBalance(rows, patientId)` (US-13.2.2): over **every** row of the patient,
       whoever the billable party, AA fee rows excluded: `outstandingTotal` (the signed sum of
       outstanding less credits held for any payer on the patient's invoices; negative reads "in
       credit"), `byPayer` (one entry per billable party, with its kind, name, outstanding and
       credit held, the patient's own entry first) and `billedToPatient` (the counting subset's
       totals, the figure the warning reads). The record's headline balance is this, not the
       warning's subset;
     - tests: 98 days at 90 is strong; exactly 90 is mild; 91 is strong; an invoice dated 100 days
       ago and unpaid is strong (US-11.3.2's new criterion); the only unpaid invoice at 30 days is
       **mild**; a paid invoice at 200 days gives none; part paid at 120 days is strong with its
       outstanding amount; a hospital-billed 98-day invoice gives none (Mitchell's case before the
       seed change); an organisation-billed 76-day invoice gives none (Foster, billed to Canterbury
       Orthopaedic Surgeons under its ACC contract); a named-payer (guardian) row gives none; a
       credited invoice gives none as owing; the Booking's own invoice is excluded; a credit held for
       the patient with nothing owing is mild; a credit held for a named payer is not the patient's
       credit for the warning; a threshold of 20 turns the 30-day case strong; `patientCentricBalance`
       counts the hospital, insurer and named-payer rows that the warning ignores and nets a held
       credit; the same input gives deep-equal output.
   - `missingNhi.ts`:
     - `missingNhiStrength(listDateISO, todayISO)` returns `'none' | 'mild' | 'strong'`, the same
       vocabulary and pattern as 27's prepayment escalation. The thresholds are the labelled constants
       `MISSING_NHI_MILD_WITHIN_DAYS = 7` and `MISSING_NHI_STRONG_WITHIN_DAYS = 2` (our reading,
       logged for the owner; US-11.1.5 says only "as the List date approaches"). The day itself, and a passed date on an
       unauthorised List, read `strong`;
     - tests at 8, 7, 3, 2, 0 and -1 days.
   - `patientDetails.ts`:
     - `detailDifferences(existing, incoming)` compares name, DOB, phone, email and address. Name
       and address compare trimmed and case-insensitive; phone compares digits only; DOB compares
       exactly. A field the incoming record lacks is not a difference; a field the existing record
       lacks is enrichment, as today, not a difference. It returns `{ field, existing, incoming }[]`;
     - tests for each field, for the no-difference case and for the enrichment case.
   - `nhiIndex.ts`: `buildNhiIndex(patients)` (normalised NHI to patient id) that reports any
     duplicate NHI instead of silently picking one: the "second unique index" US-11.1.1 proposes (and
     already Matches through `upsertPatient`); the patient id stays the key. Tests: the seed has no duplicate; a duplicate is reported.

3. **The `patientBalance` warning rule** (`src/domain/warnings/rules/patientBalance.ts`, added to
   `WARNING_RULES` after the existing rules; US-11.3.2, OQ-41, OQ-74).
   - Widen `WarningRuleId` with `'patientBalance'`. Add an optional fact to 15a's `WarningFacts`:
     `patientBalance?: { patientName; summary: PatientBalanceSummary }`, built by `warningFactsFor`
     from 36's `patientLedgerPosition` and item 2's `patientBalanceSummary` **only when the Booking
     has a `balanceCheck` stamp** (item 7). No stamp, no fact, no warning: seeded Bookings raise
     nothing until they are created or matched, so no scripted beat changes at reset.
   - `evaluate`: one finding, kind `beforeProcedure`, strength from `patientBalanceStrength` with
     `params.thresholdDays`. Texts (no en or em dash, money from the shared formatter):
     - strong: "Sarah Mitchell owes $610.00 on 1 invoice, unpaid 98 days (over the 90 day threshold).
       Follow up before the procedure.";
     - mild, owing: "Losa Tuilagi owes $380.00 on 1 invoice, unpaid 30 days (within the 90 day
       threshold).";
     - mild, credit: "Heather Sinclair is in credit by $260.00. Check before invoicing.".
     Mild and strong render in 15a's warning (yellow) and error (red) tints, Greg's "yellow versus a
     red warning" (D24); the rule picks only the strength.
   - **Office audience.** Add `audience?: 'all' | 'office'` to 15a's `WarningRule` (default `'all'`,
     so 15a's, 19's, 21's and 27's rules are unchanged), carried on each `Warning`. This rule is
     `'office'`. US-13.7.1 also calls 19's out-of-range base-unit warning one "for the office": if 19
     kept it off the anaesthetist apps by some other means, fold that into `audience: 'office'` here
     (one mechanism, not two); if 19 shows it in both apps, leave it `'all'` and log it for the owner. `useBookingWarnings`, the triangle, the `WarningsPanel` the anaesthetist sees on
     opening a Booking, and the PWA "Office clears this warning" choices drop office-audience warnings
     on the mobile and web surfaces; Admin shows everything. (There is no submit confirm step to
     filter: US-13.7.3 dropped it and 15a built none.) The anaesthetist never sees patient money (US-15.0.6 data minimisation).
   - Because evaluation is live, paying the invoice removes the warning, ageing past the threshold
     turns a mild one strong, and a mild warning the office cleared re-opens when it turns strong
     (15a's clearance rule). Clearing is the office's wave-through (US-11.3.2: "never blocks").
   - Tests (`patientBalance.test.ts` over the rule, and a store test): no stamp gives no warning;
     the stamped S1 Booking gives one strong warning; advancing the demo clock 61 days turns a mild
     30-day case strong and re-opens a cleared mild one; the warning is absent from
     `useBookingWarnings` on the mobile surface and present on Admin; a stamped Booking for Heather
     Sinclair (credit held, nothing owing) gives one mild warning with the credit text; a Booking with
     the child rule's warning and this one carries both (US-13.7.1 "more than one").

4. **Model** (`domain/types.ts`; DM-30, DM-47).
   - `Patient` doc comment rewritten: the **patient id** (`hiddenInternalId`) is the key; the NHI is a
     second unique index, attached when known (US-11.1.1 as proposed 2026-10-01). The NHI is
     **required**: a record without one is provisional and an exception on the Missing NHI list
     until the NHI is attached (D11 default). The field stays optional in the type, because the
     provisional state is real.
   - `Patient.pendingDetails?: { receivedAtISO; source: 'hospital' | 'surgeon' | 'aa'; bookingId?;
     differences: { field: 'name' | 'dobISO' | 'phone' | 'email' | 'address'; existing?: string;
     incoming: string }[] }`. This follows the `ethnicityPending` quarantine pattern: the incoming
     values are held for review, never written over the record.
   - `Booking.balanceCheck?: { atISO; trigger: 'created' | 'matched' }`: written in the same commit
     that creates or matches the Booking. It is the only stored part of the balance warning; the
     strength and text are always derived.
   - `PatientFollowUp { id; patientId; kind: 'call' | 'note' | 'reminder' | 'resend'; text; invoiceId?;
     warningKey?; dueDateISO? (reminder); atISO; by: string; doneAtISO?; doneBy? }` (DM-47's follow-up
     record: tracked in the system, not remembered; a `resend` entry points at 22's send-history
     entry rather than holding a second copy of the send).
   - `PatientMerge { fromId; intoId; atISO; by; bookingIds; pairIds }`.
   - A `patientCare` slice on `SeedState` and `AppState`: `{ followUps: Record<id, PatientFollowUp>;
     merges: Record<fromId, PatientMerge> }`, seeded empty. Thread it through `freshAppState`,
     `backfillMerge`, `DomainPatch` and `resetDomainState`. `ID_FORMATS` in `store/mutate.ts` gains
     `followUp` (`FUN`, pad 4); counter bumped past the seed.

5. **Intake: returning NHI and the "details differ" prompt** (`store/intake.ts`; the patient
   record's details, US-11.1.1 already Matches).
   - `upsertPatient` looks the NHI up through item 2's index and keeps its enrich-if-undefined
     behaviour on reuse. It also computes `detailDifferences`. If there are any, it stores them as
     `pendingDetails` in the same `mutate`, with the source derived from the actor or the intake
     origin, audits `patient.detailsPending`, and returns `differences` on `IntakeResult`. The record
     itself is never overwritten, so dedupe (the only AC) still holds.
   - `resolvePatientDetails(api, actor, patientId, choices: Record<field, 'keep' | 'useIncoming'>)`:
     office only. It applies the chosen incoming values, clears `pendingDetails` and audits
     `patient.detailsResolved` (before and after per field). If nothing is pending it refuses with
     "Nothing to review.".
   - `PatientEditPatch` gains `ethnicityCode`. `editPatient` validates it with
     `validateEthnicityCode`, refuses a malformed code, stores a code outside the demo subset only as
     `ethnicityPending` (the existing quarantine), and a valid code clears any quarantine.
   - Tests in `intake.test.ts`: Sarah Mitchell re-entered with a new address creates no second record
     and stores one pending difference; the same details store nothing; an office resolve applies
     "use incoming" for the address and keeps the rest; an anaesthetist resolve is refused; an
     ethnicity edit through `editPatient` validates and clears the quarantine.

6. **Attach the NHI, and merge** (`store/patientActions.ts`, exported from `src/store/index.ts`;
   US-11.1.4, US-11.1.5 AC 2).
   - `attachPatientNhi(api, actor, patientId, nhi, choices?)`. It is allowed for the office and for
     14's `OFFICE_SIMULATION_ACTOR` (the PWA stand-in). No other system actor attaches an NHI: an
     NHI that arrives on a hospital row reaches the record only through an office decision (below).
     It refuses an anaesthetist ("The office attaches the NHI."), an invalid NHI (the `validateNhi`
     reason, verbatim), and a patient who already has one ("This patient already has NHI ZAA0067.").
   - **No existing record with that NHI:** set `nhi` (normalised) on the provisional record. Audit
     `patient.nhiAttached`.
   - **An existing record with that NHI:** merge the provisional record into it, in **one `mutate`**
     and as **one action** (no separate merge screen; OQ-49's duplicate point):
     - re-point `patientId` on every Booking of the provisional record (cancelled Bookings included,
       for history), and on every ledger pair that names it (a provisional patient can already have
       a prepayment pair from 27), and on every billable-party reference to it: a pair's or an
       invoice's counterparty that is `{ kind: 'patient', id: fromId }`, 39's credit notes and
       negative invoices addressed to it, and 38b's events billed to it, so no money or invoice
       email is left pointing at the retired id. 21's `Procedure.payer` `{ kind: 'patient' }` holds
       no id (it resolves through the Booking's `patientId`), so it follows the Booking; a named
       payer is not the patient and is left alone;
     - apply `choices` for any `detailDifferences` between the two records (default keep the existing
       record's values). Carry over fields the survivor lacks (phone, email, address, ethnicity), and
       carry over the provisional record's pending ethnicity quarantine if the survivor has no code;
     - delete the provisional row from `masters.patients` and write `patientCare.merges[fromId]`, so
       exactly one record holds the NHI and no second patient record exists (AC 2). The redirect is
       not a patient record: it only lets old links, the audit and History resolve to the survivor;
     - move follow-ups on the provisional record to the survivor; re-key any 15a clearance whose
       warning is unaffected (clearances are keyed by Booking and rule, so they survive as they are);
     - stamp `balanceCheck` with trigger `matched` on each future, non-cancelled Booking of the
       survivor that has no stamp yet: being matched to an existing record is US-11.3.2's "matched
       to them";
     - audit `patient.merge` on the survivor (after: `mergedFrom`, the Booking and pair ids, the
       fields taken from each side) and `patient.mergedInto` on the retired id, so both histories
       read correctly.
   - **Xero (OQ-30 answered):** Xero holds no patient data, only the unique id. The survivor's hidden
     id is unchanged. If the provisional record already had a Xero contact (from a prepayment
     invoice), leave it: its ContactNumber is the retired hidden id, never the NHI. New invoices
     resolve to the survivor's contact. Merging Xero contacts is not modelled; record it.
   - `requestNhiFromRooms(api, actor, bookingId)`: office only. It builds the email with a new
     `buildNhiRequestEmail` in `src/domain/updateEmail.ts`, reusing 35's `mailto` builder and
     `MAILTO_MAX_LENGTH`. The allowlist is: patient name, List date and session, hospital, surgeon,
     Booking time and the Procedure description; **never** a DOB, notes, money, Contract or any NHI.
     The subject is "NHI needed: {patient}, {date}". The To address is the surgeon's rooms email
     (17), falling back to the hospital's contact email, then to empty (`mailto:?subject=...`). It
     returns the `href` and audits `patient.nhiRequested` (to, bookingId), so the problem list can
     show "Requested 21 Jul 09:40".
   - Write the attach and merge body as a draft function (`applyNhiAttach(draft, ...)`) that
     `attachPatientNhi` runs inside its one `mutate`, so two other callers can run it inside their own
     commit, and a refusal leaves nothing half done:
     - `attachPatientNhi(..., { fromRowId })`: when the office attaches an NHI that arrived on a staged
       intake row (item 9's arrived NHI), the same commit marks that row applied to the Booking
       (33's decision audit, by the office), so it does not linger on the matching screen;
     - 33's `decideImportRow` apply-to-existing branch: when the row carries a valid NHI and the target
       Booking's patient has none, the office's decision runs the same body (Details differ choices
       default to Keep). This is the "clears and matches the single record" path of US-11.1.5 when
       the NHI arrives on the daily list, and it is still the office's click.
   - `mergedPatientTarget(state, id)` follows `merges` to the survivor.
   - Tests (`patientActions.test.ts`): attach with no existing record sets the NHI and clears the
     exception; attach ZAP3016 to Noah Prescott merges into `PAT.prescottPrior`, both Bookings sit on
     it, PT0010 is gone, exactly one patient holds ZAP3016 (the index reports no duplicate), and the
     redirect resolves; choices pick the phone; an invalid NHI, a second attach and an anaesthetist
     actor are refused; the merge moves a pair's `patientId`; the merge stamps `matched` and raises
     no balance warning (his only earlier invoice is paid); the email body passes an allowlist test
     (no DOB, no NHI pattern) and falls back to the hospital email; attaching from an arrived row
     marks that row applied in the same commit; `decideImportRow` apply-to-existing with the Forte
     row onto Noah's Booking attaches and merges.

7. **The balance check at booking time** (US-11.3.2, RV-21).
   - `stampBalanceCheck(draft, bookingId, trigger, atISO)`: a draft helper in `store/patientActions.ts`
     that sets `Booking.balanceCheck` if absent. Call it inside the commit of every create and match
     path:
     - `createBooking`, on every path that funnels through it (anaesthetist manual entry, Admin phone
       advice, 33's create-from-row, and the surgeon PDF ingest and any photo path that 34 and 15b
       kept as badged Future-scope demos), with trigger `created`;
     - 33's `decideImportRow` apply-to-existing branch, and `ingestPdfRow`'s update-by-NHI branch, with
       trigger `matched`;
     - `applyNhiAttach`'s merge, with trigger `matched` (item 6).
     A Booking whose patient has no NHI is stamped like any other; it raises nothing because a
     provisional record has no history, and the merge stamps the survivor's Bookings.
   - `patientBalancePreview(state, { patientId } | { nhi })`: a selector the **office** create and match
     surfaces call before saving (the Admin phone-advice form and the matching screen row), returning
     the strength and text the rule would raise. It never stops the save: the button stays "Create
     Booking" or "Save", and a caption reads "Staff can go ahead. The warning stays on the to-do list
     until cleared." (US-11.3.2: "when staff go ahead with the Booking, then it is saved").
   - **Remove the boolean:** delete `patientHasOutstandingPriorEpisode`,
     `MonitorBookingRow.outstandingPriorBalance`, its computation in `billingMonitor`, the "Prior
     balance" pill and tooltip, and the `billing-prior-balance` shot hook. The monitor row instead
     shows 15a's triangle when the Booking carries the open `patientBalance` warning (from
     `warningsForBooking`, never a recomputation).
   - Tests: the S1 path (stage and create Sarah Mitchell's St George's row, or `createBooking` with
     NHI CQY9304) stamps `created` and raises one **strong** warning listing `oa07` at 98 days and
     $610.00; a Booking for Losa Tuilagi (JKL1188: only a 30-day patient-billed invoice) raises one
     **mild** warning; a Booking for Heather Sinclair (ZAN2219: $260.00 held after a credit, nothing
     owing) raises one **mild** credit warning; a Booking for Diane Foster (ZAK8873: an organisation-billed 76-day ACC invoice) and for
     David Chen (ZAE0310: hospital-billed, 29 days) raise none; after `setPatientBalanceThreshold(20)` Tuilagi's
     warning reads strong; a second stamp on the same Booking writes nothing; paying `oa07` removes
     the warning; creating as an anaesthetist still stamps and raises the warning for the office; the
     grep `patientHasOutstandingPriorEpisode|outstandingPriorBalance|Prior balance` over
     `aa-prototype/src` and `aa-prototype/visual` returns nothing.

8. **D11: a Booking without an NHI cannot be authorised** (`store/lifecycle.ts`).
   - Add a blocker kind `nhiMissing` to 21's `authoriseBlockersFor(state, listId)`: one entry per
     active Booking whose patient has no NHI, naming the patient. `authoriseList` refuses with
     `authoriseBlocked` and the sentence "Add the NHI for Noah Prescott before authorising. A Booking
     without an NHI is provisional."
   - Submission and completion are **not** blocked (D11 blocks authorising only), so the
     anaesthetist's workflow is unchanged. This is a block, not a warning, so it is not a 15a rule.
   - `reviewFlagsForBooking` gains a flag, "NHI missing". The List drawer's `attentionReasons` gains
     "NHI missing: Noah Prescott" (pure; its signature widens from `(list)` to take the List's
     Bookings and the patients map, and every caller is updated).
   - `officeSimulation.ts` and 14's `authoriseAsSimulatedOffice` inherit the refusal. Check that the
     simulated office logs it and re-arms without throwing, and that the PWA entry's `disabledReason`
     reads the same blocker ("Noah Prescott has no NHI. Use Office attaches the NHI first.").
   - Rework `billingRun.test.ts`'s 8th-review test (as 20, 21 and 25 left it: its `noBillingRoute`
     failure has likely been re-based to a Contract failure): attach an NHI to the provisional
     Booking's patient before authorising (so it still proves a mispriced Booking fails per Booking
     and the authorise commits), and add a sibling test that authorising with the NHI still missing
     is refused.
   - Tests: a SUBMITTED List holding Noah Prescott's Booking is refused with the blocker; after
     `attachPatientNhi` it authorises; a cancelled NHI-less Booking does not block; no seeded SUBMITTED
     List has an `nhiMissing` blocker (S2 Beat 4, both S3 Lists and S4 Beat 1 stay authorisable).

9. **Selectors** (`store/patientSelectors.ts`, re-exported from the store index; `Pick`-narrowed).
   - `patientSearch(state, query)`: matches name (case-insensitive, any word), NHI (normalised, so
     "zaa 0067" finds ZAA0067), patient id, or DOB (`YYYY-MM-DD`, or `DD/MM/YYYY` parsed purely). It
     returns at most 50 rows (name, patient id, NHI or "NHI missing", DOB, age, next Booking, the
     patient-centric balance, open balance warning strength), sorted by name. Empty query returns patients with a Booking
     in the next 14 days, then everyone with an open item.
   - `patientRecordView(state, patientId)`: the details, the patient id, the ethnicity label, the
     pending details and quarantine, and where the details came from (source of the latest
     `patient.*` audit entry: hospital, surgeon or AA). Bookings are split into upcoming and past,
     each with its List, hospital, anaesthetist and any open warning. Invoices come from
     `patientLedgerPosition`, **including** seeded backdrop history, because this is the patient's
     whole history, across every anaesthetist **and every payer** (US-11.3.1): each row has its number,
     anaesthetist, Booking date, billable party (kind and name), a `countsTowardBalance` flag (item
     2), raised date, age, total, outstanding, the paid, part paid, unpaid or credited state (39), any
     credit held for the payer, and the send history from 22. Balances, from item 2: the
     **patient's balance** (`patientCentricBalance`: everything attributed to the patient whoever
     pays, net of credits, with the by-payer breakdown; US-13.2.2) and **billed to the patient**
     (the counting rows: owing total, count, oldest age, credit held, and the strength the threshold
     gives). It also returns the follow-ups newest first.
   - `missingNhiRows(state)`: one row per **active Booking on a List that is not AUTHORISED** whose
     patient has no NHI. It carries the patient (name, DOB), the Booking (time, Procedure), the List
     (date, session, hospital, anaesthetist; a Draft List from 31 reads "Draft List, unassigned"),
     the surgeon and the rooms contact (room name, email,
     phone; else the hospital's email), days to go, `missingNhiStrength`, the last
     `patient.nhiRequested` time, and an **arrived NHI**: an open staged intake row carrying a valid
     NHI that 33's matcher proposes for this Booking, or, if the matcher keys only on NHI, an open row
     at the List's hospital on the List's date whose normalised name and DOB equal the patient's (one
     pure rule, `arrivedNhiFor`, with its row id, so item 6's `fromRowId` can close it; see item 13).
     Rows are sorted by List date, then time. It is derived, never stored, so the row clears the
     moment the NHI is attached (AC 2) and stays visible until then (AC 3).
   - `openBalanceWarnings(state)` (15a's `openWarnings` filtered to `patientBalance`),
     `followUpsDue(state)` (reminders due on or before today, not done),
     `patientsWithPendingDetails(state)`, and `patientAttentionCount(state)`, which is missing-NHI rows
     plus open strong balance warnings plus due reminders plus pending details, for the nav badge.
   - Tests: search by each key; the record view's invoices include both anaesthetists for Sarah
     Mitchell with the right states, billed to the patient $610.00 and the strength strong, and her
     patient-centric balance also counts her Health NZ episode under Dr Sharma once it is billed
     (hospital-billed, so billed-to-patient does not move); Heather Sinclair's record reads "in credit
     by $260.00" with a mild strength; a pair billed to a named payer (21's Hana Park, BP0001, for Grace
     Park, or a test fixture if no seeded pair bills her) counts to its patient's balance and not to
     billed-to-patient; the balance equals the sum of row
     outstanding less credits to the cent; Noah Prescott's row
     carries Mr Okafor's rooms email; a row on an AUTHORISED List (impossible under D11, but seeded
     history may hold one) is excluded; the badge count adds up.

10. **Seed** (bump `PERSIST_VERSION` by one; extend `persistMigrate.test.ts`: an older version reseeds,
    and the `patientCare` slice and the `patientBalance` rule entry in `appSettings` are backfilled).
    - `domain/seed/patients.ts`: **append** Noah Prescott's earlier record **after the generated pool**
      (push it at the end of `buildPatients`, after the loop, never into `PINNED`: PT0020 is the first
      generated patient, so a pinned row would renumber all 132 of them and every Xero contact number).
      Its id is the next free one, `PT${PINNED.length + GENERIC_COUNT + 1}` = **PT0152** (or later if
      an earlier catch-up phase already appended a patient there), exported as `PAT_PRESCOTT_PRIOR`
      (or a `PAT.prescottPrior` entry computed from those constants). "Noah Prescott", DOB
      1983-05-17, NHI **ZAP3016** (valid mod 11: check digit 6; assert in `seed.test.ts` that no
      generated patient holds it, and pick another valid unused NHI if one does), phone
      "03 555 2716", address "14 Rata Street, Riccarton, Christchurch", ethnicity 11111. Keep PT0010
      (no NHI, phone "021 555 3899") as the provisional record, so the merge shows one real
      difference (phone) and one carried-over field (address). Pushing it after the loop keeps every
      existing id and RNG draw, and the patient counter (`patients.length + 1`) moves past it on its
      own.
    - **Sarah Mitchell's 98-day invoice is billed to her.** Re-point `oa07`'s counterparty from
      `HOSP_STG` to `{ kind: 'patient', id: PAT.mitchell }` (a self-funded laparoscopic
      appendicectomy at St George's; keep `hospitalId`), in the form 21 and 36 left the history
      builder (the pair's billable party is the patient). Without this the S1 beat would raise
      nothing under the "billable patient only" rule. The amount and dates are unchanged, so Souter's
      totals are too; the change adds one patient Xero contact (hidden id as ContactNumber, no NHI).
      Re-run the pinned S3, web Accounts, dashboard and outstanding-list tests and re-pin only a
      by-payer label or a contact count, with the reason.
    - Relabel the Demo Data entity `provisionalNoNhiPatient` "Provisional patient (NHI missing)", and
      add `prescottPriorRecord` ("Noah Prescott's existing record, NHI ZAP3016").
    - **Cross-anaesthetist history under Dr Sharma** (the history builder is Souter-only, so
      generalise `buildHistory`'s anaesthetist, or add a small `seed/patientHistory.ts` that uses 36's
      pair constructors). Put these on backdrop Lists before the canvas horizon, in the `H`
      namespace, each **billed to the patient**:
      - Sarah Mitchell, Sharma, 2026-02-10, $540.00, **paid**, so her record shows two
        anaesthetists: paid under Sharma, unpaid under Souter;
      - Noah Prescott (`PAT.prescottPrior`), Sharma, 2025-11-04, $460.00, **paid**, so the merged
        record has history and raises no warning;
      - Losa Tuilagi, Sharma, raised **2026-06-21** (30 days at `DEMO_TODAY`), $380.00, **unpaid**:
        the mild case (AC 2);
      - the patient of 15a's `SEED_WARNING_SAMPLE_BOOKINGS.multiWarning` Booking, Sharma, raised
        2026-03-23 (120 days), $290.00, **unpaid**, so the shared sample (item 15) shows a strong
        balance warning. If that patient already has a patient-billed unpaid invoice, use it and add
        nothing. Name the patient in the PROGRESS entry.
      - **the credit case** (D24): Heather Sinclair (`PAT.sinclair`, ZAN2219, in no S1 to S5 beat; she also holds
        Souter's Mon 27 Jul Aria rate-time capture Booking that Phase 24 uses, which stays unstamped
        and so raises nothing),
        Sharma, raised 2026-05-12, $260.00, billed to her, **paid** 2026-05-19 and **not paid out**,
        then credited in full on 2026-06-02 (an AA-side error, no rebill) through 39's pure path
        (`creditInFull`, `reversalPlan`, `xeroCorrectionPlan`, `applyCredit`), so the pair is
        `credited`, `credit.heldForPayer` is $260.00, the Xero mirror holds the ACCRECCREDIT, and 36's
        `ledgerChecks` and imbalance stay clean. Her record reads "in credit by $260.00" and a new
        Booking for her raises the mild credit warning. If 41 or another phase already seeded a held
        credit for a person paying for themself, use it instead and add nothing.
      Souter's figures (S3, web Accounts, the dashboard) are untouched; prove it with the existing
      pinned tests. Sharma's collected, paid-out and outstanding figures rise; check nothing pins
      them.
    - Add `NHI_ARRIVALS` in `domain/intake/nhiArrivals.ts`: `{ [PAT.provisional]: 'ZAP3016' }`. Also
      add a Forte Health daily-list sample, `FORTE_DAILY_MON27`, as a **new entry in 33's
      `HOSPITAL_DOWNLOAD_SAMPLES`** (channel `manualSheet`, Forte, 33's entry shape): one row, Noah
      Prescott, DOB 1983-05-17, NHI ZAP3016, phone "021 555 3899", Mon 27 Jul, 08:00, Mr Okafor,
      inguinal hernia repair. Leave 34's `MANUAL_PROVIDER_SHEETS` pointing Forte at
      `SAMPLE_FORTE_SHEET`: `deliverDailySheet` delivers one fixed sample per provider and refuses a
      second Forte import ("Already imported today"), so the arrival must not go through it. Check the
      new sample's row does not dedupe against `SAMPLE_FORTE_SHEET`'s rows.
    - Relabel the seeded Procedure description "Inguinal hernia repair, booked from PDF referral (NHI
      pending)" to "... (NHI missing)". Check the seeded Mon 27 Jul List stays DRAFT; nothing scripted
      authorises it.
    - No seeded `balanceCheck` stamp (no balance warning at reset; S1 raises the first one). No seeded
      follow-up.
    - Seed tests: two fresh seeds deep-equal; PT0001 to PT0151 are unchanged (ids, names, NHIs);
      `buildNhiIndex` reports no duplicate; Heather Sinclair's pair is credited with $260.00 held and
      the ledger is in balance; the Tuilagi invoice is exactly 30 days old at
      `DEMO_TODAY`; `oa07` is patient-billed; no seeded Booking raises a `patientBalance` warning;
      `missingNhiRows` at reset is exactly Noah Prescott's Booking (plus any 34 or 33 seeded NHI-less
      rows, listed by name).

11. **Session 1 gate.** Build, PWA build and Vitest green, with the UI edited only to compile (the
    monitor pill removed, `nhiBadge` callers compiling). Record the counts. Tell the user session 1 is
    green so they can commit it.

### Session 2 · the screens, the wording, the triggers and the guide

12. **`nhiBadge` and the "NHI missing" wording** (`shared/format.ts`; US-03.1.5).
    - `nhiBadge(nhi)` returns `{ text; missing: boolean }`: "NHI ABC1234", or **"NHI missing"** for
      `undefined`, empty or whitespace-only. It is the **only** source of the missing wording.
    - Every render site calls it: `BookingDetailBody`'s Patient block, web `BookingDetailView`,
      `AdminBookingDetail`'s header, web `ListDetailView` (drop the `?? 'NHI pending'` fallback, which
      also misses an empty string), mobile `ListDetailScreen` (render the badge instead of nothing
      when absent) and `ReviewScreen`'s patient cell.
    - When `missing`, show a small warning-tint pill (`semantic.warning.tint` / `onTint`, label type,
      not mono) in place of the mono NHI line. The anaesthetist's Booking detail adds one caption
      line: "The office is getting the NHI from the surgeon's rooms."
    - Grep gate: `NHI pending` appears nowhere in `aa-prototype/src` or `aa-prototype/visual`.

13. **Admin · Patients screens** (`apps/admin/screens/patients/`; routes in `router.tsx` and
    `routes.tsx`; a **Patients** item in `SideNav` after Invoices, with a warn badge from
    `patientAttentionCount`; `AdminApp.tsx` maps the `/admin/patients` section).
    - Routes:
      - `/admin/patients`: Search (`data-shot="admin-patients"`);
      - `/admin/patients/missing-nhi` (`data-shot="admin-missing-nhi"`);
      - `/admin/patients/follow-up` (`data-shot="admin-patient-follow-up"`);
      - `/admin/patients/:patientId`: the record (`data-shot="admin-patient-record"`).
      The record route goes through `RequireEntity`; a merged id redirects to the survivor via
      `mergedPatientTarget`, with a one-line notice ("Noah Prescott's provisional record was merged
      into this one on 21 Jul"). A segmented control at the top switches between the three list
      views, each with its count.
    - **Search:** one search field (placeholder "Name, NHI, patient ID or date of birth") and the
      results table: Name, NHI (mono, or the missing pill), Patient ID (mono), DOB and age, Next
      Booking, Balance (the patient-centric balance, mono, blank when zero, "In credit" when
      negative) and the balance warning strength pill. A row opens the
      record.
    - **Missing NHI:** the problem list. Columns: Patient (name, DOB), List (date, session, hospital,
      anaesthetist, Booking time), Surgeon's rooms (room name, email, phone; or "Hospital: {email}"),
      Days to go (with the strength pill: neutral, then the mild warning tint, then the strong error
      tint), Requested (the last request time or "Not yet"). Actions:
      - **Email rooms**: a real `<a href>` from `requestNhiFromRooms` (audited on click);
      - **Attach NHI**, which opens the attach sheet;
      - **Open Booking**.
      When a staged row carries an arrived NHI, the row shows "NHI arrived: ZAP3016 on the Forte
      Health daily list", and Attach NHI opens with it prefilled. The attach still takes the office's
      click, so nothing is silently applied (US-02.1.5 as 34 built it). The empty state reads "No
      Bookings are missing an NHI." A caption carries the D11 provisional line.
    - **Attach NHI sheet** (a desktop dialog, per convention 16):
      - an NHI field with live `validateNhi` (format and reason);
      - a match preview: "No record holds this NHI: it will be attached to Noah Prescott.", or
        "Matches an existing record: Noah Prescott, 17 May 1983, 1 earlier Booking. The two records
        will be merged.";
      - the **Details differ** table when the records differ: Field, Existing, Incoming, and a
        Keep / Use incoming segmented choice per row (default Keep);
      - a teal **Attach NHI** or **Attach and merge** button; the refusal message inline.
    - **Follow-up:** three lists. **Balance warnings** (`openBalanceWarnings`, strong first): Patient,
      Booking (date, List), strength pill, Owes (mono), Oldest (days), with Open record and 15a's
      **Clear** (the wave-through; "Clear (optional)" on a mild one). **Follow-ups due** (reminders due
      today or earlier, with Done). **Details to review** (patients with `pendingDetails`, opening the
      record). The header line reads "Strong when an invoice billed to the patient is unpaid more than
      90 days from its invoice date. A patient in credit shows a mild warning. Change in Master
      data", linking to the setting (the number read from the setting, never hard-coded). No
      provisional caption: OQ-74 is answered. The same warnings also sit on 15a's Day to-do list; this
      view is the patient-side cut of it.
    - **Patient record:**
      - A header with the name, the NHI badge, the patient id (mono), DOB and age, and a Search link
        back.
      - Left column: **Details** (name, DOB, phone, email, address, **Ethnicity**, shown as
        "11111 · New Zealand European" from `ETHNICITY_DEMO_SUBSET`, or the quarantine note, and
        "Details from: hospital"). Edit opens `EditPatientSheet` with the new Ethnicity field, which
        is a code input with a live check and the label. If `pendingDetails` exists, a **Details
        differ** card sits above it, with the same Keep / Use incoming table and Apply
        (`resolvePatientDetails`).
      - An **Attach NHI** button when the NHI is missing.
      - Main column: three **balance tiles** in the Admin Review tile anatomy, patient-centric first
        (US-13.2.2): **Balance** (the patient's whole balance, whoever pays, mono money; "In credit
        $260.00" when negative), **Billed to the patient** (owing, with the warning's strength pill,
        the count of unpaid invoices and the oldest age, or the credit held), and **Other payers**
        (outstanding owed by a person paying for them, hospitals, insurers and ACC). Under the tiles,
        a one-line **By payer** breakdown (for Sarah Mitchell, "Sarah Mitchell $610.00", plus a
        Health NZ entry once her Tue 14 Jul episode is billed), so the office sees whose money it is
        without leaving the patient. Then 15a's `WarningsPanel` for any
        open balance warning on an upcoming Booking, with Clear.
      - The **Invoices** table (US-11.3.1): Number (links to the invoice), Anaesthetist, Booking date
        (links to the Booking, or its as-at view from 35), Billable party (a "Patient" tag on the
        counting rows), Raised (the invoice date the age counts from), Age (days, unpaid rows only),
        Total, Outstanding and Status (the pills Paid, Part paid, Unpaid and Credited, with "Credit
        held $260.00" and a link to 39's credit note on a credited row). It is ordered oldest unpaid first,
        then newest paid, with one footer total and no ageing buckets (38 removed them). A row menu
        holds **Resend** (22's `resendInvoice`, which appends to the invoice's send history rather than
        refusing a second send, and also logs a `resend` follow-up; DM-47; a portal invoice shows
        "Delivered via the {portal} portal" instead) and **Log follow-up** for that invoice. The row
        expands to show the send history (each send's time, address and who sent it).
      - **Bookings:** the upcoming and past Bookings, with List, hospital, anaesthetist and the
        triangle.
      - The **Follow-up log** (US-11.3.3): Log call, Add note and Set reminder (a date field and text).
        Entries are newest first, each with who and when, the linked invoice number, and Done on open
        reminders. `logPatientFollowUp(api, actor, input)` and `completeFollowUp(api, actor, id)` are
        in `patientActions.ts`: office only, non-empty text, a reminder date on or after today,
        audited `patient.followUp` and `patient.followUpDone`. Clearing a balance warning with a note
        also logs a `note` follow-up linked by `warningKey`.
    - **Master data**: a new "Patient balance warning" view beside "Xero & archiving"
      (`data-shot="master-patient-balance-threshold"`). It has **one** number field, "Patient balance
      warning after N days" (label "Strong warning after", a days suffix), with Save
      (`setPatientBalanceThreshold`), the saved confirmation, the caption "Counts from the invoice
      date, and only amounts the patient owes on invoices billed to them. Under the threshold the
      warning is mild; over it, strong. A patient in credit gets a mild warning. A change applies at
      the next Booking check.", and a History link. No other warning settings, no active switches, no
      rule list (US-13.7.4 is Future).
    - Add every new audit code to `ACTION_LABELS`: "NHI attached", "Patient records merged", "Merged
      into another record", "Patient details differ", "Patient details reviewed", "NHI requested from
      rooms", "Follow-up logged", "Follow-up done", "Patient balance threshold changed". Entity
      labels: patient, settings.

14. **Where the warning and the exception surface outside Patients.**
    - **Matching screen** (33, 34): on a row whose patient matches a record with a balance,
      `patientBalancePreview` shows 15a's warning row inline before the decision ("Sarah Mitchell owes
      $610.00 on 1 invoice, unpaid 98 days"), with an Open patient record link and the go-ahead
      caption; Create Booking is unchanged and the decision result repeats it ("Booking created.
      Strong balance warning on the to-do list."). A row without an NHI that creates a Booking shows
      "No NHI: this Booking is provisional and is listed on Missing NHI" (D11). McMurray's NHI-less
      row from 34 now follows this rule instead of 33's interim.
    - **Matching screen, arrived NHI:** a row that `arrivedNhiFor` links to a provisional patient's
      Booking proposes apply-to-existing onto that Booking with the caption "Carries the missing NHI
      for Noah Prescott. Applying attaches it" (and "and merges him into his existing record" when
      the NHI already belongs to one), never Create Booking, so the arrival cannot make a second
      Booking or record.
    - **Admin Booking detail**: the patient name links to the record. The balance warning shows in
      15a's `WarningsPanel` and triangle (office only). With the NHI missing, the Patient section
      shows "Provisional · NHI missing" and, for the office, **Attach NHI** (the same sheet).
    - **Admin Day**: 15a's to-do list and the List outline carry the balance warning with no change
      here beyond the rule.
    - **Review screen**: the "NHI missing" flag, and the blocked Authorise with 21's sentence pattern
      and the D11 caption.
    - **Billing monitor**: 15a's triangle in place of "Prior balance" (item 7).
    - **Manual Booking form** (`ManualBookingForm`, all three apps): with the NHI left blank, an
      inline caption reads "Without an NHI this Booking goes ahead flagged. The office will chase the
      NHI, and the List cannot be authorised until it is added." With an NHI that matches an existing
      record with different details, the existing "matched existing record" line adds "Some details
      differ. The office will review them." In **Admin's** phone-advice form only, the
      `patientBalancePreview` row shows beside the matched record with the go-ahead caption; the
      mobile and web forms never show it.

15. **Demo triggers** (the registry, `src/shared/demoTriggers/registry.ts`; see the next section).
    Bodies go in `src/shared/demoTriggers` or `src/store`, so `pwaPurity` holds. Add `patientId` to
    the `DemoContextValues` keys only if the record screen needs to publish something the URL cannot
    carry. It should not: the URL has `patientId`, and the mobile route has `bookingId`. Add the
    `patientBalance` entry to 15a's `WARNING_SAMPLES` (`stage` stamps `balanceCheck` on the
    `multiWarning` Booking as `DEMO_TRIGGER_ACTOR`; `unstage` removes the stamp and the sample's
    clearance, as 15a's other samples do). The sample is office-audience, so on 15a's mobile Booking
    route (bar and PWA) it is skipped, and on any Booking whose patient owes nothing it is skipped
    too: it never stamps a Booking where it would show nothing. Skipped samples count as done for
    15a's "Samples already raised" state, and the trigger's message names only the samples it
    staged.

16. **Copy and comment sweep.** Grep `src/` for `NHI pending`, `Prior balance`, `prior episode`,
    `unpaid alert`, `where available`, `provisional` (in patient contexts) and `WI2a`. Reword every
    user-visible string and fix stale comments, including `Patient`'s doc comment and the `intake.ts`
    header ("without an NHI, create a provisional record" now adds "listed on Missing NHI until the
    NHI is attached"). The words are "balance warning", mild and strong, never "alert" in new copy.
    No en or em dashes in any string added or changed.

17. **Tests and shots.**
    - Component tests: the Missing NHI row renders the rooms email and the strength pill; the attach
      sheet shows the merge preview and the Details differ table and calls `attachPatientNhi` with the
      choices; the record's invoice table shows Paid (Sharma) and Unpaid (Souter) for Sarah Mitchell
      with billed to the patient $610.00 and the strong pill, and the Balance tile counts every
      payer; Heather Sinclair's record shows "In credit $260.00", the Credited pill and the mild pill;
      a second Resend appends to the send history; the threshold field refuses 0 and 731; mobile
      `ListDetailScreen` shows "NHI missing" for Noah Prescott; the mobile Booking detail shows no
      triangle for an office-audience warning.
    - `demoScenarios.test.ts`: the S1 jump plus its Beat 1 steps leave one open strong
      `patientBalance` warning on Sarah Mitchell's new Booking.
    - Playwright: a new `visual/admin-patients.spec.ts` (search, record, Missing NHI with the arrival
      trigger, attach and merge, follow-up view, Clear, the credit record, the Master data threshold
      field); the S1 spec asserts the warning row on the
      matching screen and the to-do entry after Create Booking; a mobile shot of the Mon 27 Jul List
      with "NHI missing"; the PWA device spec runs "Office attaches the NHI" on Noah's Booking; the
      billing monitor spec drops `billing-prior-balance`. `data-shot` hooks as named above.

18. **PWA parity check.** On the PWA, open Mon 27 Jul AM, then Noah Prescott: "NHI missing" shows and
    the chip offers "Office attaches the NHI". After running it, the NHI shows, and the List's "Office
    authorises this List" no longer carries the "no NHI" reason once the List is submitted (pin this
    in a Vitest test over `demoTriggersFor` and the entry's `disabledReason`, rather than by hand).
    The balance warning is office-only, so the PWA shows no triangle for it and 15a's "Office clears
    this warning" never lists it (pin in the same test). The office screens have no PWA equivalent
    (the PWA has no Admin), which is expected.

19. **Demo guide** (see "Demo guide updates"), in the same session.

20. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`.

## Demo triggers

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Simulate NHI arrival (daily hospital list) | Admin · Patients · Missing NHI (`/admin/patients/missing-nhi`) and the record of a provisional patient (`/admin/patients/:patientId`) | bar | `choices`: the missing-NHI rows whose patient has an `NHI_ARRIVALS` entry (Noah Prescott at reset). Imports `FORTE_DAILY_MON27` with 33's `importHospitalDownload(api, OFFICE_ACTOR, sampleId)` (channel `manualSheet`, Forte Health; not `deliverDailySheet`, which is fixed to `SAMPLE_FORTE_SHEET` and refuses a second Forte import), so the row is staged on the matching screen like any hand-imported daily sheet. The Missing NHI row then shows "NHI arrived: ZAP3016" with Attach NHI prefilled; one click (Attach and merge, with the Details differ choice for the phone) clears the row, marks the staged row applied and merges Noah into his earlier record. Disabled with "Already delivered" once a batch for that sample exists, and "No NHI to arrive for this patient" on a record without a fixture. Nothing is applied without the office's click |
| (no new trigger) Strong balance warning on the S1 match | Admin · Intake matching screen | none | The existing S1 flow: 34's on-open sync stages Sarah Mitchell's St George's row, the row previews the warning, Create Booking runs `createBooking`, and the rule raises the **strong** warning (98-day patient-billed invoice) on the to-do list. The **mild** case: in Admin, add a Booking for Losa Tuilagi (JKL1188, a seeded 30-day invoice). The **credit** case: add a Booking for Heather Sinclair (ZAN2219, $260.00 held after a seeded credit note): a mild warning. The demo clock's menu ages invoices from their invoice date (`+61 days` turns Tuilagi's mild warning strong and re-opens it if cleared) |
| (no new trigger, product) Change the threshold | Admin · Master data · Patient balance warning | none | The one admin field: set 20 and save, and Tuilagi's 30-day warning reads strong at the next check (US-11.3.2's "admin changes the threshold"); set 90 and it reads mild again. Product UI, so no demo button |
| Raise sample warnings (15a, shared) | Admin · Day and Admin · Booking detail (15a's routes) | bar | Gains the `patientBalance` sample: stamps a balance check on 15a's `multiWarning` Booking, whose patient carries a seeded 120-day patient-billed invoice, so the to-do list shows a strong balance warning beside the other rules' samples on the same Booking. "Clear sample warnings" removes the stamp. No new entry |
| Office attaches the NHI | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) and Mobile · List (`/mobile/lists/:listId`, with `choices` of the List's NHI-missing Bookings) | PWA only, `badge: 'office-stand-in'` | `attachNhiAsSimulatedOffice(api, bookingId)` in `src/store/officeStandIn.ts` beside 14's `authoriseAsSimulatedOffice`: `attachPatientNhi` as `OFFICE_SIMULATION_ACTOR` with the `NHI_ARRIVALS` value if one exists, else a deterministic synthetic NHI (`generateNhi('current', slotRng(seed, 'nhi-arrival', patientId))` with the store's seed, redrawn from the same stream until unused), keeping the existing record's details on a merge. Disabled with "This patient already has an NHI" or "Only a Booking with the NHI missing". Message: "The office attached NHI ZAP3016 and merged Noah Prescott into his existing record. The List can now be authorised once submitted." |

Re-pointed, not added: 14's `office-authorises-list` PWA entry's `disabledReason` reads the new
`nhiMissing` blocker. Nothing is added to the Control Panel page; its index picks up the new entries
under their screens.

PWA parity: the mobile beat is "NHI missing" on the List and Booking, then the office attaching it.
The handset gets that from "Office attaches the NHI". The balance warning and the patient record are
office-only (US-11.3.x are Admin App stories, and the anaesthetist never sees patient money), so they
need no PWA stand-in.

## Out of scope

- NHI lookup against the Health NZ Digital Services Hub and refresh from the central register
  (FT-14.4, US-14.4.1; Phase 40a): the simulated `lookupNhi` stays as it is. The NHI validators stay
  where 34 put them (US-11.1.2).
- Correcting a wrong NHI, detaching an NHI, un-merging two records, a separate merge screen and a
  "do not change" flag (OQ-49's options). Merges are audited and one-way. Two different NHIs are two
  different people, and are never merged.
- The full NZHIS Level 4 ethnicity code table: `ETHNICITY_DEMO_SUBSET` stays, and a well-formed code
  outside it is quarantined as today (US-11.1.1 has no gap on the code set; 40a's out-of-scope line
  points here, so record it in the phase entry).
- Merging Xero contacts, and a Xero lookup by NHI (OQ-30: no patient data in Xero).
- The billable party, the payer step and the child warning (21); invoice delivery itself (22). A
  named payer's (for example a guardian's) own balance across several patients is not modelled:
  their invoices count toward each patient's patient-centric balance (US-13.2.2) but never toward
  the patient's balance warning.
- The warnings settings page (US-13.7.4, Future): only US-11.3.2's single threshold is editable.
- The prepayment warning, letters and reminders (27, 41); dunning or statement letters, SMS, and
  automated reminder emails. A reminder here is an office to-do, not a message to the patient.
- Ageing buckets or an overdue view (removed in 38); raising credit notes or rebills (39; this phase
  only reads them, and lists a rebill's replacement invoices as ordinary rows beside the credited
  original); refunding a patient's held credit, which happens outside the system (US-08.6.5, "a
  credit note is not a refund"; 39 records `heldForPayer` only, and 41's trust refund covers only a
  cancelled prepayment).
- Showing patient money or the balance warning to the anaesthetist.
- Patient bulk loads (42), search at full scale (43), and the NHI leak scan (43, which should cover
  the new NHI request email).
- A per-hospital or per-anaesthetist threshold, and escalation settings for the Missing NHI list: one
  global threshold and two labelled constants until AA asks for more.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. The Admin side nav shows **Patients** with a warn badge. Missing NHI lists exactly Noah
      Prescott (Mon 27 Jul AM, Forte, Dr Souter, 08:00), with Mr Okafor's rooms email and phone, "6
      days" in the mild tone and "Not yet" requested (plus any 33 or 34 seeded NHI-less row, named).
      The Day to-do list holds no balance warning.
- [ ] Email rooms opens a mail draft addressed to the rooms, subject "NHI needed: Noah Prescott,
      27 Jul". The body has no DOB and no NHI. The row now reads "Requested" with the time, and the
      Audit viewer shows "NHI requested from rooms".
- [ ] Mobile, Mon 27 Jul AM: Noah Prescott's row shows the "NHI missing" pill. His Booking shows "NHI
      missing" with the office caption. On the web, the List table and Booking detail say the same.
      Nothing reads "NHI pending" anywhere.
- [ ] To see the gate without capturing a whole future List: in Admin, Move Noah Prescott's Booking
      onto a seeded SUBMITTED List (the office may move a Booking onto a SUBMITTED List). In Review,
      the row carries the "NHI missing" flag and Authorise is blocked with "Add the NHI for Noah
      Prescott before authorising", plus the provisional caption. The List drawer's Needs attention
      box names him too. (Reset after this check; the next items start from the seed.)
- [ ] On Missing NHI, Demo actions shows "Simulate NHI arrival (daily hospital list)". Run it: the
      matching screen holds the Forte row, and the Missing NHI row reads "NHI arrived: ZAP3016".
      Attach NHI opens prefilled with "Matches an existing record" and a Details differ row for
      Phone. Choose Use incoming, then Attach and merge: the row disappears, the badge drops by
      one, and the Forte row on the matching screen reads applied (not open). Running Deliver
      hospital sheet for Forte beforehand does not stop this trigger.
- [ ] Search "Prescott": one result, with NHI ZAP3016 and patient ID PT0152. The record shows phone
      "021 555 3899", the carried-over Riccarton address, the paid Sharma invoice and both Bookings.
      `/admin/patients/PT0010` redirects there with the merge notice. The Audit viewer shows "Patient
      records merged". No balance warning was raised (his only earlier invoice is paid).
- [ ] S1 Beat 1 as 34 built it: open Admin Intake, then Sarah Mitchell's row. The row shows the
      strong warning row ("owes $610.00 on 1 invoice, unpaid 98 days") with the go-ahead caption.
      Create Booking: the Booking is saved, the result says the strong warning is on the to-do list,
      the Day to-do list shows it in the strong (red) tone, her Admin Booking detail shows the triangle
      and `WarningsPanel`, and the Billing monitor (once billed) shows the triangle instead of "Prior
      balance". On mobile and web her Booking shows no triangle for it.
- [ ] Sarah Mitchell's record: the Balance tile is her whole balance whoever pays (US-13.2.2),
      higher than Billed to the patient if her Tue 14 Jul Health NZ episode under Dr Sharma has
      been billed (it is hospital-billed, so it shows under Other payers and in the By payer line,
      never in Billed to the patient). Billed to the patient reads $610.00 (Strong), 1 unpaid
      invoice, 98 days. The table shows the Souter invoice (Unpaid, raised 14 Apr, 98 days, Patient
      tag) and the Sharma invoice (Paid). Log a call, set a reminder for today, and Resend the Souter
      invoice twice: the log shows the entries, the reminder appears under Follow-ups due, and the
      invoice's send history keeps both sends (no "already emailed" refusal). Clear the warning from
      the record: it leaves the to-do list.
- [ ] Mild case: in Admin, add a Booking for Losa Tuilagi (NHI JKL1188) on any DRAFT List. The form
      previews a mild warning and saves. The to-do list shows "owes $380.00 on 1 invoice, unpaid 30
      days" in the mild tone. Clear it (optional). Advance the demo clock 61 days: it re-opens strong.
      Reset the clock.
- [ ] Not the patient's bill: add Bookings for Diane Foster (ZAK8873, billed to Canterbury Orthopaedic
      Surgeons, 76 days) and
      David Chen (ZAE0310, hospital-billed 29 days). No balance warning for either. Their records still list
      those invoices, without the Patient tag, and their Balance tiles still count them (patient-centric,
      US-13.2.2) under Other payers.
- [ ] Credit case: Heather Sinclair's record reads "In credit $260.00", with the credited Sharma
      invoice (Credited pill, link to the credit note). Add a Booking for her (ZAN2219) in Admin: the
      form previews a mild warning, "Heather Sinclair is in credit by $260.00. Check before
      invoicing.", it saves, and the to-do list shows it in the mild (yellow) tone.
- [ ] Threshold: Master data shows one "Patient balance warning" view with a single field and no
      other warning settings. Set 20 and save; 0 and 731 are refused.
      Tuilagi's warning now reads strong. Set it back to 90 and it reads mild again.
- [ ] As Dr Souter on mobile, add a Booking for Losa Tuilagi: it saves with no warning on mobile, and
      the Admin to-do list shows the mild warning on it.
- [ ] Ethnicity: on a record, Edit, enter a malformed code (refused), then 21111 (shows "21111 ·
      Māori", the subset's label). The Booking's Patient block shows it too.
- [ ] Details differ on intake: add a Booking for Sarah Mitchell (CQY9304) with a new address from
      the web manual form. The form says "Some details differ". No second patient exists. Patients,
      Follow-up, Details to review lists her, and on her record, Apply with "Use incoming" updates
      the address.
- [ ] On Admin Day, Raise sample warnings: the `multiWarning` Booking carries a strong balance warning
      beside the other rules' samples. Clear sample warnings removes it.
- [ ] PWA (`npm run build:pwa`, then preview): Mon 27 Jul AM, then Noah Prescott. The chip offers
      "Office attaches the NHI" with the office stand-in badge. Run it: the result message names
      ZAP3016 and the merge, the Booking and the List row show the NHI, and a second run is disabled
      with "This patient already has an NHI". (The authorise refusal on the PWA path is pinned by the
      Vitest test in item 8.)
- [ ] Reset restores the threshold (90), no balance warnings and Noah's provisional record.
- [ ] Catalogue screenshots: the recipes for the covered items above (US-11.1.4, US-11.1.5, US-11.3.1, US-11.3.2, US-11.3.3, US-13.2.2 and US-03.1.5) are created or updated, any recipe this phase broke is re-pointed (US-11.1.1's two shots moved onto the new record), a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are green.

## Demo guide updates

Patch these in the same session, and the same sections of `master-demo-guide.html`:

- `03-demo-script.md`:
  - **S1 Beat 1** (as 34 rebuilt it): on Sarah Mitchell's row and after Create Booking, the
    **Expected** line adds the strong balance warning (1 invoice billed to her, unpaid 98 days,
    $610.00) and its to-do entry. The **Say** line adds: "Sarah owes AA for an earlier procedure, and
    it is past the 90 day threshold, so the office gets a strong warning to follow up before this
    one goes ahead. It never stops the booking. The 90 days count from the invoice date; a newer bill
    would be a yellow, mild warning, and a bill the hospital pays does not count." Script it
    deliberately. It is one or two sentences, and the beat's
    focus stays on sync then match.
  - **New optional S1 Beat 1d, "the patient's whole bill"**: open the patient record from the
    warning. Read the tiles (her whole balance whoever pays, then what is billed to her) and the two
    anaesthetists (paid under Sharma, unpaid under Souter), Log call, Resend the Souter invoice, then
    Clear the warning (the wave-through). Optional: book Losa Tuilagi for the mild case, or Heather
    Sinclair for the credit case (mild); show the one threshold field in Master data. Discovery
    points: whether the warning needs the new Booking to bill the patient too, whether the
    anaesthetist should see it, and the starting threshold (US-11.3.2 is still to check with Ben).
  - **S5, a new optional beat, "a missing NHI is an exception, not a duplicate"** (S5 is the
    Compliance tour and already holds the NHI validation beat): Patients, then Missing NHI (Noah
    Prescott, the rooms contact, Email rooms), then Simulate NHI arrival (daily hospital list), then
    Attach and merge with the phone difference. The row clears; search shows one Noah Prescott.
    Optional: show Review blocked before the attach. Discovery points: D11 / OQ-49 (can a Booking go
    ahead without an NHI, and how should duplicates be handled?).
  - "Direct URLs": `/admin/patients`, `/admin/patients/missing-nhi`, `/admin/patients/follow-up`,
    `/admin/patients/PT0005` (Sarah Mitchell), `/admin/patients/PT0010` (redirects after the merge).
  - "Recovery from demo accidents": a merge cannot be undone except by Reset; a cleared balance
    warning re-opens only if it turns strong.
- `04-presenter-cheat-sheet.md`: rewrite **section 11** as "Patient balance warning". It is one of
  the warning routine's rules (15a's section): raised when a Booking is created or matched for a
  patient who owes AA money on invoices billed to them; mild within the threshold, strong over it (90
  days from the invoice date, one admin field in Master data; OQ-41 and OQ-74 answered); a patient in
  credit is mild; yellow for mild, red for strong; hospital, insurer and other payers' bills do not
  count toward the warning, though the patient record's balance shows them (patient-centric); it
  never blocks; office-only. Add a
  "Booking without an NHI" item (D11 default, provisional: goes ahead flagged, listed, the List
  blocked at authorise). Update "What each app is for" (Admin gains Patients).
- `02-workflows-and-handoffs.md`: in intake, a Booking without an NHI goes on Missing NHI, the office
  emails the rooms, and the NHI arrives on the daily hospital list and is attached (merge, no
  duplicate); a returning patient who owes money raises the balance warning. In billing follow-up,
  the patient record, the follow-up log, Resend and Clear.
- `01-personas-and-responsibilities.md`: the office persona chases missing NHIs and follows up
  patients who owe from the patient record and the to-do list. The anaesthetist sees "NHI missing"
  and never the patient's balance.
- The Control Panel's S1 scenario text (`DemoControlPanel.tsx`, as 34 left it): add "Creating her
  Booking raises a strong balance warning (98-day invoice billed to her)." Add a one-line S5 mention
  of the Missing NHI beat.
- The Demo Data entity labels (item 10).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 40` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-11.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.4.md) Patient without NHI | partial · nhi-pending (admin Booking BK0035, which is already Noah Prescott's, `[data-shot=booking-patient]`) | captured, with the D11 default as the built reading (the Booking goes ahead flagged; the story is still Open). Keep the shot `name` `nhi-pending` and its start (`/admin/day/2026-07-27/bookings/BK0035`, Noah Prescott, Mon 27 Jul AM, Forte, Dr Souter) and re-caption it "Booking without an NHI, shown as NHI missing"; add an `attach-nhi` state on `/admin/patients/missing-nhi` (the Attach NHI sheet with ZAP3016 and the Details differ choice for the phone) and a `list-blocked` state on that Booking's List showing authorise refused for the missing NHI. Drop the partial reason |
| [US-11.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.5.md) Missing NHI problem list | absent placeholder (no shots; reason "Not built yet: catch-up Phase 40 builds this.") | fill it, captured. Admin shot `missing-nhi-list` at `/admin/patients/missing-nhi` with states `list` (Noah Prescott, the List, Mr Okafor's rooms email and phone, "6 days" in the mild tone, "Not yet" requested; highlight the row) and `arrived` (run the "Simulate NHI arrival (daily hospital list)" entry from `[data-shot=demo-actions]`, then the row reads "NHI arrived: ZAP3016" with Attach NHI prefilled). Caption: "Missing NHI problem list, with the surgeon's rooms" |
| [US-11.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.1.md) Patient outstanding bills view | absent (no patient view) | captured. Admin shot `patient-invoices` on `/admin/patients/PT0005`, highlighting the invoice table: every invoice across every anaesthetist (paid under Dr Sharma, unpaid under Dr Souter) with paid, part paid or unpaid pills and the balance. Caption: "All of a patient's invoices across anaesthetists" |
| [US-11.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.2.md) Alert on booking a patient with unpaid bills | partial · prior-balance (billing monitor, `[data-shot=billing-prior-balance]`, scenario S5) | captured. Replace `prior-balance` with `balance-warning`: setup `{ "scenario": "S1" }`; states `preview` (the matching row's preview before Create Booking), `to-do` (after Create Booking, the strong, red warning on 15a's to-do list: 1 invoice billed to her, unpaid 98 days from its invoice date, $610.00), `credit` (Admin phone advice for Heather Sinclair, ZAN2219: the mild, yellow preview "in credit by $260.00") and `threshold` (Master data, `[data-shot=master-patient-balance-threshold]`, the one "Patient balance warning after N days" field at 90). Admin only: the warning is office-only. Caption in the catalogue's words ("balance warning"). Drop the partial reason |
| [US-11.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.3.md) Follow-up tools | partial · resend-invoice[ready, sent] | captured (with DM-47). Keep `resend-invoice` (ready, sent) and add a `resent` state after 22's Resend: the send history lists both sends, not an "already emailed" refusal; add `follow-up-log` on `/admin/patients/PT0005`: Log call, Set reminder, Resend and the completed entries, each with who and when and the linked invoice number. Drop the partial reason |
| [US-13.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.2.md) Per-patient balance | absent (no patient profile) | captured. Admin shot `patient-balance` on `/admin/patients/PT0005`, highlighting the balance tiles and the By payer line: the patient's whole balance attributed to her whoever pays, with Billed to the patient and Other payers beside it. Add a `credit` state on Heather Sinclair's record ("In credit $260.00"). Caption: "Per-patient balance, attributed to the patient whoever pays" |
| [US-03.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.5.md) Anaesthetist sees the patient's NHI | absent placeholder (no shots; reason "Not built yet: catch-up Phase 40 builds this.") | fill it, captured. Mobile and web shots `nhi-shown` (a Booking with an NHI, e.g. Sarah Mitchell) and `nhi-missing` (Noah Prescott, Mon 27 Jul AM: the "NHI missing" pill on the List row and on the Booking). Web start `/web/lists/:listId`, mobile `/mobile/lists/:listId` and `.../bookings/:bookingId`; highlight the NHI line. Neither app shows patient money |

**Recipes this phase breaks.**

- `US-11.3.2.json` and `US-11.1.4.json` hold the removed "Prior balance" pill (`[data-shot=billing-prior-balance]`) and "NHI pending" wording; they are rewritten above. `US-11.1.4.json` already uses Phase 15's `[data-shot=booking-patient]` and `/bookings/` route; confirm the hook survives item 12's NHI badge change, else move it.
- `US-11.1.1.json` (left this phase: Matches). Its `patient-record` and `edit-patient` shots sit on a Booking's patient block (`/admin/day/2026-07-21/bookings/BK0009`, Margaret Ellison, `[data-shot=booking-patient]`) with the partial reason "no standalone patient record screen", which this phase removes. Re-point `patient-record` to `/admin/patients/PT0005` (the identity block: patient id, NHI, ethnicity) and `edit-patient` to the record's Edit sheet with the ethnicity field, keep the image names the catalogue lists, and drop the partial reason. No new state is needed.
- `US-11.1.3.json` (`dedupe-nhi`, web and mobile, NHI CQY9304 on Add a booking, Enter manually) shows the returning-NHI match. US-11.1.3 is Retired (merged into US-11.1.1), but this recipe still produces the four `assets/US-11.1.3/*-dedupe-nhi-*.png` images US-11.1.1 lists, so keep it capturing; this phase adds the "Some details differ" prompt, so re-check its caption and highlight.
- `US-14.4.1.json`, `US-02.4.1.json` and `US-02.4.2.json` start from Add a booking with CQY9304 or a seeded patient; re-run them with `--dry`, since the balance preview and the Sarah Mitchell and Losa Tuilagi invoices change. `US-08.5.1.json` highlights Losa Tuilagi in the billing pipeline: the seed appends patient-billed Sharma history invoices, which stay off the office Invoices list and monitor.
- Work item 17 already lists the specs; the `--dry` run is the check for anything else.

**ATLAS.md.** Update "Routes" (the `/admin/patients` family), "Personas and IDs" (Noah Prescott ZAP3016 and his appended patient id, Sarah Mitchell PT0005, Losa Tuilagi JKL1188, Heather Sinclair ZAN2219 for the credit case), "Seed data worth shooting" (the Mon 27 Jul AM Forte List, the patient-billed history invoices, the credited Sinclair invoice), "Existing hooks" (the new patient, Missing NHI, threshold and warning `data-shot` hooks; remove `billing-prior-balance`) and the demo-trigger ids this phase registers.

## Adversarial review (after build)

Run the standard review-and-fix pass (PROGRESS convention 18):

- fan out three Opus review subagents, one each for quality, bugs and plan adherence, steered by the
  bullets below;
- independently verify each finding before acting on it;
- fix the confirmed findings, re-green build, PWA build, Vitest and shots, and record the pass in
  the phase entry;
- do not re-raise anything already settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**

- **One record per patient, one per NHI.** The patient id is the key and the NHI index never holds a
  duplicate. No path creates a second record for an NHI: `upsertPatient`, `attachPatientNhi`, 33's
  decisions, PDF ingest, the HL7 path on the Future-scope surface, and the PWA stand-in's synthetic
  NHI. After a merge nothing still references the retired id: Bookings, ledger pairs, follow-ups,
  billable-party links, 35's change sets and as-at views, and the History sheet via the redirect. The
  merge is one `mutate`, and a refusal leaves nothing half done.
- **The balance rule.** It is one 15a rule, never a block, never a separate alert store. Only
  patient-billed receivables count toward the warning (`countsTowardPatientBalance` is the only
  filter); hospital, insurer, named-payer, AA fee and credited rows never count as owing; the
  Booking's own invoice is excluded. Strong is strictly older than the threshold, counted from the
  invoice date only in `invoiceAgeDays`; within it is mild, and the 30-day case is mild, not silent; a
  credit held for the patient with nothing owing is mild (D24). No "provisional (OQ-74)" caption
  survives. The threshold is one Master data field and nothing more of US-13.7.4's page. Only stamped Bookings warn, every create
  and match path stamps inside its own commit (grep every `createBooking` caller and every
  apply-to-existing branch), and no seeded Booking is stamped. The office can always go ahead and
  Clear. No trace of `patientHasOutstandingPriorEpisode`, "Prior balance" or an `UnpaidAlert` type
  survives.
- **Office audience.** The warning never reaches a mobile or web surface: triangle, the
  `WarningsPanel` on opening a Booking, the PWA clear entry (and there is no submit confirm step
  anywhere, per US-13.7.3). Other rules' warnings still show there.
- **The ledger is the truth.** The patient record's invoices and balances read
  `patientLedgerPosition`, never `state.xero`. Backdrop history is included here and still excluded
  from the office's Invoices list and monitor. The record's Balance is patient-centric (every payer,
  US-13.2.2) while the warning reads only the billed-to-patient subset; both equal the sum of their
  rows' outstanding less credits held, to the cent. A credited pair (39) owes nothing.
  Souter's pinned totals are unchanged by the `oa07` payer change and the Sharma seed.
- **D11.** An NHI-less Booking blocks authorising on every path (Review, `authoriseList`, the PWA
  entry, the office simulation) with the same sentence; submit and completion are not blocked; no
  seeded SUBMITTED List gained a blocker; the provisional caption is present while OQ-49 is open.
- **No silent apply.** "Simulate NHI arrival" only stages a row; the NHI reaches the record only by
  the office's attach (or by the PWA stand-in, which is badged as the office). Details that differ are
  held in `pendingDetails`, never written over the record without a choice.
- **Privacy.** The NHI request email and every new string pass the allowlist: no DOB, NHI, money or
  notes in an email; the NHI never enters Xero or any new Xero field (OQ-30; `xeroNhi.test.ts` still
  passes); the mobile and web apps show the NHI or "NHI missing" and nothing about balances.
- **Triggers and PWA.** Entries show only on their routes; the PWA stand-in is PWA-only and badged;
  the sample is in 15a's shared body, not a new button; bodies live in `src/shared` or `src/store`
  (`pwaPurity` holds); no Control Panel additions; the synthetic NHI is deterministic (no
  `Math.random`, `Date.now()` or `new Date()`).
- **Persistence and determinism.** `PERSIST_VERSION` bumped, the migrate test backfills
  `patientCare` and the `patientBalance` rule entry, two fresh seeds deep-equal, Noah's earlier record
  is appended after the generated pool without shifting any id or RNG draw, and reset restores
  everything.
- **Design and copy.** The record and lists extend the Admin Review tile and table anatomy and 15a's
  warning components; mono for NHI, patient id, dates and money; teal-only actions; no crimson on the
  new screens; mild uses the warning tint and strong the error tint, never a status hue; "NHI
  missing" is the only label for the state; no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- **Status row** for catch-up Phase 40, and a phase entry with:
  - the drift-check result against `3d3a18c` (items changed or not; D11 and OQ-49 status, which
    D11 branch was built; OQ-74 built as answered, D24; US-11.1.1 left as Matches, its recipe
    re-pointed);
  - the readings flagged for the owner: "billable patient only" counts the patient's own invoices
    toward the warning and does not gate on the new Booking's billable party, while the record's
    balance is patient-centric across every payer (US-13.2.2, insurer included per Greg though the
    text names only a guardian); the warning is office-only, against US-13.7.3's "either app"; its
    kind is `beforeProcedure` although US-13.7.1 leaves it unset; the one threshold field is
    editable although US-13.7.4 is Future (the catalogue contradiction the domain-model delta
    lists); the Missing NHI escalation constants (7 and 2 days); who is the credit patient in the
    seed;
  - what was built, with a name map for later phases:
    - the `patientBalance` rule, its `thresholdDays` param and `setPatientBalanceThreshold`;
    - the rule `audience` field on 15a's `WarningRule`;
    - `Booking.balanceCheck` and `stampBalanceCheck`, `patientBalancePreview`;
    - the `patientCare` slice (`PatientFollowUp`, `PatientMerge`) and `Patient.pendingDetails`;
    - `src/domain/patients/` (`invoiceAgeDays`, `countsTowardPatientBalance`,
      `patientBalanceSummary`, `patientBalanceStrength`, `patientCentricBalance`,
      `missingNhiStrength`, `detailDifferences`, `buildNhiIndex`);
    - `patientActions.ts` (`attachPatientNhi`, `resolvePatientDetails`, `logPatientFollowUp`,
      `completeFollowUp`, `requestNhiFromRooms`, `mergedPatientTarget`, and the draft body
      `applyNhiAttach` that `decideImportRow` also runs);
    - `arrivedNhiFor` and `attachNhiAsSimulatedOffice`;
    - `patientSelectors.ts`;
    - the `nhiMissing` blocker;
    - `nhiBadge`'s `missing` flag;
    - the Admin Patients routes;
    - `NHI_ARRIVALS`, `FORTE_DAILY_MON27` (a `HOSPITAL_DOWNLOAD_SAMPLES` entry), the id of Noah's
      earlier record, the `oa07` payer change and the `multiWarning` patient's invoice;
    - the trigger ids and the `patientBalance` sample;
    - removed: `patientHasOutstandingPriorEpisode`, `outstandingPriorBalance` and the "Prior
      balance" pill;
  - the `PERSIST_VERSION` bump (from and to);
  - the tests added, the before and after Vitest and Playwright counts, and the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `capture/REPORT.md` counts before and after (captured, partial, absent, failed), the recipes this phase broke and how they were re-pointed, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Superseded:** the 2026-07-22 third external plan review, finding #5 ("`nhi` optional, one
     seeded provisional NHI pending patient; NHI-driven behaviours apply when present"). The patient
     id is the key and the NHI a required second unique index. A record without one is a provisional
     exception on Missing NHI, its List cannot be authorised (D11 default, provisional while OQ-49 is
     open), and attaching an NHI that exists merges the records in one action.
  2. **Superseded:** the Phase 10 WI2a reading (deviation 3: the intake balance banner on the billing
     monitor row) and the 2026-07-27 pre-workshop fix 10.2 ("Prior balance" reads any open prior
     episode). The patient balance is a 15a warning raised when a Booking is created or matched,
     counting only invoices billed to the patient, mild within and strong over an admin-set threshold
     (90 days; OQ-33 and OQ-41 answered; counted from the invoice date, and a credit balance mild,
     per OQ-74 answered, D24); RV-21 closed. The patient record's balance is patient-centric across
     every payer (US-13.2.2).
  3. **Amended:** Phase 07's "authorise is never gated by flags", already amended by 21. A third named
     blocker, `nhiMissing`, joins it.
  4. **New:** one label, "NHI missing", on every surface (US-03.1.5 wording over US-11.1.4's "NHI
     pending").
  5. **New:** the balance warning is office-only (a rule `audience`); the anaesthetist apps never
     show patient money. This departs from US-13.7.3's "either app" for this one rule; flagged for
     the owner.
  6. **New:** only Bookings stamped at create or match carry the balance warning; strength is derived
     live, so a threshold change or a payment applies at the next evaluation.
  7. **New:** the threshold is the one warning parameter with a UI (US-11.3.2's "admin changes the
     threshold"), one Master data field; the settings
     page stays Future (US-13.7.4).
  8. **New:** a merge deletes the provisional record and keeps a redirect; the provisional Xero
     contact is left as is (OQ-30: Xero holds only the unique id).
  9. **New:** returning-NHI details that differ are held for office review, never auto-applied.
- **Handoff notes:**
  - For **40a**: NHI lookup and refresh from the register attach through `applyNhiAttach`, so a
    looked-up NHI that already exists merges the same way; `buildNhiIndex` is the uniqueness check.
  - For **41**: prepayment letters and reminders can log into the patient follow-up log (`kind`
    extended), and a cancelled prepayment's credit and trust refund show on the patient record through
    the ledger (and as the credit case of the balance warning while the credit is held). Heather
    Sinclair's seeded $260.00 held credit is the patient credit the warning and record read.
    `patientBalanceSummary` counts a held credit only while it is not refunded: 41's `TrustRefund`
    keeps the amount on 39's `heldForPayer` rather than reducing it, so when 41 marks a refund paid it
    must also make `patientBalanceSummary` and `patientCentricBalance` drop that credit (one shared
    "credit still held" helper), or the mild warning outlives the refund.
  - For **42**: the patient balance threshold and the two Missing NHI constants are candidates for the
    reference-data screens if AA asks; US-13.7.4 stays Future.
  - For **43**: the NHI leak scan should cover the NHI request email (`buildNhiRequestEmail`), the
    patient search results and the merge audit entries; `patientSearch` must stay fast at full scale.
  - For **44**: S1 Beat 1's warning line, Beat 1d and the S5 Missing NHI beat were added here.
    Re-read them in the rewrite, and walk "Office attaches the NHI" in the PWA-parity audit. If D11
    is answered later, the switch points are the D11 branches in items 4, 6, 8, 9, 10 and 14 and the
    one provisional caption; if Ben changes the balance rule (US-11.3.2 is still Verify), they are
    the rule's `defaultParams`, `patientBalanceStrength` and `countsTowardPatientBalance`.
