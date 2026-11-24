# Phase 25a · Contract change warnings, the Disabled Contract flag and the hospital reference removed

**Requirements covered** (at catalogue `63a4490`):
[DM-69](../analysis/domain-model-delta.md#dm-69) Contract change consequences: a warning listing Procedures still on an old Contract, a warning listing authorised Procedures a backdated range left at their old price, and a review flag on a Disabled Contract (RuleChange, M) ·
[DM-68](../analysis/domain-model-delta.md#dm-68) the Procedure's hospital contract or approval reference and its completeness prompt removed (RemovedEntity, S; unparked).
**Follows up, without moving their covers** (they stay on their built phases):
built 18's [US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) Create, edit and disable Contracts (Verify; **Contradicts**: no dated-change or disable warning, no flag),
19a's [US-04.2.15](../../../../requirements-board/requirements/stories/US-04.2.15.md) Price ranges on a fixed price (Verify; Partial: no kept-price warning),
21a's [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) Office review (Verify; Partial: no Disabled Contract flag),
21's [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) (the add form's stale "Payer row" hint; 22a's provisional label),
17's [US-01.3.6](../../../../requirements-board/requirements/stories/US-01.3.6.md) (the "Tier names are provisional." line) and
19b's [US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md) (the OQ-95 note on the Modifiers master).
**Touches, re-shot only:** [US-08.4.1](../../../../requirements-board/requirements/stories/US-08.4.1.md) (the holder layout's cross-match), [US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md) (33 owns it; the office setup loses its Reference row).
Context: [US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md) (the Contract audit the disable day is read from), [US-04.2.18](../../../../requirements-board/requirements/stories/US-04.2.18.md) (the holder reference code, which stays).
**Depends on:** 21a (the review-flag list), 25 (Contract history, the lock), U6 (and through it U1 to U5), all built. Runs after 27a, before 39, 39b, 43 and 43a.
**Estimated:** 2 sessions, Contracts track. Cut line: session 1 the two selectors, the three warnings and the flag with its seeded case, green; session 2 the reference removal, the payer clean-up, the tier and age-band caveats, recaptures and the demo guide.

## Goal

Build Donald's 18 November answers on the built Contracts track (for the build, not yet confirmed by AA; built as answered, no provisional label):

- **Dated change (US-04.1.2, D79).** Creating a Contract can name the Contract it replaces and the date it takes over from. The app warns
  and lists every Procedure dated on or after that date still on the old Contract. Disabling a Contract warns and lists the same way from
  the disable day. Nothing moves by itself.
- **Kept price (US-04.2.15, D79).** A price range added (or edited) over authorised Procedures warns how many kept their locked price and
  lists them. Re-priced Procedures are never listed.
- **Disabled Contract flag (US-07.2.2, D81).** A not-yet-authorised Procedure dated on or after its Contract's disable day is flagged at
  review, never blocked. The day is read from the `contract.disable` audit entry, never a new date field.
- **No hospital reference (DM-68, D82).** `Procedure.billingReference`, its capture in three forms, `billingReferenceMissing` and the
  Reference prompt, its copy in 25's snapshot and the cross-match `hospitalRef` go. Nothing prints in its place (OQ-142 open, D88).
- **Answered caveats off the screen (D85, D36, D29).** 22a's "Provisional, OQ-140" pill and comments, the add form's "Booking's Payer row"
  hint, 17's "Tier names are provisional." and 19b's "The age bands are still to confirm with AA (OQ-95)" go, with their code comments
  reworded. 44's sweep then only verifies.

No S1 to S5 figure, invoice total or BCTI count moves.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `63a4490` (the context pack runs it):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-04.1.2,US-04.2.15,US-07.2.2,US-04.1.3,US-04.2.18,US-08.4.1,US-11.4.3,US-11.2.2,US-01.3.6,US-05.1.5,US-03.3.8,OQ-133,OQ-135,OQ-136,OQ-140,OQ-142,OQ-95,OQ-102
   ```

   Re-read a changed item whole and adjust the work items; drop Retired or Future work and say so in the PROGRESS entry.
2. **Built as answered** (no provisional label): OQ-133 (D79, two warnings), OQ-135 (D81, a flag, never a block), OQ-136 (D82, no
   reference but the insurer approval number), OQ-140 (D85, the payer on each Procedure), OQ-95 (D29), OQ-102 (D36).
   **Open, built as its default:** [OQ-142](../../../../requirements-board/requirements/questions/OQ-142.md) (D88): the holder's cross-match
   prints the procedure date and surgeon only; no ACC claim number. Nothing to label; logged on "For the owner's review".
3. **Stops.**

| Item | Build (the reading at `63a4490`) | If it has changed |
|---|---|---|
| OQ-142 | Print nothing in the reference's place | Answered "print the approval number": add it to `crossMatchFor` only (the Booking's `insuranceApprovalNumber`), one field |
| US-04.1.2 Technical discussion | "Replaces" and its date are warning-only (a build choice) | It now asks for a stored link: store `replacesContractId` and the date in the `contract.create` audit entry, never as a date on the Contract |
| US-07.2.2 "Disabled Contract" AC | Flag on or after the disable day; earlier ones unflagged | A block, or a flag on every Procedure: stop and report |

4. **Confirm DONE:** 21a, 25 and U6 (and 26, 27, 27a by the run order). Note from each:
   - 21a: `REVIEW_FLAG_RULES`, `ReviewBookingInput`, `reviewInputFor` (`store/reviewSelectors.ts`), the `review-flag` hook, 21a's
     review-flags List (`REVIEW_FLAGS_LIST_ID`, Dr Chen, Tue 14 Jul AM, `seed/reviewFlagBookings.ts`).
   - 25: `contractHistoryFor` and `CONTRACT_HISTORY_ACTIONS` (`domain/billing/contractHistory.ts`), `lockedAgainstContract` (`store/locks.ts`),
     `ProcedureSnapshot` and `crossMatchFor`'s caller (`lock.ts` about 103, 390, 444), `__parity__/phase-25-invoices.json` (12 `hospitalRef`
     lines; never `-u`).
   - 22a: `PAYER_OFFER_PROVISIONAL` (`domain/billing/procedurePayer.ts`), the `payer-offer-provisional` pill in `PaidBySheet.tsx`.
   - 24: the `demo-backdated-range` trigger (`shared/demoTriggers/registry.ts` about 1180) and `addBackdatedRangeDemo`.
   - U6, U3, U4: `Card`, `DefRow`, `Notice` (neutral and warning tones), `ResultLine`, `SelectField`, `TableShell`.
   - 27 and 27a: anything they changed in `PaidBySheet`, the snapshot or `phase-25-invoices.json` (re-read the fixture's line count).
5. Re-run `grep -rn "billingReference\|hospitalRef" aa-prototype/src aa-prototype/visual` and list every hit (16 non-test files at plan
   time, 10 seed files among them, plus tests and `admin-phase06.spec.ts`). Confirm no seeded reference is drawn from the seeded RNG
   (`seed/bookings.ts` about 1204 builds it from a counter), so removing them shifts no id. Record `PERSIST_VERSION` (50 at plan time).

**Reads beyond the skill's standard list.**
- **Design:** `Admin Review.dc.html` (the review flag row, the Flags tile; the Contract panel's tables and notices follow its table
  anatomy); `Admin Day.dc.html` (the Booking's office billing setup and the add form); `Mobile App.dc.html` and `Web Dashboard.dc.html`
  only to confirm the Paid by sheet without its pill.
- **ROADMAP.md:** owner decisions D79, D81, D82, D85, D88 (rows above in the Goal), D29 and D36 (answered; 25a clears the caveats
  17 and 19b left on screen); the Contracts track ("after 27a; before 39, 39b, 43 and 43a"); "One component per job".
- **GAP-ANALYSIS.md:** the EP-04 table rows US-04.1.2 and US-04.2.15; the EP-07 row US-07.2.2; Structural changes rows DM-68, DM-69.
- **Catalogue:** US-04.1.2 (body, ACs "Disable", "Dated change warning", "Warned on disable", Technical discussion), US-04.2.15 (ACs
  "Authorised kept, warned", "No list of re-priced"), US-07.2.2 (the review-flags bullet, AC "Disabled Contract"), OQ-133, OQ-135, OQ-136,
  OQ-142 (the answers and options); `domain-model.md` section 2 "Contract" (the status, invoiceLayout and "references the holder needs"
  rows) and "Booking" (insurer and approval number only); AR-58 A14 (a Procedure keeps a Disabled Contract) and sections 2.4 and 5.6
  (price ranges).
- **PROGRESS.md Decisions log:** entries this phase supersedes: 2026-11-10 Phase 18 (b) ("bills as normal" on a Disabled Contract),
  2026-11-17 Phase 21a (5) (D81, no flag), 2026-11-17 Phase 22a (1) ("provisional on OQ-140"), 2026-11-17 Phase 25 (3) ("OQ-140 open");
  honours 2026-11-11 Phase 19a (1) (ranges are the only dated thing on a Contract) and 2026-11-17 Phase 25 (1) and (6) (the lock and the
  invoice recipe). Catch-up entries 21a (the flag rules), 24 (the backdated-range beat and its seed in `seed/pricingBookings.ts`) and 25
  (Built, Tests, Handoffs and For the owner's review: the History tab is not OQ-133's list).

## Reference

**Code entry points (plan time).** Contracts: `store/contractActions.ts` (`createContract` 150, `save` 204, `disableContract` 293,
`addPriceRange` 366, `editPriceRange` 375), `domain/billing/priceRanges.ts` (`rangeInForce`, `rangeEnd`), `apps/admin/flows/ContractEditSheet.tsx`
(`toggleStatus` 201, the Disabled note 264, the system notice 258), `ContractPriceRanges.tsx`, `ContractHistory.tsx`. Review:
`domain/billing/reviewFlags.ts`, `store/reviewSelectors.ts`, `apps/admin/screens/ReviewScreen.tsx` (the `useMemo` at 105). Reference:
`domain/types.ts` 1010 (`billingReference`), 1376 (`InvoiceCrossMatch.hospitalRef`), 859 (the D82 comment);
`domain/billing/validateBookingForBilling.ts` 65; `invoicePresentation.ts` 265 (`crossMatchFor`); `lock.ts`; `shared/booking/OfficeBillingSetup.tsx`
62; `shared/flows/EditBillingSetupSheet.tsx`, `ManualBookingForm.tsx` (field 332, hint 323); `apps/admin/flows/PhoneAdviceBooking.tsx` 26;
`store/bookingActions.ts` 79, 199; `apps/admin/screens/InvoiceDocument.tsx` 259; `shared/audit/fieldLabels.ts` 56; seed `audit.ts`,
`bookings.ts`, `history.ts`, `bookingMoves.ts`, `pricingBookings.ts`, `reviewFlagBookings.ts`, `sourceWordingBookings.ts`. Caveats:
`domain/pairingPreferences.ts` 14, 78; `apps/admin/screens/AnaesthetistRecord.tsx` 59; `apps/admin/screens/masters/ModifiersView.tsx` 25, 49;
`domain/billing/modifiers.ts` 86, 103; payer comments in `types.ts` 966, `whoIsBilled.ts` 9, `procedurePayer.ts` 11 to 19, `store/payerActions.ts`
152, `seed/procedurePayerBookings.ts`, `seed/index.ts` 1226.

**Seed facts.** Merivale's Face lift (`CT-MER-FACELIFT`, MER-001, one range $3,100 from 1 Jun 2026). Un-authorised Face lifts on Dr Souter's
Mon 10 Aug PM List (`L-34821-2026-08-10-PM`): Sophie Matthews (BK0163), Paula Westerman (BK0187, typed $2,950.00) and 21a's
`movableFixedBooking`. Judith Calloway's Face lift on the AUTHORISED, invoiced Thu 16 Jul PM List at $3,100.00.

## Work items

**Session 1: the warnings and the flag.** Pure helpers and tests first.

1. **The disable day** (`contractHistory.ts`): `contractDisabledOn(audit, contractId): IsoDate | null`, the day of the latest
   `contract.disable` entry with no later `contract.enable` (null when Active), and `disabledDaysByContract(audit)` for many at once. Tests:
   disabled, re-enabled, disabled again (the latest day), a never-disabled Contract.
2. **Two pure selectors** (new `domain/billing/contractChanges.ts`, Vitest; store wrappers beside `lockedAgainstContract`):
   - `proceduresStillOnContract({ procedures, bookings, lists, patients }, contractId, fromISO)`: Procedures on the Contract, Booking not
     cancelled, List dated on or after `fromISO` and not AUTHORISED, sorted by date then time; each row the patient, date, List, procedure
     text and the Booking's route. Authorised ones are locked and cannot move, so they are not listed (a reading, logged).
   - `authorisedKeptPrice(locks, contractId, ranges, range)`: locked Procedures on the Contract (`billing.locks`, state `locked`) dated in
     the range's span (start to `rangeEnd`) whose locked price differs from the range's price and was not typed; rows with patient, date,
     locked price and the range's price. Tests: US-04.2.15's ACs (two kept, warned; no re-priced listed) and a typed price excluded.
3. **The review flag** (`reviewFlags.ts`). `ReviewBookingInput` gains `disabledOn: Record<ContractId, IsoDate>` (the Booking's Contracts
   only), filled in `reviewInputFor` from `disabledDaysByContract`. New rule `contractDisabled` after `contractNoLongerFits`: the
   Procedure's Contract is Disabled, its day is on or before the List date and the List is not AUTHORISED, so warn tone, "Contract disabled
   on Fri 10 Jul", shot `review-flag`. `contractNoLongerFits` keeps `anyStatus: true`, so an earlier-dated Procedure raises nothing.
   `authoriseBlockersFor` is untouched. Rewrite the header's D81 paragraph and `disableContract`'s comment. `ReviewScreen`'s `useMemo`
   must re-run when the audit changes. Tests: US-07.2.2's "Disabled Contract" AC (disabled 1 Dec: 3 Dec flagged, 28 Nov not, never blocks),
   re-enabled clears it.
4. **Dated change on create** (`ContractEditSheet.tsx`, create mode; US-04.1.2). An optional "Replaces" section: a `SelectField` of Active
   Contracts (the chosen holder's first) and a "From" date. Once both are set, a warning `Notice` (`contract-still-on-warning`, rows
   `contract-still-on-row` with an Open link to `/admin/day/<date>/bookings/<id>`) reads "{n} Procedures dated on or after {date} are still
   on {old Contract}. Nothing moves by itself: open each to move it." It shows before and after save. **Default: warning-only**: nothing
   stored on the Contract (the "No dates" AC), logged.
5. **Disable warning** (`toggleStatus`): after Disable, the same `Notice` lists Procedures from the disable day (the demo date) still on
   it. The Disabled note becomes "Disabled on {day}: hidden from the Contract list unless asked for. Procedures already on it keep it; one
   not yet authorised and dated on or after {day} is flagged at review." Migrate that note and the system notice (inline-styled divs) to
   `Notice` tone neutral.
6. **Kept-price warning** (`ContractPriceRanges.tsx`, add and edit): after the save, a warning `Notice` (`price-range-kept`, rows
   `price-range-kept-row`) "{n} authorised Procedures kept their old price", each with patient, date, locked and new price, Open link.
   None when zero. The `demo-backdated-range` trigger's result appends the count and names from the same selector, never hard-coded.
7. **Seeded case** (one `PERSIST_VERSION` bump; RNG-free, appended after every other seeded record so no id or figure moves): a dedicated
   Contract fitting 21a's review-flags List (so `contractNoLongerFits` stays quiet), Disabled, with a seeded `contract.disable` audit entry
   on Fri 10 Jul 2026 by Kirsty W.; one completed Booking on that SUBMITTED List on it. It shows on Review and on the Contract's History tab.
   No existing Contract used by S1 to S5 is disabled. `seed.test.ts`: the flag fires on exactly that Booking.
8. **Session 1 shots:** a new `visual/contract-warnings-phase25a.spec.ts` (dated change, disable warning, kept price, the flag).

**Session 2: the reference and the caveats.**

9. **Remove the hospital reference (DM-68).** Delete `Procedure.billingReference` and its doc comment, `CreateBookingInput.billingReference`
   (`bookingActions.ts`), the field and prefill in `ManualBookingForm`, `PhoneAdviceBooking`'s `STG-HALE-2107`, the field in
   `EditBillingSetupSheet`, the Reference row in `OfficeBillingSetup`, `billingReferenceMissing` and its tests, the `fieldLabels` entry,
   `ProcedureSnapshot.billingReference`, `crossMatchFor`'s third argument and `InvoiceCrossMatch.hospitalRef`, the "Hospital reference"
   item in `InvoiceDocument`, and every seed write (the seeded audit entries' `billingReference` too). Reword `types.ts` 859 (D82 answered).
   **The fixture:** delete only the 12 `hospitalRef` lines from `phase-25-invoices.json` by hand, never `-u`; its diff is deletions only.
   Tests: no Procedure, lock, invoice or audit entry in the seeded state carries `billingReference` or `hospitalRef`; `compareInvoice` still
   compares the cross-match; `Contract.holderReference` ("Your reference") untouched. `PERSIST_VERSION` bump.
10. **The payer settled (D85).** Remove `PAYER_OFFER_PROVISIONAL` and the `payer-offer-provisional` pill; reword the OQ-140 comments listed
    in Reference (D85, answered); the `ManualBookingForm` hint becomes "add one on the Procedure's Paid by line". Update the `PaidBySheet`
    catalogue rows if their text names the label.
11. **Tier and age-band caveats (D36, D29).** Remove `TIER_NAMES_PROVISIONAL` and its line on `AnaesthetistRecord`; remove the
    `masters-modifiers-provisional` row (badge and sentence) on `ModifiersView`; reword the "still open" and PROVISIONAL comments in
    `pairingPreferences.ts`, `types.ts` 420 and `modifiers.ts`. Update `mastersPages.test.tsx`, `visual/modifiers-phase19b.spec.ts`,
    `visual/admin-phase17.spec.ts`. Other provisional labels (OQ-29, OQ-122, OQ-132) stay; 17a's OQ-127 label is 17b's to remove (D74 answered).
12. **Specs:** `admin-phase06.spec.ts` without the billing reference; re-run every spec the form, setup or invoice changed.
13. **Build on the shared components; migrate these copies (UI unification).**
    - UI here is built from `Notice` and `ResultLine` (U3), `SelectField` (U4), `Card`, `DefRow` and `TableShell` (U6) for the warning
      lists and the office setup; no private notice, row or table.
    - Migrate on the screens this phase rebuilds: the Contract panel's two inline-styled notices (item 5); any hand-built row in
      `OfficeBillingSetup` touched by item 9.
    - Default props keep today's look; keep every `shot`, `data-shot`, `data-testid` and row `data-*` hook recipes and specs target (the two
      removed hooks excepted); update the `/demo/catalogue/*` rows in the same session.
    - If a component named here is missing, stop and say so; never build a private copy. See
      [`docs/ui-unification/README.md`](../../../ui-unification/README.md) section 8.

## Demo triggers

No new trigger. The warnings come from normal use: **Disable** on Merivale's Face lift (lists the un-authorised Mon 10 Aug Face lifts; Review
of `L-34821-2026-08-10-PM` then flags them), and a new Contract with **Replaces** Face lift from a date. The existing **Demo: add a backdated
price range** now also reports "1 Procedure kept its old price" (Judith Calloway, Thu 16 Jul). The Disabled flag is seeded on 21a's
SUBMITTED review-flags List. **Make active** undoes the disable. PWA: nothing here is on the phone.

## Out of scope

- Moving Procedures off an old Contract (the office opens each one); disabling the old Contract on a replacement's save; a stored dated
  change; any date field on a Contract.
- A block for a Disabled Contract; a list of re-priced Procedures; re-pricing an authorised Procedure (39's credit and rebill).
- The approval number or an ACC claim number on the holder's invoice (OQ-142 open); per-Contract references (D82: a setting later if a
  holder needs one); the matching row's insurer and approval number (33).
- Other provisional labels (OQ-29, OQ-122, OQ-132, OQ-127 and the rest): only the answered ones named here go.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence (ROADMAP.md "Owner review: agents test themselves").

- [ ] Contracts: Disable Merivale's Face lift: the warning lists the un-authorised Mon 10 Aug Face lifts, each with Open; none moved; the
      note reads "Disabled on Tue 21 Jul"; History shows the row. Review of `L-34821-2026-08-10-PM` flags each; Authorise is not blocked by
      it. Make active: the flags go.
- [ ] New Contract for Merivale with Replaces Face lift from 1 Aug: the warning lists the same Procedures; save; nothing moved.
- [ ] Demo: add a backdated price range: the result and the ranges section say 1 Procedure kept its old price (Judith Calloway, $3,100.00);
      Sophie Matthews re-prices to $3,300.00 and is not listed.
- [ ] Review of 21a's List: the seeded Booking reads "Contract disabled on Fri 10 Jul"; the others unchanged.
- [ ] No Billing reference field on Add Booking, phone advice or Edit billing setup; no Reference row; an S3 holder-layout invoice's
      cross-match shows procedure date and surgeon only; "Your reference" still prints.
- [ ] Paid by sheet (Grace Park, Admin, web and phone): the offer has no pill; Add Booking's no-address hint names the Paid by line.
- [ ] Dr Souter's record page: no "Tier names are provisional."; Modifiers master: no OQ-95 line.
- [ ] S3, S4 and S5 figures and 16's BCTI counts unchanged; `phase25Parity` green with the hand-edited fixture.
- [ ] No en or em dash in new copy; teal the only action colour.
- [ ] Catalogue screenshots as below; `npm run verify:board` green.

## Demo guide updates

Patch in session 2, and the matching sections of `master-demo-guide.html`:

- `03-demo-script.md`: S2 Beat 4 ("A Disabled Contract raises no flag" becomes the flag, with the seeded case); S3 Beat 1 (the cross-match
  strip without a hospital reference); S5 Beat 4 (an optional Disable on the Face lift with its list, and the backdated range's kept-price
  line); the S2 ambiguity paragraph (OQ-102 answered) and the closing list's "age bands are still to confirm (OQ-95)".
- `04-presenter-cheat-sheet.md`: the flags list (the Disabled Contract line), the Contracts block (the dated-change and disable warnings),
  the invoice layouts (no hospital reference), the payer block (no "Provisional, OQ-140"), the modifiers line (OQ-95 answered).
- `02-workflows-and-handoffs.md`: workflow 5's flag line; the cross-match wording.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after the review pass and before the
PROGRESS entry. This phase covers no stories, so `recipe-status.mjs 25a` lists none: the rows below are the built phases' recipes it changes.

| Item | Recipe now | When this phase is done |
|---|---|---|
| US-04.1.2 | partial · `contracts`, `edit-contract` ("A fixed price changes by a price range from Phase 19a.") | captured. Re-shoot both (the story says they show retired dates and delete). Add `dated-change` (create with Replaces and From set, `contract-still-on-warning` highlighted) and `disable-warning` (Face lift disabled, the list and the note). Captions: "A new Contract for a dated change lists the Procedures still on the old one", "Disabling lists the Procedures still on it; nothing moves". Drop the reason. |
| US-04.2.15 | partial · `price-ranges`, `repriced` (reason names 20 and 24, both built) | captured. Add `kept-price` after the backdated range (`price-range-kept` highlighted), caption "Authorised Procedures that kept their old price, counted and listed". Drop the reason. |
| US-07.2.2 | captured · `review-contracts`, `correct-contract[setup,edit]` | Stays captured. Add a `review-contracts` state on 21a's List with the Disabled flag highlighted ("A Procedure on a Contract disabled before its date is flagged, never blocked"). Re-shoot `correct-contract` with no Reference; the `edit` caption becomes "The Contract, chosen on the step rail". |
| US-08.4.1 | captured · `contract-holder-layout` | Stays captured; re-shoot: the cross-match without a hospital reference. |
| US-11.4.3 | captured (33 owns it) | Re-shoot the admin shots only if the office setup's Reference row showed; no recipe change. |
| US-11.2.2 | captured · `guardian-payer[...,offer]` | Re-shoot `offer` without the pill; caption "Naming another person offers the same payer to the other Procedure". |
| US-01.3.6 | captured · `tier-record` | Re-shoot without the caveat line; highlight `tier-card` unchanged. |
| US-05.1.5 | captured · `modifiers` | Drop `[data-shot=masters-modifiers-provisional]` from its highlight (the hook goes); re-shoot. |

**Recipes this phase breaks:** US-05.1.5 (removed hook); US-11.2.2 and US-07.2.2 captions; any recipe filling "Billing reference". The
`--dry` run is the check. **ATLAS.md:** hooks `contract-still-on-warning`, `contract-still-on-row`, `price-range-kept`,
`price-range-kept-row`; remove `payer-offer-provisional` and `masters-modifiers-provisional`; seed data: the seeded Disabled Contract and its
Booking; no billing reference.

## Adversarial review (after build)

The standard pass (PROGRESS convention 18). **Steer reviewers at:**

- **Nothing moves, nothing blocks.** No warning changes a Procedure; the flag never reaches `authoriseBlockersFor` or completion.
- **The disable day.** Read only from the audit (latest disable with no later enable); no date field on `Contract`; Review re-renders
  when the audit changes; the map is built once per Review, not per Procedure.
- **The lists.** Un-authorised, non-cancelled, on or after the date; kept price from locks only, typed prices excluded, re-priced never
  listed; both selectors pure and tested; the trigger's text derived.
- **The reference is gone, completely.** No `billingReference`, `hospitalRef`, "Billing reference" or "Hospital reference" survives in
  code, seed, audit labels, specs or the guide; `holderReference` untouched; the fixture's diff is the 12 deletions only; no figure moved.
- **Only the answered caveats went.** OQ-140, OQ-95 and OQ-102 labels and "still open" comments gone; every other provisional label kept.
- **Private copies.** A new private notice, row or table, or a copy this phase was to migrate and left, is a finding.

## PROGRESS.md updates

- **For the owner's review:** "Replaces" warning-only (not stored); authorised Procedures left off the dated-change list; the disable
  warning from the disable day; the flag's wording; the seeded Disabled Contract and its List; OQ-142's default (the cross-match prints the
  procedure date and surgeon only); screens with routes (Contracts, Face lift Disable; Review of 21a's List and of Dr Souter's Mon 10 Aug PM).
- Status row and phase entry: drift check, what was built per session, the review pass, tests, `PERSIST_VERSION` bumps, catalogue
  screenshots (recipes changed, REPORT counts before and after).
- **Decisions log:** (1) D79 built: two warnings, nothing moves (supersedes 18's and 19a's "no list"). (2) D81 built: the Disabled
  Contract flag from the audit's disable day (supersedes 21a (5) and 18 (b)'s "bills as normal" without a flag). (3) D82: the hospital
  reference removed; the cross-match is date and surgeon (OQ-142 open). (4) D85, D36 and D29 answered: their caveats removed (supersedes
  22a (1)'s and 25 (3)'s provisional wording).
- **Handoffs:** 33 imports no hospital reference; 39's rebill copies lines only; 42's loader and 43's generator write no reference; 44's
  sweep only verifies these caveats.
