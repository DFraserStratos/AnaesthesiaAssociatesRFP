# Phase 34 · Hospital sync, manual sheets and the S1 rebuild

**Requirements covered:**
[US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) Automatic sync from St George's and Southern Cross (Proposed; re-graded Contradicts at `60e2d1e`: today's feeds push and apply, and Christchurch Public runs as a third live feed. Trimmed on 2026-10-02 to the two hospitals being in scope and one criterion, **No silent apply**; the technical particulars are still to come; unchanged in substance since) ·
[FT-14.6](../../../../requirements-board/requirements/stories/FT-14.6.md) Further hospital feeds and automatic matching (Proposed, Partial at `60e2d1e`; its children are in the Future Work lane) ·
[RV-05](../analysis/reverse-check.md#rv-05-admin-integrations-monitor-presents-future-reliability-tooling-dead-letter-queue-retries-per-hospital-mapping-as-product) Admin Integrations monitor presents Future reliability tooling as product (Hide from demo) ·
[RV-06](../analysis/reverse-check.md#rv-06-hl7-to-fhir-simulator-live-drip-and-scenario-s1-built-on-them) HL7 to FHIR simulator, live drip, and Scenario S1 built on them (Rework) ·
[RV-26](../analysis/reverse-check.md#rv-26-surgeon-pdf-upload-and-ingest-is-shown-unbadged-as-in-scope-product) Surgeon PDF upload and ingest is shown unbadged as in-scope product (Hide from demo).
Also touches, without closing:
[DM-34](../analysis/domain-model-delta.md#dm-34) (Phase 33 builds the import rows, decisions and unmatched queue; this phase adds only the `'sync'` channel and the sync deliveries. DM-34's 2026-10-03 correction drops the optional per-hospital sync state, because US-02.1.5 no longer asks for a last-synced time),
[FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md) (Verify; the parent feature: "everything from the other providers is entered by hand", the baseline the manual sheets show; its 2026-10-07 note: the first version has **no automated decisions**, rows from "probably just the same two hospitals" land in the matching screen, and automated approvals come once the matching is trusted, which keeps auto-match a Future-scope demo toggle),
[US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md) (retitled "Import hospital bookings" on 2026-10-02, however each hospital provides them), [US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) (2026-10-08: each row shows its procedure text exactly as the hospital sent it), [US-02.1.3](../../../../requirements-board/requirements/stories/US-02.1.3.md) (2026-10-07: a later update to a matched Booking arrives in the same screen, matched by date, surgeon, location and session, and the admin approves it; St George's delivery 2 is one) and [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md) (Phase 33's import, decisions and unmatched queue, which synced rows and sheets feed),
[US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) (new 2026-10-08, Confirmed: the procedure text is kept exactly as received from every channel, never overwritten; 20a builds the source texts and 33 writes a row's text onto the Booking it creates or matches, so every synced and sheet row here carries realistic wording and S1 shows it) and [US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) (20a's three-part stack: wording as received, procedure and RVG code, Contract; S1 points at it),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) and [US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) (Phase 20's: No contract (RVG) always offered first, nothing derived from the hospital, OQ-78 answered; the office sets the Contract at setup and a Booking without one waits on the "Needs a Contract" list; a synced row's Booking arrives with no Contract and S1 shows the office choosing it),
[DM-51](../analysis/domain-model-delta.md#dm-51) (source wording, 20a's) and [DM-49](../analysis/domain-model-delta.md#dm-49) (one stored No contract (RVG) in place of the per-hospital defaults, 18's), which S1 now demonstrates,
[US-14.6.1](../../../../requirements-board/requirements/stories/US-14.6.1.md) and [US-14.6.2](../../../../requirements-board/requirements/stories/US-14.6.2.md) (Future Work lane: the five providers arrive as hand-imported sheets, and auto-match is only a badged demo toggle),
[US-11.1.2](../../../../requirements-board/requirements/stories/US-11.1.2.md) (the NHI validators, which stay in Admin),
[FT-02.2](../../../../requirements-board/requirements/stories/FT-02.2.md) (Verify; its only live child, [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md), moved to the Future Work lane on 2026-10-02, and [US-02.2.2](../../../../requirements-board/requirements/stories/US-02.2.2.md) is Retired into it: the existing Surgeon PDFs tab is badged Future scope here, not extended).
Open question: [OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md) (hospital download format; still Open at `60e2d1e`, with Stratos Tech to ask; its 2026-10-07 update: the format is still not known, the first version has no automated intake, and which field carries the procedure text is not known either). It no longer gates a build choice: US-02.1.5 asks for no cadence, no sync button and no last-synced time, so this phase builds none of them and labels nothing provisional. Synced rows use Phase 33's neutral row shape, which is format-agnostic, with the procedure text in its own field.
Relied on through 20 and 33, not built here: **D33** ([OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md), Open: a Booking may be set up with no procedure picked, the procedure required at completion). S1's Booking arrives from its row with its wording and no procedure, and the anaesthetist picks Appendicectomy at capture, as 20a scripts it; if OQ-99 is answered the other way, the office picks the procedure in Beat 1 (drift check step 8). **Answered and built as answered:** [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (No contract (RVG) is the one default, offered first for every procedure, billing the payer on the Booking; no hospital default Contract), so S1's office picks No contract (RVG) for Sarah Mitchell.
**Depends on:** Phase 33 (the matching screen, import rows and decisions with each row's wording as received, the unmatched queue, no silent apply, and its registry entries). Through 33 it also relies on 14 (the trigger registry, `DemoBadge` tone `'future'`, the PWA sheet), 15 (Booking vocabulary and `Booking.source`), 15b (ACTIVE for an assigned List), 17 (hospital contact emails), 20 (no default Contract: a created Booking has none and waits on the "Needs a Contract" list; the one Contract picker with No contract (RVG) first; the guarded `setProcedureContract`), 20a (`Procedure.sourceTexts`, `addSourceText` and the three-part stack in both apps), 28 and 31 (Slots, ACTIVE Lists and Draft Lists as row targets). Phase 21 (the payer on the Booking, prefilled from the patient) is outside 33's chain but normally DONE by number; use it if DONE, so S1's "who is invoiced" reads Sarah Mitchell as the payer. It no longer depends on Phase 27: surgeon PDF ingest, whose review was to write 27's estimated duration, is Future Work.
**Estimated:** 1 session, full. Order: sync deliveries and the store action, the Intake home and the Surgeon PDFs badge, the Future-scope surface, the S1 rebuild and the PWA stand-in (the headline beat, so a checkpoint here leaves S1 demoable), then the three providers' sheets, the auto-match toggle, and the close-out. If the session runs short, the auto-match toggle (item 7) is the piece to move to a follow-up, logged in PROGRESS; nothing else depends on it.

## Goal

St George's and Southern Cross, the two hospitals integrated today, bring their booking rows into
Phase 33's matching screen without an admin downloading them by hand. How each hospital delivers its
data is for the integration team to establish (OQ-13, US-02.1.5's 2026-10-02 rewrite: "the particulars
of their technical implementation are yet to come"), so the demo shows arrival only: a **Simulate
sync** demo action per hospital delivers that hospital's next set of rows, marked New on the matching
screen. Synced rows are only rows: nothing reaches a Booking, List or Patient until the admin decides
(US-02.1.5 "No silent apply"). There is no schedule, no pull on open, no Sync button and no last-synced
state to build: Greg and Donald took them out ("Let's leave it out").

Only those two hospitals sync. The Christchurch Public feed, which today runs as a third live HL7 feed,
stops being one: it has no sync and no in-scope surface, and survives only as a labelled example on the
Future-scope surface. The other Christchurch providers (Forte Health, Christchurch Eye Surgery,
Burwood, Southern Endo, McMurray Centre) keep today's baseline: their daily sheets are imported by hand
into the same screen (FT-02.1). A badged demo toggle shows the later phase of FT-14.6 (routine updates
auto-matched, exceptions left for the admin) without pretending it is in the first release.

The HL7 v2 and FHIR tooling (simulator, live drip, message log with retry and dead-letter, per-hospital
feed mapping) leaves Admin for a clearly separated Future-scope demo surface, finishing what Phase 14's
interim badges started (RV-05, RV-06). The in-scope pieces stay in Admin under one **Intake** home:
matching, data quality and the NHI validators. The Surgeon PDFs tab stays reachable there but is badged
Future scope, with its ingest action and demo trigger, because surgeon PDF ingest moved to the Future
Work lane on 2026-10-02 (US-02.2.1, RV-26); it is not extended (no upload, no new review fields).

S1, the headline scenario, is rebuilt here around sync then match, including its Control Panel jump,
run-sheet beats and the handset path. Under the 2026-10-08 rules it shows three things the old S1
could not:

- **The wording as received.** Sarah Mitchell's synced row reads `lap appy ?conv to open` (AR-35's
  row 14, the shorthand 20a seeded on MSG-STG-1001 and Phase 33 carries on `SAMPLE_STG` R1). The
  matching screen shows it on the row (US-02.1.2), and the Booking created from the row keeps it,
  verbatim, as its source wording (US-02.5.7), at the top of 20a's three-part stack on mobile, web and
  Admin (US-03.1.9). Nothing here writes or edits wording: Phase 33's create path does, through 20a's
  `addSourceText` rules.
- **The office choosing the Contract.** The row carries no Contract and nothing is derived from St
  George's (US-04.3.3, OQ-78 answered; hospital-set Contracts are Future Work, US-04.3.6), so the new
  Booking arrives with no Contract and sits on Phase 20's "Needs a Contract" list. The office opens it
  and picks **No contract (RVG)**, the first row of the one picker, with any fitting Contracts listed
  below it under their holders' headings. The stack then reads: the wording as received, "Procedure to
  choose", and No contract (RVG) invoicing the payer on the Booking (Sarah Mitchell, prefilled from her
  patient record by Phase 21) at RVG pricing. There is no "default Contract" anywhere in S1.
- **The procedure picked by someone who knows the work.** The anaesthetist picks Appendicectomy (A3)
  from 19's two-tab picker at capture in Beat 3, reading the wording above it (D33's blank procedure at
  setup, as 20a scripts it).

This phase builds no pricing structure and no wording model: it reads the Contract only through Phase
20's picker and selectors, and the wording only through 20a's types, so the pricing model stays in
one place in `aa-prototype/src/domain/billing` as the earlier phases left it.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and open questions against the plan's baseline,
   catalogue commit `60e2d1e` (rename-aware; never a plain `git diff` of the catalogue folder; needs
   Node 22.18 or newer):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-02.1.5,FT-14.6,US-14.6.1,US-14.6.2,US-02.2.1,FT-02.1,FT-02.2,US-02.1.1,US-02.1.2,US-02.1.3,US-02.1.4,US-02.5.7,US-03.1.9,US-04.3.3,US-04.3.4,US-04.3.6,US-11.2.2,US-11.1.2,FT-14.1,FT-14.2,FT-14.3,FT-14.5,US-14.5.1,OQ-13,OQ-34,OQ-78,OQ-99
   ```

   At plan time (2026-10-08, `3d3a18c..60e2d1e`; the catalogue also moved to
   `requirements-board/requirements/`) the changes that touch this phase were: FT-02.1 gained a
   2026-10-07 note (no automated decisions in the first version; rows from "probably just the same two
   hospitals" land in the matching and creating screen; automated approvals once the matching is
   trusted); US-02.1.2 gained an acceptance criterion that each row shows its procedure text exactly as
   sent; US-02.1.3 now says a later update is matched by "the date, the surgeon, the location, the
   slot" and approved; US-02.5.7 is new (Confirmed: wording kept verbatim from every channel, never
   overwritten, optional "as given" on manual entry), and US-02.3.1 and US-02.4.1 gained the "as
   given" field (20a's and 35's forms, not this phase's); OQ-13 gained a 2026-10-07 update and stays Open; US-04.3.3 is
   now "No contract (RVG) always offered first" with nothing derived from the location (OQ-78
   answered), and US-04.3.4 makes the Contract mandatory with a "Needs a Contract" list (OQ-99 open on
   a blank procedure); US-02.1.5, US-02.1.1, US-02.1.4, US-02.2.1, FT-02.2, US-14.6.1 and US-14.6.2
   changed only in sources, artifacts or link markup. The earlier 2026-10-02 changes (US-02.1.5
   trimmed to "No silent apply", US-02.2.1 to the Future Work lane, US-02.1.1 retitled, US-02.1.2's
   note on the manual step) still stand. `domain-model.md` section 1 still describes the sync as "on a
   schedule, when the matching screen opens, and by a sync button, with a last-synced time": that row
   is stale against US-02.1.5 (GAP-ANALYSIS lists the contradiction); the story wins. This doc already
   reflects all of it; diff only for anything after `60e2d1e`. If an item changed since, re-read it and
   adjust the work items; re-run the gap analysis for that item only, per `../README.md`.
2. **US-02.1.5.** If it regains a schedule, a sync button or a last-synced time, stop and tell the owner
   the shape (it was removed on 2026-10-02); do not build them on a guess. If it is now Retired or
   Future, drop work items 1, 2 and 8's sync entries, rebuild S1 around Phase 33's hand import instead,
   keep the Future-scope demotion (it stands on RV-05 and RV-06), and note it in PROGRESS.md. If a third
   hospital is added to its integrated set (for example Christchurch Public), stop and tell the owner:
   work item 5's demotion of the Christchurch Public feed would reverse.
3. **FT-14.6, US-14.6.1, US-14.6.2.** If the five providers' feeds or automatic matching move out of
   the Future Work lane into the first release, stop and tell the owner: auto-match would become
   product behaviour, not a demo toggle, and work item 7 changes shape. If FT-14.6 itself is Retired or
   Future, drop the auto-match toggle, keep the manual-provider sheets (they are the FT-02.1 baseline)
   and note it.
4. **US-02.2.1 and FT-02.2.** If US-02.2.1 leaves the Future Work lane, stop and tell the owner: the
   Surgeon PDFs tab would be unbadged and its upload and review work (planned here before 2026-10-03)
   would need a phase. If it is Retired, hide the tab and its trigger instead of badging them, and note
   it.
5. **FT-14.1, 14.2, 14.3, 14.5, US-14.5.1** (all Future at `60e2d1e`). If any has come back into
   scope, do not demote that piece: keep it in Admin, unbadge it, and tell the owner.
6. **OQ-13** (Open at `60e2d1e`). If it has been answered with a delivery shape or a cadence, record it
   in PROGRESS.md; build nothing from it unless US-02.1.5 also changed (step 2). The fixture rows'
   fields (patient, NHI, date, time, surgeon, procedure text as received, hospital appointment
   reference; Contract and patient details may be absent, as Vanessa describes) are the one place to
   adjust. If it names the field that carries the procedure text (US-02.5.7's note), record it; the
   rows keep one text field either way.
7. **The Contract and the wording (US-04.3.3, US-04.3.4, US-04.3.6, US-02.5.7, US-03.1.9, OQ-78).** If
   a hospital default Contract has come back, or a row may now set a Contract (US-04.3.6 out of the
   Future Work lane), stop and tell the owner: S1's Contract beat changes shape. If No contract (RVG)
   no longer bills the payer on the Booking (OQ-78), rebuild nothing here: S1 narrates whatever 20's
   who-is-invoiced selector and 20a's stack show. If US-02.5.7 or US-03.1.9 changed the stack's order or
   parts, follow 20a's built stack; this phase only points at it. If US-02.5.7 was Retired or moved to
   Future, drop the wording from the deliveries, the sheets and the S1 narration and note it.
8. **OQ-99 (D33, Open).** If answered "the procedure is required at setup", the office picks the
   procedure in S1 Beat 1 (Appendicectomy, from the wording, through 19's two-tab picker) before the
   Contract, item 10's test and the run sheet pin it there, and Beat 3 only confirms it; if answered as
   the default, drop the provisional reading from the S1 narration. Either way, build what Phase 20
   and 21 built.
9. **Confirm the dependencies are DONE** and read their PROGRESS entries for the real names this doc
   can only anticipate:
   - **Phase 33** (planned names shown; use the real ones from its entry): `ImportBatch` and
     `ImportRow` (with `incoming: IncomingBookingFields`, `externalRef` as the appointment reference,
     and a `channel` union of `'download' | 'manualSheet' | 'feedMessage'`) in a top-level
     `intake` slice; the one staging entry point `stageImportRows(api, actor, channel, hospitalId,
     label, rows, extras)` in `src/store/matchingActions.ts` (exported there, not from `store/index.ts`; import it directly), with its dedupe (an identical row for the
     same appointment is skipped and counted in `skippedCount`); `importHospitalDownload(api, actor,
     sampleId)`; the decision action `decideImportRow` and the derived `suggestDecision`; the badge
     selector `matchingAttentionCount`; the screen `apps/admin/screens/MatchingScreen.tsx` (parts in
     `apps/admin/matching/`) on route `/admin/matching` with its own `'matching'` nav section under Day
     view, and its import button's real label (US-02.1.1 is now "Import hospital bookings"); the sample
     library `HOSPITAL_DOWNLOAD_SAMPLES` in `src/domain/intake/hospitalDownloads.ts` (`SAMPLE_STG`, whose
     R1 is Sarah Mitchell; `SAMPLE_SX`; and `SAMPLE_FORTE_SHEET`, channel `manualSheet`); its bar
     triggers `matching-send-unmatched-row`, `matching-send-update` and `matching-reschedule-no-list`
     (scoped to `/admin/matching`); its PWA stand-in `matching-office-matches-row` ("Hospital row arrives and the
     office matches it", body `officeMatchesHospitalRow` in `src/store/matchingDemo.ts`, two `choices`);
     the context key `matching.selectedRowId`; `visual/admin-matching.spec.ts`; and how it re-pointed
     `processMessage` to stage rows (RV-13). Wherever this doc names a planned 33 symbol, use the real
     one.
   - **Phase 14:** the registry contract (`DemoTrigger`, `choices`, `badge`, `when`, `indexPath`), the
     `DemoBadge` `'future'` tone, the context keys it defined (`integrations.tab` and
     `integrationsSim.selectedMessageId`), the `ingest-pdf-row` entry (gated by
     `when: integrations.tab === 'pdfs'`, body `SURGEON_PDFS[0]` row R2, no badge) and the interim
     Future-scope badges this phase replaces.
   - **Phase 15:** `BookingSource` (a synced or imported row creates `hospitalDownload`). Seeded
     Bookings stamped `surgeonPdf` keep that descriptive value; nothing here changes them.
   - **Phase 15b:** an assigned List reads ACTIVE (never DRAFT); DRAFT is a Draft List (31).
   - **Phase 17:** the hospital contact-email field (the three new hospitals need one).
   - **Phase 20:** no default Contract; `createBooking` with no pick leaves the Procedure without one;
     `needsContractBookings` and Admin Day's "Needs a Contract" card; `contractCandidatesForProcedure`
     with No contract (RVG) first; the guarded `setProcedureContract(api, actor, procedureId, {
     contractId, lineId? })`; the id of 18's stored No contract (RVG) (use the real names).
   - **Phase 20a:** `SourceText` and `SourceTextChannel`, `Procedure.sourceTexts`, `addSourceText` (the
     exact duplicate adds nothing), the shared `ProcedureStack`, and MSG-STG-1001's reworded SCH-7 (`lap
     appy ?conv to open`).
   - **Phase 21** if DONE: the payer on the Booking prefilled from the patient, and who is invoiced
     re-pointed at it; if not DONE, S1 narrates 20's interim who-is-invoiced as the stack shows it.
   - **Phase 33's wording and Contract handling:** which source-text channel and `from` its create and
     match paths write for a row (planned: `hospitalDownload`, `from` the hospital's name), whether a
     matched row with different wording appends it (US-02.5.7) and counts as a procedure-text
     difference, whether its decision panel offers a Contract step or leaves the created Booking on
     "Needs a Contract", and `SAMPLE_STG` R1's text. If R1 does not carry `lap appy ?conv to open`, set
     it there (one fixture, re-pinning 33's fixture test), so the hand import, the sync and
     MSG-STG-1001 agree.
   - Whether Phase 33 already re-pointed S4 Beat 4 (the Christchurch Public dead-letter beat) and S5
     Beat 2 (MSG-STG-1002); its plan does both. If not, this phase does it (see Demo guide updates and the Control
     Panel text), because both lean on the tabs leaving Admin and on Christchurch Public, which stops
     being a live feed here.
10. Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (16 after Phase 15a session 1; the
   phases before this one bump it further). This phase bumps it by one (the appended hospitals and the
   new demo setting).
11. Record the drift-check result (against `60e2d1e`) in the PROGRESS entry.

## Reference

**Design files (convention 17):**
- `docs/design/Admin Review.dc.html`: the Admin page anatomy the Intake screens keep: breadcrumb and
  title row, the micro-caps KPI strip with mono values, the table, and the `bannerIn` entry motion (for
  newly arrived rows).
- `docs/design/Admin Day.dc.html`: the dark-ink side nav and its badge treatment (the Intake item keeps
  the amber attention badge), and the right-rail card style for the "Other providers" strip.
- `docs/design/Design Language.dc.html`: the warning tint (the auto-match banner), pills (`r-pill`),
  neutrals for the `'future'` badge tone, radii `ctl 10` / `card 14`, and the motion patterns
  `selection-slide` (the Intake tabs) and reduced-motion 80ms fades. Teal `#0D6E63` is the only action
  colour; crimson stays identity only.
- `docs/design/Mobile App.dc.html`: nothing new; the PWA sheet from Phase 14 hosts the stand-in.
- The Future-scope surface is a demo surface: it keeps `DemoSurface` chrome, not product styling.

**Catalogue:** the covered items above (US-02.1.5's 2026-10-02 Notes), OQ-13 (with its 2026-10-07
update), OQ-34 (volume ranking of the pathways), US-02.2.1's 2026-10-02 Future Work note, US-02.1.2's
note on the manual step (the narration for the auto-match aside) and its "procedure text as sent"
criterion, FT-02.1's and US-02.1.3's 2026-10-07 notes, US-02.5.7 and US-03.1.9 (the wording and the
stack S1 shows), US-04.3.3 and US-04.3.4 with OQ-78 and OQ-99 (the office's Contract choice), and
`domain-model.md` section 1 ("St George's and Southern Cross are integrated ... More hospital feeds,
automatic matching and HL7/FHIR are Future Work. NHI lookup is in scope"; its sync-mechanics wording
is stale, see the drift check), the Booking "Sources" and "Source wording" bullets and the glossary
entries "Matching screen" and "Source wording". Evidence (read with `npm --prefix requirements-board
run source -- --item <ID> --text`): `requirements-board/requirements/notes/2026-10-02-aa-requirements-review-with-greg.md`
item #65, `requirements-board/requirements/notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md`
items #6 and #22, "Notes 2026-10-07 · AA meeting with Greg #17" (no automated decisions; later updates
matched by date, surgeon, location and session), and
[AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md), the note
[2026-10-08-procedure-picker-and-source-text.md](../../../../requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md),
under its "Illustrative source wording" heading (AR-35 declares no regions; cite the heading by
name): the AI-made, not-from-AA table the deliveries and sheets take their wording from.
**Pricing model (read only, not built here):** [AR-28#no-contract-rvg](../../../../requirements-board/requirements/artifacts/AR-28.md)
and [AR-28#who-gets-the-invoice](../../../../requirements-board/requirements/artifacts/AR-28.md) (the
plain-language guide, true as written: what No contract (RVG) is and who it invoices) and
[AR-29#contract-selection](../../../../requirements-board/requirements/artifacts/AR-29.md) (the
draft design v4: No contract (RVG) first, then holder-fit candidates), for the S1 narration only.

**Analysis:**
- `../GAP-ANALYSIS.md`: everything before "## By epic", especially theme 8 (intake becomes a matching
  screen), "Remove or rework" (RV-05, RV-06, RV-26, and the Christchurch Public feed as a live feed),
  "Demo impact", the intake cluster under "Demo-trigger buttons", and the OQ-13 line; then the EP-02
  and EP-14 tables.
- `../epics/EP-02.md` (US-02.1.5, FT-02.1, FT-02.2) and `../epics/EP-14.md` (FT-14.6).
- `../analysis/reverse-check.md`: RV-05, RV-06, RV-13 (which absorbed the dropped RV-27: feed Bookings
  arriving with a pricing route the office never chose) and RV-26; `../analysis/domain-model-delta.md`:
  DM-34 (intake, with its 2026-10-03 correction dropping the sync state; it now needs DM-51), DM-51
  (source wording) and DM-49 (one stored No contract (RVG)).
- `../analysis/prototype-map-admin.md` sections 1, 8, 13 and 14; `prototype-map-shell-demo-pwa.md`
  sections 1, 3, 4, 5.1, 5.3, 7 and 9; `prototype-map-store-seed.md` sections 5, 7, 8 and 9;
  `prototype-map-domain.md` section 6.
- `../ROADMAP.md`: "Demo triggers", "PWA parity", "Demo guide", and the Phase 33 and 34 rows.

**Code entry points:**
- `aa-prototype/src/apps/admin/screens/IntegrationMonitorScreen.tsx`: `Tab` state (:27, :45), the
  header comment (:33), the five `TabButton`s (:62-66; Messages and Feed config already pass `future`,
  Surgeon PDFs does not), `FutureScopeNote` (:516), `MessagesTab` (:83), `FeedConfigTab` (:153),
  `SurgeonPdfsTab` (:214, reads the constant `SURGEON_PDFS`) and `PdfReview`, `DataQualityTab` (:363),
  `ValidatorsTab` (:412).
- `aa-prototype/src/apps/admin/components/SideNav.tsx` (`NavSection` `'integrations'` :5, the
  Integrations item with its amber badge :36), `AdminApp.tsx` (section from path, `integrationAttentionCount`
  :187, section paths), `apps/admin/routes.tsx` (`AdminIntegrationsRoute`), `src/router.tsx`.
- `aa-prototype/src/apps/demo/DemoIntegrations.tsx` (feed picker, message library, the three panes,
  "Live drip" `setInterval` :62-74, the Keycloak callout), `DemoSurface.tsx`,
  `DemoControlPanel.tsx` (`SCENARIOS` S1 :252-262, still on MSG-STG-1001 with Phase 14's caveat; the S4
  and S5 messages).
- `aa-prototype/src/shell/appConfig.ts` (`APP_CONFIG['demo-integrations']`, label "Demo:
  Integrations"), `AppSwitcher.tsx` (`ICONS`).
- Store: `integrationActions.ts` (`processMessage` :309, `MAX_ATTEMPTS` :41, `wireIntegrationRetry`
  :494, `setFeedMapping`, `correctEthnicityCode`, `ingestPdfRow` :434, all unchanged in behaviour),
  `demoSettingsActions.ts` (`armHandoffFault`, the audited demo-setting pattern to copy),
  `domain/types.ts` (`DemoSettings` :896, which already carries `failNextHandoff`; `BookingSource`
  :371), `selectors.ts` (`integrationAttentionCount` :995, `dataQualityItems`), `appStore.ts`
  (`PERSIST_VERSION` :136, `freshAppState`, `backfillMerge`), `index.ts` exports.
  Phase 33's files (names from its PROGRESS entry): `src/store/matchingActions.ts`,
  `src/store/matchingDemo.ts`, `src/domain/intake/` (`matching.ts`, `hospitalDownloads.ts`),
  `apps/admin/screens/MatchingScreen.tsx` and `apps/admin/matching/`. Phase 20's and 20a's (names from
  their entries): the Contract selection module and `setProcedureContract`, `needsContractBookings`
  and the Admin Day "Needs a Contract" card; `SourceText` on `Procedure` in `domain/types.ts`,
  `addSourceText`, `domain/billing/procedureStack.ts` and the shared `ProcedureStack`.
- Domain: `domain/integrations/feeds.ts` (`FEED.cph` :22 and `FEED_META[FEED.cph]` "Christchurch
  Public HL7 feed" :37, `CPH_MAPPING_MISCONFIGURED`, `CPH_NHI_FIX`, the CPH entry in the seeded feeds
  :83), `messages.ts` (`APPT` correlation ids; `STG_LIST` and `SX_LIST` = Souter Tue 28 Jul AM and PM),
  `pdfSamples.ts` (`SURGEON_PDFS`, unchanged), `domain/seed/cast.ts` (`HOSP` :95, `HOSPITALS` :103:
  STG, SX, FORTE, CES, CPH only), `domain/seed/availabilityAndHolidays.ts` (`HOSPITAL_HOLIDAYS` is a
  `flatMap` over `HOSPITALS`), `domain/seed/canvas.ts` (`ADHOC_HOSPITALS`, which must not change),
  `domain/domainPurity.test.ts`.
- Entries: `src/pwa/pwaPurity.test.ts`.
- Registry: `src/shared/demoTriggers/registry.ts` and its test (Phase 14), including
  `ingest-pdf-row` (:348), `fire-hospital-message` (:450) and `replay-hospital-message` (:475).
- Tests and hooks: `aa-prototype/visual/phase11.spec.ts`, `visual/screens.spec.ts`,
  `visual/pwa-device.spec.ts`, `store/integrationActions.test.ts`, `store/demoScenarios.test.ts`,
  `store/persistMigrate.test.ts`, `shared/audit/actionLabels.ts` and `auditNarrative.test.ts`.
- Outside the app: capture recipes `requirements-board/capture/recipes/*.json` FT-02.2, US-02.1.1 to
  US-02.1.4, US-02.2.1, US-11.1.2, US-14.1.1, US-14.2.1, US-14.3.1 and US-14.5.1 (at the snapshot they
  open `/admin/integrations` or `/demo/integrations`; Phase 33 points some at `/admin/matching`), and
  `requirements-board/capture/ATLAS.md`. There is no US-02.1.5 recipe yet.
- Visual specs: `visual/phase12.spec.ts` (S1, which Phase 33 routes through the matching screen) and
  Phase 33's `visual/admin-matching.spec.ts`.

## Work items

1. **Sync deliveries (pure domain, `src/domain/intake/syncDeliveries.ts`, beside Phase 33's intake
   module; no React, no `Date.now()`, covered by `domainPurity.test.ts`).**
   - `INTEGRATED_HOSPITALS = [HOSP.stg, HOSP.sx]`, with a comment citing US-02.1.5 (and that the
     delivery mechanics are OQ-13's, not modelled).
   - `HOSPITAL_SYNC_DELIVERIES: Record<IntegratedHospitalId, SyncDelivery[]>`, each delivery
     `{ id, rows }` in Phase 33's neutral row shape (`IncomingBookingFields`), in a fixed order. Each
     Simulate sync delivers the hospital's next undelivered delivery. Share appointment references
     (`externalRef`) with `APPT` so a synced row matches the same seeded Booking the HL7 library does.
     Every row carries its **procedure text as received** in Phase 33's text field, taken from the
     "Hospital download" rows of AR-35's "Illustrative source wording" table where one fits (AI-made,
     not from AA: say so in the module's header comment, and present nothing as AA's data), so the
     matching screen and the Booking each row creates show realistic shorthand (US-02.1.2, US-02.5.7).
     Never reuse the wording 20a placed on a seeded Booking for a different procedure, and never
     AR-35's rows 1, 2, 26 or 27 (20a's two-source beats). The minimum set (adjust to Phase 33's proposal
     rules, then pin every one in `demoScenarios.test.ts`):
     - **St George's, delivery 1 (the S1 delivery):** Sarah Mitchell, NHI CQY9304, DOB 1988-04-12, Tue
       28 Jul 08:30, Mr Hale, procedure text `lap appy ?conv to open` (AR-35 row 14, the wording 20a
       put on MSG-STG-1001), appointment `APPT.s12`, no procedure code the procedure list resolves and
       no Contract. Build it from `SAMPLE_STG` R1's fields (import them, do not retype), so Phase 33's
       dedupe skips R1 if the presenter also imports `SAMPLE_STG` by hand, and the reverse. Its proposal
       must be "Create Booking" on `listIdForSlot(ANAE.souter, '2026-07-28', 'AM')` (an ACTIVE List),
       with the patient reused by NHI. Beside it, a new patient with a new-format NHI (the MSG-STG-1002
       patient) on **another anaesthetist's** ACTIVE St George's List on Tue 28 Jul (never one of
       Dr Souter's Lists, so the PWA stand-in and S1's "fourth Booking" count are not touched; not a
       scripted-beat List; pin it), with `L4/5 microdisc` (AR-35 row 32, a hospital download; not
       `ACL recon R`, which Phase 33's `SAMPLE_SX` R1 already gives Priya Nair), so S5 Beat 2 can
       validate a new-format NHI on the matching screen.
     - **St George's, delivery 2:** a changed time on the seeded Booking with `APPT.s13Time` (a "modify"
       row whose only field difference is the time; the auto-match candidate, US-02.1.3's "later update
       ... approve update"). Its procedure text is character for character the text that Booking
       already holds (read it from the seed, do not retype), so no wording is appended and the row stays
       auto-match eligible (item 7).
     - **St George's, delivery 3:** a reschedule to a date whose session holds no List (it lands in the
       unmatched queue), with `lap chole` (AR-35 row 12) if its Booking is a laparoscopic
       cholecystectomy, otherwise that Booking's own held text.
     - **Southern Cross, delivery 1:** Priya Nair (NHI `MYY54SL`, the FHIR-SX-2001 patient), a new
       Booking on Souter Tue 28 Jul PM 14:30 (Southern Cross, Ms Patel). This is `SAMPLE_SX` R1: build it
       from that row's fields, so Phase 33's dedupe skips it if the presenter also imports `SAMPLE_SX` by
       hand, and the reverse.
     - **Southern Cross, delivery 2:** a cancellation of a seeded Southern Cross Booking that carries a
       correlation reference (or, if none exists, a row whose patient no longer appears, which Phase 33
       routes to the unmatched queue). Never a scripted-beat Booking, and never the Booking `SAMPLE_SX`
       R2 modifies (a hand import after the sync must still show R2's change).
     Delivery 1 rows that create a Booking keep their text on it as its first source text through
     Phase 33's create path (20a's `addSourceText` rules; this phase writes no wording itself). No
     synced row carries a Contract or picks one (the download is not comprehensive, OQ-13's 2026-10-01
     note; US-04.3.6 is Future Work), and nothing is derived from the hospital (US-04.3.3): a created
     Booking arrives with no Contract and waits on Phase 20's "Needs a Contract" list for the office.
     None targets the Tue 21 design-day Lists, the S2 Lists
     (Sharma Tue 21 PM, Rutherford Wed 22 AM, the Review queue Lists), the S3 Mon 20 Lists, the S4 Lists
     (Riley Fri 24, Ropata Thu 16, Sharma Tue 14) or David Chen's S5 Booking.
   - `nextSyncDelivery(hospitalId, deliveredIds)` returns the next delivery or none. The delivered set
     is derived from Phase 33's batches (each sync batch carries its `deliveryId` in `extras`), so there
     is **no new persisted sync state** (DM-34's correction): no cursor, no last-synced time, no attempt
     history.
   - Vitest `syncDeliveries.test.ts`: deliveries in order per hospital; none after the last; ids
     unique; S1's row equals `SAMPLE_STG` R1's fields, its text exactly `lap appy ?conv to open`; every
     row has a non-blank procedure text; delivery 2's text equals its Booking's held text; no row
     carries a Contract; no row text contains an en or em dash.

2. **The sync store action and demo setting (`src/store/hospitalSyncActions.ts`, exported from
   `src/store/index.ts`).** All writes through `mutate()`, timestamps from the demo clock.
   - `HOSPITAL_SYNC_ACTOR` (`{ who: 'Hospital sync', role: 'system', source: 'integration' }`) in
     Phase 14's `src/store/demoActors.ts` or beside it.
   - `simulateHospitalSync(api, hospitalId): Outcome<{ rows: number; skipped: number; deliveryId } |
     { rows: 0; done: true }>`:
     - refuses a hospital outside `INTEGRATED_HOSPITALS`, Christchurch Public included ("Only St
       George's and Southern Cross are integrated. Import other providers' sheets by hand.");
     - hands the next delivery's rows to Phase 33's `stageImportRows` as one batch, under a new channel
       value `'sync'` added to Phase 33's channel union (micro-cap "Sync" on the matching table; batch
       label "St George's sync"; `deliveryId` in `extras`). Booking source stays `hospitalDownload`
       (Phase 33 decision 7). Extend Phase 33's `sourceTextChannelFor` (or its real name) so `'sync'`
       maps to 20a's `hospitalDownload` source-text channel, `from` the hospital's name, with a test:
       a synced row is the same hospital data as a hand import, arriving without the download step. Phase 33's dedupe still applies, so a row also hand-imported is never
       staged twice;
     - with nothing left to deliver, returns `done` and writes nothing;
     - audit: `intake.sync` (entity the batch, `after: { hospitalId, deliveryId, rows, skipped }`), in
       the same commit as the staged rows. Never writes a Booking, List or Patient: no silent apply
       (US-02.1.5's one criterion). A row about a locked List is staged like any other; Phase 33's
       decision rules handle it.
   - Selector `pendingSyncDeliveries(state, hospitalId)` (count left), used by the trigger's disabled
     state.
   - `DemoSettings` gains `autoMatchDemo?: boolean` (absent reads as off; reset clears it), set by item
     7's action.
   - Bump `PERSIST_VERSION` by one here (with item 6's appended hospitals); extend
     `persistMigrate.test.ts` (an older version reseeds; the current version backfills through
     `backfillMerge`).
   - Vitest `hospitalSync.test.ts`: refuses Christchurch Public and every hospital outside the two;
     delivery 1 stages the S1 rows once; the next call stages delivery 2; after the last, `done` with
     no write; a `SAMPLE_STG` hand import after delivery 1 skips R1 (and the reverse order skips the
     synced row); audit rows carry hospital, delivery and counts; no Booking, List or Patient changes
     in any case; determinism (same actions, same state); reset restores the seed.

3. **Intake becomes the one Admin home (RV-05), with Surgeon PDFs badged Future scope (RV-26).**
   - Routes (adjust to what Phase 33 built; keep one nav item): `/admin/intake` redirects to
     `/admin/intake/matching`; `/admin/intake/matching` (Phase 33's matching screen),
     `/admin/intake/quality`, `/admin/intake/validators` and `/admin/intake/pdfs`. Tabs become
     URL-routed (path segments are navigation, per the house rule), with `selection-slide`.
     `/admin/integrations` and Phase 33's `/admin/matching` redirect with `replace`, so bookmarks and
     the capture recipes keep working.
   - Side nav: Phase 33's `'matching'` section and the `'integrations'` section merge into one
     `'intake'` section, labelled "Intake", in Matching's place directly under Day view. Update
     `NavSection` (`SideNav.tsx`), `sectionForPath` and `SECTION_PATH` (`AdminApp.tsx`). Its amber
     badge is Phase 33's `matchingAttentionCount`; it no longer counts HL7 dead-letter or
     manual-intervention messages (`integrationAttentionCount` leaves the badge; keep or delete it with
     its callers).
   - Re-point everything Phase 33 aimed at `/admin/matching` to `/admin/intake/matching`: its two bar
     triggers (`matching-send-unmatched-row`, `matching-send-update`, `matching-reschedule-no-list`:
     routes and `indexPath`),
     the Booking detail's "From hospital row" link, and its `screens.spec.ts` entry.
   - Header copy (no en or em dashes): "Hospital bookings from St George's and Southern Cross arrive
     here through their integration, and other providers' daily sheets are imported by hand. Every row
     waits for your decision." Remove the HL7, FHIR, retry and dead-letter sentence. Name no cadence and
     no sync button.
   - **Surgeon PDFs (US-02.2.1 Future Work, RV-26):** the tab sits last, after Validators, with the
     `TabButton` `future` badge Messages and Feed config carry today, and a panel note in the
     `FutureScopeNote` style: "Surgeon PDF ingest is Future Work, not in the first release. Shown here
     for discussion." The tab's behaviour (inbox, facsimile, review, `ingestPdfRow`) is unchanged: no
     upload, no new review fields, no state change. Data quality and Validators stay unbadged (in scope).
   - `MessagesTab` and `FeedConfigTab` leave `IntegrationMonitorScreen.tsx` (item 5). The screen file is
     renamed to `IntakeScreen.tsx` (or split into one file per tab) and its header comment corrected.
   - Phase 14's context: drop the `integrations.tab` key (the URL now carries the tab). Re-point
     `ingest-pdf-row` to route `/admin/intake/pdfs`, drop its `when` guard, add `badge:
     'future-scope'`, and change its screen to "Admin · Intake · Surgeon PDFs"; its body is unchanged.

4. **The matching screen receives synced rows (product UI).**
   - Phase 33's header line gives way to item 3's Intake header copy; its teal import button stays (the
     hand-import path for the other providers), and its stats strip and table stay. Phase 33's OQ-13
     sample-file line stays with the import button and picker, because it labels the hand-import
     fixtures; it never describes the sync, which carries no provisional wording. Its empty state
     becomes "No rows waiting. Rows from St George's and Southern Cross, and imported sheets, land
     here."
   - The table's channel micro-cap reads "Sync" for `'sync'` rows, with the hospital name, so a synced
     row is told apart from a hand-imported one at a glance. Each synced row shows its procedure text
     as received exactly as Phase 33 shows an imported row's (US-02.1.2); nothing here restyles or
     trims it.
   - Newly staged rows enter with the `bannerIn` motion and a "New" chip until the admin decides or
     leaves the screen; reduced motion gets the 80ms fade.
   - An "Other providers · daily sheets imported by hand" strip (right-rail card style) lists Forte
     Health, Christchurch Eye Surgery, Burwood, Southern Endo and McMurray Centre with "Last imported"
     from their batches (or "None yet"), so the manual baseline of FT-02.1 is visible.
   - No per-hospital sync tile, last-synced time, attempt history, failure pill or Sync button: US-02.1.5
     dropped them.
   - `data-shot` hooks: `row-new`, `other-providers`.

5. **The Future-scope demo surface (RV-05, RV-06).**
   - `/demo/integrations` becomes "Future scope: HL7 and FHIR" (label in `APP_CONFIG`, same icon, same
     demo group; the path is kept for bookmarks and recipes), with three sub-routes:
     `/demo/integrations` (the existing simulator, unchanged in behaviour), `/demo/integrations/log`
     (the moved `MessagesTab`: message log, retry counts, dead-letter, Reprocess) and
     `/demo/integrations/mapping` (the moved `FeedConfigTab`). Move the two components into
     `src/apps/demo/futureScope/` unchanged in behaviour.
   - The `DemoSurface` header carries `DemoBadge tone="future"` and one line: "HL7 v2, FHIR R4, near
     real time messaging, retries with a dead-letter queue and per-hospital field mapping are Future
     scope, shown here for discussion. In scope today: St George's and Southern Cross rows and hand
     imported daily sheets on Admin Intake, matched by the office." Each sub-panel repeats the badge at
     its top. Remove the interim per-tab badges Phase 14 put on Admin.
   - **Christchurch Public stops being a live feed (US-02.1.5, Contradicts).** It is not in
     `INTEGRATED_HOSPITALS`, gets no sync and no sheet, and no in-scope surface (Admin, mobile, web, PWA,
     the Control Panel scenario text) names a Christchurch Public feed; its bookings are entered by hand
     like any other non-integrated hospital. On the Future-scope surface its feed picker entry and
     mapping panel read "Christchurch Public · not integrated today · example of a further feed (Future
     Work, US-14.6.1)". Its messages, mapping and `CPH_NHI_FIX` stay as data for the mapping-fix
     discussion, unchanged, but the Live drip no longer offers it (the one change to the simulator:
     `DemoIntegrations.tsx` filters `FEED.cph` out of the drip's feed list; firing one CPH message by
     hand still works). A CPH message fired here stages through Phase 33's re-pointed `processMessage`
     like any fired message, its batch labelled "Future-scope HL7 demo · Christchurch Public", so it
     never reads as an in-scope sync. Keep `HOSP.cph` in the seed (its Lists and holidays are
     unchanged). Vitest: no registry entry outside the Future-scope routes names CPH; the drip's feed
     list excludes it.
   - Do not extend the simulator, the message model, `MAX_ATTEMPTS` or `wireIntegrationRetry`. A
     message fired here lands as a row on the matching screen, through Phase 33's re-pointed
     `processMessage`; say so in one line on the simulator ("Fired messages land on Admin Intake as rows
     for the office to decide.").
   - The Keycloak and Digital Services Hub callout stays, reworded to keep NHI lookup (FT-14.4) clearly
     in scope and the rest Future.
   - The Control Panel index lists the Future-scope entries under "Future scope: HL7 and FHIR".
   - `pwaPurity.test.ts`: nothing from `src/apps/demo/futureScope/` reaches the PWA closure.

6. **The three missing providers and their daily sheets (FT-02.1 baseline, FT-14.6).**
   - `domain/seed/cast.ts`: **append** `HOSP.burwood` ("Burwood"), `HOSP.southernEndo` ("Southern
     Endo") and `HOSP.mcmurray` ("McMurray Centre") to `HOSP` and `HOSPITALS`, with Phase 17's contact
     email. Appending keeps every existing id and RNG draw: `ADHOC_HOSPITALS` and the recurring bookings
     are untouched, and `HOSPITAL_HOLIDAYS` gains rows for the new hospitals only after the existing
     ones. Prove the canvas is byte-identical (Lists and their ids unchanged) in the seed tests.
   - One daily sheet per provider, all in Phase 33's `HOSPITAL_DOWNLOAD_SAMPLES` library (channel
     `manualSheet`, Phase 33's entry shape), so the product import dialog and the trigger offer the same
     files. `domain/intake/dailySheets.ts` exports `MANUAL_PROVIDER_SHEETS`, the provider-to-sample map
     over that library (Phase 40 reads it), not a second copy of the rows:
     - Forte Health: **reuse Phase 33's `SAMPLE_FORTE_SHEET`** (new row, mistyped NHI, unmatched row);
       do not author a second Forte sheet. If it has no changed-time row, add one (a field difference on
       an existing Forte Booking) and re-pin Phase 33's fixture test.
     - Christchurch Eye Surgery: 3 to 4 rows against real seeded Lists at that hospital in the next 10
       days, preferring non-Souter Lists so they do not collide with S1 or any scripted beat; at least
       one matches an existing Booking with a changed time (a field difference), one is new.
     - Burwood (outsourced private plastics and orthopaedics) and Southern Endo: 2 to 3 rows; no List
       exists at these hospitals, so the rows land in Phase 33's unmatched queue and offer "Create List"
       or "Draft List" (Phase 31: every row carries the surgeon, hospital, day and session a Draft List
       requires, so the Draft List path is never refused for a missing field).
     - McMurray Centre (only a couple of Lists): 1 to 2 rows, one with no NHI (a handoff to Phase 40's
       missing-NHI list; before 40 it follows Phase 33's rule for a row without an NHI).
     - **Wording.** Every sheet row carries its procedure text as the provider wrote it, from AR-35's
       table under the same rules as item 1 (AI-made, not from AA; never a seeded Booking's wording
       for a different procedure): for example `phaco + IOL R` (row 16) on Christchurch Eye Surgery,
       `ACL recon R` (row 7) or `Rev THJR R, 2 component` (row 5, a rooms PDF in AR-35; our reuse, logged) on
       Burwood, `gastro/colon` (row 15, a rooms PDF in AR-35; our reuse on a sheet, logged) on Southern
       Endo, and `TAH BSO` (row 23, a rooms PDF; our reuse, logged) on McMurray (not `TURBT`, which
       Forte's R3 already carries; avoid repeating a string another sample or delivery uses). A
       changed-time row repeats its Booking's held text exactly. No row carries a Contract; a Booking
       created from a sheet row waits on "Needs a Contract" like a synced one.
   - `deliverDailySheet(api, actor, providerId)` (`hospitalSyncActions.ts`): a thin wrapper over
     Phase 33's `importHospitalDownload` for that provider's sample (one batch, channel `manualSheet`,
     the same staging and dedupe), plus an `intake.sheetImported` audit meta in the same commit.
     Refuses a sheet already imported (a batch with that `sampleId` exists: "Already imported today").
     Refuses St George's and Southern Cross ("Arrives through the hospital integration").
   - Vitest: each sheet stages once; Burwood rows land unmatched; a Forte row shows a field difference;
     every row has a non-blank procedure text; nothing is applied; the audit row is labelled.

7. **The demo-only auto-match toggle (FT-14.6's later phase, US-14.6.2, Future Work).**
   - Pure `domain/intake/autoMatch.ts`: `isAutoMatchEligible(row, proposal, state)`: only a "modify"
     row whose changes are time or notes, with exactly one confident Booking match on an ACTIVE List,
     no double-booking or disappearance flag and no conflict. New patients, cancellations, reschedules,
     unmatched rows, rows for a Draft List, rows whose procedure text differs from every text the
     Booking already holds (new wording is for a person to read, US-02.5.7) and anything on a SUBMITTED
     or AUTHORISED List are never eligible. Auto-match never sets a procedure or a Contract. Vitest per
     case.
   - `setAutoMatchDemo(api, actor, on)`: audited `demo.autoMatch`. When on, the staging path (sync and
     sheets alike, one shared hook after staging) applies each eligible new row at once through Phase
     33's decision action as `AUTO_MATCH_ACTOR` (`{ who: 'Auto-match (demo, Future scope)', role:
     'system', source: 'integration' }`), keeping the row, its diff and "Applied by auto-match" on the
     matching screen. It never touches rows that were already waiting when it was switched on.
   - While on, the matching screen shows a banner with `DemoBadge tone="future"`: "Auto-match is on.
     Routine time changes that match one Booking exactly are applied on arrival; everything else waits
     for you. This is a later phase (Future Work), shown for discussion." Default off; reset turns it
     off. FT-02.1's 2026-10-07 note (no automated decisions in the first version; automated approvals
     once the matching is trusted) is why it stays a badged demo.
   - Vitest: off, nothing applies; on, St George's delivery 2's time change applies on arrival and
     Southern Cross's cancellation stays pending; the audit shows the auto-match actor.

8. **Triggers in the registry (Phase 14's registry only; bodies in `src/store` or `src/shared`, so
   `pwaPurity` holds).** All bar entries on route `/admin/intake/matching`:
   - `simulate-hospital-sync`, "Simulate sync": `choices` St George's and Southern Cross; body
     `simulateHospitalSync`. Disabled per choice when nothing is left ("No more rows from St George's in
     this demo"). Message built from the result ("St George's sync: 2 new rows waiting on the matching
     screen." or "1 row already imported, skipped."). The description says it stands in for the hospital
     integration, whose delivery is still being established.
   - `deliver-hospital-sheet`, "Deliver hospital sheet": `choices` the five providers; body
     `deliverDailySheet`; disabled per choice when already imported ("Already imported today"). The
     description says it simulates the sheet arriving and being imported by hand.
   - `auto-match`, "Auto-match (Future scope)": `choices` "Turn on" and "Turn off", disabled for the
     current state; `badge: 'future-scope'`.
   - Re-point Phase 14's `fire-hospital-message` and `replay-hospital-message` to the Future-scope
     surface routes only (item 5's `/demo/integrations...`), bar only (Phase 33 already dropped the
     `pwa` surface); remove the Admin and Mobile Lists patterns. They keep `badge: 'future-scope'`, and
     Phase 33's description ("Stages the hospital's row on Admin, Matching...") changes to name Admin,
     Intake.
   - `ingest-pdf-row` as item 3 sets it (route `/admin/intake/pdfs`, `badge: 'future-scope'`).
   - Registry tests: the three new entries appear only on the matching route; Phase 33's three matching
     entries follow it to `/admin/intake/matching`; the HL7 entries appear only on the Future-scope
     routes; `ingest-pdf-row` only on Surgeon PDFs and badged; every label and description free of en
     and em dashes; each `indexPath` matches its own routes.

9. **The handset stand-in (PWA parity for S1).** Re-point Phase 33's PWA entry
   `matching-office-matches-row` (keep its id) to **"Hospital sync delivers my booking"** (Mobile ·
   Lists, patterns `/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`;
   `surfaces: ['pwa']`; `badge: 'office-stand-in'`). Its S1 choice (which staged `SAMPLE_STG` R1 alone)
   is replaced by the sync body below, relabelled "Hospital sync, Tue 28 Jul AM (S1)"; keep its other
   two choices ("A new hospital booking on this List" on a List route, and "A hospital update for this
   Booking, approved by the office" on a Booking route) unchanged. The body stays in Phase 33's `src/store/matchingDemo.ts` (`officeMatchesHospitalRow`), so
   `pwaPurity` holds:
   - body: `simulateHospitalSync` for each integrated hospital with a delivery left (on a List route,
     only that List's hospital, so the Tue 28 Jul AM List does not also pull Southern Cross's Priya
     Nair onto Dr Souter's PM List), then
     `decideImportRow` as `OFFICE_SIMULATION_ACTOR` (`src/store/demoActors.ts`) with `suggestDecision`'s decision for each staged row
     whose suggestion is a confident "Create Booking" or "Match" onto a List owned by the persona (on a
     List route, only that List). Exceptions are left for the office. Then, for each Booking it created,
     the office's Contract step as S1 scripts it: Phase 20's `setProcedureContract` to No contract
     (RVG), as the same actor, on each Procedure with no Contract (never a candidate further down,
     never on a matched Booking, whose Contract stays as it was). The procedure stays as the row left
     it (D33), for the anaesthetist to pick.
   - disabled when there is nothing to deliver or decide for this anaesthetist ("Nothing new from the
     hospitals for your Lists"); pure, from `pendingSyncDeliveries` and Phase 33's pending selector.
   - message: "St George's synced. The office created Sarah Mitchell's Booking on Tue 28 Jul AM and set
     No contract (RVG)." (built from the result, not hardcoded).
   - Vitest for the entry (the created Booking holds the row's text verbatim as its source text and No
     contract (RVG), and nothing else changed); `visual/pwa-device.spec.ts`: on the Tue 28 Jul AM List,
     the Demo chip, the stand-in, and a fourth Booking whose stack reads `lap appy ?conv to open`, then
     the procedure still to choose, then No contract (RVG).

10. **S1 rebuilt in the app.** Control Panel `SCENARIOS` S1 (`DemoControlPanel.tsx`):
    - title "S1 · Booking to theatre", blurb "A St George's booking arrives through the hospital sync
      with the hospital's own wording, the office matches it onto a booked List and chooses its
      Contract, then it captures live on procedure day.";
    - run: `resetDemo` only (the seed is the S1 stage; the presenter fires the sync on screen);
    - message: open Mobile to introduce the Tue 28 Jul AM List (three booked cases, read as the rooms
      sent them), open Admin Intake, run Demo actions "Simulate sync" with St George's (two rows
      arrive, marked New; Sarah Mitchell's reads `lap appy ?conv to open`), create Sarah Mitchell's
      Booking from her row, then set its Contract: open the Booking (from the row, or Admin Day's
      "Needs a Contract" card, where it now waits) and pick No contract (RVG), first in the picker,
      with no hospital default. Return to Mobile for the fourth Booking and its stack (the wording, the
      procedure to choose, No contract (RVG)), then "Procedure day · 28 Jul", pick Appendicectomy (A3)
      in the two-tab picker and capture. Optional: "Deliver hospital sheet" (Burwood) and the
      Auto-match aside. Remove Phase 14's Future-scope caveat, the MSG-STG-1001 instruction, any
      "default Contract" wording and the procedure code 20950;
    - nav: "Go to Mobile app", "Go to Admin Intake" (`/admin/intake/matching`).
    - `demoScenarios.test.ts`: after reset, St George's delivery 1 stages Sarah Mitchell's row with the
      proposal on Souter's Tue 28 Jul AM List and its text `lap appy ?conv to open`; deciding it
      creates a Booking at 08:30 with source `hospitalDownload`, the reused patient (CQY9304), its first
      Procedure's only source text exactly `lap appy ?conv to open` (Phase 33's channel and `from: "St
      George's"`), no procedure picked (D33) and **no Contract**, listed by `needsContractBookings`;
      `setProcedureContract` to No contract (RVG) as the office then takes it off that list, and 20a's
      stack view reads the wording, no procedure, and No contract (RVG) invoicing the payer on the
      Booking (Sarah Mitchell, if 21 is DONE); the List reads 0 of 4 complete and stays ACTIVE; S2 to
      S5 seed pins and figures still hold.

11. **Close-out.** Update `visual/phase11.spec.ts` and `visual/screens.spec.ts` for the Intake routes
    and the moved tabs; update `visual/phase12.spec.ts` (S1 now runs Simulate sync, then the decision,
    not a hand import) and Phase 33's `visual/admin-matching.spec.ts` (importing `SAMPLE_STG` after the
    S1 sync reports R1 as already imported); add `visual/intake-sync.spec.ts` (Simulate sync St George's
    twice: two New rows with their wording, then the time change; deciding Sarah Mitchell's row, then
    No contract (RVG) on her Booking; Southern Cross; a third St George's delivery lands
    unmatched; the trigger disables when exhausted; Deliver hospital sheet Burwood; Auto-match on then
    St George's delivery 2 reads "Applied by auto-match"). Capture recipes as the Catalogue screenshots
    section below sets out, run after the review pass; update ATLAS.md; run `npm run verify:board`.
    Update `aa-prototype/README.md` (the Intake routes, the Future-scope surface, the demo setting).
    Add every new audit code to `ACTION_LABELS` ("Hospital sync", "Daily sheet imported", "Auto-match
    switched (demo)"); `auditNarrative.test.ts` enforces it. Then `npm run build`, `npm run build:pwa`,
    `npx vitest run`, `npm run shots`, all green; walk S1 in the browser; run the adversarial review,
    patch the demo guide, write PROGRESS.md.

## Demo triggers

Everything this phase adds or re-points in the harness bar (framed build) and the PWA sheet:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Simulate sync | Admin · Intake · Matching | bar | Choose St George's or Southern Cross; that hospital's next delivery arrives as rows marked New, labelled "Sync", nothing applied. Disabled per hospital once its deliveries are used up |
| Deliver hospital sheet | Admin · Intake · Matching | bar | Choose Forte Health, Christchurch Eye Surgery, Burwood, Southern Endo or McMurray Centre; that provider's daily sheet arrives and is imported by hand as a batch of rows (matched, with differences, or unmatched) |
| Auto-match (Future scope) | Admin · Intake · Matching | bar | Turns the demo-only auto-match on or off; while on, routine time changes that match one Booking exactly are applied on arrival and a Future-scope banner shows |
| Ingest PDF row (re-pointed, now Future scope) | Admin · Intake · Surgeon PDFs | bar | As Phase 14, now badged Future scope and scoped by route instead of the tab context |
| Fire hospital message, Replay last message (re-pointed) | Future scope: HL7 and FHIR (all three routes) | bar | Unchanged bodies, now only on the Future-scope surface; a fired message lands as a matching row. Christchurch Public is offered only as a labelled "not integrated today" example and is not in the Live drip |
| Hospital sync delivers my booking (re-pointed from Phase 33) | Mobile · Lists, List, Booking | PWA only | The office stand-in: delivers each integrated hospital's next rows, then creates or matches the confident rows for this anaesthetist's Lists as the office and sets No contract (RVG) on each Booking it created; the Booking arrives with its wording as received; exceptions stay with the office |

There is no product sync button and no scheduled pull: US-02.1.5 leaves the mechanism to the
integration team, so Simulate sync is a demo stand-in for the hospital, not an admin action.

PWA equivalents: the only mobile side of this phase is S1's "the booking reaches my List", covered by
the stand-in above. The matching screen, Surgeon PDFs and the Future-scope surface do not exist in the
PWA.

## Out of scope

- Real transport, file formats or cadence for the sync (OQ-13), and any schedule, pull on open, Sync
  button, last-synced time or failed-sync display (removed from US-02.1.5 on 2026-10-02). Whether to
  restore a last-synced line is an owner check, not a build item.
- Surgeon PDF upload, parsing, OCR, mailbox reading and new review fields (DOB, ethnicity, estimated
  duration): US-02.2.1 is Future Work. The existing tab is badged, not extended or removed.
- Extending the HL7/FHIR simulator, the message model, the retry engine or feed mapping in any way; the
  Christchurch Public feed stays only on the Future-scope surface, relabelled and out of the Live drip
  (item 5), and is never synced.
- Feeds for the five other providers (US-14.6.1) and real automatic matching (US-14.6.2): both Future
  Work; only the badged demo toggle is built. Hospital-supplied Contracts on a row (US-04.3.6, OQ-22,
  Future Work), and any hospital default Contract (gone with OQ-78's answer).
- The source-text model, the "as given" field and the stack (20a), the Contract picker and the "Needs
  a Contract" list (20), the payer on the Booking (21): reused, not changed. No mapping from a row's
  wording to a procedure or a Contract: a person reads the wording and picks.
- Phase 33's matching rules, decisions, field differences and unmatched queue: reused, not changed,
  except for the `'sync'` channel value, the staging hook the auto-match toggle needs, and the route
  move into Intake. The automated change stories (US-02.5.1 to US-02.5.3) stay out of the demo (Phase
  33, RV-28).
- Draft List mechanics (31), explicit save and the update email (35), the missing-NHI problem list and
  the unpaid-balance warning (40; S1's Sarah Mitchell has an unpaid prior balance that 40's warning will
  surface), the restricted raw-row view and scale (43), editing the new hospitals as masters (42).
- The web app: nothing changes there.
- The full S1 to S5 rewrite and master-guide regeneration (44). This phase rebuilds S1 and patches the
  beats it breaks.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Fresh reset, open Admin: the side nav shows one "Intake" item under Day view (no "Integrations", no separate "Matching"); `/admin/integrations` and `/admin/matching` land on `/admin/intake/matching`; Phase 33's Send unmatched row, Send update for a matched Booking and Reschedule to a date with no List still appear there.
- [ ] The matching screen shows the Intake header (no cadence, no Sync button, no last-synced tile) and the Other providers strip reading "None yet" for all five.
- [ ] Demo actions on the matching screen lists Simulate sync, Deliver hospital sheet and Auto-match (Future scope); none of them appears on the Day view or on Surgeon PDFs.
- [ ] Simulate sync, St George's: two rows arrive marked New with the "Sync" micro-cap, each showing its procedure text as received (Sarah Mitchell reading `lap appy ?conv to open`, proposal Create Booking on Dr Souter's Tue 28 Jul AM; the new-format NHI patient reading `L4/5 microdisc` on another anaesthetist's List); the Audit viewer shows one "Hospital sync" row; Mobile Tue 28 Jul AM still shows three bookings (no silent apply).
- [ ] Importing the St George's sample by hand after that reports Sarah Mitchell's row as already imported (no duplicate row).
- [ ] Deciding Sarah Mitchell's row creates her Booking at 08:30 on Dr Souter's Tue 28 Jul AM List with source "Hospital download", its wording `lap appy ?conv to open` as received from St George's, no procedure picked and **no Contract**: it appears on Admin Day's "Needs a Contract" card, and nothing anywhere names a default or hospital Contract.
- [ ] The office opens Sarah Mitchell's Booking and the Contract picker: No contract (RVG) is the first row, any fitting Contracts sit below under holder headings, and there is no hospital default; picking No contract (RVG) takes the Booking off "Needs a Contract", and the Admin stack reads the wording, "Procedure to choose", then No contract (RVG) with who is invoiced (Sarah Mitchell, the payer on the Booking, if 21 is DONE) and RVG pricing.
- [ ] Mobile then shows four bookings, 0 of 4 complete, the List ACTIVE; Sarah Mitchell's Booking shows the same three-part stack on mobile and web; at Procedure day the anaesthetist picks Appendicectomy (A3) in the two-tab picker with the wording above it, and the stack's middle part fills while the wording stays exactly as received.
- [ ] Simulate sync, St George's again: the time change arrives with its field difference; a third time: the reschedule lands in the unmatched queue; the St George's choice is then disabled "No more rows from St George's in this demo". Southern Cross: Priya Nair, then the cancellation.
- [ ] Deliver hospital sheet: every row shows its wording as the provider wrote it; Forte shows a matched row with a time difference and a new row; Burwood's rows land unmatched and offer Create List or Draft List; a second Burwood delivery is disabled "Already imported today"; the Other providers strip shows each last import.
- [ ] Auto-match on (fresh reset): the banner shows with the Future scope badge; Simulate sync St George's twice: the time change reads "Applied by auto-match" (its Booking's wording, procedure and Contract unchanged), and Southern Cross's cancellation still waits; Auto-match off stops it; reset leaves it off.
- [ ] Surgeon PDFs (`/admin/intake/pdfs`): the tab sits last with the Future scope badge and the Future Work note; the inbox, review and ingest behave as before; Ingest PDF row appears only there, badged. Data quality and Validators are unbadged and work as before.
- [ ] Future scope: HL7 and FHIR (app switcher): the header badge and line; Simulator, Message log and Feed mapping sub-routes work as before; firing MSG-STG-1001 lands a row on Admin Intake (after the S1 sync, Phase 33's dedupe may count it as already imported if the fields match; either outcome stages nothing twice and applies nothing); Admin has no Messages or Feed config tab left.
- [ ] Christchurch Public is no longer a live feed: Live drip does not offer it; its feed entry reads "not integrated today"; firing MSG-CPH-2001 by hand lands a row in a batch labelled "Future-scope HL7 demo · Christchurch Public"; nothing in Admin, mobile, web, the PWA or the Control Panel scenario text calls it a feed.
- [ ] Control Panel: the S1 jump message and nav buttons follow the new beats (sync, match, the wording, the office's No contract (RVG) pick, the two-tab procedure pick at capture), with no Future-scope caveat, no "default Contract" and no code 20950; the index lists the new entries under Admin · Intake and the HL7 entries under Future scope.
- [ ] PWA (`npm run dev:pwa`, fresh storage): on the Tue 28 Jul AM List the Demo chip offers "Hospital sync delivers my booking"; running it adds Sarah Mitchell as a fourth booking whose stack reads `lap appy ?conv to open`, the procedure to choose, and No contract (RVG); once nothing is left for the persona it is disabled "Nothing new from the hospitals for your Lists".
- [ ] S1 walked end to end from the run sheet in the framed build; S4 Beat 4 and S5 Beat 2 walked as patched.
- [ ] No en or em dash in any new app copy; teal only on product action buttons; no crimson on rows, pills or banners; the word "slot" in no new copy.
- [ ] Catalogue screenshots: the recipes for US-02.1.5, US-14.6.1 and US-14.6.2 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` green.

## Demo guide updates

Patch these in the same session, and the same sections of `master-demo-guide.html` (the S1 details
block, the workflows, the personas, the readiness snapshot and the Direct URLs):

- `03-demo-script.md`:
  - **S1 · Booking to theatre, rebuilt** (one rewrite of the whole scenario, superseding the
    interim S1 patches 20 and 20a made to Beat 1's Contract line and Beat 2's stack). "Serves": the St
    George's and Southern Cross sync into the matching screen, the wording kept as received, the office
    choosing the Contract, the Booking as the billing anchor and BTM capture. Stage it: Reset (or the
    S1 jump). **Beat 1, "the booking arrives by sync"**: Mobile Tue 28 Jul AM (three booked cases, read
    as the rooms sent them), then Admin Intake, Demo actions "Simulate sync" (St George's): two rows
    arrive, marked New; Sarah Mitchell's row reads `lap appy ?conv to open` (patient reused by NHI,
    proposed List), Create Booking. Say: St George's and Southern Cross bring their rows in without
    anyone downloading them; how each hospital delivers is for the integration team to establish;
    nothing reaches the schedule until the office decides, which is the check AA relies on today (who
    is on the List, double bookings, changed times); the hospital's wording is kept exactly as it came,
    because shorthand like "?conv to open" needs someone who knows the work to read it; the other
    providers' daily sheets are imported by hand into the same screen; Christchurch Public and the rest
    are not integrated. **Beat 1a, "the office chooses the Contract"**: the new Booking waits on Admin
    Day's "Needs a Contract" card (the row named no Contract, and nothing is taken from the hospital);
    open it, open the Contract picker: No contract (RVG) is always first, with any Contract that fits
    this hospital, surgeon or anaesthetist below it under its holder; pick No contract (RVG). Say: one
    Contract per Procedure decides the pricing and who is invoiced; No contract (RVG) bills the payer
    on the Booking, here Sarah herself; there is no hospital default to undo. Back to Mobile for the
    fourth Booking and its stack: the wording as received, the procedure still to choose, the Contract.
    **Optional Beat 1b, "the other
    providers"**: Deliver hospital sheet (Burwood), rows in the unmatched queue offering Create List or
    Draft List, then (Future scope aside) Auto-match on, Simulate sync St George's, the routine time
    change applied and the exceptions still waiting; narrate Greg's question ("it's obvious which one it
    needs to be") and the answer: automatic matching is a later phase, once AA has seen how confident it
    can be (FT-02.1: no automated decisions in the first version). Beat 2 is unchanged apart from
    pointing at the stack. **Beat 3**: the anaesthetist opens Sarah, reads the wording, and picks
    Appendicectomy (A3) in the two-tab picker (Procedures, RVG codes) before Start now; the stack's
    middle part fills and the wording above it stays as received; replace "Choose procedure 20950 ·
    Appendicectomy, laparoscopic" and keep 1 of 4 complete, the List ACTIVE (never DRAFT). Remove Phase
    14's Future-scope caveat, the HL7 "Say" line, the MSG-STG-1001 click and any "default Contract"
    line. Discovery points: the delivery mechanism is OQ-13, left to the integration team; setting a
    Booking up with no procedure, the anaesthetist picking it at capture, is D33 (OQ-99), still to
    confirm with AA.
  - **S4 Beat 4** (if Phase 33 has not already re-pointed it; check either way that no line still
    calls Christchurch Public a feed of today's system): no longer Admin Feed config. Use the unmatched
    queue (Phase 33's "Send unmatched row" or St George's delivery 3, the reschedule with no List) and,
    optionally, the Christchurch Public mapping fix as a clearly labelled Future-scope aside on the
    Future-scope surface ("an example of a further feed; Christchurch Public is not integrated today").
  - **S5 Beat 2**: the new-format NHI arrives on the St George's synced row and validates on the
    matching screen; the Validators tab (Admin Intake) is the optional deeper look. No MSG-STG-1002.
  - Any beat or line that presents surgeon PDF ingest as in scope: it is Future Work now; keep it only
    as a labelled aside ("surgeon PDF ingest is not in the first release; the tab is shown for
    discussion").
  - "Pre-demo setup", "Direct URLs" (the Intake routes; the Future-scope surface and its sub-routes),
    "Recommended run orders" (the Integration-led row: S1 with Beat 1b), "What to narrate rather than
    click" (HL7 v2, FHIR R4, further feeds, Christchurch Public's included, automatic matching and
    surgeon PDF ingest are Future scope), "Recovery from demo accidents" (the simulator's reset now sits
    on the Future-scope surface; a used-up Simulate sync needs a reset).
- `04-presenter-cheat-sheet.md`: the demo-only list (Simulate sync as the hospital stand-in, Deliver
  hospital sheet, the auto-match toggle as Future scope, the Future-scope surface, Surgeon PDFs as
  Future scope), the Phase 11 readiness line, the S1 line (sync, match, the wording as received, No
  contract (RVG) chosen by the office, no hospital default), and the "real patient or integration
  data?" answer (simulated rows from St George's and Southern Cross only, hand imported sheets for the
  others; the procedure wording is illustrative, not AA's).
- `02-workflows-and-handoffs.md`: Workflow 1 main path (rows from the two integrated hospitals or a
  hand import, each with its wording as received, then the office matches and sets the Contract, No
  contract (RVG) first; surgeon PDFs are Future Work); the "Integration failure"
  exception becomes "Row the office cannot match" (unmatched queue; rows about locked Lists wait for
  the office); the readiness table row.
- `01-personas-and-responsibilities.md`: the integration and exception operator becomes the intake
  operator (matching, daily sheets, data quality); HL7 and FHIR monitoring and surgeon PDF ingest are
  Future scope.
- `README.md` (demo guide): the readiness rows for ingestion and monitoring.
- Control Panel scenario text: S1 (work item 10), and S4 and S5 where patched.
- Finish with a consistency read of the S1, S4 Beat 4 and S5 Beat 2 sections of `master-demo-guide.html`
  against the run sheet and the app (S1 is the headline; do not leave it for 44): no "default
  Contract", no 20950, no DRAFT for Souter's List, the same wording string everywhere.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 34` first: earlier phases may have
changed these recipes since this plan was written (Phase 33 may leave a partial US-02.1.5 recipe, and
re-points the matching shots this phase moves). The harness bar is hidden in shots, so bar-only states
(Simulate sync, Deliver hospital sheet, Auto-match) are staged with the runner's `trigger` step on
`/admin/intake/matching` (for example `{ "trigger": "simulate-hospital-sync", "choice": "St George's" }`;
ATLAS.md, "Recipe format" and "Demo control panel and Demo actions"). The `/demo/control` index has no trigger buttons.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) Automatic sync from St George's and Southern Cross | none (create it); a placeholder `absent` may exist, and Phase 33 may leave it partial | captured (admin, `/admin/intake/matching`). Shots: `synced-rows` (new; set up with the `trigger` step `simulate-hospital-sync`, choice St George's: Sarah Mitchell's and the new-format NHI rows marked New with the "Sync" micro-cap, each showing its procedure text as received, `lap appy ?conv to open` and `L4/5 microdisc`; highlight `row-new`) and Phase 33's `rows-wait-for-decision`, kept under that name (rule 2: keep shot names) but re-staged from the sync instead of the `SAMPLE_STG` hand import (the same rows still pending after a second `trigger` with choice Southern Cross, none applied, the stats strip counting them, and the Booking a row targets unchanged). Caption in the catalogue's words: "Rows from St George's and Southern Cross arrive on the matching screen, and nothing is applied until an admin decides". No caption says a created Booking takes a default or hospital Contract. No last-synced or Sync button shot: the story no longer asks for them. Drop any partial reason |
| [US-14.6.1](../../../../requirements-board/requirements/stories/US-14.6.1.md) Feeds from the other Christchurch providers | absent (placeholder: Future Work swimlane) | partial (admin). The five providers' daily sheets are delivered and imported by hand onto the same matching screen: shots `other-providers` (the strip with each provider's last import, `other-providers`) and `forte-sheet` (after the `trigger` step `deliver-hospital-sheet`, choice Forte Health, Forte's rows with their wording as the provider wrote it: matched with a time difference, and new). `absentReason`: "The five other providers arrive as daily sheets imported by hand, not as feeds. An automatic feed per provider is Future Work (OQ-13, OQ-22)." Never caption it a feed |
| [US-14.6.2](../../../../requirements-board/requirements/stories/US-14.6.2.md) Automatic matching and updates | absent (placeholder: Future Work swimlane) | partial (admin). Shots (staged with `trigger` steps: `auto-match` "Turn on", then `simulate-hospital-sync` St George's twice and Southern Cross twice): `auto-match-banner` (the matching screen with Auto-match on, the Future scope badge and its banner) and `applied-by-auto-match`, two states: the Decided filter with St George's time change reading "Applied by auto-match" (a time change only; no procedure, wording or Contract set), and the Open filter with Southern Cross's cancellation still waiting for the admin. `absentReason`: "Only a demo-only toggle for routine time changes is built, badged Future scope. Real automatic matching of incoming rows is Future Work (OQ-13, OQ-22)." |

**Recipes this phase breaks.** Re-point each (Phase 33's changes land first, so re-run the status tool
and the `--dry` run):
- Admin tabs moved to Intake routes, with tabs as URL-routed links rather than buttons (the
  `role=button[name="Surgeon PDFs"]` and `"Validators"` clicks break): `FT-02.2`, `US-02.2.1` and any
  recipe of the Retired `US-02.2.2` still on disk, `US-11.1.2`. Point each `start` at
  `/admin/intake/pdfs` or `/admin/intake/validators` and drop the tab click. The Surgeon PDFs shots now
  show the Future scope badge and note; keep their states, add none (US-02.2.1 is Future Work).
- Phase 33's `/admin/matching` recipes: `US-02.1.1`, `US-02.1.2`, `US-02.1.3`, `US-02.1.4` and any
  other recipe Phase 33 aimed there move to `/admin/intake/matching` (the redirect keeps them working,
  but re-point them). A recipe that imports `SAMPLE_STG` after a Simulate sync setup must expect R1 as
  already imported.
- Message log and mapping moved to the Future-scope routes: `US-14.1.1` (`message-log`),
  `US-14.5.1` (`dead-letter`), `US-14.2.1` and `US-14.3.1` (the simulator, now headed Future scope;
  the Live drip no longer offers Christchurch Public). Point the log shots at `/demo/integrations/log`.
- Any recipe (or `pwa-device.spec.ts` step) that runs the PWA entry `matching-office-matches-row`
  with Phase 33's S1 choice label ("Sarah Mitchell, Tue 28 Jul AM (S1)"): point it at the relabelled
  choice (item 9).
- `US-02.5.1` to `US-02.5.4` (Future Work; Phase 33's partial analogues) start at `/demo/integrations`,
  whose path is kept: check they still pass under the Future-scope header, and that no caption calls
  the simulator or Christchurch Public in scope.
- Any recipe that clicks the Admin side nav's "Integrations" or "Matching" item: they are now one
  "Intake" item. None found at plan time; the `--dry` run is the check.
- **S1-related recipes the rebuild changes.** Any recipe that stages Sarah Mitchell's S1 Booking by
  firing MSG-STG-1001 or hand-importing `SAMPLE_STG` (Phase 20a's US-02.5.7 or US-03.1.9 shots of her
  stack, Phase 20's US-04.3.4 `needs-contract` shot, Phase 33's matching shots, whatever the status tool
  and `grep -l "MSG-STG-1001\|SAMPLE_STG\|Sarah" requirements-board/capture/recipes/*.json` find):
  keep its shot names and re-stage it through the S1 path where the shot is about S1 (the
  `simulate-hospital-sync` trigger, the row's decision, then No contract (RVG)), or leave its own
  setup where it is not. What each must show when done: the wording `lap appy ?conv to open` exactly as
  received; before the office's pick, the Booking on "Needs a Contract" with no Contract; after it,
  the stack with No contract (RVG) first-picked, who is invoiced and RVG pricing. Replace any caption
  that still says the Booking "takes the hospital's default Contract", names procedure code 20950 or
  calls Souter's List DRAFT.

**ATLAS.md.** Update Routes (`/admin/intake/*`, the redirects, `/demo/integrations/log` and `/mapping`,
the Future-scope header), Personas and IDs / Seed data (the three appended hospitals, the sync
deliveries and sample sheets), Existing hooks (`row-new`, `other-providers`), the "Demo actions by
screen" `trigger` ids (`simulate-hospital-sync`, `deliver-hospital-sheet`, `auto-match`, the re-pointed
`ingest-pdf-row`, the HL7 entries now on the Future-scope routes, and the relabelled PWA choice) and the Integration simulator section
(Christchurch Public is not integrated today; Surgeon PDFs is Future scope).

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
- **No silent apply.** No sync, sheet or HL7 message writes a Booking, List or Patient except through
  Phase 33's decision action; the only automatic application is the auto-match toggle, which is off by
  default, badged Future scope, limited to `isAutoMatchEligible` rows and audited under its own actor.
- **Wording and Contract.** Every synced and sheet row carries non-blank procedure text; a Booking
  created from a row keeps it character for character through Phase 33's path and 20a's rules (no
  trim, no overwrite, an exact duplicate adds nothing); no row, delivery, sheet, auto-match or stand-in
  sets a procedure from the wording or picks a Contract other than the scripted No contract (RVG) on a
  Booking the stand-in itself created; nothing derives a Contract from St George's or Southern Cross;
  no "default Contract" survives in S1's code, copy or tests.
- **Nothing staged twice.** A delivery is staged once; the delivered set is derived from batches, not a
  second store; sync and hand import of the same row dedupe through Phase 33 in either order; a reset
  restores the seed.
- **No invented sync mechanics.** No schedule, no pull on open, no Sync button, no last-synced time, no
  failure state, no `setInterval`, `Date.now()` or `new Date()`; no persisted sync state; no
  "provisional cadence" wording. US-02.1.5 removed all of it.
- **Scope honesty.** Only St George's and Southern Cross sync; Christchurch Public is no longer a live
  feed anywhere (not synced, not in the Live drip, labelled "not integrated today" on the Future-scope
  surface, its fired rows batch-labelled as the HL7 demo); the five providers are hand-imported sheets,
  never labelled a feed; everything HL7, FHIR, retry, dead-letter and mapping sits on the Future-scope
  surface with the `'future'` badge and nowhere in Admin, the mobile app or the PWA; Surgeon PDFs, its
  ingest and its trigger carry the Future scope badge and were not extended.
- **The in-scope pieces survived the move.** Data quality and Validators still work, keep their
  behaviour and tests, and live under Admin Intake unbadged; Surgeon PDFs still works; redirects cover
  `/admin/integrations` and any Phase 33 route; `ingest-pdf-row` was re-pointed, not broken.
- **Seed hygiene.** The three hospitals are appended and the canvas is byte-identical; sync deliveries
  and sheets avoid every scripted-beat List and Booking; `PERSIST_VERSION` is bumped; seeded
  `surgeonPdf` sources are unchanged.
- **Triggers and PWA purity.** New entries are scoped to their routes; the stand-in is PWA only and
  acts only for the persona's Lists; bodies live in `src/store` or `src/shared`; nothing from
  `src/apps/demo/futureScope/` or `src/apps/admin` reaches the PWA closure.
- **S1 and the guide agree.** The Control Panel S1 text, the run sheet, the master guide and the app
  tell the same story (sync, match, the wording as received, the office's No contract (RVG) pick, the
  procedure picked at capture), with no leftover MSG-STG-1001 instruction, Future-scope caveat, "near
  real time" claim, scheduled-pull narration, in-scope PDF beat, "default Contract", code 20950 or
  DRAFT for an assigned List.
- **Design and copy.** The rows and strip follow the Admin Review anatomy; tints from the tokens; teal
  only for actions; no crimson on rows, pills or banners; no en or em dashes; no "slot" in copy.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): anything logged rather than fixed, and the screens worth a look, each with its route
  and persona; in particular whether a last-synced line should come back on the matching screen
  (US-02.1.5 removed it; not built), whether the Surgeon PDFs tab should be hidden rather than
  badged, S1's reliance on D33 (OQ-99: Sarah Mitchell's Booking set up with no procedure, picked by the
  anaesthetist at capture), and the AR-35 wording placed on the deliveries and sheets (AI-made, not
  from AA; any row reused on a channel AR-35 does not list, starting with row 14, an email in AR-35,
  on the St George's sync, as 20a already logged for MSG-STG-1001).
- **Status row** for catch-up Phase 34, and an entry `### Catch-up Phase 34 · Hospital sync, manual
  sheets and the S1 rebuild (date)` with:
  - the drift-check result against `60e2d1e`, OQ-13's status and OQ-99's (D33);
  - the real Phase 33 names used (row types, staging and decision actions, routes), and Phase 20's and
    20a's (the Contract step, "Needs a Contract", the source-text channel a synced row writes);
  - what was built, and what was moved to the Future-scope surface or badged there;
  - the `PERSIST_VERSION` bump (from and to);
  - the sync deliveries and sheets the seed tests pin, for the demo guide;
  - tests added (domain, store, triggers, Playwright) and the review pass;
  - the S1 consistency read;
  - the Catalogue screenshots result: recipes created or changed, the REPORT.md counts (captured,
    partial, absent, failed) before and after, and any partial reason handed to a later phase (US-14.6.1
    and US-14.6.2 stay partial, as Future Work).
- **Decisions log:**
  1. **Supersedes** the Phase 11 reading that the Integrations monitor is "proposed product UI, not
     demo-badged" (and convention 13's integration-monitor wording): the message log, retries,
     dead-letter and feed mapping are Future scope and live on the Future-scope demo surface; Admin
     Intake holds matching, data quality and the validators (RV-05).
  2. **Closes** Phase 14's "HL7/FHIR tooling carries interim Future-scope badges until Phase 34"; the
     simulator is kept, not extended, and S1 no longer rests on it (RV-06).
  3. **Supersedes** the same Phase 14 entry's ruling that Surgeon PDFs stays unbadged as in scope:
     US-02.2.1 moved to the Future Work lane on 2026-10-02, so the tab, its ingest and its trigger carry
     the Future scope badge, unchanged in behaviour (RV-26). Seeded Bookings keep the descriptive
     `surgeonPdf` source.
  4. The sync is shown only as arrival: Simulate sync delivers each integrated hospital's next rows in
     Phase 33's neutral row shape; no schedule, pull on open, Sync button or last-synced state, because
     US-02.1.5 removed them and leaves the mechanism to the integration team (OQ-13).
  5. Forte Health, Christchurch Eye Surgery, Burwood, Southern Endo and McMurray Centre are
     hand-imported daily sheets (the FT-02.1 baseline); their feeds are Future Work. Auto-match is a
     demo-only toggle showing US-14.6.2 (Future Work), off by default.
  6. **Supersedes** the Phase 11 reading of Christchurch Public as a third live HL7 feed: only St
     George's and Southern Cross are integrated (US-02.1.5); Christchurch Public's feed remains only as
     a labelled Future-scope example, out of the Live drip.
  7. **Supersedes** S1's "the hospital booking takes St George's default Contract" (the protected
     default per hospital, retired by 18 and 20 under OQ-78): S1's Booking arrives with its wording as
     received and no Contract, and the office picks No contract (RVG), first in the picker (US-04.3.3,
     US-04.3.4, US-02.5.7). The S1 procedure is picked at capture under D33 (OQ-99, Open).
- **Binding conventions:** convention 4's "Simulated external systems (Xero, HL7, PDF/OCR)" adds the
  hospital sync stand-in and names the Future-scope surface for HL7 and FHIR.
- **Handoff notes:**
  - For **35**: rows decided on the matching screen that change a Booking are candidates for the
    update email's change history and the explicit-save change set.
  - For **40**: McMurray's row without an NHI and S1's Sarah Mitchell (unpaid prior balance) are the
    natural beats for the missing-NHI list and the mild or strong unpaid-balance warning;
    `MANUAL_PROVIDER_SHEETS` is the map to read.
  - For **42**: the three new hospitals are candidates for editable reference data.
  - For **43**: the restricted raw-row view should cover synced rows and the Future-scope message log
    (which still shows a patient reference).
  - For **44**: S1 is rebuilt, not polished; the rewrite regenerates the master guide and walks the
    handset stand-in in the PWA-parity audit.
  - If OQ-13 is answered: the switch points are `HOSPITAL_SYNC_DELIVERIES`' row fields; any mechanism
    (cadence, button, status) waits on US-02.1.5 changing.
