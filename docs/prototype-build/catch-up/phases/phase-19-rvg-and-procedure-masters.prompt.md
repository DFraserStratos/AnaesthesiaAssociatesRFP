Please run catch-up Phase 19 (RVG, modifier and Procedure masters) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner decisions table (D3 gates this phase), the Contracts track sequencing rules, and the "Confirm before building" row for 19.
2. docs/prototype-build/catch-up/phases/phase-19-rvg-and-procedure-masters.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic", then the "EP-05 - RVG master data and fee calculation rules" section and the US-03.3.1 row of the EP-03 section. Then docs/prototype-build/catch-up/epics/EP-05.md (US-05.1.1, 05.1.3, 05.1.5, 05.1.6, 05.5.2), and docs/prototype-build/catch-up/analysis/domain-model-delta.md (DM-11) and reverse-check.md (RV-04, RV-20).
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-05.1.1.md, US-05.1.3.md, US-05.1.5.md, US-05.1.6.md, US-03.3.1.md and US-05.5.2.md;
   - for context, requirements/US-04.2.2.md, US-03.3.6.md and US-06.1.1.md;
   - questions/OQ-06.md, OQ-12.md and OQ-32.md;
   - the "RVG code and modifier master" section of ../domain-model.md.
5. The analysis maps for the code you will change: docs/prototype-build/catch-up/analysis/prototype-map-domain.md (billing maths), prototype-map-shared.md (capture suite), prototype-map-admin.md section 9 (Master data) and prototype-map-store-seed.md.
6. Design: docs/design/Design Language.dc.html (tokens, pills, badges) and Admin Review.dc.html (table anatomy for the Master data tabs). Mobile App.dc.html screen 3 is for the code card and modifier chips.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions;
   - the Decisions log entries this phase supersedes or must honour: 2026-07-22 (modifier table in code, ASA seeding values), 2026-07-23 (Phase 01/02 review: modifier semantics, A1 and the Ellison fee), 2026-07-27 (modifier bands), 2026-07-28 (modifier picker shape) and 2026-09-28 (the anaesthetist Card shows no calculation);
   - the PROGRESS entries for catch-up Phases 15 to 18, for what they renamed and reshaped. From 18 in particular: ContractScope (its rvgCodes and fundingSources arrays), the feeParity.test.ts harness and its __parity__ fixture, the accContractCard scenario marker and ContractEditSheet's Scope chips.
8. docs/prototype-build/catch-up/phases/phase-18-contract-model.md, its handoff list: "RVG groups in scope" is handed to this phase.

Then do the drift check in the phase doc:
- Run git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" for the covered IDs and OQs, re-read anything changed, and drop anything now Retired or Future (noting it for PROGRESS.md).
- Confirm the owner's D3 answer and the status of OQ-06 and OQ-12, and check whether AA's fuller modifier list has landed in docs/discovery-reference/Data files.
- If an answer is still open, build the interim the phase doc specifies and label it provisional.
- If OQ-06 rejects the Procedure master, stop and ask me.

Then enter plan mode: map the phase doc's work items onto the files as Phases 15 to 18 actually left them, split the work into the two sessions the doc describes, and wait for my approval.

While working:
- Baseline first. Commit nothing, but add a phase-19 fixture to Phase 18's fee parity harness (src/domain/billing/feeParity.test.ts), generated from the untouched code before any edit, and never regenerate it with -u. It must come out identical at the end: no S1 to S5 figure moves. Keep the run sheet's figures by remapping, never by re-pricing.
- One base-unit resolver, pure, in src/domain/billing/baseUnits.ts, with this precedence:
  1. the manual capture override;
  2. the Contract override (a slot only, Phase 23 fills it);
  3. the Procedure master entry;
  4. the RVG guide single value;
  5. the chosen ranged value.
  Both fee-context assemblers (feeContextFor and procedureFee), invoiceBuild, seed/billing.ts and the review flags' naturalBtm feed it the same inputs. Nothing else computes base units.
