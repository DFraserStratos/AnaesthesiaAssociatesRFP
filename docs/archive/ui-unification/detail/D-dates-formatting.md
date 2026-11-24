> Detail file for `docs/ui-unification/README.md` (audit of 12 November 2026): calendars, date and time inputs, date and money text.
> Group numbers here (G1, N1 ...) are local to this file; the README's U-numbers point to them. Paths are relative to `aa-prototype/src/` unless they start with `docs/`.

# V-D · Verified: dates, calendars, date navigation and formatting helpers

Verifies `D-dates-formatting.md`. Paths are relative to `aa-prototype/src` unless they start with
`docs/`, `visual/` or `ui-library-preview/`. P = `docs/prototype-build/PROGRESS.md`. Read-only; I reran
every grep quoted below.

## Verification summary

| Group | Verdict | What I corrected |
|---|---|---|
| G1 Month calendar grid | **SPLIT** into G1a (date navigator calendars: MiniCalendar, MonthGrid) and G1b (month data grids: web My availability, mobile My calendar, HospitalCalendar) | The five are two jobs. MonthGrid's teal today is a recorded 38a reading (P:1990, P:1994), not an unexplained drift. The 11-11 crimson decision covers the admin calendar only. MiniCalendar's arrows move the Day view to the 1st of the month; they do not only page the calendar. Paging past the horizon lands on a designed state (Phase 28 `BeyondHorizon`) that DayNav's own +1w/+4w also reach, so it is not DRIFT. Most MiniCalendar "literals" copy the Admin Day mockup |
| G2 Jump-to-date trigger | CONFIRMED WITH CORRECTIONS | ListsScreen "To" is a range filter, not a jump, so it moves to G3. DayNav's native input dates from Phase 06 and has no ruling, so Q3 stands |
| G3 Date field in a form | CONFIRMED WITH CORRECTIONS | Count: 20 product lines and 2 catalogue lines (the sweep said 21 and 2). Added a filter-bar family (AuditViewer From/To and ListsScreen To), which Phase 37 reuses |
| G4 Step buttons (date facts) | CONFIRMED WITH CORRECTIONS | The mockups draw 32 px (Web Dashboard), 36 px (Admin Day) and 38 px (Web Availability), all with **`‹ ›` text glyphs**. So the sizes and glyphs the sweep called DRIFT are INTENDED; the lucide chevrons are what departs from the mockups. The buttons verifier owns the component |
| G5 Time entry | CONFIRMED WITH CORRECTIONS | The capture "−5/+5" 44x36 text button copies the Mobile App mockup (INTENDED). Drop the nudge-button merge and keep only an aria-label fix. The capture cards are rebuilt in 21a and 24 |
| G6 Week/day strip | DROPPED (agree) | none |
| G7 Date text formats | CONFIRMED WITH CORRECTIONS | Counts: `'EEE d MMM'` is 34 lines in 21 files (2 of them catalogue); `format(addDays(parseISO…` is 14 lines outside domain |
| G8 Timestamps | CONFIRMED WITH CORRECTIONS | A fifth shape, "20 Jul, 16:00", appears in `shared/booking/ProcedureStack.tsx:118` (`receivedStamp`, Phase 20a working tree) |
| G9 Money | CONFIRMED WITH CORRECTIONS | Seeded fees are ex GST: the screen shows "$3100.00", not "$3565.00". Four seeded Bookings reach four digits. The ungrouped figure is **asserted in Playwright and written into the demo script**. Phase 24 plans "Fixed price $2,800.00", which supersedes the whole-dollar `priceFigure`. The money home already exists: `domain/billing/money.ts` |
| G10 Pluralisation | CONFIRMED WITH CORRECTIONS | 86 inline ternaries, not 95 (47 of them `'' : 's'`) |
| G11 Minutes to HH:MM | CONFIRMED | none (6 sites rechecked) |
| G12 Repeated hooks | CONFIRMED WITH CORRECTIONS | BillingCard is web/admin only (P:368), so "touch on mobile misses it" is wrong. Its real gap is that focus does not return. Overlaps F-overlays |
| G13 Label maps | DROPPED (agree) | none |

---

