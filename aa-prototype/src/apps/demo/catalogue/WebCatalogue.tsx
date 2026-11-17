import { SurfaceProvider } from '../../../shared'
import { MoveListPromptProvider } from '../../../shared/flows/MoveListPrompt'
import { CataloguePage, CatalogueRow, LibraryGroup } from './CatalogueKit'
import { useWebFixtures } from './web/fixtures'
import * as D from './web/demos'
import { ProcedureStackExample } from './procedureStackExample'
import { FunderDetailsExample, PayerFieldsExample } from './payerExamples'
import { PaidByRowExample, PaidBySheetExample, PartyPickerExample } from './splitExamples'

const W = 'Web'
const WA = 'Web · Admin'
const WM = 'Web · Mobile'
const ALL = 'Admin · Web · Mobile'

/**
 * /demo/catalogue/web: every hand-built component in the Anaesthetist Web App,
 * plus the shared ones it uses, live and interactive, one per row, grouped by
 * the library that would replace it (docs/ui-library-research). Demo only.
 * Rows read seeded data as Dr Souter; navigation is stubbed so nothing leaves
 * the page.
 */
export function WebCatalogue() {
  const f = useWebFixtures()
  return (
    <CataloguePage
      title="Anaesthetist Web App · UI components"
      intro="Every hand-built component in the Web app and the shared ones it uses, live on seeded data as Dr Souter. Navigation is stubbed. A few rows open real flows: confirming one changes the demo data, and Demo reset puts it back."
    >
      {/* The web surface here too, so the move sheet the provider opens is a centred dialog. */}
      <SurfaceProvider variant="web">
      <MoveListPromptProvider actor={f.actor}>
        <LibraryGroup id="shadcn">
          <CatalogueRow name="WebNav" source="apps/web/components/WebNav.tsx" usedIn={W} what="The white top bar: AA logo, the four section tabs with a crimson underline on the active one, and the persona's name and avatar." replaceWith="shadcn NavigationMenu (links) + Avatar" note="A labelled navigation (Main) whose active tab carries aria-current since UI unification U5; the tabs stay buttons (question 3). The avatar is the shared Avatar (tint, 36).">
            <D.WebNavDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="AvailabilityPageSwitch" source="apps/web/components/AvailabilityPageSwitch.tsx" usedIn={W} what="Switches between the two Availability pages, Find cover and My availability. Since UI unification U5 (question 18) an underline tab strip of links on the shared LineTabs: a labelled navigation, the current page marked aria-current." replaceWith="shadcn Tabs (as links)" note="Was a sliding segmented control doing a tab bar's job; now real links, so the route and the browser's back work as links do.">
            <D.PageSwitchDemo />
          </CatalogueRow>
          <CatalogueRow name="SubTabButton" source="apps/web/screens/AccountsScreen.tsx" usedIn={W} what="The Accounts underline sub-tabs: Overdue, Payments, GST activity and AA fees." replaceWith="shadcn Tabs" note="Recreated: local to AccountsScreen.tsx. No tab roles, aria-selected or arrow keys today.">
            <D.SubTabsDemo />
          </CatalogueRow>
          <CatalogueRow name="Back link" source="shared/ui/BackLink.tsx" usedIn={ALL} what="The teal chevron that returns to the parent screen (UI unification U5): a real link where a route exists, else a button; desktop 14px, the phone's 15px with a 44px target, a sheet's 13px step back. Review and Invoices keep only their breadcrumb (question 9)." replaceWith="shadcn Breadcrumb" note="One component for the five desktop copies, the phone's header backs, the move sheets' step back and ProfileChrome's link.">
            <D.BackLinkDemo />
          </CatalogueRow>
          <CatalogueRow name="Panel" source="apps/web/components/Panel.tsx" usedIn={W} what="The white card every web screen is built from: optional title row with a right-aligned action, padded or flush for a full-bleed table." replaceWith="shadcn Card" note="The title is a div, not a heading, so screen-reader users cannot jump between panels.">
            <D.PanelDemo />
          </CatalogueRow>
          <CatalogueRow name="StatTile" source="apps/web/screens/DashboardScreen.tsx" usedIn={W} what="A dashboard figure: small caps label, a large mono value and an optional green change pill. Seeded productivity figures." replaceWith="shadcn Card + Badge" note="Recreated: local to DashboardScreen.tsx. Static figures; no animation to add.">
            <D.StatTileDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="SlidingSegmentedControl" source="shared/ui/SlidingSegmentedControl.tsx" usedIn={ALL} what="A single-choice segmented control whose highlight slides between options. Two colour variants (teal, surface) and two sizes: md, and sm for a 36px toolbar (Admin Day's row order, UI unification U5). The ink variant went with question 17." replaceWith="shadcn ToggleGroup (single)" note="aria-pressed buttons rather than radios, no roving focus (question 3 keeps them buttons). Keep the slide with Motion layoutId.">
            <D.SlidingSegmentedDemo />
          </CatalogueRow>
          <CatalogueRow name="Segmented" source="shared/ui/Field.tsx" usedIn={ALL} what="The simpler segmented control (no slide). On web it picks the GST period on Accounts." replaceWith="shadcn ToggleGroup (single)" note="A second segmented control doing the same job; merge into one.">
            <D.SegmentedDemo />
          </CatalogueRow>
          <CatalogueRow name="FilterPills" source="shared/ui/FilterPills.tsx" usedIn={WM} what="Choose one list filter from a row of solid pills (UI unification U5): the All anaesthetists / Free only pills on Find cover with today's free-session count (36px), and the phone's Week, Month, To-Do and Done (38px). A labelled group with aria-pressed." replaceWith="shadcn ToggleGroup (single)" note="Was the web FilterChip and the mobile Lists pills, one job built twice.">
            <D.FilterChipDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="StatusLegend (toggle mode)" source="shared/StatusLegend.tsx" usedIn={ALL} what="The status legend as compact chips. Given activeStatuses and onToggleStatus it becomes a status filter; click the chips." replaceWith="shadcn ToggleGroup (multiple)" note="A group of toggles without a toggle group's keyboard model.">
            <D.StatusLegendDemo />
          </CatalogueRow>
          <CatalogueRow name="StatusChip" source="shared/StatusChip.tsx" usedIn={ALL} what="The pill for a List type or availability status, coloured from the status master. Every status in the legend is shown." replaceWith="shadcn Badge (status variants)" note="Status colours become --status-* tokens with tint and on-tint values.">
            <D.StatusChipDemo />
          </CatalogueRow>
          <CatalogueRow name="ProgressPill" source="shared/schedule/ProgressPill.tsx" usedIn={ALL} what="A List's progress: To finish, Ready to submit, Done · unbilled, Invoiced, Authorised." replaceWith="shadcn Badge" note="One more pill family to fold into Badge variants.">
            <D.ProgressPillDemo />
          </CatalogueRow>
          <CatalogueRow name="WebDayChip" source="apps/web/screens/ListsLookback.tsx" usedIn={W} what="The teal chip naming the picked day on the Lists page. Click it to close the day and go back to the main view." replaceWith="shadcn Badge (removable) / Button" note="The whole chip is the close button; a Badge with a separate remove control reads more clearly.">
            <D.DayChipDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="WarningTriangle" source="shared/warnings/WarningTriangle.tsx" usedIn={ALL} what="The small warning marker on a Booking, coloured by the strongest open warning, with a count when there are several." replaceWith="shadcn Tooltip + Badge" note="The warning text lives only in title=, which keyboard and touch users never see.">
            <D.WarningTriangleDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="Who's free chip" source="apps/web/screens/DashboardScreen.tsx" usedIn={W} what="A colleague's name on the dashboard's Who's free panel. A button when her List can move into their free session, a plain chip otherwise." replaceWith="shadcn Tooltip" note="Recreated: inline in DashboardScreen.tsx. Why it is or is not clickable is only in title=.">
            <D.WhosFreeChipDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="IconButton" source="shared/ui/IconButton.tsx" usedIn={ALL} what="A button holding only a glyph or icon (UI unification U5): the desktop step buttons at each mockup's size (32 the week strip, 36 Admin Day, 38 Find cover and My availability) with ‹ ›, the phone's 44px round month and square stepper buttons. Its label is required; CloseButton is the borderless X." replaceWith="shadcn Button (size icon)" note="Was IconBtn, NavButton and WeekNavButton here, and SquareBtn, StepButton and the steppers elsewhere.">
            <D.IconButtonsDemo />
          </CatalogueRow>
          <CatalogueRow name="Day stepper" source="apps/web/screens/AvailabilityGrid.tsx" usedIn={W} what="Previous day, the day's name, next day and Today, for Find cover." replaceWith="shadcn Button Group" note="Recreated: inline in AvailabilityGrid.tsx, on the shared IconButton and Button (outline). No arrow-key or T-for-today shortcuts.">
            <D.DayStepperDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="TextAction" source="shared/ui/TextAction.tsx" usedIn={ALL} what="A borderless teal word that does one thing (UI unification U5): sm 12.5 in tables, md 14 in cards, lg 15 with a 44px target on the phone, flush, inline inside a sentence, and a printed reason when disabled. The dashboard's view overdue accounts is one." replaceWith="shadcn Button (variant link)" note="Was the dashboard's LinkButton, SeriesList's linkStyle and about forty inline teal copies.">
            <D.LinkButtonDemo />
          </CatalogueRow>
          <CatalogueRow name="SubmitAction" source="apps/web/screens/ListDetailView.tsx" usedIn={W} what="List detail's primary action in four states: blocked (count left, opens the real blockers sheet), ready, submitted and authorised." replaceWith="shadcn Button variants + Badge" note="Recreated: local to ListDetailView.tsx. Submitting just swaps the button for a green pill, with no live region or toast.">
            <D.SubmitActionDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="Add a booking (dashed)" source="apps/web/screens/ListDetailView.tsx" usedIn={W} what="The full-width dashed button under the Bookings table. Opens the real Add a booking dialog." replaceWith="shadcn Button (outline, dashed variant)" note="Recreated: inline in ListDetailView.tsx. Saving in the dialog adds a Booking to the demo data.">
            <D.AddBookingButtonDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="Progress bar" source="shared/ui/ProgressBar.tsx" usedIn={WM} what="How many Bookings on the List are complete, as a count and a green bar that eases to its new width: the shared ProgressBar (UI unification U5), 200px in the web header and the rest of the row on the phone, a progressbar with its values." replaceWith="shadcn Progress" note="Was built twice, without a role.">
            <D.ProgressBarDemo />
          </CatalogueRow>
          <CatalogueRow name="Dialog (web Overlay)" source="shared/surface/Dialog.tsx" usedIn={WA} what="The web surface's modal: a centred card over a scrim, closed by Escape, the corner X or a scrim click. On the one modal stack (useModalLayer): focus goes in, stays in and comes back, and the OverlayHeader title names the dialog. Shown with the dashboard's Which List? picker." replaceWith="shadcn Dialog" note="The Overlay is real; the picker content is recreated from DashboardScreen.tsx. The library would add scroll lock.">
            <D.DialogDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="SubmitListSheet" source="shared/flows/SubmitListSheet.tsx" usedIn={WM} what="The submit flow's sheet. In blockers mode it lists each Booking still to finish and why; confirm mode is a ConfirmSheet." replaceWith="shadcn Dialog (AlertDialog for the confirm step)" note="Only blockers mode is offered here; confirm mode submits the List for real.">
            <D.SubmitListSheetDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="Lists search (NameSearchBox pill 38)" source="apps/web/screens/ListsScreen.tsx" usedIn={W} what="The Lists page's search for a patient name or NHI: the shared NameSearchBox as the 38px pill, 280px wide, white on the page, beside Go to date, with its clear button (Clear the search field) and the web-lists-search test id." replaceWith="shadcn Input Group (search)" note="Since UI unification U4 there is no WebSearchField: ListsScreen renders NameSearchBox itself. Rebuilt here with the same props; the query is handed up as you type.">
            <D.ListsSearchDemo />
          </CatalogueRow>
          <CatalogueRow name="NameSearchBox" source="shared/ui/NameSearchBox.tsx" usedIn={ALL} what="The one search box in all three apps (UI unification U4): a pill (Find cover, the Lists page) or a field (the move and picker sheets); fill well inside a sheet or card, surface on the page; Escape or the clear button empties it. Filters the list it sits over as you type." replaceWith="shadcn Input Group (search)" note="The web Lists search and the phone's Lists search are this component now, so there is one search input.">
            <D.NameSearchBoxDemo />
          </CatalogueRow>
          <CatalogueRow name="MovedToYouPanel" source="shared/flows/MovedToYouPanel.tsx" usedIn={WM} what="Tells an anaesthetist which Lists or Bookings colleagues have moved to them recently, each opening its List or Booking." replaceWith="shadcn Alert" note="An informational callout built by hand.">
            <D.MovedToYouDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="SeriesList" source="shared/availability/SeriesList.tsx" usedIn={WM} what="Her repeating days off, each with Delete and an inline are-you-sure step." replaceWith="shadcn Card list + AlertDialog" note="The inline confirm becomes an AlertDialog. Deleting a series changes the demo data.">
            <D.SeriesListDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="CodePickerSheet" source="shared/capture/CodePickerSheet.tsx" usedIn={ALL} what="The RVG code type-ahead in an Overlay titled by an OverlayHeader: every code under its anatomy heading, search by code or description (the shared NameSearchBox in the well fill, UI unification U4), every row showing code, description and base units." replaceWith="shadcn Combobox (Base UI) + TanStack Virtual" note="Picks are held locally here. The library would add combobox and listbox roles and virtualise the rows.">
            <D.CodePickerDemo />
          </CatalogueRow>
          <CatalogueRow name="RvgCodeList" source="shared/capture/RvgCodeList.tsx" usedIn={ALL} what="Every RVG code under its anatomy heading, the heading pinned to the top of the list until its rows scroll past; shared by the type-ahead field and the code sheet." replaceWith="Base UI Combobox groups + TanStack Virtual" note="Shown inside CodePickerSheet above and RvgCodeField below. Every row renders.">
            <D.CodePickerDemo />
          </CatalogueRow>
          <CatalogueRow name="RvgCodeField" source="shared/capture/ProcedureCodeCard.tsx" usedIn={ALL} what="A Procedure's RVG code, inside the Billing card's price (on the phone, inside the Billing sheet): typed straight into the field, which drops down every code; once chosen the field shows the code, a click changes it and a cross clears it; a ranged code takes a base value." replaceWith="shadcn Card + Base UI NumberField" note="Live on a seeded Booking still to capture; changes write to the demo data.">
            <D.RvgCodeFieldDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="TimesCard" source="shared/capture/TimesCard.tsx" usedIn={ALL} what="Start and Finish capture: Start now and Finish now stamp the demo clock, then minus and plus 5 minute nudges." replaceWith="shadcn Card + Button Group" note="Live on a seeded Booking; stamping and nudging write to the demo data.">
            <D.TimesCardDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="UnitsCard" source="shared/capture/UnitsCard.tsx" usedIn={ALL} what="The base, time and modifier unit rows with steppers (NumberStepper since catch-up Phase 23), each showing where its value came from. On an additional procedure B and M show their figure and caption with no stepper, and one caption row stands in for the Modifiers section (the multi-procedure rule)." replaceWith="shadcn Card + Button Group (labelled steppers)" note="Each stepper is labelled with its row and direction (catch-up Phase 21a); it takes the procedure's allocation in its Booking (catch-up Phase 23). The modifier and ASA controls were being reworked (ModifiersSection) when this page was built, so they are not shown as separate rows.">
            <D.UnitsCardDemo f={f} />
          </CatalogueRow>
        </LibraryGroup>

        <LibraryGroup id="sonner">
          <CatalogueRow name="ResultLine" source="shared/ui/ResultLine.tsx" usedIn={ALL} what="The success-green line confirming an action in place (UI unification U3, question 14), its role=status region always mounted so the words are announced; actions and a labelled dismiss." replaceWith="Sonner toast" note="Inline success banners become toasts; errors stay inline. The web also has no feedback at all after submitting a List.">
            <D.ResultLineDemo />
          </CatalogueRow>
        </LibraryGroup>

        <LibraryGroup id="tanstack">
          <CatalogueRow name="Lists table (Th · Td · GroupRow)" source="apps/web/screens/ListsScreen.tsx" usedIn={W} what="Her Lists from today, after an Earlier, not yet authorised group row. Row click opens a List; search and Go to date swap in the other tables." replaceWith="TanStack Table + shadcn Table (grouped rows)" note="The real ListsScreen in a scrolling stage (the table is local to it). Th and Td are copied in four files; no sorting; row clicks are mouse first." height={560}>
            <D.ListsTableDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="WebResultsTable" source="apps/web/screens/ListsLookback.tsx" usedIn={W} what="Search results grouped Upcoming then Past: date, session, patient, NHI, hospital, procedure and progress." replaceWith="TanStack Table + shadcn Table" note="Type in the search box to drive it." height={460}>
            <D.ResultsTableDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="WebDayTable" source="apps/web/screens/ListsLookback.tsx" usedIn={W} what="One day's Lists for Go to date: session, start time, location, Booking count, status and progress." replaceWith="TanStack Table + shadcn Table" note="Pick a day with the date input above it." height={360}>
            <D.DayTableDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="Accounts tables (tfoot totals)" source="apps/web/screens/AccountsScreen.tsx" usedIn={W} what="Overdue, Payments, GST activity and AA fees, each a table; Overdue, GST and AA fees close with totals in a tfoot." replaceWith="TanStack Table + shadcn Table (footer)" note="The real AccountsScreen; its sub-tabs switch the table. Totals rows have no row headers." height={560}>
            <D.AccountsDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="List detail Bookings table" source="apps/web/screens/ListDetailView.tsx" usedIn={W} what="A List's Bookings with time, patient and NHI, procedure, units, fee and status, then a totals row; plus the page's actions and panels." replaceWith="TanStack Table + shadcn Table" note="The real ListDetailView in a scrolling stage. The patient's name is each row's keyboard handle (a plain button, as the Lists table's date); the row click stays for the mouse. Move, alert and add a booking open real flows that change the demo data." height={700}>
            <D.ListDetailDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="ListInvoices" source="shared/schedule/ListInvoices.tsx" usedIn={WM} what="An authorised List's invoices, read only: number, who it went to, when, total and paid state." replaceWith="shadcn Table (plain)" note="A styled list today; a small static table, no TanStack features needed.">
            <D.ListInvoicesDemo f={f} />
          </CatalogueRow>
        </LibraryGroup>

        <LibraryGroup id="forms">
          <CatalogueRow name="AvailabilityEditor" source="shared/availability/AvailabilityEditor.tsx" usedIn={WM} what="The rail on My availability: the selected day's AM and PM sessions and the form to change them, set a range or repeat." replaceWith="React Hook Form + Zod + shadcn Field" note="Hand-rolled form state and errors. Saving changes the demo data." height={520}>
            <D.AvailabilityEditorDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="AlertOfficeEntry" source="shared/flows/AlertOfficeSheet.tsx" usedIn={WM} what="Alert the office about this List: opens a short message sheet (OverlayHeader and SheetActions), then a DoneStep for the sent step, then shows the open alert's status." replaceWith="shadcn Dialog + Field + React Hook Form" note="Sending an alert writes to the demo data.">
            <D.AlertOfficeDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="OverrideCard" source="shared/capture/OverrideCard.tsx" usedIn={ALL} what="A Procedure's price adjustment or fixed charge with its mandatory reason, saved on Save." replaceWith="Base UI NumberField + shadcn Field + React Hook Form" note="Live on a seeded Booking; saving writes to the demo data.">
            <D.OverrideCardDemo f={f} />
          </CatalogueRow>
        </LibraryGroup>

        <LibraryGroup id="daypicker">
          <CatalogueRow name="WeekStrip" source="apps/web/components/WeekStrip.tsx" usedIn={W} what="The dashboard week: seven columns of her AM and PM sessions in status colours, Lists clickable, today outlined, week stepping." replaceWith="react-day-picker (week view, custom day content)" note="Today is marked by colour only (no aria-current); truncated labels have no tooltip." height={300}>
            <D.WeekStripDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="My availability month grid (DayCell)" source="apps/web/screens/MyAvailabilityCalendar.tsx" usedIn={W} what="Her month, each day with AM and PM session cells, under the shared MonthHeaderRow (Mon to Sun, hidden from screen readers; UI unification U4). Click a day, shift-click to select a range; the rail edits the selection." replaceWith="shadcn Calendar (react-day-picker, range mode, custom day content)" note="The real screen in a scrolling stage (the grid is local to it). The day cell has no focus style. Saving in the rail changes the demo data." height={720}>
            <D.MyAvailabilityDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="WebGoToDate" source="apps/web/screens/ListsLookback.tsx" usedIn={W} what="The Lists page's Go to date, bounded by her first and last day with work. Since UI unification U4 it renders the shared DateJumpInput (38px, its label beside it), which takes only a full day inside the bounds." replaceWith="shadcn Date Picker (Popover + Calendar)" note="Pass the demo clock's today and the bounds as min and max. Admin Day's go-to-date is the same part at 36px.">
            <D.GoToDateDemo f={f} />
          </CatalogueRow>
        </LibraryGroup>

        <LibraryGroup id="recharts">
          <CatalogueRow name="Receivables aging bars" source="apps/web/screens/DashboardScreen.tsx" usedIn={W} what="Outstanding receivables by age bucket as horizontal bars with amounts, from the billing mirror." replaceWith="Recharts bar chart (shadcn Chart)" note="Recreated: inline in DashboardScreen.tsx. Spans with no chart semantics or table fallback.">
            <D.AgingBarsDemo f={f} />
          </CatalogueRow>
        </LibraryGroup>

        <LibraryGroup id="numberflow">
          <CatalogueRow name="BookingTotalPanel · useTickingValue" source="shared/capture/BookingTotalPanel.tsx" usedIn={WA} what="The ink Booking total: breakdown lines, units and fee, rate and override note. Units and fee tick to new values with a green flash. On a multi-procedure Booking its rows say each Procedure's place in the rule (Primary · B + T + M 3 of 7) and plain captions follow (Modifiers 7, split 3 · 2 · 2), all under booking-total-split (catch-up Phase 23)." replaceWith="NumberFlow (optional swap for useTickingValue)" note="Fed local figures here. Keep the flash and the reduced-motion jump; animate nothing that is static today.">
            <D.BookingTotalDemo f={f} />
          </CatalogueRow>
        </LibraryGroup>

        <LibraryGroup id="motion">
          <CatalogueRow name="TickBadge" source="shared/ui/TickBadge.tsx" usedIn={ALL} what="The small green completion tick, still on settled rows or drawn with a pulse at the moment of completion." replaceWith="Custom on Motion" note="Keep the choreography; re-express the CSS keyframes on Motion.">
            <D.TickBadgeDemo />
          </CatalogueRow>
          <CatalogueRow name="CompleteBar" source="shared/capture/CompleteBar.tsx" usedIn={ALL} what="Booking capture's Mark complete button, which becomes a green done bar with Amend while the List is active." replaceWith="Custom on Motion (shadcn Button inside)" note="Local state here; in the app it completes and reopens the Booking.">
            <D.CompleteBarDemo />
          </CatalogueRow>
        </LibraryGroup>

        <LibraryGroup id="custom">
          <CatalogueRow name="ProcedureStack" source="shared/booking/ProcedureStack.tsx" usedIn={ALL} what="One Procedure's procedure text, invoice description, Contract and RVG code on every Booking screen, Admin Review and the List drawer, in full or compact density; still-to-choose parts are neutral and dashed. On a multi-procedure Booking its heading takes a badge, the neutral Primary pill (catch-up Phase 23)." replaceWith="Custom (a description list on library primitives)" note="Fixed example views; nothing writes to the demo data.">
            <ProcedureStackExample />
          </CatalogueRow>
            <CatalogueRow name="PayerFields (DifferentPayerTick, OtherPayerFields, PostalAddressFields)" source="shared/flows/PayerFields.tsx, PostalAddressFields.tsx" usedIn={ALL} what="The payer form's parts, in PaidBySheet's Who pays and the add forms (U4 migrates them): the Different payer tick, then the other payer's name, relationship chips, email, NZ Post postal address and phone." replaceWith="shadcn Checkbox card, ToggleGroup and Input" note="Local state only; nothing writes to the demo data.">
              <PayerFieldsExample />
            </CatalogueRow>
            <CatalogueRow name="FunderDetailsView" source="shared/booking/FunderDetailsView.tsx" usedIn={ALL} what="The Booking's insurer or funder and its approval number (catch-up Phase 21): None; an insurer with its number; an insurer with no number (the warning-tint chip); a funder with none. FunderSheet edits it with radio chips." replaceWith="Custom (text rows and the shared Pill)" note="Fixed example details; nothing writes to the demo data.">
              <FunderDetailsExample />
            </CatalogueRow>
            <CatalogueRow name="PartyPicker" source="shared/booking/PartyPicker.tsx" usedIn={ALL} what="Choose who an invoice goes to (catch-up Phases 22 and 22a): the Procedure's payer and the Contract's party first, then every Party, searchable by name, and with onAnotherPerson a last row, Another person, for someone who is no Party. The split's party field in PaidBySheet; Phases 38b, 39 and 39b reuse it." replaceWith="shadcn Combobox (Popover and Command)" note="Fixed options on local state; nothing writes to the demo data.">
              <PartyPickerExample />
            </CatalogueRow>
            <CatalogueRow name="PaidByRow" source="shared/booking/PaidByRow.tsx" usedIn={ALL} what="Paid by in the Billing card (catch-up Phases 22 and 22a; US-08.2.3, US-11.2.2): the Procedure's payer with Patient or the relationship and the warning-tint Email or postal address needed and Under 18 pills where its Contract bills the payer; the holder where the Contract bills its holder; a split's parties, in the warning tint when it no longer fits; Payer: not billed yet with no Contract. On web and Admin a line at the card's foot, on the phone the Billing summary's last row: Change beside the payer's name opens PaidBySheet with who pays and the offer; Split on the right opens it with the split alone." replaceWith="Custom (text rows and the shared Pill)" note="Read-only examples over fixed views; the sheet opens on a real Booking.">
              <PaidByRowExample variant="line" />
            </CatalogueRow>
            <CatalogueRow name="PaidBySheet (with SplitFeeSection)" source="shared/flows/PaidBySheet.tsx, shared/flows/SplitFeeSection.tsx" usedIn={ALL} what="The one Paid by sheet (catch-up Phase 22a; US-11.2.2, US-08.2.3): a bottom sheet on the phone, a dialog on web and Admin. Opened by Change, it holds who pays (the Different payer tick, the patient's details or the other payer's fields, the Under 18 hint and the contact ask) and, when the payer changes, the offer (the Booking's other Procedures with the same payer, each ticked, and the one neutral Provisional, OQ-140 pill). Opened by Split, it holds the split alone (a party or Another person, a $ or % share and Takes the rest per row, each amount live). Save writes it or refuses it whole." replaceWith="Custom (shadcn Sheet, Checkbox and Input inside)" note="Opens on Grace Park's first seeded Procedure; Save writes to the demo store.">
              <PaidBySheetExample />
            </CatalogueRow>
          <CatalogueRow name="Cell (AvailabilityGrid)" source="apps/web/screens/AvailabilityGrid.tsx" usedIn={W} what="One colleague session on Find cover: status bar, two lines and a Move or Move here action when her List can go there." replaceWith="Custom cell on a grid + shadcn Tooltip" note="Recreated: local to AvailabilityGrid.tsx. Non-actionable cells are disabled buttons, unreachable by keyboard.">
            <D.AvailabilityCellDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="AvailabilityGrid" source="apps/web/screens/AvailabilityGrid.tsx" usedIn={W} what="Find cover: every anaesthetist's AM and PM for a day, filters, name search and legend, with Move and Move here gestures." replaceWith="Custom grid (role grid, roving focus) on library primitives" note="The real screen; its navigation is intercepted. Move opens the real move sheet, which changes the demo data if confirmed." height={640}>
            <D.AvailabilityGridDemo f={f} />
          </CatalogueRow>
          <CatalogueRow name="HistoryTimeline" source="shared/booking/HistoryTimeline.tsx" usedIn={ALL} what="A record's audit trail in plain English, newest first, under day headings, with coalesced runs that expand. Shown for the seeded Booking with the longest history." replaceWith="Custom, its expandable groups on shadcn Collapsible" note="The ledger layout is ours; only the expand and collapse is a library job." height={460}>
            <D.HistoryTimelineDemo f={f} />
          </CatalogueRow>
        </LibraryGroup>
      </MoveListPromptProvider>
      </SurfaceProvider>
    </CataloguePage>
  )
}
