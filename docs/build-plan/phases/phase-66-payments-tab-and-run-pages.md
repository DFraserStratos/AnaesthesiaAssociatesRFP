# Phase 66 · The Payments tab and the payment run pages

**Requirements covered:**
[US-10.2.7](../../../requirements-board/requirements/stories/US-10.2.7.md) Weekly payment cycle (status 1 Proposed, graded **Partial**, size M), **built as written** (D114: its unit is on 66). Reads [US-10.2.6](../../../requirements-board/requirements/stories/US-10.2.6.md) (the remittance advice, whose page this phase re-homes) and [US-13.3.3](../../../requirements-board/requirements/stories/US-13.3.3.md) (the Payments tab, "Records on their own pages", old addresses still open).
No DM or RV row is closed here. No seed change, no `PERSIST_VERSION` bump.
**Answered, built as answered** (owner, 26 November, for the build, not yet seen by AA): D107 (the section and its record routes), D110 (today's panels move first, unchanged), D112 to D115 (lanes and waves, test once, the story split, the shared kit).
**Open, built as written:** [OQ-47](../../../requirements-board/requirements/questions/OQ-47.md) (does the accountant agree to the weekly cycle: the steps, days and Tuesday payment stay as today's) and [OQ-29](../../../requirements-board/requirements/questions/OQ-29.md) (GST treatment: "BCTI" stays in "Approve BCTIs" and the BCTIs column). Neither gets a caption; neither is touched.

**Depends on:** 58 (the section, `PaymentsTab.tsx` hosting today's cycle panel, runs table and events awaiting the run, `financePaths.ts`, the run and remittance routes in their own files, the re-homed triggers). Lane order: after 64 and 65 on `lane/c`, which share no file with it except that `LedgerPaymentRuns.tsx` (65's) imports `RUN_STATUS` from `PaymentCyclePanel.tsx`. All DONE on their lane branches before this starts.
**Estimated:** 1 session.

**Runs in:** Lane C of the build lanes, Wave 5, last in Lane C's queue (after 64 and 65): built in the `AnaesthesiaAssociatesRFP-laneC` worktree (branch `lane/c`), committed with a `66 complete:` commit, and joined onto `master` with the rest of Wave 5 (58 to 67). [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session. The owner tests 66 with the rest from `TEST-58-67.md` after the join, never before.

## Goal

The weekly payment cycle and every run have their home on the Payments tab, each run with its own page (D107, D114, D115). The mock's `#p-payments` and `#records` (Payment run), built from `#kit`.

- **Payments tab** (`/admin/finances/payments`): the cycle `Card` with its compact `StepRail`, Waiting for this week's run with Close the week and every later step as today, the waiting table and every earlier payment run as **paged** tables, and **Events awaiting the run** in the `PageBody` rail.
- **Run page** (`/admin/finances/payments/:runId`, `PaymentRunScreen.tsx`) on the record pattern: back link Payments, Week N with its ID chip and status, a summary line, **Download schedule**, the run's `StepRail`, and each anaesthetist's BCTIs, netted and paid with **Remittance** opening their advice on its own page (`.../remittance/:anaesthetistId`).
- **Run payables in Xero no longer freezes the page** (BACKLOG, 12 to 35 s at practice scale): measure, then fix if still slow, without changing what it pays.
- Every action keeps its store call; no step, day or "BCTI" wording changes.

## Before you start

0. **Test once, at the very end (D113):** finish on the quick checks only (`phase-check.mjs --changed`, `npm run lint` in `aa-prototype/`); no full gate, adversarial review, screen-proof or checklist run here. Subagents as the Work items preamble says (D112).
1. **Drift check** against the plan baseline `f885f67`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-10.2.7,US-10.2.6,US-13.3.3,OQ-47,OQ-29
   ```

   Re-read anything changed after `f885f67`. If US-10.2.7 is Retired or Future, or its **Run page** criterion or the "Payments tab" paragraph changes, stop and tell the user. An answer to OQ-47 (the cycle, the days, how the 20th-of-the-month payment fits) or OQ-29 (the "BCTI" name) is a stop too: it changes the steps or the wording this phase keeps.
2. **Confirm** (stop if any is not DONE on its branch; read their PROGRESS entries and `notes.md`) and note:
   - **58:** the file contract as shipped: what `PaymentsTab.tsx` hosts (today's `PaymentCyclePanel`, and where the events-awaiting-run panel went when `BillingMonitorScreen.tsx` was split: its file and exported name), that the Payments tab has no count (none, by the owner's rule), `financePaths.ts`'s helpers for the Payments tab, a run, a remittance, the Ledger tab and an invoice, the routes' element names for the run and remittance (still `PaymentRunScreen` and `RemittanceAdviceScreen`?), the old `/admin/billing/payment-runs/*` redirects, the triggers' new routes and screen name, and the specs 58 re-pointed (`admin-phase39a.spec.ts`).
   - **64 and 65:** only what touches this phase: 65's `LedgerPaymentRuns.tsx` imports `RUN_STATUS` and builds the run link through `financePaths.ts` (this phase keeps `RUN_STATUS`, `stampOf` and `PaymentCyclePanel`'s name and `actor` prop); the "See all" link a Payments tab narrowed to one anaesthetist would need (note it; do not build it).
3. **Built as written, no label:** the cycle's steps, days and wording (OQ-47, OQ-29), the tab and the run page on the record pattern (D107, D114), the shared kit (D115).
4. **Open, built to default** (each a line on the owner's review list, none gets a caption):
   - **Runs table columns** follow the mock: Run (the week, a link), Dates, Anaesthetists, BCTIs, Negatives netted, Paid out, Status (with today's Seeded and Staged `Pill`s), Paid on. Today's Run ID, Closed, Approved and Scheduled stamp columns leave the list (the run page's StepRail and Run card hold them); that closes the BACKLOG line "Payment runs list shows when a run was approved, not by whom". This week's run and any staged run stay first, as `ordered` does today.
   - **Paging:** the runs table, the waiting table and the run page's totals table each take the admin `Pager` at 20 a page (one local constant in the tab file; no seed change). The page resets when a step changes the rows.
   - **Download schedule** is the existing Print of the payment schedule (`window.print()`, so Save as PDF), moved to the header and shown once the BCTIs are approved; the schedule card keeps its table. Hook `payment-schedule-print` stays on it. No file is generated.
   - **"Open the ledger"** (`billing-open-ledger`) is dropped: Ledger is a tab one click away.
   - **Events awaiting the run** keep today's rows (patient linking to the Booking, kind or the credited invoice, amount) as `RailRow`s with the count, hidden with the rail when none wait. Their reading of "approved, not yet in a run" is unchanged.
   - **History** (the pattern's last rail section) on the run page only if the run's `payables.*` audit rows can be opened the way 53 to 54 and 63 do; otherwise omitted and logged.
5. **Reads beyond the run-build-phase standard list** (each a parallel subagent):
   - **Design:** [finances-section.html](../../explorations/finances-section.html) `#p-payments`, `#records` (Payment run: the arrangement, not the text), `#kit`, `#moves`, `#url`, `#decide`.
   - **ROADMAP.md:** D107, D110, D112 to D115, the sequencing rules for 66 and the OQ-47 and OQ-29 rows. **GAP-ANALYSIS.md** and `gaps.json`: the US-10.2.7 entry.
   - **Catalogue:** US-10.2.7 in full, US-10.2.6, US-13.3.3 ("Records on their own pages"), OQ-47, OQ-29, [the 26 November note](../../../requirements-board/requirements/notes/2026-11-26-donald-finances-section.md) #9 and #13.
   - **DECISIONS.md:** "Money prints one way", "Real routing in all three apps", "Controls stay buttons; only page switches are links", "Demo triggers live on their screen".
   - **BACKLOG.md:** closes the 12 to 35 s Run payables line (update it with what was measured if it only improved), the clause "the Billing monitor's payment-cycle table" in the long admin lists line (delete only that clause), and the "Payment runs list shows when a run was approved" line.
   - **PROGRESS.md:** 45, 47, 53, 54, 58, 64, 65 (the record pattern, table card with `Pager`, `RailSection`, History). Not 59.
   - **Code:** the Reference below.

## Reference

- **Tab and panel:** 58's `screens/finances/PaymentsTab.tsx`; `components/PaymentCyclePanel.tsx` (`TotalsTable`, `ChecksSection`, `RunsList`; exports `RUN_STATUS`, `stampOf`); the events panel where 58 put it (today `EventsAwaitingRunPanel` in `BillingMonitorScreen.tsx`).
- **Run pages:** `screens/PaymentRunScreen.tsx`, `shared/billing/RemittanceAdviceDocument.tsx`, `components/documentDesk.ts`, `screens/AnaesthetistPage.tsx` and `components/ProfileChrome.tsx` (the record pattern), `screens/finances/financePaths.ts`.
- **Cycle logic:** `store/paymentCycleActions.ts` (the close, approve, hold, re-close and send actions, `weekRunInProgress`, `openCycleDraft`, `runsNewestFirst`, `paymentScheduleFor`, `remittanceAdviceFor`, `PAYMENT_CYCLE_COPY`), `store/payablesActions.ts` (`runPayables`), `store/xeroSimActions.ts` (`payRunInXero`, the paying step), `domain/billing/payablesRun.ts` and `paymentCycle.ts`, `store/indexes.ts` (the memoised indexes the paying step reads), `store/procedureEventActions.ts` (`approvedEventsAwaitingRun`).
- **UI:** `src/shared/ui/` and `src/shared/table/` (their `README.md`s), `shared/contracts/railParts.tsx` (`StepRail`), `components/Pager.tsx`, `apps/demo/catalogue/admin/storeExamples.tsx` (`PaymentCyclePanelExample`) and its `AdminCatalogue.tsx` row.
- **Tests and specs:** `store/paymentCycleActions.test.ts`, `paymentCycleReview.test.ts`, `payablesActions.test.ts`, `apps/moneyViewPurity.test.ts` (allow-lists `PaymentCyclePanel.tsx` by path), `oneComponentPerJob.test.ts`, `appCopy.test.ts`; Playwright `visual/admin-phase39a.spec.ts` (click waits up to 90 s).

## Work items

**Subagents (D112), the session keeping decisions and joins.** Before building, the session writes the one shared helper (item 1). Read pass, in parallel: one for `PaymentCyclePanel.tsx` and its tests and specs, one for 58's and 64's and 65's PROGRESS entries and `notes.md`, one for the mock's `#p-payments` and `#records` against `#kit`, one for `payRunInXero`, `runPayables`, `payablesRun.ts` and the indexes (the freeze). Build pass, in parallel, each told its own files: (a) the cycle panel (`PaymentCyclePanel.tsx`, item 2); (b) the runs table and the events rail (`PaymentsTab.tsx` and the new files in item 3); (c) the run and remittance pages (`PaymentRunScreen.tsx`, item 4); (d) the Run payables measurement and fix (items 5 and 6, its own files in `store/` or `domain/billing/`); (e) tests (item 8). The session joins them in `PaymentsTab.tsx`, deletes the remnants and runs the quick checks.

1. **One step builder.** New pure `components/paymentCycleSteps.ts`: `paymentCycleSteps({ run, cycle, settings })` returning the four `RailStep`s, moved unchanged from the `steps` array in `PaymentCyclePanel` (labels, planned days, `Closed ... · planned ...` stamps). The panel and the run page both call it, so the run page's StepRail is the same four steps with their actual stamps, not a second copy.
2. **The cycle panel.** `PaymentCyclePanel` keeps its name, its `actor` prop and the exports `RUN_STATUS` and `stampOf`; it keeps every store call, every `data-shot` and its button copy. Changes: it no longer renders the runs table or "Open the ledger"; `TotalsTable` takes the admin `Pager` (nested, `Showing 1 to 20 of 71`) over its `totals`, keeping the `DisclosureButton` rows and "Rolled from" pills, with the expanded line rows moving with their anaesthetist; the Run payables block shows its result line and keeps the `Simulated Xero` `DemoBadge` on that one step only. Update its header comment and its `/demo/catalogue/admin` row (`what` text; `PaymentCyclePanelExample` still compiles). Untouched: the rules in `PAYMENT_CYCLE_COPY`.
3. **The runs table and the events rail.** New `screens/finances/PaymentRunsTable.tsx`: today's `RunsList` rebuilt as a `Card` "Payment runs" with a `CountBadge`, `TableShell` dense with the mock's columns (item Before you start 4), each row `ClickableRow` (or the Run cell a link) opening the run through `financePaths.ts`, `Pager` below; keep `data-shot="payables-runs"`, `data-run-id`, `data-run-status` and the order (this week and staged first, then newest first). Per-run figures (anaesthetists, BCTIs, netted, paid out) come from the run's `byAnaesthetist` in one memoised pass over `runsNewestFirst`. The events rail: a `RailSection` "Events awaiting the run" in 58's file for it (or a new `screens/finances/EventsAwaitingRun.tsx` if 58 left it inside the Billing code), `data-shot="events-awaiting-run"`, `data-event-id`, `data-kind` kept, selector narrowed to `approvedEventsAwaitingRun` only (not `useAppStore((s) => s)`). `PaymentsTab.tsx` composes: cycle panel, runs table, the rail in `PageBody`.
4. **The run page and the remittance page** (`PaymentRunScreen.tsx` and 58's `PaymentRunPage.tsx` and `RemittancePage.tsx`, the files the run and remittance routes already render, exports unchanged: build inside them, so no route edit is needed). `ProfilePage` (fluid): `back` = Payments to the tab path, `name` = `cycleLabel(run)`, `IdChip` for the run id and the `RUN_STATUS` `Pill` (with Seeded and Staged) in the chip slot, `sub` = "16 Nov to 22 Nov · paid Tue 24 Nov · 69 anaesthetists · $176,402.10" (staged runs keep "A one-line staged run (demo payout)"), the action **Download schedule** (Before you start 4). Under the header, the run's `StepRail` compact from item 1. **Main column:** `Card` "Totals by anaesthetist" (hook `payables-run-totals`; columns Anaesthetist, BCTIs, Netted, Paid, plus Still to net when any, as today; **Remittance** `TextAction` link per row with hook `payables-run-remittance-link`, "After approval" before then; `Pager` at 20), `Card` "Checks before payment" with the held lines and the "Rolled into Week N" link (hook `payables-run-held`), the `Payment schedule` card (hooks `payment-schedule`, `payment-schedule-print`). **Rail:** `RailSection`s or `Card`s for The run (`DefList`: run, sent to Xero, paid, superseded by; hook `payables-run-detail`), Ledger at close (`payables-run-snapshot`), Kept out of every run (when any), History last (Before you start 4). `RemittanceAdviceScreen` stays `AdminPage` document mode with its paper, Print and Xero cards; its back link reads the run's week and goes to the run's page, its "Open Week N's run" link too; all links through `financePaths.ts`. An unknown run or an unpaid anaesthetist already 404s in 58's route guards: do not touch them.
5. **Measure Run payables on the tab alone** (item (d)). At practice scale (Playwright against `npm run dev`, or a throwaway script over `buildFullScaleDataset(core, { scope: 'practice' })`), with `performance.now()` marks: the `runPayables` store call (split `payRunInXero`'s planning loop from its `mutate` and from audit and `persistDelta`), the synchronous re-render after it (the tab's slices and any whole-state `useAppStore((s) => s)` selector), and the click to the result line. Record the numbers in the progress entry (before and after).
6. **Fix it if it still freezes** (more than about 2 s on a quiet machine), in the cheapest place the numbers name: an index or a per-line lookup in `store/xeroSimActions.ts` or `domain/billing/payablesRun.ts`; a narrower selector or a page-bounded render on the tab; or running the paying in chunks that yield to the browser with the button showing progress ("Paying 400 of 1,600"), the result line unchanged. It must pay exactly the same: capture the paid totals, the batch payments and the audit rows for a staged week before the change and assert them equal after (a Vitest case on the core seed, plus the existing `payablesActions.test.ts`). If the split already fixed it, say so and change nothing. Update the BACKLOG line with the measured time, or delete it when under 2 s. These files are not on LANES.md's list for 66: list them under For the merge.
7. **Build on the shared components (D115).** Only the `#kit` parts above; no new shared component or variant; no private `Card`, `Row`, `Pill`, `Section` or `Th`/`Td` (the panel's inline `h3` headings become `Card` titles); `oneComponentPerJob.test.ts`'s allow-list only shrinks. No dashes, "slot", "swap", "timesheet" or phase numbers in copy; tokens only.
8. **Tests** (new `screens/finances/PaymentsTab.test.tsx` and `screens/PaymentRunScreen.test.tsx`, or beside them): the tab shows Week 48's cycle, the four steps with their planned days, Close the week closes it, the checks and Hold out of this run still work, the runs table pages and opens a run's page, a staged run shows its pill, events awaiting the run show in the rail and leave it after the billing run; the run page shows the back link to Payments, the week and status, the summary figures, the StepRail with stamps, one row per anaesthetist with a Remittance link that opens the advice page, and the advice page's back link returns to the run; "Run payables in Xero" still pays the staged week to the same totals. Existing `paymentCycleActions`, `paymentCycleReview` and `payablesActions` tests pass unchanged. Update `moneyViewPurity.test.ts`'s allow-list path if the file it names moves.
9. **Finish.** Quick checks only (below). Playwright: re-point or change only the steps in `visual/admin-phase39a.spec.ts` the new layout needs (the `[data-shot="payables-runs"] tbody tr` first row, the paged tables); 58 already moved its URLs. Delete the closed BACKLOG lines.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `stage-payment-week` (existing, 58 re-homed it to the Payments tab) | Stage a payment week | Admin, Finances, Payments tab | bar | stages a one-line run for a chosen week; the tab and its runs table show it | as today |
| `stage-bank-mismatch` (existing, re-homed by 58) | Stage a bank mismatch | Admin, Finances, Payments tab | bar | an anomaly for the Monday checks | as today |
| (product) | Close the week, Hold out of this run, Run payables in Xero | the Payments tab | none | normal use | |
| PWA | none (Admin only) | | | | |

No new trigger. **For the merge:** `run-next-billing-run` is bound to the Billing monitor's route today; the events awaiting the run now show on the Payments tab, so list adding the Payments route to its `routes` in `registry.ts` (58's file, the join edits it).

## Out of scope

- Any change to the cycle's rules, steps, days, the 20th-of-the-month payment or the "BCTI" wording (OQ-47, OQ-29); the payment run store model; the AA fees, Ledger, Xero or Billing tabs (60 to 65, 67).
- Any route, link, trigger or count change in the shell files (58's, made by the join), (the Payments tab has no number, by the owner's rule: do not add one).
- A Payments tab narrowed to one anaesthetist (65's See all would use it); the full schedule as a downloaded file; a seed change.
- Capture recipes, ATLAS and the demo guide (the owner's sweep); the full gate, review, screen-proof and checklist run (D113).

## Manual test checklist

Material for Wave 5's join to walk for the owner's test sheet `TEST-58-67.md`; this phase does not run it (D113).

- [ ] Finances, Payments tab: Week 48 with its dates; the four steps with Planned Friday 27 Nov, Monday 30 Nov, Tuesday 1 Dec; Waiting for this week's run with the practice's anaesthetists, paged, each expanding to its BCTIs. (US-10.2.7 "Week number".)
- [ ] Close the week, then the Monday checks: Hold out of this run (an anomaly, then a single line with a reason) rolls into the next week and shows "Rolled from" there; Return to run undoes it. (US-10.2.7 "Anomaly rolled over".)
- [ ] Approve the BCTIs, Send payment schedule, Run payables in Xero: the page stays usable while it pays, the result line names the week, the BCTIs and the total, and the run's status reads Paid.
- [ ] Payment runs: every earlier run in a paged table (Week, Dates, Anaesthetists, BCTIs, Negatives netted, Paid out, Status, Paid on); a staged run shows its Staged pill.
- [ ] Events awaiting the run sit in the right column with their Booking links; running the next billing run (Demo actions) empties them.
- [ ] A run row opens its page under Payments: back link Payments, Week N with its status and ID chip, the summary line, the StepRail with its stamps, each anaesthetist's BCTIs, netted and paid, the rail's run and ledger cards. (US-10.2.7 "Run page".)
- [ ] Remittance opens that anaesthetist's advice on its own page; its back link returns to the run; Download schedule saves the schedule once the BCTIs are approved.
- [ ] Old `/admin/billing/payment-runs/<id>` and `.../remittance/<id>` addresses still open the new pages; the Ledger's anaesthetist account runs link to the run's page.
- [ ] Money prints `-$610.00`; at 1280 and 1440 no sideways scroll.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS. Keep `demoGuideSync.test.ts` green. **For the sweep**, list in the progress entry: the payment-week recipes for US-10.2.7's five screenshots (open cycle, anomaly, held, schedule, payment week: now on the Payments tab and the run page) and US-10.2.6's remittance recipe, S3's payment beat (the Billing monitor's payment cycle is now Finances, Payments), ATLAS rows for `/admin/billing/payment-runs/:id` and its remittance route, the retired hook `billing-open-ledger` and the run page's retired "The run" card layout (hook `payables-run-detail` kept on the rail card), and every guide line that names the Billing monitor for the payment cycle or Run payables.

## Review steer for Wave 5's join

The join runs one review of all ten phases; steer it at: same behaviour (every store call, step, day and label as before; `RUN_STATUS`, `stampOf`, `PaymentCyclePanel(actor)` still exported); Run payables (measured before and after; if changed, equal totals, batch payments and audit rows); the three tables paged at 20 with held lines and expansions surviving a page change, this week's and staged runs first; links through `financePaths.ts` only, old addresses redirecting; no private shared-component copy, one step builder; kept hooks, no dashes in copy, `formatMoney`, `Simulated Xero` badge only on Run payables.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (the runs table's columns and what left, the 20-a-page paging, Download schedule as the existing Print, "Open the ledger" dropped, the events rail rows, History or its omission) and what Run payables measured and what was done about it.
- **For the sweep:** the recipes, ATLAS rows, hooks and guide lines listed under Demo guide updates.
- **For the merge:** the new files under `screens/finances/` (`PaymentRunsTable.tsx`, `EventsAwaitingRun.tsx` if made) and `components/paymentCycleSteps.ts`; `store/xeroSimActions.ts`, `store/payablesActions.ts` or `domain/billing/payablesRun.ts` if the freeze fix touched them (LANES.md lists them for 66, for the freeze fix only); the `run-next-billing-run` trigger's Payments route; the link a Payments tab narrowed to one anaesthetist would need for 65's See all; anything wrong in `financeCounts.ts` for the Payments count (note, do not edit).
- Status row and phase entry: drift check against `f885f67`; D107 and D114 to D115 built, OQ-47 and OQ-29 as written; the names 58 shipped that this phase used; the files built and the exports kept; tests added; `PERSIST_VERSION` unchanged; US-10.2.7's unit done here. Quick checks only (D113).
