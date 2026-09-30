Please run catch-up Phase 32 (Swap requests) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the phase list, the sequencing rules (32 closes the Schedule track, 28 to 32 strictly in order, and reuses Phase 17's blacklist helper), owner decision D7 in the decisions table, the demo-trigger and PWA-parity rules ("Office confirms this swap" is named there), the demo-guide rules (32 is a milestone phase), and the "Confirm before building" row for 32 (OQ-39, OQ-43).
2. docs/prototype-build/catch-up/phases/phase-32-swap-requests.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially theme 4, Slot, List and Draft List, which includes the swap-request flow; the OQ-39 and OQ-43 line; and the DM-05 and RV-15 rows), then the EP-01 table. Then docs/prototype-build/catch-up/epics/EP-01.md (US-01.4.3, US-01.4.5), DM-05 in docs/prototype-build/catch-up/analysis/domain-model-delta.md, and RV-15 in docs/prototype-build/catch-up/analysis/reverse-check.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-01.4.3.md and US-01.4.5.md;
   - for context, requirements/FT-01.4.md, US-01.4.1.md, US-01.4.2.md, US-01.3.5.md and US-13.6.3.md;
   - questions/OQ-39.md, OQ-43.md and OQ-08.md.
   Also read the "Slot, List and Draft List" and "Surgeon, surgeons' room and blacklist" sections of docs/discovery-reference/Updated Requirements/domain-model.md.
5. docs/prototype-build/catch-up/analysis/prototype-map-apps-mobile-web.md, prototype-map-admin.md, prototype-map-store-seed.md, prototype-map-shared.md and prototype-map-shell-demo-pwa.md: the code index for the files you will change.
6. docs/design/Mobile Availability.dc.html (the request sheet anatomy: tap a free session, sheet slides up, message, teal send, completion tick), docs/design/Web Availability.dc.html and docs/design/Web Dashboard.dc.html (the grid, the requested-cell state, the "Offer cover" slot and the "Who's free" chips), docs/design/Admin Review.dc.html (the queue pattern and its choreography) and docs/design/Design Language.dc.html (the warning tint and on-tint, pills, motions). These are the AUTHORITATIVE visual reference (convention 17).
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 13 to 18);
   - the Decisions-log entry "2026-07-21 New interactions the design added, adopted into scope" (the mobile request-cover flow and web "Ask to cover" links), which this phase SUPERSEDES;
   - the Phase 06 advisory-conflict reading (the Phase 06 reassign mechanics, free target, absorb and regenerate, are history: Phase 28 superseded them with moveListToSlot, which is what a confirmed swap reuses);
   - the entries for catch-up Phases 14, 17, 28, 29, 30 and 31, for the registry and the simulated office actor, the blacklist helper (and the two Phase 17 rulings this phase amends), the Slot and List model, moveListToSlot and its receive rule, the availability calendar and its Find cover layers, the conflict rules and schedule.draftLists.

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered catalogue files, OQ-39, OQ-43, OQ-08 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- confirm the D7 answer (office confirms, the default, or direct handover) and OQ-43's status, and pick the branch the doc describes;
- confirm Phases 14, 15, 17, 28 and 29 (and in practice 30 and 31) are DONE, and read what they left: moveListToSlot / reassignList and their refusals (the receive rule), the vacated-Slot status type and default, the Slot id, the SlotDrawer, the Find cover routes (/mobile/availability, /web/availability) versus the My calendar routes, Slot.coverRequest and every other place the grep in the phase doc finds, and the simulated office actor's exported name in src/store/demoActors.ts;
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into session-sized steps, and wait for my approval. Plan for two sessions: session 1 ends green at work item 8 (model, helpers, store, audit labels, cover marker retired); session 2 does items 9 to 15, the demo guide, the review pass and PROGRESS.

