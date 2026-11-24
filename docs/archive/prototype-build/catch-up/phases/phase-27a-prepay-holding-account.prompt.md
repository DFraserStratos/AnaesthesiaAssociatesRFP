Please run requirements catch-up Phase 27a (AA Holding account and the transfer to the anaesthetist) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (1 session, Prepayment track). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: run it straight after Phase 27 (which runs on 22a), in the same working tree.

Hold to these above all:
- The AA Holding account lives in one place, src/domain/billing/prepayHolding.ts (store side store/prepaymentSettlement.ts): a payables creditor, never a bank or ledger account; balance and entries derived, never stored. Money leaves it only through canPayOutOfHolding (a transfer or refund the system raises).
- One prepayment invoice per payer (22a, 27): each collect pair is a receivable from its invoice's payer and its own holding-account payable, with its own transfer; read the Procedure's payer, never a Booking payer.
- The transfer is written only from the listAuthorised subscription in wireBillingRun (the one provisional OQ-125 place): no office step, no new invoice, ACCREC, PaymentIn, BillingReceipt or GST movement.
- Pin the figures first. Only the seeded prepayment's disbursement and Dr Souter's July BCTI count (by one) move; S3 Beats 2 and 3, Dr Rutherford's 40 BCTIs and $700.00, S4 Beat 5's payouts and the prepayment pair's shape field for field (US-09.1.3) do not. Never -u.
- No move logic and no payee repoint anywhere (D20 superseded). Say "AA Holding account" and "transfer"; never "journal transfer", "prepay holding account" or "second pair" in copy.

Phase goal: a prepayment is held, not paid to the anaesthetist. Each prepayment invoice's collect pair (one per payer, from 22a and 27) has a payable to the AA Holding account, a payables creditor kept like an anaesthetist's account (not a bank or Xero ledger account), with its balance and entries in Admin, never paid itself and left only by a transfer or refund the system raises (a manual payout is refused; the payment is made in Xero); when the office authorises the List (the trigger provisional, OQ-125) a transfer, not a new invoice or payment, moves each prepaid amount automatically to the anaesthetist who did the List, mirrored to Xero as a journal and released for the payables run as any payable, so a moved prepaid Booking needs no change and nothing is repointed or recalculated.
