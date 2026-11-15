> Detail file for `docs/ui-unification/README.md` (audit of 12 November 2026): completeness check against all 170 catalogue rows, ten missed families (N1 to N10), token spot-check.
> Group numbers here (G1, N1 ...) are local to this file; the README's U-numbers point to them. Paths are relative to `aa-prototype/src/` unless they start with `docs/`.

# V · Completeness check of sweeps A to G, and spot-check of H (tokens)

Read-only. Paths are relative to `aa-prototype/src/` unless they say otherwise. "rows.json" is
`ui-library-preview/rows.json` (170 rows: admin 64, web 52, mobile 54).

## Summary

- **rows.json (170 rows):**
  - 4 rows are MISSED outright: StatusBlock, web "Add a booking (dashed)", web AvailabilityGrid `Cell`, and the
    mobile Balances "Hero figure card".
  - 22 more rows are covered for one part but have another part no sweep grouped (marked NEW Nn).
  - About 19 rows are checked and genuinely unique.
  - The rest (about 125) are covered.
- **Ten families fell between the sweeps.** They are N1 to N10 below, each checked in the code. The two biggest:
  - **N1, session status block:** built 7 times. The shared `blockFill` exists but 4 sites re-derive the fill
    by hand. B deferred it to a "grid audit" that never ran.
  - **N3, the frosted sticky dock container:** pasted 3 times byte for byte.
- **Name collisions:** 42 component names are defined in more than one file. Of these, 22 are the demo
  catalogue's recreations and examples, which are intended. The product-code collisions are all covered by a
  sweep except `DayHeading` (G6 covers the style only) and the unrelated `GroupRow` in HistoryTimeline.
- **H token sweep:** 17 counts re-run. None is materially wrong. Three corrections:
  - The 8th focus treatment was missed: `.aa-admin-calendar-day:focus-visible` paints a **crimson** ring
    (`global.css:148,368-373`). That breaks the crimson-is-identity-only rule.
  - G's "type.micro nobody reads" is wrong: `shared/booking/ProcedureStack.tsx:36` reads it.
  - Card container is 75/49 by the stated recipe, not 80/54. The strict form, 58/39, matches.
- **Design-source check of the proposed tokens:** most are in the design files. These are not, so adding them
  would invent a value:
  - `type.sheetTitle` 18/24/700: no 18px title in the Admin or Web mockups and none in Design Language.
  - `brand.onDark #C25B72`: in no design file; it rests only on the Decisions log.
  - `elevation.drawer`: in no design file.
  - The white-alpha steps 0.45, 0.22 and 0.14.
  - The z-index scale, which is engineering only.
  - The outline-based focus ring: Design Language defines a box-shadow ring instead.

---

## Task 1(a): every rows.json row

Legend: `rec` = `recreated: true`. "covered by" names the sweep file letter and group. "NEW Nn" points to a
missed family in Task 1(c). "unique" means checked and no duplicate found.

