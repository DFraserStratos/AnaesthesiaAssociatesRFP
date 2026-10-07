# Phase 18 · Contract model

**Requirements covered:**
[US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md) (Contract categories; Verify, Greg is reviewing the model, OQ-78),
[US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) (create, edit, retire Contracts),
[US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) (a unique short AA code on every Contract, searchable; Verify),
[US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) (holder, the billable party the Contract always defines, scope including master-list procedures, and organisational reach; Verify, OQ-78),
[US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) (fixed fee schedule lines, with holder codes kept as searchable references; OQ-89),
[US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) (pricing effective from a date);
[DM-07](../analysis/domain-model-delta.md#dm-07) (Contract reshaped to category, holder, scope, pricing basis and `aaCode`),
[DM-09](../analysis/domain-model-delta.md#dm-09) (ContractPrice becomes FeeScheduleLine);
[RV-20](../analysis/reverse-check.md#rv-20-acc-treated-as-a-visible-special-case) (ACC treated as a visible special case).
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md)
(fixed fee pricing) left this phase: it was simplified on 2026-10-02 to "the fixed fee is the total
price" and now Matches. Its fixed path is kept through the reshape (work items 4 and 11) and its
recipe is re-pointed (Catalogue screenshots).
Open questions (still open, built as their recommendation and labelled provisional in one place):
[OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md) (which date picks the price),
[OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (default Contracts, or the hospital holding every Contract: keep the catalogue's model),
[OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md) (fixed fee after the rewording: the matched line's fee is the price, and lines keep time bands and add-ons).
Answered and built as answered:
[OQ-18](../../../../requirements-board/requirements/questions/OQ-18.md) (holder codes are kept for reference and are searchable; a Procedure and Contract pair can carry both an RVG code and a holder code),
[OQ-55](../../../../requirements-board/requirements/questions/OQ-55.md) (owner decision D2: insurer and funding source sit on neither the Booking nor the Patient),
[OQ-66](../../../../requirements-board/requirements/questions/OQ-66.md) (owner decision D16: a short structured AA code per Contract, searchable; the format is still to be designed, so it is ours, made in one function),
[OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) (owner decision D17: the Contract always defines the billable party, with as many Contracts as AA needs; Phase 21 builds the payer capture and removes the per-Booking override).
**Depends on:** Phase 17 (the Surgeon Group record that the Surgeon Group holder points at). Phases 14
and 15 are built (Card is now Booking, and triggers live in the screen-contextual registry), and the
plan runs 15a, 15b and 16 before this phase, so take the Booking names, the warning routine and the
`PERSIST_VERSION` you find.
**Estimated:** 2 sessions, at the upper limit. Session 1: work items 1 to 8 (model, seed, pricing,
category table, AA code and search helpers, store, parity green). Session 2: work items 9 to 13 (Admin Contract
catalogue with search, Contract detail, office billing setup, ACC removal, copy, demo guide), then
shots, the review pass and PROGRESS. If session 1 runs long, stop green after work item 6 (parity
fixture matching) and start session 2 with work item 7; do not start UI work before the store actions
exist.

## Goal

The Contract stops being "Type 1/2/3 plus a holder" and becomes the catalogue's four-part record:

- a **category**: the six catalogue categories, with no Pre-paid category, held as **data in one
  table** rather than spread through the code, because US-04.1.1 is Verify and Greg floated a model
  with no default Contracts (OQ-78);
- a **holder**: the **billable party the Contract always defines** (D17, OQ-67 answered): a
  hospital, a surgeon, a surgeon group, an insurer, or the payer named on the Booking;
- **scope filters**, including the master-list procedures it is set against (modelled here, filled
  by Phase 19a);
- a **pricing basis**.

Every Contract carries **AA's own short structured AA code** (`aaCode`, D16, OQ-66 answered),
separate from its system id and from any holder code, shown in the catalogue and the editor and
searchable (US-04.1.4). AA has not set a format ("we need to design a contract"), so the format is
ours and comes from one generator function. Each Contract also gets a review date and an explicit
retire. `ContractPrice` becomes a **FeeScheduleLine**. A line has the holder's own code and
description (kept for reference and searchable), GST-exclusive and GST-inclusive prices, an optional
RVG mapping, time band, add-on flag and quantity rule, and effective-dated prices with a visible
"Upcoming from <date>". Contract rates and discounts are effective-dated the same way. Under a fixed
fee Contract the matched line's fee is the whole price, not the BTM units (US-05.2.5), and lines keep
their time bands and add-ons (OQ-89's recommendation, provisional).

`fee.ts` prices from the new shape. Every seeded fee and every existing worked example is
re-expressed as a parity test, so **the S3, S4 and S5 figures do not move**. Selection keeps
today's resolver (`resolveContractForProcedure` and the default fallback in `invoiceBuild.ts`), so
the app stays green: scope is modelled and edited here, Phase 19a fills its procedures, and it only
narrows the picker in Phase 20. Insurer and funding-source scope are **data only**: they describe the
Contract and never narrow a choice, because no Booking or Patient holds an insurer or funding source
(D2, OQ-55). The holder already decides who each seeded invoice goes to; this phase changes no
counterparty, and Phase 21 captures the payer's name and email for a default or patient-direct
Contract. ACC loses its special-case markers and is priced as an ordinary holder's Contract. The
Admin Contract catalogue (Master data, Contracts) is rebuilt around the new record, with search,
because Contracts are expected to number in the thousands.

The fourth pricing basis is kept as today's **rate x time** interim. The catalogue renamed it a
Contract defined unit rate (US-05.2.6, DM-46); Phase 24 builds that and retires the hourly line, so
here it only keeps the Aria figures.

The add-on schedule lines built here are what Phase 39b offers as Contract add-on billing lines.

This is the largest pricing ripple in the plan. Behaviour changes are for Phases 19a to 25. This phase
changes the shape and keeps the numbers.

## Before you start: drift check

1. Run the drift diff and read it for this phase's items:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-04.1.1,US-04.1.2,US-04.1.4,US-04.2.1,US-04.2.4,US-04.2.10,OQ-18,OQ-48,OQ-55,OQ-66,OQ-67,OQ-78,OQ-89,US-04.2.2,US-04.2.11,US-04.3.2,US-04.4.1,US-04.4.2,US-05.2.5,US-05.2.6,US-05.5.1,US-11.2.2,OQ-25
   ```

   Check `US-04.1.1`, `US-04.1.2`, `US-04.1.4`, `US-04.2.1`, `US-04.2.4`, `US-04.2.10`, `OQ-18`,
   `OQ-48`, `OQ-55`, `OQ-66`, `OQ-67`, `OQ-78`, `OQ-89`, and the "Contract (recommended structure)"
   table (with `aaCode`, the `holder / billableParty` row, `procedures[]` scope and `paymentSetting`),
   the "Fee schedule line" table and the "Selection" paragraph in `domain-model.md`. Also skim
   `US-04.2.2` (pricing basis, now Verify, with the Contract defined unit rate as the fourth basis),
   `US-04.2.11` (combination Contracts), `US-04.3.2` (the picker: procedure then hospital, the default
   RVG Contract always offered, AA-code and holder-code search), `US-04.4.1` (default Contract),
   `US-04.4.2` (default RVG Contracts per procedure, Phase 19a), `US-05.2.5` (fixed fee, now Matches),
   `US-05.2.6` (Contract defined rate, Phase 24), `US-05.5.1` (ACC) and `US-11.2.2` (the payer set
   through the Contract, Phase 21), because this phase's shape has to fit them.
   - At `3d3a18c` the domain-model `category` row still lists "RVG Default Pre-paid". US-04.1.1 (no
     Pre-paid category) and OQ-25 win over that stale row (DM-07's note); do not build it.
   - If an item changed, re-read it and adjust the work items below before building. For example,
     a Pre-paid category coming back, a seventh category, Greg's Contract design (OQ-78), or a new
     line field.
   - If an item is now Retired or Future, drop it from this phase and say so in the PROGRESS entry.
   - A new item that touches the Contract record goes into this phase only if it is shape-only.
     Behaviour belongs in 19a to 25.
2. **US-04.1.1, US-04.1.4 and US-04.2.1 are Verify.** US-04.1.1 became Verify on 2026-10-02: the
   categories "could use a little bit of fleshing out" and Greg is not yet on board with the Contract
   model. US-04.2.1's organisational-by-default criterion is already met in substance; US-04.1.4's
   first criterion is true in data today (`CTN-nnn` ids) but never shown. Build all three as written,
   with the categories as one data table (work item 2) so a changed category set is a table edit, and
   note the status in PROGRESS. No UI label for Verify.
3. **Owner decision D2 (OQ-55, answered).** Confirm it still reads: insurer and funding source sit on
   neither the Booking nor the Patient. So `FundingSource` is a Contract-only type: nothing on the
   Booking, Procedure or Patient gains it, and insurer and funding-source scope describe the Contract
   and narrow nothing (US-04.2.1: "They stay as scope filters").
4. **OQ-18 (answered).** Build the answer: holder codes are kept on fee schedule lines as references
   and are searchable; the Procedure and its Contract together can carry both the procedure's RVG code
   and the chosen line's holder code. There is no anaesthetist holder-code picker: the pick is
   procedure first, then Contract (Phases 19 and 20). Here the line on a Procedure is either chosen by
   the office in billing setup or found through the line's RVG mapping. No provisional label.
5. **Owner decision D16 (OQ-66, answered).** Build the answer: a short structured AA code per
   Contract, searchable in the catalogue (and, from Phase 20, in the picker). AA has not set a format
   ("It's to be designed"), so build ours, `<category prefix>-<nnnn>`, from **one** generator function
   (`nextAaCode`, work item 3), so the format Greg designs is a one-function change. No provisional
   note in the app; put the format on the "For the owner's review" list. If the drift shows a format,
   implement it in the same function and update the pinned seed table.
6. **Owner decision D17 (OQ-67, answered).** Build the answer: the Contract always defines the
   billable party, with as many Contracts as AA needs, and there is no per-Booking override. In this
   phase that means the holder **is** the billable party (a doc comment on `ContractHolder`), and the
   patient-direct holder kind reads "Payer named on the Booking" (the domain model's "the payer named
   on the Booking"). Keep every seeded counterparty as it is: Phase 21 captures the payer's name and
   email when a default or patient-direct Contract is picked and removes the guardian override. No
   provisional note. Whether a Contract belongs to the hospital or to the funding source is still not
   settled; nothing here reads it.
7. **OQ-48 (which date decides the price in force).** If it is still open, build the recommendation:
   the date of the procedure, which Greg leaned to on 2026-10-01 and which in the prototype is the
   **List date**, what Contracts are already tested against. Add it to the provisional notes (work
   item 13): "Provisional: the price in force is the one effective on the date of the procedure." If
   it is answered "procedure date", drop that note. If it is answered with a different date (Booking
   created, or invoice raised), thread that date through `pricingDateISO` in work item 4 instead, and
   update the tests.
8. **OQ-78 (default Contracts, or the hospital holding every Contract).** If it is still open, build
   its recommendation, the catalogue's model: six categories, the protected RVG Default Hospital per
   hospital, the insurer default and one RVG Default Post-paid. Provisional note: "Provisional: the
   Contract categories and the default Contracts follow the current model, which AA is reviewing." If
   it is answered with Greg's model (no default Contracts, the hospital holding every Contract), stop
   and re-plan the categories and defaults before building, and say so in PROGRESS.
9. **OQ-89 (fixed fee after the rewording).** If it is still open, build its recommendation for
   schedule lines: the matched line's fee is the whole price (US-05.2.5), lines keep their time bands
   (which pick the line), add-ons (which add their own line) and quantity rules. Provisional note:
   "Provisional: fee schedule lines keep time bands and add-ons, with the matched line's fee as the
   price." Its other two parts (whether the Contract defined rate is the agreed contract rate, and
   whether it prices the whole Procedure) are Phase 24's; leave the `rateTime` basis as the interim.
   If it is answered "bands and add-ons are dropped", build the line without them and drop the CES band
   and add-on rows from the seed.
10. **Read Phase 17's PROGRESS entry.** Note the surgeon-group entity it built (Phase 17's plan: type
    `SurgeonGroup`, master `masters.surgeonGroups`, seed id `SG-COS` "Canterbury Orthopaedic
    Surgeons", counter prefix `SGN`), whether it has any link to the `ORG.cos` organisation record,
    and confirm `ContractHolderOrganisation` / `masters.organisations` still exist (Phase 17 left them
    for this phase to decide). Work items 2 and 3 depend on this.
11. **Capture the parity baseline before any model change** (work item 1). This comes before any
    edit to `types.ts`.

## Reference

**Design (convention 17):**
- `docs/design/Design Language.dc.html` for tokens: status pills as tint and on-tint, mono
  tabular-nums for codes and money, 4pt spacing, radii, teal as the only action colour, and crimson
  for identity only.
- `docs/design/Admin Review.dc.html` for the admin table and detail-panel anatomy. Its CONTRACT
  field is the model for how a Contract is named on a Booking.
- `docs/design/Admin Day.dc.html` for admin chrome.

No mockup covers Master data. Extend the admin's own table, panel and pill patterns, and do not
invent a new visual language. Admin is a desktop layout, so use a wide side panel or overlay, not a
bottom sheet.

**Catalogue:** the six covered files above; `domain-model.md` §2 "Contract (recommended
structure)" (its `holder / billableParty` row), "Fee schedule line" and "Selection";
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md)
(the four pricing bases, Verify);
[US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md)
(a combination Contract sits under each parent procedure, so procedure scope is a list);
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md)
(the picker's filters and its AA-code and holder-code search, which wrap this phase's per-Contract
matcher);
[US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md)
(default RVG Contracts per procedure, built by Phase 19a);
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md)
(the fixed fee is the total price);
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md)
(the Contract defined rate, built by Phase 24);
[US-05.5.1](../../../../requirements-board/requirements/stories/US-05.5.1.md)
(ACC through the holder's Contract);
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md)
(the payer set through the Contract, built by Phase 21); OQ-18, OQ-48, OQ-55, OQ-66, OQ-67, OQ-78,
OQ-89; the evidence notes `requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` #10, #27, #29, #49
and #64, `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` #7, #8, #37 and #41, and
`requirements-board/requirements/notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md` #12, #19, #38, #54 and #64.

**Analysis:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Theme 3 ("Contract replaces the billing route"), the
  "Structural first" DM-07 bullet, and the EP-04 and EP-05 tables.
- [epics/EP-04.md](../epics/EP-04.md) and [epics/EP-05.md](../epics/EP-05.md).
- `gaps.json`: the entries for the covered IDs, DM-07, DM-09 and RV-20 (re-graded at `3d3a18c`).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-07, DM-09 and DM-46 (the
  rate x time basis becoming a Contract defined unit rate, Phase 24).
- [analysis/prototype-map-domain.md](../analysis/prototype-map-domain.md) §2 and §5.
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md).
- [analysis/prototype-map-admin.md](../analysis/prototype-map-admin.md).

**Code entry points** (names and lines as at `3d3a18c`, after Phases 14, 15 and 15a session 1;
15a session 2, 15b, 16 and 17 run first, so check the lines you find):
- `aa-prototype/src/domain/types.ts`: `ContractHolderType`, `ContractScope`, `ContractType2Detail`,
  `Contract`, `ContractPrice` (about lines 180 to 258), `Procedure.accRelated` (about line 486),
  `CounterpartyRef`.
- `aa-prototype/src/domain/billing/contracts.ts`: `isEffectiveOn`, `selectContract`,
  `matchContractPrice`.
- `aa-prototype/src/domain/billing/fee.ts`: `FeeContext`, `feeFor`, the Type 1/2/3 branches.
- `aa-prototype/src/domain/billing/invoiceBuild.ts`: `defaultContractFor` (about line 86),
  `resolveContractForProcedure`, `counterpartyForProcedure`, `buildInvoicesForBooking`,
  `HOLDER_LABEL` (about line 72, and the "protected default Type 1" message at about line 103),
  `GST_RATE`.
- `aa-prototype/src/domain/billing/validateBookingForBilling.ts`: `feeContextFor`,
  `BookingBillingContext.contractPrices` (about line 62), `INDIVIDUAL_ARRANGEMENT_MESSAGE` (about
  line 39), the rate x time gate (about line 228).
- `aa-prototype/src/domain/billing/fixtures.ts`: `mkContract`, `mkProcedure`.
- `aa-prototype/src/domain/seed/contracts.ts`: `CONTRACT`, `CONTRACTS`, `CONTRACT_PRICES`, and the
  `defaultType1` helper.
- `aa-prototype/src/domain/seed/index.ts`: `masters.contracts` / `contractPrices` (about lines 97
  and 438), the counters, and the scenario markers `cosAccContractBooking` and `accRelatedBooking`
  (about lines 616 to 655, with "Type 3" and "Type 2" in their labels and details).
- `aa-prototype/src/domain/seed/bookings.ts`: the seeded `governingContractId`s, `accRelated`
  flags and `accRelatedBookingId` (about lines 451 to 472 and 1248).
- `aa-prototype/src/domain/seed/history.ts`: `accRelated` on seeded history rows.
- `aa-prototype/src/domain/seed/billing.ts`: its fee context.
- `aa-prototype/src/store/contractActions.ts`: `createContract` (allocates the `CTN` id, about line
  58), `editContract`, `deleteContract`, `addContractPrice`, `editContractPrice`,
  `isProtectedDefault`.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital` and `setInsurerDirectClaims` mint
  the protected default.
- `aa-prototype/src/store/mutate.ts`: the id specs `contract: { prefix: 'CTN', pad: 3 }` (about line
  72; the system id stays, `aaCode` is separate) and `contractPrice: { prefix: 'CPN', pad: 3 }` (the
  allocation counter kind; it is not in the seed).
- `aa-prototype/src/store/selectors.ts`: `contractPrices` in the billing context at about line 845;
  `accRelated` on `AccpayInvoiceRow` (about line 600) and its selector (about line 633);
  `counterpartyName` (about line 818, the `organisation` case).
- `aa-prototype/src/store/index.ts`: the contract action exports.
- `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx` (about line 82): calls
  `editContract(..., { effectiveToISO: undefined })` to restore a dated-out Contract; it must keep
  working.
- `aa-prototype/src/shared/audit/auditNarrative.ts`: narrates `CounterpartyRef`, `ContractScope` and
  `ContractType2Detail` values (about lines 148 to 163).
- Tests that build Contracts or read the old fields: `domain/billing/{contracts,fee,invoiceBuild,
  validateBookingForBilling,prePaymentInvoice}.test.ts`, `domain/seed/seed.test.ts`,
  `store/{billingRun,billingRetry,mastersActions,btmCapture,intake,prepayment,bookingActions}.test.ts`
  (`billingRetry.test.ts` dates out and restores the COS ACC Contract through `editContract`),
  `shared/demoTriggers/demoTriggers.test.ts`, `apps/admin/reviewFlags.test.ts`; the marker readers
  `store/{payablesActions,seedBilling}.test.ts`. There is no `contractActions.test.ts` yet; create it (new) for
  work item 7.
- `aa-prototype/src/store/billingLineActions.ts`: the rate x time gate.
- `aa-prototype/src/store/lifecycle.ts`: `editProcedure` and `ProcedurePatch`.
- `aa-prototype/src/store/appStore.ts`: `PERSIST_VERSION`.
- `aa-prototype/src/shared/capture/feeContext.ts` (about line 53),
  `shared/capture/AddBillingLineSheet.tsx` (the ACC pre-op flat-fee copy at about line 107, kept),
  `shared/booking/BookingDetailBody.tsx` (its fee context at about line 182),
  `shared/booking/OfficeBillingSetup.tsx`, `shared/flows/EditBillingSetupSheet.tsx` (the
  governing-contract select), `shared/audit/fieldLabels.ts`.
- `aa-prototype/src/apps/admin/screens/MasterData.tsx` (`ContractsView`, about line 198: today
  columns Name, Type, Holder, Scope, From, To, no id column and no search) and
  `apps/admin/flows/ContractEditSheet.tsx` (`PriceRows`, about line 217, hook
  `contract-price-rows`). `MasterData.tsx` also says "default Type 1" in the Hospitals and Insurers
  headers and the add-hospital result (about lines 287, 323 and 377).
- ACC markers: `apps/admin/reviewFlags.ts` (flag c, about line 82) and its test;
  `apps/mobile/screens/BalancesScreen.tsx` (the ACC chip in `AgeChip`, about lines 102 and 140);
  `apps/web/screens/AccountsScreen.tsx` (the ACC column); `store/bookingActions.ts` (`accRelated` on
  a new Procedure).
- `apps/demo/DemoControlPanel.tsx` (about line 340, "Health NZ agreed rate") and `apps/demo/DemoData.tsx`:
  scenario text that names Contracts.
- `shared/demoTriggers/registry.ts`: Phase 14's "Trigger billing failure" (about line 198), which
  dates out the COS ACC Contract.
- `visual/admin-phase07.spec.ts`: asserts "default Type 1" copy (about lines 93 and 107).

## Work items

Model, seed and pricing come first and are re-greened before any UI.

1. **Parity baseline first** (`domain/billing/feeParity.test.ts`, new). Write it **before**
   any model change, run it green, and keep its output.
   - For every seeded procedure, it records `feeFor(...).total`, `lines` (basis and amount) and
     `billableUnits`, using the same context the app builds (the List date and the stored
     governing contract).
   - For every seeded Booking, it records the `buildInvoicesForBooking` draft totals per
     counterparty (kind and id), so a holder remapping that changes who is billed fails parity.
   - It records amounts, units, bases and counterparties, not line descriptions. The fixed line's
     description changes on purpose in work item 4 ("Contract price" becomes the holder code and
     description); an existing test that asserts the old words is a copy update, not a parity
     change.
   - Keep the results in a checked-in JSON fixture (`domain/billing/__parity__/phase-18-baseline.json`,
     written with `toMatchFileSnapshot`).
   - After the reshape, the same test must match the fixture exactly. Add explicit assertions for
     the pinned demo figures: the design-day fees under SXAP at $26.50, the S3 Holt and fee figures
     as they stand when this phase starts, the $23 vs $28.50 fallback test, the bariatric $2,800 and
     second-procedure $950, and the Aria 3.0 h x $480 = $1,440 line.
   - After the reshape, only the test's context-building code changes; the fixture never does.
     Never run it with `-u`. A fixture change is a parity failure to explain, not to accept.
   - This is how "S3, S4 and S5 figures identical" is proven, not eyeballed.
2. **Types: the four-part Contract** (`domain/types.ts`). Replace `ContractHolderType`,
   `ContractScope`, `ContractType2Detail` and the `type` / `permitsIndividualArrangement` /
   `type2Detail` fields.
   - **Categories are data** (US-04.1.1 is Verify; OQ-78 is open). One exported table,
     `CONTRACT_CATEGORIES` in `domain/billing/contractCategories.ts` (new), holds each category's
     `id`, `label`, allowed holder kind, AA code prefix and `mintedOnly` flag (only the minting paths
     create it):

     | id | label | holder kind | prefix | mintedOnly |
     |---|---|---|---|---|
     | `rvgDefaultPostPaid` | RVG Default Post-paid | payer named on the Booking | `RDP` | no |
     | `rvgDefaultHospital` | RVG Default Hospital | hospital | `RDH` | yes |
     | `hospital` | Hospital | hospital | `HOS` | no |
     | `surgeonSolo` | Surgeon Solo | surgeon | `SSO` | no |
     | `surgeonGroup` | Surgeon Group | surgeon group | `SGR` | no |
     | `insurance` | Insurance | insurer | `INS` | no |

     `ContractCategory` is the id union derived from the table. There is no Pre-paid category and
     ACC is not a category (US-04.1.1). Nothing outside the table, its helpers (work item 3) and the
     two minting paths (`createHospital`, `setInsurerDirectClaims`) branches on a category id, so a
     changed category set after Greg's review is a table edit plus a seed change.
   - `ContractHolder`, a discriminated union. A doc comment says the holder **is the billable party
     the Contract defines** (D17, OQ-67): there is no separate billable-party field and no per-Booking
     override in the model (the existing guardian override stays until Phase 21 removes it):
     - `{ kind: 'hospital'; hospitalId }`
     - `{ kind: 'surgeon'; surgeonId }`
     - `{ kind: 'surgeonGroup'; surgeonGroupId }` (Phase 17's group id)
     - `{ kind: 'insurer'; insurerId }`
     - `{ kind: 'bookingBillableParty' }`: the payer named on the Booking, for patient-direct and
       default Contracts. It has no fixed id (US-04.2.1; fixes "holder is a fixed party id"). Its
       label is "Payer named on the Booking"; Phase 21 captures the payer's name and email when such
       a Contract is picked. Keep the kind name: Phases 20 and 21 read it.
   - `FundingSource` = `'private' | 'SXAP' | 'HNZ' | 'ACC'` (domain-model.md). It is a
     **Contract-only** type: the funding source describes the Contract and is never looked up from
     the Patient or the Booking (OQ-55, D2). No Booking, Procedure or Patient field uses it.
   - `ContractScope` = `{ procedureTypeIds, hospitalIds, surgeonIds, insurerIds, rvgCodes,
     fundingSources, anaesthetistIds }`, all arrays. An empty array means no narrowing on that
     dimension, and empty `anaesthetistIds` means organisational (US-04.2.1 AC).
     - `procedureTypeIds` holds the master-list procedures the Contract is set against (US-04.2.1;
       a combination Contract will list each parent procedure, US-04.2.11). Type it as `string[]`
       here; Phase 19 adds the `ProcedureType` master, retypes it and adds its editor chips, and
       Phase 19a fills it for every Contract (from its schedule lines' RVG mapping) so Phase 20's
       procedure filter returns real Contracts. Every seeded Contract has it empty in this phase.
     - `insurerIds` and `fundingSources` are **descriptive data**: a doc comment says no selection,
       picker or billing code reads them, because no Booking or Patient holds an insurer or funding
       source (D2, OQ-55). One exported constant,
       `SCOPE_NARROWING_DIMENSIONS`, lists the dimensions that may narrow a choice (procedures,
       hospitals, surgeons, RVG codes, anaesthetists) so Phase 20 reads one list. Surgeon narrowing
       is "possibly the surgeon, not settled" (US-04.2.1, US-04.3.2); Phase 20 decides and drops
       `surgeons` from the constant if it does not narrow by surgeon.
     - RVG groups arrive with Phase 19's group master.
   - `ContractRateStep` = `{ effectiveFromISO, rate: { basis: 'agreedUnitRate'; unitRate } | {
     basis: 'percentDiscount'; percent } }`.
   - `PricingBasis`:
     - `{ kind: 'rvgUnitsAnaesthetistRate' }`
     - `{ kind: 'rvgUnitsContractRate'; rates: ContractRateStep[] }`
     - `{ kind: 'fixedSchedule' }`
     - `{ kind: 'rateTime' }`: a labelled interim. The catalogue's fourth basis is now a Contract
       defined unit rate (US-04.2.2, US-05.2.6, DM-46); Phase 24 builds it, prices whole Procedures
       through one rate function and retires the hourly line. Here it only carries today's hourly
       rate x time gate, so the Aria $1,440 holds.

     This is the DM-07 mapping: Type 1, Type 2, Type 3 and `permitsIndividualArrangement`.
   - `Contract` = `{ id, aaCode, name, category, holder, scope, pricingBasis, isDefault,
     effectiveFromISO, effectiveToISO?, reviewDateISO?, retiredAtISO? }`.
     - `aaCode` is AA's own short structured code (US-04.1.4, D16): set once at creation, never
       edited, never reused, distinct from the system `id` (`CT-...` / `CTN-nnn`) and from any holder
       code.
     - `isDefault` stays the protected-default marker. It covers the RVG Default Hospital per
       hospital, the insurer default for a direct-billing insurer, and the one RVG Default
       Post-paid (the catalogue's model, OQ-78's recommendation). Phase 19a adds the default RVG
       Contracts per procedure (US-04.4.2) and decides their category and protection then; do not
       model them here.
   - `FeeScheduleLine` replaces `ContractPrice` (DM-09, US-04.2.4):
     - `{ id, contractId, holderCode, description, mappedRvgCodes: string[], timeBand?: {
       fromMinutes, toMinutes? }, isAddOn, quantityRule?: { unitLabel }, procedureOrdinal?, prices:
       FeeSchedulePrice[] }`;
     - `FeeSchedulePrice` = `{ effectiveFromISO, priceExGst, priceIncGst }`.
     - `holderCode` and `description` are the holder's own reference (SXAP AP codes, CES HNZ codes,
       ACC OPT codes); they are searchable (work item 3) and never replace `aaCode`.
     - `timeBand`, `isAddOn` and `quantityRule` stay on the line (OQ-89's recommendation,
       provisional): a band picks the line, an add-on adds its own line, and the matched line's fee
       is the whole price.
     - `procedureOrdinal` is a labelled interim that keeps the bariatric second-procedure row. It
       moves to the Contract's multi-procedure rule in Phase 23.
     - The `surgeonId` match key is dropped, because surgeon narrowing is Contract scope now. No
       seeded row used it.
   - `Procedure` (now on the Booking side) gains `feeSchedule?: { lineId?: string; quantity?:
     number; addOns?: { lineId: string; quantity: number }[] }`. This is the "Procedure records
     feeScheduleLineId" of DM-09 and the OQ-18 answer: with it, the Procedure and its Contract carry
     both the RVG code and the holder code. `lineId` absent means the line is found through its RVG
     mapping.
   - Remove `Procedure.accRelated` (RV-20). RV-20's verification narrowed the conflict to the review
     flag and called the chip and column harmless "unless a later phase drops `accRelated`". This
     phase drops it: its only readers are that flag, chip and column, and ACC is now the Contract's
     funding source, so the chip and column go with the field.
   - **Surgeon groups:** point `surgeonGroupId` at the entity Phase 17 built (`SG-COS` for COS). If
     Phase 17 left COS only as a `ContractHolderOrganisation`, use that record as the group here. Do
     **not** rename `CounterpartyKind` in this phase, because it ripples into Xero contacts,
     invoices and history.
   - **Surgeon group to counterparty.** Today COS is billed as `{ kind: 'organisation', id: ORG.cos }`
     (seed `history.ts` `ORG_COS`, Xero contact number = that id, name from `masters.organisations`).
     To keep that exactly, `SurgeonGroup` gains an optional `billingOrganisationId` (seed `SG-COS`
     = `ORG.cos`), and the surgeon-group holder bills that organisation. A group without one is a
     billing exception with a plain message, never a guessed id. `masters.organisations` stays as the
     counterparty and Xero-contact record behind a group; it is no longer offered as a Contract
     holder. The Admin Organisations view stays, relabelled only if its copy calls it a Contract
     holder. Record the choice in PROGRESS.
3. **Pure Contract helpers** (`domain/billing/contracts.ts`, with Vitest tests in `contracts.test.ts`):
   - `holderKindFor(category)` and `categoryInfo(category)` read `CONTRACT_CATEGORIES` (work item
     2): hospital for `rvgDefaultHospital` and `hospital`, surgeon for `surgeonSolo`, surgeon group
     for `surgeonGroup`, insurer for `insurance`, and the payer named on the Booking for
     `rvgDefaultPostPaid`. Test that every category has exactly one holder kind and a unique prefix.

     Labelled reading for `rvgDefaultHospital`: its holder is the hospital, which keeps every seeded
     hospital-route invoice on the same counterparty. OQ-67 is answered (the Contract defines the
     billable party), and the domain model now says a default Contract asks for the payer's name and
     email, while default RVG pricing invoiced to a hospital is a Contract with that hospital as
     billable party. How the hospital default sits with that, and with the per-procedure default RVG
     Contracts, is unsettled (US-04.4.2's note, OQ-78). Phase 21 owns who it bills; do not change it
     here.
   - `nextAaCode(category, existingCodes)`: the **only** place an AA code is made (D16, OQ-66). It
     returns `<prefix>-<nnnn>`, the next free number for that prefix, the prefix read from the
     category's row in `CONTRACT_CATEGORIES` (`RDP`, `RDH`, `HOS`, `SSO`, `SGR`, `INS`). AA accepted
     a short structured code but has not designed the format, so this is ours; a different format is
     a change to this one function and the pinned seed table. The code is stamped at creation and
     does not follow a later re-categorise: it identifies, it does not describe. Tests: deterministic, unique across prefixes, never reuses a retired or deleted
     Contract's code (the generator takes every code ever issued, which the store keeps), and the
     seeded codes are pinned.
   - `contractSearch(query, { contracts, feeScheduleLines, holderNameOf })` returns the matching
     Contract ids, each with the fields it matched on and any matched lines. It matches, case- and
     space-insensitively, the AA code, the name, the holder's name, and each line's holder code and
     description (US-04.2.4: typing a holder code finds its Contract; US-04.1.4: admins search by
     AA code). An empty query returns
     everything. It is built on an exported per-Contract matcher, `contractMatchesQuery(contract,
     lines, holderName, query)`, which returns the matched fields and lines or undefined. The Admin
     catalogue uses `contractSearch` here. Phase 20's picker (US-04.3.2: AA-code and holder-code
     search inside the procedure and hospital filter) runs its own `matchesContractQuery` inside the
     in-scope set only; it should wrap `contractMatchesQuery`, not re-implement the matching. Both live in `src/domain/billing` and import nothing from the apps.
     Tests: an AA code, a partial holder code ("HNZVIT" finds the CES schedule with four matched
     lines), a holder name, and no match.
   - `holderCounterparty(holder, surgeonGroups)` returns today's `CounterpartyRef`: a surgeon group
     maps to `{ kind: 'organisation', id: group.billingOrganisationId }` (work item 2), and it
     returns `undefined` for `bookingBillableParty` or a group with no billing organisation. Test
     that the COS holder yields exactly `{ kind: 'organisation', id: ORG.cos }`.
   - `holderMatches(contract, holder)` replaces the holderType/holderId comparisons.
   - `isEffectiveOn`: unchanged.
   - `isRetired(contract)` and `isReviewDue(contract, todayISO)`.
   - `rateInForce(contract, dateISO)`: the latest step with `effectiveFromISO <= date`, else the
     earliest step, defensively. Test the 1 April / 1 July pair from US-04.2.10's first AC.
   - `priceInForce(line, dateISO)`: undefined when no price is in force yet.
   - `priceTimeline(steps, todayISO)` gives `{ current?, upcoming[], superseded[] }` and drives
     "Upcoming from <date>" (US-04.2.10 AC 2).
   - `addOnLinesInForce(lines, contractId, dateISO)`: the Contract's add-on lines with a price in
     force on the date, in line order. Office billing setup lists add-ons through it here, and Phase
     39b offers the same lines as Contract add-on billing lines, so there is one definition of "an
     add-on this Contract offers".
   - `permitsRateTime(contract)` = `pricingBasis.kind === 'rateTime'`. It is the single source of
     the Method 3 gate that `validateBookingForBilling`, `billingLineActions` and
     `AddBillingLineSheet` now read, and `INDIVIDUAL_ARRANGEMENT_MESSAGE` stays single-sourced. It is
     interim: Phase 24 replaces the basis with the Contract defined unit rate, and Phase 39b's
     UNIT x RATE line reads Phase 24's rate function.
   - `selectContract` keeps today's precedence. Individual scope becomes `scope.anaesthetistIds`
     non-empty: rank 2 when it contains the anaesthetist, skipped when it does not. The holder
     test uses `holderMatches`. It reads no other scope dimension, and never the insurer or funding
     source. **Today's resolver is otherwise unchanged.**
   - `matchFeeScheduleLine(lines, { contractId, rvgBaseCode, procedureOrdinal, isAdditional,
     capturedMinutes, pricingDateISO, explicitLineId? })` replaces `matchContractPrice`:
     - an explicit `lineId` wins if it is on the Contract, is not an add-on, and has a price in
       force;
     - otherwise the candidates are non-add-on lines that have a price in force, whose
       `mappedRvgCodes` include the code, whose ordinal (if set) matches, and whose time band (if
       set) contains the captured minutes. Band lines never match when times are not captured;
     - the most specific wins (ordinal and band each count once), and ties go to input order;
     - the split-billing rule stays: an additional procedure takes a line only if the line sets an
       ordinal;
     - no match returns undefined, and the Decisions log 2026-07-22 BTM fallback still applies
       (Phase 21 replaces it with the not-on-schedule flag).
   - Tests: time-band selection (59, 60, 61 and 120 minutes), a band line with no captured times,
     an ordinal row, explicit line beats auto-match, an add-on never auto-matches, a future-dated
     price not yet in force, and a line added mid-year that is absent before its first date.
4. **`fee.ts` reprices from the new shape.** Keep `FeeResult`'s shape and `feeFor`'s signature
   apart from the context.
   - `FeeContext` gains a required `pricingDateISO` (the date of the procedure, which is the List
     date; OQ-48's recommendation) and `feeScheduleLines` in place of `contractPrices`.
   - Export the captured-minutes helper for band matching.
   - `rvgUnitsAnaesthetistRate`, or no contract: units x `anaesthetist.unitValue`.
   - `rvgUnitsContractRate`: units x `rateInForce(...)`. An agreed rate is used as is; a percent
     discount is rounded to cents here, exactly as today.
   - `fixedSchedule` (US-05.2.5: the fixed fee is the total price for the procedure, not the BTM
     units; bands and add-ons as OQ-89's recommendation):
     - the matched line's price in force, ex GST, x quantity, is the procedure's fee. The quantity is
       `procedure.feeSchedule.quantity` when the line has a quantity rule, else 1;
     - the fee line reads `"<holderCode> · <description>"`, plus `" × n <unitLabel>"` when the
       quantity is not 1;
     - each office-attached add-on with a price in force adds its own fixed line at price x
       quantity;
     - B/T/M are still computed and returned (US-05.2.5);
     - no main-line match falls to the BTM path as today;
     - `FeeLine` gains an optional `feeScheduleLineId` (Phase 25 locks it).
   - `rateTime` (interim until Phase 24's Contract defined unit rate):
     - the fee is the captured rate x time lines plus any fixed ancillary lines;
     - B/T/M are recorded but not charged;
     - labelled reading: the catalogue says a Contract sets exactly one basis. Seeded Aria
       procedures carry no RVG code, so parity holds.
   - Every existing `fee.test.ts` case is re-expressed against the new shape with **the same
     expected numbers**, including the paper spot-check of $720 and the Type 3 fallback cases.
     Add tests for band pricing, add-ons, quantity, a rate step changing across two List dates,
     and a fixed-schedule line changing price across two List dates (US-04.2.10 AC 1).
5. **Every other pure consumer** follows. Test the ripple in the existing suites:
   - `invoiceBuild.ts`:
     - `defaultContractFor` and `resolveContractForProcedure` use `holderMatches` and holder kinds.
       The fallback is still scoped to hospital and insurer holders; surgeon, surgeon-group and
       Booking-billable-party holders dated out are still exceptions (Phase 08 decision 1,
       unchanged);
     - `counterpartyForProcedure` uses `holderCounterparty`. A `bookingBillableParty` holder on
       the contract-holder route bills the Booking's billable party, or else the patient. This
       replaces the "unreachable" throw for that case, with a test;
     - pass `pricingDateISO` = List date;
     - copy that says "protected default Type 1" becomes "default Contract".
   - `validateBookingForBilling.ts`:
     - `BookingBillingContext.contractPrices` becomes `feeScheduleLines` (plus `surgeonGroups` for
       `holderCounterparty`), and `feeContextFor` passes the date and the lines;
     - the rate x time gate reads `permitsRateTime`;
     - new rule: a `rateTime` Contract needs at least one rate x time line to complete, so that a
       rate x time Procedure can never price $0 silently;
     - new rule: `feeSchedule` references must be lines on the governing Contract (single-sourced
       message).
   - `shared/capture/feeContext.ts`, `domain/seed/billing.ts`, the billing context built in
     `store/selectors.ts` (about line 845) and the Booking detail body's fee context all pass
     `pricingDateISO` from the List and pass `feeScheduleLines`.
   - `fixtures.ts`: `mkContract` defaults to `{ aaCode: 'HOS-9999', category: 'hospital', holder:
     hospital, scope: all empty, pricingBasis: rvgUnitsAnaesthetistRate }`.
6. **Seed** (`domain/seed/contracts.ts`, `seed/index.ts`, `seed/bookings.ts`, `seed/history.ts`).
   Keep every existing Contract id.
   - **AA codes:** every seeded Contract gets its `aaCode` from `nextAaCode`, applied in `CONTRACTS`
     order, so the seed is deterministic. Insert `CT-RVG-POSTPAID` straight after the nib default
     (with the other protected defaults) and `CT-CES-HNZ` at the end. `seed.test.ts` pins the id to
     code table and asserts every code is unique. The expected table:
     - `CT-STG-D1`, `CT-SX-D1`, `CT-FORTE-D1`, `CT-CES-D1`, `CT-CPH-D1`: `RDH-0001` to `RDH-0005`;
     - `CT-NIB-D1`: `INS-0001`; `CT-RVG-POSTPAID`: `RDP-0001`;
     - `CT-SXAP`: `HOS-0001`; `CT-HNZ`: `HOS-0002`; `CT-STG-ACC`: `HOS-0003`;
     - `CT-DOYLE-BAR`: `SSO-0001`; `CT-COS-ACC`: `SGR-0001`; `CT-ARIA-HOURLY`: `RDP-0002`;
     - `CT-CES-HNZ`: `HOS-0004`.

     The insert changes no selection: `selectContract` filters by holder first, and the Booking's
     billable party never matches a hospital or insurer query.
   - Every seeded Contract has `scope.procedureTypeIds` empty (Phase 19a fills it, once Phase 19 has
     added the procedure list).
   - Every hospital-held Contract lists its holder in `scope.hospitalIds` (the five defaults, SXAP,
     Health NZ, St George's ACC and the CES HNZ schedule), so the catalogue's Scope column reads
     the hospital and Phase 20's seed assertion already holds. It narrows nothing here.
   - The five hospital defaults become `rvgDefaultHospital`, holder the hospital,
     `scope.hospitalIds = [that hospital]`, `isDefault`, and are named "<Hospital> RVG Default
     Hospital" (for example "St George's RVG Default Hospital", replacing "St George's standard units
     (default Type 1)").
   - nib: `insurance`, `isDefault`, `insurerIds [nib]`, named "nib insurer default".
   - SXAP: `hospital`, Southern Cross, `fundingSources ['SXAP']`, and one rate step of $26.50 from
     2024-07-01. The Decisions log 2026-07-23 figure is kept.
   - Health NZ: `hospital`, Christchurch Public, `['HNZ']`, $23 from 2023-07-01, review date
     2026-07-01, so "Review due" shows on day one.
   - St George's ACC: `hospital`, `['ACC']`, $25.
   - COS ACC: `surgeonGroup` (COS), `['ACC']`, $24.
   - Doyle bariatric: `surgeonSolo`, Mr Doyle, `fixedSchedule`, renamed "Bariatric fee schedule, Mr
     P. Doyle" (today "Bariatric fixed prices, Mr P. Doyle (Type 3)"). The demo trigger, the manual
     tests and the re-pointed recipes use this name.
   - Aria: `rvgDefaultPostPaid`, holder `bookingBillableParty` (the payer named on the Booking, today
     the Aria clinic billable party), `rateTime`, and `anaesthetistIds [Souter, Fitzgerald]`. That set
     covers the two seeded Aria Bookings and shows the "set of anaesthetists" scope. This is a
     labelled reading: there is no individually-arranged category, and patient-direct is the only
     category family whose holder is the payer named on the Booking. Put it on the owner's review
     list; Phase 24 re-bases it onto the Contract defined unit rate.
     - Today Aria is `type: 2` with an agreed $26.50 per unit beside `permitsIndividualArrangement`.
       Under `rateTime` that unit rate goes and B/T/M are not charged (work item 4). Neither seeded
       Aria procedure has an RVG code or captured times, so parity holds; but a presenter who
       captures times on the Mon 27 Aria Booking no longer sees time units x $26.50 beside the hourly
       line. Log this in the phase entry; no demo script beat depends on it.
   - Funding sources and insurers above are descriptive only (work item 2); no selection reads them.
   - Drop "(Type n)" and "(default Type 1)" from every name.
   - New: `CT-RVG-POSTPAID` "RVG Default Post-paid", `rvgDefaultPostPaid`, `bookingBillableParty`,
     `rvgUnitsAnaesthetistRate`, `isDefault`. It governs no seeded procedure; Phase 20 makes it
     selectable as the patient-direct default.
   - New: `CT-CES-HNZ` "Christchurch Eye Surgery HNZ schedule", `hospital`, CES, `['HNZ']`,
     `fixedSchedule`, from 2026-07-01. Its lines use labelled demo prices (ex GST, all from
     2026-07-01):
     - `HNZCATall` "Cataract, all" (42702): $640;
     - `HNZVIT60` "Vitrectomy up to 60 min" (42725, 0 to 60): $780;
     - `HNZVIT90` "Vitrectomy 61 to 90 min" (42725, 61 to 90): $960;
     - `HNZVIT120` "Vitrectomy 91 to 120 min" (42725, 91 to 120): $1,140;
     - `HNZVITX15` "Vitrectomy, each extra 15 min" (42725), an add-on with quantity rule "15 min
       block", $100;
     - `HNZGA` "GA add-on", add-on, $370.

     The codes, bands, the $100 block and the $370 GA add-on match the catalogue's real examples;
     the band prices are demo values. It governs no seeded procedure, so parity holds.
     Its two add-on lines are the seeded examples Phase 39b offers as Contract add-on billing lines.
   - Fee schedule lines replace `CONTRACT_PRICES`. Keep the three existing row ids (`CP-BAR-1`,
     `CP-BAR-2`, `CP-BAR-3`) as the Doyle line ids, because `store/billingRun.test.ts` names
     `CP-BAR-1`; give the CES lines `CP-CES-1` to `CP-CES-6`. Doyle:
     - `BAR-BYP` "Laparoscopic gastric bypass" (20880): $2,800 ex GST from 2025-01-01 **and
       $2,950 from 2026-07-28**. This is the demo's "Upcoming" line: one "+7 days" press, or the
       "Procedure day · 28 Jul" shortcut, flips it. No seeded Doyle-schedule procedure sits on or
       after 28 Jul, and the parity test proves it;
     - `BAR-SLV` "Sleeve gastrectomy" (20882): $2,400;
     - `BAR-HER2` "Concurrent umbilical hernia repair, second procedure" (49120, ordinal 2): $950.

     `priceIncGst` = ex x 1.15, rounded to cents, using the shared `GST_RATE`.
   - Review dates: 2027-04-01 on the other negotiated Contracts (the 1 April fee cycle), 2026-07-01
     on Health NZ as above, and none on the defaults.
   - `masters.contractPrices` becomes `masters.feeScheduleLines` (the `SeedData` type in
     `seed/index.ts` too), and the id spec `contractPrice` in `store/mutate.ts` becomes
     `feeScheduleLine` (keep prefix `CPN`, so allocated ids do not collide with seeded ones).
   - The store keeps every AA code ever issued (`masters.issuedAaCodes`, seeded with the seed's
     codes), so a deleted Contract's code is never handed out again.
   - Phase 17's `SG-COS` gains `billingOrganisationId: ORG.cos` (work item 2).
   - Remove `accRelated` from `seed/bookings.ts` specs (and `accRelatedBookingId`) and from
     `seed/history.ts` rows.
   - Rename the scenario marker `accRelatedBooking` to `accContractBooking` ("ACC procedure under St
     George's ACC Contract"). Update `store/prepayment.test.ts` and `store/billingRun.test.ts`, and
     reword the `cosAccContractBooking` detail, dropping "Type 2", and the bariatric marker's
     "Type 3 fixed price booking" label ("Fee schedule booking (bariatric)").
   - **Bump `PERSIST_VERSION` by one** from the value you find, with a comment line in the history
     block.
7. **Store** (`store/contractActions.ts`, `store/mastersActions.ts`). Every action is office-only
   and goes through `mutate()`; refusals are data.
   - `createContract`:
     - the input carries category, holder, scope, pricing basis, dates and review date, and **no**
       AA code: the store stamps `aaCode` from `nextAaCode` over `issuedAaCodes` and appends it there;
     - the store refuses a holder kind that does not fit the category (`holderKindFor`);
     - it refuses a `mintedOnly` category (`rvgDefaultHospital`, read from `CONTRACT_CATEGORIES`) and
       any `isDefault`, because only `createHospital` and `setInsurerDirectClaims` mint defaults;
     - it refuses a contract-rate basis with no step, or whose first step starts after the
       Contract's `effectiveFromISO`.
   - `editContract`:
     - it patches the new fields. `aaCode` is not in the patch type, and a raw patch carrying it is
       refused (`aaCodeImmutable`). `isProtectedDefault(c)` = `c.isDefault`, which drops the `type
       === 1` test;
     - for the protected default it refuses: end-dating, forward-dating, re-holding,
       re-categorising, re-basing away from `rvgUnitsAnaesthetistRate`, and retiring. It allows
       renaming, the review date and scope edits;
     - for any Contract, the patched record must still pass `holderKindFor`, and re-categorising
       into a `mintedOnly` category or setting `isDefault` is refused (only the minting paths make
       defaults);
     - a basis change drops stale rates.
   - `retireContract(api, actor, id, { effectiveToISO? })` is new:
     - it stamps `retiredAtISO` = demo-clock today and sets `effectiveToISO` (default today; not
       before `effectiveFromISO`). The existing effective-dating then handles billing unchanged;
     - it refuses the protected default;
     - its Outcome reports how many unbilled procedures still reference the Contract, so the UI can
       warn;
     - it is audited as `contract.retire`. The retired Contract keeps its AA code.
   - `deleteContract` stays for a never-used Contract (existing guards) and deletes its lines. Its
     AA code stays in `issuedAaCodes`.
   - Rates: `addContractRate` and `removeUpcomingContractRate`. Steps are keyed by
     `effectiveFromISO`, unique per Contract; only a step not yet in force on demo-clock today can
     be removed. Past and current steps are never edited in place, so older prices stay (US-04.2.10).
   - Lines: `addFeeScheduleLine`, `editFeeScheduleLine` (non-price fields only), and
     `deleteFeeScheduleLine` (refused while any procedure's `feeSchedule` names it). A holder code
     must be non-empty and unique within its Contract.
   - Line prices: `addFeeSchedulePrice` and `removeUpcomingFeeSchedulePrice`, with the same rule.
     Both prices must be above zero and agree with ex x 1.15 to the cent; the editor derives one
     from the other.
   - `mastersActions.ts`: `createHospital` mints a protected `rvgDefaultHospital`, and
     `setInsurerDirectClaims` mints a protected `insurance` default, each with an AA code from the
     same generator. Rename `defaultType1` and update the copy.
   - `editProcedure` accepts `feeSchedule`, with the same edit matrix as `governingContractId`
     today.
   - Export every new action from `store/index.ts` and drop the `ContractPrice` ones.
   - Tests: re-express `mastersActions.test.ts` and the contract store tests, and add tests for
     retire, the rate and line price rules, category-holder refusal, the protected-default
     refusals, AA code stamping on every create path, immutability, and no reuse after delete.
8. **Re-green session 1.** Run `npx vitest run` with the parity fixture matching unchanged,
   `npm run build` and `npm run build:pwa`. Stop here if this is the end of session 1, and leave the
   PROGRESS status as IN PROGRESS with what remains.
9. **Admin Contract catalogue rebuilt** (`apps/admin/screens/MasterData.tsx` `ContractsView`,
   covering US-04.1.1, US-04.1.2, US-04.1.4, US-04.2.1, US-04.2.4 and US-04.2.10).
   - **Search** above the table: one field, "Search by AA code, name, holder or holder code",
     driven by `contractSearch`, with a result count. A row found through a holder code shows the
     matched line under its name ("Line HNZVIT60 · Vitrectomy up to 60 min", and "+3 more" when
     several match). `data-shot="contract-search"`.
   - Table columns: AA code (mono), Name, Category, Holder, Pricing, Scope, From, To, Review,
     Status.
     - The Holder column is who the Contract invoices (D17); "Payer named on the Booking" for the
       patient-direct holder.
     - Category labels come from `CONTRACT_CATEGORIES`.
     - The protected lock icon stays on defaults.
     - Pricing reads "Anaesthetist rate", "$26.50 per unit", "10% discount", "Fee schedule · 3
       lines" or "Rate x time".
     - Scope is a short summary of the narrowing dimensions, for example "Christchurch Public" or
       "2 anaesthetists", or "Organisation". Funding source shows as a small neutral tag
       ("SXAP", "HNZ", "ACC") beside the summary, because it describes the Contract.
     - Status pills are "Retired" (neutral), "Review due" (the `semantic.warning` tint), and
       "Upcoming price" (neutral) when any rate or line has an upcoming step. `src/theme` has no
       info colour, so do not invent one.
   - Category filter chips above the table (one per `CONTRACT_CATEGORIES` row), and a "Show retired" toggle that is off by default.
     Search, chips and the toggle combine.
   - The header copy loses "default Type 1": the protected defaults are "the RVG Default Hospital,
     insurer default and RVG Default Post-paid Contracts". The Hospitals and Insurers headers and
     the add-hospital result say "default Contract" in place of "default Type 1".
   - The provisional notes (work item 13) show once, collapsed, under the header.
   - `data-shot="contract-catalogue"`.
10. **Contract detail** (`apps/admin/flows/ContractEditSheet.tsx`, rebuilt as a wide desktop panel
    with sections; covers US-04.1.1, 04.1.2, 04.1.4, 04.2.1, 04.2.4 and 04.2.10):
    - **Header:** the AA code in mono beside the name, read-only, with "Assigned on save" on a new
      Contract.
    - **Definition:** name, then category (segmented or select, its options from
      `CONTRACT_CATEGORIES` less the `mintedOnly` ones on a new Contract), then a holder picker
      labelled "Holder (invoiced)", filtered to the category's holder kind (hospitals,
      `masters.surgeons`, `masters.surgeonGroups`, insurers; organisations are no longer offered).
      "Payer named on the Booking" shows as fixed text. The OQ-78 provisional note sits beside this
      section.
    - **Scope:** multi-select chips for hospitals, surgeons, RVG codes and anaesthetists. An empty
      field reads "Any". Empty anaesthetists reads "Whole organisation". A separate **Describes**
      group below holds insurers and funding sources, with a plain helper line (not a provisional
      note; D2 is answered): "Describes the Contract. Does not change which Contracts are offered."
      Procedures from the master list arrive with Phase 19, which adds the master, and Phase 19a
      fills them; no placeholder field here.
    - **Pricing:**
      - basis selector;
      - for contract rate: a rate table (effective from, $ per unit or %, and a Current / Upcoming
        from <date> / Superseded pill from `priceTimeline` against `useToday()`), with "Add rate
        from date";
      - for a fee schedule: the line table (holder code, description, RVG mapping, time band,
        add-on, quantity rule, ex GST, inc GST, Current price, and "Upcoming from <date> · $x"), a
        per-line price history with "Add price from date", and add, edit and delete line. Entering
        ex or inc derives the other. Holder code and description are labelled "Holder's code" and
        "Holder's description" so it is clear they are references beside the AA code. On a new
        fee-schedule Contract the panel stays open after the first save, with the line table ready,
        so lines never need a close and reopen (today rows can only be added to an existing Type 3);
      - the OQ-48 provisional note beside the pricing section, and the OQ-89 note beside the line
        table;
      - the basis selector's fourth option reads "Rate x time" (`PRICING_BASIS_LABEL`) until Phase
        24 replaces it with the Contract defined rate.
    - **Dates:** effective from, effective to and review date.
    - **Actions:** Save (teal primary); "Retire contract", which confirms with the unbilled-reference
      count; "Delete", only for never-used Contracts. Protected defaults show the lock notice and
      disable what the store refuses.
    - Hooks: `data-shot="contract-detail"` and `data-shot="fee-schedule-lines"`, replacing
      `contract-price-rows`.
11. **Office billing setup** (`shared/flows/EditBillingSetupSheet.tsx`, `shared/booking/OfficeBillingSetup.tsx`;
    keeps US-05.2.5, which now Matches, working on the reshaped lines):
    - The governing-contract select labels each option "<AA code> · <name> · <category>", no
      longer "(Type n)". It excludes retired Contracts unless one is already selected, in which case
      it shows "(retired)". It still lists every Contract otherwise, because scope narrowing and
      search in the picker are Phase 20.
    - When the chosen Contract is a fee schedule, show:
      - a "Schedule line" select: "Match by RVG code" (the default) or a specific line, labelled
        "<holderCode> · <description>";
      - a quantity stepper when the line has a quantity rule;
      - an add-on list with quantities, from `addOnLinesInForce` on the List date;
      - writes go to `feeSchedule` through `editProcedure`.
    - The read view shows the RVG code and the matched line "<holderCode> · <description>" side by
      side (the OQ-18 pair), and any add-ons.
    - Mobile and web need no new control. The fee breakdown already renders the fixed line's new
      description, and the rate x time option reads `permitsRateTime`.
12. **ACC as an ordinary holder** (RV-20):
    - delete review flag (c) "ACC should not bill the patient directly" and its test case;
    - delete the ACC chip on mobile Balances (`AgeChip`'s `accRelated` prop);
    - delete the ACC column on web Accounts;
    - delete `accRelated` from `AccpayInvoiceRow` and its selector, and from `fieldLabels`,
      `seed/audit.ts`, `store/bookingActions.ts`, `fixtures.ts`, `store/bookingActions.test.ts`
      and `store/btmCapture.test.ts`.

    ACC work is now visible only as the holder's ACC Contract (funding source ACC) on the Booking.
    Keep the ACC pre-op flat-fee codes copy in `AddBillingLineSheet` unchanged: Phase 39b turns the
    ACC pre-op assessment into a fixed-fee pre-op event (US-05.5.2).
13. **Copy, labels, provisional notes and tests sweep.**
    - **Provisional notes in one place:** `src/shared/contracts/provisionalNotes.ts` (new; the
      `src/shared/contracts/` folder is new too) exports the
      still-open readings this phase builds, each with its OQ id: OQ-48 (price on the date of the
      procedure), OQ-78 (the categories and default Contracts follow the current model, which AA is
      reviewing) and OQ-89 (fee schedule lines keep time bands and add-ons, with the matched line's
      fee as the price). The catalogue and the detail panel render them from there, and nowhere else
      spells them out. An answered OQ is one deleted entry. No note for OQ-18, OQ-55, OQ-66 or OQ-67:
      they are answered (the AA code format goes on the owner's review list instead).
    - `shared/audit/fieldLabels.ts`: labels for AA code, category, holder, scope (including
      procedures), pricing basis, rates, review date, retired, holder code, time band, add-on,
      quantity rule, prices and fee schedule. Remove the Type fields.
    - `shared/audit/auditNarrative.ts`: replace the `ContractScope` (`organisation` /
      `individualAnaesthetist`) and `ContractType2Detail` branches with narration for the new
      holder ("Held by Southern Cross", "Held by the payer named on the Booking"), scope ("Whole
      organisation", "2 anaesthetists", filters), pricing basis, rate steps and price steps, so a
      History entry for a Contract edit never shows raw JSON. A Contract's history entries name it
      by AA code and name. Keep the `CounterpartyRef` branch.
    - `src/shared/contracts/labels.ts` (new), one home for the three apps: `PRICING_BASIS_LABEL`,
      `HOLDER_KIND_LABEL`, and a `contractCategoryLabel` that reads `CONTRACT_CATEGORIES` (no second
      category list).
    - Grep `aa-prototype/src` for "Type 1", "Type 2", "Type 3", "default Type 1" and
      "permitsIndividualArrangement" in rendered strings, and fix them. Comments that describe
      history may stay.
    - Update `DemoControlPanel.tsx` and `DemoData.tsx` scenario text that names "Health NZ agreed
      rate (Type 2)", "COS ACC Type 2" or "bariatric Type 3".
    - Update the Phase 14 registry label or text for "Trigger billing failure" if it names the
      Contract.
    - Update the `visual/admin-phase07.spec.ts` assertions and screenshot. Add Playwright shots for
      the catalogue, a catalogue search for "HNZVIT", the detail panel with the Doyle line showing
      "Upcoming from 28 Jul 2026", and the CES schedule.
    - No en or em dashes in any new copy.

## Demo triggers

This phase adds **no new button**. The US-04.2.10 beat uses the existing demo clock, which is in the
harness bar and also the PWA's More-tab clock. The AA code and holder-code search are shown through
normal use.

| Trigger | Screen | Effect |
|---|---|---|
| Existing clock "+7 days" or "Procedure day · 28 Jul" | Admin, Master data, Contracts, "Bariatric fee schedule, Mr P. Doyle" | `BAR-BYP` flips from "$2,800.00 current · Upcoming from 28 Jul 2026 · $2,950.00" to "$2,950.00 current" with $2,800 superseded. The Tue 14 Jul bariatric Booking still prices $2,800, because the price follows the date of the procedure |

- **Check the existing trigger still works:** Phase 14's "Trigger billing failure" (dates out the
  COS ACC Contract) edits the reshaped record. Confirm it still fails the COS Booking and invoices
  its sibling, and that the Billing monitor's restore (`BillingMonitorScreen.tsx`,
  `editContract(..., { effectiveToISO: undefined })`) still clears it and the retry bills COS as
  the same organisation counterparty as before.
- **PWA equivalent:** none needed. The effect is on the Admin Contract catalogue, and the PWA has
  no Admin. The mobile fee breakdown is unchanged in value.
- **Phase 15a's shared "Raise sample warnings":** no change. This phase registers no warning rule,
  so it adds no sample.

## Out of scope

These Contract fields and behaviours belong to later phases. Do not add fields for them here
(convention 15):

- The procedure master, its scope chips in the editor, RVG groups in scope: 19.
- The default RVG Contracts per procedure holding base units (US-04.4.2), the Contract base-unit
  override, every Contract's procedure scope filled from its lines' RVG mapping, and RVG time tiers
  as data: 19a.
- The scope-filtered picker (by procedure, then hospital, with the default RVG Contract always
  offered) and its AA-code and holder-code search wrapping `contractMatchesQuery`, default hospital
  Contract selection, removing route, payment category and `Procedure.insurerId`: 20. Insurer and
  funding source never go on the Booking or the Patient (D2).
- Required booking inputs, the payer's name and email captured for a default or patient-direct
  Contract, the guardian override removed (D17), the not-on-schedule flag replacing the BTM
  fallback: 21.
- The payment setting (FULL or SPLIT with typed $ or % shares set on the Booking, D18), invoice
  layout, delivery method, GST treatment: 22.
- Multi-procedure rule, including moving `procedureOrdinal` out of the line, and combination
  Contracts set against each parent procedure (US-04.2.11): 23.
- `allowsAnaesthetistAdjustment`, and the Contract defined unit rate replacing the `rateTime` basis
  and the hourly line (US-05.2.6, DM-46): 24.
- Contract version history and the AUTHORISED lock: 25. US-04.1.2's "version" wording is met there;
  here, rate and price steps keep old prices and the audit trail keeps old values.
- Contract add-on fees as billing lines on pre-op and post-op events: 39b (it reads
  `addOnLinesInForce`).
- The CES "tier" (commitment vs panel price columns): in DM-09, but in no covered story's text.
- Any change to the resolver's precedence, and any selection that reads insurer or funding-source
  scope.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin, Master data, Contracts: every seeded Contract shows a short AA code, a category, holder,
      pricing and scope, and none shows "Type n". The AA codes are unique and match the seed test.
      Every seeded invoice's counterparty is unchanged (the parity fixture), and the Aria row's
      holder reads "Payer named on the Booking".
      The five hospital defaults, nib and RVG Default Post-paid carry the lock. Health NZ shows
      "Review due". "Show retired" is off and the category chips filter.
- [ ] Search: "HNZVIT" finds only the CES HNZ schedule and shows "Line HNZVIT60 · Vitrectomy up to
      60 min" with "+3 more"; "BAR-BYP" finds the Doyle Contract; typing a seeded AA code finds that
      Contract; a holder name ("Southern Cross") finds its Contracts; search combines with the
      category chips.
- [ ] New contract: the header reads "Assigned on save", and after save it shows the next AA code
      for its category. Choosing "Surgeon Group" limits the holder list to surgeon groups; "RVG
      Default Post-paid" shows "Payer named on the Booking"; RVG Default Hospital is not offered. Scope
      chips save; an empty anaesthetists field reads "Whole organisation"; insurers and funding
      sources sit under "Describes" with its plain helper line (no provisional note). The AA code
      cannot be edited.
- [ ] Delete a never-used new Contract, create another: it gets a new AA code, not the deleted one.
- [ ] A protected default refuses end-dating, re-basing, re-holding and retiring, with the store's
      message; renaming it and setting a review date both work.
- [ ] Health NZ: add a rate of $24.00 from 1 Oct 2026. It shows "Upcoming from 1 Oct 2026" and the
      $23 step stays Current. Remove the upcoming step. A current step cannot be removed or edited.
- [ ] Doyle bariatric: `BAR-BYP` shows $2,800.00 ex / $3,220.00 inc and "Upcoming from 28 Jul 2026
      · $2,950.00". Press harness clock "+7 days" and it flips to Current $2,950.00. The Tue 14 Jul
      bariatric Booking still shows $2,800.00 for that line and $950.00 for the hernia second
      procedure.
- [ ] CES HNZ schedule: take a vitrectomy (42725) Booking on Dr Souter's seeded Wed 22 Jul CES
      List, capture start and handover 75 minutes apart, and in office billing setup set its
      Contract to "Christchurch Eye Surgery HNZ schedule". It prices `HNZVIT90` at $960.00 as the
      procedure's whole fee (no units x rate line), the read view shows 42725 beside "HNZVIT90 ·
      Vitrectomy 61 to 90 min", and B/T/M are still shown. Add "GA add-on"
      and "each extra 15 min" x 2 and the total adds $370 + $200. Pick `HNZCATall` explicitly and it
      prices that line instead.
- [ ] Retire a negotiated Contract with no unbilled references. It leaves the catalogue unless
      "Show retired" is on (still with its AA code), and it drops out of the office
      governing-contract select. The audit shows `contract.retire`.
- [ ] The provisional notes (price date, categories and default Contracts, fee schedule lines)
      appear once in the catalogue and beside their sections in the detail panel, and nowhere else.
      No note mentions the AA code format, the billable party or insurer and funding source.
- [ ] Every seeded fee is unchanged: the S3 figures, the S4 Beat 3 billing failure (Phase 14's
      trigger on the COS ACC Contract still fails that Booking and invoices its sibling), and the
      S5 Beat 4 end-date on "Health NZ agreed rate" leaves the Hemi Walker invoice unchanged.
- [ ] The Aria rate x time line still adds on Souter's Mon 27 Booking under the Aria Contract, and
      a Contract that is not rate x time still refuses it with the single-sourced message.
- [ ] No "ACC" chip on mobile Balances, no ACC column on web Accounts, no ACC review flag in
      Admin Review. The ACC pre-op flat-fee help text is still in the add-billing-line sheet.
- [ ] Mobile (framed and PWA) and web Booking detail: fees unchanged. The bariatric fixed line
      reads "BAR-BYP · Laparoscopic gastric bypass".
- [ ] `npm run shots` green, with the Phase 07 spec updated and the new shots captured.
- [ ] Catalogue screenshots: the recipes for US-04.1.1, US-04.1.2, US-04.1.4, US-04.2.1, US-04.2.4
      and US-04.2.10 are created or updated, any recipe this phase broke is re-pointed (US-05.2.5
      among them), a full `npm run capture` ends with no failed recipe and no story without a
      recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run verify:board` green, with the parity fixture
      matched.

## Demo guide updates

Mirror each change in the same section of `docs/demo-guide/master-demo-guide.html`.

- **`04-presenter-cheat-sheet.md`:**
  - rewrite "Contracts": categories, holder (the Contract always says who is invoiced), scope, the
    pricing bases (say the fourth is being reworked into a Contract defined rate, without naming a
    phase), AA's own short code on every Contract, fee schedule lines with the holder's codes kept
    for reference and searchable, a fixed fee as the procedure's whole price, and effective-dated
    prices with "Upcoming";
  - fix the "ACC route" row in "Terms not to use": use instead "the holder's ACC Contract", because
    ACC is not a route or a category;
  - in "Contracts", add "AA code: AA's own short code on every Contract, searchable; holder codes
    are references beside it";
  - keep "Statements to avoid: ACC has its own billing route" and RFP ambiguities §12 (ACC pre-op
    flat-fee codes); add "Statements to avoid: the patient's insurer picks the Contract" (D2);
  - add two one-line tips: "show an upcoming price": open the Doyle Contract, then press "+7 days";
    "find a Contract by holder code": type "HNZVIT" in the Contract search.
- **`03-demo-script.md`:**
  - S5 Beat 4: the Contract is now "Health NZ agreed rate". The optional aside is the Health NZ
    "Review due" pill, the Doyle "Upcoming" price and a holder-code search;
  - S4 Beat 3: "group-held" becomes "held by a surgeon group", with the COS Contract's new name;
  - S3 is unchanged in figures. Check its wording for "Type".
- **`01-personas-and-responsibilities.md`:** drop "ACC route warnings" from the office's review
  flags.
- **`02-workflows-and-handoffs.md`:** drop "ACC advisory flags". "Selects the governing Contract and
  rating method" becomes "and its pricing basis".
- **Control Panel scenario text** (`DemoControlPanel.tsx`) and the seed scenario-marker details:
  new Contract names, no "Type n".
- This is not a milestone phase, but re-read `master-demo-guide.html` §S4 and §S5 after patching.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 18` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built. All are Admin shots (Master data, Contracts); the mobile and web apps get no
new screen from this phase:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md) Contract categories | partial · admin-contract-types | `captured` (Verify does not hold the shot back). Re-shoot `admin-contract-types`: the catalogue with the Category column and category chips, and a `new-contract` state with the category control (no Pre-paid, and no RVG Default Hospital on a new Contract) and the holder list filtered to the category. Highlight the category control. Drop the partial reason. Caption "New contract, choosing the category and holder". The catalogue's Category column and chips show all six; the new-contract control offers five, because RVG Default Hospital is minted only with a new hospital (US-04.4.1), which the `admin-add-hospital` shot of US-04.4.1 shows |
| [US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) Create, edit, retire Contracts | partial · admin-contracts, admin-edit-contract | `partial`. Re-shoot both: the catalogue with From, To, Review and Status ("Review due" on Health NZ), and the detail panel dates. Add a `retire` state (Retire contract confirm). Rewrite the reason to the one gap left: "Editing still changes a Contract in place; versioning is built in Phase 25." |
| [US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) AA identifier for every Contract | absent · placeholder, no shots | Add the shots, `captured`. Shots: `aa-code` (catalogue with the mono short AA code column, highlight the column), a `search` state typing a seeded AA code (`SSO-0001` finds the Doyle Contract) and one typing "HNZVIT" with the matched line "Line HNZVIT60 · Vitrectomy up to 60 min", and the detail header showing "Assigned on save" on a new Contract. Caption "Every Contract has AA's own short code, searchable; holder codes are references beside it" |
| [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) Holder, scope and organisational reach | partial · admin-contract-holder (plus the organisational and individual scope shots the catalogue now lists first) | `partial`. Re-shoot: the detail panel Definition and Scope sections (the "Holder (invoiced)" picker filtered to the category, "Payer named on the Booking" for RVG Default Post-paid, chips for hospitals, surgeons, RVG codes and anaesthetists, "Whole organisation" when empty, and the "Describes" group). Caption "The holder is who the Contract invoices; scope says where it applies". Rewrite the reason: "The procedures filter is filled by Phase 19a and narrows the picker in Phase 20." Phases 19a and 20 move it on. Its `images` still list two hand-added `assets/US-04.2.9/admin-contract-scope-*.png` shots from the retired US-04.2.9 (the old Organisational or Individual sheet); the capture keeps hand-added images, so add `scope-organisational` (catalogue Scope column reading "Organisation" and "2 anaesthetists") and `scope-individual` (a new Contract narrowed to one anaesthetist) states to this recipe, and delete those two stale entries from US-04.2.1's frontmatter, then `npm run check` |
| [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) Fixed fee schedule lines | partial · admin-price-rows | `captured` (OQ-89 is built as its recommendation, so it does not hold the shot back). Re-shoot as `admin-price-rows` (keep the name) on `[data-shot=fee-schedule-lines]` for the CES HNZ schedule: holder code, description, RVG mapping, time band, add-on, quantity rule, ex GST and inc GST. Drop the partial reason. Caption "Each line keeps the holder's own code and description" |
| [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) Pricing effective from a date | absent · placeholder, no shots | Add the shots, `captured`. Shot `upcoming-price`: the Doyle Contract (`BAR-BYP`) line showing "$2,800.00 current" and "Upcoming from 28 Jul 2026 · $2,950.00", highlight that price cell. A second state after the existing clock "+7 days" press (or "Procedure day · 28 Jul") if the recipe can press it, showing $2,950.00 current. Caption "Current and upcoming prices are both visible" |

**Recipes this phase breaks.**
- `US-04.2.2` (pricing basis, covered by Phase 24), `US-04.2.4`, `US-04.2.5` (Phase 23): they select
  `[data-shot=contract-price-rows]`, which work item 10 replaces with `fee-schedule-lines`, and click
  rows by name (`tr:has-text("Bariatric fixed prices")`, `"St George's standard units"`,
  `"Southern Cross Affiliated Provider"`, `"Aria Skin and Laser Clinic"`). The seed renames the
  Contracts and drops "(Type n)" and "(default Type 1)" from every name, and the new Doyle name is
  "Bariatric fee schedule, Mr P. Doyle". Re-point each name and the hook, and keep the shot names.
  `US-04.2.2` also clicks `label:has-text("Agreed unit rate")`: check the basis labels in the rebuilt
  panel (`PRICING_BASIS_LABEL`) and keep its `type-1`, `type-2`, `type-3` and `rate-time` state names.
- `US-04.1.2` and `US-04.2.1` click `tr:has-text("Health NZ agreed rate")` and
  `tr:has-text("ACC orthopaedic services")` with `role=button[name="Edit"]`: keep an Edit button on
  each catalogue row or point them at the row click. Check the second name against the new seed.
- `US-04.3.2` (governing contract picker): the option labels become "<AA code> · <name> · <category>"
  and the `[role=dialog] label:has-text("Governing contract")` highlight must still match.
- `US-05.5.1` (ACC contract, hook `office-billing-setup-1`) and `US-05.5.2`: ACC loses its flag, chip
  and column (work item 12) and the Contract names change. Re-check the captions. The ACC pre-op
  help text is kept.
- The Admin Master data recipes that open the Contracts tab (`FT-04.1`, `US-04.1.3`, `US-04.4.1`,
  `US-13.4.1` and similar; `US-04.2.9` is Retired and its recipe is not captured): the wide detail
  panel replaces the old sheet, so re-point any `[role=dialog]` selector the `--dry` run fails on.
- `US-05.2.5` (fixed fee pricing, `admin-fixed-price` on `/admin/day/2026-07-14/bookings/BK0028`,
  highlight `[data-testid=booking-calculation]`): it left this phase's covers because it now
  Matches, but the reshape changes its shot. Re-shoot it so the calculation shows the fixed line
  "BAR-BYP · Laparoscopic gastric bypass" as the procedure's whole fee with B/T/M still recorded, set
  it `captured`, and drop its stale partial reason (it still names "Type 3" and "no time band or
  add-on"). Check the Booking id with `--dry`.
- The Phase 07 Playwright spec (`visual/admin-phase07.spec.ts`) is separate from the capture
  recipes, and work item 13 already updates it.

**ATLAS.md.** Personas and IDs (Contract names, AA codes, the new `CT-RVG-POSTPAID` and
`CT-CES-HNZ`), Seed data (the Doyle Upcoming price, the Health NZ review date), Overlays (the wide
Contract detail panel instead of the sheet) and Existing hooks (`contract-catalogue`,
`contract-search`, `contract-detail`, `fee-schedule-lines`; `contract-price-rows` is gone). Routes
are unchanged.

## Adversarial review (after build)

After the manual test checklist and the build and tests are green, and before writing the PROGRESS
entry, run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**:

- Fan out independent Opus reviewers. Scale this money-model phase to four lenses: quality,
  fee-maths and parity, store and lifecycle, and plan and catalogue adherence.
- Verify every finding against the catalogue files and the code, fix the confirmed ones, and
  re-green.
- Record the pass. Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**
- **Parity is real:** the baseline fixture was captured before the reshape and matches unchanged.
  Recompute a sample of seeded fees by hand: SXAP $26.50, Health NZ $23, St George's ACC $25, COS
  $24, the bariatric rows and Aria $1,440. No test's expected number was edited to pass.
- **Today's resolver is untouched in behaviour:**
  - the stored governing Contract is used while it is effective on the List date;
  - the fallback goes only to that hospital's or insurer's protected default, never to another
    negotiated Contract;
  - surgeon, surgeon-group and Booking-billable-party holders dated out are exceptions;
  - scope filters change no selection outcome yet, except the anaesthetist rank;
  - every seeded invoice goes to the same counterparty kind and id as before (COS stays
    `{ kind: 'organisation', id: ORG.cos }`; Aria stays the Aria clinic billable party).
- **Insurer and funding source (D2, OQ-55):** no selection, picker, validator or billing path reads
  `scope.insurerIds` or `scope.fundingSources`; no Booking, Procedure or Patient field holds a
  funding source; `SCOPE_NARROWING_DIMENSIONS` excludes both.
- **AA code (US-04.1.4, D16):** a short structured code made only by `nextAaCode`, its prefix from
  `CONTRACT_CATEGORIES`; stamped on every create path (seed,
  `createContract`, `createHospital`, `setInsurerDirectClaims`); unique; immutable through the store
  even with a raw patch; never reused after delete; distinct from the system id and from holder
  codes; shown in mono in the catalogue, the detail and the office select.
- **Search:** `contractSearch` is pure, in `src/domain/billing`, matches AA code, name, holder name,
  holder code and line description, and is what the catalogue calls (no second filter in the
  component).
- **Dates:** the price in force uses the List date everywhere: capture display, validator, invoice
  build and the seed billing slice. No path reads the demo clock, the Booking-created date or
  `Date.now()`. "Current" and "Upcoming" in the UI use the demo clock's today. Rate and price
  steps already in force cannot be edited or removed.
- **Fee schedule lines:**
  - ex GST drives pricing and inc GST agrees to the cent;
  - add-ons never auto-match, and `addOnLinesInForce` is the one add-on list;
  - band lines need captured times;
  - the additional-procedure ordinal rule survives;
  - B/T/M are still recorded under a fixed price;
  - a `rateTime` Contract cannot price $0 silently;
  - the Method 3 gate and `INDIVIDUAL_ARRANGEMENT_MESSAGE` are still single-sourced.
- **Store guards hold independently of the UI** (convention 6): category-holder fit, protected
  defaults (not end-dated, re-based, re-held or retired), only minted defaults are `isDefault`,
  retire and delete refusals, holder codes unique per Contract, and every write goes through
  `mutate()` with an audit entry.
- **Categories are data (US-04.1.1 Verify, OQ-78):** the six categories, their holder kinds,
  prefixes and the `mintedOnly` flag live only in `CONTRACT_CATEGORIES`; no component, store action
  or billing path branches on a category id outside its helpers and the two minting paths, and no
  second category list exists in the apps.
- **Billable party (D17):** the holder is documented as the billable party the Contract defines;
  no counterparty moved (the parity fixture), and the patient-direct holder reads "Payer named on
  the Booking" in every surface.
- **Fixed fee (US-05.2.5, OQ-89):** under a fee schedule the matched line's fee is the whole price,
  with no units x rate line beside it; bands pick the line and add-ons add their own lines.
- **Provisional notes:** the three open readings (OQ-48, OQ-78, OQ-89) live only in
  `provisionalNotes.ts`; there is no note for OQ-18, OQ-55, OQ-66 or OQ-67.
- **ACC:** no ACC special case is left anywhere (flag, chip, column, `accRelated`, or copy
  implying an ACC route). The ACC pre-op flat-fee codes survive.
- **Copy and design:**
  - no "Type 1/2/3" in rendered copy;
  - no en or em dashes;
  - teal is the only action colour, and Retire and Delete use the error treatment, not crimson;
  - pills use tint and on-tint tokens;
  - codes and money are mono tabular-nums;
  - the admin panel is a desktop layout;
  - no build-phase references in app copy ("from Phase 20" and similar).
- **Persistence and the PWA:** `PERSIST_VERSION` is bumped, and a stale persisted state reseeds
  cleanly. The PWA purity test holds, because any new shared label or notes module imports nothing
  admin-only.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the provisional readings built for open questions (OQ-48 price date, OQ-78 the
  categories and default Contracts, OQ-89 bands and add-ons on fixed fee lines), the AA code format
  we chose for D16 (`<category prefix>-<nnnn>`, until Greg designs the Contract), the Aria category
  reading (and its dropped $26.50 unit rate), RVG Default Hospital made only with a new hospital
  (not offered on New contract), the RVG Default Hospital holder reading handed to Phase 21, anything logged rather than
  fixed, and the screens worth a look (Admin, Master data, Contracts: the catalogue, a search for
  "HNZVIT", the Doyle detail with its Upcoming price; office billing setup on the bariatric Booking),
  each with its route and persona.
- **Catalogue screenshots result:** the recipes filled in (US-04.1.4, US-04.2.10) and changed (the
  other four covered items, plus the broken ones such as US-04.2.2, US-04.2.5 and US-05.2.5), the
  `requirements-board/capture/REPORT.md` counts (captured, partial, absent, failed) before and after,
  and the partial reasons handed on: US-04.1.2 to Phase 25 (versioning) and US-04.2.1 to Phases 19a
  and 20 (procedures filter, picker narrowing).
- **Status row:** add Phase 18 (Contract model) as DONE with the date, or IN PROGRESS after session 1
  with what remains.
- **Phase entry** in the template:
  - the drift-check result against `3d3a18c` (items; US-04.1.1, US-04.1.4 and US-04.2.1 status;
    OQ-18, OQ-55, OQ-66 and OQ-67 answered and how they were built; OQ-48, OQ-78 and OQ-89 status;
    US-05.2.5 now Matches and out of this phase's covers);
  - what Phase 17's surgeon-group entity was, and how COS maps to it;
  - the AA code format and the seeded id to code table;
  - the `CONTRACT_CATEGORIES` table as built;
  - the parity fixture path and its result;
  - the `PERSIST_VERSION` bump;
  - the review pass;
  - the handoffs to 19 (the procedure master retypes `scope.procedureTypeIds` and adds its editor
    chips; RVG groups in scope), 19a (fills every Contract's `scope.procedureTypeIds` from its lines'
    RVG mapping; the per-procedure default RVG Contracts take a row in `CONTRACT_CATEGORIES` or an
    existing one; the base-unit override), 20 (scope narrows the picker by procedure then hospital,
    reading `SCOPE_NARROWING_DIMENSIONS`; its in-scope AA-code and holder-code search wraps
    `contractMatchesQuery`; RVG Default Post-paid becomes selectable), 21 (the payer named on the
    Booking is captured for `bookingBillableParty`; who the RVG Default Hospital bills; the guardian
    override; the BTM fallback is still in place), 22 (the payment setting), 23 (`procedureOrdinal`
    on the line; combination Contracts list each parent in `scope.procedureTypeIds`), 24 (the
    `rateTime` basis and `permitsRateTime` become the Contract defined unit rate), 25 (rate and price
    steps and `feeScheduleLineId` to lock), 39b (`addOnLinesInForce` and the CES add-on lines) and 42
    (the organisations master behind surgeon groups).
- **Decisions log:**
  - (a) **Supersedes the 6th review #3 and 7th review A5/B3 ACC advisory**: `accRelated` and the
    review flag, chip and column are removed (RV-20; US-05.5.1). ACC is the holder's Contract with
    funding source ACC.
  - (b) **Amends "Contract-holder placements (seed)" (2026-07-23):**
    - COS is a Surgeon Group holder;
    - Aria is `rvgDefaultPostPaid` with holder "Payer named on the Booking", pricing basis rate x
      time (interim), and a two-anaesthetist scope (the labelled category reading);
    - the ACC Contracts are ordinary Hospital and Surgeon Group Contracts with funding source ACC.
  - (c) **Protected default vocabulary:** "default Type 1" becomes "RVG Default Hospital or insurer
    default". The invariant is unchanged. RVG Default Post-paid is also protected.
  - (d) **Price in force = date of the procedure (the List date)**, for both rate steps and line
    prices (OQ-48 recommendation, Greg's lean; provisional while OQ-48 is open).
  - (e) **Rate x time basis is an interim** (US-05.2.6 now a Contract defined unit rate, DM-46): it
    charges no RVG units and needs a rate x time line to complete; Phase 24 replaces it.
  - (f) **Holder codes are references on the line (OQ-18 answered):** a Procedure and its Contract
    carry both the RVG code and the chosen line's holder code; the line is office-chosen or found
    through its RVG mapping; holder codes are searchable. Record that the 2026-07-22 Type 3 BTM
    fallback and the SXAP $26.50 ruling are **kept**.
  - (g) **Surgeon group bills through its organisation record** (interim): the Surgeon Group holder
    invoices `SurgeonGroup.billingOrganisationId`, so COS stays the `ORG.cos` counterparty and Xero
    contact. Organisations are no longer Contract holders but the master survives (Phase 42 gives it
    retire and reinstate as a surviving master); any `CounterpartyKind` change is out of scope.
  - (h) **AA code (US-04.1.4, D16 answered):** a short structured code, `<category prefix>-<nnnn>`,
    from one generator, stamped at creation, immutable and never reused; it identifies, it does not
    follow a re-categorise. The format is ours until Greg designs the Contract.
  - (i) **Insurer and funding-source scope are descriptive data** (D2, OQ-55 answered): stored and
    shown, read by no selection.
  - (j) **The holder is the billable party the Contract defines** (D17, OQ-67 answered): no
    separate billable-party field; no counterparty changes in this phase; Phase 21 builds the payer
    capture and removes the per-Booking override.
  - (k) **Categories are one data table** (US-04.1.1 Verify; OQ-78's recommendation, provisional):
    the catalogue's six categories and its default-Contract model, held in `CONTRACT_CATEGORIES` so
    Greg's review is a table edit.
  - (l) **A fixed fee is the whole price; lines keep bands and add-ons** (US-05.2.5; OQ-89's
    recommendation, provisional).
