# Phase 09 — Billing engine: exceptions & monitor

**Requirements covered:** B7, B8, A5
**Depends on:** Phase 08.
**Estimated:** 1 session.

## Goal

The billing engine's edge cases and its office-facing surface: pre-payment, post-op addendum
billing, and the billing-flow monitor with a demoable failure and retry. These are the moments the
RFP flags as open questions — the demo should handle them confidently and label the readings.

## Work items

1. **Pre-payment flow** (B7): the pre-payment flag is typed per the RFP — **full** or **split** —
   on the seeded Card. "Raise pre-procedure invoice" (office, pre-day) produces a
   `prePayment`-timing invoice through the normal document pipeline: the full estimated fee, or
   the agreed deposit portion for split. From raise until paid-or-overridden the card shows a
   prominent **"pre-payment outstanding" flag** (mobile card view, admin day view, authorisation
   review) — the *pre-procedure* surfacing of the rule; the completion gate below is the hard stop
   at the last checkpoint the prototype actually controls (software can't halt a theatre list). **Collected-before-procedure is a real gate, not an
   ignorable banner** (per the RFP: "payment must be collected before the procedure proceeds"):
   the store's `completeCard` guard blocks marking a `selfFundedPrepayment` card's Outcome
   complete while its pre-invoice is unpaid (the guard reads the pre-invoice's paid state; live
   payment simulation lands in Phase 10 — this phase ships a **seeded paid state** so the
   payment-cleared path is demoable now, and Phase 10's checklist re-verifies it end-to-end via
   the webhook). Where the office needs to proceed
   anyway (their real-world call, which a browser prototype cannot itself verify), an explicit
   **`overridePrepaymentGate(cardId, reason)`** office-only action lifts the block — audited with
   the reason, distinct from and visible alongside the card's normal audit trail, and shown as a
   flagged override (not a silent pass) everywhere the card appears (mobile, admin day view,
   authorisation review). No override, no complete. The post-procedure billing run then bills
   exactly the balance (invoice timing = balance; full-pre-payment cases bill a zero-balance or no
   balance invoice — decide and record). UI copy notes the timing-vs-AUTHORISED tension as an RFP
   open question and states this proposed reading.
2. **Post-op addendum** (B8): "Add post-op event" action on a billed/locked Card (e.g. HDU review,
   pain consult, nerve catheter) → creates an addendum Card (`cardType = postOpAddendum`) in the
   anaesthetist's current List for the demo day, pre-linked to the original episode. It runs the
   normal capture → submit → authorise → bill cycle. The original card stays locked throughout —
   this is the RFP's immutability answer, label it as such.
3. **Billing monitor** (admin nav, replacing the placeholder; A5): pipeline table per authorised
   List — stages: List AUTHORISED → Billing run → Invoices generated → Emailed → Xero (stub until
   Phase 10). Card-level rows with per-card status and errors.
   - **Failure demo:** seed or trigger one failure — a card on the **surgeon-held bariatric (or COS group-held ACC) contract** that was effective-dated out between sanity check and run: non-hospital holders have no mandated default to fall back to, so this is a genuine rating failure (a hospital/insurer counterparty would instead fall back to its protected default Type 1, per Phase 08). Shows an error state with a readable message, plus **"resolve & retry"** (fix the data → re-run that card).
   - **Failure isolation:** a failed Card blocks only its own invoice, not the whole List (RFP open question — implement this reading, record it).
   - Simulation triggers on this screen carry the demo badge; the monitor itself is proposed product UI (convention 13).
4. **Demo control panel additions**: trigger for the billing failure; shortcut to stage the
   post-op scenario.
5. **Tests**: pre-payment then balance (amounts sum to the full fee); addendum bills independently
   while the original invoice is untouched; failed card isolates (other cards' invoices generate);
   retry after fix succeeds and is idempotent (no duplicate invoices).

## Out of scope

Xero records, payments, disbursement (Phase 10).

## Manual test checklist

- [ ] Pre-payment card (split), unpaid: the "pre-payment outstanding" flag shows on the mobile card, admin day view and review screen; attempting to mark the Outcome complete is genuinely blocked (not just warned); the office's override action (with a reason) lifts it, and the override shows as a flagged state on the card everywhere it appears. The seeded *paid* pre-invoice state also clears the block without an override (live payment lands in Phase 10, whose checklist re-verifies this via the webhook). After capture + authorise, the balance invoice covers exactly the remainder (deposit + balance = full fee). A full-pre-payment case behaves per the recorded decision.
- [ ] Post-op addendum on a locked card runs its own full cycle to an invoice; the original card remains immutable and its invoice unchanged.
- [ ] The failure appears in the monitor with a readable error, blocks only its own card, and resolve-&-retry recovers it without duplicating the list's other invoices.
- [ ] The monitor tells the whole story of a clean list end-to-end (AUTHORISED → run → invoices → emailed → Xero-pending).
- [ ] Open-question readings are visible in UI copy where they apply (pre-payment timing, failure isolation, addendum mechanism).
- [ ] `npm run build` + `npx vitest run` green.

## PROGRESS.md updates

Status row + entry; record the three open-question readings (pre-payment timing, card-level failure isolation, addendum mechanism) in the Decisions log.
