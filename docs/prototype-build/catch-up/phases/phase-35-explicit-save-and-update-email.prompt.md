Please run catch-up Phase 35 (Explicit save and the update email) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the phase list, the sequencing rules (Intake 33 to 35 runs after 31 and 20; 35 also needs 25), the demo-trigger, PWA-parity and demo-guide rules (35 is a milestone phase), and the "Confirm before building" row for 35 (OQ-46).
2. docs/prototype-build/catch-up/phases/phase-35-explicit-save-and-update-email.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially theme 11, explicit save, update email and concurrency; the DM-29 row; "Demo-trigger buttons"; "Uncertainty"), then the EP-02 table and its verifier note. Then docs/prototype-build/catch-up/epics/EP-02.md (US-02.3.1, US-02.3.2, US-02.3.3, US-02.5.5, US-02.5.6) and DM-29 (and DM-26 for the contact emails) in docs/prototype-build/catch-up/analysis/domain-model-delta.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-02.3.1.md, US-02.3.2.md, US-02.3.3.md, US-02.5.5.md and US-02.5.6.md;
   - for context, requirements/US-01.4.1.md, US-13.5.2.md, US-13.4.1.md, US-13.6.1.md and US-08.4.4.md;
   - questions/OQ-46.md (open) and OQ-07.md (answered).
   Also read docs/discovery-reference/Updated Requirements/domain-model.md: the section 1 row "No path for telling hospitals about Booking changes", and the "Booking" and "Surgeon, surgeons' room and blacklist" sections.
