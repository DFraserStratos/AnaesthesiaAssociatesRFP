# Phase 40 · Patients: missing NHI, unpaid alert, patient view

**Requirements covered:**
[US-11.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.1.md) Patient record keyed on NHI (ethnicity shown and editable; the "details differ" prompt on a returning NHI) ·
[US-11.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.4.md) Patient without NHI (Open: attach later, match on attach) ·
[US-11.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.5.md) Missing NHI problem list ·
[US-11.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.1.md) Patient outstanding bills view ·
[US-11.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.2.md) Alert on booking a patient with unpaid bills (Verify) ·
[US-11.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.3.md) Follow-up tools ·
[US-13.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.2.md) Per-patient balance ·
[US-03.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.5.md) Anaesthetist sees the patient's NHI ("NHI missing", never blank) ·
[DM-25](../analysis/domain-model-delta.md#dm-25) (NHI required with a missing-NHI problem list; a configurable unpaid-invoice alert) ·
[RV-21](../analysis/reverse-check.md#rv-21-prior-balance-tag-has-no-threshold-and-lives-in-the-billing-monitor) (the "Prior balance" tag with no threshold, in the billing monitor).
Read alongside (not closed here):
[FT-11.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.1.md),
[FT-11.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.3.md),
[US-11.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.2.md) (the NHI validators, which Phase 34 keeps under Admin Intake),
[OQ-49](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-49.md) (Booking without NHI: provisional or blocked, owner decision **D11**),
[OQ-41](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-41.md) (what the 90 days count from),
[OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md) (NHI never in Xero),
[OQ-33](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-33.md) (Answered: a 90 day threshold), and the
"Patient and billable party" section of [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 34 (hospital sync and the rebuilt S1: Sarah Mitchell's St George's row is matched and
created on the Admin Intake matching screen; the manual-provider daily sheets and `deliverDailySheet`;
through it, 33's `ImportRow`, `HOSPITAL_DOWNLOAD_SAMPLES`, `importHospitalDownload`, `stageImportRows`
and `decideImportRow`) and 36 (the internal ledger:
`LedgerPair` with the patient's hidden id, `patientPosition` and `patientLedgerPosition`). By the
roadmap order 14 (the trigger registry, `useDemoTriggerContext`, `OFFICE_ACTOR`,
`OFFICE_SIMULATION_ACTOR`, `authoriseAsSimulatedOffice` in `store/officeStandIn.ts`), 15 (Booking vocabulary, `createBooking`, `BookingDetailBody`), 17
(surgeons' rooms with a contact email, the hospital contact email), 21 (`authoriseBlockersFor`), 22
(`resendInvoice` and the send history), 27 (the prepayment alert levels, whose vocabulary this phase
reuses) and 35 (explicit save, the `mailto` builder in `src/domain/updateEmail.ts`, as-at views) have
also run. 37, 38 and 39 have run or may run in either order; 39's credit notes, if present, are read.
**Estimated:** 2 sessions, at the upper limit (19 items across store, seed, four Admin screens and
three apps). If session 2 runs long, checkpoint after item 13 and finish items 14 to 19 in a short
third sitting rather than cutting coverage. Session 1: work items 1 to 10 (settings record, model, pure rules, store
actions, the intake hooks, the authorise gate, seed, tests), ending green with the UI edited only as
far as it must compile. Session 2: items 11 to 19 (the Admin Patients screens, the Booking and review
surfaces, mobile and web wording, triggers, shots, the demo guide).

## Goal

Admin gets a **patient record**. Today the office can see a patient only as the Patient block of a
Booking, and patient money only as a boolean "Prior balance" pill on the Billing monitor, after a
List is billed. The catalogue asks for one record per NHI that the office can search for and open,
with everything AA knows about the patient's billing in one place.

This phase:

- adds **Admin · Patients**, with search by name, NHI or date of birth, and a **patient record**. The
  record shows the details, with **ethnicity** (NZHIS Level 4 code and label) shown and editable. When
  a returning NHI arrives with different details, a **"Details differ"** prompt appears instead of the
  change being silently dropped (US-11.1.1). It also shows **every invoice across every
  anaesthetist**, each marked paid, part paid or unpaid, with the outstanding **balance**, read from
  Phase 36's ledger (US-11.3.1, US-13.2.2). And it has **follow-up actions**: log a call, add a note,
  set a reminder, and resend an invoice through Phase 22's `resendInvoice`, all kept in a follow-up
  log (US-11.3.3);
- adds a **Missing NHI** problem list. Each row shows the patient, the List, and the surgeon's rooms
  contact (or the hospital's). Rows escalate as the List date nears. The office can email the rooms,
  or **attach the NHI**. Attaching an NHI that already belongs to a record **merges** the provisional
  record into it, so no duplicate is left (US-11.1.4, US-11.1.5);
- makes the NHI required, per owner decision **D11** (default reading, provisional while OQ-49 is
  open). A Booking without an NHI is **provisional**: it can be created, it sits on the problem list,
  and its **List cannot be authorised** until the NHI is added. The anaesthetist's mobile and web
  apps say **"NHI missing"** instead of a blank or "NHI pending" (US-03.1.5);
- raises an **unpaid alert** when a Booking is created or matched for a patient who has an invoice
  unpaid for longer than an **admin-set threshold** (90 days to start, counted from the invoice date:
  the OQ-41 recommendation, provisional). The threshold lives in a new **app settings record**, not
  `DemoSettings`. The alert replaces the Billing monitor's "Prior balance" tag (RV-21); a
  30-day-old unpaid invoice raises no alert (US-11.3.2).

New stored state: an `appSettings` record, a `patientCare` slice (unpaid alerts, follow-ups, merge
redirects), and `Patient.pendingDetails`. The seed gains a prior record for Noah Prescott and three
history invoices under Dr Sharma, so `PERSIST_VERSION` is bumped.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.1.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.1.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.1.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.3.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.3.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.3.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.2.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-03.1.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-11.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-11.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.1.2.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-49.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-41.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-30.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-33.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   At plan time (2026-10-01) there was no diff against `1f067a8`. If an item changed, re-read it and
   adjust the work items; re-run the gap analysis for that item only, per `../README.md`. If an item
   is now Retired or Future, drop the work items that serve only it and note it in PROGRESS.md.
   Record the result in the phase entry.
2. **D11 / OQ-49 (Booking without NHI).** Check the ROADMAP decisions table and OQ-49's status.
   - **Unanswered (build the default):** the Booking may exist as provisional, it is listed on
     Missing NHI, and `authoriseBlockersFor` blocks its List until the NHI is added. The manual form,
     the matching screen and the Review action bar carry the caption "Provisional rule. AA to confirm
     whether a Booking can exist without an NHI (OQ-49)."
   - **Answered "blocked":** `createBooking` refuses with `nhiRequired` on every path ("An NHI is
     required before this Booking can be created."). The manual form requires the NHI. A hospital or
     PDF row without one stays on the matching screen as a row, and Missing NHI lists those **rows**
     (patient, proposed List, rooms) instead of Bookings. The seeded Noah Prescott Booking becomes a
     staged Forte row, and the authorise blocker is dropped because it can never fire. Work items 3
     (the doc comment), 5 (attach works on a row, not a record), 7 (the gate), 8 (`missingNhiRows`
     over rows), 9 (Noah's Booking becomes a row) and 13 (the form and matching-screen captions)
     change accordingly.
   - **Answered "provisional, no block":** keep everything except the authorise blocker, and keep the
     review flag as a warning.
3. **US-11.3.2 (Verify) and OQ-41.** If OQ-41 is still open, count the age from the invoice date
   (`raisedAtISO`) and show "90 days from the invoice date (provisional, OQ-41)" beside the threshold.
   If it is answered, the basis is one function (`invoiceAgeDays` in item 2), so change only that and
   its tests. If Ben sets a different starting value, change only the seeded `appSettings` value.
4. **US-11.1.4 (Open).** The catalogue says "NHI pending"; US-03.1.5 (Proposed) says "NHI missing".
   This plan uses **one label, "NHI missing", on every surface** (so the same state never has two
   names) and records the reading in the Decisions log. If US-11.1.4 is confirmed with its own
   wording for the office, `nhiBadge` takes the surface as an argument; the change stays in that one
   function.
5. **OQ-30 (NHI in Xero).** The prototype already follows Appendix 2 (NHI never in Xero, hidden id as
   ContactNumber). Nothing here sends the NHI anywhere new. If OQ-30 is answered "Appendix 1", stop and
   tell the owner: that changes Xero contact handling, not this phase. Record the status.
6. **A question to put in the PROGRESS entry, not to block on:** which invoices count toward the
   unpaid alert? The catalogue says "a patient who has an invoice unpaid". This plan counts **every
   receivable on the patient's Bookings**, whoever the billable party is (hospital, insurer, patient
   or guardian), and shows the billable party on each alert row so the office can judge. Seeded Sarah
   Mitchell's 98-day invoice is billed to St George's, so a patient-direct-only reading would silence
   the S1 alert. Add this as discovery point 11 in the cheat sheet (item 18), and flag it to the owner
   as a candidate for a new OQ.
7. **Confirm the dependencies are DONE** and read their PROGRESS entries for the real names this doc
   can only anticipate. Wherever this doc names a planned symbol, use the real one:
   - **14:** `OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`, `authoriseAsSimulatedOffice`, the
     `office-authorises-list` entry and its `disabledReason`, `demoTriggersFor`;
   - **15:** `createBooking`, `CreateBookingInput`, `BookingDetailBody`, `AdminBookingDetail`,
     `ManualBookingForm`, `AddBookingFlow`, `reviewFlagsForBooking`, `MonitorBookingRow`, the
     `/bookings/:bookingId` routes;
   - **17:** `SurgeonRoom` (`contactEmail`, `phone`), `Surgeon.roomId`, `Hospital.contactEmail`;
   - **21:** `authoriseBlockersFor` and its blocker kinds, and the Review action bar's blocked-state
     sentence;
   - **22:** `resendInvoice`, the invoice delivery union and the send history;
   - **27:** the alert level vocabulary (`watch`, `urgent`) and how the Admin day grid shows it;
   - **33 and 34:** `ImportRow`, `HOSPITAL_DOWNLOAD_SAMPLES` (entry shape), `importHospitalDownload`,
     `stageImportRows`, `decideImportRow` (and its create and apply-to-existing branches), how 33's
     matcher proposes a target for a row whose NHI no Booking holds, the matching screen route (`/admin/intake/...`), the row decision
     rule, `MANUAL_PROVIDER_SHEETS`, `deliverDailySheet`, the McMurray row without an NHI, and the S1
     beat as 34 rebuilt it;
   - **35:** the `mailto` builder and `MAILTO_MAX_LENGTH` in `src/domain/updateEmail.ts`, and the
     as-at view link for a Booking;
   - **36:** `LedgerPair` (kinds), `patientPosition` and `patientLedgerPosition` (rows: pair id,
     invoice id and number, anaesthetist, Booking, billable party, raised date, total, outstanding,
     status). If a row lacks a field this phase needs, extend the selector rather than joining through
     `state.xero`;
   - **39 (if run):** how a credited invoice reads in the ledger (it must not count as unpaid);
   - the current `PERSIST_VERSION`.

## Reference

**Design files** (convention 17: authoritative):
- [Design Language.dc.html](../../../design/Design%20Language.dc.html): tokens, the `warning` and
  `error` tints for escalation, neutral status pills, Spline Sans Mono with tabular numbers for NHI,
  dates and money, the 4pt spacing, radii and card elevation. Teal `#0D6E63` is the only action colour
  (Attach NHI, Log call, Save threshold); crimson is not used anywhere on the new screens.
- [Admin Day.dc.html](../../../design/Admin%20Day.dc.html): the dark side nav (a new **Patients**
  item with a warn badge), the page header rhythm, and the List drawer's "Needs attention" box.
- [Admin Review.dc.html](../../../design/Admin%20Review.dc.html): the stat tiles, the table anatomy
  and the flag pills. The patient record's balance tiles and invoice table extend these; the Review
  row's "NHI missing" flag uses the existing pill.
- [Mobile App.dc.html](../../../design/Mobile%20App.dc.html): the List row anatomy (name, mono NHI
  line, operation), where "NHI missing" takes the NHI line's place.
- No mockup covers a patient record or a problem list. Extend the Admin Review table and tiles and
  the existing Integrations Data quality list (the `dataQualityItems` pattern); do not invent a new
  visual language.

**Catalogue items:** the ten covered above, plus FT-11.1, FT-11.3, US-11.1.2, OQ-49, OQ-41, OQ-30,
OQ-33 and the domain model's "Patient and billable party" section. The catalogue images for
US-11.1.1 (`admin-patient-record.png`, `admin-edit-patient.png`), US-11.1.4 (`admin-nhi-pending.png`),
US-11.3.2 (`admin-prior-balance.png`) and US-11.3.3 (`admin-resend-invoice-*.png`) are screenshots of
the **current** prototype. They show where things sit today, not what the stories require.

**Analysis files:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): everything before "## By epic", then the EP-11, EP-13 and
  EP-03 tables; [epics/EP-11.md](../epics/EP-11.md), [epics/EP-13.md](../epics/EP-13.md) (US-13.2.2),
  [epics/EP-03.md](../epics/EP-03.md) (US-03.1.5).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-25 (and DM-18, DM-19 for the
  ledger you read); [analysis/reverse-check.md](../analysis/reverse-check.md) RV-21.
- [analysis/prototype-map-admin.md](../analysis/prototype-map-admin.md) (routes and nav, Card detail,
  Review, Invoices, Billing monitor, Integrations Data quality, Master data),
  [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md),
  [analysis/prototype-map-apps-mobile-web.md](../analysis/prototype-map-apps-mobile-web.md),
  [analysis/prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) (the PWA
  closure, `pwaPurity.test.ts`, the office simulation).

**Code entry points** (July names and lines. Phases 15 to 39 have moved many of them: use the real
ones from their PROGRESS entries.)
- Patient model: `aa-prototype/src/domain/types.ts` (`Patient` :103, with `nhi` optional and the
  `ethnicityPending` quarantine; `DemoSettings` :886).
- Intake: `aa-prototype/src/store/intake.ts` (`upsertPatient` :52: the NHI match enriches only
  undefined fields and audits `patient.reuse`; `createdProvisional` :97; `PatientEditPatch` and
  `editPatient` :137 onward, with no `nhi` or `ethnicityCode` in the patch).
- Every Booking creation funnels through `createCard` (`store/cardActions.ts:70`, 15's
  `createBooking`), which calls `upsertPatient` at :87. Callers: `ManualCardForm.tsx:109`,
  `integrationActions.ts:150` (HL7; 33 re-points it to staging) and `:464` (`ingestPdfRow`, whose
  update path reuses a Booking on the target List by NHI).
- The authorise guard: `store/lifecycle.ts:277` `authoriseList`, plus 21's `authoriseBlockersFor`.
  PWA: `src/pwa/officeSimulation.ts` calls `authoriseList` as the simulated office, and 14's
  `office-authorises-list` entry calls `authoriseAsSimulatedOffice`.
- The prior-balance boolean: `store/selectors.ts` `patientHasOutstandingPriorEpisode` (:285, which 36
  re-points to `patientPosition`), `MonitorCardRow.outstandingPriorBalance` (:401, :492) and the pill
  in `apps/admin/screens/BillingMonitorScreen.tsx:200-206`.
- The nearest problem-list pattern: `dataQualityItems` (`store/selectors.ts:1011`) and the Data quality
  tab (`IntegrationMonitorScreen.tsx`, under 34's Intake home).
- NHI render sites: `shared/format.ts:80-93` (`nhiBadge` returns "NHI pending");
  `shared/card/CardDetailBody.tsx:317, :566-583` (the Patient block); `apps/web/screens/CardDetailView.tsx:48`;
  `apps/admin/screens/AdminCardDetail.tsx:42`; `apps/web/screens/ListDetailView.tsx:74` (falls back to
  "NHI pending", and misses an empty string); `apps/mobile/screens/ListDetailScreen.tsx:80, :200-202`
  (renders nothing when the NHI is absent); `apps/admin/screens/ReviewScreen.tsx:258`.
- Patient editing: `shared/flows/EditPatientSheet.tsx` (name, DOB, phone, email, address; no NHI, no
  ethnicity).
- Ethnicity: `domain/nzhis.ts` (`validateEthnicityCode`, `ETHNICITY_DEMO_SUBSET` with labels);
  `integrationActions.ts:389` `correctEthnicityCode`.
- Admin shell: `apps/admin/components/SideNav.tsx:30-38`, `AdminApp.tsx` (section from path, nav
  badges), `router.tsx:89-106`, `routes.tsx` (`RequireEntity`), `apps/admin/util.ts:111`
  `attentionReasons(list)` (the List drawer's "Needs attention"; today it takes only the List, so item
  7 widens its signature).
- Master data: `apps/admin/screens/MasterData.tsx` (the entity list at :52; the "Xero & archiving"
  view at :473 is the pattern for an editable setting).
- Seed: `domain/seed/patients.ts` (`PAT`, the 19 pinned rows PT0001 to PT0019; `PAT.provisional` =
  PT0010 Noah Prescott, no NHI; `buildPatients` then generates `GENERIC_COUNT` = 132 patients numbered
  from `PINNED.length + 1`, so **PT0020 is already the first generated patient**; the patient
  counter in `seed/index.ts:439` is `patients.length + 1`); `domain/seed/cards.ts:825-845` (Noah's Booking and Sarah Mitchell's repeat Booking on Souter,
  Mon 27 Jul AM, Forte, Mr Okafor; Mitchell's first episode is Sharma, Tue 14 Jul, at :764);
  `domain/seed/history.ts` (Souter-only history: `oa07` Mitchell $610.00 raised 2026-04-14, 98 days
  at `DEMO_TODAY`; `oa06` Foster 76 days; `oa08` Walker 125 days; `oa03` Chen 29 days;
  `buildHistory` is hardwired to `ANAE.souter` at :146); `domain/seed/index.ts:630` (the
  `provisionalNoNhiPatient` Demo Data entity, labelled "NHI pending").
- Tests that pin today's behaviour and will move: `store/intake.test.ts`, `store/billingRun.test.ts`
  (the 8th-review test at :418 moves the NHI-less provisional Booking onto a SUBMITTED List and
  authorises it, which D11 now refuses), `store/selectors` tests for the prior balance,
  `demoScenarios.test.ts`, `persistMigrate.test.ts`, `src/pwa/pwaPurity.test.ts`,
  `src/pwa/officeSimulation.test.ts`.

## Work items

1. **The app settings record** (DM-25: "DemoSettings is the wrong home").
   - `domain/types.ts`: `AppSettings { unpaidAlertThresholdDays: number }`. This is AA business
     configuration, set by an admin in the real system, unlike `DemoSettings`, which holds demo
     scaffolding (`failNextHandoff`, `volumeStory`, 34's `failNextSync`).
   - `SeedState.appSettings`, seeded `{ unpaidAlertThresholdDays: 90 }` (OQ-33 answered; OQ-41 keeps
     it provisional). Add it to `AppState`, the persisted keys and `resetDomainState`, so reset
     restores it.
   - `store/appSettingsActions.ts`: `setUnpaidAlertThreshold(api, actor, days)`. It is office only
     and refuses anything that is not a whole number from 1 to 730 ("Enter a whole number of days
     from 1 to 730."). It audits `settings.unpaidAlertThreshold` (entity `settings`, id `appSettings`,
     before and after). It changes nothing already raised: alerts store the threshold they were
     checked against, so the new value applies to the **next** check (US-11.3.2 AC 3).
   - Do **not** move 27's prepayment settings or the archive window here. Record them as candidates
     for 42 in the handoff.

2. **Pure patient rules** (`src/domain/patients/`, no store import; covered by `domainPurity.test.ts`;
   Vitest beside each).
   - `unpaidAlert.ts`:
     - `invoiceAgeDays(raisedAtISO, todayISO)`: whole calendar days from the invoice date (the OQ-41
       recommendation; the only place the basis lives);
     - `overdueForAlert(rows, { todayISO, thresholdDays, excludeBookingId })`: the ledger rows that are
       not fully paid (`unpaid` or `partPaid`, with outstanding above zero) and **older than** the
       threshold (`age > thresholdDays`), excluding the Booking being checked. It excludes AA fee
       pairs, which are not patient invoices, and any credited invoice, if 39 has run. It returns
       the rows oldest first, with `ageDays` and the outstanding total;
     - tests: 98 days alerts at 90; exactly 90 does not; 91 does; the only unpaid invoice at 30 days
       does not (AC 2); a paid invoice at 200 days does not; part paid at 120 days alerts with its
       outstanding amount; the Booking's own invoice is excluded; a threshold of 60 catches Foster's
       76 days; the same input gives deep-equal output.
   - `missingNhi.ts`:
     - `missingNhiLevel(listDateISO, todayISO)` returns `'none' | 'watch' | 'urgent'`, reusing 27's
       vocabulary. The thresholds are the labelled constants `MISSING_NHI_WATCH_DAYS = 7` and
       `MISSING_NHI_URGENT_DAYS = 2` (provisional; US-11.1.5 says only "as the List date
       approaches"). The day itself, and a passed date on an unauthorised List, read `urgent`;
     - tests at 8, 7, 3, 2, 0 and -1 days.
   - `patientDetails.ts`:
     - `detailDifferences(existing, incoming)` compares name, DOB, phone, email and address. Name
       and address compare trimmed and case-insensitive; phone compares digits only; DOB compares
       exactly. A field the incoming record lacks is not a difference; a field the existing record
       lacks is enrichment, as today, not a difference. It returns `{ field, existing, incoming }[]`;
     - tests for each field, for the no-difference case and for the enrichment case.

3. **Model** (`domain/types.ts`; DM-25).
   - `Patient` doc comment rewritten: the NHI is **required**. A record without one is provisional,
     and it is an exception on the Missing NHI list until the NHI is attached (D11 default). The field
     stays optional in the type, because the provisional state is real.
   - `Patient.pendingDetails?: { receivedAtISO; source: 'hospital' | 'surgeon' | 'aa'; bookingId?;
     differences: { field: 'name' | 'dobISO' | 'phone' | 'email' | 'address'; existing?: string;
     incoming: string }[] }`. This follows the `ethnicityPending` quarantine pattern: the incoming
     values are held for review, never written over the record.
   - `UnpaidAlert { id; patientId; bookingId; trigger: 'created' | 'matched'; raisedAtISO;
     thresholdDays; invoices: { pairId; invoiceId; number; anaesthetistId; billablePartyLabel;
     raisedAtISO; ageDays; outstanding }[]; outstandingTotal; status: 'open' | 'acknowledged';
     acknowledgedAtISO?; acknowledgedBy?; note? }`. It is a snapshot taken at check time, so a later
     threshold change or payment does not rewrite what the office was told.
   - `PatientFollowUp { id; patientId; kind: 'call' | 'note' | 'reminder' | 'resend'; text; invoiceId?;
     alertId?; dueDateISO? (reminder); atISO; by: string; doneAtISO?; doneBy? }`.
   - `PatientMerge { fromId; intoId; atISO; by; bookingIds; pairIds }`.
   - A `patientCare` slice on `SeedState` and `AppState`: `{ unpaidAlerts: Record<id, UnpaidAlert>;
     followUps: Record<id, PatientFollowUp>; merges: Record<fromId, PatientMerge> }`, seeded empty
     except for any follow-up in item 9. `ID_FORMATS` in `store/mutate.ts` gains `unpaidAlert` (`UAN`,
     pad 4) and `followUp` (`FUN`, pad 4); counters bumped past the seed.

4. **Intake: returning NHI and the "details differ" prompt** (`store/intake.ts`; US-11.1.1).
   - `upsertPatient`'s reuse branch keeps its enrich-if-undefined behaviour. It also computes
     `detailDifferences`. If there are any, it stores them as `pendingDetails` in the same
     `mutate`, with the source derived from the actor or the intake origin, audits
     `patient.detailsPending`, and returns `differences` on `IntakeResult`. The record itself is never
     overwritten, so dedupe (the only AC) still holds.
   - `resolvePatientDetails(api, actor, patientId, choices: Record<field, 'keep' | 'useIncoming'>)`:
     office only. It applies the chosen incoming values, clears `pendingDetails` and audits
     `patient.detailsResolved` (before and after per field). If nothing is pending it refuses with
     "Nothing to review.".
   - `PatientEditPatch` gains `ethnicityCode`. `editPatient` validates it with
     `validateEthnicityCode`, refuses a malformed code, stores a code outside the demo subset only as
     `ethnicityPending` (the existing quarantine), and a valid code clears any quarantine.
   - Tests in `intake.test.ts`: Sarah Mitchell re-entered with a new address creates no second record
     and stores one pending difference; the same details store nothing; an office resolve applies
     "use incoming" for the address and keeps the rest; an anaesthetist resolve is refused; an ethnicity
     edit through `editPatient` validates and clears the quarantine.

5. **Attach the NHI, and merge** (`store/patientActions.ts`, exported from `src/store/index.ts`;
   US-11.1.4, US-11.1.5 AC 2).
   - `attachPatientNhi(api, actor, patientId, nhi, choices?)`. It is allowed for the office and for
     14's `OFFICE_SIMULATION_ACTOR` (the PWA stand-in). No other system actor attaches an NHI: an
     NHI that arrives on a hospital row reaches the record only through an office decision (below). It refuses an anaesthetist
     ("The office attaches the NHI."), an invalid NHI (the `validateNhi` reason, verbatim), and a
     patient who already has one ("This patient already has NHI ZAA0067.").
   - **No existing record with that NHI:** set `nhi` (normalised) on the provisional record. Audit
     `patient.nhiAttached`.
   - **An existing record with that NHI:** merge the provisional record into it, in **one `mutate`**:
     - re-point `patientId` on every Booking of the provisional record (cancelled Bookings included,
       for history), and on every ledger pair that names it (a provisional patient can already have
       a prepayment pair from 27);
     - apply `choices` for any `detailDifferences` between the two records (default keep the existing
       record's values). Carry over fields the survivor lacks (phone, email, address, ethnicity), and
       carry over the provisional record's pending ethnicity quarantine if the survivor has no code;
     - delete the provisional row from `masters.patients` and write `patientCare.merges[fromId]`, so
       exactly one record holds the NHI and no second patient record exists (AC 2). The redirect is
       not a patient record: it only lets old links, the audit and History resolve to the survivor;
     - move any open unpaid alerts and follow-ups on the provisional record to the survivor;
     - audit `patient.merge` on the survivor (after: `mergedFrom`, the Booking and pair ids, the
       fields taken from each side) and `patient.mergedInto` on the retired id, so both histories
       read correctly.
   - **Xero:** the survivor's hidden id is unchanged. If the provisional record already had a Xero
     contact (from a prepayment invoice), leave that contact as it is: its ContactNumber is the retired
     hidden id, never the NHI. New invoices resolve to the survivor's contact. Record this as a
     provisional reading (merging Xero contacts is not modelled).
   - After the commit, run the unpaid check (item 6) with trigger `matched` for each future,
     non-cancelled Booking of the survivor that has no alert yet. Being matched to an existing record
     is exactly US-11.3.2's "matched to them".
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
       intake row (item 8's arrived NHI), the same commit marks that row applied to the Booking
       (33's decision audit, by the office), so it does not linger on the matching screen;
     - 33's `decideImportRow` apply-to-existing branch: when the row carries a valid NHI and the target
       Booking's patient has none, the office's decision runs the same body (Details differ choices
       default to Keep). This is the "clears and matches the single record" path of US-11.1.5 when
       the NHI arrives on the daily list, and it is still the office's click.
   - `mergedPatientTarget(state, id)` follows `merges` to the survivor.
   - Tests (`patientActions.test.ts`): attach with no existing record sets the NHI and clears the
     exception; attach ZAP3016 to Noah Prescott merges into `PAT.prescottPrior`, both Bookings sit on it, PT0010
     is gone, exactly one patient holds ZAP3016, and the redirect resolves; choices pick the phone;
     an invalid NHI, a second attach and an anaesthetist actor are refused; the merge moves a pair's
     `patientId`; the email body passes an allowlist test (no DOB, no NHI pattern) and falls back to
     the hospital email; attaching from an arrived row marks that row applied in the same commit;
     `decideImportRow` apply-to-existing with the Forte row onto Noah's Booking attaches and merges.

6. **The unpaid alert at booking time** (`store/patientActions.ts`; US-11.3.2, RV-21).
   - `checkUnpaidOnBooking(api, bookingId, trigger)`. It reads the Booking's patient, calls
     `patientLedgerPosition` and runs `overdueForAlert` with `appSettings.unpaidAlertThresholdDays`
     and the demo clock's today. If any rows come back, and the Booking has no alert yet, it writes an
     `UnpaidAlert` snapshot through `mutate` as a `BALANCE_CHECK_ACTOR` (`{ who: 'Balance check',
     role: 'system', source: 'system' }`, beside 14's actors in `store/demoActors.ts`), audited
     `patient.unpaidAlert` on the patient and stamped on the Booking. A patient with no NHI yet is
     skipped: the check runs when the NHI is attached (item 5).
   - Hook it into every create and match path, after the Booking commits:
     - `createBooking`, on every path that funnels through it (anaesthetist manual and photo, Admin
       phone advice, 33's create-from-row, 34's PDF ingest), with trigger `created`;
     - 33's `decideImportRow` apply-to-existing branch, and `ingestPdfRow`'s update-by-NHI branch, with
       trigger `matched`;
     - `attachPatientNhi`, with trigger `matched` (item 5).
   - `acknowledgeUnpaidAlert(api, actor, alertId, note?)`: office only. It stamps the acknowledgement,
     and a non-empty note also logs a `note` follow-up linked to the alert. Audit
     `patient.unpaidAlertAcknowledged`.
   - **Remove the boolean:** delete `patientHasOutstandingPriorEpisode`,
     `MonitorBookingRow.outstandingPriorBalance`, its computation in `billingMonitor`, the "Prior
     balance" pill and tooltip, and the `billing-prior-balance` shot hook. The monitor row instead shows
     an **"Unpaid alert"** warning pill, linking to the patient record, when the Booking has an open
     `UnpaidAlert`. The data comes from the stored alert, not a recomputation.
   - Tests: the S1 path (stage and create Sarah Mitchell's St George's row, or `createBooking` with NHI
     CQY9304) raises one alert, listing `oa07` at 98 days and $610.00, with threshold 90 and trigger
     `created`; a manual Booking for Losa Tuilagi (JKL1188: only a 30-day invoice) raises none; after
     `setUnpaidAlertThreshold(60)` a new Booking for Diane Foster raises one, and the earlier Mitchell
     alert still says 90; a second check on the same Booking writes nothing; an alert survives a
     payment (the snapshot is history); acknowledging is office only; the grep
     `patientHasOutstandingPriorEpisode|outstandingPriorBalance|Prior balance` over `aa-prototype/src`
     and `aa-prototype/visual` returns nothing.

7. **D11: a provisional Booking cannot be authorised** (`store/lifecycle.ts`).
   - Add a blocker kind `nhiMissing` to 21's `authoriseBlockersFor(state, listId)`: one entry per
     active Booking whose patient has no NHI, naming the patient. `authoriseList` refuses with
     `authoriseBlocked` and the sentence "Add the NHI for Noah Prescott before authorising. A Booking
     without an NHI is provisional."
   - Submission and completion are **not** blocked (D11 blocks authorising only), so the
     anaesthetist's workflow is unchanged.
   - `reviewFlagsForBooking` gains a warning flag, "NHI missing". The List drawer's `attentionReasons`
     gains "NHI missing: Noah Prescott" (pure; its signature widens from `(list)` to take the List's
     Bookings and the patients map, and every caller is updated).
   - `officeSimulation.ts` and 14's `authoriseAsSimulatedOffice` inherit the refusal. Check that the
     simulated office logs it and re-arms without throwing, and that the PWA entry's `disabledReason`
     reads the same blocker ("Noah Prescott has no NHI. Use Office attaches the NHI first.").
   - Rework `billingRun.test.ts`'s 8th-review test (as 20, 21 and 25 left it: its `noBillingRoute`
     failure has likely been re-based to a Contract failure): attach an NHI to the provisional
     Booking's patient before authorising (so it still proves a mispriced Booking fails per Booking
     and the authorise commits), and add a sibling test that authorising with the NHI still missing is refused.
   - Tests: a SUBMITTED List holding Noah Prescott's Booking is refused with the blocker; after
     `attachPatientNhi` it authorises; a cancelled NHI-less Booking does not block; no seeded SUBMITTED
     List has an `nhiMissing` blocker (S2 Beat 4, both S3 Lists and S4 Beat 1 stay authorisable).

8. **Selectors** (`store/patientSelectors.ts`, re-exported from the store index; `Pick`-narrowed).
   - `patientSearch(state, query)`: matches name (case-insensitive, any word), NHI (normalised, so
     "zaa 0067" finds ZAA0067) or DOB (`YYYY-MM-DD`, or `DD/MM/YYYY` parsed purely). It returns at
     most 50 rows (name, NHI or "NHI missing", DOB, age, next Booking, outstanding total, open alert),
     sorted by name. Empty query returns patients with a Booking in the next 14 days, then everyone
     with an open item.
   - `patientRecordView(state, patientId)`: the details, the ethnicity label, the pending details and
     quarantine, and where the details came from (source of the latest `patient.*` audit entry:
     hospital, surgeon or AA). Bookings are split into upcoming and past, each with its List, hospital
     and anaesthetist. Invoices come from `patientLedgerPosition`, **including** seeded backdrop
     history, because this is the patient's whole history: each row has its number, anaesthetist,
     Booking date, billable party, raised date, age, total, outstanding and paid, part paid or
     unpaid state, plus a credited marker if 39 has run. The balance is the outstanding total, the
     count and the oldest age. It also returns the open alerts, and the follow-ups newest first.
   - `missingNhiRows(state)`: one row per **active Booking on a List that is not AUTHORISED** whose
     patient has no NHI. It carries the patient (name, DOB), the Booking (time, Procedure), the List
     (date, session, hospital, anaesthetist), the surgeon and the rooms contact (room name, email,
     phone; else the hospital's email), days to go, `missingNhiLevel`, the last
     `patient.nhiRequested` time, and an **arrived NHI**: an open staged intake row carrying a valid
     NHI that 33's matcher proposes for this Booking, or, if the matcher keys only on NHI, an open row
     at the List's hospital on the List's date whose normalised name and DOB equal the patient's (one
     pure rule, `arrivedNhiFor`, with its row id, so item 5's `fromRowId` can close it; see item 12). Rows are sorted by List date, then time. It is derived, never stored,
     so the row clears the moment the NHI is attached (AC 2) and stays visible until then (AC 3).
   - `openUnpaidAlerts(state)`, `followUpsDue(state)` (reminders due on or before today, not done),
     `patientsWithPendingDetails(state)`, and `patientAttentionCount(state)`, which is missing-NHI rows
     plus open alerts plus due reminders plus pending details, for the nav badge.
   - Tests: search by each key; the record view's invoices include both anaesthetists for Sarah
     Mitchell with the right states and a balance of $610.00; Noah Prescott's row carries Mr Okafor's
     rooms email; a row on an AUTHORISED List (impossible under D11, but seeded history may hold one)
     is excluded; the badge count adds up.

9. **Seed** (bump `PERSIST_VERSION` by one; extend `persistMigrate.test.ts`: an older version reseeds,
   and the new `appSettings` and `patientCare` keys are backfilled).
   - `domain/seed/patients.ts`: **append** Noah Prescott's earlier record **after the generated pool**
     (push it at the end of `buildPatients`, after the loop, never into `PINNED`: PT0020 is the first
     generated patient, so a pinned row would renumber all 132 of them and every Xero contact number).
     Its id is the next free one, `PT${PINNED.length + GENERIC_COUNT + 1}` = **PT0152** (or later if an
     earlier catch-up phase already appended a patient there), exported as `PAT_PRESCOTT_PRIOR` (or a
     `PAT.prescottPrior` entry computed from those constants). "Noah Prescott", DOB
     1983-05-17, NHI **ZAP3016** (valid mod 11: check digit 6; assert in `seed.test.ts` that no
     generated patient holds it, and pick another valid unused NHI if one does), phone
     "03 555 2716", address "14 Rata Street, Riccarton, Christchurch", ethnicity 11111. This is his
     record from an earlier episode. Keep PT0010 (no NHI, phone "021 555 3899") as the provisional
     record, so the merge shows one real difference (phone) and one carried-over field (address).
     Pushing it after the loop keeps every existing id and RNG draw, and the patient counter
     (`patients.length + 1`) moves past it on its own.
   - Relabel the Demo Data entity `provisionalNoNhiPatient` "Provisional patient (NHI missing)", and add
     `prescottPriorRecord` ("Noah Prescott's existing record, NHI ZAP3016").
   - **Cross-anaesthetist history under Dr Sharma** (the history builder is Souter-only, so
     generalise `buildHistory`'s anaesthetist, or add a small `seed/patientHistory.ts` that uses 36's
     pair constructors). Put these on backdrop Lists before the canvas horizon, in the `H` namespace:
     - Sarah Mitchell, Sharma, 2026-02-10, $540.00, **paid**, so her record shows two
       anaesthetists: paid under Sharma, unpaid under Souter;
     - Noah Prescott (`PAT.prescottPrior`), Sharma, 2025-11-04, $460.00, **paid**, so the merged record has
       history and raises no alert;
     - Losa Tuilagi, Sharma, raised **2026-06-21** (30 days at `DEMO_TODAY`), $380.00, **unpaid**,
       billed to the patient: the negative case (AC 2).
     Souter's figures (S3, web Accounts, the dashboard) are untouched; prove it with the existing
     pinned tests. Sharma's collected and paid-out figures rise by the two paid amounts; check nothing
     pins them.
   - Add `NHI_ARRIVALS` in `domain/intake/nhiArrivals.ts`: `{ [PAT.provisional]: 'ZAP3016' }`. Also add
     a Forte Health daily-list sample, `FORTE_DAILY_MON27`, as a **new entry in 33's
     `HOSPITAL_DOWNLOAD_SAMPLES`** (channel `manualSheet`, Forte, 33's entry shape): one row, Noah
     Prescott, DOB 1983-05-17, NHI ZAP3016, phone "021 555 3899", Mon 27 Jul, 08:00, Mr Okafor,
     inguinal hernia repair. Leave 34's `MANUAL_PROVIDER_SHEETS` pointing Forte at
     `SAMPLE_FORTE_SHEET`: `deliverDailySheet` delivers one fixed sample per provider and refuses a
     second Forte import ("Already imported today"), so the arrival must not go through it. Check the
     new sample's row does not dedupe against `SAMPLE_FORTE_SHEET`'s rows.
   - Relabel the seeded Procedure description "Inguinal hernia repair, booked from PDF referral (NHI
     pending)" to "... (NHI missing)". Check the seeded Mon 27 Jul List stays DRAFT; nothing scripted
     authorises it.
   - No seeded unpaid alert (the Alerts tab starts empty; S1 raises the first one). No seeded
     follow-up.
   - Seed tests: two fresh seeds deep-equal; PT0001 to PT0151 are unchanged (ids, names, NHIs);
     `PAT.prescottPrior`'s NHI is unique across `masters.patients`; the
     Tuilagi invoice is exactly 30 days old at `DEMO_TODAY`; `missingNhiRows` at reset is exactly Noah
     Prescott's Booking (plus any 34 or 33 seeded NHI-less rows, listed by name).

10. **Session 1 gate.** Build, PWA build and Vitest green, with the UI edited only to compile (the
    monitor pill removed, `nhiBadge` callers compiling). Record the counts.

11. **`nhiBadge` and the "NHI missing" wording** (`shared/format.ts`; US-03.1.5).
    - `nhiBadge(nhi)` returns `{ text; missing: boolean }`: "NHI ABC1234", or **"NHI missing"** for
      `undefined`, empty or whitespace-only. It is the **only** source of the missing wording.
    - Every render site calls it: `BookingDetailBody`'s Patient block, web `BookingDetailView`,
      `AdminBookingDetail`'s header, web `ListDetailView` (drop the `?? 'NHI pending'` fallback, which
      also misses an empty string), mobile `ListDetailScreen` (render the badge instead of nothing
      when absent) and `ReviewScreen`'s patient cell.
    - When `missing`, show a small warning-tint pill (`semantic.warning.tint` / `onTint`, label type,
      not mono) in place of the mono NHI line. The anaesthetist's Booking detail adds one caption line:
      "The office is getting the NHI from the surgeon's rooms."
    - Grep gate: `NHI pending` appears nowhere in `aa-prototype/src` or `aa-prototype/visual`.

12. **Admin · Patients screens** (`apps/admin/screens/patients/`; routes in `router.tsx` and
    `routes.tsx`; a **Patients** item in `SideNav` after Invoices, with a warn badge from
    `patientAttentionCount`; `AdminApp.tsx` maps the `/admin/patients` section).
    - Routes:
      - `/admin/patients`: Search (`data-shot="admin-patients"`);
      - `/admin/patients/missing-nhi` (`data-shot="admin-missing-nhi"`);
      - `/admin/patients/alerts` (`data-shot="admin-patient-alerts"`);
      - `/admin/patients/:patientId`: the record (`data-shot="admin-patient-record"`).
      The record route goes through `RequireEntity`; a merged id redirects to the survivor via
      `mergedPatientTarget`, with a one-line notice ("Noah Prescott's provisional record was merged
      into this one on 21 Jul"). A segmented control at the top switches between the three list views,
      each with its count.
    - **Search:** one search field (placeholder "Name, NHI or date of birth") and the results table:
      Name, NHI (mono, or the missing pill), DOB and age, Next Booking, Outstanding (mono, blank when
      zero) and an Alert pill. A row opens the record.
    - **Missing NHI:** the problem list. Columns: Patient (name, DOB), List (date, session, hospital,
      anaesthetist, Booking time), Surgeon's rooms (room name, email, phone; or "Hospital: {email}"),
      Days to go (with the level pill: neutral, then warning at `watch`, then error at `urgent`),
      Requested (the last request time or "Not yet"). Actions:
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
    - **Alerts:** open unpaid alerts first, then acknowledged ones (dimmed). Columns: Patient, Booking
      (date, List), Raised (time and trigger: "On create" or "On match"), Invoices (count, oldest age,
      outstanding total, mono), Threshold ("90 days"). Actions: Open record, and Acknowledge (with an
      optional note). Below the table sit two lists: **Follow-ups due** (reminders due today or
      earlier, with Done) and **Details to review** (patients with `pendingDetails`, opening the
      record). The header line reads "Alert when an invoice is unpaid more than 90 days (from the
      invoice date, provisional). Change in Master data", linking to the setting.
    - **Patient record:**
      - A header with the name, the NHI badge, DOB and age, and a Search link back.
      - Left column: **Details** (name, DOB, phone, email, address, **Ethnicity**, shown as
        "11111 · New Zealand European" from `ETHNICITY_DEMO_SUBSET`, or the quarantine note, and
        "Details from: hospital"). Edit opens `EditPatientSheet` with the new Ethnicity field, which
        is a code input with a live check and the label. If `pendingDetails` exists, a **Details
        differ** card sits above it, with the same Keep / Use incoming table and Apply
        (`resolvePatientDetails`).
      - An **Attach NHI** button when the NHI is missing.
      - Main column: three **balance tiles** in the Admin Review tile anatomy: Outstanding (mono
        money), Unpaid invoices (count, with the oldest age), and Invoices to date. Then an open-alert
        banner (warning tint: "Unpaid alert raised 21 Jul on the Tue 28 Jul Booking: 1 invoice
        unpaid 98 days, $610.00", with Acknowledge).
      - The **Invoices** table (US-11.3.1): Number (links to the invoice), Anaesthetist, Booking date
        (links to the Booking, or its as-at view from 35), Billable party, Raised, Age (days, unpaid
        rows only), Total, Outstanding and Status (the pills Paid, Part paid and Unpaid, plus Credited
        if 39 has run). It is ordered oldest unpaid first, then newest paid, with one footer total and
        no ageing buckets (38 removed them). A row menu holds **Resend** (22's `resendInvoice`, which
        also logs a `resend` follow-up; a portal invoice shows "Delivered via the {portal} portal"
        instead) and **Log follow-up** for that invoice.
      - **Bookings:** the upcoming and past Bookings, with List, hospital and anaesthetist.
      - The **Follow-up log** (US-11.3.3): Log call, Add note and Set reminder (a date field and text).
        Entries are newest first, each with who and when, the linked invoice number, and Done on open
        reminders. `logPatientFollowUp(api, actor, input)` and `completeFollowUp(api, actor, id)` are
        in `patientActions.ts`: office only, non-empty text, a reminder date on or after today,
        audited `patient.followUp` and `patient.followUpDone`.
    - **Master data**: a new "Patient alerts" view beside "Xero & archiving". It has one number field,
      "Alert when a patient invoice is unpaid longer than (days)", with Save (`setUnpaidAlertThreshold`),
      the saved confirmation, the caption "Counted from the invoice date. The 90 day start and its basis
      are provisional (OQ-41). A change applies to the next Booking check; alerts already raised keep
      the threshold they were checked against.", and a History link.
    - Add every new audit code to `ACTION_LABELS`: "NHI attached", "Patient records merged", "Merged
      into another record", "Patient details differ", "Patient details reviewed", "NHI requested from
      rooms", "Unpaid balance alert", "Unpaid alert acknowledged", "Follow-up logged", "Follow-up
      done", "Unpaid alert threshold changed". Entity labels: patient, settings.

13. **Where the alert and the exception surface outside Patients.**
    - **Matching screen** (33, 34): after Create Booking or an apply-to-existing decision that raised an
      alert, the decision result shows a warning callout: "Unpaid alert: Sarah Mitchell has 1 invoice
      unpaid 98 days ($610.00). Open patient record". A row without an NHI that creates a Booking
      shows "No NHI: this Booking is provisional and is listed on Missing NHI" (D11). McMurray's
      NHI-less row from 34 now follows this rule instead of 33's interim.
    - **Matching screen, arrived NHI:** a row that `arrivedNhiFor` links to a provisional patient's
      Booking proposes apply-to-existing onto that Booking with the caption "Carries the missing NHI
      for Noah Prescott. Applying attaches it" (and "and merges him into his existing record" when
      the NHI already belongs to one), never Create Booking, so the arrival cannot make a second
      Booking or record.
    - **Admin Booking detail**: the patient name links to the record. With an open alert, a warning
      banner sits above the Patient section (office only; the anaesthetist apps never show patient
      money). With the NHI missing, the Patient section shows "Provisional · NHI missing" and, for
      the office, **Attach NHI** (the same sheet).
    - **Review screen**: the "NHI missing" flag, and the blocked Authorise with 21's sentence pattern
      and the D11 caption.
    - **Billing monitor**: the "Unpaid alert" pill from item 6.
    - **Manual Booking form** (`ManualBookingForm`, all three apps): with the NHI left blank, an inline
      caption reads "Without an NHI this Booking is provisional. The office will chase the NHI, and
      the List cannot be authorised until it is added." With an NHI that matches an existing record
      with different details, the existing "matched existing record" line adds "Some details differ.
      The office will review them."

14. **Demo triggers** (the registry, `src/shared/demoTriggers/registry.ts`; see the next section).
    Bodies go in `src/shared/demoTriggers` or `src/store`, so `pwaPurity` holds. Add `patientId` to
    the `DemoContextValues` keys only if the record screen needs to publish something the URL cannot
    carry. It should not: the URL has `patientId`, and the mobile route has `bookingId`.

15. **Copy and comment sweep.** Grep `src/` for `NHI pending`, `Prior balance`, `prior episode`,
    `where available`, `provisional` (in patient contexts) and `WI2a`. Reword every user-visible string
    and fix stale comments, including `Patient`'s doc comment and the `intake.ts` header ("without an NHI,
    create a provisional record" now adds "listed on Missing NHI until the NHI is attached"). No en or
    em dashes in any string added or changed.

16. **Tests and shots.**
    - Component tests: the Missing NHI row renders the rooms email and level; the attach sheet shows the
      merge preview and the Details differ table and calls `attachPatientNhi` with the choices; the
      record's invoice table shows Paid (Sharma) and Unpaid (Souter) for Sarah Mitchell with a
      $610.00 balance; the threshold field refuses 0 and 731; mobile `ListDetailScreen` shows "NHI
      missing" for Noah Prescott.
    - `demoScenarios.test.ts`: the S1 jump plus its Beat 1 steps leave one open alert for Sarah Mitchell.
    - Playwright: a new `visual/admin-patients.spec.ts` (search, record, Missing NHI with the arrival
      trigger, attach and merge, alerts); the S1 spec asserts the alert callout after Create Booking;
      a mobile shot of the Mon 27 Jul List with "NHI missing"; the PWA device spec runs "Office attaches
      the NHI" on Noah's Booking; the billing monitor spec drops `billing-prior-balance`. `data-shot`
      hooks as named above.

17. **PWA parity check.** On the PWA, open Mon 27 Jul AM, then Noah Prescott: "NHI missing" shows and
    the chip offers "Office attaches the NHI". After running it, the NHI shows, and the List's "Office
    authorises this List" no longer carries the "no NHI" reason once the List is submitted (pin this in
    a Vitest test over `demoTriggersFor` and the entry's `disabledReason`, rather than by hand). The
    office screens have no PWA equivalent (the PWA has no Admin), which is expected.

18. **Demo guide** (see "Demo guide updates"), in the same session.

19. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`.

## Demo triggers

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Simulate NHI arrival (daily hospital list) | Admin · Patients · Missing NHI (`/admin/patients/missing-nhi`) and the record of a provisional patient (`/admin/patients/:patientId`) | bar | `choices`: the missing-NHI rows whose patient has an `NHI_ARRIVALS` entry (Noah Prescott at reset). Imports `FORTE_DAILY_MON27` with 33's `importHospitalDownload(api, OFFICE_ACTOR, sampleId)` (channel `manualSheet`, Forte Health; not `deliverDailySheet`, which is fixed to `SAMPLE_FORTE_SHEET` and refuses a second Forte import), so the row is staged on the matching screen like any hand-imported daily sheet. The Missing NHI row then shows "NHI arrived: ZAP3016" with Attach NHI prefilled; one click (Attach and merge, with the Details differ choice for the phone) clears the row, marks the staged row applied and merges Noah into his earlier record. Disabled with "Already delivered" once a batch for that sample exists, and "No NHI to arrive for this patient" on a record without a fixture. Nothing is applied without the office's click |
| (no new trigger) Unpaid alert on the S1 match | Admin · Intake matching screen | none | The existing S1 flow: 34's on-open sync stages Sarah Mitchell's St George's row, Create Booking runs `createBooking`, and the check raises the alert (98-day invoice). The demo clock's menu ages invoices (for example `+7 days`, then a Booking for another patient), and the Master data threshold field shows AC 3 |
| Office attaches the NHI | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) and Mobile · List (`/mobile/lists/:listId`, with `choices` of the List's NHI-missing Bookings) | PWA only, `badge: 'office-stand-in'` | `attachNhiAsSimulatedOffice(api, bookingId)` in `src/store/officeStandIn.ts` beside 14's `authoriseAsSimulatedOffice`: `attachPatientNhi` as `OFFICE_SIMULATION_ACTOR` with the `NHI_ARRIVALS` value if one exists, else a deterministic synthetic NHI (`generateNhi('current', slotRng(seed, 'nhi-arrival', patientId))` with the store's seed, redrawn from the same stream until unused), keeping the existing record's details on a merge. Disabled with "This patient already has an NHI" or "Only a Booking with the NHI missing". Message: "The office attached NHI ZAP3016 and merged Noah Prescott into his existing record. The List can now be authorised once submitted." |

Re-pointed, not added: 14's `office-authorises-list` PWA entry's `disabledReason` reads the new
`nhiMissing` blocker. Nothing is added to the Control Panel page; its index picks up the new entries
under their screens.

PWA parity: the mobile beat is "NHI missing" on the List and Booking, then the office attaching it.
The handset gets that from "Office attaches the NHI". The unpaid alert and the patient record are
office-only (US-11.3.x are Admin App stories), so they need no PWA stand-in.

## Out of scope

- NHI lookup against the Health NZ Digital Services Hub (FT-14.4, US-14.4.1): the simulated
  `lookupNhi` stays as it is. The NHI validators stay where 34 put them (US-11.1.2).
- Correcting a wrong NHI, detaching an NHI, or un-merging two records. Merges are audited and one-way.
  Two different NHIs are two different people, and are never merged.
- Merging Xero contacts, and a Xero lookup by NHI (OQ-30). The prototype keeps Appendix 2.
- Billable party, guardian and the child-payer rule (21); invoice delivery itself (22).
- The prepayment alert, letters and reminders (27, 41); dunning or statement letters, SMS, and
  automated reminder emails. A reminder here is an office to-do, not a message to the patient.
- Ageing buckets or an overdue view (removed in 38); credit and rebill (39; read only).
- Showing patient money or the unpaid alert to the anaesthetist.
- Patient bulk loads (42), search at full scale (43), and the NHI leak scan (43, which should cover the
  new NHI request email).
- A per-hospital or per-anaesthetist threshold, and escalation settings for the Missing NHI list: one
  global threshold and two labelled constants until AA asks for more.

## Manual test checklist

- [ ] Reset. The Admin side nav shows **Patients** with a warn badge. Missing NHI lists exactly Noah
      Prescott (Mon 27 Jul AM, Forte, Dr Souter, 08:00), with Mr Okafor's rooms email and phone, "6
      days" in the watch tone and "Not yet" requested (plus any 33 or 34 seeded NHI-less row, named).
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
      one, and the Forte row on the matching screen reads applied (not open). Running Deliver hospital
      sheet for Forte beforehand does not stop this trigger.
- [ ] Search "Prescott": one result, with NHI ZAP3016. The record shows phone "021 555 3899", the
      carried-over Riccarton address, the paid Sharma invoice and both Bookings. `/admin/patients/PT0010`
      redirects there with the merge notice. The Audit viewer shows "Patient records merged". No
      unpaid alert was raised (his only earlier invoice is paid).
- [ ] S1 Beat 1 as 34 built it: open Admin Intake, then Sarah Mitchell's row, then Create Booking. The
      result shows "Unpaid alert: Sarah Mitchell has 1 invoice unpaid 98 days ($610.00)". Patients,
      Alerts lists it with threshold 90 and "On create". Her Booking detail shows the banner, and the
      Billing monitor (once billed) shows "Unpaid alert" instead of "Prior balance".
- [ ] Sarah Mitchell's record: tiles read Outstanding $610.00, 1 unpaid (98 days) and 2 invoices (3 if
      her Tue 14 Jul Sharma episode has been billed in this session or by an earlier phase's seed). The
      table shows AA-... under Dr Souter (Unpaid, 98 days) and the Sharma invoice (Paid). Log a call,
      set a reminder for today, and Resend the Souter invoice: the log shows three entries, the
      reminder appears under Follow-ups due, and the invoice's send history (22) gains a second send.
- [ ] Negative case: as Dr Souter on mobile, add a Booking for Losa Tuilagi (NHI JKL1188) on any
      DRAFT List. No alert is raised (her only unpaid invoice is 30 days old). Her record shows it as
      Unpaid, 30 days.
- [ ] Threshold: in Master data, Patient alerts, set 60 and save; 0 and 731 are refused. Book Diane
      Foster (ZAK8873): an alert is raised with threshold 60 (76 days). Sarah Mitchell's alert still
      says 90. Set it back to 90.
- [ ] Ethnicity: on a record, Edit, enter a malformed code (refused), then 21111 (shows "21111 · Māori",
      the subset's label). The Booking's Patient block shows it too.
- [ ] Details differ on intake: add a Booking for Sarah Mitchell (CQY9304) with a new address from the
      web manual form. The form says "Some details differ". No second patient exists. Patients, Alerts,
      Details to review lists her, and on her record, Apply with "Use incoming" updates the address.
- [ ] PWA (`npm run build:pwa`, then preview): Mon 27 Jul AM, then Noah Prescott. The chip offers
      "Office attaches the NHI" with the office stand-in badge. Run it: the result message names
      ZAP3016 and the merge, the Booking and the List row show the NHI, and a second run is disabled
      with "This patient already has an NHI". (The authorise refusal on the PWA path is pinned by the
      Vitest test in item 7.)
- [ ] Reset restores the threshold, the empty Alerts tab and Noah's provisional record.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are green.

## Demo guide updates

Patch these in the same session, and the same sections of `master-demo-guide.html`:

- `03-demo-script.md`:
  - **S1 Beat 1** (as 34 rebuilt it): after Create Booking, the **Expected** line adds the unpaid
    alert callout (1 invoice unpaid 98 days, $610.00). The **Say** line adds: "Sarah has an older bill
    with AA. Because it is past the 90 day threshold, the office is prompted to follow up before the
    procedure goes ahead. A newer unpaid bill would not raise this." Script it deliberately. It is
    one sentence, and the beat's focus stays on sync then match.
  - **New optional S1 Beat 1d, "the patient's whole bill"**: open patient record from the callout.
    Read the tiles and the two anaesthetists (paid under Sharma, unpaid under Souter), Log call, then
    Acknowledge the alert. Discovery points: which invoices count toward the alert (every invoice on the
    patient's Bookings, or only the patient's own), and the threshold basis (OQ-41).
  - **S5, a new optional beat, "a missing NHI is an exception, not a duplicate"** (S5 is the data
    integrity scenario and already holds the NHI validation beat): Patients, then Missing NHI (Noah
    Prescott, the rooms contact, Email rooms), then Simulate NHI arrival (daily hospital list), then
    Attach and merge with the phone difference. The row clears; search shows one Noah Prescott.
    Optional: show Review blocked before the attach. Discovery point: D11 / OQ-49 (can a Booking
    exist without an NHI?).
  - "Direct URLs": `/admin/patients`, `/admin/patients/missing-nhi`, `/admin/patients/alerts`,
    `/admin/patients/PT0005` (Sarah Mitchell), `/admin/patients/PT0010` (redirects after the merge).
  - "Recovery from demo accidents": a merge cannot be undone except by Reset.
- `04-presenter-cheat-sheet.md`: rewrite **section 11** as "Unpaid patient alert". The alert fires
  when a Booking is created or matched and an invoice is unpaid more than the admin-set threshold (90
  days from the invoice date, provisional, OQ-41); it counts every invoice on the patient's Bookings
  whoever pays (a question for AA); the 30 day case is silent. Add a "Booking without an NHI" item
  (D11 default: provisional, listed, the List blocked at authorise). Update "What each app is for"
  (Admin gains Patients).
- `02-workflows-and-handoffs.md`: in intake, a Booking without an NHI goes on Missing NHI, the office
  emails the rooms, and the NHI arrives on the daily hospital list and is attached (merge, no
  duplicate). In billing follow-up, the patient record, the follow-up log and Resend.
- `01-personas-and-responsibilities.md`: the office persona chases missing NHIs and follows up unpaid
  patients from the patient record. The anaesthetist sees "NHI missing".
- The Control Panel's S1 scenario text (`DemoControlPanel.tsx`, as 34 left it): add "Creating her
  Booking raises an unpaid alert (98-day invoice)." Add a one-line S5 mention of the Missing NHI beat.
- The Demo Data entity labels (item 9).

## Adversarial review (after build)

Run the standard review-and-fix pass (PROGRESS convention 18):

- fan out three Opus review subagents, one each for quality, bugs and plan adherence, steered by the
  bullets below;
- independently verify each finding before acting on it;
- fix the confirmed findings, re-green build, PWA build, Vitest and shots, and record the pass in
  the phase entry;
- do not re-raise anything already settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**

- **One record per NHI.** No path creates a second record for an NHI: `upsertPatient`,
  `attachPatientNhi`, 33's decisions, PDF ingest, the HL7 path on the Future-scope surface, and the PWA
  stand-in's synthetic NHI. After a merge nothing still references the retired id: Bookings,
  ledger pairs, alerts, follow-ups, billable-party links, 35's change sets and as-at views, and the
  History sheet via the redirect. The merge is one `mutate`, and a refusal leaves nothing half done.
- **The alert rule.** Age is strictly greater than the threshold, counted only in
  `invoiceAgeDays`; `unpaid` and `partPaid` count while outstanding is above zero; paid, credited
  and AA fee pairs never count; the current Booking is excluded; the snapshot keeps its threshold;
  no duplicate alert for one Booking; every create and match path runs the check (grep every
  `createBooking` caller and every apply-to-existing branch); the alert never reaches an anaesthetist
  surface. No trace of `patientHasOutstandingPriorEpisode` or "Prior balance" survives.
- **The ledger is the truth.** The patient record's invoices and balance read `patientLedgerPosition`,
  never `state.xero`. Backdrop history is included here and still excluded from the office's Invoices
  list and monitor. Balance equals the sum of outstanding to the cent. Souter's pinned figures are
  unchanged by the Sharma seed.
- **D11.** An NHI-less Booking blocks authorising on every path (Review, `authoriseList`, the PWA
  entry, the office simulation) with the same sentence; submit and completion are not blocked; no
  seeded SUBMITTED List gained a blocker; the provisional captions are present while OQ-49 is open.
- **No silent apply.** "Simulate NHI arrival" only stages a row; the NHI reaches the record only by the
  office's attach (or by the PWA stand-in, which is badged as the office). Details that differ are held
  in `pendingDetails`, never written over the record without a choice.
- **Privacy.** The NHI request email and every new string pass the allowlist: no DOB, NHI, money or
  notes in an email; the NHI never enters Xero or any new Xero field (`xeroNhi.test.ts` still passes);
  the mobile and web apps show the NHI or "NHI missing" and nothing about balances.
- **Triggers and PWA.** Entries show only on their routes; the PWA stand-in is PWA-only and badged;
  bodies live in `src/shared` or `src/store` (`pwaPurity` holds); no Control Panel additions; the
  synthetic NHI is deterministic (no `Math.random`, `Date.now()` or `new Date()`).
- **Persistence and determinism.** `PERSIST_VERSION` bumped, the migrate test backfills
  `appSettings` and `patientCare`, two fresh seeds deep-equal, Noah's earlier record is appended after the generated pool without
  shifting any id or RNG draw, and reset restores everything.
- **Design and copy.** The record and lists extend the Admin Review tile and table anatomy; mono for
  NHI, dates and money; teal-only actions; no crimson on the new screens; escalation uses the warning
  and error tints, never a status hue; "NHI missing" is the only label for the state; no en or em dashes.

## PROGRESS.md updates

- **Status row** for catch-up Phase 40, and a phase entry with:
  - the drift-check result (items changed or not; D11, OQ-49, OQ-41 and OQ-30 status; which D11 branch
    was built);
  - the open question on which invoices count toward the alert, flagged for the owner;
  - what was built, with a name map for later phases:
    - `AppSettings` / `appSettings` and `setUnpaidAlertThreshold`;
    - the `patientCare` slice (`UnpaidAlert`, `PatientFollowUp`, `PatientMerge`) and
      `Patient.pendingDetails`;
    - `src/domain/patients/` (`invoiceAgeDays`, `overdueForAlert`, `missingNhiLevel`,
      `detailDifferences`);
    - `patientActions.ts` (`attachPatientNhi`, `resolvePatientDetails`, `checkUnpaidOnBooking`,
      `acknowledgeUnpaidAlert`, `logPatientFollowUp`, `completeFollowUp`, `requestNhiFromRooms`,
      `mergedPatientTarget`, and the draft body `applyNhiAttach` that `decideImportRow` also runs);
    - `arrivedNhiFor` and `attachNhiAsSimulatedOffice`;
    - `patientSelectors.ts`;
    - the `nhiMissing` blocker;
    - `nhiBadge`'s `missing` flag;
    - the Admin Patients routes;
    - `NHI_ARRIVALS`, `FORTE_DAILY_MON27` (a `HOSPITAL_DOWNLOAD_SAMPLES` entry) and the id of Noah's
      earlier record;
    - the two trigger ids;
    - removed: `patientHasOutstandingPriorEpisode`, `outstandingPriorBalance` and the "Prior
      balance" pill;
  - the `PERSIST_VERSION` bump (from and to);
  - the tests added, the before and after Vitest and Playwright counts, and the review pass.
- **Decisions log:**
  1. **Superseded:** the 2026-07-22 third external plan review, finding #5 ("`nhi` optional, one seeded
     provisional NHI pending patient; NHI-driven behaviours apply when present"). The NHI is
     required. A record without one is a provisional exception on Missing NHI, its List cannot be
     authorised (D11 default, provisional while OQ-49 is open), and attaching an NHI that exists
     merges the records.
  2. **Superseded:** the Phase 10 WI2a reading (deviation 3: the intake balance banner on the billing
     monitor row) and the 2026-07-27 pre-workshop fix 10.2 ("Prior balance" reads any open prior
     episode). The unpaid alert is raised when a Booking is created or matched, for invoices unpaid
     longer than an admin-set threshold (90 days from the invoice date, OQ-33 answered, OQ-41
     provisional), stored as a snapshot; RV-21 closed.
  3. **Amended:** Phase 07's "authorise is never gated by flags", already amended by 21. A third named
     blocker, `nhiMissing`, joins it.
  4. **New:** one label, "NHI missing", on every surface (US-03.1.5 wording over US-11.1.4's "NHI
     pending").
  5. **New:** business settings live in `appSettings`, not `DemoSettings`.
  6. **New:** the unpaid alert counts every receivable on the patient's Bookings, whoever the billable
     party, pending AA's view.
  7. **New:** a merge deletes the provisional record and keeps a redirect; the provisional Xero contact
     is left as is.
  8. **New:** returning-NHI details that differ are held for office review, never auto-applied.
- **Handoff notes:**
  - For **41**: prepayment letters and reminders can log into the patient follow-up log (`kind`
    extended), and a refund or credit should appear on the patient record through the ledger.
  - For **42**: `appSettings` is the home for editable business settings. 27's prepayment settings and
    the archive window in `DemoSettings` are candidates to move there.
  - For **43**: the NHI leak scan should cover the NHI request email (`buildNhiRequestEmail`), the
    patient search results and the merge audit entries; `patientSearch` must stay fast at full scale.
  - For **44**: S1 Beat 1's alert line, Beat 1d and the S5 Missing NHI beat were added here. Re-read
    them in the rewrite, and walk "Office attaches the NHI" in the PWA-parity audit. If D11 or OQ-41 is
    answered later, the switch points are the D11 branches in items 3, 5, 7, 8, 9 and 13, `invoiceAgeDays`, the
    seeded threshold and the provisional captions.
