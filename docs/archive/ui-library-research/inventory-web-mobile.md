# Inventory: Anaesthetist Web and Mobile apps

Snapshot 11 Nov 2026, commit `48fa38d4`. Scope `src/apps/web/**` and `src/apps/mobile/**`, read in full. No
component library; inline `style={{}}` on tokens, lucide-react, date-fns.

## WEB

### Shell
- `WebApp.tsx`: `minWidth: 1240`, 1320 max container, `SurfaceProvider variant="web"` (Overlay = Dialog),
  `MoveListPromptProvider`; active tab from URL.
- `routes.tsx`: URL params → props (`?week=`, `?q=`, `?day=`, `?date=`, `/accounts/:subTab`, `?invoice=`);
  back-to-search via location state; `RequireEntity` guards.
- `outlet.ts`, `useDashboardFigures.ts`: no UI.

### Screens
| Screen | Purpose | Main patterns |
|---|---|---|
| `screens/DashboardScreen.tsx` | Greeting, today, week, receivables, productivity, leave, who's free | 12-col grid of `Panel`s; `WeekStrip`; aging bar chart (spans); stat tiles; leave list; chip list; "Which List?" picker in Overlay |
| `screens/ListsScreen.tsx` | List table, earlier unauthorised then today on | Search, native date (go to / "To"), StatusLegend chips, day chip, grouped table, row click + small keyboard button |
| `screens/ListsLookback.tsx` | Search, go to date, results / day tables | `WebSearchField`, `WebGoToDate`, `WebDayChip`, `WebResultsTable`, `WebDayTable` |
| `screens/ListDetailView.tsx` | One List | Back link, Move this List, 3-state `SubmitAction`, progress bar, table + totals, dashed Add a booking, shared AddBookingFlow / SubmitListSheet / attachments / ListInvoices / AlertOfficeEntry |
| `screens/BookingDetailView.tsx` | Booking capture | Header around shared `BookingDetailBody` |
| `screens/AvailabilityGrid.tsx` | Find cover for one day | Day stepper, All / Free only chips, NameSearchBox, StatusLegend, CSS-grid status cells (Move / Move here), AvailabilityPageSwitch, MovedToYouPanel |
| `screens/MyAvailabilityCalendar.tsx` | Own month + rail editor | Month grid (two session cells/day), prev/next/This month, **shift-click range**, rail AvailabilityEditor, SeriesList |
| `screens/AccountsScreen.tsx` | Overdue, Payments, GST, AA fees | Underline sub-tabs, 4 tables with `tfoot`, pills, `?invoice=` highlight, Segmented GST period |

### Local components
- **WebNav**: top tabs with crimson underline + persona avatar; plain buttons, no `aria-current` /
  tablist / nav label; hand-rolled avatar.
- **Panel**: `<section>` with a div title (no heading).
- **WeekStrip**: 7-col week of session blocks; List blocks are buttons; prev/next; merged full-day off. Today
  by colour only; truncated labels without tooltip.
- **AvailabilityPageSwitch**: SlidingSegmentedControl used as route navigation.
- In screens: StatTile (static value + "+n%"), LinkButton, aging bars (no chart semantics), FilterChip (no
  `aria-pressed`), IconBtn / NavButton / WeekNavButton (three near-duplicates, labelled), Cell (disabled when
  no action, so not keyboard-readable), SubmitAction, SubTabButton (no tab roles), `Th`/`Td` (duplicated in
  four files), DayCell, GroupRow.

### Web a11y gaps
Row-click tables with a hidden button handle; List detail Bookings table has **no** keyboard handle; no
sorting; no tab semantics on nav, Accounts sub-tabs, filter chips; mostly browser-default focus rings
(`aa-web-calendar-day` has no CSS rule); information in `title` only; today by colour only.

## MOBILE

### Shell
- `MobileApp.tsx`: `host` prop (PhoneFrame in prototype, MobileViewport in PWA), `SurfaceProvider
  variant="mobile"` (Overlay = BottomSheet), `MoveListPromptProvider`, local **BottomTabBar**.
- `navigation.ts`: URL → stack depth (Lists 0 to 2, Availability 0 to 1).
- `routes.tsx`: one splat route per stack tab hosting a `SlideStack`; remembers last ids so a popped layer
  animates out; pops use `replace`; date sheet, AddBookingFlow and availability Overlay are stack siblings.
- `outlet.ts`: includes a `moreExtra` slot for PWA presenter controls.

