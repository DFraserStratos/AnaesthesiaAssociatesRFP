Please run catch-up Phase 25 (Contract versions and the AUTHORISED lock) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the sequencing rules (the Contracts track runs 17 to 25, and 25 locks what 18 to 24 built, including 24's adjustment), the Demo triggers and PWA parity sections, and the "After 25" milestone.
2. docs/prototype-build/catch-up/phases/phase-25-contract-lock-at-authorised.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (Theme 2 "Contract locked at AUTHORISED", the DM-07 and RV-01 rows, and the S4 Beat 3 and S5 Beat 4 demo-impact notes), then the EP-04, EP-07, EP-08 and EP-15 tables. For full evidence, see docs/prototype-build/catch-up/epics/EP-04.md, EP-07.md, EP-08.md and EP-15.md, the gaps.json entries for the six covered IDs, DM-07 and RV-01, the DM-07 section of docs/prototype-build/catch-up/analysis/domain-model-delta.md, and RV-01 in docs/prototype-build/catch-up/analysis/reverse-check.md.
4. The covered catalogue files in "docs/discovery-reference/Updated Requirements/catalogue/requirements/":
   - US-04.1.3, US-04.3.5, US-07.3.1, US-08.1.1, US-08.4.4 and US-15.0.3;
   - their context: US-08.1.2 (Retired, merged into US-08.1.1), US-08.5.1, US-08.5.2, US-12.1.1 and US-04.2.10;
   - questions/OQ-48.md and questions/OQ-05.md;
   - the Procedure, "Contract (recommended structure)" and "Procedure billing context" sections of "docs/discovery-reference/Updated Requirements/domain-model.md".
5. docs/design/Admin Review.dc.html, the AUTHORITATIVE layout reference for the authorised and locked state (convention 17), and docs/design/Design Language.dc.html for tokens. No mockup covers Master data, the invoice document or the Billing monitor: extend the admin's own patterns.
6. docs/prototype-build/PROGRESS.md:
   - the binding conventions;
   - the Decisions log entries this phase supersedes or must honour: the 2026-07-23 Phase 08 build decisions (contract resolution at billing time and the default fallback), the Phase 09 readings and build decisions (per-card failure isolation, the billing-failure demo), and the Phase 07 build decisions (flags are advisory, no Returned state);
   - the catch-up entries and handoff notes for Phases 14, 15 and 18 to 24. Read 20, 21, 23 and 24 closely: they say what 20 left in the resolver for this phase, where required inputs and the claim reference live, how Booking-level pricing works, and where the anaesthetist adjustment is stored.
7. docs/prototype-build/catch-up/analysis/prototype-map-store-seed.md, prototype-map-domain.md, prototype-map-admin.md and prototype-map-shell-demo-pwa.md, for the code entry points. Phase 15 renamed Card to Booking, so use the renamed files.

Then do the drift check in the phase doc:
- git diff 1f067a8 against the catalogue and domain-model.md for the covered IDs, OQ-48 and OQ-05, paying attention to whether discovery has named the fields to freeze;
- list every store action that writes a Contract or its fee schedule, and every price input 18 to 24 added, under the names they gave;
- confirm 21 did not make a missing required input an authorise blocker (if it did, use the plan's handoff fallback for the failure trigger);
- record the current PERSIST_VERSION;
- check whether Phase 16 has run: it is not a declared dependency, so the plan's AA-FEE invoice clauses apply only if it has.
Then enter plan mode: turn the plan into work-sized steps, and wait for my approval.

While working:
- Pin the figures first (item 1's invoice fixture). The lock changes where the numbers come from, never the numbers. S3, S4 and S5 figures must match Phase 24 to the cent, and the fixture is never updated with -u.
- Model, lock builder, engine and seed first, re-greened (build, build:pwa, vitest) before any UI. This phase realistically takes two sessions: plan to stop after work item 9, green, and do items 10 to 16, the demo guide and the review pass in a second session.
- Every Contract-writing action appends exactly one immutable version in the same mutate() commit. Earlier versions never change.
- authoriseList writes every Booking's lock in the same commit as the state flip, then emits listAuthorised. A refused authorise writes nothing. Every authorise path (Review, the PWA office stand-in, Play the office, scenario jumps, stage-post-op) goes through it.
- The engine, retry and regenerate read only the lock, never state.masters. No effective-date fallback, no route or payer resolution, no Resolve & retry that edits a Contract. A Contract not in force on the List date is an authorise blocker, never a silent default. Delete contractIneffective and defaultContractFor.
- Retry stays idempotent and never duplicates an invoice, case or Xero pair. supplyLockedInput is the only post-authorise write to a lock or a Booking: office only, a blank required input, a failed case, no pricing field; it takes a procedureId for the per-Procedure claim reference and applies its own guards in place of editRefusal.
- The lock also copies the party details the invoice prints and the GST rate, so nothing on an invoice is looked up live. lockedAtISO comes from the demo clock.
- Snapshot the whole Contract version plus every rate input, because the fields to freeze are still a discovery item. Seeded AUTHORISED Lists get locks at seed time (migrated locks for the history backdrop, labelled). No new RNG draws. Bump PERSIST_VERSION once for the seed change.
- Locked Bookings display from the lock in all three apps, with the "Contract vN locked at authorise" badge; DRAFT Bookings still re-price live.
- Triggers:
  - Register "Regenerate from locked data" (harness bar, Admin invoice document) and re-point Phase 14's "Trigger billing failure" (harness bar, Billing monitor) to the missing claim reference cause, in Phase 14's registry.
  - Put the bodies in src/store (stageBillingFailure in src/store/demoStaging.ts) so pwaPurity holds. They must be deterministic, with a disabled state; regenerate is read-only and keeps its result in Phase 14's non-persisted trigger memory for the invoice rail to show.
  - No new PWA entry, but test that the PWA office stand-in locks the List. Nothing new goes on the Control Panel page.
- House rules:
  - Every write goes through mutate(), and every new audit code gets a label in src/shared/audit/actionLabels.ts.
  - Keep billing rules pure in src/domain/billing with Vitest tests.
  - Teal is the only action colour; crimson is identity only; the lock badge is a neutral pill, not a status colour.
  - Admin uses panels and overlays; mobile shows the badge and no money.
  - No en or em dashes in app copy.
  - Never commit.

When done:
- Run the manual test checklist and report each item.
- Update the capture recipes named in work item 16 (US-08.5.1, US-08.5.2, US-13.3.2 re-pointed; US-04.1.3, US-08.4.4, US-04.3.5 and US-04.1.2 status and shots), run the capture --dry check and list any broken recipe; re-capture only if I ask.
- Confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green, and npm run verify:board if any capture recipe changed.
- Run the adversarial review-and-fix pass (convention 18: fan out Opus reviewers for quality, bugs, plan adherence and money integrity; independently verify each finding; fix the confirmed ones; re-green).
- Update PROGRESS.md: status row, catch-up Phase 25 entry with the drift-check result, the lock's field list and the review pass, the Decisions-log entries listed in the phase doc (the removed fallback, the re-based failure demo, what is locked, versions, the third authorise blocker, the engine's required-input backstop, migrated locks, the pricing date), and handoff notes for 27, 35, 36, 39, 42 and 44.
- Patch the demo guide in the same session: S3 Expected, S4 Beat 3 rewritten, the S5 staging text, S5 Beat 4 rewritten and the new optional unit-value beat, the cheat sheet, the workflows doc, the matching master-demo-guide.html sections, and the Control Panel S4 and S5 text. This is a milestone phase: finish with a consistency read of master-demo-guide.html against the run sheet.
- Give me short, clear notes.

Phase goal: every authorised Procedure carries a locked record of the Contract version and rate inputs that priced it, the billing run prices only from that record, and any invoice can be regenerated exactly, whatever has changed since.
