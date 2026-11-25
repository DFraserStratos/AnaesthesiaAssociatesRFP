# Phase 61 · The Xero tab

**Requirements covered:**
[US-13.3.2](../../../requirements-board/requirements/stories/US-13.3.2.md) Manual intervention (status 3 Verify, graded **Partial**, size M). Built across 60 and 61 (D114): 60 builds the fix beside the Booking on Billing (Retry, Fix the payer, Mark resolved); this phase builds the Xero tab and **finishes the story**, with its unit. Its four criteria are walked at the close: Fix beside the Booking and Stuck at Xero shows twice (the Billing half is 60's), Retry now and Changed in Xero (this phase's). [US-13.3.3](../../../requirements-board/requirements/stories/US-13.3.3.md) (the Xero tab's number) and [US-09.2.2](../../../requirements-board/requirements/stories/US-09.2.2.md) (the daily poll) are read only.
No DM or RV row is closed here. No seed change, no `PERSIST_VERSION` bump, nothing under `domain/` or `store/`.
**Answered, built as answered** (owner, 26 November, for the build, not yet seen by AA): D107 (the Xero tab is its own tab), D109 (the tab's number and the badge's unit; stuck at Xero shows twice, counted once), D110 (the panels moved first, unchanged), D114 (the story split), D115 (shared kit). No open question gates this phase.

**Depends on:** 58 (`XeroTab.tsx` hosting today's panels, `financePaths.ts`, `financeCounts.ts`, the triggers re-homed to the Xero tab), 59 (the Booking and List billing status, through 60) and 60 (the Billing tab where a stuck Booking shows as a problem under its List).
**Estimated:** 1 session.

**Runs in:** Lane A of the build lanes, Wave 5, second in Lane A's queue (after 60, which it follows in the same worktree and branch): built in the `AnaesthesiaAssociatesRFP-laneA` worktree on `lane/a`, committed with a `61 complete:` commit, and joined with the rest of Wave 5 on `wave/5`. [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-test and plan-page steps for a lane session.

## Goal

The Xero tab is a finished page of the Finances section (mock `#p-xero`), opening on what needs action.

- **One grouped table** (the mock's, built from the `#kit` table): Hand-offs failing, Hand-offs waiting, Changed directly in Xero, each with its count. A hand-off row gives what it is, the anaesthetist, the problem, attempts, next try, last error, status and **Retry now**; a changed-in-Xero row gives the invoice, anaesthetist, what Xero shows against what the engine holds, when it was found, status and **Resolve**, which opens today's Resolve side panel.
- **Toolbar:** `NameSearchBox` (invoice, payer or anaesthetist), `FilterPills` (Needs action, Waiting, Sent after waiting, All), an anaesthetist `SelectField`, and a count line ("3 need action: 2 hand-offs failing, 1 changed in Xero").
- **Rail:** a Connection card (today's `XeroConnectionLine` as a `Notice`, then a `DefList`) and a short "What happens here" card.
- **Retry now** that succeeds takes the row off the list, and the Booking then reads as in Xero on Billing (60's tab, 59's model). A Booking waiting for Xero shows here and, as a problem, under its List on Billing: **stuck at Xero shows twice**, counted once in the badge (D109).

## Before you start

**Test once, at the very end (D113):** finish on the quick checks only (`node requirements-board/agent/skills/run-build-phase/tools/phase-check.mjs --changed` and `npm run lint` in `aa-prototype/`). Skip the full gate, the adversarial review, the screen-proof against the design and the Manual test checklist run; update the Playwright specs this breaks without running them.

1. **Drift check** against the plan baseline `f885f67`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-13.3.2,US-13.3.3,US-09.2.2
   ```

   Re-read anything changed after `f885f67`. If US-13.3.2 is Retired or Future, stop. If its Retry now, Stuck at Xero shows twice or Changed in Xero criteria, "The Xero tab opens on what needs action", or US-13.3.3's rule for the Xero tab's number (alerts and changed in Xero) change, stop and tell the user.
2. **Confirm** (stop if not): 58 DONE on `lane/a` (or merged from `master`), and 60 complete on `lane/a`. Read their PROGRESS entries and `notes.md` (the lanes folder in the shared `.git`) and note:
   - **58:** whether `XeroTab.tsx` renders its own `PageToolbar` and `PageBody` or is handed them by the section frame; the Xero tab's route, its `financePaths.ts` helper for an invoice record (the What cell links there; never a hand-built `/admin/finances` string), `financeCounts.ts`'s Xero count, the screen name the Xero triggers now bind to, and the `data-shot` hooks it carried; that `BillingMonitorScreen.tsx` no longer imports `XeroPanels`.
   - **59 (through 60's entry):** the exports that give a Booking's billing status and a List's problem reasons (`waitingForXero`, `xeroAlert`), used to prove the second showing.
   - **60:** how the Billing tab keeps list state in the URL (param names, replace), its toolbar row and `FilterPills` shape (this tab copies them), the `GroupRow level="sub"` counts that landed, and the file where its stuck-at-Xero row reads.
3. **Built as answered, no label:** the tab, its number and the badge's unit (D107, D109), the moved panels (D110), the kit (D115).
4. **Open, built to default** (each a line on the owner's review list, no on-screen caption):
   - **Opens on Needs action**, which lists the failing (alert raised) hand-offs first, then the waiting and retrying ones, then the changed-in-Xero rows, so a waiting Booking shows the moment the tab opens (US-13.3.2's third criterion). The Waiting pill narrows to the waiting and retrying hand-offs; Sent after waiting shows what drained; All shows every group. **The tab's number (58's, D109) counts only alerts and changed-in-Xero rows**, so the count line and the number differ while a hand-off merely waits: leave it, and say so on the review list.
   - **Sent after waiting stays folded** under the table behind today's `billing-xero-sent-toggle` `TextAction` (open when its pill is chosen), never a group in the Needs action list.
   - **Problem wording** per queue kind, one small map in `XeroPanels.tsx` in the catalogue's vocabulary and without dashes (a hand-off: "Invoice pair not in Xero"; a payment sync, a disbursement, a transfer journal, a correction, a netting and the poll each their own plain line). The row's second line is the payer's name through `counterpartyName` (as `XeroDivergencePanel` does today); never an NHI or the internal patient id.
   - **Connection rows:** Organisation, Last good (the newest sent item), Waiting, Sent after waiting (today) and Last payment check, each only where the store already answers it; drop a row rather than invent data. The outage state from `settings.xeroOutage` reads as the mock's error `Notice`.
   - **Search** matches the invoice or payable number, the payer and the anaesthetist, case-insensitive. List state (`q`, `show`, `anaesthetist`, `page`) in the URL with replace, as 60 keeps it; page size 50 through the admin `Pager`.
   - **Resolve** stays today's side panel and its three outcomes, note required, "Provisional: ..." line unchanged (`appCopy.test.ts` pins it in `XeroPanels.tsx`).
5. **Reads beyond the run-build-phase standard list** (each reader below is a parallel subagent; Work items names the split):
   - **Design:** [finances-section.html](../../explorations/finances-section.html): `#p-xero` (the toolbar, the grouped table, the rail's Connection and "What happens here" cards, its annotation), `#p-billing` and `#billing-table` version C only for the toolbar and `GroupRow` look this tab shares, `#kit` (the component table: build from it, D115), `#moves` (what came off the Billing monitor to this tab).
   - **ROADMAP.md:** D107 (six tabs, Xero is one), D109 (the Xero number; "Stuck at Xero shows twice" counted once; `financeCounts.ts` is 58's and 60's, never this phase's), D110 (the panels move unchanged first), D111 (no Wave 5 phase edits the registry), D112 (lanes and subagents), D113 (test once), D114 (US-13.3.2's split, unit on 61), D115 (kit); the sequencing rule "61 follows 60 in Lane A" and the Wave 5 rule on what no phase edits.
   - **GAP-ANALYSIS.md:** the US-13.3.2 row and its `gaps.json` entry (evidence: `XeroPanels.tsx` lines for the queue, Retry now and the Resolve panel; the missing Xero tab and "what needs action" opening).
   - **Catalogue:** US-13.3.2 in full (criteria and Notes); US-13.3.3 (the Xero count line and badge); US-09.2.2 (the poll's wording) and US-09.2.4 (the Xero sync queue). [The 26 November note](../../../requirements-board/requirements/notes/2026-11-26-donald-finances-section.md) #1, #4 and #11.
   - **DECISIONS.md:** honour "Controls stay buttons; only page switches are links" (Retry now and Resolve are buttons; the What cell is a link), "The internal patient id is never shown", "No NHI or personal details in the Xero slice" (`store/xeroNhi.test.ts`; never weakened), "Real routing in all three apps".
   - **BACKLOG.md:** closes none. 
   - **PROGRESS.md:** 45 and 53 (the section frame, `AdminPage`, toolbar and `Pager` in a fit card: read the Built paragraphs for their file names), 47 (the toolbar row at 1280), 58 and 59 (Wave 5 groundwork; Before you start 2), 60 (the Billing tab's URL state and toolbar). In the catch-up archive, Phases 37 and 39 only for what the queue and divergence panels do (`correction`, `offsetSync` and `paidAfterCredit` rows must still list).

## Reference

- **Tab and panels:** `aa-prototype/src/apps/admin/screens/finances/XeroTab.tsx` (58's), `apps/admin/components/XeroPanels.tsx` (`XeroConnectionLine`, `XeroQueuePanel`, `XeroDivergencePanel`, `xeroShowsText`, the private `ResolveDivergencePanel`, `QUEUE_TONE`) and `XeroPanels.test.tsx`; the catalogue row `XeroPanelsExample` in `apps/demo/catalogue/admin/storeExamples.tsx`, used in `AdminCatalogue.tsx`.
- **Store reads and actions (unchanged):** `store/ledgerSelectors.ts` (`xeroQueueView`, `XeroQueueRow`, `openXeroDivergences`, `billingAttentionCount`), `retryXeroItemNow`, `resolveXeroDivergence`, `DIVERGENCE_OUTCOMES`, `store/reconciliationPoll.ts`, `domain/xero/queue.ts` (`XERO_ALERT_AFTER_ATTEMPTS`), `store/billingMonitorView.ts` (`MonitorProblem`: `waitingForXero`, `xeroAlert`, the divergence kinds), `shared/procedureEventCopy.ts` (`xeroFlagText`).
- **Shared UI:** `src/shared/ui/` (`Card`, `Notice`, `DefList`, `Pill`, `TextAction`, `Button`, `FilterPills`, `NameSearchBox`, `SelectField`, `EmptyState`, `ResultLine`, `FormError`, `RailSection`), `src/shared/table/` (`TableShell`, `Th`, `Td`, `GroupRow`), `src/shared/surface/SidePanel`, `components/AdminPage.tsx` (`PageToolbar`, `PageBody`), `components/Pager.tsx`, `shared/format.ts` (`hhmm`, `shortDay`, `formatCurrency`).
- **Tests and specs:** `appCopy.test.ts`, `oneComponentPerJob.test.ts`, `store/xeroNhi.test.ts`, `demoGuideSync.test.ts`; Playwright `aa-prototype/visual/` `billing-monitor.spec.ts`, `admin-phase09.spec.ts`, `xero-resilience.spec.ts` (the steps on `billing-xero-*`).

## Work items

**Split across parallel subagents (D112), each told its own files; the session keeps the decisions in Before you start 4 and does the joins.** Readers first, in parallel: (a) 58's, 59's and 60's entries and `notes.md` (Before you start 2); (b) `#p-xero` and `#kit` against `XeroPanels.tsx`; (c) the three Playwright specs and the catalogue row. Then three builders: **A** items 1 and 6 (new file and its test), **B** items 2 to 4 (`XeroPanels.tsx`), **C** items 5 and 7 (`XeroTab.tsx`, the cross-tab test). The session fixes A's function signatures before B and C start.

1. **The tab's rows, pure** (new `screens/finances/xeroTabRows.ts` with `xeroTabRows.test.ts`; no React): `xeroTabRows(state, { q, show, anaesthetistId }, todayISO)` returns the groups (failing, waiting, changed in Xero), the folded sent rows, each group's count and the count line's parts, from `xeroQueueView` and `openXeroDivergences` (Before you start 4). Tests: the order; Needs action holds waiting rows; Waiting narrows; search by invoice number, payer and anaesthetist; the anaesthetist filter on both kinds.
2. **Hand-off rows** (`XeroPanels.tsx`): a `XeroQueueRows` fragment (a `GroupRow` per group, then the table rows) keeping each row's `data-queue-item`, `data-queue-kind`, `billing-xero-retry-<id>` and the `billing-xero-alert` `Notice`, with today's `retry()` and `ResultLine` and `FormError`. Retry now stays `retryXeroItemNow`; a refusal shows in place.
3. **Changed-in-Xero rows and Resolve** (`XeroPanels.tsx`): a `XeroDivergenceRows` fragment keeping `data-divergence-id`, `data-divergence-kind`, `billing-xero-resolve-<id>`; `ResolveDivergencePanel` exported unchanged in behaviour (its `billing-xero-resolve-*` hooks, the note required, "Provisional: ..." text). The invoice link goes through 58's `financePaths.ts` helper, not `/admin/invoices/...`.
4. **Keep the three panel exports** and their props (`actor`, `anaesthetistId`): `XeroConnectionLine`, `XeroQueuePanel` and `XeroDivergencePanel` render through the new fragments so the catalogue's `XeroPanelsExample` compiles unchanged, with the catalogue row's description updated to say the Xero tab is built from them. `XeroPanels.tsx` imports nothing from `PaymentCyclePanel` (Lane C's 66 changes it). The file's header comment drops "Billing monitor".
5. **`XeroTab.tsx`**: toolbar (`NameSearchBox`, `FilterPills`, anaesthetist `SelectField`, the count line), one `TableShell` fit with `Pager` in its footer, the folded Sent toggle, the empty state (`EmptyState`: "Nothing needs action in Xero."), the Resolve panel, and the rail (Connection `Card` with `Notice` and `DefList`, then "What happens here"). It reads `anaesthetistId` from the URL and passes it down. No new shared component or variant (D115).
6. **Tab number check, no edit.** Read `financeCounts.ts`'s Xero count: it must equal alerted hand-offs plus open divergences, and the badge must count a stuck Booking once. If either is wrong, note it under "For the merge"; never edit `financeCounts.ts` (60 owns it).
7. **Tests.** `XeroPanels.test.tsx` follows the moved copy (the queue, Retry now and the outage alert; the Resolve panel with the note required and no money moved) and renders through `XeroTab`. New `XeroTab.test.tsx`: opens on Needs action with a failing hand-off, a waiting one and a divergence in order; Retry now (Xero restored) takes the row off and **59's Booking status reads in Xero**; during an outage the same Booking is a problem under its List (59's model, the second showing); Resolve records the outcome and the row leaves; the filters and search. Update the three Playwright specs' steps to the Xero tab's URL (hooks unchanged); do not run them.

## Demo triggers

No new trigger, no registry edit (D111). The ones 58 re-homed to the Xero tab (screen binding as 58's notes name it) carry the demos:

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `arm-handoff-fault` (existing) | Arm handoff failure | Admin, Finances, Xero | bar | the next Xero call fails once; a hand-off waits with its attempts and next try | already armed |
| `xero-outage-start` (existing) | Simulate Xero outage | Admin, Finances, Xero | bar | every call queues; waiting rows appear, then alerts after repeated tries | as today |
| `xero-outage-restore` (existing) | Restore Xero | Admin, Finances, Xero | bar | Xero answers again; Retry now sends | as today |
| `run-reconciliation-poll` (existing) | Run reconciliation poll | Admin, Finances, Xero | bar | flags invoices changed in Xero (stage one first) | as today |
| `run-archive-job` (existing) | Run archive job | Admin, Finances, Xero | bar | as today, re-homed by 58 | as today |
| (Xero simulation, existing) | Void this invoice in Xero, Edit this invoice's total in Xero | `/demo/xero` invoice | bar | stages a divergence; Run reconciliation poll or Next day then lists it | as today |
| (product) | Retry now; Resolve | Xero tab | none | normal use | |
| PWA | none (Admin only) | | | | |

## Out of scope

- The Billing tab's problem Lists, Retry, Fix the payer and Mark resolved (60), and the model behind "stuck at Xero shows twice" (59); `financeCounts.ts`, the badge and every route, link, redirect and trigger (58 and the join).
- Any store, domain, seed or Xero simulator change; the payment cycle (`PaymentCyclePanel`, 66); the Ledger's Reconciliation card.
- Capture recipes, ATLAS and the demo guide (the owner's sweep); running the capture, even `--dry`.

## Manual test checklist

Material Wave 5's join walks for the owner's test sheet `TEST-58-67.md`. Do not run it in this phase (D113).

- [ ] Finances, Xero tab: opens on Needs action; the count line, the tab's number and the Finances badge read as D109 sets (the number counts alerts and changes in Xero only).
- [ ] "Arm handoff failure", then authorise a List: a waiting hand-off shows with attempts, next try and last error; "Simulate Xero outage" and Next day raise Alert raised; "Restore Xero".
- [ ] Retry now on a failing hand-off: it leaves the list with a result line, the Booking reads as in Xero on the Billing tab, and the badge drops.
- [ ] A Booking waiting for Xero shows on this tab and as a problem under its List on Billing, counted once in the badge.
- [ ] `/demo/xero`: Void this invoice in Xero (and Edit this invoice's total), then Run reconciliation poll: the invoice is listed under Changed directly in Xero; Resolve opens the side panel, a note is required, Record resolution removes the row.
- [ ] Waiting, Sent after waiting and All pills; search by invoice number, payer and anaesthetist; the anaesthetist filter; reload keeps the view; the Pager at 50.
- [ ] Connection card reads connected, or the outage as an error with the time; no NHI anywhere on the tab.
- [ ] `/demo/catalogue/admin`'s Xero panels row still renders.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS. Keep `demoGuideSync.test.ts` green. **For the sweep**, list in the progress entry: the recipes `US-13.3.2.json`, `US-09.2.2.json`, `US-09.2.3.json`, `US-09.1.1.json` and `US-08.5.2.json` (their `billing-xero-*` steps, now on the Xero tab, and the Billing monitor Xero queue and changed-in-Xero screenshots); the ATLAS rows for the Xero queue and divergence hooks; the guide lines naming the "Xero sync queue" and "Changed directly in Xero" on the Billing monitor (`01-personas-and-responsibilities.md` near lines 353 and 417, `02-workflows-and-handoffs.md` near 393 to 396 and 510, `03-demo-script.md` near 1198 to 1203, `04-presenter-cheat-sheet.md` near 237), and S3's beats that retry a hand-off.

## Review steer for Wave 5's join

- **US-13.3.2's four criteria across 60 and 61:** Retry now takes the row off the Xero tab and the Booking reads in Xero on Billing; the waiting Booking shows on both tabs and counts once; a voided or edited invoice is listed until resolved.
- **Panels unchanged underneath:** the store calls (`retryXeroItemNow`, `resolveXeroDivergence`), every `billing-xero-*`, `data-queue-*` and `data-divergence-*` hook, the three export names and props, the Provisional line; the catalogue row compiles.
- **One home each:** the invoice link and the tab address through `financePaths.ts`; no private pill, table or card; `financeCounts.ts` untouched; no registry or router edit.
- **Copy:** no en or em dashes, no "slot", no phase numbers, no NHI; teal the only action colour; tokens only.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (Needs action includes waiting hand-offs, and the tab's number differs by design; the folded Sent toggle; the problem wording and the payer sub line; the Connection rows kept or dropped; search, URL state and page size 50).
- **For the sweep:** the list under Demo guide updates.
- **For the merge:** `screens/finances/xeroTabRows.ts` and its test are new files outside the ones LANES.md lists for 61 (`XeroTab.tsx`, `XeroPanels.tsx` and its test), so the plan maker can add them to LANES.md's Wave 5 Lane A row; and any change this phase found it needs in `router.tsx`, `financePaths.ts`, `financeCounts.ts` (a wrong Xero count or a badge that counts a stuck Booking twice), `registry.ts` (the "Trigger billing failure" message still says "in the billing monitor ... its queue row"), or a gap in 60's Billing side; tests suspected broken (the three specs).
- Status row and phase entry: drift check against `f885f67`; D107, D109, D110, D114, D115 built; names noted from 58 to 60; the names it ships (`xeroTabRows.ts`, `XeroQueueRows`, `XeroDivergenceRows`, `ResolveDivergencePanel`); tests added; `PERSIST_VERSION` unchanged; the quick checks green (D113, no review, screen-proof or checklist run).
