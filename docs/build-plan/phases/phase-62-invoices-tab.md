# Phase 62 · The Invoices tab

**Requirements covered:**
[US-08.4.7](../../../requirements-board/requirements/stories/US-08.4.7.md) Find any invoice (status 3, graded **Contradicts**, size M: the screen opens on All, searches number and addressee only, and has no State, Owing, age or state filter). Built whole: opens on Unpaid, search by every key, the row's columns, Awaiting approval as a filter, no AA fee invoices, a page per record.
[US-06.3.1](../../../requirements-board/requirements/stories/US-06.3.1.md) Raise the prepayment invoice (status 3, graded **Partial**, size S: behaviour is built; only the placement changed). Approve and send and the audited approval switch keep their behaviour; they move under Awaiting approval with the switch beside the list.
No DM or RV row is closed here. 63 builds the invoice and credit note pages (the record half of US-13.3.3, D114); this phase only opens them.
**Answered, built as answered** (owner, 26 November, for the build, not yet seen by AA): D107 (the section's shape), D108 (old links redirect), D110 (today's panels move first), D112 to D115 (lanes, test once, one story split, shared kit).
**Open, built as built:** [OQ-114](../../../requirements-board/requirements/questions/OQ-114.md) (invoices go by email or post; the Delivery column reads that, nothing more), [OQ-122](../../../requirements-board/requirements/questions/OQ-122.md) (a posted invoice for a payer without email shows as it does today; `noAddress` still reads "No address"), [OQ-120](../../../requirements-board/requirements/questions/OQ-120.md) (an Awaiting approval row names the anaesthetist, as `PREPAYMENT_NAMES_ANAESTHETIST` already has it). No captions.

**Depends on:** 58 (the Finances section, `InvoicesTab.tsx`, `financePaths.ts`, `financeCounts.ts`, the `?view=approval` link shape) and 59 (the invoice state, owing, kind and search keys), both on `master`.
**Estimated:** 1 session.

**Runs in:** Lane B of the build lanes, Wave 5, first in Lane B's queue (62, then 63, then 67): built in the `AnaesthesiaAssociatesRFP-laneB` worktree, committed on `lane/b` with a `62 complete:` commit, and joined with the rest of Wave 5 on `wave/5`. [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session. The owner tests 62 once, with 58 to 67, from `TEST-58-67.md` after Wave 5's join.

## Goal

The Invoices tab finds any invoice, and prepayment invoices are approved under one of its filters. Layout: [finances-section.html](../../explorations/finances-section.html) `#p-invoices`, built from `#kit`.

- **One list:** every invoice, prepayment invoice and credit note AA raises on a payer; AA fee invoices stay on the AA fees tab. A credit note sits just above the invoice it credits.
- **Search** (`NameSearchBox`, pill): invoice number, the payable's number (AA-2026-0002-P), case reference, patient, payer, anaesthetist.
- **Columns:** Number, Kind (its own column), Payer, Patient · Booking, Anaesthetist, Raised (with the year), Total, Owing, State (Unpaid with its age, Part paid, Paid) and Delivery.
- **Filters** (`FilterPills`): Unpaid (where it opens), Part paid, Paid, Awaiting approval, All; a Kind `SelectField`; an anaesthetist `SelectField`; the admin `Pager`.
- **Awaiting approval** replaces today's separate tab: its rows are approved and sent there and leave the filter; the approval Switch sits in the rail beside the list.

## Before you start

**Test once, at the very end (D113):** finish on the quick checks only (`node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed` and `npm run lint` in `aa-prototype/`). Skip the full gate, the adversarial review, the screen-proof against the design and the Manual test checklist run; update the Playwright specs this breaks without running them. Wave 5's join runs them once.

