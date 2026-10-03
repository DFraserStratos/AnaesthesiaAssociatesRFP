Please run catch-up Phase 32 (Anaesthetist moves their own List, and the notification pool) of the Anaesthesia Associates prototype. The phase files keep their historical name (phase-32-swap-requests); "swap" must not appear in app copy, store names, audit codes or tests, and "slot" must not appear in app copy (say session, AM or PM).

The repo root is /Users/d.fraser/Local Dev/Anaesthesia Associates RFP (folder names contain spaces, so quote paths). The app is aa-prototype/. Paths below are relative to the repo root.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md:
   - owner decisions D7 (no acceptance, no office confirmation), D14 (Slots as status containers, no "slot" in the UI, return-or-assign when a booked session is marked unavailable), D15 (the shared notification pool) and D20 (a moved prepaid Booking keeps its agreed amount) in the decisions table;
   - the phase list;
   - the sequencing rules (the Schedule track runs strictly 28 to 32a; 32 reuses 17's blacklist helper, needs 31 because a List returned to the office becomes a Draft List and 27 because a move re-checks the prepayment, and builds the notification pool 35 reads; 32a extends 32's move helpers to a single Booking);
   - the demo-trigger and PWA-parity rules ("Colleague moves a List into my free session" is named there);
   - the demo-guide rules (the Schedule milestone is after 32a, not 32);
   - the Catalogue screenshots rule;
   - the placement note "32 takes the shared notification pool ... and return-or-assign";
   - the "Confirm before building" row for 32 and 32a (OQ-43, OQ-84, OQ-79).
