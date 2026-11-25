# Shared UI: one component per job

Written in UI unification Phase U1 (16 November 2026); final after U7 (23 November 2026). The audit behind it is
`docs/archive/ui-unification/README.md` (what was built twice, and why some differences stay); the phased
plan, now archived, is `docs/archive/ui-unification/PLAN.md`. Keep the table below in step when a shared
component is added, renamed or removed.

## Where shared UI lives

| Folder or file | Holds |
|---|---|
| `src/shared/ui/` | Controls and feedback: buttons, text actions, pills, fields, search, segmented controls, ticks, the success overlay. |
| `src/shared/surface/` | Sheets, dialogs and modal behaviour: `useSurface().Overlay` picks a bottom sheet on the phone and a dialog on web and Admin. |
| `src/shared/table/` | Tables (U6): `Th`, `Td`, `GroupRow`, `TableShell`, the density, `ClickableRow`, `RowOpenButton`, `isInteractiveRowTarget`. |
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

## Tables

Settled in U6 (question 19). One kit in `src/shared/table/`: `TableShell` renders the white, `line`, radius 14,
e1 scroller and the `<table>` (`nested` is Phase 37's flat `radius.ctl` table); `Th` (`scope="col"`, `align`,
`width`, `nowrap`), `Td` (`align`, `mono`, `bold`, `clip`, `nowrap`), `GroupRow` (always `th scope="colgroup"`; `level="sub"` the indented second-level heading, Phase 47).
The header is the Admin Review mockup's on every table: 11/600/0.06em mist caps on the `neutral.bg` band over a
`line` rule; body rows are divided by `sunken`. The `density` is the shell's: `comfortable` (12px 20px, web),
`compact` (10px 10px at 13, admin) or `dense` (8px 10px at 12.5, the audit and master tables), so admin rows keep
their height. When the table is wider than its scroller, the scroller becomes a focusable region named by
`label` (pass the screen's heading or the table's section title); a table that fits gets no tab stop.
`shot`, `testId` and `data-*` land on the scroller; `tableData` on the `<table>`.

`footer` adds the card's foot row (the admin `Pager` with its range, a legend) below the scroller and outside
it, so it stays in view; the card then becomes an outer frame (`data-table-card`) around the scroller and the
foot row (`data-table-footer`). `fit` is the list card of an Admin `fit` page: it puts `aa-table-fit` on the
table (a sticky column header), hugs a short list and, once it reaches the window's bottom, scrolls its rows
inside itself. Without either, the scroller is still the card. For Admin page layout (title row, one toolbar,
body and rail, the `fit`, `fluid` and `document` modes) use `AdminPage`, `PageToolbar` and `PageBody` in
`apps/admin/components/AdminPage.tsx`; never set a page width in a screen.

