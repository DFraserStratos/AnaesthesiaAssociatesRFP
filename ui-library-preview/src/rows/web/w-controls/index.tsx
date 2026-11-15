import type { SliceReplacements } from '../../registry'
import { StatusChipReplacement } from '../../admin/pilot-a/StatusChip'
import { AddBookingButtonReplacement, DayStepperReplacement, IconButtonsReplacement, LinkButtonReplacement, ProgressBarReplacement, SubmitActionReplacement } from './Buttons'
import { DayChipReplacement, FilterChipReplacement, ProgressPillReplacement, StatusLegendReplacement, WarningTriangleReplacement, WhosFreeChipReplacement } from './Chips'
import { PanelReplacement, StatTileReplacement } from './Containers'
import { BackLinkReplacement, PageSwitchReplacement, SubTabsReplacement, WebNavReplacement } from './Navigation'
import { SegmentedReplacement, SlidingSegmentedReplacement } from './Segmented'

export const replacements: SliceReplacements = {
  WebNav: {
    Component: WebNavReplacement,
    library: 'shadcn NavigationMenu (Base UI NavigationMenu) + Avatar',
    changes: [
      'Adds a labelled <nav> of real links; the active one carries aria-current="page"',
      'Keeps the logo, the 600 ink label and the crimson 3px underline on the active section (identity)',
      'Changes the hand-rolled initials disc to the kit Avatar (tint), still hidden from screen readers beside the name',
      'Adds the teal focus ring on each link',
    ],
    status: 'built',
  },
  AvailabilityPageSwitch: {
    options: [
      { label: 'Sliding white pill (as today)', Component: () => <PageSwitchReplacement look="pill" /> },
      {
        label: 'Underline tabs',
        Component: () => <PageSwitchReplacement look="line" />,
        note: 'The kit line tabs (ink underline), so it reads as page navigation, the same idiom as Accounts sub-tabs.',
      },
    ],
    library: 'shadcn Tabs (Base UI Tabs, tabs rendered as links) + Tabs.Indicator',
    changes: [
      'Changes the control to tabs whose tabs are links: href is the route, aria-current marks the current page',
      'Adds arrow-key movement between the two pages (Base UI Tabs)',
      'Keeps the slide with Base UI Tabs.Indicator (CSS variables) instead of the measured span',
      'Keeps the 320px width, 38px cells and teal selected text',
    ],
    status: 'built',
  },
  SubTabButton: {
    Component: SubTabsReplacement,
    library: 'shadcn Tabs (line)',
    changes: [
      'Adds tablist, tab and tabpanel roles with aria-selected and aria-controls',
      'Adds arrow, Home and End keys between tabs; one Tab stop for the bar',
      'Keeps the 500 slate rest and 600 ink active label with the 2px ink underline',
      'Adds a one-line panel per tab so the panels exist (the real screen puts its tables there)',
    ],
    status: 'built',
  },
  'Back link': {
    options: [
      { label: 'Back link only (as today)', Component: () => <BackLinkReplacement /> },
      {
        label: 'Breadcrumb',
        Component: () => <BackLinkReplacement breadcrumb />,
        note: 'Lists › the List you are on: the way back plus where you are (aria-current on the current page).',
      },
    ],
    library: 'shadcn Button (link) or shadcn Breadcrumb',
    changes: [
      'Changes the button to a real link (href to Lists), so it can open in a new tab',
      'Keeps the teal chevron and 14/600 label',
      'Adds the current List as the last crumb, named from the seed (Breadcrumb option)',
    ],
    status: 'built',
  },
  Panel: {
    Component: PanelReplacement,
    library: 'shadcn Card (CardHeader, CardTitle, CardAction, CardContent)',
    changes: [
      'Adds a real h2 for the title and makes the card a labelled region, so screen readers can jump between panels',
      'Keeps the 1px line, card radius, e1 shadow, 20px padding, 14px gap and the flush mode',
      'Changes the title row to a grid with CardAction on the right (same baseline alignment)',
    ],
    status: 'built',
  },
  StatTile: {
    Component: StatTileReplacement,
    library: 'shadcn Card (size sm) + Badge (success)',
    changes: [
      'Adds dt / dd semantics, so each figure is read with its label',
      'Keeps the flat bg tile, caps label, 24px mono value and the green change pill',
      'Changes the change pill to the success Badge (11px kept)',
      'Keeps the figures static: no NumberFlow (nothing on this screen changes live)',
    ],
    status: 'built',
  },
  SlidingSegmentedControl: {
    options: [
      { label: 'Sliding highlight (as today)', Component: () => <SlidingSegmentedReplacement /> },
      {
        label: 'No slide',
        Component: () => <SlidingSegmentedReplacement slide={false} />,
        note: 'The plain ToggleGroup: the selected cell switches without travelling; no Motion dependency.',
      },
    ],
    library: 'shadcn ToggleGroup (Base UI ToggleGroup, single) + Motion layoutId',
    changes: [
      'Adds roving focus and arrow keys; radiogroup and radio with aria-checked instead of aria-pressed buttons',
      'Keeps the three variants (surface, teal, ink) and one option always selected',
      'Keeps the slide as a Motion layoutId highlight (180 ms, card curve), honouring reduced motion',
      'Loses the hand-written measuring and ResizeObserver; layouts other than a row (two-column, wrap) need classes',
    ],
    status: 'built',
  },
  Segmented: {
    options: [
      { label: 'Sliding teal pill (as today)', Component: () => <SegmentedReplacement /> },
      {
        label: 'No slide',
        Component: () => <SegmentedReplacement slide={false} />,
        note: 'The selected teal pill switches without travelling.',
      },
    ],
    library: 'shadcn ToggleGroup (single), the same control as SlidingSegmentedControl',
    changes: [
      'Changes two segmented controls into one: Segmented is the merged control at its teal variant',
      'Adds roving focus, arrow keys and radio semantics, and an accessible name (GST period)',
      'Keeps the optional field label as a separate eyebrow, unchanged',
    ],
    status: 'built',
  },
  FilterChip: {
    options: [
      { label: 'Filled teal when on (as today)', Component: () => <FilterChipReplacement /> },
      {
        label: 'Teal tint when on',
        Component: () => <FilterChipReplacement on="tint" />,
        note: 'The kit toggle selection (teal tint, teal-pressed text): quieter, and the same as other toggles.',
      },
    ],
    library: 'shadcn ToggleGroup (Base UI ToggleGroup, single, outline)',
    changes: [
      'Adds radio semantics (aria-checked) and arrow keys; one Tab stop for the pair',
      'Keeps the 36px pills, the labels and today\'s free-session count from the seed',
      'Keeps one filter always on (an unpress is ignored)',
    ],
    status: 'built',
  },
  'StatusLegend (toggle mode)': {
    Component: StatusLegendReplacement,
    library: 'shadcn ToggleGroup (multiple) + Badge (status variants)',
    changes: [
      'Adds the toggle group keyboard model: one Tab stop, arrows between chips, Space or Enter toggles',
      'Keeps aria-pressed per chip, the faded and greyed off state and the Show / Hide title',
      'Changes each chip to the status Badge, coloured by its master token',
    ],
    status: 'built',
  },
  StatusChip: {
    options: [
      { label: 'Flat tint (as today)', Component: () => <StatusChipReplacement /> },
      {
        label: 'Hatched and dashed',
        Component: () => <StatusChipReplacement treatments />,
        note: 'Unavailable takes the hatched and Free the dashed block treatment, so the chip matches its block.',
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
  ProgressPill: {
    options: [
      { label: 'Tick for done (as today)', Component: () => <ProgressPillReplacement /> },
      {
        label: 'All Badges',
        Component: () => <ProgressPillReplacement done="badge" />,
        note: 'Ready to submit and Done · unbilled become success Badges with a check, so every state is one pill family.',
      },
    ],
    library: 'shadcn Badge (warning, default, success)',
    changes: [
      'Changes the hand-styled pills to Badge variants: To finish = warning, Invoiced and Authorised = default',
      'Keeps the labels from LIST_PROGRESS_LABEL and today\'s 12px pill size',
      'Keeps Upcoming rendering nothing',
    ],
    status: 'built',
  },
  WebDayChip: {
    options: [
      { label: 'Whole chip closes (as today)', Component: () => <DayChipReplacement /> },
      {
        label: 'Label with its own close',
        Component: () => <DayChipReplacement separate />,
        note: 'A teal-tint label holding the date, and a separate labelled X button: only the X acts.',
      },
    ],
    library: 'shadcn Button, or Badge + Button (ghost, icon-xs)',
    changes: [
      'Keeps the mono date, the X and the spoken label (long day, then what the click does)',
      'Adds the teal focus ring',
      'Changes the chip to a teal-tint Badge with a separate close button (second option), as Badges are never filled teal',
    ],
    status: 'built',
  },
  WarningTriangle: {
    options: [
      { label: 'Not focusable (as today)', Component: () => <WarningTriangleReplacement /> },
      {
        label: 'Focusable marker',
        Component: () => <WarningTriangleReplacement focusable />,
        note: 'Adds a Tab stop so keyboard users can open the tooltip; not safe inside a row button (nested interactive).',
      },
    ],
    library: 'shadcn Tooltip (Base UI Tooltip)',
    changes: [
      'Changes the title= text to a Tooltip listing each warning on its own line (Cleared heading when all are cleared)',
      'Keeps the disc, its colours (mild amber, strong red, cleared mist), the count and the role=img label',
      'Keeps the disc rather than a Badge: the marker anatomy is the day grid\'s corner marker',
    ],
    status: 'built',
  },
  "Who's free chip": {
    Component: WhosFreeChipReplacement,
    library: 'shadcn Tooltip (Base UI Tooltip trigger as the chip)',
    changes: [
      'Changes title= to a Tooltip on both chips, shown on hover and on keyboard focus',
      'Changes the plain span to an aria-disabled button, so its reason is reachable by keyboard',
      'Keeps the default status tint, the surname and the click (would open the move sheet)',
    ],
    status: 'built',
  },
  'IconBtn · NavButton · WeekNavButton': {
    options: [
      { label: 'Three sizes kept (as today)', Component: () => <IconButtonsReplacement /> },
      {
        label: 'One size (32px)',
        Component: () => <IconButtonsReplacement unified />,
        note: 'All three steppers at the kit icon-sm size: one button, one size.',
      },
    ],
    library: 'shadcn Button (outline, size icon)',
    changes: [
      'Changes three local button copies into one Button with an icon size',
      'Keeps the aria-label, the slate chevron and the disabled state at the horizon',
      'Adds hover, the teal focus ring and a real disabled button',
    ],
    status: 'built',
  },
  'Day stepper': {
    options: [
      { label: 'Spaced buttons (as today)', Component: () => <DayStepperReplacement /> },
      {
        label: 'Joined button group',
        Component: () => <DayStepperReplacement joined />,
        note: 'Previous, the day and Next share borders in a ButtonGroup; Today stays apart.',
      },
    ],
    library: 'shadcn Button + ButtonGroup',
    changes: [
      'Adds Left / Right arrow and T shortcuts while focus is in the stepper (aria-keyshortcuts on each button)',
      'Adds a polite live region on the day, so a step is announced',
      'Keeps the 38px buttons, the day pill and the teal-outlined Today',
    ],
    status: 'built',
  },
  LinkButton: {
    Component: LinkButtonReplacement,
    library: 'shadcn Button (variant link)',
    changes: [
      'Keeps the teal 13/600 text action inside the sentence',
      'Adds the teal-pressed hover and the focus ring',
      'Loses the per-call style object',
    ],
    status: 'built',
  },
  SubmitAction: {
    options: [
      { label: 'Swap, announced (as today plus live region)', Component: () => <SubmitActionReplacement /> },
      {
        label: 'Swap plus a toast',
        Component: () => <SubmitActionReplacement withToast />,
        note: 'Also confirms with a Sonner toast: "List submitted to the office".',
      },
    ],
    library: 'shadcn Button (outline, default) + Badge (success, default) + Tooltip, Sonner (option)',
    changes: [
      'Changes the blocked button\'s title= to a Tooltip',
      'Adds an announcement when the List is submitted (live region, or a toast)',
      'Keeps the four states, their copy and the 42px r12 shape (Badges sized up to match)',
      'Loses the real blockers and confirm sheets here: Mark list completed submits locally',
    ],
    status: 'built',
  },
  'Add a booking (dashed)': {
    Component: AddBookingButtonReplacement,
    library: 'shadcn Button (outline) with a dashed border class',
    changes: [
      'Keeps the full width, 1.5px dashed line-strong border, teal label and plus',
      'Adds hover and the teal focus ring',
      'Loses the real Add a booking dialog here (it writes to the store; the dialog is its own row)',
    ],
    status: 'built',
  },
  'Progress bar': {
    Component: ProgressBarReplacement,
    library: 'shadcn Progress (Base UI Progress)',
    changes: [
      'Adds role=progressbar with value, max and value text ("2 of 5 complete"), labelled by the count',
      'Keeps the 200px line track, the green bar and the 300 ms ease to the new width',
    ],
    status: 'built',
  },
}
