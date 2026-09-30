Please run catch-up Phase 31 (Draft Lists and the day dashboard) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md. Read these parts:
   - the phase list and the sequencing rules (the Schedule track runs strictly 28 to 32; 31 and 32 reuse 17's blacklist helper; Intake 33 to 35 runs after 31 because a hospital row can create a Draft List);
   - the demo-trigger, PWA-parity and demo-guide rules;
   - the "Confirm before building" row for 31 (FT-01.3 Verify, OQ-44).
2. docs/prototype-build/catch-up/phases/phase-31-draft-lists.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic". Look especially at:
   - theme 4 (Slot, List and Draft List);
   - the DM-03 row;
   - "Demo impact" for S2;
   - the Schedule cluster under "Demo-trigger buttons";
   - OQ-44 under "Uncertainty".
   Then read the EP-01 table and the US-13.1.1 row of the EP-13 table. Then read these:
   - docs/prototype-build/catch-up/epics/EP-01.md: the header note, and the FT-01.6, US-01.6.1, US-01.6.2, US-01.6.3, US-01.3.1, FT-01.3 and EP-01 sections;
   - the US-13.1.1 section of epics/EP-13.md;
   - DM-02 and DM-03 in docs/prototype-build/catch-up/analysis/domain-model-delta.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/FT-01.6.md, US-01.6.1.md, US-01.6.2.md, US-01.6.3.md, US-13.1.1.md, US-01.3.1.md, FT-01.3.md and EP-01.md;
   - for context: requirements/US-01.3.5.md (its "Both paths" criterion is checked here), US-01.3.3.md, US-01.4.2.md, US-01.5.2.md and US-02.1.2.md;
   - questions/OQ-44.md and OQ-43.md.
   Also read the "Slot, List and Draft List" section of docs/discovery-reference/Updated Requirements/domain-model.md.
5. The code index for the files you will change, in docs/prototype-build/catch-up/analysis/:
   - prototype-map-admin.md (routes and nav, shell derivations, Day view, List flows);
   - prototype-map-store-seed.md;
   - prototype-map-apps-mobile-web.md (the "AA rooms" fallbacks);
   - prototype-map-shared.md;
   - prototype-map-shell-demo-pwa.md.
   Then read the handoff notes for 31 in the phase docs for 17, 28, 29 and 30 (30's asks you to decide how a Draft List at a closed hospital shows), and the Draft List refusal in phase-32-swap-requests.md.
6. These design files are the AUTHORITATIVE visual reference (convention 17):
   - docs/design/Design Language.dc.html: the warning tint and on-tint, status as pills, micro caps, Spline Sans Mono with tabular-nums, radii, sheet motion, and the amber nav badge tone;
   - docs/design/Admin Day.dc.html: the grid block anatomy, drawer, header summary and side nav. It still shows the Fitzgerald "surgeon TBC" block; the catalogue rule wins;
   - docs/design/Admin Review.dc.html: the table rhythm for the Draft Lists view.
   A Draft List never uses one of the six status colours.
7. docs/prototype-build/PROGRESS.md. Read these parts:
   - the binding conventions (especially 4 to 7, 10, 13 to 18);
   - the Decisions-log entries this phase supersedes: 2026-07-23 "PermanentList type gains hospitalId: HospitalId | null" (the pre-op clinic with no hospital), and the Phase 02 and 06 "surgeon TBC" design state (Fitzgerald Tue 21 PM with the amber "Surgeon not yet assigned" flag);
   - Phase 28's interim "pre-op Lists come only from Permanent Lists";
   - the catch-up entries for 14, 15, 17, 20, 28, 29 and 30. Use them for the names they actually built: the registry and OFFICE_SIMULATION_ACTOR (store/demoActors.ts; some plans call it SIMULATED_OFFICE_ACTOR, use the name the code has), the Booking names, the blacklist helper and SurgeonSelect, the default-Contract resolver, placeListOnSlot and the Slot views, the Slot status helpers, Phase 28's PWA stand-in assignNextFreeSlotAsSimulatedOffice, and the conflict path (Phase 30 reconciles conflicts inside mutate(), in store/conflictReconcile.ts).

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered and context catalogue files, OQ-44, OQ-43 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- if OQ-44 is still open, build the interim and label it provisional. The interim is:
  - hospital, day and session are required; the surgeon is optional until assignment;
  - a Draft List holds no Bookings and is office only;
  - it is closed with a reason when a request dies.
- tell me about the pre-op and acute pairing reading, and ask about emergency-only Slots. The pre-op and acute reading has two parts:
  - AA rooms becomes a location record;
  - pre-op and public Lists (acute theatre and the "Elective ortho" templates) name a surgeon.
- confirm Phases 17, 28, 29 and 30 are DONE and note their actual names;
- note the current PERSIST_VERSION.
Then enter plan mode and turn the work items into session-sized steps:
- session 1: the model, the pairing rule, the seed and the store, with every reader re-pointed, ending green;
- session 2: the Admin screens, the Day dashboard, the triggers, the PWA stand-in and the docs.
Wait for my approval.

While working:
- Mock backend only. Every write goes through a store action and the audited mutate(), with before and after metas and timestamps from the demo clock. Components never own domain state. The writes are create, edit, assign and close for Draft Lists, plus the pairing refusals.
- A Draft List has no anaesthetist, takes no Slot and holds no Bookings. createDraftList must leave schedule.slots and schedule.lists untouched; prove it with a test. Only assignDraftList creates a List, through Phase 28's placeListOnSlot, in the Slot the draft's day and session fix, in one commit with draftList.assign and list.create metas. The Draft List record is kept as assigned, with assignedListId, and the List carries draftListId.
- Warn, never block, except for the real guards:
  - An unavailable, on-leave, emergency-only or blacklisted choice is selectable, warned before save, and assigned. A closed Slot gets a conflict through Phase 30's path, and a blacklisted pairing gets 17's acknowledgement entry.
  - Only these refuse: an occupied Slot, a missing hospital or surgeon, a passed day, and the office-only guard.
  - A Draft List at a hospital with a holiday shows a derived "Hospital closed that day" warning. It is not a conflict and not on the Conflicts screen; the new List gets the holiday conflict on assignment.
- One pairing rule. It lives in the pure pairingIssues helper, and every write path calls it. List.hospitalId and List.surgeonId become required. The seed changes are:
  - the Fitzgerald Tue 21 PM "Surgeon TBC" List becomes the seeded St George's Draft List, and her Slot is left empty;
  - the pre-op Lists sit at the new AA rooms location;
  - every pre-op and public List (all 16 null-surgeon templates plus the RNG acute branch) names a surgeon outside every Contract scope and the active blacklist;
  - every backdrop List gets a hospital.
  Remove every "AA rooms", "Unassigned", "Not assigned" and "Surgeon TBC" fallback.
- Determinism first:
  - The acute surgeon comes from its own slotRng stream, so the fill stream and every Booking are unchanged.
  - Regenerate Phase 28's golden fixture, and show that the diff contains only the stated changes.
  - No fee, invoice or Contract resolution may move. AA rooms still reaches RVG Default Post-paid, through Phase 20's pure defaultContractForBooking keyed on the location type, with its test updated.
  - Canned request days derive from the clock.
  - Bump PERSIST_VERSION by one and extend the migrate test.
- Time waiting comes from the demo clock through one helper. It moves with every clock change and freezes at assignment or close.
- Vocabulary: "Draft List" and "Being prepared" appear on every Draft List surface. The approval state DRAFT still reads "Open". Draft List status values are preparing, assigned and closed, never DRAFT or open.
- The Day dashboard gains a Draft Lists band above the rows, a booking count on every List block (cancelled Bookings excluded), and "N Draft Lists" in the header summary. The Admin nav gains Draft Lists with an amber count badge.
- Demo triggers go in the shared registry, with bodies in src/store. Nothing is added to the Control Panel page. There are three:
  - "Simulate incoming request" on Admin Draft Lists (bar);
  - "Add Draft List for this day" on Admin Day (bar);
  - "Office assigns a Draft List to me" on Mobile Lists (PWA only, badged as an office stand-in). It picks the oldest fitting Draft List, or logs one for the persona's next open Slot (reusing Phase 28's Slot scan), and it never mentions the blacklist (OQ-43). Phase 28's "Office assigns a List to my next free Slot" stays beside it.
- Draft Lists never reach the mobile, web or PWA UI. The blacklist stays Admin only.
- Design:
  - the band and pills use the warning tint, never a status colour;
  - teal is the only action colour, and crimson is unused;
  - Admin sheets go through useSurface().Overlay;
  - no en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for these:
  - the pairing and Draft List domain rules, and the waiting label;
  - every store action's refusals, audit and "takes no Slot";
  - the soft-warning paths;
  - the seed invariants;
  - the demo bodies and the stand-in;
  - the assign sheet and the day grid.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green;
- run the adversarial review-and-fix pass. This is convention 18:
  - fan out three Opus review subagents, for quality, bugs and plan adherence, steered by the phase doc's bullets;
  - independently verify each finding;
  - fix the confirmed ones and re-green.
- update PROGRESS.md:
  - the status row and a phase entry. Include the drift-check result, the owner's answers, the name map for later phases, the PERSIST_VERSION from and to, the golden-fixture diff summary, the tests added and the review pass;
  - the Decisions-log entries listed in the phase doc: three superseded, plus the new and provisional rulings;
  - the handoff notes for 32, 33, 34, 35, 42, 43 and 44;
- patch the demo guide in the same session. That covers:
  - in 03-demo-script.md: the S2 time, Beat 1, the new lettered Beat 1b and the discovery points;
  - workflows 1 and 2 and "The two kinds of state" in 02-workflows-and-handoffs.md;
  - the cheat sheet;
  - the same sections of master-demo-guide.html;
  - the Control Panel S2 scenario text;
- give me short, clear notes on what changed and anything left open.

Phase goal: requests that arrive before an anaesthetist is found become Draft Lists. Each has a hospital, surgeon, day, session and note, with no anaesthetist and no Slot. They are flagged "Being prepared" with their waiting time, on their own Admin view, on the Day dashboard and on a nav badge, and they are assigned into a free Slot with soft warnings and a full audit. Every assigned List has exactly one hospital and one surgeon, and the Day dashboard shows each block's booking count.
