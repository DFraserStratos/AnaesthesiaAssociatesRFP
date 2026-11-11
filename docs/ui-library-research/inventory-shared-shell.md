# Inventory: shared kit, shell, theme, PWA, demo

Snapshot 11 Nov 2026, commit `48fa38d4`. Read-only survey of `aa-prototype/src/shared`, `src/shell`,
`src/apps/demo`, `src/theme`, `src/pwa`. Paths relative to `aa-prototype/src/`. "Via BookingDetailBody" means
it reaches all three apps through `shared/booking/BookingDetailBody.tsx`.

## 1. Overlays (modal, sheet, popover, menu)

**`useSurface().Overlay` is the key seam.** ~20 shared sheets call it with no platform branching; mobile
renders it as `BottomSheet`, web/admin as `Dialog`. A library swap maps this to Drawer (mobile) and Dialog
(web) behind the same seam.

- **BottomSheet** `shared/surface/BottomSheet.tsx`: mobile modal sheet. Scrim fade + `aa-sheet-in/out`,
  delayed close for exit animation; drag handle is only a "Close sheet" button (no swipe); rides above the
  keyboard via `--aa-keyboard-inset`, home bar via `--aa-inset-bottom`; `absolute` inside the phone host
  (z 70), no portal. Used by mobile, PWA demo panels, every shared flow. *Gaps:* no Escape, no focus trap /
  initial focus / restore, no `aria-labelledby`, `aria-modal` without inert background, nested sheets stack
  by DOM order only.
- **Dialog** `shared/surface/Dialog.tsx`: centred desktop modal. Fixed scrim (z 200), scrim click + Escape;
  module-level `OPEN_DIALOGS` set so Escape closes only the topmost (built for RVG picker over Add booking).
  No portal, fade-in only. Web + admin (admin imports directly too). *Gaps:* no focus trap / restore, no
  scroll lock, no `aria-labelledby`, no exit animation.
- **SurfaceProvider / useSurface** `shared/surface/SurfaceProvider.tsx`, `context.ts`: platform adapter
  supplying `Overlay`, `BookingLayout`, `BookingTotal`, `Pair`. Mobile layout: scroll column with a folding
  masthead (24/6px thresholds), commit dock measured by ResizeObserver → `--aa-dock-height`, frosted dock.
  Web: 12-col grid, sticky commit rail.
- **AppSwitcher** `shell/AppSwitcher.tsx`: dropdown, `role="menu"`, invisible click-away backdrop, JS hover.
  *Gaps:* no Escape, menuitem roles, arrow keys, `aria-expanded/haspopup`, focus management.
- **DemoActionsMenu** `shell/DemoActionsMenu.tsx`: popover with count badge; outside-click + Escape with focus
  return; `aria-expanded/controls`; panel `role="dialog"`; closes on route change. *Gap:* no focus into panel.
- **DemoClockMenu** `shell/DemoClockMenu.tsx`: popover of clock shortcuts; same hand-rolled logic.
- **DemoResetButton** `shell/DemoResetButton.tsx`: confirm popover; should be `alertdialog`.
- **MoveListPromptProvider** `shared/flows/MoveListPrompt.tsx`: hosts one move sheet above any screen so a
  form inside a sheet can prompt without nesting overlays (a workaround for no overlay stacking).
- **GradientLab** `shell/gradientLab/GradientLab.tsx`: flagged, temporary dockable panel.

## 2. Buttons and toggles

- **Button** `shared/ui/Button.tsx`: primary / secondary / pill, heights 54/48/44. Admin (46 files), mobile,
  24 shared files. *Gaps:* no focus-visible, hover, loading, `aria-disabled`.
- **TickButton** `shared/ui/TickButton.tsx`: outlined icon+text "dealt with" button. Admin, WarningsPanel.
- **StepperButton / NudgeButton** `shared/capture/ui.tsx`: 44px −/+ steppers, ±5 time nudges. Via
  BookingDetailBody. *Gap:* glyph-only labels.
- **AddAttachmentButton** `shared/attachments/AddAttachmentButton.tsx`: teal text-link button.
- **BackLink, ChoiceRow, Initials** `shared/flows/moveSheetParts.tsx`.
- **Mobile press feedback** `theme/global.css`: `:active` scale(0.97); `MobileViewport` adds an empty
  `touchstart` so iOS fires `:active`.
- **ToggleRow switch** `pwa/PwaDemoPanel.tsx`: `role="switch"`, hand-drawn.
- **Filter toggle chips** `shared/StatusLegend.tsx`: `aria-pressed` when `onToggleStatus` passed. Admin, web.

## 3. Segmented controls, radio groups, chips

- **SlidingSegmentedControl** `shared/ui/SlidingSegmentedControl.tsx`: measured sliding indicator
  (`offsetLeft/Width` so it survives PhoneFrame `scale()`), ResizeObserver; row / two-col / wrap; teal /
  surface / ink. *Gaps:* `role="group"` + `aria-pressed`, not radiogroup; no arrow keys.
