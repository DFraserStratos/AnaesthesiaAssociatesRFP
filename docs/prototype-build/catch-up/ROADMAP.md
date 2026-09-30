# AA Prototype · Requirements catch-up roadmap

The prototype was built in July 2026 against the original RFP (phases 00 to 13, see
[../ROADMAP.md](../ROADMAP.md)). The requirements catalogue is now the source of truth and has moved
a long way from the RFP. This catch-up brings the prototype up to the catalogue as at commit
**`1f067a8`**. Future and Retired items are out; retired behaviour the prototype still has is removed
or reworked.

The plan closes every verified gap in the [gap analysis](GAP-ANALYSIS.md): 165 gap items, 34
data-model deltas (DM) and 20 reverse findings (RV), with one item parked. Per-gap detail is in
[epics/](epics/), the machine-readable set in [gaps.json](gaps.json), and the code index in
[analysis/](analysis/) (prototype maps, [data-model delta](analysis/domain-model-delta.md),
[reverse check](analysis/reverse-check.md)).

There are thirty-one phases, numbered from 14 (about 52 sessions in all). Each one is sized for
**one focused Claude Code session (two at most) with one coherent deliverable**, like the originals,
and has a plan in `phases/phase-NN-<slug>.md`. Every phase leaves the app green, demoable and fully
migrated, because the prototype is shown in live workshops between phases.

## Owner decisions before building

These readings shape what a phase delivers, not just its labels. Each is a question on the Requirements Board (the OQ named in its row). **Ask the owner for all of them
before Phase 14 starts.** If an answer has not come in by the time its phase starts, build the
default and label it provisional in the UI; the phase's drift check confirms the gating answer
first.

| # | Decision | Gates | Default if no answer |
|---|---|---|---|
| D1 | Does AA's fee net against the payable at all, and on what basis (OQ-02)? | 16 | The payable equals the receivable. A separate AA-FEE invoice, 5% of amounts collected for the anaesthetist, held as one labelled constant |
| D2 | Insurer and funding source: on the Booking or on the Patient (OQ-55)? | 20 | On the Booking (DM-35) |
| D3 | Ranged base codes: drop the published-range bound (RV-04, low confidence; OQ-56)? | 19 | Drop the hard bound; an out-of-range entry raises an office review flag |
| D4 | Child as billable party: block or warn (OQ-54)? | 21 | The OQ-54 recommendation: flag at setup and at review, and block authorising that List until an adult is set |
| D5 | Keep the hard prepayment completion gate (RV-09: a settled July ruling; the catalogue is silent; OQ-57)? | 27 | Remove the gate and its audited override; the escalating unpaid-prepayment alert is the control. If the gate is kept, it stays, but fires from the derived requirement instead of the patient category |
| D6 | Who raises the prepayment invoice at setup (FT-08.1 says no engine action before AUTHORISED; US-06.3.1 has the engine raise it; OQ-58)? | 27 | The engine raises it when the estimate is set, recorded as a named exception to FT-08.1. If the office raises it: keep today's manual raise, prompted on the Booking |
| D7 | Can an anaesthetist hand a List to a colleague without office confirmation (OQ-39)? | 32 | Office confirms, as US-01.4.3 is written. A direct handover would turn the confirm step into an office notification |
| D8 | Receivables ageing and an "Overdue" view (RV-19, conflicting evidence; OQ-59)? | 38 | A flat outstanding list, oldest first, with no buckets and no age chips |
| D9 | Do billed Lists vanish from the anaesthetist's view (OQ-31)? | 38 | They stay, shown as "completed, unbilled" and then "billed" |
| D10 | How an additional invoice is priced (OQ-45)? | 39 | The OQ-45 recommendation: RVG time and modifiers at the anaesthetist's unit value, with the admin free to override the amount and billable party, every override audited |
| D11 | Can a Booking without an NHI be created (OQ-49)? | 40 | The OQ-49 recommendation: yes, as provisional and on the problem list; its List cannot be authorised until the NHI is added |

## Tracks

