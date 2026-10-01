Please run catch-up Phase 19 (RVG, modifier and procedure masters) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner decisions table (D3, answered, applies to this phase), the Contracts track sequencing rules, the "Catalogue screenshots" rule, the placement notes for the 2026-10-01 update, and the open-questions row for 19 (OQ-62).
2. docs/prototype-build/catch-up/phases/phase-19-rvg-and-procedure-masters.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic", then the "EP-05 · RVG master data and fee calculation rules" section and the US-03.3.1 row of the EP-03 section. Then docs/prototype-build/catch-up/epics/EP-05.md (US-05.1.1, 05.1.3, 05.1.5, 05.1.6), docs/prototype-build/catch-up/epics/EP-03.md (US-03.3.1), and docs/prototype-build/catch-up/analysis/domain-model-delta.md (DM-13 and DM-31) and reverse-check.md (RV-04).
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-05.1.1.md, US-05.1.3.md, US-05.1.5.md, US-05.1.6.md and US-03.3.1.md;
   - for context, requirements/US-04.2.2.md, US-04.3.2.md, US-06.1.1.md and US-13.7.1.md;
   - questions/OQ-06.md, OQ-56.md, OQ-62.md, OQ-32.md and OQ-53.md;
   - the "RVG code and modifier master" section and the "Selection" paragraph of ../domain-model.md;
   - notes/2026-10-01-aa-meeting-with-greg.md items 4, 27, 30, 47, 53, 55 and 59.
