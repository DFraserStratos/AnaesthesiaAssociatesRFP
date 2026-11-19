import { OFFICE_ACTOR } from '../../../store'
import { StubSetExample } from './stubExamples'
import { DRAFT_LIST, DRAFT_LISTS, UNASSIGNED } from '../../../shared/scheduleTerms'
import { CataloguePage, CatalogueRow, LibraryGroup, StageHint } from './CatalogueKit'
import { CardExample, DefRowExample, EyebrowExample, PageHeaderExample, TableKitExample } from './admin/pageChromeExamples'
import { ReviewQueue } from '../../admin/screens/ReviewQueue'
import { AuditViewer } from '../../admin/screens/AuditViewer'
import { RowField } from '../../admin/components/RowField'
import { PdfListsTab } from '../../admin/intake/PdfListsTab'
import { ListOriginRow } from '../../admin/components/ListOriginRow'
import { SEED_ORIGIN_LISTS } from '../../../domain/seed/listOrigins'
import { DiffTable } from '../../admin/matching/DiffTable'
import { DecisionCards, type DecisionKind } from '../../admin/matching/DecisionCards'
import type { IncomingFieldKey } from '../../../domain/types'
import type { FieldDiff } from '../../../domain/intake'
import { DefList, OptionRow, Pill, RadioCard, useRovingRadio } from '../../../shared/ui'
import { useMemo, useState } from 'react'
import { HospitalsView } from '../../admin/screens/masters/HospitalsView'
import { RvgGroupsView } from '../../admin/screens/masters/RvgGroupsView'
import { EmailTemplatesView } from '../../admin/screens/masters/EmailTemplatesView'
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
  MasterHeaderExample,
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
  AnaesthetistFieldsExample,
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
  ContactFieldsExample,
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
  PricingSheetExample,
  InvoiceDocumentExample,
  NotificationsCardExample,
  UpdateEmailComposerExample,
  BookingUpdateEmailButtonExample,
  NotPreferredWarningExample,
  PipelineStepperExample,
  ReviewScreenExample,
  RightRailExample,
  SideNavExample,
  SlotDrawerExample,
  SlotStatusSheetExample,
  SurgeonPickerExample,
  WarningsToDoExample,
  PrepaymentsRailCardExample,
  PrepaymentApprovalStripExample,
  HoldingAccountPanelExample,
  ReconciliationCardExample,
  XeroPanelsExample,
} from './admin/storeExamples'
import { BookingAsAtPanelExample, BookingSaveBarExample, LeaveWithoutSavingDialogExample, OfficeSavedNoticeExample } from './admin/draftExamples'
import {
  LoadResultBannerExample,
  LoadResultPanelExample,
  PublicHolidaySheetExample,
  RetireSectionExample,
  RvgTimeRuleSheetExample,
  ShowRetiredToggleExample,
} from './admin/mastersExamples'
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
import {
  AdditionalInvoiceButtonExample,
  AdditionalInvoiceSheetExample,
  CreditNoteButtonExample,
  CreditNoteDocumentExample,
  CreditSheetExample,
  EventReviewSheetExample,
  OptionChipExample,
  ProcedureEventsListExample,
} from './eventExamples'
import { LockBadge } from '../../../shared/booking/LockBadge'
import { SEED_MARKERS } from '../../../domain/seed'
import { ContractHistory } from '../../admin/flows/ContractHistory'
import { stillOnContract, useAppStore, useToday } from '../../../store'
import { ContractChangeNotice } from '../../admin/flows/ContractChangeNotice'
import { NOTHING_MOVES, stillOnTitle } from '../../../domain/billing/contractChanges'
import { shortDay } from '../../../domain/dateText'

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
        <CatalogueRow name="Button" source="shared/ui/Button.tsx" usedIn={AWM} what="The one button (UI unification U5): primary, secondary, the teal outline the mockups draw, the tinted pill and the one red danger outline (Cancel booking only, question 8); the touch size (54, 48, 44: sheet footers keep the 54px primary, question 7), desktop (44, radius 12) and compact (36); one disabled treatment and a printed disabled reason; the teal focus ring and a desktop hover. Catch-up Phase 35 adds href: a link styled as the button (the update email's mailto:), the same disabled button while disabled." replaceWith="shadcn Button (cva variants)" note="Replaced ActionBtn, PanelAction and the hand-rolled teal outlines. Press feedback stays in global.css.">
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
        <CatalogueRow name="ConfirmSheet" source="shared/surface/ConfirmSheet.tsx" usedIn={AWM} what="The one sheet confirm: the surface's Overlay with an OverlayHeader and SheetActions. Focus opens on the safe button, and a double click runs the primary once. The body between header and footer is the caller's. Catch-up Phase 35 adds onCancel (the secondary's own action) and initialFocus: confirm opens on the primary where the primary is the safe choice (Leave without saving: Keep editing)." replaceWith="shadcn AlertDialog" note="Used by ClearConflictSheet, SubmitListSheet, RemoveProcedureSheet, MakePrimarySheet (catch-up Phase 23) and LeaveWithoutSavingDialog. Labels are the caller's.">
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
        <CatalogueRow name="SlotDrawer" source="apps/admin/components/SlotDrawer.tsx" usedIn={A} what="The 440px session drawer on SidePanel: an empty session's actions, or a List's details, bookings and actions with nested sheets. A named dialog with Escape, focus in and back." replaceWith="shadcn Sheet (side)" note="Its rows are the shared DefRow in a DefList (a dl, labels at 80; UI unification U6), its section labels the shared Eyebrow. Its actions (assign, edit, reassign, status) write to the demo store, and its nested sheets open over it.">
          <SlotDrawerExample />
          <StageHint>Opens over the page from the right.</StageHint>
        </CatalogueRow>
        <CatalogueRow name="DraftListDrawer" source="apps/admin/components/DraftListDrawer.tsx" usedIn={A} what={`The same drawer on SidePanel for a ${DRAFT_LIST} (no session yet): its details, bookings and Assign, Redate, Edit and Remove.`} replaceWith="shadcn Sheet (side)" note="Its actions are the shared Button (compact); a disabled one prints its reason (UI unification U5). Its actions write to the demo store. Its rows are the shared DefRow in a DefList and its section labels the Eyebrow (UI unification U6).">
          <DraftListDrawerExample />
        </CatalogueRow>
        <CatalogueRow name="ClearConflictSheet" source="apps/admin/components/conflicts/ClearConflictSheet.tsx" usedIn={A} what="Confirms clearing a hospital-closure conflict on a List, with an optional note. A ConfirmSheet: focus opens on the safe button and a double click clears once." replaceWith="shadcn AlertDialog" note="Confirming clears the conflict in the demo store.">
          <ClearConflictExample />
        </CatalogueRow>
        <CatalogueRow name="PricingSheet" source="shared/flows/PricingSheet.tsx" usedIn={A} what="Change price (catch-up Phase 24): one Price $ field beside the computed price, Save price and Use the computed price, no reason; read-only with the sentence on a raised prepaid price. Replaced PriceOverrideSheet's fixed fee, $ and % modes with their reason." replaceWith="shadcn Dialog + Base UI NumberField" note="Saving writes the typed price to the demo data.">
          <PricingSheetExample />
        </CatalogueRow>
        <CatalogueRow name="HistorySheet" source="shared/booking/HistorySheet.tsx" usedIn={AWM} what="The audit history of a record in an Overlay, titled by an OverlayHeader, with expandable steps (HistoryTimeline)." replaceWith="shadcn Dialog + Accordion">
          <HistorySheetExample />
        </CatalogueRow>
        <CatalogueRow name="SideNav (with RolesInfo)" source="apps/admin/components/SideNav.tsx" usedIn={A} what="The dark Admin side nav: sections with crimson and amber count badges (the mockup badge, kept local), the wordmark, the Roles in this prototype dialog and the persona through the shared PersonaChip." replaceWith="shadcn Sidebar" note="A labelled navigation whose active item carries aria-current since UI unification U5; the items stay buttons (question 3). Crimson only on --sidebar-primary." height={600}>
          <SideNavExample />
        </CatalogueRow>
        <CatalogueRow name="Master data sub-nav" source="apps/admin/screens/masters/MasterData.tsx" usedIn={A} what="The vertical list of the master views in five groups (People and places, Schedule, Billing, Settings, Go-live), rendered from masterViews.ts, with aria-current on the open one." replaceWith="shadcn Sidebar group / NavigationMenu" note="Rebuilt from MasterData's markup and the real MASTER_VIEWS registry (catch-up Phase 42): the real nav writes ?view= and renders every master view." height={620}>
          <MastersSubNavExample />
        </CatalogueRow>
        <CatalogueRow name="PdfListsTab and PdfListReview (PDF lists)" source="apps/admin/intake/PdfListsTab.tsx" usedIn={A} what="The rooms' PDF lists (catch-up Phase 34): an inbox on the shared table kit (sender, surgeon, hospital, received, suggested List, a Re-sent Pill and a status Pill), Upload PDF list (PdfUploadDialog: the surface's Overlay with OverlayHeader, RadioCards badged Sample files, a Sent from TextField and SheetActions), and the review beside the facsimile: compact TextFields per row, each correction listed under its row, Send to matching (Button) and a ResultLine." replaceWith="TanStack Table + shadcn Dialog + Field" note="Uploading, correcting and sending write to the demo store." height={460}>
          <Wide minWidth={1000}>
            <PdfListsTab actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="ListOriginRow" source="apps/admin/components/ListOriginRow.tsx" usedIn={A} what={`Where a List came from (catch-up Phase 34; US-02.2.4): one DefRow on the session and ${DRAFT_LIST} drawers, the origin in words and, as its note, who the office's replies go to through the one email helper (the List's sender first).`} replaceWith="shadcn (DefRow's replacement)">
          <ListOriginExample />
        </CatalogueRow>
        <CatalogueRow name="LineTabs" source="shared/ui/LineTabs.tsx" usedIn={AWM} what={`The underline tab strip (UI unification U5): LineTabLink for sibling routes (the web Accounts sub-tabs, ${DRAFT_LISTS}, the web Availability page switch, Admin Intake's four tabs, the Future-scope pages), a labelled navigation with aria-current; LineTab for local panels (Phase 25's Contract History tab), buttons with aria-pressed; a badge after the label for a count.`} replaceWith="shadcn Tabs (as links)" note="Was AA fees' TabLink. Shown with LineTab so nothing leaves this page.">
          <LineTabsExample />
        </CatalogueRow>
        <CatalogueRow name="DayNav (with SortToggle)" source="apps/admin/components/DayNav.tsx" usedIn={A} what="The Day view toolbar: week and day steppers, Today, the shared DateJumpInput (36px, named Go to date, bounded by the horizon; UI unification U4), the Roster order or A to Z choice and Find available. Since UI unification U5 the step buttons are IconButtons named Previous day and Next day, the week steps and Today are the compact Button, and SortToggle is the small SlidingSegmentedControl (Row order)." replaceWith="shadcn Button Group + ToggleGroup + Date Picker" note="Its title is the shared PageHeader (admin, 24/30) since UI unification U6.">
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
        <CatalogueRow name="StubRow and StubMarker" source="shared/stubs/StubParts.tsx" usedIn={AWM} what="A stub on a List (catch-up Phase 33a): a booking waiting at intake, not a Booking. StubRow is the Booking row with the dashed placeholder edge on the mild warning tint and the triangle disc: time, name and wording as received, the reason and who resolves it. StubTableRow holds it in a Bookings table and shows what was received inline; StubMarker is the triangle beside a List's count (Lists rows, the Day grid block); ListStubNote reads '1 waiting at intake' beside the progress. On Admin it ends in StubResolveLink, 'Resolve on Matching'." replaceWith="shadcn Item + Badge + Collapsible" note="A fixed example stub; nothing writes to the demo data.">
          <StubSetExample />
        </CatalogueRow>
        <CatalogueRow name="WarningTriangle" source="shared/warnings/WarningTriangle.tsx" usedIn={AWM} what="The warning mark on a booking, coloured by the strongest open warning." replaceWith="shadcn Tooltip + Badge" note="Its detail is reachable by keyboard once it is a Tooltip.">
          <WarningTriangleExample />
        </CatalogueRow>
        <CatalogueRow name="NameSearchBox" source="shared/ui/NameSearchBox.tsx" usedIn={AWM} what="The one search box in all three apps since UI unification U4: field (48px) and pill (36px, or 38px on the web Lists row) sizes; fill well (grey) inside a sheet, card or drawer and surface (white, the default) on the page; a clear button (clearLabel, a 44px touch target on the phone), Escape clears, testId and shot hooks. Each caller filters its own rows." replaceWith="shadcn Input Group (search)" note="WebSearchField and the mobile Lists input are gone: both Lists pages use it. The aa-field class gives it the one teal focus ring.">
          <NameSearchBoxExample />
        </CatalogueRow>
        <CatalogueRow name="ContractSelect (SelectField)" source="shared/contracts/ContractSelect.tsx" usedIn={A} what="A native select of every active Contract grouped by holder, on the shared SelectField (UI unification U4): 48px, grey well, its label above it." replaceWith="shadcn Select (or NativeSelect)" note="A select without a visible label takes SelectField's hideLabel, which names it.">
          <ContractSelectExample />
        </CatalogueRow>
        <CatalogueRow name="SurgeonPicker" source="apps/admin/components/pairing/SurgeonPicker.tsx" usedIn={A} what="A native select of surgeons with a 'Not preferred with Dr X' optgroup for the chosen anaesthetist, on the shared SelectField (UI unification U4): a label (or hideLabel), size, fill and width." replaceWith="Base UI Combobox (with groups)" note="Stays a native select (the catch-up 17 ruling). The list is long and not searchable. Opens on an anaesthetist with a not-preferred surgeon, so the second optgroup shows.">
          <SurgeonPickerExample />
        </CatalogueRow>
        <CatalogueRow name="NotPreferredWarning" source="apps/admin/components/pairing/NotPreferredWarning.tsx" usedIn={A} what="An amber callout when the chosen surgeon is not preferred with the anaesthetist, on the shared Notice; it warns, never blocks." replaceWith="shadcn Alert" note="Fed by the real useNotPreferredWarning hook for a seeded not-preferred pairing.">
          <NotPreferredWarningExample />
        </CatalogueRow>
        <CatalogueRow name="ChipMultiSelect" source="apps/admin/components/ChipMultiSelect.tsx" usedIn={A} what="A native 'Add a...' select plus removable chips: a Contract's specialties and, since UI unification U4, its linked surgeons (the editor's private SurgeonPicker is gone). The select draws the one field chrome and its hint is the shared FieldHint. Also a surgeon's specialties." replaceWith="Base UI Combobox (multiple, chips)" note="Searchable, with Backspace to remove.">
          <ChipMultiSelectExample />
        </CatalogueRow>
        <CatalogueRow name="ContactFields" source="apps/admin/components/ContactFields.tsx" usedIn={A} what="One contact's Name, Email (mono) and Phone on the shared TextField, in a fieldset its legend names (catch-up Phase 17b, US-13.6.5). The surgeon edit sheet uses it for the personal contact and for each office contact set; a set after the first carries a minus IconButton that removes it whole, and the store's refusal for a bad email shows under the set." replaceWith="shadcn Field + Fieldset" note="Local state only.">
          <ContactFieldsExample />
        </CatalogueRow>
        <CatalogueRow name="CodePickerSheet" source="shared/capture/CodePickerSheet.tsx" usedIn={AWM} what="The RVG code type-ahead in an Overlay titled by an OverlayHeader: search by code or description, every match rendered. Its search is the shared NameSearchBox in the well fill (UI unification U4)." replaceWith="Base UI Combobox + TanStack Virtual" note="The library would add combobox and listbox roles and arrow and Enter selection.">
          <CodePickerExample />
        </CatalogueRow>
        <CatalogueRow name="Notice" source="shared/ui/Notice.tsx" usedIn={AWM} what="The one notice (UI unification U3): the ConflictCallout shell in warning, error and success, and the neutral note. A role only where the note announces; the icon is aria-hidden." replaceWith="shadcn Alert">
          <NoticeExample />
        </CatalogueRow>
        <CatalogueRow name="LoadResultBanner" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="The one-line neutral Notice under a master view's header while a load waits for review: on a seeded view while a seed load for one of its sheets is staged (Open Seed load), and on every view while the go-live load is staged (Open). The Go-live views show none." replaceWith="shadcn Alert" note="Shown for the Hospitals view: Check the sample stages hospitals.csv in the demo store; load or discard it on the LoadResultPanel row or on Seed load.">
          <LoadResultBannerExample />
        </CatalogueRow>
        <CatalogueRow name="ConflictCallout" source="apps/admin/components/conflicts/ConflictCallout.tsx" usedIn={A} what="Warns, before saving, that the hospital is closed that day and the List will be flagged (the shared Notice, warning tone)." replaceWith="shadcn Alert">
          <ConflictCalloutExample />
        </CatalogueRow>
        <CatalogueRow name="WarningsToDo" source="apps/admin/components/WarningsToDo.tsx" usedIn={A} what="The rail's To-do card: every open warning, soonest first, each with Open and Clear, and a show-more toggle. Its count is the shared CountBadge (read as 3 to do)." replaceWith="shadcn Card + Collapsible" note="On the shared Card (padding card, flat; UI unification U6), its h2 naming the section. Clear writes a clearance to the demo store.">
          <WarningsToDoExample />
        </CatalogueRow>
        <CatalogueRow name="ReconciliationCard" source="apps/admin/components/ReconciliationCard.tsx" usedIn={A} what="The rail's Reconciliation card (catch-up Phase 37; US-13.2.4): Books square or Out of balance, derived and never stored, each failing check with its difference, then up to five unresolved items oldest first with amount and age, each linking to where it is handled." replaceWith="shadcn Card + Badge" note="On the shared Card, under the To-do. Reads reconciliationStatusOf; Inject unmatched receipt on the Ledger puts it out of balance.">
          <ReconciliationCardExample />
        </CatalogueRow>
        <CatalogueRow name="Xero panels (XeroConnectionLine · XeroQueuePanel · XeroDivergencePanel · PayablesPanel)" source="apps/admin/components/XeroPanels.tsx" usedIn={A} what="The Billing monitor's Xero panels (catch-up Phase 37): the connection line, the Xero sync queue with Retry now, the invoices changed directly in Xero with the Resolve side panel, and the payables awaiting Xero's payables run with the badged Run payables in Xero." replaceWith="shadcn Card + Table + Badge + Sheet" note="On the shared Card, TableShell (nested, compact), Pill, Notice, Button, EmptyState and SidePanel. Simulate Xero outage on the Billing monitor fills the queue.">
          <XeroPanelsExample />
        </CatalogueRow>
        <CatalogueRow name="PrepaymentsRailCard" source="apps/admin/components/PrepaymentsRailCard.tsx" usedIn={A} what="The rail's Pre-payments card (catch-up Phase 27): every upcoming prepaid Booking, one row per payer, with its amount, a status pill and the days to go. An awaiting row opens the Invoices strip; the others open the Booking. Its count is the shared CountBadge; empty, the shared EmptyState." replaceWith="shadcn Card + Badge" note="On the shared Card (padding card, flat), under the To-do card. Reads useUpcomingPrepayments.">
          <PrepaymentsRailCardExample />
        </CatalogueRow>
        <CatalogueRow name="PrepaymentApprovalStrip" source="apps/admin/components/PrepaymentApprovalStrip.tsx" usedIn={A} what="The Invoices screen's Awaiting approval strip (catch-up Phase 27): one row per Booking and payer, Approve and send (disabled with its reason until there is an amount), and the Prepayment approval Switch in its header; switching off confirms in a ConfirmSheet." replaceWith="shadcn Card + Table + Switch" note="On the shared Card, TableShell, Button (disabledReason), Switch and ConfirmSheet. Approve and send writes to the demo store.">
          <PrepaymentApprovalStripExample />
        </CatalogueRow>
        <CatalogueRow name="HoldingAccountPanel" source="apps/admin/components/HoldingAccountPanel.tsx" usedIn={A} what="The Billing monitor's AA Holding account card (catch-up Phase 27a): the balance, the prepaid Bookings it holds money for, the entries (Received or Transferred, with the anaesthetist), how money leaves it and the provisional release trigger. Read-only; empty, the shared EmptyState." replaceWith="shadcn Card + Table + Badge" note="On the shared Card (padding card), TableShell (nested, compact), Th and Td, Pill and EmptyState. Reads useHoldingAccount.">
          <HoldingAccountPanelExample />
        </CatalogueRow>
        <CatalogueRow name="NotificationsCard" source="apps/admin/components/NotificationsCard.tsx" usedIn={A} what="The rail's shared notification pool: active notices with Resolve, See all and Show resolved. Its count is the shared CountBadge (read as 2 active), still showing 0." replaceWith="shadcn Card + Button" note="On the shared Card (U6) with headingRef: after a tick focus returns to its heading. Resolve writes to the demo store. The fresh seed has no notices, so it shows the empty state until one is raised.">
          <NotificationsCardExample />
        </CatalogueRow>
        <CatalogueRow name="UpdateEmailComposer (with UpdateEmailPreview)" source="apps/admin/flows/UpdateEmailComposer.tsx" usedIn={A} what="The update email composer (catch-up Phase 35): a wide two-column Overlay. Left, Pick changes: the saved history newest first on the shared Checkbox, rows that cannot be emailed disabled with their reason, an earlier-draft hint Pill and the cancelled-out note. Right: Template (SelectField), Send to (Segmented), the resolved To with the other office contacts to switch to, and the preview badged Demo preview with its character count and a Shortened to fit Pill. Open in mail client is the shared Button rendered as a real mailto: link." replaceWith="shadcn Dialog + Checkbox + Select + ToggleGroup" note="Open in mail client records one updateEmail.drafted entry in the demo store; nothing is sent. The Button's href prop (added here) renders an anchor while enabled.">
          <UpdateEmailComposerExample />
        </CatalogueRow>
        <CatalogueRow name="BookingUpdateEmailButton / NotificationEmailAction / useListUpdateEmail" source="apps/admin/flows/UpdateEmailActions.tsx" usedIn={A} what="Where the update email opens from: the Admin Booking header's Draft update email (outline Button with the Mail icon, disabled with its reason while the page has unsaved changes or nothing saved to email), the List drawers' Draft update email once a List has an emailable change of anaesthetist, and the notification page's Draft cover-change email on a List moved to a colleague (a return to the office points to the unassigned List instead)." replaceWith="shadcn Button" note="Shown here: the Booking button on a seeded Booking, outside any draft.">
          <BookingUpdateEmailButtonExample />
        </CatalogueRow>
        <CatalogueRow name="BookingSaveBar / BookingSavedStrip" source="apps/admin/components/BookingSaveBar.tsx" usedIn={A} what="The Admin Booking detail's explicit save (catch-up Phase 35): a sticky warning Notice with the unsaved count, the changed fields and compact Discard and Save changes Buttons (a refused save prints its reason), then a success Notice: Saved, the count, the time, who and the change-set id, with Dismiss. Both count by label (shared/booking/changeLabels.ts), as the leave dialog does." replaceWith="shadcn Alert + Button" note="Sample changes here: Save and Discard write nothing.">
          <BookingSaveBarExample />
        </CatalogueRow>
        <CatalogueRow name="OfficeSavedNotice" source="shared/booking/OfficeSavedNotice.tsx" usedIn={AWM} what="One dismissible neutral Notice when another actor's save lands on an open Booking: who saved and the fields, with View history. A notice, not concurrency handling." replaceWith="shadcn Alert" note="The button saves a note as Sam T. in the demo store, which raises the notice here.">
          <OfficeSavedNoticeExample />
        </CatalogueRow>
        <CatalogueRow name="BookingAsAtPanel" source="shared/booking/BookingAsAtPanel.tsx" usedIn={A} what="View as at, from a History row (catch-up Phase 35): the Booking rebuilt from the audit at that point on the sunken panel, its rows the shared DefRow, each Procedure under an Eyebrow; Paid by as the live line decides it (the payer only where the Contract bills the payer). No money. A gap in the record reads as incomplete, in words." replaceWith="Custom (shadcn Card)" note="Read-only; shown at the Booking's newest entry.">
          <BookingAsAtPanelExample />
        </CatalogueRow>
        <CatalogueRow name="LeaveWithoutSavingDialog" source="shared/booking/draft/useUnsavedChangesGuard.tsx" usedIn={A} what="Leave without saving? (catch-up Phase 35): a ConfirmSheet over a blocked navigation with the unsaved count; Keep editing (the primary, which takes the initial focus) stays, Discard and leave throws the draft away and goes on." replaceWith="shadcn AlertDialog" note="On a stand-in blocker here; on the Booking detail useBlocker (the data router) blocks the navigation.">
          <LeaveWithoutSavingDialogExample />
        </CatalogueRow>
        <CatalogueRow name="VacatedSessionChoice / StatusRadioGroup" source="shared/flows/VacatedSessionChoice.tsx" usedIn={AWM} what="A radio group of status chips: what the vacated session becomes after a move. Its keyboard is the shared useRovingRadio (UI unification U4): one Tab stop, arrows move and select, Home and End jump to the ends." replaceWith="shadcn RadioGroup" note="The same hook drives the Contract rail's answers (RailOptionGroup), where a move only focuses.">
          <VacatedChoiceExample />
        </CatalogueRow>
        <CatalogueRow name="RailOptionGroup" source="shared/contracts/railParts.tsx" usedIn={AWM} what="One step of the Contract chooser as a named radio group (UI unification U4): list rows with a count (the step rail sheet) or tiles with None for this List (the Billing card), a Suggested pill on the funder's path, unselectable answers dimmed. Arrow keys move focus only; Space, Enter or a click picks, because a pick saves and moves on." replaceWith="shadcn RadioGroup (card items)" note="Static options here; Phase 23 builds Make primary on it. Nothing writes to the demo data.">
          <RailOptionGroupExample />
        </CatalogueRow>
        <CatalogueRow name="RadioCard" source="shared/ui/RadioCard.tsx" usedIn={A} what="One option of a radio group drawn as a card (catch-up Phase 33's review): the radio dot, a title with an optional pill or count beside it, slate lines, and the checked card's own controls under it. Checked is the teal accent (an accent border doubled by a 1px inset ring, the rail tiles' edge) on white; a disabled card sits on the bg fill with its reason. Keyboard from useRovingRadio; Space, Enter or a click selects. Matching's import dialog and decision cards use it." replaceWith="shadcn RadioGroup (card items)">
          <RadioCardExample />
        </CatalogueRow>
        <CatalogueRow name="DecisionCards (Matching)" source="apps/admin/matching/DecisionCards.tsx" usedIn={A} what={`The Matching row panel's decision: RadioCards for Match and apply, Create a Booking, Create a List, Create a ${DRAFT_LIST} and Reject, the suggested one marked with the Contract rail's Suggested pill, a disabled card showing why, and the chosen card opening its own controls.`} replaceWith="shadcn RadioGroup (card items)" note="Static options here; nothing writes to the demo data.">
          <DecisionCardsExample />
        </CatalogueRow>
        <CatalogueRow name="OptionChip" source="shared/ui/OptionChip.tsx" usedIn={AWM} what="A quick option chip (catch-up Phase 39): a teal-tint pill that fills or picks one answer in a form, beside the field it serves (the credit's reasons over its reason text); pressed is the teal border and tint with aria-pressed; size md 36 or lg 44 on the phone. Not FilterPills, the solid teal list filter." replaceWith="shadcn Toggle (outline)" note="The availability form's and the funder sheet's private chips can move onto it.">
          <OptionChipExample />
        </CatalogueRow>
        <CatalogueRow name="OptionRow" source="shared/ui/OptionRow.tsx" usedIn={A} what="One result in a short pick list under a search box (catch-up Phase 33's review, Matching's Match to another Booking): a full-width bordered button, words left and mono facts right; the current pick in the teal accent edge and tint, with aria-pressed. A table row that opens a record is ClickableRow instead." replaceWith="shadcn Command (items)">
          <OptionRowExample />
        </CatalogueRow>
        <CatalogueRow name="Switch" source="shared/ui/Switch.tsx" usedIn={AWM} what="The one on/off switch (UI unification U4): a button with role=switch and aria-checked, so click and Space toggle it; sm is the 36 by 20 track, lg the 52 by 32 touch track, with a label and an optional description." replaceWith="shadcn Switch" note="No product screen uses it yet: Phase 27 builds its approval-step toggle on it. The PWA panel's ToggleRow stays its own (a demo surface).">
          <SwitchExample />
        </CatalogueRow>
        <CatalogueRow name="ProfileChrome" source="apps/admin/components/ProfileChrome.tsx" usedIn={A} what="The surgeon and anaesthetist record pages' header (the shared PageHeader, admin size, the id chip beside it), and their cards and facts on the shared Card (padding card) and DefRow stacked, with History and Edit actions (UI unification U6). Card passes data-* attributes through. The id chip shows a mist placeholder when no value is held (catch-up Phase 17b, a surgeon with no HPI CPN yet)." replaceWith="shadcn Card (+ Breadcrumb for BackLink)" note="Its back link is the shared BackLink since UI unification U5 (teal, a real link), left out here because it would leave this page.">
          <ProfileChromeExample />
        </CatalogueRow>
        <CatalogueRow name="drawerParts (Section, DrawerLink)" source="apps/admin/components/drawerParts.tsx" usedIn={A} what="The drawers' section headings (an Eyebrow over the body) and inline links, shared by SlotDrawer and DraftListDrawer (one copy since U2); their label and value rows are the shared DefRow since UI unification U6, and their action buttons the shared Button at the compact size, a disabled one printing its reason (U5)." replaceWith="shadcn Button + DropdownMenu" note="ActionBtn folded into Button in UI unification U5.">
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
        <CatalogueRow name="MasterTable / EditCell" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="Every master view's table (catch-up Phase 42): the shared TableShell at the dense density with a Th per named column (a string, or a label with its alignment and width; ACTIONS_COLUMN for the right-aligned actions), and EditCell, the row's Edit as the shared TextAction in its own right-aligned Td." replaceWith="TanStack Table + shadcn Table" note="Replaced the masters Table (heads[]). Contracts and RVG groups add GroupRow; Anaesthetists, Surgeons, Parties and Contracts use ClickableRow.">
          <MasterTableExample />
        </CatalogueRow>
        <CatalogueRow name="MasterHeader" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="A master view's title row over the shared PageHeader (section size): the title, one subtitle line, an optional count and the teal Add action. A seeded view's subtitle ends with the seeded line (Loaded once at go-live from AA's controlled spreadsheet, then kept here by hand.) and the waiting-load banner follows; section is a second header inside a view, with neither." replaceWith="Custom (layout)" note="Replaced the masters Header. The Add action is stubbed here.">
          <MasterHeaderExample />
        </CatalogueRow>
        <CatalogueRow name="ShowRetiredToggle / RetiredPill" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="Show retired on the shared Switch with the retired count as its description, off by default; a retired row in mist on the bg band (retiredRowStyle) with the neutral Retired pill, its reason in the title." replaceWith="shadcn Switch + Badge" note="Local state only: three made-up hospitals, one retired.">
          <ShowRetiredToggleExample />
        </CatalogueRow>
        <CatalogueRow name="LoadResultPanel" source="apps/admin/screens/masters/LoadResultPanel.tsx" usedIn={A} what="One checked sheet's result, shared by Seed load and the go-live view: the summary line (hospitals.csv: 6 rows · 2 valid · 4 rejected), a dense table of Row, the sheet's key columns, a Valid or Rejected pill and the reasons one per line, the Only rejected filter, and Load N valid rows and Discard. After a load the summary says what loaded and each row opens its record." replaceWith="TanStack Table + shadcn Table + Badge" note="Check the sample stages hospitals.csv as the developer's seed load; Load and Discard write to the demo store." height={520}>
          <Wide minWidth={900}>
            <LoadResultPanelExample />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="Table kit (TableShell · Th · Td · GroupRow · ClickableRow)" source="shared/table/" usedIn={AWM} what="The one table kit (UI unification U6, question 19): TableShell (white, line, radius 14, e1; a named focusable region only when it overflows), Th (scope col) on the Admin Review header, sortable with `sort` (aria-sort and a button, teal underline on the active column; the Billing monitor), Td with sunken dividers, GroupRow (th scope colgroup), and ClickableRow with one RowOpenButton as the keyboard handle. Density comfortable (web), compact (admin) or dense (audit and masters) keeps each table's row height." replaceWith="TanStack Table + shadcn Table" note={`The ${DRAFT_LISTS} table is built this way: Tab to a session, Enter opens the ${DRAFT_LIST} drawer (bug 3). An inner button does only its own action.`}>
          <TableKitExample />
        </CatalogueRow>
        <CatalogueRow name="PageHeader" source="shared/ui/PageHeader.tsx" usedIn={AW} what="A page's title row (U6): web 28/34, admin 24/30, or the 18/700 section title; an h1, a slate sub-line, right-aligned actions, a count inside the heading or an aside beside it, headingRef for focus return." replaceWith="Custom (layout)">
          <PageHeaderExample />
        </CatalogueRow>
        <CatalogueRow name="Card (card)" source="shared/ui/Card.tsx" usedIn={AWM} what="The shared Card (U6, question 20): padding card (16, flat, 14/600; the Admin rail, the profiles, the phone) or panel (20, e1, 17/600; the web panels), radius 14, its title an h2 naming the section; the warning tone." replaceWith="shadcn Card">
          <CardExample />
        </CatalogueRow>
        <CatalogueRow name="Eyebrow" source="shared/ui/Eyebrow.tsx" usedIn={AWM} what="The 11px caps tracked label (U6, question 23): 11/600/0.06em everywhere, tones mist, slate, warning and brand, a heading where it titles a section. FieldLabel is this component." replaceWith="Custom (type token)">
          <EyebrowExample />
        </CatalogueRow>
        <CatalogueRow name="DefList / DefRow" source="shared/ui/DefRow.tsx" usedIn={AWM} what="Label and value pairs as a dl (U6): inline (the drawers and Booking detail, labels at 80), stacked (the profile facts) and settings (the base of Phase 26's ProfileRow, with a trailing lock and the bank number masked)." replaceWith="Custom (dl)">
          <DefRowExample />
        </CatalogueRow>
        <CatalogueRow name="ReviewQueue (clickable rows)" source="apps/admin/screens/ReviewQueue.tsx" usedIn={A} what="Submitted Lists to authorise, and since catch-up Phase 38b an Events tab (LineTabLink with its count) of events awaiting review, on the shared table kit (UI unification U6): TableShell (compact), Th, Td and ClickableRow, whose row click opens the List while the Review button stays the keyboard handle." replaceWith="TanStack Table + shadcn Table (row links)" note="Rows never take focus; the Review button is the one handle per row. Open is stubbed." height={380}>
          <Wide minWidth={980}>
            <ReviewQueue onOpen={noop} onViewInvoices={noop} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="RvgGroupsView (grouped rows)" source="apps/admin/screens/masters/RvgGroupsView.tsx" usedIn={A} what="RVG groups under anatomy headings (colSpan group rows), with search, an anatomy filter and add, edit and retire." replaceWith="TanStack Table (grouping) + shadcn Table" note="Add, edit and retire write to the demo store. Its table is the shared TableShell (dense) and Th since UI unification U6; Phase 42 moves its group rows onto GroupRow." height={460}>
          <Wide minWidth={980}>
            <RvgGroupsView actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="EmailTemplatesView (template editor with live preview)" source="apps/admin/screens/masters/EmailTemplatesView.tsx" usedIn={A} what="The update email templates (catch-up Phase 35): a table of name, kind, sends to and active, with Edit, Retire and Restore. Edit opens a wide sheet with the fields, placeholder buttons that insert into the subject or body, validateTemplate's messages inline and a preview against a sample Booking badged Sample." replaceWith="TanStack Table + shadcn Table, shadcn Sheet + Form" note="Edits write to the demo store. The placeholder buttons are plain buttons until a token-insert input exists." height={420}>
          <Wide minWidth={980}>
            <EmailTemplatesView actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="AuditViewer" source="apps/admin/screens/AuditViewer.tsx" usedIn={A} what="The global audit feed with a filter bar, capped at 500 rows. Since UI unification U4 the bar is shared parts: two SelectFields (compact, surface fill) and a FilterDateInput From and To." replaceWith="TanStack Table + TanStack Virtual" note="On the shared table kit (U6, dense). Virtualisation or pagination replaces the 500-row cap later." height={460}>
          <Wide minWidth={980}>
            <AuditViewer />
          </Wide>
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="forms">
        <CatalogueRow name="TextField" source="shared/ui/Field.tsx" usedIn={AWM} what="The one labelled single-line input, about 77 uses in Admin: text, date, time, number, email or phone; mono; a FieldHint tied by aria-describedby; and since UI unification U4 invalid (aria-invalid and the error border), inputMode and align for amounts, min, max, step, list, size (48px field or 36px compact), fill (well or surface) and hideLabel. Catch-up Phase 17b adds accessibleName, a fuller name where the visible label repeats on the page (Office contact 2 email)." replaceWith="shadcn Field + Input (React Hook Form)" note="Every default keeps the old look (48px, grey well). The library would bind errors to the field.">
          <TextFieldExample />
        </CatalogueRow>
        <CatalogueRow name="RowField" source="apps/admin/components/RowField.tsx" usedIn={A} what="The small labelled in-row input for correcting one field of an incoming row: the Matching panel's name, date of birth and time (catch-up Phase 33 moved it out of PdfReview; Phase 34's PDF list review uses the shared TextField, compact, instead). Mono, an invalid border, and a read-only look for wording kept as received." replaceWith="shadcn Field + Input" note="A near twin of TextField's compact size; fold it into TextField in the migration.">
          <RowFieldExample />
        </CatalogueRow>
        <CatalogueRow name="DiffTable (Matching)" source="apps/admin/matching/DiffTable.tsx" usedIn={A} what="Matching's differences between a Booking and the hospital's row: Field, On the Booking now, From the hospital, on the shared table kit (nested, dense). Every row is a changed field in the warning tone (ClickableRow tone=warning); a field the office may apply carries its tick, named by the field; an NHI is shown but never applied." replaceWith="TanStack Table + shadcn Table + Checkbox">
          <DiffTableExample />
        </CatalogueRow>
        <CatalogueRow name="TextArea" source="shared/ui/Field.tsx" usedIn={AWM} what="The one multi-line input: a visible label or ariaLabel, a hint, and since UI unification U4 a counter (maxLength, cap, countTrimmed), compact density (the rail's day note), fill and resize. The rail's day note, the modifier reason and the Alert the office note moved onto it." replaceWith="shadcn Field + Textarea">
          <TextAreaExample />
        </CatalogueRow>
        <CatalogueRow name="FieldLabel / FormError" source="shared/ui/Field.tsx" usedIn={AWM} what="The field label (the shared Eyebrow since UI unification U6: 11/600/0.06em caps, one size for every eyebrow, question 23), and FormError: the role=alert refusal box under a form, or its inline line beside a compact row control (U3: the one error box)." replaceWith="shadcn Label + FieldError (Zod schema)" note="Ties each error to its field instead of one line per form.">
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
        <CatalogueRow name="ContractPanel (ContractEditSheet)" source="apps/admin/flows/ContractEditSheet.tsx" usedIn={A} what="The Contract editor in a MasterPanel: two-column fields, SelectFields (holder, linked anaesthetist, funding tag, pricing kind), segmented choices, Disable as a neutral secondary Button (question 8), ChipMultiSelect for specialties and linked surgeons, FieldHint lines, the RVG code picker and price ranges. All shared field parts since UI unification U4. Catch-up Phase 25a: a new Contract's Replaces section (a SelectField and a From date) with the ContractChangeNotice listing the Procedures still on the old one, before and after Create; a Disabled Contract's neutral Notice with its disable day and the same list; the system notice a neutral Notice." replaceWith="shadcn Sheet + Field + React Hook Form + Zod" note="Save writes the Contract to the demo store.">
          <ContractPanelExample />
        </CatalogueRow>
        <CatalogueRow name="SlotStatusSheet" source="apps/admin/flows/SlotStatusSheet.tsx" usedIn={A} what="Adds or edits an availability status in an Overlay: an OverlayHeader title, name, colour swatches, flags (the shared Checkbox with a hint, UI unification U4) and a live preview validated as you type, and a SheetActions footer." replaceWith="shadcn Dialog + Field + ToggleGroup (swatches) + RHF/Zod" note="Save adds the status to the demo store. Its preview block is the shared StatusBlock with the draft visual (UI unification U6).">
          <SlotStatusSheetExample />
        </CatalogueRow>
        <CatalogueRow name="PublicHolidaySheet" source="apps/admin/flows/PublicHolidaySheet.tsx" usedIn={A} what="Adds or changes a master public holiday in an Overlay (catch-up Phase 42): date, name, National or Regional with its region, and the hospitals open that day; Save says what the conflict rule did (flags raised or cleared)." replaceWith="shadcn Dialog + Field + RHF/Zod" note="Save writes the public holiday to the demo store and re-runs the conflict rule.">
          <PublicHolidaySheetExample />
        </CatalogueRow>
        <CatalogueRow name="RvgTimeRuleSheet" source="apps/admin/flows/RvgTimeRuleSheet.tsx" usedIn={A} what="Edits the RVG time rule in an Overlay (catch-up Phase 42): one row per tier (from minute, minutes per unit; add and remove a tier), A part interval always rounds up. as a fixed line, a live preview of the rule in words and the units for 95 and 125 minutes, and Save with its refusal sentence inline." replaceWith="shadcn Dialog + Field + Base UI NumberField" note="Save writes the rule to the demo store; Procedures not yet authorised re-price.">
          <RvgTimeRuleSheetExample />
        </CatalogueRow>
        <CatalogueRow name="RetireSection" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="Retire (with a required reason) or Reinstate at the foot of a hospital, surgeon, surgeon group or AA modifier edit sheet: a refused retire lists the store's blockers in a warning Notice; a retired record shows its day and reason." replaceWith="shadcn Field + Textarea + Alert" note="Shown for the first seeded surgeon group; Retire and Reinstate write to the demo store.">
          <RetireSectionExample />
        </CatalogueRow>
        <CatalogueRow name="ContractPriceRanges" source="apps/admin/flows/ContractPriceRanges.tsx" usedIn={A} what="A fixed-price Contract's dated prices as an inline-edit table: Enter saves, Escape cancels, the last row cannot be deleted. Its in-table inputs are the shared TextField at the compact size (UI unification U4): hidden labels, mono, the price right-aligned on a decimal keypad. Under it (catch-up Phase 25a) the ContractChangeNotice lists each authorised Procedure that kept its old range price." replaceWith="Base UI NumberField + TanStack Table (cell edit)" note="On the shared TableShell (dense) and Th since UI unification U6.">
          <ContractPriceRangesExample />
        </CatalogueRow>
      </LibraryGroup>

      {/* ------------------------------------------------------------------ */}
      <LibraryGroup id="daypicker">
        <CatalogueRow name="MiniCalendar (RightRail)" source="apps/admin/components/RightRail.tsx" usedIn={A} what="The rail's month calendar with roving focus, arrows, Home and End, Page Up and Down, and today in crimson. Its keys are the shared useCalendarKeys (UI unification U4, unbounded so paging past the horizon still lands on Admin Day); its day note is the compact TextArea with a Checkbox flag." replaceWith="shadcn Calendar (react-day-picker)" note="On the shared Card (padding card) since UI unification U6." height={420}>
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
        <CatalogueRow name="HpiCpnField / BankAccountFields" source="apps/admin/flows/anaesthetistFields.tsx" usedIn={A} what="The anaesthetist's mandatory HPI CPN and bank account name and number (catch-up Phase 26), shared by Add an anaesthetist and the Edit sheet: marked required, checked inline (the error hint in the store's own words, data-validation-invalid on the field), Save disabled with its reason until all three are filled." replaceWith="shadcn Field (React Hook Form + Zod)" note="Local state only; nothing writes to the demo data. The full bank number shows only here, in the office's editor.">
          <AnaesthetistFieldsExample />
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
        <CatalogueRow name="ProcedureStack" source="shared/booking/ProcedureStack.tsx" usedIn={AWM} what="One Procedure's procedure text, invoice description, Contract and RVG code on every Booking screen, Admin Review and the List drawer, in full or compact density; still-to-choose parts are neutral and dashed. On a multi-procedure Booking its heading takes a badge, the neutral Primary pill (catch-up Phase 23)." replaceWith="Custom (a description list on library primitives)" note="Fixed example views; nothing writes to the demo data.">
          <ProcedureStackExample />
        </CatalogueRow>
        <CatalogueRow name="PayerFields (DifferentPayerTick, OtherPayerFields, PostalAddressFields)" source="shared/flows/PayerFields.tsx, PostalAddressFields.tsx" usedIn={AWM} what="The payer form's parts, in PaidBySheet's Who pays and the add forms: the Different payer tick (the shared Checkbox at lg, in its card, since UI unification U4), then the other payer's name, relationship chips, email, NZ Post postal address and phone, all on the shared TextField." replaceWith="shadcn Checkbox card, ToggleGroup and Input" note="Local state only; nothing writes to the demo data.">
          <PayerFieldsExample />
        </CatalogueRow>
        <CatalogueRow name="FunderDetailsView" source="shared/booking/FunderDetailsView.tsx" usedIn={AWM} what="The Booking's insurer or funder and its approval number (catch-up Phase 21): None; an insurer with its number; an insurer with no number (the warning-tint chip); a funder with none. FunderSheet edits it with radio chips." replaceWith="Custom (text rows and the shared Pill)" note="Fixed example details; nothing writes to the demo data. The approval number row is a shared DefRow (UI unification U6), its label kept at 96 because it wraps at 80.">
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
        <CatalogueRow name="PaidByRow" source="shared/booking/PaidByRow.tsx" usedIn={AWM} what="Paid by in the Billing card (catch-up Phases 22 and 22a; US-08.2.3, US-11.2.2): the Procedure's payer with Patient or the relationship and the warning-tint Email or postal address needed and Under 18 pills where its Contract bills the payer; the holder where the Contract bills its holder; a split's parties, in the warning tint when it no longer fits; Payer: not billed yet with no Contract. On web and Admin a line at the card's foot, on the phone the Billing summary's last row: Change beside the payer's name opens PaidBySheet with who pays and the offer; Split on the right opens it with the split alone." replaceWith="Custom (text rows and the shared Pill)" note="Read-only examples over fixed views; the sheet opens on a real Booking. The Paid by line is a shared DefRow since UI unification U6 (its Change and Split inside the value).">
          <PaidByRowExample variant="line" />
        </CatalogueRow>
        <CatalogueRow name="LockBadge" source="shared/booking/LockBadge.tsx" usedIn={AWM} what="Contract locked at authorise (catch-up Phase 25; US-04.3.5): the shared neutral Pill with the lock glyph on a Booking whose List is AUTHORISED, in the Billing card on all three apps and the office's billing setup; who locked it and when on hover, or as a detail line on web and Admin. Never a seventh status colour." replaceWith="shadcn Badge (the shared Pill)" note="Shown on the seeded AUTHORISED Face lift, locked at seed time.">
          <LockBadge bookingId={SEED_MARKERS['rangeAuthorisedBooking']?.entityId ?? ''} detail />
        </CatalogueRow>
        <CatalogueRow name="ContractHistory" source="apps/admin/flows/ContractHistory.tsx" usedIn={A} what="A Contract's History tab (catch-up Phase 25; US-04.1.3): its audited changes newest first through the shared HistoryTimeline (who, when, the values before and after), then the Procedures locked against it with links to their Bookings and invoices; EmptyState before any change." replaceWith="Custom (the shared HistoryTimeline and EmptyState)" note="Shown on the fixed-price Contract of the seeded AUTHORISED Face lift.">
          <ContractHistoryExample />
        </CatalogueRow>
        <CatalogueRow name="ContractChangeNotice" source="apps/admin/flows/ContractChangeNotice.tsx" usedIn={A} what="The Contract panel's change warning (catch-up Phase 25a; US-04.1.2, US-04.2.15): the shared warning Notice with its sentence, then the Procedures it names on the shared TableShell (dense), each with Open to its Booking. One component for the dated change (a new Contract's Replaces and From), a disable, and the authorised Procedures a price range left at their old price. It only lists: nothing moves." replaceWith="Custom (the shared Notice and TableShell)" note="Shown with the Procedures dated on or after today still on Merivale's Face lift, read from the demo store.">
          <ContractChangeNoticeExample />
        </CatalogueRow>
        <CatalogueRow name="PaidBySheet (with SplitFeeSection)" source="shared/flows/PaidBySheet.tsx, shared/flows/SplitFeeSection.tsx" usedIn={AWM} what="The one Paid by sheet (catch-up Phase 22a; US-11.2.2, US-08.2.3): a bottom sheet on the phone, a dialog on web and Admin. Opened by Change, it holds who pays (the Different payer tick, the patient's details or the other payer's fields, the Under 18 hint and the contact ask) and, when the payer changes, the offer (the Booking's other Procedures with the same payer, each ticked, never forced). Opened by Split, it holds the split alone (a party or Another person, a $ or % share and Takes the rest per row, each amount live). Save writes it or refuses it whole." replaceWith="Custom (shadcn Sheet, Checkbox and Input inside)" note="Opens on Grace Park's first seeded Procedure; Save writes to the demo store.">
          <PaidBySheetExample />
        </CatalogueRow>
        <CatalogueRow name="ProcedureEventsList" source="shared/booking/ProcedureEventsList.tsx" usedIn={AWM} what="A Procedure's events (catch-up Phase 38b; US-03.7.3): under each Procedure on the Booking detail in all three apps. Each row: the kind, the date, the first line's description, who raised it and the status pill (Awaiting review warning, Approved neutral, Invoiced success, Declined neutral with its reason). The office sees the total ex GST, the party, Review, Edit and Remove and the invoice number; the anaesthetist, on their own Procedure, the total and party and Edit and Remove on what they raised; the anaesthetist apps hide the section when the Procedure has none. A credit (catch-up Phase 39) is its own row: Credits AA-2026-0007 in full and the reason, the credited invoice's total, Issued once issued and the credit note's link in Admin; its new invoices read Rebill of AA-2026-0007." replaceWith="Custom (the shared Eyebrow, Pill, TextAction and InlineConfirm)" note="The seeded event EV0001 as the office sees it; every word from shared/procedureEventCopy.ts.">
          <ProcedureEventsListExample as="office" />
        </CatalogueRow>
        <CatalogueRow name="AdditionalInvoiceSheet (AdditionalInvoiceForm, FreeFormLinesEditor, EventPartyField)" source="shared/booking/AdditionalInvoiceForm.tsx" usedIn={AWM} what="The free-form additional invoice (catch-up Phase 38b; US-08.6.3, D10, D22): raised from the Contract row's Create (Admin) or Raise (anaesthetist) additional invoice, and the events list's Edit. The date of the charge, the Same as the original invoice tick (ticked by default) that unticks to 22a's PartyPicker with Another person, the lines (description, quantity, amount, the line total) and the live subtotal, GST and total; Save for review. A bottom sheet on the phone, a dialog on web and Admin, as the Paid by sheet beside it." replaceWith="Custom (shadcn Sheet, Checkbox and Input inside)" note="Opens on David Chen's HP03; Save for review writes to the demo store. The lines editor and party field are their own components for Phase 39's credit note and rebill.">
          <AdditionalInvoiceSheetExample />
        </CatalogueRow>
        <CatalogueRow name="EventReviewSheet" source="apps/admin/flows/EventReviewSheet.tsx" usedIn={A} what="The one standard review step (catch-up Phase 38b; D13): the event, its Procedure and original invoice, the lines with subtotal, GST and total, the party and who raised it; Approve for billing (invoiced in the next billing run) or Decline with a reason shown to whoever raised it. Opened from Review's Events tab and the events list's Review." replaceWith="shadcn Sheet (side)" note="On the shared SidePanel (record width). Approve and Decline write to the demo store.">
          <EventReviewSheetExample />
        </CatalogueRow>
        <CatalogueRow name="AdditionalInvoiceButton" source="shared/booking/AdditionalInvoiceButton.tsx" usedIn={AWM} what="The button on the Procedure's Paid by row, beside Split (catch-up Phase 38b; US-08.6.3 Button): Create additional invoice for the office on any invoiced Procedure, Raise additional invoice for the anaesthetist on their own; absent on a colleague's or before the List is authorised; disabled with the refusal sentence otherwise." replaceWith="Custom (the shared TextAction)" note="Shown as the office on David Chen's HP03 (an invoiced history Procedure).">
          <AdditionalInvoiceButtonExample />
        </CatalogueRow>
        <CatalogueRow name="CreditSheet (CreditForm)" source="apps/admin/flows/CreditSheet.tsx, shared/booking/CreditForm.tsx" usedIn={A} what="The one credit form (catch-up Phase 39; US-08.6.5, US-08.6.2) in Admin's side sheet, opened by Credit note (no new invoices) and Credit in full and rebill (one new invoice to the original's party), and by Edit on a pending credit. Step 1: the original's number, party and total; who the credit note goes to (the Same as the original invoice tick unticking to 22a's PartyPicker, another person allowed, with an invoice email); the reason (quick chips plus free text, required); no amount, a credit is always in full; the money state in plain words, the trail preview (debit, credit, contra, new debit) and A credit note is not a refund. Step 2: new invoice cards, each 38b's party field and lines editor; Add an invoice. One teal Submit for review." replaceWith="Custom (shadcn Sheet; the shared OptionChip, TextArea, Notice and 38b's form parts inside)" note="Opens on the seeded AA-2026-H03 (unpaid, in Xero). Submit for review writes to the demo store; the anaesthetist's variant (its own chips and one sentence instead of the money state) comes with work item 11 through the form's frame prop.">
          <CreditSheetExample />
        </CatalogueRow>
        <CatalogueRow name="CreditNoteButton" source="shared/booking/CreditNoteButton.tsx" usedIn={A} what="The credit note option on the Procedure's Paid by row, beside Create additional invoice and Split (catch-up Phase 39; US-08.6.5): credits the Procedure's live invoice in full through the app's credit sheet; disabled with its sentence while a credit is pending, on a prepayment invoice and while the Booking has unsaved changes." replaceWith="shadcn Button (link variant)" note="The office's only in this session; the anaesthetist's own entry is Phase 39's work item 11.">
          <CreditNoteButtonExample />
        </CatalogueRow>
        <CatalogueRow name="CreditNoteDocument (CreditedBanner)" source="apps/admin/screens/InvoiceDocument.tsx" usedIn={A} what="A credit note on the invoice's own sheet (catch-up Phase 39; DM-24): CREDIT NOTE, Credits AA-2026-H03 in full, the party it goes to, the reason, who raised it, the mirrored Credit: lines and Total credited, the supplier and agent block (the same DocMasthead, AgentBlock and DocTotals as the tax invoice). The rail: Delivery (sent by the engine, Simulated send), the Negative invoice, the New invoices and the Xero card. Above it, the credited original's banner: Credited in full by CN-2026-0001 on the date, rebilled as the new invoice, all links." replaceWith="Custom (print-styled document)" note="Issue a credit submits, approves and runs a credit of AA-2026-H03 in the demo store, then shows both.">
          <CreditNoteDocumentExample />
        </CatalogueRow>
        <CatalogueRow name="DayGrid" source="apps/admin/components/DayGrid.tsx" usedIn={A} what={`The daily scheduling canvas: one row per anaesthetist, blocks on a 07:00 to 18:00 ruler, conflict and attention overlays, the ${DRAFT_LIST} band and the filter footer. Cut down to 10 rows.`} replaceWith="Custom on primitives (grid roles, Tooltip, TanStack Virtual)" note="Blocks open the real SlotDrawer. Each block takes its fill and dashed outline from blockFill (UI unification U6, U23); the conflict and attention outlines stay its own." height={620}>
          <DayGridExample />
        </CatalogueRow>
        <CatalogueRow name="DraftListBand" source="apps/admin/components/DraftListBand.tsx" usedIn={A} what={`Today's ${DRAFT_LISTS} on the same ruler, above the anaesthetists; each opens its drawer.`} replaceWith="Custom (Tooltip on blocks)" note="Its UNASSIGNED label is the shared Eyebrow (11/600, UI unification U6).">
          <DraftListBandExample />
        </CatalogueRow>
        <CatalogueRow name="StatusBlock" source="shared/StatusBlock.tsx" usedIn={AWM} what="A session block filled by its status through blockFill: solid with a bar, hatched Unavailable or dashed Free. Takes a status, or a visual not yet saved (the status sheet's preview, UI unification U6)." replaceWith="Custom (status cell rendering)">
          <StatusBlockExample />
        </CatalogueRow>
        <CatalogueRow name="Review summary tiles (ReviewScreen)" source="shared/ui/StatTile.tsx" usedIn={A} what="The review page's four summary tiles, then the bookings table: each Procedure's stack with its own flags and Approve or Correct on a Contract change (catch-up Phase 21a), the payer and insurer, alerts, warnings with Clear, totals and flags on the shared Pill, the action bar (Approve all Contract changes, Authorise) and the authorise confirm." replaceWith="Custom on shadcn Card + Table + AlertDialog" note="Tile is not exported: the row mounts the real ReviewScreen. Authorise writes to the demo store." height={560}>
          <ReviewScreenExample />
        </CatalogueRow>
        <CatalogueRow name="Billing pipeline (PipelineDetail)" source="apps/admin/screens/BillingMonitorScreen.tsx" usedIn={A} what="Inside an expanded List on the Billing monitor (catch-up Phase 37 restyle): each stage (authorised, run, invoices, emailed, Xero) as the shared Pill, joined by arrows, in an ol named Billing pipeline with each stage's state in text." replaceWith="Custom on shadcn Badge + Tooltip" note="Not exported: rebuilt here from the shared Pill, fed by the real billingMonitor selector. The monitor's status pills and Retry are the shared Pill and Button.">
          <PipelineStepperExample />
        </CatalogueRow>
        <CatalogueRow name="InvoiceDocument" source="apps/admin/screens/InvoiceDocument.tsx" usedIn={A} what="The invoice as a print-styled document (serif voice): the anaesthetist as supplier with their GST number, AA's agent block with the Provisional (OQ-29) pill, the holder's or the patient's layout (the BTM breakdown, cross-match strip and Your reference on the holder's), a split share's note, GST at the foot, and its rail: the Delivery card (Emailed, To post or No invoice address, with Resend or Send), Related invoices and the Xero handoff. Shown at half size." replaceWith="Custom (print-styled page)" note="Keep it out of a fixed Dialog for print isolation. Its rail actions write to the demo store. The Locked record's rows are the shared DefRow (UI unification U6); the rail cards keep their print voice until Phase 37." height={520}>
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

