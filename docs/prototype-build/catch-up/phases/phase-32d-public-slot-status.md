# Phase 32d · Public as a Slot status

**Requirements covered:**
[DM-71](../analysis/domain-model-delta.md#dm-71) (Public as a Slot status: works like Unavailable, shows "Public" and an optional note, carries no List detail),
[RV-43](../analysis/reverse-check.md#rv-43-public-is-a-kind-of-list-with-a-hospital-surgeon-and-bookings-the-catalogue-makes-it-a-slot-status-with-no-list-detail-new) (the prototype-only Public List kind, reworked).
Follows up, without owning: built 29's [US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md) Anaesthetist sets half-day availability and [US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md) Slot status master data, and built 31's [US-13.1.1](../../../../requirements-board/requirements/stories/US-13.1.1.md) One-day dashboard (all three Contradicts at `63a4490`; they stay on their phases' covers).
**Answered, built as answered:** [OQ-139](../../../../requirements-board/requirements/questions/OQ-139.md) (D86, 18 November, Donald for the build: Public is a value in the Slot status list that works like Unavailable). No provisional label.

**Depends on:** 29 (status master, series, calendars), 31 (Draft Lists, the Day grid's count and subtitle, the pairing rule), 32b (`applySessionWrites` holds Lists, `markUnavailableAndMoveList`, `SessionStatusSheet`), U6. Built and read: 14 (`POST_OP_ORIGINAL_LIST_ID`, `stage-post-op`, `OFFICE_SIMULATION_ACTOR`), 32c. Runs after 25a and 17b. If the owner runs it beside 17b, each is in its own worktree on ports 5273 and 5274, and whichever merges second takes the next `PERSIST_VERSION`.
**Estimated:** 2 sessions. Session 1: items 1 to 6 (parity tests, the status, the kind retired, the seed re-homed, persistence), ending green. Session 2: items 7 to 11 (display, office and PWA paths, the shared components, triggers, guide, shots).

## Goal

Public is a fourth starting Slot status, next to Free, On holiday and Unavailable. It has its own label and a master-data colour, is never open for bookings or cover, and can be set by the anaesthetist or the office. Like any status it takes an optional note, such as "CPH". The anaesthetist sets it from their calendar on mobile and web, and the office sets it from the session drawer. A Public session shows "Public · CPH" with no List detail on the Day grid, the web availability grid, both calendars, the week strip and Find cover. Finders, hand-on, move and conflict paths treat it as not free, and changing it back to Free reopens it.

The prototype-only List kind `public` is retired, leaving `private` and `preop`. The seed keeps every Booking:

- Every seeded public-kind List that holds a Booking becomes an ordinary private List at the same Slot, with the same id, Bookings and figures.
- Only bookless public sessions become Public statuses with the note "CPH".
- The recurring public rows become each anaesthetist's weekly Public series, so days added later show Public and never a List.

## Before you start

1. **Drift check** against the plan baseline `63a4490`. The run-build-phase context pack runs it:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-01.2.1,US-01.2.2,US-13.1.1,US-01.4.2,US-01.5.3,OQ-139,OQ-64,OQ-17
   ```

   Re-read anything that changed after `63a4490`. Stop and tell the user if any of these happened: OQ-139 is reopened, Public becomes a List kind or a hospital feed again, or US-01.2.1 or US-13.1.1 go Retired or Future.
2. **Built as answered, no provisional label:** OQ-139 parts 1 to 4 (label and note, entered by the anaesthetist or the office, a status like Unavailable, never open for cover) and OQ-64 (the status master). Defaults to build, each logged on the owner's review list:
   - **The record.** Key `publicHospital`, never `public`: no status key may equal a List kind (the gap analysis's EP-01 note), and a test asserts it. Label "Public", long label "Public hospital", description "Working at a public hospital. Not open for bookings or cover." Not bookable, `anaesthetistCanSet: true`, ordered after Unavailable. Colour token `public`, fill solid (the design's Public swatch; AA can recolour it).
   - **Re-homed Lists.** Each keeps its hospital (Christchurch Public), surgeon and note ("Acute theatre", "Elective ortho") and drops its link to the recurring row it came from, becoming a one-off List. It turns from the public colour to the private colour.
   - **Clash Draft Lists.** The ones the public rows projected onto leave days go. At Phase 31 there were six: Ngata Tue 21 Jul AM, Ropata Tue 25 and Thu 27 Aug AM and PM, Sharma Tue 15 Sep AM. The leave stands and the series leaves that session alone. The Draft Lists count drops by the number removed.
   - **The note.** "CPH" on seeded Public sessions.
3. **Confirm 29, 31, 32b, 32c and U6 are DONE.** Note these names:
   - 29: `SEED_SLOT_STATUSES` (`seed/cast.ts`), `createAvailabilitySeries`, `planSeriesWrite`, `seriesCalendarFor`, `canvasMastersFrom`, `resolveDisplayStatus`, `StatusLegend`, `SlotStatusSheet`, `AvailabilityStatusesView`'s footnote.
   - 31: `seed/draftLists.ts`, `recurringClashDraft` and `recurringClashListId`, the Day grid's template subtitle, `canvasGolden.test.ts` and `canvasFingerprint.test.ts`, and the way 31 re-pinned them with a one-off script.
   - 32b: `vacatedChoices`, `markUnavailableAndMoveList`, `SessionStatusSheet`.
   - 14: the `stage-post-op` trigger and its `demoTriggers.test.ts` cases.
   - Also note the current `PERSIST_VERSION` (50 at the last plan update) and the current Draft Lists count at reset (16 at 32b).
4. **Grep every reader** of the kind: `'public'`, `LIST_KINDS`, `LIST_KIND_LABELS`, `LIST_KIND_VISUAL`, `isListKind`, `ListKind`. At planning there were about nine non-test files:
   - seed: `recurringBookings.ts`, `recordedWindow.ts:216`, `bookings.ts:1212`
   - admin flows: `AssignListFields.tsx`, `RecurringBookingSheet.tsx`, `DraftListSheet.tsx`
   - `theme/statusColours.ts:100`, `shared/StatusLegend.tsx`, and the component catalogue's `apps/demo/catalogue/mobile/examples.tsx:662`

   Remove `'public'` from `LIST_KINDS` and let tsc list the rest.
5. **Reads beyond the skill's list.** Read each selection for the reason given:
   - **ROADMAP.md:** D86 (Public as a status, the seed rule), D14 (statuses are a user-maintained list, a closed session holding a List goes back to the office or to a colleague), and D59 (unavailability never leaves a List in place). The run order line naming 25a, 17b and 32d.
   - **GAP-ANALYSIS.md:**
     - The EP-01 table: the callout above it (the key, the validator, the footnote, free counts in S2) and the US-01.2.1 and US-01.2.2 rows.
     - The EP-13 table: the US-13.1.1 row.
     - The DM-71 and RV-43 rows.
   - **Analysis:** DM-71 in [domain-model-delta.md](../analysis/domain-model-delta.md#dm-71) and RV-43 in [reverse-check.md](../analysis/reverse-check.md#rv-43-public-is-a-kind-of-list-with-a-hospital-surgeon-and-bookings-the-catalogue-makes-it-a-slot-status-with-no-list-detail-new).
   - **Catalogue:**
     - Stories: US-01.2.1 (the Public, Back to Free and Office sets it criteria), US-01.2.2 (Public as a starting value, behaviour carried as data), US-13.1.1 ("Public · CPH", no List detail).
     - Questions: OQ-139's Answer.
     - Context: US-01.4.2 (open for cover), US-01.5.3 (series).
     - Model: [domain-model.md](../../../../requirements-board/requirements/domain-model.md), the Slot and Slot status sections.
   - **PROGRESS.md:**
     - Decisions log: 29's "List types private, public and pre-op kept as a fixed List attribute" (now superseded) and 31's reading that "acute or public theatre names its on-call surgeon" (superseded for Public).
     - Catch-up entries: 29 (the names above, the S2 opening's "Public hospital" status), 31 (the seeded Draft Lists list, the golden re-pin), 32b (Handoff 44: "Draft Lists now count 16") and 14 (the post-op scenario).
   - **Design** (convention 17):
     - [Admin Day](../../../design/Admin%20Day.dc.html): the grid blocks (its Whitaker and Ropata "Chch Public" blocks are the old reading; the catalogue wins, so show Public with its note and no List detail).
     - [Mobile Availability](../../../design/Mobile%20Availability.dc.html): the month half-blocks and the sheet's status chips.
     - [Web Availability](../../../design/Web%20Availability.dc.html): the colleague grid cell.
     - [Web Dashboard](../../../design/Web%20Dashboard.dc.html): the week strip.
     - [Design Language](../../../design/Design%20Language.dc.html): only the `status/public` swatch.

## Reference

- **Code:**
  - Domain: `src/domain/slotStatus.ts` (`SEED_STATUS`, `isListKind`, `displayStatusLabel`, `validateSlotStatusDraft`'s `kindClash`), `src/domain/types.ts:128` (`LIST_KINDS`, `LIST_KIND_LABELS`, the `DisplayKey` comment).
  - Seed: `src/domain/seed/cast.ts` (`SEED_SLOT_STATUSES`), `recurringBookings.ts:59-124`, `recordedWindow.ts:195-235`, `bookings.ts` (`sharmaTue14` :809, `ropataThu16` :943, `thu23Cph` :1057, `pinnedListIds` :1133, `bookable` :1211), `draftLists.ts`, `canvas.ts`.
  - Store: `src/store/availabilityActions.ts`.
  - Shared: `src/shared/status/useSlotStatuses.ts`, `src/shared/StatusLegend.tsx`, `src/shared/StatusBlock.tsx`, `src/shared/availability/`, `src/shared/demoTriggers/registry.ts:173`, `src/theme/statusColours.ts`.
  - Admin: `apps/admin/components/DayGrid.tsx` (:381, the status note), `SlotDrawer.tsx`, `apps/admin/flows/SessionStatusSheet.tsx`, `apps/admin/screens/masters/AvailabilityStatusesView.tsx:84`.
  - Web: `apps/web/screens/AvailabilityGrid.tsx`, `MyAvailabilityCalendar.tsx`, `apps/web/components/WeekStrip.tsx`.
  - Mobile: `apps/mobile/screens/MyAvailabilityCalendarScreen.tsx`, `AvailabilityScreen.tsx`, `ForwardListsScreen.tsx`.
- **Block fills:** `docs/ui-unification/detail/J-completeness.md`, the block-fill table (the copies item 9 migrates).

## Work items

1. **Parity tests first (new `src/domain/seed/publicRehome.test.ts`), written and passing against HEAD before anything changes.**
   - *What must not move:*
     - every Booking and Procedure (id, List id, patient, scheduled time, Contract, billing reference, fee, state)
     - every List that holds a Booking (id, Slot, state, hospital, surgeon, notes; not `kind`)
     - the billing run's invoices, BCTI and AA fee totals
     - free-session counts per day for Tue 21 to Fri 24 Jul (a public List and a Public status are both not free)
     - `POST_OP_ORIGINAL_LIST_ID` (the List, its state, Mitchell's Booking, Health NZ, `HNZ-2026-3102`) with the `stage-post-op` trigger enabled on its Review and its effect unchanged
     - `ropataThu16` (the billing-failure trigger's List) and Souter's `thu23Cph` (eight Health NZ Bookings)
   - *What may move, each pinned by its own expectation:*
     - bookless public Lists (gone)
     - the clash Draft Lists from public rows (gone)
     - the Draft Lists count
     - the colour of a re-homed List
2. **The status** (`domain/slotStatus.ts`, `seed/cast.ts`). Add `SEED_STATUS.publicHospital` and the record in Before you start item 2.
   - **Validator.** `validateSlotStatusDraft`'s `kindClash` now checks only the kinds that remain (Private, Pre-op). "Public" is refused only as a duplicate label.
   - **Tests:**
     - no `SEED_STATUS` value is in `LIST_KINDS`
     - `resolveDisplayStatus('publicHospital')` returns the record
     - `isOpenSlot` is false on a Public session
     - `anaesthetistChoices` includes Public
     - `vacatedChoices` offers Public and Free when Public is the status being set on a session that holds a List (32b's path)
3. **The kind retired** (`domain/types.ts`). Set `LIST_KINDS = ['private', 'preop']` and drop the kind from `LIST_KIND_LABELS`, the theme's `LIST_KIND_VISUAL` (the `public` colour token stays in `STATUS_COLOUR_TOKENS`: it is the palette Public's record uses), `StatusLegend`, the three admin sheets' kind options, `RecurringBooking.kind` and the catalogue example.
   - Rewrite the `ListKind` and `DisplayKey` doc comments to say Public is a status.
   - The Day grid subtitle keeps the List's note ("Acute theatre") on a re-homed List.
4. **The seed re-homed** (new `src/domain/seed/publicSessions.ts`). Move the 12 public rows out of `RECURRING_BOOKINGS` into a seed-only `PUBLIC_SESSION_PATTERNS`. Keep the canvas, every `rng()` and `slotRng` draw, the `bookable` filter's selection and Booking placement identical: the first-generation pass still projects those rows and `recordedWindow`'s acute draws as Lists, recording their ids in a seed-local set (kind `private`), and `bookable` reads that set where it read `'public'`. After the last Booking is placed, one pass `rehomePublicLists(seed)` does the following:
   - **Lists with a Booking** stay where they are, private, with no recurring link.
   - **Bookless Lists** go. Their Slot takes `publicHospital` with note "CPH", carrying the `seriesId` of that anaesthetist's series when it came from a pattern, or set as a one-off when it came from a recorded-window draw. Never add a closed status under a surviving List: that session is left as it is and is not a series instance, so no flag, conflict or Draft List is raised.
   - **Series.** Each anaesthetist with a pattern gets one weekly Public series (`AvailabilitySeries`, note "CPH", their weekdays and sessions; for example Whitaker Tue, Thu and Fri AM, and Ropata Tue and Thu both sessions) from the canvas start with no end date, so `seriesCalendarFor` paints days added later as Public.
   - **Clash Draft Lists** from the patterns are not created.
   - **Ids.** No surviving List, Booking, Draft List or patient id changes. A removed one leaves a gap and is never renumbered.
   - **Golden fixture and fingerprint.** Re-pin them with a one-off script that writes and logs only the changes (31's pattern).
5. **Every reader swept.** Check that roll forward, horizon extend, `anaesthetistCanvasDelta`, recurring projection, Draft List assignment, 32b's hand-on and the receive rule, 32a and 32 moves, Find cover, the colleague finder, 30's conflicts, 38a's search and 32c's `listsOnDay` treat Public as closed and never touch a re-homed List. Add a store test for each path, and one for "back to Free" reopening a Public session for a List and for cover.
6. **Persistence.** Bump `PERSIST_VERSION` by one, with a `persistMigrate` test (older state reseeds). **Green checkpoint** (end of session 1).
7. **Display** (session 2). A Public session reads "Public · CPH" (label, a middot and the note) with no hospital, surgeon, theatre, kind or count. Put this in one helper beside `resolveDisplayStatus` (`statusLine(slot, statuses)`, PWA-safe) and have every view read it:
   - Admin Day grid block and `SlotDrawer` header
   - web availability grid cell, `MyAvailabilityCalendar` day, `WeekStrip`
   - mobile `MyAvailabilityCalendarScreen` half-block (label only when narrow, the note in the sheet), `AvailabilityScreen` colleague cell and My availability card, and `ForwardListsScreen` row
   - the legend: List types Private, Pre-op, then the statuses with Public among them

   `AvailabilityStatusesView`'s footnote becomes "Private and Pre-op are kinds of List, shown on the List, not availability."
8. **Setting it.**
   - *Anaesthetist:* the calendar's `AvailabilityForm` offers Public with the note field ("Optional, for example: CPH"). A range and a series also work, since Public is a closed status.
   - *Office:* the Day grid's `SlotDrawer`, Change status, then `SessionStatusSheet` sets Public with a note for the anaesthetist. On a session holding a List, 32b's return-or-hand-on choice runs, since Public is closed.
   - Audit uses the existing availability codes, with the label recorded beside the key.
9. **Build on the shared components and migrate these copies (UI unification).**
   - Build on: `StatusChip` and `StatusBlock` (`blockFill`), `Pill` (U3), `MonthGrid` (`src/shared/calendar`), `BottomSheet` and `OverlayHeader` (U2), `TextArea` and `Field` (U4), `Button` (U5).
   - Migrate these copies on the screens this phase changes:
     - `SlotStatusSheet`'s inline preview becomes `<StatusBlock>`
     - `WeekStrip`'s `Block`, `AvailabilityGrid`'s `Cell` and `AvailabilityScreen`'s `cellStyle` take their fill from `blockFill` (a solid or hatched status must render the same everywhere)
     - `DayGrid`'s `GridBlock` takes its fill from `blockFill` and keeps its conflict and attention outlines
     - nothing else
   - Default props keep today's look. Keep every `shot`, `data-shot`, `data-testid` and row `data-*` hook, and update the `/demo/catalogue/*` rows.
   - If U6 has not landed, stop and say so. Never build a private copy. See [`docs/ui-unification/README.md`](../../../ui-unification/README.md) section 8.
10. **Triggers** (below). Add the PWA sheet entry, and check that Reset and reload keep state.
11. **Guide, shots, review pass, PROGRESS.**

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| (product) | Public in Add days off, note "CPH" | Mobile and web · My calendar | none | `setAvailability`, `setAvailabilityRange` or `createAvailabilitySeries` | as the store refuses |
| (product) | Change status, then Public | Admin · Day, session drawer | none | `SessionStatusSheet` | as 32b |
| (seed) | the Public series and "Public · CPH" sessions | Admin Day, calendars, availability grid | none | shown on Reset | |
| `availability-office-sets-public` | Office sets this session to Public | Mobile · My calendar, the session panel | pwa | `setAvailability` as `OFFICE_SIMULATION_ACTOR`, status `publicHospital`, note "CPH"; message "The office set this session to Public · CPH."; `badge: 'office-stand-in'` | the session holds a List, is already Public, or is past |

## Out of scope

- A public roster or any feed of public sessions (OQ-139: none).
- Reworking `private` and `preop` as List kinds (the catalogue has no List kind; DM-04 stays logged).
- The final status values and colours (to be agreed with Vanessa and AA's users).
- 42's editable recurring-bookings master and 43's scale data: both take Public as a status from here.

## Manual test checklist

Run these yourself in the running app and report pass or fail with evidence.

- [ ] Reset, Admin Day, Tue 21 Jul. Each Tuesday public session without Bookings (the parity test lists them) reads "Public · CPH" with no hospital, surgeon or count, and any that held Bookings is a private List. The legend reads Private, Pre-op, then the statuses including Public. The Draft Lists band has no acute AM, and the nav count matches the parity test.
- [ ] Admin Review of `POST_OP_ORIGINAL_LIST_ID` (Sharma, Tue 14 Jul): Mitchell's Booking and its figures are unchanged, and "Stage post-op scenario" runs as before. Souter's Thu 23 Jul AM has its eight Bookings, now in the private colour.
- [ ] Master data, Availability statuses: four rows, Public with ID `publicHospital`, the new footnote. A new status labelled "Public" is refused as a duplicate.
- [ ] Mobile (Dr Souter), My calendar: her Thursday AMs without Bookings show Public (Thu 30 Jul is pinned, so check it), Your series lists it, and Add days off offers Public. Set Fri 21 Aug AM to Public with "CPH": Admin shows "Public · CPH", and Find cover and the colleague finder do not offer it. Back to Free reopens it.
- [ ] Web My availability: the same, by range. The web availability grid and week strip show "Public · CPH".
- [ ] Office: the drawer's Change status sets a free session to Public with a note, and the anaesthetist's calendar shows it. On a session holding a List, the return-or-hand-on choice runs.
- [ ] Roll the clock "+7 days" twice: the new far-edge days show Public, never a List.
- [ ] PWA: "Office sets this session to Public" from the sheet. Reload keeps state and Reset restores it.
- [ ] S1 to S5 money figures unchanged (the parity test, plus a look at S3 and S4's totals).
- [ ] Catalogue screenshots: the rows below, a full `npm run capture` with no failed recipe, shots checked by eye, `npm run verify:board` green.

## Demo guide updates

Locate passages by text in `docs/demo-guide/`.

- `03-demo-script.md`:
  - S2's optional opening: Public is now seeded, so the add-a-status example becomes "Teaching" (not open for bookings). Show Public in the table and on the phone's choices.
  - S2 Beat 1: the legend, "Public · CPH" sessions on the grid, the band without Dr Ngata's acute AM, and the new nav count. The recurring-clash line points to Dr Beaumont's Wednesday on the Draft Lists page.
  - Beat 1b's Expected: the band empties.
  - A discovery point for OQ-139.
- `04-presenter-cheat-sheet.md`: the availability lines (four choices, the note) and "What about public work?" (a status with a note, never a List, never billed).
- `02-workflows-and-handoffs.md`: Workflow 0 and Workflow 3.
- `master-demo-guide.html`: the same passages. The Control Panel lists the PWA entry under its screen.

## Catalogue screenshots

This is the standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after the review pass. Run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 32d` first. It lists no covered stories (DM and RV only), so the rows below recapture the built phases' stories this phase changes.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md) | 29's, `captured` | Keep `captured` and every shot name. In the mobile `calendar` `sheet`, Public is among the choices and the note reads "CPH"; caption "Free, On holiday, Unavailable or Public, a session, a day or a range, with an optional note". Add state `public` on `day-grid-change`: Admin, a session set to "Public · CPH"; highlight that block. |
| [US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md) | 29's, `captured` | `list-statuses` `table` shows four rows with Public; caption adds "Public works like Unavailable". `sheet` and `renamed` unchanged. |
| [US-13.1.1](../../../../requirements-board/requirements/stories/US-13.1.1.md) | 31's, `captured` | `day` re-shot on Tue 21 Jul, highlighting a "Public · CPH" block; caption "One-day view: Lists with hospital, surgeon and count; a Public session shows its note and no List detail". `drill-down` unchanged. |

**Recipes this phase breaks.** Anything showing Tue 21 Jul's grid or the Draft Lists band and count (US-01.6.2 `draft-lists-day`, US-01.3.2 `clash`, `clash-row` if it used Ngata's), the legend, the web availability grid (US-01.2.1 `availability-grid`, US-01.4.2), and Souter's Thursday on mobile. Re-point clicks, keep shot `name`s.

**ATLAS.md.** Seed data: the `publicHospital` status, the seven Public series and their anaesthetists, the re-homed Lists (Sharma Tue 14 Jul AM, Souter Thu 23 Jul AM, Ropata Thu 16 Jul AM), and the new Draft Lists count. Existing hooks. Demo actions: `availability-office-sets-public`.

## Adversarial review (after build)

This is the standard pass (convention 18), steered at:

- **Seed parity.** The parity test passes unchanged. `rng()` order is kept. No surviving id moves. No closed status sits under a List and no new flag, conflict or Draft List appears. The anchor and both trigger Lists are intact.
- **One key space.** `publicHospital` never collides with a kind. No `'public'` kind literal is left (grep). `resolveDisplayStatus` never treats a status as a kind.
- **Closed everywhere.** Finders, cover, hand-on, moves, Draft List assignment, roll forward and the horizon read `isOpenSlot` and `isClosed`, never a key compare. Back to Free reopens.
- **No List detail.** A Public session shows its label and note only. The "Label · note" line lives in one helper.
- **Copy and colour.** No crimson. Teal is the only action colour. No en or em dashes. No "slot" in copy.
- **Private copies.** A new private copy of a shared component, or a block fill this phase was to migrate and left, is a finding.

## PROGRESS.md updates

- **For the owner's review:**
  - the defaults in Before you start item 2: the key, the record and its solid public colour, re-homed Lists keeping hospital, surgeon and note in the private colour, the removed clash Draft Lists and the new count, the note "CPH"
  - the seven seeded series
  - the "Teaching" example in S2's opening
- **Status row and phase entry:**
  - drift check against `63a4490` and OQ-139 as built
  - the names the neighbours shipped
  - the parity test and what it pins
  - the Lists re-homed and removed (counts)
  - golden and fingerprint changes, logged
  - `PERSIST_VERSION` old to new
  - review pass
  - catalogue screenshot result (REPORT.md counts before and after)
- **Handoffs:**
  - 42: recurring bookings have kinds private and pre-op only, and Public is a series
  - 43: scale data seeds Public as a status
  - 33, 34, 38b, 39 and 40: the anchor is unchanged and now a private List
  - 44: S2's beats and the cheat-sheet lines
- **Decisions log:**
  - D86 built
  - superseded: 29's "List types private, public and pre-op kept as a fixed List attribute" (for Public) and 31's "an acute or public theatre names its on-call surgeon" (Public sessions name nobody)
  - the re-home rule (our reading)
