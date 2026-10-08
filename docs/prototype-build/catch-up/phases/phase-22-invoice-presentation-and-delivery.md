# Phase 22 · Invoice presentation, delivery and the split

**Requirements covered:**
[US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md) Invoice presentation and delivery (Confirmed 2026-10-07 with Greg: set on the Contract; every price held GST exclusive, GST at the foot of the invoice) ·
[FT-08.4](../../../../requirements-board/requirements/stories/FT-08.4.md) Invoice generation and despatch (Proposed) ·
[US-08.4.2](../../../../requirements-board/requirements/stories/US-08.4.2.md) Send to the invoice email (Confirmed) ·
[US-08.4.5](../../../../requirements-board/requirements/stories/US-08.4.5.md) Anaesthetist as supplier, AA as agent (Proposed, [OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md)) ·
[US-08.2.3](../../../../requirements-board/requirements/stories/US-08.2.3.md) Split one Procedure's fee between two payers (Verify; the owner's typed decision of 2026-10-05: a Split button on the Booking, no Contract setting; basis from [OQ-68](../../../../requirements-board/requirements/questions/OQ-68.md), answered) ·
[US-09.1.4](../../../../requirements-board/requirements/stories/US-09.1.4.md) ACCPAY as buyer-created tax invoice (Proposed, OQ-29) ·
[DM-28](../analysis/domain-model-delta.md#dm-28) splitting a Procedure's fee is a Booking action with typed $ or % shares, not a line-level funder override ·
[RV-37](../analysis/reverse-check.md) the office-only per-line funder allocation editor is reworked into that user action.
This phase also builds the layout and delivery half of
[DM-16](../analysis/domain-model-delta.md#dm-16) (Phase 21 built its holder-references half) and
the invoice-presentation part of [DM-22](../analysis/domain-model-delta.md#dm-22) (supplier, agent,
Procedure links, lineage; the ledger itself is Phase 36's).
**Left this phase at the 2026-10-08 update:** US-04.2.12 (the Contract payment setting, Retired
2026-10-05: "neither a Contract nor a Procedure holds a full payment or split setting"), so owner
decision D18's old reading ("set on the Booking, defaulting from the Contract") is superseded and
nothing here builds a Contract payment setting or a default share; DM-27 (merged into DM-22, whose
presentation part is listed above). The settled July rulings superseded here are the
`funderOverride` conservation split (2026-07-22 fifth review #4) and the office-only per-line funder
editor (seventh review, RV-37), the counterparty-kind layout and the GST caption (Phase 08 decisions
2 and 4), and the manual "Email invoice" send (Phase 08 work item 2), listed under PROGRESS.md updates.
**Depends on:** Phase 21 (who is invoiced: the Contract holder's billable party when the holder is
billed, otherwise the payer on the Booking, prefilled from the patient and editable to a guardian
(D17, US-11.2.2); `billablePartyForProcedure` or 21's name for it; the invoice email that goes with
the party (`invoiceEmailFor`, snapshotted as `Invoice.invoiceEmail` by the run); grouping by billable
party (US-08.2.1); the holder references; and `funderOverride` still the interim split), and so on
20a (the three-part Procedure stack whose Contract part carries the Split button, and its one "who is
invoiced" selector), 20 (one Contract per Procedure; the interim `prepaymentRequired` flag on the
Booking), 18 (`ContractHolder` with `holderType`, `billsHolder` and its billable party; the Master
data Contract sheet; No contract (RVG)), 17 (hospital and rooms contact emails), 16 (the payable equals
the receivable; `invoiceNumber` and `reference` on both Xero records; neutral Xero contact names;
`bctisFor` in `domain/billing/bcti.ts`, the one pure BCTI count, fed only by `bctiRecords(state)`),
15b (ACTIVE Lists), 15a (the warning routine and its one registry, `WARNING_RULES` in
`src/domain/warnings/rules/`, which gains the split-does-not-fit rule) and 14 (the trigger registry and the PWA "Office authorises this List" stand-in,
`authoriseAsSimulatedOffice` in `src/store/officeStandIn.ts`).
**Estimated:** 1 session (a full one: about 35 files and many rewritten tests). If it runs long, the
natural stop point is after work item 9 (model, split, sending run, Xero wording and seed all green);
items 10 to 15 are UI and fit a short second session.

## Goal

Every receivable invoice is **issued in the anaesthetist's name**, with their GST number, and names
**AA as agent**, not supplier (US-08.4.5). Each Contract carries its own **invoicing settings**,
agreed with Greg on 2026-10-07 (US-04.2.8, Confirmed): the layout (contract holder or patient), the
delivery method (email, portal upload for the direct insurer, or none) and the GST treatment, so every
invoice raised under it looks, travels and is taxed the same way without the office choosing booking
by booking. The GST treatment is the one rule the catalogue now states: **every price is held GST
exclusive and GST is worked out at the foot of the invoice** (US-05.2.7, Matches today: keep it, and
build no GST-inclusive presentation). It is stored on the Contract as a single-valued setting shown
read-only, so a later treatment (OQ-29) is a one-place change.

The Billing/Invoice Engine now **sends each invoice itself** as part of the billing run (FT-08.4,
US-08.4.2). Authorising a List in Admin Review raises the invoices and stamps each one "Emailed to
<address>" (the invoice email of the party invoiced, which is a guardian's where the payer on the
Booking is a guardian) or "Queued for <insurer> portal". The office's manual "Email invoice" button
goes; a single-invoice **Resend** stays on the invoice rail.

**Splitting a Procedure's fee is a user action on the Booking** (US-08.2.3, DM-28, RV-37; the owner's
typed decision of 2026-10-05, D18 superseded). On the Contract part of a Procedure's three-part stack
(20a), in the mobile and web apps for the anaesthetist and in the Admin App for the office, a
**Split** button opens a sheet where the fee invoiced under that Contract is divided between
**several billable parties**, each share typed as **$ or %** ("$48 or 48%"). There is **no setting on
the Contract or the Procedure and no default from the Contract**; each party gets its own invoice.
It replaces the office-only per-line `funderOverride` allocation editor (the Funder allocation sheet)
and the seeded line-level two-funder split. Two points are not settled in the catalogue (US-08.2.3
note): whether % shares must total 100, and what the split's line items say. The plan builds one
reading of each (work items 3 and 4), keeps the share maths and the wording in one pure module with
tests, and logs both for the owner. The seeded Prentice Booking is re-expressed as a split typed on
the Booking (nib $132.50, Alan Prentice the rest) and still raises **AA-2026-0005 · nib · $152.38**
and **AA-2026-0006 · $91.43**, the second now to **Alan Prentice** (the patient's gap, the
catalogue's own example) instead of St George's, unless Phases 20 and 21 already moved it.

The **ACCPAY** in the Xero simulation carries provisional **buyer-created tax invoice** wording with
the supplier (anaesthetist, GST number) and agent (AA, GST number) details (US-09.1.4). It stays
**one BCTI per receivable invoice, the same value as its receivable** (OQ-42; Phase 16 removed the 5%
fee, the Contradicts half of US-09.1.4's grade). A split therefore gives one invoice and one BCTI per
party, counted by Phase 16's count function, which this phase does not change; the catalogue's "one
per procedure" stays unresolved beside it (ROADMAP, BCTI granularity).

**Pricing model in one place.** This phase builds none of the pricing structures (RVG groups,
procedures, holders, Contracts, lines, the resolver or the precedence) and never re-prices: the split
divides the Procedure's final fee as the engine already computed it (after any office override). The
split record sits on the booking procedure
([AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md#booking-procedure), [AR-29#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md#booking-procedure-fields)) and the
invoicing settings on the Contract ([AR-30#contract](../../../../requirements-board/requirements/artifacts/AR-30.md#contract), [AR-29#contract-fields](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-fields)).
The draft design v4 names neither (its booking procedure lists pricing fields only, and its Contract
has no invoicing fields), so both are additions beside its shapes, typed in `aa-prototype/src/domain`
next to the ones 18 to 21 built; the split maths lives only in
`aa-prototype/src/domain/billing/splitShare.ts` and the presentation rules only in
`invoicePresentation.ts`, so a later design change (v4 may become v5) stays a contained edit. Who
receives each invoice follows [AR-28#who-gets-the-invoice](../../../../requirements-board/requirements/artifacts/AR-28.md#who-gets-the-invoice) (true as
written) and [AR-29#billable-party](../../../../requirements-board/requirements/artifacts/AR-29.md#billable-party), as Phase 21 built it in
`whoIsBilled.ts`; this phase reads it, never re-derives it.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and the ones it leans on against the plan's
   baseline, catalogue commit `60e2d1e` (rename-aware; never a plain `git diff` of the catalogue
   folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-04.2.8,FT-08.4,US-08.4.2,US-08.4.5,US-08.2.3,US-09.1.4,US-04.2.12,US-08.4.1,US-05.2.7,US-11.4.1,US-11.2.2,US-08.4.3,FT-08.2,US-08.2.1,FT-09.1,US-08.6.3,US-08.6.4,OQ-29,OQ-42,OQ-60,OQ-68,OQ-23,OQ-67,OQ-73,OQ-78
   ```

   The plan already reflects the catalogue at 60e2d1e: US-04.2.12 Retired and US-08.2.3 rewritten
   (2026-10-05 typed decision: a Split button on the Procedure's Contract line, several billable
   parties, typed $ or %, no Contract setting and no default); US-04.2.8 Confirmed with Greg on
   2026-10-07 and US-05.2.7 Confirmed (all prices held GST exclusive, GST at the foot of the invoice);
   US-11.4.1's technical note (cover split is a Booking split, not a Contract setting); US-11.2.2 the
   payer on the Booking; US-08.6.3 (the additional invoice, a separate button) and US-08.6.4 (the
   combined split, Phase 39). FT-08.4, US-08.4.2 and US-09.1.4 changed only in artifact links. Also
   read the domain-model Contract rows `invoiceLayout`, `deliveryMethod` and `gstTreatment`, the
   Internal ledger bullet "Invoices are issued in the anaesthetist's name with AA as agent; the ACCPAY
   is a buyer-created tax invoice" and the Invoice email glossary entry.
2. If an item changed since, re-read it in full and adjust the work items. If an item is now Retired
   or Future, drop it and say so in the PROGRESS entry. If US-08.2.3 is retired, still remove
   `funderOverride` (retired behaviour either way), bill Prentice in full to one party, re-baseline S3
   Beat 1 to one invoice and log it on the "For the owner's review" list.
3. **Decisions and open questions.**
   - **D18 superseded (2026-10-05).** Build US-08.2.3 as written: a user action on the Booking, no
     Contract or Procedure setting, no default from the Contract. No provisional pill on the Split
     button (it is the owner's decision). Two details are unsettled (US-08.2.3 note): whether %
     shares must total 100, and the split's line wording. Build work item 3's reading (any number of
     parties; at most one takes the rest; without one, the shares must total the fee) and work item
     4's wording, keep both in `splitShare.ts`, and log both on the owner's review list. If a later
     catalogue change settles either, change that module only.
   - **OQ-29 (GST agency treatment, and IRD's new name for the buyer-created tax invoice), Open.**
     Build the recommended reading: supplier = the anaesthetist with their GST number, AA named as
     agent, and the ACCPAY labelled a buyer-created tax invoice. Every surface that shows this
     wording carries a small neutral "Provisional (OQ-29)" pill and one caption: "Supplier, agent and
     buyer-created wording are provisional until AA's accountant confirms the GST agency treatment and
     IRD's current name for this document." The wording and the document's name live in one module
     (work item 2). If OQ-29 is answered, use the accountant's wording and name and drop the pill.
     The GST treatment itself is not provisional: US-05.2.7 and US-04.2.8 are Confirmed.
   - **BCTI granularity.** The catalogue says "one per procedure" (US-09.1.4 note) beside "the same
     value as its receivable" (OQ-42). Build one per receivable invoice and leave Phase 16's count
     function and its tests untouched. If AA's accountant has confirmed "one per procedure", stop and
     tell the owner: the count function, the $700 seed and the S3 and S4 figures re-baseline in one
     place first (ROADMAP).
   - **OQ-67 and OQ-78 are answered (D17 as superseded):** the Contract decides who is billed, the
     holder's billable party when the holder is billed, otherwise the payer on the Booking. Phase 21
     built it. A split adds parties for that one Procedure's fee; it never changes who the Contract
     bills for any other Procedure.
   - **OQ-73 (D23)** does not change this phase. A Procedure on a Booking carrying 20's interim
     `prepaymentRequired` flag (it sits on the Booking, not the Procedure) cannot be split (work item
     5): Phase 27 prices a prepaid Procedure at its prepaid amount with nothing left to bill.
4. **Read what 16 and 18 to 21 actually left** (their PROGRESS entries): 18's `ContractHolder` field
   names (`holderType`, `billsHolder`, its billable party) and where direct claims now live (the
   insurer master's `acceptsDirectClaims` or the holder); the Master data Contract sheet; 20a's stack
   (`ProcedureStack`, `procedureStackView` and `whoIsInvoicedFor` in `domain/billing/procedureStack.ts`);
   21's names for the payer on the Booking, the billable party per Procedure
   (`billablePartyForProcedure` in `whoIsBilled.ts`), `invoiceEmailFor` and `Invoice.invoiceEmail`,
   and its payer sheet (21 builds no general party picker, so the Split sheet's picker is new); which List holds 21's guardian Booking (Grace Park); how `funderOverride` survived 20 and
   21 (untouched); where 16 stored `invoiceNumber` and `reference` on the Xero records and how it names
   Xero contacts; that 16's count is `bctisFor` over `bctiRecords`; how 16 shows the AA fee invoice
   (exempt here); that 14's PWA "Office authorises this List" body is `authoriseAsSimulatedOffice`; and
   the current `PERSIST_VERSION`.
5. **Prentice.** Read which Contract 18 to 21 left Alan Prentice's Procedure on (Souter Mon 20 PM, at
   the snapshot `CONTRACT.stgDefault` with a nib-allocated line and a "Patient portion" line; 18's
   plan turns it into the plain `CT-STG-D1` "St George's RVG", `CONTRACT.stgRvg`, which bills its
   holder St George's, so expect to move it), who its
   un-overridden line now bills, and whether the fee is still 8 units x $26.50 = $212.00. The target
   (work item 9) is that Procedure on a Contract whose fee stays $212.00 and whose invoice goes to the
   payer on the Booking (Alan Prentice); No contract (RVG) does that. If 20 or 21 left it on a
   Contract that bills St George's or nib, move it to No contract (RVG) and log the move.
6. Record the result (changed items, OQ status, what the earlier phases left) in the PROGRESS entry.

## Reference

**Design (convention 17).** No mockup covers the invoice document, the Invoices list, the Contract
sheet, the Split sheet or the Xero simulation, so extend the existing screens' own patterns and
[Design Language.dc.html](../../../design/Design%20Language.dc.html): teal `#0D6E63` for Split, Save,
Resend and Send; pill radius 999 on semantic tokens for delivery states (success tint for Emailed,
neutral for Queued for portal and Not sent, warning tint for No invoice email), never the six
schedule status colours; Spline Sans Mono with tabular-nums for every amount, share, GST number and
invoice number. Crimson stays identity only: the AA logo moves into the invoice's agent block (still
identity), and nothing new is crimson. The Split sheet is a bottom sheet on mobile and a side sheet
on web and Admin (desktop layouts). [Admin Review.dc.html](../../../design/Admin%20Review.dc.html) is
the layout for the authorise banner whose copy changes. The 2026-07-28 invoice workspace decision
(760px document, 264px sticky rail) stands.

**Catalogue.** The covered items above, plus
[US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md) (Retired: the boundary, read its note),
[US-08.4.1](../../../../requirements-board/requirements/stories/US-08.4.1.md) (two layouts),
[US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) (prices held GST exclusive, GST at the foot),
[US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) (the direct insurer, its portal, and the cover split as a Booking split),
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) (the payer on the Booking),
[US-08.4.3](../../../../requirements-board/requirements/stories/US-08.4.3.md) (unique numbers, `-P`),
[FT-08.2](../../../../requirements-board/requirements/stories/FT-08.2.md) and [US-08.2.1](../../../../requirements-board/requirements/stories/US-08.2.1.md) (one invoice per billable party),
[US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md) (the additional invoice: a different button, Phase 38b),
[FT-09.1](../../../../requirements-board/requirements/stories/FT-09.1.md) (the pair mirrored to Xero),
[OQ-42](../../../../requirements-board/requirements/questions/OQ-42.md) (each BCTI the same value as its receivable),
[OQ-68](../../../../requirements-board/requirements/questions/OQ-68.md) (answered, the owner's pick), and
[domain-model.md](../../../../requirements-board/requirements/domain-model.md) (the Contract rows named above and the Internal ledger bullets).
Read why with `npm --prefix requirements-board run source -- --item <ID> --text` (Node 22.18 or newer):
US-04.2.8 and US-05.2.7 cite [notes/2026-10-07-aa-meeting-with-greg.md](../../../../requirements-board/requirements/notes/2026-10-07-aa-meeting-with-greg.md)
#32 ("everything internally is exclusive and then the GST goes on the bottom of the invoice") and #38
(layout, delivery and GST set on the Contract); US-08.2.3 cites
[notes/2026-10-02-aa-meeting-with-greg.md](../../../../requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md) #9
("split in any which way", "You pick what's best") and the 2026-10-05 typed decision recorded in
[changes/2026-10-07-requirements-update.md](../../../../requirements-board/requirements/changes/2026-10-07-requirements-update.md)
section 9; US-09.1.4 cites [notes/2026-10-01-aa-meeting-with-greg.md](../../../../requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md) #18 and #41.
Diagrams: [AR-25#generate-send](../../../../requirements-board/requirements/artifacts/AR-25.md),
[AR-24#send-invoice and #xero-pair](../../../../requirements-board/requirements/artifacts/AR-24.md);
the pricing model guide AR-28 ([#who-gets-the-invoice](../../../../requirements-board/requirements/artifacts/AR-28.md#who-gets-the-invoice),
[#booking-to-invoice](../../../../requirements-board/requirements/artifacts/AR-28.md#booking-to-invoice)), draft design AR-29
([#billable-party](../../../../requirements-board/requirements/artifacts/AR-29.md#billable-party), [#contract-fields](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-fields),
[#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md#booking-procedure-fields)) and ERD AR-30
([#contract](../../../../requirements-board/requirements/artifacts/AR-30.md#contract), [#contract-holder](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-holder),
[#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md#booking-procedure)). The catalogue screenshots for US-08.2.3 ("nib and St
George's"), US-08.4.2 (ready, emailed, portal) and US-09.1.4 (the old fee panel) show the July UI;
grade against the text.

**Analysis.**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Summary theme 3 (the Contract replaces the billing route)
  and theme 7 (Money model, which includes the BCTI), the Uncertainty bullet on OQ-29, the DM-16,
  DM-22 and DM-28 rows, and the EP-04, EP-08 and EP-09 tables. Per-gap detail:
  [epics/EP-08.md](../epics/EP-08.md) (header note, and US-08.2.3, US-08.4.2, FT-08.4, US-08.4.5),
  [epics/EP-04.md](../epics/EP-04.md) (US-04.2.8), [epics/EP-09.md](../epics/EP-09.md) (US-09.1.4).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-28, DM-16, and DM-22 (its
  invoice-presentation part and the BCTI cardinality note; DM-27 is merged into it).
- [analysis/reverse-check.md](../analysis/reverse-check.md) RV-37 (and the US-04.2.12 row).
- [analysis/prototype-map-domain.md](../analysis/prototype-map-domain.md) (`Invoice`, `BillingLine`,
  `Anaesthetist`, `invoiceBuild.ts`), [prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md)
  (`billingRun.ts`, `billingLineActions.ts`, `mastersActions.ts`, seed cast and bookings),
  [prototype-map-admin.md](../analysis/prototype-map-admin.md) (Invoices screen, InvoiceDocument,
  Master data), [prototype-map-shared.md](../analysis/prototype-map-shared.md) (`OfficeBillingSetup`,
  `BillingLinesCard`, `FunderAllocationSheet`), [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md)
  (Xero simulation, DemoBadge uses, PWA purity).

**PROGRESS.md.** Binding conventions 4, 5, 7, 8, 9, 13, 17, 18 and 19. Decisions log: **2026-07-22
fifth external review #4** (`BillingLine.funderOverride` and the conservation rule, superseded), the
**seventh external review**'s office-only per-line funder editor (A4/B4, superseded, RV-37),
**2026-07-23 Phase 08 build decisions** (2) layout by counterparty kind and (4) the GST caption,
both superseded, Phase 08 work item 2's "Email invoice = mark emailed-at", **2026-07-28 Invoice
preview centred with a sticky information rail** (kept; its Email control becomes Resend), and the
handoff item **P3 GST per-invoice rounding on funder splits** (still true of split shares).

**Code entry points** (paths under `aa-prototype/src/`, lines as at 60e2d1e; use the shapes 16 and
18 to 21 left).
- Types, `domain/types.ts`: `Anaesthetist` (~141, no GST number), `Contract` (~216, reshaped by 18),
  `PrepaymentDetail` (~435, the prepayment's own `'full' | 'split'`, a different concept: do not reuse
  it), `BillingLine.funderOverride` (~522-539), `Invoice` (~672: `layout`, `kind`, `emailedAtISO`
  ~685, 21's `invoiceEmail`), `InvoiceLine`, `XeroAccPay` (~790, reshaped by 16).
- Pure billing: `domain/billing/invoiceBuild.ts` (`GST_RATE` ~39, `layoutFor` ~216, grouping in
  `buildInvoicesForBooking` ~264, `prepaidFunderOverride` ~306, the `funderOverride` branch and
  `allocationStale` ~329-370), `domain/billing/fee.ts` (`FeeLine.funderOverride` ~143, ~248),
  `domain/billing/validateBookingForBilling.ts` (the conservation branch ~248), the billing index;
  21's billable-party module; 16's `bcti.ts`.
- Store: `store/billingRun.ts` (`runBillingForList` ~68, `retryBillingCase` ~285,
  `markInvoiceEmailed` ~398), `store/prepaymentActions.ts` (`raisePreProcedureInvoice` ~51),
  `store/billingLineActions.ts` (`setBillingLineAllocation` ~138, `setProcedureFunderAllocation`
  ~218, the `funderAllocationOfficeOnly` refusals ~154, ~232, ~313), `store/bookingActions.ts` (the
  anaesthetist funder guard ~531), `store/officeStandIn.ts` (`authoriseAsSimulatedOffice` ~28),
  `store/xeroHandoff.ts` (`handoffCase` ~153), `store/mastersActions.ts` (`editAnaesthetist`,
  `addAnaesthetist`, `setInsurerDirectClaims`, or 18's holder actions), `store/contractActions.ts`
  (`createContract`, `editContract`, as 18 reshaped them), `store/selectors.ts` (monitor stages ~385,
  the `emailed` stage ~524, `MonitorListRow.emailedCount`), `store/index.ts` exports.
- PWA: `pwa/officeSimulation.ts` (the kept "Play the office" auto-authorise, RV-22, which calls
  `authoriseAsSimulatedOffice` and so runs `runBillingForList`) with `pwa/officeSimulation.test.ts`,
  and `PwaDemoActions.tsx` (14's "Office authorises this List").
- AA fee invoices (16): `AaFeeInvoice`, `billing.aaFeeInvoices`, `XeroAccRec.kind: 'aaFee'`, and
  their Admin and Xero views. AA's own invoices, exempt from this phase (16's handoff).
- Seed: `domain/seed/cast.ts` (14 anaesthetists), `domain/seed/contracts.ts` (as 18 to 20 left it),
  `domain/seed/bookings.ts` (Prentice `twoFunderBooking` ~613-641, `scenario.twoFunder` ~40, ~1242),
  `domain/seed/patients.ts` (Alan Prentice; his email, or 21's payer email), `domain/seed/history.ts`
  (historical invoices and ACCPAYs), `domain/seed/billing.ts` (seeded prepayment invoice),
  `domain/seed/audit.ts` (`funderOverride`), `domain/seed/index.ts` (`SEED_MARKERS.twoFunderBooking`
  ~597), `domain/seed/seed.test.ts` (~259, ~367).
- UI: `apps/admin/screens/InvoiceDocument.tsx` (masthead ~100-145, the agent line ~142, GST caption
  ~216, rail with "Email invoice" ~278 and "Present via ... upload portal" ~262),
  `apps/admin/screens/InvoicesScreen.tsx` (Layout and Status columns), `apps/admin/screens/BillingMonitorScreen.tsx`
  (stage strip), `apps/admin/screens/ReviewScreen.tsx` (authorise banner), `apps/admin/screens/MasterData.tsx`,
  `apps/admin/flows/ContractEditSheet.tsx`, `apps/admin/flows/EditAnaesthetistSheet.tsx`,
  `apps/admin/flows/AddAnaesthetistFlow.tsx`, `apps/admin/screens/AdminBookingDetail.tsx`,
  `shared/booking/OfficeBillingSetup.tsx` (the funder lines ~46 and the Funder allocation button),
  `shared/capture/BillingLinesCard.tsx` (~91-103 "Billed to"), `shared/flows/FunderAllocationSheet.tsx`
  and `shared/flows/index.ts`, 20a's stack component and the mobile and web Booking screens that show
  it, `shared/audit/fieldLabels.ts` and `actionLabels.ts`, `apps/demo/DemoXero.tsx` (`AccPayCard`
  ~454), `apps/demo/xeroPairView.ts`, `apps/demo/DemoControlPanel.tsx` (S3 scenario text).
- Tests that pin today's behaviour: `domain/billing/invoiceBuild.test.ts`,
  `domain/billing/prePaymentInvoice.test.ts`, `domain/billing/validateBookingForBilling.test.ts`,
  `store/billingRun.test.ts`, `store/phase06Actions.test.ts`, `store/captureActions.test.ts`,
  `store/demoScenarios.test.ts`, `shared/audit/auditNarrative.test.ts`, `visual/admin-phase08.spec.ts`,
  `visual/xero-pair.spec.ts`; and 16's BCTI count tests, which must stay green unchanged.

## Work items

1. **Model** (`domain/types.ts`). DM-28, DM-16 (layout and delivery), DM-22 (presentation).
   - `Anaesthetist.gstNumber: string`, required, so the compiler finds every creator. US-08.4.5.
   - `ContractInvoicing`: `{ invoiceLayout: 'contractHolder' | 'patient'; deliveryMethod: 'email' |
     'portal' | 'none'; portalName?: string; gstTreatment: 'exclusiveAtFoot' }`, and
     `Contract.invoicing: ContractInvoicing`, required, on every Contract including No contract
     (RVG) and first-party Contracts. The names are the domain model's Contract rows. `gstTreatment`
     has the one value the catalogue states (every price held GST exclusive, GST at the foot of the
     invoice, US-05.2.7); it is a union of one so OQ-29 can add a value in one place. US-04.2.8.
     Phase 25's lock copies `invoicing` with the Contract version.
   - **The split, on the booking procedure** (US-08.2.3; no Contract or Procedure setting):
     `Procedure.split?: FeeSplit` where `FeeSplit = { shares: SplitShare[] }` and
     `SplitShare = { party: CounterpartyRef; basis: { kind: 'amount'; amountExGst: number } |
     { kind: 'percent'; percent: number } | { kind: 'rest' } }`. `party` uses the same reference 21
     uses for who is invoiced (a billable party, an organisation, an insurer, or the payer on the
     Booking). Absent means no split: the Contract's party is invoiced in full. Nothing on `Contract`
     names a split, a payment setting or a default share.
   - On `Invoice`:
     - `procedureIds: ProcedureId[]` (the Procedure links, in Booking order);
     - `supplier: { anaesthetistId; name; gstNumber }` and `agent: { name; gstNumber }`, snapshots
       taken at the run;
     - `split?: { procedureId; feeExGst; shareLabel; isRest: boolean }` (set on each invoice raised
       from a split share);
     - `lineage?: { role: 'otherShareOfSplit'; invoiceId: InvoiceId }[]` (Phase 38b adds
       `additionalTo`, Phase 39 adds `rebillOf`);
     - `delivery: InvoiceDelivery`, a discriminated union:
       `{ method: 'email'; status: 'sent'; sentAtISO; sends: { atISO; to; by }[] }`,
       `{ method: 'email'; status: 'noAddress' }`,
       `{ method: 'portal'; status: 'queued'; portalName; queuedAtISO }`,
       `{ method: 'none'; status: 'notSent' }`;
     - `layout` (kept, now set from `invoiceLayoutFor`) and `gstTreatment` (new, copied from the
       Contract's `invoicing`), snapshots taken at the run, so Phase 38b's additional invoice and
       Phase 25's regenerate read them from the original invoice;
     - the recipient address is 21's `invoiceEmail` snapshot; do not add a second copy;
     - remove `emailedAtISO`.
   - Remove `BillingLine.funderOverride` (and `FeeLine.funderOverride` in `fee.ts`).
   - On `XeroAccPay`: `taxInvoice: BuyerCreatedTaxInvoice` = `{ kind: 'buyerCreated'; documentName;
     wording; supplierName; supplierGstNumber; agentName; agentGstNumber; relatesToInvoiceNumber;
     provisional: true }`, required. One per ACCPAY, so one per receivable invoice. US-09.1.4.
2. **Pure presentation rules** in a new `src/domain/billing/invoicePresentation.ts`, re-exported from
   the billing index, all Vitest-covered (convention 9):
   - `AA_AGENT`: `{ name: 'Anaesthesia Associates Limited', gstNumber }` with a synthetic GST number;
     `BCTI_DOCUMENT_NAME = 'Buyer-created tax invoice'` (IRD has renamed it, new name unknown: this
     constant is the only place the name lives); `OQ29_CAPTION`, the one provisional caption from the
     drift check; and `GST_TREATMENT_CAPTION`: "Prices are held GST exclusive. GST is added at the foot
     of the invoice." The only place any of them lives.
   - `GST_RATE` moves here from `invoiceBuild.ts` (15%, the NZ standard rate; no longer described as
     an assumption, since US-05.2.7 is Confirmed). Update its importers (`seed/history.ts`,
     `store/paymentActions.ts`, `InvoiceDocument`, `invoiceBuild.test.ts`, and anything 16 added for
     the AA fee GST). Today's per-invoice GST at the foot is kept unchanged (US-05.2.7 Matches).
   - `isValidGstNumber(value)` (8 or 9 digits once spaces and hyphens are stripped) and
     `formatGstNumber` (`NN-NNN-NNN` or `NNN-NNN-NNN`). Format only, no IRD check digit.
   - `supplierFor(anaesthetist)`.
   - `invoiceLayoutFor(contract, party, isContractParty)`: the Contract's `invoiceLayout` when the
     invoice goes to the party the Contract bills (21's who is invoiced); for any other party (a split
     share to an added party) the recipient's class: a person gets the patient layout, an
     organisation the contract-holder layout (logged reading). US-04.2.8.
   - `deliveryPlanFor(contract, party, isContractParty, invoiceEmail, insurer?)`: for the Contract's
     own party, the Contract's `deliveryMethod` (`portal` with its `portalName`, `none`, or `email`);
     for an added split party, `portal` when the party is an insurer that accepts direct claims
     (portal name "{insurer} provider portal"), otherwise `email` (logged reading: a direct insurer is
     always presented through its portal). `email` with an empty `invoiceEmail` is `noAddress`.
     Returns the plan, not a stamped state, so the run stamps the time. US-08.4.2.
   - `buyerCreatedTaxInvoiceFor(invoice, accPayNumber)`: the ACCPAY snapshot. Wording (dash-free):
     "{BCTI_DOCUMENT_NAME}. Raised by Anaesthesia Associates Limited, GST {aa}, as agent, on behalf
     of the supplier {name}, GST {number}, for services invoiced on {invoiceNumber}." No patient name
     or NHI (OQ-30, 16's neutral Xero contacts).
   - `invoiceDeliveryLabel(invoice)`: "Emailed to {to} {hh:mm}", "Queued for {portal} portal", "No
     invoice email", "Not sent".
   - `defaultInvoicingFor(contract, holder)`: No contract (RVG), first-party Contracts and Contracts
     whose holder is not billed get the patient layout and email (they bill the payer on the
     Booking); a billed holder that is a direct-claims insurer gets the contract-holder layout and
     portal ("{insurer} provider portal"); any other billed holder the contract-holder layout and
     email; `gstTreatment: 'exclusiveAtFoot'` throughout.
   - Tests: layout for the Contract's own party under each holder kind, a guardian payer, and an
     added person and organisation split party; delivery for a portal Contract, a `none` Contract, an
     added direct insurer (portal), an added hospital (email), email with and without an address; GST
     number validation and formatting; the wording has no en or em dash, names both GST numbers and
     uses `BCTI_DOCUMENT_NAME`; the defaults for each holder kind.
3. **Pure split** in a new `src/domain/billing/splitShare.ts`, the one home of the split basis
   (US-08.2.3, OQ-68 answered as our pick). No provisional caption.
   - `parseShare(text)`: "$132.50" or "132.50" is an amount ex GST, "62.5%" a percent; returns the
     basis or a reason ("Type an amount such as $48 or a percentage such as 48%."). A bare number
     reads as dollars (logged reading, test-pinned).
   - `resolveSplit(feeExGst, shares)` returns either `{ ok: true; amounts: { party; amountExGst;
     isRest }[] }` in share order, cents exact, or `{ ok: false; reason }`. The reading built (logged
     for the owner, because whether % shares must total 100 is unsettled):
     - at least two shares, each party distinct;
     - every typed amount positive, every percent above 0 and below 100;
     - **at most one share takes "the rest"**; with one, the typed shares must come to less than the
       fee and the rest party pays the difference; without one, the shares must total the fee
       exactly (the percents to 100, or amounts and percents together to the fee to the cent);
     - percents round to cents (`roundToCents(fee * percent / 100)`), and any rounding cent goes to
       the rest party, else to the first share, so the amounts always total the fee.
   - `splitLineText(procedureWording, fee, share)` and `splitNoteText(...)`: the split's wording, in this one
     place (the catalogue leaves it unsettled, US-08.2.3 note; logged). Each party's invoice carries one
     line "{procedure wording}: share of the fee of ${fee} ({share label})" for its amount, where the
     procedure wording is 20a's `procedureInvoiceWording` (passed in, never re-derived, so D37's
     general-procedure wording stays in its one place), and a
     note "This fee of ${fee} is split. The other shares are invoiced separately to {party, invoice
     number}, ..." (numbers filled in by the run).
   - `shareLabel(basis)`: "$132.50", "62.5%" or "the rest".
   - Tests: Prentice ($212.00: nib `$132.50` and Alan the rest gives `132.50 / 79.50`; nib `62.5%` and
     Alan the rest gives the same; nib `$132.50` and Alan `$79.50` with no rest gives the same; nib
     `62.5%` and Alan `37.5%` gives the same); nib 60% and Alan the rest gives `127.20 / 84.80`; three
     parties (insurer 50%, hospital $50, patient the rest); conservation (`sum === fee` to the cent)
     over a sweep of fees, percents, amounts and party counts; refusals (one share, a duplicate party,
     two rests, shares over the fee with a rest, shares not totalling the fee without one, 0%, 100%,
     a non-positive amount); the parser for "$48", "48", "48%", "48.5 %", "" and "abc".
4. **Invoice build uses the split** (`invoiceBuild.ts`, the post-21 Booking builder):
   - Drop the whole `funderOverride` branch, `allocationStale` and the conservation re-check.
   - **No split:** unchanged from 21, the whole fee to the Procedure's billable party.
   - **Split:** `resolveSplit` on the Procedure's final fee ex GST (after any office price override).
     Each share becomes a draft line for its party, worded by `splitLineText`, tagged with `split`
     and `isContractParty` (true for the share whose party is the one the Contract bills). A share's
     invoice email is that party's own (21's `invoiceEmailFor(party, booking, patient, masters)` with
     the share's party), so a guardian's address can never reach an insurer's or a hospital's share.
   - A split that no longer resolves (the fee changed under a typed $ share, or the Contract or
     payer changed) fails review for that Booking with `splitDoesNotFit` and the pure reason ("The
     split no longer fits the fee of $x: ... Open Split to fix it."), through the existing
     per-Booking failure path; it never bills a guess. So the office sees it before authorising, add
     one 15a warning rule, `src/domain/warnings/rules/splitDoesNotFit.ts`, with its `WARNING_RULES`
     entry, `'splitDoesNotFit'` in `WarningRuleId` and its `appSettings.warningRules` default (filled
     by `backfillMerge`, as 21 did for `childPayer`): it reads `resolveSplit` (never its own maths)
     and shows the same reason on the Booking's triangle and at review.
   - `prepaidFunderOverride` becomes `prepaidSplit` (a split on a prepaid Procedure fails review;
     work item 5 also refuses it at entry). Phase 27 removes it with the interim flag.
   - Each `DraftInvoice` carries `contractId` (its first Procedure's, in Booking order),
     `procedureIds`, `split` and `lineage` hints (each share points at its siblings by index; the run
     resolves ids). Grouping stays one invoice per distinct party per Booking (FT-08.2, US-08.2.1): a
     split party who is also another Procedure's billable party on the same Booking gets one invoice
     holding both (its `split` then describes the split line only; logged reading, test-pinned).
     Drafts follow the share order, so numbering follows it. A party's invoice that spans Procedures
     on Contracts with different invoicing settings takes the first Procedure's (logged, test-pinned).
   - `layoutFor(counterparty)` is deleted; drafts use `invoiceLayoutFor`.
   - **One BCTI per receivable invoice.** Each draft becomes one invoice and so one ACCPAY at
     handoff. Do not split payables per Procedure and do not touch 16's count function.
   - **Carried across without regression** (items that grade Matches on today's code): GST at the
     foot of every invoice (US-05.2.7), one invoice per billable party per Booking (FT-08.2's
     grouping), and every non-split invoice's party and figures exactly as 21 left them (a parity
     test over every seeded Booking's drafts before and after).
   - Tests: the Prentice reproduction at domain level ($132.50 to nib, $79.50 to Alan Prentice, then
     $152.38 and $91.43 after GST) from each of the four equivalent share sets; an office price
     override splits on the overridden fee; a typed $ share above a reduced fee fails with
     `splitDoesNotFit`; a guardian payer as a split party gets the guardian's email and the insurer
     share keeps the insurer's; prepaid plus split fails; the `splitDoesNotFit` warning rule fires on
     the same reduced-fee Booking with the same reason and clears once the share is fixed; layout
     and delivery per item 2; the parity test; the retired branch's tests in `invoiceBuild.test.ts` and `prePaymentInvoice.test.ts` are
     rewritten, not skipped.
5. **Remove `funderOverride`; add the Split action** (retired behaviour, replaced by item 4):
   - `store/billingLineActions.ts`: delete `setBillingLineAllocation`, `setProcedureFunderAllocation`,
     `FunderAllocationEntry` and the `allocationNotConserved` and `funderAllocationOfficeOnly`
     refusals; the anaesthetist remove guard (~313) and `bookingActions.ts` (~531) lose their funder
     clause. Remove the exports from `store/index.ts`.
   - New `setProcedureSplit(api, actor, bookingId, procedureId, split | null)` (in
     `store/bookingActions.ts`), through `mutate()`: the office, and the anaesthetist on their own
     Booking (US-08.2.3: "the user"); the anaesthetist until the List is submitted, the office until it
     is authorised (the same lifecycle guards as 20's Contract change); refuses an unresolvable split
     with `resolveSplit`'s reason, `prepaidProcedure` ("A prepaid procedure is billed by its
     prepayment.") on a Procedure whose Booking carries 20's interim `prepaymentRequired` flag, and `noFee` when the
     Procedure has no fee yet; `null` removes the split. Audit `procedure.split` (before, after).
     Export from `store/index.ts`.
   - `validateBookingForBilling.ts`: delete the conservation branch; add the `splitDoesNotFit` check.
   - `shared/flows/FunderAllocationSheet.tsx`: delete, with its export. New
     `shared/flows/SplitFeeSheet.tsx` (pure-props, pwaPurity-safe): the Procedure's fee (mono), one row
     per party (a party picker, new here since 21 builds only the payer sheet: the payer on
     the Booking and the Contract's party first, then the contract holders' billable parties from 18's
     master, `billablePartyRef`, searchable by name; it creates no party record. Build it as its own
     pure-props component, `shared/booking/PartyPicker.tsx` (PWA-safe), with its options from one
     pure selector, because Phases 38b, 39 and 39b reuse it for their party fields: they call it
     "21's party search", and since 21 builds none, this is that component; never a second copy);
     a "$ or %" field parsed by `parseShare`; a "the rest" choice on
     at most one row), each row's resolved amount live from `resolveSplit`, a total line ("$212.00 of
     $212.00"), the pure reason when it does not resolve, teal **Save**, and **Remove split**. Opening
     it on an unsplit Procedure starts with two rows: the Contract's party (the rest) and an empty one.
   - **The Split button** on the Contract part of 20a's three-part stack, in the mobile and web
     Booking screens (the anaesthetist's own Bookings) and the Admin Booking detail. 20a's `ProcedureStack` (in `src/shared`) takes the button as a prop so it
     stays pure. Once split, the Contract part's "who is invoiced" line reads "Split: nib $132.50, Alan
     Prentice $79.50 (the rest)": extend 20a's `ProcedureStackView.contract` in
     `domain/billing/procedureStack.ts` with an optional `split` summary built from `resolveSplit`
     (beside `whoIsInvoicedFor`'s `InvoicedParty`, which stays the Contract's party), so the stack
     module stays the one place that decides what the stack says. Office review shows the same line.
   - `OfficeBillingSetup`: the Funders row and the Funder allocation button go. `BillingLinesCard`:
     the "Billed to" chip and its remove-hiding go.
   - `fieldLabels.ts`, `auditNarrative.test.ts`, `seed/audit.ts`: drop `funderOverride`; add `split`
     ("Split").
   - Tests: rewrite `phase06Actions.test.ts` (the allocation blocks go; `setProcedureSplit` rights by
     role and List state, refusals, removal and audit come in), `captureActions.test.ts` and
     `billingRun.test.ts` (the "rerouting to the patient" cases become typed shares; the
     stale-allocation case becomes `splitDoesNotFit`).
   - Grep `src` and `visual` for `funderOverride|FunderAllocation|allocationNotConserved|allocationStale|Funder allocation|paymentSetting|defaultSplitShare`:
     zero hits. The `Contract` type and its seed carry no `split` field of any name (a
     `seed.test.ts` check that no seeded Contract or Contract line has a key matching `/split|paymentSetting/i`,
     not a source grep, since `splitShare.ts` and its locals legitimately use the word).
6. **The run sends each invoice** (`store/billingRun.ts`, `store/prepaymentActions.ts`):
   - Extract one store helper, `materialiseInvoices(state-in-mutate, drafts, bookingId, atISO,
     counters, { send })`, used by `runBillingForList`, `retryBillingCase` and
     `raisePreProcedureInvoice`, so the three paths cannot drift. It allocates ids and numbers, builds
     each `Invoice` with `supplier` (from the List's anaesthetist), `agent` (`AA_AGENT`),
     `procedureIds`, `split`, `lineage` (each share links the others), 21's `invoiceEmail`, and, when
     `send` is true, **stamps `delivery` from `deliveryPlanFor` at the run's clock time**, in the same
     `mutate()` as the invoices. Keep the send step separable: Phase 27 generates the prepayment invoice
     unsent and sends it on admin approval (D6) through the same helper. Today the office raises the
     prepayment invoice itself, so `send: true` there for now.
   - Audit, per invoice, source system, actor "Billing run": `invoice.sent` (after: `to`, `atISO`),
     `invoice.portalQueued` (after: `portalName`), `invoice.notSent` (after: `reason: 'noAddress' |
     'deliveryNone'`). The `list.billed` audit gains `sentCount`, `queuedCount`, `notSentCount`.
   - A missing address never fails the run or the Booking: the invoice is raised with
     `delivery.status: 'noAddress'` and shows in the monitor (item 11).
   - Replace `markInvoiceEmailed` with `resendInvoice(api, actor, invoiceId, { to? })`: office only;
     email delivery appends a send (to `to` if given, which must pass 21's invoice email check, else
     to the snapshot address) and moves `noAddress` to `sent`; `none` becomes a manual email send
     once an address is given; `portal` refuses with `portalDelivery` ("This invoice is queued for
     the {portal}."). Audit `invoice.resend`, source office. Update `store/index.ts`.
   - Selectors: the monitor's `emailed` stage becomes **"Sent or queued"**: done when every standard
     invoice is `sent` or `queued`, partial when any is `noAddress`, detail "3 emailed, 1 queued for
     portal, 1 needs an address." `MonitorListRow.emailedCount` becomes `deliveredCount` and
     `noAddressCount`.
   - AA fee invoices (16's `AaFeeInvoice`) do not go through the materialiser and gain no
     `supplier`, `agent` or `delivery`: they are AA's own invoices in AA's name.
   - Tests: every invoice from an authorised List is stamped at the clock time; the three audit
     actions and counts; `noAddress` raises the invoice; retry and prepayment raise stamp delivery
     too; split lineage links resolve to real invoice ids; a Booking whose payer is a guardian (21's
     Grace Park) is emailed to the guardian's address, not the patient's (US-08.4.2); `resendInvoice`
     rights, the portal refusal, the `noAddress` recovery and the send history; PWA "Office
     authorises this List" (14) and the kept "Play the office" auto-authorise
     (`officeSimulation.test.ts`) run the same send (store-level tests calling their bodies); an AA
     fee run is unchanged.
7. **Xero: the buyer-created ACCPAY** (`store/xeroHandoff.ts`, `apps/demo/xeroPairView.ts`):
   - `handoffCase` stores `taxInvoice = buyerCreatedTaxInvoiceFor(invoice, accPayNumber)` on the
     ACCPAY (16's `-P` number) and adds `taxInvoiceProvisional: true` to the `xero.pairCreated` audit.
     The ACCPAY's amount stays the receivable's total (16), so each split share has its own BCTI of
     the same value.
   - `xeroPairView` passes `taxInvoice` through; no view-time derivation.
   - Tests: the snapshot names the invoice's supplier and AA; it survives a later GST number edit;
     both Prentice ACCPAYs carry their own `taxInvoice` and equal their receivables ($152.38 and
     $91.43); 16's `bctisFor` over `bctiRecords`, unchanged, counts them as two and its own tests pass
     untouched; `store/xeroNhi.test.ts` (16's privacy scan) still passes. US-09.1.4.
8. **Masters and their actions** (`store/mastersActions.ts`, `store/contractActions.ts`, or where 18
   put the holder actions):
   - `editAnaesthetist` gains `gstNumber` (refuses an invalid one: "Enter a GST number of 8 or 9
     digits."); `addAnaesthetist` requires it. Audit field label "GST number".
   - `createContract`, `editContract` and 18's new-version flow carry `invoicing` (a new Contract or
     version starts from `defaultInvoicingFor`), validated: `portal` only where the Contract bills its
     holder and the holder is an insurer that accepts direct claims (US-04.2.8: "portal upload for
     the direct insurer"), and needs a `portalName`; `gstTreatment` is fixed. Turning direct claims
     off for an insurer (18's holder edit or `setInsurerDirectClaims(false)`) switches its portal
     Contracts to email, each audited, so no Contract is left invalid.
   - Tests for each validation, the defaults on create and on a new version, and the direct-claims
     switch.
9. **Seed** (determinism, convention 5), then **bump `PERSIST_VERSION`** by one:
   - `cast.ts`: a deterministic, synthetic 9-digit GST number for all 14 anaesthetists (from the
     registration number, labelled synthetic in a comment); Dr Souter's is the one the demo guide
     quotes.
   - `contracts.ts`: `invoicing` on every Contract via `defaultInvoicingFor`; the nib Contracts that
     bill nib get portal delivery with `portalName: 'nib provider portal'`.
   - `bookings.ts` Prentice (Souter Mon 20 PM): the two stored lines go; the Procedure sits on the
     Contract the drift check settled (No contract (RVG) unless 20 or 21 left it on another Contract
     that bills Alan at $212.00); its `split` is `[{ party: nib, basis: { kind: 'amount', amountExGst:
     132.5 } }, { party: the payer on the Booking (Alan Prentice), basis: { kind: 'rest' } }]`, set by
     the office (a seeded `procedure.split` audit entry). Alan has a seeded email (21's payer email).
     The fee is still 8 units x $26.50 = $212.00. Any description or source wording that says
     "funding split with nib" loses that phrase; the seed comment above it is rewritten; the
     `twoFunderBooking` variable and the `scenario.twoFunder` key become `feeSplitBooking` and
     `feeSplit`. Not `splitBooking`: that name is already Brian Holt's two-procedure Booking
     (`const splitBooking` ~538, `scenario.splitBilling`, `SEED_MARKERS.splitBillingBooking`, the
     RFP split-billing rule), which Phase 23 renames multi-procedure; leave those untouched here.
   - `history.ts` and `billing.ts`: every seeded invoice gets `procedureIds`, `supplier`, `agent` and
     a `delivery` stamped at its `raisedAtISO` (email to the party's seeded address, or portal for a
     nib invoice); every seeded ACCPAY gets its `taxInvoice`.
   - `index.ts`: `SEED_MARKERS.twoFunderBooking` becomes `feeSplitBooking` ("One procedure's fee split
     between nib and the patient"); update every reference (Control Panel, 14's trigger registry,
     tests, capture recipes).
   - Tests (`seed.test.ts`, `demoScenarios.test.ts`): two builds deep-equal; every anaesthetist's GST
     number is valid and unique; every Contract has `invoicing`; no seeded line carries a funder and no
     Contract carries a split; `authoriseList` on both S3 Lists raises **AA-2026-0002 Brian Holt Forte
     Health $396.18**, **AA-2026-0005 nib $152.38 (queued for nib provider portal)** and
     **AA-2026-0006 Alan Prentice $91.43 (emailed to Alan)**, with every S3 invoice `sent` or `queued`
     and none `noAddress`; re-typing nib's share as 62.5% gives the same two invoices; nib 60% with
     Alan the rest gives $146.28 and $97.52; removing the split gives one invoice of $243.80 to Alan.
   - Re-green `npm run build`, `npm run build:pwa` and `npx vitest run` here (the stop point).
10. **Admin invoice document** (`apps/admin/screens/InvoiceDocument.tsx`). US-08.4.5, US-08.4.1,
    US-04.2.8, US-08.2.3.
    - **Masthead:** the supplier on the left: the anaesthetist's name (from `invoice.supplier`, not
      the live master), "GST number {formatted}" in mono. On the right: "TAX INVOICE" and the number.
    - **Agent block**, beneath the addressee: the small AA `Logo` with "Issued by Anaesthesia
      Associates Limited as agent for {supplier}. AA GST number {aa}." and the "Provisional (OQ-29)"
      pill with `OQ29_CAPTION`. The old italic agency line goes (`data-shot` `invoice-agency-line`
      moves to the block).
    - **Addressee:** the party from 21's `billedTo` snapshot (name and address, so a guardian payer
      reads as the guardian), "Attn: Accounts" on the contract-holder layout, and 21's invoice
      email in small mono.
    - **Lines and totals:** as today, Subtotal, "GST (15%)" and Total due at the foot, with
      `GST_TREATMENT_CAPTION` replacing the old "GST ... is a demo assumption" footer.
    - **Split note** on a split share's invoice, from `splitNoteText`, linking each sibling invoice.
      No provisional pill (the split is the owner's decision); the wording is logged as unsettled.
    - **Rail, Delivery card** from `invoice.delivery`: Emailed to {to} at {time} (success, DemoBadge
      "Simulated send", with the send history when resent); Queued for {portal} (neutral, DemoBadge
      "Simulated portal queue"); No invoice email (warning, an inline email field and a teal
      **Send**); Not sent (neutral, with **Send** once an address is typed). A secondary **Resend** on
      sent email invoices; Print stays. No Email invoice button anywhere.
    - **Rail, Related invoices** card when `lineage` is present (the split's other shares).
    - `data-shot` hooks: `invoice-supplier`, `invoice-agent-block`, `invoice-delivery`,
      `invoice-split-note`.
    - AA fee invoices (16) keep AA's own masthead and wording: no supplier block, no agent block,
      no OQ-29 pill, no Delivery card.
11. **Invoices list, Billing monitor and Review banner.**
    - `InvoicesScreen.tsx`: the Status column becomes **Delivery** (pills from
      `invoiceDeliveryLabel`), Layout reads the snapshot, and the Counterparty cell gains a small
      "Split" chip on split shares. Keep the table's min width. `data-shot` `invoice-list-delivery`.
      FT-08.4 ("with layout and delivery status").
    - `BillingMonitorScreen.tsx`: the stage strip shows "Sent or queued" with item 6's detail, and a
      row with `noAddressCount > 0` links to its first such invoice.
    - `ReviewScreen.tsx`: the post-authorise banner reads "{n} invoices raised. {e} emailed, {q}
      queued for portal." (plus "{m} need an invoice email." when any).
12. **Master data** (`MasterData.tsx`, `ContractEditSheet.tsx`, `EditAnaesthetistSheet.tsx`,
    `AddAnaesthetistFlow.tsx`). US-04.2.8.
    - The Contract sheet gains an **Invoicing** section: Layout (segmented: Contract holder,
      Patient), Delivery (segmented: Email, Portal upload, None; Portal disabled with its reason unless
      the Contract bills a direct-claims insurer holder; a Portal name field), and GST shown read-only
      as "GST exclusive, added at the foot of the invoice" with `GST_TREATMENT_CAPTION`. No payment
      or split setting.
    - The Contracts table gains a Delivery column (text: "Email", "nib provider portal", "None").
    - The Anaesthetists table gains a mono **GST number** column; Edit and Add sheets gain the field.
13. **Xero simulation** (`apps/demo/DemoXero.tsx`, `AccPayCard`). US-09.1.4.
    - A **{BCTI_DOCUMENT_NAME}** block beneath the meta grid: the wording, then Supplier ({name},
      GST {number}) and Agent (Anaesthesia Associates Limited, GST {aa}) as `MetaItem`s, with the
      "Provisional (OQ-29)" pill and caption. `data-shot` `xero-accpay-buyer-created`.
    - The ACCPAY money-flow card copy gains "Held as a buyer-created tax invoice from the
      anaesthetist, one for each invoice and the same value." Any remaining note that the RFP does not
      specify GST treatment goes.
14. **Copy, labels and shots.**
    - `actionLabels.ts`: `invoice.sent` "Invoice emailed", `invoice.portalQueued` "Invoice queued for
      portal", `invoice.notSent` "Invoice not sent", `invoice.resend` "Invoice resent",
      `procedure.split` "Fee split"; remove `invoice.email`. `fieldLabels.ts`: `gstNumber`,
      `invoicing`, `split`, `delivery`; remove `emailedAtISO` and `funderOverride`.
    - Sweep `src` for "Email invoice", "Upload portal", "Billed by Anaesthesia Associates as agent",
      "two-funder", "funder" in copy, "Funder allocation", "cover" used for the split, and the GST
      assumption caption: each is replaced or gone.
    - No en or em dashes in any new string.
    - Playwright: `visual/admin-phase08.spec.ts` (the agent text, no Email invoice button, the
      Delivery card says Emailed to the Forte address, the Prentice rows show Queued for portal and
      Emailed, the nib rail has no Resend, the split note), `visual/xero-pair.spec.ts` (the
      buyer-created block), a Master data shot of the Invoicing section, and Split sheet shots on the
      Admin Booking detail and the mobile Booking.
15. **Re-green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`.

## Demo triggers

This phase adds **no new harness-bar button**. The sends and the split are product behaviour,
visible on product actions, as the gap analysis recommends:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| **Authorise for billing** (existing product action, not a trigger) | Admin Review (`/admin/review/:listId`) | Product UI | Runs the billing run, which now raises and sends every invoice: the banner counts emailed and queued, and each invoice's rail shows its delivery stamp (single-invoice Resend stays on the rail) |
| **Resend** / **Send** (existing rail, reworked; product office action) | Admin invoice (`/admin/invoices/:invoiceId`) | Product UI | `resendInvoice` on the invoice in the URL |
| **Split** (product action, office) | Admin Booking detail (`/admin/day/:dateISO/bookings/:bookingId`), a Procedure's Contract part | Product UI | `setProcedureSplit` on that Procedure: add parties, type each share in $ or %, one may take the rest; authorising then raises one invoice per party |
| **Split** (product action, anaesthetist) | Mobile Booking (framed and PWA) and web Booking, a Procedure's Contract part, on the anaesthetist's own Booking before submit | Product UI | The same action and sheet; the Contract part then reads "Split: ..." |

**Re-pointed:** the Billing monitor's resolve-and-retry and the prepayment raise now send as they
raise. Phase 14's re-homed `billing-failure` trigger ("Trigger billing failure", Admin Billing
monitor) needs no change, but check its retried invoice is stamped.

**PWA equivalent:** the Split button is product UI on the mobile Booking, so the PWA has it natively
(the sheet lives in `src/shared`, pwaPurity-safe). The only mobile beat here that waits on the office
(authorising the List) already has Phase 14's PWA-only **"Office authorises this List"**, which calls
the same guarded `authoriseList` and so runs the same sending run; the kept "Play the office"
auto-authorise does too. Confirm both with the store-level tests in item 6 and by checking Admin,
Audit after a PWA authorise.

## Out of scope

- Real email or PDF generation, and the portal upload itself (who uploads and when, and an
  "uploaded" state). The queued state is where the engine's job ends in the demo; note it as a
  discovery question.
- Any Contract or Procedure payment setting or default share (US-04.2.12 Retired).
- The additional invoice on top of a Contract line (US-08.6.3, Phase 38b) and the combined split by
  credit then additional invoices (US-08.6.4, Phase 39).
- One BCTI per Procedure (unresolved; ROADMAP "BCTI granularity") and a BCTI document separate from
  the ACCPAY record (built as the ACCPAY). Approving a period's BCTIs (US-10.2.6) is Phase 39a's.
- Anaesthetist-facing GST number editing (Phase 26's profile picks up `gstNumber`), and any mobile or
  web view of invoice delivery.
- Locking the Contract's invoicing settings and the Procedure's split at AUTHORISED (Phase 25; the
  invoice snapshots are enough until then).
- The primary Procedure and multi-procedure pricing (23), the price precedence and the anaesthetist
  adjustment (24), and how a prepaid Procedure is priced (27, which removes `prepaidSplit` with the
  interim flag).
- Credit notes and rebills (39); `lineage` leaves room for them.
- The internal ledger (36): receivable and payable legs will read these invoices, one payable leg
  per receivable, with a parity test against 16's count function.
- The final OQ-29 wording, IRD's current name for the document, any other GST treatment, and any
  tax-code mapping on the Xero records.
- AA fee invoices (16): AA's own invoices in AA's name, with no supplier, agent, delivery or
  buyer-created block.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin, Master data, Anaesthetists: every row shows a GST number; editing Dr Souter's to
      "12" refuses with the GST message; a valid one saves and shows in History.
- [ ] Master data, Contracts: every row shows Delivery; nib's billed Contract shows "nib provider
      portal"; Portal is disabled with its reason on No contract (RVG) and on a hospital Contract; the
      GST line reads "GST exclusive, added at the foot of the invoice" and cannot be changed; there is
      no payment or split setting anywhere on the sheet.
- [ ] S3 Beat 1: authorise Forte AM, then St George's PM. The banner counts emailed and queued.
      AA-2026-0002 Brian Holt Forte Health $396.18 shows "Emailed to" Forte's address in the rail,
      with the Simulated send badge; there is no Email invoice button.
- [ ] AA-2026-0005 nib $152.38: contract-holder layout, Queued for nib provider portal, the split
      note naming AA-2026-0006. AA-2026-0006 Alan Prentice $91.43: patient layout, the share line,
      Emailed to Alan's address, linked back. No invoice goes to St George's for this Booking.
- [ ] Every invoice shows Dr Souter as supplier with her GST number, the agent block with AA's GST
      number, the Provisional (OQ-29) pill, and GST at the foot with the GST caption.
- [ ] Admin Booking detail, Prentice's Booking (after a reset, before authorising): the Contract part
      reads "Split: nib $132.50, Alan Prentice $79.50 (the rest)"; Split opens the sheet with those
      rows; typing "62.5%" for nib gives the same amounts; "abc" refuses with the parser's message;
      two rows both on "the rest" refuse; nib 60% and save, then authorise: nib $146.28 and Alan
      $97.52. Remove split: one invoice to Alan. No Funders row, no Funder allocation button.
- [ ] Anaesthetist split (PWA at 5174 and the framed mobile app, Dr Souter): on a Booking on her
      ACTIVE List, Split on the Contract part, add an insurer at 40% with the payer the rest, save;
      the Contract part shows the split; on the web app the same Booking shows it; after submitting
      the List the Split button is gone for her; Admin, Audit shows `procedure.split` by Dr Souter.
- [ ] Split refusals: on a Procedure of a Booking carrying 20's interim prepayment flag, Split refuses with the
      prepaid message; a split whose typed $ share exceeds a fee the office then lowers at review
      fails that Booking's billing with the "no longer fits" reason (and, before authorising, the
      Booking shows the warning triangle with the same reason), and fixing the share lets it bill.
- [ ] A party with no address: after a reset, clear St George's contact email in Master data (17),
      then authorise a submitted, unscripted List whose invoices bill St George's (pick it at the
      drift check). Its invoices are raised with "No invoice email"; the monitor stage is partial
      with a link; typing an address and Send stamps it Emailed.
- [ ] Guardian: authorise the List holding Grace Park's Booking (submit it first if it is ACTIVE; 21's guardian as the payer on the
      Booking). Her invoice is addressed to the guardian and "Emailed to" the guardian's address.
- [ ] Resend on a sent invoice adds a second send to the history; the nib invoice offers no Resend.
- [ ] An AA fee invoice (16) still reads as AA's own invoice: no supplier, agent or OQ-29 pill; the
      next fee run counts the two Prentice BCTIs as two, as 16's count function did before.
- [ ] No "Funder allocation", "Billed to", "two-funder" or "covered portion" text anywhere in the
      three apps.
- [ ] Xero simulation, AA-2026-0005 and AA-2026-0006 pairs: each ACCPAY shows its own Buyer-created
      tax invoice block with Dr Souter's and AA's GST numbers and the provisional pill, and equals
      its receivable; no NHI or patient name appears.
- [ ] Admin, Audit shows `invoice.sent`, `invoice.portalQueued`, `invoice.resend` and
      `procedure.split` with the right actor and source.
- [ ] PWA: "Office authorises this List" on a submitted List, then in the framed build Admin, Audit
      shows that List's invoices sent by the Billing run.
- [ ] No en or em dashes in any new app copy; teal is the only action colour; crimson only in the
      logo and existing identity.
- [ ] Catalogue screenshots: the recipes for US-04.2.8, US-08.4.2, US-08.4.1, US-08.4.3, US-08.4.4,
      US-08.4.5, US-08.2.3 and US-09.1.4 are created or updated, US-04.2.12's recipe reads Retired,
      any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe
      and no story without a recipe, the covered items' new shots are checked by eye, and `npm run
      verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` all green.

## Demo guide updates

Patch in the same session: `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, `01-personas-and-responsibilities.md`, the same sections of
`master-demo-guide.html` (the S3 details block, the billing-run workflow paragraph and the cheat
sheet's Split billing and money sections) and the S3 scenario text in `DemoControlPanel.tsx`.

- **Seed overview** (the script's opening, which names "the split-billing and two-funder Lists"):
  "two-funder" becomes "fee-split" (not plain "split": "split-billing" still names Brian Holt's
  two-procedure Booking until Phase 23 renames it multi-procedure).
- **S3 Beat 1** (the beat with the "Funder allocation" aside):
  - Click: drop "Email invoice, All invoices"; instead "Pause on the Delivery card: the run already
    emailed it", then open AA-2026-0005 (Queued for nib's portal) and AA-2026-0006.
  - Say: "The Billing Engine, not Xero, produces and sends every invoice as part of the run, in Dr
    Souter's name with her GST number and AA as agent. Each Contract decides the layout, whether the
    invoice goes by email or to an insurer portal, and GST, which is always added at the foot. Alan's
    knee arthroscopy was split on the Booking: nib pays $132.50 and Alan the rest, so nib is invoiced
    its share and Alan the gap, each on its own invoice." Name the agent and buyer-created wording as
    provisional (OQ-29). The Split button is the owner's decision, so it is not called provisional.
  - Expected: figures unchanged ($396.18; $152.38 and $91.43); AA-2026-0006 goes to Alan Prentice
    (the gap), not St George's; each invoice shows its delivery stamp.
  - Optional aside: the **Funder allocation** aside becomes "open Alan's Booking and press Split on
    the Contract part: type nib's share as 62.5% instead of $132.50, same split; any user can split,
    including the anaesthetist on mobile, and there is no split setting on the Contract".
  - "fee-split" replaces "two-funder" in the beat and in "Stage it" ("the fee-split Booking").
- **S3 Beat 2:** add one line: each ACCPAY carries provisional buyer-created tax invoice wording
  naming Dr Souter as supplier and AA as agent, one per invoice and the same value, so Alan's split
  gives two.
- **Discovery points (S3):** add the OQ-29 wording and IRD's new name for the document, the split's
  open details (whether typed % shares must total 100, what the split lines say), BCTI granularity
  (one per invoice built, "one per procedure" to confirm with the accountant) and portal upload
  ownership; drop the funder-split wording, including "the split-billing invoice count (the prototype
  groups by counterparty, two invoices when funders differ)", which becomes "one invoice per billable
  party per Booking; a Split on the Booking gives one invoice per share".
- **Cheat sheet:** the Split billing bullets become "Split is a button on a Procedure's Contract part
  in the Booking, for the office or the anaesthetist. Each party's share is typed in $ or %, one
  party can take the rest, and each party gets its own invoice. No split setting on the Contract."
  Add an "Invoices" block (anaesthetist as supplier, AA as agent, layout and delivery set on the
  Contract, GST at the foot, sent by the run to email or portal, Resend on the rail, one BCTI per
  invoice). The bullets "One Procedure may allocate conserved lines across two funders" and "The
  prototype groups lines by counterparty; different funders create separate invoices", and the
  RFP-tension bullet "two invoices when funders differ", become the Split wording above and "one
  invoice per billable party per Booking".
- **Workflows doc:** the billing-run steps (step 5's "conserved two-funder allocations" goes: the
  split is typed on the Booking; step 8's layout comes from the Contract; step 9's "Office can
  simulate email or print" becomes "the run sends or queues each invoice; the office resends only"),
  and the "RFP ambiguity" paragraph's "two invoices arise where funders differ" becomes "two invoices
  arise where a Procedure's fee is split on the Booking".
- **Personas doc:** the office no longer emails invoices or allocates lines to funders; it resends,
  fixes a missing invoice email and may split a fee on a Booking; the anaesthetist may split a fee on
  their own Booking before submitting.
- **Control Panel S3 text:** "the two-funder Booking" and "two-funder Lists" become "the fee-split Booking" and "fee-split Lists" (Phase 23 keeps this name when it renames split-billing); mention the run
  sends the invoices.
- Not a milestone phase; no full consistency read (Phase 25 closes the "After 25" milestone).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 22` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md) Invoice presentation and delivery | absent | Captured. The recipe file exists with `status: absent`: drop the absent reason and add the shots, admin: `contract-invoicing` on Master data, Contracts, the Contract sheet's Invoicing section (layout, delivery, and the read-only GST line "GST exclusive, added at the foot of the invoice"; highlight the section); `contracts-table` with the Delivery column. Caption: layout, delivery and GST treatment are set on the Contract, not booking by booking; every price is held GST exclusive. |
| [US-08.4.2](../../../../requirements-board/requirements/stories/US-08.4.2.md) Send to the invoice email | partial · admin-email-invoice (ready, emailed), admin-portal-upload | Captured. The billing run now sends, so the manual "Email invoice" click goes. Keep the shot `name`s: `admin-email-invoice` states `ready` (the authorise banner "{n} invoices raised. {e} emailed, {q} queued") and `emailed` (the Delivery card "Emailed to {address}", `invoice-delivery`); add a `guardian` state on Grace Park's invoice emailed to the guardian's invoice email (the payer on the Booking, 21); `admin-portal-upload` shows the Prentice nib invoice "Queued for nib provider portal". Replace the "Invoice ready to email" caption with one that says the run sends it. Drop the partial reason. |
| [US-08.4.1](../../../../requirements-board/requirements/stories/US-08.4.1.md) Two invoice layouts | captured · admin-patient-layout, admin-contract-holder-layout | Stays captured. Re-shoot both: the layout now comes from the Contract and the masthead shows the anaesthetist as supplier with the agent block. Re-check `INV0001` is still the patient-layout invoice and fix the start if numbering moved. |
| [US-08.4.3](../../../../requirements-board/requirements/stories/US-08.4.3.md) Unique invoice numbers | captured · simulator-xero-numbers | Stays captured. Verify only: the numbers (AA-2026-0002, 0005, 0006) must not move; re-shoot if the ACCPAY rows or the first four rows changed. |
| [US-08.4.4](../../../../requirements-board/requirements/stories/US-08.4.4.md) Invoice reproducibility | partial · admin-snapshot-invoice | Stays partial. Re-shoot `admin-snapshot-invoice` on the new document (it now stores supplier, agent and delivery on the snapshot). Keep the partial reason, naming Phase 25 as the phase that builds the regenerate action from the locked data and Contract version. |
| [US-08.4.5](../../../../requirements-board/requirements/stories/US-08.4.5.md) Anaesthetist as supplier, AA as agent | partial · admin-agent-line | Captured, labelled provisional (OQ-29). Re-point `admin-agent-line` from `invoice-agency-line` to `invoice-agent-block` ("Issued by Anaesthesia Associates Limited as agent for {supplier}") and add `admin-supplier` on `invoice-supplier` (the anaesthetist's name and GST number in the masthead). The "Provisional (OQ-29)" pill sits in the highlight. Drop the partial reason. |
| [US-08.2.3](../../../../requirements-board/requirements/stories/US-08.2.3.md) Split one Procedure's fee between two payers | partial · admin-split-invoices, admin-insured-portion, admin-remaining-portion | Captured. Replace all three stale captions (they say "nib and St George's" and "invoiced to St George's"). Re-shoot on the Booking split: `admin-split-invoices` the two Prentice rows in the Invoices list (nib and Alan Prentice, "Split" chips, `invoice-list-delivery`), caption "One procedure's fee split on the Booking between nib and the patient, an invoice each"; `admin-insured-portion` nib's share (AA-2026-0005, `invoice-split-note`); `admin-remaining-portion` the patient's gap (AA-2026-0006 to Alan Prentice). Add `admin-split-button`: the Admin Booking detail with the Split button on the Contract part and the Split sheet open on Prentice's Booking, states `amount` (nib $132.50, Alan the rest) and `percent` (after typing "62.5%"); and `mobile-split-button` (app mobile): the Split sheet on an anaesthetist's own Booking. Caption in the catalogue's words: a button on the Procedure's Contract line, each share typed in $ or %, no setting on the Contract. Drop the partial reason. |
| [US-09.1.4](../../../../requirements-board/requirements/stories/US-09.1.4.md) ACCPAY as buyer-created tax invoice | partial · simulator-accpay-record | Captured, labelled provisional (OQ-29). Re-point `simulator-accpay-record` (`/demo/xero/invoices/XRH01`) to `xero-accpay-buyer-created`: the buyer-created wording with Supplier (name, GST) and Agent (AA, GST). Replace the stale caption ("without buyer-created tax invoice wording") with: the ACCPAY is held as a buyer-created tax invoice, one for each invoice and the same value. Drop the partial reason. |

**Retired.** [US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md)'s recipe
holds the reason "Not built yet: catch-up Phase 22 builds this"; set it to `status: absent` with
"Retired: splitting is a button on the Booking (US-08.2.3), built in Phase 22; no Contract payment
setting."

**Recipes this phase breaks.**
- `US-11.3.3` clicks `role=button[name="Email invoice"]` on `/admin/invoices/INV0002`; the button goes (work item 14). Re-point it to the Delivery card's Resend, or shoot the stamped state the run now leaves, keeping its shot `name`.
- `US-08.4.2` clicks the same button (covered above).
- `US-05.2.7` shoots `/admin/invoices/INV0001` for the GST lines; the GST footer caption changes (work item 10), so re-check its highlight and make its caption say every price is held GST exclusive with GST at the foot.
- `FT-08.4` shoots the Invoices list ("with layout and delivery status"); the Status column becomes Delivery, so re-shoot it with the delivery pills.
- `US-08.2.1`, `US-08.2.2`, `US-08.3.1` and `US-10.1.2` authorise a List and then pick rows (`tr:has-text("Alan Prentice")`, `"Brian Holt"`, the `invoice-info-rail` "Xero handoff" section) in the Invoices list; Prentice's two rows are now a Booking split, the second billed to Alan, not St George's. Re-check the row text, any step or caption that names St George's for AA-2026-0006, and the rail section titles.
- `US-06.2.2`, `US-06.3.1`, `US-06.4.1`, `US-09.1.1` start on `/admin/invoices`; the `--dry` run is the check that they still resolve (their stale prepayment captions are Phase 27's and 41's).
- Every `/demo/xero` recipe that highlights `xero-accpay-card` (`US-08.3.1`, `US-09.2.4`, `US-10.2.1`, `US-10.2.2`; `US-09.1.4` is covered above): the card gains the buyer-created block, so re-check each highlight and caption.
- The Billing monitor recipes on `/admin/billing` (`FT-08.5`, `FT-13.3`, `US-08.1.1`, `US-08.3.4`, `US-08.5.2`): the emailed stage becomes "Sent or queued" (work item 11); re-check their captions.
- Any recipe that opens Prentice's office billing setup or the Funder allocation sheet: point it at the Split sheet.

**ATLAS.md.** Update Seed data (Prentice's Booking split, `SEED_MARKERS.feeSplitBooking` replacing `twoFunderBooking`, AA-2026-0006 now to Alan Prentice), Existing hooks (`invoice-supplier`, `invoice-agent-block`, `invoice-delivery`, `invoice-split-note`, `invoice-list-delivery`, `xero-accpay-buyer-created`, the Split button and sheet hooks; `invoice-agency-line` removed) and the Overlays section (the Split sheet on Admin and mobile; the Contract sheet's Invoicing section).

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard
**adversarial review-and-fix pass (PROGRESS convention 18)**: fan out independent Opus review
subagents for **quality**, **bugs/correctness** and **plan adherence**, plus a fourth on **money
conservation and determinism**, since this phase changes how one Procedure's fee is split between
invoices. This session then verifies every finding against the catalogue and the code, fixes the
confirmed ones with a test where a bug had none, re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log, except the rulings this phase explicitly supersedes.

**Steer this phase's reviewers at:**
- **Conservation.** For every split Procedure the shares total the fee to the cent, after an office
  price override too, for $ and % shares, with and without a rest party, for two and three parties;
  the Prentice figures are exactly $152.38 and $91.43 from each equivalent share set; no line is
  billed twice or dropped when a party's invoice spans several Procedures; a split that no longer
  fits fails review rather than billing a guess.
- **The decision as written (US-08.2.3, 2026-10-05).** The split is a user action on the Booking, for
  the office and the anaesthetist, with no setting and no default on the Contract or the Procedure:
  grep for `paymentSetting` and `defaultSplitShare` finds nothing and no seeded Contract or line has a
  split key; the parser, the
  validation, the rest rule and the split wording live only in `splitShare.ts`.
- **Who gets what.** A split adds parties to one Procedure's fee only; every unsplit invoice's party
  and figures are unchanged from Phase 21 (the parity test); each share goes to its own party at that
  party's own invoice email; a guardian's address never reaches an insurer's share.
- **Rights and lifecycle.** The anaesthetist splits only their own Booking and only before submit;
  the office until authorised; a Procedure on a Booking under the interim prepayment flag cannot be split; every change is audited through
  `mutate()`.
- **BCTI count.** One ACCPAY and one `taxInvoice` per receivable invoice, each the same value as its
  receivable; no per-Procedure payable; Phase 16's count function and its tests are unchanged and
  count a split as one per share.
- **No residue.** Zero hits for `funderOverride`, `FunderAllocation`, `allocationNotConserved`,
  `allocationStale`, `markInvoiceEmailed`, `emailedAtISO`, "Email invoice" and "Funder allocation";
  no dead exports; no test skipped instead of rewritten.
- **Sending.** Every invoice path (run, retry, prepayment raise) goes through the one materialiser and
  stamps delivery in the same `mutate()` with a system audit entry; the send step is separable for 27;
  `noAddress` never fails a run; portal only for a direct-claims insurer; `resendInvoice` is
  office-only and audited.
- **Snapshots.** Supplier, agent, invoice email, delivery and the ACCPAY `taxInvoice` are snapshots,
  so editing a GST number, a Contract's invoicing or an email after the run changes no raised
  invoice; no NHI or patient name reaches Xero (16's privacy scan).
- **GST.** Every price stays GST exclusive with GST at the foot (US-05.2.7 carried across unchanged);
  `GST_RATE` and the GST caption live in one place; no GST-inclusive presentation was built.
- **Provisional labels.** Every surface with the agent or buyer-created wording shows the OQ-29 pill;
  the wording and `BCTI_DOCUMENT_NAME` live only in `invoicePresentation.ts`. The Split button carries
  no provisional pill. AA fee invoices (16) carry none of it.
- **Discipline.** `PERSIST_VERSION` bumped; seed deep-equal across builds; the Split sheet in
  `src/shared` with no admin import (pwaPurity); design tokens (teal actions, semantic pills, mono GST
  numbers and shares, crimson only as identity); no en or em dashes in app copy; the demo guide
  figures match the running app.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the readings built where the catalogue is unsettled, anything logged rather than
  fixed, and the screens worth a look, each with its route and persona. Include at least: the split
  rule (any number of parties, at most one takes the rest, otherwise the shares must total the fee;
  US-08.2.3's unsettled "must % shares total 100"); the split's line and note wording; the
  anaesthetist splitting until submit; Prentice's second invoice now to Alan Prentice, not St
  George's (if 20 and 21 had not already moved it; S3 Beat 1's figures unchanged); a split share to a
  direct insurer always queued for its portal; layout for an added party by recipient class; the bare
  number read as dollars; the OQ-29 wording; GST treatment stored as a single value.
- **Status table:** a catch-up row for Phase 22.
- **Phase entry:** the drift check result (catalogue diff from 60e2d1e, OQ-29 status, US-08.2.3 built
  as the 2026-10-05 decision, BCTI granularity, what 16 and 18 to 21 left), files and actions added and
  removed, the `PERSIST_VERSION` bump, the tests added and rewritten, the manual checklist item by
  item, and the review pass.
- **Decisions log:**
  - Supersede **2026-07-22 fifth external review #4** and the **seventh review's office-only funder
    editor** (RV-37): `BillingLine.funderOverride`, its conservation rule and the Funder allocation
    sheet are removed; a Procedure's fee is split between billable parties only by the Split button on
    the Booking, each share a typed $ or %, by the office or the anaesthetist, with no Contract
    setting and no default (US-08.2.3 and the 2026-10-05 typed decision; US-04.2.12 Retired; OQ-68
    answered as our pick). Record that the plan's earlier D18 reading (set on the Booking, defaulting
    from the Contract) was superseded before it was built.
  - Supersede **Phase 08 decision (2)**'s layout rule: layout comes from the Contract for the party it
    bills, by recipient class for an added split party (US-04.2.8), and **decision (4)**'s GST
    caption: every price held GST exclusive with GST at the foot is the Confirmed rule (US-05.2.7,
    agreed with Greg 2026-10-07), stored as the Contract's GST treatment.
  - Supersede Phase 08 work item 2's manual "Email invoice": the run sends or queues each invoice
    (US-08.4.2); the office only resends. The 2026-07-28 rail layout stands with Resend in the Email
    slot.
  - New readings: the split rule and wording above; a split adds parties for that one Procedure only;
    each share goes to its party at that party's own invoice email; a split that no longer fits the
    fee fails review; a split party who is also another Procedure's billable party on the Booking gets
    one invoice; a party's multi-Contract invoice takes the first Procedure's invoicing settings;
    portal only for a direct-claims insurer, and always for one; a missing invoice email raises the
    invoice unsent rather than failing it; one BCTI per receivable invoice (so a split gives one per
    share), with "one per procedure" still to confirm; the OQ-29 supplier, agent and buyer-created
    wording and the document's name are provisional.
  - Handoff item P3 (GST per-invoice rounding on splits) now reads "split shares".
- **Handoff notes:** Phase 23 re-keys `Procedure.split` if Booking-level pricing moves the priced
  line; Phase 25 locks `invoicing` with the Contract version and the Procedure's split in the
  snapshot; Phase 26's profile shows and edits `gstNumber`; Phase 27 removes `prepaidSplit` and the
  split refusal with the interim flag, and generates the prepayment invoice unsent, sending it on
  admin approval (D6) through `materialiseInvoices`' separate send step; Phase 36's ledger legs read
  `procedureIds` and `lineage`, one payable leg per receivable, with its parity test against 16's
  count; Phase 38b adds the `additionalTo` lineage role and Phase 39 `rebillOf`; Phases 38b, 39 and
  39b reuse `shared/booking/PartyPicker.tsx` (the party search they attribute to 21); portal upload
  ownership, the OQ-29 wording and the document's new name, the split's open details and BCTI
  granularity are questions for AA.
- **Catalogue screenshots.** The step's result: recipes created (US-04.2.8) and changed (US-08.4.2,
  US-08.4.1, US-08.4.3, US-08.4.4, US-08.4.5, US-08.2.3, US-09.1.4, US-04.2.12 to Retired, plus
  US-11.3.3, US-05.2.7, FT-08.4 and any other recipe the step broke), the `capture/REPORT.md` counts
  (captured, partial, absent, failed) before and after, and any partial reason handed to a later phase
  (US-08.4.4 stays partial until Phase 25).
