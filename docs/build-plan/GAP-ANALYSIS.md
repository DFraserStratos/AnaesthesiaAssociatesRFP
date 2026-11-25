# Build plan · Gap analysis

Catalogue snapshot `f885f67` · generated 2026-11-26 · 39 in-scope items (76 retired or Future Work excluded)

The plan was seeded empty at `64b3dff`, with no gap analysis: the prototype was taken as matching the catalogue then. Only items changed since are graded here; 277 in-scope items not graded since are left out.

**Method.** Per-epic Sonnet reviewers against six prototype maps, each review re-checked by an adversarial Sonnet verifier; plus a verified data-model delta and a verified reverse check. Supporting analysis: [prototype maps](analysis/), [data-model delta](analysis/domain-model-delta.md), [reverse check](analysis/reverse-check.md). Machine-readable data: [gaps.json](gaps.json). The development plan built from this is in [ROADMAP.md](ROADMAP.md) and [index.html](index.html).

**Verdicts.** Matches: the prototype demonstrates the requirement as now written. Partial: present but missing rules or acceptance criteria. Contradicts: implemented, but some behaviour now differs from the requirement. Missing: nothing represents it. OutOfScope: cannot be shown in a front-end demo, even with a demo button. Grouping: an epic or feature with no rules of its own. Sizes are for a Claude Code session: S under an hour, M a few hours, L about a session, XL more.

## At a glance

