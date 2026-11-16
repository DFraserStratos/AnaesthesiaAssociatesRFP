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
| `Pill` | `ui/Pill.tsx` | A tone label: status, kind, attention flag. `tone` neutral, success, warning, error; `size` sm, md (inline, default), lg (table, `4px 10px` 11/600); `variant` tint or outline; `leading`, `mono`, `title`, `shot`, `data-*` | U3 (done) |
| `NameSearchBox` | `ui/NameSearchBox.tsx` | The type-ahead name search | U4 (field fill) |
| `FieldLabel` | `ui/Field.tsx` | The label above a field | U4 |
| `FormError` | `ui/Field.tsx` | Every refusal: the `box` under a form, or the `inline` line beside a compact row control; always `role="alert"`; `shot` (U3) | None planned |
| `TextField` | `ui/Field.tsx` | A labelled text, date or number input | U4 (number, time, `min`, `max`, `invalid`, `size`, `fill`) |
| `TextArea` | `ui/Field.tsx` | A labelled multi-line input | U4 (counter) |
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
| `MonthGrid` | `calendar/MonthGrid.tsx` | The mobile "Go to a date" month calendar | U4 (`useCalendarKeys`, `MonthHeaderRow`) |
| `useModalLayer` | `surface/useModalLayer.ts` | The one modal stack (U2): one Escape closes only the top layer, focus in, trapped and back, the background inert within the closest `[data-aa-modal-scope]`, every close through the layer's one `onClose`. Dialog, BottomSheet and SidePanel use it; popovers join as `kind: 'popover'` | Phase 35 (close guard on the one `onClose`) |
| `usePopover` | `ui/usePopover.ts` | The one popover behaviour (U2): open state, outside `pointerdown`, Escape back to the trigger, `aria-expanded` and `aria-controls` | Phase 43a (`InfoTip`) |
| `PopoverPanel` | `ui/PopoverPanel.tsx` | The one popover panel (U2): card radius, e3, placed `end`, `fill` or `inline` | Phase 43a (`InfoTip`) |
| `SidePanel` (Admin only) | `apps/admin/components/SidePanel.tsx` | The right-docked Admin panel (U2): `list` 440px drawers, `record` 600px (`MasterPanel`); h2 at 18/700 names the dialog; corner X; e3 | Phases 33a, 35, 43a (`HelpPanel`) |
| `OverlayHeader` | `surface/OverlayHeader.tsx` | The one sheet and dialog title (U2): an h2 at `type.sheetTitle` (18/24/700) and an optional 13px slate description; names the enclosing dialog and brings the web Dialog's corner X | Phase 22 (`SplitFeeSheet`) and every new sheet |
| `SheetActions` | `surface/SheetActions.tsx` | The one sheet footer (U2, question 13): primary stacked over secondary on the phone; one row on web, secondary hugging first, primary last and filling | Phase 35 ("Apply") |
| `ConfirmSheet` | `surface/ConfirmSheet.tsx` | The one sheet confirm (U2): `OverlayHeader` and `SheetActions`, focus on the safe button, the primary runs once | Phases 23 (`MakePrimarySheet`), 41 |
| `InlineConfirm` | `ui/InlineConfirm.tsx` | The in-card confirm (U2): a `neutral.bg` box, "Keep it" then the primary on the right, focus in and back to the opener | None planned |
| `DoneStep` | `ui/DoneStep.tsx` | The in-sheet done step (U2): TickBadge 72, 18/700 success title, slate detail, the action; `role="status"`, focus on the action | None planned |

Text helpers (not components, same rule): `formatMoney`, `parseAmount`, `parseAmountOrNaN`
(`src/domain/billing/money.ts`) and `dateRange`, `stampText`, `hhmm`, `plural`, `longDayNoYear` and the day
helpers (`src/domain/dateText.ts`), all through `src/shared/format.ts`.
