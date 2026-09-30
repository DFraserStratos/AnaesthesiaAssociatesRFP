Please run catch-up Phase 23 (Primary Procedure and the multi-procedure rule) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the phase list, the sequencing rules for the Contracts track (19 leaves the resolver's Contract slot for this phase; 24 closes US-04.2.2; 25 locks what 18 to 24 built), the demo-trigger and demo-guide rules, and the "Confirm before building" row for 23 (OQ-15, OQ-06, OQ-53).
2. docs/prototype-build/catch-up/phases/phase-23-primary-procedure-and-multi-procedure-rule.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially theme 6, the DM-13 row and the RV-02 row), then the EP-03, EP-04 and EP-05 tables. Then docs/prototype-build/catch-up/epics/EP-03.md (FT-03.2, US-03.2.1, US-03.2.2), epics/EP-04.md (US-04.2.5, US-04.2.2) and epics/EP-05.md (FT-05.3, US-05.3.1, US-05.3.4, US-05.3.5), plus DM-13 (and DM-08) in docs/prototype-build/catch-up/analysis/domain-model-delta.md and RV-02 in analysis/reverse-check.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/FT-03.2.md, US-03.2.1.md, US-03.2.2.md, US-04.2.5.md, FT-05.3.md, US-05.3.1.md and US-05.3.4.md;
   - for context, requirements/US-04.2.2.md (the Contract base-unit override half is built here), US-05.1.6.md (AC3), US-05.3.5.md, US-03.2.3.md and US-02.4.3.md;
   - questions/OQ-15.md, OQ-06.md and OQ-53.md.
   Also read the "Procedure" and "Contract (recommended structure)" sections and "3. Calculation rules" of docs/discovery-reference/Updated Requirements/domain-model.md (the units table and the 7 over 3 = 3/2/2 worked example).
