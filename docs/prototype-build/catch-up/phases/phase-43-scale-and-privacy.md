# Phase 43 · Scale and privacy

**Requirements covered:**
[US-15.0.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.4.md)
Volumes (Proposed: about 85 anaesthetists, 20,000 Slot records in the four-month horizon and 28,000
invoices a year, without any drop in performance) ·
[US-15.0.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.6.md)
Privacy and data minimisation (Proposed: the NHI never reaches Xero, never leaks through logs, error
messages, monitoring or non-production data; failed hospital data shows only what is needed, with the
raw payload under restricted access; non-production holds synthetic data only).
Context only, must stay green:
[FT-01.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.1.md)
(the four-month rolling canvas the Slot count is measured against),
[US-09.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.3.1.md)
(Xero contacts identified without the NHI),
[US-09.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.3.3.md)
(scheduled archiving, which cites the 28,000 invoices),
[US-11.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.1.md)
(patient record keyed on NHI),
[US-02.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.4.md)
(the unmatched queue, Phase 33, where the restricted raw-row view lives),
[US-13.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.1.md)
(role-based access) and
[US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md)
(audit trail of all actions).
[US-14.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-14.5.1.md)
(integration failure visibility, the dead-lettered HL7 case) is **Future** and is not built: its
"working view shows only what is needed, raw payload behind restricted access" rule is applied here to
the in-scope failure surface, the unmatched hospital rows.
No DM or RV item is owned here. The phase builds on
[DM-02](../analysis/domain-model-delta.md#dm-02) (Slots, Phase 28),
[DM-01](../analysis/domain-model-delta.md#dm-01) (Bookings, Phase 15),
[DM-18](../analysis/domain-model-delta.md#dm-18) (the ledger, Phase 36) and
[DM-28](../analysis/domain-model-delta.md#dm-28) (import rows, Phase 33); no
[reverse-check](../analysis/reverse-check.md) finding is closed here (RV-05 and RV-06, which note the raw
PID shown on the HL7 tooling, were closed by Phase 34's Future-scope demotion).
Open question for context:
[OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md) (NHI in Xero,
Appendix 1 vs Appendix 2, Open). No owner decision (D1 to D11) gates this phase.
**Depends on:** Phase 42 (every master editable and the controlled loader, so the generator reads the
final master shapes), Phase 36 (the ledger pair as the system of record, which the generated invoice
history must follow) and Phase 34 (the Intake home at `/admin/intake/matching`, the Future-scope
HL7/FHIR surface). Through them: Phase 14 (the demo-trigger registry, `useDemoTriggerContext`, the
shared actor constants), 15 (Bookings), 16 (AA-FEE invoices), 20 to 25 (one Contract per Procedure,
billable party, the AUTHORISED lock), 28 (Slots and Lists), 33 (import rows and the matching screen) and
37 (the Xero sync queue).
**Estimated:** 1 session in the outline, realistically 2. The generator alone (71 anaesthetists, a year
of billed history through the real builders, the Xero mirror and audit, with its integrity tests) is a
full session's work. Plan for the split: session 1 is work items 1 to 9 (the full-scale dataset, paused
persistence, the timings and the paged screens), stopped green; session 2 is the privacy half (items 10
to 15), the triggers' tests, the demo guide and the review pass. Do both in one only if session 1 runs
well.

## Goal

Two claims the prototype has so far only narrated become things a presenter can click.

- **Scale.** A "Load full-scale data" demo action replaces the demo data with a full-practice dataset
  built in memory from the seeded RNG: 85 anaesthetists (the 14 demo anaesthetists plus 71 synthetic
  ones), about 20,000 Slots in the four-month horizon, and about 28,000 invoices raised over the last
  12 months, each with its Booking, locked record, ledger pair and Xero mirror. The 14 demo
  anaesthetists' records are untouched, so S1 to S5 still run at scale and Dr Souter's figures do not
  move. localStorage cannot hold it, so saving pauses with a clear banner; nothing is written, not even
  serialised, until Reset. A banner shows generation and render timings, and each paged screen records
  its render time at demo scale and at full scale side by side, so "no drop in performance" is shown,
  not claimed. Admin Day, Invoices and Audit page at that scale (the Day view gets the legacy "1 of 3"
  pager the footer has so far only described). Reset, a scenario jump or a reload returns to the
  normal seed.
- **Privacy.** Three things make the NHI policy visible and checkable:
  - a restricted **View raw row** on the matching screen: the working view shows only the fields the
    office needs to resolve a row; everything else the hospital sent sits behind an office-only view
    that asks for a reason, writes an audit entry and shows the payload with identifiers masked. A
    Demo actions entry shows the same request refused, and audited, for another role;
  - a **Scan for NHI leaks** demo action on the Data Inspector that searches the Xero slice (including
    the sync queue), the diagnostic log, error and refusal messages and failure reasons for any NHI,
    known or merely valid-looking, and reports zero hits per area, with a "planted leak" choice that
    proves the scan finds one;
  - a **Synthetic data only** badge in the harness bar and in the Anaesthetist Web and Admin apps,
    matching the statement the mobile More tab already makes.

## Before you start: drift check

1. Run:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks for US-15.0.4, US-15.0.6, FT-01.1, US-09.3.1, US-09.3.3, US-11.1.1, US-02.1.4,
   US-13.5.1, US-13.5.2, US-14.5.1, OQ-30, and the domain-model lines on Slots, the NHI and the patient
   record.
2. If an item changed, re-read it in full and adjust the work items before building. If an item is now
   Retired or Future, drop its work and say so in the PROGRESS entry:
   - **US-15.0.4** Retired or Future: drop work items 1 to 9. If its figures changed (anaesthetists,
     Slots, invoices per year), change the one `FULL_SCALE` constants block (work item 2) and every copy
     line that quotes a figure; nothing else hard-codes them.
   - **US-15.0.6** Retired or Future: drop items 10 to 15. If its technical discussion drops the
     restricted raw payload, drop items 10 to 12; if it drops logs and telemetry, drop item 13's
     diagnostics log but keep the Xero area of the scan (US-09.3.1 still requires it).
   - **US-14.5.1** moved out of Future into scope: the dead-lettered HL7 message becomes a real surface
     again. Do not build its queue here; record it for Phase 44's handoff and apply work item 11's
     restricted view to it only if the session has room.
   - **OQ-30** answered for Appendix 1 (the NHI as a custom field on the Xero contact): the catalogue's
     US-09.3.1 will have changed too. The Xero area of the scan then reports the permitted field
     separately ("held by design") instead of as a leak; the rest of the scan is unchanged. If OQ-30 is
     still Open, build the Appendix 2 reading (nothing NHI-shaped in Xero), as the catalogue does today.
3. **Open questions.** None blocks this phase. OQ-30 is covered above. The masking policy for the raw
   row (which fields are masked and how) is not in the catalogue: build the provisional policy in work
   item 10 and label it "Masking policy is provisional, for AA to agree" in the sheet.
4. **Confirm the base.** This is the last build phase before 44, so most names below are those the
   earlier catch-up phases planned; read their PROGRESS entries and use the names they actually shipped:
   - Phase 28: the Slot record and its id format, `schedule.slots`, the canvas generator
     (`generateCanvasForDates` at plan time) and `CanvasMasters`.
   - Phase 15 and 23 to 25: the Booking and Procedure shapes, the primary Procedure, and the per-Procedure
     locked record written at authorise; the pure builders the billing run uses to price from the lock
     and to build invoices (the generator must call the same ones).
   - Phase 36: `billing.ledger` (`LedgerPair`, kinds), `LedgerReceipt`, `LedgerDisbursement`,
     `aaFeeInvoices`, the Admin Ledger screen route and its imbalance indicator. Phase 16: the AA-FEE
     invoice and its numbering. Phase 37: `billing.xeroQueue` and its item shape (the scan reads its
     payloads and errors).
   - Phase 33 and 34: `ImportRow`, `IncomingBookingFields`, `HOSPITAL_DOWNLOAD_SAMPLES` and the manual
     sheet fixtures, `stageHospitalRows`, `importRowViews`, the derived unmatched state and its reasons,
     the context key `matching.selectedRowId`, and the matching route (`/admin/intake/matching` at plan
     time). Whether any rows are seeded on load (a scheduled sync on boot) decides whether the
     `PERSIST_VERSION` bump in work item 10 also reseeds rows.
   - Phase 42: the master shapes (hospitals, insurers, surgeons and rooms, Contracts, RVG and Procedure
     masters, public holidays) and whether its loader keeps rejected rows with their values (the scan
     then covers its row-validation messages).
   - Phase 14: the registry file, `DemoTrigger` (whether it has a confirm step; at plan time `run` is
     synchronous and returns `{ ok, message }`), the memory store, the shared actor constants in
     `store/demoActors.ts` (`OFFICE_ACTOR`, `SOUTER_ACTOR`), the pinned per-screen counts in
     `demoTriggers.test.ts`, and `pwaPurity.test.ts`.
   - Phases 38 to 41: the ledger-backed web Accounts (Dr Souter's figures must not move at scale), the
     credit-and-rebill and additional-invoice shapes (Phase 39), the patient record and Admin · Patients
     screen (Phase 40: the generated patients follow its shape; check whether the screen lists every
     patient), and the prepayment credits and trust account (Phase 41: ledger kinds the generated history
     may leave empty but must not break). The generator follows the shapes as shipped by 41, not as at the
     snapshot.
   - Note the current `PERSIST_VERSION`.
5. **Measure first.** Before writing the generator, time today's Admin Day, Invoices and Audit screens
   on the pristine seed (work item 7's hook can be added first) so the "demo scale" column of the timing
   table has a real baseline. Record the numbers in the PROGRESS entry.
6. Record the result (changed items, the shipped names used, the baseline timings) in the PROGRESS
   entry.

## Reference

**Design (convention 17).** No mockup covers a pager, the scale banner, the raw-row sheet, the scan
report or an environment badge, so extend existing patterns; do not invent a new visual language.
- [Design Language.dc.html](../../../design/Design%20Language.dc.html): teal `#0D6E63` only for the
  actions this phase adds ("View raw row", the pager's current-page state, Search); semantic warning
  tint `#F9F0DC` / on-tint `#7C4D08` for the "Saving paused" banner and the provisional masking line;
  success tint `#E3F4EB` / on-tint `#157A49` for a zero-hit scan area; error tint `#FAE9E7` / on-tint
  `#9C332F` only for a scan area with hits; neutrals (ink, slate, mist, line) for the Synthetic data
  badge, which is an environment marker, not an action, a status or identity; pills at radius 999;
  Spline Sans Mono with tabular-nums for every count, timing, id, page number and masked value; card
  radius 14, sheet anatomy as the existing admin side sheets; crimson nowhere new. The six schedule
  status colours are never reused for scale or privacy states.
- [Admin Day.dc.html](../../../design/Admin%20Day.dc.html): the day grid, its header summary line and
  footer; the pager sits in the footer strip, in the footer's type and colour.
- [Admin Review.dc.html](../../../design/Admin%20Review.dc.html): table, stats strip and side-sheet
  anatomy for the Invoices and Audit pagers and the raw-row sheet.
- [Web Dashboard.dc.html](../../../design/Web%20Dashboard.dc.html): the web top nav where the badge sits
  beside the persona.

**Catalogue.** The two covered stories are short: US-15.0.4 is one sentence plus a note that performance
testing is a Testing-milestone task; US-15.0.6's technical discussion carries the three constraints
(logs and telemetry, failed message handling, non-production environments). US-14.5.1 states the
restricted raw-payload rule in the dead-letter setting.

**Analysis.**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): "Demo-trigger buttons" (the Oversight/NFR cluster: Load
  full-scale data, Scan for NHI leaks) and the EP-15 table and header note; per-gap detail in
  [epics/EP-15.md](../epics/EP-15.md) (sections US-15.0.4 and US-15.0.6).
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) sections 1 (store
  core and persistence), 7 (seed) and 10;
  [prototype-map-admin.md](../analysis/prototype-map-admin.md) sections 3 (Day view), 6 (Invoices) and
  10 (Audit viewer);
  [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) sections 2 (harness
  bar), 4 (Reset), 5.4 (Data Inspector), 7 (PWA) and 9 (extension points).

**Code entry points** (paths under `aa-prototype/src/`, names as at the snapshot; re-read them after
Phases 14 to 42):
- Persistence: `store/persistStorage.ts` (`resilientLocalStorage`, `flushPersist`, `persistStatus`,
  `bytes`, `STORAGE_BUDGET_BYTES`; the header explains why every mutation re-serialises the whole store);
  `store/appStore.ts` (`createAppStore`, the `persist` options with `createJSONStorage`, `PERSIST_KEY`,
  `PERSIST_VERSION`, `freshAppState`, `backfillMerge`).
- Reset: `store/mutate.ts` `resetDomainState` (the one permitted wholesale replace; the
  `storeDiscipline` test in `mutate.test.ts` keeps raw `setState` there), `store/clockActions.ts`
  `resetDemo`, `rollCanvasForward`, `applyClock`; `shell/DemoResetButton.tsx`; the PWA reset in
  `pwa/PwaDemoPanel.tsx` (removes `PERSIST_KEY`, then `resetDemo`).
- Seed and generators: `domain/seed/index.ts` (`SEED`, `buildSeed`, `volumeStory` at ~430),
  `domain/seed/canvas.ts` (Phase 28's generator), `domain/seed/slotHash.ts` (`slotRng`,
  `hashStringToSeed`), `domain/seed/patients.ts` (`buildPatients`, the `FIRST_NAMES` and `SURNAMES`
  pools), `domain/nhi.ts` (`validateNhi`, `generateNhi(format, rng)`), `domain/seed/history.ts`
  (`buildHistory`, the backdrop pattern), `domain/clock.ts` (`horizonFor`, `enumerateDatesISO`,
  `DEMO_TODAY`); the scale test in `store/canvasRoll.test.ts` (~197 to 235: 85 anaesthetists by the
  full horizon in under 2 s), which is the proof this phase turns into a UI.
- Admin screens: `apps/admin/AdminApp.tsx` (the day derivations `dayLists`, `listsByAnaesthetist`,
  the review and badge counts), `apps/admin/components/DayGrid.tsx` (the footer sentence at ~241 "At
  production scale (~85) this view pages and virtualises ... narrated here, not simulated"),
  `apps/admin/screens/InvoicesScreen.tsx` (renders every non-backdrop invoice today),
  `apps/admin/screens/AuditViewer.tsx` (`CAP = 500`, `sortAuditNewestFirst` on every filter change),
  `apps/admin/screens/MasterData.tsx` (~543, the narrated scale line), the Phase 36 Ledger screen, and
  `store/selectors.ts` (`entityCounts` ~874, `billingAttentionCount`, `submittedListCount`).
- Demo surfaces: `apps/demo/DemoData.tsx` (subscribes to the whole store; the persisted-size panel;
  `guardTargets` builds a `select` over every non-DRAFT List and its Bookings), `apps/demo/DemoXero.tsx`
  (the contacts and invoices tables render every row; the "Contact archiving and volume" callout ~86
  reads `settings.volumeStory`).
- Shell: `shell/AppShell.tsx` (the harness bar left group: product name, "Prototype" pill, the DEV-only
  Requirements link), `apps/web/components/WebNav.tsx` (persona group ~62),
  `apps/admin/components/SideNav.tsx` (the `Wordmark` and "ADMIN" block), `apps/mobile/screens/MoreScreen.tsx`
  (~62 to 66, "All patients, lists and figures are fictional"), `shared/DemoBadge.tsx`.
- Privacy today: `store/xeroNhi.test.ts` (the Xero-slice probe this phase generalises), `store/intake.ts`
  (`upsertPatient`; audit `patient.create` carries the NHI in `after`, which is core platform),
  the four `console.*` calls (`pwa/swRegistration.ts:39`, `pwa/officeSimulation.ts:159`,
  `store/persistStorage.ts:111`, `store/events.ts:29`), `store/mutate.ts` `refuse` (~43).
- Matching (Phase 33 and 34): `apps/admin/screens/MatchingScreen.tsx` and `apps/admin/matching/` (the row
  detail panel, the `RowField` correction control), `store/matchingActions.ts`, `domain/intake/`
  (`matching.ts`, the sample fixtures), the Future-scope HL7/FHIR surface under `apps/demo/`.
- Registry and PWA: `shared/demoTriggers/` (`types.ts`, `registry.ts`, `context.ts`, `memory.ts`,
  `demoTriggers.test.ts`), `shell/DemoActionsMenu.tsx`, `pwa/pwaPurity.test.ts`, `main.tsx` and
  `aa-prototype/pwa/main.tsx` (the `wire*` bootstrap calls).
- Audit labels: `shared/audit/actionLabels.ts`; `auditNarrative.test.ts` enforces a label for every
  emitted action code.

## Work items

Model, pure code and store first, then UI, then triggers, tests and docs. Every domain write goes
through `mutate()` with an audit entry, except the two wholesale replaces (Reset and the full-scale
install), which live beside each other in `mutate.ts`. Every new action code gets a label in
`ACTION_LABELS`. No `Date.now()`, `new Date()` or `Math.random()` anywhere in the data path: the dataset
comes from `slotRng` streams keyed off `SEED`, and time from the demo clock. `performance.now()` is used
**only** to measure (timings are never stored in domain state and never change what is generated), and
only in `src/store/scaleMode.ts` and `src/shared/scale/`.

### Scale

1. **Persistence can pause** (`store/persistStorage.ts`, `store/appStore.ts`) (US-15.0.4):
   - `pausePersist(reason: string)`: cancels the pending write timer, drops `unwritten`, and latches a
     **paused** state that is separate from the error latch (`persistDisabled` stays about storage
     failures). `resumePersist()` clears it. `persistStatus()` returns
     `{ disabled, reason, paused, pausedReason }`.
   - The store's `storage` becomes `pausableStorage(createJSONStorage(() => resilientLocalStorage))`: a
     `PersistStorage` wrapper whose `setItem` returns before the inner storage is called while paused.
     This matters because `createJSONStorage` serialises inside `setItem`: without the wrapper every
     mutation at full scale would still stringify tens of megabytes and throw the result away.
   - Same key, same JSON shape, same version: no `PERSIST_VERSION` change for this item.
   - Vitest in `persistStorage.test.ts`: while paused, a store mutation calls neither the inner
     `setItem` nor `JSON.stringify` of the state (spy); `bytes()` still reports the last written payload;
     resume then one mutation writes once; the error latch and the pause are independent (a paused store
     that then hits a quota error reports both).
2. **The full-scale generator** (new `src/domain/seed/fullScale/`, pure, with its own `index.ts`;
   **not** re-exported from `domain/seed/index.ts`, because a static re-export would pull it into the main
   chunk and defeat the dynamic import in work item 3; tests import it by path; Vitest in
   `fullScale.test.ts`) (US-15.0.4):
   - **Purity first.** `domainPurity.test.ts` forbids `src/domain` reaching into `src/store`. Anything the
     generator must share with the runtime that lives in the store today is lifted into `src/domain/`
     first, with the store keeping a thin wrapper and no behaviour change: at the snapshot that includes
     the archive rule (`eligibleArchiveContactIds` in `store/archiveActions.ts`, rewritten as a pure
     `domain/billing/contactArchive.ts` that groups ACCRECs by contact once, so it is linear; today's loop
     re-filters every ACCREC per contact, which is quadratic at 28,000 contacts), and any selector the
     billing run leans on (`billingContextForCard`, `casesForList`, `prePaidByProcedure` in
     `store/selectors.ts` at the snapshot) if the generator needs it. Use whatever Phases 25 and 36 made
     pure for pricing from the lock and building ledger pairs.
   - `FIRST_NAMES` and `SURNAMES` in `domain/seed/patients.ts` are module-private today: export them (no
     change to `buildPatients`, so the seed is unchanged).
   - `FULL_SCALE`, one labelled constants block (`fullScale/constants.ts`): `anaesthetists: 85`
     (so 71 generated), `historyMonths: 12`, `targetInvoicesPerYear: 28000`, the booking density per
     booked List, the share of split Bookings, the payment mix of the history (paid and disbursed, part
     paid, outstanding by age), the share of one-time patients (read from `settings.volumeStory.oneTimePct`,
     99), and the page sizes used by the screens (Day 30 anaesthetists, Invoices 50, Audit 100). Every
     figure in copy is read from here or counted from the data, never typed.
   - `buildFullScaleDataset(base: AppState-shaped seed, clock): FullScaleDataset`, deterministic, built
     on top of the pristine seed (the 14 demo anaesthetists and every seeded record are kept exactly):
     - **Anaesthetists** (71): synthetic names from the seed's `FIRST_NAMES` and `SURNAMES` pools with a
       "Dr" prefix, registration numbers in a reserved block that cannot collide with the cast (for
       example 60001 upwards), unit values and GST periods drawn from the seed's ranges, `active: true`,
       and Permanent List templates drawn like the cast's (so `rollCanvasForward` keeps generating their
       far edge when the clock moves). Their profile fields follow Phase 26 (prepaid set empty).
     - **Slots and Lists** across the horizon via Phase 28's generator with the extended
       `CanvasMasters`: about 21,000 Slots from today to the four-month edge (85 x 124 days x 2) and about
       23,500 including the two weeks back. Forward booked Lists for the 71 get Bookings at the seed's
       filler density (richest over the next 10 days, thinning after), on the existing hospitals,
       surgeons and default Contracts.
     - **Billed history** for the 71 over the last 12 months before `DEMO_TODAY`: worked Lists (each with
       its Slot, following whatever Phase 28 does for pre-horizon history), Bookings with a primary
       Procedure, a Contract per Procedure (Phase 20's default), a billable party (Phase 21), the locked
       record written at authorise (Phase 25), then invoices, ledger pairs, receipts and disbursements
       built with **the same pure builders the billing run and ledger use** (never store actions:
       `mutate()` per record would copy the audit array each time and go quadratic). Invoices land at
       about `targetInvoicesPerYear`, AA-FEE invoices (Phase 16, one per generated anaesthetist per fee
       period) included and counted separately.
     - **A realistic review backlog**: the 71's worked Lists from the last two working days before
       `DEMO_TODAY` are left SUBMITTED (Bookings complete, not authorised, not billed), so the Review
       queue shows the practice-sized backlog it would carry (about 100 to 170 Lists) and not only the
       cast's.
     - **Patients**: about one per history Booking at the one-time share, with synthetic names, DOBs,
       ethnicity codes and phones drawn like `buildPatients`, and NHIs from `generateNhi` (about one in
       nine new-format) against a used-set seeded with every existing NHI, so every NHI is valid and
       unique. Every patient carries a hidden internal id as today.
     - **Xero mirror**: one contact per patient and organisation keyed on the hidden internal id, an
       ACCREC and ACCPAY per ledger pair, payments and disbursements matching the ledger, and contacts
       archived by the same rule `eligibleArchiveContactIds` applies (fully paid and inactive past the
       window), so the active-contact count is real. `settings.volumeStory.activeContacts` is set to that
       count in the full-scale state.
     - **Audit**: a compact, realistic trail per generated record (Booking create, complete, List
       submit, authorise, billed, payment, disbursement), correct actors and sources, clock timestamps
       from the record's own dates, sorted by `atISO`; then one newest entry `demo.fullScaleLoaded`
       (actor "Demo control", source demo, `after: { anaesthetists, slots, invoices, auditEntries }`).
     - **Ids and numbers**: every id comes from the counters, which the dataset returns advanced, so the
       first runtime allocation after loading continues past them. Generated invoice numbers use a
       reserved series that can never collide with the live counter or the seeded `AA-2026-H<n>`
       backdrop (for example `AA-S-000001`); say so in the Decisions log.
     - Returns `{ state, counts: { anaesthetists, slotsInHorizon, slotsTotal, lists, bookings,
       patients, invoices, aaFeeInvoices, ledgerPairs, xeroContacts, activeContacts, auditEntries } }`.
   - Vitest (allow a generous per-test timeout; note the Node timing in the PROGRESS entry):
     - determinism: two builds give identical counts and an identical digest (an FNV-1a hash over every
       record id, amount and date, in key order);
     - the seed survives: every seeded record (the 14 anaesthetists' Slots, Lists, Bookings, invoices,
       ledger pairs, Xero rows, audit) is deep-equal to the pristine seed's;
     - the claims: 85 anaesthetists; Slots from today to the horizon edge at least 20,000; exactly two
       Slots per anaesthetist per day; invoices raised in the last 12 months within 27,500 to 28,500;
     - integrity: every ledger pair balanced (disbursed at most authorised, authorised at most received,
       received at most due, Phase 36's invariants); every invoice links to a Booking and a locked record;
       every Booking has exactly one primary Procedure and one Contract per Procedure; every NHI valid and
       unique; no id collides with the seed; the next allocated id of each kind is unused;
     - privacy: the leak scan (work item 13) over the full-scale state finds zero NHIs in the Xero
       slice.
3. **Installing and leaving full scale** (`store/mutate.ts`, new `store/scaleMode.ts`, `store/clockActions.ts`)
   (US-15.0.4):
   - `installDomainState(api, state)` in `mutate.ts`: the wholesale replace that `resetDomainState` already
     does, extracted so the two share one code path (the `storeDiscipline` test keeps raw writes here).
   - `store/scaleMode.ts`: a tiny non-persisted zustand store (no `persist`, like Phase 14's memory
     store) holding `mode: 'demo' | 'generating' | 'fullScale'`, `counts`, and the timings (`generateMs`,
     `installMs`, `firstPaintMs`) plus per-screen render samples (work item 7). It lives in the store layer
     so `resetDomainState` can clear it; it never enters `AppState` or the persisted payload.
   - `loadFullScaleData(api): Outcome` is synchronous to its caller, like every registry `run`: it refuses
     when already `generating` or `fullScale`, otherwise sets `generating` and returns `ok` at once; the
     rest runs asynchronously and reports through `scaleMode`, never through the trigger's return value.
     If generation or install throws, it records `mode: 'demo'` with an `error` message the banner shows
     ("Full-scale data could not be generated: ..."), runs `resetDomainState`, and reports a diagnostic
     (work item 12). The frame wait is an injected scheduler (default `requestAnimationFrame`), so Vitest
     does not depend on rAF. The async part: (after one
     frame, so the banner paints) runs `resetDomainState`, dynamically imports `domain/seed/fullScale`
     (code-split, so neither the main chunk nor the PWA carries the generator until used), times
     `buildFullScaleDataset`, calls `pausePersist('Full-scale data is held in memory only')`, removes
     `PERSIST_KEY` from storage (so a reload returns to the pristine seed, never a half state), then
     `installDomainState` and times it; `firstPaintMs` is taken from a double `requestAnimationFrame`
     after install. Sets `fullScale` with the counts.
   - `resetDomainState` sets `mode: 'demo'`, clears the full-scale counts and calls `resumePersist()`
     **before** it installs the pristine state, so the pristine state is written. Scenario jumps and the
     PWA reset go through it and so leave full scale too.
   - The clock keeps working at scale: `rollCanvasForward` generates the far edge for all 85; the poll
     and the archive job run over the full ledger and contacts.
   - Vitest in `scaleMode.test.ts`: load then reset gives counts equal to the pristine seed, `mode:
     'demo'`, persistence resumed and one write; a reload simulation after a load (fresh store over the
     same storage) hydrates the pristine seed; `advanceClockDays(1)` at full scale adds 170 Slots and
     runs without error; a Booking created after the load gets an unused id; a second load while
     generating is refused.
4. **Selectors that stay fast at scale** (`store/selectors.ts` and the admin derivations):
   - Profile with the timing hook first; fix only what the numbers show. The likely hot spots are the
     per-render full scans in `AdminApp.tsx` (`dayLists` over every List, `reviewLists`, the side-nav
     badge counts), `AuditViewer`'s sort and `entityTypes` set on every render, `InvoicesScreen`'s
     `failedCases` filter, and the clock jobs: the archive job (made linear in work item 2) and the
     reconciliation poll must each stay well under a second on Next day at full scale.
   - Add memoised indexes keyed on the record map's identity (a `WeakMap` per map, rebuilt only when the
     map object changes): Lists and Slots by date, Bookings by List, invoices sorted newest first, audit
     sorted newest first with an entity-type set. Components keep deriving through `useMemo` as the
     selectors file's header requires.
   - Vitest: each index returns the same result as the plain scan on the pristine seed and on a small
     generated dataset, and is rebuilt after a mutation that replaces the map.
5. **Admin Day pages at 85** (`apps/admin/components/DayGrid.tsx`, `AdminApp.tsx`) (US-15.0.4):
   - A pager in the grid footer: "Anaesthetists 1 to 30 of 85" with previous and next buttons and "1 of
     3", shown only when there are more rows than the page size, so the demo-scale view (14) is unchanged.
     Status and focus filters and the sort apply before paging; the page resets to 1 when the date,
     sort or a filter changes. The page is a view preference in the query string (`?page=2`, `replace`),
     like `?sort=az`.
   - Replace the footer sentence "At production scale (~85) this view pages and virtualises ... narrated
     here, not simulated" with the real counts ("14 of 85 anaesthetists have matching blocks. Showing 30
     of 170 blocks.").
   - The header summary line ("N anaesthetists · N sessions · N free · N submitted") counts all 85, not
     the page.
   - `DayGrid.test.tsx`: no pager at 14 rows; at 85 rows three pages, filters narrow before paging, a
     date change returns to page 1.
6. **Invoices and Audit page at 28,000** (`InvoicesScreen.tsx`, `AuditViewer.tsx`, and the Phase 36
   Ledger screen if it lists every pair) (US-15.0.4):
   - A shared `Pager` component, new `apps/admin/components/Pager.tsx` (`tableChrome.ts` holds only style
     helpers and stays `.ts`; the pager reuses its cell styles): "Showing 1 to 50 of 28,114" (mono,
     tabular), previous and next, first and last, keyboard focusable, `data-shot` hooks. The Day grid's
     footer pager (work item 5) uses it too.
   - Invoices: page size 50 over the existing sort, plus one search field ("Find by invoice number or
     payer") that filters before paging. The "Recently billed" strip and the failed-cases banner read the
     indexed selectors, not a full scan.
   - Audit: remove `CAP = 500` and its note; page size 100 over the filtered, sorted index; the filters
     reset the page. The compliance rules stay: one stored entry is one row, Role · source always shown.
   - Ledger (Phase 36): if its whole-ledger or per-anaesthetist view lists every pair, give it the same
     pager; the imbalance indicator must compute from the indexed totals, not by re-reading every pair per
     render.
   - Safety caps on the two demo tables that would otherwise render every row at scale: the Xero sim's
     Contacts and Invoices tables (`DemoXero.tsx`) and the Data Inspector's lifecycle table and guard
     console selects (`DemoData.tsx`) show the first 200 rows with "Showing 200 of N" (the guard console
     offers the seeded marker Lists and today's Lists only when `mode === 'fullScale'`). If Phase 40's
     Admin · Patients list renders every patient, it gets the shared `Pager` at 50 over its existing search
     (about 28,000 patients at scale). These are caps, not features.
   - Component tests: the pager's ranges and edges (0 rows, exactly one page, last partial page);
     Invoices search then page; Audit filter resets the page.
7. **Timings you can see** (new `src/shared/scale/`: `useScreenTiming.ts`, `ScaleBanner.tsx`) (US-15.0.4):
   - `scaleMode.ts` also exports `timed(fn)` (returns the result and elapsed ms), the one way any other
     module measures (the leak scan in work item 13 uses it), so `performance.now()` stays in the two
     permitted places.
   - `useScreenTiming(key)` in Admin Day, Review queue, Invoices, Audit and the Ledger screen (the Review
     queue is timed and indexed, not paged: its backlog at scale is a few hundred rows at most): takes `performance.now()`
     at the start of the render and records the elapsed time in a layout effect (render and commit), then
     a paint sample after two animation frames, into `scaleMode`'s per-screen samples tagged with the
     current mode. It samples on mount and on page, filter and date changes. It is cheap and runs at both
     scales, so each screen has a demo-scale and a full-scale figure.
   - `ScaleBanner` (`data-shot="scale-banner"`), rendered by `AppShell` directly under the harness bar
     while `mode` is `generating` or `fullScale`, in the warning tint:
     - generating: "Generating full-scale data from the seed. This takes a few seconds.";
     - loaded: "Full-scale data · 85 anaesthetists · 21,080 Slots in the four-month horizon · 28,114
       invoices in the last 12 months · generated in 3.4 s · saving paused. Reset or reload returns to
       the demo data." (all figures from `counts` and the timings);
     - a "Timings" disclosure: a small table of each sampled screen, "Demo data" and "Full scale" columns
       (median of the last five samples, ms, mono), plus generation, install and first paint. If
       `performance.memory` exists (Chrome), one line "JS heap about N MB".
   - The banner is harness chrome: it never renders in the PWA (only `AppShell` mounts it), and it is not
     product UI.
   - Data Inspector: the persisted-size panel says "Saving paused: full-scale data is held in memory only"
     while paused, and `entityCounts` gains `slots`, `bookings`, `invoices`, `ledgerPairs`,
     `xeroContacts` (whichever the shipped names are).
8. **Narrated scale becomes counted** (`MasterData.tsx` ~543, `DemoXero.tsx` ~86):
   - While `mode === 'fullScale'` the "Xero and archiving" line and the Xero sim's volume callout read the
     real counts (invoices in the last 12 months, contacts, active contacts against the soft limit) and
     say "counted from the loaded data"; at demo scale they keep today's narrated wording.
9. **Re-green the scale half.** `npm run build`, `npm run build:pwa`, `npx vitest run`. This is the
   safe stop point. Run the manual checklist's scale items before going on.

### Privacy

10. **The raw hospital row, held but not shown** (`domain/types.ts`, `domain/intake/`, `store/matchingActions.ts`)
    (US-15.0.6 failed message handling; US-02.1.4):
    - `ImportRow.raw: RawImportRow`, where `RawImportRow = { format: 'sheetRow' | 'downloadRow' |
      'feedMessage'; columns: readonly { name: string; value: string }[] }`: the row exactly as the
      hospital sent it, including the columns the matcher does not map (for example address, next of kin
      and phone, referrer, clinical note, the hospital's own patient number). Written once by
      `stageHospitalRows` and never edited (corrections stay in `corrections`).
    - Fixtures: a pure `rawRowFor(sampleRow)` in `domain/intake/` builds each sample's raw columns from its
      incoming fields plus a few deterministic synthetic extras, so no fixture is typed twice. A
      `feedMessage` row's raw columns are the parsed segments of the Future-scope message text.
    - The working view (Phase 33's table and row detail) is unchanged: it shows the mapped fields only.
      Add one line under the row detail's incoming fields: "Only the fields needed to match are shown.
      The rest of what the hospital sent is held under restricted access."
    - `maskRawRow(raw, policy)` in new `src/domain/privacy/mask.ts` with `RAW_ROW_MASKING`, one labelled
      provisional block: NHI-shaped values keep the first three characters and mask the rest
      ("ZAA••••"), dates of birth keep the year, phone numbers keep the last three digits, email keeps
      the domain, street addresses keep the suburb, next-of-kin names become initials; other columns show
      as sent. Pure, Vitest in `mask.test.ts`: every masked output of every fixture contains no NHI (by the
      same detector as work item 13) and no full DOB; unknown column names still mask NHI-shaped values.
    - `PERSIST_VERSION` bump (the persisted `ImportRow` shape changes; if Phase 34 seeds rows on boot, the
      reseed carries `raw`).
11. **The restricted raw-row view** (`store/matchingActions.ts`, `apps/admin/matching/RawRowSheet.tsx`)
    (US-15.0.6; US-13.5.1; US-13.5.2):
    - `viewRawImportRow(api, actor, rowId, reason)`: refuses `notFound`; refuses `notEligible` when the row
      is decided or neither unmatched nor blocked by a flag ("Raw rows are available only while a row
      needs resolving"); refuses `reasonRequired` for a blank reason. A non-office actor is refused
      `officeOnly` ("Only office staff can view a raw hospital row") **and the attempt is audited**
      (`importRow.rawViewDenied`, `after: { role, source }`, no patch), the way Phase 14 audits failed
      sign-in attempts. An office actor gets one audit entry `importRow.rawViewed` (`after: { reason,
      columnsShown }`, never the payload or any value) and the outcome value `maskRawRow(row.raw,
      RAW_ROW_MASKING)`. Nothing is stored about the reveal itself; each view is a fresh request.
    - Selector `rawViewsFor(state, rowId)`: the count and the last viewer and time, from the audit.
    - UI: in the row detail panel of an unmatched or blocked row, a quiet secondary link "View raw row"
      (`data-shot="matching-raw-row"`). It opens a side sheet: the heading "Raw hospital row"; the line
      "Restricted. Viewing is recorded with your reason."; a reason field with three quick reasons
      ("Find why this row did not match", "Check what the hospital sent", "Hospital asked us to confirm a
      value") and free text; the teal "View raw row" button (disabled until a reason is given). On success
      the sheet shows the masked columns (name, value in mono) and "Masking policy is provisional, for AA
      to agree". Closing the sheet hides the payload; opening it again asks for a reason again. The panel
      shows "Raw row viewed 2 times · last Kirsty W. 10:42".
    - Vitest: each refusal; the denied attempt writes exactly one audit entry and returns no payload; the
      office view writes one entry with the reason and no values; the returned payload is masked; a
      decided row refuses; the audit label exists for both codes.
12. **Diagnostics that cannot carry an NHI** (new `src/store/diagnostics.ts`, `src/domain/privacy/nhiDetect.ts`)
    (US-15.0.6 logs and telemetry, error messages):
    - `nhiDetect.ts` (pure): `findNhiTokens(text)` returns every token matching either NHI shape
      (current AAANNNC, new AAANNAX, letters excluding I and O, case-insensitive) that also passes
      `validateNhi`; `redactNhis(text)` replaces each with "[NHI]". Vitest over both formats, lower case,
      embedded in JSON and punctuation, and look-alikes that fail the check digit (not flagged).
    - `diagnostics.ts`: `reportDiagnostic(level, message, context?)` redacts the message and any string in
      `context`, appends to a bounded, non-persisted ring buffer (the last 200 entries) and forwards to the
      console. `recentDiagnostics()` reads the buffer; `wireDiagnostics()` records `error` and
      `unhandledrejection` events (message and source only, redacted), called in `main.tsx` and
      `aa-prototype/pwa/main.tsx`.
    - Replace the four `console.*` calls with `reportDiagnostic`. `refuse()` in `mutate.ts` also records
      `{ code, message }` at level `refusal`, so the error messages people see are part of what the scan
      reads.
    - A source-scan test (like `domainPurity.test.ts`): no `console.` call outside `diagnostics.ts` in
      non-test sources under `src/` and `aa-prototype/pwa/`.
13. **The NHI leak scan** (new `src/store/privacyScan.ts`) (US-15.0.6; US-09.3.1):
    - `scanForNhiLeaks(state, options?)` returns a report: per area, what was scanned, how many items,
      and every hit (area, location, the masked token, never the raw NHI). The known-NHI set is every
      patient NHI plus every NHI in import rows; the detector also flags any valid NHI-shaped token even
      if no patient holds it. Areas, each tokenised once so the scan is linear even at full scale:
      - **Xero** (must be zero): the whole `xero` slice, and `billing.xeroQueue` payloads and errors
        (Phase 37);
      - **Diagnostic log**: `recentDiagnostics()`, including recorded refusals;
      - **Failure reasons**: ledger and billing exceptions (Phase 36), Xero queue errors and divergence
        notes (Phase 37), import row unmatched reasons and flags (Phase 33), the Future-scope message
        log's failure reasons, and Phase 42 loader row-validation messages if it keeps them;
      - **Held inside the core platform (allowed)**: patients, Bookings, import rows (including `raw`) and
        the audit trail, reported as counts with "Held by design" and never as leaks. If OQ-30 was
        answered for Appendix 1 (drift check), the permitted Xero contact field joins this group.
    - The report's scan time comes from `timed()` in `store/scaleMode.ts` (work item 7), never from a
      direct `performance.now()` call here.
    - `options.plantTestLeak`: adds one clearly labelled synthetic diagnostic line containing a real seeded
      NHI to the scan input only (never to the buffer or the store), so the report shows one hit in
      "Diagnostic log (planted test line)".
    - Vitest in `privacyScan.test.ts` (it supersedes the body of `xeroNhi.test.ts`, which becomes a thin
      call): after the whole money chain (authorise, billing run, handoff, payment, payables, an AA-FEE
      invoice), a matching import with a raw-row view and a refused one, a Xero outage and restore, and a
      billing failure, every leak area reports zero; a planted leak reports exactly one; a hand-injected
      NHI in a billing failure message is found (proves the area is wired); the scan never includes an
      unmasked NHI in its report.
14. **The scan report on the Data Inspector** (`apps/demo/DemoData.tsx`):
    - A "Privacy checks" panel (`data-shot="nhi-scan-report"`): before any scan, "Run Demo actions, Scan
      for NHI leaks"; after one, a table of areas (Area, What was scanned, Items, NHIs found) with a
      success pill "0 found" or an error pill "1 found" and the hit locations, the "Held inside the core
      platform" rows in neutral, the scan time in ms and the clock time it ran. The report is kept in
      Phase 14's memory store (not persisted, cleared by Reset).
15. **Synthetic data only, everywhere** (new `src/shared/SyntheticDataBadge.tsx`) (US-15.0.6 non-production
    environments):
    - A small pill with a `ShieldCheck` icon, "Synthetic data only", two tones: `onInk` (white on ink, the
      harness chrome and the admin side nav) and `onLight` (slate on a neutral line, the web nav). Its
      tooltip and `aria-label`: "Every patient, NHI, List and figure here is synthetic. Environments other
      than production hold synthetic data only." Neutral, not the `DemoBadge` warning tint: it states an
      environment property, it does not mark a simulated control.
    - Placements (`data-shot="synthetic-data-badge"`): the harness bar's left group after the "Prototype"
      pill (`AppShell.tsx`); the web top nav before the persona (`WebNav.tsx`); the admin side nav under
      the "ADMIN" label (`SideNav.tsx`). The mobile More card's copy becomes "All patients, NHIs, Lists and
      figures are synthetic." with the same badge in `onLight` (ships to the PWA too).
    - Component tests: each placement renders the badge and its label; no en or em dash.

## Demo triggers

All are registered through the Phase 14 registry with a `run(api, ctx)` on the screen's entity or its
published context, a disabled state with its reason, and a demo badge. None is added to the Control
Panel page, which lists them under their screens automatically.

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `load-full-scale` | Load full-scale data | Admin · Day view (`/admin/day/:dateISO`) and Admin · Invoices (`/admin/invoices`, `/admin/invoices/:invoiceId`) | bar | `loadFullScaleData`: resets, builds 85 anaesthetists, about 21,000 Slots in the horizon and about 28,000 invoices in memory, pauses saving, shows the scale banner. Message: "Generating full-scale data. Timings appear in the banner." Needs a confirm step ("Replaces the current demo data. Reset returns to it."): use the registry's confirm if Phase 14 shipped one, otherwise add an optional `confirm?: string` to `DemoTrigger` (the menu shows a second Confirm click, like the Control Panel's jump) with a registry test | already generating ("Generating"); already loaded ("Full-scale data is loaded. Reset returns to the demo data.") |
| `scan-nhi-leaks` | Scan for NHI leaks | Data Inspector (`/demo/data`) | bar | `choices`: "Scan now" and "Scan with a planted test leak (proves the scan finds one)"; runs `scanForNhiLeaks` and stores the report for the Privacy checks panel. Message: "Scanned 3 areas and 31,204 items in 180 ms. No NHI found outside the core platform." (figures from the report) | never |
| `matching-raw-row-other-role` | View raw row as another role | Admin · Intake, Matching (`/admin/intake/matching`, the shipped route), with the published `matching.selectedRowId` | bar | `when`: a row is selected and it is unmatched or blocked. `choices`: "As Dr Melanie Souter (anaesthetist)" (Phase 14's `SOUTER_ACTOR`) and "As the hospital feed (integration)" (a new `HOSPITAL_FEED_ACTOR` in `store/demoActors.ts`: `{ who: 'Hospital feed', role: 'system', source: 'integration' }`; `ActorRole` has no integration role); calls `viewRawImportRow` with that actor and the reason "Demo: access check". Message: "Refused: only office staff can view a raw hospital row. The attempt is in the audit trail." | no row selected ("Select an unmatched row first"); the row is decided ("Raw rows are available only while a row needs resolving") |

The office's own **View raw row** is a product action in the row detail panel (work item 11), not a demo
trigger: the Roadmap keeps product actions in the product UI. What cannot be shown through normal use is
the restriction itself, because the Admin app always runs as the office, so the harness entry exercises
the refusal. This is the reading of the plan's "View raw row" trigger; record it in the Decisions log.

The "Load full-scale data" entry is listed on the Day view and Invoices screens because those are where
scale is demonstrated; Audit and the Ledger then show it without a trigger of their own. Its `run` returns
at once (the registry's `run` is synchronous); progress, the result and any error show in the scale banner.

Tests: update the pinned per-screen counts in `demoTriggers.test.ts` for the Day view, Invoices, Data
Inspector and Matching; add a case per entry for its disabled reasons; if `confirm?` is added, a registry
test that the menu needs the second click before `run` fires.

**PWA equivalent:** none needed. The Day view, Invoices, Audit, Ledger, Matching and Data Inspector are
Admin or demo surfaces that do not exist in the PWA, and no mobile beat waits on them. All three entries
declare `surfaces: ['bar']`; the full-scale generator is dynamically imported, so it is not in the PWA's
static import closure. The PWA gets the Synthetic data badge on the More card (work item 15) and the
diagnostics redaction (work item 12). Confirm `pwaPurity.test.ts` stays green and that Phase 44's parity
audit lists this phase as "no PWA stand-in required".

## Out of scope

- Real performance or load testing, real virtualisation libraries, server-side paging or IndexedDB
  persistence. The full-scale set is an in-memory demonstration; US-15.0.4's formal performance testing
  belongs to the Testing milestone.
- Saving the full-scale data, or loading it in the PWA.
- Paging or scale work on screens the requirement does not name, beyond the safety caps in work item 6
  (the Review queue is timed and indexed but not paged; Billing monitor and web Accounts stay as they are;
  the 71 generated anaesthetists have no mobile or web persona).
- The dead-letter queue and its raw HL7 view (US-14.5.1, Future). The Future-scope HL7/FHIR simulator keeps
  showing its raw messages, because it plays the hospital's side and carries its Future-scope badge; the
  Future-scope message log's patient name on failed rows is left for Phase 44's handoff.
- Removing the NHI from the audit trail or the patient record: both are core platform (US-15.0.6 allows the
  NHI inside the clinical and ledger systems).
- Hosting, backups, disaster recovery, penetration testing, environments and the AI-tools statement from
  EP-15's technical discussion: presenter talk-track only.
- Real authentication or role management: the office-only rule is the store guard, as everywhere else.
- Catalogue screenshots beyond the "Catalogue screenshots" step below (the covered items and the recipes this phase breaks); `US-15.0.6`'s two Xero captures stay valid.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. The harness bar, the web top nav, the admin side nav and the mobile More card each show
      "Synthetic data only" with its tooltip; crimson and teal are unchanged around them.
- [ ] Admin Day on Tue 21 Jul at demo scale: no pager, the footer shows real counts and no "narrated"
      sentence; Demo actions lists "Load full-scale data".
- [ ] Load full-scale data (with its confirm): the banner shows "Generating", then the counts (85
      anaesthetists, at least 20,000 Slots in the horizon, invoices between 27,500 and 28,500) and the
      generation time; the Data Inspector says saving is paused.
- [ ] Admin Day at scale: 85 anaesthetists in 3 pages of 30; the header summary counts all 85; filters
      and A to Z sort apply before paging; changing the date returns to page 1; Dr Souter's Tue 21 AM and PM
      Lists look exactly as at demo scale.
- [ ] Invoices at scale: "Showing 1 to 50 of" about 28,000; next, last and first work; searching an
      `AA-S-` number finds it; opening it shows a correct invoice with its ledger and Xero state.
- [ ] Review queue at scale: the practice-sized backlog of submitted Lists (the 71's last two working
      days plus the cast's), responsive, its timing in the banner table; Dr Souter's Lists appear as at
      demo scale.
- [ ] Audit at scale: pages of 100 over tens of thousands of entries; filtering by entity type and source
      resets the page; the newest entry is "Full-scale data loaded".
- [ ] The banner's Timings table shows Day view, Invoices and Audit at demo scale and at full scale; no
      full-scale figure is more than a few times its demo-scale figure, and none is above about 200 ms on
      the presenter laptop (record the numbers).
- [ ] Ledger screen at scale is in balance and pages; Xero sim tables show "Showing 200 of N"; the Xero and
      archiving line counts real contacts.
- [ ] At scale, Next day works (170 new Slots, poll and archive run) and S3 still runs on Dr Souter's Mon 20
      Lists (authorise, invoice, payment).
- [ ] Reload the page at scale: the app comes back on the pristine demo seed, saving active. Load again,
      then Reset: the pristine seed, the banner gone, saving active (the Data Inspector size updates after
      a mutation).
- [ ] Matching: select an unmatched row. The row detail says only the needed fields are shown. "View raw
      row" asks for a reason; with one, the sheet shows the masked columns (NHI as "ZAA••••" style, DOB as
      a year) and the provisional masking line; closing and reopening asks again; the panel counts the
      views; the Audit viewer shows "Raw row viewed" with the reason and no values.
- [ ] Demo actions, "View raw row as another role", As Dr Melanie Souter: refused with the reason; the audit
      shows the denied attempt; no payload appears. On a decided row the entry is disabled with its reason.
- [ ] Data Inspector, Scan for NHI leaks, Scan now: every leak area reports 0 found, the core-platform rows
      read "Held by design". Scan with a planted test leak: exactly one hit in "Diagnostic log (planted test
      line)", shown masked. Run the scan again at full scale: 0 found, with the scan time shown.
- [ ] No new app copy contains an en or em dash; teal is the only action colour; figures, ids and timings
      are mono with tabular-nums.
- [ ] Catalogue screenshots: the recipes for US-15.0.4 and US-15.0.6 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` green.

## Demo guide updates

Patch in the same session, in `docs/demo-guide/` and the matching sections of `master-demo-guide.html`
(read the text as Phases 34 to 42 left it):

- `03-demo-script.md`:
  - **"What to narrate rather than click":** remove the first two bullets (the four-month scale and 85
    anaesthetists; the 28,000 annual invoices and Xero contact volume). They are now clickable.
  - **New optional aside "Full scale"** after S2 (Phase 44 folds it into the rewrite). Click: Admin, Day
    view, Demo actions, Load full-scale data, Confirm; page the Day view; open Invoices and Audit; open the
    banner's Timings. Say: "This is the whole practice: 85 anaesthetists, twenty thousand Slots across
    four months and a year of invoices, built in the browser from the same seed. Each screen shows its
    render time at demo size and at this size." Expected: the figures as the banner shows them (take them
    from the running app). Close with Reset.
  - **S5 Beat 3 (no NHI in Xero)** gains a step: Data Inspector, Demo actions, Scan for NHI leaks, Scan
    now, then the planted-leak choice. Say: "We do not just avoid sending the NHI to Xero; we check the
    Xero records, the diagnostic log, error messages and failure reasons for anything that looks like an
    NHI." Expected: zero in every area, one planted hit.
  - **New S5 beat "Restricted raw data"** (or an aside if S5 is full): Admin, Intake, Matching, an unmatched
    row, View raw row with a reason, then Demo actions, View raw row as another role. Say: "The office sees
    what it needs to fix the row. The rest of what the hospital sent is restricted, masked and every view is
    recorded with a reason." Expected: the masked sheet, the audit entries, the refusal.
  - **Pre-demo setup:** point at the Synthetic data badge in the bar.
- `04-presenter-cheat-sheet.md`: "Is the demo using real patient or integration data?" answers with the
  badge; add "Can it handle 85 anaesthetists and 28,000 invoices a year?" (Load full-scale data and the
  timings, with the honest caveat that formal performance testing is a Testing-milestone task); "Present
  but honestly demo-only" gains Load full-scale data, Scan for NHI leaks and View raw row as another role;
  a strong phrase "The NHI never leaves the core platform, and we check it."
- `02-workflows-and-handoffs.md`: in the intake workflow, one line that the raw hospital row is held under
  restricted access and each view is audited.
- `master-demo-guide.html`: the same passages.
- Control Panel scenario text: the S5 message, if it lists its beats, names the scan and the raw row.

Not a milestone phase; no full consistency read is required, but re-read every passage touched against the
running app.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 43` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-15.0.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.4.md) Volumes | absent (not demonstrated; scale only narrated in copy) | partial. Create real shots, then change the reason to: full-scale volumes are generated in memory and timed on screen; formal performance testing belongs to the Testing milestone and is not part of the prototype. Admin shots: `full-scale-day` (`/admin/day/2026-07-21`; setup runs the `load-full-scale` entry from `[data-shot=demo-actions]` and its confirm, then waits for the scale banner; states `banner` showing the 85 anaesthetists, 20,000+ Slots and 27,500 to 28,500 invoices with generation time and the Timings table, and `paged` showing "3 pages of 30"), `full-scale-invoices` (`/admin/invoices`, "Showing 1 to 50 of" about 28,000) and `full-scale-audit` (pages of 100, newest entry "Full-scale data loaded"). Highlight the banner and the pager. Caption: "Demonstration at full practice volume with measured screen timings". Replaces the stale "scale is only narrated" reason |
| [US-15.0.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.6.md) Privacy and data minimisation | captured · xero-contacts and xero-pair (simulator, Xero sim) | stays captured; the two Xero shots stay valid. Add admin shots `raw-row` (Matching, an unmatched row: row detail with only needed fields, then View raw row asks for a reason and shows the masked columns, NHI as "ZAA••••" style and DOB as a year, with the provisional masking line; highlight the sheet), `leak-scan` (Data Inspector `/demo/data`, Privacy checks after Scan now: 0 found outside the core platform, core rows "Held by design"; second state with the planted test leak, one masked hit) and `synthetic-badge` (the "Synthetic data only" marker in the admin side nav, plus a mobile shot of the More card on `/mobile` showing it). Caption: "NHI stays inside the core platform and non-production holds synthetic data only" |

**Recipes this phase breaks.**

- The "Synthetic data only" badge is added to the web top nav, the admin side nav and the mobile More card, so nearly every web, admin and mobile image changes by a few pixels. The full `npm run capture` rewrites them; that is expected, not breakage. Check that no highlight box now overlaps the badge.
- `US-15.0.4.json` quotes the narrated paging sentence on the Day grid and the Xero simulation; it is rewritten above. Recipes that highlight Admin Day (`US-15.0.1`, `US-13.1.1`, `US-13.1.2` and the many `/admin/day/` recipes) must still resolve with the paging footer; at demo scale there is no pager, so no change expected.
- `US-13.5.1.json`, `US-07.2.1.json` and `US-07.3.2.json` start on the Data Inspector (`/demo/data`), which gains a Privacy checks panel; `US-02.5.5.json` and `US-13.5.2.json` open the Audit viewer, whose 500-row cap becomes pages of 100. Re-check their highlights with `--dry`.
- The matching screen's row detail changes (only mapped fields, View raw row); no recipe was found using `/admin/intake/matching`, but the `--dry` run is the check.

**ATLAS.md.** Update "Routes" (the Data Inspector's Privacy checks, Matching raw row), "Overlays that need clicks" (the confirm step for Load full-scale data, the raw-row reason prompt and sheet), "Gotchas" (the Synthetic data badge sits in every shell; full-scale generation takes a moment, so wait for the banner; the loaded set lives in memory and is lost on `goto`) and "Existing hooks" (the scale banner, the pager, the badge and the scan panel).

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npm run build:pwa` / `npx vitest run` /
`npm run shots` are green, and before writing the PROGRESS entry, run the standard adversarial
review-and-fix pass (PROGRESS convention 18): fan out independent Opus review subagents for
**quality**, **bugs/correctness** and **plan adherence**, plus a fourth on **privacy and determinism**
(this phase's two risks). This session then verifies every finding against the catalogue and the code,
fixes the confirmed ones with a test where a bug had none, re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log.

**Steer this phase's reviewers at:**
- Determinism: the generator uses only `slotRng` streams off `SEED` and the demo clock; no `Date.now()`,
  `new Date()` or `Math.random()`; `performance.now()` appears only in `store/scaleMode.ts` and
  `shared/scale/` and never feeds data; two builds are identical; timing samples never enter `AppState`.
- The seed survives: every seeded record is unchanged at full scale; S1 to S5 still run at scale; Dr
  Souter's web and mobile figures do not move; no id or invoice number collides; the next runtime id is
  unused.
- Integrity at scale: generated history went through the same pure builders as the billing run and the
  ledger (no parallel pricing code), every ledger pair balances, the Ledger screen shows in balance, the
  Xero mirror matches the ledger, archiving follows the real rule.
- Persistence: while paused nothing is serialised, not just not written; the pause is independent of the
  error latch; Reset resumes before it installs; a reload after loading returns the pristine seed; the PWA's
  storage path is unchanged.
- Performance honesty: timings measure what they say (render and commit, then paint), samples are per mode,
  the banner's figures come from the data and the constants block, the indexes are rebuilt when their map
  changes and never serve stale rows after a mutation; the archive rule and the poll are linear, not
  quadratic, and Next day at full scale stays well under a second; the generator is not reachable by a
  static import from the main entry.
- Paging correctness: filters and search before paging, page reset on change, edge pages, the Day view's
  summary counting all rows, no pager at demo scale, `?page=` a replaceable view preference.
- Privacy: the raw payload never reaches the audit, the diagnostics buffer, the scan report or any
  refusal message; masking covers every fixture column that could identify a patient; a non-office attempt
  is refused and audited once; the detector's shapes and check digits match `validateNhi` for both formats;
  every scan area is actually wired (the injected-leak test); no `console.` outside `diagnostics.ts`.
- Triggers: the three entries show only on their screens, `surfaces: ['bar']`, disabled states work, bodies
  in `src/store` / `src/shared`, the generator is dynamically imported, `pwaPurity.test.ts` green, every
  audit code has a label.
- Design and copy: the Synthetic data badge is neutral (not crimson, not teal, not the demo warning tint),
  the banner is harness chrome, teal-only actions, semantic tints for scan results, mono figures, no en or
  em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- A catch-up status row for Phase 43 and an entry `### Catch-up Phase 43 · Scale and privacy (date)`: the
  drift-check result (including OQ-30's state), the shipped names used from Phases 28, 33 to 37 and 42, the
  baseline and full-scale timings for each screen, the generated counts, the generation time in Node and in
  the browser, the checklist item by item, test counts, and the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `capture/REPORT.md` counts before and after (captured, partial, absent, failed), the recipes this phase broke and how they were re-pointed, and any partial reason handed to a later phase.
- **Decisions log:**
  - "Full-scale data is an in-memory demonstration built on the pristine seed; saving pauses and nothing is
    serialised until Reset" (US-15.0.4). The 14 demo anaesthetists are untouched and the 71 generated ones
    carry the volume; generated invoice numbers use a reserved series; the narrated `volumeStory` figures
    become counted only while the set is loaded.
  - "Admin Day, Invoices and Audit page" (page sizes 30, 50 and 100). Replaces the Day grid's narrated
    paging sentence and the Audit viewer's 500-row cap.
  - "Hospital rows keep their raw payload under restricted access: office only, reason required, every view
    audited, masked by a provisional policy" (US-15.0.6, applying US-14.5.1's rule to the in-scope failure
    surface). The harness entry exercises the refusal; the office view is a product action.
  - "Diagnostics are redacted and refusals are recorded, so the NHI leak scan covers logs and error
    messages"; `xeroNhi.test.ts` becomes part of the scan's test.
  - "Synthetic data only is an environment marker in neutral styling, not a demo badge."
- **Handoff notes:** the Future-scope message log still shows the patient name on failed rows (US-14.5.1 is
  Future); US-15.0.4's formal performance testing belongs to the Testing milestone;
  `requirements-board/capture/recipes/US-15.0.4.json` was `absent` with a reason that said scale is only
  narrated; this phase's Catalogue screenshots step rewrites it (the Load full-scale data banner and the
  paged Day view); Phase 44's parity audit:
  no PWA stand-in required for this phase; the new optional "Full scale" aside and S5 beats for Phase 44's
  rewrite.
