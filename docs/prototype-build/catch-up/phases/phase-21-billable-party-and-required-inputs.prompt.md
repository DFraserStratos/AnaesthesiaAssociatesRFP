Please run catch-up Phase 21 (Billable party, required inputs and completeness) of the Anaesthesia Associates prototype.

Paths below are from the repo root (folder names contain spaces, so quote them). The app is aa-prototype/; run npm commands there. CLAUDE.md at the repo root holds the project rules.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner decisions table (D4 gates this phase), the sequencing rules (20 leaves "payer is the Contract holder" as the interim this phase replaces), and the Demo triggers and PWA parity sections.
2. docs/prototype-build/catch-up/phases/phase-21-billable-party-and-required-inputs.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic", then the EP-03, EP-04, EP-07, EP-08 and EP-11 tables. For full evidence, see docs/prototype-build/catch-up/epics/EP-11.md, EP-04.md and EP-07.md, and the DM-10, DM-14 and DM-24 sections of docs/prototype-build/catch-up/analysis/domain-model-delta.md.
4. The covered catalogue files in "docs/discovery-reference/Updated Requirements/catalogue/requirements/":
   - US-11.2.2, US-08.2.1, US-11.4.2, US-04.2.7, US-04.3.7, FT-03.6, US-03.6.1, US-11.2.3, US-11.2.4 and US-07.2.2;
   - their context: FT-11.2, US-11.2.1, US-04.2.1, US-04.3.3, US-03.4.1, US-11.4.1 and US-08.4.2;
   - questions/OQ-54.md;
   - the Booking, Contract and "Patient and billable party" sections of "docs/discovery-reference/Updated Requirements/domain-model.md".
5. docs/design/Admin Review.dc.html and docs/design/Mobile App.dc.html, which are the AUTHORITATIVE layout reference (convention 17). Use docs/design/Design Language.dc.html for tokens.
6. docs/prototype-build/PROGRESS.md:
   - the binding conventions;
   - the Decisions log entries this phase supersedes or must honour: the 2026-07-22 "Type 3 second-procedure fallback" reading, the 7th-review A1/B15 payer reading, and the Phase 07 build decisions (review flags are advisory, no Returned state);
   - the catch-up entries for Phases 14, 15, 18 and 20. Read 20 closely: it says where the interim payer (Procedure.billablePartyId), the Contract-change record (Procedure.contractSelection) and the prepayment amount now live. If an entry is thin, read that phase's plan in docs/prototype-build/catch-up/phases/.
7. docs/prototype-build/catch-up/analysis/prototype-map-domain.md, prototype-map-shared.md, prototype-map-admin.md, prototype-map-store-seed.md and prototype-map-shell-demo-pwa.md, for the code entry points. Phase 15 renamed Card to Booking, so use the renamed files.

Then do the drift check in the phase doc:
- git diff 1f067a8 against the catalogue and domain-model.md for the covered IDs and OQ-54;
- confirm whether the owner has answered D4 (child payer: block or warn);
- note what Phase 20 actually left;
- note who Phase 18 made the RVG Default Hospital Contract bill (the hospital), keep it, and record the catalogue tension for the owner (drift-check step 5).
If a covered item is now Retired or Future, drop it and say so.
Then enter plan mode: turn the plan into work-sized steps across the two sessions, and wait for my approval.

While working:
- Billable party first, re-greened, then required inputs. Session 1 is items 1 to 8, and must end green and demoable (build, build:pwa, vitest, shots) before session 2 starts.
- The billable party is independent of pricing. No fee path may read it. A hospital override on the default RVG Contract changes who is invoiced, never the fee. funderOverride lines still beat the party until Phase 22, so S3's figures ($396.18, $152.38, $91.43) must not move.
- Seed every required input on every scripted Booking. S1 Beat 3, S2 Beat 4, S3 and S4 Beat 1 must run unchanged. Add a seed test that every completed seeded Booking passes the new validator, and that no seeded SUBMITTED List has an authorise blocker.
- There are exactly two authorise blockers, both from one pure function shared by authoriseList and the Review UI: a child billable party (D4 default, captioned provisional while OQ-54 is open) and an unconfirmed schedule miss. Every other flag stays advisory. The child block only ever appears on the staged List, never on the S2 or S3 Lists.
- Age is on the List date. The invoice email is implicitly required for every person party. The "to confirm with the hospital" flag is derived, not stored. Remove the silent BTM fallback for non-additional Procedures only; the additional-procedure ordinal fallback belongs to Phase 23. Only the office may set a fixed-schedule Contract that has no line for the code (US-04.3.7 AC1); anaesthetists keep Phase 20's filter.
- Seed new Bookings with dedicated pinned patients, not takePatient(), so filler Bookings and scripted figures do not shift.
- Triggers:
  - Register "Stage child billed directly" (harness bar, Admin Review, end of session 1) and "Office approves this Contract change" (PWA sheet only, mobile Booking, as OFFICE_SIMULATION_ACTOR) in src/shared/demoTriggers/registry.ts.
  - Put the bodies in src/store (the staging in a new src/store/demoStaging.ts) so pwaPurity holds. They must be deterministic and idempotent, with a disabled state. The staged List must be empty and DRAFT in the pristine seed (the filler fills past Lists, so check), and off every S1 to S5 beat.
  - Nothing new goes on the Control Panel page.
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
- Update PROGRESS.md: status row, catch-up Phase 21 entry with the drift-check result and the review pass, the five Decisions-log entries, and handoff notes for 22, 23, 25 and 27.
- Patch the demo guide in the same session: S1 Beat 3 note, S2 Beat 4 plus the optional child aside, S3 Beat 1 wording, the cheat sheet, the workflows and personas docs, the matching master-demo-guide.html sections, and the Control Panel S2 text.
- Give me short, clear notes.

Phase goal: every Booking says who is invoiced and where, independently of pricing, and cannot be completed or authorised without what its Contract and the child rule require.