2. docs/prototype-build/catch-up/phases/phase-32-swap-requests.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic". Pay most attention to theme 2 ("Anaesthetist moves own List, no request"), the CoverRequest and availability-reconciliation lines under "Remove or rework", the OQ-43, OQ-79 and OQ-84 lines, and the DM-05, DM-41, RV-15 and RV-30 rows. Then read the EP-01 and EP-13 tables, docs/prototype-build/catch-up/epics/EP-01.md (US-01.4.3, US-01.4.5, US-01.5.5) and EP-13.md (FT-13.8, US-13.8.1, US-13.8.2), DM-05 and DM-41 in analysis/domain-model-delta.md, and RV-15 and RV-30 in analysis/reverse-check.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-01.4.3.md (two acceptance criteria), US-01.4.5.md, US-01.5.5.md (three), FT-13.8.md, US-13.8.1.md (three) and US-13.8.2.md (two);
   - for context, requirements/FT-01.4.md, US-01.4.1.md, US-01.4.2.md, US-01.4.7.md (Phase 32a's), US-01.5.2.md, US-01.3.5.md, US-13.6.3.md, FT-01.6.md, US-01.6.1.md, US-02.3.3.md, US-06.3.5.md, US-06.5.4.md, FT-13.7.md and US-13.7.2.md;
   - questions/OQ-39.md, OQ-08.md, OQ-64.md, OQ-65.md and OQ-70.md (answered), and OQ-43.md, OQ-79.md, OQ-84.md (open, each with a recommendation), OQ-81.md (part 3 open) and OQ-85.md (Phase 32a's).
   Also read the "Slot, List and Draft List" and "Surgeon, surgeons' room and blacklist" sections, the notification-pool paragraph in the warnings section and the glossary, and the prepayment text on a moved Booking, in docs/discovery-reference/Updated Requirements/domain-model.md. Then read items #5, #6, #10, #18, #35, #43 and #45 of catalogue/notes/2026-10-02-aa-meeting-with-greg.md and items #3, #17, #18, #24, #25, #48, #56, #60, #74 and #76 of catalogue/notes/2026-10-02-aa-requirements-review-with-greg.md.
5. docs/prototype-build/catch-up/analysis/prototype-map-apps-mobile-web.md, prototype-map-admin.md, prototype-map-store-seed.md, prototype-map-shared.md and prototype-map-shell-demo-pwa.md: the code index for the files you will change.
6. The design files, which are the AUTHORITATIVE visual reference (convention 17):
   - docs/design/Mobile Availability.dc.html: the sheet anatomy (tap a free session, the sheet slides up, a message field, a teal action, the completion tick);
   - docs/design/Web Availability.dc.html and docs/design/Web Dashboard.dc.html: the grid, the header button slot and the "Who's free" chips;
   - docs/design/Admin Day.dc.html: the right rail's card anatomy (for the Notifications card) and the drawer attention area;
   - docs/design/Design Language.dc.html: the warning tint and on-tint, the info tint, pills and motions.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 13 to 18);
   - the Decisions-log entry "2026-07-21 New interactions the design added, adopted into scope" (the mobile request-cover flow and the web "Ask to cover" links) and the 2026-07-22/23 availability-reconciliation rulings, which this phase SUPERSEDES;
   - the entries for catch-up Phases 14, 15, 15a, 15b, 17, 27, 28, 29, 30 and 31. From them, take the names actually delivered for:
     - the registry, the PWA sheet and the actors;
     - the To-do card on the Admin Day rail and its selector;
     - the blacklist helper (and the two Phase 17 rulings this phase amends);
     - the prepayment re-check;
     - moveListToSlot, placeListOnSlot and the receive rule;
     - the availability calendar, setAvailability, the range and series actions, the shared per-Slot write helper they pass through, AvailabilitySlotPanel and AvailabilityForm with their interim "flagged on the office's Day view" copy, and the Find cover layers (Phase 29 replaced mobile's Free and Block buttons and setMine with a "Change" button);
     - Phase 30's derived conflict reconcile inside mutate() (29's availabilityClash is gone; an anaesthetist's closed status over her List is still flagged there as an interim until this phase), simulateSickness, and the interim outcome copy "a conflict was flagged for the office";
     - the Draft List model, with its List-to-Draft-List conversion (detachListToDraft and its origins 'movedToOffice' and 'unavailableReturn'), assignDraftList and the Day rail order (calendar, To-do, Draft Lists, then the room left for this phase's pool).
8. requirements-board/capture/ATLAS.md (the recipe format, routes, ids and hooks the catalogue's screenshot recipes depend on) and the "Catalogue screenshots" rule in ROADMAP.md, plus the phase doc's "Catalogue screenshots" section.

Then do the drift check in the phase doc:
- run git diff 3d3a18c over the covered catalogue files, the context files and questions it lists, and domain-model.md;
- adjust the work items if anything changed, map any new acceptance criteria to work items, and drop and log anything now Retired or Future;
- confirm D7 / OQ-39, D15 / OQ-65, D14 / OQ-64 and D20 / OQ-70 are still answered as built (stop and tell me if one was reopened, or if OQ-70 came back "credit and re-prepay"). Note the status of OQ-43, OQ-79 and OQ-84: build each recommendation, labelled provisional in its one place, or its answer as the doc describes;
- confirm Phases 14, 15, 15a, 15b, 17, 27, 28, 29, 30 and 31 are DONE, and read what they left: the names above, the cover marker, and every other place the doc's grep finds;
- note the current PERSIST_VERSION.
Then write a plan that turns the work items into session-sized steps, then start building without waiting for my approval (ROADMAP.md "Owner review: agents test themselves"). Plan for two sessions:
- session 1 ends green at work item 9: types (with the Notification record), helpers, seed tests, the three store actions, the unavailability guard, the pool's writer and selectors, audit labels, and the cover marker retired;
- session 2 does items 10 to 16, then the demo guide, the review pass and PROGRESS.

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any UI (screens, sheets, dialogs, panels, rows, banners, pills, empty and error states), and apply it inside this repo's design system: the docs/design files and src/theme tokens stay authoritative (convention 17, ROADMAP.md "Front-end design"), so use the skill for layout, hierarchy, spacing, states and finish, never for a new palette, typeface or visual language. Store, seed and pure-domain steps do not need it.
- Mock backend only. Every write is a store action through the audited mutate(), with before/after metas and timestamps from the demo clock. Components never own domain state.
- Layering: src/domain imports neither src/store nor src/shared. The move and notification helpers take domain-typed slices and a todayISO, never AppState, and use master-record names, not shared/format.ts.
- Build D7, D14 and D15 as answered, with no provisional hint:
  - moveListToOffice, pushListToSlot and markUnavailableAndMoveList each take effect in one commit;
  - there is no request entity, no pending state, no acceptance and no office confirmation;
  - only the List's owner can move it: a DRAFT List dated today or later, never a Draft List;
  - the office keeps its own Reassign.
- One move, one place:
  - one internal own-move core serves all three actions, and does the move, the list.ownerMove meta and the pool post;
  - a hand-on runs Phase 28's moveListToSlot core. Split out a pure core if it self-commits, and keep the existing reassign tests unchanged. moveListToSlot itself stays office-only. Phase 28 hung 17's blacklist acknowledgement and 27's syncPrepayment on moveListToSlot: the move inherits them, and each happens exactly once per move;
  - a return runs Phase 31's detachListToDraft, the one conversion, keeping hospital, surgeon and Bookings, with origin 'movedToOffice' (a plain return) or 'unavailableReturn' (a return from the unavailable prompt);
  - each move writes exactly one list.ownerMove event (from, to, by, when, route, cause) and no second list.reassign;
  - the receive rule exists once, and pushTargets uses it. A colleague marked not available is never offered.
- Mark unavailable while holding a List (US-01.5.5, RV-30): every anaesthetist control that sets a closed status on a session holding her List opens the move sheet's unavailable mode ("Return to the office" or "Hand on to a colleague"); the store refuses the plain change with holdsList for an anaesthetist actor in 29's shared per-Slot write helper (Phase 30 kept it for this), so setAvailability, the range, the series and the instance edit all refuse, and a List is never left with an anaesthetist who will not be there. A range or series is resolved one List per prompt. The office's sickness entry and hospital closures keep the derived conflict (US-01.5.2, OQ-81 part 3). Remove any "the office notified" copy and the anaesthetist-facing interim lines from Phases 29 and 30 ("flagged on the office's Day view", "a conflict was flagged for the office").
- The vacated session (OQ-84 recommendation): the anaesthetist chooses, Free by default, in VACATED_SESSION_DEFAULT with its provisional hint; the unavailable mode never asks. Status labels and colours come from Phase 29's status master by fixed id, never hard-coded.
- The notification pool (FT-13.8, D15; OQ-79 recommendation):
  - one append-only Notification record per move, with a snapshot of date, session, hospital and surgeon, written inside the move's commit by postNotification alone; nothing updates or deletes one;
  - no per-user, read or actioned state, no badge, no Clear; selectors take no user, so every admin sees the same pool;
  - the Admin Day rail's Notifications card (below 15a's To-do card and 31's Draft Lists card, in the room 31 left) and a Notifications page at /admin/notifications, newest first and paged by NOTIFICATION_POOL_RULE.pageSize, with OQ-79's one provisional caption on the page;
  - notifications never reach 15a's to-do list, and a move writes no Warning;
  - the colleague sees a Moved to you panel and a List detail line, read from the same records.
- Prepayment: every Booking moved by any of the three actions gets Phase 27's re-check (syncPrepayment in its plan; use the name delivered) once after commit, with cause listMoved (Phase 41 keys on it), and so does a Draft List assignment. A sent prepayment keeps its agreed amount (D20); a held one is withdrawn and regenerated by 27's rule. Updating the payable half of a raised pair is Phase 41's.
- The blacklist warns and never blocks:
  - the anaesthetist sees only pairingPromptForAnaesthetist's message (ANAESTHETIST_PAIRING_PROMPT): no reason, no surgeon name, no entry id, no blacklist word;
  - her colleague list is not split into a blacklisted group;
  - going ahead writes Phase 17's list.blacklistAcknowledged once, on the List, also on a hand-on from the unavailable prompt (an assumed reading; log it);
  - this amends two Phase 17 rulings; log that in the Decisions log.
- Out of this phase: moving a single Booking, the doer rule and "Move to the anaesthetist who did it" (Phase 32a, which reuses your helpers); the update email (Phase 35, from the notification).
- Retire the cover marker completely (RV-15):
  - CoverRequest and Slot.coverRequest (List.coverRequest before Phase 28);
  - requestCover and RequestCoverSheet;
  - the ListRow offerCover variant;
  - the web CoverTarget / onCover plumbing (types.ts, outlet.ts, WebApp.tsx, routes.tsx) and the dashboard's myFreeList, offerCover and askCover;
  - the mobile AvailabilityScreen's own cover sheet;
  - the strings "Offer cover", "Cover requested", "Tap to ask", "notified when someone accepts", "when they respond" and "the office notified";
  - their labels, their tests and the two Playwright cover beats.
  Keep the "open for cover" free-Slot notes and fallbacks, which the capture recipes click, and the "Find cover" finder name. Keep the mockup's gesture of tapping a colleague's free cell, but only where the persona has a List in that session.
- Determinism: the pool seeds empty, add no other seed records and do not touch the canvas generator. Hold the scripted-beat Lists and Slots in one SCRIPTED_BEAT_SCHEDULE constant. Add seed tests that pin a movable Souter List, a reachable pairing prompt, an unavailable-prompt session and candidates for each trigger (eight for the busy morning), none of them scripted. Bump PERSIST_VERSION by one.
- Demo triggers go in Phase 14's registry only, never on the Control Panel page:
  - "Colleague moves a List to the office": Admin Day and Notifications, harness bar, with the choices One move and A busy morning (8 moves);
  - "Colleague moves a List into my free session": PWA only, on Mobile Availability (/mobile/availability).
  Marking a booked session not available is a product action, not a trigger. Candidates are deterministic and never in SCRIPTED_BEAT_SCHEDULE (S2 Beat 3's target, Dr Sharma's Wed 22 AM Slot, among them). Bodies live in src/store so pwaPurity holds. There are no office stand-ins, because nothing waits for the office.
- Words: the anaesthetist never sees "Draft List" (Phase 31's rule); Admin-side Draft List words come from 31's shared/scheduleTerms.ts. Use "Return to the office" and "Hand on to a colleague" in both modes of the sheet.
- Design: one shared move sheet through useSurface().Overlay (a bottom sheet on mobile, a dialog on web) in the Mobile Availability anatomy. Use the warning tint for the prompt and info or neutral for notifications. Teal is the only action colour, with no crimson on controls, pills or notices. No en or em dashes in any app copy.
- Keep S2 Beats 1 to 4 intact. Rutherford's Wed 22 AM reassignment is untouched.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for the domain helpers, every store refusal, the one-commit moves, US-01.5.5's three acceptance criteria, US-13.8.1's three and US-13.8.2's two, the guard on every availability path, the re-check calls, the pool's paging and sharing, the audit rows, the triggers and the seed invariants.
- Do not commit or push.

When done:
- run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye; never hand it to me) and report each item pass or fail with its evidence;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green, and npm run verify:board;
- run the adversarial review-and-fix pass. That is convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green;
- run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19): create or update the capture recipes for US-01.4.3, US-01.4.5, US-01.5.5, US-13.8.1 and US-13.8.2 and every recipe this phase broke (US-01.5.2's partial reason that names Phase 32 among them; US-01.4.6's stub now names Phase 32a); in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green;
- update PROGRESS.md:
  - the status row and a phase entry: the drift-check result (the OQ-43, OQ-79 and OQ-84 status), the PERSIST_VERSION from and to, the seed-pinned candidates, the tests added, the review pass and the catalogue screenshot result (REPORT.md counts before and after);
  - the Decisions-log entries listed in the phase doc, marking the 2026-07-21 request-cover entry and the availability-reconciliation rulings as superseded;
  - the handoff notes for 32a, 35, 41, 38a and 44, and the OQ-43, OQ-79 and OQ-84 switch points;
- patch the demo guide in the same session:
  - in 03-demo-script.md: the new S2 Beat 3b, Beat 3's Say line, the discovery points and the sheets line;
  - Workflow 3 in 02-workflows-and-handoffs.md;
  - the personas, the cheat sheet and the README line;
  - the same sections of master-demo-guide.html;
  - the Control Panel S2 text.
  Read the S2 section of master-demo-guide.html against the run sheet once; the full milestone read is Phase 32a's;
- give me short, clear notes on what changed and anything left open, ending with the "For the owner's review" list (also in the PROGRESS entry).

Phase goal: an anaesthetist moves one of her own Lists, at once and with no one to accept or confirm, either back to the office, where it becomes a Draft List, or into a colleague's free session from the availability view, with a reason-free warning for a blacklisted pairing; marking a booked session not available asks the same question, so no List is left behind. Every move posts to a shared notification pool in the Admin App, newest first and the same for the whole team, separate from the to-do list, and the colleague sees the List with a notice. The cover-request marker is gone.