| Epic | Contradicts | Partial | Missing | OutOfScope | Matches | Grouping | Items |
|---|---:|---:|---:|---:|---:|---:|---:|
| [EP-01 · Schedule canvas, Slots and Lists](#ep-01) | 1 | 1 |  |  |  |  | 2 |
| [EP-02 · Booking intake and change handling](#ep-02) |  | 1 |  |  |  |  | 1 |
| [EP-03 · Booking and Procedure capture (anaesthetist)](#ep-03) |  |  |  |  |  |  | 0 |
| [EP-04 · Contracts](#ep-04) |  | 6 |  |  | 3 | 1 | 10 |
| [EP-05 · RVG master data and fee calculation rules](#ep-05) |  |  |  |  |  |  | 0 |
| [EP-06 · Prepayment](#ep-06) |  | 1 |  |  |  |  | 1 |
| [EP-07 · List approval workflow](#ep-07) |  |  |  |  |  |  | 0 |
| [EP-08 · Billing/Invoice Engine and internal ledger](#ep-08) | 1 |  |  |  |  |  | 1 |
| [EP-09 · Xero integration](#ep-09) |  |  |  |  |  |  | 0 |
| [EP-10 · Payments, disbursement and AA fees](#ep-10) |  | 3 |  |  | 1 |  | 4 |
| [EP-11 · Patients and billable parties](#ep-11) | 3 | 2 |  |  |  | 1 | 6 |
| [EP-12 · Anaesthetist profile and reporting](#ep-12) | 2 |  |  |  |  | 1 | 3 |
| [EP-13 · Admin oversight and master data](#ep-13) | 4 | 6 | 1 |  |  |  | 11 |
| [EP-14 · Health systems integration](#ep-14) |  |  |  |  |  |  | 0 |
| [EP-15 · Non-functional requirements](#ep-15) |  |  |  |  |  |  | 0 |
| **Total** | **11** | **20** | **1** | **0** | **4** | **3** | **39** |

Verification: 5 of 39 gradings were corrected by the adversarial verifier (see [Verification log](#verification-log)).

## Not represented in the prototype

Every in-scope requirement graded Missing, by epic.

**EP-13 · Admin oversight and master data**

- [US-13.3.3](../../requirements-board/requirements/stories/US-13.3.3.md) The Finances section · Verify (3) · L. There is no Finances section: the side nav has separate Invoices, Billing monitor and Ledger items, with no tabbed container, tab counts or single warning badge.

## Structural changes (data model)

Ten deltas verified and none refuted or dropped. All catalogue claims were re-read at 67cba2ce and are in scope, none retired and none in Future Work. Upheld: DM-01, DM-02, DM-04, DM-06, DM-07, DM-08 and DM-09. Corrected: DM-03, DM-05 and DM-10. In DM-03, Phase 49's D94 calls the to-do a warning rule, but a Warning is keyed to a Booking, so the phase must either widen the finding's subject to a Contract or use the derived ToDoItem kind. In DM-05, recurring bookings read Slot existence rather than the active flag, and more flag readers exist: matching open-slot, rebook candidates, list-move demo. The start date already exists. paymentActions.ts:294 refuses a receipt naming an inactive anaesthetist, which conflicts with "everything recorded before stays". In DM-10, the follow-up and attention counts are by row (per warning, per reminder), so even a single reason can repeat. Nothing was added: People-page keys, side panels, filters, patient pending details and the waiting-NHI move need no model change. domain-model-delta.md is updated with the corrections and an adversarial-verification note.

| ID | Kind | Change | Size | Catalogue |
|---|---|---|---|---|
| DM-01 | NewRelationship | A Contract remembers which Contract it replaces, and from when | M | [US-04.1.8](../../requirements-board/requirements/stories/US-04.1.8.md), [US-04.1.2](../../requirements-board/requirements/stories/US-04.1.2.md), [US-04.1.3](../../requirements-board/requirements/stories/US-04.1.3.md) |
| DM-02 | NewLifecycle | Replace a Contract from a date, as one action | L | [US-04.1.8](../../requirements-board/requirements/stories/US-04.1.8.md), [US-04.1.2](../../requirements-board/requirements/stories/US-04.1.2.md), [US-04.1.3](../../requirements-board/requirements/stories/US-04.1.3.md), [US-04.2.15](../../requirements-board/requirements/stories/US-04.2.15.md), [US-07.3.1](../../requirements-board/requirements/stories/US-07.3.1.md) |
| DM-03 | NewEntity | A Contract still Active after its replacement date is a to-do item | M | [US-04.1.8](../../requirements-board/requirements/stories/US-04.1.8.md), [FT-13.7](../../requirements-board/requirements/stories/FT-13.7.md), [US-13.7.2](../../requirements-board/requirements/stories/US-13.7.2.md) |
| DM-04 | ChangedLifecycle | Disabling is confirmed and lists the Procedures first (replaced case remains) | S | [US-04.1.2](../../requirements-board/requirements/stories/US-04.1.2.md), [US-04.1.8](../../requirements-board/requirements/stories/US-04.1.8.md), [US-07.2.2](../../requirements-board/requirements/stories/US-07.2.2.md) |
| DM-05 | ChangedLifecycle | An anaesthetist has a last day, from which they are inactive | L | [US-12.1.6](../../requirements-board/requirements/stories/US-12.1.6.md), [US-01.1.1](../../requirements-board/requirements/stories/US-01.1.1.md), [US-12.1.4](../../requirements-board/requirements/stories/US-12.1.4.md), [FT-12.1](../../requirements-board/requirements/stories/FT-12.1.md) |
| DM-06 | NewRelationship | An inactive anaesthetist's own Contracts are disabled, and offered back | M | [US-12.1.6](../../requirements-board/requirements/stories/US-12.1.6.md), [US-04.1.2](../../requirements-board/requirements/stories/US-04.1.2.md), [FT-12.1](../../requirements-board/requirements/stories/FT-12.1.md) |
| DM-07 | RuleChange | No sign-in after the last day | S | [US-13.5.3](../../requirements-board/requirements/stories/US-13.5.3.md), [US-12.1.6](../../requirements-board/requirements/stories/US-12.1.6.md) |
| DM-08 | RemovedEntity | The surgeon group record is removed; the Party of kind surgeon group stays | M | [US-13.4.1](../../requirements-board/requirements/stories/US-13.4.1.md), [US-13.6.2](../../requirements-board/requirements/stories/US-13.6.2.md), [US-04.1.5](../../requirements-board/requirements/stories/US-04.1.5.md) |
| DM-09 | ChangedRelationship | The rate and the priority tier are one card and one audited change | S | [US-12.1.4](../../requirements-board/requirements/stories/US-12.1.4.md), [US-01.3.6](../../requirements-board/requirements/stories/US-01.3.6.md) |
| DM-10 | NewEntity | A patient needing the office is one row with its reasons | S | [US-11.3.3](../../requirements-board/requirements/stories/US-11.3.3.md), [US-11.3.1](../../requirements-board/requirements/stories/US-11.3.1.md), [US-11.1.5](../../requirements-board/requirements/stories/US-11.1.5.md), [US-11.1.4](../../requirements-board/requirements/stories/US-11.1.4.md), [US-02.1.4](../../requirements-board/requirements/stories/US-02.1.4.md), [US-13.4.1](../../requirements-board/requirements/stories/US-13.4.1.md) |

Detail and impact: [analysis/domain-model-delta.md](analysis/domain-model-delta.md).

## Prototype behaviour to remove or rework

## By epic

<a id="ep-01"></a>

### EP-01 · Schedule canvas, Slots and Lists

[EP-01](../../requirements-board/requirements/stories/EP-01.md) · epic status Agreed (4) · 1 Contradicts, 1 Partial

> EP-01 has only two items in scope here, and both gaps come from the 25 Nov People section update (Donald people section #7, #10, #11), not from Contracts phases 46 to 49. US-01.1.1's gap is really US-12.1.6. The canvas generator (domain/seed/canvas.ts) and anaesthetistCanvasDelta (store/slotActions.ts) already take an active flag. They need a last-day input and an active-from input instead of the trim-from-today in editAnaesthetist (store/mastersActions.ts), plus clock-driven trimming of Slots after a passed last day. US-01.3.6 is a card-edit pattern change (Edit, choose, Save, Cancel on one card shared with the rate per unit, audited per save) plus a tier filter on the People Anaesthetists list. It can be done standalone in AnaesthetistRecord.tsx and AnaesthetistsView.tsx, or after the shared record pattern is lifted out of the Contract page. The ordering, shuffle, pickers' filter and privacy logic are done and tested. No new demo trigger is needed. Demo beats that edit a tier by one click, or make an anaesthetist inactive immediately, would gain Edit and Save steps and a last-day choice.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-01.3.6](../../requirements-board/requirements/stories/US-01.3.6.md) [Anaesthetist priority tiers for assignment](epics/EP-01.md#us-01.3.6) | Verify (3) | Contradicts | Tiers 1 to 4 (default 4), office-only privacy, tier then seeded-shuffle ordering and a 'Filter by tier' control on the finder and Draft List pickers are built. But the tier saves on a single click on its own card, which the story now forbids, and the Anaesthetists list in People has no tier filter. | M |
| [US-01.1.1](../../requirements-board/requirements/stories/US-01.1.1.md) [Two Slots per anaesthetist per day](epics/EP-01.md#us-01.1.1) | Agreed (4) | Partial | The AM and PM Slot per active anaesthetist per day, starting Free, with calendar and recurring bookings painted on top and no generated OOH Slot, is built; Donald's 25 Nov note (no Slots after a last day, Slots again from the day made active) is only approximated by an immediate trim or regenerate from today. | M |

Details for every gap: [epics/EP-01.md](epics/EP-01.md).

<a id="ep-02"></a>

### EP-02 · Booking intake and change handling

[EP-02](../../requirements-board/requirements/stories/EP-02.md) · epic status Verify (3) · 1 Partial

> Only US-02.1.4 was graded, and the verification upholds the reviewer. The core behaviour (stubs, waitingForNhi assessment, Unmatched filter, no Booking created) is built; the one gap is the Waiting for an NHI tab on Intake, the same work as US-11.1.5. Build it once, in Lane C or the People work, not twice. Touch points: IntakeScreen.tsx (INTAKE_TABS and a new tab screen), router.tsx (new /admin/intake/waiting route plus a redirect from /admin/patients/waiting), the MatchingTable link, the receive-no-nhi-list trigger's screen, routes and indexPath, and the Patients badge (patientAttentionCount should drop waitingNhiRows). Of these, router.tsx and SideNav badge logic overlap the Contracts files, so keep those edits small or sequence them. The Patients nav entry moves into the People section, so the waiting view should move to Intake before or together with that move. Demo-guide references (03-demo-script.md lines ~27, ~105, ~215) change paths only; the sweep handles them.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-02.1.4](../../requirements-board/requirements/stories/US-02.1.4.md) [Unmatched queue](epics/EP-02.md#us-02.1.4) | Verify (3) | Partial | Unmatched queue, no-NHI waiting (no Booking created) and the stub on the List all work per both acceptance criteria; the one gap is that rows waiting for an NHI are not shown on Intake as their own tab beside the unmatched rows (the view lives at /admin/patients/waiting under Patients), which the 25 Nov people-section decision (#9) now requires. | S |

Details for every gap: [epics/EP-02.md](epics/EP-02.md).

<a id="ep-03"></a>

### EP-03 · Booking and Procedure capture (anaesthetist)

[EP-03](../../requirements-board/requirements/stories/EP-03.md) · epic status Agreed (4) · 

<a id="ep-04"></a>

### EP-04 · Contracts

[EP-04](../../requirements-board/requirements/stories/EP-04.md) · epic status Verify (3) · 6 Partial, 3 Matches, 1 Grouping

> US-04.1.2 is split across phases: 45 (Disable confirmed, built), 46 (New contract page, order, similar-name hint, deletes the Replaces section), 47 (grouping, index, facets; closes the story). The remaining gap, the inactive anaesthetist Contract cascade and offer-back, is covered by none of 46 to 49. It depends on US-12.1.6 (anaesthetist last day and inactive state) and so belongs with the People work (Lane C domain and store half). It reuses disableContract and enableContract with a system actor, and adds a Contract-restore sheet on the anaesthetist record. The sheet can wait until Contracts files settle. OQ-144 (future-dated disable) is unresolved; the story says a Contract has no dates, so disableFromISO stays 'today', and any answer allowing a future-dated disable would contradict the No dates criterion. Shared files (ContractsView, ContractEditSheet, screens/contracts) are Lane A/B territory. The recipes using contract-holder-filter and contract-tag-filter change in Phase 47 and are left to the owner's sweep.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-04.1.2](../../requirements-board/requirements/stories/US-04.1.2.md) [Create, edit and disable Contracts](epics/EP-04.md#us-04.1.2) | Verify (3), [OQ-144](../../requirements-board/requirements/questions/OQ-144.md) | Partial | Active/Disabled lifecycle, confirmed Disable, no dates, Disabled review flag and fixed-after-creation rules match; the grouped list with index, the New contract page (order and similar-name hint) and the inactive-anaesthetist Contract cascade are missing. | L |
| [US-04.1.7](../../requirements-board/requirements/stories/US-04.1.7.md) [A page for each Contract](epics/EP-04.md#us-04.1.7) | Verify (3) | Partial | All the content of a Contract (price ranges, where offered, who it bills, names and codes, fixed settings, event fees, history, system-Contract limits) exists, but in one side panel with a single Save, with no page or route, no separately saved cards, no read-only Party billing block and no list of the Procedures on the Contract. | L |
| [US-04.1.8](../../requirements-board/requirements/stories/US-04.1.8.md) [Replace a Contract from a date](epics/EP-04.md#us-04.1.8) | Verify (3), [OQ-144](../../requirements-board/requirements/questions/OQ-144.md) | Partial | Only a warning-only 'Replaces' picker exists on create (it lists Procedures dated on or after a From date; nothing is stored, copied or moved); the one-action replace with ticking, leave-active-with-to-do or disable-now, late-disable listing from the change date and the not-a-fixed-price message is not built. | L |
| [US-04.1.5](../../requirements-board/requirements/stories/US-04.1.5.md) [Parties](epics/EP-04.md#us-04.1.5) | Verify (3), [OQ-114](../../requirements-board/requirements/questions/OQ-114.md) | Partial | The Party master, its rules (billing name and delivery once billed, email or post contact, hospital link, one AA) and a list including Contract-less Parties exist, but Parties are a Master data view with a side panel, rows are sorted not grouped by kind, and there is no per-funding-tag Contract count or link into the Contract list. | M |
| [US-04.2.15](../../requirements-board/requirements/stories/US-04.2.15.md) [Price ranges on a fixed price](epics/EP-04.md#us-04.2.15) | Verify (3) | Partial | Range semantics are right (unique starts, past starts allowed, implied end, never the last, range in force prices, backdated re-pricing, kept-price warning with list), but the table is the old layout: oldest first, no separate To or Change column, no count of Procedures priced, no folding of ended ranges after three. | M |
| [US-04.1.3](../../requirements-board/requirements/stories/US-04.1.3.md) [Contract audit](epics/EP-04.md#us-04.1.3) | Verify (3) | Partial | Audit with before and after already covers Party, Contract (create, update, disable, enable), price ranges, specialties, funding tags and RVG groups, never deleted, with a per-Contract history and locked Procedures; missing are card-by-card audited saves and the audit of a Replace from a date, both tied to US-04.1.7 and US-04.1.8. | S |

Details for every gap: [epics/EP-04.md](epics/EP-04.md).

**Matches (3):** [US-04.2.17](../../requirements-board/requirements/stories/US-04.2.17.md) Funding tag on a Contract · [US-04.3.8](../../requirements-board/requirements/stories/US-04.3.8.md) Where the invoice goes, then the Contract · [US-04.3.9](../../requirements-board/requirements/stories/US-04.3.9.md) The No contract backstops, RVG and Fixed price

**Grouping only (1):** [FT-04.1](../../requirements-board/requirements/stories/FT-04.1.md)

<a id="ep-05"></a>

### EP-05 · RVG master data and fee calculation rules

[EP-05](../../requirements-board/requirements/stories/EP-05.md) · epic status Agreed (4) · 

<a id="ep-06"></a>

### EP-06 · Prepayment

[EP-06](../../requirements-board/requirements/stories/EP-06.md) · epic status Verify (3) · 1 Partial

> Only US-06.3.1 was graded. Its behaviour is complete in the code (catch-up Phases 22, 27, 27a and 41). The remaining difference is structural and comes from the 26 Nov Finances-section requirements: Admin Invoices becomes the Invoices tab of a Finances section, and Awaiting approval becomes one of its filters (US-13.3.3, US-08.4.7). That should be built under those stories. This story then needs only entry links re-pointed (routes.tsx:178 and :228, notification and demo-trigger routes) and demo-guide wording. OQ-120 (naming the anaesthetist) and OQ-73 are open but state no requirement the prototype breaks: PREPAYMENT_NAMES_ANAESTHETIST = true is one constant, flagged provisional in the demo guide. OQ-140 (payer per Procedure) is already followed. Demo guide S4 Beat 1 (Invoices, Awaiting approval, switch) and the Day-view rail text 'awaiting approval on Invoices' will change when the section lands. The six US-06.3.1 screenshots will go stale, which is a sweep matter, not per-change work.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-06.3.1](../../requirements-board/requirements/stories/US-06.3.1.md) [Raise the prepayment invoice](epics/EP-06.md#us-06.3.1) | Verify (3), [OQ-120](../../requirements-board/requirements/questions/OQ-120.md), [OQ-73](../../requirements-board/requirements/questions/OQ-73.md) | Partial | All eight acceptance criteria are built and demonstrable; the only real gap is placement, since the story now puts approval under Awaiting approval on the Finances section's Invoices tab and the prototype has no Finances section. | S |

Details for every gap: [epics/EP-06.md](epics/EP-06.md).

<a id="ep-07"></a>

### EP-07 · List approval workflow

[EP-07](../../requirements-board/requirements/stories/EP-07.md) · epic status Agreed (4) · 

<a id="ep-08"></a>

### EP-08 · Billing/Invoice Engine and internal ledger

[EP-08](../../requirements-board/requirements/stories/EP-08.md) · epic status Agreed (4) · 1 Contradicts

> US-08.4.7 depends on the Finances section (US-13.3.3), which exists only as requirements and an exploration. The Invoices screen is still a standalone nav section with its own /admin/invoices routes, so moving it into a Finances tab and renaming routes is a structural change shared with the other Finances stories (Payments, AA fees, Billing, Ledger tabs). Amount received and still owed already live in the ledger (receivables, receipts, receivableOutstanding); the list needs a selector joining them to each invoice and credit note, an age from the demo clock (DEMO_TODAY 2026-11-24), a state filter (Unpaid default) and a broader search (payable number, case reference, patient, anaesthetist). Changing the default to Unpaid affects any demo beat that lands on Invoices to find a paid invoice, and InvoicesSearch.test.tsx and demoGuideSync may need updating. AA fee invoices are already excluded, matching the story. Awaiting approval is currently a tab and the story wants it as a filter beside the state filters. Status is Verify (3) and the notes say the change has not yet been seen by AA, so the grading is against the text as written.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-08.4.7](../../requirements-board/requirements/stories/US-08.4.7.md) [Find any invoice](epics/EP-08.md#us-08.4.7) | Verify (3) | Contradicts | The Invoices screen is a standalone side-nav section that opens on All invoices and searches only invoice or credit-note number and addressee; it has no still-owed, Unpaid/Part paid/Paid state, age, state filter, or search by payable number, case reference, patient or anaesthetist. | M |

Details for every gap: [epics/EP-08.md](epics/EP-08.md).

<a id="ep-09"></a>

### EP-09 · Xero integration

[EP-09](../../requirements-board/requirements/stories/EP-09.md) · epic status Proposed (1) · 

<a id="ep-10"></a>

### EP-10 · Payments, disbursement and AA fees

[EP-10](../../requirements-board/requirements/stories/EP-10.md) · epic status Agreed (4) · 3 Partial, 1 Matches

> All four gradings upheld after re-opening the catalogue files and code. The substance of EP-10's four in-scope stories is built: US-10.2.4 as the Xero simulator's bank reconciliation (fully matches), US-10.2.7 as the Payment cycle panel plus run and remittance pages, US-10.3.1 and US-10.3.3 as the AA fees screen with a Fee settings sub-tab. The gaps since the 64b3dff7 baseline are structural, driven by the 26 Nov Finances section (US-13.3.3): grep finds no Finances anywhere in aa-prototype/src, no /admin/finances route, and SideNav.tsx:81-85 still has separate Invoices, Billing monitor and Ledger entries. So 10.2.7 (Payments tab, run pages under it, back link), 10.3.1 (AA fees tab) and 10.3.3 (settings beside invoices and run) all depend on building the Finances shell first, with old /admin/billing/* addresses still opening. The one content-level gap is US-10.3.1's 'opens on unpaid' criterion: selectors.ts:1639-1654 sorts newest-first with no unpaid-first ordering. The 'no number when nothing is due' rule for Payments and AA fees belongs to US-13.3.3, not these stories. Open questions OQ-149 (where an unplaceable receipt is parked; not graded as a gap), OQ-60, OQ-112 and OQ-47 mean the prototype's provisional readings (fee at month end, BCTI counted once when paid, separate invoice, weekly Friday/Monday/Tuesday days) are only as settled as those questions. Demo-guide impact: docs/demo-guide/03-demo-script.md routes and the S3 beats that say 'Admin > Billing monitor', 'Payment cycle panel', 'Open AA fee invoices > Fee settings' (and the S4 hold-out beat) would change navigation wording and screenshots only; no scripted values (week names, totals, remittance content) change. Demo triggers keyed to the /admin/billing and /admin/billing/aa-fees routes in registry.ts would need their route lists updated when the tabs move. Existing triggers (stage-payment-week, stage-bank-mismatch, run-scheduled-fee-run, seed-month-of-bctis, record-fee-payment, xero-bulk-remittance) already cover every automatic or external behaviour in this epic's in-scope stories.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-10.2.7](../../requirements-board/requirements/stories/US-10.2.7.md) [Weekly payment cycle](epics/EP-10.md#us-10.2.7) | Proposed (1) | Partial | The weekly ISO-week cycle, Friday close and bank reconciliation, Monday anomalies held out and rolled to the next week, Tuesday payment schedule, week on payments, per-run pages with remittance advices and an earlier-runs list are all built, but on the Billing monitor and /admin/billing/payment-runs, not on a Payments tab of a Finances section (none exists). | M |
| [US-10.3.1](../../requirements-board/requirements/stories/US-10.3.1.md) [Generate AA fee invoices](epics/EP-10.md#us-10.3.1) | Verify (3), [OQ-112](../../requirements-board/requirements/questions/OQ-112.md), [OQ-60](../../requirements-board/requirements/questions/OQ-60.md) | Partial | The monthly run, preview and fee total ($500 fixed + $5 x 40 = $700) are built, and fee invoices are kept off the Invoices screen and tracked as aaFee ledger pairs; but there is no AA fees tab of a Finances section and the fee invoice list is newest-first, not unpaid-first. | S |
| [US-10.3.3](../../requirements-board/requirements/stories/US-10.3.3.md) [AA fee settings](epics/EP-10.md#us-10.3.3) | Verify (3), [OQ-60](../../requirements-board/requirements/questions/OQ-60.md) | Partial | Fee settings (several fixed items plus a per-BCTI charge, stored in appSettings, applied from the next run) are built and meet both acceptance criteria, but sit on a separate 'Fee settings' sub-tab under Billing, not on the AA fees tab of a Finances section beside the invoices and the run. | S |

Details for every gap: [epics/EP-10.md](epics/EP-10.md).

**Matches (1):** [US-10.2.4](../../requirements-board/requirements/stories/US-10.2.4.md) Bulk remittance stays in Xero

<a id="ep-11"></a>

### EP-11 · Patients and billable parties

[EP-11](../../requirements-board/requirements/stories/EP-11.md) · epic status Verify (3) · 3 Contradicts, 2 Partial, 1 Grouping

> EP-11 is largely built and the gaps are structural, all from the 25 Nov People-section decision (note AR-70). I confirmed each reviewer finding against the code and found no false Matches; the one correction is the shared-note evidence in US-11.3.3. (1) Waiting for NHI moves to a tab on Intake (US-11.1.4 and US-11.1.5). The change is IntakeScreen.tsx INTAKE_TABS, a new Intake route entry, a redirect from /admin/patients/waiting, and WaitingNhiView moving out of patients/. It does not need the People section, so it fits a People lane in Wave 1. It touches shared files: router.tsx (one route) and AdminApp.tsx (the badge). Flag those against the Contracts lanes. (2) The Patients badge double-counts waiting rows today (patientAttentionCount adds waitingNhiRows, and the Intake badge matchingAttentionCount already counts every open row). Remove them from the patient count in the same change. (3) Needs follow-up (US-11.3.3) and the list filters, paging and defaults (US-11.3.1) are one piece of work. patientSearch needs Coming up (default), Needs follow-up and All filters with paging. Needs follow-up needs a one-row-per-patient selector with reasons, a People badge counting distinct patients (strong and mild warnings alike, no waiting rows), and the Clear/Done actions moved onto the patient's page. The selector and domain part could run in the People lane before the section move, but the screen work lands on the Patients screen that moves. Doing both together after the move is simpler. (4) The section move (US-11.1.1, US-11.3.1): the People nav entry, routes and redirects for /admin/patients/*, and the Patients tab of People. PatientRecord's content is already the intended pattern (NHI pill beside the name, Details rail with own audited Edit, Details differ card, invoices, alerts and follow-up log), so adopting the shared record page lifted from the Contract page is a refactor. It depends on that lift and on router.tsx, SideNav.tsx, AdminApp.tsx, apps/admin/routes.tsx and masterViews.ts, so it waits for Wave 1 to join. (5) Already matching: dedupe and dedupe-never-overwrites with held details, mandatory NHI, stubs on Lists in all three apps, one-address chase, Urgent marking within 3 days, follow-up log kinds with audited resend, shared notes (addSharedNote, all three apps), and invoices across anaesthetists with status and balance. Demo guide impact (left to the owner's sweep): S2 patient beat paths (/admin/patients/CQY9304), the Waiting for NHI beats ('Patients → Waiting for NHI', Receive list counts) and the NHI register refresh beat ('Patients → Search') change their paths and labels. Cross-epic links: US-13.4.1 (People section), US-02.6.1 (stubs), US-02.1.4 (unmatched rows), US-13.6.5 (surgeon office contacts), US-11.3.2 (balance warning).

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-11.1.5](../../requirements-board/requirements/stories/US-11.1.5.md) [Intake rows waiting for an NHI](epics/EP-11.md#us-11.1.5) | Verify (3) | Contradicts | All row behaviour exists (patient as received, one address to chase, Urgent when close, Add NHI matches the single record, stub on the List), but the view is Patients > Waiting for NHI instead of an Intake tab, and the Patients badge counts the waiting rows that the Intake badge already counts. | M |
| [US-11.3.1](../../requirements-board/requirements/stories/US-11.3.1.md) [Patient outstanding bills view](epics/EP-11.md#us-11.3.1) | Verify (3) | Contradicts | Name, NHI and DOB search and per-patient invoices across every anaesthetist (paid, part paid, unpaid, balance) work, but the list is the older Search view, whose empty default mixes upcoming and needing-follow-up patients and which caps at 50 with no paging. There is no Coming up, Needs follow-up or All filter, and it is a top-level section, not a tab of People. | M |
| [US-11.3.3](../../requirements-board/requirements/stories/US-11.3.3.md) [Follow-up tools](epics/EP-11.md#us-11.3.3) | Verify (3) | Contradicts | The follow-up log (call, note, reminder with due date, audited resends with invoice number) and the shared note on a List or Booking are built, but Needs follow-up is three separate sections where a patient can appear more than once, actions are taken on the list rows, and the nav count is not the number of patients on the list. | M |
| [US-11.1.1](../../requirements-board/requirements/stories/US-11.1.1.md) [Patient record keyed on NHI](epics/EP-11.md#us-11.1.1) | Verify (3) | Partial | Dedupe on NHI, NHI beside the name with no internal id, Details side panel with own audited Edit, and held differing details all work; the page is reached from the separate Patients section, not a Patients tab of People, and the shared record-page pattern it should follow does not exist yet. | S |
| [US-11.1.4](../../requirements-board/requirements/stories/US-11.1.4.md) [Patient without NHI](epics/EP-11.md#us-11.1.4) | Verify (3) | Partial | Mandatory NHI, no Booking or patient from a no-NHI row, stub on the List, and Add NHI then match are all built; only the placement differs: the waiting rows are a Patients tab, not a tab on Intake beside the unmatched rows. | S |

Details for every gap: [epics/EP-11.md](epics/EP-11.md).

**Grouping only (1):** [FT-11.1](../../requirements-board/requirements/stories/FT-11.1.md)

<a id="ep-12"></a>

### EP-12 · Anaesthetist profile and reporting

[EP-12](../../requirements-board/requirements/stories/EP-12.md) · epic status Proposed (1) · 2 Contradicts, 1 Grouping

> All three gradings are upheld after re-opening the code. FT-12.1 is a pure Grouping. US-12.1.4 and US-12.1.6 both Contradict, because two older readings are implemented: the tier saves on click, and active is an immediate boolean that trims Slots from today. Each is large (size L) on its own. Lane placement. The domain, store and sign-in half of US-12.1.6 fits Lane C in Wave 1, because it touches none of the Contracts-owned files. That half covers: - a last-day date and reason on the Anaesthetist type; - audited make-inactive, clear and make-active actions; - Slots trimmed only after the last day; - sign-in checked against the master record; - own-Party Contracts disabled and offered back. The new Anaesthetist fields need a PERSIST_VERSION bump and a seed review. Moving the tier into a card with the rate is also Lane C-safe as store and domain work. The per-card Edit/Save, the side panel and the People move itself need the record pattern lifted out of ContractCards.tsx and ProfileChrome.tsx, plus router/SideNav/masters redirect changes, so they wait for Wave 1 to join. Interactions to coordinate: - Disabling and re-enabling an anaesthetist's Contracts uses disableContract and enableContract from Phase 45. Phase 49 (Replace a Contract from a date) also changes Contract status, and the Contract identity there is linkedAnaesthetistId plus the holder Party. - The shared anaesthetistSession.ts is in the PWA closure and must stay pure (pwaPurity.test.ts). Reading active from the master record therefore needs a small injected check or a store-side hook, not an import from the store. - OQ-147 and OQ-83 are open, so departed-anaesthetist remittance access stays narrated. - The Anaesthetists list also needs search, tier filter and paging, which are absent today. Demo guide: S1 to S5 do not use make-inactive or the tier control, so the impact is additive (a new beat on the demo clock). The Dr Sharma record path in the guide changes with the People move, which is for the sweep.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-12.1.4](../../requirements-board/requirements/stories/US-12.1.4.md) [Anaesthetist identity, contact and bank details](epics/EP-12.md#us-12.1.4) | Verify (3) | Contradicts | Identity, contact and bank details exist, and HPI CPN and bank details are mandatory. The tier saves on click on its own card, one editor sheet covers every field, and there is no side panel, no People section and no list search, filter or paging. These contradict the per-card Edit/Save, rate-and-tier-together and side-panel requirements. | L |
| [US-12.1.6](../../requirements-board/requirements/stories/US-12.1.6.md) [Make an anaesthetist inactive](epics/EP-12.md#us-12.1.6) | Verify (3), [OQ-147](../../requirements-board/requirements/questions/OQ-147.md) | Contradicts | Active/Inactive is an immediate boolean in the edit sheet that trims Slots from today. There is no last day, reason, dedicated action, clear-in-time, sign-in effect, Contract disabling or make-active offer. The refusal is also keyed to Lists from today, not after a chosen last day. | L |

Details for every gap: [epics/EP-12.md](epics/EP-12.md).

**Grouping only (1):** [FT-12.1](../../requirements-board/requirements/stories/FT-12.1.md)

<a id="ep-13"></a>

### EP-13 · Admin oversight and master data

[EP-13](../../requirements-board/requirements/stories/EP-13.md) · epic status Agreed (4) · 4 Contradicts, 6 Partial, 1 Missing

> All six items graded on code re-read. The prototype has every underlying screen (Billing monitor, Invoices, Ledger, payment cycle, AA fees, Xero queue and divergence panels, reconciliation status) but no Finances container: grep for 'finances' in aa-prototype/src finds nothing, and the side nav has Invoices, Billing monitor and Ledger as three items. The work is structural. First, a Finances section with six routed tabs (Billing, Invoices, Payments, Ledger, Xero, AA fees), tab counts and one warning badge, keeping the old /admin/invoices, /admin/billing and /admin/ledger addresses resolving. Second, the monolithic BillingMonitorScreen must be split: the Xero queue and divergence panels go to Xero, PaymentCyclePanel and the payment-run pages to Payments, AaFeePanel and AaFeesScreen to AA fees, and HoldingAccountPanel to the Ledger list. Third, the Billing tab gets rebuilt as the Problems-first option C table (List heading with Bookings as rows) with Problems/In progress/Done/All filters, search and a fix-the-payer action, which needs a new failure path (payer with no billing email) in the domain, store and seed. Fourth, the Ledger loses the Whole ledger / One anaesthetist switch and gains the four-figure header, a three-way list and per-anaesthetist rows that open account pages. Two items are Contradicts (US-13.2.1 and, corrected from Partial, US-13.3.1) because the prototype implements designs the catalogue now says were considered and not kept. OQ-149 (where an unplaceable receipt is placed) is open and touches the Ledger place/refund actions, the receipts-to-place figure and the reconciliation unresolved items, so build those provisionally. US-13.2.4 is Proposed and waits on the posting design (clearing account, sub-ledger against control account), which the code header says is deliberately not modelled. Demo triggers: billing-failure and arm-handoff-fault (screen BILLING_MONITOR_SCREEN), xero-outage and inject-unmatched-receipt (screen 'Admin · Ledger') are keyed by screen and must be re-pointed at the new tab routes; add 'Payer loses billing email' for the fix-the-payer beat, and optionally 'Leave money in clearing account' on the Day screen if the extra reconciliation checks are built. Demo-guide impact (docs/demo-guide/03-demo-script.md): S3 Money end to end (Billing monitor, AA fee invoices and Ledger beats, plus the direct-URL table) and S4 Exceptions (Holding account card, billing failure, Xero outage, changed-in-Xero, refund after payout, payment week) change navigation and wording; the Ledger beat changes most. The demoGuideSync test, capture recipes and ATLAS belong to the owner's sweep, not this work. Read-only; no files modified.

| Item | Status | Verdict | Gap | Size |
|---|---|---|---|---|
| [US-13.4.1](../../requirements-board/requirements/stories/US-13.4.1.md) [Maintain reference tables](epics/EP-13.md#us-13.4.1) | Verify (3), [OQ-148](../../requirements-board/requirements/questions/OQ-148.md) | Contradicts | Master data, the Contracts section and per-card editing on the Contract page exist, but the prototype still keeps a Surgeon groups list that the story now says must not exist, plus no People section and no search, filter or paging on the people lists. | XL |
| [US-13.2.1](../../requirements-board/requirements/stories/US-13.2.1.md) [Ledger balance views](epics/EP-13.md#us-13.2.1) | Verify (3), [OQ-149](../../requirements-board/requirements/questions/OQ-149.md) | Contradicts | A rich Ledger screen exists, but it keeps the Whole ledger / One anaesthetist switch that the catalogue explicitly considered and did not keep, and lacks the four-figure set, the three-way list and the per-anaesthetist account row columns. | L |
| [US-13.3.1](../../requirements-board/requirements/stories/US-13.3.1.md) [Billing status of each List and Booking](epics/EP-13.md#us-13.3.1) | Verify (3) | Contradicts | The prototype's per-anaesthetist Billing monitor implements the 'Lists that unfold into their Bookings' layout the catalogue considered and did not build, and opens on All lists rather than Problems; it also lacks the filter set, search and fix-the-payer action. | L |
| [US-13.6.2](../../requirements-board/requirements/stories/US-13.6.2.md) [Surgeon profile](epics/EP-13.md#us-13.6.2) | Verify (3), [OQ-143](../../requirements-board/requirements/questions/OQ-143.md), [OQ-148](../../requirements-board/requirements/questions/OQ-148.md) | Contradicts | A surgeon page and list exist with unique optional HPI CPN, practice text and contacts, but the profile still has a Groups card (a surgeon now belongs to no group), saves all fields in one sheet instead of card by card, has no side panel of Contracts and next Lists, and the list has no search, filter or paging. | L |
| [US-13.2.4](../../requirements-board/requirements/stories/US-13.2.4.md) [Reconciliation status at a glance](epics/EP-13.md#us-13.2.4) | Proposed (1), [OQ-149](../../requirements-board/requirements/questions/OQ-149.md) | Partial | A derived 'Books square / Out of balance' status with unresolved items (amount, age) exists on the Admin Day dashboard, but it checks only the ledger, ledger against Xero and Xero bank lines; the clearing-account (should read zero) and sub-ledger against control-account checks are deliberately not modelled. Story is Proposed (1); OQ-149 open. | M |
| [US-13.3.2](../../requirements-board/requirements/stories/US-13.3.2.md) [Manual intervention](epics/EP-13.md#us-13.3.2) | Verify (3) | Partial | The Xero sync queue (attempts, next try, last error, Retry now), the changed-in-Xero panel with per-item resolve, and Booking-level retry exist, and a stuck hand-off shows in both the queue and the List's Booking row, but on one Billing monitor page rather than separate Xero and Billing tabs, and there is no fix-the-payer or mark-resolved action. | M |
| [US-13.4.4](../../requirements-board/requirements/stories/US-13.4.4.md) [Specialties](epics/EP-13.md#us-13.4.4) | Verify (3) | Partial | The list behaviour (broad names, audited add/rename/remove, remove refused while held, a rename reaching holders by id) is right, but it lives in Master data and there is no per-specialty page listing its surgeons and Contracts. | M |
| [US-13.5.3](../../requirements-board/requirements/stories/US-13.5.3.md) [Sign in to the anaesthetist app](epics/EP-13.md#us-13.5.3) | Verify (3), [OQ-147](../../requirements-board/requirements/questions/OQ-147.md), [OQ-83](../../requirements-board/requirements/questions/OQ-83.md) | Partial | The simulated account sign-in exists and is audited, but the inactive rule (refused after the last day, allowed on it, restored on reactivation) is not implemented and there is no last day or demo path. | M |
| [FT-13.3](../../requirements-board/requirements/stories/FT-13.3.md) [Billing flow monitoring](epics/EP-13.md#ft-13.3) | Agreed (4) | Partial | The billing-flow monitoring content exists (List-to-Xero stages, per-Booking failures, Xero queue) but lives on a stand-alone Billing monitor screen, not in a Finances section; the relocation itself is carried by US-13.3.3. | S |
| [US-13.4.5](../../requirements-board/requirements/stories/US-13.4.5.md) [Funding tags](epics/EP-13.md#us-13.4.5) | Verify (3) | Partial | The funding tag list (code, funder Party, step-rail order, audited add, edit and remove, Suggested path from the funder) works as required, but it lives in Master data rather than a Contracts-section tab, and picking a tag shows no Contracts grouped by hospital with counts (only one total per tag). | S |
| [US-13.3.3](../../requirements-board/requirements/stories/US-13.3.3.md) [The Finances section](epics/EP-13.md#us-13.3.3) | Verify (3) | Missing | There is no Finances section: the side nav has separate Invoices, Billing monitor and Ledger items, with no tabbed container, tab counts or single warning badge. | L |

Details for every gap: [epics/EP-13.md](epics/EP-13.md).

<a id="ep-14"></a>

### EP-14 · Health systems integration

[EP-14](../../requirements-board/requirements/stories/EP-14.md) · epic status Proposed (1) · 

<a id="ep-15"></a>

### EP-15 · Non-functional requirements

[EP-15](../../requirements-board/requirements/stories/EP-15.md) · epic status Proposed (1) · 

## Excluded from this analysis

Retired items, stories in the Future Work lane and features whose live stories are all there were not graded. The reverse check above covers retired behaviour the prototype still has.

[FT-04.4](../../requirements-board/requirements/stories/FT-04.4.md) Default Contracts for hospitals, insurers and procedures (Retired (6)) · [FT-06.1](../../requirements-board/requirements/stories/FT-06.1.md) Prepaid procedure settings on the anaesthetist profile (Retired (6)) · [FT-06.4](../../requirements-board/requirements/stories/FT-06.4.md) Settlement after the procedure (Retired (6)) · [FT-11.4](../../requirements-board/requirements/stories/FT-11.4.md) Insurers (Retired (6)) · [FT-14.1](../../requirements-board/requirements/stories/FT-14.1.md) HL7 v2 inbound (Proposed (1)) · [FT-14.2](../../requirements-board/requirements/stories/FT-14.2.md) FHIR R4 (Proposed (1)) · [FT-14.3](../../requirements-board/requirements/stories/FT-14.3.md) Near real time (Proposed (1)) · [FT-14.5](../../requirements-board/requirements/stories/FT-14.5.md) Reliability and monitoring (Proposed (1)) · [FT-14.6](../../requirements-board/requirements/stories/FT-14.6.md) Further hospital feeds and automatic matching (Proposed (1)) · [US-01.3.4](../../requirements-board/requirements/stories/US-01.3.4.md) AM and PM can differ (Retired (6)) · [US-02.1.5](../../requirements-board/requirements/stories/US-02.1.5.md) Automatic sync from St George's and Southern Cross (Proposed (1), Future Work) · [US-02.2.2](../../requirements-board/requirements/stories/US-02.2.2.md) Edit then ingest (Retired (6)) · [US-02.2.3](../../requirements-board/requirements/stories/US-02.2.3.md) Detect Bookings removed from a re-sent List (Verify (3), Future Work) · [US-02.3.5](../../requirements-board/requirements/stories/US-02.3.5.md) Send booking change emails automatically (Proposed (1), Future Work) · [US-02.4.2](../../requirements-board/requirements/stories/US-02.4.2.md) Photo capture of the physical card (Retired (6)) · [US-02.4.3](../../requirements-board/requirements/stories/US-02.4.3.md) Copy a Booking (Retired (6)) · [US-02.4.4](../../requirements-board/requirements/stories/US-02.4.4.md) Add a Booking from a photo of the booking card (Proposed (1), Future Work) · [US-02.5.1](../../requirements-board/requirements/stories/US-02.5.1.md) Apply a modification (Agreed (4), Future Work) · [US-02.5.2](../../requirements-board/requirements/stories/US-02.5.2.md) Reschedule to another day arrives as cancel and new Booking (Agreed (4), Future Work) · [US-02.5.3](../../requirements-board/requirements/stories/US-02.5.3.md) Record a cancellation (Agreed (4), Future Work) · [US-02.5.4](../../requirements-board/requirements/stories/US-02.5.4.md) Inbound changes accepted until the List is authorised (Agreed (4), Future Work) · [US-02.5.6](../../requirements-board/requirements/stories/US-02.5.6.md) Concurrent edits (Proposed (1), Future Work) · [US-03.1.3](../../requirements-board/requirements/stories/US-03.1.3.md) Attachments (Retired (6)) · [US-03.3.2](../../requirements-board/requirements/stories/US-03.3.2.md) Override a ranged base code (Retired (6)) · [US-03.3.5](../../requirements-board/requirements/stories/US-03.3.5.md) Itemise modifiers (Retired (6)) · [US-03.3.6](../../requirements-board/requirements/stories/US-03.3.6.md) Other billing lines (Retired (6)) · [US-03.3.7](../../requirements-board/requirements/stories/US-03.3.7.md) Rate x time capture (Retired (6)) · [US-03.5.3](../../requirements-board/requirements/stories/US-03.5.3.md) Adjustment reason (Retired (6)) · [US-04.1.6](../../requirements-board/requirements/stories/US-04.1.6.md) Stage Contract changes for review, then submit (Retired (6)) · [US-04.2.10](../../requirements-board/requirements/stories/US-04.2.10.md) Contract prices effective from a date (Retired (6)) · [US-04.2.12](../../requirements-board/requirements/stories/US-04.2.12.md) Payment setting: full payment or split (Retired (6)) · [US-04.2.13](../../requirements-board/requirements/stories/US-04.2.13.md) Export and re-import Contracts (Verify (3), Future Work) · [US-04.2.3](../../requirements-board/requirements/stories/US-04.2.3.md) Base unit override (Retired (6)) · [US-04.2.4](../../requirements-board/requirements/stories/US-04.2.4.md) Contract lines (Retired (6)) · [US-04.2.5](../../requirements-board/requirements/stories/US-04.2.5.md) Multi-procedure rule per Contract (Retired (6)) · [US-04.2.6](../../requirements-board/requirements/stories/US-04.2.6.md) Adjustment and override permissions (Retired (6)) · [US-04.2.7](../../requirements-board/requirements/stories/US-04.2.7.md) Required booking inputs (Retired (6)) · [US-04.2.9](../../requirements-board/requirements/stories/US-04.2.9.md) Organisational and individual Contracts (Retired (6)) · [US-04.3.6](../../requirements-board/requirements/stories/US-04.3.6.md) Hospital data sets the Contract (Proposed (1), Future Work) · [US-04.3.7](../../requirements-board/requirements/stories/US-04.3.7.md) Confirm a price with the hospital (Verify (3), Future Work) · [US-04.4.1](../../requirements-board/requirements/stories/US-04.4.1.md) Mandatory default Contract (Retired (6)) · [US-04.4.2](../../requirements-board/requirements/stories/US-04.4.2.md) Default RVG Contract for every procedure (Retired (6)) · [US-05.1.2](../../requirements-board/requirements/stories/US-05.1.2.md) Add AA codes (Retired (6)) · [US-05.1.6](../../requirements-board/requirements/stories/US-05.1.6.md) Procedure master mapped to RVG codes (Retired (6)) · [US-05.2.3](../../requirements-board/requirements/stories/US-05.2.3.md) Conditional positioning modifier (Retired (6)) · [US-05.2.4](../../requirements-board/requirements/stories/US-05.2.4.md) Contract rate or discount (Retired (6)) · [US-05.3.2](../../requirements-board/requirements/stories/US-05.3.2.md) Time units on every Procedure (Retired (6)) · [US-05.3.3](../../requirements-board/requirements/stories/US-05.3.3.md) Modifier split above four units (Retired (6)) · [US-05.3.4](../../requirements-board/requirements/stories/US-05.3.4.md) Contract-specific second-procedure rules (Retired (6)) · [US-06.1.1](../../requirements-board/requirements/stories/US-06.1.1.md) Tick procedures or groups (Retired (6)) · [US-06.1.2](../../requirements-board/requirements/stories/US-06.1.2.md) Admin can maintain on behalf (Retired (6)) · [US-06.2.3](../../requirements-board/requirements/stories/US-06.2.3.md) Prepayment is an estimate (Retired (6)) · [US-06.2.4](../../requirements-board/requirements/stories/US-06.2.4.md) Calculate the prepayment estimate (Retired (6)) · [US-06.2.5](../../requirements-board/requirements/stories/US-06.2.5.md) Estimated duration from the surgeon's rooms (Retired (6)) · [US-06.3.3](../../requirements-board/requirements/stories/US-06.3.3.md) Alert on unpaid prepayment (Retired (6)) · [US-06.4.2](../../requirements-board/requirements/stories/US-06.4.2.md) No automatic credit when prepaid exceeds final (Retired (6)) · [US-07.1.2](../../requirements-board/requirements/stories/US-07.1.2.md) Cannot submit an incomplete List (Retired (6)) · [US-08.1.2](../../requirements-board/requirements/stories/US-08.1.2.md) Contract already resolved (Retired (6)) · [US-09.1.2](../../requirements-board/requirements/stories/US-09.1.2.md) InvoiceNumber and Reference (Retired (6)) · [US-09.3.2](../../requirements-board/requirements/stories/US-09.3.2.md) NHI never sent to Xero (Retired (6)) · [US-10.2.2](../../requirements-board/requirements/stories/US-10.2.2.md) Partial payment releases exactly that amount (Retired (6)) · [US-11.1.3](../../requirements-board/requirements/stories/US-11.1.3.md) Deduplicate on NHI (Retired (6)) · [US-11.4.1](../../requirements-board/requirements/stories/US-11.4.1.md) Insurer master data (Retired (6)) · [US-11.4.2](../../requirements-board/requirements/stories/US-11.4.2.md) Insured patient who forwards the invoice (Retired (6)) · [US-12.1.2](../../requirements-board/requirements/stories/US-12.1.2.md) GST period (Retired (6)) · [US-12.1.3](../../requirements-board/requirements/stories/US-12.1.3.md) Prepaid procedures (Retired (6)) · [US-12.1.5](../../requirements-board/requirements/stories/US-12.1.5.md) Bank details for disbursement (Retired (6)) · [US-13.2.3](../../requirements-board/requirements/stories/US-13.2.3.md) Per-anaesthetist balance (Retired (6)) · [US-13.6.1](../../requirements-board/requirements/stories/US-13.6.1.md) Surgeons' rooms master record (Retired (6)) · [US-13.7.4](../../requirements-board/requirements/stories/US-13.7.4.md) Warning and check-step settings (Proposed (1), Future Work) · [US-14.1.1](../../requirements-board/requirements/stories/US-14.1.1.md) Parse SIU messages (Proposed (1), Future Work) · [US-14.2.1](../../requirements-board/requirements/stories/US-14.2.1.md) Internal booking model (Proposed (1), Future Work) · [US-14.3.1](../../requirements-board/requirements/stories/US-14.3.1.md) Real-time processing (Proposed (1), Future Work) · [US-14.5.1](../../requirements-board/requirements/stories/US-14.5.1.md) Integration failure visibility (Proposed (1), Future Work) · [US-14.6.1](../../requirements-board/requirements/stories/US-14.6.1.md) Feeds from the other Christchurch providers (Proposed (1), Future Work) · [US-14.6.2](../../requirements-board/requirements/stories/US-14.6.2.md) Automatic matching and updates (Proposed (1), Future Work)

<a id="verification-log"></a>

## Verification log

Each epic's gradings were re-checked from scratch by a separate verifier told to refute them. 5 corrections:

| Item | From | To | Why |
|---|---|---|---|
| [US-01.3.6](../../requirements-board/requirements/stories/US-01.3.6.md) | Contradicts | Contradicts | Re-opened AnaesthetistRecord.tsx, AnaesthetistsView.tsx and EditAnaesthetistSheet.tsx and upheld the Contradicts verdict and all four gaps. Only the size changed, from S to M. The requirement puts the tier and the rate per unit on one card changed by Edit, choose, Save, so the Profile card's rate editing (now in a sheet) also has to move into that card, with the tier and rate saved as separate audited changes. This is more than a one-hour tweak, and it overlaps the People record pattern. It stays in admin screen files that Contracts phases 45 to 49 do not touch, so it is still a Lane C candidate. |
| [US-04.2.15](../../requirements-board/requirements/stories/US-04.2.15.md) | Partial | Partial | Corrected one point: the reviewer said the end is not shown, but ContractPriceRanges.tsx:174 renders rangeSpanText in the In force column, so the implied end is visible (only a distinct To column is missing). Verdict stays Partial: the other columns, newest-first order and folding are missing. Not Contradicts, since nothing implemented is wrong. |
| [US-11.3.3](../../requirements-board/requirements/stories/US-11.3.3.md) | Contradicts | Contradicts | Verdict and gaps upheld after re-reading FollowUpView and patientAttentionCount. Corrected the evidence: the reviewer cited logListNote (lifecycle.ts:438), which is office-only. The 'anyone can write a shared note' rule is actually met by addSharedNote / SharedNotes (shared/notes), so the shared-note criterion holds. Also added that the badge counts items, not distinct patients. |
| [US-13.3.1](../../requirements-board/requirements/stories/US-13.3.1.md) | Partial | Contradicts | Regraded Partial to Contradicts. The implemented screen opens on All lists (the story says Problems) and unfolds each List into its Bookings, which the story's Notes list under 'Considered and not built'; by the rubric any wrong implemented behaviour outranks Partial. All the reviewer's missing points re-checked and kept (no search, no fix-payer, no In progress/Done); demo_trigger filled in since the reviewer left it blank but proposed one for US-13.3.2. Size L kept. |
| [US-13.4.1](../../requirements-board/requirements/stories/US-13.4.1.md) | Partial | Contradicts | Re-opened masterViews.ts, SurgeonsView.tsx, SurgeonProfile.tsx, SurgeonEditSheet.tsx, AnaesthetistRecord.tsx and SpecialtiesView.tsx; all the reviewer's evidence holds. Changed Partial to Contradicts: the 'No surgeon group record' acceptance criterion now says no such list exists, and the prototype implements exactly that list (and a Groups card), which is wrong behaviour rather than merely absent behaviour. Added that the anaesthetist record also edits through one sheet, so one-card-one-change holds only on the Contract page. |
