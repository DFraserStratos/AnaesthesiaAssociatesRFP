Please run catch-up Phase 32 (Anaesthetist moves their own List) of the Anaesthesia Associates prototype. The phase files keep their historical name (phase-32-swap-requests); "swap" must not appear in app copy, store names, audit codes or tests.

The repo root is /Users/d.fraser/Local Dev/Anaesthesia Associates RFP (folder names contain spaces, so quote paths). The app is aa-prototype/. Paths below are relative to the repo root.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md:
   - owner decision D7 in the decisions table (answered: no acceptance, no office confirmation);
   - the phase list;
   - the sequencing rules (the Schedule track runs strictly 28 to 32; 32 reuses 17's blacklist helper and also needs 31, because a List moved to the office becomes a Draft List, and 27, because a move re-checks the prepayment);
   - the demo-trigger and PWA-parity rules ("Colleague pushes a List into my free Slot" is named there);
   - the demo-guide rules (32 is a milestone phase);
   - the Catalogue screenshots rule;
   - the placement note "32 becomes the anaesthetist's own move and takes US-01.4.6";
   - the "Confirm before building" row for 32 (OQ-65, OQ-43, OQ-70).
2. docs/prototype-build/catch-up/phases/phase-32-swap-requests.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic". Pay most attention to theme 2 ("Anaesthetist moves own List, no request"), the CoverRequest line under "Remove or rework", the OQ-65, OQ-70 and OQ-43 line, and the DM-05, DM-06 and RV-15 rows. Then read the EP-01 table, docs/prototype-build/catch-up/epics/EP-01.md (US-01.4.3, US-01.4.5, US-01.4.6) and EP-06.md (US-06.3.5, US-06.5.4), DM-05 and DM-06 in analysis/domain-model-delta.md, and RV-15 in analysis/reverse-check.md. RV-15's "office reassignment" action is out of date: D7 supersedes it.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-01.4.3.md, US-01.4.5.md and US-01.4.6.md (new, with three acceptance criteria);
   - for context, requirements/FT-01.4.md, US-01.4.1.md, US-01.4.2.md, US-01.3.5.md, US-13.6.3.md, FT-01.6.md, US-06.3.5.md and US-06.5.4.md;
   - questions/OQ-39.md (answered: D7), OQ-08.md (answered), OQ-65.md, OQ-43.md and OQ-70.md (open, each with a recommendation).
   Also read the "Slot, List and Draft List" and "Surgeon, surgeons' room and blacklist" sections, and the prepayment text on a moved Booking, in docs/discovery-reference/Updated Requirements/domain-model.md. Then read items #15, #16, #19, #22, #38, #39, #53 and #57 of catalogue/notes/2026-10-01-aa-meeting-with-greg.md.
5. docs/prototype-build/catch-up/analysis/prototype-map-apps-mobile-web.md, prototype-map-admin.md, prototype-map-store-seed.md, prototype-map-shared.md and prototype-map-shell-demo-pwa.md: the code index for the files you will change.
6. The design files, which are the AUTHORITATIVE visual reference (convention 17):
   - docs/design/Mobile Availability.dc.html: the sheet anatomy (tap a free session, the sheet slides up, a message field, a teal action, the completion tick);
   - docs/design/Web Availability.dc.html and docs/design/Web Dashboard.dc.html: the grid, the header button slot and the "Who's free" chips;
   - docs/design/Admin Day.dc.html: the day band and drawer attention area;
   - docs/design/Design Language.dc.html: the warning tint and on-tint, pills and motions.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 13 to 18);
   - the Decisions-log entry "2026-07-21 New interactions the design added, adopted into scope" (the mobile request-cover flow and the web "Ask to cover" links), which this phase SUPERSEDES;
   - the entries for catch-up Phases 14, 15, 15a, 17, 25, 27, 28, 29, 30 and 31. From them, take the names actually delivered for:
     - the registry, the PWA sheet and the actors;
     - reassignBooking and BookingDetailBody;
     - SubmitListSheet;
     - the blacklist helper (and the two Phase 17 rulings this phase amends);
     - the payee fixed at the authorise lock;
     - the prepayment re-check;
     - moveListToSlot, placeListOnSlot and the receive rule;
     - the availability calendar and its Find cover layers;
     - the conflict rules;
     - the Draft List model, with its List-to-Draft-List conversion and assignDraftList.
