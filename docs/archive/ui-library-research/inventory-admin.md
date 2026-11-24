# Inventory: Admin Web App (`src/apps/admin/**`)

Snapshot 11 Nov 2026, commit `48fa38d4`. 117 files, ~17.9k lines. No component library. Inline `style={{}}`
from `src/theme/tokens` plus a few global classes (`aa-clickable-table-row`, `aa-row-reveal` /
`aa-row-gutter`, `aa-filter-toggle`). Icons: lucide-react. Dates: date-fns. Routes: `src/router.tsx`, wrappers
in `src/apps/admin/routes.tsx`.

Native element counts: 45 `<button>`, 28 `<select>`, 26 `<input>` (15 `type="date"`, 6 `type="time"`, 6
checkbox, 1 number, 1 radio), 17 `<table>`, 3 `<details>`, 1 `<datalist>`. No `createPortal`,
virtualisation, drag and drop, column sorting (`aria-sort`) or toasts.

**Shared components Admin leans on:** `useSurface().Overlay` Dialog (~37 uses, every sheet), `Button` (102),
`TextField` (59), `FieldLabel`, `FormError`, `Segmented` (22), `TextArea`, `NameSearchBox`, `HistorySheet`,
`SuccessOverlay`, `SlidingSegmentedControl`, `TickButton` / `TickBadge`, `StatusChip`, `StatusLegend`,
`Pill`, `BookingDetailBody`, `AddBookingFlow`, `VacatedSessionChoice`, `CodePickerSheet`, `SurfaceProvider
variant="web"`.

## 1. Screens and routes

| Route | Screen | Purpose | Main UI patterns |
|---|---|---|---|
| `/admin` → `day/:dateISO` (`?sort=az`) | `AdminDayRoute` (`routes.tsx`) | Daily schedule of all anaesthetists | DayNav toolbar; **DayGrid timeline canvas**; RightRail (mini calendar, notes, review, To-do, Draft Lists, Notifications); List / Draft List drawers; Availability finder; beyond-horizon empty state |
| `day/:dateISO/bookings/:bookingId` | `screens/AdminBookingDetail.tsx` | Office booking record | Wrapper around `BookingDetailBody`, back link, StatusChip |
| `conflicts` | `screens/ConflictsScreen.tsx` | Hospital-closure conflicts by day | URL filter bar (3 selects + checkbox); grouped table; Reassign; Clear-conflict sheet; inline status |
| `draft-lists` | `screens/DraftListsScreen.tsx` | Lists with no anaesthetist | Hand-rolled tablist (Waiting / History); 2 tables; row actions; New Draft List sheet |
| `notifications` | `screens/NotificationsScreen.tsx` | Shared notification pool | Table; Show resolved; Newer/Older pager; TickButton resolve |
| `review` | `screens/ReviewQueue.tsx` | Submitted Lists to authorise | Clickable-row table; Recently billed; empty state |
| `review/:listId` | `screens/ReviewScreen.tsx` | Check and authorise a List | Breadcrumb; pills; 4 summary tiles; table with totals + flags; action bar; confirm + note Overlays; authorised banner; HistorySheet |
| `invoices`, `invoices/:invoiceId` | `screens/InvoicesScreen.tsx`, `InvoiceDocument.tsx` | Invoices from the billing run | 1380px table; recently billed; inline document view (print isolation); `window.print` |
| `billing` | `screens/BillingMonitorScreen.tsx` | Billing pipeline per List | Pipeline stepper cards; per-booking table; Resolve & retry → ChooseContractSheet; AA fee panel |
| `billing/aa-fees`, `/settings` | `screens/AaFeesScreen.tsx` | AA monthly fee invoices | Route tabs (`TabLink`); month stepper; 3 tables; inline-edit fixed items |
| `integrations` | `screens/IntegrationMonitorScreen.tsx` | HL7/FHIR, PDF inbox, data quality | 5 `TabButton` tabs; message log; feed mapping rows; PDF extraction review |
| `masters` (`?view=` × 15) | `screens/masters/MasterData.tsx` | Reference data hub | Vertical sub-nav (`aria-current`) + one view each |
| `masters/surgeons/:id` | `screens/SurgeonProfile.tsx` | Surgeon profile | ProfileChrome; PairingSection; SurgeonEditSheet; HistorySheet |
| `masters/anaesthetists/:id` | `screens/AnaesthetistRecord.tsx` | Anaesthetist record | Profile cards; segmented; EditAnaesthetistSheet |
| `audit` | `screens/AuditViewer.tsx` | Global audit feed | Filter bar (2 selects, 2 dates); table **capped at 500 rows** |

