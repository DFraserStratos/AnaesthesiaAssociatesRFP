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
  AttentionDotExample,
  DateFieldExample,
  DrawerPartsExample,
  FormErrorExample,
  InlineBannerExample,
  NoticeExample,
  MasterPanelExample,
  PopoverPanelExample,
  SidePanelExample,
  MasterPillsExample,
  MastersSubNavExample,
  MasterTableExample,
  NameSearchBoxExample,
  OverlayExample,
  OverlayHeaderExample,
  SheetActionsExample,
  ConfirmSheetExample,
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
  LineTabsExample,
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
import {
  CheckboxExample,
  DateJumpInputExample,
  FieldHintExample,
  FilterDateInputExample,
  SelectFieldExample,
  SwitchExample,
  TimeRangeFieldsExample,
} from './admin/fieldExamples'
import { BackstopAmountFieldExample, NoContractGroupExample, RailOptionGroupExample, StepRailExample } from './railPartsExamples'
import { ProcedureStackExample } from './procedureStackExample'
import { FunderDetailsExample, PayerFieldsExample } from './payerExamples'
import { PaidByRowExample, PaidBySheetExample, PartyPickerExample } from './splitExamples'

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
        <CatalogueRow name="Button" source="shared/ui/Button.tsx" usedIn={AWM} what="The one button (UI unification U5): primary, secondary, the teal outline the mockups draw, the tinted pill and the one red danger outline (Cancel booking only, question 8); the touch size (54, 48, 44: sheet footers keep the 54px primary, question 7), desktop (44, radius 12) and compact (36); one disabled treatment and a printed disabled reason; the teal focus ring and a desktop hover." replaceWith="shadcn Button (cva variants)" note="Replaced ActionBtn, PanelAction and the hand-rolled teal outlines. Press feedback stays in global.css.">
          <ButtonExample />
        </CatalogueRow>
        <CatalogueRow name="TickButton" source="shared/ui/TickButton.tsx" usedIn={AW} what="The office's 'dealt with' control: a teal outline button with a check, used by To-do Clear and notice Resolve." replaceWith="shadcn Button (outline variant + icon)">
          <TickButtonExample />
        </CatalogueRow>
        <CatalogueRow name="Segmented" source="shared/ui/Field.tsx" usedIn={AWM} what="A row of mutually exclusive options (status filters, List or Calendar, Yes or No). 22 uses in Admin." replaceWith="shadcn ToggleGroup (single)" note="Gives radio semantics and arrow keys.">
          <SegmentedExample />
        </CatalogueRow>
        <CatalogueRow name="SlidingSegmentedControl" source="shared/ui/SlidingSegmentedControl.tsx" usedIn={AWM} what="A segmented control whose selected pill slides between options, in teal and surface variants, md and sm (the 36px row order on Admin Day) sizes. The ink variant went with question 17 (UI unification U5)." replaceWith="shadcn ToggleGroup (single) or Tabs" note="Keep the sliding indicator with a Motion layoutId. Segments stay buttons with aria-pressed (question 3).">
          <SlidingSegmentedExample />
        </CatalogueRow>
        <CatalogueRow name="StatusLegend (chips)" source="shared/StatusLegend.tsx" usedIn={AWM} what="The List kinds and availability statuses from the status master. With a toggle handler each chip hides or shows that status on the grid." replaceWith="shadcn ToggleGroup (multiple)">
          <StatusLegendExample />
        </CatalogueRow>
        <CatalogueRow name="SignalFilterButton (DayGrid focus filters)" source="apps/admin/components/DayGrid.tsx" usedIn={A} what="The Day grid footer's aria-pressed pills (Needs attention, Conflict, Has note, Has warnings) that narrow and regroup the rows, with Reset filters." replaceWith="shadcn ToggleGroup (multiple) / Toggle" note="Not exported: the row mounts the real DayGrid with an empty roster, so only its live footer shows.">
          <FocusFiltersExample />
        </CatalogueRow>
        <CatalogueRow name="Dialog (useSurface().Overlay)" source="shared/surface/Dialog.tsx" usedIn={AWM} what="The web Overlay every Admin sheet opens in: a centred card over a scrim, closed by Escape, the corner X or a scrim click. It sits on the one modal stack with BottomSheet (useModalLayer): one Escape closes only the top layer, focus goes in, stays in and comes back, the page behind is inert, and the OverlayHeader title names the dialog. About 37 uses." replaceWith="shadcn Dialog" note="The library would add scroll lock and a portal; we keep no portal because the phone frame is scaled.">
          <OverlayExample />
        </CatalogueRow>
        <CatalogueRow name="OverlayHeader" source="shared/surface/OverlayHeader.tsx" usedIn={AWM} what="The one sheet title: an h2 at 18/700 with an optional 13px slate description. Its id names the enclosing dialog, and on web it brings the Dialog's corner X (Close); on the phone the handle is the close." replaceWith="shadcn DialogHeader + DialogTitle + DialogDescription" note="Every sheet uses it, so the title and the accessible name cannot drift apart.">
          <OverlayHeaderExample />
        </CatalogueRow>
        <CatalogueRow name="SheetActions" source="shared/surface/SheetActions.tsx" usedIn={AWM} what="The one sheet footer, laid out by the surface: stacked primary over secondary on the phone, one row on web with the secondary hugging its label first and the primary last, filling the rest. Footer buttons stay 54px." replaceWith="shadcn DialogFooter" note="Pass the buttons as they are, so labels, disabled state and handlers stay on them.">
          <SheetActionsExample />
        </CatalogueRow>
        <CatalogueRow name="ConfirmSheet" source="shared/surface/ConfirmSheet.tsx" usedIn={AWM} what="The one sheet confirm: the surface's Overlay with an OverlayHeader and SheetActions. Focus opens on the safe button, and a double click runs the primary once. The body between header and footer is the caller's." replaceWith="shadcn AlertDialog" note="Used by ClearConflictSheet and SubmitListSheet. Labels are the caller's.">
          <ConfirmSheetExample />
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
        <CatalogueRow name="DraftListDrawer" source="apps/admin/components/DraftListDrawer.tsx" usedIn={A} what={`The same drawer on SidePanel for a ${DRAFT_LIST} (no session yet): its details, bookings and Assign, Redate, Edit and Remove.`} replaceWith="shadcn Sheet (side)" note="Its actions are the shared Button (compact); a disabled one prints its reason (UI unification U5). Its actions write to the demo store.">
          <DraftListDrawerExample />
        </CatalogueRow>
        <CatalogueRow name="ClearConflictSheet" source="apps/admin/components/conflicts/ClearConflictSheet.tsx" usedIn={A} what="Confirms clearing a hospital-closure conflict on a List, with an optional note. A ConfirmSheet: focus opens on the safe button and a double click clears once." replaceWith="shadcn AlertDialog" note="Confirming clears the conflict in the demo store.">
          <ClearConflictExample />
        </CatalogueRow>
        <CatalogueRow name="HistorySheet" source="shared/booking/HistorySheet.tsx" usedIn={AWM} what="The audit history of a record in an Overlay, titled by an OverlayHeader, with expandable steps (HistoryTimeline)." replaceWith="shadcn Dialog + Accordion">
          <HistorySheetExample />
        </CatalogueRow>
        <CatalogueRow name="SideNav (with RolesInfo)" source="apps/admin/components/SideNav.tsx" usedIn={A} what="The dark Admin side nav: sections with crimson and amber count badges (the mockup badge, kept local), the wordmark, the Roles in this prototype dialog and the persona through the shared PersonaChip." replaceWith="shadcn Sidebar" note="A labelled navigation whose active item carries aria-current since UI unification U5; the items stay buttons (question 3). Crimson only on --sidebar-primary." height={600}>
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
        <CatalogueRow name="LineTabs" source="shared/ui/LineTabs.tsx" usedIn={AWM} what={`The underline tab strip (UI unification U5): LineTabLink for sibling routes (AA fees, ${DRAFT_LISTS}, the web Availability page switch), a labelled navigation with aria-current; LineTab for local panels (Phase 25's Contract History tab), buttons with aria-pressed; a badge after the label for a count.`} replaceWith="shadcn Tabs (as links)" note="Was AA fees' TabLink. Shown with LineTab so nothing leaves this page.">
          <LineTabsExample />
        </CatalogueRow>
        <CatalogueRow name="DayNav (with SortToggle)" source="apps/admin/components/DayNav.tsx" usedIn={A} what="The Day view toolbar: week and day steppers, Today, the shared DateJumpInput (36px, named Go to date, bounded by the horizon; UI unification U4), the Roster order or A to Z choice and Find available. Since UI unification U5 the step buttons are IconButtons named Previous day and Next day, the week steps and Today are the compact Button, and SortToggle is the small SlidingSegmentedControl (Row order)." replaceWith="shadcn Button Group + ToggleGroup + Date Picker" note="The date input takes only a full day inside the bounds. Every button takes the teal focus ring.">
          <DayNavExample />
        </CatalogueRow>
        <CatalogueRow name="StatusChip" source="shared/StatusChip.tsx" usedIn={AWM} what="A small tinted chip for a List kind or availability status, coloured from the status master." replaceWith="shadcn Badge (6 status variants)">
          <StatusChipExample />
        </CatalogueRow>
        <CatalogueRow name="Pill" source="shared/ui/Pill.tsx" usedIn={AWM} what="The one label pill (UI unification U3): neutral, success, warning and error tones; sm, md (inline) and lg (table, the Admin Review size); a tint or a full-alpha outline; a leading icon or dot. Never teal or crimson, so no pill reads as a button." replaceWith="shadcn Badge">
          <PillExample />
        </CatalogueRow>
        <CatalogueRow name="MasterPills" source="apps/admin/components/MasterPills.tsx" usedIn={A} what="Admin's import path for Pill, used for Party kinds, Contract tags, Active and RVG anatomy headings." replaceWith="shadcn Badge" note="A re-export only: delete it in the migration.">
          <MasterPillsExample />
        </CatalogueRow>
        <CatalogueRow name="TierPill / PreferredPill / NotPreferredPill" source="apps/admin/components/pairing/Pills.tsx" usedIn={A} what="The office-only pairing pills over the shared Pill: priority tier, preferred pairing (success tint, question 15) and not preferred (warning outline)." replaceWith="shadcn Badge">
          <PairingPillsExample />
        </CatalogueRow>
        <CatalogueRow name="ChangedSinceSubmittedPill" source="apps/admin/components/ChangedSinceSubmitted.tsx" usedIn={A} what="Flags a submitted List the anaesthetist has changed since submitting, with the count and time of the last change." replaceWith="shadcn Badge + Tooltip" note="Driven by a local cue here: the seed has no changed submitted List.">
          <ChangedSinceSubmittedExample />
        </CatalogueRow>
        <CatalogueRow name="DraftListParts" source="apps/admin/components/draftLists/DraftListParts.tsx" usedIn={A} what={`${DRAFT_LIST} badges: ${UNASSIGNED}, the DRAFT state chip, the waiting time (amber past a day) and the booking count.`} replaceWith="shadcn Badge">
          <DraftListPartsLive />
        </CatalogueRow>
        <CatalogueRow name="AttentionDot" source="shared/warnings/AttentionDot.tsx" usedIn={AWM} what="The solid attention disc (UI unification U3, from ConflictDot): a 13px '!' for a conflict or a List that needs the office, a triangle for warnings, muted once cleared. A marker, never a control: aria-hidden unless labelled. WarningTriangle and the Day grid and calendar marks draw it." replaceWith="shadcn Badge (dot) + Tooltip">
          <AttentionDotExample />
        </CatalogueRow>
        <CatalogueRow name="WarningTriangle" source="shared/warnings/WarningTriangle.tsx" usedIn={AWM} what="The warning mark on a booking, coloured by the strongest open warning." replaceWith="shadcn Tooltip + Badge" note="Its detail is reachable by keyboard once it is a Tooltip.">
          <WarningTriangleExample />
        </CatalogueRow>
        <CatalogueRow name="NameSearchBox" source="shared/ui/NameSearchBox.tsx" usedIn={AWM} what="The one search box in all three apps since UI unification U4: field (48px) and pill (36px, or 38px on the web Lists row) sizes; fill well (grey) inside a sheet, card or drawer and surface (white, the default) on the page; a clear button (clearLabel, a 44px touch target on the phone), Escape clears, testId and shot hooks. Each caller filters its own rows." replaceWith="shadcn Input Group (search)" note="WebSearchField and the mobile Lists input are gone: both Lists pages use it. The aa-field class gives it the one teal focus ring.">
          <NameSearchBoxExample />
        </CatalogueRow>
        <CatalogueRow name="ContractSelect (SelectField)" source="shared/contracts/ContractSelect.tsx" usedIn={A} what="A native select of every active Contract grouped by holder, on the shared SelectField (UI unification U4): 48px, grey well, its label above it." replaceWith="shadcn Select (or NativeSelect)" note="Its old selectStyle prop is accepted and ignored. A select without a visible label takes SelectField's hideLabel, which names it.">
          <ContractSelectExample />
        </CatalogueRow>
        <CatalogueRow name="SurgeonPicker" source="apps/admin/components/pairing/SurgeonPicker.tsx" usedIn={A} what="A native select of surgeons with a 'Not preferred with Dr X' optgroup for the chosen anaesthetist, on the shared SelectField (UI unification U4): a label (or hideLabel), size, fill and width." replaceWith="Base UI Combobox (with groups)" note="Stays a native select (the catch-up 17 ruling). The list is long and not searchable. Opens on an anaesthetist with a not-preferred surgeon, so the second optgroup shows.">
          <SurgeonPickerExample />
        </CatalogueRow>
        <CatalogueRow name="NotPreferredWarning" source="apps/admin/components/pairing/NotPreferredWarning.tsx" usedIn={A} what="An amber callout when the chosen surgeon is not preferred with the anaesthetist, on the shared Notice; it warns, never blocks." replaceWith="shadcn Alert" note="Fed by the real useNotPreferredWarning hook for a seeded not-preferred pairing.">
          <NotPreferredWarningExample />
        </CatalogueRow>
        <CatalogueRow name="ChipMultiSelect" source="apps/admin/components/ChipMultiSelect.tsx" usedIn={A} what="A native 'Add a...' select plus removable chips: a Contract's specialties and, since UI unification U4, its linked surgeons (the editor's private SurgeonPicker is gone). The select draws the one field chrome and its hint is the shared FieldHint." replaceWith="Base UI Combobox (multiple, chips)" note="Searchable, with Backspace to remove.">
          <ChipMultiSelectExample />
        </CatalogueRow>
        <CatalogueRow name="CodePickerSheet" source="shared/capture/CodePickerSheet.tsx" usedIn={AWM} what="The RVG code type-ahead in an Overlay titled by an OverlayHeader: search by code or description, every match rendered. Its search is the shared NameSearchBox in the well fill (UI unification U4)." replaceWith="Base UI Combobox + TanStack Virtual" note="The library would add combobox and listbox roles and arrow and Enter selection.">
          <CodePickerExample />
        </CatalogueRow>
        <CatalogueRow name="Notice" source="shared/ui/Notice.tsx" usedIn={AWM} what="The one notice (UI unification U3): the ConflictCallout shell in warning, error and success, and the neutral note. A role only where the note announces; the icon is aria-hidden." replaceWith="shadcn Alert">
          <NoticeExample />
        </CatalogueRow>
        <CatalogueRow name="ConflictCallout" source="apps/admin/components/conflicts/ConflictCallout.tsx" usedIn={A} what="Warns, before saving, that the hospital is closed that day and the List will be flagged (the shared Notice, warning tone)." replaceWith="shadcn Alert">
          <ConflictCalloutExample />
        </CatalogueRow>
        <CatalogueRow name="WarningsToDo" source="apps/admin/components/WarningsToDo.tsx" usedIn={A} what="The rail's To-do card: every open warning, soonest first, each with Open and Clear, and a show-more toggle. Its count is the shared CountBadge (read as 3 to do)." replaceWith="shadcn Card + Collapsible" note="Clear writes a clearance to the demo store.">
          <WarningsToDoExample />
        </CatalogueRow>
        <CatalogueRow name="NotificationsCard" source="apps/admin/components/NotificationsCard.tsx" usedIn={A} what="The rail's shared notification pool: active notices with Resolve, See all and Show resolved. Its count is the shared CountBadge (read as 2 active), still showing 0." replaceWith="shadcn Card + Button" note="Resolve writes to the demo store. The fresh seed has no notices, so it shows its empty state.">
          <NotificationsCardExample />
        </CatalogueRow>
        <CatalogueRow name="VacatedSessionChoice / StatusRadioGroup" source="shared/flows/VacatedSessionChoice.tsx" usedIn={AWM} what="A radio group of status chips: what the vacated session becomes after a move. Its keyboard is the shared useRovingRadio (UI unification U4): one Tab stop, arrows move and select, Home and End jump to the ends." replaceWith="shadcn RadioGroup" note="The same hook drives the Contract rail's answers (RailOptionGroup), where a move only focuses.">
          <VacatedChoiceExample />
        </CatalogueRow>
        <CatalogueRow name="RailOptionGroup" source="shared/contracts/railParts.tsx" usedIn={AWM} what="One step of the Contract chooser as a named radio group (UI unification U4): list rows with a count (the step rail sheet) or tiles with None for this List (the Billing card), a Suggested pill on the funder's path, unselectable answers dimmed. Arrow keys move focus only; Space, Enter or a click picks, because a pick saves and moves on." replaceWith="shadcn RadioGroup (card items)" note="Static options here; Phase 23 builds Make primary on it. Nothing writes to the demo data.">
          <RailOptionGroupExample />
        </CatalogueRow>
        <CatalogueRow name="Switch" source="shared/ui/Switch.tsx" usedIn={AWM} what="The one on/off switch (UI unification U4): a button with role=switch and aria-checked, so click and Space toggle it; sm is the 36 by 20 track, lg the 52 by 32 touch track, with a label and an optional description." replaceWith="shadcn Switch" note="No product screen uses it yet: Phase 27 builds its approval-step toggle on it. The PWA panel's ToggleRow stays its own (a demo surface).">
          <SwitchExample />
        </CatalogueRow>
        <CatalogueRow name="ProfileChrome" source="apps/admin/components/ProfileChrome.tsx" usedIn={A} what="The surgeon and anaesthetist record pages' header, id chip, cards, fact rows and History and Edit actions." replaceWith="shadcn Card (+ Breadcrumb for BackLink)" note="Its back link is the shared BackLink since UI unification U5 (teal, a real link), left out here because it would leave this page.">
          <ProfileChromeExample />
        </CatalogueRow>
        <CatalogueRow name="drawerParts (Section, Row, DrawerLink)" source="apps/admin/components/drawerParts.tsx" usedIn={A} what="The drawers' section headings, label and value rows and inline links, shared by SlotDrawer and DraftListDrawer (one copy since U2); their action buttons are the shared Button at the compact size, a disabled one printing its reason (U5)." replaceWith="shadcn Button + DropdownMenu" note="ActionBtn folded into Button in UI unification U5.">
          <DrawerPartsExample />
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="sonner">
        <CatalogueRow name="Inline success banner (role=status)" source="apps/admin/screens/ConflictsScreen.tsx" usedIn={A} what={`The shared ResultLine (UI unification U3): a success-green confirmation with Dismiss after an action (Conflicts, ${DRAFT_LISTS}, Recurring apply, AA fees), its role=status region always mounted. The masters lines stay teal until Phase 42.`} replaceWith="Sonner toast (with action and undo)" note="Inline JSX in each screen, not a component: rebuilt here from the Conflicts screen. Errors stay inline.">
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
        <CatalogueRow name="AuditViewer" source="apps/admin/screens/AuditViewer.tsx" usedIn={A} what="The global audit feed with a filter bar, capped at 500 rows. Since UI unification U4 the bar is shared parts: two SelectFields (compact, surface fill) and a FilterDateInput From and To." replaceWith="TanStack Table + TanStack Virtual" note="Virtualisation or pagination replaces the 500-row cap; the date pair becomes a range picker." height={460}>
          <Wide minWidth={980}>
            <AuditViewer />
          </Wide>
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="forms">
        <CatalogueRow name="TextField" source="shared/ui/Field.tsx" usedIn={AWM} what="The one labelled single-line input, about 77 uses in Admin: text, date, time, number, email or phone; mono; a FieldHint tied by aria-describedby; and since UI unification U4 invalid (aria-invalid and the error border), inputMode and align for amounts, min, max, step, list, size (48px field or 36px compact), fill (well or surface) and hideLabel." replaceWith="shadcn Field + Input (React Hook Form)" note="Every default keeps the old look (48px, grey well). The library would bind errors to the field.">
          <TextFieldExample />
        </CatalogueRow>
        <CatalogueRow name="TextArea" source="shared/ui/Field.tsx" usedIn={AWM} what="The one multi-line input: a visible label or ariaLabel, a hint, and since UI unification U4 a counter (maxLength, cap, countTrimmed), compact density (the rail's day note), fill and resize. The rail's day note, the modifier reason and the Alert the office note moved onto it." replaceWith="shadcn Field + Textarea">
          <TextAreaExample />
        </CatalogueRow>
        <CatalogueRow name="FieldLabel / FormError" source="shared/ui/Field.tsx" usedIn={AWM} what="The field label, and FormError: the role=alert refusal box under a form, or its inline line beside a compact row control (UI unification U3: the one error box)." replaceWith="shadcn Label + FieldError (Zod schema)" note="Ties each error to its field instead of one line per form.">
          <FormErrorExample />
        </CatalogueRow>
        <CatalogueRow name="FieldHint" source="shared/ui/Field.tsx" usedIn={AWM} what="The one quiet line under a field (UI unification U4): 12px mist, or error-coloured, tied to the field by id and aria-describedby. TextField, TextArea, SelectField, Checkbox and TimeRangeFields draw it from their hint prop; it also stands alone under any control." replaceWith="shadcn FieldDescription">
          <FieldHintExample />
        </CatalogueRow>
        <CatalogueRow name="SelectField" source="shared/ui/Field.tsx" usedIn={AWM} what="The one labelled native select (UI unification U4): TextField's chrome and focus ring, size field (48px, in sheets) or compact (36px, toolbars), fill well (grey, inside white containers) or surface (white, on the page), hideLabel, width, a hint, shot on the select." replaceWith="shadcn Select (or NativeSelect)" note="Stays native: the capture recipes selectOption it, and native selects were kept by ruling.">
          <SelectFieldExample />
        </CatalogueRow>
        <CatalogueRow name="Checkbox" source="shared/ui/Checkbox.tsx" usedIn={AWM} what="The one checkbox (UI unification U4): a native box in the action teal, never the browser blue, inside its label, so a click on the words toggles it and Space works. md 16px or lg 20px (a mobile card), with an optional hint." replaceWith="shadcn Checkbox" note="Replaced the hand copies: the rail's day flag, the status sheet's flags, surgeon groups, an RVG group's range, the payer tick and the Paid by offer, the colleague move sheet, Conflicts and Notifications.">
          <CheckboxExample />
        </CatalogueRow>
        <CatalogueRow name="BackstopAmountField" source="shared/contracts/railParts.tsx" usedIn={AWM} what="The typed amount on No contract · Fixed price (UI unification U4): TextField's chrome at the rail's 44px, mono, a decimal keypad, aria-invalid with the hint saying why, saved on blur or Enter, with an optional inline action beside it." replaceWith="Base UI NumberField + shadcn Field" note="Local state here; in the Billing card and the step rail sheet it writes the price.">
          <BackstopAmountFieldExample />
        </CatalogueRow>
        <CatalogueRow name="ContractPanel (ContractEditSheet)" source="apps/admin/flows/ContractEditSheet.tsx" usedIn={A} what="The Contract editor in a MasterPanel: two-column fields, SelectFields (holder, linked anaesthetist, funding tag, pricing kind), segmented choices, Disable as a neutral secondary Button (question 8), ChipMultiSelect for specialties and linked surgeons, FieldHint lines, the RVG code picker and price ranges. All shared field parts since UI unification U4." replaceWith="shadcn Sheet + Field + React Hook Form + Zod" note="Save writes the Contract to the demo store.">
          <ContractPanelExample />
        </CatalogueRow>
        <CatalogueRow name="SlotStatusSheet" source="apps/admin/flows/SlotStatusSheet.tsx" usedIn={A} what="Adds or edits an availability status in an Overlay: an OverlayHeader title, name, colour swatches, flags (the shared Checkbox with a hint, UI unification U4) and a live preview validated as you type, and a SheetActions footer." replaceWith="shadcn Dialog + Field + ToggleGroup (swatches) + RHF/Zod" note="Save adds the status to the demo store.">
          <SlotStatusSheetExample />
        </CatalogueRow>
        <CatalogueRow name="ContractPriceRanges" source="apps/admin/flows/ContractPriceRanges.tsx" usedIn={A} what="A fixed-price Contract's dated prices as an inline-edit table: Enter saves, Escape cancels, the last row cannot be deleted. Its in-table inputs are the shared TextField at the compact size (UI unification U4): hidden labels, mono, the price right-aligned on a decimal keypad." replaceWith="Base UI NumberField + TanStack Table (cell edit)" note="Keep Enter-commits and Escape-cancels. Saving writes to the demo store.">
          <ContractPriceRangesExample />
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="daypicker">
        <CatalogueRow name="MiniCalendar (RightRail)" source="apps/admin/components/RightRail.tsx" usedIn={A} what="The rail's month calendar with roving focus, arrows, Home and End, Page Up and Down, and today in crimson. Its keys are the shared useCalendarKeys (UI unification U4, unbounded so paging past the horizon still lands on Admin Day); its day note is the compact TextArea with a Checkbox flag." replaceWith="shadcn Calendar (react-day-picker)" note="Not exported: the row mounts the real RightRail (calendar on top; To-do, notes and Awaiting review below). Keep its key bindings and its own crimson focus ring. Notes stay local." height={420}>
          <RightRailExample />
        </CatalogueRow>
        <CatalogueRow name="HospitalCalendar" source="apps/admin/screens/masters/HospitalsView.tsx" usedIn={A} what="One hospital's month of closures and Lists: a closure opens it to change or delete, an open day adds one." replaceWith="shadcn Calendar (custom day content)" note="Not exported: the row mounts the real HospitalsView; choose Calendar. Saving a holiday writes to the demo store." height={520}>
          <Wide minWidth={900}>
            <HospitalsView actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="Native date input (TextField type=date)" source="shared/ui/Field.tsx" usedIn={AWM} what="The browser's own date input inside a sheet, about a dozen times in Admin (holidays, a new or redated List's day, recurring bookings, a Contract's first price), with min and max bounds where a day must fall inside the horizon. Toolbars use DateJumpInput and filter bars FilterDateInput." replaceWith="shadcn Date Picker (Popover + Calendar)" note="Pass the demo clock's today and the horizon as bounds.">
          <DateFieldExample />
        </CatalogueRow>
        <CatalogueRow name="DateJumpInput" source="shared/ui/DateFields.tsx" usedIn={AW} what="The toolbar control that sends a screen to a chosen day (UI unification U4): Admin Day's 36px input named Go to date and the web Lists page's 38px one with its label beside it. Only a full day inside min and max is taken (no partial years while typing); clearing it hands up null." replaceWith="shadcn Date Picker (Popover + Calendar)" note="Stays one native input, as the Playwright specs read date inputs by position. The phone keeps its Go to a date sheet.">
          <DateJumpInputExample />
        </CatalogueRow>
        <CatalogueRow name="FilterDateInput" source="shared/ui/DateFields.tsx" usedIn={AW} what="The filter-bar date (UI unification U4): compact and white on the page, its label above (the Admin filter bars, as AuditViewer's From and To) or inline (the web Lists row's To, 38px)." replaceWith="shadcn Date Picker (range)" note="Phase 37's From and To build on it.">
          <FilterDateInputExample />
        </CatalogueRow>
        <CatalogueRow name="SessionTimesFields" source="apps/admin/flows/SessionTimesFields.tsx" usedIn={A} what="A session's start and end with a default or own-times hint and Use default. Since UI unification U4 it renders the shared TimeRangeFields (48px, the one focus ring); its controlStyle prop is gone." replaceWith="React Aria TimeField (or keep native)" note="Neither Base UI nor react-day-picker has a time picker.">
          <SessionTimesExample />
        </CatalogueRow>
        <CatalogueRow name="TimeRangeFields" source="shared/ui/DateFields.tsx" usedIn={AWM} what="A start and an end time side by side (UI unification U4, from SessionTimesFields): two labelled native time inputs, optional labels, one hint line read with both, size and fill. Used by SessionTimesFields, the recurring booking sheet and the schedule settings." replaceWith="React Aria TimeField (or keep native)" note="Phase 39b brings it to the anaesthetist apps.">
          <TimeRangeFieldsExample />
        </CatalogueRow>
        <CatalogueRow name="RVG anatomy datalist" source="apps/admin/screens/masters/RvgGroupsView.tsx" usedIn={A} what="RvgGroupSheet's anatomy heading: free text with the known headings suggested by a native datalist, through TextField's list prop since UI unification U4." replaceWith="Base UI Autocomplete" note="RvgGroupSheet is not exported: rebuilt from its markup and the real ANATOMY_HEADINGS. The real one opens from Add group in the RvgGroupsView row, whose anatomy filter is a compact SelectField.">
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
        <CatalogueRow name="PayerFields (DifferentPayerTick, OtherPayerFields, PostalAddressFields)" source="shared/flows/PayerFields.tsx, PostalAddressFields.tsx" usedIn={AWM} what="The payer form's parts, in PaidBySheet's Who pays and the add forms: the Different payer tick (the shared Checkbox at lg, in its card, since UI unification U4), then the other payer's name, relationship chips, email, NZ Post postal address and phone, all on the shared TextField." replaceWith="shadcn Checkbox card, ToggleGroup and Input" note="Local state only; nothing writes to the demo data.">
          <PayerFieldsExample />
        </CatalogueRow>
        <CatalogueRow name="FunderDetailsView" source="shared/booking/FunderDetailsView.tsx" usedIn={AWM} what="The Booking's insurer or funder and its approval number (catch-up Phase 21): None; an insurer with its number; an insurer with no number (the warning-tint chip); a funder with none. FunderSheet edits it with radio chips." replaceWith="Custom (text rows and the shared Pill)" note="Fixed example details; nothing writes to the demo data.">
          <FunderDetailsExample />
        </CatalogueRow>
        <CatalogueRow name="PartyPicker" source="shared/booking/PartyPicker.tsx" usedIn={AWM} what="Choose who an invoice goes to (catch-up Phases 22 and 22a): the Procedure's payer and the Contract's party first, then every Party, searchable by name, and with onAnotherPerson a last row, Another person, for someone who is no Party. The split's party field in PaidBySheet; Phases 38b, 39 and 39b reuse it." replaceWith="shadcn Combobox (Popover and Command)" note="Fixed options on local state; nothing writes to the demo data.">
          <PartyPickerExample />
        </CatalogueRow>
        <CatalogueRow name="StepRail / StepMarker" source="shared/contracts/railParts.tsx" usedIn={AWM} what="The Contract chooser's numbered steps as a nav list (UI unification U4): vertical (the desktop column, a connector line between 24px markers) or compact (three across, the phone's sheet); a tick once answered, the answer under its label, Only option where a step filled itself in, aria-current=step on the current one, and an answered step clickable to go back." replaceWith="Custom (a stepper on library primitives)" note="Static steps here. Phase 23 builds Make primary on it.">
          <StepRailExample />
        </CatalogueRow>
        <CatalogueRow name="NoContractGroup / ContractGroupHeading" source="shared/contracts/railParts.tsx" usedIn={AWM} what="The No contract heading with the destination's two backstops under it, No contract · RVG then No contract · Fixed price, at the top of every Contract list (UI unification U4). Each list draws its own rows: the sheet's radio rows, the Billing card's combo options." replaceWith="Custom (a group heading in a Combobox or RadioGroup)" note="The backstops are read from the seed; the rows here are a local rebuild of the sheet's and nothing writes to the demo data.">
          <NoContractGroupExample />
        </CatalogueRow>
        <CatalogueRow name="PaidByRow" source="shared/booking/PaidByRow.tsx" usedIn={AWM} what="Paid by in the Billing card (catch-up Phases 22 and 22a; US-08.2.3, US-11.2.2): the Procedure's payer with Patient or the relationship and the warning-tint Email or postal address needed and Under 18 pills where its Contract bills the payer; the holder where the Contract bills its holder; a split's parties, in the warning tint when it no longer fits; Payer: not billed yet with no Contract. On web and Admin a line at the card's foot, on the phone the Billing summary's last row: Change beside the payer's name opens PaidBySheet with who pays and the offer; Split on the right opens it with the split alone." replaceWith="Custom (text rows and the shared Pill)" note="Read-only examples over fixed views; the sheet opens on a real Booking.">
          <PaidByRowExample variant="line" />
        </CatalogueRow>
        <CatalogueRow name="PaidBySheet (with SplitFeeSection)" source="shared/flows/PaidBySheet.tsx, shared/flows/SplitFeeSection.tsx" usedIn={AWM} what="The one Paid by sheet (catch-up Phase 22a; US-11.2.2, US-08.2.3): a bottom sheet on the phone, a dialog on web and Admin. Opened by Change, it holds who pays (the Different payer tick, the patient's details or the other payer's fields, the Under 18 hint and the contact ask) and, when the payer changes, the offer (the Booking's other Procedures with the same payer, each ticked, and the one neutral Provisional, OQ-140 pill). Opened by Split, it holds the split alone (a party or Another person, a $ or % share and Takes the rest per row, each amount live). Save writes it or refuses it whole." replaceWith="Custom (shadcn Sheet, Checkbox and Input inside)" note="Opens on Grace Park's first seeded Procedure; Save writes to the demo store.">
          <PaidBySheetExample />
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
        <CatalogueRow name="Review summary tiles (ReviewScreen)" source="apps/admin/screens/ReviewScreen.tsx" usedIn={A} what="The review page's four summary tiles, then the bookings table: each Procedure's stack with its own flags and Approve or Correct on a Contract change (catch-up Phase 21a), the payer and insurer, alerts, warnings with Clear, totals and flags on the shared Pill, the action bar (Approve all Contract changes, Authorise) and the authorise confirm." replaceWith="Custom on shadcn Card + Table + AlertDialog" note="Tile is not exported: the row mounts the real ReviewScreen. Authorise writes to the demo store." height={560}>
          <ReviewScreenExample />
        </CatalogueRow>
        <CatalogueRow name="Billing pipeline stepper (PipelineCard)" source="apps/admin/screens/BillingMonitorScreen.tsx" usedIn={A} what="Each billed List's stages (authorised, run, invoices, emailed, Xero) as tinted chips joined by arrows." replaceWith="Custom on shadcn Badge + Tooltip" note="Not exported, and the real screen's AA fee link leaves the page: rebuilt from StageChip, fed by the real billingMonitor selector. Chips are buttons here so the detail can be shown.">
          <PipelineStepperExample />
        </CatalogueRow>
        <CatalogueRow name="InvoiceDocument" source="apps/admin/screens/InvoiceDocument.tsx" usedIn={A} what="The invoice as a print-styled document (serif voice): the anaesthetist as supplier with their GST number, AA's agent block with the Provisional (OQ-29) pill, the holder's or the patient's layout (the BTM breakdown, cross-match strip and Your reference on the holder's), a split share's note, GST at the foot, and its rail: the Delivery card (Emailed, To post or No invoice address, with Resend or Send), Related invoices and the Xero handoff. Shown at half size." replaceWith="Custom (print-styled page)" note="Keep it out of a fixed Dialog for print isolation. Its rail actions write to the demo store." height={520}>
          <InvoiceDocumentExample />
        </CatalogueRow>
        <CatalogueRow name="AnaesthetistCandidates" source="apps/admin/components/pairing/AnaesthetistCandidates.tsx" usedIn={A} what="The ranked anaesthetist picker: a name search (the shared NameSearchBox in the well fill inside its sheet, UI unification U4), a tier filter and tiered, shuffled-within-tier rows." replaceWith="Custom on Base UI Combobox / listbox" note="Ranking is a domain rule; adds listbox semantics and arrow keys." height={420}>
          <AnaesthetistCandidatesExample />
        </CatalogueRow>
        <CatalogueRow name="DraftListCandidates" source="apps/admin/components/pairing/DraftListCandidates.tsx" usedIn={A} what={`Who can take a ${DRAFT_LIST}: a name search (the shared NameSearchBox in the well fill, UI unification U4), free colleagues first, not-preferred ones apart, occupied sessions linked to their List.`} replaceWith="Custom on Base UI Combobox / listbox" height={420}>
          <DraftListCandidatesExample />
        </CatalogueRow>
      </LibraryGroup>
    </CataloguePage>
  )
}
