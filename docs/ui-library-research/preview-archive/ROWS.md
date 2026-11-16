# Catalogue rows

Every `<CatalogueRow>` in the prototype catalogue (`aa-prototype/src/apps/demo/catalogue/{Admin,Web,Mobile}Catalogue.tsx`), in page order. Machine copy with the verbatim text props, example component, deps and sample data: `rows.json`. Extracted 2026-11-11 by parsing the catalogue TSX (TypeScript AST), resolving the `usedIn` constants and template notes; deps were derived from the example code and the real component file it mounts, then spot-checked.

Flags: **R** recreated (the row shows a copy, not the real component: `recreations.tsx` or a note saying Recreated / Rebuilt), **C** composite (mounts a whole screen or a big composite). Deps: read / WRITE (store), router, overlay (surface Overlay, BottomSheet or a hand-rolled scrim drawer), timers, virtual (PWA virtual module).

## Admin (63 rows)

| # | Name | Group | Stage | Replace with | Deps | Flags |
|---|---|---|---|---|---|---|
| 1 | Button | shadcn | web | shadcn Button (cva variants) |  |  |
| 2 | TickButton | shadcn | web | shadcn Button (outline variant + icon) |  |  |
| 3 | Segmented | shadcn | web | shadcn ToggleGroup (single) |  |  |
| 4 | SlidingSegmentedControl | shadcn | web | shadcn ToggleGroup (single) or Tabs |  |  |
| 5 | StatusLegend (chips) | shadcn | web | shadcn ToggleGroup (multiple) |  |  |
| 6 | SignalFilterButton (DayGrid focus filters) | shadcn | web | shadcn ToggleGroup (multiple) / Toggle | read | C |
| 7 | Dialog (useSurface().Overlay) | shadcn | web | shadcn Dialog | overlay |  |
| 8 | MasterPanel / PanelGrid / PanelSection | shadcn | web | shadcn Sheet (side) | overlay |  |
| 9 | SlotDrawer | shadcn | web | shadcn Sheet (side) | read, WRITE, router, overlay | C |
| 10 | DraftListDrawer | shadcn | web | shadcn Sheet (side) | read, overlay |  |
| 11 | ClearConflictSheet | shadcn | web | shadcn AlertDialog | read, WRITE, overlay |  |
| 12 | HistorySheet | shadcn | web | shadcn Dialog + Accordion | read, overlay |  |
| 13 | SideNav (with RolesInfo) | shadcn | web 600 | shadcn Sidebar |  |  |
| 14 | Master data sub-nav | shadcn | web 420 | shadcn Sidebar group / NavigationMenu |  | R |
| 15 | TabButton (Integrations) | shadcn | web 420 | shadcn Tabs | read, WRITE | C |
| 16 | TabLink (AA fees) | shadcn | web | shadcn Tabs (as links) |  | R |
| 17 | DayNav (with SortToggle) | shadcn | web | shadcn Button Group + ToggleGroup + Date Picker | read |  |
| 18 | StatusChip | shadcn | web | shadcn Badge (6 status variants) |  |  |
| 19 | Pill | shadcn | web | shadcn Badge |  |  |
| 20 | MasterPills | shadcn | web | shadcn Badge |  |  |
| 21 | TierPill / PreferredPill / NotPreferredPill | shadcn | web | shadcn Badge |  |  |
| 22 | ChangedSinceSubmittedPill | shadcn | web | shadcn Badge + Tooltip | read |  |
| 23 | DraftListParts | shadcn | web | shadcn Badge | read |  |
| 24 | ConflictDot | shadcn | web | shadcn Badge (dot) + Tooltip |  |  |
| 25 | WarningTriangle | shadcn | web | shadcn Tooltip + Badge | read |  |
| 26 | NameSearchBox | shadcn | web | shadcn Input Group (search) | read |  |
| 27 | ContractSelect (fieldChrome select) | shadcn | web | shadcn Select (or NativeSelect) | read |  |
| 28 | SurgeonPicker | shadcn | web | Base UI Combobox (with groups) | read, WRITE |  |
| 29 | NotPreferredWarning | shadcn | web | shadcn Alert | read, WRITE |  |
| 30 | ChipMultiSelect | shadcn | web | Base UI Combobox (multiple, chips) | read |  |
| 31 | CodePickerSheet | shadcn | web | Base UI Combobox + TanStack Virtual | read, overlay |  |
| 32 | ConflictCallout | shadcn | web | shadcn Alert | read |  |
| 33 | WarningsToDo | shadcn | web | shadcn Card + Collapsible | read, WRITE |  |
| 34 | NotificationsCard | shadcn | web | shadcn Card + Button | read, WRITE, timers |  |
| 35 | VacatedSessionChoice / StatusRadioGroup | shadcn | web | shadcn RadioGroup |  |  |
| 36 | ProfileChrome | shadcn | web | shadcn Card (+ Breadcrumb for BackLink) | router |  |
| 37 | drawerParts (Section, Row, DrawerLink, ActionBtn) | shadcn | web | shadcn Button + DropdownMenu |  |  |
| 38 | Inline success banner (role=status) | sonner | web | Sonner toast (with action and undo) |  | R |
| 39 | Table / Header / TextAction / EditCell | tanstack | web | TanStack Table + shadcn Table | read |  |
| 40 | ReviewQueue (clickable rows) | tanstack | web 380 | TanStack Table + shadcn Table (row links) | read | C |
| 41 | RvgGroupsView (grouped rows) | tanstack | web 460 | TanStack Table (grouping) + shadcn Table | read, WRITE, overlay | C |
| 42 | AuditViewer | tanstack | web 460 | TanStack Table + TanStack Virtual | read | C |
| 43 | TextField | forms | web | shadcn Field + Input (React Hook Form) |  |  |
| 44 | TextArea | forms | web | shadcn Field + Textarea |  |  |
| 45 | FieldLabel / FormError | forms | web | shadcn Label + FieldError (Zod schema) |  |  |
| 46 | ContractPanel (ContractEditSheet) | forms | web | shadcn Sheet + Field + React Hook Form + Zod | read, WRITE | C |
| 47 | SlotStatusSheet | forms | web | shadcn Dialog + Field + ToggleGroup (swatches) + RHF/Zod | read, WRITE, overlay |  |
| 48 | ContractPriceRanges | forms | web | Base UI NumberField + TanStack Table (cell edit) | read, WRITE, timers |  |
| 49 | MiniCalendar (RightRail) | daypicker | web 420 | shadcn Calendar (react-day-picker) | read | C |
| 50 | HospitalCalendar | daypicker | web 520 | shadcn Calendar (custom day content) | read, WRITE | C |
| 51 | Native date input (TextField type=date) | daypicker | web | shadcn Date Picker (Popover + Calendar) | read |  |
| 52 | SessionTimesFields | daypicker | web | React Aria TimeField (or keep native) | read |  |
| 53 | RVG anatomy datalist | daypicker | web | Base UI Autocomplete |  | R |
| 54 | SuccessOverlay | motion | web 200 | Custom on Motion (keep the choreography) | timers |  |
| 55 | TickBadge | motion | web | Custom on Motion |  |  |
| 56 | DayGrid | custom | web 620 | Custom on primitives (grid roles, Tooltip, TanStack Virtual) | read, WRITE, router, overlay | C |
| 57 | DraftListBand | custom | web | Custom (Tooltip on blocks) | read, overlay |  |
| 58 | StatusBlock | custom | web | Custom (status cell rendering) | read |  |
| 59 | Review summary tiles (ReviewScreen) | custom | web 560 | Custom on shadcn Card + Table + AlertDialog | read, WRITE, overlay | C |
| 60 | Billing pipeline stepper (PipelineCard) | custom | web | Custom on shadcn Badge + Tooltip | read | R |
| 61 | InvoiceDocument | custom | web 520 | Custom (print-styled page) | read, WRITE | C |
| 62 | AnaesthetistCandidates | custom | web 420 | Custom on Base UI Combobox / listbox | read, WRITE |  |
| 63 | DraftListCandidates | custom | web 420 | Custom on Base UI Combobox / listbox | read, WRITE |  |

