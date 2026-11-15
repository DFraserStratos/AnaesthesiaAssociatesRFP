import type { SliceReplacements } from '../../registry'
import { AddAttachmentReplacement } from './AddAttachment'
import { AlertOfficeReplacement } from './AlertOffice'
import { AvailabilityEditorReplacement } from './AvailabilityEditor'
import { CodePickerReplacement } from './CodePicker'
import { MovedToYouReplacement } from './MovedToYou'
import { OverrideCardReplacement } from './OverrideCard'
import { ProcedureCodeCardReplacement } from './ProcedureCodeCard'
import { ResultLineReplacement } from './ResultLine'
import { NameSearchBoxReplacement, WebSearchFieldReplacement } from './SearchBox'
import { SeriesListReplacement } from './SeriesList'
import { SubmitListSheetReplacement } from './SubmitListSheet'
import { TimesCardReplacement } from './TimesCard'
import { UnitsCardReplacement } from './UnitsCard'
import { WhichListDialog } from './WhichListDialog'

export const replacements: SliceReplacements = {
  'Dialog (web Overlay)': {
    options: [
      { label: 'No corner X (as today)', Component: () => <WhichListDialog /> },
      {
        label: 'Corner X (shadcn default)',
        Component: () => <WhichListDialog closeX />,
        note: 'Adds a ghost close button top right: a second close target beside Escape and the scrim.',
      },
    ],
    library: 'shadcn Dialog (Base UI Dialog)',
    changes: [
      'Adds a focus trap, initial focus on the first List, focus returned to the trigger and scroll lock',
      'Adds aria-labelledby and aria-describedby from the title and line',
      'Keeps Escape and scrim click to close; nested dialogs stack natively, retiring OPEN_DIALOGS',
      'Keeps the Which List? content: date and session mono, hospital, surgeon, read from the store',
    ],
    status: 'built',
  },
  SubmitListSheet: {
    Component: SubmitListSheetReplacement,
    library: 'shadcn Dialog (blockers) + shadcn AlertDialog (confirm)',
    changes: [
      'Keeps blockers mode as a Dialog with the same rows, messages and Close, read from completionBlockersFor',
      'Changes confirm mode to an AlertDialog: no scrim dismiss, focus starts on Not yet',
      'Adds the confirm step to this row (the current example shows blockers only); submitting is local here',
      'Changes the blocker cards to a real list (ul and li)',
    ],
    status: 'built',
  },
  'AddAttachmentButton · AddAttachmentSheet': {
    Component: AddAttachmentReplacement,
    library: 'shadcn Button (link) + shadcn Dialog; Badge (warning) for the demo badge',
    changes: [
      'Changes the hand-styled text button to Button link with the paperclip icon',
      'Changes each sample row to an outline Button with an accessible name ("Attach Booking card")',
      'Adds the Dialog focus trap, Escape and focus restore; picking still attaches and closes at once',
      'Keeps the simulated picker and its badge; attaching is local, not a store write',
    ],
    status: 'built',
  },
  WebSearchField: {
    Component: WebSearchFieldReplacement,
    library: 'shadcn Input Group (one SearchBox shared with NameSearchBox)',
    changes: [
      'Changes three search inputs into one SearchBox with pill, wide and field sizes',
      'Changes type=search to a text input with role=searchbox, so only one clear button shows',
      'Adds Escape clears the text first (NameSearchBox behaviour) and focus stays after Clear',
      'Keeps the 280px pill, the leading icon and the placeholder',
    ],
    status: 'built',
  },
  NameSearchBox: {
    Component: NameSearchBoxReplacement,
    library: 'shadcn Input Group (one SearchBox shared with WebSearchField)',
    changes: [
      'Keeps both sizes: the 36px pill and the 48px field, shown together here instead of a size switch',
      'Keeps Escape clears first (stopped, so a sheet around it stays open) and the round sunken clear',
      'Changes the focus ring from inline focus state to the kit focus-visible ring',
      'Loses the separate focused state handling: the group styles itself from the input focus',
    ],
    status: 'built',
  },
  MovedToYouPanel: {
    Component: MovedToYouReplacement,
    library: 'shadcn Alert (as a labelled region)',
    changes: [
      'Changes the hand-built section to an Alert with role=region and an aria-label, not role=alert, since it needs no action',
      'Changes the notices to a list, each still a button with a chevron when it opens something',
      'Keeps the store reads and the line helpers (movedToYouLine, movedBookingToYouLine)',
      'Adds a local preview of two notices from her own Lists, because the seed has none to show',
    ],
    status: 'built',
  },
  SeriesList: {
    options: [
      {
        label: 'Inline confirm (as today)',
        Component: () => <SeriesListReplacement confirm="inline" />,
        note: 'Delete opens the are-you-sure step inside the card: Delete the series or Keep it.',
      },
      {
        label: 'AlertDialog confirm',
        Component: () => <SeriesListReplacement confirm="dialog" />,
        note: 'Delete opens an AlertDialog that names the series; focus starts on Keep it and Escape keeps it.',
      },
    ],
    library: 'shadcn Card + shadcn AlertDialog (Base UI)',
    changes: [
      'Changes each series to a Card in a labelled list, Delete as a Button link with its accessible name',
      'Adds an AlertDialog confirm (option) with a focus trap and a safe default',
      'Keeps the consequence copy and the teal result line; deleting is local here',
      'Adds two sample series worded by seriesLine, because the seed has none to show',
    ],
    status: 'built',
  },
  CodePickerSheet: {
    options: [
      {
        label: 'No corner X, Escape clears first (as today)',
        Component: () => <CodePickerReplacement />,
        note: 'The first Escape clears a typed search; the next closes the dialog.',
      },
      {
        label: 'Corner X (shadcn default)',
        Component: () => <CodePickerReplacement closeX />,
        note: 'Adds a visible close button top right; Escape still clears the search first.',
      },
      {
        label: 'Escape closes at once (library default)',
        Component: () => <CodePickerReplacement escapeClearsFirst={false} />,
        note: 'Escape closes the dialog even with text typed; the clear button still empties the search.',
      },
    ],
    library: 'Base UI Combobox (inline) in shadcn Dialog + TanStack Virtual',
    changes: [
      'Adds combobox and listbox roles, arrow, Home/End and Enter selection, first match highlighted',
      'Adds virtualised rows: only the rows in view render',
      'Keeps the prototype search (searchRvgGroups), the 12-row default list and the teal current row',
      'Keeps the same build as the Admin pilot row, made controllable for ProcedureCodeCard',
    ],
    status: 'built',
  },
  ProcedureCodeCard: {
    Component: ProcedureCodeCardReplacement,
    library: 'shadcn Card + Button (outline, link) + Base UI NumberField; picker as CodePickerSheet',
    changes: [
      'Changes the ranged base value from a tap-to-type button to a NumberField spinbutton: type, arrows or the steppers',
      'Adds named steppers ("Fewer base units", "More base units") and the floor of 0 from the field',
      'Keeps baseUnitsFor for the value and caption, and the warning Alert outside the guide',
      'Keeps Choose / Change / Clear; picks are local and clear a chosen value as pickRvgGroup does',
    ],
    status: 'built',
  },
  TimesCard: {
    Component: TimesCardReplacement,
    library: 'shadcn Card + Button + Button Group',
    changes: [
      'Changes the −5 / +5 nudges to a Button Group with names ("Start 5 minutes earlier")',
      'Keeps the one travelling Start now / Finish now action and its slide, and the 5-minute rules',
      'Keeps the demo clock as the time source; stamps are local here',
      'Shows the compact web layout only (the phone layout is the mobile catalogue)',
    ],
    status: 'built',
  },
  UnitsCard: {
    options: [
      {
        label: 'Named buttons (as today)',
        Component: () => <UnitsCardReplacement stepper="buttons" />,
        note: 'Minus, value, plus as today, now with names ("Fewer base units") and the value announced politely.',
      },
      {
        label: 'Spinbutton (Base UI NumberField)',
        Component: () => <UnitsCardReplacement stepper="spinbutton" />,
        note: 'The value is a spinbutton: type a number or use the arrow keys as well as the steppers.',
      },
    ],
    library: 'shadcn Card + Button (outline icon), or Base UI NumberField; Tooltip for the T caption',
    changes: [
      'Adds names to every stepper ("Fewer time units"); today they announce only minus or plus',
      'Changes the T caption title attribute to a Tooltip, reachable by keyboard',
      'Keeps the fee calculator (procedureFee) for values, provenance and "Use seeded value"; steps are local',
      'Keeps the itemised modifiers list (ModifiersSection) as a plain static stand-in; leaves out its picker, and Add and Remove only report',
    ],
    status: 'partial',
  },
  ResultLine: {
    options: [
      {
        label: 'Keep inline (shadcn Alert)',
        Component: () => <ResultLineReplacement style="inline" />,
        note: 'The teal-tint line stays in the form as an Alert with role=status; no toast library needed.',
      },
      {
        label: 'Teal-tint toast',
        Component: () => <ResultLineReplacement style="teal-toast" />,
        note: 'A Sonner toast in the old line colours; auto-dismisses after 6 seconds.',
      },
      {
        label: 'Neutral toast',
        Component: () => <ResultLineReplacement style="neutral-toast" />,
        note: 'The kit toast: surface card, ink text; auto-dismisses after 6 seconds.',
      },
    ],
    library: 'Sonner toast (via shadcn Toaster), or shadcn Alert',
    changes: [
      'Changes the confirmation to a toast that announces politely and auto-dismisses (toast options)',
      'Keeps refusals inline in the form (FormError, role=alert), never a toast',
      'Keeps the copy and the role=status announcement',
      'Adds one place to confirm a List submit on the web, which has no feedback today',
    ],
    status: 'built',
  },
  AvailabilityEditor: {
    options: [
      {
        label: 'Native date inputs (as today)',
        Component: () => <AvailabilityEditorReplacement dates="native" />,
        note: 'From, To, Starts and Until stay the browser date input with the same min and max.',
      },
      {
        label: 'Calendar popover',
        Component: () => <AvailabilityEditorReplacement dates="calendar" />,
        note: 'Each date opens the kit Calendar in a Popover, days outside today to the horizon disabled.',
      },
    ],
    library: 'React Hook Form + Zod + shadcn Field, ToggleGroup, Toggle, Card, AlertDialog; Popover + Calendar (option)',
    changes: [
      'Changes hand-rolled state to one form with a Zod schema: dates in the horizon, To after From, a weekday when repeating',
      'Changes the status chips, sessions, repeat and weekdays to ToggleGroups (radio or multiple), quick spans to Toggles',
      'Changes Delete the series in the session panel to an AlertDialog',
      'Keeps the live session panel and the result wording (describeAvailabilityOutcome); saving is local',
      'Loses the move-List-first prompt on a closed status (saves never reach the store here)',
    ],
    status: 'partial',
  },
  AlertOfficeEntry: {
    Component: AlertOfficeReplacement,
    library: 'shadcn Dialog + Field + Textarea + Alert, React Hook Form + Zod',
    changes: [
      'Changes the note to a form with a Zod rule: required, trimmed, at most 300 characters, the count tied by aria-describedby',
      'Changes the open and dealt-with states to Alerts (neutral and success) with role=status',
      'Keeps the TickBadge (stays custom) and the Send, Done flow; sending is local to this row',
      'Adds the Dialog focus trap, initial focus on the note and focus restore',
    ],
    status: 'built',
  },
  OverrideCard: {
    options: [
      {
        label: 'Save disabled until valid (as today)',
        Component: () => <OverrideCardReplacement validation="disabled" />,
        note: 'Save stays disabled until the amount and reason are valid and something changed; the reason caption shows while it is empty.',
      },
      {
        label: 'Errors on Save (RHF default)',
        Component: () => <OverrideCardReplacement validation="submit" />,
        note: 'Save is live once something changed; pressing it shows each field error and focuses the first.',
      },
    ],
    library: 'Base UI NumberField + shadcn Field, ToggleGroup, Input, Card; React Hook Form + Zod',
    changes: [
      'Changes the amount from a free text field to a NumberField: two decimals, arrow keys, a charge cannot go below 0',
      'Changes the rules to one Zod schema (charge above $0, adjustment not $0, reason required)',
      'Changes None / Adjustment / Charge to a radio ToggleGroup (teal segmented)',
      'Keeps the office percentage and read-only states; saving is local',
    ],
    status: 'built',
  },
}
