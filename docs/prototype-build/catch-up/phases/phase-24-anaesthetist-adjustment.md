# Phase 24 · Pricing kinds, the price following its Contract until held, and who may change it

**Requirements covered** (catalogue `efe123c`):
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) Pricing kinds: five, the override setting on RVG kinds only, price only ·
[FT-05.2](../../../../requirements-board/requirements/stories/FT-05.2.md) Unit and fee calculation ·
[US-05.2.8](../../../../requirements-board/requirements/stories/US-05.2.8.md) A Procedure's price follows its Contract until held (new) ·
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) Fixed fee schedule pricing: the range in force, or the typed amount on an open price ·
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) RVG at the Contract's rate: undated, never changed on a Procedure ·
[US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md) RVG less the Contract's discount: its own invoice line, no discount of the anaesthetist's own ·
[FT-03.5](../../../../requirements-board/requirements/stories/FT-03.5.md) Anaesthetist adjustment ·
[US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md) Apply an anaesthetist adjustment: a typed price where the RVG Contract allows it ·
[US-03.5.2](../../../../requirements-board/requirements/stories/US-03.5.2.md) BTM still recorded in full on RVG kinds, even at $0 ·
[FT-05.4](../../../../requirements-board/requirements/stories/FT-05.4.md) Changes to a Procedure's price ·
[US-05.4.1](../../../../requirements-board/requirements/stories/US-05.4.1.md) Apply anaesthetist adjustment ·
[US-05.4.2](../../../../requirements-board/requirements/stories/US-05.4.2.md) Office can change any price, a prepaid one only until its invoice is raised ·
[US-03.3.10](../../../../requirements-board/requirements/stories/US-03.3.10.md) See what the price comes to (new, Verify) ·
[DM-50](../analysis/domain-model-delta.md#dm-50) the five kinds and one price function ·
[DM-14](../analysis/domain-model-delta.md#dm-14) one typed price on the Procedure ·
[RV-03](../analysis/reverse-check.md#rv-03-rate-x-time-billing-line-and-the-method-3-individual-arrangement-gate) the rate x time line and its Method 3 gate go ·
[RV-04](../analysis/reverse-check.md#rv-04-anaesthetist-price-adjustment-reason-mandatory-offered-on-every-contract-and-on-prepaid-and-fixed-prices-no-per-contract-flag) the reasoned, always-offered override goes ·
[RV-29](../analysis/reverse-check.md#rv-29-the-anaesthetists-booking-shows-no-calculation-units-or-price) the anaesthetist sees the price.

**Carried across without regression, with parity tests:**
[US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md) Per-unit pricing rate and
[US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) GST at the invoice foot on
ex-GST prices.

**Superseded and not built** (5 November, Donald's D5 and D9; [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md)
sections 2.3 and 5.6 to 5.8): this plan's earlier price, rate and discount held on the Procedure, the
editable flag on every Contract, the Contract version in force (D45, now ranges), the fixed-rate line,
the per-Procedure rate or discount edit, a held price and a discount "never coexisting", and the
silent BTM fallback. The BillingLine entity and its other lines stay until **39b** (DM-46).

**Depends on:** 21a and 23, and through them 18 (Parties and flat Contracts: the pricing kind, the
Contract's rate and discount, the override setting refused on fixed and prepaid Contracts, No contract
· RVG), 18a (the open-price fallbacks, No contract · Fixed price among them), 19a (price ranges and the
range in force, the Merivale Face lift Booking, Dr Souter's prepaid price lists, the parity harness),
20 (`enteredPrice`, `setProcedureContract` and its reset), 20a (the pricing-basis line on the stack),
21a (`priceStatusFor`, `computedPriceFor`, completion's price condition, the `typedPrice` and
`needsPrice` review flags), 22 (invoice layout and the Split) and 23 (`bookingFeeFor`, `isPrimary`,
the RVG rule).
**Estimated:** 2 sessions.
**Risks and cut line.** A rewrite, not a trim: 9 files read `priceOverride`; `fee.ts`, `invoiceBuild`
and the validator change. **Session 1** (work items 1 to 6): the five pricing kinds, the one price
function with a test per rung, the one typed-price field (`priceOverride` and its reason folded into
`enteredPrice`, since the typed rung reads it) and the override gates, with 21a's selector re-pointed,
ending green. **Session 2** (items 7 to 14): the anaesthetist's price line on mobile and web
(US-03.3.10), the office's change beside the computed price, the rate x time line and Method 3 gate
removed with the Aria Contract re-expressed, the discount as its own invoice line and the $0 no-charge
invoice. Log two readings that cut across earlier rulings: the office's prepaid price read-only once
raised narrows OQ-96's 28 October wording, and the anaesthetist seeing the price reverses Greg's early
steer. Re-baseline any beat showing the Aria hourly Contract or a reasoned override.

## Goal

**Five pricing kinds** (US-04.2.2, DM-50; [AR-61 · Pricing kind](../../../../requirements-board/requirements/artifacts/AR-61.md)),
each Contract carrying one as 18 stores it: **RVG at the anaesthetist's rate** (US-05.2.1); **RVG at the
Contract's rate** (US-05.2.6: undated, an edit reaching every Procedure not yet held; a dated change is
a new Contract); **RVG less the Contract's discount** (US-05.4.3: undated, its own invoice line, 10% on
$1,000 gives $900); **fixed price** from the range in force on the procedure date (US-05.2.5; an RVG
code kept for reference); **open price**, typed on the Procedure (18a's fallbacks only). No per-Contract
units (OQ-62); no holder references (D82's default).

**One price function** (US-05.2.8, FT-05.2; [AR-58 section 5.7](../../../../requirements-board/requirements/artifacts/AR-58.md)).
The Procedure's price at any moment is the first that applies:
1. the **AUTHORISED** price (25's snapshot; an interim read here);
2. the **prepaid amount** once its prepayment invoice is raised (27's; an interim read here);
3. a **typed price** (`enteredPrice`, 0 allowed);
4. **computed from the kind**: billable units after 23's rule x the rate (the Contract's, else the
   anaesthetist's unit value in force), less the Contract's discount as its own amount; or the fixed
   price's range in force;
5. else **"Needs a price"** (an open price with no amount, a fixed price with no range in force),
   blocking completion through 21a's selector, re-pointed here, and AUTHORISED in 25.

Unedited prices are derived, never stored, so they follow a new range or an edited rate or discount.
No automatic difference invoice or credit ever follows. A Contract change clears a typed price (20).
A price of 0 gives a **no-charge invoice**. No list of the Procedures a new range re-prices (D79's
default). Keep the kinds and the function in one place in `aa-prototype/src/domain/billing`.

**One typed price on the Procedure** (DM-14): 20's `enteredPrice`, never a per-Procedure rate or
discount (our reading, A12). `priceOverride` and its reason go (RV-04).

**Who may change it** (FT-03.5, FT-05.4, US-03.5.1, US-05.4.1, US-05.4.2; D50, D65, D30):
- **The anaesthetist** overrides the price only on an RVG Contract whose override setting allows it,
  the RVG detail and computed price staying recorded (US-03.5.2: BTM in full, even at $0); never on a
  fixed price (OQ-117), her own price list included, or a prepaid Contract (OQ-96). On **No contract ·
  Fixed price** she types the amount; on any other fallback the amount is the office's (A37).
- **The office** changes any price on any Contract until AUTHORISED, except a prepaid price, read-only
  once its prepayment invoice is raised ("Use a credit or an additional invoice"; our reading A16, D30
  narrowed).
- No reason anywhere; every change audited; the last change stands; a typed price on a Contract that is
  not open price flagged at review beside the computed price (21a's `typedPrice` flag, A49).

**The anaesthetist sees what the price comes to** (US-03.3.10, RV-29) as she records, on every
Contract, updating as time and modifiers are added, read-only unless she may change it, **visible but
not prominent** (no prompt, pop-up or confirmation). The 2026-09-28 "no calculation" ruling and 21a's
"no money on mobile" are superseded; not yet put to Greg, logged. This restores the calculation widget
the prototype had until 28 September (see Reference).

**The rate x time line goes** (RV-03): the line, its `rateTime` basis and the Method 3 gate. The Aria
Contract becomes RVG at the Contract's rate ($26.50). Other billing lines stay until 39b.

## Before you start: drift check

1. **Diff the catalogue** against the plan's baseline, catalogue commit `fbdd555` (rename-aware):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-04.2.2,FT-05.2,US-05.2.8,US-05.2.5,US-05.2.6,US-05.4.3,FT-03.5,US-03.5.1,US-03.5.2,FT-05.4,US-05.4.1,US-05.4.2,US-03.3.10,US-05.2.1,US-05.2.7,US-04.3.9,US-04.2.15,OQ-96,OQ-117,OQ-133,OQ-136
   ```

   At the 2026-11-10 plan update (`a68f09b..efe123c`) the changes for this phase were: US-05.2.8 and
   US-03.3.10 new; US-04.2.2 retitled "Pricing kinds" (five kinds, override on RVG kinds only, price
   only, no units or holder references); US-05.2.6 and US-05.4.3 retitled (undated, never edited on a
   Procedure); US-05.2.5 (range in force, open price, "Needs a price"); FT-05.2, FT-05.4, FT-03.5,
   US-03.5.1, US-03.5.2, US-05.4.1 and US-05.4.2 rewritten (typed price only; prepaid read-only once
   raised). Diff anything after `efe123c` the same way; drop anything now Retired or Future and say so
   in the PROGRESS entry.
2. **Questions.** OQ-96, OQ-107 and OQ-117 are answered (D30 as narrowed, D50, D65): build them with no
   provisional label. OQ-133 (D79) and OQ-136 (D82) are open: build their defaults (no list of re-priced
   Procedures; no holder references) and log them; nothing provisional to caption.
3. **Read what earlier phases actually left** and use the real names: 18's pricing-kind field and
   values, the rate and discount fields (discount stored as a percent or a fraction: convert in one
   place), the override setting and its save guard, `isDefault`, `permitsIndividualArrangement`,
   `permitsRateTime`, `INDIVIDUAL_ARRANGEMENT_MESSAGE`, `CT-ARIA-HOURLY`; 18a's open-price fallback ids;
   19a's range-in-force function and `addPriceRange`; 20's `enteredPrice` (its units), `applyContractChange`
   and `setProcedureContract`'s `{ enteredPrice }`; 21a's `priceStatusFor`, `computedPriceFor`,
   `completionFailuresFor`, `rvgDetailFor`, `typedPrice` and `needsPrice` flags and its markers
   (`typedPriceBooking`, `needsPriceBooking`, `fixedPriceNoTimes`); 23's `bookingFeeFor`; today's
   prepayment invoice records (the prepaid rung's interim read). If any phase left a rate or discount on
   the Procedure, remove it here.
4. Grep every `priceOverride` reader (9 non-test files) and every seeded override; note `PERSIST_VERSION`.

## Reference

**Design (convention 17).** `docs/design/Mobile App.dc.html` (capture sections, fields, captions),
`Admin Review.dc.html` (row anatomy, flag pills, the mono Fee cell), `Design Language.dc.html` (teal
for Save and Change price; neutral for read-only values and review flags; the warning tint only for a
refusal or "Needs a price"; mono for every figure, rate and percent; crimson never). No mockup draws the
price line: extend the capture-section and Review-pill patterns.

**Catalogue and artifacts.** The covered items, plus
[US-04.3.9](../../../../requirements-board/requirements/stories/US-04.3.9.md) (open-price fallbacks),
[US-04.2.15](../../../../requirements-board/requirements/stories/US-04.2.15.md) (price ranges),
[US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (price lists),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md),
[US-03.3.9](../../../../requirements-board/requirements/stories/US-03.3.9.md),
[US-13.5.2](../../../../requirements-board/requirements/stories/US-13.5.2.md),
[FT-07.2](../../../../requirements-board/requirements/stories/FT-07.2.md). Read, never edit:
[AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md) sections 2.3 (`#L114-122`),
5.7 (`#L515-567`) and 5.8 (`#L569-589`), and A12, A13, A15, A16, A37, A48, A49;
[AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md) `#pricing-kind`,
`#price-range`, `#procedure`; AR-24 `#anaesthetist-adjustment`.

**The earlier calculation widget (restore from git).** Last good version `d1562b4c` (28 Sep 2026, the
parent of the removal). The trail, oldest first:

| Commit | Date | What it did |
|---|---|---|
| `7bd4f023` | 23 Jul | Phase 5: first version, `FeeSummaryPanel.tsx`, `CardTotalPanel.tsx` begun |
| `b0c2271f` | 27 Jul | `CardTotalPanel` on the web Card view |
| `931e93bf` | 28 Jul | The phone dock `CardTotalStrip.tsx` (procedure chips, max 3; value tick and green flash), the dock height measured in `SurfaceProvider` |
| `d0e8d1e5`, `58688684` | 29 Jul | Web: total panel and Mark complete as matching-width siblings; `WEB_COMMIT_HALO` |
| `3ebe38ab` | 29 Jul | The Off / Units / Fee setting (`CardCalculationControl.tsx`, `shell.cardCalculationMode`); `visual/card-calculation-display.spec.ts` |
| `101a82b9`, `e0ac2a14`, `06bd329d` | 30 Jul to 3 Aug | PWA: dock above the keyboard, `--aa-dock-height`, `DockSpacer` |
| `384c3686` | 28 Sep | **Removed**: the strip, the setting, the PWA card; the phone's `CardTotal` became `() => null` |
| `98bfd5c5` | 2 Oct | Phase 15 rename: `CardTotalPanel` to `BookingTotalPanel` (office-only) |

Read with `git show d1562b4c:<path>` (`shared/capture/CardTotalStrip.tsx`, `CardTotalPanel.tsx`,
`shared/surface/SurfaceProvider.tsx`, `shared/surface/context.ts`, `shared/capture/CompletionOverlay.tsx`,
`visual/card-calculation-display.spec.ts`) and `git show 384c3686`. Still in the code and not rebuilt:
the measured dock, `--aa-dock-height`, `DockSpacer`, the keyboard inset, `WEB_COMMIT_HALO`. Map names
through the Phase 15 rename (Card to Booking). **Do not restore** the Off / Units / Fee setting,
`shell.cardCalculationMode`, the PWA card or the rate x time fee-line handling.

**Code entry points** (names; earlier phases move lines):
- Engine: `src/domain/billing/fee.ts` (`feeFor`, its Type branches, `rateTime` branch and override
  block, `AppliedOverride`, `FeeResult`), 23's `bookingFeeFor`, 21a's `priceStatus.ts`,
  `invoiceBuild.ts` (the override line, the `$0` group skip, the deposit netting),
  `validateBookingForBilling.ts` (`INDIVIDUAL_ARRANGEMENT_MESSAGE`, the override checks),
  `src/store/billingRun.ts`.
- Model: `src/domain/types.ts` (`PriceOverride`, `Procedure.priceOverride`, `enteredPrice`,
  `ChargeBasis` `'rateTime'`, `BillingLine.hours`, `Contract.permitsIndividualArrangement`).
- Rate x time: `store/billingLineActions.ts`, `shared/capture/AddBillingLineSheet.tsx`,
  `BillingLinesCard.tsx`, `apps/admin/flows/ContractEditSheet.tsx` (the Method 3 control).
- Surfaces: `shared/capture/OverrideCard.tsx` (anchor `'priceOverride'`), `shared/flows/PriceOverrideSheet.tsx`,
  `shared/booking/OfficeBillingSetup.tsx`, `shared/booking/BookingDetailBody.tsx`
  (`showBookingTotal = actor.role !== 'anaesthetist'`), `shared/capture/BookingTotalPanel.tsx`,
  `feeContext.ts`, `apps/web/screens/ListDetailView.tsx`, `apps/admin/screens/ReviewScreen.tsx`,
  `MasterData.tsx` (`ContractsView`).
- Store and audit: `store/lifecycle.ts` (`ProcedurePatch`, `editProcedure`, `editRefusal`),
  `shared/audit/fieldLabels.ts`, `actionLabels.ts`, `auditNarrative.ts`.
- Seed: `domain/seed/contracts.ts` (`CONTRACT.ariaHourly`), `bookings.ts` (Fitzgerald's Wed 15 Jul
  rate x time Booking, Souter's Mon 27 Jul Aria Booking), `index.ts` (`SEED_MARKERS.rateTimeBooking`,
  `rateTimeCaptureBooking`, `individualArrangementContract`), `audit.ts`, `apps/demo/DemoData.tsx`.
- Tests touching `rateTime` or `priceOverride`: `fee.test.ts`, `validateBookingForBilling.test.ts`,
  `captureActions.test.ts`, `invoiceBuild.test.ts`, `billingRun.test.ts` (the $1,440 Aria invoice),
  `seed.test.ts`, `mastersActions.test.ts`, `auditNarrative.test.ts`; Playwright
  `visual/admin-phase06.spec.ts` (`a-05-override.png`), `visual/booking-attachments.spec.ts`.

## Work items

### Session 1: the kinds, the price function, the typed price and the gates

1. **Parity baseline first.** Add a `phase-24` fixture to the fee parity harness, generated from the
   code as 23 left it before any edit: every scripted Booking S2 to S5, the Contract-rate Bookings
   ($26.50, $23, $25, $24), the bariatric $2,800 and $950 with GST, No contract · RVG at the
   anaesthetist's own value, 19a's Face lift Booking, and every seeded `priceOverride`. Never
   regenerate with `-u`. Nothing moves in session 1 (a move is a bug, or a Procedure 21a's seed left
   without a price: record it); in session 2 only Fitzgerald's Aria Booking moves, asserted by its new
   figure.
2. **The price function** in a new `src/domain/billing/procedurePrice.ts`, re-exported from the billing
   index, with `procedurePrice.test.ts`.
   - **`priceFor(input)`** returns `{ status: 'priced'; price; heldBy: 'authorised' | 'prepaid' |
     'typed' | null; computed?: ComputedPrice }` or `{ status: 'needsPrice'; reason: 'noRangeInForce'
     | 'openPrice' }`. Input: the Contract (kind, rate, discount, ranges), the procedure date, the
     Procedure's `enteredPrice`, its billable units after 23's rule, the anaesthetist's unit value in
     force, and the two interim held amounts below.
   - `ComputedPrice` is `{ kind, units?, rate?, gross, discountPercent?, discountAmount, total }`:
     anaesthetist's rate and Contract's rate, `gross = round(units x rate)`; discount kind, `gross` at
     the unit value and `discountAmount = round(gross x discount)`; fixed price, the range in force
     (19a's function); open price, none. Each figure rounded to cents once. `computed` is returned
     beside a held price, so the computed figure is never lost (US-05.4.1).
   - On RVG kinds it prices whatever is recorded so far (the anaesthetist's line updates as she types);
     missing RVG detail is 21a's completion condition, never a price refusal or a BTM fallback.
   - **Interim held amounts**, each one function with an `INTERIM` comment naming its owner:
     `authorisedPriceFor` (the amount the run invoiced for the Procedure on an AUTHORISED List; 25
     replaces it with the snapshot) and `prepaidHeldPriceFor` (the amount on a raised prepayment
     invoice for the Procedure; 27 replaces it with `prepaidAmountFor`). A reading: log it.
   - **Tests, one per rung and per kind** (unit value $30.00): **W1** anaesthetist's rate, 12 units:
     $360.00. **W2** Contract rate $26.50, 12 units: $318.00, the $30.00 ignored. **W3** discount 10% on
     gross $1,000.00: $100.00 and $900.00. **W4** fixed: $500 from 1 Jan and $550 from 1 Dec, procedure
     10 Dec: $550.00; dated before the first range: `needsPrice` `noRangeInForce`. **W5** open: $650.00
     typed gives $650.00; none, `needsPrice` `openPrice`. **W6** typed $450.00 on No contract · RVG:
     $450.00 `heldBy: 'typed'`, computed $360.00. **W7** typed $0.00: $0.00, units untouched. **W8**
     prepaid raised at $500.00, then a $550 range: $500.00. **W9** AUTHORISED, then a new range:
     unchanged. **W10** a rate edit $26.50 to $28.00 reaches the unheld Procedure only. **W11**
     rounding: 11 units at $30.30 less 12.5%: gross $333.30, discount $41.66, $291.64. **W12** under
     23's rule a discount changes only its own Procedure. **W13** parity (item 1).
3. **One typed price** (`domain/types.ts`, DM-14). 20's `enteredPrice` becomes the one typed price
   (drop its INTERIM comment; keep its units). `PriceOverride`, `Procedure.priceOverride` and the
   reason go everywhere (code, seed, `seed/audit.ts`, labels, tests); each seeded override becomes an
   `enteredPrice` at the figure it gave (a fixed fee its amount, a dollar or percent adjustment the
   adjusted figure), its parity case unchanged. No rate or discount on the Procedure. Keep 20's
   `applyContractChange` clearing `enteredPrice` and add the test (A15).
4. **The gates**, pure, in `procedurePrice.ts`, each test its own unit test, a code comment naming
   OQ-107, OQ-117, OQ-96 and A16:
   - **`anaesthetistMayTypePrice(contract)`** returns `{ may: true; mode: 'override' | 'amount' }` or
     `{ may: false; reason: 'notAllowed' | 'fixed' | 'prepaid' | 'office' }`: an RVG kind with the
     override setting on is `override`; No contract · Fixed price is `amount`; an RVG kind with it off
     is `notAllowed`; a fixed price is `fixed` (her own price list included); a prepaid Contract is
     `prepaid` (tested even though 18 refuses the setting there); any other open-price fallback is
     `office`.
   - **`officeMayChangePrice(procedure, context)`**: refused once the prepayment invoice is raised
     ("This price is on a raised prepayment invoice. Use a credit or an additional invoice."); the
     override setting, the kind and the fixed test are ignored.
   - **`setProcedurePrice(api, actor, procedureId, price | null)`** in `src/store/pricingActions.ts`
     (exported from `store/index.ts`), through `mutate()` with before and after metas and the demo
     clock. `null` clears the typed price (back to computed). Anaesthetist: 38a's `editRefusal` (her
     List until AUTHORISED), then her gate: "{Contract} sets this price. Change the Contract or alert
     the office." Office: until AUTHORISED (D63), then its gate. Integration: refused. Price 0 or
     more; no reason parameter. Audits `procedure.price` with the actor; the last write stands. 20's
     `setProcedureContract` `{ enteredPrice }` option calls the same gates.
   - `ProcedurePatch` omits `enteredPrice` and `editProcedure` refuses it at runtime. Test it.
   - **Tests** (`pricingActions.test.ts`): the rights matrix (anaesthetist on an RVG Contract with the
     setting on and off, a fixed price, her prepaid price list, No contract · Fixed price, another
     fallback; office on each, a prepaid one before and after raising; integration; ACTIVE, SUBMITTED,
     AUTHORISED); clear; the audit metas; last change stands (anaesthetist $450, office $300, the
     anaesthetist's later $420 on an allowing Contract).
5. **Engine wiring** (`fee.ts`, `bookingFeeFor`, 21a's selector).
   - Each Procedure is priced through `priceFor` after 23's rule; the Type lookups, the override block,
     the Type 3 BTM fallback and any second derivation of a rate or discount go. The Booking total is
     the sum. `FeeResult` carries the price result; update every reader (`feeContext.ts`, `ReviewScreen`,
     `invoiceBuild`, `billingRun`, `BookingDetailBody`).
   - **21a's selector re-pointed**: `priceStatusFor` and `computedPriceFor` keep their signatures and
     call `priceFor`, so completion, the `typedPrice` and `needsPrice` flags and the stack read it.
   - 20a's pricing-basis line reads the kind: "Your unit value", "Rate $26.50 a unit", "Your unit value,
     less 10%", "Fixed price $2,800.00", "Open price", plus "Price typed" when held by a typed price.
   - 22's Split divides the final price; a typed $ share above it is refused ("The split shares come to
     more than the price ({price}). Change the split or the price.") unless 22 already does.
   - Validator and run: the override reason and "makes the fee negative" checks go; `needsPrice` is the
     run's per-Booking pre-flight failure (21a's handoff), the same sentence as completion.
6. **Session 1 ends here.** The office's existing sheet writes `setProcedurePrice` (one "Price $"
   field, office only); the anaesthetist's `OverrideCard` hides its inputs until session 2. Bump
   `PERSIST_VERSION` by one (the seeded overrides); build, build:pwa, vitest and shots green; parity
   identical.

### Session 2: the surfaces, the invoice and the rate x time removal

7. **The anaesthetist's price line** (US-03.3.10, US-03.5.1, US-05.4.1, US-05.4.3, RV-29; mobile and
   the anaesthetist web app). `OverrideCard.tsx` is replaced by `shared/capture/PriceCard.tsx`, one
   component through `useSurface()`.
   - A quiet section titled "Price", in mono, always shown: "12 units x $30.00 = $360.00"; on a
     discount Contract "Discount 10% · minus $36.00" and "Price $324.00"; "Fixed price $2,800.00";
     "Needs a price" (warning tint) where nothing prices it. It updates as times and modifiers change.
   - **May override** (`override`): a "Price $" field, Save (teal), and "Use the computed price" to
     clear; the computed line and the RVG detail stay shown. **Amount** (No contract · Fixed price):
     the "Price $" field alone. At $0.00: "The RVG detail stays recorded. This gives a no-charge
     invoice."
   - **May not**: the same figures read-only, no inputs, the Contract's discount shown as applied, and
     "Set by {Contract}. To use a different price, change the Contract or alert the office." linking
     to 20's Change Contract. No reason field or copy anywhere; delete "Adjustment and charge",
     "Percentage adjustments are set by the office.", "Adjustment $", "Charge $".
   - **Booking total**: `showBookingTotal` true for the anaesthetist. Restore the phone dock strip from
     `d1562b4c` as `shared/capture/BookingTotalStrip.tsx` (value tick and flash, procedure chips, the
     measured dock), fee only; on web show `BookingTotalPanel` in her rail beside Mark complete as it
     stands. Never a sheet, toast or confirm. Replace `visual/booking-calculation-display.spec.ts`'s
     "Mark complete alone" tests with `d1562b4c`'s `card-calculation-display.spec.ts`, fee only.
   - Anchors: `'priceOverride'` becomes `'price'` in `BtmCaptureBlock`. Hooks: `data-shot="price-card"`
     with `data-state` `override`, `amount`, `read-only`, `needs-price`, `no-charge`, `locked` (a
     SUBMITTED or AUTHORISED List); `data-shot="booking-total-strip"`; keep `booking-calculation`.
8. **Office surfaces** (Admin; the office web Booking detail).
   - `PriceOverrideSheet` becomes `PricingSheet` ("Change price"): one "Price $" field beside "Computed
     $360.00", Clear, no gate but the office's; on a raised prepaid price the field is read-only with
     the gate's sentence. `OfficeBillingSetup`'s button reads "Change price".
   - Review's Fee cell shows the price and, under a typed price, "Computed $360.00" in mist, beside
     21a's `typedPrice` flag (re-pointed, not rebuilt). "No charge" is a neutral pill.
   - Admin Booking total shows gross, the discount line and the total per Procedure (`booking-total-lines`).
   - Contracts (`ContractsView`, 18's detail): on RVG kinds a neutral pill "Anaesthetist can override
     the price" or "Price fixed for the anaesthetist" from 18's setting (`contract-override-pill`);
     none on fixed or open kinds.
9. **Discount line and no-charge invoice** (`invoiceBuild.ts`, `billingRun.ts`).
   - A computed discount-kind Procedure prints its fee line at the gross, then "Discount 10%" at minus
     the discount, in 22's discount slot, reconciling to the cent. A Contract-rate Procedure prints
     "12 units at $26.50"; a typed price prints as the fee line with no discount line. The "Price
     override, {reason}" line goes.
   - A group whose total is $0.00 raises an invoice at $0.00, GST $0.00, headed "No charge", delivered
     like any other; no payable leg and no BCTI (16's count unchanged); its draft Xero ACCREC $0.00. A
     reading: log it. A group of only prepaid Procedures still raises none (left off the final invoice,
     D57).
   - No difference invoice: a test raises a prepayment, adds a range, runs the List, and finds no
     balance or credit for the prepaid Procedure (27 removes the netting itself).
10. **The rate x time line goes** (RV-03), and Aria.
    - `AddBillingLineSheet` loses "Rate × time (hourly)" and `rateTimePermitted`; `BillingLinesCard` and
      `billingLineActions` lose the `rateTime` branch and the Method 3 refusal; the validator loses
      `INDIVIDUAL_ARRANGEMENT_MESSAGE`; `fee.ts` its branch; `permitsIndividualArrangement`,
      `permitsRateTime` and the editor's Method 3 control go; `BillingLine.hours` and `FeeLine.hours`
      go. Fixed amount lines stay (39b). Grep finds none of these names in `src`, nor "Method 3",
      "hourly", "individually arranged" or "rate x time" in rendered strings.
    - **Aria:** keep the id `CT-ARIA-HOURLY`; key `ariaContractRate`; name "Aria Skin and Laser Clinic";
      RVG at the Contract's rate $26.50; override off.
    - **Fitzgerald's Wed 15 Jul Booking** (today 3.0 hours at $480 = $1,440): its rate x time line
      dropped, start 08:30 and finish 11:30, no modifiers; price (B + 14 + 0) x $26.50. Pin it in
      `seed.test.ts` and `billingRun.test.ts` in place of $1,440; grep the guide and Control Panel for
      "$1,440".
    - **Souter's Mon 27 Jul Aria Booking** stays uncaptured; its description drops "individually
      arranged hourly rate". Markers: `rateTimeBooking` to `contractRateBooking`, `rateTimeCaptureBooking`
      to `contractRateCaptureBooking`, `individualArrangementContract` to `contractRateContract`;
      update `DemoData.tsx`.
11. **Seed the beats** (`contracts.ts`, `bookings.ts`, `audit.ts`, `index.ts`; demo values labelled).
    New Bookings after every existing one, pinned patients, no `takePatient()`; the seed test asserts
    existing ids unchanged.
    - **Override settings**: confirm 18's seed has it on for No contract · RVG and at least one hospital
      RVG Contract, off on Aria; fixed and prepaid Contracts carry none.
    - **Dr Souter's Mon 27 Jul ACTIVE List**, one Booking per state: Aria (read-only rate); a **10%
      discount** Booking on an RVG-less-discount Contract (reuse one 18 seeded, else add one under an
      existing hospital holder, override off; `SEED_MARKERS.discountContract`, `discountBooking`); a
      **fixed price** on her prepaid price list (read-only; `ownListFixedBooking`); No contract · RVG,
      uncaptured, where she types a price (`priceCaptureBooking`); and **No contract · Fixed price**
      with no amount, where she types it (`openPriceBooking`).
    - **The backdated range beat** beside 19a's unedited Face lift Booking: a Face lift Booking with an
      office-typed price, one on an AUTHORISED List (invoiced), and a prepaid Booking with its
      prepayment invoice raised on one of Dr Souter's price-list Contracts (reuse Nair's, Fri 24 Jul PM,
      if 19a or 20 put it there). Markers `rangeTypedBooking`, `rangeAuthorisedBooking`,
      `rangePrepaidBooking`.
    - **The no-charge beat:** one completed Booking with a typed $0 on a SUBMITTED List no beat
      authorises (`noChargeBooking`).
    - **Review:** reuse 21a's `typedPriceBooking`; add nothing to S2's List.
    - Seed tests: no seeded anaesthetist typed price where her gate refuses; the discount Booking
      prices at gross less 10% once captured; parity, Aria, S3 and S5 figures as asserted; canvas
      unchanged. Bump `PERSIST_VERSION` by one from session 1's value.
12. **Demo trigger** (the only one): on Admin Contract detail for Merivale's Face lift, "Demo: add a
    backdated price range", a store action through 19a's `addPriceRange` with pinned values (a range
    from 1 Jul 2026 at a demo figure above the seeded one, labelled; the outline's $550 is US-05.2.8's
    example figure). Shown only when that range is absent. Hook `demo-backdated-range`.
13. **Labels and audit.** `ACTION_LABELS` `procedure.price` "Price changed"; `FIELD_LABELS`
    `enteredPrice` "Price"; drop `priceOverride` and `permitsIndividualArrangement`.
    `auditNarrative.formatShape`: "Price $450.00", "Price cleared, computed again". Update
    `auditNarrative.test.ts`.
14. **Playwright and the Decisions log.** `admin-phase06.spec.ts`: "Change price" and re-shoot
    `a-05-override.png`; `booking-attachments.spec.ts` uses "Price". Add shots: `price-card` per state
    on mobile and web, `booking-total-strip`, `booking-total-lines`, the review Fee cell, a no-charge
    invoice and a discount line. PROGRESS Decisions log: **superseded** the Method 3 hourly line and
    18's interim gate; the 2026-07-23 Fitzgerald hourly exemplar; the silent BTM fallback; "a $0 group
    raises no invoice"; the 2026-07-22 seventh review A6/B5 typed override; Phase 08's "Price override,
    {reason}" line; the mandatory override reason; the 2026-09-28 "no calculation" ruling and 21a's "no
    money on mobile"; this plan's earlier per-Procedure rate and discount and the editable flag on
    every Contract. **Readings:** the interim AUTHORISED and prepaid reads; the office's prepaid price
    read-only once raised (A16); a no-charge invoice has no payable or BCTI; `CT-ARIA-HOURLY` keeps
    its id.

## Demo triggers

- **Admin Contract detail, Merivale's Face lift:** "Demo: add a backdated price range" (item 12): the
  unedited Booking re-prices while the typed-price, prepaid and AUTHORISED ones stay put.
- **Mobile and web capture** (product): on Dr Souter's Mon 27 Jul List the price line rises as
  modifiers are added, reads only on the fixed price and Aria, and takes a typed price on No contract ·
  RVG and the amount on No contract · Fixed price.
- **Admin Review** (product): the office's typed price beside the computed price, with no reason asked;
  on the prepaid Booking the field is read-only.
- **The seeded $0 Procedure:** authorising its List raises a no-charge invoice (no new button).

Add nothing to the Control Panel. **PWA:** no stand-in; the price line ships through the shared
capture components. Check Phase 14's "Office authorises this List" still authorises a List with a
discount and a no-charge Booking.

## Out of scope

- The AUTHORISED snapshot and its "Needs a price" blocker (25); the prepaid amount, its approval and
  the netting removal (27). This phase builds their rungs with interim reads.
- Removing the BillingLine entity and the other billing lines (39b, DM-46).
- Additional invoices and credit notes by hand (38b, 39); a list of re-priced Procedures (D79).
- The kind, rate, discount and override setting on the Contract and its editor (18); the open-price
  fallbacks (18a); ranges (19a); the Contract change and its reset (20); the form by kind (21a).

## Manual test checklist

The agent runs every item itself in the running app with evidence; none is handed to the owner.

**Session 1:**
- [ ] **Kinds.** Admin: a No contract · RVG Booking at the anaesthetist's value, a $26.50 Contract-rate
      Booking, the bariatric $2,800.00 fixed price, and 21a's `needsPriceBooking` reading "Needs a price".
- [ ] **Follows.** Admin: add a range to the Face lift from before 19a's Booking; that Booking's fee
      changes; an office-typed price on another Face lift Booking does not.
- [ ] **Typed price.** Admin, Change price on the fixed-price Booking: $2,650.00, no reason asked; the
      total, Review (with the computed price) and History (the office) show it; Clear restores $2,800.00.
- [ ] **Gates.** The store refuses the anaesthetist on a setting-off RVG Contract, a fixed price, a
      prepaid Contract and another fallback (unit tests), and the office on a raised prepaid price.
- [ ] **Parity.** S3's Holt and Prentice figures, the bariatric $2,800 and $950 with GST, the $23, $24,
      $25 and $26.50 Bookings and S5 Beat 1 unchanged.

**Session 2:**
- [ ] **Price as entered (US-03.3.10).** Mobile, Dr Souter's No contract · RVG Booking: the price line
      and dock strip show; claim a modifier and both tick up with no prompt; add time, again. The strip
      matches `d1562b4c`'s look (screenshot from a `git worktree`); on PWA it rides above the keyboard.
      Web: the rail panel above Mark complete, widths matched, halo intact.
- [ ] **Override.** The same Booking: type $450.00, Save, no reason; "Computed $..." and the RVG detail
      stay; History records Dr Souter. Type $0.00: the no-charge caption; Mark complete succeeds.
- [ ] **Read-only.** Aria "12 units x $26.50" read-only with the change-the-Contract caption; the
      discount Booking shows 10% applied; her price-list fixed price read-only.
- [ ] **Amount.** No contract · Fixed price: "Needs a price" until she types $650.00, then $650.00.
- [ ] **Backdated range trigger.** The four Face lift and prepaid Bookings: only the unedited one moves.
- [ ] **Office prepaid.** The raised prepaid Booking: Change price is read-only with the credit or
      additional invoice sentence.
- [ ] **Invoices.** Authorise the no-charge List: a $0.00 "No charge" invoice, no payable, no BCTI,
      units recorded. A discount Booking's invoice prints the fee line, "Discount 10%" and the total,
      reconciling. Fitzgerald's invoice quotes the units at $26.50; no "Rate × time", "Method 3" or
      "hourly" anywhere.
- [ ] **Contracts.** No contract · RVG shows "Anaesthetist can override the price"; Aria "Price fixed
      for the anaesthetist"; fixed-price Contracts no pill.
- [ ] **Web parity.** The anaesthetist web app shows the same card, states and copy.
- [ ] **Scripted beats.** S1 Beat 3, S2 Beat 4, S3 Beat 1, S4 and S5 Beat 1 run as scripted.
- [ ] No en or em dashes in new copy; teal on every new action; crimson nowhere new.
- [ ] Catalogue screenshots as below, a full `npm run capture` with no failed recipe, the covered items'
      shots checked by eye.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      green.

## Demo guide updates

In the same session as the change, patch `docs/demo-guide/` and the same sections of
`master-demo-guide.html`:
- **Session 1:** `04-presenter-cheat-sheet.md` "Fee calculation": "Each Contract has one of five
  pricing kinds. A Procedure's price follows its Contract (the range in force, the rate or discount as
  they stand) until a typed price, a prepayment invoice or AUTHORISED holds it; else 'Needs a price'.
  The office can type any price until AUTHORISED, a prepaid one only until its invoice is raised; no
  reason." Grep `03-demo-script.md` for "override" and fix any beat showing a reasoned override.
- **Session 2:**
  - `04-presenter-cheat-sheet.md`: "The anaesthetist Booking shows no units or fee" becomes "shows what
    the price comes to as she records; she types a price only where an RVG Contract allows it, or the
    amount on No contract · Fixed price"; drop "rate x time", "hourly", "Method 3"; Aria is "RVG at
    the Contract's rate, $26.50 a unit". Same in `README.md`.
  - `02-workflows-and-handoffs.md`: step 9 "shows no units or fee" becomes "shows what the price comes
    to"; step 10 "She may record an allowed fixed or rate-by-time line, or an override with a reason."
    becomes "She may add a fixed billing line, and type a price where the Contract allows it, no reason
    needed."; an office line "The office can change any price until AUTHORISED, shown at review beside
    the computed price."
  - `03-demo-script.md`: **S1 Beat 3** (the anaesthetist now sees the price tick as she claims
    modifiers; an optional aside on Dr Souter's Mon 27 Jul List); grep "$1,440", "hourly" and "rate x
    time"; **S5 Beat 1**: History reads "Price changed" with no override reason.
  - `01-personas-and-responsibilities.md`: the office's review gains the typed-price flag and the
    no-charge invoice.

Phase 44 re-scripts these asides into the rewritten run sheet.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), at
the end of each session for what it changed. Re-run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 24`
first.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) Pricing kinds | captured · admin-pricing-basis (type-1, type-2, type-3, rate-time) | Captured. Re-shoot on the Contract detail as `anaesthetist-rate`, `contract-rate`, `discount`, `fixed-price`, `open-price`, plus `override` (`contract-override-pill`); drop the type and rate-time states. Caption "Each Contract has one of five pricing kinds; the override only on RVG kinds". |
| [US-05.2.8](../../../../requirements-board/requirements/stories/US-05.2.8.md) Price follows its Contract until held | none | Create, captured. Admin `follows` (19a's Face lift Booking before and after the trigger) and `held` (the typed, prepaid and AUTHORISED Bookings unchanged, highlight each fee); web `needs-price` on `needsPriceBooking`. Caption "An unedited price follows its Contract; a typed price, a prepayment or AUTHORISED holds it". |
| [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) Fixed fee schedule pricing | partial · admin-fixed-price | Partial. Admin "Fixed price $2,800.00" from its range, no times; mobile `price-card` `read-only` on `ownListFixedBooking`; web `open-price` ($650 typed). Caption "The range in force is the price; an open price is typed". Reason: "An additional invoice or credit note by hand is Phases 38b and 39." |
| [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) RVG at the Contract's rate | captured · web-rate-time, mobile-rate-time (entry, added) | Captured, renamed `contract-rate`: `price-card` `read-only` on the Aria Booking (mobile, web) and Fitzgerald's invoice at $26.50 (admin). Caption "Units x the Contract's rate, never changed on a Procedure". |
| [US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md) RVG less the Contract's discount | none | Create, captured. Mobile and web `price-card` on `discountBooking` (10% applied, read-only); admin `discount-invoice-line`, highlight "Discount 10%". Caption "The Contract's discount, its own invoice line". |
| [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md) Apply an anaesthetist adjustment | partial · web-adjustment, mobile-adjustment (none, adjustment) | Captured; keep the `name`s. `price-card` `override` on `priceCaptureBooking` (typed price, RVG detail kept, no reason) and `read-only` on Aria, highlight the caption. Caption "Where an RVG Contract allows it, the anaesthetist types the price". |
| [US-03.5.2](../../../../requirements-board/requirements/stories/US-03.5.2.md) BTM still recorded in full | captured · web-full-discount, mobile-full-discount | Stays captured; keep the `name`s. Re-shoot at a typed $0.00 on `priceCaptureBooking`, highlight the units rows and `price-card` `no-charge`. Caption "The RVG detail stays recorded at a $0 price". |
| [US-05.4.1](../../../../requirements-board/requirements/stories/US-05.4.1.md) Apply anaesthetist adjustment | partial · web-adjustment, mobile-adjustment (entry, applied) | Captured. `entry` (typing) and `applied` (typed price with "Computed $360.00"); admin `review` on `typedPriceBooking`, the flag beside the computed price. Caption "A typed price where allowed; the computed price kept and seen at review". |
| [US-05.4.2](../../../../requirements-board/requirements/stories/US-05.4.2.md) Office can change any price | captured · admin-price-override (entry, applied) | Stays captured; keep the `name`s. `pricing-sheet` on the fixed-price Booking (computed beside, no reason), `applied` with History naming the office; add `prepaid-refused` on `rangePrepaidBooking`. Caption "Any price, no reason, until AUTHORISED; a raised prepaid price is read-only". |
| [US-03.3.10](../../../../requirements-board/requirements/stories/US-03.3.10.md) See what the price comes to | none | Create, captured. Mobile `booking-total-strip` and `price-card` `before` and `after` claiming a modifier (the figure rises), `fixed` on a fixed price; web the rail panel. Caption "The price, quietly, as the anaesthetist records". |
| [FT-05.2](../../../../requirements-board/requirements/stories/FT-05.2.md) Unit and fee calculation | none | Create, captured. Admin `booking-total-lines` on the discount Booking and the fixed-price Booking. Caption "Each Procedure priced by its Contract's kind". |
| [FT-05.4](../../../../requirements-board/requirements/stories/FT-05.4.md) Changes to a Procedure's price | none | Create, captured. Admin History on `typedPriceBooking` after an office change: both entries, no reason. Caption "Every change audited; the last change stands". |
| [FT-03.5](../../../../requirements-board/requirements/stories/FT-03.5.md) Anaesthetist adjustment | none | Create, captured. Mobile `price-card` `override` on No contract · RVG and `read-only` on Aria. Caption "A setting on each RVG Contract decides". |
| [US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md), [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) | captured | No change here (carried across); `--dry` is the check. |
| [US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) Tiered time units | captured | No change here (Phase 19a owns it). |

**Recipes this phase breaks.** `US-03.3.7` (Retired, rate x time): `absent` ("Retired. The rate x time
line was removed in Phase 24."), and drop `web-rate-time.png` and `mobile-rate-time.png` from US-03.3.6's
`images`. `US-03.5.3` (Retired into US-03.5.1) clicks "Adjustment $": re-point to `priceCaptureBooking`
and `price-card`, keeping its shot `name` and the `required` and `saved` state names. `US-03.3.5`
(Retired): re-point from `capture-adjustment-and-charge` unless 19b did. `US-07.2.3` clicks "Price
override" and "$ adjust": re-point to "Change price". `US-05.2.4`, `US-03.3.6`, `US-05.3.5` and
`card-calculation`: `--dry` is the check.

**ATLAS.md.** Seed data (Aria at the Contract's rate, Fitzgerald's re-expressed Booking, the Mon 27 Jul
Bookings, the discount Contract, the range-beat and no-charge Bookings); markers (`contractRate*`,
`discountContract`, `discountBooking`, `ownListFixedBooking`, `priceCaptureBooking`, `openPriceBooking`,
`range*Booking`, `noChargeBooking`; the `rateTime*` and `individualArrangementContract` markers gone);
hooks (`price-card` and its states, `booking-total-strip`, `pricing-sheet`, `booking-total-lines`,
`contract-override-pill`, `demo-backdated-range`; `capture-adjustment-and-charge` gone).

## Adversarial review (after build)

The standard pass (PROGRESS convention 18) at the end of each session: three Opus reviewers (quality;
bugs and money correctness; plan and catalogue adherence), every finding verified, fixed and re-greened.
Do not re-raise what the Decisions log settles. **Steer them at:**
- **One function, one place.** `priceFor`, the kinds and both gates in `procedurePrice.ts`; 21a's
  selector, the engine, Review and the price line read it; nothing re-derives a rate or discount, and
  no unedited price is stored.
- **The ladder.** AUTHORISED, prepaid raised, typed, computed, "Needs a price", in that order; W1 to
  W13 hold; a backdated range and a rate edit reach only unheld Procedures; a Contract change clears a
  typed price; no difference invoice ever.
- **The arithmetic.** Each figure rounded once; the discount line reconciles to the cent; $0 keeps BTM
  and raises a "No charge" invoice with no payable; a group of only prepaid Procedures raises none.
- **The gates are in the store.** The anaesthetist only on an allowing RVG Contract or No contract ·
  Fixed price; never fixed, prepaid or another fallback; the office until AUTHORISED except a raised
  prepaid price; `editProcedure` cannot write `enteredPrice`; no reason anywhere; every change audited.
- **What the anaesthetist sees.** The price on every Contract, updating, quiet; read-only with no
  disabled inputs pretending where she may not.
- **Rate x time gone everywhere**; Aria at $26.50; parity identical apart from Fitzgerald;
  `PERSIST_VERSION` bumped each session; generator and canvas untouched.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry), each with its route and persona:
  - the anaesthetist now sees what the price comes to and the Booking total (US-03.3.10, RV-29; the
    widget restored from `d1562b4c` without its setting): Donald to confirm, Greg to hear of it;
  - the office's prepaid price read-only once its invoice is raised (A16, narrowing OQ-96's 28 October
    wording);
  - the interim AUTHORISED and prepaid reads until 25 and 27;
  - the no-charge invoice with no payable or BCTI and a $0.00 Xero ACCREC;
  - no list of the Procedures a new range re-prices (D79's default, OQ-133 open); no holder
    references (D82's default, OQ-136 open);
  - each seeded Contract's override setting, the demo discount Contract and the trigger's range figure;
  - Fitzgerald's new Aria figure.
- **Status row and phase entry:** the drift check against `fbdd555`; `PERSIST_VERSION` from and to;
  the real names (`priceFor`, `anaesthetistMayTypePrice`, `officeMayChangePrice`, `setProcedurePrice`,
  `PriceCard`, `PricingSheet`, `BookingTotalStrip`); the Aria figures before and after; the parity
  result; tests added; the review pass; `REPORT.md` counts before and after.
- **Decisions log:** work item 14.
- **Handoff notes:**
  - **25:** replace `authorisedPriceFor` with the snapshot (the kind, rate, discount, range in force,
    `enteredPrice`, BTM, unit value and the result); add "Needs a price" to `authoriseBlockersFor`;
    "Regenerate from locked data" reproduces the discount line and the no-charge invoice.
  - **27:** replace `prepaidHeldPriceFor` with `prepaidAmountFor`; `officeMayChangePrice` already
    refuses once raised; remove the deposit netting; prepaid Procedures stay off the final invoice (D57).
  - **36:** a no-charge invoice has a $0.00 receivable leg and no payable.
  - **38b and 39:** a raised prepaid price is corrected by a credit or an additional invoice.
  - **39b:** the rate x time line is gone; remove BillingLine.
  - **43a:** keep the price line, its read-only state, the dock strip and the web total (visible, not
    prominent).
  - **44:** re-script the S1 Beat 3 aside.
