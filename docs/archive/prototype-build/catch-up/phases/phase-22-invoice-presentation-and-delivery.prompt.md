Please run catch-up Phase 22 (Invoice presentation, delivery and the split) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Also read:
- ROADMAP.md: owner decisions D17 (as superseded: the Contract decides who is billed, its holder Party or the payer on the Booking), D18 (superseded: the split is a Booking action), D23, D55 and D70; the Contracts track sequencing rules (17 to 25 in order; 20 and 21 left funderOverride as the interim split this phase replaces); "Pricing model in one place"; the BCTI granularity rule; the "Confirm before building" row for 22 (whether % shares total 100, the split's wording, OQ-29).
- PROGRESS.md: the Phase 15a entry (WARNING_RULES, WarningRuleId, appSettings.warningRules, and how 21 added its childPayer rule), beside the 14, 16 and 18 to 21 entries the doc's drift-check step 4 names.

Stop if: AA's accountant has settled the BCTI granularity, or US-08.2.3 has been retired: follow the doc's drift-check steps 2 and 3 and log it on the owner's review list. Build US-08.2.3 as written, with no provisional pill on the Split button.

Hold to these above all:
- Money conservation is a review lens of its own. The split conserves to the cent and reproduces S3 Beat 1 exactly: AA-2026-0002 Brian Holt Forte Health $396.18, AA-2026-0005 nib $152.38 (emailed to nib), AA-2026-0006 Alan Prentice $91.43 (emailed to Alan), from nib's share typed $132.50 with Alan the rest. A parity test over every seeded Booking keeps each unsplit invoice's party and figures exactly as Phase 21 left them; a split that no longer fits fails review (splitDoesNotFit), never bills a guess.
- One place each: the split maths only in splitShare.ts; layout, lines, GST_RATE, the GST caption, the OQ-29 wording and the document's name only in invoicePresentation.ts; one materialiser for the run, the retry and the prepayment raise; one reusable shared/booking/PartyPicker.tsx (38b, 39 and 39b reuse it).
- Nothing on the Contract names a split, a payment setting or a default share, and no invoicing fields are added to it. GST: every price stays held GST exclusive with GST at the foot. That is one rule held as a constant in invoicePresentation.ts, never a stored setting: no gstTreatment (or any GST field) on the Contract, and no GST-inclusive presentation.
- Grep gates that must return nothing: funderOverride, FunderAllocation, allocationNotConserved, allocationStale, markInvoiceEmailed, emailedAtISO, paymentSetting, defaultSplitShare. Rewrite the tests that relied on them, never skip them.
- One BCTI per receivable invoice: Phase 16's bctisFor, bctiRecords and their tests stay unchanged and green; AA fee invoices keep their wording, with no supplier, agent, delivery or OQ-29 pill. No NHI or patient name reaches Xero.

Phase goal: every invoice is issued in the anaesthetist's name with AA as agent, laid out as its Contract says with every price held GST exclusive and GST at the foot, and sent by the billing run by the Party's setting (email or post) or the payer's email, or marked To post; a Split button on a Procedure's Contract part, for the office and the anaesthetist, divides the fee between billable parties with each share typed in $ or % and no Contract setting, each party invoiced on its own; and the ACCPAY carries provisional buyer-created tax invoice wording, one per receivable invoice (granularity open, OQ-29).
