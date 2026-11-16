import { OFFICE_ACTOR } from '../../../store'
import { DRAFT_LIST, DRAFT_LISTS, UNASSIGNED } from '../../../shared/scheduleTerms'
import { CataloguePage, CatalogueRow, LibraryGroup, StageHint } from './CatalogueKit'
import { ReviewQueue } from '../../admin/screens/ReviewQueue'
import { AuditViewer } from '../../admin/screens/AuditViewer'
import { IntegrationMonitorScreen } from '../../admin/screens/IntegrationMonitorScreen'
import { HospitalsView } from '../../admin/screens/masters/HospitalsView'
import { RvgGroupsView } from '../../admin/screens/masters/RvgGroupsView'
import {
  AnatomyDatalistExample,
  ButtonExample,
  ChangedSinceSubmittedExample,
  ConflictDotExample,
  DateFieldExample,
  DrawerPartsExample,
  FormErrorExample,
  InlineBannerExample,
  MasterPanelExample,
  PopoverPanelExample,
  SidePanelExample,
  MasterPillsExample,
  MastersSubNavExample,
  MasterTableExample,
  NameSearchBoxExample,
  OverlayExample,
  PairingPillsExample,
  PillExample,
  ProfileChromeExample,
  SegmentedExample,
  SessionTimesExample,
  SlidingSegmentedExample,
  StatusBlockExample,
  StatusChipExample,
  StatusLegendExample,
  SuccessOverlayExample,
  TabLinkExample,
  TextAreaExample,
  TextFieldExample,
  TickBadgeExample,
  TickButtonExample,
  VacatedChoiceExample,
  WarningTriangleExample,
  Wide,
} from './admin/basicExamples'
import {
  AnaesthetistCandidatesExample,
  ChipMultiSelectExample,
  ClearConflictExample,
  CodePickerExample,
  ConflictCalloutExample,
  ContractPanelExample,
  ContractPriceRangesExample,
  ContractSelectExample,
  DayGridExample,
  DayNavExample,
  DraftListBandExample,
  DraftListCandidatesExample,
  DraftListDrawerExample,
  DraftListPartsLive,
  FocusFiltersExample,
  HistorySheetExample,
  InvoiceDocumentExample,
  NotificationsCardExample,
  NotPreferredWarningExample,
  PipelineStepperExample,
  ReviewScreenExample,
  RightRailExample,
  SideNavExample,
  SlotDrawerExample,
  SlotStatusSheetExample,
  SurgeonPickerExample,
  WarningsToDoExample,
} from './admin/storeExamples'
import { ProcedureStackExample } from './procedureStackExample'
import { FunderDetailsExample, PayerDetailsExample, PayerFieldsExample } from './payerExamples'

const A = 'Admin'
const AW = 'Admin · Web'
const AWM = 'Admin · Web · Mobile'
const noop = () => {}

/**
 * The Admin Web App's UI component catalogue (demo only; /demo/catalogue/admin).
 * Every row mounts the real component from src/apps/admin or src/shared, with
 * local state and stubbed navigation; the few rebuilt ones say so in their note.
 */