### Screens
| Screen | Purpose | Main patterns |
|---|---|---|
| `screens/ForwardListsScreen.tsx` | Lists home, Today anchored | Large-title header, search + calendar button, filter chips (Week / Month / To-Do / Done, `aria-pressed`), day-grouped ListRows, auto-scroll to Today, "n earlier Lists", New badge |
| `screens/ListsLookback.tsx` | Search, date sheet, day view, results | LookbackSearchRow, LookbackDateSheet (MonthGrid in BottomSheet), DayChip, ResultRow cards |
| `screens/ListDetailScreen.tsx` | One List | Back, ⋯ options, animated progress, Booking cards (Capture pill / TickBadge), Add a booking, sticky blurred dock with 4-state submit, ListOptionsSheet, SubmitListSheet, AlertOfficeSheet, AddAttachmentSheet, **SuccessOverlay** |
| `screens/BookingDetailScreen.tsx` | Booking capture | Collapsing large-title masthead around BookingDetailBody |
| `screens/AvailabilityScreen.tsx` | Find cover next 6 days + My availability | 6-day date strip, SlidingSegmentedControl (Everyone / Free only), My availability card, colleague AM/PM cells (buttons when movable), MovedToYouPanel |
| `screens/MyAvailabilityCalendarScreen.tsx` | Own month calendar | Month grid with HalfBlock bars, repeat glyph, amber "!", legend, SeriesList, sticky Add days off; day tap → BottomSheet AvailabilityEditor |
| `screens/BalancesScreen.tsx` | Outstanding invoices, GST | Hero figure (static), segmented, invoice cards with age/ACC chips, GST rows, empty card |
| `screens/MoreScreen.tsx` | Persona, demo note, PWA slot | Static cards, DemoBadge |

### Local components
- **BottomTabBar**: 4 icon+label buttons, blurred background, safe-area padding, hidden when drilled in. No
  tab roles / `aria-current`; active by colour only; not a `<nav>`.
- **SlideStack** `components/SlideStack.tsx` (348 lines, tested): every layer mounted, positioned by
  transform; layer behind parallaxes −24% with 8% dim; layers ahead wait at 100%; `motion.cardAdvance`.
  `useEdgeSwipeBack`: pointer events + capture, touch only, arms within 28px of the left edge, refuses when a
  `[role=dialog][aria-modal]` is open in the layer, 10px axis lock, commits at 35% width or > 0.5 px/ms
  (100ms window), else eases back; `touch-action: pan-y pinch-zoom`; reduced motion tracks but does not move.
  Parked layers `aria-hidden` + `inert`. *Gap:* focus not moved or announced on push/pop.
- **MobileHeader**: large title is a div (no `<h1>`).
- **ListOptionsSheet**: action sheet `role="menu"` / `menuitem` in BottomSheet with Close. No arrow keys or
  focus management.
- `components/index.ts`: re-exports BottomSheet, Button (as MobileButton), TickBadge, FieldLabel, TextField,
  TextArea, Segmented, ListRow.
- In screens: DayHeading, filter chips (duplicated style with web FilterChip), LookbackSearchRow, DayChip,
  ResultRow, AgeChip, EmptyCard, HalfBlock (`title` never shows on touch), MonthButton, `miniBtn`, Booking card
  buttons (accessible name is all concatenated text).

### Mobile a11y gaps
Tab bar semantics; no headings; focus after navigation unmanaged; `title` tooltips; date strip "has free" dot
colour only; BottomSheet no focus trap / initial focus / Escape.

## Specific findings

- **Drag-to-dismiss on sheets: no.** Handle is a close button; open/close are CSS keyframes with a
  `setTimeout` unmount; keyboard inset handled; capped at 90% height. The only gesture is the SlideStack
  edge-swipe.
- **Animated numbers:** none in these apps. Only `shared/capture/useTickingValue.ts` (fee and units in
  booking capture). Progress bars transition width over 300ms. Dashboard and Balances figures are static.
- **Toasts:** none. **Haptics:** only via SuccessOverlay (`theme/haptics.ts`); none in app code.
- **Search:** mobile LookbackSearchRow, web WebSearchField, shared NameSearchBox; state in `?q=`; 2+
  characters (patient name or NHI); grouped Upcoming / Past with a `role="status"` count. No command palette or
  shortcuts.
- **Success feedback:** mobile List submit = SuccessOverlay (flood, circle pop, tick draw, auto-hide 1050ms)
  then a green "Submitted to office" bar; booking completion = TickBadge pop on rows newly complete; **web
  submit has no overlay** (button swaps to a green pill, no live region).

## Where a library helps

Drawer (replace BottomSheet; keep `--aa-keyboard-inset`, `--aa-inset-bottom`, portal into the phone frame);
Dialog (web Overlay, Which List? picker); fix ListOptionsSheet's menu roles; Tabs / NavigationMenu (WebNav,
Accounts sub-tabs, BottomTabBar as nav with `aria-current`, filter chips); ToggleGroup (segmented controls);
Table + TanStack (about 8 tables, `Th`/`Td` four times); Calendar (two My calendar grids, native date inputs,
keep custom cells); Sonner (move, alert, attachment, web submit feedback); Chart (aging bars); Tooltip (many
`title=`); Badge / Card / Button (chips, Panel, dashed add buttons, three icon-button copies).

## Not covered by a library

SlideStack + edge-swipe-back (no stack navigator exists; coordinate with the Drawer so a sheet drag never
pops the stack); collapsing masthead; safe-area and keyboard inset contract under a `scale()`d PhoneFrame
(portals must target the frame); design-language motion choreography and the reduced-motion collapse; status
cell visuals (hatched, dashed, half-blocks, merged holiday, OOH moon); determinism (pass the demo clock's
today to date pickers); PWA navigation policies (replace on pop, always-dismissable overlay).
