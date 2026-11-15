import type { FitFile } from './index'

export const fit: FitFile = {
  app: 'mobile',
  ratings: {
    // ── pilot ──────────────────────────────────────────────────────────────
    BottomSheet: {
      score: 3,
      why: 'Drawer behaviour is stock, but the kit Drawer is reshaped and this option hides its handle to draw our own DrawerClose handle, plus a keyboard-inset style.',
    },

    // ── m-sheets ───────────────────────────────────────────────────────────
    ListOptionsSheet: {
      score: 3,
      why: 'Stock Drawer, but the option rows are hand-built buttons with our 60px anatomy, icon tiles and several ! overrides; the menu option fights the label styles too.',
    },
    AlertOfficeSheet: {
      score: 4,
      why: 'Drawer, Field, Textarea and FieldError with RHF and Zod in the standard pattern; only the counter, padding wrapper and keyboard inset are ours.',
    },
    SubmitListSheet: {
      score: 4,
      why: 'Stock Drawer with DrawerTitle, DrawerDescription and DrawerClose; the blocker rows are a plain styled list inside it.',
    },
    AvailabilityEditor: {
      score: 2,
      why: 'ToggleGroups are forced to radio roles with aria-pressed removed, heavy rounded-pill! and data-pressed! overrides, a Motion pill and hand-built session panel.',
    },
    'Button (MobileButton)': {
      score: 3,
      why: 'Row only picks variants, but they are kit additions (cta, pill) on a rewritten Button, and the press sink stock had is re-added by utilities.',
    },
    'Mobile press feedback (:active)': {
      score: 3,
      why: 'Plain Tailwind active: utilities with long arbitrary values re-adding a press the kit Button removed; the container option reaches into every button.',
    },
    SlidingSegmentedControl: {
      score: 2,
      why: 'ToggleGroup keyboard is stock, but roles are swapped to radiogroup and radio, data-pressed is cancelled with ! and a Motion layoutId pill paints the selection.',
    },
    Segmented: {
      score: 2,
      why: 'Same bent ToggleGroup as the sliding control (custom radio ARIA, ! overrides, Motion pill), with a stock FieldLabel on top.',
    },
    'Filter chips (Week / Month / To-Do / Done)': {
      score: 2,
      why: 'Outline ToggleGroup with its ARIA replaced by radiogroup and radio roles and a long class string with rounded-pill! to rebuild our chips.',
    },
    StepperButton: {
      score: 3,
      why: 'Stock outline icon Button, but resized to 44px with rounded-[12px]!, slate glyph and press utilities; the live region and group are ours.',
    },
    NudgeButton: {
      score: 4,
      why: 'Stock outline Button with a few size and colour classes; accessible names and the live region are plain markup.',
    },
    CaptureSection: {
      score: 3,
      why: 'Card parts are stock, but its shadow, footer rule and band are switched off with overrides (pb-4!, --card-spacing) and the eyebrow heading is hand-styled.',
    },
    'ToggleRow (switch)': {
      score: 4,
      why: 'Stock Switch behaviour wrapped in a label row; the kit reshaped the Switch to the 52 by 32 iOS proportions.',
    },
    InstallCoach: {
      score: 3,
      why: 'Alert and AlertAction are stock parts, restyled to a teal-outlined card with pr-4!, a repositioned action and role changed to note.',
    },

    // ── m-cards ────────────────────────────────────────────────────────────
    StatusChip: {
      score: 4,
      why: 'The row only picks Badge variants, but those six status variants were added when the kit replaced the Badge variant table.',
    },
    ProgressPill: {
      score: 3,
      why: 'Warning and default Badges with padding overrides; the done states use a bare Badge (transparent, px-0) as scaffolding for the custom TickBadge.',
    },
    OutOfHoursPill: {
      score: 4,
      why: 'Default Badge with an inline-start icon; a few type and padding tweaks and one ! on the icon size.',
    },
    AgeChip: {
      score: 4,
      why: 'Default and warning Badge variants; size tweaks, mono figures and one custom pre-op tint class for ACC.',
    },
    DayChip: {
      score: 3,
      why: 'Badge rendered as a button through useRender, then fully restyled to a 44px teal button with hover, active and icon ! overrides.',
    },
    Avatar: {
      score: 4,
      why: 'Avatar and AvatarFallback on the kit elevated variant; only the per-size box and text! overrides are ours.',
    },
    'Hero figure card': {
      score: 3,
      why: 'Card used as a shell: flex-row, rounded-panel!, shadow switched off, and the icon, label and figure are hand-built markup inside.',
    },
    EmptyCard: {
      score: 3,
      why: 'Empty and EmptyDescription, but the dashed borderless default is overridden to a solid line card with custom padding and type.',
    },
    MovedToYouPanel: {
      score: 3,
      why: 'Card plus an Item list is stock composition, but card spacing, shadow and Item border, line-clamp and padding are all overridden.',
    },
    'Booking card (Capture pill)': {
      score: 3,
      why: 'Outline Item as a button, with self-center! and translate-y-0! fixes, a restyled Capture Badge and the custom TickBadge; both options score the same.',
    },
    'Progress bar': {
      score: 3,
      why: 'Progress semantics stock, but the inline layout recolours track and indicator through descendant part selectors; the shadcn label-above option is a 4.',
    },
    LookbackSearchRow: {
      score: 3,
      why: 'InputGroup addons in the shared search look need rounded-pill! and inner resets; the calendar Button gets a 1.5px teal border and icon size!.',
    },
    'LookbackResults (ResultRow)': {
      score: 3,
      why: 'Outline Items as buttons in a list, with self-center!, translate-y-0! and line-clamp overrides; WarningTriangle and the progress Badge sit inside.',
    },
    SeriesList: {
      score: 3,
      why: 'Item rows need translate-y-0!, self-center! and a px-1! link Button; the recommended Drawer confirm and the AlertDialog option are near stock.',
    },
    UpdatePrompt: {
      score: 3,
      why: 'Stock toast() with an action, but the kit Sonner is rewritten (theme locked, ! overrides); the teal pill option is a 2 (toast.custom, unstyled, ! resets).',
    },
    BookingDetailBody: {
      score: 2,
      why: 'RHF and Zod are stock, but Base UI NumberField is hand-wired to Buttons, time cells, the RVG card and the sticky bar are custom markup.',
    },
    TextField: {
      score: 4,
      why: 'Field, FieldLabel, Input and FieldDescription composed as shipped; the kit FieldLabel was reshaped into our uppercase eyebrow.',
    },
    TextArea: {
      score: 4,
      why: 'Field, FieldLabel and Textarea composed as shipped; the eyebrow label and no-resize box come from the kit re-skin.',
    },
    FormError: {
      score: 4,
      why: 'The standard RHF FieldError pattern with aria-invalid; only the demo toggle forcing setError is extra. The Alert option is also a 4.',
    },

    // ── m-motion ───────────────────────────────────────────────────────────
    'MonthGrid (LookbackDateSheet)': {
      score: 2,
      why: 'Calendar keyboard is stock, but a custom DayButton with manual focus and rebuilt classNames draw our day cells; the panel option adds our own caption too.',
    },
    'My calendar month grid': {
      score: 2,
      why: 'DayPicker grid and keyboard are stock; the DayButton with two half-blocks, the MonthCaption and the classNames layout are all ours.',
    },
    '6-day date strip': {
      score: 3,
      why: 'ToggleGroup behaviour stock, items rebuilt into stacked day tiles with group-data colours, rounded-[12px]! and a color-mix dot.',
    },
    useTickingValue: {
      score: 2,
      why: 'Motion tweens a motion value as intended, but the tile, flash hook and per-frame state are ours; the NumberFlow option is closer to a 3.',
    },
    SlideStack: {
      score: 1,
      why: 'Stays custom: no library ships a stack navigator; rebuilt on Motion drag controls with our parallax, dim and commit rules.',
    },
    SuccessOverlay: {
      score: 1,
      why: 'Stays custom: AA\'s completion moment, its choreography rebuilt on Motion with no library component behind it.',
    },
    TickBadge: {
      score: 1,
      why: 'Stays custom: a brand motion mark redrawn with Motion pathLength and scale; no library equivalent.',
    },
    'Collapsing masthead': {
      score: 1,
      why: 'Stays custom: scroll-driven chrome rebuilt on Motion height and opacity; no library component.',
    },
    TimesCard: {
      score: 2,
      why: 'Card and Buttons are stock parts, but the travelling action is an absolutely placed Motion layout element with a rounded-[12px]! 96px Button.',
    },
    CompleteBar: {
      score: 2,
      why: 'The done bar, its tick and the py-1! Amend link are our own markup on Motion; only the kit cta Button doing the main action is library.',
    },
    BottomTabBar: {
      score: 1,
      why: 'Stays custom: app chrome with no library equivalent; a hand-built frosted nav of links.',
    },
    MobileHeader: {
      score: 1,
      why: 'Stays custom: a layout, not a component; only the stock elevated Avatar comes from the kit.',
    },
    ListRow: {
      score: 2,
      why: 'Item is only the shell: status rail, session column and status fills are ours, set by inline styles and rounded-card! overrides.',
    },
    'Sticky submit dock': {
      score: 1,
      why: 'Stays custom: a frosted fixed footer and success bar of our own; library Buttons sit inside, one restyled to the grey to-finish state.',
    },
    DockSpacer: {
      score: 1,
      why: 'Stays custom: a WebKit scroll-extent spacer with no library concern.',
    },
    'Colleague AM / PM cells': {
      score: 2,
      why: 'Popover, Avatar and Badge are stock, but the hatched status cells are ours as div role=button triggers with nativeButton off.',
    },
    HalfBlock: {
      score: 2,
      why: 'The block fill is ours; a span role=button trigger feeds a stock Popover, so the library gives only the tip.',
    },
    WarningTriangle: {
      score: 1,
      why: 'Stays custom: a domain marker drawn by hand; the Tooltip option adds a stock Tooltip and would score 2.',
    },
    OutOfHoursMoon: {
      score: 1,
      why: 'Stays custom: one lucide Moon in a 20px box; nothing to replace.',
    },
    AttachmentStrip: {
      score: 1,
      why: 'Stays custom: the thumbs are ours; a ghost Button with hover:bg-transparent wraps a custom disc and the PDF Badge is restyled; the Alert is stock.',
    },
  },
}
