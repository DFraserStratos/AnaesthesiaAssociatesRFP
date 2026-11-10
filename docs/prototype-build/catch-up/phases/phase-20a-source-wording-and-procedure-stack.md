# Phase 20a · Procedure text, the invoice description and the Contract on each Procedure

**Requirements covered:**
[US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) The hospital's procedure text replaces the rooms' (Verify, retitled 5 November; graded **Contradicts**: today's one editable `Procedure.description` is trimmed on create, overwritten by PDF updates and Edit procedure, and no path lets the hospital's text replace the rooms' with the original kept in the change history) ·
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) Booking descriptions and Contract shown together (Verify; graded Partial; the step rail is decided, D7, so the Contract is picked first) ·
[US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md) See the Contract on each Procedure (graded Partial: no holder, who is invoiced or pricing basis with its figure) ·
[US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking manually (graded Partial: hand entry is not kept as given) ·
[US-08.4.6](../../../../requirements-board/requirements/stories/US-08.4.6.md) Invoice description on each Procedure (Verify, 5 November; **Missing**) ·
[DM-51](../analysis/domain-model-delta.md#dm-51) one procedure text per Procedure, the hospital's replacing the rooms' with the replaced text in the change history, plus a separate invoice description set by defaults that an admin's edit always overrides ·
[RV-01](../analysis/reverse-check.md#rv-01-attachments-on-bookings-and-lists-are-fully-built) attachments on Bookings and Lists built though [US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md) is **Retired**: remove.
**Leans on, not covered:**
[US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md) (the change history is append-only: the replaced text is written as an entry, never a second field) and
[US-02.5.8](../../../../requirements-board/requirements/stories/US-02.5.8.md) (Phase 35's history screen, which shows the replaced text),
[US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md) (Phase 35's amend flow),
[US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) and FT-02.5 (Phase 33's: the matching screen applies a row's text through this phase's replace helper and shows this phase's component),
[US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) (Phase 21a's office review; this phase puts the component into Admin Review),
[US-04.2.18](../../../../requirements-board/requirements/stories/US-04.2.18.md) (Phase 19a's Contract invoice description, the top default of the invoice description, and the default RVG code),
[US-04.3.8](../../../../requirements-board/requirements/stories/US-04.3.8.md) (Phase 20's decided step rail),
[US-08.4.1](../../../../requirements-board/requirements/stories/US-08.4.1.md) (Phase 22's layout, which prints the invoice description on each line),
[US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) (Phases 19 and 20: the RVG code),
[US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md) (Phase 43a's; its Proposed note "anaesthetists see none of the Contract complexity" yields to US-03.1.2 and US-03.1.9 here, see Goal) and
[OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md) (which field carries the text in each hospital's download or feed: unknown; the simulated feeds' SCH-7 and `Appointment.description` stand in).
**Answered, built as answered (no label):** [OQ-103](../../../../requirements-board/requirements/questions/OQ-103.md)
(**D37**, extended 5 November: the invoice description's order of defaults, the Contract's invoice description on top, never the RVG code, admin-editable as free text) and
[OQ-130](../../../../requirements-board/requirements/questions/OQ-130.md) (**D73**, answered 5 November, Donald's ruling for the build: an admin's edit to the invoice description always wins, neither a late hospital text nor a Contract chosen or changed replaces it).
**Depends on:** Phase 20, done (one Contract per Procedure, mandatory at setup, "Needs an invoice destination", the decided step rail, the optional RVG code, `enteredPrice` on an open price and 20's interim `billedPartyFor`), and
through it 19 (RVG groups, the optional RVG code), 19a (Contract `invoiceDescription` and `defaultRvgGroupId`, price ranges, the starting-values step), 19b, 18 (Parties, flat Contracts with a pricing kind, bills-its-holder or the payer, the AA code, the one stored No contract · RVG), 38a, 15b (ACTIVE for an assigned List), 15a (warnings), 15 (Booking vocabulary, `Booking.source`, and the attachments this phase removes) and 14 (the trigger registry). Runs straight after 20 and before 21 and 33.
**Estimated:** 2 sessions. Session 1: work items 1 to 8 (inventories, the model, the one pure module,
the store, every intake path, the reader sweep, removing attachments, the seed from AR-35, tests),
ending green with the UI changed only as far as it must compile. Session 2: items 9 to 16 (the
`ProcedureStack` component and its placement in both apps, the procedure description field, the
invoice description's edit, cue and print, the trigger re-point and "Hospital description arrives",
shots, demo guide). If session 2 runs long, cut the Admin List drawer rows (item 10) before any
Booking-screen placement.

## Goal

Three things, built together because they are one field set and the one place every booking screen
reads it.

**Each Procedure holds one procedure text, exactly as received** (US-02.5.7, DM-51). The procedure on a
Booking is just this text: there is no procedure master to match it to (OQ-88), and the anaesthetist
reads it to choose the Contract and the RVG code. It starts as the surgeon's rooms' description; when
the hospital's list or feed arrives, usually the day before, the hospital's replaces it with no check
against the rooms' wording, and a later hospital update replaces it again. Nobody edits it by hand.
Today one free-text `Procedure.description` does every job, is trimmed on create and is overwritten by
a PDF update and by Edit procedure. This phase replaces it:

- `Procedure.procedureText` holds the text, the system it came from (the surgeon's rooms by PDF or
  email; the hospital's download or feed; or entered by hand: phone, email, the anaesthetist) and when it
  arrived. Stored character for character. A Procedure may have none.
- **One write path after create.** `replaceProcedureText` (item 4) puts a later text in place of the
  held one and writes the replaced text, with its source and time, to the Booking's change history as
  an audit entry (US-02.5.5: append-only, never a second field on the Procedure). The hospital's
  download and feed, the PDF ingest and the demo action call it now; Phase 33's matching screen calls
  it later. An identical text changes nothing.
- **Hand entry keeps what was typed or told** (US-02.4.1): the anaesthetist's manual add on mobile and
  web and the office's phone-advice form write the text through `createBooking`'s input; the form stops
  auto-filling from an RVG code's description and stops trimming. No separate "as given" field.
- **Edits change the RVG code and the Contract, never the text.** There is no edit control for it.
- Today's `Procedure.description` becomes the Procedure's `procedureText` in one step, and the
  `PERSIST_VERSION` bump reseeds persisted rehearsal state.

**The invoice description** (US-08.4.6, D37, D73). Each Procedure also holds an invoice description, a
field of its own: the wording the invoice prints. It is set by **a series of defaults, each replacing
the one before**: the Procedure's text (the rooms' to start, the hospital's when it replaces it; a
hand-entered Booking's text as typed or told), then **the chosen Contract's invoice description where
it is filled in** (19a; there are no lines; a blank one falls through). **The RVG code plays no part.**
**An AA admin edits it at any time as free text and the edit always wins** (D73, no provisional label):
neither a late hospital text nor a Contract chosen or changed replaces it, and the procedure text is
never touched. It records where its value came from (the rooms', the hospital's, the entered text, the
Contract's, or an admin's edit), and a "newer description" cue, kept as a convenience, tells the office
a newer default has arrived since its edit and lets it choose to use it. One helper applies the order
wherever the text arrives or the Contract changes (here, 19a's starting values, 33, 35); 22 and 27 print
it. This phase adds the field, the helper, the office's edit and cue on the Admin Booking, a
"Hospital description arrives" demo action and one invoice heading row per Procedure.

**One shared component shows it all on every booking screen** (US-03.1.9, US-03.1.2; views may differ per
app). Each Procedure shows its **procedure text**, its **invoice description**, its **Contract**
(name, [holder](../../../../requirements-board/requirements/stories/US-04.1.5.md), who is invoiced, and
the pricing basis with its figure: "RVG at your rate", "RVG less 10%", "Fixed price $3,565", "Other
price $2,000") and the **RVG code**: on a Contract priced from RVG units, and on a fixed or open price
only where one was picked for reference. The office picks the Contract first (20's step rail, decided);
a Contract priced from RVG units goes to the anaesthetist for the RVG code, so a code still to fill is
marked **for the anaesthetist to fill in** on office surfaces and **to choose** on the anaesthetist's. A
Booking with no Contract reads "Needs an invoice destination" and stays on 20's list of that name. One
`ProcedureStack` component (in `src/shared`, PWA-safe) renders it on the shared `BookingDetailBody`
(mobile, web, Admin and the PWA at once), in Admin List drawer rows and in Admin Review, where every
Procedure shows. Phase 33 adds it to the matching screen. The component reads one view type from one
pure module; **"who is invoiced" and "pricing basis" are each one function**, so Phase 21 (the payer)
and Phase 24 (the one price precedence) change what they return without touching the component. Mobile
may show less than web (a larger screen can break a Booking into more fields); the default is the same
parts, compact on a phone.

**The pricing model stays in one place** (the flat model, Donald's D1 to D11: [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md)
the proposal, its section 2.7 on the descriptions, and [AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md) the flat ERD;
never Contract lines, versions or staged changes). The view type, the two selectors, the
invoice-description defaults and the label helper live in one new module,
`aa-prototype/src/domain/billing/procedureStack.ts`; the text type sits on `Procedure`; the UI reads
only the view type.

**The anaesthetist sees the Contract summary.** US-15.0.1's Proposed note ("today anaesthetists see none
of the Contract complexity") yields to US-03.1.2 (Greg: the closer to today's mobile app the more
buy-in) and US-03.1.9: the Booking shows the Contract's name, holder, who is invoiced and pricing
basis. The 2026-09-28 Decisions-log ruling "Anaesthetist Card shows no calculation" stands for the
running fee and the Booking total (still hidden) and is superseded only in that the pricing basis and
its figure show. Phase 43a keeps the component when it simplifies the anaesthetist screens.

**Attachments go** (RV-01; US-03.1.3 Retired 16 October: Greg "comfortable removing this feature", Ben
does not want the rooms' PDFs on a Booking). Booking and List attachments on mobile and web, the office's
read-only List attachments, the store actions, the types and the seeded theatre-list PDF are removed
(item 7), and US-03.1.3's recipe is marked absent.

**Demo wording comes from AR-35.** The seed takes realistic shorthand from the illustrative table in
[AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md) (the note
[2026-10-08-procedure-picker-and-source-text.md](../../../../requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md),
its "Illustrative source wording" heading). The table is **AI-made, not from AA**: the seed says so in
its comments and nothing presents it as AA's data. AR-35 declares no named regions: cite the heading by
name (or its slug `AR-35#illustrative-source-wording`), never invent an anchor or edit the artifact.
Use only its "As received" and "RVG code" columns: its "Procedure (invoice wording)" column is a
procedure-list idea that has gone. The seed places rows 14, 15, 17, 21, 34 and 35 (the ones that need an
expert to read) and rows 1 and 2 as **one Booking whose rooms' "RTK" the hospital's "right total knee"
has replaced**, the original in its history.

No billing figure moves. The component, the procedure text, the invoice description and its heading are
display and record; the engine prices exactly as 20 left it, and S1 to S5 run with every figure
unchanged.

## Before you start: drift check

1. Run the catalogue diff since this plan's baseline (`efe123c`):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-02.5.7,US-03.1.9,US-03.1.2,US-02.4.1,US-08.4.6,US-03.1.3,US-02.5.5,US-02.5.8,US-02.3.1,US-02.1.2,US-07.2.2,US-15.0.1,US-04.2.18,US-04.3.8,FT-03.1,FT-02.5,OQ-103,OQ-130,OQ-13
   ```

   Read the hunks for those items and the domain-model's Procedure bullets on the procedure text and the
   invoice description. Use Node 22.18 or newer (`nvm use 24` if the shell's default is older) for the
   board's `source` script: `npm --prefix requirements-board run source -- --item US-03.1.9 --text`
   prints the cited passages.
2. If an item changed, re-read it and adjust the work items. Specifically:
   - **US-03.1.9 or US-03.1.2.** If the parts shown, their order or the per-app difference changed, build
     the catalogue's current reading in `procedureStack.ts` and the component, and log it. If the Contract
     part was taken off the anaesthetist's screens (for example US-15.0.1 promoted to Confirmed with that
     rule), build the catalogue's reading, keep the part for the office and log it.
   - **US-08.4.6 / OQ-103 / OQ-130.** If the order of defaults or who may edit changed (for example after
     Ben and Vanessa see the Contract's description on top, which was not put to them), change only
     `startingInvoiceDescription` and the edit's rights; if D73 was reopened, change only
     `refreshInvoiceDescription` and the cue.
   - **US-02.5.7 / US-02.4.1.** If the hospital's text no longer replaces the rooms', or a hand edit of
     the text was allowed again (or the rooms' original is kept some other way than the history), adjust
     items 2, 4 and 5 and log it. If an "as given" field came back as a separate field, add it beside the
     typed description and log it.
   - **US-03.1.3.** If attachments were un-retired, stop and tell the owner.
   - **A stop condition:** if the procedure text was Retired or moved to Future Work, stop and tell the
     owner (this phase would no longer make sense).
3. **Confirm the phases this builds on are DONE**, from their PROGRESS entries, and note the names
   they actually used (this plan's names are placeholders; reuse theirs, never a second copy):
   - **19:** the Procedure's RVG code field and its picker; whether `Procedure.description` survived 19
     (and what it holds now); the RVG group master (name, base units) the RVG code part reads.
   - **19a:** the Contract's `invoiceDescription` and `defaultRvgGroupId`, the price range in force on a
     date (the fixed price the basis shows), the starting-values step that fills the Procedure from the
     Contract (it calls `refreshInvoiceDescription`, item 4) and what resets on a Contract change; which
     seeded Contracts carry an invoice description (Doyle's items).
   - **18:** the Party master (name), the flat Contract (holder Party, bills-its-holder or the payer, the
     pricing kind and its rate or discount, the AA code), No contract · RVG's id.
   - **20:** `billedPartyFor` and its name; `setProcedureContract`; `enteredPrice`; the step rail and the
     "Needs an invoice destination" list; whether a Booking with no RVG code exists in the seed; whether
     `EditProcedureSheet` still carries a free-text "Operation" field; what the manual form's procedure
     input now is; and `OfficeBillingSetup`'s current rows.
   - **15 / 15b:** where Booking and List attachments were built (the inventory in item 1) and whether
     the Future-scope photo demo still hands an attachment to the manual form.
   Note the current `PERSIST_VERSION`. If 20 is not DONE, stop: the Contract part needs one Contract
   per Procedure.
4. **Answered questions: build the answers, no label.** OQ-103 (D37, the Contract's invoice description
   on top) and OQ-130 (D73, an admin's edit always wins; the cue stays as a convenience). Log our
   readings on the owner's review list (see PROGRESS.md updates). **OQ-13:** the simulated feeds' SCH-7
   description and FHIR `Appointment.description` are the hospital text; no real hospital field is assumed.
5. Record the result (changed items, the names reused from 18 to 20, the defaults) in the PROGRESS entry.

## Reference

**Design (convention 17).** [Design Language.dc.html](../../../design/Design%20Language.dc.html) for
tokens: Spline Sans Mono with tabular numerals for data (RVG codes, AA codes, figures and the received
wording, which is data shown verbatim), Schibsted Grotesk for labels; the small uppercase section label
treatment (11px, 600, letter-spaced, mist) that `BookingDetailBody`'s `Section` already uses; teal
`#0D6E63` the only action colour (Edit, Edit invoice description); crimson never. Status colours are for
List and session status, not for "still to choose": mark empty parts in neutral mist with a dashed or
hairline treatment. [Mobile App.dc.html](../../../design/Mobile%20App.dc.html) screen 3 (the Booking
detail and its procedure block), [Web Dashboard.dc.html](../../../design/Web%20Dashboard.dc.html) for
density, [Admin Review.dc.html](../../../design/Admin%20Review.dc.html) for the review table and
[Admin Day.dc.html](../../../design/Admin%20Day.dc.html) for the List drawer. No mockup draws this
block: extend the procedure block's own pattern (convention 17). It must read cleanly on a 375 px phone
without crowding the capture controls below it.

**Catalogue.**
- The covered items above. US-03.1.9's ACs ("Parts shown", "Both apps", "Contract summary", "Not matched
  yet", "Hospital's wording replaces"), US-02.5.7's ("Verbatim", "Hospital's replaces the rooms'",
  "Original in the history", "Entered by hand") and US-08.4.6's ten (rooms' description to start,
  hospital's replaces it, no hospital description, Contract's description, blank on the Contract, not
  from the RVG code, admin edit, edit wins over a late description, edit wins over a Contract change,
  procedure text unchanged) are the test lists.
- [domain-model.md](../../../../requirements-board/requirements/domain-model.md): Procedure's bullets on
  the procedure text and the invoice description, and the Booking section's pointer to them.
- The note [2026-10-08-procedure-picker-and-source-text.md](../../../../requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md)
  (artifact [AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md)): its "Illustrative
  source wording" heading (35 rows; the closing paragraph names the rows that need an expert: 14, 15, 17,
  21, 26, 27, 34 and 35). Its points #6 to #9 on keeping both texts side by side are superseded by
  US-02.5.7 (Ben, 5 November). The invoice-description evidence (16 October; Greg, 23 October; 5
  November) is read with `npm --prefix requirements-board run source -- --item US-08.4.6 --text`.
- Questions: OQ-103 and OQ-130 (answered), OQ-13 (open).

**The pricing model (flat; keep it in one place).** [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md)
section 2.7 (the descriptions) and [AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md)
regions `contract`, `pricing-kind`, `procedure` and `who-is-billed` (what the Contract and RVG parts
read). AR-28, AR-29 and AR-30 are Retired: never cite them.

**Analysis.** [analysis/domain-model-delta.md](../analysis/domain-model-delta.md#dm-51) DM-51;
[analysis/reverse-check.md](../analysis/reverse-check.md) RV-01 (the attachment evidence);
[GAP-ANALYSIS.md](../GAP-ANALYSIS.md) rows for US-02.5.7, US-02.4.1, US-03.1.9, US-03.1.2 and
US-08.4.6; [epics/EP-02.md](../epics/EP-02.md) and [epics/EP-03.md](../epics/EP-03.md);
[analysis/prototype-map-shared.md](../analysis/prototype-map-shared.md) and
[prototype-map-admin.md](../analysis/prototype-map-admin.md).

**PROGRESS.md.** Decisions log **2026-09-28 "Anaesthetist Card shows no calculation"** (superseded in
part here); conventions 5, 6, 7, 13, 16, 17, 18 and 19; the Phase 15, 15b, 19, 19a and 20 entries.

**Code entry points** (paths under `aa-prototype/src/`; re-find each by name, since 15b to 20 reshaped
these files).
- **Model:** `domain/types.ts` `Procedure` (`description`), `Attachment` (~724), `Booking.attachments`
  (~649) and `List.attachments` (~771); `store/lifecycle.ts` `ProcedurePatch` and `editProcedure`.
- **Create and add:** `store/bookingActions.ts` `CreateBookingInput.operation`, `createBooking` (the
  "operation description is required" refusal, the `trim()`, the `procedure.create` audit
  `after: { description }`), `addProcedure`, the post-op addendum skeleton.
- **Intake:** `store/integrationActions.ts` `applyEffect` (S12 create with `operation: parsed.operation
  ?? 'Procedure (from feed)'`; S13 and S14 apply) and `ingestPdfRow` (the update path overwrites with
  `editProcedure(..., { description })`); `domain/integrations/hl7.ts` (`operation` from SCH-7),
  `fhir.ts` (`Appointment.description`), `messages.ts` (MSG-STG-1001 the S1 create, MSG-STG-1012 the S14
  modification).
- **Forms:** `shared/flows/ManualBookingForm.tsx` (the "Operation" field, its prefill from the RVG
  code's description, the `attachment` prop), `PhotoCaptureFlow.tsx` (passes an attachment),
  `AddBookingFlow.tsx`, `apps/admin/flows/PhoneAdviceBooking.tsx`, `shared/flows/EditProcedureSheet.tsx`,
  `RemoveProcedureSheet.tsx`, `sampleExtractions.ts`.
- **Display:** `shared/capture/BtmCaptureBlock.tsx` (the procedure header `data-testid="procedure-header"`
  and the read-only context line `data-shot="procedure-contract"`); `shared/booking/BookingDetailBody.tsx`
  (totals and history labels, the procedures loop, the Attachments section ~559, `OfficeBillingSetup`);
  the Booking detail headers in `apps/mobile/screens/BookingDetailScreen.tsx`,
  `apps/web/screens/BookingDetailView.tsx` and `apps/admin/screens/AdminBookingDetail.tsx`; List rows in
  `ListDetailScreen.tsx` and `ListDetailView.tsx` (both also the List attachments panels, ~263-283 and
  ~273); `apps/admin/components/ListDrawer.tsx` and `SlotDrawer.tsx` (~222, read-only attachments);
  `apps/admin/screens/ReviewScreen.tsx`; the existing History sheet's narrative (`shared/audit/auditNarrative.ts`).
- **Attachments:** `shared/attachments/` (AddAttachmentSheet, AttachmentStrip, AddAttachmentButton),
  `store/attachmentActions.ts` and its test, `assets/sampleAttachments.ts`, `store/index.ts`,
  `store/mutate.ts` (the `AT` id prefix), `store/slotActions.ts`, `domain/recurringBookingProjection.ts`,
  the seed (`seed/index.ts` ~338, `bookings.ts`, `history.ts`, `draftLists.ts`, `audit.ts`),
  `domain/billing/fixtures.ts`, `domain/warnings/routine.test.ts`, `shared/audit/actionLabels.ts` and
  `fieldLabels.ts`, `visual/booking-attachments.spec.ts`.
- **Invoice:** `apps/admin/screens/InvoiceDocument.tsx` (the lines table `data-shot="invoice-lines"`),
  `domain/billing/fee.ts` and `invoiceBuild.ts` (line text; Phase 22 owns the layout).
- **Labels:** `shared/format.ts`, `shared/audit/actionLabels.ts`, `fieldLabels.ts`.
- **Seed:** `domain/seed/bookings.ts` (`ProcedureSpec.description`, the S1 Tue 28 AM cases, the Phase 11
  integration Bookings, Foster's S14 target, `pinnedListIds`, the filler), `seed/history.ts`,
  `seed/audit.ts`, `domain/billing/fixtures.ts`.
- **Triggers:** `shared/demoTriggers/registry.ts` (`fire-hospital-message`; the new
  `hospital-description-arrives`), `types.ts` (`choices`, `run`), `pwa/pwaPurity.test.ts`.
- **Persistence:** `store/appStore.ts` `PERSIST_VERSION` and its comment block; `migrate` returns
  `freshAppState()` on a mismatch, so a bump reseeds.
- **Tests that read `description` or attachments:** `store/bookingActions.test.ts`, `bookingSource.test.ts`,
  `integrationActions.test.ts`, `intake.test.ts`, `captureActions.test.ts`, `btmCapture.test.ts`,
  `shared/booking/BookingDetailSource.test.tsx`, `shared/audit/auditNarrative.test.ts`, the billing
  fixtures' tests, `AddBookingFlow.test.tsx`; Playwright specs that wait on `procedure-header` or fill
  "Operation description".

## Work items

Session 1 is items 1 to 8 and ends green. Session 2 is items 9 to 16.

1. **Baseline and inventories.** Run `npm run build`, `npm run build:pwa`, `npx vitest run` and
   `npm run shots` in `aa-prototype/` and record the counts. Then two inventories, kept for the PROGRESS
   entry:

   ```
   grep -rn -e "\.description" -e "operation" -e "Operation" aa-prototype/src aa-prototype/visual aa-prototype/pwa | grep -v -i -e "contract" -e "modifier" -e "demoTrigger" -e "billingLine" -e "scenario"
   grep -rln -i "attachment" aa-prototype/src aa-prototype/visual aa-prototype/pwa
   ```

   Sort the first into Procedure-wording readers (this phase moves them) and everything else (RVG code,
   modifier, Contract, billing-line and trigger descriptions, which stay).

2. **The model** (`domain/types.ts`, beside `Procedure`).
   - `ProcedureTextSource = 'surgeonPdf' | 'email' | 'hospitalDownload' | 'hospitalFeed' | 'phone' |
     'anaesthetist' | 'unrecorded'`, and `ProcedureText { text: string; source: ProcedureTextSource;
     receivedAtISO: IsoDateTime; from?: string }` (`from` names the sender where known). 33 may add a
     "Hospital sheet" source.
   - `Procedure.procedureText: ProcedureText | null`, replacing `Procedure.description` (or what is left
     of it after 19 and 20). Doc comment: US-02.5.7, DM-51, "written only by `createBooking` and
     `replaceProcedureText`; never edited; the replaced text goes to the change history".
   - `Procedure.invoiceDescription: { text: string; origin: InvoiceDescriptionOrigin; editedOver?:
     string }` with `InvoiceDescriptionOrigin = 'rooms' | 'entered' | 'hospital' | 'contract' |
     'edited'` (US-08.4.6, DM-51): the provenance record. `editedOver` is the default's text at the
     moment an admin edited, so the view can tell when a newer default has arrived since (a cue only).
   - `store/lifecycle.ts`: `ProcedurePatch` becomes `Partial<Omit<Procedure, 'id' | 'bookingId' |
     'procedureText' | 'invoiceDescription'>>`, so no edit path touches either; `editProcedure` also
     refuses a patch object carrying either key at run time (a guard with a test). The invoice
     description changes only through `setInvoiceDescription` and `refreshInvoiceDescription` (item 4).

3. **One pure module** (`domain/billing/procedureStack.ts`, exported through `domain/billing/index.ts`;
   no React, no store import). The only place that decides what the component says, reading the
   structures 18 to 20 built.
   - **Types the UI reads:** `ProcedureStackView { procedureText: { text; source; receivedAtISO; from? }
     | null; invoiceDescription: { text: string; origin; newer?: { text: string; origin } }; contract: {
     name: string; aaCode?: string; holderName: string; invoiced: InvoicedParty; basis: PricingBasis } |
     null; rvg: { code: string; description: string } | 'toChoose' | 'forAnaesthetist' | null }`,
     `InvoicedParty { name: string; kind: 'holder' | 'patient' | 'payer' }` and `PricingBasis`, one
     member per 18's five pricing kinds: `{ kind: 'rvgAnaesthetistRate' }` ("RVG at your rate"), `{ kind:
     'rvgContractRate'; perUnit: number }`, `{ kind: 'rvgLessDiscount'; percent: number }` ("RVG less
     10%"), `{ kind: 'fixedPrice'; amount: number | null }` ("Fixed price $3,565"; null where no range is
     in force) and `{ kind: 'openPrice'; amount: number | null }` ("Other price $2,000"; the amount typed
     on the Procedure, null until typed). Use 18's kind names where they differ. No first-party or
     third-party flag.
   - **`procedureStackView(procedure, ctx)`** with `ctx` holding the masters, the Booking, its List and
     patient, and `ctx.surface`. `procedureText` is the held text with its source. `contract` is null when
     the Procedure has none (20's "Needs an invoice destination"). `rvg` is the code and its RVG group's
     description wherever one is held; where none is held, `'toChoose'` (`'forAnaesthetist'` on an office
     surface, the step rail's hand-off) on the three RVG kinds and with no Contract, and `null` on a fixed
     or open price (the code is optional and shown only where one was picked for reference).
   - **`whoIsInvoicedFor(procedure, ctx): InvoicedParty`**: one function that wraps 20's
     `billedPartyFor` and only names the party (never a second derivation). Its comment says Phase 21
     re-points it to the holder's Party or the payer on the Booking (AR-61 `who-is-billed`).
   - **`pricingBasisFor(procedure, ctx): PricingBasis`**: one function reading the Contract's pricing kind
     (18), the price range in force on the Procedure's date for a fixed price (19a) and `enteredPrice`
     for an open price (20); No contract · RVG gives `rvgAnaesthetistRate`. Its comment says Phase 24
     re-points it to the one price precedence and that it shows the basis, never the computed fee.
   - **`procedureTextKind(source): 'rooms' | 'hospital' | 'entered'`** (`surgeonPdf` and `email` to
     rooms; `hospitalDownload` and `hospitalFeed` to hospital; `phone`, `anaesthetist` and `unrecorded`
     to entered) and **`replacesProcedureText(current, incoming): boolean`**: a different text replaces,
     except that a rooms' text never replaces a hospital's (the hospital's is the source of truth, Ben, 5
     November; our reading for a rooms' PDF arriving after the hospital's, logged). An identical text never
     replaces.
   - **`startingInvoiceDescription(procedureText, contractDescription?)`**: D37's order of defaults, each
     replacing the one before: the Procedure's text with its origin from `procedureTextKind`
     (`'rooms'`, `'hospital'`, or `'entered'` for a hand-entered Booking, our reading, logged); replaced
     by the Contract's invoice description where it is not blank (`'contract'`). Empty when there is
     neither. It takes no RVG code, so the code and its group can play no part by construction. Comment:
     US-08.4.6, D37.
   - **`refreshInvoiceDescription(current, procedureText, contractDescription?)`**: the one helper every
     path calls when the text arrives or the Contract changes (this phase's intake, 19a's and 20's
     Contract actions, 33 and 35 later). It returns the default unless `current.origin` is `'edited'`,
     which it keeps: an admin's edit always wins (D73, answered; no provisional label).
     `procedureStackView` sets `invoiceDescription.newer` to the default when the description is edited
     and the default's text differs from `editedOver` (a hospital text arrived, or a Contract was chosen
     or changed, since the edit); the cue is a convenience and never applies itself.
   - **`procedureLabel(procedure, masters, ordinal)`**: the short label every list, total, history
     scope and sheet title uses: the Procedure's text, shortened and quoted; else the RVG code and its
     description; else "Procedure n".
   - **Tests** (`procedureStack.test.ts`): a Southern Cross fixed-price fixture gives the US-03.1.9
     "Contract summary" AC (name, Southern Cross as holder, who is invoiced, the fixed price) and a
     null `rvg`; each of the five kinds gives its basis and label inputs; no Contract gives `contract:
     null` and keeps the text ("Not matched yet"); an RVG-priced Contract with no code gives
     `'forAnaesthetist'` on the office surface and `'toChoose'` on the anaesthetist's; a fixed price with
     a picked code shows it; `replacesProcedureText` (different replaces, identical does not, rooms' never
     over hospital's, hospital's over rooms'); `startingInvoiceDescription` against US-08.4.6's first six
     ACs (rooms to start; the hospital's replaces it; none arriving keeps the rooms'; a filled-in Contract
     description wins with or without the hospital's; a blank one falls through; an RVG-only pick never
     yields a group name) plus entered text and no text; `refreshInvoiceDescription` keeping an `'edited'`
     description against a later hospital text and a Contract change, and the view's `newer` cue
     appearing then and not before; `procedureLabel`'s three fallbacks.

4. **The store: one write path, verbatim.**
   - **`replaceProcedureText(api, actor, procedureId, { text, source, from? })`** (in
     `store/bookingActions.ts` or a new `store/procedureTextActions.ts`, exported from `store/index.ts`;
     Phase 33 calls it by this name, so record any rename): sets `procedureText` to the incoming text,
     stamped with the demo clock, when `replacesProcedureText` says so; **writes the replaced text to the
     Booking's change history** as the audit entry `procedure.procedureText.replace` with `before: { text,
     source, receivedAtISO }` (null when the Procedure held none) and `after: { text, source }`, the entry's
     own actor and time (US-02.5.5; 35's history screen reads it). Rights follow `editRefusal(actor, list)`
     (the same rule as `editProcedure`); no screen offers it to a person, only intake and the demo action
     call it. A blank or whitespace-only text is refused ("Type the description as given."); an identical
     text, or a rooms' text over a hospital's, returns `ok` with `replaced: false` and changes nothing (a
     replayed message adds nothing). Stored exactly as given: no trim, no case change. After a replace it
     calls `refreshInvoiceDescription` in the same mutation, so the hospital's text replaces the rooms'
     as the default at once (unless the Contract's description or an admin's edit holds).
   - **`setInvoiceDescription(api, actor, procedureId, text)`**: office only, as free text, at any
     time until AUTHORISED (D63: after that the invoice is issued); sets `{ text, origin: 'edited',
     editedOver: <the default's text now> }`, audited `procedure.invoiceDescription.set` with before
     and after; a blank text is refused ("The invoice needs a description."). The anaesthetist has no
     edit. **`applyDefaultInvoiceDescription(api, actor, procedureId)`** (office, same rights): the cue's
     "Use it", setting the description back to the current default with its origin, audited
     `procedure.invoiceDescription.applyDefault`.
   - **`createBooking`**: `CreateBookingInput.operation` goes; it gains `sourceText?: { text; source;
     from? }` (the name 33 and 35 already use). The first Procedure's `procedureText` holds that text,
     verbatim, when not blank, and its `invoiceDescription` comes from `startingInvoiceDescription` (an
     RVG code alone leaves it empty, shown as still to choose; never the code's wording). The refusal
     becomes "Type the procedure as told, or choose an RVG code." when there is neither a non-blank text
     nor an RVG code (D33: the code is optional, the Booking just needs something to show). The
     `procedure.create` audit records `procedureText` instead of `description`.
   - 20's `setProcedureContract` and 19a's starting-values step call `refreshInvoiceDescription`, so
     choosing a Contract with a filled-in invoice description makes it the invoice description and a
     change to a blank one falls back to the Procedure's text, while an admin's edit holds; no change to
     19a's other values.
   - `addProcedure` and the post-op addendum skeleton: `procedureText: null`, `invoiceDescription` empty.
   - Labels: `actionLabels.ts` gains `'procedure.procedureText.replace'` ("Procedure text replaced"),
     `'procedure.invoiceDescription.set'` ("Invoice description changed") and
     `'procedure.invoiceDescription.applyDefault'` ("Newer description used on the invoice");
     `fieldLabels.ts` replaces `description` with `procedureText` ("Procedure text") and
     `invoiceDescription`. `auditNarrative.ts` gives the replace entry its sentence naming the replaced
     text and its source, so the existing History sheet already shows "Was: 'RTK' (Surgeon's rooms PDF)";
     Phase 35's screen builds on the same entry.
   - Tests (`store/procedureText.test.ts`): verbatim (leading spaces, "?conv", "+/-" and a misspelling
     survive); the hospital's text replaces the rooms' and the history entry holds the rooms' text with
     its source and time; a second different hospital text replaces again, a third identical one does
     not; a rooms' text does not replace a hospital's; blank refused; `editProcedure` refuses
     `procedureText` and `invoiceDescription` patches; the anaesthetist refused on a SUBMITTED List;
     `createBooking` with only text, only an RVG code, both and neither (refused); a hospital text
     through `replaceProcedureText` switches a rooms' invoice description to the hospital's, and leaves a
     Contract's description or an office edit in place; a Contract chosen or changed leaves an office
     edit in place; the office edit and "Use it" (anaesthetist refused, blank refused) leave the procedure
     text and its history unchanged (US-08.4.6's last ACs).

5. **Every intake path writes the text** (`store/integrationActions.ts` and the forms).
   - **Hospital feed create (S12):** pass `parsed.operation` as the text, source `hospitalFeed`, `from`
     the feed's hospital, verbatim. No invented fallback: a message with no text creates a Procedure with
     none (the component says "No description received"). The Contract and RVG code stay as 20 left this
     path (the office sets the Contract). A comment notes Phase 33 moves hospital rows behind the
     matching screen.
   - **Hospital feed updates (S13 and S14):** when the parsed message carries text that differs from the
     Booking's first Procedure's, replace it (`replaceProcedureText`, source `hospitalFeed`) after the
     time change, in the same apply; identical text changes nothing. Never edit the RVG code or the
     Contract. A cancelled Booking or a locked List parks as today.
   - **Surgeon PDF ingest** (14's `ingestPdfRow`, still built when this phase runs; Phase 34 routes its
     rows through matching): the create path passes `row.operation` as the text, source `surgeonPdf`;
     the update path calls `replaceProcedureText` instead of `editProcedure(..., { description })`.
   - The manual and phone-advice forms write it in item 11; the Future-scope photo demo's sample
     extraction prefills the description (source `anaesthetist`) and no longer hands over an attachment.
   - Tests: S12 stores the SCH-7 text verbatim with `hospitalFeed`; MSG-STG-1012 replaces Foster's
     "WLE MM" with the hospital's fuller wording, puts "WLE MM" in the history, switches her invoice
     description (No contract · RVG: no Contract description), and replaying it changes nothing; a PDF
     update replaces a rooms' text, does not replace a hospital's and a second identical row changes
     nothing; FHIR-SX-2001 stores `Appointment.description`.

6. **The reader sweep.** Every Procedure-wording reader from item 1 moves to `procedureLabel` (short
   labels) or, in item 10, to the component: `BookingDetailBody` totals and history scope labels;
   `ReviewScreen` history labels; `RemoveProcedureSheet`; the Booking detail headers on mobile, web and
   Admin ("{label} · {hospital}"); the List rows on mobile and web. `EditProcedureSheet`: remove any
   free-text "Operation" field left by 19 or 20; the sheet changes the RVG code and the Contract (19's
   and 20's pickers) and shows the procedure text read-only at its top; its save no longer needs a
   description. `BtmCaptureBlock`'s header keeps compiling with `procedureLabel` until item 10.
   `seed/audit.ts`, `billing/fixtures.ts` and every test that built a Procedure with `description` move to
   `procedureText` (fixtures get `procedureText: null` and an empty invoice description unless the test is
   about them). Re-run the item 1 grep: no Procedure-wording `description` reader may remain; list any
   accepted leftover.

7. **Remove attachments** (RV-01; US-03.1.3 Retired). Work from the second item 1 inventory.
   - **UI:** delete `shared/attachments/` and `assets/sampleAttachments.ts`; the Attachments section of
     `BookingDetailBody`; the "List attachments" panels on `ListDetailView` and `ListDetailScreen`; the
     read-only List attachments in `SlotDrawer`; the `attachment` prop of `ManualBookingForm` and the
     photo flow's hand-over; delete `visual/booking-attachments.spec.ts`.
   - **Store and model:** delete `store/attachmentActions.ts` and its test and their exports; remove
     the `AT` id prefix, `Attachment`, `Booking.attachments` and `List.attachments` from `types.ts`,
     `lifecycle.ts`, `slotActions.ts`, `recurringBookingProjection.ts` (the "has attachments" clause)
     and the audit and field labels. Seed: the seeded theatre-list PDF on Souter's Tue 28 Jul AM List
     (`AT0001`) and every other seeded attachment go, with their audit rows. Removing them must not
     shift any other seeded `BK`, `P`, audit or counter id that a recipe or the guide names: check, and
     record any exception.
   - A search for `attachment` (case-insensitive) in `aa-prototype/src`, `visual` and `pwa` is clean,
     except words that mean something else (a mail attachment in 35's future update email, say); list
     any accepted leftover.
   - Tests: the seed has no attachment; the List and Booking screens render without the sections; the
     parity check (item 8) is unchanged.

8. **The seed: every Procedure's text, and AR-35's rows; session 1 close.**
   - **The migration rule.** `seed/bookings.ts` `ProcedureSpec.description` becomes `procedureText?:
     string` with an optional `source` and `receivedAtISO`. Every seeded Procedure's former description
     becomes its `procedureText`, source mapped from its Booking's `source` (`hospitalDownload` to
     `hospitalDownload`, `surgeonPdf` to `surgeonPdf`, `admin` to `phone`, `anaesthetistAdHoc` (and
     `anaesthetistPhoto` if 15b kept it) to `anaesthetist`; unset to `unrecorded`), arrival time from
     fixed strings before `DEMO_TODAY`. The same for `seed/history.ts` (their historical invoice lines
     keep their stored text: issued invoices never change). Each seeded Procedure also gets an
     `invoiceDescription` from `startingInvoiceDescription` over its text and its Contract's description
     (no seeded edit). The seed must show each origin: rooms' (an expert row), hospital's (the "RTK"
     Booking, on a Contract with no invoice description: check, and move it to No contract · RVG if
     not), the Contract's (a Booking on one of 19a's Doyle Contracts with an invoice description; record
     which). Additional procedures and addendum skeletons stay empty. The Contract and RVG picks 19 and
     20 seeded do not change, with one recorded exception: Diane Foster's S14 target Booking (rows 26 and
     27), whose RVG code is cleared so the fire-message beat shows a Booking still to match. It sits on a
     forward ACTIVE List, uncaptured and never invoiced, so no S1 to S5 figure moves; update the S14
     assertions in `domain/integrations/integrations.test.ts` and `store/integrationActions.test.ts` that
     read its old wording.
   - **AR-35's wording**, in a new `domain/seed/sourceWording.ts`: a typed table of the rows used (row
     number, as received, source, the RVG code where the Contract prices from RVG units), headed by a
     comment: "AI-made, illustrative source wording, not from AA: AR-35, notes/2026-10-08-procedure-
     picker-and-source-text.md, 'Illustrative source wording'. RVG codes as printed in the NZSA RVG
     2021; only WLE MM, RTK, blephs, wide local excision, right total knee and row 27 come from AA's
     meeting." Take only the "As received" and "RVG code" columns; never add RVG group entries here.
   - **Placement (default; adjust only within the constraints below and record each move):**

     | AR-35 row(s) | As received (source) | Where | RVG code | Why |
     |---|---|---|---|---|
     | 14 | `lap appy ?conv to open` (hospital feed) | MSG-STG-1001's SCH-7 description, so Sarah Mitchell's S1 Booking arrives with it on Dr Souter's Tue 28 Jul AM List | none until she picks A3 in S1 Beat 3 (as 20 left the feed path) | S1's arrival shows hospital shorthand needing an expert ("may convert to open"). AR-35 lists the row as email: our reuse on a feed, logged |
     | 6, 8 | `L knee scope + partial menisectomy` (rooms PDF); `ORIF # R dist radius` (email) | the 07:45 knee arthroscopy and 11:15 wrist ORIF on that same S1 List | as seeded | S1 Beat 1's "three booked cases" read as the rooms sent them; the 09:45 shoulder case keeps its migrated wording unless it matches row 10 |
     | 1 replaced by 2 | now `right total knee` (hospital download); the history entry holds `RTK` (rooms PDF, earlier) | a new Booking on Dr Souter's Tue 4 Aug AM St George's List (pinned) | LL4 | one Booking whose rooms' shorthand the hospital's text replaced, the original in its history (US-02.5.7); a seeded `procedure.procedureText.replace` audit row, added after every existing audit row |
     | 26, then 27 on firing | `WLE MM` (rooms PDF); MSG-STG-1012 brings `WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC` (hospital feed), which replaces it | Diane Foster's S14 target Booking (Tue 4 Aug AM, 11:00), re-seeded to this wording, on No contract · RVG | to choose (the site is not given) | the fire-message beat. AR-35 lists 26 and 27 as separate rows: pairing them as one Booking's rooms and hospital wording is our reading, logged |
     | 15, 17, 21, 34, 35 | `gastro/colon`, `blephs` (rooms PDF); `hystero D&C` (rooms PDF); `L3-5 decomp + fusion` (email); `EUA +/- cysto +/- biopsy` (rooms PDF) | new Bookings on one or two of Dr Souter's forward ACTIVE Lists already in `pinnedListIds` (Thu 30 Jul AM or Tue 28 Jul PM; check no S12 test counts their Bookings) | 15, 17 and 35 to choose; 21 P1; 34 S9b with 19b's pre-applied, removable P1 | the expert rows, on screens the presenter can open on mobile, web and the Admin Day |
     | 3, 11, 13, 25 | `L TKJR`, `lap chole +/- IOC`, `R inguinal hernia mesh` (rooms PDF); `TURP` (hospital download) | the existing Left total knee replacement (Souter Tue 21 AM), Wiremu Tane's lap chole and the Chen inguinal hernia (Souter Tue 21 PM), and one Morrison Mon 20 TURP | as seeded | today's and S3's Lists read as received; picks and figures unchanged |

     **Constraints.** No S1 to S5 figure, count or scripted name changes (S1 Beat 1 still reads three
     booked cases at 07:45, 09:45 and 11:15, and Sarah Mitchell still arrives as the fourth); no new RNG
     draw, filler draws unchanged; **new Bookings and the new audit row are created after every existing
     seeded Booking and audit row, so no existing `BK`, `P`, audit or counter id shifts** (recipes and the
     guide name them); new Bookings reuse existing seeded patients with no other Booking that day; every
     new Booking has a Contract by 20's rules (No contract · RVG where nothing fits); the "RTK" Booking
     takes a free time on Dr Souter's Tue 4 Aug AM List clear of the S13, S14 and S15 targets (08:30,
     11:00, 12:00) and of MSG-STG-1012's new 12:15, and any test that counts that List's Bookings is
     updated. Keep `MSG-STG-1001` and `MSG-STG-1012` parseable: change only the SCH-7 description
     component, and keep MSG-STG-1012's time change and note.
   - **`PERSIST_VERSION`**: bump by one from what 20 left, with a comment line: "Procedure text
     (US-02.5.7, US-08.4.6): `Procedure.description` replaced by one `procedureText` (the hospital's
     replacing the rooms', the replaced text in the audit history) and an `invoiceDescription`;
     attachments removed (RV-01); AR-35's illustrative wording seeded; MSG-STG-1001 and MSG-STG-1012
     reworded".
   - **Seed tests** (`domain/seed/sourceWording.test.ts`): every seeded Procedure that had a description
     has exactly that text as its `procedureText`; the AR-35 rows sit on the Bookings the placement
     names (by patient and List, not by a new id), with their sources; the "RTK" Booking holds "right
     total knee" (hospital) and its history entry holds "RTK" (rooms) earlier; Foster's Booking holds
     only "WLE MM" before firing; no seeded text is blank; every seeded Procedure with text has an
     invoice description equal to `startingInvoiceDescription`'s, the "RTK" Booking's "right total knee"
     (`'hospital'`) and the Doyle Booking's the Contract's; existing ids are unchanged (compare a fixed
     list of S1 to S5 Booking ids and patients to the pre-phase seed); the seed is deterministic (two
     builds deep-equal).
   - **Session 1 close.** Tests for items 2 to 7 as listed, plus a parity check: the fee of every seeded
     Procedure and every seeded invoice total is unchanged from the baseline (reuse 18's parity harness),
     with Diane Foster's S14 target the one listed exclusion and the new AR-35 Bookings absent from the
     baseline. `npm run build`, `npm run build:pwa`, `npx vitest run` green. The app runs, labels from
     `procedureLabel` and no component yet.

9. **The `ProcedureStack` component** (`shared/booking/ProcedureStack.tsx`, exported from
   `shared/booking/index.ts`; imports only `domain`, `theme` and `shared/format`, so `pwaPurity` holds).
   Invoke the frontend-design skill first.
   - a. **Props:** `view: ProcedureStackView`, `density: 'full' | 'compact'`, optional `heading`
     ("Procedure 2" on a multi-procedure Booking) and an `actions` slot (Edit, Remove, Edit invoice
     description) the caller supplies. It renders the view; it derives nothing.
   - b. **Full density** (Booking screens), joined so they read as one Procedure (a hairline rail or
     connected rows, not cards):
     - **Procedure text:** in mono, quoted, with a mist meta line naming its source and time ("Hospital
       download · Mon 20 Jul", "Surgeon's rooms PDF · Tue 14 Jul", "Phone · Mon 20 Jul"); "No description
       received" in mist when empty. One text, no list; the replaced one is in the History.
     - **Invoice description:** the text the invoice prints, labelled "Invoice description", with a mist
       meta line naming its origin ("From the surgeon's rooms", "As entered", "From the hospital", "From
       the Contract", "Edited by the office"); "Invoice description to choose" in mist when empty. Where
       the view carries `newer`, a neutral cue below it: "A newer description has arrived: '{text}'
       ({origin})", with the caller's "Use it" action on the office surface.
     - **Contract:** the name with the AA code in mono, "Held by {holder}", "Invoiced: {party}", and the
       pricing basis with its figure from `formatPricingBasis` (item 14); "Needs an invoice destination"
       in neutral mist when null.
     - **RVG code:** code and group description in mono, only where the view carries one; "RVG code to
       choose" in mist with a neutral still-to-choose treatment (on an office surface, "RVG code: for the
       anaesthetist to fill in"); absent on a fixed or open price with none picked.
     Long wording wraps (row 27 is long); nothing truncates in full density. At 375 px the parts stay one
     column and the capture controls below keep their spacing. Mobile uses the same parts; web may lay
     them out in two columns.
   - c. **Compact density** (Review cells, drawer rows): the same parts as short single-line rows with an
     ellipsis and the full text in a `title`.
   - d. **Hooks:** `data-shot="procedure-stack"` on the root, `procedure-text`,
     `procedure-invoice-description`, `procedure-rvg-code`, and the Contract part keeps
     **`data-shot="procedure-contract"`** (US-03.1.2's recipe highlights it). Semantics: an ordered
     list with each part's label read before its value.
   - e. **Component tests** (`ProcedureStack.test.tsx`): the parts in order with their labels; the "Not
     matched yet" view; the RVG code absent on a fixed price with none picked, shown where one was
     picked, and "to choose" on an RVG Contract without one; each invoice-description origin's meta line,
     and the `newer` cue shown only when the view carries it; compact density truncates with a title; the
     Contract part carries `procedure-contract`; no en or em dash in any rendered string.

10. **Place the component on every booking screen.**
    - **Booking detail, all three apps and the PWA** (`BtmCaptureBlock`, rendered by the shared
      `BookingDetailBody`): the header's text and the read-only context line give way to the component in
      full density, with "PROCEDURE n" as its heading on a multi-procedure Booking and Edit and Remove
      in its actions slot. Keep `data-testid="procedure-header"` on the heading row and the actions slot
      inside it (recipes and specs wait on it, and US-03.4.1's recipe clicks `[data-testid=procedure-header]
      >> text="Edit"`). The capture cards below are unchanged. On the office surface, drop the rows of
      `OfficeBillingSetup` that repeat the Contract's name or holder and keep its edit action and
      whatever the component does not show.
    - **Admin Booking detail (the office edits here at any time):** an "Edit invoice description"
      action in the slot opens a dialog (`EditInvoiceDescriptionSheet`: free text prefilled with the
      current wording, the procedure text shown read-only above it, and one mist line "Your wording
      stays if a newer description arrives") calling `setInvoiceDescription`; the `newer` cue's "Use it"
      calls `applyDefaultInvoiceDescription`. Phase 35's amend flow reuses both.
    - **Admin List drawer** (`ListDrawer`'s Bookings section): each row keeps the patient name and
      state, and gains the compact component for each Procedure.
    - **Admin Review** (`ReviewScreen`): a "Procedures" column replaces the "Contract" and "Code"
      columns, holding the compact component for **every** Procedure of the Booking; the Patient cell
      keeps name and NHI. Times, B · T · M, Units, Fee and Flags stay; the row opens the Admin Booking,
      where the invoice description is edited. Phase 21a adds the flags.
    - **List rows** on mobile and web stay one line, from `procedureLabel`; the matching screen is
      Phase 33's.

11. **Hand entry keeps what was typed** (`shared/flows/ManualBookingForm.tsx`, shared by mobile and web
    Add a booking and Admin's phone advice).
    - A **"Procedure description"** text field (`data-shot="procedure-description"`) replaces any
      "Operation" field and sits beside 19's optional RVG code. Helper text for the anaesthetist "The
      procedure as written on the hospital's list", for the office "The procedure as it was told or
      written to you", plus for the office the "Told by" Phone or Email choice (default Phone). The
      prefill from an RVG code's description into it goes (a picked code is not wording received); the
      demo empty-NHI lookup prefill fills it (what the caller said; S2 Beat 2).
    - Save passes `sourceText` (source `anaesthetist`, or `phone` or `email` for the office, `from` the
      actor's name) stored exactly as typed, no trim; a whitespace-only text stores nothing. The form
      saves with text and no RVG code, or a code and no text, never with neither ("Type the procedure as
      told, or choose an RVG code."). The text also starts the invoice description (`'entered'`, item 3).
    - Component test: an anaesthetist save stores the text verbatim with `anaesthetist`; an office save
      with Email stores `email`; leading spaces survive; neither refuses.

12. **The invoice prints the invoice description** (`apps/admin/screens/InvoiceDocument.tsx`). In the
    lines table each Procedure's lines sit under one heading row reading its `invoiceDescription.text`;
    fee line text, amounts, totals and Xero records are unchanged (Phase 22 owns the layout and may
    restyle the heading; an empty description prints no heading). Tests over the seeded billing run:
    every heading equals its Procedure's invoice description; an office edit changes the heading and not
    the procedure text (US-08.4.6 "Admin edit"); no heading is an RVG group name; amounts unchanged from
    the baseline.

13. **Demo triggers** (`shared/demoTriggers/registry.ts`): re-point "Fire hospital message" and add
    "Hospital description arrives".
    **Re-point "Fire hospital message"** (no new entry for it):
    - Its `routes` already hold the mobile Booking route; add the web (`/web/lists/:listId/bookings/:bookingId`)
      and Admin (`/admin/day/:dateISO/bookings/:bookingId`) Booking routes, keeping its Future-scope
      badge and surfaces (bar and PWA).
    - `defaultChoice` picks, when the Booking in the URL (`ctx.params.bookingId`) has a `correlationRef`,
      the canned modify message whose `correlationAppointmentId` matches it (so Diane Foster's Booking
      defaults to MSG-STG-1012); otherwise its current default. A pure helper in `shared/demoTriggers`
      maps the Booking to its message, with a test.
    - Its success message, when the apply replaced the text: "Fired MSG-STG-1012: the hospital's
      description replaced the rooms' text; the original is in the History." Nothing is added to the
      Control Panel page; its index lists the new routes under the entry.

    **New: "Hospital description arrives"** (`hospital-description-arrives`; the Admin Booking route
    only, surface bar; no Future-scope badge: the hospital download is in scope and 33 makes it real).
    - `choices`: AR-35's hospital wordings (rows 2, 12, 20, 25; illustrative, from `sourceWording.ts`),
      defaulting to the row AR-35 pairs with the Procedure's rooms' text ("RTK" to 2, "lap chole +/- IOC"
      to 12), else the first. `run` replaces the selected Procedure's text (published by the screen, else
      the first) through `replaceProcedureText`, source `hospitalDownload`; disabled when that text is
      already held.
    - Its success message names the outcome: the procedure text is now the hospital's and the invoice
      description follows, or it stays (the Contract's, or an office edit) with the cue showing.
    - Demo Booking: Wiremu Tane's lap chole (Dr Souter, Tue 21 PM; rooms' row 11); if its Contract has an
      invoice description, pick another rooms-only Booking and record it.
    - Test: the default pairing, the three outcomes, the disabled reason, absent from the PWA.

14. **Labels and copy** (`shared/format.ts`): `PROCEDURE_TEXT_SOURCE_LABELS` ("Surgeon's rooms PDF",
    "Email", "Hospital download", "Hospital feed", "Phone", "Anaesthetist", "Source not recorded"),
    `INVOICE_DESCRIPTION_ORIGIN_LABELS` (item 9b's meta lines) and `formatPricingBasis(basis, surface)`
    ("RVG at your rate" on the anaesthetist's surfaces, "RVG at the anaesthetist's rate" on the office's;
    "RVG at $26.50 per unit"; "RVG less 10%"; "Fixed price $3,565" in whole dollars; "Other price $2,000",
    "Other price, amount to enter" until typed). App copy says "Procedure text", "Invoice description",
    "Contract", "RVG code", "Invoiced", "Held by", never "Card", never "slot", never "DRAFT" for an
    assigned List, never "as given", and no en or em dash anywhere. The prototype README's Booking and
    Procedure section names `procedureText`, `invoiceDescription` and its order of defaults,
    `replaceProcedureText` and the component, and drops attachments.

15. **Demo guide, Control Panel scenario text and ATLAS** (the same session; see Demo guide updates and
    Catalogue screenshots).

16. **Finish.** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green;
    both item 1 inventories clean; then the manual test checklist, the review pass, the catalogue
    screenshot step and the PROGRESS entry.

## Demo triggers

One new trigger ("Hospital description arrives", item 13), since a hospital's description arriving for
a chosen Booking cannot be shown through normal use until Phase 33; everything else demos through
normal use.

1. **None needed for the text.** After Reset, Dr Souter's Lists and the Admin Day carry AR-35's
   wording: S1's Tue 28 Jul AM cases, the "right total knee" Booking on Tue 4 Aug AM with "RTK" already
   in its history, Foster's "WLE MM" on the same List, the expert rows on Dr Souter's forward Lists, and
   the reworded Bookings on Tue 21 and Mon 20.
2. **"Fire hospital message" re-pointed** (Phase 14's entry, Future-scope badge, bar and PWA): now also on
   the mobile, web and Admin Booking routes, defaulting to the message addressed to the Booking on screen.
   On Diane Foster's Booking it fires MSG-STG-1012, which replaces the rooms' "WLE MM" with the hospital's
   fuller wording (the original goes to the History) and switches its invoice description to it; firing
   it again changes nothing. The PWA sheet shows it on the Booking screen too, so a handset demo needs no
   office stand-in.
3. **Admin Booking detail: "Hospital description arrives"** (new, bar only; item 13): on Wiremu Tane's
   lap chole the procedure text and the invoice description switch from the rooms' to the hospital's
   wording; under a Contract's invoice description or an office edit the invoice description stays and
   the "newer description" cue shows.
4. **Admin Booking: edit the invoice description** (product UI, not a trigger), and the **Procedure
   description** field on mobile and web Add a booking and Admin's Book (phone advice): product UI.

PWA parity: nothing in this phase waits on the office or a colleague; the re-pointed trigger covers the
backend event on the handset. "Hospital description arrives" is office-only (the invoice description is
the office's), so not on the PWA.

## Out of scope

- **The matching screen** and text on its rows (US-02.1.2, FT-02.5): Phase 33, which adds this
  component to each row, applies a row's text through `replaceProcedureText` and moves hospital wording
  behind approval.
- **The payer on the Booking** and what "who is invoiced" returns after 20's interim: Phase 21
  (re-points `whoIsInvoicedFor`).
- **The one price precedence**, the price source and the anaesthetist's typed price: Phase 24
  (re-points `pricingBasisFor`). The pricing snapshot: 25.
- **Invoice layout** beyond one heading row per Procedure: Phase 22 (each line printing the invoice
  description).
- **Adding to or rewording the text by hand** (including the anaesthetist's rewording with history, Donald,
  16 October): not built; US-02.5.7 says nobody edits the text, and the rooms' original is in the history.
- **The change history screen and the office's amend flow** (US-02.3.1, US-02.5.5, US-02.5.8): Phase 35,
  which reads the replace entry this phase writes.
- **Primary Procedure** ("Make primary"): Phase 23. Until then intake targets the Booking's first
  Procedure.
- **Hiding Contract detail from the anaesthetist:** not done; 43a simplifies the anaesthetist screens
  while keeping the component.
- Editing AR-35, AR-58, AR-61, registering a region on AR-35, or any catalogue requirement's text or
  status.

## Manual test checklist

The agent runs every item itself in the running app (root `npm run dev`; Playwright or the `/run`
skill; handset checks in the emulated mobile viewport) and reports each pass or fail with its evidence;
none is handed to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Mobile → Dr Souter → Tue 4 Aug AM → the "right total knee" Booking: the procedure text
      shows "right total knee" (Hospital download) alone, no "RTK" beside it; the invoice description
      "right total knee" marked "From the hospital"; the Contract with its name, holder, who is invoiced
      and pricing basis; the RVG code LL4 where the Contract prices from RVG units. History shows
      "Procedure text replaced" naming "RTK" (Surgeon's rooms PDF) with its time. Readable at 375 px; the
      capture cards below are uncrowded.
- [ ] The same Booking on web and in Admin (`/admin/day/2026-08-04/bookings/<id>`): the same parts; on
      Admin, `OfficeBillingSetup` does not repeat the Contract's name or holder. On a fixed-price
      Contract's Booking the RVG code part is absent unless one was picked. On Admin, a Booking on an
      RVG-priced Contract with no code (Foster's, No contract · RVG) reads "RVG code: for the
      anaesthetist to fill in"; the same Booking on mobile reads "RVG code to choose". Pricing bases read
      as formatted ("RVG at your rate" on mobile and web, "Fixed price $...", "Other price $..." on an
      open price with its amount).
- [ ] A Booking with no Contract reads "Needs an invoice destination" in the Contract part on every
      surface, with its text still shown.
- [ ] The order of defaults on Admin Booking detail: Wiremu Tane's lap chole shows "lap chole +/- IOC"
      "From the surgeon's rooms"; Demo actions → Hospital description arrives (default row 12) → Run:
      the procedure text and the invoice description read "lap chole", "From the hospital", and History
      shows the rooms' text replaced. The Doyle Booking shows its Contract's invoice description "From the
      Contract"; firing the action there replaces its procedure text, leaves the invoice description and
      shows the "newer description" cue. An RVG-only Booking (Foster's, No contract · RVG) shows the
      rooms' text, never an RVG group name.
- [ ] Admin "Edit invoice description" on the "right total knee" Booking: free text saves, the procedure
      text does not change, History shows "Invoice description changed"; Hospital description arrives
      (another row) replaces the procedure text, leaves the edit and shows the cue; changing the Contract
      leaves the edit too; "Use it" applies the newer description and History shows "Newer description
      used on the invoice". No label says "provisional". The anaesthetist has no edit on mobile or web.
- [ ] Diane Foster's Booking (Tue 4 Aug AM, 11:00) on mobile: "WLE MM", "RVG code to choose". Demo
      actions → Fire hospital message defaults to MSG-STG-1012 → Run: the hospital's long wording replaces
      "WLE MM", History names "WLE MM" as replaced, the invoice description switched to the new text, the
      time and note updated as before. Fire it again: nothing changes. Same on the PWA sheet (`npm run
      dev:pwa`).
- [ ] S1 as scripted: Tue 28 Jul AM shows three booked cases at 07:45, 09:45 and 11:15 with the rooms'
      wording on two of them; Fire hospital message → MSG-STG-1001 → Sarah Mitchell arrives fourth with
      "lap appy ?conv to open" (Hospital feed) and "Needs an invoice destination" or the office-set
      Contract per 20; S1 Beat 3's picks fill the Contract and RVG parts; the List counts read as the
      guide says; no List attachments panel anywhere.
- [ ] No attachments: no Attachments section on a Booking and no List attachments panel on mobile,
      web or the Admin List drawer; the seeded theatre-list PDF is gone; the Future-scope photo demo
      still prefills the description.
- [ ] The expert rows: each of rows 15, 17, 21, 34 and 35 shows on its Booking on mobile, web and the
      Admin Day; 15, 17 and 35 show "RVG code to choose"; 34 shows S9b with its pre-applied P1.
- [ ] Mobile and web Add a booking on Dr Souter's Tue 21 PM List: save with "Procedure description"
      typed as " L TKJR " (spaces kept) and an RVG code: the Booking shows the text exactly as typed
      with "Anaesthetist"; save with neither: refused with "Type the procedure as told, or choose an RVG
      code.".
- [ ] Admin S2 phone advice (Dr Sharma's Tue 21 PM Free List → Book (phone advice)): the description
      field with Told by Phone, filled by the empty-NHI Look up; the saved Booking shows that wording
      with "Phone" and the invoice description takes it ("As entered").
- [ ] Edit on a Procedure changes the RVG code and the Contract; the procedure text does not change and
      has no edit or add control anywhere, for the anaesthetist or the office.
- [ ] Admin Review on a submitted List with a multi-procedure Booking: the Procedures column shows a
      compact component for every Procedure; the Admin Day List drawer rows show it too.
- [ ] Authorise Dr Morrison's submitted Mon 20 List in Admin Review (S2 Beat 4's path), then open the
      invoice for the TURP seeded with the hospital's "TURP" wording: the heading prints the Procedure's
      invoice description, never a group name; amounts unchanged from the baseline.
- [ ] After Reset, S1 to S5 run as scripted in the patched guide with every figure unchanged; the Data
      Inspector shows `procedureText` and `invoiceDescription` and no `description` or `attachments`.
- [ ] No new string has an en or em dash; teal is the only action colour; no crimson in the component;
      no "Card", "slot", "as given", "provisional" or "DRAFT" for an assigned List in new copy.
- [ ] Catalogue screenshots: the covered recipes created or updated, US-03.1.3's marked absent, the
      broken ones re-pointed, a full `npm run capture` with no failed recipe and no story without a
      recipe, the changed shots checked by eye, `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

Same session, in `docs/demo-guide/` and the same passages of `master-demo-guide.html`:

- **`03-demo-script.md` S1 Beat 1:** the Expected line adds that Sarah Mitchell's Booking shows the
  hospital's text as received ("lap appy ?conv to open") with its Contract and RVG code still to
  choose; the "read its three booked cases" click names the rooms' wording on two of them. Times and
  counts stay. **Remove the optional aside about List attachments** (the theatre-list PDF is gone).
- **S1 Beat 2 ("the Booking fills over the days"):** add an optional aside: open Dr Souter's Tue 4 Aug
  AM List → the "right total knee" Booking: "The rooms sent 'RTK'; when the hospital's list arrived it
  replaced that with 'right total knee', and the original is in the Booking's history. The invoice
  description took the hospital's wording, beside the Contract (who holds it, who is invoiced, how it is
  priced) and the RVG code." Optionally, on Diane Foster's Booking, Demo actions → Fire hospital message
  (MSG-STG-1012) to replace the rooms' "WLE MM" with the hospital's fuller wording live and watch the
  invoice description follow (Future-scope badge: HL7 is illustrative).
- **S1 Beat 3:** the capture step reads the procedure text first: "She sees what the hospital wrote,
  picks the RVG code, and the Contract part shows who is invoiced and the pricing basis; the running fee
  stays hidden." Keep "sees no running fee" in "Worth pointing at".
- **S2 Beat 2 (a phone-advice booking):** the Expected line says the lookup also fills the procedure
  description (Told by Phone) and the saved Booking shows it with "Phone" and as its invoice
  description. Add an optional office aside, "What the invoice will say": Admin Day Tue 21 → Wiremu
  Tane's lap chole → Demo actions → Hospital description arrives: the procedure text and the invoice
  description move from the rooms' "lap chole +/- IOC" to the hospital's "lap chole"; a Contract's own
  invoice description would win over both, the RVG code never does; Edit invoice description shows the
  office's free text, and a later hospital description leaves it with a "newer description" cue: the
  office's edit always wins.
- **`04-presenter-cheat-sheet.md`:** a "Procedure text" line under the anaesthetist and office features:
  one procedure text, the hospital's replacing the rooms' with the original in the history; the invoice
  description by its order of defaults (the procedure text, then a filled-in Contract invoice
  description; never the RVG code) that the office can edit at any time, an edit always winning; the
  Contract (name, holder, invoiced, basis), the RVG code where RVG-priced; no attachments. A
  discovery-point line: the Contract's description taking precedence on the invoice has not been put to
  Ben and Vanessa (they agreed the hospital's text over the rooms').
- **`02-workflows-and-handoffs.md`:** the intake section says each Booking holds the procedure text as
  received from each channel, hand entry kept as typed; the hospital-update paragraph says the hospital's
  text replaces the rooms' and the original stays in the history; drop any attachments step.
- **`01-personas-and-responsibilities.md`:** the anaesthetist's "add a missing Booking" item and the
  office's phone-advice item mention the typed description; drop attachments from the anaesthetist's list.
- **`master-demo-guide.html`:** the S1 Beat 1 to 3 cards and the S2 Beat 2 card, the cheat-sheet,
  workflows and personas sections mirroring the edits above, and the attachments aside removed.
- **`DemoControlPanel.tsx`:** check the S1 scenario text for "operation description" or attachment
  wording and patch it to match.
- Any guide line that names AR-35's wording calls it illustrative demo data, never AA's.

Not a milestone phase: no full consistency read is required.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 20a` first. Recipes and images are never
touched while the plan is updated; this phase's build does it.

**Covered items.**

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) The hospital's procedure text replaces the rooms' | none | create, `captured`. Shot `procedure-text` on web, mobile and admin from Diane Foster's Booking (Tue 4 Aug AM): state `rooms` (only "WLE MM", highlight `[data-shot=procedure-text]`, caption "The procedure text as the rooms sent it"), state `hospital-update` (a `trigger` step firing MSG-STG-1012 on mobile and admin; on the PWA, the Demo sheet; caption "The hospital's text replaces it"). Shot `procedure-text-history` on the "right total knee" Booking on web and mobile: its History sheet showing "RTK" (rooms) as replaced, caption "The rooms' original stays in the Booking's history" |
| [US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) Booking descriptions and Contract shown together | none; status now Verify | create, `partial`, `absentReason` "The hospital matching screen does not exist yet: Phase 33 adds the component to each row." Shot `procedure-stack` on mobile, web and admin on the "right total knee" Booking, highlight `[data-shot=procedure-stack]`, caption "The procedure text, the invoice description, the Contract with its pricing basis and the RVG code"; state `not-matched` on row 17's "blephs" (caption "Not matched yet: the text shows, the Contract and RVG code are still to choose"); state `office-hand-off` on admin Foster's Booking (highlight `[data-shot=procedure-rvg-code]`, caption "The office leaves the RVG code for the anaesthetist to fill in"). Shot `review-stack` on admin Review of a submitted List with a multi-procedure Booking, caption "Office review shows the text and Contract for every Procedure" |
| [US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md) See the Contract on each Procedure | partial · procedure-contract on web and mobile (`BK0009`), `absentReason` "not on the List view before the session" | `captured`, no `absentReason`. Keep the shot name `procedure-contract` (the hook sits on the Contract part): state `before` on BK0009 (an ACTIVE List before the session), state `after` on a Booking of Dr Souter's SUBMITTED Mon 20 List on web (mobile only if the main view reaches it; 38a builds the archive). Caption "The Contract on each Procedure: name, holder, who is invoiced and the pricing basis with its figure" |
| [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking manually | partial · add-card on web and mobile, `manual` caption "Manual entry of the patient and operation"; the optional description kept as typed is not built | `captured`. Keep `add-card`; state `manual` re-captioned "Add a Booking to my List: the patient, the RVG code and the procedure as written"; add state `procedure-description` that types "RTK" into the Procedure description field and highlights `[data-shot=procedure-description]`, caption "The procedure as written on the hospital's list is kept exactly as typed" |
| [US-08.4.6](../../../../requirements-board/requirements/stories/US-08.4.6.md) Invoice description on each Procedure | none | create, `captured`. Shot `invoice-description` on admin Booking detail, highlight `[data-shot=procedure-invoice-description]`: state `rooms` on Wiremu Tane's lap chole ("Starts as the surgeon's rooms' description"); state `hospital` after a `trigger` step running Hospital description arrives ("The hospital's description replaces it when it arrives"); state `contract` on the Doyle Booking ("A filled-in Contract invoice description takes the place of both; the RVG code plays no part"); state `edited` after Edit invoice description then the trigger, showing the cue ("The office edits it as free text and the edit wins; a newer description is shown, not applied"). State `printed` on Dr Morrison's TURP invoice, highlight `[data-shot=invoice-lines]` ("The invoice prints the invoice description") |

**Recipes this phase breaks or makes untrue** (keep shot names; run `node scripts/capture.ts --dry` in
`requirements-board/` to find any this list misses: every step or highlight on `procedure-header`,
`procedure-contract`, `[data-testid=procedure-header] + div`, "Operation description", attachments
hooks, the Review table's "Contract" or "Code" columns):

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md) Attachments (Retired) | captured · `attachments` on web and mobile, and the List attachments shots | `absent`, no shots, `absentReason` "Retired: removed in Phase 20a" (as US-02.4.3 after 15b); the catalogue's images are left as they are |
| [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) | partial · web and mobile highlight `[data-testid=procedure-header] + div` (the old context line) | under whatever shot names 20 left, re-point every web and mobile Booking-detail highlight still on `[data-testid=procedure-header] + div` to `[data-shot=procedure-contract]`; the `billed` state now shows the Contract part's "Invoiced" line; 20's captions stay |
| [US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) | partial · `added` highlights `procedure-header >> nth=1` and `procedure-contract >> nth=1` | keep both hooks; re-check the second Procedure shows "No description received" and "Needs an invoice destination"; caption unchanged |
| [US-03.1.1](../../../../requirements-board/requirements/stories/US-03.1.1.md), [US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) | wait on `[data-testid=procedure-header]`; US-03.4.1 clicks `[data-testid=procedure-header] >> text="Edit"` | hold if the testid and the Edit action stay on the heading row (item 10); fix only what `--dry` fails; captions are 20's |
| [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) | captured · `review-contracts`, caption "Office review of each Booking's route, Contract, codes and flags" | re-caption `review-contracts` "Office review of each Procedure's text and Contract, with the flags" (21a re-captions again for the flags). The `correct-contract` shot finds the office block by its "Office billing setup" text and "Edit billing setup" button: keep both on the slimmed `OfficeBillingSetup` or re-point; its captions are 20's |
| [US-11.1.3](../../../../requirements-board/requirements/stories/US-11.1.3.md) | `linked` fills `[placeholder="Operation description"]` on web and mobile (unless 19 or 20 already changed it) | fill the RVG code or "Procedure description" as the form now asks; captions unchanged ([US-14.4.1](../../../../requirements-board/requirements/stories/US-14.4.1.md)'s recipe opens the same form but fills no description: re-check with `--dry` only) |
| [US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md) | partial · mobile capture on BK0009 | re-take; the caption stays (the component sits above the large capture controls) |

**ATLAS.md.** "Existing hooks": add `procedure-stack`, `procedure-text`,
`procedure-invoice-description`, `procedure-rvg-code`, `procedure-description`, and note
`procedure-contract` now marks the Contract part; remove `booking-attachments`, `list-attachments`,
`admin-list-attachments` and `add-attachment-sheet` and the seeded theatre-list PDF rows. "Seed data
worth shooting": the "right total knee" Booking (its id) with "RTK" in its history, Foster's "WLE MM"
Booking before and after MSG-STG-1012, the expert rows and their Lists, Sarah Mitchell's arrival wording,
and a line that AR-35's wording is AI-made demo data. "Overlays that need clicks": the History sheet's
replaced-text entry, "Edit invoice description" and its "Use it" cue, the Procedure description field.
"Demo control panel and Demo actions": Fire hospital message now also on Booking routes with a
per-Booking default; the new Hospital description arrives on Admin Booking detail. Seed data adds Wiremu
Tane's lap chole and the Doyle Booking with a Contract invoice description (their ids).

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run
shots` are green, and before writing the PROGRESS entry, run the standard adversarial review-and-fix
pass (PROGRESS convention 18): independent Opus review subagents for **quality**, **bugs/correctness**
and **plan adherence**. This session verifies every finding against the catalogue and the code, fixes
the confirmed ones (with a test where a bug had none), re-greens and records the pass. Do not re-raise
anything settled in the Decisions log, except the 2026-09-28 ruling this phase supersedes in part.

**Steer this phase's reviewers at:**
- **One text, one write path.** The Procedure holds one `procedureText`, verbatim; after create it
  changes only through `replaceProcedureText` (`ProcedurePatch` excludes it, `editProcedure` refuses it,
  no screen edits it); every replace writes the replaced text, source and time to the audit history
  (never a second field on the Procedure); an identical text, or a rooms' text over a hospital's,
  changes nothing; a whitespace-only text is never stored; no hand-edit or "add a description" control
  survives.
- **The invoice description** is a field of its own with its provenance: D37's order (the Procedure's
  text; the hospital's replacing the rooms' as the text; a filled-in Contract invoice description over
  it; a blank one falls through), computed only in `startingInvoiceDescription`, which never reads the
  RVG code; applied only through `refreshInvoiceDescription`, which every text replace and Contract
  change calls and which always keeps an admin's edit (D73 answered, no provisional label anywhere)
  while the view shows the `newer` cue; edited by the office alone, free text, and an edit never touches
  the procedure text. The invoice heading prints it.
- **Every intake path writes it:** S12, S13, S14, PDF create and update, mobile and web manual, Admin
  phone advice, the Future-scope photo prefill; none invents a fallback wording.
- **One place.** The view, `whoIsInvoicedFor`, `pricingBasisFor`, `startingInvoiceDescription`,
  `refreshInvoiceDescription`, `replacesProcedureText` and `procedureLabel` live only in
  `domain/billing/procedureStack.ts`; the component derives nothing; no screen re-derives the payer or the
  basis; `whoIsInvoicedFor` wraps 20's `billedPartyFor` rather than copying it; no Contract line,
  version or staged change appears anywhere (the flat model).
- **RVG code:** shown wherever held; "to choose" where an RVG kind needs it, "for the anaesthetist to
  fill in" on an office surface; absent on a fixed or open price with none picked.
- **Attachments fully gone:** no type, store action, seed row, `AT` prefix, UI hook or spec left, no
  existing seeded id shifted by the removal, and the Future-scope photo demo still works.
- **No figure moved:** the parity check holds; S1 to S5 counts and names hold; no existing seeded id
  (including audit ids, with the new history row added last) shifted.
- **The seed:** AR-35's rows placed as the table says (or the moves recorded), labelled AI-made in
  comments, deterministic; `PERSIST_VERSION` bumped.
- **The UI:** empty parts say still to choose in neutral, never a status colour; 375 px is uncrowded;
  compact density truncates with a title; the Contract part keeps `procedure-contract`; `pwaPurity`
  holds; teal-only actions; no en or em dashes.
- **The triggers:** Fire hospital message keeps its Future-scope badge with a correct per-Booking
  default; Hospital description arrives sits on the Admin Booking route only, writes through
  `replaceProcedureText` (no second path to the invoice description), reports the right one of its
  outcomes and draws only AR-35's hospital wordings; nothing added to the Control Panel page.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"):
  - The procedure text, invoice description, Contract and RVG code on the Booking (Mobile, Web and Admin:
    Dr Souter's Tue 4 Aug AM "right total knee" Booking) and in Admin Review; US-03.1.9 (Verify): whether
    the layout reads clearly, and whether the anaesthetist should see the same parts as the office.
  - The hospital's text replaces the rooms' with the original in the change history (Ben, Vanessa and
    Donald, 5 November; not yet put to Greg). Our readings: a rooms' text arriving after the hospital's
    does not replace it; the office cannot add to or reword the text (US-02.5.7: nobody edits it), so
    "Add a description" is not built; Phase 35's history screen reads the replace entry.
  - The anaesthetist now sees the Contract's name, holder, who is invoiced and pricing basis (US-03.1.2;
    US-03.1.9 Verify) against US-15.0.1's Proposed note "see none of the Contract complexity": built the
    catalogue's way; the running fee stays hidden.
  - The invoice description's order of defaults (D37, extended 5 November: the Contract's description on
    top) and OQ-130 (D73: an admin's edit always wins; the cue and "Use it" kept as a convenience), built
    as answered with no label. Not put to Ben and Vanessa: the Contract's description taking precedence.
    Our readings: a hand-entered text stands in for the rooms' at the bottom layer, and the office's edit
    stops at AUTHORISED (D63) although US-08.4.6 says "at any time".
  - Attachments removed (RV-01): Booking and List attachments and the seeded theatre-list PDF are gone.
  - AR-35's rows reused on sources its table did not name (row 14 on a hospital feed) and rows 26 and
    27 paired as one Booking's rooms and hospital wording; any placement moved from the table.
- **Status.** A catch-up status row for Phase 20a, DONE at the end.
- **Phase entry:** the drift-check result against `efe123c` and the names reused from 18 to 20; both
  inventory greps before and after with any accepted leftover; the placement table as built with each
  new Booking's id; the `PERSIST_VERSION` bump; the parity check; the checklist item by item with
  evidence; Vitest and Playwright counts before and after; the review pass.
- **Decisions log:**
  - **Procedure text** (US-02.5.7, DM-51): `Procedure.description` is replaced by one `procedureText`
    (rooms', hospital's or hand-entered, with its source and time), written by every intake path, never
    hand-edited; the hospital's replaces the rooms' and the replaced text goes to the change history
    (supersedes the Phase 11 PDF ingest "UPDATES it (scheduled time + operation)" behaviour for the
    operation half, and the side-by-side reading until 5 November).
  - **The invoice description** (US-08.4.6, D37 and D73 answered): a field of its own with a provenance
    record, set by the order of defaults (the procedure text; the Contract's invoice description over it;
    never the RVG code) in `startingInvoiceDescription`, applied through `refreshInvoiceDescription`,
    edited by the office as free text, printed by the invoice; an admin's edit always wins, with a
    "newer description" cue as a convenience. The general procedure's invoice wording is gone with the
    procedure master.
  - **One component** (US-03.1.9, US-03.1.2): `ProcedureStack` on every Booking screen, Admin Review and
    the List drawer, reading one view from `domain/billing/procedureStack.ts`; "who is invoiced" and
    "pricing basis" are one function each, for 21 and 24 to re-point.
  - Supersede in part **2026-09-28 "Anaesthetist Card shows no calculation"**: the running fee and the
    Booking total stay hidden from the anaesthetist, but the Contract's pricing basis and its figure show.
  - **Attachments removed** (RV-01, US-03.1.3 Retired): supersedes the Phase 15 List attachments and the
    Booking attachments ruling.
- **Catalogue screenshots:** the recipes created (US-02.5.7, US-03.1.9, US-08.4.6), changed (US-03.1.2,
  US-02.4.1, and the broken ones re-pointed), US-03.1.3 marked absent, and the `REPORT.md` counts before
  and after (captured, partial, absent, failed).
- **Handoff notes:** Phase 21 re-points `whoIsInvoicedFor` to the payer and Phase 21a adds the flags to
  Review; Phases 22 and 27 print the invoice description; Phase 23's primary Procedure becomes the intake
  target for the text; Phase 24 re-points `pricingBasisFor`; Phase 33 puts `ProcedureStack` on every
  matching row and applies a row's text through `replaceProcedureText` (name as recorded), so the
  invoice description goes through `refreshInvoiceDescription` (and the cue where edited); Phase 35's
  history screen reads the `procedure.procedureText.replace` entry's `before` for the replaced text and
  needs no `addSourceText` or "Add a description" (there is none), and reuses `setInvoiceDescription` and
  the cue for the office's amend flow until AUTHORISED; Phase 43's generator builds `procedureText` and
  `invoiceDescription` through the same types; Phase 43a keeps the component on the anaesthetist screens;
  Phase 44 rewrites S1 around the text, the Contract choice and the invoice description.
