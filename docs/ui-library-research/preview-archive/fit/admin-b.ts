import type { FitFile } from './index'

export const fit: FitFile = {
  app: 'admin',
  ratings: {
    // pilot-b
    CodePickerSheet: {
      score: 2,
      why: 'Raw Base UI Combobox inline in a Dialog with hand-built virtualised rows; Escape intercepted to clear the search first. Only the Dialog shell is stock.',
    },
    'Table / Header / TextAction / EditCell': {
      score: 4,
      why: 'Stock shadcn Table and Button link over TanStack sorting; a hand-rolled sort header button and a few cell height and padding tweaks.',
    },
    'MiniCalendar (RightRail)': {
      score: 2,
      why: 'shadcn Calendar used as scaffolding: custom MonthCaption and DayButton, hidden navigation and a full classNames override for the compact crimson rail.',
    },
    // a-data
    'ReviewQueue (clickable rows)': {
      score: 4,
      why: 'Stock Table, Tooltip and Button link over TanStack; the outline Badge needs arbitrary colour overrides. The whole-row option adds hand-made row focus (3).',
    },
    'RvgGroupsView (grouped rows)': {
      score: 3,
      why: 'Stock Select, ToggleGroup, Dialog and RHF; the TanStack grouped heading rows are hand-drawn colSpan cells and the anatomy field is raw Base UI Autocomplete.',
    },
    AuditViewer: {
      score: 4,
      why: 'Stock Table, Select and a range Calendar in a Popover with TanStack pagination; one h-10! on the Select and a small hand-built pager. Virtual option is 3.',
    },
    TextField: {
      score: 4,
      why: 'Stock Field, Input and FieldError composed with RHF and Zod; the only bend is the kit FieldLabel restyled into the uppercase eyebrow.',
    },
    TextArea: {
      score: 4,
      why: 'Stock Textarea with its default field-sizing growth and one max height; the kit Field label is the eyebrow re-skin. Fixed height needs one override.',
    },
    'FieldLabel / FormError': {
      score: 4,
      why: 'Stock FieldError under the field with RHF and Zod; light touch beyond the kit eyebrow label and the added pill Button variant.',
    },
    'ContractPanel (ContractEditSheet)': {
      score: 3,
      why: 'Stock Sheet, Select groups, chips Combobox and RHF, but hand-built read-only fields, a raw NumberField price and the bent price ranges editor inside.',
    },
    SlotStatusSheet: {
      score: 3,
      why: 'Stock Dialog, Field, Checkbox and RHF; the colour swatches are ToggleGroup items rebuilt with long ! and arbitrary overrides, FieldLegend forced with !.',
    },
    ContractPriceRanges: {
      score: 2,
      why: 'Stock Table only frames it: raw Base UI NumberField styled by hand, Enter and Escape intercepted per row, manual focus return through a context of edit state.',
    },
    HospitalCalendar: {
      score: 2,
      why: 'shadcn Calendar as scaffolding: custom DayButton with holiday blocks and counts, hand-built month navigation and a classNames override; Select and Dialog stock.',
    },
    'Native date input (TextField type=date)': {
      score: 3,
      why: 'Stock Popover and Calendar, but the typed field adds our own date parsing and commit on InputGroup. The shadcn button trigger option is 4.',
    },
    SessionTimesFields: {
      score: 4,
      why: 'Stock kit Input type=time inside Field with a link Button; the error box is a small hand-made alert. The typed option uses a hand-styled Autocomplete (3).',
    },
    'RVG anatomy datalist': {
      score: 3,
      why: 'shadcn has no Autocomplete here, so raw Base UI Autocomplete is styled by hand to copy the kit Combobox popup; behaviour is the library\'s own.',
    },
    // a-custom
    SuccessOverlay: {
      score: 1,
      why: 'Stays custom: the choreography is Motion tweens and our own markup; shadcn adds only the Dismiss Button.',
    },
    TickBadge: {
      score: 1,
      why: 'Stays custom: a two-element animated glyph on Motion; no shadcn component is involved.',
    },
    DayGrid: {
      score: 1,
      why: 'Stays custom: the time ruler, ARIA grid roles and roving focus are ours; only Tooltip, Badge toggles and a Button come from the kit.',
    },
    DraftListBand: {
      score: 1,
      why: 'Stays custom: lanes and blocks are hand-laid layout in grid row roles; only the Tooltip comes from the library.',
    },
    StatusBlock: {
      score: 1,
      why: 'Stays custom: a status cell renderer on theme tokens with inline fills; the stock Select only drives the example.',
    },
    'Review summary tiles (ReviewScreen)': {
      score: 3,
      why: 'Card, Table, Badge, Breadcrumb, AlertDialog and Tooltip composed to rebuild the screen, with ! overrides on Card radius, Button and icon sizes.',
    },
    'Billing pipeline stepper (PipelineCard)': {
      score: 2,
      why: 'Stays custom: the ordered stepper layout and arrows are hand-built; kit Badge variants rendered as buttons with stock Tooltips carry the steps.',
    },
    InvoiceDocument: {
      score: 1,
      why: 'Stays custom: the print document is our own serif and mono markup; stock Table, Card, Button and Badge only furnish the chrome around it.',
    },
    AnaesthetistCandidates: {
      score: 2,
      why: 'Raw Base UI Combobox list with custom rows; the ToggleGroup\'s ARIA replaced by radiogroup roles and Badge colours overridden for the pairing pills.',
    },
    DraftListCandidates: {
      score: 2,
      why: 'Same build as AnaesthetistCandidates: raw Combobox listbox with custom groups, ToggleGroup ARIA swapped for radio roles, hand-built unavailable rows.',
    },
  },
}
