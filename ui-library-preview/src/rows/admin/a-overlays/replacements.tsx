import type { SliceReplacements } from '../../registry'
import { ConflictCalloutReplacement, NotPreferredWarningReplacement } from './Callouts'
import { ChipMultiSelectReplacement } from './ChipMultiSelect'
import { ClearConflictReplacement } from './ClearConflict'
import { ContractSelectReplacement } from './ContractSelect'
import { DraftListDrawerReplacement } from './DraftListDrawer'
import { DrawerPartsReplacement } from './DrawerParts'
import { HistorySheetReplacement } from './HistorySheet'
import { MasterPanelReplacement } from './MasterPanel'
import { NameSearchBoxReplacement } from './NameSearchBox'
import { NotificationsCardReplacement } from './NotificationsCard'
import { ProfileChromeReplacement } from './ProfileChrome'
import { SlotDrawerReplacement } from './SlotDrawer'
import { SurgeonPickerReplacement } from './SurgeonPicker'
import { VacatedChoiceReplacement } from './VacatedChoice'
import { WarningsToDoReplacement } from './WarningsToDo'

export const replacements: SliceReplacements = {
  'MasterPanel / PanelGrid / PanelSection': {
    Component: MasterPanelReplacement,
    library: 'shadcn Sheet (side right, Base UI Dialog) + Field + Input',
    changes: [
      'Adds a real focus trap, portal and scroll lock; focus lands on the first field, not the panel',
      'Keeps Escape, scrim click, the corner close and focus returned to the trigger',
      'Keeps the 600px width, header with pills, two-column PanelGrid and right-aligned footer',
      'Adds the slide-in card motion (aa-motion-card) the prototype panel does not have',
    ],
    status: 'built',
  },
  SlotDrawer: {
    options: [
      { label: 'Buttons in a row (as today)', Component: () => <SlotDrawerReplacement />, note: 'Every action is a footer button; an empty session keeps Assign List on its own row.' },
      {
        label: 'Primary + More menu',
        Component: () => <SlotDrawerReplacement layout="menu" />,
        note: 'Only the primary (or first) action stays a button; the rest go in a DropdownMenu, as the drawerParts row proposes.',
      },
    ],
    library: 'shadcn Sheet (side right, 440px) + Alert + Badge + Button, nested shadcn Dialog for History',
    changes: [
      'Adds dialog role, aria-labelledby, focus trap, Escape and focus restore to both drawer bodies',
      'Keeps the header, Session, Bookings (warning outline), Attachments and empty-session layouts, read live from the seed',
      'Changes History to the rebuilt HistoryDialog nested in the Sheet (Base UI stacks nested dialogs)',
      'Loses the nested sheets (Edit, Reassign, Change status, Assign, Book, Edit times, Move), the moved-here lines and the conflict Clear link: they write to the store, so here they echo a line',
      'Changes the surgeon router Link to a plain link and drops the warning triangle beside each patient (its own row)',
    ],
    status: 'partial',
  },
  DraftListDrawer: {
    options: [
      { label: 'Reason in a Tooltip', Component: () => <DraftListDrawerReplacement />, note: 'Disabled Assign or Remove stays focusable; hover or focus shows why in a Tooltip (today: a title only).' },
      {
        label: 'Reason as a line',
        Component: () => <DraftListDrawerReplacement reasons="line" />,
        note: 'The reason is printed under the actions, always visible, with no hover needed.',
      },
      {
        label: 'Primary + More menu',
        Component: () => <DraftListDrawerReplacement layout="menu" />,
        note: 'Assign stays a button; Edit, Change date, Remove and History go in a DropdownMenu, with a disabled item showing its reason.',
      },
    ],
    library: 'shadcn Sheet (side right, 440px) + Badge + Tooltip + Button (+ DropdownMenu), nested shadcn Dialog for History',
    changes: [
      'Adds dialog semantics, focus trap, Escape and focus restore',
      'Changes the disabled reasons from title tooltips to a keyboard-reachable Tooltip or a visible line',
      'Keeps the DRAFT and Unassigned chips, waiting time, Request rows, the five-candidate short list and Bookings',
      'Loses the Assign, Edit, Redate, Remove, Add Booking and Move sheets (store writes): they echo a line here',
    ],
    status: 'partial',
  },
  ClearConflictSheet: {
    options: [
      { label: 'Full-width pair (as today)', Component: () => <ClearConflictReplacement />, note: 'Cancel and Clear share the width, as the prototype Overlay draws them.' },
      { label: 'Right-aligned footer (shadcn default)', Component: () => <ClearConflictReplacement footer="end" />, note: 'The AlertDialog footer: buttons at their own width, at the right.' },
    ],
    library: 'shadcn AlertDialog (Base UI AlertDialog) + Field + Textarea',
    changes: [
      'Changes the role to alertdialog and puts initial focus on Cancel, the safe action',
      'Changes scrim click to do nothing (an alert dialog closes only by a choice or Escape)',
      'Keeps the title, reason, detail, reassurance, optional note and Cancel / Clear',
      'Changes Clear to a local echo: the prototype writes clearListConflict to the store',
    ],
    status: 'built',
  },
  HistorySheet: {
    options: [
      { label: 'Show the steps link (as today)', Component: () => <HistorySheetReplacement />, note: 'A coalesced group keeps its "Show the n steps" text link, now a Collapsible.' },
      { label: 'Accordion steps', Component: () => <HistorySheetReplacement steps="accordion" />, note: 'The steps open from an Accordion trigger with a chevron, as the research row suggests.' },
    ],
    library: 'shadcn Dialog + Collapsible or Accordion (Base UI)',
    changes: [
      'Adds focus trap, initial focus and restore, aria-labelledby / describedby from the Dialog',
      'Keeps the day headings, the time gutter, the ledger and the coalesced groups from the prototype audit layer',
      'Changes the ResizeObserver stacking of the ledger to a CSS container query',
      'Adds aria-expanded and aria-controls on the steps toggle',
    ],
    status: 'built',
  },
  NameSearchBox: {
    Component: NameSearchBoxReplacement,
    library: 'shadcn Input Group (input + icon and clear addons)',
    changes: [
      'Keeps field (48px) and pill (36px, 180px) sizes, the searchbox role, Escape clears and the clear button',
      'Keeps the white field background and the search icon, now as Input Group addons',
      'Changes the focus style to the kit ring on the group, not a hand-set border and shadow',
    ],
    status: 'built',
  },
  'ContractSelect (fieldChrome select)': {
    options: [
      { label: 'Native select (as today)', Component: () => <ContractSelectReplacement />, note: 'A native select in the kit field chrome with a teal chevron; the OS draws the list and optgroups.' },
      {
        label: 'Base UI Select',
        Component: () => <ContractSelectReplacement kind="popup" />,
        note: 'A styled popup with the holder Parties as labelled groups and a teal tick on the chosen Contract.',
      },
    ],
    library: 'Native select in kit chrome, or shadcn Select (Base UI Select)',
    changes: [
      'Keeps the label, the system Contracts first and every active Contract under its holder Party',
      'Changes selectControlStyle to the kit field classes (one field look for every Admin select)',
      'Adds, in the Select option, a styled list with group labels and keyboard type-to-find',
    ],
    status: 'built',
  },
  SurgeonPicker: {
    Component: SurgeonPickerReplacement,
    library: 'Base UI Combobox with groups (shadcn Combobox) + shadcn Select for the anaesthetist',
    changes: [
      'Adds type to search across both groups, with arrow and Enter selection',
      'Keeps the "Surgeons" group, the "Not preferred with Dr X" group and the option suffixes, never disabled',
      'Changes the placeholder option to an input placeholder; there is no empty value to pick',
      'Keeps no visible label (an aria-label, as today); the placeholder reads in ink like the native select',
      'Changes the example anaesthetist chooser from a native select to shadcn Select',
    ],
    status: 'built',
  },
  NotPreferredWarning: {
    Component: NotPreferredWarningReplacement,
    library: 'shadcn Alert (warning variant)',
    changes: [
      'Keeps the warning tint, solid amber triangle, bold message, reasons and the go-ahead line',
      'Keeps role=status (overriding the Alert default role=alert) so it never interrupts',
      'Changes the hand-set radius and padding to the Alert anatomy at the card radius',
    ],
    status: 'built',
  },
  ChipMultiSelect: {
    Component: ChipMultiSelectReplacement,
    library: 'Base UI Combobox (multiple) with chips (shadcn Combobox chips)',
    changes: [
      'Adds type to filter, Enter to add and Backspace on an empty input to remove the last chip',
      'Keeps neutral sunken chips with a remove button, in the order chosen',
      'Changes the native "Add a specialty" select to a chips field; "Any specialty" becomes its placeholder',
      'Changes chosen items to stay in the list with a tick (pick again to remove) instead of leaving it',
      'Keeps the chips on Escape (Base UI would clear the whole selection; overridden here)',
    ],
    status: 'built',
  },
  ConflictCallout: {
    Component: ConflictCalloutReplacement,
    library: 'shadcn Alert (warning variant)',
    changes: [
      'Keeps the closure detail in bold and the "accepted and flagged" line, role=status',
      'Changes the hand-set callout styles to the Alert anatomy shared with NotPreferredWarning',
      'Changes the example hospital chooser from a native select to shadcn Select',
    ],
    status: 'built',
  },
  WarningsToDo: {
    Component: WarningsToDoReplacement,
    library: 'shadcn Card + Collapsible + Badge + Button',
    changes: [
      'Keeps the count, the open-conflicts line, the coloured left edge per strength and Open / Clear per row',
      'Changes "Show all" to a Collapsible: the extra rows stay mounted and the toggle carries aria-controls',
      'Changes Clear to a local hide: the prototype writes a clearance to the store',
      'Loses the shared WarningTriangle and TickButton components: rebuilt here from Badge-like spans and Button',
    ],
    status: 'built',
  },
  NotificationsCard: {
    Component: NotificationsCardReplacement,
    library: 'shadcn Card + Button + Badge',
    changes: [
      'Keeps the heading count, empty state, three rows, Resolve tick action, See all and Show resolved',
      'Adds a local "Use sample notices" switch: the fresh seed has none, so the rows can be seen',
      'Changes Resolve to local state; keeps the pause before the row leaves but loses the tick draw motion (TickBadge is its own row)',
    ],
    status: 'built',
  },
  'VacatedSessionChoice / StatusRadioGroup': {
    options: [
      { label: 'Status chips (as today)', Component: () => <VacatedChoiceReplacement />, note: 'Each radio is a status chip: swatch and label, teal outline and tint when chosen.' },
      { label: 'Radio dots (shadcn default)', Component: () => <VacatedChoiceReplacement look="dots" />, note: 'The kit radio dot with the swatch and label beside it: quieter, the standard form look.' },
    ],
    library: 'shadcn RadioGroup (Base UI RadioGroup + Radio)',
    changes: [
      'Changes the hand-written roving tab stop and arrow keys to the library radio group',
      'Keeps the Free then Unavailable choices from the status master and the hatched / dashed swatches',
      'Keeps the visible label as the group name (aria-labelledby)',
    ],
    status: 'built',
  },
  ProfileChrome: {
    options: [
      { label: 'No back link (as the row)', Component: () => <ProfileChromeReplacement />, note: 'Header, id chip, actions and the Contact card only, as the current example.' },
      { label: 'With Breadcrumb back link', Component: () => <ProfileChromeReplacement crumb />, note: 'BackLink as a shadcn Breadcrumb (Anaesthetists / this record); a plain link here, a router link in the app.' },
    ],
    library: 'shadcn Card + Badge + Button (+ Breadcrumb)',
    changes: [
      'Keeps the 24px name, mono id chip, sub line, History and Edit details, and the fact rows',
      'Changes ProfileCard to Card at size sm (16px padding) without its default shadow',
      'Adds, in the Breadcrumb option, a nav landmark with aria-current on the record',
    ],
    status: 'built',
  },
  'drawerParts (Section, Row, DrawerLink, ActionBtn)': {
    options: [
      { label: 'Buttons in a row (as today)', Component: () => <DrawerPartsReplacement />, note: 'Every action a button; a disabled one shows its reason in a Tooltip.' },
      { label: 'Primary + More menu', Component: () => <DrawerPartsReplacement layout="menu" />, note: 'The primary stays a button; the rest go in a DropdownMenu with the disabled reason under the item.' },
      { label: 'Reason as a line', Component: () => <DrawerPartsReplacement reasons="line" />, note: 'Buttons in a row; the disabled reason printed under them.' },
    ],
    library: 'shadcn Button (+ DropdownMenu, Tooltip)',
    changes: [
      'Changes ActionBtn to Button default (primary) or outline, DrawerLink to Button outline xs in teal text',
      'Changes disabled reasons from a title to a Tooltip on a focusable disabled button',
      'Keeps Section (11px uppercase eyebrow, now a real h3) and Row (80px label column)',
      'Retires SlotDrawer\'s own copies: both drawers use these parts here',
    ],
    status: 'built',
  },
}
