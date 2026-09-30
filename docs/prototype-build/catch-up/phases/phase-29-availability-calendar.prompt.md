Please run catch-up Phase 29 (Availability calendar and status master) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the phase list, the sequencing rules (the Schedule track runs strictly 28 to 32, and 29 comes straight after 28's Slot/List split), the demo-trigger and demo-guide rules, and the "Confirm before building" row for 28 and 29 (US-01.5.3 Open; OQ-17, OQ-27).
2. docs/prototype-build/catch-up/phases/phase-29-availability-calendar.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially theme 4, Slot, List and Draft List; theme 12, small parity items; the Uncertainty bullet on OQ-17 and OQ-27; the DM-04 and RV-14 rows), then the EP-01, EP-03 and EP-15 tables. Then docs/prototype-build/catch-up/epics/EP-01.md (US-01.2.1, US-01.2.2, US-01.5.3 and the EP-01 structural note), epics/EP-03.md (US-03.1.4) and epics/EP-15.md (US-15.0.2), plus DM-04 in analysis/domain-model-delta.md and RV-14 in analysis/reverse-check.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-01.2.1.md, US-01.2.2.md, US-01.5.3.md, US-03.1.4.md and US-15.0.2.md;
   - for context, requirements/FT-01.2.md, US-01.2.3.md and US-01.5.4.md;
   - questions/OQ-17.md and OQ-27.md.
   Also read the "Slot, List and Draft List" section of docs/discovery-reference/Updated Requirements/domain-model.md.