### G1a Date navigator calendar (pick a day to go to)
- **Job**: a small month calendar whose only output is "go to this date". There is no per-day content beyond the numeral and a marker.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| `MiniCalendar` (private) | `apps/admin/components/RightRail.tsx:78` | admin Day | 1 (`RightRail.tsx:47`) |
| `MonthGrid` (shared) | `shared/calendar/MonthGrid.tsx:45` | mobile ("Go to a date" sheet) | 1 (`apps/mobile/screens/ListsLookback.tsx`, `LookbackDateSheet`) |

- **Differences**
  - The keyboard model is duplicated: `RightRail.tsx:112-148` matches `MonthGrid.tsx:73-89` case for case. DRIFT (copy).
  - Today in crimson fill, selected as a thin crimson border, 24 px cells, radius 6, 9.5 px weekday initials, "week NN". INTENDED: the Admin Day mockup (`docs/design/Admin Day.dc.html`, the rail calendar: crimson `#A91E3E` fill on 21, 24 px, r6, 9.5 px) and P:1043 to 1051 ("user visual pick"). `ui-library-preview/PLAN.md:83` (2026-11-11) "calendar crimson today/selected KEPT (as the prototype)" refers to this admin calendar; the preview README line 77 says "the admin calendar's crimson today".
  - MonthGrid marks today with a teal 1.5 px ring. INTENDED as a recorded reading, not a ruling: the header comment at `MonthGrid.tsx:11-12`, Phase 38a's checklist "no crimson in markers, sheet or results" (P:1994), and P:1990 "`MonthGrid` not re-pointed into Phase 29's two calendars (their crimson today outline ... would change pixels; logged rather than forced)". No mockup draws this sheet. Q1 stays open but is now a real either-way choice.
  - The month arrows behave differently. MiniCalendar's arrows call `onNavigateDate(1st of month)` (`RightRail.tsx:153,155`), so they **change the Day view's route**. MonthGrid's arrows only page the view. UNSURE: `ui-library-preview/src/rows/recommendations.ts:46` recommends "Arrows change the month only". This is a visible behaviour change for admin (Q2).
  - Bounds. MonthGrid clamps to its bounds. MiniCalendar has none, but going past the horizon lands on `BeyondHorizon` (`apps/admin/routes.tsx:68-70,101-102`, `data-shot="admin-day-beyond-horizon"`, with a "Go to the last day" link). That is a designed Phase 28 state (FT-01.1), which DayNav's `›`, +1w and +4w also reach. **Not DRIFT.** Before the horizon start there is no equivalent message (the guard only checks `> horizonEndISO`). UNSURE whether that matters.
  - MiniCalendar builds its own month cells (`:84-87`) and its own weekday array (`:165`) instead of using `monthCells` and `WEEKDAY_INITIALS`. DRIFT (same output).
  - Weekend dimming in the mockup (`#C9D1CE`) is not built. Leave it.
- **Target**: a hook `useCalendarKeys({ monthISO, bounds?, focusISO, onFocusMove, onMonthChange })` in `src/shared/calendar/` holding the roving focus, the key model and the optional clamp. MonthGrid uses it as it is. MiniCalendar keeps its own markup and mockup look and swaps its handler and cell builder for the hook and `monthCells`. Bounds stay optional, so admin keeps reaching BeyondHorizon. No density or colour props, because no visible change is intended.
- **Behaviour contract**: MonthGrid's version, which handles bound edge cases and keeps focus inside the visible month (P:1996 fixed "MonthGrid focus edge cases"). Gain: one tested key model, with the bound fixes reaching admin.
- **Migration**: 2 sites. Risks: `.aa-admin-calendar-day` focus ring (`theme/global.css`), `MonthGrid.test.tsx` (`data-testid="month-grid"`, `month-grid-picker`), catalogue rows asserted by name in AdminCatalogue.test and MobileCatalogue.test, `data-shot="mobile-lookback-calendar"`. No seed or PERSIST_VERSION effect. Size S.
- **Upcoming phases**: 43a adds a hint between DayNav and the grid, and 27 and 37 add rail cards, but none touches the calendar itself. Standalone.
- **Value**: removes about 60 duplicated lines. Low demo visibility (nothing changes on screen).
- **Confidence**: high.
- **Catalogue rows**: `MiniCalendar (RightRail)` (admin), `MonthGrid (LookbackDateSheet)` (mobile).

