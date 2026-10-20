# Phase 20a · Booking descriptions, the invoice description and the Contract on each Procedure

**Requirements covered:**
[US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) Keep the procedure text as received (Confirmed; graded **Contradicts**: today's one editable `Procedure.description` doubles as the received text, is trimmed on create and is overwritten by PDF updates and Edit procedure) ·
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) Booking descriptions and Contract shown together (**Open**; graded Contradicts; the layout is not settled, [OQ-103](../../../../requirements-board/requirements/questions/OQ-103.md) open) ·
[US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md) See the Contract on each Procedure (Confirmed; graded Partial: no holder, who is invoiced or pricing basis with its figure) ·
[US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking manually (graded Partial: hand entry is not kept as source text) ·
[US-08.4.6](../../../../requirements-board/requirements/stories/US-08.4.6.md) Invoice description on each Procedure (Proposed; **Missing**; joined 2026-10-20) ·
[DM-51](../analysis/domain-model-delta.md#dm-51) each Procedure keeps the rooms' and the hospital's descriptions as received, plus a separate invoice description ·
[RV-01](../analysis/reverse-check.md#rv-01-attachments-on-bookings-and-lists-are-fully-built) attachments on Bookings and Lists built though [US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md) is **Retired**: remove (joined 2026-10-20).
**Leans on, not covered:**
[US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md) (Phase 35's: the office's add and amend flow; this phase builds the append-only store action 35 reuses),
[US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) and FT-02.5 (Phase 33's: each matching-screen row shows its text as received; 33 adds this phase's component to its rows),
[US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) (Phase 21's: office review; this phase puts the component into Admin Review, 21 adds the payer, the warnings and the invoice-description edit at review),
[US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) (Phase 19a's Contract line and its description),
[US-08.4.1](../../../../requirements-board/requirements/stories/US-08.4.1.md) (Phase 22's invoice layout, which prints the invoice description on each line),
[US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) (Phases 19 and 20: the optional RVG code, then the Contract),
[US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md) (Phase 43a's; its Proposed note "anaesthetists see none of the Contract complexity" yields to US-03.1.2 and US-03.1.9 here, see Goal) and
[OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md) (which field carries the text in each hospital's download or feed: unknown; the simulated feeds' SCH-7 and `Appointment.description` stand in).
**Open, build the default:** [OQ-103](../../../../requirements-board/requirements/questions/OQ-103.md)
(owner decision **D37**, Open, retitled "Which description goes on the invoice": agreed in principle, the
Procedure's invoice description starts as the Contract line's description, else a copy of the Booking's
description, and the office may edit it. Still open and built as the default, labelled provisional in
one place: what it says for an RVG-only pick (the Booking's description, never a group name such as "H1
minor procedures"), the hospital's description when a hospital is billed (not built) and the office
edit at review). The general-procedure wording of the old D37 is withdrawn with the procedure master.
D33 (no procedure to match, the RVG code optional) is answered and built by 20 and 21: no label here.
**Depends on:** Phase 20, done (one Contract per Procedure, mandatory at setup, the "Needs a Contract"
list, No contract (RVG) first, the optional RVG code and 20's interim "who is billed" function), and
through it 19 (RVG groups, the optional RVG code on the Procedure), 19a (Contract lines with a
description, starting values filled onto the Procedure), 19b, 18 (contract holders, dated Contracts, the
AA code, the one stored No contract (RVG)), 38a, 15b (Copy and photo out, ACTIVE for an assigned
List), 15a (warnings), 15 (Booking vocabulary, `Booking.source`, and the attachments this phase
removes) and 14 (the trigger registry). Runs straight after 20 and before 21 and 33.
**Estimated:** 2 sessions. Session 1: work items 1 to 8 (inventories, the model, the one pure module,
the store, every intake path, the reader sweep, removing attachments, the seed from AR-35, tests),
ending green with the UI changed only as far as it must compile. Session 2: items 9 to 16 (the
`ProcedureStack` component and its placement in both apps, the description field, the invoice
description's edit and print, the trigger re-point, shots, demo guide). If session 2 runs long, cut the
"Add a description" action on an existing Booking (item 9e) before any placement.

## Goal

Three things, built together because they are one field set and the one place every booking screen
reads it.

**Each Procedure keeps the text exactly as each system sent it** (US-02.5.7, DM-51). The procedure on a
Booking is now just this text: there is no procedure master or list to match it to (OQ-88), and the
anaesthetist reads it as the input for choosing the Contract and the RVG code. The wording that arrives
is shorthand in endless variety ("RTK", "WLE MM", "blephs"), and the hospital's often spells out what
the rooms abbreviated. Today one free-text `Procedure.description` does every job, is trimmed on create
and is overwritten by a PDF update and by Edit procedure. This phase splits it:

- Each Procedure holds an **append-only list of source texts**, each with the system it came from (the
  surgeon's rooms by PDF, email or booking; the hospital's download or feed; or entered by hand: phone,
  the office, the anaesthetist) and when it arrived. A text is stored character for character and never
  edited or overwritten; a later different wording is **added beside it** with its source and time. The
  rooms' and the hospital's descriptions are kept and shown apart. A Procedure may have none.
- **Every intake path writes it.** Hand entry (US-02.4.1) keeps what was typed or told as its source
  text: the anaesthetist's manual add on mobile and web, the office's phone-advice form, the hospital
  message apply path (create and update, until Phase 33's matching screen takes over) and the
  Future-scope PDF ingest. The form stops auto-filling the text from an RVG code's description and stops
  trimming. There is no separate "as given" field: the text typed is the source text.
- **Edits change the RVG code and the Contract, never the received text.**
- Today's `Procedure.description` becomes the first source text of every seeded Procedure in one step,
  and the `PERSIST_VERSION` bump reseeds persisted rehearsal state, so no stored row keeps the old shape.

**The invoice description** (US-08.4.6, OQ-103's default). Each Procedure also holds an invoice
description, a field of its own: the wording the invoice prints. It starts as the chosen Contract line's
description where the line has one, otherwise as a copy of the Booking's description (the rooms' text,
else the hospital's, else the hand-entered text), is re-derived when the line changes until the office
has edited it, and is **editable by the office without touching the received texts**. For an RVG-only
pick it is the Booking's description, never a group name. Phase 21 puts the edit at review and 22 lays
the invoice out; this phase adds the field, its starting rule, the office's edit on the Admin Booking
and one heading row per Procedure on the invoice that prints it.

**One shared component shows it all on every booking screen** (US-03.1.9, US-03.1.2; views may differ
per app; the screen's exact layout is Open, so it lives in one component). Each Procedure shows: the
**received descriptions** (the rooms' and the hospital's), the **invoice description**, the **Contract**
(its name, [holder](../../../../requirements-board/requirements/stories/US-04.1.5.md), who is invoiced, and the pricing basis with its
figure: "Fixed $2,400", "10% off RVG", "$125.00 per unit", "RVG") and the **RVG code, only where the
Contract prices from RVG units** (a fixed price makes it unnecessary). The Contract and the RVG code can
be set in either order, so an empty part is marked **still to choose**, and a Booking with no Contract
stays on 20's "Needs a Contract" list. One `ProcedureStack` component (in `src/shared`, PWA-safe)
renders it on the shared `BookingDetailBody` (mobile, web, Admin and the PWA at once), in Admin List
drawer rows and in Admin Review, where every Procedure shows. Phase 33 adds it to the matching screen.
The component reads one view type from one pure module; **"who is invoiced" and "pricing basis" are
each one function**, so Phase 21 (the payer) and Phase 24 (the one price precedence) change what they
return without touching the component. Mobile may show less than web (US-03.1.9: a larger screen can
break a Booking into more fields); the default is the same parts, compact on a phone.

**The pricing model stays in one place.** The Contract and RVG parts read the booking procedure's
Contract (and line) and RVG code, which the technical design v6 shapes ([AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md)
region `booking-procedure`; [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md)
region `booking-procedure-fields`) and the plain-language guide explains ([AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md)
regions `booking-to-invoice` and `booking-updates`). The pricing model is Greg's proposal: field names
are for orientation, the catalogue wins. So the view type, the two selectors, the invoice-description
rule and the label helper live in one new module, `aa-prototype/src/domain/billing/procedureStack.ts`,
beside the structures 18 to 20 built; the `SourceText` type sits on `Procedure`; and the UI reads only
the view type.

**The anaesthetist sees the Contract summary.** US-15.0.1's Proposed note ("today anaesthetists see none
of the Contract complexity") yields to US-03.1.2 (Confirmed; Greg: the closer to today's mobile app the
more buy-in) and US-03.1.9: the Booking shows the Contract's name, holder, who is invoiced and pricing
basis. The 2026-09-28 Decisions-log ruling "Anaesthetist Card shows no calculation" stands for the
running fee and the Booking total (still hidden) and is superseded only in that the pricing basis and its
figure show. Phase 43a keeps the component when it simplifies the anaesthetist screens.

**Attachments go** (RV-01; US-03.1.3 Retired 16 October: Greg "comfortable removing this feature", Ben
does not want the rooms' PDFs on a Booking). Booking and List attachments on mobile and web, the office's
read-only List attachments, the store actions, the types and the seeded theatre-list PDF are removed
(item 7), and US-03.1.3's recipe is marked absent.

**Demo wording comes from AR-35.** The seed takes realistic shorthand from the illustrative table in
[AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md) (the note
[2026-10-08-procedure-picker-and-source-text.md](../../../../requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md),
its "Illustrative source wording" heading). The table is **AI-made, not from AA**: the seed says so in
its comments and nothing presents it as AA's data. AR-35 declares no named regions: cite the heading by
name (or its slug `AR-35#illustrative-source-wording`, a spot the schema allows and US-02.5.7 and
US-03.1.9 already cite), never invent an anchor or edit the artifact. Use only its "As received" and
"RVG code" columns: its "Procedure (invoice wording)" column is a procedure-list idea that has gone.
The seed places rows 14, 15, 17, 21, 34 and 35 (the ones that need an expert to read) and rows 1 and 2 as
**one Booking from two sources** (the rooms' "RTK", then the hospital's "right total knee").

No billing figure moves. The component, the source texts, the invoice description and its heading are
display and record; the engine prices exactly as 20 left it, and S1 to S5 run with every figure
unchanged.

## Before you start: drift check

1. Run the catalogue diff since this plan's baseline (`d4db277`):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-02.5.7,US-03.1.9,US-03.1.2,US-02.4.1,US-08.4.6,US-03.1.3,US-02.3.1,US-02.1.2,US-07.2.2,US-15.0.1,US-04.2.4,FT-03.1,FT-02.5,OQ-103,OQ-13
   ```

   Read the hunks for those items and the domain-model's Procedure bullets on the descriptions and the
   invoice description. Use Node 22.18 or newer (`nvm use 24` if the shell's default is older) for the
   board's `source` script: `npm --prefix requirements-board run source -- --item US-03.1.9 --text`
   prints the cited passages.
2. If an item changed, re-read it and adjust the work items. Specifically:
   - **US-03.1.9 or US-03.1.2.** If the parts shown, their order or the per-app difference changed (it
     is Open), build the catalogue's current reading in `procedureStack.ts` and the component, and log
     it. If the Contract part was taken off the anaesthetist's screens (for example US-15.0.1 promoted
     to Confirmed with that rule), build the catalogue's reading, keep the part for the office and log it.
   - **OQ-103.** If answered, build the answer and drop its provisional label (the RVG-only wording, the
     hospital-billed description, the office edit at review); it lives in `startingInvoiceDescription`.
   - **US-08.4.6.** If the starting rule or who may edit changed, change only that function and the
     edit's rights.
   - **US-02.5.7 / US-02.4.1.** If the text moved off the Procedure (onto the Booking, say), keep one
     list per Booking with the same rules and adjust items 2, 4 and 5; if an "as given" field came back
     as a separate field, add it beside the typed description and log it. If the anaesthetist's
     rewording with history (Donald, 16 October: which field is unsaid) was settled, say where and build
     it as its own appended entry, never an edit of a received text.
   - **US-03.1.3.** If attachments were un-retired, stop and tell the owner.
   - **A stop condition:** if the received descriptions were Retired or moved to Future Work, stop and
     tell the owner (this phase would no longer make sense).
3. **Confirm the phases this builds on are DONE**, from their PROGRESS entries, and note the names
   they actually used (this plan's names are placeholders; reuse theirs, never a second copy):
   - **19:** the Procedure's RVG code field and its picker; whether `Procedure.description` survived 19
     (and what it holds now); the RVG group master (name, base units) the RVG code part reads.
   - **19a:** the Contract line's description field and the lookup of the line for a Procedure; the
     starting-values step that fills the Procedure from the line (the invoice description starts there,
     item 4) and what resets on a Contract change.
   - **18:** the `ContractHolder` master (name, billable party), the AA code, No contract (RVG)'s id.
   - **20:** the interim who-is-billed function (the holder's billable party, else the Procedure's
     `billablePartyId` override, else the patient) and its name; the Contract picker and "Needs a
     Contract" list; whether a Booking with no RVG code exists in the seed; whether `EditProcedureSheet`
     still carries a free-text "Operation" field; what the manual form's procedure input now is; and
     `OfficeBillingSetup`'s current rows.
   - **15 / 15b:** where Booking and List attachments were built (the inventory in item 1) and whether
     the Future-scope photo demo still hands an attachment to the manual form.
   Note the current `PERSIST_VERSION`. If 20 is not DONE, stop: the Contract part needs one Contract
   per Procedure.
4. **Open questions** (build the default, label it provisional where it shows, log it on the owner's
   review list):
   - **OQ-103 (D37):** the invoice description starts from the line's description, else a copy of the
     Booking's description; for an RVG-only pick it is the Booking's description; the office may edit it.
     The provisional label sits on the RVG-only wording and the unbuilt hospital-billed variant, in one
     place (`startingInvoiceDescription`'s comment and one note on the Admin edit).
   - **OQ-13:** the simulated feeds' SCH-7 description and FHIR `Appointment.description` are the
     hospital text; no real hospital field is assumed.
5. Record the result (changed items, the names reused from 18 to 20, the defaults) in the PROGRESS entry.

## Reference

**Design (convention 17).** [Design Language.dc.html](../../../design/Design%20Language.dc.html) for
tokens: Spline Sans Mono with tabular numerals for data (RVG codes, AA codes, figures and the received
wording, which is data shown verbatim), Schibsted Grotesk for labels; the small uppercase section label
treatment (11px, 600, letter-spaced, mist) that `BookingDetailBody`'s `Section` already uses; teal
`#0D6E63` the only action colour (Edit, Add a description); crimson never. Status colours are for List
and session status, not for "still to choose": mark empty parts in neutral mist with a dashed or
hairline treatment. [Mobile App.dc.html](../../../design/Mobile%20App.dc.html) screen 3 (the Booking
detail and its procedure block), [Web Dashboard.dc.html](../../../design/Web%20Dashboard.dc.html) for
density, [Admin Review.dc.html](../../../design/Admin%20Review.dc.html) for the review table and
[Admin Day.dc.html](../../../design/Admin%20Day.dc.html) for the List drawer. No mockup draws this
block: extend the procedure block's own pattern (convention 17). It must read cleanly on a 375 px phone
without crowding the capture controls below it.

**Catalogue.**
- The covered items above. US-03.1.9's ACs ("Parts shown", "Both apps", "Contract summary", "Not matched
  yet", "Fuller wording kept"), US-02.5.7's ("Verbatim", "Never overwritten", "Entered by hand") and
  US-08.4.6's three are the test lists.
- [domain-model.md](../../../../requirements-board/requirements/domain-model.md): Procedure's bullets on
  the descriptions received and the invoice description, and the Booking section's pointer to them.
- The note [2026-10-08-procedure-picker-and-source-text.md](../../../../requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md)
  (artifact [AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md)): points #6 to #9 and
  its "Illustrative source wording" heading (35 rows; the closing paragraph names the rows that need an
  expert: 14, 15, 17, 21, 26, 27, 34 and 35). The 2026-10-16 Greg notes #35 to #38 (the invoice
  description) are read with `npm --prefix requirements-board run source -- --item US-08.4.6 --text`.
- Questions: OQ-103 and OQ-13.

**The pricing model (v6; keep it in one place).** [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md)
regions `booking-to-invoice` (the office selects the Contract, the anaesthetist reviews and may change
it until submit) and `booking-updates`; [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md)
region `booking-procedure-fields` (the fields the Contract and RVG parts read; the draft has no
description fields, so the types here are ours); [AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md)
region `booking-procedure`.

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
  `apps/admin/screens/ReviewScreen.tsx`.
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
- **Triggers:** `shared/demoTriggers/registry.ts` (`fire-hospital-message`), `pwa/pwaPurity.test.ts`.
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
   grep -rn -e "\.description" -e "operation" -e "Operation" aa-prototype/src aa-prototype/visual aa-prototype/pwa | grep -v -i -e "contract" -e "modifier" -e "demoTrigger" -e "billingLine" -e "line\.description" -e "scenario"
   grep -rln -i "attachment" aa-prototype/src aa-prototype/visual aa-prototype/pwa
   ```

   Sort the first into Procedure-wording readers (this phase moves them) and everything else (RVG code,
   modifier, Contract, line, billing-line and trigger descriptions, which stay).

2. **The model** (`domain/types.ts`, beside `Procedure`).
   - `SourceTextChannel = 'surgeonPdf' | 'email' | 'hospitalDownload' | 'hospitalFeed' | 'phone' |
     'anaesthetist' | 'unrecorded'`, and `SourceText { text: string; channel: SourceTextChannel;
     receivedAtISO: IsoDateTime; from?: string }` (`from` names the sender where known).
   - `Procedure.sourceTexts: SourceText[]` (required, may be empty), in arrival order, replacing
     `Procedure.description` (or what is left of it after 19 and 20). Doc comment: US-02.5.7, DM-51,
     "append-only: written only by `addSourceText` and the create paths; never edited, never overwritten";
     AR-29's `booking-procedure-fields` has no such field, so a later design adds it in this type.
   - `Procedure.invoiceDescription: { text: string; origin: 'contractLine' | 'booking' | 'edited' }`
     (US-08.4.6; origin lets the starting rule re-derive until the office edits).
   - `store/lifecycle.ts`: `ProcedurePatch` becomes `Partial<Omit<Procedure, 'id' | 'bookingId' |
     'sourceTexts' | 'invoiceDescription'>>`, so no edit path touches either; `editProcedure` also
     refuses a patch object carrying `sourceTexts` at run time (a guard with a test). The invoice
     description changes only through `setInvoiceDescription` (item 4).

3. **One pure module** (`domain/billing/procedureStack.ts`, exported through `domain/billing/index.ts`;
   no React, no store import). The only place that decides what the component says, reading the
   structures 18 to 20 built.
   - **Types the UI reads:** `ProcedureStackView { received: { rooms: SourceText[]; hospital: SourceText[];
     entered: SourceText[] }; invoiceDescription: { text: string; origin }; contract: { name: string;
     aaCode?: string; holderName: string; invoiced: InvoicedParty; basis: PricingBasis } | null; rvg: {
     code: string; description: string } | 'toChoose' | null }`, `InvoicedParty { name: string; kind:
     'holder' | 'patient' | 'payer' }` and `PricingBasis = { kind: 'fixedPrice'; amount: number } | {
     kind: 'fixedRate'; perUnit: number; discountPercent?: number } | { kind: 'fixedDiscount'; percent:
     number } | { kind: 'rvg' }` (a fixed rate and a fixed discount can sit on one line, US-05.2.6).
     No first-party or third-party flag.
   - **`procedureStackView(procedure, ctx)`** with `ctx` holding the masters, the Booking, its List and
     patient. `received` groups `sourceTexts` by channel (`surgeonPdf` and `email` to rooms;
     `hospitalDownload` and `hospitalFeed` to hospital; `phone`, `anaesthetist` and `unrecorded` to
     entered), each in arrival order. `contract` is null when the Procedure has none (20's "Needs a
     Contract"). `rvg` is the code and its RVG group's description **only where the Contract prices from
     RVG units** (basis `rvg`, `fixedRate` or `fixedDiscount`); `'toChoose'` where it is RVG-priced and no
     code is held; `null` on a fixed price (the code is unnecessary and not shown). With no Contract the
     RVG part shows a held code, else `'toChoose'`.
   - **`whoIsInvoicedFor(procedure, ctx): InvoicedParty`**: one function that wraps 20's interim
     who-is-billed function and only names the party (never a second derivation). Its comment says
     Phase 21 re-points it to the holder's billable party or the payer on the Booking (AR-28
     `who-gets-the-invoice`, AR-29 `billable-party`).
   - **`pricingBasisFor(procedure, ctx): PricingBasis`**: one function reading 19a's Contract line for
     the Procedure: a fixed price gives `fixedPrice`, a fixed rate `fixedRate` (with `discountPercent`
     where the line also has a discount), a discount alone `fixedDiscount`; No contract (RVG) and a
     plain RVG Contract with no line give `rvg`. Its comment says Phase 24 re-points it to the one price
     precedence and that it shows the basis, never the computed fee.
   - **`startingInvoiceDescription(procedure, line, bookingDescription)`**: the line's description
     where the line has one (`origin: 'contractLine'`), else a copy of the Booking's description (the
     rooms' first text, else the hospital's, else the hand-entered text; `origin: 'booking'`), never an
     RVG group's name; empty when there is no text. A helper `refreshInvoiceDescription` applies it
     unless `origin` is `'edited'`. Its comment carries the OQ-103 provisional note (the RVG-only
     wording, the hospital-billed variant not built). 19a's starting-values step calls it.
   - **`procedureLabel(procedure, masters, ordinal)`**: the short label every list, total, history
     scope and sheet title uses: the Booking's description (the rooms' text, else the hospital's, else
     the entered), shortened and quoted; else the RVG code and its description; else "Procedure n".
   - **Tests** (`procedureStack.test.ts`): a Southern Cross fixed-price fixture gives the US-03.1.9
     "Contract summary" AC (name, Southern Cross as holder, who is invoiced, the fixed price) and a
     null `rvg`; fixed rate, fixed discount, a rate with a discount, No contract (RVG) and a plain RVG
     Contract give their kinds with `rvg` shown; no Contract gives `contract: null` and keeps `received`
     ("Not matched yet"); rooms and hospital texts group apart and keep arrival order ("Fuller wording
     kept"); `startingInvoiceDescription` for a line with and without a description, an RVG-only pick
     (never a group name), no text, and a refresh that leaves an `'edited'` description alone;
     `procedureLabel`'s three fallbacks.

4. **The store: append only, verbatim.**
   - **`addSourceText(api, actor, procedureId, { text, channel, from? })`** (in `store/bookingActions.ts`
     or a new `store/sourceTextActions.ts`, exported from `store/index.ts`): appends one `SourceText`
     stamped with the demo clock, audited `procedure.sourceText.add` with `after: { text, channel }`.
     Rights follow `editRefusal(actor, list)` (the same rule as `editProcedure`). A blank or
     whitespace-only text is refused ("Type the description as given."); a text identical character
     for character to one the Procedure already holds is not added again and returns `ok` with `added:
     false` (a replayed message adds nothing). Stored exactly as given: no trim, no case change. After
     an add it calls `refreshInvoiceDescription` (the starting rule re-derives only while not edited).
   - **`setInvoiceDescription(api, actor, procedureId, text)`**: office only, until AUTHORISED (D63),
     sets `{ text, origin: 'edited' }`, audited `procedure.invoiceDescription.set` with before and after;
     a blank text is refused ("The invoice needs a description."). The anaesthetist has no edit.
   - **`createBooking`**: `CreateBookingInput.operation` goes; it gains `sourceText?: { text; channel;
     from? }`. The first Procedure's `sourceTexts` holds that text, verbatim, when not blank, and its
     `invoiceDescription` starts from it. The refusal becomes "Type the procedure as told, or choose an
     RVG code." when there is neither a non-blank text nor an RVG code (D33: the code is optional, the
     Booking just needs something to show). The `procedure.create` audit records `sourceText` instead of
     `description`.
   - 19a's starting-values step (where the line or the Contract changes) calls
     `startingInvoiceDescription`, so choosing a line with a description sets the invoice description
     and a line change re-derives it until edited; no change to 19a's other values.
   - `addProcedure` and the post-op addendum skeleton: `sourceTexts: []`, `invoiceDescription` empty.
   - Labels: `actionLabels.ts` gains `'procedure.sourceText.add'` ("Description added as received") and
     `'procedure.invoiceDescription.set'` ("Invoice description changed"); `fieldLabels.ts` replaces
     `description` with `sourceTexts` ("Description as received") and `invoiceDescription`.
   - Tests (`store/sourceText.test.ts`): verbatim (leading spaces, "?conv", "+/-" and a misspelling
     survive); never overwritten (a second different text appends, the first untouched); the exact
     duplicate adds nothing; blank refused; the anaesthetist refused on a SUBMITTED List, the office
     allowed per its rules; `editProcedure` refuses `sourceTexts` and `invoiceDescription` patches;
     `createBooking` with only text, only an RVG code, both and neither (refused); the invoice
     description starts from a line, from the Booking, survives an office edit across a later hospital
     text, and the edit leaves every received text unchanged (US-08.4.6's third AC).

5. **Every intake path writes the description** (`store/integrationActions.ts` and the forms).
   - **Hospital feed create (S12):** pass `parsed.operation` as the source text, channel
     `hospitalFeed`, `from` the feed's hospital, verbatim. No invented fallback: a message with no text
     creates a Procedure with none (the component says "No description received"). The Contract and RVG
     code stay as 20 left this path (the office sets the Contract). A comment notes Phase 33 moves
     hospital rows behind the matching screen.
   - **Hospital feed updates (S13 and S14):** when the parsed message carries text that differs from
     every text on the Booking's first Procedure, append it (`addSourceText`, channel `hospitalFeed`)
     after the time change, in the same apply; identical text adds nothing. Never edit the RVG code,
     the Contract or an existing text. A cancelled Booking or a locked List parks as today.
   - **Surgeon PDF ingest (Future scope):** the create path passes `row.operation` as the source text,
     channel `surgeonPdf`; the update path appends with `addSourceText` instead of
     `editProcedure(..., { description })`.
   - The manual and phone-advice forms write it in item 11; the Future-scope photo demo's sample
     extraction prefills the description (channel `anaesthetist`) and no longer hands over an
     attachment.
   - Tests: S12 stores the SCH-7 text verbatim with `hospitalFeed`; MSG-STG-1012 appends the hospital's
     fuller wording beside the rooms' text and replaying it adds nothing; a PDF update appends instead of
     overwriting and a second identical row adds nothing; FHIR-SX-2001 stores `Appointment.description`.

6. **The reader sweep.** Every Procedure-wording reader from item 1 moves to `procedureLabel` (short
   labels) or, in item 10, to the component: `BookingDetailBody` totals and history scope labels;
   `ReviewScreen` history labels; `RemoveProcedureSheet`; the Booking detail headers on mobile, web and
   Admin ("{label} · {hospital}"); the List rows on mobile and web. `EditProcedureSheet`: remove any
   free-text "Operation" field left by 19 or 20; the sheet changes the RVG code and the Contract (19's
   and 20's pickers) and shows the received descriptions read-only at its top; its save no longer needs
   a description. `BtmCaptureBlock`'s header keeps compiling with `procedureLabel` until item 10.
   `seed/audit.ts`, `billing/fixtures.ts` and every test that built a Procedure with `description` move to
   `sourceTexts` (fixtures get `sourceTexts: []` and an empty invoice description unless the test is
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

8. **The seed: every Procedure's description, and AR-35's rows; session 1 close.**
   - **The migration rule.** `seed/bookings.ts` `ProcedureSpec.description` becomes `sourceText?: string`
     with an optional `channel` and `receivedAtISO`. Every seeded Procedure's former description becomes
     its first source text, channel mapped from its Booking's `source` (`hospitalDownload` to
     `hospitalDownload`, `surgeonPdf` to `surgeonPdf`, `admin` to `phone`, `anaesthetistAdHoc` (and
     `anaesthetistPhoto` if 15b kept it) to `anaesthetist`; unset to `unrecorded`), arrival time from
     fixed strings before `DEMO_TODAY`. The same for `seed/history.ts` (their historical invoice lines
     keep their stored text: issued invoices never change). Each seeded Procedure also gets an
     `invoiceDescription` from the starting rule (a Contract line's description where its line has one,
     else a copy of the Booking's first text, `origin` accordingly). Additional procedures and addendum
     skeletons stay empty. The Contract and RVG picks 19 and 20 seeded do not change, with one recorded
     exception: Diane Foster's S14 target Booking (rows 26 and 27), whose RVG code is cleared so the
     fire-message beat shows a Booking still to match. It sits on a forward ACTIVE List, uncaptured and
     never invoiced, so no S1 to S5 figure moves; update the S14 assertions in
     `domain/integrations/integrations.test.ts` and `store/integrationActions.test.ts` that read its
     old wording.
   - **AR-35's wording**, in a new `domain/seed/sourceWording.ts`: a typed table of the rows used (row
     number, as received, channel, the RVG code where the Contract prices from RVG units), headed by a
     comment: "AI-made, illustrative source wording, not from AA: AR-35, notes/2026-10-08-procedure-
     picker-and-source-text.md, 'Illustrative source wording'. RVG codes as printed in the NZSA RVG
     2021; only WLE MM, RTK, blephs, wide local excision, right total knee and row 27 come from AA's
     meeting." Take only the "As received" and "RVG code" columns; never add RVG group entries here.
   - **Placement (default; adjust only within the constraints below and record each move):**

     | AR-35 row(s) | As received (channel) | Where | RVG code | Why |
     |---|---|---|---|---|
     | 14 | `lap appy ?conv to open` (hospital feed) | MSG-STG-1001's SCH-7 description, so Sarah Mitchell's S1 Booking arrives with it on Dr Souter's Tue 28 Jul AM List | none until she picks A3 in S1 Beat 3 (as 20 left the feed path) | S1's arrival shows hospital shorthand needing an expert ("may convert to open"). AR-35 lists the row as email: our reuse on a feed, logged |
     | 6, 8 | `L knee scope + partial menisectomy` (rooms PDF); `ORIF # R dist radius` (email) | the 07:45 knee arthroscopy and 11:15 wrist ORIF on that same S1 List | as seeded | S1 Beat 1's "three booked cases" read as the rooms sent them; the 09:45 shoulder case keeps its migrated wording unless it matches row 10 |
     | 1 then 2 | `RTK` (rooms PDF, earlier), then `right total knee` (hospital download, later) | a new Booking on Dr Souter's Tue 4 Aug AM St George's List (pinned) | LL4 | the same Booking from two sources (US-03.1.9 "Fuller wording kept") |
     | 26, then 27 on firing | `WLE MM` (rooms PDF); MSG-STG-1012 brings `WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC` (hospital feed) | Diane Foster's S14 target Booking (Tue 4 Aug AM, 11:00), re-seeded to this wording, on No contract (RVG) | to choose (the site is not given) | the fire-message beat. AR-35 lists 26 and 27 as separate rows: pairing them as one Booking's rooms and hospital wording is our reading, logged |
     | 15, 17, 21, 34, 35 | `gastro/colon`, `blephs` (rooms PDF); `hystero D&C` (rooms PDF); `L3-5 decomp + fusion` (email); `EUA +/- cysto +/- biopsy` (rooms PDF) | new Bookings on one or two of Dr Souter's forward ACTIVE Lists already in `pinnedListIds` (Thu 30 Jul AM or Tue 28 Jul PM; check no S12 test counts their Bookings) | 15, 17 and 35 to choose; 21 P1; 34 S9b with 19b's pre-applied, removable P1 | the expert rows, on screens the presenter can open on mobile, web and the Admin Day |
     | 3, 11, 13, 25 | `L TKJR`, `lap chole +/- IOC`, `R inguinal hernia mesh` (rooms PDF); `TURP` (hospital download) | the existing Left total knee replacement (Souter Tue 21 AM), Wiremu Tane's lap chole and the Chen inguinal hernia (Souter Tue 21 PM), and one Morrison Mon 20 TURP | as seeded | today's and S3's Lists read as received; picks and figures unchanged |

     **Constraints.** No S1 to S5 figure, count or scripted name changes (S1 Beat 1 still reads three
     booked cases at 07:45, 09:45 and 11:15, and Sarah Mitchell still arrives as the fourth); no new RNG
     draw, filler draws unchanged; **new Bookings are created after every existing seeded Booking, so no
     existing `BK`, `P`, audit or counter id shifts** (recipes and the guide name them); new Bookings
     reuse existing seeded patients with no other Booking that day; every new Booking has a Contract by
     20's rules (No contract (RVG) where nothing fits); the "RTK" Booking takes a free time on Dr Souter's
     Tue 4 Aug AM List clear of the S13, S14 and S15 targets (08:30, 11:00, 12:00) and of MSG-STG-1012's
     new 12:15, and any test that counts that List's Bookings is updated. Keep `MSG-STG-1001` and
     `MSG-STG-1012` parseable: change only the SCH-7 description component, and keep MSG-STG-1012's time
     change and note.
   - **`PERSIST_VERSION`**: bump by one from what 20 left, with a comment line: "Booking descriptions
     (US-02.5.7, US-08.4.6): `Procedure.description` replaced by append-only `sourceTexts` and an
     `invoiceDescription`; attachments removed (RV-01); AR-35's illustrative wording seeded;
     MSG-STG-1001 and MSG-STG-1012 reworded".
   - **Seed tests** (`domain/seed/sourceWording.test.ts`): every seeded Procedure that had a description
     has exactly that text as its first source text; the AR-35 rows sit on the Bookings the placement
     names (by patient and List, not by a new id), with their channels; the two-source Booking has "RTK"
     then "right total knee" with the hospital's later; Foster's Booking holds only "WLE MM" before
     firing; no seeded source text is blank; every seeded Procedure with text has an invoice
     description; existing ids are unchanged (compare a fixed list of S1 to S5 Booking ids and patients
     to the pre-phase seed); the seed is deterministic (two builds deep-equal).
   - **Session 1 close.** Tests for items 2 to 7 as listed, plus a parity check: the fee of every seeded
     Procedure and every seeded invoice total is unchanged from the baseline (reuse 18's parity harness),
     with Diane Foster's S14 target the one listed exclusion and the new AR-35 Bookings absent from the
     baseline. `npm run build`, `npm run build:pwa`, `npx vitest run` green. The app runs, labels from
     `procedureLabel` and no component yet.

9. **The `ProcedureStack` component** (`shared/booking/ProcedureStack.tsx`, exported from
   `shared/booking/index.ts`; imports only `domain`, `theme` and `shared/format`, so `pwaPurity` holds).
   Invoke the frontend-design skill first.
   - a. **Props:** `view: ProcedureStackView`, `density: 'full' | 'compact'`, optional `heading`
     ("Procedure 2" on a multi-procedure Booking) and an `actions` slot (Edit, Remove, Add a
     description, Edit invoice description) the caller supplies. It renders the view; it derives nothing.
   - b. **Full density** (Booking screens), joined so they read as one Procedure (a hairline rail or
     connected rows, not cards):
     - **Descriptions as received:** the rooms' text and the hospital's text each in mono, quoted, with
       a mist meta line ("Surgeon's rooms PDF · Tue 14 Jul"; "Hospital feed · St George's · Mon 20 Jul");
       later different wording below its group; hand-entered text under "As entered" with its source
       ("Phone"); "No description received" in mist when empty.
     - **Invoice description:** the text the invoice prints, labelled "Invoice description", with a mist
       "Copied from the Contract line" or "Copied from the Booking" or "Edited by the office" meta line.
     - **Contract:** the name with the AA code in mono, "Held by {holder}", "Invoiced: {party}", and the
       pricing basis with its figure from `formatPricingBasis` (item 14); "Contract to choose" when null.
     - **RVG code:** code and group description in mono, only where the view carries one; "RVG code to
       choose" in mist with a neutral still-to-choose treatment; absent on a fixed price.
     Long wording wraps (row 27 is long); nothing truncates in full density. At 375 px the parts stay one
     column and the capture controls below keep their spacing. Mobile uses the same parts; web may lay
     them out in two columns.
   - c. **Compact density** (Review cells, drawer rows): the same parts as short single-line rows with an
     ellipsis and the full text in a `title`, the latest hospital text else the latest rooms text only,
     with "+1 earlier" when there are more.
   - d. **Hooks:** `data-shot="procedure-stack"` on the root, `procedure-stack-received`,
     `procedure-invoice-description`, `procedure-rvg-code`, and the Contract part keeps
     **`data-shot="procedure-contract"`** (US-03.1.2's recipe highlights it). Semantics: an ordered
     list with each part's label read before its value.
   - e. **"Add a description"** (an action in the slot, teal text link, where the actor may edit the
     Procedure): a small sheet (`shared/flows/AddDescriptionSheet.tsx`, bottom sheet on mobile, dialog
     on web and Admin through the surface seam) with one text field and, for the office, a "Told by"
     choice of Phone or Email (default Phone); the anaesthetist's channel is `anaesthetist`. It calls
     `addSourceText`. The manual counterpart of a later hospital update; Phase 35 reuses it. **Cut this
     first if session 2 runs long.**
   - f. **Component tests** (`ProcedureStack.test.tsx`): the parts in order with their labels; the "Not
     matched yet" view; rooms and hospital texts apart; the RVG code absent on a fixed price and "to
     choose" on an RVG Contract without one; compact density truncates with a title; the Contract part
     carries `procedure-contract`; no en or em dash in any rendered string.

10. **Place the component on every booking screen.**
    - **Booking detail, all three apps and the PWA** (`BtmCaptureBlock`, rendered by the shared
      `BookingDetailBody`): the header's text and the read-only context line give way to the component in
      full density, with "PROCEDURE n" as its heading on a multi-procedure Booking and Edit and Remove
      in its actions slot. Keep `data-testid="procedure-header"` on the heading row and the actions slot
      inside it (recipes and specs wait on it, and US-03.4.1's recipe clicks `[data-testid=procedure-header]
      >> text="Edit"`). The capture cards below are unchanged. On the office surface, drop the rows of
      `OfficeBillingSetup` that repeat the Contract's name or holder and keep its edit action and
      whatever the component does not show.
    - **Admin Booking detail only:** an "Edit invoice description" action in the slot opens a sheet
      (`EditInvoiceDescriptionSheet`, dialog) calling `setInvoiceDescription`; provisional note per
      item 4. Phase 21 adds the edit at review.
    - **Admin List drawer** (`ListDrawer`'s Bookings section): each row keeps the patient name and
      state, and gains the compact component for each Procedure.
    - **Admin Review** (`ReviewScreen`): a "Procedures" column replaces the "Contract" and "Code"
      columns, holding the compact component for **every** Procedure of the Booking; the Patient cell
      keeps name and NHI. Times, B · T · M, Units, Fee and Flags stay. Phase 21 adds the payer, the
      warnings and the invoice-description edit.
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
    - Save passes `sourceText` (channel `anaesthetist`, or `phone` or `email` for the office, `from` the
      actor's name) stored exactly as typed, no trim; a whitespace-only text stores nothing. The form
      saves with text and no RVG code, or a code and no text, never with neither ("Type the procedure as
      told, or choose an RVG code."). The text also starts the invoice description (item 4).
    - Component test: an anaesthetist save stores the text verbatim with `anaesthetist`; an office save
      with Email stores `email`; leading spaces survive; neither refuses.

12. **The invoice prints the invoice description** (`apps/admin/screens/InvoiceDocument.tsx`). In the
    lines table each Procedure's lines sit under one heading row reading its `invoiceDescription.text`;
    fee line text, amounts, totals and Xero records are unchanged (Phase 22 owns the layout and may
    restyle the heading). Tests over the seeded billing run: every heading equals its Procedure's
    invoice description; an office edit changes the heading and no received text; no heading is an RVG
    group name; amounts unchanged from the baseline.

13. **Re-point "Fire hospital message"** (`shared/demoTriggers/registry.ts`; no new entry).
    - Its `routes` already hold the mobile Booking route; add the web (`/web/lists/:listId/bookings/:bookingId`)
      and Admin (`/admin/day/:dateISO/bookings/:bookingId`) Booking routes, keeping its Future-scope
      badge and surfaces (bar and PWA).
    - `defaultChoice` picks, when the Booking in the URL (`ctx.params.bookingId`) has a `correlationRef`,
      the canned modify message whose `correlationAppointmentId` matches it (so Diane Foster's Booking
      defaults to MSG-STG-1012); otherwise its current default. A pure helper in `shared/demoTriggers`
      maps the Booking to its message, with a test.
    - Its success message, when the apply added wording: "Fired MSG-STG-1012: the hospital's description
      was added beside the rooms' text." Nothing is added to the Control Panel page; its index lists the
      new routes under the entry.

14. **Labels and copy** (`shared/format.ts`): `SOURCE_TEXT_CHANNEL_LABELS` ("Surgeon's rooms PDF",
    "Email", "Hospital download", "Hospital feed", "Phone", "Anaesthetist", "Source not recorded") and
    `formatPricingBasis(basis)` (whole dollars for fixed prices, "Fixed $2,400"; rates with cents,
    "$125.00 per unit", and "$125.00 per unit · 10% off" when a discount sits on the same line; "10% off
    RVG"; "RVG"). App copy says "Descriptions as received", "Invoice description", "Contract", "RVG
    code", "Invoiced", "Held by", never "Card", never "slot", never "DRAFT" for an assigned List, never
    "as given", and no en or em dash anywhere. The prototype README's Booking and Procedure section names
    `sourceTexts`, `invoiceDescription`, `addSourceText` and the component, and drops attachments.

15. **Demo guide, Control Panel scenario text and ATLAS** (the same session; see Demo guide updates and
    Catalogue screenshots).

16. **Finish.** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green;
    both item 1 inventories clean; then the manual test checklist, the review pass, the catalogue
    screenshot step and the PROGRESS entry.

## Demo triggers

No new trigger: the descriptions, the invoice description and the Contract demo through normal use.

1. **None needed for the descriptions.** After Reset, Dr Souter's Lists and the Admin Day carry AR-35's
   wording: S1's Tue 28 Jul AM cases, the two-source "RTK" / "right total knee" Booking on Tue 4 Aug AM,
   Foster's "WLE MM" on the same List, the expert rows on Dr Souter's forward Lists, and the reworded
   Bookings on Tue 21 and Mon 20.
2. **"Fire hospital message" re-pointed** (Phase 14's entry, Future-scope badge, bar and PWA): now also on
   the mobile, web and Admin Booking routes, defaulting to the message addressed to the Booking on screen.
   On Diane Foster's Booking it fires MSG-STG-1012, which adds the hospital's fuller wording beside the
   rooms' "WLE MM"; firing it again adds nothing. The PWA sheet shows it on the Booking screen too, so a
   handset demo needs no office stand-in.
3. **Admin Booking: edit the invoice description** (product UI, not a trigger), and the **Procedure
   description** field on mobile and web Add a booking and Admin's Book (phone advice) and **Add a
   description** on a Booking: product UI.

PWA parity: nothing in this phase waits on the office or a colleague; the re-pointed trigger covers the
backend event on the handset.

## Out of scope

- **The matching screen** and descriptions on its rows (US-02.1.2, FT-02.5): Phase 33, which adds this
  component to each row and moves hospital wording behind approval.
- **The payer on the Booking** and what "who is invoiced" returns after 20's interim, and the invoice
  description's edit at review: Phase 21 (re-points `whoIsInvoicedFor`).
- **The one price precedence**, the price source and the anaesthetist's typed price: Phase 24
  (re-points `pricingBasisFor`). The pricing snapshot: 25.
- **Invoice layout** beyond one heading row per Procedure: Phase 22 (each line printing the invoice
  description).
- **The hospital's description on the invoice when a hospital is billed** (Donald's idea, OQ-103):
  not built; the default copies the Booking's description.
- **The anaesthetist rewording the plain description with history** (Donald, 16 October; the field is
  unsaid): not built.
- **The office's amend flow and change history** (US-02.3.1, US-02.5.5): Phase 35, which reuses
  `addSourceText`.
- **Primary Procedure** ("Make primary"): Phase 23. Until then intake appends to the Booking's first
  Procedure.
- **Hiding Contract detail from the anaesthetist:** not done; 43a simplifies the anaesthetist screens
  while keeping the component.
- Editing AR-35, AR-28, AR-29 or AR-30, registering a region on AR-35, or any catalogue requirement's
  text or status.

## Manual test checklist

The agent runs every item itself in the running app (root `npm run dev`; Playwright or the `/run`
skill; handset checks in the emulated mobile viewport) and reports each pass or fail with its evidence;
none is handed to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Mobile → Dr Souter → Tue 4 Aug AM → the two-source Booking: descriptions as received show
      "RTK" (Surgeon's rooms PDF, earlier) and "right total knee" (Hospital download, later), apart;
      the invoice description; the Contract with its name, holder, who is invoiced and pricing basis;
      the RVG code LL4 where the Contract prices from RVG units. Readable at 375 px; the capture cards
      below are uncrowded.
- [ ] The same Booking on web and in Admin (`/admin/day/2026-08-04/bookings/<id>`): the same parts; on
      Admin, `OfficeBillingSetup` does not repeat the Contract's name or holder. On a fixed-price
      Contract's Booking the RVG code part is absent.
- [ ] Admin "Edit invoice description" on that Booking: the invoice description changes, both received
      texts do not, History shows "Invoice description changed"; a later hospital text leaves the edit
      alone.
- [ ] Diane Foster's Booking (Tue 4 Aug AM, 11:00) on mobile: "WLE MM", "RVG code to choose". Demo
      actions → Fire hospital message defaults to MSG-STG-1012 → Run: the hospital's long wording
      appears beside "WLE MM", the earlier text untouched, the time and note updated as before. Fire it
      again: nothing added. Same on the PWA sheet (`npm run dev:pwa`).
- [ ] S1 as scripted: Tue 28 Jul AM shows three booked cases at 07:45, 09:45 and 11:15 with the rooms'
      wording on two of them; Fire hospital message → MSG-STG-1001 → Sarah Mitchell arrives fourth with
      "lap appy ?conv to open" (Hospital feed) and "Contract to choose" or the office-set Contract per
      20; S1 Beat 3's picks fill the Contract and RVG parts; the List counts read as the guide says; no
      List attachments panel anywhere.
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
      with "Phone" and the invoice description copies it.
- [ ] "Add a description" on an ACTIVE Booking as the anaesthetist adds a text below the earlier one;
      on a SUBMITTED List it is not offered to the anaesthetist; the office can add with Email.
- [ ] Edit on a Procedure changes the RVG code and the Contract; the received texts do not change and
      have no edit control anywhere.
- [ ] Admin Review on a submitted List with a multi-procedure Booking: the Procedures column shows a
      compact component for every Procedure; the Admin Day List drawer rows show it too.
- [ ] Authorise Dr Morrison's submitted Mon 20 List in Admin Review (S2 Beat 4's path), then open the
      invoice for the TURP seeded with the hospital's "TURP" wording: the heading prints the Procedure's
      invoice description, never a group name; amounts unchanged from the baseline.
- [ ] After Reset, S1 to S5 run as scripted in the patched guide with every figure unchanged; the Data
      Inspector shows `sourceTexts` and `invoiceDescription` and no `description` or `attachments`;
      History shows "Description added as received" with the text.
- [ ] No new string has an en or em dash; teal is the only action colour; no crimson in the component;
      no "Card", "slot", "as given" or "DRAFT" for an assigned List in new copy.
- [ ] Catalogue screenshots: the covered recipes created or updated, US-03.1.3's marked absent, the
      broken ones re-pointed, a full `npm run capture` with no failed recipe and no story without a
      recipe, the changed shots checked by eye, `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

Same session, in `docs/demo-guide/` and the same passages of `master-demo-guide.html`:

- **`03-demo-script.md` S1 Beat 1:** the Expected line adds that Sarah Mitchell's Booking shows the
  hospital's description as received ("lap appy ?conv to open") with its Contract and RVG code still to
  choose; the "read its three booked cases" click names the rooms' wording on two of them. Times and
  counts stay. **Remove the optional aside about List attachments** (the theatre-list PDF is gone).
- **S1 Beat 2 ("the Booking fills over the days"):** add an optional aside: open Dr Souter's Tue 4 Aug
  AM List → the "RTK" Booking: "The rooms sent 'RTK'; the hospital's download later said 'right total
  knee'. Both are kept exactly as received, beside the invoice description, the Contract (who holds it,
  who is invoiced, how it is priced) and the RVG code." Optionally, on Diane Foster's Booking, Demo
  actions → Fire hospital message (MSG-STG-1012) to add the hospital's fuller wording live (Future-scope
  badge: HL7 is illustrative).
- **S1 Beat 3:** the capture step reads the descriptions first: "She sees what the hospital wrote, picks
  the RVG code, and the Contract part shows who is invoiced and the pricing basis; the running fee stays
  hidden." Keep "sees no running fee" in "Worth pointing at".
- **S2 Beat 2 (a phone-advice booking):** the Expected line says the lookup also fills the procedure
  description (Told by Phone) and the saved Booking shows it with "Phone" and copies it into the invoice
  description.
- **`04-presenter-cheat-sheet.md`:** a "Booking descriptions" line under the anaesthetist and office
  features: the rooms' and hospital's descriptions kept as received and never overwritten, the invoice
  description the office can edit, the Contract (name, holder, invoiced, basis), the RVG code where
  RVG-priced; no attachments. A discovery-point line: what the invoice says for an RVG-only pick, and
  the hospital's description when a hospital is billed (OQ-103).
- **`02-workflows-and-handoffs.md`:** the intake section says each Booking keeps the description as
  received from every channel, hand entry kept as typed; the hospital-update paragraph says an update
  adds wording beside the old, never replacing it; drop any attachments step.
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
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 20a` first. Recipes and images are never
touched while the plan is updated; this phase's build does it.

**Covered items.**

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md) Keep the procedure text as received | none | create, `captured`. Shot `source-wording` on web, mobile and admin from Diane Foster's Booking (Tue 4 Aug AM): state `rooms` (only "WLE MM", highlight `[data-shot=procedure-stack-received]`, caption "The procedure text kept exactly as the rooms sent it"), state `hospital-update` (a `trigger` step firing MSG-STG-1012 on mobile and admin; on the PWA, the Demo sheet; caption "The hospital's description is added beside it, never overwriting it"). Shot `source-wording-two-sources` on the "RTK" Booking on web, caption "The rooms' and the hospital's descriptions for the same Booking" |
| [US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) Booking descriptions and Contract shown together | none | create, `partial`, `absentReason` "The hospital matching screen does not exist yet: Phase 33 adds the component to each row." Shot `procedure-stack` on mobile, web and admin on the "RTK" Booking (highlight `[data-shot=procedure-stack]`, caption "The received descriptions, the invoice description, the Contract and the RVG code"); state `not-matched` on a Booking with no Contract and no RVG code (row 17's "blephs"; caption "Not matched yet: the wording shows, the Contract and RVG code are still to choose"); shot `review-stack` on Admin Review of a submitted List with a multi-procedure Booking (caption "Office review shows the descriptions and Contract for every Procedure") |
| [US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md) See the Contract on each Procedure | partial · procedure-contract on web and mobile (`BK0009`), `absentReason` "not on the List view before the session" | `captured`, no `absentReason`. Keep the shot name `procedure-contract` (the hook sits on the Contract part): state `before` on BK0009 (an ACTIVE List before the session), state `after` on a Booking of Dr Souter's SUBMITTED Mon 20 List on web (mobile only if the main view reaches it; 38a builds the archive). Caption "The Contract on each Procedure: name, holder, who is invoiced and the pricing basis with its figure" |
| [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md) Add a Booking manually | partial · add-card on web and mobile, `manual` caption "Manual entry of the patient and operation"; the optional description kept as source text is not built | `captured`. Keep `add-card`; state `manual` re-captioned "Add a Booking to my List: the patient, the RVG code and the procedure as written"; add state `procedure-description` that types "RTK" into the Procedure description field and highlights `[data-shot=procedure-description]`, caption "The procedure as written on the hospital's list is kept exactly as typed" |
| [US-08.4.6](../../../../requirements-board/requirements/stories/US-08.4.6.md) Invoice description on each Procedure | none | create, `captured`. Shot `invoice-description` on admin Booking detail of the "RTK" Booking (highlight `[data-shot=procedure-invoice-description]`, caption "The invoice description starts as the Contract line's description, else the Booking's, and is editable by the office"); state `edited` after "Edit invoice description" with the received descriptions still unchanged; state `printed` on the invoice heading row of Dr Morrison's TURP (highlight `[data-shot=invoice-lines]`, caption "The invoice prints the invoice description") |

**Recipes this phase breaks or makes untrue** (keep shot names; run `node scripts/capture.ts --dry` in
`requirements-board/` to find any this list misses: every step or highlight on `procedure-header`,
`procedure-contract`, `[data-testid=procedure-header] + div`, "Operation description", attachments
hooks, the Review table's "Contract" or "Code" columns):

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md) Attachments (Retired) | captured · `attachments` on web and mobile, and the List attachments shots | `absent`, no shots, `absentReason` "Retired: removed in Phase 20a" (as US-02.4.3 after 15b); the catalogue's images are left as they are |
| [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) | partial · web and mobile highlight `[data-testid=procedure-header] + div` (the old context line) | under whatever shot names 20 left, re-point every web and mobile Booking-detail highlight still on `[data-testid=procedure-header] + div` to `[data-shot=procedure-contract]`; the `billed` state now shows the Contract part's "Invoiced" line; 20's captions stay |
| [US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) | partial · `added` highlights `procedure-header >> nth=1` and `procedure-contract >> nth=1` | keep both hooks; re-check the second Procedure shows "No description received" and "Contract to choose"; caption unchanged |
| [US-03.1.1](../../../../requirements-board/requirements/stories/US-03.1.1.md), [US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) | wait on `[data-testid=procedure-header]`; US-03.4.1 clicks `[data-testid=procedure-header] >> text="Edit"` | hold if the testid and the Edit action stay on the heading row (item 10); fix only what `--dry` fails; captions are 20's |
| [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) | captured · `review-contracts`, caption "Office review of each Booking's route, Contract, codes and flags" | re-caption `review-contracts` "Office review of each Procedure's descriptions and Contract, with the flags" (21 re-captions again for the payer and warnings). The `correct-contract` shot finds the office block by its "Office billing setup" text and "Edit billing setup" button: keep both on the slimmed `OfficeBillingSetup` or re-point; its captions are 20's |
| [US-11.1.3](../../../../requirements-board/requirements/stories/US-11.1.3.md) | `linked` fills `[placeholder="Operation description"]` on web and mobile (unless 19 or 20 already changed it) | fill the RVG code or "Procedure description" as the form now asks; captions unchanged ([US-14.4.1](../../../../requirements-board/requirements/stories/US-14.4.1.md)'s recipe opens the same form but fills no description: re-check with `--dry` only) |
| [US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md) | partial · mobile capture on BK0009 | re-take; the caption stays (the component sits above the large capture controls) |

**ATLAS.md.** "Existing hooks": add `procedure-stack`, `procedure-stack-received`,
`procedure-invoice-description`, `procedure-rvg-code`, `procedure-description`, and note
`procedure-contract` now marks the Contract part; remove `booking-attachments`, `list-attachments`,
`admin-list-attachments` and `add-attachment-sheet` and the seeded theatre-list PDF rows. "Seed data
worth shooting": the two-source "RTK" Booking (its id), Foster's "WLE MM" Booking before and after
MSG-STG-1012, the expert rows and their Lists, Sarah Mitchell's arrival wording, and a line that AR-35's
wording is AI-made demo data. "Overlays that need clicks": "Add a description", "Edit invoice
description", the Procedure description field. "Demo control panel and Demo actions": Fire hospital
message now also on Booking routes with a per-Booking default.

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run
shots` are green, and before writing the PROGRESS entry, run the standard adversarial review-and-fix
pass (PROGRESS convention 18): independent Opus review subagents for **quality**, **bugs/correctness**
and **plan adherence**. This session verifies every finding against the catalogue and the code, fixes
the confirmed ones (with a test where a bug had none), re-greens and records the pass. Do not re-raise
anything settled in the Decisions log, except the 2026-09-28 ruling this phase supersedes in part.

**Steer this phase's reviewers at:**
- **Append-only, verbatim.** No path edits, trims, reorders or removes a source text: `ProcedurePatch`
  excludes it, `editProcedure` refuses it, every intake path appends through `addSourceText` or the
  create input, and an identical replay adds nothing. The rooms' and the hospital's texts are kept and
  shown apart. A whitespace-only text is never stored.
- **The invoice description** is a field of its own: starts from the line's description else the
  Booking's, never a group name, re-derived only until edited, edited by the office alone, and an edit
  never touches a received text. The invoice heading prints it and no received text.
- **Every intake path writes it:** S12, S13, S14, PDF create and update, mobile and web manual, Admin
  phone advice, the Future-scope photo prefill; none invents a fallback wording.
- **One place.** The view, `whoIsInvoicedFor`, `pricingBasisFor`, `startingInvoiceDescription` and
  `procedureLabel` live only in `domain/billing/procedureStack.ts`; the component derives nothing; no
  screen re-derives the payer or the basis; `whoIsInvoicedFor` wraps 20's function rather than copying it.
- **RVG code only where RVG-priced:** absent on a fixed price, "to choose" where it is needed and empty.
- **Attachments fully gone:** no type, store action, seed row, `AT` prefix, UI hook or spec left, no
  existing seeded id shifted by the removal, and the Future-scope photo demo still works.
- **No figure moved:** the parity check holds; S1 to S5 counts and names hold; no existing seeded id
  shifted.
- **The seed:** AR-35's rows placed as the table says (or the moves recorded), labelled AI-made in
  comments, deterministic; `PERSIST_VERSION` bumped.
- **The UI:** empty parts say still to choose in neutral, never a status colour; 375 px is uncrowded;
  compact density truncates with a title; the Contract part keeps `procedure-contract`; `pwaPurity`
  holds; teal-only actions; no en or em dashes.
- **The trigger:** Future-scope badge kept, per-Booking default correct, nothing added to the Control
  Panel page.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"):
  - The descriptions, invoice description, Contract and RVG code on the Booking (Mobile, Web and Admin:
    Dr Souter's Tue 4 Aug AM "RTK" Booking) and in Admin Review; US-03.1.9 is Open, so whether the
    layout reads clearly, and whether the anaesthetist should see the same parts as the office.
  - The anaesthetist now sees the Contract's name, holder, who is invoiced and pricing basis (US-03.1.2
    Confirmed; US-03.1.9 Open) against US-15.0.1's Proposed note "see none of the Contract complexity":
    built the catalogue's way; the running fee stays hidden.
  - OQ-103 (D37), provisional: the invoice description for an RVG-only pick is a copy of the Booking's
    description, the hospital's description when a hospital is billed is not built, and the office
    edits it on the Admin Booking (21 moves the edit to review).
  - Attachments removed (RV-01): Booking and List attachments and the seeded theatre-list PDF are gone.
  - AR-35's rows reused on channels its table did not name (row 14 on a hospital feed) and rows 26 and
    27 paired as one Booking's rooms and hospital wording; any placement moved from the table.
  - "Add a description" on an existing Booking (built here, ahead of 35's amend flow), or cut.
- **Status.** A catch-up status row for Phase 20a, DONE at the end.
- **Phase entry:** the drift-check result against `d4db277` and the names reused from 18 to 20; both
  inventory greps before and after with any accepted leftover; the placement table as built with each
  new Booking's id; the `PERSIST_VERSION` bump; the parity check; the checklist item by item with
  evidence; Vitest and Playwright counts before and after; the review pass.
- **Decisions log:**
  - **Booking descriptions** (US-02.5.7, DM-51): `Procedure.description` is replaced by append-only
    `sourceTexts` (rooms', hospital's and hand-entered, each with its system and time), written by every
    intake path, never edited; hospital and PDF updates append instead of overwriting (superseding the
    Phase 11 PDF ingest "UPDATES it (scheduled time + operation)" behaviour for the operation half).
  - **The invoice description** (US-08.4.6, OQ-103 default): a field of its own, starting from the line's
    description else the Booking's, office-edited, printed by the invoice; the three-part stack's
    "procedure" layer and the general procedure's invoice wording are gone with the procedure master.
  - **One component** (US-03.1.9, US-03.1.2): `ProcedureStack` on every Booking screen, Admin Review and
    the List drawer, reading one view from `domain/billing/procedureStack.ts`; the RVG code shows only
    where RVG-priced; "who is invoiced" and "pricing basis" are one function each, for 21 and 24 to
    re-point.
  - Supersede in part **2026-09-28 "Anaesthetist Card shows no calculation"**: the running fee and the
    Booking total stay hidden from the anaesthetist, but the Contract's pricing basis and its figure show.
  - **Attachments removed** (RV-01, US-03.1.3 Retired): supersedes the Phase 15 List attachments and the
    Booking attachments ruling.
- **Catalogue screenshots:** the recipes created (US-02.5.7, US-03.1.9, US-08.4.6), changed (US-03.1.2,
  US-02.4.1, and the broken ones re-pointed), US-03.1.3 marked absent, and the `REPORT.md` counts before
  and after (captured, partial, absent, failed).
- **Handoff notes:** Phase 21 re-points `whoIsInvoicedFor` to the payer, adds the payer, warnings and the
  invoice-description edit to Review; Phase 22 prints the invoice description on each line; Phase 23's
  primary Procedure becomes the intake target for appended wording; Phase 24 re-points `pricingBasisFor`;
  Phase 33 puts `ProcedureStack` on every matching row and writes source texts through `addSourceText`;
  Phase 35 reuses `addSourceText` and "Add a description" for the office's amend flow and the invoice
  description's correction until AUTHORISED; Phase 43's generator builds `sourceTexts` and
  `invoiceDescription` through the same types; Phase 43a keeps the component on the anaesthetist screens;
  Phase 44 rewrites S1 around the descriptions, the Contract choice and the invoice description.
