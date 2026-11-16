Please run catch-up Phase 27a (AA Holding account and the transfer to the anaesthetist) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Overrides:
- Run it straight after Phase 27, in the same working tree.

Also read:
- ROADMAP.md: D56 and D30 are not this phase's (build nothing for them); the Prepayment sequencing (27 then 27a back to back); the vocabulary rules.
- Phase 27's doc: only its Goal, its work items on generation and approval, and its PROGRESS handoffs. Phase 16's PROGRESS entry (its BCTI rule) beside the 25 and 27 entries the doc names.
- GAP-ANALYSIS.md rows for DM-21, RV-24, FT-06.5, US-06.5.1, US-09.1.3 and FT-09.1.
- Catalogue context beyond the doc's Reference: US-09.1.1 and US-01.4.7; OQ-96, OQ-111, OQ-115 and OQ-116.
- Maps: analysis/prototype-map-store-seed.md and prototype-map-admin.md, for context.

Hold to these above all:
- The AA Holding account lives in one place, src/domain/billing/prepayHolding.ts (store side store/prepaymentSettlement.ts): a payables creditor, never a bank or ledger account; balance and entries derived, never stored. Money leaves it only through canPayOutOfHolding (a transfer or refund the system raises).
- The transfer is written only from the listAuthorised subscription in wireBillingRun (the one provisional OQ-125 place): no office step, no new invoice, ACCREC, PaymentIn, BillingReceipt or GST movement.
- Pin the figures first. Only the seeded prepayment's disbursement and Dr Souter's July BCTI count (by one) move; S3 Beats 2 and 3, Dr Rutherford's 40 BCTIs and $700.00, S4 Beat 5's payouts and the prepayment pair's shape field for field (US-09.1.3) do not. Never -u; re-pin moved figures with the reason, in one place.
- No move logic and no payee repoint anywhere (D20 superseded). 16's count stays the only BCTI count; prepayment pairs stay out behind BctiCountRule.prepaymentPairs, default false.
- Say "AA Holding account" and "transfer"; never "journal transfer", "prepay holding account" or "second pair" in copy. Use ACTIVE, never DRAFT, for an assigned List.
- Review adds a money lens.

Phase goal: a prepayment is held, not paid to the anaesthetist. The collect pair's payable is the AA Holding account, a payables creditor kept like an anaesthetist's account (not a bank or Xero ledger account), with its balance and entries in Admin, never paid itself and left only by a transfer or refund the system raises (a manual payout is refused; the payment is made in Xero); when the office authorises the List (the trigger provisional, OQ-125) a transfer, not a new invoice or payment, moves each prepaid amount automatically to the anaesthetist who did the List, mirrored to Xero as a journal and released for the payables run as any payable, so a moved prepaid Booking needs no change and nothing is repointed or recalculated.
