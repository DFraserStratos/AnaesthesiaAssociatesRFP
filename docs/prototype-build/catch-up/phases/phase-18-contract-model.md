# Phase 18 · Contract model

**Requirements covered:**
[US-04.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.1.md) (Contract categories),
[US-04.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.2.md) (create, edit, retire Contracts),
[US-04.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.4.md) (AA identifier for every Contract; Verify),
[US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md) (holder, scope including master-list procedures, and organisational reach; Verify),
[US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md) (fixed fee schedule lines, with holder codes kept as searchable references),
[US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md) (pricing effective from a date),
[US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md) (fixed fee schedule pricing);
[DM-07](../analysis/domain-model-delta.md#dm-07) (Contract reshaped to category, holder, scope, pricing basis and `aaCode`),
[DM-09](../analysis/domain-model-delta.md#dm-09) (ContractPrice becomes FeeScheduleLine);
[RV-20](../analysis/reverse-check.md#rv-20-acc-treated-as-a-visible-special-case) (ACC treated as a visible special case).
Open questions (still open, built as their recommendation and labelled provisional):
[OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md) (which date picks the price),
[OQ-66](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-66.md) (the AA code scheme),
[OQ-67](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-67.md) (who a Contract belongs to).
Answered and built as answered:
[OQ-18](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-18.md) (holder codes are kept for reference and are searchable; a Procedure and Contract pair can carry both an RVG code and a holder code),
[OQ-55](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-55.md) (owner decision D2: insurer and funding source sit on neither the Booking nor the Patient; the Contract defines the billable party).
**Depends on:** Phase 17 (the Surgeon Group record that the Surgeon Group holder points at). Phases 14
and 15 are in place: Card is now Booking, and triggers live in the screen-contextual registry.
**Estimated:** 2 sessions, at the upper limit. Session 1: work items 1 to 8 (model, seed, pricing,
AA code and search helpers, store, parity green). Session 2: work items 9 to 13 (Admin Contract
catalogue with search, Contract detail, office billing setup, ACC removal, copy, demo guide), then
shots, the review pass and PROGRESS. If session 1 runs long, stop green after work item 6 (parity
fixture matching) and start session 2 with work item 7; do not start UI work before the store actions
exist.

## Goal

The Contract stops being "Type 1/2/3 plus a holder" and becomes the catalogue's four-part record:

- a **category**: the six catalogue categories, with no Pre-paid category;
- a **holder**;
- **scope filters**, including the master-list procedures it is set against;
- a **pricing basis**.

Every Contract carries **AA's own unique identifier** (`aaCode`), separate from its system id and from
any holder code, shown in the catalogue and the editor and searchable (US-04.1.4). Each Contract also
gets a review date and an explicit retire. `ContractPrice` becomes a **FeeScheduleLine**. A line has
the holder's own code and description (kept for reference and searchable), GST-exclusive and
GST-inclusive prices, an optional RVG mapping, time band, add-on flag and quantity rule, and
effective-dated prices with a visible "Upcoming from <date>". Contract rates and discounts are
effective-dated the same way.

`fee.ts` prices from the new shape. Every seeded fee and every existing worked example is
re-expressed as a parity test, so **the S3, S4 and S5 figures do not move**. Selection keeps
today's resolver (`resolveContractForProcedure` and the default fallback in `invoiceBuild.ts`), so
the app stays green: scope is modelled and edited here, and only narrows the picker in Phase 20.
Insurer and funding-source scope are **data only**: they describe the Contract and never narrow a
choice, because no Booking or Patient holds an insurer or funding source (OQ-55) and who a Contract
belongs to is still open (OQ-67). ACC loses its special-case markers and is priced as an ordinary
holder's Contract. The Admin Contract catalogue (Master data, Contracts) is rebuilt around the new
record, with search, because Contracts are expected to number in the thousands.

The add-on schedule lines built here are what Phase 39b offers as Contract add-on billing lines.

This is the largest pricing ripple in the plan. Behaviour changes are for Phases 20 to 25. This phase
changes the shape and keeps the numbers.

## Before you start: drift check

1. Run the drift diff and read it for this phase's items:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Check `US-04.1.1`, `US-04.1.2`, `US-04.1.4`, `US-04.2.1`, `US-04.2.4`, `US-04.2.10`, `US-05.2.5`,
   `OQ-18`, `OQ-48`, `OQ-55`, `OQ-66`, `OQ-67`, and the "Contract (recommended structure)" (now with
   `aaCode`, `procedures[]` scope and `paymentSetting`) and "Fee schedule line" tables and the
   "Selection" paragraph in `domain-model.md`. Also skim `US-04.2.2` (pricing basis), `US-04.2.11`
   (combination Contracts), `US-04.3.2` (the picker and its holder-code search), `US-04.4.1` (default
   Contract) and `US-05.5.1` (ACC), because this phase's shape has to fit them.
   - At `501b0b8` the domain-model `category` row still lists "RVG Default Pre-paid". US-04.1.1 (no
     Pre-paid category) and OQ-25 win over that stale row (DM-07's note); do not build it.
   - If an item changed, re-read it and adjust the work items below before building. For example,
     a Pre-paid category coming back, a seventh category, or a new line field.
   - If an item is now Retired or Future, drop it from this phase and say so in the PROGRESS entry.
   - A new item that touches the Contract record goes into this phase only if it is shape-only.
     Behaviour belongs in 20 to 25.
2. **US-04.1.4 and US-04.2.1 are Verify.** US-04.2.1's acceptance criterion (organisational by
   default, narrowed to specific anaesthetists) is already met in substance; US-04.1.4's first
   criterion is true in data today (`CTN-nnn` ids) but never shown. If both are still Verify, build
   them as written and note the status in PROGRESS. No UI label for Verify.
3. **Owner decision D2 (OQ-55, answered).** Confirm it still reads: insurer and funding source sit on
   neither the Booking nor the Patient, and the Contract defines the billable party. So
   `FundingSource` is a Contract-only type: nothing on the Booking, Procedure or Patient gains it.
4. **OQ-18 (answered).** Build the answer: holder codes are kept on fee schedule lines as references
   and are searchable; the Procedure and its Contract together can carry both the procedure's RVG code
   and the chosen line's holder code. There is no anaesthetist holder-code picker: the pick is
   procedure first, then Contract (Phases 19 and 20). Here the line on a Procedure is either chosen by
   the office in billing setup or found through the line's RVG mapping. No provisional label.
5. **OQ-48 (which date decides the price in force).** If it is still open, build the recommendation:
   the date of the procedure, which Greg leaned to on 2026-10-01 and which in the prototype is the
   **List date**, what Contracts are already tested against. Add it to the provisional notes (work
   item 13): "Provisional: the price in force is the one effective on the date of the procedure." If
   it is answered "procedure date", drop that note. If it is answered with a different date (Booking
   created, or invoice raised), thread that date through `pricingDateISO` in work item 4 instead, and
   update the tests.
6. **OQ-66 (the AA code scheme).** If it is still open, build its recommendation: a short structured
   AA code per Contract, made by **one** generator function (`nextAaCode`, work item 3), so a
   different scheme is a one-function change. Provisional note: "Provisional: the AA code format is
   still to be agreed with AA." If it is answered with a scheme, implement that scheme in the same
   function and drop the note.
7. **OQ-67 (who a Contract belongs to, and who pays).** If it is still open, insurer and
   funding-source scope stay **data only**: stored, edited and shown, read by no selection, picker or
   billing code. Provisional note: "Provisional: insurer and funding source describe the Contract and
   do not narrow which Contracts are offered." If it is answered "by funding source", still build only
   the data here and hand the narrowing to Phase 20.
8. **Read Phase 17's PROGRESS entry.** Note the surgeon-group entity it built (Phase 17's plan: type
   `SurgeonGroup`, master `masters.surgeonGroups`, seed id `SG-COS` "Canterbury Orthopaedic
   Surgeons", counter prefix `SGN`), whether it has any link to the `ORG.cos` organisation record,
   and confirm `ContractHolderOrganisation` / `masters.organisations` still exist (Phase 17 left them
   for this phase to decide). Work items 2 and 3 depend on this.
9. **Capture the parity baseline before any model change** (work item 1). This comes before any
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

**Catalogue:** the seven covered files above; `domain-model.md` §2 "Contract (recommended
structure)", "Fee schedule line" and "Selection";
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md)
(the four pricing bases);
[US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md)
(a combination Contract sits under each parent procedure, so procedure scope is a list);
[US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md)
(the picker's holder-code search, which wraps this phase's per-Contract matcher);
[US-05.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.6.md)
(rate x time);
[US-05.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.1.md)
(ACC through the holder's Contract); OQ-18, OQ-48, OQ-55, OQ-66, OQ-67; the evidence note
`catalogue/notes/2026-10-01-aa-meeting-with-greg.md` #10, #27, #29, #49 and #64.

**Analysis:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Theme 3 ("Contract replaces the billing route"), the
  "Structural first" DM-07 bullet, and the EP-04 and EP-05 tables.
- [epics/EP-04.md](../epics/EP-04.md) and [epics/EP-05.md](../epics/EP-05.md).
- `gaps.json`: the entries for the covered IDs, DM-07, DM-09 and RV-20.
- [analysis/prototype-map-domain.md](../analysis/prototype-map-domain.md) §2 and §5.
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md).
- [analysis/prototype-map-admin.md](../analysis/prototype-map-admin.md).

**Code entry points** (names as at `501b0b8`; Phase 15 renamed Card to Booking, so use the Booking
names you find):
- `aa-prototype/src/domain/types.ts`: `ContractHolderType`, `ContractScope`, `ContractType2Detail`,
  `Contract`, `ContractPrice` (about lines 190 to 258), `Procedure.accRelated`, `CounterpartyRef`.
- `aa-prototype/src/domain/billing/contracts.ts`: `isEffectiveOn`, `selectContract`,
  `matchContractPrice`.
- `aa-prototype/src/domain/billing/fee.ts`: `FeeContext`, `feeFor`, the Type 1/2/3 branches.
- `aa-prototype/src/domain/billing/invoiceBuild.ts`: `defaultContractFor`,
  `resolveContractForProcedure`, `counterpartyForProcedure`, `HOLDER_LABEL`, `GST_RATE`.
- `aa-prototype/src/domain/billing/validateCardForBilling.ts`: `feeContextFor`,
  `CardBillingContext.contractPrices` (about line 62), `INDIVIDUAL_ARRANGEMENT_MESSAGE`, the rate x
  time gate.
- `aa-prototype/src/domain/billing/fixtures.ts`: `mkContract`, `mkProcedure`.
- `aa-prototype/src/domain/seed/contracts.ts`: `CONTRACT`, `CONTRACTS`, `CONTRACT_PRICES`, and the
  `defaultType1` helper.
- `aa-prototype/src/domain/seed/index.ts`: `masters.contracts` / `contractPrices`, the counters, and
  the scenario markers `cosAccContractCard` and `accRelatedCard`.
- `aa-prototype/src/domain/seed/cards.ts`: the seeded `governingContractId`s and `accRelated`
  flags.
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
- `aa-prototype/src/store/selectors.ts`: `contractPrices` in the billing context at about line 846;
  `accRelated` on `AccpayInvoiceRow` (about line 601) and its selector (about line 634);
  `counterpartyName` (about line 827, the `organisation` case).
- `aa-prototype/src/store/index.ts`: the contract action exports.
- `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx`: calls `editContract(...,
  { effectiveToISO: undefined })` to restore a dated-out Contract; it must keep working.
- `aa-prototype/src/shared/audit/auditNarrative.ts`: narrates `CounterpartyRef`, `ContractScope` and
  `ContractType2Detail` values (about lines 148 to 163).
- Tests that build Contracts or read the old fields: `domain/billing/{contracts,fee,invoiceBuild,
  validateCardForBilling,prePaymentInvoice}.test.ts`, `domain/seed/seed.test.ts`,
  `store/{billingRun,billingRetry,mastersActions,btmCapture,intake,prepayment}.test.ts`
  (`billingRetry.test.ts` dates out and restores the COS ACC Contract through `editContract`),
  `apps/admin/reviewFlags.test.ts`. There is no `contractActions.test.ts` yet; create it (new) for
  work item 7.
- `aa-prototype/src/store/billingLineActions.ts`: the rate x time gate.
- `aa-prototype/src/store/lifecycle.ts`: `editProcedure` and `ProcedurePatch`.
- `aa-prototype/src/store/appStore.ts`: `PERSIST_VERSION`.
- `aa-prototype/src/shared/capture/feeContext.ts`, `shared/capture/AddBillingLineSheet.tsx`,
  `shared/card/CardDetailBody.tsx` (now the Booking detail body),
  `shared/card/OfficeBillingSetup.tsx`, `shared/flows/EditBillingSetupSheet.tsx` (the
  governing-contract select), `shared/audit/fieldLabels.ts`.
- `aa-prototype/src/apps/admin/screens/MasterData.tsx` (`ContractsView`, about line 198: today
  columns Name, Type, Holder, Scope, From, To, no id column and no search) and
  `apps/admin/flows/ContractEditSheet.tsx` (`PriceRows`).
- ACC markers: `apps/admin/reviewFlags.ts` (flag c) and its test; `apps/mobile/screens/BalancesScreen.tsx`
  (the ACC chip); `apps/web/screens/AccountsScreen.tsx` (the ACC column).
- `apps/demo/DemoControlPanel.tsx`: scenario text that names Contracts.
- `visual/admin-phase07.spec.ts`: asserts "default Type 1" copy.

## Work items

Model, seed and pricing come first and are re-greened before any UI.

1. **Parity baseline first** (`domain/billing/feeParity.test.ts`, new). Write it **before**
   any model change, run it green, and keep its output.
   - For every seeded procedure, it records `feeFor(...).total`, `lines` (basis and amount) and
     `billableUnits`, using the same context the app builds (the List date and the stored
     governing contract).
   - For every seeded Booking, it records the `buildInvoicesForCard` (or its Phase 15 name) draft
     totals per counterparty (kind and id), so a holder remapping that changes who is billed fails
     parity.
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
   - `ContractCategory` = `'rvgDefaultPostPaid' | 'rvgDefaultHospital' | 'hospital' | 'surgeonSolo' |
     'surgeonGroup' | 'insurance'`. There is no Pre-paid category and ACC is not a category
     (US-04.1.1).
   - `ContractHolder`, a discriminated union:
     - `{ kind: 'hospital'; hospitalId }`
     - `{ kind: 'surgeon'; surgeonId }`
     - `{ kind: 'surgeonGroup'; surgeonGroupId }` (Phase 17's group id)
     - `{ kind: 'insurer'; insurerId }`
     - `{ kind: 'bookingBillableParty' }`: the Booking's own billable party. It has no fixed id
       (US-04.2.1; fixes "holder is a fixed party id").
   - `FundingSource` = `'private' | 'SXAP' | 'HNZ' | 'ACC'` (domain-model.md). It is a
     **Contract-only** type: the funding source describes the Contract and is never looked up from
     the Patient or the Booking (OQ-55, D2). No Booking, Procedure or Patient field uses it.
   - `ContractScope` = `{ procedureTypeIds, hospitalIds, surgeonIds, insurerIds, rvgCodes,
     fundingSources, anaesthetistIds }`, all arrays. An empty array means no narrowing on that
     dimension, and empty `anaesthetistIds` means organisational (US-04.2.1 AC).
     - `procedureTypeIds` holds the master-list procedures the Contract is set against (US-04.2.1;
       a combination Contract will list each parent procedure, US-04.2.11). Type it as `string[]`
       here; Phase 19 adds the `ProcedureType` master and its id alias, its editor chips and the
       seeded values. Every seeded Contract has it empty in this phase.
     - `insurerIds` and `fundingSources` are **descriptive data**: a doc comment says no selection,
       picker or billing code reads them (OQ-55; OQ-67 open). One exported constant,
       `SCOPE_NARROWING_DIMENSIONS`, lists the dimensions that may narrow a choice (procedures,
       hospitals, surgeons, RVG codes, anaesthetists) so Phase 20 reads one list.
     - RVG groups arrive with Phase 19's group master.
   - `ContractRateStep` = `{ effectiveFromISO, rate: { basis: 'agreedUnitRate'; unitRate } | {
     basis: 'percentDiscount'; percent } }`.
   - `PricingBasis`:
     - `{ kind: 'rvgUnitsAnaesthetistRate' }`
     - `{ kind: 'rvgUnitsContractRate'; rates: ContractRateStep[] }`
     - `{ kind: 'fixedSchedule' }`
     - `{ kind: 'rateTime' }`

     This is the DM-07 mapping: Type 1, Type 2, Type 3 and `permitsIndividualArrangement`.
   - `Contract` = `{ id, aaCode, name, category, holder, scope, pricingBasis, isDefault,
     effectiveFromISO, effectiveToISO?, reviewDateISO?, retiredAtISO? }`.
     - `aaCode` is AA's own unique identifier (US-04.1.4): set once at creation, never edited, never
       reused, distinct from the system `id` (`CT-...` / `CTN-nnn`) and from any holder code.
     - `isDefault` stays the protected-default marker. It covers the RVG Default Hospital per
       hospital, the insurer default for a direct-billing insurer, and the one RVG Default
       Post-paid.
   - `FeeScheduleLine` replaces `ContractPrice` (DM-09, US-04.2.4):
     - `{ id, contractId, holderCode, description, mappedRvgCodes: string[], timeBand?: {
       fromMinutes, toMinutes? }, isAddOn, quantityRule?: { unitLabel }, procedureOrdinal?, prices:
       FeeSchedulePrice[] }`;
     - `FeeSchedulePrice` = `{ effectiveFromISO, priceExGst, priceIncGst }`.
     - `holderCode` and `description` are the holder's own reference (SXAP AP codes, CES HNZ codes,
       ACC OPT codes); they are searchable (work item 3) and never replace `aaCode`.
     - `procedureOrdinal` is a labelled interim that keeps the bariatric second-procedure row. It
       moves to the Contract's multi-procedure rule in Phase 23.
     - The `surgeonId` match key is dropped, because surgeon narrowing is Contract scope now. No
       seeded row used it.
   - `Procedure` (now on the Booking side) gains `feeSchedule?: { lineId?: string; quantity?:
     number; addOns?: { lineId: string; quantity: number }[] }`. This is the "Procedure records
     feeScheduleLineId" of DM-09 and the OQ-18 answer: with it, the Procedure and its Contract carry
     both the RVG code and the holder code. `lineId` absent means the line is found through its RVG
     mapping.
   - Remove `Procedure.accRelated` (RV-20). DM-12's verification notes the field could survive as
     information, but its only readers are the flag, chip and column RV-20 removes, and ACC is now
     the Contract's funding source.
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
   - `holderKindFor(category)` gives the allowed holder kind per category:
     - `rvgDefaultHospital`, `hospital`: hospital;
     - `surgeonSolo`: surgeon;
     - `surgeonGroup`: surgeon group;
     - `insurance`: insurer;
     - `rvgDefaultPostPaid`: the Booking's billable party.

     Labelled reading for `rvgDefaultHospital`: the holder records whose default it is, which keeps
     every seeded hospital-route invoice on the same counterparty. The domain model says the default
     "does not decide who is invoiced", and the 2026-10-01 meeting said "a default contract bills the
     patient"; Phase 21 owns that tension under OQ-67. Do not change who it bills here.
   - `nextAaCode(category, existingCodes)`: the **only** place an AA code is made (OQ-66). It
     returns `<prefix>-<nnnn>`, the next free number for that prefix, with prefixes `RDP` (RVG
     Default Post-paid), `RDH` (RVG Default Hospital), `HOS` (Hospital), `SSO` (Surgeon Solo),
     `SGR` (Surgeon Group) and `INS` (Insurance), held in one `AA_CODE_PREFIX` map. The code is
     stamped at creation and does not follow a later re-categorise: it identifies, it does not
     describe. Tests: deterministic, unique across prefixes, never reuses a retired or deleted
     Contract's code (the generator takes every code ever issued, which the store keeps), and the
     seeded codes are pinned.
   - `contractSearch(query, { contracts, feeScheduleLines, holderNameOf })` returns the matching
     Contract ids, each with the fields it matched on and any matched lines. It matches, case- and
     space-insensitively, the AA code, the name, the holder's name, and each line's holder code and
     description (US-04.2.4: typing a holder code finds its Contract). An empty query returns
     everything. It is built on an exported per-Contract matcher, `contractMatchesQuery(contract,
     lines, holderName, query)`, which returns the matched fields and lines or undefined. The Admin
     catalogue uses `contractSearch` here. Phase 20's picker runs its own `matchesContractQuery`
     inside the in-scope set only; it should wrap `contractMatchesQuery`, not re-implement the
     matching. Both live in `src/domain/billing` and import nothing from the apps.
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
     the Method 3 gate that `validateCardForBilling`, `billingLineActions` and
     `AddBillingLineSheet` now read, and `INDIVIDUAL_ARRANGEMENT_MESSAGE` stays single-sourced.
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
   - `fixedSchedule`:
     - the matched line's price in force, ex GST, x quantity. The quantity is
       `procedure.feeSchedule.quantity` when the line has a quantity rule, else 1;
     - the fee line reads `"<holderCode> · <description>"`, plus `" × n <unitLabel>"` when the
       quantity is not 1;
     - each office-attached add-on with a price in force adds its own fixed line at price x
       quantity;
     - B/T/M are still computed and returned (US-05.2.5);
     - no main-line match falls to the BTM path as today;
     - `FeeLine` gains an optional `feeScheduleLineId` (Phase 25 locks it).
   - `rateTime`:
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
   - `validateCardForBilling.ts`:
     - `CardBillingContext.contractPrices` becomes `feeScheduleLines` (plus `surgeonGroups` for
       `holderCounterparty`), and `feeContextFor` passes the date and the lines;
     - the rate x time gate reads `permitsRateTime`;
     - new rule: a `rateTime` Contract needs at least one rate x time line to complete, so that a
       rate x time Procedure can never price $0 silently;
     - new rule: `feeSchedule` references must be lines on the governing Contract (single-sourced
       message).
   - `shared/capture/feeContext.ts`, `domain/seed/billing.ts`, the billing context built in
     `store/selectors.ts` (about line 846) and the Booking detail body's fee context all pass
     `pricingDateISO` from the List and pass `feeScheduleLines`.
   - `fixtures.ts`: `mkContract` defaults to `{ aaCode: 'HOS-9999', category: 'hospital', holder:
     hospital, scope: all empty, pricingBasis: rvgUnitsAnaesthetistRate }`.
6. **Seed** (`domain/seed/contracts.ts`, `seed/index.ts`, `seed/cards.ts`, `seed/history.ts`).
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
   - Every seeded Contract has `scope.procedureTypeIds` empty (Phase 19 fills it).
   - Every hospital-held Contract lists its holder in `scope.hospitalIds` (the five defaults, SXAP,
     Health NZ, St George's ACC and the CES HNZ schedule), so the catalogue's Scope column reads
     the hospital and Phase 20's seed assertion already holds. It narrows nothing here.
   - The five hospital defaults become `rvgDefaultHospital`, holder the hospital,
     `scope.hospitalIds = [that hospital]`, `isDefault`, and are named "<Hospital> RVG Default
     Hospital".
   - nib: `insurance`, `isDefault`, `insurerIds [nib]`, named "nib insurer default".
   - SXAP: `hospital`, Southern Cross, `fundingSources ['SXAP']`, and one rate step of $26.50 from
     2024-07-01. The Decisions log 2026-07-23 figure is kept.
   - Health NZ: `hospital`, Christchurch Public, `['HNZ']`, $23 from 2023-07-01, review date
     2026-07-01, so "Review due" shows on day one.
   - St George's ACC: `hospital`, `['ACC']`, $25.
   - COS ACC: `surgeonGroup` (COS), `['ACC']`, $24.
   - Doyle bariatric: `surgeonSolo`, Mr Doyle, `fixedSchedule`.
   - Aria: `rvgDefaultPostPaid`, holder `bookingBillableParty`, `rateTime`, and `anaesthetistIds
     [Souter, Fitzgerald]`. That set covers the two seeded Aria Bookings and shows the "set of
     anaesthetists" scope. This is a labelled reading: there is no individually-arranged category,
     and patient-direct is the only category family whose holder is the Booking's billable party.
     Raise it with the owner.
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
   - Remove `accRelated` from `seed/cards.ts` specs and `seed/history.ts` rows.
   - Rename the scenario marker `accRelatedCard` to `accContractCard` ("ACC procedure under St
     George's ACC Contract"). Update `store/prepayment.test.ts` and `store/billingRun.test.ts`, and
     reword the `cosAccContractCard` detail, dropping "Type 2".
   - **Bump `PERSIST_VERSION` by one** from the value you find, with a comment line in the history
     block.
7. **Store** (`store/contractActions.ts`, `store/mastersActions.ts`). Every action is office-only
   and goes through `mutate()`; refusals are data.
   - `createContract`:
     - the input carries category, holder, scope, pricing basis, dates and review date, and **no**
       AA code: the store stamps `aaCode` from `nextAaCode` over `issuedAaCodes` and appends it there;
     - the store refuses a holder kind that does not fit the category (`holderKindFor`);
     - it refuses `rvgDefaultHospital` and any `isDefault`, because only `createHospital` and
       `setInsurerDirectClaims` mint defaults;
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
       into `rvgDefaultHospital` or setting `isDefault` is refused (only the minting paths make
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
     - The protected lock icon stays on defaults.
     - Pricing reads "Anaesthetist rate", "$26.50 per unit", "10% discount", "Fee schedule · 3
       lines" or "Rate x time".
     - Scope is a short summary of the narrowing dimensions, for example "Christchurch Public" or
       "2 anaesthetists", or "Organisation". Funding source shows as a small neutral tag
       ("SXAP", "HNZ", "ACC") beside the summary, because it describes the Contract.
     - Status pills are "Retired" (neutral), "Review due" (the `semantic.warning` tint), and
       "Upcoming price" (neutral) when any rate or line has an upcoming step. `src/theme` has no
       info colour, so do not invent one.
   - Category filter chips above the table, and a "Show retired" toggle that is off by default.
     Search, chips and the toggle combine.
   - The header copy loses "default Type 1": protected defaults are "RVG Default Hospital and
     insurer default Contracts".
   - The provisional notes (work item 13) show once, collapsed, under the header.
   - `data-shot="contract-catalogue"`.
10. **Contract detail** (`apps/admin/flows/ContractEditSheet.tsx`, rebuilt as a wide desktop panel
    with sections; covers US-04.1.1, 04.1.2, 04.1.4, 04.2.1, 04.2.4 and 04.2.10):
    - **Header:** the AA code in mono beside the name, read-only, with "Assigned on save" on a new
      Contract.
    - **Definition:** name, then category (segmented or select), then a holder picker filtered to
      the category's holder kind (hospitals, `masters.surgeons`, `masters.surgeonGroups`,
      insurers; organisations are no longer offered). "Booking's billable party" shows as fixed
      text.
    - **Scope:** multi-select chips for hospitals, surgeons, RVG codes and anaesthetists. An empty
      field reads "Any". Empty anaesthetists reads "Whole organisation". A separate **Describes**
      group below holds insurers and funding sources, with the OQ-67 provisional note beside it.
      Procedures from the master list arrive with Phase 19, which adds the master; no placeholder
      field here.
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
      - the OQ-48 provisional note beside the pricing section.
    - **Dates:** effective from, effective to and review date.
    - **Actions:** Save (teal primary); "Retire contract", which confirms with the unbilled-reference
      count; "Delete", only for never-used Contracts. Protected defaults show the lock notice and
      disable what the store refuses.
    - Hooks: `data-shot="contract-detail"` and `data-shot="fee-schedule-lines"`, replacing
      `contract-price-rows`.
11. **Office billing setup** (`shared/flows/EditBillingSetupSheet.tsx`, `shared/card/OfficeBillingSetup.tsx`;
    covers US-05.2.5):
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
      `seed/audit.ts`, `cardActions.ts`, `fixtures.ts` and `store/btmCapture.test.ts`.

    ACC work is now visible only as the holder's ACC Contract (funding source ACC) on the Booking.
    Keep the ACC pre-op flat-fee codes copy in `AddBillingLineSheet` unchanged: Phase 39b turns the
    ACC pre-op assessment into a fixed-fee pre-op event (US-05.5.2).
13. **Copy, labels, provisional notes and tests sweep.**
    - **Provisional notes in one place:** `src/shared/contracts/provisionalNotes.ts` (new; the
      `src/shared/contracts/` folder is new too) exports the
      still-open readings this phase builds, each with its OQ id: OQ-48 (price on the date of the
      procedure), OQ-66 (AA code format) and OQ-67 (insurer and funding source describe, do not
      narrow). The catalogue and the detail panel render them from there, and nowhere else spells
      them out. An answered OQ is one deleted entry. No OQ-18 note: it is answered.
    - `shared/audit/fieldLabels.ts`: labels for AA code, category, holder, scope (including
      procedures), pricing basis, rates, review date, retired, holder code, time band, add-on,
      quantity rule, prices and fee schedule. Remove the Type fields.
    - `shared/audit/auditNarrative.ts`: replace the `ContractScope` (`organisation` /
      `individualAnaesthetist`) and `ContractType2Detail` branches with narration for the new
      holder ("Held by Southern Cross", "Held by the Booking's billable party"), scope ("Whole
      organisation", "2 anaesthetists", filters), pricing basis, rate steps and price steps, so a
      History entry for a Contract edit never shows raw JSON. A Contract's history entries name it
      by AA code and name. Keep the `CounterpartyRef` branch.
    - A `CONTRACT_CATEGORY_LABEL` / `PRICING_BASIS_LABEL` map in `src/shared/contracts/labels.ts`
      (new), one home for the three apps.
    - Grep `aa-prototype/src` for "Type 1", "Type 2", "Type 3", "default Type 1" and
      "permitsIndividualArrangement" in rendered strings, and fix them. Comments that describe
      history may stay.
    - Update `DemoControlPanel.tsx` scenario text that names "Health NZ agreed rate (Type 2)" or
      "COS ACC Type 2".
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

## Out of scope

These Contract fields and behaviours belong to later phases. Do not add fields for them here
(convention 15):

- The procedure master, its scope chips in the editor and seeded procedure scope; RVG groups in
  scope; base-unit overrides: 19 and 23.
- The scope-filtered picker (by procedure and hospital) with holder-code search wrapping
  `contractMatchesQuery`, default hospital Contract selection, removing route, payment category and
  `Procedure.insurerId`: 20. Insurer and funding source never go on the Booking or the Patient (D2).
- Required booking inputs, billable party, the not-on-schedule flag replacing the BTM fallback: 21.
- The payment setting (FULL or SPLIT, US-04.2.12), invoice layout, delivery method, GST treatment: 22.
- Multi-procedure rule, including moving `procedureOrdinal` out of the line, and combination
  Contracts set against each parent procedure (US-04.2.11): 23.
- `allowsAnaesthetistAdjustment`: 24.
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

- [ ] Admin, Master data, Contracts: every seeded Contract shows an AA code, a category, holder,
      pricing and scope, and none shows "Type n". The AA codes are unique and match the seed test.
      The five hospital defaults, nib and RVG Default Post-paid carry the lock. Health NZ shows
      "Review due". "Show retired" is off and the category chips filter.
- [ ] Search: "HNZVIT" finds only the CES HNZ schedule and shows "Line HNZVIT60 · Vitrectomy up to
      60 min" with "+3 more"; "BAR-BYP" finds the Doyle Contract; typing a seeded AA code finds that
      Contract; a holder name ("Southern Cross") finds its Contracts; search combines with the
      category chips.
- [ ] New contract: the header reads "Assigned on save", and after save it shows the next AA code
      for its category. Choosing "Surgeon Group" limits the holder list to surgeon groups; "RVG
      Default Post-paid" shows "Booking's billable party"; RVG Default Hospital is not offered. Scope
      chips save; an empty anaesthetists field reads "Whole organisation"; insurers and funding
      sources sit under "Describes" with the provisional note. The AA code cannot be edited.
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
      Contract to "Christchurch Eye Surgery HNZ schedule". It prices `HNZVIT90` at $960.00, the read view shows
      42725 beside "HNZVIT90 · Vitrectomy 61 to 90 min", and B/T/M are still shown. Add "GA add-on"
      and "each extra 15 min" x 2 and the total adds $370 + $200. Pick `HNZCATall` explicitly and it
      prices that line instead.
- [ ] Retire a negotiated Contract with no unbilled references. It leaves the catalogue unless
      "Show retired" is on (still with its AA code), and it drops out of the office
      governing-contract select. The audit shows `contract.retire`.
- [ ] The provisional notes (price date, AA code format, insurer and funding source) appear once in
      the catalogue and beside their sections in the detail panel, and nowhere else.
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
- [ ] Catalogue screenshots: the recipes for US-04.1.1, US-04.1.2, US-04.1.4, US-04.2.1, US-04.2.4, US-04.2.10 and US-05.2.5 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run verify:board` green, with the parity fixture
      matched.

## Demo guide updates

Mirror each change in the same section of `docs/demo-guide/master-demo-guide.html`.

- **`04-presenter-cheat-sheet.md`:**
  - rewrite "Contracts": categories, holder, scope, the four pricing bases, AA's own code on every
    Contract, fee schedule lines with the holder's codes kept for reference and searchable, and
    effective-dated prices with "Upcoming";
  - fix the "ACC route" row in "Terms not to use": use instead "the holder's ACC Contract", because
    ACC is not a route or a category;
  - in "Contracts", add "AA code: AA's own identifier on every Contract; holder codes are
    references beside it";
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
| [US-04.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.1.md) Contract categories | partial · admin-contract-types | `captured`. Re-shoot `admin-contract-types`: the catalogue with the Category column and category chips, and a `new-contract` state with the six categories offered (no Pre-paid) and the holder list filtered to the category. Highlight the category control. Drop the partial reason. Caption "New contract, choosing the category and holder" |
| [US-04.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.2.md) Create, edit, retire Contracts | partial · admin-contracts, admin-edit-contract | `partial`. Re-shoot both: the catalogue with From, To, Review and Status ("Review due" on Health NZ), and the detail panel dates. Add a `retire` state (Retire contract confirm). Rewrite the reason to the one gap left: "Editing still changes a Contract in place; versioning is built in Phase 25." |
| [US-04.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.4.md) AA identifier for every Contract | absent · placeholder, no shots | Add the shots, `captured`. Shots: `aa-code` (catalogue with the mono AA code column, highlight the column), a `search` state typing "HNZVIT" with the matched line "Line HNZVIT60 · Vitrectomy up to 60 min", and the detail header showing "Assigned on save" on a new Contract. Caption "Every Contract has AA's own code; holder codes are references beside it" |
| [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md) Holder, scope and organisational reach | partial · admin-contract-holder | `partial`. Re-shoot: the detail panel Definition and Scope sections (holder picker filtered to the category, chips for hospitals, surgeons, RVG codes and anaesthetists, "Whole organisation" when empty, and the "Describes" group). Rewrite the reason: "The procedures filter arrives with Phase 19 and the scope narrowing the picker with Phase 20." Phase 19 and Phase 20 move it on |
| [US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md) Fixed fee schedule lines | partial · admin-price-rows | `captured`. Re-shoot as `admin-price-rows` (keep the name) on `[data-shot=fee-schedule-lines]` for the CES HNZ schedule: holder code, description, RVG mapping, time band, add-on, quantity rule, ex GST and inc GST. Drop the partial reason. Caption "Each line keeps the holder's own code and description" |
| [US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md) Pricing effective from a date | absent · placeholder, no shots | Add the shots, `captured`. Shot `upcoming-price`: the Doyle Contract (`BAR-BYP`) line showing "$2,800.00 current" and "Upcoming from 28 Jul 2026 · $2,950.00", highlight that price cell. A second state after the existing clock "+7 days" press (or "Procedure day · 28 Jul") if the recipe can press it, showing $2,950.00 current. Caption "Current and upcoming prices are both visible" |
| [US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md) Fixed fee schedule pricing | partial · admin-fixed-price | `captured`. Re-shoot `admin-fixed-price`: office billing setup on a fee-schedule Booking with the "Schedule line" select, the read view showing the RVG code beside the matched line "BAR-BYP · Laparoscopic gastric bypass", add-ons and the B/T/M still shown. Highlight the matched line. Drop the partial reason |

**Recipes this phase breaks.**
- `US-04.2.2` (pricing basis, covered by Phase 20), `US-04.2.4`, `US-04.2.5`: they select
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
- The Admin Master data recipes that open the Contracts tab (`FT-04.1`, `US-04.2.3`, `US-04.2.6`,
  `US-04.4.1` and similar): the wide detail panel replaces the old sheet, so re-point any
  `[role=dialog]` selector the `--dry` run fails on.
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
- **Insurer and funding source (D2, OQ-67):** no selection, picker, validator or billing path reads
  `scope.insurerIds` or `scope.fundingSources`; no Booking, Procedure or Patient field holds a
  funding source; `SCOPE_NARROWING_DIMENSIONS` excludes both.
- **AA code (US-04.1.4, OQ-66):** made only by `nextAaCode`; stamped on every create path (seed,
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
- **Provisional notes:** the three open readings live only in `provisionalNotes.ts`; there is no
  OQ-18 note.
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
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- **Catalogue screenshots result:** the recipes filled in (US-04.1.4, US-04.2.10) and changed (the other five covered items, plus the broken ones such as US-04.2.2 and US-04.2.5), the `requirements-board/capture/REPORT.md` counts (captured, partial, absent, failed) before and after, and the partial reasons handed on: US-04.1.2 to Phase 25 (versioning) and US-04.2.1 to Phases 19 and 20 (procedures filter, picker narrowing).
- **Status row:** add Phase 18 (Contract model) as DONE with the date, or IN PROGRESS after session 1
  with what remains.
- **Phase entry** in the template:
  - the drift-check result (items; US-04.1.4 and US-04.2.1 status; OQ-18 and OQ-55 answered and how
    they were built; OQ-48, OQ-66 and OQ-67 status);
  - what Phase 17's surgeon-group entity was, and how COS maps to it;
  - the AA code format and the seeded id to code table;
  - the parity fixture path and its result;
  - the `PERSIST_VERSION` bump;
  - the review pass;
  - the handoffs to 19 (the procedure master fills `scope.procedureTypeIds` and adds its editor
    chips; RVG groups in scope), 20 (scope narrows the picker by procedure and hospital, reading
    `SCOPE_NARROWING_DIMENSIONS`; its in-scope holder-code search wraps `contractMatchesQuery`;
    RVG Default Post-paid becomes selectable), 21 (the BTM fallback is still in place), 22 (the payment setting), 23
    (`procedureOrdinal` on the line; combination Contracts list each parent in
    `scope.procedureTypeIds`), 25 (rate and price steps and `feeScheduleLineId` to lock), 39b
    (`addOnLinesInForce` and the CES add-on lines) and 42 (the organisations master behind surgeon
    groups).
- **Decisions log:**
  - (a) **Supersedes the 6th review #3 and 7th review A5/B3 ACC advisory**: `accRelated` and the
    review flag, chip and column are removed (RV-20; US-05.5.1). ACC is the holder's Contract with
    funding source ACC.
  - (b) **Amends "Contract-holder placements (seed)" (2026-07-23):**
    - COS is a Surgeon Group holder;
    - Aria is `rvgDefaultPostPaid` with holder "Booking's billable party", pricing basis rate x
      time, and a two-anaesthetist scope (the labelled category reading);
    - the ACC Contracts are ordinary Hospital and Surgeon Group Contracts with funding source ACC.
  - (c) **Protected default vocabulary:** "default Type 1" becomes "RVG Default Hospital or insurer
    default". The invariant is unchanged. RVG Default Post-paid is also protected.
  - (d) **Price in force = date of the procedure (the List date)**, for both rate steps and line
    prices (OQ-48 recommendation, Greg's lean; provisional while OQ-48 is open).
  - (e) **Rate x time basis charges no RVG units** and needs a rate x time line to complete.
  - (f) **Holder codes are references on the line (OQ-18 answered):** a Procedure and its Contract
    carry both the RVG code and the chosen line's holder code; the line is office-chosen or found
    through its RVG mapping; holder codes are searchable. Record that the 2026-07-22 Type 3 BTM
    fallback and the SXAP $26.50 ruling are **kept**.
  - (g) **Surgeon group bills through its organisation record** (interim): the Surgeon Group holder
    invoices `SurgeonGroup.billingOrganisationId`, so COS stays the `ORG.cos` counterparty and Xero
    contact. Organisations are no longer Contract holders but the master survives (Phase 42 gives it
    retire and reinstate as a surviving master); any `CounterpartyKind` change is out of scope.
  - (h) **AA code (US-04.1.4):** `<category prefix>-<nnnn>` from one generator, stamped at creation,
    immutable and never reused; it identifies, it does not follow a re-categorise (OQ-66
    recommendation; provisional while OQ-66 is open).
  - (i) **Insurer and funding-source scope are descriptive data** (D2/OQ-55 answered; OQ-67 open):
    stored and shown, read by no selection.
