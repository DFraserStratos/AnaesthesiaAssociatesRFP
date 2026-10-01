Please run catch-up Phase 31 (Draft Lists and the day dashboard) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md. Read these parts:
   - the owner-decisions table and the open-questions working rule (an open question with a recommendation is built as that recommendation, labelled provisional and kept in one place);
   - the phase list and the sequencing rules (the Schedule track runs strictly 28 to 32; 31 and 32 reuse 17's blacklist helper; 32 needs 31 because a List moved to the office becomes a Draft List; Intake 33 to 35 runs after 31);
   - the demo-trigger, PWA-parity, demo-guide and Catalogue screenshots rules;
   - the "Confirm before building" row for 28 to 31 (FT-01.6, US-01.6.1, US-01.6.3, US-01.6.4 and FT-01.3 Verify; OQ-64).
2. docs/prototype-build/catch-up/phases/phase-31-draft-lists.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic". Look especially at:
   - theme 1 (Schedule rebuilt on Slot, List and Draft List);
   - the DM-03 row and its note under "Structural changes";
   - "Demo impact" for S2;
   - "Intake and drafts" under "Demo-trigger buttons";
   - OQ-64 under "Uncertainty".
   Then read the EP-01 table and the US-13.1.1 row of the EP-13 table. Then read these:
   - docs/prototype-build/catch-up/epics/EP-01.md: the header note, and the FT-01.6, US-01.6.1 to US-01.6.4, US-01.3.1, FT-01.3, US-01.5.2, US-01.2.3 and EP-01 sections;
   - the US-13.1.1 section of epics/EP-13.md;
   - DM-02, DM-03 and DM-04 in docs/prototype-build/catch-up/analysis/domain-model-delta.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/FT-01.6.md, US-01.6.1.md, US-01.6.2.md, US-01.6.3.md, US-01.6.4.md, US-13.1.1.md, US-01.3.1.md, FT-01.3.md and EP-01.md;
   - for context: requirements/US-01.5.2.md and US-01.5.3.md (the conflict flag versus Draft List alternative), US-01.5.4.md (its AC1 must keep holding for a List unavailability returns to the office), US-01.3.5.md (its "Both paths" criterion is checked here), US-01.3.3.md, US-01.4.2.md, US-01.4.3.md and US-02.1.2.md;
   - questions/OQ-44.md (Answered), OQ-27.md and OQ-17.md (Answered), OQ-64.md (Open, with a recommendation) and OQ-43.md (Open).
   Also read the "Slot, List and Draft List" section of docs/discovery-reference/Updated Requirements/domain-model.md.
5. The code index for the files you will change, in docs/prototype-build/catch-up/analysis/:
   - prototype-map-admin.md (routes and nav, shell derivations, Day view and right rail, List flows);
   - prototype-map-store-seed.md;
   - prototype-map-apps-mobile-web.md (the "AA rooms" fallbacks and the availability confirm copy);
   - prototype-map-shared.md;
   - prototype-map-shell-demo-pwa.md.
   Then read the handoff notes for 31 in the phase docs for 15a (the To-do rail card), 17, 27 (`syncPrepayment`), 28, 29 (replace `availabilityClash`'s 'flag'; there is no emergency-only status) and 30 (how a Draft List at a closed hospital shows, and where a List returned by unavailability shows for US-01.5.4), and what phase-32-swap-requests.md and phase-33-hospital-matching-screen.md expect from this phase (the move to the office; createDraftList from a hospital row).
6. These design files are the AUTHORITATIVE visual reference (convention 17):
   - docs/design/Design Language.dc.html: the warning tint and on-tint, status as pills, micro caps, Spline Sans Mono with tabular-nums, radii, sheet motion, and the amber nav badge tone;
   - docs/design/Admin Day.dc.html: the grid block anatomy, the right-rail card anatomy, drawer, header summary and side nav. It still shows the Fitzgerald "surgeon TBC" block; the catalogue rule wins;
   - docs/design/Admin Review.dc.html: the table rhythm for the Draft Lists page.
   A Draft List never uses one of the six status colours.
7. docs/prototype-build/PROGRESS.md. Read these parts:
   - the binding conventions (especially 4 to 7, 10, 13 to 18);
   - the Decisions-log entries this phase supersedes: 2026-07-23 "PermanentList type gains hospitalId: HospitalId | null" (the pre-op clinic with no hospital), the Phase 02 and 06 "surgeon TBC" design state (Fitzgerald Tue 21 PM with the amber "Surgeon not yet assigned" flag), Phase 28's interim "pre-op Lists come only from Permanent Lists", and the Phase 06 / 28 / 30 ruling that marking a booked Slot unavailable keeps the List and flags a conflict;
   - the catch-up entries for 14, 15, 15a, 17, 20, 27, 28, 29 and 30. Use them for the names they actually built: the registry and OFFICE_SIMULATION_ACTOR (store/demoActors.ts; some plans call it SIMULATED_OFFICE_ACTOR, use the name the code has), the Booking names, the warning routine and To-do card, the blacklist helper and SurgeonSelect, the default-Contract resolver, the prepayment sync (planned as syncPrepayment(api, bookingId, cause)), placeListOnSlot, moveListToSlot, setAvailability and the Slot views, the Slot status helpers (isOpenForBooking, isClosed, isOpenSlot, availabilityClash) and the calendar's range and series actions (setAvailabilityRange, createAvailabilitySeries), Phase 28's PWA stand-in assignNextFreeSlotAsSimulatedOffice, the conflict path (Phase 30 reconciles conflicts inside mutate(), in store/conflictReconcile.ts; conflictRows and the Conflicts screen; simulateSickness; office-reassigns-list), Phase 30's seeded Rutherford Wed 22 AM sickness, and Phase 30's rename of Permanent Lists to recurring bookings (RecurringBooking, recurringBookings.ts, addRecurringBooking / editRecurringBooking, RecurringBookingSheet, List.recurringBookingId).
8. requirements-board/capture/ATLAS.md (the recipe format, routes, ids and hooks the catalogue's screenshot recipes depend on; line ~310 still describes the Fitzgerald "surgeon TBC" block) and the "Catalogue screenshots" rule in ROADMAP.md, plus the phase doc's "Catalogue screenshots" section.

Then do the drift check in the phase doc:
- run git diff 501b0b8 over the covered and context catalogue files, OQ-44, OQ-64, OQ-27, OQ-17, OQ-43 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- OQ-44 is answered: build the answer, not an interim, and label none of it provisional. A Draft List is a List with no anaesthetist and no Slot; hospital, surgeon, day and session are all required; it may hold Bookings; it is never offered to anaesthetists and only the office assigns it; it is removed or re-dated (US-01.6.4);
- OQ-64 is open with a recommendation: build it, labelled provisional and kept in one place. That means:
  - an anaesthetist marking themselves unavailable while holding open Lists returns those Lists to the office as Draft Lists, behind one rule constant and one decision helper, so Phase 30's conflict flag comes back if the answer flips;
  - every user-facing Draft List word ("Draft List", "Unassigned") lives in one terms module, because the names are not settled. "Being prepared" is gone;
- note the pre-op and acute pairing reading for the "For the owner's review" list. Phase 29 seeds no emergency-only status and has no isEmergencyOnly, so the assign picker has no emergency group; if such a status exists by now, build it as its own labelled group with a soft warning and no conflict, and log that for the review rather than asking. The pre-op and acute reading has two parts:
  - AA rooms becomes a location record;
  - pre-op and public Lists (acute theatre and the "Elective ortho" templates) name a surgeon.
- confirm Phases 17, 28, 29 and 30 are DONE (and whether 27 is) and note their actual names;
- note the current PERSIST_VERSION.
Then write a plan that turns the work items into session-sized steps:
- session 1: the model, the pairing rule, the seed, the store and the unavailability route, with every reader re-pointed, ending green;
- session 2: the Admin screens, the right-rail card and Day dashboard, the triggers, the PWA stand-in and the docs.
Then start building without waiting for my approval (ROADMAP.md "Owner review: agents test themselves").

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any UI (screens, sheets, dialogs, panels, rows, banners, pills, empty and error states), and apply it inside this repo's design system: the docs/design files and src/theme tokens stay authoritative (convention 17, ROADMAP.md "Front-end design"), so use the skill for layout, hierarchy, spacing, states and finish, never for a new palette, typeface or visual language. Store, seed and pure-domain steps do not need it.
- Mock backend only. Every write goes through a store action and the audited mutate(), with before and after metas and timestamps from the demo clock. Components never own domain state. The writes are create, assign, re-date and remove for Draft Lists, Bookings added to and moved off them through the existing Booking actions, the unavailability return, and the pairing refusals.
- A Draft List is a List record with no anaesthetist and no Slot, plus a draft trail (origin, source, since, by). There is no separate collection, so its Bookings hang off its List id and assignment keeps the id.
  - createDraftList must leave schedule.slots and every other List untouched; prove it with a test.
  - Only assignDraftList puts it in a Slot, through attachListToSlot, in the Slot its day and session fix, in one commit with a draftList.assign meta; the draft trail is kept with assignedAtISO. Then Phase 27's syncPrepayment (cause listMoved) and 15a's warning routine run for its Bookings. A Booking on a Draft List has no anaesthetist yet, so syncPrepayment must generate and withdraw nothing for it.
  - A List only becomes a Draft List through detachListToDraft (the unavailability route here; Phase 32's move to the office later).
  - removeDraftList soft-removes and refuses while it holds an active Booking; redateDraftList moves it and its Bookings to another day and keeps its waiting time.
  - A Draft List cannot be submitted, authorised or billed, and an anaesthetist cannot add a Booking to one.
  - No projection, roll-forward or new-anaesthetist path may overwrite a List id a Draft List holds, and a recurring booking never projects a second List for a day whose List was returned to the office (the Draft List keeps its recurringBookingId).
- Warn, never block, except for the real guards:
  - A closed Slot (Unavailable, Holiday or any closed status) or a blacklisted choice is selectable, warned before save, and assigned. A closed Slot gets a conflict through Phase 30's path, and a blacklisted pairing gets 17's acknowledgement entry.
  - Only these refuse: an occupied Slot, a missing hospital, surgeon, day or session, a passed day, removing a Draft List with active Bookings, and the office-only guard.
  - A Draft List at a hospital with a holiday carries Phase 30's holiday conflict like any List, and shows on the Conflicts screen as "Unassigned".
- The unavailability route (provisional, OQ-64): unavailabilityOutcome decides it and UNAVAILABLE_LISTS_BECOME_DRAFT_LISTS switches it. It lives in 29's domain/slotStatus.ts and replaces availabilityClash's 'flag' branch, so there is still one clash rule. Only open (DRAFT), today-or-later Lists convert, on every path that closes a Slot (setAvailability, setAvailabilityRange, createAvailabilitySeries and the series roll forward; Phase 30's Simulate sickness goes through setAvailability, and its choices skip Draft Lists). Submitted Lists keep Phase 30's conflict. The seed follows the same function. With the constant off, every Phase 30 test passes unchanged. US-01.5.4 AC1 still holds: Phase 30's Conflicts screen lists a returned List as a derived "Anaesthetist unavailable" row (Unassigned, was Dr X) until it is assigned or removed. The anaesthetist's confirm and result copy say the List goes back to the office, with a provisional badge, and never say "Draft List".
- One pairing rule. It lives in the pure pairingIssues helper, and every write path calls it. List.hospitalId and List.surgeonId become required, and List.anaesthetistId and slotId become optional (AssignedList and DraftList). The seed changes are:
  - the Fitzgerald Tue 21 PM "Surgeon TBC" List goes and her Slot is left empty; the seed gains three request Draft Lists (St George's with Mr S. Tan, Southern Cross with Ms K. Patel holding two Bookings, Christchurch Eye Surgery as the long wait);
  - Phase 30's seeded sickness (Dr Rutherford's Wed 22 AM Slot Unavailable, his Christchurch Eye Surgery List flagged) goes through the same rule, so that List becomes a Draft List from unavailability, Bookings kept;
  - the pre-op Lists sit at the new AA rooms location;
  - every pre-op and public List (all 16 null-surgeon recurring-booking templates plus the RNG acute branch) names a surgeon outside every Contract scope and the active blacklist;
  - every backdrop List gets a hospital.
  Remove every "AA rooms", "Not assigned" and "Surgeon TBC" fallback, and every "Unassigned" that is not the Draft List flag.
- Determinism first:
  - The acute surgeon comes from its own slotRng stream, so the fill stream and every Booking are unchanged.
  - Regenerate Phase 28's golden fixture, and show that the diff contains only the stated changes.
  - No fee, invoice or Contract resolution may move. AA rooms still reaches RVG Default Post-paid, through Phase 20's pure defaultContractForBooking keyed on the location type, with its test updated. The new seeded Bookings touch no existing figure.
  - Canned request days derive from the clock.
  - Bump PERSIST_VERSION by one and extend the migrate test.
- Time waiting comes from the demo clock through one helper. It moves with every clock change, freezes at assignment or removal, and survives a date change.
- Vocabulary: every Draft List word comes from the terms module; "Unassigned" flags every Draft List surface. The approval state DRAFT still reads "Open". A Draft List is derived from the missing anaesthetist; no status value is DRAFT or open for it.
- The Day dashboard gains a Draft Lists card in the right rail (under the calendar and above 15a's To-do card, designed together with it; record that this moves 15a's provisional placement), a Draft Lists band above the grid rows for the viewed day, a booking count on every List block (cancelled Bookings excluded), and "N Draft Lists" in the header summary. The Admin nav gains a Draft Lists page with an amber count badge. The List drawer gains an unassigned mode with the Bookings section, Add Booking, Assign, Edit, Change date, Remove and History.
- Demo triggers go in the shared registry, with bodies in src/store. Nothing is added to the Control Panel page. They are:
  - "Simulate incoming request" on Admin Draft Lists (bar);
  - "Add Draft List for this day" on Admin Day (bar);
  - Phase 30's "Simulate sickness", re-pointed: on an open List it now returns the List to the office, with its message updated;
  - "Office assigns a Draft List to me" on Mobile Lists (PWA only, badged as an office stand-in). It assigns the waiting request on the persona's soonest open Slot that is not blacklisted with them, or logs one for their next open Slot (reusing Phase 28's Slot scan), and it never mentions the blacklist (OQ-43) or the words "Draft List". Phase 28's "Office assigns a List to my next free Slot" stays beside it.
  Add Booking, Change date and Remove are product actions, not triggers.
- Draft Lists never reach the mobile, web or PWA UI. The blacklist stays Admin only.
- Design:
  - the band, rail card and pills use the warning tint, never a status colour;
  - teal is the only action colour, and crimson is unused;
  - Admin sheets go through useSurface().Overlay;
  - no en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for these:
  - the pairing and Draft List domain rules, unavailabilityOutcome on and off, and the waiting label;
  - every store action's refusals, audit and "takes no Slot", Bookings on a Draft List, and the projection guard;
  - the unavailability route, including series edits, the submitted-List flag and the Conflicts row for a returned List;
  - the soft-warning paths;
  - the seed invariants;
  - the terms module (no stray literals);
  - the demo bodies and the stand-in;
  - the assign sheet and the day grid.
- Do not commit or push.

When done:
- run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye; never hand it to me) and report each item pass or fail with its evidence;
- confirm npm run build, npm run build:pwa, npx vitest run, npm run shots and npm run verify:board are green;
- run the adversarial review-and-fix pass. This is convention 18:
  - fan out three Opus review subagents, for quality, bugs and plan adherence, steered by the phase doc's bullets;
  - independently verify each finding;
  - fix the confirmed ones and re-green.
- run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19): create or update the capture recipes for the items in the phase doc's Catalogue screenshots section and every recipe this phase broke; in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green;
- update PROGRESS.md:
  - the status row and a phase entry. Include the drift-check result, the owner's answers, the name map for later phases, the PERSIST_VERSION from and to, the golden-fixture diff summary, the tests added, the review pass and the catalogue screenshot result (REPORT.md counts before and after);
  - the Decisions-log entries listed in the phase doc: four superseded (one of them provisional, OQ-64), plus the new rulings;
  - the handoff notes for 32, 33, 34, 35, 41, 42, 43, 43a and 44;
- patch the demo guide in the same session. That covers:
  - in 03-demo-script.md: the S2 time, Beat 1, the new lettered Beat 1b, Beat 3 (Rutherford's returned List assigned to Dr Sharma from Conflicts) and the discovery points (OQ-44 dropped, OQ-64 added);
  - workflows 1 and 2, the availability workflow and "The two kinds of state" in 02-workflows-and-handoffs.md;
  - the cheat sheet;
  - the same sections of master-demo-guide.html;
  - the Control Panel S2 scenario text;
- give me short, clear notes on what changed and anything left open, ending with the "For the owner's review" list (also in the PROGRESS entry).

Phase goal: a List with no anaesthetist yet becomes a Draft List. Each has a hospital, surgeon, day and session, all required, may already hold Bookings, and takes no Slot. Draft Lists are flagged "Unassigned" with their waiting time, beside the day in the right rail, in a band on the Day dashboard, on their own Admin page and on a nav badge; only the office assigns one, into a free Slot with soft warnings and a full audit, or removes it or changes its date. Provisionally (OQ-64), an anaesthetist who goes unavailable returns their open Lists to the office as Draft Lists. Every List has exactly one hospital and one surgeon, and the Day dashboard shows each block's booking count.