## Web (53 rows)

| # | Name | Group | Stage | Replace with | Deps | Flags |
|---|---|---|---|---|---|---|
| 1 | WebNav | shadcn | web | shadcn NavigationMenu (links) + Avatar | read |  |
| 2 | AvailabilityPageSwitch | shadcn | web | shadcn Tabs (as links) | router |  |
| 3 | SubTabButton | shadcn | web | shadcn Tabs |  | R |
| 4 | Back link | shadcn | web | shadcn Breadcrumb |  | R |
| 5 | Panel | shadcn | web | shadcn Card |  |  |
| 6 | StatTile | shadcn | web | shadcn Card + Badge | read | R |
| 7 | SlidingSegmentedControl | shadcn | web | shadcn ToggleGroup (single) |  |  |
| 8 | Segmented | shadcn | web | shadcn ToggleGroup (single) |  |  |
| 9 | FilterChip | shadcn | web | shadcn ToggleGroup (single) | read | R |
| 10 | StatusLegend (toggle mode) | shadcn | web | shadcn ToggleGroup (multiple) |  |  |
| 11 | StatusChip | shadcn | web | shadcn Badge (status variants) |  |  |
| 12 | ProgressPill | shadcn | web | shadcn Badge |  |  |
| 13 | WebDayChip | shadcn | web | shadcn Badge (removable) / Button | read |  |
| 14 | WarningTriangle | shadcn | web | shadcn Tooltip + Badge | read |  |
| 15 | Who's free chip | shadcn | web | shadcn Tooltip | read | R |
| 16 | IconBtn · NavButton · WeekNavButton | shadcn | web | shadcn Button (size icon) |  | R |
| 17 | Day stepper | shadcn | web | shadcn Button Group | read | R |
| 18 | LinkButton | shadcn | web | shadcn Button (variant link) |  | R |
| 19 | SubmitAction | shadcn | web | shadcn Button variants + Badge | read | R |
| 20 | Add a booking (dashed) | shadcn | web | shadcn Button (outline, dashed variant) | read | R |
| 21 | Progress bar | shadcn | web | shadcn Progress |  | R |
| 22 | Dialog (web Overlay) | shadcn | web | shadcn Dialog | read, overlay | R |
| 23 | SubmitListSheet | shadcn | web | shadcn Dialog (AlertDialog for the confirm step) | read, WRITE, overlay |  |
| 24 | AddAttachmentButton · AddAttachmentSheet | shadcn | web | shadcn Button + Dialog | read, WRITE, overlay |  |
| 25 | WebSearchField | shadcn | web | shadcn Input Group (search) | read |  |
| 26 | NameSearchBox | shadcn | web | shadcn Input Group (search) |  |  |
| 27 | MovedToYouPanel | shadcn | web | shadcn Alert | read, router |  |
| 28 | SeriesList | shadcn | web | shadcn Card list + AlertDialog | read, WRITE |  |
| 29 | CodePickerSheet | shadcn | web | shadcn Combobox (Base UI) + TanStack Virtual | read, overlay |  |
| 30 | ProcedureCodeCard | shadcn | web | shadcn Card + Base UI NumberField | read, WRITE |  |
| 31 | TimesCard | shadcn | web | shadcn Card + Button Group | read, WRITE, overlay |  |
| 32 | UnitsCard | shadcn | web | shadcn Card + Button Group (labelled steppers) | read, WRITE |  |
| 33 | ResultLine | sonner | web | Sonner toast | read, WRITE |  |
| 34 | Lists table (Th · Td · GroupRow) | tanstack | web 560 | TanStack Table + shadcn Table (grouped rows) | read, router | C |
| 35 | WebResultsTable | tanstack | web 460 | TanStack Table + shadcn Table | read, router |  |
| 36 | WebDayTable | tanstack | web 360 | TanStack Table + shadcn Table | read, router |  |
| 37 | Accounts tables (tfoot totals) | tanstack | web 560 | TanStack Table + shadcn Table (footer) | read | C |
| 38 | List detail Bookings table | tanstack | web 700 | TanStack Table + shadcn Table | read, WRITE, router | C |
| 39 | ListInvoices | tanstack | web | shadcn Table (plain) | read |  |
| 40 | AvailabilityEditor | forms | web 520 | React Hook Form + Zod + shadcn Field | read, WRITE | C |
| 41 | AlertOfficeEntry | forms | web | shadcn Dialog + Field + React Hook Form | read, WRITE, overlay |  |
| 42 | OverrideCard | forms | web | Base UI NumberField + shadcn Field + React Hook Form | read, WRITE |  |
| 43 | WeekStrip | daypicker | web 300 | react-day-picker (week view, custom day content) | read, router |  |
| 44 | My availability month grid (DayCell) | daypicker | web 720 | shadcn Calendar (react-day-picker, range mode, custom day content) | read, WRITE, router | C |
| 45 | WebGoToDate | daypicker | web | shadcn Date Picker (Popover + Calendar) | read |  |
| 46 | Receivables aging bars | recharts | web | Recharts bar chart (shadcn Chart) | read | R |
| 47 | BookingTotalPanel · useTickingValue | numberflow | web | NumberFlow (optional swap for useTickingValue) | read |  |
| 48 | TickBadge | motion | web | Custom on Motion |  |  |
| 49 | CompleteBar | motion | web | Custom on Motion (shadcn Button inside) | overlay |  |
| 50 | Cell (AvailabilityGrid) | custom | web | Custom cell on a grid + shadcn Tooltip | read | R |
| 51 | AvailabilityGrid | custom | web 640 | Custom grid (role grid, roving focus) on library primitives | read, WRITE, router | C |
| 52 | HistoryTimeline | custom | web 460 | Custom, its expandable groups on shadcn Collapsible | read |  |
| 53 | AttachmentStrip | custom | web | Custom (consider a Dropzone) | read, overlay |  |

