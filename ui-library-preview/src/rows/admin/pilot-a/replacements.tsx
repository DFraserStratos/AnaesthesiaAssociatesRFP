import type { SliceReplacements } from '../../registry'
import { ButtonReplacement } from './Button'
import { DialogReplacement } from './Dialog'
import { SegmentedReplacement } from './Segmented'
import { StatusChipReplacement } from './StatusChip'
import { SuccessToastReplacement } from './SuccessToast'

export const replacements: SliceReplacements = {
  Button: {
    Component: ButtonReplacement,
    library: 'shadcn Button (Base UI Button)',
    changes: [
      'Keeps the three kinds as variants: primary = default at size cta, secondary = outline at lg, pill = pill',
      'Adds a teal focus-visible ring and hover and pressed shades on every variant',
      'Changes disabled to a real disabled button (no click handler guard needed)',
      'Loses the per-call style objects: sizes come only from the cva size scale (the 44px pill is a class override)',
    ],
    status: 'built',
  },
  StatusChip: {
    options: [
      { label: 'Flat tint (as today)', Component: () => <StatusChipReplacement /> },
      {
        label: 'Hatched and dashed',
        Component: () => <StatusChipReplacement treatments />,
        note: 'Unavailable takes the hatched and Free the dashed block treatment, so the chip matches its block (Free grows 2px for its border).',
      },
    ],
    library: 'shadcn Badge (status variants)',
    changes: [
      'Keeps the same keys and labels, read from the status master',
      'Changes colour from a resolved hex per chip to a fixed Badge variant per colour token',
      'Loses free colours: a status can only use one of the six design tokens (already the master rule)',
    ],
    status: 'built',
  },
  Segmented: {
    options: [
      { label: 'Teal pill (as today)', Component: () => <SegmentedReplacement variant="teal" /> },
      {
        label: 'White pill on sunken',
        Component: () => <SegmentedReplacement variant="default" />,
        note: 'The other branded ToggleGroup look: the selected option is a raised white pill with ink text, quieter than teal.',
      },
    ],
    library: 'shadcn ToggleGroup (Base UI ToggleGroup, single)',
    changes: [
      'Adds roving focus: Tab enters once, arrow keys move between options',
      'Changes the semantics from a group of aria-pressed buttons to radiogroup and radio with aria-checked',
      'Keeps one option always selected (an unpress is ignored)',
      'Loses the sliding indicator animation: the selected pill switches without moving',
    ],
    status: 'built',
  },
  'Dialog (useSurface().Overlay)': {
    options: [
      { label: 'No corner X (as today)', Component: () => <DialogReplacement /> },
      {
        label: 'Corner X (shadcn default)',
        Component: () => <DialogReplacement closeX />,
        note: 'Adds a ghost close button top right: a second close target beside Cancel, Escape and the scrim.',
      },
    ],
    library: 'shadcn Dialog (Base UI Dialog)',
    changes: [
      'Adds a focus trap, initial focus on the first field and focus returned to the trigger',
      'Adds scroll lock, a portal and aria-labelledby / aria-describedby from the title and description',
      'Keeps Escape and scrim click to close; nested dialogs stack natively, retiring OPEN_DIALOGS',
    ],
    status: 'built',
  },
  'Inline success banner (role=status)': {
    options: [
      {
        label: 'Keep inline (shadcn Alert)',
        Component: () => <SuccessToastReplacement style="inline" />,
        note: 'The teal-tint line stays where it is, as an Alert with role=status and Dismiss; no toast library needed.',
      },
      {
        label: 'Teal-tint toast',
        Component: () => <SuccessToastReplacement style="teal-toast" />,
        note: 'A Sonner toast in the old banner colours, with "Flag again" as its action; auto-dismisses after 6 seconds.',
      },
      {
        label: 'Neutral toast',
        Component: () => <SuccessToastReplacement style="neutral-toast" />,
        note: 'The kit toast: surface card, ink title, teal "Flag again" action; auto-dismisses after 6 seconds.',
      },
    ],
    library: 'Sonner toast (via shadcn Toaster), or shadcn Alert',
    changes: [
      'Adds an undo on the confirmation itself: "Flag again" restores the cleared conflict (toast options)',
      'Changes Dismiss to auto-dismiss with swipe to close early (toast options)',
      'Keeps blocking errors inline: refused saves stay as FormError (role=alert) in the sheet, never a toast',
      'Keeps the copy and the role=status announcement',
    ],
    status: 'built',
  },
}
