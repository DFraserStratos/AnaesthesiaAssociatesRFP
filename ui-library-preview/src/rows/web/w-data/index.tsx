import type { SliceReplacements } from '../../registry'
import { AccountsReplacement } from './AccountsTables'
import { AgingBarsReplacement } from './AgingBars'
import { AttachmentStripReplacement } from './AttachmentStrip'
import { AvailabilityCellReplacement, AvailabilityGridReplacement } from './AvailabilityGrid'
import { AvailabilityMonthReplacement } from './AvailabilityMonth'
import { BookingTotalReplacement } from './BookingTotal'
import { CompleteBarReplacement } from './CompleteBar'
import { GoToDateReplacement } from './GoToDate'
import { HistoryTimelineReplacement } from './HistoryTimeline'
import { ListDetailBookingsReplacement } from './ListDetailBookings'
import { ListInvoicesReplacement } from './ListInvoices'
import { ListsTableReplacement } from './ListsTable'
import { DayTableReplacement, ResultsTableReplacement } from './LookbackTables'
import { TickBadgeReplacement } from './TickBadge'
import { WeekStripReplacement } from './WeekStrip'

/** The two ways a table row can open, shared by the four clickable tables. */
const BUTTON_NOTE = 'The row click stays for the mouse; one cell holds a real button, the keyboard handle.'
const ROW_NOTE = 'Each row is one tab stop with a teal focus bar; Enter or Space opens it. No inner button.'

