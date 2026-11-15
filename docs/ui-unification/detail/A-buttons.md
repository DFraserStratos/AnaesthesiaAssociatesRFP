> Detail file for `docs/ui-unification/README.md` (audit of 12 November 2026): buttons, text actions, back links, icon buttons, sheet footer buttons.
> Group numbers here (G1, N1 ...) are local to this file; the README's U-numbers point to them. Paths are relative to `aa-prototype/src/` unless they start with `docs/`.

# V-A · Verified: buttons, text actions, back links, icon steppers, close buttons, docks, footer pairs

Verifier of `A-buttons.md`. Paths relative to `aa-prototype/src/` unless they start with `docs/`.
`P` = `docs/prototype-build/PROGRESS.md`, `DL` = `docs/design/Design Language.dc.html`.

## Verification summary

| Group | Verdict | What I corrected |
|---|---|---|
| G1 Action button (primary / secondary) | CONFIRMED WITH CORRECTIONS | SlotDrawer ActionBtn "disabled stays teal" is latent, not live (no disabled primary is ever passed). ActionBtn has 15 uses, not 22. ReviewScreen overrides are 3x 40h + 1x 48h/15 ("Authorise"), not 3x 40h. InvoiceDocument's 40px buttons are a user decision (P:228). Only about 35 product raw buttons (plus about 20 demo/shell) are really Button's job, not "about 150". Several members are rebuilt soon (Integrations moves to Future scope in 34, Billing monitor restyled in 37, Invoice document reworked in 22). G6 folded in as a variant. |
| G2 Teal text action | CONFIRMED WITH CORRECTIONS | Masters TextAction equals shared TextAction `small` minus padding, so it is a padding prop, not a size. Masters views are refit by Phase 42 (fold in there or land first). |
| G3 Back link | CONFIRMED WITH CORRECTIONS | The breadcrumb on Review is the design's own (`Admin Review.dc.html`); the back link is the addition, so the question is "drop the back link", not "drop one". |
| G4 Bordered icon stepper | CONFIRMED WITH CORRECTIONS | Labelling DayNav's `‹ ›` breaks two Playwright specs that click by name `›`. NudgeButton is named by its visible text (not an a11y gap). DayNav `TextBtn` (-4w/-1w/+1w/+4w) was missed. |
| G5 Close and clear icon buttons | CONFIRMED | Counts and focus-return claims hold. |
| G6 Teal-outlined secondary | MERGED into G1 (variant `outline`) | `officeActionStyle` has 1 use ("Raise pre-procedure invoice"), which Phase 27 deletes. ReviewScreen "Log phone note" uses neutral Button secondary where the design has teal outline 44/r12. |
| G7 Completion dock | DROPPED as a component; two small fixes kept | 56 vs 54 is the design's own (Mark complete 56/r14/17 + shadow; Mark list completed 54/r14/16, `Mobile App.dc.html`). The "looks disabled but tappable" dock is the Phase 04 flow (P:650). Web SubmitAction 42/r12/14 matches the Web Dashboard header button. A shared `CommitAction` would merge three intentionally different looks. |
| G8 Destructive button | CONFIRMED (owner question) | ContractEditSheet "Disable" is likely replaced by Phase 42's RetireSection. |
| G9 Sheet footer pair | CONFIRMED WITH CORRECTIONS | Overlaps F. Home should be the `useSurface()` seam (admin and web both run under `SurfaceProvider variant="web"`), not a new surface test. Phase 35 rewrites "almost every edit sheet", so fold in there or land first. |
| Cross-cutting: mobile press feedback | CORRECTED | The "every enabled button in the phone" scope is INTENDED (DL `motion/control-press`: "Enabled controls inside the phone only") and pinned by `visual/mobile-interactions.spec.ts`, which presses a List **row**. Moving it into Button's own stylesheet would remove it from rows: a visible change and a test failure. Desktop with no press is also intended by DL. |

Counts re-run today: 262 raw `<button>` in 105 files (sweep: 261 / 102); 145 `<Button`/`<MobileButton` uses (admin
104, shared 40, mobile 1, web/demo/shell 0); `variant="pill"`: 0 uses. Buttons without `type`: 29 by my parse
(sweep 25), but there is **no `<form>` anywhere in `apps/` or `shared/`**, so none of them can submit anything.

---

