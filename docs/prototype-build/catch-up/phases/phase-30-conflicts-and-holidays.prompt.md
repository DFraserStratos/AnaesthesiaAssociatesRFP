Please run catch-up Phase 30 (Conflicts, holidays and the conflict dashboard) of the Anaesthesia Associates prototype. The repo root is /Users/d.fraser/Local Dev/Anaesthesia Associates RFP (paths below are relative to it; folder names contain spaces, so quote them). The app is aa-prototype/.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the phase list, the sequencing rules (the Schedule track runs strictly 28 to 32; 30 comes after 29 and before 31), and the demo-trigger and demo-guide rules.
2. docs/prototype-build/catch-up/phases/phase-30-conflicts-and-holidays.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially theme 4, Slot, List and Draft List, and the "Schedule: Simulate sickness" demo-trigger line), then the EP-01 table. Then docs/prototype-build/catch-up/epics/EP-01.md (FT-01.5, US-01.5.1, US-01.5.2, US-01.5.4 and US-01.3.2), plus DM-04 and DM-32 in analysis/domain-model-delta.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/FT-01.5.md, US-01.5.1.md, US-01.5.2.md (Confirmed), US-01.5.4.md and US-01.3.2.md;
   - for context, requirements/US-01.5.3.md, US-01.4.1.md and FT-01.3.md;
   - questions/OQ-09.md (answered: soft warning), OQ-17.md and OQ-27.md.
   Also read the "Availability conflicts" row of the changes table and the "Slot, List and Draft List" section of docs/discovery-reference/Updated Requirements/domain-model.md.
