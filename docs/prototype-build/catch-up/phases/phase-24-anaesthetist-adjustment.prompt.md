Please run catch-up Phase 24 (Pricing kinds, the price following its Contract until held, and who may change it) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc (it keeps its historical file name, phase-24-anaesthetist-adjustment.md) holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Overrides:
- When done runs at the end of each session, for what that session built: the checklist, the full gate, the review, the catalogue screenshots, the demo guide, the PROGRESS entry and the plan page, every session (the doc's cut line: session 1 is items 1 to 6, session 2 is items 7 to 14).
- PERSIST_VERSION goes up by one in each session that changes the seed, not once for the phase.

Also read:
- ROADMAP.md: owner decisions D30 (as narrowed on 5 November), D45 (superseded by ranges), D47, D50 and D65 (as extended), D40 (moot), D79 and D82 (with their defaults) and D63 (the edit window); the sequencing rule "The pricing model lives in one place" and the Contracts track rules.
- Maps in analysis/: prototype-map-domain, -shared, -admin and -store-seed.

Not a stop: a change to the rule's shape. If the drift check changes it (a rung back or reordered, a reason required, a per-Procedure rate or discount back), build the catalogue's reading and log it on the owner's review list; anything smaller, build it and log it.

Hold to these above all:
- Parity baseline first: the phase-24 fixture is generated from the code as 23 left it before any edit and never regenerated with -u. Nothing moves in session 1; in session 2 only Fitzgerald's Aria Booking moves (its new figure pinned in place of $1,440). S3's figures stay.
- One price function, priceFor in src/domain/billing/procedurePrice.ts, with one store action setProcedurePrice behind anaesthetistMayTypePrice and officeMayChangePrice; one typed price, 20's enteredPrice; 21a's priceStatusFor and computedPriceFor re-pointed with their signatures kept. No reason field anywhere.
- Money correctness is a review lens of its own (reviewers: quality; bugs and money correctness; plan and catalogue adherence).
- The restored price line is rebuilt from d1562b4c's code (git show, and 384c3686 for what its removal took out) and compared against d1562b4c running in a git worktree; never bring back the Off / Units / Fee setting, shell.cardCalculationMode or the PWA card.
- Grep gate: no "Method 3", "hourly", "individually arranged" or "rate x time" in any rendered string; permitsIndividualArrangement, permitsRateTime and INDIVIDUAL_ARRANGEMENT_MESSAGE gone, CT-ARIA-HOURLY kept as an id.

Phase goal: every Contract has one of five pricing kinds, and one pure function prices each Procedure: its AUTHORISED price, else its prepaid amount once invoiced, else a typed price, else computed from the kind (the range in force, or units x the rate less the Contract's discount as its own invoice line), else "Needs a price"; unedited prices follow their Contract and a $0 price gives a no-charge invoice. The anaesthetist types a price only on an RVG Contract that allows it, or the amount on No contract · Fixed price, and sees what the price comes to as she records; the office changes any price until AUTHORISED, a prepaid one only until its invoice is raised; no reason, every change audited and shown at review beside the computed price. The rate x time line, the Method 3 gate and the override reason are gone.