/** The History tab on the Contract the seeded AUTHORISED Face lift is locked against (catch-up Phase 25). */
function ContractHistoryExample() {
  const contractId = useAppStore((s) => {
    const bookingId = SEED_MARKERS['rangeAuthorisedBooking']?.entityId ?? ''
    return s.billing.locks[bookingId]?.procedures[0]?.contract?.id ?? ''
  })
  return contractId === '' ? null : <ContractHistory contractId={contractId} />
}

/** The dated-change warning on Merivale's Face lift from today (catch-up Phase 25a). */
function ContractChangeNoticeExample() {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const today = useToday()
  const rows = useMemo(() => stillOnContract({ schedule, masters }, 'CT-MER-FACELIFT', today), [schedule, masters, today])
  return (
    <ContractChangeNotice
      title={stillOnTitle(rows.length, shortDay(today), masters.contracts['CT-MER-FACELIFT']?.name ?? 'Face lift')}
      columns={[{ label: 'Date', mono: true }, { label: 'Procedure' }]}
      rows={rows.map((r) => ({ key: r.procedureId, bookingId: r.bookingId, dateISO: r.dateISO, patientName: r.patientName, cells: [shortDay(r.dateISO), r.procedureText ?? ''] }))}
      shot="catalogue-contract-still-on"
      rowShot="catalogue-contract-still-on-row"
    >
      {NOTHING_MOVES}
    </ContractChangeNotice>
  )
}

