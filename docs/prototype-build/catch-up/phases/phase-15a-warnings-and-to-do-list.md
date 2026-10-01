# Phase 15a · Warnings and the to-do list

**Requirements covered:**
[FT-13.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.7.md) Warnings and the to-do list,
[US-13.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.1.md) Warning routine,
[US-13.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.2.md) Warnings on the dashboard to-do list,
[US-13.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.3.md) Warning flag on a Booking;
[DM-31](../analysis/domain-model-delta.md#dm-31) one warning routine and a Warning record on the Booking.
Treated here without closing it: [RV-09](../analysis/reverse-check.md) (the completion-gate part only;
Phase 27 closes the rest of the prepayment reading).
Read alongside (rules that later phases register): [US-06.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.2.md)
(unpaid prepayment, Confirmed, "no block"; the date escalation is Phase 27's),
[US-03.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.1.md) (19),
[US-11.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.4.md) (21),
[US-11.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.2.md) (40).
Out of scope by status: [US-13.7.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.4.md)
(the settings page, Future).
Owner decision: **D5** ([OQ-57](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-57.md),
answered 2026-10-01: no prepayment block, a clear warning in both apps).
**Depends on:** Phase 14 (the trigger registry in `src/shared/demoTriggers/`, `useDemoTriggerContext`,
the PWA demo-actions sheet and the shared actors in `src/store/demoActors.ts`) and Phase 15 (Card
becomes Booking: every name below is its post-15 form, from the name map in Phase 15's work item 2:
`Booking`, `schedule.bookings`, `shared/booking/BookingDetailBody.tsx`, `completeBooking`,
`reviewFlagsForBooking`, `AdminBookingDetail`, routes `…/bookings/:bookingId`, audit `booking.*`).
Runs before 16 (so the first milestone shows warnings) and before 19, 21, 27 and 40, which each
register a rule.
**Estimated:** 2 sessions. Session 1 is the model and the gate removal (work items 1 to 8),
re-greened with S4 Beat 1 patched, so the app is demoable if the phase pauses there. Session 2 is
the surfaces (work items 9 to 15), the triggers, the demo guide and the review pass.

## Goal

Build the catalogue's one warning routine before the phases that feed it. A pure routine in
`src/domain/warnings/` evaluates each Booking against registered rules and produces **Warning
records on the Booking**: kind (before-procedure or after-procedure), strength (mild or strong),
text and source rule, several per Booking, and **never a block**. When an admin clears one, a
clearance (who, when, at what strength) is stored and audited.

The Admin Day dashboard gains a **to-do list** of open warnings in its right rail, with Clear
(optional for a mild warning). Bookings carry a small **warning triangle** in mobile, web and Admin
that shows the text when tapped, and the Day view's List outline extends down to the Booking.
Submitting a List whose Bookings carry warnings shows a **short confirm step** on mobile and web,
then goes through.

The first rule is the **unpaid prepayment**. Per owner decision D5 (OQ-57, answered), the hard
completion gate and its audited override are removed: the `prepaymentUnpaid` blocker in
`completionBlockersFor`, `overridePrepaymentGate`, `PrepaymentOverrideSheet` and the stored
`Booking.prepaymentOverride`. An outstanding prepayment becomes a before-procedure warning in both
apps. Rule parameters (thresholds and an active switch) live in a new **app-settings** record in
the store, not in `DemoSettings`. There is no settings page: US-13.7.4 is Future.

Later phases each add one rule, with no UI change: 19 (base units outside the RVG range,
after-procedure, for the office), 21 (a child as the billable party, mild), 27 (prepayment
escalation by date) and 40 (a paying patient with a balance owing, mild or strong by threshold).

## Before you start: drift check

1. Run the catalogue diff since the plan's baseline:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks for FT-13.7, US-13.7.1 to US-13.7.4, US-06.3.2, US-06.2.1, US-13.1.1 (the
   one-day dashboard the to-do list sits on), OQ-57, OQ-41, OQ-54, OQ-56, OQ-74, and the
   domain-model lines on warnings (the warning routine, "never blocks", the to-do list).
2. If an item changed, re-read it in full and adjust the work items. Specifically:
   - **US-13.7.1's list of current warnings.** If the unpaid prepayment now has a kind and strength,
     use them in work item 3 and drop the "provisional" label on it. If a new warning is listed,
     check which later phase owns its source before adding it here; add it here only if it reads
     today's data, is small and no later phase claims it.
   - **US-13.7.2 placement.** If the catalogue now says where the to-do list sits, or that it is a
     separate dashboard screen, follow it instead of the right rail.
   - **US-13.7.3 confirm step.** If AA rejected the confirm on submit, drop work item 12's warnings
     section and keep today's confirm sheet unchanged.
   - **US-13.7.4.** If it came back into scope, stop and tell the owner: a settings page is a phase of
     its own, not an addition here.
   - **OQ-57 / D5.** If the answer changed back to a hard gate, stop and tell the owner before
     removing anything.
3. If a covered item is now Retired or Future, drop it and say so in the PROGRESS entry.
4. **Open questions: none block this phase.** The Verify-status points are built as follows and
   labelled provisional in the UI with a small neutral "Provisional" pill (tooltip naming the point):
   - Where the to-do list sits (US-13.7.2 note): the Admin Day view's right rail, directly under the
     mini calendar, leaving the day grid's area free for Phase 31's Draft Lists panel.
   - Whether clearing is recorded, and by whom (US-13.7.2 note): it is recorded (a stored clearance
     plus an audit row), office only.
   - The confirm step (US-13.7.3 note, Donald's suggestion): at List submit, on mobile and web.
   - The unpaid prepayment's kind and strength (US-13.7.1, "not yet set"): before-procedure,
     strong. Phase 27 makes it escalate by date.
5. Confirm Phases 14 and 15 are done: `src/shared/demoTriggers/registry.ts`, `match.ts`,
   `context.ts` and the PWA sheet exist; `src/store/demoActors.ts` exports `OFFICE_ACTOR` and
   `OFFICE_SIMULATION_ACTOR`; the Booking rename has landed (`schedule.bookings`, `BK` ids). Note the
   current `PERSIST_VERSION` (13 at the snapshot; 14 and 15 bump it).
6. Record the result (changed items, D5 status, each provisional reading) in the PROGRESS entry.

## Reference

**Design (convention 17).** [Design Language.dc.html](../../../design/Design%20Language.dc.html) is
the token source. Mild warnings use the semantic warning tokens (`semantic.warning` solid
`#A16207`, tint, on-tint), strong warnings the semantic error tokens (`semantic.error`), and a
cleared warning neutral mist. Never the six schedule status colours, never crimson. Teal `#0D6E63`
is the only action colour (Clear, Submit anyway, Open). Pills at radius 999, `sheet-in` motion for
the mobile sheet, the popover on e-2 at radius `card`.
[Admin Day.dc.html](../../../design/Admin%20Day.dc.html) is the layout reference for the right rail
and the grid blocks: the to-do list is one more rail card in the existing `RightRail` card anatomy.
[Mobile App.dc.html](../../../design/Mobile%20App.dc.html) screen 2 (the List's Booking stack) and
screen 3 (Booking detail) for the triangle and the bottom sheet;
[Web Dashboard.dc.html](../../../design/Web%20Dashboard.dc.html) for the web table row;
[Admin Review.dc.html](../../../design/Admin%20Review.dc.html) for the Review rows. No mockup draws
a warning triangle: extend the existing amber `!` marker and the `ShieldAlert` banner, do not invent
a new visual language.

**Catalogue and analysis.**
- The items above. US-13.7.1's acceptance criteria are the core tests: "More than one" and "Never
  blocks" (saved, submitted, authorised all go through).
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Summary theme 6 ("Warnings, never blocks"), "Structural
  first" (DM-31 early), "Remove or rework" (the gate, `PrepaymentOverrideSheet`,
  `prepaymentOverride`), "Demo-trigger buttons" (Warnings), and the EP-13 table; per-gap detail in
  [epics/EP-13.md](../epics/EP-13.md#ft-13.7) (FT-13.7, US-13.7.1, US-13.7.2, US-13.7.3, with the
  header note naming the precursors to fold in and the S4 Beat 1 impact).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md#dm-31) DM-31 (Warning record,
  app-settings record, ListConflict stays List-level) and DM-20 (the gate removal);
  [analysis/reverse-check.md](../analysis/reverse-check.md) RV-09.
- [analysis/prototype-map-admin.md](../analysis/prototype-map-admin.md) (Day view, right rail,
  List drawer, Review), [prototype-map-shared.md](../analysis/prototype-map-shared.md) (the Booking
  detail body, the submit sheet, the surface seam),
  [prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) (lifecycle, prepayment,
  persistence).
- PROGRESS.md Decisions log: **2026-07-22 "Second external plan review (Codex)"** ("pre-payment is
  now a REAL gate") and **2026-07-24 "Phase 09 build: decisions"** (the gate, the override, the
  mirror-based paid state). This phase supersedes the gate and the override; the mirror-based paid
  state stays.

**Code entry points (paths under `aa-prototype/src/` except `visual/…`, which is `aa-prototype/visual/`;
line numbers at the snapshot, names after 15).**
- The gate to remove: `store/lifecycle.ts` `CompletionBlocker` and `completionBlockersFor`
  (~76-125; the `prepaymentUnpaid` block ~111-123 and its comment), `completeBooking` (~130, refuses
  on the first blocker); `store/prepaymentActions.ts` `overridePrepaymentGate` (~176-226) and the
  module comment (~13-15); `store/index.ts:76` (export); `shared/flows/PrepaymentOverrideSheet.tsx`
  and `shared/flows/index.ts:10`; `domain/types.ts` `PrepaymentOverride` (~352) and
  `Booking.prepaymentOverride` (~392); `store/selectors.ts` `PrepaymentStatus` and
  `prepaymentStatusFor` (~363-378, the `'overridden'` state); `shared/audit/actionLabels.ts:27`
  (`booking.prepaymentOverride`), `fieldLabels.ts:33`.
- Prepayment readers that change: `shared/booking/BookingDetailBody.tsx` (`prepaymentStatus` ~131,
  the banner ~512-545 with "Completing the card is blocked", the stale "RFP open question" caption,
  "Override gate", the sheet mount ~788); `apps/admin/AdminApp.tsx` `prepaymentFlags` (~191-204);
  `apps/admin/outlet.ts:24`; `apps/admin/components/DayGrid.tsx` (`prepaymentFlags` prop ~25,
  `FocusFilter` ~40, the "Pre-payment flagged" filter ~227-231, `GridBlock` ~283-356 with the amber
  outline and the `$` corner, `data-shot="daygrid-block-prepayment"` ~320);
  `apps/admin/reviewFlags.ts` (`ReviewPrepaymentStatus` ~43, the prepayment flags ~72-77);
  `apps/admin/screens/ReviewScreen.tsx:74`.
- Booking rows that get the triangle: `apps/mobile/screens/ListDetailScreen.tsx` (each row is a
  `<button>`, ~165-225); `apps/web/screens/ListDetailView.tsx` (table rows ~167-200);
  `apps/admin/components/ListDrawer.tsx` (the Bookings section ~74-90);
  `apps/admin/screens/ReviewScreen.tsx` (Booking rows); the Booking detail header in
  `BookingDetailBody` (all three apps share it, through `useSurface().BookingLayout`).
- Submit: `shared/flows/SubmitListSheet.tsx` (`mode: 'blockers' | 'confirm'`; the confirm mode
  already exists and is what mobile ~334 and web ~129 open on Submit).
- Right rail: `apps/admin/components/RightRail.tsx` (`MiniCalendar`, `InternalNotes`,
  `AwaitingReview`, the local `Card` wrapper), rendered by `apps/admin/routes.tsx` (`<RightRail>` ~77)
  from `useAdminOutlet()`; `apps/admin/layout.ts` (`ADMIN_RIGHT_RAIL_WIDTH`).
- List-level flags that stay separate: `domain/types.ts` `ListConflict` (~265) and
  `apps/admin/util.ts` `attentionReasons` (~111).
- Store plumbing: `store/appStore.ts` (`AppState`, `freshAppState`, `backfillMerge`,
  `PERSIST_VERSION` ~130 with its version comment block); `domain/seed/index.ts` `SeedState` (~112),
  `SEED_LIST_IDS` (~452), `SEED_MARKERS`; `store/mutate.ts` (`DomainPatch` ~131, `resetDomainState`
  ~218, `stampBookingId`); `store/selectors.ts` `bookingRequiresPrepayment`,
  `prePaymentInvoicesForBooking`.
- Seed: `domain/seed/bookings.ts` (~802-824: Annette Riley on Souter Fri 24 AM, `selfFundedPrepayment`,
  the unpaid exemplar; Priya Nair on Fri 24 PM is the paid one, `SEED_PREPAID_BOOKING_ID`).
- Triggers: `shared/demoTriggers/registry.ts`, `types.ts` (`DemoTrigger`, `choices`, `badge`),
  `store/demoActors.ts` (14's `OFFICE_ACTOR`, `SOUTER_ACTOR`, `OFFICE_SIMULATION_ACTOR`; no demo actor
  yet: `store/clockActions.ts` keeps a private `DEMO_ACTOR` for the clock); `pwa/pwaPurity.test.ts`.
- Comments that describe the gate: `shared/surface/context.ts:86`, `SurfaceProvider.tsx:189`,
  `pwa/officeSimulation.ts:20`, `store/paymentActions.ts:15`.
- Tests that assert the gate today: `store/prepayment.test.ts` (gate, override, balance after
  override), `store/captureActions.test.ts` (`completionBlockersFor` ~480), `store/paymentActions.test.ts:170`,
  `apps/admin/reviewFlags.test.ts:83`, `apps/admin/components/DayGrid.test.tsx` (~65, ~104-130),
  `visual/admin-phase09.spec.ts` (~36-57, "pre-payment gate on a card", shot `p9-05-gate.png`).
- Outside the app: the capture recipes that use `daygrid-block-prepayment`,
  `booking-prepayment` or "Override gate" (`requirements-board/capture/recipes/` US-06.2.1,
  US-06.2.2, US-06.3.1 to US-06.3.5, US-06.4.1, US-08.2.2) and `requirements-board/capture/ATLAS.md`
  (~217-218 and ~312, the Fri 24 "pre-payment gate" text).

## Work items

### Session 1 · the routine, the settings record and the gate removal

1. **Warning types** (new `src/domain/warnings/types.ts`, pure, exported through
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
2. **The pure routine** (`src/domain/warnings/routine.ts`):
   `evaluateWarnings(facts, rules, settings, clearances)` runs every active rule, stamps each
   finding with its key, rule and Booking, attaches a clearance only when the stored clearance's
   strength is at least the finding's (a cleared mild warning that turns strong re-opens, which 27
   and 40 rely on), and sorts strong before mild, then by rule order. A cancelled Booking yields no
   warnings. No `Date.now()`, no randomness; `todayISO` comes in through the facts. Export
   `WARNING_RULES` (`src/domain/warnings/rules/index.ts`, the one registry, in a fixed order) and
   `isOpen(warning)`. Vitest (`routine.test.ts`): two test rules on one Booking give two warnings,
   each with its own text ("More than one"); an inactive rule raises nothing; a clearance hides a
   warning only at the same or a higher strength; a cancelled Booking raises nothing; same input
   gives identical output.
3. **The first rule: unpaid prepayment** (`rules/prepaymentUnpaid.ts`). Raises one finding when
   `prepaymentStatus` is `required` or `outstanding`: kind `beforeProcedure`, strength `strong`
   (provisional, US-13.7.1 "not yet set"; 27 escalates by date). Texts: "Prepayment required. No
   prepayment invoice has been raised yet." and "Prepayment invoice unpaid. Check with the patient
   before surgery starts." No en or em dash. `paid` and `none` raise nothing. Vitest for each status.
4. **The app-settings record** (DM-31: "DemoSettings is the wrong home"). In `domain/types.ts` add
   `AppSettings { warningRules: Record<WarningRuleId, { active: boolean; params: Record<string, number> }> }`.
   Seed it from `WARNING_RULES` (each rule's `defaultParams`, active) as a new top-level
   `appSettings` slice in `SeedState`, kept apart from `settings: DemoSettings` (which holds demo
   controls). Thread it through `AppState`, `freshAppState`, `backfillMerge` (so a persisted store
   missing a rule entry backfills it), `DomainPatch` and `resetDomainState` in `mutate.ts`. No store
   action edits it and no screen shows it (US-13.7.4 is Future); a rule absent from the record reads
   as active with its defaults. Later phases add their params here (27 a strong-within-days value, 40
   the alert threshold); Phase 16 may put its AA fee settings beside it.
5. **Clearances and selectors** (new `src/store/warnings.ts`, exported from `src/store/index.ts`):
   - Storage: `schedule.warningClearances: Record<string, WarningClearance>` keyed by warning key,
     empty at seed. Not a field on the Booking, so clearing never touches a Booking an AUTHORISED
     List has locked (convention 6), and no Booking's `lastModifiedBy` changes.
   - `warningFactsFor(state, bookingId)` builds `WarningFacts` from the schedule, the billing mirror
     (`prepaymentStatusFor`) and the clock. `warningsForBooking(state, bookingId)`,
     `warningsForList(state, listId)`, `openWarnings(state)` (every open warning on every
     non-cancelled Booking, sorted by the Booking's List date, then strong first, then time) and
     `warningSummaryByList(state, dateISO)` (`Map<ListId, { open: number; strongest: WarningStrength }>`)
     wrap the pure routine. Components memoise them over `schedule`, `billing`, `appSettings` and
     `clock`.
   - `clearWarning(api, actor, bookingId, key)`: office role only (the simulated office actor
     qualifies), refuses `notFound` when no such warning is currently raised and `alreadyCleared`
     when it is cleared at its current strength. One `mutate()` with entity type `booking`, entity
     id the Booking, action `booking.warningCleared`, `after: { ruleId, strength, text }`,
     `stampBookingId: null`. Add the action label ("Warning cleared") and field labels (`ruleId`,
     `strength`, `text`) so the Audit viewer and the Booking's History read as English.
   - Vitest: office clears, anaesthetist refused, re-clear refused, the clearance re-opens at a higher
     strength (with a test rule), clearing on an AUTHORISED List works and leaves the Booking
     record referentially unchanged, `resetDomainState` empties the clearances.
6. **Remove the gate and the override** (D5). In `lifecycle.ts` delete the prepayment block in
   `completionBlockersFor` and rewrite its comment (blockers are billing-completeness only;
   warnings never block). Delete `overridePrepaymentGate`, its export, `PrepaymentOverrideSheet` and
   its flows export, the `PrepaymentOverride` type, `Booking.prepaymentOverride`, the `'overridden'`
   member of `PrepaymentStatus` (and of `ReviewPrepaymentStatus`), the
   `booking.prepaymentOverride` action label and the `prepaymentOverride` field label. Keep
   `raisePreProcedureInvoice` and the mirror-based paid state unchanged (27 reworks them). Fix the
   gate comments in `context.ts`, `SurfaceProvider.tsx`, `officeSimulation.ts` and
   `paymentActions.ts`. Gate: `grep -rniE` over `src` and `visual` for
   `overridePrepaymentGate|PrepaymentOverride|code(:| ===) 'prepaymentUnpaid'|override gate|gate overridden|is blocked until`
   returns nothing. (The new warning rule deliberately keeps the id `prepaymentUnpaid`, which Phase 27
   builds on, and `SEED_LIST_IDS.prepaymentUnpaidList` stays, so the gate targets the old blocker
   code, not the bare word.)
7. **"Never blocks" tests.** Rewrite `store/prepayment.test.ts`: Annette Riley's Booking now
   completes as the anaesthetist while its prepayment is required, carries the strong
   `prepaymentUnpaid` warning before and after, an edit to it saves (US-13.7.1 "saved"), and its List
   submits and authorises; raising the
   pre-procedure invoice changes the text; paying it (the webhook path in `paymentActions.test.ts`)
   removes the warning. Update `captureActions.test.ts` (no prepayment blocker),
   `paymentActions.test.ts:170` (no override field) and `reviewFlags.test.ts` (no overridden flag).
   The `auditNarrative.test.ts` label scan stays green (no orphan label, no unlabelled code).
8. **Seed, persistence and re-green (end of session 1).** **Bump `PERSIST_VERSION`** by one, with a
   comment line: "app settings for the warning routine; warning clearances; prepayment override
   removed (D5)". A seed test: two builds deep-equal, `appSettings.warningRules` holds every
   `WARNING_RULES` id, `warningClearances` is empty, and Riley's Booking raises exactly one warning
   on the pristine seed. As a stop-gap until session 2, the `BookingDetailBody` prepayment banner
   loses "Override gate", the "blocked" sentences and the "RFP open question" caption, and shows the
   warning text instead. Run `npm run build`, `npm run build:pwa`, `npx vitest run`,
   `npm run shots` (re-point `visual/admin-phase09.spec.ts`'s gate test at the warning banner),
   and patch S4 Beat 1 (see Demo guide updates) so the guide is never stale. **Stop point:** tell
   the user session 1 is green so they can commit it.

### Session 2 · the surfaces, the triggers and the guide

9. **Shared warning UI** (new `src/shared/warnings/`, exported from the `src/shared` barrel; reads the
   store through hooks, never owns domain state):
   - `useBookingWarnings(bookingId)` returning the Booking's warnings (open and cleared).
   - `WarningTriangle`: lucide `TriangleAlert`, a small mark in the spirit of Excel's cell triangle,
     coloured by the strongest open warning (mild warning amber, strong error red; only cleared ones:
     neutral mist), with a count when more than one. Its own `<button>` with a 44px tap target on
     mobile, an `aria-label` that reads the count and the first text, `data-shot="booking-warning"`.
     Renders nothing when the Booking has no warnings.
   - `WarningDetails`: one row per warning (triangle, text, "Before procedure" or "After procedure",
     a Mild or Strong pill, and for a cleared one "Cleared by Kirsty W., Tue 21 Jul 10:05"). For an
     office actor, a teal **Clear** button on each open warning (calls `clearWarning`; a mild one
     shows the hint "Optional for a mild warning"). Tapping the triangle opens it: the shared
     `BottomSheet` on mobile, an anchored popover on web and Admin (copy `DemoClockMenu`'s popover:
     `role="dialog"`, Esc and outside click close, focus returns to the triangle).
   - `WarningsPanel` for the Booking detail banners: the same rows inline, `data-shot="booking-warnings"`.
   Component tests: two warnings render two rows; Clear shows only for the office; a cleared row
   shows its clearance line; Esc closes the popover.
10. **The triangle on every Booking surface** (US-13.7.3 "in both apps").
    - **Mobile** `ListDetailScreen`: each row is a `<button>` today, so wrap it in a positioned row
      container with the row button and the triangle button as siblings (no nested buttons), the
      triangle beside the Capture pill or tick. The Booking detail header (inside
      `BookingDetailBody`) shows it too.
    - **Web** `ListDetailView`: the triangle in its own cell beside the patient name, with
      `stopPropagation` so it does not open the Booking; the web Booking detail via the shared body.
    - **Admin**: the List drawer's Booking rows, the Review screen's Booking rows and
      `AdminBookingDetail` (shared body). The Review screen drops its prepayment pills
      (`reviewFlagsForBooking` keeps the non-warning flags: not completed, no billing reference, the
      ACC advisory, manual overrides) and shows the triangle instead.
    - `BookingDetailBody`: the prepayment banner's required and outstanding states fold into
      `WarningsPanel`; the office's "Raise pre-procedure invoice" button stays beside the prepayment
      warning (until Phase 27 makes the invoice automatic); the paid state keeps its success note,
      reworded "The prepayment invoice has been paid." Keep `data-shot="booking-prepayment"` on that
      prepayment row so the capture recipes still find it.
11. **The Day view: outline down to the Booking.** In `AdminApp.tsx` replace `prepaymentFlags` with
    `warningFlags` from `warningSummaryByList(state, selectedDate)` (and in `outlet.ts`). In
    `DayGrid`: a block's `needsAttention` is `attentionReasons(list).length > 0` **or** an open
    warning; the outline is the error colour when the strongest open warning is strong, the amber
    attention colour otherwise; the `$` corner becomes a triangle with the open count
    (`data-shot="daygrid-block-warnings"`, tooltip "N open warnings"); the "Pre-payment flagged"
    filter becomes "Has warnings" (`FocusFilter` `'warnings'`). `ListConflict` and
    `attentionReasons` stay List-level (DM-31). In `ListDrawer`, a Booking row with an open warning
    gets the same outline colour and the triangle, so the outline visibly carries down from the List
    to the Booking. Update `DayGrid.test.tsx`.
12. **The submit confirm step** (US-13.7.3, provisional). `SubmitListSheet`'s confirm mode reads
    `warningsForList`: when any non-cancelled Booking carries a warning that is not cleared, it adds
    a short section above the buttons: "N bookings on this List carry warnings", one line per
    Booking (patient, triangle, each text), and "Warnings never stop a submit. The office sees them
    on its to-do list." The primary button reads **Submit anyway** (teal) and "Not yet" stays; with
    no warnings the sheet is unchanged. A neutral "Provisional" pill sits by the heading (tooltip:
    "Confirm step on submit, to check with AA"). Completing a single Booking shows no extra step: the
    warning is already on screen there, and submit is where the Bookings leave the anaesthetist's
    hands; the catalogue submits Bookings with their List (FT-07.1, and US-01.4.6 treats "a completed
    or submitted Booking" alike), so the List's submit is where "the Booking is submitted once they
    confirm" (record this reading). Component test: warnings listed, Submit anyway submits, no warnings
    gives today's sheet.
13. **The to-do list** (US-13.7.2) in `RightRail.tsx`, a new `WarningsToDo` rail card directly under
    `MiniCalendar` (`data-shot="admin-warnings-todo"`). Heading "To-do" with the open count and the
    neutral "Provisional" pill (tooltip: "Placement and recording of clearing to check with AA").
    Rows from `openWarnings`, every date: triangle, the text, then patient, anaesthetist surname
    (`drSurname` from `shared/format.ts`) and date and session; an **Open** link to
    `/admin/day/:dateISO/bookings/:bookingId`; a teal **Clear** (a mild row says "Clear (optional)").
    The first six rows, then "Show all (n)" expanding in place. Empty state: "Nothing needs
    attention." A cleared row leaves the list at once. `routes.tsx` passes it to `RightRail` from
    `useAdminOutlet()` as it does `notes` and `reviewRows` (add the rows, or the inputs to derive
    them, to `AdminOutletContext`; Clear uses the outlet's office `actor`). Component test: a new warning appears, Clear removes it and writes the
    audit row.
14. **Register the demo triggers** (see Demo triggers) in `src/shared/demoTriggers/registry.ts`,
    with bodies in `src/store/warningSamples.ts`:
    - `WARNING_SAMPLES`: one entry per rule, `{ ruleId, isStaged(state, bookingId), stage(api, actor, bookingId), unstage(api, actor, bookingId) }`.
      The prepayment sample stages the condition through the audited `editProcedure` (the primary
      Procedure becomes `billingRoute: 'billableParty'`, `patientPaymentCategory: 'selfFundedPrepayment'`)
      and unstages it by restoring the Procedure's fields from the pristine seed (`buildSeed()`, cached
      and deterministic, so unstage works after a reload too). `isStaged` is true when those fields
      differ from the seed and hold the sample's values. Unstage also deletes the clearances of the
      warning keys it staged (one audited `mutate()`, action `booking.warningSampleUnstaged`,
      labelled "Sample warning removed" so the label scan stays green), so raising the samples again shows them open.
      Phase 20 deletes the staged fields and re-points this sample at the Booking's prepayment flag;
      Phase 27 re-points it at the prepaid set: say so in the handoff.
    - Pinned sample targets in `domain/seed/index.ts`: `SEED_WARNING_SAMPLE_BOOKINGS`, two Bookings
      on the demo day's DRAFT Lists (`SEED_LIST_IDS.rutherfordAm21` and `rutherfordPm21`, or the
      nearest Lists with Bookings) that no Booking-level `SEED_MARKERS` scenario and no S1 to S5 beat
      in `docs/demo-guide/03-demo-script.md` uses (`allDayBooking` marks the Rutherford List itself,
      which is fine), plus `multiWarning`: the Booking every rule's sample also lands on, so it carries
      two warnings as soon as a second rule exists. A test pins them and proves none is a scenario
      Booking.
    - Actor: add `DEMO_TRIGGER_ACTOR` (`{ who: 'Demo actions', role: 'system', source: 'demo' }`) to
      `demoActors.ts` (Phase 14 adds no demo actor; later phases, 40 among them, use this name), so
      the audit never shows the office doing the staging. `editRefusal` lets a system actor edit DRAFT
      and SUBMITTED Lists and refuses AUTHORISED ones, which is the trigger's disabled state.
    - Registry Vitest: each entry matches only its routes; disabled reasons fire; stage then unstage
      returns the Bookings' Procedures to their seed values and leaves no clearance for the staged
      keys; "Office clears this warning" never shows for `'bar'`; the sample entries show for both
      surfaces on the mobile Booking route.
15. **Re-green and close out:** `npm run build`, `npm run build:pwa` (purity: `src/shared/warnings`
    and `warningSamples.ts` stay inside `src/shared` and `src/store`), `npx vitest run`,
    `npm run shots`; add `visual/warnings.spec.ts` (stage samples on Admin Day, the to-do list fills,
    the drawer row shows the triangle and outline, Clear empties a row; mobile Riley row triangle
    opens the sheet; submit shows the confirm step and submits) with the four `data-shot` hooks.
    Update the capture recipes that clicked `daygrid-block-prepayment` or "Override gate" to the new
    hooks and steps (the list is in "Catalogue screenshots"), update ATLAS.md's Fri 24 text, and run
    `npm run verify:board`; the images are re-captured in the Catalogue screenshots step. Copy sweep: no
    en or em dash in any new string.

## Demo triggers

All registered through the Phase 14 registry. None is added to the Control Panel page; its index
lists them under their screens.

1. **"Raise sample warnings"** · Admin · Day (`/admin/day/:dateISO`) and Admin · Booking detail
   (`/admin/day/:dateISO/bookings/:bookingId`), surfaces bar; and Mobile · Booking
   (`/mobile/lists/:listId/bookings/:bookingId`), surfaces bar and pwa (the PWA equivalent, which
   Phase 19's sample also assumes) · on the Day view, runs every `WARNING_SAMPLES` entry on the pinned
   sample Bookings on the demo day (Tue 21 Jul), so the to-do list and the triangles populate; on a
   Booking (Admin or mobile), stages them on the Booking in the URL. Disabled when every sample is
   already staged on its targets ("Samples already raised"), on a Booking whose List is AUTHORISED
   ("This Booking's List is authorised"), or on a Booking the pristine seed does not hold ("Samples
   stage on seeded Bookings only", since unstage restores seed values). `indexPath`
   `/admin/day/2026-07-21`. Each phase that adds a rule adds its sample here, and from the second
   rule on the `multiWarning` Booking shows two warnings. In this phase, with one rule, a Booking with
   two warnings is proven by Vitest and the component tests, not on screen; the message says so
   honestly ("1 rule registered").
2. **"Clear sample warnings"** · the same screens and surfaces · undoes the staging (restores the
   sample Bookings' seed values and drops the staged warnings' clearances; the warnings disappear).
   Its description says it undoes the samples and is not the office's Clear on the to-do list.
   Disabled when nothing is staged.
3. **The S4 Beat 1 Booking** (Annette Riley, Souter Fri 24 Jul AM, prepayment required): the seed
   already raises the warning, so the triangle, the to-do entry, completing and the submit confirm
   need no new button.
4. **"Office clears this warning"** · Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`)
   · surfaces pwa only · badge `office-stand-in` · `choices` are the Booking's open warnings (shown
   as tappable rows when there is more than one) · `clearWarning` as `OFFICE_SIMULATION_ACTOR`, so
   the audit shows the simulated office. Disabled "No open warnings on this Booking". The PWA
   equivalent of the presenter clearing it from Admin's to-do list.

## Out of scope

- The settings page for thresholds, active warnings and check steps (US-13.7.4, Future): the
  app-settings record has no UI.
- Every other warning rule: base units out of range (19, which also turns the out-of-range refusal in
  `validateBookingForBilling` into a warning), a child as the billable party (21), the prepayment
  escalation by date, its re-checks and the automatic prepayment invoice (27), a paying patient with
  a balance owing and its threshold (40). Do not build their rules or samples here.
- The ACC advisory and the other `reviewFlagsForBooking` pills: they stay Review flags (the ACC one
  goes with the billing route in Phase 20).
- `ListConflict` and the List-level attention reasons (DM-04, Phases 28 to 30).
- Draft Lists on the dashboard (Phase 31); the rail leaves room for them.
- Notifications or emails about warnings, a nav badge count, and warnings on the anaesthetist's
  Lists home rows (only Booking rows carry the triangle).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin → Day → Fri 24 Jul: Souter AM has the strong outline and a triangle with "1";
      the drawer's Annette Riley row carries the same outline and a triangle; the "Has warnings"
      filter isolates it.
- [ ] The right rail's To-do card lists Annette Riley's "Prepayment required" warning with Open and
      Clear and the Provisional pill; Open lands on her Booking detail with the warnings panel and
      "Raise pre-procedure invoice"; no "Override gate" anywhere.
- [ ] Mobile → Souter Fri 24 Jul AM: Riley's row shows the triangle; tapping it opens a bottom sheet
      with the text, kind and Strong pill, without opening the Booking. Open the Booking and Mark
      complete: it completes.
- [ ] Submit the List: the confirm step lists Riley's warning and "Submit anyway"; it submits. A List
      with no warnings shows the unchanged sheet.
- [ ] Admin: Review the List and Authorise: it goes through with the warning still shown.
- [ ] Admin to-do: Clear Riley's warning: it leaves the list, the day-grid outline drops, the triangle
      on mobile turns neutral with "Cleared by Kirsty W." and a time; Audit and the Booking's History
      show "Warning cleared".
- [ ] Raise the pre-procedure invoice on Riley (before clearing, after a reset): the text changes to
      "Prepayment invoice unpaid"; pay it via the Payment received trigger on its invoice: the
      warning goes.
- [ ] Web → Souter Fri 24 AM List: the triangle shows in the table and opens a popover; Esc closes it.
- [ ] Admin Day Tue 21: "Raise sample warnings" in Demo actions stages the samples; the to-do list and
      the triangles fill; "Clear sample warnings" removes them; both disable correctly. Clear one
      sample from the to-do list, Clear sample warnings, raise again: it is open again.
- [ ] PWA: on a seeded mobile Booking with no warning, the Demo sheet's "Raise sample warnings" puts
      the triangle on it; "Clear sample warnings" removes it.
- [ ] PWA (`npm run dev:pwa`): on Riley's Booking the Demo sheet offers "Office clears this
      warning"; it clears and the triangle turns neutral; the entry is absent on a Booking with no
      warnings.
- [ ] No new app copy contains an en or em dash; teal is the only action colour; mild amber, strong
      red, never a status colour or crimson.
- [ ] Catalogue screenshots: the recipes for US-13.7.1, US-13.7.2 and US-13.7.3 are created or updated, the prepayment recipes this phase broke (US-06.2.1, US-06.2.2, US-06.3.1 to US-06.3.5, US-06.4.1, US-08.2.2) are re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and
      `npm run verify:board` green.

## Demo guide updates

- **Session 1 (with the gate removal):** `docs/demo-guide/03-demo-script.md` **S4 Beat 1** becomes
  "Prepayment warning": Click: Mobile → Dr Souter's Fri 24 Jul AM List → the triangle on Annette
  Riley → read the warning → open her Booking → Mark complete → Submit → the confirm step → Submit
  anyway; then Admin Day → Fri 24 → the to-do list → Clear. Say: "A warning, never a block. The
  anaesthetist sees it before surgery starts, while the surgeon can still be told; the office sees it
  on its to-do list. AA decided not to block (OQ-57)." Expected: completion and submit go through;
  the warning is on both apps and leaves the to-do list when cleared. In session 1 (before the
  triangle and to-do list exist) the beat reads the warning banner on the Booking and completes;
  session 2 adds the triangle, confirm and to-do steps. Rewrite the S4 "Discovery points" line
  (the gate and override placement becomes "which conditions warn, and how strongly").
- `04-presenter-cheat-sheet.md` section 8 "Pre-payment": no block; a strong before-procedure
  warning in both apps; the escalation and automatic invoice come later (27). Add a one-line
  "Warnings" entry: one routine, a to-do list in Admin, a triangle on Bookings, never a block.
  Line ~190's Phase 09 summary drops "gate".
- `02-workflows-and-handoffs.md` "Pre-payment" case (~424-430): replace the completion block and
  override with the warning; add a short "Warnings and the to-do list" workflow (where warnings come
  from, who sees them, Clear).
- `01-personas-and-responsibilities.md`: the office's daily duties gain "work the to-do list".
- `master-demo-guide.html`: the same passages (readiness row ~527, the pre-payment note ~732, S4
  Beat 1 ~913-914, the discovery callout ~938, cheat sheet card 8 ~1102).
- `DemoControlPanel.tsx` S4 scenario text (~421): "(1) Mobile, Souter Fri 24 AM, Annette Riley:
  read the prepayment warning, complete and submit, then clear it from the Admin to-do list".
- `requirements-board/capture/ATLAS.md` Fri 24 text (~312).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 15a` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-13.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.1.md) Warning routine | none (Phase 14 adds an `absent` placeholder, "Not built yet: catch-up Phase 15a builds this") | create. Status partial: only the unpaid prepayment rule exists; the base-units rule (Phase 19), child billable party (21) and patient balance owing (40) add theirs, and say so in the reason. Admin shot `warning-text` at `/admin/day/2026-07-24/bookings/BK0038` (Annette Riley), highlight `[data-shot=booking-warnings]`, caption "One routine raises each warning, with its text, kind and strength". Mobile shot `warning-sheet` at `/mobile/lists/L-34821-2026-07-24-AM`: tap `[data-shot=booking-warning]`, highlight the sheet, caption "Tapping the triangle shows the warning text, before or after the procedure, mild or strong" |
| [US-13.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.2.md) Warnings on the dashboard to-do list | none (placeholder as above) | create. Status captured (the placement and the recording of clearing are labelled provisional in the app). Admin shot `todo-list` at `/admin/day/2026-07-24`, highlight `[data-shot=admin-warnings-todo]`, states `open` ("Open warnings on the to-do list") and `cleared` (click the row's Clear: "A cleared warning leaves the to-do list"). Add a state `samples` that runs Demo actions, "Raise sample warnings" on `/admin/day/2026-07-21` so the list shows several rows |
| [US-13.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.3.md) Warning flag on a Booking | none (placeholder as above) | create. Status captured (the confirm step at List submit is a provisional reading). Shots `warning-triangle` on mobile (`/mobile/lists/L-34821-2026-07-24-AM`, Riley's row) and web (`/web/lists/L-34821-2026-07-24-AM`, the triangle cell), states `closed` and `open` (popover or sheet with the text), highlight `[data-shot=booking-warning]`; admin shot `outline-down` at `/admin/day/2026-07-24` with the List drawer open, highlight the outlined Booking row ("The Day view outline extends down to the Booking"); mobile and web shot `submit-confirm` (complete Riley, open the submit sheet, highlight the warnings section and "Submit anyway": "A short confirm step before a Booking with a warning is submitted") |

**Recipes this phase breaks.** Work item 15 already says to re-point the prepayment recipes; this
section is the list. The gate and override are removed and `daygrid-block-prepayment` becomes
`daygrid-block-warnings` (the "Pre-payment flagged" filter button becomes "Has warnings"), while
`booking-prepayment` stays (Phase 15 renames `card-prepayment` first, so read the post-15 hook name):
- `US-06.2.1` (`prepayment-flag`, mobile and web): caption "Card flagged Pre-payment required";
  keep the hook, reword the caption to the warning.
- `US-06.2.2`, `US-06.3.1`, `US-06.3.4`, `US-06.3.5`, `US-06.4.1`: click
  `[data-shot=daygrid-block-prepayment]` to open the List; point them at `daygrid-block-warnings`.
- `US-06.3.2`: clicks "Pre-payment flagged" and highlights `daygrid-block-prepayment`; use "Has
  warnings" and the new hook. Its `card-status` shot keeps the prepayment row hook.
- `US-06.3.3`: both shots (day-grid flag; mobile `card-gate`, caption "The anaesthetist sees the
  unpaid pre-payment on the card") now show the warning, not a gate; reword captions, and drop the
  "completion is blocked" text from its `absentReason` (it stays partial: no date escalation until 27).
- `US-08.2.2`: clicks "Override gate" twice (deposit and balance invoice shots); remove those steps.
- Every recipe that clicks "Raise pre-procedure invoice" (US-09.1.3, US-09.2.1, US-09.2.3, US-09.2.4,
  US-09.3.4) keeps working because the button stays beside the warning; the `--dry` run is the check.

**ATLAS.md.** Seed data worth shooting (the "Fri 24: the pre-payment gate" paragraph and Annette
Riley's Booking, now a warning with no gate), Routes if the to-do rail changes the Day view row, and
Existing hooks (`booking-warning`, `booking-warnings`, `admin-warnings-todo`,
`daygrid-block-warnings`). Work item 15 also names the Fri 24 text.

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npm run build:pwa` / `npx vitest run` /
`npm run shots` are green, and before writing the PROGRESS entry, run the standard adversarial
review-and-fix pass (PROGRESS convention 18): independent Opus review subagents for **quality**,
**bugs/correctness** and **plan adherence**. This session verifies every finding against the
catalogue and the code, fixes the confirmed ones with a test where a bug had none, re-greens and
records the pass. Do not re-raise anything settled in the Decisions log, except the prepayment
completion gate and override this phase supersedes.

**Steer this phase's reviewers at:**
- **Never blocks:** no path refuses because of a warning (complete, submit, authorise, billing run,
  edit); no residue of the gate (grep from work item 6); `completionBlockersFor` is
  billing-completeness only.
- **Purity and pluggability:** the routine and rules in `src/domain/warnings` import nothing from
  the store or React; a new rule needs a rule file, a registry entry, its facts, its app-settings
  defaults and a sample, and no UI change. Try adding a throwaway rule in a test to prove it.
- **Clearances:** keyed by warning, re-open at a higher strength, office only, audited, never
  mutate a Booking (the AUTHORISED lock and `lastModifiedBy` untouched), emptied by reset.
- **Consistency across surfaces:** mobile, web, PWA and Admin show the same warnings from the same
  selector; the day-grid count, the drawer, the to-do list and the triangle agree after clearing and
  after a payment; no nested interactive elements; keyboard and screen-reader labels.
- **Persistence and determinism:** `PERSIST_VERSION` bumped; `appSettings` and `warningClearances`
  in `freshAppState`, `backfillMerge` and `resetDomainState`; the routine uses the demo clock only.
- **Triggers:** samples stage and unstage through audited actions as a demo actor, show only on their
  routes, disable correctly; the PWA stand-in is pwa only and badged; purity test green.
- **Design and copy:** semantic warning and error tokens, teal-only actions, Provisional pills where
  this doc says, no en or em dashes, S4 Beat 1 in the guide matches the running app.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- Catch-up status row for Phase 15a and a phase entry: the drift-check result, D5's status, each
  provisional reading (placement, recording of clearing, the confirm step, the prepayment kind and
  strength), the session-1 stop point, the checklist item by item, test counts, the review pass.
- **Decisions log:**
  - Supersede **2026-07-22 "pre-payment is now a REAL gate"** and the gate and override parts of
    **2026-07-24 "Phase 09 build: decisions"**: no completion gate and no override; an unpaid
    prepayment is a before-procedure warning (D5, OQ-57, US-06.3.2 "no block").
  - "Warnings are derived by one pure routine; only clearances are stored" (in
    `schedule.warningClearances`, outside the Booking, so clearing never touches a locked Booking),
    with the re-open-at-higher-strength rule.
  - "Rule parameters live in `appSettings`, not `DemoSettings`; no settings page (US-13.7.4 Future)."
  - "The confirm step sits at List submit, not at Mark complete" (provisional reading of US-13.7.3).
- **Binding conventions:** add one line: a check that should alert, not stop, is a warning rule in
  `src/domain/warnings` with a sample in `src/store/warningSamples.ts`; it never becomes a blocker.
- **Catalogue screenshots:** the recipes created or changed (US-13.7.1 to US-13.7.3 and the prepayment
  recipes), the `REPORT.md` counts before and after (captured, partial, absent, failed), and the
  partial reason on US-13.7.1 handed to Phases 19, 21 and 40.
- **Handoff notes:** 19, 21, 27 and 40 each add a rule, its facts, its params and its sample (the
  `multiWarning` Booking then shows two warnings); 20 removes the fields the prepayment sample
  stages and re-points the sample at the Booking's prepayment flag, and 27 re-points the sample and
  the rule at the prepaid set and adds date escalation;
  31's Draft Lists panel must not displace the to-do rail card.
