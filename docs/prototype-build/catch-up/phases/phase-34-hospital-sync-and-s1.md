# Phase 34 · The rooms' PDF lists, where a List came from, and the S1 rebuild

**Requirements covered:**
[FT-02.2](../../../../requirements-board/requirements/stories/FT-02.2.md) Surgeon PDF list ingest and [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md) Read, correct and ingest a surgeon PDF list (status 3; in the first release beside the hospital file import, landing on the same matching screen, OQ-108, D51. Contradicts and Partial today: correction before ingest exists, but there is no upload, the ingest writes straight onto a chosen List, a re-sent List is not modelled and a blank NHI makes a provisional Booking) ·
[US-02.2.4](../../../../requirements-board/requirements/stories/US-02.2.4.md) A List keeps where it came from (status 3, new 18 November; Partial: only a Draft List keeps a trail, no List records a PDF, hospital or by-hand origin, and nothing stores the address a PDF arrived from) ·
[DM-61](../analysis/domain-model-delta.md#dm-61) The rooms' PDF list as a source document (a stored SurgeonPdfList with its sender address, whose rows become Phase 33's import rows with the rooms as their source) ·
[DM-70](../analysis/domain-model-delta.md#dm-70) A List keeps where it came from (List origin, with the sender address for a PDF) ·
[EP-14](../../../../requirements-board/requirements/stories/EP-14.md) Health systems integration (status 1; Partial: the first release imports St George's and Southern Cross files into the matching screen, 33's "Import hospital file"; automatic sync, more feeds, automatic matching, HL7 v2 and FHIR are Future Work and move to a Future-scope surface here; the NHI lookup is in scope and 40a's) ·
[RV-14](../analysis/reverse-check.md#rv-14-hl7-v2-to-fhir-simulator-live-drip-and-scenario-s1-built-on-them) HL7 v2 to FHIR simulator, live drip and Scenario S1 built on them (Rework) ·
[RV-16](../analysis/reverse-check.md#rv-16-further-hospital-feeds-and-automatic-application-with-no-matching-step) Further hospital feeds and automatic application with no matching step (Rework: the Christchurch Public feed stops, rows wait for a decision).
**Left this phase:** US-02.1.5 (automatic sync from St George's and Southern Cross) moved under FT-14.6 as Future Work on 18 November (OQ-109 answered, D52): no sync deliveries, `'sync'` channel, Simulate sync action, schedule, Sync button, last-synced time or shot; S1's hospital rows come through 33's Import hospital file. Earlier: RV-12 left the reverse check (its work stays here through FT-02.2 and US-02.2.1); FT-14.6's sheets and auto-match (another provider's sheet comes in through 33's import); RV-15 falls away with RV-14's demotion.
Also touches, without closing:
[DM-34](../analysis/domain-model-delta.md#dm-34) (33's rows, decisions and unmatched queue; this phase adds the rooms' PDF rows),
[FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md), [US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md) to [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) (33's matching screen, which PDF rows feed; US-02.1.3's differences carry a re-sent PDF; US-02.1.4's no-NHI row waits with 33a's stub),
[US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md) and [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md) (35's update email and 40's missing-NHI request go to the List's sender, through 17b's helper this phase extends),
[US-13.6.5](../../../../requirements-board/requirements/stories/US-13.6.5.md) (17b's office contacts, the fallback) and [US-01.3.2](../../../../requirements-board/requirements/stories/US-01.3.2.md) (a recurring booking's List: its origin is a build choice),
[US-02.2.3](../../../../requirements-board/requirements/stories/US-02.2.3.md) and [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) (Future Work: a Booking left off a re-sent List is not detected),
[US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md), [US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) and [DM-51](../analysis/domain-model-delta.md#dm-51) (20a's text as received: a hospital row the hospital's, a PDF row the rooms'),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md), [US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) and [DM-49](../analysis/domain-model-delta.md#dm-49) (20's step rail and "Needs an invoice destination", which S1 shows),
[US-11.1.2](../../../../requirements-board/requirements/stories/US-11.1.2.md) (the NHI validators, which stay in Admin and check a PDF row's correction).
**Open questions:** [OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md) (hospital file format; Open): gates no build choice here; 33's samples are the one place a file's shape lives.
**Answered and built as answered** (Donald's, for the build, not yet confirmed by AA; no provisional labels): [OQ-109](../../../../requirements-board/requirements/questions/OQ-109.md) (D52, 18 November: hospital files imported through an integration, no automatic sync), [OQ-127](../../../../requirements-board/requirements/questions/OQ-127.md) (D74, 18 November: no surgeons' rooms; the office's emails go to the List's sender, else the surgeon's first office contact with the others offered), [OQ-108](../../../../requirements-board/requirements/questions/OQ-108.md) (D51: both intake sources, one matching screen), [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (no hospital default Contract), [OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md) (D33: the RVG code optional and the anaesthetist's) and [OQ-118](../../../../requirements-board/requirements/questions/OQ-118.md) (D66: a no-NHI row waits with a stub, 33a's). The office's Contract choice is **20's decided step rail** ("Where does the invoice go?", Payment type, **No contract · RVG** pinned first), which S1 narrates as 20 built it.
**Depends on:** Phase 33 (the matching screen and its Import hospital file, import rows carrying their source, decisions, the unmatched queue, `correctImportRow`, the one place its create paths live, its registry entries), Phase 33a (the Stub record, its List marking and its one resolve path) and Phase 17b (no rooms; the surgeon's office contacts and the one email helper, first office contact with the others offered). Through them: 14 (registry, `DemoBadge` tone `'future'`, PWA sheet), 15 (`Booking.source`), 15b (ACTIVE), 20 (the rail, `setProcedureContract`, `needsContractBookings`), 20a (the one procedure text as received; the `surgeonPdf` channel; the invoice description's defaults), 21, 28, 30 (recurring projection) and 31 (Draft Lists and their trail). UI unification U6 (and U1 to U5) DONE first.
**Estimated:** 2 sessions, with a cut line (one deliverable). **Session 1, the product pathway:** the SurgeonPdfList record with its sender, upload, correction, send to matching and the re-sent differences; the List's origin on every creation path with 17b's helper extended; ends green. **Session 2:** the Future-scope demotion, the Intake home and the S1 rebuild with its demo-guide patch. If session 1 runs long, the re-sent-differences trigger opens session 2. The S1 rebuild is never squeezed: if session 2 is tight, the Intake home lands as a plain grouping (item 7).

## Goal

Both first-release intake sources reach Phase 33's matching screen, and nothing reaches a Booking,
List or Patient until the office decides. The hospital's side is 33's Import hospital file: there is
no sync here (D52).

- **The rooms' PDF lists** (FT-02.2, US-02.2.1, DM-61). The canned inbox becomes stored source
  documents: a **SurgeonPdfList** per emailed List (file or facsimile, sending surgeon, the address it
  arrived from, received time, a suggested List, status, the rows as read with each correction). The
  admin uploads one (simulated reading, the sender address entered with the upload; no OCR, no
  mailbox), corrects a row's fields beside the facsimile (an invalid NHI among them), and **sends it
  to matching**, where its rows land as import rows with the rooms as their source and their text as
  the rooms' procedure text (20a). `ingestPdfRow` goes. A re-sent PDF's differences wait for approval
  (our reading, DM-61); a row with no NHI waits with 33a's stub.
- **Where a List came from** (US-02.2.4, DM-70). Every List records its origin: a rooms' PDF with the
  address it arrived from, the hospital's list, or by hand. It is stamped on every creation path, kept
  after assignment, and shown on the Admin List view and the Booking. 17b's one email helper puts the
  List's sender in front of the surgeon's first office contact, for 35's update email and 40's
  missing-NHI request.
- **The Future-scope surface** (EP-14, RV-14, RV-16). The HL7/FHIR simulator, live drip, message log
  with retry and dead-letter, and feed mapping leave Admin for a separated demo surface; Christchurch
  Public stops being a live feed; the callouts describe file imports. Matching, PDF lists, data quality
  and the NHI validators sit under one Admin **Intake** home, unbadged.
- **S1 rebuilt** around import then match: the St George's file imported, Sarah Mitchell's row reading
  `lap appy ?conv to open` matched onto Souter's Tue 28 Jul AM, the Booking on "Needs an invoice
  destination" set through 20's rail (Patient › Standard: No contract · RVG; the RVG code the
  anaesthetist's, A3 at capture, D33); a no-NHI booking waiting as a stub; and a rooms' PDF beat whose
  List shows its sender.

This phase builds no pricing structure and no wording model: it reads the Contract through 20's rail
and the procedure text through 20a's types.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `63a4490` (rename-aware;
   Node 22.18 or newer):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff FT-02.2,US-02.2.1,US-02.2.4,EP-14,US-02.1.5,US-02.2.3,US-02.5.4,FT-02.1,US-02.1.1,US-02.1.2,US-02.1.3,US-02.1.4,US-02.3.3,US-11.1.5,US-13.6.5,US-01.3.2,US-02.5.7,US-03.1.9,US-04.3.3,US-04.3.4,US-04.3.6,US-11.1.2,FT-14.1,FT-14.2,FT-14.3,FT-14.5,FT-14.6,US-14.5.1,OQ-13,OQ-78,OQ-99,OQ-108,OQ-109,OQ-118,OQ-127
   ```

   This doc reflects the catalogue at `63a4490` (18 November: OQ-109 answered, no automatic sync,
   US-02.1.5 Future Work; US-02.2.4 new; OQ-127 answered, no surgeons' rooms). If an item changed
   since, re-read it, adjust the work items and re-run the gap analysis for it per `../README.md`.
2. **US-02.1.5, EP-14, OQ-109.** If US-02.1.5 leaves Future Work or a sync returns, stop: it needs its
   own phase. If a third hospital joins the integrated set, stop: item 6's Christchurch Public stop
   would reverse.
3. **US-02.2.1, FT-02.2, US-02.2.4, OQ-108.** If US-02.2.1 returns to Future Work or OQ-108 is
   reversed, stop. If US-02.2.4 settles a build choice (a later PDF from another address, a recurring
   List's origin) or makes the mailbox read a requirement, build the answer in item 2's one place, or
   stop for the mailbox. If US-02.2.3 or US-02.5.4 leaves Future Work, note it and build nothing.
4. **FT-14.x and FT-14.6.** If any Future item (FT-14.1 to 14.3, 14.5, US-14.5.1) returns to scope,
   keep that piece in Admin unbadged; if FT-14.6 returns, stop.
5. **OQ-13.** If answered with a file shape, record it in PROGRESS.md; 33's samples are the place to
   adjust. Build no mechanism.
6. **The Contract and the wording.** If a hospital default or a row-set Contract returns (US-04.3.6
   out of Future Work), stop. If US-02.5.7 or US-03.1.9 changed, follow 20a's built stack.
7. **Confirm the dependencies are DONE** and take the real names from their PROGRESS entries:
   - **Phase 33:** `ImportBatch`, `ImportRow`, `IncomingBookingFields`, `ImportSource` (`'rooms'` for
     this phase's rows), `stageImportRows` (exported from `matchingActions.ts`) and its dedupe,
     `correctImportRow`, `decideImportRow`, `suggestDecision`, `sourceTextChannelFor`,
     `matchingAttentionCount`, the route and nav section, the Import hospital file action and its
     trigger ids, `SAMPLE_STG` (R1 is Sarah Mitchell reading `lap appy ?conv to open`) and `SAMPLE_SX`
     (its no-NHI row), the PWA stand-in `matching-office-matches-row` in `src/store/matchingDemo.ts`,
     how a decision sets `Booking.source` from the row's source, and **the one place its decisions
     create a List or Draft List** (the origin stamp goes there).
   - **Phase 33a:** the Stub record, its List marking ("1 waiting at intake"), the resolve path, its PWA
     entry and the List it seeded a stub on.
   - **Phase 17b:** the surgeon's office contacts and the one email helper (its name, inputs and what
     it returns: To, others offered, a blank email skipped); that rooms and `roomEmailForSurgeon` are
     gone.
   - **Phase 20:** the rail's component, `needsContractBookings`, `setProcedureContract`, the stored
     No contract · RVG id. **Phase 20a:** `addSourceText` or its replace helper, the `surgeonPdf`
     channel, `refreshInvoiceDescription`.
   - **Phases 30 and 31:** where a recurring booking projects a List, `createDraftList` and its
     `DraftTrail` (kept as is: it says how a Draft arose; the origin is new and separate).
   - **Phase 14:** the registry contract, the context keys `integrations.tab` and
     `integrationsSim.selectedMessageId`, and `ingest-pdf-row` (removed here).
8. Note `PERSIST_VERSION` (`src/store/appStore.ts`): this phase bumps it once, for the seeded
   SurgeonPdfList records and List origins.
9. Record the drift-check result (against `63a4490`) in the PROGRESS entry.

## Reference

**Design files (convention 17):** `docs/design/Admin Review.dc.html` (page anatomy, the table, the
`bannerIn` motion for newly arrived rows); `docs/design/Admin Day.dc.html` (the side nav and its amber
badge; the List view the origin line sits on); `docs/design/Design Language.dc.html` (pills, the
`'future'` badge neutrals, radii, `selection-slide`, reduced-motion fades). Teal is the only action
colour; crimson stays identity only. The Future-scope surface keeps `DemoSurface` chrome. The PDF
review keeps today's facsimile-beside-rows layout.

**Catalogue:** the covered items above, OQ-108, OQ-109, OQ-127, OQ-13, note AR-67 (18 November),
[AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md) and its note
[2026-10-08-procedure-picker-and-source-text.md](../../../../requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md),
"Illustrative source wording" heading (AI-made, not from AA; cite the heading): the wording the PDF
samples use. For the S1 narration only: [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md) and [AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md).

**Analysis:** `../GAP-ANALYSIS.md` before "## By epic" (theme 8, the intake cluster of "Demo-trigger
buttons"), then the EP-02 and EP-14 tables; `../epics/EP-02.md` and `../epics/EP-14.md`;
`../analysis/reverse-check.md` RV-14 to RV-16; `../analysis/domain-model-delta.md` DM-61, DM-70, DM-34,
DM-51; the prototype maps (`prototype-map-admin.md` 1, 8, 13, 14; `prototype-map-shell-demo-pwa.md` 1,
3 to 5, 7, 9; `prototype-map-store-seed.md` 5, 7 to 9; `prototype-map-domain.md` 6).

**Code entry points:**
- `apps/admin/screens/IntegrationMonitorScreen.tsx`: tabs, `FutureScopeNote`, `MessagesTab`,
  `FeedConfigTab`, `SurgeonPdfsTab` and `PdfReview` (the editable rows and NHI check),
  `DataQualityTab`, `ValidatorsTab`.
- `domain/integrations/pdfSamples.ts` (`PdfRow`, `SurgeonPdf`, `SURGEON_PDFS`, the facsimile builder;
  they become upload samples and seed), `store/integrationActions.ts` (`ingestPdfRow`, removed;
  `processMessage`, `MAX_ATTEMPTS`, `wireIntegrationRetry`, unchanged), `domain/integrations/feeds.ts`
  (`FEED.cph`, `FEED_META`).
- List creation: `domain/types.ts` (`ListBase`, `DraftTrail`, `BookingSource`), `store/slotActions.ts`
  (`placeListOnSlot`, `insertDraftList`), `store/draftListActions.ts` (`createDraftList`),
  `store/conflictReconcile.ts` (recurring projection), `store/mastersActions.ts`, `domain/seed/`
  (`index.ts`, `history.ts`, `recordedWindow.ts`), 33's create path; `shared/booking/BookingDetailBody.tsx`
  (the Booking's source label) and the Admin List view.
- `apps/admin/components/SideNav.tsx`, `AdminApp.tsx`, `apps/admin/routes.tsx`, `src/router.tsx`;
  `apps/demo/DemoIntegrations.tsx` (Live drip; the SFTP callout), `DemoSurface.tsx`,
  `DemoControlPanel.tsx` (`SCENARIOS` S1).
- Store: `appStore.ts` (`PERSIST_VERSION`, `freshAppState`, `backfillMerge`), `selectors.ts`
  (`integrationAttentionCount`), `domain/ids.ts` (`ID_FORMATS`); 33's `matchingActions.ts`,
  `matchingDemo.ts`, `domain/intake/`; 33a's stub module; 17b's email helper.
- Registry `shared/demoTriggers/registry.ts` (`ingest-pdf-row`, `fire-hospital-message`,
  `replay-hospital-message`) and its test; `pwa/pwaPurity.test.ts`; `domain/domainPurity.test.ts`.
- Tests: `store/integrationActions.test.ts` (PDF ingest), `store/demoScenarios.test.ts` (PDF ingest,
  S1), `store/persistMigrate.test.ts`, `shared/audit/actionLabels.ts`; `visual/phase11.spec.ts`,
  `screens.spec.ts`, `phase12.spec.ts` (S1), `pwa-device.spec.ts`, 33's `admin-matching.spec.ts`.

## Work items

### Session 1 · the product pathway (ends green)

1. **The rooms' PDF list record (DM-61; `domain/types.ts`, `src/domain/intake/pdfLists.ts`,
   `src/store/pdfListActions.ts`).**
   - `SurgeonPdfList { id, file: { name, facsimile }, surgeonId, senderEmail, hospitalId, subject,
     receivedAt, target: { anaesthetistId, dateISO, session } (the suggestion), status: 'received' |
     'sent', replacesId?, batchId?, rows: PdfListRow[] }`; `PdfListRow { id, asRead: { nhi?, name,
     dobISO?, scheduledTime?, ethnicityCode?, procedureText }, corrections: { field, from, to, at, by }[]
     }`. No room field (17b). `ID_FORMATS` gains `pdfList`. Slice in 33's `intake` state,
     `freshAppState`, the persisted payload and `entityCounts`.
   - Pure `effectivePdfRow(row)` (as read plus corrections) and `pdfRowIssues(row)` (the one NHI
     validator: invalid flagged, blank allowed and named "No NHI: will wait at intake").
   - Samples: `pdfSamples.ts` becomes the upload sample library (`PDF_LIST_SAMPLES`, each with a
     prefilled sender address; the facsimile builder kept; the deliberately wrong NHI kept; one blank
     NHI; operation text re-worded from AR-35's rooms' rows, labelled AI-made), plus one re-sent version
     per sample (`PDF_RESEND_SAMPLES`: one changed time, one new patient; the Okafor re-send from a
     different address in the same practice, so item 2's later-address rule shows). One sample's
     sender is the surgeon's first office contact, another a different address (a PA's own). Okafor's
     target is a session in its anaesthetist's Slot with **no List**, so its first decision creates the
     List; the other targets an existing List. Seed the inbox with the Okafor list as received
     (deterministic). Keep every target off scripted-beat Lists and S1's Tue 28 Jul AM; pin them.
   - Actions, each through `mutate()` with the demo clock, office only: `uploadPdfList(api, actor,
     sampleId, senderEmail)` (simulated reading; the address required and checked as an email; audited
     `pdfList.upload`; refuses a sample already in the inbox); `correctPdfListRow(api, actor, listId,
     rowId, patch)` (NHI, name, date of birth, time, ethnicity; the wording kept as read; each
     correction recorded; `pdfList.correct`); `sendPdfListToMatching(api, actor, listId)` (refuses an
     invalid NHI; stages the effective rows through `stageImportRows` with source `'rooms'`, label
     "<surgeon>'s PDF list · <date> <session>", `extras: { pdfListId, senderEmail }`;
     `sourceTextChannelFor` maps it to 20a's `surgeonPdf`, so the text is the rooms' procedure text
     and the first invoice-description default; status `sent`; `pdfList.send`). A Booking created from
     a rooms row takes source `surgeonPdf` (extend 33's mapping if it hardcodes `hospitalDownload`).
     Nothing writes a Booking: `ingestPdfRow`, its screen call and its tests go.
   - **A re-sent List (our reading, DM-61; labelled once in the module):** pure `resentPdfListOf(state,
     list)` on 33's matcher keys: an earlier sent list for the same surgeon, hospital, date and session.
     On upload it sets `replacesId`; on send, 33's dedupe skips unchanged rows (counted "unchanged"), a
     changed row arrives as a modification with its differences for approval (US-02.1.3), a new patient
     as a new row. A patient left off the re-sent List is not detected (US-02.2.3, Future Work).
   - Vitest: upload (sender required), correction history, the invalid-NHI refusal, a blank NHI staged
     and waiting with a stub, rows staged once with the rooms' source and wording verbatim, no Booking
     written, a re-sent list's differences, determinism, reset, persist migration.

2. **Where a List came from (US-02.2.4, DM-70; `domain/types.ts`, `src/domain/lists/listOrigin.ts`).**
   - `ListBase.origin: ListOrigin`, `{ kind: 'pdf', senderEmail, pdfListId } | { kind: 'hospital',
     hospitalId } | { kind: 'manual' } | { kind: 'recurring' }`. Required on every List; kept after
     assignment, a return to the office or a re-date. Separate from `DraftTrail`.
   - **Stamped on every creation path, one helper each calls** (`originForNewList`): 33's decision
     creating a List or Draft List from a row (the row's source: `'rooms'` gives `pdf` with the batch's
     `senderEmail` and `pdfListId`; `'hospital'` gives `hospital`); the office's List in a session and
     `createDraftList` (`manual`; a request whose source is PDF also asks "Sent from" on the request
     form and records `pdf` with that address); a recurring booking's projection and recurring-clash
     Draft (`recurring`); the seed. Grep every List constructor and leave none unstamped; a test walks
     each path.
   - **Build choices, one place each in `listOrigin.ts`, each with a comment citing US-02.2.4:** a List's
     origin is set when it is created and never changed by later rows, except that a rooms row decided
     onto a `pdf` List from a later PDF with a different address replaces the sender with the newer
     one (the office replies to whoever sent the latest list), the earlier address written to the
     List's History (`list.senderChanged`); a PDF row landing on a hospital or by-hand List adds no
     sender; a recurring booking's List records `recurring`, with no sender.
   - **17b's one email helper gains the List** (take its real name from 17b): given a List, the To is
     the List's `senderEmail` where it holds one, the surgeon's office contacts offered as the others;
     with none, 17b's rule unchanged (first office contact, others offered, never all, a blank email
     skipped). No second helper. 35 and 40 read it.
   - **Display:** the Admin List view gains an origin line ("From a rooms' PDF · sent from
     <address>", "From the hospital's list · St George's", "Entered by hand", "From a recurring
     booking") with "Replies go to <helper's To>"; the Booking (Admin, `BookingDetailBody`) shows the
     List's origin beside its own source. `data-shot` hooks `list-origin`, `booking-list-origin`.
   - Seed: Lists projected from a recurring booking `recurring`, others `manual`, plus pinned ones off
     scripted beats: one `pdf` List whose sender differs from its surgeon's first office contact (for
     35 and 40) and one `hospital` List. **PERSIST_VERSION** bump (one, with item 1).
   - Vitest: every path stamps, the AC pair (a PDF List holds its address; hospital and by-hand Lists
     hold none), kept after assignment, the later-address rule, the helper's order (sender, then first
     office contact, others offered), determinism.

3. **The PDF lists screen (product UI, in the current Integrations screen until item 7 moves it).** The
   tab is renamed **PDF lists**, unbadged. Inbox: one row per stored list (sender address, surgeon,
   hospital, received, suggested List, a "Re-sent" chip where `replacesId`, a status pill Received or
   Sent to matching). **Upload PDF list** (teal) opens a sample picker badged "Sample files" (simulated
   reading) with a "Sent from" address field, prefilled from the sample and editable. The review keeps
   the facsimile beside the editable rows: every correctable field, the NHI checked as typed, each
   correction shown under the row ("NHI ZAA0068 corrected to ZAA0067"), the text read-only as
   received; **Send to matching** (teal), then a link to the rows on the matching screen. Copy names no
   OCR or mailbox. `data-shot` hooks `pdf-upload`, `pdf-correction`, `pdf-send`.

4. **The matching screen receives both sources.** Source micro-caps "Hospital file · St George's" (33's
   wording if it differs) and "Rooms PDF · <surgeon>"; newly staged rows enter with `bannerIn` and a
   "New" chip (80ms fade under reduced motion); each row's wording exactly as 33 shows it. Empty state:
   "No rows waiting. Imported St George's and Southern Cross files, the rooms' PDF lists and received
   sheets land here." No sync tile, last-synced time or Sync button. `data-shot` hook `row-new`.

5. **Session 1 triggers (registry only; bodies in `src/store`).**
   - `pdf-list-resend`, "Receive updated PDF from rooms", on the PDF lists tab: a choice per sent sample
     with a re-sent version; lands the re-sent list in the inbox as received, marked Re-sent, with its
     sender; disabled until its first version is sent, or once received. **This is the entry that
     moves to open session 2 if session 1 runs long.**
   - Remove `ingest-pdf-row`. The List's origin needs no trigger: it shows through normal use. Registry
     tests: routes, `indexPath`, no dashes.
   - Close session 1 green with a short session note in PROGRESS.md.

### Session 2 · demotion, the Intake home and the S1 rebuild

6. **The Future-scope surface (EP-14, RV-14, RV-15, RV-16).** `/demo/integrations` becomes "Future
   scope: HL7 and FHIR" (path kept) with `/demo/integrations` (the simulator, unchanged),
   `/demo/integrations/log` (the moved `MessagesTab`) and `/demo/integrations/mapping` (the moved
   `FeedConfigTab`), components in `src/apps/demo/futureScope/`. Header `DemoBadge tone="future"` and
   one line: "Automatic hospital sync, HL7 v2, FHIR R4, near real time messaging, retries with a
   dead-letter queue and per-hospital mapping are Future scope, shown for discussion. In scope today:
   St George's and Southern Cross files imported, and the rooms' PDF lists, on Admin Intake, matched by
   the office." The SFTP callout in `DemoIntegrations.tsx` says the same file-import posture.
   **Christchurch Public stops being a live feed (RV-16):** the Live drip filters `FEED.cph` out (the
   one simulator change; firing a CPH message by hand still works), it reads "not integrated today ·
   example of a further feed (Future Work)", and a fired CPH message's batch is labelled "Future-scope
   HL7 demo · Christchurch Public". One line on the simulator: "Fired messages land on Admin Intake as
   rows for the office to decide." The Keycloak callout keeps NHI lookup (FT-14.4) in scope. Do not
   extend the simulator, message model, `MAX_ATTEMPTS` or `wireIntegrationRetry`. Remove Phase 14's
   interim Admin badges. `pwaPurity`: nothing from `futureScope/` reaches the PWA. Vitest: the drip's
   feed list excludes CPH.

7. **The Intake home.** One "Intake" nav item under Day view (33's `'matching'` and `'integrations'`
   sections merge; badge `matchingAttentionCount` only, `integrationAttentionCount` dropped). Routes
   `/admin/intake` (to `matching`), `/admin/intake/matching`, `/admin/intake/pdfs`,
   `/admin/intake/quality`, `/admin/intake/validators`, URL-routed tabs; `/admin/integrations` and
   `/admin/matching` redirect with `replace`. Everything 33 aimed at `/admin/matching` follows
   (triggers, the Booking's "From hospital row" link, specs). Header: "Imported hospital files from St
   George's and Southern Cross, and the rooms' PDF lists, arrive here. Every row waits for your
   decision." Drop the `integrations.tab` context key. Rename the screen file to `IntakeScreen.tsx` (or
   one file per tab). **If session 2 is tight**, the Intake home lands as a plain grouping: the one nav
   item and redirects, the existing in-page tabs, no URL-routed tabs; log it.

8. **Triggers re-pointed.** 33's entries (Import hospital file and the rest) to
   `/admin/intake/matching`; `pdf-list-resend` to `/admin/intake/pdfs` (if it opens this session, build
   it here); 14's `fire-hospital-message` and `replay-hospital-message` only on the Future-scope
   routes, badged, their description naming Admin, Intake. Control Panel index groups: Admin · Intake,
   and Future scope: HL7 and FHIR. Registry tests: each entry only on its routes; no CPH outside the
   Future-scope routes.

9. **The handset stand-in (PWA parity for S1).** Re-point 33's `matching-office-matches-row` (id kept)
   to **"Hospital file imported and my booking matched"** (Mobile Lists, List and Booking routes;
   `surfaces: ['pwa']`; `badge: 'office-stand-in'`); its S1 choice becomes "St George's file, Tue 28
   Jul AM (S1)", its other choices unchanged. Body in `matchingDemo.ts`: 33's import of `SAMPLE_STG`
   (dedupe as 33 built it), `decideImportRow` as `OFFICE_SIMULATION_ACTOR` with the suggestion for each
   confident row onto the persona's Lists, then the office's rail answer on each Booking it created
   (Payment type, Patient › Standard: No contract · RVG, via `setProcedureContract`; never on a matched
   Booking). Exceptions stay with the office. Disabled "Nothing new from the hospital for your Lists".
   Vitest; `pwa-device.spec.ts`: Sarah's Booking with `lap appy ?conv to open`, the RVG code to fill in
   and No contract · RVG.

10. **S1 rebuilt in the app.** Control Panel S1: blurb "A St George's file is imported with the
    hospital's own wording; the office matches Sarah Mitchell onto a booked List and says where the
    invoice goes; a booking with no NHI waits in its place; a rooms' PDF list keeps who sent it; it
    captures live on procedure day."; run `resetDemo` only; message per the run sheet (the demo guide
    beats below); nav "Go to Mobile app", "Go to Admin Intake". Remove Phase 14's caveat,
    MSG-STG-1001, any "default Contract" and code 20950. `demoScenarios.test.ts`: importing
    `SAMPLE_STG` stages Sarah's row (proposal on Souter's Tue 28 Jul AM, the wording exact); deciding
    it creates the Booking at 08:30, source `hospitalDownload`, patient CQY9304 reused, the only source
    text exactly `lap appy ?conv to open`, no RVG code, no Contract, on `needsContractBookings`; the
    rail's Patient › Standard answer sets No contract · RVG and takes it off; the List reads 0 of 4
    complete, ACTIVE; importing `SAMPLE_SX` leaves its no-NHI row waiting with its stub on the List 33a
    records; sending Okafor's PDF and deciding its first row creates a List with origin `pdf` and the
    upload's sender, the rest landing on it; S2 to S5 pins hold; the seeded PDF list and origins touch
    no scripted List.

11. **Close-out.** Update `phase11.spec.ts`, `screens.spec.ts`, `phase12.spec.ts` (S1 through the
    import, the decision, the rail) and 33's `admin-matching.spec.ts` (Intake routes); add
    `visual/intake-pdf-lists.spec.ts` (upload with a sender, correct, send, the rows on matching, the
    List created with its origin, the re-sent differences). New audit codes in `ACTION_LABELS` ("PDF
    list uploaded", "PDF list row corrected", "PDF list sent to matching", "List sender changed").
    README: the Intake routes, the PDF lists, the List's origin and the Future-scope surface.

12. **Build on the shared components; migrate these copies (UI unification).**
    - UI in this phase is built from the shared components: `LineTabs` and `LineTabLink` (U5) for the
      URL-routed Intake tabs (under item 7's fallback the in-page tabs use `LineTab`); the table kit
      (U6) for the PDF lists inbox and correction rows; `Eyebrow` (U6) for the source micro-caps and
      the origin line; `Pill`, `EmptyState` and `CountBadge` (U3) for the status, "Re-sent" and "New"
      chips, the empty state and the Intake nav badge; `TextField` (U4) for the correction fields and
      "Sent from"; `OverlayHeader` and `SheetActions` (U2) for the sample picker.
    - This phase also migrates these existing copies on the screens it rebuilds: the Integrations
      `TabButton` (`apps/admin/screens/IntegrationMonitorScreen.tsx`) is deleted; its private
      `StatusChip` and `EmptyNote` move onto `Pill` and `EmptyState` in the parts that stay product UI
      (PDF lists, Intake); the parts that move to `/demo/integrations` keep their plain look (README
      question 2).
    - Default props keep today's look; keep every `shot`, `data-shot`, `data-testid`,
      `data-validation-*` and row `data-*` hook on the element recipes and specs target; update the
      catalogue rows (`/demo/catalogue/*`) for components removed or merged.
    - If the U phase that builds a component named here has not landed when this phase starts, stop and
      say so (the Sequencing rules put it first); never build a private copy. See
      [`docs/ui-unification/PLAN.md`](../../../ui-unification/PLAN.md) section 3 and
      [`README.md`](../../../ui-unification/README.md) section 8.

## Demo triggers

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Upload PDF list | Admin · Intake · PDF lists | product button, badged sample picker | Stores the chosen sample as a received PDF list with the sender address entered (simulated reading) for review and correction |
| Receive updated PDF from rooms | Admin · Intake · PDF lists | bar | Re-sends a list already sent to matching with a changed time and a new patient, from a different address; once sent, the matching screen shows the change as a difference for approval and the new patient as a new row |
| (none) | Admin List view, Booking | normal use | The List's origin and sender show on every List; no button |
| Fire hospital message, Replay last message (re-pointed) | Future scope: HL7 and FHIR | bar | Unchanged bodies, only on the Future-scope surface; a fired message lands as a matching row; Christchurch Public only as a "not integrated today" example, not in the Live drip |
| Hospital file imported and my booking matched (re-pointed from 33) | Mobile · Lists, List, Booking | PWA only | Office stand-in: imports the St George's file, decides the confident rows for this anaesthetist's Lists and answers the rail with No contract · RVG on each Booking it created |

`ingest-pdf-row` is removed. The hospital's side is 33's Import hospital file; there is no sync action.
The matching screen, PDF lists and the Future-scope surface do not exist in the PWA; S1's handset side
is the stand-in above.

## Out of scope

- Any automatic hospital sync (US-02.1.5, Future Work): no schedule, pull on open, Sync button,
  last-synced time or failed-sync display; real file formats (OQ-13).
- Real PDF parsing, OCR, reading the rooms' mailbox, detecting a Booking left off a re-sent List
  (US-02.2.3) and accepting inbound changes automatically (US-02.5.4).
- Extending the HL7/FHIR simulator, message model, retry engine or feed mapping; FT-14.6's feeds,
  sheets and auto-match; hospital-supplied or default Contracts (US-04.3.6, OQ-78).
- 20's rail, 20a's wording model, 22a's payer on each Procedure, 33's matching rules, 33a's stubs and
  17b's contacts: reused, not changed, except the rooms' rows, the origin stamp in 33's create path,
  the List in 17b's helper and the route move.
- 35 (explicit save, the update email that reads the helper), 40 (the waiting-rows view, NHI mandatory
  on every form, the missing-NHI request), 40a, 43, the web app, and 44's full S1 to S5 rewrite.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence (ROADMAP.md "Owner
review: agents test themselves").

- [ ] Fresh reset, Admin: one "Intake" item under Day view; `/admin/integrations` and `/admin/matching` land on `/admin/intake/matching`; 33's bar entries and Import hospital file still there; the badge counts only rows waiting on matching; no Sync button, sync trigger or last-synced time anywhere.
- [ ] Import hospital file, St George's: Sarah Mitchell's row reads `lap appy ?conv to open`, proposal Create Booking on Souter's Tue 28 Jul AM; deciding it creates her Booking at 08:30 (source Hospital download, no RVG code, no Contract) on "Needs an invoice destination"; the rail ("Where does the invoice go?", Payment type, Patient › Standard) sets No contract · RVG; no "default Contract" anywhere.
- [ ] Mobile: four Bookings on Tue 28 Jul AM, 0 of 4 complete, ACTIVE; at Procedure day the anaesthetist picks RVG code A3 by type-ahead and the wording stays as received. Import hospital file, Southern Cross: its no-NHI row waits with its stub on its List.
- [ ] PDF lists (`/admin/intake/pdfs`), unbadged: the seeded Okafor list as received, with its sender; Upload PDF list adds a sample from the badged picker with "Sent from" required; the invalid NHI is flagged and Send is refused until corrected; the correction shows under the row; Send to matching stages the rows with the Rooms PDF micro-cap and the rooms' text, writes no Booking; deciding Okafor's first row creates the List, whose Admin List view reads "From a rooms' PDF · sent from <address>" and "Replies go to" that address; its Bookings show the same origin; a blank-NHI row waits with its stub.
- [ ] Receive updated PDF from rooms, then Send: unchanged rows skipped, the changed time a difference for approval, the new patient a new row; nothing applied until decided; once a re-sent row is applied, the List's sender is the newer address and History shows the change.
- [ ] Origins: a List the office creates in a session reads "Entered by hand" with no sender; a recurring booking's List "From a recurring booking"; a List created from a hospital row "From the hospital's list"; a Draft List assigned keeps its origin; the seeded `pdf` List's "Replies go to" is its sender, not the surgeon's first office contact.
- [ ] Future scope: HL7 and FHIR: header badge and the file-import line; simulator, log and mapping work as before; a fired message lands on Admin Intake; Christchurch Public not in the Live drip, labelled "not integrated today"; Admin has no Messages or Feed config tab; nothing in scope calls Christchurch Public a feed or says the hospitals sync.
- [ ] Data quality and Validators unbadged and unchanged.
- [ ] Control Panel S1 text and nav follow the new beats; the index groups Admin · Intake and Future scope.
- [ ] PWA (fresh storage): "Hospital file imported and my booking matched" on the Tue 28 Jul AM List adds Sarah with her stack and No contract · RVG; then disabled.
- [ ] S1 walked end to end from the run sheet; S4 Beat 4 and S5 Beat 2 as patched.
- [ ] No en or em dash in new copy; teal only on actions; no crimson on rows, pills or banners; no "slot".

## Demo guide updates

Patch in the same session (session 2), and the same sections of `master-demo-guide.html`:

- `03-demo-script.md`:
  - **S1 · Booking to theatre, rebuilt** (one rewrite superseding 20's, 20a's and 33's interim
    patches). Serves: the hospital file imported into the matching screen, the wording kept as
    received, the office's Contract choice, a booking with no NHI waiting as a stub, the rooms' PDF
    list and where a List came from, BTM capture. **Beat 1, "the hospital's file arrives":** Mobile Tue
    28 Jul AM (three cases), then Admin Intake, Import hospital file, St George's: Sarah's row reads
    `lap appy ?conv to open`; Create Booking. Say: the office imports each hospital's file through the
    integration, one theatre list a day; nothing reaches the schedule until the office decides; the
    hospital's text is kept exactly as sent and replaces the rooms' text on a Booking they sent first,
    the original in its change history; automatic sync is later work. **Beat 1a, "the office answers
    who pays":** Sarah waits on "Needs an invoice destination"; the rail asks "Where does the invoice
    go?" (Payment type: Patient, then Standard: No contract · RVG pinned first); the RVG code goes to
    the anaesthetist. **Beat 1b, "no NHI" (optional):** import the Southern Cross file; its no-NHI row
    waits, its stub on the List, never a Booking until the office adds the NHI. **Beat 1c, "the rooms'
    PDF list":** PDF lists, open Mr Okafor's list, show its sender, correct the flagged NHI, Send to
    matching, create the List from the first row; the List reads where it came from and who replies go
    to; then Receive updated PDF from rooms and Send: only the changed time shows, for approval. Say:
    both sources land on one screen; the List keeps its sender so updates and NHI requests go back to
    whoever sent it; a re-sent List is matched to the earlier one by surgeon, hospital, date and
    session (our reading); a dropped patient is not yet detected. **Beat 3:** pick RVG code A3 by
    type-ahead, Start now; the List stays ACTIVE (never DRAFT); drop 20950. Remove the HL7 caveat, the
    MSG-STG-1001 click, any sync line and any "default Contract" line. Discovery points: OQ-13 (file
    shape), the later-address and recurring-origin build choices.
  - **S4 Beat 4** and **S5 Beat 2** if 33 did not: the unmatched queue instead of Feed config (the
    Christchurch Public mapping fix only as a labelled Future-scope aside).
  - Any line presenting surgeon PDF ingest as Future scope or as a direct write, or hospitals as
    synced: PDF lists are product, through matching; hospital files are imported.
  - "Pre-demo setup", "Direct URLs" (Intake routes, the Future-scope sub-routes), "Recommended run
    orders", "What to narrate rather than click" (automatic sync, HL7, FHIR, further feeds, automatic
    matching, OCR and the mailbox read are Future or not built), "Recovery" (a used re-send needs a
    reset).
- `04-presenter-cheat-sheet.md`: demo-only items (the PDF sample picker and re-send, the Future-scope
  surface), the S1 line, "who do updates go to?" (the List's sender, else the surgeon's first office
  contact), and "real integration data?" (sample files and PDFs; the wording illustrative).
- `02-workflows-and-handoffs.md`: Workflow 1 (a hospital file, a PDF list or a hand entry, then
  matching and the office's Contract; the List keeps its origin; a no-NHI booking waits as a stub);
  "Integration failure" becomes "Row the office cannot match".
- `01-personas-and-responsibilities.md`: the intake operator (matching, PDF lists with their senders,
  received sheets, data quality); HL7 and FHIR monitoring and automatic sync Future scope.
- `README.md` (demo guide): readiness rows for intake.
- Finish with a consistency read of master-guide S1, S4 Beat 4 and S5 Beat 2 against the run sheet: no
  sync, no "default Contract", no 20950, no DRAFT for Souter's List, the same wording string
  everywhere.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after
the review pass. Re-run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs
34` first. Bar-only states are staged with the runner's `trigger` step (`{ "trigger":
"pdf-list-resend", ... }`; ATLAS.md "Recipe format").

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-02.2.4](../../../../requirements-board/requirements/stories/US-02.2.4.md) A List keeps where it came from | none (create it) | captured (admin): `list-origin` on the seeded `pdf` List's Admin view (highlight `list-origin`: "From a rooms' PDF · sent from <address>", "Replies go to") and a by-hand List with no sender; `booking-origin` on one of its Bookings (highlight `booking-list-origin`). Caption: "Each List records where it came from, and the address a rooms' PDF arrived from" |
| [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md) Read, correct and ingest a surgeon PDF list | captured · admin-surgeon-pdf[inbox,extracted] | captured (admin, `/admin/intake/pdfs`, no tab click): keep `inbox` and `extracted` (unbadged, sender shown), add `upload` (the badged picker with "Sent from"; highlight `pdf-upload`), `correction` (invalid NHI flagged, then corrected; highlight `pdf-correction`), `on-matching` (the rows on `/admin/intake/matching` with the Rooms PDF micro-cap) and `resent` (after `pdf-list-resend` and Send, the changed time as a difference). Captions in the story's words |
| [FT-02.2](../../../../requirements-board/requirements/stories/FT-02.2.md) Surgeon PDF list ingest | captured · surgeon-pdf-inbox (`/admin/integrations`, tab click) | captured (admin, `/admin/intake/pdfs`, no tab click): the stored lists with sender, received time, suggested List and status, unbadged. Caption: "The rooms' PDF lists, read and sent to the same matching screen as the hospital files" |
| [EP-14](../../../../requirements-board/requirements/stories/EP-14.md) Health systems integration | no recipe (an epic shows its stories' shots) | no recipe of its own; its Future stories' recipes re-pointed below |
| [US-14.4.1](../../../../requirements-board/requirements/stories/US-14.4.1.md) NHI lookup | partial · web-nhi-lookup, mobile-nhi-lookup | no change here (Phase 40a owns it) |

**Recipes this phase breaks.** Re-point each (33's and 33a's land first; re-run the status tool and the
`--dry` run):
- `US-02.1.5` (left; Future Work): its absent reason still names this phase; reword it to say the
  automatic sync is Future Work, no shot.
- Tabs moved to URL-routed Intake routes (the `role=button[name="Surgeon PDFs"]` and `"Validators"`
  clicks break): `US-11.1.2` to `/admin/intake/validators`; any recipe of the Retired `US-02.2.2`
  still on disk to `/admin/intake/pdfs`, its caption no longer "Future".
- 33's `/admin/matching` recipes (`US-02.1.1` to `US-02.1.4`, `FT-02.1`, `FT-02.5`, 33a's stub recipes
  where they open matching) to `/admin/intake/matching`.
- The Future-scope moves: `US-14.1.1` and `US-14.5.1` to `/demo/integrations/log`; `US-14.2.1`,
  `US-14.3.1` and `US-02.5.1` to `US-02.5.4` (path kept) checked under the Future-scope header, no
  caption calling the simulator, a sync or Christchurch Public in scope.
- The PWA stand-in's relabelled S1 choice, in any recipe or `pwa-device.spec.ts` step.
- **S1-related recipes** (`grep -l "MSG-STG-1001\|SAMPLE_STG\|Sarah" requirements-board/requirements/capture/recipes/*.json`):
  keep shot names; where the shot is about S1, stage through 33's Import hospital file, the decision
  and the rail's No contract · RVG; no caption naming a sync, a default Contract, 20950 or DRAFT.

**ATLAS.md:** Routes (`/admin/intake/*`, the redirects, `/demo/integrations/log` and `/mapping`), Seed
data (the seeded PDF list, the seeded `pdf` and `hospital` Lists), hooks (`row-new`, `pdf-upload`,
`pdf-correction`, `pdf-send`, `list-origin`, `booking-list-origin`), "Demo actions by screen"
(`pdf-list-resend`, the HL7 entries on the Future-scope routes, the relabelled PWA choice;
`ingest-pdf-row` gone), and the Integration simulator section (Christchurch Public not integrated
today).

## Adversarial review (after build)

The standard review-and-fix pass (PROGRESS convention 18) with the catalogue files, this doc, the 17b,
33 and 33a entries and the diff.

**Steer the reviewers at:**
- **No silent apply, no direct write.** No PDF list, HL7 message or stand-in writes a Booking, List or
  Patient except through 33's decision or 33a's resolve; `ingestPdfRow` and every caller are gone.
- **No sync.** No sync action, delivery, `'sync'` channel, schedule, Sync button, last-synced time,
  `setInterval`, `Date.now()` or `new Date()`; no copy saying the hospitals sync.
- **The origin on every path.** Every List constructor (seed, recurring projection, office create,
  Draft request, 33's create path) stamps `origin` through the one helper; hospital and by-hand Lists
  hold no sender; origin survives assignment, return and re-date; the later-address and recurring
  choices each live in one place.
- **One email helper.** 17b's helper is extended, not copied: the List's sender first, then the first
  office contact with the others offered, never all.
- **Wording and Contract.** Every PDF row carries its wording verbatim; a correction never touches it;
  no row or stand-in picks a Contract except the scripted rail answer on a Booking the stand-in
  created.
- **Nothing staged twice.** Each PDF list is staged once; a re-sent list's unchanged rows are skipped;
  reset restores the seed.
- **The PDF record.** Each correction kept with who and when; an invalid NHI blocks the send, a blank
  one waits with a stub; the sender is required; the re-sent match is one pure function, labelled our
  reading; nothing claims OCR, a mailbox read or removal detection.
- **Scope honesty.** Everything HL7, FHIR, retry, dead-letter and mapping sits on the Future-scope
  surface; Christchurch Public is not a feed anywhere in scope; PDF lists are product, unbadged; no
  FT-14.6 piece was built.
- **Seed hygiene.** One `PERSIST_VERSION` bump; PDF targets and seeded origins avoid every
  scripted-beat List; seeded `surgeonPdf` sources unchanged.
- **Triggers and PWA purity.** Entries scoped to their routes; the stand-in PWA only and the persona's
  Lists only; nothing from `futureScope/` or `apps/admin` in the PWA closure.
- **S1 and the guide agree** (import, the match, the wording, the rail, the stub, the PDF beat and its
  sender, the RVG code at capture), with no MSG-STG-1001, HL7 caveat, sync, 20950 or DRAFT.
- **Design and copy.** Admin Review anatomy, token tints, teal only for actions, no crimson on rows or
  pills, no en or em dashes, no "slot".
- **Private copies.** A new private copy of a shared component (`docs/ui-unification/README.md` section
  8), or a copy this phase was to migrate and left, is a finding.

## PROGRESS.md updates

- **For the owner's review** (built defaults): a later PDF from another address replaces the List's
  sender, the earlier kept in History; a recurring booking's List records "From a recurring booking";
  an office-logged request from a PDF asks "Sent from" and records a PDF origin; seeded Lists `manual`
  or `recurring` except the pinned `pdf` and `hospital` ones; each sample's prefilled sender; matching
  a re-sent PDF by surgeon, hospital, date and session (our reading); the PDF wording read-only in the
  review; S1's no-NHI beat from the Southern Cross file; whether the Intake home landed in full or as
  a plain grouping; the AR-35 wording on the samples (AI-made).
- **Status row** and entry `### Catch-up Phase 34 · The rooms' PDF lists, where a List came from, and
  the S1 rebuild (date)`: the drift check against `63a4490`; the real 17b, 33, 33a, 20 and 20a names
  used; what was built, moved or badged; `PERSIST_VERSION` from and to; every List creation path and
  its origin; the pinned PDF targets and seeded origins; tests and the review pass; where the session
  cut fell; the S1 consistency read; the screenshot result.
- **Decisions log:**
  1. **Supersedes** Phase 11's "Integrations monitor is proposed product UI" (and convention 13's
     wording): the log, retries, dead-letter and mapping are Future scope on the demo surface (RV-14,
     RV-15).
  2. **Closes** Phase 14's interim Future-scope badges; the simulator is kept, not extended.
  3. **Supersedes** Phase 14's ruling that Surgeon PDFs stays in scope with its direct ingest: the
     rooms' PDF lists are product, stored as SurgeonPdfList records with their sender, whose rows go
     through the matching screen; `ingestPdfRow` is gone (OQ-108).
  4. No hospital sync (D52, US-02.1.5 Future Work): hospital rows arrive only through 33's Import
     hospital file.
  5. **Supersedes** Phase 11's Christchurch Public as a live feed (RV-16).
  6. Every List records its origin, and a PDF List its sender (US-02.2.4, DM-70); 17b's helper puts the
     sender first (D74); the build choices as listed above.
  7. **Supersedes** S1's St George's default Contract: the office answers 20's rail, No contract · RVG
     for Sarah; the RVG code at capture (D33).
- **Convention 4:** simulated external systems add the PDF sample upload, and name the Future-scope
  surface.
- **Handoff notes:** **35**: the update email's To is the helper's (the List's sender first); decided
  rows, PDF rows included, feed the change history. **40**: the missing-NHI request reads the same
  helper; a PDF row's no-NHI stub is covered by 40's waiting view; the seeded `pdf` List shows the
  sender winning. **40a**: the as-typed NHI check also marks the PDF row correction. **43**: the
  restricted raw-row view covers PDF rows and the Future-scope log. **44**: S1 is rebuilt, not
  polished; if US-02.2.4's build choices are answered, `listOrigin.ts` is the one place.
