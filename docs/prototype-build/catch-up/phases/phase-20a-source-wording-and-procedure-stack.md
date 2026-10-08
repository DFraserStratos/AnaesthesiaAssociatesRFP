# Phase 20a · Source wording and the three-part Procedure stack

**Requirements covered:**
[US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) Keep the procedure text as received (Confirmed, added 2026-10-08; graded **Contradicts**: today's one editable `Procedure.description` doubles as the received text, is trimmed on create and is overwritten by PDF updates and Edit procedure) ·
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) Source wording, procedure and Contract shown together (Confirmed, rewritten 2026-10-08; graded Partial; [OQ-103](../../../../requirements-board/requirements/questions/OQ-103.md) open) ·
[US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md) See the Contract on each Procedure (Confirmed; graded Partial: the Contract name shows, but not the holder, who is invoiced or the pricing basis with its figure, and not in the stack) ·
[US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking manually (Proposed; graded Partial: no optional "as given" field) ·
[DM-51](../analysis/domain-model-delta.md#dm-51) Procedure keeps source wording exactly as received, with later different wording added beside it.
**Leans on, not covered:**
[US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md) (Phase 35's: the office's "as given" on phone or email bookings; this phase gives the office's phone-advice form its "as given" field and builds the append-only store action 35 reuses),
[US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) and FT-02.5 (Phase 33's: each matching-screen row shows its text as received; 33 adds this phase's stack to its rows),
[US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) (Phase 21's: office review shows the stack; this phase puts the stack into Admin Review, 21 adds the payer and the warnings),
[US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) (Phase 19's procedure list and general procedures, whose names are the invoice wording),
[US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) (Phase 20's two-tab pick, then the Contract),
[US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md) (Phase 43a's; its Proposed note "anaesthetists see none of the Contract complexity" yields to the Confirmed US-03.1.2 and US-03.1.9 here, see Goal) and
[OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md) (which field carries the procedure text in each hospital's download or feed: unknown; the simulated feeds' SCH-7 and `Appointment.description` stand in).
**Open, build the default:** [OQ-103](../../../../requirements-board/requirements/questions/OQ-103.md)
(owner decision **D37**, Open: a general procedure is named by section, tier and code in plain words AA
can edit, for example "Head, moderate procedure (H3)"; the invoice prints that name; the office review
flag on a general procedure is 21's) and [OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md)
(**D33**, Open: a blank procedure at setup, required at completion; built by 20 and 21, and this phase's
stack shows the blank as still to choose).
**Depends on:** Phase 20, done (one Contract per Procedure, mandatory at setup, the "Needs a Contract"
list, No contract (RVG) first, the RVG-code route, D33's blank procedure, and 20's interim "who is
billed" function), and through it 19 (RVG groups, the curated procedure list with a general procedure
per group, the two-tab picker, the Procedure's procedure link), 19a (Contract lines and the line,
procedure, group resolver), 19b (itemised modifiers), 18 (contract holders, dated Contracts, the AA
code, one stored No contract (RVG)), 15b (Copy and photo out, the manual form opening straight on
"Add a booking", ACTIVE for an assigned List), 15a (warnings), 15 (Booking vocabulary, `Booking.source`)
and 14 (the trigger registry). Runs straight after 20 and before 21 (whose review shows the stack) and
33 (whose matching screen shows it on every row).
**Estimated:** 2 sessions. Session 1: work items 1 to 8 (the source-text model, the one pure stack
module, every intake path, the reader sweep, the seed from AR-35, tests), ending green with the UI
changed only as far as it must compile (readers moved to `procedureLabel`). Session 2: items 9 to 16
(the `ProcedureStack` component and its placement in both apps, the "as given" field, the invoice
wording, the trigger re-point, shots, demo guide). If session 2 runs long, cut the "Add wording as
given" action on an existing Booking (item 9e) before any placement.

## Goal

Two things the 2026-10-08 decisions ask for, built together because one is the data and the other is
how every booking screen shows it.

**The procedure text is kept exactly as received** (US-02.5.7, DM-51). The wording that arrives from
surgeons' rooms and hospitals is shorthand in endless variety ("RTK", "WLE MM", "blephs"), readable by
someone who knows the work, and the person matching it to a procedure and Contract, or checking that
match later, needs the original. Today the prototype has one free-text `Procedure.description` that
does three jobs at once (the received text, the procedure's name, and the label every screen shows),
is trimmed on create and is overwritten by a PDF update and by Edit procedure. This phase splits it:

- Each Procedure holds an **append-only list of source texts**, each with the channel it came from
  (hospital download or feed, HL7 or FHIR, surgeon's rooms PDF, email, phone, the anaesthetist) and
  when it arrived. A text is stored character for character and never edited or overwritten; a later
  update with different wording is **added beside it**. A Procedure may have none (an additional
  procedure added in the app, a Booking the office set up straight from the picker).
- **Every intake path writes it:** the anaesthetist's manual add on mobile and web with an optional
  **"as given"** field (US-02.4.1), the office's phone-advice form with the same field, the hospital
  message apply path (create and update, until Phase 33's matching screen takes over), and the
  Future-scope surgeon PDF ingest.
- **Edits change the procedure pick, never the source text.** The procedure's own name comes from 19's
  procedure list (or a group's general procedure); the free-text description goes.
- Today's `Procedure.description` becomes the first source text of every seeded Procedure in one step,
  and the `PERSIST_VERSION` bump reseeds any persisted rehearsal state, so no stored row is left in the
  old shape.

**Every booking screen shows each Procedure as a stack of three** (US-03.1.9, US-03.1.2), top to
bottom:

1. **As received:** the source texts, earliest first, each with its channel and date, with fuller
   later wording shown too.
2. **Procedure:** the procedure picked and its RVG code (a general procedure marked as one).
3. **Contract:** its name and holder, who is invoiced, and the pricing basis with its figure ("Fixed
   $2,400", "10% off RVG", "$125.00 per unit", or "RVG").

Empty parts are marked as still to choose. One shared `ProcedureStack` component (in `src/shared`,
PWA-safe) renders it on the shared `BookingDetailBody` (mobile, web, Admin and the PWA at once), in
Admin List drawer rows and in Admin Review, where every Procedure shows, not only the primary. Phase 33
adds it to the matching screen. The component reads one view type from one pure module; **"who is
invoiced" and "pricing basis" are each one function**, so Phase 21 (the payer on the Booking) and Phase
24 (the one price precedence) change what they return without touching the component.

**The pricing model stays in one place.** The stack's Contract part reads the booking procedure's
procedure and Contract, which the draft technical design shapes ([AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md)
region `booking-procedure`; [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md)
region `booking-procedure-fields`) and the plain-language guide explains ([AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md)
region `booking-to-invoice`: the office selects the procedure then the Contract, the anaesthetist
reviews and may change either until submit). Both drafts are v4 and a v5 may change them, and neither
draft ERD has a source-wording field yet (the 2026-10-08 change log says so). So the view type, the
who-is-invoiced and pricing-basis functions, the invoice wording and the label helper live in one new
module, `aa-prototype/src/domain/billing/procedureStack.ts`, beside the structures 18 to 20 built there;
the `SourceText` type sits on the `Procedure` type it extends; and the UI reads only the view type. A
later design change is a contained edit to that module and the seed.

**The invoice prints the procedure's own wording, never the source text** (US-03.1.9: the procedure
list is "worded as it should appear on the invoice"; Ben: a patient "would have no idea what it
meant"). A general procedure prints its plain name (OQ-103's default, D37). The tension in the story's
note (Greg reports Nick and Rob are "quite happy" to keep printing the rooms' text) is built the
catalogue's way, in one function, and logged.

**The anaesthetist sees the Contract summary.** US-15.0.1's Proposed note ("today anaesthetists see
none of the Contract complexity") yields to the Confirmed US-03.1.2 and US-03.1.9, which put the
Contract's name, holder, who is invoiced and pricing basis on the anaesthetist's Booking. The
2026-09-28 Decisions-log ruling "Anaesthetist Card shows no calculation" stands for the running fee
and the Booking total (still hidden); it is superseded only in that the stack shows the Contract's
pricing basis and its figure. Phase 43a keeps the stack when it simplifies the anaesthetist screens.

**Demo wording comes from AR-35.** The seed takes realistic shorthand from the illustrative table in
[AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md) (the note
[2026-10-08-procedure-picker-and-source-text.md](../../../../requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md),
its "Illustrative source wording" heading). That table is **AI-made, not from AA**: the seed says so
in its comments and nothing presents it as AA's data. AR-35 declares no named regions; its
"Illustrative source wording" heading is addressed by its Markdown heading slug,
`AR-35#illustrative-source-wording`, a spot type the catalogue schema allows (`REQ/SCHEMA.md`,
`artifacts`) and that US-02.5.7 and US-03.1.9 already cite. Cite that heading (by name or by that
slug), register no named region, and never edit the artifact in this phase.
The seed places the rows that need an expert to read (14, 15, 17, 21, 26, 27, 34 and 35) and rows 1
and 2 as **one Booking from two sources** (the rooms' "RTK", then the hospital's "right total knee").

No billing figure moves. The stack, the source texts and the invoice heading are display and record;
the engine prices exactly as 20 left it, and S1 to S5 run with every figure unchanged.

## Before you start: drift check

1. Run the catalogue diff since this plan's baseline (`60e2d1e`):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-02.5.7,US-03.1.9,US-03.1.2,US-02.4.1,US-02.3.1,US-02.1.2,US-07.2.2,US-05.1.6,US-15.0.1,FT-03.1,FT-02.5,OQ-103,OQ-99,OQ-13
   ```

   Read the hunks for those items and the domain-model's Procedure "Source wording" bullet, its
   Booking section's pointer to it, the billing-context row ("kept as received and shown above it")
   and the "Source wording" glossary row. Use Node 22.18 or newer (`nvm use 24` if the shell's default
   is older) for the board's `source` script:
   `npm --prefix requirements-board run source -- --item US-03.1.9 --text` prints the cited passages.
2. If an item changed, re-read it and adjust the work items. Specifically:
   - **US-03.1.9 or US-03.1.2.** If the stack's order or parts changed, build the catalogue's current
     reading in `procedureStack.ts` and the component. If the Contract part was taken off the
     anaesthetist's screens (for example US-15.0.1 promoted to Confirmed with that rule), build the
     catalogue's reading, keep the part for the office, and log it.
   - **Invoice wording.** If US-03.1.9's tension was settled toward printing the source text (Nick and
     Rob's view), change only `procedureInvoiceWording` (item 3) and record it; nothing else moves.
   - **US-02.5.7.** If the source text moved off the Procedure (onto the Booking, say), keep one list
     of source texts per Booking with the same rules and adjust items 2, 4 and 7; the stack still
     shows it above each Procedure.
   - **US-02.4.1.** If the "as given" field became required, make it required on the anaesthetist's
     form only.
   - **OQ-103 or OQ-99.** If either was answered, build the answer and drop its provisional label;
     OQ-103's naming lives in 19's seed of general procedures, so check what 19 built first.
   - **A stop condition:** if source wording was Retired or moved to Future Work, stop and tell the
     owner (this phase would no longer make sense).
3. **Confirm the phases this builds on are DONE**, from their PROGRESS entries, and note the names
   they actually used (this plan's names for them are placeholders; reuse theirs, never a second copy):
   - **19:** the Procedure's link to the procedure list (`procedureTypeId` in 19's plan, or as built),
     whether 19 dropped the trailing side from procedure names as its plan says (so "RTK" maps to
     "Total knee replacement" and the side lives only in the wording), the procedure list
     and RVG group masters, the general procedure per group and how it is marked, the two-tab picker
     component, and whether `Procedure.description` survived 19 (19's `pickProcedure` set it to the
     procedure's name when it was empty or still matched the previous pick, so typed text could
     survive).
   - **19a:** the Contract-line lookup for a Procedure (the line for its procedure, or none) and the
     resolver's output type.
   - **18:** the `ContractHolder` master (name, third or first party), the AA code, No contract (RVG)'s
     id.
   - **20:** the interim who-is-billed function (the holder's billable party when the holder is billed,
     else the Procedure's `billablePartyId` override, else the patient) and its name (20's plan:
     `billedPartyFor` in `domain/billing/whoIsBilled.ts`); the Contract
     picker and the "Needs a Contract" list; whether a Booking created without a procedure (D33)
     exists in the seed; whether `EditProcedureSheet` still carries a free-text "Operation" field;
     what the manual form's procedure input now is (19's picker, with or without a typed "Operation"
     text); and `OfficeBillingSetup`'s current rows.
   - **15b:** the manual form opens straight on "Add a booking", and the photo flow is a badged
     Future-scope demo (or deleted).
   Note the current `PERSIST_VERSION`. If 20 is not DONE, stop: the stack's Contract part needs one
   Contract per Procedure.
4. **Open questions** (build the default, label it provisional where it shows, and log it on the
   owner's review list):
   - **OQ-103 (D37):** the invoice prints a general procedure's plain name; the stack marks a general
     procedure as one ("General procedure for H3"). The review prompt for a more specific procedure is
     21's.
   - **OQ-99 (D33):** a Procedure with no procedure picked shows its source text and "Procedure to
     choose" (US-03.1.9 AC "Not matched yet"); completion's block is 21's.
   - **OQ-13:** the simulated feeds' SCH-7 description and FHIR `Appointment.description` are the
     source text; no real hospital field is assumed.
5. Record the result (changed items, the names reused from 18 to 20, the defaults) in the PROGRESS
   entry.

## Reference

**Design (convention 17).** [Design Language.dc.html](../../../design/Design%20Language.dc.html) for
tokens: Spline Sans Mono with tabular numerals for data (RVG codes, AA codes, figures, and the received
wording, which is data shown verbatim), Schibsted Grotesk for labels; the small uppercase section label
treatment (11px, 600, letter-spaced, mist) that `BookingDetailBody`'s `Section` already uses; teal
`#0D6E63` the only action colour (Edit, Add wording as given); crimson never. Status colours are for
List and session status, not for "still to choose": mark empty parts in neutral mist with a neutral
dashed or hairline treatment, never a status tint. [Mobile App.dc.html](../../../design/Mobile%20App.dc.html)
screen 3 (the Booking detail and its procedure block) and [Web Dashboard.dc.html](../../../design/Web%20Dashboard.dc.html)
for density; [Admin Review.dc.html](../../../design/Admin%20Review.dc.html) for the review table and
[Admin Day.dc.html](../../../design/Admin%20Day.dc.html) for the List drawer. No mockup draws the stack:
extend the procedure block's own pattern (convention 17). It must read cleanly on a 375 px phone
without crowding the capture controls below it.

**Catalogue.**
- The covered items above. US-03.1.9's ACs are the stack's test list ("Both apps", "Contract summary",
  "Not matched yet", "Fuller wording kept"); US-02.5.7's ACs are the source text's ("Verbatim", "Never
  overwritten", "As given").
- [domain-model.md](../../../../requirements-board/requirements/domain-model.md): Procedure's "Source
  wording" bullet ("one or more source texts per Procedure, shown in the stack"), the billing-context
  row, the "Source wording" glossary row.
- The note [2026-10-08-procedure-picker-and-source-text.md](../../../../requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md)
  (artifact [AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md)): points #6 (the
  wording is not plain English), #7 (the three things, stacked; the Contract part's content), #8 (kept
  verbatim from every channel, added beside, "as given", the matching screen) and #9 (examples), and
  (spot `AR-35#illustrative-source-wording`, a heading slug, as the stories cite it)
  the "Illustrative source wording" heading: the 35-row table, its sources column, and the closing
  paragraph naming the rows that need an expert (14, 15, 17, 21, 26, 27, 34 and 35).
- The change log [2026-10-08-procedure-picker-and-source-text.md](../../../../requirements-board/requirements/changes/2026-10-08-procedure-picker-and-source-text.md),
  section 6 ("For the build plan").
- Evidence behind the invoice wording: US-03.1.9's notes (Ben and Greg, 7 October); read with
  `npm --prefix requirements-board run source -- --item US-03.1.9 --text`.

**The pricing model (draft v4; keep it in one place).**
- [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) "How procedures are priced and
  who pays" (plain-language guide, true as written): region `booking-to-invoice` (section 4: the office
  selects the procedure then the Contract; the anaesthetist may change either until submit; the
  record of exactly what priced each procedure) and region `who-gets-the-invoice` (the table the
  stack's "who is invoiced" line summarises; 21 builds it).
- [AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) (the ERD): region
  `booking-procedure` (the stack reads the booking procedure's procedure and Contract), with
  `procedure`, `contract` and `contract-holder` for the parts it names.
- [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) (technical design v4):
  region `booking-procedure-fields` (the fields the stack's second and third parts read; no source
  wording field yet), region `billable-party` (what "who is invoiced" will name once 21 builds it)
  and region `price-precedence` (what "pricing basis" will mean once 24 builds it).

**Analysis.** [analysis/domain-model-delta.md](../analysis/domain-model-delta.md#dm-51) DM-51 ("Impact":
an append-only source-text list on Procedure written by every intake path; the stack on all booking
screens, review and the matching screen); [GAP-ANALYSIS.md](../GAP-ANALYSIS.md) rows for US-02.5.7,
US-02.4.1, US-03.1.9 and US-03.1.2, and the EP-02 epic note (`Procedure.sourceTexts[{text, system,
arrivedAt}]`, "createBooking no-trim, ingest adds rather than overwrites"); [epics/EP-02.md](../epics/EP-02.md)
and [epics/EP-03.md](../epics/EP-03.md); [analysis/prototype-map-shared.md](../analysis/prototype-map-shared.md)
(the Booking detail and the capture suite) and [prototype-map-admin.md](../analysis/prototype-map-admin.md)
(Review, the Day drawer).

**PROGRESS.md.** Decisions log **2026-09-28 "Anaesthetist Card shows no calculation"** (superseded in
part here); conventions 5 (mock backend), 6, 7 (determinism), 13 (badges), 16, 17, 18 and 19; the
Phase 15, 15b, 19, 19a, 20 entries.

**Code entry points** (paths under `aa-prototype/src/`; line numbers at plan time, `60e2d1e`, before
15b to 20 reshaped these files: re-find each by name).
- **Model:** `domain/types.ts` `Procedure` (~453; `description` at 456), `BookingSource` (~371).
  `store/lifecycle.ts` `ProcedurePatch` (~436) and `editProcedure` (~438).
- **Create and add:** `store/bookingActions.ts` `CreateBookingInput.operation` (~44) and
  `createBooking` (~78: the "An operation description is required." refusal at ~89, the `trim()` at
  ~135, the `procedure.create` audit `after: { description }` at ~160); `addProcedure` (~422, skeleton
  `description: ''`); the post-op addendum skeleton (~362).
- **Intake:** `store/integrationActions.ts` `applyEffect` (~138: S12 create with `operation:
  parsed.operation ?? 'Procedure (from feed)'` at ~157; S13 and S14 apply ~178-215) and `ingestPdfRow`
  (~434; the update path overwrites with `editProcedure(..., { description: row.operation.trim() })`
  at ~461). `domain/integrations/hl7.ts` (`operation` from SCH-7, ~179), `fhir.ts`
  (`Appointment.description`, ~164 and ~225), `messages.ts` (canned messages: MSG-STG-1001 the S1
  create at ~157, MSG-STG-1012 the S14 modification at ~298, `buildHl7`'s `code^description` at ~89).
- **Forms:** `shared/flows/ManualBookingForm.tsx` (the "Operation" field ~201 and its prefill from the
  code's description ~106; shared by mobile and web Add a booking and Admin's phone advice through
  `AddBookingFlow`), `apps/admin/flows/PhoneAdviceBooking.tsx`, `shared/flows/EditProcedureSheet.tsx`
  (the free-text "Operation" at ~67), `shared/flows/RemoveProcedureSheet.tsx` (~41),
  `shared/flows/sampleExtractions.ts` (the Future-scope photo prefill).
- **Display:** `shared/capture/BtmCaptureBlock.tsx` (the header `data-testid="procedure-header"` with
  "PROCEDURE n" and the description ~123-135, the read-only context line `data-shot="procedure-contract"`
  ~189); `shared/booking/BookingDetailBody.tsx` (the totals labels ~226, the history scope labels ~296,
  the procedures loop ~606, `OfficeBillingSetup` ~624, the Booking source line ~574);
  `shared/booking/OfficeBillingSetup.tsx`; the Booking detail headers in
  `apps/mobile/screens/BookingDetailScreen.tsx` (~112), `apps/web/screens/BookingDetailView.tsx` (~73),
  `apps/admin/screens/AdminBookingDetail.tsx` (~64); the List rows in
  `apps/mobile/screens/ListDetailScreen.tsx` (~66-82) and `apps/web/screens/ListDetailView.tsx` (~77);
  `apps/admin/components/ListDrawer.tsx` (Bookings section ~74-93); `apps/admin/screens/ReviewScreen.tsx`
  (history labels ~90, the table columns ~244, the Patient cell subline with only the primary
  Procedure ~258, the Contract and Code cells ~261-262).
- **Invoice:** `apps/admin/screens/InvoiceDocument.tsx` (the lines table `data-shot="invoice-lines"`
  ~159); `domain/billing/fee.ts` (fee line descriptions, ~221-227) and `invoiceBuild.ts` (line text,
  ~243-251): neither prints the procedure's wording today.
- **Labels:** `shared/format.ts` (`BOOKING_SOURCE_LABELS`, `formatCurrency` ~116),
  `shared/audit/actionLabels.ts`, `shared/audit/fieldLabels.ts` (`description: 'Description'` ~45).
- **Seed:** `domain/seed/bookings.ts` (`ProcedureSpec.description` ~249 and `addProcedure` ~266; S1's
  Tue 28 AM cases ~1096 named from `RVG_BY_CODE` descriptions; the Phase 11 integration Bookings
  ~977-1030, Foster's S14 target at ~993; `pinnedListIds` ~1113; the filler `fillList` ~1131),
  `domain/seed/history.ts` (history Procedures' `description` ~72-118, also used as their invoice line
  text), `domain/seed/audit.ts` (`procedure.create` `after: { description }` ~225),
  `domain/billing/fixtures.ts` (~35, ~93, ~102).
- **Triggers:** `shared/demoTriggers/registry.ts` (`fire-hospital-message` ~450: routes, `choices`,
  `defaultChoice`), `pwa/pwaPurity.test.ts`.
- **Persistence:** `store/appStore.ts` `PERSIST_VERSION` (16 at plan time; 15b to 20 bump it) and its
  version comment block; `migrate` returns `freshAppState()` on a mismatch, so a bump reseeds.
- **Tests that read `description`:** `store/bookingActions.test.ts`, `bookingSource.test.ts`,
  `integrationActions.test.ts`, `intake.test.ts`, `captureActions.test.ts`, `btmCapture.test.ts`,
  `shared/booking/BookingDetailSource.test.tsx`, `shared/audit/auditNarrative.test.ts`, the billing
  fixtures' tests; Playwright specs that wait on `procedure-header` or fill "Operation description".

## Work items

Session 1 is items 1 to 8 and ends green. Session 2 is items 9 to 16.

1. **Baseline.** Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` in
   `aa-prototype/` and record the counts. Then the inventory, kept for the PROGRESS entry:

   ```
   grep -rn -e "\.description" -e "operation" -e "Operation" aa-prototype/src aa-prototype/visual aa-prototype/pwa | grep -v -i -e "contract" -e "modifier" -e "demoTrigger" -e "billingLine" -e "line\.description" -e "scenario"
   ```

   Sort the hits into Procedure-wording readers (this phase moves them) and everything else (RVG code,
   modifier, Contract, billing-line and trigger descriptions, which stay).

2. **The source-text model** (`domain/types.ts`, beside `Procedure`).
   - `SourceTextChannel = 'hospitalDownload' | 'hospitalFeed' | 'surgeonPdf' | 'email' | 'phone' |
     'anaesthetist' | 'unrecorded'`.
   - `SourceText { text: string; channel: SourceTextChannel; receivedAtISO: IsoDateTime; from?: string }`
     (`from` names the sender where known: the feed's hospital, the surgeon's rooms, the office user or
     the anaesthetist).
   - `Procedure.sourceTexts: SourceText[]` (required, may be empty), in arrival order. Remove
     `Procedure.description` (or what is left of it after 19 and 20). Doc comment: US-02.5.7, DM-51,
     "append-only: written only by `addSourceText` and the create paths; never edited, never
     overwritten"; and that AR-29's `booking-procedure-fields` (draft v4) has no such field yet, so a
     later design adds it beside the booking procedure's own fields in this one type.
   - `store/lifecycle.ts`: `ProcedurePatch` becomes `Partial<Omit<Procedure, 'id' | 'bookingId' |
     'sourceTexts'>>`, so no edit path can touch the texts; `editProcedure` also refuses at run time a
     patch object carrying `sourceTexts` (a defensive guard with a test, since persisted or demo code
     can bypass types).

3. **One pure stack module** (`domain/billing/procedureStack.ts`, exported through
   `domain/billing/index.ts`; no React, no store import). It is the only place that decides what the
   stack says, and it reads the structures 18 to 20 built in the same folder.
   - **Types the UI reads:** `ProcedureStackView { received: SourceText[]; procedure: { name: string;
     rvgCode: string; general: boolean } | null; contract: { name: string; aaCode?: string; holderName:
     string; firstParty: boolean; invoiced: InvoicedParty; basis: PricingBasis } | null }`,
     `InvoicedParty { name: string; kind: 'holder' | 'patient' | 'payer' }` and `PricingBasis = { kind:
     'fixedPrice'; amount: number; own: boolean } | { kind: 'fixedRate'; perUnit: number;
     discountPercent?: number } | { kind: 'fixedDiscount'; percent: number } | { kind: 'rvg' }` (a
     fixed rate and a fixed discount are separate settings that can sit on one line: the price is BTM x
     the rate, less the discount, US-05.2.6, US-05.4.3, FT-05.2).
   - **`procedureStackView(procedure, ctx)`** with `ctx` holding the masters, the Booking, its List and
     its patient. `received` is `procedure.sourceTexts` in arrival order. `procedure` is null when no
     procedure is picked (D33), else the procedure list entry's name and RVG code from 19's masters
     (`general` from 19's marker). `contract` is null when the Procedure has no Contract (20's "Needs a
     Contract"), else the Contract's name, AA code, holder (18), `whoIsInvoicedFor` and
     `pricingBasisFor`.
   - **`whoIsInvoicedFor(procedure, ctx): InvoicedParty`**: one function that wraps 20's interim
     who-is-billed function (`billedPartyFor` in 20's plan) and only names the party (never a second
     derivation). Its doc comment says Phase 21 re-points it to the Contract holder's billable party or
     the payer on the Booking (US-11.2.2, AR-28 `who-gets-the-invoice`, AR-29 `billable-party`).
   - **`pricingBasisFor(procedure, ctx): PricingBasis`**: one function. Today it reads 19a's Contract
     line for the Procedure's procedure: a fixed price gives `fixedPrice` (`own` true on a first-party
     Contract), a fixed rate `fixedRate` (with `discountPercent` when the line also carries a fixed
     discount), a fixed discount alone `fixedDiscount`; No contract (RVG), a
     holder's plain RVG Contract with no line for this procedure (OQ-98's default, D32) and a blank
     procedure give `rvg`. Its doc comment says Phase 24 re-points it to the one price precedence
     (DM-50, AR-29 `price-precedence`) and that it shows the basis, never the computed fee.
   - **`procedureInvoiceWording(procedure, masters): string`**: the procedure list entry's name (a
     general procedure's plain name, D37), never a source text. With no procedure picked (possible
     until 21 blocks completion without one) it returns a neutral fallback, "Anaesthesia services",
     and its comment says so. The one place to change if AA settles the invoice-wording tension the
     other way.
   - **`procedureLabel(procedure, masters, ordinal)`**: the short label every list, total, history
     scope and sheet title uses: the procedure's name; else the latest source text in quotes; else
     "Procedure n".
   - **Tests** (`procedureStack.test.ts`): a Southern Cross fixed-price fixture gives the US-03.1.9
     "Contract summary" AC (name, Southern Cross as holder, who is invoiced, the fixed price); a
     first-party fixed price sets `own`; fixed rate, fixed discount, a fixed rate with a fixed
     discount (one `fixedRate` with `discountPercent`), No contract (RVG) and a plain RVG Contract give
     their kinds; a blank procedure gives `procedure: null` and keeps `received` ("Not
     matched yet"); two source texts come back in arrival order ("Fuller wording kept");
     `procedureInvoiceWording` ignores a distinctive source text ("RTK" on a "Total knee replacement"
     Procedure returns the latter) and returns the general procedure's name for a general pick;
     `procedureLabel`'s three fallbacks.

4. **The store: append only, verbatim.**
   - **`addSourceText(api, actor, procedureId, { text, channel, from? })`** (in `store/bookingActions.ts`
     or a new `store/sourceTextActions.ts`, exported from `store/index.ts`): appends one `SourceText`
     stamped with the demo clock (`clockISO`), audited `procedure.sourceText.add` with `after: { text,
     channel }`. Rights follow `editRefusal(actor, list)` (the same rule as `editProcedure`), so an
     integration, the office or the anaesthetist adds where they may edit. A text that is empty or only
     whitespace is refused ("Type the wording as given."); a text identical, character for character,
     to one the Procedure already holds is not added again and returns `ok` with `added: false` (a
     replayed message adds nothing). The text is stored exactly as given: no trim, no case change.
   - **`createBooking`**: `CreateBookingInput.operation` goes; it gains `sourceText?: { text; channel;
     from? }` beside 19's procedure input. The first Procedure's `sourceTexts` holds that text, verbatim,
     when it is not blank. The refusal becomes "Choose the procedure, or type it as given." when there
     is neither a procedure picked nor a non-blank text (a Booking with neither would show nothing in
     its stack). The `procedure.create` audit records `sourceText` and the procedure id instead of
     `description`.
   - `addProcedure` and the post-op addendum skeleton: `sourceTexts: []`.
   - Labels: `shared/audit/actionLabels.ts` gains `'procedure.sourceText.add'` ("Wording added as
     received"); `fieldLabels.ts` replaces `description` with `sourceTexts` ("Wording as received").
   - Tests (`store/sourceText.test.ts`): verbatim (leading spaces, "?conv", "+/-" and a misspelling
     survive); never overwritten (a second different text appends, the first is untouched); the exact
     duplicate adds nothing; blank refused; the anaesthetist refused on a SUBMITTED List, the office
     allowed per its rules; `editProcedure` refuses a `sourceTexts` patch; `createBooking` with only a
     procedure, only a text, both, and neither (refused).

5. **Every intake path writes the wording** (`store/integrationActions.ts` and the forms).
   - **Hospital feed create (S12):** pass `parsed.operation` as the source text, channel
     `hospitalFeed`, `from` the feed's hospital name, verbatim. No invented fallback: a message with no
     procedure text creates a Procedure with no source text (the stack says "No wording received").
     The Contract and procedure stay as 20 left this path (the office sets the Contract; D33's blank
     procedure). A comment notes Phase 33 moves hospital rows behind the matching screen.
   - **Hospital feed updates (S13 and S14):** when the parsed message carries procedure text that
     differs from every text on the Booking's first Procedure, append it (`addSourceText`, channel
     `hospitalFeed`) after the time change, in the same apply; identical text adds nothing. Never
     edit the procedure pick or any existing text. A cancelled Booking or a locked List parks as today.
   - **Surgeon PDF ingest (Future scope):** the create path passes `row.operation` as the source text,
     channel `surgeonPdf`; the update path appends with `addSourceText` instead of
     `editProcedure(..., { description })`.
   - The manual and phone-advice forms write it in item 11; the Future-scope photo demo's sample
     extraction prefills the "as given" field (channel `anaesthetist`), never a procedure.
   - Tests: S12 stores the SCH-7 text verbatim with `hospitalFeed`; MSG-STG-1012 (item 7) appends the
     hospital's fuller wording beside the rooms' text and replaying it adds nothing; a PDF update
     appends instead of overwriting, and a second identical PDF row adds nothing; FHIR-SX-2001 stores
     `Appointment.description`.

6. **The reader sweep.** Every Procedure-wording reader from item 1 moves to `procedureLabel` (short
   labels) or, in item 10, to the stack:
   - `BookingDetailBody` totals labels (~226) and history scope labels (~296); `ReviewScreen` history
     labels (~90); `RemoveProcedureSheet` (~41); the Booking detail headers on mobile, web and Admin
     ("{label} · {hospital}"); the List rows on mobile and web (`ListDetailScreen`, `ListDetailView`).
   - `EditProcedureSheet`: if 19 or 20 left its free-text "Operation" field, remove it; the sheet
     changes the procedure pick (19's picker) and the Contract (20's), and shows the source texts
     read-only at its top so the person changing the pick sees what was asked for. Its save no longer
     requires a description.
   - `BtmCaptureBlock`'s header keeps compiling with `procedureLabel` until item 10 replaces it.
   - `domain/seed/audit.ts`, `domain/billing/fixtures.ts` and every test that built a Procedure with
     `description`: move to `sourceTexts` (fixtures get `sourceTexts: []` unless the test is about
     wording).
   - Re-run the item 1 grep: no Procedure-wording `description` reader may remain; list any accepted
     leftover.

7. **The seed: every Procedure's wording, and AR-35's rows.**
   - **The migration rule.** `seed/bookings.ts` `ProcedureSpec.description` becomes `sourceText?:
     string` with an optional `channel` and `receivedAtISO`. Every seeded Procedure's former description
     becomes its first source text, channel mapped from its Booking's `source` (`hospitalDownload` to
     `hospitalDownload`, `surgeonPdf` to `surgeonPdf`, `admin` to `phone`, `anaesthetistAdHoc` (and
     `anaesthetistPhoto`, if 15b kept it) to `anaesthetist`; unset, or a `copy` 15b missed, to
     `unrecorded`), arrival time from fixed strings before `DEMO_TODAY` (the
     Booking's seeded create time where it has one). The same for `seed/history.ts`'s Procedures
     (their historical invoice lines keep their stored text: issued invoices never change). Additional
     procedures and addendum skeletons stay empty. The procedure picks 19 seeded do not change, with
     one recorded exception: Diane Foster's S14 target Booking (rows 26 and 27 below), whose pick is
     cleared so the fire-message beat shows a Booking still to match. It sits on a forward ACTIVE List,
     uncaptured and never invoiced, so no S1 to S5 figure moves; update the S14 assertions in
     `domain/integrations/integrations.test.ts` and `store/integrationActions.test.ts` that read its
     "Total hip replacement" wording.
   - **AR-35's wording**, in a new `domain/seed/sourceWording.ts`: a typed table of the rows used (row
     number, as received, channel, the procedure list entry from 19's seed, or none), headed by a
     comment: "AI-made, illustrative source wording, not from AA: AR-35, notes/2026-10-08-procedure-
     picker-and-source-text.md, 'Illustrative source wording'. RVG codes as printed in the NZSA RVG
     2021; only WLE MM, RTK, blephs, wide local excision, right total knee and row 27 come from AA's
     meeting." Map each row to its procedure and RVG code from Phase 19's seed; where 19 has no entry
     for a row's procedure, use the group's general procedure (D37) and never add procedure-list
     entries here.
   - **Placement (default; adjust only within the constraints below and record each move):**

     | AR-35 row(s) | As received (channel) | Where | Procedure shown | Why |
     |---|---|---|---|---|
     | 14 | `lap appy ?conv to open` (hospital feed) | MSG-STG-1001's SCH-7 description, so Sarah Mitchell's S1 Booking arrives with it on Dr Souter's Tue 28 Jul AM List | none until she picks Appendicectomy in S1 Beat 3 (as 20 left the feed path) | S1's arrival shows hospital shorthand needing an expert ("may convert to open"). AR-35 lists the row as email: our reuse on a feed, logged |
     | 6, 8 | `L knee scope + partial menisectomy` (rooms PDF); `ORIF # R dist radius` (email) | the 07:45 knee arthroscopy and 11:15 wrist ORIF on that same S1 List | as 19 seeded them | S1 Beat 1's "three booked cases" read as the rooms sent them; the 09:45 shoulder case keeps its migrated wording unless 19 seeded it as a rotator cuff repair (row 10) |
     | 1 then 2 | `RTK` (rooms PDF, earlier), then `right total knee` (hospital download, later) | a new Booking on Dr Souter's Tue 4 Aug AM St George's List (pinned) | Total knee replacement · LL4 (19 drops the trailing side from procedure names; the side stays in the wording) | the same Booking from two sources (US-03.1.9 "Fuller wording kept") |
     | 26, then 27 on firing | `WLE MM` (rooms PDF); MSG-STG-1012 brings `WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC` (hospital feed) | Diane Foster's S14 target Booking (Tue 4 Aug AM, 11:00), re-seeded from her total hip to this wording, with no procedure picked and No contract (RVG) | Procedure to choose (the site is not given); after firing, the office can see it is the left shoulder (T1) | the fire-message beat. AR-35 lists 26 and 27 as separate rows: pairing them as one Booking's rooms and hospital wording is our reading, logged |
     | 15, 17, 21, 34, 35 | `gastro/colon`, `blephs` (rooms PDF); `hystero D&C` (rooms PDF); `L3-5 decomp + fusion` (email); `EUA +/- cysto +/- biopsy` (rooms PDF) | new Bookings on one or two of Dr Souter's forward ACTIVE Lists already in `pinnedListIds` (Thu 30 Jul AM or Tue 28 Jul PM; check no S12 test counts their Bookings) | 15, 17 and 35 with no procedure picked (sedation or GA not said; no guide example names a blepharoplasty; the site is unclear); 21 Hysteroscopy and D+C (P1); 34 Lumbar decompression and fusion (S9b, with 19b's locked P1) | the expert rows, on screens the presenter can open on mobile, web and the Admin Day |
     | 3, 11, 13, 25 | `L TKJR`, `lap chole +/- IOC`, `R inguinal hernia mesh` (rooms PDF); `TURP` (hospital download) | the existing Left total knee replacement (Souter Tue 21 AM), Wiremu Tane's lap chole and the Chen inguinal hernia (Souter Tue 21 PM), and one Morrison Mon 20 TURP | as seeded | today's and S3's Lists read as received; procedure picks and figures unchanged |

     **Constraints.** No S1 to S5 figure, count or scripted name changes (S1 Beat 1 still reads three
     booked cases at 07:45, 09:45 and 11:15, and Sarah Mitchell still arrives as the fourth); no new RNG
     draw, and the filler's draws unchanged; **new Bookings are created after every existing seeded
     Booking, so no existing `BK`, `P`, audit or counter id shifts** (recipes and the guide name them);
     new Bookings reuse existing seeded patients with no other Booking that day; every new Booking has
     a Contract by 20's rules (No contract (RVG) where nothing fits); the "RTK" Booking takes a free
     time on Dr Souter's Tue 4 Aug AM List clear of the S13, S14 and S15 targets (08:30, 11:00, 12:00)
     and of MSG-STG-1012's new 12:15, and any test that counts that List's Bookings is updated. Keep `MSG-STG-1001` and
     `MSG-STG-1012` parseable: change only the SCH-7 description component (keep the code component
     the parser expects), and keep MSG-STG-1012's time change and note.
   - **`PERSIST_VERSION`**: bump by one from what 20 left, with a comment line: "Procedure source
     wording (US-02.5.7): `Procedure.description` replaced by append-only `sourceTexts`; AR-35's
     illustrative wording seeded; MSG-STG-1001 and MSG-STG-1012 reworded".
   - **Seed tests** (`domain/seed/sourceWording.test.ts`): every seeded Procedure that had a
     description has exactly that text as its first source text; the AR-35 rows sit on the Bookings
     the placement names (by patient and List, not by a new id), with their channels; the two-source
     Booking has "RTK" then "right total knee" in that order with the hospital's later; Foster's
     Booking holds only "WLE MM" before firing; no seeded Procedure has a blank source text; existing
     ids are unchanged (compare a fixed list of S1 to S5 Booking ids and their patients to
     the pre-phase seed); the seed is deterministic (two builds deep-equal).

8. **Session 1 close.** Tests for items 2 to 7 as listed, plus a parity check: the fee of every
   seeded Procedure and every seeded invoice total is unchanged from the baseline (reuse 18's parity
   harness), with Diane Foster's S14 target Procedure the one listed exclusion (its pick is cleared on
   purpose, item 7) and the new AR-35 Bookings absent from the baseline. `npm run build`, `npm run build:pwa`, `npx vitest run` green. The app runs, with labels
   from `procedureLabel` and no stack yet.

9. **The `ProcedureStack` component** (`shared/booking/ProcedureStack.tsx`, exported from
   `shared/booking/index.ts`; imports only `domain`, `theme` and `shared/format`, so `pwaPurity` holds).
   Invoke the frontend-design skill first.
   - a. **Props:** `view: ProcedureStackView`, `density: 'full' | 'compact'`, optional `heading`
     ("Procedure 2" on a multi-procedure Booking) and an `actions` slot (Edit, Remove, Add wording as
     given) the caller supplies. It renders the view; it derives nothing.
   - b. **Full density** (Booking screens): three labelled parts in order, top to bottom, joined so
     they read as one Procedure (a hairline rail or connected rows, not three cards):
     - **As received:** each source text verbatim in mono, quoted, with a mist meta line ("Surgeon's
       rooms PDF · Tue 14 Jul" or "Later · St George's feed · Mon 20 Jul"); earliest first, later
       fuller wording below it; "No wording received" in mist when empty.
     - **Procedure:** the name, then its RVG code in mono; "General procedure for H3" as a small neutral
       tag on a general pick (D37, provisional); "Procedure to choose" when null, in mist with a
       neutral still-to-choose treatment.
     - **Contract:** the name with the AA code in mono, "Held by {holder}" (and "own price list" on a
       first-party Contract), "Invoiced: {party}", and the pricing basis with its figure, formatted
       by `formatPricingBasis` (item 14): "Fixed $2,400", "Fixed $2,400 · own price", "$125.00 per
       unit", "10% off RVG", "RVG"; "Contract to choose" when null.
     Long wording wraps (row 27 is long); nothing truncates in full density. At 375 px the parts stay
     one column and the capture controls below keep their spacing.
   - c. **Compact density** (Review cells, drawer rows): the same three parts as three short lines,
     each single-line with an ellipsis and the full text in a `title`, the latest source text only
     with "+1 earlier" when there are more.
   - d. **Hooks:** `data-shot="procedure-stack"` on the root, `procedure-stack-received`,
     `procedure-stack-procedure`, and the Contract part keeps **`data-shot="procedure-contract"`**
     (US-03.1.2's recipe highlights it). Semantics: an ordered list with each part's label read before
     its value.
   - e. **"Add wording as given"** (an action in the slot, teal text link, shown where the actor may
     edit the Procedure): opens a small sheet (`shared/flows/AddWordingSheet.tsx`, bottom sheet on
     mobile, dialog on web and Admin through the surface seam) with one text field and, for the
     office, a "Told by" choice of Phone or Email (default Phone); the anaesthetist's channel is
     `anaesthetist`. It calls `addSourceText`; the new text appears below the earlier ones. This is
     the manual counterpart of a later hospital update; Phase 35 reuses it for the office's amend
     flow (US-02.3.1). Cut this first if session 2 runs long.
   - f. **Component tests** (`ProcedureStack.test.tsx`): the three parts in order with their labels;
     the "Not matched yet" view; two texts in order; compact density truncates with a title; the
     Contract part carries `procedure-contract`; no en or em dash in any rendered string.

10. **Place the stack on every booking screen.**
    - **Booking detail, all three apps and the PWA** (`BtmCaptureBlock`, rendered by the shared
      `BookingDetailBody`): the header's description and the read-only context line give way to the
      stack in full density, with "PROCEDURE n" as its heading on a multi-procedure Booking and Edit
      and Remove in its actions slot. Keep `data-testid="procedure-header"` on the stack's heading row
      and render the actions slot inside that row (recipes and specs wait on it, and US-03.4.1's
      recipe clicks `[data-testid=procedure-header] >> text="Edit"`). The capture cards below are unchanged. On the office surface,
      where 20's `OfficeBillingSetup` repeats the Contract's name or holder, drop those rows in favour
      of the stack and keep its edit action; it keeps whatever the stack does not show (references,
      billing lines).
    - **Admin List drawer** (`ListDrawer`'s Bookings section): each row keeps the patient name and
      state, and gains the compact stack for each of its Procedures beneath.
    - **Admin Review** (`ReviewScreen`): a "Procedures" column replaces the "Contract" and "Code"
      columns (and any route column 20 left), holding the compact stack for **every** Procedure of the
      Booking, not only the primary; the Patient cell keeps name and NHI and drops the procedure
      subline. Times, B · T · M, Units, Fee and Flags stay. Phase 21 adds the payer and the warnings.
    - **List rows** on mobile and web stay one line, from `procedureLabel` (item 6); the stack is for
      the Booking screens, per US-03.1.9's reading of "every booking screen".
    - Do not add the stack to the matching screen: Phase 33 builds that screen and adds it.

11. **"As given" on manual entry** (`shared/flows/ManualBookingForm.tsx`, shared by mobile and web Add
    a booking and Admin's phone advice).
    - Add an optional **"As given"** text field (`data-shot="as-given"`) in the form's procedure
      section, under 19's picker: helper text for the anaesthetist "The procedure as written on the
      hospital's list", for the office "The procedure as it was told or written to you", and for the
      office the "Told by" Phone or Email choice (default Phone, so phone advice needs no extra tap).
      If 19 kept a free-text "Operation" field on the form, this field replaces it; the code-description
      prefill into it (~106) goes, because a picked procedure is not wording received. The demo
      empty-NHI lookup prefill (`emptyLookupPrefill.operation`, fed by `AddBookingFlow`'s
      `manualEmptyLookupPrefill`; S2 Beat 2's "the lookup fills the complete booking") fills "As given"
      instead (what the caller said), beside whatever procedure pick 19 and 20 left that prefill.
    - Save passes `sourceText` (channel `anaesthetist`, or `phone` or `email` for the office, `from`
      the actor's name) only when the field is not blank, stored as typed. The form saves with a
      procedure picked and no wording, or with wording and no procedure (D33), never with neither
      ("Choose the procedure, or type it as given.").
    - Component test: an anaesthetist save stores the text verbatim with `anaesthetist`; an office save
      with Email stores `email`; blank stores nothing; neither refuses.

12. **The invoice prints the procedure's own wording** (`apps/admin/screens/InvoiceDocument.tsx`).
    In the lines table, each Procedure's lines sit under one heading row reading
    `procedureInvoiceWording` (the procedure's name, a general procedure's plain name); fee line text,
    amounts, totals and Xero records are unchanged (Phase 22 owns the layout and may restyle the
    heading). Add a test over the seeded billing run: no invoice line, Xero line or InvoiceDocument
    heading contains any seeded source text that differs from its Procedure's own wording (the AR-35
    rows' shorthand included).

13. **Re-point "Fire hospital message"** (`shared/demoTriggers/registry.ts`; no new entry).
    - Its `routes` already hold the mobile Booking route (`MOBILE_LISTS` includes
      `/mobile/lists/:listId/bookings/:bookingId`); add the web (`/web/lists/:listId/bookings/:bookingId`)
      and Admin (`/admin/day/:dateISO/bookings/:bookingId`) Booking routes, keeping its Future-scope
      badge and surfaces (bar and PWA).
    - `defaultChoice` picks, when the Booking in the URL (`ctx.params.bookingId`) has a
      `correlationRef`, the canned modify message whose `correlationAppointmentId` matches it (so
      Diane Foster's Booking defaults to MSG-STG-1012); otherwise its current default (the
      simulator's published selection, else `DEFAULT_MESSAGE_ID`). A pure helper in
      `shared/demoTriggers` maps the Booking to its message, with a test.
    - Its success message, when the apply added wording: "Fired MSG-STG-1012: the hospital's wording
      was added beside the rooms' text." Nothing is added to the Control Panel page; its index lists
      the new routes under the entry.

14. **Labels and copy** (`shared/format.ts`): `SOURCE_TEXT_CHANNEL_LABELS` ("Hospital download",
    "Hospital feed", "Surgeon's rooms PDF", "Email", "Phone", "Anaesthetist", "Source not recorded")
    and `formatPricingBasis(basis)` (whole dollars without cents for fixed prices, as "Fixed $2,400";
    rates with cents, "$125.00 per unit", and "$125.00 per unit · 10% off" when a discount sits on
    the same line; "10% off RVG"; "RVG"). App copy says "As received", "Procedure", "Contract",
    "As given", "Invoiced", "Held by", never "Card", never "slot", never "DRAFT" for an assigned List,
    and no en or em dash anywhere. The prototype README's Booking and Procedure section names
    `sourceTexts`, `addSourceText` and the stack.

15. **Demo guide, Control Panel scenario text and ATLAS** (the same session; see Demo guide updates and
    Catalogue screenshots).

16. **Finish.** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green;
    the item 1 grep clean; then the manual test checklist, the review pass, the catalogue screenshot
    step and the PROGRESS entry.

## Demo triggers

No new trigger: the wording and the stack demo through normal use.

1. **None needed for the stack.** After Reset, Dr Souter's Lists and the Admin Day carry AR-35's
   wording: S1's Tue 28 Jul AM cases, the two-source "RTK" / "right total knee" Booking on Tue 4 Aug
   AM, Foster's "WLE MM" on the same List, the expert rows on Dr Souter's forward Lists, and the
   reworded Bookings on Tue 21 and Mon 20.
2. **"Fire hospital message" re-pointed** (Phase 14's entry, Future-scope badge, bar and PWA): now also
   on the mobile, web and Admin Booking routes, defaulting to the message addressed to the Booking on
   screen. On Diane Foster's Booking it fires MSG-STG-1012, which appends the hospital's fuller wording
   beside the rooms' "WLE MM"; firing it again adds nothing. Disabled state unchanged. The PWA sheet
   shows it on the Booking screen too, so a handset demo needs no office stand-in.
3. **"As given"** on mobile and web Add a booking and Admin's Book (phone advice), and **"Add wording
   as given"** on a Booking: product UI, not triggers.

PWA parity: nothing in this phase waits on the office or a colleague; the re-pointed trigger covers the
backend event on the handset.

## Out of scope

- **The matching screen** and source wording on its rows (US-02.1.2, FT-02.5): Phase 33, which adds
  this phase's stack to each row and moves hospital wording behind approval.
- **The payer on the Booking** and what "who is invoiced" returns after 20's interim: Phase 21
  (re-points `whoIsInvoicedFor`). The review's payer column, warnings and the general-procedure review
  flag (D37's second half): 21.
- **The one price precedence**, the price source and the anaesthetist's typed price: Phase 24
  (re-points `pricingBasisFor`). The pricing snapshot: 25.
- **Invoice layout** beyond one heading row per Procedure: Phase 22.
- **The office's amend flow and change history** (US-02.3.1, US-02.5.5): Phase 35, which reuses
  `addSourceText` and the "as given" field.
- **Primary Procedure** ("Make primary"): Phase 23. Until then intake appends to the Booking's first
  Procedure.
- **Hiding Contract detail from the anaesthetist:** not done; 43a simplifies the anaesthetist screens
  while keeping the stack.
- Editing AR-35, AR-28, AR-29 or AR-30, registering a region on AR-35, or any catalogue requirement's
  text or status.

## Manual test checklist

The agent runs every item itself in the running app (root `npm run dev`; Playwright or the `/run`
skill; handset checks in the emulated mobile viewport) and reports each pass or fail with its evidence;
none is handed to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Mobile → Dr Souter → Tue 4 Aug AM → the two-source Booking: the stack reads, top to
      bottom, As received "RTK" (Surgeon's rooms PDF, earlier) and "right total knee" (Hospital
      download, later); Procedure "Total knee replacement" with LL4; Contract with its name,
      holder, who is invoiced and pricing basis. Readable at 375 px; the capture cards below are
      uncrowded.
- [ ] The same Booking on web and in Admin (`/admin/day/2026-08-04/bookings/<id>`): the same three
      parts in the same order; on Admin, `OfficeBillingSetup` does not repeat the Contract's name or
      holder.
- [ ] Diane Foster's Booking (Tue 4 Aug AM, 11:00) on mobile: "WLE MM", "Procedure to choose".
      Demo actions → Fire hospital message defaults to MSG-STG-1012 → Run: the hospital's long wording
      appears below "WLE MM", the earlier text untouched, the time and note updated as before. Fire it
      again: nothing added. Same on the PWA sheet (`npm run dev:pwa`).
- [ ] S1 as scripted: Tue 28 Jul AM shows three booked cases at 07:45, 09:45 and 11:15 with the rooms'
      wording on two of them; Fire hospital message → MSG-STG-1001 → Sarah Mitchell arrives fourth with
      "lap appy ?conv to open" (Hospital feed) and Procedure to choose; S1 Beat 3's pick fills the
      Procedure part; the List counts read as the guide says.
- [ ] The expert rows: each of rows 15, 17, 21, 34 and 35 shows on its Booking on mobile, web and the
      Admin Day; 15, 17 and 35 show "Procedure to choose"; 34 shows S9b with its locked P1.
- [ ] Mobile and web Add a booking on Dr Souter's Tue 21 PM List: save with "As given" typed as
      " L TKJR " (spaces kept) and a procedure picked: the stack shows the text exactly as typed with
      "Anaesthetist"; save with neither: refused with "Choose the procedure, or type it as given.".
- [ ] Admin S2 phone advice (Dr Sharma's Tue 21 PM Free List → Book (phone advice)): the "As given"
      field with Told by Phone, filled by the empty-NHI Look up; the saved Booking's stack shows that
      wording with "Phone".
- [ ] "Add wording as given" on an ACTIVE Booking as the anaesthetist adds a text below the earlier
      one; on a SUBMITTED List it is not offered to the anaesthetist; the office can add with Email.
- [ ] Edit on a Procedure changes the procedure pick and the stack's second part; the source texts do
      not change and have no edit control anywhere.
- [ ] Admin Review on a submitted List with a multi-procedure Booking: the Procedures column shows a
      compact stack for every Procedure; the Admin Day List drawer rows show compact stacks.
- [ ] Authorise Dr Morrison's submitted Mon 20 List in Admin Review (S2 Beat 4's path), then open the
      invoice for the TURP seeded with the hospital's "TURP" wording, and any seeded invoice whose
      Procedure carries rooms' shorthand: the heading prints the procedure's own name, never the source
      text; amounts unchanged from the baseline.
- [ ] After Reset, S1 to S5 run as scripted in the patched guide with every figure unchanged; the Data
      Inspector shows `sourceTexts` and no `description` on a Procedure; History shows "Wording added
      as received" with the text.
- [ ] No new string has an en or em dash; teal is the only action colour; no crimson in the stack;
      no "Card", "slot" or "DRAFT" for an assigned List in new copy.
- [ ] Catalogue screenshots: the covered recipes created or updated, the broken ones re-pointed, a full
      `npm run capture` with no failed recipe and no story without a recipe, the changed shots checked
      by eye, `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

Same session, in `docs/demo-guide/` and the same passages of `master-demo-guide.html`:

- **`03-demo-script.md` S1 Beat 1:** the Expected line adds that Sarah Mitchell's Booking shows the
  hospital's wording as received ("lap appy ?conv to open") with its procedure still to choose; the
  "read its three booked cases" click names the rooms' wording on two of them. Times and counts stay.
- **S1 Beat 2 ("the Booking fills over the days"):** add an optional aside: open Dr Souter's Tue 4 Aug
  AM List → the "RTK" Booking: "The rooms sent 'RTK'; the hospital's download later said 'right total
  knee'. Both are kept as received, above the procedure we matched and its Contract: who holds it, who
  is invoiced and how it is priced." Optionally, on Diane Foster's Booking, Demo actions → Fire hospital
  message (MSG-STG-1012) to add the hospital's fuller wording live (Future-scope badge: HL7 is
  illustrative).
- **S1 Beat 3:** the capture step reads the stack first: "She sees what the hospital wrote, picks the
  procedure, and the Contract part shows who is invoiced and the pricing basis; the running fee stays
  hidden." Keep "sees no running fee" in "Worth pointing at".
- **S2 Beat 2 (a phone-advice booking):** the Expected line says the lookup also fills "As given"
  (Told by Phone) and the saved Booking's stack shows that wording with "Phone" above the procedure.
- **`04-presenter-cheat-sheet.md`:** a "Procedure stack" line under the anaesthetist and office
  features: as received, procedure and RVG code, Contract (name, holder, invoiced, basis); the
  wording is kept verbatim and never overwritten; the invoice prints the procedure's own wording. A
  discovery-point line: the invoice wording (Nick and Rob are happy to print the rooms' text; we print
  the procedure's name) and the general procedure's invoice name (OQ-103).
- **`02-workflows-and-handoffs.md`:** the intake section says each Booking keeps the wording as
  received from every channel, with "as given" on manual entry; the hospital-update paragraph says an
  update adds wording beside the old, never replacing it.
- **`01-personas-and-responsibilities.md`:** the anaesthetist's "add a missing Booking" item mentions
  "as given"; the office's phone-advice item likewise.
- **`master-demo-guide.html`:** the S1 Beat 1 to 3 cards (~840-860) and the S2 Beat 2 card, the cheat-sheet, workflows and
  personas sections mirroring the edits above.
- **`DemoControlPanel.tsx`:** check the S1 scenario text for "operation description" wording and
  patch it to match.
- Any guide line that names AR-35's wording calls it illustrative demo data, never AA's.

Not a milestone phase: no full consistency read is required.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 20a` first; at plan time it lists the four
stories below (US-02.5.7 and US-03.1.9 have no recipe). Recipes and images are never touched while the
plan is updated; this phase's build does it.

**Covered items.**

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) Keep the procedure text as received | none | create, `captured`. Shot `source-wording` on web, mobile and admin, starting on Diane Foster's Booking (Tue 4 Aug AM): state `rooms` (only "WLE MM", highlight `[data-shot=procedure-stack-received]`, caption "The procedure text kept exactly as the rooms sent it"), state `hospital-update` (a `trigger` step firing MSG-STG-1012 on mobile and admin; on the PWA, the Demo sheet; caption "A later hospital update is added beside it, never overwriting it"). A second shot `source-wording-two-sources` on the "RTK" Booking on web, caption "The rooms' and the hospital's wording for the same Booking" |
| [US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) Source wording, procedure and Contract shown together | none | create, `partial`, `absentReason` "The hospital matching screen does not exist yet: Phase 33 adds the stack to each row." Shot `procedure-stack` on mobile, web and admin on the "RTK" Booking (highlight `[data-shot=procedure-stack]`, caption "As received, then the procedure and RVG code, then the Contract"); state `not-matched` on a Booking with no procedure picked (row 17's "blephs"; caption "Not matched yet: the wording shows, the procedure is still to choose"); shot `review-stack` on Admin Review of a submitted List with a multi-procedure Booking (caption "Office review shows the stack for every Procedure") |
| [US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md) See the Contract on each Procedure | partial · procedure-contract on web and mobile (`BK0009`), caption "Contract shown on the procedure" (stale: names only the Contract), `absentReason` "not on the List view before the session" | `captured`, no `absentReason`. Keep the shot name `procedure-contract` (the hook moved onto the stack's Contract part): state `before` on BK0009 (an ACTIVE List before the session), state `after` on a Booking of Dr Souter's SUBMITTED Mon 20 List on web (mobile only if the main view reaches it; 38a builds the archive). Caption "The Contract on each Procedure: name, holder, who is invoiced and the pricing basis with its figure" |
| [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking manually | captured · add-card[choose,manual] on web and mobile at `60e2d1e` (15b drops `choose` and "Enter manually"), `manual` caption "Manual entry of the patient and operation" | `captured`. Keep `add-card`; the `manual` state stays; add state `as-given` that fills "As given" with "RTK" and highlights `[data-shot=as-given]`, caption "The procedure as written on the hospital's list goes in As given (optional)". Re-caption `manual` "Add a Booking to my List: the patient, the procedure, and the wording as given" |

**Recipes this phase breaks or makes untrue** (keep shot names; run `node scripts/capture.ts --dry`
in `requirements-board/` to find any this list misses: every step or highlight on
`procedure-header`, `procedure-contract`, `[data-testid=procedure-header] + div`, "Operation
description", the Review table's "Contract" or "Code" columns):

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) | partial · web and mobile highlight `[data-testid=procedure-header] + div` (the old context line); Phase 20 re-captions it to No contract (RVG) first, may rename the shots (for example `no-contract-first`) and adds a `billed` state on `[data-shot=procedure-contract]` | under whatever shot names 20 left, re-point every web and mobile Booking-detail highlight still on `[data-testid=procedure-header] + div` to `[data-shot=procedure-contract]`; the `billed` state now shows the stack's "Invoiced" line; 20's captions stay |
| [US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) | partial · `added` highlights `procedure-header >> nth=1` and `procedure-contract >> nth=1` | keep both hooks (they survive on the stack); re-check the second Procedure's stack shows "No wording received" and "Procedure to choose"; caption unchanged |
| [US-03.1.1](../../../../requirements-board/requirements/stories/US-03.1.1.md), [US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) | US-03.1.1 waits on `[data-testid=procedure-header]`; US-03.4.1 clicks `[data-testid=procedure-header] >> text="Edit"` | hold if the testid and the Edit action stay on the stack's heading row (item 10); fix only what `--dry` fails; captions are 20's |
| [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) | captured · review-contracts, caption "Office review of each Booking's route, Contract, codes and flags" | re-caption `review-contracts` "Office review of each Procedure's wording, procedure and Contract, with the flags" (21 re-captions again for the payer and warnings). The `correct-contract` shot's `setup` highlight finds the office block by its "Office billing setup" text and "Edit billing setup" button: keep both on the slimmed `OfficeBillingSetup` (item 10) or re-point; its captions are 20's |
| [US-11.1.3](../../../../requirements-board/requirements/stories/US-11.1.3.md) | `linked` fills `[placeholder="Operation description"]` on web and mobile (unless 19 or 20 already changed it) | fill the picker or "As given" as the form now asks; captions unchanged ([US-14.4.1](../../../../requirements-board/requirements/stories/US-14.4.1.md)'s recipe opens the same form but fills no operation: re-check it with `--dry` only) |
| [US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md) | partial · mobile capture on BK0009 | re-take; the caption stays (the stack sits above the large capture controls) |

**ATLAS.md.** "Existing hooks": add `procedure-stack`, `procedure-stack-received`,
`procedure-stack-procedure`, `as-given`, and note `procedure-contract` now marks the stack's Contract
part. "Seed data worth shooting": the two-source "RTK" Booking (its id), Foster's "WLE MM" Booking
before and after MSG-STG-1012, the expert rows and their Lists, Sarah Mitchell's arrival wording, and a
line that AR-35's wording is AI-made demo data. "Overlays that need clicks": "Add wording as given",
the "As given" field. "Demo control panel and Demo actions": Fire hospital message now also on Booking
routes with a per-Booking default.

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm
run shots` are green, and before writing the PROGRESS entry, run the standard adversarial
review-and-fix pass (PROGRESS convention 18): independent Opus review subagents for **quality**,
**bugs/correctness** and **plan adherence**. This session verifies every finding against the catalogue
and the code, fixes the confirmed ones (with a test where a bug had none), re-greens and records the
pass. Do not re-raise anything settled in the Decisions log, except the 2026-09-28 ruling this phase
supersedes in part.

**Steer this phase's reviewers at:**
- **Append-only, verbatim.** No path edits, trims, reorders or removes a source text: `ProcedurePatch`
  excludes it, `editProcedure` refuses it, every intake path appends through `addSourceText` or the
  create input, and an identical replay adds nothing. A whitespace-only text is never stored.
- **Every intake path writes it:** S12, S13, S14, PDF create and update, mobile and web manual, Admin
  phone advice, the Future-scope photo prefill; and none invents a fallback wording.
- **One place.** The stack's content, `whoIsInvoicedFor`, `pricingBasisFor`, `procedureInvoiceWording`
  and `procedureLabel` live only in `domain/billing/procedureStack.ts`; the component derives nothing;
  no screen re-derives the payer or the basis; `whoIsInvoicedFor` wraps 20's function rather than
  copying it. A v5 design change would touch that module and the seed only.
- **The invoice** never shows a source text (the test over the seeded run); fee lines, totals and
  Xero records are byte-for-byte unchanged.
- **No figure moved:** the parity check holds; S1 to S5 counts and names hold; no existing seeded id
  shifted.
- **The seed:** AR-35's rows placed as the table says (or the moves recorded), labelled AI-made in
  comments, mapped to 19's procedures without adding entries; deterministic; `PERSIST_VERSION` bumped.
- **The stack's UI:** the order is always as received, procedure, Contract; empty parts say still to
  choose in neutral, never a status colour; 375 px is uncrowded; compact density truncates with a
  title; the Contract part keeps `procedure-contract`; `pwaPurity` holds; teal-only actions; no en or
  em dashes.
- **The trigger:** Future-scope badge kept, per-Booking default correct, nothing added to the Control
  Panel page.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"):
  - The stack on the Booking (Mobile, Web and Admin: Dr Souter's Tue 4 Aug AM "RTK" Booking) and in
    Admin Review; whether the Contract part reads clearly to an anaesthetist.
  - The anaesthetist now sees the Contract's name, holder, who is invoiced and pricing basis (US-03.1.2
    and US-03.1.9 Confirmed) against US-15.0.1's Proposed note "see none of the Contract complexity":
    built the Confirmed way; the running fee stays hidden.
  - The invoice prints the procedure's own wording, not the rooms' text (Nick and Rob reportedly
    happy with the rooms' text): one function to flip if AA decides otherwise.
  - OQ-103 (D37), provisional: a general procedure prints its plain name and is tagged in the stack.
  - AR-35's rows reused on channels its table did not name (row 14 on a hospital feed) and rows 26
    and 27 paired as one Booking's rooms and hospital wording; any placement moved from the table.
  - "Add wording as given" on an existing Booking (built here, ahead of 35's amend flow), or cut.
- **Status.** A catch-up status row for Phase 20a, DONE at the end.
- **Phase entry:** the drift-check result against `60e2d1e` and the names reused from 18 to 20; the
  inventory grep before and after with any accepted leftover; the placement table as built with each
  new Booking's id; the `PERSIST_VERSION` bump; the parity check; the checklist item by item with
  evidence; Vitest and Playwright counts before and after; the review pass.
- **Decisions log:**
  - **Procedure source wording** (US-02.5.7, DM-51): `Procedure.description` is replaced by
    append-only `sourceTexts` with channel and arrival time, written by every intake path, never
    edited; the procedure's name comes from the procedure list; hospital and PDF updates append
    instead of overwriting (superseding the Phase 11 PDF ingest "UPDATES it (scheduled time +
    operation)" behaviour for the operation half).
  - **The three-part stack** (US-03.1.9, US-03.1.2): one `ProcedureStack` on every Booking screen in
    both apps and in Admin Review and the List drawer, reading one view from
    `domain/billing/procedureStack.ts`; "who is invoiced" and "pricing basis" are one function each,
    for 21 and 24 to re-point.
  - Supersede in part **2026-09-28 "Anaesthetist Card shows no calculation"**: the running fee and the
    Booking total stay hidden from the anaesthetist, but the stack shows the Contract's pricing basis
    and its figure (US-03.1.2, US-03.1.9 Confirmed; US-15.0.1's Proposed note yields).
  - **Invoice wording:** the procedure's own wording, never the source text; a general procedure's
    plain name (OQ-103 default, provisional).
- **Catalogue screenshots:** the recipes created (US-02.5.7, US-03.1.9) and changed (US-03.1.2,
  US-02.4.1, and the broken ones re-pointed), and the `REPORT.md` counts before and after (captured,
  partial, absent, failed).
- **Handoff notes:** Phase 21 re-points `whoIsInvoicedFor` to the payer on the Booking and adds the
  payer and warnings to Review's stack column (and D37's general-procedure review flag); Phase 23's
  primary Procedure becomes the intake target for appended wording; Phase 24 re-points
  `pricingBasisFor` to the price precedence; Phase 33 puts `ProcedureStack` on every matching row and
  writes source texts from the hospital download through `addSourceText`; Phase 35 reuses
  `addSourceText` and the "as given" field for the office's amend flow; Phase 43's generator builds
  `sourceTexts` through the same types; Phase 43a keeps the stack on the anaesthetist screens; Phase 44
  rewrites S1 around the wording, the match and the office's Contract choice.
