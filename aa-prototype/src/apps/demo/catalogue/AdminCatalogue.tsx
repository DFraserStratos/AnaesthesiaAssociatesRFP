import { InfoTip } from '../../../shared/help/InfoTip'
import { OFFICE_ACTOR } from '../../../store'
import { SyntheticDataBadge } from '../../../shared/SyntheticDataBadge'
import { Notice } from '../../../shared/ui'
import { neutral } from '../../../theme/tokens'
import { Pager } from '../../admin/components/Pager'
import { GroupIndex } from '../../admin/components/GroupIndex'
import { SCALE_GENERATING_LINE } from '../../../shared/scale/ScaleBanner'
import { StubSetExample } from './stubExamples'
import { DRAFT_LIST, DRAFT_LISTS, UNASSIGNED } from '../../../shared/scheduleTerms'
import { ResponseTableExample, SupportHoursExample, SupportPanelExample, SupportRequestFormExample, SupportSidePanelExample, TicketListExample } from './supportExamples'
import { CataloguePage, CatalogueRow, FamilySection, StageHint } from './CatalogueKit'
import { AdminPageExample, CardExample, DefRowExample, EyebrowExample, PageHeaderExample, TableKitExample } from './admin/pageChromeExamples'
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
import { DefList, Disclosure, DisclosureButton, OptionRow, Pill, RadioCard, useRovingRadio } from '../../../shared/ui'
import { useMemo, useState } from 'react'
import { HospitalsView } from '../../admin/screens/masters/HospitalsView'
import { RvgGroupsView } from '../../admin/screens/masters/RvgGroupsView'
import { EmailTemplatesView } from '../../admin/screens/masters/EmailTemplatesView'
import { PrepaymentLettersView } from '../../admin/screens/masters/PrepaymentLettersView'
import { LetterPreviewExample, PrepaidSettlementExample, PrepaymentHistoryExample, PrepaymentHonourLineExample } from './prepaymentFollowupExamples'
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
  NewContractPageExample,
  NewContractRailExample,
  PriceRangesTableExample,
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
  PaymentCyclePanelExample,
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
import { LedgerPaymentRunsExample, RemittanceAdviceDocumentExample } from './admin/paymentRunExamples'
import { SharedNotesExample, StrengthPillExample, WarningPreviewRowExample } from './patientAlertExamples'
import { PatientBalanceThresholdExample, PatientRecordExample, PatientsSearchExample, WaitingNhiExample } from './admin/patientExamples'
import { DetailChoiceTableExample, NhiLookupStatusExample, RegisterRefreshRowExample } from './admin/nhiLookupExamples'
import { ProcedureStackExample } from './procedureStackExample'
import { FunderDetailsExample, PayerFieldsExample } from './payerExamples'
import { PaidByRowExample, PaidBySheetExample, PartyPickerExample } from './splitExamples'
import {
  AdditionalInvoiceButtonExample,
  AdditionalInvoiceSheetExample,
  ContractEventFeesExample,
  EventSheetsExample,
  CreditNoteButtonExample,
  SplitAllocationExample,
  SplitCombinedButtonExample,
  CreditNoteDocumentExample,
  CreditSheetExample,
  EventReviewSheetExample,
  OptionChipExample,
  CorrectInvoiceCardExample,
  CreditTrailsExample,
  CorrectionRetryExample,
  ProcedureEventsListExample,
} from './eventExamples'
import { LockBadge } from '../../../shared/booking/LockBadge'
import { ANAE, SEED_MARKERS } from '../../../domain/seed'
import { RateTierCard } from '../../admin/components/RateTierCard'
import { AnaesthetistStatusCard } from '../../admin/components/AnaesthetistStatusCard'
import { AnaesthetistHistoryCard } from '../../admin/components/AnaesthetistHistoryCard'
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
      intro="Every hand-built component in the Admin app, one per row, grouped by component family, each naming the shared component it is or is built on. Each live example is the real component: click, type and open it. Where a row changes the demo store it says so; Demo reset puts it back."
    >
      {/* ------------------------------------------------------------------ */}
      <FamilySection id="actions">
        <CatalogueRow name="Button" source="shared/ui/Button.tsx" usedIn={AWM} what="The one button (UI unification U5): primary, secondary, the teal outline the mockups draw, the tinted pill and the one red danger outline (Cancel booking only, question 8); the touch size (54, 48, 44: sheet footers keep the 54px primary, question 7), desktop (44, radius 12) and compact (36); one disabled treatment and a printed disabled reason; the teal focus ring and a desktop hover. Catch-up Phase 35 adds href: a link styled as the button (the update email's mailto:), the same disabled button while disabled." shared="shared/ui/Button.tsx" note="Replaced ActionBtn, PanelAction and the hand-rolled teal outlines. Press feedback stays in global.css.">
          <ButtonExample />
        </CatalogueRow>
        <CatalogueRow name="Disclosure" source="shared/ui/Disclosure.tsx" usedIn={AW} what="Show and hide a section under its summary (UI unification U7): a type=button summary with aria-expanded, the turning chevron where the screen draws one, and HistoryTimeline's grid-rows opening (none under reduced motion); closed, the section is inert. Its DisclosureButton is the bare chevron toggle for a table row or a card heading. Used by the pairing Ended section, Not available, the recurring Booking's detail lists, a history row's steps, AA fees, payables and the Billing monitor." shared="shared/ui/Disclosure.tsx" note="Replaced three native details and five hand-made toggles.">
          <DisclosureExample />
        </CatalogueRow>
        <CatalogueRow name="TickButton" source="shared/ui/TickButton.tsx" usedIn={AW} what="The office's 'dealt with' control: a teal outline button with a check, used by To-do Clear and notice Resolve." shared="shared/ui/TickButton.tsx">
          <TickButtonExample />
        </CatalogueRow>
        <CatalogueRow name="BookingUpdateEmailButton / NotificationEmailAction / useListUpdateEmail" source="apps/admin/flows/UpdateEmailActions.tsx" usedIn={A} what="Where the update email opens from: the Admin Booking header's Draft update email (outline Button with the Mail icon, disabled with its reason while the page has unsaved changes or nothing saved to email), the List drawers' Draft update email once a List has an emailable change of anaesthetist, and the notification page's Draft cover-change email on a List moved to a colleague (a return to the office points to the unassigned List instead)." shared="shared/ui/Button.tsx" note="Shown here: the Booking button on a seeded Booking, outside any draft.">
          <BookingUpdateEmailButtonExample />
        </CatalogueRow>
        <CatalogueRow name="AdditionalInvoiceButton" source="shared/booking/AdditionalInvoiceButton.tsx" usedIn={AWM} what="The button on the Procedure's Paid by row, beside Split (catch-up Phase 38b; US-08.6.3 Button): Create additional invoice, for the office on any invoiced Procedure and for the anaesthetist on their own; absent on a colleague's or before the List is authorised; disabled with the refusal sentence otherwise." shared="shared/booking/AdditionalInvoiceButton.tsx" note="Shown as the office on David Chen's HP03 (an invoiced history Procedure).">
          <AdditionalInvoiceButtonExample />
        </CatalogueRow>
        <CatalogueRow name="CreditNoteButton" source="shared/booking/CreditNoteButton.tsx" usedIn={AWM} what="The credit note option on the Procedure's Paid by row, beside Create (or Raise) additional invoice and Split (catch-up Phase 39; US-08.6.5): the office's on any invoiced Procedure, the anaesthetist's on their own (creditOptionFor), crediting the Procedure's live invoice in full through the app's credit sheet (a prepayment invoice whole, from the PrepaidSettlementBlock, catch-up Phase 41); hidden on a colleague's, disabled with its sentence while a credit is pending or once credited, and while the Booking has unsaved changes." shared="shared/booking/CreditNoteButton.tsx" note="Shown as the office on David Chen's HP03.">
          <CreditNoteButtonExample />
        </CatalogueRow>
        <CatalogueRow name="SplitCombinedButton" source="shared/booking/SplitCombinedButton.tsx" usedIn={A} what="Split into additional invoices on the Procedure's Paid by row, beside Credit note (catch-up Phase 39; US-08.6.4): the office's only, opening the split sheet on the Procedure's live invoice; disabled with canSplitCombined's sentence otherwise (Not invoiced yet. Edit the Booking's Procedures, Contracts and prices instead.), while a credit waits, once credited, on a prepaid Procedure and while the Booking has unsaved changes. The invoice rail's Correct this invoice card has the same button." shared="shared/booking/SplitCombinedButton.tsx" note="Shown on David Chen's invoiced HP03; it opens the real split sheet.">
          <SplitCombinedButtonExample />
        </CatalogueRow>
        <CatalogueRow name="CorrectionRetry (Billing monitor)" source="apps/admin/screens/BillingMonitorScreen.tsx" usedIn={A} what="Resolve and retry on a Billing monitor Booking row whose credit's Xero correction failed (catch-up Phase 39, work item 13): retries the queue item now, which reverses the original's Xero records and creates the new pairs together, or sets the next try. Shown on any row with a failed correction, a failed billing row included (beside its Retry). The office actor is a prop." shared="shared/ui/Button.tsx" note="Renders only while a correction waits after a failed attempt.">
          <CorrectionRetryExample />
        </CatalogueRow>
      </FamilySection>

      {/* ------------------------------------------------------------------ */}
      <FamilySection id="pills">
        <CatalogueRow name="StatusLegend (chips)" source="shared/StatusLegend.tsx" usedIn={AWM} what="The List kinds and availability statuses from the status master. With a toggle handler each chip hides or shows that status on the grid." shared="shared/StatusLegend.tsx">
          <StatusLegendExample />
        </CatalogueRow>
        <CatalogueRow name="StatusChip" source="shared/StatusChip.tsx" usedIn={AWM} what="A small tinted chip for a List kind or availability status, coloured from the status master." shared="shared/StatusChip.tsx">
          <StatusChipExample />
        </CatalogueRow>
        <CatalogueRow name="Pill" source="shared/ui/Pill.tsx" usedIn={AWM} what="The one label pill (UI unification U3): neutral, success, warning and error tones; sm, md (inline) and lg (table, the Admin Review size); a tint, a full-alpha outline, or onInk (catch-up Phase 43: quiet white on the dark harness bar and admin side nav); a leading icon or dot. Never teal or crimson, so no pill reads as a button." shared="shared/ui/Pill.tsx">
          <PillExample />
        </CatalogueRow>
        <CatalogueRow name="SyntheticDataBadge" source="shared/SyntheticDataBadge.tsx" usedIn="Harness bar" what="Synthetic data only (catch-up Phase 43; US-15.0.6): an environment marker on a Pill with a shield icon and its tooltip, onInk in the prototype's harness bar only (it is not repeated inside the apps). The neutral outline tone stays for a light surface. Neutral: never crimson, teal or the demo warning tint." shared="shared/SyntheticDataBadge.tsx">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ background: neutral.ink, padding: 8, borderRadius: 8 }}><SyntheticDataBadge tone="onInk" /></span>
            <SyntheticDataBadge tone="onLight" />
          </div>
        </CatalogueRow>
        <CatalogueRow name="MasterPills" source="apps/admin/components/MasterPills.tsx" usedIn={A} what="Admin's import path for Pill, used for Party kinds, Contract tags, Active and RVG anatomy headings." shared="shared/ui/Pill.tsx" note="A re-export only.">
          <MasterPillsExample />
        </CatalogueRow>
        <CatalogueRow name="TierPill / PreferredPill / NotPreferredPill" source="apps/admin/components/pairing/Pills.tsx" usedIn={A} what="The office-only pairing pills over the shared Pill: priority tier, preferred pairing (success tint, question 15) and not preferred (warning outline)." shared="shared/ui/Pill.tsx">
          <PairingPillsExample />
        </CatalogueRow>
        <CatalogueRow name="RateTierCard" source="apps/admin/components/RateTierCard.tsx" usedIn={A} what="The anaesthetist's rate per unit and priority tier on one card (build plan Phase 50; US-01.3.6, DM-09; people-section.html #tier). At rest: the rate (mono) and the tier with a mist office only, and Edit. Editing (the Card's editing and footer): the rate field, the tier as a Segmented control that moves a local draft only (a click never saves) with its office-only hint, Cancel and Save. Save writes only what changed, the rate then the tier in one change set, so one save is one audited change; a refusal shows on the card. Self-contained: anaesthetistId and actor." shared="shared/ui/Card.tsx" note="Live on Dr Priya Sharma: press Edit for the editing state. Save writes to the demo store.">
          <RateTierCard anaesthetistId={ANAE.sharma} actor={OFFICE_ACTOR} />
        </CatalogueRow>
        <CatalogueRow name="AnaesthetistStatusCard / MakeInactiveSheet / MakeActiveSheet" source="apps/admin/components/AnaesthetistStatusCard.tsx" usedIn={A} what="Whether an anaesthetist is active (build plan Phase 52; US-12.1.6; people-section.html #inactive): Active since a day with Make inactive; Inactive from a last day with the reason and Clear last day; Inactive since the day after with Make active. Make inactive opens MakeInactiveSheet (ConfirmSheet: the last day, the Lists after it that refuse it, each opening its day, what happens after it, the reason). Make active opens MakeActiveSheet (ConfirmSheet: the Contracts the system disabled with them, each ticked with its price). Self-contained: anaesthetistId and actor." shared="shared/surface/ConfirmSheet.tsx" note="Live on Dr Priya Sharma: Make inactive opens the sheet with her Lists after today. Confirming writes to the demo store.">
          <AnaesthetistStatusCard anaesthetistId={ANAE.sharma} actor={OFFICE_ACTOR} />
        </CatalogueRow>
        <CatalogueRow name="AnaesthetistHistoryCard" source="apps/admin/components/AnaesthetistHistoryCard.tsx" usedIn={A} what="An anaesthetist's past work, readable whatever their status (build plan Phase 52; US-12.1.6 History readable): the latest five past Lists in a dense table, See all expanding in place, and Invoices and payments to their ledger page." shared="shared/ui/Card.tsx" note="Live on Dr Priya Sharma.">
          <AnaesthetistHistoryCard anaesthetistId={ANAE.sharma} />
        </CatalogueRow>
        <CatalogueRow name="ChangedSinceSubmittedPill" source="apps/admin/components/ChangedSinceSubmitted.tsx" usedIn={A} what="Flags a submitted List the anaesthetist has changed since submitting, with the count and time of the last change." shared="shared/ui/Pill.tsx" note="Driven by a local cue here: the seed has no changed submitted List.">
          <ChangedSinceSubmittedExample />
        </CatalogueRow>
        <CatalogueRow name="DraftListParts" source="apps/admin/components/draftLists/DraftListParts.tsx" usedIn={A} what={`${DRAFT_LIST} badges: ${UNASSIGNED}, the DRAFT state chip, the waiting time (amber past a day) and the booking count.`} shared="shared/ui/Pill.tsx">
          <DraftListPartsLive />
        </CatalogueRow>
        <CatalogueRow name="AttentionDot" source="shared/warnings/AttentionDot.tsx" usedIn={AWM} what="The solid attention disc (UI unification U3, from ConflictDot): a 13px '!' for a conflict or a List that needs the office, a triangle for warnings, muted once cleared. A marker, never a control: aria-hidden unless labelled. WarningTriangle and the Day grid and calendar marks draw it." shared="shared/warnings/AttentionDot.tsx">
          <AttentionDotExample />
        </CatalogueRow>
        <CatalogueRow name="WarningTriangle" source="shared/warnings/WarningTriangle.tsx" usedIn={AWM} what="The warning mark on a booking, coloured by the strongest open warning." shared="shared/warnings/WarningTriangle.tsx">
          <WarningTriangleExample />
        </CatalogueRow>
        <CatalogueRow name="StrengthPill" source="shared/warnings/StrengthPill.tsx" usedIn={AWM} what="A warning's strength, Mild or Strong, as an outline pill in the warning's own tone (mild amber, strong red), neutral once cleared (catch-up Phase 40). The one strength pill: the warnings panel, the preview row, the patient record's Billed to the patient tile and the Patients search and Follow-up tables." shared="shared/warnings/StrengthPill.tsx" note="On the shared Pill. Replaced WarningsPanel's private copy, the patient screens' copy and WarningPreviewRow's inline one.">
          <StrengthPillExample />
        </CatalogueRow>
        <CatalogueRow name="LockBadge" source="shared/booking/LockBadge.tsx" usedIn={AWM} what="Contract locked at authorise (catch-up Phase 25; US-04.3.5): the shared neutral Pill with the lock glyph on a Booking whose List is AUTHORISED, in the Billing card on all three apps and the office's billing setup; who locked it and when on hover, or as a detail line on web and Admin. Never a seventh status colour." shared="shared/booking/LockBadge.tsx" note="Shown on the seeded AUTHORISED Face lift, locked at seed time.">
          <LockBadge bookingId={SEED_MARKERS['rangeAuthorisedBooking']?.entityId ?? ''} detail />
        </CatalogueRow>
        <CatalogueRow name="Billing pipeline (PipelineDetail)" source="apps/admin/screens/BillingMonitorScreen.tsx" usedIn={A} what="Inside an expanded List on the Billing monitor (catch-up Phase 37 restyle): each stage (authorised, run, invoices, emailed, Xero) as the shared Pill, joined by arrows, in an ol named Billing pipeline with each stage's state in text." shared="shared/ui/Pill.tsx" note="Not exported: rebuilt here from the shared Pill, fed by the real billingMonitor selector. The monitor's status pills and Retry are the shared Pill and Button.">
          <PipelineStepperExample />
        </CatalogueRow>
      </FamilySection>

      {/* ------------------------------------------------------------------ */}
      <FamilySection id="fields">
        <CatalogueRow name="SupportRequestForm" source="shared/support/SupportRequestForm.tsx" usedIn={AWM} what="The request form (catch-up Phase 43b): Subject, Priority (Segmented P1 to P4 with its meaning), Description and Send; out of hours on the help line the What is happening? radio chips; on product support the Kind and the new-feature line. Shown out of hours; Send here only shows a refusal." shared="shared/support/SupportRequestForm.tsx">
          <SupportRequestFormExample />
        </CatalogueRow>
        <CatalogueRow name="SharedNotes" source="shared/notes/SharedNotes.tsx" usedIn={AWM} what="The shared note on a List (the Day drawer) or Booking (the Booking detail) (catch-up Phase 40; US-11.3.3): Add note and the notes, newest first, with author and time. The office and the anaesthetist both read and add; a blank note is refused." shared="shared/notes/SharedNotes.tsx" note="One component in all three apps; compact in the drawer. Writes the real store, never the Booking draft. Here on local notes (SharedNotesPanel), so nothing is written.">
          <SharedNotesExample size="compact" by="Kirsty W." />
        </CatalogueRow>
        <CatalogueRow name="NameSearchBox" source="shared/ui/NameSearchBox.tsx" usedIn={AWM} what="The one search box in all three apps since UI unification U4: field (48px) and pill (36px, or 38px on the web Lists row) sizes; fill well (grey) inside a sheet, card or drawer and surface (white, the default) on the page; a clear button (clearLabel, a 44px touch target on the phone), Escape clears, testId and shot hooks. Each caller filters its own rows." shared="shared/ui/NameSearchBox.tsx" note="WebSearchField and the mobile Lists input are gone: both Lists pages use it. The aa-field class gives it the one teal focus ring.">
          <NameSearchBoxExample />
        </CatalogueRow>
        <CatalogueRow name="SurgeonPicker" source="apps/admin/components/pairing/SurgeonPicker.tsx" usedIn={A} what="A native select of surgeons with a 'Not preferred with Dr X' optgroup for the chosen anaesthetist, on the shared SelectField (UI unification U4): a label (or hideLabel), size, fill and width." shared="shared/ui/Field.tsx" note="Stays a native select (the catch-up 17 ruling). The list is long and not searchable. Opens on an anaesthetist with a not-preferred surgeon, so the second optgroup shows.">
          <SurgeonPickerExample />
        </CatalogueRow>
        <CatalogueRow name="ChipMultiSelect" source="apps/admin/components/ChipMultiSelect.tsx" usedIn={A} what="A native 'Add a...' select plus removable chips: a Contract's specialties and, since UI unification U4, its linked surgeons (the editor's private SurgeonPicker is gone). The select draws the one field chrome and its hint is the shared FieldHint. Also a surgeon's specialties." shared="shared/ui/Field.tsx">
          <ChipMultiSelectExample />
        </CatalogueRow>
        <CatalogueRow name="ContactFields" source="apps/admin/components/ContactFields.tsx" usedIn={A} what="One contact's Name, Email (mono) and Phone on the shared TextField, in a fieldset its legend names (catch-up Phase 17b, US-13.6.5). The surgeon edit sheet uses it for the personal contact and for each office contact set; a set after the first carries a minus IconButton that removes it whole, and the store's refusal for a bad email shows under the set." shared="shared/ui/Field.tsx" note="Local state only.">
          <ContactFieldsExample />
        </CatalogueRow>
        <CatalogueRow name="CodePickerSheet" source="shared/capture/CodePickerSheet.tsx" usedIn={AWM} what="The RVG code type-ahead in an Overlay titled by an OverlayHeader: search by code or description, every match rendered. Its search is the shared NameSearchBox in the well fill (UI unification U4)." shared="shared/capture/CodePickerSheet.tsx">
          <CodePickerExample />
        </CatalogueRow>
        <CatalogueRow name="PatientBalanceThresholdView" source="apps/admin/screens/masters/PatientBalanceThresholdView.tsx" usedIn={A} what="Master data's Patient balance warning (catch-up Phase 40; US-11.3.2): one number field, 1 to 730 days, saved through setPatientBalanceThreshold, with its caption and History." shared="shared/ui/Field.tsx" note="On the shared MasterHeader, Card, TextField, Button, ResultLine and HistorySheet.">
          <PatientBalanceThresholdExample />
        </CatalogueRow>
        <CatalogueRow name="VacatedSessionChoice / StatusRadioGroup" source="shared/flows/VacatedSessionChoice.tsx" usedIn={AWM} what="A radio group of status chips: what the vacated session becomes after a move. Its keyboard is the shared useRovingRadio (UI unification U4): one Tab stop, arrows move and select, Home and End jump to the ends." shared="shared/flows/VacatedSessionChoice.tsx" note="The same hook drives the Contract rail's answers (RailOptionGroup), where a move only focuses.">
          <VacatedChoiceExample />
        </CatalogueRow>
        <CatalogueRow name="RailOptionGroup" source="shared/contracts/railParts.tsx" usedIn={AWM} what="One step of the Contract chooser as a named radio group (UI unification U4): list rows with a count (the step rail sheet) or tiles with None for this List (the Billing card), a Suggested pill on the funder's path, unselectable answers dimmed. Arrow keys move focus only; Space, Enter or a click picks, because a pick saves and moves on." shared="shared/contracts/railParts.tsx" note="Static options here; Phase 23 builds Make primary on it. Nothing writes to the demo data.">
          <RailOptionGroupExample />
        </CatalogueRow>
        <CatalogueRow name="RadioCard" source="shared/ui/RadioCard.tsx" usedIn={A} what="One option of a radio group drawn as a card (catch-up Phase 33's review): the radio dot, a title with an optional pill or count beside it, slate lines, and the checked card's own controls under it. Checked is the teal accent (an accent border doubled by a 1px inset ring, the rail tiles' edge) on white; a disabled card sits on the bg fill with its reason. Keyboard from useRovingRadio; Space, Enter or a click selects. Matching's import dialog and decision cards use it." shared="shared/ui/RadioCard.tsx">
          <RadioCardExample />
        </CatalogueRow>
        <CatalogueRow name="DecisionCards (Matching)" source="apps/admin/matching/DecisionCards.tsx" usedIn={A} what={`The Matching row panel's decision: RadioCards for Match and apply, Create a Booking, Create a List, Create a ${DRAFT_LIST} and Reject, the suggested one marked with the Contract rail's Suggested pill, a disabled card showing why, and the chosen card opening its own controls.`} shared="shared/ui/RadioCard.tsx" note="Static options here; nothing writes to the demo data.">
          <DecisionCardsExample />
        </CatalogueRow>
        <CatalogueRow name="OptionChip" source="shared/ui/OptionChip.tsx" usedIn={AWM} what="A quick option chip (catch-up Phase 39): a teal-tint pill that fills or picks one answer in a form, beside the field it serves (the credit's reasons over its reason text); pressed is the teal border and tint with aria-pressed; size md 36 or lg 44 on the phone. Not FilterPills, the solid teal list filter." shared="shared/ui/OptionChip.tsx" note="The availability form's chips are this; the funder sheet's and the credit's choice of invoice use its radio role (aria-checked) inside a radiogroup.">
          <OptionChipExample />
        </CatalogueRow>
        <CatalogueRow name="OptionRow" source="shared/ui/OptionRow.tsx" usedIn={A} what="One result in a short pick list under a search box (catch-up Phase 33's review, Matching's Match to another Booking): a full-width bordered button, words left and mono facts right; the current pick in the teal accent edge and tint, with aria-pressed. The nav variant (Phase 47) is an index pane's item: borderless, slate, teal on the accent tint with aria-current when picked, a mono count at the right (GroupIndex). A table row that opens a record is ClickableRow instead." shared="shared/ui/OptionRow.tsx">
          <OptionRowExample />
        </CatalogueRow>
        <CatalogueRow name="GroupIndex" source="apps/admin/components/GroupIndex.tsx" usedIn={A} what="An index of groups with their counts beside a grouped list (build plan Phase 47, the Contract catalogue; contracts-section.html #catalogue): All first, then each group as an OptionRow nav item, a mist caption where the section changes, an optional note under the list. Generic, for the Parties tab too." shared="shared/ui/OptionRow.tsx">
          <GroupIndexExample />
        </CatalogueRow>
        <CatalogueRow name="Switch" source="shared/ui/Switch.tsx" usedIn={AWM} what="The one on/off switch (UI unification U4): a button with role=switch and aria-checked, so click and Space toggle it; sm is the 36 by 20 track, lg the 52 by 32 touch track, with a label and an optional description." shared="shared/ui/Switch.tsx" note="No product screen uses it yet: Phase 27 builds its approval-step toggle on it. The PWA panel's ToggleRow stays its own (a demo surface).">
          <SwitchExample />
        </CatalogueRow>
        <CatalogueRow name="ShowRetiredToggle / RetiredPill" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="Show retired on the shared Switch with the retired count as its description, off by default; a retired row in mist on the bg band (retiredRowStyle) with the neutral Retired pill, its reason in the title." shared="shared/ui/Switch.tsx" note="Local state only: three made-up hospitals, one retired.">
          <ShowRetiredToggleExample />
        </CatalogueRow>
        <CatalogueRow name="TextField" source="shared/ui/Field.tsx" usedIn={AWM} what="The one labelled single-line input, about 77 uses in Admin: text, date, time, number, email or phone; mono; a FieldHint tied by aria-describedby; and since UI unification U4 invalid (aria-invalid and the error border), inputMode and align for amounts, min, max, step, list, size (48px field or 36px compact), fill (well or surface) and hideLabel. Catch-up Phase 17b adds accessibleName, a fuller name where the visible label repeats on the page (Office contact 2 email). Catch-up Phase 40a adds hintTone success (the NHI's Valid NHI) and passes autoCapitalize and spellCheck to the input." shared="shared/ui/Field.tsx" note="Every default keeps the old look (48px, grey well).">
          <TextFieldExample />
        </CatalogueRow>
        <CatalogueRow name="RowField" source="apps/admin/components/RowField.tsx" usedIn={A} what="The small labelled in-row input for correcting one field of an incoming row: the Matching panel's name, date of birth and time (catch-up Phase 33 moved it out of PdfReview; Phase 34's PDF list review uses the shared TextField, compact, instead). Mono, an invalid border, and a read-only look for wording kept as received." shared="Stays custom" note="A near twin of TextField's compact size.">
          <RowFieldExample />
        </CatalogueRow>
        <CatalogueRow name="TextArea" source="shared/ui/Field.tsx" usedIn={AWM} what="The one multi-line input: a visible label or ariaLabel, a hint, and since UI unification U4 a counter (maxLength, cap, countTrimmed), compact density (the rail's day note), fill and resize. The rail's day note, the modifier reason and the Alert the office note moved onto it." shared="shared/ui/Field.tsx">
          <TextAreaExample />
        </CatalogueRow>
        <CatalogueRow name="FieldHint" source="shared/ui/Field.tsx" usedIn={AWM} what="The one quiet line under a field (UI unification U4): 12px mist, or error-coloured (catch-up Phase 40a adds slate, success and warning tones, shot, live and data-* passthrough), tied to the field by id and aria-describedby. TextField, TextArea, SelectField, Checkbox and TimeRangeFields draw it from their hint prop; it also stands alone under any control." shared="shared/ui/Field.tsx">
          <FieldHintExample />
        </CatalogueRow>
        <CatalogueRow name="SelectField" source="shared/ui/Field.tsx" usedIn={AWM} what="The one labelled native select (UI unification U4): TextField's chrome and focus ring, size field (48px, in sheets) or compact (36px, toolbars), fill well (grey, inside white containers) or surface (white, on the page), hideLabel, width, a hint, shot on the select." shared="shared/ui/Field.tsx" note="Stays native: the capture recipes selectOption it, and native selects were kept by ruling.">
          <SelectFieldExample />
        </CatalogueRow>
        <CatalogueRow name="Checkbox" source="shared/ui/Checkbox.tsx" usedIn={AWM} what="The one checkbox (UI unification U4): a native box in the action teal, never the browser blue, inside its label, so a click on the words toggles it and Space works. md 16px or lg 20px (a mobile card), with an optional hint." shared="shared/ui/Checkbox.tsx" note="Replaced the hand copies: the rail's day flag, the status sheet's flags, surgeon groups, an RVG group's range, the payer tick and the Paid by offer, the colleague move sheet, Conflicts and Notifications.">
          <CheckboxExample />
        </CatalogueRow>
        <CatalogueRow name="BackstopAmountField" source="shared/contracts/railParts.tsx" usedIn={AWM} what="The typed amount on No contract · Fixed price (UI unification U4): TextField's chrome at the rail's 44px, mono, a decimal keypad, aria-invalid with the hint saying why, saved on blur or Enter, with an optional inline action beside it." shared="shared/contracts/railParts.tsx" note="Local state here; in the Billing card and the step rail sheet it writes the price.">
          <BackstopAmountFieldExample />
        </CatalogueRow>
        <CatalogueRow name="RetireSection" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="Retire (with a required reason) or Reinstate at the foot of a hospital, surgeon, surgeon group or AA modifier edit sheet: a refused retire lists the store's blockers in a warning Notice; a retired record shows its day and reason." shared="shared/ui/Field.tsx" note="Shown for the first seeded surgeon group; Retire and Reinstate write to the demo store.">
          <RetireSectionExample />
        </CatalogueRow>
        <CatalogueRow name="HpiCpnField / BankAccountFields" source="apps/admin/flows/anaesthetistFields.tsx" usedIn={A} what="The anaesthetist's mandatory HPI CPN and bank account name and number (catch-up Phase 26), shared by Add an anaesthetist and the Edit sheet: marked required, checked inline (the error hint in the store's own words, data-validation-invalid on the field), Save disabled with its reason until all three are filled." shared="shared/ui/Field.tsx" note="Local state only; nothing writes to the demo data. The full bank number shows only here, in the office's editor.">
          <AnaesthetistFieldsExample />
        </CatalogueRow>
        <CatalogueRow name="RVG anatomy datalist" source="apps/admin/screens/masters/RvgGroupsView.tsx" usedIn={A} what="RvgGroupSheet's anatomy heading: free text with the known headings suggested by a native datalist, through TextField's list prop since UI unification U4." shared="shared/ui/Field.tsx" note="RvgGroupSheet is not exported: rebuilt from its markup and the real ANATOMY_HEADINGS. The real one opens from Add group in the RvgGroupsView row, whose anatomy filter is a compact SelectField.">
          <AnatomyDatalistExample />
        </CatalogueRow>
        <CatalogueRow name="PayerFields (DifferentPayerTick, OtherPayerFields, PostalAddressFields)" source="shared/flows/PayerFields.tsx, PostalAddressFields.tsx" usedIn={AWM} what="The payer form's parts, in PaidBySheet's Who pays and the add forms: the Different payer tick (the shared Checkbox at lg, in its card, since UI unification U4), then the other payer's name, relationship chips, email, NZ Post postal address and phone, all on the shared TextField." shared="shared/flows/PayerFields.tsx" note="Local state only; nothing writes to the demo data.">
          <PayerFieldsExample />
        </CatalogueRow>
        <CatalogueRow name="PartyPicker" source="shared/booking/PartyPicker.tsx" usedIn={AWM} what="Choose who an invoice goes to (catch-up Phases 22 and 22a): the Procedure's payer and the Contract's party first, then every Party, searchable by name, and with onAnotherPerson a last row, Another person, for someone who is no Party. The split's party field in PaidBySheet; Phases 38b, 39 and 39b reuse it." shared="shared/booking/PartyPicker.tsx" note="Fixed options on local state; nothing writes to the demo data.">
          <PartyPickerExample />
        </CatalogueRow>
        <CatalogueRow name="NoContractGroup / ContractGroupHeading" source="shared/contracts/railParts.tsx" usedIn={AWM} what="The No contract heading with the destination's two backstops under it, No contract · RVG then No contract · Fixed price, at the top of every Contract list (UI unification U4). Each list draws its own rows: the sheet's radio rows, the Billing card's combo options." shared="shared/contracts/railParts.tsx" note="The backstops are read from the seed; the rows here are a local rebuild of the sheet's and nothing writes to the demo data.">
          <NoContractGroupExample />
        </CatalogueRow>
        <CatalogueRow name="AnaesthetistCandidates" source="apps/admin/components/pairing/AnaesthetistCandidates.tsx" usedIn={A} what="The ranked anaesthetist picker: a name search (the shared NameSearchBox in the well fill inside its sheet, UI unification U4), a tier filter and tiered, shuffled-within-tier rows." shared="shared/ui/PickRow.tsx" note="Ranking is a domain rule; adds listbox semantics and arrow keys." height={420}>
          <AnaesthetistCandidatesExample />
        </CatalogueRow>
        <CatalogueRow name="DraftListCandidates" source="apps/admin/components/pairing/DraftListCandidates.tsx" usedIn={A} what={`Who can take a ${DRAFT_LIST}: a name search (the shared NameSearchBox in the well fill, UI unification U4), free colleagues first, not-preferred ones apart, occupied sessions linked to their List.`} shared="shared/ui/PickRow.tsx" height={420}>
          <DraftListCandidatesExample />
        </CatalogueRow>
      </FamilySection>

      {/* ------------------------------------------------------------------ */}
      <FamilySection id="dates">
        <CatalogueRow name="DayNav (with SortToggle)" source="apps/admin/components/DayNav.tsx" usedIn={A} what="The Day view toolbar: week and day steppers, Today, the shared DateJumpInput (36px, named Go to date, bounded by the horizon; UI unification U4), the Roster order or A to Z choice and Find available. Since UI unification U5 the step buttons are IconButtons named Previous day and Next day, the week steps and Today are the compact Button, and SortToggle is the small SlidingSegmentedControl (Row order)." shared="shared/ui/DateFields.tsx" note="Its title is the shared PageHeader (admin, 24/30) since UI unification U6.">
          <DayNavExample />
        </CatalogueRow>
        <CatalogueRow name="MiniCalendar (RightRail)" source="apps/admin/components/RightRail.tsx" usedIn={A} what="The rail's month calendar with roving focus, arrows, Home and End, Page Up and Down, and today in crimson. Its keys are the shared useCalendarKeys (UI unification U4, unbounded so paging past the horizon still lands on Admin Day); its day note is the compact TextArea with a Checkbox flag." shared="shared/calendar/useCalendarKeys.ts" note="On the shared Card (padding card) since UI unification U6." height={420}>
          <RightRailExample />
        </CatalogueRow>
        <CatalogueRow name="HospitalCalendar" source="apps/admin/screens/masters/HospitalsView.tsx" usedIn={A} what="One hospital's month of closures and Lists: a closure opens it to change or delete, an open day adds one." shared="shared/calendar/useCalendarKeys.ts" note="Not exported: the row mounts the real HospitalsView; choose Calendar. Saving a holiday writes to the demo store." height={520}>
          <Wide minWidth={900}>
            <HospitalsView actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="Native date input (TextField type=date)" source="shared/ui/Field.tsx" usedIn={AWM} what="The browser's own date input inside a sheet, about a dozen times in Admin (holidays, a new or redated List's day, recurring bookings, a Contract's first price), with min and max bounds where a day must fall inside the horizon. Toolbars use DateJumpInput and filter bars FilterDateInput." shared="shared/ui/Field.tsx" note="Pass the demo clock's today and the horizon as bounds.">
          <DateFieldExample />
        </CatalogueRow>
        <CatalogueRow name="DateJumpInput" source="shared/ui/DateFields.tsx" usedIn={AW} what="The toolbar control that sends a screen to a chosen day (UI unification U4): Admin Day's 36px input named Go to date and the web Lists page's 38px one with its label beside it. Only a full day inside min and max is taken (no partial years while typing); clearing it hands up null." shared="shared/ui/DateFields.tsx" note="Stays one native input, as the Playwright specs read date inputs by position. The phone keeps its Go to a date sheet.">
          <DateJumpInputExample />
        </CatalogueRow>
        <CatalogueRow name="FilterDateInput" source="shared/ui/DateFields.tsx" usedIn={AW} what="The filter-bar date (UI unification U4): compact and white on the page, its label above (the Admin filter bars, as AuditViewer's From and To) or inline (the web Lists row's To, 38px)." shared="shared/ui/DateFields.tsx" note="Phase 37's From and To build on it.">
          <FilterDateInputExample />
        </CatalogueRow>
        <CatalogueRow name="SessionTimesFields" source="apps/admin/flows/SessionTimesFields.tsx" usedIn={A} what="A session's start and end with a default or own-times hint and Use default. Since UI unification U4 it renders the shared TimeRangeFields (48px, the one focus ring); its controlStyle prop is gone." shared="shared/ui/DateFields.tsx">
          <SessionTimesExample />
        </CatalogueRow>
        <CatalogueRow name="TimeRangeFields" source="shared/ui/DateFields.tsx" usedIn={AWM} what="A start and an end time side by side (UI unification U4, from SessionTimesFields): two labelled native time inputs, optional labels, one hint line read with both, size and fill. Used by SessionTimesFields, the recurring booking sheet and the schedule settings." shared="shared/ui/DateFields.tsx" note="Phase 39b brings it to the anaesthetist apps.">
          <TimeRangeFieldsExample />
        </CatalogueRow>
      </FamilySection>

      {/* ------------------------------------------------------------------ */}
      <FamilySection id="tabs">
        <CatalogueRow name="Segmented" source="shared/ui/Field.tsx" usedIn={AWM} what="A row of mutually exclusive options (status filters, List or Calendar, Yes or No). 22 uses in Admin." shared="shared/ui/Field.tsx">
          <SegmentedExample />
        </CatalogueRow>
        <CatalogueRow name="SlidingSegmentedControl" source="shared/ui/SlidingSegmentedControl.tsx" usedIn={AWM} what="A segmented control whose selected pill slides between options, in teal and surface variants, md and sm (the 36px row order on Admin Day) sizes. The ink variant went with question 17 (UI unification U5)." shared="shared/ui/SlidingSegmentedControl.tsx" note="Segments stay buttons with aria-pressed (question 3).">
          <SlidingSegmentedExample />
        </CatalogueRow>
        <CatalogueRow name="SideNav (with RolesInfo)" source="apps/admin/components/SideNav.tsx" usedIn={A} what="The dark Admin side nav: sections with crimson and amber count badges (the mockup badge, kept local), the wordmark, the Roles in this prototype dialog and the persona through the shared PersonaChip." shared="Stays custom" note="A labelled navigation whose active item carries aria-current since UI unification U5; the items stay buttons (question 3). Crimson only on --sidebar-primary." height={600}>
          <SideNavExample />
        </CatalogueRow>
        <CatalogueRow name="Master data sub-nav" source="apps/admin/screens/masters/MasterData.tsx" usedIn={A} what="The vertical list of the master views in five groups (People and places, Schedule, Billing, Settings, Go-live), rendered from masterViews.ts, with aria-current on the open one." shared="Stays custom" note="Rebuilt from MasterData's markup and the real MASTER_VIEWS registry (catch-up Phase 42): the real nav writes ?view= and renders every master view." height={620}>
          <MastersSubNavExample />
        </CatalogueRow>
        <CatalogueRow name="LineTabs" source="shared/ui/LineTabs.tsx" usedIn={AWM} what={`The underline tab strip (UI unification U5): LineTabLink for sibling routes (the web Accounts sub-tabs, ${DRAFT_LISTS}, the web Availability page switch, Admin Intake's four tabs, the Future-scope pages), a labelled navigation with aria-current; LineTab for local panels (Phase 25's Contract History tab), buttons with aria-pressed; a badge after the label for a count.`} shared="shared/ui/LineTabs.tsx" note="Was AA fees' TabLink. Shown with LineTab so nothing leaves this page.">
          <LineTabsExample />
        </CatalogueRow>
        <CatalogueRow name="StepRail / StepMarker" source="shared/contracts/railParts.tsx" usedIn={AWM} what="The Contract chooser's numbered steps as a nav list (UI unification U4): vertical (the desktop column, a connector line between 24px markers) or compact (three across, the phone's sheet); a tick once answered, the answer under its label, Only option where a step filled itself in, aria-current=step on the current one, and an answered step clickable to go back." shared="shared/contracts/railParts.tsx" note="Static steps here. Phase 23 builds Make primary on it. Since catch-up Phase 39a a step not done can show its own caption (pendingValue, the payment cycle's planned day) and the hooks take a prefix (shotPrefix, payment-cycle-step-n); defaults keep the Contract chooser as it was.">
          <StepRailExample />
        </CatalogueRow>
      </FamilySection>

      {/* ------------------------------------------------------------------ */}
      <FamilySection id="overlays">
        <CatalogueRow name="Dialog (useSurface().Overlay)" source="shared/surface/Dialog.tsx" usedIn={AWM} what="The web Overlay every Admin sheet opens in: a centred card over a scrim, closed by Escape, the corner X or a scrim click. It sits on the one modal stack with BottomSheet (useModalLayer): one Escape closes only the top layer, focus goes in, stays in and comes back, the page behind is inert, and the OverlayHeader title names the dialog. About 37 uses." shared="shared/surface/Dialog.tsx" note="No portal, because the phone frame is scaled.">
          <OverlayExample />
        </CatalogueRow>
        <CatalogueRow name="OverlayHeader" source="shared/surface/OverlayHeader.tsx" usedIn={AWM} what="The one sheet title: an h2 at 18/700 with an optional 13px slate description. Its id names the enclosing dialog, and on web it brings the Dialog's corner X (Close); on the phone the handle is the close." shared="shared/surface/OverlayHeader.tsx" note="Every sheet uses it, so the title and the accessible name cannot drift apart.">
          <OverlayHeaderExample />
        </CatalogueRow>
        <CatalogueRow name="SheetActions" source="shared/surface/SheetActions.tsx" usedIn={AWM} what="The one sheet footer, laid out by the surface: stacked primary over secondary on the phone, one row on web with the secondary hugging its label first and the primary last, filling the rest. Footer buttons stay 54px." shared="shared/surface/SheetActions.tsx" note="Pass the buttons as they are, so labels, disabled state and handlers stay on them.">
          <SheetActionsExample />
        </CatalogueRow>
        <CatalogueRow name="ConfirmSheet" source="shared/surface/ConfirmSheet.tsx" usedIn={AWM} what="The one sheet confirm: the surface's Overlay with an OverlayHeader and SheetActions. Focus opens on the safe button, and a double click runs the primary once. The body between header and footer is the caller's. Catch-up Phase 35 adds onCancel (the secondary's own action) and initialFocus: confirm opens on the primary where the primary is the safe choice (Leave without saving: Keep editing). Build plan Phase 45 adds confirmVariant (danger makes the primary the one red outline, for Disable a Contract; primary, the teal command, is the default) and size (wide passes the Overlay's wide dialog for a body that lists rows; default as before)." shared="shared/surface/ConfirmSheet.tsx" note="Used by ClearConflictSheet, SubmitListSheet, RemoveProcedureSheet, MakePrimarySheet (catch-up Phase 23), LeaveWithoutSavingDialog and a Contract page's Disable. Labels are the caller's.">
          <ConfirmSheetExample />
        </CatalogueRow>
        <CatalogueRow name="MasterPanel / PanelGrid / PanelSection" source="apps/admin/components/MasterPanel.tsx" usedIn={A} what="The 600px record preset of SidePanel the New party panel opens in (create only, over the shared PartyFormFields; a Party is edited on its page since build plan Phase 48, and a new Contract is a page since Phase 46): the h2 at 18/700 names the dialog, the footer is right-aligned with the primary last." shared="shared/surface/SidePanel.tsx" note="Since U2 one shell with the drawers (SidePanel); a sheet opened over it closes first on Escape.">
          <MasterPanelExample />
        </CatalogueRow>
        <CatalogueRow name="RawRowSheet" source="apps/admin/matching/RawRowSheet.tsx" usedIn={A} what="The restricted raw hospital row (catch-up Phase 43; US-15.0.6): a record SidePanel over Matching's row panel that asks for a reason (FilterPills quick reasons or a TextField), then shows the masked columns on the table kit with the Notice that the masking policy is for AA to agree. Teal only on View raw row." shared="shared/surface/SidePanel.tsx" note="Each view writes an audit entry, so it is not mounted here.">
          <StageHint>Opens from View raw row on an unmatched Matching row.</StageHint>
        </CatalogueRow>
        <CatalogueRow name="SidePanel" source="shared/surface/SidePanel.tsx" usedIn={AW} what="The one right-docked panel (U2): scrim, an h2 header at 18/700 that names the dialog, the corner X, e3, a scrolling body and a footer. 440px list (the drawers) or 600px record (MasterPanel, the support panel). On the one modal stack. Moved from apps/admin/components to the shared surface in catch-up Phase 43b, so the web app's Help uses the same shell." shared="shared/surface/SidePanel.tsx">
          <SidePanelExample />
        </CatalogueRow>
        <CatalogueRow name="SupportPanel" source="shared/support/SupportPanel.tsx" usedIn={AWM} what="The one support panel body (catch-up Phase 43b; US-15.0.8, US-15.0.9): the open or closed status from the demo clock and the holiday calendar, the phone line in mono and the hours (SupportHours), the response table (ResponseTable), the out-of-hours Notice, the request form (SupportRequestForm: subject, priority, description; What is happening? out of hours; the kind on Product support) and the tickets (TicketList: status Pill, respond-by in mono, Response overdue, Best effort or Awaiting AA's approval). LineTabs Help line and Product support in Admin. One Simulated badge and the readings caption." shared="shared/support/SupportPanel.tsx" note="Every hour and response time reads SUPPORT_CONFIG (domain/support.ts). Send writes an audited ticket to the demo store.">
          <SupportPanelExample />
        </CatalogueRow>
        <CatalogueRow name="SupportSidePanel" source="shared/support/SupportHosts.tsx" usedIn={AW} what="The support panel on the desktop apps (catch-up Phase 43b): the shared SidePanel at the record width, opened by Help at the foot of the Admin side nav and in the web top nav. Admin adds Product support and sees every request with its requester." shared="shared/support/SupportHosts.tsx">
          <SupportSidePanelExample app="admin" />
        </CatalogueRow>
        <CatalogueRow name="PopoverPanel" source="shared/ui/PopoverPanel.tsx" usedIn={AWM} what="The one popover panel and behaviour (usePopover, U2): a white card at the card radius and e3 under its trigger; outside click closes, Escape closes and returns focus. The harness menus and the Contract combo use it. Its fixed placement (catch-up Phase 43a) sits at viewport coordinates for InfoTip, so a scrolling table never clips it." shared="shared/ui/PopoverPanel.tsx">
          <PopoverPanelExample />
        </CatalogueRow>
        <CatalogueRow name="InfoTip (desktop)" source="shared/help/InfoTip.tsx" usedIn={AWM} what="Point-of-need help (catch-up Phase 43a; US-15.0.1): a 16px info glyph in a 28px hit area beside a section label (Admin Day's legend, the waiting Lists band, and the rail work card's To-do; Admin Review's Flags, Procedures, Fee and Authorise; the web capture cards). It opens an anchored popover on PopoverPanel's fixed placement with role dialog, flipping at the viewport's edges; Escape and an outside click close it. All copy lives in helpTopics.ts." shared="shared/help/InfoTip.tsx">
          <InfoTipDesktopExample />
        </CatalogueRow>
        <CatalogueRow name="SlotDrawer" source="apps/admin/components/SlotDrawer.tsx" usedIn={A} what="The 440px session drawer on SidePanel: an empty session's actions, or a List's details, bookings and actions with nested sheets. A named dialog with Escape, focus in and back." shared="shared/surface/SidePanel.tsx" note="Its rows are the shared DefRow in a DefList (a dl, labels at 80; UI unification U6), its section labels the shared Eyebrow. Its actions (assign, edit, reassign, status) write to the demo store, and its nested sheets open over it.">
          <SlotDrawerExample />
          <StageHint>Opens over the page from the right.</StageHint>
        </CatalogueRow>
        <CatalogueRow name="DraftListDrawer" source="apps/admin/components/DraftListDrawer.tsx" usedIn={A} what={`The same drawer on SidePanel for a ${DRAFT_LIST} (no session yet): its details, bookings and Assign, Redate, Edit and Remove.`} shared="shared/surface/SidePanel.tsx" note="Its actions are the shared Button (compact); a disabled one prints its reason (UI unification U5). Its actions write to the demo store. Its rows are the shared DefRow in a DefList and its section labels the Eyebrow (UI unification U6).">
          <DraftListDrawerExample />
        </CatalogueRow>
        <CatalogueRow name="ClearConflictSheet" source="apps/admin/components/conflicts/ClearConflictSheet.tsx" usedIn={A} what="Confirms clearing a hospital-closure conflict on a List, with an optional note. A ConfirmSheet: focus opens on the safe button and a double click clears once." shared="shared/surface/ConfirmSheet.tsx" note="Confirming clears the conflict in the demo store.">
          <ClearConflictExample />
        </CatalogueRow>
        <CatalogueRow name="PricingSheet" source="shared/flows/PricingSheet.tsx" usedIn={A} what="Change price (catch-up Phase 24): one Price $ field beside the computed price, Save price and Use the computed price, no reason; read-only with the sentence on a raised prepaid price. Replaced PriceOverrideSheet's fixed fee, $ and % modes with their reason." shared="shared/flows/PricingSheet.tsx" note="Saving writes the typed price to the demo data.">
          <PricingSheetExample />
        </CatalogueRow>
        <CatalogueRow name="HistorySheet" source="shared/booking/HistorySheet.tsx" usedIn={AWM} what="The audit history of a record in an Overlay, titled by an OverlayHeader, with expandable steps (HistoryTimeline)." shared="shared/booking/HistorySheet.tsx">
          <HistorySheetExample />
        </CatalogueRow>
        <CatalogueRow name="UpdateEmailComposer (with UpdateEmailPreview)" source="apps/admin/flows/UpdateEmailComposer.tsx" usedIn={A} what="The update email composer (catch-up Phase 35): a wide two-column Overlay. Left, Pick changes: the saved history newest first on the shared Checkbox, rows that cannot be emailed disabled with their reason, an earlier-draft hint Pill and the cancelled-out note. Right: Template (SelectField), Send to (Segmented), the resolved To with the other office contacts to switch to, and the preview badged Demo preview with its character count and a Shortened to fit Pill. Open in mail client is the shared Button rendered as a real mailto: link." shared="shared/surface/Dialog.tsx" note="Open in mail client records one updateEmail.drafted entry in the demo store; nothing is sent. The Button's href prop (added here) renders an anchor while enabled.">
          <UpdateEmailComposerExample />
        </CatalogueRow>
        <CatalogueRow name="LeaveWithoutSavingDialog" source="shared/booking/draft/useUnsavedChangesGuard.tsx" usedIn={A} what="Leave without saving? (catch-up Phase 35): a ConfirmSheet over a blocked navigation with the unsaved count; Keep editing (the primary, which takes the initial focus) stays, Discard and leave throws the draft away and goes on." shared="shared/booking/draft/useUnsavedChangesGuard.tsx" note="On a stand-in blocker here; on the Booking detail useBlocker (the data router) blocks the navigation.">
          <LeaveWithoutSavingDialogExample />
        </CatalogueRow>
        <CatalogueRow name="LetterPreview (ApprovePrepaymentDialog, PrepaymentReminderDialog)" source="shared/booking/PrepaymentLetterDialogs.tsx" usedIn={A} what="The prepayment letter as sent (catch-up Phase 41; US-06.3.6): plain text on a neutral paper box. It is the preview inside the two dialogs in the same file: Approve and send (the letter named, a select when several are active, Preview letter, the recipient, Approve and send), opened by PrepaymentApprovalStrip, and Send prepayment reminder (the invoice and amount still to pay, the letter, the recipient or the no-email refusal, Send reminder), opened from the PrepaymentPanel on Admin." shared="shared/booking/PrepaymentLetterDialogs.tsx" note="Shown with the Standard prepayment letter rendered against the fictional sample; the dialogs open from the strip row above and the Booking's panel.">
          <LetterPreviewExample />
        </CatalogueRow>
        <CatalogueRow name="NewContractPage" source="apps/admin/screens/contracts/new/NewContractPage.tsx" usedIn={A} what="New contract (build plan Phase 46; US-04.1.2): a fluid AdminPage with the rail, filled in the order the rules depend on each other, four Cards with a numbered step: 1 the holder (a SelectField grouped by kind) and who it bills (Segmented, fixed to the payer for an AA- or anaesthetist-held or prepaid Contract); 2 pricing (RadioCards on useRovingRadio, a disabled card with its reason while prepaid, the rate, discount or first range, prepaid, the override on RVG kinds only); 3 where it is offered (ChipMultiSelect surgeons, linked anaesthetist, specialties, funding tag); 4 the name, holder reference, invoice description and default RVG code. Refusals from the store's guard in one FormError above the steps. The form and its rules are useContractDraft." shared="shared/ui/Card.tsx" note="Shown for Merivale. Create writes to the demo store and opens the new Contract's page." height={760}>
          <NewContractPageExample />
        </CatalogueRow>
        <CatalogueRow name="WhereItWillShow / AlreadyHeld" source="apps/admin/screens/contracts/new/AlreadyHeld.tsx" usedIn={A} what="New contract's rail cards (build plan Phase 46): Where it will show is destinationHint over destinationOf, the one placement rule, then a sentence of who sees it; Already held lists the holder's Contracts with a similar name first (similarContracts, each with a Similar name pill, Disabled marked), then its other Active ones, five in all, with See all opening the list in a new tab. A hint, never a block." shared="shared/ui/Card.tsx" note="A Merivale draft named Face lift revision, so its Face lift shows as a similar name.">
          <NewContractRailExample />
        </CatalogueRow>
        <CatalogueRow name="SlotStatusSheet" source="apps/admin/flows/SlotStatusSheet.tsx" usedIn={A} what="Adds or edits an availability status in an Overlay: an OverlayHeader title, name, colour swatches, flags (the shared Checkbox with a hint, UI unification U4) and a live preview validated as you type, and a SheetActions footer." shared="shared/surface/Dialog.tsx" note="Save adds the status to the demo store. Its preview block is the shared StatusBlock with the draft visual (UI unification U6).">
          <SlotStatusSheetExample />
        </CatalogueRow>
        <CatalogueRow name="PublicHolidaySheet" source="apps/admin/flows/PublicHolidaySheet.tsx" usedIn={A} what="Adds or changes a master public holiday in an Overlay (catch-up Phase 42): date, name, National or Regional with its region, and the hospitals open that day; Save says what the conflict rule did (flags raised or cleared)." shared="shared/surface/Dialog.tsx" note="Save writes the public holiday to the demo store and re-runs the conflict rule.">
          <PublicHolidaySheetExample />
        </CatalogueRow>
        <CatalogueRow name="RvgTimeRuleSheet" source="apps/admin/flows/RvgTimeRuleSheet.tsx" usedIn={A} what="Edits the RVG time rule in an Overlay (catch-up Phase 42): one row per tier (from minute, minutes per unit; add and remove a tier), A part interval always rounds up. as a fixed line, a live preview of the rule in words and the units for 95 and 125 minutes, and Save with its refusal sentence inline." shared="shared/surface/Dialog.tsx" note="Save writes the rule to the demo store; Procedures not yet authorised re-price.">
          <RvgTimeRuleSheetExample />
        </CatalogueRow>
        <CatalogueRow name="PaidBySheet (with SplitFeeSection)" source="shared/flows/PaidBySheet.tsx, shared/flows/SplitFeeSection.tsx" usedIn={AWM} what="The one Paid by sheet (catch-up Phase 22a; US-11.2.2, US-08.2.3): a bottom sheet on the phone, a dialog on web and Admin. Opened by Change, it holds who pays (the Different payer tick, the patient's details or the other payer's fields, the Under 18 hint and the contact ask) and, when the payer changes, the offer (the Booking's other Procedures with the same payer, each ticked, never forced). Opened by Split, it holds the split alone (a party or Another person, a $ or % share and Takes the rest per row, each amount live). Save writes it or refuses it whole." shared="shared/flows/PaidBySheet.tsx" note="Opens on Grace Park's first seeded Procedure; Save writes to the demo store.">
          <PaidBySheetExample />
        </CatalogueRow>
        <CatalogueRow name="AdditionalInvoiceSheet (AdditionalInvoiceForm, FreeFormLinesEditor, EventPartyField)" source="shared/booking/AdditionalInvoiceForm.tsx" usedIn={AWM} what="The free-form additional invoice (catch-up Phase 38b; US-08.6.3, D10, D22): raised from the Contract row's Create (Admin) or Raise (anaesthetist) additional invoice, and the events list's Edit. The date of the charge, the Same as the original invoice tick (ticked by default) that unticks to 22a's PartyPicker with Another person, the lines (description, quantity, amount, the line total) and the live subtotal, GST and total; Save for review. A bottom sheet on the phone, a dialog on web and Admin, as the Paid by sheet beside it." shared="shared/booking/AdditionalInvoiceForm.tsx" note="Opens on David Chen's HP03; Save for review writes to the demo store. The lines editor and party field are their own components for Phase 39's credit note and rebill.">
          <AdditionalInvoiceSheetExample />
        </CatalogueRow>
        <CatalogueRow name="EventReviewSheet" source="apps/admin/flows/EventReviewSheet.tsx" usedIn={A} what="The one standard review step (catch-up Phase 38b; D13): the event, its Procedure and original invoice, the lines with subtotal, GST and total, the party and who raised it; Approve for billing (invoiced in the next billing run) or Decline with a reason shown to whoever raised it. Opened from Review's Events tab and the events list's Review." shared="shared/surface/SidePanel.tsx" note="On the shared SidePanel (record width). Approve and Decline write to the demo store.">
          <EventReviewSheetExample />
        </CatalogueRow>
        <CatalogueRow name="AddPrePostOpEventSheet and AddBillingEventSheet" source="shared/booking/EventSheets.tsx" usedIn={AWM} what="The two event sheets (catch-up Phase 39b; US-03.7.1, US-03.7.2, US-05.5.2), from Add pre-op or post-op event and Add billing event under a Procedure's events, for the owner and the office on any List state the guard allows. Pre-op or post-op: Pre-op or Post-op, the type as tappable rows (the ACC pre-op lists CS250, CS260 and CS70 with the OQ-12 caption), the date and start time, Record a time (a 5-minute stepper, The office prices the time at review) or Fixed fee (the Contract's fee read only, else typed). Billing event: Charge or Credit (Credit not offered once invoiced), What is this for?, the amount ex GST, the date. Both: Invoice this event and Billed to the same party as the procedure, with the reading caption, and the routing caption. No modifier, unit or rate control." shared="shared/booking/EventSheets.tsx" note="Over David Chen's HP03; writes go to the demo store.">
          <EventSheetsExample />
        </CatalogueRow>
        <CatalogueRow name="CreditSheet (CreditForm, SplitCombinedSheet)" source="apps/admin/flows/CreditSheet.tsx, shared/booking/CreditForm.tsx" usedIn={A} what="The one credit form (catch-up Phase 39; US-08.6.5, US-08.6.2, US-08.6.4, US-08.6.6) in Admin's side sheet, opened by Credit note (no new invoices), Credit in full and rebill (one new invoice holding a copy of the original's lines, editable), Split into additional invoices (SplitCombinedSheet: the same form in split mode) and Edit on a pending credit. Step 1: the original's number, party and total; who the credit note goes to (the Same as the original invoice tick unticking to 22a's PartyPicker, another person allowed, with an invoice email); the reason (quick chips plus free text, required); no amount, a credit is always in full; the money state in plain words, the trail preview (debit, credit, contra, new debit) and A credit note is not a refund. Step 2: new invoice cards, each 38b's party field and lines editor, with Start from a copy of the original's lines on any card a credit adds; Add an invoice. The split opens with two blank components (never fewer), Put the rest on this invoice on each, and keeps the credited total, the components' sum and Left to allocate in the footer; Save N invoices for review waits for $0.00." shared="shared/booking/CreditForm.tsx" note="Opens on the seeded AA-2026-H03 (unpaid, in Xero). Save writes to the demo store. The anaesthetist's variant is the Web and Mobile catalogues' row.">
          <CreditSheetExample />
        </CatalogueRow>
      </FamilySection>

      {/* ------------------------------------------------------------------ */}
      <FamilySection id="feedback">
        <CatalogueRow name="WarningPreviewRow" source="shared/warnings/WarningPreviewRow.tsx" usedIn={A} what="One warning that is not raised yet (catch-up Phase 40): the balance warning a save will raise, before the office saves a Booking (Admin phone advice) or decides a Matching row. A WarningsPanel row's tint, triangle and text with the StrengthPill, the caption and the record link under it; no Clear." shared="shared/warnings/WarningPreviewRow.tsx" note="Mild and strong, with fixed text; nothing reads the demo store.">
          <WarningPreviewRowExample />
        </CatalogueRow>
        <CatalogueRow name="NotPreferredWarning" source="apps/admin/components/pairing/NotPreferredWarning.tsx" usedIn={A} what="An amber callout when the chosen surgeon is not preferred with the anaesthetist, on the shared Notice; it warns, never blocks." shared="shared/ui/Notice.tsx" note="Fed by the real useNotPreferredWarning hook for a seeded not-preferred pairing.">
          <NotPreferredWarningExample />
        </CatalogueRow>
        <CatalogueRow name="Notice" source="shared/ui/Notice.tsx" usedIn={AWM} what="The one notice (UI unification U3): the ConflictCallout shell in warning, error and success, and the neutral note. A role only where the note announces; the icon is aria-hidden." shared="shared/ui/Notice.tsx">
          <NoticeExample />
        </CatalogueRow>
        <CatalogueRow name="LoadResultBanner" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="The one-line neutral Notice under a master view's header while a load waits for review: on a seeded view while a seed load for one of its sheets is staged (Open Seed load), and on every view while the go-live load is staged (Open). The Go-live views show none." shared="shared/ui/Notice.tsx" note="Shown for the Hospitals view: Check the sample stages hospitals.csv in the demo store; load or discard it on the LoadResultPanel row or on Seed load.">
          <LoadResultBannerExample />
        </CatalogueRow>
        <CatalogueRow name="ConflictCallout" source="apps/admin/components/conflicts/ConflictCallout.tsx" usedIn={A} what="Warns, before saving, that the hospital is closed that day and the List will be flagged (the shared Notice, warning tone)." shared="shared/ui/Notice.tsx">
          <ConflictCalloutExample />
        </CatalogueRow>
        <CatalogueRow name="NhiLookupStatus / NhiPurposeNote" source="shared/nhiHub/NhiLookupStatus.tsx" usedIn={AWM} what="The NHI lookup's one status line in the field's caption, under it (catch-up Phase 40a; US-14.4.1), every Hub state: checking, slow with Stop waiting, found (New format NHI where it applies), not on the register, unavailable (the warning Notice with a teal Retry), invalid (the validator's reason in the error tint) and stopped. The purpose note under it names who the lookup is made for (the List's anaesthetist with their HPI CPN, or the AA office) and that the NHI is used only to identify the patient. Used by Add a booking in all three apps, the waiting row's Add NHI and the patient record's refresh." shared="shared/nhiHub/NhiLookupStatus.tsx" note="useNhiHubLookup drives it; the simulated Hub's mode comes from the nhi-hub-mode demo trigger.">
          <NhiLookupStatusExample />
        </CatalogueRow>
        <CatalogueRow name="NotificationsCard" source="apps/admin/components/NotificationsCard.tsx" usedIn={A} what="The rail's shared notification pool: active notices with Resolve, See all and Show resolved. Its count is the shared CountBadge (read as 2 active), still showing 0." shared="shared/ui/NoticeLine.tsx" note="On the shared Card (U6) with headingRef: after a tick focus returns to its heading. Resolve writes to the demo store. The fresh seed has no notices, so it shows the empty state until one is raised.">
          <NotificationsCardExample />
        </CatalogueRow>
        <CatalogueRow name="BookingSaveBar / BookingSavedStrip" source="apps/admin/components/BookingSaveBar.tsx" usedIn={A} what="The Admin Booking detail's explicit save (catch-up Phase 35): a sticky warning Notice with the unsaved count, the changed fields and compact Discard and Save changes Buttons (a refused save prints its reason), then a success Notice: Saved, the count, the time, who and the change-set id, with Dismiss. Both count by label (shared/booking/changeLabels.ts), as the leave dialog does." shared="shared/ui/Notice.tsx" note="Sample changes here: Save and Discard write nothing.">
          <BookingSaveBarExample />
        </CatalogueRow>
        <CatalogueRow name="OfficeSavedNotice" source="shared/booking/OfficeSavedNotice.tsx" usedIn={AWM} what="One dismissible neutral Notice when another actor's save lands on an open Booking: who saved and the fields, with View history. A notice, not concurrency handling." shared="shared/booking/OfficeSavedNotice.tsx" note="The button saves a note as Sam T. in the demo store, which raises the notice here.">
          <OfficeSavedNoticeExample />
        </CatalogueRow>
        <CatalogueRow name="Inline success banner (role=status)" source="apps/admin/screens/ConflictsScreen.tsx" usedIn={A} what={`The shared ResultLine (UI unification U3): a success-green confirmation with Dismiss after an action (Conflicts, ${DRAFT_LISTS}, Recurring apply, AA fees), its role=status region always mounted. The masters lines stay teal until Phase 42.`} shared="shared/ui/ResultLine.tsx" note="Inline JSX in each screen, not a component: rebuilt here from the Conflicts screen. Errors stay inline.">
          <InlineBannerExample />
        </CatalogueRow>
        <CatalogueRow name="FieldLabel / FormError" source="shared/ui/Field.tsx" usedIn={AWM} what="The field label (the shared Eyebrow since UI unification U6: 11/600/0.06em caps, one size for every eyebrow, question 23), and FormError: the role=alert refusal box under a form, or its inline line beside a compact row control (U3: the one error box)." shared="shared/ui/Field.tsx" note="Ties each error to its field instead of one line per form.">
          <FormErrorExample />
        </CatalogueRow>
        <CatalogueRow name="SuccessOverlay" source="shared/ui/SuccessOverlay.tsx" usedIn={AWM} what={`The full-surface success moment: the circle pops and the tick draws, then the flow moves on (Assign ${DRAFT_LIST}, Reassign).`} shared="shared/ui/SuccessOverlay.tsx" height={200}>
          <SuccessOverlayExample />
        </CatalogueRow>
        <CatalogueRow name="TickBadge" source="shared/ui/TickBadge.tsx" usedIn={AWM} what="The teal tick badge, optionally animated with the complete-tick draw." shared="shared/ui/TickBadge.tsx">
          <TickBadgeExample />
        </CatalogueRow>
        <CatalogueRow name="ContractChangeNotice" source="apps/admin/flows/ContractChangeNotice.tsx" usedIn={A} what="The Contract panel's change warning (catch-up Phase 25a; US-04.1.2, US-04.2.15): the shared warning Notice with its sentence, then the Procedures it names on the shared TableShell (dense), each with Open to its Booking. One component for a disable (the Contract page's confirm, from today or, after Replace from a date, from the change date) and the authorised Procedures a price range left at their old price. It only lists: nothing moves." shared="shared/ui/Notice.tsx" note="Shown with the Procedures dated on or after today still on Merivale's Face lift, read from the demo store.">
          <ContractChangeNoticeExample />
        </CatalogueRow>
        <CatalogueRow name="PrepaymentHonourLine" source="shared/flows/PrepaymentHonourLine.tsx" usedIn={AWM} what="The line on every move of a prepaid Booking (catch-up Phases 32a and 41; US-06.5.4): the prepayment keeps its agreed amount and whoever does the procedure claims it. The anaesthetist's sheets name the receiver (The prepaid amount stays as agreed, and moves to Dr X once the List is authorised.); the office's move and reassign flows say whoever the office assigns claims it. Nothing in the ledger changes." shared="shared/flows/PrepaymentHonourLine.tsx" note="Shown as the office and as the anaesthetist.">
          <PrepaymentHonourLineExample />
        </CatalogueRow>
      </FamilySection>

      {/* ------------------------------------------------------------------ */}
      <FamilySection id="tables">
        <CatalogueRow name="PdfListsTab and PdfListReview (PDF lists)" source="apps/admin/intake/PdfListsTab.tsx" usedIn={A} what="The rooms' PDF lists (catch-up Phase 34): an inbox on the shared table kit (sender, surgeon, hospital, received, suggested List, a Re-sent Pill and a status Pill), Upload PDF list (PdfUploadDialog: the surface's Overlay with OverlayHeader, RadioCards badged Sample files, a Sent from TextField and SheetActions), and the review beside the facsimile: compact TextFields per row, each correction listed under its row, Send to matching (Button) and a ResultLine." shared="shared/table/TableShell.tsx" note="Uploading, correcting and sending write to the demo store." height={460}>
          <Wide minWidth={1000}>
            <PdfListsTab actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="Pager" source="apps/admin/components/Pager.tsx" usedIn={A} what="The one admin pager (catch-up Phase 43; US-15.0.4): the range in mono, first, previous, the teal page count, next and last. Shown only past one page: the Day view (30 anaesthetists), Invoices (50), Audit (100), the Ledger (50), the Billing monitor's groups (20) and each group's Lists (25)." shared="shared/ui/IconButton.tsx">
          <Pager total={28114} size={50} page={2} onPage={() => {}} />
        </CatalogueRow>
        <CatalogueRow name="LedgerPaymentRuns / StillToNetNotice" source="apps/admin/components/LedgerPaymentRuns.tsx" usedIn={A} what="The Admin Ledger's per-anaesthetist payment runs (catch-up Phase 39a): each run by week with BCTIs, netted, net, status and its remittance advice; above it, only while a negative invoice is open, what is still to net with OQ-71's one caption." shared="shared/table/TableShell.tsx" note="On the shared Card, TableShell (nested, compact), Pill and Notice. The notice is quiet on the seed (no negative open).">
          <LedgerPaymentRunsExample />
        </CatalogueRow>
        <CatalogueRow name="PatientsScreen (Search · Waiting for NHI · Follow-up)" source="apps/admin/screens/patients/PatientsScreen.tsx" usedIn={A} what="Admin · Patients (catch-up Phase 40; US-11.1.1, US-11.3.2): the three list views behind one segmented control, each with its count. Search by name, NHI or date of birth with the patient-centric balance and the warning's strength pill; Follow-up lists the open balance warnings (strong first, with Clear), the reminders due and the details to review." shared="shared/table/TableShell.tsx" note="On the shared PageHeader, SlidingSegmentedControl, NameSearchBox, TableShell (compact), ClickableRow, Pill, EmptyState and 15a's ClearWarningButton. The NHI is the key; no internal id is shown.">
          <PatientsSearchExample />
        </CatalogueRow>
        <CatalogueRow name="WaitingNhiView / WaitingNhiRowView / AddNhiSheet" source="apps/admin/intake/WaitingNhiView.tsx · WaitingNhiTab.tsx · AddNhiSheet.tsx" usedIn={A} what="Intake's Waiting for NHI tab (catch-up Phase 40, on Intake since Phase 51; US-11.1.5): each intake row with the patient as received, its List, 33a's stub chip, the one address to chase (the others offered), the days to go with an Urgent pill and when the office asked. Email for the NHI is a real mailto link, audited on click; Add NHI opens the desktop dialog with the live NHI check, the existing-record preview and the differences." shared="shared/table/TableShell.tsx" note="On the shared TableShell, Pill, Button (href), SelectField, TextField, Notice, OverlayHeader and SheetActions. The seed holds one waiting row (33a's); the Demo actions' Receive list with a missing NHI adds two.">
          <WaitingNhiExample />
        </CatalogueRow>
        <CatalogueRow name="DetailChoiceTable" source="apps/admin/screens/patients/patientParts.tsx" usedIn={A} what="The one details comparison table (catch-up Phase 40's Details differ, made shared in Phase 40a): Detail, the record's value, the other source's and, with a choice, Keep or Use per row (default Keep); an enrichment reads Will be added. Details differ (Use incoming), Add NHI's read-only preview and Refresh from the NHI register (Use register) all use it." shared="shared/table/TableShell.tsx" note="On the shared TableShell (nested, dense) and SelectField (compact, surface). Replaced the Add NHI sheet's private copy.">
          <DetailChoiceTableExample />
        </CatalogueRow>
        <CatalogueRow name="HoldingAccountPanel" source="apps/admin/components/HoldingAccountPanel.tsx" usedIn={A} what="The Billing monitor's AA Holding account card (catch-up Phase 27a): the balance, the prepaid Bookings it holds money for, the entries (Received or Transferred, with the anaesthetist; since catch-up Phase 41 also Credited and Refunded rows, with the Credit note column naming the credit number and the Cause column why: Cancelled, Contract changed, By hand or Late payment), how money leaves it and the provisional release trigger. Read-only; empty, the shared EmptyState." shared="shared/table/TableShell.tsx" note="On the shared Card (padding card), TableShell (nested, compact), Th and Td, Pill and EmptyState. Reads useHoldingAccount.">
          <HoldingAccountPanelExample />
        </CatalogueRow>
        <CatalogueRow name="MasterTable / EditCell" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="Every master view's table (catch-up Phase 42): the shared TableShell at the dense density with a Th per named column (a string, or a label with its alignment and width; ACTIONS_COLUMN for the right-aligned actions), and EditCell, the row's Edit as the shared TextAction in its own right-aligned Td." shared="shared/table/TableShell.tsx" note="Replaced the masters Table (heads[]). Contracts and RVG groups add GroupRow; Anaesthetists, Surgeons, Parties and Contracts use ClickableRow.">
          <MasterTableExample />
        </CatalogueRow>
        <CatalogueRow name="LoadResultPanel" source="apps/admin/screens/masters/LoadResultPanel.tsx" usedIn={A} what="One checked sheet's result, shared by Seed load and the go-live view: the summary line (hospitals.csv: 6 rows · 2 valid · 4 rejected), a dense table of Row, the sheet's key columns, a Valid or Rejected pill and the reasons one per line, the Only rejected filter, and Load N valid rows and Discard. After a load the summary says what loaded and each row opens its record." shared="shared/table/TableShell.tsx" note="Check the sample stages hospitals.csv as the developer's seed load; Load and Discard write to the demo store." height={520}>
          <Wide minWidth={900}>
            <LoadResultPanelExample />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="Table kit (TableShell · Th · Td · GroupRow · ClickableRow)" source="shared/table/" usedIn={AWM} what="The one table kit (UI unification U6, question 19): TableShell (white, line, radius 14, e1; a named focusable region only when it overflows; footer for a foot row such as the pager, kept below the rows; fit for an Admin fit page's list card), Th (scope col) on the Admin Review header, sortable with `sort` (aria-sort and a button, teal underline on the active column; the Billing monitor), Td with sunken dividers, GroupRow (th scope colgroup; level sub is the grouped Contract catalogue's smaller, indented sub-heading, Phase 47 from contracts-section.html #catalogue), and ClickableRow with one RowOpenButton as the keyboard handle (selected, Phase 48: the picked row of a list whose pick shows beside it, the accent tint and aria-selected, as the Funding tags tab's picked tag). Density comfortable (web), compact (admin) or dense (audit and masters) keeps each table's row height." shared="shared/table/TableShell.tsx" note={`The ${DRAFT_LISTS} table is built this way: Tab to a session, Enter opens the ${DRAFT_LIST} drawer (bug 3). An inner button does only its own action.`}>
          <TableKitExample />
        </CatalogueRow>
        <CatalogueRow name="ReviewQueue (clickable rows)" source="apps/admin/screens/ReviewQueue.tsx" usedIn={A} what="Submitted Lists to authorise, and since catch-up Phase 38b an Events tab (LineTabLink with its count) of events awaiting review, on the shared table kit (UI unification U6): TableShell (compact), Th, Td and ClickableRow, whose row click opens the List while the Review button stays the keyboard handle." shared="shared/table/ClickableRow.tsx" note="Rows never take focus; the Review button is the one handle per row. Open is stubbed." height={380}>
          <Wide minWidth={980}>
            <ReviewQueue onOpen={noop} onViewInvoices={noop} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="RvgGroupsView (grouped rows)" source="apps/admin/screens/masters/RvgGroupsView.tsx" usedIn={A} what="RVG groups under anatomy headings (colSpan group rows), with search, an anatomy filter and add, edit and retire." shared="shared/table/cells.tsx" note="Add, edit and retire write to the demo store. Its table is the shared TableShell (dense) and Th since UI unification U6; Phase 42 moves its group rows onto GroupRow." height={460}>
          <Wide minWidth={980}>
            <RvgGroupsView actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="EmailTemplatesView (template editor with live preview)" source="apps/admin/screens/masters/EmailTemplatesView.tsx" usedIn={A} what="The update email templates (catch-up Phase 35): a table of name, kind, sends to and active, with Edit, Retire and Restore. Edit opens a wide sheet with the fields, placeholder buttons that insert into the subject or body, validateTemplate's messages inline and a preview against a sample Booking badged Sample." shared="shared/table/TableShell.tsx" note="Edits write to the demo store. The placeholder buttons are plain buttons until a token-insert input exists." height={420}>
          <Wide minWidth={980}>
            <EmailTemplatesView actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="PrepaymentLettersView (letter templates with merge fields and live preview)" source="apps/admin/screens/masters/PrepaymentLettersView.tsx" usedIn={A} what="Master data, Prepayment letters (catch-up Phase 41; US-06.3.6): the request, reminder and anaesthetist changed templates in a table (name with the Default pill, kind, active, updated), New template and Edit in a Dialog with name, kind (new only), the letter, merge-field chips that insert at the cursor and a preview against a fictional sample; Make default, Deactivate and Activate, refusals verbatim (unknown field, missing prepaid amount, estimate wording, the default switched off)." shared="shared/table/TableShell.tsx" note="Edits write to the demo store." height={420}>
          <Wide minWidth={980}>
            <PrepaymentLettersView actor={OFFICE_ACTOR} />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="AuditViewer" source="apps/admin/screens/AuditViewer.tsx" usedIn={A} what="The global audit feed with a filter bar, capped at 500 rows. Since UI unification U4 the bar is shared parts: two SelectFields (compact, surface fill) and a FilterDateInput From and To." shared="shared/table/TableShell.tsx" note="On the shared table kit (U6, dense). Virtualisation or pagination replaces the 500-row cap later." height={460}>
          <Wide minWidth={980}>
            <AuditViewer />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="DiffTable (Matching)" source="apps/admin/matching/DiffTable.tsx" usedIn={A} what="Matching's differences between a Booking and the hospital's row: Field, On the Booking now, From the hospital, on the shared table kit (nested, dense). Every row is a changed field in the warning tone (ClickableRow tone=warning); a field the office may apply carries its tick, named by the field; an NHI is shown but never applied." shared="shared/table/TableShell.tsx">
          <DiffTableExample />
        </CatalogueRow>
        <CatalogueRow name="PriceRangesTable" source="apps/admin/screens/contracts/PriceRangesTable.tsx" usedIn={A} what="A fixed price's ranges on its Contract page (build plan Phase 45; US-04.2.15): newest first, with From, To worked out (Onwards on the last), Price ex GST, the Change on the range before (First on the oldest) and the Procedures each range priced; In force and Future pills. Ended ranges fold after three behind Show earlier. A range is added as a row (Add a price range, the card in edit with its footer) or corrected in its row (Save, Cancel, Remove, never the last); refusals show on the row. Under it the ContractChangeNotice lists each authorised Procedure that kept its old range price." shared="shared/table/TableShell.tsx" note="On the shared Card (editing and footer), TableShell (dense), Th, Td, Pill, TextAction, AddRowButton and the compact TextField. Writes go to the demo store.">
          <PriceRangesTableExample />
        </CatalogueRow>
        <CatalogueRow name="ContractEventFees" source="apps/admin/flows/ContractEventFees.tsx" usedIn={A} what="The Contract editor's Event fees (catch-up Phase 39b): the fixed fee a Contract charges for a type of pre-op or post-op event, in place of the time recorded. The price ranges' table anatomy: event type, holder code and description, fixed price in mono, Edit and Remove, and an add row. Office only; edited in place and audited; never changes a Procedure's price or the picker." shared="shared/table/TableShell.tsx" note="St George's ACC with its seeded STGACC-PAIN fee; writes go to the demo store.">
          <ContractEventFeesExample />
        </CatalogueRow>
        <CatalogueRow name="CreditTrails (Ledger)" source="apps/admin/screens/LedgerScreen.tsx" usedIn={A} what="One anaesthetist's credits on the Ledger (catch-up Phase 39, work item 12; US-08.6.2): each credit as its trail, Debit (the original), Credit (the credit note), Contra (the negative invoice, offset against the unpaid payable or netting in the next payment run) and New debit for each new invoice, every number opening its document. Every word from shared/procedureEventCopy.ts." shared="shared/table/TableShell.tsx" note="Empty until a credit of AA-2026-H03 is issued (the CreditNoteDocument row's Issue a credit).">
          <CreditTrailsExample />
        </CatalogueRow>
      </FamilySection>

      {/* ------------------------------------------------------------------ */}
      <FamilySection id="cards">
        <CatalogueRow name="SupportHours" source="shared/support/SupportHours.tsx" usedIn={AWM} what="The support panel's first block (catch-up Phase 43b): the open or closed status line from the demo clock and the holiday calendar (a success dot when open, mist when closed), the phone line in mono (plain text: the number is fictional) and the hours, on a sunken card." shared="shared/support/SupportHours.tsx">
          <SupportHoursExample />
        </CatalogueRow>
        <CatalogueRow name="ResponseTable" source="shared/support/ResponseTable.tsx" usedIn={AWM} what="A channel's response times from SUPPORT_CONFIG (catch-up Phase 43b): DefRows of priority, time and meaning; product support adds its outside-business-hours cover. Shown here for product support." shared="shared/support/ResponseTable.tsx">
          <ResponseTableExample />
        </CatalogueRow>
        <CatalogueRow name="TicketList" source="shared/support/TicketList.tsx" usedIn={AWM} what="The tickets, newest first (catch-up Phase 43b): id in mono, subject, a status Pill (Logged, Responded, Closed), the respond-by in mono or why there is none, and the Response overdue, Best effort or Awaiting AA's approval pills. Shown with the seeded product-support tickets and their requester." shared="shared/support/TicketList.tsx">
          <TicketListExample />
        </CatalogueRow>
        <CatalogueRow name="ListOriginRow" source="apps/admin/components/ListOriginRow.tsx" usedIn={A} what={`Where a List came from (catch-up Phase 34; US-02.2.4): one DefRow on the session and ${DRAFT_LIST} drawers, the origin in words and, as its note, who the office's replies go to through the one email helper (the List's sender first).`} shared="shared/ui/DefRow.tsx">
          <ListOriginExample />
        </CatalogueRow>
        <CatalogueRow name="WarningsToDo" source="apps/admin/components/WarningsToDo.tsx" usedIn={A} what="The rail's To-do card: every open warning, soonest first, each with Open and Clear, and a show-more toggle. Its count is the shared CountBadge (read as 3 to do)." shared="shared/ui/Card.tsx" note="On the shared Card (padding card, flat; UI unification U6), its h2 naming the section. Clear writes a clearance to the demo store.">
          <WarningsToDoExample />
        </CatalogueRow>
        <CatalogueRow name="ReconciliationCard" source="apps/admin/components/ReconciliationCard.tsx" usedIn={A} what="The rail's Reconciliation card (catch-up Phase 37; US-13.2.4): Books square or Out of balance, derived and never stored, each failing check with its difference, then up to five unresolved items oldest first with amount and age, each linking to where it is handled." shared="shared/ui/Card.tsx" note="On the shared Card, under the To-do. Reads reconciliationStatusOf; Inject unmatched receipt on the Ledger puts it out of balance.">
          <ReconciliationCardExample />
        </CatalogueRow>
        <CatalogueRow name="Xero panels (XeroConnectionLine · XeroQueuePanel · XeroDivergencePanel)" source="apps/admin/components/XeroPanels.tsx" usedIn={A} what="The Billing monitor's Xero panels (catch-up Phase 37): the connection line, the Xero sync queue with Retry now, and the invoices changed directly in Xero with the Resolve side panel." shared="shared/ui/Card.tsx" note="On the shared Card, TableShell (nested, compact), Pill, Notice, Button, EmptyState and SidePanel. Simulate Xero outage on the Billing monitor fills the queue.">
          <XeroPanelsExample />
        </CatalogueRow>
        <CatalogueRow name="PaymentCyclePanel" source="apps/admin/components/PaymentCyclePanel.tsx" usedIn={A} what="The Billing monitor's weekly payment cycle (catch-up Phase 39a; replaces 37's payables panel): the week's four steps on the step rail, what is waiting for this week's run per anaesthetist (netting and still to net), the checks before payment with Hold out of this run and Mark fixed, Approve, Send payment schedule, the badged Run payables in Xero, and the payment runs." shared="shared/ui/Card.tsx" note="On the shared Card, StepRail (compact, with pendingValue and shotPrefix), TableShell (nested, compact), Pill, Notice, Button, TextField and EmptyState. Stage a payment week on the Billing monitor fills it.">
          <PaymentCyclePanelExample />
        </CatalogueRow>
        <CatalogueRow name="PatientRecord" source="apps/admin/screens/patients/PatientRecord.tsx" usedIn={A} what="The patient record (catch-up Phase 40; US-11.3.1, US-11.3.3, US-13.2.2): the NHI as identifier, three balance tiles (Balance whoever pays, Billed to the patient with the strength pill, Other payers) and the By payer line, 15a's warnings with Clear and an optional note, every invoice with its status, Resend, Log follow-up and send history, the Bookings, Details differ, Details with Ethnicity, and the follow-up log. Catch-up Phase 40a adds the Details card's NHI register row (Last refreshed, Refresh from NHI register and the Provisional pill) and its refresh panel." shared="shared/ui/Card.tsx" note="On the shared PageHeader, StatTile (outlined), Card, TableShell (nested), Pill, DefList, Segmented, TextArea, 15a's WarningsPanel and WarningTriangle, and EditPatientSheet (with the Ethnicity code field). Sarah Mitchell (CQY9304) here.">
          <PatientRecordExample />
        </CatalogueRow>
        <CatalogueRow name="RegisterRefreshRow / RegisterRefreshPanel" source="apps/admin/screens/patients/RegisterRefresh.tsx" usedIn={A} what="Refresh from the NHI register on the patient record (catch-up Phase 40a; US-14.4.1): the Details card's NHI register row (Not refreshed yet, or Last refreshed with the date and time in mono), the teal Refresh from NHI register and the neutral Provisional pill (on demand, to confirm with AA); the panel under it looks the NHI up through the simulated Hub, then shows what would change in DetailChoiceTable (Keep or Use register; an enrichment reads Will be added) and applies it with refreshPatientFromRegister." shared="shared/ui/DefRow.tsx" note="On the shared DefRow, Button, Pill, Card, FieldHint, FormError, TextAction, NhiLookupStatus and NhiPurposeNote. The live panel is on Fiona Gray's record, /admin/patients/ZAM1098.">
          <RegisterRefreshRowExample />
        </CatalogueRow>
        <CatalogueRow name="PrepaymentsRailCard" source="apps/admin/components/PrepaymentsRailCard.tsx" usedIn={A} what="The rail's Pre-payments card (catch-up Phase 27): every upcoming prepaid Booking, one row per payer, with its amount, a status pill and the days to go. An awaiting row opens the Invoices strip; the others open the Booking. Its count is the shared CountBadge; empty, the shared EmptyState." shared="shared/ui/Card.tsx" note="On the shared Card (padding card, flat), under the To-do card. Reads useUpcomingPrepayments.">
          <PrepaymentsRailCardExample />
        </CatalogueRow>
        <CatalogueRow name="PrepaymentApprovalStrip" source="apps/admin/components/PrepaymentApprovalStrip.tsx" usedIn={A} what="The Invoices screen's Awaiting approval strip (catch-up Phase 27): one row per Booking and payer, Approve and send (disabled with its reason until there is an amount), and the Prepayment approval Switch in its header; switching off confirms in a ConfirmSheet." shared="shared/ui/Card.tsx" note="On the shared Card, TableShell, Button (disabledReason), Switch and ConfirmSheet. Approve and send writes to the demo store.">
          <PrepaymentApprovalStripExample />
        </CatalogueRow>
        <CatalogueRow name="BookingAsAtPanel" source="shared/booking/BookingAsAtPanel.tsx" usedIn={A} what="View as at, from a History row (catch-up Phase 35): the Booking rebuilt from the audit at that point on the sunken panel, its rows the shared DefRow, each Procedure under an Eyebrow; Paid by as the live line decides it (the payer only where the Contract bills the payer). No money. A gap in the record reads as incomplete, in words." shared="shared/booking/BookingAsAtPanel.tsx" note="Read-only; shown at the Booking's newest entry.">
          <BookingAsAtPanelExample />
        </CatalogueRow>
        <CatalogueRow name="ProfileChrome" source="apps/admin/components/ProfileChrome.tsx" usedIn={A} what="ProfilePage: the record pages' frame (the surgeon, the anaesthetist, a Contract): AdminPage fluid with the back link, the name as the h1 with its id chip beside it, the page's actions and, since build plan Phase 45, the record's own LineTabs under the title; their cards and facts on the shared Card (padding card) and DefRow stacked (UI unification U6). The id chip shows a mist placeholder when no value is held (catch-up Phase 17b, a surgeon with no HPI CPN yet)." shared="shared/ui/PageHeader.tsx" note="Its back link is the shared BackLink (teal, a real link); here it returns to this catalogue.">
          <ProfileChromeExample />
        </CatalogueRow>
        <CatalogueRow name="drawerParts (DrawerSection, DrawerLink)" source="apps/admin/components/drawerParts.tsx" usedIn={A} what="The drawers' section headings (an Eyebrow over the body) and inline links, shared by SlotDrawer and DraftListDrawer (one copy since U2); their label and value rows are the shared DefRow since UI unification U6, and their action buttons the shared Button at the compact size, a disabled one printing its reason (U5)." shared="shared/ui/Eyebrow.tsx" note="ActionBtn folded into Button in UI unification U5.">
          <DrawerPartsExample />
        </CatalogueRow>
        <CatalogueRow name="MasterHeader" source="apps/admin/screens/masters/chrome.tsx" usedIn={A} what="A master view's title row over the shared PageHeader (section size): the title, one subtitle line, an optional count and the teal Add action. A seeded view's subtitle ends with the seeded line (Loaded once at go-live from AA's controlled spreadsheet, then kept here by hand.) and the waiting-load banner follows; section is a second header inside a view, with neither." shared="shared/ui/PageHeader.tsx" note="Replaced the masters Header. The Add action is stubbed here.">
          <MasterHeaderExample />
        </CatalogueRow>
        <CatalogueRow name="AdminPage / PageToolbar / PageBody" source="apps/admin/components/AdminPage.tsx" usedIn={A} what="The one Admin page frame: every Admin screen is one AdminPage, so the back link, the title row (the shared PageHeader, admin size), the tabs, one PageToolbar and the PageBody sit in the same places on every page and no screen sets its own width. Three modes: fit for list pages (one window high, the list card a TableShell fit whose rows scroll inside it under a sticky header, the pager in its footer), fluid for records and dashboards (the full width, the page scrolling) and document for the invoice, credit note and remittance advice (the paper at its print width with the rail beside it, both on the left). PageToolbar holds the compact filters and a count at its end; PageBody takes an optional section nav on the left and the one-width rail on the right." shared="shared/ui/PageHeader.tsx" note="On the shared PageHeader and BackLink; its list card is the shared TableShell (fit, footer). A fluid example: a title, one action, a toolbar with a hospital filter and a count, and a table with its pager in the footer beside a rail Card. The widths are in apps/admin/layout.ts.">
          <Wide minWidth={980}>
            <AdminPageExample />
          </Wide>
        </CatalogueRow>
        <CatalogueRow name="PageHeader" source="shared/ui/PageHeader.tsx" usedIn={AW} what="A page's title row (U6): web 28/34, admin 24/30, or the 18/700 section title; an h1, a slate sub-line, right-aligned actions, a count inside the heading or an aside beside it, headingRef for focus return." shared="shared/ui/PageHeader.tsx">
          <PageHeaderExample />
        </CatalogueRow>
        <CatalogueRow name="Card (card)" source="shared/ui/Card.tsx" usedIn={AWM} what="The shared Card (U6, question 20): padding card (16, flat, 14/600; the Admin rail, the profiles, the phone) or panel (20, e1, 17/600; the web panels), radius 14, its title an h2 naming the section; the warning tone. Build plan Phase 45: footer (right-aligned actions under a hairline, the Admin Review sheet footer's alignment) and editing (data-editing, the teal edge and halo, Editing in place of the heading's action), both off by default; a Contract page's cards are each saved on their own with them. Build plan Phase 46: step, a numbered chip (teal on the teal tint) in a 26px column before the heading and body, New contract's four steps (contracts-section.html #new)." shared="shared/ui/Card.tsx">
          <CardExample />
        </CatalogueRow>
        <CatalogueRow name="Eyebrow" source="shared/ui/Eyebrow.tsx" usedIn={AWM} what="The 11px caps tracked label (U6, question 23): 11/600/0.06em everywhere, tones mist, slate, warning and brand, a heading where it titles a section. FieldLabel is this component." shared="shared/ui/Eyebrow.tsx">
          <EyebrowExample />
        </CatalogueRow>
        <CatalogueRow name="DefList / DefRow" source="shared/ui/DefRow.tsx" usedIn={AWM} what="Label and value pairs as a dl (U6): inline (the drawers and Booking detail, labels at 80), stacked (the profile facts) and settings (the base of Phase 26's ProfileRow, with a trailing lock and the bank number masked)." shared="shared/ui/DefRow.tsx">
          <DefRowExample />
        </CatalogueRow>
        <CatalogueRow name="ProcedureStack" source="shared/booking/ProcedureStack.tsx" usedIn={AWM} what="One Procedure's procedure text, invoice description, Contract and RVG code on every Booking screen, Admin Review and the List drawer, in full or compact density; still-to-choose parts are neutral and dashed. On a multi-procedure Booking its heading takes a badge, the neutral Primary pill (catch-up Phase 23)." shared="shared/booking/ProcedureStack.tsx" note="Fixed example views; nothing writes to the demo data.">
          <ProcedureStackExample />
        </CatalogueRow>
        <CatalogueRow name="FunderDetailsView" source="shared/booking/FunderDetailsView.tsx" usedIn={AWM} what="The Booking's insurer or funder and its approval number (catch-up Phase 21): None; an insurer with its number; an insurer with no number (the warning-tint chip); a funder with none. FunderSheet edits it with radio chips." shared="shared/booking/FunderDetailsView.tsx" note="Fixed example details; nothing writes to the demo data. The approval number row is a shared DefRow (UI unification U6), its label kept at 96 because it wraps at 80.">
          <FunderDetailsExample />
        </CatalogueRow>
        <CatalogueRow name="PaidByRow" source="shared/booking/PaidByRow.tsx" usedIn={AWM} what="Paid by in the Billing card (catch-up Phases 22 and 22a; US-08.2.3, US-11.2.2): the Procedure's payer with Patient or the relationship and the warning-tint Email or postal address needed and Under 18 pills where its Contract bills the payer; the holder where the Contract bills its holder; a split's parties, in the warning tint when it no longer fits; Payer: not billed yet with no Contract. On web and Admin a line at the card's foot, on the phone the Billing summary's last row: Change beside the payer's name opens PaidBySheet with who pays and the offer; Split on the right opens it with the split alone." shared="shared/booking/PaidByRow.tsx" note="Read-only examples over fixed views; the sheet opens on a real Booking. The Paid by line is a shared DefRow since UI unification U6 (its Change and Split inside the value).">
          <PaidByRowExample variant="line" />
        </CatalogueRow>
        <CatalogueRow name="SplitAllocation" source="shared/booking/CreditForm.tsx" usedIn={A} what="The split's running figures (catch-up Phase 39; US-08.6.4, OQ-77 part 1): Credited, New invoices and Left to allocate, before GST, in mono tabular figures, from the pure splitTotalCheck. Left to allocate is neutral while short, the warning tone when over (never red) and the success tint with a tick at $0.00; any GST rounding across the components is said and accepted." shared="shared/booking/CreditForm.tsx" note="Shown short, over and settled with a cent of GST rounding.">
          <SplitAllocationExample />
        </CatalogueRow>
        <CatalogueRow name="PrepaymentMovedCard, RebookDialog, PrepaymentHistory (PrepaymentFollowupCards)" source="apps/admin/components/PrepaymentFollowupCards.tsx" usedIn={A} what="The Admin Booking detail's prepayment follow-up (catch-up Phase 41; US-06.5.3, US-06.5.4): a moved prepaid Booking's card (kept at the agreed amount, now with the new anaesthetist, the invoice unchanged) with Email patient: anaesthetist changed (a Dialog with the template, preview, recipient and its one Provisional (OQ-120) caption); on a cancelled prepaid Booking, Rebook with another anaesthetist (a Dialog: anaesthetist, their ACTIVE Lists from today, the new prepayment at their own price); and the history across a rebook (earlier prepayment refunded, this prepayment)." shared="shared/booking/PrepaymentMovedCard.tsx" note="The history shows on Nair's Booking once it is cancelled and rebooked; the moved card once Riley's sent prepayment is moved.">
          <PrepaymentHistoryExample />
        </CatalogueRow>
        <CatalogueRow name="PrepaidSettlementBlock" source="shared/booking/PrepaidSettlementBlock.tsx" usedIn={AWM} what="A prepaid Procedure once its List is authorised (catch-up Phase 41; US-06.4.1): the prepaid amount as the price with its invoice, the recorded BTM for reference only, the transfer from the AA Holding account, Nothing is invoiced or credited automatically, the credits and additional invoices raised by hand, and the Credit note (the whole prepayment invoice) and Create additional invoice options. Before authorise the office sees it only when the prepayment is no longer needed or was sent before a change." shared="shared/booking/PrepaidSettlementBlock.tsx" note="Authorise writes to the demo store; then shown on Nair's rhinoplasty as the office.">
          <PrepaidSettlementExample />
        </CatalogueRow>
        <CatalogueRow name="CorrectInvoiceCard" source="apps/admin/screens/InvoiceDocument.tsx" usedIn={A} what="Correct this invoice on the invoice rail (catch-up Phase 39; US-08.6.5, US-08.6.2, US-08.6.4): its caption, then Credit note, Credit in full and rebill and, on a standard invoice, Split into additional invoices, as teal text actions like the Additional invoices card's Create additional invoice above it. Each opens the credit sheet on this invoice. Disabled while a credit waits or once credited, the sentence once under Credit note; the split checks this invoice itself, with its own sentence. On a prepayment invoice the refusal is the caption and there are no actions." shared="shared/ui/TextAction.tsx" note="On the seeded AA-2026-H03 as the office.">
          <CorrectInvoiceCardExample />
        </CatalogueRow>
        <CatalogueRow name="Review summary tiles (ReviewScreen)" source="shared/ui/StatTile.tsx" usedIn={A} what="The review page's four summary tiles, then the bookings table: each Procedure's stack with its own flags and Approve or Correct on a Contract change (catch-up Phase 21a), the payer and insurer, alerts, warnings with Clear, totals and flags on the shared Pill, the action bar (Approve all Contract changes, Authorise) and the authorise confirm." shared="shared/ui/StatTile.tsx" note="Tile is not exported: the row mounts the real ReviewScreen. Authorise writes to the demo store." height={560}>
          <ReviewScreenExample />
        </CatalogueRow>
      </FamilySection>

      {/* ------------------------------------------------------------------ */}
      <FamilySection id="custom">
        <CatalogueRow name="SignalFilterButton (DayGrid focus filters)" source="apps/admin/components/DayGrid.tsx" usedIn={A} what="The Day grid footer's aria-pressed pills (Needs attention, Conflict, Has note, Has warnings) that narrow and regroup the rows, with Reset filters." shared="Stays custom" note="Not exported: the row mounts the real DayGrid with an empty roster, so only its live footer shows.">
          <FocusFiltersExample />
        </CatalogueRow>
        <CatalogueRow name="StubRow and StubMarker" source="shared/stubs/StubParts.tsx" usedIn={AWM} what="A stub on a List (catch-up Phase 33a): a booking waiting at intake, not a Booking. StubRow is the Booking row with the dashed placeholder edge on the mild warning tint and the triangle disc: time, name and wording as received, the reason and who resolves it. StubTableRow holds it in a Bookings table and shows what was received inline; StubMarker is the triangle beside a List's count (Lists rows, the Day grid block); ListStubNote reads '1 waiting at intake' beside the progress. On Admin it ends in StubResolveLink, 'Resolve on Matching'." shared="shared/stubs/StubParts.tsx" note="A fixed example stub; nothing writes to the demo data.">
          <StubSetExample />
        </CatalogueRow>
        <CatalogueRow name="RemittanceAdviceDocument (on the document parts)" source="shared/billing/RemittanceAdviceDocument.tsx · shared/billing/docParts.tsx" usedIn={AW} what="A payment run's remittance advice (catch-up Phase 39a; US-10.2.5): REMITTANCE ADVICE with the anaesthetist as supplier and AA as agent, the week, paid on and paid to, every BCTI paid, every negative netted as a signed amount, and Paid to you. The Admin document and web Accounts' sheet are one component." shared="shared/billing/RemittanceAdviceDocument.tsx" note="Built from the document parts the tax invoice and the credit note share (DocMasthead, AgentBlock, DocLinesTable with a printed signed amount, DocTotalLines), lifted out of InvoiceDocument so the three documents stay one family. Dr Souter's Week 47 advice here.">
          <RemittanceAdviceDocumentExample />
        </CatalogueRow>
        <CatalogueRow name="ContractHistory" source="apps/admin/flows/ContractHistory.tsx" usedIn={A} what="A Contract's History tab (catch-up Phase 25; US-04.1.3): its audited changes newest first through the shared HistoryTimeline (who, when, the values before and after), then the Procedures locked against it with links to their Bookings and invoices; EmptyState before any change." shared="shared/booking/HistoryTimeline.tsx" note="Shown on the fixed-price Contract of the seeded AUTHORISED Face lift.">
          <ContractHistoryExample />
        </CatalogueRow>
        <CatalogueRow name="ProcedureEventsList" source="shared/booking/ProcedureEventsList.tsx" usedIn={AWM} what="A Procedure's events (catch-up Phase 38b; US-03.7.3): under each Procedure on the Booking detail in all three apps. Each row: the kind, the date, the first line's description, who raised it and the status pill (Awaiting review warning, Approved neutral, Invoiced success, Declined neutral with its reason). The office sees the total ex GST, the party, Review, Edit and Remove and the invoice number; the anaesthetist, on their own Procedure, the total and party and Edit and Remove on what they raised; the anaesthetist apps hide the section on a Procedure that is not theirs and has none; since catch-up Phase 39b it lists pre-op, post-op and billing events and carries the two add buttons. A credit (catch-up Phase 39) is its own row: Credits AA-2026-0007 in full and the reason, the credited invoice's total, Issued once issued and the credit note's link in Admin; its new invoices read Rebill of AA-2026-0007." shared="shared/booking/ProcedureEventsList.tsx" note="The seeded event EV0001 as the office sees it; every word from shared/procedureEventCopy.ts.">
          <ProcedureEventsListExample as="office" />
        </CatalogueRow>
        <CatalogueRow name="CreditNoteDocument (CreditedBanner)" source="apps/admin/screens/InvoiceDocument.tsx" usedIn={A} what="A credit note on the invoice's own sheet (catch-up Phase 39; DM-24): CREDIT NOTE, Credits AA-2026-H03 in full, the party it goes to, the reason, who raised it, the mirrored Credit: lines and Total credited, the supplier and agent block (the same DocMasthead, AgentBlock and DocTotals as the tax invoice). The rail: Delivery (sent by the engine, Simulated send), the Negative invoice, the New invoices and the Xero card. Above it, the credited original's banner: Credited in full by CN-2026-0001 on the date, rebilled as the new invoice, all links." shared="Stays custom" note="Issue a credit submits, approves and runs a credit of AA-2026-H03 in the demo store, then shows both.">
          <CreditNoteDocumentExample />
        </CatalogueRow>
        <CatalogueRow name="DayGrid" source="apps/admin/components/DayGrid.tsx" usedIn={A} what={`The daily scheduling canvas: one row per anaesthetist, blocks on a 07:00 to 18:00 ruler, conflict and attention overlays, the ${DRAFT_LIST} band and the filter footer. Cut down to 10 rows.`} shared="Stays custom" note="Blocks open the real SlotDrawer. Each block takes its fill and dashed outline from blockFill (UI unification U6, U23); the conflict and attention outlines stay its own." height={620}>
          <DayGridExample />
        </CatalogueRow>
        <CatalogueRow name="DraftListBand" source="apps/admin/components/DraftListBand.tsx" usedIn={A} what={`Today's ${DRAFT_LISTS} on the same ruler, above the anaesthetists; each opens its drawer.`} shared="Stays custom" note="Its UNASSIGNED label is the shared Eyebrow (11/600, UI unification U6).">
          <DraftListBandExample />
        </CatalogueRow>
        <CatalogueRow name="StatusBlock" source="shared/StatusBlock.tsx" usedIn={AWM} what="A session block filled by its status through blockFill: solid with a bar, hatched Unavailable or dashed Free. Takes a status, or a visual not yet saved (the status sheet's preview, UI unification U6)." shared="shared/StatusBlock.tsx">
          <StatusBlockExample />
        </CatalogueRow>
        <CatalogueRow name="InvoiceDocument" source="apps/admin/screens/InvoiceDocument.tsx" usedIn={A} what="The invoice as a print-styled document (serif voice): the anaesthetist as supplier with their GST number, AA's agent block with the Provisional (OQ-29) pill, the holder's or the patient's layout (the BTM breakdown, cross-match strip and Your reference on the holder's), a split share's note, GST at the foot, and its rail: the Delivery card (Emailed, To post or No invoice address, with Resend or Send), Related invoices and the Xero handoff. Shown at half size." shared="Stays custom" note="Keep it out of a fixed Dialog for print isolation. Its rail actions write to the demo store. The Locked record's rows are the shared DefRow (UI unification U6); the rail cards keep their print voice until Phase 37." height={520}>
          <InvoiceDocumentExample />
        </CatalogueRow>
      </FamilySection>

      {/* ------------------------------------------------------------------ */}
      <FamilySection id="demo">
        <CatalogueRow name="ScaleBanner" source="shared/scale/ScaleBanner.tsx" usedIn={A} what="The full-scale data's banner (catch-up Phase 43): harness chrome under the bar, on the shared Notice (warning tint) while generating or loaded, every figure counted, a Timings disclosure with each timed screen's demo and full-scale render median. Never in the PWA." shared="Demo only" note="Shows only while Load full-scale data is running or loaded.">
          <Notice tone="warning">{SCALE_GENERATING_LINE}</Notice>
        </CatalogueRow>
      </FamilySection>
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
      <RadioCard radio={radio.itemProps(0)} checked={value === 'stg'} onSelect={() => setValue('stg')} title="St George's" titleExtra={<span className="mono" style={{ fontSize: 12 }}>5 rows</span>} description="Theatre list, week of 30 November">
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
          { kind: 'createList', title: 'Create a List in a session', description: 'A new List holding this Booking.', disabledReason: 'No anaesthetist is free on Tue 1 Dec AM.' },
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

