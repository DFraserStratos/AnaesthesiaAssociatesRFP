# AA Prototype · Requirements catch-up roadmap

The prototype was built in July 2026 against the original RFP (phases 00 to 13, see
[../ROADMAP.md](../ROADMAP.md)). The requirements catalogue is now the source of truth and has moved
a long way from the RFP. This catch-up brings the prototype up to the catalogue as at commit
**`501b0b8`**. Future and Retired items are out; retired behaviour the prototype still has is removed
or reworked. The plan was updated on 2026-10-01 for the AA meeting with Greg
([change log](../../discovery-reference/Updated%20Requirements/changes/2026-10-01-requirements-update.md)):
nine owner decisions answered, new warnings, pre-op and post-op events, look-back and search, and
payment-run features, and the data-model deltas renumbered.

The plan closes every verified gap in the [gap analysis](GAP-ANALYSIS.md): 190 gap items, 40
data-model deltas (DM) and 20 reverse findings (RV), with nothing parked. Per-gap detail is in
[epics/](epics/), the machine-readable set in [gaps.json](gaps.json), and the code index in
[analysis/](analysis/) (prototype maps, [data-model delta](analysis/domain-model-delta.md),
[reverse check](analysis/reverse-check.md)).

There are thirty-seven phases, numbered from 14 (about 63 sessions in all). Phases added in the
update carry a letter suffix (15a, 38a, 39a, 39b, 40a, 43a) so they sit where they run. Each one is
sized for **one focused Claude Code session (two at most) with one coherent deliverable**, like the
originals, and has a plan in `phases/phase-NN-<slug>.md`. Every phase leaves the app green, demoable
and fully migrated, because the prototype is shown in live workshops between phases.

## Owner decisions

These readings shape what a phase delivers, not just its labels. Each is a question on the
Requirements Board (the OQ named in its row). **Nine were answered at the 2026-10-01 meeting with
Greg**, and the phases they gate now build the answer, not a default. **D9 and D11 are still open:**
if an answer has not come in by the time its phase starts, build the default and label it
provisional in the UI; the phase's drift check confirms the gating answer first.

