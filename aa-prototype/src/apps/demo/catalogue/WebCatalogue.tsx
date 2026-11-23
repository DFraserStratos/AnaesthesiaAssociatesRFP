import { SurfaceProvider } from '../../../shared'
import { MoveListPromptProvider } from '../../../shared/flows/MoveListPrompt'
import { CataloguePage, CatalogueRow, FamilySection } from './CatalogueKit'
import { useWebFixtures } from './web/fixtures'
import * as D from './web/demos'
import { ProcedureStackExample } from './procedureStackExample'
import { FunderDetailsExample, PayerFieldsExample } from './payerExamples'
import { PaidByRowExample, PaidBySheetExample, PartyPickerExample } from './splitExamples'
import { AdditionalInvoiceButtonExample, AdditionalInvoiceSheetExample, AnaesthetistCreditSheetExample, CreditNoteButtonExample, EventSheetsExample, ProcedureEventsListExample } from './eventExamples'
import { RemittancesTabExample } from './admin/paymentRunExamples'
import { BalanceAlertChipExample, SharedNotesExample, StrengthPillExample } from './patientAlertExamples'
import { PrepaidSettlementExample } from './prepaymentFollowupExamples'
import { SupportSidePanelExample } from './supportExamples'

const W = 'Web'
const WA = 'Web · Admin'
const WM = 'Web · Mobile'
const ALL = 'Admin · Web · Mobile'

/**
 * /demo/catalogue/web: every hand-built component in the Anaesthetist Web App,
 * plus the shared ones it uses, live and interactive, one per row, grouped by
 * component family with the shared component each is or is built on. Demo only.
 * Rows read seeded data as Dr Souter; navigation is stubbed so nothing leaves
 * the page.
 */