```
Foundations  14 demo-trigger registry · 15 Card becomes Booking
Money fix    16 AA fee as its own invoice                                      (after 14, 15)
Contracts    17 surgeons & blacklist ─▶ 18 Contract model ─▶ 19 RVG & Procedure masters
             ─▶ 20 one Contract per Procedure ─▶ 21 billable party & required inputs
             ─▶ 22 invoice delivery ─▶ 23 primary & multi-procedure rule
             ─▶ 24 anaesthetist adjustment ─▶ 25 lock at AUTHORISED
Prepayment   26 prepaid settings & profile ─▶ 27 prepayment lifecycle           (after 25)
Schedule     28 Slot/List split ─▶ 29 availability ─▶ 30 conflicts ─▶ 31 Draft Lists ─▶ 32 swaps
Intake       33 matching screen ─▶ 34 sync & S1 rebuild ─▶ 35 explicit save & update email
Money        36 internal ledger ─▶ 37 Xero mirror │ 38 web accounts │ 39 additional invoices & credit
Patients     40 missing NHI, unpaid alert, patient view                         (after 34, 36)
Late         41 prepayment letters, credits & refunds ─ 42 reference data & loads ─ 43 scale & privacy
Demo         44 demo guide rewrite & final sweep
```

## Phases

| # | Phase | Delivers | Depends on | Covers (gaps / DM / RV) |
|---|-------|----------|------------|---:|
| 14 | [Screen-contextual demo triggers](phases/phase-14-demo-trigger-registry.md) | A shared, route-scoped trigger registry and a context hook in `src/shared`. A "Demo actions" menu in the harness bar and a PWA demo-actions sheet. Every existing Control Panel trigger re-homed to its screen; the Control Panel becomes the index. "Office authorises this List" on the PWA. Interim Future-scope badges on the HL7/FHIR tooling. First new trigger: "Simulate sign-in attempts" | none | 1 / 0 / 0 |
| 15 | [Card becomes Booking](phases/phase-15-booking-rename.md) | Card renamed to Booking across the model, ids, audit, seed, routes, registry and copy. Adds Booking source, List-level attachments, and Copy as a skeleton-only new Booking | none | 1 / 2 / 2 |
| 16 | [AA fee as its own invoice](phases/phase-16-aa-fee-invoice.md) | Step 1: the payable equals the receivable, and a part payment releases exactly what was received. Step 2: an AA-FEE invoice per anaesthetist, shown in Admin and web Accounts. Xero pairs carry the invoice number and reference | 14, 15 | 7 / 1 / 1 |
| 17 | [Surgeons, rooms and blacklist](phases/phase-17-surgeons-rooms-blacklist.md) | Surgeon profile, surgeons' rooms with contacts, surgeon groups, hospital contact email and a blacklist master. A soft blacklist warning, as a shared helper, when the office assigns a List | 14, 15 | 4 / 1 / 0 |
| 18 | [Contract model](phases/phase-18-contract-model.md) | Contracts defined by category, holder, scope and pricing basis. Fee-schedule lines with time bands, add-ons, GST incl/excl and effective dates. Review date and retire. ACC priced as an ordinary holder. Fee parity tests | 17 | 6 / 2 / 1 |
| 19 | [RVG, modifier and Procedure masters](phases/phase-19-rvg-and-procedure-masters.md) | An editable RVG master with AA codes, RVG groups and the catalogue's modifier set. A Procedure master and one pure base-unit resolver (Procedure master, Contract override, RVG). Ranged base units unbounded with a review flag. ACC pre-op codes | 18 | 6 / 1 / 1 |
| 20 | [One Contract per Procedure](phases/phase-20-one-contract-per-procedure.md) | Billing route and payment category removed. A filtered Contract picker for anaesthetist and office, defaulting to the hospital Contract. Insurer and funding source on the Booking. An anaesthetist's Contract change is flagged for approval. Payer is the Contract holder and `funderOverride` stays as the split, both interim | 19 | 9 / 3 / 1 |
| 21 | [Billable party, required inputs and completeness](phases/phase-21-billable-party-and-required-inputs.md) | Billable party on the Booking with an independent override, and invoices grouped by it. Contracts declare required inputs; completion needs a Contract and those inputs. Invoice email for patient-direct. A not-on-schedule flag. Review approves every Contract and flags a child payer | 20 | 10 / 2 / 0 |
| 22 | [Invoice presentation and delivery](phases/phase-22-invoice-presentation-and-delivery.md) | Invoice issued in the anaesthetist's name with AA as agent. Contract-driven layout, delivery and GST. The run sends each invoice to email or portal. A covered-amount split replaces `funderOverride`. Provisional buyer-created ACCPAY wording | 21 | 6 / 2 / 0 |
| 23 | [Primary Procedure and the multi-procedure rule](phases/phase-23-primary-procedure-and-multi-procedure-rule.md) | Exactly one primary Procedure, with "Make primary" on every surface and the feed. Booking-level pricing with the 3/2/2 modifier split, a per-Contract multi-procedure rule and a Contract base-unit override | 19, 22 | 7 / 1 / 1 |
| 24 | [Contract-gated anaesthetist adjustment](phases/phase-24-anaesthetist-adjustment.md) | A separate anaesthetist adjustment (percent or fixed final, reason required), offered only where the Contract allows it and applied before the office override | 23 | 5 / 1 / 1 |
| 25 | [Contract versions and the AUTHORISED lock](phases/phase-25-contract-lock-at-authorised.md) | Contract version history and a per-Procedure locked record written at authorise, including base-unit source, split and adjustment. The engine prices only from that record. "Regenerate from locked data". The billing-failure trigger is re-based | 19, 22, 23, 24 | 6 / 1 / 1 |
| 26 | [Prepaid settings and anaesthetist profile](phases/phase-26-prepaid-settings-and-profile.md) | An anaesthetist profile on mobile and web: unit value, GST period, bank details and a prepaid tick list of codes and groups. Admin can edit it on the anaesthetist's behalf | 19, 20 | 6 / 2 / 0 |
| 27 | [Prepayment lifecycle](phases/phase-27-prepayment-lifecycle.md) | Prepayment derived from the prepaid set. An estimator using contingency units and estimated duration, stored on the Booking and invoiced at setup. Part-paid tracking, a date-driven alert, a re-check and a balance invoice. The completion gate per D5 | 25, 26 | 10 / 1 / 1 |
| 28 | [Slot and List split](phases/phase-28-slot-list-split.md) | A Slot record holding availability and default times. A List with its own id, created on assignment. Status independent of bookings in all three apps. Reassign moves a List between Slots | 14, 15 | 4 / 2 / 1 |
| 29 | [Availability calendar and status master](phases/phase-29-availability-calendar.md) | Availability set weeks ahead from a calendar on mobile and web, including leave and emergency. Web parity. Slot statuses become editable master data | 28 | 5 / 0 / 0 |
| 30 | [Conflicts, holidays and the conflict dashboard](phases/phase-30-conflicts-and-holidays.md) | Conflicts raised on every path, with a List colour change and clearing. Holidays can be edited and deleted. A cross-date conflict dashboard. Permanent List edits repopulate the canvas | 29 | 5 / 0 / 0 |
| 31 | [Draft Lists and the day dashboard](phases/phase-31-draft-lists.md) | Draft Lists created, shown flagged with waiting time, and assigned to a free Slot with warnings. The pairing rule is enforced. The Day dashboard shows Draft Lists and booking counts | 17, 30 | 8 / 1 / 0 |
| 32 | [Swap requests](phases/phase-32-swap-requests.md) | An anaesthetist asks to swap one of their own Lists to a colleague, with a blacklist warning. The office confirms in a queue, and confirmation reassigns the List | 17, 29 | 2 / 1 / 1 |
| 33 | [Hospital download and the matching screen](phases/phase-33-hospital-matching-screen.md) | Imported rows are matched, used to create a Booking or List, or rejected, with field diffs and change types. An unmatched queue. No silent apply: hospital messages land as rows | 20, 31 | 9 / 1 / 1 |
| 34 | [Hospital sync, PDF upload and the S1 rebuild](phases/phase-34-hospital-sync-and-s1.md) | Per-hospital sync and last-synced state. Manual-provider sheets with a demo auto-match toggle. Surgeon PDF upload. The HL7/FHIR simulator and monitor are demoted to a Future-scope surface, and S1 is rebuilt | 33 | 3 / 0 / 2 |
| 35 | [Explicit save and the update email](phases/phase-35-explicit-save-and-update-email.md) | Admin draft-then-save with change sets and as-at history. A mailto update email to the rooms or hospital. Add a Booking to a booked List. Concurrent edits merge, or show a clash | 17, 25, 33 | 5 / 1 / 0 |
| 36 | [Internal ledger and balance views](phases/phase-36-internal-ledger.md) | BillingCase promoted to linked receivable and payable legs as the system of record. An Admin Ledger screen (whole ledger and per anaesthetist) with an imbalance indicator | 16, 22, 25, 27 | 7 / 2 / 0 |
| 37 | [Xero mirror resilience](phases/phase-37-xero-mirror-resilience.md) | Disbursement detected from Xero. Bulk hospital remittance left in Xero. An outage queue with backoff. A void made in Xero is flagged | 36 | 3 / 0 / 0 |
| 38 | [Web accounts and dashboard](phases/phase-38-web-accounts-truth.md) | A ledger-backed financial position with the Productivity and Leave panels removed. A flat outstanding list, a GST-period activity summary, and billed Lists that stay visible | 28, 36 | 4 / 1 / 2 |
| 39 | [Additional invoices and credit-and-rebill](phases/phase-39-additional-invoices-and-credit.md) | An admin additional invoice on a Procedure replaces the addendum Card. Credit in full and rebill, reversing both the ledger and Xero | 36 | 5 / 2 / 1 |
| 40 | [Patients: missing NHI, unpaid alert, patient view](phases/phase-40-patients-and-alerts.md) | A patient record with invoices and follow-up actions. A missing-NHI problem list with attach and merge. An unpaid alert at booking, with a threshold | 34, 36 | 8 / 1 / 1 |
| 41 | [Prepayment letters, credits and refunds](phases/phase-41-prepayment-followup-credits-refunds.md) | Prepayment letter templates and reminders, credit for an overpaid prepayment, a provisional trust account, refund on cancellation, and a prepayment for a replacement anaesthetist | 27, 39 | 7 / 1 / 0 |
| 42 | [Reference data and controlled loads](phases/phase-42-reference-data-and-loads.md) | Every master editable, including hospitals, insurers and public holidays. A spreadsheet loader with row validation. A clean-cut go-live demo | 17, 18, 19, 29, 30 | 4 / 1 / 0 |
| 43 | [Scale and privacy](phases/phase-43-scale-and-privacy.md) | A full-scale in-memory dataset with timings, a restricted raw-row view, an NHI leak scan and a synthetic-data badge | 34, 36, 42 | 2 / 0 / 0 |
| 44 | [Demo guide rewrite and final sweep](phases/phase-44-demo-guide-rewrite.md) | S1 to S5 rewritten, Control Panel jumps rebuilt, stale copy swept, master guide regenerated in full, trigger and PWA-parity audit, PROGRESS entry | all | 0 / 0 / 1 |
| | **Total** | 165 gaps, 34 DM and 20 RV closed; 1 parked | | **165 / 34 / 20** |

