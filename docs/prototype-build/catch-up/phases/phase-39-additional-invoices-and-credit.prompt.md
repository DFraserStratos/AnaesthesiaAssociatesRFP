Please run catch-up Phase 39 (Credit notes, credit-and-rebill and the combined split) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase (track: catch-up, two sessions). The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Also read:
- The catalogue evidence behind US-08.6.4, US-08.6.5 and OQ-77 (the source command, one item at a time), and domain-model.md's credit note option paragraph ("When a combined invoice is split ... the rebilled invoices must equal the credited one").
- PROGRESS.md: the Phase 08, 09 and 10 entries (the billing run, the monitor and retry, the Xero pair, payments and payables). From 38b's entry, beside the names the doc's drift step 4 lists, take what shipped for mayRaise, mayEditEvent, procedureOwner, EVENT_RULES.anaesthetistSees, EVENT_KINDS.anaesthetistOwnOnly, AdditionalInvoiceForm and its three wrappers, and the button slot on the Contract part of 20a's ProcedureStack.

Stop if: nothing beyond the generic stops. Every question but OQ-60 and OQ-97 is answered; build the answers with no provisional label, toggle or chip.

Hold to these above all:
- Immutability: the original Booking, its Procedures, its lock and pricing snapshots and the original invoice are never written; "Credit waiting for review", "Credited" and every link are derived selectors.
- One correction, one review, one issue: the credit event and its replacements are one row in 38b's review queue and are issued together inside runEventInvoicing's commit; corrections go to handoffCorrection, never handoffPair; 38b's own handoff never runs twice for a replacement, and its PWA stand-in skips replacement events.
- Every credit reverses the payable by a negative invoice to the anaesthetist (undisbursed part offset, paid-out part left as recoveryDue for 39a); runPayables does not net it. Keep creditsHeldForPayers and recoveryDueFromAnaesthetists by those names (39a and 41 plan against them), and keep the amount credited an explicit input to reversalPlan for 41's part credit. 36's pinned uncredited figures, S3's scripted invoices and 16's BCTI counts do not move.
- The equal-total rule is the split's only (splitTotalCheck, ex GST to the cent); the split is the office's, only once the invoice exists. Nothing but a person's action raises a credit; a credit note is never called a refund, and no Xero credit note carries an NHI or patient name.
- Review: add a fourth lens, money integrity (the ledger, the negative invoice, the Xero reversal, the idempotent retry).
- 39a, not 39, is the demo-guide milestone: spot-check the master guide's S4 only.

Phase goal: the office, and the anaesthetist on their own Procedure, can credit an invoiced Procedure's invoice in full to any party by hand and raise new additional invoices in its place; the office can rebill a wrong invoice from a copy of its lines and split a combined Procedure by a credit then one invoice per component that together equal the credit; each correction is recorded as events on the Procedure through the one review step, always reverses the payable by a negative invoice to the anaesthetist, reverses the ledger and Xero together, and every credit note step is audited.
