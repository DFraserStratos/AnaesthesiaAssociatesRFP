Please run catch-up Phase 27 (Prepayment lifecycle) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Also read:
- ROADMAP.md: the owner decisions this phase builds (D64 extended, D27, D6 extended, D38, D30 narrowed, D47 extended, D57, D67, D5, D42; D23 / OQ-73 at Confirm; D68 / OQ-120 and D80 / OQ-134 open with defaults); the Prepayment sequencing (27 after 15a, 21 and 25; 27a straight after); "Pricing model in one place"; the vocabulary rules.
- PROGRESS.md: the 15a, 15b and 18 to 25 entries for their shipped names, as the doc's drift check lists them.
- Maps in analysis/: prototype-map-domain, -store-seed, -shared, -admin, -apps-mobile-web and -shell-demo-pwa.

Hold to these above all:
- Figures pinned first, never with -u: S3, S4 Beat 3, S5 and Forte's septoplasty invoice on Nair do not move; only Riley's and Nair's prepayment figures and Souter's payables due change, on purpose, re-pinned in item 9 with the reason. Money is a review lens of its own.
- One place: the rules in src/domain/billing/prepayment.ts behind prepaymentForProcedure and prepaymentStatusFor, plus one branch each in 24's gates; generatePrepaymentInvoice is the one place the pair is created; the anaesthetist's name on the invoice comes from one constant, PREPAYMENT_NAMES_ANAESTHETIST.
- The requirement is derived, never stored; a prepaid Procedure is left off the final invoice with nothing deducted. Removal list: prePaidByProcedure, the deduction line, prepaidFunderOverride, prepaidCounterpartyChanged and the prepayment negativeTotal exceptions (negativeTotal stays for every other negative).
- Never "estimate" or "deposit" in copy; ACTIVE, never DRAFT, for an assigned List.
- OQ-73's reading (a prepaid Contract always bills the payer) and any reopened decision go first on the owner's review list.

Phase goal: prepayment starts per Procedure when the office picks a Contract under Payment type: Prepaid (an anaesthetist's or a surgeon's price-list Contract, or Prepaid · Fixed price with an amount typed through Other price) and is invoiced to the payer on the Booking; the amount is the Procedure's price when the invoice is raised, in full and above zero, shown to the anaesthetist, changeable by the office only until then and never moved by a new range; the invoice is generated when an admin approves it on the Invoices screen (a step AA can switch off), with its pair to the AA Holding account and the draft Xero pair, then sent; a prepaid Procedure is never the anaesthetist's to change and is left off the final invoice with nothing deducted (an all-prepaid Booking has no final invoice); status is tracked as unpaid, part paid or paid with a warning in both apps that strengthens as the date nears, beside 40's balance alert as its own rule; and the requirement is re-checked on a change of Procedures, Contract or payer, never on a move.
