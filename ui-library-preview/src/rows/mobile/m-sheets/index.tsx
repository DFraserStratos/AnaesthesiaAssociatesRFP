import type { SliceReplacements } from '../../registry'
import { ListOptionsSheetReplacement } from './ListOptionsSheet'
import { AlertOfficeSheetReplacement } from './AlertOfficeSheet'
import { SubmitListSheetReplacement } from './SubmitListSheet'
import { AvailabilityEditorReplacement } from './AvailabilityEditor'
import { MobileButtonReplacement, NudgeButtonReplacement, PressFeedbackReplacement, StepperButtonReplacement } from './Controls'
import { FilterChipsReplacement, SegmentedFieldReplacement, SlidingSegmentedReplacement } from './Segmented'
import { CaptureSectionReplacement, InstallCoachReplacement, ToggleRowReplacement } from './Cards'

export const replacements: SliceReplacements = {
  ListOptionsSheet: {
    options: [
      {
        label: 'Sheet, plain buttons (as today)',
        Component: () => <ListOptionsSheetReplacement mode="sheet" />,
        note: 'The same bottom sheet on Drawer; the role=menu and menuitem roles are dropped, so it reads as a list of buttons.',
      },
      {
        label: 'Real menu (DropdownMenu)',
        Component: () => <ListOptionsSheetReplacement mode="menu" />,
        note: 'A Base UI Menu anchored to the button: arrow keys, typeahead, Escape; no sheet and no Close button.',
      },
    ],
    library: 'shadcn Drawer (Base UI Drawer), or shadcn DropdownMenu (Base UI Menu)',
    changes: [
      'Changes the false role=menu to a plain button list (sheet) or a real Menu with arrow keys (menu option)',
      'Adds drag to dismiss, Escape and a focus trap (sheet); keeps title, subtitle, icon tiles, hints and the disabled row',
      'Keeps the 60px rows and 40px teal-tint icon tiles in theme utilities',
    ],
    status: 'built',
  },
  AlertOfficeSheet: {
    options: [
      {
        label: 'Send disabled until valid (as today)',
        Component: () => <AlertOfficeSheetReplacement submitGate="disabled" />,
        note: 'Send stays greyed while the note is empty or over 300; the counter turns red over the limit.',
      },
      {
        label: 'Send always on, error on the field',
        Component: () => <AlertOfficeSheetReplacement submitGate="errors" />,
        note: 'React Hook Form shows the Zod message under the note (bound with aria-invalid) when Send is tapped.',
      },
    ],
    library: 'shadcn Drawer + Field + Textarea (React Hook Form + Zod)',
    changes: [
      'Adds a focus trap, Escape and drag to dismiss; title and context line name the sheet (DrawerTitle, DrawerDescription)',
      'Changes the note rule to a Zod schema with the store\'s own wording (1 to 300 characters once trimmed)',
      'Keeps the store refusal check (read only) shown as a destructive Alert; Send never writes in the preview',
      'Loses the animated TickBadge in the sent state (a static success tick; the tick animation is its own row)',
    ],
    status: 'built',
  },
  SubmitListSheet: {
    Component: SubmitListSheetReplacement,
    library: 'shadcn Drawer (Base UI Drawer)',
    changes: [
      'Adds a focus trap, Escape and drag to dismiss; the sheet is named and described by its title and why line',
      'Changes the Booking rows into a labelled list (ul / li) read from the same store blockers',
      'Keeps blockers mode only, failures verbatim in error-on-tint, and Close',
    ],
    status: 'built',
  },
  AvailabilityEditor: {
    Component: AvailabilityEditorReplacement,
    library: 'shadcn Drawer + Field + Input + ToggleGroup + Toggle (React Hook Form + Zod)',
    changes: [
      'Changes the form to one React Hook Form with a Zod schema: dates, horizon, weekdays and Until are checked, errors sit on their fields',
      'Changes status, sessions, repeat and weekday chips to ToggleGroups (radio or multi-select, arrow keys); sessions and repeat keep the sliding pill',
      'Keeps the session panel (status chips, List line, series line, actions, delete-series confirm) read from the store',
      'Leaves out store writes and the move-List prompt (no Move this List, as in the catalogue example): Save, Remove and Delete show what would happen instead',
      'Keeps native date inputs (the date picker is its own row)',
    ],
    status: 'partial',
  },
  'Button (MobileButton)': {
    Component: MobileButtonReplacement,
    library: 'shadcn Button (Base UI Button)',
    changes: [
      'Keeps the three kinds as variants: primary = default at size cta (54px), secondary = outline at lg (48px), pill = pill at 44px',
      'Adds a teal focus-visible ring and hover and pressed shades',
      'Keeps the press sink as per-button active: utilities (see the press feedback row)',
      'Loses the per-call style objects: block is a w-full class, the disabled primary keeps today\'s line grey by class',
    ],
    status: 'built',
  },
  'Mobile press feedback (:active)': {
    options: [
      {
        label: 'One rule on the phone (as today)',
        Component: () => <PressFeedbackReplacement scope="container" />,
        note: 'A descendant variant on the phone container presses every enabled button inside, card buttons included.',
      },
      {
        label: 'Opt in per control (active: utilities)',
        Component: () => <PressFeedbackReplacement scope="per-control" />,
        note: 'Each Button (or card button) carries the active: classes itself; anything that leaves them out does not move.',
      },
    ],
    library: 'Tailwind active: variants on shadcn Button',
    changes: [
      'Keeps the 1px sink, 0.985 scale, 0.97 brightness and 90ms card ease',
      'Changes the global selector with !important longhands into utilities that travel with the component',
      'Keeps reduced motion: the transform is dropped under prefers-reduced-motion',
      'Leaves the iOS touch listener to the PWA host (it is what makes :active fire on iPhone)',
    ],
    status: 'built',
  },
  SlidingSegmentedControl: {
    options: [
      {
        label: 'Sliding pill (as today)',
        Component: () => <SlidingSegmentedReplacement slide />,
        note: 'The selected pill is one Motion element shared by layoutId, so it glides between cells in 180ms.',
      },
      {
        label: 'No slide',
        Component: () => <SlidingSegmentedReplacement slide={false} />,
        note: 'Each cell paints its own pill; the selection switches in place. No Motion dependency.',
      },
    ],
    library: 'shadcn ToggleGroup (Base UI ToggleGroup, single) + Motion layoutId',
    changes: [
      'Adds roving focus: Tab enters once, arrow keys move between options',
      'Changes role=group with aria-pressed to radiogroup and radio with aria-checked; one option always on',
      'Keeps teal, surface and ink variants and the pill-shaped ink track',
      'Loses the hand-written offset measuring and ResizeObserver (Motion measures the cells)',
    ],
    status: 'built',
  },
  Segmented: {
    options: [
      { label: 'Sliding pill (as today)', Component: () => <SegmentedFieldReplacement slide /> },
      {
        label: 'No slide',
        Component: () => <SegmentedFieldReplacement slide={false} />,
        note: 'The selected cell paints its own pill; same choice as the SlidingSegmentedControl row.',
      },
    ],
    library: 'shadcn ToggleGroup + Field label (Base UI ToggleGroup)',
    changes: [
      'Changes the label div into a FieldLabel tied to the group by aria-labelledby',
      'Keeps read only as a disabled group at 55% that still shows the selection',
      'Adds arrow-key roving focus and radio semantics',
    ],
    status: 'built',
  },
  'Filter chips (Week / Month / To-Do / Done)': {
    Component: FilterChipsReplacement,
    library: 'shadcn ToggleGroup (Base UI ToggleGroup, single, outline layout)',
    changes: [
      'Changes four aria-pressed buttons into one radiogroup named "Show Lists", with arrow keys',
      'Keeps the 38px pills: outlined slate at rest, teal filled when on',
      'Keeps one filter always on (an unpress is ignored)',
    ],
    status: 'built',
  },
  StepperButton: {
    options: [
      { label: 'Text glyphs (as today)', Component: () => <StepperButtonReplacement glyph="text" /> },
      {
        label: 'Lucide icons',
        Component: () => <StepperButtonReplacement glyph="icon" />,
        note: 'Minus and Plus icons in place of the typed − and + glyphs, matching the icon set used elsewhere.',
      },
    ],
    library: 'shadcn Button (outline, icon size)',
    changes: [
      'Adds accessible names ("Fewer base units", "More base units") and a group named by the row label',
      'Adds a polite live region on the count, so the new value is announced',
      'Keeps the 44px r12 outline square, slate glyph and line-strong when disabled',
    ],
    status: 'built',
  },
  NudgeButton: {
    Component: NudgeButtonReplacement,
    library: 'shadcn Button (outline)',
    changes: [
      'Adds accessible names ("5 minutes earlier", "5 minutes later") and a polite live region on the time',
      'Keeps the 44 by 36 outline button with the −5 and +5 labels',
      'Changes the ends: the buttons disable at 00:00 and 23:55 instead of silently clamping',
    ],
    status: 'built',
  },
  CaptureSection: {
    Component: CaptureSectionReplacement,
    library: 'shadcn Card (CardHeader / CardContent / CardFooter)',
    changes: [
      'Changes the micro-caps label into an h3 that names the card and labels the textarea',
      'Keeps the flat card: the kit Card shadow, footer rule, footer band and its zero bottom padding are switched off',
      'Keeps the footer pinned to the foot (mt-auto)',
    ],
    status: 'built',
  },
  'ToggleRow (switch)': {
    Component: ToggleRowReplacement,
    library: 'shadcn Switch (Base UI Switch)',
    changes: [
      'Changes the hand-drawn button into a Base UI Switch with a hidden native checkbox for forms',
      'Keeps the whole 44px row as the tap target (a label wraps it) and the 52 by 32 teal track',
      'Adds a visible focus ring on the switch',
    ],
    status: 'built',
  },
  InstallCoach: {
    Component: InstallCoachReplacement,
    library: 'shadcn Alert + Button (platform switch on ToggleGroup)',
    changes: [
      'Keeps the teal-outlined tip, the iPhone steps and the Android Install button',
      'Changes the dismiss into an AlertAction ghost icon button with the same name',
      'Changes the role to note, not alert, so screen readers do not interrupt for a standing tip',
    ],
    status: 'built',
  },
}
