> Detail file for `docs/ui-unification/README.md` (audit of 12 November 2026): design token gaps (first-pass sweep; spot-checked in J-completeness.md).
> Group numbers here (G1, N1 ...) are local to this file; the README's U-numbers point to them. Paths are relative to `aa-prototype/src/` unless they start with `docs/`.

# H: Design token gap sweep (aa-prototype/src)

Read-only audit. Token sources read: `src/theme/tokens.ts`, `global.css` (@theme block + hand-written rules),
`statusColours.ts`, `motion.ts`; cross-checked against `docs/design/*.dc.html` (Design Language plus the six
sample pages). A literal that a mockup also uses is a **missing token** (design-sourced gap), not drift.

## Scope and how to reproduce

All counts use one wrapper (ripgrep via Claude Code's bundled rg), run from `aa-prototype/src`, over 436 files:

```sh
rg -g '*.{ts,tsx,css}' -g '!theme/**' -g '!**/*.test.*' -g '!test/**' -g '!**/__parity__/**' \
   -g '!apps/demo/catalogue/**' -g '!shell/gradientLab/**' <PATTERN> .
```

Typical forms:
- distinct values: `rg -o --no-filename '<re>' | sort | uniq -c | sort -rn`
- instances and files: `rg -c '<re>' | awk -F: '{s+=$2;n++}END{print s, n}'`
- composites (multi-line objects): `rg -U -c 'fontSize: *11[^}]{0,200}?letterSpacing: *.0\.06em.'`

Counts are of literal syntax; ternaries (`fontSize: compact ? 12 : 13`, ~20 such) are excluded unless noted.
`theme/global.css` is outside the scope but its own literals are reported in section 9.

## Headline

Colour discipline is good: only 19 distinct hexes outside `src/theme`, almost all one-offs. The real gap is
**typography**: the `type` scale is read by exactly 2 files (`shared/booking/ProcedureStack.tsx:39`,
`shared/flows/AddBookingFlow.tsx:72`), while **1,435 numeric `fontSize` literals sit in 182 files**, 495 of them
off the scale. Radii are second: 155 literals equal an existing radius token. `space` is never imported
(0 uses of `space[`); spacing is all literal.

## Ranked gaps (count x visibility)

| # | Gap | Instances / files | Visibility | Kind |
|---|-----|-------------------|-----------|------|
| 1 | fontSize literals; `type` tokens unused | 1,435 / 182 (495 off-scale) | high | gap (scale incomplete) + bypass |
| 2 | Card container composite (surface + 1px line + radius.card) | 80 / 54 | high | composite |
| 3 | Sheet/drawer title `{fontSize:18, fontWeight:700}` | 70 / 58 | high | gap (no token) |
| 4 | Eyebrow / micro label composite | ~61 / 40 (36 exact `11 + 0.06em`) | high | bypass of `type.micro` + drift |
| 5 | Radius literals equal to a token (999/99/10/14) | 155 / ~60 | medium (no visual change) | bypass |
| 6 | Radius values with no token (8, 12, 6, 9, 16, 7, 4, 5, 3) | 56 / ~35 | medium | gap |
| 7 | White on fill `#FFFFFF` + white-alpha ladder on dark/teal | 38 / 23 and 30 / 14 | high | bypass + gap |
| 8 | Page titles 24/30 (admin, mobile) and 28/34 (web) | 14 / 15 and 8 / 8 | high | gap (design-sourced) |
| 9 | Shadows: 4 token copies, 3 drawer, 3 segmented thumb, 2 near-e1, 1 card edge | 13 / 11 | medium | bypass + gap |
| 10 | Left edge bar `inset 3px 0 0 ${colour}` | 10 / 8 | medium | composite |
| 11 | Motion: 150 ms UI transitions, completion pop drift, progress width | ~16 / 12 | low to medium | gap + drift |
| 12 | z-index: no scale, 16 distinct values | 31 / ~20 | low (until it collides) | gap |
| 13 | Focus ring: 7 CSS variants + `accent.focusRing` used once | 8 rules | medium (a11y) | gap |
| 14 | Known one-off colour gaps (gridline, admin pink, free dot, holiday edge, dark divider) | 1 to 3 each | medium | gap (design-sourced) |

---

## 1. Colour literals

`rg -o --no-filename -i '#[0-9a-f]{6}\b|#[0-9a-f]{3}\b' | tr a-f A-F | sort | uniq -c`

| Value | Count / files | Where | Token? | Verdict |
|---|---|---|---|---|
| `#FFFFFF` | 38 / 23 (36 are `color:`) | shell (AppSwitcher:103, AppShell:57, DemoClockMenu:17, DemoActionsMenu:18,34, DemoResetButton:65), SideNav:78,87,99, DayNav:76, RightRail:196,262, DayGrid:355,360,362,478,488, BillingMonitor:170,325, IntegrationMonitor:140,203,340,404, AaFees:163,585, Review:249, SlotDrawer:423, drawerParts:44, WarningTriangle:37, Wordmark:24, Demo* (6), PwaDemoActions:154, pdfSamples:75 | = `neutral.surface` (already written as `color: neutral.surface` 20 times in 16 files) | **Bypass**. Semantically "text on a filled control / on ink"; propose alias `onFill.text` (see 7) |
| `#F1F4F2` | 3 / 1 | `apps/admin/components/DayGrid.tsx:113` (x2, gridline gradient), `:235` (row border) | none; mockup Admin Day uses it | **Gap**: `neutral.gridline` = hour gridlines and row dividers inside the day grid (lighter than `line`) |
| `#D89AA9` | 1 / 1 | `apps/admin/components/SideNav.tsx:56` "ADMIN" eyebrow on ink | none; mockups Admin Day + Admin Review | **Gap**: `brand.onDarkMuted` = crimson-family text on the ink nav |
| `#C25B72` | 1 / 1 | `shared/Wordmark.tsx:27` divider on dark | none; Decisions log 2026-07-22 (Wordmark re-fit) explains it | **Gap**: `brand.onDark` = crimson that still reads on ink |
| `#8FE3B4` | 1 / 1 | `apps/mobile/screens/AvailabilityScreen.tsx:139` free dot on the active (teal) day chip | none; mockup Mobile Availability | **Gap**: `status.free.onFill` (free dot on a teal fill) |
| `#F2D5DC` | 1 / 1 | `theme/statusColours.ts:51` (`CLOSED_ROW_EDGE.holiday`) | private const, already one home; not in `STATUS_PALETTE`; mockup Mobile App | **Gap (minor)**: promote to `STATUS_PALETTE.holiday.edge` or leave as is; no screen bypass found |
| `#8A9490` `#172320` `#58635F` `#E2E7E5` `#C9D1CE` `#0D6E63` | 7, 6, 2, 1, 1, 1 / 2 | `domain/integrations/pdfSamples.ts:59-83`, `assets/samplePaperCards.ts:13,21,22` (SVG strings) | = mist, ink, slate, line, lineStrong, accent | **Bypass** (low value: generated facsimile images; could interpolate tokens) |
| `#1F44A3` `#157A49` | 1 / 1 each | `assets/samplePaperCards.ts:38,50` | = private.onTint, free.onTint | Bypass (low) |
| `#6E56CF` `#C26A0E` | 1 / 1 each | `apps/demo/DemoIntegrations.tsx:452-453` (SCH, AIS channel colours) | = `STATUS_PALETTE.public.solid`, `.preop.solid` | **Bypass** (demo-only); also question: should integration channels borrow status colours at all? |
| `#F6F8F7` | 2 / 2 | `apps/mobile/components/SlideStack.tsx:311`, comment in `pwa/MobileViewport.tsx:22` | = `neutral.bg` (fallback of `var(--aa-atmos-base, ...)`) | Bypass, but inside a CSS var() fallback string; leave or template it |
| `#FBFAF6` `#D9D6CC` | 1, 2 / 1 | `assets/samplePaperCards.ts:19,20,23` paper card | none | **Intended** (facsimile paper, not UI) |
| `#000` | 1 / 1 | `shell/PhoneFrame.tsx:278` device bezel | none | **Intended** (device chrome) |

### rgba() literals

`rg -o --no-filename -i '(rgba?|hsla?)\([^)]*\)' | tr -d ' ' | sort | uniq -c` (no `hsl()` anywhere)

| Family | Count / files | Values | Verdict |
|---|---|---|---|
| White alpha on ink chrome / teal / the total panel | 30 / 14 | 0.08 x6, 0.22 x4, 0.7 x4, 0.55 x3, 0.94 x2, 0.9 x2, 0.72, 0.6 x2, 0.5 x2, 0.45, 0.14, 0.1 | **Gap**: no inverse ladder. Files: AppShell:58-123, AppSwitcher:101-102, DemoClockMenu:15-16, DemoActionsMenu:16-17, DemoResetButton:63-64, SideNav:78-100, RolesInfo:52, Wordmark:25, BookingTotalPanel:51-132, AvailabilityScreen:137, MobileApp:47, PhoneFrame:143, SuccessOverlay:68 |
| Ink alpha in shadows | 22 | see section 3 | elevation |
| `rgba(246,248,247,0.92)` (= `neutral.bg` at 92%) | 3 / 3 | `shared/surface/SurfaceProvider.tsx:170`, `apps/mobile/screens/ListDetailScreen.tsx:380`, `apps/mobile/screens/MyAvailabilityCalendarScreen.tsx:149` | **Gap**: `surface.frosted` (sticky translucent header bar) |
| `rgba(255,255,255,0.94)` | 2 / 2 | `apps/mobile/MobileApp.tsx:47` (tab bar), `shell/PhoneFrame.tsx:143` | **Gap**: `surface.frostedLight` (tab bar / frame bar). Same job as the row above with a different base; UNSURE whether intended |
| `rgba(0,0,0,0)` | 3 / 1 | `DayGrid.tsx:113` (x2), `:389` | use `'transparent'` |
| `rgba(31,164,99,0.45 / 0)` | 2 / 1 | `shared/capture/BookingTotalPanel.tsx:115` value flash | free.solid at alpha; tie to `motion.valueTick` as `valueFlash` |
| `rgba(23,35,32,${motion.cardAdvance.dim})` | 1 | `SlideStack.tsx:340` | ok (reads the token); ink as rgb triplet is retyped, see `inkRgb` below |

## 2. Typography

### fontSize

`rg -o --no-filename 'fontSize: *[0-9.]+' | sed 's/fontSize: *//' | sort -n | uniq -c`

Scale: display 32, title 22, heading 17, bodyMobile 16, body 15, data 14, label 13, caption 12, micro 11.

| Size | Count | Files | On scale? | Typical use / note |
|---|---|---|---|---|
| 13 | 357 | | label | |
| 12.5 | **209** | 79 | **no** | 129 admin, 45 shared, 21 demo. Design mockups use 12.5 (17x). Secondary/table text. **Gap** |
| 12 | 209 | | caption | |
| 14 | 154 | | data | |
| 11 | 112 | | micro | |
| 18 | **70** | 58 | **no** | 69 with weight 700: sheet and drawer titles (`shared/flows/*Sheet.tsx`, admin drawers). Mockups use 18 (2x). **Gap** |
| 15 | 68 | | body | |
| 11.5 | 56 | 33 | no | mockups 9x. Gap |
| 13.5 | 44 | 24 | no | mockups 10x. Gap |
| 17 | 25 | | heading | |
| 10 / 10.5 | 23 / 23 | 26 / 17 | no | eyebrows at a smaller size (see 2.3). Mockups 39x/3x |
| 24 | 18 | 18 | no | page title admin + mobile (24/30/700/-0.01em, 14x; Admin Day, Admin Review mockups) |
| 16 | 14 | | bodyMobile | |
| 28 | 11 | 10 | no | page title web (28/34/700/-0.015em, 8x; Web Dashboard, Web Availability mockups) |
| 9, 9.5 | 7, 8 | | no | tiny badges (DayGrid, DraftListBand) |
| 14.5 | 9 | 4 | no | drift candidate (between data and body) |
| 20 | 8 | 7 | no | stat numbers |
| 7, 8, 15.5, 19, 21, 22, 23, 26 | 1-2 each | | 22 = title; rest no | one-offs; `fontSize: 7` at `DayGrid.tsx:355` |

Totals: 1,435 literals; 940 on a scale size (just not via the token), 495 off-scale. **The scale itself is
incomplete**: the mockups use 12.5, 11.5, 13.5, 10, 18, 24, 28 deliberately, so adding tokens is the fix, not
rounding the literals. 14.5, 9.5, 19, 23, 26, 7 look like drift.

### fontWeight, lineHeight, letterSpacing, fontFamily

- **fontWeight**: 600 x444, 700 x250, 500 x18, 400 x2. Only four values; no `type.*.weight` reads beyond the two files. Low risk; folds into named text styles.
- **lineHeight**: 33 distinct forms. Strings dominate: `'18px'` 40, `'19px'` 38, `'17px'` 23, `'30px'` 15, `'20px'` 14; unitless 1.5 x16, 1.45 x16, 1.3/1.4/1.25/1.35/1.2 small. Pairing drift: `fontSize: 13` takes `'19px'` 18x and `'18px'` 16x; `12.5` takes `'18px'` 7x and `'17px'` 7x (`rg -o --no-filename "fontSize: *[0-9.]+, *lineHeight: *'1[789]px'"`). Neither matches `type.label.line` (16). **Gap**: a paragraph line-height for 13/12.5 text (`textBlock: 13/19`, `textBlockSmall: 12.5/18`), and pick one of each pair.
- **letterSpacing**: `'0.06em'` 54 (= `type.micro.tracking`, **bypass**), `'-0.01em'` 19 (= `type.title.tracking`, bypass; used on the 24px page title), `'-0.015em'` 9 (web page title, design), `'0.08em'` 5 (`InvoiceDocument.tsx:77,474,490,541` + `DemoControlPanel.tsx:80`; the invoice is the printed document voice, INTENDED; demo one is drift), `'0.04em'` 2 (`AvailabilityScreen.tsx:137` day-of-week, `PwaDemoActions.tsx:77`), `'0.14em'` 1 (SideNav ADMIN), `'0.12em'` 1 (invoice "TAX INVOICE", intended), `'0.05em'` (Wordmark LTD, intended).
- **fontFamily**: `'inherit'` 196 (fine). **Bypass**: the mono stack retyped as a string 4 times in 2 files: `apps/admin/screens/IntegrationMonitorScreen.tsx:197,356,482`, `apps/demo/DemoIntegrations.tsx:355` (= `fontFamily.mono`; the codebase norm is `className="mono"`).

### 2.3 Eyebrow / micro label composite

`rg -U -o --no-filename "fontSize: *[0-9.]+[^}]{0,200}?letterSpacing: *'[0-9.]+em'"`, pairs tallied:

| Variant | Count | Note |
|---|---|---|
| 11 + 0.06em | 36 | = `type.micro` (11/14/600/0.06em caps). Weight 600 x26, **700 x9** (drift vs 600) |
| 10.5 + 0.06em | 9 | admin tables/review (AuditViewer:168, ReviewScreen:430, InvoicesScreen:96), DemoXero:693,790 |
| 10 + 0.06em / 0.08em / 0.04em | 4 / 4 / 2 | DraftListBand:55, IntegrationMonitor:350, InvoiceDocument (0.08 intended) |
| 12 + 0.06em / 0.08em | 2 / 1 | DemoControlPanel:80,445 |
| 9.5, 9 | 1, 1 | DraftListBand:94, SideNav:56 |

~61 instances in 40 files; 28 files carry the exact 11px form (AppSwitcher, MobileHeader, WeekStrip,
ListDetailScreen, AvailabilityGrid, ListDetailView, ListsLookback (web), DashboardScreen, MyAvailabilityCalendar,
ForwardListsScreen, AccountsScreen, ListsScreen, MoveBookingFlow, DayGrid, DemoBadge, SlotDrawer, capture/ui,
BookingTotalPanel, AaFeesScreen, drawerParts, OfficeBillingSetup, BookingDetailBody, IntegrationMonitorScreen,
Field, PwaDemoPanel, DemoXero, DemoControlPanel, DemoIntegrations). `textTransform: 'uppercase'` appears 51x in
33 files. Only `ProcedureStack.tsx:39` (`const MICRO`) builds it from the token. Two private
`SectionLabel` functions exist (`DemoXero.tsx:789`, `DemoIntegrations.tsx:367`). lineHeight is usually absent,
so eyebrow height varies with the parent.

**Proposal**: `textStyle.micro` (a CSSProperties object in `src/theme/`) = `{fontSize 11, lineHeight '14px',
fontWeight 600, letterSpacing '0.06em', textTransform 'uppercase'}` plus an `Eyebrow` component in
`src/shared/ui/`. The 10.5 / 10 admin table-header variant needs a ruling (UNSURE: mockups use 10px 39x, so a
`microSmall` 10/0.06em may be intended for dense table heads).

### 2.4 Other repeated text composites

| Composite | Count / files | Proposal |
|---|---|---|
| `fontSize: 18, fontWeight: 700` (sheet/drawer/dialog title) | 70 / 58 (43 admin, 21 shared/flows) | `textStyle.sheetTitle` 18/24/700 |
| `fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em'` | 14 / 15 files (admin screens, DayNav, ProfileChrome, 3 mobile screens) | `textStyle.pageTitle` (Admin Day/Review mockups) |
| `fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em'` | 8 / 8 (web screens, DemoSurface) | `textStyle.pageTitleWeb` (Web Dashboard/Availability mockups). Admin vs web title size is INTENDED (design) |

## 3. Elevation (box-shadow)

`rg -n -o "boxShadow: *'[^']*'|boxShadow: *\`[^\`]*\`"`; token reads: e0 3, e1 9, e2 4, e3 8, focusRing 1.

| Literal | Where | Verdict |
|---|---|---|
| `'0 1px 2px rgba(23,35,32,0.05),0 2px 6px rgba(23,35,32,0.05)'` | `apps/admin/routes.tsx:355`, `apps/admin/components/DayGrid.tsx:206` | **Bypass** = `elevation.e1` |
| `'0 2px 4px ... 0.06, 0 8px 20px ... 0.09'` | `shell/PhoneFrame.tsx:146` | **Bypass** = `elevation.e2` |
| `'0 8px 16px ... 0.10, 0 24px 56px ... 0.18'` | `shared/booking/BillingCard.tsx:529` | **Bypass** = `elevation.e3` |
| `'0 1px 2px rgba(23,35,32,0.05)'` | `apps/mobile/screens/AvailabilityScreen.tsx:228` | DRIFT (half of e1) -> e1 |
| `'0 1px 2px rgba(23,35,32,0.06)'` | `apps/admin/screens/IntegrationMonitorScreen.tsx:291` | DRIFT -> e1 |
| `'0 1px 2px ...0.08,0 2px 6px ...0.08'` | `DayGrid.tsx:264` (28px add button) | DRIFT (e1 at 0.08) -> e1, or UNSURE if the heavier lift is wanted |
| `'-8px 0 24px rgba(23,35,32,0.16)'` | `DraftListDrawer.tsx:106`, `SlotDrawer.tsx:134,303` | **Gap** (not in design): `elevation.drawer` |
| `'-16px 0 32px rgba(23,35,32,0.12)'` | `apps/mobile/components/SlideStack.tsx:318` | **Gap** (Mobile App mockup 2x): `elevation.cardEdge`, belongs with `motion.cardAdvance` |
| segmented highlight `'0 1px 3px rgba(23,35,32,0.2 / 0.15 / 0.18)'` | `shared/ui/SlidingSegmentedControl.tsx:63,69,75` | **Gap**: `elevation.thumb`. Design Language has 0.2, Mobile Availability 0.15; 0.18 (ink variant) is code-only. UNSURE whether per-variant alphas are intended; recommend one value (0.2, the Design Language one) |
| `'0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)'` | `PhoneFrame.tsx:260` | INTENDED (device frame) |
| `inset 3px 0 0 ${colour}` (left edge bar) | 10 / 8: DayGrid:456, DraftListsCard:53, WarningsToDo:60,78, DraftListBand:90, HospitalsView:196, ConflictsScreen:211, SideNav (active nav), AccountsScreen | **Composite**: `edgeBar(colour)` helper; SideNav's crimson one is identity, keep the colour |
| tab underline `inset 0 -2px 0 ink` (4) and `inset 0 -3px 0 brand.base` (1) | | 3px crimson is the design's (Web Dashboard mockup); the 2px ink variant: UNSURE |

## 4. Radius

`rg -o --no-filename 'borderRadius: *[0-9.]+' | sed 's/.*: *//' | sort -n | uniq -c`; token reads: ctl 191,
card 122, pill 35, panel 5, sheet 1 (template).

| Value | Count / files | Token? | Verdict |
|---|---|---|---|
| 999 | 86 / 47 | `radius.pill` | **Bypass** |
| 99 | 33 / 19 | renders as pill | **Bypass** -> `radius.pill` (mockups also mix 99/999) |
| 100 | 1 / 1 (PhoneFrame:309 home bar) | pill | bypass (chrome) |
| 10 | 27 / 15 | `radius.ctl` | **Bypass** |
| 14 | 9 / 9 (routes, DayGrid, RightRail, DraftListsCard, WarningsToDo, NeedsInvoiceDestinationCard, NotificationsCard, ContractsView, web Dashboard) | `radius.card` | **Bypass** |
| 20, 24 | 1, 1 (BalancesScreen; PhoneFrame) | panel, sheet | bypass |
| 8 | 13 / 11 (capture/ui, BookingTotalPanel, PhotoCaptureFlow, MasterData, ModifiersSection, BillingLinesCard, PhoneFrame, WeekStrip, SlotDrawer, drawerParts, DayNav) | none | **Gap**: `radius.sm` 8 (mockup Web Dashboard 11x) |
| 12 | 13 / 11 (SlidingSegmentedControl, capture/ui, ListOptionsSheet, BookingDetailBody, TimesCard, AvailabilityScreen, WeekStrip, ListDetailView, DashboardScreen, MyAvailabilityCalendar, admin) | none | **Gap**: `radius.md` 12 (mockups Mobile App 11x, Admin Review 7x) |
| 6 | 8 / 6 (SlotStatusSheet, StatusBlock, DayGrid, RightRail, DraftListBand, HospitalsView) | none | **Gap**: `radius.xs` 6 (Design Language 10x: status blocks) |
| 4, 3, 5 | 2, 1, 2 | none | `radius.xxs` 4 (Design Language 6x; 3 in Admin Day/Web Availability) or fold 3/5 into it |
| 9 | 7 / 4 (WeekStrip, AvailabilityGrid, SlidingSegmentedControl, SideNav) | none | DRIFT -> 8 or 10 (segmented thumb inner radius may be ctl minus inset: UNSURE) |
| 7 | 3 / 2 (web MyAvailabilityCalendar, DayGrid:264) | none | DRIFT -> 6 or 8 |
| 16 | 7 / 4 (PwaDemoPanel, InstallCoach, MoreScreen, BalancesScreen) | none | DRIFT (mobile cards; mockups use 14) -> `radius.card`, UNSURE for the PWA panels |
| 48 | 1 (PhoneFrame device) | | intended |

## 5. Spacing (4pt grid)

`space` is imported nowhere. gap: 8 x222, 6 x179, 12 x140, 10 x131, 4 x81, 14 x77, 16 x69, 2 x50, 3 x24.
Padding string tokens: `12px` 181, `10px` 174, `8px` 99, `14px` 90; top strings `'10px 12px'` 69 / 51 files,
`'12px 14px'` 28, `'0 12px'` 30, `'8px 10px'` 17, `'10px 14px'` 14, `'2px 8px'` 14, `'3px 9px'` 10.
6, 10 and 14 are off the 4pt grid but the mockups use them heavily (Design Language gap:6px 22x, 10px 11x), so
they are design-sourced, not drift. Notable repeated offenders worth naming: **`'10px 12px'` (row/list item
padding, 69 in 51 files)** and `'12px 14px'` (card body, 28). Odd-pixel drift worth a look: `'3px 9px'` (10, pill
padding) and gap 5 / 7 / 9 (8 / 7 / 3).

## 6. Motion

Token reads: sheetIn 15, cardAdvance 15, completeTick 14, valueTick 8, selectionSlide 6, reducedMotionFade 2,
`easing.sheet` 1. Literal durations (`rg -o "(transition|animation)[A-Za-z]*: *['\`][^'\`]*['\`]" | grep -o '[0-9]\+ms'`):

| Literal | Where | Verdict |
|---|---|---|
| 150 ms (background / left / transform / color / opacity) | `shared/ui/Button.tsx:43`, `BillingCard.tsx:231-232`, `ContractRail.tsx:597-599`, `SlidingSegmentedControl.tsx:244`, `AppSwitcher.tsx:119`, `PwaDemoPanel.tsx:181`; plus `global.css:576` mobile press fades | **Gap**: `motion.uiFade` 150 ms ease-out (the control-state fade has no token). Also `global.css` uses 120 ms (row hover :395, row reveal :766) and 160 ms (disclosure :725): drift around the same job |
| `cubic-bezier(0.2,0.8,0.2,1)` literal | `ListDetailScreen.tsx:244`, `web/ListDetailView.tsx:205`, `PwaDemoPanel.tsx:181`, `global.css:577` | **Bypass** = `easing.card` |
| `width 300ms` progress bar | `ListDetailScreen.tsx:244`, `ListDetailView.tsx:205` | Gap: `motion.progress` 300 ms (same on both apps, good) |
| 200 / 300 ms opacity | `NotificationsCard.tsx:155`, `NotificationsScreen.tsx:91`, `ReviewScreen.tsx:276`, `SuccessOverlay.tsx:73` | Gap: `motion.fade` (200) |
| completion pop: `aa-circle-pop 320ms ease` + `aa-fade-in 260ms ease` | `apps/admin/screens/ReviewScreen.tsx:247,249` | **DRIFT** vs `SuccessOverlay.tsx:90` (420 ms, `completeTick.easing`) for the same success circle |
| `aa-tick-pop 340ms` | `ListDetailScreen.tsx:406` | Gap: no token for tick-pop duration |
| `opacity 180ms` / `200ms` inside FOLD/REVEAL | `BookingDetailScreen.tsx:25-26` | minor; fold into `motion.fade` |
| `setTimeout(..., 1050)` | `BookingDetailBody.tsx:453`, `ListDetailScreen.tsx:58` | Gap: `motion.successHold` 1050 ms (same value twice, good) |

## 7. z-index

No scale exists. `rg -o --no-filename "zIndex: *[0-9]+"`: 0,1(2),5,10,30(2),40(4),41(4),45,50,55,60(4),70(2),
90,100,120(3),200(2); `global.css` adds 1 and 90.

| Layer | Values / where |
|---|---|
| in-component | 0, 1 (SlidingSegmentedControl:208, BillingCard), 5 (SurfaceProvider:277) |
| popover | 30 (BillingCard:529 dropdown, MobileApp tab bar) |
| drawer scrim / panel | 40 / 41 (SlotDrawer, MasterPanel, DraftListDrawer: consistent trio) |
| sticky / surface | 45 (SurfaceProvider:173), 50 (PhoneFrame), 55 (PwaDemoActions:48) |
| overlays | 60 (PhoneFrame, UpdatePrompt, SurfaceProvider, SuccessOverlay: four unrelated things share 60), 70 (BottomSheet, SlideStack) |
| shell menus | 90/100 (AppSwitcher:128,136), 120 (DemoActionsMenu:127, DemoClockMenu:103, DemoResetButton:85) |
| dialog | 200 (Dialog:57 and PhoneFrame:137 share it) |

**Gap**: `zIndex = { raised: 1, popover: 30, drawerScrim: 40, drawer: 41, sticky: 45, overlay: 60, sheet: 70,
shellMenu: 120, dialog: 200 }`. Question: Dialog and PhoneFrame both at 200; is that collision intended?

## 8. Focus ring

`accent.focusRing` (box-shadow 3px at 30%) is read once (`shared/ui/NameSearchBox.tsx`, via `focused ?
accent.focusRing`). `global.css` has 7 hand-written outline rules with three widths/offsets:
3px/2 (`.aa-filter-toggle` :376, `.aa-search-field` :748), 3px/3 (`[data-validation-fields]` :381),
2px/3 (`.aa-table-entity-link` :419, `.aa-disclosure` :733), 2px/1 (`.aa-row-reveal` :785), 2px/2 with a
**literal `#0d6e63`** (`.aa-rail-scope` :798, bypass of `var(--color-accent)`). Design Language §01 defines one
focus ring. **Gap**: `--focus-ring-width` / `--focus-ring-offset` custom properties (or one `.aa-focus` class)
and a ruling on outline vs the box-shadow token.

## 9. global.css's own literals

`border-top: 3px solid #172320` (:327, commented: no CSS var for ink; but `--color-ink` exists in @theme, so this
is a bypass), `rgba(23,35,32,0.55/0.12)` probe hatch (debug, fine), `#0d6e63` at :798 (bypass),
`border-radius: 4px` (:409, :735) (gap `radius.xxs`), 120/150/160 ms (section 6), `cubic-bezier(0.2,0.8,0.2,1)` (:577).

## Repeated composite style objects (summary)

| Composite | Count / files | Name |
|---|---|---|
| Card container `background: neutral.surface, border: 1px solid ${neutral.line}, borderRadius: radius.card` | 59 / 40 strict (surface+border+radius); 80 / 54 border+radius (50 admin) | `surfaceStyle.card` or a `Card` component; there is no shared Card primitive in `shared/ui/` |
| Eyebrow / micro label | ~61 / 40 | `textStyle.micro` + `Eyebrow` |
| Sheet title 18/700 | 70 / 58 | `textStyle.sheetTitle` |
| Page title 24/30 and 28/34 | 14 + 8 | `textStyle.pageTitle`, `.pageTitleWeb` |
| Row padding `'10px 12px'` | 69 / 51 | `space.row` or part of a `ListRow` |
| Left edge bar `inset 3px 0 0 c` | 10 / 8 | `edgeBar(c)` |
| Primary fill button `{background: accent.base, color: '#FFFFFF', border: 'none', borderRadius: radius.ctl}` hand-rolled despite `shared/ui/Button.tsx` | ~12 (BillingMonitor:170,325, IntegrationMonitor:140,203,340,404, AaFees:163,585, SlotDrawer:423, drawerParts:44, RightRail:262, DemoIntegrations:223,247) | Bypassed shared component; flag to the Button group |
| Drawer shell `position: fixed; right 0; width ADMIN_LIST_DRAWER_WIDTH; shadow` | 3 / 2 (SlotDrawer x2, DraftListDrawer) | `AdminDrawer` |

## Proposed new tokens

| Name | Value | Replaces N literals in M files |
|---|---|---|
| `type.small` | 12.5 / 18 / 600 | 209 / 79 |
| `type.sheetTitle` | 18 / 24 / 700 | 70 / 58 |
| `type.pageTitle` | 24 / 30 / 700 / -0.01em | 14 / 15 (+3 bare 24/700) |
| `type.pageTitleWeb` | 28 / 34 / 700 / -0.015em | 8 / 8 |
| `type.labelLg` | 13.5 | 44 / 24 |
| `type.captionSm` | 11.5 | 56 / 33 |
| `type.microSm` (UNSURE) | 10 or 10.5 / 0.06em caps | ~25 eyebrow uses (46 raw 10/10.5) |
| `type.stat` | 20 / 700 | 8 / 7 |
| `textStyle.*` objects (micro, sheetTitle, pageTitle) | composites of the above | ~145 composites |
| `radius.sm` | 8 | 13 / 11 (+7 at 9, +3 at 7 if folded) |
| `radius.md` | 12 | 13 / 11 |
| `radius.xs` | 6 | 8 / 6 |
| `radius.xxs` | 4 | 5 / 4 incl. 3 and 5 (+2 in global.css) |
| `neutral.gridline` | `#F1F4F2` | 3 / 1 |
| `brand.onDark` | `#C25B72` | 1 / 1 |
| `brand.onDarkMuted` | `#D89AA9` | 1 / 1 |
| `status.free.onFill` | `#8FE3B4` | 1 / 1 |
| `STATUS_PALETTE.holiday.edge` (optional) | `#F2D5DC` | 1 / 1 (already one home) |
| `onFill` ladder: `text #FFFFFF`, `textMuted 0.7`, `textSubtle 0.55`, `textFaint 0.45/0.5`, `border 0.22`, `divider 0.14`, `fillHover 0.08` | white alphas | 30 / 14 (+36 `#FFFFFF` color) |
| `surface.frosted` | `rgba(246,248,247,0.92)` | 3 / 3 |
| `surface.frostedLight` | `rgba(255,255,255,0.94)` | 2 / 2 |
| `elevation.drawer` | `-8px 0 24px rgba(23,35,32,0.16)` | 3 / 2 |
| `elevation.cardEdge` | `-16px 0 32px rgba(23,35,32,0.12)` | 1 / 1 |
| `elevation.thumb` | `0 1px 3px rgba(23,35,32,0.2)` | 3 / 1 |
| `motion.uiFade` | 150 ms ease-out | 9 / 6 (+3 global.css at 120/160) |
| `motion.fade` | 200 ms | 4 / 4 |
| `motion.progress` | 300 ms `easing.card` | 2 / 2 |
| `motion.successHold` | 1050 ms | 2 / 2 |
| `zIndex` scale | see section 7 | 31 / ~20 |
| focus ring width/offset | one value pair | 7 CSS rules |

## Bypass fixes (literal equals an existing token)

| Literal | Token | Count / files |
|---|---|---|
| `borderRadius: 999` / `99` / `100` | `radius.pill` | 86/47 + 33/19 + 1 |
| `borderRadius: 10` | `radius.ctl` | 27 / 15 |
| `borderRadius: 14` | `radius.card` | 9 / 9 |
| `borderRadius: 20`, `24` | `radius.panel`, `radius.sheet` | 1, 1 |
| fontSize 11/12/13/14/15/16/17/22 written as numbers | `type.*.size` | 940 / ~180 |
| `letterSpacing: '0.06em'` | `type.micro.tracking` | 54 / 38 |
| `letterSpacing: '-0.01em'` | `type.title.tracking` | 19 |
| `color: '#FFFFFF'` | `neutral.surface` (or new `onFill.text`) | 36 / 22 |
| e1/e2/e3 shadow strings | `elevation.e1` / `e2` / `e3` | 2 / 2, 1, 1 (`routes.tsx:355`, `DayGrid.tsx:206`, `PhoneFrame.tsx:146`, `BillingCard.tsx:529`) |
| `cubic-bezier(0.2,0.8,0.2,1)` | `easing.card` | 3 / 3 (+ `global.css:577`) |
| `"'Spline Sans Mono', ui-monospace, monospace"` | `fontFamily.mono` | 4 / 2 |
| `#6E56CF`, `#C26A0E` (DemoIntegrations channel colours) | `STATUS_PALETTE.public.solid`, `.preop.solid` | 2 / 1 |
| `#0d6e63` (`global.css:798`), `#172320` (`global.css:327`) | `var(--color-accent)`, `var(--color-ink)` | 2 / 1 |
| `rgba(0,0,0,0)` | `'transparent'` | 3 / 1 |
| SVG generator hexes (pdfSamples, samplePaperCards) | neutral/accent/status tokens | 18 / 2 (low value) |

## Intended differences to keep

- Admin page title 24/30 vs web 28/34: Admin Day/Review vs Web Dashboard/Availability mockups.
- `#C25B72` dark divider: Decisions log 2026-07-22 (Wordmark re-fit).
- The invoice document's serif, 0.08em/0.12em tracking: printed document voice (Phase 08).
- Paper card `#FBFAF6`/`#D9D6CC`, PhoneFrame `#000` bezel and device shadow, the probe hatch.
- 6/10/14 spacing and half-pixel font sizes are design-sourced, not drift.
- Crimson tab underline `inset 0 -3px 0 brand.base` (Web mockups).

## Questions for the user

1. Add half-pixel sizes (12.5, 11.5, 13.5) to the type scale as the mockups use them, or round to the scale?
2. Eyebrow weight: 600 (token, 26x) or 700 (9x)? And is the 10/10.5 table-head eyebrow a real second size?
3. Segmented highlight shadow: one alpha (0.2) or keep per-variant 0.2 / 0.15 / 0.18?
4. Mobile cards at radius 16 (MoreScreen, BalancesScreen, PWA panels): drift to `radius.card` (14)?
5. Should integration channel colours in the Demo Integrations screen reuse status hues at all?
6. Dialog and PhoneFrame both at z-index 200: intended?
7. One focus ring: the `accent.focusRing` box-shadow, or a 2px/3px outline?