### G1b Month data grid (a month of per-day content you act on)
- **Job**: a month laid out Monday first, where each day carries domain content (AM/PM session blocks, closures, List counts) and a click opens that day's editor. These are not date pickers.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| Web My availability grid (inline, `DayCell`) | `apps/web/screens/MyAvailabilityCalendar.tsx:94-136` | web | 1 |
| Mobile My calendar grid (inline, `HalfBlock`, `MonthButton`) | `apps/mobile/screens/MyAvailabilityCalendarScreen.tsx:80-124` | mobile | 1 |
| `HospitalCalendar` (private) | `apps/admin/screens/masters/HospitalsView.tsx:125` | admin | 1 |

- **Differences**
  - Today: web 2 px crimson border with a crimson numeral, mobile 1.5 px crimson. There is no mockup; this is Phase 29 practice, consistent with P:226. Web 2 vs mobile 1.5 is a small DRIFT. HospitalCalendar has **no today marker** (no `todayISO` read at all). DRIFT (Q4).
  - HospitalCalendar's weekday header (`HospitalsView.tsx:172-174`) is not `aria-hidden`, so a screen reader reads seven stray words, and it is 11.5 px sentence case where web is 11 px uppercase. DRIFT. Its arrows are teal text `‹ ›` where web and mobile use slate or `accent.pressed` lucide. DRIFT; see G4.
  - Mobile `MonthButton` (`:198`) is a byte copy of MonthGrid's `RoundButton` (`MonthGrid.tsx:240`). DRIFT. Both are mobile and PWA-safe in `shared/`.
  - Cell anatomy, selection (web range with shift-click, teal for selection as the action colour) and density differ by job and platform. INTENDED. HospitalCalendar's comment says it reuses "Phase 29's month-cell anatomy"; phase-42 doc line 325 says the same.
  - None has the arrow-key model. A gap, not a copy.