/** RowField (catch-up Phase 33's move): an editable NHI flagged invalid, a name, and wording kept as received. */
function RowFieldExample() {
  const [nhi, setNhi] = useState('ZQA2111')
  const [name, setName] = useState('Rosa Mendes')
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <RowField label="NHI" value={nhi} mono onChange={setNhi} width={110} invalid={nhi === 'ZQA2111'} />
      <RowField label="Name" value={name} onChange={setName} width={150} />
      <RowField label="Procedure text" value="carpal tunnel decomp L" mono readOnly width={210} />
    </div>
  )
}

/** RadioCard: three sample files, one disabled, the checked one opening its controls. */
function RadioCardExample() {
  const values = ['stg', 'mercy', 'sx'] as const
  const [value, setValue] = useState<string | undefined>('stg')
  const radio = useRovingRadio<string>({ values, value, onChange: setValue, isDisabled: (v) => v === 'sx' })
  return (
    <div {...radio.groupProps} aria-label="Sample files" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 440 }}>
      <RadioCard radio={radio.itemProps(0)} checked={value === 'stg'} onSelect={() => setValue('stg')} title="St George's" titleExtra={<span className="mono" style={{ fontSize: 12 }}>5 rows</span>} description="Theatre list, week of 27 July">
        <span style={{ fontSize: 12.5 }}>The checked card's own controls sit here.</span>
      </RadioCard>
      <RadioCard radio={radio.itemProps(1)} checked={value === 'mercy'} onSelect={() => setValue('mercy')} title="Mercy Hospital" titleExtra={<Pill size="sm">Suggested</Pill>} description="Bookings export" />
      <RadioCard radio={radio.itemProps(2)} checked={value === 'sx'} onSelect={() => setValue('sx')} title="Southern Cross" description="Admissions file" disabledReason="No file this week." />
    </div>
  )
}

