Please run catch-up Phase 17 (Surgeons, rooms and blacklist) of the Anaesthesia Associates prototype.

The repo root is /Users/d.fraser/Local Dev/Anaesthesia Associates RFP (folder names contain spaces, so quote paths). The app is aa-prototype/. Paths below are relative to the repo root.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner-decisions table, the phase list, the sequencing rules (17 opens the Contracts track; 31 and 32 reuse this phase's blacklist helper, 32 for the anaesthetist's own-List move that replaced swap requests), the demo-trigger and demo-guide rules, the "Catalogue screenshots" rule, and the "Confirm before building" row for 17 (OQ-43).
2. docs/prototype-build/catch-up/phases/phase-17-surgeons-rooms-blacklist.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially theme 11, master data and profiles, and the DM-32 line under "Structural first"), then the EP-13 and EP-01 tables. Then docs/prototype-build/catch-up/epics/EP-13.md (US-13.6.1, US-13.6.2, US-13.6.3, US-13.4.1) and epics/EP-01.md (US-01.3.5), and DM-32 in docs/prototype-build/catch-up/analysis/domain-model-delta.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-13.6.1.md, US-13.6.2.md, US-13.6.3.md and US-01.3.5.md;
   - for context, requirements/FT-13.6.md, US-13.4.1.md, US-01.4.5.md and US-01.6.3.md;
   - questions/OQ-52.md (answered: one HPI CPN) and OQ-43.md (open, with Ben: what an anaesthetist sees, one list or two, and a possible rename to "block list").
   Also read the "Surgeon, surgeons' room and blacklist" section of docs/discovery-reference/Updated Requirements/domain-model.md, and items #19 and #26 of catalogue/notes/2026-10-01-aa-meeting-with-greg.md.
5. docs/prototype-build/catch-up/analysis/prototype-map-admin.md, prototype-map-store-seed.md, prototype-map-domain.md and prototype-map-shared.md: the code index for the files you will change.
6. docs/design/Design Language.dc.html (the warning tint and on-tint, pills, radii, mono identifiers) and docs/design/Admin Day.dc.html plus Admin Review.dc.html (the Admin chrome, tables, drawer and amber advisory treatment). These are the AUTHORITATIVE visual reference (convention 17). No mockup covers master data, so extend these patterns.
7. requirements-board/capture/ATLAS.md (the recipe format, routes, ids and hooks the catalogue's screenshot recipes depend on) and the "Catalogue screenshots" rule in docs/prototype-build/catch-up/ROADMAP.md.
8. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 13 to 18);
   - the Decisions-log entries for the Phase 06 advisory-conflict reading (amber, never a hard block), the Phase 07 build decisions (runtime id prefixes, master-data editing patterns) and the 2026-07-23 contract-holder placements (the COS organisation);
   - the Phase 14 and 15 entries, for the registry and the post-rename names, and the 15a entry if it has landed (its src/shared/warnings/ styling, which BlacklistWarning matches but does not wrap).
   This phase supersedes no July ruling; it extends the advisory reading.

Then do the drift check in the phase doc:
- run git diff 501b0b8 over the covered catalogue files, OQ-52, OQ-43 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- confirm OQ-52 is still answered as one HPI CPN (stop and tell me if it was reopened), and note OQ-43's status (a new name goes into the single BLACKLIST_TERM label);
- confirm Phases 14 and 15 are DONE (if either is not, stop and tell me), and use the post-15 names (AddBookingFlow, stampBookingId, "Continue to add booking", or whatever actually landed);
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into session-sized steps, and wait for my approval.

While working:
- Mock backend only. Every new write is an office-only store action through the audited mutate(), with before/after metas and timestamps from the demo clock. Components never own domain state.
- Determinism: add no surgeons and do not touch the canvas pick arrays (CES_SURGEONS, GENERAL_SURGEONS) or any generator input. The generated canvas must be unchanged, so prove it with a seed fingerprint test written before any seed edit. Seed timestamps are fixed strings. Bump PERSIST_VERSION by one.
- HPI CPN (OQ-52 answered): the surgeon gets one required hpiId field, labelled "HPI CPN" everywhere, the surgeon's unique index (like the NHI for a patient). Store it trimmed and upper-cased, check the two-digits-four-letters shape only, and refuse a blank, malformed or duplicate value (duplicates checked across surgeons and anaesthetists). No provisional hint, no separate CPN field. The NZ registration number is held "for information". Relabel the shared audit field label hpiId from "HPI id" to "HPI CPN". Never present it as the patient NHI.
- The blacklist warns and never blocks:
  - blacklisted options sit in their own labelled group and stay selectable;
  - choosing one shows a soft amber warning naming the pairing before save;
  - going ahead writes one *.blacklistAcknowledged audit entry, and no store action refuses on it;
  - only office actors are checked: an anaesthetist's own DRAFT editList never checks or logs the blacklist.