## Mobile (54 rows)

| # | Name | Group | Stage | Replace with | Deps | Flags |
|---|---|---|---|---|---|---|
| 1 | BottomSheet | shadcn | mobile 420 | shadcn Drawer (Base UI Drawer) | overlay |  |
| 2 | ListOptionsSheet | shadcn | mobile 520 | shadcn Drawer + plain button list | overlay |  |
| 3 | AlertOfficeSheet | shadcn | mobile 560 | shadcn Drawer + Field (React Hook Form + Zod) | read, WRITE, overlay |  |
| 4 | SubmitListSheet | shadcn | mobile 560 | shadcn Drawer | read, WRITE, overlay |  |
| 5 | AvailabilityEditor | shadcn | mobile 600 | shadcn Drawer + Field + ToggleGroup (React Hook Form + Zod) | read, WRITE, overlay | C |
| 6 | Button (MobileButton) | shadcn | mobile 320 | shadcn Button (cva variants) |  |  |
| 7 | Mobile press feedback (:active) | shadcn | mobile 280 | shadcn Button active state (active: utilities) |  |  |
| 8 | SlidingSegmentedControl | shadcn | mobile 260 | shadcn ToggleGroup (single) or Tabs |  |  |
| 9 | Segmented | shadcn | mobile 220 | shadcn ToggleGroup + Field label |  |  |
| 10 | Filter chips (Week / Month / To-Do / Done) | shadcn | mobile 200 | shadcn ToggleGroup (single) |  | R |
| 11 | StepperButton | shadcn | mobile 200 | shadcn Button (icon) + Button Group |  |  |
| 12 | NudgeButton | shadcn | mobile 200 | shadcn Button (sm, outline) + Button Group |  |  |
| 13 | CaptureSection | shadcn | mobile 260 | shadcn Card (CardHeader / CardContent / CardFooter) |  |  |
| 14 | StatusChip | shadcn | mobile 220 | shadcn Badge + 6 status variants | read |  |
| 15 | ProgressPill | shadcn | mobile 200 | shadcn Badge |  |  |
| 16 | OutOfHoursPill | shadcn | mobile 160 | shadcn Badge (secondary, with icon) |  |  |
| 17 | AgeChip | shadcn | mobile 240 | shadcn Badge |  | R |
| 18 | DayChip | shadcn | mobile 160 | shadcn Badge (as a button, with dismiss icon) | read, overlay |  |
| 19 | Avatar | shadcn | mobile 160 | shadcn Avatar (AvatarFallback) |  |  |
| 20 | Hero figure card | shadcn | mobile 200 | shadcn Card | read | R |
| 21 | EmptyCard | shadcn | mobile 180 | shadcn Empty |  | R |
| 22 | MovedToYouPanel | shadcn | mobile 300 | shadcn Card + Item list | read |  |
| 23 | Booking card (Capture pill) | shadcn | mobile 340 | shadcn Item (as a button) + Badge | read | R |
| 24 | Progress bar | shadcn | mobile 180 | shadcn Progress |  | R |
| 25 | LookbackSearchRow | shadcn | mobile 200 | shadcn Input Group (search) + Button | read, overlay |  |
| 26 | LookbackResults (ResultRow) | shadcn | mobile 420 | shadcn Item list + Badge | read, overlay |  |
| 27 | SeriesList | shadcn | mobile 260 | shadcn Item list + AlertDialog (confirm remove) | read, WRITE |  |
| 28 | ToggleRow (switch) | shadcn | mobile 180 | shadcn Switch |  | R |
| 29 | InstallCoach | shadcn | mobile 340 | shadcn Alert |  | R |
| 30 | UpdatePrompt | sonner | mobile 240 | Sonner toast with a Reload action | virtual | R |
| 31 | BookingDetailBody | forms | mobile 640 | React Hook Form + Zod over shadcn Card fields | read, WRITE, overlay, timers | C |
| 32 | TextField | forms | mobile 200 | shadcn Field + Input + Label |  |  |
| 33 | TextArea | forms | mobile 200 | shadcn Field + Textarea |  |  |
| 34 | FormError | forms | mobile 200 | shadcn FieldError (bound to the field by RHF) |  |  |
| 35 | MonthGrid (LookbackDateSheet) | daypicker | mobile 600 | shadcn Calendar (react-day-picker) | read, overlay |  |
| 36 | My calendar month grid | daypicker | mobile 520 | shadcn Calendar with a custom day renderer |  | R |
| 37 | 6-day date strip | daypicker | mobile 200 | react-day-picker (single week row) or ToggleGroup | read | R |
| 38 | useTickingValue | numberflow | mobile 220 | NumberFlow | timers |  |
| 39 | SlideStack | motion | mobile 420 | Custom on Motion (drag + AnimatePresence) | overlay |  |
| 40 | SuccessOverlay | motion | mobile 360 | Custom on Motion | timers |  |
| 41 | TickBadge | motion | mobile 200 | Custom on Motion |  |  |
| 42 | Collapsing masthead | motion | mobile 460 | Custom on Motion (scroll-driven) | overlay | R |
| 43 | TimesCard | motion | mobile 340 | shadcn Card + Button, travel on Motion (layout) | read, WRITE, overlay |  |
| 44 | CompleteBar | motion | mobile 180 | shadcn Button; success state custom on Motion | overlay |  |
| 45 | BottomTabBar | custom | mobile 220 | Custom nav of links with aria-current |  | R |
| 46 | MobileHeader | custom | mobile 140 | Custom (keep), title as a real h1 |  |  |
| 47 | ListRow | custom | mobile 460 | Custom on shadcn Item / Card (status rail stays ours) | read |  |
| 48 | Sticky submit dock | custom | mobile 260 | Custom fixed footer with shadcn Button inside |  | R |
| 49 | DockSpacer | custom | mobile 340 | Custom (keep; part of the inset contract) |  |  |
| 50 | Colleague AM / PM cells | custom | mobile 460 | Custom status cells + shadcn Tooltip | read | R |
| 51 | HalfBlock | custom | mobile 200 | Custom + shadcn Tooltip | read | R |
| 52 | WarningTriangle | custom | mobile 240 | Custom + shadcn Tooltip | read |  |
| 53 | OutOfHoursMoon | custom | mobile 140 | Custom (lucide icon, keep) |  |  |
| 54 | AttachmentStrip | custom | mobile 260 | Custom; consider shadcn Attachment or a Dropzone | overlay |  |

