# Review 06 - BTM calculation (base, time, modifiers)

**RFP source:** `docs/rfp-reference/RFP.md` lines 939-1123
**Reviewed:** 2026-07-27
**Lens:** demo-readiness (see `00-SUMMARY.md` for method)
**Note:** MISSING / PARTIAL claims in this file are unverified. `00-SUMMARY.md` carries the
adjudicated verdicts after the adversarial pass.

## Coverage table

| # | RFP feature or rule | Req ID | Status | Where in the app | Evidence |
|---|---|---|---|---|---|
| 1 | RVG produces RVUs, not dollars; `Fee = (B + T + M) x anaesthetist's $/unit` (947-953) | B3 | BUILT | `aa-prototype/src/domain/billing/fee.ts:180` | `fee.ts:224-233` builds the RVG line as `billableUnits * unitRate`; test `fee.test.ts:71` "PAPER SPOT-CHECK: 2h30m at $30/unit, base 10 + AS3 = (10 + 11 + 3) x 30 = $720"; `m4-01-fee-panel.png` shows "TOTAL UNITS 8" beside "FEE @ $26.50/UNIT $212.00" |
| 2 | Unit value stored **per anaesthetist**, not one global price list (950-953) | B3, A6 | BUILT | `aa-prototype/src/domain/types.ts:146`, `aa-prototype/src/domain/seed/cast.ts:45` | 15 distinct seeded rates ($26.00 to $42.00), `cast.ts:45-58`; test `store/btmCapture.test.ts:133` "an identical capture prices at $212.00 under Souter and $336.00 under Strand"; `a7-04-masters.png` shows the Unit $ column per anaesthetist |
| 3 | The unit value is a maintainable setting | A6 | BUILT | `aa-prototype/src/store/mastersActions.ts:195` | `> 0` guard at `mastersActions.ts:195` and `:254`; office-only role guard proven by `store/mastersActions.test.ts:80`; edit UI `apps/admin/flows/EditAnaesthetistSheet.tsx:62`, add UI `apps/admin/flows/AddAnaesthetistFlow.tsx:70` |
| 4 | Base units looked up from an RVG code table organised by anatomical site (971-973) | B3 | BUILT | `aa-prototype/src/domain/seed/rvgCodes.ts` | 34 codes each carrying `anatomicalSite`; picker groups by site, `m4-02-code-picker.png` shows the ABDOMEN group with "B 9 to 11", "B 9", "B 7", "B 6", "B 5" |
| 5 | Base values "range roughly from 4 units to 20 to 22 units (major vascular, neurosurgery)" (972-981) | B3 | PARTIAL | `aa-prototype/src/domain/seed/rvgCodes.ts:14-52` | The master spans 3 (cataract `42702`, cystoscopy `36561`) to 11 (`20880` range 9 to 11). Nothing above 11, no neurosurgery or major-vascular site |
| 6 | Only one base code charged per anaesthetic (981) | B3 | BUILT | `aa-prototype/src/domain/types.ts:487` | `rvgBaseCode?: string` is scalar ("One base code per procedure"); `fee.ts:55` docblock states the cap; the picker is single-select (`ProcedureCodeCard.tsx:38-46`) |
| 7 | A curated dropdown the anaesthetist selects manually; no automatic code derivation (1025-1029) | M4 | BUILT | `aa-prototype/src/shared/capture/ProcedureCodeCard.tsx:62`, `CodePickerSheet.tsx` | Bottom-sheet picker with a search field and site groupings, `m4-02-code-picker.png`; nothing derives the code from the operation text |
| 8 | Some codes are ranges ("6 to 8 units"), the exact figure left to professional judgement (1018-1019) | D4, M4 | BUILT | `aa-prototype/src/shared/capture/ProcedureCodeCard.tsx:131` | `baseUnits: {kind:'range', min, max}` in `rvgCodes.ts:16`; `RangeUnitsRow` clamps to the range; test `fee.test.ts:45` "a range base code uses the selected value"; validator `validateCardForBilling.ts:153-163` + test `validateCardForBilling.test.ts:120-125` |
| 9 | A range code with no selection must not silently bill (1018-1019) | M5 | BUILT | `aa-prototype/src/domain/billing/fee.ts:68` | Counts 0 in the calculator, flagged by the validator with "Base code NR59 needs a selected unit value between 5 and 9"; test `fee.test.ts:50` |
| 10 | Positioning sometimes absorbed by the base code; the system must know which, to avoid double-charging (1020-1023) | B3 | BUILT | `aa-prototype/src/domain/billing/modifierUnits.ts:34` | `absorbsModifierCodes: ['P1']` on hip, shoulder and spine codes (`rvgCodes.ts:25-40`); test `modifierUnits.test.ts:35` "refuses (zeroes) P1 when the base code absorbs it, with a reason"; `m4-01-fee-panel.png` shows the P1 chip struck through with "Base code 47516 already includes P1; its units are not added." |
| 11 | T1: 1 unit per 15 minutes for the first 2 hours (1038) | B3 | BUILT | `aa-prototype/src/domain/billing/timeUnits.ts:26` | `timeUnits.test.ts:10-23` table: 15 min = 1, 90 min = 6, 119 min = 8 |
| 12 | T2: 1 unit per 10 minutes from the start of the third hour (1041) | B3 | BUILT | `aa-prototype/src/domain/billing/timeUnits.ts:29` | Same test table: 150 min = 11 (8 + 3), 300 min = 26 (8 + 18) |
| 13 | The T1/T2 boundary itself | B3 | BUILT | `aa-prototype/src/domain/billing/timeUnits.ts:28` | Exactly 120 min stays in tier 1 at 8 units; 121 min = 9. Both pinned in `timeUnits.test.ts:17-18` |
| 14 | Partial-interval treatment (RFP is silent) | B3 | BUILT as a labelled assumption | `aa-prototype/src/domain/billing/timeUnits.ts:13` | `PARTIAL_INTERVAL_ROUNDING = 'up'`, asserted by `timeUnits.test.ts:5`; surfaced to users in `shared/capture/TimesCard.tsx:132` and `shared/capture/UnitsCard.tsx:63`; `m4-04-finish-stamped.png` reads "Duration 1 h 10 m" then "5 time units", with "1 unit per 15 min for the first 2 hours, then 1 per 10 min. Part intervals round up (assumption to confirm with AA)." |
| 15 | Time runs from takeover of care to PACU handover (993-995) | M4, D4 | BUILT | `aa-prototype/src/domain/billing/fee.ts:44` | `capturedMinutes` uses `anaestheticStartISO` to `handoverISO`; Start now / Finish now stamps in `TimesCard.tsx`; validator demands both and demands handover after start (`validateCardForBilling.ts:140-150`) |
| 16 | Non-positive or absent spans must not produce units | B3 | BUILT | `aa-prototype/src/domain/billing/timeUnits.ts:27` | `timeUnits.test.ts:25` and `:37` cover negative and zero spans; `fee.ts:45-48` returns 0 for missing or non-finite spans |
| 17 | Modifiers layer on top of base + time (1050-1051) | B3 | BUILT | `aa-prototype/src/domain/billing/fee.ts:98` | `totalUnits = base + time + modifiers`; `a7-02-review.png` shows a per-card "B · T · M" column beside UNITS and FEE |
| 18 | The modifier group table: PA1-PA5, A1-A2, AS1-AS4, ASE, OB1-OB4, P1, AI1, post-op (1062-1097) | B3 | BUILT | `aa-prototype/src/domain/billing/modifierCodes.ts:17` | All eight groups present and asserted by `modifierUnits.test.ts:7` "covers all the RFP-named groups"; values sit inside the RFP's stated ranges (PA 1 to 4, A 1 to 2, AS 0 to 4, ASE +2, OB 0 to 3, P1 +2, AI1 +2); chips render "code · label · +units" (`ModifierChips.tsx:67`), visible in `m4-01-fee-panel.png` |
| 19 | Some modifiers are flat flags, others depend on a score or band (1050-1051) | B3 | BUILT | `aa-prototype/src/domain/billing/modifierCodes.ts:30-44` | ASE / AI1 / P1 are flat +2; AS, OB, A and PA are banded ladders |
| 20 | Modifier master visible as reference data | A6 | BUILT | `aa-prototype/src/apps/admin/screens/MasterData.tsx:431` | "Modifier codes" view (code, group, units, description), plus an "RVG codes" view at `MasterData.tsx:410` showing base units and the Absorbs column; nav visible in `a7-04-masters.png` |
| 21 | ASA captured in its own field, separate from the M total (1055-1057) | M4 | BUILT | `aa-prototype/src/shared/capture/AsaCard.tsx:40` | Dedicated "ASA STATUS" segmented control; `ModifierChips.tsx:24` deliberately filters group `AS` out of the chip set; `m4-03-asa-flash.png` |
| 22 | The ASA score seeds the M field with its corresponding unit value (1057-1059) | M4, B3 | BUILT | `aa-prototype/src/domain/billing/fee.ts:79-85` | `ASA_SEED_UNITS` AS1=0, AS2=1, AS3=3, AS4=4 (`modifierCodes.ts:63`), asserted by `modifierUnits.test.ts:12`; caption "ASA III seeds +3 modifier units" in `m4-03-asa-flash.png`; M row caption composes "AS3 +3 · A1 very old +1" (`UnitsCard.tsx:89`) |
| 23 | The anaesthetist then adjusts M to add other applicable modifiers (1058-1059) | M4 | BUILT | `aa-prototype/src/shared/capture/UnitsCard.tsx:68` | M stepper writes `{units, source:'overridden'}`; chips add other codes; `fee.ts:87-91` lets an overridden capture beat the computation |
| 24 | "As with all fields on the Card, the seeded value is overridable" (1059) | D4 | BUILT | `aa-prototype/src/shared/capture/UnitsCard.tsx:37-44` | B, T and M all steppable with provenance and an explicit "Use seeded value" reset; test `fee.test.ts:33` "an overridden captured value beats the seeded computation"; admin review surfaces "B adjusted +2 manually" (`apps/admin/reviewFlags.ts:93-107`) |
| 25 | ASA must not be double-counted if also selected as a chip | B3 | BUILT | `aa-prototype/src/domain/billing/fee.ts:81-84` | Test `fee.test.ts:55` "does not double-count an ASA class repeated in the chip selection" |
| 26 | ACC arrangements are ordinary BTM structures; no distinct billing path or calculation model (1110-1113) | B9 | BUILT | `aa-prototype/src/domain/types.ts:469-473` | `accRelated` is documented as informational only and is never read by `domain/billing/`; `a7-02-review.png` row "Gavin Brown · Ureteroscopy with lithotripsy, ACC claim" bills B4 T4 M1 = 9 units on the "ACC elective services via St George's (Type 2)" contract for $225.00 (9 x $25) |
| 27 | ACC patients are never billed directly (1108-1110) | B9 | BUILT as an office advisory | `aa-prototype/src/apps/admin/reviewFlags.ts:85` | Warn flag "ACC should not bill the patient directly" when `accRelated` sits on the Billable Party route; test `apps/admin/reviewFlags.test.ts:57` |
| 28 | ACC contracts are set up with the hospital or contract holder and carry their own billing rules (1120-1122) | B2, B9 | BUILT | `aa-prototype/src/domain/seed/contracts.ts` | Seeded ACC contracts (St George's Type 2 ACC elective, an externally held COS ACC contract used by the Phase 09 demo trigger at `apps/demo/DemoControlPanel.tsx:177`); contract type drives the rate, not ACC-ness |
| 29 | A procedure can be marked ACC-related by a user | B9 | PARTIAL | not found in any surface | `accRelated` appears in only 4 `.tsx` files, all read-only display (`apps/web/screens/AccountsScreen.tsx:111`, `apps/mobile/screens/BalancesScreen.tsx:92`); every create path hardcodes `accRelated: false` (`store/cardActions.ts:132,217,341,421`) |
| 30 | ACC pre-operative assessment flat-fee code set (CS250, CS260, CS70) noted as a confirmation item (1114-1118) | B9 | PARTIAL | `aa-prototype/src/shared/capture/AddBillingLineSheet.tsx:85` | A fixed-amount billing line is offered with the hint "A flat-fee line alongside the procedure, e.g. an ACC pre-op flat fee." No CS code set exists (`grep -rn "CS250\|CS260\|CS70" src` returns nothing) and the RFP's TBC is not surfaced as a discovery talking point |
| 31 | Pre-assessment as a billable modifier group (1064-1066) | B3 | BUILT | `aa-prototype/src/domain/billing/modifierCodes.ts:20-24` | PA1 to PA5 at 1 to 4 units, chip labels at `shared/capture/modifierLabels.ts:6-10` |
| 32 | Post-operative care events separately itemised, sometimes days later (1095-1097, 1043-1047) | B8 | BUILT | `aa-prototype/src/store/cardActions.ts:270` | `addPostOpAddendum` creates a new linked Card on today's free session, "bills its own B/T/M" (`cardActions.ts:352` comment), original stays locked; UI entry `shared/card/CardDetailBody.tsx:472-485`; tests `store/postOpAddendum.test.ts` |
| 33 | One episode can generate more than one billable line item over time (1045-1047) | B6, B8 | BUILT | `aa-prototype/src/domain/billing/invoiceBuild.ts` | Multiple `BillingLine`s per procedure plus the addendum Card path; `invoiceBuild.test.ts` covers multi-invoice grouping per Card |
| 34 | Pain consults, medical transport, HDU and ward reviews carry their **own separate time-based charges** (1043-1045) | B8, B3 | PARTIAL | `aa-prototype/src/domain/seed/rvgCodes.ts`, `aa-prototype/src/shared/capture/AddBillingLineSheet.tsx` | The addendum Card can capture B/T/M, but the only base codes to pick are 34 surgical procedures; there is no consult / review / transport code, so a post-op event is chargeable only as a hand-typed fixed amount or (contract permitting) a rate x time line |
| 35 | Invoice must be reproducible against the units and rate that were true when raised | D4, B6 | BUILT | `aa-prototype/src/domain/billing/invoiceBuild.ts:248` | RVG invoice lines snapshot "<description>, N units at $X.XX per unit"; captured BTM inputs persisted as data (`domain/types.ts:483-496`) |
| 36 | Money rounding discipline on the unit path | B3 | BUILT | `aa-prototype/src/domain/billing/money.ts:8` | `roundToCents` at each amount; a Type 2 percent discount rounds the derived $/unit before multiplying (`fee.ts:192-195`) so the displayed rate and the charged amount cannot disagree; test `fee.test.ts:93` (10% off $30 = $27, 24 x 27) and `fee.test.ts:221` |
| 37 | The tiered maths implemented as pure, unit-tested functions | B3 | BUILT | `aa-prototype/src/domain/billing/` | 8 test files, 122 tests green: `npx vitest run src/domain/billing src/store/btmCapture.test.ts` |

### Worked examples hand-checked against the RFP tables

Checked by hand, not by trusting the tests.

**Example A - the paper spot-check (`fee.test.ts:71`).** Base code 10 units, ASA III, 08:00 to 10:30.
Time = 150 min: first 120 min at 1 unit / 15 min = 8 units; remaining 30 min at 1 unit / 10 min = 3
units; T = 11. M = AS3 seed = 3. Total 10 + 11 + 3 = 24 units. At $30.00 per unit = **$720.00**.
Matches the RFP's tier definitions exactly (lines 1038-1041) and matches the app.

**Example B - the admin review list, six live cards (`a7-02-review.png`, Dr Kate Morrison at $35.00).**

| Patient | Code (base) | Times | Minutes | T by the RFP rule | B·T·M shown | Units | Fee | Hand-check |
|---|---|---|---|---|---|---|---|---|
| Olive Ratima | 36840 (5) | 08:04 to 09:10 | 66 | ceil(66/15) = 5 | 5 · 5 · 3 | 13 | $455.00 | 13 x 35 = 455 |
| Harriet Bishop | 36561 (3) | 09:18 to 09:52 | 34 | ceil(34/15) = 3 | 3 · 3 · 0 | 6 | $210.00 | 6 x 35 = 210 |
| Gavin Brown | 37623 (4) | 10:00 to 10:56 | 56 | ceil(56/15) = 4 | 4 · 4 · 1 | 9 | $225.00 | 9 x 25 (ACC Type 2 agreed rate) = 225 |
| Sione Parata | 36840 (5) | 11:04 to 12:02 | 58 | ceil(58/15) = 4 | 5 · 4 · 1 | 10 | $350.00 | 10 x 35 = 350 |
| Hine Patel | 36561 (3) | 12:10 to 12:38 | 28 | ceil(28/15) = 2 | 3 · 2 · 0 | 5 | $175.00 | 5 x 35 = 175 |
| Andrew Lawson | 37623 (4) | 12:44 to 13:22 | 38 | ceil(38/15) = 3 | 4 · 3 · 0 | 7 | $245.00 | 7 x 35 = 245 |

Every base figure matches `rvgCodes.ts`, every T matches the T1 rule under the labelled round-up
assumption, and the footer totals (50 units, $1,660.00) are the exact column sums. The ACC row
prices at its contract's agreed unit rate rather than the anaesthetist's own, which is the RFP's
Type 2 behaviour, not a BTM divergence.

**Example C - the mobile Ellison capture (`m4-04-finish-stamped.png`, `m4-01-fee-panel.png`).**
Code 47516 (base 7, absorbs P1), 16:05 to 17:15 = 70 min, ceil(70/15) = 5 time units (shown as
"Duration 1 h 10 m" resolving to "5 time units"). At 08:00 with no finish stamped the panel shows 8 units
(B7 + T0 + M1 from A1 "very old", patient aged 72) and $212.00 = 8 x $26.50. All three figures
reconcile.

No numerical divergence found in the tier maths, the absorption rule, the ASA seeding or the
rounding. The divergences below are in table coverage and in two display captions.

## Findings

### 06.1 - The base-unit table never reaches the RFP's stated top end  [PARTIAL]
- **RFP says:** "Values range roughly from 4 units (minor/superficial) to 20-22 units (major
  vascular, neurosurgery)." (lines 972-981)