## Sequencing rules

- **Run 14 and 15 first, in either order.** Run 15 before any phase that edits booking code. If 14
  runs first, 15's rename also covers the registry's route patterns and labels.
- **16 runs straight after 14 and 15, by design.** The fee fix is isolated and cheap, and it changes
  the S3 figures. Step 1 (fee removal) is re-greened before step 2 (the fee invoice) starts.
- **The Contracts track runs strictly in order, 17 to 25.**
  - 18 keeps today's resolver, so the app stays green until 20 swaps in explicit selection.
  - 19 comes straight after 18 so the base-unit sources (Procedure master, Contract override, RVG)
    are final before 23's Booking-level engine and 25's lock build on them. Its items are mostly
    Verify, Proposed or Open, so it carries a "confirm before building" flag.
  - 20 leaves two interims: the payer is the Contract holder until 21 stores a billable party, and
    the seeded `funderOverride` two-funder split stays the split mechanism until 22 replaces it with
    a covered amount.
  - 25 locks what 18 to 24 built, including the adjustment from 24.
- **26 and 27 run back to back, after 25.** 20 leaves an office-set "prepayment required" flag on
  the Booking as the interim until 27 derives it.
- **The Schedule track runs strictly in order, 28 to 32.** 28 is the Slot/List foundation; 31 and 32
  reuse 17's blacklist warning helper.
