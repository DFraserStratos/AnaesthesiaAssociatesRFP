Please run catch-up Phase 18 (Contract model) of the Anaesthesia Associates prototype.

Paths below are relative to the repo root ("/Users/d.fraser/Local Dev/Anaesthesia Associates RFP"; quote paths, they contain spaces). The app is aa-prototype/; run npm scripts and npx vitest there.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner decisions, the Contracts-track sequencing rules (18 keeps today's resolver; scope only narrows the picker in 20), the demo-trigger and demo-guide rules, and the "When the catalogue changes" drift procedure.
2. docs/prototype-build/catch-up/phases/phase-18-contract-model.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: Summary, Theme 1 (Contract becomes the whole pricing decision), "Structural first" step 2, and the EP-04 and EP-05 tables under "By epic". Then docs/prototype-build/catch-up/epics/EP-04.md and EP-05.md for US-04.1.1, US-04.1.2, US-04.2.1, US-04.2.4, US-04.2.10 and US-05.2.5, plus DM-06 and DM-08 in analysis/domain-model-delta.md and RV-20 in analysis/reverse-check.md.
4. The covered catalogue files in "docs/discovery-reference/Updated Requirements/catalogue/requirements/": US-04.1.1, US-04.1.2, US-04.2.1, US-04.2.4, US-04.2.10, US-05.2.5, plus US-04.2.2, US-05.2.6 and US-05.5.1 for context. The questions OQ-18 and OQ-48 in catalogue/questions/. The "Contract (recommended structure)" and "Fee schedule line" tables in "docs/discovery-reference/Updated Requirements/domain-model.md".
5. docs/prototype-build/catch-up/analysis/prototype-map-domain.md (sections 2 and 5), prototype-map-store-seed.md and prototype-map-admin.md: where the Contract, ContractPrice, fee and selection code lives.
6. docs/design/Design Language.dc.html (tokens, pills, mono data) and docs/design/Admin Review.dc.html (admin table and panel anatomy, and the CONTRACT field). No mockup covers Master data, so extend the admin's own patterns.
7. docs/prototype-build/PROGRESS.md: the binding conventions (especially 6, 9, 15, 17 and 18), and these Decisions log entries: "Type 3 second-procedure fallback" (2026-07-22, kept), "SXAP Type 2 agreed rate = $26.50" (kept), "Contract-holder placements (seed)" (amended), "Phase 08 build, decisions" item 1 (the resolver, kept), "Method 3 gate sentence single-sourced", the 6th review #3 and 7th review A5/B3 ACC advisory (superseded), and the Phase 17 entry (the surgeon-group entity this phase's holder points at).

Then do the drift check: git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md". Read it for the covered IDs, OQ-18 and OQ-48. Adjust the work items if anything moved, and drop any item now Retired or Future, noting it for PROGRESS. Also read Phase 17's PROGRESS entry for the surgeon-group entity it actually built (type, master key, SG-COS, any organisation link). Then enter plan mode: turn the plan into work-sized steps across two sessions (session 1 is the model, parity, pricing, seed and store; session 2 is the Admin catalogue, office billing setup, ACC removal, copy and demo guide; if session 1 runs long, stop green after the seed with the parity fixture matching), and wait for my approval. Do not edit any code before I approve.

While working:
- Parity first. Capture the fee and invoice baseline fixture for every seeded procedure and Booking before touching types.ts. It must match unchanged at the end. Never update it with -u, and never edit an expected number to make a test pass. S3, S4 and S5 figures do not move in this phase.
- Keep today's resolver. The stored governing Contract is used while it is effective on the List date. The fallback goes only to that hospital's or insurer's protected default. Surgeon, surgeon-group and Booking-billable-party holders dated out are still exceptions. Scope filters are modelled and edited, but narrow nothing until Phase 20.
- Keep every counterparty. COS moves to the Phase 17 surgeon group (SG-COS) as holder, but still bills as { kind: 'organisation', id: ORG.cos } through SurgeonGroup.billingOrganisationId (work item 2). Do not rename CounterpartyKind. Keep the seeded line ids CP-BAR-1 to CP-BAR-3.
- The price in force is taken on the List date (OQ-48 interim). "Current" and "Upcoming from <date>" in the UI use the demo clock's today. Rate and price steps already in force are never edited or removed; a change is a new step.
- Fee schedule lines match on the procedure's RVG code, and the office may pick a holder line directly (OQ-18 interim). Add-ons are office-attached only. B/T/M are still recorded under a fixed price. The 2026-07-22 BTM fallback stays until Phase 21.
- ACC is an ordinary holder's ACC-scoped Contract: remove accRelated, the review flag, the Balances chip and the Accounts column. Keep the ACC pre-op flat-fee codes.
- Billing maths stays pure in src/domain/billing with Vitest tests. Every write goes through mutate() with an audit entry. Guards live in the store, not the UI. No Date.now() or new Date(). Bump PERSIST_VERSION for the seed change.
- Follow the design files. Teal is the only action colour and crimson is identity only. Status is shown as tint and on-tint pills, and codes and money as mono tabular-nums. No en or em dashes in app copy, no "Type 1/2/3" in rendered copy, and no build-phase references in the UI.
- No new demo button: the Upcoming price flips with the existing clock. Check that Phase 14's "Trigger billing failure" still works on the reshaped COS Contract.
- Build only what the plan lists. Versions, required inputs, the multi-procedure rule, the adjustment and invoice presentation belong to Phases 20 to 25.
- Keep build and tests green at the end of each session.

When done:
- Run the manual test checklist and report each item.
- Run npm run build, npm run build:pwa, npx vitest run and npm run shots, all green.
- Run the adversarial review-and-fix pass (convention 18). Scale to four Opus lenses: quality, fee-maths and parity, store and lifecycle, and plan and catalogue adherence. Steer them with the plan's "Steer this phase's reviewers at" list. Independently verify each finding, fix the confirmed ones and re-green.
- Update PROGRESS.md: status row, phase entry (drift-check result, the Phase 17 surgeon-group mapping, parity result, PERSIST_VERSION bump, the review pass, handoffs to 19, 20, 21, 23, 25 and 42) and the Decisions-log entries (a) to (g) the plan lists.
- Patch the demo guide files, the matching master-demo-guide.html sections and the Control Panel scenario text.
- Give me short, clear notes. Do not commit.

Phase goal: the Contract becomes category, holder, scope and pricing basis, with effective-dated fee schedule lines and rates, a review date and retire, and ACC priced as an ordinary holder, with every seeded fee unchanged.
