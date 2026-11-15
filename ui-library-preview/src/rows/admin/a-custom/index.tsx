import type { SliceReplacements } from '../../registry'
import { AnaesthetistCandidatesReplacement, DraftListCandidatesReplacement } from './Candidates'
import { DayGridReplacement } from './DayGrid'
import { DraftListBandReplacement } from './DraftListBand'
import { InvoiceDocumentReplacement } from './InvoiceDocument'
import { SuccessOverlayReplacement, TickBadgeReplacement } from './Motion'
import { PipelineStepperReplacement } from './PipelineStepper'
import { ReviewSummaryReplacement } from './ReviewSummary'
import { StatusBlockReplacement } from './StatusBlock'

export const replacements: SliceReplacements = {
  SuccessOverlay: {
    Component: SuccessOverlayReplacement,
    library: 'Motion (motion/react: motion, useReducedMotion) + shadcn Button',
    changes: [
      'Keeps the choreography: 200ms flood, 420ms circle pop, 360ms tick draw after 60ms, haptic at 200ms, 1050ms owner timer',
      'Changes the CSS keyframes to Motion tweens on the same tick curve; the tick draws with pathLength, not a dash offset',
      'Keeps the instant hide when the owner\'s timer ends (no exit animation added)',
      'Keeps the late-arming tap-anywhere Dismiss button and the role=status announcement',
      'Changes reduced motion to Motion\'s useReducedMotion (80ms, no delay), not the global CSS override',
    ],
    status: 'custom',
    customReason: 'AA\'s one standout moment: no library overlay carries this choreography, so it is re-expressed on Motion.',
  },
  TickBadge: {
    Component: TickBadgeReplacement,
    library: 'Motion (motion/react)',
    changes: [
      'Keeps the 24 and 36px sizes, the success tint and on-tint tick, and the still settled state',
      'Changes the draw and the 1 to 1.04 to 1 pulse from CSS keyframes to Motion animations on the same timings',
      'Adds reduced-motion handling inside the component (useReducedMotion)',
    ],
    status: 'custom',
    customReason: 'A two-element animated glyph; Motion replaces the keyframes, nothing library-shaped replaces the badge.',
  },
  DayGrid: {
    options: [
      {
        label: 'Tab through every block (as today)',
        Component: () => <DayGridReplacement keyboard="tab" />,
        note: 'Every block is its own Tab stop, as the prototype; blocks gain a Tooltip in place of the native title.',
      },
      {
        label: 'One Tab stop, arrow keys inside the grid',
        Component: () => <DayGridReplacement keyboard="grid" />,
        note: 'role=grid with roving focus: Left/Right along a row, Up/Down to the nearest block in time, Home/End to the row ends.',
      },
    ],
    library: 'Custom on primitives: ARIA grid roles, shadcn Tooltip (Base UI), Badge toggles, Button',
    changes: [
      'Adds grid, row, rowheader and gridcell roles and an accessible name per block (both lines plus the tooltip text)',
      'Changes block detail from the native title to a Base UI Tooltip that also opens on keyboard focus',
      'Changes the legend chips to pressed Badge toggles and the out-of-hours control to a revealed Button with a Tooltip',
      'Loses the real SlotDrawer and Draft List drawer: clicks are stubbed to the echo line (no store writes)',
      'Leaves TanStack Virtual out: ten rows here; it is the plan for the ~85-row production roster',
    ],
    status: 'custom',
    customReason: 'The scheduling canvas is a bespoke time ruler; it stays custom, rebuilt on library primitives.',
  },
  DraftListBand: {
    Component: DraftListBandReplacement,
    library: 'Custom on shadcn Tooltip (Base UI) + grid row roles',
    changes: [
      'Keeps the lanes, white body, strong border, warning left bar, UNASSIGNED caps line, waiting time and booking count',
      'Changes the block detail from the native title to a Tooltip that opens on hover and keyboard focus',
      'Adds row and rowheader roles so the band reads as the grid\'s first row',
      'Loses the real Draft List drawer: a click is stubbed to the echo line',
    ],
    status: 'custom',
    customReason: 'Blocks on the day ruler are layout, not a library component; only the Tooltip comes from the library.',
  },
  StatusBlock: {
    Component: StatusBlockReplacement,
    library: 'Custom on theme tokens; status picker is shadcn Select (Base UI)',
    changes: [
      'Keeps the three treatments: tint with 3px left bar, hatch over the tint, dashed outline',
      'Changes inline hex fills to the theme\'s status CSS variables and token classes (any token can take any treatment)',
      'Changes the example\'s native select to the branded Select (keyboard typeahead, check on the chosen item)',
    ],
    status: 'custom',
    customReason: 'A status cell renderer: no library equivalent; it moves onto the theme tokens.',
  },
  'Review summary tiles (ReviewScreen)': {
    options: [
      {
        label: 'Dialog confirm, scrim closes (as today)',
        Component: () => <ReviewSummaryReplacement confirm="dialog" />,
        note: 'The authorise confirm is a shadcn Dialog: Escape, the scrim or Cancel close it.',
      },
      {
        label: 'AlertDialog confirm (shadcn pattern)',
        Component: () => <ReviewSummaryReplacement confirm="alert" />,
        note: 'An AlertDialog: a click on the scrim does nothing; only Cancel or Escape back out of authorising.',
      },
    ],
    library: 'shadcn Card + Table + Badge + Breadcrumb + Dialog/AlertDialog + Tooltip (Base UI)',
    changes: [
      'Keeps every figure from the real calculators (procedureFee, bookingFee, reviewFlagsForBooking) on the seed\'s submitted List',
      'Changes the four tiles to Card, the table to shadcn Table with data-numeric figures, flags and pills to Badge, the trail to Breadcrumb',
      'Changes the RVG code and warning triangle titles to Tooltips; the phone note dialog to Dialog + Field + Textarea',
      'Loses the store write: Authorise and Log note are local only; History, Back to queue, queue and invoice links are stubbed',
      'Loses the Changed since submitted pill and per-row Changed marker (not rebuilt here)',
    ],
    status: 'partial',
  },
  'Billing pipeline stepper (PipelineCard)': {
    Component: PipelineStepperReplacement,
    library: 'shadcn Badge + Tooltip (Base UI)',
    changes: [
      'Keeps the four tones (done success, partial warning, failed error, pending neutral) and the arrows between stages',
      'Changes each chip to a Badge rendered as a button, with its detail in a Tooltip instead of the native title',
      'Adds an ordered list (ol) of stages so the order is announced',
    ],
    status: 'custom',
    customReason: 'A short sequence of status chips; Badge and Tooltip cover it, the stepper layout stays hand-built.',
  },
  InvoiceDocument: {
    Component: InvoiceDocumentReplacement,
    library: 'Custom print-styled page; shadcn Table, Card, Button, Badge for the chrome',
    changes: [
      'Keeps the document as a plain section with the aa-invoice-doc print class, serif masthead, mono money, logo as identity only',
      'Changes the lines to shadcn Table and the info rail cards to Card, its actions to Button and the simulated marker to Badge',
      'Loses the store write: Email invoice is local only (the rail shows Emailed at the demo clock time)',
      'Keeps Print as window.print()',
    ],
    status: 'custom',
    customReason: 'A print document must stay out of a fixed Dialog for print isolation; only its chrome moves to library parts.',
  },
  AnaesthetistCandidates: {
    Component: AnaesthetistCandidatesReplacement,
    library: 'Base UI Combobox (inline, Group/GroupLabel) + shadcn ToggleGroup, InputGroup, Badge',
    changes: [
      'Adds combobox and listbox roles: arrows, Home/End and Enter pick from the name box; the first match highlights as she types',
      'Keeps the ranking (rankAnaesthetistCandidates, tier order, shuffled within a tier) and the separate Not preferred group',
      'Changes the tier filter to a teal ToggleGroup with radio semantics and the pills to Badge',
      'Changes the rows from buttons in the Tab order to listbox options (one Tab stop for the list)',
    ],
    status: 'custom',
    customReason: 'Ranking is a domain rule; the picker stays custom on the Base UI Combobox listbox.',
  },
  DraftListCandidates: {
    Component: DraftListCandidatesReplacement,
    library: 'Base UI Combobox (inline, Group/GroupLabel) + shadcn ToggleGroup, InputGroup, Badge, Button',
    changes: [
      'Adds combobox and listbox roles over the selectable groups (Free, Not preferred) with arrow keys from the name box',
      'Keeps the one ranking (useDraftListCandidates) and the Everyone / Free only reach control as a teal ToggleGroup',
      'Keeps Not available and Already has a List as non-selectable rows below the listbox',
      'Loses the demo trigger on Not available rows and the real Open List: both are stubbed to the echo line',
    ],
    status: 'custom',
    customReason: 'Availability groups and ranking are domain rules; the picker stays custom on the Base UI Combobox listbox.',
  },
}