5. The analysis maps for the code you will change: docs/prototype-build/catch-up/analysis/prototype-map-domain.md (billing maths), prototype-map-shared.md (capture suite), prototype-map-admin.md section 9 (Master data) and prototype-map-store-seed.md.
6. Design: docs/design/Design Language.dc.html (tokens, pills, badges, the warn tint) and Admin Review.dc.html (table anatomy for the Master data tabs). Mobile App.dc.html screen 3 is for the procedure card, the picker sheet and the modifier chips.
7. requirements-board/capture/ATLAS.md (the recipe format, routes, ids and hooks the catalogue's screenshot recipes depend on) and the "Catalogue screenshots" rule in docs/prototype-build/catch-up/ROADMAP.md.
8. docs/prototype-build/PROGRESS.md:
   - the binding conventions;
   - the Decisions log entries this phase supersedes or must honour: 2026-07-22 (modifier table in code, ASA seeding values), 2026-07-23 (modifier semantics, A1 and the Ellison fee), 2026-07-27 (modifier bands), 2026-07-28 (modifier picker shape) and 2026-09-28 (the anaesthetist's Booking shows no calculation);
   - the PROGRESS entries for catch-up Phases 15, 15a, 17 and 18, for what they renamed and built. From 15a: where warning rules live and how one is registered (rule file, WARNING_RULES entry, WarningRuleId, WarningFacts, the appSettings default), the Warning shape (after-procedure timing, mild strength, per-Procedure key), when after-procedure warnings surface and re-raise, and how WARNING_SAMPLES and the pinned sample Bookings (including multiWarning) feed "Raise sample warnings". From 18: ContractScope (procedureTypeIds as string[], its rvgCodes and funding-source arrays), SCOPE_NARROWING_DIMENSIONS, the feeParity.test.ts harness and its __parity__ fixture, and ContractEditSheet's Scope chips.
9. docs/prototype-build/catch-up/phases/phase-18-contract-model.md, its handoff list: "RVG groups in scope" and the procedure scope's type and editor chips are handed to this phase. Also docs/prototype-build/catch-up/phases/phase-15a-warnings-and-to-do-list.md work items 1, 2, 5 and 14 (rule shape, facts, samples).

Then do the drift check in the phase doc:
- Run git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md" for the covered IDs and OQs, re-read anything changed, and drop anything now Retired or Future (noting it for PROGRESS.md).
- D3 (OQ-56) is answered: build it as the answer, with no provisional label.
- Check OQ-62. If still open, build its recommendation (base units on the master procedure list, picked by operation name) with one provisional note on the Master procedure list tab. If it has been answered the other way, stop and ask me before starting the change the gate table describes.
- Check docs/discovery-reference/Data files for Vanessa's standard procedure list and AA's fuller modifier list.

Then enter plan mode: map the phase doc's work items onto the files as Phases 14 to 18 actually left them, split the work into the two sessions the doc describes, and wait for my approval.

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any UI (screens, sheets, dialogs, panels, rows, banners, pills, empty and error states), and apply it inside this repo's design system: the docs/design files and src/theme tokens stay authoritative (convention 17, ROADMAP.md "Front-end design"), so use the skill for layout, hierarchy, spacing, states and finish, never for a new palette, typeface or visual language. Store, seed and pure-domain steps do not need it.
- Baseline first. Commit nothing, but add a phase-19 fixture to Phase 18's fee parity harness (src/domain/billing/feeParity.test.ts), generated from the untouched code before any edit, and never regenerate it with -u. It must come out identical at the end: no S1 to S5 figure moves. Keep the run sheet's figures by remapping, never by re-pricing.
- One base-unit resolver, pure, in src/domain/billing/baseUnits.ts, with this precedence:
  1. the manual override;
  2. the Contract override (a slot only, Phase 23 fills it);
  3. the chosen value on a ranged code;
  4. the master procedure list entry (how the default and hospital Contracts get their base units);
  5. the RVG guide single value.
  It also decides outsideGuide. Both fee-context assemblers (feeContextFor and procedureFee), invoiceBuild, seed/billing.ts, the review flags' naturalBtm and the warning rule feed it the same inputs. Nothing else computes base units.
- D3: any base-unit value is accepted. Remove the stepper clamp and the validator's range refusal, let the value be typed, and register one mild after-procedure warning rule (baseUnitsOutsideGuide) in 15a's routine for an entry outside the code's guide value or range, wired the way 15a requires (rule file, WARNING_RULES entry, WarningRuleId, an optional fact for the masters, an appSettings default). It never blocks save, completion, submit or authorise, and the pristine seed raises none. An unchosen ranged value with no list entry still blocks; a manual override does not waive it, as today (decide that with the override set aside, since the resolver would report it as the source).
- Procedure-first capture: a new shared ProcedurePickerSheet replaces CodePickerSheet on mobile, web, the Admin Booking detail, the manual add form and phone advice. Search by operation name, code or group; filter and group by RVG body heading. Picking goes through one audited pickProcedure action that seeds the code, the link, the chosen value and the operation text (never overwriting typed text). Paths that know only a code link through soleProcedureTypeForCode or stay unlinked. Phase 20 adds the Contract pick after it; do not build it.
- Seed one master procedure list entry per seeded RVG code at its guide value (45030's own entry at 6), a second entry under 45030 at 4 (so two there), one group-mapped entry and one per AA code, and link seeded Procedures by the sole-entry rule in a post-generation pass. Ranged Procedures keep their drawn chosen value; 45030 Procedures stay unlinked.
- The modifier master is store data.
  - modifierUnits, modifierBandOf and toggleModifierCode take the master as a required parameter, and the selection rule is a per-code field.
  - Existing codes keep their exact units and band behaviour, including the PA5 exemption.
  - Add VM1, TTE1, TTE2, PACU1, EAA1, POC1 to POC3, NC1 and NC2, with demo-plausible units and placeholder descriptions. Do not invent clinical meanings. Remove PO1 and PO2.
- NZSA guide values stay read-only; AA sets its own figures on the master procedure list. AA codes are marked AA-sourced, and Add AA code can add the matching list entry. RVG groups are many-to-many AA tags, and body-heading groups are derived from anatomicalSite, never stored.
- Contract scope gains rvgGroups (added to SCOPE_NARROWING_DIMENSIONS), and Phase 18's procedureTypeIds is retyped to ProcedureTypeId[]; both stay empty on every seeded Contract (Phase 20 seeds the first procedure scopes), are edited from ContractEditSheet's Scope chips and are matched by a pure scopeCoversProcedure for Phase 20. No Contract selection change here. A group or entry any scope, list entry or Procedure uses cannot be deleted.
- US-05.5.2 (ACC pre-op codes) and OQ-12 have moved to Phase 39b: build no pre-op codes or lines.
- Demo triggers: add this rule's out-of-range sample to 15a's WARNING_SAMPLES (src/store/warningSamples.ts), so "Raise sample warnings" (bar, Admin Day and Booking detail) stages it on 15a's pinned sample Bookings or the Booking in the URL, through editProcedure as the demo actor, with unstage restoring the seed. The multiWarning Booking then shows two warnings; update 15a's "1 rule registered" message. The out-of-range beat is normal use on mobile and the PWA, so no PWA trigger. No other trigger, and no Control Panel change.
- Mock backend only. Every master write is office-only, goes through mutate() and is audited.
- Determinism: new seed data and links draw nothing from the seeded RNG. Bump PERSIST_VERSION once.
- Billing maths stays pure with Vitest tests for every rule, and pwaPurity stays green.
- Design: teal is the only action colour, crimson is identity only, and source, group and provisional markers are neutral pills. Mobile uses bottom sheets, and the two web apps are desktop layouts. The "More modifiers" disclosure keeps the phone's capture height. The only provisional label is the OQ-62 note.
- No en dashes or em dashes in any app-facing copy; use "to" for ranges.
- Build nothing ahead of the plan: no Contract pick, no Contract override field, no Booking-level split, no prepaid tick list, no spreadsheet loader, no warning settings.
- Keep npm run build, npm run build:pwa and npx vitest run green at the end of each session.

When done:
- Run the manual test checklist and report each item.
- Run npm run build, npm run build:pwa, npx vitest run, npm run shots and npm run verify:board, all green, with the parity fixture unchanged.
- Run the adversarial review-and-fix pass (PROGRESS convention 18): fan out Opus review subagents for quality, bugs/correctness, plan adherence and billing maths, using the phase doc's steer list. Independently verify each finding, fix the confirmed ones with tests, and re-green.
- Run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19): create or update the capture recipes for the items in the phase doc's Catalogue screenshots section (US-05.1.1, US-05.1.3, US-05.1.5, US-05.1.6, US-03.3.1) and every recipe this phase broke (US-03.3.2 and the other capture-picker and modifier-chip recipes); in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green.
- Update PROGRESS.md: status row, phase entry with the review pass, the parity result and the catalogue screenshot result (REPORT.md counts before and after), the Decisions-log entries listed in the phase doc, and the handoff notes for 20, 23, 25, 26, 39b and 42 and the OQ-62 follow-up.
- Patch the demo guide sections the phase doc names (the cheat sheet's fee calculation bullets and item 10, the workflow capture steps 3 and 8, S1 Beat 3's Expected text and the S5 discovery points) and the same sections of master-demo-guide.html.
- Do not commit. Give me short, clear notes on what changed, what is still provisional (OQ-62), and anything you need me to decide.

Phase goal: settle every base-unit and modifier source, and how a procedure is picked, before the Contract picker, the engine and the lock build on them. That means editable RVG, modifier and master procedure list masters, one pure resolver, a procedure-first picker grouped by RVG body heading, and any base-unit value accepted with a mild after-procedure office warning when it is outside the guide, with no demo figure moved.