**Master views** (`screens/masters/`), each Header + Table + Edit/Add sheets: AnaesthetistsView,
ContractsView (search, status segmented, holder and funding-tag selects, grouped by holder, MasterPanel
editor), FundingTagsView, SpecialtiesView, PartiesView (PartyPanel), RecurringBookingsMaster, HospitalsView
(+ HospitalCalendar month grid, HolidaySheet), SurgeonsView, SurgeonRoomsView, SurgeonGroupsView,
RvgGroupsView (TimeRulePanel, grouped by anatomy, datalist combobox, retire), ModifierCodesView (read-only),
XeroArchivingView, ScheduleSettingsView (time inputs), AvailabilityStatusesView (Move up / Move down reorder,
SlotStatusSheet).

## 2. Admin-local components

### Shell and navigation
- **AdminApp** `AdminApp.tsx`: shell (`minWidth` 1320), drawer state, ResizeObserver for scrollbar width;
  drawers are fixed siblings, not portals.
- **SideNav** `components/SideNav.tsx`: buttons in `<nav>`, count badges, user footer. *Gaps:* no
  `aria-current`, no nav label, buttons not links.
- **MasterData sub-nav**: vertical nav with `aria-current="page"` (good).
- **RolesInfo** `RolesInfo.tsx`: info disclosure.
- **DayNav** `components/DayNav.tsx`: date stepper (−4w, −1w, ‹, Today, ›, +1w, +4w), native date with `max`,
  SortToggle, Find available. *Gaps:* ‹ › unlabelled, SortToggle no pressed/radio semantics, date unlabelled.
- **TabButton** (Integrations), **TabLink** (AaFees): no tab roles. DraftLists tablist has roles but no arrow
  roving.
- **ProfileChrome** `components/ProfileChrome.tsx`: header, back link, id chip, fact rows, actions.

### Day canvas and rail
- **DayGrid** `components/DayGrid.tsx` (496 lines): rows = anaesthetists; blocks absolutely positioned by
  `blockGeometry` on a 07:00 to 18:00 ruler (extends for out-of-hours); AM+PM merge into a full-day block when
  both closed; conflict tint, attention outline, note dot, warnings badge; footer legend where status chips
  toggle visibility, 4 `aria-pressed` focus-filter pills + Reset re-group rows; hover-reveal gutter opens an
  out-of-hours session. *Gaps:* plain divs, no grid roles or arrows (each block a Tab stop), `title`
  tooltips, no virtualisation (~85 rows).
- **DraftListBand** `components/DraftListBand.tsx`: Draft Lists on the same ruler.
- **RightRail** `components/RightRail.tsx`: **MiniCalendar** (best a11y in Admin: roving tabindex, arrows,
  Home/End, PageUp/Down, `aria-current="date"`), **InternalNotes** (textarea placeholder-only label),
  **AwaitingReview**.
- **WarningsToDo**, **NotificationsCard** (`useResolveWithTick` returns focus to heading), **DraftListsCard**
  + **DraftListParts**, **ConflictDot / ConflictCallout / ConflictPanel / ClearConflictSheet**,
  **ChangedSinceSubmittedPill**, **MasterPills**, **pairing/Pills**.

### Drawers, panels, sheets
- **SlotDrawer** `components/SlotDrawer.tsx` (466 lines): 440px right drawer; detail sections, actions, nested
  sheets, `role=alert` error. *Gaps:* no dialog role, Escape, focus move/trap/return; re-declares
  `Section/Row/DrawerLink/ActionBtn` duplicating `drawerParts.tsx`.
- **DraftListDrawer**: same anatomy and gaps; disabled reasons only via `title`.
- **drawerParts** `components/drawerParts.tsx`.
- **MasterPanel / PanelGrid / PanelSection** `components/MasterPanel.tsx`: 600px side sheet with dialog role,
  `aria-modal`, `aria-labelledby`, Escape, focus in and back. *Gap:* no trap, no portal.
- **Overlay sheets** (`flows/` unless noted): AddAnaesthetistFlow, EditAnaesthetistSheet, AddHospitalSheet,
  EditHospitalSheet, HolidaySheet, AssignListSheet + AssignListFields, AssignDraftListSheet, DraftListSheet,
  RedateDraftListSheet, RemoveDraftListSheet (reason chips), EditListSheet, EditSlotTimesSheet,
  OpenOutOfHoursSheet, SessionTimesFields, SessionStatusSheet, SlotStatusSheet (swatches, flags, preview),
  MoveBookingFlow, ReassignListFlow, PhoneAdviceBooking, RecurringBookingSheet (368 lines), SurgeonEditSheet,
  SurgeonGroupSheet, SurgeonRoomSheet, pairing/PairingAddSheet, pairing/PairingEndSheet,
  AvailabilityFinderSheet; screen-local RvgGroupSheet, RetireRvgGroup, FundingTagSheet, SpecialtySheet,
  HorizonSheet, SessionTimesSheet, RetireConfirm, ChooseContractSheet.