- **Segmented** `shared/ui/Field.tsx`: labelled wrapper. Admin (15), web, mobile. Label is a div.
- **StatusRadioGroup / VacatedSessionChoice** `shared/flows/VacatedSessionChoice.tsx`: proper radiogroup with
  roving tabindex and arrows. The only correct radio group.
- **PwaDemoActions** option list: radiogroup without arrow keys.
- **ModifierChips** `shared/capture/ModifierChips.tsx`: segmented bands + `aria-pressed` stacking chips;
  absorbed codes disabled and struck through.
- **AsaCard** `shared/capture/AsaCard.tsx`: segmented control allowing no selection.
- **AvailabilityForm chips** `shared/availability/AvailabilityForm.tsx`: status and weekday toggle groups,
  quick-date chips.

## 4. Form fields

- **TextField, TextArea, FieldLabel, FormError** `shared/ui/Field.tsx`: labelled input (div label inside a
  wrapping `<label>`), hint via `aria-describedby`; FormError `role="alert"`. *Gaps:* no focus ring, no
  `aria-invalid`, no field-level error binding.
- **NameSearchBox** `shared/ui/NameSearchBox.tsx`: `role="searchbox"`, clear button, Escape clears. Admin,
  web, move sheets, CodePickerSheet.
- **Native `<select>`**: `ContractSelect`, `EditBillingSetupSheet`, `EditProcedureSheet`,
  `FunderAllocationSheet` (unlabelled), `ManualBookingForm`, `DemoActionsMenu`, `apps/demo/DemoData.tsx`
  (five, unlabelled).
- **Native `type="date"`**: `EditPatientSheet`, `ManualBookingForm`, `AvailabilityForm`.
- **Inline-edit number** `shared/capture/ProcedureCodeCard.tsx`: tap-to-type, Enter commits, Escape cancels,
  focus restored.
- **OverrideCard / PriceOverrideSheet**: segmented mode + amount + required reason.
- **Validation**: all hand-rolled. Store guards return refusal strings → `FormError` / `role="alert"`;
  `validateBookingForBilling`; on failed complete `BookingDetailBody` focuses the first
  `[data-validation-fields]` control and marks `data-validation-focus`. `FailureNotes` shows messages.

## 5. Combobox, type-ahead, pickers

- **CodePickerSheet** `shared/capture/CodePickerSheet.tsx`: RVG code type-ahead. NameSearchBox over a filtered
  button list, live match count, `aria-current` on chosen row. *Gaps:* not combobox/listbox, no arrow/Enter
  selection, no virtualisation (all rows render).
- **MoveBookingToColleagueSheet / MoveListSheet** `shared/flows/`: multi-step wizards (find, confirm, done).
  *Gaps:* no combobox semantics; `aria-disabled` on divs.
- **ContractSelect** `shared/contracts/ContractSelect.tsx`: native select with grouping.

## 6. Calendar

- **MonthGrid** `shared/calendar/MonthGrid.tsx`: roving tabindex, arrows (day/week), Home/End, PageUp/Down
  (Shift = year), `aria-current="date"`, month/year jump panel, bounded range, Today, caller-rendered day
  content. Mobile. *Gap:* `role="group"` not `grid`.
- Pure helpers: `shared/availability/monthCells.ts`, `dayLabel.ts`.

## 7. Display

StatusChip (admin 8, web 5, mobile 4, demo 2), StatusBlock (solid / hatched / dashed), StatusLegend, Pill,
ProgressPill, OutOfHoursMoon / OutOfHoursPill, WarningTriangle (`role="img"`, `title`), DemoBadge /
DemoTriggerBadge, TickBadge (draw + pulse), Avatar (white, crimson initials), Initials, a hand-duplicated
persona chip in `shell/AppShell.tsx`, Logo, Wordmark.

## 8. Lists, rows, cards, tables

ListRow (status rail, state cluster), CaptureSection (card with footer slot), Pair, capture cards (Times,
Units, ProcedureCode, Asa, Override, BillingLines, Notes, assembled by `BtmCaptureBlock`), BookingTotalPanel
(dark summary, animated figures), CompleteBar (sticky CTA / success + Amend), WarningsPanel, AlertOfficeEntry,
MovedToYouPanel, SeriesList / AvailabilitySlotPanel (inline confirm-delete), AttachmentStrip (hover remove on
desktop, 44px on mobile), ListInvoices. Tables: raw `<table>` in `apps/demo/DemoData.tsx` (2) and
`DemoXero.tsx` (3, clickable rows via `.aa-clickable-table-row`).

## 9. Disclosure and timeline

HistoryTimeline `shared/booking/HistoryTimeline.tsx` (grouped steps, `grid-template-rows` 0fr→1fr, stacks
under ~360px); HistorySheet (in Overlay); `.aa-disclosure` styling for native `<details>`.

## 10. Feedback