export const replacements: SliceReplacements = {
  'Lists table (Th · Td · GroupRow)': {
    options: [
      { label: 'Date button opens (as today)', Component: () => <ListsTableReplacement />, note: BUTTON_NOTE },
      { label: 'Whole row focusable', Component: () => <ListsTableReplacement openMode="row" />, note: ROW_NOTE },
    ],
    library: 'TanStack Table v9 (core row model) + shadcn Table; status and progress on shadcn Badge',
    changes: [
      'Changes Th, Td and GroupRow (copied in four screens) to one shared DataTable over a TanStack column model',
      'Keeps the Earlier, not yet authorised and From today group rows as th scope="colgroup"',
      'Keeps the same rows from mainViewFor, the status bar, Today marker and quieter submitted rows',
      'Keeps the toolbar: the shared search box and Go to date only report here (they are their own rows); To narrows the table',
    ],
    status: 'partial',
  },
  WebResultsTable: {
    options: [
      { label: 'Date button opens (as today)', Component: () => <ResultsTableReplacement />, note: BUTTON_NOTE },
      { label: 'Whole row focusable', Component: () => <ResultsTableReplacement openMode="row" />, note: ROW_NOTE },
    ],
    library: 'TanStack Table v9 + shadcn Table; search on shadcn InputGroup',
    changes: [
      'Changes the hand-written table to column definitions on the shared DataTable',
      'Keeps Upcoming then Past as group rows and the same useBookingSearch results',
      'Keeps the prototype WarningTriangle in the patient cell (it is its own row)',
      'Changes the search field to InputGroup with a clear button',
    ],
    status: 'built',
  },
  WebDayTable: {
    options: [
      { label: 'Session button opens (as today)', Component: () => <DayTableReplacement />, note: BUTTON_NOTE },
      { label: 'Whole row focusable', Component: () => <DayTableReplacement openMode="row" />, note: ROW_NOTE },
    ],
    library: 'TanStack Table v9 + shadcn Table; the day from shadcn Date Picker',
    changes: [
      'Changes the hand-written table to column definitions on the shared DataTable',
      'Keeps the same listsOnDayFor rows, status bar, Booking count and progress',
      'Changes the native date input above it to the bounded Date Picker (Popover + Calendar)',
    ],
    status: 'built',
  },
  'Accounts tables (tfoot totals)': {
    Component: AccountsReplacement,
    library: 'TanStack Table v9 + shadcn Table and TableFooter; sub-tabs on shadcn Tabs (line); GST period on ToggleGroup',
    changes: [
      'Adds row headers: each totals label is a th scope="row" in a real tfoot',
      'Adds Tabs semantics to the sub-nav (tablist, arrow keys between tabs)',
      'Keeps all four tables, their columns, empty lines and the GST period switch',
      'Changes the status pills to Badge success / neutral',
    ],
    status: 'built',
  },
  'List detail Bookings table': {
    options: [
      { label: 'Patient name button opens', Component: () => <ListDetailBookingsReplacement />, note: 'Adds a keyboard handle on the patient name (today the rows have none); the row click stays.' },
      { label: 'Whole row focusable', Component: () => <ListDetailBookingsReplacement openMode="row" />, note: ROW_NOTE },
    ],
    library: 'TanStack Table v9 + shadcn Table and TableFooter; Base UI Progress; shadcn Button and Badge',
    changes: [
      'Adds a keyboard way to open a Booking (none today)',
      'Changes the totals row from the body into a tfoot, its label a row header',
      'Changes the completion bar to Base UI Progress (progressbar role and value)',
      'Keeps Alert the office as a plain stand-in that only reports; leaves out Move, Submit, attachments and invoices; Add a booking only reports',
    ],
    status: 'partial',
  },
  ListInvoices: {
    options: [
      { label: 'Two-line list (as today)', Component: () => <ListInvoicesReplacement />, note: 'shadcn Item rows: number and who over when, total over paid state. Fits the phone too.' },
      { label: 'Table', Component: () => <ListInvoicesReplacement layout="table" />, note: 'A plain shadcn Table with Invoice, Sent to, Issued, Total and Paid columns; paid state as a Badge.' },
    ],
    library: 'shadcn Item (list) or shadcn Table (plain); shadcn Badge',
    changes: [
      'Keeps the same useListInvoices rows and paid wording',
      'Changes the ul of styled spans to Item or Table',
      'Adds column headers in the table option (the list has none today)',
    ],
    status: 'built',
  },
  WeekStrip: {
    Component: WeekStripReplacement,
    library: 'react-day-picker (one week of the month grid, custom Week and Day) + shadcn Tooltip and Button',
    changes: [
      'Adds grid and gridcell roles and aria-current="date" on today (today was colour only)',
      'Adds a Tooltip with the full label on every block (truncated labels had none)',
      'Keeps the AM and PM blocks, merged day off, out-of-hours block, crimson today outline and the ✓ on submitted Lists',
      'Changes week stepping to our own buttons: DayPicker pages by month only',
    ],
    status: 'built',
  },
  'My availability month grid (DayCell)': {
    options: [
      { label: 'Click, shift-click a range (as today)', Component: () => <AvailabilityMonthReplacement />, note: 'A click picks one day; shift-click extends from where the range began.' },
      { label: 'Click start, click end (DayPicker range)', Component: () => <AvailabilityMonthReplacement selectMode="range" />, note: 'react-day-picker range mode: first click starts the range, the next ends it, a third starts again. No shift key needed.' },
    ],
    library: 'shadcn Calendar (react-day-picker 10, range mode, custom DayButton)',
    changes: [
      'Adds a visible focus ring and DayPicker arrow, Home/End and Page Up/Down movement between days',
      'Keeps the AM and PM cells, today crimson, selection teal, past days faded and the this-month to horizon bounds',
      'Keeps the page header and the Find cover / My availability switch as plain static stand-ins (the switch changes page in the prototype)',
      'Leaves out the session editor and Your series in the rail (they write to the demo data); the rail reports the selection',
    ],
    status: 'partial',
  },
  WebGoToDate: {
    options: [
      { label: 'Month arrows only', Component: () => <GoToDateReplacement />, note: 'Arrows page a month at a time, stopping at her first and last month with work.' },
      { label: 'Month and year dropdowns', Component: () => <GoToDateReplacement dropdowns />, note: 'Selects jump straight to a month or year, useful for a long look back.' },
    ],
    library: 'shadcn Date Picker (Popover + Calendar)',
    changes: [
      'Changes the native date input to a Popover calendar with the same bounds (useLookbackBounds)',
      'Adds a Clear action in the popover (native inputs clear inline)',
      'Loses typing a date with the keyboard; arrows move by day inside the calendar instead',
    ],
    status: 'built',
  },
  'Receivables aging bars': {
    options: [
      { label: 'Bars only (as today)', Component: () => <AgingBarsReplacement />, note: 'Static bars, label left and amount right.' },
      { label: 'With hover tooltip', Component: () => <AgingBarsReplacement tooltip />, note: 'shadcn Chart tooltip on hover; the amounts are already printed, so it repeats them.' },
    ],
    library: 'Recharts bar chart (shadcn Chart)',
    changes: [
      'Adds a visually hidden table with the same figures (today the bars are bare spans)',
      'Keeps the four buckets, their colours, the sunken track and the total line',
      'Changes the bars to scale against the total on a Recharts number axis',
    ],
    status: 'built',
  },
  'BookingTotalPanel · useTickingValue': {
    options: [
      { label: 'Keep the tween (as today)', Component: () => <BookingTotalReplacement />, note: 'useTickingValue: a 320 ms rAF roll of the whole figure.' },
      { label: 'NumberFlow', Component: () => <BookingTotalReplacement engine="numberflow" />, note: 'Each digit spins to its new value over the same 320 ms; the flash is kept.' },
    ],
    library: 'NumberFlow (@number-flow/react), optional, on brand tokens',
    changes: [
      'Keeps the green flash on the fee and the reduced-motion jump with no flash',
      'Changes the figures to digit-by-digit rolls in the NumberFlow option',
      'Keeps the ink panel, breakdown lines, rate label and Needs a price text',
    ],
    status: 'built',
  },
  TickBadge: {
    Component: TickBadgeReplacement,
    library: 'Custom on Motion (motion/react)',
    changes: [
      'Changes the aa-tick-draw and aa-tick-pulse keyframes to Motion pathLength and scale',
      'Keeps the timings: draw 360 ms after 60 ms, pulse 1 to 1.04 to 1 over 420 ms, the tick curve',
      'Keeps reduced motion as an 80 ms fade, now read by useReducedMotion',
    ],
    status: 'custom',
    customReason: 'A brand micro-interaction: no library component; re-expressed on Motion.',
  },
  CompleteBar: {
    options: [
      { label: 'Bar swaps in (as today)', Component: () => <CompleteBarReplacement />, note: 'Mark complete is replaced by the done bar at once.' },
      { label: 'Check draws in', Component: () => <CompleteBarReplacement drawTick />, note: 'The done bar’s check plays the complete-tick draw (360 ms) as it appears.' },
    ],
    library: 'Custom on Motion, shadcn Button (cta) inside',
    changes: [
      'Changes Mark complete and Amend to shadcn Button (cta, link)',
      'Adds focus moving to Amend after completing and back to Mark complete after amending',
      'Adds role="status" on the done bar so the change is announced',
    ],
    status: 'custom',
    customReason: 'The footer control is product-specific; only its button and tick motion come from libraries.',
  },
  'Cell (AvailabilityGrid)': {
    options: [
      { label: 'Disabled cells skipped (as today)', Component: () => <AvailabilityCellReplacement />, note: 'Only an actionable cell is enabled; Tab skips the rest.' },
      { label: 'Every cell reachable', Component: () => <AvailabilityCellReplacement inert="reachable" />, note: 'Non-actionable cells are aria-disabled but focusable, with their full text in a Tooltip.' },
    ],
    library: 'Custom cell on status tokens + shadcn Tooltip',
    changes: [
      'Changes the native title hint to a Tooltip (shows on keyboard focus too)',
      'Keeps the fill, status bar, dashed free outline, two lines and Move here',
    ],
    status: 'custom',
    customReason: 'The session cell anatomy is ours; only its hint is a library part.',
  },
  AvailabilityGrid: {
    Component: AvailabilityGridReplacement,
    library: 'Custom ARIA grid (roving focus) on shadcn Button, InputGroup, Avatar, Badge and Tooltip',
    changes: [
      'Adds role="grid" with row headers and one roving tab stop: arrows, Home, End, Ctrl+Home/End',
      'Adds keyboard reach to every cell (non-actionable ones aria-disabled)',
      'Keeps the day stepper, All / Free only filters, name search, legend, Move and Move here',
      'Loses the page switch and Moved to you panel in this row; moves only report',
    ],
    status: 'custom',
    customReason: 'A two-axis people by sessions grid has no library equivalent; it is rebuilt on primitives.',
  },
  HistoryTimeline: {
    Component: HistoryTimelineReplacement,
    library: 'Custom ledger, coalesced steps on shadcn Collapsible (Base UI)',
    changes: [
      'Adds aria-expanded and aria-controls on Show the steps (Collapsible)',
      'Changes the ResizeObserver stacking to a CSS container query',
      'Keeps the day headings, suppressed repeat times, the count chip and the 260 ms sheet-curve expand',
    ],
    status: 'custom',
    customReason: 'The audit ledger layout is ours; only expand and collapse is a library job.',
  },
  AttachmentStrip: {
    options: [
      { label: 'Remove on hover or focus (as today)', Component: () => <AttachmentStripReplacement />, note: 'The control fades in on hover or keyboard focus and stays reachable by Tab.' },
      { label: 'Remove always shown', Component: () => <AttachmentStripReplacement reveal="always" />, note: 'The control shows on every thumbnail, as the phone draws it.' },
    ],
    library: 'Custom strip with shadcn Button, Tooltip and Alert',
    changes: [
      'Changes the remove control to a Button with a Tooltip (was a native title)',
      'Changes the refusal message to an Alert',
      'Adds list semantics to the thumbnails',
      'Loses a Dropzone: none is installed, so adding stays on the separate Add attachment flow',
    ],
    status: 'custom',
    customReason: 'Thumbnail strip is ours; a Dropzone would be the only library piece and is not installed.',
  },
}