A row that opens a record is a `ClickableRow` (`.aa-clickable-table-row`, the sunken hover; clicks on an inner
link, button or field do only their own action) with one `RowOpenButton` (or link) as its keyboard handle,
carrying the full name ("Open List Tue 21 Jul AM, ..."). Rows never take focus. `today` tints the cells `bg`,
`quiet` sets the text slate, `tone="warning"` draws the warning tint and on-tint text (Matching's differences, a plain row without `onOpen`). `apps/admin/tableChrome.ts` stays a thin re-export of the cell styles for the
screens later phases rebuild and for Phase 43's `Pager`.

## The fill rule and field heights

Settled in U4 (questions 4, 5 and 6). A field takes the **well** fill (grey `neutral.bg`) inside a white
sheet, card or drawer, and the **surface** fill (white) on the page or the phone canvas, so it always reads
against what is behind it. Fields are **48px** (`size="field"`, the default) in sheets and forms; toolbars
and in-table inputs use the one **compact 36px** size (the web Lists row keeps its 38px pair). Every
field control carries `aa-field`, and the one rule in `theme/global.css` gives it the teal border and the
Design Language focus ring on keyboard focus, never the browser blue. The admin calendar's crimson ring
stays its own. Controls (buttons, text actions, back links, icon buttons, segments, tabs and filter pills) carry
`aa-ctl` since U5, whose one rule draws the same ring as a 3px outline (`--focus-ring-color`), on keyboard focus only.
Press feedback stays in the mobile rules of `global.css`, never in a component.

## The shared components today

| Component | File | Job | Extended by |
|---|---|---|---|
| `Button` | `ui/Button.tsx` | A labelled command (U5): `variant` primary, secondary, outline (the mockups' teal outline), pill, danger (the one red outline, "Cancel booking" only); `size` touch (default: 54, 48, 44; sheet footers), desktop (44, radius 12, 14/600) or compact (36, radius 10, 13/600) for desktop buttons; one disabled treatment; `disabledReason` printed and tied by `aria-describedby`; `title`, `ariaLabel`, `ariaPressed`, `shot`, `data-*`; desktop hover in `global.css` | Phase 27 (`disabledReason`, `desktop`) |
| `IconButton` | `ui/IconButton.tsx` | A glyph or icon only (U5): `label` required (its name), `size` 32, 36, 38 or 44 (each mockup's step size), `shape` square or round, `tone` neutral or action, `bordered`; desktop step buttons show ‹ › | Phases 23, 24 |
| `CloseButton` | `ui/IconButton.tsx` | The borderless slate X (U5): every drawer, panel and dialog corner close ("Close"), and with a `label` and `returnFocusTo` a clear or remove button that hands focus back | None planned |
| `BackLink` | `ui/BackLink.tsx` | Return to the parent screen (U5): `to` a real link, else `onClick` a button; `size` desktop (14), touch (15, 44px target) or step (13, a sheet's step back) | Phase 34 (Integrations' back) |
| `TextAction` | `ui/TextAction.tsx` | A borderless teal word that does one thing (U5): `size` sm (12.5, tables), md (14, cards; default), lg (15, a 44px target on the phone); `flush`, `inline` (underlined in a sentence), `disabledReason`, `label`, `shot`, `data-*`; `to` renders a router link in the same look (Phase 40), `newTab` opens it in a new tab (build plan Phase 46) | Phases 35, 42 (the masters' own copy) |
| `LineTabs` | `ui/LineTabs.tsx` | The underline tab strip (U5): `LineTabs` a labelled `<nav>` of `LineTabLink`s (routes, `aria-current="page"`) or, with `kind="group"`, a labelled group of `LineTab`s (local panels, buttons with `aria-pressed`); `badge` for a count | Phases 25 (`LineTab`), 34, 38, 38b (`LineTabLink`, `badge`) |
| `FilterPills` | `ui/FilterPills.tsx` | Choose one list filter from solid pills (U5): `size` md (36, web) or lg (38, the phone), a labelled group with `aria-pressed` | Phases 36, 37 |
| `ProgressBar` | `ui/ProgressBar.tsx` | "n of N complete" as a bar (U5): `role="progressbar"` with its values, `width` a number or `fill`; `tone` done (default) or held (amber fill while a stub stands on the List) | Phase 33a (done: `tone`) |
| `Pill` | `ui/Pill.tsx` | A tone label: status, kind, attention flag. `tone` neutral, success, warning, error; `size` sm, md (inline, default), lg (table, `4px 10px` 11/600); `variant` tint or outline; `leading`, `mono`, `title`, `shot`, `data-*` | U3 (done) |
| `NameSearchBox` | `ui/NameSearchBox.tsx` | The one search box in all three apps: `size` field (48) or pill (36, or `height` 38 on the web Lists row); `fill` well or surface (default); `testId`, `clearLabel`, `touch` (the 44px clear on the phone), `shot`; Escape clears | U4 (done: `fill`, `testId`, `clearLabel`, `touch`, `height`; replaced `WebSearchField` and the mobile Lists input) |
| `FieldLabel` | `ui/Field.tsx` | The 11/600 uppercase label above a field; every labelled field part draws it. Since U6 it is `Eyebrow` itself | U4 (done) |
| `Eyebrow` | `ui/Eyebrow.tsx` | The 11px caps tracked label above a value, a section or a field (U6, question 23): `type.micro`, 11/600/0.06em, one size everywhere; `as` (`div` default, `span`, `h2`/`h3` where it titles a section, `dt`), `tone` mist, slate, warning, brand (the crimson eyebrow), `id`, `shot` | Phase 43a (`InfoTip` beside it) |
| `Card` | `ui/Card.tsx` | A white bordered card with an optional heading and action (U6, question 20): `padding` panel (20, gap 14, e1, 17/600: a page's main surface, the web panels) or card (16, gap 10, flat, 14/600: rails, profiles, the phone); radius 14 everywhere; the title is an `h2` (`titleLevel` 3) naming the `section`; `headingId`, `headingRef` (focus return, `tabIndex=-1`), `action`, `elevation`, `flush`, `tone="warning"`, `shot`, `data-*` | Phases 26 (the More card), 27 (`PrepaymentPanel`), 37, 38 (Balances), 45 (`footer` and `editing`: a Contract page's cards), 46 (`step`: New contract's numbered steps), 49 (`bare`: a step straight on a sheet, Replace from a date) |
| `EditableCard`, `useCardEdit` | `ui/EditableCard.tsx` | A record page's card edited and saved on its own (D104): Edit in its heading, Cancel and Save in the footer while in edit, the refusal under it; `useCardEdit(from, commit)` holds the draft and hands `commit` only the card's patch (one audited change), keeping the draft open on a refusal; `style` for the record's card frame; hooks `${shot}-edit`, `-cancel`, `-save`, `-error` | Build plan Phase 53 (lifted from the Contract page; the People pages, 54 to 57) |
| `RailSection`, `RailRow` | `ui/RailSection.tsx` | A record page's side panel section (D104): the title with its count, an `aside`, the first `limit` rows (5), an `empty` line and "See all N" to `allTo` (`${shot}-all`); `RailRow` is a link title over a sub line, `data-*` on its `li` | Build plan Phase 53 (the Contract page's On this Contract; the People pages, 54 to 57) |
| `PageHeader` | `ui/PageHeader.tsx` | A page's title row (U6): `size` web (28/34), admin (24/30) or section (18/700, Phase 42's `MasterHeader`); an `h1` (`level` 2 for a section), `sub`, right-aligned `actions` (`wrap` on web), `count` beside the title, `headingRef` for focus return (beyond the audit's API: the Notifications page returns focus to its `h1`), `subStyle` | Phase 42 (`MasterHeader`) |
| `StatTile` | `ui/StatTile.tsx` | A summary figure tile (U6), two looks kept apart on purpose: `quiet` (Web Dashboard: `bg`, radius 10, mono 24) and `outlined` (Admin Review: white, `line`, radius 12, `14px 16px`, mono 22); the label an `Eyebrow`; `sub`, `pill`, `tone="warning"` or `"error"` (a strong balance warning, Phase 40) | Phases 40, 42 (four-tile rows, outlined) |
| `DefList`, `DefRow` | `ui/DefRow.tsx` | Label and value pairs as a `dl` (U6): `layout` inline (a 12px label in an 80px column beside a 14px value; `labelWidth`), stacked (the profile fact) or settings (slate label left, mono value right, `trailing`); `mono`, `note`, `tone="warning"`, `labelTone`, `valueStyle`, `data-*`; `DefList` `gap` matches the screen's rhythm | Phase 26 (`ProfileRow` on `layout="settings"`) |
| `FieldHint` | `ui/Field.tsx` | The one quiet line under a field: 12px mist or `tone="error"`, tied by `id` and `aria-describedby`; the `hint` prop of every field part (U4). Catch-up Phase 40a adds the `slate`, `success` and `warning` tones, `shot`, `live` (its role) and `data-*` passthrough (the NHI lookup's status line) | Phase 40a (done) |
| `FormError` | `ui/Field.tsx` | Every refusal: the `box` under a form, or the `inline` line beside a compact row control; always `role="alert"`; `shot` (U3) | None planned |
| `TextField` | `ui/Field.tsx` | A labelled single-line input: `type` text, date, time, number, email, tel; `mono`, `hint`, `invalid` (`aria-invalid` and the error border), `inputMode`, `align`, `min`, `max`, `step`, `list`, `size`, `fill`, `hideLabel`, `accessibleName` (a fuller name where the visible label repeats, 17b), `hintTone` (`success` for a check that passed, 40a), `autoCapitalize` and `spellCheck` (passed to the input, 40a), `width`, `shot`, `data-*`; defaults keep the 48px grey well | U4 (done); Phase 24 (`PriceCard` amount) |
| `TextArea` | `ui/Field.tsx` | A multi-line input: `label` or `ariaLabel`, `hint`, a counter (`maxLength`, `cap`, `countTrimmed`), `size` compact (the rail's 60px note), `fill`, `resize`, `rows`, `shot` | U4 (done); Phase 35 (notes) |
| `SelectField` | `ui/Field.tsx` | The one labelled native `<select>` (U4): TextField's chrome, `size` field or compact, `fill`, `hideLabel`, `width`, `hint`, `shot` on the select, `labelShot` on the wrapper, `data-*` | Phases 36, 37 (filter bars), 42 |
| `fieldChrome` | `ui/fieldChrome.ts` | The one field chrome (U4, a plain module): `FIELD_HEIGHT` (field 48, compact 36), `FIELD_FILL` (well `neutral.bg`, surface `neutral.surface`), `FIELD_CLASS` (`aa-field`, whose one `:focus-visible` rule in `theme/global.css` gives the teal border and ring), `fieldControlStyle({ size, fill, invalid, select })` | U5 (buttons take the ring) |
| `Checkbox` | `ui/Checkbox.tsx` | The one checkbox (U4): a native box in the action teal inside its label, `size` md 16 or lg 20 (a mobile card), `hint`, `shot`, `data-*` | None planned |
| `Switch` | `ui/Switch.tsx` | The one on/off switch (U4): `role="switch"` and `aria-checked`, `size` sm (36x20) or lg (52x32), `label`, `description`. No product screen uses it yet | Phase 27 (approval-step toggle) |
| `DateJumpInput` | `ui/DateFields.tsx` | The toolbar "go to this day" date (U4): Admin Day at 36, web Lists at 38 with `labelVisible`; takes only a full day inside `min` and `max` (`acceptedJumpDate`), null when cleared | None planned |
| `FilterDateInput` | `ui/DateFields.tsx` | The filter-bar date (U4): compact and white on the page, label `above` or `inline`, `height` 36 or 38 | Phases 36, 37 |
| `TimeRangeFields` | `ui/DateFields.tsx` | A start and an end time side by side (U4, from `SessionTimesFields`): labels, `optional`, one `hint` read with both, `size`, `fill`, `shot` | Phase 39b |
| `useRovingRadio` | `ui/useRovingRadio.ts` | The one radio-group keyboard model (U4): one Tab stop, arrows, Home and End, disabled skipped; `selectOnMove: false` where a pick saves (the Contract rail) | None planned |
| `Segmented` | `ui/Field.tsx` | A labelled choice between a few options; passes `layout` and `size` to the sliding control (U5) | Phases 33, 36, 39b |
| `SlidingSegmentedControl` | `ui/SlidingSegmentedControl.tsx` | The segmented control with the sliding highlight: `variant` teal or surface (`ink` went with question 17), `size` md or sm (the 36px toolbar fit, U5), `layout` row, two-column or wrap; segments stay buttons with `aria-pressed`. The README target's `shape` was not built: its only pill user, Balances, took the standard control (question 17) | None planned |
| `TickBadge`, `TickGlyph` | `ui/TickBadge.tsx` | The completed tick disc; `TickGlyph` the brand tick itself (U7): path `M2.5 7.5 L5.5 10.5 L11.5 3.5` on a 14 viewBox, `size`, `color`, `strokeWidth` (2.4; the badge's 2.2), `draw` (the complete-tick stroke), always `aria-hidden`; for completion states (lucide `Check` stays for "selected") | None planned |
| `TickButton` | `ui/TickButton.tsx` | A tick-to-confirm control | None planned |
| `SuccessOverlay` | `ui/SuccessOverlay.tsx` | The full-surface "it worked" moment | U2 (`DoneStep`) |
| `DockSpacer` | `ui/DockSpacer.tsx` | Room under content for a pinned mobile dock (its 74, 82 and 86 kept: tying them to the published dock height would move framed pixels, U7) | None planned |
| `StickyDock` | `ui/StickyDock.tsx` | The frosted dock across the foot of a phone screen (U7): absolute, `14px 20px`, the bottom pad from the host inset, `surface.frosted` under a 14px blur, a `line` rule; measures itself and publishes `--aa-dock-height` (docks stack: the newest is published); `riseWithKeyboard` (the Booking), `zIndex`, `onHeight`, `testId`, `shot`. What sits inside is the screen's own (Mark complete 56, the List dock 54) | None planned |
| `NoticeLine` | `ui/NoticeLine.tsx` | One notice as words (U7): the sentence, the quoted `message` (`messagePrefix`, `messageShot`), the stamp through `stampText` (`atISO`, `stampSuffix`, `stampInline`); `size` md (13.5, 13, 12) or sm (the rail: 12.5, 12, 11); `strong`, `muted`, `tone="success"`, `footer`; `onOpen` makes the words one button (with the chevron unless `chevron={false}`), `action` sits beside; `boxed` the grey row; `shot`, `data-*` | None planned |
| `PickRow` | `ui/PickRow.tsx` | A colleague in a pick list (U7), two looks: `colleague` (avatar, 15/600 name, `line` or `lineMono`, chevron; a button with `onPick`, else the same row in neutral with `aria-disabled`; `minHeight` per sheet, `first`) and `blocked` (the dashed `lineStrong` box on `bg`, `quiet` name or line, `wrap`, `groupLabel`, children at the end); `shot`, `data-*` | None planned |
| `Disclosure`, `DisclosureButton` | `ui/Disclosure.tsx` | Show and hide (U7): `Disclosure` a `type="button"` summary with `aria-expanded` and `aria-controls` over a region that opens with the grid-rows motion (none under reduced motion) and is inert while shut; `summary` (or a function of `open`), `open`, `defaultOpen`, `onOpenChange`, `chevron` (the turning chevron), `summaryStyle`, `gap`, `shot`, `data-*`. `DisclosureButton` the bare chevron toggle for a table row or a card heading: `open`, `onToggle`, `label`, `controls`, `size` 14 or 16 | None planned |
| `DayChip` | `ui/DayChip.tsx` | The picked day as one teal chip that closes the day view (U6): `size` desktop (32) or touch (44), one full-sentence name, `testId` | None planned |
| `AddRowButton` | `ui/AddRowButton.tsx` | The dashed full-width "Add a booking" (U6): `size` desktop or touch, always `type="button"` | Phase 17b (office contacts) |
| `ProgressPill`, `progressTone`, `progressLabel` | `schedule/ProgressPill.tsx` | A List's progress as a pill, and the one tone and label source the phone's `ListRow` reads too (U3) | None planned |
| `CountBadge` | `ui/CountBadge.tsx` | The 18px count beside a heading, with a hidden noun; hidden at zero by default (U3) | None planned |
| `visuallyHidden` | `ui/visuallyHidden.ts` | Words for screen readers only (a style object, U3) | None planned |
| `AttentionDot` | `warnings/AttentionDot.tsx` | The solid "!" or triangle marker, 13px by default; `aria-hidden` unless labelled; `WarningTriangle` composes it (U3) | None planned |
| `Avatar` | `Avatar.tsx` | Initials in a disc beside a printed name: `elevated` (mobile), `tint` (web and Admin), `neutral` (move sheets, `muted`); mockup font steps (U3) | None planned |
| `PersonaChip` | `PersonaChip.tsx` | The signed-in persona on an ink bar: avatar, name, role (U3) | None planned |
| `Notice` | `ui/Notice.tsx` | A non-blocking note: warning, error (booking-level only), success, neutral; `live` only where it announces; `action` slot (U3); `enter` fades it in (Matching's decided banner, with `TickBadge animate` as its icon) | Phase 33 (`enter`) |
| `RadioCard` | `ui/RadioCard.tsx` | One option of a radio group as a card (Phase 33 review): radio dot, title, `titleExtra`, `description`, `disabledReason`, the checked card's own controls as children; checked is the teal accent edge and inset ring on white; `radio` takes `useRovingRadio().itemProps(i)`; `shot`, `data-*` on the radio | None planned |
| `OptionRow` | `ui/OptionRow.tsx` | One result in a short pick list under a search box (Phase 33 review): a full-width bordered button, words left, mono `trailing` right; `selected` the teal accent edge and tint with `aria-pressed`; `shot`, `data-*` | None planned |
| `OptionChip` | `ui/OptionChip.tsx` | A quick option chip (catch-up Phase 39): a teal-tint pill that fills or picks one answer beside the field it serves (the credit's reasons); `pressed` the teal border and tint with `aria-pressed`; `size` md 36 or lg 44 (the phone); `shot`. Not `FilterPills`, the solid list filter | None planned (the availability form's tiles and the funder sheet's chips stay their own: no swatch, no roving item props; U7) |
| `ResultLine` | `ui/ResultLine.tsx` | "It worked" in success green; `role="status"` always mounted (scope `[role=status]` by `data-shot`); `actions`, `onDismiss`, `plain` (U3) | None planned |
| `EmptyState` | `ui/EmptyState.tsx` | "Nothing here": `inline`, `card`, `centred`; `title`, `action` (U3) | None planned |
| `Dialog` | `surface/Dialog.tsx` | The centred web and Admin overlay | U2 (`useModalLayer`, `OverlayHeader`, corner X) |
| `BottomSheet` | `surface/BottomSheet.tsx` | The phone's bottom sheet | U2 (`useModalLayer`, `OverlayHeader`, `SheetActions`) |
| `SurfaceProvider` | `surface/SurfaceProvider.tsx` | Chooses sheet or dialog per surface; the Booking's dock on the phone is the shared `StickyDock` (U7) | U2 |
| `MonthGrid` | `calendar/MonthGrid.tsx` | The mobile "Go to a date" month calendar, built on `useCalendarKeys` (bounded), `MonthHeaderRow` and `MonthStepButton` | U4 (done) |
| `useCalendarKeys` | `calendar/useCalendarKeys.ts` | The one month-calendar keyboard model (U4): a roving tab stop in the visible month, arrows by day and week, Home and End, Page Up and Down by month (Shift by year); with `bounds` a key stops at a bound, without (the admin calendar) it runs on | None planned |
| `MonthHeaderRow` | `calendar/MonthHeaderRow.tsx` | The Monday-first weekday row, `initial` or `short`, `aria-hidden`; each calendar passes its own `style` and `cellStyle` (U4) | Phase 42 (hospital calendar) |
| `MonthStepButton` | `calendar/MonthHeaderRow.tsx` | The phone calendars' 44px round previous and next month button (U4), on `IconButton` since U5 | None planned |
| `NumberStepper` | `capture/ui.tsx` | The one whole-number stepper (U4): `StepperButton` (on `IconButton` since U5) minus and plus named "Fewer" and "More {label}", `min`, `max`, the value announced; `typeable` types a value in place (Enter saves, Escape cancels) | Phases 23 (`UnitsCard`), 39b |
| Rail parts | `contracts/railParts.tsx` (words in `railText.ts`) | The Contract chooser's parts (U4), one set for the Billing card and the step rail sheet: `RailOptionGroup` (`list` or `tiles`, on `useRovingRadio` with `selectOnMove: false`), `StepRail` and `StepMarker` (`vertical` or `compact`, `aria-current="step"`), `NoContractGroup` and `ContractGroupHeading`, `BackstopAmountField` (the typed amount at 44px) | Phase 23 (Make primary) |
| `useModalLayer` | `surface/useModalLayer.ts` | The one modal stack (U2): one Escape closes only the top layer, focus in, trapped and back, the background inert within the closest `[data-aa-modal-scope]`, every close through the layer's one `onClose`. Dialog, BottomSheet and SidePanel use it; popovers join as `kind: 'popover'` | Phase 35 (close guard on the one `onClose`) |
| `usePopover` | `ui/usePopover.ts` | The one popover behaviour (U2): open state, outside `pointerdown`, Escape back to the trigger, `aria-expanded` and `aria-controls` | Phase 43a (`InfoTip`) |
| `PopoverPanel` | `ui/PopoverPanel.tsx` | The one popover panel (U2): card radius, e3, placed `end`, `fill` or `inline` | Phase 43a (`InfoTip`) |
| `SidePanel` | `surface/SidePanel.tsx` | The right-docked panel (U2; moved from `apps/admin/components` in catch-up Phase 43b): `list` 440px drawers, `record` 600px (`MasterPanel`, the support panel); h2 at 18/700 names the dialog; corner X; e3 | Phases 33a, 35, 43b (the support panel on web and Admin) |
| `OverlayHeader` | `surface/OverlayHeader.tsx` | The one sheet and dialog title (U2): an h2 at `type.sheetTitle` (18/24/700) and an optional 13px slate description; names the enclosing dialog and brings the web Dialog's corner X | Phase 22a (`PaidBySheet`) and every new sheet |
| `SheetActions` | `surface/SheetActions.tsx` | The one sheet footer (U2, question 13): primary stacked over secondary on the phone; one row on web, secondary hugging first, primary last and filling | Phase 35 ("Apply") |
| `ConfirmSheet` | `surface/ConfirmSheet.tsx` | The one sheet confirm (U2): `OverlayHeader` and `SheetActions`, focus on the safe button, the primary runs once | Phases 23 (`MakePrimarySheet`), 41, 45 (`confirmVariant` danger and `size` wide: Disable a Contract) |
| `InlineConfirm` | `ui/InlineConfirm.tsx` | The in-card confirm (U2): a `neutral.bg` box, "Keep it" then the primary on the right, focus in and back to the opener | None planned |
| `DoneStep` | `ui/DoneStep.tsx` | The in-sheet done step (U2): TickBadge 72, 18/700 success title, slate detail, the action; `role="status"`, focus on the action | None planned |

Text helpers (not components, same rule): `formatMoney`, `parseAmount`, `parseAmountOrNaN`
(`src/domain/billing/money.ts`) and `dateRange`, `stampText`, `hhmm`, `plural`, `longDayNoYear` and the day
helpers (`src/domain/dateText.ts`), all through `src/shared/format.ts`.

## The guardrail

`src/apps/oneComponentPerJob.test.ts` (U7) enforces `CLAUDE.md` "One component per job": it fails when a file
under `src/apps/` or `src/shared/` defines its own `Pill`, `TextAction`, `Th`, `Td`, `BackLink`, `Section`,
`Row`, `Card` or `Avatar` outside that component's home, and when a raw `<button>` carries its own `style=`
outside the shared homes (`shared/ui`, `surface`, `table`, `calendar`) and `src/apps/demo/`. Its `ALLOW_LIST`
names each file still allowed a styled raw button, with why (stays-custom surfaces, calendar cells, nav items,
rows that open a record, and the words no `TextAction` size draws yet). The list only shrinks: an entry whose
file has no styled button left fails, and so does a list longer than `ALLOW_LIST_CEILING`. Never add to it:
extend the shared component with a variant (above) and migrate the site.

The live catalogue (`/demo/catalogue/admin|web|mobile`) is grouped by family; each row's last column names
its shared component's file (or "Stays custom" or "Demo only"), and its three tests check every named file
exists. A component's catalogue row carries its name; `docs/archive/ui-unification/RESULTS.md` maps the rows renamed
since the 12 November audit.
