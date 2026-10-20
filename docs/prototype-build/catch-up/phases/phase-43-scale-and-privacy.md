# Phase 43 · Scale and privacy

**Requirements covered:**
[US-15.0.4](../../../../requirements-board/requirements/stories/US-15.0.4.md)
Volumes (Proposed: about 85 anaesthetists, 20,000 Slot records within the scheduling horizon, currently
four months and a setting that can change, and 28,000 invoices a year, without any drop in performance) ·
[US-15.0.6](../../../../requirements-board/requirements/stories/US-15.0.6.md)
Privacy and data minimisation (Proposed: the NHI stays in the clinical and ledger systems and is never
sent to Xero or any other finance platform, in any field; it never leaks through logs, error messages,
monitoring or non-production data; failed hospital data shows only what is needed, with the raw payload
under restricted access; non-production holds synthetic data only).
Both are still Partial. At `d4db277` only their wording moved (the horizon is a setting; the NHI is "never
sent to Xero or any other finance platform, in any field", Greg: "It could be more explicit than that").
What changed a lot is the model the generator builds (work item 2).
Exercised at scale, owned by Phase 37:
[US-13.3.1](../../../../requirements-board/requirements/stories/US-13.3.1.md)
(processing monitor: "This list will get quite large"; Phase 37's grouped, sortable, filterable monitor
with Problems only and "Open in Review"). This phase loads that large list and makes the monitor hold up
at full scale (work item 6).
Context only, must stay green:
[FT-01.1](../../../../requirements-board/requirements/stories/FT-01.1.md)
(the rolling canvas the Slot count is measured against; any number of months, Phase 28's horizon setting),
[US-09.3.1](../../../../requirements-board/requirements/stories/US-09.3.1.md)
(Xero contacts identified by the hidden internal ID, never the NHI; no patient names or other personal
information in Xero, Phase 16),
[US-09.3.3](../../../../requirements-board/requirements/stories/US-09.3.3.md)
(scheduled archiving, which cites the 28,000 invoices),
[US-11.1.1](../../../../requirements-board/requirements/stories/US-11.1.1.md)
(patient record keyed on NHI) with [OQ-49](../../../../requirements-board/requirements/questions/OQ-49.md)
(**Answered**: the NHI is mandatory, a Booking cannot be saved without one; an incoming row without one
waits at intake; no "NHI pending" or provisional patient, so every generated patient carries a valid NHI
and none is generated pending),
[US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md)
(the unmatched queue, Phase 33, where the restricted raw-row view lives),
[US-13.5.1](../../../../requirements-board/requirements/stories/US-13.5.1.md)
(role-based access, **Confirmed**; signing in is US-13.5.3, Phase 43a) and
[US-13.5.2](../../../../requirements-board/requirements/stories/US-13.5.2.md)
(audit trail, **Confirmed**: it names invoices and credit notes; payments and disbursements left it
because "it's done in Xero").
[US-14.5.1](../../../../requirements-board/requirements/stories/US-14.5.1.md)
(integration failure visibility, the dead-lettered HL7 case) is **Future** and is not built: its
"working view shows only what is needed, raw payload behind restricted access" rule is applied here to
the in-scope failure surface, the unmatched hospital rows.
No DM or RV item is owned here. The generator produces the shapes of
[DM-02](../analysis/domain-model-delta.md#dm-02) (Slots, Phase 28),
[DM-52](../analysis/domain-model-delta.md#dm-52) (List states, 15b and 31),
[DM-53](../analysis/domain-model-delta.md#dm-53) (recurring bookings, 30),
[DM-54](../analysis/domain-model-delta.md#dm-54) (tiers and private preferences, 17),
[DM-48](../analysis/domain-model-delta.md#dm-48) and [DM-49](../analysis/domain-model-delta.md#dm-49)
(contract holders with settings and the one No contract (RVG), 18),
[DM-10](../analysis/domain-model-delta.md#dm-10) (one Contract per Procedure, 20),
[DM-51](../analysis/domain-model-delta.md#dm-51) (descriptions as received, 20a),
[DM-08](../analysis/domain-model-delta.md#dm-08) (the pricing snapshot, 25),
[DM-22](../analysis/domain-model-delta.md#dm-22) (the ledger, 36) and
[DM-34](../analysis/domain-model-delta.md#dm-34) (import rows, 33). Re-read each in
[domain-model-delta.md](../analysis/domain-model-delta.md) as it now stands; no
[reverse-check](../analysis/reverse-check.md) finding is closed here.
Answered question this phase builds:
[OQ-30](../../../../requirements-board/requirements/questions/OQ-30.md) (**Answered**: "No PII in Xero.
So Xero doesn't have NHI details. Xero will have an unique ID which allows transactions to link back to
invoices in our system."). The leak scan's Xero area checks for the NHI **and** the other personal
information Phase 16 keeps out of Xero (work item 13).
**Owner decisions** ([ROADMAP.md](../ROADMAP.md) table, re-read at `d4db277`). None gates this phase;
the generator follows what the decisions produced, as the earlier phases built it: D1 (the monthly
AA-FEE invoice, 16); D11 (NHI mandatory, 33, 40); D26 (one RVG multi-procedure rule, no switch, 23); D32
(a Contract may hold no lines, 18, 19a, 20); D33 (no procedure to match, the RVG code optional, 20, 21);
D38 and D64 (prepaid is a Contract setting; the prepayment pair at admin approval, payable to the prepay
holding account, a second pair at authorisation, 27, 27a); D39 (the RVG groups are the one master list,
19); D40 and D50 (no time band, the per-Contract editable flag, 19a, 24); D42 (the office keeps the
anaesthetists' price lists, 19a); D43 (P1 included, pre-applied and removable, 19b); D44 (preferences
admin-only, 17); D45 (versions never backdated, 18, 25). Superseded and not built: D2, D3, D6, D12, D16,
D17, D20, D37 (curated procedure lists and general procedures, price precedence, first-party prepaid
sets, "no per-Booking override"). Open defaults the generated set inherits, never re-decided here: D28
(insurance indication set to match the chosen Contract), D29 (age on the procedure date), D35 (the RVG
group's starting figure; no generated base units out of range), D36 (tier names).
**Depends on:** Phase 42 (every master editable and the controlled loader, so the generator reads the
final master shapes), Phase 37 (the processing monitor, `billingMonitorView`, and the Xero sync queue the
scan reads), Phase 36 (the ledger pair as the system of record, which the generated history must follow)
and Phase 34 (the Intake home, the Future-scope HL7/FHIR surface). Through them 14 to 33, 38 to 41:
the shipped names are read from their PROGRESS entries (Before you start, item 4).
**Estimated:** 2 sessions. The generator alone (71 anaesthetists, a year of billed history built
through the one billing module in the 2026-10-20 shapes, the Xero mirror and audit, with its integrity
tests) is a full session's work. **Session 1** is work items 1 to 3 (paused persistence, the full-scale
generator and its integrity tests, installing and leaving full scale) plus the `load-full-scale` entry so
the set loads in the running app, stopped green. **Session 2** is work items 4 to 15 (the indexes, the
paged screens and the monitor, the timings, the counted narration, then the privacy half), the other two
triggers and their tests, the demo guide, the catalogue screenshot step and the review pass.

## Goal

Two claims the prototype has so far only narrated become things a presenter can click.

- **Scale.** A "Load full-scale data" demo action replaces the demo data with a full-practice dataset
  built in memory from the seeded RNG: 85 anaesthetists (the 14 demo anaesthetists plus 71 synthetic
  ones), about 20,000 Slots across the scheduling horizon setting (four months by default and a setting
  that can change; the app says "sessions", never "slot"), and about 28,000 invoices raised over the last
  12 months, each with its Booking, pricing snapshot, ledger pair and Xero mirror. The set is generated
  in the 2026-10-20 model, exactly as the app holds it: standing patterns as recurring bookings; Lists in
  the states ACTIVE, SUBMITTED, AUTHORISED and DRAFT (Draft Lists only); RVG groups with no procedure
  list, so a Procedure carries its description as received and an optional RVG code; contract holders
  with settings (billed or not, prepaid) and Contracts with or without standalone lines; exactly one
  Contract per Procedure by Phase 20's rules (No contract (RVG), or a Contract whose holder fits the
  Booking; no hospital, insurer or procedure default); a payer and a patient with a valid NHI on every
  Booking; the price, rate and discount held on the Procedure; modifiers as records (age and P1
  pre-applied); and a practice-sized handful of prepaid Bookings on prepaid Contracts, with the prepay
  holding account's pairs. It is built **through the one billing module** in
  `aa-prototype/src/domain/billing` (plus the seed's builders), the same structures, resolver and
  snapshot builder the app uses, never a second copy of the shapes: the technical design
  ([AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) v6,
  [AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md)) is Greg's proposal and may
  change again, and a change there must stay a contained edit that this generator picks up for free. The
  14 demo anaesthetists' records are untouched, so S1 to S5 still run at scale and Dr Souter's figures do
  not move. localStorage cannot hold it, so saving pauses with a clear banner; nothing is written, not
  even serialised, until Reset. A banner shows generation and render timings, and each paged screen
  records its render time at demo scale and at full scale side by side, so "no drop in performance" is
  shown, not claimed. Admin Day, Invoices, Audit and Phase 37's processing monitor (US-13.3.1: "will get
  quite large") page, sort and filter at that scale (the Day view gets the "1 of 3" pager its footer has
  so far only described; the monitor's anaesthetist groups page, with its sort, anaesthetist filter and
  Problems only applied first). Reset, a scenario jump or a reload returns to the normal seed.
- **Privacy.** Three things make the NHI policy visible and checkable:
  - a restricted **View raw row** on the matching screen: the working view shows only the fields the
    office needs to resolve a row (including a row waiting for its NHI); everything else the hospital
    sent sits behind an office-only view that asks for a reason, writes an audit entry and shows the
    payload with identifiers masked. A Demo actions entry shows the same request refused, and audited,
    for another role;
  - a **Scan for NHI leaks** demo action on the Data Inspector that searches the Xero slice (including
    the sync queue) for any NHI or other personal information (OQ-30: "No PII in Xero"; US-15.0.6: never
    sent in any field), and the diagnostic log, error and refusal messages and failure reasons (the
    monitor's included) for any NHI, known or merely valid-looking, and reports zero hits per area, with a
    "planted leak" choice that proves the scan finds one;
  - a **Synthetic data only** badge in the harness bar and in the Anaesthetist Web and Admin apps,
    matching the statement the mobile More tab already makes.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `d4db277` (rename-aware; never
   a plain `git diff` of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-15.0.4,US-15.0.6,US-13.3.1,FT-01.1,US-09.3.1,US-09.3.3,US-11.1.1,US-02.1.4,US-13.5.1,US-13.5.2,US-14.5.1,OQ-30,OQ-49
   ```

   Read the hunks (if any), and the domain-model lines on Slots, the horizon, the List states,
   recurring bookings, contract holders, Contracts and lines, No contract (RVG), the payer on the
   Booking, the NHI and the patient record.

   At plan time (`60e2d1e..d4db277`) the covered items moved only in wording: US-15.0.4 names the
   horizon as a setting (currently four months), US-15.0.6 says the NHI is never sent to Xero "in any
   field". What changed is the model the generator builds (change logs of 2026-10-16 to 2026-10-20 and
   the v6 technical design): RVG groups with no procedure list; contract holders with settings and
   Contracts with or without standalone lines; one Contract per Procedure; the price, rate and discount
   held on the Procedure; modifiers as records with age and P1 pre-applied and removable; a payer and a
   mandatory NHI on every Booking (OQ-49 answered); prepaid as a Contract setting with the prepay holding
   account. Work item 2 already reflects all of this; diff only for anything after `d4db277`.
2. If an item changed since `d4db277`, re-read it in full and adjust the work items before building. If
   an item is now Retired or Future, drop its work and say so in the PROGRESS entry:
   - **US-15.0.4** Retired or Future: drop work items 1 to 9. If its figures changed (anaesthetists,
     Slots, invoices per year), change the one `FULL_SCALE` constants block (work item 2) and every copy
     line that quotes a figure; nothing else hard-codes them.
   - **US-15.0.6** Retired or Future: drop items 10 to 15. If its technical discussion drops the
     restricted raw payload, drop items 10 to 12; if it drops logs and telemetry, drop item 13's
     diagnostics log but keep the Xero area of the scan (US-09.3.1 and OQ-30 still require it).
   - **US-13.3.1** settles its Notes differently: follow what Phase 37 shipped; this phase only makes
     that view hold up at scale and never adds a second authorise path.
   - **US-14.5.1** moved out of Future into scope: record it for Phase 44's handoff and apply work item
     11's restricted view to it only if the session has room.
   - **A model item changed after `d4db277`**: the earlier phase that built it owns the change; the
     generator follows what shipped, because it builds through the same module. Change nothing here
     except the integrity test that names the rule.
3. **Open questions.** None blocks this phase. OQ-30 and OQ-49 are answered and built as answered. The
   masking policy for the raw row (which fields are masked and how) is not in the catalogue and no open
   question asks it: build the policy in work item 10 as one labelled block, show "Masking policy is for
   AA to agree" in the sheet, and put it on the "For the owner's review" list.
4. **Confirm the base.** This is the last build phase before 44, so read the earlier phases' PROGRESS
   entries and use the names they actually shipped, never the plan-time names. Where to look:
   - Phase 28 to 32: the Slot record and id, `schedule.slots`, the canvas generator and `CanvasMasters`,
     the horizon setting (`appSettings.schedule.horizonMonths`, `scheduleHorizon(state)`,
     `setHorizonMonths`), the status master, Draft Lists, the notification pool; Phase 30
     `RecurringBooking` and its projection (`rollCanvasForward`); Phase 15a `evaluateWarnings`,
     `openWarnings`, `warningSummaryByList`.
   - **The 2026-10-20 model, as Phases 15 to 27a shipped it.** The generator calls these, never copies
     them, and imports them from `aa-prototype/src/domain/billing` and nowhere else: the Booking, the
     List and `ListState` (15, 15b, 31); tiers and private preferences (17, `store/officePrivate.ts`);
     contract holders with settings (billed, billable party, prepaid), the one No contract (RVG) and
     Contracts as dated versions (18); RVG groups as one master list and the optional RVG code (19);
     standalone Contract lines, starting values filled onto the Procedure from the line or the group, and
     the anaesthetists' price-list Contracts (19a); the modifier master and modifier records with age
     and P1 pre-applied (19b); the candidate rule for a Procedure's Contract (20); descriptions as
     received and the invoice description (20a); the payer on the Booking and the one "who is billed"
     function (21); the primary Procedure (23); the price, rate and discount held on the Procedure and
     their pure calculation (24); the pricing snapshot at authorise and the builders that invoice from it
     (25); the anaesthetist profile (26); the prepayment lifecycle and the prepay holding account with its
     second pair at authorisation (27, 27a).
   - Phase 16 (monthly AA-FEE invoice, the one BCTI count function, the Xero contact label helper, the Xero
     privacy scan in `xeroNhi.test.ts`); Phase 36 (`billing.ledger`, `LedgerPair`, builders, the Ledger
     screen and its imbalance indicator); Phase 37 (`billing.xeroQueue`, the pure `billingMonitorView`, its
     URL params, `MONITOR_EXPAND_ALL_UP_TO` and its handoff note on scale); Phases 38b, 39, 39a, 39b, 41
     (event, credit-note, payment-run and prepayment-letter shapes: the history may leave them sparse but
     must not break them); Phase 40 (the patient record and Admin · Patients, NHI mandatory).
   - Phase 33 and 34: `ImportRow`, `IncomingBookingFields`, the sample fixtures, `stageImportRows`,
     `importRowViews`, the derived unmatched state and its reasons (including a row waiting for an
     NHI), the context key `matching.selectedRowId` and the matching route. Whether rows are seeded on
     load decides whether the `PERSIST_VERSION` bump in work item 10 also reseeds rows.
   - Phase 42: the master shapes and whether its loader keeps rejected rows with their values (the scan
     then covers its row-validation messages).
   - Phase 14: `DemoTrigger` in `shared/demoTriggers/types.ts` (`routes`, `surfaces`, `badge`, `when`,
     `choices`, a synchronous `run`, `indexPath`; no confirm step unless a later phase added one), the
     registry, `memory.ts`, `store/demoActors.ts`, the pinned per-screen counts in `demoTriggers.test.ts`,
     `pwaPurity.test.ts`.
   - Note the current `PERSIST_VERSION`.
5. **Measure first.** Before writing the generator, time today's Admin Day, Invoices, Audit and
   processing monitor screens on the pristine seed (work item 7's hook can be added first) so the "demo
   scale" column of the timing table has a real baseline. Record the numbers in the PROGRESS entry.
6. Record the result (changed items, the shipped names used, the baseline timings) in the PROGRESS
   entry.

## Reference

**Design (convention 17).** No mockup covers a pager, the scale banner, the raw-row sheet, the scan
report or an environment badge, so extend existing patterns; do not invent a new visual language.
- [Design Language.dc.html](../../../design/Design%20Language.dc.html): teal `#0D6E63` only for the
  actions this phase adds ("View raw row", the pager's current-page state, Search); semantic warning
  tint `#F9F0DC` / on-tint `#7C4D08` for the "Saving paused" banner and the masking-policy line;
  success tint `#E3F4EB` / on-tint `#157A49` for a zero-hit scan area; error tint `#FAE9E7` / on-tint
  `#9C332F` only for a scan area with hits; neutrals (ink, slate, mist, line) for the Synthetic data
  badge, which is an environment marker, not an action, a status or identity; pills at radius 999;
  Spline Sans Mono with tabular-nums for every count, timing, id, page number and masked value; card
  radius 14, sheet anatomy as the existing admin side sheets; crimson nowhere new. The six schedule
  status colours are never reused for scale or privacy states.
- [Admin Day.dc.html](../../../design/Admin%20Day.dc.html): the day grid, its header summary line and
  footer; the pager sits in the footer strip, in the footer's type and colour.
- [Admin Review.dc.html](../../../design/Admin%20Review.dc.html): table, stats strip and side-sheet
  anatomy for the Invoices, Audit and Billing monitor pagers and the raw-row sheet.
- [Web Dashboard.dc.html](../../../design/Web%20Dashboard.dc.html): the web top nav where the badge sits
  beside the persona.

**Catalogue.** The two covered stories are short: US-15.0.4 is one sentence plus a note that performance
testing is a Testing-milestone task; US-15.0.6's technical discussion carries the three constraints
(logs and telemetry, failed message handling, non-production environments). US-14.5.1 states the
restricted raw-payload rule in the dead-letter setting. US-13.3.1's body and Notes say why the monitor
must hold up at volume; OQ-30's answer ("No PII in Xero") sets the Xero area of the scan.

**Pricing model (the shapes the generator builds through, never re-implements).** The plain-language
guide [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) (read
[How a procedure is priced](../../../../requirements-board/requirements/artifacts/AR-28.md#how-a-procedure-is-priced),
[No contract (RVG)](../../../../requirements-board/requirements/artifacts/AR-28.md#no-contract-rvg),
[Who gets the invoice](../../../../requirements-board/requirements/artifacts/AR-28.md#who-gets-the-invoice),
[Booking to invoice](../../../../requirements-board/requirements/artifacts/AR-28.md#booking-to-invoice) and
[Prepayment](../../../../requirements-board/requirements/artifacts/AR-28.md#prepayment)) and the technical
design v6 [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) with its ERD
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) are the reference shape; v6 is
Greg's proposal and may change again. The generator touches
[Data model](../../../../requirements-board/requirements/artifacts/AR-29.md#data-model),
[Booking procedure fields](../../../../requirements-board/requirements/artifacts/AR-29.md#booking-procedure-fields),
[Contract selection](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-selection),
[The resolver](../../../../requirements-board/requirements/artifacts/AR-29.md#resolver),
[Pricing snapshot](../../../../requirements-board/requirements/artifacts/AR-29.md#pricing-snapshot),
[Billable party](../../../../requirements-board/requirements/artifacts/AR-29.md#billable-party),
[Prepayment](../../../../requirements-board/requirements/artifacts/AR-29.md#prepayment),
[Contract versions](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-versions) and
[Integrity rules](../../../../requirements-board/requirements/artifacts/AR-29.md#integrity-rules) (the
integrity tests in work item 2 check the generated set against them), and the AR-30 entities
[RVG group](../../../../requirements-board/requirements/artifacts/AR-30.md#rvg-group),
[Contract holder](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-holder),
[Contract](../../../../requirements-board/requirements/artifacts/AR-30.md#contract),
[Contract line](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-line) and
[Booking procedure](../../../../requirements-board/requirements/artifacts/AR-30.md#booking-procedure).
Modifiers come from the master Phase 19b seeded from
[AR-34](../../../../requirements-board/requirements/artifacts/AR-34.md), never re-transcribed.
Descriptions as received come from the pool Phase 20a seeded from
[AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md), never typed again here.

**Analysis.**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): "Demo-trigger buttons" (the Oversight/NFR cluster: Load
  full-scale data, Scan for NHI leaks) and the EP-15 table and header note; per-gap detail in
  [epics/EP-15.md](../epics/EP-15.md) (sections US-15.0.4 and US-15.0.6) and the US-13.3.1 section of
  [epics/EP-13.md](../epics/EP-13.md).
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) sections 1 (store
  core and persistence), 7 (seed) and 10;
  [prototype-map-admin.md](../analysis/prototype-map-admin.md) sections 3 (Day view), 6 (Invoices), 7
  (Billing monitor) and 10 (Audit viewer);
  [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) sections 2 (harness
  bar), 4 (Reset), 5.4 (Data Inspector), 7 (PWA) and 9 (extension points).

**Code entry points** (paths under `aa-prototype/src/`, names as read on 2026-10-08 and since
moved by the 2026-10-20 plan; re-read them against the PROGRESS entries of Phases 14 to 42):
- Persistence: `store/persistStorage.ts` (`resilientLocalStorage`, `flushPersist`, `persistStatus`,
  `bytes`, `STORAGE_BUDGET_BYTES`; the header explains why every mutation re-serialises the whole store);
  `store/appStore.ts` (`createAppStore`, the `persist` options with `createJSONStorage`, `PERSIST_KEY`,
  `PERSIST_VERSION`, `freshAppState`, `backfillMerge`).
- Reset: `store/mutate.ts` `resetDomainState` (the one permitted wholesale replace; the
  `storeDiscipline` test in `mutate.test.ts` keeps raw `setState` there), `store/clockActions.ts`
  `resetDemo`, `rollCanvasForward`, `applyClock`; `shell/DemoResetButton.tsx`; the PWA reset in
  `pwa/PwaDemoPanel.tsx` (removes `PERSIST_KEY`, then `resetDemo`).
- Seed and generators: `domain/seed/index.ts` (`SEED`, `buildSeed`, `volumeStory` at ~461),
  `domain/seed/canvas.ts` (Phase 28's generator), `domain/seed/slotHash.ts` (`slotRng`,
  `hashStringToSeed`), `domain/seed/patients.ts` (`buildPatients`, the `FIRST_NAMES` and `SURNAMES`
  pools), `domain/nhi.ts` (`validateNhi`, `generateNhi(format, rng)`), `domain/seed/history.ts`
  (`buildHistory`, the backdrop pattern), `domain/clock.ts` (`horizonFor`, `enumerateDatesISO`,
  `DEMO_TODAY`); the scale test in `store/canvasRoll.test.ts` (~197 to 235: 85 anaesthetists by the
  full horizon in under 2 s), which is the proof this phase turns into a UI. The seed's permanent lists,
  Contracts and RVG codes (`domain/seed/permanentLists.ts`, `contracts.ts`, `rvgCodes.ts` at plan time) are
  rebuilt by Phases 18 to 19b and 30; `domain/billing/` is the one module Phases 18 to 27a grow and the
  generator builds through.
- Admin screens: `apps/admin/AdminApp.tsx` (the day derivations `dayLists`, `listsByAnaesthetist`,
  the review and badge counts), `apps/admin/components/DayGrid.tsx` (the footer sentence at ~241 "At
  production scale (~85) this view pages and virtualises ... narrated here, not simulated"),
  `apps/admin/screens/InvoicesScreen.tsx` (renders every non-backdrop invoice today),
  `apps/admin/screens/AuditViewer.tsx` (`CAP = 500`, `sortAuditNewestFirst` on every filter change),
  `apps/admin/screens/MasterData.tsx` (~543, the "Scale (narrated, not simulated)" line under the
  Nightly contact-archive job), the Phase 36 Ledger screen, and
  `store/selectors.ts` (`entityCounts` ~874, `billingAttentionCount`, `submittedListCount`,
  `billingMonitor`); `apps/admin/screens/BillingMonitorScreen.tsx` and Phase 37's pure
  `store/billingMonitorView.ts`; `store/warnings.ts` (`openWarnings`, `warningSummaryByList`, 15a).
- Demo surfaces: `apps/demo/DemoData.tsx` (subscribes to the whole store; the persisted-size panel;
  `guardTargets` builds a `select` over every non-DRAFT List and its Bookings, which after 15b's rename
  means every SUBMITTED or AUTHORISED List: read what 15b and 31 left), `apps/demo/DemoXero.tsx`
  (the contacts and invoices tables render every row; the "Contact archiving & volume" callout ~82
  reads `settings.volumeStory`).
- Shell: `shell/AppShell.tsx` (the harness bar left group: product name, "Prototype" pill, the DEV-only
  Requirements link), `apps/web/components/WebNav.tsx` (persona group ~62),
  `apps/admin/components/SideNav.tsx` (the `Wordmark` and "ADMIN" block), `apps/mobile/screens/MoreScreen.tsx`
  (~62 to 66, "All patients, lists and figures are fictional"), `shared/DemoBadge.tsx`.
- Privacy today: `store/xeroNhi.test.ts` (the Xero-slice probe this phase generalises), `store/intake.ts`
  (`upsertPatient`; audit `patient.create` carries the NHI in `after`, which is core platform),
  the four `console.*` calls (`pwa/swRegistration.ts:39`, `pwa/officeSimulation.ts:144`,
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
   `fullScale.test.ts`) (US-15.0.4). This is session 1's deliverable.
   - **One billing module, no second copy.** The generator builds the 2026-10-20 model by calling the
     structures, candidate rule, resolver, "who is billed" function, held-value calculation, snapshot
     builder and prepayment builders that Phases 18 to 27a keep in one place in
     `aa-prototype/src/domain/billing` (plus the seed's builders), behind the types the UI reads. It never
     declares its own Contract, line, holder, RVG group or Booking-procedure shape, never re-implements
     candidate selection or pricing, and never writes a field the module computes. AR-29 and AR-30 may
     change again: a change there is an edit to `domain/billing` and the seed, and the generator follows
     without an edit of its own. A source-scan test asserts `fullScale/` imports Contract, line, resolver,
     pricing, snapshot and prepayment logic only from `domain/billing` (and its own constants).
   - **Purity first.** `domainPurity.test.ts` forbids `src/domain` reaching into `src/store`. Anything the
     generator must share with the runtime that lives in the store today is lifted into `src/domain/`
     first, with the store keeping a thin wrapper and no behaviour change: that includes the archive rule
     (`eligibleArchiveContactIds` in `store/archiveActions.ts`, rewritten as a pure
     `domain/billing/contactArchive.ts` that groups ACCRECs by contact once, so it is linear; today's loop
     re-filters every ACCREC per contact, which is quadratic at 28,000 contacts), and any selector the
     billing run leans on that Phases 20, 21, 25 and 27 left in `store/` (the candidate list, who is
     billed, the snapshot, the prepayment builders). Use whatever Phases 25, 27a and 36 made pure for
     snapshots, invoicing from them and building ledger pairs.
   - `FIRST_NAMES` and `SURNAMES` in `domain/seed/patients.ts` are module-private today: export them (no
     change to `buildPatients`, so the seed is unchanged).
   - `FULL_SCALE`, one labelled constants block (`fullScale/constants.ts`): `anaesthetists: 85`
     (so 71 generated), `historyMonths: 12`, `targetInvoicesPerYear: 28000`, the booking density per
     booked List, the share of split Bookings (the shape Phase 22's Split writes, built through its pure
     builder, not the store action), the payment mix of the history (paid and disbursed, part paid,
     outstanding by age), the share of one-time patients (`settings.volumeStory.oneTimePct`, 99),
     `noContractShare` (the share of Procedures left on No contract (RVG) when a holder-fit Contract is
     also offered), `linelessContractShare` (Contracts with no lines), `optionalModifierShare`,
     `guardianPayerAgeUnder` (below this age the payer on the Booking is a synthetic guardian, so no
     child-payer warning is raised in history), `prepaidShare` (the practice-sized handful of prepaid
     Bookings, below), `monitorProblemShare`, and the page sizes used by the screens (Day 30
     anaesthetists, Invoices 50, Audit 100, monitor 20 anaesthetist groups and 25 Lists per group). The
     horizon is not here: it is Phase 28's setting. Every figure in copy is read from here, the setting
     or counted from the data, never typed.
   - `buildFullScaleDataset(base: AppState-shaped seed, clock): FullScaleDataset`, deterministic, built
     on top of the pristine seed (the 14 demo anaesthetists and every seeded record are kept exactly):
     - **Anaesthetists** (71): synthetic names from the seed's `FIRST_NAMES` and `SURNAMES` pools with a
       "Dr" prefix, registration numbers in a reserved block that cannot collide with the cast (for
       example 60001 upwards), unit values drawn from the seed's ranges, `active: true`, and Phase 26's
       profile fields filled with synthetic, well-formed values (HPI CPN, GST number, bank details; no GST
       period, which is gone). Standing patterns are **recurring bookings** (Phase 30), drawn like the
       cast's, so `rollCanvasForward` keeps projecting their far edge when the clock moves. Each gets
       Phase 17's default priority tier and no pairing preferences (a handful of tiers may be varied so
       the admin finder's tier order shows at scale; preferences and tiers stay office-private, and
       `officePrivacy.test.ts` stays green at full scale).
     - **Contract holders and Contracts** the Bookings draw on: the seed's holders and Contracts are kept;
       the generator adds a practice-sized set of synthetic holders (hospitals, surgeons' rooms, insurers,
       each with its settings: billed or not, with a billable party) and Contracts as dated versions built
       through Phase 18's builders, at `linelessContractShare` with no lines and otherwise with standalone
       lines (Phase 19a: line key, holder reference code, description, default RVG code, fixed price or
       rate and discount, units). A year of history crosses the seeded Contract versions, so old Bookings
       price at the old version.
     - **Prepaid, a handful** (`prepaidShare`): a few of the 71 get a price-list Contract kept by the
       office (an anaesthetist holder, Phase 19a, D42) flagged **prepaid** (Phase 18, D64), with a fixed
       price on each line. Their prepaid Bookings have a payer who is a person (D23), the Procedure priced
       at that line's price in full (kept through any Contract change), the prepayment invoice approved
       with its pair to the prepay holding account and its draft Xero pair (Phase 27, D38), and, for
       AUTHORISED history, the second pair that moves the amount to the anaesthetist who did the List
       (Phase 27a). Forward prepaid Bookings leave their amount in the holding account. All through
       Phase 27 and 27a's pure builders, never store actions. Part-paid tracking, letters, refunds and
       credits (Phases 27 and 41) stay empty. Record the share in the Decisions log.
     - **Slots and Lists** across the horizon via Phase 28's generator with the extended
       `CanvasMasters`, reading the horizon from `appSettings.schedule.horizonMonths`, never a constant:
       at the default, about 21,000 Slots from today to the edge (85 x 124 days x 2) and about 23,500
       including the two weeks back. Slot statuses use Phase 29's status master by fixed id; availability
       follows the order Phase 28 paints (availability first, then recurring bookings), so a generated
       anaesthetist's unavailability never holds a List; a recurring booking that falls on it becomes a
       Draft List by Phase 31's rule, at a practice-sized handful, so the Day dashboard's Draft List strip
       and the "unassigned" count stay realistic. List states follow DM-52: forward assigned Lists are
       ACTIVE, Draft Lists (no anaesthetist) are DRAFT and nothing else is. Forward booked Lists for the
       71 get Bookings at the seed's filler density (richest over the next 10 days, thinning after), on
       the existing hospitals, surgeons, holders and Contracts, each Booking built as below.
     - **Each generated Booking and its Procedures** (forward and history alike), built through the
       shipped builders:
       - a **patient with a valid NHI** and a **payer on the Booking** (Phase 21, US-11.2.2), prefilled
         from the patient; below `guardianPayerAgeUnder` a synthetic guardian (a person billable party)
         instead. No Booking is saved without an NHI and none is generated pending (OQ-49);
       - the Procedure's **description as received** (Phase 20a, DM-51), in its channel, drawn from the
         pool 20a seeded from AR-35, kept as written, and an **invoice description** copied from the line
         or the Booking's description. The **RVG code is optional** (D33): a Procedure on a Contract line
         carries the line's default RVG code; one priced on No contract (RVG) carries a code from the RVG
         group master (Phase 19; the group is the one master list, so there is no procedure list to pick
         from and no "general procedure"); never a blank Procedure that a Booking needs priced;
       - **exactly one Contract per Procedure, by Phase 20's rule** (DM-10, US-04.3.3): No contract (RVG)
         or a Contract whose holder fits the Booking, with a version in force on the List date (Phase 18,
         D45) and a line for the Procedure where it has lines (a Contract with no lines is offered when
         its holder fits, D32); the generator takes Phase 20's candidate list in its picker order (No
         contract (RVG) first, then the hospital's, surgeons' and anaesthetists') and draws one, No
         contract (RVG) at `noContractShare` when another fits. There is no hospital, insurer or
         procedure default to fall back to, because none exists;
       - **who is billed** from Phase 21's one function: the holder's billable party when the holder is
         billed, otherwise the payer on the Booking; the insurance indication and holder references set
         to match the chosen Contract (D28), so billed history raises no review warning;
       - **values held on the Procedure** (Phase 19a and 24): the starting values (price, rate, discount,
         base and modifier units) filled from the line or the RVG group, then priced by Phase 24's
         calculation: the held price if there is one, else BTM x rate x (1 - discount), the discount its
         own invoice line. RVG base units at the group's starting figure, so nothing generated is out of
         range (D35) and the office's out-of-range warning never fires. No typed price and no office
         override, so the editable flag never comes into play;
       - **modifiers as records** (Phase 19b): the age modifier (A1, A2) from the patient's date of birth
         on the procedure date (D29) and P1 at 0 units on every Neurosurgery H7A to H9b and Spine S1 to
         S10 code (D43), both pre-applied and left in place (removable, never locked), and at
         `optionalModifierShare` one optional modifier from the master with its short explanation; no ASA
         pre-fill;
       - exactly one primary Procedure (Phase 23), the multi-procedure rule applied as Phase 23 built it
         (D26).
     - **Billed history** for the 71 over the last 12 months before `DEMO_TODAY`: worked Lists (each with
       its Slot, following whatever Phase 28 does for pre-horizon history), AUTHORISED, their Bookings
       built as above, then the **pricing snapshot per Procedure written at authorise** (Phase 25, DM-08:
       the Contract version and line in force, the values the engine priced from, BTM, price, the
       payer or billable party, the payee), then invoices priced only from the snapshot, one BCTI (ACCPAY)
       per receivable invoice, ledger pairs, receipts and disbursements built with **the same pure
       builders the billing run and ledger use** (never store actions: `mutate()` per record would copy
       the audit array each time and go quadratic). Disbursements follow Phase 39a's weekly ISO-week
       payment cycle through its builders. Invoices land at about `targetInvoicesPerYear`. The monthly
       AA-FEE invoices (Phase 16, D1: one per generated anaesthetist per month, fixed items plus the
       per-BCTI charge counted by Phase 16's one pure count function, never a second count) are included
       and counted separately. Events (38b, 39b), additional invoices and credit notes (38b, 39) may be
       left out of the generated history; if any are generated they go through the same builders.
       Generated billed history raises no open warnings (15a's routine); only the forward Bookings and
       the review backlog raise what the rules naturally raise, so the to-do list stays practice-sized.
     - **A realistic problem set for the processing monitor** (US-13.3.1): a small, deterministic share of
       generated authorised Lists (`FULL_SCALE.monitorProblemShare`, a few in a thousand) carry a
       problem Phase 37's `listProblems` recognises, built through the shipped shapes (a billing
       exception through Phase 36's builder, an open Xero queue item through Phase 37's), so Problems only
       at scale shows a practice-sized handful, not zero and not thousands.
     - **A realistic review backlog**: the 71's worked Lists from the last two working days before
       `DEMO_TODAY` are left SUBMITTED (Bookings complete, not authorised, not billed, no snapshot yet),
       so the Review queue shows the practice-sized backlog it would carry (about 100 to 170 Lists) and
       not only the cast's.
     - **Patients**: about one per history Booking at the one-time share, with synthetic names, DOBs,
       ethnicity codes and phones drawn like `buildPatients`, and NHIs from `generateNhi` (about one in
       nine new-format) against a used-set seeded with every existing NHI, so every NHI is valid and
       unique. Every patient carries a hidden internal id, in Phase 40's patient-record shape.
     - **Xero mirror**: one contact per billed party (payer, guardian, holder's billable party) and
       organisation, plus the prepay holding account's, keyed on the hidden internal id and named by
       Phase 16's label helper (no patient name, NHI or other personal information: OQ-30), an ACCREC and
       ACCPAY per ledger pair, payments and disbursements matching the ledger, and contacts archived by
       the same rule `eligibleArchiveContactIds` applies (fully paid and inactive past the window), so the
       active-contact count is real. `settings.volumeStory.activeContacts` is set to that count in the
       full-scale state.
     - **Audit**: a compact, realistic trail per generated record, using exactly the action codes the
       runtime writes for the same steps (Booking create, Contract set, complete, List submit, authorise,
       invoice, prepayment approved; a credit note where one is generated). US-13.5.2 lists invoices and
       credit notes and leaves payments and disbursements to Xero, so they get an entry only if the
       runtime as shipped writes one, never an invented one. Correct actors and sources, clock timestamps
       from the record's own dates, sorted by `atISO`; then one newest entry `demo.fullScaleLoaded`
       (actor "Demo control", source demo, `after: { anaesthetists, slots, invoices, auditEntries }`).
     - **Ids and numbers**: every id comes from the counters, which the dataset returns advanced, so the
       first runtime allocation after loading continues past them. Generated invoice numbers use a
       reserved series that can never collide with the live counter or the seeded `AA-2026-H<n>`
       backdrop (for example `AA-S-000001`); say so in the Decisions log.
     - Returns `{ state, counts: { anaesthetists, slotsInHorizon, slotsTotal, lists, draftLists,
       recurringBookings, bookings, procedures, prepaidBookings, patients, invoices, aaFeeInvoices,
       ledgerPairs, xeroContacts, activeContacts, auditEntries } }`.
   - Vitest (allow a generous per-test timeout; note the Node timing in the PROGRESS entry):
     - determinism: two builds give identical counts and an identical digest (an FNV-1a hash over every
       record id, amount and date, in key order);
     - the seed survives: every seeded record (the 14 anaesthetists' Slots, Lists, Bookings, invoices,
       ledger pairs, Xero rows, audit) is deep-equal to the pristine seed's;
     - the claims: 85 anaesthetists; at the default horizon, Slots from today to the edge at least
       20,000; exactly two Slots per anaesthetist per day; a shorter horizon setting gives proportionally
       fewer Slots and no Slot past its edge; invoices raised in the last 12 months within 27,500 to
       28,500; the AA-FEE count per anaesthetist per month is one, and its per-BCTI line equals Phase
       16's count function over the generated invoices; `billingMonitorView` with Problems only returns
       exactly the generated problem Lists;
     - integrity, the model (checked against [AR-29 · Integrity rules](../../../../requirements-board/requirements/artifacts/AR-29.md#integrity-rules)
       as the shipped module encodes them): every Booking has a payer and a patient with a valid NHI;
       every Booking has exactly one primary Procedure; every Procedure has its description as received,
       an RVG code that exists in the group master where it has one, its age modifier where the age band
       applies and P1 on every Neurosurgery and Spine code, and exactly one Contract, which is No contract
       (RVG) or a candidate under Phase 20's rule on the List date (holder fits, version in force, a line
       for the Procedure or a Contract with no lines); no Procedure sits on a hospital, insurer or
       procedure default and no generated record carries a removed field (payment category, billing
       route, `funderOverride`, a default-Contract flag, a Contract kind, a prepayment estimate or
       deposit); who is billed equals Phase 21's function; no List is DRAFT with an anaesthetist and every
       DRAFT List is a Draft List; every recurring booking projects through Phase 30's projection; every
       prepaid Booking is on a Contract flagged prepaid with a person as payer;
     - integrity, the money: every AUTHORISED Procedure has a pricing snapshot, and re-running Phase 24's
       calculation from the snapshot's values gives its stored price (parity); a prepaid Procedure is
       priced at its line's price; every invoice links to a Booking and a snapshot; every ledger pair
       balanced (disbursed at most authorised, authorised at most received, received at most due, Phase
       36's invariants); the prepay holding account balances and nothing in it is paid out before its
       List is AUTHORISED; every NHI valid and unique; no id collides with the seed; the next allocated
       id of each kind is unused;
     - one-module: the source-scan test above (no Contract, line, resolver, pricing, snapshot or
       prepayment logic outside `domain/billing`);
     - privacy: the leak scan (work item 13) over the full-scale state finds zero NHIs and zero other
       personal information in the Xero slice (added in session 2, when the scan exists).
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
   - The clock keeps working at scale: `rollCanvasForward` generates the far edge for all 85, projecting
     the 71's recurring bookings as it does the cast's; the poll and the archive job run over the full
     ledger and contacts.
   - Vitest in `scaleMode.test.ts`: load then reset gives counts equal to the pristine seed, `mode:
     'demo'`, persistence resumed and one write; a reload simulation after a load (fresh store over the
     same storage) hydrates the pristine seed; `advanceClockDays(1)` at full scale adds 170 Slots and
     runs without error; a Booking created after the load gets an unused id, and setting its Contract
     through Phase 20's action offers the same candidates as at demo scale; a second load while
     generating is refused.
   - **Session 1 stop point.** Register the `load-full-scale` entry (Demo triggers, with its confirm) so
     the set loads in the running app, then re-green (`npm run build`, `npm run build:pwa`,
     `npx vitest run`), load the set in the browser once, open a generated Booking (its stack, payer and
     Contract read correctly) and a generated invoice, record the Node and browser generation times and
     the counts in the PROGRESS entry, and stop. Session 2 starts at work item 4.
4. **Selectors that stay fast at scale** (`store/selectors.ts` and the admin derivations):
   - Profile with the timing hook first; fix only what the numbers show. The likely hot spots are the
     per-render full scans in `AdminApp.tsx` (`dayLists` over every List, `reviewLists`, the side-nav
     badge counts), `AuditViewer`'s sort and `entityTypes` set on every render, `InvoicesScreen`'s
     `failedCases` filter, 15a's `openWarnings` and `warningSummaryByList` (the to-do list and the Day
     grid triangles evaluate every Booking), Phase 37's `billingMonitorView` (every authorised List of
     the year, mapped to queue items and divergences), Phase 20's "Needs a Contract" list, Phase 21's
     review warnings over the backlog, Phase 30's conflict dashboard, Phase 31's Draft
     List strip, Phase 32's notification pool, and the clock jobs: the archive job (made linear in work
     item 2) and the reconciliation poll must each stay well under a second on Next day at full scale.
   - Add memoised indexes keyed on the record map's identity (a `WeakMap` per map, rebuilt only when the
     map object changes): Lists and Slots by date, Lists by anaesthetist, Bookings by List, invoices
     sorted newest first, audit sorted newest first with an entity-type set, and open warnings by List
     (billed Bookings skipped if 15a's rules never fire on them). Components keep deriving through `useMemo` as the
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
6. **Invoices, Audit and the Billing monitor page at 28,000** (`InvoicesScreen.tsx`, `AuditViewer.tsx`,
   `BillingMonitorScreen.tsx`, and the Phase 36 Ledger screen if it lists every pair) (US-15.0.4;
   US-13.3.1):
   - A shared `Pager` component, new `apps/admin/components/Pager.tsx` (`apps/admin/tableChrome.ts` holds only
     style helpers and stays `.ts`; the pager reuses its cell styles): "Showing 1 to 50 of 28,114" (mono,
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
   - **Billing monitor** (Phase 37's restyle, US-13.3.1: "This list will get quite large"). Measure it
     first at full scale with "All anaesthetists" and no filters (85 groups, a year of authorised Lists).
     Phase 37 built no paging and asked this phase to decide; build:
     - the anaesthetist groups page through the shared `Pager` at 20 groups ("Anaesthetists 1 to 20 of
       85"), shown only when there are more groups than the page size, so the seed-scale monitor (14
       groups) is unchanged. The anaesthetist and hospital filters, the date range, Problems only and the
       sort apply in `billingMonitorView` **before** paging; the summary tiles ("Awaiting approval",
       "Authorised", "With problems") count everything the filters keep, never the page. The page joins
       Phase 37's URL state as `?page=` (`replace`), resets to 1 when any filter or the sort changes, and
       survives the "Open in Review" round trip with the rest of the search;
     - inside a group, the authorised rows show the first 25 in the current sort, with "Show all N" that
       pages that group's table through the same `Pager`; awaiting rows always show (the backlog is a few
       per anaesthetist). `MONITOR_EXPAND_ALL_UP_TO` keeps its meaning (a large view starts collapsed;
       a List with a problem still opens expanded), and `?list=<listId>` lands on the page and group page
       that hold the List;
     - `billingMonitorView` reads the work item 4 indexes (Lists by anaesthetist, queue items and
       divergences by pair) so filtering stays linear; it stays the one view model and `billingMonitor`
       the one source of stages, as Phase 37 ruled.
     There is still no Authorise on the monitor: "Open in Review" stays the only path, as Phase 37 built it.
   - Safety caps on the two demo tables that would otherwise render every row at scale: the Xero sim's
     Contacts and Invoices tables (`DemoXero.tsx`) and the Data Inspector's lifecycle table and guard
     console selects (`DemoData.tsx`) show the first 200 rows with "Showing 200 of N" (the guard console
     offers the seeded marker Lists and today's Lists only when `mode === 'fullScale'`). If Phase 40's
     Admin · Patients list renders every patient, it gets the shared `Pager` at 50 over its existing search
     (about 28,000 patients at scale). These are caps, not features.
   - Component tests: the pager's ranges and edges (0 rows, exactly one page, last partial page);
     Invoices search then page; Audit filter resets the page; the Billing monitor shows no pager at 14
     groups, pages at 85 with Problems only applied before paging, resets to page 1 on a filter change,
     and `?list=` opens the right page.
7. **Timings you can see** (new `src/shared/scale/`: `useScreenTiming.ts`, `ScaleBanner.tsx`) (US-15.0.4):
   - `scaleMode.ts` also exports `timed(fn)` (returns the result and elapsed ms), the one way any other
     module measures (the leak scan in work item 13 uses it), so `performance.now()` stays in the two
     permitted places.
   - `useScreenTiming(key)` in Admin Day, Review queue, Invoices, Audit, the Billing monitor and the
     Ledger screen (the Review queue is timed and indexed, not paged: its backlog at scale is a few
     hundred rows at most): takes `performance.now()`
     at the start of the render and records the elapsed time in a layout effect (render and commit), then
     a paint sample after two animation frames, into `scaleMode`'s per-screen samples tagged with the
     current mode. It samples on mount and on page, filter and date changes. It is cheap and runs at both
     scales, so each screen has a demo-scale and a full-scale figure.
   - `ScaleBanner` (`data-shot="scale-banner"`), rendered by `AppShell` directly under the harness bar
     while `mode` is `generating` or `fullScale`, in the warning tint:
     - generating: "Generating full-scale data from the seed. This takes a few seconds.";
     - loaded: "Full-scale data · 85 anaesthetists · 21,080 sessions over the scheduling horizon ·
       28,114 invoices in the last 12 months · generated in 3.4 s · saving paused. Reset or reload returns
       to the demo data." (all figures from `counts`, the horizon setting and the timings). Per OQ-64 the
       word "slot" never reaches app copy: say sessions, AM or PM (the banner, the Timings table, the Data
       Inspector counts and the trigger messages included; Slot stays a code word). A copy test asserts
       none of this phase's strings contains "slot";
     - a "Timings" disclosure: a small table of each sampled screen, "Demo data" and "Full scale" columns
       (median of the last five samples, ms, mono), plus generation, install and first paint. If
       `performance.memory` exists (Chrome), one line "JS heap about N MB".
   - The banner is harness chrome: it never renders in the PWA (only `AppShell` mounts it), and it is not
     product UI.
   - Data Inspector: the persisted-size panel says "Saving paused: full-scale data is held in memory only"
     while paused, and `entityCounts` gains `slots`, `bookings`, `invoices`, `ledgerPairs`,
     `xeroContacts` (whichever the shipped names are; the Slot count is labelled "Sessions").
8. **Narrated scale becomes counted** (`MasterData.tsx` ~543, `DemoXero.tsx` ~82):
   - While `mode === 'fullScale'` the "Scale (narrated, not simulated)" line under the Nightly
     contact-archive job and the Xero sim's "Contact archiving & volume" callout read the
     real counts (invoices in the last 12 months, contacts, active contacts against the soft limit) and
     say "counted from the loaded data"; at demo scale they keep today's narrated wording.
9. **Re-green the scale half.** `npm run build`, `npm run build:pwa`, `npx vitest run`. Run the
   manual checklist's scale items before going on to the privacy half.

### Privacy

10. **The raw hospital row, held but not shown** (`domain/types.ts`, `domain/intake/`, `store/matchingActions.ts`)
    (US-15.0.6 failed message handling; US-02.1.4):
    - `ImportRow.raw: RawImportRow`, where `RawImportRow = { columns: readonly { name: string; value: string
      }[] }` (the row's existing `channel`, Phase 33's `'download' | 'manualSheet' | 'feedMessage'` at plan
      time, says which kind of source it came from; do not add a second union): the row exactly as the
      hospital sent it, including the columns the matcher does not map (for example address, next of kin
      and phone, referrer, clinical note, the hospital's own patient number). Written once by
      `stageImportRows` and never edited (corrections stay in `corrections`).
    - Fixtures: a pure `rawRowFor(sampleRow)` in `domain/intake/` builds each sample's raw columns from its
      incoming fields plus a few deterministic synthetic extras, so no fixture is typed twice. A
      `feedMessage` row's raw columns are the parsed segments of the Future-scope message text. Include a sample row with no NHI (it waits at intake, OQ-49) so the view covers it too.
    - The working view (Phase 33's table and row detail) is unchanged: it shows the mapped fields only.
      Add one line under the row detail's incoming fields: "Only the fields needed to match are shown.
      The rest of what the hospital sent is held under restricted access."
    - `maskRawRow(raw, policy)` in new `src/domain/privacy/mask.ts` with `RAW_ROW_MASKING`, one labelled
      block (the catalogue sets no masking policy, so it is AA's to agree and goes on the owner's review
      list): NHI-shaped values keep the first three characters and mask the rest
      ("ZAA••••"), dates of birth keep the year, phone numbers keep the last three digits, email keeps
      the domain, street addresses keep the suburb, next-of-kin names become initials; other columns show
      as sent. Pure, Vitest in `mask.test.ts`: every masked output of every fixture contains no NHI (by the
      same detector as work item 13) and no full DOB; unknown column names still mask NHI-shaped values.
    - `PERSIST_VERSION` bump (the persisted `ImportRow` shape changes; if Phase 34 seeds rows on boot, the
      reseed carries `raw`).
11. **The restricted raw-row view** (`store/matchingActions.ts`, `apps/admin/matching/RawRowSheet.tsx`)
    (US-15.0.6; US-13.5.1; US-13.5.2):
    - `viewRawImportRow(api, actor, rowId, reason)`: refuses `notFound`; refuses `notEligible` when the row
      is decided or none of unmatched, waiting for an NHI or blocked by a flag ("Raw rows are available only while a row
      needs resolving"); refuses `reasonRequired` for a blank reason. A non-office actor is refused
      `officeOnly` ("Only office staff can view a raw hospital row") **and the attempt is audited**
      (`importRow.rawViewDenied`, `after: { role, source }`, no patch), the way Phase 14 audits failed
      sign-in attempts. An office actor gets one audit entry `importRow.rawViewed` (`after: { reason,
      columnsShown }`, never the payload or any value) and the outcome value `maskRawRow(row.raw,
      RAW_ROW_MASKING)`. Nothing is stored about the reveal itself; each view is a fresh request.
    - Selector `rawViewsFor(state, rowId)`: the count and the last viewer and time, from the audit.
    - UI: in the row detail panel of an unmatched, NHI-waiting or blocked row, a quiet secondary link "View raw row"
      (`data-shot="matching-raw-row"`). It opens a side sheet: the heading "Raw hospital row"; the line
      "Restricted. Viewing is recorded with your reason."; a reason field with three quick reasons
      ("Find why this row did not match", "Check what the hospital sent", "Hospital asked us to confirm a
      value") and free text; the teal "View raw row" button (disabled until a reason is given). On success
      the sheet shows the masked columns (name, value in mono) and "Masking policy is for AA to agree". Closing the sheet hides the payload; opening it again asks for a reason again. The panel
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
      and every hit (area, location, the masked token, never the raw value). The known-NHI set is every
      patient NHI plus every NHI in import rows; the detector also flags any valid NHI-shaped token even
      if no patient holds it. Areas, each tokenised once so the scan is linear even at full scale:
      - **Xero** (must be zero; OQ-30 answered "No PII in Xero"): the whole `xero` slice, and
        `billing.xeroQueue` payloads and errors (Phase 37), checked for NHIs **and** for the personal
        information of patients and billable parties (names, phones, emails, addresses, dates of birth
        from `masters.patients` and `masters.billableParties`, as Phase 16's Xero privacy scan does), so
        the scan proves the answer, not only the NHI half. Organisation names (hospitals, insurers,
        surgeons, anaesthetist payees) are not personal information here. The personal-information match
        is a known-value set built once (lower-cased, whole-token for names), so it stays linear;
      - **Diagnostic log**: `recentDiagnostics()`, including recorded refusals;
      - **Failure reasons** (US-15.0.6 names monitoring): ledger and billing exceptions (Phase 36), Xero
        queue errors and divergence notes (Phase 37), the problem reasons the Billing monitor shows
        (`listProblems`, Phase 37), import row unmatched reasons and flags (Phase 33), the Future-scope
        message log's failure reasons, and Phase 42 loader row-validation messages if it keeps them;
      - **Held inside the core platform (allowed)**: patients, Bookings, import rows (including `raw`) and
        the audit trail, reported as counts with "Held by design" and never as leaks.
    - The report's scan time comes from `timed()` in `store/scaleMode.ts` (work item 7), never from a
      direct `performance.now()` call here.
    - `options.plantTestLeak`: adds one clearly labelled synthetic diagnostic line containing a real seeded
      NHI to the scan input only (never to the buffer or the store), so the report shows one hit in
      "Diagnostic log (planted test line)".
    - Vitest in `privacyScan.test.ts` (it supersedes the body of `xeroNhi.test.ts`, which Phase 16 grew
      into a Xero privacy scan and which becomes a thin call, keeping every assertion Phase 16 added):
      after the whole money chain (authorise, billing run, handoff, payment, payables run, the monthly
      AA-FEE invoice, an additional invoice event (Phase 38b) and a credit note (Phase 39)), a matching
      import with a raw-row view and a refused one, a Xero outage and restore, and a billing failure,
      every leak area reports zero; a planted leak reports exactly one; a hand-injected NHI in a billing
      failure message is found, and a hand-injected patient name in a Xero contact is found (proves both
      checks are wired); the scan never includes an unmasked NHI or personal value in its report.
14. **The scan report on the Data Inspector** (`apps/demo/DemoData.tsx`):
    - A "Privacy checks" panel (`data-shot="nhi-scan-report"`): before any scan, "Run Demo actions, Scan
      for NHI leaks"; after one, a table of areas (Area, What was scanned, Items, NHIs found) with a
      success pill "0 found" or an error pill "1 found" and the hit locations, the "Held inside the core
      platform" rows in neutral, the scan time in ms and the clock time it ran. The Xero row's column
      reads "NHIs or personal details found". The report is kept in
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
published context and a disabled state with its reason. None sets `badge` (the field holds only
`'future-scope'` and `'office-stand-in'`, and none of the three is either: the harness bar marks them as
demo actions already). None is added to the Control
Panel page, which lists them under their screens automatically.

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `load-full-scale` | Load full-scale data | Admin · Day view (`/admin/day/:dateISO`) and Admin · Invoices (`/admin/invoices`, `/admin/invoices/:invoiceId`) | bar | `loadFullScaleData`: resets, builds 85 anaesthetists, about 21,000 Slots across the horizon setting and about 28,000 invoices in memory, pauses saving, shows the scale banner. Message: "Generating full-scale data. Timings appear in the banner." (no "slot" in the message). Needs a confirm step ("Replaces the current demo data. Reset returns to it."): Phase 14 shipped no confirm field, so add an optional `confirm?: string` to `DemoTrigger` in `shared/demoTriggers/types.ts` (the menu shows a second Confirm click, like the Control Panel's jump) with a registry test, unless a later phase already added one | already generating ("Generating"); already loaded ("Full-scale data is loaded. Reset returns to the demo data.") |
| `scan-nhi-leaks` | Scan for NHI leaks | Data Inspector (`/demo/data`) | bar | `choices`: "Scan now" and "Scan with a planted test leak (proves the scan finds one)"; runs `scanForNhiLeaks` and stores the report for the Privacy checks panel. Message: "Scanned 3 areas and 31,204 items in 180 ms. No NHI outside the core platform, and no personal details in Xero." (figures from the report) | never |
| `matching-raw-row-other-role` | View raw row as another role | Admin · Intake, Matching (`/admin/intake/matching`, the shipped route), with the published `matching.selectedRowId` | bar | `when`: a row is selected and it is unmatched or blocked. `choices`: "As Dr Melanie Souter (anaesthetist)" (Phase 14's `SOUTER_ACTOR`) and "As the hospital feed (integration)" (a new `HOSPITAL_FEED_ACTOR` in `store/demoActors.ts`: `{ who: 'Hospital feed', role: 'system', source: 'integration' }`; `ActorRole` has no integration role); calls `viewRawImportRow` with that actor and the reason "Demo: access check". Message: "Refused: only office staff can view a raw hospital row. The attempt is in the audit trail." | no row selected ("Select an unmatched row first"); the row is decided ("Raw rows are available only while a row needs resolving") |

The office's own **View raw row** is a product action in the row detail panel (work item 11), not a demo
trigger: the Roadmap keeps product actions in the product UI. What cannot be shown through normal use is
the restriction itself, because the Admin app always runs as the office, so the harness entry exercises
the refusal. This is the reading of the plan's "View raw row" trigger; record it in the Decisions log.

The "Load full-scale data" entry is listed on the Day view and Invoices screens because those are where
scale is demonstrated; Audit, the Billing monitor and the Ledger then show it without a trigger of their
own. Its `run` returns
at once (the registry's `run` is synchronous); progress, the result and any error show in the scale banner.

Tests: update the pinned per-screen counts in `demoTriggers.test.ts` for the Day view, Invoices, Data
Inspector and Matching; add a case per entry for its disabled reasons; if `confirm?` is added, a registry
test that the menu needs the second click before `run` fires.

**PWA equivalent:** none needed. The Day view, Invoices, Audit, Billing monitor, Ledger, Matching and Data Inspector are
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
- New model rules of any kind. The generator builds the 2026-10-20 model only through what Phases 17 to
  27a shipped in `domain/billing` and the seed; if it needs a rule that is missing or wrong there, the fix
  goes in that module (with its test) and is logged, never as a generator-only shortcut.
- Prepayment beyond a practice-sized handful: part-paid tracking, escalating warnings, letters, refunds and
  credits (Phases 27 and 41) stay empty in the generated set; the cast's prepaid beats carry them.
- Paging or scale work on screens the requirement does not name, beyond the safety caps in work item 6
  (the Review queue is timed and indexed but not paged; web Accounts stays as it is; the 71 generated
  anaesthetists have no mobile or web persona). The Billing monitor is in scope because US-13.3.1 names
  its size; its grouping, filters and "Open in Review" are Phase 37's and are not reworked here, and
  approving inside the monitor stays out.
- Long horizons at full scale: the generator runs at whatever the horizon setting holds, but tuning for
  very long horizons is not built (FT-01.1's note: "we don't have to worry about it for now").
- The dead-letter queue and its raw HL7 view (US-14.5.1, Future). The Future-scope HL7/FHIR simulator keeps
  showing its raw messages, because it plays the hospital's side and carries its Future-scope badge; the
  Future-scope message log's patient name on failed rows is left for Phase 44's handoff.
- Removing the NHI from the audit trail or the patient record: both are core platform (US-15.0.6 allows the
  NHI inside the clinical and ledger systems).
- Hosting, backups, disaster recovery, penetration testing, environments and the AI-tools statement from
  EP-15's technical discussion: presenter talk-track only.
- Real authentication or role management: the office-only rule is the store guard, as everywhere else.
  The simulated PWA sign-in (US-13.5.3) is Phase 43a's, which runs after this phase.
- Catalogue screenshots beyond the "Catalogue screenshots" step below (the covered items and the recipes this phase breaks); `US-15.0.6`'s two Xero captures stay valid.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. The harness bar, the web top nav, the admin side nav and the mobile More card each show
      "Synthetic data only" with its tooltip; crimson and teal are unchanged around them.
- [ ] Admin Day on Tue 21 Jul at demo scale: no pager, the footer shows real counts and no "narrated"
      sentence; Demo actions lists "Load full-scale data".
- [ ] Load full-scale data (with its confirm): the banner shows "Generating", then the counts (85
      anaesthetists, at least 20,000 sessions over the horizon (four months by default), invoices between 27,500 and
      28,500) and the generation time; no banner, table or message says "slot"; the Data Inspector says
      saving is paused.
- [ ] Admin Day at scale: 85 anaesthetists in 3 pages of 30; the header summary counts all 85; filters
      and A to Z sort apply before paging; changing the date returns to page 1; Dr Souter's Tue 21 AM and PM
      Lists look exactly as at demo scale. Assigned Lists read ACTIVE (never "DRAFT" or "Open"); the Day
      dashboard's Draft List strip shows a practice-sized handful.
- [ ] A generated Booking at scale (open one on a generated anaesthetist's forward List, and one on a
      billed List): it has a payer (the patient, or a guardian for a child); each Procedure shows the
      three-part stack (description as received, RVG code where it has one, then the Contract: No contract
      (RVG) or a Contract whose holder fits the Booking, with its holder, who is invoiced and the pricing
      basis); its modifiers show the pre-applied age modifier and, on a Neurosurgery or Spine code, P1, both
      removable; no hospital or procedure default appears anywhere; the patient has a valid NHI. On the
      billed one the invoice's price equals the snapshot's. A prepaid Booking (find one by its prepaid
      Contract) shows the line's price, and the prepay holding account in Admin is in balance.
- [ ] The Admin recurring bookings list (Phase 30) shows the 71's recurring bookings; no "Permanent
      List" wording appears.
- [ ] Invoices at scale: "Showing 1 to 50 of" about 28,000; next, last and first work; searching an
      `AA-S-` number finds it; opening it shows a correct invoice with its ledger and Xero state.
- [ ] Review queue at scale: the practice-sized backlog of submitted Lists (the 71's last two working
      days plus the cast's), responsive, its timing in the banner table; Dr Souter's Lists appear as at
      demo scale. The Admin dashboard's to-do list stays practice-sized (no warnings from billed history).
- [ ] Billing monitor at scale (`/admin/billing`): anaesthetist groups in pages of 20 ("Anaesthetists 1
      to 20 of 85"); the summary tiles count every List the filters keep, not the page; one anaesthetist,
      a hospital, a date range and Problems only each narrow before paging and return to page 1; Problems
      only shows the generated handful of problem Lists; a group with a year of Lists shows 25 with "Show
      all N"; "Open in Review" on an awaiting row opens Review and "Back to Billing monitor" returns to the
      same page and filters; Dr Souter's group reads as at demo scale. At demo scale (Reset) the monitor
      has no pager and looks as Phase 37 left it.
- [ ] Audit at scale: pages of 100 over tens of thousands of entries; filtering by entity type and source
      resets the page; the newest entry is "Full-scale data loaded".
- [ ] The banner's Timings table shows Day view, Invoices, Audit and Billing monitor at demo scale and at full scale; no
      full-scale figure is more than a few times its demo-scale figure, and none is above about 200 ms on
      the presenter laptop (record the numbers).
- [ ] Ledger screen at scale is in balance and pages; Xero sim tables show "Showing 200 of N"; the Master data
      archive job's scale line and the Xero sim's volume callout count real contacts.
- [ ] At scale, Next day works (170 new Slots, poll and archive run) and S3 still runs on Dr Souter's Mon 20
      Lists (authorise, invoice, payment).
- [ ] Reload the page at scale: the app comes back on the pristine demo seed, saving active. Load again,
      then Reset: the pristine seed, the banner gone, saving active (the Data Inspector size updates after
      a mutation).
- [ ] Matching: select an unmatched row (and one waiting for its NHI, if the fixtures include one). The row detail says only the needed fields are shown. "View raw
      row" asks for a reason; with one, the sheet shows the masked columns (NHI as "ZAA••••" style, DOB as
      a year) and the "Masking policy is for AA to agree" line; closing and reopening asks again; the panel counts the
      views; the Audit viewer shows "Raw row viewed" with the reason and no values.
- [ ] Demo actions, "View raw row as another role", As Dr Melanie Souter: refused with the reason; the audit
      shows the denied attempt; no payload appears. On a decided row the entry is disabled with its reason.
- [ ] Data Inspector, Scan for NHI leaks, Scan now: every leak area reports 0 found (the Xero row checks
      NHIs and personal details), the core-platform rows read "Held by design". Scan with a planted test leak: exactly one hit in "Diagnostic log (planted test
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
    Billing monitor and turn on Problems only; open the banner's Timings. Say: "This is the whole
    practice: 85 anaesthetists, twenty thousand sessions across the scheduling horizon and a year of invoices, built
    in the browser from the same seed. The billing monitor still finds the few lists that need attention.
    Each screen shows its render time at demo size and at this size." Expected: the figures as the banner
    shows them (take them from the running app). Never say "slot" aloud or in the guide copy. Close with
    Reset.
  - **S5 Beat 3 (no NHI in Xero)** gains a step: Data Inspector, Demo actions, Scan for NHI leaks, Scan
    now, then the planted-leak choice. Say: "AA's rule is no personal information in Xero. We do not just
    avoid sending it; we check the Xero records for any NHI or patient detail, and the diagnostic log,
    error messages and failure reasons for anything that looks like an NHI." Expected: zero in every area,
    one planted hit.
  - **New S5 beat "Restricted raw data"** (or an aside if S5 is full): Admin, Intake, Matching, an unmatched
    row, View raw row with a reason, then Demo actions, View raw row as another role. Say: "The office sees
    what it needs to fix the row. The rest of what the hospital sent is restricted, masked and every view is
    recorded with a reason." Expected: the masked sheet, the audit entries, the refusal.
  - **Pre-demo setup:** point at the Synthetic data badge in the bar.
- `04-presenter-cheat-sheet.md`: "Is the demo using real patient or integration data?" answers with the
  badge; add "Can it handle 85 anaesthetists and 28,000 invoices a year?" (Load full-scale data and the
  timings, with the honest caveat that formal performance testing is a Testing-milestone task); "Present
  but honestly demo-only" gains Load full-scale data, Scan for NHI leaks and View raw row as another role;
  a strong phrase "The NHI never leaves the core platform, no personal information goes to Xero, and we
  check it."
- `02-workflows-and-handoffs.md`: in the intake workflow, one line that the raw hospital row is held under
  restricted access and each view is audited.
- `master-demo-guide.html`: the same passages.
- Control Panel scenario text: the S5 message, if it lists its beats, names the scan and the raw row.

The 2026-10-20 model changes (recurring bookings, holder-fit Contracts or No contract (RVG), the payer
and NHI on the Booking, the stack, the snapshot, prepaid Contracts) break no beat this phase owns: the earlier phases patched
theirs. In the "Full scale" aside, use only today's words (Booking, session, ACTIVE, Draft List, No
contract (RVG), the payer; never "slot", "Permanent List", "default Contract", "procedure list",
"estimate" or "deposit"); if the presenter opens a generated Booking, the expected line is "the same three-part
stack and the same Contract rules at full size".

Not a milestone phase; no full consistency read is required, but re-read every passage touched against the
running app.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 43` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/requirements/capture/recipes/`
matches what was built:

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-15.0.4](../../../../requirements-board/requirements/stories/US-15.0.4.md) Volumes | absent | partial, reason "full-scale volumes are generated in memory and timed on screen; formal performance testing is a Testing-milestone task". Admin shots `full-scale-day` (`/admin/day/2026-07-21`, after the `load-full-scale` entry and its confirm: states `banner` with the 85 anaesthetists, 20,000+ sessions over the scheduling horizon, 27,500 to 28,500 invoices, generation time and Timings, no "slot"; and `paged` with "3 pages of 30", ACTIVE wording and the Draft List strip), `full-scale-invoices` ("Showing 1 to 50 of" about 28,000), `full-scale-audit` (pages of 100, newest "Full-scale data loaded") and `full-scale-billing-monitor` (`/admin/billing`, "Anaesthetists 1 to 20 of 85"; second state Problems only). Highlight the banner and the pagers. Caption "Demonstration at full practice volume with measured screen timings" |
| [US-15.0.6](../../../../requirements-board/requirements/stories/US-15.0.6.md) Privacy and data minimisation | captured · xero-contacts, xero-pair | stays captured (the two Xero shots stay valid; the Xero sim shows no NHI in any field). Add admin shots `raw-row` (Matching, an unmatched row: only needed fields, then the reason prompt and the masked sheet with "Masking policy is for AA to agree"; highlight the sheet), `leak-scan` (Data Inspector `/demo/data`, Privacy checks after Scan now: 0 found, the Xero row checking NHIs and personal details, core rows "Held by design"; second state the planted leak, one masked hit) and `synthetic-badge` (admin side nav, plus the mobile More card on `/mobile`). Caption "NHI stays inside the core platform and non-production holds synthetic data only" |

Re-run `recipe-status.mjs 43` at the start of the step: if an earlier phase already changed either
recipe, keep its shots and add these. US-13.3.1 (the monitor) is Phase 37's recipe; here its screen is
only shot at scale under US-15.0.4.

**Recipes this phase breaks.**

- The "Synthetic data only" badge is added to the web top nav, the admin side nav and the mobile More card, so nearly every web, admin and mobile image changes by a few pixels. The full `npm run capture` rewrites them; that is expected, not breakage. Check that no highlight box now overlaps the badge.
- `US-15.0.4.json` quotes the narrated paging sentence on the Day grid and the Xero simulation; it is rewritten above. Recipes that highlight Admin Day (`US-15.0.1`, `US-13.1.1`, `US-13.1.2` and the many `/admin/day/` recipes) must still resolve with the paging footer; at demo scale there is no pager, so no change expected.
- `US-13.5.1.json`, `US-07.2.1.json` and `US-07.3.2.json` start on the Data Inspector (`/demo/data`), which gains a Privacy checks panel; `US-02.5.5.json` and `US-13.5.2.json` open the Audit viewer, whose 500-row cap becomes pages of 100. Re-check their highlights with `--dry`.
- The matching screen's row detail changes (only mapped fields, View raw row); no recipe was found using `/admin/intake/matching`, but the `--dry` run is the check.
- The Billing monitor gains a groups pager and per-group "Show all N", shown only above 20 groups or 25 Lists, so at seed scale nothing changes; the recipes that open `/admin/billing` (`US-13.3.1`, `FT-13.3`, `US-13.3.2`, `US-09.2.4`, `US-10.1.2`, `US-10.2.1`, `US-08.1.1`, `US-08.3.4`, `US-08.5.1`, `US-08.5.2`, `FT-08.5`, `US-11.3.2`, as Phase 37 left them) must still resolve; confirm with `--dry`. `US-13.5.2.json` also carries Phase 14's `admin-sign-in-attempts` shot on the Audit viewer: re-check it with the new pager.

**ATLAS.md.** Update "Routes" (the Data Inspector's Privacy checks, Matching raw row, the `/admin/billing` row's new `page` search param), "Overlays that need clicks" (the confirm step for Load full-scale data, the raw-row reason prompt and sheet), "Gotchas" (the Synthetic data badge sits in every shell; full-scale generation takes a moment, so wait for the banner; the loaded set lives in memory and is lost on `goto`) and "Existing hooks" (the scale banner, the pagers including the Billing monitor's, the badge and the scan panel).

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
- One billing module: the generator declares no Contract, holder, line, RVG group or Booking-procedure
  shape of its own and re-implements no candidate rule, resolver, pricing, snapshot or prepayment
  builder; it imports them from `aa-prototype/src/domain/billing` (the source-scan test holds), so a
  change to the technical design (AR-29, AR-30) stays a contained edit there.
- The 2026-10-20 model at scale: every Procedure's Contract is No contract (RVG) or a Phase 20
  candidate on the List date (holder fits, version in force, a line or a Contract with no lines), never a
  hospital, insurer or procedure default; every Booking has a payer and a patient with a valid NHI, and
  who is billed comes from Phase 21's one function; standing patterns are recurring bookings, not
  Permanent Lists; DRAFT is only a Draft List; each Procedure has its description as received, no
  procedure list or general procedure, its values held on the Procedure and its age and P1 modifiers
  pre-applied; no generated record carries a removed field (payment category, route, `funderOverride`,
  a Contract kind, an estimate or deposit); prepaid Bookings sit only on prepaid Contracts with a person
  as payer and the holding account's pairs; tiers and preferences stay office-private.
- Integrity at scale: generated history went through the same pure builders as the billing run and the
  ledger (no parallel pricing code), every AUTHORISED Procedure has a pricing snapshot and its invoice
  prices only from it (parity with Phase 24's calculation), every ledger pair balances, the Ledger screen
  shows in balance, the Xero mirror matches the ledger, archiving follows the real rule; the AA-FEE run
  is monthly and its per-BCTI line uses Phase 16's one count function; disbursements follow Phase 39a's
  weekly cycle; the holding account balances and pays out nothing before AUTHORISED; the generated audit uses only the runtime's own codes (no invented payment or
  disbursement entries); the Slots follow the horizon setting, not a constant.
- Persistence: while paused nothing is serialised, not just not written; the pause is independent of the
  error latch; Reset resumes before it installs; a reload after loading returns the pristine seed; the PWA's
  storage path is unchanged.
- Performance honesty: timings measure what they say (render and commit, then paint), samples are per mode,
  the banner's figures come from the data and the constants block, the indexes are rebuilt when their map
  changes and never serve stale rows after a mutation; the archive rule and the poll are linear, not
  quadratic, and Next day at full scale stays well under a second; the generator is not reachable by a
  static import from the main entry.
- Paging correctness: filters and search before paging, page reset on change, edge pages, the Day view's
  summary counting all rows, no pager at demo scale, `?page=` a replaceable view preference. On the
  Billing monitor: the summary tiles count all kept Lists, Problems only and the anaesthetist filter
  apply in `billingMonitorView` before paging, `?list=` lands on the right page, the "Open in Review"
  round trip keeps the page, and no Authorise appears on the monitor.
- Privacy: the raw payload never reaches the audit, the diagnostics buffer, the scan report or any
  refusal message; masking covers every fixture column that could identify a patient; a non-office attempt
  is refused and audited once; the detector's shapes and check digits match `validateNhi` for both formats;
  every scan area is actually wired (the injected-leak test); the Xero area also catches personal
  information (OQ-30, "No PII in Xero") without flagging organisation names; no `console.` outside
  `diagnostics.ts`.
- Triggers: the three entries show only on their screens, `surfaces: ['bar']`, disabled states work, bodies
  in `src/store` / `src/shared`, the generator is dynamically imported, `pwaPurity.test.ts` green, every
  audit code has a label.
- Design and copy: the Synthetic data badge is neutral (not crimson, not teal, not the demo warning tint),
  the banner is harness chrome, teal-only actions, semantic tints for scan results, mono figures, no en or
  em dashes, and the word "slot" in no app copy (OQ-64).

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the raw-row masking policy (`RAW_ROW_MASKING`, which the catalogue does not set), the
  Billing monitor's page sizes (20 groups, 25 Lists per group) and its "Show all N", the Day, Invoices and
  Audit page sizes, the generated problem share, the generated model mix (`noContractShare`,
  `linelessContractShare`, `optionalModifierShare`, `guardianPayerAgeUnder`, `prepaidShare`), any rule the generator needed fixed in `domain/billing` (logged, with its test),
  anything logged rather than fixed, and the screens worth a look, each with its route and persona
  (Admin Day, Invoices, Audit and Billing monitor at full scale; a generated Booking's stack; the
  Matching raw-row sheet; the Data Inspector's Privacy checks).
- A catch-up status row for Phase 43 and an entry `### Catch-up Phase 43 · Scale and privacy (date)`
  (one per session if it runs over two): the drift-check result against `d4db277` (OQ-30 and OQ-49 answered and
  built as answered), the shipped names used from Phases 14 to 42 (the model names in
  `domain/billing` above all), the
  baseline and full-scale timings for each screen, the generated counts, the generation time in Node and in
  the browser, the checklist item by item, test counts, and the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `requirements-board/requirements/capture/REPORT.md` counts before and after (captured, partial, absent, failed), the recipes this phase broke and how they were re-pointed, and any partial reason handed to a later phase.
- **Decisions log:**
  - "Full-scale data is an in-memory demonstration built on the pristine seed; saving pauses and nothing is
    serialised until Reset" (US-15.0.4). The 14 demo anaesthetists are untouched and the 71 generated ones
    carry the volume; generated invoice numbers use a reserved series; the narrated `volumeStory` figures
    become counted only while the set is loaded.
  - "The full-scale generator builds the 2026-10-20 model through the one billing module" (US-15.0.4):
    recurring bookings, not Permanent Lists; RVG groups with no procedure list; each Procedure's Contract
    by Phase 20's candidate rule (No contract (RVG) or a holder-fit Contract, with or without lines),
    never a hospital, insurer or procedure default; a payer and a valid NHI on every Booking with who is
    billed from Phase 21's function; descriptions as received and modifier records; values held on the
    Procedure; the pricing snapshot at authorise; and a practice-sized handful of prepaid Bookings on
    prepaid Contracts with the holding account's pairs (`prepaidShare`). Supersedes this plan's earlier
    readings (curated procedures and general procedures, price precedence and source, "no prepaid set
    for the 71", first-party prepaid sets, Permanent List templates).
  - "Admin Day, Invoices and Audit page" (page sizes 30, 50 and 100). Replaces the Day grid's narrated
    paging sentence and the Audit viewer's 500-row cap.
  - "The Billing monitor pages its anaesthetist groups at scale" (20 groups, 25 Lists per group, filters,
    sort and Problems only before paging; US-13.3.1). Answers Phase 37's handoff on whether the restyled
    monitor needs paging; approval stays on Review.
  - "Hospital rows keep their raw payload under restricted access: office only, reason required, every view
    audited, masked by a policy for AA to agree" (US-15.0.6, applying US-14.5.1's rule to the in-scope failure
    surface). The harness entry exercises the refusal; the office view is a product action.
  - "Diagnostics are redacted and refusals are recorded, so the NHI leak scan covers logs and error
    messages"; `xeroNhi.test.ts` (Phase 16's Xero privacy scan) becomes part of the scan's test, and the
    Xero area checks personal information as well as the NHI (OQ-30 answered: "No PII in Xero").
  - "Synthetic data only is an environment marker in neutral styling, not a demo badge."
- **Handoff notes:** the Future-scope message log still shows the patient name on failed rows (US-14.5.1 is
  Future); US-15.0.4's formal performance testing belongs to the Testing milestone;
  `requirements-board/requirements/capture/recipes/US-15.0.4.json` was `absent` with a reason that said scale is only
  narrated; this phase's Catalogue screenshots step rewrites it (the Load full-scale data banner and the
  paged Day view); Phase 44's parity audit:
  no PWA stand-in required for this phase; the new optional "Full scale" aside and S5 beats for Phase 44's
  rewrite; for Phase 43a, the simulated PWA sign-in screen (US-13.5.3) should carry the Synthetic data
  only badge like the More card; long horizons at full scale are untested beyond the default four months
  (FT-01.1's note).
