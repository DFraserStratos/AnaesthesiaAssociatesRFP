# Phase 34 · Hospital sync, the rooms' PDF lists and the S1 rebuild

**Requirements covered:**
[US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) Automatic sync from St George's and Southern Cross (status 1; Contradicts: today's feeds push and apply, and Christchurch Public runs as a third live feed. One criterion, **No silent apply**; its 2026-10-16 cadence note, one theatre list a day for the next day's bookings, is narration, not a schedule to build. OQ-109 part 2 assumed 4 November: both integrated hospitals sync) ·
[EP-14](../../../../requirements-board/requirements/stories/EP-14.md) Health systems integration (Partial: the first-release sync of the two integrated hospitals into the matching screen is this phase's; more feeds, automatic matching, HL7 v2 and FHIR stay Future Work and move to a Future-scope surface here; the NHI lookup is in scope and 40a's) ·
[FT-02.2](../../../../requirements-board/requirements/stories/FT-02.2.md) Surgeon PDF list ingest and [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md) Read, correct and ingest a surgeon PDF list (status 3; out of Future Work on 4 November with OQ-108, D51: in the first release beside the hospital download, landing on the same matching screen. Contradicts and Partial today: correction before ingest exists, but there is no upload, the ingest writes straight onto a chosen List, a re-sent List is not modelled and a blank NHI makes a provisional Booking) ·
[DM-61](../analysis/domain-model-delta.md#dm-61) The rooms' PDF list as a source document (a stored SurgeonPdfList whose rows become Phase 33's import rows with the rooms as their source) ·
[RV-12](../analysis/reverse-check.md#rv-12-surgeon-pdf-upload-and-ingest-is-shown-unbadged-as-product) Surgeon PDF ingest shown unbadged as product ("Hide from demo" is overtaken by OQ-108: the PDF pathway is product here, never badged Future; its direct ingest goes) ·
[RV-14](../analysis/reverse-check.md#rv-14-hl7-v2-to-fhir-simulator-live-drip-and-scenario-s1-built-on-them) HL7 v2 to FHIR simulator, live drip and Scenario S1 built on them (Rework) ·
[RV-16](../analysis/reverse-check.md#rv-16-further-hospital-feeds-and-automatic-application-with-no-matching-step) Further hospital feeds and automatic application with no matching step (Rework: the Christchurch Public feed stops, rows wait for a decision).
**Left this phase at `d4db277`:** FT-14.6 (further feeds and automatic matching, all Future Work): no manual-provider sheets, appended hospitals, Other providers strip or auto-match toggle; another provider's sheet comes in through Phase 33's Receive action. RV-15 (the nav attention badge and patient names in the log) falls away with RV-14's demotion.
Also touches, without closing:
[DM-34](../analysis/domain-model-delta.md#dm-34) (33 builds the rows, decisions and unmatched queue; this phase adds the `'sync'` channel and the rooms' PDF rows, and no sync state),
[FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md), [US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md) to [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) (33's matching screen, which synced and PDF rows feed; US-02.1.3's differences carry a re-sent PDF; US-02.1.4's no-NHI row waits with 33a's stub),
[US-02.2.3](../../../../requirements-board/requirements/stories/US-02.2.3.md) and [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) (Future Work: a Booking left off a re-sent List is not detected),
[US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md), [US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) and [DM-51](../analysis/domain-model-delta.md#dm-51) (20a's wording as received and stack: a synced row brings the hospital's description, a PDF row the rooms'),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md), [US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) and [DM-49](../analysis/domain-model-delta.md#dm-49) (20's step rail and "Needs a Contract", which S1 shows),
[US-11.1.2](../../../../requirements-board/requirements/stories/US-11.1.2.md) (the NHI validators, which stay in Admin and check a PDF row's correction).
**Open questions:** [OQ-109](../../../../requirements-board/requirements/questions/OQ-109.md) (D52) part 2 **assumed** 4 November (Donald, for the build, not yet seen by AA: "both hospital integrations"), built as assumed and labelled once; part 1, which two hospitals, **still open**: default, keep the catalogue's St George's and Southern Cross, named in one place (`INTEGRATED_HOSPITALS`) so a later answer (Ben named Forte) is a one-place change. [OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md) (hospital download format; Open): gates no build choice, since US-02.1.5 asks for no mechanism; synced rows use 33's format-agnostic row shape.
**Answered and built as answered:** [OQ-108](../../../../requirements-board/requirements/questions/OQ-108.md) (D51, 4 November, Donald for the build: both intake sources in the first release, each landing on the one matching screen), [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (no hospital default Contract), [OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md) (D33: no procedure to match; the RVG code optional and the anaesthetist's) and [OQ-118](../../../../requirements-board/requirements/questions/OQ-118.md) (D66: a no-NHI row waits with a stub on its List, 33a's). The office's Contract choice is **20's step rail, a working direction** (a guess to design and test with AA; ROADMAP D16), which S1 narrates as 20 built it.
**Depends on:** Phase 33 (the matching screen, import rows carrying their source, hospital or rooms, decisions, the unmatched queue, `correctImportRow`, its registry entries) and Phase 33a (the Stub record made when a no-NHI row lands on a List, its List marking and its one resolve path). Through them: 14 (registry, `DemoBadge` tone `'future'`, PWA sheet), 15 (`Booking.source`), 15b (ACTIVE), 17 and 17a (the surgeon and their rooms, the PDF's sender), 20 (no default Contract, "Needs a Contract", the step rail, `setProcedureContract`), 20a (source texts, the `surgeonPdf` channel in the rooms' group, the invoice description's order of defaults, `ProcedureStack`), 21 (the payer on the Booking), 28 and 31 (Slots, ACTIVE and Draft Lists as row targets).
**Estimated:** 2 sessions, with a cut line (one deliverable, not split into a 34a: both intake sources on one screen, told in S1). **Session 1, the product pathway:** sync deliveries and the sync action with Christchurch Public stopped; the SurgeonPdfList record, upload, correction, send to matching and the re-sent differences; ends green. **Session 2:** the Future-scope demotion, the Intake home and the S1 rebuild with its demo-guide patch. If session 1 runs long, the re-sent-differences trigger opens session 2. The S1 rebuild is never squeezed: if session 2 is tight, the Intake home lands as a plain grouping of the existing tabs (item 8).

## Goal

Both first-release intake sources reach Phase 33's matching screen, and nothing reaches a Booking,
List or Patient until the office decides (US-02.1.5 "No silent apply").

- **Hospital sync.** St George's and Southern Cross bring their rows in without a hand download. How
  each hospital delivers is the integration team's (OQ-13), so the demo shows arrival only: a
  **Simulate sync** demo action per hospital delivers its next rows, marked New. No schedule, pull on
  open, Sync button or last-synced time ("Let's leave it out"). Christchurch Public stops being a live
  feed (RV-16).
- **The rooms' PDF lists** (FT-02.2, US-02.2.1, DM-61). The canned inbox becomes stored source
  documents: a **SurgeonPdfList** per emailed List (file or facsimile, sender, received time, a
  suggested target List, status, the rows as read with each correction). The admin uploads one
  (simulated reading: no OCR, no mailbox), corrects a row's fields beside the facsimile (an invalid NHI
  among them), and **sends it to matching**, where its rows land as import rows with the rooms as their
  source and their wording as the rooms' description (20a). `ingestPdfRow`'s direct write onto a
  chosen List goes. A PDF re-sent for the same List lands as rows whose differences wait for approval
  (our reading, DM-61); a row with no NHI waits with 33a's stub.
- **The Future-scope surface.** The HL7/FHIR simulator, live drip, message log with retry and
  dead-letter, and feed mapping leave Admin for a separated demo surface (RV-14, RV-15). Matching, PDF
  lists, data quality and the NHI validators sit under one Admin **Intake** home, unbadged.
- **S1 rebuilt** around sync then match: Sarah Mitchell's row reads `lap appy ?conv to open` and the
  Booking keeps it as received; a no-NHI row in the same delivery waits with its stub on her List
  (33a); the office sets her Contract through 20's step rail (the patient, not prepaid: No contract
  (RVG), the RVG code handed to the anaesthetist, who picks A3 at capture, D33); and a rooms' PDF beat
  beside it.

This phase builds no pricing structure and no wording model: it reads the Contract through 20's rail
and selectors and the wording through 20a's types.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `a68f09b` (rename-aware;
   Node 22.18 or newer):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-02.1.5,EP-14,FT-02.2,US-02.2.1,US-02.2.3,US-02.5.4,FT-02.1,US-02.1.1,US-02.1.2,US-02.1.3,US-02.1.4,US-02.5.7,US-03.1.9,US-04.3.3,US-04.3.4,US-04.3.6,US-11.1.2,FT-02.6,US-02.6.1,FT-14.1,FT-14.2,FT-14.3,FT-14.5,FT-14.6,US-14.5.1,OQ-13,OQ-78,OQ-99,OQ-108,OQ-109,OQ-118
   ```

   This doc reflects the catalogue at `a68f09b` (4 November: OQ-108 answered, US-02.2.1 out of Future
   Work, FT-02.2 in the first release; OQ-109 part 2 assumed, noted on US-02.1.5 and EP-14).
   `domain-model.md` section 1 may still describe a scheduled sync with a last-synced time: stale
   against US-02.1.5; the story wins. If an item changed since, re-read it, adjust the work items and
   re-run the gap analysis for it per `../README.md`.
2. **US-02.1.5, EP-14, OQ-109.** If the sync regains a schedule, sync button or last-synced time, stop
   and tell the owner. If part 1 is answered with other hospitals, change `INTEGRATED_HOSPITALS` and
   the deliveries' hospitals (copy reads names from it). If part 2 is reversed (not synced), drop work
   items 1, 2 and the sync triggers and rebuild S1 around 33's hand import. If a third hospital joins
   the integrated set, stop: item 2's Christchurch Public stop would reverse.
3. **US-02.2.1, FT-02.2, OQ-108.** If US-02.2.1 returns to Future Work or OQ-108 is reversed, stop and
   tell the owner. If US-02.2.3 (removal detection) or US-02.5.4 leaves Future Work, note it and build
   nothing: it needs a phase. If the mailbox read becomes a requirement, stop.
4. **FT-14.x and FT-14.6.** If any Future item (FT-14.1 to 14.3, 14.5, US-14.5.1) returns to scope,
   keep that piece in Admin unbadged and tell the owner; if FT-14.6 returns, stop.
5. **OQ-13.** If answered with a delivery shape, record it in PROGRESS.md; the deliveries' row fields
   are the one place to adjust. Build no mechanism unless US-02.1.5 also changed.
6. **The Contract and the wording.** If a hospital default or a row-set Contract returns (US-04.3.6 out
   of Future Work), stop. S1 narrates the picker 20 built: if AA has settled a different design, follow
   it. If US-02.5.7 or US-03.1.9 changed, follow 20a's built stack.
7. **Confirm the dependencies are DONE** and take the real names from their PROGRESS entries:
   - **Phase 33:** `ImportBatch`, `ImportRow`, `IncomingBookingFields`, the channel union and how a row
     carries its source (hospital or rooms; planned for this phase's PDF rows), `stageImportRows`
     (exported from `matchingActions.ts`, not `store/index.ts`) and its dedupe, `correctImportRow`,
     `decideImportRow`, `suggestDecision`, `sourceTextChannelFor`, `matchingAttentionCount`, the route
     and nav section, `HOSPITAL_DOWNLOAD_SAMPLES` (`SAMPLE_STG` R1 is Sarah Mitchell; confirm it reads
     `lap appy ?conv to open`), its bar triggers (planned `matching-receive-theatre-list`,
     `matching-send-update`), the PWA stand-in `matching-office-matches-row` (`officeMatchesHospitalRow`
     in `src/store/matchingDemo.ts`), how a decision sets `Booking.source` from the row's source, and
     whether it re-pointed S4 Beat 4 and S5 Beat 2.
   - **Phase 33a:** the Stub record and when it is made (a no-NHI row placed on a List, any source), its
     List marking ("1 waiting at intake"), the resolve path (Add NHI, reject), its PWA entry and the List
     it seeded a stub on.
   - **Phase 20:** the step rail's path function and component, `needsContractBookings`,
     `setProcedureContract`, the stored No contract (RVG) id, and the RVG-code hand-off to the
     anaesthetist.
   - **Phase 20a:** `SourceText`, `addSourceText`, the `surgeonPdf` channel (the rooms' group),
     `refreshInvoiceDescription`, `ProcedureStack`.
   - **Phase 14:** the registry contract, the context keys `integrations.tab` and
     `integrationsSim.selectedMessageId`, and the `ingest-pdf-row` entry (removed here).
   - **Phase 17a:** the surgeon's rooms (the PDF's sending room).
8. Note `PERSIST_VERSION` (`src/store/appStore.ts`): this phase bumps it once, for the seeded
   SurgeonPdfList records.
9. Record the drift-check result (against `a68f09b`) in the PROGRESS entry.

## Reference

**Design files (convention 17):** `docs/design/Admin Review.dc.html` (page anatomy, the table, the
`bannerIn` motion for newly arrived rows); `docs/design/Admin Day.dc.html` (the side nav and its amber
badge); `docs/design/Design Language.dc.html` (pills, the `'future'` badge neutrals, radii,
`selection-slide` for the Intake tabs, reduced-motion fades). Teal is the only action colour; crimson
stays identity only. The Future-scope surface keeps `DemoSurface` chrome. The PDF review keeps today's
facsimile-beside-rows layout.

**Catalogue:** the covered items above (US-02.2.1's and FT-02.2's 4 November notes, EP-14's Notes,
US-02.1.5's Notes), OQ-108, OQ-109, OQ-13, [AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md)
and its note [2026-10-08-procedure-picker-and-source-text.md](../../../../requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md),
"Illustrative source wording" heading (AI-made, not from AA; no regions, cite the heading): the wording
the deliveries and PDF samples use. For the S1 narration only:
[AR-28#no-contract-rvg](../../../../requirements-board/requirements/artifacts/AR-28.md) and
[AR-29#contract-selection](../../../../requirements-board/requirements/artifacts/AR-29.md).

**Analysis:** `../GAP-ANALYSIS.md` before "## By epic" (theme 8, "Remove or rework", the intake cluster
of "Demo-trigger buttons"), then the EP-02 and EP-14 tables; `../epics/EP-02.md` and `../epics/EP-14.md`;
`../analysis/reverse-check.md` RV-12 to RV-16; `../analysis/domain-model-delta.md` DM-61, DM-34, DM-51,
DM-58; the prototype maps (`prototype-map-admin.md` 1, 8, 13, 14; `prototype-map-shell-demo-pwa.md` 1,
3 to 5, 7, 9; `prototype-map-store-seed.md` 5, 7 to 9; `prototype-map-domain.md` 6).

**Code entry points:**
- `apps/admin/screens/IntegrationMonitorScreen.tsx`: tabs (:62-72), `FutureScopeNote`, `MessagesTab`,
  `FeedConfigTab`, `SurgeonPdfsTab` (:214) and `PdfReview` (:240-340, the editable rows and NHI check),
  `DataQualityTab`, `ValidatorsTab`.
- `domain/integrations/pdfSamples.ts` (`PdfRow`, `SurgeonPdf`, `SURGEON_PDFS`, the facsimile builder;
  they become upload samples and seed), `store/integrationActions.ts` (`ingestPdfRow` :453, removed;
  `processMessage`, `MAX_ATTEMPTS`, `wireIntegrationRetry`, unchanged), `domain/integrations/feeds.ts`
  (`FEED.cph`, `FEED_META`), `domain/seed/cast.ts` (`HOSP`, read only).
- `apps/admin/components/SideNav.tsx`, `AdminApp.tsx` (`integrationAttentionCount`, section paths),
  `apps/admin/routes.tsx`, `src/router.tsx`; `apps/demo/DemoIntegrations.tsx` (Live drip :62-77),
  `DemoSurface.tsx`, `DemoControlPanel.tsx` (`SCENARIOS` S1); `shell/appConfig.ts`.
- Store: `appStore.ts` (`PERSIST_VERSION`, `freshAppState`, `backfillMerge`), `selectors.ts`
  (`integrationAttentionCount`), `domain/ids.ts` (`ID_FORMATS`); Phase 33's `matchingActions.ts`,
  `matchingDemo.ts`, `domain/intake/`; 33a's stub module; 20's rail; 20a's `procedureStack.ts`.
- Registry `shared/demoTriggers/registry.ts` (`ingest-pdf-row` :515, `fire-hospital-message`,
  `replay-hospital-message`) and its test; `pwa/pwaPurity.test.ts`; `domain/domainPurity.test.ts`.
- Tests: `store/integrationActions.test.ts` (:256 PDF ingest), `store/demoScenarios.test.ts` (:192 PDF
  ingest), `store/persistMigrate.test.ts`, `shared/audit/actionLabels.ts`; `visual/phase11.spec.ts`,
  `screens.spec.ts`, `phase12.spec.ts` (S1), `pwa-device.spec.ts`, 33's `admin-matching.spec.ts`.

## Work items

### Session 1 · the product pathway (ends green)

1. **Sync deliveries (pure domain, `src/domain/intake/syncDeliveries.ts`; no React, no `Date.now()`).**
   - `INTEGRATED_HOSPITALS = [HOSP.stg, HOSP.sx]`: the one place the two names live, with a comment
     citing US-02.1.5 and OQ-109 (part 1 open; part 2 assumed 4 November).
   - `HOSPITAL_SYNC_DELIVERIES: Record<IntegratedHospitalId, SyncDelivery[]>`, each `{ id, rows }` in 33's
     row shape, fixed order; `externalRef` shared with `APPT`. Every row carries non-blank wording as
     received from AR-35's "Hospital download" rows where one fits (AI-made, say so in the header; never
     rows 1, 2, 26 or 27, 20a's beats; never a wording 20a placed on another procedure). Minimum set,
     each pinned in `demoScenarios.test.ts`:
     - **St George's 1 (S1):** Sarah Mitchell, built from `SAMPLE_STG` R1's fields (imported, not
       retyped) so 33's dedupe skips either copy: `lap appy ?conv to open`, Tue 28 Jul 08:30, Mr Hale,
       `APPT.s12`, no RVG code, no Contract, proposal Create Booking on Souter's Tue 28 Jul AM (ACTIVE),
       patient reused by NHI. Beside it, **a no-NHI row** on the same List (a later time, an AR-35
       wording not used elsewhere), which waits in the unmatched queue with 33a's stub on that List
       (never the List 33a seeded its stub on); and the MSG-STG-1002 new-format NHI patient with `L4/5
       microdisc` (AR-35 row 32) on **another anaesthetist's** ACTIVE St George's List that day (not a
       scripted-beat List), for S5 Beat 2.
     - **St George's 2:** a time change on the Booking with `APPT.s13Time`, its wording character for
       character the Booking's held text (read from the seed), so only the time differs (US-02.1.3).
     - **St George's 3:** a day move, arriving as a cancellation plus a new row for a session with no
       List (D62; the new row lands in the unmatched queue), with that Booking's own held text.
     - **Southern Cross 1:** Priya Nair, built from `SAMPLE_SX` R1. **Southern Cross 2:** a
       cancellation of a seeded Southern Cross Booking with a correlation reference, never one `SAMPLE_SX`
       R2 modifies.
     None targets the design-day, S2, S3, S4 or S5 Lists and Bookings.
   - `nextSyncDelivery(hospitalId, deliveredIds)`; the delivered set is derived from 33's batches
     (`deliveryId` in `extras`): no cursor, last-synced time or attempt history (DM-34).
   - Vitest `syncDeliveries.test.ts`: order, none after the last, unique ids, S1's row equals `SAMPLE_STG`
     R1, every row's wording non-blank and dash-free, delivery 2's text equals the held text, no Contract.

2. **The sync action, and Christchurch Public stopped (`src/store/hospitalSyncActions.ts`).**
   - `HOSPITAL_SYNC_ACTOR` beside `src/store/demoActors.ts`. `simulateHospitalSync(api, hospitalId)`:
     refuses any hospital outside `INTEGRATED_HOSPITALS` ("Only St George's and Southern Cross are
     integrated. Receive other providers' sheets by hand."); stages the next delivery through
     `stageImportRows` under a new `'sync'` channel (micro-cap "Sync", batch "St George's sync",
     `deliveryId` in `extras`; `sourceTextChannelFor('sync')` is `hospitalDownload`, `from` the
     hospital's name); returns `done` with no write when nothing is left; audit `intake.sync` in the
     same commit. Never writes a Booking, List or Patient (33a's stub is made by 33's staging, not here).
   - Selector `pendingSyncDeliveries(state, hospitalId)`. No persisted state, no demo setting.
   - **Christchurch Public stops being a live feed (RV-16):** not integrated, never synced; the Live
     drip filters `FEED.cph` out (the one simulator change; firing a CPH message by hand still works).
     Its relabel on the Future-scope surface is item 9.
   - Vitest `hospitalSync.test.ts`: refusals, staging once per delivery, `done` with no write, the
     hand-import dedupe in both orders, the stub on Souter's Tue 28 Jul AM after delivery 1, no Booking,
     List or Patient change, determinism, reset; the drip's feed list excludes CPH.

3. **The rooms' PDF list record (DM-61; `domain/types.ts`, `src/domain/intake/pdfLists.ts`,
   `src/store/pdfListActions.ts`).**
   - `SurgeonPdfList { id, file: { name, facsimile }, surgeonId, roomId?, hospitalId, subject,
     receivedAt, target: { anaesthetistId, dateISO, session } (the suggestion), status: 'received' |
     'sent', replacesId?, batchId?, rows: PdfListRow[] }`; `PdfListRow { id, asRead: { nhi?, name,
     dobISO?, scheduledTime?, ethnicityCode?, procedureText }, corrections: { field, from, to, at, by }[]
     }`. `ID_FORMATS` gains `pdfList`. Slice in 33's `intake` state, `freshAppState`, the persisted
     payload and `entityCounts`.
   - Pure `effectivePdfRow(row)` (as read plus corrections) and `pdfRowIssues(row)` (the one NHI
     validator: invalid flagged, blank allowed and named "No NHI: will wait at intake").
   - Samples: `pdfSamples.ts` becomes the upload sample library (`PDF_LIST_SAMPLES`, the facsimile
     builder kept, the deliberately wrong NHI kept, operation text re-worded from AR-35's rooms' rows,
     labelled AI-made), plus one re-sent version per sample (`PDF_RESEND_SAMPLES`: one changed time, one
     new patient). Seed the inbox with the Okafor list as received (deterministic; **PERSIST_VERSION**
     bump). Keep every target off scripted-beat Lists and S1's Tue 28 Jul AM; pin them.
   - Actions, each through `mutate()` with the demo clock, office only: `uploadPdfList(api, actor,
     sampleId)` (simulated reading; audited `pdfList.upload`; refuses a sample already in the inbox);
     `correctPdfListRow(api, actor, listId, rowId, patch)` (NHI, name, date of birth, time, ethnicity;
     the wording is kept as read, as 33's `correctImportRow` keeps it; each correction recorded;
     `pdfList.correct`); `sendPdfListToMatching(api, actor, listId)` (refuses an invalid NHI; stages the
     effective rows through `stageImportRows` with 33's rooms source, label "<surgeon>'s PDF list ·
     <date> <session>", `extras: { pdfListId }`; `sourceTextChannelFor` maps it to 20a's `surgeonPdf`, so
     the wording is the rooms' description and the first invoice-description default; status `sent`;
     `pdfList.send`). A Booking created from a rooms row takes source `surgeonPdf` (extend 33's mapping
     if it hardcodes `hospitalDownload`). Nothing writes a Booking: `ingestPdfRow`, its screen call and
     its tests go.
   - **A re-sent List (our reading, DM-61; labelled once in the module):** pure `resentPdfListOf(state,
     list)` on 33's matcher keys: an earlier sent list for the same surgeon, hospital, date and session.
     On upload it sets `replacesId`; on send, 33's dedupe skips unchanged rows (counted "unchanged"),
     a changed row arrives as a modification with its differences for approval (US-02.1.3), a new
     patient as a new row. A patient left off the re-sent List is not detected (US-02.2.3, Future Work).
   - Vitest: upload, correction history, the invalid-NHI refusal, a blank NHI staged and waiting with a
     stub, rows staged once with the rooms' source and wording verbatim, no Booking written, a re-sent
     list's differences, determinism, reset, persist migration.

4. **The PDF lists screen (product UI, in the current Integrations screen until item 8 moves it).** The
   tab is renamed **PDF lists**, unbadged. Inbox: one row per stored list (sender, hospital, received,
   suggested List, a "Re-sent" chip where `replacesId`, a status pill Received or Sent to matching).
   **Upload PDF list** (teal) opens a sample picker badged "Sample files" (simulated reading). The review
   keeps the facsimile beside the editable rows: every correctable field, the NHI checked as typed,
   each correction shown under the row ("NHI ZAA0068 corrected to ZAA0067"), the wording read-only as
   received; **Send to matching** (teal), then a link to the rows on the matching screen. Copy names no
   OCR or mailbox. `data-shot` hooks `pdf-upload`, `pdf-correction`, `pdf-send`.

5. **The matching screen receives both sources.** Source micro-caps "Sync · St George's" and "Rooms PDF
   · <surgeon>"; newly staged rows enter with `bannerIn` and a "New" chip (80ms fade under reduced
   motion); each row's wording exactly as 33 shows it. Empty state: "No rows waiting. Rows from St
   George's and Southern Cross, the rooms' PDF lists and received sheets land here." No sync tile,
   last-synced time, failure pill or Sync button. `data-shot` hook `row-new`.

6. **Session 1 triggers (registry only; bodies in `src/store`).**
   - `simulate-hospital-sync`, "Simulate sync", on 33's matching route: `choices` from
     `INTEGRATED_HOSPITALS`; disabled per choice when exhausted ("No more rows from St George's in this
     demo"); message from the result.
   - `pdf-list-resend`, "Receive updated PDF from rooms", on the PDF lists tab: a choice per sent sample
     with a re-sent version; lands the re-sent list in the inbox as received, marked Re-sent; disabled
     until its first version is sent, or once received. **This is the entry that moves to open session
     2 if session 1 runs long.**
   - Remove `ingest-pdf-row` (its body went with `ingestPdfRow`). Registry tests: routes, `indexPath`,
     no dashes.
   - Close session 1: `npm run build`, `npm run build:pwa`, `npx vitest run` green; a short session note
     in PROGRESS.md.

### Session 2 · demotion, the Intake home and the S1 rebuild

7. **The Future-scope surface (RV-14, RV-15, RV-16).** `/demo/integrations` becomes "Future scope: HL7
   and FHIR" (path kept) with `/demo/integrations` (the simulator, unchanged), `/demo/integrations/log`
   (the moved `MessagesTab`) and `/demo/integrations/mapping` (the moved `FeedConfigTab`), components in
   `src/apps/demo/futureScope/`. Header `DemoBadge tone="future"` and one line: "HL7 v2, FHIR R4, near
   real time messaging, retries with a dead-letter queue and per-hospital mapping are Future scope,
   shown for discussion. In scope today: St George's and Southern Cross rows and the rooms' PDF lists on
   Admin Intake, matched by the office." Christchurch Public reads "not integrated today · example of a
   further feed (Future Work)"; a fired CPH message's batch is labelled "Future-scope HL7 demo ·
   Christchurch Public". One line on the simulator: "Fired messages land on Admin Intake as rows for the
   office to decide." The Keycloak callout keeps NHI lookup (FT-14.4) in scope. Do not extend the
   simulator, message model, `MAX_ATTEMPTS` or `wireIntegrationRetry`. Remove Phase 14's interim Admin
   badges. `pwaPurity`: nothing from `futureScope/` reaches the PWA.

8. **The Intake home.** One "Intake" nav item under Day view (33's `'matching'` and `'integrations'`
   sections merge; badge `matchingAttentionCount` only, `integrationAttentionCount` dropped). Routes
   `/admin/intake` (to `matching`), `/admin/intake/matching`, `/admin/intake/pdfs`,
   `/admin/intake/quality`, `/admin/intake/validators`, URL-routed tabs with `selection-slide`;
   `/admin/integrations` and `/admin/matching` redirect with `replace`. Everything 33 aimed at
   `/admin/matching` follows (triggers, the Booking's "From hospital row" link, specs). Header: "Hospital
   bookings from St George's and Southern Cross, and the rooms' PDF lists, arrive here. Every row waits
   for your decision." Drop the `integrations.tab` context key. Rename the screen file to
   `IntakeScreen.tsx` (or one file per tab). **If session 2 is tight**, the Intake home lands as a
   plain grouping: the one nav item and redirects, the existing in-page tab buttons, no URL-routed tabs
   or motion; log it.

9. **Triggers re-pointed.** `simulate-hospital-sync` and 33's entries to `/admin/intake/matching`;
   `pdf-list-resend` to `/admin/intake/pdfs` (if it opens this session, build it here); 14's
   `fire-hospital-message` and `replay-hospital-message` only on the Future-scope routes, badged, their
   description naming Admin, Intake. Control Panel index groups: Admin · Intake, and Future scope: HL7
   and FHIR. Registry tests: each entry only on its routes; no CPH outside the Future-scope routes.

10. **The handset stand-in (PWA parity for S1).** Re-point 33's `matching-office-matches-row` (id kept)
    to **"Hospital sync delivers my booking"** (Mobile Lists, List and Booking routes; `surfaces:
    ['pwa']`; `badge: 'office-stand-in'`); its S1 choice becomes "Hospital sync, Tue 28 Jul AM (S1)", its
    other two choices unchanged; body in `matchingDemo.ts`: `simulateHospitalSync` for the List's
    hospital (all integrated hospitals with a delivery left off a List route), then `decideImportRow` as
    `OFFICE_SIMULATION_ACTOR` with the suggestion for each confident row onto the persona's Lists, then
    the office's rail answer on each Booking it created (the patient, not prepaid: No contract (RVG), via
    `setProcedureContract`; never on a matched Booking). The no-NHI row and other exceptions stay with
    the office; its stub shows on the List. Disabled "Nothing new from the hospitals for your Lists".
    Vitest; `pwa-device.spec.ts`: the fourth Booking with `lap appy ?conv to open`, the RVG code to fill
    in, No contract (RVG), and the stub marked on the List.

11. **S1 rebuilt in the app.** Control Panel S1: blurb "A St George's booking arrives through the
    hospital sync with the hospital's own wording; the office matches it onto a booked List and answers
    who pays; a booking with no NHI waits in its place; it captures live on procedure day."; run
    `resetDemo` only; message per the run sheet (item 13's beats); nav "Go to Mobile app", "Go to Admin
    Intake". Remove Phase 14's caveat, MSG-STG-1001, any "default Contract" and code 20950.
    `demoScenarios.test.ts`: delivery 1 stages Sarah's row (proposal on Souter's Tue 28 Jul AM, the
    wording exact) and the no-NHI row with its stub on that List; deciding Sarah's row creates the
    Booking at 08:30, source `hospitalDownload`, patient CQY9304 reused, the only source text exactly
    `lap appy ?conv to open`, no RVG code, no Contract, on `needsContractBookings`; the rail's patient,
    not prepaid answer sets No contract (RVG) and takes it off; the stack reads the wording, the RVG code
    to fill in and No contract (RVG) invoicing Sarah; the List reads 0 of 4 complete with 1 waiting at
    intake, ACTIVE; S2 to S5 pins hold; the seeded PDF list and the deliveries touch no scripted List.

12. **Close-out.** Update `phase11.spec.ts`, `screens.spec.ts`, `phase12.spec.ts` (S1 through sync, the
    decision, the rail) and 33's `admin-matching.spec.ts` (Intake routes; `SAMPLE_STG` after the sync
    reports R1 already imported); add `visual/intake-sync.spec.ts` (sync deliveries in order, the stub,
    exhaustion) and `visual/intake-pdf-lists.spec.ts` (upload, correct, send, the rows on matching, the
    re-sent differences). New audit codes in `ACTION_LABELS` ("Hospital sync", "PDF list uploaded",
    "PDF list row corrected", "PDF list sent to matching"). README: the Intake routes, the PDF lists and
    the Future-scope surface. Then build, build:pwa, vitest, shots green; walk S1; the review pass; the
    demo guide; PROGRESS.md.

## Demo triggers

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Simulate sync | Admin · Intake · Matching | bar | St George's or Southern Cross: the next delivery arrives as rows marked New, labelled Sync, nothing applied (a no-NHI row's stub shows on its List). Disabled per hospital when used up |
| Upload PDF list | Admin · Intake · PDF lists | product button, badged sample picker | Stores the chosen sample as a received PDF list (simulated reading) for review and correction |
| Receive updated PDF from rooms | Admin · Intake · PDF lists | bar | Re-sends a list already sent to matching with a changed time and a new patient; once sent, the matching screen shows the change as a difference for approval and the new patient as a new row |
| Fire hospital message, Replay last message (re-pointed) | Future scope: HL7 and FHIR | bar | Unchanged bodies, only on the Future-scope surface; a fired message lands as a matching row; Christchurch Public only as a "not integrated today" example, not in the Live drip |
| Hospital sync delivers my booking (re-pointed from 33) | Mobile · Lists, List, Booking | PWA only | Office stand-in: delivers the hospital's rows, decides the confident ones for this anaesthetist's Lists and answers the rail with No contract (RVG) on each Booking it created; the no-NHI row waits, its stub on the List |

`ingest-pdf-row` is removed. There is no product sync button or scheduled pull: Simulate sync stands in
for the hospital. The matching screen, PDF lists and the Future-scope surface do not exist in the PWA;
S1's handset side is the stand-in above.

## Out of scope

- Real transport, formats or cadence for the sync (OQ-13), and any schedule, pull on open, Sync button,
  last-synced time or failed-sync display.
- Real PDF parsing, OCR, reading the rooms' mailbox, detecting a Booking left off a re-sent List
  (US-02.2.3) and accepting inbound changes automatically (US-02.5.4): Future Work or not asked.
- Extending the HL7/FHIR simulator, message model, retry engine or feed mapping; FT-14.6's feeds,
  sheets and auto-match; hospital-supplied or default Contracts (US-04.3.6, OQ-78).
- 20's rail, 20a's wording model, 21's payer, 33's matching rules and 33a's stubs: reused, not changed,
  except the `'sync'` channel, the rooms' rows and the route move.
- 35 (explicit save, update email), 40 (the waiting-rows view, NHI mandatory on every form, the balance
  warning), 40a (the as-typed NHI marking), 43 (the restricted raw-row view), the web app, and 44's full
  S1 to S5 rewrite.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence (ROADMAP.md "Owner
review: agents test themselves").

- [ ] Fresh reset, Admin: one "Intake" item under Day view; `/admin/integrations` and `/admin/matching` land on `/admin/intake/matching`; 33's bar entries still appear there; the badge counts only rows waiting on matching.
- [ ] Simulate sync, St George's: three rows arrive marked New with the Sync micro-cap and their wording (Sarah Mitchell `lap appy ?conv to open`, proposal Create Booking on Souter's Tue 28 Jul AM; the no-NHI row in the unmatched queue; `L4/5 microdisc` on another anaesthetist's List); Mobile Tue 28 Jul AM shows three Bookings and the stub, marked, "1 waiting at intake"; one "Hospital sync" audit row. Importing `SAMPLE_STG` by hand then reports R1 already imported.
- [ ] Deciding Sarah's row creates her Booking at 08:30 (source Hospital download, wording as received, no RVG code, no Contract) on "Needs a Contract"; the office answers the step rail (the patient, not prepaid) and No contract (RVG) is set; the stack reads the wording, the RVG code to fill in, No contract (RVG) invoicing Sarah; no "default Contract" anywhere.
- [ ] Mobile: four Bookings, 0 of 4 complete, 1 waiting at intake, ACTIVE; at Procedure day the anaesthetist picks RVG code A3 by type-ahead and the wording stays as received.
- [ ] Simulate sync again: St George's 2 (the time difference), 3 (the cancellation plus the unmatched new row), then disabled; Southern Cross 1 and 2.
- [ ] PDF lists (`/admin/intake/pdfs`), unbadged: the seeded Okafor list as received; Upload PDF list adds a sample from the badged picker; the invalid NHI is flagged and Send is refused until corrected; the correction shows under the row; Send to matching stages the rows with the Rooms PDF micro-cap and the rooms' wording, writes no Booking; deciding one creates a Booking with source surgeonPdf and the rooms' description first in its stack; a blank-NHI row waits with its stub.
- [ ] Receive updated PDF from rooms, then Send: the unchanged rows skipped, the changed time shown as a difference for approval, the new patient as a new row; nothing applied until decided.
- [ ] Future scope: HL7 and FHIR: header badge and line; simulator, log and mapping work as before; a fired message lands on Admin Intake; Christchurch Public not in the Live drip, labelled "not integrated today"; Admin has no Messages or Feed config tab; nothing in-scope calls Christchurch Public a feed.
- [ ] Data quality and Validators unbadged and unchanged.
- [ ] Control Panel S1 text and nav follow the new beats; the index groups Admin · Intake and Future scope.
- [ ] PWA (fresh storage): "Hospital sync delivers my booking" on the Tue 28 Jul AM List adds Sarah with her stack and the stub; then disabled.
- [ ] S1 walked end to end from the run sheet; S4 Beat 4 and S5 Beat 2 as patched.
- [ ] No en or em dash in new copy; teal only on actions; no crimson on rows, pills or banners; no "slot".
- [ ] Catalogue screenshots as below; `npm run capture` with no failed recipe; `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` green.

## Demo guide updates

Patch in the same session (session 2), and the same sections of `master-demo-guide.html`:

- `03-demo-script.md`:
  - **S1 · Booking to theatre, rebuilt** (one rewrite superseding 20's and 20a's interim patches).
    Serves: both integrated hospitals' sync into the matching screen, the wording kept as received, a
    booking with no NHI waiting as a stub, the office's Contract choice, BTM capture. **Beat 1, "the
    booking arrives by sync":** Mobile Tue 28 Jul AM (three cases), then Admin Intake, Simulate sync,
    St George's: three rows, New; Sarah's reads `lap appy ?conv to open`; Create Booking. Back on
    Mobile, the stub sits on the List, "1 waiting at intake": a booking the hospital sent without an NHI
    is never a Booking until the office adds it (optional: Add NHI on the row, 33a). Say: rows arrive
    without anyone downloading them (one theatre list a day); nothing reaches the schedule until the
    office decides; the hospital's wording is kept exactly as sent; both hospitals syncing is assumed
    for now (OQ-109 part 2), and which two is still to confirm. **Beat 1a, "the office answers who
    pays":** Sarah waits on "Needs a Contract"; the step rail asks who the invoice goes to (the
    patient), then prepaid or not (not prepaid: No contract (RVG)); the RVG code goes to the
    anaesthetist. Say: the rail is a working direction we will design with you; there is no hospital
    default to undo. **Beat 1b, "the rooms' PDF list" (optional):** PDF lists, open Mr Okafor's list,
    correct the flagged NHI, Send to matching; then Receive updated PDF from rooms and Send: only the
    changed time shows, for approval. Say: both sources land on one screen; a re-sent List is matched
    to the earlier one by surgeon, hospital, date and session (our reading); a patient dropped from a
    re-sent List is not yet detected. **Beat 3:** pick RVG code A3 by type-ahead, Start now; the List
    stays ACTIVE (never DRAFT); drop 20950. Remove the HL7 caveat, the MSG-STG-1001 click and any
    "default Contract" line. Discovery points: OQ-13 (delivery), OQ-109 part 1 (which hospitals).
  - **S4 Beat 4** and **S5 Beat 2** if 33 did not: the unmatched queue instead of Feed config (the
    Christchurch Public mapping fix only as a labelled Future-scope aside); the new-format NHI on the
    synced row, Validators the deeper look.
  - Any line presenting surgeon PDF ingest as Future scope or as a direct write: it is product, through
    matching.
  - "Pre-demo setup", "Direct URLs" (Intake routes, the Future-scope sub-routes), "Recommended run
    orders", "What to narrate rather than click" (HL7, FHIR, further feeds, automatic matching, OCR and
    the mailbox read are Future or not built), "Recovery" (a used-up Simulate sync or re-send needs a
    reset).
- `04-presenter-cheat-sheet.md`: demo-only items (Simulate sync, the PDF sample picker and re-send, the
  Future-scope surface), the S1 line, and "real integration data?" (simulated rows and sample PDFs; the
  wording illustrative, not AA's).
- `02-workflows-and-handoffs.md`: Workflow 1 (sync, a PDF list or a hand import, then matching and the
  office's Contract; a no-NHI booking waits as a stub); "Integration failure" becomes "Row the office
  cannot match".
- `01-personas-and-responsibilities.md`: the intake operator (matching, PDF lists, received sheets, data
  quality); HL7 and FHIR monitoring Future scope.
- `README.md` (demo guide): readiness rows for intake.
- Finish with a consistency read of master-guide S1, S4 Beat 4 and S5 Beat 2 against the run sheet: no
  "default Contract", no 20950, no DRAFT for Souter's List, the same wording string everywhere.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after
the review pass. Re-run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs
34` first. Bar-only states are staged with the runner's `trigger` step (`{ "trigger":
"simulate-hospital-sync", "choice": "St George's" }`, `{ "trigger": "pdf-list-resend", ... }`; ATLAS.md
"Recipe format").

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) Automatic sync from St George's and Southern Cross | absent ("Not built yet: catch-up Phase 34 builds this") | captured (admin, `/admin/intake/matching`): `synced-rows` (trigger St George's: the three rows New, Sync micro-cap, wording as received, the no-NHI row waiting; highlight `row-new`) and 33's `rows-wait-for-decision` re-staged from the sync (nothing applied). Caption: "Rows from St George's and Southern Cross arrive on the matching screen, and nothing is applied until an admin decides". Drop the absent reason |
| [FT-02.2](../../../../requirements-board/requirements/stories/FT-02.2.md) Surgeon PDF list ingest | captured · surgeon-pdf-inbox (`/admin/integrations`, tab click) | captured (admin, `/admin/intake/pdfs`, no tab click): `surgeon-pdf-inbox` shows the stored lists with sender, received time, suggested List and status, unbadged. Caption: "The rooms' PDF lists, read and sent to the same matching screen as the hospital download" |
| [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md) Read, correct and ingest a surgeon PDF list | captured · surgeon-pdf[inbox,extracted] | captured (admin, `/admin/intake/pdfs`): keep `inbox` and `extracted` (unbadged), add `upload` (the badged sample picker; highlight `pdf-upload`), `correction` (the invalid NHI flagged, then corrected with the correction shown; highlight `pdf-correction`), `on-matching` (after Send, the rows on `/admin/intake/matching` with the Rooms PDF micro-cap and the rooms' wording) and `resent` (after `pdf-list-resend` and Send, the changed time as a difference for approval). Captions in the story's words ("extraction mistakes are corrected before the rows are ingested") |
| [EP-14](../../../../requirements-board/requirements/stories/EP-14.md) Health systems integration | no recipe (an epic shows its stories' shots) | no recipe of its own; its Future stories' recipes re-pointed below; US-14.4.1 no change here (Phase 40a owns it) |

**Recipes this phase breaks.** Re-point each (33's and 33a's land first; re-run the status tool and the
`--dry` run):
- Tabs moved to URL-routed Intake routes (the `role=button[name="Surgeon PDFs"]` and `"Validators"`
  clicks break): `US-11.1.2` to `/admin/intake/validators`; any recipe of the Retired `US-02.2.2` still
  on disk to `/admin/intake/pdfs`, its caption no longer "Future".
- 33's `/admin/matching` recipes (`US-02.1.1` to `US-02.1.4`, `FT-02.1`, `FT-02.5`, 33a's stub recipes
  where they open matching) to `/admin/intake/matching`; one that imports `SAMPLE_STG` after a sync
  expects R1 already imported.
- The Future-scope moves: `US-14.1.1` and `US-14.5.1` to `/demo/integrations/log`; `US-14.2.1`,
  `US-14.3.1` and `US-02.5.1` to `US-02.5.4` (path kept) checked under the Future-scope header, no
  caption calling the simulator or Christchurch Public in scope.
- The PWA stand-in's relabelled S1 choice, in any recipe or `pwa-device.spec.ts` step.
- **S1-related recipes** (`grep -l "MSG-STG-1001\|SAMPLE_STG\|Sarah" requirements-board/requirements/capture/recipes/*.json`:
  20a's US-02.5.7 and US-03.1.9 stack shots, 20's US-04.3.4 `needs-contract`, 33's matching shots):
  keep shot names; where the shot is about S1, re-stage through `simulate-hospital-sync`, the decision
  and the rail's No contract (RVG); show the wording exactly as received, the Booking on "Needs a
  Contract" before the pick and the stack after; no caption naming a default Contract, 20950 or DRAFT.

**ATLAS.md:** Routes (`/admin/intake/*`, the redirects, `/demo/integrations/log` and `/mapping`), Seed
data (the deliveries, the seeded PDF list, the S1 stub), hooks (`row-new`, `pdf-upload`,
`pdf-correction`, `pdf-send`), "Demo actions by screen" (`simulate-hospital-sync`, `pdf-list-resend`,
the HL7 entries on the Future-scope routes, the relabelled PWA choice; `ingest-pdf-row` gone), and the
Integration simulator section (Christchurch Public not integrated today).

## Adversarial review (after build)

Once the checklist and build, build:pwa, vitest and shots are green, run the standard **review-and-fix
pass (PROGRESS convention 18)**: three Opus reviewers (quality, bugs/correctness, plan adherence) with
the catalogue files, this doc, the 33 and 33a entries and the diff; verify each finding, fix the
confirmed ones with tests, re-green, record it. Do not re-raise settled Decisions-log rulings.

**Steer the reviewers at:**
- **No silent apply, no direct write.** No sync, PDF list, HL7 message or stand-in writes a Booking,
  List or Patient except through 33's decision or 33a's resolve; `ingestPdfRow` and every caller are
  gone.
- **Wording and Contract.** Every synced and PDF row carries its wording verbatim (the hospital's or the
  rooms', apart); a correction never touches the wording; no row or stand-in picks a Contract except
  the scripted rail answer on a Booking the stand-in created; no "default Contract" in S1.
- **Nothing staged twice.** Each delivery and each PDF list is staged once; delivered sets are derived
  from batches; sync and hand import dedupe in either order; a re-sent list's unchanged rows are
  skipped; reset restores the seed.
- **The PDF record.** Each correction is kept with who and when; an invalid NHI blocks the send, a
  blank one waits with a stub; the re-sent match is one pure function, labelled our reading; nothing
  claims OCR, a mailbox read or removal detection.
- **No invented sync mechanics.** No schedule, pull on open, Sync button, last-synced time, failure
  state, `setInterval`, `Date.now()` or `new Date()`; no persisted sync state.
- **Scope honesty.** Only the two integrated hospitals sync, named in one place; Christchurch Public is
  not a feed anywhere in scope; everything HL7, FHIR, retry, dead-letter and mapping sits on the
  Future-scope surface; PDF lists are product, unbadged; no FT-14.6 piece was built.
- **Seed hygiene.** One `PERSIST_VERSION` bump for the seeded PDF list; deliveries and PDF targets
  avoid every scripted-beat List; seeded `surgeonPdf` sources unchanged.
- **Triggers and PWA purity.** Entries scoped to their routes; the stand-in PWA only and the persona's
  Lists only; nothing from `futureScope/` or `apps/admin` in the PWA closure.
- **S1 and the guide agree** (sync, the stub, the match, the wording, the rail, the RVG code at
  capture, the PDF beat), with no MSG-STG-1001, HL7 caveat, 20950 or DRAFT.
- **Design and copy.** Admin Review anatomy, token tints, teal only for actions, no crimson on rows or
  pills, no en or em dashes, no "slot".

## PROGRESS.md updates

- **For the owner's review:** OQ-109 part 2 built as assumed, part 1's default (the catalogue's two
  names, in `INTEGRATED_HOSPITALS`); S1's narration of 20's step rail (a working direction); matching a
  re-sent PDF by surgeon, hospital, date and session (our reading); the PDF wording read-only in the
  review; S1's stub on Souter's Tue 28 Jul AM; whether a last-synced line should return (not built);
  whether the Intake home landed in full or as a plain grouping; the AR-35 wording on the deliveries and
  samples (AI-made, row 14 reused on the sync).
- **Status row** and entry `### Catch-up Phase 34 · Hospital sync, the rooms' PDF lists and the S1
  rebuild (date)`: the drift check against `a68f09b`; the real 33, 33a, 20 and 20a names used; what was
  built, moved or badged; `PERSIST_VERSION` from and to; the pinned deliveries and PDF targets; tests and
  the review pass; where the session cut fell; the S1 consistency read; the screenshot result (REPORT.md
  counts before and after).
- **Decisions log:**
  1. **Supersedes** Phase 11's "Integrations monitor is proposed product UI" (and convention 13's
     wording): the log, retries, dead-letter and mapping are Future scope on the demo surface (RV-14,
     RV-15).
  2. **Closes** Phase 14's interim Future-scope badges; the simulator is kept, not extended.
  3. **Supersedes** Phase 14's ruling that Surgeon PDFs stays in scope with its direct ingest, and D51's
     old default (hospital download first, PDF ingest Future Work): the rooms' PDF lists are product,
     stored as SurgeonPdfList records whose rows go through the matching screen; `ingestPdfRow` is gone
     (OQ-108, RV-12 overtaken).
  4. The sync is shown only as arrival (US-02.1.5; OQ-13); D52 part 2 built as assumed, part 1's
     default kept in one place.
  5. **Supersedes** Phase 11's Christchurch Public as a live feed (RV-16).
  6. **Supersedes** S1's St George's default Contract: the office answers 20's step rail, No contract
     (RVG) for Sarah; the RVG code at capture (D33).
- **Convention 4:** simulated external systems add the hospital sync stand-in and the PDF sample upload,
  and name the Future-scope surface.
- **Handoff notes:** **35**: decided rows, PDF rows included, feed the change history. **40**: the PDF
  row and the synced no-NHI row wait with 33a's stub; 40's waiting view and NHI guard cover both; S1's
  Sarah Mitchell suits the balance warning. **40a**: the as-typed NHI check also marks the PDF row
  correction. **43**: the restricted raw-row view covers synced rows, PDF rows and the Future-scope log.
  **44**: S1 is rebuilt, not polished. If OQ-13 or OQ-109 part 1 is answered: the switch points are
  `HOSPITAL_SYNC_DELIVERIES` and `INTEGRATED_HOSPITALS`.