export function AdminCatalogue() {
  return (
    <CataloguePage
      title="Admin Web App · UI components"
      intro="Every hand-built component in the Admin app, one per row, grouped by the library that would replace it. Each live example is the real component: click, type and open it. Where a row changes the demo store it says so; Demo reset puts it back."
    >
      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="shadcn">
        <CatalogueRow name="Button" source="shared/ui/Button.tsx" usedIn={AWM} what="The one button: teal primary, outlined secondary and the compact tinted pill, with a disabled state. About 102 uses in Admin." replaceWith="shadcn Button (cva variants)" note="Adds focus-visible, hover and loading states.">
          <ButtonExample />
        </CatalogueRow>
        <CatalogueRow name="TickButton" source="shared/ui/TickButton.tsx" usedIn={AW} what="The office's 'dealt with' control: a teal outline button with a check, used by To-do Clear and notice Resolve." replaceWith="shadcn Button (outline variant + icon)">
          <TickButtonExample />
        </CatalogueRow>
        <CatalogueRow name="Segmented" source="shared/ui/Field.tsx" usedIn={AWM} what="A row of mutually exclusive options (status filters, List or Calendar, Yes or No). 22 uses in Admin." replaceWith="shadcn ToggleGroup (single)" note="Gives radio semantics and arrow keys.">
          <SegmentedExample />
        </CatalogueRow>
        <CatalogueRow name="SlidingSegmentedControl" source="shared/ui/SlidingSegmentedControl.tsx" usedIn={AWM} what="A segmented control whose selected pill slides between options, in teal, surface and ink variants." replaceWith="shadcn ToggleGroup (single) or Tabs" note="Keep the sliding indicator with a Motion layoutId.">
          <SlidingSegmentedExample />
        </CatalogueRow>
        <CatalogueRow name="StatusLegend (chips)" source="shared/StatusLegend.tsx" usedIn={AWM} what="The List kinds and availability statuses from the status master. With a toggle handler each chip hides or shows that status on the grid." replaceWith="shadcn ToggleGroup (multiple)">
          <StatusLegendExample />
        </CatalogueRow>
        <CatalogueRow name="SignalFilterButton (DayGrid focus filters)" source="apps/admin/components/DayGrid.tsx" usedIn={A} what="The Day grid footer's aria-pressed pills (Needs attention, Conflict, Has note, Has warnings) that narrow and regroup the rows, with Reset filters." replaceWith="shadcn ToggleGroup (multiple) / Toggle" note="Not exported: the row mounts the real DayGrid with an empty roster, so only its live footer shows.">
          <FocusFiltersExample />
        </CatalogueRow>
        <CatalogueRow name="Dialog (useSurface().Overlay)" source="shared/surface/Dialog.tsx" usedIn={AWM} what="The web Overlay every Admin sheet opens in: a centred card over a scrim, closed by Escape or a scrim click. On the one modal stack (useModalLayer, U2): one Escape closes only the top layer, focus goes in, stays in and comes back, the page behind is inert. About 37 uses." replaceWith="shadcn Dialog" note="Adds scroll lock and aria-labelledby; no portal (the phone frame is scaled).">
          <OverlayExample />
        </CatalogueRow>
        <CatalogueRow name="MasterPanel / PanelGrid / PanelSection" source="apps/admin/components/MasterPanel.tsx" usedIn={A} what="The 600px record preset of SidePanel the Contract and Party editors open in: the h2 at 18/700 names the dialog, the footer is right-aligned with the primary last." replaceWith="shadcn Sheet (side)" note="Since U2 one shell with the drawers (SidePanel); a sheet opened over it (the RVG code picker) closes first on Escape.">
          <MasterPanelExample />
        </CatalogueRow>
        <CatalogueRow name="SidePanel" source="apps/admin/components/SidePanel.tsx" usedIn={A} what="The one Admin right-docked panel (U2): scrim, an h2 header at 18/700 that names the dialog, the corner X, e3, a scrolling body and a footer. 440px list (the drawers) or 600px record (MasterPanel). On the one modal stack." replaceWith="shadcn Sheet (side)">
          <SidePanelExample />
        </CatalogueRow>
        <CatalogueRow name="PopoverPanel" source="shared/ui/PopoverPanel.tsx" usedIn={AWM} what="The one popover panel and behaviour (usePopover, U2): a white card at the card radius and e3 under its trigger; outside click closes, Escape closes and returns focus. The harness menus and the Contract combo use it." replaceWith="shadcn Popover">
          <PopoverPanelExample />
        </CatalogueRow>
        <CatalogueRow name="SlotDrawer" source="apps/admin/components/SlotDrawer.tsx" usedIn={A} what="The 440px session drawer on SidePanel: an empty session's actions, or a List's details, bookings and actions with nested sheets. A named dialog with Escape, focus in and back." replaceWith="shadcn Sheet (side)" note="Its actions (assign, edit, reassign, status) write to the demo store, and its List links leave this page.">
          <SlotDrawerExample />
          <StageHint>Opens over the page from the right.</StageHint>
        </CatalogueRow>
        <CatalogueRow name="DraftListDrawer" source="apps/admin/components/DraftListDrawer.tsx" usedIn={A} what={`The same drawer on SidePanel for a ${DRAFT_LIST} (no session yet): its details, bookings and Assign, Redate, Edit and Remove.`} replaceWith="shadcn Sheet (side)" note="Disabled reasons live only in title tooltips. Its actions write to the demo store.">
          <DraftListDrawerExample />
        </CatalogueRow>
        <CatalogueRow name="ClearConflictSheet" source="apps/admin/components/conflicts/ClearConflictSheet.tsx" usedIn={A} what="Confirms clearing a hospital-closure conflict on a List, with an optional note." replaceWith="shadcn AlertDialog" note="Correct alertdialog role, focus on the safe action. Confirming clears the conflict in the demo store.">
          <ClearConflictExample />
        </CatalogueRow>
        <CatalogueRow name="HistorySheet" source="shared/booking/HistorySheet.tsx" usedIn={AWM} what="The audit history of a record in an Overlay, with expandable steps (HistoryTimeline)." replaceWith="shadcn Dialog + Accordion">
          <HistorySheetExample />
        </CatalogueRow>
        <CatalogueRow name="SideNav (with RolesInfo)" source="apps/admin/components/SideNav.tsx" usedIn={A} what="The dark Admin side nav: sections with crimson and amber count badges, the wordmark and the Roles in this prototype dialog." replaceWith="shadcn Sidebar" note="Gives real links, aria-current and a nav label; crimson only on --sidebar-primary." height={600}>
          <SideNavExample />
        </CatalogueRow>
        <CatalogueRow name="Master data sub-nav" source="apps/admin/screens/masters/MasterData.tsx" usedIn={A} what="The vertical list of the 15 master views, with aria-current on the open one." replaceWith="shadcn Sidebar group / NavigationMenu" note="Rebuilt from MasterData's markup and the real MASTERS_NAV: the real nav writes ?view= and renders every master view." height={420}>
          <MastersSubNavExample />
        </CatalogueRow>
        <CatalogueRow name="TabButton (Integrations)" source="apps/admin/screens/IntegrationMonitorScreen.tsx" usedIn={A} what="Five underlined tab buttons switching the Integrations monitor between messages, feeds, PDFs, data quality and validators." replaceWith="shadcn Tabs" note="Not exported: the row mounts the real Integrations screen. Adds tab roles and arrow keys. Some tab actions write to the demo store." height={420}>
          <Wide minWidth={1000}>
            <IntegrationMonitorScreen actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="TabLink (AA fees)" source="apps/admin/screens/AaFeesScreen.tsx" usedIn={A} what="Route tabs for the AA fee invoices and fee settings pages." replaceWith="shadcn Tabs (as links)" note="Rebuilt on buttons with the same styles: the real one is a router Link that would leave this page.">
          <TabLinkExample />
        </CatalogueRow>
        <CatalogueRow name="DayNav (with SortToggle)" source="apps/admin/components/DayNav.tsx" usedIn={A} what="The Day view toolbar: week and day steppers, Today, a native date input bounded by the horizon, the Roster or A to Z SortToggle and Find available." replaceWith="shadcn Button Group + ToggleGroup + Date Picker" note="Labels the glyph buttons and gives SortToggle pressed semantics.">
          <DayNavExample />
        </CatalogueRow>
        <CatalogueRow name="StatusChip" source="shared/StatusChip.tsx" usedIn={AWM} what="A small tinted chip for a List kind or availability status, coloured from the status master." replaceWith="shadcn Badge (6 status variants)">
          <StatusChipExample />
        </CatalogueRow>
        <CatalogueRow name="Pill" source="shared/ui/Pill.tsx" usedIn={AWM} what="Neutral, success and warning label pills, never teal or crimson, so no pill reads as a button (the warning tone since catch-up Phase 21: a payer with no contact, Under 18, no approval number)." replaceWith="shadcn Badge">
          <PillExample />
        </CatalogueRow>
        <CatalogueRow name="MasterPills" source="apps/admin/components/MasterPills.tsx" usedIn={A} what="Admin's import path for Pill, used for Party kinds, Contract tags, Active and RVG anatomy headings." replaceWith="shadcn Badge" note="A re-export only: delete it in the migration.">
          <MasterPillsExample />
        </CatalogueRow>
        <CatalogueRow name="TierPill / PreferredPill / NotPreferredPill" source="apps/admin/components/pairing/Pills.tsx" usedIn={A} what="The office-only pairing pills: priority tier, preferred pairing (teal tint) and not preferred (warning outline)." replaceWith="shadcn Badge">
          <PairingPillsExample />
        </CatalogueRow>
        <CatalogueRow name="ChangedSinceSubmittedPill" source="apps/admin/components/ChangedSinceSubmitted.tsx" usedIn={A} what="Flags a submitted List the anaesthetist has changed since submitting, with the count and time of the last change." replaceWith="shadcn Badge + Tooltip" note="Driven by a local cue here: the seed has no changed submitted List.">
          <ChangedSinceSubmittedExample />
        </CatalogueRow>
        <CatalogueRow name="DraftListParts" source="apps/admin/components/draftLists/DraftListParts.tsx" usedIn={A} what={`${DRAFT_LIST} badges: ${UNASSIGNED}, the DRAFT state chip, the waiting time (amber past a day) and the booking count.`} replaceWith="shadcn Badge">
          <DraftListPartsLive />
        </CatalogueRow>
        <CatalogueRow name="ConflictDot" source="apps/admin/components/conflicts/ConflictDot.tsx" usedIn={A} what="The amber conflict mark, muted once cleared." replaceWith="shadcn Badge (dot) + Tooltip">
          <ConflictDotExample />
        </CatalogueRow>
        <CatalogueRow name="WarningTriangle" source="shared/warnings/WarningTriangle.tsx" usedIn={AWM} what="The warning mark on a booking, coloured by the strongest open warning." replaceWith="shadcn Tooltip + Badge" note="Its detail is reachable by keyboard once it is a Tooltip.">
          <WarningTriangleExample />
        </CatalogueRow>
        <CatalogueRow name="NameSearchBox" source="shared/ui/NameSearchBox.tsx" usedIn={AWM} what="The one type-ahead name search box, in field and pill sizes; Escape clears it. Each caller filters its own rows." replaceWith="shadcn Input Group (search)" note="One search input instead of three.">
          <NameSearchBoxExample />
        </CatalogueRow>
        <CatalogueRow name="ContractSelect (fieldChrome select)" source="shared/contracts/ContractSelect.tsx" usedIn={A} what="A native select of every active Contract grouped by holder, styled with Admin's 48px selectControlStyle." replaceWith="shadcn Select (or NativeSelect)" note="Several Admin selects are unlabelled today; this one has its label.">
          <ContractSelectExample />
        </CatalogueRow>
        <CatalogueRow name="SurgeonPicker" source="apps/admin/components/pairing/SurgeonPicker.tsx" usedIn={A} what="A native select of surgeons with a 'Not preferred with Dr X' optgroup for the chosen anaesthetist." replaceWith="Base UI Combobox (with groups)" note="The list is long and not searchable today. Opens on an anaesthetist with a not-preferred surgeon, so the second optgroup shows.">
          <SurgeonPickerExample />
        </CatalogueRow>
        <CatalogueRow name="NotPreferredWarning" source="apps/admin/components/pairing/NotPreferredWarning.tsx" usedIn={A} what="An amber callout when the chosen surgeon is not preferred with the anaesthetist; it warns, never blocks." replaceWith="shadcn Alert" note="Fed by the real useNotPreferredWarning hook for a seeded not-preferred pairing.">
          <NotPreferredWarningExample />
        </CatalogueRow>
        <CatalogueRow name="ChipMultiSelect" source="apps/admin/components/ChipMultiSelect.tsx" usedIn={A} what="A native 'Add a...' select plus removable chips, for a Contract's specialties." replaceWith="Base UI Combobox (multiple, chips)" note="Searchable, with Backspace to remove.">
          <ChipMultiSelectExample />
        </CatalogueRow>
        <CatalogueRow name="CodePickerSheet" source="shared/capture/CodePickerSheet.tsx" usedIn={AWM} what="The RVG code type-ahead in an Overlay: search by code or description, every match rendered." replaceWith="Base UI Combobox + TanStack Virtual" note="Gives combobox and listbox roles and arrow and Enter selection.">
          <CodePickerExample />
        </CatalogueRow>
        <CatalogueRow name="ConflictCallout" source="apps/admin/components/conflicts/ConflictCallout.tsx" usedIn={A} what="Warns, before saving, that the hospital is closed that day and the List will be flagged." replaceWith="shadcn Alert">
          <ConflictCalloutExample />
        </CatalogueRow>
        <CatalogueRow name="WarningsToDo" source="apps/admin/components/WarningsToDo.tsx" usedIn={A} what="The rail's To-do card: every open warning, soonest first, each with Open and Clear, and a show-more toggle." replaceWith="shadcn Card + Collapsible" note="Clear writes a clearance to the demo store.">
          <WarningsToDoExample />
        </CatalogueRow>
        <CatalogueRow name="NotificationsCard" source="apps/admin/components/NotificationsCard.tsx" usedIn={A} what="The rail's shared notification pool: active notices with Resolve, See all and Show resolved." replaceWith="shadcn Card + Button" note="Resolve writes to the demo store. The fresh seed has no notices, so it shows its empty state.">
          <NotificationsCardExample />
        </CatalogueRow>
        <CatalogueRow name="VacatedSessionChoice / StatusRadioGroup" source="shared/flows/VacatedSessionChoice.tsx" usedIn={AWM} what="A radio group of status chips with a roving tab stop: what the vacated session becomes after a move." replaceWith="shadcn RadioGroup" note="Already correct; swap for consistency.">
          <VacatedChoiceExample />
        </CatalogueRow>
        <CatalogueRow name="ProfileChrome" source="apps/admin/components/ProfileChrome.tsx" usedIn={A} what="The surgeon and anaesthetist record pages' header, id chip, cards, fact rows and History and Edit actions." replaceWith="shadcn Card (+ Breadcrumb for BackLink)" note="BackLink is left out: it is a router Link.">
          <ProfileChromeExample />
        </CatalogueRow>
        <CatalogueRow name="drawerParts (Section, Row, DrawerLink, ActionBtn)" source="apps/admin/components/drawerParts.tsx" usedIn={A} what="The drawers' section headings, label and value rows, inline links and action buttons, shared by SlotDrawer and DraftListDrawer (one copy since U2)." replaceWith="shadcn Button + DropdownMenu" note="U5 folds ActionBtn into Button.">
          <DrawerPartsExample />
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="sonner">
        <CatalogueRow name="Inline success banner (role=status)" source="apps/admin/screens/ConflictsScreen.tsx" usedIn={A} what={`A teal-tint confirmation line with Dismiss after an action (Conflicts, ${DRAFT_LISTS}, Recurring apply, Holiday, AA fees).`} replaceWith="Sonner toast (with action and undo)" note="Inline JSX in each screen, not a component: rebuilt here from the Conflicts screen. Errors stay inline.">
          <InlineBannerExample />
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="tanstack">
        <CatalogueRow name="Table / Header / TextAction / EditCell" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="The master views' table chrome: a page header, a bordered table with head cells, text actions and an Edit cell." replaceWith="TanStack Table + shadcn Table" note="Adds sorting with aria-sort, sticky headers and column visibility. Th and Td are duplicated in four files today.">
          <MasterTableExample />
        </CatalogueRow>
        <CatalogueRow name="ReviewQueue (clickable rows)" source="apps/admin/screens/ReviewQueue.tsx" usedIn={A} what="Submitted Lists to authorise, as a table whose whole row opens the List (tableChrome's isInteractiveRowTarget)." replaceWith="TanStack Table + shadcn Table (row links)" note="Fixes mouse-only row clicks: rows have no tabIndex today. Open is stubbed." height={380}>
          <Wide minWidth={980}>
            <ReviewQueue onOpen={noop} onViewInvoices={noop} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="RvgGroupsView (grouped rows)" source="apps/admin/screens/masters/RvgGroupsView.tsx" usedIn={A} what="RVG groups under anatomy headings (colSpan group rows), with search, an anatomy filter and add, edit and retire." replaceWith="TanStack Table (grouping) + shadcn Table" note="Add, edit and retire write to the demo store." height={460}>
          <Wide minWidth={980}>
            <RvgGroupsView actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="AuditViewer" source="apps/admin/screens/AuditViewer.tsx" usedIn={A} what="The global audit feed with a filter bar (two selects, two dates), capped at 500 rows." replaceWith="TanStack Table + TanStack Virtual" note="Virtualisation or pagination replaces the 500-row cap; the date pair becomes a range picker." height={460}>
          <Wide minWidth={980}>
            <AuditViewer />
          </Wide>
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="forms">
        <CatalogueRow name="TextField" source="shared/ui/Field.tsx" usedIn={AWM} what="A labelled 48px text input with optional mono style and hint line. 59 uses in Admin." replaceWith="shadcn Field + Input (React Hook Form)" note="Adds aria-invalid and field-bound errors.">
          <TextFieldExample />
        </CatalogueRow>
        <CatalogueRow name="TextArea" source="shared/ui/Field.tsx" usedIn={AWM} what="A labelled multi-line text input with an optional blur handler." replaceWith="shadcn Field + Textarea">
          <TextAreaExample />
        </CatalogueRow>
        <CatalogueRow name="FieldLabel / FormError" source="shared/ui/Field.tsx" usedIn={AWM} what="The field label, and the inline role=alert error line under a form." replaceWith="shadcn Label + FieldError (Zod schema)" note="Ties each error to its field instead of one line per form.">
          <FormErrorExample />
        </CatalogueRow>
        <CatalogueRow name="ContractPanel (ContractEditSheet)" source="apps/admin/flows/ContractEditSheet.tsx" usedIn={A} what="The Contract editor in a MasterPanel: two-column fields, selects, segmented choices, ChipMultiSelect, SurgeonPicker, the RVG code picker and price ranges." replaceWith="shadcn Sheet + Field + React Hook Form + Zod" note="Save writes the Contract to the demo store.">
          <ContractPanelExample />
        </CatalogueRow>
        <CatalogueRow name="SlotStatusSheet" source="apps/admin/flows/SlotStatusSheet.tsx" usedIn={A} what="Adds or edits an availability status: name, colour swatches, flags and a live preview, validated as you type." replaceWith="shadcn Dialog + Field + ToggleGroup (swatches) + RHF/Zod" note="Save adds the status to the demo store.">
          <SlotStatusSheetExample />
        </CatalogueRow>
        <CatalogueRow name="ContractPriceRanges" source="apps/admin/flows/ContractPriceRanges.tsx" usedIn={A} what="A fixed-price Contract's dated prices as an inline-edit table: Enter saves, Escape cancels, the last row cannot be deleted." replaceWith="Base UI NumberField + TanStack Table (cell edit)" note="Keep Enter-commits and Escape-cancels. Saving writes to the demo store.">
          <ContractPriceRangesExample />
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="daypicker">
        <CatalogueRow name="MiniCalendar (RightRail)" source="apps/admin/components/RightRail.tsx" usedIn={A} what="The rail's month calendar with roving focus, arrows, Home and End, Page Up and Down, and today in crimson." replaceWith="shadcn Calendar (react-day-picker)" note="Not exported: the row mounts the real RightRail (calendar on top; To-do, notes and Awaiting review below). Keep its key bindings. Notes stay local." height={420}>
          <RightRailExample />
        </CatalogueRow>
        <CatalogueRow name="HospitalCalendar" source="apps/admin/screens/masters/HospitalsView.tsx" usedIn={A} what="One hospital's month of closures and Lists: a closure opens it to change or delete, an open day adds one." replaceWith="shadcn Calendar (custom day content)" note="Not exported: the row mounts the real HospitalsView; choose Calendar. Saving a holiday writes to the demo store." height={520}>
          <Wide minWidth={900}>
            <HospitalsView actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="Native date input (TextField type=date)" source="shared/ui/Field.tsx" usedIn={AWM} what="The browser's own date input, used 15 times in Admin (holidays, redate, audit range, go-to-date)." replaceWith="shadcn Date Picker (Popover + Calendar)" note="Pass the demo clock's today and the horizon as bounds.">
          <DateFieldExample />
        </CatalogueRow>
        <CatalogueRow name="SessionTimesFields" source="apps/admin/flows/SessionTimesFields.tsx" usedIn={A} what="A session's start and end as native time inputs, with a default or own-times hint and Use default." replaceWith="React Aria TimeField (or keep native)" note="Neither Base UI nor react-day-picker has a time picker.">
          <SessionTimesExample />
        </CatalogueRow>
        <CatalogueRow name="RVG anatomy datalist" source="apps/admin/screens/masters/RvgGroupsView.tsx" usedIn={A} what="RvgGroupSheet's anatomy heading: free text with the known headings suggested by a native datalist." replaceWith="Base UI Autocomplete" note="RvgGroupSheet is not exported: rebuilt from its markup and the real ANATOMY_HEADINGS. The real one opens from Add group in the RvgGroupsView row.">
          <AnatomyDatalistExample />
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="motion">
        <CatalogueRow name="SuccessOverlay" source="shared/ui/SuccessOverlay.tsx" usedIn={AWM} what={`The full-surface success moment: the circle pops and the tick draws, then the flow moves on (Assign ${DRAFT_LIST}, Reassign).`} replaceWith="Custom on Motion (keep the choreography)" height={200}>
          <SuccessOverlayExample />
        </CatalogueRow>
        <CatalogueRow name="TickBadge" source="shared/ui/TickBadge.tsx" usedIn={AWM} what="The teal tick badge, optionally animated with the complete-tick draw." replaceWith="Custom on Motion">
          <TickBadgeExample />
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="custom">
        <CatalogueRow name="ProcedureStack" source="shared/booking/ProcedureStack.tsx" usedIn={AWM} what="One Procedure's procedure text, invoice description, Contract and RVG code on every Booking screen, Admin Review and the List drawer, in full or compact density; still-to-choose parts are neutral and dashed." replaceWith="Custom (a description list on library primitives)" note="Fixed example views; nothing writes to the demo data.">
          <ProcedureStackExample />
        </CatalogueRow>
        <CatalogueRow name="PayerDetailsView" source="shared/booking/PayerDetailsView.tsx" usedIn={AWM} what="The payer on the Booking (catch-up Phase 21): the name with Patient or the relationship, the email and the NZ Post postal address, and the warning-tint Email or postal address needed and Under 18 chips." replaceWith="Custom (text rows and the shared Pill)" note="Fixed example details; nothing writes to the demo data.">
          <PayerDetailsExample />
        </CatalogueRow>
        <CatalogueRow name="PayerFields (DifferentPayerTick, OtherPayerFields, PostalAddressFields)" source="shared/flows/PayerFields.tsx, PostalAddressFields.tsx" usedIn={AWM} what="The payer form's parts, in PayerSheet and the add forms: the Different payer tick, then the other payer's name, relationship chips, email, NZ Post postal address and phone." replaceWith="shadcn Checkbox card, ToggleGroup and Input" note="Local state only; nothing writes to the demo data.">
          <PayerFieldsExample />
        </CatalogueRow>
        <CatalogueRow name="FunderDetailsView" source="shared/booking/FunderDetailsView.tsx" usedIn={AWM} what="The Booking's insurer or funder and its approval number (catch-up Phase 21): None, the patient pays; an insurer with its number; an insurer with no number (the warning-tint chip); a funder with none. FunderSheet edits it with radio chips." replaceWith="Custom (text rows and the shared Pill)" note="Fixed example details; nothing writes to the demo data.">
          <FunderDetailsExample />
        </CatalogueRow>
        <CatalogueRow name="DayGrid" source="apps/admin/components/DayGrid.tsx" usedIn={A} what={`The daily scheduling canvas: one row per anaesthetist, blocks on a 07:00 to 18:00 ruler, conflict and attention overlays, the ${DRAFT_LIST} band and the filter footer. Cut down to 10 rows.`} replaceWith="Custom on primitives (grid roles, Tooltip, TanStack Virtual)" note="Blocks open the real SlotDrawer, and its actions write to the demo store." height={620}>
          <DayGridExample />
        </CatalogueRow>
        <CatalogueRow name="DraftListBand" source="apps/admin/components/DraftListBand.tsx" usedIn={A} what={`Today's ${DRAFT_LISTS} on the same ruler, above the anaesthetists; each opens its drawer.`} replaceWith="Custom (Tooltip on blocks)">
          <DraftListBandExample />
        </CatalogueRow>
        <CatalogueRow name="StatusBlock" source="shared/StatusBlock.tsx" usedIn={AWM} what="A session block filled by its status: solid, tint, hatched Unavailable or dashed Free." replaceWith="Custom (status cell rendering)">
          <StatusBlockExample />
        </CatalogueRow>
        <CatalogueRow name="Review summary tiles (ReviewScreen)" source="apps/admin/screens/ReviewScreen.tsx" usedIn={A} what="The review page's four summary tiles, then the bookings table with totals and flags, the action bar and the authorise confirm." replaceWith="Custom on shadcn Card + Table + AlertDialog" note="Tile is not exported: the row mounts the real ReviewScreen. Authorise writes to the demo store." height={560}>
          <ReviewScreenExample />
        </CatalogueRow>
        <CatalogueRow name="Billing pipeline stepper (PipelineCard)" source="apps/admin/screens/BillingMonitorScreen.tsx" usedIn={A} what="Each billed List's stages (authorised, run, invoices, emailed, Xero) as tinted chips joined by arrows." replaceWith="Custom on shadcn Badge + Tooltip" note="Not exported, and the real screen's AA fee link leaves the page: rebuilt from StageChip, fed by the real billingMonitor selector. Chips are buttons here so the detail can be shown.">
          <PipelineStepperExample />
        </CatalogueRow>
        <CatalogueRow name="InvoiceDocument" source="apps/admin/screens/InvoiceDocument.tsx" usedIn={A} what="The invoice as a print-styled document (patient or insurer layout, serif voice) with its info rail. Shown at half size." replaceWith="Custom (print-styled page)" note="Keep it out of a fixed Dialog for print isolation. Its rail actions write to the demo store." height={520}>
          <InvoiceDocumentExample />
        </CatalogueRow>
        <CatalogueRow name="AnaesthetistCandidates" source="apps/admin/components/pairing/AnaesthetistCandidates.tsx" usedIn={A} what="The ranked anaesthetist picker: a name search, a tier filter and tiered, shuffled-within-tier rows." replaceWith="Custom on Base UI Combobox / listbox" note="Ranking is a domain rule; adds listbox semantics and arrow keys." height={420}>
          <AnaesthetistCandidatesExample />
        </CatalogueRow>
        <CatalogueRow name="DraftListCandidates" source="apps/admin/components/pairing/DraftListCandidates.tsx" usedIn={A} what={`Who can take a ${DRAFT_LIST}: free colleagues first, not-preferred ones apart, occupied sessions linked to their List.`} replaceWith="Custom on Base UI Combobox / listbox" height={420}>
          <DraftListCandidatesExample />
        </CatalogueRow>
      </LibraryGroup>
    </CataloguePage>
  )
}