## Builder notes

### Helper files and what a rebuild can reuse

Paths are under `aa-prototype/src/apps/demo/catalogue/`.

- `admin/adminData.ts`: `useAdminDay(dateISO, rosterLimit?)` (memoised day view: `masters`, `anaesthetists`, `viewsByAnaesthetist`, `warningFlags`, `todoRows`, `draftLists`, `bookingCounts`, `horizonEndISO`, derived as `AdminApp.tsx` does); `useSeedIds()` (`todayISO`, `submittedListId`, `draftListId`, `conflictedListId`, `activeSlotId`, `emptySlotId`, `invoiceId`, `fixedContractId`, `holidayId`, each read from the store, never hard-coded); `STAGE_TONE` (the billing pipeline chip tones).
- `admin/basicExamples.tsx`: 32 `*Example` components with inline literal props (no store or a single selector: `masters.anaesthetists`, `masters.specialties`, `masters.slotStatuses`, `appSettings.schedule.defaultTimes.AM`, `useToday()`); helpers `Echo` (shows the last callback) and `Wide({ minWidth })` (horizontal-scroll wrapper used by the five screen-mounting rows).
- `admin/storeExamples.tsx`: 27 store-backed examples, all fed by `useSeedIds()` / `useAdminDay(today)` plus `OFFICE_ACTOR`; `PipelineStepperExample` uses the real `billingMonitor` selector with `STAGE_TONE`.
- Admin rows that mount a screen directly (no helper): `IntegrationMonitorScreen`, `ReviewQueue`, `RvgGroupsView`, `AuditViewer`, `HospitalsView` (all from `apps/admin/screens/`).
- `web/fixtures.ts`: `useWebFixtures()` returning `WebFixtures` (`actor`, `anaesthetistId`, `personaName`, `initials`, `todayISO`, `detailListId`, `capture {listId, bookingId, procedureId}`, `authorisedListId`, `pastDayISO`, `searchSeed`, `historyEntityId`, `movedToId`, `attachments`) for the web persona (Dr Souter, `APP_CONFIG.web.persona`). Every web demo takes it as `f`.
- `web/demos.tsx`: 53 `*Demo({ f })` components; local consts `SUB_TABS`, `PROGRESSES`, `RESULT_SAMPLES`. Wraps router-using rows in `Sandboxed` / `NavSandbox`.
- `web/recreations.tsx`: copies of components local to screens: `StatTile`, `LinkButton`, `FilterChip`, `SubTabButton`, `IconBtn`, `NavButton`, `WeekNavButton`, `DayPill`, `TodayButton`, `BackLink`, `SubmitAction`, `AddBookingButton`, `ProgressBar`, `AGING_ROWS`, `AgingBars`, `WhosFreeChip`, `AvailabilityCell`. Their props are the clearest spec for the rebuild.
- `web/sandbox.tsx`: `NavSandbox({ onNavigate })` (overrides React Router's navigation context so links stay on the page), `Sandboxed` (render-prop `go(what)` echo), `Wide({ width = 1180 })`, `RowBoundary` (error boundary), `Knobs` / `KnobButton` (state toggles for a demo). The preview can reuse `NavSandbox` for its own router-dependent rows.
- `mobile/persona.ts`: `useMobilePersona()` (`actor`, `anaesthetistId`, `personaName`, `initials` from `APP_CONFIG.mobile.persona`); `useSeedPicks(anaesthetistId)` (`ownListIds`, `listId`, `bookingId`, `procedureId`, taken once on first render so a row's subject does not move after a write).
- `mobile/examples.tsx`: 54 `*Example` components (picks passed as a prop where needed); helpers `Bleed` (edge-to-edge in the stage) and `Said({ line })` (callback echo); `SAMPLE_ATTACHMENTS` (local attachments for AttachmentStrip).
- `mobile/recreations.tsx`: `*Copy` components for pieces local to screens or the PWA host: `BottomTabBarCopy` (`TABS`), `FilterChipsCopy` (`FILTERS`), `BookingCardCopy` (`BookingCardData`, `BookingCardState`), `ProgressBarCopy`, `SubmitDockCopy` (`DockState`), `DateStripCopy`, `ColleagueCellsCopy`, `HalfBlockCopy`, `MyCalendarGridCopy`, `HeroFigureCardCopy`, `AgeChipCopy`, `EmptyCardCopy`, `ToggleRowCopy`, `UpdatePromptCopy`, `InstallCoachCopy`.

### Library components the rows call for, beyond Button / Badge / Dialog / Drawer / Tabs / ToggleGroup / Card / Table

- shadcn: AlertDialog, Accordion, Alert, Avatar, Breadcrumb, Button Group, Calendar, Collapsible, Date Picker (Popover + Calendar), DropdownMenu, Empty, Field / FieldError / Label, Input, Input Group, Item, NavigationMenu, Progress, RadioGroup, Select / NativeSelect, Sheet (side), Sidebar, Switch, Textarea, Toggle, Tooltip.
- Base UI direct: Combobox (with groups; multiple with chips; with TanStack Virtual), Autocomplete, NumberField (in RHF fields and as a TanStack Table cell editor).
- TanStack: Table with grouping, footer totals, row links and cell edit; Virtual on the RVG combobox and one table.
- Others: Sonner (plain, with action and undo, with a Reload action), RHF + Zod, react-day-picker (custom day content, range mode, week view), Recharts bar chart, NumberFlow, Motion (layoutId, layout, AnimatePresence, drag, scroll-driven).
- Menu: only as an option in the ListOptionsSheet note (drop the menu roles or use a real Menu).
- Not called for by any row: Command, HoverCard, ContextMenu, Menubar, Carousel, Resizable, Slider, InputOTP.
- Outside the agreed stack: SessionTimesFields names React Aria TimeField (or keep native); mobile AttachmentStrip names "shadcn Attachment" (not a stock shadcn component) or a Dropzone.
