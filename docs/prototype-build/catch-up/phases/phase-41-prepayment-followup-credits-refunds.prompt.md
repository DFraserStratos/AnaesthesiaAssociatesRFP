Please run catch-up Phase 41 (Prepayment letter, cancellation and differences by hand) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase (track: catch-up, two sessions). The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Overrides:
- PERSIST_VERSION: bump once in each session that changes the seed (items 8 and 17), extending the migrate test each time.
- The drift check runs against the plan's baseline, catalogue commit fbdd555.

Also read: docs/prototype-build/catch-up/phases/phase-27a-prepay-holding-account.md (the AA Holding account and transfer this phase extends).

Stop if: only the doc's stops (a move re-check, recalculation or payee repoint back in US-06.5.4 or US-06.3.5; OQ-61 or OQ-76 reopened toward an automatic balance invoice or credit). If OQ-97 or OQ-120 is answered, build the answer, not the default. If 40 is not DONE, skip the follow-up bullet and record it: not a stop.

Hold to these above all:
- Pin the figures first (item 1). Nothing moves in session 1; session 2's refund Booking moves the holding balance on purpose: re-pin it with the reason. Keep the filler rng() draw order.
- Money is conserved: the ledger equation and the holding identity hold to the cent after every step; a refund never exceeds what was received; a part credit reverses exactly its amount. The holding entries stay in 27a's module, extended with credited and refunded, never copied. Review: add a money lens.
- One place each: the letter rendered in 27's generatePrepaymentInvoice (every send carries it; {{prepaidAmount}} required, "estimate", "deposit" and "may be higher or lower" refused); settlePrepaymentOnCancel inside cancelBooking's own mutate for every actor; settlePrepaidContractChange inside 20's setProcedureContract, sharing that credit and refund path, office only; statedCreditFor and creditTargetFor pure.
- A cancel is never refused because of a prepayment, and there is no office refund or payout step: the system credits or refunds inside the triggering commit. A by-hand credit pays no refund. Nothing is raised automatically after a prepaid procedure.
- A move changes nothing (D38), tested across every move path; the patient email is an optional office action, never sent by a move. Build the flat Contract model only (D1 to D11).
- Words: "move", never "swap" or "slot"; "AA Holding account", never "prepay holding account"; the prepaid amount never an estimate or deposit; the spelling of "prepayment" 27 shipped; no en or em dashes in app copy or seeded templates.

Phase goal: the prepayment story is finished on 27 and 27a: one standard letter stating the prepaid amount as the price, sent with every prepayment invoice, and reminders; after a prepaid procedure nothing further but 27a's transfer, with differences raised by hand as an additional invoice or a credit note (in full or, provisionally, for part); cancelling a prepaid Booking credits an unpaid prepayment invoice or refunds a paid one in full from the AA Holding account automatically, and a later payment is refunded too; a Contract changed off prepaid after sending settled the same way (as answered); a moved prepaid Booking changing nothing, with an optional patient email; and a fresh prepayment at the replacement's own price after a true cancellation and rebooking.
