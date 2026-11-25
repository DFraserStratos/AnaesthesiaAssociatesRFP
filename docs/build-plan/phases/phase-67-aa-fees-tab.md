# Phase 67 · The AA fees tab

**Requirements covered:**
[US-10.3.1](../../../requirements-board/requirements/stories/US-10.3.1.md) Generate AA fee invoices (status 3, graded **Partial**, size S: the run, preview and fee total ($500 + $5 x 40 = $700) are built; missing are the tab, the Opens on unpaid criterion and the run and preview beside the list). Built whole: the AA fees tab opens on the unpaid fee invoices, with the month's run and its preview beside them; AA fee invoices stay off the Invoices tab.
[US-10.3.3](../../../requirements-board/requirements/stories/US-10.3.3.md) AA fee settings (status 3, graded **Partial**, size S: the settings, both criteria and the audit are built; only the placement changed). The settings sit on the same tab, beside the fee invoices and the run, instead of their own sub-tab.
No DM or RV row is closed here. The fee maths (`domain/billing/aaFee.ts`, 52's "active in the month" rule) does not change.
**Answered, built as answered** (owner, 26 November, for the build, not yet seen by AA): D107 (the section's shape; AA fees is a sixth tab with `/aa-fees` and `/aa-fees/settings`), D108 (old links redirect), D110 (the AA fees tab hosts `AaFeesScreen`, settings included), D112 to D115 (lanes, test once, one story split, shared kit).
**Open, built as built:** [OQ-60](../../../requirements-board/requirements/questions/OQ-60.md) (what the fee counts, and whether the fixed items vary by anaesthetist: one practice-wide schedule, the count rule as today), [OQ-112](../../../requirements-board/requirements/questions/OQ-112.md) (month end or the 20th: month end, as the run and the card's "Runs on" read it). No captions.

**Depends on:** 58 (the Finances section, `AaFeesTab.tsx`, `financePaths.ts`, `financeCounts.ts`, the `/aa-fees/settings` route, the re-homed triggers), on `master`.
**Estimated:** 1 session.

**Runs in:** Lane B of the build lanes, Wave 5, last in Lane B's queue (62, then 63, then 67): built in the `AnaesthesiaAssociatesRFP-laneB` worktree, committed on `lane/b` with a `67 complete:` commit, and joined with the rest of Wave 5 on `wave/5`. [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session. The owner tests 67 once, with 58 to 67, from `TEST-58-67.md` after Wave 5's join. 67 shares no file with 62 or 63; it is last only to balance the lanes.

## Goal

The AA fees tab lists AA's fee invoices to the anaesthetists, opening on the unpaid ones, with the month's run and its preview and the fee settings on the same tab. Layout: [finances-section.html](../../explorations/finances-section.html) `#p-aafees`, built from `#kit`.

- **Toolbar** (one row): `NameSearchBox` pill ("Anaesthetist or invoice number"), `FilterPills` Unpaid (where it opens), Paid, All, a month `SelectField` ("All months" first, then each month with fee invoices), and the totals at the end ("N unpaid · $X owed to AA").
- **Table** (fit `TableShell`, admin `Pager`): Number, Anaesthetist, Month, BCTIs, Fee, GST, Total, State (`Pill`: Unpaid warning, "Paid 9 Oct" success), Raised. A row still unfolds (`DisclosureButton`) to its lines and counted BCTIs, as today.
- **Rail** (`PageBody` rail, `Card`): the month's run (Runs on the month's last day, anaesthetists, not yet invoiced, still to invoice, the last run; a secondary Preview button and the primary Run monthly fee invoices), the fee settings (the fixed items and the per-BCTI charge, applied from the next run), and Earlier runs (a month per row: invoices, total, unpaid or all paid).
- **The preview** shows each anaesthetist's fee invoice and its total for the month, and nothing is raised until the run is made.
- **Unpaid first.** Unpaid fee invoices lead every state filter; AA fee invoices appear on no other tab.
- **`/aa-fees/settings`** opens this tab with the settings card open for editing and scrolled into view. There is no Fee settings sub-tab.

## Before you start

**Test once, at the end (D113).** Finish on the quick checks only: `node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed` and `npm run lint` in `aa-prototype/`. Skip the full gate, the adversarial review, the screen-proof against the design and the manual test checklist run: Wave 5's join runs them once for 58 to 67.

1. **Drift check** against the plan baseline `f885f67`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-10.3.1,US-10.3.3,OQ-60,OQ-112
   ```

   Re-read anything changed after `f885f67`. If either story is Retired or Future, or its Opens on unpaid, Preview before the run, Fee total or New rate criteria change, stop and tell the user. An answer to OQ-60 or OQ-112 is not a stop: log it; a changed rule (the 20th, a per-anaesthetist schedule) is a new phase.
2. **Confirm** 58 DONE on `master` (merged into `lane/b` by LANES.md's sync step); stop if not. Read its PROGRESS entry and `notes.md`, and note:
   - **58:** `AaFeesTab.tsx` as shipped (does it render `AaFeesScreen` with a `tab` prop, and does the section's `AdminPage` own the title, tabs and toolbar, or does `AaFeesScreen` still wrap its own `AdminPage` and `LineTabs`?), how `/aa-fees/settings` reaches it (the route element, the `tab` it passes, or the pathname the tab reads), the AA fees helpers in `financePaths.ts`, that the AA fees tab has no count (none, by the owner's rule), the `data-shot` hooks it carried (`admin-aa-fee-invoices`, `admin-aa-fee-settings`, `aa-fee-run-result`, `aa-fee-settings-result`), and the three triggers it re-homed onto AA fees (route constant, screen label).
3. **Built as answered, no label:** the tab, its routes and links (D107, D108, D110), the kit (D115), the split (D114).
4. **Open or chosen here, built to a default** (each a line on the owner's review list, none gets a caption):
   - **List state in the URL** (`replace`, as 53's lists): `q`, `show` (`unpaid` default, `paid`, `all`), `month` (`YYYY-MM`, absent for All months), `page`. Never edit `financePaths.ts`; the screen reads and writes its own params.
   - **Order:** Unpaid, oldest month first (the one owed longest leads), then by number; Paid, newest month first; All: unpaid, then paid. Sort in a new pure helper; `allAaFeeInvoices`'s newest-first order stays (the web fee list reads it).
   - **Search** matches the invoice number and the anaesthetist's name (surname or full); fee invoices have no other key.
   - **The month select drives both the list and the run card.** All months lists everything and the card is the demo month's run (`useToday`'s month); a chosen month filters the list and makes the card that month's run, so an earlier missed month can still be previewed and run (today's month stepper goes). The card publishes the month as the `aaFees.month` demo context (`useDemoTriggerContext`), unchanged, so the triggers keep reading it.
   - **Runs on** is the card month's last day (month end, OQ-112), shown with `plainDate`; **Last run** is the latest month holding fee invoices ("October 2026 · 84 invoices"). No due date is stored; the run still refuses a future month and a month with nothing pending, with `aaFeeRunDisabledReason`'s words.
   - **The preview** replaces the list in the main card while on (local state; Back to fee invoices is a `TextAction`): today's preview table (anaesthetist by surname, BCTIs paid, fixed, per-BCTI, fee ex GST, invoiced) with the "Still to invoice" total, a `Notice` saying nothing is raised until the run, and the Run button repeated. Running keeps today's result line and returns to the list on Unpaid.
   - **The settings card:** a summary at rest (each fixed item and the per-BCTI charge, ex GST) with a Change `TextAction`; Change swaps it for today's form (items add and remove, validation, the $700 worked example line, Save audited through `saveAaFeeSettings`, "They apply from the next monthly run"); the focus rules of today's test (remove hands focus on) hold. Use `EditableCard` and `useCardEdit` (53) if they carry the dynamic items without a new variant; otherwise a `Card` with the form moved as it is. `/aa-fees/settings` opens it in the Change state and scrolls it into view, and Cancel or Save leaves the URL on the tab.
   - **Earlier runs:** a `RailSection`-style list of the last months (invoices, total incl GST, "N unpaid" or "all paid"), five then See all expanding in place; a row sets the month filter. A row is a control, so a `TextAction` button, not `RailRow`'s link (DECISIONS: "Controls stay buttons").
   - **Columns:** BCTIs, not the mock's "Lists" (the fee counts BCTIs, US-10.3.1's example). The mock's Fee, GST and Total columns are today's Fee ex GST, GST and Total.
   - **The tab shows no number, ever** (owner rule: Payments and AA fees have none; there is no AA fees count in `financeCounts.ts`). Do not add one.
   - **The count-rule note** stays as one line in the run card, as today.
5. **Reads beyond the run-build-phase standard list:**
   - **Mock** (`docs/explorations/finances-section.html`): `#p-aafees` (toolbar, columns, run card, Earlier runs, the "New tab" note), `#kit` (the shared parts used), `#moves` (the AA fee strip is dropped; the screen and settings go to this tab).
   - **ROADMAP.md:** D107, D109 (AA fees shows no number), D110, D112 to D115; the "67 last in Lane B" rule; the OQ-60 and OQ-112 rows.
   - **GAP-ANALYSIS.md:** the US-10.3.1 and US-10.3.3 rows (evidence `AaFeesScreen.tsx:46-62`, `:188-250`, `:321-447`; `selectors.ts:1639-1654`).
   - **Catalogue:** US-10.3.1 and US-10.3.3 in full; the [26 November notes](../../../requirements-board/requirements/notes/2026-11-26-donald-finances-section.md) #12; US-13.3.3's AA fees line.
   - **DECISIONS.md:** "Controls stay buttons; only page switches are links", "Money prints one way", "Demo triggers live on their screen", "The AA fee run bills the month someone leaves" (52), "AA fee invoices are web only" (the web fee list stays). Supersedes none.
   - **BACKLOG.md:** closes the AA fees clause of "Long admin lists with no paging or search... AA fees 'Every fee invoice' (830)" (leave the other lists), and removes "AA fees," from the first-name sort line if the preview's anaesthetist order now follows the surname rule.
   - **PROGRESS.md:** 47 (toolbar on one row, URL state, `Pager` in the footer), 53 (`peopleLists.ts` pure filters, `replace` URL state, `EditableCard`, `RailSection`), 58 as in item 2; 62's entry if on `lane/b` (list URL shape; no code dependency).
   - **Parallel reads (D112), one subagent each, reporting names and file:line only:** (a) `AaFeesScreen.tsx`, 58's `AaFeesTab.tsx` and the route elements; (b) the store, selectors and `aaFee.ts`; (c) the test, the spec, the three AA fee triggers in `registry.ts` and the web `AccountsScreen.tsx` fee list (must not break); (d) `shared/ui` (`RailSection`, `EditableCard`, `Notice`, `FilterPills`, `SelectField`) and `Pager`. The session decides.

## Reference

- **Code:** `screens/finances/AaFeesTab.tsx` (58's), `screens/AaFeesScreen.tsx` (today's run, preview, list, detail, settings), `components/Pager.tsx` (`pageOf`, `pageParam`), `domain/billing/aaFee.ts`, `store/aaFeeActions.ts`, `store/selectors.ts` (`allAaFeeInvoices`, `aaFeeRunPreview`, `AaFeeInvoiceRow`), `domain/seed/aaFee.ts` (fee history, paid and unpaid), `shared/format.ts`, `src/shared/ui`, `src/shared/table`.
- **Tests and specs:** `AaFeesScreen.test.tsx`; Playwright `visual/aa-fee.spec.ts`, `admin-layout.spec.ts`.

## Work items

Own files (LANES.md Lane B): `screens/finances/AaFeesTab.tsx`, `AaFeesScreen.tsx` and its test. New files beside them (a pure list file and its test) are this phase's; see For the merge below.

1. **Pure list** (new `screens/aaFeeRows.ts` with `aaFeeRows.test.ts`; no React, no store): `aaFeeRows(invoices, { q, show, month }, nameOf)` over `allAaFeeInvoices`'s rows returns the ordered rows, the unpaid count and owed total and the months for the select and Earlier runs (invoices, total, unpaid per month), each derived once per render and paged after filtering (about 830 at practice scale). Tests: Unpaid is the default order (oldest month first); Paid newest first; All puts unpaid first; search finds a number and an anaesthetist by surname; the month filter; the totals; a `paid` row needs `amountReceived` at least the total (as `aaFeeRow` has it).
2. **The list and toolbar** (`AaFeesScreen.tsx`, `AaFeesTab.tsx`): the toolbar on one row at 1280, the table in a fit `TableShell` with the columns of Goal and `Pager` (50) in its footer reset to page 1 on any change, `EmptyState` for none ("No unpaid fee invoices" with a Show all action; "No fee invoices yet. Run a month." for none at all), URL state per Before you start 4. Keep the unfolding detail (`FeeInvoiceDetail`, moved as is) and the hooks `aa-fee-row-<number>`, `aa-fee-detail-<number>`, `admin-aa-fee-invoices`. The title, tab strip and back link are 58's: delete today's `AdminPage`, `LineTabs` and the Fee invoices and Fee settings sub-tabs only if 58 left them in `AaFeesScreen.tsx`; the `AaFeesTab` type goes.
3. **The run card and the preview** (the rail and the main card): the run card per Before you start 4 with `aaFeeRunDisabledReason` on the Run button, `ResultLine` (`aa-fee-run-result`) and `FormError` as today; the preview view (table, Notice, Run) in the main card, keeping `aa-fee-preview` and `aa-fee-preview-<id>`, with the anaesthetist order by surname. Publish `aaFees.month`.
4. **The settings card** (`AaFeesScreen.tsx`): summary and Change form as Before you start 4, moved from `FeeSettingsTab` with its draft, validation, example line, focus handling and `aa-fee-settings-result`; `admin-aa-fee-settings` on the card. The tab opens it in the Change state and scrolls it into view on `/aa-fees/settings` (read the route 58 shipped; never edit it).
5. **Earlier runs** card from item 1's months.
6. **Tests moved:** `AaFeesScreen.test.tsx` to the tab (preview then run adds the invoices; the seeded history opens on Unpaid and All shows paid; detail unfolds; the month select and its limits; the settings card's add, remove, focus and re-sync cases, now behind Change); new: `/aa-fees/settings` opens the settings in view, a row of Earlier runs sets the month, search and pager. `visual/aa-fee.spec.ts` updated to the new hooks, not run.
7. **Finish** on the quick checks (D113). Catalogue: no new shared component or variant (D115); update `/demo/catalogue` only if an example breaks. Close the BACKLOG clauses. No new en or em dashes, "slot", "swap", "timesheet" or phase numbers in copy; tokens only; teal the only action colour.

**Subagents (D112):** after the reads, one each for item 1 (pure file and test), item 2 (the list and toolbar), items 3 and 5 (run card, preview, Earlier runs) and item 4 (the settings card), each told its own file regions (the screen is one file: tell each its functions and let the session join the file); a fifth for item 6 once the names settle. The session keeps the URL shape, the order, the month rule, the joins and the checks.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `seed-month-of-bctis` (existing, re-homed by 58) | Seed a month of BCTIs | Admin, Finances, AA fees | bar | tops Dr Rutherford up to 40 BCTIs for the month, so the next run shows the worked example | as today |
| `run-scheduled-fee-run` (existing, re-homed by 58) | Run scheduled month-end fee run | Admin, Finances, AA fees | bar | raises the month's fee invoices as the scheduled run; the month is the card's (`aaFees.month`) | as today (nothing pending, or a future month) |
| `record-fee-payment` (existing, Xero simulation) | Record fee payment | a fee pair in the Xero simulation | bar | makes a fee invoice Paid; the tab's State and Unpaid totals follow | as today |
| (product) | Search, month and state filters, Preview, Run, Change fee settings | AA fees | none | normal use | |
| PWA | none (Admin only) | | | | |

No new trigger; the registry is 58's. The 40-BCTI example is the seed trigger, then the run.

## Out of scope

- The Invoices tab, the Payments tab and the Billing tab's old AA fee strip (dropped by 58); the Anaesthetist Web App's fee list (`/web/accounts/fees`), the fee maths, the count rule, the fee settings' shape, a per-anaesthetist schedule or the 20th (OQ-60, OQ-112), a due date or reminders for unpaid fee invoices, a tab number.
- Routes, redirects, `financePaths.ts`, `financeCounts.ts`, the registry, the shell files (58's), seed and `PERSIST_VERSION` (no change), capture recipes, ATLAS and the demo guide (the owner's sweep).

## Manual test checklist

Material Wave 5's join walks for the owner's test sheet `TEST-58-67.md`. Do not run it in this phase (D113).

- [ ] Finances, AA fees opens on Unpaid, the oldest month first, with "N unpaid · $X owed to AA" at the end of the toolbar; Paid and All show the paid ones; no AA fee invoice is on the Invoices tab.
- [ ] Search finds a fee invoice by number and by anaesthetist surname; the month select narrows the list and the run card follows; the pager shows 50 a page at full scale and the screen stays quick.
- [ ] Seed a month of BCTIs, then Preview: each anaesthetist's fee and total show (Dr Rutherford $700 plus GST at the default settings) and nothing is raised; Run monthly fee invoices raises them, the list shows them Unpaid and Runs on and Last run update.
- [ ] Run scheduled month-end fee run does the same from the bar; a second run says nothing is pending. A row unfolds to its lines and BCTIs.
- [ ] Record fee payment (Xero simulation) makes one Paid; the unpaid total drops.
- [ ] The fee settings sit in the right column: Change, edit a fixed item and the per-BCTI charge, Save (audited, "applies from the next monthly run"); the next preview uses the new rate.
- [ ] `/admin/billing/aa-fees/settings` and the section's settings link open this tab with the settings open and in view; there is no Fee settings sub-tab; Back does not loop.
- [ ] 1280 and 1440: one toolbar row, the list in its card, the rail beside it.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS; the redirects keep them loading. Keep `demoGuideSync.test.ts` green. **For the sweep**, list in the progress entry: the AA fee recipes (US-10.3.1 and US-10.3.3's screenshots: the Fee settings sub-tab is gone, the run and preview now sit in the rail and the preview replaces the list); S3's AA fee aside and any guide line naming the Fee settings tab or the Billing monitor's AA fee strip; ATLAS rows on `/admin/billing/aa-fees*`; the catalogue captions naming Dr Donaldson against the trigger's "Dr Rutherford" description if the seed still names Rutherford.

## Review steer for Wave 5's join

- **Opens on unpaid.** The default list is Unpaid, oldest first; All puts unpaid first; `allAaFeeInvoices` and the fee maths untouched; no AA fee invoice on Invoices.
- **Run and preview.** The preview raises nothing; the run and its disabled reasons are as before; the month select drives list and card; `aaFees.month` still published so the triggers work.
- **Settings.** On the tab, applied from the next run, audited; `/aa-fees/settings` opens it in view; the route and `financePaths.ts` unedited.
- **Own files.** Nothing edited in `router.tsx`, `routes.tsx`, `financePaths.ts`, `financeCounts.ts` or the registry; shared components used, none copied (`oneComponentPerJob.test.ts`); the web fee list still works.
- **Scale.** Rows derived once and paged after filtering at about 830 fee invoices.
- **Copy and tokens.** No dashes, "slot", phase numbers; teal only.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (URL state; the order; search keys; the month select driving list and card, and earlier months run from it; Runs on and Last run; the preview replacing the list; the settings card and how the settings route opens it; Earlier runs; BCTIs for the mock's Lists column; no tab number; the count-rule line), plus OQ-60 and OQ-112 as built.
- **For the sweep:** the recipes, guide lines and ATLAS rows under Demo guide updates.
- **For the merge:** any route, link, trigger or count change the tab needs (a different settings-route shape in 58). `screens/aaFeeRows.ts` and its test are new files outside LANES.md's Lane B list, in no other lane's folder; the plan maker may add them to LANES.md.
- Status row and phase entry: drift check against `f885f67`; the names 58 shipped that this phase used; the names it ships (the pure list and its row model); tests added; `PERSIST_VERSION` (unchanged); BACKLOG lines closed. Decisions log: AA fee settings live on the AA fees tab, not a sub-tab; the month select drives both the list and the run card.
