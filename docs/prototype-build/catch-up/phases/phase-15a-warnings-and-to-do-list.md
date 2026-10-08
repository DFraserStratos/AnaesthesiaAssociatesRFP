# Phase 15a · Warnings and the to-do list

**Status: DONE (2026-10-09).** Session 1 (work items 1 to 8) is built, green and committed (commit
`b342a7d`, PERSIST_VERSION 16, 758 Vitest + 89 Playwright). Session 2 (work items 9 to 15) is built
(787 Vitest + 92 Playwright; see the PROGRESS.md phase entry), as planned below against catalogue commit `3d3a18c`, read together with the
dated section "Requirements changed since session 1 (2026-10-08)" below, which says what the
catalogue update to `60e2d1e` changes for session 2 (by the owner's exception this phase keeps its
`3d3a18c` baseline).

**Requirements covered:**
[FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md) Warnings and the to-do list (Verify: accepted in the room on 2026-10-02, not yet moved; its open point, OQ-79 part 4, is how the notification pool sits beside the to-do list, which Phase 32 owns),
[US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md) Warning routine (Confirmed),
[US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md) Warnings on the dashboard to-do list (Confirmed),
[US-13.7.3](../../../../requirements-board/requirements/stories/US-13.7.3.md) Warning flag on a Booking (Confirmed 2026-10-02: no confirm step at submit, no tap-to-read, the warning visually clear on opening the Booking);
[DM-31](../analysis/domain-model-delta.md#dm-31) one warning routine and a Warning record on the Booking (partly built in session 1).
Treated here without closing it: [RV-09](../analysis/reverse-check.md) (the completion-gate part
only, done in session 1; Phase 27 closes the rest of the prepayment reading).
Read alongside (rules that later phases register): [US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md)
(unpaid prepayment, Confirmed, "no block"; the date escalation is Phase 27's),
[OQ-92](../../../../requirements-board/requirements/questions/OQ-92.md) (27: a prepaid procedure with
no price on the anaesthetist's own Contract warns the office, D27's default),
[US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) (19: base units outside
the range, after-procedure, for the office),
[US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md) (21: a child as the payer
on the Booking, mild),
[US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) (21: a Booking that says
an insurer will pay with no insurer Contract chosen, a warning at office review; whether the
indication is stored is [OQ-93](../../../../requirements-board/requirements/questions/OQ-93.md), D28's
default),
[US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md) (40; per OQ-74, days count from the invoice date and a credit balance is mild).
Read alongside (the neighbours on the dashboard): [FT-13.8](../../../../requirements-board/requirements/stories/FT-13.8.md)
shared notification pool, [US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md)
and [OQ-79](../../../../requirements-board/requirements/questions/OQ-79.md) (Phase 32 builds it;
FT-13.7's note sends notices that need no action there, not to the to-do list; Vanessa agreed the
shared feed on 2026-10-07), and [US-01.6.2](../../../../requirements-board/requirements/stories/US-01.6.2.md)
(Phase 31's one place for all Draft Lists, sorted by date, which Vanessa welcomed the same day).
Out of scope by status: [US-13.7.4](../../../../requirements-board/requirements/stories/US-13.7.4.md)
(the settings page, Future; Greg 2026-10-02: "set it up as a constant, worry about it later").
Owner decision: **D5** ([OQ-57](../../../../requirements-board/requirements/questions/OQ-57.md),
answered 2026-10-01: no prepayment block, a clear warning in both apps; built in session 1).
**Depends on:** Phase 14 (the trigger registry in `src/shared/demoTriggers/`, `useDemoTriggerContext`,
the PWA demo-actions sheet and the shared actors in `src/store/demoActors.ts`) and Phase 15 (Card
becomes Booking: `Booking`, `schedule.bookings`, `shared/booking/BookingDetailBody.tsx`,
`completeBooking`, `reviewFlagsForBooking`, `AdminBookingDetail`, routes `…/bookings/:bookingId`,
audit `booking.*`). Runs before 15b (Copy and photo capture out), 16 (so the first milestone shows
warnings) and before 19, 21, 27 and 40, which each register a rule. Phase 15b runs straight after
this one and renames the List state DRAFT to ACTIVE.
**Estimated:** 2 sessions. Session 1 (work items 1 to 8, the model and the gate removal) is done.
Session 2 is the surfaces (work items 9 to 15), the triggers, the demo guide, the catalogue
screenshots, the review pass and the PROGRESS entry.

## Requirements changed since session 1 (2026-10-08)

The catalogue moved from `3d3a18c` to `60e2d1e` after this plan was written: the Contract and pricing
model rewrite, the List lifecycle states, and the procedure picker and source text
(`requirements-board/requirements/changes/2026-10-07-requirements-update.md`,
`2026-10-07-list-lifecycle-states.md`, `2026-10-08-procedure-picker-and-source-text.md`), and the
catalogue moved to `requirements-board/requirements/`. The gap analysis was re-graded at `60e2d1e`:
FT-13.7, US-13.7.1, US-13.7.2 and US-13.7.3 are still Partial for the same reasons (no UI reads the
routine), and the prototype code is unchanged since `b342a7d`. This section is the drift check for
`3d3a18c..60e2d1e`; the work items below already carry it. By area, what session 2 builds
differently:

- **(a) The covered items.** FT-13.7, US-13.7.1, US-13.7.2, US-13.7.3 and DM-31 changed only in
  formatting (US-13.7.1's sources line) or not at all; US-13.7.4 is still Future. **Nothing**: the
  surfaces are built as planned (to-do list with Clear, triangle, warning on opening, outline down to
  the Booking, no confirm step, no tap-to-read).
- **(b) The rules later phases register.** The list grew and two were renamed; this phase still builds
  none of them, only the sample trigger's text, the US-13.7.1 recipe's partial reason and the handoff
  name them: **19** base units outside the RVG group's range (after-procedure, for the office);
  **21** a child as the **payer on the Booking** (no longer "billable party", US-11.2.4) and a
  Booking that says an insurer will pay with no insurer Contract chosen (US-07.2.2, OQ-93, D28's
  default); **27** the prepayment escalation by date and a prepaid procedure with no price on the
  anaesthetist's own Contract (OQ-92, D27's default); **40** a paying patient with a balance. The
  renames come from the source stories (US-11.2.4 is now "a child as the payer on the Booking";
  US-03.3.1, now "Pick the procedure and Contract, with starting units", warns the office on a value
  outside the published RVG range, which Phase 19 holds on the RVG group): US-13.7.1's own list is unchanged at `60e2d1e` and still
  says "child as the billable party" and "RVG code's range", so name the rules by their source
  stories. The domain model's Warnings section lists the catalogue's set (out-of-range base units,
  unpaid prepayment, child as payer, patient balance, insurer-will-pay with no insurer Contract);
  OQ-92's no-price warning is D27's default, not yet in the catalogue.
- **(c) The List lifecycle.** A List's states are now DRAFT (a Draft List, no anaesthetist), ACTIVE,
  SUBMITTED and AUTHORISED (EP-07). Phase 15b renames today's DRAFT to ACTIVE straight after this
  phase. Session 2 writes **no new user-facing "DRAFT"** (and no "Open" state label) for an assigned
  List; code that reads the `'DRAFT'` literal (the sample targets, `editRefusal`) keeps it, for 15b to
  rename.
- **(d) The right rail.** The To-do card still sits under the mini calendar and leaves room below it
  for Phase 31's Draft Lists panel (Vanessa, 2026-10-07: one place for all Draft Lists without an
  anaesthetist, sorted by how close they fall, US-01.6.2) and Phase 32's shared notification pool
  (Vanessa agreed the shared, not per-user, feed, OQ-79 update, US-13.8.1). **Nothing** changes in
  the build; OQ-79 part 4 stays Phase 32's.
- **(e) Prepayment wording.** The prepaid amount is now the anaesthetist's own fixed price, in full,
  never an estimate or a deposit (US-06.2.2; US-06.2.3 to US-06.2.5 and US-06.4.2 Retired). Session 2
  adds **no new copy** calling it an estimate or a deposit, and no balance-invoice narration. The
  office's "Raise pre-procedure invoice" stays on the prepayment warning's row until Phase 27
  generates the invoice at setup (held for the office to approve and send). **Nothing** else.
- **(f) The Review screen.** It keeps its ACC advisory among the non-warning `reviewFlagsForBooking`
  pills: Phase 18 removes it (RV-20), not Phase 20 as this plan first said. **Nothing** to build.
- **(g) Pairing preferences.** The office's soft not-preferred notice when it assigns or moves a List
  (US-13.6.3, US-13.6.4, OQ-43 answered) is Phase 17's assignment helper, shown at the moment of the
  decision: it is not a warning-routine rule and never a to-do entry, and there is no warning when an
  anaesthetist hands on their own List. **Nothing** here.
- **(h) Session 1.** Nothing in the new catalogue undoes it: the routine, Warning records, kinds and
  strengths, `appSettings`, `warningClearances`, the selectors, `clearWarning` and the gate removal
  (D5, OQ-57 still "no block") all stand, and US-13.7.1 still leaves the unpaid prepayment's kind and
  strength unset (built before-procedure, strong). The `prepaymentUnpaid` rule's input is re-pointed
  later (20 at an office-set prepayment flag, 27 at the prepaid set), which is not an undo. Anything
  found during the build that would undo session 1 is not built: report it to the owner as NEEDS
  OWNER.

## Goal

Build the catalogue's one warning routine before the phases that feed it.

**Built in session 1 (frozen).** A pure routine in `src/domain/warnings/` evaluates each Booking
against registered rules and produces **Warning records on the Booking**: kind (before-procedure or
after-procedure), strength (mild or strong), text and source rule, several per Booking, and **never a
block**. When an admin clears one, a clearance (who, when, at what strength) is stored in
`schedule.warningClearances` and audited through `clearWarning`. Rule parameters live in the
`appSettings` record. Per owner decision D5 the prepayment completion gate and its audited override
are gone: an outstanding prepayment is a strong before-procedure warning (`prepaymentUnpaid`), shown
today by a stop-gap banner on the Booking.

**Session 2 builds the surfaces.** The Admin Day dashboard gains a **to-do list** of open warnings in
its right rail, with Clear (optional for a mild warning). Per FT-13.7's note the to-do list is for
warnings that need action; notices that need none (an anaesthetist's List move, for example) go to
the shared notification pool Phase 32 builds, not here. Bookings carry a **small warning triangle** in
mobile, web and Admin, "much like the prototype does today" (US-13.7.3 points at Dr Emma
Fitzgerald's Tue 21 Jul PM block on the Admin Day grid: the amber outline and the small amber corner
marker), and the Day view's List outline extends down to the Booking. When the anaesthetist **opens a
Booking that carries a warning, the warning is visually clear**: a warnings panel sits at the top of
the Booking detail, under the header, readable without scrolling or tapping. Per US-13.7.3 there is
**no confirm step at submit and no tap-to-read**: the triangle is a marker, not a button, and
submitting a List whose Bookings carry warnings goes straight through the usual submit sheet.

Later phases add their rules, with no UI change: 19 (base units outside the RVG group's range,
after-procedure, for the office), 21 (a child as the payer on the Booking, mild; and a Booking that
says an insurer will pay with no insurer Contract chosen, a warning at office review), 27 (prepayment
escalation by date; and a prepaid procedure with no price on the anaesthetist's own Contract, for the
office) and 40 (a paying patient with a balance: owing is mild or strong by threshold, counted from
the invoice date; a credit balance is mild). There is no settings page: US-13.7.4 is Future. Session
2's copy names no List "DRAFT" (Phase 15b renames that state ACTIVE next) and never calls the
prepayment an estimate or a deposit.

## Before you start: drift check

This phase's baseline stays `3d3a18c` (owner's exception, 2026-10-08). The span `3d3a18c..60e2d1e`
is already read for you: it is the dated section "Requirements changed since session 1
(2026-10-08)" above, and the work items carry it. Re-read that section first.

1. Run the catalogue diff for anything newer. The tool diffs from the plan's baseline in `plan.json`,
   which the 2026-10-08 plan update moved to `60e2d1e`, so it prints only what changed after the
   dated section:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-13.7,US-13.7.1,US-13.7.2,US-13.7.3,US-13.7.4,FT-13.8,US-13.8.1,US-01.6.2,US-06.3.2,US-06.2.1,US-06.2.2,US-11.2.4,US-07.2.2,US-03.3.1,US-11.3.2,US-13.1.1,US-08.2.2,OQ-57,OQ-74,OQ-79,OQ-92,OQ-93
   ```

   Read the hunks for FT-13.7, US-13.7.1 to US-13.7.4, FT-13.8, US-13.8.1, US-01.6.2, US-06.3.2,
   US-06.2.1, US-06.2.2, the rule sources (US-11.2.4, US-07.2.2, US-03.3.1, US-11.3.2, OQ-92, OQ-93),
   US-13.1.1 (the one-day dashboard the to-do list sits on), OQ-57, OQ-74, OQ-79, and the domain-model
   lines on warnings (its "Warnings" section: the routine, "never blocks", the to-do list, the
   notification pool). If the command prints nothing for an item, the dated section is current for it.
   (Check the `baseline` it prints: if `plan.json` still reads `3d3a18c`, the output also carries the
   `3d3a18c..60e2d1e` span the dated section already covers; read only what is newer than `60e2d1e`.)
2. What `3d3a18c` already settled, and `60e2d1e` kept (built into this plan; do not re-open): US-13.7.1, US-13.7.2 and
   US-13.7.3 are Confirmed; US-13.7.3 dropped the submit confirm step and the tap-to-read and asks
   for the warning to be visually clear on opening the Booking; FT-13.7 sends notices to the shared
   pool; US-13.7.4 stays Future; OQ-57 still says no block. If step 1 shows an item changed after
   `60e2d1e`, re-read it in full and adjust the work items (session 2 only). Specifically:
   - **US-13.7.1's list of current warnings.** If the unpaid prepayment now has a kind and strength
     other than before-procedure strong, change the rule's finding (a one-line change in
     `rules/prepaymentUnpaid.ts`, allowed: it is a catalogue change, not a rewrite of session 1). If a
     new warning is listed, check which later phase owns its source before adding it; add it here
     only if it reads today's data, is small and no later phase claims it (at `60e2d1e` every listed
     warning has an owner: 19, 21, 27 or 40, see the dated section's (b)).
   - **Anything that would undo session 1** (a gate back, a Warning record removed, clearances
     moved onto the Booking): do not build it; report it as NEEDS OWNER in the PROGRESS entry and in
     your closing notes.
   - **US-13.7.2 placement.** If the catalogue now says where the to-do list sits, or that it is a
     separate dashboard screen, follow it instead of the right rail.
   - **US-13.7.3.** If a confirm step or a tap-to-read came back, stop and tell the owner before
     building one: the 2026-10-02 review rejected both.
   - **US-13.7.4.** If it came back into scope, stop and tell the owner: a settings page is a phase of
     its own, not an addition here.
   - **OQ-57 / D5.** If the answer changed back to a hard gate, stop and tell the owner.
3. If a covered item is now Retired or Future, drop it and say so in the PROGRESS entry.
4. **Open questions: none block this phase.** The points the catalogue still leaves open are built as
   follows, with no Provisional pill in the app (the stories are Confirmed; FT-13.7 is still Verify,
   which the ROADMAP open-questions table lists, but it was accepted in the room and its one open
   point, OQ-79 part 4, is Phase 32's, so this phase labels nothing provisional), and each goes on the
   "For the owner's review" list:
   - Where the to-do list sits (US-13.7.2 note): the Admin Day view's right rail, directly under the
     mini calendar, leaving room below it for Phase 31's Draft Lists panel and Phase 32's
     notification pool (OQ-79 part 4).
   - Whether clearing is recorded, and by whom (US-13.7.2 note): recorded (a stored clearance plus an
     audit row), office only (built in session 1).
   - Whether clearing on the to-do list also clears it on the Booking (US-13.7.2 note, Greg: "Don't
     worry about it"): one clearance per warning, so the Booking shows the same warning as cleared
     (neutral triangle, "Cleared by" line).
   - The unpaid prepayment's kind and strength (US-13.7.1, still "not yet set" at `60e2d1e`):
     before-procedure, strong (built in session 1). Phase 27 makes it escalate by date.
   - The usual submit sheet ("Submit this list to the office?") stays: it pre-dates warnings and
     says nothing about them, so it is not the confirm step US-13.7.3 removed (the gap analysis
     reads it the same way).
5. **Confirm session 1 is in place** and leave it as built: `src/domain/warnings/` (`types.ts`,
   `routine.ts`, `rules/index.ts` with `WARNING_RULES = [prepaymentUnpaidRule]`,
   `rules/prepaymentUnpaid.ts` with `PREPAYMENT_REQUIRED_TEXT` and `PREPAYMENT_UNPAID_TEXT`,
   `settings.ts` with `defaultAppSettings`), `store/warnings.ts` (`warningFactsFor`,
   `warningsForBooking`, `warningsForList`, `openWarnings`, `OpenWarningRow`,
   `warningSummaryByList`, `clearWarning`), the `appSettings` slice and `schedule.warningClearances`,
   `PERSIST_VERSION` 16, and the work item 6 grep returning nothing (no app code changed between
   `b342a7d` and `60e2d1e`, so the line numbers below hold). Confirm what session 1 left for
   session 2: `AdminApp.tsx`'s `prepaymentFlags` and the day grid's `$` corner with
   `data-shot="daygrid-block-prepayment"`, the Review screen's prepayment pills, the stop-gap banner
   in `BookingDetailBody`, no UI reader of `openWarnings` or `clearWarning`, no `WARNING_SAMPLES`,
   no `DEMO_TRIGGER_ACTOR`, the capture recipes still on the old hooks (US-08.2.2 still clicks the
   removed "Override gate", so its `--dry` run fails until work item 15), and a PROGRESS status row
   with no phase entry yet.
6. Record the result (the dated section's areas, anything step 1 showed after `60e2d1e`, D5 status,
   each built reading above, and any NEEDS OWNER item) in the PROGRESS entry.

## Reference

**Design (convention 17).** [Design Language.dc.html](../../../design/Design%20Language.dc.html) is
the token source. Mild warnings use the semantic warning tokens (`semantic.warning` solid
`#A16207`, tint, on-tint), strong warnings the semantic error tokens (`semantic.error`), and a
cleared warning neutral mist. Never the six schedule status colours, never crimson. Teal `#0D6E63`
is the only action colour (Clear, Open). Pills at radius 999.
[Admin Day.dc.html](../../../design/Admin%20Day.dc.html) is the layout reference for the right rail
and the grid blocks: the to-do list is one more rail card in the existing `RightRail` card anatomy.
[Mobile App.dc.html](../../../design/Mobile%20App.dc.html) screen 2 (the List's Booking stack) and
screen 3 (Booking detail) for the triangle and the warnings panel;
[Web Dashboard.dc.html](../../../design/Web%20Dashboard.dc.html) for the web table row;
[Admin Review.dc.html](../../../design/Admin%20Review.dc.html) for the Review rows. No mockup draws
a warning triangle: "much like the prototype does today" means extend the day grid's existing
attention marker (the amber outline and the 13px amber corner marker on Fitzgerald's Tue 21 Jul PM
block, `DayGrid.tsx` `GridBlock` ~289 and ~348-350) and the stop-gap banner's `TriangleAlert`; do not
invent a new visual language.

**Catalogue and analysis.**
- The items above. US-13.7.1's acceptance criteria are the core tests ("More than one", "Never
  blocks": saved, submitted, authorised all go through; session 1 covers the store side). US-13.7.2's
  "Appears" and "Cleared", and US-13.7.3's "Flag", "Visible on opening" and "No confirm step", are
  session 2's.
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Summary theme 6 ("Warnings, never blocks"), "Remove or
  rework", "Demo-trigger buttons" (Warnings) and the EP-13 table; per-gap detail in
  [epics/EP-13.md](../epics/EP-13.md#ft-13.7) (FT-13.7, US-13.7.1, US-13.7.2, US-13.7.3, re-graded
  against the session 1 code, and again at `60e2d1e`: each Partial, missing the UI).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md#dm-31) DM-31 (partly built;
  ListConflict stays List-level; its rule list now includes insurer-will-pay with no insurer
  Contract, DM-12, Phase 21) and DM-41 (the notification pool, Phase 32);
  [analysis/reverse-check.md](../analysis/reverse-check.md) RV-09.
- [analysis/prototype-map-admin.md](../analysis/prototype-map-admin.md) (Day view, right rail,
  List drawer, Review), [prototype-map-shared.md](../analysis/prototype-map-shared.md) (the Booking
  detail body, the submit sheet, the surface seam).
- The 2026-10-02 requirements review note
  (`requirements-board/requirements/notes/2026-10-02-aa-requirements-review-with-greg.md`) points 14 to 16, 45 to 47 and 73:
  the triangle "much like the prototype does today", no pop-up at submit ("Do we want to get in their
  way?"; the office sees the warning as a second check), warnings "flag the thing you're on... they
  don't come up", and thresholds as constants.
- The 2026-10-07 client meeting note
  (`requirements-board/requirements/notes/2026-10-07-aa-client-meeting.md`) points 10 and 24 (the
  shared notification pool agreed; one place for Draft Lists by date, both beside the to-do list) and
  19 (no warning on an anaesthetist's own hand-on). The change logs named in the dated section, for
  the List lifecycle (`2026-10-07-list-lifecycle-states.md`) and the prepayment wording
  (`2026-10-07-requirements-update.md`).
- PROGRESS.md Decisions log: **2026-07-22 "Second external plan review (Codex)"** ("pre-payment is
  now a REAL gate") and **2026-07-24 "Phase 09 build: decisions"** (the gate, the override, the
  mirror-based paid state). Session 1 removed the gate and the override; the entry that supersedes
  them is written in this session's PROGRESS entry. The mirror-based paid state stays.

**Code entry points (paths under `aa-prototype/src/` except `visual/…`, which is
`aa-prototype/visual/`; line numbers after session 1).**
- Built in session 1 (read, do not rewrite): `domain/warnings/*`, `store/warnings.ts` (selectors
  ~58-170, `clearWarning` ~173), `store/index.ts` ~79-87 (exports), `store/lifecycle.ts`
  (`completionBlockersFor`, billing-completeness only), `store/prepayment.test.ts`,
  `store/warnings.test.ts`, `domain/warnings/routine.test.ts`.
- Session 1's stop-gaps that session 2 replaces: `shared/booking/BookingDetailBody.tsx`
  (`prepaymentStatus` ~132, the `banners` block ~464-520 with the prepayment banner ~489-512 and
  `data-shot="booking-prepayment"`); `apps/admin/AdminApp.tsx` `prepaymentFlags` (~189-203, passed
  ~214); `apps/admin/outlet.ts:24`; `apps/admin/routes.tsx:74` (`prepaymentFlags` to `DayGrid`) and
  ~77 (`<RightRail>`); `apps/admin/components/DayGrid.tsx` (`prepaymentFlags` prop ~25, `FocusFilter`
  ~40, the "Pre-payment flagged" filter ~228, `GridBlock` ~278-358 with the attention outline ~289,
  the `!` corner ~348-350, the `$` corner ~354-356, `data-shot="daygrid-block-prepayment"` ~320);
  `apps/admin/reviewFlags.ts` (`ReviewPrepaymentStatus` ~43, the prepayment flags ~73-77);
  `apps/admin/screens/ReviewScreen.tsx:74`.
- Booking rows that get the triangle: `apps/mobile/screens/ListDetailScreen.tsx` (each row is a
  `<button>`, ~166-225); `apps/web/screens/ListDetailView.tsx` (table rows ~173-200, `onClick` opens
  the Booking); `apps/admin/components/ListDrawer.tsx` (the Bookings section ~75-92);
  `apps/admin/screens/ReviewScreen.tsx` (Booking rows); the Booking detail in `BookingDetailBody`
  (all three apps share it, through `useSurface().BookingLayout`, whose `banners` slot sits directly
  under the header).
- Submit, left as it is: `shared/flows/SubmitListSheet.tsx` (`mode: 'blockers' | 'confirm'`; the
  confirm mode, "Submit this list to the office?" ~107, is what mobile ~383 and web ~259 open).
- Right rail: `apps/admin/components/RightRail.tsx` (`MiniCalendar` ~48, `InternalNotes` ~193,
  `AwaitingReview` ~247, the local `Card` wrapper ~36), rendered by `apps/admin/routes.tsx`
  (`<RightRail>` ~77) from `useAdminOutlet()`; `apps/admin/layout.ts` (`ADMIN_RIGHT_RAIL_WIDTH`).
- List-level flags that stay separate: `domain/types.ts` `ListConflict` and `apps/admin/util.ts`
  `attentionReasons` (~111; the Fitzgerald surgeon-TBC case).
- Seed: `domain/seed/bookings.ts` (~820: Annette Riley on Souter Fri 24 AM, the unpaid exemplar;
  Priya Nair on Fri 24 PM is the paid one, `SEED_PREPAID_BOOKING_ID`); `domain/seed/index.ts`
  (`SEED_LIST_IDS`, `SEED_MARKERS`; Fitzgerald's Tue 21 PM patch ~230).
- Triggers: `shared/demoTriggers/registry.ts`, `types.ts` (`DemoTrigger`, `choices`, `badge`),
  `store/demoActors.ts` (`OFFICE_ACTOR` ~13, `SOUTER_ACTOR`, `OFFICE_SIMULATION_ACTOR` ~30; no demo
  actor yet); `pwa/pwaPurity.test.ts`.
- Tests that read the stop-gaps: `apps/admin/components/DayGrid.test.tsx`,
  `apps/admin/reviewFlags.test.ts`, `visual/admin-phase09.spec.ts` (re-pointed at the warning banner
  in session 1).
- Outside the app: the capture recipes that use `daygrid-block-prepayment`, "Pre-payment flagged",
  `booking-prepayment`, `card-gate` or "Override gate" (`requirements-board/capture/recipes/`
  US-06.2.1, US-06.2.2, US-06.3.1 to US-06.3.5, US-06.4.1, US-08.2.2), the absent placeholders
  US-13.7.1 to US-13.7.3, and `requirements-board/capture/ATLAS.md` (the Fri 24 text ~337-338 and
  the hooks list).

## Work items

### Session 1 · the routine, the settings record and the gate removal (built, commit `b342a7d`)

Kept as the record of what was built. Do not rewrite these; session 2 builds on them.

1. **Warning types** (`src/domain/warnings/types.ts`, pure, exported through
   `src/domain/warnings/index.ts`):

   ```ts
   type WarningKind = 'beforeProcedure' | 'afterProcedure'
   type WarningStrength = 'mild' | 'strong'
   type WarningRuleId = 'prepaymentUnpaid'        // 19, 21, 27, 40 widen the union
   interface WarningFacts {                       // everything a rule may read, built by the store
     booking: Booking; list: List; procedures: readonly Procedure[]
     prepaymentStatus: 'none' | 'required' | 'outstanding' | 'paid'
     todayISO: IsoDate
   }                                              // later phases add optional facts
   interface WarningFinding { kind: WarningKind; strength: WarningStrength; text: string; procedureId?: ProcedureId }
   interface WarningRule {
     id: WarningRuleId; label: string
     defaultParams: Readonly<Record<string, number>>
     evaluate(facts: WarningFacts, params: Readonly<Record<string, number>>): readonly WarningFinding[]
   }
   interface WarningClearance { key: string; bookingId: BookingId; ruleId: WarningRuleId; strength: WarningStrength; by: string; role: ActorRole; atISO: IsoDateTime }
   interface Warning extends WarningFinding { key: string; bookingId: BookingId; ruleId: WarningRuleId; clearance?: WarningClearance }
   ```

   The warning key is deterministic: `${bookingId}:${ruleId}` plus `:${procedureId}` for a
   per-Procedure finding (Phase 19's rule is one).
2. **The pure routine** (`src/domain/warnings/routine.ts`): `evaluateWarnings(facts, rules,
   settings, clearances)` runs every active rule, stamps each finding with its key, rule and
   Booking, attaches a clearance only when the stored clearance's strength is at least the
   finding's (a cleared mild warning that turns strong re-opens), and sorts strong before mild, then
   by rule order. A cancelled Booking yields no warnings. `WARNING_RULES` is the one registry;
   `isOpen(warning)`. Vitest in `routine.test.ts`.
3. **The first rule: unpaid prepayment** (`rules/prepaymentUnpaid.ts`): `required` or `outstanding`
   raises one before-procedure, strong finding (US-13.7.1 still says "not yet set": built this way
   and logged for the owner; 27 escalates by date), with "Prepayment required. No prepayment invoice
   has been raised yet." or "Prepayment invoice unpaid. Check with the patient before surgery
   starts."
4. **The app-settings record** (DM-31): `AppSettings.warningRules`, a top-level `appSettings` slice
   seeded from `defaultAppSettings()`, threaded through `AppState`, `freshAppState`, `backfillMerge`,
   `DomainPatch` and `resetDomainState`. No store action edits it and no screen shows it (US-13.7.4
   Future). Later phases add their params here (27 a strong-within-days value, 40 the alert
   threshold).
5. **Clearances and selectors** (`src/store/warnings.ts`): `schedule.warningClearances` keyed by
   warning key, outside the Booking; `warningFactsFor`, `warningsForBooking`, `warningsForList`,
   `openWarnings` (sorted by the Booking's List date, then strong first, then time),
   `warningSummaryByList`; `clearWarning(api, actor, bookingId, key)`, office only, refusing
   `notFound` and `alreadyCleared`, one audited `mutate()` with action `booking.warningCleared`
   ("Warning cleared").
6. **The gate and the override removed** (D5): the prepayment block in `completionBlockersFor`,
   `overridePrepaymentGate`, `PrepaymentOverrideSheet`, the `PrepaymentOverride` type,
   `Booking.prepaymentOverride`, the `'overridden'` status and their labels. Gate (re-run it in
   session 2): `grep -rniE` over `src` and `visual` for
   `overridePrepaymentGate|PrepaymentOverride|code(:| ===) 'prepaymentUnpaid'|override gate|gate overridden|is blocked until`
   returns nothing.
7. **"Never blocks" tests**: Annette Riley's Booking completes, saves, submits and authorises while
   its prepayment is required; raising the pre-procedure invoice changes the text; paying it removes
   the warning.
8. **Seed, persistence and re-green**: PERSIST_VERSION 15 to 16; seed test; the stop-gap banner on
   the Booking (the warning text, "A warning, never a block"); S4 Beat 1 patched to "read the
   warning, Mark complete".

### Session 2 · the surfaces, the triggers and the guide

Invoke the frontend-design skill before items 9 to 11 and 13 (see the prompt). Items 9 to 15 are
updated in place for the 2026-10-08 catalogue (see the dated section): the rule list the samples and
handoff name, no new user-facing "DRAFT" for an assigned List, no estimate or deposit wording, and the
ACC advisory left for Phase 18.

9. **Shared warning UI** (new `src/shared/warnings/`, exported from the `src/shared` barrel; reads the
   store through hooks, never owns domain state):
   - `useBookingWarnings(bookingId)` returning the Booking's warnings (open and cleared), memoised
     over `schedule`, `billing`, `appSettings` and `clock`.
   - `WarningTriangle`: a small marker "much like the prototype does today", drawn in the same
     anatomy as the day grid's corner marker on Fitzgerald's Tue 21 Jul PM block, with lucide
     `TriangleAlert`; coloured by the strongest open warning (mild: semantic warning amber; strong:
     semantic error red; only cleared ones: neutral mist), with a count when more than one. It is
     **not interactive** (US-13.7.3 removed tap-to-read): a `<span role="img">` with an `aria-label`
     that reads the count and the first text, a `title` listing the texts for a mouse hover, and
     `data-shot="booking-warning"`. Because it is not a button, it sits inside a row button with no
     nesting problem. Renders nothing when the Booking has no warnings.
   - `WarningsPanel` for the Booking detail: one row per warning (triangle, text, "Before
     procedure" or "After procedure", a Mild or Strong pill, and for a cleared one "Cleared by
     Kirsty W., Tue 21 Jul 10:05"), `data-shot="booking-warnings"`, with an accessible heading
     ("Warnings", with the count) so a screen reader meets it first. For an office actor, a teal
     **Clear** button on each open warning (calls `clearWarning`; a mild one reads "Clear
     (optional)"). The anaesthetist sees the rows and no Clear.
   - Component tests: two warnings render two rows, each with its own text; Clear shows only for the
     office; a cleared row shows its clearance line; the triangle renders no button and no dialog
     (no tap-to-read).
   - Copy: the panel and triangle show each rule's own text and add only "Warnings", the kind, the
     strength and the clearance line; nothing in `src/shared/warnings` names a List state or calls
     the prepayment an estimate or a deposit.
10. **The triangle on every Booking surface, and the warning visible on opening** (US-13.7.3
    "Flag" and "Visible on opening").
    - **Mobile** `ListDetailScreen`: the triangle inside each Booking row button, beside the Capture
      pill or tick. Tapping the row opens the Booking as today.
    - **Web** `ListDetailView`: the triangle in the patient-name cell of each table row; clicking the
      row opens the Booking as today.
    - **Admin**: the List drawer's Booking rows, the Review screen's Booking rows and
      `AdminBookingDetail` (shared body). The Review screen drops its prepayment pills
      (`reviewFlagsForBooking` keeps the non-warning flags: not completed, no billing reference, the
      ACC advisory, which Phase 18 removes (RV-20), manual overrides) and shows the triangle instead;
      drop `prepaymentStatus` from `ReviewBookingInput`. Later rules (21's insurer-will-pay at office
      review among them) then show on Review through the same triangle with no Review change.
    - `BookingDetailBody`: `WarningsPanel` renders **first** in the `banners` slot, directly under the
      Booking header, so on a 375 x 812 phone the warning is on screen the moment the Booking opens,
      with no scroll and no tap (mild amber tint, strong red tint, as the stop-gap banner is today).
      The stop-gap prepayment banner's required and outstanding states fold into it; the office's
      "Raise pre-procedure invoice" button stays on the prepayment warning's row (until Phase 27
      generates the prepayment invoice at setup, held for the office to approve and send); the paid
      state keeps its success note ("The prepayment invoice has been paid."). Keep `data-shot="booking-prepayment"` on the prepayment row (and on the paid
      note) so the capture recipes still find it. The Booking header shows the triangle too.
11. **The Day view: outline down to the Booking.** In `AdminApp.tsx` replace `prepaymentFlags` with
    `warningFlags` from `warningSummaryByList(state, selectedDate)` (and in `outlet.ts` and
    `routes.tsx`). In `DayGrid`: a block's `needsAttention` is `attentionReasons(list).length > 0`
    **or** an open warning; the outline is the error colour when the strongest open warning is
    strong, the amber attention colour otherwise; the `$` corner becomes a triangle with the open
    count (title "N open warnings"); `data-shot="daygrid-block-warnings"` replaces
    `daygrid-block-prepayment` on the **block button itself** (as today, so recipes can click it to
    open the List), set when the List has an open warning; the "Pre-payment flagged"
    filter becomes "Has warnings" (`FocusFilter` `'warnings'`). `ListConflict` and
    `attentionReasons` stay List-level (DM-31): Fitzgerald's Tue 21 PM block keeps its amber `!`
    exactly as today. In `ListDrawer`, a Booking row with an open warning gets the same outline colour
    and the triangle, so the outline visibly carries down from the List to the Booking; the outlined
    row carries `data-shot="drawer-booking-warning"`. Update `DayGrid.test.tsx`.
12. **No confirm step at submit** (US-13.7.3 "No confirm step", Confirmed 2026-10-02). The warning
    confirm step the earlier plan put here is dropped. `SubmitListSheet` is left exactly as it is:
    it reads no warnings, shows no warnings section, no "Submit anyway" and no extra step;
    Mark complete on a single Booking adds none either. Add one component test: a List whose Booking
    carries an open strong warning opens today's "Submit this list to the office?" sheet with no
    warning text, and its Submit submits. Record the reading in the PROGRESS entry (the usual submit
    sheet pre-dates warnings and is not the confirm step the room removed) and put it on the owner's
    review list.
13. **The to-do list** (US-13.7.2) in `RightRail.tsx`, a new `WarningsToDo` rail card directly under
    `MiniCalendar` (`data-shot="admin-warnings-todo"`). Heading "To-do" with the open count; no
    Provisional pill. Rows from `openWarnings`, every date: triangle, the text, then patient,
    anaesthetist surname (`drSurname` from `shared/format.ts`) and date and session; an **Open**
    link to `/admin/day/:dateISO/bookings/:bookingId` (a verb on the row, `aria-label` "Open
    <patient>'s Booking", never a List state label); a teal **Clear** (a mild row says "Clear
    (optional)"). The first six rows, then "Show all (n)" expanding in place. Empty state: "Nothing
    needs attention." A cleared row leaves the list at once. Warnings only: nothing that needs no
    action is listed here (FT-13.7; notices go to Phase 32's pool), and the card leaves room below it
    for Phase 31's Draft Lists panel (US-01.6.2, every Draft List in one date-sorted place) and Phase
    32's notification pool (US-13.8.1), both confirmed by Vanessa on 2026-10-07: build the rail so two
    more cards stack under the To-do card without moving it. The not-preferred pairing notice (Phase
    17) is never a to-do row. `routes.tsx` passes it to
    `RightRail` from `useAdminOutlet()` as it does `notes` and `reviewRows` (add the rows, or the
    inputs to derive them, to `AdminOutletContext`; Clear uses the outlet's office `actor`).
    Component test: a new warning appears ("Appears"), Clear removes it and writes the audit row
    ("Cleared").
14. **Register the demo triggers** (see Demo triggers) in `src/shared/demoTriggers/registry.ts`,
    with bodies in `src/store/warningSamples.ts`:
    - `WARNING_SAMPLES`: one entry per rule, `{ ruleId, isStaged(state, bookingId), stage(api, actor, bookingId), unstage(api, actor, bookingId) }`.
      The prepayment sample stages the condition through the audited `editProcedure` (the Booking's
      first Procedure in `proceduresForBooking` order, since there is no primary flag until Phase 23,
      becomes `billingRoute: 'billableParty'`, `patientPaymentCategory: 'selfFundedPrepayment'`,
      `prepaymentDetail: { type: 'full' }`; the detail keeps the Booking billing-complete, since
      `validateBookingForBilling` requires it for that category) and unstages it by restoring those
      three fields from the pristine seed (`buildSeed()`, cached and deterministic, so unstage works
      after a reload too). `isStaged` is true when those fields differ from the seed and hold the
      sample's values; a Booking whose seed already raises the rule (Riley) is not a target. Unstage also deletes the clearances of the
      warning keys it staged (one audited `mutate()`, action `booking.warningSampleUnstaged`,
      labelled "Sample warning removed" so the label scan stays green), so raising the samples again
      shows them open. Phase 20 deletes the staged fields and re-points this sample at the Booking's
      prepayment flag; Phase 27 re-points it at the prepaid set: say so in the handoff.
    - Pinned sample targets in `domain/seed/index.ts`: `SEED_WARNING_SAMPLE_BOOKINGS`, two Bookings
      on the demo day's assigned, unsubmitted Lists (state `'DRAFT'` in today's code, which Phase 15b
      renames ACTIVE; no user-facing text here says "DRAFT") (`SEED_LIST_IDS.rutherfordAm21` and `rutherfordPm21`, or the
      nearest Lists with Bookings) that no Booking-level `SEED_MARKERS` scenario and no S1 to S5 beat
      in `docs/demo-guide/03-demo-script.md` uses (`allDayBooking` marks the Rutherford List itself,
      which is fine), plus `multiWarning`: the Booking every rule's sample also lands on, so it carries
      two warnings as soon as a second rule exists. Do not pick a Booking Phase 15b's Copy removal
      touches. A test pins them and proves none is a scenario Booking.
    - Actor: add `DEMO_TRIGGER_ACTOR` (`{ who: 'Demo actions', role: 'system', source: 'demo' }`) to
      `demoActors.ts` (later phases, 40 among them, use this name), so the audit never shows the
      office doing the staging. `editRefusal` lets a system actor edit DRAFT (ACTIVE after 15b) and
      SUBMITTED Lists and refuses AUTHORISED ones, which is the trigger's disabled state.
    - Later samples, named in the handoff and in the trigger's description, are not built here: 19
      out-of-range base units, 21 a child as the payer on the Booking and insurer-will-pay with no
      insurer Contract, 27 a prepaid procedure with no price on the anaesthetist's own Contract (and
      its escalation), 40 a paying patient with a balance.
    - Registry Vitest: each entry matches only its routes; disabled reasons fire; stage then unstage
      returns the Bookings' Procedures to their seed values and leaves no clearance for the staged
      keys; "Office clears this warning" never shows for `'bar'`; the sample entries show for both
      surfaces on the mobile Booking route.
15. **Re-green and close out:** `npm run build`, `npm run build:pwa` (purity: `src/shared/warnings`
    and `warningSamples.ts` stay inside `src/shared` and `src/store`), `npx vitest run`,
    `npm run shots`; add `visual/warnings.spec.ts` (stage samples on Admin Day, the to-do list fills,
    the drawer row shows the triangle and outline, Clear empties a row; on mobile at 375 x 812 Riley's
    row shows the triangle, and opening her Booking shows `booking-warnings` inside the viewport with
    no scroll; submitting her List shows the usual sheet with no warning text and submits) with the
    five `data-shot` hooks (`booking-warning`, `booking-warnings`, `admin-warnings-todo`,
    `daygrid-block-warnings`, `drawer-booking-warning`). Re-run the work item 6 grep, and grep `src` for `Submit anyway` and
    `carry warnings` (both return nothing). Update the capture recipes (the list is in "Catalogue
    screenshots"), update ATLAS.md's Fri 24 text and hooks, and run `npm run verify:board`; the images
    are re-captured in the Catalogue screenshots step. Copy sweep: no en or em dash in any new string,
    no new user-facing "DRAFT" for an assigned List, and no new string saying "estimate" or "deposit"
    about the prepayment (grep the diff's added lines in `src`).

## Demo triggers

All registered through the Phase 14 registry. None is added to the Control Panel page; its index
lists them under their screens.

Trigger ids (the capture recipes' `{ "trigger": "<id>" }` steps and ATLAS.md use them):
`raise-sample-warnings`, `clear-sample-warnings`, `office-clears-warning`.

1. **"Raise sample warnings"** · Admin · Day (`/admin/day/:dateISO`) and Admin · Booking detail
   (`/admin/day/:dateISO/bookings/:bookingId`), surfaces bar; and Mobile · Booking
   (`/mobile/lists/:listId/bookings/:bookingId`), surfaces bar and pwa (the PWA equivalent, which
   Phase 19's sample also assumes) · on the Day view, runs every `WARNING_SAMPLES` entry on the pinned
   sample Bookings on the demo day (Tue 21 Jul), so the to-do list and the triangles populate; on a
   Booking (Admin or mobile), stages them on the Booking in the URL. Disabled when every sample is
   already staged on its targets ("Samples already raised"), on a Booking whose List is AUTHORISED
   ("This Booking's List is authorised"), on a Booking the pristine seed does not hold ("Samples
   stage on seeded Bookings only", since unstage restores seed values), on a cancelled Booking or one
   with no Procedure ("Nothing to stage on this Booking"), or on a Booking whose seed already raises
   every sample's rule ("This Booking already carries these warnings", Riley's case). `indexPath`
   `/admin/day/2026-07-21`. Each phase that adds a rule adds its sample here (19 out-of-range base
   units; 21 a child as the payer on the Booking, and insurer-will-pay with no insurer Contract; 27 a
   prepaid procedure with no price on the anaesthetist's own Contract; 40 a paying patient with a
   balance), and from the second rule on the `multiWarning` Booking shows two warnings. In this phase, with one rule, a Booking with
   two warnings is proven by Vitest and the component tests, not on screen; the message says so
   honestly ("1 rule registered").
2. **"Clear sample warnings"** · the same screens and surfaces · undoes the staging (restores the
   sample Bookings' seed values and drops the staged warnings' clearances; the warnings disappear).
   Its description says it undoes the samples and is not the office's Clear on the to-do list.
   Disabled when nothing is staged.
3. **The S4 Beat 1 Booking** (Annette Riley, Souter Fri 24 Jul AM, prepayment required): the seed
   already raises the warning, so the triangle, the warning on opening, the to-do entry, completing
   and submitting (straight through, no confirm step) need no new button.
4. **"Office clears this warning"** · Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`)
   · surfaces pwa only · badge `office-stand-in` · `choices` are the Booking's open warnings (shown
   as tappable rows when there is more than one) · `clearWarning` as `OFFICE_SIMULATION_ACTOR`, so
   the audit shows the simulated office. Disabled "No open warnings on this Booking". The PWA
   equivalent of the presenter clearing it from Admin's to-do list.

## Out of scope

- Anything in session 1 (work items 1 to 8): built and frozen.
- A confirm step at submit or at Mark complete, and a tap-to-read popover or sheet on the triangle
  (US-13.7.3 removed both).
- The settings page for thresholds, active warnings and check steps (US-13.7.4, Future): the
  app-settings record has no UI.
- Every other warning rule: base units out of range (19, which also turns the out-of-range refusal in
  `validateBookingForBilling` into a warning), a child as the payer on the Booking and an
  insurer-will-pay Booking with no insurer Contract (21), the prepayment escalation by date, a
  prepaid procedure with no price on the anaesthetist's own Contract, the re-checks and the
  prepayment invoice generated at setup (27), a paying patient with a balance and its threshold (40).
  Do not build their rules or samples here.
- The prepaid amount, its wording and the prepayment beat beyond the warning (27 rewrites them: the
  anaesthetist's own fixed price, no estimate, no deposit, nothing raised automatically afterwards).
- Renaming the List state DRAFT to ACTIVE (Phase 15b, next) and the Draft List state (Phase 31).
- The shared notification pool and any notice that needs no action (FT-13.8, Phase 32).
- Copy a Booking and photo capture (Phase 15b removes them next): leave the Copy banner and button in
  `BookingDetailBody` untouched.
- The ACC advisory and the other `reviewFlagsForBooking` pills: they stay Review flags (Phase 18
  removes the ACC one, RV-20).
- `ListConflict` and the List-level attention reasons (DM-04, Phases 28 to 30).
- Draft Lists on the dashboard (Phase 31); the rail leaves room for them.
- The not-preferred pairing notice when the office assigns or moves a List (Phase 17's helper; never
  a warning rule or a to-do row).
- Emails about warnings, a nav badge count, and warnings on the anaesthetist's Lists home rows (only
  Booking rows carry the triangle).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin → Day → Fri 24 Jul: Souter AM has the strong (red) outline and a triangle with
      "1" where the `$` was; the drawer's Annette Riley row carries the same outline and a triangle;
      the "Has warnings" filter isolates it. Admin → Day → Tue 21 Jul: Fitzgerald's PM block keeps
      its amber `!` (List-level, unchanged).
- [ ] The right rail's To-do card lists Annette Riley's "Prepayment required" warning with Open and
      Clear, and no Provisional pill; Open lands on her Booking detail with the warnings panel at the
      top and "Raise pre-procedure invoice" on its row; no "Override gate" anywhere.
- [ ] Mobile (375 x 812) → Souter Fri 24 Jul AM: Riley's row shows the triangle; tapping the
      triangle does nothing of its own (no sheet, no popover); tapping the row opens her Booking
      with the warnings panel on screen at once (text, Before procedure, Strong), no scroll needed.
      Mark complete: it completes.
- [ ] Submit the List: the usual "Submit this list to the office?" sheet, with no warning section,
      no "Submit anyway" and no extra step; it submits.
- [ ] Admin: Review the List: Riley's row shows the triangle and no prepayment pill; Authorise: it
      goes through with the warning still shown.
- [ ] Admin to-do: Clear Riley's warning: it leaves the list, the day-grid outline drops, the triangle
      on mobile turns neutral and her Booking's panel row reads "Cleared by Kirsty W." with a time;
      Audit and the Booking's History show "Warning cleared".
- [ ] Raise the pre-procedure invoice on Riley (after a reset, before clearing): the text changes to
      "Prepayment invoice unpaid"; pay it via the Payment received trigger on its invoice: the
      warning goes from the panel, the to-do list, the drawer and the grid together.
- [ ] Web → Souter Fri 24 AM List: the triangle shows in Riley's table row; clicking the row opens the
      Booking with the warnings panel at the top.
- [ ] Admin Day Tue 21: "Raise sample warnings" in Demo actions stages the samples; the to-do list and
      the triangles fill; "Clear sample warnings" removes them; both disable correctly. Clear one
      sample from the to-do list, Clear sample warnings, raise again: it is open again.
- [ ] PWA: on a seeded mobile Booking with no warning, the Demo sheet's "Raise sample warnings" puts
      the triangle and the panel on it; "Clear sample warnings" removes them.
- [ ] PWA (`npm run dev:pwa`): on Riley's Booking the Demo sheet offers "Office clears this
      warning"; it clears and the triangle turns neutral; the entry is absent on a Booking with no
      warnings.
- [ ] No new app copy contains an en or em dash, a user-facing "DRAFT" for an assigned List, or the
      word "estimate" or "deposit" about the prepayment; teal is the only action colour; mild amber,
      strong red, never a status colour or crimson; no Provisional pill on any warning surface; the
      work item 6 grep and the `Submit anyway` / `carry warnings` grep return nothing.
- [ ] The right rail at 1440 wide: the To-do card sits under the mini calendar with room below it
      (Internal notes and Awaiting review still follow); Review still shows the ACC advisory pill
      where it did (Phase 18 removes it).
- [ ] Catalogue screenshots: the recipes for US-13.7.1, US-13.7.2 and US-13.7.3 are created, the
      prepayment recipes this phase broke (US-06.2.1, US-06.2.2, US-06.3.1 to US-06.3.5, US-06.4.1,
      US-08.2.2) are re-pointed, a full `npm run capture` ends with no failed recipe and no story
      without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board`
      is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and
      `npm run verify:board` green.

## Demo guide updates

Session 1 already patched S4 Beat 1 to "read the warning on her Booking, Mark complete" in
`03-demo-script.md`, the cheat sheet section 8, the workflows "Pre-payment" case and the master guide.
Session 2 adds the surfaces, with no confirm step anywhere. Under the 2026-10-08 catalogue, no line
this session writes calls the prepayment an estimate or a deposit, narrates a balance invoice, or
calls an assigned List "DRAFT"; the existing "full or split pre-payment" line in the workflows
"Pre-payment" case and the rest of the prepayment beat are Phase 27's to rewrite (the anaesthetist's
own fixed price, generated at setup, approved and sent), so leave them, and do not extend them:

- `docs/demo-guide/03-demo-script.md` **S4 Beat 1** "Prepayment warning": Click: Mobile → Dr Souter's
  Fri 24 Jul AM List → the triangle on Annette Riley's row → open her Booking: the warning is at the
  top → Mark complete → Submit (it goes straight through); then Admin Day → Fri 24 → the Souter AM
  outline and the drawer row → the To-do card → Clear. Say: "A warning, never a block, and no pop-up
  in the way. The anaesthetist sees it when they open the Booking, the night before, while the
  surgeon can still be told; the office sees it on its to-do list as a second check. AA decided not
  to block (OQ-57)." Expected: completion and submit go through with no extra step; the warning is in
  both apps and leaves the to-do list when cleared. Name the warning by its on-screen text
  ("Prepayment required"), not by an amount. The S4 "Discovery points" line already reads
  "which conditions warn, and how strongly"; add "where the to-do list sits on the dashboard".
- `04-presenter-cheat-sheet.md` section 8 "Pre-payment": keep session 1's wording; add a one-line
  "Warnings" entry: one routine, a to-do list in Admin, a triangle on Bookings, the warning at the top
  of the Booking, never a block and no confirm step.
- `02-workflows-and-handoffs.md`: add a short "Warnings and the to-do list" workflow (where warnings
  come from, who sees them, the to-do list with Clear, no confirm step; notices that need no action
  go to the notification pool when Phase 32 builds it; later rules: out-of-range base units, a child
  as the payer, insurer-will-pay with no insurer Contract, a prepaid procedure with no price, a
  paying patient with a balance, each added by its phase).
- `01-personas-and-responsibilities.md`: the office's daily duties gain "work the to-do list".
- `master-demo-guide.html`: the same passages (the readiness row ~527 gains the warnings surfaces,
  the pre-payment note ~744, S4 Beat 1 ~928-931, the S4 discovery callout, cheat sheet card 8 ~1118).
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx` S4 scenario text (~311): "(1) Mobile, Souter Fri 24 AM, Annette Riley: see
  the triangle, open the Booking and read the warning, Mark complete and submit (no block, no confirm
  step), then clear it from the Admin to-do list".
- `requirements-board/capture/ATLAS.md` Fri 24 text (~337-338), the hooks list and the "Demo
  actions by screen" table.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 15a` first (from the repo root):
earlier phases may have changed these recipes since this plan was written. Riley's Booking is
`BK0038` in today's recipes (US-06.3.2); confirm the id against the seed before pinning it.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md) Warning routine | absent placeholder ("Not built yet: catch-up Phase 15a builds this") | create. Status partial: only the unpaid prepayment rule exists; say in the reason that later phases add theirs: out-of-range base units (19), a child as the payer on the Booking and insurer-will-pay with no insurer Contract (21), a prepaid procedure with no price on the anaesthetist's own Contract (27) and a paying patient with a balance (40). No estimate or deposit wording in the caption or reason. Admin shot `warning-text` at `/admin/day/2026-07-24/bookings/BK0038` (Annette Riley), highlight `[data-shot=booking-warnings]`, caption "One routine raises each warning, with its text, kind and strength". No mobile tap shot (the triangle has no tap-to-read) |
| [US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md) Warnings on the dashboard to-do list | absent placeholder (as above) | create. Status captured. Admin shot `todo-list` at `/admin/day/2026-07-24`, highlight `[data-shot=admin-warnings-todo]` (the card under the mini calendar), states `open` ("Open warnings on the to-do list") and `cleared` (click the row's Clear: "A cleared warning leaves the to-do list"), and `samples` (at `/admin/day/2026-07-21`, step `{ "trigger": "raise-sample-warnings" }`, so the list shows several rows) |
| [US-13.7.3](../../../../requirements-board/requirements/stories/US-13.7.3.md) Warning flag on a Booking | absent placeholder (as above) | create. Status captured. Shot `warning-triangle` on mobile (`/mobile/lists/L-34821-2026-07-24-AM`, Riley's row) and web (`/web/lists/L-34821-2026-07-24-AM`, Riley's table row), one state each, highlight `[data-shot=booking-warning]`, caption "A small warning triangle on the Booking, much like the day grid's marker"; mobile shot `warning-on-open` (click "Annette Riley", wait for `[data-testid=slide-booking] [data-shot=booking-warnings]`, highlight it: "Opening the Booking shows its warning at the top"); admin shot `outline-down` at `/admin/day/2026-07-24` with the Souter AM List drawer open (click `[data-shot=daygrid-block-warnings] >> nth=0`), highlight `[data-shot=drawer-booking-warning]` ("The Day view outline extends down to the Booking"). No submit or confirm shot: "No confirm step" is proven by the component test and `visual/warnings.spec.ts` |

**Recipes this phase breaks.** Work item 15 re-points them; this section is the list. The day
grid's `daygrid-block-prepayment` becomes `daygrid-block-warnings` (the "Pre-payment flagged"
filter button becomes "Has warnings"), while `booking-prepayment` stays on the prepayment row.

**Stale captions (2026-10-08).** Several of these recipes carry captions for behaviour the catalogue
has since retired (an estimated full fee, a deposit, a balance invoice after the procedure: US-06.2.3
to US-06.2.5 and US-06.4.2 Retired). Their shots still show that behaviour after this phase, because
Phase 27 (US-06.2.2, US-06.3.1, US-08.2.2) and Phase 41 (US-06.4.1) rebuild those screens and replace
the shots and captions then. So this phase changes only the steps and hooks it breaks, and in every
recipe it edits, a caption that describes retired behaviour is marked as such rather than restated as
current, in the pattern US-06.2.2's first shot already uses ("Older screen, ..., which is no longer
allowed"). Captions it rewrites itself (US-06.2.1, US-06.3.3) describe the warning and never say
estimate, deposit or gate:
- `US-06.2.1` (`prepayment-flag`, mobile and web): caption "Booking flagged Pre-payment required";
  keep the hook, reword the caption to the warning ("The Booking carries a prepayment warning"). Its
  `absentReason` (no per-anaesthetist prepaid set) stays true until Phases 26 and 27.
- `US-06.2.2`, `US-06.3.1`, `US-06.3.4`, `US-06.3.5`, `US-06.4.1`: click
  `[data-shot=daygrid-block-prepayment]` to open the List; point them at `daygrid-block-warnings`.
  Mark as older screens the retired captions they carry: US-06.2.2 "Pre-procedure invoice for the
  estimated full fee", US-06.3.1 "Pre-procedure invoice, full estimated fee", US-06.4.1 "Balance
  invoice after the procedure, final fee less the paid prepayment" (the prepaid amount is now the
  anaesthetist's own fixed price, with nothing invoiced automatically afterwards). US-06.3.5's
  payment-category captions stay for Phase 20.
- `US-06.3.2`: clicks "Pre-payment flagged" and highlights `daygrid-block-prepayment`; use "Has
  warnings" and the new hook. Its `received` state keeps the prepayment row hook. Drop "overridden"
  from its `absentReason` (session 1 removed that status).
- `US-06.3.3` (the story is Retired, merged into US-06.3.2, but its recipe still renders the two
  images US-06.3.2 lists by path: `assets/US-06.3.3/admin-day-grid-flag.png` and
  `assets/US-06.3.3/mobile-card-gate.png`): both shots (day-grid flag; mobile `card-gate`, caption
  "The anaesthetist sees the unpaid pre-payment on the Booking") now show the warning, not a gate.
  Point the first at `daygrid-block-warnings` and the second's highlight at
  `[data-shot=booking-warnings]`, but **keep both shot names** (`day-grid-flag`, `card-gate`):
  renaming one changes its file name, capture prunes the old file and `npm run check` then fails on
  US-06.3.2's missing image. Reword the two captions in the recipe and the same two captions copied
  into US-06.3.2's `images` list (caption text only, no other catalogue edit), and drop the
  "completion is blocked" text from the recipe's `absentReason` (it stays partial: no date
  escalation until 27).
- `US-08.2.2`: clicks "Override gate" twice (deposit and balance invoice shots), already broken since
  session 1; remove those steps, and mark both captions ("The pre-payment deposit invoice raised
  before the procedure", "Balance invoice less the pre-payment deposit already invoiced") as older
  screens: Phase 27 replaces them with the prepaid Procedure priced at the prepaid amount, leaving
  nothing to bill.
- Every other recipe that clicks "Raise pre-procedure invoice" (US-09.2.1, US-09.2.3, US-09.2.4,
  US-09.3.4, besides the US-06 and US-08.2.2 ones above) keeps working because the button stays on
  the prepayment warning's row; the `--dry` run is the check.

**ATLAS.md.** Seed data worth shooting (the Fri 24 paragraph: Annette Riley's Booking, a warning
with no gate, the triangle and the to-do entry), Routes if the to-do rail changes the Day view row,
Existing hooks (`booking-warning`, `booking-warnings`, `admin-warnings-todo`,
`daygrid-block-warnings`, `drawer-booking-warning`; `daygrid-block-prepayment` removed), and the
"Demo actions by screen" table (`raise-sample-warnings` and `clear-sample-warnings` on
`/admin/day/<date>`, its Booking detail and a mobile Booking; `office-clears-warning` in the PWA-only
paragraph).

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npm run build:pwa` / `npx vitest run` /
`npm run shots` are green, and before writing the PROGRESS entry, run the standard adversarial
review-and-fix pass (PROGRESS convention 18): independent Opus review subagents for **quality**,
**bugs/correctness** and **plan adherence**, over the whole phase (sessions 1 and 2). This session
verifies every finding against the catalogue and the code, fixes the confirmed ones with a test where
a bug had none, re-greens and records the pass. A confirmed bug in session 1 code is fixed in place
with a test; session 1's design is not re-opened. Do not re-raise anything settled in the Decisions
log, except the prepayment completion gate and override this phase supersedes.

**Steer this phase's reviewers at:**
- **Never blocks, never in the way:** no path refuses because of a warning (complete, submit,
  authorise, billing run, edit); no confirm step at submit or at Mark complete; the triangle is not
  interactive and opens nothing; no residue of the gate (the work item 6 grep);
  `completionBlockersFor` is billing-completeness only.
- **Visible on opening:** the warnings panel is first in the Booking detail's banners on mobile, web
  and Admin, and on screen at 375 x 812 without scrolling.
- **Purity and pluggability:** the routine and rules in `src/domain/warnings` import nothing from
  the store or React; a new rule needs a rule file, a registry entry, its facts, its app-settings
  defaults and a sample, and no UI change. Try adding a throwaway rule in a test to prove it.
- **Clearances:** keyed by warning, re-open at a higher strength, office only, audited, never
  mutate a Booking (the AUTHORISED lock and `lastModifiedBy` untouched), emptied by reset.
- **Consistency across surfaces:** mobile, web, PWA and Admin show the same warnings from the same
  selector; the day-grid count, the drawer, the to-do list, the panel and the triangle agree after
  clearing and after a payment; the to-do list holds warnings only; no nested interactive elements;
  keyboard and screen-reader labels.
- **Persistence and determinism:** no new persisted shape in session 2 beyond what the triggers need
  (if any, bump `PERSIST_VERSION`); the routine uses the demo clock only.
- **Triggers:** samples stage and unstage through audited actions as a demo actor, show only on their
  routes, disable correctly; the PWA stand-in is pwa only and badged; purity test green.
- **Design and copy:** semantic warning and error tokens, teal-only actions, the triangle in the day
  grid marker's anatomy, no Provisional pills, no en or em dashes, S4 Beat 1 in the guide matches the
  running app.
- **2026-10-08 catalogue:** no new user-facing "DRAFT" for an assigned List (15b renames it next), no
  new "estimate" or "deposit" about the prepayment in app copy, the guide or the recipes this phase
  rewrites, retired captions marked as older screens rather than restated, the rail leaving room for
  31's Draft Lists and 32's pool, and nothing in session 2 that undoes session 1 (any such finding is
  NEEDS OWNER, not a fix).

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the built readings of points the catalogue leaves open (the to-do list in the Day
  view's right rail; clearing recorded, office only, and shown as cleared on the Booking; the
  prepayment warning before-procedure and strong; the usual submit sheet kept as not being the
  removed confirm step), anything logged rather than fixed, and the screens worth a look, each with
  its route and persona (Admin Day Fri 24 with the To-do card, Riley's mobile Booking on opening,
  the drawer outline).
- Catch-up status row for Phase 15a set to DONE and a phase entry covering both sessions: the
  drift-check result against `3d3a18c` (US-13.7.3's confirm step and tap-to-read dropped, FT-13.7's
  notices to the pool, the three stories Confirmed) and, from the dated section, what `60e2d1e`
  changed for session 2 (areas (a) to (h): the later rules renamed and extended, ACTIVE coming in
  15b, the rail's room confirmed, no estimate or deposit wording, the ACC advisory left for 18,
  session 1 untouched), anything the drift check showed after `60e2d1e`, any NEEDS OWNER item, D5's
  status, each built reading, the session-1 stop point, the checklist item by item, test counts, the
  review pass.
- **Decisions log:**
  - Supersede **2026-07-22 "pre-payment is now a REAL gate"** and the gate and override parts of
    **2026-07-24 "Phase 09 build: decisions"**: no completion gate and no override; an unpaid
    prepayment is a before-procedure warning (D5, OQ-57, US-06.3.2 "no block").
  - "Warnings are derived by one pure routine; only clearances are stored" (in
    `schedule.warningClearances`, outside the Booking, so clearing never touches a locked Booking),
    with the re-open-at-higher-strength rule.
  - "Rule parameters live in `appSettings`, not `DemoSettings`; no settings page (US-13.7.4 Future)."
  - "No confirm step and no tap-to-read (US-13.7.3, 2026-10-02): the triangle is a marker, the
    warning shows at the top of the Booking on opening, and the usual submit sheet is unchanged."
  - "The to-do list holds warnings that need action only; notices go to the shared notification pool
    (FT-13.7, Phase 32)."
- **Binding conventions:** add one line: a check that should alert, not stop, is a warning rule in
  `src/domain/warnings` with a sample in `src/store/warningSamples.ts`; it never becomes a blocker or
  a confirm step.
- **Catalogue screenshots:** the recipes created or changed (US-13.7.1 to US-13.7.3 and the prepayment
  recipes), the `REPORT.md` counts before and after (captured, partial, absent, failed), and the
  partial reason on US-13.7.1 handed to Phases 19, 21 and 40.
- **Handoff notes:** 19 (out-of-range base units), 21 (a child as the payer on the Booking, and
  insurer-will-pay with no insurer Contract, D28's default), 27 (date escalation, and a prepaid
  procedure with no price on the anaesthetist's own Contract, D27's default) and 40 (a paying patient
  with a balance) each add their rule, its facts, its params and its sample (the `multiWarning`
  Booking then shows two warnings); 20 removes the fields the prepayment sample stages and re-points
  the sample at the Booking's office-set prepayment flag, and 27 re-points the sample and the rule at
  the prepaid set; 15b renames the sample targets' List state DRAFT to ACTIVE with the rest of the
  code and removes Copy from the Booking detail around the warnings panel; 18 removes the ACC
  advisory from Review (RV-20); 27 and 41 replace the prepayment recipes' older-screen captions; 31's
  Draft Lists panel and 32's notification pool sit below the To-do card and must not displace it;
  17's not-preferred notice and 32's List-move notices never go to the to-do list.