| app | row name | source | rec | covered by |
|---|---|---|---|---|
| admin | Button | `shared/ui/Button.tsx` |  | A G1 (compact copies bypass it), A G9 (footer pair) |
| admin | TickButton | `shared/ui/TickButton.tsx` |  | A G6 table (shared, single definition): unique |
| admin | Segmented | `shared/ui/Field.tsx` |  | E G1 |
| admin | SlidingSegmentedControl | `shared/ui/SlidingSegmentedControl.tsx` |  | E G1 |
| admin | StatusLegend (chips) | `shared/StatusLegend.tsx` |  | B G9 (toggle chips), B bypass note (calendar legends) |
| admin | SignalFilterButton (DayGrid focus filters) | `apps/admin/components/DayGrid.tsx` |  | B G9; E G2 (rejected: multi-select) |
| admin | Dialog (useSurface().Overlay) | `shared/surface/Dialog.tsx` |  | F G1, F G3 |
| admin | MasterPanel / PanelGrid / PanelSection | `apps/admin/components/MasterPanel.tsx` |  | F G1, F G2; G rejected (PanelSection) |
| admin | SlotDrawer | `apps/admin/components/SlotDrawer.tsx` |  | F G2 (two shells), A G1 (ActionBtn x2), G G7 (Row x2), F G11 (MovedHereLine) |
| admin | DraftListDrawer | `apps/admin/components/DraftListDrawer.tsx` |  | F G2 |
| admin | ClearConflictSheet | `apps/admin/components/conflicts/ClearConflictSheet.tsx` |  | F G4, F G6 |
| admin | HistorySheet | `shared/booking/HistorySheet.tsx` |  | F G3 (no visible close); otherwise unique |
| admin | SideNav (with RolesInfo) | `apps/admin/components/SideNav.tsx` |  | E G5; B G4 (nav badge) |
| admin | Master data sub-nav | `apps/admin/screens/masters/MasterData.tsx` | yes | E G5 |
| admin | TabButton (Integrations) | `apps/admin/screens/IntegrationMonitorScreen.tsx` |  | E G3 |
| admin | TabLink (AA fees) | `apps/admin/screens/AaFeesScreen.tsx` | yes | E G3 |
| admin | DayNav (with SortToggle) | `apps/admin/components/DayNav.tsx` |  | E G1 (SortToggle), A G4/G6, D G2/G4 |
| admin | StatusChip | `shared/StatusChip.tsx` |  | B G1, B G13 |
| admin | Pill | `shared/ui/Pill.tsx` |  | B G1 (canonical); name clash with ListRow private Pill (B G1) |
| admin | MasterPills | `apps/admin/components/MasterPills.tsx` |  | B G1 (re-export) |
| admin | TierPill / PreferredPill / NotPreferredPill | `apps/admin/components/pairing/Pills.tsx` |  | B G1, G2, G3 |
| admin | ChangedSinceSubmittedPill | `apps/admin/components/ChangedSinceSubmitted.tsx` |  | B G2 |
| admin | DraftListParts | `apps/admin/components/draftLists/DraftListParts.tsx` |  | B G1 (PILL const), B rejected (BookingCount) |
| admin | ConflictDot | `apps/admin/components/conflicts/ConflictDot.tsx` |  | B G7 |
| admin | WarningTriangle | `shared/warnings/WarningTriangle.tsx` |  | B G7 |
| admin | NameSearchBox | `shared/ui/NameSearchBox.tsx` |  | C G1 |
| admin | ContractSelect (fieldChrome select) | `shared/contracts/ContractSelect.tsx` |  | C G3 |
| admin | SurgeonPicker | `apps/admin/components/pairing/SurgeonPicker.tsx` |  | C G3 (consumer); same-name private copy in ContractEditSheet = C G6 / B G10 |
| admin | NotPreferredWarning | `apps/admin/components/pairing/NotPreferredWarning.tsx` |  | F G8 |
| admin | ChipMultiSelect | `apps/admin/components/ChipMultiSelect.tsx` |  | C G6, B G10 |
| admin | CodePickerSheet | `shared/capture/CodePickerSheet.tsx` |  | C G9 |
| admin | ConflictCallout | `apps/admin/components/conflicts/ConflictCallout.tsx` |  | F G8 |
| admin | WarningsToDo | `apps/admin/components/WarningsToDo.tsx` |  | G G4 (rail card), B G4 (count); "Show all" toggle -> NEW N9 disclosure |
| admin | NotificationsCard | `apps/admin/components/NotificationsCard.tsx` |  | G G4, B G4; NotificationText -> NEW N4 notice row (partial) |
| admin | VacatedSessionChoice / StatusRadioGroup | `shared/flows/VacatedSessionChoice.tsx` |  | C G8 |
| admin | ProfileChrome | `apps/admin/components/ProfileChrome.tsx` |  | G G4 (ProfileCard), G G7 (Fact), G G8, A G3 (BackLink); IdChip unique (B rejected) |
| admin | drawerParts (Section, Row, DrawerLink, ActionBtn) | `apps/admin/components/drawerParts.tsx` |  | F G2, A G1, A G6, G G5, G G7 |
| admin | Inline success banner (role=status) | `apps/admin/screens/ConflictsScreen.tsx` | yes | F G9 |
| admin | Table / Header / TextAction / EditCell | `apps/admin/screens/masters/chrome.tsx` |  | G G1, G2, G8; A G2 (TextAction name clash) |
| admin | ReviewQueue (clickable rows) | `apps/admin/screens/ReviewQueue.tsx` |  | G G3 |
| admin | RvgGroupsView (grouped rows) | `apps/admin/screens/masters/RvgGroupsView.tsx` |  | G G1, G G10 |
| admin | AuditViewer | `apps/admin/screens/AuditViewer.tsx` |  | G G1/G2, C G3, D G3; table view of the audit, not a HistoryTimeline copy (shares domain formatters): unique |
| admin | TextField | `shared/ui/Field.tsx` |  | C G4 |
| admin | TextArea | `shared/ui/Field.tsx` |  | C G12 |
| admin | FieldLabel / FormError | `shared/ui/Field.tsx` |  | C G2, G G6 |
| admin | ContractPanel (ContractEditSheet) | `apps/admin/flows/ContractEditSheet.tsx` |  | C G6 (private SurgeonPicker), F G1; ReadOnlyField/Helper unique |
| admin | SlotStatusSheet | `apps/admin/flows/SlotStatusSheet.tsx` |  | F G4; preview at :129 re-types StatusBlock -> NEW N1 |
| admin | ContractPriceRanges | `apps/admin/flows/ContractPriceRanges.tsx` |  | C G4 (intended compact), A G1 |
| admin | MiniCalendar (RightRail) | `apps/admin/components/RightRail.tsx` |  | D G1, D G4, A G4 |
| admin | HospitalCalendar | `apps/admin/screens/masters/HospitalsView.tsx` |  | D G1 |
| admin | Native date input (TextField type=date) | `shared/ui/Field.tsx` |  | D G3 |
| admin | SessionTimesFields | `apps/admin/flows/SessionTimesFields.tsx` |  | D G5 |
| admin | RVG anatomy datalist | `apps/admin/screens/masters/RvgGroupsView.tsx` | yes | C G4 |
| admin | SuccessOverlay | `shared/ui/SuccessOverlay.tsx` |  | F G10 |
| admin | TickBadge | `shared/ui/TickBadge.tsx` |  | B G11, F G10; its tick SVG is pasted in 2 more files -> NEW N8 |
| admin | ProcedureStack | `shared/booking/ProcedureStack.tsx` |  | unique (one shared component, two densities) |
| admin | DayGrid | `apps/admin/components/DayGrid.tsx` |  | B G7/G9, E G2; GridBlock -> NEW N1 |
| admin | DraftListBand | `apps/admin/components/DraftListBand.tsx` |  | B rejected (count holder); band unique |
| admin | StatusBlock | `shared/StatusBlock.tsx` |  | MISSED? -> NEW N1 (B deferred it to a "grid audit" that no sweep ran) |
| admin | Review summary tiles (ReviewScreen) | `apps/admin/screens/ReviewScreen.tsx` |  | G G9 |
| admin | Billing pipeline stepper (PipelineCard) | `apps/admin/screens/BillingMonitorScreen.tsx` | yes | E G9 (single), B G1 (StageChip) |
| admin | InvoiceDocument | `apps/admin/screens/InvoiceDocument.tsx` |  | G rejected (print); TotalRow -> NEW N2 |
| admin | AnaesthetistCandidates | `apps/admin/components/pairing/AnaesthetistCandidates.tsx` |  | C G9; ClosedColleagueRow -> NEW N5b |
| admin | DraftListCandidates | `apps/admin/components/pairing/DraftListCandidates.tsx` |  | C G9; occupied row -> NEW N5b |
| web | WebNav | `apps/web/components/WebNav.tsx` |  | E G5 |
| web | AvailabilityPageSwitch | `apps/web/components/AvailabilityPageSwitch.tsx` |  | E G4 |
| web | SubTabButton | `apps/web/screens/AccountsScreen.tsx` | yes | E G3 |
| web | Back link | `apps/web/screens/ListDetailView.tsx` | yes | A G3 |
| web | Panel | `apps/web/components/Panel.tsx` |  | G G4 |
| web | StatTile | `apps/web/screens/DashboardScreen.tsx` | yes | G G9, B G1 (pill) |
| web | SlidingSegmentedControl | `shared/ui/SlidingSegmentedControl.tsx` |  | E G1 |
| web | Segmented | `shared/ui/Field.tsx` |  | E G1 |
| web | FilterChip | `apps/web/screens/AvailabilityGrid.tsx` | yes | E G2, B G9 |
| web | StatusLegend (toggle mode) | `shared/StatusLegend.tsx` |  | B G9 |
| web | StatusChip | `shared/StatusChip.tsx` |  | B G1, B G13 |
| web | ProgressPill | `shared/schedule/ProgressPill.tsx` |  | B G1, B G11 |
| web | WebDayChip | `apps/web/screens/ListsLookback.tsx` |  | B G8 |
| web | WarningTriangle | `shared/warnings/WarningTriangle.tsx` |  | B G7 |
| web | Who's free chip | `apps/web/screens/DashboardScreen.tsx` | yes | B G13 |
| web | IconBtn · NavButton · WeekNavButton | `apps/web/screens/AvailabilityGrid.tsx` | yes | A G4, D G4 |
| web | Day stepper | `apps/web/screens/AvailabilityGrid.tsx` | yes | D G4 |
| web | LinkButton | `apps/web/screens/DashboardScreen.tsx` | yes | A G2 |
| web | SubmitAction | `apps/web/screens/ListDetailView.tsx` | yes | A G1, A G7 |
| web | Add a booking (dashed) | `apps/web/screens/ListDetailView.tsx` | yes | MISSED -> NEW N6 (web + mobile copies) |
| web | Progress bar | `apps/web/screens/ListDetailView.tsx` | yes | E G6 |
| web | Dialog (web Overlay) | `shared/surface/Dialog.tsx` | yes | F G1 |
| web | SubmitListSheet | `shared/flows/SubmitListSheet.tsx` |  | F G4, F G6 |
| web | WebSearchField | `apps/web/screens/ListsLookback.tsx` |  | C G1 |
| web | NameSearchBox | `shared/ui/NameSearchBox.tsx` |  | C G1 |
| web | MovedToYouPanel | `shared/flows/MovedToYouPanel.tsx` |  | D G7/G8 (dates only); NoticeRow -> NEW N4 |
| web | SeriesList | `shared/availability/SeriesList.tsx` |  | A G2, F G6, F G9 |
| web | CodePickerSheet | `shared/capture/CodePickerSheet.tsx` |  | C G9 |
| web | ProcedureCodeCard | `shared/capture/ProcedureCodeCard.tsx` |  | C G5 |
| web | TimesCard | `shared/capture/TimesCard.tsx` |  | C G5, D G5 |
| web | UnitsCard | `shared/capture/UnitsCard.tsx` |  | C G5 |
| web | ResultLine | `shared/availability/AvailabilityForm.tsx` |  | F G9 |
| web | Lists table (Th · Td · GroupRow) | `apps/web/screens/ListsScreen.tsx` |  | G G1 |
| web | WebResultsTable | `apps/web/screens/ListsLookback.tsx` |  | G G1, G G3 |
| web | WebDayTable | `apps/web/screens/ListsLookback.tsx` |  | G G1, G G3 |
| web | Accounts tables (tfoot totals) | `apps/web/screens/AccountsScreen.tsx` |  | G G1, G G2 |
| web | List detail Bookings table | `apps/web/screens/ListDetailView.tsx` |  | G G1, G G3 |
| web | ListInvoices | `shared/schedule/ListInvoices.tsx` |  | G rejected: unique |
| web | AvailabilityEditor | `shared/availability/AvailabilityEditor.tsx` |  | A G3 (round back); otherwise unique |
| web | AlertOfficeEntry | `shared/flows/AlertOfficeSheet.tsx` |  | F G11 (AlertOfficeSheet:58 box); OfficeAlertLine -> NEW N4 |
| web | OverrideCard | `shared/capture/OverrideCard.tsx` |  | C G4 (inputs) only; whole form duplicated by PriceOverrideSheet -> NEW N7 |
| web | WeekStrip | `apps/web/components/WeekStrip.tsx` |  | D G4, D G6, A G4; Block -> NEW N1 |
| web | My availability month grid (DayCell) | `apps/web/screens/MyAvailabilityCalendar.tsx` |  | D G1 |
| web | WebGoToDate | `apps/web/screens/ListsLookback.tsx` |  | D G2 |
| web | Receivables aging bars | `apps/web/screens/DashboardScreen.tsx` | yes | E rejected (chart): unique |
| web | BookingTotalPanel · useTickingValue | `shared/capture/BookingTotalPanel.tsx` |  | D G9 (toFixed), D G12: unique |
| web | TickBadge | `shared/ui/TickBadge.tsx` |  | B G11, F G10; its tick SVG is pasted in 2 more files -> NEW N8 |
| web | CompleteBar | `shared/capture/CompleteBar.tsx` |  | A G7; dock container -> NEW N3 |
| web | ProcedureStack | `shared/booking/ProcedureStack.tsx` |  | unique (one shared component, two densities) |
| web | Cell (AvailabilityGrid) | `apps/web/screens/AvailabilityGrid.tsx` | yes | MISSED -> NEW N1 (re-derives the block fill) |
| web | AvailabilityGrid | `apps/web/screens/AvailabilityGrid.tsx` |  | A G4, B G9, C G1, E G2; Cell -> NEW N1 |
| web | HistoryTimeline | `shared/booking/HistoryTimeline.tsx` |  | B G3 ("n changes" pill), G G6 (DayHeading eyebrow); expand toggle -> NEW N9; otherwise unique |
| mobile | BottomSheet | `shared/surface/BottomSheet.tsx` |  | F G1 |
| mobile | ListOptionsSheet | `apps/mobile/components/ListOptionsSheet.tsx` |  | F G3 |
| mobile | AlertOfficeSheet | `shared/flows/AlertOfficeSheet.tsx` |  | F G9, G10, G11 |
| mobile | SubmitListSheet | `shared/flows/SubmitListSheet.tsx` |  | F G4, F G6 |
| mobile | AvailabilityEditor | `shared/availability/AvailabilityEditor.tsx` |  | A G3 (round back); otherwise unique |
| mobile | Button (MobileButton) | `shared/ui/Button.tsx` |  | A G1 |
| mobile | Mobile press feedback (:active) | `theme/global.css` |  | A cross-cutting |
| mobile | SlidingSegmentedControl | `shared/ui/SlidingSegmentedControl.tsx` |  | E G1 |
| mobile | Segmented | `shared/ui/Field.tsx` |  | E G1 |
| mobile | Filter chips (Week / Month / To-Do / Done) | `apps/mobile/screens/ForwardListsScreen.tsx` | yes | E G2, B G9 |
| mobile | StepperButton | `shared/capture/ui.tsx` |  | C G5, A G4 |
| mobile | NudgeButton | `shared/capture/ui.tsx` |  | C G5, D G5 |
| mobile | CaptureSection | `shared/capture/ui.tsx` |  | G G5 |
| mobile | StatusChip | `shared/StatusChip.tsx` |  | B G1, B G13 |
| mobile | ProgressPill | `shared/schedule/ProgressPill.tsx` |  | B G1, B G11 |
| mobile | OutOfHoursPill | `shared/schedule/OutOfHoursMark.tsx` |  | B G1 (dead code) |
| mobile | AgeChip | `apps/mobile/screens/BalancesScreen.tsx` | yes | B G1 |
| mobile | DayChip | `apps/mobile/screens/ListsLookback.tsx` |  | B G8 |
| mobile | Avatar | `shared/Avatar.tsx` |  | B G5 |
| mobile | Hero figure card | `apps/mobile/screens/BalancesScreen.tsx` | yes | MISSED? same job as G G9 stat tile (label + mono 24/700 + sub), not listed there |
| mobile | EmptyCard | `apps/mobile/screens/BalancesScreen.tsx` | yes | G G10, F G12 |
| mobile | MovedToYouPanel | `shared/flows/MovedToYouPanel.tsx` |  | D G7/G8 (dates only); NoticeRow -> NEW N4 |
| mobile | Booking card (Capture pill) | `apps/mobile/screens/ListDetailScreen.tsx` | yes | G rejected (design-backed), B G12 |
| mobile | Progress bar | `apps/mobile/screens/ListDetailScreen.tsx` | yes | E G6 |
| mobile | LookbackSearchRow | `apps/mobile/screens/ListsLookback.tsx` |  | C G1 |
| mobile | LookbackResults (ResultRow) | `apps/mobile/screens/ListsLookback.tsx` |  | G rejected / question |
| mobile | SeriesList | `shared/availability/SeriesList.tsx` |  | A G2, F G6, F G9 |
| mobile | ToggleRow (switch) | `pwa/PwaDemoPanel.tsx` | yes | E G7 |
| mobile | InstallCoach | `pwa/InstallCoach.tsx` | yes | F (one instance): unique |
| mobile | UpdatePrompt | `pwa/UpdatePrompt.tsx` | yes | F (one instance): unique |
| mobile | BookingDetailBody | `shared/booking/BookingDetailBody.tsx` |  | G G5, G G7, C G5, F G11; Stepper = C G5 |
| mobile | TextField | `shared/ui/Field.tsx` |  | C G4 |
| mobile | TextArea | `shared/ui/Field.tsx` |  | C G12 |
| mobile | FormError | `shared/ui/Field.tsx` |  | C G2, F G7 |
| mobile | MonthGrid (LookbackDateSheet) | `shared/calendar/MonthGrid.tsx` |  | D G1 |
| mobile | My calendar month grid | `apps/mobile/screens/MyAvailabilityCalendarScreen.tsx` | yes | D G1 |
| mobile | 6-day date strip | `apps/mobile/screens/AvailabilityScreen.tsx` | yes | D G6 |
| mobile | useTickingValue | `shared/capture/useTickingValue.ts` |  | D G12: unique |
| mobile | SlideStack | `apps/mobile/components/SlideStack.tsx` |  | F rejected: unique |
| mobile | SuccessOverlay | `shared/ui/SuccessOverlay.tsx` |  | F G10 |
| mobile | TickBadge | `shared/ui/TickBadge.tsx` |  | B G11, F G10; its tick SVG is pasted in 2 more files -> NEW N8 |
| mobile | Collapsing masthead | `shared/surface/SurfaceProvider.tsx` | yes | unique (only MobileBookingLayout folds) |
| mobile | TimesCard | `shared/capture/TimesCard.tsx` |  | C G5, D G5 |
| mobile | CompleteBar | `shared/capture/CompleteBar.tsx` |  | A G7; dock container -> NEW N3 |
| mobile | ProcedureStack | `shared/booking/ProcedureStack.tsx` |  | unique (one shared component, two densities) |
| mobile | BottomTabBar | `apps/mobile/MobileApp.tsx` | yes | E G5; frosted bar -> NEW N3 note |
| mobile | MobileHeader | `apps/mobile/components/MobileHeader.tsx` |  | G G8 (intended) |
| mobile | ListRow | `shared/schedule/ListRow.tsx` |  | B G1 (private Pill), G rejected |
| mobile | Sticky submit dock | `apps/mobile/screens/ListDetailScreen.tsx` | yes | A G7 (button only); container -> NEW N3 |
| mobile | DockSpacer | `shared/ui/DockSpacer.tsx` |  | unique (8 uses, heights are magic 74/82/86: see N3) |
| mobile | Colleague AM / PM cells | `apps/mobile/screens/AvailabilityScreen.tsx` | yes | B G6 (avatar only); cell fill -> NEW N1 |
| mobile | HalfBlock | `apps/mobile/screens/MyAvailabilityCalendarScreen.tsx` | yes | D G1; uses shared blockFill (good), member of N1 |
| mobile | WarningTriangle | `shared/warnings/WarningTriangle.tsx` |  | B G7 |
| mobile | OutOfHoursMoon | `shared/schedule/OutOfHoursMark.tsx` |  | unique |