- **Built:** a 34-code curated master spanning 3 to 11 base units, organised by anatomical site -
  `aa-prototype/src/domain/seed/rvgCodes.ts:14-52`. The largest is `20880` gastric bypass
  (range 9 to 11); there is no neurosurgery site and no major-vascular code (the only vascular
  entry is `34800` varicose veins at 4 units). Two codes sit at 3 units, below the RFP's stated
  floor of roughly 4.
- **Gap:** the demo never shows a high-complexity anaesthetic. A base-20 case would also be the
  most persuasive illustration of why the base table "can't be a fixed lookup" and why one code is
  capped per anaesthetic. The logged decision (`PROGRESS.md` 2026-07-23 area, RVG values
  "demo-plausible, not sourced from an NZSA schedule", `rvgCodes.ts:1-9`) covers the *accuracy* of
  individual values; it does not claim the *range* was deliberately truncated.
- **Would a workshop audience notice:** possibly. AA's audience includes anaesthetists who know
  their own RVG book; scrolling a code picker whose ceiling is 11 units invites "where is
  neurosurgery?" The engine is right, the catalogue is thin.
- **Severity:** cosmetic

### 06.2 - No non-procedural codes for the separately itemised post-op / consult events  [PARTIAL]
- **RFP says:** "Several billable events outside the main procedure also carry their own separate
  time-based charges - for example pain consultations, medical transport, and HDU or ward review
  visits that may occur days after the original procedure." (lines 1043-1045)
