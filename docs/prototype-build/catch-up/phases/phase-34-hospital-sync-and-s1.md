# Phase 34 · Hospital sync, PDF upload and the S1 rebuild

**Requirements covered:**
[US-02.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.5.md) Automatic sync from St George's and Southern Cross (Proposed; graded Contradicts at `501b0b8`: today's feeds push and apply, and Christchurch Public runs as a third live feed) ·
[FT-14.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-14.6.md) Further hospital feeds and automatic matching (Proposed; its children are in the Future Work lane) ·
[US-02.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.2.1.md) Read, correct and ingest a surgeon PDF list (Proposed; Partial: no upload step, and DOB, ethnicity and the estimated duration are not editable in review) ·
[RV-05](../analysis/reverse-check.md#rv-05-admin-integrations-monitor-presents-future-reliability-tooling-as-product) Admin Integrations monitor presents Future reliability tooling as product (Hide from demo) ·
[RV-06](../analysis/reverse-check.md#rv-06-hl7-to-fhir-simulator-live-drip-and-scenario-s1-built-on-them) HL7 to FHIR simulator, live drip, and Scenario S1 built on them (Rework).
Also touches, without closing:
[DM-34](../analysis/domain-model-delta.md#dm-34) (this phase adds its per-hospital sync state; Phase 33 closed the import rows, decisions and unmatched queue),
[DM-40](../analysis/domain-model-delta.md#dm-40) and [US-06.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.5.md) (the estimated duration per Procedure from the surgeon's rooms: Phase 27 adds the field and feeds its estimator; this phase lets the PDF review carry the rooms' figure into it),
[FT-02.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.1.md) and [FT-02.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.2.md) (Verify; the parent features. FT-02.2's 2026-10-01 note: PDF ingest is still needed beside the hospital feeds, because the download is not comprehensive),
[US-02.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.1.md), [US-02.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.2.md), [US-02.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.4.md) (Phase 33's import, decisions and unmatched queue, which synced rows and sheets feed),
[US-14.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-14.6.1.md) and [US-14.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-14.6.2.md) (Future Work lane: shown only as a badged demo toggle),
[US-11.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.2.md) (the NHI validators, which stay in Admin).
Open question: [OQ-13](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-13.md) (hospital download format and sync cadence; still Open at `501b0b8`, now with Stratos Tech to ask. The 2026-10-01 note adds that the two hospitals may not send the same shape and that the download is not comprehensive, so the theatre list and PDFs stay needed).
**Depends on:** Phase 27 (the estimated duration per Procedure, DM-40, with its audited office setter and the prepayment re-check it runs; this phase's PDF review edits that field and never adds a second one) and Phase 33 (the matching screen, import rows and decisions, the unmatched queue, no silent apply, and its registry entries). Through 33 it also relies on 14 (the trigger registry, `DemoBadge` tone `'future'`, the PWA sheet), 15 (Booking vocabulary and `Booking.source`), 17 (hospital contact emails), 20 (a created Booking takes the default Contract), 28 and 31 (Slots, Lists and Draft Lists as row targets).
**Estimated:** 2 sessions, both full; session 1 is the heavier. Session 1: sync state, the scheduled pull, the sync header, the sync triggers, the Intake regrouping and Future-scope demotion (Christchurch Public stops being a live feed), the PWA stand-in and the S1 rebuild. Session 2: manual-provider sheets and the auto-match toggle, surgeon PDF upload with DOB, ethnicity and estimated duration in review, the capture recipes, and the remaining demo-guide work. If session 1 runs long, item 8's Future-scope sub-routes can close session 2 instead, provided the Messages and Feed config tabs are already off Admin (hidden) at the session 1 checkpoint.

## Goal

The office stops pulling St George's and Southern Cross by hand. Each of the two integrated
hospitals syncs into Phase 33's matching screen three ways: on a schedule that runs on the demo
clock, every time an admin opens the matching screen, and when the admin presses **Sync now**. The
screen shows, per hospital, when it last synced successfully and any failed attempt; a failed sync
loses nothing, because the next good sync catches up. Synced rows are only rows: nothing reaches a
Booking until the admin decides. Only those two hospitals sync. The Christchurch Public feed, which
today runs as a third live HL7 feed, stops being one: it has no sync, no tile and no in-scope surface,
and it survives only as a labelled example on the Future-scope surface (US-02.1.5 regraded
Contradicts on exactly this point).

The other Christchurch providers (Forte Health, Christchurch Eye Surgery, Burwood, Southern Endo,
McMurray Centre) keep today's baseline: their daily sheets are imported by hand into the same screen.
A badged demo toggle shows the later phase of FT-14.6 (routine updates auto-matched, exceptions left
for the admin) without pretending it is in the first release.

The surgeon PDF inbox gains an **Upload PDF** action (a badged sample picker; parsing stays simulated),
and DOB, ethnicity and each row's **estimated duration** become editable in review. The duration is
the figure the surgeon's rooms print on their list (US-06.2.5); ingest writes it into the estimated
duration per Procedure that Phase 27 added (DM-40), so 27's prepayment estimator works from it. PDF
ingest stays a first-class pathway beside the sync, not a stopgap the feeds replace: the hospital
download is not comprehensive (FT-02.2's 2026-10-01 note). The HL7 v2 and FHIR tooling (simulator, live
drip, message log with retry and dead-letter, per-hospital feed mapping) leaves Admin for a clearly
separated Future-scope demo surface, finishing what Phase 14's interim badges started. The in-scope
pieces stay in Admin under one **Intake** home: matching, surgeon PDFs, data quality and the NHI
validators.

S1, the headline scenario, is rebuilt here around sync then match, including its Control Panel jump,
run-sheet beats and the handset path.

## Before you start: drift check

1. Run:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.1.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-06.2.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-06.2.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-14.6.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-14.6.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-14.6.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.2.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-02.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-02.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.1.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.1.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.1.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.1.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-14.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-14.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-14.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-14.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-14.5.1.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-13.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-34.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   (At re-plan time, 2026-10-01, there was no diff against `501b0b8`. Between `501b0b8` and `501b0b8`
   only four of these files moved: OQ-13 gained the 2026-10-01 note and a new owner, FT-02.2 gained the
   note that PDF ingest stays needed beside the feeds, FT-14.4 now says "HPI CPN", and US-06.2.4's
   time-unit bullet now points at OQ-75 (checking the tiered rule against the RVG text) instead of OQ-50,
   which is Phase 27's concern, not this phase's. The covered
   stories' text did not change; US-02.1.5 stays Contradicts and US-02.2.1 Partial. This doc already
   reflects all of it.) If an item changed, re-read it and adjust the work items; re-run the gap
   analysis for that item only, per `../README.md`.
2. **US-02.1.5.** If the pull triggers change (for example the on-open pull is dropped), change work
   items 3, 4 and 6 to match. If it is now Retired or Future, drop work items 1 to 4, 6, 7 and 9,
   rebuild S1 around Phase 33's hand import instead, keep the Future-scope demotion (it stands on
   RV-05 and RV-06), and note it in PROGRESS.md. If a third hospital is added to its integrated set
   (for example Christchurch Public), stop and tell the owner: work item 8's demotion of the
   Christchurch Public feed would reverse.
3. **FT-14.6, US-14.6.1, US-14.6.2.** If the five providers' feeds or automatic matching move out of
   the Future Work lane into the first release, stop and tell the owner: auto-match would become
   product behaviour, not a demo toggle, and work item 13 changes shape. If FT-14.6 itself is Retired or
   Future, drop the auto-match toggle, keep the manual-provider sheets (they are the FT-02.1 baseline:
   "everything from the other providers is entered by hand") and note it.
4. **US-02.2.1, US-06.2.5, FT-02.2.** If the upload step or the correct-before-ingest criterion
   changes, adjust work items 14 and 15. If US-02.2.1 is Retired, drop them and note it. If US-06.2.5
   moves the estimated duration off the Procedure (or drops the PDF as a source), follow wherever Phase
   27 put the field and adjust item 15's duration column; if it is Retired, drop the column. If
   FT-02.2's note that PDF ingest stays needed beside the feeds is withdrawn, keep the PDF work (US-02.2.1
   still asks for it) and soften the "PDFs stay in scope" narration in the demo guide.
5. **FT-14.1, 14.2, 14.3, 14.5, US-14.5.1** (all Future at `501b0b8`). If any has come back into
   scope, do not demote that piece: keep it in Admin, unbadge it, and tell the owner.
6. **OQ-13 (still Open at `501b0b8`, now with Stratos Tech to ask).** It gates the cadence and the
   delivery shape of the sync. The 2026-10-01 note settles nothing for the build: it says the two
   hospitals may not send the same shape (which a per-hospital row source already allows), that the
   download is not comprehensive (so rows may lack the Contract or insurer, and PDFs stay needed), and
   that the first release may need matching like the current system (which Phase 33 built). Following
   the meeting's working rule for open questions, build this recommendation, labelled provisional and
   kept in one place:
   - the schedule is one named constant, `HOSPITAL_SYNC_SCHEDULE` (every 2 hours, 07:00 to 19:00, on
     the demo clock), shown on the screen as "Scheduled pull every 2 hours, 07:00 to 19:00 ·
     provisional (OQ-13)";
   - synced rows use Phase 33's neutral row shape, not HL7 or FHIR, and carry the fields the catalogue
     names (patient, NHI, date, time, surgeon, procedure, and a hospital appointment reference); Contract
     and patient details may be absent on a row, as Vanessa describes, and no row carries an estimated
     duration (that comes from the rooms, US-06.2.5);
   - the screen says "How each hospital delivers its data is still being confirmed (OQ-13)".
   If OQ-13 has been answered since `501b0b8`, use the answered cadence and fields, drop the
   provisional label, and record the change in PROGRESS.md.
7. **Confirm the dependencies are DONE** and read their PROGRESS entries for the real names this doc
   can only anticipate:
   - **Phase 27** (planned names; use the real ones): the estimated duration per Procedure (planned
     `Procedure.estimatedDurationMin?: number`, DM-40), its audited office-only setter (planned
     `setEstimatedDuration`, minutes a whole number from 5 to 720, refused on an AUTHORISED or billed
     List, audit code `procedure.estimatedDuration`), and the prepayment re-check it runs after commit
     (planned `syncPrepayment`, which 27 runs after `setEstimatedDuration` and after `createBooking`). Note where 27 put the field: if it landed on the Booking rather
     than the Procedure, item 15 writes to wherever it is; never add a second field. Also note whether
     27's setter can join another action's commit or must run after it (item 15 needs one of the two).
   - **Phase 33** (planned names shown; use the real ones from its entry): `ImportBatch` and
     `ImportRow` (with `incoming: IncomingBookingFields`, `externalRef` as the appointment reference,
     and a `channel` union of `'download' | 'manualSheet' | 'feedMessage'`) in a top-level
     `intake` slice; the one staging entry point `stageImportRows(api, actor, channel, hospitalId,
     label, rows, extras)` in `src/store/matchingActions.ts` (exported there, not from `store/index.ts`; import it directly), with its dedupe (an identical row for the
     same appointment is skipped and counted in `skippedCount`); `importHospitalDownload(api, actor,
     sampleId)`; the decision action `decideImportRow` and the derived `suggestDecision`; the badge
     selector `matchingAttentionCount`; the screen `apps/admin/screens/MatchingScreen.tsx` (parts in
     `apps/admin/matching/`) on route `/admin/matching` with its own `'matching'` nav section under Day
     view; the sample library `HOSPITAL_DOWNLOAD_SAMPLES` in `src/domain/intake/hospitalDownloads.ts`
     (`SAMPLE_STG`, whose R1 is Sarah Mitchell; `SAMPLE_SX`; and `SAMPLE_FORTE_SHEET`, channel
     `manualSheet`); its bar triggers `matching-send-unmatched-row` and `matching-reschedule-no-list`
     (scoped to `/admin/matching`); its PWA stand-in `matching-office-matches-row` ("Hospital row
     arrives and the office matches it", body `officeMatchesHospitalRow` in `src/store/matchingDemo.ts`,
     two `choices`); the context key `matching.selectedRowId`; `visual/admin-matching.spec.ts`; where
     `RowField` moved to; and how it re-pointed `processMessage` to stage rows (RV-13). Wherever this
     doc names a planned 33 symbol, use the real one.
   - **Phase 14:** the registry contract (`DemoTrigger`, `choices`, `badge`, `when`, `indexPath`), the
     `DemoBadge` `'future'` tone, the context keys it defined (`integrations.tab` and
     `integrationsSim.selectedMessageId`; there is no PDF key yet), the `ingest-pdf-row` entry (gated by
     `when: integrations.tab === 'pdfs'`, body `SURGEON_PDFS[0]` row R2) and the interim Future-scope
     badges this phase replaces.
   - **Phase 15:** `BookingSource` (a synced or imported row creates `hospitalDownload`; a PDF row
     creates `surgeonPdf`).
   - **Phase 17:** the hospital contact-email field (the three new hospitals need one).
   - Whether Phase 33 already re-pointed S4 Beat 4 (the Christchurch Public dead-letter beat) and S5
     Beat 2 (MSG-STG-1002); its plan does both. If not, this phase does it (see Demo guide updates and the Control
     Panel text), because both lean on the tabs leaving Admin and on Christchurch Public, which stops
     being a live feed here.
8. Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (13 at the snapshot; the phases
   before this one, from 15 on, bump it). This phase bumps it by one in session 1, and once more in session 2 if that
   runs as a separate session after the checkpoint (its seed changes would not reach a store persisted
   mid-phase).
9. Record the drift-check result in the PROGRESS entry.

## Reference

**Design files (convention 17):**
- `docs/design/Admin Review.dc.html`: the Admin page anatomy the Intake screens keep: breadcrumb and
  title row, the micro-caps KPI strip with mono values (the model for the per-hospital sync tiles),
  the table, and the `bannerIn` entry motion (for newly arrived rows).
- `docs/design/Admin Day.dc.html`: the dark-ink side nav and its badge treatment (the Intake item keeps
  the amber attention badge), and the right-rail card style for the "Other providers" strip.
- `docs/design/Design Language.dc.html`: the success, warning and error tints and on-tints (Synced,
  Failed, Provisional), pills (`r-pill`), neutrals for the `'future'` badge tone, radii `ctl 10` /
  `card 14`, and the motion patterns `value-tick` (the last-synced time changing), `selection-slide`
  (the Intake tabs) and reduced-motion 80ms fades. Teal `#0D6E63` is the only action colour (Sync
  now, Upload PDF, Ingest); crimson stays identity only.
- `docs/design/Mobile App.dc.html`: nothing new; the PWA sheet from Phase 14 hosts the stand-in.
- The Future-scope surface is a demo surface: it keeps `DemoSurface` chrome, not product styling.

**Catalogue:** the covered items above, OQ-13 (with its 2026-10-01 note), OQ-34 (volume ranking of
the pathways), FT-02.2's "Notes" section, US-06.2.5 (estimated duration from the rooms) and
`domain-model.md` section 1 ("St George's and Southern Cross are integrated ... More hospital feeds,
automatic matching and HL7/FHIR are Future Work. NHI lookup is in scope"), the Booking "Sources"
bullets and the glossary entry "Matching screen". Evidence: `catalogue/notes/2026-10-01-aa-meeting-with-greg.md`
items #7 and #56 (the download is not comprehensive; PDFs still needed).

**Analysis:**
- `../GAP-ANALYSIS.md`: everything before "## By epic", especially theme 9 (intake becomes staged
  matching), "Remove or rework" (RV-05, RV-06, and the Christchurch Public feed as a live feed),
  "Demo impact", the intake cluster under "Demo-trigger buttons", and the OQ-13 line; then the EP-02
  and EP-14 tables.
- `../epics/EP-02.md` (US-02.1.5, US-02.2.1, FT-02.1, FT-02.2) and `../epics/EP-14.md` (FT-14.6).
- `../analysis/reverse-check.md`: RV-05, RV-06 and RV-13; `../analysis/domain-model-delta.md`: DM-34
  (intake and sync state) and DM-40 (estimated duration per Procedure).
- `../analysis/prototype-map-admin.md` sections 1, 8, 13 and 14; `prototype-map-shell-demo-pwa.md`
  sections 1, 3, 4, 5.1, 5.3, 7 and 9; `prototype-map-store-seed.md` sections 5, 7, 8 and 9;
  `prototype-map-domain.md` section 6.
- `../ROADMAP.md`: "Demo triggers", "PWA parity", "Demo guide", and the Phase 33 and 34 rows.

**Code entry points:**
- `aa-prototype/src/apps/admin/screens/IntegrationMonitorScreen.tsx`: `Tab` state (:25, :40),
  the "proposed product UI, NOT demo-badged" header comment (:31), `MessagesTab`, `FeedConfigTab`,
  `SurgeonPdfsTab` (:205, reads the constant `SURGEON_PDFS`), `PdfReview` (target List picker, rows as
  local state, `RowField` for NHI, Name, Time, Operation only), `DataQualityTab`, `ValidatorsTab`.
- `aa-prototype/src/apps/admin/components/SideNav.tsx` (`NavSection` `'integrations'`, amber
  `integrationBadge`), `AdminApp.tsx` (section from path :28-41, `integrationAttentionCount` :188,
  section paths :231), `apps/admin/routes.tsx` (`AdminIntegrationsRoute`), `src/router.tsx` (:103 and
  :131).
- `aa-prototype/src/apps/demo/DemoIntegrations.tsx` (feed picker, message library, the three panes,
  "Live drip" `setInterval` :57-74, the Keycloak callout), `DemoSurface.tsx`,
  `DemoControlPanel.tsx` (`SCENARIOS` S1 :360-376, and the S4 and S5 messages).
- `aa-prototype/src/shell/appConfig.ts` (`APP_CONFIG['demo-integrations']`, label "Demo:
  Integrations"), `AppSwitcher.tsx` (`ICONS`).
- Store: `integrationActions.ts` (`processMessage`, `MAX_ATTEMPTS`, `wireIntegrationRetry`,
  `setFeedMapping`, `correctEthnicityCode`, `ingestPdfRow` :431, whose update path edits time and
  operation and whose create path calls `createCard`, Phase 15's `createBooking`), `clockActions.ts` (`applyClock`
  :65-71 emits `dayAdvanced` only; `resetDemo` bypasses it), `events.ts` (`AppEvent`, `onAppEvent`),
  `archiveActions.ts` (`wireArchiveJob(api)`, the event-wired job pattern to copy),
  `demoSettingsActions.ts` (`armHandoffFault`, the audited demo-setting pattern to copy),
  `domain/types.ts` (`DemoSettings`, which already carries `failNextHandoff`), `selectors.ts`
  (`integrationAttentionCount` :996, `dataQualityItems`), `appStore.ts` (`PERSIST_VERSION` :130, the
  `integrations` slice in `AppState` :79 and `freshAppState` :168, `backfillMerge` :186), `intake.ts`
  (`upsertPatient`, ethnicity quarantine), `index.ts` exports.
  Phase 33's files (names from its PROGRESS entry): `src/store/matchingActions.ts`,
  `src/store/matchingDemo.ts`, `src/domain/intake/` (`matching.ts`, `hospitalDownloads.ts`),
  `apps/admin/screens/MatchingScreen.tsx` and `apps/admin/matching/`.
  Phase 27's files (names from its PROGRESS entry): `src/store/prepaymentActions.ts` (the estimated
  duration setter and the re-check) and the Procedure field in `domain/types.ts`.
- Domain: `domain/integrations/pdfSamples.ts` (`SURGEON_PDFS`: PDF-OKAFOR-0729 at Forte, PDF-WHITFORD-0729
  at Christchurch Eye Surgery; `PdfRow` has NHI, name, DOB, operation, scheduled time and ethnicity,
  no duration; `buildFacsimile` draws the table from the rows; `receivedLabel` strings that post-date
  the seed clock), `feeds.ts` (`FEED.cph` and `FEED_META[FEED.cph]` "Christchurch Public HL7 feed"
  :22 and :37, `CPH_MAPPING_MISCONFIGURED` :61, `CPH_NHI_FIX` :67, the CPH entry in the seeded feeds
  :83),
  `messages.ts` (`APPT` correlation ids; `STG_LIST` and `SX_LIST` = Souter Tue 28 Jul AM and PM),
  `domain/seed/cast.ts` (`HOSP`, `HOSPITALS`: STG, SX, FORTE, CES, CPH only),
  `domain/seed/availabilityAndHolidays.ts` (`HOSPITAL_HOLIDAYS` is a `flatMap` over `HOSPITALS`),
  `domain/seed/canvas.ts` (`ADHOC_HOSPITALS`, which must not change), `domain/nzhis.ts`
  (`validateEthnicityCode`), `domain/nhi.ts`, `domain/domainPurity.test.ts`.
- Entries: `src/main.tsx` and `aa-prototype/pwa/main.tsx` (the wired jobs), `src/pwa/pwaPurity.test.ts`.
- Registry: `src/shared/demoTriggers/registry.ts` and its test (Phase 14), including
  `fire-hospital-message`, `replay-hospital-message` and `ingest-pdf-row`.
- Tests and hooks: `aa-prototype/visual/phase11.spec.ts`, `visual/screens.spec.ts`,
  `visual/pwa-device.spec.ts`, `store/integrationActions.test.ts`, `store/demoScenarios.test.ts`,
  `store/persistMigrate.test.ts`, `shared/audit/actionLabels.ts` and `auditNarrative.test.ts`.
- Outside the app: capture recipes `requirements-board/capture/recipes/*.json` FT-02.2, US-02.1.1 to
  US-02.1.4, US-02.2.1, US-02.2.2, US-02.5.1 to US-02.5.4, US-11.1.2, US-14.1.1, US-14.2.1, US-14.3.1 and
  US-14.5.1 (at the snapshot they open `/admin/integrations` or `/demo/integrations`; Phase 33 points
  some at `/admin/matching`), and `requirements-board/capture/ATLAS.md`. There is no US-02.1.5 recipe yet.
- Visual specs: `visual/phase12.spec.ts` (S1, which Phase 33 routes through the matching screen) and
  Phase 33's `visual/admin-matching.spec.ts`.

## Work items

### Session 1: sync, the Intake home, Future scope, and S1

1. **Sync schedule and fixtures (pure domain, `src/domain/intake/`, beside Phase 33's intake module;
   no React, no `Date.now()`, covered by `domainPurity.test.ts`).**
   - `syncSchedule.ts`: `INTEGRATED_HOSPITALS = [HOSP.stg, HOSP.sx]`; `HOSPITAL_SYNC_SCHEDULE =
     { firstMinute: 7 * 60, everyMinutes: 120, lastMinute: 19 * 60 }` with a comment naming OQ-13;
     `scheduledPullsBetween(from, to)` (the scheduled instants in `(from, to]`, across days),
     `nextScheduledPull(clock)` and `lastScheduledPullAtOrBefore(clock)`. Clock values are
     `DemoClockState` or ISO datetimes built from it, never real time.
   - `syncFixtures.ts`: `HOSPITAL_SYNC_ROWS`, the rows each hospital "has ready", in Phase 33's neutral
     row shape (`IncomingBookingFields`) plus `hospitalId` and `availableAtISO`, and
     `rowsAvailableBetween(hospitalId, afterISO, uptoISO)` in a stable order. Share appointment
     references (`externalRef`) with `APPT` so a synced row matches the same seeded Booking the HL7
     library does. The minimum set (adjust to Phase 33's proposal rules, then pin every one in
     `demoScenarios.test.ts`):
     - **St George's, available 07:30 Tue 21 Jul (the S1 row):** Sarah Mitchell, NHI CQY9304, DOB
       1988-04-12, Tue 28 Jul 08:30, Mr Hale, 20950 Appendicectomy, laparoscopic, appointment
       `APPT.s12`. Build it from `SAMPLE_STG` R1's fields (import them, do not retype), so Phase 33's
       dedupe skips R1 if the presenter also imports `SAMPLE_STG` by hand, and the reverse. Its
       proposal must be "Create Booking" on `listIdForSlot(ANAE.souter, '2026-07-28', 'AM')`, with the
       patient reused by NHI.
     - **St George's, available 07:40 Tue 21 Jul:** a new patient with a new-format NHI (the
       MSG-STG-1002 patient), on the same List, so S5 Beat 2 can validate a new-format NHI on the
       matching screen.
     - **Southern Cross, available 07:45 Tue 21 Jul:** Priya Nair (NHI `MYY54SL`, the FHIR-SX-2001
       patient) as a neutral row, a new Booking on Souter Tue 28 Jul PM 14:30 (Southern Cross, Ms
       Patel). This is `SAMPLE_SX` R1: build it from that row's fields (import them, do not retype), so
       Phase 33's dedupe skips it if the presenter also imports `SAMPLE_SX` by hand, and the reverse.
     - **St George's, available 08:30 Tue 21 Jul:** a changed time on the seeded Booking with
       `APPT.s13Time` (a "modify" row with a field difference; the auto-match candidate).
     - **Southern Cross, available 08:40 Tue 21 Jul:** a cancellation of a seeded Southern Cross
       Booking that carries a correlation reference (or, if none exists, a row whose patient no longer
       appears, which Phase 33 routes to the unmatched queue). Never a scripted-beat Booking, and never
       the Booking `SAMPLE_SX` R2 modifies (a hand import after the sync must still show R2's change).
     - **St George's, available 06:30 Wed 22 Jul:** a reschedule to a date whose Slot holds no List (it
       lands in the unmatched queue), so "Next morning" shows a scheduled pull with an exception.
     No synced row carries an estimated duration or a Contract (the download is not comprehensive,
     OQ-13's 2026-10-01 note); Phase 33's default Contract and Phase 27's office entry cover them.
     Rows at 07:30 to 07:45 arrive with the first pull on open at 08:00; rows at 08:30 and 08:40 arrive
     with the 09:00 scheduled pull. None targets the Tue 21 design-day Lists, the S2 Lists (Sharma Tue
     21 PM, Rutherford Wed 22 AM, the Review queue Lists), the S3 Mon 20 Lists, the S4 Lists (Riley Fri
     24, Ropata Thu 16, Sharma Tue 14) or David Chen's S5 Booking.
   - Vitest `syncSchedule.test.ts` and `syncFixtures.test.ts`: the schedule's instants on one day
     (07:00, 09:00, ..., 19:00); a 15-minute advance that does not cross an instant returns none; 08:00
     to 09:00 returns one; a seven-day jump returns every instant; `nextScheduledPull` at 19:30 is 07:00
     the next day; availability windows are half-open so no row is pulled twice; ids unique; no row
     text contains an en or em dash.

2. **Sync state and demo settings in the model (`domain/types.ts`, seed, store slice).**
   - Types: `SyncTrigger = 'scheduled' | 'open' | 'manual'`; `SyncAttempt { atISO, trigger,
     outcome: 'ok' | 'failed', rows: number, error?: string, requestedBy?: string }`;
     `HospitalSyncState { hospitalId, pulledThroughISO, lastSuccessAtISO?, lastAttempt?: SyncAttempt,
     recent: SyncAttempt[] }` (`recent` newest first, capped at 8, so persisted size stays flat).
   - Store it beside Phase 33's import rows (planned `intake.sync: Record<HospitalId,
     HospitalSyncState>`), for St George's and Southern Cross only. Seed: `pulledThroughISO` and
     `lastSuccessAtISO` at 2026-07-21T07:00 (the 07:00 scheduled pull), one `recent` entry each
     (`scheduled`, ok, 0 rows, if Phase 33 seeded no STG or SX rows; otherwise the count it seeded).
   - `DemoSettings` gains `failNextSync?: HospitalId[]` and `autoMatchDemo?: boolean` (absent reads as
     off). Reset clears both.
   - Bump `PERSIST_VERSION` by one here, and once more at the start of session 2 if it runs as a
     separate session (items 12 and 14 change the seed again); extend
     `persistMigrate.test.ts` (an older version reseeds; the current version backfills the new
     fields through `backfillMerge`).

3. **The sync store actions (`src/store/hospitalSyncActions.ts`, exported from `src/store/index.ts`).**
   All writes through `mutate()`, timestamps from the demo clock.
   - `HOSPITAL_SYNC_ACTOR` (`{ who: 'Hospital sync', role: 'system', source: 'integration' }`) in
     Phase 14's `src/store/demoActors.ts` or beside it.
   - `syncHospital(api, requestedBy: Actor | null, hospitalId, trigger): Outcome<{ outcome: 'ok' |
     'failed' | 'upToDate'; rows: number }>`:
     - refuses a hospital outside `INTEGRATED_HOSPITALS`, Christchurch Public included ("Only St
       George's and Southern Cross are integrated. Import other providers' sheets by hand.");
     - if `settings.failNextSync` holds the hospital, consumes that one flag and records a failed
       attempt (`error`: "Connection to St George's timed out (simulated)"), leaving
       `pulledThroughISO` and `lastSuccessAtISO` unchanged, so nothing is lost;
     - otherwise takes `rowsAvailableBetween(hospitalId, pulledThroughISO, now)`, hands them to Phase
       33's `stageImportRows` as one batch (a new channel value `'sync'` added to Phase 33's channel
       union, micro-cap "Sync" on the matching table; label "St George's sync, 08:00"; the trigger in
       `extras`), moves `pulledThroughISO` to now, sets `lastSuccessAtISO`, and records the attempt.
       A zero-row pull stages no batch. Booking source stays `hospitalDownload` (Phase 33 decision 7);
       Phase 33's dedupe still applies, so a row also hand-imported is never staged twice;
     - **on-open idempotence:** an `'open'` pull whose hospital already has a successful attempt at the
       same demo-clock instant is `upToDate` and writes nothing (React StrictMode mounts twice, and the
       demo clock does not move on its own). `'manual'` and `'scheduled'` always record an attempt,
       including a zero-row one.
     - audit: `intake.sync` (entity `hospitalSync`, id the hospital id, `after: { trigger, rows,
       requestedBy }`) or `intake.syncFailed` (`after: { trigger, error }`), in the same commit as the
       staged rows. Never writes a Booking, List or Patient: no silent apply (US-02.1.5 AC "No silent
       apply"). A hospital row about a locked List is staged like any other; Phase 33's decision
       rules handle it.
   - `syncIntegratedHospitals(api, requestedBy, trigger)`: both hospitals, returns both outcomes.
   - `armSyncFailure(api, actor, hospitalId)`: the demo setting, audited `demo.syncFailureArmed`,
     copying `armHandoffFault`'s pattern.
   - Selectors: `hospitalSyncStatus(state, hospitalId)` (derived `'synced' | 'failed'`, last success,
     last attempt, rows waiting from its latest batch), `rowsAwaitingPull(state, hospitalId)`,
     `failedSyncCount(state)`.
   - Satisfies US-02.1.5 AC "Manual sync" (via item 6), "Last sync" and "No silent apply".

4. **The scheduled pull on the demo clock.**
   - `events.ts`: add `{ type: 'clockAdvanced'; from: DemoClockState; to: DemoClockState }`;
     `applyClock` emits it on every change, after the canvas roll and `dayAdvanced`, so a pull on a new
     day sees the rolled canvas. Existing listeners ignore it. `resetDemo` sets the clock through
     `resetDomainState`, not `applyClock`, so a reset emits nothing and never pulls (keep it so; the
     wired job also ignores any `to` not after `from`).
   - `wireHospitalSync(api)` (in `hospitalSyncActions.ts`, the `wireArchiveJob` pattern over
     `onAppEvent`): on `clockAdvanced`, if
     `scheduledPullsBetween(from, to)` is non-empty, run one `syncIntegratedHospitals(api, null,
     'scheduled')` at the new time. A jump across several scheduled times runs one catch-up pull, not
     one per instant (say so in the code comment and the discovery note). Returns the unsubscribe.
   - `advanceToNextScheduledPull(api)` (`clockActions.ts`): `advanceClockMinutes` to
     `nextScheduledPull`; the wired job then pulls. The trigger (item 7) calls this.
   - Wire it in `src/main.tsx` and `pwa/main.tsx` after the existing four jobs, and in no test by
     default (tests call `syncHospital` directly or wire it explicitly).
   - Vitest `hospitalSync.test.ts`: `syncHospital` refuses Christchurch Public and every hospital
     outside the two; first pull stages the three 07:30 to 07:45 rows once; a second
     pull at the same instant stages none; arm then sync records a failed attempt with the cursor
     unchanged, and the next sync catches up every row; the flag is consumed once; with the job
     wired, `+15 min` from 08:00 pulls nothing and `+1 hour` pulls the 08:30 and 08:40 rows; a jump to
     28 Jul runs exactly one pull per hospital; audit rows carry trigger, rows and labels; no Booking,
     List or Patient changes in any case; determinism (same actions, same state) and reset restores
     the seeded sync state.

5. **Intake becomes the one Admin home for in-scope intake (RV-05).**
   - Routes (adjust to what Phase 33 built; keep one nav item): `/admin/intake` redirects to
     `/admin/intake/matching`; `/admin/intake/matching` (Phase 33's matching screen), `/admin/intake/pdfs`,
     `/admin/intake/quality`, `/admin/intake/validators`. Tabs become URL-routed (path segments are
     navigation, per the house rule), with `selection-slide`. `/admin/integrations` and Phase 33's
     `/admin/matching` redirect with `replace`, so bookmarks and the capture recipes keep working.
   - Side nav: Phase 33's `'matching'` section and the `'integrations'` section merge into one
     `'intake'` section, labelled "Intake", in Matching's place directly under Day view (the priority
     pathway stays near the top). Update `NavSection` (`SideNav.tsx`), `sectionForPath` and
     `SECTION_PATH` (`AdminApp.tsx`). Its amber badge is Phase 33's `matchingAttentionCount` plus
     `failedSyncCount`; it no longer counts HL7 dead-letter or manual-intervention messages
     (`integrationAttentionCount` leaves the badge; keep or delete it with its callers).
   - Re-point everything Phase 33 aimed at `/admin/matching` to `/admin/intake/matching`: its two bar
     triggers (`matching-send-unmatched-row`, `matching-reschedule-no-list`: routes and `indexPath`),
     the Booking detail's "From hospital row" link, and its `screens.spec.ts` entry.
   - Header copy (no en or em dashes): "Hospital bookings arrive by sync from St George's and Southern
     Cross, or from other providers' daily sheets imported by hand, and wait here for your decision.
     Surgeon PDFs are read, corrected and ingested." Remove the HL7, FHIR, retry and dead-letter
     sentence.
   - `MessagesTab` and `FeedConfigTab` leave `IntegrationMonitorScreen.tsx` (item 8). The screen file is
     renamed to `IntakeScreen.tsx` (or split into one file per tab) and its header comment corrected.
   - Phase 14's context: drop the `integrations.tab` key (the URL now carries the tab) and add a new
     `intake.openPdfId` key to `DemoContextValues`, published by the Surgeon PDFs tab through
     `useDemoTriggerContext`. Re-point `ingest-pdf-row` to route `/admin/intake/pdfs`, drop its `when`
     guard, and read the open PDF from context (falling back to the first inbox item) and the inbox
     from state (item 14).

6. **The sync header on the matching screen (product UI).**
   - Phase 33's header line gives way to item 5's Intake header copy; its teal **Import hospital
     download** button stays (the hand-import path for the other providers), and its stats strip and
     table stay below the new tiles. Its empty state becomes "No rows waiting. The next sync or an
     imported sheet will land here."
   - A row of two sync tiles above Phase 33's stats strip, in the Admin Review KPI-strip anatomy, one per
     integrated hospital: micro-caps hospital name, "Last synced 08:00" in mono (`value-tick` when it
     changes), a pill ("Synced", success tint; "Last sync failed 09:00", error tint, with the error on
     hover and in the history), and "N new rows" from its latest batch, which filters the list to them.
     A small "History" disclosure lists `recent` (time, how it ran: Scheduled, On open, Sync now;
     outcome; rows).
   - A teal **Sync now** button (runs `syncIntegratedHospitals(api, office, 'manual')` and shows the
     result inline: "St George's: 1 new row. Southern Cross: up to date."). One line beneath in slate:
     "Scheduled pull every 2 hours, 07:00 to 19:00 · provisional (OQ-13). Next at 09:00." plus the
     OQ-13 delivery sentence from the drift check.
   - **Pull on open:** the matching route runs `syncIntegratedHospitals(api, office, 'open')` in an
     effect on mount (item 3 makes a StrictMode double mount a no-op). US-02.1.5 AC "Pull on open".
   - Newly staged rows enter with the `bannerIn` motion and a "New" chip until the admin decides or
     leaves the screen; reduced motion gets the 80ms fade.
   - A "Other providers · daily sheets imported by hand" strip (right-rail card style) lists Forte
     Health, Christchurch Eye Surgery, Burwood, Southern Endo and McMurray Centre with "Last imported"
     from their batches (or "None today"), so the manual baseline of FT-02.1 and FT-14.6 is visible.
     The rows themselves arrive in session 2 (item 12).
   - `data-shot` hooks: `sync-tile-<hospitalId>`, `sync-now`, `sync-history`, `other-providers`.

7. **Sync triggers in the registry (Phase 14's registry only; bodies in `src/store` or
   `src/shared`, so `pwaPurity` holds).**
   - `simulate-scheduled-pull`, "Simulate scheduled pull" (Admin · Intake · Matching, route
     `/admin/intake/matching`, bar): `advanceToNextScheduledPull`. Message names the new time and each
     hospital's result ("Clock moved to 09:00. Scheduled pull: St George's 1 new row, Southern Cross 1
     new row."). Never disabled (the clock only moves forward).
   - `fail-next-sync`, "Fail next sync" (same route, bar): `choices` St George's and Southern Cross;
     `armSyncFailure`. Disabled for a hospital already armed ("Armed"). Message: "The next St George's
     sync will fail. Press Sync now or Simulate scheduled pull."
   - Re-point Phase 14's `fire-hospital-message` and `replay-hospital-message` to the Future-scope
     surface routes only (item 8's `/demo/integrations...`), bar only (Phase 33 already dropped the
     `pwa` surface); remove the Admin and Mobile Lists patterns. They keep `badge: 'future-scope'`, and
     Phase 33's description ("Stages the hospital's row on Admin, Matching...") changes to name Admin,
     Intake.
   - Registry tests: the two new entries appear only on the matching route; Phase 33's two matching
     entries follow it to `/admin/intake/matching`; the HL7 entries appear only on the Future-scope
     routes; every label and description free of en and em dashes; each `indexPath` matches its own
     routes.

8. **The Future-scope demo surface (RV-05, RV-06).**
   - `/demo/integrations` becomes "Future scope: HL7 and FHIR" (label in `APP_CONFIG`, same icon, same
     demo group; the path is kept for bookmarks and recipes), with three sub-routes:
     `/demo/integrations` (the existing simulator, unchanged in behaviour), `/demo/integrations/log`
     (the moved `MessagesTab`: message log, retry counts, dead-letter, Reprocess) and
     `/demo/integrations/mapping` (the moved `FeedConfigTab`). Move the two components into
     `src/apps/demo/futureScope/` unchanged in behaviour.
   - The `DemoSurface` header carries `DemoBadge tone="future"` and one line: "HL7 v2, FHIR R4, near
     real time messaging, retries with a dead-letter queue and per-hospital field mapping are Future
     scope, shown here for discussion. In scope today: the St George's and Southern Cross sync, hand
     imported daily sheets and surgeon PDFs on Admin Intake. Surgeon PDFs stay needed even once feeds
     arrive, because the hospital download is not comprehensive." Each sub-panel repeats the badge at
     its top. Remove the interim per-tab badges Phase 14 put on Admin.
   - **Christchurch Public stops being a live feed (US-02.1.5, Contradicts).** It is not in
     `INTEGRATED_HOSPITALS`, gets no sync tile, no sync state and no sheet, and no in-scope surface
     (Admin, mobile, web, PWA, the Control Panel scenario text) names a Christchurch Public feed; its
     bookings are entered by hand like any other non-integrated hospital. On the Future-scope surface
     its feed picker entry and mapping panel read "Christchurch Public · not integrated today · example
     of a further feed (Future Work, US-14.6.1)". Its messages, mapping and `CPH_NHI_FIX` stay as data
     for the mapping-fix discussion, unchanged, but the Live drip no longer offers it (the one change to
     the simulator: `DemoIntegrations.tsx` filters `FEED.cph` out of the drip's feed list; firing one
     CPH message by hand still works). A CPH message fired here stages through Phase 33's re-pointed
     `processMessage` like any fired message, its batch labelled "Future-scope HL7 demo · Christchurch
     Public", so it never reads as an in-scope pull. Keep `HOSP.cph` in the seed (its Lists and
     holidays are unchanged). Vitest: no registry entry outside the Future-scope routes names CPH; the
     drip's feed list excludes it.
   - Do not extend the simulator, the message model, `MAX_ATTEMPTS` or `wireIntegrationRetry`. A
     message fired here lands as a row on the matching screen, through Phase 33's re-pointed
     `processMessage`; say so in one line on the simulator ("Fired messages land on Admin Intake as rows
     for the office to decide.").
   - The Keycloak and Digital Services Hub callout stays, reworded to keep NHI lookup (FT-14.4) clearly
     in scope and the rest Future.
   - The Control Panel index lists the Future-scope entries under "Future scope: HL7 and FHIR".
   - `pwaPurity.test.ts`: nothing from `src/apps/demo/futureScope/` reaches the PWA closure.

9. **The handset stand-in (PWA parity for S1).** Re-point Phase 33's PWA entry
   `matching-office-matches-row` (keep its id) to **"Hospital sync delivers my booking"** (Mobile ·
   Lists, patterns `/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`;
   `surfaces: ['pwa']`; `badge: 'office-stand-in'`). Its S1 choice ("Sarah Mitchell, Tue 28 Jul AM
   (S1)", which staged `SAMPLE_STG` R1 alone) is replaced by the sync body below; keep its second
   choice ("A new hospital booking on this List") unchanged. The body stays in Phase 33's
   `src/store/matchingDemo.ts` (`officeMatchesHospitalRow`), so `pwaPurity` holds:
   - body: `syncIntegratedHospitals(api, SIMULATED_OFFICE_ACTOR, 'open')` (the office opening Intake),
     then `decideImportRow` as `SIMULATED_OFFICE_ACTOR` with `suggestDecision`'s decision for each
     staged row whose suggestion is a confident "Create Booking" or "Match" onto a List owned by the
     persona (on a List route, only that List). Exceptions are left for the office.
   - disabled when there is nothing to pull or decide for this anaesthetist ("Nothing new from the
     hospitals for your Lists"); pure, from `rowsAwaitingPull` and Phase 33's pending selector.
   - message: "St George's synced at 08:00. The office created Sarah Mitchell's Booking on Tue 28 Jul
     AM." (built from the result, not hardcoded).
   - Vitest for the entry; `visual/pwa-device.spec.ts`: on the Tue 28 Jul AM List, the Demo chip, the
     stand-in, and a fourth Booking.

10. **S1 rebuilt in the app.** Control Panel `SCENARIOS` S1 (`DemoControlPanel.tsx`):
    - title "S1 · Booking to theatre", blurb "A St George's booking arrives by sync, the office
      matches it onto a booked List, then it captures live on procedure day.";
    - run: `resetDemo` only (the seeded sync state is the S1 stage);
    - message: open Mobile to introduce the Tue 28 Jul AM List (three booked cases), open Admin Intake
      (the pull on open brings St George's and Southern Cross rows), create Sarah Mitchell's Booking
      from her row, return to Mobile for the fourth Booking, then "Procedure day · 28 Jul" and capture
      code 20950. Optional: "Simulate scheduled pull" and "Fail next sync" from Demo actions. Remove
      Phase 14's Future-scope caveat and the MSG-STG-1001 instruction;
    - nav: "Go to Mobile app", "Go to Admin Intake" (`/admin/intake/matching`).
    - `demoScenarios.test.ts`: after reset, one `'open'` sync stages Sarah Mitchell's row with the
      proposal on Souter's Tue 28 Jul AM List; deciding it creates a Booking at 08:30 with source
      `hospitalDownload`, the reused patient (CQY9304) and the default Contract; the List reads 0 of 4
      complete and stays DRAFT; S2 to S5 seed pins still hold.

11. **Re-green session 1.** Update `visual/phase11.spec.ts` and `visual/screens.spec.ts` for the Intake
    routes and the moved tabs; update `visual/phase12.spec.ts` (S1 now runs sync on open, then the
    decision, not a hand import) and Phase 33's `visual/admin-matching.spec.ts` (a reset screen is no
    longer empty once the pull on open runs, and importing `SAMPLE_STG` now reports R1 as already
    imported); add `visual/intake-sync.spec.ts` (tiles show "Last synced 08:00" after
    open; Sync now; Fail next sync on St George's then Simulate scheduled pull shows the failed pill
    while Southern Cross syncs; Sync now recovers and the missed row arrives). Then
    `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`, all green. Walk S1 in the
    browser and patch the S1 run sheet (see Demo guide updates). The capture recipes move to item 17
    (the redirects keep them working meanwhile). **Stop here if the session ends**; record a
    checkpoint in PROGRESS (status IN PROGRESS).

### Session 2: manual-provider sheets, auto-match and surgeon PDF upload

12. **The three missing providers and their daily sheets (FT-14.6 baseline, FT-02.1).**
    - `domain/seed/cast.ts`: **append** `HOSP.burwood` ("Burwood"), `HOSP.southernEndo` ("Southern
      Endo") and `HOSP.mcmurray` ("McMurray Centre") to `HOSP` and `HOSPITALS`, with Phase 17's contact
      email. Appending keeps every existing id and RNG draw: `ADHOC_HOSPITALS` and the recurring bookings are
      untouched, and `HOSPITAL_HOLIDAYS` gains rows for the new hospitals only after the existing ones.
      Prove the canvas is byte-identical (Lists and their ids unchanged) in the seed tests.
    - One daily sheet per provider, all in Phase 33's `HOSPITAL_DOWNLOAD_SAMPLES` library (channel
      `manualSheet`, Phase 33's entry shape), so the product "Import hospital download" dialog and the
      trigger offer the same files. `domain/intake/dailySheets.ts` exports `MANUAL_PROVIDER_SHEETS`,
      the provider-to-sample map over that library (Phase 40 reads it), not a second copy of the rows:
      - Forte Health: **reuse Phase 33's `SAMPLE_FORTE_SHEET`** (new row, mistyped NHI, unmatched row);
        do not author a second Forte sheet. If it has no changed-time row, add one (a field
        difference on an existing Forte Booking) and re-pin Phase 33's fixture test.
      - Christchurch Eye Surgery (sends daily sheets today): 3 to 4 new rows against real seeded Lists
        at that hospital in the next 10 days, preferring non-Souter Lists so they do not collide with
        S1, the two PDF samples or any scripted beat; at least one row matches an existing Booking with
        a changed time (a field difference), one is new.
      - Burwood (outsourced private plastics and orthopaedics) and Southern Endo: 2 to 3 rows; no List
        exists at these hospitals, so the rows land in Phase 33's unmatched queue and show "Create List
        in a Slot" or "Draft List" (Phase 31: every row carries the surgeon, hospital, day and session
        a Draft List requires, so the Draft List path is never refused for a missing field).
      - McMurray Centre (only a couple of Lists): 1 to 2 rows, one with no NHI (a handoff to Phase 40's
        missing-NHI list; before 40 it follows Phase 33's rule for a row without an NHI).
    - `deliverDailySheet(api, actor, providerId)` (`hospitalSyncActions.ts`): a thin wrapper over
      Phase 33's `importHospitalDownload` for that provider's sample (one batch, channel
      `manualSheet`, the same staging and dedupe), plus an `intake.sheetImported` audit meta in the
      same commit. Refuses a sheet already imported (a batch with that `sampleId` exists: "Already
      imported today"). Refuses St George's and Southern Cross ("Synced automatically").
    - The "Other providers" strip now shows each provider's last import.
    - Vitest: each sheet stages once; Burwood rows land unmatched; a Forte row shows a field
      difference; nothing is applied; the audit row is labelled.

13. **The demo-only auto-match toggle (FT-14.6's later phase, US-14.6.2, Future Work).**
    - Pure `domain/intake/autoMatch.ts`: `isAutoMatchEligible(row, proposal, state)`: only a "modify"
      row whose changes are time or notes, with exactly one confident Booking match on a DRAFT List,
      no double-booking or disappearance flag and no conflict. New patients, cancellations, reschedules,
      unmatched rows and anything on a SUBMITTED or AUTHORISED List are never eligible. Vitest per case.
    - `setAutoMatchDemo(api, actor, on)`: audited `demo.autoMatch`. When on, the staging path (sync and
      sheets alike, one shared hook after staging) applies each eligible new row at once through Phase
      33's decision action as `AUTO_MATCH_ACTOR` (`{ who: 'Auto-match (demo, Future scope)', role:
      'system', source: 'integration' }`), keeping the row, its diff and "Applied by auto-match" on the
      matching screen. It never touches rows that were already waiting when it was switched on.
    - While on, the matching screen shows a banner with `DemoBadge tone="future"`: "Auto-match is on.
      Routine time changes that match one Booking exactly are applied on arrival; everything else waits
      for you. This is a later phase (Future Work), shown for discussion." Default off; reset turns it
      off.
    - Vitest: off, nothing applies; on, the 08:30 St George's time change applies after the 09:00 pull
      and the Southern Cross cancellation stays pending; the audit shows the auto-match actor.

14. **Surgeon PDFs: the inbox becomes state, with Upload PDF (US-02.2.1).**
    - Split `pdfSamples.ts` into a library `SURGEON_PDF_LIBRARY` (content, facsimile and rows stay in
      the domain constant, never persisted) and state: `SurgeonPdfInboxItem { id, sampleId,
      receivedAtISO, receivedBy, uploaded: boolean }` in the intake slice (planned
      `intake.surgeonPdfs`), with a new counter key. Seed the two existing PDFs as received emails at
      2026-07-20T16:40 and 2026-07-21T07:15 (replace the `receivedLabel` strings, which post-date the
      seed clock; the label is derived from `receivedAtISO`).
    - `PdfRow` gains `estimatedDurationMin?: number`, the figure the rooms print on their list
      (US-06.2.5). `buildFacsimile` draws it as an "Est." column ("90 min", blank when absent), so the
      facsimile and the extracted rows agree. Existing samples: give most rows a figure and leave one
      blank on each PDF (the rooms do not always send one). On the Okafor PDF the blank one is R1 (Sarah
      Mitchell, the update-path row), so ingesting it never changes a scripted Booking's duration; the
      deliberate bad-NHI row keeps its error and gains a figure.
    - Add two upload-only samples to the library: one from a surgeon's rooms at Southern Cross (Mr
      Doyle) whose rows include a missing DOB, an ethnicity code outside the NZHIS set and a
      mis-read estimated duration (900 minutes for a 90-minute case, the kind of slip extraction makes,
      which the review must correct), and one from Southern Endo; rows targeting real seeded Lists,
      off every scripted beat. If Phase 27's seed has an anaesthetist with a prepaid set working at
      Southern Cross, one Doyle row is a prepaid code on that anaesthetist's List with a paying patient
      and a duration, so ingesting it shows 27's estimator working from the PDF's figure (the
      prepayment invoice generated and waiting for admin approval, D6). Pin it; if no such List exists
      off the scripted beats, skip this row and say so in PROGRESS.
    - `uploadSurgeonPdf(api, actor, sampleId)`: adds an inbox item received now, audited
      `intake.pdfUploaded`; refuses a sample already in the inbox ("Already in the inbox").
    - UI: a teal **Upload PDF** button in the Surgeon PDFs header opens a picker (dialog, desktop)
      headed `DemoBadge label="Simulated upload · sample PDFs"`, listing the samples not yet in the
      inbox with surgeon, hospital and row count. Choosing one adds it as "Received just now", shows a
      brief "Reading the PDF" state (UI only, about 900ms, 80ms fade under reduced motion; the store
      state is immediate), then opens its review. No real file input, no `FileReader`, no parsing.
    - The inbox lists state items, newest first, with the derived received label.

15. **DOB, ethnicity and estimated duration editable in review (US-02.2.1 AC "Correction before
    ingest"; US-06.2.5 and DM-40 through Phase 27's field).**
    - Pure `validatePdfRow(row, todayISO)` in `domain/intake/`: NHI via `validateNhi`; DOB must be a
      valid date not after today (the missing or future DOB refuses with a reason); ethnicity via
      `validateEthnicityCode` returns a verdict, not a refusal: a code outside the set is ingested and
      held in Data quality by `upsertPatient`'s existing quarantine; estimated duration is optional,
      and when present must pass Phase 27's bounds (a whole number of minutes, 5 to 720 as planned;
      import 27's bounds; if 27 inlined them in `setEstimatedDuration`, export a named constant from 27's module and use it in both places rather than restating the numbers), else it refuses with a reason. Vitest per case.
    - `PdfReview` adds `RowField`s (from wherever Phase 33 moved `RowField`) for DOB (date input),
      Ethnicity (code, mono) and **Est. duration** (minutes, mono, "min" suffix) beside NHI, Name, Time
      and Operation, with live verdicts: "DOB missing. Add it before ingesting." (error tint), "Outside
      the NZHIS set: will be held in Data quality for correction" (warning tint), "Enter one figure in
      minutes, 5 to 720" (error tint, on the mis-read 900) and, for a blank duration, a slate hint "No estimate from the rooms.
      The office can add it on the Booking later." (never a block: the duration is optional).
    - `ingestPdfRow` calls `validatePdfRow` and refuses an invalid DOB or duration in the store, not
      only in the UI. The create path passes the corrected DOB and ethnicity, and writes the duration to
      the created Booking's primary Procedure through Phase 27's setter, as the same office actor
      (inside the create's commit if 27's setter can join it, otherwise straight after it, as one
      outcome). The update path (an NHI already on the List) keeps its time and operation behaviour,
      notes that DOB and ethnicity edits apply only to new patients, and writes an entered or changed
      duration to the matched Booking's primary Procedure through the same setter; a blank duration
      never clears an existing figure. Either way 27's setter runs 27's prepayment re-check, so the
      estimate follows the rooms' figure. This phase adds no second duration field, no estimator logic
      and no prepayment rule.
    - Vitest: a corrected DOB creates the patient with it; a bad ethnicity lands in Data quality; the
      mistyped NHI row still refuses until corrected; a row with 90 minutes creates a Booking whose
      primary Procedure reads 90 through 27's field, audited `procedure.estimatedDuration` (27's code)
      beside the ingest; a blank duration ingests with none; 0 or 721 refuses, and Doyle's 900 refuses
      until corrected to 90; the update path
      sets the figure on the existing Procedure and leaves it unchanged when blank; the prepaid Doyle
      row (if seeded) leaves 27's estimate built from 90 minutes.

16. **Session 2 triggers.** Register (bar, route `/admin/intake/matching`):
    - `deliver-hospital-sheet`, "Deliver hospital sheet": `choices` the five providers; the body is
      `deliverDailySheet`; disabled per choice when already imported ("Already imported today"). The
      description says it simulates the sheet arriving and being imported by hand.
    - `auto-match`, "Auto-match (Future scope)": `choices` "Turn on" and "Turn off", disabled for the
      current state; `badge: 'future-scope'`.
    - `ingest-pdf-row` (re-pointed in item 5) reads the inbox from state and ingests the row with its
      printed estimated duration, through the same `ingestPdfRow` path; the Upload PDF picker is a
      product action with a badged sample picker, not a bar entry.

17. **Close-out.** Capture recipes (moved from item 11): point those that open `/admin/integrations`
    tabs (FT-02.2, US-02.2.1, US-02.2.2, US-11.1.2) and those Phase 33 aimed at `/admin/matching`
    (US-02.1.1 to US-02.1.4, US-02.5.1 to US-02.5.4) at the Intake routes, and those that show the
    message log or mapping (US-14.1.1, US-14.2.1, US-14.3.1, US-14.5.1) at the Future-scope routes;
    add a `US-02.1.5.json` recipe (the two sync tiles after the pull on open, and a failed tile) in the
    format of `US-02.1.2.json`; update ATLAS.md; run `npm run verify:board`. Update `aa-prototype/README.md` (the Intake routes, the Future-scope surface, the
    sync job among the wired jobs, the demo settings). Add every new audit code to `ACTION_LABELS`
    ("Hospital sync", "Hospital sync failed", "Next sync set to fail (demo)", "Daily sheet imported",
    "Surgeon PDF uploaded", "Auto-match switched (demo)"); `auditNarrative.test.ts` enforces it.
    Finish green, run the adversarial review, patch the demo guide, write PROGRESS.md.

## Demo triggers

Everything this phase adds or re-points in the harness bar (framed build) and the PWA sheet:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Simulate scheduled pull | Admin · Intake · Matching | bar | Advances the demo clock to the next scheduled pull (09:00 from the seed); the wired job pulls St George's and Southern Cross and new rows arrive, marked New |
| Fail next sync | Admin · Intake · Matching | bar | Choose a hospital; its next sync (Sync now, on open or scheduled) records a failed attempt, the tile shows "Last sync failed", nothing is pulled, and the next good sync catches up |
| Deliver hospital sheet | Admin · Intake · Matching | bar | Choose Forte Health, Christchurch Eye Surgery, Burwood, Southern Endo or McMurray Centre; that provider's daily sheet arrives and is imported by hand as a batch of rows (matched, with differences, or unmatched) |
| Auto-match (Future scope) | Admin · Intake · Matching | bar | Turns the demo-only auto-match on or off; while on, routine time changes that match one Booking exactly are applied on arrival and a Future-scope banner shows |
| Ingest PDF row (re-pointed) | Admin · Intake · Surgeon PDFs | bar | As Phase 14, reading the inbox from state and the open PDF from `intake.openPdfId`; the row's printed estimated duration goes into Phase 27's per-Procedure field |
| Fire hospital message, Replay last message (re-pointed) | Future scope: HL7 and FHIR (all three routes) | bar | Unchanged bodies, now only on the Future-scope surface; a fired message lands as a matching row. Christchurch Public is offered only as a labelled "not integrated today" example and is not in the Live drip |
| Hospital sync delivers my booking (re-pointed from Phase 33) | Mobile · Lists, List, Booking | PWA only | The office stand-in: syncs both hospitals as the office opening Intake, then creates or matches the confident rows for this anaesthetist's Lists; exceptions stay with the office |

Product actions stay on the screen, not in the bar: **Sync now** (teal, on the matching screen) and
**Upload PDF** (teal, on Surgeon PDFs, opening a picker badged "Simulated upload · sample PDFs").
Pull on open needs no trigger: opening the screen is the trigger.

PWA equivalents: the only mobile side of this phase is S1's "the booking reaches my List", covered by
the stand-in above. The matching screen, Surgeon PDFs and the Future-scope surface do not exist in the
PWA.

## Out of scope

- Real transport, file formats or cadence for the sync (OQ-13); real file upload, PDF parsing or OCR.
- Extending the HL7/FHIR simulator, the message model, the retry engine or feed mapping in any way; the
  Christchurch Public feed stays only on the Future-scope surface, relabelled and out of the Live drip
  (item 8), and is never synced.
- The prepayment estimator, its contingency units and its rules (Phase 27; OQ-38, OQ-75), and any
  estimated duration on a synced or hand-imported hospital row (the download does not carry one; a
  row-borne duration would wait on OQ-13). This phase only lets the PDF review fill 27's field.
- Feeds for the five other providers (US-14.6.1) and real automatic matching (US-14.6.2): both Future
  Work; only the badged demo toggle is built. Hospital-supplied Contracts on a row (US-04.3.6, OQ-22,
  Future Work).
- Phase 33's matching rules, decisions, field differences and unmatched queue: reused, not changed,
  except for the `'sync'` channel value, the staging hook the auto-match toggle needs, and the route
  move into Intake.
- Draft List mechanics (31), explicit save and the update email (35), the missing-NHI problem list and
  the unpaid-balance warning (40, mild under the threshold and strong over it, always waved through;
  note that S1's Sarah Mitchell has an unpaid prior balance that 40's warning will surface), the restricted raw-row view and scale (43), editing the new hospitals as masters (42).
- The web app: nothing changes there.
- The full S1 to S5 rewrite and master-guide regeneration (44). This phase rebuilds S1 and patches the
  beats it breaks.

## Manual test checklist

- [ ] Fresh reset, open Admin: the side nav shows one "Intake" item under Day view (no "Integrations", no separate "Matching"); `/admin/integrations` and `/admin/matching` land on `/admin/intake/matching`; Phase 33's Send unmatched row and Reschedule to a date with no List still appear there.
- [ ] Importing the St George's sample by hand after the pull on open reports Sarah Mitchell's row as already imported (no duplicate row).
- [ ] Opening the matching screen runs a pull: both tiles read "Last synced 08:00", St George's shows 2 new rows (Sarah Mitchell and the new-format NHI patient), Southern Cross 1; the Audit viewer shows one "Hospital sync" row per hospital with "On open" (not two, even in dev StrictMode).
- [ ] Mobile Lists before any decision: Tue 28 Jul AM still shows three bookings (no silent apply).
- [ ] Deciding Sarah Mitchell's row creates her Booking at 08:30 on Dr Souter's Tue 28 Jul AM List with the default Contract and source "Hospital download"; Mobile then shows four bookings, 0 of 4 complete, the List DRAFT.
- [ ] Sync now at the same time shows "up to date" for both hospitals and records a manual attempt in History.
- [ ] Demo actions on the matching screen lists Simulate scheduled pull, Fail next sync, Deliver hospital sheet and Auto-match (Future scope), each badged; none of them appears on the Day view or on Surgeon PDFs.
- [ ] Fail next sync (St George's), then Simulate scheduled pull: the clock reads 09:00, St George's shows "Last sync failed 09:00" in error tint with the error in History, Southern Cross pulls its 08:40 row; the Intake badge counts the failure. Sync now then recovers St George's and its 08:30 row arrives with its field difference.
- [ ] Clock "+15 min" does not pull; "Next morning" runs one scheduled pull and the Wed 22 reschedule lands in the unmatched queue; "Procedure day · 28 Jul" runs one catch-up pull, not dozens.
- [ ] Deliver hospital sheet: Forte shows a matched row with a time difference and a new row; Burwood's rows land unmatched and offer Create List or Draft List; a second Burwood delivery is disabled "Already imported today"; the Other providers strip shows each last import.
- [ ] Auto-match on: the banner shows with the Future scope badge; after the next scheduled pull the St George's time change reads "Applied by auto-match" and the cancellation still waits; Auto-match off stops it; reset leaves it off.
- [ ] Surgeon PDFs: Upload PDF opens the badged sample picker; choosing Mr Doyle's PDF adds it as "Received just now", shows "Reading the PDF", then opens review; uploading it again is refused.
- [ ] In review, the missing DOB blocks ingest with a reason until entered; the out-of-set ethnicity code ingests and the patient appears in Data quality; the mistyped NHI still blocks until corrected; the Okafor PDF's Sarah Mitchell row still updates rather than duplicates.
- [ ] Estimated duration: the facsimile's Est. column matches the review rows; Doyle's mis-read 900 shows the error and blocks ingest until corrected to 90; the ingested Booking's primary Procedure shows 90 minutes in Phase 27's Estimated duration row (no second duration anywhere) and the audit shows 27's "Estimated duration recorded"; a blank duration ingests with the slate hint and no figure; re-ingesting a matched row with a new figure updates it, a blank never clears it. If the prepaid Doyle row is seeded, its prepayment estimate uses 90 minutes and the invoice waits for admin approval.
- [ ] Future scope: HL7 and FHIR (app switcher): the header badge and line (naming surgeon PDFs as in scope); Simulator, Message log and Feed mapping sub-routes work as before; firing MSG-STG-1001 lands a row on Admin Intake (after the S1 sync has staged Sarah Mitchell, Phase 33's dedupe may count it as already imported if the fields match; either outcome stages nothing twice and applies nothing); Admin has no Messages or Feed config tab left.
- [ ] Christchurch Public is no longer a live feed: no sync tile or History entry for it on Intake; Live drip does not offer it; its feed entry reads "not integrated today"; firing MSG-CPH-2001 by hand lands a row in a batch labelled "Future-scope HL7 demo · Christchurch Public"; nothing in Admin, mobile, web, the PWA or the Control Panel scenario text calls it a feed.
- [ ] Control Panel: the S1 jump message and nav buttons follow the new beats, with no Future-scope caveat; the index lists the new entries under Admin · Intake and the HL7 entries under Future scope.
- [ ] PWA (`npm run dev:pwa`, fresh storage): on the Tue 28 Jul AM List the Demo chip offers "Hospital sync delivers my booking"; running it adds Sarah Mitchell as a fourth booking; a second run is disabled "Nothing new from the hospitals for your Lists".
- [ ] S1 walked end to end from the run sheet in the framed build; S4 Beat 4 and S5 Beat 2 walked as patched.
- [ ] No en or em dash in any new app copy; teal only on Sync now, Upload PDF and Run buttons; no crimson on tiles, pills or banners.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green; `npm run verify:board` green after the recipe edits.

## Demo guide updates

Patch these in the same session, and the same sections of `master-demo-guide.html` (the S1 details
block, the workflows, the personas, the readiness snapshot and the Direct URLs):

- `03-demo-script.md`:
  - **S1 · Booking to theatre, rebuilt.** "Serves": the St George's and Southern Cross sync, the
    matching screen, the Booking as the billing anchor and BTM capture. Stage it: Reset (or the S1
    jump). **Beat 1, "the booking arrives by sync"**: Mobile Tue 28 Jul AM (three booked cases), then
    Admin Intake (the pull on open; read the two tiles and "Last synced 08:00"), Sarah Mitchell's row
    (patient reused by NHI, proposed List), Create Booking, back to Mobile for the fourth Booking.
    Say: the two integrated hospitals sync on a schedule, when this screen opens and on Sync now;
    nothing reaches the schedule until the office decides; the other providers' daily sheets are
    imported by hand into the same screen; Christchurch Public and the rest are not integrated; and
    surgeon PDFs stay a first-class pathway beside the sync, because the hospital download is not
    comprehensive (it often lacks the Contract or insurer). **Optional Beat 1b, "a failed sync loses nothing"**: Fail
    next sync (St George's), Simulate scheduled pull, read the failed tile, Sync now recovers the
    missed row. **Optional Beat 1c, "the other providers"**: Deliver hospital sheet (Burwood), rows in
    the unmatched queue, then (Future scope aside) Auto-match on and off. **Optional Beat 1d, "the
    rooms' PDF"**: Surgeon PDFs, Upload PDF (Mr Doyle), correct the missing DOB and the mis-read
    900-minute duration to 90, ingest; say the rooms' estimated duration feeds the prepayment estimate
    (S4 Beat 1's Phase 27 story) and the anaesthetist's recorded times still decide the final time
    units. Beats 2 and 3 are unchanged
    except that the clock jump to 28 Jul now also runs one catch-up pull, which applies nothing.
    Remove Phase 14's Future-scope caveat and the HL7 "Say" line. Discovery point: sync cadence and
    delivery are provisional (OQ-13), and a clock jump runs one catch-up pull.
  - **S4 Beat 4** (if Phase 33 has not already re-pointed it; check either way that no line still
    calls Christchurch Public a feed of today's system): no longer Admin Feed config. Use the unmatched
    queue (Phase 33's "Send unmatched row" or the Wed 22 reschedule) and, optionally, the Christchurch
    Public mapping fix as a clearly labelled Future-scope aside on the Future-scope surface ("an example
    of a further feed; Christchurch Public is not integrated today").
  - **S5 Beat 2**: the new-format NHI arrives on the St George's synced row and validates on the
    matching screen; the Validators tab (Admin Intake) is the optional deeper look. No MSG-STG-1002.
  - "Pre-demo setup", "Direct URLs" (the Intake routes; the Future-scope surface and its sub-routes),
    "Recommended run orders" (the Integration-led row: S1 with Beats 1b, 1c and 1d), "What to narrate
    rather than click" (HL7 v2, FHIR R4 and further feeds, Christchurch Public's included, are Future
    scope; PDFs stay needed beside any feed), "Recovery from demo accidents"
    (the simulator's reset now sits on the Future-scope surface).
- `04-presenter-cheat-sheet.md`: the demo-only list (the sync triggers, the simulated PDF upload, the
  auto-match toggle as Future scope, the Future-scope surface), the Phase 11 readiness line, and the
  "real patient or integration data?" answer (simulated sync of St George's and Southern Cross only,
  hand imported sheets for the others, surgeon PDFs with the rooms' estimated duration).
- `02-workflows-and-handoffs.md`: Workflow 1 main path (sync or hand import, then the office matches;
  the surgeon PDF path with its estimated duration feeding the prepayment estimate);
  the "Integration failure" exception becomes "Sync failure" (a failed sync is shown and caught up;
  nothing is lost; rows about locked Lists wait for the office); the readiness table row.
- `01-personas-and-responsibilities.md`: the integration and exception operator becomes the intake
  operator (matching, sync status, daily sheets, surgeon PDFs); HL7 and FHIR monitoring is Future scope.
- `README.md` (demo guide): the readiness rows for ingestion and monitoring.
- Control Panel scenario text: S1 (work item 10), and S4 and S5 where patched.
- Finish with a consistency read of the S1, S4 Beat 4 and S5 Beat 2 sections of `master-demo-guide.html`
  against the run sheet (S1 is the headline; do not leave it for 44).

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:
- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, with the catalogue files, this doc, Phase 33's entry and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the
  pass in the phase entry;
- do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**
- **No silent apply.** No sync, sheet, upload or HL7 message writes a Booking, List or Patient except
  through Phase 33's decision action; the only automatic application is the auto-match toggle, which is
  off by default, badged Future scope, limited to `isAutoMatchEligible` rows and audited under its own
  actor.
- **Nothing is lost.** A failed sync leaves the cursor and the last success untouched and the next sync
  pulls every missed row exactly once; windows are half-open; a row is never staged twice by open,
  manual and scheduled pulls racing, by StrictMode, or by a reset.
- **Scheduled pulls run on the demo clock only.** No `setInterval`, `Date.now()` or `new Date()` in
  the sync path; `clockAdvanced` is emitted once per change after the canvas roll; a multi-day jump
  runs one catch-up pull; tests that do not wire the job see no pulls.
- **Scope honesty.** Only St George's and Southern Cross sync; Christchurch Public is no longer a live
  feed anywhere (not synced, not in the Live drip, labelled "not integrated today" on the Future-scope
  surface, its fired rows batch-labelled as the HL7 demo); the five providers are hand-imported sheets,
  never labelled a feed; everything HL7, FHIR, retry, dead-letter and mapping sits on the Future-scope
  surface with the `'future'` badge and nowhere in Admin, the mobile app or the PWA. Provisional OQ-13
  wording is on screen. Surgeon PDFs are presented as needed beside the feeds, never as a stopgap.
- **One estimated duration.** The PDF review writes Phase 27's per-Procedure field through 27's setter
  (so 27's rights, audit and prepayment re-check apply); there is no second duration field, no copy of
  27's bounds and no estimator logic in this phase; a blank never clears a figure; an out-of-range
  figure refuses in the store; synced and sheet rows carry none.
- **The in-scope pieces survived the move.** Surgeon PDFs, Data quality and Validators still work, keep
  their behaviour and tests, and live under Admin Intake; redirects cover `/admin/integrations` and any
  Phase 33 route; the context keys and `ingest-pdf-row` were re-pointed, not broken.
- **Seed hygiene.** The three hospitals are appended and the canvas is byte-identical; sync fixtures,
  sheets and upload samples avoid every scripted-beat List and Booking; `PERSIST_VERSION` is bumped
  for each session that changed the seed; facsimiles are never persisted.
- **PDF review.** DOB, ethnicity and estimated-duration edits reach the created patient and Procedure; an invalid DOB refuses in the
  store, not only in the UI; an out-of-set ethnicity is quarantined, not refused; the update path is
  unchanged.
- **Triggers and PWA purity.** New entries are scoped to their routes; the stand-in is PWA only and
  acts only for the persona's Lists; bodies live in `src/store` or `src/shared`; nothing from
  `src/apps/demo/futureScope/` or `src/apps/admin` reaches the PWA closure.
- **S1 and the guide agree.** The Control Panel S1 text, the run sheet, the master guide and the app
  tell the same story, with no leftover MSG-STG-1001 instruction, Future-scope caveat or "near real
  time" claim.
- **Design and copy.** The tiles follow the Admin Review KPI strip; success, warning and error tints
  from the tokens; teal only for actions; no crimson on tiles, pills or banners; no en or em dashes.

## PROGRESS.md updates

- **Status row** for catch-up Phase 34, and an entry `### Catch-up Phase 34 · Hospital sync, PDF upload
  and the S1 rebuild (date)` with:
  - the drift-check result against `501b0b8`, OQ-13's status and whether the provisional cadence was
    built;
  - the real Phase 27 names used (the per-Procedure duration field and its setter) and how the PDF
    ingest joins its commit;
  - the real Phase 33 names used (row types, staging and decision actions, routes);
  - what was built, and what was moved to the Future-scope surface;
  - the `PERSIST_VERSION` bump (from and to);
  - the sync fixture rows, sheets and upload samples the seed tests pin (including each PDF row's
    estimated duration and whether the prepaid Doyle row was seeded), for the demo guide;
  - tests added (domain, store, triggers, Playwright) and the review pass;
  - the S1 consistency read.
- **Decisions log:**
  1. **Supersedes** the Phase 11 reading that the Integrations monitor is "proposed product UI, not
     demo-badged" (and convention 13's integration-monitor wording): the message log, retries,
     dead-letter and feed mapping are Future scope and live on the Future-scope demo surface; Admin
     Intake holds matching, surgeon PDFs, data quality and the validators (RV-05).
  2. **Closes** Phase 14's "HL7/FHIR tooling carries interim Future-scope badges until Phase 34"; the
     simulator is kept, not extended, and S1 no longer rests on it (RV-06).
  3. The sync cadence is provisional (every 2 hours, 07:00 to 19:00 on the demo clock, one named
     constant) until OQ-13; a clock jump runs one catch-up pull; the on-open pull is a no-op at the
     same demo instant.
  4. Synced rows use Phase 33's neutral row shape, not HL7 or FHIR, because the delivery format is
     OQ-13.
  5. Forte Health, Christchurch Eye Surgery, Burwood, Southern Endo and McMurray Centre are
     hand-imported daily sheets (the FT-02.1 baseline); their feeds are Future Work. Auto-match is a
     demo-only toggle showing US-14.6.2 (Future Work), off by default.
  6. The surgeon PDF inbox is state; Upload PDF is a badged sample picker (no real upload or parsing);
     DOB, ethnicity and estimated duration are editable in review, an out-of-set ethnicity is
     quarantined rather than refused, and the duration is optional and written to Phase 27's
     per-Procedure field (DM-40, US-06.2.5). PDF ingest stays a first-class pathway beside the feeds
     (FT-02.2's 2026-10-01 note).
  7. **Supersedes** the Phase 11 reading of Christchurch Public as a third live HL7 feed: only St
     George's and Southern Cross are integrated (US-02.1.5); Christchurch Public's feed remains only as
     a labelled Future-scope example, out of the Live drip.
- **Binding conventions:** convention 4's "Simulated external systems (Xero, HL7, PDF/OCR)" adds the
  hospital sync and names the Future-scope surface for HL7 and FHIR.
- **Handoff notes:**
  - For **35**: rows decided on the matching screen that change a Booking are candidates for the
    update email and the explicit-save change set.
  - For **40**: McMurray's row without an NHI (40's open-question lean: it proceeds flagged and
    authorising waits for the NHI) and S1's Sarah Mitchell (unpaid prior balance) are the natural beats
    for the missing-NHI list and the mild or strong unpaid-balance warning.
  - For **42**: the three new hospitals and `HOSPITAL_SYNC_SCHEDULE` are candidates for editable
    reference data.
  - For **43**: the restricted raw-row view should cover synced rows and the Future-scope message log
    (which still shows a patient reference).
  - For **44**: S1 is rebuilt, not polished; the rewrite regenerates the master guide and walks the
    handset stand-in in the PWA-parity audit.
  - If OQ-13 is answered: the switch points are `HOSPITAL_SYNC_SCHEDULE`, the fixture row fields
    (including whether a row may carry an estimated duration, which would then go through 27's setter
    on decision) and the provisional labels on the matching screen.
