# Phase 18 · Contract holders and dated Contracts

**Requirements covered** (status and grade at catalogue `60e2d1e`):
[FT-04.1](../../../../requirements-board/requirements/stories/FT-04.1.md) Contract catalogue (Confirmed; Partial: every holder and every dated Contract, create, edit, version and retire, filters by active or all and by holder; joins this phase on 2026-10-08; its lines arrive in Phase 19a),
[US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md) Third-party and first-party Contracts (Confirmed; **Contradicts**: Type 1/2/3 and a protected default Type 1 per hospital and insurer, where the catalogue has third-party Contracts, first-party Contracts and one No contract (RVG), with no formal categories),
[US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) Create, edit, retire Contracts (Confirmed; Partial: no review date, no new-version flow, no active or holder filters, no explicit retire; the office creates first-party Contracts too, anaesthetists never edit Contracts, OQ-91),
[US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) AA identifier for every Contract (Confirmed; Missing: a unique short AA code, and a composite search across AA code, holder codes and names),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) Contract holders (**new**, Verify; Partial: no holder record, no "holder is billed" setting, no required billable party, no first-party holder),
[US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) Contract holder, who is billed, and where it applies (Confirmed; **Contradicts**: who is billed follows the billing route, not the holder; this phase stores the holder, its "holder is billed" setting and its context, and Phases 20 and 21 make them decide the list and the invoice),
[US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) Contract prices effective from a date (Confirmed; **Contradicts**: Contracts are edited in place and an expired one falls back to a default Type 1, where the catalogue has dated versions linked to the one they replace);
[DM-48](../analysis/domain-model-delta.md#dm-48) (the contract holder becomes a master record),
[DM-07](../analysis/domain-model-delta.md#dm-07) (the Contract becomes a dated, versioned record with an AA code; Type 1/2/3 and scope go),
[DM-49](../analysis/domain-model-delta.md#dm-49) (one stored No contract (RVG) replaces the protected default Type 1s);
[RV-33](../analysis/reverse-check.md#rv-33-protected-default-type-1-contract-per-hospital-and-per-direct-billing-insurer-auto-created-and-used-as-a-fallback) (the protected default Type 1, auto-created and used as a fallback),
[RV-20](../analysis/reverse-check.md#rv-20-acc-review-flag-implies-an-acc-rule-the-engine-does-not-have) (the ACC review flag).

**Left this phase on 2026-10-08:**
[US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) (Contract lines) and
[DM-09](../analysis/domain-model-delta.md#dm-09) (the Contract line replacing `ContractPrice`) move to
Phase 19a, because a line is keyed by a procedure from Phase 19's list. With them go the fee
schedule line, its time band, add-on flag, quantity rule and RVG mapping (all dropped by the
catalogue), and OQ-89. The category table, the multi-dimension scope (procedures, hospitals,
surgeons, insurers, RVG codes, funding source, anaesthetists), the payment setting, the required
booking inputs (US-04.2.7, Retired) and the per-procedure default RVG Contracts (US-04.4.2, Retired)
are gone from the catalogue and from this plan.

**Carried across without regression** (they Match today only through the old model; parity tests
prove each): [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) (a fixed
rate prices the whole Procedure as BTM x the Contract's rate, today through Type 2's
`agreedUnitRate`), [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) (a
fixed price is the whole price, today through Type 3's price rows),
[FT-05.5](../../../../requirements-board/requirements/stories/FT-05.5.md) and
[US-05.5.1](../../../../requirements-board/requirements/stories/US-05.5.1.md) (ACC priced as an
ordinary holder's Contract). This phase keeps the Type 2 and Type 3 **terms** exactly where they
are (`type2Detail`, `permitsIndividualArrangement` and the `ContractPrice` rows) as labelled interim
terms; Phase 19a moves them onto Contract lines.

**Open question, built as its default** (ROADMAP D32; keep it in one place, log it for the owner):
[OQ-98](../../../../requirements-board/requirements/questions/OQ-98.md) (a holder's plain RVG
Contract: no lines, applies to every procedure at RVG pricing, offered when its holder fits the
Booking, as No contract (RVG) is offered by rule).
**Answered and built as answered:**
[OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md) (D45: the date of the
procedure decides the price; validity sits on the Contract version),
[OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) ("No contract (RVG)" is the
one default, offered first for every procedure, billing the payer on the Booking; no hospital,
insurer or procedure default Contracts),
[OQ-66](../../../../requirements-board/requirements/questions/OQ-66.md) (D16: a short structured AA
code per Contract, searchable; the format is not set, so it is ours, made in one function),
[OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) (D17, superseded 2026-10-08:
the Contract decides who is billed through its holder: the holder's billable party when the holder
pays AA, otherwise the payer on the Booking; this phase stores the holder's setting and billable
party, and Phase 21 makes them decide the invoice),
[OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md) (D42: the office creates and
maintains the anaesthetists' own first-party Contracts; anaesthetists never edit Contracts).

**Depends on:** Phase 17 (surgeons' rooms and surgeon groups, `SG-COS`, which the COS holder points
at). Phases 14, 15 and 15a session 1 are built; the plan runs 15a session 2, 15b, 16 and 17 before
this phase, so take the Booking names, the ACTIVE List state, the warning routine and the
`PERSIST_VERSION` you find.
**Estimated:** 2 sessions. Session 1: work items 1 to 7 (parity baseline, types, pure helpers, the
resolver and pricing on the new shape, seed, store, re-green). Session 2: work items 8 to 13 (the
Admin holder master, the Contract catalogue with search and filters, the Contract detail with
versions, office billing setup, the ACC review flag, copy and the demo guide), then shots, the review
pass, the catalogue screenshots and PROGRESS. If session 1 runs long, stop green after work item 5
(seed with the parity fixture matching) and start session 2 with work item 6; do not start UI work
before the store actions exist.

## Goal

The Contract stops being "Type 1/2/3 plus a holder type and id" and becomes the catalogue's model
(EP-04, FT-04.1, US-04.1.1): **contract holders**, each holding many **dated Contract versions**,
plus one stored **No contract (RVG)**.

- **A contract-holder master** (DM-48, US-04.1.5, [AR-29 · Contract holder fields](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-holder-fields),
  [AR-30 · Contract holder](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-holder)):
  a name, a party type (third party: an insurer, a hospital, a surgeon or a surgeon's rooms; first
  party: an anaesthetist's own price list), **"holder is billed"** (the draft's `bills_holder`) with a
  required link to the holder's billable-party record when it is true, and the anaesthetist for a
  first-party holder (a holder with an anaesthetist is always first party, and never billed). The
  office creates, edits and retires holders. Today's `holderType` / `holderId` pairs (including the
  `organisation` and `billableParty` holder types, which have no catalogue counterpart) fold into
  these holders; the COS surgeon group becomes a rooms holder pointing at Phase 17's `SG-COS`.
- **Contracts as dated versions** (DM-07, US-04.2.10, OQ-48 answered, D45,
  [AR-29 · Contract fields](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-fields),
  [AR-29 · Contract versions](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-versions),
  [AR-30 · Contract](../../../../requirements-board/requirements/artifacts/AR-30.md#contract),
  [AR-28 · Keeping prices up to date](../../../../requirements-board/requirements/artifacts/AR-28.md#keeping-prices-up-to-date)):
  a Contract points at its holder and has a valid-from date, an optional valid-to date, a review date
  and a link to the version it replaces. A price review is **New version**: the terms are copied and
  then changed, the old version ends the day before the new one starts, and versions never overlap.
  A version can be entered ahead and shows "Upcoming from <date>". The version in force on the date of
  the procedure (the List date) prices it, so old Bookings keep the old price. Terms of a version that
  has started are never edited in place.
- **A short AA code on every Contract** (US-04.1.4, OQ-66, D16), from one generator function, shared
  by every version of the Contract, shown in mono and searchable.
- **The Admin Contract catalogue** (FT-04.1, US-04.1.2): Contracts grouped under holder headings with
  No contract (RVG) first, a filter for active or all Contracts and a filter by holder, and **one
  composite search** across AA code, Contract name and holder name (Phase 19a adds the holder codes
  on lines to the same matcher). Create, edit, new version and retire are office-only (anaesthetists
  never create or edit Contracts, OQ-91, D42). Contracts will number in the thousands: search, never
  a flat list.
- **No categories** (US-04.1.1, [AR-28 · Contracts: third-party and the anaesthetist's own](../../../../requirements-board/requirements/artifacts/AR-28.md#contracts-two-kinds)):
  Type 1/2/3 go as the Contract's category. The pricing data they carry stays exactly where it is as
  **interim terms** (`interimTerms`, `type2Detail`, `permitsIndividualArrangement`, the `ContractPrice`
  rows) that Phase 19a moves onto Contract lines, so **no fee moves**: US-05.2.6's fixed rate, the
  bariatric fixed prices and the ACC Contracts priced as ordinary holders keep working, proven by a
  parity fixture over every seeded fee and invoice.
- **One stored No contract (RVG)** (DM-49, RV-33, OQ-78 answered,
  [AR-28 · No contract (RVG)](../../../../requirements-board/requirements/artifacts/AR-28.md#no-contract-rvg),
  [AR-29 · Integrity rules](../../../../requirements-board/requirements/artifacts/AR-29.md#integrity-rules)):
  no holder, no terms, never expires, found by its `isDefault` flag (exactly one), priced at BTM x the
  anaesthetist's own unit value. It replaces the protected default Type 1 per hospital and per
  direct-claims insurer. The per-holder invariants, the delete and end-date protection, the
  auto-create when a hospital is added or an insurer's direct-claims flag flips (US-11.4.1's wrong
  behaviour), and the default-Type-1 fallback in `invoiceBuild.ts` go; the fallback becomes No
  contract (RVG) at the same price and the same counterparty. Each seeded default Type 1 stood for a
  holder that pays AA, so it is re-expressed in place (same id) as **that holder's plain RVG
  Contract** (holder billed, no terms; OQ-98's default, D32), which Phase 20 offers for every
  procedure.
- **Who is billed does not change here.** The holder's "holder is billed" setting, its billable party
  and the context fields that will narrow the Contract list (the hospital, the surgeon or rooms, the
  first-party anaesthetist; US-04.2.1) are stored and shown, but the invoice still follows today's
  billing route until Phase 20 removes the route and Phase 21 bills the holder or the payer on the
  Booking. One interim function gives the route its counterparty from a holder, so every seeded
  invoice keeps its counterparty.
- **The ACC review flag goes** (RV-20). ACC stays an ordinary holder's Contract; the informational
  ACC chip and column stay.

**The pricing model lives in one place.** The draft technical design v4
([AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md)) and its ERD
([AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md)) are the reference shape for
contract holders and Contracts, but they are a **draft** that a v5 may change before or during the
build. Keep the holder, Contract and version types and every rule about them (integrity guards,
version chain, version in force, the No contract (RVG) lookup, AA codes, the search matcher, the
interim terms, the interim route counterparty) in **one place in `aa-prototype/src/domain/billing`**
(`contracts.ts`, plus the seed), behind types the UI reads, so a later design change stays a
contained edit. Where this plan adds a field the draft lacks (the holder's kind and context link,
needed for the catalogue's narrowing; the AA code, which the draft omits and US-04.1.4 still
requires), say so in a doc comment beside the draft's field names.

This is the largest master change in the plan. Behaviour changes to pricing and billing are for
Phases 19a to 25; this phase changes the shape and keeps the numbers.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `60e2d1e` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-04.1,US-04.1.1,US-04.1.2,US-04.1.4,US-04.1.5,US-04.2.1,US-04.2.10,US-04.2.14,US-04.3.2,US-04.3.3,US-05.2.5,US-05.2.6,US-05.4.3,US-05.5.1,US-11.2.2,US-11.4.1,OQ-48,OQ-66,OQ-67,OQ-78,OQ-91,OQ-98
   ```

   Read the hunks (if any) for the covered items, US-04.2.14 (the first-party Contract, Phase 19a),
   US-04.3.2 and US-04.3.3 (the picker and No contract (RVG) first, Phase 20), US-05.2.5, US-05.2.6,
   US-05.4.3 and US-05.5.1 (the terms this phase carries across), US-11.2.2 (the payer on the
   Booking, Phase 21), US-11.4.1 (the insurer master), the questions, and the "Contract holder",
   "Contract" and "No contract (RVG)" parts of `requirements-board/requirements/domain-model.md`.

   At plan time (2026-10-08, `3d3a18c..60e2d1e`) the changes that touch this phase were: the Contract
   and pricing model rewrite (change log `requirements-board/requirements/changes/2026-10-07-requirements-update.md`,
   sections 1 to 4, 9 and 10): US-04.1.1 rewritten to third-party and first-party Contracts with no
   categories and Confirmed; US-04.1.2 gained versions, first-party Contracts kept by the office and
   the active and holder filters; US-04.1.4 gained the composite search; US-04.1.5 is new (Verify);
   US-04.2.1 rewritten around the holder and who is billed, and Confirmed; US-04.2.10 rewritten to
   dated Contract versions and Confirmed; FT-04.1 rewritten; OQ-48, OQ-78 and OQ-91 answered; OQ-98
   new and open; FT-04.4, US-04.4.1 and US-04.4.2 Retired. The plan already reflects all of this;
   diff only for anything after `60e2d1e`.
   - If an item changed, re-read it and adjust the work items before building.
   - If an item is now Retired or Future, drop it from this phase and say so in PROGRESS.
   - A new item that touches the holder or Contract record goes into this phase only if it is
     shape-only. Lines are 19a's, the picker 20's, who is billed 21's, prices 24's.
2. **US-04.1.5 is Verify.** Build it as written (the draft's holder shape, AR-29 `contract-holder-fields`)
   and note the status in PROGRESS. No UI label for Verify.
3. **OQ-98 (D32, open).** If it is still open, build its default: a holder's plain RVG Contract has no
   lines (here: no terms, `interimTerms: 'rvg'`) and applies to every procedure at the anaesthetist's
   unit value. Phase 20 offers it when the holder fits the Booking. Provisional note (work item 13):
   "Provisional: a holder's plain RVG Contract has no lines and applies to every procedure at RVG
   pricing." If it is answered differently (a line per procedure or per group), the five hospital and
   nib plain RVG Contracts still exist here unchanged; hand the answer to 19a and 20 in PROGRESS and
   drop the note.
4. **OQ-78 (answered).** Confirm it still reads: No contract (RVG) is the one default, offered first
   for every procedure, billing the payer on the Booking; no hospital, insurer or procedure default
   Contracts. Greg said he would think about who the default bills; if the question has reopened, it
   changes nothing here (who is billed follows the route until 21), so note it for Phase 21.
5. **OQ-48 (answered, D45).** The date of the procedure decides the Contract version in force; in the
   prototype that is the **List date**, which every pricing path already passes. No provisional note.
6. **OQ-66 (answered, D16).** A short structured AA code; AA has not set the format, so ours is
   `<holder prefix>-<nnnn>` from one generator (work item 3). If the drift shows a format, implement it
   in the same function and update the pinned seed table. No provisional note; the format goes on the
   owner's review list.
7. **The draft design.** List the catalogue's artifacts (`requirements-board/requirements/artifacts/`):
   if a technical design newer than AR-29 v4 (a v5) has been added, read its holder, Contract and
   version sections and follow its shape inside the same one module, recording the change in PROGRESS.
   AR-28 (the plain-language guide) is true as written.
8. **Read the PROGRESS entries of Phases 15b, 16 and 17.** From 17: the rooms and surgeon-group
   entities it built (type names, master keys, `SG-COS` "Canterbury Orthopaedic Surgeons" and its
   member surgeons, id prefixes), whether `ContractHolderOrganisation` / `masters.organisations`
   still exist (17 left them for this phase), and any copy that calls an organisation a contract
   holder. From 16 and 15b: the `PERSIST_VERSION` you start from.
9. **Capture the parity baseline before any model change** (work item 1), before any edit to
   `types.ts`.

## Reference

**Design (convention 17):**
- `docs/design/Design Language.dc.html` for tokens: status pills as tint and on-tint, mono
  tabular-nums for codes and money, 4pt spacing, radii, teal as the only action colour, crimson for
  identity only.
- `docs/design/Admin Review.dc.html` for the admin table and detail-panel anatomy. Its CONTRACT field
  is the model for how a Contract is named on a Booking.
- `docs/design/Admin Day.dc.html` for admin chrome.

No mockup covers Master data. Extend the admin's own table, panel and pill patterns; do not invent a
new visual language. Admin is a desktop layout, so use a wide side panel, not a bottom sheet.

**Catalogue:** the covered files above; `domain-model.md` (contract holder, Contract, No contract
(RVG), versions);
[US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (first-party
Contracts, Phase 19a);
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) and
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (the picker and No
contract (RVG) first, Phase 20, which wraps this phase's search matcher);
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) (the payer on the
Booking, Phase 21);
[US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) (the insurer master:
insurer-held third-party Contracts, no auto-created default);
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) and
[US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md) (fixed rate and fixed
discount, carried as interim terms); OQ-48, OQ-66, OQ-67, OQ-78, OQ-91, OQ-98.
Evidence (read the cited passages with `npm --prefix requirements-board run source -- --item <ID> --text`,
Node 22.18 or newer): `requirements-board/requirements/notes/2026-10-07-aa-meeting-with-greg.md` #22
(AA in the centre, everyone else a contract holder), #27 (the holder comes first in narrowing), #29
(the billable party is a reference, "contract holder is billable party, yes or no"), #39 and #40
(dated Contracts); `requirements-board/requirements/notes/2026-10-07-pricing-model-documents.md` #9,
#10, #11, #18, #22 (CONTRACT_HOLDER), #23 (CONTRACT), #36 (versions) and #37 (integrity rules).

**Artifacts** (draft reference shape; regions named where this phase builds them):
- [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md), the plain-language guide,
  true as written: `#contracts-two-kinds`, `#no-contract-rvg`, `#who-gets-the-invoice` (stored here,
  acted on by 21), `#keeping-prices-up-to-date`.
- [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md), the draft technical design
  v4: `#contract-holder-fields`, `#contract-fields`, `#contract-versions`, `#integrity-rules`;
  `#billable-party` and `#contract-selection` for context only (21 and 20).
- [AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md), the ERD: `#contract-holder`,
  `#contract`.

**Analysis:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Theme 3 (Contract replaces the billing route) and the EP-04
  table.
- [epics/EP-04.md](../epics/EP-04.md) and [epics/EP-05.md](../epics/EP-05.md).
- `gaps.json`: the entries for FT-04.1, US-04.1.1, US-04.1.2, US-04.1.4, US-04.1.5, US-04.2.1,
  US-04.2.10 (re-graded at `60e2d1e`), and US-05.2.6, FT-05.5, US-05.5.1 (Matches, carried across).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-48, DM-07, DM-49 (DM-09 for
  19a's context).
- [analysis/reverse-check.md](../analysis/reverse-check.md) RV-33 and RV-20.
- [analysis/prototype-map-domain.md](../analysis/prototype-map-domain.md) §2 and §5,
  [prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md),
  [prototype-map-admin.md](../analysis/prototype-map-admin.md).

**Code entry points** (names and lines as at `60e2d1e`; Phases 15a session 2 to 17 run first, so
check the lines you find):
- `aa-prototype/src/domain/types.ts`: `ContractHolderOrganisation` (about line 177),
  `ContractHolderType`, `ContractScope`, `ContractType2Detail`, `Contract`, `ContractPrice` (about
  lines 186 to 262), `CounterpartyRef`.
- `aa-prototype/src/domain/billing/contracts.ts`: `isEffectiveOn`, `rank`, `selectContract` (only
  `defaultContractFor` calls it), `matchContractPrice`.
- `aa-prototype/src/domain/billing/fee.ts` (about lines 168 to 225): the `type === 2` and `type === 3`
  branches.
- `aa-prototype/src/domain/billing/invoiceBuild.ts`: `HOLDER_LABEL` (about line 72),
  `defaultContractFor` (about line 86, with the "protected default Type 1" message),
  `resolveContractForProcedure` (about line 114), `counterpartyForProcedure` (about line 187, the
  "unreachable" throw).
- `aa-prototype/src/domain/billing/validateBookingForBilling.ts`: `feeContextFor`,
  `INDIVIDUAL_ARRANGEMENT_MESSAGE`, the rate x time gate.
- `aa-prototype/src/domain/billing/fixtures.ts`: `mkContract`.
- `aa-prototype/src/domain/seed/contracts.ts`: `CONTRACT`, `defaultType1`, `CONTRACTS`,
  `CONTRACT_PRICES`.
- `aa-prototype/src/domain/seed/cast.ts`: `HOSPITALS`, `INSURERS`, `ORG`, `ORGANISATIONS`.
- `aa-prototype/src/domain/seed/bookings.ts`: the seeded `governingContractId`s (about 20
  procedures point at `CONTRACT.stgDefault`, `forteDefault` or `nibDefault`; `DEFAULT_CONTRACT_BY_HOSPITAL`
  at about line 119).
- `aa-prototype/src/domain/seed/index.ts`: `masters.contracts` / `contractPrices`, the counters, and
  the scenario markers `cosAccContractBooking` and the bariatric marker (with "Type 2" and "Type 3"
  in their labels and details).
- `aa-prototype/src/store/contractActions.ts`: `isProtectedDefault`, `DEFAULT_PROTECTED_MESSAGE`,
  `createContract`, `editContract`, `deleteContract`, `addContractPrice`, `editContractPrice`.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital` (about line 45) and
  `setInsurerDirectClaims` (about line 102) mint the protected default.
- `aa-prototype/src/store/mutate.ts`: the id specs `contract: { prefix: 'CTN', pad: 3 }` and
  `contractPrice: { prefix: 'CPN', pad: 3 }` (about lines 73 and 76).
- `aa-prototype/src/store/selectors.ts`: the billing context (`contractPrices`), `counterpartyName`
  (the `organisation` case).
- `aa-prototype/src/store/index.ts`: the contract action exports.
- `aa-prototype/src/store/appStore.ts`: `PERSIST_VERSION` (16 at `60e2d1e`; 15b to 17 may bump it).
- `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx` (about line 82):
  `editContract(..., { effectiveToISO: undefined })` restores a dated-out Contract; it must keep
  working.
- `aa-prototype/src/shared/demoTriggers/registry.ts` (about line 198): Phase 14's "Trigger billing
  failure" dates out `CONTRACT.cosAcc` to 2026-07-15.
- `aa-prototype/src/apps/admin/screens/MasterData.tsx`: `ContractsView` (about line 198; columns Name,
  Type, Holder, Scope, From, To, no code column, no search, no filters), the Hospitals header and
  add-hospital result ("default Type 1", about lines 287 and 323), the Insurers header (about line
  377), `OrganisationsView`.
- `aa-prototype/src/apps/admin/flows/ContractEditSheet.tsx`: the Type segmented control and holder
  select (about lines 76 to 182), `PriceRows` (hook `contract-price-rows`), the "Protected default
  Type 1" notice.
- `aa-prototype/src/shared/flows/EditBillingSetupSheet.tsx` (the governing-contract select, about line
  175) and `shared/booking/OfficeBillingSetup.tsx`.
- `aa-prototype/src/shared/capture/feeContext.ts`, `shared/booking/BookingDetailBody.tsx` (fee
  context), `domain/seed/billing.ts`: where a stored `governingContractId` becomes the Contract that
  prices.
- `aa-prototype/src/shared/audit/fieldLabels.ts` and `shared/audit/auditNarrative.ts` (the
  `ContractScope` and `ContractType2Detail` branches, about lines 148 to 163).
- `aa-prototype/src/apps/admin/reviewFlags.ts` (flag (c), about line 82) and its test.
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx` (about line 340, "Health NZ agreed rate") and
  `apps/demo/DemoData.tsx`: scenario text that names Contracts.
- `visual/admin-phase07.spec.ts`: asserts "default Type 1" copy (about lines 93 and 107).
- Tests that build Contracts or read the old fields: `domain/billing/{contracts,fee,invoiceBuild,
  validateBookingForBilling,prePaymentInvoice}.test.ts`, `domain/seed/seed.test.ts`,
  `store/{billingRun,billingRetry,mastersActions,btmCapture,intake,prepayment,bookingActions}.test.ts`
  (`billingRetry.test.ts` dates out and restores the COS ACC Contract through `editContract`;
  `mastersActions.test.ts` asserts the protected default at about lines 244 to 276),
  `shared/demoTriggers/demoTriggers.test.ts`, `apps/admin/reviewFlags.test.ts`. There is no
  `contractActions.test.ts` yet; create it.

## Work items

Model, seed and pricing come first and are re-greened before any UI.

1. **Parity baseline first** (`domain/billing/feeParity.test.ts`, new). Write it **before** any model
   change, run it green, and keep its output.
   - For every seeded procedure it records `feeFor(...).total`, `lines` (basis and amount) and
     `billableUnits`, using the same context the app builds (the List date and the stored governing
     Contract).
   - For every seeded Booking it records the `buildInvoicesForBooking` draft totals per counterparty
     (kind and id), so a holder remapping that changes who is billed fails parity.
   - It records amounts, units, bases and counterparties, not line descriptions.
   - Keep the results in a checked-in fixture (`domain/billing/__parity__/phase-18-baseline.json`,
     written with `toMatchFileSnapshot`). After the reshape only the test's context-building code
     changes; the fixture never does. Never run it with `-u`: a fixture change is a parity failure to
     explain, not to accept.
   - Add explicit assertions for the pinned demo figures: the design-day fees under SXAP at $26.50,
     Health NZ $23, St George's ACC $25, COS ACC $24, the S3 Holt and fee figures as they stand when
     this phase starts, the $23 vs $28.50 fallback test (an expired Health NZ Contract priced at the
     anaesthetist's rate), the bariatric $2,800 and second-procedure $950, and the Aria 3.0 h x $480
     = $1,440 line. These are how US-05.2.6 (fixed rate), US-05.2.5 (fixed price) and FT-05.5 / US-05.5.1
     (ACC as an ordinary holder) are proven to carry across.
2. **Types** (`domain/types.ts`; doc comments cite AR-29 `contract-holder-fields`,
   `contract-fields` and `integrity-rules`, and say the shapes are a draft kept behind
   `domain/billing/contracts.ts`).
   - `ContractHolderId` (seed `CH-...`, allocated `CHN-nnn`).
   - `ContractHolder` (DM-48, US-04.1.5):
     - `id`, `name` (for example "Southern Cross", "Canterbury Orthopaedic Surgeons", "Dr Melanie
       Souter, own price list");
     - `partyType: 'thirdParty' | 'firstParty'` (the draft's `party_type`);
     - `kind: 'insurer' | 'hospital' | 'surgeon' | 'rooms' | 'anaesthetist'` and its context link:
       `insurerId`, `hospitalId`, `surgeonId`, `surgeonRoomId` or `surgeonGroupId` (Phase 17's ids), or
       `anaesthetistId`. The draft has no kind or context link; the catalogue's narrowing (US-04.2.1:
       the List's hospital, the surgeon or rooms, the first-party anaesthetist) needs one, so it is
       ours, stored here and read by Phase 20. A rooms holder links to a room or a group when one
       exists (Aria has neither; log it);
     - `billsHolder: boolean` (the draft's `bills_holder`: true when the holder pays AA itself);
     - `billablePartyRef?: CounterpartyRef`: the holder's billable-party record (the draft's
       `billable_party_id`). The prototype has no single billable-party table, so it is today's
       counterparty reference into hospitals, insurers, organisations, surgeons or billable parties;
     - `retiredAtISO?`.
     Integrity (AR-29 `integrity-rules`, US-04.1.5 AC): `billsHolder` requires `billablePartyRef`; a
     holder with `anaesthetistId` is `firstParty` and `kind: 'anaesthetist'`, and only such a holder is
     first party; a first-party holder is never billed (an anaesthetist's own list only sets the price,
     US-04.2.1); a third-party holder of kind insurer, hospital or surgeon has its link.
   - `Contract` (DM-07, US-04.2.10):
     - `id`, `aaCode`, `name`;
     - `holderId?: ContractHolderId`: absent **only** on No contract (RVG);
     - `isDefault: boolean`: the draft's `is_default`, now meaning **the one No contract (RVG)**:
       exactly one true, found by this flag, never by its name. The old "protected default Type 1"
       meaning is gone;
     - `effectiveFromISO`, `effectiveToISO?` (the draft's `valid_from` / `valid_to`; keep the code
       names, labelled "Valid from" and "Valid to" in the UI; absent means open-ended), `reviewDateISO?`
       (optional in the type only because No contract (RVG) has none; every holder's Contract has one,
       US-04.1.2 AC 3: "it has a start date, an optional end date and a review date"; the draft has no
       review date, so it is ours), `previousVersionId?: ContractId` (the draft's `previous_contract_id`), `retiredAtISO?`;
     - **interim terms**, kept exactly as today until Phase 19a moves them onto lines:
       `interimTerms: 'rvg' | 'rateOrDiscount' | 'fixedPrices'` (today's `type` 1, 2 and 3, renamed so
       nothing reads it as a category), `type2Detail?` (unchanged: an agreed unit rate is US-05.2.6's
       fixed rate, a percent discount is US-05.4.3's fixed discount) and
       `permitsIndividualArrangement` (the Method 3 gate, unchanged until Phase 24).
     - Remove `type`, `holderType`, `holderId` and `scope`. `ContractScope` and `ContractHolderType`
       go: every seeded scope is organisational, and the individual-anaesthetist scope is replaced by
       a first-party holder.
   - `ContractPrice` is **unchanged** (interim; Phase 19a replaces it with the Contract line). Its rows
     belong to one version (`contractId` is the version's id).
   - `ContractHolderOrganisation` / `masters.organisations` stays as a billable-party and Xero-contact
     source behind a holder (COS); it is no longer a Contract holder type. Do **not** rename
     `CounterpartyKind`: it ripples into Xero contacts, invoices and history.
3. **Pure Contract helpers** (`domain/billing/contracts.ts`, the one module; Vitest in
   `contracts.test.ts`). Nothing in the apps re-implements any of these.
   - **Holder rules:** `validateHolder(holder)` returns the integrity failures above as data (the
     store refuses on them); `holderKindLabel` lives in the UI labels module (work item 13), not here.
   - **No contract (RVG):** `noContractOf(contracts)` returns the one `isDefault` Contract and throws in
     tests if there is not exactly one (`assertOneNoContract`); `isNoContract(c)`.
   - **Versions** (AR-29 `contract-versions`): `versionChain(contracts, id)` (every version linked
     through `previousVersionId`, oldest first), `latestVersion`, `versionInForce(contracts, id,
     dateISO)` (the chain's version whose dates contain the date, or undefined), and
     `versionTimeline(chain, todayISO)` giving `{ current?, upcoming[], ended[] }` for "Current",
     "Upcoming from <date>" and "Ended <date>" (US-04.2.10 AC 2). `isEffectiveOn` is unchanged.
     Tests: the 1 April / 1 July pair from US-04.2.10's first AC (a procedure on 15 June prices on the
     1 April version), no overlap, a version entered ahead, and a chain with an ended middle version.
   - **New version plan:** `planNewVersion(chain, { effectiveFromISO })` returns the new version's
     dates and the previous version's new end date (the day before), or a refusal: the start must be
     after the latest version's start; only the latest version can be succeeded; versions never
     overlap. The store applies it (work item 6).
   - **Started versions are frozen:** `termsLocked(version, todayISO)` is true once the version's
     start is on or before demo-clock today; the store refuses a terms change on it (interim terms,
     `type2Detail`, `permitsIndividualArrangement`, its `ContractPrice` rows) with one single-sourced
     message pointing at New version (US-04.1.2: "A price review creates a new dated version rather
     than changing the old one").
   - **AA code** (US-04.1.4, D16): `nextAaCode(prefix, issuedCodes)` is the **only** place a code is
     made: `<prefix>-<nnnn>`, the next free number for that prefix. `aaCodePrefixFor(holder | undefined)`
     maps the holder kind: `INS` insurer, `HOS` hospital, `SUR` surgeon, `RMS` rooms, `OWN` first party,
     `RVG` for No contract (RVG). Every version of a Contract shares its code (a version is a dated
     revision of the same Contract, not a new one; logged for the owner). The code is stamped at
     creation, never edited, never reused (the generator takes every code ever issued), and distinct
     from the system id (`CT-...` / `CTN-nnn`). Tests: deterministic, unique across prefixes, shared
     by a chain, never reused after delete, and the seeded codes pinned.
   - **Composite search** (US-04.1.4, Greg's "modern search"): `contractMatchesQuery(contract,
     holderName, query)` returns the matched fields or undefined, matching case- and
     space-insensitively the AA code, the Contract name and the holder's name;
     `contractSearch(query, { contracts, holders })` runs it across the latest version of every chain
     and returns ids with their matched fields; an empty query returns everything. Phase 19a adds the
     holder codes and descriptions on lines to `contractMatchesQuery`; Phase 20's picker wraps the same
     matcher inside its fitting set. Tests: an AA code, a partial name, a holder name, no match.
   - **Catalogue filters:** `isActiveContract(chain, todayISO)` (not retired, and a version current or
     upcoming) and `contractsOfHolder`.
   - **Interim pricing terms:** `interimTermsOf(contract)` is what `fee.ts` reads instead of `type`
     (work item 4). `permitsRateTime(contract)` = `contract.permitsIndividualArrangement`, the single
     source of the Method 3 gate that `validateBookingForBilling`, `billingLineActions` and
     `AddBillingLineSheet` read; `INDIVIDUAL_ARRANGEMENT_MESSAGE` stays single-sourced. Both go in
     Phases 19a and 24.
   - **Interim route counterparty:** `routeCounterpartyForHolder(holder)` returns the counterparty
     today's contract-holder route bills for that holder: its `billablePartyRef` when set, otherwise
     the holder's own party from its link (a surgeon holder gives `{ kind: 'surgeon', id }`), and
     undefined for a first-party holder or a rooms holder with no billable party. It reads **neither
     `billsHolder` nor the payer**: who is billed is unchanged until Phase 21, which replaces this
     function with the holder or the payer on the Booking. Test that COS yields exactly
     `{ kind: 'organisation', id: ORG.cos }` and Doyle `{ kind: 'surgeon', id: SURG.doyle }`.
   - `selectContract` and its `rank` go with `defaultContractFor` (no other caller); Phase 20 builds
     the fitting list. `matchContractPrice` is unchanged.
4. **The resolver and pricing on the new shape** (fees unchanged).
   - **One way from a stored id to the pricing Contract:** `contractForPricing(contracts, storedId,
     dateISO)` = the chain's version in force on the List date, else the stored record. Every path
     that prices calls it: `shared/capture/feeContext.ts`, `validateBookingForBilling.feeContextFor`,
     the Booking detail body's fee context, the billing context in `store/selectors.ts` and
     `domain/seed/billing.ts`. Capture, validator and invoice build then never disagree on the version.
   - `fee.ts`: the `contract?.type === 2` branch reads `interimTermsOf(contract) === 'rateOrDiscount'`
     (with `type2Detail`), the `type === 3` branch reads `'fixedPrices'`; No contract (RVG) and a plain
     RVG Contract price at the anaesthetist's unit value. Keep `FeeResult`, the ordinal rule and the
     2026-07-22 fixed-price fallback exactly; only the discriminant changes. Every existing
     `fee.test.ts` case is re-expressed with **the same expected numbers**, including the $720 paper
     spot-check; add a case that a rate change across two versions prices each List date on its own
     version (US-04.2.10 AC 1 and AC 4).
   - `invoiceBuild.ts` `resolveContractForProcedure`:
     - stored Contract: the version in force on the List date (`versionInForce`); a successor version
       now takes over instead of a fallback (gap: "falls back to default Type 1 rather than a successor
       version");
     - stored, but no version in force, and the holder is a hospital or an insurer: **No contract
       (RVG)** (same price as the old default Type 1), with the counterparty kept as the stored
       holder's route counterparty (an interim `billedAs` on the resolution, removed by Phase 21);
     - stored, no version in force, any other holder (surgeon, rooms, first party): the
       `contractIneffective` exception, as today (Phase 08 decision 1; Phase 14's "Trigger billing
       failure" on COS relies on it);
     - nothing stored on the hospital route: No contract (RVG), billed to the List's hospital
       (interim); on the insurer route: No contract (RVG), billed to the insurer; on the billable-party
       route: no Contract needed, as today;
     - the "No default contract found" exception and its "protected default Type 1" message go (No
       contract (RVG) always exists); `HOLDER_LABEL` reads the holder kind.
   - `counterpartyForProcedure`: the insurer and billable-party routes are unchanged; the
     contract-holder route bills `billedAs` when set, else `routeCounterpartyForHolder` of the
     resolved Contract's holder, else (No contract (RVG) on the hospital route) the List's hospital.
     An undefined result is a billing exception with a plain message (data, never a throw), which
     replaces the "unreachable" throw.
   - `validateBookingForBilling`: the rate x time gate reads `permitsRateTime`; a stored Contract with
     no version in force on the List date and no fallback reports the same message the resolver
     gives.
   - `fixtures.ts`: `mkContract` defaults to a hospital holder's plain RVG Contract (`interimTerms:
     'rvg'`); add `mkHolder` and `mkNoContract`.
5. **Seed** (`domain/seed/contracts.ts`, `seed/cast.ts`, `seed/index.ts`, `seed/bookings.ts`). Keep
   every existing Contract id, so no seeded `governingContractId` moves.
   - **Holders** (`CONTRACT_HOLDERS`, `masters.contractHolders`):
     - `CH-STG` St George's, `CH-SX` Southern Cross, `CH-FORTE` Forte Health, `CH-CES` Christchurch
       Eye Surgery, `CH-CPH` Christchurch Public: hospital, third party, holder billed, billable party
       the hospital;
     - `CH-NIB` nib: insurer, third party, holder billed, billable party the insurer;
     - `CH-DOYLE` Mr P. Doyle: surgeon, third party, **not billed** (a surgeon's fixed-fee arrangement
       only sets the price, US-04.2.1). The route still bills Doyle through
       `routeCounterpartyForHolder` until Phase 21 bills the payer; log it as a Phase 21 handoff;
     - `CH-COS` Canterbury Orthopaedic Surgeons: rooms, `surgeonGroupId: SG-COS` (Phase 17), third
       party, holder billed, billable party `{ kind: 'organisation', id: ORG.cos }`, so COS stays the
       same counterparty and Xero contact;
     - `CH-ARIA` Aria Skin and Laser Clinic: rooms, no room or group link, third party, holder billed,
       billable party `{ kind: 'billableParty', id: BP.ariaClinic }`;
     - `CH-SOUTER` "Dr Melanie Souter, own price list": first party, `anaesthetistId: ANAE.souter`,
       not billed, **no Contract yet**: Phase 19a gives it her fixed-price Contract (US-04.2.14), which
       Phases 26 and 27 use for the prepaid demo.
   - **No contract (RVG)** (new, `CT-NO-CONTRACT`): "No contract (RVG)", no holder, `isDefault`,
     `interimTerms: 'rvg'`, from 2020-01-01, no end, no review date (the one Contract without one). It governs no seeded procedure;
     the resolver's fallback reaches it.
   - **The six ex-defaults become plain RVG Contracts** (OQ-98's default, D32), same ids, `isDefault`
     false, `interimTerms: 'rvg'`, holder billed through their holder: `CT-STG-D1` "St George's RVG",
     `CT-SX-D1` "Southern Cross RVG", `CT-FORTE-D1` "Forte Health RVG", `CT-CES-D1` "Christchurch Eye
     Surgery RVG", `CT-CPH-D1` "Christchurch Public RVG", `CT-NIB-D1` "nib RVG". The procedures that
     store them keep their price (the anaesthetist's unit value) and counterparty. Rename the seed
     constants (`stgDefault` and so on to `stgRvg`) and `DEFAULT_CONTRACT_BY_HOSPITAL` in
     `seed/bookings.ts` to `PLAIN_RVG_CONTRACT_BY_HOSPITAL`; delete `defaultType1`.
   - **Negotiated Contracts**, names without "(Type n)", terms unchanged:
     - `CT-SXAP` "Southern Cross Affiliated Provider": holder `CH-SX`, `rateOrDiscount`, $26.50 per
       unit, from 2024-07-01 (Decisions log 2026-07-23 figure kept), review 2027-04-01;
     - `CT-HNZ` "Health NZ agreed rate": holder `CH-CPH`, $23, from 2023-07-01, review date 2026-07-01,
       so "Review due" shows on day one;
     - `CT-STG-ACC` "ACC elective services via St George's": holder `CH-STG`, $25, review 2027-04-01;
     - `CT-COS-ACC` "ACC orthopaedic services, Canterbury Orthopaedic Surgeons": holder `CH-COS`, $24,
       review 2027-04-01;
     - `CT-DOYLE-BAR` "Bariatric fixed prices, Mr P. Doyle": holder `CH-DOYLE`, `fixedPrices`, from
       2025-01-01, **valid to 2026-07-27**, with its rows `CP-BAR-1` to `CP-BAR-3` unchanged ($2,800,
       $2,400 and the ordinal-2 $950; `store/billingRun.test.ts` names `CP-BAR-1`);
     - **new version** `CT-DOYLE-BAR-2`: same name and AA code, `previousVersionId: CT-DOYLE-BAR`, from
       **2026-07-28**, rows `CP-BAR-4` to `CP-BAR-6` copied from the first version with the gastric
       bypass at **$2,950**. This is the demo's "Upcoming" version: one "+7 days" press, or the
       "Procedure day · 28 Jul" shortcut, makes it current. No seeded Doyle procedure sits on or after
       28 Jul, and the parity test proves it;
     - `CT-ARIA-HOURLY` "Aria Skin and Laser Clinic, individually arranged hourly rate": holder
       `CH-ARIA`, `rateOrDiscount` $26.50 and `permitsIndividualArrangement` exactly as today.
   - **AA codes:** stamped by `nextAaCode` in `CONTRACTS` order, so the seed is deterministic; versions
     share their chain's code. The expected table, pinned in `seed.test.ts` (with a uniqueness
     assertion across chains): `CT-NO-CONTRACT` `RVG-0001`; `CT-STG-D1`, `CT-SX-D1`, `CT-FORTE-D1`,
     `CT-CES-D1`, `CT-CPH-D1`: `HOS-0001` to `HOS-0005`; `CT-NIB-D1` `INS-0001`; `CT-SXAP` `HOS-0006`;
     `CT-HNZ` `HOS-0007`; `CT-STG-ACC` `HOS-0008`; `CT-DOYLE-BAR` and `CT-DOYLE-BAR-2` `SUR-0001`;
     `CT-COS-ACC` `RMS-0001`; `CT-ARIA-HOURLY` `RMS-0002`. The store keeps every code ever issued
     (`masters.issuedAaCodes`, seeded with these), so a deleted Contract's code is never handed out
     again.
   - Review dates (US-04.1.2 AC 3: every Contract has one): 2027-04-01 on the negotiated Contracts and
     the six plain RVG Contracts (the 1 April fee cycle), 2026-07-01 on Health NZ; none on No contract
     (RVG), which never expires (logged for the owner).
   - Reword the scenario markers: the bariatric marker's "Type 3 fixed price booking" becomes "Fixed
     price booking (bariatric)", and `cosAccContractBooking`'s detail drops "Type 2".
   - Id specs in `store/mutate.ts`: add `contractHolder: { prefix: 'CHN', pad: 3 }`; `contract`
     (`CTN`) and `contractPrice` (`CPN`) stay.
   - **Bump `PERSIST_VERSION` by one** from the value you find, with a comment line in the history
     block.
6. **Store** (`store/contractActions.ts`, a new `store/contractHolderActions.ts`,
   `store/mastersActions.ts`). Every action is office-only and goes through `mutate()` with an audit
   entry; refusals are data and read the pure helpers.
   - **Holders:** `createContractHolder`, `editContractHolder` and `retireContractHolder` (audited
     `contractHolder.create`, `.update`, `.retire`). They refuse every `validateHolder` failure
     ("A holder that pays AA needs a billable party", "A holder linked to an anaesthetist is first
     party"); changing `partyType` or the anaesthetist on a holder that holds Contracts; and retiring a
     holder that still holds an active Contract (retire the Contracts first).
   - `createContract`: the input carries `holderId` (required, not retired), name, valid-from,
     valid-to, review date (**required**: refused without one, US-04.1.2 AC 3) and the interim terms,
     and **no** AA code: the store stamps `aaCode` from
     `nextAaCode(aaCodePrefixFor(holder))` and appends it to `issuedAaCodes`. It refuses `isDefault`
     (only the seed has No contract (RVG)), a `rateOrDiscount` Contract without `type2Detail`, and a
     first-party holder's Contract with rate x time permitted.
   - `editContract`: name, review date and valid-to are editable on any version; `aaCode`,
     `holderId`, `isDefault` and `previousVersionId` are not in the patch type, and a raw patch carrying
     them is refused. The terms are refused once `termsLocked` (work item 3). Valid-from is editable
     only while the version has not started, and on a successor only through the same
     `planNewVersion` rules (still after the previous version's start, the previous version re-ended
     the day before), so no edit can open a gap or an overlap in a chain. Valid-to can never
     overlap the successor's start and can be cleared only on the latest version (the Billing
     monitor's restore and Phase 14's trigger both act on COS, which has no successor).
   - `createContractVersion(api, actor, contractId, { effectiveFromISO, reviewDateISO })` (new, the
     review date required as on create,
     audited `contract.newVersion`): applies `planNewVersion`, copies name, AA code, holder, interim
     terms and the `ContractPrice` rows (new `CPN` ids) to a new `CTN` version with
     `previousVersionId`, and ends the previous version the day before. The new version's terms stay
     editable until it starts.
   - `retireContract(api, actor, contractId, { effectiveToISO? })` (new, audited `contract.retire`):
     stamps `retiredAtISO` on every version of the chain and ends the latest version (default today,
     never before its start); its Outcome reports how many unbilled procedures still reference the
     chain, so the UI can warn. The retired Contract keeps its AA code.
   - `deleteContract` stays for a never-used chain (existing guards) and deletes its rows; its AA code
     stays in `issuedAaCodes`.
   - **No contract (RVG)** refuses every edit, end date, retire, delete and new version, with one
     message: "No contract (RVG) is always available and cannot be changed." `isProtectedDefault` and
     `DEFAULT_PROTECTED_MESSAGE` go.
   - `addContractPrice` and `editContractPrice` refuse a version whose terms are locked.
   - `mastersActions.ts`: `createHospital` and `setInsurerDirectClaims` **no longer mint a Contract**
     (RV-33, US-11.4.1's wrong behaviour). `createHospital`'s Outcome loses `defaultContract`; the
     insurer flag still gates today's insurer route.
   - Export every new action from `store/index.ts`.
   - Tests (`contractActions.test.ts`, new; `mastersActions.test.ts` re-expressed): holder integrity
     refusals, AA code stamping and prefixes, immutability, no reuse after delete, a version chain
     with the day-before end and the overlap refusals, locked terms on a started version, retire with
     the unbilled count, No contract (RVG) refusals, and that adding a hospital or flipping an insurer
     creates no Contract.
   - **Existing tests that the new rules refuse** are re-expressed against what the rules allow,
     never by loosening a rule: `store/billingRun.test.ts`'s "snapshot immunity" case (about line
     367) edits `CP-BAR-1` and ends `CT-DOYLE-BAR` on 2026-07-31, both now refused (a started
     version's rows are locked, and 31 Jul overlaps `CT-DOYLE-BAR-2`'s start), so it proves immunity
     through a New version on a billed Contract plus an edit to the upcoming version's rows instead;
     `store/mastersActions.test.ts`'s "adds and edits a Type 3 price row" (about line 300) targets
     the upcoming `CT-DOYLE-BAR-2` and gains the refusal on `CT-DOYLE-BAR`; its re-type case (`{ type:
     1 }`, about line 296) and the protected-default cases (about lines 244 to 276, and
     `billingRun.test.ts` about line 451) go with the category and the default. The Health NZ end-date
     case (`billingRun.test.ts` about line 320) and the COS ones (`billingRetry.test.ts`) keep their
     expected figures: Health NZ now falls to No contract (RVG) at the same price and counterparty.
7. **Re-green session 1.** `npx vitest run` with the parity fixture matching unchanged, `npm run build`
   and `npm run build:pwa`. Stop here if this is the end of session 1, leaving PROGRESS as IN
   PROGRESS with what remains.
8. **Admin: Contract holders** (`apps/admin/screens/MasterData.tsx`, a new "Contract holders" tab
   before "Contracts"; a new `apps/admin/flows/ContractHolderPanel.tsx`; covers US-04.1.5).
   - Table: Name; Kind ("Insurer", "Hospital", "Surgeon", "Surgeon's rooms", "Anaesthetist");
     Party (a neutral pill "Third party" or "First party"); Invoiced ("Holder: <billable party name>"
     when the holder is billed, "Payer on the Booking" when not); Contracts (count of active
     Contracts, a link that opens the Contracts tab filtered to this holder); Status ("Retired"
     neutral pill).
   - "Add holder" and a row "Edit" open the wide panel: name; party type; kind and its link (a picker
     over the matching master: insurers, hospitals, surgeons, Phase 17's rooms and groups, or
     anaesthetists; choosing an anaesthetist sets first party and turns "Holder is billed" off and
     disabled); "Holder is billed" with its billable-party picker shown and required when on; Save
     (teal); "Retire holder" (error treatment, refused with the store's message while it holds an
     active Contract). Hooks: `data-shot="contract-holders"` on the table, `data-shot="holder-panel"`.
9. **Admin: Contract catalogue rebuilt** (`ContractsView`; covers FT-04.1, US-04.1.1, US-04.1.2,
   US-04.1.4).
   - **Search** above the list: one field, "Search by AA code, Contract or holder", driven by
     `contractSearch`, with a result count. `data-shot="contract-search"`.
   - **Filters** beside it: "Active" / "All" (segmented, Active by default) and a holder filter (a
     searchable select over holders, "All holders" by default). Search and filters combine.
   - **Grouped by holder:** No contract (RVG) first under its own heading, then one heading per holder
     (name, kind and the Invoiced text), its Contracts beneath. One row per Contract (the chain), not
     per version. A holder with no Contract still shows its heading with "No Contracts yet" (the
     Souter first-party holder until Phase 19a), so first-party holders are visible.
   - Columns: AA code (mono), Name, Terms ("RVG at the anaesthetist's rate", "Fixed rate $26.50 per
     unit", "Fixed discount 10%", "Fixed prices · 3", "Rate x time permitted" as a second tag; labels
     from the UI labels module), Valid from, Valid to, Review, Status. Status pills: "Current",
     "Upcoming from <date>" (neutral) when a later version is entered ahead, "Ended", "Retired"
     (neutral), "Review due" (the `semantic.warning` tint). `src/theme` has no info colour, so do not
     invent one.
   - The header copy loses "default Type 1": "No contract (RVG) is always offered first and cannot be
     changed." The OQ-98 provisional note (work item 13) shows once, collapsed, under the header.
   - "New contract" (teal) opens the detail panel. `data-shot="contract-catalogue"`.
10. **Contract detail** (`apps/admin/flows/ContractEditSheet.tsx`, rebuilt as a wide desktop panel with
    sections; covers US-04.1.2, US-04.1.4, US-04.2.1, US-04.2.10).
    - **Header:** the AA code in mono beside the name, read-only, "Assigned on save" on a new
      Contract; the version's status pill.
    - **Holder:** a holder picker ("Contract holder", searchable over non-retired holders) on a new
      Contract; read-only afterwards, with the holder's kind, party pill and Invoiced text (who the
      holder setting says is invoiced; a plain helper line says the holder decides who is invoiced).
      No contract (RVG) shows "No holder · offered for every procedure".
    - **Terms (interim):** a choice of "RVG at the anaesthetist's rate", "Fixed rate or discount"
      (agreed unit rate or percent discount, today's Type 2 inputs) and "Fixed prices" (today's
      `PriceRows`, keeping the hook `contract-price-rows`), plus "Rate x time permitted". Read-only
      with "This version has started. Use New version to change its terms." once `termsLocked`.
    - **Dates:** valid from, valid to, review date.
    - **Versions:** the chain newest first, each with its dates and pill ("Upcoming from 28 Jul 2026",
      "Current", "Ended 27 Jul 2026"), selectable to view that version; **"New version"** (teal
      secondary) asks for the start date and the review date (with "The current version will end the day before" shown
      live) and opens the new version with its terms ready to change. `data-shot="contract-versions"`.
    - **Actions:** Save (teal primary); "Retire contract" (confirm with the unbilled-reference count;
      error treatment, not crimson); "Delete" only for a never-used Contract. No contract (RVG) shows
      its fixed notice and no actions.
    - Hooks: `data-shot="contract-detail"`.
11. **Office billing setup** (`shared/flows/EditBillingSetupSheet.tsx`, `shared/booking/OfficeBillingSetup.tsx`).
    - The governing-contract select lists No contract (RVG) first, then one option per active chain
      under holder `optgroup`s, each labelled "<AA code> · <name>", no "(Type n)". A retired Contract
      shows only if already selected, as "(retired)". It still lists every holder's Contracts:
      narrowing by the Booking's context is Phase 20. It stores the chain's id; pricing takes the
      version in force through `contractForPricing`.
    - The read view names the Contract as "<AA code> · <name>" and the version's dates.
    - Mobile and web need no new control; their fee breakdowns are unchanged in value.
12. **ACC review flag** (RV-20): delete flag (c) "ACC should not bill the patient directly" from
    `apps/admin/reviewFlags.ts` and its test case. ACC stays an ordinary holder's Contract; the
    informational ACC chip on mobile Balances, the ACC column on web Accounts and `accRelated` stay
    (RV-20: "keep the chips"), as does the ACC pre-op flat-fee help text.
13. **Copy, labels, provisional note and tests sweep.**
    - `src/shared/contracts/labels.ts` (new; imports nothing admin-only, so the PWA purity test holds):
      `HOLDER_KIND_LABEL`, `PARTY_TYPE_LABEL`, `INTERIM_TERMS_LABEL`, `invoicedLabel(holder)` and
      `versionStatusLabel`. One home for every app.
    - `src/shared/contracts/provisionalNotes.ts` (new): the one open reading this phase builds, OQ-98
      (drift check step 3), rendered in the catalogue and nowhere else. No note for OQ-48, OQ-66,
      OQ-67, OQ-78 or OQ-91: they are answered.
    - `shared/audit/fieldLabels.ts`: labels for AA code, holder, party type, holder is billed, billable
      party, valid from and to, review date, previous version, retired, interim terms. Remove the
      Type, holder type and scope fields.
    - `shared/audit/auditNarrative.ts`: replace the `ContractScope` and `ContractType2Detail` branches
      with narration for holders ("Held by Southern Cross", "Invoices the payer on the Booking"),
      versions ("New version from 1 Aug 2026; the previous version ends 31 Jul 2026") and terms, so a
      History entry never shows raw JSON; a Contract's entries name it by AA code and name.
    - `MasterData.tsx`: the Hospitals header and add-hospital result lose "default Type 1" ("Added
      Ashburton Surgical."); the Insurers header says the flag marks insurers that accept direct
      claims, with no Contract created.
    - Grep `aa-prototype/src` for "Type 1", "Type 2", "Type 3", "default Type 1", "protected default"
      and "standard units" in rendered strings and fix them; comments that describe history may stay.
    - `DemoControlPanel.tsx` and `DemoData.tsx` scenario text: new Contract names, no "Type n", and
      S5 Beat 4's new-version beat.
    - Phase 14's "Trigger billing failure": keep its behaviour; reword its description if it names the
      Contract by its old name.
    - `visual/admin-phase07.spec.ts`: update the "default Type 1" assertions and its screenshot. Add
      Playwright shots for the holder master, the catalogue grouped by holder, a search, and the Doyle
      detail with "Upcoming from 28 Jul 2026".
    - No en or em dashes in any new copy; no build-phase references in app copy.

## Demo triggers

This phase adds **no new button**. The new version is a product action, the Upcoming version flips
with the existing demo clock (harness bar, and the PWA's More-tab clock), and the rest shows through
normal use.

| Trigger | Screen | Effect |
|---|---|---|
| "New version" (product) | Admin, Master data, Contracts, "Health NZ agreed rate" | A new version from the chosen date (for example 1 Aug 2026, rate $24.00); the current version ends the day before and both show under the Christchurch Public holder, the new one "Upcoming from 1 Aug 2026" |
| Existing clock "+7 days" or "Procedure day · 28 Jul" | Admin, Master data, Contracts, "Bariatric fixed prices, Mr P. Doyle" | The seeded second version flips from "Upcoming from 28 Jul 2026" to "Current" (gastric bypass $2,950.00) and the first shows "Ended 27 Jul 2026". The Tue 14 Jul bariatric Booking still prices $2,800.00, because the procedure date picks the version |
| Insurer direct-claims flag (product) | Admin, Master data, Insurers | Flipping AIA Health to direct claims creates no Contract (no new button) |

- **Check the existing trigger still works:** Phase 14's "Trigger billing failure" ends the COS ACC
  Contract on 2026-07-15. The COS holder is rooms, so there is no fallback: the COS Booking still
  fails and its sibling is invoiced; the Billing monitor's restore (`editContract(..., {
  effectiveToISO: undefined })`) still clears it, and the retry bills COS as the same organisation
  counterparty.
- **PWA equivalent:** none needed. The effect is on the Admin Contract catalogue, and the PWA has no
  Admin; the mobile fee breakdown is unchanged in value.
- **Phase 15a's shared "Raise sample warnings":** no change. This phase registers no warning rule.

## Out of scope

Do not add fields for these here (convention 15):

- RVG groups, the procedure list and the two-tab picker: 19.
- Contract lines (fixed price, fixed rate, fixed discount, base and modifier units, holder code and
  description) replacing the interim terms and `ContractPrice`, the line-copy on a new version, the
  holder codes in the search, the anaesthetists' own fixed-price Contracts (the seeded Souter
  holder's Contract), and the resolver's line, procedure and group layers: 19a.
- The fitting Contract list (No contract (RVG) first, holder-fit candidates under holder headings,
  the first-party rule, the composite search inside it), removing the route, the payment category
  and `Procedure.insurerId`: 20.
- Who is billed decided by the holder's "holder is billed" or the payer on the Booking, the payer
  itself, the insurance indication (OQ-93) and the guardian override's removal: 21. The interim
  `billedAs` and `routeCounterpartyForHolder` go there.
- Invoice layout, delivery and GST set on the Contract, and the Split action: 22.
- The multi-procedure rule and combination Contracts: 23.
- The price precedence, the adjustable rule (No contract (RVG) and first party adjustable,
  third-party read-only) and the Method 3 gate's removal: 24.
- The pricing snapshot that records the version at authorise, and versions listed with their
  invoices: 25.
- Spreadsheet loads of holders, Contracts and lines, and the organisations master's fate: 42.
- Insurer and funding-source scope, the category table, required booking inputs and default RVG
  Contracts per procedure: dropped by the catalogue, never built.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin, Master data, Contract holders: the ten seeded holders show with kind, party pill and
      Invoiced text (Doyle and the Souter list read "Payer on the Booking"; COS reads "Holder:
      Canterbury Orthopaedic Surgeons"). Add a hospital holder with "Holder is billed" on and no
      billable party: refused with the store's message. Link a new holder to an anaesthetist: it
      becomes first party and "Holder is billed" turns off. Retiring Southern Cross is refused while
      it holds active Contracts.
- [ ] Contracts: No contract (RVG) first, then Contracts under holder headings; every row shows a
      short AA code in mono and none shows "Type n" or "default". The codes match the seed test.
      "Active" hides ended and retired Contracts and "All" shows them; the holder filter narrows to
      one holder; Health NZ shows "Review due".
- [ ] Search: a seeded AA code (`SUR-0001`) finds the Doyle Contract; "affiliated" finds SXAP; a holder
      name ("Canterbury") finds the COS Contract; a query with no match shows an empty state; search
      combines with both filters.
- [ ] New contract under a holder: the header reads "Assigned on save"; saving without a review date
      is refused; after save it shows the next AA code for the holder's prefix. The AA code and holder cannot be edited. Delete it (never
      used), create another: it gets a new code, not the deleted one.
- [ ] No contract (RVG) opens with its fixed notice and no actions; the store refuses an edit, end
      date, retire or new version with its message.
- [ ] Health NZ agreed rate: "New version" from 1 Aug 2026 at $24.00. The current version ends 31 Jul
      2026, the new one shows "Upcoming from 1 Aug 2026", both under Christchurch Public with one AA
      code. A second new version starting on or before 1 Aug 2026 is refused. The current version's
      terms are read-only with the New version hint. The Hemi Walker invoice (Dr Whitaker, Fri 17 Jul)
      is unchanged.
- [ ] Doyle bariatric: "Upcoming from 28 Jul 2026" with the gastric bypass at $2,950.00. Press the
      harness clock "+7 days": the second version is Current and the first "Ended 27 Jul 2026". The
      Tue 14 Jul bariatric Booking still shows $2,800.00 and $950.00.
- [ ] Add a hospital: no Contract appears. Flip AIA Health to direct claims: no Contract appears.
- [ ] Retire a negotiated Contract with no unbilled references: it leaves the Active view (still with
      its AA code under All) and the office governing-contract select; the audit shows
      `contract.retire`.
- [ ] Office billing setup on a Booking: the governing-contract select lists No contract (RVG) first,
      then "<AA code> · <name>" under holder groups.
- [ ] Every seeded fee and counterparty is unchanged (the parity fixture matched): the S3 figures; S4
      Beat 3 (Phase 14's trigger fails the COS Booking and invoices its sibling; restore and retry
      bill COS as before); S5 Beat 4's invoice unchanged.
- [ ] The Aria rate x time line still adds on Souter's Mon 27 Booking under the Aria Contract, and a
      Contract without rate x time still refuses it with the single-sourced message.
- [ ] Admin Review shows no "ACC should not bill the patient directly" flag; the ACC chip on mobile
      Balances and the ACC column on web Accounts are still there.
- [ ] Mobile (framed and PWA) and web Booking detail: fees unchanged.
- [ ] The OQ-98 provisional note appears once in the catalogue and nowhere else.
- [ ] `npm run shots` green, with the Phase 07 spec updated and the new shots captured.
- [ ] Catalogue screenshots: the recipes below created or updated, the broken ones re-pointed, a full
      `npm run capture` with no failed recipe and no story without a recipe, the covered items' shots
      checked by eye, `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` green, with the parity fixture matched.

## Demo guide updates

Patch these in the same session and mirror each in the same section of
`docs/demo-guide/master-demo-guide.html`:

- **`04-presenter-cheat-sheet.md`, "Contracts":** replace "Type 1: reference only... Type 2: agreed
  rate or discount... Type 3: fixed price" and "Every hospital and direct-billing insurer must have a
  protected default Type 1" with: every Contract belongs to a contract holder (an insurer, hospital,
  surgeon or rooms, or an anaesthetist's own price list); the holder says whether it pays AA; No
  contract (RVG) is the one default, always offered first; Contracts are dated versions, and a price
  review is a new version, so old Bookings keep the old price; every Contract has AA's own short code,
  searchable with names and holders. Replace "Surgeon/group/organisation-held contracts do not have
  that guaranteed fallback" with "an ended Contract held by a surgeon or rooms has no fallback (the S4
  billing-failure beat)". Add two tips: "show an upcoming version": open the Doyle Contract, then
  press "+7 days"; "find a Contract": type an AA code or holder name in the Contract search.
- **`03-demo-script.md`:**
  - **S5 Beat 4** ("contract effective-dating"): becomes "Contract versions". Click: Admin → Master
    data → Contracts → **Health NZ agreed rate** → **New version** from **1 Aug 2026**, review date
    **1 Apr 2027**, rate **$24.00**, Save; then open the **Hemi Walker** Health NZ invoice from Dr Whitaker's Fri 17 Jul List. Say: a
    price review is a new dated version; the old one ends the day before, and work done before then
    keeps its price. Expected: both versions under the holder, the new one "Upcoming from 1 Aug 2026",
    the invoice unchanged. Optional aside: the Doyle "Upcoming" version and the Contract search. The
    S5 "Serves" line's "contract effective-dating" becomes "Contract versions".
  - **S4 Beat 3**: "a group-held contract with no default fallback was dated out" becomes "a Contract
    held by a surgeon's rooms (Canterbury Orthopaedic Surgeons), which has no fallback, was ended".
  - **S3**: unchanged in figures; check its wording for "Type".
- **`01-personas-and-responsibilities.md`:** drop "ACC route warnings" from the office's review flags.
- **`02-workflows-and-handoffs.md`:** drop "ACC advisory flags"; "Selects the governing Contract and
  rating method" becomes "Selects the Contract".
- **Control Panel scenario text** (`DemoControlPanel.tsx`, `DemoData.tsx`) and the seed scenario
  markers: new Contract names, no "Type n", S5 Beat 4's New version.
- Not a milestone phase, but re-read `master-demo-guide.html` §S4 and §S5 after patching.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 18` first: earlier phases may have changed
these recipes since this plan was written. All covered shots are Admin (Master data); the mobile and
web apps get no new screen.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [FT-04.1](../../../../requirements-board/requirements/stories/FT-04.1.md) Contract catalogue | captured · contracts | `partial`, reason "Contract lines are built in Phase 19a." Re-shoot `contracts` on `[data-shot=contract-catalogue]`: No contract (RVG) first, Contracts under holder headings with the AA code column, the Active / All and holder filters. Add a `holders` shot of the Contract holders tab. Caption "Contract holders and their dated Contracts, filtered by active or all and by holder" |
| [US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md) Third-party and first-party Contracts | partial · contract-types | `partial`, reason "The Contract picker grouped by holder with No contract (RVG) first is built in Phase 20; first-party Contracts with their prices in Phase 19a." Rename the shot `contract-kinds` (the old name describes retired types): the catalogue showing No contract (RVG) first, third-party holders and the first-party Souter holder heading, with no type labels. Replace the stale caption ("choosing the contract type and holder type") with "Third-party Contracts, the anaesthetist's own, and No contract (RVG)" |
| [US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) Create, edit, retire Contracts | partial · contracts, edit-contract | `captured`. Re-shoot `contracts` with Valid from, Valid to, Review and Status ("Review due" on Health NZ) and the Active / All filter highlighted; `edit-contract` opens "Health NZ agreed rate" (re-point the `tr:has-text(...) >> role=button[name="Edit"]` step to the new row or row click) on `[data-shot=contract-detail]` with the dates (valid from, valid to, review date) and actions highlighted. Add a `retire` state (the Retire confirm). Drop the partial reason. Replace the stale captions ("Contracts list with effective from and to dates", "Edit contract, effective dates and delete") with "Contracts with their valid from, valid to and review dates, filtered by active or all and by holder" and "A Contract's dates, versions, New version and Retire" |
| [US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md) Contract audit and versioning (covered by Phase 25; under FT-04.1) | absent · no shots, reason "Contracts are edited in place; no version history is kept..." | That reason stops being true here (every version is kept and viewable). Set `partial`, reason "Each version is kept and can be viewed; the invoices raised under each version are listed beside it in Phase 25." One shot `versions` on Health NZ agreed rate's `[data-shot=contract-versions]` after a New version (or the Doyle chain, as US-04.2.10), caption "Every version of a Contract is kept and can be opened". Phase 25 completes it to `captured` |
| [US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) AA identifier for every Contract | absent · placeholder | `partial`, reason "Holder codes on Contract lines join the search in Phase 19a." Shots: `aa-code` (the catalogue's mono AA code column highlighted), a `search` state typing `SUR-0001` (finds the Doyle Contract) on `[data-shot=contract-search]`, and a new Contract's header showing "Assigned on save". Caption "Every Contract has AA's own short code, searchable with names and holders" |
| [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) Contract holders | none (new item) | Create the recipe, `partial`, reason "A first-party holder's Contracts are offered only on its anaesthetist's Bookings once the Contract list is narrowed (Phase 20); the holder decides who is invoiced from Phase 21." Shots: `holders` (`[data-shot=contract-holders]`, the Party and Invoiced columns highlighted), and a `holder-panel` state with a hospital holder open showing "Holder is billed" and its billable party. Caption "Each contract holder records whether it pays AA and who is invoiced" |
| [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) Contract holder, who is billed, and where it applies | partial · contract-holder | `partial`, reason "Who is invoiced follows the holder from Phase 21; the Contract list is narrowed by hospital, surgeon or rooms and anaesthetist in Phase 20." Re-shoot `contract-holder` on the COS ACC Contract's detail (re-point `tr:has-text("ACC orthopaedic services")`) with the holder section highlighted (kind, party, Invoiced text). Its scope states go: scope no longer exists. US-04.2.1's `images` still list two hand-added `assets/US-04.2.9/admin-contract-scope-*.png` shots from the retired US-04.2.9; remove those two entries from its `images` list only (never its text or status), then `npm run check`. Caption "The holder decides who is invoiced: its billable party, or the payer on the Booking" |
| [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) Contract prices effective from a date | absent · placeholder | `captured`. Shot `versions` on the Doyle Contract's `[data-shot=contract-versions]`: the current version and "Upcoming from 28 Jul 2026" with the $2,950.00 gastric bypass, highlighted. A second state after the runner's clock step or the "+7 days" trigger if the recipe can press it, showing the second version Current and the first Ended. Caption "A price review is a new dated version; both current and upcoming are visible" |

US-04.2.4 left this phase for 19a; its recipe stays as it is apart from the breakage below.

**Recipes this phase breaks** (keep shot names unless the old name describes retired behaviour):
- `US-04.2.2` (Verify, Phase 24) and `US-04.2.4` (Phase 19a): they click rows by the old names
  (`tr:has-text("Bariatric fixed prices")` still matches; `"St George's standard units"`,
  `"Southern Cross Affiliated Provider"` and `"Aria Skin and Laser Clinic"` need checking) and
  `label:has-text("Agreed unit rate")`; the Terms section keeps the `contract-price-rows` hook. Re-point
  names and labels; keep `US-04.2.2`'s `type-1`, `type-2`, `type-3` and `rate-time` state names until
  Phase 24, but replace any caption naming "Type 1/2/3" with the terms it now shows.
- `US-04.3.2` (governing contract picker): the options become "<AA code> · <name>" under holder
  groups, and the `[role=dialog] label:has-text("Governing contract")` highlight must still match.
- `US-04.4.1` (Retired): adding a hospital no longer creates a Contract, so its screen is gone: set
  `status: absent` with the reason "Retired: removed in Phase 18".
- `US-04.2.9` (Retired; the old Organisational or Individual sheet): set `status: absent`, "Retired:
  removed in Phase 18", if the runner still captures it.
- `US-04.2.7` (Retired; required booking inputs, never built): keep `status: absent` and replace its
  reason, which says completion checks "come from the billing route", with "Retired: a Contract
  declares no required booking inputs (2026-10-08)".
- `US-11.4.1` (insurer master): the header copy changes; check the caption is still true.
- `US-04.3.3` (No contract (RVG) first; Phase 20): its three `default-contract` shots show a seeded
  Procedure's Contract, which this phase renames from "St George's standard units (default Type 1)"
  to "St George's RVG". The captions "Procedure governed by the St George's default contract" and
  "Default hospital contract shown on the Booking" become false here: reword them to "Procedure
  governed by St George's plain RVG Contract" and "The Procedure's Contract shown on the Booking",
  keep the shot names (Phase 20 renames them when it builds the picker) and keep the status. Rewrite
  its partial reason, which names the "hospital default contract" and "the protected hospital
  default": "Seeded hospital Procedures carry their hospital's plain RVG Contract; an ended hospital
  or insurer Contract falls back to No contract (RVG). No contract (RVG) first in the picker is built
  in Phase 20."
- `US-04.2.5` (Retired; the ordinal rows go in Phase 19a): its `ordinal-rows` step clicks
  `tr:has-text("Bariatric fixed prices") >> role=button[name="Edit"]`; re-point it to the new row
  open, and reword its caption and reason's "Type 3 contract" to "fixed-price Contract".
- `US-05.2.5` and `US-04.2.3`: their reasons name "Type 3"; reword them to "fixed prices" without
  changing status (both belong to later phases). `US-05.5.1` and `US-05.5.2`: Contract names change;
  re-check the captions.
- The Admin Master data recipes that open the Contracts tab (`US-04.1.3`, `US-04.3.1`, `US-04.3.4`,
  `US-13.4.1` and similar): the wide detail panel replaces the old sheet, and a new "Contract holders"
  tab sits before "Contracts", so re-point any `[role=dialog]` or tab selector the `--dry` run fails
  on.
- The Phase 07 Playwright spec (`visual/admin-phase07.spec.ts`) is separate from the recipes; work item
  13 updates it.

**ATLAS.md.** Personas and IDs (holder ids, Contract names and AA codes, `CT-NO-CONTRACT`,
`CT-DOYLE-BAR-2`), Seed data (the Doyle upcoming version, the Health NZ review date), Overlays (the
wide Contract and holder panels) and Existing hooks (`contract-holders`, `holder-panel`,
`contract-catalogue`, `contract-search`, `contract-detail`, `contract-versions`; `contract-price-rows`
kept). Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the build and tests are green, and before the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**: four Opus lenses
(quality, fee-maths and parity, store and lifecycle, plan and catalogue adherence); verify every
finding against the catalogue and the code, fix the confirmed ones, re-green, and record the pass. Do
not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**
- **Parity is real:** the fixture was captured before the reshape and matches unchanged. Recompute a
  sample by hand: SXAP $26.50, Health NZ $23, St George's ACC $25, COS $24, the bariatric rows, Aria
  $1,440. No expected number was edited to pass.
- **Who is billed did not move:** every seeded invoice goes to the same counterparty kind and id
  (COS stays `{ kind: 'organisation', id: ORG.cos }`, Doyle stays the surgeon, Aria the clinic). No
  billing path reads `billsHolder` yet; `billedAs` and `routeCounterpartyForHolder` are the only
  interim bridges and are labelled for Phase 21.
- **Versions (US-04.2.10, OQ-48):** one chain per Contract, the day-before end, no overlap, the
  version in force on the List date prices everywhere (capture, validator, invoice build, the seed
  billing slice) through `contractForPricing`; a started version's terms cannot change; no path reads
  the demo clock, the Booking-created date or `Date.now()` for pricing ("Current" and "Upcoming" in
  the UI use the demo clock's today).
- **No contract (RVG) (DM-49, OQ-78):** exactly one, found by `isDefault`, no holder, never expires,
  unchangeable through the store; the old per-holder invariants, auto-create paths and fallback are
  gone everywhere, including copy.
- **Holders (US-04.1.5):** every integrity rule holds in the store, independently of the UI (billed
  needs a billable party; anaesthetist means first party and not billed); retire refusals.
- **AA code (US-04.1.4, D16):** made only by `nextAaCode`; stamped on every create path; shared by a
  chain; unique across chains; immutable even with a raw patch; never reused after delete; shown in
  mono in the catalogue, the detail and the office select.
- **Search:** `contractSearch` is pure, in `src/domain/billing`, built on `contractMatchesQuery`, and is
  what the catalogue calls (no second filter in the component).
- **One module:** the holder, Contract and version shapes and rules live only in
  `domain/billing/contracts.ts` (plus the seed); no app re-implements a rule; the doc comments name
  the AR-29 fields and mark ours.
- **No category survives:** no rendered "Type 1/2/3", no `type` field, no branch on a category;
  `interimTerms` is read only through `interimTermsOf`.
- **ACC:** the review flag is gone; the chip, column and pre-op help text stay.
- **Copy and design:** teal the only action colour; Retire uses the error treatment, not crimson; pills
  tint and on-tint; codes and money mono tabular-nums; desktop panels; no en or em dashes; no
  build-phase references in app copy.
- **Persistence and the PWA:** `PERSIST_VERSION` bumped and a stale persisted state reseeds cleanly;
  the PWA purity test holds with the new shared modules.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): OQ-98's default (the five hospital and nib plain RVG Contracts, no lines, every
  procedure); the AA code format (`<holder prefix>-<nnnn>`, shared by a Contract's versions); the
  holder kind and context link and the review date we added beside the draft's fields (a review date
  required on every holder's Contract, none on No contract (RVG)); Aria as a rooms holder with no room
  or group; Doyle seeded "not billed" while the route still invoices him until Phase 21; the seeded
  Souter first-party holder with no Contract until 19a; anything logged rather than fixed; and the
  screens worth a look (Admin, Master data: Contract holders; Contracts with a search; the Doyle
  versions; Health NZ New version), each with its route and persona.
- **Catalogue screenshots result:** the recipes created (US-04.1.5) and filled in (US-04.1.4,
  US-04.2.10), the others changed and the broken ones re-pointed, the `requirements-board/capture/REPORT.md`
  counts (captured, partial, absent, failed) before and after, and the partial reasons handed on
  (FT-04.1 and US-04.1.4 to 19a; US-04.1.1, US-04.1.5 and US-04.2.1 to 20 and 21).
- **Status row:** Phase 18 (Contract holders and dated Contracts) DONE with the date, or IN PROGRESS
  after session 1 with what remains.
- **Phase entry:** the drift-check result against `60e2d1e` (US-04.1.5 Verify; OQ-98 status; OQ-48,
  OQ-66, OQ-67, OQ-78 and OQ-91 as built); Phase 17's rooms and group entities and how COS maps; the
  holder table and the AA code table as seeded; the parity fixture path and result; the
  `PERSIST_VERSION` bump; the review pass; the handoffs to **19a** (lines replace `interimTerms`,
  `type2Detail` and `ContractPrice`, carrying US-05.2.6's fixed rate, the fixed discount and the
  bariatric prices with a parity test; New version copies lines; the Souter first-party Contract;
  holder codes join `contractMatchesQuery`), **20** (the fitting list reads the holder's kind, link
  and party type, wraps `contractMatchesQuery`, offers No contract (RVG) first and the plain RVG
  Contracts per OQ-98; the route goes), **21** (`billsHolder` and the payer decide who is billed;
  `billedAs` and `routeCounterpartyForHolder` go; Doyle's procedures then bill the payer), **24**
  (`permitsIndividualArrangement` and the Method 3 gate; the adjustable rule reads the party type and
  `isDefault`), **25** (the snapshot records the version id; versions listed with their invoices) and
  **42** (spreadsheet loads of holders and Contracts; the organisations master behind holders).
- **Decisions log:**
  - (a) **Supersedes "protected default Type 1 per hospital and insurer"** (3rd review #9, 7th review
    B14): one No contract (RVG) (OQ-78 answered); the seeded defaults are their holders' plain RVG
    Contracts (OQ-98's default, D32); nothing is created with a hospital or an insurer flag; an ended
    hospital- or insurer-held Contract with no successor falls to No contract (RVG) at the same price
    and counterparty (interim until 21).
  - (b) **Amends "Contract-holder placements (seed)" (2026-07-23):** the holder master; COS a rooms
    holder over `SG-COS` billed through `ORG.cos`; Aria a rooms holder billed through its clinic
    billable party; Doyle a surgeon holder, not billed; the ACC Contracts ordinary hospital and rooms
    Contracts.
  - (c) **Type 1/2/3 are no longer categories** (US-04.1.1): their terms stay as interim terms until
    19a; the SXAP $26.50 ruling and the 2026-07-22 fixed-price fallback are kept.
  - (d) **Contracts are dated versions; the procedure date (the List date) picks the version** (OQ-48
    answered, D45); a started version's terms are frozen.
  - (e) **AA code** (US-04.1.4, D16): `<holder prefix>-<nnnn>` from one generator, shared by a
    Contract's versions, immutable, never reused; ours until AA designs the Contract.
  - (f) **The individual-anaesthetist scope becomes a first-party holder**; the scope field is gone.
  - (g) **Supersedes the ACC review flag** (6th review #3, 7th review A5/B3 advisory): removed (RV-20);
    the informational chip and column stay.