- **Built:** the *mechanism* is complete. `addPostOpAddendum`
  (`aa-prototype/src/store/cardActions.ts:270-380`) creates a new linked Card against the locked
  original that "bills its own B/T/M (not time-only - it is a distinct billable item)"
  (`cardActions.ts:352`), with a demo trigger (`apps/demo/DemoControlPanel.tsx:320`) and UI copy
  naming exactly the RFP's examples: "A post-op charge (an HDU review, pain consult or nerve
  catheter) bills as a new linked card on today's free session"
  (`shared/card/CardDetailBody.tsx:483`). PO1 and PO2 modifier codes exist.
- **Gap:** the addendum's code picker offers only the 34 surgical procedure codes. There is no
  pain-consultation, ward-review, HDU-review or transport code with its own time-based rate, and
  `validateCardForBilling.ts:130` requires "an RVG base code or at least one billing line" to
  complete. So the only honest way to charge a pain consult in the prototype is a hand-typed fixed
  amount (`AddBillingLineSheet`), or a rate x time line where the contract sets
  `permitsIndividualArrangement` - neither of which is the RFP's "its own separate time-based
  charge" on the RVG path. The seeded pre-op assessment clinic reinforces the hole: the six Thu 23
  pre-op cards (`domain/seed/cards.ts:1040-1050`) carry a description only, with no code and no
  billing line, so there is no worked example anywhere of a non-theatre event being charged.