1. **Drift check** against the plan baseline `f885f67`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-08.4.7,US-06.3.1,OQ-114,OQ-120,OQ-122
   ```

   Re-read anything changed after `f885f67`. If either story is Retired or Future, or its Opens on Unpaid, Awaiting approval, No AA fee invoices or Own page criteria change, stop and tell the user. An answer to OQ-114, OQ-120 or OQ-122 is not a stop: log it; a changed rule is a new phase.
2. **Confirm** 58 and 59 DONE on `master` (merged into `lane/b` by LANES.md's sync step); stop if either is not. Read their PROGRESS entries and `notes.md`, and note:
   - **58:** `InvoicesTab.tsx` as shipped (does the section's `AdminPage` own the title, tabs and toolbar, and what does the tab supply: `PageToolbar`, `PageBody` and the rail?), the `financePaths.ts` helpers for the tab and its records, the exact form of the Awaiting approval link (today's `?view=approval`, kept by the redirect and in-app links), the invoice and credit note record routes, `financeCounts.ts`'s Invoices count (the prepayments awaiting approval), the `data-shot` hooks it carried, and the triggers it re-homed onto Invoices.
   - **59:** the names, signatures and file of the invoice state (Unpaid, Part paid, Paid), age in days, owing, kind and search keys; whether it reads slices passed in; its practice-scale note; whether a credit note has a state or owing.
3. **Built as answered, no label:** the tab's shape and links (D107, D108), the kit (D115), the split (D114). The Delivery column keeps today's `DeliveryPill`; OQ-114, OQ-122 and OQ-120 are as built.
4. **Open or chosen here, built to a default** (each a line on the owner's review list, none gets a caption):
   - **List state in the URL** (`replace`, as 53's lists): `q`, `show` (`unpaid` default, `partPaid`, `paid`, `approval`, `all`), `kind`, `anaesthetist`, `page`. `?view=approval` (and any shape 58 shipped) is read as `show=approval`; choosing a filter writes `show` and drops `view`. Map it in the screen; never edit `financePaths.ts` or the registry.
   - **The 40-day example:** the default is a seeded unpaid invoice 30 to 50 days old; check the seed first (query 59's age over `freshAppState()`). If none exists, seed one with the smallest change and bump `PERSIST_VERSION` past any other lane's, writing it in `notes.md`. The mock's AA-2026-H07 at 98 days is drawing, not seed.
   - **State words:** "Unpaid · N days" for any unpaid invoice raised a day or more ago ("Unpaid" on its raised day), `Pill` warning from 30 days (the rail's bands), neutral below; "Part paid" neutral; "Paid" success. The mock's "due 1 Dec" on a prepayment is not built (no due date exists).
   - **Order:** Unpaid and Part paid oldest first (the mock's 98 days leads); Paid and All: unpaid and part paid first, oldest first, then Paid newest first. A credit note always sits directly above its invoice, and a credit note whose invoice the list leaves out (seeded history) lists in All only, at the top of page 1.
   - **Credit note rows** ride with their invoice: Kind "Credit note", State and Owing "·"; they list when their invoice does, under every state filter, and count as rows in the pager (closing the pager BACKLOG line).
   - **Patient · Booking** reads the patient, then the List's date and session ("Tue 18 Aug · AM"), never "Booking time not set". The List and List date columns go; the patient link opens the Booking, as today.
   - **Awaiting approval** shows the pending prepayments (Booking and payer, not yet invoices) with today's strip columns and Approve and send; Kind is hidden there and the anaesthetist filter and search apply. Approving from the invoice's own page is not built: an unapproved prepayment has no invoice yet.
   - **Rail** (`PageBody` rail, `Card`): "Prepayments to approve" with its count, a "Show them" `TextAction` (sets the filter), the Switch row; and "Unpaid by age" (`DefList`: under 30, 30 to 60, over 60 days; count and amount owing), from 59's age. The toolbar end reads "N unpaid · $X owing · N to approve".
5. **Reads beyond the run-build-phase standard list:**
   - **Mock** (`docs/explorations/finances-section.html`): `#p-invoices` (toolbar, columns, pills, rail, the "Changed from today" note), `#kit` (the rows for NameSearchBox, FilterPills, SelectField, TableShell, Pager, Pill, Card, RailSection, DefList, Switch), `#records` (an invoice and a credit note open under Invoices; the back link), `#moves` (what moved to Invoices).
   - **ROADMAP.md:** D107 to D116 (D109: the Invoices count; D116: the `noAddress` readers, the Delivery column included) and the sequencing rules "59 beside 58", "62 after 58 and 59, first in Lane B". **GAP-ANALYSIS.md:** the US-08.4.7 and US-06.3.1 rows.
   - **Catalogue:** US-08.4.7 and US-06.3.1 in full; the notes' [26 November finances section](../../../requirements-board/requirements/notes/2026-11-26-donald-finances-section.md) #8, #12, #13; US-06.3.2, US-08.4.2, US-08.4.3, US-06.3.6; US-10.3.1 (AA fees stay off); US-13.3.3 "What stays elsewhere".
   - **DECISIONS.md:** "Controls stay buttons; only page switches are links", "Money prints one way", "Demo triggers live on their screen". **BACKLOG.md:** closes "Invoices pager counts invoices only", the Invoices clause of "Invoices and Audit dates show no year" (leave Audit and the Billing monitor's separator) and "AA-2026-0007's row reads Booking time not set". **PROGRESS.md:** 45, 47, 53, 58, 59.
   - **Parallel reads (D112), one subagent each, reporting names and file:line only:** (a) `InvoicesScreen.tsx`, `PrepaymentApprovalStrip.tsx` and 58's `InvoicesTab.tsx`; (b) 59's invoice model and its tests; (c) the five Vitest files and five Playwright specs under Reference; (d) the seed's unpaid invoices and ages. The session decides.

## Reference

- **The tab:** `screens/finances/InvoicesTab.tsx` (58's), `screens/InvoicesScreen.tsx` (today's list and its cell helpers), `components/PrepaymentApprovalStrip.tsx`, `components/Pager.tsx` (`pageOf`), `components/AdminPage.tsx`.
- **Model:** 59's invoice state file in `src/domain/billing/`; `store/selectors.ts` (`isBackdropInvoice`, `invoiceAddresseeName`), `store/creditActions.ts` (`invoiceStanding`, `originalInvoiceFor`), `store/prepaymentSelectors.ts` (`usePendingPrepayments`), `store/prepaymentActions.ts`.
- **Shared UI:** `src/shared/ui`, `src/shared/table`, `src/shared/format.ts`, `src/domain/seed/fullScale/constants.ts` (`pageSizes.invoices`), `src/shared/booking/PrepaymentLetterDialogs.tsx`.
- **Tests and specs:** `InvoicesSearch.test.tsx`, `InvoicesAuditPaging.test.tsx`, `PrepaymentApprovalStrip.test.tsx`, `ClickableTableRows.test.tsx`, `CreditUi.test.tsx`; Playwright `visual/admin-phase08`, `admin-phase39`, `prepayment-phase27`, `phase38b-events`, `phase39b-events`; `apps/demo/catalogue/admin/storeExamples.tsx` (imports the strip).

## Work items

Own files (LANES.md Lane B): `InvoicesTab.tsx`, `InvoicesScreen.tsx`, `PrepaymentApprovalStrip.tsx` and their tests. New files beside them (a pure list file and its test) are this phase's; see For the merge below.

1. **Pure list** (new `screens/invoiceListRows.ts` with `invoiceListRows.test.ts`; no React, no store): `invoiceListRows(state, { q, show, kind, anaesthetistId }, todayISO)` over 59's model returns the ordered rows (invoices with their credit notes above them, Before you start 4), the toolbar totals and the age bands, each derived once per render and paged after filtering (practice scale: about 18,000 Lists, no per-row scan). Excludes backdrop history as today and AA fee invoices (they are a separate record; a test pins that none appears). Tests: each key finds its invoice (payable number, case reference, patient with two invoices, payer, anaesthetist); Unpaid default order; Part paid shows $600 owing on $1,000 with $400 received; a 40-day unpaid reads "Unpaid · 40 days"; All includes Paid; a credit note rides with its invoice and counts as a row.
2. **The list** (`InvoicesScreen.tsx` / `InvoicesTab.tsx`): the toolbar on one row at 1280 (`NameSearchBox`, `FilterPills`, Kind and anaesthetist `SelectField`s, the totals at the end), the table in a fit `TableShell` with the columns of Goal, `Pager` (50) in its footer reset to page 1 on any change, `EmptyState` for none; URL state per Before you start 4. Kind, State and Owing from 59; Delivery keeps `DeliveryPill`. Rows are `ClickableRow`s opening the invoice or credit note page through `financePaths.ts`; keep the number's sublines (additional to, event lines, rebills, standing pill), the Booking link and every `data-*` hook (`invoice-list-screen`, `data-invoice-id`, `data-credit-note-id`, `invoices-search`, `invoices-pager`, `invoice-list-delivery`). The tab strip, title and back link are 58's: delete today's `LineTabs`, `?view` branches and the billing-exception strip only if 58 left them in these files.
3. **Awaiting approval and the rail** (`PrepaymentApprovalStrip.tsx`): split into `PrepaymentApprovalList` (today's table, `ApprovePrepaymentDialog`, the result line) and `PrepaymentApprovalSwitchCard` (the rail's Switch row with the off-confirm and its error), sharing the result and error lines through props the tab holds; keep the `PrepaymentApprovalStrip` export (both parts stacked) so the catalogue example compiles. Behaviour, audit and every hook (`awaiting-approval-row`, `approve-and-send`, `prepayment-approval-switch`, `approve-and-send-result`, `invoices-awaiting-approval`) stay. Approved rows leave the filter. The rail's two cards per Before you start 4.
4. **Seed check** per Before you start 4 (only if no 30 to 50 day unpaid invoice exists).
5. **Tests and specs moved:** `InvoicesSearch.test.tsx` to the keys and filters; `InvoicesAuditPaging.test.tsx` to the pager over rows; `PrepaymentApprovalStrip.test.tsx` to the list and the switch card; `ClickableTableRows.test.tsx` and `CreditUi.test.tsx` where they break; the five Playwright specs to the filter (updated, not run). New: the `?view=approval` mapping opens Awaiting approval, and the default opens on Unpaid.
6. **Finish.** Catalogue: no new shared component or variant (D115); update `/demo/catalogue` only if an example breaks. Close the three BACKLOG items. No new en or em dashes, "slot", "swap", "timesheet" or phase numbers in copy; tokens only; teal the only action colour; "Prepayment" never "Pre-payment" in what this phase writes.

7. **Build on the shared components.** Every part of `#p-invoices` comes from the mock's `#kit` table: `PageToolbar`, `PageBody` rail, `NameSearchBox`, `FilterPills`, `SelectField`, `TableShell`/`Th`/`Td`, `ClickableRow`, the admin `Pager`, `Pill`, `Card`, `RailSection`, `DefList`, `TextAction`, `Switch`, `EmptyState`, `Button`. No new shared component or variant (D115), no local `Pill`, `Row`, `Card` or `Th`/`Td`, no raw `<button>`, `<input>` or `<select>`; tokens only; every shared component keeps `shot` and `data-*` passthrough. `oneComponentPerJob.test.ts` stays green. Each subagent is told this.

**Subagents (D112):** after the reads, one each for item 1 (pure file and test), item 2 (the list), item 3 (strip split) and item 5 (tests and specs, once 1 to 3 settle their names). Tell each its own files. The session keeps the URL shape, the order, the state words, the joins and the checks.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `stage-combined-procedure`, `load-full-scale` (existing, re-homed by 58) | as 58 left them | Admin, Finances, Invoices | bar | unchanged | as today |
| `payment-full`, `payment-half` (existing) | Payment received · full / half | an invoice's page | bar | give Paid and Part paid rows | as today |
| `add-prepaid-booking` (existing) | Add prepaid Booking | Admin Day view and Booking | bar | stages a prepayment invoice for Awaiting approval, unchanged | as today |
| (product) | Search, filters, Approve and send, the approval switch | Invoices | none | normal use | |
| PWA | none (Admin only); "Office approves and sends the prepayment invoice" unchanged | | | | |

The 40-day example is a seeded invoice, not a button. No new trigger; the registry is 58's.

## Out of scope

- The invoice and credit note pages (63); the Billing, Payments, Ledger, Xero and AA fees tabs; AA fee invoices on this tab.
- A due date on prepayments; approving from an invoice's page; a delivery method beyond email and post (OQ-114); posting or printing for payers without email (OQ-122); whether the prepayment names the anaesthetist (OQ-120).
- Routes, redirects, `financePaths.ts`, `financeCounts.ts`, the registry, the shell files (58's), capture recipes, ATLAS and the demo guide (the owner's sweep).

## Manual test checklist

Material Wave 5's join walks for the owner's test sheet `TEST-58-67.md`. Do not run it in this phase (D113).

- [ ] Finances, Invoices opens on Unpaid, oldest first, with "N unpaid · $X owing · N to approve" at the end of the toolbar; All adds Paid and credit notes; Part paid and Paid filter.
- [ ] Search finds an invoice by number, by its -P number (AA-2026-0002-P), case reference, patient (both invoices of a patient with two), payer and anaesthetist.
- [ ] A seeded unpaid invoice about 40 days old reads "Unpaid · 40 days"; a part-paid one reads Part paid and what is left (use Payment received · half on an invoice).
- [ ] Kind has its own column; credit notes sit above their invoice, with no State or Owing; the pager counts rows.
- [ ] Awaiting approval lists staged prepayments (Add prepaid Booking); Approve and send, with its letter dialog, sends it and the row leaves; the tab's number drops.
- [ ] The approval switch sits in the right column; off asks first and sends what waits; on is confirmed; each change is in the Audit viewer.
- [ ] `/admin/invoices?view=approval` and the section's own link both open Awaiting approval; Back does not loop.
- [ ] No AA fee invoice is listed; a row opens the invoice or credit note page under Finances, Invoices; the Booking link opens the Booking; no "Booking time not set".
- [ ] 1280 and 1440: one toolbar row, the list scrolling in its card, the rail beside it; a full-scale load stays quick.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS; the redirects keep them loading. Keep `demoGuideSync.test.ts` green. **For the sweep**, list in the progress entry: the 38 Invoices recipes (the Awaiting approval tab becomes a filter, and the columns change); S4 Beat 1's click path (Invoices, Awaiting approval); guide lines naming the Invoices nav item, the Awaiting approval tab or Pre-payments rail link; ATLAS rows on `/admin/invoices*`.

## Review steer for Wave 5's join

- **Search and state.** Every key finds its invoice; State, Owing and age come from 59's model only (no second rule in a screen); a 40-day unpaid reads right; credit notes ride and count.
- **Awaiting approval.** `?view=approval` and 58's shape open the filter; approving leaves the filter and the tab's number follows; the switch's audit and off-confirm are as before; no AA fee invoice on the tab.
- **Own files.** Nothing edited in `router.tsx`, `routes.tsx`, `financePaths.ts`, `financeCounts.ts` or the registry; shared components used, none copied (`oneComponentPerJob.test.ts`).
- **Scale.** Rows are derived once and paged after filtering; the screen opens quickly at practice scale.
- **Copy and tokens.** No dashes, "slot", phase numbers; teal only; Prepayment spelled one way.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (URL state; the 40-day seed; state words and the 30-day warning tone; the order; credit note rows; Patient · Booking and the dropped List columns; Awaiting approval's rows and hidden Kind; no approve from an invoice page; the rail's two cards; the anaesthetist filter beside the mock's Kind select), plus OQ-114, OQ-120 and OQ-122 as built.
- **For the sweep:** the guide lines, recipes and ATLAS rows under Demo guide updates.
- **For the merge:** any route, link, trigger or count change the tab needs (none expected; a different `?view=approval` shape in 58's links goes here). `screens/invoiceListRows.ts` and its test are new files outside LANES.md's Lane B list, in no other lane's folder; the plan maker may add them to LANES.md. Also outside LANES.md's list: the five Playwright specs updated for the filter (58 owns specs whose URLs move; these change only their Awaiting approval steps) and, only if no 30 to 50 day unpaid invoice exists, one seed change with its `PERSIST_VERSION` bump.
- Status row and phase entry: drift check against `f885f67`; the names 58 and 59 shipped that this phase used; the names it ships for 63 (the list's row model, how a row opens a record); tests added; `PERSIST_VERSION` (unchanged, or the bump and why); BACKLOG lines closed. Decisions log: Awaiting approval is a filter of the Invoices tab, with the switch beside the list.
