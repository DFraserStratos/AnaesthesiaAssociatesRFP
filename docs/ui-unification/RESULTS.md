# UI unification: results (U1 to U7)

The audit's counts re-run after the work, 23 November 2026 (Phase U7, work item 13).

- **Before** is the audit of 12 November 2026: README section 3's "Today" column, kept as written ("about N" and
  "~N" included), section 4's bugs, section 7's token tables, and the token commands in `detail/H-tokens.md`.
- **After** is the tree at the end of U7 (branch `lane/a`, HEAD `86e7d79e` plus U7's working changes).
- **How every count was taken:** H-tokens' scope wrapper (below as `S`), run from `aa-prototype/src`. It covered
  436 files on 12 November and covers 793 now; the counts are not scaled for that growth (most of it is catch-up
  phases 21 to 43b). The detail files A to G and J give member lists, not commands, so each group's "now" comes from
  the command named in its row (all of them are in the last section); "names" means the members were re-checked by
  name. Nothing here is estimated: every "now" figure is a command's output.
- Reasons used below: **stays custom** (README section 5 or U7 item 14), **q2** (question 2: demo simulators and
  presenter tools), **s5** (a README section 5 intended difference), **allow-list** (an entry in
  `aa-prototype/src/apps/oneComponentPerJob.test.ts`, quoted), **owner** (logged for the owner in a U phase entry or
  the U7 log), **later phase** (a catch-up phase built it after 12 November).

## 1. The groups, before and after

| Group | 12 November ("Today") | Now (command) | What remains and why |
|---|---|---|---|
| U01 Money formatting | 3 helpers, ~25 display sites, 8 message sites | 1 helper (`formatMoney`, re-exported as `formatCurrency`; `formatRangePrice` calls it); 0 `$${x.toFixed(2)}` display sites; 313 `formatCurrency`/`formatMoney` calls in 72 files | Remaining `toFixed(2)` are typed field values, the GST CSV, layout percentages and the PWA's MB figure, not displayed money; `AnaesthetistsView`'s bare "Unit $" figure is deliberate (U1, Phase 42) |
| U02 Modal behaviour (Escape, focus, trap) | 4 implementations behind about 66 overlays | 1 (`useModalLayer`, the only modal Escape handler) behind 73 `<Overlay` in 68 files, 11 `<SidePanel` and 7 `usePopover` | Five field-level Escape handlers stay by design (each stops the event so the sheet under it stays open): PartyPicker, ProcedureCodeCard type-ahead, the capture typed value, ContractPriceRanges row edit, NameSearchBox clear |
| U03 Sheet title and close | 64 sites | 0 hand-typed overlay titles; `<OverlayHeader` 79 in 73 files; `fontSize: 18, fontWeight: 700` 7 lines in 6 files | Of the 7: AvailabilityEditor's inline web title (kept, U2), two colleague names and the "Return to the office" line in the move sheets (row text, not titles), PageHeader's own `section` size, two 18px mono stepper values |
| U04 Label pill | ~30 definitions; 20 uses of the shared Pill | `<Pill` 149 in 68 files; 6 product pill or chip definitions not built on `Pill` (2 more in demo) | ListRow's `RowPill`, `CountPill`, `ChipPill` (s5: mobile List row pill sizes from the mockup); `StatusChip` (s5: status chips are flat tints); `BookingTotalStrip`'s `ProcedureChip` (an on-ink chip, Phase 24) and ProfileChrome's `IdChip` (label and value), later phase; DemoIntegrations `StatusPill`, MessageLog `StatusChip` (q2) |
| U05 Error box | 24 copies, 4 inline refusal lines | 0 refusal-box copies in product; `<FormError` 130 in 101 files; `error.tint` 8 lines in 6 files | `FailureNotes` (`shared/capture/ui.tsx`, capture validation notes shown while typing, not a refusal; U3 left it); the rest are demo tones (q2) and FormError itself. One inline `role="alert"` refusal outside shared/ui: `BookingSaveBar` (Phase 35) |
| U06 Search box | 3 implementations; 2 call sites to swap, a fill prop on 10 | 1 (`NameSearchBox`, 15 uses in 15 files); `WebSearchField` gone; `LookbackSearchRow` wraps `NameSearchBox` | The Contract combo's borderless header input in `BillingCard` stays inside its listbox (U4 reading: kept borderless, with the ring) |
| U07 Select field | 35 selects in ~20 files | 3 product `<select>` elements: `SelectField` (Field.tsx), `ChipMultiSelect`'s own, HospitalsView's hospital picker; `<SelectField` 44 in 30 files | HospitalsView's select: Phase 42's hospital calendar keeps `aria-label="Hospital"` (U4 handoff); 6 more in DemoData and DemoActionsMenu (q2) |
| U08 Action button | 145 Button uses; ~55 hand-rolled copies | `<Button` 281 in 124 files; raw `<button` 170 lines in 96 files; styled raw `<button>` tags in the guardrail's scope: 90 in 58 files, every file on the allow-list (58 entries, each with its exact count; ceilings 58 files and 90 buttons) | No `ActionBtn`, `PanelAction`, `PagerButton` or `LinkButton` left. Each of the 58 files has its reason in the allow-list: stays custom (DayGrid, the web availability grid), s5 sizes (Mark complete 56, List dock 54, nudge 44x36, record-now target), q3 nav items (SideNav, WebNav, the tab bar, Master data sub-nav), calendar cells, tiles and chips, whole-row targets, listboxes and field triggers, words no TextAction size draws, four breadcrumb crumbs (no shared Breadcrumb) |
| U09 Clickable table rows | 12 tables | `<ClickableRow` 24 in 19 files; 0 product `<tr onClick` outside `shared/table` | Two demo tables (DemoXero, DemoData) keep their own (q2) |
| U10 Table cells and shell | 7 cell implementations, 10 shells | 1 private `Th`/`Td` (DemoXero, q2); `<TableShell` 58 in 38 files; 3 product `<table>` outside a shell | RvgGroupsView's time-rule example table and ScaleBanner's timings (small inline tables, not record lists), `docParts`' invoice lines (print voice, s5); DemoData and MessageLog (q2) |
| U11 Notice (callouts and notes) | ~25 sites | `<Notice` 89 in 52 files; 2 private callouts left | `ConflictCallout` and `NotPreferredWarning` are wrappers on `Notice`; the two `Callout`s are DemoXero and DemoIntegrations (q2) |
| U12 Result line | ~11 sites | `<ResultLine` 28 in 26 files; names: 11 of the 13 listed sites on `ResultLine` | AlertOfficeSheet's resolved line is `Notice tone="success" live` (U3 deviation: a state shown on open); BookingDetailBody's green line no longer exists (Phase 35 rewrote it) |
| U13 Text action | ~85 sites | `<TextAction` 233 in 92 files; 1 `TextAction` definition; `textActionStyle`/`linkStyle`/`inlineLinkStyle`/`LinkButton` 7 in 4 files | `textActionStyle` kept for a `<Link>` (EditAnaesthetistSheet; U5: Links only); ProcedureCodeCard's 13.5 Clear (allow-list: "the 13.5 Clear"); DemoXero (q2). Words no TextAction size draws are allow-listed (owner, U5 handoff: a 13px size): AA fees "Add item", BookingDetailBody History, UnitsCard "Use seeded value", AssignDraftListSheet's slate link, RolesInfo's white link, drawerParts' DrawerLink |
| U14 Card and panel | ~30 copies | `<Card` 91 in 42 files; 0 product `<Panel` (7 in DemoData, its own), 0 `ProfileCard`, 0 radius 16; 2 product card copies left (2 more in demo) | InvoiceDocument's `RailCard` (U6 left it for Phase 37; its 13/700 print-voice title) and Intake's `DataQualityCard` box (Phase 34, later phase, owner); DemoXero `RecordCard`, DemoData `Panel` (q2) |
| U15 Inputs, checkbox, switch and focus | ~10 inputs, 7 checkboxes, 3 switches, 3 textareas, 11 hints | raw `<input` outside shared/ui: 7 product lines (1 demo); raw checkboxes 0; raw textareas 0; `role="switch"` outside `Switch` 1 (PWA demo); `<FieldHint` 21 in 13 files | Inputs: BackstopAmountField (a shared rail part, 44px by README U24), the Contract combo search, Matching's `RowField` (Phase 33), PairingAddSheet's native radios, the capture typed value, the seed-load file input, ProcedureCodeCard's type-ahead. PartyPanel's kind hint (line 147) is still a hand 12.5 line (U4 handoff to U7; not in U7's sweep) |
| U16 Segmented control | 1 hand-built copy, 3 override sites | 0 copies (`SortToggle` gone), 0 `variant="ink"`, 0 0.18 thumb; `Segmented`/`SlidingSegmentedControl` 41 in 31 files | One per-variant alpha left: the surface variant's 0.15 thumb (a Mobile Availability value) |
| U17 Underline tabs and page switch | 4 definitions, 13 sites; 2 page switches | 0 product tab definitions; `LineTabs`/`LineTabLink`/`LineTab` 21 uses in 9 files; `AvailabilityPageSwitch` on `LineTabs`; 0 `role="tablist"` | DemoXero's `TabLink` (q2) |
| U18 Sheet footer, confirm and done step | ~45 footers, ~15 confirms, 5 done steps | `<SheetActions` 78 in 61 files; `<ConfirmSheet` 10, `<InlineConfirm` 3; `<DoneStep` 5 | Hand-built and logged by U2: ContractRail's right-aligned footer row, ModifierPickerSheet's row Cancel and Claim, AvailabilityEditor's Done (allow-list: "Done at 48px with radius 14"), the BillingCard billing sheet's Done; PairingEndSheet has one button, so no ConfirmSheet |
| U19 Side panel (drawers) | 4 shells | 1 (`SidePanel`, 11 uses in 9 files; MasterPanel is its `record` preset); 0 `position: 'fixed'` shells in `apps/` | None |
| U20 Icon button | ~35 sites | `<IconButton` 25 in 15 files, `<CloseButton` 5; private step or close button definitions: 1 (`NavArrow`) plus 2 wrappers on IconButton (`StepperButton`, `MonthStepButton`) and `NudgeButton` | `NavArrow`, the mini calendar's 22px arrows (allow-list: "no IconButton size"); `NudgeButton` (s5: the capture's -5/+5 nudge); the phone Lists' 48px "Go to a date" (allow-list) |
| U21 Back link | 15 sites | `<BackLink` 15 in 12 files; 0 product back links outside it | Four breadcrumb crumbs (Admin Review mockup; allow-list, no shared Breadcrumb); DemoXero's "Back to invoices" (q2) |
| U22 Eyebrow label | ~60 sites in ~40 files | `<Eyebrow`/`<FieldLabel` 91 in 52 files; `textTransform: 'uppercase'` 30 in 18 files: 6 product, 4 print, 18 demo, shell or PWA, 2 in the homes | Product: RowField, mobile List detail, web My availability, BookingDetailBody, ProcedureStack (built from `type.micro`), RvgCodeList (owner: eyebrow leftovers, U6 handoff). Print: InvoiceDocument and `docParts` (s5 print voice). Demo, shell, PWA (q2) |
| U23 Session status block | 7 builds, 4 bypassing `blockFill` | 0 bypassing: all 6 product block builds call `blockFill` (`StatusBlock` itself the 7th) | ListRow's open body keeps `blockBackground` (a design-backed row, not a block, J N1); VacatedSessionChoice's 12px swatch |
| U24 Contract chooser parts and step rail | 2 builds of 4 parts | 1 (`shared/contracts/railParts.tsx`, read by BillingCard and ContractRail); 0 of `OptionList`, `ChoiceTiles`, `RailSlot`, `RailStepButton`, `OtherPriceToggle`; one `contractMatchesQuery`; 0 `aa-rail-focus` | `ContractCombo` stays BillingCard's own listbox (it reads the shared matcher) |
| U25 Avatar and persona chip | 7 definitions, ~13 sites | 1 `Avatar` (12 uses in 10 files) and 1 `PersonaChip` (2 uses); 0 `Initials` | Mobile elevated white against web and admin crimson tint is s5 (variants of the one Avatar) |
| U26 Count badge and attention dot | 5 counts, ~8 discs | `<CountBadge` 8 in 8 files (`ActiveCount` wraps it); `<AttentionDot` 15 in 10 files; 0 `ConflictDot`; 0 inline "!" discs | None |
| U27 Date fields, jump to date, time entry | 20 date inputs, 2 jump inputs, 3 time pairs | 25 date fields, every one a `TextField type="date"` or in `DateFields.tsx`; `DateJumpInput` 2, `FilterDateInput` 5, `TimeRangeFields` 3 | None |
| U28 Date text, timestamps, plurals | ~90 date sites, ~15 timestamps, 86 plurals | `'EEE d MMM'` 18 lines in 14 files; `'EEE d MMM HH:mm'` 1; inline `=== 1 ? '` plurals 96 in 62 files; `.slice(11, 16)` 6 in 6 files; `parseAmount` 1 (+ its NaN form) | Plurals rose with phases 21 to 43b (U1 had taken 91 to 54); 2 private plural helpers (`masterLifecycle`, `BookingSaveBar`, later phases). Timestamps left by U7 (owner): DraftListDrawer's `'d MMM HH:mm'`, UpdateEmailComposer, `auditNarrative`. ProcedureStack's `receivedStamp` still re-implements `stampText` (U1 handoff) |
| U29 Empty state | ~35 sites | `<EmptyState` 59 in 41 files; 1 private `EmptyNote` | DemoXero's `EmptyNote` (q2) |
| U30 Popover | 5 copies | 1 (`usePopover`, 7 uses in 7 files) | ProcedureCodeCard's type-ahead keeps its own outside click (U2 handoff to U4; a listbox inside a card) |
| U31 Page header, stat tile, label and value rows | 20 headers, 2 tile builds, 7 row builds | `<PageHeader` 34 in 29 files, 2 product `<h1>` typed by hand; tile builds 0 (`StatTile` 43 uses in 8 files); row builds 1 (`DefRow`/`DefList` 154 in 26 files) | Hand `<h1>`: the phone sign-in screen (Phase 43a) and MasterData's 20px title (Phase 42); DemoSurface (q2). The row build left is PwaDemoPanel's `Row` (q2) |
| U32 Filter pills, navigation state, progress bar | 2 + 3 + 2 sites | `FilterPills` 5 in 5 files (0 `FilterChip`); `aria-current` on all 3 navs; `ProgressBar` 2 (with `role="progressbar"`) | None |
| U33 Calendar keyboard and month header | 2 pickers, 3 content grids | `useCalendarKeys` on 3 calendars (MonthGrid, the admin MiniCalendar, the hospital calendar); `MonthHeaderRow` on 4 | The web and mobile My availability grids share the header only and have no arrow keys (U4 migrated their headers) |
| U34 Number stepper, radio keyboard, chip multi-select | 5 + 4 + 1 | `NumberStepper` 4; `useRovingRadio` in 10 files; `ChipMultiSelect` 4 in 3 files (ContractEditSheet's private copy gone) | Radiogroups without arrow keys: FunderSheet "Insurer or funder" (U4 handoff to U7, not in U7's sweep); CreditForm and SupportRequestForm (Phases 39, 43b) on `OptionChip role="radio"`. `pairing/SurgeonPicker` is the admin surgeon select (s5 ruling), not a chip picker |
| U35 Smaller repeats | ~30 sites in all | 8 of 9 targets built, 33 call sites on them; copies left: 3 totals builds, 1 disclosure, 2 text ticks | See below |
| U36 Destructive button | 4 sites | `variant="danger"` 1 (Cancel booking, question 8); 0 red outlines (`${semantic.error.solid}55`); 0 red "Remove" | Contract "Disable" went to `secondary` in U5; no "Disable" button is in the tree now. Remove links are teal (U5) |

### U35 by target

| Target | What happened | Now |
|---|---|---|
| `StickyDock` | Built in U7 (`shared/ui/StickyDock.tsx`); publishes `--aa-dock-height` | 3 uses: SurfaceProvider's booking dock, mobile List detail, My calendar. DockSpacer's 74/82/86 kept (tying them to the height would move framed pixels; owner) |
| `NoticeLine` | Built in U7 | 7 uses in 4 files: NotificationsCard (rail and page), MovedToYouPanel (`NoticeRow` deleted), AlertOfficeSheet (two lines), SlotDrawer's two moved-here lines |
| `PickRow` | Built in U7; looks `colleague` and `blocked` | 4 uses: MoveListSheet, MoveBookingToColleagueSheet (`ReceiverRow` deleted), AnaesthetistCandidates, DraftListCandidates. Heights 56 and 60 kept per site (owner) |
| `AddRowButton` | Built in U6 | 4 uses: web List detail, mobile List detail, RvgTimeRuleSheet, SurgeonEditSheet |
| `TickGlyph` | Built in U7 (in `TickBadge.tsx`) | 5 uses in 4 files; the brand path is pasted once, in its home. Left: WeekStrip's "✓" (Web Dashboard mockup), InvoiceDocument's "✓" (print voice), web List detail's lucide Check (not a listed member; owner) |
| `Disclosure` | Built in U7, with `DisclosureButton` | 8 uses in 7 files; 0 native `<details>` left. Left: ModifierPickerSheet's row (allow-list, already `aria-expanded`); WarningsToDo's "Show all" is a `TextAction` with `ariaExpanded`. Disclosures without a chevron stay without one (owner) |
| `TotalsBlock` | **Not built: one product site** (AA fees' `FeeInvoiceDetail`) | Balances' GST total is gone; `DocTotals` (`shared/billing/docParts.tsx`) is the invoice's print voice; DemoXero's `TotalLine` (q2) |
| `DayChip` | Built in U6 (in `shared/ui`, with `size`) | 2 uses: web Lists, mobile Lists |
| the progress label | `progressTone` and `progressLabel` in `ProgressPill.tsx` (U3) | Read by `ProgressPill` and `ListRow` (one source) |

## 2. The nine bugs (README section 4)

| # | Bug | Fixed by | Check |
|---|---|---|---|
| 1 | Escape in the RVG code picker closes the Contract panel | U2 (`useModalLayer`: Escape closes only the top layer) | Verified: `useModalLayer.ts` holds the only modal Escape handler; `ContractEditSheet.test.tsx` and `useModalLayer.test.tsx` cover it |
| 2 | Money without a thousands separator | U1 (`formatMoney`, question 21); the capture cards' leftovers went with Phases 24 and 39b | Verified: `BookingTotalPanel` calls `formatCurrency`; 0 `$${x.toFixed(2)}` in scope |
| 3 | No keyboard way to open a Booking from web List detail, or the Draft List drawer | U1 (the List detail handle), U6 (`RowOpenButton` on both; Draft Lists by Tab and Enter) | Verified: `RowOpenButton` in `ListDetailView.tsx` and `DraftListsScreen.tsx` |
| 4 | 17 refusal boxes never announced | U3 (14 of 17 on `FormError`); the other 3 went with their sheets in 22, 24 and 39b | Verified in part: `FormError` carries `role="alert"`; no product refusal box is left outside it; `FunderAllocationSheet`, `PriceOverrideSheet` and `AddBillingLineSheet` no longer exist. The 14, per PROGRESS |
| 5 | Admin Day's previous and next buttons have no name | U5 (`IconButton`, "Previous day", "Next day") | Verified: `DayNav.tsx:51,55` |
| 6 | The Contract combo search shows no focus; `aa-rail-focus` dead | U1 (inline `outline: 'none'` dropped), U4 (`aa-rail-focus` removed) | Verified: no `outline: 'none'` in `BillingCard.tsx`; 0 `aa-rail-focus` |
| 7 | The web week strip draws a hatched session flat | U6 (`blockFill`) | Verified: `WeekStrip.tsx` calls `blockFill`; seen on screen per U6's entry |
| 8 | Four browser-blue checkboxes; 44px controls beside 48px segmented | U4 (`Checkbox`; admin sheet controls 44 to 48) | Verified: 0 raw checkboxes outside `shared/ui`; 0 `assignSelectStyle` |
| 9 | Three clear or remove buttons drop focus; the Contract picker does not return focus on Escape | U4 (`NameSearchBox` and `ChipMultiSelect` return focus; both Lists searches and ContractEditSheet's chips moved onto them), U2 (the combo on `usePopover`) | Verified: both Lists screens and `ContractEditSheet` use them; `BillingCard` uses `usePopover`. Not part of bug 9: AA fees' fixed-item remove still drops focus (U5 handoff; owner) |

## 3. Tokens, before and after

Each command from `detail/H-tokens.md`, through the scope wrapper.

| Measure (H-tokens) | 12 November | Now |
|---|---|---|
| Distinct hex values | 19 | 15 |
| `#FFFFFF` lines | 38 in 23 files | 9 in 7 files (demo, PWA demo, Wordmark, an SVG string) |
| White-alpha `rgba(255,255,255,…)` | 30 in 14 files | 41 in 17 files (no ladder token; new on-ink sites in BookingTotalStrip, Pill, PersonaChip) |
| Frosted `rgba(246,248,247,0.92)` | 3 in 3 files | 0 (`surface.frosted`, read in StickyDock) |
| `rgba(0,0,0,0)` | 3 | 2 (DayGrid) |
| `fontSize` numeric literals | 1,435 in 182 files | 1,446 in 265 files |
| of which on the scale (11 to 17, 22) | 940 | 919 in 238 files |
| of which off the scale | 495 | 527 |
| `fontSize: 12.5` | 209 | 307 in 123 files |
| `fontSize: 18` | 70 | 9 in 7 files |
| `fontSize: 11.5` / `13.5` | 56 / 44 | 79 / 48 |
| `type` scale read by | 2 files | 15 files |
| `letterSpacing: '0.06em'` | 54 | 27 in 16 files |
| `letterSpacing: '-0.01em'` | 19 | 6 in 4 files |
| Mono font stack as a string | 4 in 2 files | 1 (DemoIntegrations, q2) |
| Eyebrow composite (size plus letterSpacing) | ~61 in 40 files | 37 in 21 files |
| of which exact `11` + `0.06em` | 36 | 16 |
| `textTransform: 'uppercase'` | 51 in 33 files | 30 in 18 files |
| boxShadow: token copies (e1, e2, e3) | 4 | 0 |
| boxShadow: drawer `-8px 0 24px` | 3 | 0 |
| boxShadow: card edge `-16px 0 32px` | 1 | 0 |
| boxShadow: segmented thumb literals | 3 | 1 (the 0.15 surface variant) |
| boxShadow: near-e1 drift | 3 | 2 (AvailabilityScreen 0.05, DayGrid add button 0.08) |
| Left edge bar `inset 3px 0 0` | 10 in 8 files | 12 in 10 files |
| `borderRadius: 999` / `99` / `100` | 86 / 33 / 1 | 10 (4 files: 3 demo, ReviewScreen) / 0 / 1 (PhoneFrame) |
| `borderRadius: 10` / `14` | 27 / 9 | 0 / 1 (BookingSaveBar, Phase 35) |
| `borderRadius: 8` / `12` / `6` | 13 / 13 / 8 | 0 / 0 / 0 |
| `borderRadius: 9` / `7` / `16` | 7 / 3 / 7 | 4 / 3 / 0 |
| `borderRadius: 4` / `3` / `5` | 2 / 1 / 2 | 5 / 1 / 2 |
| 150ms literal durations | 6 (+ `global.css`) | 1 (PwaDemoPanel, q2) |
| `cubic-bezier(0.2,0.8,0.2,1)` | 3 (+ `global.css`) | 2 (PwaDemoPanel, Phase 34's MatchingTable) |
| Review success circle 320ms against 420ms | 1 | 1 (still 320ms; owner, Phase 21a handoff) |
| Literal ms in `transition`/`animation` strings | not totalled in H | 15 lines in 10 files |
| `zIndex` literals | 31, 16 distinct | 13, 11 distinct (`zIndex.*` read 16 times in 11 files) |
| `global.css` `#172320` and `#0d6e63` typed in rules | 2 | 0 (only their own variable definitions) |
| `space[` reads | 0 | 0 (not in this effort) |

### README section 7's bypass table, re-run

| Literal | Token | 12 November | Now |
|---|---|---|---|
| `borderRadius: 999` / `99` | `radius.pill` | 85 + 33 | 10 + 0 |
| `borderRadius: 10` / `14` | `radius.ctl` / `radius.card` | 27 + 9 | 0 + 1 |
| `fontSize` 11 to 17, 22 as numbers | `type.*.size` | about 940 in about 180 files | 919 in 238 files (no font-size swap was planned) |
| `letterSpacing: '0.06em'` / `'-0.01em'` | `type.micro.tracking` / `type.title.tracking` | 54 + 19 | 27 + 6 |
| `color: '#FFFFFF'` | `neutral.surface` | 36 | 5 written as `color: '#FFFFFF'` (all demo or PWA demo) |
| e1, e2, e3 shadow strings | `elevation.e1` / `e2` / `e3` | 4 | 0 |
| `cubic-bezier(0.2,0.8,0.2,1)` | `easing.card` | 4 | 2 |
| the mono font stack as a string | `fontFamily.mono` | 4 | 1 |

Section 7's "add the token" rows: every proposed token exists now (U1). Literals left: `12.5` 307, `11.5` 79, `13.5` 48
(no font-size swap, U1); radius 8, 12, 6 all 0; `#F1F4F2`, `#D89AA9`, `#8FE3B4` 0 in scope; the frosted, card-edge and
thumb (0.2) literals 0; 150ms 1. Section 7's "your call" rows: 18/700 titles 7 (none an overlay title); `#C25B72` 1
(Wordmark, no token by design); the drawer shadow 0; the on-ink white ladder 41; the segmented 0.18 shadow 0.

## 4. Catalogue rows, before and after

| App | 12 November (`shots/index.json`) | Start of U7 (`.build-phase/U7-shots-start/index.json`) | After U7 (`shots-after/index.json`, = the catalogue source) |
|---|---|---|---|
| Admin | 64 | 168 | 169 (U7 added "Disclosure") |
| Web | 52 | 69 | 69 |
| Mobile | 54 | 78 | 78 |

U7 renamed one row, because its component was renamed: "drawerParts (Section, DrawerLink)" is now "drawerParts (DrawerSection, DrawerLink)" (the drawer's local `Section` became `DrawerSection` for the guardrail). Every 12 November name absent now, and where it went (the commit that changed the name, by
`git log -S`):

| App | 12 November row | Now | What and when |
|---|---|---|---|
| Admin | ConflictDot | AttentionDot | Merged; `ConflictDot` deleted (U3, `9ffbd51a`) |
| Admin | ContractSelect (fieldChrome select) | ContractSelect (SelectField) | Renamed (U4, `ba1d6ce2`) |
| Admin | drawerParts (Section, Row, DrawerLink, ActionBtn) | drawerParts (DrawerSection, DrawerLink) | Narrowed twice: `ActionBtn` onto `Button` (U5, `6222934b`), `Row` onto `DefRow` (U6, `4933a70f`); `Section` renamed `DrawerSection` (U7) |
| Admin | TabLink (AA fees) | LineTabs | Merged (U5, `6222934b`) |
| Admin | TabButton (Integrations) | LineTabs | Merged: Intake tabs on `LineTabLink` (Phase 34, `b6a6ebe5`) |
| Admin | Table / Header / TextAction / EditCell | MasterTable / EditCell, and MasterHeader | Split and renamed (Phase 42, `94ecb614`) |
| Admin | Billing pipeline stepper (PipelineCard) | Billing pipeline (PipelineDetail) | Renamed with the rebuild (Phase 37, `a94609bc`) |
| Web | Panel | Card (panel) | Merged into `Card` (U6, `4933a70f`) |
| Web | WebDayChip | DayChip (desktop) | Merged into `DayChip` (U6, `4933a70f`) |
| Web | FilterChip | FilterPills | Merged (U5, `6222934b`) |
| Web | IconBtn · NavButton · WeekNavButton | IconButton | Merged (U5, `6222934b`) |
| Web | LinkButton | TextAction | Merged (U5, `6222934b`) |
| Web | WebSearchField | Lists search (NameSearchBox pill 38) | Merged into `NameSearchBox` (U4, `ba1d6ce2`) |
| Web | SubTabButton | (the admin LineTabs row) | Removed: Accounts sub-tabs on `LineTabLink` (Phase 38, `6f9b509d`) |
| Web | ProcedureCodeCard | RvgCodeField, and RvgCodeList | Split (Phase 20 (9), `c35bc817`, after the 12 November shots) |
| Web | OverrideCard | PriceCard | Replaced (Phase 24, `dbd0c5d8`) |
| Web | Receivables aging bars | (none) | Removed with the aging views (Phase 38, `6f9b509d`) |
| Mobile | OutOfHoursPill | (none) | Removed: dead code deleted (U3, `9ffbd51a`) |
| Mobile | EmptyCard | EmptyState | Merged (U3, `c872168d`) |
| Mobile | AgeChip | (none) | Removed with the aging views (Phase 38, `6f9b509d`) |

Added since 12 November (names not in the 12 November index): admin 112, web 27, mobile 27. Among them are the U
phases' shared components (for example OverlayHeader, SheetActions, Notice, SelectField, IconButton, PageHeader,
Eyebrow, the table kit, Disclosure); the rest come from catch-up phases 20 to 43b.

## 5. Shots

The 12 November set is `shots/` (untouched). The after set is [`shots-after/`](shots-after/) (same layout, its own
`index.json`: admin 169, web 69, mobile 78, no errors), taken at the end of U7.

## 6. The guardrail

`aa-prototype/src/apps/oneComponentPerJob.test.ts`: 58 allow-list entries, each with its exact button count and a reason, under ceilings of 58 files and 90 buttons.
Re-counting its scan (the same tag reader, below) finds 90 styled raw `<button>` tags in 58 files in its scope, and the
58 files are exactly the allow-list.

## 7. The commands used

```sh
cd aa-prototype/src
# H-tokens' scope wrapper, and a sum of rg -c output (instances, files)
S() { rg -g '*.{ts,tsx,css}' -g '!theme/**' -g '!**/*.test.*' -g '!test/**' -g '!**/__parity__/**' \
       -g '!apps/demo/catalogue/**' -g '!shell/gradientLab/**' "$@" . ; }
C() { awk -F: '{s+=$NF;n++}END{print s+0, n+0}'; }
S --files | wc -l                                                     # 793 files

# Tokens (H-tokens)
S -o --no-filename -i '#[0-9a-f]{6}\b|#[0-9a-f]{3}\b' | tr a-f A-F | sort | uniq -c | sort -rn
S -c -i '#FFFFFF' | C ;  S -c "color: *'#FFFFFF'" | C
S -o --no-filename -i '(rgba?|hsla?)\([^)]*\)' | tr -d ' ' | sort | uniq -c | sort -rn
S -c -o 'rgba\(255, *255, *255, *0?\.[0-9]+\)' | C ;  S -c 'rgba\(246, *248, *247, *0\.92\)' | C
S -c -o 'fontSize: *[0-9.]+' | C
S -o --no-filename 'fontSize: *[0-9.]+' | sed 's/fontSize: *//' | sort -n | uniq -c | sort -rn
S -P -c -o 'fontSize: *(11|12|13|14|15|16|17|22)\b(?:[^.]|$)' | C
S -c -o 'fontSize: *18, *fontWeight: *700' | C
S -l '\b(type|typeScale)\.(display|title|heading|bodyMobile|body|data|label|caption|micro|small|captionSm|labelLg|pageTitle|pageTitleWeb|sheetTitle)\b' | wc -l
S -c -o "letterSpacing: *'0\.06em'" | C ;  S -c -o "letterSpacing: *'-0\.01em'" | C ;  S -c -o "'Spline Sans Mono'" | C
S -U -c "fontSize: *[0-9.]+[^}]{0,200}?letterSpacing: *'[0-9.]+em'" | C
S -U -c "fontSize: *11[^.0-9][^}]{0,200}?letterSpacing: *'0\.06em'" | C
S -U -o --no-filename "fontSize: *[0-9.]+[^}]{0,200}?letterSpacing: *'[0-9.]+em'"   # pairs, tallied by size and spacing
S -c -o "textTransform: *'uppercase'" | C
S -n -o "boxShadow: *'[^']*'|boxShadow: *\`[^\`]*\`"
S -c -e '-8px 0 24px rgba' | C ;  S -c -e '-16px 0 32px rgba' | C ;  S -c '0 1px 3px rgba\(23,35,32' | C ;  S -c 'inset 3px 0 0' | C
S -o --no-filename 'borderRadius: *[0-9.]+' | sed 's/.*: *//' | sort -n | uniq -c
S -o --no-filename "(transition|animation)[A-Za-z]*: *['\`][^'\`]*['\`]" | grep -o '[0-9]\+ms' | sort -n | uniq -c
S -c "(transition|animation)[A-Za-z]*: *['\`][^'\`]*[0-9]+ms[^'\`]*['\`]" | C
S -n 'cubic-bezier\(0\.2, *0\.8, *0\.2, *1\)'
S -o --no-filename "zIndex: *[0-9]+" | sed 's/.*: *//' | sort -n | uniq -c ;  S -c -o 'zIndex\.[a-zA-Z]+' | C
rg -n -i '#0d6e63|#172320' theme/global.css
S -c 'space\[' | C

# Groups (one line per measure; "names" checks are the definition greps)
S -n '(function|const) (formatCurrency|priceFigure|formatRangePrice|formatMoney)\b' ;  S -n '\$\$\{[^}]*toFixed\(2\)\}' ;  S -n 'toFixed\(2\)'   # U01
S -c '\b(formatCurrency|formatMoney)\(' | C
S -l "'Escape'" ;  S -c '<Overlay\b' | C ;  S -l 'useModalLayer\('                                          # U02
S -n 'fontSize: *18, *fontWeight: *700' ;  S -c '<OverlayHeader\b' | C                                     # U03
S -c '<Pill\b' | C ;  S -n '(function|const) [A-Z]\w*(Pill|Chip|Badge)\b'                                   # U04, then rg -c '<Pill\b' per defining file
S -c '<FormError\b' | C ;  S -c 'error\.tint' | C ;  S -n 'role="alert"' -g '!shared/ui/**'                # U05
S -n 'type="search"|inputMode="search"' ;  S -c '<NameSearchBox\b' | C ;  S -n 'function (WebSearchField|LookbackSearchRow)'   # U06
S -n '<select\b' ;  S -c '<SelectField\b' | C                                                              # U07
S -c '<Button\b' | C ;  S -c '<button\b' | C ;  S -n '(function|const) (ActionBtn|PanelAction|LinkButton|PagerButton|SubmitAction)\b'   # U08
S -c '<ClickableRow\b' | C ;  S -U -n '<tr\b[^>]{0,400}?onClick'                                           # U09
S -n '(function|const) (Th|Td|GroupRow)\b' ;  S -c '<TableShell\b' | C ;  S -l '<table\b'                  # U10, then rg -q 'TableShell|<Table\b' per file
S -c '<Notice\b' | C ;  S -n '(function|const) (Callout|ConflictCallout|SoftWarning|NotPreferredWarning)\b'   # U11
S -c '<ResultLine\b' | C ;  rg -c '<ResultLine\b' -g 'HolidaySheet.tsx' -g 'AddAnaesthetistFlow.tsx' -g 'AddHospitalSheet.tsx' \
  -g 'RecurringBookingSheet.tsx' -g 'DraftListsScreen.tsx' -g 'ConflictsScreen.tsx' -g 'ReferenceViews.tsx' -g 'SeriesList.tsx' \
  -g 'AaFeesScreen.tsx' -g 'AlertOfficeSheet.tsx' -g 'BookingDetailBody.tsx' -g 'ReviewScreen.tsx' -g 'AvailabilityForm.tsx' .   # U12
S -c '<TextAction\b' | C ;  S -n '\b(textActionStyle|linkStyle|inlineLinkStyle|LinkButton)\b' ;  S -n '(function|const) TextAction\b'   # U13
S -c '<Card\b' | C ;  S -n '(function|const) (Panel|ProfileCard|RailCard|RecordCard|DataQualityCard)\b' ;  S -c 'borderRadius: *16\b' | C   # U14
S -n '<input\b' -g '!shared/ui/**' ;  S -n 'type="checkbox"' -g '!shared/ui/**' ;  S -n '<textarea\b' -g '!shared/ui/**' ;  S -n 'role="switch"' ;  S -c '<FieldHint\b' | C   # U15
S -n '(function|const) SortToggle\b|variant="ink"|0\.18\)' ;  S -c '<(Segmented|SlidingSegmentedControl)\b' | C   # U16
S -n '(function|const) (TabButton|TabLink|SubTabButton|AvailabilityPageSwitch)\b' ;  S -n 'role="tablist"' ;  S -c '<(LineTabs|LineTabLink|LineTab)\b' | C   # U17
S -c '<SheetActions\b' | C ;  S -c '<ConfirmSheet\b' | C ;  S -c '<DoneStep\b' | C ;  S -c '<InlineConfirm\b' | C   # U18
S -c '<SidePanel\b' | C ;  S -n "position: *'fixed'"                                                        # U19
S -n '(function|const) (WeekNavButton|IconBtn|NavButton|SquareBtn|TextBtn|StepButton|MonthButton|RoundButton|StepperButton|NudgeButton|Stepper|CornerClose|NavArrow|MonthStepButton)\b'
S -c '<IconButton\b' | C ;  S -c '<CloseButton\b' | C                                                       # U20
S -c '<BackLink\b' | C ;  S -l 'ChevronLeft'                                                                # U21
S -c '<(Eyebrow|FieldLabel)\b' | C ;  S -c "textTransform: *'uppercase'"                                   # U22
S -l 'blockFill\(' ;  S -n '\.blockBackground'                                                              # U23
S -n '(function|const) (OptionList|ChoiceTiles|RailSlot|RailStepButton|OtherPriceToggle|ContractCombo)\b' ;  S -n 'contractMatchesQuery' ;  S -n 'aa-rail-focus'   # U24
S -c '<Avatar\b' | C ;  S -n '(function|const) (Initials|Avatar|PersonaChip)\b' ;  S -c '<PersonaChip\b' | C   # U25
S -c '<CountBadge\b' | C ;  S -c '<AttentionDot\b' | C ;  S -n '(function|const) (ConflictDot|ActiveCount)\b' ;  S -n '>!</'   # U26
S -n 'type="date"' ;  S -c '<DateJumpInput\b' | C ;  S -c '<FilterDateInput\b' | C ;  S -c '<TimeRangeFields\b' | C   # U27
S -c "'EEE d MMM'" | C ;  S -c "'EEE d MMM HH:mm'" | C ;  S -n "'(EEE )?d MMM,? HH:mm'" ;  S -c "=== 1 \? '" | C   # U28
S -n '(function|const) (plural|pluralWord|countOf)\b' ;  S -c 'slice\(11, *16\)' | C ;  S -n '(function|const) (parseAmount|parseAmountOrNaN|parsePriceText)\b'
S -c '<EmptyState\b' | C ;  S -n '(function|const) (EmptyNote|EmptyCard|EmptyRow)\b'                       # U29
S -c 'usePopover\(' | C ;  S -n "addEventListener\('(mousedown|pointerdown|click)'"                         # U30
S -c '<PageHeader\b' | C ;  S -n '<h1\b' ;  S -n '(function|const) (StatTile|Tile|Fact|ConfirmRow|Row|DefRow)\b' ;  S -c '<(DefRow|DefList)\b' | C ;  S -c '<StatTile\b' | C   # U31
S -n '(function|const) FilterChip\b' ;  S -c '<FilterPills\b' | C ;  rg -c 'aria-current' apps/admin/components/SideNav.tsx apps/web/components/WebNav.tsx apps/mobile/MobileApp.tsx ;  S -c '<ProgressBar\b' | C   # U32
S -l 'useCalendarKeys\(' ;  S -l '<MonthHeaderRow\b'                                                        # U33
S -c '<NumberStepper\b' | C ;  S -l 'useRovingRadio\(' ;  S -n 'role="radiogroup"' ;  S -c '<ChipMultiSelect\b' | C   # U34
for c in StickyDock NoticeLine PickRow AddRowButton TickGlyph Disclosure DisclosureButton TotalsBlock DayChip; do
  S -l "export function $c\b"; S -c "<$c\b" | C; done                                                       # U35
S -n 'M2\.5 7\.5' ;  S -n '✓' ;  S -n '<details\b' ;  S -n '(function|const) (TotalRow|TotalLine|DocTotals|FeeInvoiceDetail)\b'
S -n 'variant="danger"' ;  S -n 'error\.solid\}[0-9a-f]{2}' ;  S -n "['>\"]Disable['<\"]"                    # U36
S -U -n "color: *semantic\.error\.(solid|onTint)[^>]{0,200}>\s*Remove"

# Bugs
rg -n 'Previous day|Next day' apps/admin/components/DayNav.tsx
rg -c 'RowOpenButton' apps/web/screens/ListDetailView.tsx apps/admin/screens/DraftListsScreen.tsx
rg -n "outline: *'none'" shared/booking/BillingCard.tsx ;  rg -c 'usePopover' shared/booking/BillingCard.tsx
rg --files | grep -E 'FunderAllocationSheet|PriceOverrideSheet|AddBillingLineSheet'

# The guardrail: allow-list entries, and styled raw <button> tags read the way the test reads them
awk '/export const ALLOW_LIST:/,/^]/' apps/oneComponentPerJob.test.ts | grep -c "{ file: '"
node --input-type=module -e '
import { readFileSync, readdirSync, statSync } from "node:fs"; import { join, relative } from "node:path"
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p] })
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:\x27"`])\/\/.*$/gm, "$1")
function styled(src) { const c = strip(src); let n = 0, at = c.indexOf("<button")
  while (at !== -1) { const nx = c[at + 7]
    if (nx !== undefined && /[\s>/]/.test(nx)) { let d = 0, q = null, e = at + 7
      for (; e < c.length; e++) { const ch = c[e]; if (q !== null) { if (ch === q) q = null; continue }
        if (ch === "{") d++; else if (ch === "}") d--; else if (d === 0 && (ch === "\"" || ch === "\x27")) q = ch; else if (d === 0 && ch === ">") break }
      if (/\sstyle=/.test(c.slice(at, e + 1))) n++; at = c.indexOf("<button", e) } else at = c.indexOf("<button", at + 7) }
  return n }
