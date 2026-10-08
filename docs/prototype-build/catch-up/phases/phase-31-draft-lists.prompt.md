Please run catch-up Phase 31 (Draft Lists and the day dashboard) of the Anaesthesia Associates prototype. It is 2 sessions: session 1 is work items 1 to 13 of the phase doc (the model and the DRAFT state, the pairing rule, the seed, the store and the recurring clash, with every reader re-pointed), ending green and demoable; session 2 is items 14 to 25 (the Admin screens, the right-rail card and Day dashboard, the triggers, the PWA stand-in and the docs). If this is session 2, read the PROGRESS entry session 1 left and carry on from it.

The repo root is /Users/d.fraser/Local Dev/Anaesthesia Associates RFP (folder names contain spaces, so quote paths). The app is aa-prototype/. Paths below are relative to the repo root.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md. Read these parts:
   - the owner-decisions table: D14 (OQ-64 answered, with OQ-81 parts 1 and 2 settled in the room, and the List states DRAFT, ACTIVE, SUBMITTED, AUTHORISED), D20 (the honour system: no prepayment re-check on a move), D36 (OQ-102's names), D44 (OQ-43 answered: private two-way preferences, an admin warning only) and D46 (OQ-86 answered no: anaesthetists never browse or pull Draft Lists), plus the open-questions working rule;
   - the phase list and the sequencing rules (the Schedule track runs strictly 28 to 32a; 15b renamed the old DRAFT to ACTIVE and 31 adds DRAFT for Draft Lists; 31 and 32 reuse 17's preference and tier helper; 32 needs 31 because a List returned to the office goes back to DRAFT; Intake 33 to 35 runs after 31);
   - the vocabulary rule ("slot" never reaches app copy, say session, AM or PM; "Draft List" is kept; never "DRAFT" or "Open" for an assigned List; "Not preferred" and "Preferred", never "blacklist");
   - the demo-trigger, PWA-parity, demo-guide and Catalogue screenshots rules;
   - the "Confirm before building" row for 28 to 31 (US-01.3.2 and US-01.5.2 Verify; OQ-81) and the 2026-10-08 placement note for 31 (it takes DM-52, EP-07 and FT-07.1).
2. docs/prototype-build/catch-up/phases/phase-31-draft-lists.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic". Look especially at:
   - theme 1 (Schedule rebuilt on Slot, List and Draft List);
   - the DM-03 and DM-52 rows and their notes under "Structural changes";
   - "Demo impact" for S2;
   - "Intake and drafts" under "Demo-trigger buttons";
   - OQ-81 under "Uncertainty".
   Then read the EP-01 and EP-07 tables and the US-13.1.1 row of the EP-13 table. Then read these:
   - docs/prototype-build/catch-up/epics/EP-01.md: the header note, and the FT-01.6, US-01.6.1 to US-01.6.4, US-01.3.1, FT-01.3, US-01.3.2, US-01.5.2, US-01.5.4, US-01.5.5 and EP-01 sections;
   - docs/prototype-build/catch-up/epics/EP-07.md: the EP-07 and FT-07.1 sections;
   - the US-13.1.1 section of epics/EP-13.md;
   - DM-02, DM-03, DM-04, DM-52 and DM-54 in docs/prototype-build/catch-up/analysis/domain-model-delta.md.
4. The catalogue files this phase covers, in requirements-board/requirements/:
   - stories/EP-07.md, FT-07.1.md, FT-01.6.md, US-01.6.1.md, US-01.6.2.md, US-01.6.3.md, US-01.6.4.md, US-13.1.1.md, US-01.3.1.md, FT-01.3.md and EP-01.md;
   - the recurring-clash criteria closed here: stories/US-01.3.2.md (AC2), US-01.5.2.md (AC3), US-01.5.4.md (AC3) and US-01.1.1.md (its last paragraph); and the Draft List path of US-01.3.5.md ("Every office path") and US-01.3.6.md (tier order), both built on Phase 17's helper;
   - for context: stories/US-01.5.5.md and US-01.4.3.md (Phase 32's return-or-assign and move to the office, which land here as Draft Lists), US-01.4.5.md (no preference warning on an anaesthetist's own move), US-01.4.7.md (its "the office does not assign work to someone marked unavailable without them knowing"), US-01.5.3.md, US-01.3.3.md, US-01.4.2.md, US-02.1.2.md (a matching row can create a Draft List), US-06.3.5.md and US-06.5.4.md (no prepayment calculation re-triggered by a move);
   - questions/OQ-44.md, OQ-64.md, OQ-86.md (answered no) and OQ-43.md (Answered), OQ-27.md and OQ-17.md (Answered), OQ-81.md (Open: parts 1 and 2 settled in the room, part 3 open), OQ-84.md and OQ-102.md (Open);
   - artifacts/AR-22.md (the Booking and List lifecycle; its draft, draft-arises, draft-flagged, draft-removed, draft-assigned, active and active-list regions).
   Also read the "Slot, List and Draft List" section and the List state bullet of requirements-board/requirements/domain-model.md. To see why an item says what it says, run npm --prefix requirements-board run source -- --item <ID> --text and read only the cited passages (needs Node 22.18 or newer on PATH).
5. The code index for the files you will change, in docs/prototype-build/catch-up/analysis/:
   - prototype-map-admin.md (routes and nav, shell derivations, Day view and right rail, List flows);
   - prototype-map-store-seed.md;
   - prototype-map-apps-mobile-web.md (the "AA rooms" fallbacks);
   - prototype-map-shared.md;
   - prototype-map-shell-demo-pwa.md.
   Then read the handoff notes for 31 in the phase docs for 15a (the To-do rail card, directly under the calendar, with room left below it), 15b (the rename to ACTIVE and LIST_STATE_LABELS, to which you add DRAFT), 17 (rankAnaesthetistCandidates, notPreferredWarning, notPreferredEntryIds, AnaesthetistCandidates, NotPreferredWarning, useNotPreferredWarning, SurgeonPicker, suggestionSeq, list.pairingAcknowledged and the officePrivacy.test.ts boundary), 27 (its prepayment routine, which re-checks only on a change of Procedures, Contract or payer, never on a move), 28 (the generator's clashes), 29 (there is no emergency-only status; seriesCalendarFor paints series before recurring bookings) and 30 (its recurring-booking projection and the `skipped` sessions this phase turns into Draft Lists; how a Draft List at a closed hospital shows on Conflicts; where 30's handoff still asks for the unavailability conversion, D14 has superseded it), and what phase-32-swap-requests.md and phase-33-hospital-matching-screen.md expect from this phase (detachListToDraft for the move to the office and the return from an unavailable session; createDraftList from a hospital row).
6. These design files are the AUTHORITATIVE visual reference (convention 17):
   - docs/design/Design Language.dc.html: the warning tint and on-tint, status as pills, micro caps, Spline Sans Mono with tabular-nums, radii, sheet motion, and the amber nav badge tone;
   - docs/design/Admin Day.dc.html: the grid block anatomy, the right-rail card anatomy, drawer, header summary and side nav. It still shows the Fitzgerald "surgeon TBC" block; the catalogue rule wins;
   - docs/design/Admin Review.dc.html: the table rhythm for the Draft Lists page.
   A Draft List never uses one of the six status colours.
7. docs/prototype-build/PROGRESS.md. Read these parts:
   - the binding conventions (especially 4 to 7, 10, 13 to 19);
   - the Decisions-log entries this phase supersedes: 2026-07-23 "PermanentList type gains hospitalId: HospitalId | null" (the pre-op clinic with no hospital), the Phase 02 and 06 "surgeon TBC" design state (Fitzgerald Tue 21 PM with the amber "Surgeon not yet assigned" flag), Phase 28's interim "pre-op Lists come only from recurring bookings", and the generator's silent drop of a recurring booking under an unavailable session (traced as clashes and skipped by Phases 28 and 30);
   - the catch-up entries for 14, 15, 15a, 15b, 17, 18, 20, 20a, 21, 27, 28, 29 and 30. Use them for the names they actually built: the registry and OFFICE_SIMULATION_ACTOR (store/demoActors.ts; use the name the code has), the Booking names, the warning routine and To-do card, the ListState union and LIST_STATE_LABELS, Phase 17's helper, pieces, office slice and privacy test, the contract-holder picker and the Contract picker's fitting filter (AA rooms must never be a holder; No contract (RVG) is the one default), the source wording and the payer on the Booking, the prepayment routine (planned syncPrepayment(api, bookingId, cause)) and its setup cause, placeListOnSlot, moveListToSlot, setAvailability and the Slot views, 28's horizon setting, rollCanvasForward and generateCanvasForDates with its clashes, the Slot status helpers (isOpenForBooking, isClosed, isOpenSlot), the calendar's range and series actions and seriesCalendarFor, how 29 holds availability for a day beyond the horizon, Phase 28's PWA stand-in assignNextFreeSlotAsSimulatedOffice and its office availability finder, the conflict path (store/conflictReconcile.ts inside mutate(); conflictRows and the Conflicts screen; simulateSickness), Phase 30's seeded Rutherford Wed 22 AM sickness and Southern Cross Wed 22 closure, and Phase 30's recurring bookings (RecurringBooking, recurringBookings.ts, addRecurringBooking / editRecurringBooking / retireRecurringBooking / applyRecurringBookingsToCanvas, projectRecurringBookingChange / projectAllRecurringBookings with their skipped entries, RecurringBookingSheet, List.recurringBookingId).
8. requirements-board/capture/ATLAS.md (the recipe format, routes, ids and hooks the catalogue's screenshot recipes depend on; it still describes the Fitzgerald "surgeon TBC" block) and the "Catalogue screenshots" rule in ROADMAP.md, plus the phase doc's "Catalogue screenshots" section.

Then do the drift check in the phase doc:
- run node docs/prototype-build/catch-up/tools/plan-state.mjs --diff <IDs> with the phase doc's ID list (baseline 60e2d1e) and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- build the answers, with no provisional labels:
  - EP-07 and FT-07.1 (2026-10-07): a List's states are DRAFT (a Draft List, no anaesthetist, no Slot), ACTIVE (all five of its pairing), SUBMITTED and AUTHORISED; a List set up with its anaesthetist starts ACTIVE; assigning a Draft List makes it ACTIVE; an ACTIVE List going back to the office becomes DRAFT through one detachListToDraft (Phase 32's callers);
  - OQ-44: a Draft List has hospital, surgeon, day and session all required; it may hold Bookings; only the office assigns it; it is removed or re-dated (US-01.6.4);
  - OQ-86 answered no (D46): no Draft List on any anaesthetist surface, ever (the DraftList type's doc comment and a selector test); it is not a default and goes on no review list;
  - OQ-43 answered (D44): the office's picker groups, marks and tier-orders through Phase 17's helper with a soft not-preferred warning; nothing about preferences or tiers reaches an anaesthetist surface;
  - OQ-64 (D14): the name Draft List is kept, "Unassigned" is its flag, and "slot" never appears in app copy. Marking a booked session unavailable offers return or assign: that is Phase 32's, not this phase's. This phase does not convert an anaesthetist's unavailability into Draft Lists and does not touch the availability clash path;
  - OQ-81 part 2 (settled in the room): a recurring booking that lands on a session the anaesthetist has already marked unavailable becomes a Draft List. Confirm part 1 in the code (the anaesthetist's calendar, series included, is painted before recurring bookings);
- OQ-81 part 3 (short-notice sickness) is open: Phase 30's office-recorded sickness stays a conflict, and its seed and "Simulate sickness" are unchanged apart from skipping Draft Lists in its choices. Log it for the review;
- note the pre-op and acute pairing reading for the "For the owner's review" list (AA rooms becomes a location record, never a Contract holder; pre-op and public Lists, acute theatre and the "Elective ortho" recurring bookings, name a surgeon). Phase 29 seeds no emergency-only status and has no isEmergencyOnly, so the assign picker has no emergency group; if such a status exists by now, build it as its own labelled group with a soft warning and no conflict, and log that for the review rather than asking;
- confirm Phases 15b, 17, 28, 29 and 30 are DONE (and 27, 20, 20a and 21 by the roadmap order) and note their actual names; grep src for any List-state 'DRAFT' left with the July meaning before adding the new one;
- note the current PERSIST_VERSION.
Then write a plan that turns the work items into the two sessions' steps, then start building without waiting for my approval (ROADMAP.md "Owner review: agents test themselves").

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any UI (screens, sheets, dialogs, panels, rows, banners, pills, empty and error states), and apply it inside this repo's design system: the docs/design files and src/theme tokens stay authoritative (convention 17, ROADMAP.md "Front-end design"), so use the skill for layout, hierarchy, spacing, states and finish, never for a new palette, typeface or visual language. Store, seed and pure-domain steps do not need it.
- Mock backend only. Every write goes through a store action and the audited mutate(), with before and after metas and timestamps from the demo clock. Components never own domain state. The writes are create, assign, re-date and remove for Draft Lists, the recurring clash, Bookings added to and moved off them through the existing Booking actions, and the pairing refusals.
- The DRAFT state. ListState becomes 'DRAFT' | 'ACTIVE' | 'SUBMITTED' | 'AUTHORISED', and List is a union on it: AssignedList (ACTIVE, SUBMITTED or AUTHORISED, with an anaesthetist and a Slot) and DraftList (DRAFT, no anaesthetist, no Slot, a draft trail). LIST_STATE_LABELS gains DRAFT, shown only on a Draft List beside "Unassigned"; no assigned List reads "DRAFT" or "Open". Only an ACTIVE List can be completed and submitted; submitting or authorising a Draft List refuses with "Assign an anaesthetist first.". A store-wide invariant test holds FT-07.1: every ACTIVE, SUBMITTED or AUTHORISED List has its anaesthetist, Slot, day, session, hospital and surgeon, and every DRAFT List has neither anaesthetist nor Slot.
- A Draft List is a List record, plus a draft trail (origin, source, since, by, and for a recurring clash the day it stands for). There is no separate collection, so its Bookings hang off its List id and assignment keeps the id.
  - createDraftList and the recurring clash write through one insertDraftList and leave schedule.slots and every other List untouched; prove it with a test.
  - Only assignDraftList takes DRAFT to ACTIVE, through attachListToSlot, in the session its day and session fix (the admin chooses only the anaesthetist), in one commit with a draftList.assign meta (before state DRAFT, after ACTIVE); the draft trail is kept with assignedAtISO. 15a's warnings are derived on read (store/warnings.ts), so they need no call, but their rules and OpenWarningRow must tolerate a Booking on a Draft List.
  - An ACTIVE List only becomes a Draft List through detachListToDraft, built and unit-tested here for Phase 32 (origins movedToOffice and unavailableReturn); it refuses a SUBMITTED or AUTHORISED List, and no screen in this phase calls it.
  - removeDraftList soft-removes and refuses while it holds an active Booking; redateDraftList moves it and its Bookings to another day and keeps its waiting time.
  - A Draft List cannot be submitted, authorised or billed, and an anaesthetist cannot add a Booking to one.
  - No projection, roll forward or new-anaesthetist path may overwrite a List id a Draft List holds, and a recurring booking never projects a second List or Draft List for a day it already answered for (the Draft List keeps recurringBookingId, and a recurring clash keeps the day in draft.projectedFor even after a re-date or a removal).
- Prepayment (US-06.3.5, US-06.5.4, D20). A Booking on a Draft List has no anaesthetist, so 27's routine generates and withdraws nothing for it. Built default, logged for the owner: the first assignment of a Booking that never had an anaesthetist is its setup, so assignDraftList runs 27's routine (syncPrepayment) once for it with the listAssigned cause 27's plan exports for this call (use the name 27 shipped); reassigning a List that already had an anaesthetist (one Phase 32 returned), re-dating and detaching re-trigger nothing (honour system; the payee repoint is Phase 41's, D38).
- The recurring clash (OQ-81 part 2, built as the answer): one pure recurringClashDraft turns each clash (Phase 28's generator RecurringClash or Phase 30's skipped entry: a recurring booking covering a closed session) into a DRAFT Draft List with the recurring booking's hospital, surgeon, kind and notes, origin recurringClash and a stable derived id. It runs on every path that yields clashes: addRecurringBooking, editRecurringBooking, applyRecurringBookingsToCanvas ("Apply to canvas now"), every roll forward, the horizon extend, an earlier start date, and the seed's generation. Confirm 29 paints series onto new Slots before recurring bookings (seriesCalendarFor in the generator's calendar step), so no recurring booking is ever left flagged on the anaesthetist; if any path still places and then flags, fix it (work item 9). Never for a past day. It writes no availability conflict and never shows on Conflicts for the anaesthetist (US-01.5.4 AC3); a hospital closure still raises Phase 30's holiday conflict. An edit, retire or move of the recurring booking updates or removes an empty clash Draft List and keeps one with Bookings. Phase 30's sheet wording for skipped sessions now says they go to Draft Lists.
- Phase 17's helper, privately (US-01.3.5, US-01.3.6, D44). The assign picker is draftListAvailability (free, not available, occupied; no preference knowledge) ranked once by 17's rankAnaesthetistCandidates and split into Free, "Not preferred with Ms Reid", Not available and Already has a List (disabled), each tier-ordered and shuffled within a tier (requestKey from the List id and suggestionSeq), with 17's tier filter, Preferred pills and an Everyone / Free only toggle. assignDraftList writes list.pairingAcknowledged (through notPreferredEntryIds) only for a not-preferred pairing. Add store/draftListActions.ts to the allowlist in 17's officePrivacy.test.ts as an office write path; it must not import store/officePrivate.ts, so the PWA closure check stays green. The PWA stand-in skips a not-preferred pairing through draftListFitsAnaesthetist, a boolean, and never names a preference or a tier. No inline preference checks or sorts anywhere.
- Warn, never block, except for the real guards:
  - A closed session (Unavailable, Holiday or any closed status) or a not-preferred choice is selectable, warned before save, and assigned. A closed session gets a conflict through Phase 30's path and its warning tells the office to check with the anaesthetist (US-01.4.7); a not-preferred pairing gets 17's acknowledgement entry.
  - Only these refuse: an occupied session, a missing hospital, surgeon, day or session, a passed day, removing a Draft List with active Bookings, detaching a List that is not ACTIVE, and the office-only guard.
  - A Draft List at a hospital with a holiday carries Phase 30's holiday conflict like any List, and shows on the Conflicts screen as "Unassigned".
- One pairing rule. It lives in the pure pairingIssues helper (domain/listPairing.ts, never confused with 17's pairingPreferences.ts), and every write path calls it. List.hospitalId and List.surgeonId become required, and List.anaesthetistId and slotId are present exactly on AssignedList. The seed changes are:
  - the Fitzgerald Tue 21 PM "Surgeon TBC" List goes and her session is left empty; the seed gains three request Draft Lists in state DRAFT (St George's with Mr S. Tan; Forte Health with Mr V. Nand holding two Bookings, each Procedure with its source wording, a procedure, a Contract and the patient as payer, on no prepaid set; Christchurch Eye Surgery with Ms A. Reid as the long wait);
  - the seed's generation makes the recurring-clash Draft Lists from today on (12 at plan time: Ngata Tue 21 AM, Beaumont's and Ngatai's leave, Ropata in August, Sharma in September; recompute and pin the count);
  - Phase 30's seeded Rutherford sickness stays exactly as Phase 30 left it;
  - the pre-op Lists sit at the new AA rooms location, which is never a Contract holder;
  - every pre-op and public List (all 16 null-surgeon recurring bookings plus the RNG acute branch) names a surgeon who holds no Contract, sits in no holder group and has no active pairing preference;
  - every backdrop List gets a hospital.
  Remove every "AA rooms", "Not assigned" and "Surgeon TBC" fallback, and every "Unassigned" that is not the Draft List flag.
- Determinism first:
  - The acute surgeon comes from its own slotRng stream, so the fill stream and every Booking are unchanged.
  - Regenerate Phase 28's golden fixture, and show that the diff contains only the stated changes.
  - No fee, invoice or Contract resolution may move. A pre-op Booking's Contract is held on its Procedure (Phase 20), and its picker's candidates are unchanged at AA rooms (no hospital-holder Contract fits there); update Phase 20's picker test. The new seeded Bookings touch no existing figure.
  - Seed timestamps are constants; canned request days and the staged clash day derive from the clock.
  - Bump PERSIST_VERSION by one and extend the migrate test.
- Time waiting comes from the demo clock through one helper. It moves with every clock change, freezes at assignment or removal, and survives a date change.
- Order: every Draft List view sorts through one compareDraftLists, ascending date (US-01.6.2, soonest first), then AM before PM, then the longer wait, then id.
- Vocabulary: every Draft List word ("Draft List", "Unassigned", "DRAFT", the origin labels) comes from shared/scheduleTerms.ts, every pairing and tier word from 17's PAIRING_LABELS and TIER_LABELS; "Unassigned" flags every Draft List surface; no new app copy says "slot", "blacklist" or "whitelist".
- The Day dashboard gains a Draft Lists card in the right rail (under 15a's To-do card, designed with it, leaving the place Phase 32's notification pool takes), a Draft Lists band above the grid rows for the viewed day, a booking count on every List block (cancelled Bookings excluded), and "N Draft Lists" in the header summary. The Admin nav gains a Draft Lists page (the one date-sorted place) with an amber count badge. The List drawer gains an unassigned mode (the DRAFT chip and "Unassigned") with "Available that session" (free, clear anaesthetists in tier order, US-01.6.3), the Bookings section, Add Booking, Assign, Edit, Change date, Remove and History; after assignment it shows ACTIVE.
- Demo triggers go in the shared registry, with bodies in src/store. Nothing is added to the Control Panel page. They are:
  - "Simulate incoming request" on Admin Draft Lists (bar; default Christchurch Eye Surgery · Ms A. Reid · next Thu PM, so Dr Sharma shows in the not-preferred group);
  - "Add Draft List for this day" on Admin Day (bar);
  - "Stage recurring clash" on Admin Master data, Recurring bookings (bar): marks the recurring booking's anaesthetist unavailable on its first unpainted day, and the clock's Next day then paints it as a Draft List;
  - Phase 30's "Simulate sickness", unchanged except that its choices skip Draft Lists;
  - "Office assigns a Draft List to me" on Mobile Lists (PWA only, badged as an office stand-in, the PWA parity for the office's assignment). It assigns, through assignDraftList as OFFICE_SIMULATION_ACTOR, the waiting request on the persona's soonest open session that fits them, in compareDraftLists order, or logs one for their next open session (reusing Phase 28's session scan), and it never mentions a preference, a tier, the words "Draft List" or "slot". Phase 28's stand-in stays beside it.
  Adding a recurring booking for an anaesthetist on leave, Add Booking, Assign, Change date and Remove are product actions, not triggers.
- Draft Lists never reach the mobile, web or PWA UI. Preferences and tiers stay Admin only. This phase adds no anaesthetist-facing copy.
- Design:
  - the band, rail card and pills use the warning tint, never a status colour, so a Draft List never looks like an active List;
  - teal is the only action colour, and crimson is unused;
  - Admin sheets go through useSurface().Overlay;
  - no en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for these:
  - the pairing, lifecycle and Draft List domain rules, compareDraftLists, draftListAvailability, recurringClashDraft and the waiting label;
  - every store action's refusals, audit and "takes no Slot", the DRAFT to ACTIVE and ACTIVE to DRAFT transitions, Bookings on a Draft List, the prepayment default, and the projection guard;
  - the store-wide lifecycle and pairing invariant after a sweep of actions;
  - the recurring clash on add, edit, apply, retire and roll forward, its idempotence after a re-date or removal, no availability conflict, and no past day;
  - the soft-warning paths and the not-preferred acknowledgement;
  - the seed invariants (including the pinned set of seeded Draft Lists and Rutherford's untouched conflict);
  - the terms module (no stray literals, no "slot");
  - the privacy test with the new allowlisted file;
  - the demo bodies and the stand-in;
  - the assign sheet (groups, tier order, reshuffle, filter, warning), the drawer's available list and the day grid.
- Do not commit or push.

When done:
- run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye; never hand it to me) and report each item pass or fail with its evidence;
- confirm npm run build, npm run build:pwa, npx vitest run, npm run shots and npm run verify:board are green;
- run the adversarial review-and-fix pass. This is convention 18:
  - fan out three Opus review subagents, for quality, bugs and plan adherence, steered by the phase doc's bullets;
  - independently verify each finding;
  - fix the confirmed ones and re-green.
- run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19): re-run node docs/prototype-build/catch-up/tools/recipe-status.mjs 31, then create or update the capture recipes for the items in the phase doc's Catalogue screenshots section (FT-07.1's DRAFT to ACTIVE shot, FT-01.6, the US-01.6.x absent stubs filled, US-01.3.5's and US-01.3.6's Draft List states, the US-13.1.1 band and counts) and every recipe this phase broke; in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green;
- update PROGRESS.md:
  - the status row and a phase entry. Include the drift-check result against 60e2d1e, the name map for later phases, the seeded Draft Lists, the PERSIST_VERSION from and to, the golden-fixture diff summary, the tests added, the review pass and the catalogue screenshot result (REPORT.md counts before and after);
  - the Decisions-log entries listed in the phase doc: six superseded (including the recurring booking's silent drop, this plan's earlier automatic unavailability conversion and its earlier "a Draft List is derived, never a state" reading), plus the new rulings;
  - the handoff notes for 32, 33, 34, 35, 41, 42, 43, 43a and 44;
- patch the demo guide in the same session. That covers:
  - in 03-demo-script.md: the S2 time, Beat 1 (the Draft Lists card, band and counts), the new lettered Beat 1b (assign St George's with the grouped, tier-ordered picker; it becomes active) and the discovery points (OQ-44, OQ-64 and OQ-86 dropped, OQ-81 part 3 and the pairing reading added); Beat 3 stays as Phases 17 and 30 left it;
  - workflows 1 and 2, the availability workflow (the recurring clash) and "The two kinds of state" (DRAFT, ACTIVE, SUBMITTED, AUTHORISED) in 02-workflows-and-handoffs.md;
  - the cheat sheet (the Draft List noun, terms not to use) and, if it lists office jobs, the personas file;
  - the same sections of master-demo-guide.html;
  - the Control Panel S2 scenario text;
- give me short, clear notes on what changed and anything left open, ending with the "For the owner's review" list (also in the PROGRESS entry).

Phase goal: a List with no anaesthetist is a Draft List, the first state (DRAFT) of a List's lifecycle. Each has a hospital, surgeon, day and session, all required, may already hold Bookings, and takes no Slot. Draft Lists are flagged "Unassigned" with their waiting time and sorted soonest first, beside the day in the right rail, in a band on the Day dashboard, on their own Admin page and on a nav badge. Only the office assigns one, by choosing the anaesthetist from everyone potentially available, grouped and tier-ordered by Phase 17's helper with soft warnings and a full audit, and it becomes ACTIVE; or the office removes it or changes its date. A recurring booking that lands on a session the anaesthetist has already marked unavailable becomes a Draft List. Every List has exactly one hospital and one surgeon, and the Day dashboard shows each block's booking count.
