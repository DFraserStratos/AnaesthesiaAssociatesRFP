import type { FitFile } from './index'

export const fit: FitFile = {
  app: 'admin',
  ratings: {
    // pilot-a
    Button: {
      score: 3,
      why: 'Row only picks variants, but the kit Button was rewritten: every variant restyled, a pill variant and 54px cta size added, and the 44px pill still needs a class.',
    },
    StatusChip: {
      score: 4,
      why: 'Pure composition of the kit Badge status variants, the intended cva route; held at 4 because the kit replaced the stock Badge variant table.',
    },
    Segmented: {
      score: 2,
      why: 'Kit ToggleGroup render logic rewritten for the teal track; the row swaps its ARIA for radiogroup and radio and blocks unpressing by hand.',
    },
    'Dialog (useSurface().Overlay)': {
      score: 4,
      why: 'Stock Dialog parts and behaviour with the corner X; the kit swaps motion and sizes, and the row only adds a 54px Cancel height and header gap.',
    },
    'Inline success banner (role=status)': {
      score: 3,
      why: 'Sonner toast API used as is (neutral option), but the kit Toaster locks the theme and restyles toast, title and action through ! overrides.',
    },

    // a-controls
    TickButton: {
      score: 3,
      why: 'Stock secondary Button variant, but both sizes are arbitrary heights, padding and type with ! icon-size overrides.',
    },
    SlidingSegmentedControl: {
      score: 2,
      why: 'Raw Base UI ToggleGroup as scaffolding: hand-written track and cell classes, ARIA swapped to radio, and a Motion layoutId pill for the slide.',
    },
    'StatusLegend (chips)': {
      score: 3,
      why: 'Stock multiple ToggleGroup behaviour; each Toggle is restyled to a bare wrapper around a status Badge, faded and greyed by group selectors.',
    },
    'SignalFilterButton (DayGrid focus filters)': {
      score: 2,
      why: 'Stock Base UI ToggleGroup behaviour, but each pill is one long custom class, the glyphs are hand drawn spans and Reset is a link Button with ! padding.',
    },
    'SideNav (with RolesInfo)': {
      score: 3,
      why: 'NavigationMenu turned vertical (no shadcn Sidebar) with long link classes, an inset crimson marker and recoloured Badges; Dialog and Avatar near stock.',
    },
    'Master data sub-nav': {
      score: 3,
      why: 'NavigationMenu forced vertical, links restyled and the active row restated for hover, focus and data-active to beat the kit look.',
    },
    'TabButton (Integrations)': {
      score: 3,
      why: 'Stock Tabs behaviour and line variant, but the kit rewrote both Tabs variants and the Future scope Badge is a heavy arbitrary-value restyle.',
    },
    'TabLink (AA fees)': {
      score: 1,
      why: 'Recommended links option uses no library: a plain nav of anchors with a hand-written line-tab class. The Tabs option would score about 4.',
    },
    'DayNav (with SortToggle)': {
      score: 3,
      why: 'Calendar in Popover is near stock, but the outline Buttons are recoloured teal by class and the sort ToggleGroup has ARIA swapped and ! radius.',
    },
    Pill: {
      score: 4,
      why: 'Badge default and success used as given; the small size is one class, though both tints come from the kit\'s replaced Badge variants.',
    },
    MasterPills: {
      score: 4,
      why: 'Bare Badge default and success with no classes at all; only held off a 5 because the kit replaced the stock Badge variants.',
    },
    'TierPill / PreferredPill / NotPreferredPill': {
      score: 4,
      why: 'Success, default and outline Badges with a size class; Not preferred adds a warning border and text colour by class.',
    },
    ChangedSinceSubmittedPill: {
      score: 3,
      why: 'Stock Tooltip around an outline Badge, but the Badge is made focusable and restyled with arbitrary padding, border tint and ! icon size.',
    },
    DraftListParts: {
      score: 3,
      why: 'Warning and default Badges plus a stock Tooltip, but the dot, mono waiting time and count are hand-styled spans with arbitrary sizes.',
    },
    ConflictDot: {
      score: 1,
      why: 'Badge is only a span here: padding zeroed, colours overridden and width, height and font size set by inline style.',
    },
    WarningTriangle: {
      score: 1,
      why: 'Badge reduced to a bare disc by inline sizes inside a hand-built role=img span with a title; the Tooltip option would score 2.',
    },

    // a-overlays
    'MasterPanel / PanelGrid / PanelSection': {
      score: 4,
      why: 'Stock Sheet, Field and Input composed through a thin shell; the kit fixes the 600px width and bands, and PanelGrid and PanelSection are plain divs.',
    },
    SlotDrawer: {
      score: 3,
      why: 'Sheet behaviour stock, but the shell forces 440px with !, booking rows use inset-shadow outlines and the action buttons restate disabled looks.',
    },
    DraftListDrawer: {
      score: 3,
      why: 'Same Sheet shell and action bar as the session drawer, plus recoloured Badges and hand-styled rows for candidates and bookings.',
    },
    ClearConflictSheet: {
      score: 3,
      why: 'Stock AlertDialog behaviour with initial focus on Cancel, but width forced by !, the header realigned and the footer made a full-width pair.',
    },
    HistorySheet: {
      score: 4,
      why: 'Stock Dialog and Collapsible with a link Button trigger; the ledger and time gutter are app content, and overrides are a few type classes.',
    },
    NameSearchBox: {
      score: 3,
      why: 'InputGroup with addons is stock in shape, but sizes need rounded-pill! and size! overrides and the input intercepts Escape to clear first.',
    },
    'ContractSelect (fieldChrome select)': {
      score: 4,
      why: 'Recommended Select is stock parts with groups and labels, only a max height added; the kit swaps motion. The native option is custom chrome, about 2.',
    },
    SurgeonPicker: {
      score: 3,
      why: 'Stock Combobox with groups and stock Select, but onValueChange swallows the Escape clear and the placeholder colour is forced.',
    },
    NotPreferredWarning: {
      score: 4,
      why: 'Kit warning Alert with title and description; role swapped to status, the icon colour forced with ! and padding and radius tweaked.',
    },
    ChipMultiSelect: {
      score: 3,
      why: 'Stock Combobox chips anatomy and filtering, but Base UI\'s Escape clearing is intercepted to keep the chips; input type tweaked.',
    },
    ConflictCallout: {
      score: 4,
      why: 'Same kit warning Alert as NotPreferredWarning (role status, ! icon colour), with a stock Select for the hospital.',
    },
    WarningsToDo: {
      score: 3,
      why: 'Card and Collapsible stock, but the conflicts line is a ghost Button stripped to h-auto with an inset edge, and rows and discs are hand-built.',
    },
    NotificationsCard: {
      score: 3,
      why: 'Card and link Buttons near stock, but the notice is a ghost Button undone to h-auto, p-0, no hover, and the footer band is reset by class.',
    },
    'VacatedSessionChoice / StatusRadioGroup': {
      score: 2,
      why: 'RadioGroup keeps roving focus, but each choice is a raw Base UI Radio fully hand-styled as a chip; the dots option is near stock, about 4.',
    },
    ProfileChrome: {
      score: 4,
      why: 'Stock Breadcrumb, Card and outline Buttons; the id chip is an outline Badge recoloured by class and the Card drops its shadow.',
    },
    'drawerParts (Section, Row, DrawerLink, ActionBtn)': {
      score: 3,
      why: 'Button variants as given, but focusableWhenDisabled means restating disabled looks on data-disabled, and Section and Row are plain markup.',
    },
  },
}