- **Intake (33 to 35) runs after 31 and 20**, because a row can create a Draft List and a created
  Booking takes the default Contract. 35 also needs 25's versioned history.
- **Money:** 36 runs after 16, 22, 25 and 27 (it re-points prepayment status and AA fee invoices).
  Then 37, 38 and 39 can run in any order.
- **The remaining phases:**
  - 40 runs after 34 and 36.
  - 41 runs after 27 and 39 (it needs credit notes and the ledger).
  - 42 runs after every master-data phase.
  - 43 runs after 42.
  - 44 runs last.
- **Contracts and Schedule are independent after 17.** Contracts go first because the track is
  mostly Confirmed and carries the S3, S4 and S5 money beats.
- **Every phase opens with a drift check** against `1f067a8` for its items and linked OQs, and
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
    prepayment completion gate, the silent BTM fallback and hospital auto-apply.
  - A PROGRESS.md entry is recorded.

**Where the critic's review was not followed.** The prepayment tracking and escalating alert
(US-06.3.2, Confirmed) and the re-check (US-06.3.5) stay in 27 rather than moving to 41: the alert is
the control that replaces the completion gate under D5, and moving it would leave S4 Beat 1 with no
control for fourteen phases. Only the letters, reminders and overpaid-prepayment credit moved. Contract
pricing and adjustment rules (US-04.2.2) closes in 24, not 23, because its last missing part is the
Contract's allows-adjustment rule; 23 builds the base-unit override half.

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
"Credit in full and rebill", "Sync now" and "Import hospital download" (with a badged sample-file
picker).

