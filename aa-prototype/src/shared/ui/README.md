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
components (`Button`, the `Field` parts, `Dialog`, `BottomSheet`, `MonthGrid`) do not take `shot` yet; the
U phase that extends each one adds it. Replacing a private copy with a shared component never
drops a hook: check `git diff` for removed `data-` lines.

## The shared components today

| Component | File | Job | Extended by |
|---|---|---|---|
| `Button` | `ui/Button.tsx` | Primary, secondary and danger commands | U5 (sizes, `outline`, `disabledReason`) |
| `TextAction` | `ui/TextAction.tsx` | A teal text command inside a row or card | U5 |
| `Pill` | `ui/Pill.tsx` | A tone label: status, kind, attention flag | U3 (tones, sizes, outline) |
| `NameSearchBox` | `ui/NameSearchBox.tsx` | The type-ahead name search | U4 (field fill) |
| `FieldLabel` | `ui/Field.tsx` | The label above a field | U4 |
| `FormError` | `ui/Field.tsx` | A refusal box under a form | U3 (announced, one look) |
| `TextField` | `ui/Field.tsx` | A labelled text, date or number input | U4 (number, time, `min`, `max`, `invalid`, `size`, `fill`) |
| `TextArea` | `ui/Field.tsx` | A labelled multi-line input | U4 (counter) |
| `Segmented` | `ui/Field.tsx` | A labelled choice between a few options | U5 |
| `SlidingSegmentedControl` | `ui/SlidingSegmentedControl.tsx` | The segmented control with the sliding highlight | U5 (one variant per question 17) |
| `TickBadge` | `ui/TickBadge.tsx` | The completed tick disc | None planned |
| `TickButton` | `ui/TickButton.tsx` | A tick-to-confirm control | None planned |
| `SuccessOverlay` | `ui/SuccessOverlay.tsx` | The full-surface "it worked" moment | U2 (`DoneStep`) |
| `DockSpacer` | `ui/DockSpacer.tsx` | Room under content for a pinned mobile dock | None planned |
| `Dialog` | `surface/Dialog.tsx` | The centred web and Admin overlay | U2 (`useModalLayer`, `OverlayHeader`, corner X) |
| `BottomSheet` | `surface/BottomSheet.tsx` | The phone's bottom sheet | U2 (`useModalLayer`, `OverlayHeader`, `SheetActions`) |
| `SurfaceProvider` | `surface/SurfaceProvider.tsx` | Chooses sheet or dialog per surface; the frosted dock | U2 |
| `MonthGrid` | `calendar/MonthGrid.tsx` | The mobile "Go to a date" month calendar | U4 (`useCalendarKeys`, `MonthHeaderRow`) |

Text helpers (not components, same rule): `formatMoney`, `parseAmount`, `parseAmountOrNaN`
(`src/domain/billing/money.ts`) and `dateRange`, `stampText`, `hhmm`, `plural`, `longDayNoYear` and the day
helpers (`src/domain/dateText.ts`), all through `src/shared/format.ts`.
