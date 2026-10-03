# AA Prototype · Requirements catch-up roadmap

The prototype was built in July 2026 against the original RFP (phases 00 to 13, see
[../ROADMAP.md](../ROADMAP.md)). The requirements catalogue is now the source of truth and has moved
a long way from the RFP. This catch-up brings the prototype up to the catalogue as at commit
**`3d3a18c`**. Future and Retired items are out; retired behaviour the prototype still has is removed
or reworked. The plan was updated on 2026-10-01 for the AA meeting with Greg
([change log](../../discovery-reference/Updated%20Requirements/changes/2026-10-01-requirements-update.md)),
and again on 2026-10-03 for the three 2026-10-02 meetings with Greg (change logs:
[morning](../../discovery-reference/Updated%20Requirements/changes/2026-10-02-requirements-update.md),
[requirements review](../../discovery-reference/Updated%20Requirements/changes/2026-10-02-aa-requirements-review-with-greg.md),
[booking and pricing review](../../discovery-reference/Updated%20Requirements/changes/2026-10-02-aa-booking-and-pricing-review-with-greg.md)):
fourteen more questions answered (D12 to D25), a shared notification pool, single-Booking moves,
events as one element on the Procedure, base units on default RVG Contracts, the Contract defined
rate, Copy a Booking retired, and the whole gap analysis re-graded (new deltas DM-41 to DM-47 and
findings RV-23 to RV-32).

The plan closes every verified gap in the [gap analysis](GAP-ANALYSIS.md): 208 gap items, 46
data-model deltas (DM) and 29 reverse findings (RV), with nothing parked. Per-gap detail is in
[epics/](epics/), the machine-readable set in [gaps.json](gaps.json), and the code index in
[analysis/](analysis/) (prototype maps, [data-model delta](analysis/domain-model-delta.md),
[reverse check](analysis/reverse-check.md)).

There are forty-one phases, numbered from 14 (about 69 sessions in all). Phases added in updates
carry a letter suffix (15a, 15b, 19a, 32a, 38a, 38b, 39a, 39b, 40a, 43a) so they sit where they
run. Each one is sized for **one focused Claude Code session (two at most) with one coherent
deliverable**, like the originals, and has a plan in `phases/phase-NN-<slug>.md`. Every phase leaves the app green, demoable
and fully migrated, because the prototype is shown in live workshops between phases. **Built:** 14
and 15. **In progress:** 15a (session 1 committed; session 2 to build).

## Owner decisions

These readings shape what a phase delivers, not just its labels. Each is a question on the
Requirements Board (the OQ named in its row). **Nine were answered at the 2026-10-01 meeting with
Greg (D1 to D8, D10) and fourteen more at the 2026-10-02 meetings (D12 to D25)**, and the phases they
gate now build the answer, not a default. **D9 and D11 are still open:** if an answer has not come in
by the time its phase starts, build the default and label it provisional in the UI; the phase's drift
check confirms the gating answer first.