5. docs/prototype-build/catch-up/analysis/prototype-map-apps-mobile-web.md (the Availability sections), prototype-map-admin.md, prototype-map-domain.md, prototype-map-store-seed.md, prototype-map-shared.md and prototype-map-shell-demo-pwa.md: the code index for the files you will change.
6. docs/design/Design Language.dc.html (section 02, the six status colours with their hatched and dashed treatments; section 01, teal the only action colour and crimson identity only), docs/design/Mobile Availability.dc.html, docs/design/Web Availability.dc.html, docs/design/Web Dashboard.dc.html (the week strip's AM/PM block pair) and docs/design/Admin Day.dc.html. These are the AUTHORITATIVE visual reference (convention 17). No mockup shows a calendar or the status editor, so extend these patterns.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 10, 12, 13 to 18);
   - the Decisions-log entries this phase supersedes or amends: 2026-07-21 "Status colour mapping" (a closed six-key set), 2026-07-23 "Availability reconciliation, both directions" (the un-block direction), convention 10 (the legend defined once as a union), and item (2) of the 2026-07-22 external plan review (availability writes a master);
   - the Phase 06 advisory-conflict reading (amber, never a hard block) and the 2026-07-23 mobile navigation entry (the SlideStack pattern);
   - the catch-up Phase 14, 17 and 28 entries, for the trigger registry, the Master data ?view= param, the apps/admin/screens/masters/ split and sheet pattern (if 17 is not DONE, follow the phase doc's fallback), and the Slot model's actual names. If the 28 entry is thin on names, read work items 2, 3 and 9 of docs/prototype-build/catch-up/phases/phase-28-slot-list-split.md.

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered catalogue files, OQ-17, OQ-27 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- check OQ-27: if it is answered Model B, stop and raise it with me before planning;
- confirm Phase 28 is DONE, and note the names it chose (Slot type and collection, Slot.availability and its values, List.kind, the DisplayStatusKey union and displayStatusKey / isOpenSlot in domain/slots.ts, store/slotActions.ts, the golden canvas fixture, what became of masters.availability, and whether it already stopped the false conflict);
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into two session-sized steps (session 1 is items 1 to 8 and stops green), and wait for my approval.

While working:
- Mock backend only. Every write goes through a store action and the audited mutate(), with before/after metas and demo-clock timestamps. Components never own domain state. setAvailabilityRange is one mutate(), all or nothing on refusal, with one range audit entry plus one entry per List affected.
- The status set becomes master data (masters.slotStatuses). The only closed set left is the palette: the six Design Language status tokens in src/theme/statusColours.ts, with the same hexes. No new hex anywhere. The hatched and dashed treatments generalise with tokens only, and today's exact strings must still come out for the seeded statuses.
- No literal status keys outside src/domain/slotStatus.ts and the seed. Finders, filters, counts and conflicts use isOpenForBooking, isEmergencyOnly and isClosed.
- Availability is reconciled against the List, never merged into it. A bookable status on a Slot with a List raises no conflict and clears that List's availability conflict. A closed status flags the List once, replacing rather than stacking. The List's surgeon, hospital, Bookings, times and booking type are never touched.
- One key space, no remap: a status key is exactly the value stored on Slot.availability or List.kind (28's available, unavailable, holiday; private, public, preop), and 28's displayStatusKey returns it unchanged (its available-to-free mapping goes). No seeded data is rewritten. Add "emergency" as a seventh (green free token, solid treatment) and relabel the holiday chip "On leave". Both are provisional under OQ-17, so show the hint in the Admin Slot statuses header.
- 28's store refusals read the helpers: assignListToSlot and moveListToSlot refuse only isClosed Slots (the office may use an emergency Slot), invalidKind checks active booking-scope statuses, requestCover's notFree reads isOpenSlot over isOpenForBooking.
- OQ-27 interim: build the calendar over Slot availability, with the one-line provisional caption under both calendars.
- Determinism: the only canvas change is the two seeded emergency Slots (for example Hughes, Tue 28 Jul AM and PM; not a Monday, where his Permanent List projects a List), applied as a post-generation setSlot fixup, not a SEED_LEAVE window. Confirm both are empty in 28's golden fixture first, then regenerate the fixture and show the diff is exactly those two Slots. Do not touch Tue 21, Wed 22, Thu 23 or any Souter Slot. Bump PERSIST_VERSION by one.
- Parity: one shared AvailabilityForm and one store action for mobile and web.
  - Mobile is mobile-first: a slide-in calendar layer on an availability/* splat route (change both src/router.tsx and pwa/main.tsx), a bottom sheet, chips and segmented controls.
  - Web is a real desktop layout at /web/availability/mine, with a right-rail form and click then shift-click range selection.
  - Keep the "My availability" card title on the mobile Find cover screen (mobile-insets.spec.ts uses it), the "Availability view" group with "Free only" (mobile-interactions.spec.ts), and Find cover at the bare /mobile/availability and /web/availability paths (pwa-device.spec.ts, routing.spec.ts).
- No demo triggers in this phase (it is all normal use). Add nothing to the Control Panel.
- Design: teal the only action colour; crimson never a status, swatch or control; every chip and block carries its label; admin sheets through useSurface().Overlay. No en or em dashes in any app copy, and the status validator rejects them in admin-entered labels too.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for slotStatus.ts (validator, helpers, seed coverage), the token parity test that replaces statusKeyParity.test.ts (and update domainPurity.test.ts's RELATIVE_BRIDGE_FILES to its new name), the range action (reconciliation cases, refusals, audit, determinism), the master actions, StatusChip rendering, describeAvailabilityOutcome and the seed invariants.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green, and that pwaPurity.test.ts still passes;
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result (OQ-17 and OQ-27 status and the branch built), the PERSIST_VERSION from/to, the tests added and the review pass;
  - the Decisions-log entries listed in the phase doc (the status master amending convention 10, the superseded un-block ruling, the emergency and "On leave" readings, the OQ-27 interim, retire-not-delete, and the one availability store);
  - the handoff notes for 30, 31, 32, 38, 42 and 44;
- patch the demo guide in the same session:
  - 03-demo-script.md: S2 Beat 1's legend line, the optional leave moment, the discovery points and the Direct URLs;
  - the cheat sheet, the workflows note and the personas lines;
  - the same sections of master-demo-guide.html, word for word;
- give me short, clear notes on what changed and anything left open.

Phase goal: anaesthetists set their half-day availability weeks ahead from a calendar on mobile and web, including leave ranges and "available for emergency", with no false conflicts. The Slot status set becomes editable master data, coloured from the design's six tokens, that every app reads.