- **ContractEditSheet** `flows/ContractEditSheet.tsx` (526 lines): two-column form in MasterPanel; 8
  TextFields, 5 selects, 3 Segmented, ChipMultiSelect, SurgeonPicker, CodePickerSheet, ContractPriceRanges,
  fixed-after-save fields, live "where it will be offered" line.
- **ContractPriceRanges** `flows/ContractPriceRanges.tsx`: inline-edit table; Enter saves, Escape cancels
  (stops propagation so the panel stays open); focus restored via rAF; never delete the last row.
- **PartyPanel**, **fieldChrome** (`flows/fieldChrome.ts`: 48px native select style, GST options).

### Form controls
- **ChipMultiSelect** `components/ChipMultiSelect.tsx`: native "Add a…" select + removable chips. Not
  searchable.
- **SurgeonPicker** `components/pairing/SurgeonPicker.tsx`: native select with optgroups (Surgeons / Not
  preferred with Dr X). Not searchable.
- **AnaesthetistCandidates / DraftListCandidates** `components/pairing/`: NameSearchBox + Segmented filter +
  grouped CandidateRow buttons + non-selectable ClosedColleagueRow. No listbox semantics.
- **NotPreferredWarning**, **PairingSection**, `useOfficePairings`, `useSuggestionKey`.
- RvgGroupSheet anatomy: `<input list>` + `<datalist>`.
- IntegrationMonitor MappingRow and validator inputs: no labels.

### Tables
- `tableChrome.ts` (cell styles, `isInteractiveRowTarget`, `textActionStyle`), `masters/chrome.tsx` (Header,
  Table, TextAction, EditCell), `masters/tableStyles.ts`.
- All 17 tables are plain `<table>` with `overflowX:auto`; no sortable headers, resize, sticky header,
  selection or bulk actions; grouped rows via `colSpan`. Clickable `<tr onClick>` with no tabIndex.
  Pagination only on Notifications; audit capped at 500.

### Feedback
No toasts. Inline `role=status` banners (Conflicts, Draft Lists, Recurring apply, Holiday, AaFees),
SuccessOverlay (Assign Draft List, Reassign), authorised banner, `role=alert` / FormError. Tooltips are native
`title` everywhere.

## 3. Where a library helps

1. **Tables** (all of the above): TanStack Table + shadcn Table: sort with `aria-sort`, sticky header/first
   column, pagination or virtualisation instead of the 500 cap, grouped rows, column visibility, keyboard row
   links, selection.
2. **Type-ahead / combobox**: CodePickerSheet, SurgeonPicker, candidate pickers, anatomy datalist → Combobox
   with groups and adornments.
3. **Multi-select**: ChipMultiSelect → searchable multi-combobox.
4. **Dates and times**: 15 date + 6 time inputs; audit range; MiniCalendar, HospitalCalendar, AaFees month
   stepper onto one Calendar primitive (keep custom cells).
5. **Dialogs and drawers**: SlotDrawer / DraftListDrawer → Sheet; MasterPanel → Sheet; confirms →
   AlertDialog; nested sheets stack properly.
6. **Tabs**: Integrations, AaFees (route tabs), Draft Lists.
7. **Toggle groups**: SortToggle, Segmented, DayGrid focus filters, legend chips, swatches, reason chips.
8. **Toasts**: inline success banners and SuccessOverlay outcomes → Sonner with actions/undo.
9. **Tooltips**: grid blocks, disabled buttons, pills.
10. **Menus**: row actions and drawer action rows → DropdownMenu.
11. **Command / search**: none exists (a palette would be a new feature).
12. **Numbers**: summary tiles and badges (only if animation is wanted; see README principle 1).
13. **Forms**: ~30 sheets → React Hook Form + Field; fixes unlabelled inputs.
14. **Reorder**: Move up/down → dnd-kit sortable, keeping the buttons.

## 4. Admin needs no library covers

DayGrid scheduling canvas (keep custom; add grid a11y and Tooltip/HoverCard); interactive status legend as a
filter tied to the availability statuses master; billing review and authorise choreography; billing monitor
pipeline; invoice document (two layouts, serif voice, print isolation); candidate ranking pickers (tiered,
shuffled within tier, closed-colleague row); Contract editor rules; hospital closure calendar; demo hooks
(`data-shot`, `useDemoTriggerContext`, inline demo triggers) that capture and Playwright target.

**Cross-cutting a11y gaps:** drawers lack dialog semantics and Escape; MasterPanel no focus trap; SideNav no
`aria-current`; DayNav glyph buttons and SortToggle unlabelled; tabs lack roles in two places; clickable rows
mouse-only; tooltip-only information; placeholder-only labels.
