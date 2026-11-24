import { CataloguePage, CatalogueRow, FamilySection, StageHint } from './CatalogueKit'
import { StubSheetExample } from './stubExamples'
import { useMobilePersona, useSeedPicks } from './mobile/persona'
import * as Ex from './mobile/examples'
import { ProcedureStackExample } from './procedureStackExample'
import { FunderDetailsExample, PayerFieldsExample } from './payerExamples'
import { PaidByRowExample, PaidBySheetExample, PartyPickerExample } from './splitExamples'
import { AdditionalInvoiceButtonExample, AdditionalInvoiceSheetExample, AnaesthetistCreditSheetExample, CreditNoteButtonExample, EventSheetsExample, ProcedureEventsListExample } from './eventExamples'
import { LockBadge } from '../../../shared/booking/LockBadge'
import { SEED_MARKERS } from '../../../domain/seed'
import { ContractApprovalExample } from './contractApprovalExample'
import { BalanceAlertChipExample, SharedNotesExample } from './patientAlertExamples'
import { PrepaidSettlementExample } from './prepaymentFollowupExamples'
import { SupportSheetExample } from './supportExamples'

const M = 'Mobile'
const SW = 'Admin · Web · Mobile'
const WM = 'Web · Mobile'
const WRITES = 'writes to the demo store (the seeded record really changes); Demo reset puts it back.'
const STORE_NOTE = `Each tap ${WRITES}`

