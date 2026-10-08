# Phase 16 · AA fee as its own monthly invoice

**Requirements covered:**
[EP-10](../../../../requirements-board/requirements/stories/EP-10.md),
[FT-10.3](../../../../requirements-board/requirements/stories/FT-10.3.md) (Verify; notes now carry Greg's 2026-10-02 view),
[US-10.2.1](../../../../requirements-board/requirements/stories/US-10.2.1.md)
(still Contradicts at 60e2d1e; its text now says the released payable enters the next
[weekly payment run](../../../../requirements-board/requirements/stories/US-10.2.7.md), US-10.2.7,
Proposed, which is Phase 39a's: this phase builds only the release rule),
[US-10.3.1](../../../../requirements-board/requirements/stories/US-10.3.1.md) (Verify; notes now carry Greg's view),
[US-10.3.2](../../../../requirements-board/requirements/stories/US-10.3.2.md),
[US-10.3.3](../../../../requirements-board/requirements/stories/US-10.3.3.md) (Verify; the fixed schedule is for AA's accountant),
[US-09.1.1](../../../../requirements-board/requirements/stories/US-09.1.1.md),
[US-09.3.1](../../../../requirements-board/requirements/stories/US-09.3.1.md)
(Confirmed; **Contradicts**, unchanged at 60e2d1e: the Xero contact Name holds the patient's or
individual payer's real name, against "rather than by name" and OQ-30's "no personal information in
Xero");
[DM-26](../analysis/domain-model-delta.md#dm-26);
[RV-07](../analysis/reverse-check.md) (AA service fee netted from the payable).
Answered and built: [OQ-02](../../../../requirements-board/requirements/questions/OQ-02.md)
(owner decision **D1**: a monthly fee invoice per anaesthetist, fixed charges plus $ per BCTI) and
[OQ-30](../../../../requirements-board/requirements/questions/OQ-30.md) (no personal
information in Xero: built in full here, contact names included).
[OQ-60](../../../../requirements-board/requirements/questions/OQ-60.md) is still
Open on the board (owner: AA's accountant), but its 2026-10-02 meeting update gives Greg's view, which
this phase builds: **part 3, never netted** ("Under trust law it mustn't. So it's always a separate
invoice and it's paid into a separate bank account") is built as a rule with no switch; **part 2, only
paid invoices count** (so a Booking moved between anaesthetists is not charged twice) is built as the
count's rule, switchable in one place until the accountant confirms; **part 1, the fixed schedule**,
is still unknown (Greg does not know it), so a labelled sample is seeded.
Still open, built as noted: [OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md)
(BCTI granularity: one per receivable invoice, the plan's one provisional point, kept beside OQ-60 for
the accountant; its 2026-10-07 update leaves it open and adds only the GST rule below).
Applied here, not covered: [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md)
(Confirmed 2026-10-07: every price is held excluding GST and GST goes at the foot of the invoice), so
the AA fee settings hold their amounts ex GST and the "amounts include GST" toggle is gone (work
items 11, 12, 15 and 16): the US-10.3.1 example's $700 is the fee before GST.
Left this phase: US-09.2.1 (re-graded Matches; the webhook amounts still change with step 1, but no
work is planned against it), OQ-19 (answered: an AA-side error is credited and reissued, which is
Phase 39's concern; anything else stays outstanding, which is today's behaviour) and
[OQ-47](../../../../requirements-board/requirements/questions/OQ-47.md) (now **Proposed**: the weekly
ISO-week payment cycle, US-10.2.7, which Phase 39a builds; this phase names no payment day, week or
cycle, and its monthly fee run is a separate office action for a chosen month).
**Depends on:** Phases 15a and 15b, and through them 14 and 15: the screen-contextual trigger
registry, `useDemoTriggerContext` and the re-homed "Payment received (webhook)" triggers (14); Card
becomes Booking, so every `cardId`, `casesForCard`, "Card" string and audit entity type named below is
its post-15 Booking equivalent (15); the warning routine, the `appSettings` slice and the Admin to-do
list (15a, both sessions); and Copy and photo capture out of the prototype, with an assigned List's
state renamed DRAFT to ACTIVE (15b; any S3 Authorise step below reads ACTIVE, never DRAFT). 15a and
15b run first so the "After 16" milestone has the warnings and the removals. This phase registers no
warning rule.
**Estimated:** 2 sessions. Session 1 is step 1 (fee removal), plus the two Xero simulator items that
share its files and its reseed (work items 9 and 10: InvoiceNumber, Reference and paid date stored on
the Xero records, and no personal information in Xero, contact names included), re-greened and handed
back on its own. Session 2 is step 2 (fee settings, the BCTI count and the monthly fee invoice run)
plus the review pass and the PROGRESS entry. Session 2 is the heavier one; if session 1 runs out of
room, item 10 and then item 9 open session 2.

## Goal

The money story the catalogue now tells, in two steps that each leave the app green and demoable.

**Step 1: the payable is the gross amount.** Stop netting the illustrative 5% AA fee off the ACCPAY.
The payable equals the receivable, and a payment releases a payable for exactly the amount received
(US-10.2.1, which merged US-10.2.2): a half payment of $152.38 releases $76.19, not 95% of it. The
released payable still goes out through today's manual Run payables; the weekly ISO-week payment
cycle that US-10.2.1 now names as the next payables run (US-10.2.7, Proposed, OQ-47) is Phase 39a's,
and nothing here names a payment day or week. The
seeded billing history is rebuilt on that basis, the Xero simulator loses its fee block, the web
Payments table loses its "AA fee" and "Net to you" columns, and the S3 figures are re-baselined
($152.38 is now what Dr Souter is paid; the $7.62 and $144.76 figures disappear). While the Xero
simulator is open, every Xero record stores the engine's invoice number in `InvoiceNumber` and the
case reference in `Reference` (US-09.1.1), and the ACCREC stores the date it was paid in full (the
BCTI count needs it). **No personal information in Xero** (US-09.3.1, OQ-30 answered): patient and
individual billable-party contacts carry only the hidden internal ID and a neutral label built from
it, never a real name, in the handoff, the seeded history and every simulator view (Contacts, the
Invoices list's Payer column, the ACCREC card, the money-flow card). Organisation contacts (hospitals,
insurers, surgeons, groups) and the anaesthetist payee keep their names. The patient is named only in
the presenter's "Linked Billing Engine case" callout, which reads the billing system, not Xero. The
stale NHI callout and the Contacts help text state the settled rule.

**Step 2: AA's fee is its own monthly invoice (D1, OQ-02 answered).** An Admin **AA fee settings**
page holds the fixed fee items (several may make up the fixed fee) and the charge per BCTI
(US-10.3.3). An Admin **AA fee invoices** screen has a month picker and a **Run monthly fee
invoices** button that raises one AA-FEE invoice to each active anaesthetist for the month (FT-10.3,
US-10.3.1): the fixed items plus the per-BCTI charge times the number of their BCTIs paid that
month, for example $500 + $5 x 40 = $700. Every amount in the settings is held excluding GST and
GST goes at the foot of the fee invoice (US-05.2.7, the system-wide rule Greg set on 2026-10-07), so
the example's $700.00 is the fee before GST and the invoice reads $700.00 + GST $105.00 = $805.00.
Each fee invoice has its own `AA-FEE-2026-####` number,
is its own billing case, and has a simulated Xero ACCREC against the anaesthetist's existing Xero
contact, with no ACCPAY behind it (it is AA charging its own fee, not money passing through). It is
always a separate invoice, paid into AA's own bank account and never netted against the
anaesthetist's payables (Greg, 2026-10-02: trust law forbids it); no code path deducts it from a
payable or a payables run. The invoice snapshots the settings it used, so a rate change applies to the
next run only.

**The BCTI count has one home.** BCTIs for an anaesthetist in a month are counted by one pure,
tested function over one list of BCTI records, and nothing else counts them. Its rules, stated in one
comment beside it: one BCTI per receivable invoice (its ACCPAY, the same value as the receivable: the
transcript's "per transaction"); each counted once, against the anaesthetist who did the procedure
(OQ-60's recommendation); and **only once paid** (Greg's 2026-10-02 view, for AA's accountant to
confirm), counted in the month its receivable is paid in full, so a late payment is charged in the
month it lands and no paid BCTI is missed or charged twice. The paid-only rule is one switch in that
function (off, it counts by issue month). The catalogue also says "one BCTI per procedure" (US-09.1.4
note, OQ-29), which cannot hold together with "the same value as its receivable" for an invoice with
several Procedures; that granularity point stays open beside OQ-60 for the accountant. Later phases
that add invoices (22, 36, 38b, 39, 39b) feed the same record list and keep this function the only
count.

Admin and a new web **Accounts → AA fees** tab show each fee invoice paid or unpaid (US-10.3.2).
This is the corrected payables story for the "After 16" milestone.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and open questions against the plan's baseline,
   catalogue commit `60e2d1e` (rename-aware; never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff EP-10,FT-10.3,FT-10.2,US-10.2.1,US-10.3.1,US-10.3.2,US-10.3.3,US-09.1.1,US-09.1.4,US-09.3.1,US-15.0.6,US-08.4.3,US-08.3.1,US-10.2.6,US-10.2.7,US-05.2.7,OQ-02,OQ-60,OQ-29,OQ-30,OQ-47
   ```

   Read the hunks (if any) for EP-10, FT-10.3, FT-10.2, US-10.2.1, US-10.3.1, US-10.3.2, US-10.3.3,
   US-09.1.1, US-09.1.4 (the BCTI note), US-09.3.1, US-15.0.6 (NHI never sent), US-08.4.3 (the `-P`
   suffix rule this phase relies on), US-08.3.1 (ledger pair), US-10.2.6 (period BCTI approval, Phase
   39a), US-10.2.7 (the weekly payment cycle, Phase 39a), US-05.2.7 (prices held ex GST, applied to
   the fee settings), OQ-02, OQ-60 (and its "Meeting update"), OQ-29, OQ-30, OQ-47, the meeting notes
   `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` #1 and #36 and
   `requirements-board/requirements/notes/2026-10-07-aa-meeting-with-greg.md` #32, and the
   domain-model lines on the AA fee (the "Payment to anaesthetist implied a fee deducted" row, the
   "Fee schedules quoted GST inclusive, exclusive or both" row, the "Payment day and cycle not
   settled" row, "AA fee invoices ... are separate ledger items, raised by a monthly fee invoice
   run", the BCTI line above it, the "NHI and other PII never go to Xero" line, and the glossary
   entry).

   At plan time (2026-10-08, `3d3a18c..60e2d1e`), the changes that touch this phase were: US-10.2.1
   now links the released payable to the [weekly payment run](../../../../requirements-board/requirements/stories/US-10.2.7.md)
   (US-10.2.7, new, Proposed) and names Greg's weekly cycle as the proposed solution; OQ-47 moved from
   Open to **Proposed** (owner AA's accountant); US-10.2.6 points at the same cycle; OQ-29 gained a
   2026-10-07 update (still open; GST treatment and layout set on the Contract, every price held ex
   GST); and US-05.2.7 (prices held ex GST, GST at the foot) was confirmed. EP-10, FT-10.2, US-08.3.1,
   US-09.1.1, US-09.1.4 and US-09.3.1 changed only in artifact and related links. OQ-02, OQ-30, OQ-60,
   FT-10.3 and US-10.3.1 to US-10.3.3 did not change. The plan already reflects all of this; diff only
   for anything after `60e2d1e`.
2. If an item changed, re-read it in full and adjust the work items before building. If an item is
   now Retired or Future, drop it from this phase and say so in the PROGRESS entry. A new item on
   this surface joins this phase only if it is small and Confirmed; otherwise record it for Phase 36
   or 39a.
3. **If OQ-60 has been answered on the board since 60e2d1e**, build the answer. The plan already
   builds Greg's view (never netted; only paid BCTIs count); if the accountant confirms it, only the
   comment beside `bctisFor` and the Admin caption change (drop "being confirmed"). If the answer
   counts every issued BCTI, paid or not, flip the paid-only switch in `bctisFor` (work item 12) and
   re-baseline the seeded fee history and the S3 Beat 4 figures; nothing else changes. If it gives
   the fixed schedule or fixed items per anaesthetist, change only the settings seed and shape (work
   items 11 and 15). If the answer is "the fee nets against payables", stop and tell the owner: that
   contradicts FT-10.3 ("distinct from any procedure's receivable and payable"), Greg's trust-law
   statement and step 1. If OQ-29 or AA's accountant has settled BCTI granularity as **one per
   procedure**, change only `bctiRecords` and re-baseline the `$700` seed trigger, S3 Beat 4 and the
   cheat sheet in the same session.
4. **Open points are built as follows.** OQ-60 part 3 (never netted): a rule, no switch. OQ-60 part 2
   (only paid BCTIs count): built as `bctisFor`'s rule, counting in the month the receivable is paid
   in full, behind one switch, and named "being confirmed with AA's accountant" in one code comment
   and the Admin fee screen's caption, nowhere else. OQ-60 part 1 (the fixed schedule): unknown, so
   seed demo-plausible items labelled as a sample (work item 15), held ex GST (US-05.2.7). OQ-29: one
   BCTI per receivable invoice, stated in the same comment. OQ-47 (Proposed: the weekly ISO-week
   payment cycle, US-10.2.7) is Phase 39a's and is not built here: the fee run is a monthly office
   action for a chosen month, and nothing in this phase's copy names Tuesday, Wednesday, the 20th, a
   week number or a weekly cycle.
5. Confirm Phases 14, 15, 15a (both sessions) and 15b are done: the registry
   (`src/shared/demoTriggers/`, entries in `registry.ts`) and `useDemoTriggerContext` exist, the
   "Payment received (webhook)" and "Automated jobs" triggers are re-homed (at plan time they are
   `payment-full`, `payment-half` and `payment-replay` on `/admin/invoices/:invoiceId` and
   `/demo/xero/invoices/:accRecId`, `run-reconciliation-poll` / `run-archive-job` on the Billing
   monitor and Xero sim, and the PWA's `pwa-payment-full` / `pwa-payment-half`; note any difference),
   the Booking rename has landed, 15a's warning routine, `appSettings` slice and Admin to-do list are
   in place, and 15b has removed Copy a Booking and renamed an assigned List's DRAFT to ACTIVE. Note
   the current `PERSIST_VERSION` (16 at plan time,
   after 15a session 1; 15a session 2 and 15b may have bumped it).
6. Record the result (changed items, OQ-60 and OQ-29 status, where 14 re-homed the webhook trigger)
   in the PROGRESS entry.

## Reference

**Design (convention 17).** [Design Language.dc.html](../../../design/Design%20Language.dc.html) is
the token source: teal `#0D6E63` for "Run monthly fee invoices", "Save settings" and "Record fee
payment", pill radius 999 for Paid and Unpaid pills (semantic success and neutral tokens, never the
six schedule status colours), Spline Sans Mono with tabular-nums for every amount, count and number,
crimson nowhere except the existing nav and avatars.
[Web Dashboard.dc.html](../../../design/Web%20Dashboard.dc.html) is the layout reference for the web
app's panels and tables; the Accounts sub-tab extends its anatomy. No mockup covers Accounts, the
Billing monitor, the new Admin fee screens or the Xero simulator, so extend the existing screens' own
patterns (the Billing monitor's panels and `tableChrome.ts`, Master data's "Xero & archiving"
settings card), do not invent a new visual language.

**Catalogue and analysis.**
- Catalogue items above, plus [US-08.4.3](../../../../requirements-board/requirements/stories/US-08.4.3.md)
  (unique numbers; the payable carries the receivable's number with `-P`),
  [US-09.1.4](../../../../requirements-board/requirements/stories/US-09.1.4.md)
  (the BCTI note), [US-15.0.6](../../../../requirements-board/requirements/stories/US-15.0.6.md)
  (NHI never sent), [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md)
  (every price held ex GST, GST at the foot of the invoice; applied to the fee settings),
  [US-10.2.7](../../../../requirements-board/requirements/stories/US-10.2.7.md) (the weekly payment
  cycle, Proposed: read for context only, Phase 39a builds it), the payable-release spots on the
  flow diagrams ([AR-24](../../../../requirements-board/requirements/artifacts/AR-24.md) regions
  `payable-release` and `xero-pair`;
  [AR-25](../../../../requirements-board/requirements/artifacts/AR-25.md) regions `payable-release`,
  `accrec-accpay` and `store-ids`; its `payment-cycle` region is 39a's), the meeting notes `requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` (#1, #14,
  #41, #54) and `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` (#1: OQ-60 discussed, Greg's
  view on parts 2 and 3; #34: the working rule that the prototype chooses where nothing is said;
  #36: for AA's accountant) and `requirements-board/requirements/notes/2026-10-07-aa-meeting-with-greg.md`
  (#32: all prices held GST exclusive), and
  [domain-model.md](../../../../requirements-board/requirements/domain-model.md) (AA fee rows, the
  GST-exclusive and payment-cycle rows, the "NHI and other PII never go to Xero" line).
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Summary theme 7 ("Money model: fee, payables, ledger,
  GST"), the "Structural first" bullet naming US-09.3.1 Xero contact names as a cheap early fix, the
  "Uncertainty" bullet on OQ-60 and OQ-47, and the S3, S4 and S5 demo-impact bullets; per-gap detail
  in [epics/EP-10.md](../epics/EP-10.md) (read the header note first; FT-10.3, US-10.2.1, US-10.3.1 to
  US-10.3.3) and [epics/EP-09.md](../epics/EP-09.md) (header note, US-09.1.1, and US-09.3.1, now
  Contradicts: the contact-name fix).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md#dm-26) DM-26 (and DM-22 for the
  BCTI cardinality note and the ledger this phase does not build);
  [analysis/reverse-check.md](../analysis/reverse-check.md) RV-07.
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) section 4 (money
  pipeline), [prototype-map-admin.md](../analysis/prototype-map-admin.md) section 7 (Billing
  monitor) and the Master data section, [prototype-map-apps-mobile-web.md](../analysis/prototype-map-apps-mobile-web.md)
  (Accounts), [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) 5.1 and
  5.2 (Control Panel payment card, Xero simulation).
- PROGRESS.md Decisions log: **2026-07-29 "Xero money flow and illustrative AA service fee"** (this
  phase supersedes it) and 2026-07-24 Phase 10 reading (2) `D-payee-amount` (payable equals the
  collection; this phase restores it as the catalogue rule, not a reading). Also read 2026-07-22
  "Fourth external plan review" #5 (patient and billable-party contacts are individual contacts the
  archive job retires: kept) and 2026-07-28 "Xero invoice pairs are routed, read-only drill-downs"
  (patient identity only in the separated "Linked Billing Engine case" panel: kept, and now the only
  place a patient is named on the Xero surface).

**Code entry points (paths under `aa-prototype/src/`, names as at the snapshot).**
- Fee maths to remove: `domain/billing/agencyFee.ts` (`AA_SERVICE_FEE_RATE`, `aaServiceFeeFor`),
  `agencyFee.test.ts`, the re-export in `domain/billing/index.ts:7`.
- Types: `domain/types.ts` `Invoice` (~662, `raisedAtISO`), `BillingCase` (~697), `BillingReceipt`
  (~742), `XeroContact` (~768, `name` holds the patient's real name today), `XeroAccRec` (~779, no
  number, reference, paid date or kind today), `XeroAccPay` (~790, `grossAmount`, `serviceFeeRate`,
  `serviceFeeAmount`, net `amountPayable`), `PaymentIn` (`source: 'webhook' | 'poll'`),
  `DemoSettings` (home of `contactArchiveInactivityDays`, demo-only knobs).
- App settings (Phase 15a, DM-31: DemoSettings is the wrong home for product parameters):
  `AppSettings` in `domain/warnings/types.ts` (~88, `warningRules` only today),
  `defaultAppSettings()` in `domain/warnings/settings.ts`, the seed's `appSettings`
  (`domain/seed/index.ts` ~463), `resetDomainState` restoring it (`store/mutate.ts` ~233) and the
  persist merge's one second level for `appSettings` (`store/appStore.ts` ~205).
- Store: `store/xeroHandoff.ts` `payerContactSpec` (~57-68: `name` from
  `masters.patients[id].name` / `masters.billableParties[id].name`, the US-09.3.1 defect),
  `handoffCase` (~153; ACCPAY built from `aaServiceFeeFor` at ~234, audit `xero.pairCreated` ~270,
  module-private `resolveContactInto` ~81, payee key `anaesthetist:<reg>`);
  `store/paymentActions.ts` `receivePayment` (~78; pro-rata
  `proRataAuthorised`, re-exported from `store/index.ts`); `store/payablesActions.ts`
  `payablesDue`, `runPayables`, `disbursePayable`; `store/reconciliationPoll.ts`;
  `store/archiveActions.ts`; `store/demoSettingsActions.ts` (`setArchiveWindowDays`, the pattern for
  an audited settings write); `store/mutate.ts` `ID_FORMATS` (~61) and `resetDomainState` (~218);
  `store/appStore.ts` `AppState.billing`, `freshAppState`, `PERSIST_VERSION` (~130).
- Selectors: `store/selectors.ts` `openAccRecs` (~241), `accpayInvoicesFor` (~649),
  `gstActivityFor`, `paymentHistoryFor` (~763, `serviceFeeAmount = received - authorised` at ~804).
- Seed: `domain/seed/history.ts` `buildHistory` (Dr Souter only, `H` id namespace, payee contact
  `XCH01`, `resolveContact` and `payerName` ~152-176 naming patient and guardian contacts, ACCPAY at
  net ~265, raised and paid dates per row ~101-118: paid rows pa04 and pa05 in May, pa03 in June,
  pa01 and pa02 in July), `domain/seed/billing.ts` `buildSeedBillingSlice` (pre-payment pair BC0001,
  `cpName` ~154 and the payer contact ~199), `domain/seed/patients.ts` `BILLABLE_PARTIES` (BP0001
  guardian Hana Park, BP0002 Aria Skin and Laser Clinic), `domain/seed/cast.ts` `ANAE` (14
  anaesthetists).
- UI: `apps/admin/screens/BillingMonitorScreen.tsx` (Payables run panel ~124,
  `data-shot billing-payables-run`); `apps/admin/screens/InvoiceDocument.tsx` (money-state chips
  ~188, Xero rail `XeroReference` ~319); `apps/admin/screens/MasterData.tsx` (`XeroArchivingView`
  ~476, the settings-card pattern; its entity nav is local state, not a URL, which is why the fee
  settings get their own route); `apps/admin/AdminApp.tsx` (`sectionForPath`: any
  `/admin/billing/...` path keeps the Billing nav active); `apps/admin/routes.tsx`
  (`AdminBillingRoute` ~193) and `router.tsx` (~102, `<Route path="billing">`);
  `apps/web/screens/AccountsScreen.tsx` (`AccountsSubTab`, `PaymentsTable` ~165-235) and
  `apps/web/routes.tsx` (`ACCOUNTS_SUB_TABS` ~28, `WebAccountsRoute` ~130);
  `apps/demo/DemoXero.tsx` (NHI `Callout` ~56-61 `shot="xero-nhi-policy"`, `ContactsTable` help
  text ~98-102 and Name cell ~117, Invoices list Payer cell ~189, the engine-link callout ~346-364
  (the one place the patient is named, from the billing system), money-flow `from` ~373, ACCREC
  "Payer" meta ~407, `PairDetail` "Simulate payment and payout", `AccRecCard`, `AccPayCard` fee box
  `data-testid aa-service-fee`, `MoneyFlowCard` copy, `Callout` tones `warn | info` ~655),
  `apps/demo/xeroPairView.ts` (`contactView` ~58 passes `name` through, `patientName` kept under
  `engine` ~101, `billNumber` derived as `${invoiceNumber}-P` ~133, fee fields), `apps/demo/DemoControlPanel.tsx`
  (S3, S4 and S5 scenario text).
- Triggers: `src/shared/demoTriggers/registry.ts` (Phase 14). It imports from `src/store` and
  `src/domain` only, never `src/apps/*` or `src/shell/*`; use seed constants (`ANAE.rutherford`,
  `ANAE.souter`) where an entry is seed-scoped.
- Tests that assert the fee today: `domain/billing/agencyFee.test.ts`, `store/xeroHandoff.test.ts`
  (~70), `store/paymentActions.test.ts`, `store/payablesActions.test.ts`, `store/dashboard.test.ts`
  (~117-122), `store/seedBilling.test.ts`, `store/xeroNhi.test.ts` (must keep passing),
  `apps/demo/xeroPairView.test.ts` (~52-58), `apps/demo/DemoXero.test.tsx` (~45, ~85 `$144.76`),
  `apps/web/screens/AccountsScreen.test.tsx`, `visual/xero-pair.spec.ts` (~61 fee box, ~85 payment
  row). Tests or specs that read a patient's or guardian's name off a Xero contact or row (grep
  `DemoXero.test.tsx`, `xeroPairView.test.ts`, `archiveActions.test.ts`, `seedBilling.test.ts` and
  `visual/` for seeded patient names such as Riley, Park or Holt) change with work item 10.

## Work items

### Step 1 · the payable is the gross amount (session 1)

1. **A pure payable-release rule** (convention 9). Add `src/domain/billing/payableRelease.ts` with
   `payableReleasedFor(receivedCumulative, amountPayable)` returning
   `roundToCents(min(receivedCumulative, amountPayable))`, guarding zero and negative input. Export it
   from `domain/billing/index.ts`. Vitest: full payment releases the whole payable; half of $152.38
   releases exactly $76.19; three partials ($50.00, $50.00, $52.38) release exactly each amount
   cumulatively; an over-receipt clamps at the payable; zero releases zero. Satisfies US-10.2.1
   ("a part payment releases a payable for exactly the amount received; the remainder stays
   outstanding on the receivable").
2. **Remove the netting.** Delete `domain/billing/agencyFee.ts` and `agencyFee.test.ts` and the
   re-export. In `domain/types.ts` drop `grossAmount`, `serviceFeeRate` and `serviceFeeAmount` from
   `XeroAccPay` and re-document `amountPayable` as "equals the paired ACCREC's amountDue (FT-10.3:
   AA's fee is its own monthly invoice, never deducted here)". In `store/xeroHandoff.ts` build the
   ACCPAY with `amountPayable: invoice.total` and drop the fee fields from the `xero.pairCreated`
   audit `after`. Rewrite the module comments in `xeroHandoff.ts`, `paymentActions.ts` and
   `payablesActions.ts` that describe the fee. Satisfies EP-10 ("paying a receivable in full
   releases the matching payable in full") and the RV-07 rework.
3. **Release exactly the amount received.** In `receivePayment` replace the `proRataAuthorised`
   call with `payableReleasedFor(newReceived, accPay.amountPayable)`, keeping the cumulative model,
   the idempotency key-set, the ACCPAY DRAFT to AUTHORISED flip and the `xero.accpayAuthorised`
   audit. Remove `proRataAuthorised` and its `store/index.ts` re-export (update its test imports in
   `paymentActions.test.ts` and `payablesActions.test.ts`). `runPayables` and `disbursePayable`
   keep paying `amountAuthorised - amountDisbursed`; `fullyPaidOut` now compares against the gross
   payable, which is correct as is. Satisfies US-10.2.1.
4. **Reseed the billing history.** In `domain/seed/history.ts` and `domain/seed/billing.ts` build
   every seeded ACCPAY with `amountPayable = total`; paid accounts authorise and disburse the full
   total, and their `Disbursement` rows carry the full total. The seeded pre-payment pair (BC0001)
   likewise. **Bump `PERSIST_VERSION`** by one (this bump also covers items 9 and 10 if they land in
   session 1). Update `store/seedBilling.test.ts` and add an invariant test: for every seeded pair,
   `accPay.amountPayable === accRec.amountDue` and
   `case.authorisedAmount === min(case.receivedAmount, amountPayable)`.
5. **Payment history without a fee.** In `store/selectors.ts` `paymentHistoryFor`, drop
   `serviceFeeAmount`, rename `netPayable` to `releasedAmount` (the case's `authorisedAmount`), keep
   the status logic. Update `store/dashboard.test.ts` so the invariant becomes
   `releasedAmount === grossReceived` for a fully paid row.
6. **UI and copy, step 1.**
   - `apps/web/screens/AccountsScreen.tsx` `PaymentsTable`: columns become Date received, Invoice,
     Patient, Payer, **Received by AA**, **Released to you**, **Paid to you**, Status. Replace the
     "illustrative AA service fee is deducted" caption with: "Everything AA receives for an invoice is
     released to you in full. AA's own fee is invoiced to you monthly." (step 2 turns "invoiced to you
     monthly" into a link to the AA fees tab).
   - `apps/demo/DemoXero.tsx`: remove the `aa-service-fee` box from `AccPayCard`; the ACCPAY money
     flow card reads "Simulated payable to the anaesthetist. This record tracks the full amount AA will
     disburse."; the `MoneyStat` "Net payable" becomes "Payable". `apps/demo/xeroPairView.ts` drops
     the fee fields from `accPay`.
   - The re-homed "Payment received (webhook)" triggers (`payment-full` / `payment-half` in
     `src/shared/demoTriggers/registry.ts`, or wherever Phase 14 put them): the result message states
     the released amount in one line, for example "Webhook for XR0003: $76.19 received, the paired
     ACCPAY is authorised for exactly $76.19.", and the description drops "proportionally".
   - `BillingMonitorScreen` Payables run copy: "A payable authorises for exactly what its ACCREC has
     received."
   - `apps/admin/screens/InvoiceDocument.tsx` money-state chips are unchanged (they already read the
     case), but check the "Part disbursed" chip against a half payment.
7. **Tests and shots for step 1.** Update `xeroHandoff.test.ts` (payable equals amount due, no fee
   fields), `paymentActions.test.ts` (a half payment authorises exactly half; two partials sum to the
   receivable; webhook then poll is still a no-op), `payablesActions.test.ts` (successive partials pay
   exactly what was received each run; fully paid out at the gross), `xeroPairView.test.ts` (S3 nib
   pair: `totalPayable` 152.38, no fee), `DemoXero.test.tsx` (the settlement message shows $152.38; no
   fee box), `AccountsScreen.test.tsx` (new columns), and `visual/xero-pair.spec.ts` (remove the fee
   box assertion; the payment row shows $152.38 received, released and paid). Case-insensitive grep
   of `src` and `visual` (`grep -riE`) for
   `serviceFee|agencyFee|AA_SERVICE_FEE|proRata|net to you|net payable|illustrative AA|authorised proportionally`:
   zero hits (`apps/admin/util.ts`'s unrelated "proportional grid" is why the bare word is not in
   the pattern).
8. **Re-green step 1 and patch the step-1 beats** (after items 9 and 10 if they fit in session 1).
   `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`, all green. Patch the demo
   guide for step 1 (see "Demo guide updates", step-1 rows) so the guide is never stale if the phase
   pauses here. **Stop point:** tell the user step 1 is green so they can commit it before session 2.

### Xero records: identifiers, paid date and no personal information (session 1 if room, else opens session 2)

9. **InvoiceNumber, Reference, issue date and paid date on every Xero record** (US-09.1.1 acceptance
   criterion "Invoice identifiers"; the paid date feeds the BCTI count). Add `invoiceNumber`,
   `reference` and `issuedAtISO` to `XeroAccRec` and `XeroAccPay`, `paidAtISO?` to `XeroAccRec`, and
   `anaesthetistId` to `XeroAccPay` (the payee at handoff: today the List's anaesthetist; Phase 32a's
   doer rule updates it before handoff, and Phase 41 updates only the payable half of a moved
   prepaid Booking (OQ-70), so a moved Booking is never counted twice). Add `kind: 'procedure' | 'aaFee'` to
   `XeroAccRec` (required, so the compiler finds every creator; step 2 adds the `aaFee` creator). At
   handoff the ACCREC gets `invoiceNumber = invoice.invoiceNumber` and the ACCPAY `${invoiceNumber}-P`
   (US-08.4.3); both get `reference = invoice.caseReference` and `issuedAtISO` from the demo clock
   (`clockISO`). `receivePayment` stamps the ACCREC's `paidAtISO` with the completing `PaymentIn`'s
   `atISO` when cumulative receipts first reach `amountDue` (webhook or poll alike; a replay never
   moves it). Seeds set the same fields (history rows use their `raisedISO`, and paid rows their
   `paidAtISO`; a `missedWebhook` row stays unpaid until the poll catches it). `xeroPairView.ts` reads
   the stored fields instead of deriving them. In `DemoXero.tsx`, both record cards show labelled
   **InvoiceNumber** and **Reference** meta items (`data-shot="xero-invoice-identifiers"` on the
   ACCREC's pair of items), with one caption on the pair: "InvoiceNumber is the unique key hospitals
   and insurers quote on remittances, so automated remittance matching keys on it. Reference is for
   internal tracing only; Xero does not enforce its uniqueness." The Admin invoice rail
   (`InvoiceDocument.tsx` `XeroReference`) already matches the catalogue's admin-invoice-xero-ids
   image (the verified gap needs no change there); only point it at the stored numbers instead of
   deriving `-P`. Tests: handoff stores every field; the `-P` suffix; Reference equals the case
   reference; `issuedAtISO` equals the clock; `paidAtISO` is set once, by the completing partial, and
   not by a replay; `xeroNhi.test.ts` still passes. The "Duplicate-invoice-number-prevention" callout
   (`shot="xero-duplicate-number-policy"`) stays as it is: US-09.4.2 is still Open, which is what it
   says (the US-09.1.1 gap entry's minor note on it is not this phase's; Phase 37 covers US-09.4.2).
10. **No personal information in Xero** (US-09.3.1, Confirmed, re-graded Contradicts; OQ-30
    answered: "No PII in Xero").
    - **Contact names.** One pure helper, `xeroIndividualContactName(type, hiddenId)` in new
      `src/domain/xeroContact.ts`, returns the neutral label for an individual contact: "Patient
      PT0001" for a patient, "Billable party BP0001" for a billable party (the hidden internal ID,
      which is already the ContactNumber; never a name, NHI, phone, email or address). The rule is by
      Xero contact type: every `patient` and `billableParty` contact (the individual contacts the
      archive job retires) gets the label; `organisation` contacts (hospitals, insurers, surgeons,
      groups, the anaesthetist payee) keep their names. Use it in `payerContactSpec`
      (`store/xeroHandoff.ts`), in `buildHistory`'s `payerName` (`domain/seed/history.ts`) and in
      `cpName` (`domain/seed/billing.ts`), so the handoff, the seeded history and the seeded
      pre-payment pair agree. Covered by the step-1 `PERSIST_VERSION` bump if it lands in session 1,
      else by its own.
    - **Simulator views.** Contacts tab Name, the Invoices list's Payer column, the ACCREC card's
      "Payer" meta and the money-flow card's `from` all show the stored contact name, so they show the
      label with no view change; confirm none of them reads a patient master. The "Linked Billing
      Engine case, not stored on the Xero contact" callout keeps the patient's name: it reads the
      billing system and is the presenter's bridge back to the Booking.
    - **The settled rule.** Replace the `warn` callout "NHI never resides in Xero (Appendix 2 vs
      Appendix 1)" in `DemoXero.tsx` with an `info` callout (keep `shot="xero-nhi-policy"`) titled "No
      personal information in Xero" and the body: "Xero holds no NHI and no other personal information
      about a patient or a person paying for one. Each such contact is known to Xero only by a hidden
      internal ID in ContactNumber, shown as its name, and by Xero's own ContactID, which link each
      transaction back to its invoice in the billing system. Patient lookup happens in the billing
      system, never in Xero. Confirmed with AA." The Contacts help text becomes: "Organisational
      contacts (hospitals, insurers, surgeons, groups and the anaesthetist payees) persist and never
      archive. Patient and billable-party contacts carry only the hidden internal ID: no name, no NHI
      and no other personal information. Open an invoice pair to see the identifiers used for that
      transaction."
    - **Tests.** Vitest for the helper; `xeroHandoff.test.ts`: a patient-billed and a guardian-billed
      handoff create contacts named by the label, an organisation-billed one keeps its name, and a
      cached or archived contact is reused unchanged; extend `xeroNhi.test.ts` into the Xero privacy
      scan: the serialised `state.xero` slice, seeded and after the S3 billing run and a pre-payment
      invoice, contains no seeded NHI and no `masters.patients` or `masters.billableParties` name,
      phone, email or address. Update `DemoXero.test.tsx` and any shot that asserted the old title or
      a patient name in a Xero row.

### Step 2 · fee settings and the monthly fee invoice (session 2)

11. **The fee model** (DM-26). In `domain/types.ts` add:
    - `AaFeeSettings`: `fixedItems: { id, description, amount }[]` (several allowed) and
      `perBctiCharge: number`, every amount **excluding GST** (US-05.2.7: the system holds every
      price ex GST and works GST out at the foot of the invoice, because the rate can change; so
      there is no "amounts include GST" flag, and the comment on the type says why). Stored as
      `appSettings.aaFee`, the
      product settings record Phase 15a added (DM-31: `DemoSettings` is the wrong home for product
      parameters): add `aaFee: AaFeeSettings` to `AppSettings`, seed it beside `defaultAppSettings()`
      in the seed's `appSettings`, and check the persist merge in `appStore.ts` (its one second level
      is `warningRules`; `aaFee` is replaced whole, which is right). `resetDomainState` already
      restores `appSettings`. One schedule for every anaesthetist: whether the fixed items vary by
      anaesthetist is OQ-60, so keep the shape easy to key by anaesthetist later.
    - `AaFeeInvoice`: `id`, `invoiceNumber`, `reference` (the fee invoice's own case reference),
      `anaesthetistId`, `monthISO` (`YYYY-MM`), a `settings` snapshot (the `AaFeeSettings` used),
      `lines` (one per fixed item, plus one "BCTIs paid in <Month YYYY>: N x $rate" line),
      `bctis` (a snapshot of the counted BCTI records: ACCPAY id and number, procedure invoice number,
      issued date, paid date), `bctiCount`, `subtotal`, `gst`, `total`, `raisedAtISO`, `raisedBy` (`office` or
      `scheduled`), `accRecId`, `amountReceived`, `paidAtISO?`. It **is its own billing case**: it
      carries the ACCREC link and its money state itself, and lives in a new
      `billing.aaFeeInvoices` map, deliberately outside `billing.cases`. Every consumer of
      `billing.cases` (payables, GST activity, Overdue and aging, the monitor pipeline,
      `casesForList`, `openAccRecs`, the Invoices screen) assumes a Booking behind the case, and
      FT-10.3 says the fee is distinct from any procedure receivable and payable; Phase 36 folds both
      into ledger legs. For `kind:'aaFee'` the ACCREC's `invoiceId` holds the `AaFeeInvoice` id.
    - `ID_FORMATS` kinds `aaFeeInvoice` (`AF`, pad 4) and `aaFeeInvoiceNumber` (`AA-FEE-2026-`, pad 4).
      Thread the new map through `AppState`, the empty slice in `appStore.ts`, `freshAppState`,
      `resetDomainState` in `mutate.ts` and `SeedBillingSlice` in `seed/billing.ts`.
12. **Pure BCTI count and fee maths** (convention 9).
    - `src/domain/billing/bcti.ts`: the `BctiRecord` type (`accPayId`, `billNumber`,
      `receivableInvoiceNumber`, `anaesthetistId`, `issuedAtISO`, `receivablePaidAtISO?` (set once
      its receivable is paid in full), `voided`), the exported rule constant
      `BCTI_COUNT_RULE = { paidOnly: true }`, and
      **`bctisFor(records, anaesthetistId, monthISO, rule = BCTI_COUNT_RULE)`**, the only place BCTIs
      are counted: the records for that anaesthetist, voided ones excluded, each `accPayId` counted
      once, sorted by date then id. With `paidOnly` (the built rule) a record counts only when its
      receivable is paid in full, in the calendar month of `receivablePaidAtISO`; unpaid and part-paid
      records do not count yet. With `paidOnly: false` it counts by the month of `issuedAtISO`. Why
      the paid month, not the issue month: under a paid-only rule, an issue-month count would never
      charge a BCTI paid after its month's run; the paid month charges every paid BCTI exactly once.
      One comment beside it states every rule in one place: one BCTI per receivable invoice (OQ-29;
      "one per procedure" is an open point for AA's accountant); each counted once against the
      anaesthetist who did the procedure (OQ-60's recommendation); only paid BCTIs, in the month paid
      (Greg's 2026-10-02 view, OQ-60 part 2, being confirmed with AA's accountant: flip `paidOnly`
      if it is not); and the fee never nets against payables (Greg, trust law: a rule, not a switch).
    - `src/domain/billing/aaFee.ts`: `aaFeeFor(settings, bctiCount)` returning `{ lines, subtotal,
      gst, total }`: `subtotal` is the fixed items summed plus `perBctiCharge x bctiCount`, ex GST,
      rounded once; `gst` is worked out at the foot from the subtotal at `GST_RATE`
      (`domain/billing/invoiceBuild.ts`, 15%) and rounded once; `total = subtotal + gst`.
      `validateAaFeeSettings(settings)` (description required, amounts finite, zero or more, to the
      cent).
    - Vitest: **the US-10.3.1 acceptance criterion**: fixed items of $500 (two items, $350 and $150)
      and $5 per BCTI with 40 BCTIs give a fee of $700 (the subtotal, ex GST; GST $105.00 at the foot,
      total $805.00); **US-10.3.3's**: the subtotal is the sum of the fixed items plus rate times
      count, and a changed rate gives the new subtotal; zero BCTIs give the fixed items only;
      `subtotal + gst === total` to the cent; `bctisFor` counts by anaesthetist and paid
      month (a BCTI paid on 31 Jul and one paid on 1 Aug land in different months; one issued 28 Jul
      and paid 3 Aug counts in August, not July), skips unpaid and part-paid records, counts every paid
      record exactly once across consecutive months, drops voided records, counts a duplicated record
      once, counts by issue month with `paidOnly: false`, and is deterministic.
13. **The BCTI record list: `bctiRecords(state)`** in `store/selectors.ts`, the only source
    `bctisFor` is fed from: one record per procedure ACCPAY in `state.xero.accPays` (the ACCPAY is
    the BCTI), carrying its stored `invoiceNumber`, `anaesthetistId` and `issuedAtISO` and its
    ACCREC's `paidAtISO` as `receivablePaidAtISO` (item 9). Fee ACCRECs have no ACCPAY, so they are
    never counted. A pre-payment invoice is a receivable invoice with its own ACCPAY, so it is a BCTI
    too (the seeded BC0001 pair, paid on 14 July, counts in July for its List's anaesthetist), matching Phase 36,
    where an issued prepayment payable leg gives a BCTI and a held one does not; log this reading on
    the owner's review list. Later phases that add invoices feed this list and nothing else: 22 (a Split
    Contract gives two receivable invoices, so two BCTIs), 36 (the ledger's payable legs, with a
    parity test against this selector), 38b (additional invoices, recorded as events), 39 (re-issued
    invoices after a credit; whether a credit note or negative invoice counts is OQ-60) and 39b (event
    invoices). Say so in a comment.
14. **Store actions** in new `src/store/aaFeeActions.ts`, every write through `mutate()`:
    - `saveAaFeeSettings(api, actor, next)`: office only; refuses invalid settings with the
      validator's reason; writes `appSettings.aaFee`; audit `aaFee.settingsChanged` (entity
      `appSettings`, before and after).
      Raised fee invoices keep their snapshot, so a change applies from the next run (US-10.3.3).
    - `aaFeeRunPreview(state, monthISO)` (selector): one row per active anaesthetist with BCTI count
      (paid that month), fixed total, per-BCTI total and fee total from `bctisFor` and `aaFeeFor`, and
      whether they already have a fee invoice for that month.
    - `runMonthlyFeeInvoices(api, actor, { monthISO })`: office actor (the product button) or the
      system actor `{ who: 'AA fee run (scheduled)', role: 'system', source: 'system' }` (the
      scheduled form); anaesthetists refuse. Refuses a month after the demo clock's month. In one
      mutate, for each active anaesthetist with no fee invoice for that month (FT-10.3: "one fee
      invoice to each anaesthetist", so an anaesthetist with no BCTIs is charged the fixed items):
      allocate the id and number, snapshot the settings and the counted BCTIs, resolve the
      anaesthetist's existing Xero contact through the `anaesthetist:<reg>` cache key (reuse
      `resolveContactInto`, newly exported from `xeroHandoff.ts`, with the same payee `ContactSpec`
      shape `handoffCase` builds, so no duplicate contact; anaesthetists with no contact yet get one
      created once), and create a `kind:'aaFee'` ACCREC (`amountDue = total`, stored
      `invoiceNumber`, `reference` and `issuedAtISO`) with no ACCPAY. Audit per invoice
      `aaFee.invoiceRaised` (entity `aaFeeInvoice`) and `xero.feeAccRecCreated`. Idempotent: a rerun
      for a month already invoiced raises nothing for those anaesthetists and returns
      `{ raisedCount: 0 }` without mutating. Build the raise step as an exported
      `raiseAnaesthetistInvoiceInto(draft, ...)` helper (fee invoice record plus its ACCREC against
      the anaesthetist's contact): the one path for an invoice from AA to an anaesthetist, which
      Phase 36 gives its ledger pair (no later phase builds a second one; OQ-71's negative with no
      later payment is handled outside the system). Satisfies US-10.3.1 and FT-10.3.
    - `recordAaFeePayment(api, actor, { aaFeeInvoiceId, idempotencyKey })`: the anaesthetist pays AA
      in full, into AA's own bank account (Xero side: a `PaymentIn` on the fee ACCREC, ACCREC `paid`
      with its `paidAtISO`; mirror: `amountReceived`, `paidAtISO`). Idempotent by key. No
      `BillingReceipt` (it is not the anaesthetist's income, so GST activity never sees it). Widen
      `PaymentIn.source` with `'aaFee'`. Actor `{ who: 'Xero payment (AA fee)', role: 'system',
      source: 'system' }`; audit `aaFee.paymentRecorded` (entity `aaFeeInvoice`). Time from the demo
      clock (`clockISO`). **Never netted:** no code path deducts a fee invoice from a payable, a
      payables run or a disbursement (Greg, 2026-10-02: "Under trust law it mustn't"); a test asserts
      that raising and paying fee invoices leaves every ACCPAY's authorised and disbursed amounts and
      the payables-run total unchanged.
    - Guards on the existing money paths: `receivePayment` refuses a `kind:'aaFee'` ACCREC with code
      `aaFeeInvoice`; `openAccRecs` excludes them (so the Control Panel's payment `indexPath` never
      lands on one); `runReconciliationPoll` skips payments on them before calling `receivePayment` (a
      fee `PaymentIn` never has a receipt, so without the skip every day advance would re-detect it);
      the archive job is unaffected (anaesthetist contacts are organisation type). Vitest for every
      guard, for one fee invoice per anaesthetist per month, a rerun being a no-op, the
      anaesthetist with no BCTIs (fixed items only), a settings change applying to the next run and
      not to a raised invoice, the future-month refusal, and the office, system and anaesthetist
      actors.
15. **Selectors and seed.** `aaFeeInvoicesFor(state, anaesthetistId)` (newest first, with a derived
    status `unpaid | paid`) and `allAaFeeInvoices(state)` read the billing mirror only, never
    `state.xero` (the Phase 10 convention 9 rule for app money views). Seed (determinism, convention 5):
    - `appSettings.aaFee`: two sample fixed items, "Practice management" $350.00 and "Office and
      reception" $150.00 ($500 in all), $5.00 per BCTI, all ex GST. Labelled in the UI as a sample
      schedule: AA's real fixed charges come from its accountant (OQ-60 part 1; Greg does not know
      them).
    - Dr Souter's fee history in the `H` id namespace, computed through `bctiRecords`, `bctisFor` and
      `aaFeeFor` over the seeded history (never typed-in totals): `AA-FEE-2026-H01` for May 2026,
      raised 2026-06-01 and **paid** 2026-06-05 (with its `PaymentIn`), and `AA-FEE-2026-H02` for June
      2026, raised 2026-07-01 and **unpaid**, each with a `kind:'aaFee'` ACCREC against payee contact
      `XCH01`. Under the paid-month count today's history gives May two BCTIs (pa04, pa05) and June one
      (pa03), so expect subtotals of about $510.00 and $505.00 before GST; the test asserts the
      computed values, never these figures. July stays uninvoiced so the first live run has a month to raise. Only Dr Souter has
      seeded billing history, so only she has fee history. Counters continue past the seeded ids.
    - **Bump `PERSIST_VERSION`** again (this bump also covers items 9 and 10 if they slipped to
      session 2). Extend `seedBilling.test.ts`: two builds deep-equal, the
      seeded fee totals equal `aaFeeFor` over `bctisFor` for their month, `resetDomainState`
      restores the fee map and settings.
16. **Admin: AA fee invoices and AA fee settings.** Two routes under the Billing section (so
    `sectionForPath` keeps Billing active): `/admin/billing/aa-fees` and
    `/admin/billing/aa-fees/settings`, two sub-tabs of one `AaFeesScreen` ("Fee invoices", "Fee
    settings"), wired in `router.tsx` and `apps/admin/routes.tsx`.
    - **Fee invoices** (`data-shot="admin-aa-fee-invoices"`): a month picker (months up to the demo
      month, default the demo month, July 2026, with the caption "The real run is made at month end;
      in the demo, running the current month invoices it to date."), the preview table from
      `aaFeeRunPreview` (Anaesthetist via `drSurname`, BCTIs paid, Fixed, Per-BCTI, Fee (ex GST),
      and "Invoiced" where one exists), and a teal **Run monthly fee invoices** button (an unbadged
      product office action, disabled with the reason when every active anaesthetist already has one
      for the month). A result line after a run. Below, every fee invoice: Number (mono),
      Anaesthetist, Month, BCTIs, Fee (ex GST), GST, Total, Raised, Status pill (Paid with date on success
      tint, Unpaid neutral). A row expands inline to its lines and its counted BCTIs (ACCPAY number,
      procedure invoice number, issued date, paid date). One caption states the count and is the
      only place in the UI that says it is being confirmed: "Counts one BCTI per receivable invoice,
      once, against the anaesthetist who did the procedure, in the month its invoice is paid in full.
      Being confirmed with AA's accountant." A second line states the settled part: "Always a
      separate invoice, paid into AA's own account and never deducted from a payment to the
      anaesthetist."
    - **Fee settings** (`data-shot="admin-aa-fee-settings"`, US-10.3.3): the fixed items as editable
      rows (description, amount, remove) with "Add item", the per-BCTI charge, a live worked example
      ("With 40 BCTIs: $500.00 + $5.00 x 40 = $700.00, plus GST at the foot of the invoice"), the
      sample schedule label, and a teal **Save settings** button calling `saveAaFeeSettings`, with the
      validator's reason inline. No GST toggle. Copy: "Amounts exclude GST; GST is added at the foot
      of each fee invoice. Changes apply from the next monthly run. Raised fee invoices keep the
      settings they were raised with."
    - The Billing monitor gains a compact **AA fee invoices** panel beneath Payables run
      (`data-shot="billing-aa-fee-invoices"`): the latest fee month, unpaid fee invoices and their
      total, and an "Open AA fee invoices" link. Its intro copy gains one sentence: "AA's own fee is
      invoiced to each anaesthetist monthly; it is never deducted from a payable."
    Satisfies US-10.3.1, US-10.3.3 and "Admin shows it paid or unpaid".
17. **Web Accounts: "AA fees" sub-tab** (US-10.3.2). Add `'fees'` to `AccountsSubTab` and
    `ACCOUNTS_SUB_TABS` (`/web/accounts/fees`), a fourth `SubTabButton` "AA fees", and an
    `AaFeesTable` (`data-shot="web-accounts-aa-fees"`): Invoice (mono), Month, BCTIs, Fixed charges,
    Per-BCTI charge, Fee (ex GST), GST, Total, Status pill (Paid with date, or Unpaid). Footer: total
    unpaid fees (incl GST).
    Caption: "AA invoices its fee monthly: fixed charges plus a charge for each buyer-created tax
    invoice (BCTI) AA issued for your work and was paid for that month. It is a separate invoice you
    pay into AA's own account, never deducted from your payments."
    `?invoice=AA-FEE-...` highlights a row as the Payments tab does. Fee invoices show as soon as they
    are raised (the next-day rule applies only to procedure ACCPAY rows). The Payments caption from
    item 6 now links "invoiced to you monthly" to this tab. Mobile Balances is unchanged (see Out of
    scope).
18. **Xero simulation: the fee pair.** `xeroInvoicePairViews` gains the `kind` and an `aaFee` branch:
    lines from the fee invoice snapshot, no `accPay`, engine context `aaFeeInvoiceId` and
    `anaesthetistId`, and `incomplete` false when the fee invoice and contact exist. `InvoicesTable`
    shows an "AA fee" chip and `·` in the ACCPAY columns. `PairDetail` for a fee ACCREC: one money
    flow card "ACCREC · AA FEE" from the anaesthetist to **Anaesthesia Associates (AA's own
    account)**, the ACCREC card with InvoiceNumber and Reference, and in place of the ACCPAY card a
    short note: "No payable. This is AA invoicing its own monthly fee to the anaesthetist. It is paid
    into AA's own bank account, not the account client money passes through, and is never netted
    against a payment to the anaesthetist." The "Simulate payment and payout" button is hidden; a teal **Record fee payment**
    button (the same body as the trigger) takes its place, disabled once paid, and for Dr Souter's
    fee invoices a "View in Dr Souter's account" link opens `/web/accounts/fees?invoice=<number>`.
    `data-shot="xero-aa-fee-pair"`.
19. **Register the demo triggers** in the Phase 14 registry (see Demo triggers), with bodies in
    `src/store` or `src/shared` so the PWA purity test holds, and add the `when` guard to the
    re-homed payment triggers. Vitest in the registry's test: each new entry matches only its
    routes, "Record fee payment" is invisible on a procedure pair, the payment triggers are invisible
    on a fee pair, every disabled reason fires, and "Seed a month of BCTIs" then "Run monthly fee
    invoices" gives Dr Rutherford a July fee invoice of exactly $700.00 before GST ($805.00 with GST)
    at seed settings (40 BCTIs,
    all paid in July).
20. **Tests and shots for step 2.** Vitest for items 11 to 15 as listed, plus component tests for the
    AA fees tab (rows, pills, focus highlight), the Fee invoices screen (preview, button disabled
    state, a run adds rows) and the Fee settings screen (add and remove an item, invalid amount
    refused, save audited). Playwright: add `visual/aa-fee.spec.ts` through settings, seed BCTIs,
    run, the fee pair, Record fee payment and the web AA fees tab, with the five new `data-shot`
    hooks. Copy sweep: no en or em dashes in any new string; grep confirms no fee-rate literal
    (`0.05`, `0.95`) survives in `src/domain/billing`, `src/store`, `src/apps/demo` or the money
    screens (the theme's shadow and gradient `0.05` / `0.95` values are unrelated and stay), and the
    sample fee amounts ($350, $150, $5 per BCTI) appear only in the settings seed and tests: the run,
    the screens, the worked example and the triggers read `appSettings.aaFee`.
21. **Re-green step 2:** `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`.

## Demo triggers

All are registered through the Phase 14 registry with `surfaces: bar`, a `run(api, ctx)` that acts on
the entity in the URL, the published context or a named seed constant, and a disabled state. None is
added to the Control Panel page; it lists them under their screens automatically.

1. **"Run scheduled month-end fee run"** · screen `/admin/billing/aa-fees` · runs
   `runMonthlyFeeInvoices` as the scheduled system actor for the month shown in the picker (the
   screen publishes it with `useDemoTriggerContext` under a new `'aaFees.month'` key in
   `DemoContextValues`; default the demo month). The stand-in for the month-end job, whose day is
   not set (the weekly payment cycle of OQ-47 and US-10.2.7 schedules payouts, not this run, and is
   Phase 39a's). Disabled when every active anaesthetist already has a fee invoice for that
   month. The product form of the same action is the in-page teal **Run monthly fee invoices** button
   (office actor, unbadged, not a demo trigger). `indexPath`: `/admin/billing/aa-fees`.
2. **"Seed a month of BCTIs"** · screen `/admin/billing/aa-fees` · seed-scoped to `ANAE.rutherford`
   (named in the entry and gated with `when`): tops Dr Rutherford up to exactly 40 BCTIs paid in
   July 2026 (the seed's demo month; it adds 40 minus his current July count from `bctisFor` over
   `bctiRecords`, never a count of its own), so the $500 + $5 x 40 = $700 example reproduces on the
   next run under the paid-only count. Build them with a generalised history account builder
   (`domain/seed/`, the same graph `buildHistory` builds for Dr Souter: billed List, Booking,
   Procedure, invoice, case, ACCREC and ACCPAY with stored numbers, `issuedAtISO` and the ACCREC's
   `paidAtISO`, payer contacts named by the item 10 label), with service dates on the July weekdays
   **before the canvas horizon start** (`horizonFor(DEMO_TODAY).startISO`, 2026-07-07: so 1, 2, 3
   and 6 July, an AM and a PM List each day, five Bookings per List), the rule `history.ts` already
   follows so no added List collides with a generated canvas List. Every receivable is paid in full
   in July and before the demo date (for example a week after its service date, so 8 to 13 July) and
   disbursed, so they add nothing to Overdue or the payables run, in their own deterministic id
   namespace, through one `mutate()` with one audit entry. Disabled when `bctisFor` already gives Dr
   Rutherford 40 or more July BCTIs ("Already 40 BCTIs paid in July 2026"), or he has a July fee
   invoice ("Already invoiced for July 2026"). `indexPath`: `/admin/billing/aa-fees`.
3. **"Record fee payment"** · screen `/demo/xero/invoices/:accRecId`, with a `when` that shows it
   only when that ACCREC is `kind:'aaFee'` (never on a procedure pair) · calls `recordAaFeePayment`
   for its fee invoice (the anaesthetist's bank transfer lands in AA's own account). Disabled when paid
   ("Already paid"). The fee pair detail's in-page button uses the same body. `indexPath`: the pair
   of the oldest unpaid fee invoice (on the pristine seed, Dr Souter's `AA-FEE-2026-H02`), or `null`
   when every fee invoice is paid.
4. **Re-pointed:** the `payment-full`, `payment-half` and `payment-replay` triggers Phase 14 re-homed
   now release exactly the amount received (Full and Half alike). On `/demo/xero/invoices/:accRecId`
   they gain a `when` that hides them on a `kind:'aaFee'` pair (a fee payment is "Record fee
   payment", never a procedure webhook), and `receivePayment`'s `aaFeeInvoice` refusal backs that up.
   The Control Panel's `indexPath` for them uses `openAccRecs`, which already excludes fee ACCRECs.
   Phase 14's PWA `pwa-payment-full` / `pwa-payment-half` (Mobile · Balances) share the same body, so
   they release exactly the amount received too; their `choices` come from `openAccRecs`, so a fee
   ACCREC is never offered; their result message and description get the same no-fee wording.

The fee settings page needs no trigger (it is a normal office screen). The web AA fees tab is shown
paid through "Record fee payment" and the pair's "View in Dr Souter's account" link. The Xero contact
names (item 10) need no trigger: the Contacts tab and every pair show them on the pristine seed.

**PWA equivalent:** no new PWA entry. This phase changes no mobile screen, and no mobile beat waits
on the office or a backend event; the fee view is web only (US-10.3.2's screenshot and the verified
gap put it on web). The only PWA change is the shared payment body and copy behind
`pwa-payment-full` / `pwa-payment-half` (item 4 above). Confirm this phase's new entries declare
`surfaces: bar` so the PWA demo-actions sheet does not list them, and that `npm run build:pwa` still
passes the purity check.

## Out of scope

- The internal ledger (DM-22, Phase 36). `AaFeeInvoice` stays a self-contained case beside
  `billing.cases`; Phase 36's ledger promotion must carry `billing.aaFeeInvoices` into its receivable
  legs and the imbalance indicator, and re-read `bctiRecords` from its payable legs with a parity
  test.
- Period approval of BCTIs (US-10.2.6) and negative invoices netted against payments (US-10.2.5):
  Phase 39a. A negative with no later payment to net against is handled outside the system (OQ-71,
  answered): nothing is built for it in any phase.
- The weekly ISO-week payment cycle (US-10.2.7, Proposed; OQ-47 Proposed): Friday close, Monday
  checks, Tuesday schedule and week numbers on payments are Phase 39a's. The separate monthly cycle
  on the 20th (OQ-47, still with AA's accountant) is not modelled either: the fee run is an office
  action for a chosen month; no "Close accounting week" and no payment day in any copy.
- Fixed items per anaesthetist (OQ-60): not built; one schedule for all. Netting the fee against
  payables is never built (Greg: trust law forbids it).
- Charging a BCTI paid after its month's fee invoice was raised early: in the demo the current month
  can be run to date, so a BCTI paid later that month is not charged; the real run is made at month
  end, where this cannot arise. Logged for the owner, not built.
- Who is billed (Phases 18 and 21: a third-party contract holder's billable party when the holder
  is billed, else the payer on the Booking, a person prefilled from the patient). Item 10's neutral
  label follows the Xero contact type, so a billable party that is an organisation (seed BP0002, Aria
  Skin and Laser Clinic) is labelled too, until 18's contract holders and 21's payer on the Booking
  say which payers are organisations and which are people.
- Part payment of a fee invoice, fee credit notes or fee voids, and AA-side corrections generally
  (OQ-19's credit and reissue is Phase 39).
- A printable AA fee invoice document and fee invoices on the Admin Invoices screen; the AA fee
  invoices screen is the Admin home for now.
- A mobile fee view on Balances (US-10.3.2 lists "mobile + web" but its only screenshot and the
  verified gap are web); record it as an open handoff item for the owner (no later phase plans it;
  Phase 38 is web only).
- Invoice presentation (Phase 22): procedure invoices move to "issued in the anaesthetist's name
  with AA as agent", and the ACCPAY gets its BCTI wording. The AA fee invoice is AA's own invoice in
  AA's name; leave its wording alone and note it in the handoff so Phase 22 exempts it.
- The Xero outage queue and voids made in Xero (Phase 37), bulk remittance (US-10.2.4, Phase 37).
- Any edit to a catalogue requirement's text or status. The stale screenshots (US-10.3.1
  `simulator-service-fee.png`, US-10.3.2 `web-fee-in-payments.png`, US-10.2.1's part-payment image,
  US-09.3.1's contacts and NHI callout images) are re-shot by the Catalogue screenshots step.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Xero simulation: the NHI callout is a neutral info callout, "No personal information in
      Xero", with no mention of an unresolved contradiction. Contacts: every patient and
      billable-party contact is named "Patient PT…" or "Billable party BP…" (no patient or guardian
      name, NHI, phone or email anywhere on the tab); hospitals, insurers, surgeons, groups and the
      anaesthetist payees keep their names; the help text states the settled rule. Invoices → Dr
      Souter's self-funded pair (Annette Riley's pa04) and the guardian pair (pa05): the Payer column,
      the ACCREC card and the money-flow card show the label, and only the "Linked Billing Engine
      case" callout names the patient. Any seeded procedure pair: the ACCPAY payable equals the ACCREC
      amount due; no fee box anywhere; both cards show InvoiceNumber and Reference, the ACCPAY number
      ends `-P`.
- [ ] S4 Beat 1 (Annette Riley's pre-payment): raise it; the archived patient contact is unarchived
      and still carries only the label; no new contact is created.
- [ ] S3: authorise both Mon 20 Jul Lists, open AA-2026-0005 (nib, $152.38): the payable to Dr
      Souter is $152.38. Simulate payment and payout: $152.38 disbursed; web Accounts → Payments shows
      $152.38 received, released and paid to you, with no AA fee or Net to you column.
- [ ] S4 Beat 5: pay half of Hemi Walker's St George's invoice via the re-homed webhook trigger: the
      ACCPAY authorises exactly the amount received to the cent; Run payables disburses exactly
      that; pay the balance and run again: the total disbursed equals the invoice total, never more.
- [ ] Replay the last webhook: no change. Advance the day: the seeded missed webhook is caught by
      the poll and releases its full amount.
- [ ] The admin invoice rail for AA-2026-0005 shows the same numbers as before (ACCREC number, ACCPAY
      number with `-P`), now read from the stored fields.
- [ ] Admin → Billing → AA fee invoices → Fee settings: two sample items ($350, $150) labelled as a
      sample schedule, $5.00 per BCTI, amounts stated as excluding GST with no GST toggle, the worked
      example reads $700.00 plus GST for 40 BCTIs; add an item,
      save, the example updates; an empty description or negative amount is refused with a reason;
      remove it again and save.
- [ ] Fee invoices: AA-FEE-2026-H01 (May) Paid and H02 (June) Unpaid for Dr Souter, their totals
      matching $500 plus $5 per counted BCTI shown in the row, and each expanded row lists only
      receivables paid in that month. The caption says the count is one BCTI per receivable invoice,
      against the doer, in the month paid, being confirmed with AA's accountant, and that the fee is
      never deducted. July preview lists every active anaesthetist. Paid-only check: on a fresh
      reset, authorise S3's Mon 20 Jul Lists: Dr Souter's July BCTI count does not change while
      AA-2026-0005 is unpaid; Simulate payment and payout on it and the count rises by one.
      "Seed a month of BCTIs" in the bar: Dr Rutherford shows 40 BCTIs and a $700.00 fee before GST, and the Day view
      for 7 to 20 July shows no doubled Rutherford List. Run monthly fee invoices: one July fee
      invoice per active anaesthetist, Dr Rutherford's $700.00 + GST $105.00 = $805.00, Dr Souter's $500 plus $5 times her
      BCTIs paid in July, the others $500.00 plus $5 per July BCTI shown in their row (the seeded
      BC0001 pre-payment, paid 14 July, counts for its anaesthetist); a second click is disabled with its reason. Expand Dr Rutherford's row: 40 counted
      BCTIs, each once, each with a July paid date.
- [ ] Change the per-BCTI charge to $6.00 and save: the raised July invoices and the seeded H01 and
      H02 do not change; pick June in the month picker: the preview for the anaesthetists with no
      June fee invoice (everyone but Dr Souter) uses $6.00. Set it back to $5.00.
- [ ] "Run scheduled month-end fee run" shows only on the AA fee invoices screen; on a fresh reset it
      raises July's invoices audited as the scheduled system actor.
- [ ] Xero simulation: each fee ACCREC is listed with an AA fee chip against the anaesthetist's
      contact (no duplicate for Dr Souter), no ACCPAY; the fee pair names AA's own account and says it
      is never netted; on a fee pair the bar shows "Record fee payment" and none of the Payment
      received triggers; Record fee payment marks it paid; on a procedure pair "Record fee payment" is
      absent. Advance the day: the poll does not touch the fee payment.
- [ ] Web → Accounts → AA fees: H01 Paid, H02 Unpaid, the July invoice Unpaid, then Paid with its
      date after Record fee payment; the `?invoice=` link from the Xero sim highlights the row; the
      Payments caption links here.
- [ ] GST activity, Overdue, the payables run (its total and every payable's released and paid
      amounts) and the Billing monitor pipeline do not change when a fee invoice is raised or paid, or
      when settings change: the fee is never netted.
- [ ] Admin → Audit shows `aaFee.settingsChanged`, `aaFee.invoiceRaised`, `xero.feeAccRecCreated`
      and `aaFee.paymentRecorded` with the right who, role and source.
- [ ] The PWA demo-actions sheet lists none of this phase's new triggers; on Mobile · Balances,
      "Payment received · half" releases exactly the amount received, its message carries no fee
      wording, and no fee invoice is offered as a choice.
- [ ] No new or changed app copy (Payments caption, Billing monitor, webhook trigger messages, the AA
      fee screens) names a payment day, a week number or a weekly cycle: that is Phase 39a's.
- [ ] No new app copy contains an en or em dash; the only action colour is teal.
- [ ] Catalogue screenshots: the recipes for the covered items above (US-10.3.1, US-10.3.2, US-10.3.3, US-09.3.1, the re-shot ones, and US-10.2.7 absent for 39a) and the merged items' recipes whose images the catalogue shows on them (US-09.1.2, US-09.3.2, US-10.2.2) are created or updated, every recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye (no patient name on any Xero shot), and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` green.

## Demo guide updates

- **Step 1 (patched in session 1):**
  - `docs/demo-guide/03-demo-script.md` S3 Beat 2: the ACCPAY tracks the full amount AA will pay Dr
    Souter; nib owes $152.38 and the payable to Dr Souter is $152.38; drop the illustrative-fee lines
    ($7.62, $144.76) and the "rate and GST need confirmation" line. S3 Beat 3: "nib pays $152.38 into
    AA, then AA pays the same $152.38 to Dr Souter"; the Payments row shows $152.38 received, released
    and paid to you. S4 Beat 5: "A partial payment authorises a payable for exactly the amount
    received"; Expected: each run pays exactly what arrived. Say nothing about a payment day or a
    weekly run: S4 Beat 5's weekly cycle (US-10.2.7) is Phase 39a's rewrite.
  - S5 Beat 3 (no NHI in Xero, ~403-411): Click adds the Contacts tab: patient and guardian contacts
    are named only by their hidden ID. Say "No personal information goes into Xero: no NHI and no
    patient name, only a hidden internal ID that links each transaction back to the billing system.
    AA confirmed this rule."; Expected: the callout states the confirmed rule (no RFP-contradiction
    callout) and no patient or guardian name shows on any Xero contact or record. Drop the
    "NHI-in-Xero contradiction" from the S5 discovery points (~424).
  - Any beat that reads a patient's name off a Xero contact, row or card (check S3 Beat 2 ~261-286
    and S4 Beat 1's pre-payment pair): the presenter names the patient from the "Linked Billing
    Engine case" callout instead.
  - `04-presenter-cheat-sheet.md` (~116-123): the flow line becomes "Payer -> ACCREC -> AA account
    -> ACCPAY (full amount) -> Anaesthetist"; replace the 5% and proportional bullets. RFP
    ambiguities §1 (NHI in Xero, ~208-231) becomes settled: "Confirmed with AA: no NHI or other
    personal information in Xero, patient names included."
  - `02-workflows-and-handoffs.md` (~384-397): ACCPAY is the full amount; step 5 "for exactly the
    amount received"; the individual contacts in step 9 carry only the hidden ID. Compliance
    (~454-455): drop "contradict each other ... must be confirmed"; state the confirmed rule.
  - `master-demo-guide.html`: the same sections (~724-727 money flow, ~895-902 S3, ~935-936 S4
    Beat 5, ~959 S5 Beat 3, ~1040-1045 cheat sheet, ~1084-1086 RFP ambiguity card 1).
  - `DemoControlPanel.tsx` S3, S4 and S5 scenario messages if they mention the fee, proportional
    payment, the NHI contradiction or a patient name in Xero.
- **Step 2 (patched in session 2):**
  - S3 gains **Beat 4: AA's monthly fee** (Admin → Billing → AA fee invoices → Fee settings: the
    fixed items and $5 per BCTI → Fee invoices → "Seed a month of BCTIs" → Run monthly fee invoices →
    Dr Rutherford's $700.00 ($500 + $5 x 40, before GST; $805.00 with GST at the foot) and Dr Souter's July invoice, which counts AA-2026-0005's
    BCTI because Beat 3 paid it → Xero simulation fee pair → Record fee payment → web Accounts → AA
    fees shows Paid). Say: the fee is AA invoicing the anaesthetist monthly from settings the office
    maintains; it is always a separate invoice, paid into AA's own account and never deducted from a
    payment, because trust law forbids it; only invoices that have been paid are counted, so a Booking
    moved between anaesthetists is never charged twice. The real fixed schedule, and confirmation of
    the paid-only count and of one BCTI per invoice, are with AA's accountant. Read Dr Souter's
    figures from the built app, do not compute them by hand.
  - The cheat sheet gains a one-line AA fee flow ("Month end: fee settings + BCTIs paid that month ->
    AA-FEE invoice (ACCREC) -> Anaesthetist pays AA's own account; never netted") and one caveat line
    (fixed schedule, paid-only count and BCTI granularity with AA's accountant; amounts ex GST, GST
    at the foot); the workflows doc
    gains a short "Monthly AA fee invoicing" workflow (settings, trigger, steps, what the anaesthetist
    sees); `01-personas-and-responsibilities.md` adds "maintain AA fee settings and run the monthly fee
    invoices" to the office's money duties.
  - `master-demo-guide.html` mirrors all of the above; the S3 Control Panel scenario message mentions
    Beat 4.
  - **Milestone consistency read** (16 is a milestone phase, and the first: it includes 14, 15, 15a
    and 15b): read `master-demo-guide.html` end to end against the run sheet, cheat sheet and
    workflows; every figure and button label matches the built app, S4 Beat 1 shows 15a's warning
    with no confirm step, and no Copy a Booking line survives 15b.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 16` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-10.1.1](../../../../requirements-board/requirements/stories/US-10.1.1.md) All payments into AA | captured · simulator-money-path | stays captured. Re-shoot `money-path` (the money-flow card now has no fee line: the payable equals the receivable). Caption unchanged |
| [US-10.1.2](../../../../requirements-board/requirements/stories/US-10.1.2.md) Two payment states | captured · admin-two-states[paid-in,disbursed], admin-invoice-states | stays captured. Re-shoot both shots: the disbursed amount now equals the amount received. Captions unchanged |
| [US-10.2.1](../../../../requirements-board/requirements/stories/US-10.2.1.md) Payable released to match the amount received | captured · simulator-full-payment[unpaid,paid], admin-payables-run | stays captured. Re-shoot `full-payment` and `payables-run` at the gross amount (the payable released equals what was received); `payables-run` shows today's manual Run payables with no week number or cycle day (the weekly cycle the story now links is 39a's). The catalogue now shows the merged US-10.2.2's `part-payment` image first on this story, so do not add a second part-payment shot here: re-shoot that one through the US-10.2.2 recipe (see "Recipes this phase breaks") |
| [US-10.2.3](../../../../requirements-board/requirements/stories/US-10.2.3.md) Reconcile back to the ledger | captured · web-receipt-in-ledger, simulator-engine-link | stays captured. Re-shoot `receipt-in-ledger` at `/web/accounts/payments?invoice=AA-2026-0002`: received, released and paid to you, with no AA fee or Net to you column. `engine-link` re-shot as is |
| [US-10.2.4](../../../../requirements-board/requirements/stories/US-10.2.4.md) Bulk remittance stays in Xero | absent | stays absent (by design; Phase 37 may revisit). Nothing to do beyond the capture run |
| [US-10.2.5](../../../../requirements-board/requirements/stories/US-10.2.5.md) Negative invoices netted in the payment run | absent ("Not built yet: catch-up Phase 39a builds this") | stays absent; Phase 39a builds it. This phase builds nothing visible for it, and the fee is never netted, so no netting shot belongs here |
| [US-10.2.6](../../../../requirements-board/requirements/stories/US-10.2.6.md) Approve the period's BCTIs for payment | absent ("Not built yet: catch-up Phase 39a builds this") | stays absent; Phase 39a builds it |
| [US-10.2.7](../../../../requirements-board/requirements/stories/US-10.2.7.md) Weekly payment cycle | none (new at 60e2d1e, Proposed) | absent ("Not built yet: catch-up Phase 39a builds this"). If no earlier phase has created its recipe, create an absent recipe with that reason so the capture run has no story without a recipe. This phase builds nothing for it: no week number, cycle day or schedule on any screen |
| [US-10.3.1](../../../../requirements-board/requirements/stories/US-10.3.1.md) Generate AA fee invoices | partial · simulator-service-fee | captured; drop the partial reason. Replace `service-fee` (the fee box is gone) with admin shot `fee-run` at `/admin/billing/aa-fees`: states `preview` and `run` (Demo actions, "Seed a month of BCTIs", then the teal "Run monthly fee invoices"), highlight `[data-shot=admin-aa-fee-invoices]`, caption "One run raises every anaesthetist's fee invoice for the month: Dr Rutherford, 40 paid BCTIs, $700.00 plus GST". Add simulator shot `fee-pair` on the fee ACCREC (`[data-shot=xero-aa-fee-pair]`, "AA fee invoice to the anaesthetist, paid into AA's own account, with no payable") |
| [US-10.3.2](../../../../requirements-board/requirements/stories/US-10.3.2.md) AA fee visible to the anaesthetist | partial · web-fee-in-payments | stays partial. The web AA fees tab is built; the mobile app has no fee view (open owner item, no phase plans it), so the reason reads "Web shows AA fee invoices and their status; the mobile app does not show them". Replace `fee-in-payments` with web shot `aa-fees` at `/web/accounts/fees` (highlight `[data-shot=web-accounts-aa-fees]`, caption "AA's monthly fee invoices and whether each is paid", H01 paid and H02 unpaid in one state) |
| [US-10.3.3](../../../../requirements-board/requirements/stories/US-10.3.3.md) AA fee settings | absent ("Not built yet: catch-up Phase 16 builds this") | captured, with the reason cleared. Admin shot `fee-settings` at `/admin/billing/aa-fees/settings`, highlight `[data-shot=admin-aa-fee-settings]`, states `schedule` (two fixed items, $5.00 per BCTI, amounts ex GST, the worked example $700.00 plus GST for 40 BCTIs) and `edited` (add an item, the example updates). Caption "Fixed items plus a charge per BCTI, kept in settings and not in code" |
| [US-09.1.1](../../../../requirements-board/requirements/stories/US-09.1.1.md) Invoice pair creation and identification | captured · simulator-invoice-pairs, simulator-pair-detail, admin-invoice-xero-ids | stays captured. Re-shoot `invoice-pairs` (the Payer column now shows the neutral label for patient-billed pairs) and `pair-detail` highlighting the new InvoiceNumber and Reference items (caption "One pair: both records carry InvoiceNumber and Reference"); `invoice-xero-ids` re-shot as is. The catalogue now shows the merged US-09.1.2's `invoice-number-reference` image first on this story: re-point that recipe (see "Recipes this phase breaks") rather than adding a duplicate shot here |
| [US-09.3.1](../../../../requirements-board/requirements/stories/US-09.3.1.md) Contact identification without NHI | captured · simulator-contacts, simulator-pair-contact-ids | stays captured; the shots must now show no patient name. `contacts`: highlight the table with a patient and a billable-party row showing "Patient PT…" and "Billable party BP…" in the Name column; caption "Xero contacts carry only the hidden internal ID: no name, no NHI". `pair-contact-ids` on `XRH12`: the ACCREC card's Payer shows the label beside ContactID and ContactNumber; caption unchanged unless it names the patient. The catalogue now shows the merged US-09.3.2's `no-nhi` image (the policy callout) first on this story, so do not add a `no-personal-info` shot here: re-caption that recipe instead (see "Recipes this phase breaks") |

**Recipes this phase breaks.** The AA fee box, the Net to you and AA fee columns and the fee wording
go; the Xero NHI callout, the contact names and the pair cards change; the payment webhook entries
release exactly the amount received. Three Retired items were merged into covered stories and the
catalogue shows their images on the survivors (US-09.1.2 on US-09.1.1, US-09.3.2 on US-09.3.1,
US-10.2.2 on US-10.2.1), so their recipes stay and are updated here, keeping their shot names:
- `US-09.3.2` (`no-nhi`, shown on US-09.3.1) and `US-15.0.6`: highlight `xero-nhi-policy`, whose
  title, tone and body change. Re-shoot; re-caption `no-nhi` "No personal information in Xero: only
  the hidden internal ID, never a name or the NHI", and reword US-15.0.6's caption only if it calls
  it a contradiction.
- `US-09.1.2` (`invoice-number-reference`, shown on US-09.1.1): it highlights the pair heading and
  the engine-link callout; re-point the highlight to `[data-shot=xero-invoice-identifiers]` (the
  stored InvoiceNumber and Reference items) and keep the caption.
- `US-10.2.2` (`part-payment`, shown on US-10.2.1): runs S3 and "Payment received · half" on
  AA-2026-0002; after this phase the ACCPAY card shows exactly the amount received released. Re-shoot;
  the caption already reads "exactly the amount received".
- Any recipe that finds a Xero contact, row or card by a patient's or guardian's name (check the
  recipes on `/demo/xero` listed by `grep -l demo/xero requirements-board/capture/recipes/*.json`,
  especially US-06.3.x, US-06.4.1, US-08.3.x, FT-09.3 and US-09.3.x): re-point it to the invoice
  number or the hidden ID; captions that name a patient as Xero data are reworded. At plan time
  this includes `US-08.3.3`'s `archived-contacts` ("Annette Riley's Xero contact archived by the
  nightly job": it highlights `xero-contact-pt0017`, which still resolves, so only the caption changes,
  for example "A patient's Xero contact, known only by its hidden ID, archived by the nightly job";
  its `history-kept` shot reads the web Payments table, the billing system, so its patient name stays).
- `US-09.1.4`: its `absentReason` says the ACCPAY carries "the AA service fee"; drop that wording.
- `US-08.3.3` and `US-08.3.5` (`/web/accounts/payments`): the table loses its AA fee and Net to you
  columns. Re-shoot; fix any caption or highlight that names them.
- `US-09.1.1`, `US-09.1.3`, `US-06.3.1` and `US-10.1.1`: scroll to or highlight
  `[data-testid=xero-money-flow-grid]`, whose card loses the fee line. Confirm each still finds it.
- `US-09.2.1` to `US-09.2.4`, `US-10.1.2` and the other recipes that run "Payment received"
  or "Simulate payment and payout": figures are now gross. Re-shoot, and fix any caption that quotes
  a net-of-fee amount. The button "Simulate payment and payout" stays on procedure pairs.
- The old `aa-service-fee` hook and every recipe highlighting it (`US-10.3.1`, replaced above).

**ATLAS.md.** Routes (`/admin/billing/aa-fees`, `/admin/billing/aa-fees/settings`,
`/web/accounts/fees`), Seed data worth shooting (the fee invoices AA-FEE-2026-H01 paid and H02 unpaid
for Dr Souter, "Seed a month of BCTIs" giving Dr Rutherford 40 paid BCTIs and $700.00 before GST, and patient and
billable-party Xero contacts named "Patient PT…" / "Billable party BP…"), the `/demo/xero/invoices/:accRecId`
route line (drop "illustrative AA service fee"; add the fee pair), Demo control panel (the fee
triggers are on their screens), and Existing hooks (`admin-aa-fee-invoices`, `admin-aa-fee-settings`,
`billing-aa-fee-invoices`, `web-accounts-aa-fees`, `xero-aa-fee-pair`, `xero-invoice-identifiers`;
remove `aa-service-fee`).

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npm run build:pwa` / `npx vitest run` /
`npm run shots` are green, and before writing the PROGRESS entry, run the standard adversarial
review-and-fix pass (PROGRESS convention 18): fan out independent Opus review subagents for
**quality**, **bugs/correctness** and **plan adherence** (scale up, this is a money phase: add a
fourth on **money conservation, the BCTI count and seed determinism**). This session then verifies
every finding against the catalogue and the code, fixes the confirmed ones with a test where a bug had
none, re-greens, and records the pass. Do not re-raise anything settled in the Decisions log, except
the 2026-07-29 fee ruling this phase explicitly supersedes.

**Steer this phase's reviewers at:**
- Money conservation on every procedure pair, seeded and live: `amountPayable === amountDue`;
  `authorised === min(received, payable)` to the cent after any sequence of partials, replays and
  poll catches; `disbursed <= authorised`; no residual fee maths anywhere (grep `serviceFee`,
  `agencyFee` and `proRata` across `src`, and `0.95` / `0.05` in `src/domain`, `src/store` and the
  money screens; the theme's shadow and gradient values are unrelated).
- The BCTI count: `bctisFor` is the only function that counts BCTIs and `bctiRecords` the only list
  it reads (grep for any other `accPays` count or `.length` used as a BCTI count); each ACCPAY counted
  once, against its stored `anaesthetistId`, only once its receivable is paid in full, in the month
  of the ACCREC's stored `paidAtISO`; unpaid and part-paid not counted; across consecutive months
  every paid BCTI counted exactly once; `paidAtISO` set once, by the completing payment (webhook or
  poll), never moved by a replay; the `paidOnly` switch is the only switch and flips to issue-month
  counting cleanly; voided excluded; fee ACCRECs never counted; the rules (one per receivable
  invoice, OQ-29; once against the doer; paid only, being confirmed with AA's accountant; never
  netted) are stated in one comment and on the Admin caption, nowhere else.
- The fee: $500 + $5 x 40 = $700 before GST at seed settings; settings amounts are ex GST
  (US-05.2.7) with GST worked out once at the foot and no inclusive flag anywhere; the subtotal is
  fixed items plus rate times count, rounded once; GST conserves; a settings change never alters a raised invoice; one fee invoice per
  active anaesthetist per month; a rerun is a no-op; no future month.
- Settings, not code: no fee amount or rate appears outside the settings seed and tests; the settings
  write is office-only, validated, audited and restored by reset.
- Fee isolation and no netting: a fee invoice or its ACCREC never reaches payables, GST activity,
  Overdue or aging, the monitor pipeline rows, the payment webhook triggers, the reconciliation poll,
  the archive job, `casesForList` or the Invoices screen; no code path subtracts a fee invoice from a
  payable, a payables run or a disbursement (Greg, 2026-10-02: trust law); `receivePayment` refuses a
  fee ACCREC; a fee payment creates no `BillingReceipt`.
- US-09.1.1: `invoiceNumber`, `reference` and `issuedAtISO` are stored on both Xero records (not
  derived), the ACCPAY number carries `-P`, the fee ACCREC carries its AA-FEE number. US-09.3.1: no
  patient or billable-party name, NHI, phone, email or address reaches any Xero contact or record,
  seeded or live (the extended `xeroNhi.test.ts` privacy scan), through the one
  `xeroIndividualContactName` helper used by the handoff and both seeds; organisation and payee names
  are unchanged; the cache, ContactNumber lookup and unarchive paths still resolve to the same
  contact; the engine-link callout is the only place a patient is named on the Xero surface; the
  callout and Contacts help text state the confirmed rule.
- Determinism and persistence: seed builds deep-equal (including the "Seed a month of BCTIs" body,
  which uses no clock or randomness beyond the demo clock and seeded RNG), `PERSIST_VERSION` bumped
  for each seed change, `resetDomainState` and `freshAppState` carry `aaFeeInvoices` and
  `appSettings.aaFee`, and the persist merge keeps `aaFee`; audit entries carry the right actor (office button vs scheduled system run vs Xero
  payment vs settings save).
- Triggers: each entry shows only on its screen, declares `surfaces: bar`, has working disabled
  states, and its body lives in `src/store` or `src/shared` (PWA purity).
- Design and copy: teal-only actions, pills on semantic tokens not status colours, mono tabular
  amounts, no en or em dashes, the demo guide figures match the running app.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, anything logged rather than fixed, and the
  screens worth a look, each with its route and persona. At least: the paid-only count by paid month
  (Greg's view, for the accountant) and the `paidOnly` switch; the labelled sample fixed schedule;
  the fee settings held ex GST with GST at the foot (US-05.2.7), so US-10.3.1's $700 is read as the
  fee before GST and the example invoice totals $805.00; the current month runnable to date in the
  demo (a BCTI paid later that month is not charged); the
  pre-payment invoice's ACCPAY counted as a BCTI; the
  neutral contact label format ("Patient PT0001", "Billable party BP0001") and Aria Skin and Laser
  Clinic (an organisation billable party) labelled too until Phases 18 and 21; the mobile fee view (no phase
  plans it); and the screens `/admin/billing/aa-fees`, `/admin/billing/aa-fees/settings`,
  `/web/accounts/fees` and `/demo/xero` (Contacts).
- Catch-up status row for Phase 16 and a phase entry (template in PROGRESS.md), recording the drift
  check result, the OQ-60 and OQ-29 status, where Phase 14 had re-homed the webhook trigger, the
  step-1 stop point, the manual checklist item by item, and the review pass. Note that FT-10.3,
  US-10.3.1 and US-10.3.3 are Verify in the catalogue and were built as written.
- **Decisions log:**
  - Supersede **2026-07-29 "Xero money flow and illustrative AA service fee"**: the payable equals
    the receivable and a payment releases exactly the amount received (FT-10.3, US-10.2.1); AA's fee
    is a monthly invoice from settings (D1, OQ-02 answered). Note that it restores the 2026-07-24
    `D-payee-amount` outcome as a catalogue rule.
  - The BCTI count: one BCTI per receivable invoice, counted once against the anaesthetist who did
    the procedure, only once its receivable is paid in full and in the month it is paid (Greg's
    2026-10-02 view, OQ-60 part 2), through `bctisFor` over `bctiRecords` only, with `paidOnly` the
    one switch. Being confirmed with AA's accountant (OQ-60 part 2, and OQ-29's granularity): if the
    accountant counts every issued BCTI, flip `paidOnly`; if "one per procedure" is confirmed,
    `bctiRecords`, the "Seed a month of BCTIs" trigger and S3 Beat 4 are re-baselined in one place.
  - The fee is never netted against payables and is paid into AA's own account (Greg, 2026-10-02,
    trust law; OQ-60 part 3): built as a rule with no switch.
  - Every active anaesthetist gets a monthly fee invoice, fixed items only when they have no BCTIs
    (FT-10.3's "each anaesthetist"); the sample fixed schedule is labelled until AA's accountant
    supplies it.
  - Why `AaFeeInvoice` is its own case outside `billing.cases`, the `XeroAccRec.kind` discriminator,
    and `raiseAnaesthetistInvoiceInto` as the one path for invoices from AA to an anaesthetist.
  - Fee payments are not the anaesthetist's income: no `BillingReceipt`, never in GST activity.
  - No personal information in Xero (OQ-30 answered, US-09.3.1): the Appendix 2 reading is confirmed
    and extended to names. Patient and billable-party contacts are named only by a neutral label
    built from the hidden internal ID; organisation and payee contacts keep their names; the
    simulator no longer calls it a contradiction. Extends 2026-07-28 "Xero invoice pairs are routed"
    (patient identity only in the engine-link panel) and keeps 2026-07-22 Fourth review #5.
  - AA fee settings live in `appSettings` (DM-31), not `DemoSettings`, and hold every amount ex GST
    with GST at the foot of the fee invoice (US-05.2.7, Greg 2026-10-07): no inclusive toggle.
  - The release is per payment, through today's Run payables; the weekly ISO-week payment cycle
    (US-10.2.7, OQ-47 Proposed) is Phase 39a's.
- **Catalogue screenshots:** recipes created or changed (US-10.3.3 captured; US-10.3.1 and US-10.3.2
  rebuilt; US-10.2.7 absent for Phase 39a if no earlier phase made it; US-09.3.1's shots without names; the merged US-09.1.2, US-09.3.2 and US-10.2.2 recipes
  re-pointed; the re-shot and re-pointed ones), the `REPORT.md` counts before and after (captured, partial,
  absent, failed), and the partial reason on US-10.3.2 (no mobile fee view) handed to the owner.
- **Handoff notes:** Phase 36 must fold `billing.aaFeeInvoices` into the ledger and re-read
  `bctiRecords` from its payable legs with a parity test, keeping the paid date; Phases 22, 38b, 39
  and 39b feed `bctiRecords` and never count BCTIs elsewhere (39 settles with OQ-60 whether a credit
  note or negative invoice counts); Phases 32a and 41 update an ACCPAY's `anaesthetistId` (the
  doer, and only the payable half of a moved prepaid Booking, OQ-70) so the count follows; Phases 18 and 21 revisit
  item 10's label rule (a contract holder's billable party is an organisation and keeps its name;
  the payer on the Booking is a person and carries only the label); Phase 36 gives `raiseAnaesthetistInvoiceInto` its ledger pair; Phase 22 must exempt
  the AA fee invoice from the "anaesthetist's name, AA as agent" wording; the mobile fee view as an
  open item for the owner; add a one-line
  "superseded by catch-up Phase 16" note where `docs/prototype-build/REQUIREMENTS.md`,
  `prototype-review/08-xero-integration.md` and `prototype-review/12-RFP-CONFLICTS-AND-CHOICES.md`
  still state the 5% deduction or the open NHI contradiction.