While working:
- Mock backend only. Every write is a store action through the audited mutate(), with before/after metas and timestamps from the demo clock. Components never own domain state.
- Layering: src/domain imports neither src/store nor src/shared. The swap helpers take domain-typed slices and a todayISO, never AppState, and use master-record names, not shared/format.ts.
- Nothing takes effect before the office confirms (unless D7 said direct). requestSwap moves nothing; confirmSwap moves the List only through Phase 28's moveListToSlot core (split out a pure core if it self-commits, with the existing reassign tests unchanged), in one commit, with the list.reassign meta carrying swapRequestId. Keep the PENDING to CONFIRMED transition in one function so a D7 "direct handover" answer is a small switch.
- Request and confirm agree: swapTargets uses the same receive rule as the office's reassign, and confirmSwap re-checks with swapValidity, refusing with a plain reason when the request has been overtaken.
- Ownership is enforced in the store: an anaesthetist can request or withdraw only for her own List; only the office confirms or declines.
- The blacklist warns and never blocks. This amends two Phase 17 rulings (the blacklist is Admin only until OQ-43; an anaesthetist's writes never check the blacklist); log that in the Decisions log. The anaesthetist sees only the OQ-43 recommended prompt from pairingPromptForAnaesthetist: no reason, no surgeon name, no entry id, no "blacklist" word, and her colleague list is not split into a blacklisted group. The office sees Phase 17's full BlacklistWarning (with reason) at confirmation. Going ahead is acknowledged once in the audit.
- Retire the cover marker completely (RV-15): CoverRequest, Slot.coverRequest (List.coverRequest before Phase 28), requestCover, RequestCoverSheet, the ListRow offerCover variant, the web CoverTarget / onCover plumbing (types.ts, outlet.ts, WebApp.tsx, routes.tsx), the mobile AvailabilityScreen's own cover sheet, "Offer cover" on free sessions, "Cover requested" and "Tap to ask", their labels, tests and the two Playwright cover beats. Keep the "open for cover" free-Slot notes and fallbacks (seed and Admin Day grid; capture recipes click them) and the "Find cover" finder name. Keep the mockup's gesture of tapping a colleague's free cell, only where the persona has a List in that session.
- Determinism: swap requests are seeded empty; do not touch the canvas generator. Add the seed tests that pin a Souter List that can be swapped and a candidate for each trigger choice, excluding every scripted-beat List. Bump PERSIST_VERSION by one.
- Demo triggers go in Phase 14's registry only, never on the Control Panel page: "Colleague requests a swap" (Admin, Swap requests, harness bar) and the PWA-only office stand-ins "Office confirms this swap" and "Office declines this swap" on Mobile Availability (/mobile/availability) and on a List with a pending request. Candidates are deterministic and never a scripted-beat List or a Slot a scripted beat needs open (S2 Beat 3's target, Dr Sharma's Wed 22 AM). Bodies live in src/store so pwaPurity holds.
- Design: one shared swap sheet through useSurface().Overlay (bottom sheet on mobile, dialog on web) in the Mobile Availability anatomy; the Admin queue in the Admin Review pattern; warning tint for the prompt and pills; teal the only action colour; no crimson on controls or pills. No en or em dashes in any app copy.
- Keep S2 Beats 1 to 4 intact (the queue starts empty; Rutherford's Wed 22 AM reassignment is untouched).
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for the domain helpers, every store refusal, the one-commit confirm, the audit rows, the triggers and the seed invariants.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green, and npm run verify:board after the capture-recipe change;
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result and the D7 branch built, the PERSIST_VERSION from/to, the seed-pinned Lists, the tests added and the review pass;
  - the Decisions-log entries listed in the phase doc, marking the 2026-07-21 request-cover entry as superseded;
  - the handoff notes for 44 and the D7 and OQ-43 switch points;
- patch the demo guide in the same session: S2 Beat 3b, discovery points and Direct URLs in 03-demo-script.md; Workflow 3 in 02-workflows-and-handoffs.md; the personas; the cheat sheet; the same sections of master-demo-guide.html; and the Control Panel S2 text. This is a milestone phase, so finish with a consistency read of master-demo-guide.html against the run sheet;
- give me short, clear notes on what changed and anything left open.

Phase goal: an anaesthetist asks, from the availability view, for one of her own Lists to go to a named colleague, with a soft pairing prompt that reveals nothing; the office confirms or declines in an Admin queue, and confirming reassigns the List with its Bookings and history, notifies both anaesthetists and is audited.
