import { CataloguePage, CatalogueRow, LibraryGroup, StageHint } from './CatalogueKit'
import { useMobilePersona, useSeedPicks } from './mobile/persona'
import * as Ex from './mobile/examples'
import { ProcedureStackExample } from './procedureStackExample'
import { FunderDetailsExample, PayerDetailsExample, PayerFieldsExample } from './payerExamples'

const M = 'Mobile'
const SW = 'Admin · Web · Mobile'
const WM = 'Web · Mobile'
const WRITES = 'writes to the demo store (the seeded record really changes); Demo reset puts it back.'
const STORE_NOTE = `Each tap ${WRITES}`

/** /demo/catalogue/mobile: every hand-built component in the Anaesthetist Mobile App, live, one per row. */
export function MobileCatalogue() {
  const { anaesthetistId } = useMobilePersona()
  const picks = useSeedPicks(anaesthetistId)

  return (
    <CataloguePage
      title="Anaesthetist Mobile App · UI components"
      intro="Every hand-built component in the Mobile app, live inside a 390px phone stage, grouped by the library that would replace it. Sheets open inside the stage, as they do in the phone. Swipe gestures (the stack's edge-swipe back) need touch: use DevTools device mode."
    >
      <LibraryGroup id="shadcn">
        <CatalogueRow name="BottomSheet" source="shared/surface/BottomSheet.tsx" usedIn={SW} stage="mobile" height={420}
          what="The mobile modal: a scrim and a panel that slides up from the bottom. It is what useSurface().Overlay renders on the phone, so every shared sheet uses it. It sits on the one modal stack with Dialog (useModalLayer): Escape closes only the top layer, focus goes in, stays in and comes back, and the OverlayHeader title names it."
          replaceWith="shadcn Drawer (Base UI Drawer)"
          note="The library would add drag-to-dismiss, snap points and nested sheets. Must keep --aa-keyboard-inset and portal into the phone frame.">
          <Ex.BottomSheetExample />
          <StageHint>Tap the scrim or the handle to dismiss.</StageHint>
        </CatalogueRow>
        <CatalogueRow name="InlineConfirm" source="shared/ui/InlineConfirm.tsx" usedIn={SW} stage="mobile" height={320}
          what="The one in-card confirm: a tinted box with a message and two pill actions, 'Keep it' first and the primary on the right. Focus moves to 'Keep it' on open and back to the control that opened it."
          replaceWith="shadcn AlertDialog (inline) or a plain Alert with actions"
          note="Used where a sheet would be too heavy, such as deleting a series from its card.">
          <Ex.InlineConfirmExample />
        </CatalogueRow>
        <CatalogueRow name="DoneStep" source="shared/ui/DoneStep.tsx" usedIn={SW} stage="mobile" height={380}
          what="The one in-sheet done step: a 72px TickBadge, a success title, an optional detail and the step's one action. Announced with role=status, with focus on the action at mount."
          replaceWith="Plain component (shadcn Alert with an icon)"
          note="The action is the caller's: Done closes the sheet, or opens the new Booking.">
          <Ex.DoneStepExample />
        </CatalogueRow>
        <CatalogueRow name="ListOptionsSheet" source="apps/mobile/components/ListOptionsSheet.tsx" usedIn={M} stage="mobile" height={520}
          what="The action sheet behind the List's ⋯ button, titled by an OverlayHeader: a row per thing she can do with her own List, each with a one-line hint."
          replaceWith="shadcn Drawer + plain button list"
          note="Declares role=menu with no arrow keys. Either drop the menu roles or use a real Menu.">
          <Ex.ListOptionsSheetExample />
        </CatalogueRow>
        <CatalogueRow name="AlertOfficeSheet" source="shared/flows/AlertOfficeSheet.tsx" usedIn={WM} stage="mobile" height={560}
          what="Asks the office to check one of her Lists or Bookings, with a note (OverlayHeader and SheetActions). A DoneStep shows the sent state afterwards."
          replaceWith="shadcn Drawer + Field (React Hook Form + Zod)"
          note={`Drawer adds the focus trap; Field binds the note's error to the textarea. Send ${WRITES}`}>
          <Ex.AlertOfficeSheetExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="SubmitListSheet" source="shared/flows/SubmitListSheet.tsx" usedIn={WM} stage="mobile" height={560}
          what="Opened from the greyed submit dock: names each Booking still to finish and what blocks it. Its confirm mode is a ConfirmSheet that submits the List."
          replaceWith="shadcn Drawer"
          note="Shown in blockers mode only, so nothing is submitted from here.">
          <Ex.SubmitListSheetExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="AvailabilityEditor" source="shared/availability/AvailabilityEditor.tsx" usedIn={WM} stage="mobile" height={600}
          what="A day's sessions, then the form to change them or add days off. Mobile hosts it in a bottom sheet; web in the right rail."
          replaceWith="shadcn Drawer + Field + ToggleGroup (React Hook Form + Zod)"
          note={`Same body in a library shell, one form pattern. Saving or removing ${WRITES}`}>
          <Ex.AvailabilityEditorExample />
        </CatalogueRow>
        <CatalogueRow name="Button (MobileButton)" source="shared/ui/Button.tsx" usedIn={SW} stage="mobile" height={320}
          what="The shared button set: primary (54px teal), secondary (outlined) and pill (tinted, compact). Mobile imports it as MobileButton."
          replaceWith="shadcn Button (cva variants)"
          note="Adds focus-visible, hover, loading and aria-disabled states.">
          <Ex.ButtonExample />
        </CatalogueRow>
        <CatalogueRow name="Mobile press feedback (:active)" source="theme/global.css" usedIn={M} stage="mobile" height={280}
          what="A CSS rule that makes every enabled button inside the phone UI sink 1px and scale slightly while held. The PWA host adds a touch listener so iOS fires :active."
          replaceWith="shadcn Button active state (active: utilities)"
          note="Moves from one global selector into the Button variants, so non-button tap targets opt in explicitly.">
          <Ex.PressFeedbackExample />
        </CatalogueRow>
        <CatalogueRow name="SlidingSegmentedControl" source="shared/ui/SlidingSegmentedControl.tsx" usedIn={SW} stage="mobile" height={260}
          what="A segmented control whose highlight slides to the chosen cell, measured in layout pixels so it survives the phone frame's scale. Teal, surface and ink variants."
          replaceWith="shadcn ToggleGroup (single) or Tabs"
          note="Gives radio semantics and arrow keys (today role=group with aria-pressed). Keep the slide with Motion layoutId.">
          <Ex.SlidingSegmentedExample />
        </CatalogueRow>
        <CatalogueRow name="Segmented" source="shared/ui/Field.tsx" usedIn={SW} stage="mobile" height={220}
          what="SlidingSegmentedControl with a field label above it, plus a read-only mode that keeps the selection visible."
          replaceWith="shadcn ToggleGroup + Field label"
          note="The label is a div today, so it is not tied to the control.">
          <Ex.SegmentedExample />
        </CatalogueRow>
        <CatalogueRow name="Filter chips (Week / Month / To-Do / Done)" source="apps/mobile/screens/ForwardListsScreen.tsx" usedIn={M} stage="mobile" height={200}
          what="The pill toggles above the Lists home that bound the forward window or filter to work to do or done."
          replaceWith="shadcn ToggleGroup (single)"
          note="Recreated: local to ForwardListsScreen.tsx. Already has aria-pressed; the web FilterChip copy does not.">
          <Ex.FilterChipsExample />
        </CatalogueRow>
        <CatalogueRow name="StepperButton" source="shared/capture/ui.tsx" usedIn={SW} stage="mobile" height={200}
          what="The 44px round-square minus and plus buttons beside each unit count in capture."
          replaceWith="shadcn Button (icon) + Button Group"
          note="Glyph-only today, so a screen reader hears just a minus or plus. Needs labels.">
          <Ex.StepperButtonExample />
        </CatalogueRow>
        <CatalogueRow name="NudgeButton" source="shared/capture/ui.tsx" usedIn={SW} stage="mobile" height={200}
          what="The small minus 5 and plus 5 buttons that nudge a stamped start or finish time."
          replaceWith="shadcn Button (sm, outline) + Button Group">
          <Ex.NudgeButtonExample />
        </CatalogueRow>
        <CatalogueRow name="CaptureSection" source="shared/capture/ui.tsx" usedIn={SW} stage="mobile" height={260}
          what="The capture card: a micro-caps label, the body, and an optional footer area pinned to the foot."
          replaceWith="shadcn Card (CardHeader / CardContent / CardFooter)"
          note="The label should become a real heading.">
          <Ex.CaptureSectionExample />
        </CatalogueRow>
        <CatalogueRow name="StatusChip" source="shared/StatusChip.tsx" usedIn={SW} stage="mobile" height={220}
          what="A status pill: coloured dot and label on the status tint, read from the status master so a rename shows at once."
          replaceWith="shadcn Badge + 6 status variants"
          note="Status colours become --status-* tokens with tint and on-tint values.">
          <Ex.StatusChipExample />
        </CatalogueRow>
        <CatalogueRow name="ProgressPill" source="shared/schedule/ProgressPill.tsx" usedIn={SW} stage="mobile" height={200}
          what="A List's progress as a compact pill: to finish, ready to submit, done, authorised, invoiced."
          replaceWith="shadcn Badge">
          <Ex.ProgressPillExample />
        </CatalogueRow>
        <CatalogueRow name="AgeChip" source="apps/mobile/screens/BalancesScreen.tsx" usedIn={M} stage="mobile" height={240}
          what="An outstanding invoice's age in days (amber past 60 days), with an ACC chip when ACC funded."
          replaceWith="shadcn Badge"
          note="Recreated: local to BalancesScreen.tsx.">
          <Ex.AgeChipExample />
        </CatalogueRow>
        <CatalogueRow name="DayChip" source="apps/mobile/screens/ListsLookback.tsx" usedIn={M} stage="mobile" height={160}
          what="The teal chip naming the picked day; tapping it closes the day view and goes back to the Lists."
          replaceWith="shadcn Badge (as a button, with dismiss icon)"
          note="Teal reads as an action here, which is right: it is one.">
          <Ex.DayChipExample />
        </CatalogueRow>
        <CatalogueRow name="Avatar" source="shared/Avatar.tsx" usedIn={SW} stage="mobile" height={160}
          what="The one avatar (UI unification U3): elevated white on mobile (the persona), the crimson tint of web and Admin (colleagues, the web nav), and neutral in the move sheets (muted when a colleague cannot be picked). The mockup font steps: 30 gives 11, 34 gives 12, 36 gives 13, 44 gives 15. PersonaChip draws it on the dark bars."
          replaceWith="shadcn Avatar (AvatarFallback)">
          <Ex.AvatarExample />
        </CatalogueRow>
        <CatalogueRow name="Hero figure card" source="apps/mobile/screens/BalancesScreen.tsx" usedIn={M} stage="mobile" height={200}
          what="The Balances headline: outstanding to you, in large mono figures, with the unpaid invoice count. Static, not animated."
          replaceWith="shadcn Card"
          note="Recreated: local to BalancesScreen.tsx. Reads the persona's real receivables.">
          <Ex.HeroFigureCardExample />
        </CatalogueRow>
        <CatalogueRow name="EmptyCard" source="apps/mobile/screens/BalancesScreen.tsx" usedIn={M} stage="mobile" height={180}
          what="The centred, muted card that says there is nothing to show yet."
          replaceWith="shadcn Empty"
          note="Recreated: local to BalancesScreen.tsx.">
          <Ex.EmptyCardExample />
        </CatalogueRow>
        <CatalogueRow name="MovedToYouPanel" source="shared/flows/MovedToYouPanel.tsx" usedIn={WM} stage="mobile" height={300}
          what="The notice at the top of Find cover listing Lists or Bookings a colleague moved to her in the last week, with any message."
          replaceWith="shadcn Card + Item list">
          <Ex.MovedToYouPanelExample />
        </CatalogueRow>
        <CatalogueRow name="Booking card (Capture pill)" source="apps/mobile/screens/ListDetailScreen.tsx" usedIn={M} stage="mobile" height={340}
          what="A Booking on the List: time, patient, NHI and operation, ending in a Capture pill, a completion tick, or Cancelled."
          replaceWith="shadcn Item (as a button) + Badge"
          note="Recreated: local to ListDetailScreen.tsx. Tap a card to cycle Capture, done, cancelled (local only). Its accessible name is all the text run together today.">
          <Ex.BookingCardExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="Progress bar" source="apps/mobile/screens/ListDetailScreen.tsx" usedIn={WM} stage="mobile" height={180}
          what="The List's n of m complete line with a green bar that eases to the new width."
          replaceWith="shadcn Progress"
          note="Recreated: local to ListDetailScreen.tsx. Gains role=progressbar and aria-valuenow.">
          <Ex.ProgressBarExample />
        </CatalogueRow>
        <CatalogueRow name="LookbackSearchRow" source="apps/mobile/screens/ListsLookback.tsx" usedIn={M} stage="mobile" height={200}
          what="The Lists search field (patient name or NHI, with a clear button) and the calendar button beside it."
          replaceWith="shadcn Input Group (search) + Button"
          note="One search input instead of three (this, WebSearchField, NameSearchBox).">
          <Ex.LookbackSearchRowExample />
        </CatalogueRow>
        <CatalogueRow name="LookbackResults (ResultRow)" source="apps/mobile/screens/ListsLookback.tsx" usedIn={M} stage="mobile" height={420}
          what="Search results grouped Upcoming and Past, each Booking a card with session, patient, NHI and progress."
          replaceWith="shadcn Item list + Badge">
          <Ex.LookbackResultsExample />
        </CatalogueRow>
        <CatalogueRow name="SeriesList" source="shared/availability/SeriesList.tsx" usedIn={WM} stage="mobile" height={260}
          what="Her repeating days off, each with a Remove that asks for confirmation inline."
          replaceWith="shadcn Item list + AlertDialog (confirm remove)"
          note={`Confirming a removal ${WRITES}`}>
          <Ex.SeriesListExample />
        </CatalogueRow>
        <CatalogueRow name="ToggleRow (switch)" source="pwa/PwaDemoPanel.tsx" usedIn="Mobile (installed PWA)" stage="mobile" height={180}
          what="The hand-drawn switch on the PWA's presenter panel, such as Play the office."
          replaceWith="shadcn Switch"
          note="Recreated: local to PwaDemoPanel.tsx.">
          <Ex.ToggleRowExample />
        </CatalogueRow>
        <CatalogueRow name="InstallCoach" source="pwa/InstallCoach.tsx" usedIn="Mobile (installed PWA)" stage="mobile" height={340}
          what="The dismissible Add to your home screen tip, with iPhone steps or an Android Install button."
          replaceWith="shadcn Alert"
          note="Recreated: src/pwa is PWA-only (its installPrompt module attaches a window listener at import and must not load in the prototype).">
          <Ex.InstallCoachExample />
        </CatalogueRow>
      </LibraryGroup>

      <LibraryGroup id="sonner">
        <CatalogueRow name="UpdatePrompt" source="pwa/UpdatePrompt.tsx" usedIn="Mobile (installed PWA)" stage="mobile" height={240}
          what="The floating snackbar that appears when a new build is waiting: tap to reload into it. Polls the service worker."
          replaceWith="Sonner toast with a Reload action"
          note="Recreated: it needs virtual:pwa-register, which only the PWA build provides. Offset the toaster above --aa-dock-height.">
          <Ex.UpdatePromptExample />
        </CatalogueRow>
      </LibraryGroup>

      <LibraryGroup id="forms">
        <CatalogueRow name="BookingDetailBody" source="shared/booking/BookingDetailBody.tsx" usedIn={SW} stage="mobile" height={640}
          what="The whole Booking capture: patient, ASA, RVG code, times, units, override, billing lines, notes and Mark complete, laid out by the mobile surface."
          replaceWith="React Hook Form + Zod over shadcn Card fields"
          note={`On a failed complete it focuses the first invalid field by hand; RHF's shouldFocusError does that. The ASA, units and modifier cards (being reworked in catch-up Phase 19b) are live in here. ${STORE_NOTE}`}>
          <Ex.BookingDetailBodyExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="TextField" source="shared/ui/Field.tsx" usedIn={SW} stage="mobile" height={200}
          what="A labelled input with an optional hint tied by aria-describedby."
          replaceWith="shadcn Field + Input + Label"
          note="Adds aria-invalid, a field-bound error and a focus ring.">
          <Ex.TextFieldExample />
        </CatalogueRow>
        <CatalogueRow name="TextArea" source="shared/ui/Field.tsx" usedIn={SW} stage="mobile" height={200}
          what="A labelled multi-line field, used for notes and messages in sheets."
          replaceWith="shadcn Field + Textarea">
          <Ex.TextAreaExample />
        </CatalogueRow>
        <CatalogueRow name="FormError" source="shared/ui/Field.tsx" usedIn={SW} stage="mobile" height={200}
          what="A refused save in plain words, in the error tint, announced as an alert."
          replaceWith="shadcn FieldError (bound to the field by RHF)"
          note="Today it sits under the form, not under the field that caused it.">
          <Ex.FormErrorExample />
        </CatalogueRow>
      </LibraryGroup>

      <LibraryGroup id="daypicker">
        <CatalogueRow name="MonthGrid (LookbackDateSheet)" source="shared/calendar/MonthGrid.tsx" usedIn={M} stage="mobile" height={600}
          what="The Go to a date month in a bottom sheet: a dot marks a day with one of her Lists, with a month and year jump panel and full keyboard support."
          replaceWith="shadcn Calendar (react-day-picker)"
          note="Keeps the custom day content (dots). Adds grid roles; pass the demo clock's today and the bounds.">
          <Ex.MonthGridExample />
        </CatalogueRow>
        <CatalogueRow name="My calendar month grid" source="apps/mobile/screens/MyAvailabilityCalendarScreen.tsx" usedIn={M} stage="mobile" height={520}
          what="Her own month: each day is an AM over PM pair of half-blocks in the session's status, with previous and next month buttons."
          replaceWith="shadcn Calendar with a custom day renderer"
          note="Recreated: local to MyAvailabilityCalendarScreen.tsx (reads her real sessions). The library gives the grid and keyboard; the half-blocks stay ours.">
          <Ex.MyCalendarGridExample />
        </CatalogueRow>
        <CatalogueRow name="6-day date strip" source="apps/mobile/screens/AvailabilityScreen.tsx" usedIn={M} stage="mobile" height={200}
          what="Today and the next five days as buttons at the top of Find cover. A dot marks a day with a free session."
          replaceWith="react-day-picker (single week row) or ToggleGroup"
          note="Recreated: local to AvailabilityScreen.tsx. The free dot is colour only and today has no aria-current. The research map files it as Custom + ToggleGroup.">
          <Ex.DateStripExample />
        </CatalogueRow>
      </LibraryGroup>

      <LibraryGroup id="numberflow">
        <CatalogueRow name="useTickingValue" source="shared/capture/useTickingValue.ts" usedIn="Admin · Web" stage="mobile" height={220}
          what="A hook that rolls a figure to its new value over 320ms with a green flash, and jumps under reduced motion."
          replaceWith="NumberFlow"
          note="Not mounted on Mobile: the mobile surface's BookingTotal renders nothing, so this demo drives the hook directly. Keep the flash tint.">
          <Ex.TickingValueExample />
        </CatalogueRow>
      </LibraryGroup>

      <LibraryGroup id="motion">
        <CatalogueRow name="SlideStack" source="apps/mobile/components/SlideStack.tsx" usedIn={M} stage="mobile" height={420}
          what="The iOS-style stack: every layer stays mounted, the one behind parallaxes and dims, and an edge swipe from the left pops a layer."
          replaceWith="Custom on Motion (drag + AnimatePresence)"
          note="No library ships a stack navigator. The edge swipe is touch only (DevTools device mode). Add focus moves on push and pop.">
          <Ex.SlideStackExample />
        </CatalogueRow>
        <CatalogueRow name="SuccessOverlay" source="shared/ui/SuccessOverlay.tsx" usedIn={SW} stage="mobile" height={360}
          what="The full-surface success moment: blurred flood, the circle pops, the tick draws, a haptic fires. The owner hides it after 1050ms."
          replaceWith="Custom on Motion"
          note="AA's one standout moment: keep the choreography. iOS ignores navigator.vibrate.">
          <Ex.SuccessOverlayExample />
        </CatalogueRow>
        <CatalogueRow name="TickBadge" source="shared/ui/TickBadge.tsx" usedIn={SW} stage="mobile" height={200}
          what="The small completion tick on a success-tint circle; animated it draws and pulses, otherwise it sits still."
          replaceWith="Custom on Motion">
          <Ex.TickBadgeExample />
        </CatalogueRow>
        <CatalogueRow name="Collapsing masthead" source="shared/surface/SurfaceProvider.tsx" usedIn={M} stage="mobile" height={460}
          what="The Booking screen's large title folds into a 44px nav row once the column scrolls past 24px, iOS large-title style."
          replaceWith="Custom on Motion (scroll-driven)"
          note="The fold is the real MobileBookingLayout; the masthead handed to it is recreated from BookingDetailScreen.tsx, where it is local.">
          <Ex.CollapsingMastheadExample />
        </CatalogueRow>
        <CatalogueRow name="TimesCard" source="shared/capture/TimesCard.tsx" usedIn={SW} stage="mobile" height={340}
          what="Start and Finish as one travelling teal action: Start now stamps the demo clock and slides across to become Finish now, revealing the stamp and its nudges."
          replaceWith="shadcn Card + Button, travel on Motion (layout)"
          note={STORE_NOTE}>
          <Ex.TimesCardExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="CompleteBar" source="shared/capture/CompleteBar.tsx" usedIn={SW} stage="mobile" height={180}
          what="The Booking's Mark complete button, which becomes a green success bar with Amend while the List is still open."
          replaceWith="shadcn Button; success state custom on Motion"
          note="Local state only here: no Booking is completed.">
          <Ex.CompleteBarExample />
        </CatalogueRow>
      </LibraryGroup>

      <LibraryGroup id="custom">
        <CatalogueRow name="ProcedureStack" source="shared/booking/ProcedureStack.tsx" usedIn={SW} stage="mobile" height={520} what="One Procedure's procedure text, invoice description, Contract and RVG code on every Booking screen, Admin Review and the List drawer, in full or compact density; still-to-choose parts are neutral and dashed." replaceWith="Custom (a description list on library primitives)" note="Fixed example views; nothing writes to the demo data.">
          <ProcedureStackExample layout="stacked" />
        </CatalogueRow>
        <CatalogueRow name="PayerDetailsView" source="shared/booking/PayerDetailsView.tsx" usedIn={SW} stage="mobile" height={640} what="The payer on the Booking (catch-up Phase 21): the name with Patient or the relationship, the email and the NZ Post postal address, and the warning-tint Email or postal address needed and Under 18 chips." replaceWith="Custom (text rows and the shared Pill)" note="Fixed example details; nothing writes to the demo data.">
          <PayerDetailsExample />
        </CatalogueRow>
        <CatalogueRow name="PayerFields (DifferentPayerTick, OtherPayerFields, PostalAddressFields)" source="shared/flows/PayerFields.tsx, PostalAddressFields.tsx" usedIn={SW} stage="mobile" height={640} what="The payer form's parts, in PayerSheet and the add forms: the Different payer tick, then the other payer's name, relationship chips, email, NZ Post postal address and phone." replaceWith="shadcn Checkbox card, ToggleGroup and Input" note="Local state only; nothing writes to the demo data.">
          <PayerFieldsExample />
        </CatalogueRow>
        <CatalogueRow name="FunderDetailsView" source="shared/booking/FunderDetailsView.tsx" usedIn={SW} stage="mobile" height={520} what="The Booking's insurer or funder and its approval number (catch-up Phase 21): None, the patient pays; an insurer with its number; an insurer with no number (the warning-tint chip); a funder with none. FunderSheet edits it with radio chips." replaceWith="Custom (text rows and the shared Pill)" note="Fixed example details; nothing writes to the demo data.">
          <FunderDetailsExample />
        </CatalogueRow>
        <CatalogueRow name="BottomTabBar" source="apps/mobile/MobileApp.tsx" usedIn={M} stage="mobile" height={220}
          what="The four-tab bar at the foot of the phone: Lists, Availability, Balances, More, frosted, hidden once you drill in."
          replaceWith="Custom nav of links with aria-current"
          note="Recreated: local to MobileApp.tsx. Today plain buttons, active by colour only, not a nav.">
          <Ex.BottomTabBarExample />
        </CatalogueRow>
        <CatalogueRow name="MobileHeader" source="apps/mobile/components/MobileHeader.tsx" usedIn={M} stage="mobile" height={140}
          what="The tab-screen header: micro-caps eyebrow, large title and the persona avatar."
          replaceWith="Custom (keep), title as a real h1"
          note="The large title is a div, so the screen has no heading.">
          <Ex.MobileHeaderExample />
        </CatalogueRow>
        <CatalogueRow name="ListRow" source="shared/schedule/ListRow.tsx" usedIn={SW} stage="mobile" height={460}
          what="A session row on the Lists home: status rail, session and time, title, and a right-hand cluster (progress, count, chip). Open and closed sessions take the status fill."
          replaceWith="Custom on shadcn Item / Card (status rail stays ours)"
          note="First two rows are her real upcoming Lists.">
          <Ex.ListRowExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="Sticky submit dock" source="apps/mobile/screens/ListDetailScreen.tsx" usedIn={M} stage="mobile" height={260}
          what="The frosted footer on a List: greyed with what is left, teal Mark list completed, green Submitted to office, or locked once authorised."
          replaceWith="Custom fixed footer with shadcn Button inside"
          note="Recreated: local to ListDetailScreen.tsx. Switch the four states with the control.">
          <Ex.SubmitDockExample />
        </CatalogueRow>
        <CatalogueRow name="DockSpacer" source="shared/ui/DockSpacer.tsx" usedIn={M} stage="mobile" height={340}
          what="An in-flow spacer at the tail of a scroller so the last item clears the frosted dock or tab bar. Trailing padding creates no scroll room on WebKit."
          replaceWith="Custom (keep; part of the inset contract)"
          note="Invisible in the app; outlined here so you can see it.">
          <Ex.DockSpacerExample />
        </CatalogueRow>
        <CatalogueRow name="Colleague AM / PM cells" source="apps/mobile/screens/AvailabilityScreen.tsx" usedIn={M} stage="mobile" height={460}
          what="Each colleague's card on Find cover with an AM and a PM cell in that session's status. A free cell her List could move into becomes a button."
          replaceWith="Custom status cells + shadcn Tooltip"
          note="Recreated: local to AvailabilityScreen.tsx (today's real sessions). Hatched and dashed fills are domain visuals.">
          <Ex.ColleagueCellsExample />
        </CatalogueRow>
        <CatalogueRow name="HalfBlock" source="apps/mobile/screens/MyAvailabilityCalendarScreen.tsx" usedIn={M} stage="mobile" height={200}
          what="One session's bar in the month grid: the status fill (or the List's), a repeat glyph for a series and an amber ! for a flag."
          replaceWith="Custom + shadcn Tooltip"
          note="Recreated: local to MyAvailabilityCalendarScreen.tsx. Its title never shows on touch.">
          <Ex.HalfBlockExample />
        </CatalogueRow>
        <CatalogueRow name="WarningTriangle" source="shared/warnings/WarningTriangle.tsx" usedIn={SW} stage="mobile" height={240}
          what="The small marker on a Booking with a warning: a disc in the strongest open warning's colour, with the count when more than one."
          replaceWith="Custom + shadcn Tooltip"
          note="The text lives in title only; a Tooltip makes it reachable by keyboard.">
          <Ex.WarningTriangleExample picks={picks} />
        </CatalogueRow>
        <CatalogueRow name="OutOfHoursMoon" source="shared/schedule/OutOfHoursMark.tsx" usedIn={SW} stage="mobile" height={140}
          what="The moon that stands in the session column where an AM or PM List shows its session."
          replaceWith="Custom (lucide icon, keep)">
          <Ex.OutOfHoursMoonExample />
        </CatalogueRow>
      </LibraryGroup>
    </CataloguePage>
  )
}