- **Would a workshop audience notice:** yes, if the presenter walks B8. The addendum opens on a
  capture screen whose first control is "Procedure code", and the picker has nothing that fits a
  ward review. The presenter has to narrate around it.
- **Severity:** notable

### 06.3 - `accRelated` cannot be set by any user  [PARTIAL]
- **RFP says:** ACC-relatedness is who the contract holder ultimately claims from, "which is
  invisible to the billing engine" (lines 1110-1113), while ACC patients "are never billed
  directly" (line 1108).
- **Built:** the flag is typed and documented as informational (`domain/types.ts:469-473`), seeded
  onto an `accRelatedCard` marker used by `store/billingRun.test.ts:127`, displayed as an ACC
  column in the web Accounts screen (`apps/web/screens/AccountsScreen.tsx:111`) and as a chip in
  mobile Balances (`apps/mobile/screens/BalancesScreen.tsx:133`), and drives the authorisation
  advisory (`apps/admin/reviewFlags.ts:85`).
- **Gap:** no surface writes it. `grep -rn "accRelated" --include="*.tsx" src` returns display code
  only; `EditProcedureSheet` edits description, route, insurer, payment category and billing
  reference but not ACC (`shared/flows/EditProcedureSheet.tsx:51-55`), and every procedure-create
  path hardcodes `accRelated: false` (`store/cardActions.ts:132, 217, 341, 421`). A presenter can
  show the ACC advisory only on the seeded card; they cannot make a card ACC live.