| # | Decision | Gates | Answer (or default while open) |
|---|---|---|---|
| D1 | AA fee basis and netting (OQ-02) | 16 | **Answered.** A monthly AA fee invoice per anaesthetist: fixed charges plus a charge per BCTI (for example $500 + $5 x 40), from a settings page (US-10.3.3), raised by a monthly run. The payable equals the receivable, and the fee is always a separate invoice, never netted. What the per-invoice charge counts is OQ-60, still open: build its recommendation (each BCTI once, against the anaesthetist who did it) with Greg's 2026-10-02 view (only paid invoices count), both provisional inside one pure function. The count reads one BCTI per receivable invoice, which is provisional: the catalogue's "one per procedure" is unresolved (see Sequencing rules) |
| D2 | Insurer and funding source: on the Booking or the Patient (OQ-55) | 20 | **Answered.** Neither. The Contract defines the billable party, and many Contracts cover any mix. `Procedure.insurerId` goes and nothing replaces it. There is no per-Booking override either (D17) |
| D3 | Ranged base codes: drop the published-range bound (RV-04, OQ-56) | 19 | **Answered.** The anaesthetist may enter any base units. An out-of-range entry is accepted and raises an after-procedure warning for the office (15a's routine). No hard bound. The base units themselves now come from the procedure's default RVG Contract (D12) |
| D4 | Child as billable party: block or warn (OQ-54) | 21 | **Answered.** A mild, clearable warning on the to-do list only. No block, and no warning when someone else pays |
| D5 | Hard prepayment completion gate (RV-09, OQ-57) | 15a, 27 | **Answered.** No block; a clear warning in both apps. 15a removed the gate and its audited override (session 1, built); 27 strengthens the warning as the procedure date nears |
| D6 | Who raises the prepayment invoice at setup (OQ-58) | 27 | **Answered.** The system generates it when a Procedure matches the anaesthetist's prepaid list, only where the billable party is a person paying for the patient (D23), and holds it until an admin approves and sends it. FT-08.1 names it as its one exception. When its receivable and payable pair is created is OQ-80: build its recommendation (at generation) |
| D7 | Can an anaesthetist hand a List on without office confirmation (OQ-39)? | 32, 32a | **Answered.** Yes. The anaesthetist returns their own List to the office (it becomes a Draft List) or moves it into a colleague's free session, with no acceptance and no office confirmation. Who is told is answered too (D15). A single Booking can be moved as well (US-01.4.7, 32a) |
| D8 | Receivables ageing and an "Overdue" view (RV-19, OQ-59) | 38 | **Answered.** A flat outstanding list, oldest first, with no buckets, no age chips and no Overdue view |
| D9 | Do billed Lists vanish from the anaesthetist's view (OQ-31)? | 38 | **Open.** Default: they stay, shown as "completed, unbilled" and then "billed" |
| D10 | How an additional invoice is priced (OQ-45) | 38b | **Answered.** Free-form lines (description, quantity, amount), with no Contract pricing or unit rules. Its other details are answered too (D22) |
| D11 | Can a Booking without an NHI be created (OQ-49)? | 40 | **Open**, with the meeting leaning to the default. Default: yes, flagged as provisional and on the problem list; its List cannot be authorised until the NHI is added |
| D12 | Where base units live, and how a procedure is picked (OQ-62) | 19, 19a | **Answered.** In one or two default RVG Contracts per procedure (one with a range, or one per kind), holding its base units and other settings; any other Contract may override them for a procedure, RVG code or group. The master procedure list, grouped by body part, holds or references the RVG code and holds no base units; the RVG code master is reference data. One list or two, and where the system code sits, is OQ-88: build its recommendation (one procedure master, a system code per line, RVG codes as reference) |
| D13 | How pre-op and post-op events are modelled (OQ-63) | 38b, 39b | **Answered.** "Event" is the one name for everything recorded against a Procedure after setup: pre-op, post-op, additional invoices and credits. Its own element and its own invoice line; an admin can add one; an invoice tick and a "same as" billable-party tick. Recorded before the Procedure's invoice is approved it travels with that invoice, after it it is invoiced in the next run; one standard review step, no separate approval |
| D14 | Logical model of days, Slots and Lists (OQ-64) | 28 to 32 | **Answered.** A Slot is a status container a List goes into; every Slot is stored across the horizon (four months in current practice, configurable); statuses are a user-maintained list (fixed ID, editable label and colour), starting from free, on holiday and unavailable; "slot" is never said in the UI; marking unavailable a Slot that holds a List offers return to the office (a Draft List) or assign to a colleague. The room also settled OQ-81 parts 1 and 2 (the calendar is painted before recurring bookings; a recurring booking on an unavailable Slot becomes a Draft List); part 3, short-notice sickness, is open |
| D15 | Who is told when an anaesthetist moves their own List (OQ-65) | 32, 35 | **Answered.** A new shared notification pool in the Admin App, one for the whole team and separate from the to-do list; the move posts to it, the office sends the cover-change email from the on-demand button, and the colleague sees the List with a notice. What else posts, and expiry, are OQ-79 |
| D16 | Contract identifiers and finding Contracts (OQ-66) | 18, 19a, 20 | **Answered.** A short structured AA code (format to design), searchable; the picker filters by procedure then hospital, always offers the default RVG Contract, and searches by code. 19a scopes every Contract to its master procedures so the procedure filter has something to filter on |
| D17 | Who a Contract belongs to, and who pays (OQ-67) | 21 | **Answered.** The Contract always defines the billable party, with as many Contracts as AA needs; no per-Booking override; picking a default Contract asks for the payer's name and email. Greg's no-default-Contract model is OQ-78: build the catalogue's model |
| D18 | Contract split basis (OQ-68) | 22 | **Answered** (the owner's pick). Each share a typed $ or %, set on the Booking, defaulting from the Contract |
| D19 | Update email: a prompt or a button (OQ-69) | 35 | **Answered.** An on-demand button on any Booking; the admin picks one or more changes from the change history; no prompt after saving or after a cover change. Templates per kind of change (US-02.3.4). Automating it is OQ-82 |
| D20 | A prepaid Booking moved to another anaesthetist (OQ-70) | 27, 32a, 41 | **Answered.** The anaesthetist who does it keeps the agreed amount and wears or benefits from the difference; only the payable half of the draft pair is updated |
| D21 | A negative invoice with no later payment (OQ-71) | 39a | **Answered.** Handled outside the system: nothing is built (39a's carry-forward and recovery invoice go) |
| D22 | Additional invoice details (OQ-72) | 38b, 39 | **Answered.** "Desc" is description; an additional invoice can go to any billable party; a credit note option credits the original to any party, then new additional invoices are raised; a rebill can start from a copy of the original's lines (US-08.6.6). The rebill total and the payable reversal are OQ-77 |
| D23 | Prepayment when the patient is not the billable party (OQ-73) | 27 | **Answered.** Only where the billable party is a person paying for the patient, never an organisation |
| D24 | Patient balance warning threshold (OQ-74) | 40 | **Answered.** The days count from the invoice date; a credit balance is a mild warning |
| D25 | RVG time rule (OQ-75) | 19a, 27 | **Answered.** A part interval is always rounded up under the RVG tiers (15 minutes for the first two hours, then 10) |

## Tracks

```
Foundations  14 demo-trigger registry · 15 Card becomes Booking · 15a warnings & to-do list
             ─▶ 15b Copy and photo capture out
Money fix    16 AA fee as a monthly invoice                                    (after 15b)
Contracts    17 surgeons & blacklist ─▶ 18 Contract model ─▶ 19 RVG, modifier & procedure masters
             ─▶ 19a default RVG Contracts ─▶ 20 one Contract per Procedure
             ─▶ 21 billable party & required inputs ─▶ 22 invoice delivery & payment setting
             ─▶ 23 primary, multi-procedure & combinations ─▶ 24 defined rate & adjustment
             ─▶ 25 lock at AUTHORISED                                          (19 and 21 after 15a)
Prepayment   26 prepaid settings & profile ─▶ 27 prepayment lifecycle           (after 25, 15a)
Schedule     28 Slot/List split ─▶ 29 availability ─▶ 30 conflicts ─▶ 31 Draft Lists
             ─▶ 32 own List moves & notification pool ─▶ 32a single-Booking moves  (32 after 27)
Intake       33 matching screen ─▶ 34 sync & S1 rebuild ─▶ 35 explicit save & update email
                                                                         (35 after 32)
Money        36 internal ledger ─▶ 37 Xero resilience & monitor │ 38 web accounts
             │ 38b events & additional invoices ─▶ 39 credit notes & rebill
             ─▶ 39a payment runs                                              (after 37, 39)
Capture      38a find past work (after 38) ─▶ 39b pre-op & post-op events     (after 38b, 24)
Patients     40 missing NHI, balance warning, patient view ─▶ 40a NHI lookup & identity
Late         41 prepayment settlement, trust & refunds ─ 42 reference data & loads ─ 43 scale & privacy
             ─ 43a sign-in & ease of use
Demo         44 demo guide rewrite & final sweep
```

## Phases

| # | Phase | Delivers | Depends on | Covers (gaps / DM / RV) |
|---|-------|----------|------------|---:|
| 14 | [Screen-contextual demo triggers](phases/phase-14-demo-trigger-registry.md) | **Built.** A shared, route-scoped trigger registry and a context hook in `src/shared`. A "Demo actions" menu in the harness bar and a PWA demo-actions sheet. Every existing Control Panel trigger re-homed to its screen; the Control Panel becomes the index. "Office authorises this List" on the PWA. Interim Future-scope badges on the HL7/FHIR tooling. First new trigger: "Simulate sign-in attempts" | none | 1 / 0 / 0 |
| 15 | [Card becomes Booking](phases/phase-15-booking-rename.md) | **Built.** Card renamed to Booking across the model, ids, audit, seed, routes, registry and copy. Adds List-level attachments, an optional Booking source, and Copy as a skeleton-only new Booking (now Retired: 15b removes it) | none | 1 / 2 / 2 |
| 15a | [Warnings and the to-do list](phases/phase-15a-warnings-and-to-do-list.md) | **In progress.** One pure warning routine with Warning records on the Booking (session 1, built, with the prepayment gate replaced by a warning, D5). A to-do list on the Admin dashboard with Clear, a warning triangle on Bookings in all three apps, the warning visible on opening a Booking, the Day view outline down to the Booking, and no confirm step at submit | 14, 15 | 4 / 1 / 0 |
| 15b | [Copy and photo capture out of the prototype](phases/phase-15b-copy-and-photo-removal.md) | Copy a Booking removed from all three apps, the store, the seed and the guide. Photo capture out of the Add a booking chooser, kept at most as a badged Future-scope demo. The superseded Copy ruling recorded | 15a | 0 / 0 / 1 |
| 16 | [AA fee as its own monthly invoice](phases/phase-16-aa-fee-invoice.md) | Step 1: the payable equals the receivable, and a part payment releases exactly what was received. Step 2: AA fee settings and a monthly run raising one AA-FEE invoice per anaesthetist (fixed items plus a per-BCTI charge, D1, counted by one pure function), shown in Admin and web Accounts. Xero pairs carry the invoice number and reference, and Xero holds no patient names, only the hidden ID | 15a, 15b | 8 / 1 / 1 |
| 17 | [Surgeons, rooms and blacklist](phases/phase-17-surgeons-rooms-blacklist.md) | Surgeon profile with one HPI CPN field, surgeons' rooms with contacts, surgeon groups, hospital contact email and a two-sided blacklist master. A soft blacklist warning, as a shared helper, when the office assigns a List | 14, 15 | 5 / 1 / 0 |
| 18 | [Contract model](phases/phase-18-contract-model.md) | Contracts defined by category, holder, scope and pricing basis, each with a short AA code (D16). Fee-schedule lines with searchable holder codes, time bands, add-ons, GST incl/excl and effective dates. Review date and retire. ACC priced as an ordinary holder. Fee parity tests | 17 | 6 / 2 / 1 |
| 19 | [RVG, modifier and procedure masters](phases/phase-19-rvg-and-procedure-masters.md) | An editable RVG reference master with system codes, AA codes and groups, and the catalogue's modifier set. Default modifiers pre-filled and untickable in place of absorbed modifiers. A master procedure list with no base units (D12) and a procedure-first capture picker. Any base-unit value accepted, with an after-procedure office warning when out of range (D3) | 15a, 18 | 6 / 2 / 2 |
| 19a | [Default RVG Contracts hold the base units](phases/phase-19a-default-rvg-contracts.md) | One or two default RVG Contracts per master procedure holding its base units (D12), a Contract base-unit override for a procedure, code or group, the resolver reading the Contract, RVG values as reference only, every existing Contract scoped to its master procedures (derived from its schedule lines' RVG mapping) so 20's procedure filter returns real Contracts, and the RVG time tiers held as data (D25) | 19 | 3 / 1 / 0 |
| 20 | [One Contract per Procedure](phases/phase-20-one-contract-per-procedure.md) | Billing route, payment category and the Procedure's insurer removed (D2). A Contract on every Procedure from booking setup, defaulted to the hospital's Contract, picked by anaesthetist and office from a list filtered by procedure then hospital, with the default RVG Contract always offered and AA-code and holder-code search (D16). An anaesthetist's Contract change is flagged for approval. Payer is the Contract holder and `funderOverride` stays as the split, both interim | 19a | 10 / 3 / 2 |
| 21 | [Billable party, required inputs and completeness](phases/phase-21-billable-party-and-required-inputs.md) | The billable party defined by each Procedure's Contract, with the payer's name and email captured when a default or patient-direct Contract is picked, and the guardian override gone (D17). Contracts declare required inputs; completion needs a Contract and those inputs. A not-on-schedule flag. Review approves every Contract. A mild warning when a child is the billable party (D4) | 15a, 20 | 11 / 2 / 1 |
| 22 | [Invoice presentation, delivery and the payment setting](phases/phase-22-invoice-presentation-and-delivery.md) | Invoice issued in the anaesthetist's name with AA as agent. Contract-driven layout, delivery and GST. The run sends each invoice to email or portal. A Contract payment setting (full or split) with typed $ or % shares set on the Booking (D18) replaces `funderOverride`. Provisional BCTI wording on the ACCPAY, still one BCTI per receivable invoice | 21 | 7 / 2 / 0 |
| 23 | [Primary Procedure, multi-procedure rule and combination Contracts](phases/phase-23-primary-procedure-and-multi-procedure-rule.md) | Exactly one primary Procedure, with "Make primary" on every surface and the feed. Booking-level pricing with the 3/2/2 modifier split and a per-Contract multi-procedure rule, reading 19a's base-unit override. Combination Contracts offered under each parent procedure | 19a, 22 | 8 / 1 / 1 |
| 24 | [Contract defined rate and anaesthetist adjustment](phases/phase-24-anaesthetist-adjustment.md) | A Contract defined unit rate in place of the hourly rate x time line and its Method 3 flag, pricing the whole Procedure through one rate function (no billing line: 39b's UNIT x RATE line calls the same function). A separate anaesthetist adjustment (percent or fixed final, reason required), offered only where the Contract allows it and applied before the office override | 23 | 7 / 2 / 2 |
| 25 | [Contract versions and the AUTHORISED lock](phases/phase-25-contract-lock-at-authorised.md) | Contract version history and a per-Procedure locked record written at authorise, including base-unit source, defined rate, payment setting and shares, adjustment and payee. The engine prices only from that record. "Regenerate from locked data". The billing-failure trigger is re-based | 19a, 22, 23, 24 | 6 / 1 / 1 |
| 26 | [Prepaid settings and anaesthetist profile](phases/phase-26-prepaid-settings-and-profile.md) | An anaesthetist profile on mobile and web: unit value, GST period, HPI CPN, GST number, bank details and a prepaid tick list of codes and groups. Admin can edit it on the anaesthetist's behalf | 19, 20 | 6 / 2 / 0 |
| 27 | [Prepayment lifecycle](phases/phase-27-prepayment-lifecycle.md) | Prepayment derived from the prepaid set for a person paying for the patient (D23). An estimator using estimated duration, RVG time rounding (D25) and contingency units; the full estimate stored on the Booking and worded as an estimate. The invoice generated at setup and sent on admin approval (D6). A prepaid amount above the final billed with no invoice and no failure, the excess recorded. Part-paid tracking, a warning that strengthens as the date nears (D5), and re-checks on change and move (D20) | 15a, 25, 26 | 11 / 2 / 1 |
| 28 | [Slot and List split](phases/phase-28-slot-list-split.md) | A Slot record for every active anaesthetist's session across a configurable horizon, free by default, holding availability and default times (D14). A List with its own id, created on assignment and shown in place of the status. Status independent of bookings in all three apps and the finders. Added anaesthetists on the Admin Day grid. Reassign moves a List between Slots | 14, 15 | 8 / 2 / 1 |
| 29 | [Availability calendar and status master](phases/phase-29-availability-calendar.md) | Availability kept from a calendar on mobile and web as the Slot's own status, with days off ahead, series and single-instance edits. Web parity. Slot statuses become a user-maintained master list with fixed IDs, editable labels and colours | 28 | 5 / 0 / 0 |
| 30 | [Conflicts, holidays and the conflict dashboard](phases/phase-30-conflicts-and-holidays.md) | Conflicts raised on every path, with a List colour change and clearing. Holidays can be edited and deleted. A cross-date conflict dashboard. Permanent Lists become recurring bookings, retirable, and edits repopulate the canvas | 29 | 5 / 0 / 0 |
| 31 | [Draft Lists and the day dashboard](phases/phase-31-draft-lists.md) | Draft Lists with hospital, surgeon, day and session required, able to hold Bookings, flagged "unassigned" with waiting time, assigned by picking the anaesthetist with warnings, removed or re-dated. A recurring booking on an unavailable session becomes a Draft List. The pairing rule is enforced. The Day dashboard shows Draft Lists and booking counts | 17, 30 | 9 / 1 / 0 |
| 32 | [Anaesthetist moves their own List, and the notification pool](phases/phase-32-swap-requests.md) | An anaesthetist returns their own List to the office (a Draft List) or moves it into a colleague's free session, at once, with a blacklist prompt (D7), also when they mark a booked session unavailable. Every move posts to a shared notification pool in the Admin App (D15). The cover-request marker is gone | 17, 27, 29, 31 | 6 / 2 / 2 |
| 32a | [Anaesthetist moves a single Booking](phases/phase-32a-single-booking-moves.md) | An anaesthetist moves a single Booking to a colleague found by search, only onto an available session, landing on the colleague's List (created if needed), with the payable and the prepayment re-check following (D20), a blacklist prompt and a pool notification. The doer rule rides on the same move | 32 | 3 / 2 / 0 |
| 33 | [Hospital download and the matching screen](phases/phase-33-hospital-matching-screen.md) | Imported rows are matched, used to create a Booking, a List or a Draft List, or rejected, with field differences and change types. An unmatched queue. No silent apply: hospital messages land as rows, and the automated S13 to S15 changes leave the demo | 20, 31 | 7 / 1 / 2 |
| 34 | [Hospital sync, manual sheets and the S1 rebuild](phases/phase-34-hospital-sync-and-s1.md) | Sync from St George's and Southern Cross only, into the matching queue. Manual-provider sheets with a demo auto-match toggle. The HL7/FHIR simulator and monitor, and surgeon PDF ingest, are demoted to a Future-scope surface, and S1 is rebuilt | 33 | 2 / 0 / 3 |
| 35 | [Explicit save and the update email](phases/phase-35-explicit-save-and-update-email.md) | Admin draft-then-save with change sets and as-at history. An on-demand mailto update email picked from the change history (D19), started from a per-kind template, to the rooms or the hospital, including from a List-move notification. Add a Booking to a booked List, edit the NHI, correct a submitted description | 17, 25, 32, 33 | 5 / 1 / 1 |
| 36 | [Internal ledger and balance views](phases/phase-36-internal-ledger.md) | BillingCase promoted to linked receivable and payable legs as the system of record (one payable leg per receivable), with the payee stamped at authorise. Phase 16's BCTI count re-reads from the ledger with a parity test. An Admin Ledger screen (whole ledger and per anaesthetist) with an imbalance indicator | 16, 22, 25, 27 | 6 / 2 / 0 |
| 37 | [Xero mirror resilience and the processing monitor](phases/phase-37-xero-mirror-resilience.md) | Disbursement detected from Xero. Bulk hospital remittance left in Xero. An outage queue with backoff. A void made in Xero is flagged. The processing monitor grouped by anaesthetist, with sorting, filtering, a problems-only view and "Open in Review" on Lists awaiting approval (authorising stays on Review) | 36 | 4 / 0 / 0 |
| 38 | [Web accounts, outstanding list and GST schedule](phases/phase-38-web-accounts-truth.md) | A ledger-backed financial position with the Productivity and Leave panels removed. A flat outstanding list with no ageing (D8). A cash-basis GST schedule of payables actually paid, with a balance check. Billed Lists that stay visible | 28, 36 | 6 / 1 / 3 |
| 38a | [Find past work: calendar and search](phases/phase-38a-find-past-work.md) | A calendar on mobile and web that jumps to any past day and drills to List, Booking and Procedure, and a search for Bookings by NHI or patient name | 38 | 2 / 0 / 0 |
| 38b | [Events on a Procedure and the additional invoice](phases/phase-38b-events-and-additional-invoices.md) | The event element on a Procedure with one standard review step and next-run invoicing (D13), and the events list on every Procedure in all three apps. A free-form admin additional invoice to any party (D10, D22), recorded as an event, replaces the addendum Booking; the anaesthetist's post-op Card flow is withdrawn until 39b | 36 | 3 / 2 / 1 |
| 39 | [Credit notes, credit-and-rebill and the combined split](phases/phase-39-additional-invoices-and-credit.md) | A credit note option to any party (D22), credit in full and rebill from a copy of the original's lines, and a combined Procedure split by credit then per-component invoices, each reversing the ledger and Xero, with a negative invoice to an anaesthetist already paid. Credits recorded as events on 38b's element; credit notes audited | 23, 38b | 6 / 2 / 0 |
| 39a | [Payment runs: BCTI approval, netting and remittance](phases/phase-39a-payment-runs-and-remittance.md) | A payables run record per period with an approve-for-payment step, negative invoices netted per anaesthetist, and a remittance advice in Admin and web Accounts. A negative with no later payment is handled outside the system (D21) | 37, 39 | 2 / 1 / 0 |
| 39b | [Pre-op and post-op events](phases/phase-39b-pre-and-post-op-events.md) | Pre-op and post-op events on a Procedure from mobile, web and Admin (date, time or fixed fee, invoice tick, billable party), as new kinds on 38b's element: on the Procedure's invoice before approval or invoiced in the next run after it, through one review step (D13), shown in the Procedure's events list. The ACC pre-op assessment as a fixed-fee pre-op event. Billing lines with their own date, preset types, the UNIT x RATE line (through 24's rate function) and Contract add-on fees | 24, 38a, 38b | 5 / 0 / 0 |
| 40 | [Patients: missing NHI, balance warning, patient view](phases/phase-40-patients-and-alerts.md) | A patient record with invoices, follow-up actions and re-send. A missing-NHI problem list with attach and merge, and an authorise guard (D11 default). A mild or strong warning at booking when a paying patient owes money, counted from the invoice date, and a mild one for a credit balance (D24), with one admin-editable threshold field (not a warnings settings page) | 15a, 34, 36, 39 | 7 / 2 / 1 |
| 40a | [NHI lookup and identity standards](phases/phase-40a-nhi-lookup-and-identity.md) | NHI lookup with validation at entry, Hub states with a manual fallback, a purpose statement and refresh from the register. HPI CPN shown consistently | 26, 40 | 2 / 0 / 0 |
| 41 | [Prepayment letters, settlement, trust account and refunds](phases/phase-41-prepayment-followup-credits-refunds.md) | Prepayment letter templates and reminders, a balance invoice that cites the prepayment, the overpaid case shown as accepted with no credit (on 27's excess path), a provisional trust account holding prepayments until the procedure, refund on cancellation, only the payable repointed when a prepaid Booking moves by List or single Booking (D20), and a fresh prepayment on rebooking | 27, 32a, 39, 39a | 9 / 1 / 0 |
| 42 | [Reference data and controlled loads](phases/phase-42-reference-data-and-loads.md) | Every master editable, including hospitals, insurers, recurring bookings and public holidays. A spreadsheet loader with row validation, for any Contracts (the default RVG Contracts included) and calendars. A clean-cut go-live demo | 17, 18, 19, 19a, 29, 30 | 4 / 1 / 0 |
| 43 | [Scale and privacy](phases/phase-43-scale-and-privacy.md) | A full-scale in-memory dataset with timings (the processing monitor included), a restricted raw-row view, an NHI leak scan and a synthetic-data badge | 34, 36, 37, 42 | 2 / 0 / 0 |
| 43a | [Sign-in and ease of use: simple anaesthetist screens and point-of-need help](phases/phase-43a-ease-of-use.md) | A simulated PWA sign-in with sign-out. Anaesthetist screens free of Contract complexity, and point-of-need help on mobile capture, Admin Day and Admin Review, with a first-run hint per app | 21, 24, 31, 39b | 2 / 0 / 0 |
| 44 | [Demo guide rewrite and final sweep](phases/phase-44-demo-guide-rewrite.md) | S1 to S5 rewritten, Control Panel jumps rebuilt, stale copy swept, master guide regenerated in full, trigger and PWA-parity audit, PROGRESS entry | all | 0 / 0 / 1 |
| | **Total** | 208 gaps, 46 DM and 29 RV closed; none parked. Built 14 and 15 also list three items that now Match (FT-13.5, US-03.1.3, RV-12) | | **210 / 46 / 30** |

## Sequencing rules

- **14 and 15 are built.** 15 renamed Card to Booking before any phase that edits booking code.
- **15a is in progress.** Session 1 (work items 1 to 8: the pure routine in `src/domain/warnings`,
  the app-settings record, `warningClearances`, the `store/warnings.ts` selectors, the audited
  `clearWarning`, the gate and override removed per D5, the stop-gap banner, `PERSIST_VERSION` 16) is
  committed and is never rewritten. Session 2 (items 9 to 15: surfaces, triggers, capture, review)
  is updated in place: US-13.7.3 dropped the submit confirm step and tap-to-read. 15a runs before
  19, 21, 27 and 40, which each register a warning rule into its routine.
- **15b runs straight after 15a, before 16.** It removes Copy a Booking (Retired) and takes photo
  capture out of the Add a booking chooser; RV-03 and DM-39 stay on built 15's covers.
- **16 runs straight after 15b, by design.** The fee fix is isolated and cheap, and it changes the S3
  figures. Step 1 (fee removal) is re-greened before step 2 (the monthly fee invoice) starts. The
  first milestone (after 16) includes the warnings and the removals.
- **BCTI granularity is built one way and labelled provisional.** The catalogue says both "one BCTI
  per procedure" (US-09.1.4 note, OQ-29, the 2026-10-01 note #41) and "the same value as its
  receivable" (OQ-42), and a receivable can hold several Procedures, so both cannot hold (DM-22 says
  as much). The plan builds one BCTI, the ACCPAY, per receivable invoice, the same value: the
  transcript's "per transaction" (B L71-81), and what US-10.2.1's release needs. 16 counts BCTIs for
  the fee run through one pure, tested function (each once against the anaesthetist who did it, and,
  per Greg's 2026-10-02 view, only once paid, both switchable there); 22 (Split gives two invoices,
  so two BCTIs), 36 (the ledger's payable legs), 38b (additional invoices), 39 (re-issued invoices;
  whether a credit note or negative invoice counts is OQ-60) and 39b (event invoices) feed it and
  keep it the only count, and 36 adds a parity test. "One per procedure" stays an open point to
  raise with AA's accountant beside OQ-29 and OQ-60; if it flips, the count function, the $700 seed
  and the S3 and S4 figures are re-baselined in one place.
- **The Contracts track runs strictly in order: 17, 18, 19, 19a, then 20 to 25.**
  - 18 keeps today's resolver, so the app stays green until 20 swaps in explicit selection. It
    models Contract scope, including the master procedures a Contract is set against.
  - 19 and 19a come straight after 18 so the base-unit source (the procedure's default RVG Contract,
    any other Contract's override, the RVG master as reference only), the procedure-first picker and
    each Contract's procedure scope are final before 20's Contract picker, 23's Booking-level engine
    and 25's lock build on them. 19 reads the RVG reference value through one resolver; 19a switches
    the resolver to the Contract and scopes every existing Contract to its master procedures
    (derived from its schedule lines' RVG mapping), so 20's procedure filter returns real Contracts.
  - 20 leaves two interims: the payer is the Contract holder until 21 captures the Contract-defined
    billable party, and the seeded `funderOverride` two-funder split stays the split mechanism until
    22 replaces it with the Contract's payment setting.
  - 23 builds combination Contracts, which 39 needs to split a combined Procedure.
  - 24 replaces the hourly rate x time line with the Contract defined unit rate, pricing the whole
    Procedure through one rate function, and adds the Contract-gated adjustment. 24 builds no
    billing line: 39b's dated UNIT x RATE line (US-03.3.6) calls the same function.
  - 25 locks what 18 to 24 built, including the base-unit source, the defined rate, the adjustment
    from 24 and the payee.
- **26 and 27 run back to back, after 25.** 20 leaves an office-set "prepayment required" flag on
  the Booking as the interim until 27 derives it.
- **27 makes a prepaid amount above the final bill cleanly.** Its estimate is the full fee plus
  contingency units, so the prepaid amount is usually above the final; without the fix every
  prepaid Booking authorised from 27 on would fail billing (`negativeTotal`), S4 Beat 1 included. So
  27 raises no invoice and no failure for a group negative only because of prepayment deduction
  lines, records the excess on the BillingCase and keeps the guard for every other negative. 41
  builds the overpaid surfaces and wording.
- **The Schedule track runs strictly in order, 28 to 32a.** 28 is the Slot/List foundation (every
  Slot stored, free by default, over a configurable horizon); 31, 32 and 32a reuse 17's blacklist
  helper; 32 also needs 31 (a List returned to the office becomes a Draft List) and 27 (a move
  re-checks the prepayment), and builds the notification pool 35 reads; 32a extends 32's move
  helpers to a single Booking and carries the doer rule.
- **Intake (33 to 35) runs after 31 and 20**, because a row can create a Draft List and a created
  Booking takes the default Contract. 34 needs only 33 now that surgeon PDF ingest (and its
  estimated-duration edit) is Future Work. 35 also needs 25's versioned history and 32's moves (the
  cover-change email is reached from a List-move notification).
- **Money:** 36 runs after 16, 22, 25 and 27 (it re-points prepayment status and AA fee invoices).
  Then 37, 38 and 38b can run in any order. 39 runs after 23 and 38b (credits are events on 38b's
  element). 39a runs after 37 and 39 (it records the payables run and nets 39's negative invoices).
- **Capture:** 38a runs after 38 (billed Lists stay visible). 39b runs after 24, 38a and 38b,
  because 38b builds the event element 39b adds pre-op and post-op kinds to, and soon after 38b,
  because 38b withdraws the anaesthetist's post-op Card flow that 39b brings back as events. It needs
  nothing from 39 or 39a, so it may run straight after 38b.
- **The remaining phases:**
  - 40 runs after 15a, 34, 36 and 39 (a patient credit balance needs 39's credit notes); 40a after
    26 and 40.
  - 41 runs after 27, 32a, 39 and 39a (it needs credit notes, the ledger and the payables run
    record, and repoints the payable half of a prepaid Booking moved by 32 or 32a).
  - 42 runs after every master-data phase (17, 18, 19, 19a, 29, 30).
  - 43 runs after 34, 36, 37 and 42; 43a after the capture and review screens settle (21, 24, 31,
    39b).
  - 44 runs last.
- **Contracts and Schedule are independent from 17 until 32.** Contracts go first because the track
  is mostly Confirmed and carries the S3, S4 and S5 money beats, and 32 needs 27.
- **Vocabulary.** Booking, not Card; move or reassign, never swap; never "timesheet". Per OQ-64,
  "slot" never reaches app copy (say session, AM or PM); Slot stays a code and planning word. "Draft
  List" is kept. "Event" is the one name for everything recorded against a Procedure after setup;
  keep its user-facing label in one place (38b builds it), because Greg was unconvinced by it.
- **Open questions with a recommendation are built as that recommendation** and labelled
  provisional (the meeting's working rule), each kept in one place so a different answer is a small
  change.
- **Every phase opens with a drift check** against `3d3a18c` for its items and linked OQs, and
  confirms any owner decision it depends on.
- **Every phase closes the same way:**
  - `npm run build`, `npm run build:pwa` and `npx vitest run` are green.
  - `npm run shots` (Playwright) is green for any phase that touches UI; `data-shot` hooks and specs
    move with the code they follow.
  - The adversarial review pass has run (PROGRESS convention 18).
  - The catalogue screenshots match the app: the phase's capture recipes are created or updated, a
    full `npm run capture` has run with no failed recipe, and `npm run verify:board` is green (see
    "Catalogue screenshots" below, and PROGRESS convention 19).
  - `PERSIST_VERSION` is bumped whenever the seed's shape or content changes.
  - Billing maths stays pure with Vitest tests.
  - The Decisions log is updated wherever a settled ruling is superseded. Known cases: the route
    model, the 5% fee netting, Copy as an additional procedure and then Phase 15's skeleton Copy,
    absorbed P1 modifiers, the Method 3 hourly rate line, the guardian override record, the addendum
    Card, the prepayment completion gate, the overpaid prepayment's `negativeTotal` failure, the
    silent BTM fallback, availability reconciliation's conflict flag, office write-through per tap,
    the cover-request flow, hospital auto-apply and Phase 14's keeping Surgeon PDFs in scope.
  - A PROGRESS.md entry is recorded, ending with its "For the owner's review" list.

**Where the critic's review was not followed.** The escalating unpaid-prepayment warning (US-06.3.2,
Confirmed) and the re-check (US-06.3.5) stay in 27 rather than moving to 41: the warning is the
control that replaced the completion gate, and moving it would leave S4 Beat 1 with no control for
fourteen phases. Contract pricing and adjustment rules (US-04.2.2) closes in 24, not 23, because its
last missing parts are Contract rules (the allows-adjustment rule and, since 2026-10-02, the defined
rate). In the second review, Phase 32's file name (`phase-32-swap-requests.md`) is kept although
"swap" is no longer catalogue vocabulary: the plan tools pin an existing phase's doc path in
`plan.json`, so renaming only the slug would put the slug, the doc and the links out of step. The
phase title and every app-facing word already say "move". Renaming the file is a separate mechanical
step (move both files, then update `plan.json` and the links) if wanted. Phase 39 keeps its file name
(`phase-39-additional-invoices-and-credit.md`) for the same reason, although 38b now builds the
additional invoice.

**The critic's review of the 2026-10-03 update** was followed in full. Where it offered a choice,
or the plan went further:

- 27 keeps US-06.2.3 and regains the no-failure prepaid-excess path (see the sequencing rule above);
  41 keeps FT-06.4 and US-06.4.2 for the surfaces, the wording and the "Stage overpaid prepayment"
  beat, and takes US-06.4.1.
- 39 was too big for two sessions, so it is split. The new 38b takes the event element, its review
  step and the events list, as suggested, **and also the additional invoice**, so 38b has a
  deliverable that can be demoed on its own instead of an empty list; 39 keeps the credit work.
- Contract procedure scope goes to **19a** (not 19, which is full, or 20, which is XL), and 19a
  becomes 2 sessions.
- Also followed: one admin-editable balance threshold in 40 (a single field, not US-13.7.4's
  settings page); "Open in Review" in 37's monitor, with authorising kept on Review and logged for
  the owner; 39 added to 40's dependencies and 32a to 41's; 24 prices whole Procedures at the
  defined rate and builds no billing line, and 39b alone builds the UNIT x RATE line through 24's
  function.

**Placement notes for the 2026-10-01 update.**

- 15a is new and early: the catalogue's warning routine is cheap to build over today's data, and
  four later phases plug a rule into it. Removing the gate there (D5) gives an early, correct S4 Beat 1.
- US-05.5.2 (ACC pre-op codes) moves from 19 and US-03.3.6 (other billing lines) from 39 to 39b,
  because the ACC pre-op assessment and late lines are now pre-op and post-op events.
- US-08.6.4 is unparked into 39 now that OQ-53 is answered; its combination Contract is 23's.
- 39a is split from 39 so neither passes two sessions: 39 raises the negative invoice, 39a nets it.
  (Since OQ-71 was answered "outside the system", 39a no longer builds a recovery invoice and is 1
  session.)
- 39b carries all of US-03.3.6, not just the dated line: preset line types and Contract add-on fee
  lines (from 18's add-on schedule lines) as well as a date of their own.
- The overpaid-prepayment fix (FT-06.4, US-06.4.2) stays in 41: the answer made it simpler (no
  credit), not more urgent. (Since 2026-10-03, 27 builds the no-failure excess path itself, because
  its contingency-padded estimate makes an overpaid prepayment the usual case; 41 builds the
  surfaces.)
- US-09.3.1 goes to 16, which already edits the Xero simulator.
- US-15.0.1 gets its own late phase (43a) once the capture screens settle; 20 builds the
  anaesthetist's Contract picker to its rule (no Contract complexity on the anaesthetist's side).
- 32 becomes the anaesthetist's own move; the payee repoint of a moved prepaid Booking (US-06.5.4)
  is 41's, beside the trust account. (Since 2026-10-03 the doer rule, US-01.4.6, is 32a's.)

**Placement notes for the 2026-10-03 update** (catalogue `3d3a18c`).

- **15b is new.** The owner asked for Copy a Booking (US-02.4.3, Retired) to be removed. Phase 15
  built it, and RV-03 and DM-39 stay on 15's covers, so the removal is 15b's work, beside hiding
  photo capture (US-02.4.4 is Future Work; RV-25).
- **19a is split from 19.** OQ-62 moved base units onto each procedure's default RVG Contracts
  (DM-43, US-04.4.2, FT-04.4), and US-05.2.2 makes the time tiers data, while 19 takes default
  modifiers in place of absorbed ones (US-05.1.4, DM-44, RV-23); together they would pass two
  sessions. The Contract base-unit override moves from 23 to 19a, and 19a also scopes every existing
  Contract to its master procedures for 20's procedure filter, so it is 2 sessions.
- **24 takes the Contract defined unit rate** (US-05.2.6, DM-46, RV-24), pricing whole Procedures,
  and closes FT-05.2, so it is 2 sessions. 39b alone builds the UNIT x RATE billing line.
- **27 keeps US-06.2.3** and builds the no-failure prepaid-excess path; 41 takes US-06.4.1.
- **28 takes the horizon setting, free-by-default generation and the finders** (FT-01.1, US-01.1.1,
  US-01.4.2); US-01.1.1's recurring-clash criterion is completed in 31.
- **31 no longer turns an anaesthetist's unavailability into Draft Lists**: the anaesthetist chooses
  (US-01.5.5, in 32), and office-marked sickness stays a conflict (OQ-81 part 3). 31 turns a
  recurring clash into a Draft List instead (OQ-81 part 2).
- **32 takes the shared notification pool** (FT-13.8, US-13.8.1, US-13.8.2, DM-41) and
  return-or-assign (US-01.5.5, RV-30). The doer rule (DM-06, US-01.4.6) moves to the new **32a**, with
  the single-Booking move (US-01.4.7, DM-42) and FT-01.4.
- **33** loses US-02.5.1 and US-02.5.2 (Future Work) and keeps the automated S13 to S15 out of the
  demo (RV-28). **34** loses surgeon PDF upload (US-02.2.1, Future Work) and the sync-state criteria
  US-02.1.5 dropped, badges the Surgeon PDFs tab (RV-26), no longer needs 27, and is 1 session.
  **35** loses concurrent edits (US-02.5.6, Future Work) and US-02.5.5 (Matches), and takes FT-02.3,
  the US-02.3.4 templates and RV-31.
- **37 takes the processing monitor restyle** (US-13.3.1), with "Open in Review" on Lists awaiting
  approval, and is 2 sessions.
- **38b is new, split from 39** so neither passes two sessions. Because additional invoices and
  credits are events (OQ-63), 38b builds the event element and its review step (DM-17, from 39b), the
  events list (US-03.7.3) and the admin additional invoice (DM-18, RV-10, US-08.6.1, US-08.6.3, from
  39). 39 keeps the credit work: the credit note option (US-08.6.5), the rebill from copied lines
  (US-08.6.6), credit-note audit (US-13.5.2, DM-45), credit in full and rebill, and the combined
  split. 39b adds the pre-op and post-op kinds and depends on 24, 38a and 38b, not 39.
- **40** drops US-11.1.1 (Matches), takes the follow-up tools delta (DM-47), gets one admin-editable
  balance threshold and depends on 39. **41** takes US-06.4.1, so settlement (the balance invoice
  citing the prepayment, and the overpaid case shown as accepted) sits with FT-06.4 and US-06.4.2,
  and depends on 32a. **43a** takes anaesthetist sign-in (US-13.5.3, PWA first).
- **Left the plan:** US-05.2.5 and US-11.1.1 (now Match) leave 18 and 40; DM-36 (dropped from the
  delta) leaves 38. FT-13.5, RV-12 and US-03.1.3 now Match and stay on built 14 and 15.

### Demo triggers

Phase 14 built the mechanism and re-homed every existing trigger. Later phases register new entries
or re-point existing ones; none adds a trigger to the Control Panel page. Each entry declares:

- the route patterns it belongs to;
- the surfaces it shows on: harness bar, PWA sheet, or both;
- a `run(api, ctx)` that acts on the entity in the URL (`listId`, `bookingId`, `invoiceId`,
  `dateISO`) or on screen state published through `useDemoTriggerContext` (an edit draft, a selected
  import row, a local tab), not a hardcoded seed id wherever possible;
- a disabled state.

The harness bar shows a trigger only on its screen. The Control Panel keeps the scenario jumps, the
clock and reset, and lists every trigger under its screen with a link that opens it. Trigger bodies,
the context hook and the shared actor constants live in `src/shared` or `src/store`, so the PWA
purity test holds.

Product actions stay in the product UI, not the bar. Examples are "Create additional invoice",
"Credit note", "Credit in full and rebill", "Approve and send", "Run monthly fee invoices", "Draft
update email" and "Import hospital bookings" (with a badged sample-file picker). 15a's "Raise sample
warnings" is one shared trigger: each phase that adds a warning rule adds its sample to it.

### PWA parity

The PWA has no harness bar and no Admin app, so a handset demo cannot switch to the office. Every
phase whose beat has a mobile side that waits on the office, a colleague or a backend event
registers a PWA-surface entry for the mobile screen concerned, for example "Office authorises this
List" (14), "Office clears this warning" (15a), "Office approves this Contract change" (21), "Office
approves and sends the prepayment invoice" (27), "Office assigns a Draft List to me" (31),
"Colleague moves a List into my free session" (32), "Colleague moves a Booking to me" (32a),
"Hospital row arrives and the office matches it" (33), "Office reviews this event" (39b), "Office
attaches the NHI" (40) and "Sign out" (43a). These stand-ins show on the PWA only: in the framed build
the presenter plays the office in Admin. "Play the office" (RV-22) stays as a signposted scaffold,
defaults to OFF and shows a badge when on, and loses nothing because 14 added the per-List trigger.
Phase 44 checks PWA parity beat by beat.

### Demo guide

- **Each phase patches the beats it breaks,** in the same session: `docs/demo-guide` (run sheet,
  cheat sheet, workflows), the matching sections of `master-demo-guide.html`, and the Control Panel
  scenario text. The self-contained guide presenters use is never more than one phase stale.
- **Each milestone phase (16, 25, 27, 32a, 35, 39a) ends with a consistency read** of
  `master-demo-guide.html` against the run sheet.
- **Phase 44 rewrites the S1 to S5 run sheet** around the new model and regenerates
  `master-demo-guide.html` in full.
- **Phase 14 added a Future-scope caveat to S1** while the HL7/FHIR tooling still carries it; 15a
  turns S4 Beat 1's gate into a warning, with no confirm step; 15b drops the Copy lines; 34 rebuilds
  S1; 38b turns S4 Beat 2's post-op addendum into an additional invoice, and 39 adds a
  credit-and-rebill beat.

### Front-end design

Every phase from 15 on touches UI, so every kick-off prompt from 15 on tells the agent to invoke the
`/frontend-design:frontend-design` skill before building or reshaping any screen, sheet, dialog,
panel, row, banner or state. The skill works inside the design system, not over it: the
`docs/design` files and `src/theme` tokens stay authoritative (PROGRESS convention 17, CLAUDE.md
"Design"), so it shapes layout, hierarchy, spacing, states and finish, never a new palette, typeface
or visual language, and the two hard rules (crimson identity only, teal the only action colour)
hold. Store, seed and pure-domain steps do not need it. A new or re-planned phase that touches UI
carries the same "While working:" bullet.

### Owner review: agents test themselves

The owner (2026-10-02) is running the phases back to back and will not review the app after each
one. One proper review comes **after all catch-up phases are finished**. So, from Phase 15 on:

- **No plan-approval stop.** After the drift check, the agent writes its step plan (in the session,
  and in the PROGRESS entry) and starts building straight away. It does not enter plan mode or wait
  for approval.
- **The agent is the tester.** It runs the phase's manual test checklist itself, in the running app
  (start root `npm run dev` in the background if 5173 or 5174 is down), driving it with Playwright
  or the `/run` skill and checking screenshots by eye. "Handset" checks use the emulated mobile
  viewport unless a real phone is already attached. Each item is reported pass or fail with its
  evidence. It never hands the checklist, a click-through or a screenshot check to the owner.
- **Defaults over questions.** Where a phase doc says "ask the owner" about a product choice, the
  agent builds the stated default, labels it provisional where the doc says so, and logs the question
  for the end-of-catch-up review instead of asking.
- **Stop and ask only when it is very needed:** a drift-check stop condition the phase doc names (a
  vocabulary rename, a reopened decision that changes the model, a covered item that has left its
  lane so the phase no longer makes sense), a blocker no documented default resolves, or an action
  that is destructive or hard to undo. Everything else is decided, recorded and carried forward.
- **Owner review queue.** Each phase's PROGRESS entry ends with a short "For the owner's review"
  list: the defaults built for open questions, provisional readings, anything logged rather than
  fixed, and the screens worth a look. Phase 44 gathers these lists into one review list for the
  owner's end-of-catch-up review.

### Catalogue screenshots

The catalogue's stories carry screenshots of the prototype, taken by the Requirements Board's capture
runner from one recipe per item (`requirements-board/capture/recipes/<ID>.json`; format, routes, hooks
and selector tips in `requirements-board/capture/ATLAS.md`). When a phase is done, the screenshots on
its stories must show what it built, and no other story's screenshots may be left showing a screen the
phase changed. Every phase therefore ends with this step, after the review pass and before the
PROGRESS.md entry:

1. **Recipes for the covered items.** For every story the phase covers (and every feature it covers
   that has no stories), create the recipe if it is missing and update it if it exists, so it matches
   what was built:
   - `status`: `captured` when the story is fully in the prototype, `partial` with an `absentReason`
     saying exactly what is still missing (and which later phase builds it), `absent` only if the
     phase built nothing visible for it (say why);
   - shots for each screen and app the story lives on (web and mobile both, where both have it), with
     states for the change the story describes (before and after, closed and open, warning and
     cleared), and the highlight on this story's area;
   - captions in the catalogue's current words (Booking, not Card), with no en or em dashes.
   `node docs/prototype-build/catch-up/tools/recipe-status.mjs <phase>` lists the covered items and
   their current recipes.
2. **Recipes the phase broke.** Any other recipe whose route, id, text or selector the phase changed
   is updated to the new screen, keeping its shot `name`s (rename a shot only when the old name
   describes retired behaviour; the runner deletes the old generated image). A Retired or Future item whose screen the
   phase removes gets `status: absent` with the reason "Retired: removed in Phase NN" (or "Future").
   Add `data-shot` hooks rather than brittle selectors, and move hooks with the code they follow.
   Stage a per-screen demo trigger with the runner's `trigger` step (added in Phase 14, because shots
   hide the harness bar that holds the "Demo actions" menu); on the PWA, open its Demo sheet instead.
3. **Capture.** With the prototype on 5173 and the PWA on 5174 (if they are not running, start root
   `npm run dev` in the background and stop it afterwards), run `node scripts/capture.ts --dry` in
   `requirements-board/`, fix what fails, then a full `npm run capture`. The full run rewrites only
   images that changed, links them into the items' `images`, and rewrites `capture/REPORT.md`. It
   must end with no failed recipe and no story without a recipe.
4. **Look at the shots.** Open the new and changed images for the covered items and check that each
   shows the built feature, the highlight lands on it, and the caption is true.
5. **Keep ATLAS current.** Where the phase changes routes, seed ids, personas, overlays or hooks that
   recipes rely on, update the matching `ATLAS.md` sections.
6. `npm run verify:board` from the repo root is green.

The runner, not the agent, writes the catalogue items' `images` and the files under
`catalogue/assets/`; the phase still never edits a requirement's text or status. This step replaces
any older advice in a phase doc to leave screenshots stale or for the owner to re-shoot them.

### Confirm before building

These phases carry unresolved open questions (OQ) or Open/Verify items. Each checks them at its drift
check, and if they are still open builds the recommended reading (or the owner-decision default) and
labels it provisional in the UI.

| Phase | Items | Open questions |
|---|---|---|
| 15a | FT-13.7 (Verify): where the to-do list sits (US-13.7.2 leaves it open) | none |
| 16 | FT-10.3, US-10.3.1 and US-10.3.3 (Verify): the fixed-charge schedule; whether only paid invoices count (Greg's view, for AA's accountant); the payment cycle; BCTI granularity (one per receivable invoice built; "one per procedure" unresolved) | OQ-60, OQ-47, OQ-29 |
| 17 | US-13.6.3 (Proposed): blacklist wording; two lists (Greg's design view) and who learns of the other side's entry | OQ-43 |
| 18 | US-04.1.1, US-04.1.4 and US-04.2.1 (Verify): categories (Greg reviewing), default Contracts or the hospital holding every Contract, the price-in-force date, schedule lines' time bands and add-ons | OQ-78, OQ-48, OQ-89 |
| 19 | US-03.3.1 (Verify): one list or two, and where the system code sits | OQ-88 |
| 19a | US-04.4.2 (Verify): default RVG Contracts beside the hospital's default Contract | OQ-78, OQ-88 |
| 20 | FT-04.3 and US-04.3.2 (Verify): the default-Contract model | OQ-78 |
| 21 | FT-11.2, US-11.2.1 and US-11.2.2 (Verify): Greg's no-default-Contract model | OQ-78 |
| 22 | US-04.2.12 and US-08.2.3 (Verify): whether shares total the line, and the split's wording; GST agency, the BCTI's new name and its granularity | OQ-29 |
| 23 | FT-05.3 (Verify), US-05.3.1 (Open): the equal split, for Ben to validate; US-04.2.11 (Verify) | OQ-15 |
| 24 | US-04.2.2 (Verify), US-03.5.1 (Proposed): whether the Contract defined rate is the agreed contract rate | OQ-89 |
| 26 | US-12.1.4 (Verify) | none |
| 27 | EP-06, US-06.2.2, US-06.3.1 and US-06.3.5 (Verify): contingency units, a partial prepayment, when the pair is created | OQ-38, OQ-76, OQ-80 |
| 28 to 31 | US-01.3.2, US-01.5.2 (Verify): the generation order and the recurring clash (settled in the room), short-notice sickness; anaesthetists pulling Draft Lists | OQ-81, OQ-86 |
| 32, 32a | US-01.4.5, US-01.4.6, US-01.4.7 and US-13.8.2 (Verify): the blacklist wording, the vacated session, the pool's lifecycle, the single-Booking experience, when the pair is amended | OQ-43, OQ-84, OQ-79, OQ-85, OQ-80 |
| 33, 34 | FT-02.1 (Verify): the delivery format per hospital | OQ-13 |
| 35 | US-02.3.3 (Verify): an automatic email after an anaesthetist's own move | OQ-82 |
| 37 | US-13.3.1 (Confirmed): the grouping and filters are Greg's suggestions, not settled; approval kept on Review behind "Open in Review" (our reading of the note) | none |
| 38 | billed Lists (D9); US-12.2.2 (Verify) | OQ-31 |
| 38b | US-08.6.1, US-08.6.3 and US-03.7.3 (Verify); the user-facing name "event" | none |
| 39 | FT-08.6, US-08.6.2, US-08.6.4 and US-08.6.5 (Verify), US-08.6.6 (Proposed): the rebill total, whether a credit reverses the payable, a split before invoicing | OQ-77 |
| 39a | US-10.2.6 (Verify): who approves, the payment cycle | OQ-47 |
| 39b | FT-03.7 and US-03.7.1 (Verify), US-05.5.2 (Open), US-03.3.6 (Proposed): ACC codes, the UNIT x RATE line | OQ-12, OQ-89 |
| 40 | US-11.1.4 (Open), US-11.3.2 (Verify): the editable threshold beside US-13.7.4's "fixed until AA asks" (Future); Booking without NHI (D11) | OQ-49 |
| 41 | FT-06.4, US-06.4.1, US-06.4.2, FT-06.5 and US-06.5.1 to US-06.5.4 (Verify): the balance threshold, over- and under-runs, when the pair is amended, the trust cycle | OQ-61, OQ-76, OQ-80, OQ-47 |
| 43a | US-13.5.3 (Verify): the sign-in experience | OQ-83 |

## Milestone demos

These are what you can show at each point.

- **After 16** (15a and 15b run before it): Booking vocabulary everywhere, with Copy a Booking gone
  and photo capture out of the Add a booking chooser. Every demo action on its own screen, in the
  harness bar and on a handset, with the HL7/FHIR tooling badged Future scope. Warnings, never
  blocks: one routine, the to-do list, a triangle on Bookings and a warning clear on opening, the
  prepayment gate turned into a warning, and no confirm step at submit. The corrected payables story:
  the payable equals the receivable, AA's fee is a monthly invoice built from its settings, and Xero
  holds no patient names.
- **After 25:** the catalogue's pricing model, end to end:
  - editable RVG reference, modifier and master procedure lists, with default modifiers pre-filled
    and untickable;
  - base units from each procedure's default RVG Contract with Contract overrides, any value
    accepted and an office warning when out of range;
  - a procedure-first pick, then one Contract per Procedure, filtered by procedure then hospital,
    with the default RVG Contract always offered and code search;
  - the billable party defined by the Contract, with the payer's name and email captured on a
    default Contract, required inputs, and a child warning;
  - invoices sent by the billing run, with full or split payment and typed $ or % shares;
  - the 3/2/2 modifier split, combination Contracts, the Contract defined unit rate and a
    Contract-gated adjustment;
  - a lock at AUTHORISED that reproduces invoices exactly.

  S3, S4 Beat 3 and S5 are re-scripted.
- **After 27:** prepayment from the anaesthetist's prepaid set for a person paying for the patient:
  the estimate from estimated duration with RVG time rounding and contingency units, worded as an
  estimate, the invoice generated at setup and sent on admin approval, part-paid tracking, a warning
  in both apps that strengthens as the date nears, and a prepaid amount above the final billed with
  no failure. S4 Beat 1 is re-scripted.
- **After 32a:** the office's schedule: every session stored and free by default over a
  configurable horizon, Slots and Lists, statuses as a user-maintained list, the availability
  calendar with series, the conflict dashboard, Draft Lists that hold Bookings with a waiting flag
  (including from a recurring clash), blacklist warnings, anaesthetists returning or handing on their
  own Lists (also when they mark a booked session unavailable) and moving single Bookings, and the
  office's shared notification pool. S2 is re-scripted.
- **After 35:** S1 rebuilt: hospital sync, then the matching screen, then a Booking on its default
  Contract. Explicit save with change sets, and the on-demand update email picked from the change
  history, started from a template, to the rooms or the hospital, including from a List-move
  notification.
- **After 39a:** the money story on the internal ledger: balances shown in or out of balance, Xero
  mirror resilience and a processing monitor grouped by anaesthetist with sorting and filters,
  ledger-backed web accounts with a flat outstanding list and a cash-basis GST schedule, events on a
  Procedure with the events list and free-form additional invoices to any party, the credit note option,
  credit-and-rebill from copied lines and a split combined procedure, and payment runs with BCTI
  approval, netting and a remittance advice. S4 Beats 2 to 5 are re-scripted.
- **After 44:** every verified gap closed: finding past work, pre-op and post-op events on every
  Procedure, patients with balance warnings, follow-up tools and NHI lookup,
  prepayment letters, settlement, the trust account and refunds, reference-data loads, full-scale
  and privacy demos, anaesthetist sign-in, point-of-need help, and the rewritten S1 to S5 run sheet.

## Parked

Nothing is parked. US-08.6.4 (split a combined Procedure into additional invoices), parked in the
first plan while OQ-53 was open, is in Phase 39: OQ-53 made a combination a Contract set against each
of its parent procedures (built in 23), and OQ-72 made the split a credit then one additional
invoice per component.

Kept but not planned as work: RV-22, the PWA's "Play the office" auto-authorise. It stays as a
signposted demo scaffold. Phase 14 badged it, defaulted it to OFF, and added the per-List "Office
authorises this List" trigger in its place.

Out of the plan since the 2026-10-03 update (not parked: excluded or already met): Future Work
US-02.2.1, US-02.4.4, US-02.5.1 to US-02.5.4, US-02.5.6 and US-13.7.4; Retired US-02.4.3 and
US-05.2.3 (their prototype code is removed in 15b and 19); now Matching US-02.5.5, US-05.2.5 and
US-11.1.1; and DM-36, dropped from the delta.

## When the catalogue changes

The catalogue keeps changing, and this plan is pinned to commit `3d3a18c`.

1. **Every phase starts with a drift check.** Diff the catalogue files for the phase's covered IDs
   and their linked OQs against the snapshot, and check whether any owner decision it depends on has
   been answered:

   ```
   git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Record the result in the phase's PROGRESS entry.
2. **For each changed item, re-run the gap analysis for that item only**, following
   [README.md](README.md). Then update `gaps.json`, the epic file and the phase doc before building:
   - An item that was retired or moved to Future leaves the phase's covers.
   - A new item goes into the phase that touches its surface, or into a new phase if none fits.
   - An answered OQ removes the "confirm before building" flag; an answered owner decision replaces
     its default.
3. **Move the snapshot commit only when the whole gap analysis is re-run.** Partial re-runs record
   their own commit against the items they refreshed.
