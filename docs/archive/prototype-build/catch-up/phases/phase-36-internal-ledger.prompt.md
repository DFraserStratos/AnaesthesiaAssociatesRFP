Please run requirements catch-up Phase 36 (Internal ledger and balance views) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (2 sessions). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Also read:
- ROADMAP.md: the owner decisions as re-read on 2026-10-08 (D1, D6, D8, D9, D20 to D24 and D38 in particular), D57 and D72; the Money track sequencing; the BCTI granularity paragraph.

Hold to these above all:
- Pin the figures first (item 1): ledgerParity.test.ts, keyed on invoice numbers and Booking ids, passes unchanged at the end. No presenter-visible figure in S3, S4 or S5 moves. The only allowed difference is item 8's one named BCTI case, under paidOnly: false, tested and logged; re-pin the prepayment flow step once, with the reason.
- Evolve BillingCase into a ledger pair, deleted not wrapped; never a second ledger. Every invoice creator makes its pair in the same mutate() that raises the invoice; a handoff fault leaves a complete pair marked "Not yet in Xero".
- One payable leg per receivable invoice, the same value: that leg is the BCTI. Never split per Procedure. If OQ-29 now says one BCTI per procedure, do not stop: keep this, and put it first on the owner's list.
- The payee is stamped when the pair is created and never re-derived or changed: no repointPayable, and a move changes no pair.
- No app money view reads state.xero (moneyViewPurity's named allow-list only); payablesDue is the one source 39a reads, with no second payables selector and no week or cycle copy.
- The ledger maths is pure in src/domain/billing/ledger.ts, exact to the cent (imbalance = receipts held - payables due - holding balance; AA fee money outside it); the seed is in balance.
- The payer is each Procedure's (22a, D85): a receivable's counterparty is its own invoice's payer, and a prepayment pair is per payer. Read the invoice's counterparty, never a Booking-level payer; no ledger rule changes.
- Review adds a money lens.

When done:
- The "For the owner's review" list also carries OQ-111 as built (paid in Xero, recorded when detected, by 37), beside the items the doc's PROGRESS section lists.

Phase goal: BillingCase becomes a ledger pair with linked receivable and payable legs (one payable, the BCTI, per receivable invoice), created at invoice time, with the payee stamped at authorise, the patient linked whoever pays, and Phase 27's prepayment pair (created at admin approval, or at once with approval off, with its draft Xero pair, payable to the AA Holding account) as a ledger pair and 27a's transfer (AA Holding account to whoever did the List, two payable legs, never a receivable) as a ledger transfer, with no payee repoint and no prepaid excess anywhere. The ledger is AA's system of record that every money view and the payables run read (payablesDue the one source Phase 39a's weekly run will read), Phase 16's BCTI count re-reads from it with a parity test, and Xero mirrors it. A new Admin Ledger screen shows the whole ledger and each anaesthetist, in balance or out of balance, with the list of anaesthetists whose ledger is out of balance.
