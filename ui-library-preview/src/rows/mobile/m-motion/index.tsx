import type { SliceReplacements } from '../../registry'
import { DateStripReplacement, LookbackDateSheetReplacement, MyCalendarGridReplacement } from './Calendars'
import { CompleteBarReplacement, SuccessOverlayReplacement, TickBadgeReplacement, TickingValueReplacement } from './Motion'
import { CollapsingMastheadReplacement, SlideStackReplacement, TimesCardReplacement } from './Screens'
import {
  AttachmentStripReplacement,
  BottomTabBarReplacement,
  ColleagueCellsReplacement,
  DockSpacerReplacement,
  HalfBlockReplacement,
  ListRowReplacement,
  MobileHeaderReplacement,
  OutOfHoursMoonReplacement,
  SubmitDockReplacement,
  WarningTriangleReplacement,
} from './Custom'

export const replacements: SliceReplacements = {
  // ── Dates ──────────────────────────────────────────────────────────────
  'MonthGrid (LookbackDateSheet)': {
    options: [
      {
        label: 'Month and year panel (as today)',
        Component: () => <LookbackDateSheetReplacement caption="panel" />,
        note: 'Our header on the Calendar: round previous and next, the title opens a year stepper over twelve month chips.',
      },
      {
        label: 'Dropdown caption (react-day-picker)',
        Component: () => <LookbackDateSheetReplacement caption="dropdown" />,
        note: 'The library caption: month and year selects plus its own arrows; no separate panel.',
      },
    ],
    library: 'shadcn Drawer + shadcn Calendar (react-day-picker)',
    changes: [
      'Changes the hand-written roving grid to DayPicker: arrows, Home and End, Page Up and Down, Shift for a year, grid roles',
      'Keeps the dot day content, the bounds (useLookbackBounds), the demo clock today in teal and the Today button',
      'Adds drag to dismiss, Escape and a focus trap from the Drawer; the title and line name the sheet',
      'Changes the month chips to a ToggleGroup (arrow keys between months) in the panel option',
    ],
    status: 'built',
  },
  'My calendar month grid': {
    Component: MyCalendarGridReplacement,
    library: 'shadcn Calendar (react-day-picker) with a custom DayButton and MonthCaption',
    changes: [
      'Adds the grid roles and DayPicker keyboard (arrows by day and week, Page Up and Down by month)',
      'Keeps the two half-blocks per day, the crimson today, past days dimmed, inert days without sessions',
      'Keeps the bounded previous and next buttons (today to the schedule horizon) and the screen-reader day labels',
      'Changes the month title to a heading with a polite live region',
    ],
    status: 'built',
  },
  '6-day date strip': {
    Component: DateStripReplacement,
    library: 'shadcn ToggleGroup (Base UI ToggleGroup)',
    changes: [
      'Changes six aria-pressed buttons to one single-select group with arrow-key roving focus',
      'Adds aria-current="date" on today and names the free session in each day\'s label (the dot was colour only)',
      'Keeps the teal selected day, mono date, uppercase weekday and the free dot',
      'Changes the dot on the selected day to a tint mix of the free token (no token for the light green)',
    ],
    status: 'built',
  },

  // ── Numbers ────────────────────────────────────────────────────────────
  useTickingValue: {
    options: [
      {
        label: 'Whole-figure tween (as today)',
        Component: () => <TickingValueReplacement engine="tween" />,
        note: 'Motion animates a motion value over 320ms with the same cubic ease-out; the figure re-renders each frame.',
      },
      {
        label: 'NumberFlow digit roll',
        Component: () => <TickingValueReplacement engine="numberflow" />,
        note: 'Each digit rolls on its own wheel; currency formatting by Intl (en-NZ, NZD narrow symbol).',
      },
    ],
    library: 'Motion (animate on a motion value) or NumberFlow',
    changes: [
      'Loses the hand-written requestAnimationFrame loop and its refs',
      'Keeps the 320ms ease-out roll, tabular mono figure and the green flash that decays over 240ms',
      'Keeps the instant jump under reduced motion (useReducedMotion; NumberFlow respects it itself)',
      'Changes the flash tint to a mix of the free token (no token for the 45% green)',
    ],
    status: 'built',
  },

  // ── Motion ─────────────────────────────────────────────────────────────
  SlideStack: {
    options: [
      {
        label: 'Edge swipe, touch only (as today)',
        Component: () => <SlideStackReplacement mouseCanDrag={false} />,
        note: 'The 28px edge zone starts a Motion drag only for touch and pen.',
      },
      {
        label: 'Edge swipe, mouse too',
        Component: () => <SlideStackReplacement mouseCanDrag />,
        note: 'A mouse can also drag from the left edge, so the gesture can be shown on a laptop.',
      },
    ],
    library: 'Custom on Motion (animate, drag controls)',
    changes: [
      'Changes the hand-written pointer tracking to Motion drag controls (x only, bounded, no momentum)',
      'Keeps all layers mounted, -24% parallax, 8% dim, 260ms card advance, the 35% or flick commit',
      'Adds focus on the new layer\'s heading after push and pop',
      'Changes parked layers to real `inert` (React 19 boolean), fixing the `inert: \'\'` that React 19 drops',
    ],
    status: 'custom',
    customReason: 'No library ships a stack navigator; rebuilt on Motion.',
  },
  SuccessOverlay: {
    options: [
      {
        label: 'Vanishes when hidden (as today)',
        Component: () => <SuccessOverlayReplacement exitFade={false} />,
        note: 'The owner unmounts it after 1050ms and it disappears at once.',
      },
      {
        label: 'Fades out (AnimatePresence)',
        Component: () => <SuccessOverlayReplacement exitFade />,
        note: 'AnimatePresence plays the 200ms flood fade in reverse on the way out.',
      },
    ],
    library: 'Custom on Motion',
    changes: [
      'Changes the CSS keyframes to Motion: flood fade 200ms, circle pop 420ms, tick draw 360ms after 60ms',
      'Keeps the haptic at 200ms, the role=status title and line, and the late-arming full-surface Dismiss',
      'Keeps the 80ms reduced-motion collapse (useReducedMotion)',
    ],
    status: 'custom',
    customReason: 'AA\'s one standout moment; choreography kept, rebuilt on Motion.',
  },
  TickBadge: {
    Component: TickBadgeReplacement,
    library: 'Custom on Motion',
    changes: [
      'Changes aa-tick-draw and aa-tick-pulse keyframes to Motion pathLength and scale',
      'Keeps the sizes, success tint, 360ms draw after 60ms and the 1 to 1.04 to 1 pulse over 420ms',
      'Keeps the still, drawn tick when not animated; reduced motion skips the pulse',
    ],
    status: 'custom',
    customReason: 'A brand motion mark, no library equivalent; rebuilt on Motion.',
  },
  'Collapsing masthead': {
    options: [
      {
        label: 'Folds past 24px (as today)',
        Component: () => <CollapsingMastheadReplacement mode="threshold" />,
        note: 'Two thresholds (fold past 24, unfold below 6); Motion animates the fold over 240ms.',
      },
      {
        label: 'Folds with the scroll',
        Component: () => <CollapsingMastheadReplacement mode="linked" />,
        note: 'useScroll and useTransform tie the fold to the first 48px of scroll, iOS large-title style.',
      },
    ],
    library: 'Custom on Motion (scroll-driven)',
    changes: [
      'Changes the max-height and max-width CSS transitions to Motion height and opacity',
      'Changes the large title to a real heading and takes History out of the tab order while folded',
      'Keeps the back action, the nav-row name and Private chip, and the capture cards below',
      'Loses the measured dock and the rest of MobileBookingLayout (this row is about the fold)',
    ],
    status: 'custom',
    customReason: 'Scroll-driven chrome, no library component; rebuilt on Motion.',
  },
  TimesCard: {
    Component: TimesCardReplacement,
    library: 'shadcn Card + Button, travel on Motion (layout)',
    changes: [
      'Changes the translateX slider to a Motion layout animation between the two cells (260ms)',
      'Keeps Start now and Finish now stamping the demo clock, the five-minute rules and the -5 and +5 nudges',
      'Changes the writes to local state (the store is never written); adds Start again to reset',
      'Adds labels to the nudges ("Start 5 minutes earlier"); loses the compact desktop layout and failure notes',
    ],
    status: 'built',
  },
  CompleteBar: {
    options: [
      {
        label: 'Instant swap (as today)',
        Component: () => <CompleteBarReplacement pop={false} />,
        note: 'The success bar replaces the button with no animation.',
      },
      {
        label: 'Bar fades in, tick draws',
        Component: () => <CompleteBarReplacement pop />,
        note: 'Motion fades the bar in (200ms) and draws its tick on the complete-tick timing.',
      },
    ],
    library: 'shadcn Button; success state custom on Motion',
    changes: [
      'Changes the CTA to Button cta at 56px with e2, and Amend to Button link',
      'Adds role=status on the success bar so the change is announced',
      'Keeps the success tint, drawn tick and Amend while the List is open',
    ],
    status: 'built',
  },

  // ── Stays custom ───────────────────────────────────────────────────────
  BottomTabBar: {
    Component: BottomTabBarReplacement,
    library: 'Custom nav of links (no library component)',
    changes: [
      'Changes four plain buttons to a nav of links with aria-current="page"',
      'Keeps the frosted bar, four icons and labels, teal active and mist idle',
      'Adds a visible focus ring on each tab',
    ],
    status: 'custom',
    customReason: 'App chrome with no library equivalent; rebuilt as a semantic nav.',
  },
  MobileHeader: {
    Component: MobileHeaderReplacement,
    library: 'Custom + shadcn Avatar',
    changes: [
      'Changes the large title from a div to a real h1, inside a header',
      'Changes the avatar to Avatar elevated at 44px (white chip, crimson initials)',
      'Keeps the micro-caps eyebrow and the type sizes',
    ],
    status: 'custom',
    customReason: 'A layout, not a component; kept, with the title as a heading.',
  },
  ListRow: {
    Component: ListRowReplacement,
    library: 'Custom on shadcn Item (status rail stays ours)',
    changes: [
      'Changes the row shell to Item (outline) rendered as a button when it opens something',
      'Changes the right-hand pills to Badge (default, warning, status tints) and the done tick to the Motion TickBadge',
      'Keeps the status rail, session column, moon for out-of-hours, open and closed fills and the quiet row',
      'Changes the holiday row edge to a mix of the holiday token (no token for it)',
    ],
    status: 'custom',
    customReason: 'Domain row; the status rail and fills stay ours on an Item shell.',
  },
  'Sticky submit dock': {
    Component: SubmitDockReplacement,
    library: 'Custom fixed footer with shadcn Button; ToggleGroup for the demo control',
    changes: [
      'Changes the two dock actions to Button cta (teal ready, line-grey to finish)',
      'Adds role=status on the Submitted bar',
      'Keeps the frosted footer, the four states, the tick pop on Submitted and the inset-aware bottom padding',
    ],
    status: 'custom',
    customReason: 'Screen chrome; the footer stays ours with library buttons inside.',
  },
  DockSpacer: {
    Component: DockSpacerReplacement,
    library: 'Custom (kept; part of the inset contract)',
    changes: ['Keeps the in-flow spacer exactly (aria-hidden, flex none, explicit height)', 'Changes only its styling to theme utilities'],
    status: 'custom',
    customReason: 'A layout fix for WebKit scroll extent; no library concern.',
  },
  'Colleague AM / PM cells': {
    options: [
      {
        label: 'Tooltip on hover and focus',
        Component: () => <ColleagueCellsReplacement tip="tooltip" />,
        note: 'Base UI Tooltip: the full cell text on hover or keyboard focus; a phone never shows it.',
      },
      {
        label: 'Tap opens a Popover',
        Component: () => <ColleagueCellsReplacement tip="popover" />,
        note: 'Base UI Popover: a tap on a status cell shows the full text; Escape or a tap away closes it.',
      },
    ],
    library: 'Custom status cells + shadcn Tooltip or Popover, Avatar, Badge',
    changes: [
      'Adds the full cell text (truncated today) behind a Tooltip or a Popover, the hospital named once',
      'Changes the colleague initials to Avatar (tint) and the free chip to Badge',
      'Keeps the hatched and dashed fills, the move-target buttons and the free-first sort',
      'Changes status cells into focusable triggers (a tab stop each)',
    ],
    status: 'custom',
    customReason: 'Domain visuals (hatched and dashed status cells) stay ours.',
  },
  HalfBlock: {
    options: [
      {
        label: 'Tooltip on hover and focus',
        Component: () => <HalfBlockReplacement tip="tooltip" />,
        note: 'Replaces the title attribute; still never shows on touch.',
      },
      {
        label: 'Tap opens a Popover',
        Component: () => <HalfBlockReplacement tip="popover" />,
        note: 'A tap shows the session and its status, so a phone can read it.',
      },
    ],
    library: 'Custom + shadcn Tooltip or Popover',
    changes: [
      'Changes the title attribute to a Tooltip or Popover with the session, status, series and flag',
      'Keeps the block fill, the repeat glyph and the amber ! flag',
      'Adds a focus stop per block in this row (inside the month grid the day button is the stop)',
    ],
    status: 'custom',
    customReason: 'A domain bar; kept, with a library tip.',
  },
  WarningTriangle: {
    options: [
      {
        label: 'Label only (as today)',
        Component: () => <WarningTriangleReplacement tooltip={false} />,
        note: 'Not interactive (US-13.7.3): role=img with its label; the title attribute shows the text on hover.',
      },
      {
        label: 'Tooltip on hover and focus',
        Component: () => <WarningTriangleReplacement tooltip />,
        note: 'Adds a tab stop so the text is reachable by keyboard; it must not sit inside another button.',
      },
    ],
    library: 'Custom + shadcn Tooltip',
    changes: [
      'Keeps the disc in the strongest open warning\'s colour, the white triangle and the open count',
      'Changes the colours to the warning, error and mist tokens',
      'Adds a keyboard-reachable Tooltip in the second option (a tab stop the first does not have)',
    ],
    status: 'custom',
    customReason: 'A domain marker; kept, optionally with a Tooltip.',
  },
  OutOfHoursMoon: {
    Component: OutOfHoursMoonReplacement,
    library: 'Custom (lucide Moon, kept)',
    changes: ['Keeps the lucide Moon in a 20px box with the caller\'s colour and size', 'Changes the colour prop to a class (theme text tokens)'],
    status: 'custom',
    customReason: 'One icon in a box; nothing to replace.',
  },
  AttachmentStrip: {
    Component: AttachmentStripReplacement,
    library: 'Custom with shadcn Button, Badge and Alert',
    changes: [
      'Changes the remove mark to a 44px ghost Button around the 24px disc, always shown on the phone',
      'Changes the strip to a labelled list and the PDF chip to Badge; a refusal shows as a destructive Alert',
      'Keeps the refusal message under the strip, now a destructive Alert (role=alert)',
      'Loses the comparison the research asked for: no shadcn Attachment or Dropzone is installed (preview thumbs are token-tinted stand-ins)',
    ],
    status: 'custom',
    customReason: 'No attachment or dropzone component is installed; kept on library parts.',
  },
}