- **Target**: shared scaffolding only, not one component: `MonthHeaderRow` (weekday header, `aria-hidden`, variant `initial | short`) and `MonthStepButton` (re-export MonthGrid's `RoundButton` for mobile). Keep `monthCells`. Optionally adopt G1a's `useCalendarKeys` later for keyboard reach. Cells stay with their callers.
- **Behaviour contract**: `aria-current="date"` on today everywhere (HospitalCalendar lacks it), weekday header `aria-hidden`, `disabled` outside bounds (all three already do).
- **Migration**: 3 sites. Keep `data-date` (Playwright `availability-phase29.spec.ts:74,88-89`, `list-moves-phase32.spec.ts:117,153,222`, `out-of-hours-phase32c.spec.ts:283`, `unavailability-phase32b.spec.ts:173`), `data-calendar-day` (`conflicts-phase30.spec.ts:142-143`), the role name "Next month" (those specs plus recipes `US-01.5.1.json:67-73` and `US-01.5.3.json:91,139`), and the `data-shot`s `web-availability-mine`, `mobile-availability-grid`, `mobile-availability-calendar`, `hospital-calendar`. Size S.
- **Upcoming phases**: **42 refits the hospital month calendar** (public holidays shown as closures, phase-42 doc lines 100 and 913). Fold the HospitalCalendar fixes into 42. The web and mobile grids are not on any remaining phase.
- **Value**: small. Demo visibility medium only for HospitalCalendar's missing today marker.
- **Confidence**: high that these are a separate job from G1a; medium on the scaffolding being worth it.
- **Catalogue rows**: `My availability month grid (DayCell)` (web), `My calendar month grid` and `HalfBlock` (mobile), `HospitalCalendar` (admin).

### G2 Jump-to-date trigger
- **Job**: a toolbar control that sends a screen to a chosen day.
- **Members**: `DayNav` native date (`apps/admin/components/DayNav.tsx:57`, admin), `WebGoToDate` (`apps/web/screens/ListsLookback.tsx:57`, web, used `ListsScreen.tsx:203`), mobile "Go to a date" button and `LookbackDateSheet` (`apps/mobile/screens/ListsLookback.tsx`). ListsScreen "To" removed (it is a range filter; see G3).
- **Differences**
  - Mobile sheet vs native input on desktop: INTENDED (mobile ListsLookback header comment; P:116; CLAUDE.md "mobile-first").
  - DayNav input has no label, no `min`, 36 px/13 px. WebGoToDate has a label, min and max, and a partial-year guard (`:71`, a 38a review fix, P:1996), at 38 px/14 px. The label and guard gaps are DRIFT. The height is not: the Admin Day toolbar is 36 px in its mockup and the web toolbar is 38 px in Web Availability's. INTENDED, per-app toolbar height.
  - DayNav's native input dates from Phase 06 (git `29adc948`). The Admin Day mockup has only `‹ Today ›` and the rail calendar. No ruling exists for two jump controls (Q3).
- **Target**: `DateJumpInput` in `src/shared/ui/` (`label`, `labelVisible?`, `value`, `min?`, `max?`, `onPick`, `height: 36 | 38`), with WebGoToDate's in-bounds guard built in. Mobile keeps the sheet.
- **Behaviour contract**: always named; only emits full in-bounds dates. Gain: DayNav's input gets a name and the guard.
- **Migration**: 2 sites. Risks: `data-testid="web-lists-go-to-date"`; `visual/phase28.spec.ts:107` reads the first `input[type="date"]`'s `max` on Admin Day; keep native `type="date"`. Size S.
- **Upcoming phases**: 43a edits around DayNav (hint). Standalone or fold into 43a.
- **Value**: about 20 lines; low visibility; an a11y gain.
- **Confidence**: high.
- **Catalogue rows**: `DayNav (with SortToggle)` (admin), `WebGoToDate` (web), `MonthGrid (LookbackDateSheet)` and `LookbackSearchRow` (mobile).

### G3 Date field in a form or filter bar
- **Job**: a labelled native date input in a sheet, or a From/To in a filter bar.
- **Members**: `type="date"` appears on 20 product lines (24 rendered, since AvailabilityForm's `DateField` is used 4 times) and 2 catalogue lines. Families:
  - `TextField type="date"` (`shared/ui/Field.tsx:37`; it has no `min`/`max`, confirmed): ManualBookingForm:171, EditPatientSheet:58, HolidaySheet:111, ContractEditSheet:430, RecurringBookingSheet:270,273,280, and AddAnaesthetistFlow:87 and EditAnaesthetistSheet:98 (separate inputs).
  - Private `DateField`: `shared/availability/AvailabilityForm.tsx:370` (48 px, 14 px, mono, min/max).
  - `assignSelectStyle` 44 px: DraftListSheet:135, RedateDraftListSheet:62 (min/max).
  - Inline copy: MoveBookingFlow:79 (44 px, no bounds, hand-built eyebrow identical in style to `FieldLabel`).
  - Compact table: ContractPriceRanges:123,192 (36 px).
  - **Filter bar**: AuditViewer:113,116 (`selectStyle`, `lineStrong` border) and ListsScreen:208 "To" (38 px, own `dateInputStyle`).
- **Differences**: 48 vs 44 px in admin sheets is DRIFT (the 44/48 floor is a cross-cutting field-height question, see C-fields). Fields left `TextField` only to gain `min`/`max`: DRIFT. Bounds on Recurring, Holiday and Move: UNSURE (Q5). Compact table: INTENDED (`ContractPriceRanges.tsx:25`). The filter-bar border and height: DRIFT.
- **Target**: add `min`, `max`, `mono` and `density: 'regular' | 'compact'` to `TextField`, plus a `FilterDateInput` for filter bars.
- **Behaviour contract**: `<label>` with `FieldLabel`, hint via `aria-describedby` (TextField already does this), native `type="date"`.
- **Migration**: about 14 sites. Risks: Playwright `input[type="date"]` with `.first()`/`.last()` order (`admin-draft-lists.spec.ts:83`, `admin-phase06.spec.ts:147`, `conflicts-phase30.spec.ts:134`, `out-of-hours-phase32c.spec.ts:242`, `phase28.spec.ts:107`); `data-shot="draft-list-date"`, `admin-add-anaesthetist-start`. Size M.
- **Upcoming phases**: 37 builds a From/To filter bar "on AuditViewer's Filter pattern"; 39b adds date+time fields; 42 adds `PublicHolidaySheet` (modelled on HolidaySheet); 21a touches MoveBookingFlow. Build `FilterDateInput` before 37 and the `TextField` props before 39b and 42.
- **Value**: 5 style copies; medium visibility (44 vs 48 px in adjacent admin sheets).
- **Confidence**: high.
- **Catalogue rows**: `Native date input (TextField type=date)`, `ContractPriceRanges`, `AuditViewer` (admin).

### G4 Step buttons: date-specific facts only (the component belongs to the A-buttons verifier)
- The mockups set the sizes: Web Dashboard week strip 32 px r9 `‹ ›` 14 px (matches `WeekStrip.tsx:153`); Admin Day 36 px r10 `‹ ›` 15 px slate with a 36 px teal-outline Today (**DayNav matches exactly**); Web Availability 38 px r10 `‹ ›` 16 px with a 38 px Today (matches `AvailabilityGrid.tsx:129-132` in size). So 32/36/38 and the `‹ ›` glyph are INTENDED. Lucide chevrons (web) and 34 px (web My availability `NavButton :196`, admin `AaFeesScreen` `StepButton :240`, plus "This month" 34 px) have no mockup. The preview's "one size (32px)" (`recommendations.ts:63`) contradicts two mockups (Q6).
- Confirmed DRIFT: DayNav `‹ ›` `SquareBtn` (`:90`) has no aria-label (it reads as a glyph); HospitalCalendar's arrows are teal text (the action colour on a navigation control); NavArrow is 22 px (no mockup; the mockup rail calendar has no arrows).
- Catalogue rows: `IconBtn · NavButton · WeekNavButton`, `Day stepper`, `WeekStrip` (web); `DayNav (with SortToggle)`, `MiniCalendar (RightRail)`, `HospitalCalendar`, `TabLink (AA fees)` (admin).

### G5 Time entry
- **Job**: enter session or booking start/end times; nudge a time by 5 minutes.
- **Members**: `SessionTimesFields` (`apps/admin/flows/SessionTimesFields.tsx:37`; 4 sites, EditListSheet passes a 48 px style), ScheduleSettingsView:213,217 pair (44 px), RecurringBookingSheet:245,249 pair (48 px). Nudgers: Booking "Scheduled" `Stepper` (`shared/booking/BookingDetailBody.tsx:855`, 44x44 icon, aria-label "5 minutes earlier") and capture `NudgeButton` (`shared/capture/ui.tsx:109`, 44x36 text "−5").
- **Differences**: the time pairs at 44 vs 48 px and hand-built labels are DRIFT. The nudge buttons are **not one look**. `NudgeButton` is "the mockup's small −5 / +5" (`docs/design/Mobile App.dc.html`: 40x36 r10 "−5"): INTENDED. Its accessible name "−5" is the only real gap (DRIFT, a11y). `shiftTime` (`BookingDetailBody.tsx:73`) and `shiftIsoMinutes` both do minute arithmetic (helper DRIFT, see G11).
- **Target**: `TimeRangeFields` (generalise SessionTimesFields with labels, hint, optional, and `controlStyle` dropped in favour of the field height). Give NudgeButton an `aria-label` prop ("5 minutes earlier") and keep its look.
- **Migration**: 3 pairs and 1 aria-label. Risks: `data-shot="session-times"`, `admin-session-times-edit`; `TimesCard.test`. Size S.
- **Upcoming phases**: 21a rebuilds capture cards (TimesCard); 39b adds time fields. Do `TimeRangeFields` before 39b; do the aria-label inside 21a.
- **Value**: low; low visibility.
- **Confidence**: high.
- **Catalogue rows**: `SessionTimesFields` (admin), `TimesCard` (web, mobile), `NudgeButton`, `StepperButton` (mobile).

### G7 Date text formats re-rolled with `format()`
- **Job**: ISO date to display text.
- **Members** (my counts, outside `shared/format.ts`, tests and seed): `'EEE d MMM'` 34 lines / 21 files (2 catalogue) against `shortDay`; `'EEE d MMM yyyy'` 5/5 against `dayWithYear`; `'EEEE d MMMM yyyy'` 6/6 against `longDay`; `'EEEE d MMMM'` 8/8 with no helper; `'d MMM yyyy'` 12/8 with no helper, plus local `pairingDate`, `AaFeesScreen.dateLabel`, `domain/billing/priceRanges.ts:190 formatRangeDate`; `'MMMM yyyy'` 11/7 plus `domain/billing/aaFee.ts:58 aaFeeMonthLabel`; `format(addDays(parseISO…` 14 lines outside domain (0 `.tsx` files use `addDaysISO`, confirmed); domain copy `domain/slotStatus.ts:268 shortDateLabel`.
- **Differences**: identical output wherever a helper exists (pure DRIFT, invisible). Five date-range shapes are visible (Q7). Note: `DEMO_TODAY_LABEL` is a constant for the seed day only; the live-clock labels must use `longDay`, not the constant.
- **Target**: move the pure helpers to `src/domain/dateText.ts` and re-export them from `shared/format.ts`. This is legal: `domain/domainPurity.test.ts:29-31` forbids only `../store|theme|apps|shell|shared/` and UI packages, and `date-fns` is already imported by 9 domain files. Add `plainDate`, `monthTitle`, `longDayNoYear`, `dateRange`.
- **Migration**: about 90 mechanical sites; Vitest string asserts unchanged. Size M.
- **Upcoming phases**: every phase writes dates. Land the helpers early and migrate opportunistically.
- **Value**: high duplication, low visibility. **Confidence**: high. **Catalogue rows**: none.

### G8 Timestamps
- **Members**: `'d MMM HH:mm'` (`shared/audit/auditNarrative.ts:419`, `apps/admin/components/DraftListDrawer.tsx:162`), `'EEE d MMM HH:mm'` (`NotificationsScreen.tsx:92`, `SlotDrawer.tsx:441,465`, `NotificationsCard.tsx:25`), `'EEE d MMM, HH:mm'` (`AlertOfficeSheet.tsx:13`, `MovedToYouPanel.tsx:114`, `NotificationsCard.tsx:40`), `dateTimeMicroCap`, and **`receivedStamp` "20 Jul, 16:00"** (`shared/booking/ProcedureStack.tsx:118`). Raw `.slice(11,16)`: `IntegrationMonitorScreen.tsx:123`, `RightRail.tsx:243`, `ProcedureStack.tsx:119`; `isoTimeLabel` (`shared/capture/timeIso.ts:9`) duplicates `hhmm`.
- **Differences**: NotificationsCard uses two shapes in one file: DRIFT. Micro-caps on mobile headings: INTENDED.
- **Target**: `stampText(iso, { weekday })` in `domain/dateText.ts`; `isoTimeLabel` becomes `hhmm`. Q8 picks the shape.
- **Migration**: about 15 sites. S. **Value**: medium visibility. **Confidence**: high. **Catalogue rows**: none.

### G9 Money formatting
- **Job**: show an NZD amount.
- **Members**: `formatCurrency` (`shared/format.ts:111`, `toLocaleString('en-NZ')`, grouped; 86 call lines in 22 files); `priceFigure` (`shared/contracts/labels.ts:66`, grouped whole dollars); `formatRangePrice` (`domain/billing/priceRanges.ts:199`, regex grouping, a domain copy); ungrouped `` `$${x.toFixed(2)}` `` display sites: `shared/capture/BookingTotalPanel.tsx:65,124`, `CompletionOverlay.tsx:25`, `BillingLinesCard.tsx:98,108`, `AddBillingLineSheet.tsx:121-122`, `OverrideCard.tsx:108`, `shared/booking/OfficeBillingSetup.tsx:50-51`, `BookingDetailBody.tsx:244,272`, `BillingCard.tsx:590`, `shared/contracts/labels.ts:38`, `shared/flows/ManualBookingForm.tsx:270`, `apps/admin/screens/ReviewScreen.tsx:347`, `masters/ContractsView.tsx:241`; messages `domain/billing/invoiceBuild.ts:149,252,325`, `validateBookingForBilling.ts:268,282`, `aaFee.ts:28`, `store/billingLineActions.ts:179,263`.
- **Differences, visible today**: four seeded Procedures have four-digit fees (`store/__parity__/phase-19b-baseline.json`): P0029 BK0028 Doyle bariatric $2,800 (Tue 14 Jul), P0031 BK0029 Aria rate x time $1,440 (Wed 15 Jul, Fitzgerald), P0036 BK0034 Souter rhinoplasty $1,200 (24 Jul), P0166 BK0163 Merivale face lift $3,100 (Mon 10 Aug, Dr Souter). The office's Admin Booking total (`BookingTotalPanel`, office only: `BookingDetailBody.tsx:145` hides it from anaesthetists and the mobile surface returns null) reads **"$3100.00"**. On the same beat the Contract panel reads "$3,100.00" (`formatRangePrice`), the procedure stack reads "Fixed price $3,100" (`priceFigure`), and the web List detail reads "$3,200.00" after the range edit (`formatCurrency`). That is three formats of one price in one scripted beat. The capture `BillingLinesCard` shows "$1440.00" to the anaesthetist too. DRIFT, and visible.
- **The ungrouped figure is locked in**: `visual/contracts-phase19a.spec.ts:27,49` asserts `'$3100.00'` and `'$3200.00'` on `data-testid="booking-calculation"`, and line 52 asserts `'$3,200.00'` on the web List. `docs/demo-guide/03-demo-script.md:811` and `master-demo-guide.html:1175` tell the presenter to expect **"$3200.00"**.
- **No ruling for ungrouped**: the only money ruling is Phase 05's "one `formatCurrency`" (P:300; doc comment "one currency format across the web app"). `priceFigure`'s whole dollars come from the Phase 20a doc (step 14), but **Phase 24's doc (lines 277, 293) changes the pricing-basis line to "Fixed price $2,800.00"**, so the whole-dollar exception has a planned end. Q9 is answered by the plan, unless the user wants to keep whole dollars.
- **Target**: `formatMoney(n, { cents: 'always' | 'whenAny', sign?: 'auto' | 'always' })` in the **existing** `domain/billing/money.ts` (beside `roundToCents`; `domain/money.ts` does not exist), re-exported as `formatCurrency`; `formatRangePrice` and `priceFigure` call it. Signed output is needed by 39a ("signed currency formatting").
- **Behaviour contract**: n/a. Add Vitest for grouping, cents and sign.
- **Migration**: about 25 display sites plus 8 message sites. Update the Playwright spec above and both demo-guide lines. Grep tests for `toFixed`-shaped message strings before changing domain messages. No seed effect. Size S/M.
- **Upcoming phases**: 24 replaces `OverrideCard` with `PriceCard`, puts `BookingTotalPanel` in the web rail (so the ungrouped total would reach the anaesthetist), and removes the rate x time line. 39b deletes `BillingLinesCard` and `AddBillingLineSheet`. **Do the helper and `BookingTotalPanel`, `CompletionOverlay`, `OfficeBillingSetup` and `BookingDetailBody` before 24.** Leave the three cards that 24 and 39b delete.
- **Value**: high correctness; demo visibility **high** (a scripted beat).
- **Confidence**: high.
- **Catalogue rows**: `BookingTotalPanel · useTickingValue`, `ProcedureStack` (web); `ProcedureStack` (admin, mobile).

### G10 Pluralisation
- 3 local helpers confirmed (`shared/availability/describeAvailabilityOutcome.ts:14`, `shared/demoTriggers/registry.ts:341`, `apps/admin/flows/HolidaySheet.tsx:20`); **86** inline `=== 1 ? 'x' : 'y'` ternaries (47 of them `'' : 's'`). Target `countOf(n, one, many?)` in `domain/text.ts`. Low value, invisible. Catalogue rows: none.

### G11 Minutes to HH:MM
- Confirmed at `domain/clock.ts:58`, `store/mutate.ts:58`, `store/selectors.ts:1240` (h:mm unpadded, INTENDED for the status bar), `shared/capture/timeIso.ts:18`, `shared/booking/BookingDetailBody.tsx:76`, and catalogue `examples.tsx:341`. Target `minutesToHHMM` in `domain/clock.ts`. S, low. Catalogue rows: none.

### G12 Repeated hooks (overlaps F-overlays)
- Dismiss on outside press and Escape: `shell/DemoClockMenu.tsx:71`, `DemoActionsMenu.tsx:76`, `DemoResetButton.tsx:33` (`pointerdown`, focus returns) and `shared/booking/BillingCard.tsx:466-479` (`mousedown` on window, **no focus return**). The "touch on mobile" point is wrong: BillingCard renders on Admin and web only (P:368), and taps still fire compatibility mousedown events. The real DRIFT is focus return. Target `useDismiss` in `src/shared/hooks/`.
- prefers-reduced-motion: 8 copies confirmed. Target `prefersReducedMotion()` in `theme/motion.ts` (PWA-safe).
- Catalogue rows: none specific.

## Dropped or rejected
- G6 Week/day strip: different jobs (agree with the sweep).
- G13 Label maps: no duplicates (agree).
- "One MonthGrid for all five calendars" with density, todayStyle and todayColour props: rejected. It mixes a date picker with content grids, and its props exist mainly to reproduce the current looks. Replaced by G1a (a shared key hook) and G1b (scaffolding).
- Admin MiniCalendar "paging past the horizon" as DRIFT: rejected; it lands on Phase 28's designed BeyondHorizon state, as DayNav's own buttons do.
- Unifying the two ±5 nudge buttons' look: rejected; the capture one is the mockup's.
- The desktop step-button sizes 32/36/38 and the `‹ ›` glyph as DRIFT: rejected; the mockups draw them.

## Intended differences to keep
- Admin rail calendar: crimson today fill, crimson selected border, 24 px r6 cells, 9.5 px initials, "week NN" (`docs/design/Admin Day.dc.html`; P:1043 to 1051; `ui-library-preview/PLAN.md:83`).
- MonthGrid date sheet: teal today, no crimson (38a reading, P:1990, P:1994; `MonthGrid.tsx:11-12`), pending Q1.
- Web/mobile My availability crimson today; WeekStrip crimson ring (P:226; Web Dashboard mockup).
- Web My availability selection in teal (the action colour, P:72).
- Mobile "Go to a date" as a bottom-sheet MonthGrid (P:116; mobile ListsLookback header).
- Step buttons 32 px week strip, 36 px Admin Day, 38 px web availability, `‹ ›` glyphs, Today 36 and 38 px (mockups).
- Capture "−5/+5" 44x36 text nudge (Mobile App mockup).
- Compact 36 px date input in the price-range table (`ContractPriceRanges.tsx:25`).
- Status-bar clock "h:mm" unpadded (`store/selectors.ts:1240`).
- Mobile date-strip `#8FE3B4` free dot on teal (Mobile Availability mockup); tokenise the value, don't change it.

## Questions for the user
1. Mobile "Go to a date" marks today in teal (a 38a choice); every other calendar uses crimson. Keep teal there? **Recommend: yes, keep it** (no identity colour inside a picker sheet; 38a logged it).
2. Should the admin rail calendar's month arrows keep moving the Day view to the 1st of the month, or only page the calendar? **Recommend: keep as today** (a behaviour change for a demo screen with no complaint behind it).
3. Admin Day has two jump controls, the native date input (Phase 06) and the rail calendar (mockup). Keep both? **Recommend: keep both and label the input.**
4. Add a crimson today marker to the hospital closures calendar? **Recommend: yes, during Phase 42's refit.**
5. Bound Recurring "Starts / Runs until / Last date", Holiday date and Move booking target day to the horizon? **Recommend: Move booking and Holiday only, to the horizon end.**
6. Desktop step buttons: keep the mockups' three sizes and `‹ ›` glyphs, or one size with lucide chevrons (the preview's 32 px)? **Recommend: keep the mockup sizes per screen and use one glyph, the mockup's `‹ ›`.**
7. Date ranges come in five shapes. One per context? **Recommend: "Tue 21 Jul to Fri 24 Jul" in the apps, and "1 Oct 2026 to 1 Nov 2026" with the year for money and contracts.**
8. Timestamp shape for notices and drawers? **Recommend: "Tue 21 Jul, 08:00".**
9. Money: show grouped "$3,100.00" everywhere and drop the whole-dollar "$3,100" in the procedure stack, as Phase 24 plans? **Recommend: yes.**

## Bugs found
- **Ungrouped money on the office Booking total and the anaesthetist's capture billing lines.** "$3100.00" sits beside "$3,100.00" and "Fixed price $3,100" in a scripted demo beat (`03-demo-script.md:811`). Confirmed by reading `BookingTotalPanel.tsx:65,124`, `BookingDetailBody.tsx:145,761`, the seed fees and `visual/contracts-phase19a.spec.ts:27,49,52`. Sure.
- **Admin DayNav prev/next buttons have no accessible name** (`DayNav.tsx:90`, used at `:44` and `:54`, glyph only). Sure.
- **HospitalCalendar weekday header is read aloud as seven loose words** (not `aria-hidden`, `HospitalsView.tsx:172-174`), and it has no `aria-current` today. Sure.
- **Capture nudge buttons are named "−5" / "+5"** (`TimesCard.tsx:247-248`). Minor a11y. Sure.
- **BillingCard contract picker does not return focus on Escape** (`BillingCard.tsx:466-479`). Sure; low impact.