### Action button (G1 + G6): extend shared `Button`
- **Job:** a labelled command button: filled teal primary, neutral outlined secondary, teal-outlined secondary, tinted pill.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| `Button` (shared) | shared/ui/Button.tsx:26 | A, W (via shared flows), M | 145 |
| `ActionBtn` | apps/admin/components/drawerParts.tsx:36 | A | 5 (DraftListDrawer) |
| `ActionBtn` (private copy) | apps/admin/components/SlotDrawer.tsx:416 | A | 10 |
| `PanelAction` | shared/availability/AvailabilitySlotPanel.tsx:169 | A, W, M | ~3 |
| SeriesList `pill` | shared/availability/SeriesList.tsx:49 | A, W, M | 2 |
| "Move a List" / `SubmitAction` ready | apps/web/screens/DashboardScreen.tsx:136; ListDetailView.tsx:344 | W | 2 |
| RightRail note buttons; `PagerButton` | apps/admin/components/RightRail.tsx:262 to 267; NotificationsScreen.tsx:132 | A | 5 |
| AaFees run / save; Run payables, Resolve & retry | apps/admin/screens/AaFeesScreen.tsx:153, :581; BillingMonitorScreen.tsx:167, :323 | A | 4 |
| Teal outline: Today, Find available, This month, Move this List, MonthGrid Today | DayNav.tsx:34, :47; MyAvailabilityCalendar.tsx:86; AvailabilityGrid.tsx:132; ListDetailView.tsx:177; shared/calendar/MonthGrid.tsx:224 | A, W, M | 6 |
| "Add billing line" (re-types `pill`) | shared/capture/BillingLinesCard.tsx:53 | A, W, M | 1 |
| "Add days off" (re-types primary block) | apps/mobile/screens/MyAvailabilityCalendarScreen.tsx:154 | M | 1 |
| Demo/shell copies | apps/demo/DemoControlPanel.tsx:88, :100; DemoXero.tsx:284, :437; shell/DemoResetButton.tsx:102; shell/DemoActionsMenu.tsx:26 | demo, shell | ~20 |
| Resized Buttons | ReviewScreen.tsx:209, :217, :225 (40h/13), :385 (48h/15); ContractPriceRanges.tsx:206 (36h); ModifierPickerSheet (44h/15); ManualBookingForm lookup (48h) | A, shared | 7 |