8. requirements-board/capture/ATLAS.md (the recipe format, routes, ids and hooks the catalogue's screenshot recipes depend on) and the "Catalogue screenshots" rule in ROADMAP.md, plus the phase doc's "Catalogue screenshots" section.

Then do the drift check in the phase doc:
- run git diff 501b0b8 over the covered catalogue files, OQ-39, OQ-43, OQ-65, OQ-70, OQ-08 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- confirm D7 / OQ-39 is still answered as built (stop and tell me if it was reopened). Note the status of OQ-65, OQ-43 and OQ-70: build each recommendation, labelled provisional in its one place, or its answer as the doc describes. Stop and tell me if OQ-70 came back "credit and re-prepay";
- confirm Phases 14, 15, 15a, 17, 27, 28, 29, 30 and 31 are DONE, and read what they left: the names above, Slot.coverRequest, and every other place the doc's grep finds;
- note the current PERSIST_VERSION.
Then write a plan that turns the work items into session-sized steps, then start building without waiting for my approval (ROADMAP.md "Owner review: agents test themselves"). Plan for two sessions:
- session 1 ends green at work item 8: types, helpers, seed tests, the three store actions, the notices, audit labels, and the cover marker retired;
- session 2 does items 9 to 15, then the demo guide, the milestone read, the review pass and PROGRESS.

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any UI (screens, sheets, dialogs, panels, rows, banners, pills, empty and error states), and apply it inside this repo's design system: the docs/design files and src/theme tokens stay authoritative (convention 17, ROADMAP.md "Front-end design"), so use the skill for layout, hierarchy, spacing, states and finish, never for a new palette, typeface or visual language. Store, seed and pure-domain steps do not need it.
- Mock backend only. Every write is a store action through the audited mutate(), with before/after metas and timestamps from the demo clock. Components never own domain state.
- Layering: src/domain imports neither src/store nor src/shared. The move helpers take domain-typed slices and a todayISO, never AppState, and use master-record names, not shared/format.ts.
- Build D7 as answered, with no provisional hint:
  - moveListToOffice and pushListToSlot take effect in one commit;
  - there is no request entity, no pending state, no acceptance and no office confirmation;
  - only the List's owner can move it: a DRAFT List dated today or later, never a Draft List;
  - the office keeps its own Reassign.
- One move, one place:
  - pushListToSlot runs Phase 28's moveListToSlot core. Split out a pure core if it self-commits, and keep the existing reassign tests unchanged. moveListToSlot itself stays office-only. Phase 28 hung 17's blacklist acknowledgement and 27's syncPrepayment on moveListToSlot: the push inherits them, and each happens exactly once per move;
  - moveListToOffice runs Phase 31's detachListToDraft with origin 'movedToOffice', the one conversion unavailability uses;
  - each move writes exactly one list.ownerMove event (from, to, by, when, route) and no second list.reassign;
  - the receive rule exists once, and pushTargets uses it.
- The doer rule (US-01.4.6): moveBookingToDoer, for the List's owner or the office, moves a Booking onto the doer's List for the same day and session. If there is none, it creates one in the doer's Slot through placeListOnSlot; a closed Slot is flagged, not refused. It writes one booking.movedToDoer event. The payable follows through the List's owner and Phase 25's lock. Keep reassignBooking's notOwnList refusal everywhere else.
- Prepayment: every Booking moved by any of the three actions gets Phase 27's re-check (syncPrepayment in its plan; use the name delivered) once after commit, with causes listMoved and bookingMoved (Phase 41 keys on them), and so does a Draft List assignment. A sent prepayment keeps its agreed amount and the doer is paid (OQ-70 recommendation); a held one is withdrawn and regenerated by 27's rule. Repointing a raised prepayment's payable is Phase 41's.
- The blacklist warns and never blocks:
  - the anaesthetist sees only pairingPromptForAnaesthetist's message (ANAESTHETIST_PAIRING_PROMPT): no reason, no surgeon name, no entry id, no blacklist word;
  - her colleague list is not split into a blacklisted group;
  - going ahead writes Phase 17's list.blacklistAcknowledged once, on the List;
  - this amends two Phase 17 rulings; log that in the Decisions log.
- Who is told (OQ-65 recommendation): derived notices only, read from the move's audit row through OWN_MOVE_NOTICE_RULE and two selectors. The office sees a block on the Day band and a line in the SlotDrawer; the colleague sees a Moved to you panel and a List detail line. There is no notification entity, no queue and no badge.
- Retire the cover marker completely (RV-15):
  - CoverRequest and Slot.coverRequest (List.coverRequest before Phase 28);
  - requestCover and RequestCoverSheet;
  - the ListRow offerCover variant;
  - the web CoverTarget / onCover plumbing (types.ts, outlet.ts, WebApp.tsx, routes.tsx) and the dashboard's myFreeList, offerCover and askCover;
  - the mobile AvailabilityScreen's own cover sheet;
  - the strings "Offer cover", "Cover requested", "Tap to ask" and "notified when someone accepts";
  - their labels, their tests and the two Playwright cover beats.
  Keep the "open for cover" free-Slot notes and fallbacks, which the capture recipes click, and the "Find cover" finder name. Keep the mockup's gesture of tapping a colleague's free cell, but only where the persona has a List in that session.
- Determinism: add no seed records and do not touch the canvas generator. Hold the scripted-beat Lists and Slots in one SCRIPTED_BEAT_SCHEDULE constant. Add seed tests that pin a movable Souter List, a reachable pairing prompt, a doer-move Booking and a candidate for each trigger, none of them scripted. Bump PERSIST_VERSION by one.
- Demo triggers go in Phase 14's registry only, never on the Control Panel page:
  - "Colleague moves a List to the office": Admin Day, harness bar;
  - "Colleague pushes a List into my free Slot": PWA only, on Mobile Availability (/mobile/availability).
  "Move to the anaesthetist who did it" is a product action on the Booking in all three apps, not a trigger. Candidates are deterministic and never in SCRIPTED_BEAT_SCHEDULE (S2 Beat 3's target, Dr Sharma's Wed 22 AM Slot, among them). Bodies live in src/store so pwaPurity holds. There are no office stand-ins, because nothing waits for the office.
- Words: the anaesthetist never sees "Draft List" (Phase 31's rule); Admin-side Draft List words come from 31's shared/scheduleTerms.ts.
- Design: one shared move sheet through useSurface().Overlay (a bottom sheet on mobile, a dialog on web) in the Mobile Availability anatomy. Use the warning tint for the prompt. Teal is the only action colour, with no crimson on controls, pills or notices. No en or em dashes in any app copy.
- Keep S2 Beats 1 to 4 intact. Rutherford's Wed 22 AM reassignment is untouched.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for the domain helpers, every store refusal, the one-commit moves, the doer rule's three acceptance criteria, the re-check calls, the notices, the audit rows, the triggers and the seed invariants.
- Do not commit or push.

When done:
- run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye; never hand it to me) and report each item pass or fail with its evidence;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green, and npm run verify:board;
- run the adversarial review-and-fix pass. That is convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green;
- run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19): create or update the capture recipes for US-01.4.3, US-01.4.5 and US-01.4.6 and every recipe this phase broke; in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green;
- update PROGRESS.md:
  - the status row and a phase entry: the drift-check result (the OQ-65, OQ-43 and OQ-70 status), the PERSIST_VERSION from and to, the seed-pinned candidates, the tests added, the review pass and the catalogue screenshot result (REPORT.md counts before and after);
  - the Decisions-log entries listed in the phase doc, marking the 2026-07-21 request-cover entry as superseded;
  - the handoff notes for 35, 41, 38a and 44, and the OQ-65 and OQ-43 switch points;
- patch the demo guide in the same session:
  - in 03-demo-script.md: the new S2 Beat 3b, Beat 3's Say line, the discovery points and the sheets line;
  - Workflow 3 in 02-workflows-and-handoffs.md;
  - the personas, the cheat sheet and the README line;
  - the same sections of master-demo-guide.html;
  - the Control Panel S2 text.
  This is a milestone phase, so finish with a consistency read of master-demo-guide.html against the run sheet;
- give me short, clear notes on what changed and anything left open, ending with the "For the owner's review" list (also in the PROGRESS entry).

Phase goal: an anaesthetist moves one of her own Lists, at once and with no one to accept or confirm, either to the office, where it becomes a Draft List, or into a colleague's free Slot from the availability view, with a reason-free warning for a blacklisted pairing. A Booking done by another anaesthetist moves to that anaesthetist's List, with the payee and the prepayment re-check following. The office and the colleague see derived notices, and the cover-request marker is gone.
