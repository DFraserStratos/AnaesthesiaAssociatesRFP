# Phase 19a · Price ranges, the Contract's own fields and starting values

**Requirements covered:**
[FT-04.2](../../../../requirements-board/requirements/stories/FT-04.2.md) Contract definition (status 3; graded Contradicts: every Contract dated, no price ranges) ·
[US-04.2.15](../../../../requirements-board/requirements/stories/US-04.2.15.md) Price ranges on a fixed price (status 3; graded Contradicts; joined 2026-11-10) ·
[US-04.2.18](../../../../requirements-board/requirements/stories/US-04.2.18.md) Holder reference code, invoice description and default RVG code (status 3; graded Missing; joined 2026-11-10) ·
[US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md) Combinations as Contracts (status 3; graded Contradicts) ·
[US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) Anaesthetist's own price list Contracts (status 3; graded Contradicts) ·
[US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) Tiered time units (status 4; graded Partial) ·
[DM-09](../analysis/domain-model-delta.md#dm-09) a fixed-price Contract's dated price ranges replace ContractPrice; the Contract gains its own fields; no Contract lines ·
[DM-43](../analysis/domain-model-delta.md#dm-43) choosing the Contract and the RVG code fills the Procedure's starting values ·
[RV-07](../analysis/reverse-check.md#rv-07-second-procedure-pricing-keyed-on-the-procedure-ordinal) the price rows keyed on RVG code, surgeon and ordinal go.
**Left 2026-11-10:** US-04.2.4 Contract lines (Retired 5 November, D1: each priced item is its own
Contract). Its line grid, line keys, line description and "a Contract may hold no lines" are not
built; its fields live on the Contract here (US-04.2.18), its pricing in 18's pricing kinds and the
price ranges below.
Carried across without regression, each with a parity test (work item 1):
[US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md),
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) (a fixed price is the whole price),
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) (the Contract's rate, as 18 left it) and
[US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) (prices ex GST, GST at the invoice foot).

**Answered and built as answered (no label anywhere).** Donald's contract model decisions of
5 November (D1 to D11, for the build): D77 ([OQ-131](../../../../requirements-board/requirements/questions/OQ-131.md):
no versions and no lines; a fixed price changes by adding a price range, whose start may be in the
past), D45 ([OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md) overtaken: the
procedure date decides, through the range in force), D3 and D12 (base units from the RVG group alone;
a Contract states no units, only a default RVG code), D37
([OQ-103](../../../../requirements-board/requirements/questions/OQ-103.md): the Contract's invoice
description, where filled in, is the top default; 20a builds the chain), D40 (moot: a time-banded
schedule is one fixed-price Contract per band), D42 and D30
([OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md),
[OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md): the office keeps each
anaesthetist's price list as one prepaid Contract per item, every range above zero), D65
([OQ-117](../../../../requirements-board/requirements/questions/OQ-117.md): a fixed price is never
overridden by the anaesthetist; 18's guard, 24's gate), D48
([OQ-105](../../../../requirements-board/requirements/questions/OQ-105.md): a surgeon's arrangement is
one Contract per item linked to its surgeons), D25
([OQ-75](../../../../requirements-board/requirements/questions/OQ-75.md): a part interval rounds up),
OQ-53 (a combination is a Contract of its own), OQ-90 (no Contract prices a second procedure; RV-07),
OQ-104 (a prepaid Procedure keeps its prepaid price; 27's). D32 and D49 are moot (no lines).
**Open, built on its default:** D79
([OQ-133](../../../../requirements-board/requirements/questions/OQ-133.md), for Vanessa): no list of
the Procedures a backdated range re-prices; the office's review catches them. Nothing to label; logged.
**The sources differ, logged:** D6 allows a past start; Greg said on 23 October a Contract cannot be
backdated. Build D6.

**Repurposed 2026-11-10 (catalogue `efe123c`).** The plan's Contract lines (line key, line grid,
line description and terms, the header-and-lines editor, "Set for all lines", `interimLineFor`), the
whole-Contract dated versions kept as D77's old default (Souter's New version) and starting values
from a line are superseded and not built. The file keeps its historical slug (`default-rvg-contracts`),
pinned by the plan tools.

**Depends on:** Phase 18 (the Party master; the flat Contract with its AA code, holder reference code,
bills holder or payer, linked practitioners, prepaid, pricing kind with the undated rate and discount,
override setting, Active or Disabled, save guards in one place, in-place audited edits; No contract ·
RVG; **today's ContractPrice rows kept as the fixed-price interim**; the parity harness), 18a
(specialties, funding tags, the open-price fallbacks) and 19 (`RvgGroup` with its hidden key, the
optional `rvgGroupId` on a Procedure, `resolveStartingUnits`, `pickRvgGroup`, the type-ahead, the
out-of-range warning; Doyle's prices re-keyed onto NZSA groups).
**Estimated:** 2 sessions. Session 1: work items 1 to 5 (parity first, price ranges and the two
fields, the seed re-authored as priced items, the fee path from the range in force), ending green.
Session 2: work items 6 to 12 (store actions, price lists and combinations, starting values, the
editor, time tiers, captions, Playwright) and the review pass. If session 2 runs long, cut the Admin
Contracts summary column (item 9c) first.

**Confirm before building.** Build the catalogue as it stands at `efe123c`. Cite
[AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md) (the proposal: 2.2, 2.3, 2.4,
5.6, 5.7, 8; the why in [contract-model-proposal.md](../../contract-model-proposal.md)) and
[AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md) (`#contract`, `#price-range`,
`#rvg-group`, `#procedure`); AR-28, AR-29 and AR-30 are Retired, never cited. Keep the price ranges,
`rangeInForce`, the two fields' guards, the starting-value fill and the fee path in **one place** in
`aa-prototype/src/domain/billing` (plus the seed), behind types the UI reads.

## Goal

Retire `ContractPrice`: every schedule item becomes a **fixed-price Contract of its own with price
ranges**, the range in force on the procedure date giving the price; give each Contract an **invoice
description** and a **default RVG code** beside 18's holder reference code; seed **Merivale's
combinations** and **Dr Souter's prepaid price list** as Contracts; fill a Procedure's **starting
values** from its RVG group and its Contract's default RVG code; and make the **RVG time tiers data**,
with no scripted figure moving.

- **Price ranges** (US-04.2.15, DM-09; AR-58 2.4 and 5.6; AR-61 `#price-range`). A fixed-price
  Contract holds one or more ranges, each a start date and a price ex GST. Starts are unique and may be
  in the past; a range ends the day before the next starts; the last runs on; at least one, and the
  last is never deleted; every range above zero on a prepaid Contract. `rangeInForce(contract, date)`
  is the range with the latest start on or before the date (the List's date). Before the first start
  there is no price: 20 does not offer the Contract (AR-58 A9) and 24 shows "Needs a price". Adding a
  range is how a fixed price changes from a date; correcting a mistake is editing or deleting one.
  Every change audited. Rate and discount stay undated (18).
- **Prices follow the range** (AR-58 5.7, A13). Unedited prices are computed, not stored, so a new or
  backdated range re-prices every un-authorised, unedited, un-prepaid Procedure on the Contract; an
  issued invoice never changes. Holding a typed price, a prepaid amount or the snapshot is 24's, 27's
  and 25's. No list of the Procedures affected (D79).
- **The Contract's own fields** (US-04.2.18; AR-58 2.2): `invoiceDescription` (optional; 20a makes it
  the top default) and `defaultRvgGroupId` (optional; 19's hidden key, shown as its code; fills the
  Procedure's RVG code when empty, A15, and a search by RVG code finds the Contract), beside 18's
  `holderReference` (not unique, A23). A holder's schedule is one Contract per item: its code the
  holder reference code, its description the invoice description.
- **Combinations are Contracts** (US-04.2.11, OQ-53): Merivale Plastic Surgery's "Face lift",
  "Facelift plus 1 add on (eg bleph)" and "Facelift plus 2 add ons (eg bleph & fat grafting)", three
  fixed-price Contracts held by its surgeon-group Party, linked to its surgeons, billing the payer,
  each with default RVG code H3. **Fee extras** (a GA add-on fee, "per 15 minutes over 120", "per
  area") are not Contracts and get no seed rows: they are events or additional invoices (38b, 39b;
  AR-58 A46). Separately priced add-ons (MIGS add-on to cataract) stay Contracts.
- **The anaesthetists' price lists** (US-04.2.14, D42): one Contract per item, held by the
  anaesthetist's Party and linked to them, prepaid (so billing the payer, 18), fixed price, every
  range above zero (refused on save), kept by the office; a new item is a new Contract, a price change
  a new range. Anaesthetists never create or edit Contracts. A surgeon's arrangement is one Contract
  per item linked to its surgeons (D48).
- **Starting values** (DM-43, US-03.3.1; AR-58 5.7 steps 3 and 4): choosing a Contract fills the
  Procedure's RVG code from the default where none is set (a Procedure that has one keeps it, with its
  times and modifiers); base units come from the RVG group alone through 19's resolver (the exact
  figure chosen where the guide prints a range); modifier units start at 0 (19b adds its
  pre-applies). On a fixed or open price no units are asked and the RVG code is for reference (21a
  collapses the form).
- **Tiered time units become data** (US-05.2.2, D25): the anaesthetist enters start and finish; the
  system works out the units from seeded tiers (95 minutes is 7, 125 is 9); the stale "assumption"
  copy goes.
- **The seed is re-authored as priced items** following AR-58 8.2 and 8.3, demo-sized; the fee path
  reads the range in force and the Contract's rate or discount, with parity on every S3 to S5 figure.
  The only seeded figure expected to move is the bariatric hernia Procedure (its ordinal row goes).

## Before you start: drift check

1. Run `node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff <IDs>`
   (baseline `fbdd555`) for FT-04.2, US-04.2.15, US-04.2.18, US-04.2.11, US-04.2.14, US-05.2.2,
   US-04.2.1, US-04.2.2, US-04.3.2, US-03.3.1, US-03.3.9, US-05.1.1, US-05.2.1, US-05.2.5, US-05.2.6,
   US-05.2.7, US-05.2.8, US-08.4.6, FT-06.2, US-06.2.2, OQ-48, OQ-53, OQ-62, OQ-75, OQ-90, OQ-91,
   OQ-96, OQ-103, OQ-104, OQ-105, OQ-117, OQ-131 and OQ-133, plus AR-58 and AR-61. Re-read
   domain-model.md's Contract and Procedure sections. If an item changed, re-read it whole and adjust;
   if one is now Retired or Future, drop its work and say so in PROGRESS. If Contract lines or
   versions come back, stop and ask.
2. Confirm the gates.

| Gate | Build | If answered differently |
|---|---|---|
| **D77 / OQ-131, D45 / OQ-48** (answered) | Price ranges on fixed prices, starts may be past; no versions, no lines | Not expected |
| **D79 / OQ-133** (open, for Vanessa) | No list of affected Procedures; prices follow by derivation | A list is a read-only query over `rangeInForce`; nothing here changes |
| **D3, D12 / OQ-62** (answered) | Base units from the RVG group alone; a Contract names only a default RVG code | Not expected |
| **D37 / OQ-103** (answered) | The Contract's invoice description stored and shown; 20a builds the chain | Not expected |
| **D42, D30, D65** (answered) | Price lists one prepaid Contract per item, ranges above zero; office only; no override on a fixed price | Not expected |
| **D48 / OQ-105** (answered) | Merivale's Contracts held by its Party, linked to its surgeons | Not expected |
| **D25 / OQ-75** (answered) | Part intervals round up; tiers as data | A data change in the seeded rule only |

3. Read what 18, 18a and 19 built (their PROGRESS entries) and follow their names: 18's Contract and
   Party types, the pricing kind field and where the rate and discount sit, `holderReference`, the
   save-guard function, `contractMatchesQuery` (or 18's name), the fixed-price interim over
   `ContractPrice`, Doyle's, Merivale's and Souter's Parties, No contract · RVG, the parity harness;
   18a's tags and specialties; 19's `RvgGroup`, `rvgGroupId`, `resolveStartingUnits`, `pickRvgGroup`
   and where Doyle's rows were re-keyed.
4. Record `PERSIST_VERSION`.

## Reference

**Design (convention 17).** No mockup covers Contract editing: extend `docs/design/Admin Review.dc.html`'s
table anatomy and the editor as 18 left it. Captions stay on `Mobile App.dc.html` screen 3 and its web
twin. Teal is the only action colour; pills neutral.

**Catalogue.** The files above, plus [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md)
(pricing kinds; 24), [US-05.2.8](../../../../requirements-board/requirements/stories/US-05.2.8.md)
(the price follows; 24), [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md)
(candidates; 20), [US-08.4.6](../../../../requirements-board/requirements/stories/US-08.4.6.md)
(invoice description; 20a), [FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md)
(prepayment; 27).

**Artifacts (link, never edit).** AR-58 2.2 to 2.4, 5.6, 5.7, 8 and A9, A13, A15, A23, A28, A46;
AR-61 `#contract`, `#price-range`, `#rvg-group`, `#procedure`; AR-01 `#starting-values`,
`#price-follows`, `#contract-reset`; AR-02 `#anaesthetist-price-list`, `#surgeon-arrangement`; AR-16
`#time-units`. Fee figures from `contract-picker-mock/src/data/` (seeded from the real fee files) or
`docs/discovery-reference/Contract Files/`.

**Code entry points (follow what 18 and 19 left).** `domain/types.ts` (`ContractPrice`; the Contract's
pricing); `domain/billing/contracts.ts` (`matchContractPrice`); `fee.ts` (`FeeContext`, the fixed-price
branch and its additional-procedure discard); `timeUnits.ts`; every reader of `contractPrices`,
`procedureOrdinal`, `matchContractPrice` (`validateBookingForBilling.ts`, `invoiceBuild.ts`,
`shared/capture/feeContext.ts`, `BookingDetailBody.tsx`, `store/selectors.ts`,
`store/contractActions.ts`, `shared/audit/fieldLabels.ts`, `seed/billing.ts`, `seed/contracts.ts`,
`ContractEditSheet.tsx` `PriceRows`, `apps/admin/reviewFlags.ts`); `seed/bookings.ts` (the bariatric
Booking; Souter's rhinoplasty Bookings); `EditBillingSetupSheet.tsx` (today's Contract set);
`UnitsCard.tsx` (the "(assumption)" T caption); `DemoControlPanel.tsx` (the "Billing assumption"
callout).

## Work items

Model, domain and seed first, then store, then UI. Every write through `mutate()` with an audit meta.
Every rule a pure function in `src/domain/billing/` with a Vitest test. No new RNG draws. One
`PERSIST_VERSION` bump.

**Session 1: ranges, the two fields, the seed as priced items, the fee path.**

1. **Parity first (before any edit).** Add `phase-19a-baseline.json` to `domain/billing/__parity__/`
   from the untouched code: every seeded Procedure's fee total, B, T and M, charge lines, and every
   seeded invoice total. Named cases: each scripted Booking S1 to S5; a Southern Cross Booking at
   $26.50 a unit and a Health NZ one at $23 (US-05.2.6); the bariatric primary at $2,800 and GST on it
   (US-05.2.5, US-05.2.7); a No contract · RVG Booking (US-05.2.1). Never regenerate with `-u`. At the
   end only the bariatric hernia Procedure (and its invoice) differs, asserted by its exact difference;
   new seeded Bookings (item 7) are additions, named.

2. **Price ranges and the two fields** (new `src/domain/billing/priceRanges.ts`; types re-exported
   through `types.ts`).
   - `PriceRange = { startISO; price }` held inside the fixed kind's pricing (AR-58 2.3:
     `{ kind: 'fixed'; ranges }`, or 18's equivalent), kept sorted by start. The Contract gains
     `invoiceDescription: string | null` and `defaultRvgGroupId: RvgGroupId | null` (required keys,
     so the compiler finds every literal).
   - Helpers: `rangeInForce(contract, dateISO)` (null before the first start or on a kind that is not
     fixed); `rangeEnd(ranges, i)` (the day before the next start, or none); `addRange`, `editRange`,
     `deleteRange` (pure); `validatePriceRanges(ranges, { prepaid })` with typed refusals `noRange`,
     `duplicateStart`, `negativePrice`, `prepaidPriceNotAboveZero`, `lastRange`. Add them, and a
     default RVG code that must exist, to 18's save guards in the same place. 18's search matcher adds
     the invoice description and the default RVG code's code.
   - Remove `ContractPrice`, `matchContractPrice`, `masters.contractPrices`, every `procedureOrdinal`
     and price-row `surgeonId`, and 18's fixed-price interim.
   - Tests: US-04.2.15's criteria as written (1 April and 1 July; the implied 30 June end; Merivale's
     $3,100 from 1 June and $3,200 added on 5 November from 1 October, 15 October at $3,200 and
     20 September at $3,100; unique starts; never the last; not yet in force); a prepaid range at 0
     or blank refused; audit copy in English ("Face lift: price range from 1 Oct 2026, $3,200.00").

3. **The seed as priced items** (`seed/contracts.ts` or a new `seed/pricedItems.ts`, one commented
   table; AR-58 8.2 and 8.3 readings, demo-sized, labelled demo).
   - **Doyle:** each priced item a fixed-price Contract on 18's Doyle Party, linked to Doyle, billing
     as 18 left it: "Gastric bypass" $2,800 from 1 Jan 2025 and $2,950 from 28 Jul 2026 (the old
     upcoming figure, now a range), "Sleeve gastrectomy" $2,400 from 1 Jan 2025, each with the
     default RVG code 19 re-keyed. Seeded Procedures move to the item matching their old row. The
     ordinal row goes (RV-07): the hernia Procedure goes to No contract · RVG, priced at RVG under
     today's additional-procedure rule until 23.
   - **Schedule items:** a handful each from the fee files: CES SXAP cataract items (holder CES,
     bills its holder, tag SXAP, holder reference code such as `AP0126`, range from 1 Apr 2026), CES
     HNZ (`HNZCATall`), an ACC item (`OPT101`), and a vitrectomy schedule as two or three banded
     Contracts (band in the name). Name and invoice description from the line description; GST as
     printed, ex GST (incl-GST sources divided); the default RVG code only where 19 holds the row.
     No fee extras. No seeded Procedure moves onto them.
   - **Unchanged:** the rate Contracts (SXAP $26.50, Health NZ $23, St George's ACC $25, COS ACC $24,
     Aria) as 18 left them, so the scripted figures hold; No contract · RVG; 18a's fallbacks.
   - Tests: every fixed-price Contract has a range; starts unique; no fixed range at zero on a prepaid
     Contract; every seeded Procedure on a fixed-price Contract has a range in force on its date; no
     fee-extra Contract.

4. **The fee path reads the range in force** (`fee.ts`).
   - `FeeContext` loses `contractPrices`, `surgeonId` and `procedureOrdinal`; every assembler
     (`feeContextFor`, `procedureFee`, `InvoiceBuildContext`, `seed/billing.ts`,
     `reviewFlags.naturalBtm`, `BookingDetailBody`, selectors, every `feeFor(`) passes the Contract
     and the List's date the same way.
   - A fixed price is the whole price on any Procedure, primary or additional (BTM still computed for
     reference; 0 gives $0); the rate and discount kinds read the Contract's undated settings as 18
     left them. No range in force: the result carries `needsPrice` and no amount, and the billing
     validator refuses with "Needs a price: no price range in force on {date}." until 24's ladder
     shows it. Today's office `priceOverride` and additional-procedure rule stay (24, 23).
   - Tests: range in force by List date; a backdated range re-prices an unedited Procedure and leaves
     one with an office override and an issued invoice unchanged; fixed price on an additional
     Procedure; needs a price; rate regardless of the anaesthetist's value; GST at the foot; the
     Merivale $3,910 combination priced as one.

5. **Session 1 ends green.** Build, build:pwa, vitest, parity as item 1 says. Grep `src/` for
   `ContractPrice`, `contractPrices`, `procedureOrdinal`, `matchContractPrice`: none left outside test
   names. Until item 9 the editor shows ranges read-only.

**Session 2: store, price lists and combinations, starting values, the editor, time tiers.**

6. **Store actions** (`store/contractActions.ts`, office-only, audited before and after, `Outcome`):
   `addPriceRange`, `editPriceRange`, `deletePriceRange`, and the two fields through 18's Contract
   edit, each through the item 2 validators with its sentence: "Another price range already starts
   on {date}.", "A Contract keeps at least one price range.", "A prepaid Contract's price must be
   above zero.", "Only a fixed-price Contract has price ranges." Refused for any anaesthetist actor.
   Tests for each refusal and the audit entry.

7. **Price lists and combinations** (seed and tests).
   - **Dr Souter's price list** (US-04.2.14): on 18's Souter anaesthetist Party, three or four
     Contracts, each linked to her, prepaid, fixed price, with a description and default RVG code:
     "Rhinoplasty" $1,200 from 1 Jan 2026 (the figure Riley's prepayment uses) with a second range
     (a price change), plus two or three cosmetic items, every range above zero. No seeded Procedure
     moves onto them (offering is 20's, the prepaid amount 27's).
   - **Merivale Plastic Surgery** (US-04.2.11, D48): on its surgeon-group Party (18's; add it if 18
     left none), linked to two existing plastic surgeons, the three combination Contracts at $3,565,
     $3,910 and $4,255 from 1 Jun 2026, default RVG code H3 (19's first H3 row), billing the payer.
     No liposuction-per-area Contract.
   - **One seeded Booking on Merivale's Face lift** for the trigger: an ACTIVE List after demo
     today, outside every S1 to S5 beat, unedited, on the payer route (until 20 and 21); a parity
     addition. 24 seeds the held ones beside it.
   - Tests: the Contracts pinned; a search by H3 finds Merivale's three; Souter's read prepaid and
     linked; Merivale's resolve to both surgeons.

8. **Starting values** (DM-43; new `startingValues.ts`).
   - `fillFromContract(procedure, contract)`: when the Procedure has no `rvgGroupId`, set it from the
     Contract's default and run 19's `pickRvgGroup` fill (base units from the group's starting
     figure, the range shown); a Procedure with an RVG code keeps it, with its times and modifiers
     (A15). Modifier units start at 0 plus nothing until 19b. No source stored.
   - Run it from today's Contract-set paths (the office billing setup sheet, `addProcedure`, the
     seed); 20's rail calls it. Clearing a typed price on a Contract change is 20's.
   - Tests: default fills an empty code; an existing code kept; no default leaves it empty; a fixed
     price's units do not reach its fee.

9. **Admin: the Contract editor and list** (`ContractEditSheet`, 18's detail; desktop).
   - a. **Invoice and codes:** Holder reference code (18's), Invoice description, Default RVG code
     (19's type-ahead, stores the group id, shows the code). `data-shot="contract-codes"`.
   - b. **Price ranges** on a fixed-price Contract: Start, Price (ex GST), In force ("1 Jun 2026 to
     30 Sep 2026" or "From 1 Oct 2026"), a neutral "In force today" pill, Edit, Delete (disabled on
     the last). "Add price range" (any date, past allowed; teal). On a prepaid Contract a blank or
     zero price shows the refusal. `data-shot="contract-price-ranges"`, rows `price-range-row`.
   - c. The Contracts list: the summary column for a fixed price reads the range in force today
     ("$3,565 from 1 Jun 2026", or "Not in force until 1 Sep 2026"); the search finds by invoice
     description and default RVG code as well as 18's fields.
   - d. `PriceRows` (`contract-price-rows`), "Any code" and the ordinal input go.

10. **Time units as data** (`timeUnits.ts`, US-05.2.2, D25).
    - `RvgTimeRule = { tiers: { fromMinute; intervalMinutes }[]; partInterval: 'roundUp' }` in
      `masters.rvgTimeRule`, seeded from `DEFAULT_RVG_TIME_RULE` (15 from 0, 10 from 120), which no
      runtime path reads. `timeUnitsFromMinutes(minutes, rule)` with the rule required; `FeeContext`
      gains `timeRule`. `validateRvgTimeRule` and `describeTimeRule` ("1 unit per 15 minutes or part
      for the first 2 hours, then 1 unit per 10 minutes or part.").
    - Remove `PARTIAL_INTERVAL_ROUNDING`, the tier constants and the ASSUMPTION header.
    - Tests: 95 minutes is 7, 125 is 9; 0, 1, 15, 16, 120 (8), 121 (9); a different rule changes the
      result; malformed rules refused; no capture surface lets the anaesthetist type time units.
    - T caption "From start and finish stamps · RVG time tiers" with `describeTimeRule` as its
      title. Delete the Control Panel's "Billing assumption" callout. A read-only **RVG time rule**
      panel on 19's RVG tab, `data-shot="masters-rvg-time-rule"`.

11. **Captions and copy.** A Contract or RVG code change refreshes the values on screen at once. Grep
    app copy for "Type 2", "Type 3", "agreed rate", "price row", "Any code", "ordinal", "Contract
    line", "version", "first party" and "third party". No en or em dashes.

12. **Playwright and green.** Update every spec that reads the price rows, the T caption or the
    callout. Add specs: Merivale's Face lift ranges, a backdated range re-pricing the seeded Booking;
    deleting the last range refused; Souter's prepaid Contracts by holder, a zero range refused; the
    Contracts search for "CAT" and for H3; a default RVG code filling an empty Procedure; the
    time-rule panel; S5 Beat 4's added step. Build, build:pwa, vitest and shots green.

## Demo triggers

No new button. Normal use:

- **Admin Contract editor:** "Add price range" on Merivale's Face lift with a start before the seeded
  Booking's date: the unedited Booking re-prices.
- **Admin Contracts:** searching "CAT" finds cataract Contracts by name, holder reference code and
  default RVG code.
- **Admin Contracts:** Dr Souter's prepaid price-list Contracts; a zero or missing range price is
  refused.

The only Control Panel change is deleting the rounding callout. No PWA stand-in: the captions reach
the PWA through the shared capture components.

## Out of scope

- Offering and finding Contracts on the step rail, not offering one with no range in force (20). The
  invoice description chain (20a). Printing the holder reference code (22).
- "Needs a price" as a price state, typed prices and their holds, the anaesthetist's price line, the
  discount line (24). The snapshot and Contract history (25). The prepaid amount (27). The
  multi-procedure rule (23). Pre-applied modifiers (19b). The form collapse on a fixed price (21a).
- Fee extras as events and additional invoices (38b, 39b). Loads and the time-rule editor (42). The
  full-scale seed (43).

## Manual test checklist

The agent runs every item itself and reports it with evidence.

- [ ] Merivale's Face lift: one range from 1 Jun 2026 "In force today"; add a range starting before
      the seeded Booking's date: the earlier range shows its implied end, the Booking re-prices on
      Admin, web and mobile, invoices already issued are unchanged, the change is audited; no list
      of affected Procedures.
- [ ] Refusals with their sentences: a duplicate start; deleting the last range; a zero or blank
      price on Souter's prepaid Contract; a range on a rate Contract; any anaesthetist persona.
- [ ] Doyle: "Gastric bypass" with two ranges ($2,800, then $2,950 from 28 Jul 2026) and "Sleeve
      gastrectomy"; no ordinal anywhere; the hernia Procedure on No contract · RVG at the parity
      test's asserted figure.
- [ ] Merivale: three combination Contracts with H3, linked to both surgeons; no liposuction-per-area
      Contract; a search by H3 finds all three.
- [ ] Dr Souter: her Contracts by the holder filter, each prepaid and linked, every range above zero,
      Rhinoplasty with two ranges; no anaesthetist persona can open or edit them on web, mobile or the
      PWA.
- [ ] Contracts search: "CAT" finds the cataract items by name and `HNZCATall`; `AP0126` by holder
      reference code; an invoice description word finds its Contract.
- [ ] A Contract with a default RVG code set on a Procedure with none fills the RVG code and B from
      the group; one with a code keeps it.
- [ ] Time units: start and finish only; 95 minutes is T 7, 125 is T 9; the new T caption and
      tooltip; the time-rule panel; no "Billing assumption" callout.
- [ ] S1 to S5 figures unchanged; parity green. PWA (5174) T caption as on mobile. No en or em dash
      in new copy; actions teal.
- [ ] Catalogue screenshots as below, `npm run capture` with no failed recipe, shots checked by eye.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`, `npm run verify:board`
      green.

## Demo guide updates

Patch these, and the same sections of `master-demo-guide.html`:

- `04-presenter-cheat-sheet.md` "Contracts": "Each priced item is a Contract of its own, with a
  holder reference code, an invoice description and a default RVG code. A fixed price has price
  ranges: the range in force on the procedure date gives the price, and a new range, even backdated,
  re-prices everything not yet authorised, prepaid or priced by hand. A combination such as
  Merivale's Facelift plus 1 add on is its own Contract; fee extras are events. An anaesthetist's
  price list is one prepaid Contract per item, kept by the office, every price above zero (Dr
  Souter's)." "Fee calculation": "A part interval always rounds up (confirmed with AA); the tiers are
  held as data. Choosing a Contract fills an empty RVG code from its default." Item 10: drop the
  rounding assumption.
- `03-demo-script.md`: S1's rounding discovery point replaced as above. **S5 Beat 4**, after 18's
  in-place rate edit: "Open Merivale's Face lift, Add price range from a date before the seeded
  Booking: the Booking re-prices, while invoices already raised stay as they are." S5 "Worth
  pointing at":
  Merivale's combination Contracts and Dr Souter's prepaid list.
- Control Panel text: grep `src/apps/demo` for "rounding", "assumption", "Type 2", "Type 3".

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after
the review pass. Re-run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 19a`
first. No caption may describe price rows, Contract lines, versions, an ordinal, first or third party,
or rounding as an assumption.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-04.2.15](../../../../requirements-board/requirements/stories/US-04.2.15.md) | none | Create, `partial`. Admin `price-ranges` on `[data-shot=contract-price-ranges]` (Merivale's Face lift), states `in-force`, `backdated` (after adding a range; the Booking's fee re-priced) and `refused` (last range). Caption "The range in force on the procedure date gives the price". Reason: "Not offering a Contract with no range in force is Phase 20's; 'Needs a price' is Phase 24's." |
| [US-04.2.18](../../../../requirements-board/requirements/stories/US-04.2.18.md) | none | Create, `partial`. Admin `contract-codes` (a CES cataract Contract's three fields) and `search-cat` (the Contracts search). Caption "The holder's code, the invoice wording and a default RVG code on each Contract". Reason: "Found by typing on the step rail in Phase 20; the invoice description reaches the invoice in 20a; the holder reference code is printed in 22." |
| [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md) | absent | `partial`. Admin `combination-contracts`: Merivale's three Contracts found by H3. Caption "A combination is a Contract of its own, found by its RVG code". Reason: "Fee extras billed as events or additional invoices are Phases 38b and 39b's." |
| [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) | none | Create, `partial`. Admin `price-list`: Souter's Contracts by the holder filter, prepaid; states `price-change` (Rhinoplasty's two ranges) and `price-refused` (zero on save). Caption "An anaesthetist's price list: one prepaid Contract per item, kept by the office". Reason: "Offered only on her Lists under Patient › Prepaid in Phase 20; the prepaid amount in 27." |
| [US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) | captured · web-time-units, mobile-time-units | Stays `captured`. Re-shoot both with the new T caption; add admin `time-rule` on `masters-rvg-time-rule`. Caption "The anaesthetist enters start and finish; the units follow the time tiers, held as data" |
| [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) | partial · admin-price-rows | `absent`, "Retired: removed in Phase 19a" |
| [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) | absent | `absent`, "Retired" (if 18 or 25 has not already said so) |
| [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) | partial · admin-contract-holder | No change here (Phase 18 owns it) |
| [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) | captured · admin-pricing-basis | No change here (Phase 24 owns it); re-point any state that showed the price rows to `contract-price-ranges` |
| [US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md), [US-04.2.16](../../../../requirements-board/requirements/stories/US-04.2.16.md), [US-04.2.17](../../../../requirements-board/requirements/stories/US-04.2.17.md) | absent, none, none | No change here (Phases 22 and 18a own them) |

**Recipes this phase breaks.** `US-05.2.5` (the bariatric primary on its own Contract; reason naming
24); `US-05.2.6` if it clicked the editor; `US-04.2.5` (Retired; its ordinal step goes); `US-04.1.x` and
`US-04.3.2` recipes clicking the editor (check with `--dry`); `US-05.3.1`, `US-05.3.2`, `US-03.5.2`
(the units rows; look at the shots).

**ATLAS.md.** Hooks added (`contract-codes`, `contract-price-ranges`, `price-range-row`,
`masters-rvg-time-rule`) and removed (`contract-price-rows`); seed data (Doyle's, Merivale's, Souter's
and the CES Contracts, the Merivale Booking); the Control Panel callout gone.

## Adversarial review (after build)

Run the standard pass (PROGRESS convention 18): Opus reviewers for quality, bugs/correctness, plan
adherence and billing maths. Verify each finding, fix with a test, re-green. Do not re-raise settled
Decisions-log rulings.

**Steer this phase's reviewers at:**

- **Figures.** Parity identical except the hernia's asserted difference and the named additions;
  every old price landed on a range with the same figure.
- **One place.** Ranges, `rangeInForce`, the guards, the fill and the fee path in `src/domain/billing`;
  the UI recomputes nothing.
- **Ranges.** Unique starts, past allowed, implied ends, never the last, above zero on prepaid; the
  List's date picks the range; no range means no amount, never $0 or a fallback to RVG; no list of
  affected Procedures.
- **Flat model.** No Contract lines, line keys, versions, ordinal, time band or fee-extra Contract;
  combinations and bands are Contracts; writes office-only and audited.
- **Starting values.** Default RVG code fills only an empty code; base units from the group alone;
  no source stored.
- **Time rule as data.** No runtime read of the default or tier constants; 95 is 7, 125 is 9.
- **No gold-plating:** no rail, offering, typed price, snapshot, prepayment or events. Teal-only
  actions, no dashes, `pwaPurity` green, one `PERSIST_VERSION` bump.

## PROGRESS.md updates

- **For the owner's review:** backdatable ranges built to D6 though Greg said on 23 October a
  Contract cannot be backdated (the sources differ); no list of re-priced Procedures (OQ-133's
  default, D79); our readings built (A9 not offered, A13 prices follow, A15 an existing RVG code
  kept, A23 holder code not unique, A28 range from the source's date, A46 fee extras not Contracts);
  the rate Contracts kept beside the new CES fixed-price items so no scripted figure moves; the
  "Needs a price" validator sentence until 24; the hernia's new figure; the demo-sized schedule
  items and Souter's figures; screens worth a look (Merivale, Souter, Doyle, the "CAT" search).
- **Catalogue screenshots result:** recipes created (US-04.2.14, US-04.2.15, US-04.2.18) and changed
  (US-04.2.11, US-05.2.2, US-04.2.4 Retired, and the broken ones), `REPORT.md` counts before and
  after, partial reasons handed on.
- Status row and phase entry: what was built, parity result, review pass, tests, `PERSIST_VERSION`.
- **Decisions log:** (1) every priced item is a Contract; fixed prices change through backdatable
  price ranges (DM-09, D77, D45 superseded), superseding the 2026-07-22 ruling (4) on `ContractPrice`
  keys and the Type 3 basis, the never-backdated whole-Contract versions and the plan's Contract
  lines; (2) no ordinal key and no Contract prices a second procedure (RV-07, OQ-90), superseding the
  "Type 3 second-procedure fallback" and the Phase 08 "Type 3 x isAdditional" ruling; (3) fee extras
  are events, not Contracts (A46); (4) starting values from the RVG group and the default RVG code
  (DM-43; D3, D12); (5) price lists one prepaid Contract per item, ranges above zero (D42, D30, D65);
  (6) part intervals round up under tiers as data (D25), superseding the rounding ASSUMPTION, ruling
  (8) and the callout; (7) the Contract's invoice description is the top default (D37), no chain here.
- **Handoff list:**
  - 19b: modifier units start at 0; pre-applies add to `fillFromContract`'s result.
  - 20: candidates read `rangeInForce` (none in force, not offered); typing finds by holder
    reference code, invoice description and default RVG code; a pick runs `fillFromContract`;
    Souter's Contracts sit under Patient › Prepaid.
  - 20a: `invoiceDescription` is the top default of the chain.
  - 21a: its price selector reads `rangeInForce`. 22: prints `holderReference` on holder invoices.
  - 23: combinations are Contracts; the hernia sits on No contract · RVG.
  - 24: the ladder's computed rung reads `rangeInForce`; "Needs a price" replaces the validator
    sentence; the held Merivale Bookings sit beside 19a's unedited one.
  - 25: the snapshot copies the range in force; range changes are audited for the History tab.
  - 27: the prepaid amount is the range in force on Souter's Contract when the invoice is raised.
  - 42: loads Contracts with ranges through these validators; the time rule becomes editable. 43:
    the full AR-58 8 seed.