export function WebCatalogue() {
  const f = useWebFixtures()
  return (
    <CataloguePage
      title="Anaesthetist Web App · UI components"
      intro="Every hand-built component in the Web app and the shared ones it uses, live on seeded data as Dr Souter, grouped by component family, each naming the shared component it is or is built on. Navigation is stubbed. A few rows open real flows: confirming one changes the demo data, and Demo reset puts it back."
    >
      {/* The web surface here too, so the move sheet the provider opens is a centred dialog. */}
      <SurfaceProvider variant="web">
      <MoveListPromptProvider actor={f.actor}>
        <FamilySection id="actions">
          <CatalogueRow name="IconButton" source="shared/ui/IconButton.tsx" usedIn={ALL} what="A button holding only a glyph or icon (UI unification U5): the desktop step buttons at each mockup's size (32 the week strip, 36 Admin Day, 38 Find cover and My availability) with ‹ ›, the phone's 44px round month and square stepper buttons. Its label is required; CloseButton is the borderless X." shared="shared/ui/IconButton.tsx" note="Was IconBtn, NavButton and WeekNavButton here, and SquareBtn, StepButton and the steppers elsewhere.">
            <D.IconButtonsDemo />
          </CatalogueRow>
          <CatalogueRow name="TextAction" source="shared/ui/TextAction.tsx" usedIn={ALL} what="A borderless teal word that does one thing (UI unification U5): sm 12.5 in tables, md 14 in cards, lg 15 with a 44px target on the phone, flush, inline inside a sentence, and a printed reason when disabled. The dashboard's View outstanding invoices is one. With to (catch-up Phase 40) it is a real router link in the same look: the patient screens' record, invoice and Master data links." shared="shared/ui/TextAction.tsx" note="Was the dashboard's LinkButton, SeriesList's linkStyle and about forty inline teal copies, and the patient screens' private TealLink.">
            <D.LinkButtonDemo />
          </CatalogueRow>
          <CatalogueRow name="SubmitAction" source="apps/web/screens/ListDetailView.tsx" usedIn={W} what="List detail's primary action in four states: blocked (count left, opens the real blockers sheet), ready, submitted and authorised." shared="shared/ui/Button.tsx" note="Recreated: local to ListDetailView.tsx. Submitting replaces the button with a green pill, with no live region or toast.">
            <D.SubmitActionDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="Add a booking (dashed)" source="shared/ui/AddRowButton.tsx" usedIn={W} what="The full-width dashed button under the Bookings table. Opens the real Add a booking dialog." shared="shared/ui/AddRowButton.tsx" note="The shared AddRowButton (UI unification U6, U35), desktop size; the phone List detail uses its touch size. Always type button.">
            <D.AddBookingButtonDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="CompleteBar" source="shared/capture/CompleteBar.tsx" usedIn={ALL} what="Booking capture's Mark complete button, which becomes a green done bar with Amend while the List is active." shared="shared/capture/CompleteBar.tsx" note="Local state here; in the app it completes and reopens the Booking.">
            <D.CompleteBarDemo />
          </CatalogueRow>
          <CatalogueRow name="AdditionalInvoiceButton" source="shared/booking/AdditionalInvoiceButton.tsx" usedIn={ALL} what="The button on the Procedure's Paid by row, beside Split (catch-up Phase 38b; US-08.6.3 Button): Create additional invoice for the office on any invoiced Procedure, Raise additional invoice for the anaesthetist on their own; absent on a colleague's or before the List is authorised; disabled with the refusal sentence otherwise." shared="shared/booking/AdditionalInvoiceButton.tsx" note="Over the seeded event EV0001 (Dr Souter, David Chen's HP03); writes go to the demo store.">
            <AdditionalInvoiceButtonExample />
          </CatalogueRow>
          <CatalogueRow name="CreditNoteButton (the anaesthetist's)" source="shared/booking/CreditNoteButton.tsx" usedIn={ALL} what="Credit note beside Raise additional invoice on the anaesthetist's own invoiced Procedure (catch-up Phase 39; US-08.6.5, creditOptionFor): crediting the Procedure's live invoice in full through the app's credit sheet (a prepayment invoice whole, from the PrepaidSettlementBlock once the List is authorised, catch-up Phase 41); hidden on a colleague's, disabled with its sentence while a credit waits or once credited." shared="shared/booking/CreditNoteButton.tsx" note="As Dr Souter on David Chen's HP03.">
            <CreditNoteButtonExample as="anaesthetist" />
          </CatalogueRow>
        </FamilySection>

        <FamilySection id="pills">
          <CatalogueRow name="StatusLegend (toggle mode)" source="shared/StatusLegend.tsx" usedIn={ALL} what="The status legend as compact chips. Given activeStatuses and onToggleStatus it becomes a status filter; click the chips." shared="shared/StatusLegend.tsx" note="A group of toggles without a toggle group's keyboard model.">
            <D.StatusLegendDemo />
          </CatalogueRow>
          <CatalogueRow name="StatusChip" source="shared/StatusChip.tsx" usedIn={ALL} what="The pill for a List type or availability status, coloured from the status master. Every status in the legend is shown." shared="shared/StatusChip.tsx" note="Status colours become --status-* tokens with tint and on-tint values.">
            <D.StatusChipDemo />
          </CatalogueRow>
          <CatalogueRow name="ProgressPill" source="shared/schedule/ProgressPill.tsx" usedIn={ALL} what="A List's progress: To finish, Ready to submit, Done · unbilled, Invoiced, Authorised." shared="shared/schedule/ProgressPill.tsx" note="One more pill family to fold into Badge variants.">
            <D.ProgressPillDemo />
          </CatalogueRow>
          <CatalogueRow name="DayChip (desktop)" source="shared/ui/DayChip.tsx" usedIn={W} what="The teal chip naming the picked day on the Lists page. Click it to close the day and go back to the main view." shared="shared/ui/DayChip.tsx" note="The shared DayChip at the desktop size (UI unification U6, U35); the mobile DayChip is the same component at the touch size. Its full name says what Enter does.">
            <D.DayChipDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="WarningTriangle" source="shared/warnings/WarningTriangle.tsx" usedIn={ALL} what="The small warning marker on a Booking, coloured by the strongest open warning, with a count when there are several." shared="shared/warnings/WarningTriangle.tsx" note="The warning text lives only in title=, which keyboard and touch users never see.">
            <D.WarningTriangleDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="BalanceAlertChip" source="shared/patients/BalanceAlertChip.tsx" usedIn={WM} what="The anaesthetist's balance colour code (catch-up Phase 40) on the Booking row of her List and in the Booking detail: red for a strong balance warning, yellow for a mild one or a credit. No amount, no name, no Clear, no patient link; it ignores the office's Clear." shared="shared/patients/BalanceAlertChip.tsx" note="On the shared Pill (sm on the row with the full sentence in title, lg wrapping in the detail).">
            <BalanceAlertChipExample />
          </CatalogueRow>
          <CatalogueRow name="StrengthPill" source="shared/warnings/StrengthPill.tsx" usedIn={ALL} what="A warning's strength, Mild or Strong, in the warning's own tone, neutral once cleared (catch-up Phase 40): each row of the Booking's warnings panel." shared="shared/warnings/StrengthPill.tsx" note="On the shared Pill; one component with the Admin patient screens and the preview row.">
            <StrengthPillExample />
          </CatalogueRow>
          <CatalogueRow name="Who's free chip" source="apps/web/screens/DashboardScreen.tsx" usedIn={W} what="A colleague's name on the dashboard's Who's free panel. A button when her List can move into their free session, a plain chip otherwise." shared="Stays custom" note="Recreated: inline in DashboardScreen.tsx. Why it is or is not clickable is only in title=.">
            <D.WhosFreeChipDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="Progress bar" source="shared/ui/ProgressBar.tsx" usedIn={WM} what="How many Bookings on the List are complete, as a count and a green bar that eases to its new width: the shared ProgressBar (UI unification U5), 200px in the web header and the rest of the row on the phone, a progressbar with its values." shared="shared/ui/ProgressBar.tsx" note="Was built twice, without a role. tone held (catch-up Phase 33a): amber, never the done green, while a stub stands on the List.">
            <D.ProgressBarDemo />
          </CatalogueRow>
        </FamilySection>

        <FamilySection id="fields">
          <CatalogueRow name="SharedNotes" source="shared/notes/SharedNotes.tsx" usedIn={ALL} what="The shared note on a List or Booking (catch-up Phase 40; US-11.3.3): Add note and the notes, newest first, with author and time. The office and the anaesthetist both read and add; a blank note is refused." shared="shared/notes/SharedNotes.tsx" note="One component in all three apps; writes the real store, never a Booking draft. Here on local notes (SharedNotesPanel), so nothing is written.">
            <SharedNotesExample by="Dr Melanie Souter" />
          </CatalogueRow>
          <CatalogueRow name="Lists search (NameSearchBox pill 38)" source="apps/web/screens/ListsScreen.tsx" usedIn={W} what="The Lists page's search for a patient name or NHI: the shared NameSearchBox as the 38px pill, 280px wide, white on the page, beside Go to date, with its clear button (Clear the search field) and the web-lists-search test id." shared="shared/ui/NameSearchBox.tsx" note="Since UI unification U4 there is no WebSearchField: ListsScreen renders NameSearchBox itself. Rebuilt here with the same props; the query is handed up as you type.">
            <D.ListsSearchDemo />
          </CatalogueRow>
          <CatalogueRow name="NameSearchBox" source="shared/ui/NameSearchBox.tsx" usedIn={ALL} what="The one search box in all three apps (UI unification U4): a pill (Find cover, the Lists page) or a field (the move and picker sheets); fill well inside a sheet or card, surface on the page; Escape or the clear button empties it. Filters the list it sits over as you type." shared="shared/ui/NameSearchBox.tsx" note="The web Lists search and the phone's Lists search are this component now, so there is one search input.">
            <D.NameSearchBoxDemo />
          </CatalogueRow>
          <CatalogueRow name="CodePickerSheet" source="shared/capture/CodePickerSheet.tsx" usedIn={ALL} what="The RVG code type-ahead in an Overlay titled by an OverlayHeader: every code under its anatomy heading, search by code or description (the shared NameSearchBox in the well fill, UI unification U4), every row showing code, description and base units." shared="shared/capture/CodePickerSheet.tsx" note="Picks are held locally here.">
            <D.CodePickerDemo />
          </CatalogueRow>
          <CatalogueRow name="RvgCodeList" source="shared/capture/RvgCodeList.tsx" usedIn={ALL} what="Every RVG code under its anatomy heading, the heading pinned to the top of the list until its rows scroll past; shared by the type-ahead field and the code sheet." shared="shared/capture/RvgCodeList.tsx" note="Shown inside CodePickerSheet above and RvgCodeField below. Every row renders.">
            <D.CodePickerDemo />
          </CatalogueRow>
          <CatalogueRow name="RvgCodeField" source="shared/capture/ProcedureCodeCard.tsx" usedIn={ALL} what="A Procedure's RVG code, inside the Billing card's price (on the phone, inside the Billing sheet): typed straight into the field, which drops down every code; once chosen the field shows the code, a click changes it and a cross clears it; a ranged code takes a base value." shared="shared/capture/ProcedureCodeCard.tsx" note="Live on a seeded Booking still to capture; changes write to the demo data.">
            <D.RvgCodeFieldDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="UnitsCard" source="shared/capture/UnitsCard.tsx" usedIn={ALL} what="The base, time and modifier unit rows with steppers (NumberStepper since catch-up Phase 23), each showing where its value came from. On an additional procedure B and M show their figure and caption with no stepper, and one caption row stands in for the Modifiers section (the multi-procedure rule)." shared="shared/capture/UnitsCard.tsx" note="Each stepper is labelled with its row and direction (catch-up Phase 21a); it takes the procedure's allocation in its Booking (catch-up Phase 23). The modifier and ASA controls were being reworked (ModifiersSection) when this page was built, so they are not shown as separate rows.">
            <D.UnitsCardDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="PriceCard" source="shared/capture/PriceCard.tsx" usedIn={ALL} what="What the price comes to (catch-up Phase 24): the units at the rate, the Contract's discount as applied, a fixed price or Needs a price, in quiet mono; a Price $ field, Save price and Use the computed price where the anaesthetist may change it (an RVG Contract that allows it, or the amount on No contract · Fixed price), else the same figures read-only with the reason. No reason is ever asked." shared="shared/capture/PriceCard.tsx" note="Live on a seeded Booking still to capture; Save writes to the demo data. Replaced OverrideCard (the reasoned adjustment and charge).">
            <D.PriceCardDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="AvailabilityEditor" source="shared/availability/AvailabilityEditor.tsx" usedIn={WM} what="The rail on My availability: the selected day's AM and PM sessions and the form to change them, set a range or repeat." shared="shared/availability/AvailabilityEditor.tsx" note="Hand-rolled form state and errors. Saving changes the demo data." height={520}>
            <D.AvailabilityEditorDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="PayerFields (DifferentPayerTick, OtherPayerFields, PostalAddressFields)" source="shared/flows/PayerFields.tsx, PostalAddressFields.tsx" usedIn={ALL} what="The payer form's parts, in PaidBySheet's Who pays and the add forms (U4 migrates them): the Different payer tick, then the other payer's name, relationship chips, email, NZ Post postal address and phone." shared="shared/flows/PayerFields.tsx" note="Local state only; nothing writes to the demo data.">
            <PayerFieldsExample />
          </CatalogueRow>
          <CatalogueRow name="PartyPicker" source="shared/booking/PartyPicker.tsx" usedIn={ALL} what="Choose who an invoice goes to (catch-up Phases 22 and 22a): the Procedure's payer and the Contract's party first, then every Party, searchable by name, and with onAnotherPerson a last row, Another person, for someone who is no Party. The split's party field in PaidBySheet; Phases 38b, 39 and 39b reuse it." shared="shared/booking/PartyPicker.tsx" note="Fixed options on local state; nothing writes to the demo data.">
            <PartyPickerExample />
          </CatalogueRow>
        </FamilySection>

        <FamilySection id="dates">
          <CatalogueRow name="Day stepper" source="apps/web/screens/AvailabilityGrid.tsx" usedIn={W} what="Previous day, the day's name, next day and Today, for Find cover." shared="shared/ui/IconButton.tsx" note="Recreated: inline in AvailabilityGrid.tsx, on the shared IconButton and Button (outline). No arrow-key or T-for-today shortcuts.">
            <D.DayStepperDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="TimesCard" source="shared/capture/TimesCard.tsx" usedIn={ALL} what="Start and Finish capture: Start now and Finish now stamp the demo clock, then minus and plus 5 minute nudges." shared="shared/capture/TimesCard.tsx" note="Live on a seeded Booking; stamping and nudging write to the demo data.">
            <D.TimesCardDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="My availability month grid (DayCell)" source="apps/web/screens/MyAvailabilityCalendar.tsx" usedIn={W} what="Her month, each day with AM and PM session cells, under the shared MonthHeaderRow (Mon to Sun, hidden from screen readers; UI unification U4). Click a day, shift-click to select a range; the rail edits the selection." shared="shared/calendar/MonthHeaderRow.tsx" note="The real screen in a scrolling stage (the grid is local to it). The day cell has no focus style. Saving in the rail changes the demo data." height={720}>
            <D.MyAvailabilityDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="WebGoToDate" source="apps/web/screens/ListsLookback.tsx" usedIn={W} what="The Lists page's Go to date, bounded by her first and last day with work. Since UI unification U4 it renders the shared DateJumpInput (38px, its label beside it), which takes only a full day inside the bounds." shared="shared/ui/DateFields.tsx" note="Pass the demo clock's today and the bounds as min and max. Admin Day's go-to-date is the same part at 36px.">
            <D.GoToDateDemo f={f} />
          </CatalogueRow>
        </FamilySection>

        <FamilySection id="tabs">
          <CatalogueRow name="WebNav" source="apps/web/components/WebNav.tsx" usedIn={W} what="The white top bar: AA logo, the four section tabs with a crimson underline on the active one, and the persona's name and avatar, the button to their own profile (catch-up Phase 26), underlined while it shows. Help before the persona (a TextAction, catch-up Phase 43b) opens the support panel." shared="Stays custom" note="A labelled navigation (Main) whose active tab carries aria-current since UI unification U5; the tabs stay buttons (question 3). The avatar is the shared Avatar (tint, 36).">
            <D.WebNavDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="AvailabilityPageSwitch" source="apps/web/components/AvailabilityPageSwitch.tsx" usedIn={W} what="Switches between the two Availability pages, Find cover and My availability. Since UI unification U5 (question 18) an underline tab strip of links on the shared LineTabs: a labelled navigation, the current page marked aria-current." shared="shared/ui/LineTabs.tsx" note="Was a sliding segmented control doing a tab bar's job; now real links, so the route and the browser's back work as links do.">
            <D.PageSwitchDemo />
          </CatalogueRow>
          <CatalogueRow name="Back link" source="shared/ui/BackLink.tsx" usedIn={ALL} what="The teal chevron that returns to the parent screen (UI unification U5): a real link where a route exists, else a button; desktop 14px, the phone's 15px with a 44px target, a sheet's 13px step back. Review and Invoices keep only their breadcrumb (question 9)." shared="shared/ui/BackLink.tsx" note="One component for the five desktop copies, the phone's header backs, the move sheets' step back and ProfileChrome's link.">
            <D.BackLinkDemo />
          </CatalogueRow>
          <CatalogueRow name="SlidingSegmentedControl" source="shared/ui/SlidingSegmentedControl.tsx" usedIn={ALL} what="A single-choice segmented control whose highlight slides between options. Two colour variants (teal, surface) and two sizes: md, and sm for a 36px toolbar (Admin Day's row order, UI unification U5). The ink variant went with question 17." shared="shared/ui/SlidingSegmentedControl.tsx" note="aria-pressed buttons rather than radios, no roving focus (question 3 keeps them buttons).">
            <D.SlidingSegmentedDemo />
          </CatalogueRow>
          <CatalogueRow name="Segmented" source="shared/ui/Field.tsx" usedIn={ALL} what="The simpler segmented control (no slide). The office uses it for an anaesthetist's status." shared="shared/ui/Field.tsx" note="A second segmented control doing the same job; merge into one.">
            <D.SegmentedDemo />
          </CatalogueRow>
          <CatalogueRow name="FilterPills" source="shared/ui/FilterPills.tsx" usedIn={WM} what="Choose one list filter from a row of solid pills (UI unification U5): the All anaesthetists / Free only pills on Find cover with today's free-session count (36px), and the phone's Week, Month, To-Do and Done (38px). A labelled group with aria-pressed." shared="shared/ui/FilterPills.tsx" note="Was the web FilterChip and the mobile Lists pills, one job built twice.">
            <D.FilterChipDemo f={f} />
          </CatalogueRow>
        </FamilySection>

        <FamilySection id="overlays">
          <CatalogueRow name="SupportSidePanel" source="shared/support/SupportHosts.tsx" usedIn={WA} what="Help from the web top nav (catch-up Phase 43b; US-15.0.8): the support panel in the shared SidePanel at the record width, the help line only and the anaesthetist's own requests." shared="shared/support/SupportHosts.tsx">
            <SupportSidePanelExample app="web" />
          </CatalogueRow>
          <CatalogueRow name="Dialog (web Overlay)" source="shared/surface/Dialog.tsx" usedIn={WA} what="The web surface's modal: a centred card over a scrim, closed by Escape, the corner X or a scrim click. On the one modal stack (useModalLayer): focus goes in, stays in and comes back, and the OverlayHeader title names the dialog. Shown with the dashboard's Which List? picker." shared="shared/surface/Dialog.tsx" note="The Overlay is real; the picker content is recreated from DashboardScreen.tsx.">
            <D.DialogDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="SubmitListSheet" source="shared/flows/SubmitListSheet.tsx" usedIn={WM} what="The submit flow's sheet. In blockers mode it lists each Booking still to finish and why; confirm mode is a ConfirmSheet." shared="shared/flows/SubmitListSheet.tsx" note="Only blockers mode is offered here; confirm mode submits the List for real.">
            <D.SubmitListSheetDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="PaidBySheet (with SplitFeeSection)" source="shared/flows/PaidBySheet.tsx, shared/flows/SplitFeeSection.tsx" usedIn={ALL} what="The one Paid by sheet (catch-up Phase 22a; US-11.2.2, US-08.2.3): a bottom sheet on the phone, a dialog on web and Admin. Opened by Change, it holds who pays (the Different payer tick, the patient's details or the other payer's fields, the Under 18 hint and the contact ask) and, when the payer changes, the offer (the Booking's other Procedures with the same payer, each ticked, never forced). Opened by Split, it holds the split alone (a party or Another person, a $ or % share and Takes the rest per row, each amount live). Save writes it or refuses it whole." shared="shared/flows/PaidBySheet.tsx" note="Opens on Grace Park's first seeded Procedure; Save writes to the demo store.">
            <PaidBySheetExample />
          </CatalogueRow>
          <CatalogueRow name="AdditionalInvoiceSheet (Raise additional invoice)" source="shared/booking/AdditionalInvoiceForm.tsx" usedIn={ALL} what="The free-form additional invoice (catch-up Phase 38b; US-08.6.3): Raise additional invoice on the anaesthetist's own invoiced Procedure (reached through search) opens it. The date of the charge, Same as the original invoice (ticked by default, unticks to the PartyPicker with Another person), the lines with their totals and the live subtotal, GST and total; Save for review." shared="shared/booking/AdditionalInvoiceForm.tsx" note="Over the seeded event EV0001 (Dr Souter, David Chen's HP03); writes go to the demo store.">
            <AdditionalInvoiceSheetExample as="anaesthetist" />
          </CatalogueRow>
          <CatalogueRow name="AddPrePostOpEventSheet and AddBillingEventSheet" source="shared/booking/EventSheets.tsx" usedIn={ALL} what="The two event sheets as dialogs (catch-up Phase 39b; US-03.7.1, US-03.7.2, US-05.5.2): Pre-op or Post-op, the type as rows (the ACC presets; the OQ-12 caption and the same-party reading are the office's since catch-up Phase 43a), the date and start time, a 5-minute minutes stepper or a fixed fee; or Charge or Credit with What is this for? and the amount. The invoice tick and the same-party tick; no calculation shown." shared="shared/booking/EventSheets.tsx" note="Dr Souter on David Chen's HP03; writes go to the demo store.">
            <EventSheetsExample as="anaesthetist" />
          </CatalogueRow>
          <CatalogueRow name="CreditFormSheet (Credit note, the anaesthetist's)" source="shared/booking/CreditSheetSlot.tsx, shared/booking/CreditForm.tsx" usedIn={ALL} what="The anaesthetist's credit note (catch-up Phase 39; US-08.6.5): Credit note on their own invoiced Procedure (reached through search) opens the one credit form in the surface's overlay, a bottom sheet on the phone and a dialog on the web. The original's number, who it billed and its total ex GST; the Same as the original invoice tick; the reason (Less work than expected, Wrong billable party, Paid twice, plus free text); Your payment for this invoice is reversed. and A credit note is not a refund.; optional Add an invoice with typed lines (no copy, no equal-total rule); Save for review, which the office reviews and the next billing run issues. No ledger figures, offsets or amounts to net, no split." shared="shared/booking/CreditSheetSlot.tsx" note="On the seeded AA-2026-H03 as Dr Souter; Save writes to the demo store.">
            <AnaesthetistCreditSheetExample />
          </CatalogueRow>
        </FamilySection>

        <FamilySection id="feedback">
          <CatalogueRow name="MovedToYouPanel" source="shared/flows/MovedToYouPanel.tsx" usedIn={WM} what="Tells an anaesthetist which Lists or Bookings colleagues have moved to them recently, each opening its List or Booking." shared="shared/ui/NoticeLine.tsx" note="An informational callout built by hand.">
            <D.MovedToYouDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="ResultLine" source="shared/ui/ResultLine.tsx" usedIn={ALL} what="The success-green line confirming an action in place (UI unification U3, question 14), its role=status region always mounted so the words are announced; actions and a labelled dismiss." shared="shared/ui/ResultLine.tsx" note="Errors stay inline. The web also has no feedback at all after submitting a List.">
            <D.ResultLineDemo />
          </CatalogueRow>
          <CatalogueRow name="AlertOfficeEntry" source="shared/flows/AlertOfficeSheet.tsx" usedIn={WM} what="Alert the office about this List: opens a short message sheet (OverlayHeader and SheetActions), then a DoneStep for the sent step, then shows the open alert's status." shared="shared/ui/NoticeLine.tsx" note="Sending an alert writes to the demo data.">
            <D.AlertOfficeDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="TickBadge" source="shared/ui/TickBadge.tsx" usedIn={ALL} what="The small green completion tick, still on settled rows or drawn with a pulse at the moment of completion." shared="shared/ui/TickBadge.tsx">
            <D.TickBadgeDemo />
          </CatalogueRow>
        </FamilySection>

        <FamilySection id="tables">
          <CatalogueRow name="Lists table (Th · Td · GroupRow)" source="shared/table/" usedIn={W} what="Her Lists from today, after an Earlier, not yet authorised group row, on the shared table kit (UI unification U6): TableShell, Th, Td, GroupRow (th scope colgroup), ClickableRow with today and quiet rows, and a RowOpenButton on the date as each row's keyboard handle. Search and Go to date switch to the other tables." shared="shared/table/cells.tsx" note="The real ListsScreen in a scrolling stage. The header is the Admin Review mockup's on the bg band; rows gain the sunken hover. No sorting yet." height={560}>
            <D.ListsTableDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="WebResultsTable" source="shared/table/" usedIn={W} what="Search results grouped Upcoming then Past: date, session, patient, NHI, hospital, procedure and progress." shared="shared/table/TableShell.tsx" note="Type in the search box to drive it. On the shared table kit (U6): its own TableShell, a RowOpenButton per row." height={460}>
            <D.ResultsTableDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="WebDayTable" source="shared/table/" usedIn={W} what="One day's Lists for Go to date: session, start time, location, Booking count, status and progress." shared="shared/table/TableShell.tsx" note="Pick a day with the date input above it. On the shared table kit (U6): its own TableShell, a RowOpenButton per List." height={360}>
            <D.DayTableDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="Accounts tables (tfoot totals)" source="apps/web/screens/AccountsScreen.tsx" usedIn={W} what="Outstanding, Payments, the GST report and AA fees, each on the table kit (catch-up Phase 38); Outstanding, the GST report and AA fees close with totals in a tfoot. Outstanding rows open their Booking; the GST report has a month picker and Download, Print and Email to me." shared="shared/table/TableShell.tsx" note="The real AccountsScreen. Its sub-tabs are the shared LineTabLink (catch-up Phase 38 migrated SubTabButton), real links to /web/accounts/*, so a tab here leaves the catalogue. Totals rows have no row headers." height={560}>
            <D.AccountsDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="RemittancesTab / StillToNetPanel" source="apps/web/screens/RemittancesTab.tsx" usedIn={W} what="Accounts · Remittances (catch-up Phase 39a; US-10.2.5): the anaesthetist's remittance advices, newest first (week, paid on, BCTIs, netted, paid to you, status), a row opening the same advice the office sees in a sheet; above it, only while a negative invoice is open, what is still to net." shared="shared/table/TableShell.tsx" note="On the shared Card (flush), TableShell (bare), ClickableRow, Pill, Notice and the surface Overlay; the advice is the shared RemittanceAdviceDocument. Reads the ledger only, never Xero (money-view purity). Dr Souter's backdrop weekly runs here." height={480}>
            <RemittancesTabExample />
          </CatalogueRow>
          <CatalogueRow name="List detail Bookings table" source="shared/table/" usedIn={W} what="A List's Bookings with time, patient and NHI, procedure, units, fee and status, then a totals row; plus the page's actions and panels." shared="shared/table/TableShell.tsx" note="The real ListDetailView in a scrolling stage, on the shared table kit (U6) inside a flush panel Card (TableShell bare). The patient's name is each row's RowOpenButton; the row click stays for the mouse. Move, alert and add a booking open real flows that change the demo data." height={700}>
            <D.ListDetailDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="ListInvoices" source="shared/schedule/ListInvoices.tsx" usedIn={WM} what="An authorised List's invoices, read only: number, who it went to, when, total and paid state." shared="shared/schedule/ListInvoices.tsx" note="A styled list today; a small static table.">
            <D.ListInvoicesDemo f={f} />
          </CatalogueRow>
        </FamilySection>

        <FamilySection id="cards">
          <CatalogueRow name="Card (panel)" source="shared/ui/Card.tsx" usedIn={W} what="The white card every web screen is built from, the shared Card at padding panel (UI unification U6): 20px, gap 14, e1, a 17/600 heading; optional right-aligned action, padded or flush for a full-bleed table. The web Panel is gone." shared="shared/ui/Card.tsx" note="Its title is a real h2 naming the section (it was a div), so screen-reader users can jump between panels. The same Card at padding card is the Admin rail and profile card and the phone card.">
            <D.PanelDemo />
          </CatalogueRow>
          <CatalogueRow name="StatTile" source="shared/ui/StatTile.tsx" usedIn={W} what="A dashboard figure, the shared StatTile variant quiet (UI unification U6): an Eyebrow label, a large mono value and an optional green change pill. The dashboard's Financial position and Accounts' Your position (catch-up Phase 38). tone warning or error colours the figure (error: the patient record's strong balance, catch-up Phase 40)." shared="shared/ui/StatTile.tsx" note="The same component's outlined variant is Admin Review's summary tile, and with onClick a button (the Billing monitor's With problems tile turns its filter on). Static figures; no animation to add.">
            <D.StatTileDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="SeriesList" source="shared/availability/SeriesList.tsx" usedIn={WM} what="Her repeating days off, each with Delete and an inline are-you-sure step." shared="shared/availability/SeriesList.tsx" note="Deleting a series changes the demo data.">
            <D.SeriesListDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="BookingTotalPanel · useTickingValue" source="shared/capture/BookingTotalPanel.tsx" usedIn={WA} what="The ink Booking total: breakdown lines, units and fee, rate and override note. Units and fee tick to new values with a green flash. On a multi-procedure Booking its rows say each Procedure's place in the rule (Primary · B + T + M 3 of 7) and plain captions follow (Modifiers 7, split 3 · 2 · 2), all under booking-total-split (catch-up Phase 23)." shared="shared/capture/BookingTotalPanel.tsx" note="Fed local figures here.">
            <D.BookingTotalDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="BookingTotalStrip" source="shared/capture/BookingTotalStrip.tsx" usedIn="Mobile" what="The phone's ink dock above Mark complete (catch-up Phase 24, restored from the July widget, fee only): units and the price, ticking with the green flash, procedure chips on a multi-procedure Booking." shared="shared/capture/BookingTotalStrip.tsx" note="Fed local figures here. No Off, Units or Fee setting: the price always shows, quietly.">
            <D.BookingTotalStripDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="ProcedureStack" source="shared/booking/ProcedureStack.tsx" usedIn={ALL} what="One Procedure's procedure text, invoice description, Contract and RVG code on every Booking screen, Admin Review and the List drawer, in full or compact density; still-to-choose parts are neutral and dashed. On a multi-procedure Booking its heading takes a badge, the neutral Primary pill (catch-up Phase 23)." shared="shared/booking/ProcedureStack.tsx" note="Fixed example views; nothing writes to the demo data.">
            <ProcedureStackExample />
          </CatalogueRow>
          <CatalogueRow name="FunderDetailsView" source="shared/booking/FunderDetailsView.tsx" usedIn={ALL} what="The Booking's insurer or funder and its approval number (catch-up Phase 21): None; an insurer with its number; an insurer with no number (the warning-tint chip); a funder with none. FunderSheet edits it with radio chips." shared="shared/booking/FunderDetailsView.tsx" note="Fixed example details; nothing writes to the demo data. The approval number row is a shared DefRow (UI unification U6), its label kept at 96 because it wraps at 80.">
            <FunderDetailsExample />
          </CatalogueRow>
          <CatalogueRow name="PaidByRow" source="shared/booking/PaidByRow.tsx" usedIn={ALL} what="Paid by in the Billing card (catch-up Phases 22 and 22a; US-08.2.3, US-11.2.2): the Procedure's payer with Patient or the relationship and the warning-tint Email or postal address needed and Under 18 pills where its Contract bills the payer; the holder where the Contract bills its holder; a split's parties, in the warning tint when it no longer fits; Payer: not billed yet with no Contract. On web and Admin a line at the card's foot, on the phone the Billing summary's last row: Change beside the payer's name opens PaidBySheet with who pays and the offer; Split on the right opens it with the split alone." shared="shared/booking/PaidByRow.tsx" note="Read-only examples over fixed views; the sheet opens on a real Booking. The Paid by line is a shared DefRow since UI unification U6 (its Change and Split inside the value).">
            <PaidByRowExample variant="line" />
          </CatalogueRow>
          <CatalogueRow name="PrepaidSettlementBlock (the anaesthetist's)" source="shared/booking/PrepaidSettlementBlock.tsx" usedIn={ALL} what="A prepaid Procedure once its List is authorised (catch-up Phase 41; US-06.4.1): the prepaid price, the recorded BTM for reference only, the transfer from the AA Holding account, Nothing is invoiced or credited automatically, and the whole-invoice Credit note and an additional invoice raised by hand." shared="shared/booking/PrepaidSettlementBlock.tsx" note="Authorise writes to the demo store; then shown on Nair's rhinoplasty as Dr Souter.">
            <PrepaidSettlementExample as="anaesthetist" />
          </CatalogueRow>
        </FamilySection>

        <FamilySection id="custom">
          <CatalogueRow name="WeekStrip" source="apps/web/components/WeekStrip.tsx" usedIn={W} what="The dashboard week: seven columns of her AM and PM sessions in status colours, Lists clickable, today outlined, week stepping." shared="Stays custom" note="Each block takes its fill from blockFill (UI unification U6, U23), so a hatched Unavailable session draws hatched (bug 7). Today is marked by colour only (no aria-current); truncated labels have no tooltip." height={300}>
            <D.WeekStripDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="ProcedureEventsList (the anaesthetist)" source="shared/booking/ProcedureEventsList.tsx" usedIn={ALL} what="A Procedure's events (catch-up Phase 38b; US-03.7.3) as the anaesthetist sees them on their own Procedure: the kind, the date, the first line's description, Raised by you, the total ex GST and the party, the status pill, a declined reason, and Edit and Remove on what they raised while it awaits review or was declined. No review action, invoice link or Booking total. Since catch-up Phase 39b the section shows on their own Procedure with Add pre-op or post-op event and Add billing event at its foot, and lists those kinds (type or description, what was recorded, a total once one exists)." shared="shared/booking/ProcedureEventsList.tsx" note="Over the seeded event EV0001 (Dr Souter, David Chen's HP03); writes go to the demo store.">
            <ProcedureEventsListExample as="anaesthetist" />
          </CatalogueRow>
          <CatalogueRow name="Cell (AvailabilityGrid)" source="apps/web/screens/AvailabilityGrid.tsx" usedIn={W} what="One colleague session on Find cover: status bar, two lines and a Move or Move here action when her List can go there." shared="Stays custom" note="Recreated: local to AvailabilityGrid.tsx; its fill from blockFill (U6). Non-actionable cells are disabled buttons, unreachable by keyboard.">
            <D.AvailabilityCellDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="AvailabilityGrid" source="apps/web/screens/AvailabilityGrid.tsx" usedIn={W} what="Find cover: every anaesthetist's AM and PM for a day, filters, name search and legend, with Move and Move here gestures." shared="Stays custom" note="The real screen; its navigation is intercepted. Move opens the real move sheet, which changes the demo data if confirmed." height={640}>
            <D.AvailabilityGridDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="HistoryTimeline" source="shared/booking/HistoryTimeline.tsx" usedIn={ALL} what="A record's audit trail in plain English, newest first, under day headings, with coalesced runs that expand. Since catch-up Phase 35 a change set (a save, a create, a move, a List's change of anaesthetist, an applied hospital row) is one row: who and how many changes, each field's before and after beneath, and View as at on the Admin Booking. Shown for the seeded Booking with the longest history." shared="shared/booking/HistoryTimeline.tsx" note="Its day and change labels are the shared Eyebrow (UI unification U6)." height={460}>
            <D.HistoryTimelineDemo f={f} />
          </CatalogueRow>
        </FamilySection>
      </MoveListPromptProvider>
      </SurfaceProvider>
    </CataloguePage>
  )
}