5. docs/prototype-build/catch-up/analysis/prototype-map-domain.md (section 5, billing maths), prototype-map-shared.md (capture suite, card body, flows), prototype-map-admin.md (Review, Master data contracts), prototype-map-store-seed.md (card actions, seed cards and contracts) and prototype-map-shell-demo-pwa.md (the PWA sheet and pwaPurity): the code index for the files you will change.
6. docs/design/Mobile App.dc.html (screen 3: code card, ASA card, B/T/M stepper rows and captions, modifier chips), docs/design/Admin Review.dc.html (units, totals, row flags) and docs/design/Design Language.dc.html (tokens, neutral pills, the accent tint note, the provisional badge). These are the AUTHORITATIVE visual reference (convention 17). No mockup covers the Contract editor, so extend the existing ContractEditSheet sections.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 6, 7, 9, 15, 16, 17 and 18);
   - the Decisions-log entries this phase supersedes or re-bases: 2026-07-22 "Type 3 second-procedure fallback", 2026-07-27 "removeProcedure" (the first procedure is refused by position), and the Phase 01, 04 and 08 split-billing readings (additional procedure = time units only);
   - the 2026-09-28 ruling (the anaesthetist Booking shows no calculation), which stands;
   - handoff item P2 (Type 3 ordinal keying), which this phase closes;
   - the Phase 14 to 22 entries, for the registry, the post-rename names, the Contract model, the resolver and its contractBaseUnits slot, one Contract per Procedure, the schedule-miss flag and 22's invoice lines and covered-amount split.

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered catalogue files, US-04.2.2, US-05.1.6, US-05.3.5, OQ-15, OQ-06, OQ-53 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- for each open question still open, take the interim in the phase doc's gate table;
- confirm Phases 19 and 22 (and through them 15 to 21) are DONE, and note what 15 did to Copy and what 18 did to the ordinal key (FeeScheduleLine.procedureOrdinal and matchFeeScheduleLine's procedureOrdinal and isAdditional keys);
- translate the phase doc's 1f067a8 names through 15's rename table (cardActions.ts is bookingActions.ts, cardFee is already bookingFee, CardDetailBody is shared/booking/BookingDetailBody, validateCardForBilling is validateBookingForBilling, seed cards.ts is bookings.ts, routes use /bookings/:bookingId);
- pick the past, unscripted Souter List for the seeded three-procedure Booking with a one-off seed query;
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into session-sized steps (session 1 ends green after the seed), and wait for my approval.

While working:
- Mock backend only. Every new write is a store action through the audited mutate(), with before/after metas and demo-clock timestamps. Components never own domain state.
- Billing maths is pure and tested. The split lives in one function (allocateModifierUnits) and the Booking-level engine in one place (bookingFeeFor). Every fee caller goes through it: the UI assembler, the validator, the invoice build with resolved Contracts, the prepayment build, the billing-line guards and seed/billing.ts. No pricing path reads a procedure's position. Write out every worked example (4 over 3 does not split, 7 over 3 is 3/2/2, 5 over 6, and the others in the doc).
- Exactly one primary per Booking on every creation path (create, copy, post-op addendum, add, integration, seed, the trigger). Remove never promotes. Make primary is one commit with two audit entries, and it moves the Booking's modifier inputs to the new primary. editProcedure refuses base and modifier values on an additional Procedure, and any isPrimary patch, but still allows clearing those keys, because a code change sends them as undefined.
- A single-Procedure Booking keeps its existing fee line description; the "primary procedure" / "additional procedure" wording appears only with two or more Procedures.
- Rights follow editRefusal: an integration actor on DRAFT only; the anaesthetist on their own DRAFT, and not on a completed Booking; the office on DRAFT and SUBMITTED; AUTHORISED on nobody.
- OQ-15: apply the remainder rule exactly as written until it is answered. OQ-53: do not model bundling. OQ-06: label the Contract base-unit override as provisional.
- Keep the fee hidden on the anaesthetist Booking (2026-09-28). The capture shows units and shares only; catalogue screenshots showing "time units only" or a fee are stale.
- Determinism: the new seed data draws nothing from the RNG, never calls takePatient(), and is built after every existing seeded Booking so no existing id moves. The parity fixture may differ only for the new three-procedure Booking; S3's Holt $396.18, the bariatric $2,800 + $950 and the Prentice pair must not move. Bump PERSIST_VERSION once.
- Demo triggers: register "Load 3-procedure Booking (7 modifier units)" and "Hospital feed swaps the primary" in 14's registry, on the Booking (and, for the loader, List) screens, for both the harness bar and the PWA sheet. Put the bodies in src/store so pwaPurity stays green. Add nothing to the Control Panel page beyond its S3 scenario text.
- Design: teal is the only action colour ("Make primary" is a teal text action), the Primary marker and the Provisional and Proposed markers are neutral pills, never crimson. Mobile uses a bottom sheet through useSurface().Overlay. No en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green;
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, plus a fourth on billing maths, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones with tests; re-green);
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result, the OQ status, the parity result, the List chosen for the seeded Booking, the PERSIST_VERSION from/to, the tests added and the review pass;
  - the Decisions-log entries listed in the phase doc;
  - the handoff notes for 24, 25, 33, 36, 39 and 42;
- patch the demo guide in the same session: the cheat sheet's split-billing section (and section 7's invoice-count point, renamed), the workflows' Multiple Procedures section and billing-engine step, the personas list, S3 Beat 1 and its new "Worth pointing at", the other "split-billing Card" mentions in the demo script, the S5 discovery points, the same sections of master-demo-guide.html, and the Control Panel scenario text; then grep for "time-only" and "split billing" (only quoted RFP headings may remain);
- give me short, clear notes on what changed and anything left open.

Phase goal: every Booking has exactly one primary Procedure that anyone with edit rights can change, and fees are priced for the whole Booking under the catalogue rule (base on the primary, time on each, modifiers split 3/2/2 above four), with a per-Contract multi-procedure rule and a Contract base-unit override.