| # | Decision | Gates | Answer (or default while open) |
|---|---|---|---|
| D1 | AA fee basis and netting (OQ-02) | 16 | **Answered.** A monthly AA fee invoice per anaesthetist: fixed charges plus a charge per BCTI (for example $500 + $5 x 40), from a settings page (US-10.3.3), raised by a monthly run. The payable equals the receivable. What the per-invoice charge counts is OQ-60: build its recommendation (each BCTI once, against the anaesthetist who did it). The count reads through one pure function over one BCTI per receivable invoice, which is provisional: the catalogue's "one per procedure" is unresolved (see Sequencing rules) |
| D2 | Insurer and funding source: on the Booking or the Patient (OQ-55) | 20 | **Answered.** Neither. The Contract defines the billable party, and many Contracts cover any mix. `Procedure.insurerId` goes and nothing replaces it. Who a Contract belongs to is OQ-67 (21 keeps the per-Booking override beside it) |
| D3 | Ranged base codes: drop the published-range bound (RV-04, OQ-56) | 19 | **Answered.** The anaesthetist may enter any base units. An out-of-range entry is accepted and raises an after-procedure warning for the office (15a's routine). No hard bound |
| D4 | Child as billable party: block or warn (OQ-54) | 21 | **Answered.** A mild, clearable warning on the to-do list only. No block, and no warning when someone else pays |
| D5 | Hard prepayment completion gate (RV-09, OQ-57) | 15a, 27 | **Answered.** No block; a clear warning in both apps. 15a removes the gate and its audited override; 27 strengthens the warning as the procedure date nears |
| D6 | Who raises the prepayment invoice at setup (OQ-58) | 27 | **Answered.** The system generates it when a Procedure matches the anaesthetist's prepaid list, for a patient billable party only (OQ-73), and holds it until an admin approves and sends it. FT-08.1 names it as its one exception |
| D7 | Can an anaesthetist hand a List on without office confirmation (OQ-39)? | 32 | **Answered.** Yes. The anaesthetist moves their own List to the office (it becomes a Draft List) or pushes it into a colleague's free Slot, with no acceptance and no office confirmation. Who is told is OQ-65: build its recommendation (the office is notified and offered the cover-change email; the colleague sees a notice) |
| D8 | Receivables ageing and an "Overdue" view (RV-19, OQ-59) | 38 | **Answered.** A flat outstanding list, oldest first, with no buckets, no age chips and no Overdue view |
| D9 | Do billed Lists vanish from the anaesthetist's view (OQ-31)? | 38 | **Open.** Default: they stay, shown as "completed, unbilled" and then "billed" |
| D10 | How an additional invoice is priced (OQ-45) | 39 | **Answered.** Free-form lines (description, quantity, amount), with no Contract pricing or unit rules. The open details are OQ-72: build its recommendation |
| D11 | Can a Booking without an NHI be created (OQ-49)? | 40 | **Open**, with the meeting leaning to the default. Default: yes, flagged as provisional and on the problem list; its List cannot be authorised until the NHI is added |

## Tracks

```
Foundations  14 demo-trigger registry · 15 Card becomes Booking · 15a warnings & to-do list
Money fix    16 AA fee as a monthly invoice                                    (after 15a)
Contracts    17 surgeons & blacklist ─▶ 18 Contract model ─▶ 19 RVG & procedure masters
             ─▶ 20 one Contract per Procedure ─▶ 21 billable party & required inputs
             ─▶ 22 invoice delivery & payment setting ─▶ 23 primary, multi-procedure & combinations
             ─▶ 24 anaesthetist adjustment ─▶ 25 lock at AUTHORISED          (19 and 21 after 15a)
Prepayment   26 prepaid settings & profile ─▶ 27 prepayment lifecycle           (after 25, 15a)
Schedule     28 Slot/List split ─▶ 29 availability ─▶ 30 conflicts ─▶ 31 Draft Lists
             ─▶ 32 anaesthetist moves own List                                  (32 after 27)
Intake       33 matching screen ─▶ 34 sync & S1 rebuild ─▶ 35 explicit save & update email
                                                                     (34 after 27, 35 after 32)
Money        36 internal ledger ─▶ 37 Xero mirror │ 38 web accounts │ 39 additional invoices & credit
             ─▶ 39a payment runs                                                (after 37, 39)
Capture      38a find past work (after 38) ─▶ 39b pre-op & post-op events      (after 39)
Patients     40 missing NHI, balance warning, patient view ─▶ 40a NHI lookup & identity
Late         41 prepayment letters, trust & refunds ─ 42 reference data & loads ─ 43 scale & privacy
             ─ 43a ease of use
Demo         44 demo guide rewrite & final sweep
```

## Phases

| # | Phase | Delivers | Depends on | Covers (gaps / DM / RV) |
|---|-------|----------|------------|---:|
| 14 | [Screen-contextual demo triggers](phases/phase-14-demo-trigger-registry.md) | A shared, route-scoped trigger registry and a context hook in `src/shared`. A "Demo actions" menu in the harness bar and a PWA demo-actions sheet. Every existing Control Panel trigger re-homed to its screen; the Control Panel becomes the index. "Office authorises this List" on the PWA. Interim Future-scope badges on the HL7/FHIR tooling. First new trigger: "Simulate sign-in attempts" | none | 1 / 0 / 0 |
| 15 | [Card becomes Booking](phases/phase-15-booking-rename.md) | Card renamed to Booking across the model, ids, audit, seed, routes, registry and copy. Adds List-level attachments, an optional Booking source, and Copy as a skeleton-only new Booking | none | 1 / 2 / 2 |
| 15a | [Warnings and the to-do list](phases/phase-15a-warnings-and-to-do-list.md) | One pure warning routine: Warning records on the Booking (before or after procedure, mild or strong, several per Booking, never a block). A to-do list on the Admin dashboard with Clear, a warning triangle on Bookings in all three apps and a submit confirm step. The prepayment completion gate and its override replaced by a warning (D5) | 14, 15 | 4 / 1 / 0 |
| 16 | [AA fee as its own monthly invoice](phases/phase-16-aa-fee-invoice.md) | Step 1: the payable equals the receivable, and a part payment releases exactly what was received. Step 2: AA fee settings and a monthly run raising one AA-FEE invoice per anaesthetist (fixed items plus a per-BCTI charge, D1, counted by one pure function), shown in Admin and web Accounts. Xero pairs carry the invoice number and reference; the Xero NHI callout states the settled rule | 15a | 8 / 1 / 1 |
| 17 | [Surgeons, rooms and blacklist](phases/phase-17-surgeons-rooms-blacklist.md) | Surgeon profile with one HPI CPN field, surgeons' rooms with contacts, surgeon groups, hospital contact email and a blacklist master. A soft blacklist warning, as a shared helper, when the office assigns a List | 14, 15 | 4 / 1 / 0 |
| 18 | [Contract model](phases/phase-18-contract-model.md) | Contracts defined by category, holder, scope and pricing basis, each with an AA identifier. Fee-schedule lines with searchable holder codes, time bands, add-ons, GST incl/excl and effective dates. Review date and retire. ACC priced as an ordinary holder. Fee parity tests | 17 | 7 / 2 / 1 |
| 19 | [RVG, modifier and procedure masters](phases/phase-19-rvg-and-procedure-masters.md) | An editable RVG master with AA codes, RVG groups and the catalogue's modifier set. A master procedure list, one pure base-unit resolver and a procedure-first capture picker. Any base-unit value accepted, with an after-procedure office warning when out of range (D3) | 15a, 18 | 5 / 1 / 1 |
| 20 | [One Contract per Procedure](phases/phase-20-one-contract-per-procedure.md) | Billing route, payment category and the Procedure's insurer removed (D2). A Contract picker for anaesthetist and office, filtered by the picked procedure and the List's hospital, with holder-code search and the hospital Contract as default. An anaesthetist's Contract change is flagged for approval. Payer is the Contract holder and `funderOverride` stays as the split, both interim | 19 | 9 / 3 / 1 |
| 21 | [Billable party, required inputs and completeness](phases/phase-21-billable-party-and-required-inputs.md) | Billable party and invoice email on the Booking, defaulted from the Contract, with an independent override. Contracts declare required inputs; completion needs a Contract and those inputs. A not-on-schedule flag. Review approves every Contract. A mild warning when a child is the billable party (D4) | 15a, 20 | 10 / 2 / 0 |
| 22 | [Invoice presentation, delivery and the payment setting](phases/phase-22-invoice-presentation-and-delivery.md) | Invoice issued in the anaesthetist's name with AA as agent. Contract-driven layout, delivery and GST. The run sends each invoice to email or portal. A Contract payment setting (full or split) with a typed share replaces `funderOverride`. Provisional BCTI wording on the ACCPAY, still one BCTI per receivable invoice | 21 | 7 / 2 / 0 |
| 23 | [Primary Procedure, multi-procedure rule and combination Contracts](phases/phase-23-primary-procedure-and-multi-procedure-rule.md) | Exactly one primary Procedure, with "Make primary" on every surface and the feed. Booking-level pricing with the 3/2/2 modifier split, a per-Contract multi-procedure rule and a Contract base-unit override. Combination Contracts offered under each parent procedure | 19, 22 | 8 / 1 / 1 |
| 24 | [Contract-gated anaesthetist adjustment](phases/phase-24-anaesthetist-adjustment.md) | A separate anaesthetist adjustment (percent or fixed final, reason required), offered only where the Contract allows it and applied before the office override | 23 | 5 / 1 / 1 |
| 25 | [Contract versions and the AUTHORISED lock](phases/phase-25-contract-lock-at-authorised.md) | Contract version history and a per-Procedure locked record written at authorise, including base-unit source, payment setting and split, adjustment and payee. The engine prices only from that record. "Regenerate from locked data". The billing-failure trigger is re-based | 19, 22, 23, 24 | 6 / 1 / 1 |
| 26 | [Prepaid settings and anaesthetist profile](phases/phase-26-prepaid-settings-and-profile.md) | An anaesthetist profile on mobile and web: unit value, GST period, HPI CPN, GST number, bank details and a prepaid tick list of codes and groups. Admin can edit it on the anaesthetist's behalf | 19, 20 | 6 / 2 / 0 |
| 27 | [Prepayment lifecycle](phases/phase-27-prepayment-lifecycle.md) | Prepayment derived from the prepaid set for a paying patient. An estimator using estimated duration and contingency units; the full estimate stored on the Booking. The invoice generated at setup and sent on admin approval (D6). Part-paid tracking, a warning that strengthens as the date nears (D5), re-checks on change and move, and a balance invoice | 15a, 25, 26 | 11 / 2 / 1 |
| 28 | [Slot and List split](phases/phase-28-slot-list-split.md) | A Slot record holding the availability status and default times, from each anaesthetist's start date. A List with its own id, created on assignment and shown in place of the status. Status independent of bookings in all three apps. Reassign moves a List between Slots | 14, 15 | 5 / 2 / 1 |
| 29 | [Availability calendar and status master](phases/phase-29-availability-calendar.md) | Availability kept from a calendar on mobile and web as the Slot's own status, with days off ahead, series and single-instance edits. Web parity. Slot statuses become editable master data | 28 | 5 / 0 / 0 |
| 30 | [Conflicts, holidays and the conflict dashboard](phases/phase-30-conflicts-and-holidays.md) | Conflicts raised on every path, with a List colour change and clearing. Holidays can be edited and deleted. A cross-date conflict dashboard. Permanent Lists become recurring bookings, and edits repopulate the canvas | 29 | 5 / 0 / 0 |
| 31 | [Draft Lists and the day dashboard](phases/phase-31-draft-lists.md) | Draft Lists with hospital, surgeon, day and session required, able to hold Bookings, flagged "unassigned" with waiting time, assigned to a free Slot with warnings, removed or re-dated. Unavailability turns an anaesthetist's Lists into Draft Lists. The pairing rule is enforced. The Day dashboard shows Draft Lists and booking counts | 17, 30 | 9 / 1 / 0 |
| 32 | [Anaesthetist moves their own List](phases/phase-32-swap-requests.md) | An anaesthetist moves their own List to the office (a Draft List) or into a colleague's free Slot, at once, with a blacklist warning (D7). A Booking done by another anaesthetist moves to their List, with the payee and the prepayment re-check following. The cover-request marker is gone | 17, 27, 29, 31 | 3 / 2 / 1 |
| 33 | [Hospital download and the matching screen](phases/phase-33-hospital-matching-screen.md) | Imported rows are matched, used to create a Booking, a List or a Draft List, or rejected, with field diffs and change types. An unmatched queue. No silent apply: hospital messages land as rows | 20, 31 | 9 / 1 / 1 |
| 34 | [Hospital sync, PDF upload and the S1 rebuild](phases/phase-34-hospital-sync-and-s1.md) | Sync and last-synced state for St George's and Southern Cross only. Manual-provider sheets with a demo auto-match toggle. Surgeon PDF upload with estimated duration. The HL7/FHIR simulator and monitor are demoted to a Future-scope surface, and S1 is rebuilt | 27, 33 | 3 / 0 / 2 |
| 35 | [Explicit save and the update email](phases/phase-35-explicit-save-and-update-email.md) | Admin draft-then-save with change sets and as-at history. An on-demand mailto update email to the rooms (Booking change) or the hospital (cover change, including an anaesthetist's own move). Add a Booking to a booked List. Concurrent edits merge, or show a clash | 17, 25, 32, 33 | 5 / 1 / 0 |
| 36 | [Internal ledger and balance views](phases/phase-36-internal-ledger.md) | BillingCase promoted to linked receivable and payable legs as the system of record (one payable leg per receivable), with the payee stamped at authorise. Phase 16's BCTI count re-reads from the ledger with a parity test. An Admin Ledger screen (whole ledger and per anaesthetist) with an imbalance indicator | 16, 22, 25, 27 | 6 / 2 / 0 |
| 37 | [Xero mirror resilience](phases/phase-37-xero-mirror-resilience.md) | Disbursement detected from Xero. Bulk hospital remittance left in Xero. An outage queue with backoff. A void made in Xero is flagged | 36 | 3 / 0 / 0 |
| 38 | [Web accounts, outstanding list and GST schedule](phases/phase-38-web-accounts-truth.md) | A ledger-backed financial position with the Productivity and Leave panels removed. A flat outstanding list with no ageing (D8). A cash-basis GST schedule of payables actually paid, with a balance check. Billed Lists that stay visible | 28, 36 | 6 / 2 / 2 |
| 38a | [Find past work: calendar and search](phases/phase-38a-find-past-work.md) | A calendar on mobile and web that jumps to any past day and drills to List, Booking and Procedure, and a search for Bookings by NHI or patient name | 38 | 2 / 0 / 0 |
| 39 | [Additional invoices and credit-and-rebill](phases/phase-39-additional-invoices-and-credit.md) | A free-form admin additional invoice on a Procedure (D10) replaces the addendum Card, including a split of a combined Procedure. Credit in full and rebill, reversing both the ledger and Xero, with a negative invoice to an anaesthetist already paid | 23, 36 | 5 / 2 / 1 |
| 39a | [Payment runs: BCTI approval, netting and remittance](phases/phase-39a-payment-runs-and-remittance.md) | A payables run record per period with an approve-for-payment step, negative invoices netted per anaesthetist, a remittance advice in Admin and web Accounts, and a carried-forward negative invoiced to the anaesthetist after a set period (OQ-71's recommendation in full) | 37, 39 | 2 / 1 / 0 |
| 39b | [Pre-op and post-op events](phases/phase-39b-pre-and-post-op-events.md) | Pre-op and post-op events on a Procedure from mobile and web (date, time or fixed fee, billable or not), approved by the office and invoiced on their own line. The ACC pre-op assessment as a fixed-fee pre-op event. Billing lines with their own date, preset types (post-op review, nerve catheter, pain consult, transport) and Contract add-on fees | 23, 38a, 39 | 5 / 1 / 0 |
| 40 | [Patients: missing NHI, balance warning, patient view](phases/phase-40-patients-and-alerts.md) | A patient record with invoices and follow-up actions. A missing-NHI problem list with attach and merge, and an authorise guard (D11 default). A mild or strong warning at booking when a paying patient owes money | 15a, 34, 36 | 8 / 1 / 1 |
| 40a | [NHI lookup and identity standards](phases/phase-40a-nhi-lookup-and-identity.md) | NHI lookup with validation at entry, Hub states with a manual fallback, a purpose statement and refresh from the register. HPI CPN shown consistently | 26, 40 | 2 / 0 / 0 |
| 41 | [Prepayment letters, trust account and refunds](phases/phase-41-prepayment-followup-credits-refunds.md) | Prepayment letter templates and reminders, an overpaid prepayment accepted with no credit, a provisional trust account holding prepayments until the procedure, refund on cancellation, the payee repointed when a prepaid Booking moves, and a fresh prepayment on rebooking | 27, 39, 39a | 8 / 1 / 0 |
| 42 | [Reference data and controlled loads](phases/phase-42-reference-data-and-loads.md) | Every master editable, including hospitals, insurers, recurring bookings and public holidays. A spreadsheet loader with row validation. A clean-cut go-live demo | 17, 18, 19, 29, 30 | 4 / 1 / 0 |
| 43 | [Scale and privacy](phases/phase-43-scale-and-privacy.md) | A full-scale in-memory dataset with timings, a restricted raw-row view, an NHI leak scan and a synthetic-data badge | 34, 36, 42 | 2 / 0 / 0 |
| 43a | [Ease of use: simple anaesthetist screens and point-of-need help](phases/phase-43a-ease-of-use.md) | Anaesthetist screens free of Contract complexity, and point-of-need help on mobile capture, Admin Day and Admin Review, with a first-run hint per app | 21, 24, 31, 39b | 1 / 0 / 0 |
| 44 | [Demo guide rewrite and final sweep](phases/phase-44-demo-guide-rewrite.md) | S1 to S5 rewritten, Control Panel jumps rebuilt, stale copy swept, master guide regenerated in full, trigger and PWA-parity audit, PROGRESS entry | all | 0 / 0 / 1 |
| | **Total** | 190 gaps, 40 DM and 20 RV closed; none parked | | **190 / 40 / 20** |

## Sequencing rules

- **Run 14 and 15 first, in either order.** Run 15 before any phase that edits booking code. If 14
  runs first, 15's rename also covers the registry's route patterns and labels.
- **15a runs after 14 and 15, and before 19, 21, 27 and 40,** which each register a warning rule
  into its routine. It also removes the prepayment completion gate (D5), so S4 Beat 1 changes here.
- **16 runs straight after the foundations, by design, and after 15a.** The fee fix is isolated and
  cheap, and it changes the S3 figures. Step 1 (fee removal) is re-greened before step 2 (the monthly
  fee invoice) starts. It follows 15a so the first milestone (after 16) includes the warnings.
- **BCTI granularity is built one way and labelled provisional.** The catalogue says both "one BCTI
  per procedure" (US-09.1.4 note, OQ-29, the 2026-10-01 note #41) and "the same value as its
  receivable" (OQ-42), and a receivable can hold several Procedures, so both cannot hold (DM-22 says
  as much). The plan builds one BCTI, the ACCPAY, per receivable invoice, the same value: the
  transcript's "per transaction" (B L71-81), and what US-10.2.1's release needs. 16 counts BCTIs for
  the fee run through one pure, tested function; 22 (Split gives two invoices, so two BCTIs), 36 (the
  ledger's payable legs), 39 (additional invoices) and 39b (event invoices) feed it and keep it the
  only count, and 36 adds a parity test. "One per procedure" stays an open point to raise with AA's
  accountant beside OQ-29 and OQ-60; if it flips, the count function, the $700 seed and the S3 and
  S4 figures are re-baselined in one place.
- **The Contracts track runs strictly in order, 17 to 25.**
  - 18 keeps today's resolver, so the app stays green until 20 swaps in explicit selection.
  - 19 comes straight after 18 so the base-unit sources (procedure list, Contract override, RVG)
    and the procedure-first picker are final before 20's Contract picker, 23's Booking-level engine
    and 25's lock build on them. Its items are mostly Verify while OQ-62 is open, so it carries a
    "confirm before building" flag.
  - 20 leaves two interims: the payer is the Contract holder until 21 stores a billable party (with
    its override), and the seeded `funderOverride` two-funder split stays the split mechanism until
    22 replaces it with the Contract's payment setting.
  - 23 builds combination Contracts, which 39 needs to split a combined Procedure.
  - 25 locks what 18 to 24 built, including the adjustment from 24 and the payee.
- **26 and 27 run back to back, after 25.** 20 leaves an office-set "prepayment required" flag on
  the Booking as the interim until 27 derives it.
- **The Schedule track runs strictly in order, 28 to 32.** 28 is the Slot/List foundation; 31 and 32
  reuse 17's blacklist warning helper; 32 also needs 31 (a List moved to the office becomes a Draft
  List) and 27 (a move re-checks the prepayment).
- **Intake (33 to 35) runs after 31 and 20**, because a row can create a Draft List and a created
  Booking takes the default Contract. 34 also needs 27, which adds the estimated duration per
  Procedure (DM-40) that 34's PDF review edits. 35 also needs 25's versioned history and 32's moves
  (the cover-change email follows an anaesthetist's own move).
- **Money:** 36 runs after 16, 22, 25 and 27 (it re-points prepayment status and AA fee invoices).
  Then 37, 38 and 39 can run in any order. 39a runs after 37 and 39 (it records the payables run and
  nets 39's negative invoices).
- **Capture:** 38a runs after 38 (billed Lists stay visible). 39b runs after 38a and 39, and soon
  after 39, because 39 withdraws the anaesthetist's post-op Card flow that 39b brings back as events.
- **The remaining phases:**
  - 40 runs after 15a, 34 and 36; 40a after 26 and 40.
  - 41 runs after 27, 39 and 39a (it needs credit notes, the ledger and the payables run record).
  - 42 runs after every master-data phase.
  - 43 runs after 42; 43a after the capture and review screens settle (21, 24, 31, 39b).
  - 44 runs last.
- **Contracts and Schedule are independent from 17 until 32.** Contracts go first because the track
  is mostly Confirmed and carries the S3, S4 and S5 money beats, and 32 needs 27.
- **Open questions with a recommendation are built as that recommendation** and labelled
  provisional (the meeting's working rule), each kept in one place so a different answer is a small
  change.
- **Every phase opens with a drift check** against `501b0b8` for its items and linked OQs, and
  confirms any owner decision it depends on.
- **Every phase closes the same way:**
  - `npm run build`, `npm run build:pwa` and `npx vitest run` are green.
  - `npm run shots` (Playwright) is green for any phase that touches UI; `data-shot` hooks and specs
    move with the code they follow.
  - The adversarial review pass has run (PROGRESS convention 18).
  - `PERSIST_VERSION` is bumped whenever the seed's shape or content changes.
  - Billing maths stays pure with Vitest tests.
  - The Decisions log is updated wherever a settled July ruling is superseded. Known cases: the
    route model, the 5% fee netting, Copy as an additional procedure, the addendum Card, the
    prepayment completion gate, the silent BTM fallback, the cover-request flow and hospital
    auto-apply.
  - A PROGRESS.md entry is recorded.

**Where the critic's review was not followed.** The escalating unpaid-prepayment warning (US-06.3.2,
Confirmed) and the re-check (US-06.3.5) stay in 27 rather than moving to 41: the warning is the
control that replaced the completion gate, and moving it would leave S4 Beat 1 with no control for
fourteen phases. Contract pricing and adjustment rules (US-04.2.2) closes in 24, not 23, because its
last missing part is the Contract's allows-adjustment rule; 23 builds the base-unit override half.
In the second review, Phase 32's file name (`phase-32-swap-requests.md`) is kept although "swap" is
no longer catalogue vocabulary: the plan tools pin an existing phase's doc path in `plan.json`, so
renaming only the slug would put the slug, the doc and the links out of step. The phase title and
every app-facing word already say "move". Renaming the file is a separate mechanical step (move both
files, then update `plan.json` and the links) if wanted.

**Placement notes for the 2026-10-01 update.**

- 15a is new and early: the catalogue's warning routine is cheap to build over today's data, and
  four later phases plug a rule into it. Removing the gate there (D5) gives an early, correct S4 Beat 1.
- US-05.5.2 (ACC pre-op codes) moves from 19 and US-03.3.6 (other billing lines) from 39 to 39b,
  because the ACC pre-op assessment and late lines are now pre-op and post-op events.
- US-08.6.4 is unparked into 39 now that OQ-53 is answered; its combination Contract is 23's.
- 39a is split from 39 so neither passes two sessions: 39 raises the negative invoice, 39a nets it.
  39a builds OQ-71's recommendation in full (carry a negative forward, then invoice the anaesthetist
  after a set period, through 16's anaesthetist invoice path), so it is estimated at 2 sessions.
- 39b carries all of US-03.3.6, not just the dated line: preset line types and Contract add-on fee
  lines (from 18's add-on schedule lines) as well as a date of their own.
- The overpaid-prepayment fix (FT-06.4, US-06.4.2) stays in 41: the answer made it simpler (no
  credit), not more urgent.
- US-09.3.1 goes to 16, which already edits the Xero simulator, so the stale NHI callout goes early.
- US-15.0.1 gets its own late phase (43a) once the capture screens settle; 20 builds the
  anaesthetist's Contract picker to its rule (no Contract complexity on the anaesthetist's side).
- 32 becomes the anaesthetist's own move and takes US-01.4.6 (the doer rule); the payee repoint of a
  moved prepaid Booking (US-06.5.4) is 41's, beside the trust account.

### Demo triggers

Phase 14 builds the mechanism and re-homes every existing trigger. Later phases register new entries
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
"Credit in full and rebill", "Approve and send", "Run monthly fee invoices", "Sync now" and "Import
hospital download" (with a badged sample-file picker). 15a's "Raise sample warnings" is one shared
trigger: each phase that adds a warning rule adds its sample to it.

### PWA parity

The PWA has no harness bar and no Admin app, so a handset demo cannot switch to the office. Every
phase whose beat has a mobile side that waits on the office, a colleague or a backend event
registers a PWA-surface entry for the mobile screen concerned, for example "Office authorises this
List" (14), "Office clears this warning" (15a), "Office approves this Contract change" (21), "Office
approves and sends the prepayment invoice" (27), "Office assigns a Draft List to me" (31),
"Colleague pushes a List into my free Slot" (32), "Hospital row arrives and the office matches it"
(33), "Office approves this event" (39b) and "Office attaches the NHI" (40). These stand-ins show on
the PWA only: in the framed build the presenter plays the office in Admin. "Play the office" (RV-22)
stays as a signposted scaffold, defaults to OFF and shows a badge when on, and loses nothing because
14 adds the per-List trigger. Phase 44 checks PWA parity beat by beat.

### Demo guide

- **Each phase patches the beats it breaks,** in the same session: `docs/demo-guide` (run sheet,
  cheat sheet, workflows), the matching sections of `master-demo-guide.html`, and the Control Panel
  scenario text. The self-contained guide presenters use is never more than one phase stale.
- **Each milestone phase (16, 25, 27, 32, 35, 39a) ends with a consistency read** of
  `master-demo-guide.html` against the run sheet.
- **Phase 44 rewrites the S1 to S5 run sheet** around the new model and regenerates
  `master-demo-guide.html` in full.
- **Phase 14 adds a Future-scope caveat to S1** while the HL7/FHIR tooling still carries it; 15a
  turns S4 Beat 1's gate into a warning; 34 rebuilds S1.

### Confirm before building

These phases carry unresolved open questions (OQ) or Open/Verify items. Each checks them at its drift
check, and if they are still open builds the recommended reading (or the owner-decision default) and
labels it provisional in the UI.

| Phase | Items | Open questions |
|---|---|---|
| 15a | FT-13.7 and US-13.7.1 to US-13.7.3 (Verify): where the to-do list sits, whether clearing is recorded, the submit confirm step | none |
| 16 | FT-10.3, US-10.3.1 and US-10.3.3 (Verify): what the per-invoice charge counts; the payment cycle; BCTI granularity (one per receivable invoice built; "one per procedure" unresolved) | OQ-60, OQ-47, OQ-29 |
| 17 | blacklist wording, one list or two | OQ-43 |
| 18 | US-04.1.4 and US-04.2.1 (Verify): the AA code scheme, who a Contract belongs to, the price-in-force date | OQ-66, OQ-67, OQ-48 |
| 19 | US-05.1.1, US-05.1.6 and US-03.3.1 (Verify): where base units live, how a procedure is picked | OQ-62 |
| 20 | FT-04.3 and US-04.3.2 (Verify): finding Contracts among thousands | OQ-66 |
| 21 | FT-11.2 (Verify), US-11.2.2 (Open): a per-Booking billable party beside the Contract's | OQ-67 |
| 22 | US-04.2.12 and US-08.2.3 (Verify): the split basis; GST agency, the BCTI's new name and its granularity | OQ-68, OQ-29 |
| 23 | FT-05.3 (Verify), US-05.3.1 (Open): the equal split, for Ben to validate; US-04.2.11 (Verify) | OQ-15, OQ-66 |
| 24 | US-03.5.1 and US-04.2.2 (Proposed) | OQ-62 |
| 26 | US-12.1.4 (Verify) | none |
| 27 | EP-06, US-06.2.1, US-06.2.2, US-06.3.1 and US-06.3.5 (Verify): contingency units, the time rule, a non-patient payer, a moved Booking | OQ-38, OQ-75, OQ-73, OQ-70 |
| 28 to 31 | FT-01.2, US-01.2.1 to US-01.2.3, US-01.5.2, US-01.5.3, FT-01.6, US-01.6.1, US-01.6.3, US-01.6.4 and FT-01.3 (Verify): the logical model, status values and names, Draft Lists for unavailability | OQ-64 |
| 32 | US-01.4.3 and US-01.4.6 (Verify): who is told, the blacklist wording, prepayment on a move | OQ-65, OQ-43, OQ-70 |
| 33, 34 | FT-02.1 (Verify) | OQ-13 |
| 35 | US-02.3.3 (Verify): a prompt or a button; who is told after an anaesthetist's move | OQ-69, OQ-65 |
| 38 | billed Lists (D9); US-12.2.2 (Verify) | OQ-31 |
| 39 | FT-08.6 and US-08.6.1 to US-08.6.4 (Verify) | OQ-72, OQ-71 |
| 39a | US-10.2.5 and US-10.2.6 (Verify): who approves; recovering a negative with no later payment (carry forward, then invoice after a set period) | OQ-47, OQ-71 |
| 39b | FT-03.7, US-03.7.1 and US-03.7.2 (Verify), US-05.5.2 (Open), US-03.3.6 (Proposed): how lines relate to events | OQ-63, OQ-12 |
| 40 | US-11.1.4 (Open), US-11.3.2 (Verify); Booking without NHI (D11) | OQ-49, OQ-74 |
| 41 | FT-06.4, US-06.4.2, FT-06.5 and US-06.5.1 to US-06.5.4 (Verify) | OQ-61, OQ-70, OQ-47 |

## Milestone demos

These are what you can show at each point.

- **After 16** (15a runs before it): Booking vocabulary everywhere. Every demo action on its own screen, in the harness
  bar and on a handset, with the HL7/FHIR tooling badged Future scope. Warnings, never blocks: one
  routine, the to-do list, a triangle on Bookings, and the prepayment gate turned into a warning. The
  corrected payables story: the payable equals the receivable, and AA's fee is a monthly invoice
  built from its settings.
- **After 25:** the catalogue's pricing model, end to end:
  - editable RVG, modifier and master procedure lists feeding base units, with any value accepted
    and an office warning when out of range;
  - a procedure-first pick, then one Contract per Procedure, filtered by procedure and hospital,
    with holder-code search and a default;
  - billable party defaulting from the Contract, required inputs, and a child warning;
  - invoices sent by the billing run, with a full or split payment setting;
  - the 3/2/2 modifier split, combination Contracts and a Contract-gated adjustment;
  - a lock at AUTHORISED that reproduces invoices exactly.

  S3, S4 Beat 3 and S5 are re-scripted.
- **After 27:** prepayment from the anaesthetist's prepaid set for a paying patient: the estimate
  from estimated duration, the invoice generated at setup and sent on admin approval, part-paid
  tracking, a warning in both apps that strengthens as the date nears, and the balance invoice. S4
  Beat 1 is re-scripted.
- **After 32:** the office's schedule: Slots and Lists, the availability calendar with series, the
  conflict dashboard, Draft Lists that hold Bookings with a waiting flag (including from
  unavailability), blacklist warnings, and anaesthetists moving their own Lists to the office or a
  colleague. S2 is re-scripted.
- **After 35:** S1 rebuilt: hospital sync, then the matching screen, then a Booking on its default
  Contract. Explicit save and the on-demand update email to the rooms or the hospital.
- **After 39a:** the money story on the internal ledger: balances shown in or out of balance, Xero
  mirror resilience, ledger-backed web accounts with a flat outstanding list and a cash-basis GST
  schedule, free-form additional invoices (including a split combined procedure), credit-and-rebill,
  and payment runs with BCTI approval, netting and a remittance advice. S4 Beats 2 to 5 are
  re-scripted.
- **After 44:** every verified gap closed: finding past work, pre-op and post-op events, patients
  with balance warnings and NHI lookup, prepayment letters, the trust account and refunds,
  reference-data loads, full-scale and privacy demos, point-of-need help, and the rewritten S1 to S5
  run sheet.

## Parked

Nothing is parked. US-08.6.4 (split a combined Procedure into additional invoices), parked in the
first plan while OQ-53 was open, is now in Phase 39: OQ-53 made a combination a Contract set
against each of its parent procedures (built in 23).

Kept but not planned as work: RV-22, the PWA's "Play the office" auto-authorise. It stays as a
signposted demo scaffold. Phase 14 badges it, defaults it to OFF, and adds the per-List "Office
authorises this List" trigger in its place.

## When the catalogue changes

The catalogue keeps changing, and this plan is pinned to commit `501b0b8`.

1. **Every phase starts with a drift check.** Diff the catalogue files for the phase's covered IDs
   and their linked OQs against the snapshot, and check whether any owner decision it depends on has
   been answered:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
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