- **Would a workshop audience notice:** only if asked to. The seeded ACC row in the review queue
  demos the rule adequately; the missing control shows up if someone says "mark this one ACC".
- **Severity:** cosmetic

### 06.4 - The ACC pre-op flat-fee code set is not modelled or flagged as a discovery item  [PARTIAL]
- **RFP says:** "ACC pre-operative assessment has previously been described as using its own
  flat-fee code set (CS250, CS260, CS70), separate from the general BTM structure... worth a brief
  confirmation." (lines 1114-1118)
- **Built:** `REQUIREMENTS.md` B9 promises "optional flat-fee pre-op codes noted", and the capture
  sheet delivers a generic version of that: the fixed-amount option reads "A flat-fee line
  alongside the procedure, e.g. an ACC pre-op flat fee."
  (`shared/capture/AddBillingLineSheet.tsx:85`).
- **Gap:** the three codes are named nowhere in the app (`grep -rn "CS250\|CS260\|CS70" src` is
  empty), and the RFP's own TBC is not surfaced as a discovery talking point the way the
  time-rounding assumption is (control panel note + capture caption). Since this is one of the
  section's few explicit "confirm with AA" items, a visible prompt would be cheap.
- **Would a workshop audience notice:** unlikely to notice the absence; a billing-side attendee may
  raise the codes unprompted, and there is no place in the demo that anticipates it.