/** DecisionCards: Create a Booking suggested, Create a List disabled, Reject with its reason. */
function DecisionCardsExample() {
  const [kind, setKind] = useState<DecisionKind | undefined>('createBooking')
  return (
    <div style={{ maxWidth: 440 }}>
      <DecisionCards
        options={[
          { kind: 'createBooking', title: 'Create a Booking on a List', description: 'Add the Booking to a List at this hospital that day.' },
          { kind: 'createList', title: 'Create a List in a session', description: 'A new List holding this Booking.', disabledReason: 'No anaesthetist is free on Tue 28 Jul AM.' },
          { kind: 'reject', title: 'Reject', description: 'Nothing is created or changed. The reason is kept with the row.' },
        ]}
        value={kind}
        suggested="createBooking"
        onChange={setKind}
        detail={<span style={{ fontSize: 12.5 }}>{kind === 'reject' ? 'The reason field and quick reasons.' : 'The List picker.'}</span>}
      />
    </div>
  )
}

/** OptionRow: two search results, the first the current pick. */
function OptionRowExample() {
  const [picked, setPicked] = useState('B1')
  return (
    <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 440 }}>
      {[
        { id: 'B1', name: 'Rosa Mendes', facts: 'AM · 08:30 · Dr Souter' },
        { id: 'B2', name: 'Ana Ruiz', facts: 'AM · 10:15 · Dr Souter' },
      ].map((b) => (
        <div role="listitem" key={b.id}>
          <OptionRow selected={picked === b.id} trailing={b.facts} onClick={() => setPicked(b.id)}>
            {b.name}
          </OptionRow>
        </div>
      ))}
    </div>
  )
}

