# Phase 64 · The Ledger tab

**Requirements covered:**
[US-13.2.1](../../../requirements-board/requirements/stories/US-13.2.1.md) Ledger balance views (status 3 Verify, graded **Contradicts**, size L). This phase builds its tab half: **Square or not**, **Four figures**, **Who owes whom** (the row columns), **Holding account entries** and **Receipt to place**. Its **Anaesthetist account page** criterion and the story's unit are 65's (D114): this phase has no unit.
No DM or RV row is closed here. No seed change, no `PERSIST_VERSION` bump.
**Answered, built as answered** (owner, 26 November, for the build, not yet seen by AA): D107 (the section's shape), D110 (today's panels move first), D114 (the story's split), D115 (built from the shared kit).
**Open, built to its default:** [OQ-149](../../../requirements-board/requirements/questions/OQ-149.md) (D106: as built, in the system only, a held receipt counts in the number and the badge) and [OQ-125](../../../requirements-board/requirements/questions/OQ-125.md) (the Holding account's release trigger: its provisional pill stays).

**Depends on:** 58 on `master` (the Finances section, `LedgerTab.tsx` and its route, the AA Holding account moved onto the Ledger tab, the account route, `financePaths.ts`, `financeCounts.ts`, the re-homed "Inject unmatched receipt" trigger).
**Estimated:** 1 session. No checkpoint.

**Runs in:** Lane C of the build lanes, Wave 5, first in Lane C's queue (then 65, then 66), built in the `AnaesthesiaAssociatesRFP-laneC` worktree on `lane/c`, committed with a `64 complete:` commit and joined with the rest of Wave 5 at the final join. [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session.

## Goal

The Ledger tab says in one sentence whether the books are square, shows four figures, and lists the anaesthetists, the invoice pairs or the AA Holding account (the mock's `#p-ledger`, with `#kit`).

- **The sentence:** one `Notice` in a rail `Card` ("The books"), plain when square, warning or error when not, naming what is wrong. It reads the Day view's reconciliation checks, never a second rule.
- **Four figures,** `StatTile`s two by two in that card, replacing the headline, equation and ten tiles.
- **The list:** a `SlidingSegmentedControl` (Anaesthetists, Invoice pairs, AA Holding account). Every anaesthetist is a row with billed, paid into AA, disbursed, AA owes them and they owe AA, opening their account page (65 rebuilds it).
- **Receipts to place** in the rail, each with Allocate and Mark refunded.
- **Off the tab:** the Whole ledger / One anaesthetist switch and the picker. **BACKLOG:** the slow open and the 1440 overflow.

## Before you start

1. **Drift check** against the plan baseline `f885f67`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-13.2.1,OQ-149,OQ-125
   ```

   Re-read anything changed after `f885f67`. If US-13.2.1 is Retired or Future, or its Square or not, Four figures, Who owes whom, Holding account entries or Receipt to place criteria change, stop and tell the user. An answer to OQ-149 that moves where a receipt is placed (pushed to Xero, or only in Xero) is a stop too. An answer to OQ-125 changes only the pill: log it.
2. **Confirm** 58 DONE on `master` (LANES.md's sync step; stop as blocked if it is not). Read its PROGRESS entry and `notes.md` and note: the real file names under `screens/finances/` (`LedgerTab.tsx`, the tab frame, `financePaths.ts` and the function that links to an anaesthetist's account page and to the Ledger with a `?pair=`), the Ledger route and the account route, what `LedgerTab.tsx` hosts at 58's end (today's `LedgerScreen` whole branch and where `HoldingAccountPanel` sits), `financeCounts.ts`'s Ledger count and what it reads, the re-homed trigger's routes, and the specs 58 re-pointed (`admin-ledger.spec.ts`). Also read **59's** entry only for names this phase may reuse (it holds no Ledger code).
3. **Built as answered, no label:** the tab's shape (D107), the moved panels (D110), the split (D114), the shared kit (D115). The sentence and the four figures carry no on-screen caption: US-13.2.1 has no open reading.
4. **Open, built to default** (each a line on the owner's review list; only OQ-125 keeps an on-screen mark):
   - **Receipts to place** (OQ-149, D106): Allocate and Mark refunded as today (the existing `AllocateDialog` and `RefundDialog`, store actions unchanged), in the system only, nothing pushed to Xero. A held receipt is one of the failed checks, so it is in the sentence, the badge and the figure. Today's received, allocated and refunded history rows leave the rail (a receipt that is placed is gone from the count); log it.
   - **Provisional pill** (OQ-125): the Holding list keeps `HoldingAccountPanel`'s warning `Pill` "to confirm with AA (OQ-125)" exactly.
   - **The sentence reads `reconciliationStatusOf`** (the Day view's status, so the Ledger, the Day view and the badge agree): square only when that status is square. It names the ledger check's difference and the items by what they are (receipts that match no invoice, pairs not yet in Xero, changes made in Xero, bank lines) with counts, plus "every account is square" or how many are not (`anaesthetistsOutOfBalanceOf`). No new check.
   - **The four figures:** owed to AA = `receivablesOutstanding`; owed to the anaesthetists = `payablesDue` (due now, not awaiting collection; the story's wording); the AA Holding account = `holdingBalance`; receipts to place = the sum and count of `status === 'held'` unmatched receipts, `tone="warning"` when above zero. Names as the story, never today's "Receipts held" (a different figure: what AA holds for anaesthetists). No two tiles show the same figure.
   - **The row columns** (new pure reads, below): billed = what the payables on the anaesthetist's procedure pairs and transfers in add up to; paid into AA = `collected`; disbursed = `paidOut`; AA owes them = `owedToThem` (due now plus awaiting collection, as today's account view's total); they owe AA = `theyOweAa`. Plus a Balance `Pill` (Square, or Out by $X). Mock's "Last run" column is left out (not asked for by the story); log it.
   - **List state in the URL** (replace): `list` (`anaesthetists` default, `pairs`, `holding`), `q`, `balance` (`all` default, `out`), `pairs` filter Open or All, `page`. `?pair=<id>` (links from an invoice) opens the Invoice pairs list on All, on the page holding it, tinted as today.
   - **Toolbar:** the segmented control (`sm`); on Anaesthetists a `NameSearchBox` pill and `FilterPills` All / Out of balance; on Invoice pairs the existing Open / All pills; on Holding the control only; the end summary ("84 anaesthetists, every one square"). Page size 50 through the admin `Pager` (`FULL_SCALE.pageSizes.ledger`).
   - **Sort:** anaesthetists by surname (`surnameOf`); under Out of balance, largest imbalance first as today.
5. **Reads beyond the run-build-phase standard list:**
   - **Design:** [finances-section.html](../../explorations/finances-section.html) `#p-ledger` (the toolbar, the table columns, the rail's two cards, the annotation under it), `#kit` (the `StatTile` and `SlidingSegmentedControl` rows, "StatTiles in a right column, two by two"), `#moves` (what 58 moved to the Ledger tab, and what stays), `#decide` (the Ledger item only). Not `#records` (the account page is 65's).
   - **ROADMAP.md:** D106 (receipts to place), D107, D110, D112 (waves, lanes, subagents, files kept to the lane), D113 (test once), D114 (65 finishes US-13.2.1), D115 (shared kit; the two-by-two is only a grid change); the sequencing rules "Lane C: 64, then 65, then 66" and "No Wave 5 phase edits the shell files".
   - **GAP-ANALYSIS.md:** the EP-13 note and its US-13.2.1 row with its `gaps.json` entry (the evidence lines: `LedgerScreen.tsx`).
   - **Catalogue:** US-13.2.1 in full (criteria and Notes of 26 November), OQ-149, OQ-125 (the pill only); [the 26 November note](../../../requirements-board/requirements/notes/2026-11-26-donald-finances-section.md) #5, #10 and #15. [US-13.2.4](../../../requirements-board/requirements/stories/US-13.2.4.md) only to see which checks its status runs (parked: the Day view's card stays as built).
   - **DECISIONS.md:** honour "Controls stay buttons; only page switches are links" (the segmented control and filters are controls; a row opens through `ClickableRow`). Read the Ledger-related rulings (grep "ledger", "unmatched", "Holding") and keep them; supersedes none; add none unless a built default needs one.
   - **BACKLOG.md:** closes "Ledger takes 3 to 4 s to open..." and "Ledger table overflows at 1440 wide..." once measured and fixed; leaves the $11,350.50 clause (one anaesthetist's page) to 65 and the "Pre-payment / Prepayment" line to the sweep (add no new "Pre-payment" copy).
   - **PROGRESS.md:** 58's entry (above); 47's catalogue toolbar and 53's `RailSection`, `RailRow` and `Pager` footer for the patterns this tab follows.
   - **Subagents (D112), reads:** one for `LedgerScreen.tsx` (each section, every `data-shot`, `data-*` and dialog hook), one for `domain/billing/ledger.ts` with the two selector files (positions, checks, cost per anaesthetist), one for the tests, specs and registry trigger touching the Ledger. Each returns names and hooks, not code.

## Reference

- **Tab and frame (58's):** `screens/finances/LedgerTab.tsx`, `financePaths.ts`, `financeCounts.ts`; `components/AdminPage.tsx` (`AdminPage`, `PageToolbar`, `PageBody` rail).
- **Today's screen:** `screens/LedgerScreen.tsx` (the whole branch: `BalanceIndicator`, ten tiles, the out-of-balance table, the receipts table, the pairs table and its `Open | All` filter, `AllocateDialog`, `RefundDialog`; the one-anaesthetist branch and `CreditTrails`, kept for 65), `components/HoldingAccountPanel.tsx` (`useHoldingAccount`, the pill), `components/ReconciliationCard.tsx` (the Day view's card and `useReconciliationStatus`; the Ledger uses the hook and `ReconciliationDetail`'s wording, the card stays as it is), `components/LedgerPaymentRuns.tsx` (65's), `components/Pager.tsx`.
- **Domain and store:** `domain/billing/ledger.ts` (`ledgerPosition`, `anaesthetistPosition`, `anaesthetistsOutOfBalance`, `ledgerChecks`, `LedgerCheck`), `domain/billing/reconciliation.ts` (`ReconciliationStatus`), `store/ledgerSelectors.ts` (`ledgerPositionOf`, `anaesthetistLedgerPosition`, `anaesthetistsOutOfBalanceOf`, `unmatchedReceiptRows`, `heldUnmatchedReceipts`, `ledgerRows`), `store/reconciliationSelectors.ts` (`reconciliationStatusOf`, `RECONCILIATION_CHECKS`), `store/ledgerActions.ts` (the allocate and refund actions), `store/ledgerDemo.ts` (`injectUnmatchedReceipt`).
- **Shared UI:** `src/shared/ui/` (`Card`, `Notice`, `StatTile`, `SlidingSegmentedControl`, `NameSearchBox`, `FilterPills`, `RailSection`, `RailRow`, `Pill`, `TextAction`, `EmptyState`), `src/shared/table/` (`TableShell`, `Th`, `Td`, `ClickableRow`), `shared/format.ts` (`formatCurrency`, `surnameOf`, `drSurname`, `plural`), `shared/scale/useScreenTiming.ts`.
- **Tests and specs:** `LedgerCredit.test.tsx`, `HoldingAccountPanel.test.tsx`, `ReconciliationCard.test.tsx`, `domain/billing/ledger.test.ts`, `store/ledger.test.ts`, `store/ledgerParity.test.ts`; Playwright `visual/admin-ledger.spec.ts`, `admin-phase39*.spec.ts`, `admin-layout.spec.ts`.

## Work items

Split across parallel subagents (D112) with the session keeping decisions and joins: pieces A, B and C are independent (each told its own files); the session writes `LedgerTab.tsx` and joins them.

1. **Piece A: the pure reads** (new `domain/billing/ledgerLists.ts` with `ledgerLists.test.ts`; selectors in new `store/ledgerListSelectors.ts`, each with its one-line export in `domain/billing/index.ts` and `store/index.ts`).
   - `anaesthetistLedgerRows(pairs, transfers, unmatched, anaesthetistIds)`: **one pass** over the pairs and transfers (never `anaesthetistPosition` per anaesthetist: that is O(anaesthetists x pairs), the BACKLOG's slow open at about 85 anaesthetists and thousands of pairs), returning per anaesthetist `billed`, `paidIntoAa`, `disbursed`, `aaOwesThem`, `theyOweAa`, `inBalance`, `imbalance` and `checks`. Cents sums as `ledger.ts` does.
   - `receiptsToPlace(unmatched)`: held receipts, total and count.
   - `ledgerSentence(status, positionFigures)`: the Notice's tone, title and detail, from the Day view's `ReconciliationStatus` and the ledger figures; no rule of its own.
   - Tests: **parity** with `anaesthetistPosition` for every anaesthetist at the seed and at practice scale (`freshAppState()` is the core seed under Vitest; build the practice dataset as `everydayPractice.test.ts` does for the scale case), so each row equals the account page's figures; billed on a credited pair and a transferred prepayment; the sentence square, with a held receipt, with a Xero item only, with an anaesthetist out of balance; receipts to place after Allocate and after Mark refunded.
2. **Piece B: the rail** (new `screens/finances/LedgerRail.tsx` and `LedgerReceiptDialogs.tsx`, which holds `AllocateDialog` and `RefundDialog` moved out of `LedgerScreen.tsx` unchanged). One `Card` "The books": the `Notice` (`shot="ledger-balance"`, `data-in-balance`, one `li[data-check]` per failed check behind a "See the checks" `TextAction`, so the hooks survive) and four `StatTile variant="outlined"` in a two-column grid (`data-shot="ledger-tiles"`); then a `RailSection` "Receipts to place", a row per held receipt (reference, amount, received date, named anaesthetist) with Allocate (`ledger-allocate`) and Mark refunded (`ledger-refund`) as `TextAction`s, `data-unmatched-id` kept, the empty line "Nothing to place". The largest figure ($662,062.67) fits the rail at 1280.
3. **Piece C: the three lists** (new `screens/finances/LedgerLists.tsx`, or one file per list if the session prefers; and `HoldingAccountPanel.tsx`).
   - Anaesthetists: `TableShell` fit with `Th`, `Td`, `ClickableRow` (`data-anaesthetist-id`), columns Anaesthetist (`Avatar`, name), Billed for them, Paid into AA, Disbursed, AA owes them, They owe AA, Balance; money in `Td mono align="right"` through `formatCurrency`; the row opens through 58's `financePaths.ts` account link. `Pager` footer. `EmptyState` for none.
   - Invoice pairs: today's pairs table moved as is (`ledger-pairs`, `data-pair-id`, `data-pair-kind`, Xero cell, `ledger-footnotes`, tint on `?pair=`), Open or All, paged at 50, in the fit card; the table scrolls inside its card and nothing overflows at 1440 (the BACKLOG overflow: fix columns and `minWidth`, never a page scroll).
   - AA Holding account: the panel's entries in the fit card with its balance, the "Held for N prepaid Bookings" line and the provisional pill; hooks `billing-prepay-holding`, `holding-entry`, `data-entry-kind`, `data-booking-id` and `data-holding-balance` stay. `HoldingAccountPanel.test.tsx` stays green. The panel gets a prop (a `bare` rendering without its own `Card`) rather than a copy.
4. **`LedgerTab.tsx` and `LedgerScreen.tsx`** (the session). `LedgerTab.tsx` renders `PageToolbar` (the control, the search and pills, the end summary), `PageBody` main and rail: the chosen list and Piece B's rail. State in the URL as Before you start 4. Computation is lazy by list (the pairs rows only when that list is chosen) and memoised once per `billing` change; `useScreenTiming('ledger', ...)` stays on the tab. `LedgerScreen.tsx` keeps only the one-anaesthetist branch for the account route (its toolbar's switch and picker replaced by a back link to the Ledger through `financePaths.ts`; everything else as today, for 65), loses the whole branch, the dead tiles and the dialogs it moved. The account page's `data-shot-scope="anaesthetist"` hooks stay.
5. **Measure and fix** (the session, after the join). On the lane's dev server at practice scale, read the Timings row and time the open and a page change of the Anaesthetists and Pairs lists; a page change should be a re-render of 50 rows. If still slow, profile (likely costs: `ledgerRows` joining every pair with the schedule and Xero, `paymentWeeksForPair` per row, rows built before the list is chosen) and fix, or add a BACKLOG line with the measure. Delete the two closed BACKLOG lines. Check 1280 and 1440: no horizontal page scroll, the four tiles whole.
6. **Tests and specs.** `LedgerCredit.test.tsx` and `HoldingAccountPanel.test.tsx` follow the moves (paths, the list control); a `LedgerTab.test.tsx`: the sentence square and with an injected receipt (through `injectUnmatchedReceipt`), the four tiles' figures and that receipts to place is the held count, the list control switching all three lists, a row opening the account route, Allocate and Mark refunded removing the receipt from the count and flipping the sentence to square, `?pair=` landing on Invoice pairs, All. `admin-ledger.spec.ts`: change only its own steps (the sentence, the tiles, the rail's Allocate), not another lane's. Playwright is not run (D113).
7. **Finish.** Catalogue: the `/demo/catalogue/admin` rows already exist for every shared part this tab uses; add none (no new shared component or variant, D115); if `HoldingAccountPanel` or the Ledger rail has a row there, update it. No new en or em dashes, "slot", "swap", "timesheet" or phase numbers in copy; teal the only action colour; tokens only.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `inject-unmatched-receipt` (existing, re-homed by 58) | Inject unmatched receipt | Admin, Finances, Ledger (and the Admin Day dashboard) | bar | adds a receipt that matches no invoice (choice: names Dr Souter, or names no one): the sentence turns to not square, receipts to place and the Ledger's count go up, her row shows out of balance; Allocate or Mark refunded brings it back | as `injectUnmatchedRefusal` sets it |
| (product) | Allocate, Mark refunded; the list control, search and filters | Ledger tab | none | normal use | |
| PWA | none (Admin only) | | | | |

No new trigger, no registry change: if the re-homed trigger's routes or copy need a change, note it under "For the merge".

## Out of scope

- The anaesthetist's account page (65: US-13.2.1's unit, its criterion, the page on the record pattern, the credit trails and payment runs, the $11,350.50 tile spill); the whole/one view stays in `LedgerScreen.tsx` for the account route only until 65.
- The Day view's `ReconciliationCard` and US-13.2.4 (parked): not edited.
- Pushing a placed receipt to Xero, or bulk remittance (OQ-149 stays at its default; US-10.2.4 untouched).
- Routes, `financePaths.ts`, `financeCounts.ts`, `router.tsx`, `SideNav.tsx`, `AdminApp.tsx`, `routes.tsx`, the redirects and `registry.ts` (58's; note needs under "For the merge"). New shared components or variants (D115). A seed change or a `PERSIST_VERSION` bump.
- Capture recipes, ATLAS and the demo guide (the owner's sweep); the adversarial review, the screen-proof and the full gate (Wave 5's join, D113).

## Manual test checklist

The material Wave 5's join walks for the owner's test sheet `docs/build-plan/TEST-58-67.md`. Not run by this phase (D113).

- [ ] Ledger from a reset: one plain sentence says the books are square; four tiles two by two (receipts to place $0.00); no headline, equation, ten tiles, Whole / One switch or anaesthetist picker.
- [ ] Inject unmatched receipt (names Dr Souter): the sentence says not square and names the receipt; receipts to place $120.00, 1; the receipt is in the rail; the Finances badge rises; Dr Souter's row shows out of balance.
- [ ] Allocate, and on a second injection Mark refunded: the receipt leaves the rail, the figure and count fall, the sentence returns to square. The Day view's Reconciliation card agrees in both states and is unchanged.
- [ ] Anaesthetists list: every anaesthetist, surname order, the five money columns matching their account page; search; All and Out of balance; paged at 50; a row opens the account page.
- [ ] Invoice pairs: Open and All, a row opens its invoice, `?pair=` from an invoice lands tinted on All; no horizontal page scroll at 1280 or 1440.
- [ ] AA Holding account: every entry (Credited and Refunded rows too), the balance, the provisional pill.
- [ ] The tab opens in about a second at practice scale; a list or page change is quick; the largest tile figure fits at 1280.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS. Keep `demoGuideSync.test.ts` green. **For the sweep**, list in the progress entry: the US-13.2.1 recipes (its four screenshots: whole ledger, anaesthetist scope, imbalance, out-of-balance list) and the other Ledger recipes (six in all), the ATLAS `/admin/ledger` row (the sentence, `ledger-tiles`, the list control, the Anaesthetists list, `ledger-unmatched` now in the rail, the removed Scope control and headline) and the trigger row, and the guide's Ledger lines (`docs/demo-guide/03-demo-script.md`'s Ledger rows and Beat 7 "Admin Ledger", the cheat sheet's "The ledger balances").

## Review steer for Wave 5's join

Not run by this phase (D113); for the one review of 58 to 67:

- **One rule for square:** the sentence, the Day view's card and the badge read the same status; `ledgerSentence` adds no check.
- **The new reads:** `anaesthetistLedgerRows` is one pass, pure, and equals `anaesthetistPosition` per anaesthetist; the open is fast at practice scale.
- **Lane C's files only:** no edit to the shell files, `financePaths.ts`, `financeCounts.ts` or `registry.ts`; the Day view's card untouched.
- **Shared once:** no private pill, card, cell or tile; `HoldingAccountPanel` one component with a prop; the `oneComponentPerJob.test.ts` allow-list did not grow.
- **Hooks and copy:** `ledger-*`, `holding-*`, `data-pair-id`, `data-unmatched-id`, `data-check` survive; no "Receipts held" for receipts to place, no new "Pre-payment", no dashes.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (receipts to place as D106, history rows gone from the rail; the pill; the sentence reading the Day view's status and how it names what is wrong; the four figures and their names; the row columns and their definitions, Last run left out; list state in the URL; the toolbar; page size 50; the sort).
- **For the sweep:** the recipes, ATLAS rows and guide lines listed under Demo guide updates.
- **For the merge:** any change needed in a file LANES.md gives to 58 (a `financePaths.ts` function, the Ledger count in `financeCounts.ts`, the trigger's routes), the new files this phase added outside `screens/finances/` (`domain/billing/ledgerLists.ts`, `store/ledgerListSelectors.ts`, `components/` edits) as Lane C additions with their barrel lines, and the measured open time before and after.
- Status row and phase entry: drift check against `f885f67`; D106 at its default and OQ-125's pill kept; the names 58 shipped that this phase used; the names it ships for 65 (`anaesthetistLedgerRows`, `receiptsToPlace`, `LedgerReceiptDialogs`, the rail's tiles, the Ledger back link on the account route); tests added; `PERSIST_VERSION` unchanged. Handoff: 65 rebuilds the account page on the record pattern and reuses these reads for its own figures.
- Decisions log: none beyond the built defaults.