- **Differences**
  - Button primary 54 / secondary 48 in Admin and web dialogs: INHERITED, not ruled. P:291 moved Button to shared "so the web app reuses the identical control"; no entry sets a desktop size. The designs give desktop buttons 42/r12/14 (`Web Dashboard.dc.html` Offer cover), 44/r12/14 (`Admin Review.dc.html` Authorise, Log phone note) and 36 to 40/r10/13 (Admin Day / Web Availability Today, Web Dashboard Request leave). So a desktop size is INTENDED by design and its absence is DRIFT. Whether the 104 admin sheet-footer Buttons should shrink is the owner's call (a visible change on every admin sheet).
  - InvoiceDocument 40px Email/Print: INTENDED (P:228).
  - Disabled: Button `line`/`mist`; drawerParts ActionBtn `lineStrong`; RightRail and demo `opacity .5`. DRIFT. SlotDrawer ActionBtn never sets a disabled fill for primary, but its only disabled use (:378 "Close out of hours") is secondary, so nothing renders wrong today (latent).
  - SlotDrawer :378 prints the disabled reason beside the button (better than drawerParts' hover-only `title`). Adopt it.
  - Radius r10 / r12 literal / r999 (pager, SeriesList, PanelAction). DRIFT; r12 is the design's desktop value with no token.
  - Teal-outline secondary is the design's own pattern (four mockups) and has no Button variant: DRIFT that it is hand-rolled 6 times. MonthGrid Today r999: DRIFT. ReviewScreen "Log phone note" renders neutral secondary where the design shows teal outline: DRIFT.
  - Demo/shell quieter look: plausibly INTENDED (presenter chrome), no ruling.
  - `color: '#FFFFFF'` literals instead of `neutral.surface`: DRIFT.
- **Target:** extend `shared/ui/Button.tsx`. `variant: 'primary'|'secondary'|'outline'|'pill'|'danger'`, `size: 'touch'(default, today's 54/48/44)|'desktop'(44, r12, 14/600)|'compact'(36, r10, 13/600)`, `block`, `disabled`, `disabledReason?` (printed line + `aria-describedby`), `title?`, `shot?`, `...rest` (needed: BillingLinesCard's button carries `data-validation-procedure-id` / `data-validation-fields`). Tokens: `accent.base/hover/pressed/tint/focusRing`, `neutral.surface/line/lineStrong/mist/ink/slate`, `radius.ctl/card` (add `radius.btn = 12`). Canonical: today's Button for touch; the Admin Review design for desktop; Admin Day "Today" for compact; the design's teal outline for `outline`. Default stays `touch`, so no existing call site changes size unless migrated.
- **Behaviour contract:** native button, `type="button"` default, real `disabled`, teal focus-visible ring from `accent.focusRing`, `accent.hover` on hover (desktop only). Press feedback stays in global.css (see cross-cutting). Gains: focus ring and a reason readable without hover.
- **Migration:** about 35 product sites plus about 20 demo/shell. Keep `data-shot` (dashboard-move-list, list-move, admin-availability-finder-open, drawer-change-status, drawer-close-out-of-hours, scenario-*), `data-testid="admin-list-actions"` wrapper, Playwright `getByRole('button', {name})`, `data-validation-*` on Add billing line. No seed or PERSIST_VERSION effect. Size M (many files, each small).
- **Upcoming phases:** 27, 33, 33a, 34, 35 all add "disabled-with-reason" teal buttons (I-context.md): land `disabledReason` + `desktop` before 27. Skip members being rebuilt: IntegrationMonitorScreen (demoted to Future scope, 34), BillingMonitorScreen (restyled 37, again 39a), InvoiceDocument (reworked 22), ReviewScreen header (21a), officeActionStyle (deleted 27). SlotDrawer/DraftListDrawer are touched by 33a: migrate before.
- **Value:** removes the private ActionBtn copy and about 300 lines of style objects; high visibility (Review header vs drawer vs sheet footers in S-beats).
- **Confidence:** high on duplication; the admin sheet-footer size needs the owner.
- **Catalogue rows:** admin "Button", admin "drawerParts (Section, Row, DrawerLink, ActionBtn)", admin "SlotDrawer", admin "DraftListDrawer", admin "TickButton", admin "DayNav (with SortToggle)", admin "ContractPriceRanges", mobile "Button (MobileButton)", web "SubmitAction", web "SeriesList", mobile "SeriesList".

### Text action (G2)
- **Job:** a borderless teal word that does one thing (Edit, Open, Clear, Show all, Remove).
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| `TextAction` (shared) | shared/ui/TextAction.tsx:7 | A, W, M | 11 |
| `TextAction` (masters) | apps/admin/screens/masters/chrome.tsx:35 | A | ~24 direct + every `EditCell` |
| `textActionStyle` / `linkStyle` | apps/admin/tableChrome.ts:39; shared/availability/SeriesList.tsx:62 | A, W, M | 36 references |
| `LinkButton`; `inlineLinkStyle` | apps/web/screens/DashboardScreen.tsx:368; AccountsScreen.tsx:274 | W | 3 |
| Inline teal copies | e.g. DraftListDrawer.tsx:181; NotificationsCard.tsx:185; ReviewQueue.tsx:155; InvoicesScreen.tsx:223; ForwardListsScreen.tsx:367; BookingDetailBody.tsx:99; HistoryTimeline.tsx:204; CompleteBar.tsx:48 | all | ~40 |
| Red "Remove" | shared/capture/BillingLinesCard.tsx:111; BtmCaptureBlock.tsx:173 | all | 2 |

- **Differences**
  - Masters TextAction = shared TextAction `small` (12.5/600) with padding 0 instead of `4px 0`. DRIFT; a `flush` prop covers it.
  - Six font sizes 11.5 to 15: in-table 12.5, in-card 14, mobile 15 + 44 min-height (INTENDED, DL touch rule / P:336). The rest DRIFT.
  - Red "Remove" on billing lines next to teal "Remove" in the modifier ledger (ModifiersSection.tsx:100): DRIFT against convention 17 unless the owner keeps a danger tone (see G8 question).
  - Underline on CompleteBar "Amend" (inline beside text) and AccountsScreen (inside a sentence): INTENDED-ish (inline links); AssignDraftListSheet slate underline: UNSURE.
- **Target:** shared `TextAction` with `size: 'sm'|'md'|'lg'`, `flush`, `tone: 'action'|'danger'`, `inline`, `disabledReason`, `shot`, `...rest`; children widened to `ReactNode`. Delete masters `TextAction`, `LinkButton`, `linkStyle`, `inlineLinkStyle`; keep `textActionStyle` only for `<Link>` uses.
- **Behaviour contract:** `type="button"`, focus-visible ring as `.aa-table-entity-link:focus-visible` (global.css:418), real `disabled` + reason.
- **Migration:** ~85 sites, mechanical. Keep `data-shot` (admin-draft-lists-see-all, admin-notifications-*, review-open-booking, mobile-main-view-earlier, rvg-code-clear, recurring-booking-draft-lists) and the `aria-label`s Conflicts/DraftLists rows expose. WebCatalogue-style tests assert inline styles: check `mastersPages.test.tsx`. Size M.
- **Upcoming phases:** 42 refits every masters view ("one pattern for every view"): migrate masters either first or inside 42. 21a adds "Correct" link, 23 "Make primary", 24 "Use the computed price", 27/36 teal links: all should use the result.
- **Value:** ~350 lines; medium visibility. **Confidence:** high.
- **Catalogue rows:** admin "Table / Header / TextAction / EditCell", web "LinkButton", web "SeriesList", admin "NotificationsCard", web "HistoryTimeline".

### Back link (G3)
- **Job:** return to the parent screen.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| inline back button (5 identical) | apps/web/screens/ListDetailView.tsx:149; BookingDetailView.tsx:90; apps/admin/screens/ReviewScreen.tsx:192; AdminBookingDetail.tsx:54; InvoicesScreen.tsx:73 | W, A | 5 |
| "‹ Back to inbox" | apps/admin/screens/IntegrationMonitorScreen.tsx:287 | A | 1 |
| `BackLink` (Link, slate) | apps/admin/components/ProfileChrome.tsx:18 | A | 2 |
| `BackLink` (sheet step) | shared/flows/moveSheetParts.tsx:13 | A, W, M | 5 |
| mobile header back | apps/mobile/screens/ListDetailScreen.tsx:170; BookingDetailScreen.tsx:77; MyAvailabilityCalendarScreen.tsx:54 | M | 3 |

- **Differences:** 5 desktop copies byte-identical (DRIFT). Mobile 15/44/chevron 18 INTENDED (`Mobile App.dc.html`, DL touch). Sheet step 13px INTENDED-ish. ProfileChrome slate: UNSURE. Review and Invoices breadcrumb: the breadcrumb is in `Admin Review.dc.html` ("Review queue / Dr ..."), the back link is not, so if one goes it is the back link. IntegrationMonitor glyph: DRIFT, but that screen moves to Future scope in 34 (leave it).
- **Target:** `shared/ui/BackLink.tsx`: `BackLink({ children, onClick?, to?, size: 'desktop'|'touch'|'step' })`, `<Link>` when `to`, else `<button type="button">`. Canonical: the 5 identical desktop copies; mobile 15/44/18.
- **Behaviour contract:** focus ring as `.aa-table-entity-link`; real links where a route exists (ProfileChrome).
- **Migration:** 15 sites; Playwright names ("Lists", "List", "Back to queue", "All invoices"), `visual/booking-detail-layout.spec.ts`. Size S.
- **Upcoming phases:** 21a reworks ReviewScreen, 35 AdminBookingDetail, 43a the list detail screens: small enough to land first.
- **Value:** ~120 lines; high visibility. **Confidence:** high.
- **Catalogue rows:** web "Back link", admin "ProfileChrome".

### Icon button (G4 + G5)
- **Job:** a button holding only an icon: bordered steppers and month/day nav; borderless close and clear.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| `WeekNavButton`, `IconBtn`, `NavButton` | apps/web/components/WeekStrip.tsx:153; AvailabilityGrid.tsx:271; MyAvailabilityCalendar.tsx:196 | W | 6 |
| `SquareBtn` (unlabelled `‹ ›`), `TextBtn` (-4w to +4w, missed by sweep) | apps/admin/components/DayNav.tsx:90, :97 | A | 2 + 4 |
| `StepButton`, remove item | apps/admin/screens/AaFeesScreen.tsx:238, :523 | A | 3 |
| month nav; mini calendar nav | masters/HospitalsView.tsx:147; RightRail.tsx:213 | A | 4 |
| `MonthButton` = `RoundButton` (identical styles) | apps/mobile/screens/MyAvailabilityCalendarScreen.tsx:198; shared/calendar/MonthGrid.tsx:240 | M | 2 + 4 |
| `StepperButton`, `NudgeButton`, `Stepper` | shared/capture/ui.tsx:70, :109; shared/booking/BookingDetailBody.tsx:877 | all | 10 |
| drawer close x4 | SlotDrawer.tsx:144, :310; DraftListDrawer.tsx:123; MasterPanel.tsx:68 | A | 4 |
| chip remove; search clear | ChipMultiSelect.tsx:62; ContractEditSheet.tsx:512; NameSearchBox.tsx:84; web ListsLookback.tsx:44; mobile ListsLookback.tsx:67 | all | 5 |

- **Differences:** desktop 32/34/36/38 trace to three mockups that disagree (UNSURE). `‹ ›` glyphs vs Lucide (DayNav glyph is the Admin Day design's). MonthButton/RoundButton duplicate (DRIFT). Capture steppers 44/r12 INTENDED (StepperButton doc: "the mockup's 44px round-square"). NudgeButton is named by its visible text ("-5"): no a11y gap. Drawer closes identical (DRIFT). ContractEditSheet chip remove and both ListsLookback clears do not return focus; ChipMultiSelect and NameSearchBox do (DRIFT, a11y). Web 30 vs mobile 44 clear INTENDED.
- **Target:** `shared/ui/IconButton.tsx`: `IconButton({ label (required), onClick, disabled, size: 32|36|44, shape: 'square'|'round', tone: 'neutral'|'action', bordered = true, shot?, children })`, plus a `CloseButton` preset. Canonical desktop: WeekNavButton/IconBtn (white, 1px `line`, slate, Lucide 16); mobile: MonthButton.
- **Behaviour contract:** `aria-label` required by the type; focus ring; disabled `lineStrong`; clear/remove presets take a `returnFocusTo` ref.
- **Migration:** ~35 sites. **Risk:** `visual/admin-phase06.spec.ts:60` and `admin-phase09.spec.ts:47` click `getByRole('button', { name: '›', exact: true })`: adding `aria-label="Next day"` changes the name, so update both specs in the same change. `getByRole('button', {name: 'Close'})` in warnings and out-of-hours specs stays. Size M.
- **Upcoming phases:** 43a touches DayNav; 42 HospitalsView; ContractEditSheet chip select is a re-built ChipMultiSelect (a chips/fields family item).
- **Value:** ~250 lines; medium visibility; one real a11y gain (DayNav). **Confidence:** high on duplication, medium on the size.
- **Catalogue rows:** web "IconBtn · NavButton · WeekNavButton", web "Day stepper", web "WeekStrip", admin "DayNav (with SortToggle)", admin "MiniCalendar (RightRail)", admin "HospitalCalendar", mobile "StepperButton", mobile "NudgeButton", mobile "MonthGrid (LookbackDateSheet)", mobile "My calendar month grid", admin "MasterPanel / PanelGrid / PanelSection", admin "ChipMultiSelect", admin "NameSearchBox", web "WebSearchField", mobile "LookbackSearchRow".

### Destructive button (G8)
- **Job:** end or remove something.
- **Members:** apps/admin/flows/ContractEditSheet.tsx:225 "Disable" and shared/booking/BookingDetailBody.tsx:736 area "Cancel booking" (identical 48h r10 red outline, `${semantic.error.solid}55`); red text "Remove" (G2). Confirms inside sheets are teal primary.
- **Differences:** no P ruling on red; convention 17 says teal is the only action colour. UNSURE (owner).
- **Target:** `Button variant="danger"` (outline only) if kept; else `secondary`. Replace the `55` alpha suffix with a token.
- **Migration:** 2 + 2 sites, S. **Upcoming phases:** 42 adds `RetireSection` to every master edit sheet (likely replaces "Disable"); 41 reworks CancelBookingSheet (the button stays).
- **Value:** low lines, medium visibility. **Confidence:** high. **Catalogue rows:** admin "ContractPanel (ContractEditSheet)", mobile "BookingDetailBody".

### Sheet footer pair (G9, button parts only; overlay parts belong to F)
- **Job:** Cancel + confirm at a sheet's foot.
- **Members:** all shared `Button`. Row secondary + primary block ~13 (ScheduleSettingsView:167, EditSlotTimesSheet:64, SessionStatusSheet:201, AssignListSheet:84 ...); equal halves 4 (ReviewScreen:398, ClearConflictSheet:68, HolidaySheet:130, RecurringBookingSheet:287); stacked primary over secondary (RvgGroupsView:275, AvailabilityStatusesView:116, shared AlertOfficeSheet, MoveListSheet, MoveBookingToColleagueSheet, ManualBookingForm with `marginTop: 4`); right-aligned in the 600px MasterPanel (BillingMonitorScreen:250, ContractEditSheet:238, PartyPanel:109).
- **Differences:** stacked on the phone INTENDED (`Mobile Availability.dc.html` 54 over 50). The shared flows stack on web dialogs too (DRIFT). Right-aligned in the docked panel: UNSURE (ATLAS docked-panel pattern). Four desktop arrangements otherwise DRIFT.
- **Target:** `shared/ui/ActionBar.tsx` reading `useSurface().variant` (admin and web both run under `SurfaceProvider variant="web"`: AdminApp.tsx:63, WebApp.tsx:54): stacked on mobile, row secondary-then-primary on web. Absorbs the 5 `marginTop: 4/8` overrides.
- **Migration:** ~30 sheets, M. Keep button names for Playwright. **Upcoming phases:** 35 rewrites "almost every edit sheet" (primary reads "Apply" in draft) and 42 every master sheet: land before 35 or fold in.
- **Value:** medium visibility. **Confidence:** medium. **Catalogue rows:** admin "ClearConflictSheet", web/mobile "SubmitListSheet", admin "MasterPanel / PanelGrid / PanelSection".

## Dropped or rejected
- **G7 shared `CommitAction`:** dropped. Mark complete 56/r14/17 + shadow and Mark list completed 54/r14 each copy their own mockup (`Mobile App.dc.html`); the grey tappable dock is the Phase 04 blockers flow (P:650); web SubmitAction 42/r12/14 matches the Web Dashboard header button; the web CompleteBar halo is user-signed-off (P:224). Keep two small fixes: "Add days off" becomes `Button primary block` (G1), and the done state swap gets `role="status"`.
- **"Move mobile press feedback into the Button stylesheet":** rejected. It would drop press from rows, chips and tabs, which DL intends and `mobile-interactions.spec.ts` asserts on a List row.
- **"About 150 hand-rolled vs 145 Button":** reframed. About 63 are TextAction's job, about 27 IconButton's, about 110 are other families; about 35 product + 20 demo/shell are Button's job.
- **Missing `type="button"` as a defect:** harmless (no `<form>` in the app); fixed for free by the shared components.

## Intended differences to keep
- Touch sizes on mobile (44 to 54 targets, 15px back link, 44 round month buttons): DL "Touch targets >= 48 px on mobile", P:336, `Mobile App.dc.html`.
- Press feedback on every enabled control inside the phone, none on desktop: DL `motion/control-press` "Enabled controls inside the phone only"; `global.css:571`.
- InvoiceDocument 40px Email/Print: P:228.
- Mark complete 56 vs List dock 54, grey tappable blocked dock: `Mobile App.dc.html`, P:650.
- Teal-outline secondary as its own look: Admin Day, Web Availability, Web Dashboard, Admin Review mockups.
- Review breadcrumb: `Admin Review.dc.html`.
- Capture steppers 44/r12: the mockup (shared/capture/ui.tsx:69).
- TickButton as a fixed preset (Phase 32b); dashed InlineDemoTrigger (demo marker); quieter demo/shell chrome.

## Questions for the user
1. Admin and web sheet footers use the 54px mobile primary today. Keep them, or move them to a 44px desktop size like the Admin Review design? Recommended: keep 54 in sheet footers for now; use the new desktop size only where buttons are hand-rolled today.
2. One desktop icon-stepper size? Recommended: 36 (Admin Day), the middle of 32 to 38.
3. Red destructive outline and red "Remove" links: keep as `danger`, or make them teal? Recommended: keep red outline for Cancel booking only, make "Remove" links teal.
4. ProfileChrome back link slate or teal? Recommended: teal.
5. Review and Invoices show a breadcrumb and a back link to the same place: drop the back link? Recommended: yes (the breadcrumb is the design's).
6. Should demo/shell tools use the shared Button at `compact` size? Recommended: yes, for consistency, no new look.

## Bugs found
- **DayNav previous/next buttons have no accessible name** beyond the glyphs `‹`/`›` (DayNav.tsx:46, :54). Sure.
- **ContractEditSheet chip remove and both ListsLookback search clears drop focus** to the body when the button disappears (ContractEditSheet.tsx:512; web ListsLookback.tsx:44; mobile ListsLookback.tsx:67), unlike ChipMultiSelect and NameSearchBox. Sure.
- **SlotDrawer `ActionBtn` primary ignores `disabled` in its fill** (SlotDrawer.tsx:423): latent only; no caller passes `primary` with `disabled`. Sure it does not show today.
- Not a bug: SlotDrawer "Close out of hours" disabled has no `title`, but prints its reason beside the button (SlotDrawer.tsx:379), the better pattern.
