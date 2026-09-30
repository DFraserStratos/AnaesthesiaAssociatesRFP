Please run catch-up Phase 17 (Surgeons, rooms and blacklist) of the Anaesthesia Associates prototype.

The repo root is /Users/d.fraser/Local Dev/Anaesthesia Associates RFP (folder names contain spaces, so quote paths). The app is aa-prototype/. Paths below are relative to the repo root.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the phase list, the sequencing rules (17 opens the Contracts track; 31 and 32 reuse this phase's blacklist helper), the demo-trigger and demo-guide rules, and the "Confirm before building" row for 17 (OQ-52, OQ-43).
2. docs/prototype-build/catch-up/phases/phase-17-surgeons-rooms-blacklist.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially theme 9, master data and surgeon model, and the DM-26 row), then the EP-13 and EP-01 tables. Then docs/prototype-build/catch-up/epics/EP-13.md (US-13.6.1, US-13.6.2, US-13.6.3, US-13.4.1) and epics/EP-01.md (US-01.3.5), and DM-26 in docs/prototype-build/catch-up/analysis/domain-model-delta.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-13.6.1.md, US-13.6.2.md, US-13.6.3.md and US-01.3.5.md;
   - for context, requirements/FT-13.6.md, US-13.4.1.md, US-01.4.5.md and US-01.6.3.md;
   - questions/OQ-52.md and OQ-43.md.
   Also read the "Surgeon, surgeons' room and blacklist" section of docs/discovery-reference/Updated Requirements/domain-model.md.
5. docs/prototype-build/catch-up/analysis/prototype-map-admin.md, prototype-map-store-seed.md, prototype-map-domain.md and prototype-map-shared.md: the code index for the files you will change.
6. docs/design/Design Language.dc.html (the warning tint and on-tint, pills, radii, mono identifiers) and docs/design/Admin Day.dc.html plus Admin Review.dc.html (the Admin chrome, tables, drawer and amber advisory treatment). These are the AUTHORITATIVE visual reference (convention 17). No mockup covers master data, so extend these patterns.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 13 to 18);
   - the Decisions-log entries for the Phase 06 advisory-conflict reading (amber, never a hard block), the Phase 07 build decisions (runtime id prefixes, master-data editing patterns) and the 2026-07-23 contract-holder placements (the COS organisation);
   - the Phase 14 and 15 entries, for the registry and the post-rename names.
   This phase supersedes no July ruling; it extends the advisory reading.

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered catalogue files, OQ-52, OQ-43 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- confirm Phases 14 and 15 are DONE (if either is not, stop and tell me), and use the post-15 names (AddBookingFlow, stampBookingId, "Continue to add booking", or whatever actually landed);
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into session-sized steps, and wait for my approval.

While working:
- Mock backend only. Every new write is an office-only store action through the audited mutate(), with before/after metas and timestamps from the demo clock. Components never own domain state.
- Determinism: add no surgeons and do not touch the canvas pick arrays (CES_SURGEONS, GENERAL_SURGEONS) or any generator input. The generated canvas must be unchanged, so prove it with a seed fingerprint test written before any seed edit. Seed timestamps are fixed strings. Bump PERSIST_VERSION by one.
- The blacklist warns and never blocks:
  - blacklisted options sit in their own labelled group and stay selectable;
  - choosing one shows a soft amber warning naming the pairing before save;
  - going ahead writes one *.blacklistAcknowledged audit entry, and no store action refuses on it;
  - only office actors are checked: an anaesthetist's own DRAFT editList never checks or logs the blacklist.
- One rule, one place. All pairing checks and partitions go through the pure src/domain/blacklist.ts, and the reusable UI (SurgeonSelect, BlacklistWarning) lives in src/shared/schedule, so Phases 28, 31 and 32 reuse it. No inline checks in the Admin flows.
- Room membership has one source, Surgeon.roomId, and the room's surgeons are derived. Surgeon groups are a new master beside organisations; leave the COS Contract and organisations alone for Phase 18.
- OQ-52: if still open, use one identifier field labelled "HPI number (CPN)" with a provisional hint, stored as free text.
- OQ-43: keep the blacklist, its reasons and its warnings out of the mobile app, the web app and the PWA entirely. BlacklistWarning shows the reason only with a showReason prop (default false; Admin passes true).
- src/domain never imports from src/shared. Seed blacklist ids use BLK- (runtime BLKN), not BL (the billing-line prefix).
- Keep S2 intact. The seeded active pairing (Sharma with a surgeon other than Hale) must show in the Beat 2 picker's blacklisted group without touching the scripted Hale path. The Beat 3 reassignment must not warn. Keep the isScriptedS2Booking prefill working.
- No demo triggers in this phase (it is all normal Admin use). Add nothing to the Control Panel.
- Design: warning tint for the warning (not error red), teal the only action colour, crimson never used for a blacklisted row. The profile is a real desktop page and the sheets use useSurface().Overlay. No en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for the domain helpers, the store actions (refusals, audit, end-keeps-history, acknowledgement) and the seed invariants.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green;
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result, the PERSIST_VERSION from/to, the tests added and the review pass;
  - the Decisions-log entries listed in the phase doc;
  - the handoff notes for 18, 28, 31, 32, 35, 40 and 42;
- patch the demo guide in the same session: S2 Beat 2, discovery points and Direct URLs in 03-demo-script.md; the cheat sheet; the workflows note; and the same sections of master-demo-guide.html;
- give me short, clear notes on what changed and anything left open.

Phase goal: surgeons become real master data, with a profile, a room with contacts, groups, hospital contact emails and an audited blacklist. The office sees a soft, never-blocking warning whenever it pairs a blacklisted surgeon and anaesthetist.
