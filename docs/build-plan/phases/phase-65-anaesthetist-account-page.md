# Phase 65 · The anaesthetist's account page

**Requirements covered:**
[US-13.2.1](../../../requirements-board/requirements/stories/US-13.2.1.md) Ledger balance views (status 3 Verify, graded **Contradicts**, size L). Built across 64 and 65 (D114): 64 builds the sentence, the four figures, the three-way list, the Holding account entries and receipts to place; this phase builds the anaesthetist's account page and **finishes the story, so its unit is on 65**. Reads [US-08.3.5](../../../requirements-board/requirements/stories/US-08.3.5.md) (the anaesthetist's own ledger position) and [US-13.3.3](../../../requirements-board/requirements/stories/US-13.3.3.md) ("Records on their own pages").
No DM or RV row is closed here. No seed change, no `PERSIST_VERSION` bump.
**Answered, built as answered** (owner, 26 November, for the build, not yet seen by AA or Greg): D107 (the Finances section and its record routes), D110 (today's panels move first), D112 to D115 (lanes and waves, test once, the story split, the shared kit).
**Open, built to its default:** [OQ-149](../../../requirements-board/requirements/questions/OQ-149.md) (where a receipt nobody can place is placed). It is 64's (D106); this page only links a held receipt to the Ledger tab, where Allocate and Mark refunded stay.

**Depends on:** 58 (the section, `financePaths.ts`, the account route in its own file) and 64 (the Ledger tab with the whole/one switch off it). Both DONE on their lane branches before this starts.
**Estimated:** 1 session.

**Runs in:** Lane C of the build lanes, Wave 5, second in Lane C's queue (after 64, before 66): built in the `AnaesthesiaAssociatesRFP-laneC` worktree (branch `lane/c`), committed with a `65 complete:` commit, and joined onto `master` with the rest of Wave 5 (58 to 67). [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session. The owner tests 65 with the rest from `TEST-58-67.md` after the join, never before.

## Goal

Each anaesthetist's money has its own page under Ledger, replacing the Whole ledger / One anaesthetist switch (D107, D114, D115). At `/admin/finances/ledger/anaesthetists/:anaesthetistId`, on the record pattern of the Contract and People pages:

- **Header:** a back link to the Ledger, the name with a Square or Out of balance `Pill`, a summary line (what AA owes them and in which week's run; what they owe AA and on which fee invoice) and **Open in People** (`anaesthetistRecordPath`). An anaesthetist out of balance gets a `Notice` naming the failed checks, with a link to the Ledger tab for a held receipt.
- **Main column:** the **AA owes them** and **They owe AA** cards (the next run, the fee invoice), then **their invoice pairs** (invoice pair, billed, paid in, disbursed with its week).
- **Rail:** **Payment runs** (a few, See all) and **Credit trails**, as `RailSection`s.
- An unknown id falls back to the Ledger tab. The People page keeps everything that is not money.
- At its close the phase walks all six of US-13.2.1's criteria across 64 and 65 (Manual test checklist).

## Before you start

1. **Drift check** against the plan baseline `f885f67`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-13.2.1,US-08.3.5,OQ-149
   ```

   Re-read anything changed after `f885f67`. If US-13.2.1 is Retired or Future, stop. If its anaesthetist account criterion (what the page shows, "leads back to the Ledger") or the whole/one switch ruling changes, stop and tell the user. An answer to OQ-149 is not a stop: it is 64's, so log it.
2. **Confirm** (stop if either is not DONE on its branch; read their PROGRESS entries and `notes.md`) and note:
   - **58:** the file contract as shipped: the file that renders the account route and its exported name (this phase builds in it; if 58 left it as `LedgerScreen`'s `anaesthetistId` branch, see Work item 1), `financePaths.ts`'s helpers for the Ledger tab, the account, a payment run, a remittance, an invoice, a credit note and the AA fees tab, the unknown-id fallback, and the screen names the Ledger triggers bind to.
   - **64:** what it left in `LedgerScreen.tsx` for the one-anaesthetist scope (`anaesthetistId`, `scope`, the `CreditTrails` export, the pairs table and `weeksOfRow`), the row link it gives each anaesthetist (must be 58's account path), and any list-row or pair-row piece it extracted that this page can reuse.
3. **Built as answered, no label:** the page on the record pattern, the switch gone, the back link and Open in People (D107, D114, D115).
4. **Open, built to default** (each a line on the owner's review list, none gets a caption):
   - **See all for payment runs:** `RailSection` shows three runs and, with no `allTo`, expands in place (54's optional `allTo`). If `financePaths.ts` already lets the Payments tab narrow to an anaesthetist, `allTo` points there; otherwise note the link the join must add.
   - **Credit trails in the rail** are one row per credit note (number, then "Negative invoice netted, Week 45" or what is still to net, from today's `nettingNote`), opening the credit note's page (63 shows its negative invoice and what replaced the original). The five-step trail table goes.
   - **Pairs columns** follow the mock: Invoice pair (receivable and payable numbers, the credited `Pill`), Billed, Paid in, Disbursed (with its payment week). Kind, Patient, Payer, Released and the Xero column leave this page (the Ledger tab's Invoice pairs list and the Xero tab hold them). Open and All `FilterPills` stay, `?pair=` still highlights, 50 a page.
   - **Remittance:** a payment run row opens the run's page, one click from the anaesthetist's remittance; the direct "Remittance advice: Open" column is dropped with the table.
   - **Still to net** (negative invoices to net, OQ-71's caption) stays as a `Notice` above the cards when non-zero.
5. **Reads beyond the run-build-phase standard list** (each is a parallel subagent, Work items' preamble):
   - **Design:** [finances-section.html](../../explorations/finances-section.html) `#records` (Anaesthetist's account: the arrangement, not the text), `#p-ledger` (the list row that opens it), `#kit` (the component for each part), `#url` and `#decide` (the route), `#moves` (what the one-anaesthetist view becomes).
   - **ROADMAP.md:** D106 (OQ-149, 64's), D107, D110, D112, D113, D114, D115; the sequencing rules "64 after 58, first in Lane C; 65 after 64" and "No Wave 5 phase edits the shell". `LedgerPaymentRuns.tsx` imports `PaymentCyclePanel`, which 66 changes next: use only its existing export `RUN_STATUS`.
   - **GAP-ANALYSIS.md:** the US-13.2.1 row and its `gaps.json` entry (the evidence lines on the scope switch, the one-anaesthetist tiles and `CreditTrails`).
   - **Catalogue:** US-13.2.1 in full (the six criteria; Notes of 26 November), US-08.3.5, US-13.3.3 (Records on their own pages), OQ-149; [the 26 November note](../../../requirements-board/requirements/notes/2026-11-26-donald-finances-section.md) #5, #10, #15.
   - **DECISIONS.md:** honour "Money prints one way" (`formatMoney`), "Real routing in all three apps", "Controls stay buttons; only page switches are links", and the `L-HIST` backdrop (Dr Souter's history: under All, never in the main figures).
   - **BACKLOG.md:** closes the clause "on one anaesthetist's Ledger at 1280, $11,350.50 spills out of its tile" (delete only that clause); the Ledger-table overflow line is 64's.
   - **PROGRESS.md:** 45 (`ProfilePage` header props), 47 (a table card with `FilterPills` and `Pager`), 53 (`RailSection`, `RailRow`), 54 (`AnaesthetistPage`, the nearest record page; `RailSection` `allTo` optional), 58 and 64 (above). 59 is not read: this page reads the ledger selectors, not its models.
   - **Code:** the Reference below, read by the subagents.

## Reference

- **Page:** 58's account file; `components/ProfileChrome.tsx` (`ProfilePage`, `PageBody` rail); `screens/AnaesthetistPage.tsx` (the pattern); `apps/admin/peoplePaths.ts`; `screens/finances/financePaths.ts`.
- **Money:** `store/ledgerSelectors.ts` (`anaesthetistLedgerPosition`, `ledgerRows`), `domain/billing/ledger.ts` (`AnaesthetistPosition`: `dueNow`, `awaitingCollection`, `owedToThem`, `theyOweAa`, `recoveryDue`, `inBalance`, `checks`), `store/remittanceSelectors.ts` (`runsForAnaesthetist`, `paymentWeeksForPair`), `store/selectors.ts` (`aaFeeInvoicesFor`), `store/paymentCycleActions.ts` (`openCycle`), `domain/billing/paymentCycle.ts` (`cycleLabel`, `plannedDayLabel`), `store/creditActions.ts` (`negativeInvoicesFor`), `shared/procedureEventCopy.ts` (`CREDIT_LABELS`).
- **Screens and UI:** `screens/LedgerScreen.tsx` (the one-anaesthetist branch), `components/LedgerPaymentRuns.tsx`, `components/Pager.tsx`, `src/shared/ui/` and `src/shared/table/` (their `README.md`s), `apps/demo/catalogue/admin/paymentRunExamples.tsx`.
- **Tests and triggers:** `LedgerCredit.test.tsx`, `store/creditReview39.test.ts`, `appCopy.test.ts`, `oneComponentPerJob.test.ts`; Playwright `visual/admin-ledger.spec.ts` (one-anaesthetist steps near lines 58 and 91), `visual/admin-phase39a.spec.ts` (near 114); the `inject-unmatched-receipt` trigger in `registry.ts` (read only).

## Work items

**Subagents (D112), the session keeping decisions and joins.** Read pass, in parallel: one on `LedgerScreen.tsx`'s one-anaesthetist branch with its tests and specs, one on 58's and 64's PROGRESS entries and `notes.md`, one on the mock's `#records` against `#kit`. Build pass, in parallel, each told its own files: (a) header, Notice and the two cards (the page file); (b) the invoice pairs card (new `screens/finances/AccountPairs.tsx`); (c) the rail (`components/LedgerPaymentRuns.tsx` and the credit trails section); (d) tests. The session joins them in the page file, removes the remnants and runs the quick checks.

1. **The page's home.** Build in the file 58's account route renders, keeping its exported name, so no route edit is needed. 58 ships `screens/finances/AnaesthetistAccountPage.tsx` as that route's target; rebuild the page there. Only if it is missing, create it and list the one-line element swap under For the merge (a fallback). The unknown-id fallback to the Ledger tab is 58's: confirm it with a test, or note it for the join.
2. **Header.** `ProfilePage` (fluid): `back` "Ledger" to the Ledger tab, `name`, the Square (success) or Out of balance (warning) `Pill` from `anaesthetistLedgerPosition(...).inBalance` in the chip slot, a `sub` line "AA owes $X in Week N's run · owes AA $Y in <month> fees" (the open cycle's week through `openCycle` and `cycleLabel`; a nil amount reads "AA owes nothing"), and `TextAction` **Open in People** to `anaesthetistRecordPath`. Out of balance adds a warning `Notice` naming the failed `checks`, with a "See the Ledger" `TextAction` when `unmatchedHeld > 0`. Hooks: `ledger-account`, `ledger-account-status`, `ledger-account-open-people`.
3. **The two cards.** AA owes them (`ledger-aa-owes`): `StatTile`s Due now, Awaiting collection, Total, with the next run's day (`plannedDayLabel`) and week, and Collected and Paid out as two quiet tiles; `StillToNetNotice` above the cards when non-zero. They owe AA (`ledger-owes-aa`): `theyOweAa`, the unpaid fee invoice's number from `aaFeeInvoicesFor` as a `TextAction` to the AA fees tab, "Nothing owing" when zero.
4. **Invoice pairs card.** `ledgerRows(state, { anaesthetistId, openOnly })` as today (credited pairs closed under Open): a `Card` with Open and All `FilterPills`, dense `TableShell` with the columns of Before you start 4, a totals row (transfers left out), `Pager` at `FULL_SCALE.pageSizes.ledger`. A row opens its invoice through `financePaths.ts` (today's `openRow`); `?pair=` highlights and lands on its page. Keep `ledger-pairs`, `data-pair-id`, `data-pair-kind`, `ledger-pair-credited`, `ledger-payment-week`, `ledger-pager`.
5. **Rail.** Two `RailSection`s in the `PageBody` rail. **Payment runs** (`LedgerPaymentRuns.tsx` rebuilt as this section, same export): `runsForAnaesthetist`, three `RailRow`s (Week N · net; sub: status and paid date) opening the run's page through `financePaths.ts`, a `CountBadge`, See all per Before you start 4, the empty line "Not paid in a payment run yet." **Credit trails:** one row per `negativeInvoicesFor` as Before you start 4, hidden when none. Keep `ledger-payment-runs`, `ledger-credit-trail`.
6. **Remove the switch's remnants** in `LedgerScreen.tsx` (64's file; same lane, serial): the `anaesthetistId` prop and `scope`, the one-anaesthetist tiles, `ledger-anaesthetist-select`, the `CreditTrails` export (its `nettingNote` moves to the rail); skip what 64 already removed. List the file under For the merge as one LANES.md does not name for 65. Re-point `LedgerCredit.test.tsx` and the two Playwright steps to 58's account path (only those steps).
7. **Shared first (D115).** `#kit` parts only; no new shared component or variant; no private `Card`, `Row`, `Pill` or `Section`; `oneComponentPerJob.test.ts`'s allow-list only shrinks. No en or em dashes, "slot" or phase numbers; tokens only; teal the only action colour. The mock's text is layout, not copy.
8. **Tests** (new `AnaesthetistAccountPage.test.tsx`): Souter's page shows both cards' figures, her pairs (billed, paid in, disbursed), runs, credit trails and the back link; the injected receipt flips the pill to Out of balance and the Notice names the check; See all expands; an unknown id lands on the Ledger tab; Open in People goes to her record; page and 64's list row show the same figures (one assertion on both). `creditReview39` and `LedgerCredit` pass, re-pointed.
9. **Finish.** Update the `paymentRunExamples.tsx` catalogue row for `LedgerPaymentRuns`; delete the closed BACKLOG clause; quick checks only.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `inject-unmatched-receipt` (existing, 58 re-homed it to the Ledger tab) | Inject unmatched receipt | Admin, Finances, Ledger tab | bar | names the anaesthetist; her account page then shows Out of balance | as today |
| (product) | The account page | opens from the Ledger's anaesthetists list | none | normal use | |
| PWA | none (Admin only) | | | | |

No new trigger.

## Out of scope

- The Ledger tab (sentence, four figures, the list, receipts to place: 64) and the Payments tab and run pages (66).
- The People anaesthetist's page (54): it keeps everything that is not money.
- Any route, link, trigger or count change in the shell files (58's, made by the join); the credit note page itself (63).
- Capture recipes, ATLAS and the demo guide (the owner's sweep); a seed change; the full gate, review, screen-proof and checklist run (D113).

## Manual test checklist

Material for Wave 5's join to walk for the owner's test sheet `TEST-58-67.md`; this phase does not run it (D113).

- [ ] Ledger tab, Anaesthetists list: Dr Souter's row opens her page at `/admin/finances/ledger/anaesthetists/<id>`; the back link returns to the Ledger tab; Open in People opens her record. (US-13.2.1 "Anaesthetist account page".)
- [ ] The summary line and the two cards agree with her list row: what AA owes her and in which week's run, what she owes AA and on which fee invoice. (US-13.2.1 "Who owes whom".)
- [ ] Her invoice pairs show billed, paid in and disbursed with the week; Open and All; a credited pair reads credited; opening a pair opens its invoice.
- [ ] Payment runs in the rail: three, See all shows the rest; a row opens the run's page, and from it her remittance.
- [ ] Credit trails: a credited invoice's note, with its netting week or what is still to net; it opens the credit note's page.
- [ ] Ledger tab, Demo actions, Inject unmatched receipt naming her: her list row and her page both read Out of balance and name what is wrong.
- [ ] An unknown id (`.../anaesthetists/nope`) lands on the Ledger tab; the old `/admin/ledger/anaesthetists/<id>` redirects here; no Whole ledger / One anaesthetist switch anywhere.
- [ ] The six criteria of US-13.2.1 across 64 and 65: square or not, four figures, the account page, who owes whom, Holding account entries, receipt to place.
- [ ] At 1280 and 1440 no sideways scroll and no figure spills out of its tile.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS. Keep `demoGuideSync.test.ts` green. **For the sweep**, list in the progress entry: the recipe for US-13.2.1's one-anaesthetist Ledger screenshot (it becomes the account page), US-08.3.5's recipe if it shows the one-anaesthetist view, ATLAS rows on `/admin/ledger/anaesthetists/:id` and the retired hooks (`ledger-anaesthetist-select`, `data-shot-scope="anaesthetist"`, `ledger-credit-tiles`, the old trail table's rows), and every guide line naming the "Whole ledger / One anaesthetist" switch or Souter's one-anaesthetist ledger (the S1 to S5 beats that open it).

## Review steer for Wave 5's join

The join runs one review of all ten phases; steer it at:

- **The switch is gone.** No `anaesthetistId` scope, select or top picker left in `LedgerScreen.tsx`; the old `/admin/ledger/anaesthetists/:id` redirects; an unknown id lands on the Ledger tab.
- **Same figures.** The page and 64's list row read one `anaesthetistLedgerPosition`; Souter out of balance after the injected receipt reads the same in both; `L-HIST` stays out of the main figures.
- **Links through `financePaths.ts`** only (the runs, invoices, credit notes, AA fees, the Ledger); Open in People through `anaesthetistRecordPath`; no hand-built `/admin/finances` or `/admin/people` string.
- **Shared, once.** No private card, row, pill or section; `RailSection` `allTo` is the only See all; `LedgerPaymentRuns` imports only `RUN_STATUS` from `PaymentCyclePanel` (66 rebuilds that file).
- **Hooks and copy.** Every kept `data-shot` survives; no en or em dashes, "slot" or phase numbers; money through `formatMoney`; crimson absent.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (See all expanding in place or its link; credit trails as one row per credit note; the pairs columns and what left; no direct remittance column; Still to net as a Notice).
- **For the sweep:** the recipes, ATLAS rows, hooks and guide lines listed under Demo guide updates.
- **For the merge:** fallback only, the route element swap if 58 did not ship `AnaesthetistAccountPage.tsx` as the route's target; the link a Payments-tab See all would need; `LedgerScreen.tsx` as a file LANES.md does not list for 65; anything wrong in `financeCounts.ts` for the Ledger count (note, do not edit).
- Status row and phase entry: drift check against `f885f67`; D107 and D114 to D115 built, OQ-149 at its default; the names 58 and 64 shipped that this phase used; the page's file and exports; tests added; `PERSIST_VERSION` unchanged; US-13.2.1's unit finished here. Quick checks only (D113).