---

## Task 1(b): folder walk and name collisions

How it was found: `rg -e '^(export )?(default )?function [A-Z]\w*' -e '^(export )?const [A-Z]\w* *(:[^=]*)?= *(\(|memo|forwardRef)'`
over `src`, excluding `domain/`, `store/` and tests. That gives 755 definitions. A second pass,
`^(export )?function [a-z]` plus arrow consts, finds the helpers.

### Components per folder (product code; the catalogue is left out)

| folder | components defined (private ones in *italics*) |
|---|---|
| `shared/` root | Avatar, DemoBadge, Logo, StatusBlock, StatusChip/*StatusChipView*, StatusLegend, Wordmark |
| `shared/ui` | Button, DockSpacer, FieldLabel/TextField/FormError/TextArea/Segmented, NameSearchBox, Pill, SlidingSegmentedControl, SuccessOverlay, TextAction, TickBadge, TickButton |
| `shared/surface` | BottomSheet, Dialog, SurfaceProvider (*MobileBookingLayout, WebBookingLayout, MobilePair, WebPair*) |
| `shared/booking` | BillingCard (*InlineBillingCard, StepFrame, StartAgain, RailSlot, ChoiceTiles, ContractCombo, Outcome, ReadOnlySummary, MobileBillingCard, MobileRow*), BookingDetailBody (*Section, EditLink, Row, Stepper*), HistorySheet, HistoryTimeline (*DayHeading, GroupRow, Ledger, Steps, StepLedger*), OfficeBillingSetup (*Row, Missing*), ProcedureContractRow, ProcedureStack (*FullStack, CompactStack*) |
| `shared/capture` | AddBillingLineSheet (*BasisOption*), BillingLinesCard, BookingTotalPanel, BtmCaptureBlock, CodePickerSheet, CompleteBar, CompletionOverlay, ModifierPickerSheet (*ClaimForm*), ModifiersSection (*LedgerRow*), NotesCard, OverrideCard, ProcedureCodeCard (*RangeUnitsRow*), TimesCard (*TimeCapture, RecordedTime, MissingTime, StampButton*), UnitsCard (*StepperRow*), ui (CaptureSection, StepperButton, NudgeButton, FailureNotes, Caption) |
| `shared/flows` | AddBookingFlow, AlertOfficeSheet (AlertOfficeEntry, OfficeAlertLine), CancelBookingSheet, ContractRail (*RailStepButton, OptionList, ContractRow, OtherPriceToggle*), Edit*Sheet x5, FunderAllocationSheet, ManualBookingForm, MoveBookingToColleagueSheet (*ReceiverRow, LandingPath*), MoveListPrompt, MoveListSheet (*ListHeader*), MovedToYouPanel (*NoticeRow*), PhotoCaptureFlow, PriceOverrideSheet, RemoveProcedureSheet, SubmitListSheet, VacatedSessionChoice/StatusRadioGroup, moveSheetParts (BackLink, Initials, ChoiceRow) |
| `shared/availability` | AvailabilityEditor, AvailabilityForm (*ResultLine, Chip, DateField*), AvailabilitySlotPanel (*Actions, PanelAction*), SeriesList |
| `shared/calendar` | MonthGrid (*RoundButton*) |
| `shared/schedule` | ListInvoices, ListRow (*Chevron, Pill, RightCluster, CountPill, ChipPill*), OutOfHoursMoon/OutOfHoursPill, ProgressPill |
| `shared/warnings` | WarningTriangle, WarningsPanel (*ClearWarningButton, StrengthPill*) |
| `shared/contracts`, `demoTriggers`, `legacy`, `audit`, `status` | ContractSelect; DemoTriggerBadge, InlineDemoTrigger(+Routed, At); LegacyBookingRedirect; (no components in audit/status) |
| `shell` | AppShell, AppSwitcher, DemoActionsMenu, DemoClockMenu, DemoResetButton, PhoneFrame (*StatusBar, ZoomControl*), RequireEntity, gradientLab (AtmosphereLayer, *RangeControl, ColorControl, SwitchRow, FieldSection*, GradientLab) |
| `apps/admin/components` | ChangedSinceSubmittedPill, ChipMultiSelect, DayGrid (*SignalFilterButton, GridBlock*), DayNav (*SortToggle, SquareBtn, TextBtn*), DraftListBand, DraftListDrawer (*DraftBody*), MasterPanel/PanelGrid/PanelSection, NeedsInvoiceDestinationCard, NotificationsCard (NotificationText, *ActiveCount*), ProfileChrome (ProfilePage, BackLink, ProfileHeader, IdChip, ProfileCard, Fact, HeaderActions), RightRail (*Card, MiniCalendar, NavArrow, InternalNotes, AwaitingReview*), SideNav, SlotDrawer (*ListBody, EmptySessionDrawer, Section, Row, DrawerLink, ActionBtn, MovedHereLine, BookingMovedHereLine*), WarningsToDo, drawerParts, conflicts/ (ClearConflictSheet, ConflictCallout, ConflictDot, ConflictPanel), draftLists/ (UnassignedPill, DraftStateChip, WaitingTime, BookingCount, DraftListsCard), pairing/ (AnaesthetistCandidates + *Group*, CandidateRow, ClosedColleagueRow, NotAvailableColleagues; DraftListCandidates; NotPreferredWarning; PairingAddSheet + *RadioGroup*; PairingEndSheet; PairingSection + *KindGroup, ActiveRow*; Tier/Preferred/NotPreferredPill; SurgeonPicker) |
| `apps/admin/flows` | 27 sheets/flows; private: ContractEditSheet (*Helper, ReadOnlyField, SurgeonPicker*), AssignDraftListSheet (*ConfirmRow, SoftWarning*), RecurringBookingSheet (*AppliedView, DetailList*), SlotStatusSheet (*Swatch, Check*), PartyPanel (*ReadOnlyAa*) |
| `apps/admin/screens` (+masters) | AaFees (*TabLink, FeeInvoicesTab, StepButton, FeeInvoiceList, FeeStatusPill, FeeInvoiceDetail, DetailLabel, FeeSettingsTab*), AuditViewer (*Filter*), BillingMonitor (*ChooseContractSheet, PipelineCard, StageChip, MoneyDetail, BookingStatusPill, AaFeePanel*), IntegrationMonitor (*MessagesTab, MessageLogRow, FeedConfigTab, MappingRow, SurgeonPdfsTab, PdfReview, RowField, DataQualityTab, DataQualityCard, ValidatorsTab, VerdictLine, TabButton, FutureScopeNote, StatusChip, EmptyNote*), InvoiceDocument (*InvoiceInfoRail, RailCard, RailStatus, XeroReference, StateChip, TotalRow, PatientInvoiceNote*), InvoicesScreen (*StatusPill*), NotificationsScreen (*PagerButton*), ReviewScreen (*Tile, FlagPill*); masters: chrome (Header, Table, TextAction, EditCell), HospitalsView (*HospitalCalendar*), AvailabilityStatusesView (*RetireConfirm*), RvgGroupsView (*RvgGroupSheet, RetireRvgGroup, TimeRulePanel*), ContractsView (*PricingText*), FundingTags/Specialties/Modifiers/ScheduleSettings sheets, SurgeonsView (*SurgeonLink*, Rooms/Groups views) |
| `apps/web` | components: AvailabilityPageSwitch, Panel, WebNav, WeekStrip (*WeekNavButton, Block*); screens: AccountsScreen (*OverdueTable, PaymentsTable, AaFeesTable, GstReport, SubTabButton, Th, Td*), AvailabilityGrid (*Cell, HeaderCell, IconBtn, FilterChip, StatusChipsLegend*), DashboardScreen (*StatTile, LinkButton, EmptyNote*), ListDetailView (*SubmitAction, Th, Td*), ListsLookback (WebSearchField, WebGoToDate, WebDayChip, *GroupRow*, WebResultsTable, *ResultRow*, WebDayTable), ListsScreen (*GroupRow, Th, Td*), MyAvailabilityCalendar (*DayCell, NavButton*), BookingDetailView |
| `apps/mobile` | MobileApp (*BottomTabBar*), components: ListOptionsSheet, MobileHeader, SlideStack; screens: BalancesScreen (*AgeChip, EmptyCard*), ForwardListsScreen (*DayHeading*), ListsLookback (LookbackSearchRow, LookbackDateSheet, *DateSheetBody, DayChip, LookbackDayView, LookbackResults, GroupHeading, ResultRow*), MyAvailabilityCalendarScreen (*HalfBlock, MonthButton*), Availability, BookingDetail, ListDetail, More |
| `apps/demo` | DemoControlPanel (*ControlCard, SectionHeading, ScenarioJumps, DemoActionsIndex*), DemoData (*Panel*), DemoIntegrations (*SectionLabel, MessageRow, Pane, Hl7View, EffectView, StatusPill, Callout*), DemoSurface, DemoXero (*ContactsTable, InvoicesTable, PairDetail, FeePairDetail, AaFeeChip, AccRecCard, AccPayCard, MoneyFlowCard, RecordCard, MetaGrid, MetaItem, IdentifierPair, InlineId, MoneyGrid, MoneyStat, TotalLine, SectionLabel, RecordStatus, Callout, TabLink, ContactTypeChip, StatusChip, TruncatedText, StackedAmount, TableShell, Th, Td, EmptyNote*) |
| `pwa` | BootMark, InstallCoach, MobileViewport, PwaDemoActions, PwaDemoPanel (*Card, Row, DemoClockCard, ToggleRow, OfficeSimulationCard, ResetCard, ViewportCard, BuildCard*), UpdatePrompt |

### Same name, different files (product code)

| name | files | covered? |
|---|---|---|
| `Th` / `Td` | `apps/web/screens/ListsScreen.tsx:299,307`, `ListDetailView.tsx:405,413`, `AccountsScreen.tsx:494,502`, `apps/demo/DemoXero.tsx:882,890` | G G1 |
| `Row` | `pwa/PwaDemoPanel.tsx:73`, `shared/booking/BookingDetailBody.tsx:846`, `shared/booking/OfficeBillingSetup.tsx:86`, `apps/admin/components/SlotDrawer.tsx:399`, `drawerParts.tsx:19` | G G7 |
| `Section` | `shared/booking/BookingDetailBody.tsx:81`, `SlotDrawer.tsx:390`, `drawerParts.tsx:10` | G G5, F G2 |
| `ActionBtn`, `DrawerLink` | `SlotDrawer.tsx:416,408`, `drawerParts.tsx:36,28` | A G1, A G6, F G2 |
| `StatusChip` | `shared/StatusChip.tsx:22`, `apps/admin/screens/IntegrationMonitorScreen.tsx:540`, `apps/demo/DemoXero.tsx:845` | B G1 |
| `StatusPill` | `apps/admin/screens/InvoicesScreen.tsx:238`, `apps/demo/DemoIntegrations.tsx:508` | B G1 |
| `Pill` | `shared/ui/Pill.tsx:30`, `shared/schedule/ListRow.tsx:65` | B G1 |
| `TextAction` | `shared/ui/TextAction.tsx:7`, `apps/admin/screens/masters/chrome.tsx:35` | A G2 |
| `BackLink` | `shared/flows/moveSheetParts.tsx:13`, `apps/admin/components/ProfileChrome.tsx:18` | A G3 |
| `TabLink` | `apps/admin/screens/AaFeesScreen.tsx:67`, `apps/demo/DemoXero.tsx:824` | E G3 |
| `Callout` | `apps/demo/DemoXero.tsx:808`, `apps/demo/DemoIntegrations.tsx:524` | F G8 |
| `SectionLabel` | `apps/demo/DemoXero.tsx:789`, `apps/demo/DemoIntegrations.tsx:367` | G G6 and H 2.3 (both named in H) |
| `EmptyNote` | `DemoXero.tsx:898`, `web/screens/DashboardScreen.tsx:380`, `IntegrationMonitorScreen.tsx:545` | G G10, F G12 |
| `Panel` | `apps/web/components/Panel.tsx:20`, `apps/demo/DemoData.tsx:38` | G G4 |
| `Card` | `pwa/PwaDemoPanel.tsx:48`, `apps/admin/components/RightRail.tsx:66` | G G4 |
| `SurgeonPicker` | `apps/admin/components/pairing/SurgeonPicker.tsx:34`, `apps/admin/flows/ContractEditSheet.tsx:480` | C G6, B G10 (different jobs: select vs chip multi-select) |
| `ResultRow` | `apps/mobile/screens/ListsLookback.tsx:254`, `apps/web/screens/ListsLookback.tsx:133` | G (rejected / question; web one is G G3) |
| `GroupRow` | `apps/web/screens/ListsScreen.tsx:289`, `ListsLookback.tsx:98` (same job: G G1); `shared/booking/HistoryTimeline.tsx:146` (an audit group, unrelated job, only a name clash) | partial |
| `DayHeading` | `apps/mobile/screens/ForwardListsScreen.tsx:413` (11/600/0.06em, **no uppercase**), `shared/booking/HistoryTimeline.tsx:122` (10.5/700/0.06em uppercase) | **style only** in G G6/H 2.3; not flagged as a collision. Same job (day group heading in a list), so it belongs in the G6 `Eyebrow` migration |
| `Missing` | `shared/booking/OfficeBillingSetup.tsx:95` + 3 catalogue files | not a duplicate (catalogue `Missing` are demo stand-ins) |

Catalogue-only collisions are intended: `FilterChip`, `IconBtn`, `NavButton`, `WeekNavButton`, `LinkButton`,
`StatTile`, `SubTabButton`, `SubmitAction` and `BackLink` in `apps/demo/catalogue/web/recreations.tsx`. They are
recreations of private components and must be kept in step.

### Helper functions defined in several files (UI layer)

| helper | files | same job? | covered? |
|---|---|---|---|
| `parseAmount` | `shared/booking/BillingCard.tsx:319` (rejects >2dp), `shared/flows/ContractRail.tsx:77`, `apps/admin/screens/AaFeesScreen.tsx:441` (returns NaN) | yes, 3 different rules for "$1,234.50" | **missed** (C G7 covers the BillingCard/ContractRail pair but not the helper; AaFees not at all) |
| `modeOf` | `shared/capture/OverrideCard.tsx:20`, `shared/flows/PriceOverrideSheet.tsx:24` | yes, different mode vocabularies | **missed**, see N7 |
| `plural` | `shared/demoTriggers/registry.ts:341`, `shared/availability/describeAvailabilityOutcome.ts:14`, `apps/admin/flows/HolidaySheet.tsx:20` | yes | D G10 |
| `cellStyle` | `apps/admin/tableChrome.ts:10` (table cell), `apps/mobile/screens/AvailabilityScreen.tsx:27` (status fill) | no, name clash only; the mobile one is part of N1 | partial |
| `KIND_OPTIONS` const | `apps/admin/flows/AssignListFields.tsx:53`, `DraftListSheet.tsx:20` | identical | **missed** (small) |
| `SESSION_OPTIONS` const | `apps/admin/flows/DraftListSheet.tsx:25`, `RedateDraftListSheet.tsx:17` | identical AM/PM (+evening) | **missed** (small) |
| `iso`, `mondayOf`, `field`, `fromDraft` | domain/store vs UI | different jobs or already in D | n/a |
| `whenLabel` (`shared/flows/AlertOfficeSheet.tsx:13`) | same shape as D G8 stamp formats | yes | D G8 |

### Families the brief listed, checked

| family | result |
|---|---|
| timelines / history / audit | `HistoryTimeline` is the one timeline. `AuditViewer` is a table over the same domain helpers (`auditFieldChanges`), not a copy. Unique. Its expand toggle is in N9. |
| notification lists | Admin shares `NotificationText` between card and page. The anaesthetist side (`MovedToYouPanel` NoticeRow), `OfficeAlertLine` and SlotDrawer's two "moved here" lines repeat the anatomy: **N4**. |
| legends | `StatusLegend`, plus DayGrid legend discs (B G7) and the calendar legends (B bypass note). Covered. |
| warning lists / sheets | `WarningsPanel` (1 site) and `WarningsToDo` (admin rail) do different jobs (F rejected). Covered. |
| invoice / print documents | `InvoiceDocument` (G rejected as print). Its totals block is repeated: **N2**. |
| summary / total panels | `BookingTotalPanel` is unique (dark hero). Totals rows: **N2**. |
| key figures | G G9 has 3 members. The mobile Balances hero (`BalancesScreen.tsx:61-69`, label 12 + mono 24/700 + sub) is the same anatomy and is **missed**. |
| photo / attachment | `PhotoCaptureFlow` only. Unique. |
| map / route displays | `LandingPath` (`MoveBookingToColleagueSheet.tsx:338`) only. Unique. |
| week strips | D G6 (WeekStrip vs 6-day strip judged different jobs). Covered. |
| phone-frame chrome | `shell/PhoneFrame.tsx` (StatusBar, ZoomControl) only. Unique. Its zoom group is A G4 / E rejected. |
| copy to clipboard / code blocks | **N10** (demo only): 2 clipboard handlers, 2 `<pre>` blocks. |
| kbd hints | none in the app. |
| dividers | G rejected (4 `height:1` divs). |
| scroll containers | 8 `overflowY:auto` sites, one each, all inside their own panels. Nothing to merge. |
| sticky footers | **N3** (dock container x3). The buttons inside it are A G7. |
| skeleton / placeholder rows | none (F: synchronous store). |
| link-outs between apps | `DemoXero.tsx:308,457` (to `/web/accounts`) and the AppShell requirements link. They use the inline-link styles in A G2. Covered. |
| icons | 73 files import lucide-react. Only one SVG path is pasted: the tick, **N8**. The PhoneFrame status-bar SVGs are unique. |
| disclosure (expand/collapse) | no sweep covered it: **N9**. |
| option cards (selectable tile with title + hint) | C G8 covers keyboard behaviour only and says the visuals differ by job. 3 members are not listed at all: **N5a**. |

---

## Task 1(c): missed families, verified in code

### N1 · Session status block (status-filled block with two lines). **High value, 7 builds**
Job: show one session in its status colour, using the three treatments (solid with a left bar, hatched for
Unavailable, dashed for Free).
`theme/statusColours.ts:75-88` defines the treatments and `shared/StatusBlock.tsx:22` exports
`blockFill(visual)`.

| member | file:line | how it fills | note |
|---|---|---|---|
| `StatusBlock` (shared) | `shared/StatusBlock.tsx:31` | `blockFill` | radius 6, pad 6/9; only used by StatusLegend:107 |
| SlotStatusSheet preview | `apps/admin/flows/SlotStatusSheet.tsx:129` | `blockFill` | **inline re-type of StatusBlock** (same radius 6, pad 6px 9px, 11/10 two lines) instead of `<StatusBlock>` |
| `HalfBlock` | `apps/mobile/screens/MyAvailabilityCalendarScreen.tsx:169-173` | `blockFill` | good |
| `DayCell` blocks | `apps/web/screens/MyAvailabilityCalendar.tsx:173-181` | `blockFill` | good |
| `GridBlock` | `apps/admin/components/DayGrid.tsx:369,385-389` | hand-rolled `colour.blockBackground` + own border logic | adds conflict and attention outlines (intended extras) |
| `Block` | `apps/web/components/WeekStrip.tsx:177,199,214` | hand-rolled: `bg = c.tint` (**not** `blockBackground`), own `borderLeft` | a hatched status would render as flat tint here: likely DRIFT (check visually) |
| `Cell` | `apps/web/screens/AvailabilityGrid.tsx:222,231-261` | hand-rolled `blockBackground`, a separate 4px bar span instead of a left border, radius 9 | |
| colleague AM/PM cells | `apps/mobile/screens/AvailabilityScreen.tsx:27-31` (`cellStyle`), used :239 | hand-rolled: solid uses `c.tint` and no bar; hatched adds a line border | |
| `ListRow` open body | `shared/schedule/ListRow.tsx:165` | `blockBackground` + border | design-backed row, not a block (keep) |

Verdict: same job, 7 builds (plus ListRow). Four re-derive the fill instead of calling `blockFill`, with three
different left-bar treatments (`borderLeft 3px`, an inner 4px bar, no bar). Target: `StatusBlock` with
`size`/`lines`/`as="button"` props, or at least every site calling `blockFill`. B noted StatusBlock as "block
family belongs to the grid audit", but there was no grid sweep.

### N2 · Money totals block (Subtotal / GST / Total, label + right-aligned mono). **4 builds**
- `apps/admin/screens/InvoiceDocument.tsx:186-191` with `TotalRow` :496: 12.5 slate / mono 12.5, minWidth 110,
  gap 24. Total due 13.5/700 + mono 15/700 under a 2px ink rule.
- `apps/demo/DemoXero.tsx:587-589` with `TotalLine` :771: width 230, gap 20, 12.5/500, strong 14/700, 1px line on top.
- `apps/admin/screens/AaFeesScreen.tsx:371-385` (`FeeInvoiceDetail`): the same rows hand-typed inline, 12.5,
  bold total, 1px line on top.
- `apps/mobile/screens/BalancesScreen.tsx:127-130`: a single "GST component" total, 13/700.

Same job; three rules for weight and divider. The invoice document's print voice may be INTENDED, but
DemoXero and AaFees are drift. Target: `TotalsBlock rows=[{label, value, strong?}]`.

### N3 · Frosted sticky dock container. **3 byte-identical copies**
`shared/surface/SurfaceProvider.tsx:160-175` (booking dock, `zIndex 45`, keyboard inset),
`apps/mobile/screens/ListDetailScreen.tsx:370-382` and `apps/mobile/screens/MyAvailabilityCalendarScreen.tsx:142-152`.
All three use: `position:absolute; bottom 0; padding 14/20; paddingBottom max(calc(inset - 2px), 14px);
background rgba(246,248,247,0.92); backdropFilter blur(14px); borderTop 1px line`.
The two screen copies do not publish `--aa-dock-height` (only SurfaceProvider:91 does), so `UpdatePrompt` and
`PwaDemoActions` cannot clear them.
- H gave the colour a token (`surface.frosted`), and A G7 covers the button inside, but the container was
  never grouped.
- Related: the `BottomTabBar` (`apps/mobile/MobileApp.tsx:40-50`) has the same anatomy at 0.94 white.
- `DockSpacer` heights are magic numbers that track these docks: 74, 82 and 86 across 8 call sites
  (`ForwardListsScreen.tsx:338,344,404`, `ListDetailScreen.tsx:362`, etc.).

Target: `StickyDock` in `shared/ui`, which publishes its height.

### N4 · Notice row (sentence, "quoted message", timestamp, optional open chevron or Resolve tick). **5 builds**
| member | file:line | timestamp format |
|---|---|---|
| `NotificationText` (admin card + page) | `apps/admin/components/NotificationsCard.tsx:29` | `'EEE d MMM, HH:mm'` |
| `NoticeRow` | `shared/flows/MovedToYouPanel.tsx:109` | `'EEE d MMM, HH:mm'` |
| `OfficeAlertLine` | `shared/flows/AlertOfficeSheet.tsx:175` | `whenLabel` (same) |
| `MovedHereLine` | `apps/admin/components/SlotDrawer.tsx:435` | `'EEE d MMM HH:mm'` (no comma) |
| `BookingMovedHereLine` | `SlotDrawer.tsx:453` | same, no comma |

F G11 grouped only the box tone and D G8 the stamp format. Nobody grouped the shared row anatomy: a 13 to
13.5 sentence, a 12.5 to 13 slate `"message"`, and an 11 to 12 mist stamp. Target: `NoticeLine({ text, message?, atISO, onOpen?, action? })`.

### N5 · Pick rows and option cards
- **N5a, selectable option card** (title 15/600 + slate hint; accent border and tint when chosen).
  - C G8 lists `OptionList`, `ChoiceTiles`, StatusRadioGroup and PairingAddSheet for keyboard behaviour only.
  - **Not listed anywhere:**
    - `shared/capture/AddBillingLineSheet.tsx:145` `BasisOption`: 1.5px border, `radius.ctl + 2`, and **no
      role, aria-pressed or aria-checked**, so the chosen basis is invisible to assistive tech.
    - The "Tell the office" checkbox card at `shared/flows/MoveBookingToColleagueSheet.tsx:232-245`.
    - The PWA option rows at `pwa/PwaDemoActions.tsx:118-140`.
  - Same visual as `ContractRail.tsx:470-485`.
- **N5b, colleague / candidate pick rows.**
  - Anaesthetist side: `shared/flows/MoveListSheet.tsx:196-213` (inline, minHeight 56) and
    `shared/flows/MoveBookingToColleagueSheet.tsx:294` `ReceiverRow` (minHeight 60). Both are Initials +
    15/600 name + slate line + chevron, separated by sunken rules: same job twice in the same feature.
  - Admin side: `apps/admin/components/pairing/AnaesthetistCandidates.tsx:196` `ClosedColleagueRow` and
    `apps/admin/components/pairing/DraftListCandidates.tsx:205-221`. Both are blocked rows (dashed
    `lineStrong`, `neutral.bg`, `radius.card`, 13/600 + 12 line), identical boxes.
  - No sweep grouped either pair. C G9 covered only the search box over them.

### N6 · Dashed "Add a booking" button. **2 builds**
`apps/web/screens/ListDetailView.tsx:314` (`radius.ctl`, 14px, pad 13/16) and `apps/mobile/screens/ListDetailScreen.tsx:339`
(`radius.card`, 15px, pad 14/16). Both use `1.5px dashed lineStrong`, teal text and a Plus icon, and both lack
`type="button"`. A noticed only the missing `type` (A line 346-347). Target: `Button variant="add"` or `AddRowButton`.

### N7 · Price override form. **2 builds of one form**
`shared/capture/OverrideCard.tsx` (BtmCaptureBlock:232, $ and fixed) and `shared/flows/PriceOverrideSheet.tsx`
(OfficeBillingSetup:80, adds %). Both have a Segmented mode, an amount TextField, "Reason (required)" with the
same warning caption, the same validation (`parsed > 0` for fixed, `!== 0` for adjustment;
`OverrideCard.tsx:52-57` vs `PriceOverrideSheet.tsx:51-55`) and two `modeOf` helpers with different
vocabularies. Comments say the subset is deliberate (mobile carries no %). The fields and the validation
could still be one `PriceOverrideFields modes=[...]`. Value: medium, because a rule change has to be made twice.

### N8 · The tick icon: three idioms
- Hand-drawn SVG path `M2.5 7.5 L5.5 10.5 L11.5 3.5` (viewBox 14, stroke 2.4) pasted in 3 product files:
  `shared/ui/TickBadge.tsx:37`, `shared/capture/CompleteBar.tsx:38` and `apps/mobile/screens/ListDetailScreen.tsx:411`.
  A 4th copy is in the catalogue at `recreations.tsx:262`. `SuccessOverlay.tsx:93` draws its own larger one.
- lucide `Check` / `CheckCircle2` in 9 files.
- Text glyph `✓` in 3: `BillingMonitorScreen.tsx:361,367` and `InvoiceDocument.tsx:428`.

Target: one exported `TickGlyph` (the brand tick) for completion states, and lucide `Check` for "selected".

### N9 · Disclosure (expand / collapse). **8 sites, 3 mechanisms**
- Native `<details>`: `apps/admin/flows/RecurringBookingSheet.tsx:351`, `apps/admin/components/pairing/AnaesthetistCandidates.tsx:229`
  (bordered card) and `apps/admin/components/pairing/PairingSection.tsx:84` (custom `.aa-disclosure` chevron,
  `global.css:725-735`).
- Button toggles:
  - `shared/booking/HistoryTimeline.tsx:204`: **no `aria-expanded`, no `type`**; animates grid rows.
  - `apps/admin/components/WarningsToDo.tsx:116`: aria-expanded.
  - `apps/admin/screens/AaFeesScreen.tsx:305`: chevron Down/Right.
  - `shared/capture/ModifierPickerSheet.tsx:151`.

Three different summary looks; only one has a chevron treatment. Target: `Disclosure` (summary + chevron +
`aria-expanded` + the HistoryTimeline grid-rows animation).

### N10 · Demo tools: copy to clipboard and code blocks (low value)
- Clipboard: `shell/gradientLab/GradientLab.tsx:255-266` (flash "Copied" 1400ms) and
  `pwa/PwaDemoPanel.tsx:388-396`. Both are try/catch around `navigator.clipboard.writeText`.
- `<pre>` blocks: `apps/demo/DemoIntegrations.tsx:258` (`codeBlock` :351-365: sunken, 11, pre, max 120) and
  `apps/demo/DemoData.tsx:440-455` (surface + line, 11.5, pre-wrap, max 260).

Demo only. Merge only if a `CodeBlock`/`CopyButton` is wanted for the presenter tools.

### Small leftovers (no new group needed)
- An icon-disc avatar for things, not people, is built 3 times: `moveSheetParts.tsx:70` (36, sunken, slate),
  `MoveListSheet.tsx:236` (44) and `BalancesScreen.tsx:62` (44). It could be an `Avatar`/`Initials` `icon` variant (B G5).
- The Balances hero figure card (`BalancesScreen.tsx:61-69`) belongs in G G9.
- InvoiceDocument `RailCard` (:343, with a warning-tint variant), DemoXero `RecordCard` (:688) and
  IntegrationMonitor `DataQualityCard` are inside G G4's scanner count but not named. Add `tone="warning"` to the G4 target.
- Retire confirms `AvailabilityStatusesView.tsx:93` and `RvgGroupsView.tsx:254` are byte-for-byte the same
  shape (title, body, FormError, primary, Cancel). That shape is F G4 B / G6; name them as members.
- Add/Edit pairs: `AddAnaesthetistFlow.tsx` and `EditAnaesthetistSheet.tsx` share 43 lines, with the same 6
  fields in a different order. `AddHospitalSheet` and `EditHospitalSheet` likewise. A shared fields component
  is possible; value is low.

---

## Task 2: H-tokens spot-check

Re-run with H's own scope (`rg -g '*.{ts,tsx,css}' -g '!theme/**' -g '!**/*.test.*' -g '!test/**' -g '!**/__parity__/**' -g '!apps/demo/catalogue/**' -g '!shell/gradientLab/**'`).

| # | claim | H says | my count | verdict |
|---|---|---|---|---|
| 1 | `fontSize: 12.5` | 209 in 79 files | **211 in 79** | OK |
| 2 | fontSize literals total | 1,435 | 1,427 | OK |
| 3 | card container (line border + `radius.card`) | 80 in 54 | **75 in 49** (innermost object containing both); strict surface+line+card **58 in 39** (H: 59/40) | headline slightly high; strict matches. Not material |
| 4 | eyebrow (fontSize ... letterSpacing em) | ~61 in 40; exact 11+0.06em 36 | **61 in 40; 36 in 28** | OK |
| 5 | `#FFFFFF` | 38 in 23, 36 as colour | **38 in 23**: 25 plain `color: '#FFFFFF'` + 11 in ternaries, + Wordmark const + pdfSamples fill | OK |
| 6 | radius literals | 999 86/47, 99 33/19, 10 27/15, 14 9/9, 8 13/11, 12 13/11, 6 8/6, 9 7/4, 16 7/4, 7 3/2 | 999 **85/46**, others identical; 3:1, 4:2, 5:2, 20:1, 24:1, 48:1, 100:1 | OK |
| 7 | radius token reads | ctl 191, card 122, pill 35 | ctl 191, card **126**, pill **36** | OK (minor) |
| 8 | `#F1F4F2` | 3 / 1 | 3 occurrences on 2 lines, `apps/admin/components/DayGrid.tsx:113` (x2), `:235` | OK |
| 9 | `#D89AA9` | 1 / 1 | `apps/admin/components/SideNav.tsx:56` | OK |
| 10 | `#8FE3B4` | 1 / 1 | `apps/mobile/screens/AvailabilityScreen.tsx:139` (+1 in the excluded catalogue `recreations.tsx:362`) | OK |
| 11 | `#F2D5DC` | 1 / 1 | `theme/statusColours.ts:51` only | OK |
| 12 | segmented highlight shadow 0.2 / 0.15 / 0.18 | `SlidingSegmentedControl.tsx:63,69,75` | same lines | OK |
| 13 | z-index 200 clash | Dialog + PhoneFrame | `shared/surface/Dialog.tsx:57`, `shell/PhoneFrame.tsx:137`; 16 distinct values confirmed | OK |
| 14 | 7 focus outline rules | 7 | 7 teal outlines confirmed (`global.css:376,381,419,733,748,785,798`) | **incomplete**: see below |
| 15 | sheet title 18/700 | 70 / 58 | `fontSize: 18` 70/58; `18, fontWeight: 700` adjacent 69/57 | OK |
| 16 | `type` read by 2 files | ProcedureStack, AddBookingFlow | confirmed (`ProcedureStack.tsx:36`, `AddBookingFlow.tsx:72-75`) | OK. Contradicts **G G6 "type.micro: nobody reads it"**: ProcedureStack.tsx:36 builds `MICRO` from it |
| 17 | `rgba(246,248,247,0.92)` | 3 / 3 | 3 / 3 | OK |

What H missed about focus:
- **An 8th focus treatment:** `.aa-admin-calendar-day:focus-visible` (`theme/global.css:368-373`, used at
  `apps/admin/components/RightRail.tsx:180`). It uses `box-shadow: var(--shadow-calendar-focus)`, defined at
  `global.css:148` as `0 0 0 2px surface, 0 0 0 5px var(--color-brand)`. That is a **crimson** focus ring on the
  admin mini calendar, which breaks the hard rule that crimson is identity only.
- A 9th, error-coloured rule: `[data-validation-focus='true']:focus` 3px `--color-error` (`global.css:385-388`).
  It is arguably not a focus ring, but it belongs in the same ruling.

### Proposed new tokens vs `docs/design/` (counts are exact-string hits)

| proposed token | in Design Language? | in a sample page? | verdict |
|---|---|---|---|
| `type.small` 12.5 | no | Admin Day 8, Admin Review 7, Mobile Availability 2 (`font-size:12.5px;line-height:18px`, e.g. Admin Day line 102) | design-sourced (pages) |
| `type.sheetTitle` 18/24/700 | no 18px font size | only `Mobile Availability` `font-size:18px;font-weight:700` x2 (not a sheet title, no 24 line) | **would invent**: codifies a code convention; say so in the token comment or ask |
| `type.pageTitle` 24/30/700/-0.01em | no | Admin Day 1, Admin Review 1, Mobile App 2 (`font-size:24px;…line-height:30px`) | sourced |
| `type.pageTitleWeb` 28/34 | no | Web Availability 1, Web Dashboard 1 | sourced |
| `type.labelLg` 13.5 | no | Admin Day 5, Admin Review 5 | sourced |
| `type.captionSm` 11.5 | no | Admin Day 8, Admin Review 1 | sourced |
| `type.microSm` 10 / 10.5 | **10px yes (13 hits)** | 10.5: Admin Day 1, Mobile Availability 2 | 10 sourced; 10.5 page-only |
| `type.stat` 20/700 | no | Mobile App 9 | sourced (page) |
| `radius.sm` 8 | yes (1) | Web Dashboard 11, Mobile App 3 | sourced |
| `radius.md` 12 | yes (5) | Admin Review 7, Mobile App 11 | sourced |
| `radius.xs` 6 | yes (10, status blocks) | Admin Day 2 | sourced |
| `radius.xxs` 4 | yes (6) | Mobile Availability 1 | sourced |
| `neutral.gridline #F1F4F2` | no | Admin Day 3 | sourced (page) |
| `brand.onDarkMuted #D89AA9` | no | Admin Day 1, Admin Review 1 | sourced (page) |
| `brand.onDark #C25B72` | no | **none** | **would invent** in design terms (only the Decisions log 2026-07-22 backs it, as H says) |
| `status.free.onFill #8FE3B4` | no | Mobile Availability 1 | sourced |
| `holiday.edge #F2D5DC` | no | Mobile App 1 | sourced |
| `onFill` white ladder | no | 0.9 (Mobile App), 0.7 (Mobile Availability), 0.55 (Mobile App 2), 0.5 and 0.08 (Admin Day/Review) | **partly invented**: 0.45, 0.22, 0.14 are in no design file |
| `surface.frosted` 0.92 | no | Mobile App 2 | sourced |
| `surface.frostedLight` 0.94 | no | Mobile App 1, Mobile Availability 1 | sourced |
| `elevation.drawer` `-8px 0 24px … 0.16` | no | none | **would invent** (H already says "not in design") |
| `elevation.cardEdge` `-16px 0 32px … 0.12` | no | Mobile App 2 | sourced |
| `elevation.thumb` `0 1px 3px rgba(23,35,32,0.2)` | **yes** (line 271, the selection-slide demo) | Mobile App 1; 0.15 in Mobile Availability 1; 0.18 nowhere as a thumb | sourced; 0.18 is code-only, as H says |
| `motion.uiFade` 150ms | no (not one of the four named motions) | Mobile App 4, Mobile Availability 5, Web Availability 2 | sourced (pages) |
| `motion.fade` 200ms | no | Mobile App 1 (`overIn 200ms`), Web Availability 2 | sourced |
| `motion.progress` 300ms | no | Mobile App 1 (`width 300ms cubic-bezier(0.2,0.8,0.2,1)`), Admin Review 1 | sourced |
| `motion.successHold` 1050 | no | Mobile App 1 (`setState(...), 1050`) | sourced |
| `zIndex` scale | no | Mobile App uses 30/40/45/50/51/60 | engineering scale; partly mirrors the mockup's values; not design |
| focus ring width/offset (outline) | DL line 80 defines **one** focus ring, `0 0 0 3px rgba(13,110,99,0.30)` (= `accent.focusRing`) | none use outline | **would invent** an outline spec. Design Language answers H's question 7: the box-shadow ring |
