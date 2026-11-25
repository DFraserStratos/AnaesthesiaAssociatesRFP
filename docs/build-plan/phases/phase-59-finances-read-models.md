# Phase 59 · The Finances read models

**Requirements covered:** none own it (groundwork, no unit: D114). It is read from, for the models only:
[US-13.3.1](../../../requirements-board/requirements/stories/US-13.3.1.md) (billing status of each List and Booking),
[US-13.3.2](../../../requirements-board/requirements/stories/US-13.3.2.md) (the fix beside the Booking; Stuck at Xero shows twice) and
[US-08.4.7](../../../requirements-board/requirements/stories/US-08.4.7.md) (find any invoice). 60 builds the first two on this model and 62 the third.
No DM or RV row is closed. No seed change, no `PERSIST_VERSION` bump.
**Answered, built as answered** (owner, 26 November): D112 (lanes, subagents), D113 (test once), D114 (groundwork, no unit), D115 (shared kit; nothing built here), D116 (the no-address failure and Mark resolved's home, a plan default on 60's owner-review list).
**Open questions:** none.

**Depends on:** nothing (58 runs beside it and shares no file).
**Estimated:** 1 session.

**Runs in:** Lane B of the build lanes, Wave 4, beside Lane A's 58: built in the `AnaesthesiaAssociatesRFP-laneB` worktree, committed on `lane/b` with a `59 complete:` commit, and joined onto `master` with 58 at Wave 4's join (quick checks only). [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session. The owner tests 59's results through 60 and 62, after Wave 5's join (`TEST-58-67.md`).

## Goal

The read models the Billing and Invoices tabs stand on, as pure functions with Vitest tests and no UI, in two new files of `aa-prototype/src/domain/billing/` so each Wave 5 lane owns one: **`billingStatus.ts`** (Lane A's, for 60) and **`invoiceState.ts`** (Lane B's, for 62). Billing status covers each Booking's stage, steps, problem reason and fix, bucket, each List's counts, the anaesthetist grouping, filters and search, the problem-List count and the open Xero hand-offs tied to their Lists (D109). Invoice state covers each invoice's kind, owing, state, age and search keys, and the filters. Plus two optional fields on `BillingException` (`resolvedBy`, `resolvedNote`) for Mark resolved (D116). The models take state slices, the store's indexes as Maps and the date as arguments, never the store, and run in one pass at practice scale (about 18,000 Lists).

## Before you start

1. **Drift check** against the plan baseline `f885f67`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-13.3.1,US-13.3.2,US-08.4.7
   ```

   No linked question is open. Re-read anything changed after `f885f67`. If US-13.3.1's List heading or its Problems / In progress / Done / All filters, US-13.3.2's Stuck at Xero shows twice, or US-08.4.7's state, owing or search keys change, stop and tell the user. If any is Retired or Future, stop.
2. **Confirm:** none to wait for (`depends_on` is empty). At the phase start, merge any `58 complete:` commit Lane A already has, as LANES.md's sync step says (58 shares no file with this phase).
3. **Built as answered, no label:** the shapes above (D116's vocabulary and fields, D109's hand-off tie, D114's split). No on-screen caption: there is no screen.
4. **Defaults this phase decides** (each a line on "For the owner's review", and logged in `notes.md` for 60 and 62):
   - **Done** = billed, sent, in Xero, paid in and disbursed, or resolved by hand. A $0 no-charge invoice has no payable, so it needs no disbursement (this reads right where today's monitor reads "Not disbursed": BACKLOG's "$0 no-charge invoice" line, which 60 deletes when its screen uses the model).
   - **In progress** = a billed Booking not yet Done and with no problem; an unbilled Booking on a List not yet billed is In progress too.
   - **Problems** = an open `BillingException`, an open Xero hand-off or journal waiting or alerted, or an open divergence (voided, amended or paid after credit) on the Booking's pair, like the monitor's `MonitorProblem` kinds. A failure resolved by hand is Done.
   - **A cancelled Booking** has nothing to bill: stage `cancelled`, in Done, left out of the List's counts.
   - **Kinds on the Invoices list:** Invoice (standard and additional), Prepayment, Credit note. A credit note's owing is $0 and its state follows its invoice's; prepayment groups awaiting approval are rows with state `awaitingApproval` and no number.
   - **Search is case-insensitive, substring**, over the keys the story names, plus (Billing) hospital as the mock's placeholder says.
5. **Reads beyond the run-build-phase standard list** (split across parallel subagents: one reads the monitor and Xero code, one the ledger and invoice code, one the stories and the mock, each reporting names and signatures; the session decides the shapes):
   - **Mock** ([finances-section.html](../../explorations/finances-section.html)): `#p-billing` and `#billing-table` version C (each row's reason, status, five step cells and fix; each List heading's counts line; "Problems / In progress / Done / All"; the count line "3 Lists with a problem, 2 anaesthetists"), `#p-invoices` (the columns, "Unpaid · 98 days", "340 unpaid · $281,446.20 owing", the search placeholder, the filters). Read for the data each row needs, not the layout.
   - **ROADMAP.md:** D109 (what a stuck List counts as; the badge's unit that 60 builds on this model), D112 (lanes, subagents), D113 (test once), D114 (59 holds no unit), D116 (the code, the vocabulary, the fields); the sequencing rule "59 beside 58".
   - **GAP-ANALYSIS.md:** the verification-log row for 59 (US-13.3.1, US-13.3.2, US-08.4.7 read for the models only). No gap entry.
   - **Catalogue:** the three stories in full (their acceptance criteria are the tests), and [US-08.5.2](../../../requirements-board/requirements/stories/US-08.5.2.md) (billing fails one Booking at a time).
   - **DECISIONS.md:** no ruling to honour beyond CLAUDE.md's determinism rule (the demo clock, never `Date.now()`). **BACKLOG.md:** the "$0 no-charge invoice" monitor line (above); nothing else is closed here.
   - **PROGRESS.md:** the entries of 47 (`contractGroups.ts`) and 53 (`peopleLists.ts`), for the house shape of a pure model with one test per story example. Neither is a dependency.

## Reference

- **The monitor's logic, to reuse the pure core of** (`aa-prototype/src/store/`): `selectors.ts` `billingMonitor`, `MonitorBookingRow`, `MonitorListRow`, `monitorStatusOf`; `billingMonitorView.ts` `problemsByList`, `statusOf`, `MonitorProblem`; `ledgerSelectors.ts` `xeroQueueView`, `openXeroDivergences`, `receivableOutstanding`; `indexes.ts` (`bookingsByList`, `invoicesByBooking`, `pairsByBooking`, `pairByInvoice`, `openQueueIndex`, `openExceptionByBooking`, `openDivergenceByPair`, `creditNoteByOriginal`). `domain/` never imports the store: take the Maps those indexes return as arguments, restate the stage rules over `pairStatusLabel`, and note in `notes.md` which store functions 60 and 62 re-point.
- **Domain to reuse:** `domain/billing/ledger.ts` (`pairStatusLabel`, `isInXero`, `isBookingPair`, `isAaFeePair`), `money.ts` (`toCents`, `formatMoney`), `prepayment.ts` (`prepaymentStatusOf`, `PrepaymentGroup`), `domain/dateDays.ts` (`daysBetween`), `domain/conflicts.ts` (`isBackdropList`), `shared/format.ts` (`surnameOf`). Backdrop invoices (`HINV`, `HSINV`, `RBINV`) are told by id prefix in `store/selectors.ts` `isBackdropInvoice` (credit notes: `isBackdropCreditNote`): the model takes them already filtered out, or tests the same prefixes (say which).
- **Types** (`domain/types.ts`): `BillingException`, `Invoice`, `CreditNote`, `BookingLedgerPair`, `XeroQueueItem`, `XeroDivergence`, `AssignedList`. Exception codes today: `lockMissing`, `runError`, `noContract`, `contractMissing`, `needsPrice`, `noPrimaryProcedure`, `noCounterparty`, `prepaidSplit`, `splitDoesNotFit`, `preflight`, `negativeTotal`, `rejected` (`domain/billing/lock.ts`, `store/billingRun.ts`) and the seed's `deliveryFailed`.
- **Practice scale and tests nearby:** `buildFullScaleDataset(freshAppState(), { todayISO })` and `problemListIds` in `store/fullScale.test.ts` (its "Problems only returns exactly the generated problem Lists" is the test to match); `store/billingMonitorView.test.ts`, `domain/billing/ledger.test.ts`.

## Work items

Parallel subagents for the build (D112), each told its own files: **A** `billingStatus.ts` and its test, **B** `invoiceState.ts` and its test, **C** the `BillingException` fields and the scale test. The session fixes the shapes (item 1) and does the join. Every export is pure, takes plain Maps and records, and carries a JSDoc line naming its story. Names below may be refined; whatever ships goes in `notes.md`.

1. **Fix the shapes first** (the session): a `BillingStatusInput` (authorised Lists, bookings by List, invoices and pairs by Booking, exceptions, open Xero queue items and divergences, patient, anaesthetist and hospital names) and an `InvoiceStateInput` (invoices, credit notes, pairs by invoice, patients, bookings, Lists, anaesthetists, `todayISO`, pending prepayments).
2. **`domain/types.ts`:** on `BillingException` add `resolvedBy?: string` and `resolvedNote?: string`, JSDoc saying a failure resolved by hand has `resolvedAtISO` and no `resolvedPairIds`. Nothing else in the file.
3. **Vocabulary** (`billingStatus.ts`): `PAYER_NO_ADDRESS_CODE = 'payerNoAddress'` with the reason "Not invoiced: the payer has no billing email or postal address" (the mock's BK0051; 60's run imports the code, D116); `BillingFix = 'retry' | 'fixPayer' | 'markResolved'` plus the Xero fixes `'retryNow' | 'resolve'` the mock shows on stuck and changed rows; `problemAdvice(code, message)` returns `{ reason, fix }`: `payerNoAddress` and `noCounterparty` give `fixPayer`; `runError`, `deliveryFailed`, `lockMissing` give `retry`; every other or unknown code gives `retry` with the exception's own message. Any open exception also `canMarkResolved`. A waiting hand-off reads "Attempt N · the Xero sync queue tries again at HH:MM" (`retryNow`, "alert raised" when alerted); a divergence "Changed directly in Xero: Xero shows $X, the engine holds $Y" (`resolve`).
4. **Booking and List status** (`billingStatus.ts`, one pass over Lists, Bookings, pairs and open items): per Booking `stage` (from `pairStatusLabel`, plus `pending`, `failed`, `cancelled`), steps `sent`, `inXero`, `paidIn`, `disbursed` each `done | waiting | flagged | notYet` (sent says emailed or to post), invoice ids, `bucket`, `problem?` (`kind`, `code?`, `reason`, `fix`, `canMarkResolved`, the exception or queue-item id the fix acts on), `resolvedByHand?` (`by`, `note`, `atISO`); per List date, session, hospital, `status` (the monitor's Voided in Xero, Needs attention, Billing, Complete), `counts` (sent, in Xero, paid in, of), `billedAtISO` (the run), `hasProblem`, `bucket` (a Problem if any Booking is, Done if all are). AUTHORISED, non-backdrop Lists only.
5. **Xero ties:** `xeroItemsOnLists(input)` returns `{ byList, unattached }` for the open hand-offs, journals and divergences, each tied through its pair's `bookingId` and `listId` to an authorised List or left unattached (D109: 60's badge counts a stuck List once and the unattached items separately).
6. **Grouping, filter, counts:** `billingGroups(lists, { bucket, anaesthetistId, q })` returns anaesthetist groups in `surnameOf` order (then id), each List's matching Bookings (Problems: only the problem Bookings, the rest countable for "Show all N"); `q` matches patient, invoice number, hospital or anaesthetist and keeps a List whose heading or any Booking matches; `problemListCount` and `billingCounts` (Problems, In progress, Done, All, and "N Lists with a problem, M anaesthetists").
7. **Invoice state** (`invoiceState.ts`): `invoiceRows(input)` gives one row per invoice (standard, additional, prepayment) and credit note: `kind`, payer, patient, Booking, anaesthetist, `raisedISO`, `total`, `owing` (the ledger's rule in cents, never below 0; a credited invoice owes $0), `state` (`unpaid | partPaid | paid`), `ageDays` for an unpaid or part-paid one (`daysBetween(raisedISO, todayISO)`), `delivery`, and lower-cased `keys` (invoice number, payable number such as `AA-2026-0002-P`, case reference, patient, payer, anaesthetist). Input never holds AA fee invoices or pairs (a test feeds an AA fee pair and sees it skipped). Pending prepayment groups come in as an argument and become `awaitingApproval` rows. `filterInvoiceRows(rows, filter, { kind, anaesthetistId, q })` for `unpaid` (the opening filter), `partPaid`, `paid`, `awaitingApproval`, `all`; `invoiceCounts(rows)` ("340 unpaid · $X owing · 4 to approve"); newest first, then id.
8. **Exports.** `export *` lines in `domain/billing/index.ts` only if the files join the barrel (60 and 62 may import by path; then touch nothing there). In `notes.md`: each file's exports, argument bundles and returns, the store indexes that fill each Map, and the store functions 60 and 62 replace.
9. **Tests** (colocated; each story example is a test): `billingStatus.test.ts`: one failed Booking and four billed (Problems shows the failed one only); a payer with no billing email (exception built directly with `payerNoAddress`: reason under the name, fix `fixPayer`); a failure resolved by hand counting as Done; a List whose only issue is a Booking stuck at Xero counting as a problem List with its hand-off tied, an unattached one not; Done for one anaesthetist; surname order; search by patient and invoice number; the $0 invoice Done; the four counts. `invoiceState.test.ts`: $1,000 with $400 received (Part paid, $600 owed); raised 40 days before the demo day and unpaid (Unpaid, 40 days); search by `AA-2026-0002-P` and by a patient with two invoices; AA fee invoices left out; a credit note; Awaiting approval; the opening filter. **Scale test** `domain/billing/financeReadModels.scale.test.ts`: `buildFullScaleDataset(freshAppState(), { todayISO })` with the real store indexes passed in (the one place that wires them), problem Lists equal `full.problemListIds`, invoice rows match the invoice count with backdrop out, and a loose wall-clock bound pins one pass.
10. **Finish.** No screen, store, router, registry or catalogue file. `oneComponentPerJob.test.ts` and `appCopy.test.ts` stay green (reasons carry no en or em dashes, "slot", "swap" or "timesheet"). Quick checks only (D113).

## Demo triggers

None: pure domain with no screen. The triggers 58 re-homes and 60 adds exercise it through the tabs.

PWA: none.

## Out of scope

- Any screen, store action, selector, router, registry or catalogue file; the Billing and Invoices tabs (60, 62); raising `payerNoAddress` in the run, Retry, Fix the payer and Mark resolved's store actions and audit labels (60); the badge and `financeCounts.ts` (58, then 60).
- A seed change, a `PERSIST_VERSION` bump, a shared component or variant (D115), the capture recipes, ATLAS and the demo guide.

## Manual test checklist

The material Wave 5's join walks for the owner's test sheet `TEST-58-67.md`; this phase does not run it (D113). There is no screen: 60 and 62 check the models through their tabs, and the owner sees them there.

- [ ] Vitest: `billingStatus.test.ts`, `invoiceState.test.ts` and the scale test pass; every story example named in item 9 has a test.
- [ ] `domain/billing/` imports nothing from `store/`, `apps/` or `shared/ui` (grep, the scale test excepted: it is the one place that wires the store's indexes); the models take Maps and the date as arguments.
- [ ] `BillingException` has `resolvedBy` and `resolvedNote` as optional fields; `PERSIST_VERSION` is unchanged and the seed is untouched.
- [ ] `notes.md` lists each export, what it returns and what 60 and 62 must pass and re-point.

## Demo guide updates

None: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS. Nothing for the sweep from this phase. Keep `demoGuideSync.test.ts` green.

## Review steer for Wave 5's join

Wave 5's join reviews all ten phases at once; for 59, steer the reviewers at:

- **Purity.** No model under `domain/billing/` (the scale test aside) reads the store, the clock or `Date.now()`; the age comes from `todayISO`; the indexes arrive as arguments.
- **Reuse.** The stage comes from `pairStatusLabel` and owing from the ledger's rule, not a second copy; 60 and 62 call the models and delete the store logic they replace, rather than keep both.
- **The buckets.** Done includes a failure resolved by hand (no `resolvedPairIds`) and a $0 invoice; a stuck Booking is a problem under its List and counted once (D109); a retried exception (with `resolvedPairIds`) is a billed Booking, not a hand resolution.
- **AA fees out.** No AA fee invoice or pair reaches the invoice rows.
- **Scale.** One pass over the Lists and invoices; no per-Booking scan of a whole collection.

## PROGRESS.md updates

- **For the owner's review:** the defaults of Before you start 4 (Done, In progress and Problems as defined; a cancelled Booking; the $0 invoice; the kinds and credit notes' owing; search fields); the reason-and-fix wording of the vocabulary, including the new code's.
- **For the merge:** whether the barrel was edited (which lines); any test that reads today's monitor logic and may need 60's re-pointing. **For the sweep:** nothing.
- Status row and phase entry: drift check against `f885f67`; D109, D112 to D114 and D116 built as answered; the names shipped for 60 and 62 (the two files and every export, `PAYER_NO_ADDRESS_CODE`, `xeroItemsOnLists`, `billingGroups`, `problemListCount`, `invoiceRows`, `filterInvoiceRows`, the two `BillingException` fields); tests added; `PERSIST_VERSION` unchanged. Handoffs: 60 imports `billingStatus.ts` (and raises `payerNoAddress`, writes `resolvedBy` and `resolvedNote`); 62 imports `invoiceState.ts`.
- Decisions log: Done, In progress and Problems as defined above, in the progress entry only (no `docs/DECISIONS.md` ruling).
