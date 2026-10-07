Please run catch-up Phase 21 (Billable party, required inputs and completeness) of the Anaesthesia Associates prototype.

Paths below are from the repo root (folder names contain spaces, so quote them). The app is aa-prototype/; run npm commands there. CLAUDE.md at the repo root holds the project rules.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner decisions table (D2, D4, D17 and D23 are answered and shape this phase), the "Confirm before building" row for 21 (OQ-78), the sequencing rules (20 leaves "payer is the Contract holder" and the billablePartyId guardian override as the interim this phase replaces; 15a's warning routine hosts the child rule), the Demo triggers and PWA parity sections, and the "Catalogue screenshots" rule.
2. docs/prototype-build/catch-up/phases/phase-21-billable-party-and-required-inputs.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic", then the EP-03, EP-04, EP-07, EP-11 and EP-13 tables. For full evidence, see docs/prototype-build/catch-up/epics/EP-11.md, EP-04.md and EP-07.md, the DM-11, DM-12, DM-16, DM-28 and DM-37 sections of docs/prototype-build/catch-up/analysis/domain-model-delta.md, and RV-29 in docs/prototype-build/catch-up/analysis/reverse-check.md.
4. The covered catalogue files in "requirements-board/requirements/stories/":
   - FT-11.2, US-11.2.1, US-11.2.2, US-11.4.2, US-04.2.7, US-04.3.7, FT-03.6, US-03.6.1, US-11.2.3, US-11.2.4 and US-07.2.2;
   - their context: US-04.2.1, US-04.3.3, US-04.4.2, US-03.4.1, US-11.4.1, US-08.2.1 (already Matches), US-08.4.2, FT-13.7 and US-13.7.2;
   - questions/OQ-54.md, OQ-55.md, OQ-67.md and OQ-73.md (answered) and OQ-78.md (open);
   - notes/2026-10-02-aa-meeting-with-greg.md #4, #8 and #41, and changes/2026-10-02-requirements-update.md (one level up, in "requirements-board/requirements/changes/");
   - the Booking, Contract, "Procedure billing context", "Selection", "Patient and billable party" and Warnings sections of "requirements-board/requirements/domain-model.md".
5. docs/design/Admin Review.dc.html and docs/design/Mobile App.dc.html, which are the AUTHORITATIVE layout reference (convention 17). Use docs/design/Design Language.dc.html for tokens.
6. requirements-board/capture/ATLAS.md: the recipe format, routes, ids and hooks the catalogue's screenshot recipes depend on; and the "Catalogue screenshots" rule in ROADMAP.md.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions;
   - the Decisions log entries this phase supersedes or must honour: the 2026-07-22 third and seventh reviews (billable party defaults to the patient, typed override record when someone else pays), the 7th-review A1/B15 payer reading, the 2026-07-22 "Type 3 second-procedure fallback" reading, and the Phase 07 build decisions (review flags are advisory, no Returned state);
   - the catch-up entries for Phases 14, 15, 15a, 16, 17, 18, 19, 19a and 20. Read 15a closely: the WARNING_RULES registry, the WarningFacts and Warning shapes, how warnings are derived by selectors (only clearances are stored), how Clear and re-opening work, that submit has no confirm step, and the WARNING_SAMPLES isStaged/stage/unstage contract and DEMO_TRIGGER_ACTOR behind "Raise sample warnings". Read 18 and 19a for the ContractHolder union and its bookingBillableParty kind, holderCounterparty, the RVG Default Post-paid and Aria Contracts, and which holder 19a's default RVG Contracts carry. Read 20 closely: the interim payer (Procedure.billablePartyId, holder-as-payer, payerForProcedure), the audit-derived Contract change (pendingContractChange), ContractPickerSheet and the "Contract and payer" sheet, the Booking prepayment flag, and where the AIA reimbursement Booking ended up. If an entry is thin, read that phase's plan in docs/prototype-build/catch-up/phases/.
8. docs/prototype-build/catch-up/analysis/prototype-map-domain.md, prototype-map-shared.md, prototype-map-admin.md, prototype-map-store-seed.md and prototype-map-shell-demo-pwa.md, for the code entry points. Phase 15 renamed Card to Booking, so use the renamed files.

Then do the drift check in the phase doc:
- node docs/prototype-build/catch-up/tools/plan-state.mjs --diff <IDs> against the catalogue and domain-model.md for the covered IDs, the context items, OQ-54, OQ-55, OQ-67, OQ-73 and OQ-78;
- OQ-67 is answered (D17): build it. The Contract always defines the billable party, with no per-Booking or per-Procedure override, and a default or patient-direct Contract asks for the payer's name and email. Carry no "Provisional (OQ-67)" caption. D4 is answered, so the child case is a mild warning, never a block;
- OQ-78 is open: build its recommendation (the catalogue's model, default Contracts that ask for the payer), add no second provisional caption (Phase 20 owns the one), and keep the payer capture one store action and one predicate. If OQ-78 has been answered, stop and record it before building;
- note what 15a, 18, 19a and 20 actually left;
- record the RVG Default Hospital reading (drift-check step 6): it bills the hospital and asks for no payer, so S1 and S3 hold.
If a covered item is now Retired or Future, drop it and say so.
Then write a plan: turn the plan into work-sized steps across the two sessions, then start building without waiting for my approval (ROADMAP.md "Owner review: agents test themselves").

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any UI (screens, sheets, dialogs, panels, rows, banners, pills, empty and error states), and apply it inside this repo's design system: the docs/design files and src/theme tokens stay authoritative (convention 17, ROADMAP.md "Front-end design"), so use the skill for layout, hierarchy, spacing, states and finish, never for a new palette, typeface or visual language. Store, seed and pure-domain steps do not need it.
- Billable party first, re-greened, then required inputs. Session 1 is items 1 to 8, and must end green and demoable (build, build:pwa, vitest, shots) before session 2 starts.
- The Contract defines the billable party (D17). Each Procedure's party is its Contract holder (holderCounterparty), except on a Contract that names its payer (contractNamesPayer: a bookingBillableParty holder, or an insurer that takes no direct claims), where it is the payer captured on the Procedure (Procedure.payer: the patient with an email, or a named payer such as a guardian). setProcedurePayer is the only writer. A hospital taking the invoice is the hospital's Contract, never a stored party.
- Retire the guardian master (RV-29): BillableParty, masters.billableParties, createBillableParty, Procedure.billablePartyId and "New guardian" all go. Re-express BP0001 Hana Park and BP0002 Aria clinic as named payers on their Procedures, keeping the BP ids so Xero contacts, invoices and history rows do not move. Aria is marked an organisation, so it never gets a prepayment (OQ-73).
- The billable party is independent of pricing. No fee path may read it. funderOverride lines still beat the party until Phase 22, so S3's figures ($396.18, $152.38, $91.43) must not move.
- Nothing goes back on the Booking for the insurer or funding source (D2). An insurer that takes no direct claims is read through the Contract holder (Insurer.acceptsDirectClaims): its Contract names the payer, the patient by default, with a "claim from {insurer}" note. The insurer member number is a required-input value only.
- The child billable party (under 18 on the List date, paying directly) is one mild rule added to 15a's WARNING_RULES (rule file, union member, app-settings default, facts, sample), derived like 15a's own: to-do list with Clear, triangle in all three apps, visible on opening the Booking, the Review row. No reviewFlags duplicate, no blocker, no confirm step, no warning when anyone else pays. Saving, completing, submitting and authorising all go through with it open.
- Seed a captured payer and every required input on every scripted Booking. S1 Beat 3, S2 Beat 4, S3 and S4 Beat 1 must run unchanged, with no new blocker or warning. Add a seed test that every completed seeded Booking passes the new validator, that no seeded SUBMITTED List has an authorise blocker, that every Procedure on a Contract that names its payer has one, and that the only child warning in the pristine seed is on the childBilledDirectly marker.
- There is exactly one authorise blocker kind, an unconfirmed schedule miss, from one pure authoriseBlockersFor shared by authoriseList, the Review UI and the PWA office stand-ins. Every other flag stays advisory.
- Age is on the List date. The payer and invoice email are implicitly required wherever a Contract names its payer or a person pays. The "to confirm with the hospital" flag is derived, not stored, and its outcomes are a patient-direct default RVG Contract, the hospital's RVG Default Hospital Contract, or a new schedule line. Remove the silent BTM fallback for non-additional Procedures only; the additional-procedure ordinal fallback belongs to Phase 23. Only the office may set a fixed-schedule Contract that has no line for the procedure (US-04.3.7 AC1); anaesthetists keep Phase 20's filter.
- Seed new Bookings with dedicated pinned patients, not takePatient(), so filler Bookings and scripted figures do not shift. The child review List is a spare SUBMITTED List off every S1 to S5 beat (the filler fills past Lists, so check), with a 15-year-old paying directly on the patient-direct Contract and a 12-year-old on the hospital's default Contract. Check no filler patient raises a stray child warning.
- Triggers:
  - Add a childBillableParty entry to 15a's WARNING_SAMPLES (stage, as DEMO_TRIGGER_ACTOR, moves the 12-year-old's Procedure onto the patient-direct Contract with the patient paying; unstage restores its seed Contract and payer; no new Booking), and register "Office approves this Contract change" (PWA sheet only, mobile Booking, as OFFICE_SIMULATION_ACTOR) in src/shared/demoTriggers/registry.ts.
  - The payer step in the Contract picker (mobile, web and admin) is product, with no button.
  - Bodies live in src/store so pwaPurity holds. They must be deterministic and idempotent, with a disabled state.
  - No "Stage child billed directly" button and no src/store/demoStaging.ts: the case is seeded. Nothing new goes on the Control Panel page.
- House rules:
  - Every write goes through mutate() with audit labels.
  - Keep billing rules pure in src/domain/billing with Vitest tests.
  - Bump PERSIST_VERSION for each seed change.
  - Mobile uses bottom sheets; web and admin use dialogs.
  - Teal is the only action colour; crimson is identity only.
  - No en or em dashes in app copy.
  - Never commit.

When done:
- Run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye; never hand it to me) and report each item pass or fail with its evidence.
- Confirm npm run build, npm run build:pwa, npx vitest run, npm run shots and npm run verify:board are green.
- Run the adversarial review-and-fix pass (convention 18: fan out Opus reviewers for quality, bugs, plan adherence and money integrity; independently verify each finding; fix the confirmed ones; re-green).
- Run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19): create or update the capture recipes for US-11.2.1, US-11.2.2, US-11.2.3, US-11.2.4, US-11.4.2, US-04.2.7, US-04.3.7, US-03.6.1, US-03.6.2 and US-07.2.2 and every recipe this phase broke; in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green. Do not edit the catalogue: hand US-11.2.2's stale-screenshot note to /update-requirements in the PROGRESS entry.
- Update PROGRESS.md: status row, catch-up Phase 21 entry with the drift-check result, the review pass and the catalogue screenshot result (REPORT.md counts before and after), the Decisions-log entries (guardian override record, route-based payer, silent BTM fallback, the one authorise blocker, the RVG Default Hospital reading under OQ-78, the AIA Contract, the Aria organisation payer, claimReference, the office-only off-schedule Contract), and handoff notes for 22, 23, 25, 27, 38b, 39 and 40.
- Patch the demo guide in the same session: S1 Beat 3 note, S2 Beat 4 plus the optional child-warning aside, S3 Beat 1 wording, the cheat sheet (payer section and 15a's warnings section), the workflows and personas docs, the matching master-demo-guide.html sections, and the Control Panel S2 text.
- Give me short, clear notes, ending with the "For the owner's review" list (also in the PROGRESS entry).

Phase goal: every Procedure's Contract says who is invoiced and where, with the payer's name and email captured on a default or patient-direct Contract and no override anywhere; a Booking cannot be completed without what its Contract requires; and a child paying directly raises a mild warning that never blocks.