- The modifier master is store data.
  - modifierUnits, modifierBandOf and toggleModifierCode take the master as a required parameter, and the selection rule is a per-code field.
  - Existing codes keep their exact units and band behaviour, including the PA5 exemption.
  - Add VM1, TTE1, TTE2, PACU1, EAA1, POC1 to POC3, NC1 and NC2, with demo-plausible units and provisional descriptions. Do not invent clinical meanings. Remove PO1 and PO2.
- NZSA guide values stay read-only. AA codes are marked AA-sourced. RVG groups are many-to-many AA tags, and site groups are derived from anatomicalSite, never stored.
- Contract scope gains rvgGroups (empty on every seeded Contract), edited from ContractEditSheet's Scope chips and matched by a pure scopeCoversCode for Phase 20. No Contract selection change here. A group any scope or Procedure master entry uses cannot be deleted.
- Completion: an unchosen ranged value still blocks unless the Procedure master (or later the Contract) supplies the base; a manual override does not waive it, as today.
- The capture picker (CodePickerSheet) does not change, and there is no pick-by-operation-name picker (OQ-06). The Procedure master link is an office action on one Procedure, filtered to entries under its code.
- RV-04 under D3: completion no longer bounds a ranged entry. An out-of-range value raises a warn review flag, and an unchosen value still blocks.
- ACC pre-op codes (CS250, CS260, CS70) are offered only when isAccContract(contract) is true, read from Phase 18's scope.fundingSources (includes 'ACC') and never from a revived ACC flag or accRelated (RV-20). The amount is typed (OQ-12), and the code reaches the invoice line. addBillingLine keeps its existing actor rules: the anaesthetist bills this line.
- Mock backend only. Every master write is office-only, goes through mutate() and is audited.
- The capture picker's "other groupings" (US-03.3.1) stays open on purpose; log it with the OQ-06 follow-up.
- Determinism: new seed data draws nothing from the seeded RNG. Bump PERSIST_VERSION once.
- Billing maths stays pure with Vitest tests for every rule, and pwaPurity stays green.
- Design: teal is the only action colour, crimson is identity only, and source, group and provisional markers are neutral pills. Mobile uses sheets, and the two web apps are desktop layouts. The "More modifiers" disclosure keeps the phone's capture height.
- No en dashes or em dashes in any app-facing copy; use "to" for ranges.
- No demo triggers: everything is shown through normal use, so add no harness-bar Demo actions entry and no PWA demo-actions entry.
- Build nothing ahead of the plan: no Contract override field, no Booking-level split, no prepaid tick list, no spreadsheet loader.
- Keep npm run build, npm run build:pwa and npx vitest run green at the end of each session.

When done:
- Run the manual test checklist and report each item.
- Run npm run build, npm run build:pwa, npx vitest run and npm run shots, all green, with the parity fixture unchanged.
- Run the adversarial review-and-fix pass (PROGRESS convention 18): fan out Opus review subagents for quality, bugs/correctness, plan adherence and billing maths, using the phase doc's steer list. Independently verify each finding, fix the confirmed ones with tests, and re-green.
- Update PROGRESS.md: status row, phase entry with the review pass and the parity result, the Decisions-log entries listed in the phase doc, and the handoff notes for 20, 23, 25, 26 and 42 and the OQ-06 follow-up.
- Patch the demo guide sections the phase doc names (cheat sheet items 10 and 12 and the fee calculation bullets, the workflow capture steps, and the S5 discovery points) and the same sections of master-demo-guide.html.
- Do not commit. Give me short, clear notes on what changed, what is provisional, and anything you need me to decide.

Phase goal: settle every base-unit and modifier source before the engine and the lock build on them. That means editable RVG, modifier and Procedure masters, one pure resolver, ranged base units unbounded with an office flag, and coded ACC pre-op lines, with no demo figure moved.
