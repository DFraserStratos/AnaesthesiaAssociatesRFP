Please run catch-up Phase 21 (Billable party, required inputs and completeness) of the Anaesthesia Associates prototype.

Paths below are from the repo root (folder names contain spaces, so quote them). The app is aa-prototype/; run npm commands there. CLAUDE.md at the repo root holds the project rules.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner decisions table (D2 and D4 are answered and shape this phase), the "Confirm before building" row for 21 (OQ-67), the sequencing rules (20 leaves "payer is the Contract holder" as the interim this phase replaces; 15a's warning routine hosts the child rule), and the Demo triggers and PWA parity sections.
2. docs/prototype-build/catch-up/phases/phase-21-billable-party-and-required-inputs.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic", then the EP-03, EP-04, EP-07, EP-11 and EP-13 tables. For full evidence, see docs/prototype-build/catch-up/epics/EP-11.md, EP-04.md and EP-07.md, and the DM-11, DM-12, DM-16, DM-28 and DM-37 sections of docs/prototype-build/catch-up/analysis/domain-model-delta.md.
4. The covered catalogue files in "docs/discovery-reference/Updated Requirements/catalogue/requirements/":
   - FT-11.2, US-11.2.2, US-11.4.2, US-04.2.7, US-04.3.7, FT-03.6, US-03.6.1, US-11.2.3, US-11.2.4 and US-07.2.2;
   - their context: US-11.2.1, US-04.2.1, US-04.3.3, US-03.4.1, US-11.4.1, US-08.2.1 (already Matches), US-08.4.2, FT-13.7 and US-13.7.2;
   - questions/OQ-54.md and OQ-55.md (answered) and OQ-67.md (open);
   - the Booking, Contract, "Patient and billable party" and Warnings sections of "docs/discovery-reference/Updated Requirements/domain-model.md".
5. docs/design/Admin Review.dc.html and docs/design/Mobile App.dc.html, which are the AUTHORITATIVE layout reference (convention 17). Use docs/design/Design Language.dc.html for tokens.
6. docs/prototype-build/PROGRESS.md:
   - the binding conventions;
   - the Decisions log entries this phase supersedes or must honour: the 2026-07-22 "Type 3 second-procedure fallback" reading, the 7th-review A1/B15 payer reading, and the Phase 07 build decisions (review flags are advisory, no Returned state);
   - the catch-up entries for Phases 14, 15, 15a, 18, 19 and 20. Read 15a closely: the WARNING_RULES registry, the WarningFacts and Warning shapes, how warnings are derived by selectors (only clearances are stored), how Clear and re-opening work, and the WARNING_SAMPLES stage/unstage contract behind "Raise sample warnings". Read 20 closely: where the interim payer (Procedure.billablePartyId), the Contract-change record (stored or derived from audit) and the prepayment amount now live, and where the AIA reimbursement Booking ended up. If an entry is thin, read that phase's plan in docs/prototype-build/catch-up/phases/.
7. docs/prototype-build/catch-up/analysis/prototype-map-domain.md, prototype-map-shared.md, prototype-map-admin.md, prototype-map-store-seed.md and prototype-map-shell-demo-pwa.md, for the code entry points. Phase 15 renamed Card to Booking, so use the renamed files.

Then do the drift check in the phase doc:
- git diff 501b0b8 against the catalogue and domain-model.md for the covered IDs, OQ-54, OQ-55 and OQ-67;
- check OQ-67's status: if still open, build its recommendation (the per-Booking override beside the Contract-defined party, as one field, with one "Provisional (OQ-67)" caption on the billable party sheet); D4 is answered, so the child case is a mild warning, never a block;
- note what 15a and 20 actually left;
- note who Phase 18 made the RVG Default Hospital Contract bill, keep it, and record the tension with OQ-55's "a default Contract bills the patient" for the owner, as part of OQ-67 (drift-check step 5).
If a covered item is now Retired or Future, drop it and say so.
Then enter plan mode: turn the plan into work-sized steps across the two sessions, and wait for my approval.

While working:
- Billable party first, re-greened, then required inputs. Session 1 is items 1 to 8, and must end green and demoable (build, build:pwa, vitest, shots) before session 2 starts.
- The billable party is independent of pricing. No fee path may read it. Each Procedure's default comes from its Contract (OQ-55); a hospital override on the default RVG Contract changes who is invoiced, never the fee. funderOverride lines still beat the party until Phase 22, so S3's figures ($396.18, $152.38, $91.43) must not move.
- Nothing goes back on the Booking for the insurer or funding source (D2). An insurer that takes no direct claims is read through the Contract holder (Insurer.acceptsDirectClaims): its Procedures default to the patient, with a "claim from {insurer}" note. The insurer member number is a required-input value only.
- Do not extend the BillableParty guardian record or createBillableParty. A guardian's email goes in the Booking's invoice email.
- The child billable party (under 18 on the List date, billed to themself) is one mild rule added to 15a's WARNING_RULES (rule file, union member, app-settings default, facts, sample), derived like 15a's own: to-do list with Clear, triangle in all three apps, the Review row. No reviewFlags duplicate, no blocker, no warning when anyone else pays. Saving, completing, submitting and authorising all go through with it open.
- Seed every required input on every scripted Booking. S1 Beat 3, S2 Beat 4, S3 and S4 Beat 1 must run unchanged, with no new blocker or warning. Add a seed test that every completed seeded Booking passes the new validator, that no seeded SUBMITTED List has an authorise blocker, and that the only child warning in the pristine seed is on the childBilledDirectly marker.
- There is exactly one authorise blocker kind, an unconfirmed schedule miss, from one pure authoriseBlockersFor shared by authoriseList, the Review UI and the PWA office stand-ins. Every other flag stays advisory.
- Age is on the List date. The invoice email is implicitly required for every person party. The "to confirm with the hospital" flag is derived, not stored. Remove the silent BTM fallback for non-additional Procedures only; the additional-procedure ordinal fallback belongs to Phase 23. Only the office may set a fixed-schedule Contract that has no line for the procedure (US-04.3.7 AC1); anaesthetists keep Phase 20's filter.
- Seed new Bookings with dedicated pinned patients, not takePatient(), so filler Bookings and scripted figures do not shift. The child review List is a spare SUBMITTED List off every S1 to S5 beat (the filler fills past Lists, so check), with a 15-year-old billed to themself and a hospital-billed 12-year-old. Check no filler patient raises a stray child warning.
- Triggers:
  - Add a childBillableParty entry to 15a's WARNING_SAMPLES (stage sets the hospital-billed 12-year-old's billable party to the patient; unstage restores it; no new Booking), and register "Office approves this Contract change" (PWA sheet only, mobile Booking, as OFFICE_SIMULATION_ACTOR) in src/shared/demoTriggers/registry.ts.
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
- Run the manual test checklist and report each item.
- Confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green.
- Run the adversarial review-and-fix pass (convention 18: fan out Opus reviewers for quality, bugs, plan adherence and money integrity; independently verify each finding; fix the confirmed ones; re-green).
- Update PROGRESS.md: status row, catch-up Phase 21 entry with the drift-check result and the review pass, the six Decisions-log entries, and handoff notes for 22, 23, 25, 27 and 40.
- Patch the demo guide in the same session: S1 Beat 3 note, S2 Beat 4 plus the optional child-warning aside, S3 Beat 1 wording, the cheat sheet (payer section and 15a's warnings section), the workflows and personas docs, the matching master-demo-guide.html sections, and the Control Panel S2 text.
- Give me short, clear notes.

Phase goal: every Booking says who is invoiced and where, defaulted from each Procedure's Contract and independent of pricing; it cannot be completed without what its Contract requires, and a child billed directly raises a mild warning that never blocks.