/** GroupIndex: the Holder grouping's index, one group picked. */
function GroupIndexExample() {
  const [value, setValue] = useState('PY-STG')
  return (
    <div style={{ width: 200 }}>
      <GroupIndex
        label="Groups"
        value={value}
        onSelect={setValue}
        allLabel="All Contracts"
        allCount={343}
        items={[
          { key: 'PY-AA', label: 'Anaesthesia Associates', count: 3 },
          { key: 'PY-CES', label: 'Christchurch Eye Surgery', count: 144, section: 'Hospitals' },
          { key: 'PY-STG', label: "St George's", count: 31, section: 'Hospitals' },
          { key: 'PY-NIB', label: 'nib', count: 2, section: 'Insurers' },
        ]}
        note="A Contract linked to two surgeons shows under both."
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

function InfoTipDesktopExample() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
      Reading the day
      <InfoTip topic="day.statuses" />
    </span>
  )
}

/** The shared Disclosure (UI unification U7): the pairing Ended section's look, and the bare row toggle. */
function DisclosureExample() {
  const [rowOpen, setRowOpen] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 360 }}>
      <Disclosure summary="Ended (2)" style={{ borderTop: `1px solid ${neutral.line}`, paddingTop: 14 }} gap={10}>
        <div style={{ fontSize: 13, color: neutral.slate }}>Dr Chen · Not preferred · ended 6 Nov</div>
      </Disclosure>
      <div style={{ fontSize: 13 }}>
        <DisclosureButton open={rowOpen} onToggle={() => setRowOpen((v) => !v)} style={{ color: neutral.ink }}>
          Dr Souter
        </DisclosureButton>
      </div>
    </div>
  )
}
