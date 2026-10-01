Please run catch-up Phase 15 (Card becomes Booking) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the sequencing rules (15 runs before any phase that edits booking code; if 14 ran first, this rename covers its registry), the Demo triggers and Demo guide sections, and "When the catalogue changes".
2. docs/prototype-build/catch-up/phases/phase-15-booking-rename.md: your detailed plan. Its two-session split, rename rules and name map are binding.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md:
   - the Summary: Theme 4 (only its Copy-a-Booking-as-skeleton part; the rest is Phase 23's), "Structural first" item 1, "Remove or rework" (the stale "Card" copy and the post-op addendum Card);
   - the DM-01 and DM-39 rows under "Structural changes", and its DM-01 correction (a stored Booking source is optional);
   - the RV-03 and RV-12 rows under "Prototype behaviour to remove or rework";
   - the US-03.1.3 row in the EP-03 table.
   Then read epics/EP-03.md#us-03.1.3, analysis/domain-model-delta.md (DM-01, DM-39) and analysis/reverse-check.md (RV-03, RV-12).
4. The catalogue items, under docs/discovery-reference/Updated Requirements/catalogue/requirements/:
   - US-03.1.3.md (covered);
   - read alongside: US-02.4.3.md, US-02.4.1.md, FT-03.2.md and US-03.2.3.md;
   - docs/discovery-reference/Updated Requirements/domain-model.md, section 2 "Booking" and section 4, the glossary (Booking, Card, Recurring booking, Timesheet).
5. The code maps under docs/prototype-build/catch-up/analysis/:
   - prototype-map-store-seed.md (sections 1 to 3, 6 and 7);
   - prototype-map-domain.md (sections 2 and 5);
   - prototype-map-shared.md (sections 2, 3 and 5);
   - prototype-map-shell-demo-pwa.md (sections 1, 5 and 7).
   Also read aa-prototype/README.md.
6. The design references (convention 17):
   - docs/design/Design Language.dc.html (teal-only actions, DemoBadge tint, radius.card);
   - docs/design/Mobile App.dc.html, Screen 2 (List card stack) and Screen 3 (Card detail);
   - docs/design/Admin Day.dc.html (the List drawer) and docs/design/Admin Review.dc.html.
   The mockups' own "Card" labels stay; vocabulary follows the catalogue.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions, especially 5, 6, 7, 10, 13, 16, 17 and 18;
   - the Decisions log entries this phase supersedes or must respect:
     - 2026-07-22 Third external plan review #2 ("Card Copy is the RFP's additional-procedure mechanism");
     - 2026-07-23 Phase 03 store additions (copyCard);
     - 2026-07-27 "Paired capture cards match heights; attachments can be removed" (the component-side attachment id fix);
     - 2026-07-27 "The web card detail and List detail are now DESKTOP layouts";
   - the Phase 14 entry, if 14 has run.
8. requirements-board/capture/ATLAS.md: the "Personas and IDs", "Routes", "Overlays that need clicks" and "Existing hooks" sections. The catalogue's screenshot recipes hard-code this app's routes, ids, text and test hooks. Also the "Catalogue screenshots" rule in ROADMAP.md.

Then do the drift check in the phase doc:
- git diff 501b0b8 over the covered and read-alongside catalogue files and domain-model.md (the plan's snapshot; the 2026-10-01 update is already folded into the phase doc);
- confirm whether Phase 14 has run (look for aa-prototype/src/shared/demoTriggers/ and a Phase 14 PROGRESS entry).
If an item changed, adjust the work items. If US-03.1.3 is now Retired or Future, drop the attachment items and note it for PROGRESS.md. If the glossary renamed Booking again, stop and ask me. Then enter plan mode, turn the plan into work-sized steps, and wait for my approval.

While working:
- Session 1 is the mechanical rename only (work items 1 to 9), with no behaviour change. Re-green build, build:pwa, vitest and shots, and check that the screenshots differ only in wording, before any field addition. If the session ends there, leave the phase IN PROGRESS with the checkpoint recorded.
- Classify every "card" hit before renaming it:
  - the entity becomes Booking;
  - visual-card components and design tokens (AsaCard, TimesCard, ControlCard, radius.card, motion.cardAdvance and the like) keep their names;
  - the physical hospital or surgeon booking card keeps the word card.
  Let tsc find the uses; use git mv for file renames.
- Preserve id numbering: the prefix changes from C to BK in allocation order, so C0009 becomes BK0009 (Margaret Ellison). The seed formats ids by hand and seeds counters.card in domain/seed/index.ts: change bookings.ts (C#### to BK####), the counter and history.ts together. The 14 history Bookings are HC01 to HC14 and become HBK01 to HBK14; legacyBookingId maps both forms. Add, remove or reorder no RNG draw. Old /cards/ URLs redirect, with replace, to /bookings/, through a pure legacyBookingId helper that sits outside the PWA-forbidden closure (pwaPurity.test.ts).
- Every write goes through mutate() with the lifecycle guards:
  - Booking.source is optional and display-only (DM-39): stamped where a creation path knows it, shown as one quiet line when set, nothing when absent, and read by no rule, validator, selector or billing code;
  - attachments are written only through the new addAttachment and removeAttachment actions (store-allocated AT ids, no data URL in the audit), never through editBooking;
  - List attachments are optional and travel with reassignList.
- Booking.source reaches createBooking through a new optional source prop on ManualBookingForm (both AddBookingFlow prongs call it); copy and the post-op addendum set it on the Booking they build. The seed rule is deterministic and stamps the scenario Bookings only; generated history Bookings stay unset.
- The rename adds no booking-level state. Warnings (15a), billable party and invoice email (21) and prepayment (27) come later, and insurer and funding source sit on neither the Booking nor the Patient (OQ-55). Leave "Permanent List" (Phase 30's recurring-booking rename) and Draft List code alone.
- Copy makes a skeleton-only new Booking: the same patient and List, the billing reference (not the correlation ref), and one fresh primary Procedure. It inherits nothing else; its route is the add-flow default 'hospital' (not the source's, interim until Phase 20) so the anaesthetist can complete the copy without the office. The three wrappers open the new Booking. Rework visual/mobile-phase04.spec.ts's copy test and the two copy recipes (US-02.4.3, US-03.2.3) to match; recipe US-07.3.2 types HC05, which becomes HBK05. "Add another procedure" stays the only additional-procedure path. Confirm that Holt's $396.18 (the existing demoScenarios.test.ts assertion) and the bariatric two-procedure Booking still price exactly as before.
- The file picker is simulated and badged (DemoBadge "Simulated file picker"), with no real file input. Teal is the only action colour. No en or em dashes in any app copy. Mobile uses bottom sheets; web uses dialogs and panels.
- Vocabulary in every string you touch, app and demo guide: a List is reassigned or moved, never swapped; never "timesheet"; the physical card keeps the word card.
- Bump PERSIST_VERSION once per step that changes the seed (step A rename, step B fields), each with a comment line. Determinism holds: the demo clock only, no Date.now, new Date or Math.random.
- This phase adds no demo triggers. If Phase 14 has run, re-point its registry's route patterns, labels and context key; do not add entries.
- Session 2 also carries work items 14 to 16: the demo guide and Control Panel wording, the README folder map and analysis-map pointers, and the recipe sweep.
- Keep the requirements-board recipes working. Update their routes, ids, text and selectors, never a shot name field. Do not edit catalogue requirement files; the capture runner re-captures the images in the catalogue screenshot step at the end.
- Do not commit or push.

When done:
- Run the manual test checklist and report each item.
- Confirm npm run build, npm run build:pwa, npx vitest run, npm run shots and npm run verify:board are all green.
- Run the adversarial review-and-fix pass (convention 18). Fan out Opus review subagents for quality, bugs/correctness, plan adherence and rename completeness. Independently verify each finding, fix the confirmed ones, and re-green all suites.
- run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19): create or update the capture recipes for US-03.1.3 and every recipe this phase broke (all the card-named recipes, notably US-02.4.3, US-03.2.3 and US-07.3.2); in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green;
- Update PROGRESS.md:
  - the status row and phase entry;
  - the drift-check result;
  - the rename rules and the full old-to-new name map, for later phases;
  - the grep-gate leftovers;
  - both PERSIST_VERSION bumps;
  - the review pass;
  - the Decisions-log entries: vocabulary (amends convention 10; reassign or move, never swap; no timesheet), Copy (supersedes the two July rulings, "references" reading), Booking.source optional and display-only with its interims, and store-allocated attachment ids;
  - the catalogue screenshot result (REPORT.md counts before and after).
- Confirm the demo guide updates listed in the phase doc are applied (the four docs, README, the same sections of master-demo-guide.html and the Control Panel scenario text), as are the one-line rename pointer at the top of each analysis/prototype-map-*.md and the aa-prototype/README.md folder map.
- Give me short, clear notes.

Phase goal: Booking replaces Card across the whole prototype. Attachments sit on a Booking or a whole List, a Booking can show an optional source, and Copy makes a skeleton-only new Booking with its own primary Procedure.
