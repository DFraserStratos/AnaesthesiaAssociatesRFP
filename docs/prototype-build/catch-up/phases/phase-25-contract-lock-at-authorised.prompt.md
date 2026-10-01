Please run catch-up Phase 25 (Contract versions and the AUTHORISED lock) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner-decisions table at the top (D1 to D11 as answered on 2026-10-01), the sequencing rules (the Contracts track runs 17 to 25, and 25 locks what 18 to 24 built, including 24's adjustment and the payee), the BCTI granularity note, the Demo triggers and PWA parity sections, the "Catalogue screenshots" rule, and the "After 25" milestone.
2. docs/prototype-build/catch-up/phases/phase-25-contract-lock-at-authorised.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (Theme 3 "Contract replaces the billing route", the DM-06, DM-08 and RV-01 rows, and the S4 Beat 3 and S5 Beat 4 demo-impact notes), then the EP-04, EP-07, EP-08 and EP-15 tables. For full evidence, see docs/prototype-build/catch-up/epics/EP-04.md, EP-07.md, EP-08.md and EP-15.md, the gaps.json entries for the six covered IDs, US-04.2.12, US-08.5.2, DM-06, DM-08 and RV-01, the DM-08 and DM-06 sections of docs/prototype-build/catch-up/analysis/domain-model-delta.md (DM-08 was DM-07 before the 2026-10-01 update), and RV-01 in docs/prototype-build/catch-up/analysis/reverse-check.md.
4. The covered catalogue files in "docs/discovery-reference/Updated Requirements/catalogue/requirements/":
   - US-04.1.3, US-04.3.5, US-07.3.1, US-08.1.1, US-08.4.4 and US-15.0.3;
   - their context: US-08.1.2 (Retired, merged into US-08.1.1), US-08.5.1, US-08.5.2 (rewritten to OQ-05's answer), US-13.3.2, US-04.2.12 (payment setting), US-01.4.6 and US-06.5.4 (who is paid), US-12.1.1 and US-04.2.10;
   - questions/OQ-05.md (answered), OQ-48.md, OQ-68.md and OQ-70.md;
   - the Booking ("Billing fails per Booking"), Procedure and "Contract (recommended structure)" sections of "docs/discovery-reference/Updated Requirements/domain-model.md", including its "Procedure billing context" table.
5. docs/design/Admin Review.dc.html, the AUTHORITATIVE layout reference for the authorised and locked state (convention 17), and docs/design/Design Language.dc.html for tokens. No mockup covers Master data, the invoice document or the Billing monitor: extend the admin's own patterns.
6. docs/prototype-build/PROGRESS.md:
   - the binding conventions;
   - the Decisions log entries this phase supersedes or must honour: the 2026-07-23 Phase 08 build decisions (contract resolution at billing time and the default fallback), the Phase 09 readings and build decisions (per-card failure isolation, now confirmed by OQ-05; the billing-failure demo), and the Phase 07 build decisions (flags are advisory, no Returned state);
   - the catch-up entries and handoff notes for Phases 14, 15, 15a, 16 and 18 to 24. Read 20 to 24 closely: they say what 20 left in the resolver for this phase, where required inputs and the claim reference live, where 22 keeps the payment setting, the split share and the invoice's supplier snapshot, how 23's Booking-level pricing works, and where 24 stores the adjustment and its before and after amounts.
7. docs/prototype-build/catch-up/analysis/prototype-map-store-seed.md, prototype-map-domain.md, prototype-map-admin.md and prototype-map-shell-demo-pwa.md, for the code entry points. Phase 15 renamed Card to Booking, so use the renamed files.
8. requirements-board/capture/ATLAS.md: the recipe format, routes, ids and hooks the catalogue's screenshot recipes depend on.

Then do the drift check in the phase doc:
- git diff 501b0b8 against the catalogue and domain-model.md for the covered IDs, US-04.2.12, US-01.4.6, US-08.5.2, OQ-48 and OQ-68, paying attention to whether discovery has named the fields to freeze (at 501b0b8 it has not);
- OQ-48 is still Open: build its recommendation (the procedure date, which is the List date), with Phase 18's label as the only one;
- OQ-05 is answered (failure per Booking, a List never fails, a Booking with any failed Procedure or party is held back whole): keep the per-Booking isolation and test it under the lock, including a split Booking;
- list every store action that writes a Contract or its fee schedule, every price, invoice and payee input 16 and 18 to 24 added, under the names they gave, and every place that works out the payee live (handoffCase, both anaesthetistIdForCase helpers, 16's bctiRecords, 22's Invoice.supplier);
- confirm 21's authoriseBlockersFor holds only the schedule miss (the child billable party is a mild warning, D4) and does not block on a missing required input (if it does, use the plan's handoff fallback for the failure trigger);
- record the current PERSIST_VERSION (13 at 501b0b8);
- check that Phase 16 has run (the planned order puts it before the Contracts track; it is not a declared dependency, so the plan's AA-FEE and BCTI clauses apply only if it has).
Then write a plan: turn the plan into work-sized steps, then start building without waiting for my approval (ROADMAP.md "Owner review: agents test themselves").

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any UI (screens, sheets, dialogs, panels, rows, banners, pills, empty and error states), and apply it inside this repo's design system: the docs/design files and src/theme tokens stay authoritative (convention 17, ROADMAP.md "Front-end design"), so use the skill for layout, hierarchy, spacing, states and finish, never for a new palette, typeface or visual language. Store, seed and pure-domain steps do not need it.
- Pin the figures first (item 1's invoice fixture, including suppliers, the Prentice split and 24's delta lines). The lock changes where the numbers come from, never the numbers. S3, S4 and S5 figures and 16's BCTI counts must match Phase 24 exactly, and the fixture is never updated with -u.
- Model, lock builder, engine and seed first, re-greened (build, build:pwa, vitest) before any UI. This phase realistically takes two sessions: plan to stop after work item 9, green, and do items 10 to 16, the demo guide and the review pass in a second session.
- Every Contract-writing action appends exactly one immutable version in the same mutate() commit, including payment-setting, invoicing, multi-procedure, base-unit override and allows-adjustment changes. Earlier versions never change.
- authoriseList writes every Booking's lock in the same commit as the state flip, then emits listAuthorised. A refused authorise writes nothing. Every authorise path (Review, the PWA office stand-in, Play the office, scenario jumps, stage-post-op) goes through it. Warnings never block it (15a): an out-of-range base-unit value or a child billable party locks as entered.
- The lock holds, per Procedure, the Contract version copy, rate, base units and their source (with the out-of-range flag), modifiers, primary flag, multi-procedure rule and share, schedule line, the payment setting with its share and per-party amounts, the adjustment with its permission and before and after amounts, and the office override; and per Booking the payee anaesthetist with the supplier details, the party details the invoice prints, invoice email, required inputs, presentation, GST rate and pre-payment already invoiced. lockedAtISO comes from the demo clock.
- The engine, retry and regenerate read only the lock, never state.masters. No effective-date fallback, no route or payer resolution, no Resolve & retry that edits a Contract. A Contract not in force on the List date is an authorise blocker, never a silent default. Delete contractIneffective and defaultContractFor.
- The payee is fixed at authorise: the run stamps it on the billing case and the invoice supplier, and handoffCase, receipts, the web accounts and 16's BCTI records read the stamped payee, not a Booking-to-List join. Pre-payment cases keep the join until 27 and 41.
- Failure stays per Booking: a failed Booking issues none of its invoices (both halves of a split included), its siblings bill, and the List never fails.
- Retry stays idempotent and never duplicates an invoice, case or Xero pair. supplyLockedInput is the only post-authorise write to a lock or a Booking: office only, a blank required input, a failed case, no pricing field; it takes a procedureId for the per-Procedure claim reference and applies its own guards in place of editRefusal.
- Snapshot the whole Contract version plus every rate input and the payee, because the fields to freeze are still a discovery item. Seeded AUTHORISED Lists get locks at seed time (migrated locks for the history backdrop, labelled, with the payee stamped). No new RNG draws. Bump PERSIST_VERSION once for the seed change.
- Locked Bookings display from the lock in all three apps, with the "Contract vN locked at authorise" badge; DRAFT Bookings still re-price live.
- Triggers:
  - Register "Regenerate from locked data" (harness bar, Admin invoice document) and re-point Phase 14's "Trigger billing failure" (harness bar, Billing monitor) to the missing claim reference cause, in Phase 14's registry.
  - Put the bodies in src/store (stageBillingFailure in src/store/demoStaging.ts) so pwaPurity holds. They must be deterministic, with a disabled state; regenerate is read-only and keeps its result in Phase 14's non-persisted trigger memory for the invoice rail to show.
  - No new PWA entry, but test that the PWA office stand-in locks the List with the handset's anaesthetist as payee. Nothing new goes on the Control Panel page.
- House rules:
  - Every write goes through mutate(), and every new audit code gets a label in src/shared/audit/actionLabels.ts.
  - Keep billing rules pure in src/domain/billing with Vitest tests.
  - Teal is the only action colour; crimson is identity only; the lock badge is a neutral pill, not a status colour.
  - Admin uses panels and overlays; mobile shows the badge and no money.
  - No en or em dashes in app copy.
  - Never commit.

When done:
- Run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye; never hand it to me) and report each item pass or fail with its evidence.
- Confirm npm run build, npm run build:pwa, npx vitest run, npm run shots and npm run verify:board are green.
- Run the adversarial review-and-fix pass (convention 18: fan out Opus reviewers for quality, bugs, plan adherence and money integrity; independently verify each finding; fix the confirmed ones; re-green).
- run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19; it absorbs work item 16's capture-recipe bullets): create or update the capture recipes for US-04.1.3, US-04.3.5, US-07.3.1, US-08.1.1, US-08.4.4 and US-15.0.3 (US-04.1.3 is new, with US-08.4.4 now captured) and every recipe this phase broke (US-08.5.1, US-08.5.2 with its captions on OQ-05's answer, US-13.3.2 re-pointed, and US-04.1.2's status and absentReason); in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green;
- Update PROGRESS.md: status row, catch-up Phase 25 entry with the drift-check result against 501b0b8, the lock's field list, the review pass and the catalogue screenshot result (REPORT.md counts before and after), the Decisions-log entries listed in the phase doc (the removed fallback, the re-based failure demo, what is locked, the payee fixed at authorise, versions, the authorise blocker kinds, failure per Booking confirmed, the engine's required-input backstop, migrated locks, the pricing date), and handoff notes for 27, 32, 35, 36, 39, 41, 42 and 44.
- Patch the demo guide in the same session: S3 Expected, S4 Beat 3 rewritten (a failed Booking is held back whole while the List bills), the S5 staging text, S5 Beat 4 rewritten and the new optional unit-value beat, the S4 discovery points, the cheat sheet, the workflows doc, the matching master-demo-guide.html sections, and the Control Panel S4 and S5 text. This is a milestone phase: finish with a consistency read of master-demo-guide.html against the run sheet.
- Give me short, clear notes, ending with the "For the owner's review" list (also in the PROGRESS entry).

Phase goal: every authorised Procedure carries a locked record of the Contract version, rate inputs, payment setting and split, adjustment and payee that priced and paid it, the billing run prices only from that record, a failed Booking is held back whole while the rest of the List bills, and any invoice can be regenerated exactly, whatever has changed since.