5. docs/prototype-build/catch-up/analysis/prototype-map-admin.md (Day grid, List drawer, Master data, flows), prototype-map-store-seed.md (mutate, lifecycle, masters actions, the canvas generator, the seed fixups), prototype-map-domain.md, prototype-map-shared.md and prototype-map-shell-demo-pwa.md (router, side nav, the PWA entry and the Demo actions sheet): the code index for the files you will change.
6. docs/design/Admin Day.dc.html (the day grid block anatomy, the "!" attention badge and the legend), docs/design/Design Language.dc.html (section 02, the status colours and "colour is never the only signal"; the semantic warning trio; section 01, teal the only action colour and crimson identity only), docs/design/Admin Review.dc.html (the Admin table and header pattern for the Conflicts screen) and docs/design/Web Availability.dc.html (the cell anatomy for the hospital calendar). These are the AUTHORITATIVE visual reference (convention 17). No mockup shows a conflict dashboard or a holiday calendar, so extend these patterns.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 10, 13 to 18);
   - the Decisions-log entries this phase supersedes or amends: 2026-07-23 "Availability reconciliation, both directions" (per-path conflict stamping), the 2026-07-23 "Phase 06 admin build" decision (1) (advisory amber border and badge, and the applyPhase06Conflicts seeding) and (6) (the needs-attention flag on the warning token), and the Phase 07 Permanent List reading (edits apply only to future generated days, no retro-regeneration);
   - the catch-up Phase 14, 17, 28 and 29 entries and their handoff notes for 30: the trigger registry, useDemoTriggerContext, store/demoActors.ts (OFFICE_ACTOR, OFFICE_SIMULATION_ACTOR; Phase 28's doc calls the latter SIMULATED_OFFICE_ACTOR, so use the name the code has) and store/officeStandIn.ts, the Master data ?view= param, the Slot model's actual names (assignListToSlot's interim slotNotAvailable refusal, moveListToSlot, placeListOnSlot, generateCanvasForDates, 'adminDay.selectedSlotId'), and 29's slotStatus helpers (isClosed, isOpenForBooking) and setAvailabilityRange.

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered catalogue files, OQ-09, OQ-17, OQ-27 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- check OQ-09: if it is no longer "soft warning", stop and raise it with me before planning;
- confirm Phases 28 and 29 are DONE, note the names they chose, and list every place that writes List.conflicts today;
- record the Lists the seed flags today, so the seed test can prove the flagged set;
- note the conflict audit codes 29 emits (its automatic clear used list.conflictCleared; this phase renames that case list.conflictResolved and keeps list.conflictCleared for the office clear), where Phase 14 put bar-trigger bodies, and whether an actor helper exists for an arbitrary anaesthetist;
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into a plan, and wait for my approval. Do not edit any file before I approve. Plan for two sessions: session 1 is items 1 to 10 plus item 10's minimal consumer switch (every reader of the old ListConflict.message moved to describeConflict) and stops green; session 2 is items 11 to 19. If it genuinely fits in one, say so in the plan.

While working:
- Mock backend only. Every write goes through a store action and the audited mutate(), with before/after metas and demo-clock timestamps. Components never own domain state.
- A conflict is one derived rule: a List conflicts when its hospital is closed on its date or its Slot's status isClosed. The pure rule lives in src/domain/conflicts.ts, and mutate() reconciles every List whose facts a mutation touched. No store action writes List.conflicts itself. Remove every per-path stamp (setAvailability and setAvailabilityRange, addHospitalHoliday, the move filter, the generator, applyPhase06Conflicts).
- Soft warning only (OQ-09). Nothing refuses because of a closure or unavailability: assign, phone advice, Booking create and move, edit and reassign all succeed and flag. Warn inline before confirm and never disable it. 28's slotNotAvailable refusal goes.
- A conflict clears when its clash goes (holiday deleted or moved, hospital changed, Slot marked available, List reassigned to an available anaesthetist) or when the office clears it. An office clear holds only while its cause stands, needs no reason, and can be undone with "Flag again".
- The List changes colour with the design's amber attention treatment (semantic.warning tint and border plus the "!"), keeping the kind's left bar and label. No new status colour and no new hex. Crimson and teal never mark a conflict.
- Permanent List changes project over the canvas from tomorrow to the horizon, and never touch a List with Bookings, a SUBMITTED or AUTHORISED List, or an office-edited List. Weekend templates and end dates work. The projection is pure, with Vitest tests.
- Seed truth: replace the two fabricated Wed 22 conflicts with real facts (Rutherford Wed 22 AM Unavailable, a Southern Cross closure on Wed 22). Keep Tue 21 and every Souter Slot pristine. Regenerate the golden fixture's conflicts column only, and prove the flagged set is otherwise unchanged. Bump PERSIST_VERSION by one.
- Demo triggers: register "Simulate sickness" (bar, Admin Day view and Conflicts) and the PWA-only "Office reassigns this List" stand-in (mobile List detail, office-stand-in badge) in Phase 14's registry, with bodies in src/store (simulateSickness, and reassignAsSimulatedOffice in store/officeStandIn.ts, acting as OFFICE_SIMULATION_ACTOR) so the PWA import closure stays pure. Update the registry test that expected no entries on /admin/day (other phases may have added entries there too; assert inclusion, not exactness). Add nothing to the Control Panel page.
- Design: the Conflicts screen is a real desktop table in the Admin chrome; admin sheets go through useSurface().Overlay; teal the only action colour; every block and chip carries its label. No en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for conflicts.ts, permanentListProjection.ts, the mutate() reconcile (including the every-step invariant test), accept-and-flag, clear and restore, holiday edit and delete, the Permanent List actions, the selectors, the trigger bodies and the seed invariants.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green, and that pwaPurity.test.ts still passes;
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result, the flagged-List set before and after, the PERSIST_VERSION from/to, the tests added and the review pass;
  - the Decisions-log entries listed in the phase doc (derived conflicts reconciled in mutate(), the colour change, "booked List" means any assigned List, clear semantics, accept-and-flag superseding 28's refusal, keep-as-is on reassign, the real Wed 22 facts, Permanent List projection, holiday edit and delete);
  - the handoff notes for 31, 32, 33, 35, 42 and 44;
- patch the demo guide in the same session:
  - 03-demo-script.md: S2 Beat 3 starts on Conflicts, the optional Beat 3a, the discovery points (OQ-09 settled) and the Direct URLs;
  - the cheat sheet section 6, the workflows notes and the personas lines;
  - the same sections of master-demo-guide.html, word for word;
  - the Control Panel's S2 scenario text;
- give me short, clear notes on what changed and anything left open.

Phase goal: every path that puts a List on a closed hospital day or an unavailable Slot raises a soft conflict that turns the List amber and clears when the clash goes or the office clears it; hospital holidays can be edited, deleted and seen on a calendar; a new Admin Conflicts screen shows every conflict across dates; and Permanent List edits visibly repopulate the canvas without disturbing booked Lists.