### PWA parity

The PWA has no harness bar and no Admin app, so a handset demo cannot switch to the office. Every
phase whose beat has a mobile side that waits on the office or a backend event registers a
PWA-surface entry for the mobile screen concerned, for example "Office authorises this List" (14),
"Office approves this Contract change" (21), "Office sets the estimate and raises the prepayment
invoice" (27), "Office assigns a Draft List to me" (31), "Office confirms this swap" (32),
"Hospital row arrives and the office matches it" (33), "Office raises the additional invoice" (39)
and "Office attaches the NHI" (40). These office stand-ins show on the PWA only: in the framed build
the presenter plays the office in Admin. "Play the office" (RV-22) stays as a signposted scaffold,
defaults to OFF and shows a badge when on, and loses nothing because 14 adds the per-List trigger.
Phase 44 checks PWA parity beat by beat.

### Demo guide

- **Each phase patches the beats it breaks,** in the same session: `docs/demo-guide` (run sheet,
  cheat sheet, workflows), the matching sections of `master-demo-guide.html`, and the Control Panel
  scenario text. The self-contained guide presenters use is never more than one phase stale.
- **Each milestone phase (16, 25, 27, 32, 35, 39) ends with a consistency read** of
  `master-demo-guide.html` against the run sheet.
- **Phase 44 rewrites the S1 to S5 run sheet** around the new model and regenerates
  `master-demo-guide.html` in full.
- **Phase 14 adds a Future-scope caveat to S1** while the HL7/FHIR tooling still carries it; 34
  rebuilds S1.

### Confirm before building

These phases carry unresolved open questions (OQ) or Open/Verify items. Each checks them at its drift
check, and if they are still open builds the recommended reading (or the owner-decision default) and
labels it provisional in the UI.

