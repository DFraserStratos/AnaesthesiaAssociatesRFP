import type { SliceReplacements } from '../../registry'
import {
  AgeChipReplacement,
  AvatarReplacement,
  DayChipReplacement,
  OutOfHoursPillReplacement,
  ProgressPillReplacement,
  StatusChipReplacement,
} from './Chips'
import {
  BookingCardReplacement,
  EmptyCardReplacement,
  HeroFigureCardReplacement,
  MovedToYouPanelReplacement,
  ProgressBarReplacement,
} from './Cards'
import { LookbackResultsReplacement, LookbackSearchRowReplacement } from './Lookback'
import { SeriesListReplacement } from './SeriesList'
import { UpdatePromptReplacement } from './UpdatePrompt'
import { BookingDetailBodyReplacement } from './BookingDetail'
import { FormErrorReplacement, TextAreaReplacement, TextFieldReplacement } from './Fields'

export const replacements: SliceReplacements = {
  StatusChip: {
    Component: StatusChipReplacement,
    library: 'shadcn Badge (status variants)',
    changes: [
      'Keeps the same chips: the three List kinds, then her status choices with their long labels from the status master',
      'Changes colour from a resolved hex per chip to a fixed Badge variant per --status-* token',
      'Loses free colours: a status can only use one of the six design tokens (already the master rule)',
    ],
    status: 'built',
  },
  ProgressPill: {
    Component: ProgressPillReplacement,
    library: 'shadcn Badge',
    changes: [
      'Changes To finish to the warning Badge and Authorised and Invoiced to the default (sunken) Badge',
      'Keeps the label from LIST_PROGRESS_LABEL and the 3px 9px, 12px pill box',
      'Keeps the done tick on Ready to submit and Done · unbilled (TickBadge stays custom, on a bare Badge)',
    ],
    status: 'built',
  },
  OutOfHoursPill: {
    Component: OutOfHoursPillReplacement,
    library: 'shadcn Badge (default, with inline icon)',
    changes: [
      'Changes the hand-styled span to a default Badge, kept ink 11/700 as today',
      'Keeps the moon as an inline-start icon in a header and the OUT_OF_HOURS word',
    ],
    status: 'built',
  },
  AgeChip: {
    Component: AgeChipReplacement,
    library: 'shadcn Badge',
    changes: [
      'Changes the age to a default Badge that turns to the warning Badge past 60 days',
      'Changes the ACC chip to a Badge on the Pre-op status tint, no dot (as today)',
      'Adds tabular mono figures to the day count so it does not jitter as it changes',
    ],
    status: 'built',
  },
  DayChip: {
    Component: DayChipReplacement,
    library: 'shadcn Badge (rendered as a button, X as inline-end icon)',
    changes: [
      'Keeps the teal 44px chip, the mono date and the spoken aria-label that says it closes the day',
      'Adds hover and pressed teal shades and the kit focus ring',
      'Changes the hand-styled button to a Badge rendered through Base UI useRender as a <button>',
    ],
    status: 'built',
  },
  Avatar: {
    Component: AvatarReplacement,
    library: 'shadcn Avatar (Base UI Avatar, AvatarFallback, elevated variant)',
    changes: [
      'Keeps the elevated white chip with crimson initials at e1, at 34, 44 and 56px',
      'Changes the per-call size to a class override; initials keep the 0.34 scale',
      'Adds an optional image (AvatarImage) with the initials as fallback, unused today',
    ],
    status: 'built',
  },
  'Hero figure card': {
    Component: HeroFigureCardReplacement,
    library: 'shadcn Card',
    changes: [
      "Keeps the persona's real outstanding total and unpaid count, static (no number animation)",
      'Changes the hand-styled box to a Card at the panel radius with the kit shadow switched off',
      'Adds tabular figures on the total',
    ],
    status: 'built',
  },
  EmptyCard: {
    Component: EmptyCardReplacement,
    library: 'shadcn Empty (EmptyDescription)',
    changes: [
      'Keeps the solid line border, surface and 13.5px mist centred text (Empty is dashed and borderless by default)',
      'Adds the Empty parts (media, title, content) for screens that later want an icon or action',
    ],
    status: 'built',
  },
  MovedToYouPanel: {
    Component: MovedToYouPanelReplacement,
    library: 'shadcn Card + Item list',
    changes: [
      'Keeps the same store hooks and lines (movedToYouLine, movedBookingToYouLine), newest first, neutral',
      'Changes the panel to a named Card region and each notice to an Item in a list (button when it opens something)',
      'Adds a local sample (her own Lists, a real colleague) because the seeded persona has nothing moved to her',
    ],
    status: 'built',
  },
  'Booking card (Capture pill)': {
    options: [
      { label: 'Name from its text (as today)', Component: () => <BookingCardReplacement /> },
      {
        label: 'Short composed name',
        Component: () => <BookingCardReplacement label />,
        note: 'aria-label reads "patient, time, NHI, operation, state" instead of all the text run together.',
      },
    ],
    library: 'shadcn Item (rendered as a button) + Badge',
    changes: [
      'Changes the card to an outline Item rendered as a button, in a list; tap still cycles Capture, done, cancelled (local)',
      'Changes the Capture pill to a teal-tint Badge; the done tick stays the custom TickBadge',
      'Adds a hover shade and the kit focus ring',
    ],
    status: 'built',
  },
  'Progress bar': {
    options: [
      { label: 'Label beside the bar (as today)', Component: () => <ProgressBarReplacement /> },
      {
        label: 'Label above, count at right (shadcn)',
        Component: () => <ProgressBarReplacement inline={false} />,
        note: 'The shadcn Progress layout: "Bookings complete" above the bar, "2 of 5" in mono at the right.',
      },
    ],
    library: 'shadcn Progress (Base UI Progress)',
    changes: [
      'Adds role=progressbar with aria-valuenow, max and the "n of m complete" value text, named by its label',
      'Keeps the green success bar on the line track',
      'Changes the width ease to the kit card ease at 240ms (today 300ms)',
    ],
    status: 'built',
  },
  LookbackSearchRow: {
    Component: LookbackSearchRowReplacement,
    library: 'shadcn InputGroup (search) + Button',
    changes: [
      'Changes the absolutely positioned icon and clear button to InputGroup addons; one search input for all three',
      'Keeps the 48px field, Clear search (44px) only while there is text, and the teal outlined calendar button',
      'Adds the kit focus ring on the whole group and a hover tint on the calendar button',
    ],
    status: 'built',
  },
  'LookbackResults (ResultRow)': {
    Component: LookbackResultsReplacement,
    library: 'shadcn Item list + Badge',
    changes: [
      'Keeps the same search (useBookingSearch on her surname), Upcoming and Past, three each, and the spoken row label',
      'Changes each row to an outline Item rendered as a button in a list, with the progress as a Badge',
      'Changes the group headings to real h3 headings; WarningTriangle stays custom',
    ],
    status: 'built',
  },
  SeriesList: {
    options: [
      { label: 'Confirm inline (as today)', Component: () => <SeriesListReplacement confirm="inline" /> },
      {
        label: 'AlertDialog confirm',
        Component: () => <SeriesListReplacement confirm="dialog" />,
        note: 'A centred shadcn AlertDialog: focus trap, Escape keeps the series, focus returns to Delete.',
      },
      {
        label: 'Bottom sheet confirm',
        Component: () => <SeriesListReplacement confirm="sheet" />,
        note: 'The same question in a Drawer, the mobile pattern; drag, scrim or Keep it closes it.',
      },
    ],
    library: 'shadcn Item list + AlertDialog (or Drawer)',
    changes: [
      'Keeps the store series lines (useActiveSeries), Delete per row and the "return to <default status>" wording',
      'Changes the rows to outline Items in a list; the inline confirm is an ItemFooter group',
      'Changes Delete to hide the row locally: the preview never writes the store (today it ends the series)',
      'Adds a local sample in the master wording, as the seeded persona has no series',
    ],
    status: 'built',
  },
  UpdatePrompt: {
    options: [
      {
        label: 'Teal pill (as today)',
        Component: () => <UpdatePromptReplacement look="teal-pill" />,
        note: "Sonner's queue and live region with today's floating teal pill as a custom toast.",
      },
      {
        label: 'Neutral toast, Reload action',
        Component: () => <UpdatePromptReplacement look="neutral-toast" />,
        note: 'The kit toast: surface card, "New version ready" and a teal Reload action button.',
      },
    ],
    library: 'Sonner toast (via shadcn Toaster)',
    changes: [
      'Changes the hand-placed live region to a Sonner Toaster at bottom centre, offset 24px (the app offsets it above --aa-dock-height)',
      'Keeps the prompt until tapped (duration Infinity); adds swipe to dismiss',
      'Keeps the copy "New version ready · Tap to reload" (pill) or moves Reload into the action (neutral)',
    ],
    status: 'built',
  },
  BookingDetailBody: {
    options: [
      {
        label: 'Summary box and field errors (as today)',
        Component: () => <BookingDetailBodyReplacement banner />,
        note: 'The red summary box at the top stays, with each message also under the Times card.',
      },
      {
        label: 'Field errors only (RHF)',
        Component: () => <BookingDetailBodyReplacement banner={false} />,
        note: 'Only the FieldErrors under the times; RHF focuses the first invalid control.',
      },
    ],
    library: 'React Hook Form + Zod over shadcn Card, Field, Textarea, Button; Base UI NumberField',
    changes: [
      'Changes Mark complete to a form submit: Zod holds the times rules in the store\'s words; RHF shouldFocusError focuses Start now or Finish now (no hand-written query and focus)',
      'Changes the B, T and M steppers to Base UI NumberField; T follows the stamps (the prototype\'s timeUnitsFromMinutes) until set by hand',
      'Keeps patient rows, scheduled ±5, the Source line, notes, the RVG code card (Change, Clear), Times (Start now, Finish now, ±5), Notes and the complete or Amend bar',
      'Loses (left out): the modifiers ledger, adjustment and charge, billing lines, the code picker, attachments strip, warnings, completion overlay and every sheet (stubbed)',
      'Changes writes to local form state: the preview never writes the store (today every tap is an audited write)',
    ],
    status: 'partial',
  },
  TextField: {
    Component: TextFieldReplacement,
    library: 'shadcn Field + FieldLabel + Input + FieldDescription',
    changes: [
      'Keeps the 11px uppercase mist label, 48px field on the background and the hint tied by aria-describedby',
      'Changes the wrapping <label> to FieldLabel htmlFor on the Input',
      'Adds the kit teal focus ring and aria-invalid styling for when an error is bound',
    ],
    status: 'built',
  },
  TextArea: {
    Component: TextAreaReplacement,
    library: 'shadcn Field + FieldLabel + Textarea',
    changes: [
      'Keeps the label, 72px minimum, 12px padding and no resize handle',
      'Adds field-sizing: content, so the box grows with the text',
      'Adds the kit teal focus ring',
    ],
    status: 'built',
  },
  FormError: {
    options: [
      {
        label: 'Under the form (as today)',
        Component: () => <FormErrorReplacement placement="form" />,
        note: 'A destructive shadcn Alert (role=alert) in the error tint, where the sheets put it today.',
      },
      {
        label: 'Under the field (RHF FieldError)',
        Component: () => <FormErrorReplacement placement="field" />,
        note: 'The message sits under the note it is about, bound by React Hook Form + Zod with aria-invalid and aria-describedby.',
      },
    ],
    library: 'shadcn Alert, or shadcn FieldError (React Hook Form + Zod)',
    changes: [
      'Keeps the plain-words message and the role=alert announcement',
      'Adds (field option) aria-invalid on the field and a link from field to message; it clears live as the note is fixed',
      'Keeps refusals that belong to no field (store refusals) as the form-level Alert',
    ],
    status: 'built',
  },
}
