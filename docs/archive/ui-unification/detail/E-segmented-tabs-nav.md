> Detail file for `docs/ui-unification/README.md` (audit of 12 November 2026): segmented controls, tabs, filter pills, navigation, progress.
> Group numbers here (G1, N1 ...) are local to this file; the README's U-numbers point to them. Paths are relative to `aa-prototype/src/` unless they start with `docs/`.

# V-E · Verified: segmented controls, filter and toggle chips, tabs, page switches, nav chrome, progress, switches, step rail

Verifier's pass over `E-segmented-tabs-nav.md`, merged with `B-pills-avatars.md` G9 (toggle / filter chips).
Paths are relative to `aa-prototype/src/` unless they start with `docs/`, `visual/`, `ui-library-preview/` or `requirements-board/`.
All counts re-run by me on 2026-11-12 (catalogue code and `*.test.*` excluded from call-site counts).

## Verification summary

| Group | Verdict | What I corrected |
|---|---|---|
| G1 One segmented control (SortToggle, variants) | CONFIRMED WITH CORRECTIONS | SortToggle confirmed with no design source (Admin Day mockup toolbar is only ‹ Today ›). `Segmented` split is 22 Admin / 1 Web / 4 shared (not 21/1/5). Ink variant traced to the owner's own 2026-07-29 commit (30877ba6) that kept Balances' earlier hand-built ink pills; the preview's "kept on purpose" note means "mirrors the prototype", not a design ruling. 0.2 shadow also has a second source (Mobile App mockup ASA `seg()`). The radiogroup switch is far costlier than stated: 13 button clicks + 11 `getByRole('group')` in Playwright, 16 capture-recipe steps, ATLAS rule; I recommend keeping `button` + `aria-pressed`. |
| G2 Filter pills, merged with B-G9 toggle chips | SPLIT | G2a single-choice view-filter pills (FilterChip, mobile Lists pills) CONFIRMED. G2b teal-tint option chips (AvailabilityForm `Chip`, Remove reason chips, two DemoData chip rows) CONFIRMED, low value. Solid vs tint is INTENDED (two jobs, two mockup sources), not drift as B suspected. Draft Lists tabs moved to G4. SignalFilterButton and StatusLegend dropped (intended). |
| G3 Underline tab strip | CONFIRMED WITH CORRECTIONS | Integrations `TabButton` is rewritten by Phase 34 (URL-routed Intake tabs), Accounts sub-tabs by 38 and 39a, Xero gains a tab in 37, the first local-panel tabs arrive in 25. Phase 34's doc asks for "`selection-slide` for the Intake tabs", which clashes with the underline look: needs a ruling. Selector count: 6 button + 1 link in Playwright, 11 recipe steps. |
| G4 Page-view switch | CONFIRMED WITH CORRECTIONS | Phase 38b copies the Draft Lists pattern (`/admin/review?tab=events` with a count), so the look must be decided before 38b. Draft Lists `?tab=` is URL state, so it is a link case, not a tablist. The "History" Playwright clicks are HistorySheet buttons, not Draft Lists tabs (that spec uses `data-draft-tab`). |
| G5 Nav chrome | CONFIRMED WITH CORRECTIONS | Nav selectors: 43 in Playwright (38 literal + 5 through `pwa-device.spec.ts`'s `tab()` helper) across 14 files, not "about 35". `ListsScreen.test.tsx` clicks a "Lists" back link, not the nav (removed). Mobile teal active confirmed in the Mobile App mockup. Master data sub-nav is rebuilt by Phase 42 (fold in). |
| G6 List progress bar | CONFIRMED WITH CORRECTIONS | Reduced motion IS covered (global.css:652 to 660, the universal `*` rule clamps every transition to 80ms); the sweep's claim was wrong. Design source added: Mobile App mockup line 128. |
| G7 Switch + duplicated Other price card | SPLIT | OtherPriceCard CONFIRMED (same card twice). Generic `Switch` DEFERRED to Phase 27 (only two real tracks today, one in the PWA demo panel). Corrected: `.aa-rail-focus` is on the inline copy only, the inline copy also holds its own Save/Use button; 40 vs 44 input is UNSURE, not plain drift. |
| G8 Step rail markers | CONFIRMED WITH CORRECTIONS | Stronger than stated: `ContractRail` also has a desktop vertical variant (ManualBookingForm on Admin and Web), so Admin itself shows two different step markers. No catalogue row. Phase 21 (running now) edits both files: do it after 21. |
| E-G9 Billing pipeline | DROPPED | Single member, and Phase 37 restyles the Billing monitor. a11y note kept for 37. |

---

### G1 · Segmented control (one component; SortToggle folded in; variants tidied)
- **Job**: pick exactly one value from 2 to 5 short options in a joined track with a sliding highlight.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| SlidingSegmentedControl | shared/ui/SlidingSegmentedControl.tsx:85 | all | 6 direct: Field.tsx:106, AvailabilityForm.tsx:219, AnaesthetistRecord.tsx:55, AvailabilityPageSwitch.tsx:13, BalancesScreen.tsx:73, mobile AvailabilityScreen.tsx:148 |
| Segmented (labelled wrapper) | shared/ui/Field.tsx:100 | all | 27: 22 Admin in 15 files (ContractEditSheet 3, DraftListSheet 3, DraftListCandidates 2, EditAnaesthetistSheet 2, RecurringBookingSheet 2, ...), Web AccountsScreen 1 (GST period, removed by Phase 38), shared 4 (AvailabilityForm, OverrideCard, ManualBookingForm, PriceOverrideSheet) |
| SortToggle | apps/admin/components/DayNav.tsx:69 | Admin | 1 (DayNav.tsx:43) |
| Balances `ink` overrides | apps/mobile/screens/BalancesScreen.tsx:73-85 | Mobile | 1 |

- **Differences**
  - SortToggle is a hand-built copy (item 30, track r10 pad 3 gap 2, item r8, 12px, `'#FFFFFF'` literal, no slide, no `aria-pressed`, no group role, only `title="Row order"`): DRIFT. Checked `docs/design/Admin Day.dc.html` lines 45 to 49: the toolbar is ‹ Today › only; PROGRESS row 06 mentions "roster/A-Z toggle" with no look. Its 36px overall height (30 + 2 × 3) matches DayNav's 36px buttons: the compact size is INTENDED, the separate component is not.
  - `teal` variant and 0.2 shadow: INTENDED (`Design Language.dc.html:271` selection-slide demo; also `Mobile App.dc.html:387` ASA `seg()`).
  - `surface` variant and 0.15 shadow: INTENDED (`Mobile Availability.dc.html:200` `seg()`).
  - `ink` variant, pill radius, 0.18 shadow: UNSURE. No mockup covers Balances; grep finds `rgba(23,35,32,0.18)` nowhere else in `src` or `docs/design` except inside `elevation.e3`'s second layer. History: the owner's commit 30877ba6 (2026-07-29, "tactile buttons") replaced Balances' hand-built ink pills with the new control and added `ink` to keep that look. `ui-library-preview/PLAN.md:85` "Kept on purpose: ... ink segmented variant (prototype's own)" only means the preview mirrors it. DL line 73: teal is "primary actions & selection only", so an ink selection thumb sits against the rule.
  - Web AvailabilityPageSwitch `height: 38`, mobile Availability `height: 40`: DRIFT (the mobile one duplicates the default `minHeight: 40`; the web 38 does not align with the 38px toolbar buttons beside it anyway, because the track adds 8px).
  - AvailabilityForm Repeat bypasses `Segmented` only because it lacks `layout`: DRIFT.
  - Track fill `neutral.sunken` (#EDF1EF) vs DL demo `#E2E7E5` (line): UNSURE, tiny; leave.
- **Target**: keep `SlidingSegmentedControl` in `shared/ui/` (optional rename `SegmentedControl`). Add `size?: 'sm' | 'md'` (sm: item 30, pad 3, 12px, gives the 36px DayNav fit; md: today), `shape?: 'rounded' | 'pill'`, keep `variant`. `Segmented` passes `layout` and `size`. New token `elevation.thumb` (0.2; keep 0.15 for `surface` as `thumbOnSurface` since both are mockup values). Canonical look: today's `teal`.
- **Behaviour contract**: keep `role="group"` + `aria-label` + buttons with `aria-pressed` (valid toggle-button pattern, already on all 33 sites). Optional gain without a role change: ArrowLeft/Right move focus and select within the group (as `StatusRadioGroup`, shared/flows/VacatedSessionChoice.tsx:72-87, but keeping roles). SortToggle gains group, label and `aria-pressed`. Switching to `radiogroup`/`radio` is NOT recommended now (see Migration).
- **Migration**: SortToggle 1 site (S); Balances and the two `surface` callers drop overrides (S). A radio-role switch would break: Playwright 13 `getByRole('button')` segment clicks (routing, mobile-interactions ×3, availability-phase29 ×4, phase28, conflicts-phase30, admin-phase06 "Phone", admin-phase07 "Yes", pwa-device "AM") and 11 `getByRole('group', { name })` (Availability view ×4, Balance section ×2, Sessions ×2, Session, Repeat, Availability page); Vitest `SlidingSegmentedControl.test.tsx` (7 button + 1 group), `AvailabilityFinderSheet.test.tsx:79`; capture recipes 16 steps (`role=button[name="PM"]` 7, "Everyone" 6, "Free only", "Calendar", "Yes"); ATLAS rule "Tabs and segmented controls are usually plain buttons". Keep `data-sliding-segmented-control` / `data-sliding-segment-indicator` (mobile-interactions asserts on the indicator CSS). Demo guide: `03-demo-script.md:75` names `?sort=az` only. Seed / PERSIST_VERSION: none. Size **S** (roles kept) / **M** (with arrow keys).
- **Upcoming phases**: 33 (Matching "Filter (a segmented control)"), 36 (Scope Segmented), 39b (fixed fee vs time segmented), 31-style admin sheets, 22 ($/% toggle likely). Standalone, before 21's successors; cheap.
- **Value**: removes one hand-built copy and ~6 override lines; the Day toolbar toggle is visible in every Admin demo; medium.
- **Confidence**: high (SortToggle), medium (variant tidy-up pending the ink question).
- **Catalogue rows**: admin "Segmented", admin "SlidingSegmentedControl", admin "DayNav (with SortToggle)", web "SlidingSegmentedControl", web "Segmented", web "AvailabilityPageSwitch", mobile "SlidingSegmentedControl", mobile "Segmented".

### G2a · Single-choice view-filter pills
- **Job**: choose one view filter for a list from a short row of separate solid pills.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| FilterChip | apps/web/screens/AvailabilityGrid.tsx:279 | Web | 2 (lines 151-152) |
| Lists filter pills (inline map) | apps/mobile/screens/ForwardListsScreen.tsx:302-326 | Mobile | 1 map, 4 pills |

- **Differences**
  - Separate pills, not a track: INTENDED (`Web Availability.dc.html:55-56` h36 pills; `Mobile App.dc.html:37-39` h38 pills, active `border:none`). This is why they stay out of G1, despite `ui-library-preview/src/rows/recommendations.ts:58`.
  - 36 vs 38 height and active border: INTENDED (each copies its mockup).
  - FilterChip has no `aria-pressed` and neither row has a labelled group: DRIFT.
- **Target**: `FilterPills` in `shared/ui/`: `{ value, options, onSelect, ariaLabel, size: 'md' | 'lg' }` (36 / 38), `role="group"` + `aria-label`, buttons with `aria-pressed`. Reads `accent.base`, `neutral.surface`, `neutral.line`, `neutral.slate`. Canonical: the mockups' look.
- **Behaviour contract**: mobile pills' `aria-pressed`, plus RemoveDraftListSheet's `role="group" aria-label`. Gain: web filter announced as a toggle.
- **Migration**: 2 + 1 sites. Keep role `button`: Playwright `pwa-device.spec.ts` clicks "Month" ×4, "Week" ×1, "Done" ×1 (line 162); `ForwardListsScreen.test.tsx:99-176` 7 queries incl. `aria-pressed` asserts. Catalogue recreation `apps/demo/catalogue/web/recreations.tsx:46` kept in step. Size **S**.
- **Upcoming phases**: 36 (filter chips Open / All), 37 (Problems only toggle), 43 (filters). Build before 36.
- **Value**: ~45 lines; low visibility, a11y gain.
- **Confidence**: high.
- **Catalogue rows**: web "FilterChip", mobile "Filter chips (Week / Month / To-Do / Done)".

### G2b · Teal-tint option chips (from B-G9)
- **Job**: pick or toggle an option inside a form or panel, shown as tint pills.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| AvailabilityForm `Chip` | shared/availability/AvailabilityForm.tsx:343 | A W M | 5 (lines 234, 273, 289-291) |
| Remove reason chips | apps/admin/flows/RemoveDraftListSheet.tsx:53-66 | Admin | 1 map |
| DemoData scenario chips | apps/demo/DemoData.tsx:396 | demo | 1 map |
| DemoData lifecycle filter | apps/demo/DemoData.tsx:520 | demo | 1 map |

- **Differences**
  - Tint look vs G2a's solid: INTENDED. Source: `Mobile App.dc.html:389-393` `chip()` (tint `#E1F0ED`, teal border, text `#0A5A51`), while filters are solid in both filter mockups. Different job, so B's "UNSURE whether the split is intended" resolves to intended.
  - Text `accent.pressed` (#084A43) vs mockup `#0A5A51` (accent hover); border 1px vs mockup 1.5px: DRIFT, tiny.
  - Sizes min-h36 `0 14px` 13px vs `5px 12px` 12.5px (admin, demo): DRIFT (desktop dense vs touch is defensible; two sizes are enough).
  - DemoData chips: no `aria-pressed`, `lineStrong` border, ink text: DRIFT, demo-only.
  - AvailabilityForm weekday chips (`dayChipStyle` :330, solid, 700 weight, multi-select) are a third look: UNSURE, leave.
- **Target**: `OptionChip` in `shared/ui/`: `{ pressed, onClick, size: 'sm' | 'md', shot? }` with `aria-pressed`; wrapper uses `role="group" aria-label`. Canonical: AvailabilityForm `Chip`.
- **Behaviour contract**: `aria-pressed` + labelled group + `.aa-filter-toggle` focus ring.
- **Migration**: 4 sites; no Playwright or recipe selectors found on these labels. Size **S**.
- **Upcoming phases**: 21 ("Different payer" tick is a checkbox, not this), 35 (change picker with ticks), 40a (Hub state chips are status, not this). Low demand; standalone or skip.
- **Value**: ~40 lines; low.
- **Confidence**: medium.
- **Catalogue rows**: web "ResultLine" shows part of AvailabilityForm only; otherwise none.

### G3 · Underline tab strip
- **Job**: switch between sibling views of one page with an ink line under the active tab.
- **Members**

| name | file:line | apps | call sites | kind |
|---|---|---|---|---|
| TabButton | apps/admin/screens/IntegrationMonitorScreen.tsx:501 | Admin | 5 (62-68) | local state + `useDemoTriggerContext('integrations.tab')` :49; `future` DemoBadge; `inline-flex gap 8` |
| TabLink | apps/admin/screens/AaFeesScreen.tsx:67 | Admin | 2 (58-60) | route `<Link aria-current>` |
| TabLink | apps/demo/DemoXero.tsx:824 | demo | 2 (70-72) | route `<Link aria-current>` |
| SubTabButton | apps/web/screens/AccountsScreen.tsx:472 | Web | 4 (64-68) | route via `navigate`, plain buttons |

- **Differences**: pixel-identical styles (pad 10 14, 14px 600/500, `inset 0 -2px 0 ink`; strip `gap 4`, `borderBottom line`): four definitions is DRIFT. Accounts navigates without `aria-current`: DRIFT. Ink underline vs WebNav crimson: INTENDED (DL line 63, crimson is active nav identity; `ui-library-preview/PLAN.md` "line tabs ink underline").
- **Target**: `shared/ui/LineTabs.tsx`: `LineTabs` (strip, `aria-label`), `LineTabLink` (`to`, `<Link aria-current="page">`), `LineTab` (`onClick`, `role="tab"`, `aria-selected`, roving arrows) for local panels; `badge?: ReactNode`; `shot?`. Tokens `neutral.ink`, `slate`, `line`. Canonical: today's.
- **Behaviour contract**: routes as AaFees TabLink. Local panels: WAI-ARIA tabs with automatic activation (recommendations.ts:26).
- **Migration**: 13 call sites, 4 definitions. Selectors: Playwright `phase11.spec.ts` ("Feed config", "Surgeon PDFs", "Validators"), `phase12.spec.ts` ("Surgeon PDFs"), `web-phase05.spec.ts` and `routing.spec.ts` ("GST activity") = 6 button; `aa-fee.spec.ts` ("Fee invoices") 1 link (unaffected). Recipes: "Surgeon PDFs" 8 steps, "Validators" 3 (Phase 34 re-points them anyway). Making Accounts tabs links breaks the 2 "GST activity" button selectors. Size **S**.
- **Upcoming phases**: 34 deletes `TabButton` (URL-routed Intake tabs; doc line 112 asks for `selection-slide`), 37 adds a Xero tab, 38 renames Accounts tabs, 39a adds Remittances, 25 adds the Contract panel's History tab (first true local tablist), 38b Events tab (see G4). Migrate AaFees, Xero, Accounts now; skip Integrations (34 rewrites it on `LineTabLink`).
- **Value**: ~60 lines to one; low visibility, high reuse ahead.
- **Confidence**: high.
- **Catalogue rows**: admin "TabButton (Integrations)", admin "TabLink (AA fees)", web "SubTabButton".

### G4 · Page-view switch (route or query tabs drawn three ways)
- **Job**: switch between two sibling pages or URL views of one section.
- **Members**

| name | file:line | apps | call sites | look / semantics |
|---|---|---|---|---|
| AvailabilityPageSwitch | apps/web/components/AvailabilityPageSwitch.tsx:9 | Web | 2 (AvailabilityGrid.tsx:126, MyAvailabilityCalendar.tsx:76) | `surface` segmented, navigates, announced as `aria-pressed` |
| Draft Lists tabs | apps/admin/screens/DraftListsScreen.tsx:120-145 | Admin | 1 (2 tabs + mono counts) | tint pills, `?tab=` query, `tablist`/`tab`/`aria-selected`, no tabpanel, no arrows |

- **Differences**: three looks for one job (segmented, tint pills, underline): DRIFT/UNSURE; no mockup covers any of them (Phase 29 and Phase 31 picked them). Navigation announced as a pressed toggle: DRIFT. Half a tablist: DRIFT.
- **Target**: G3's `LineTabLink` for both (Draft Lists `?tab=history` as a link, count as `badge`). If the owner keeps the segmented look for Availability, add an `as="links"` mode to G1 rendering `<Link aria-current>`.
- **Behaviour contract**: links + `aria-current="page"`.
- **Migration**: 2 + 1 sites. `data-draft-tab` (used by `visual/admin-draft-lists.spec.ts:96`) must stay. `availability-phase29.spec.ts:85` uses group "Availability page" + button "My availability" (breaks if it becomes links). The "History" button clicks in `mobile-phase04`, `booking-detail-layout`, `admin-phase06/07`, `list-moves-phase32` are HistorySheet buttons, not these tabs. Size **S** once the look is decided.
- **Upcoming phases**: 38b builds the same pattern on Review (`/admin/review?tab=events`, count on the tab, doc line 210): decide the look before 38b so it reuses `LineTabLink`. 34's Intake tabs are the same job.
- **Value**: medium visibility (Availability and Draft Lists are demo beats).
- **Confidence**: medium (needs a design ruling).
- **Catalogue rows**: web "AvailabilityPageSwitch"; Draft Lists tabs: none.

### G5 · Navigation chrome (a11y only, visuals stay)
- **Job**: each app's primary navigation and its active state.
- **Members**

| name | file:line | app | look | a11y today |
|---|---|---|---|---|
| SideNav | apps/admin/components/SideNav.tsx:37 | Admin | ink panel, `inset 3px 0 0` crimson | `<nav>` unlabelled, buttons, no `aria-current` |
| WebNav | apps/web/components/WebNav.tsx:27 | Web | `inset 0 -3px 0` crimson | `<nav>` unlabelled, buttons, no `aria-current` |
| BottomTabBar | apps/mobile/MobileApp.tsx:26 | Mobile | teal icon + label | `<div data-testid="mobile-tab-bar">`, buttons without `type`, no `aria-current` |
| Master data sub-nav | apps/admin/screens/masters/MasterData.tsx:46 | Admin | tint row r8 | labelled `<nav>` + `aria-current` (the model) |

- **Differences**: three active looks are INTENDED (Admin Day mockup crimson inset bar; Web Dashboard crimson underline; `Mobile App.dc.html:106` tab bar active `#0D6E63`). DL line 63 lists "active nav" as a crimson use, so the phone is the one exception and it comes from the mockup itself. SideNav inactive 0.9 alpha: INTENDED (commit f0260990). Missing `aria-current`, labels, `<nav>` on mobile: DRIFT (a11y).
- **Target**: no shared visual. Add `<nav aria-label>` and `aria-current="page"` in place (or a tiny `navItemProps(active)` helper in `shared/ui/`).
- **Behaviour contract**: Master data sub-nav's.
- **Migration**: 3 files, attributes only; keep `button` role. Selectors that must keep working: 43 Playwright clicks (38 literal + 5 via `pwa-device.spec.ts:48` `tab()`), in admin-phase06, admin-phase07, admin-phase08, availability-phase29, booking-detail-layout, mobile-insets, mobile-interactions, mobile-phase03, mobile-phase13, phase11, pwa-device, routing (12), web-phase05, xero-pair; Vitest `WebCatalogue.test.tsx:43-44` (asserts `fontWeight: '600'`). `data-testid="mobile-tab-bar"`, `data-shot="nav-badge-*"` stay. Size **S**.
- **Upcoming phases**: 26 (WebNav Profile tab), 33/34 (SideNav Intake item), 42 (rebuilds Master data sub-nav: fold its tidy-up there), 43/43a (SideNav, WebNav). Attributes now, standalone.
- **Value**: no visual change; real screen-reader gain; low visibility.
- **Confidence**: high.
- **Catalogue rows**: admin "SideNav (with RolesInfo)", admin "Master data sub-nav", web "WebNav", mobile "BottomTabBar".

### G6 · List progress bar
- **Job**: "n of N complete" plus a thin animated bar for a List's Bookings.
- **Members**

| name | file:line | app | call sites |
|---|---|---|---|
| web List detail bar | apps/web/screens/ListDetailView.tsx:200-206 | Web | 1 |
| mobile List detail bar | apps/mobile/screens/ListDetailScreen.tsx:233-248 | Mobile | 1 |

- **Differences**: fixed 200px vs full width, gap 12 vs 10: INTENDED (desktop panel header vs phone; design source `Mobile App.dc.html:128`). Easing literal equal to `easing.card` (theme/motion.ts:16): DRIFT. No progressbar semantics: DRIFT. Reduced motion: already handled by global.css:652-660 (sweep was wrong).
- **Target**: `shared/ui/ProgressBar.tsx` `{ done, total, label?, width?: number | 'fill' }`, `role="progressbar"` + `aria-valuenow/min/max` + `aria-label`; reads `semantic.success.solid`, `neutral.line`, `easing.card`.
- **Behaviour contract**: progressbar semantics (none today).
- **Migration**: 2 sites + 2 catalogue recreations. No selectors on the bar found. Size **S**.
- **Upcoming phases**: 23 and 24 edit `ListDetailView`; 33a and 40 edit both List detail screens. Standalone is fine (tiny).
- **Value**: ~25 lines; low.
- **Confidence**: high.
- **Catalogue rows**: web "Progress bar", mobile "Progress bar".

### G7 · Other price switch card (generic Switch deferred)
- **Job**: the step rail's "Other price" toggle card with its amount field.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| inline copy | shared/booking/BillingCard.tsx:221-262 | Admin, Web (Billing card) | 1 |
| OtherPriceToggle | shared/flows/ContractRail.tsx:569-628 | phone sheet; ManualBookingForm on Admin and Web | 1 |
| (ToggleRow) | pwa/PwaDemoPanel.tsx:146 | PWA demo panel | 2, kept separate |

- **Differences**: same card, copy and `data-shot`s written twice: DRIFT. Inline has `.aa-rail-focus` and an inline Save/Use button; sheet has `aria-invalid` and a helper line: DRIFT. Input 40 vs 44: UNSURE (the 44 copy also shows on desktop through ManualBookingForm, so it is not a clean phone/desktop split). ToggleRow 52×32 whole-row: INTENDED (PwaDemoPanel.tsx:140-145).
- **Target**: `OtherPriceCard` in `shared/flows/`: `{ on, onToggle, fallbackName, mayType, amount, onAmount, invalid, action?: ReactNode, inputHeight? }`; `role="switch"`, `aria-checked`, `.aa-rail-focus`, `aria-invalid`, helper line. A generic `Switch` waits for Phase 27 (approval-step toggle) or 42 (Show retired).
- **Migration**: 2 sites; keep `contract-rail-other-price` / `contract-rail-amount`. Demo guide `04-presenter-cheat-sheet.md:21,105` (label unchanged). Size **M**.
- **Upcoming phases**: 21 (now running) edits both files; 23 and 24 change pricing around it. Do it right after 21, not in parallel.
- **Value**: ~50 lines; medium (the Phase 20 showcase).
- **Confidence**: high.
- **Catalogue rows**: none for the rail; mobile "ToggleRow (switch)" (unchanged).

### G8 · Contract step rail markers
- **Job**: numbered step markers (done tick, current, jump back) for the Contract step rail.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| RailSlot | shared/booking/BillingCard.tsx:354 | Admin, Web Billing card | 1 map (:285) inside `<nav><ol><li>` |
| RailStepButton | shared/flows/ContractRail.tsx:355 | phone sheet (3-col compact) and desktop vertical column (ManualBookingForm, Admin and Web) | 1 map; containers `role="list"` at :288 and :295 |

- **Differences**: circle 24 mono with connector vs 22 no connector, active border vs none: DRIFT, because Admin and Web now show both looks (Billing card vs Add booking dialog). PROGRESS.md:368 makes the inline rail follow the mock's "A. Step rail". `role="list"` on a div whose children are buttons (no `listitem`): DRIFT (invalid ARIA).
- **Target**: `StepMarker` + `StepRail` in `shared/flows/`, `orientation: 'vertical' | 'compact'`, `<ol>` semantics, `aria-current="step"`, keep `data-shot="contract-rail-step-{n}"`. Canonical: RailSlot.
- **Migration**: 2 sites; capture recipes use `contract-rail-step-*`. Size **M**.
- **Upcoming phases**: 21 (adds the "Suggested" pill to the rail options), 23, 35. After 21.
- **Value**: medium (visible side by side in the Phase 20 demo).
- **Confidence**: medium-high.
- **Catalogue rows**: none.

## Dropped or rejected
- **E-G9 Billing pipeline stepper** (BillingMonitorScreen.tsx:275-283, `StageChip` :347): one member; Phase 37 restyles the screen. Note for 37: render as `<ol aria-label="Billing pipeline">`, state in text, not only `title`.
- **SignalFilterButton and StatusLegend toggles** (B-G9 members): multi-select, already `aria-pressed` + labelled group + `.aa-filter-toggle`; look is the meaning (warning tint; status legend doubles as filter). Keep.
- **Draft Lists tabs as a chip** (B-G9): they are page-view tabs, handled in G4.
- **Generic Switch now** (E-G7): two real tracks, one demo-only; wait for Phase 27.
- **Master data sub-nav / AppSwitcher row unification** (E-G5): different contexts; Phase 42 rebuilds the sub-nav; AppSwitcher belongs to the popover family.

## Intended differences to keep
- Segmented `teal` (DL:271, Mobile App:387) and `surface` (Mobile Availability:200) looks and their 0.2 / 0.15 shadows.
- SortToggle's compact 36px overall height (fits DayNav's 36px toolbar).
- Solid filter pills (Web Availability:55-56, Mobile App:37-39) vs tint option chips (Mobile App:389-393 `chip()`); pill heights 36 web / 38 mobile.
- Active nav: Admin crimson inset bar, Web crimson underline, Mobile teal (Mobile App:106); line tabs ink underline (DL:63; preview PLAN.md branding note).
- SideNav inactive text 0.9 alpha (commit f0260990).
- Progress bar 200px in the web panel header vs full width on the phone.
- PWA ToggleRow 52×32 whole-row target.

## Questions for the user
1. Balances' ink pill segmented: keep it, or switch to the default teal segmented (DL: teal is the selection colour) and delete the `ink` variant and its 0.18 shadow? Recommended: teal, delete `ink`.
2. Segmented controls, tabs and nav items: keep them as `button` (adding `aria-pressed` / `aria-current`, optional arrow keys), or move to radio / tab / link roles and rewrite about 68 Playwright clicks, 11 group selectors and 27 capture-recipe steps? Recommended: keep `button`.
3. Page-view switches (Web Availability Find cover / My availability, Draft Lists, and the coming Review Events tab and Intake tabs): all on the underline tab strip as links? Recommended: yes.
4. Phase 34 asks for "`selection-slide` for the Intake tabs": read it as the underline strip (no sliding thumb)? Recommended: yes, underline, optionally with the underline sliding.
5. Mobile tab bar active colour: keep teal as the Mobile App mockup draws it? Recommended: keep teal.
6. Contract step rail: make the phone sheet's and the Add booking dialog's step markers match the inline Billing card's (the mock's look), after Phase 21? Recommended: yes.
7. Single-choice filter pills: keep them as pills (mockups) rather than folding them into the segmented control as the preview recommends? Recommended: keep pills.

## Bugs found
- `role="list"` containers with button children and no `listitem` (shared/flows/ContractRail.tsx:288 and :295): invalid ARIA. Sure (read the full render path).
- None of SortToggle, FilterChip, SideNav, WebNav, BottomTabBar expose their selected state to assistive tech (no `aria-pressed` / `aria-current`). Sure; a11y gaps, not functional bugs.
- AvailabilityPageSwitch announces route navigation as a pressed toggle. Sure; a11y.
- No functional bugs found in this family.
- Side note for the tokens sweep: BillingCard.tsx:529 re-types `elevation.e3` as a literal (missed by E's literal list).