- It is an assignment-time check on a List's pairing, not a Booking warning: register nothing in 15a's warning routine (match its mild amber style if it exists).
- One rule, one place. All pairing checks and partitions go through the pure src/domain/blacklist.ts, and the reusable UI (SurgeonSelect, BlacklistWarning) lives in src/shared/schedule, so Phases 28, 31 and 32 reuse it. No inline checks in the Admin flows.
- One name, one place. Every user-facing mention of the list builds from BLACKLIST_TERM in src/domain/blacklist.ts, because OQ-43 may rename it "block list". Audit codes stay blacklist.*.
- Keep the shape open for OQ-43: every entry carries keptBy ('OFFICE' only for now), and the helpers do not hard-code the keeper. Build only the office-kept list.
- Room membership has one source, Surgeon.roomId, and the room's surgeons are derived. Surgeon groups are a new master beside organisations; leave the COS Contract and organisations alone for Phase 18.
- OQ-43: keep the blacklist, its reasons and its warnings out of the mobile app, the web app and the PWA entirely. BlacklistWarning shows the reason only with a showReason prop (default false; Admin passes true).
- src/domain never imports from src/shared. Seed blacklist ids use BLK- (runtime BLKN), not BL (the billing-line prefix).
- Keep S2 intact. The seeded active pairing is Sharma with Ms A. Reid (the one surgeon the generated canvas never pairs with Sharma; Okafor has a generated Sharma List on 19 Oct), plus an ended Hughes with Reid entry for history. Re-check with the seed test before seeding; if the canvas has moved, pick another and re-point the shots. It must show in the Beat 2 picker's blacklisted group without touching the scripted Hale path. The Beat 3 reassignment must not warn. Keep the isScriptedS2Booking prefill working.
- Add no new "permanent list" wording; Phase 30 renames it to "recurring booking".
- No demo triggers in this phase (it is all normal Admin use). Add nothing to the Control Panel.
- Design: warning tint for the warning (not error red), teal the only action colour, crimson never used for a blacklisted row. The profile is a real desktop page and the sheets use useSurface().Overlay. No en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for the domain helpers (including the HPI CPN normaliser and shape check), the store actions (refusals, duplicate HPI CPN, audit, end-keeps-history, acknowledgement) and the seed invariants (unique HPI CPNs, rooms, references, S2 path clear).
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run, npm run shots and npm run verify:board are green;
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19): create or update the capture recipes for US-13.6.1, US-13.6.2, US-13.6.3 and US-01.3.5 and every recipe this phase broke (the phase doc's Catalogue screenshots section names US-13.4.1); in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green;
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result against 501b0b8, OQ-43's status, the PERSIST_VERSION from/to, the tests added, the review pass and the catalogue screenshot result (REPORT.md counts before and after);
  - the Decisions-log entries listed in the phase doc;
  - the handoff notes for 18, 26 and 40a, 28, 30, 31, 32, 35, 27/34/40 and 42;
- patch the demo guide in the same session: S2 Beat 2, discovery points (OQ-43, not OQ-52) and Direct URLs in 03-demo-script.md; the cheat sheet; the workflows note; and the same sections of master-demo-guide.html;
- give me short, clear notes on what changed and anything left open.

Phase goal: surgeons become real master data, keyed on one HPI CPN, with a profile, a room with contacts, groups, hospital contact emails and an audited, office-kept blacklist. The office sees a soft, never-blocking warning whenever it pairs a blacklisted surgeon and anaesthetist, through one shared helper that Draft List assignment (31) and the anaesthetist's own-List move (32) reuse.
