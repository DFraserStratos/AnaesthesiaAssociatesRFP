# Phase 23 · Primary Procedure and the multi-procedure rule

**Requirements covered:**
[FT-03.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.2.md) Booking structure: primary and additional procedures (Confirmed) ·
[US-03.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.1.md) One primary Procedure (Confirmed) ·
[US-03.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.2.md) Anyone with edit rights can set the primary (Confirmed) ·
[US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md) Multi-procedure rule per Contract (Proposed) ·
[FT-05.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.3.md) Multi-procedure rule, superseding the RFP split-billing rule (Confirmed) ·
[US-05.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.1.md) Multi-procedure BTM rule (Confirmed) ·
[US-05.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.4.md) Contract-specific second-procedure rules (Proposed) ·
[DM-13](../analysis/domain-model-delta.md#dm-13) primary flag, modifier split above four units, per-Contract rule ·
[RV-02](../analysis/reverse-check.md#rv-02-modifier-units-never-split-across-procedures) modifier units never split across procedures.
Also builds, without closing: the Contract base-unit override half of
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md)
(it closes in 24) and AC3 of
[US-05.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.6.md)
(the Contract override is used when the Procedure is priced), filling the resolver slot Phase 19 left.
Re-checks [US-05.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.5.md)
(each Procedure's share recorded), which must still match afterwards.
Open questions: [OQ-15](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-15.md) (Confirm),
[OQ-06](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-06.md) (Confirm),
[OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md) (Open).
**Depends on:** Phase 19 (the base-unit resolver with its `contractBaseUnits` slot, the modifier master
as store data, RVG groups) and Phase 22 (invoice presentation, Contract-driven lines, the covered-amount
split that replaced `funderOverride`). Through them, 15 (Booking vocabulary, Copy as a skeleton-only new
Booking), 18 (the Contract model and fee-schedule lines), 20 (one Contract per Procedure) and 21 (the
schedule-miss flag) are in place, and 14's trigger registry exists.
**Estimated:** 2 sessions. Session 1: work items 1 to 9 (baseline, model, the pure engine, the Contract
override, rewiring every fee caller, store actions, seed, tests), ending green. Session 2: work items 10
to 15 (capture UI, Booking total, Review and invoices, the Contract editor, the two triggers, copy sweep,
Playwright, demo guide) and the review pass. This is a full two sessions: session 1 changes the shape
of the fee engine under every caller. If it overruns, finish items 1 to 7 and 9 green and carry item 8f
(the Contract actions) into session 2 with item 12, rather than splitting the engine rewire.

## Goal

Replace the RFP's split-billing rule with the catalogue's multi-procedure rule, and give every Booking one
explicit primary Procedure.

- **Exactly one primary.** `Procedure.isAdditional` becomes `Procedure.isPrimary`, with exactly one
  primary per Booking that has Procedures, guaranteed by the store and asserted by the seed test. The UI
  labels it.
- **"Make primary".** Anyone with edit rights (the anaesthetist on mobile and web, the office in Admin,
  and an inbound hospital or surgeon feed) can make another Procedure primary while the Booking is
  editable. Doing so re-anchors base and modifier units in one audited commit.
- **Booking-level pricing.** Fees are computed for the whole Booking, not one Procedure at a time:
  - base units on the primary only, and structurally not editable on an additional Procedure;
  - time units on every Procedure, from its own times;
  - modifier units recorded once for the Booking, on the primary. They all stay on the primary while
    the total is 4 or fewer. Above 4 they are split equally across the Procedures, with the remainder
    to the primary: 7 over 3 is 3/2/2.
- **Per-Contract rule.** Each Contract carries a multi-procedure rule: RVG default, a percentage of the
  second procedure's own code, a fixed add-on fee, or not billable. An additional Procedure is priced
  by its own Contract's rule. This replaces the Type 3 `procedureOrdinal` rows.
- **Contract base-unit override.** A Contract may override base units for an RVG code or group. It
  fills Phase 19's resolver slot, below a manual override and above the Procedure master.
- **Visible everywhere it counts.** A seeded three-procedure Souter Booking with 7 modifier units shows
  3/2/2 on the office Booking total, in Review and on invoice lines. Vitest worked examples cover every
  case.

The anaesthetist still sees no fee (the 2026-09-28 ruling). Their capture shows units and shares only.

## Before you start: drift check

1. Run `git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue"` and read the
   hunks for FT-03.2, US-03.2.1, US-03.2.2, US-03.2.3, US-04.2.2, US-04.2.5, FT-05.3, US-05.3.1,
   US-05.3.4, US-05.3.5, US-05.1.6, OQ-15, OQ-06 and OQ-53. Also diff `domain-model.md` and re-read its
   "Procedure" and "Contract (recommended structure)" sections and "3. Calculation rules" (the units
   table and the worked example).
   - If an item changed, re-read it whole and adjust the work items.
   - If one is now Retired or Future, drop its work and say so in the PROGRESS entry.
   - Watch in particular for: a changed threshold (4) or remainder rule, the rule options on US-04.2.5,
     and whether US-04.2.5 or US-05.3.4 has moved off Proposed.
2. Confirm the open questions. For each one still open, build the safe interim shown here.

| Gate | If still open (the interim to build) | If answered differently |
|---|---|---|
| **OQ-15** (Confirm: equal integer division, remainder to the primary, regardless of Contracts) | Build it exactly as written: `floor(total / n)` each, `total mod n` added to the primary, and Procedures on different Contracts split together. Keep the rule in one pure function (`allocateModifierUnits`) so a different answer is a one-place change. The picked reading on who takes part (item 3) is labelled provisional in the Decisions log | If the remainder goes elsewhere, or rounding differs, change `allocateModifierUnits` and its tests only. If the split must ignore Contract rules, drop the participant filter in item 3 |
| **OQ-06** (Confirm: base units on a Procedure master, and a Contract may override them) | Build the Contract override per RVG code or group (US-04.2.2 AC "Base units"), slotted into 19's resolver. The Contract editor section carries "Provisional · Contract base unit overrides are to confirm with AA (OQ-06)" | If OQ-06 rejects Contract overrides, skip items 6, 8f (override actions) and 12b, and record it. If it asks for overrides per Procedure master entry as well, add that target kind in item 6 with the same precedence (entry beats code beats group) |
| **OQ-53** (Open: how combined procedures are modelled) | Do not model bundling. A combined operation is captured as one Procedure, or as several Procedures priced by the rule; nothing in this phase splits or bundles invoices | If AA picks the bundle master (the recommendation), log it for a follow-up phase with 39's additional invoices. Do not build it here |
| **US-04.2.5 / US-05.3.4** (Proposed) | Build all four options. The three non-default ones carry "Proposed" in the Contract editor | Adjust to the confirmed text |

3. Read what Phases 15 to 22 actually built (their PROGRESS entries). File and symbol names below are
   as at `1f067a8`; follow the renames:
   - 15: Card becomes Booking. The names this doc uses at `1f067a8` map as 15's name table says, in
     particular: `store/cardActions.ts` becomes `store/bookingActions.ts` (`createCard`, `copyCard` become
     `createBooking`, `copyBooking`); `shared/card/CardDetailBody` becomes `shared/booking/BookingDetailBody`;
     `validateCardForBilling.ts` becomes `validateBookingForBilling.ts`; `buildInvoicesForCard` and
     `buildPrePaymentInvoiceForCard` take `Booking`; **`cardFee` is already `bookingFee`** (with
     `BookingFeeTotals`), so item 7 reshapes that function rather than adding a second one; seed
     `cards.ts` becomes `bookings.ts`; the markers `splitBillingCard` and `bariatricType3Card` end in
     `Booking`; refusal `cardCancelled` becomes `bookingCancelled`; routes `…/cards/:cardId` become
     `…/bookings/:bookingId`. Confirm Copy now makes a skeleton-only new Booking whose one Procedure is
     its own primary, not `isAdditional: true` (FT-03.2's copy point). If it does not, fix it here in
     item 8a.
   - 18: the Contract shape (category, holder, scope, pricing basis) and `FeeScheduleLine`, which
     replaced `ContractPrice`. 18 kept `FeeScheduleLine.procedureOrdinal` as a labelled interim for the
     bariatric row (`CP-BAR-3`, holder code `BAR-HER2`, 49120 ordinal 2, $950), and
     `matchFeeScheduleLine` still takes `procedureOrdinal` and `isAdditional` keys ("an additional
     procedure takes a line only if the line sets an ordinal"). Item 2 removes all three.
   - 19: `baseUnits.ts` (`resolveBaseUnits` and its `contractBaseUnits` slot), `BtmBreakdown.baseSource`,
     the modifier master as store data, `RvgGroupRef`, `groupsOfCode`, and `feeParity.test.ts`.
   - 20: each Procedure selects its own Contract; how `addProcedure` now picks the new Procedure's
     Contract.
   - 21: `isScheduleMiss`, which Phase 21 left untouched for additional Procedures.
   - 22: the Contract-driven invoice line format, and the covered-amount split and its guard.
4. Record the current `PERSIST_VERSION` (13 at `1f067a8`; 14 to 22 will have bumped it).

## Reference

**Design (convention 17).** Capture follows `docs/design/Mobile App.dc.html` screen 3 (the procedure
code card, the ASA segmented card, the B / T / M stepper rows with their seeded captions, the modifier
chips) and its web twin in `Web Dashboard.dc.html`'s card anatomy. The Booking total, Review row and
per-procedure breakdown follow `Admin Review.dc.html` (mono tabular units, the TOTAL UNITS block, row
flags). The pill shape (`r-pill`), the accent tint note and the tokens come from
`Design Language.dc.html`. The design has no provisional badge: "Provisional" and "Proposed" markers
are small neutral pills, as Phases 19 and 22 do (not `DemoBadge`, which means demo simulation). Teal is
the only action colour: "Make primary" is a teal text action beside Edit. The "Primary" marker is a
neutral pill, never crimson and never a status colour. No mockup covers
the Contract editor; extend the existing `ContractEditSheet` sections and the Admin Review table
anatomy.

**Catalogue.** The files linked above, plus
[US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md)
(add additional Procedures, each with its own Contract; built in 20),
[US-03.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.3.md)
(recorded start and handover times),
[US-02.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.3.md)
(Copy a Booking, built in 15) and
[US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md)
(fixed fee schedule lines). `domain-model.md` sections "Procedure", "Contract (recommended structure)"
(the `multiProcedureRule` and `baseUnitOverrides` rows) and "3. Calculation rules". The catalogue
screenshots on US-03.2.1 and US-05.3.1 show the superseded "time units only" captions; they are stale,
not a spec.

**Analysis.** `../GAP-ANALYSIS.md`: theme 6 (multi-procedure rule and adjustment split), the DM-13 row of
"Structural changes", the RV-02 row of "Prototype behaviour to remove or rework", the "Booking detail"
line of the demo-trigger summary, and the EP-03, EP-04 and EP-05 tables. `../epics/EP-03.md` (FT-03.2,
US-03.2.1, US-03.2.2), `../epics/EP-04.md` (US-04.2.5, US-04.2.2) and `../epics/EP-05.md` (FT-05.3,
US-05.3.1, US-05.3.4, US-05.3.5). `../analysis/domain-model-delta.md#dm-13` (and DM-08, which moves
`procedureOrdinal` onto the Contract's rule), `../analysis/reverse-check.md` (RV-02, and RV-03 for the
copy history). Code maps: `../analysis/prototype-map-domain.md` (section 5, billing maths),
`prototype-map-shared.md` (capture suite, card body, flows), `prototype-map-admin.md` (Review, Master data
contracts), `prototype-map-store-seed.md` (card actions, seed cards and contracts) and
`prototype-map-shell-demo-pwa.md` (the PWA sheet and `pwaPurity`).

**Code entry points (at `1f067a8`; follow the renames from 15 to 22).**

- Types: `src/domain/types.ts`. `Procedure` (444; `isAdditional` at 484, with the RFP comment at 482),
  `Contract` (216), `ContractPrice` (250; `procedureOrdinal` at 256), `BillingLine` (518),
  `CapturedUnits`/`UnitProvenance`.
- Fee maths: `src/domain/billing/fee.ts`. `resolveBtm` (58), `splitBillingUnits` (107, the rule to
  remove), `FeeContext.procedureOrdinal` (125), `feeFor` (180), the Type 3 additional fallback (206 to
  214), the "time units only" line description (227 to 229). `contracts.ts` `matchContractPrice`
  (ordinal key, 66 and 96). Phase 19's `baseUnits.ts`.
- Fee callers, every one of which passes an ordinal today:
  - `validateCardForBilling.ts` `feeContextFor` (77) and the conservation checks (239, 249);
  - `invoiceBuild.ts` `buildInvoicesForCard` (264; the per-procedure loop from 276, `feeContextFor` at
    289) and `buildPrePaymentInvoiceForCard` (456; 484);
  - `store/billingLineActions.ts` (175, 260);
  - `shared/capture/feeContext.ts` (`procedureFee`, `cardFee`) and its exports in `shared/capture/index.ts`
    (6); comments naming them in `shared/capture/CardTotalPanel.tsx` (21) and `shared/surface/context.ts`
    (45, 47);
  - `shared/capture/BtmCaptureBlock.tsx` (93), `shared/card/CardDetailBody.tsx` (`cardTotals` 192,
    `cardBreakdown` 206 to 246, the "Time units only" note at 230), `shared/flows/FunderAllocationSheet.tsx`
    (59, or whatever 22 left in its place), `shared/card/OfficeBillingSetup.tsx` (`ordinal` prop);
  - `apps/admin/screens/ReviewScreen.tsx` (69 to 99, `primary = procs[0]` at 76),
    `apps/admin/reviewFlags.ts` (`naturalBtm` 53), `apps/web/screens/ListDetailView.tsx` (69, 75);
  - `domain/seed/billing.ts` `contextFor` (81), which feeds `buildPrePaymentInvoiceForCard` (148).
- Store: `src/store/cardActions.ts`. `createCard` (first Procedure at 133), `copyCard` (179 to 245),
  `addPostOpAddendum` (270; its Procedure at 342, `isAdditional: false`), `addProcedure` (394 to 445),
  `removeProcedure` (474 to 525; the by-position guard at 491 to 500). These four are the only places a
  Procedure is created. `store/lifecycle.ts` `editRefusal` (48; integration actors may edit DRAFT only)
  and `editProcedure` (445). Every capture write (`AsaCard`, `ModifierChips`, `UnitsCard`,
  `ProcedureCodeCard`) goes through `editProcedure`; `ProcedureCodeCard.pick` (39) sends
  `baseUnitsSelected: undefined, baseUnitsCaptured: undefined` with a code change. `store/contractActions.ts` (`editContract` 106, `addContractPrice` 200 with the ordinal at 217).
  `store/integrationActions.ts` `integrationActor(feedId)` (45, private, labels from `FEED_META`);
  `domain/integrations/feeds.ts` (the feed configs at 82 to 84 carry `hospitalId`: St George's,
  Christchurch Public and Southern Cross only).
- Capture (shared by mobile, web and admin): `UnitsCard.tsx` (`isAdditional` prop; B and M captions at
  59 and 77), `BtmCaptureBlock.tsx` (the header with "PROCEDURE n", Edit and Remove at 123 to 180; the
  additional note at 209 to 214; `AsaCard` disabled at 217), `ModifierChips.tsx`, `AsaCard.tsx`,
  `ProcedureCodeCard.tsx` (the range row). `src/shared/flows/RemoveProcedureSheet` is the pattern for the
  new confirm sheet.
- Admin: `src/apps/admin/flows/ContractEditSheet.tsx` (sections at 150 to 195; the price rows with the
  ordinal input at 225 to 280), `apps/admin/screens/MasterData.tsx` (the Contracts table).
- Seed: `domain/seed/cards.ts` (the `addProcedure` spec helper with `isAdditional` at 244 and 255; the
  Holt split Booking at 516 to 545; the bariatric Booking at 675 to 695), `seed/history.ts` (229),
  `seed/audit.ts` (95), `seed/contracts.ts` (`CONTRACT`, `CONTRACTS`, `CP-BAR-3` at 143),
  `seed/index.ts` (the `splitBillingCard` scenario text at 558 to 563 and the `bariatricType3Card` text at
  582 to 587, "second procedure priced by the ordinal rule"), `billing/fixtures.ts` (38).
- Copy and labels: `shared/audit/fieldLabels.ts` (50, 101), `shared/audit/actionLabels.ts`,
  `apps/demo/DemoControlPanel.tsx` (S3 scenario text at 395 and 407).
- Triggers: 14's `src/shared/demoTriggers/registry.ts` and the PWA sheet.
- Tests to rework: `fee.test.ts` (70 to 160), `contracts.test.ts` (66 to 102), `invoiceBuild.test.ts`
  (226 to 233, 364), `store/billingRun.test.ts` (198), `captureActions.test.ts` (283 to 291),
  `cardActions.test.ts` (69, 162), `store/btmCapture.test.ts` (63, 140), `domain/seed/seed.test.ts` (284),
  `apps/admin/reviewFlags.test.ts` (31), `src/pwa/pwaPurity.test.ts` (must stay green). Playwright (all in
  `aa-prototype/visual/`): `mobile-phase04.spec.ts`, `admin-phase08.spec.ts`,
  `card-calculation-display.spec.ts`, `pwa-device.spec.ts`.

## Work items

Model, pure engine and seed first, then store, then UI. Every write goes through `mutate()` with an audit
meta. Every rule is a pure function in `src/domain/billing/` with a Vitest test.

1. **Baseline the figures (before any edit).** Regenerate Phase 19's `feeParity.test.ts` fixture from the
   code as it stands. Add a census test beside it that lists every seeded Booking with more than one
   Procedure: its Procedures, their Contracts, each one's modifier inputs, and the Booking's modifier
   total. At `1f067a8` there are two, the Holt pair (Forte, AS2 on both) and the bariatric pair (Doyle,
   AS3 on both), each with a primary total of 4 or fewer.
   - At the end of the phase the fixture may differ only for the new seeded three-procedure Booking.
     Every other figure is unchanged, S3's Holt $396.18 included, because under this phase's reading
     (modifiers recorded once, on the primary) neither pair has more than 4 modifier units.
   - List any other difference in the PROGRESS entry with its reason. None is expected.

2. **Model** (`src/domain/types.ts`), for DM-13, FT-03.2, US-04.2.5 and the US-04.2.2 override half.
   - `Procedure.isAdditional: boolean` becomes `Procedure.isPrimary: boolean`. Rewrite the doc comment
     from the RFP split-billing rule to the catalogue rule.
   - New `MultiProcedureRule`, a discriminated union:
     `{ kind: 'rvgDefault' } | { kind: 'secondCodePercent'; percent: number } | { kind: 'addOnFee'; amount: number } | { kind: 'notBillable' }`.
     `Contract.multiProcedureRule: MultiProcedureRule` is **required**, so the compiler finds every
     Contract literal. The amount is GST exclusive, like every stored price.
   - New `ContractBaseUnitOverride { id; target: { kind: 'code'; code: string } | { kind: 'group'; group: RvgGroupRef }; baseUnits: number }`
     (`RvgGroupRef` from 19). `Contract.baseUnitOverrides: readonly ContractBaseUnitOverride[]`,
     required, usually empty.
   - Remove `procedureOrdinal` from 18's `FeeScheduleLine` (`ContractPrice` at `1f067a8`), and remove
     both the `procedureOrdinal` and the `isAdditional` keys from `matchFeeScheduleLine`'s query
     (`matchContractPrice` at `1f067a8`). Position no longer means anything once the primary is a flag.
     The matcher is called for the primary only, and for an additional Procedure only inside the
     percent rule's standalone price (item 4); an additional Procedure never takes a schedule line
     directly. The seeded use moves to the bariatric Contract's rule (item 9).
   - `allocateId` gains a `baseUnitOverride` kind.

3. **The multi-procedure allocation, pure** (new `src/domain/billing/multiProcedure.ts`), for FT-05.3,
   US-05.3.1 (AC "Modifier split") and US-03.2.1.
   - `primaryOf(procedures)` returns `{ kind: 'ok'; primary }`, or `{ kind: 'noPrimary' }` or
     `{ kind: 'severalPrimaries'; ids }`. The store guarantees exactly one; the engine refuses the other
     two cases rather than guessing.
   - `MODIFIER_SPLIT_THRESHOLD = 4`, commented as the catalogue value.
   - `allocateModifierUnits(total, participantIds, primaryId)` returns a record of shares.
     - `total <= 4`: all on the primary, 0 on the rest.
     - Otherwise each participant gets `floor(total / n)` and the primary also gets `total mod n` (the
       OQ-15 reading).
     - Only the primary may be the single participant, which gives it everything.
   - **Who takes part (a picked reading, provisional under OQ-15).** The participants are the primary
     plus every additional Procedure whose own Contract's rule is `rvgDefault`. An additional Procedure
     whose Contract replaces the rule is priced wholly by that rule and takes no modifier share, so its
     share is not lost; it stays with the others. With every Procedure on the RVG default (the usual
     case) this is exactly the catalogue's "split equally across every Procedure in the Booking".
   - `ProcedureAllocation { role: 'primary' | 'additional'; rule: MultiProcedureRule; modifierShare: number; bookingModifierUnits: number; splitAcross: number }`.
     `splitAcross` is 1 when nothing was split.
   - `allocateBooking(procedures, ruleFor, bookingModifierUnits)` returns the allocation for every
     Procedure.
   - Tests (`multiProcedure.test.ts`), every worked example written out:
     - 0 units over 3: 0/0/0. 4 over 3: 4/0/0 (at the threshold, all on the primary).
     - 5 over 2: 3/2. **7 over 3: 3/2/2** (the catalogue example). 6 over 4: 3/1/1/1. 8 over 4: 2/2/2/2.
     - 5 over 6: 5/0/0/0/0/0 (every share rounds to 0, the remainder is all of it). 9 over 1: 9.
     - The primary gets the remainder wherever it sits in Booking order (first, middle or last).
     - 7 over 3 with the third Procedure on an add-on-fee Contract splits over 2: 4/3, and the third gets
       0.
     - The shares always sum to the total.
     - No primary and two primaries are refused.

4. **`feeFor` prices one Procedure from its allocation** (`fee.ts`), for FT-05.3, US-05.3.1, US-05.3.4
   and RV-02.
   - `FeeContext.allocation: ProcedureAllocation` is **required**. `FeeContext.procedureOrdinal` is
     removed. The compiler then finds every caller for item 7.
   - `resolveBtm` keeps reading each Procedure's own inputs. On an additional Procedure base is 0 with a
     new 19 `baseSource` value `'additional'`, whatever its code, range choice or stored capture. On the
     primary, `btm.modifiers` is the Booking's modifier total (computed from the primary's ASA and
     selected codes, absorption checked against the primary's base code, or its manual capture). An
     additional Procedure's own modifier inputs are ignored: the store forbids them (item 8e), and the
     engine must not count them twice if old data carries them.
   - `splitBillingUnits` is deleted. Charged units are B + T + modifier share on the primary, and T +
     modifier share on an additional Procedure under `rvgDefault`.
   - Additional Procedure under its Contract's rule:
     - `rvgDefault`: T + share at the Contract's unit rate. On a fixed-schedule Contract that has no unit
       rate, at the anaesthetist's own unit value. This is today's fallback with new wording, and it is
       never a schedule miss (check 21's `isScheduleMiss` skips additional Procedures).
     - `secondCodePercent`: `percent` of the Procedure's standalone price, rounded to cents. The
       standalone price is what it would charge as the only Procedure on its Contract: its schedule
       line on a fixed-schedule Contract, otherwise its own base units (from the resolver, including the
       Contract override) plus its own time units at the Contract's rate, with no modifiers. This is a
       picked reading of "a percentage of the second procedure's own code"; log it.
     - `addOnFee`: the amount, as one fixed line.
     - `notBillable`: no anaesthesia line and a result flag `notBillable: true`.
     - In every case, captured non-RVG billing lines on that Procedure still bill: the rule prices the
       anaesthesia component only. Log it.
   - A primary on a fixed-schedule Contract charges its line price. Its modifier share is included in
     that price, so the units show but add no dollars. This is the existing reading, restated.
   - Line descriptions, which reach invoice lines (inside 22's line format), with no dashes. A
     single-Procedure Booking keeps exactly the description 22 left, so no single-procedure invoice,
     snapshot or spec changes. With two or more Procedures:
     - primary: "Anaesthesia, primary procedure (B 6 + T 6 + M 3 units)", and when split,
       "(B 6 + T 6 + M 3 of 7 units)";
     - additional: "Anaesthesia, additional procedure (T 2 + M 2 of 7 units)", or "(T 2 units)" with no
       share;
     - "Additional procedure, 50% of 49120 standalone";
     - "Additional procedure, add-on fee".
   - `FeeResult` gains `allocation` (echoed) and `notBillable`. `billableUnits` means the units charged
     at a rate, which is 0 for the percent, add-on and not-billable rules.
   - The typed office price override still applies per Procedure after the rule. Phase 24's
     anaesthetist adjustment will slot in before it.

5. **The Booking-level engine** (new `src/domain/billing/bookingFee.ts`).
   - `bookingFeeFor(procedures, ctxFor)`. `ctxFor(procedure)` returns that Procedure's `FeeContext`
     without an allocation, so `invoiceBuild` can inject each Procedure's resolved Contract.
   - Pass 1 resolves B/T/M per Procedure and takes the Booking modifier total from the primary. Pass 2
     reads each additional Procedure's rule from its context's Contract, calls `allocateBooking`, and
     then calls `feeFor` for each.
   - It returns `{ kind: 'ok'; primaryId; allocations; fees: Record<ProcedureId, FeeResult>; units; total }`,
     or `{ kind: 'structural'; reason: 'noPrimary' | 'severalPrimaries' }`.
   - Export both new modules from `billing/index.ts`.
   - Tests (`bookingFee.test.ts`), dollar figures pinned from a hand calculation written in the test:
     - The seeded three-procedure example (item 9) at Dr Souter's $26.50: 20941 primary, 49120 and 49115
       additional, AS3 + OB3 + P1 = 7 modifier units. Base only on 20941, each Procedure's own T, M
       3/2/2, and the total.
     - The same Booking after making 49115 primary: base 5 instead of 6, modifiers still 3/2/2 but the 3
       now on 49115, and absorption re-checked against 49115.
     - Holt: the same total as today (the primary's AS2 is 1 unit, so nothing splits), and the invoice
       still $396.18 in `invoiceBuild.test.ts`.
     - The bariatric Booking under `addOnFee` $950 gives the same $2,800 + $950 as today's ordinal row.
     - `secondCodePercent` 50 on a units Contract and on a fixed-schedule Contract.
     - `notBillable`: $0 anaesthesia, but a captured fixed line on that Procedure still bills.
     - A manual M capture on the primary is the total that splits.
     - A single-Procedure Booking is unchanged from today's single-procedure figures (the parity fixture
       proves it at scale).
     - The structural refusals.

6. **The Contract base-unit override** (US-04.2.2 AC "Base units", US-05.1.6 AC3, OQ-06 interim).
   - A pure `contractBaseUnitsFor(contract, code, masters)` in 19's `baseUnits.ts`. A code target beats
     an AA-group target, which beats a site-group target. It returns `undefined` when nothing matches.
   - Every fee-context assembler passes it into 19's resolver as `contractBaseUnits`, for the Procedure's
     own Contract and code. It matters only on the primary, and in the percent rule's standalone price.
     The precedence stays manual override, then Contract, then Procedure master, then the RVG guide.
   - The B caption source `'contract'` reads "Set by the Contract" (19 left the string for this phase).
   - Tests (extend `baseUnits.test.ts`):
     - a code override beats a group override;
     - a group override matches through `groupsOfCode`;
     - the override beats the master and the guide;
     - a manual capture beats the override;
     - an override on an additional Procedure's Contract changes nothing unless its rule is
       `secondCodePercent`.

7. **Rewire every fee caller onto `bookingFeeFor`.** No pricing path may read a position afterwards.
   - `validateCardForBilling.ts`:
     - `feeContextFor(procedure, ctx)` loses its ordinal, and the conservation checks price through
       `bookingFeeFor`;
     - a structural result is a failure on field `isPrimary`: "This Booking needs exactly one primary
       procedure";
     - the ranged base code's "choose a value" rule (as 19 left it) applies to the primary only, because
       base is never charged on an additional Procedure.
   - `invoiceBuild.ts`:
     - `buildInvoicesForCard` resolves every Procedure's Contract first, then prices the Booking once
       with `bookingFeeFor` using the resolved Contracts, then keeps its grouping, covered-amount (22)
       and prepayment netting per Procedure;
     - a structural result is exception `noPrimaryProcedure`;
     - a `notBillable` Procedure contributes no anaesthesia line (its captured lines still do);
     - `buildPrePaymentInvoiceForCard` prices through the same engine.
   - `store/billingLineActions.ts` (both guards) and `seed/billing.ts` `contextFor`.
   - `shared/capture/feeContext.ts`:
     - 15 already renamed `cardFee` to `bookingFee` (positional arguments, units and total only). This
       phase reshapes it to `bookingFee({ procedures, list, masters, billingLines })` and deletes
       `procedureFee`. It returns `{ units, total, views: Record<ProcedureId, ProcedureFeeView> }`
       (`BookingFeeTotals` grows to this), and each view carries its `fee`, `allocation`, `baseCode`,
       `contract` and `nonRvgLines`;
     - update the `shared/capture/index.ts` exports and the comments in `CardTotalPanel` (15's
       `BookingTotalPanel`) and `shared/surface/context.ts`;
     - `bookingFee` is the one UI assembler, and it must stay in step with `feeContextFor`.
   - UI callers: `CardDetailBody`, `BtmCaptureBlock` (a `view` prop, no own pricing),
     `FunderAllocationSheet` (or 22's successor), `OfficeBillingSetup` (the `ordinal` prop and the
     "procedure {ordinal}" heading go; it reads "primary procedure" or "additional procedure"),
     `ReviewScreen`, `ListDetailView` and `reviewFlags` (`naturalBtm` keeps working per Procedure; the
     flags take the view's fee).
   - Grep `ordinal`, `procedureOrdinal`, `isAdditional` and `splitBillingUnits` across `src/`. Only
     display numbering ("Procedure 2" labels) may remain.

8. **Store actions.**
   - a. **Creation keeps exactly one primary.**
     - `createCard` (15's `createBooking`) creates its first Procedure with `isPrimary: true`, and so
       does 15's skeleton Copy (confirm; fix here if 15 left `isAdditional: true`).
     - `addProcedure` creates `isPrimary: false`. It inherits the funding context from the **primary**,
       not from index 0 (or follows 20's own default-Contract rule if 20 replaced inheritance).
     - The integration create paths (`integrationActions.ts` 150 and 464) and the photo and manual flows
       go through `createCard`, so they inherit this.
     - `addPostOpAddendum` creates its Procedure with `isPrimary: true` (the addendum is its own
       Booking until Phase 39 replaces it).
   - b. **`setPrimaryProcedure(api, actor, procedureId)`** in `store/bookingActions.ts` (15's rename of
     `cardActions.ts`), exported from `store/index.ts`. It serves US-03.2.2 and US-03.2.1.
     - Guard order: `notFound`, then `bookingCancelled` (`cardCancelled` at `1f067a8`), then `editRefusal` (AUTHORISED is locked; the
       anaesthetist needs their own DRAFT; an integration actor needs DRAFT; the office has DRAFT and
       SUBMITTED), then `bookingCompleted` for the anaesthetist only ("This Booking is marked complete.
       Amend it before changing the primary procedure."; the office corrects completed Bookings at
       review, as it does other fields), then `alreadyPrimary`.
     - One `mutate()`, two `procedure.setPrimary` metas (old and new, before and after), stamping the
       Booking. The audit source is the actor's, so a feed writes `integration`.
     - The effect:
       - the flags swap;
       - the Booking's modifier inputs (`asaClass`, `selectedModifierCodes`, `modifierUnitsCaptured`)
         move from the old primary to the new one, so modifiers stay one set per Booking;
       - a manual base override (`baseUnitsCaptured` overridden) on the old primary is cleared and kept
         in the audit `before`, because it was a judgement about that Procedure as primary;
       - the new primary's base comes from the resolver for its own code. If its code is ranged with no
         value chosen, completion then asks for one; that is correct and needs no special case.
     - Returns `{ previousPrimaryId }`.
   - c. **`removeProcedure` guards by flag, not position.** It refuses `primaryProcedure`: "The primary
     procedure cannot be removed. Make another procedure primary first, or cancel the Booking if the
     whole booking is wrong." The 2026-07-27 ruling (no silent promotion) is carried forward: removal
     never promotes anything, and the user promotes explicitly.
   - d. `ProcedurePatch` omits `isPrimary`. `editProcedure` refuses an `isPrimary` key with
     `usePrimaryAction` ("Use Make primary to change the primary procedure.") as a defensive guard for
     untyped callers.
   - e. **Structural enforcement on additional Procedures** (US-05.3.1 "enforced structurally, not just
     as a UI hint"). `editProcedure` refuses:
     - `baseUnitsCaptured` or `baseUnitsSelected` on an additional Procedure, with
       `additionalProcedureBase`: "Base units are charged on the primary procedure only.";
     - `asaClass`, `selectedModifierCodes` or `modifierUnitsCaptured` on an additional Procedure, with
       `modifiersOnPrimary`: "Modifiers are recorded once for the Booking, on the primary procedure."
     - Only a value is refused. Clearing a key (`undefined`, or `[]` for `selectedModifierCodes`) is
       allowed, because `ProcedureCodeCard.pick` sends `baseUnitsSelected: undefined, baseUnitsCaptured:
       undefined` with every code change, and changing an additional Procedure's code must keep working.
       Test both.
   - f. **Contract actions** (`contractActions.ts`), office-only and audited, returning `Outcome`:
     - `setContractMultiProcedureRule(contractId, rule)`: the percent must be over 0 and at most 100,
       and the amount over 0;
     - `addContractBaseUnitOverride(contractId, target, baseUnits)`: the target must exist in the
       masters, and the units must be a positive integer. A duplicate target is refused. A group override
       that disagrees with another group override on the same Contract for a shared code is refused with
       `overrideOverlap`, naming the code;
     - `removeContractBaseUnitOverride(contractId, overrideId)`.
     - `addContractPrice` (or 18's line action) drops the ordinal.
     - Before 25's lock, an edit re-prices unlocked Bookings on that Contract, and AUTHORISED invoices
       keep their snapshots. Say so in a test.
   - Tests (extend `cardActions.test.ts` and `captureActions.test.ts`; add
     `store/multiProcedureActions.test.ts`):
     - create, add, copy, post-op addendum, remove and set-primary each leave exactly one primary;
     - set-primary moves the modifier inputs and clears the old base override, with both audit entries;
     - every guard in order;
     - an integration actor succeeds on DRAFT and is refused on SUBMITTED with `integrationImmutable`;
     - the anaesthetist is refused on a completed Booking, and the office is not;
     - removing the primary is refused, and removing an additional Procedure still cascades its lines;
     - the `editProcedure` refusals, and that a code change (which clears base keys) on an additional
       Procedure still succeeds;
     - the Contract rule and override guards and audits;
     - a rule edit re-prices a DRAFT Booking's fee.

9. **Seed.** One `PERSIST_VERSION` bump for the phase. Draw nothing new from the seeded RNG, and do not
   call `takePatient()` for new data: it shifts every later draw. The parity fixture proves both.
   - a. `cards.ts`: the spec helper's `isAdditional` becomes `isPrimary`, true for a Booking's first
     Procedure unless the spec says otherwise. The additional Procedures of the Holt and bariatric
     Bookings lose their `asaClass` (ASA is recorded once, on the primary). `history.ts`, `audit.ts` and
     `fixtures.ts` follow.
   - b. `contracts.ts`: every Contract gets `multiProcedureRule: { kind: 'rvgDefault' }` and
     `baseUnitOverrides: []`, except:
     - the Doyle bariatric Contract gets `addOnFee` $950, and the `CP-BAR-3` ordinal row is deleted (the
       census and parity tests show the figure is unchanged);
     - SXAP gets `secondCodePercent` 50, as the domain model says SXAP does (unit values demo-plausible,
       labelled). The census must show no seeded multi-procedure Booking on SXAP; if one exists, list its
       figure change;
     - one Contract base-unit override for demo, on a code that no seeded Procedure on that Contract uses
       (the seed test proves it matches nothing), so the editor has a row to show without moving a
       figure.
   - c. **The seeded three-procedure Booking**, spec in a new `src/domain/seed/multiProcedureDemo.ts` and
     shared with the trigger in item 13 (`MULTI_PROCEDURE_DEMO`: codes, time offsets, modifiers, patient).
     - Procedures: 20941 laparoscopic cholecystectomy as primary (ASA III, BMI 35 to 40, non-supine; AS3
       + OB3 + P1 = 7 units at the demo-plausible values), then 49120 umbilical hernia repair and 49115
       inguinal hernia repair as additional Procedures, same anaesthetic, each with its own times. If 19's
       master changed any of these units, pick codes that still sum to 7.
     - Every Procedure is on the List hospital's protected default Contract (RVG default).
     - Patient: one new fixed patient with an explicit id, never from the generated pool.
     - List: a past Souter List that no S1 to S5 beat uses. Confirm with a one-off seed query at the drift
       check, and put the choice in the PROGRESS entry. Leave the List SUBMITTED (with its `list.submit`
       audit) and the Booking completed, so it sits in the Review queue and can be authorised to show
       invoice lines.
     - Build it after every existing seeded Booking, so its Booking, Procedure, patient and audit ids are
       allocated last and no existing seeded id moves. The seed test asserts the existing ids are
       unchanged.
     - Check the Review queue: it gains exactly this one row. "Next in queue" from Souter Mon 20 AM must
       still land on Mon 20 PM (S3 Beat 1), and no scripted count may move.
     - Add `scenario.multiProcedure` to the seed ids.
     - Replace the `splitBillingCard` (15's `splitBillingBooking`) scenario detail ("Second procedure
       isAdditional: time units only") with "Additional procedure: its own time units, base on the
       primary only, modifiers on the primary (4 or fewer)". Replace the `bariatricType3Card` detail
       ("second procedure priced by the ordinal rule") with "additional procedure priced by the Contract's
       $950 add-on rule". Add a `multiProcedureBooking` entry: "Three procedures, 7 modifier units, split
       3 · 2 · 2".
   - d. `seed.test.ts`:
     - exactly one primary in every Booking with Procedures;
     - no additional Procedure carries base or modifier inputs;
     - every Contract has a rule;
     - the three-procedure Booking allocates 3/2/2;
     - bariatric is $950 by rule and `CP-BAR-3` is gone;
     - the demo override matches no seeded Procedure;
     - the parity fixture holds except for the new Booking.

   **Session 1 ends here, green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, with the parity
   fixture diff limited to the new Booking.

10. **Capture UI, shared by mobile, web and admin** (US-03.2.1, US-03.2.2, US-05.3.1).
    - a. **`BtmCaptureBlock` header.** When the Booking has more than one Procedure:
      - the primary shows a neutral "Primary" pill beside its "PROCEDURE n" label
        (`data-shot="procedure-primary-pill"`);
      - each additional Procedure shows a teal "Make primary" text action beside Edit
        (`data-shot="make-primary"`). It is offered under the same rule as Edit, and hidden for the
        anaesthetist on a completed Booking;
      - "Remove" shows only on additional Procedures, by flag.
      - Blocks keep stable Booking order, so nothing jumps when the primary moves; the pill moves.
    - b. **`MakePrimarySheet`** (new, `src/shared/flows/`, through `useSurface().Overlay`, so it is a
      bottom sheet on mobile and a dialog on desktop), modelled on `RemoveProcedureSheet`.
      - Title: "Make this the primary procedure?"
      - Body: "Base units will come from {code} {description}. The Booking's modifiers move to this
        procedure. {old description} becomes an additional procedure and stops carrying base units." Add
        "Its manual base adjustment is cleared." only when there is one.
      - Actions: a teal "Make primary" and a secondary "Keep {old description}". It calls
        `setPrimaryProcedure`; a refusal shows in the sheet.
    - c. **The additional note** (the accent tint note, same place):
      - under `rvgDefault`: "Additional procedure. Base units are charged on the primary procedure only.
        It earns its own time units, and an equal share of the Booking's modifiers once they total more
        than 4."
      - when its Contract replaces the rule: "Additional procedure. {Contract} prices additional
        procedures by its own rule: {50% of this procedure's own code | a fixed add-on fee | not
        billable}."
      - No dollar amount on any anaesthetist surface (the 2026-09-28 ruling).
    - d. **ASA and modifiers on an additional Procedure.** `AsaCard` and `ModifierChips` are not rendered.
      One caption row replaces them: "Modifiers are recorded once for the Booking, on the primary
      procedure." `ProcedureCodeCard` hides the range chooser on an additional Procedure and reads "Base
      not charged on an additional procedure".
    - e. **`UnitsCard` takes `allocation` in place of `isAdditional`.**
      - Primary B row: 19's captions, including "Set by the Contract".
      - Additional B row: 0, caption "Base units are on the primary procedure", no stepper.
      - T row: unchanged on every Procedure.
      - Primary M row: the Booking total (what its stepper edits). Its caption is the breakdown, plus
        "Booking total 7, split 3 · 2 · 2. This procedure carries 3." when split.
      - Additional M row: its share, with "Share of the Booking's 7 modifier units", or "None · the
        Booking's 3 modifier units stay on the primary" at 4 or fewer, or "Not shared · priced by the
        Contract's rule". No stepper.
    - f. Mobile, web and admin share these components, so there is one change for all three, and the PWA
      gets it through the shared capture.

11. **The Booking total, Review and invoices (office).**
    - a. `CardDetailBody` `cardBreakdown` builds its rows from `bookingFee`. The row notes are:
      - "Primary · B + T + M 3 of 7";
      - "Additional · T + M 2 of 7";
      - "Additional · 50% of own code";
      - "Additional · add-on fee";
      - "Additional · not billable".
      "Time units only" is deleted. The history entity labels read "Primary · {description}" and
      "Additional · {description}". Hook: `data-shot="booking-total-split"`.
    - b. The anaesthetist surfaces stay fee-free: grep that no `bookingFee(...).total` reaches mobile or
      anaesthetist web output (the mobile `CardTotal` still renders nothing).
    - c. `ReviewScreen`:
      - the row's `primary` is the `isPrimary` Procedure;
      - a multi-procedure row's BTM cell adds "M 7 · split 3 · 2 · 2" (mono, tabular);
      - the per-procedure detail shows each share;
      - `entityLabels` use Primary and Additional.
    - d. Invoice lines carry item 4's descriptions inside 22's layout. Confirm that each line shows its
      own Procedure's units and amount (US-05.3.5 still matches).
    - e. `ListDetailView` (web) and any other row that shows "the operation" through `procs[0]` use the
      primary's description. Grep `[0]?.description` and `procs[0]`.

12. **The Admin Contract editor** (`ContractEditSheet` in 18's shape), for US-04.2.5, US-05.3.4 and the
    US-04.2.2 override half.
    - a. **An "Additional procedures" section.**
      - A segmented control: "RVG default · % of own code · Add-on fee · Not billable".
      - A percent or amount field when the option needs one (mono).
      - The RVG default caption: "Base on the primary only, time on every procedure, modifiers split
        equally above 4 units with the remainder to the primary."
      - A neutral "Proposed" pill on the three non-default options (US-04.2.5 and US-05.3.4 are Proposed).
      - It saves through `setContractMultiProcedureRule`. Hook: `data-shot="contract-multi-procedure-rule"`.
    - b. **A "Base unit overrides" section**, shown for the RVG-unit pricing bases and hidden for fixed
      schedule and rate by time.
      - A table: Code or group (mono code, or a neutral group pill), Guide or master value (for
        reference), Contract value (mono), and Remove.
      - "Add override" opens an inline row: target (RVG code · RVG group), a searchable select and a
        base-units stepper. Refusal sentences show inline.
      - The OQ-06 provisional note. Hook: `data-shot="contract-base-overrides"`.
    - c. The fee-schedule rows lose the ordinal input and the "· ordinal n" text.
    - d. The Master data Contracts table gains an "Additional procedures" column in neutral text ("RVG
      default", "50% of own code", "$950 add-on", "Not billable").

13. **Demo triggers** (registry entries in 14's `src/shared/demoTriggers/registry.ts`; bodies in a new
    `src/store/demoMultiProcedure.ts`, so `pwaPurity` holds). See "Demo triggers" below for labels and
    effects.
    - `stageMultiProcedureBooking(api)` reuses `MULTI_PROCEDURE_DEMO` and the real store actions:
      `createCard`, `addProcedure` twice, then `editProcedure` for codes, times and modifiers (modifiers
      on the primary only, so item 8e never refuses it). It uses a demo actor (office role, audit source
      `demo`), added to 14's `src/store/demoActors.ts` beside `OFFICE_ACTOR`. It is idempotent per List.
    - `feedSwapsPrimary(api, bookingId)` calls `setPrimaryProcedure` with an integration actor for the
      List's hospital: the feed config in `domain/integrations/feeds.ts` whose `hospitalId` is the List's
      hospital gives the `FEED_META` label; any other hospital gets `{ who: 'Hospital feed', role:
      'system', source: 'integration' }`. Export a small helper from `integrationActions.ts` for this
      rather than duplicating `integrationActor`. It targets the next Procedure after the current primary
      in Booking order, cycling.
    - Vitest (`demoMultiProcedure.test.ts`):
      - both bodies are deterministic;
      - the loader refuses a second load on the same List;
      - the feed swap is audited with source `integration` and refused on a SUBMITTED List;
      - both entries' `disabledReason` strings;
      - the new ids are unique in the registry test.

14. **Copy, labels and scenario text sweep.**
    - Grep `src/` for "time units only", "Time units only", "Not charged on an additional procedure",
      "stay on the first", "first procedure", "split-billing", "split billing", "isAdditional" and
      "ordinal", and update each.
    - Labels: `fieldLabels` gets `isPrimary: 'Primary procedure'`, `multiProcedureRule: 'Additional
      procedure rule'` and `baseUnitOverrides: 'Base unit overrides'`; `procedureOrdinal` is removed.
      `actionLabels` gets `procedure.setPrimary: 'Primary procedure changed'` and the two Contract
      actions.
    - `DemoControlPanel.tsx` S3 scenario text (395, 407): "the split-billing Card" becomes "the
      multi-procedure Booking".
    - Comments in `fee.ts`, `cardActions.ts` and `types.ts` that cite the RFP split-billing rule are
      rewritten.
    - Every new string follows the no en/em dash rule: middots, commas or "to".

15. **Playwright and green.**
    - Update the specs that assert the old note, captions or "Time units only":
      - `mobile-phase04.spec.ts` (the additional-procedure note and the copy walk, if 15 left it);
      - `admin-phase08.spec.ts` (the split-billing invoice);
      - `card-calculation-display.spec.ts` (still no anaesthetist fee).
    - Add specs for:
      - mobile: add a procedure, "Make primary", the pill moves and the B captions swap;
      - the Admin Booking total on the seeded three-procedure Booking, showing 3/2/2 (`booking-total-split`);
      - the Review row's split text;
      - the Contract editor rule and an override row;
      - both triggers from the harness bar;
      - `pwa-device.spec.ts`: the feed trigger from the PWA sheet on a two-procedure Booking.
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`. All must be green.

## Demo triggers

Two harness-bar entries, both also on the PWA sheet. "Make primary" itself is normal use on every surface
and needs no trigger. No mobile beat waits on the office here, so no PWA office stand-in is needed. The
Control Panel page gets no trigger; only its S3 scenario text changes (item 14).

Routes below are as at `1f067a8`; register them with 15's names (`…/bookings/:bookingId` for
`…/cards/:cardId`).

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `load-multi-procedure-booking` | Load 3-procedure Booking (7 modifier units) | List detail and Booking detail in all three apps: `/mobile/lists/:listId`, `/mobile/lists/:listId/cards/:cardId`, `/web/lists/:listId`, `/web/lists/:listId/cards/:cardId`, `/admin/day/:dateISO/cards/:cardId` | bar and pwa | Adds the `MULTI_PROCEDURE_DEMO` Booking (20941 primary, 49120 and 49115 additional, AS3 + OB3 + P1 = 7 modifier units, each on the List hospital's default Contract, times set, not marked complete) to **Dr Souter's next open List**: the earliest Souter List dated after the demo clock's today that is DRAFT, booked and has a hospital. Message: "Loaded on Dr Souter's {date} {session} List: 3 procedures, 7 modifier units, split 3 · 2 · 2." `indexPath` is that Booking's Admin detail | "Already loaded on {date} {session}" when that List holds a Booking for the demo patient; "Dr Souter has no open List ahead" when there is none |
| `feed-swaps-primary` | Hospital feed swaps the primary | Booking detail in all three apps (the Booking in the URL); `when` the Booking has two or more Procedures | bar and pwa | The inbound source for the List's hospital makes the next Procedure primary through `setPrimaryProcedure`, audited with source `integration` under the feed's label. Message: "{Feed} made {description} the primary. Base units now come from {code}." | The List is not DRAFT ("A hospital feed cannot change a submitted List", mirroring `integrationImmutable`); the Booking is cancelled; fewer than two Procedures (hidden by `when`) |

Neither entry carries the Future-scope badge: the inbound source is in scope (US-03.2.2, Confirmed) and
is not the HL7/FHIR tooling. Both show the standard "Demo trigger" badge. Phase 33 re-points
`feed-swaps-primary` so the change lands as a matching row ("no silent apply"); this phase applies it
directly because that screen does not exist yet.

## Out of scope

- The anaesthetist adjustment, and the Contract's "allows adjustment" rule that closes US-04.2.2 (Phase
  24). This phase only builds the base-unit override half.
- Locking `isPrimary`, the allocation, the rule and the base-unit source at AUTHORISED (Phase 25). Until
  then a Contract rule edit re-prices unlocked Bookings.
- Combined or bundled procedures and splitting a bundle into several invoices (OQ-53, US-08.6.4).
- Any change to how an additional Procedure selects its Contract (Phase 20) or to the billable party
  (Phase 21).
- The ledger's per-Procedure share records (Phase 36). The share is recorded on invoice lines as today.
- A pick-by-operation-name picker (OQ-06), and loading Contract rules or overrides from spreadsheets
  (Phase 42).
- Showing any fee on the anaesthetist Booking (the 2026-09-28 ruling stands).

## Manual test checklist

- [ ] Mobile (Dr Souter): on a DRAFT Booking, add a procedure. The first shows the "Primary" pill. The
      new one shows the additional note, B 0 "Base units are on the primary procedure", its own T, the
      modifiers caption row instead of ASA and chips, and "Make primary".
- [ ] "Make primary" opens the bottom sheet and names what moves. Confirm it. The pill moves, the B
      captions swap, the ASA card and chips now render on the new primary with the same selection, and
      the Booking history shows two "Primary procedure changed" entries.
- [ ] "Remove" is not offered on the primary. Removing an additional Procedure still works.
- [ ] Changing the RVG code on an additional Procedure still works (no base refusal), and it still shows
      B 0.
- [ ] The anaesthetist sees no fee anywhere on the Booking, on mobile or web.
- [ ] Web (anaesthetist): the same Make primary walk works through the desktop dialog, and the List row's
      operation text is the primary's.
- [ ] Admin: open the seeded three-procedure Souter Booking. The Booking total rows read "Primary · B + T +
      M 3 of 7", "Additional · T + M 2 of 7" and "Additional · T + M 2 of 7", and the total equals the
      Vitest-pinned figure.
- [ ] Make 49115 primary from Admin. Base drops from 6 to 5, the 3 moves to 49115, and the total changes
      to the second pinned figure. Make 20941 primary again, and the original total returns.
- [ ] Review queue: the seeded List's row shows "M 7 · split 3 · 2 · 2". "Next in queue" from Souter Mon 20
      AM still lands on Mon 20 PM.
- [ ] Authorise the seeded List. Its invoice lines read "(B 6 + T n + M 3 of 7 units)" and "(T n + M 2 of 7
      units)", and each line's amount matches the Booking total row.
- [ ] S3 Beat 1 after a reset: Holt AA-2026-0002 is still $396.18 with one invoice, and its additional line
      reads "Anaesthesia, additional procedure (T 2 units)". Prentice is still $152.38 and $91.43.
- [ ] Admin → Master data → Contracts:
      - the Doyle bariatric Contract shows "$950 add-on" and SXAP shows "50% of own code";
      - switching a Contract to "Not billable" makes a DRAFT Booking's additional line show "Additional ·
        not billable" with $0 anaesthesia;
      - switch it back.
- [ ] Contract editor: add a base-unit override for a code on a Contract a DRAFT Booking's primary uses.
      The primary's B caption reads "Set by the Contract" with the new value. An overlapping group
      override is refused with the code named. Remove the override.
- [ ] Demo actions (harness bar, on a Souter List or Booking): "Load 3-procedure Booking (7 modifier
      units)" adds it to the next open List with the message. A second run is disabled with "Already
      loaded".
- [ ] On that DRAFT Booking, "Hospital feed swaps the primary" moves the pill. The audit entry shows the
      feed's label with source integration. On a SUBMITTED List it is disabled with the reason.
- [ ] PWA (`npm run build:pwa`, handset or device spec): both entries appear in the demo-actions sheet on
      a Booking, and the feed swap works there.
- [ ] Audit viewer: `procedure.setPrimary`, Contract rule and override entries show before and after.
- [ ] No en or em dash in any new app copy (grep the diff). Actions are teal, the Primary pill neutral, no
      crimson.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

Patch these in the same session, with the matching sections of `master-demo-guide.html` (the workflows
block around its "additional Procedure is time-only" lines, the billing-engine steps, the "Split billing"
cheat-sheet card and the S3 section):

- `04-presenter-cheat-sheet.md`: the "Split billing" section becomes "Multi-procedure rule":
  - one primary per Booking, and anyone with edit rights can make another primary;
  - base on the primary only;
  - time on every Procedure;
  - modifiers on the primary up to 4 units, then split equally with the remainder to the primary (7 over
    3 = 3/2/2);
  - a Contract can replace the rule (SXAP 50%, bariatric $950 add-on, or not billable);
  - a Contract can override base units (provisional, OQ-06).
  Keep "one Procedure may split across funders" in whatever form 22 left it.
- `02-workflows-and-handoffs.md`: "Multiple Procedures" (around line 261) is rewritten the same way and
  adds "Make primary". Billing engine step 5 (around line 346), "It enforces time-only additional
  Procedures", becomes "It applies the multi-procedure rule and each Procedure's Contract rule".
- `01-personas-and-responsibilities.md`: the anaesthetist's list item about additional procedures (item
  10, as 15 left it) mentions "Make primary". The office list gains "correct the primary at review".
- `03-demo-script.md`:
  - S3 Beat 1: "the one-invoice, same-funder split Card" becomes "the one-invoice multi-procedure Booking
    (additional procedure on its own time units; modifiers stay on the primary at 4 or fewer)". Re-verify
    $396.18 and the Prentice figures; they should not move.
  - S3 "Serves" line: "split billing" becomes "the multi-procedure rule".
  - Add an optional "Worth pointing at" after S3 Beat 1: open the seeded three-procedure Souter Booking in
    Admin, show 3/2/2, click "Make primary" on 49115, and show base 6 to 5. Name the two demo actions.
  - S5 discovery points: add OQ-15 (the remainder rule and who takes part) and OQ-53 (combined
    procedures).
- Control Panel scenario text: the S3 blurb and steps (item 14), and the `splitBillingCard` and
  `multiProcedureBooking` scenario detail (item 9c).

Other "split-billing" mentions at `1f067a8` to reword the same way: `03-demo-script.md` lines 16, 220
and 241 ("the split-billing Card" becomes "the multi-procedure Booking") and 276;
`04-presenter-cheat-sheet.md` section 7 "Split-billing invoice count" (247 to 250) and
`02-workflows-and-handoffs.md` 360. Those last three are the RFP's invoice-count tension, a live
discovery point: keep the point, name it "multi-procedure invoice count", and quote "Split Billing" only
as the RFP heading. The RFP source citation at workflows 278 stays.

This is not a milestone phase, so no full consistency read is required. Grep the four guide files and
the master guide for "time-only", "time units only" and "split billing" / "split-billing" afterwards;
only quoted RFP headings may remain.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**:

- Fan out about three independent Opus review subagents, one each for **quality**, **bugs/correctness**
  and **plan adherence**. Add a fourth on **billing maths**, because the fee engine changes shape under
  every invoice.
- This session then verifies every finding independently against the catalogue files, this doc and the
  code. Fix the confirmed ones, each bug with a test, then re-green and record the pass.
- Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **The split is exact.** Recompute every worked example in `multiProcedure.test.ts` and
  `bookingFee.test.ts` by hand:
  - the threshold is "more than 4", so exactly 4 does not split;
  - the remainder goes to the primary wherever it sits;
  - the shares sum to the total;
  - a replaced-rule Procedure takes no share and loses none.
- **One engine.** Every fee in the app comes from `bookingFeeFor`: the UI assembler, the validator's
  conservation checks, the invoice build (with resolved Contracts), the prepayment build, the billing-line
  guards and the seed. No caller prices a Procedure alone or reads a position; grep `ordinal`, `[0]` near
  procedures, and `isAdditional`.
- **Exactly one primary, always.** Every creation path (manual, photo, copy, post-op addendum,
  integration, seed, the trigger) makes one. Remove never promotes. Set-primary is a single commit with both audit entries. A
  structural error fails loudly (validator failure, invoice exception) instead of guessing.
- **Re-anchoring is right.** After Make primary:
  - the modifier inputs are on the new primary and gone from the old one;
  - absorption is checked against the new primary's base code;
  - the old primary's manual base override is cleared and kept in `before`;
  - the old primary's range choice no longer blocks completion, and the new primary's missing range
    choice does.
- **Structural, not cosmetic.** `editProcedure` refuses base and modifier writes on an additional
  Procedure, and `isPrimary` patches, whatever the UI shows. Clearing those keys (a code change) is
  still allowed.
- **Rights.** The integration actor works on DRAFT only; the anaesthetist on their own DRAFT and not on a
  completed Booking; the office on DRAFT and SUBMITTED; AUTHORISED on nobody.
- **No figure moved that should not.** The parity fixture differs only for the new Booking. Holt is
  $396.18, bariatric $2,800 + $950 by rule, and S3's Prentice pair is unchanged. The new seed draws
  nothing from the RNG or the patient pool. `PERSIST_VERSION` is bumped once.
- **The anaesthetist never sees a fee** (2026-09-28). The additional note, the M share captions and the
  Make primary sheet carry units only.
- **Contract rules and overrides.** Percent and add-on validation; the override precedence (manual, then
  Contract code, then Contract group, then master, then guide); the override is ignored on an additional
  Procedure except inside the percent rule's standalone price. The ordinal row is gone from the model,
  editor, tests and seed.
- **No gold-plating.** No bundling, no adjustment, no lock, no ledger share, no loaders. Plus the usual:
  teal-only actions, a neutral Primary pill, no dashes in copy, sheets not modals on mobile, `pwaPurity`
  green, and the trigger bodies in `src/store`.

## PROGRESS.md updates

- A status row for catch-up Phase 23, and a phase entry covering:
  - the drift-check result and the OQ-15, OQ-06 and OQ-53 status;
  - what was built;
  - the parity result (the only diff being the new Booking) and the List chosen for it;
  - the `PERSIST_VERSION` from and to;
  - the tests added;
  - the review pass: findings confirmed and fixed, and anything not treated as a defect, with the reason.
- **Decisions log:**
  1. The catalogue multi-procedure rule replaces the RFP split-billing rule ("additional Procedure = time
     units only"), superseding the Phase 01, 04 and 08 readings.
  2. `isPrimary` replaces `isAdditional`, with an exactly-one invariant.
  3. The 2026-07-22 "Type 3 second-procedure fallback" and ordinal keying are superseded by each
     Contract's `multiProcedureRule`. The bariatric ordinal row became a $950 add-on fee. Handoff P2 is
     closed.
  4. The 2026-07-27 `removeProcedure` ruling is kept but re-based: the primary is refused by flag, not
     position, and removal never promotes. "Make primary" is the explicit route.
  5. Picked readings, each provisional:
     - modifiers are recorded once per Booking, on the primary, and move with Make primary;
     - the split's participants are the primary plus additional Procedures on the RVG default rule
       (OQ-15);
     - `secondCodePercent` is a percentage of the Procedure's standalone price;
     - captured non-RVG lines still bill under every rule;
     - a fixed-schedule primary's modifier share is inside its line price;
     - the integration actor may set the primary on DRAFT only;
     - the anaesthetist must Amend a completed Booking first, and the office need not.
  6. Contract base-unit overrides by code or group fill 19's resolver slot (OQ-06 interim).
- **Handoff list:**
  - 24 applies the anaesthetist adjustment per Procedure, after the allocation and before the office
    override.
  - 25 locks `isPrimary`, the allocation, the rule and the base-unit source at AUTHORISED.
  - 33 re-points `feed-swaps-primary` to land as a matching row.
  - 36 records each Procedure's share on the ledger (US-05.3.5).
  - 39 prices additional invoices from per-Procedure units.
  - 42 loads rules and overrides from spreadsheets.
  - The OQ-15 and OQ-53 outcomes.
