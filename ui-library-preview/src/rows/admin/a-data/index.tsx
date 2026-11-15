import type { SliceReplacements } from '../../registry'
import { AuditViewerReplacement } from './AuditViewer'
import { ContractPanelReplacement } from './ContractPanel'
import { DateFieldReplacement, FormErrorReplacement, TextAreaReplacement, TextFieldReplacement } from './Fields'
import { HospitalCalendarReplacement } from './HospitalCalendar'
import { ContractPriceRangesReplacement } from './PriceRanges'
import { ReviewQueueReplacement } from './ReviewQueue'
import { AnatomyAutocompleteReplacement, RvgGroupsViewReplacement } from './RvgGroups'
import { SessionTimesReplacement } from './SessionTimes'
import { SlotStatusSheetReplacement } from './SlotStatus'

export const replacements: SliceReplacements = {
  'ReviewQueue (clickable rows)': {
    options: [
      {
        label: 'Whole row opens (as today, now keyboard reachable)',
        Component: () => <ReviewQueueReplacement rowOpens />,
        note: 'Each row is a Tab stop; Enter or Space opens it, as a click does. The Review button stays.',
      },
      {
        label: 'Review button only',
        Component: () => <ReviewQueueReplacement rowOpens={false} />,
        note: 'Rows are plain table rows (no hover, no click); only the Review button opens the List, one Tab stop per row.',
      },
    ],
    library: 'TanStack Table v9 (core row model) + shadcn Table, Badge + Tooltip, Button link',
    changes: [
      'Adds keyboard access to the row open (tabIndex, Enter and Space, a visible teal focus); today rows are mouse only',
      'Changes the changed-since-submitted pill to an outline Badge whose title text is a real Tooltip (focusable)',
      'Keeps the columns, order, booking counts, submit time and the Recently billed panel; Open and View invoices are stubbed',
      'Loses the hand-written cell and head style objects: one shadcn Table',
    ],
    status: 'built',
  },
  'RvgGroupsView (grouped rows)': {
    options: [
      {
        label: 'Heading rows (as today)',
        Component: () => <RvgGroupsViewReplacement />,
        note: 'Each anatomy heading is a plain label row above its groups.',
      },
      {
        label: 'Collapsible headings',
        Component: () => <RvgGroupsViewReplacement collapsible />,
        note: 'Each heading is a disclosure button (aria-expanded) with its row count; TanStack row expanding hides or shows its groups.',
      },
    ],
    library: 'TanStack Table v9 (column grouping + row expanding) + shadcn Table, Select, ToggleGroup, Dialog, Base UI Autocomplete, RHF + Zod',
    changes: [
      'Changes the hand-built colSpan heading rows to TanStack grouped rows (grouped by anatomy heading, in guide order)',
      'Changes the anatomy filter to shadcn Select and Active / All to a teal ToggleGroup; search keeps the prototype searchRvgGroups',
      'Changes Add and Edit to a Dialog on React Hook Form + Zod (the model rvgGroupRefusal as the refinement), errors under each field',
      'Keeps add, edit, retire and restore live on a local copy (never the store); History is stubbed',
      'Keeps the RVG time rule card above the table as a plain static stand-in (read only, as today; not rebuilt on library parts beyond Table)',
    ],
    status: 'partial',
  },
  AuditViewer: {
    options: [
      {
        label: 'Virtualised, every row',
        Component: () => <AuditViewerReplacement paging="virtual" />,
        note: 'All matching entries in one scrolling table; TanStack Virtual draws only the rows in view (spacer rows keep real table markup).',
      },
      {
        label: 'Pages of 50',
        Component: () => <AuditViewerReplacement paging="pages" />,
        note: 'TanStack pagination: 50 entries a page with Newer and Older, newest first.',
      },
    ],
    library: 'TanStack Table v9 (+ pagination) + TanStack Virtual + shadcn Table, Select, Date Picker (range)',
    changes: [
      'Loses the 500-row cap and its "showing the 500 most recent" line: every match is reachable',
      'Changes the From and To date inputs to one range picker (two-month Calendar, Clear, bounded by the earliest entry and today)',
      'Changes the two native selects to shadcn Select (same options, lower-case as today)',
      'Keeps the audit narrative: action label over its code, Role · source, entity name and the compact change line',
    ],
    status: 'built',
  },
  TextField: {
    Component: TextFieldReplacement,
    library: 'shadcn Field + Input, React Hook Form + Zod',
    changes: [
      'Keeps the 48px field on the bg colour, the uppercase eyebrow label, the mono variant and the hint line (now FieldDescription)',
      'Adds aria-invalid and a field-bound FieldError (shown here as a required Name, checked when the field is left)',
      'Adds a visible teal focus ring',
      'Changes the wrapping label to an explicit label for= id pair',
    ],
    status: 'built',
  },
  TextArea: {
    options: [
      {
        label: 'Fixed height (as today)',
        Component: () => <TextAreaReplacement />,
        note: 'The 72px box scrolls once the text is longer.',
      },
      {
        label: 'Grows with the text (shadcn default)',
        Component: () => <TextAreaReplacement grow />,
        note: 'field-sizing: content, capped at 200px: the box grows line by line as you type.',
      },
    ],
    library: 'shadcn Field + Textarea',
    changes: ['Keeps the label, placeholder, blur handler and the 72px minimum, resize off', 'Adds a visible teal focus ring and aria-invalid styling'],
    status: 'built',
  },
  'FieldLabel / FormError': {
    options: [
      {
        label: 'Error box under the form (as today)',
        Component: () => <FormErrorReplacement placement="form" />,
        note: 'The error-tint box under the button, now tied to the field with aria-describedby; checked on Validate only.',
      },
      {
        label: 'Error under the field (FieldError)',
        Component: () => <FormErrorReplacement placement="field" />,
        note: 'The message sits under its field in error text and the label turns red; after the first Validate it rechecks as you type.',
      },
    ],
    library: 'shadcn FieldLabel + FieldError, React Hook Form + Zod',
    changes: [
      'Changes the rule from an inline regex in the click handler to a Zod schema (same sentence)',
      'Adds aria-invalid on the field and links the message to it',
      'Keeps FieldLabel as the 11px uppercase mist eyebrow and the pill Validate button',
    ],
    status: 'built',
  },
  'ContractPanel (ContractEditSheet)': {
    options: [
      {
        label: 'Refusal in one box (as today)',
        Component: () => <ContractPanelReplacement refusals="form" />,
        note: "The model's refusal sentence shows in the error box at the foot of the panel.",
      },
      {
        label: 'Refusal under its field',
        Component: () => <ContractPanelReplacement refusals="field" />,
        note: 'Refusals that name a field (name, AA code, holder, rate, discount, links, first price) show under it; the rest stay in the box.',
      },
    ],
    library: 'shadcn Sheet + Field + Select + ToggleGroup + Combobox (chips), React Hook Form + Zod, Base UI NumberField',
    changes: [
      "Changes validation to a Zod refinement running the model's own contractRefusal, so every rule and sentence is unchanged",
      'Changes native selects to shadcn Select (the holder grouped by Party kind) and the surgeon and specialty pickers to one chips Combobox',
      'Adds the Sheet focus trap, scroll lock and focus return; keeps the corner X, Escape and scrim close',
      'Keeps every section and the live "where it is offered" line; save, disable and price ranges are local only',
      'Loses the default RVG code picker here (Choose is stubbed: CodePickerSheet is its own row) and the system Contract read-only view',
    ],
    status: 'partial',
  },
  SlotStatusSheet: {
    options: [
      {
        label: 'Issues listed above Save (as today)',
        Component: () => <SlotStatusSheetReplacement issues="list" />,
        note: "Every unmet rule is a bullet above the disabled Save, as soon as anything is typed.",
      },
      {
        label: 'Each issue under its field',
        Component: () => <SlotStatusSheetReplacement issues="field" />,
        note: 'Each sentence shows under the field it is about (label, long label, description, default) once that field changes.',
      },
    ],
    library: 'shadcn Dialog + Field + ToggleGroup (swatches, fill) + Checkbox + Badge, React Hook Form + Zod',
    changes: [
      "Keeps the prototype validator (validateSlotStatusDraft) as the Zod refinement: same rules, same sentences, checked as you type",
      'Changes the six colour swatches and the Fill choice to ToggleGroups: radio semantics, arrow keys, one Tab stop each',
      'Changes the flags to shadcn Checkbox and the preview chip to the status Badge (the session block keeps the token fills)',
      'Adds the Dialog focus trap and focus return; saving is local only',
    ],
    status: 'built',
  },
  ContractPriceRanges: {
    Component: ContractPriceRangesReplacement,
    library: 'TanStack Table v9 (cell edit) + shadcn Table, Base UI NumberField, Date Picker',
    changes: [
      'Keeps Enter saves and Escape cancels the row (not the panel), focus back on Edit, and Delete disabled on the last range',
      'Changes the price to Base UI NumberField: two decimals, $ before it, arrow keys step a dollar (Shift for ten)',
      'Changes the start to the Date Picker (keys inside its calendar stay in the calendar)',
      "Keeps the model's rules and sentences (validatePriceRanges, deleteRangeRefusal) on a local copy: nothing reaches the store",
    ],
    status: 'built',
  },
  HospitalCalendar: {
    Component: HospitalCalendarReplacement,
    library: 'shadcn Calendar (react-day-picker 10, custom DayButton) + Select + Dialog + Date Picker',
    changes: [
      'Changes the hand-built grid to DayPicker: a real grid with arrow, Home/End and Page Up/Down keys, Monday first',
      'Keeps the day anatomy (numeral, holiday-tint closure block, List count, flagged count) and the horizon bounds',
      'Changes the hospital select to shadcn Select and HolidaySheet to a Dialog (add, change, delete with confirm)',
      'Keeps the page header and the List / Calendar switch (a teal ToggleGroup), opening on List as today; holiday chips read "Mon 26 Oct 2026" rather than ISO',
      'Keeps holidays as a local copy: add, change and delete never reach the store',
      'Leaves out the Add hospital and Edit hospital sheets (both only report here)',
    ],
    status: 'partial',
  },
  'Native date input (TextField type=date)': {
    options: [
      {
        label: 'Type or pick (closest to today)',
        Component: () => <DateFieldReplacement typed />,
        note: 'A text field showing "Tue 21 Jul 2026" that also takes 21/07/2026 or 21 Jul 2026, with the calendar on its icon.',
      },
      {
        label: 'Button opens the calendar (shadcn)',
        Component: () => <DateFieldReplacement typed={false} />,
        note: "shadcn's Date Picker: the field is a button showing the day; the date is only picked from the calendar.",
      },
    ],
    library: 'shadcn Date Picker (Popover + Calendar, react-day-picker 10)',
    changes: [
      'Changes the browser picker to the branded Calendar: the same look in every browser, Monday first',
      "Adds today from the demo clock and the schedule horizon as bounds (days outside are disabled)",
      'Changes the shown format to "Tue 21 Jul 2026" in both options (ISO stays only in the value), not the browser locale',
    ],
    status: 'built',
  },
  SessionTimesFields: {
    options: [
      {
        label: 'Browser time input (as today)',
        Component: () => <SessionTimesReplacement control="native" />,
        note: "The browser's own time control inside the kit Input: neither Base UI nor react-day-picker has a time field.",
      },
      {
        label: 'Typed time, quarter-hour suggestions',
        Component: () => <SessionTimesReplacement control="typed" />,
        note: 'A text field taking HH:MM, suggesting every quarter hour from 06:00 to 21:00 (Base UI Autocomplete); the same check applies.',
      },
    ],
    library: 'shadcn Field + Input (type=time), or Base UI Autocomplete',
    changes: [
      'Keeps the default or own-times hint, Use default and the prototype timesDraftError sentence',
      'Adds aria-invalid on both times and ties the error to them',
      'Loses nothing yet: React Aria TimeField (the research pick) is not installed, so the native control stays in option 1',
    ],
    status: 'built',
  },
  'RVG anatomy datalist': {
    options: [
      {
        label: 'Suggestion list (as the datalist)',
        Component: () => <AnatomyAutocompleteReplacement mode="list" />,
        note: 'The headings filter as you type; arrows and Enter pick one; any other text is kept as a new heading.',
      },
      {
        label: 'Inline completion',
        Component: () => <AnatomyAutocompleteReplacement mode="both" />,
        note: 'As well as the list, the highlighted heading completes inline in the field as you arrow through it.',
      },
    ],
    library: 'Base UI Autocomplete',
    changes: [
      'Changes the browser datalist to a branded popup: same look in every browser, filtered as you type',
      'Adds combobox and listbox roles, arrow keys, Enter to pick, Escape to close',
      'Keeps free text: a heading not on the list is kept as a new heading',
    ],
    status: 'built',
  },
}
