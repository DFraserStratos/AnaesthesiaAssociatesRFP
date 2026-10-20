# Phase 18 · Contract holders, settings and dated Contracts

**Requirements covered** (status and grade at catalogue `d4db277`):
[FT-04.1](../../../../requirements-board/requirements/stories/FT-04.1.md) Contract catalogue (Agreed; Contradicts: it hard-deletes, edits in place and has no holder records, filters or header-and-lines screen; its lines arrive in Phase 19a, its staged submit in 25),
[US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md) Typical Contract arrangements (Agreed; **Contradicts**: Type 1/2/3 and a protected default Type 1 per hospital and insurer, where the catalogue has no kinds, only settings),
[US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) Create, edit, retire Contracts (Agreed; Contradicts: edits in place, hard delete, no review date, no filters; the office creates the anaesthetists' own Contracts too, OQ-91),
[US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) AA identifier for every Contract (Agreed; Missing: a unique short AA code and a composite search),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) Contract holders (Verify; Partial: no holder record, no "is billed", no billable-party link, no practitioner link),
[US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) Contract holder, who is billed, and where it applies (Agreed; **Contradicts**: who is billed follows the billing route; this phase stores the holder, its "is billed" setting and its context, and Phases 20 and 21 make them decide the list and the invoice);
[DM-48](../analysis/domain-model-delta.md#dm-48) (the contract holder becomes a master record),
[DM-07](../analysis/domain-model-delta.md#dm-07) (the Contract becomes a dated, versioned record with an AA code and settings; Type 1/2/3 and scope go),
[DM-49](../analysis/domain-model-delta.md#dm-49) (one stored No contract (RVG), held by AA, replaces the protected default Type 1s);
[RV-06](../analysis/reverse-check.md#rv-06-protected-default-type-1-contract-per-hospital-and-direct-claim-insurer-auto-created-and-used-as-a-fallback) (the protected default Type 1, auto-created and used as a fallback; was RV-33),
[RV-32](../analysis/reverse-check.md#rv-32-contracts-are-edited-in-place-deletable-and-the-billing-monitor-un-end-dates-one-to-retry) (Contracts edited in place and deletable, the monitor un-end-dating one, the S4 failure that ends a Contract in the past; **joins this phase**),
[RV-37](../analysis/reverse-check.md#rv-37-review-flag-acc-should-not-bill-the-patient-directly) (the ACC review flag; was RV-20).

**Left this phase:** on 2026-10-20 [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md)
(staged changes, the one-future-version check, the relink by line key, the prepaid exception) moves to
Phase 25. This phase still builds its simple core under DM-07: dated version records, an office "New
version" from a non-past date, the version in force on the procedure date. On 2026-10-08
[US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) (Contract lines) and
[DM-09](../analysis/domain-model-delta.md#dm-09) moved to 19a, with OQ-89; the category table, the
multi-dimension scope, the payment setting, required booking inputs and per-procedure default RVG
Contracts are gone from the catalogue.

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

**Open questions, built as their defaults** (ROADMAP D48 and D55; keep each in one place and log it
for the owner):
[OQ-105](../../../../requirements-board/requirements/questions/OQ-105.md) (D48: a surgeon's
fixed-price arrangement is a Contract held by the surgeon's rooms, linked to the surgeons it covers,
offered on their Bookings after the hospital's, picked by the office; Phase 20 offers it),
[OQ-114](../../../../requirements-board/requirements/questions/OQ-114.md) (D55: the insurer's
direct-claims flag only pre-fills "is billed" on a new insurer holder and creates nothing).
**Answered and built as answered:**
[OQ-98](../../../../requirements-board/requirements/questions/OQ-98.md) (D32: a Contract may hold no
lines; selection offers every Contract valid on the date that fits the Booking, with no test for a
line; a holder's plain RVG Contract has no lines and prices at RVG),
[OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md) (D45: the procedure date
decides the price; never backdated, never deleted),
[OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (No contract (RVG) is the one
default, held by AA, offered first, billing the payer on the Booking; no hospital, insurer or
procedure defaults),
[OQ-66](../../../../requirements-board/requirements/questions/OQ-66.md) (D16: a short AA code, format
ours, made in one function),
[OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) (D17: the holder's billable
party when the holder is billed, else the payer on the Booking; stored here, decided by 21),
[OQ-107](../../../../requirements-board/requirements/questions/OQ-107.md) (D50: an "editable" flag on
each Contract; stored here, acted on by 24),
[OQ-25](../../../../requirements-board/requirements/questions/OQ-25.md) (D64: prepaid is a Contract
setting placed by the office; stored here, started by 27),
[OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md) (D42: the office creates the
anaesthetists' own Contracts). Open and not built here: OQ-100 (a schedule upload), OQ-104 (prepaid
keeps its price through a new version; 25 and 27), OQ-96 (price change on a prepaid Procedure; 24 and 27).

**Depends on:** Phase 17 (surgeons' rooms and surgeon groups, `SG-COS`, which the COS holder points
at). Phases 14, 15 and 15a session 1 are built; the plan runs 15a session 2, 15b, 16 and 17 before
this phase, so take the Booking names, the ACTIVE List state, the warning routine and the
`PERSIST_VERSION` you find.
**Estimated:** 2 sessions. Session 1: work items 1 to 7 (parity baseline, types, pure helpers, the
resolver and pricing on the new shape, seed, store, the trigger part of item 13, re-green). Session 2: work items 8 to 14 (the
Admin holder master, the Contract catalogue with search and filters, the Contract detail with
versions and settings, office billing setup, the ACC review flag, the billing-failure demo, copy and
the demo guide), then shots, the review pass, the catalogue screenshots and PROGRESS. If session 1
runs long, stop green after work item 5 (seed with the parity fixture matching) and start session 2
with work item 6; do not start UI work before the store actions exist.

## Goal

The Contract stops being "Type 1/2/3 plus a holder type and id" and becomes the catalogue's model
(EP-04, FT-04.1, US-04.1.1): **contract holders**, each holding many **Contracts**, each Contract a
series of **dated versions** that are never backdated or deleted, behaving through **settings**, plus
one stored **No contract (RVG)** held by AA.

- **A contract-holder master** (DM-48, US-04.1.5, [AR-29 · Contract holder fields](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-holder-fields),
  [AR-30 · Contract holder](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-holder)):
  a name; a kind (insurer, hospital, surgeon or rooms, anaesthetist; "first party" and "third party"
  are dropped); **"is billed"** with a required billable-party link when set (else the payer on the
  Booking is billed), set on each holder and never implied by its kind; and an optional
  **practitioner link** (an anaesthetist or a surgeon), so its Contracts are offered only on that
  person's Bookings (Phase 20 filters on it). AA itself is a system holder of No contract (RVG) and
  is never billed. The office creates, edits and retires holders. Today's `holderType` / `holderId`
  fold in: an `organisation` or Surgeon Group holder becomes a rooms holder, a `billableParty` holder
  becomes the holder's billable-party link. **D48 (OQ-105's default):** a surgeon's fixed-price
  arrangement (Doyle's bariatric prices) is held by the surgeon's rooms, covering the room's
  surgeons (Phase 17). **D55 (OQ-114's default):** the insurer's direct-claims flag pre-fills "is
  billed" on a new insurer holder and does nothing else.
- **Contract settings in place of kinds** (US-04.1.1, [AR-28 · Typical arrangements](../../../../requirements-board/requirements/artifacts/AR-28.md#typical-arrangements),
  [AR-29 · Contract behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-behaviour)):
  **editable** (may the anaesthetist change its price, rate or discount; D50), **prepaid** (D64) and
  **default** (No contract (RVG) only); whether the holder is billed sits on the holder; invoice
  layout, delivery and GST are 22's. The settings are stored, shown and set by the office; **no
  behaviour moves here** (24 reads `editable`, 27 reads `prepaid`). A Contract may hold no lines
  (D32).
- **Contracts as dated version records** (DM-07, OQ-48, D45, RV-32,
  [AR-29 · Contract fields](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-fields),
  [AR-29 · Contract versions](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-versions),
  [AR-30 · Contract](../../../../requirements-board/requirements/artifacts/AR-30.md#contract),
  [AR-28 · Price reviews and controls](../../../../requirements-board/requirements/artifacts/AR-28.md#price-reviews-and-controls)):
  a start date, an optional end date, a review date and a forward link to the version that revised
  it; the version in force on the procedure date (the List date) prices the Procedure. An office
  **New version** from today or later copies the terms, ends the previous version the day before and
  never overlaps; one entered ahead shows "Upcoming from <date>". **Nothing is backdated or
  deleted:** a version's dates are never edited in place, **Retire replaces Delete** (ending the
  latest version today or later), and a started version's terms and settings are frozen. Phase 25
  replaces "New version" with staged changes, the one-future check and the relink.
- **A short AA code on every Contract** (US-04.1.4, OQ-66, D16), from one generator function, shared
  by every version of the Contract, shown in mono and searchable.
- **The Admin Contract catalogue** (FT-04.1, US-04.1.2): Contracts grouped under holder headings with
  No contract (RVG) first, filters for active or all and by holder, and **one composite search** across
  AA code, Contract name and holder name (19a adds line holder codes). Create, edit, New version and
  retire are office-only (OQ-91, D42). Contracts number in the thousands: search, never a flat list.
- **Type 1/2/3 go as kinds** (US-04.1.1): the pricing data they carry stays exactly where it is as
  **interim terms** (`interimTerms`, `type2Detail`, `permitsIndividualArrangement`, the `ContractPrice`
  rows) that Phase 19a moves onto Contract lines, so **no fee moves**: US-05.2.6's fixed rate, the
  bariatric fixed prices and the ACC Contracts priced as ordinary holders keep working, proven by a
  parity fixture over every seeded fee and invoice.
- **One stored No contract (RVG), held by AA** (DM-49, RV-06, OQ-78,
  [AR-28 · No contract (RVG)](../../../../requirements-board/requirements/artifacts/AR-28.md#no-contract-rvg),
  [AR-29 · Integrity rules](../../../../requirements-board/requirements/artifacts/AR-29.md#integrity-rules)):
  held by the AA system holder, no terms, never expires, found by its `isDefault` flag (exactly one),
  priced at BTM x the anaesthetist's own unit value. It replaces the protected default Type 1 per
  hospital and per direct-claims insurer. The per-holder invariants, the delete and end-date
  protection, the auto-create when a hospital is added or an insurer's flag flips, and the
  default-Type-1 fallback in `invoiceBuild.ts` go; the fallback becomes No contract (RVG) at the same
  price and counterparty. Each seeded default Type 1 stood for a holder that pays AA, so it is
  re-expressed in place (same id) as **that holder's plain RVG Contract** (an ordinary Contract with
  no lines, D32), which Phase 20 offers by context.
- **Who is billed does not change here.** The holder's "is billed" setting, its billable party and
  the context that will narrow the Contract list (the hospital, the surgeon or rooms, the
  practitioner; US-04.2.1) are stored and shown, but the invoice still follows today's billing route
  until Phase 20 removes the route and Phase 21 bills the holder or the payer. One interim function
  gives the route its counterparty from a holder, so every seeded invoice keeps its counterparty.
- **The ACC review flag goes** (RV-37). ACC stays an ordinary holder's Contract; the informational
  ACC chip and column stay.
- **The S4 billing-failure demo is re-based** (RV-32): ending a Contract in the past and un-ending it
  from the monitor are no longer possible. See work item 13.

**The pricing model lives in one place.** The technical design v6
([AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md)) and its ERD
([AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md)) are the reference shape for
contract holders and Contracts, but they are a **proposal** that a later version may change. Their
field names are for orientation. Keep the holder, Contract and version types and every rule about
them (integrity guards, version chain, version in force, the No contract (RVG) lookup, AA codes, the
search matcher, the interim terms, the interim route counterparty) in **one place in
`aa-prototype/src/domain/billing`** (`contracts.ts`, plus the seed), behind types the UI reads, so a
later design change stays a contained edit. Where this plan adds a field the design lacks (the
holder's kind and context link; the AA code, which the design omits and US-04.1.4 still requires), say
so in a doc comment beside the design's field names.

This is the largest master change in the plan. Behaviour changes to pricing and billing are for
Phases 19a to 25; this phase changes the shape and keeps the numbers.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `d4db277` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-04.1,US-04.1.1,US-04.1.2,US-04.1.4,US-04.1.5,US-04.1.6,US-04.2.1,US-04.2.2,US-04.2.10,US-04.2.14,US-04.3.2,US-04.3.3,US-05.2.5,US-05.2.6,US-05.4.3,US-05.5.1,US-11.2.2,US-11.4.1,OQ-25,OQ-48,OQ-66,OQ-67,OQ-78,OQ-91,OQ-98,OQ-100,OQ-104,OQ-105,OQ-107,OQ-114
   ```

   Read the hunks (if any) for the covered items, US-04.1.6 and US-04.2.10 (25's), US-04.2.14 (the
   anaesthetist's own Contract, 19a), US-04.3.2 and US-04.3.3 (the picker and No contract (RVG)
   first, 20), US-05.2.5, US-05.2.6, US-05.4.3 and US-05.5.1 (the terms this phase carries across),
   US-11.2.2 (the payer on the Booking, 21), US-11.4.1 (the insurer master), the questions, and the
   "Contract holder", "Contract" and "No contract (RVG)" parts of `requirements-board/requirements/domain-model.md`.

   At the 2026-10-20 plan update (`60e2d1e..d4db277`) the changes touching this phase were the v6
   rewrite (change log `requirements-board/requirements/changes/2026-10-16-requirements-update.md`):
   US-04.1.1 retitled, no kinds, settings only; US-04.1.5 with no party type and a practitioner link;
   US-04.2.1's context without procedure lines; US-04.2.10's staged versioning (25's); OQ-98, OQ-107,
   OQ-25, OQ-48 answered; OQ-105 and OQ-114 open.
   - If an item changed, re-read it and adjust the work items before building.
   - If an item is now Retired or Future, drop it from this phase and say so in PROGRESS.
   - A new item that touches the holder or Contract record goes into this phase only if it is
     shape-only. Lines are 19a's, the picker 20's, who is billed 21's, prices 24's, staged changes 25's.
2. **US-04.1.5 is Verify.** Build it as written (AR-29 `contract-holder-fields`) and note the status
   in PROGRESS. No UI label for Verify.
3. **OQ-105 and OQ-114 (D48, D55, open).** If still open, build the defaults in the Goal and put each
   on "For the owner's review"; no UI note (nothing on screen states them as fact). If answered
   differently, change the one place that reads it (OQ-105: how Doyle's holder is seeded and what a
   rooms holder links to; OQ-114: the pre-fill in the holder panel) and hand OQ-105's answer to 20.
4. **OQ-98, OQ-107, OQ-25, OQ-48, OQ-66, OQ-67, OQ-78, OQ-91 (answered).** Confirm they still read as
   built; none has a provisional label. If OQ-66 shows a code format, implement it in the same
   generator and update the pinned seed table.
5. **The design.** If a technical design newer than AR-29 v6 is in the artifacts folder, follow its
   shape inside the same one module and record the change in PROGRESS. AR-28 is true as written.
6. **Read the PROGRESS entries of Phases 15b, 16 and 17.** From 17: the rooms and surgeon-group
   entities it built (type names, master keys, `SG-COS` "Canterbury Orthopaedic Surgeons" and its
   member surgeons, Doyle's room, id prefixes), whether `ContractHolderOrganisation` /
   `masters.organisations` still exist (17 left them for this phase), and any copy that calls an
   organisation a contract holder. From 16 and 15b: the `PERSIST_VERSION` you start from.
7. **Capture the parity baseline before any model change** (work item 1), before any edit to
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
[US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (the anaesthetist's own
Contracts, Phase 19a);
[US-04.1.6](../../../../requirements-board/requirements/stories/US-04.1.6.md) and
[US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) (staged changes and the
relink, Phase 25; this phase builds the simple core);
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) and
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (the picker and No
contract (RVG) first, Phase 20, which wraps this phase's search matcher);
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) (the payer on the
Booking, Phase 21);
[US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) (the insurer master:
insurer-held Contracts, no auto-created default);
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) and
[US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md) (fixed rate and fixed
discount, carried as interim terms); OQ-25, OQ-48, OQ-66, OQ-67, OQ-78, OQ-91, OQ-98, OQ-105, OQ-107, OQ-114.
Evidence (read the cited passages with `npm --prefix requirements-board run source -- --item <ID> --text`,
Node 22.18 or newer; each covered item's own sources list the passages): the 2026-10-07 and
2026-10-14 notes of the AA meetings with Greg (AA in the centre, everyone else a contract holder; the
billable party a reference; "first party" and "third party" dropped; the surgeon fixed-price "lookup
hole"), the 2026-10-16 pricing model documents v6 (#22 to #25 holders, Contract and behaviour, #40 to
#47 versions) and the 2026-10-19 typed decisions (OQ-107, prepaid keeps its price).

**Artifacts** (draft reference shape; regions named where this phase builds them):
- [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md), the plain-language summary
  (v6), true as written: `#typical-arrangements`, `#no-contract-rvg`, `#price-reviews-and-controls`,
  `#who-gets-the-invoice` (stored here, acted on by 21).
- [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md), the technical design v6, a
  proposal: `#contract-holder-fields`, `#contract-fields`, `#contract-behaviour`, `#contract-versions`,
  `#integrity-rules`; `#billable-party` and `#contract-selection` for context only (21 and 20).
- [AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md), the ERD (v6): `#contract-holder`,
  `#contract`.

**Analysis:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Theme 3 (Contract replaces the billing route) and the EP-04
  table.
- [epics/EP-04.md](../epics/EP-04.md) and [epics/EP-05.md](../epics/EP-05.md).
- `gaps.json`: the entries for FT-04.1, US-04.1.1, US-04.1.2, US-04.1.4, US-04.1.5, US-04.2.1
  (re-graded at `d4db277`), and US-05.2.6, FT-05.5, US-05.5.1 (Matches, carried across).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-48, DM-07, DM-49 (DM-09 for
  19a's context).
- [analysis/reverse-check.md](../analysis/reverse-check.md) RV-06, RV-32 and RV-37.
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
  `createContract`, `editContract` (dates in place go), `deleteContract` (goes, replaced by a retire),
  `addContractPrice`, `editContractPrice`.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital` (about line 45) and
  `setInsurerDirectClaims` (about line 102) mint the protected default.
- `aa-prototype/src/store/mutate.ts`: the id specs `contract: { prefix: 'CTN', pad: 3 }` and
  `contractPrice: { prefix: 'CPN', pad: 3 }` (about lines 73 and 76).
- `aa-prototype/src/store/selectors.ts`: the billing context (`contractPrices`), `counterpartyName`
  (the `organisation` case).
- `aa-prototype/src/store/index.ts`: the contract action exports.
- `aa-prototype/src/store/appStore.ts`: `PERSIST_VERSION` (16 at `60e2d1e`; 15b to 17 may bump it).
- `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx` (about line 82):
  `editContract(..., { effectiveToISO: undefined })` restores a dated-out Contract; it goes (work
  item 13).
- `aa-prototype/src/shared/demoTriggers/registry.ts` (about line 198): Phase 14's "Trigger billing
  failure" dates out `CONTRACT.cosAcc` to 2026-07-15; it is re-based (work item 13).
- `aa-prototype/src/apps/admin/screens/masters/ReferenceViews.tsx`: `ContractsView` (about lines 49 to 89; columns Name,
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
   `contract-fields` and `integrity-rules`, and say the shapes are a proposal kept behind
   `domain/billing/contracts.ts`).
   - `ContractHolderId` (seed `CH-...`, allocated `CHN-nnn`).
   - `ContractHolder` (DM-48, US-04.1.5):
     - `id`, `name` (for example "Southern Cross", "Canterbury Orthopaedic Surgeons", "Dr Melanie
       Souter, own price list");
     - `kind: 'insurer' | 'hospital' | 'surgeonOrRooms' | 'anaesthetist' | 'aa'` (`'aa'` is the one
       system holder of No contract (RVG); it is never offered in the Add holder picker) and its
       context link: `insurerId`, `hospitalId`, `surgeonRoomId` or `surgeonGroupId` (Phase 17's ids).
       The design has no kind or context link; the catalogue's narrowing (US-04.2.1: the List's
       hospital, the surgeon or rooms) needs one, so it is ours, stored here and read by Phase 20. A
       rooms holder links to a room or a group when one exists (Aria has neither; log it); the surgeons
       it covers are that room's or group's surgeons (D48), with no new field;
     - `billed: boolean` (the design's "is the billable party": true when AA invoices the holder);
     - `billablePartyRef?: CounterpartyRef`: the holder's billable-party record (the design's link). The
       prototype has no single billable-party table, so it is today's counterparty reference into
       hospitals, insurers, organisations, surgeons or billable parties;
     - `practitioner?: { kind: 'anaesthetist' | 'surgeon'; id }`: the one person its Contracts belong
       to, so they are offered only on that person's Bookings (the design's optional practitioner);
     - `retiredAtISO?`.
     Integrity (AR-29 `integrity-rules`, US-04.1.5 AC): `billed` requires `billablePartyRef`; an
     `anaesthetist` holder has an anaesthetist `practitioner`; a holder of kind insurer, hospital or
     surgeonOrRooms has its link where it has one in the master (a rooms holder may have none); the
     `aa` holder is never billed. **No rule ties billing to the kind** (Greg's "a hospital is always
     billed, an anaesthetist never" is not kept; US-04.1.5 Notes): an anaesthetist holder may be set
     billed.
   - `Contract` (DM-07):
     - `id`, `aaCode`, `name`, `holderId: ContractHolderId` (always set; No contract (RVG) holds the
       `aa` holder);
     - **settings:** `isDefault` (exactly one true: No contract (RVG), found by this flag, never by its
       name), `editable: boolean` (D50: may the anaesthetist change its price, rate or discount;
       stored and shown, read by 24), `prepaid: boolean` (D64: stored and shown, read by 27);
     - `effectiveFromISO`, `effectiveToISO?` (the design's valid-from and valid-to; keep the code
       names, labelled "Valid from" and "Valid to" in the UI; absent means open-ended),
       `reviewDateISO?` (optional in the type only because No contract (RVG) has none; every holder's
       Contract has one, US-04.1.2 AC 3), `nextVersionId?: ContractId` (the forward link to the version
       that revised it; the previous version is found by the chain, not stored), `retiredAtISO?`;
     - **interim terms**, kept exactly as today until Phase 19a moves them onto lines:
       `interimTerms: 'rvg' | 'rateOrDiscount' | 'fixedPrices'` (today's `type` 1, 2 and 3, renamed so
       nothing reads it as a kind), `type2Detail?` (unchanged: an agreed unit rate is US-05.2.6's fixed
       rate, a percent discount is US-05.4.3's fixed discount) and `permitsIndividualArrangement` (the
       Method 3 gate, unchanged until Phase 24). A Contract with `'rvg'` terms and no rows is a
       Contract with no lines (D32).
     - Remove `type`, `holderType`, `holderId` (the old pair) and `scope`. `ContractScope` and
       `ContractHolderType` go: every seeded scope is organisational, and the individual-anaesthetist
       scope is replaced by an anaesthetist holder's practitioner link.
   - `ContractPrice` is **unchanged** (interim; Phase 19a replaces it with the Contract line). Its rows
     belong to one version (`contractId` is the version's id).
   - `ContractHolderOrganisation` / `masters.organisations` stays as a billable-party and Xero-contact
     source behind a holder (COS); it is no longer a Contract holder type. Do **not** rename
     `CounterpartyKind`: it ripples into Xero contacts, invoices and history.
3. **Pure Contract helpers** (`domain/billing/contracts.ts`, the one module; Vitest in
   `contracts.test.ts`). Nothing in the apps re-implements any of these.
   - **Holder rules:** `validateHolder(holder)` returns the integrity failures above as data (the
     store refuses on them); `holderKindLabel` lives in the UI labels module (work item 14), not here.
     `holderBilledDefault(kind, insurer?)` returns the pre-fill for a new holder: an insurer's
     `acceptsDirectClaims`, else false (D55: the flag does nothing else).
   - **No contract (RVG):** `noContractOf(contracts)` returns the one `isDefault` Contract and throws
     in tests if there is not exactly one (`assertOneNoContract`); `isNoContract(c)`.
   - **Versions** (AR-29 `contract-versions`): `versionChain(contracts, id)` (linked through
     `nextVersionId`, oldest first), `latestVersion`, `versionInForce(contracts, id, dateISO)` and
     `versionTimeline(chain, todayISO)` giving `{ current?, upcoming[], ended[] }` for "Current",
     "Upcoming from <date>" and "Ended <date>". `isEffectiveOn` is unchanged. Tests: the 1 April /
     1 July pair (a procedure on 15 June prices on the 1 April version), no overlap, a version entered
     ahead, an ended middle version.
   - **New version plan:** `planNewVersion(chain, { effectiveFromISO }, todayISO)` returns the new
     version's dates and the previous version's new end (the day before), or a refusal: a start
     **before today** (nothing is backdated), a start not after the latest version's start, a
     predecessor that is not the latest version. Today or later is allowed. The one-future check,
     staged submit and relink are 25's.
   - **Started versions are frozen:** `termsLocked(version, todayISO)` is true once the start is on or
     before demo-clock today; the store refuses a change to its terms and settings (interim terms,
     `type2Detail`, `permitsIndividualArrangement`, `editable`, `prepaid`, its `ContractPrice` rows)
     with one single-sourced message pointing at New version.
   - **AA code** (US-04.1.4, D16): `nextAaCode(prefix, existingCodes)` is the **only** place a code is
     made: `<prefix>-<nnnn>`, the next free number over every Contract that exists (nothing is ever
     deleted, so no code is reused and no issued-codes list is kept). `aaCodePrefixFor(holder)`: `INS`
     insurer, `HOS` hospital, `SUR` surgeon or rooms, `OWN` anaesthetist, `RVG` No contract (RVG). All
     versions of a Contract share its code (logged for the owner); it is stamped at creation, never
     edited, and distinct from the system id. Tests: deterministic, unique across prefixes, shared by
     a chain, the seeded codes pinned.
   - **Composite search** (US-04.1.4): `contractMatchesQuery(contract, holderName, query)` returns the
     matched fields or undefined, matching case- and space-insensitively the AA code, Contract name
     and holder name; `contractSearch(query, { contracts, holders })` runs it across the latest
     version of every chain (an empty query returns everything). 19a adds line holder codes to the
     matcher; 20's picker wraps it. Tests: an AA code, a partial name, a holder name, no match.
   - **Catalogue filters:** `isActiveContract(chain, todayISO)` (not retired, and a version current or
     upcoming) and `contractsOfHolder`.
   - **Interim pricing terms:** `interimTermsOf(contract)` is what `fee.ts` reads instead of `type`
     (work item 4). `permitsRateTime(contract)` = `contract.permitsIndividualArrangement`, the single
     source of the Method 3 gate that `validateBookingForBilling`, `billingLineActions` and
     `AddBillingLineSheet` read; `INDIVIDUAL_ARRANGEMENT_MESSAGE` stays single-sourced. Both go in
     Phases 19a and 24.
   - **Interim route counterparty:** `routeCounterpartyForHolder(holder)` returns the counterparty
     today's contract-holder route bills for that holder: its `billablePartyRef` when set, otherwise
     undefined. It reads **neither `billed` nor the payer**: who is billed is unchanged until Phase 21,
     which replaces this function with the holder or the payer on the Booking. (Doyle's rooms holder
     is seeded not billed but keeps a `billablePartyRef` of Doyle only so the route still bills him;
     21 clears it.) Test that COS yields exactly `{ kind: 'organisation', id: ORG.cos }` and Doyle
     `{ kind: 'surgeon', id: SURG.doyle }`.
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
     version.
   - `invoiceBuild.ts` `resolveContractForProcedure`:
     - stored Contract: the version in force on the List date (`versionInForce`); a successor version
       takes over instead of a fallback;
     - stored, but no version in force, and the holder is a hospital or an insurer: **No contract
       (RVG)** (same price as the old default Type 1), with the counterparty kept as the stored
       holder's route counterparty (an interim `billedAs` on the resolution, removed by Phase 21);
     - stored, no version in force, any other holder (surgeon or rooms, anaesthetist): the
       `contractIneffective` exception, as today (Phase 08 decision 1; work item 13's failure demo
       relies on it);
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
     'rvg'`, `editable: true`); add `mkHolder` and `mkNoContract`.
5. **Seed** (`domain/seed/contracts.ts`, `seed/cast.ts`, `seed/index.ts`, `seed/bookings.ts`). Keep
   every existing Contract id, so no seeded `governingContractId` moves.
   - **Holders** (`CONTRACT_HOLDERS`, `masters.contractHolders`), eleven:
     - `CH-AA` "Anaesthesia Associates": kind `aa`, not billed, the holder of No contract (RVG);
     - `CH-STG` St George's, `CH-SX` Southern Cross, `CH-FORTE` Forte Health, `CH-CES` Christchurch
       Eye Surgery, `CH-CPH` Christchurch Public: hospital, billed, billable party the hospital;
     - `CH-NIB` nib: insurer, billed (its direct-claims flag, D55), billable party the insurer;
     - `CH-DOYLE` Mr P. Doyle: **a rooms holder over Doyle's own room as Phase 17 seeded it** (D48; read
       its id and name from the seed, and if Doyle has none link nothing and log it as for Aria),
       **not billed** (a surgeon's fixed fee only sets the price, US-04.2.1). It keeps a
       `billablePartyRef` of Doyle only for the interim route; a Phase 21 handoff;
     - `CH-COS` Canterbury Orthopaedic Surgeons: surgeonOrRooms, `surgeonGroupId: SG-COS` (Phase 17),
       billed, billable party `{ kind: 'organisation', id: ORG.cos }` (same counterparty and Xero
       contact);
     - `CH-ARIA` Aria Skin and Laser Clinic: surgeonOrRooms, no room or group, billed, billable party
       `{ kind: 'billableParty', id: BP.ariaClinic }`;
     - `CH-SOUTER` "Dr Melanie Souter, own price list": anaesthetist, `practitioner` Souter, not billed,
       **no Contract yet** (19a gives it her fixed-price Contract, US-04.2.14, flagged prepaid where
       wanted; Phases 26 and 27 use it for the prepaid demo).
   - **No contract (RVG)** (new, `CT-NO-CONTRACT`): "No contract (RVG)", holder `CH-AA`, `isDefault`,
     `interimTerms: 'rvg'`, `editable: true`, `prepaid: false`, from 2020-01-01, no end, no review date
     (the one Contract without one). It governs no seeded procedure; the resolver's fallback reaches it.
   - **The six ex-defaults become plain RVG Contracts** (an ordinary Contract with no lines, D32), same
     ids, `isDefault` false, `interimTerms: 'rvg'`, `editable: true`, `prepaid: false`, holder billed
     through their holder: `CT-STG-D1` "St George's RVG", `CT-SX-D1` "Southern Cross RVG",
     `CT-FORTE-D1` "Forte Health RVG", `CT-CES-D1` "Christchurch Eye Surgery RVG", `CT-CPH-D1`
     "Christchurch Public RVG", `CT-NIB-D1` "nib RVG". The procedures that store them keep their price
     (the anaesthetist's unit value) and counterparty. Rename the seed constants (`stgDefault` and so on
     to `stgRvg`) and `DEFAULT_CONTRACT_BY_HOSPITAL` in `seed/bookings.ts` to
     `PLAIN_RVG_CONTRACT_BY_HOSPITAL`; delete `defaultType1`.
   - **Negotiated Contracts**, names without "(Type n)", terms unchanged, `editable: false`,
     `prepaid: false` (D50's reading: a negotiated price is not the anaesthetist's to change; nothing
     acts until 24; logged for the owner):
     - `CT-SXAP` "Southern Cross Affiliated Provider": holder `CH-SX`, `rateOrDiscount`, $26.50 per
       unit, from 2024-07-01 (Decisions log 2026-07-23 kept), review 2027-04-01;
     - `CT-HNZ` "Health NZ agreed rate": holder `CH-CPH`, $23, from 2023-07-01, review 2026-07-01, so
       "Review due" shows on day one;
     - `CT-STG-ACC` "ACC elective services via St George's": holder `CH-STG`, $25, review 2027-04-01;
     - `CT-COS-ACC` "ACC orthopaedic services, Canterbury Orthopaedic Surgeons": holder `CH-COS`, $24,
       review 2027-04-01;
     - `CT-COS-ACC-OLD` (new) "ACC orthopaedic services, 2024 schedule": holder `CH-COS`, $24, from
       2024-04-01, **valid to 2025-03-31**, retired. It governs no seeded procedure; work item 13's
       failure demo points one Procedure at it, and it shows what Retire leaves under "All";
     - `CT-DOYLE-BAR` "Bariatric fixed prices, Mr P. Doyle": holder `CH-DOYLE`, `fixedPrices`, from
       2025-01-01, **valid to 2026-07-27**, `nextVersionId: CT-DOYLE-BAR-2`, rows `CP-BAR-1` to
       `CP-BAR-3` unchanged ($2,800, $2,400, ordinal-2 $950; `billingRun.test.ts` names `CP-BAR-1`);
     - **new version** `CT-DOYLE-BAR-2`: same name and AA code, from **2026-07-28**, rows `CP-BAR-4` to
       `CP-BAR-6` copied with the gastric bypass at **$2,950**: the demo's "Upcoming" version ("+7
       days" or "Procedure day · 28 Jul" makes it current). No seeded Doyle procedure is on or after 28
       Jul; the parity test proves it;
     - `CT-ARIA-HOURLY` "Aria Skin and Laser Clinic, individually arranged hourly rate": holder
       `CH-ARIA`, `rateOrDiscount` $26.50 and `permitsIndividualArrangement` as today.
   - **AA codes:** stamped by `nextAaCode` in `CONTRACTS` order, so the seed is deterministic; versions
     share their chain's code. The expected table, pinned in `seed.test.ts` (with a uniqueness
     assertion across chains): `CT-NO-CONTRACT` `RVG-0001`; `CT-STG-D1`, `CT-SX-D1`, `CT-FORTE-D1`,
     `CT-CES-D1`, `CT-CPH-D1`: `HOS-0001` to `HOS-0005`; `CT-NIB-D1` `INS-0001`; `CT-SXAP` `HOS-0006`;
     `CT-HNZ` `HOS-0007`; `CT-STG-ACC` `HOS-0008`; `CT-DOYLE-BAR` and `CT-DOYLE-BAR-2` `SUR-0001`;
     `CT-COS-ACC` `SUR-0002`; `CT-ARIA-HOURLY` `SUR-0003`; `CT-COS-ACC-OLD` `SUR-0004`.
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
     `contractHolder.create`, `.update`, `.retire`). They refuse every `validateHolder` failure ("A
     holder that is billed needs a billable party"); changing the kind or practitioner of a holder
     that holds Contracts; any change to or retire of the `aa` holder; and retiring a holder that
     still holds an active Contract (retire the Contracts first).
   - `createContract`: the input carries `holderId` (required, not retired), name, valid-from,
     valid-to, review date (**required**: refused without one, US-04.1.2 AC 3), the settings
     (`editable`, `prepaid`) and the interim terms, and **no** AA code: the store stamps `aaCode` from
     `nextAaCode(aaCodePrefixFor(holder))`. A first version starting before today is **refused**
     (nothing is backdated). It refuses `isDefault` (only the seed has No contract (RVG)), a
     `rateOrDiscount` Contract without `type2Detail`, and an anaesthetist holder's Contract with rate
     x time permitted.
   - `editContract`: name and review date are editable on any version. **Dates are not edited in
     place** (RV-32): `effectiveFromISO` and `effectiveToISO` leave the patch type, and a raw patch
     carrying them, `aaCode`, `holderId`, `isDefault` or `nextVersionId` is refused. The terms and
     settings are refused once `termsLocked` (work item 3). Dates move only through New version and
     Retire.
   - `createContractVersion(api, actor, contractId, { effectiveFromISO, reviewDateISO })` (new, the
     review date required as on create, audited `contract.newVersion`): applies `planNewVersion`
     (refusing a past start), copies name, AA code, holder, settings, interim terms and the
     `ContractPrice` rows (new `CPN` ids) to a new `CTN` version, sets the previous version's
     `nextVersionId` and ends it the day before. The new version's terms stay editable until it starts.
   - `retireContract(api, actor, contractId, { effectiveToISO? })` (new, audited `contract.retire`,
     **replacing `deleteContract`**): stamps `retiredAtISO` on every version of the chain and ends the
     latest version on the given date or, by default, today, **never before today** (refused
     otherwise); its Outcome reports how many unbilled procedures still reference the chain, so the UI
     can warn. The retired Contract keeps its AA code. **`deleteContract` is removed**, with its
     "never used" guard, its tests and the Delete button.
   - **No contract (RVG)** refuses every edit, retire and new version, with one message: "No contract
     (RVG) is always available and cannot be changed." `isProtectedDefault` and
     `DEFAULT_PROTECTED_MESSAGE` go.
   - `addContractPrice` and `editContractPrice` refuse a version whose terms are locked.
   - `mastersActions.ts`: `createHospital` and `setInsurerDirectClaims` **no longer mint a Contract**
     (RV-06, US-11.4.1's wrong behaviour). `createHospital`'s Outcome loses `defaultContract`; the
     insurer flag still gates today's insurer route and pre-fills a new insurer holder (D55).
   - Export every new action from `store/index.ts`; remove `deleteContract`'s export.
   - Tests (`contractActions.test.ts`, new; `mastersActions.test.ts` re-expressed): holder integrity
     refusals, AA code stamping and prefixes and immutability, a version chain with the day-before end,
     the overlap and past-start refusals, dates not editable in place, locked terms and settings on a
     started version, retire (today or later, never past; the unbilled count), No contract (RVG)
     refusals, and that adding a hospital or flipping an insurer creates no Contract.
   - **Existing tests that the new rules refuse** are re-expressed, never by loosening a rule:
     `billingRun.test.ts`'s "snapshot immunity" case (about line 367) edits `CP-BAR-1` and ends
     `CT-DOYLE-BAR`, both now refused, so it proves immunity through a New version on a billed Contract
     plus an edit to the upcoming version's rows; `mastersActions.test.ts`'s "adds and edits a Type 3
     price row" (about line 300) targets the upcoming `CT-DOYLE-BAR-2` and gains the refusal on
     `CT-DOYLE-BAR`; its re-type case, the protected-default cases (about lines 244 to 276, and
     `billingRun.test.ts` about line 451) and every `deleteContract` case go; the Health NZ end-date
     case (`billingRun.test.ts` about line 320) cannot end Health NZ in the past, so it runs on a
     `mkContract` hospital-held Contract whose only version starts after the List date, with the same
     figures ($23 against the $28.50 fallback, No contract (RVG) at the same counterparty);
     `billingRetry.test.ts` moves to the failure demo of work item 13, whose trigger and store part
     is done now so session 1 ends green (the monitor screen is session 2).
7. **Re-green session 1.** `npx vitest run` with the parity fixture matching unchanged, `npm run build`
   and `npm run build:pwa`. Stop here if this is the end of session 1, leaving PROGRESS as IN
   PROGRESS with what remains.
8. **Admin: Contract holders** (`apps/admin/screens/masters/MasterData.tsx`, a new "Contract holders" tab
   before "Contracts"; a new `apps/admin/flows/ContractHolderPanel.tsx`; covers US-04.1.5).
   - Table: Name; Kind ("Insurer", "Hospital", "Surgeon or rooms", "Anaesthetist"); Invoiced ("Holder:
     <billable party name>" when the holder is billed, "Payer on the Booking" when not); Belongs to
     (the practitioner, when linked); Contracts (count of active Contracts, a link that opens the
     Contracts tab filtered to this holder); Status ("Retired" neutral pill). The `aa` holder shows as
     "Anaesthesia Associates", read-only, with no actions.
   - "Add holder" and a row "Edit" open the wide panel: name; kind and its link (a picker over the
     matching master: insurers, hospitals, Phase 17's rooms and groups, or surgeons or anaesthetists
     for a practitioner link); **"Holder is billed"** with its billable-party picker shown and
     required when on, **pre-filled from the insurer's direct-claims flag when an insurer is chosen
     and editable** (D55), and nothing else turned on or off by the kind; Save (teal); "Retire
     holder" (error treatment, refused with the store's message while it holds an active Contract).
     Hooks: `data-shot="contract-holders"` on the table, `data-shot="holder-panel"`.
9. **Admin: Contract catalogue rebuilt** (`ContractsView`; covers FT-04.1, US-04.1.1, US-04.1.2,
   US-04.1.4).
   - **Search** above the list: one field, "Search by AA code, Contract or holder", driven by
     `contractSearch`, with a result count. `data-shot="contract-search"`.
   - **Filters** beside it: "Active" / "All" (segmented, Active by default) and a holder filter (a
     searchable select over holders, "All holders" by default). Search and filters combine.
   - **Grouped by holder:** No contract (RVG) first under the AA heading, then one heading per holder
     (name, kind and the Invoiced text), its Contracts beneath. One row per Contract (the chain), not
     per version. A holder with no Contract still shows its heading with "No Contracts yet" (the
     Souter holder until Phase 19a).
   - Columns: AA code (mono), Name, Terms ("RVG at the anaesthetist's rate", "Fixed rate $26.50 per
     unit", "Fixed discount 10%", "Fixed prices · 3", "Rate x time permitted" as a second tag; labels
     from the UI labels module), Settings (small tags "Price editable" and "Prepaid" where set),
     Valid from, Valid to, Review, Status. Status pills: "Current", "Upcoming from <date>" (neutral)
     when a later version is entered ahead, "Ended", "Retired" (neutral), "Review due" (the
     `semantic.warning` tint). `src/theme` has no info colour, so do not invent one.
   - The header copy loses "default Type 1": "No contract (RVG) is always offered first and cannot be
     changed." There is no provisional note.
   - "New contract" (teal) opens the detail panel. `data-shot="contract-catalogue"`.
10. **Contract detail** (`apps/admin/flows/ContractEditSheet.tsx`, rebuilt as a wide desktop panel with
    sections; covers US-04.1.1, US-04.1.2, US-04.1.4, US-04.2.1).
    - **Header:** the AA code in mono beside the name, read-only, "Assigned on save" on a new
      Contract; the version's status pill.
    - **Holder:** a holder picker ("Contract holder", searchable over non-retired holders) on a new
      Contract; read-only afterwards, with the holder's kind, Invoiced text and practitioner (who the
      holder setting says is invoiced; a plain helper line says the holder decides who is invoiced).
      No contract (RVG) shows "Held by Anaesthesia Associates · offered for every procedure".
    - **Settings** (`data-shot="contract-settings"`): "Anaesthetist can change price, rate or discount"
      (`editable`), "Prepaid" (`prepaid`), each a switch with a one-line helper, and read-only lines
      for "Who is invoiced" and "Belongs to" from the holder. They are version settings: read-only
      once `termsLocked`, with the same New version hint.
    - **Terms (interim):** a choice of "RVG at the anaesthetist's rate" (no lines), "Fixed rate or
      discount" (agreed unit rate or percent discount, today's Type 2 inputs) and "Fixed prices"
      (today's `PriceRows`, keeping the hook `contract-price-rows`), plus "Rate x time permitted".
      Read-only with "This version has started. Use New version to change its terms." once
      `termsLocked`.
    - **Dates:** valid from, valid to and review date shown; only the review date is editable. A new
      Contract's valid-from cannot be before today.
    - **Versions:** the chain newest first, each with its dates and pill ("Upcoming from 28 Jul 2026",
      "Current", "Ended 27 Jul 2026"), selectable to view that version; **"New version"** (teal
      secondary) asks for the start date (today or later; a past date is refused with the store's
      message) and the review date (with "The current version will end the day before" shown live)
      and opens the new version with its terms ready to change. `data-shot="contract-versions"`.
    - **Actions:** Save (teal primary); "Retire contract" (confirm with the unbilled-reference count
      and the end date, today or later; error treatment, not crimson). **No Delete.** No contract (RVG)
      shows its fixed notice and no actions.
    - Hooks: `data-shot="contract-detail"`.
11. **Office billing setup** (`shared/flows/EditBillingSetupSheet.tsx`, `shared/booking/OfficeBillingSetup.tsx`).
    - The governing-contract select lists No contract (RVG) first, then one option per active chain
      under holder `optgroup`s, each labelled "<AA code> · <name>", no "(Type n)". A retired Contract
      shows only if already selected, as "(retired)". It still lists every holder's Contracts:
      narrowing by the Booking's context is Phase 20. It stores the chain's id; pricing takes the
      version in force through `contractForPricing`.
    - The read view names the Contract as "<AA code> · <name>" and the version's dates.
    - Mobile and web need no new control; their fee breakdowns are unchanged in value.
12. **ACC review flag** (RV-37): delete flag (c) "ACC should not bill the patient directly" from
    `apps/admin/reviewFlags.ts` and its test case. ACC stays an ordinary holder's Contract; the
    informational ACC chip on mobile Balances, the ACC column on web Accounts and `accRelated` stay
    (RV-37: "keep the chips"), as does the ACC pre-op flat-fee help text.
13. **The billing-failure demo without backdating** (RV-32; built default, logged for the owner;
    Phase 25 re-bases it again). Phase 14's "Trigger billing failure" ends `CT-COS-ACC` on 2026-07-15
    and the Billing monitor's "Resolve & retry" clears that end date: both are refused now (no
    backdating, no in-place date edits).
    - **The trigger:** on `SEED_LIST_IDS.billingFailure` (Ropata Thu 16 Jul), submit if ACTIVE, then, as
      `OFFICE_ACTOR`, point Losa Tuilagi's Procedure at `CT-COS-ACC-OLD` through the ordinary office
      governing-Contract action (a Contract no version of which covers 16 Jul), then `authoriseList`.
      The rooms holder has no fallback, so her Booking fails with `contractIneffective` while Hemi
      Walker's sibling invoices, exactly as before. Disabled "Already triggered" once the List is billed.
      Update its description; the label and place are unchanged. No new button.
    - **The monitor:** for a `contractIneffective` or `contractMissing` failure, "Resolve & retry" no
      longer edits a Contract: it opens the Booking's office billing setup so the office **chooses a
      Contract** (here `CT-COS-ACC`), then retries the case. Check the governing-Contract edit is
      allowed on an authorised List's unbilled, failed Booking; if the lifecycle guard refuses it, add
      that one narrow allowance to the failed-case path and test it. A handoff fault keeps its plain
      retry.
    - **Tests:** re-express `billingRetry.test.ts` and the `demoTriggers` test on this path (COS fails,
      the sibling invoices, choose `CT-COS-ACC`, retry bills COS as the same organisation counterparty).
14. **Copy, labels and tests sweep.**
    - `src/shared/contracts/labels.ts` (new; imports nothing admin-only, so the PWA purity test holds):
      `HOLDER_KIND_LABEL`, `INTERIM_TERMS_LABEL`, `SETTING_LABEL`, `invoicedLabel(holder)` and
      `versionStatusLabel`. One home for every app. There is **no provisional-notes module**: every
      reading this phase builds is either answered or (D48, D55) invisible on screen.
    - `shared/audit/fieldLabels.ts`: labels for AA code, holder, holder is billed, billable party,
      practitioner, valid from and to, review date, next version, retired, price editable, prepaid,
      interim terms. Remove the Type, holder type and scope fields.
    - `shared/audit/auditNarrative.ts`: replace the `ContractScope` and `ContractType2Detail` branches
      with narration for holders ("Held by Southern Cross", "Invoices the payer on the Booking"),
      versions ("New version from 1 Aug 2026; the previous version ends 31 Jul 2026"), retire and terms,
      so a History entry never shows raw JSON; a Contract's entries name it by AA code and name.
    - `MasterData.tsx`: the Hospitals header and add-hospital result lose "default Type 1" ("Added
      Ashburton Surgical."); the Insurers header says the flag marks insurers that accept direct
      claims and pre-fills a new insurer holder, with no Contract created.
    - Grep `aa-prototype/src` for "Type 1", "Type 2", "Type 3", "default Type 1", "protected default",
      "first party", "third party" and "standard units" in rendered strings and fix them; comments that
      describe history may stay.
    - `DemoControlPanel.tsx` and `DemoData.tsx` scenario text: new Contract names, no "Type n", S4
      Beat 3's new cause and S5 Beat 4's new-version beat.
    - `visual/admin-phase07.spec.ts`: update the "default Type 1" assertions and its screenshot. Add
      Playwright shots for the holder master, the catalogue grouped by holder, a search, the settings,
      and the Doyle detail with "Upcoming from 28 Jul 2026".
    - No en or em dashes in any new copy; no build-phase references in app copy.

## Demo triggers

This phase adds **no new button**. The new version is a product action, the Upcoming version flips
with the existing demo clock (harness bar, and the PWA's More-tab clock), and "Trigger billing
failure" is re-based without changing its label or place.

| Trigger | Screen | Effect |
|---|---|---|
| "New version" (product) | Admin, Master data, Contracts, "Health NZ agreed rate" | A new version from the chosen date, today or later (for example 1 Aug 2026, rate $24.00); the current version ends the day before and both show under the Christchurch Public holder, the new one "Upcoming from 1 Aug 2026". A past date is refused |
| Existing clock "+7 days" or "Procedure day · 28 Jul" | Admin, Master data, Contracts, "Bariatric fixed prices, Mr P. Doyle" | The seeded second version flips from "Upcoming from 28 Jul 2026" to "Current" (gastric bypass $2,950.00) and the first shows "Ended 27 Jul 2026". The Tue 14 Jul bariatric Booking still prices $2,800.00, because the procedure date picks the version |
| Insurer direct-claims flag (product) | Admin, Master data, Insurers | Flipping AIA Health to direct claims creates no Contract (no new button); "Add holder" for an insurer then pre-fills "Holder is billed" from the flag |
| "Trigger billing failure" (existing, re-based) | Admin, Billing monitor | Points Losa Tuilagi's Procedure at the 2024-schedule COS ACC Contract, then authorises Ropata Thu 16: her Booking fails, Walker's sibling bills; "Resolve & retry" asks the office to choose a Contract |

- **PWA equivalent:** none needed. The effect is on the Admin Contract catalogue and Billing monitor,
  and the PWA has no Admin; the mobile fee breakdown is unchanged in value.
- **Phase 15a's shared "Raise sample warnings":** no change. This phase registers no warning rule.

## Out of scope

Do not add fields for these here (convention 15):

- RVG groups and the RVG code type-ahead: 19.
- Contract lines (fixed price, fixed rate, fixed discount, base and modifier units, holder code and
  description) replacing the interim terms and `ContractPrice`, the line-copy on a new version, the
  holder codes in the search, the anaesthetists' own fixed-price Contracts (the seeded Souter
  holder's Contract, flagged prepaid where wanted), and the resolver's line, procedure and group
  layers: 19a.
- The fitting Contract list (No contract (RVG) first, holder-fit candidates under holder headings,
  the practitioner rule, surgeons' rooms Contracts offered after the hospital's, the composite
  search inside it, a Contract with no lines offered by context), removing the route, the payment
  category and `Procedure.insurerId`: 20.
- Who is billed decided by the holder's "is billed" or the payer on the Booking, the payer itself,
  the insurance indication (OQ-93) and the guardian override's removal: 21. The interim `billedAs` and
  `routeCounterpartyForHolder` go there.
- Invoice layout, delivery and GST set on the Contract, and the Split action: 22.
- The multi-procedure rule and combination Contracts: 23.
- The price precedence, the editable flag acting on the anaesthetist's price changes and the Method 3
  gate's removal: 24.
- Staged changes, the review dashboard, one future version at a time, correcting or withdrawing a
  future version, relinking un-invoiced Procedures by line key, the prepaid exception (OQ-104), the
  pricing snapshot and versions listed with their invoices: 25. The schedule upload (OQ-100): not built.
- Prepayment started from the prepaid setting: 27.
- Spreadsheet loads of holders, Contracts and lines, and the organisations master's fate: 42.
- Insurer and funding-source scope, the category table, required booking inputs and default RVG
  Contracts per procedure: dropped by the catalogue, never built.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Contract holders: the eleven seeded holders show kind and Invoiced text (Doyle's rooms and the
      Souter holder "Payer on the Booking"; COS "Holder: Canterbury Orthopaedic Surgeons";
      Anaesthesia Associates read-only). A billed hospital holder with no billable party is refused. A
      new insurer holder for a direct-claims insurer arrives billed and can be turned off; linking a
      holder to an anaesthetist forces nothing. Retiring Southern Cross is refused while it holds
      active Contracts.
- [ ] Contracts: No contract (RVG) first under Anaesthesia Associates, then holder headings; every row
      has a mono AA code (matching the seed test) and none shows "Type n", "first party" or
      "default". "Active" hides ended and retired Contracts and "All" shows them (the 2024-schedule COS
      ACC only there); the holder filter narrows; Health NZ shows "Review due".
- [ ] Settings: a plain RVG Contract shows "Price editable", SXAP does not; the detail's switches are
      read-only on a started version with the New version hint and editable on a new Contract. No
      price control on any booking screen changes.
- [ ] Search: `SUR-0001` finds the Doyle Contract, "affiliated" SXAP, "Canterbury" the COS Contracts; no
      match shows an empty state; search combines with both filters.
- [ ] New contract: the header reads "Assigned on save"; no review date, or a valid-from before today,
      is refused; after save it shows the next AA code for the holder's prefix; code, holder and dates
      cannot be edited. There is no Delete; Retire ends it today or later (a past date refused) and it
      stays under "All" with `contract.retire` in the audit. No contract (RVG) opens with its notice and
      no actions, and the store refuses an edit, retire or new version.
- [ ] Health NZ agreed rate: "New version" from 1 Aug 2026 at $24.00 ends the current version 31 Jul
      2026; the new one shows "Upcoming from 1 Aug 2026", both under Christchurch Public with one AA
      code; a start of 20 Jul 2026 is refused; the current terms are read-only. The Hemi Walker
      invoice (Dr Whitaker, Fri 17 Jul) is unchanged.
- [ ] Doyle bariatric, held by Doyle's rooms: "Upcoming from 28 Jul 2026" with the gastric bypass at
      $2,950.00. Harness clock "+7 days": the second version is Current, the first "Ended 27 Jul 2026".
      The Tue 14 Jul bariatric Booking still shows $2,800.00 and $950.00.
- [ ] Adding a hospital or flipping AIA Health to direct claims creates no Contract.
- [ ] Office billing setup: the governing-contract select lists No contract (RVG) first, then "<AA
      code> · <name>" under holder groups.
- [ ] Every seeded fee and counterparty is unchanged (the parity fixture matched): S3 figures, S5 Beat
      4's invoice, mobile (framed and PWA) and web Booking detail. The Aria rate x time line still adds
      on Souter's Mon 27 Booking, and a Contract without rate x time still refuses it with the
      single-sourced message.
- [ ] S4 Beat 3: Billing monitor, "Trigger billing failure" fails only Losa Tuilagi's COS Booking
      (pointed at the 2024-schedule Contract) while Hemi Walker's sibling invoices; "Resolve & retry"
      opens the billing setup, choosing "ACC orthopaedic services" and retrying bills COS as the same
      organisation counterparty. No Contract is edited or backdated.
- [ ] Admin Review shows no "ACC should not bill the patient directly" flag; the mobile Balances ACC
      chip and web Accounts ACC column remain.
- [ ] `npm run shots` green (Phase 07 spec updated, new shots captured); catalogue screenshots: the
      recipes below done, a full `npm run capture` with no failed recipe and no story without a recipe,
      shots checked by eye, `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` green, parity fixture matched.

## Demo guide updates

Patch these in the same session and mirror each in the same section of
`docs/demo-guide/master-demo-guide.html`:

- **`04-presenter-cheat-sheet.md`, "Contracts":** replace "Type 1: reference only... Type 2: agreed
  rate or discount... Type 3: fixed price" and "Every hospital and direct-billing insurer must have a
  protected default Type 1" with: every Contract belongs to a contract holder (an insurer, hospital,
  surgeon or rooms, or an anaesthetist's own price list); there are no Contract kinds, only settings
  (is the anaesthetist allowed to change the price, is it prepaid); the holder says whether it pays AA
  or the payer on the Booking does; No contract (RVG) is held by AA, the one default, always offered
  first; a Contract may have no lines; Contracts are dated version records, never backdated or
  deleted, and a price review is a new version from today or later, so old Bookings keep the old
  price; every Contract has AA's own short code, searchable with names and holders. Replace
  "Surgeon/group/organisation-held contracts do not have that guaranteed fallback" with "an ended
  Contract held by a surgeon's rooms has no fallback (the S4 billing-failure beat)". Add two tips:
  "show an upcoming version": open the Doyle Contract, then press "+7 days"; "find a Contract": type
  an AA code or holder name in the Contract search.
- **`03-demo-script.md`:**
  - **S5 Beat 4** ("contract effective-dating"): becomes "Contract versions". Click: Admin → Master
    data → Contracts → **Health NZ agreed rate** → **New version** from **1 Aug 2026**, review date
    **1 Apr 2027**, rate **$24.00**, Save; then open the **Hemi Walker** Health NZ invoice from Dr Whitaker's Fri 17 Jul List. Say: a
    price review is a new dated version, never backdated or deleted; the old one ends the day before,
    and work done before then keeps its price. Expected: both versions under the holder, the new one
    "Upcoming from 1 Aug 2026", the invoice unchanged. Optional aside: the Doyle "Upcoming" version and
    the Contract search. The S5 "Serves" line's "contract effective-dating" becomes "Contract versions".
  - **S4 Beat 3**: "a group-held contract with no default fallback was dated out" becomes "the Booking
    was pointed at an old ACC Contract held by a surgeon's rooms (Canterbury Orthopaedic Surgeons),
    which has no fallback and was not valid on the date"; "Resolve & retry" becomes "choose the right
    Contract and retry". Nothing is backdated.
  - **S3**: unchanged in figures; check its wording for "Type".
- **`01-personas-and-responsibilities.md`:** drop "ACC route warnings" from the office's review flags.
- **`02-workflows-and-handoffs.md`:** drop "ACC advisory flags"; "Selects the governing Contract and
  rating method" becomes "Selects the Contract".
- **Control Panel scenario text** (`DemoControlPanel.tsx`, `DemoData.tsx`) and the seed scenario
  markers: new Contract names, no "Type n", S4 Beat 3's cause, S5 Beat 4's New version.
- Not a milestone phase, but re-read `master-demo-guide.html` §S4 and §S5 after patching.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 18` first: earlier phases may have changed
these recipes since this plan was written. All covered shots are Admin (Master data); the mobile and
web apps get no new screen.

**Covered items.** When the phase is done, each recipe in `requirements-board/requirements/capture/recipes/`
matches what was built:

| Item | Recipe now | When this phase is done |
|---|---|---|
| [FT-04.1](../../../../requirements-board/requirements/stories/FT-04.1.md) Contract catalogue | captured · contracts | `partial`, reason "Contract lines are built in Phase 19a; staged changes in Phase 25." Re-shoot `contracts` on `[data-shot=contract-catalogue]`: No contract (RVG) first, Contracts under holder headings with the AA code and settings tags, the Active / All and holder filters. Add a `holders` shot of the Contract holders tab. Caption "Contract holders and their dated Contracts, filtered by active or all and by holder" |
| [US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md) Typical Contract arrangements | partial · contract-types | `partial`, reason "Pricing from lines is Phase 19a; the picker's holder grouping is Phase 20; the editable flag acts in Phase 24 and prepaid in Phase 27." Rename the shot `contract-settings` (the old name describes retired types) on the detail's `[data-shot=contract-settings]`: the switches for price editable and prepaid, and the holder's Invoiced and Belongs to lines, no type labels. Replace the stale caption with "Contracts are set up from settings, not kinds: who is invoiced, whether the anaesthetist can change the price, prepaid" |
| [US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) Create, edit, retire Contracts | partial · contracts, edit-contract | `captured`. Re-shoot `contracts` with Valid from, Valid to, Review and Status ("Review due" on Health NZ) and the Active / All filter highlighted; `edit-contract` opens "Health NZ agreed rate" (re-point the `tr:has-text(...) >> role=button[name="Edit"]` step to the new row or row click) on `[data-shot=contract-detail]` with the dates and actions highlighted. Add a `retire` state (the Retire confirm, with no Delete beside it). Drop the partial reason. Captions "Contracts with their valid from, valid to and review dates, filtered by active or all and by holder" and "A Contract's dates, versions, New version and Retire; nothing is deleted" |
| [US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md) Contract audit and versioning (Phase 25; under FT-04.1) | absent · no shots, reason "Contracts are edited in place; no version history is kept..." | That reason stops being true here. `partial`, reason "Each version is kept and can be viewed; the invoices raised under each version are listed beside it in Phase 25." One shot `versions` on Health NZ agreed rate's `[data-shot=contract-versions]` after a New version, caption "Every version of a Contract is kept and can be opened" |
| [US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) AA identifier for every Contract | absent · placeholder | `partial`, reason "Holder codes on Contract lines join the search in Phase 19a." Shots: `aa-code` (the catalogue's mono AA code column highlighted), a `search` state typing `SUR-0001` (finds the Doyle Contract) on `[data-shot=contract-search]`, and a new Contract's header showing "Assigned on save". Caption "Every Contract has AA's own short code, searchable with names and holders" |
| [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) Contract holders | none (create it) | Create the recipe, `partial`, reason "A holder's practitioner link narrows the Contract list in Phase 20; the holder decides who is invoiced from Phase 21." Shots: `holders` (`[data-shot=contract-holders]`, the Kind and Invoiced columns highlighted), and a `holder-panel` state with a hospital holder open showing "Holder is billed" and its billable party. Caption "Each contract holder records whether AA invoices it, its billable party and the person it belongs to" |
| [US-04.1.6](../../../../requirements-board/requirements/stories/US-04.1.6.md) Stage and submit Contract changes | none (create it) | No change here (Phase 25 owns it). |
| [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) Contract holder, who is billed, and where it applies | partial · contract-holder | `partial`, reason "Who is invoiced follows the holder from Phase 21; the Contract list is narrowed by hospital, surgeon or rooms and practitioner in Phase 20." Re-shoot `contract-holder` on the COS ACC Contract's detail (re-point `tr:has-text("ACC orthopaedic services")`) with the holder section highlighted (kind, Invoiced text, practitioner). Its scope states go. US-04.2.1's `images` still list two hand-added `assets/US-04.2.9/admin-contract-scope-*.png` shots from the retired US-04.2.9; remove those two entries from its `images` list only (never its text or status), then `npm run check`. Caption "The holder decides who is invoiced: its billable party, or the payer on the Booking" |
| [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) Contract prices effective from a date | absent · placeholder | No change here (Phase 25 owns it; it needs staged submit and the relink). |

US-04.2.4 left this phase for 19a; its recipe stays apart from the breakage below.

**Recipes this phase breaks** (keep shot names unless the old name describes retired behaviour):
- `US-04.2.2` (Phase 24) and `US-04.2.4` (19a): re-point the row names (`"St George's standard
  units"`, `"Southern Cross Affiliated Provider"`, `"Aria Skin and Laser Clinic"`) and
  `label:has-text("Agreed unit rate")`; keep the `contract-price-rows` hook and `US-04.2.2`'s `type-1`,
  `type-2`, `type-3` and `rate-time` state names until 24, but caption them by the terms they show.
- `US-04.3.2`: options become "<AA code> · <name>" under holder groups; the `[role=dialog]
  label:has-text("Governing contract")` highlight must still match.
- `US-04.4.1` and `US-04.2.9` (Retired): `status: absent`, reason "Retired: removed in Phase 18".
  `US-04.2.7` (Retired): keep `absent`, reason "Retired: a Contract declares no required booking
  inputs (2026-10-08)". `US-04.2.5` (Retired): re-point its `ordinal-rows` step to the new row open and
  reword "Type 3 contract" to "fixed-price Contract".
- `US-04.3.3` (20): its three `default-contract` shots now show "St George's RVG". Reword the captions
  to "Procedure governed by St George's plain RVG Contract" and "The Procedure's Contract shown on the
  Booking", keep names and status, and make its partial reason: "Seeded hospital Procedures carry
  their hospital's plain RVG Contract; an ended hospital or insurer Contract falls back to No contract
  (RVG), held by AA. No contract (RVG) first in the picker is built in Phase 20."
- `US-05.2.5` and `US-04.2.3`: "Type 3" in their reasons becomes "fixed prices", status unchanged.
  `US-05.5.1`, `US-05.5.2`, `US-11.4.1`: re-check names and captions.
- Recipes with a `{ "trigger": "billing-failure" }` setup step: the cause changed (work item 13);
  re-check each failure shot and caption.
- Recipes that open the Contracts tab (`US-04.3.1`, `US-04.3.4`, `US-13.4.1` and similar): the wide
  panel replaces the old sheet and a "Contract holders" tab now sits before "Contracts"; re-point
  whatever the `--dry` run fails on. The Phase 07 Playwright spec is separate (work item 14).

**ATLAS.md.** Personas and IDs (holder ids, Contract names and AA codes, `CT-NO-CONTRACT`,
`CT-DOYLE-BAR-2`, `CT-COS-ACC-OLD`), Seed data (the Doyle upcoming version, the Health NZ review date,
the billing-failure cause), Overlays (the wide Contract and holder panels) and Existing hooks
(`contract-holders`, `holder-panel`, `contract-catalogue`, `contract-search`, `contract-detail`,
`contract-settings`, `contract-versions`; `contract-price-rows` kept). Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the build and tests are green, and before the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**: four Opus lenses
(quality, fee-maths and parity, store and lifecycle, plan and catalogue adherence); verify every
finding against the catalogue and the code, fix the confirmed ones, re-green, and record the pass. Do
not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**
- **Parity is real:** the fixture was captured before the reshape and matches unchanged; recompute by
  hand SXAP $26.50, Health NZ $23, St George's ACC $25, COS $24, the bariatric rows, Aria $1,440. No
  expected number was edited to pass.
- **Who is billed did not move:** every seeded invoice goes to the same counterparty kind and id (COS
  `{ kind: 'organisation', id: ORG.cos }`, Doyle the surgeon, Aria the clinic). No billing path reads
  `billed`; `billedAs` and `routeCounterpartyForHolder` are the only bridges, labelled for Phase 21.
- **Never backdated, never deleted (RV-32):** no action edits a version's dates in place or accepts a
  past start; `deleteContract` is gone with its UI and tests; retire ends the latest version today or
  later; one chain per Contract, the day-before end, no overlap; the version in force on the List date
  prices everywhere through `contractForPricing`; a started version's terms and settings are frozen; no
  pricing path reads the demo clock, the created date or `Date.now()`. Nothing of 25's is half-built.
- **No kinds, settings only (US-04.1.1):** no rendered "Type 1/2/3", "first party" or "third party",
  no `type` or party-type field, no branch on a category; `interimTerms` is read only through
  `interimTermsOf`; `editable` and `prepaid` are stored and shown but read by no pricing or
  prepayment path.
- **No contract (RVG) (DM-49, OQ-78):** exactly one, found by `isDefault`, held by the never-billed
  `aa` holder, never expires, unchangeable through the store; the per-holder invariants, auto-create
  paths and fallback are gone everywhere, copy included.
- **Holders (US-04.1.5):** every integrity rule holds in the store, not just the UI (billed needs a
  billable party; no rule ties billing to the kind); retire refusals; the insurer flag only pre-fills.
- **The failure demo (work item 13):** the trigger backdates nothing, the monitor edits no Contract,
  any lifecycle allowance is narrow and tested.
- **AA code and search:** the code is made only by `nextAaCode`, stamped on every create path, shared
  by a chain, immutable even with a raw patch, mono everywhere; `contractSearch` is pure, in
  `src/domain/billing`, built on `contractMatchesQuery`, and is what the catalogue calls.
- **One module:** the holder, Contract and version shapes and rules live only in
  `domain/billing/contracts.ts` (plus the seed); the doc comments name the design's fields and mark ours.
- **ACC and copy:** the review flag is gone, the chip, column and pre-op help text stay; teal the only
  action colour; Retire in the error treatment; mono tabular-nums for codes and money; desktop
  panels; no en or em dashes, build-phase references or provisional labels in app copy.
- **Persistence and the PWA:** `PERSIST_VERSION` bumped and stale state reseeds; the PWA purity test
  holds with the new shared modules.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the D48 and D55 defaults (Doyle's bariatric Contract held by his rooms; the insurer
  flag only pre-fills); the AA code format (`<holder prefix>-<nnnn>`, shared by a Contract's
  versions, `SUR` for surgeon or rooms); the holder kind and context link and the review date we
  added (required on every holder's Contract, none on No contract (RVG)); `editable` seeded false on
  negotiated Contracts and true on No contract (RVG) and the plain RVG Contracts, `prepaid` false
  throughout, neither acting yet; a new Contract's first version also cannot start in the past; the
  re-based billing-failure demo and the monitor's "choose a Contract and retry"; the seeded retired
  2024-schedule COS ACC Contract; Aria with no room or group; Doyle's holder not billed while the
  route still bills him until 21; the Souter holder with no Contract until 19a; anything logged; and
  the screens worth a look (Master data: Contract holders; Contracts with search and settings; the
  Doyle versions; Health NZ New version; Billing monitor failure), each with route and persona.
- **Catalogue screenshots result:** the recipes created (US-04.1.5) and filled in (US-04.1.4), the
  others changed and the broken ones re-pointed, the `requirements-board/requirements/capture/REPORT.md`
  counts (captured, partial, absent, failed) before and after, and the partial reasons handed on
  (FT-04.1 and US-04.1.4 to 19a and 25; US-04.1.1 to 19a, 20, 24 and 27; US-04.1.5 and US-04.2.1 to 20
  and 21).
- **Status row:** Phase 18 (Contract holders, settings and dated Contracts) DONE with the date, or IN
  PROGRESS after session 1 with what remains.
- **Phase entry:** the drift-check result against `d4db277` (US-04.1.5 Verify; OQ-105 and OQ-114 as
  built; the answered questions as built); how Phase 17's rooms, groups and `SG-COS` map to COS and
  Doyle; the holder and AA code tables as seeded; the parity fixture path and result; the
  `PERSIST_VERSION` bump; the review pass; the handoffs: **19a** (lines replace `interimTerms`,
  `type2Detail` and `ContractPrice` with a parity test; New version copies lines; the Souter Contract,
  flagged prepaid; holder codes join `contractMatchesQuery`), **20** (the fitting list reads kind, link
  and practitioner, wraps `contractMatchesQuery`, offers No contract (RVG) first and no-line Contracts
  by context, rooms' Contracts after the hospital's per D48; the route goes), **21** (`billed` and the
  payer decide who is billed; `billedAs`, `routeCounterpartyForHolder` and Doyle's interim
  billable-party link go), **24** (`editable` acts; `permitsIndividualArrangement` and the Method 3
  gate go), **25** (staged changes, the one-future check and the relink replace "New version"; the
  failure demo is re-based again; its "No fallback" manual test must not end a Contract in the past),
  **27** (`prepaid` starts prepayment) and **42** (spreadsheet loads of holders and Contracts; the
  organisations master).
- **Decisions log:**
  - (a) **Supersedes "protected default Type 1 per hospital and insurer"** (3rd review #9, 7th review
    B14): one No contract (RVG), held by AA (OQ-78); the seeded defaults are their holders' plain RVG
    Contracts with no lines (D32); nothing is created with a hospital or an insurer flag; an ended
    hospital- or insurer-held Contract with no successor falls to No contract (RVG) at the same price
    and counterparty (interim until 21).
  - (b) **Amends "Contract-holder placements (seed)" (2026-07-23):** the holder master; COS a rooms
    holder over `SG-COS` billed through `ORG.cos`; Aria a rooms holder billed through its clinic
    billable party; Doyle's fixed prices held by his rooms, not billed (D48 default); the ACC
    Contracts ordinary hospital and rooms Contracts.
  - (c) **Type 1/2/3 are no longer kinds** (US-04.1.1): behaviour comes from settings; their terms stay
    as interim terms until 19a; the SXAP $26.50 ruling and the 2026-07-22 fixed-price fallback are kept.
  - (d) **Contracts are dated versions; the procedure date (the List date) picks the version** (OQ-48,
    D45); never backdated, never deleted (retire replaces delete); a started version's terms and
    settings are frozen. **Supersedes** the Phase 08 maintenance (in-place edits, hard delete, the
    monitor un-end-dating a Contract) and the Phase 09 failure demo that ended COS ACC in the past.
  - (e) **AA code** (US-04.1.4, D16): `<holder prefix>-<nnnn>` from one generator, shared by a
    Contract's versions, immutable; ours until AA designs the Contract.
  - (f) **The individual-anaesthetist scope becomes an anaesthetist holder's practitioner link**; the
    scope field is gone, and "first party" and "third party" are gone with it.
  - (g) **Supersedes the ACC review flag** (6th review #3, 7th review A5/B3 advisory): removed (RV-37);
    the informational chip and column stay.
  - (h) **The insurer's direct-claims flag only pre-fills "is billed"** (OQ-114's default, D55) and
    creates nothing.