const homes = ["shared/ui/", "shared/surface/", "shared/table/", "shared/calendar/"]; let t = 0, f = 0
for (const s of ["apps", "shared"]) for (const p of walk(s)) { const r = relative(".", p)
  if (!r.endsWith(".tsx") || r.endsWith(".test.tsx") || homes.some((h) => r.startsWith(h)) || r.startsWith("apps/demo/")) continue
  const n = styled(readFileSync(p, "utf8")); if (n) { t += n; f++; console.log(n, r) } }
console.log(t, "tags in", f, "files")'

# Catalogue rows (from the repo root)
node -e 'for (const p of ["docs/ui-unification/shots","docs/ui-unification/shots-after",".build-phase/U7-shots-start"]) { const j = require("./" + p + "/index.json"); console.log(p, Object.keys(j).map((k) => k + " " + j[k].length).join(", ")) }'
grep -o 'CatalogueRow name="[^"]*"' aa-prototype/src/apps/demo/catalogue/AdminCatalogue.tsx | wc -l   # and Web, Mobile
git log --format='%h %s' -S '<12 November row name>' -- aa-prototype/src/apps/demo/catalogue/ | head -1
git show <commit> -- aa-prototype/src/apps/demo/catalogue/ | grep -o '^[-+].*CatalogueRow name="[^"]*"'
```