- **SuccessOverlay** `shared/ui/SuccessOverlay.tsx`: blurred flood (z 60), `aa-circle-pop`, `aa-tick-draw`,
  haptic via `theme/haptics.ts` (`navigator.vibrate`, skipped under reduced motion), `role="status"`,
  tap-to-dismiss armed after the tick; owner runs a 1050ms timer. Used via `CompletionOverlay` and
  SubmitListSheet.
- ResultLine, InlineDemoTrigger: inline `role="status"`.
- **UpdatePrompt** `pwa/UpdatePrompt.tsx`: floating snackbar above `--aa-dock-height`; polls service worker.
- **InstallCoach** `pwa/InstallCoach.tsx`: dismissible banner.
- PhotoCaptureFlow: fake 900ms processing step.
- **No toast system.**

## 11. Motion and gestures

`useTickingValue` (320ms rAF tween, cubic ease-out, green flash, reduced-motion aware) used by
BookingTotalPanel; TimesCard travelling Start/Finish button (`.aa-time-action-slider`,
`.aa-time-details-reveal`); collapsing masthead; `aa-card-in` / `motion.cardAdvance` for SlideStack. No drag
or swipe in this scope.

## 12. Shell, device hosts, PWA

AppShell (48px ink header, `100dvh`), PhoneFrame (bezel, zoom group persisted in localStorage, CSS
`transform: scale`), MobileViewport (`env(safe-area-inset-*)` → `--aa-inset-*`, `visualViewport` →
`--aa-keyboard-inset`), AtmosphereLayer, PwaDemoActions / PwaDemoPanel, RequireEntity /
LegacyBookingRedirect, DockSpacer (WebKit padding-bottom workaround).

## 13. Demo surfaces

DemoSurface, DemoControlPanel (card grid, two-step confirms, JS hover), DemoData (two tables, five unlabelled
selects), DemoIntegrations (three-pane HL7 → FHIR → effect, `setInterval` drip), DemoXero (tables,
master-detail).

## 14. Home-grown versions of usual library pieces

| Concern | Home-grown version |
|---|---|
| Modal / drawer | Dialog + BottomSheet via Overlay; topmost-only Escape stack; no trap, restore or portal |
| Popover / menu | AppSwitcher + three harness popovers, outside-click logic written three times |
| Toast | none; inline status boxes; UpdatePrompt the only snackbar |
| Tooltip | native `title=` only (~75 uses) |
| Combobox | NameSearchBox over button lists; no listbox or arrows |
| Date picker | MonthGrid + native `type="date"` |
| Segmented / radio | SlidingSegmentedControl; StatusRadioGroup |
| Switch | ToggleRow |
| Table | raw `<table>`; no sort, paging or virtualisation |
| Form validation | store refusals + FormError + focus-first-invalid |
| Number animation | useTickingValue |
| Success animation | SuccessOverlay / TickBadge + haptics |
| Command palette | none |
| Accordion | HistoryTimeline; `.aa-disclosure` |

## 15. Styling today

- `theme/tokens.ts`: neutrals (ink, slate, mist, lineStrong, line, sunken, bg, surface), brand crimson
  (identity), accent teal (action, `focusRing`), success/warning/error triples (solid, tint, onTint), fonts,
  type scale, 4pt `space`, `radius` (ctl 10, card 14, panel 20, sheet 24, pill), `elevation` e0 to e3,
  `scrim`. `theme/statusColours.ts`: six status entries + hatched/dashed treatments, resolved from master
  data. `theme/mobileGradient.ts`: atmosphere maths → `--aa-atmos-*`.
- Components write inline `style={{}}` from tokens; hover often via JS mouse handlers; most buttons have no
  focus-visible style.
- `global.css`: Tailwind v4 `@import` + `@theme` mirror (utilities unused), self-hosted fonts, `.mono`, inset
  contract classes, `.aa-mobile-canvas`, focus classes, table helpers, `.aa-disclosure`, `.aa-row-reveal`,
  mobile press scale, iOS 16px input font, `.aa-invoice-doc` print rules, a reduced-motion block forcing
  80ms.
- `theme/motion.ts`: easings (sheet, card, tick, easeOut) and patterns `controlPress` 90, `selectionSlide`
  180, `sheetIn` 320/260/240, `cardAdvance` 260/240 (parallax −24%, dim 0.08), `completeTick` (draw 360 after
  60, pulse 420, haptic at 200), `valueTick` (160/step, tint 240), `reducedMotionFade` 80. Keyframes:
  `aa-sheet-in/out`, `aa-card-in`, `aa-tick-draw`, `aa-tick-pulse`, `aa-fade-in/out`, `aa-circle-pop`,
  `aa-tick-pop`.

## 16. Cross-cutting gaps

No focus trap / initial focus / restore / portal on any overlay; BottomSheet no Escape; Dialog no scroll
lock; menus lack roles and arrows; segmented controls are toggle buttons not radios; no consistent focus ring;
unlabelled selects; no combobox semantics; no virtualisation; ad hoc z-index (BottomSheet 70, SuccessOverlay
60, UpdatePrompt 60, PwaDemoActions 55, booking dock 45, AppSwitcher 90/100, DemoActionsMenu 120, Dialog 200).
