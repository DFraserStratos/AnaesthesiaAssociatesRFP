# Phase 07 — Admin app: authorisation, master data & audit

**Requirements covered:** A4, A6–A8, D6 office-side
**Depends on:** Phase 06.
**Estimated:** 1 session.

## Goal

The control side of the office app: the SUBMITTED→AUTHORISED review queue with the sanity-check
screen and phone-note action (no Returned state, ever), the master-data screens, the audit viewer,
and the RBAC demonstration. Completes the booking→authorised workflow — and hands Phase 08 its
trigger.

## Reference

**Authoritative visuals (convention 17):** `Design/Admin Review.dc.html`. Match its anatomy:
breadcrumb (Review queue / Dr … — list); header with title, context line, status pill + amber
"Submitted today, HH:MM" pill; the four-tile summary strip (CARDS · TOTAL UNITS · TOTAL FEE ·
FLAGS with "to check before authorising"); the review table (TIME · PATIENT with mono NHI+op ·
ROUTE · CONTRACT · CODE · TIMES · B·T·M · UNITS · FEE · FLAGS, totals row with "@ $rate/unit");
flag pills (amber = warning e.g. "Duration above median", neutral = informational e.g. "T adjusted
+1 manually"); and the action bar (summary text + open-flags reminder, **Log phone note** outline
button, **Authorise for billing** primary). The authorised state's choreography is the spec: green
banner slides in with the tick-draw ("List authorised — locked for billing" + who/when + "Next in
queue →"), the table dims to ~72% opacity with per-row lock icons, the action bar flips to an
"Authorised · locked" pill, and the side-nav queue badge decrements.

**Correction to the mockup (Decisions log):** its ROUTE column showed anaesthetic technique
(GA/Spinal). Build the ROUTE column as the RFP billing route (Hospital / Billable Party / Insurer);
technique may appear as secondary detail under the operation.

## Work items

1. **Authorisation queue**: nav item listing SUBMITTED Lists (anaesthetist, date, session, card
   count, submitted-at) — the day view's "Awaiting review" panel links here. Review screen =
   the sanity-check layout above. The FLAGS column also surfaces any Card **not marked Completed**
   (possible when the office moves a Card into a SUBMITTED List — the all-Cards-completed rule
   gates the DRAFT→SUBMITTED transition, not later office rebooking), a **missing
   `billingReference`** where one is expected (the RFP's "reference completeness" check, now
   backed by a real Procedure field), and an **ACC-route advisory** when an `accRelated`
   procedure sits on the Billable Party route (the RFP: ACC patients "are never billed directly"
   — an office-practice flag, not an engine guard, since ACC is otherwise "invisible to the
   billing engine"). Per the RFP the check is an
   office practice, not a system gate.
   Actions:
   - **Authorise** — confirmation states what happens (Cards lock immutable; List hands to the Billing Engine as a unit); runs the store's `authoriseList`, which emits the `listAuthorised` event Phase 08 consumes. Until Phase 08 exists, the event lands in a visible "billing queue (Phase 08)" placeholder so the demo isn't a dead end.
   - **Log phone note** — issue-resolved-by-phone record attached to the List (office-initiated, per RFP). There is NO return-to-anaesthetist action anywhere.
2. **Master data screens** (list + edit forms, all through the audited store): Hospitals (+ holiday
   calendars), Surgeons, Anaesthetists (registration number as the ID, contact details, unit
   value $, GST period, active flag — adding an anaesthetist extends the canvas forward per D1),
   Insurers, Contract-holder organisations (external groups such as COS), Contracts (type 1/2/3,
   holder — hospital/insurer/surgeon/organisation/billable-party, scope — organisation or
   individual-anaesthetist with an anaesthetist selector, the `permitsIndividualArrangement`
   flag, rates, effective dates, price-list rows incl. 2nd-procedure rule), List Statuses,
   Permanent Lists (incl. the usual-surgeon column), RVG codes, Modifier codes. Read-heavy is fine; full edit where the demo needs it
   (contracts, unit value, permanent lists, holidays, anaesthetist add). **Invariant guard:** the
   mandatory default Type 1 contract of every Hospital and direct-billing Insurer cannot be
   deleted or effective-dated out of existence (the RFP guarantees the billing engine a "no
   contract found"-free world — the edit forms and store must protect it; Vitest-proven). Editing
   its non-essential fields is fine.
3. **Audit viewer**: global filterable feed (entity type, source: office/anaesthetist/integration/
   system, date) + per-entity history timeline reachable from any Card/Procedure/List (a "History"
   affordance on the shared detail components). Shows before→after values.
4. **RBAC demonstration**: the authorisation screen states it requires the OfficeAdmin role; the
   audit log records the acting role on every entry; a short "roles in this prototype" info panel
   (anaesthetist vs office) linked from the admin home — the demo's answer to the RFP's
   role-based-access requirement.

## Out of scope

Billing execution and the billing monitor (Phases 08–09), Xero (10), integrations (11).

## Manual test checklist

- [ ] Authorisation queue shows the seeded SUBMITTED lists; the sanity-check screen surfaces a flagged oddity (override present / informational insurer).
- [ ] Authorising a list plays the mockup's choreography (green tick banner, table dims with per-row lock icons, "Authorised · locked" pill, queue badge decrements), locks its cards (edit attempts blocked for every persona), removes it from the queue, and lands it in the billing-queue placeholder.
- [ ] The seeded Souter Southern Cross PM list reviews exactly as `Admin Review.dc.html` shows it (4 cards, 2 flags, matching totals), except ROUTE shows billing routes per the correction.
- [ ] A phone note attaches to the list and appears in its audit trail; no Returned action exists anywhere.
- [ ] Master data: change an anaesthetist's unit value and see a fresh BTM fee computation change; add a hospital holiday and see Phase 06's conflict flag appear; add an anaesthetist and see their canvas rows generate forward.
- [ ] Attempting to delete or end-date a hospital's default Type 1 contract is blocked with an explanation (and the guard test proves it).
- [ ] Audit viewer reconstructs the full story of a card that's been edited, reassigned and authorised (mixed sources and roles visible).
- [ ] `npm run build` + `npx vitest run` green.

## PROGRESS.md updates

Status row + entry; log any sanity-check-layout decisions Phase 08's billing run should respect (e.g. what "flagged" meant).