| Phase | Items | Open questions |
|---|---|---|
| 16 | fee basis, netting, cycle (D1) | OQ-02, OQ-47, OQ-19 |
| 17 | surgeon identifiers, anaesthetist-side wording | OQ-52, OQ-43 |
| 18 | US-04.2.1 (Verify) | OQ-18, OQ-48 |
| 19 | US-05.1.1 and US-03.3.1 (Verify), US-05.5.2 (Open), RV-04 (D3) | OQ-06, OQ-12 |
| 20 | insurer and funding source placement (D2) | none |
| 21 | US-08.2.1 (Verify), child payer (D4) | OQ-54 |
| 22 | covered amount, GST agency | OQ-23, OQ-29 |
| 23 | modifier split remainder, Contract base units, combined procedures | OQ-15, OQ-06, OQ-53 |
| 24 | US-03.5.1 and US-04.2.2 (Proposed) | OQ-06 |
| 26 | US-12.1.4 (Verify) | none |
| 27 | EP-06, US-06.2.2 and US-06.3.5 (Verify); the gate (D5); who raises the invoice (D6) | OQ-38, OQ-50 |
| 28, 29 | US-01.5.3 (Open) | OQ-17, OQ-27 |
| 31 | FT-01.3 (Verify) | OQ-44 |
| 32 | direct handover (D7), blacklist disclosure | OQ-39, OQ-43 |
| 33, 34 | FT-02.1 (Verify) | OQ-13 |
| 35 | update email scope | OQ-46 |
| 38 | ageing (D8), billed Lists (D9) | OQ-31 |
| 39 | FT-08.6, US-08.6.1 and US-08.6.2 (Verify); pricing (D10) | OQ-42, OQ-45, OQ-51 |
| 40 | US-11.1.4 (Open), US-11.3.2 (Verify); Booking without NHI (D11) | OQ-49, OQ-41, OQ-30 |
| 41 | almost all Proposed; US-06.4.2 (Open) | OQ-03, OQ-40, OQ-42 |
| 42 | Solutions Plus list | OQ-51 |

## Milestone demos

These are what you can show at each point.

- **After 16:** Booking vocabulary everywhere. Every demo action on its own screen, in the harness
  bar and on a handset, with the HL7/FHIR tooling badged Future scope. The corrected payables story:
  the payable equals the receivable, and the AA fee is its own invoice.
- **After 25:** the catalogue's pricing model, end to end:
  - editable RVG, modifier and Procedure masters feeding base units;
  - one filtered Contract per Procedure, with a default;
  - billable party and required inputs on the Booking;
  - invoices sent by the billing run;
  - the 3/2/2 modifier split and a Contract-gated adjustment;
  - a lock at AUTHORISED that reproduces invoices exactly.

  S3, S4 Beat 3 and S5 are re-scripted.
- **After 27:** prepayment from the anaesthetist's prepaid set: estimate, invoice at setup,
  part-paid tracking, the date-driven alert and the balance invoice. S4 Beat 1 is re-scripted.
- **After 32:** the office's schedule: Slots and Lists, the availability calendar, the conflict
  dashboard, Draft Lists with a waiting flag, blacklist warnings, and swaps with office confirmation.
  S2 is re-scripted.
- **After 35:** S1 rebuilt: hospital sync, then the matching screen, then a Booking on its default
  Contract. Explicit save and the update email.
- **After 39:** the money story on the internal ledger: balances shown in or out of balance, Xero
  mirror resilience, ledger-backed web accounts, additional invoices, and credit-and-rebill. S4
  Beats 2 to 5 are re-scripted.
- **After 44:** every verified gap closed: patients and alerts, prepayment letters, credits and
  trust refunds, reference-data loads, full-scale and privacy demos, and the rewritten S1 to S5 run
  sheet.

## Parked

| Item | Reason |
|---|---|
| US-08.6.4 · Split a combined Procedure into additional invoices | There is no safe interim: how combined procedures are modelled is still open (OQ-53), and the gap analysis says not to build it. Revisit when OQ-53 is answered; its natural home is Phase 39's additional-invoice sheet. |

Kept but not planned as work: RV-22, the PWA's "Play the office" auto-authorise. It stays as a
signposted demo scaffold. Phase 14 badges it, defaults it to OFF, and adds the per-List "Office
authorises this List" trigger in its place.

## When the catalogue changes

The catalogue keeps changing, and this plan is pinned to commit `1f067a8`.

1. **Every phase starts with a drift check.** Diff the catalogue files for the phase's covered IDs
   and their linked OQs against the snapshot, and check whether any owner decision it depends on has
   been answered:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
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
