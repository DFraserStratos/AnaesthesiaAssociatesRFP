# Shared UI: one component per job

Written in UI unification Phase U1 (16 November 2026). The audit behind it is
`docs/ui-unification/README.md` (what was built twice, and why some differences stay); the phased plan
is `docs/ui-unification/PLAN.md`. Each later U phase adds its rows to the table below as it lands.

## Where shared UI lives

| Folder or file | Holds |
|---|---|
| `src/shared/ui/` | Controls and feedback: buttons, text actions, pills, fields, search, segmented controls, ticks, the success overlay. |
| `src/shared/surface/` | Sheets, dialogs and modal behaviour: `useSurface().Overlay` picks a bottom sheet on the phone and a dialog on web and Admin. |
| `src/shared/table/` | Tables: cells, shell, clickable rows (arrives in U6). |
| `src/shared/calendar/` | Month calendars and their keyboard model. |
| `src/theme/tokens.ts`, `motion.ts`, `statusColours.ts` | Every colour, size, radius, shadow, z-layer and duration, transcribed from `docs/design/Design Language.dc.html` and the sample pages (each added token names its source). |
| `src/shared/format.ts` | Display text. Money through `formatMoney` (also exported as `formatCurrency`): "$3,100.00". Dates, timestamps, times and counts through the helpers in `src/domain/dateText.ts` (`shortDay`, `dateRange`, `stampText`, `hhmm`, `plural` ...), re-exported here. Typed money through `parseAmount`. Person names through `drSurname` and friends. |

Before writing a new button, pill, field, sheet, notice, table, card or tab, use the shared one. No
`toFixed(2)` money, no `format(..., 'EEE d MMM')` and no hex, radius, shadow or z-index literal where a
token exists.

## How to add a variant

1. Find the pattern in `docs/design/`. If it is not there, it is a design question, not a variant.
2. Add the prop to the shared component, defaulting to today's look so no existing call site changes.
3. Add or extend the catalogue row so the variant is visible beside the others.
4. Add a Vitest case for the new prop's behaviour or ARIA state.

## Hooks travel with the component

The rule for every shared component, new or extended: it takes a `shot` prop and emits `data-shot` on the
element capture recipes and Playwright specs target, and passes `data-*` attributes (`data-testid`,
`data-list-id`, `data-booking-id`, `data-validation-*` ...) through to that element. Some of today's
components (`Button`, `Dialog`, `BottomSheet`, `MonthGrid`) do not take `shot` yet; the U phase that
extends each one adds it (the field parts took it in U4). Replacing a private copy with a shared component never
drops a hook: check `git diff` for removed `data-` lines.

## The fill rule and field heights

Settled in U4 (questions 4, 5 and 6). A field takes the **well** fill (grey `neutral.bg`) inside a white
sheet, card or drawer, and the **surface** fill (white) on the page or the phone canvas, so it always reads
against what is behind it. Fields are **48px** (`size="field"`, the default) in sheets and forms; toolbars
and in-table inputs use the one **compact 36px** size (the web Lists row keeps its 38px pair). Every
field control carries `aa-field`, and the one rule in `theme/global.css` gives it the teal border and the
Design Language focus ring on keyboard focus, never the browser blue. The admin calendar's crimson ring
stays its own; buttons get theirs in U5.

## The shared components today