/** /demo/catalogue/mobile: every hand-built component in the Anaesthetist Mobile App, live, one per row. */
export function MobileCatalogue() {
  const { actor, anaesthetistId } = useMobilePersona()
  const picks = useSeedPicks(anaesthetistId)

  return (
    <CataloguePage
      title="Anaesthetist Mobile App · UI components"
      intro="Every hand-built component in the Mobile app, live inside a 390px phone stage, grouped by component family, each naming the shared component it is or is built on. Sheets open inside the stage, as they do in the phone. Swipe gestures (the stack's edge-swipe back) need touch: use DevTools device mode."
    >
      <FamilySection id="actions">
        <CatalogueRow name="InlineConfirm" source="shared/ui/InlineConfirm.tsx" usedIn={SW} stage="mobile" height={320}
          what="The one in-card confirm: a tinted box with a message and two pill actions, 'Keep it' first and the primary on the right. Focus moves to 'Keep it' on open and back to the control that opened it."
          shared="shared/ui/InlineConfirm.tsx"
          note="Used where a sheet would be too heavy, such as deleting a series from its card.">
          <Ex.InlineConfirmExample />
        </CatalogueRow>
        <CatalogueRow name="Button (MobileButton)" source="shared/ui/Button.tsx" usedIn={SW} stage="mobile" height={320}
          what="The shared button set: primary (54px teal), secondary (outlined) and pill (tinted, compact), the phone's touch size. Mobile imports it as MobileButton. Since UI unification U5 the same Button has outline, danger, the desktop and compact sizes and a printed disabled reason (see the Admin catalogue's Button row)."
          shared="shared/ui/Button.tsx"
          note="Adds focus-visible, hover, loading and aria-disabled states.">
          <Ex.ButtonExample />
        </CatalogueRow>
        <CatalogueRow name="Mobile press feedback (:active)" source="theme/global.css" usedIn={M} stage="mobile" height={280}
          what="A CSS rule that makes every enabled button inside the phone UI sink 1px and scale slightly while held. The PWA host adds a touch listener so iOS fires :active."
          shared="theme/global.css"
          note="Moves from one global selector into the Button variants, so non-button tap targets opt in explicitly.">
          <Ex.PressFeedbackExample />
        </CatalogueRow>
        <CatalogueRow name="StepperButton" source="shared/capture/ui.tsx" usedIn={SW} stage="mobile" height={200}
          what="The mockup's 44px round-square minus and plus button, on the shared IconButton since UI unification U5 (44px square, radius 12). Since U4 it is the button part of NumberStepper, which names and bounds it; on its own it still takes a glyph, a label and disabled."
          shared="shared/capture/ui.tsx"
          note="Takes a label (catch-up Phase 21a); NumberStepper names the pair Fewer and More. UnitsCard's steppers moved onto NumberStepper in catch-up Phase 23.">
          <Ex.StepperButtonExample />
        </CatalogueRow>
        <CatalogueRow name="NudgeButton" source="shared/capture/ui.tsx" usedIn={SW} stage="mobile" height={200}
          what="The small minus 5 and plus 5 buttons that nudge a stamped start or finish time; ariaLabel names them, such as Start 5 minutes earlier."
          shared="shared/capture/ui.tsx">
          <Ex.NudgeButtonExample />
        </CatalogueRow>
        <CatalogueRow name="CompleteBar" source="shared/capture/CompleteBar.tsx" usedIn={SW} stage="mobile" height={180}
          what="The Booking's Mark complete button, which becomes a green success bar with Amend while the List is still open."
          shared="shared/capture/CompleteBar.tsx"
          note="Local state only here: no Booking is completed.">
          <Ex.CompleteBarExample />
        </CatalogueRow>
        <CatalogueRow name="AdditionalInvoiceButton" source="shared/booking/AdditionalInvoiceButton.tsx" usedIn={SW} stage="mobile" height={560} what="The button on the Procedure's Paid by row, beside Split (catch-up Phase 38b; US-08.6.3 Button): Create additional invoice for the office on any invoiced Procedure, Raise additional invoice for the anaesthetist on their own; absent on a colleague's or before the List is authorised; disabled with the refusal sentence otherwise." shared="shared/booking/AdditionalInvoiceButton.tsx" note="Over the seeded event EV0001 (Dr Souter, David Chen's HP03); writes go to the demo store.">
          <AdditionalInvoiceButtonExample />
        </CatalogueRow>
        <CatalogueRow name="CreditNoteButton (the anaesthetist's)" source="shared/booking/CreditNoteButton.tsx" usedIn={SW} stage="mobile" height={560} what="Credit note beside Raise additional invoice on the anaesthetist's own invoiced Procedure (catch-up Phase 39; US-08.6.5, creditOptionFor): crediting the Procedure's live invoice in full through the app's credit sheet (a prepayment invoice whole, from the PrepaidSettlementBlock once the List is authorised, catch-up Phase 41); hidden on a colleague's, disabled with its sentence while a credit waits or once credited." shared="shared/booking/CreditNoteButton.tsx" note="As Dr Souter on David Chen's HP03.">
          <CreditNoteButtonExample as="anaesthetist" />
        </CatalogueRow>
      </FamilySection>

      <FamilySection id="pills">
        <CatalogueRow name="StatusChip" source="shared/StatusChip.tsx" usedIn={SW} stage="mobile" height={220}
          what="A status pill: coloured dot and label on the status tint, read from the status master so a rename shows at once."
          shared="shared/StatusChip.tsx"
          note="Status colours become --status-* tokens with tint and on-tint values.">
          <Ex.StatusChipExample />
        </CatalogueRow>
        <CatalogueRow name="ProgressPill" source="shared/schedule/ProgressPill.tsx" usedIn={SW} stage="mobile" height={200}
          what="A List's progress as a compact pill: to finish, ready to submit, done, authorised, invoiced."
          shared="shared/schedule/ProgressPill.tsx">
          <Ex.ProgressPillExample />
        </CatalogueRow>
        <CatalogueRow name="DayChip" source="shared/ui/DayChip.tsx" usedIn={M} stage="mobile" height={160}
          what="The teal chip naming the picked day; tapping it closes the day view and goes back to the Lists."
          shared="shared/ui/DayChip.tsx"
          note="The shared DayChip at the touch size (UI unification U6, U35); the web day chip is the same component at the desktop size. Keeps mobile-lists-day-chip.">
          <Ex.DayChipExample />
        </CatalogueRow>
        <CatalogueRow name="Avatar" source="shared/Avatar.tsx" usedIn={SW} stage="mobile" height={160}
          what="The one avatar (UI unification U3): elevated white on mobile (the persona), the crimson tint of web and Admin (colleagues, the web nav), and neutral in the move sheets (muted when a colleague cannot be picked). The mockup font steps: 30 gives 11, 34 gives 12, 36 gives 13, 44 gives 15. PersonaChip draws it on the dark bars."
          shared="shared/Avatar.tsx">
          <Ex.AvatarExample />
        </CatalogueRow>
        <CatalogueRow name="Progress bar" source="shared/ui/ProgressBar.tsx" usedIn={WM} stage="mobile" height={180}
          what="The List's n of m complete line with a green bar that eases to the new width: the shared ProgressBar filling its row (UI unification U5), a progressbar with its values."
          shared="shared/ui/ProgressBar.tsx"
          note="One component with the web List header's 200px bar since U5. tone held (catch-up Phase 33a): a stub stands on the List, so the fill is amber and never the done green.">
          <Ex.ProgressBarExample />
        </CatalogueRow>
        <CatalogueRow name="LockBadge" source="shared/booking/LockBadge.tsx" usedIn={SW} stage="mobile" what="Contract locked at authorise (catch-up Phase 25; US-04.3.5): the shared neutral Pill with the lock glyph under the phone's Billing summary once the List is AUTHORISED; who locked it and when on its title." shared="shared/booking/LockBadge.tsx" note="Shown on the seeded AUTHORISED Face lift.">
          <LockBadge bookingId={SEED_MARKERS['rangeAuthorisedBooking']?.entityId ?? ''} />
        </CatalogueRow>
        <CatalogueRow name="WarningTriangle" source="shared/warnings/WarningTriangle.tsx" usedIn={SW} stage="mobile" height={240}
          what="The small marker on a Booking with a warning: a disc in the strongest open warning's colour, with the count when more than one."
          shared="shared/warnings/WarningTriangle.tsx"
          note="The text lives in title only; a Tooltip makes it reachable by keyboard.">
          <Ex.WarningTriangleExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="BalanceAlertChip" source="shared/patients/BalanceAlertChip.tsx" usedIn={WM} stage="mobile" height={340}
          what="The anaesthetist's balance colour code (catch-up Phase 40) on the Booking row of her List and in the Booking detail: red for a strong balance warning, yellow for a mild one or a credit. No amount, no name, no Clear, no patient link; it ignores the office's Clear."
          shared="shared/patients/BalanceAlertChip.tsx"
          note="On the shared Pill (sm on the row with the full sentence in title, lg wrapping in the detail). The office's balance warning row and triangle never show to the anaesthetist.">
          <BalanceAlertChipExample />
        </CatalogueRow>
        <CatalogueRow name="OutOfHoursMoon" source="shared/schedule/OutOfHoursMark.tsx" usedIn={SW} stage="mobile" height={140}
          what="The moon that stands in the session column where an AM or PM List shows its session."
          shared="shared/schedule/OutOfHoursMark.tsx">
          <Ex.OutOfHoursMoonExample />
        </CatalogueRow>
      </FamilySection>

      <FamilySection id="fields">
        <CatalogueRow name="AvailabilityEditor" source="shared/availability/AvailabilityEditor.tsx" usedIn={WM} stage="mobile" height={600}
          what="A day's sessions, then the form to change them or add days off. Mobile hosts it in a bottom sheet; web in the right rail."
          shared="shared/availability/AvailabilityEditor.tsx"
          note={`Saving or removing ${WRITES}`}>
          <Ex.AvailabilityEditorExample />
        </CatalogueRow>
        <CatalogueRow name="NumberStepper" source="shared/capture/ui.tsx" usedIn={SW} stage="mobile" height={260}
          what="The one whole-number stepper (UI unification U4): minus and plus StepperButtons around the value, named Fewer and More, disabled at min and max, the value announced politely. typeable turns the value into a button that types a number in place: Enter saves, Escape cancels, a blur saves."
          shared="shared/capture/ui.tsx"
          note="The RVG range row's base units and the modifier picker's units use it. Local state here.">
          <Ex.NumberStepperExample />
        </CatalogueRow>
        <CatalogueRow name="LookbackSearchRow" source="apps/mobile/screens/ListsLookback.tsx" usedIn={M} stage="mobile" height={200}
          what="The Lists search row: the shared NameSearchBox (patient name or NHI; 48px, white on the phone canvas, the 44px touch clear, the mobile-lists-search test id) and the Go to a date button beside it."
          shared="shared/ui/NameSearchBox.tsx"
          note="Since UI unification U4 its private input is gone; the row only lays out NameSearchBox and the calendar button.">
          <Ex.LookbackSearchRowExample />
        </CatalogueRow>
        <CatalogueRow name="TextField" source="shared/ui/Field.tsx" usedIn={SW} stage="mobile" height={200}
          what="The one labelled input, with a hint tied by aria-describedby. Since UI unification U4: invalid (aria-invalid and the error border), inputMode and align for amounts, time and number types (and password, for the simulated sign-in, catch-up Phase 43a), bounds, size, fill (surface white on the phone canvas, well grey inside a white card or sheet) and the one teal focus ring."
          shared="shared/ui/Field.tsx">
          <Ex.TextFieldExample />
        </CatalogueRow>
        <CatalogueRow name="TextArea" source="shared/ui/Field.tsx" usedIn={SW} stage="mobile" height={200}
          what="The one multi-line field, for notes and messages in sheets: a label or ariaLabel, a hint, and since UI unification U4 a counter (maxLength), compact density, fill and resize."
          shared="shared/ui/Field.tsx">
          <Ex.TextAreaExample />
        </CatalogueRow>
        <CatalogueRow name="PayerFields (DifferentPayerTick, OtherPayerFields, PostalAddressFields)" source="shared/flows/PayerFields.tsx, PostalAddressFields.tsx" usedIn={SW} stage="mobile" height={640} what="The payer form's parts, in PaidBySheet's Who pays and the add forms (U4 migrates them): the Different payer tick, then the other payer's name, relationship chips, email, NZ Post postal address and phone." shared="shared/flows/PayerFields.tsx" note="Local state only; nothing writes to the demo data.">
          <PayerFieldsExample />
        </CatalogueRow>
        <CatalogueRow name="PartyPicker" source="shared/booking/PartyPicker.tsx" usedIn={SW} stage="mobile" height={520} what="Choose who an invoice goes to (catch-up Phases 22 and 22a): the Procedure's payer and the Contract's party first, then every Party, searchable by name, and with onAnotherPerson a last row, Another person, for someone who is no Party. The split's party field in PaidBySheet; Phases 38b, 39 and 39b reuse it." shared="shared/booking/PartyPicker.tsx" note="Fixed options on local state; nothing writes to the demo data.">
          <PartyPickerExample />
        </CatalogueRow>
        <CatalogueRow name="SharedNotes" source="shared/notes/SharedNotes.tsx" usedIn={SW} stage="mobile" height={420}
          what="The shared note on a List or Booking (catch-up Phase 40; US-11.3.3): Add note and the notes, newest first, with author and time. The office and the anaesthetist both read and add; a blank note is refused."
          shared="shared/notes/SharedNotes.tsx"
          note="One component in all three apps, on TextArea, Button and FormError; writes the real store, never a Booking draft. Here on local notes (SharedNotesPanel), so nothing is written.">
          <SharedNotesExample size="touch" by="Dr Melanie Souter" />
        </CatalogueRow>
      </FamilySection>

      <FamilySection id="dates">
        <CatalogueRow name="MonthGrid (LookbackDateSheet)" source="shared/calendar/MonthGrid.tsx" usedIn={M} stage="mobile" height={600}
          what="The Go to a date month in a bottom sheet: a dot marks a day with one of her Lists, with a month and year jump panel. Since UI unification U4 it is built from the shared calendar parts: useCalendarKeys (bounded, so a key stops at the first or last day), MonthHeaderRow and the 44px MonthStepButton."
          shared="shared/calendar/MonthGrid.tsx"
          note="Keeps the custom day content (dots). Adds grid roles; pass the demo clock's today and the bounds.">
          <Ex.MonthGridExample />
        </CatalogueRow>
        <CatalogueRow name="My calendar month grid" source="apps/mobile/screens/MyAvailabilityCalendarScreen.tsx" usedIn={M} stage="mobile" height={520}
          what="Her own month: each day is an AM over PM pair of half-blocks in the session's status, with previous and next month buttons. Since UI unification U4 the month buttons are the shared MonthStepButton (on IconButton since U5) and the weekday row the shared MonthHeaderRow."
          shared="shared/calendar/MonthHeaderRow.tsx"
          note="Recreated: local to MyAvailabilityCalendarScreen.tsx (reads her real sessions), on the same shared parts.">
          <Ex.MyCalendarGridExample />
        </CatalogueRow>
        <CatalogueRow name="6-day date strip" source="apps/mobile/screens/AvailabilityScreen.tsx" usedIn={M} stage="mobile" height={200}
          what="Today and the next five days as buttons at the top of Find cover. A dot marks a day with a free session."
          shared="Stays custom"
          note="Recreated: local to AvailabilityScreen.tsx. The free dot is colour only and today has no aria-current. The research map files it as Custom + ToggleGroup.">
          <Ex.DateStripExample />
        </CatalogueRow>
        <CatalogueRow name="TimesCard" source="shared/capture/TimesCard.tsx" usedIn={SW} stage="mobile" height={340}
          what="Start and Finish as one travelling teal action: Start now stamps the demo clock and slides across to become Finish now, revealing the stamp and its nudges."
          shared="shared/capture/TimesCard.tsx"
          note={STORE_NOTE}>
          <Ex.TimesCardExample picks={picks} />
        </CatalogueRow>
      </FamilySection>

      <FamilySection id="tabs">
        <CatalogueRow name="SlidingSegmentedControl" source="shared/ui/SlidingSegmentedControl.tsx" usedIn={SW} stage="mobile" height={260}
          what="A segmented control whose highlight slides to the chosen cell, measured in layout pixels so it survives the phone frame's scale. Teal and surface variants, md and sm sizes; Balances took the standard teal control and the ink variant went (UI unification U5, question 17)."
          shared="shared/ui/SlidingSegmentedControl.tsx"
          note="Segments are buttons with aria-pressed in a role=group.">
          <Ex.SlidingSegmentedExample />
        </CatalogueRow>
        <CatalogueRow name="Segmented" source="shared/ui/Field.tsx" usedIn={SW} stage="mobile" height={220}
          what="SlidingSegmentedControl with a field label above it, plus a read-only mode that keeps the selection visible."
          shared="shared/ui/Field.tsx"
          note="The label is a div today, so it is not tied to the control.">
          <Ex.SegmentedExample />
        </CatalogueRow>
        <CatalogueRow name="Filter chips (Week / Month / To-Do / Done)" source="shared/ui/FilterPills.tsx" usedIn={M} stage="mobile" height={200}
          what="The pill toggles above the Lists home that bound the forward window or filter to work to do or done: the shared FilterPills at 38px (UI unification U5), a labelled group with aria-pressed."
          shared="shared/ui/FilterPills.tsx"
          note="One component with Find cover's 36px pills since U5.">
          <Ex.FilterChipsExample />
        </CatalogueRow>
        <CatalogueRow name="BottomTabBar" source="apps/mobile/MobileApp.tsx" usedIn={M} stage="mobile" height={220}
          what="The four-tab bar at the foot of the phone: Lists, Availability, Balances, More, frosted, hidden once you drill in."
          shared="Stays custom"
          note="Recreated: local to MobileApp.tsx. Since UI unification U5 a labelled navigation whose active tab carries aria-current; the tabs stay buttons (question 3).">
          <Ex.BottomTabBarExample />
        </CatalogueRow>
      </FamilySection>

      <FamilySection id="overlays">
        <CatalogueRow name="BottomSheet" source="shared/surface/BottomSheet.tsx" usedIn={SW} stage="mobile" height={420}
          what="The mobile modal: a scrim and a panel that slides up from the bottom. It is what useSurface().Overlay renders on the phone, so every shared sheet uses it. It sits on the one modal stack with Dialog (useModalLayer): Escape closes only the top layer, focus goes in, stays in and comes back, and the OverlayHeader title names it."
          shared="shared/surface/BottomSheet.tsx"
          note="It honours --aa-keyboard-inset and stays inside the phone frame.">
          <Ex.BottomSheetExample />
          <StageHint>Tap the scrim or the handle to dismiss.</StageHint>
        </CatalogueRow>
        <CatalogueRow name="ListOptionsSheet" source="apps/mobile/components/ListOptionsSheet.tsx" usedIn={M} stage="mobile" height={520}
          what="The action sheet behind the List's ⋯ button, titled by an OverlayHeader: a row per thing she can do with her own List, each with a one-line hint."
          shared="shared/surface/BottomSheet.tsx"
          note="Declares role=menu with no arrow keys. Either drop the menu roles or use a real Menu.">
          <Ex.ListOptionsSheetExample />
        </CatalogueRow>
        <CatalogueRow name="EditRateSheet" source="apps/mobile/components/EditRateSheet.tsx" usedIn={M} stage="mobile" height={460}
          what="The anaesthetist sets their own rate per unit from the More tab's Profile card (catch-up Phase 26): an OverlayHeader, a mono dollar field on the decimal keypad, the rate note and Save rate in SheetActions; a refusal shows in FormError."
          shared="shared/surface/BottomSheet.tsx"
          note={`Save ${WRITES}`}>
          <Ex.EditRateSheetExample actor={actor} anaesthetistId={anaesthetistId} />
        </CatalogueRow>
        <CatalogueRow name="SupportSheet" source="shared/support/SupportHosts.tsx" usedIn={M} stage="mobile" height={640}
          what="Help from the More tab (catch-up Phase 43b; US-15.0.8): the support panel in a BottomSheet under the OverlayHeader, the help line only and the anaesthetist's own requests; Send request at the foot of the form."
          shared="shared/support/SupportHosts.tsx"
          note={`Send ${WRITES}`}>
          <SupportSheetExample actor={actor} />
        </CatalogueRow>
        <CatalogueRow name="SubmitListSheet" source="shared/flows/SubmitListSheet.tsx" usedIn={WM} stage="mobile" height={560}
          what="Opened from the greyed submit dock: names each Booking still to finish and what blocks it. Its confirm mode is a ConfirmSheet that submits the List."
          shared="shared/flows/SubmitListSheet.tsx"
          note="Shown in blockers mode only, so nothing is submitted from here.">
          <Ex.SubmitListSheetExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="InfoTip (phone)" source="shared/help/InfoTip.tsx" usedIn={SW} stage="mobile" height={260}
          what="Point-of-need help (catch-up Phase 43a; US-15.0.1): a 16px info glyph in a 44px hit area beside a section label, named About and the topic title. On the phone it opens a bottom sheet with the topic's copy from helpTopics.ts and Got it; inside a sheet (InfoTipHeader) it expands an inline note under the title instead of a second sheet."
          shared="shared/help/InfoTip.tsx">
          <Ex.InfoTipExample />
        </CatalogueRow>
        <CatalogueRow name="StubSheet" source="shared/stubs/StubSheet.tsx" usedIn={M} stage="mobile" height={420}
          what="A stub on the phone's List and its bottom sheet (catch-up Phase 33a): what was received, why it waits at intake, who resolves it and the readings caption. Read only; it never opens a Booking."
          shared="shared/stubs/StubSheet.tsx"
          note="A fixed example stub; nothing writes to the demo data.">
          <StubSheetExample />
        </CatalogueRow>
        <CatalogueRow name="PaidBySheet (with SplitFeeSection)" source="shared/flows/PaidBySheet.tsx, shared/flows/SplitFeeSection.tsx" usedIn={SW} stage="mobile" height={720} what="The one Paid by sheet (catch-up Phase 22a; US-11.2.2, US-08.2.3): a bottom sheet on the phone, a dialog on web and Admin. Opened by Change, it holds who pays (the Different payer tick, the patient's details or the other payer's fields, the Under 18 hint and the contact ask) and, when the payer changes, the offer (the Booking's other Procedures with the same payer, each ticked, never forced). Opened by Split, it holds the split alone (a party or Another person, a $ or % share and Takes the rest per row, each amount live). Save writes it or refuses it whole." shared="shared/flows/PaidBySheet.tsx" note="Opens on Grace Park's first seeded Procedure; Save writes to the demo store.">
          <PaidBySheetExample />
        </CatalogueRow>
        <CatalogueRow name="AdditionalInvoiceSheet (Raise additional invoice)" source="shared/booking/AdditionalInvoiceForm.tsx" usedIn={SW} stage="mobile" height={560} what="The free-form additional invoice (catch-up Phase 38b; US-08.6.3): Raise additional invoice on the anaesthetist's own invoiced Procedure (reached through search) opens it. The date of the charge, Same as the original invoice (ticked by default, unticks to the PartyPicker with Another person), the lines with their totals and the live subtotal, GST and total; Save for review." shared="shared/booking/AdditionalInvoiceForm.tsx" note="Over the seeded event EV0001 (Dr Souter, David Chen's HP03); writes go to the demo store.">
          <AdditionalInvoiceSheetExample as="anaesthetist" />
        </CatalogueRow>
        <CatalogueRow name="AddPrePostOpEventSheet and AddBillingEventSheet" source="shared/booking/EventSheets.tsx" usedIn={SW} stage="mobile" height={640} what="The two event sheets as bottom sheets (catch-up Phase 39b; US-03.7.1, US-03.7.2, US-05.5.2): Pre-op or Post-op, the type as tappable rows (the ACC presets; the OQ-12 caption and the same-party reading are the office's since catch-up Phase 43a), the date and start time, a 5-minute minutes stepper or a fixed fee; or Charge or Credit with What is this for? and the amount. The invoice tick and the same-party tick; no calculation shown." shared="shared/booking/EventSheets.tsx" note="Dr Souter on David Chen's HP03; writes go to the demo store.">
          <EventSheetsExample as="anaesthetist" />
        </CatalogueRow>
        <CatalogueRow name="CreditFormSheet (Credit note, the anaesthetist's)" source="shared/booking/CreditSheetSlot.tsx, shared/booking/CreditForm.tsx" usedIn={SW} stage="mobile" height={560} what="The anaesthetist's credit note (catch-up Phase 39; US-08.6.5): Credit note on their own invoiced Procedure (reached through search) opens the one credit form in the surface's overlay, a bottom sheet on the phone and a dialog on the web. The original's number, who it billed and its total ex GST; the Same as the original invoice tick; the reason (Less work than expected, Wrong billable party, Paid twice, plus free text); Your payment for this invoice is reversed. and A credit note is not a refund.; optional Add an invoice with typed lines (no copy, no equal-total rule); Save for review, which the office reviews and the next billing run issues. No ledger figures, offsets or amounts to net, no split." shared="shared/booking/CreditSheetSlot.tsx" note="On the seeded AA-2026-H03 as Dr Souter; Save writes to the demo store.">
          <AnaesthetistCreditSheetExample />
        </CatalogueRow>
      </FamilySection>

      <FamilySection id="feedback">
        <CatalogueRow name="DoneStep" source="shared/ui/DoneStep.tsx" usedIn={SW} stage="mobile" height={380}
          what="The one in-sheet done step: a 72px TickBadge, a success title, an optional detail and the step's one action. Announced with role=status, with focus on the action at mount."
          shared="shared/ui/DoneStep.tsx"
          note="The action is the caller's: Done closes the sheet, or opens the new Booking.">
          <Ex.DoneStepExample />
        </CatalogueRow>
        <CatalogueRow name="AlertOfficeSheet" source="shared/flows/AlertOfficeSheet.tsx" usedIn={WM} stage="mobile" height={560}
          what="Asks the office to check one of her Lists or Bookings, with a note (OverlayHeader and SheetActions). A DoneStep shows the sent state afterwards."
          shared="shared/ui/NoticeLine.tsx"
          note={`Drawer adds the focus trap; Field binds the note's error to the textarea. Send ${WRITES}`}>
          <Ex.AlertOfficeSheetExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="EmptyState" source="shared/ui/EmptyState.tsx" usedIn={SW} stage="mobile" height={260}
          what="The one empty state (UI unification U3, which replaced EmptyCard): the inline mist line, the card (as on Balances) and the phone list screens' centred line."
          shared="shared/ui/EmptyState.tsx">
          <Ex.EmptyStateExample />
        </CatalogueRow>
        <CatalogueRow name="MovedToYouPanel" source="shared/flows/MovedToYouPanel.tsx" usedIn={WM} stage="mobile" height={300}
          what="The notice at the top of Find cover listing Lists or Bookings a colleague moved to her in the last week, with any message."
          shared="shared/ui/NoticeLine.tsx">
          <Ex.MovedToYouPanelExample />
        </CatalogueRow>
        <CatalogueRow name="InstallCoach" source="pwa/InstallCoach.tsx" usedIn="Mobile (installed PWA)" stage="mobile" height={340}
          what="The dismissible Add to your home screen tip, with iPhone steps or an Android Install button."
          shared="Stays custom"
          note="Radius 14 since UI unification U6 (question 20); otherwise presenter chrome, left off the shared parts (question 2).">
          <Ex.InstallCoachExample />
        </CatalogueRow>
        <CatalogueRow name="UpdatePrompt" source="pwa/UpdatePrompt.tsx" usedIn="Mobile (installed PWA)" stage="mobile" height={240}
          what="The floating snackbar that appears when a new build is waiting: tap to reload into it. Polls the service worker."
          shared="Stays custom"
          note="Recreated: it needs virtual:pwa-register, which only the PWA build provides.">
          <Ex.UpdatePromptExample />
        </CatalogueRow>
        <CatalogueRow name="FormError" source="shared/ui/Field.tsx" usedIn={SW} stage="mobile" height={200}
          what="A refused save in plain words, announced as an alert: the error-tint box under a form, or the inline line beside a compact row control (UI unification U3, which moved every hand copy onto it)."
          shared="shared/ui/Field.tsx"
          note="Today it sits under the form, not under the field that caused it.">
          <Ex.FormErrorExample />
        </CatalogueRow>
        <CatalogueRow name="SuccessOverlay" source="shared/ui/SuccessOverlay.tsx" usedIn={SW} stage="mobile" height={360}
          what="The full-surface success moment: blurred flood, the circle pops, the tick draws, a haptic fires. The owner hides it after 1050ms."
          shared="shared/ui/SuccessOverlay.tsx"
          note="AA's one standout moment: keep the choreography. iOS ignores navigator.vibrate.">
          <Ex.SuccessOverlayExample />
        </CatalogueRow>
        <CatalogueRow name="TickBadge" source="shared/ui/TickBadge.tsx" usedIn={SW} stage="mobile" height={200}
          what="The small completion tick on a success-tint circle; animated it draws and pulses, otherwise it sits still."
          shared="shared/ui/TickBadge.tsx">
          <Ex.TickBadgeExample />
        </CatalogueRow>
        <CatalogueRow name="ContractApprovalLine" source="shared/booking/ContractApprovalLine.tsx" usedIn="Web · Mobile" stage="mobile" height={120} what="Under the anaesthetist's Billing card (catch-up Phase 21a): after they change a Procedure's Contract, Awaiting office approval, then Approved by the office with the time once the office approves it on Review or authorises the List." shared="shared/booking/ContractApprovalLine.tsx" note="Reads the seeded Contract change on Dr Chen's review-flags List; writes nothing.">
          <ContractApprovalExample />
        </CatalogueRow>
      </FamilySection>

      <FamilySection id="cards">
        <CatalogueRow name="CaptureSection" source="shared/capture/ui.tsx" usedIn={SW} stage="mobile" height={260}
          what="The capture card: a micro-caps label (the shared Eyebrow), the body, and an optional footer area pinned to the foot; required adds a Required caption that takes the warning tint once Mark complete is refused; help (catch-up Phase 43a) puts an InfoTip at the label row's end."
          shared="shared/capture/ui.tsx"
          note="The label should become a real heading.">
          <Ex.CaptureSectionExample />
        </CatalogueRow>
        <CatalogueRow name="Hero figure card" source="apps/mobile/screens/BalancesScreen.tsx" usedIn={M} stage="mobile" height={200}
          what="The Balances headline: outstanding to you, in large mono figures, with the unpaid invoice count. Static, not animated."
          shared="shared/ui/Card.tsx"
          note="On the shared Card since catch-up Phase 38, as are the Outstanding and GST rows (each Outstanding card opens its Booking). AgeChip is gone with the ageing (D8).">
          <Ex.HeroFigureCardExample />
        </CatalogueRow>
        <CatalogueRow name="Booking card (Capture pill)" source="apps/mobile/screens/ListDetailScreen.tsx" usedIn={M} stage="mobile" height={340}
          what="A Booking on the List: time, patient, NHI and operation, ending in a Capture pill, a completion tick, or Cancelled."
          shared="Stays custom"
          note="Recreated: local to ListDetailScreen.tsx. Tap a card to cycle Capture, done, cancelled (local only). Its accessible name is all the text run together today.">
          <Ex.BookingCardExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="LookbackResults (ResultRow)" source="apps/mobile/screens/ListsLookback.tsx" usedIn={M} stage="mobile" height={420}
          what="Search results grouped Upcoming and Past, each Booking a card with session, patient, NHI and progress."
          shared="Stays custom">
          <Ex.LookbackResultsExample />
        </CatalogueRow>
        <CatalogueRow name="SeriesList" source="shared/availability/SeriesList.tsx" usedIn={WM} stage="mobile" height={260}
          what="Her repeating days off, each with a Remove that asks for confirmation inline."
          shared="shared/availability/SeriesList.tsx"
          note={`Confirming a removal ${WRITES}`}>
          <Ex.SeriesListExample />
        </CatalogueRow>
        <CatalogueRow name="PrepaymentPanel" source="shared/booking/PrepaymentPanel.tsx" usedIn={SW} stage="mobile" height={420}
          what="A Booking's prepayment (catch-up Phase 27): a title by status, then one block per payer with its prepaid Procedures (text, Contract, price), the prepaid amount and the invoice. Read-only for the anaesthetist; the office sees Approve on Invoices. Since catch-up Phase 41: the last reminder's line once one is sent, The AA office sends the prepayment letter. for the anaesthetist, and the settled block (Credited with the credit number, each refund paid) once a cancellation or a Contract change credits the prepayment invoice."
          shared="shared/booking/PrepaymentPanel.tsx"
          note={`On the shared Card, Pill and TextAction; amounts in mono. All three apps through BookingDetailBody. ${STORE_NOTE}`}>
          <Ex.PrepaymentPanelExample />
        </CatalogueRow>
        <CatalogueRow name="PrepaidSettlementBlock (the anaesthetist's)" source="shared/booking/PrepaidSettlementBlock.tsx" usedIn={SW} stage="mobile" height={420}
          what="A prepaid Procedure once its List is authorised (catch-up Phase 41; US-06.4.1): the prepaid amount as the price, the recorded BTM for reference only, the transfer from the AA Holding account to you, Nothing is invoiced or credited automatically, and Credit note (the whole prepayment invoice) and Raise additional invoice on your own Procedure."
          shared="shared/booking/PrepaidSettlementBlock.tsx"
          note={`Authorise writes to the demo store; then shown on Nair's rhinoplasty as Dr Souter. ${STORE_NOTE}`}>
          <PrepaidSettlementExample as="anaesthetist" />
        </CatalogueRow>
        <CatalogueRow name="BookingDetailBody" source="shared/booking/BookingDetailBody.tsx" usedIn={SW} stage="mobile" height={640}
          what="The whole Booking capture: patient, ASA, RVG code, times, units, override, notes and Mark complete, laid out by the mobile surface."
          shared="shared/booking/BookingDetailBody.tsx"
          note={`On a failed complete it focuses the first invalid field. The ASA, units and modifier cards (being reworked in catch-up Phase 19b) are live in here. Its label and value rows are the shared DefRow (a dl, labels at 80; UI unification U6); its sections move in Phase 35. ${STORE_NOTE}`}>
          <Ex.BookingDetailBodyExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="useTickingValue" source="shared/capture/useTickingValue.ts" usedIn="Admin · Web · Mobile" stage="mobile" height={220}
          what="A hook that rolls a figure to its new value over 320ms with a green flash, and jumps under reduced motion."
          shared="shared/capture/useTickingValue.ts"
          note="On the phone it drives the dock strip (BookingTotalStrip, catch-up Phase 24); this demo drives the hook directly. Keep the flash tint.">
          <Ex.TickingValueExample />
        </CatalogueRow>
        <CatalogueRow name="Collapsing masthead" source="shared/surface/SurfaceProvider.tsx" usedIn={M} stage="mobile" height={460}
          what="The Booking screen's large title folds into a 44px nav row once the column scrolls past 24px, iOS large-title style."
          shared="shared/surface/SurfaceProvider.tsx"
          note="The fold is the real MobileBookingLayout; the masthead handed to it is recreated from BookingDetailScreen.tsx, where it is local.">
          <Ex.CollapsingMastheadExample />
        </CatalogueRow>
        <CatalogueRow name="ProfileRow" source="shared/profile/ProfileRow.tsx" usedIn={WM} stage="mobile" height={220} what="One row of the anaesthetist's own profile on the More tab and the web Profile page (catch-up Phase 26): the shared DefRow in its settings layout, the label left, the mono value right, and either an action (the rate's Change) or the lock glyph for a fact the office holds. The bank number is always masked." shared="shared/profile/ProfileRow.tsx" note="Reads the persona's own record; writes nothing.">
          <Ex.ProfileRowExample anaesthetistId={anaesthetistId} />
        </CatalogueRow>
        <CatalogueRow name="ProcedureStack" source="shared/booking/ProcedureStack.tsx" usedIn={SW} stage="mobile" height={520} what="One Procedure's procedure text, invoice description, Contract and RVG code on every Booking screen, Admin Review and the List drawer, in full or compact density; still-to-choose parts are neutral and dashed. On a multi-procedure Booking its heading takes a badge, the neutral Primary pill (catch-up Phase 23)." shared="shared/booking/ProcedureStack.tsx" note="Fixed example views; nothing writes to the demo data.">
          <ProcedureStackExample layout="stacked" />
        </CatalogueRow>
        <CatalogueRow name="FunderDetailsView" source="shared/booking/FunderDetailsView.tsx" usedIn={SW} stage="mobile" height={520} what="The Booking's insurer or funder and its approval number (catch-up Phase 21): None; an insurer with its number; an insurer with no number (the warning-tint chip); a funder with none. FunderSheet edits it with radio chips." shared="shared/booking/FunderDetailsView.tsx" note="Fixed example details; nothing writes to the demo data. The approval number row is a shared DefRow (UI unification U6), its label kept at 96 because it wraps at 80.">
          <FunderDetailsExample />
        </CatalogueRow>
        <CatalogueRow name="PaidByRow" source="shared/booking/PaidByRow.tsx" usedIn={SW} stage="mobile" height={520} what="Paid by in the Billing card (catch-up Phases 22 and 22a; US-08.2.3, US-11.2.2): the Procedure's payer with Patient or the relationship and the warning-tint Email or postal address needed and Under 18 pills where its Contract bills the payer; the holder where the Contract bills its holder; a split's parties, in the warning tint when it no longer fits; Payer: not billed yet with no Contract. On web and Admin a line at the card's foot, on the phone the Billing summary's last row: Change beside the payer's name opens PaidBySheet with who pays and the offer; Split on the right opens it with the split alone." shared="shared/booking/PaidByRow.tsx" note="Read-only examples over fixed views; the sheet opens on a real Booking. The Paid by line is a shared DefRow since UI unification U6 (its Change and Split inside the value).">
          <PaidByRowExample variant="summary" />
        </CatalogueRow>
        <CatalogueRow name="MobileHeader" source="apps/mobile/components/MobileHeader.tsx" usedIn={M} stage="mobile" height={140}
          what="The tab-screen header: micro-caps eyebrow, large title and the persona avatar."
          shared="Stays custom"
          note="Its eyebrow is the shared Eyebrow (11/600, UI unification U6).">
          <Ex.MobileHeaderExample />
        </CatalogueRow>
        <CatalogueRow name="Sticky submit dock" source="apps/mobile/screens/ListDetailScreen.tsx" usedIn={M} stage="mobile" height={260}
          what="The frosted footer on a List: greyed with what is left, teal Mark list completed, green Submitted to office, or locked once authorised."
          shared="shared/ui/StickyDock.tsx"
          note="Recreated: the dock is the shared StickyDock (UI unification U7), its four states local to ListDetailScreen.tsx. Switch them with the control.">
          <Ex.SubmitDockExample />
        </CatalogueRow>
        <CatalogueRow name="DockSpacer" source="shared/ui/DockSpacer.tsx" usedIn={M} stage="mobile" height={340}
          what="An in-flow spacer at the tail of a scroller so the last item clears the frosted dock or tab bar. Trailing padding creates no scroll room on WebKit."
          shared="shared/ui/DockSpacer.tsx"
          note="Invisible in the app; outlined here so you can see it.">
          <Ex.DockSpacerExample />
        </CatalogueRow>
      </FamilySection>

      <FamilySection id="custom">
        <CatalogueRow name="SlideStack" source="apps/mobile/components/SlideStack.tsx" usedIn={M} stage="mobile" height={420}
          what="The iOS-style stack: every layer stays mounted, the one behind parallaxes and dims, and an edge swipe from the left pops a layer."
          shared="Stays custom"
          note="The edge swipe is touch only (DevTools device mode). Add focus moves on push and pop.">
          <Ex.SlideStackExample />
        </CatalogueRow>
        <CatalogueRow name="ProcedureEventsList (the anaesthetist)" source="shared/booking/ProcedureEventsList.tsx" usedIn={SW} stage="mobile" height={560} what="A Procedure's events (catch-up Phase 38b; US-03.7.3) as the anaesthetist sees them on their own Procedure: the kind, the date, the first line's description, Raised by you, the total ex GST and the party, the status pill, a declined reason, and Edit and Remove on what they raised while it awaits review or was declined. No review action, invoice link or Booking total. Since catch-up Phase 39b the section shows on their own Procedure with Add pre-op or post-op event and Add billing event at its foot, and lists those kinds (type or description, what was recorded, a total once one exists)." shared="shared/booking/ProcedureEventsList.tsx" note="Over the seeded event EV0001 (Dr Souter, David Chen's HP03); writes go to the demo store.">
          <ProcedureEventsListExample as="anaesthetist" />
        </CatalogueRow>
        <CatalogueRow name="ListRow" source="shared/schedule/ListRow.tsx" usedIn={SW} stage="mobile" height={460}
          what="A session row on the Lists home: status rail, session and time, title, and a right-hand cluster (progress, count, chip). Open and closed sessions take the status fill."
          shared="shared/schedule/ListRow.tsx"
          note="First two rows are her real upcoming Lists. The second real row shows stubCount (catch-up Phase 33a): the triangle marker for a stub on the List, never in its count.">
          <Ex.ListRowExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="Colleague AM / PM cells" source="apps/mobile/screens/AvailabilityScreen.tsx" usedIn={M} stage="mobile" height={460}
          what="Each colleague's card on Find cover with an AM and a PM cell in that session's status. A free cell her List could move into becomes a button."
          shared="Stays custom"
          note="Recreated: local to AvailabilityScreen.tsx (today's real sessions). Hatched and dashed fills are domain visuals.">
          <Ex.ColleagueCellsExample />
        </CatalogueRow>
        <CatalogueRow name="HalfBlock" source="apps/mobile/screens/MyAvailabilityCalendarScreen.tsx" usedIn={M} stage="mobile" height={200}
          what="One session's bar in the month grid: the status fill (or the List's), a repeat glyph for a series and an amber ! for a flag."
          shared="Stays custom"
          note="Recreated: local to MyAvailabilityCalendarScreen.tsx. Its title never shows on touch.">
          <Ex.HalfBlockExample />
        </CatalogueRow>
      </FamilySection>

      <FamilySection id="demo">
        <CatalogueRow name="ToggleRow (switch)" source="pwa/PwaDemoPanel.tsx" usedIn="Mobile (installed PWA)" stage="mobile" height={180}
          what="The hand-drawn switch on the PWA's presenter panel, such as Play the office."
          shared="Demo only"
          note="Recreated: local to PwaDemoPanel.tsx. Stays its own (a demo surface); product toggles use the shared Switch (UI unification U4).">
          <Ex.ToggleRowExample />
        </CatalogueRow>
      </FamilySection>
    </CataloguePage>
  )
}
