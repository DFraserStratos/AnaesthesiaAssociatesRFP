import type { SliceReplacements } from '../../registry'
import { TickButtonReplacement } from './TickButton'
import { SlidingSegmentedReplacement } from './SlidingSegmented'
import { FocusFiltersReplacement, StatusLegendReplacement } from './Filters'
import { IntegrationTabsReplacement, MastersSubNavReplacement, SideNavReplacement, TabLinkReplacement } from './Navigation'
import { DayNavReplacement } from './DayNav'
import { MasterPillsReplacement, PairingPillsReplacement, PillReplacement } from './Pills'
import {
  ChangedSinceSubmittedReplacement,
  ConflictDotReplacement,
  DraftListPartsReplacement,
  WarningTriangleReplacement,
} from './Marks'

export const replacements: SliceReplacements = {
  TickButton: {
    options: [
      { label: 'Teal outline (as today)', Component: () => <TickButtonReplacement look="teal-outline" /> },
      {
        label: 'Teal tint (secondary)',
        Component: () => <TickButtonReplacement look="tint" />,
        note: 'Uses the kit secondary variant (teal tint, no border) instead of a one-off teal outline, so no extra Button variant is needed.',
      },
    ],
    library: 'shadcn Button (outline, check icon)',
    changes: [
      'Keeps the two sizes (36 and 30 tall), the check and the per-use accessible name',
      'Adds a teal focus ring and a teal-tint hover',
      'Changes the teal outline from inline styles to classes on the outline variant (option 1)',
    ],
    status: 'built',
  },
  SlidingSegmentedControl: {
    options: [
      {
        label: 'ToggleGroup, Motion slide (as today)',
        Component: () => <SlidingSegmentedReplacement kind="toggle" />,
        note: 'Single-select ToggleGroup with radio semantics; the selected pill is a Motion layoutId that slides 180 ms on the card easing.',
      },
      {
        label: 'Tabs, Base UI indicator',
        Component: () => <SlidingSegmentedReplacement kind="tabs" />,
        note: 'Base UI Tabs with its own Tabs.Indicator (CSS variables plus a CSS transition): no Motion, but tab semantics for a value choice.',
      },
    ],
    library: 'Base UI ToggleGroup + Motion layoutId, or Base UI Tabs + Tabs.Indicator',
    changes: [
      'Keeps the sliding pill and the teal, surface and ink looks',
      'Adds roving focus: one Tab stop, arrow keys between options',
      'Changes aria-pressed buttons to radiogroup and radio (option 1) or tablist and tab (option 2)',
      'Loses the hand-measured offset and ResizeObserver code',
    ],
    status: 'built',
  },
  'StatusLegend (chips)': {
    Component: StatusLegendReplacement,
    library: 'Base UI ToggleGroup (multiple) + shadcn Badge (status variants)',
    changes: [
      'Keeps the keys from the status master, the fade and grey of a hidden status, and the Hide or Show title',
      'Adds roving focus: one Tab stop for the legend, arrow keys between chips',
      'Changes the per-chip resolved hex to the Badge variant for the status colour token',
    ],
    status: 'built',
  },
  'SignalFilterButton (DayGrid focus filters)': {
    options: [
      {
        label: 'Separate toggles (as today)',
        Component: () => <FocusFiltersReplacement keyboard="separate" />,
        note: 'Four standalone Base UI Toggles in a labelled group: each is its own Tab stop, as today.',
      },
      {
        label: 'One ToggleGroup, arrow keys',
        Component: () => <FocusFiltersReplacement keyboard="group" />,
        note: 'The four filters become one multiple ToggleGroup: one Tab stop, arrow keys between filters.',
      },
    ],
    library: 'Base UI Toggle / ToggleGroup (multiple) + shadcn Button (link)',
    changes: [
      'Keeps the four glyphs, the warning tint when on, and Reset filters only while something is filtered',
      'Keeps the status chips in the same footer (as the StatusLegend row)',
      'Changes aria-pressed buttons to Base UI Toggles (same aria-pressed, plus data-pressed for styling)',
      'Leaves out the grid body (an empty roster, as the current row) and keeps the timeline header only as a plain static stand-in',
    ],
    status: 'partial',
  },
  'SideNav (with RolesInfo)': {
    options: [
      { label: 'Roles dialog, no corner X (as today)', Component: () => <SideNavReplacement /> },
      {
        label: 'Roles dialog, corner X',
        Component: () => <SideNavReplacement closeX />,
        note: 'The read-only Roles dialog gets the kit corner close button; today only Escape or the scrim close it.',
      },
    ],
    library: 'Base UI NavigationMenu (vertical) + shadcn Dialog, Badge, Avatar (shadcn Sidebar not installed)',
    changes: [
      'Adds a labelled nav of real links with aria-current on the open section, and arrow keys between items',
      'Keeps the ink ground, the crimson active marker and the crimson and amber count badges, via the --sidebar tokens',
      'Adds focus trap, focus return and Escape to the Roles dialog',
      'Changes the ADMIN eyebrow from #D89AA9 to the brand tint (no token for the old pink)',
    ],
    status: 'built',
  },
  'Master data sub-nav': {
    Component: MastersSubNavReplacement,
    library: 'Base UI NavigationMenu (vertical)',
    changes: [
      'Keeps the real MASTERS_NAV labels and the teal-tint current row',
      'Changes buttons to links with aria-current, inside a labelled nav',
      'Adds arrow keys between items and a sunken hover on the rest',
    ],
    status: 'built',
  },
  'TabButton (Integrations)': {
    options: [
      {
        label: 'Arrows move focus, Enter picks',
        Component: () => <IntegrationTabsReplacement activateOnFocus={false} />,
        note: 'Base UI default (manual activation): arrow keys move focus along the tabs; Enter or Space opens one. Closest to today\'s click-only buttons.',
      },
      {
        label: 'Arrows switch the tab',
        Component: () => <IntegrationTabsReplacement activateOnFocus />,
        note: 'Automatic activation: the tab opens as focus lands on it.',
      },
    ],
    library: 'shadcn Tabs (line variant) + Badge',
    changes: [
      'Adds tablist, tab and tabpanel roles with arrow keys',
      'Keeps the ink underline and the Future scope badges on Messages and Feed config',
      'Leaves out the tab bodies (not exported, and some write to the store): each panel is a one-line stand-in',
    ],
    status: 'partial',
  },
  'TabLink (AA fees)': {
    options: [
      {
        label: 'Links with aria-current (as today)',
        Component: () => <TabLinkReplacement as="links" />,
        note: 'A labelled nav of links in the line-tab look: right for routes, which these are.',
      },
      {
        label: 'shadcn Tabs',
        Component: () => <TabLinkReplacement as="tabs" />,
        note: 'Tabs (line variant): tablist roles and arrow keys, but a route change is not a tab panel.',
      },
    ],
    library: 'Links in the shadcn Tabs line look, or shadcn Tabs',
    changes: [
      'Keeps the ink underline and the two labels',
      'Changes the router link to an anchor with aria-current inside a labelled nav (option 1)',
      'Adds arrow keys and tab roles (option 2 only)',
    ],
    status: 'built',
  },
  'DayNav (with SortToggle)': {
    options: [
      {
        label: 'Native date input (as today)',
        Component: () => <DayNavReplacement datePicker="native" />,
        note: 'The browser date input, bounded by the horizon, styled as the kit Input.',
      },
      {
        label: 'Calendar popover',
        Component: () => <DayNavReplacement datePicker="calendar" />,
        note: 'A button opening shadcn Calendar in a Popover: Monday-first, today marked, days past the horizon disabled.',
      },
    ],
    library: 'shadcn Button + ToggleGroup (teal) + Input, or Popover + Calendar',
    changes: [
      'Adds spoken labels to the glyph and week buttons ("Previous day", "Back 4 weeks")',
      'Changes SortToggle to a single-select ToggleGroup with radio semantics and arrow keys',
      'Changes the glyph steppers to Lucide chevrons',
      'Keeps separate buttons with 8px gaps (no joined Button Group, to keep the look)',
    ],
    status: 'built',
  },
  Pill: {
    Component: PillReplacement,
    library: 'shadcn Badge (default, success)',
    changes: [
      'Keeps the neutral and success tints and the 11.5 / 18 anatomy',
      'Changes the small size to a class on the Badge (no size variant in the kit)',
    ],
    status: 'built',
  },
  MasterPills: {
    Component: MasterPillsReplacement,
    library: 'shadcn Badge',
    changes: [
      'Changes the import: MasterPills is a re-export, so callers use Badge directly and the file is deleted',
      'Keeps the same tones and labels',
    ],
    status: 'built',
  },
  'TierPill / PreferredPill / NotPreferredPill': {
    options: [
      { label: 'Preferred in teal tint (as today)', Component: () => <PairingPillsReplacement preferredLook="teal-tint" /> },
      {
        label: 'Preferred in success tint',
        Component: () => <PairingPillsReplacement preferredLook="success" />,
        note: 'Keeps teal for actions only: Preferred takes the success Badge, as the Pill rule says no label uses the action tint.',
      },
    ],
    library: 'shadcn Badge (default, outline, success)',
    changes: [
      'Keeps the tier labels and pairing words from the one label set',
      'Changes Not preferred to the outline Badge with a warning border and on-tint text',
      'Changes the 11 / 16 pairing size to a class on the Badge',
    ],
    status: 'built',
  },
  ChangedSinceSubmittedPill: {
    Component: ChangedSinceSubmittedReplacement,
    library: 'shadcn Badge (outline) + Tooltip',
    changes: [
      'Adds a Tooltip the keyboard can reach (the badge takes focus) in place of the title attribute',
      'Keeps the pen icon, the mono count and the warning-tinted outline',
      'Adds the detail as aria-description for screen readers',
    ],
    status: 'built',
  },
  DraftListParts: {
    Component: DraftListPartsReplacement,
    library: 'shadcn Badge (warning, default) + Tooltip',
    changes: [
      'Keeps the Unassigned flag with its dot, the DRAFT chip, the live waiting time from the demo clock and the mono booking count',
      'Changes the over-a-day title to a Tooltip, reachable by keyboard',
      'Keeps every word from scheduleTerms',
    ],
    status: 'built',
  },
  ConflictDot: {
    Component: ConflictDotReplacement,
    library: 'shadcn Badge (round)',
    changes: [
      'Keeps the warning solid "!" and the mist muted state, at any size',
      'Keeps it decorative (aria-hidden): the text beside it names the conflict, so no Tooltip',
    ],
    status: 'built',
  },
  WarningTriangle: {
    options: [
      {
        label: 'Not interactive (as today)',
        Component: () => <WarningTriangleReplacement tooltip={false} />,
        note: 'A labelled image with a title, safe inside a row button (US-13.7.3 removed tap-to-read).',
      },
      {
        label: 'Tooltip, keyboard reachable',
        Component: () => <WarningTriangleReplacement tooltip />,
        note: 'A focusable Tooltip trigger listing the warnings; inside a row button it would nest an interactive element.',
      },
    ],
    library: 'shadcn Badge (round) + Tooltip',
    changes: [
      'Keeps the strongest-open colour (amber, red, mist when cleared) and the open count',
      'Changes the tone hexes to the warning, error and mist tokens',
      'Adds keyboard reach to the warning text (option 2 only)',
    ],
    status: 'built',
  },
}