- **Severity:** cosmetic

### 06.5 - The M row caption still credits a modifier the base code absorbs  [PARTIAL]
- **RFP says:** the absorption rule exists "to avoid double-charging" (lines 1020-1023) - the
  system must know which base codes absorb which modifiers.
- **Built:** the maths is right. `modifierUnits` refuses the absorbed code and the chip renders
  struck through with the verbatim reason (`modifierUnits.ts:34-40`,
  `shared/capture/ModifierChips.tsx:64` and `:72-75`).
- **Gap:** `modifierBreakdown` in `shared/capture/UnitsCard.tsx:89-102` iterates
  `selectedModifierCodes` and prints "+units" for every one, with no absorption check. Reachable
  sequence: pick a non-absorbing code (e.g. `20941`), tap the P1 chip, then use "Change" to pick
  `47516` (which absorbs P1). `ProcedureCodeCard.pick` clears `baseUnitsSelected` and
  `baseUnitsCaptured` but deliberately not `selectedModifierCodes`
  (`ProcedureCodeCard.tsx:40-45`), so the M caption reads "AS1 +0 · P1 positioning +2" while the M
  stepper correctly shows 0. The caption and the number disagree.
- **Would a workshop audience notice:** only if the presenter changes the code after selecting P1,
  and only if someone adds up the caption. The headline number stays correct.