/** DiffTable: a time and a note to apply, the wording replaced, an NHI shown but never applied. */
function DiffTableExample() {
  const diffs: FieldDiff[] = [
    { key: 'time', label: 'Time', current: '08:30', incoming: '09:15', effect: 'sets' },
    { key: 'procedureText', label: 'Procedure', current: 'WLE L breast', incoming: 'WLE MM L breast', effect: 'replaces' },
    { key: 'note', label: 'Note', current: null, incoming: 'Latex allergy', effect: 'appends' },
    { key: 'nhi', label: 'NHI', current: 'ZAB1234', incoming: 'ZAB1243', effect: 'flagged' },
  ]
  const [unticked, setUnticked] = useState<ReadonlySet<IncomingFieldKey>>(new Set())
  return (
    <div style={{ maxWidth: 440 }}>
      <DiffTable
        diffs={diffs}
        tickable={(d) => d.effect !== 'flagged'}
        unticked={unticked}
        onToggle={(key) =>
          setUnticked((cur) => {
            const next = new Set(cur)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
          })
        }
      />
    </div>
  )
}

/** The seeded rooms' PDF List and the hospital's List, as the drawer shows them (catch-up Phase 34). */
function ListOriginExample() {
  const lists = useAppStore((s) => s.schedule.lists)
  return (
    <DefList>
      {[SEED_ORIGIN_LISTS.pdf, SEED_ORIGIN_LISTS.hospital].map((id) => (lists[id] !== undefined ? <ListOriginRow key={id} list={lists[id]!} /> : null))}
    </DefList>
  )
}