5. docs/prototype-build/catch-up/analysis/prototype-map-shared.md (surface seam, Booking detail body, flows, audit presentation), prototype-map-admin.md (List drawer, Booking flows, Audit viewer), prototype-map-store-seed.md (mutate and the lifecycle guards) and prototype-map-shell-demo-pwa.md (harness bar, router, PWA demo sheet, pwaPurity): the code index for the files you will change.
6. docs/design/Design Language.dc.html (warning, success and neutral tints, e-2, the sheet-in motion, mono tabular-nums, teal as the only action colour) and docs/design/Admin Day.dc.html plus Admin Review.dc.html (the Admin chrome, the List drawer, and the authorised banner that the save strip follows). These are the AUTHORITATIVE visual reference (convention 17). No mockup covers the save bar, clash prompt, as-at panel or email preview, so extend these patterns. Mobile App.dc.html only for the one-line mobile banner.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 13 to 18);
   - the Decisions-log entry of 2026-07-22 (fourth external review, finding #8: the "single-user by design, audited last-write-wins" concurrency stance), which this phase supersedes;
   - the Decisions-log entry of 2026-07-27 on audit history presentation (the change ledger and view-only coalescing), which this phase extends;
   - the Phase 14, 15, 17, 20 to 25, 28 and 33 entries and their handoff notes, for the registry and context hook, the post-rename names, the contact emails, every Booking field the Admin detail now edits, the Contract version helper and lock, the reassignment action, and the matching screen's apply path;
   - the 27, 32 and 34 entries only if those phases are DONE (they are not in 35's dependency chain): the prepayment commands, the office swap confirmation and the rebuilt S1.

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered catalogue files, OQ-46, OQ-07 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- check OQ-46: if it is still open, build its recommendation and label the recipient choice provisional;
- confirm Phases 17, 25 and 33 (and through them 14, 15, 20 to 24 and 28) are DONE, and write down the names they delivered; record whether 27, 32 and 34 are DONE, since the work items that mention them apply only if so;
- confirm that 20 and 25 closed US-02.5.5's Contract gaps (every Contract selection and adjustment is an audited Procedure write; the lock and version history exist); if not, stop and report;
- build the write inventory (every store action the Booking detail calls, classed as drafted edit or command);
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into two session-sized steps (split after work item 12; the phase doc's spill point says what moves if session 1 runs long), and wait for my approval.

While working:
- Mock backend only. The save is one office-only store action through the audited mutate(); every write carries before/after metas and demo-clock timestamps. Components never own domain state.
- Draft-then-save is Admin only. Mobile, web and the PWA mount no draft provider and keep their immediate saves exactly as today; the anaesthetist never calls saveBookingChanges.
- Nothing on the Admin Booking detail may bypass the draft. Drafted edits go through the booking-store context; commands (complete, uncomplete, cancel, copy, move, and the prepayment or additional-invoice actions where built) act on the real store and are disabled while there are unsaved changes. A drafted action may touch only the snapshot's slices and never emit an app event (the emitter is shared by every store); a demo Reset discards a dirty draft. Add the source-scanning test that enforces it. In draft mode, sheet buttons read Apply, not Save.
- One save is one change set: one change-set id across the entries, a booking.save header, the office as the actor, and the row version up by one. rowVersion and the lastModified stamps never appear in audit before or after.
- Nothing is lost silently. A different-field concurrent change merges and the admin is told; a same-field change goes to the clash sheet; a cancel, move or authorise in between blocks the save with a plain reason. Merge against the real state at Save time. Remap draft-created ids against the real counters and re-check the existing invariants (funder conservation, one primary Procedure, Contract eligibility) on the merged result.
- Keep the change-set maths, the merge rules, the as-at reconstruction and the email builder pure, in src/domain, with Vitest tests. Order as-at by audit sequence, not time (the demo clock has minute resolution).
- The email is a real mailto link. The system sends and records nothing. The whole encoded link is at most 2,000 characters (one labelled constant), and a shortened body says so. Only the allowlisted fields appear: never an NHI, date of birth, internal notes, Contract, billable party or money. Recipients follow the OQ-46 table and are labelled provisional while it is open.
- Migrate the framed build's router to a data router for useBlocker, keeping every URL and Playwright entry point; leave pwa/main.tsx alone. Run npm run shots straight after the migration.
- Determinism: no Date.now(), new Date() or Math.random(). Seed rowVersion 1 in the seed builders, leave the canvas generator untouched, and bump PERSIST_VERSION by one.
- Saves that do not come from the Admin draft (the S5 jump and both demo triggers) go through the saveBookingPatch convenience over saveBookingChanges, never hand-built snapshots.
- Demo triggers go into Phase 14's registry, never the Control Panel page: "Someone else saves this Booking now" on the Admin Booking detail (bar, reads the published draft, saves as the fictional second office user Tama R. through the real save path) and "Office edits this Booking" on the mobile Booking (PWA only, office stand-in badge). Bodies live in src/shared so pwaPurity holds. "Draft update email" is a product action with a badged preview panel.
- Keep S2 intact: phone advice on a free Slot and its isScriptedS2Booking prefill still work, and the Beat 3 reassignment now ends on the email step.
- Design: teal is the only action colour and crimson never appears on the new surfaces; warning tint for unsaved, success tint for saved, neutral for notices; Admin overlays through useSurface().Overlay; proper desktop layout. No en or em dashes in any app copy, email text or trigger label.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green;
- run the adversarial review-and-fix pass (convention 18: fan out Opus review subagents for quality, bugs and plan adherence, plus one on the draft-store refactor, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result, the OQ-46 status, the write inventory, the PERSIST_VERSION from/to, the router migration, the tests added and the review pass;
  - convention 7's new wording on change sets and row versions;
  - the Decisions-log entries listed in the phase doc (superseding the last-write-wins stance; extending the audit-presentation decision; drafted edits versus commands; the email allowlist and provisional recipients);
  - the handoff notes for 40, 41, 43 and 44;
- patch the demo guide in the same session: S5 Beat 1 and the S5 discovery points, S2 Beat 3, every beat that edits on the Admin Booking detail (add Save changes), the optional two-editors beat, the cheat sheet (including rewriting discovery topic 9, Concurrency), the workflows and personas notes, the same sections of master-demo-guide.html (including its S5 discovery callout and Concurrency card), and the S5 jump message; then do the milestone consistency read of master-demo-guide.html against the run sheet, and grep docs/demo-guide for "last-write-wins" and "single-user" (none should remain);
- give me short, clear notes on what changed and anything left open.

Phase goal: Admin Booking editing becomes draft-then-save, with one change set per save, grouped history and an as-at view. Concurrent saves merge or show a clash, a mailto update email follows a saved change or a cover change, and the office can add a Booking to a booked List, while anaesthetists keep immediate saves.