| Component | File | Job | Extended by |
|---|---|---|---|
| `Button` | `ui/Button.tsx` | Primary, secondary and danger commands | U5 (sizes, `outline`, `disabledReason`) |
| `TextAction` | `ui/TextAction.tsx` | A teal text command inside a row or card | U5 |
| `Pill` | `ui/Pill.tsx` | A tone label: status, kind, attention flag. `tone` neutral, success, warning, error; `size` sm, md (inline, default), lg (table, `4px 10px` 11/600); `variant` tint or outline; `leading`, `mono`, `title`, `shot`, `data-*` | U3 (done) |
| `NameSearchBox` | `ui/NameSearchBox.tsx` | The one search box in all three apps: `size` field (48) or pill (36, or `height` 38 on the web Lists row); `fill` well or surface (default); `testId`, `clearLabel`, `touch` (the 44px clear on the phone), `shot`; Escape clears | U4 (done: `fill`, `testId`, `clearLabel`, `touch`, `height`; replaced `WebSearchField` and the mobile Lists input) |
| `FieldLabel` | `ui/Field.tsx` | The 11/600 uppercase label above a field; every labelled field part draws it | U4 (done) |
| `FieldHint` | `ui/Field.tsx` | The one quiet line under a field: 12px mist or `tone="error"`, tied by `id` and `aria-describedby`; the `hint` prop of every field part (U4) | None planned |
| `FormError` | `ui/Field.tsx` | Every refusal: the `box` under a form, or the `inline` line beside a compact row control; always `role="alert"`; `shot` (U3) | None planned |
| `TextField` | `ui/Field.tsx` | A labelled single-line input: `type` text, date, time, number, email, tel; `mono`, `hint`, `invalid` (`aria-invalid` and the error border), `inputMode`, `align`, `min`, `max`, `step`, `list`, `size`, `fill`, `hideLabel`, `width`, `shot`, `data-*`; defaults keep the 48px grey well | U4 (done); Phase 24 (`PriceCard` amount) |
| `TextArea` | `ui/Field.tsx` | A multi-line input: `label` or `ariaLabel`, `hint`, a counter (`maxLength`, `cap`, `countTrimmed`), `size` compact (the rail's 60px note), `fill`, `resize`, `rows`, `shot` | U4 (done); Phase 35 (notes) |
| `SelectField` | `ui/Field.tsx` | The one labelled native `<select>` (U4): TextField's chrome, `size` field or compact, `fill`, `hideLabel`, `width`, `hint`, `shot` on the select, `labelShot` on the wrapper, `data-*` | Phases 36, 37 (filter bars), 42 |
| `fieldChrome` | `ui/fieldChrome.ts` | The one field chrome (U4, a plain module): `FIELD_HEIGHT` (field 48, compact 36), `FIELD_FILL` (well `neutral.bg`, surface `neutral.surface`), `FIELD_CLASS` (`aa-field`, whose one `:focus-visible` rule in `theme/global.css` gives the teal border and ring), `fieldControlStyle({ size, fill, invalid, select })` | U5 (buttons take the ring) |
| `Checkbox` | `ui/Checkbox.tsx` | The one checkbox (U4): a native box in the action teal inside its label, `size` md 16 or lg 20 (a mobile card), `hint`, `shot`, `data-*` | None planned |
| `Switch` | `ui/Switch.tsx` | The one on/off switch (U4): `role="switch"` and `aria-checked`, `size` sm (36x20) or lg (52x32), `label`, `description`. No product screen uses it yet | Phase 27 (approval-step toggle) |
| `DateJumpInput` | `ui/DateFields.tsx` | The toolbar "go to this day" date (U4): Admin Day at 36, web Lists at 38 with `labelVisible`; takes only a full day inside `min` and `max` (`acceptedJumpDate`), null when cleared | None planned |
| `FilterDateInput` | `ui/DateFields.tsx` | The filter-bar date (U4): compact and white on the page, label `above` or `inline`, `height` 36 or 38 | Phases 36, 37 |
| `TimeRangeFields` | `ui/DateFields.tsx` | A start and an end time side by side (U4, from `SessionTimesFields`): labels, `optional`, one `hint` read with both, `size`, `fill`, `shot` | Phase 39b |
| `useRovingRadio` | `ui/useRovingRadio.ts` | The one radio-group keyboard model (U4): one Tab stop, arrows, Home and End, disabled skipped; `selectOnMove: false` where a pick saves (the Contract rail) | None planned |
| `Segmented` | `ui/Field.tsx` | A labelled choice between a few options | U5 |
| `SlidingSegmentedControl` | `ui/SlidingSegmentedControl.tsx` | The segmented control with the sliding highlight | U5 (one variant per question 17) |
| `TickBadge` | `ui/TickBadge.tsx` | The completed tick disc | None planned |
| `TickButton` | `ui/TickButton.tsx` | A tick-to-confirm control | None planned |
| `SuccessOverlay` | `ui/SuccessOverlay.tsx` | The full-surface "it worked" moment | U2 (`DoneStep`) |
| `DockSpacer` | `ui/DockSpacer.tsx` | Room under content for a pinned mobile dock | None planned |
| `CountBadge` | `ui/CountBadge.tsx` | The 18px count beside a heading, with a hidden noun; hidden at zero by default (U3) | None planned |
| `visuallyHidden` | `ui/visuallyHidden.ts` | Words for screen readers only (a style object, U3) | None planned |
| `AttentionDot` | `warnings/AttentionDot.tsx` | The solid "!" or triangle marker, 13px by default; `aria-hidden` unless labelled; `WarningTriangle` composes it (U3) | None planned |
| `Avatar` | `Avatar.tsx` | Initials in a disc beside a printed name: `elevated` (mobile), `tint` (web and Admin), `neutral` (move sheets, `muted`); mockup font steps (U3) | None planned |
| `PersonaChip` | `PersonaChip.tsx` | The signed-in persona on an ink bar: avatar, name, role (U3) | None planned |
| `Notice` | `ui/Notice.tsx` | A non-blocking note: warning, error (booking-level only), success, neutral; `live` only where it announces; `action` slot (U3) | None planned |
| `ResultLine` | `ui/ResultLine.tsx` | "It worked" in success green; `role="status"` always mounted (scope `[role=status]` by `data-shot`); `actions`, `onDismiss`, `plain` (U3) | None planned |
| `EmptyState` | `ui/EmptyState.tsx` | "Nothing here": `inline`, `card`, `centred`; `title`, `action` (U3) | None planned |
| `Dialog` | `surface/Dialog.tsx` | The centred web and Admin overlay | U2 (`useModalLayer`, `OverlayHeader`, corner X) |
| `BottomSheet` | `surface/BottomSheet.tsx` | The phone's bottom sheet | U2 (`useModalLayer`, `OverlayHeader`, `SheetActions`) |
| `SurfaceProvider` | `surface/SurfaceProvider.tsx` | Chooses sheet or dialog per surface; the frosted dock | U2 |
| `MonthGrid` | `calendar/MonthGrid.tsx` | The mobile "Go to a date" month calendar, built on `useCalendarKeys` (bounded), `MonthHeaderRow` and `MonthStepButton` | U4 (done) |
| `useCalendarKeys` | `calendar/useCalendarKeys.ts` | The one month-calendar keyboard model (U4): a roving tab stop in the visible month, arrows by day and week, Home and End, Page Up and Down by month (Shift by year); with `bounds` a key stops at a bound, without (the admin calendar) it runs on | None planned |
| `MonthHeaderRow` | `calendar/MonthHeaderRow.tsx` | The Monday-first weekday row, `initial` or `short`, `aria-hidden`; each calendar passes its own `style` and `cellStyle` (U4) | Phase 42 (hospital calendar) |
| `MonthStepButton` | `calendar/MonthHeaderRow.tsx` | The phone calendars' 44px round previous and next month button (U4) | None planned |
| `NumberStepper` | `capture/ui.tsx` | The one whole-number stepper (U4): `StepperButton` minus and plus named "Fewer" and "More {label}", `min`, `max`, the value announced; `typeable` types a value in place (Enter saves, Escape cancels) | Phases 23 (`UnitsCard`), 39b |
| Rail parts | `contracts/railParts.tsx` (words in `railText.ts`) | The Contract chooser's parts (U4), one set for the Billing card and the step rail sheet: `RailOptionGroup` (`list` or `tiles`, on `useRovingRadio` with `selectOnMove: false`), `StepRail` and `StepMarker` (`vertical` or `compact`, `aria-current="step"`), `NoContractGroup` and `ContractGroupHeading`, `BackstopAmountField` (the typed amount at 44px) | Phase 23 (Make primary) |
| `useModalLayer` | `surface/useModalLayer.ts` | The one modal stack (U2): one Escape closes only the top layer, focus in, trapped and back, the background inert within the closest `[data-aa-modal-scope]`, every close through the layer's one `onClose`. Dialog, BottomSheet and SidePanel use it; popovers join as `kind: 'popover'` | Phase 35 (close guard on the one `onClose`) |
| `usePopover` | `ui/usePopover.ts` | The one popover behaviour (U2): open state, outside `pointerdown`, Escape back to the trigger, `aria-expanded` and `aria-controls` | Phase 43a (`InfoTip`) |
| `PopoverPanel` | `ui/PopoverPanel.tsx` | The one popover panel (U2): card radius, e3, placed `end`, `fill` or `inline` | Phase 43a (`InfoTip`) |
| `SidePanel` (Admin only) | `apps/admin/components/SidePanel.tsx` | The right-docked Admin panel (U2): `list` 440px drawers, `record` 600px (`MasterPanel`); h2 at 18/700 names the dialog; corner X; e3 | Phases 33a, 35, 43a (`HelpPanel`) |
| `OverlayHeader` | `surface/OverlayHeader.tsx` | The one sheet and dialog title (U2): an h2 at `type.sheetTitle` (18/24/700) and an optional 13px slate description; names the enclosing dialog and brings the web Dialog's corner X | Phase 22a (`PaidBySheet`) and every new sheet |
| `SheetActions` | `surface/SheetActions.tsx` | The one sheet footer (U2, question 13): primary stacked over secondary on the phone; one row on web, secondary hugging first, primary last and filling | Phase 35 ("Apply") |
| `ConfirmSheet` | `surface/ConfirmSheet.tsx` | The one sheet confirm (U2): `OverlayHeader` and `SheetActions`, focus on the safe button, the primary runs once | Phases 23 (`MakePrimarySheet`), 41 |
| `InlineConfirm` | `ui/InlineConfirm.tsx` | The in-card confirm (U2): a `neutral.bg` box, "Keep it" then the primary on the right, focus in and back to the opener | None planned |
| `DoneStep` | `ui/DoneStep.tsx` | The in-sheet done step (U2): TickBadge 72, 18/700 success title, slate detail, the action; `role="status"`, focus on the action | None planned |

Text helpers (not components, same rule): `formatMoney`, `parseAmount`, `parseAmountOrNaN`
(`src/domain/billing/money.ts`) and `dateRange`, `stampText`, `hhmm`, `plural`, `longDayNoYear` and the day
helpers (`src/domain/dateText.ts`), all through `src/shared/format.ts`.