- **Severity:** cosmetic

### 06.6 - The review footer labels one unit rate on a list that priced at two  [PARTIAL]
- **RFP says:** each anaesthetist sets their own dollar value per unit; the fee is units x that
  value (lines 950-953). Contract types can substitute a different rate (RFP's later billing
  methods section).
- **Built:** the admin review totals row prints `@ ${unitRate}/unit (list rate)` from the
  anaesthetist's own `unitValue` (`apps/admin/screens/ReviewScreen.tsx:92` and `:248`). Per-card
  fees are computed correctly per contract.
- **Gap:** on the seeded Morrison list the footer says "@ $35.00/unit (list rate)" beside "50 units
  · $1,660.00", but one card (the ACC Type 2 row) priced at $25.00 per unit, so 50 x $35.00 =
  $1,750.00, not $1,660.00. The parenthetical "(list rate)" is doing a lot of work.
- **Would a workshop audience notice:** possibly, since the three tiles invite exactly that
  multiplication. Visible in `a7-02-review.png`.
- **Severity:** cosmetic

## Deliberate exclusions in this section

- **Authoritative NZSA unit values.** `PROGRESS.md` Decisions log, 2026-07-22 ("Modifier code table
  lives in `src/domain/billing/modifierCodes.ts`... Values explicitly labelled demo-plausible") and
  the ASA-seeding entry the same day (AS1=0, AS2=1, AS3=3, AS4=4, "inside the RFP's 0 to 4 range").
  Both `rvgCodes.ts:1-9` and `modifierCodes.ts:1-13` repeat the label in code, and the app repeats
  it to the user in `ModifierChips.tsx:77` and on both master-data views. Supplying the real tables
  is an open discovery item for AA and NZSA, not a prototype gap.
- **Auto-recompute of an overridden component.** `UnitsCard.tsx:21-30`: once B, T or M is stepped,
  provenance is captured fact and there is no auto-clear on numeric equality, because Phase 07's
  "adjusted manually" review flags key off it. Changing the ASA class afterwards therefore does not
  move M until the user taps "Use seeded value". Deliberate, labelled in the row itself.
- **ASA classes V and VI.** The RFP's own modifier table names AS1 to AS4 only (line 1071); the
  prototype matches the RFP rather than the full clinical ASA scale.
- **A rules-driven base-code selector.** The RFP explicitly rejects one (lines 1025-1029); the
  prototype's curated manual picker is the RFP's own preference, not a shortcut.

## RFP tensions in this section, and the choice made

| Tension | RFP lines | Resolution | Decision ref |
|---|---|---|---|
| The T1/T2 tiers are defined but partial-interval rounding is not stated anywhere | 1032-1041 | Round UP per started interval, implemented as the named constant `PARTIAL_INTERVAL_ROUNDING` and surfaced to users twice (capture caption, control panel) as an assumption to confirm with AA | `PROGRESS.md` Decisions log 2026-07-22, "Time-unit partial-interval rounding = round UP per started interval - a named ASSUMPTION, not a settled rule" (line 87) |
| ASA "seeds the M field" yet AS1-AS4 are also listed as modifier codes in the same table, so the seed could double-count | 1055-1071 | ASA is captured in its own field; the AS group is filtered out of the picker; the calculator adds the ASA code only when the selection does not already contain it | `ModifierChips.tsx:28` (band controls since 2026-07-28), `fee.ts:81-84`, test `fee.test.ts:55`. Values logged at `PROGRESS.md` line 89 |
| "ACC patients are never billed directly" vs "who the contract holder claims from is invisible to the billing engine" | 1108-1113 | Advisory, not an engine guard: `accRelated` never reaches `domain/billing/`, and a Billable-Party-route ACC procedure raises an office review warning at authorisation | `REQUIREMENTS.md` B9 ("an office-practice flag, not an engine guard"); `domain/types.ts:469-473` records it as 6th review #3 |
| ACC pre-op flat-fee codes (CS250/CS260/CS70) vs "ACC does not require a distinct billing path" | 1114-1118 | Treated as a generic ancillary fixed-fee billing line; the code set is not modelled. The RFP itself marks it TBC | `REQUIREMENTS.md` B9 "optional flat-fee pre-op codes noted"; no PROGRESS.md decision records the choice (see 06.4) |
| Range base codes leave the figure to professional judgement, but an invoice must be reproducible | 1018-1019 vs RFP principle 10 | The chosen figure is persisted as `baseUnitsSelected` (captured data, not a derivation) and the validator refuses an absent or out-of-range choice | `REQUIREMENTS.md` D4 ("the captured BTM inputs persisted as data, not just computed totals"); `validateCardForBilling.ts:153-163` |
| Positioning "sometimes already built into the base code" and sometimes added as P1 | 1020-1023 | An explicit `absorbsModifierCodes` list per RVG code; the chip is disabled and struck through and the domain's refusal reason is rendered verbatim | `rvgCodes.ts:25-40`, `modifierUnits.ts:34-40`; visible in `m4-01-fee-panel.png` |

## Beyond the RFP

- **Unit provenance as a first-class concept.** Every B/T/M component carries `seeded` or
  `overridden` (`fee.ts:28-31`), which powers the "Adjusted manually · Use seeded value" affordance
  and the admin review's "B adjusted +2 manually" flags with the delta against the natural value
  (`apps/admin/reviewFlags.ts:93-107`). The RFP only asks that seeded values be overridable.
- **Refusal reasons as user-facing copy.** `modifierUnits` returns `{code, reason}` and the UI
  renders the sentence verbatim rather than silently zeroing a chip (`ModifierChips.tsx:72-75`).
- **Honest demo labelling in the product itself.** The rounding assumption and the
  demo-plausible-values caveat are printed on the capture screen, not just in the docs.
- **Rate rounding discipline.** A Type 2 percent discount rounds the derived dollars-per-unit to
  cents *before* multiplying (`fee.ts:192-195`) so a displayed "$27.00 per unit" can never disagree
  with the charged amount.
- **Unit snapshot on the invoice line.** "N units at $X.XX per unit" is written into the line
  description because `InvoiceLine` carries no rate field (`invoiceBuild.ts:243-250`).
- **Negative-fee guard.** A price override that would drive a procedure below zero is refused,
  because a negative invoice is a credit note (`validateCardForBilling.ts:235-243`).
- **Funder-split conservation to the cent.** Once any billing line carries a funder override, the
  line amounts must sum exactly to the computed fee (`validateCardForBilling.ts:248-258`).
- **Read-only master views of both tables.** RVG codes (with an Absorbs column) and modifier codes
  are browsable in the Admin app, which makes the absorption rule inspectable during a workshop
  (`apps/admin/screens/MasterData.tsx:410-449`).
