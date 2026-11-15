> Detail file for `docs/ui-unification/README.md` (audit of 12 November 2026): modal behaviour, side panels, sheet chrome, popovers, confirms, notices, empty states.
> Group numbers here (G1, N1 ...) are local to this file; the README's U-numbers point to them. Paths are relative to `aa-prototype/src/` unless they start with `docs/`.

# V-F: verified Overlays and feedback (from F-overlays-feedback.md)

Paths relative to `aa-prototype/src/` unless stated. Line numbers re-read on 2026-11-12; a few have moved (Phase 21 is in
progress), e.g. BookingDetailBody post-op success box is now :733 (was :752), the teal post-op addendum :544 (was :548).

## Verification summary

| group | verdict | what I corrected |
|---|---|---|
| G1 Modal shell behaviour | CONFIRMED WITH CORRECTIONS | Escape bug confirmed by full trace, and it is wider than stated (any Escape not swallowed by a non-empty search box closes both). "Nothing traps focus" accurate. Added: inert must be scoped and must preserve SlideStack's own `inert`; the drawer gap is already logged (PROGRESS.md:1906, :1927). |
| G2 Side panel + drawer parts | CONFIRMED WITH CORRECTIONS | "Disabled teal primary is visible in the S-run" is wrong: SlotDrawer's only `disabled` ActionBtn (:378) is a secondary; the primary "Assign List" (:362) is never disabled. Latent only. ActionBtn overlaps A-buttons G (cross-reference). |
| G3 Sheet title and close | CONFIRMED WITH CORRECTIONS | Dialog names: only MasterPanel names its dialog (1, not 2). ContractRail's `aria-labelledby` is on an inner `role=group` with a fixed id `contract-rail-title`, not on the dialog. CodePickerSheet is another 17/600 title. |
| G4 Sheet footers | CONFIRMED WITH CORRECTIONS | The A vs B split follows a platform rule: shared sheets (designed phone-first) stack primary on top; Admin-only desktop sheets put the primary last/right, matching MasterPanel's documented "primary (teal) one last". Proposed target already encodes this; the DRIFT is only A1 vs A2 vs A3 within Admin and C on web. |
| G5 Popovers | CONFIRMED | Re-read all five; handlers on `document` (shell) and `window` (combo) as stated. |
| G6 Confirm steps | CONFIRMED WITH CORRECTIONS | Order is not random: stacked = primary top, row on desktop = primary right. The real outliers are the in-card rows (SeriesList, AvailabilitySlotPanel, demo panels) that put the primary LEFT in a row. No destructive vs consequential distinction exists anywhere (no danger variant; teal only, by rule), so that does not explain anything. |
| G7 Error box | SKIPPED (other verifier) | Cross-reference only: G8 `Notice tone="error"` must not duplicate `FormError`; booking-level error banners are the only overlap. |
| G8 Warning/info callouts | CONFIRMED (spot-checked) | Read ConflictCallout, SoftWarning; others not re-read in full. Absorb G11. |
| G9 Success / result line | CONFIRMED WITH CORRECTIONS | Teal tint for "it worked" is DRIFT, not UNSURE: DL says accent is "primary actions and selection only, never status"; the mockups use `#E1F0ED` only for hover/selection; the DL complete-tick pattern "success tint floods"; done steps, TickBadge, SuccessOverlay and the Review banner are green. Teal result lines (8) are the outliers. |
| G10 Done step | CONFIRMED WITH CORRECTIONS | AddBookingFlow's primary Done is INTENDED in effect: its click runs `onCreated(bookingId)` (opens the new Booking); scrim/Escape skips that. Keep primary there or make it a prop. |
| G11 Neutral notes | MERGED into G8 | Same target (`Notice tone="neutral"`); keep as a sub-list under G8. |
| G12 Empty states | SPLIT | Not one job at 5 looks. E2 (table empty row) belongs to the tables sweep's `EmptyRow` (G-tables G1/G10 already claim it). E5 (picker no-match) belongs to each picker. Keep one `EmptyState` for E1 inline, E3 card, E4 centred mobile. E3 also overlaps G-tables G10: one owner needed. |

### G1: Modal shell behaviour (Dialog, BottomSheet, MasterPanel, the three drawers)
- **Job:** a modal surface that takes over the screen until dismissed.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| Dialog (web seam) | shared/surface/Dialog.tsx:33 | Admin, Web | 60 `<Overlay` in 57 files (re-counted: 60/57) |
| BottomSheet (mobile seam) | shared/surface/BottomSheet.tsx:27 | Mobile, PWA | same 60 + 3 direct |
| MasterPanel | apps/admin/components/MasterPanel.tsx:28 | Admin | 2 (ContractPanel, PartyPanel) |
| SlotDrawer x2 shells | apps/admin/components/SlotDrawer.tsx:131, :300 | Admin | 1 mount |
| DraftListDrawer | apps/admin/components/DraftListDrawer.tsx:~101 | Admin | 1 |

- **Differences**
  - No focus trap anywhere: DRIFT, accurate. No Tab handling, no focus-trap code, no `inert` on any overlay background (the only
    `inert` is SlideStack's parked layers). MasterPanel moves focus in and back but Tab walks out into the page behind.
    Focus enters 3 seam sheets only through a child `autoFocus` (CodePickerSheet, ModifierPickerSheet, ContractRail).
  - MasterPanel Escape outside the `OPEN_DIALOGS` stack: DRIFT, causes the confirmed bug (see "Bugs found").
  - Drawers have no role, Escape or focus: DRIFT, already logged as known (PROGRESS.md:1906 "the drawer has no dialog role or
    focus trap ... one shared shell is 43a's or polish"; :1927).
  - BottomSheet no Escape: UNSURE (no keyboard on a phone; matters only for the installed PWA on a keyboard device).
  - Centred dialog on web vs bottom sheet on mobile: INTENDED (convention 16, PROGRESS.md:71, :292).
  - Side panel vs centred dialog on Admin: INTENDED (ATLAS "Overlays that need clicks", catch-up 18; MasterPanel docblock).
- **Target:** `useModalLayer({open, onClose, rootRef, initialFocusRef?, scopeRef?})` in `src/shared/surface/`. One module-level
  stack (generalise `OPEN_DIALOGS`, ordered by open time, not document order) that Dialog, BottomSheet, MasterPanel and the G2
  SidePanel all register with; ONE `window` keydown listener for the stack that closes only the top entry. Focus in on open,
  back on close, Tab trapped, background `inert`. No visual change; no portal.
- **Behaviour contract:** MasterPanel's focus in/return (:36 to :48), Dialog's topmost Escape (:39 to :53), SlideStack's `inert`.
  PhoneFrame constraint: overlays render in place inside the scaled frame (BottomSheet is `absolute` inside the
  `transform: scale()` device div, PhoneFrame.tsx ~:247; `createPortal` is used nowhere). The hook must never portal to `body`;
  `inert` is applied by walking from the modal root up to `scopeRef` (the device content root on the framed build, the app root in
  the PWA and on web) and marking siblings at each level; the harness bar and PhoneFrame zoom toolbar sit outside the scope and
  are never touched. Restore each element's previous `inert` (do not clear SlideStack's parked-layer `inert`).
- **Migration:** Dialog, BottomSheet, MasterPanel (3 files) carry every seam site with no call-site change. Keep `role="dialog"`
  + `aria-modal` (8 Playwright specs, 4 Vitest files, SlideStack edge-swipe guard `[role="dialog"][aria-modal]`). Shell
  popovers (G5) should consult the same stack or a modal's Escape still also closes an open harness menu. Size M.
- **Upcoming phases:** 35 adds "Leave without saving?" on every edit sheet (needs a close guard: `onClose` may be refused); 43a
  adds HelpPanel (side panel). Build before 35 so its unsaved-changes confirm plugs into one close path.
- **Value:** 4 Escape/focus implementations to 1; fixes a demo-visible data-loss bug on the Contracts master.
- **Confidence:** high (full code path read; not run in a browser).
- **Catalogue rows:** admin "Dialog (useSurface().Overlay)", admin "MasterPanel / PanelGrid / PanelSection", admin "SlotDrawer",
  admin "DraftListDrawer", web "Dialog (web Overlay)", mobile "BottomSheet".

### G2: Right-docked side panel (SlotDrawer, DraftListDrawer, MasterPanel) and the drawer parts
- **Job:** a right-docked desktop panel: scrim, header (name, meta, corner X), scrolling body, actions.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| SlotDrawer List shell | apps/admin/components/SlotDrawer.tsx:131-147 | Admin | 1 |
| SlotDrawer empty-session shell | SlotDrawer.tsx:300-312 | Admin | 1 |
| DraftListDrawer shell | apps/admin/components/DraftListDrawer.tsx:~99-127 | Admin | 1 |
| MasterPanel | apps/admin/components/MasterPanel.tsx:51-78 | Admin | 2 |
| drawerParts | apps/admin/components/drawerParts.tsx:10-49 | Admin | DraftListDrawer + catalogue |
| SlotDrawer private parts | SlotDrawer.tsx:390-428 | Admin | SlotDrawer only |

- **Differences**
  - Three byte-identical shells (scrim z40, aside z41, literal shadow `-8px 0 24px rgba(23,35,32,0.16)`, header 20/24, title
    div 18/700, X 20): DRIFT, confirmed by reading.
  - SlotDrawer re-declares drawerParts; drawerParts docblock (:4-5) claims SlotDrawer's out-of-hours drawer uses it (false): DRIFT.
  - Row label 72 vs 80, ActionBtn pad 14 vs 12, disabled primary teal vs `lineStrong`: DRIFT, but **latent**: no primary
    ActionBtn in SlotDrawer is ever disabled (:362 "Assign List" has no `disabled`; :378 is a secondary). Not visible in a demo.
  - 440 vs 600 width: INTENDED (MasterPanel docblock). Title div vs h2: DRIFT.
- **Target:** `SidePanel` in `apps/admin/components/` (Admin-only today; 43a's HelpPanel is Admin too): `{open, onClose, title,
  meta?, width: 'list' | 'record', footer?, shot?, testId?, panelAttrs?, children}`; uses the G1 hook. Canonical: the drawer
  header with MasterPanel's h2 + `aria-labelledby` + `elevation.e3`. SlotDrawer imports drawerParts (80px label, grey disabled).
  Coordinate the `ActionBtn` merge with A-buttons (its table lists both copies).
- **Behaviour contract:** G1 hook + MasterPanel's labelledby. Gain: the main Admin drawer gets Escape, role, focus.
- **Migration:** 3 shells + MasterPanel. Keep `data-testid="admin-list-drawer"` (9 specs + `theme/global.css`), `data-shot`
  `admin-slot-drawer` / `admin-draft-list-drawer`, `data-slot-id` / `data-list-id` on the panel element. Adding `role="dialog"`
  to the drawers adds matches to any `[role="dialog"]` locator in specs that open a sheet from the drawer: check `.first()`/
  `.last()` usage. Capture recipes reference drawer selectors. Size M.
- **Upcoming phases:** 33a (StubRow in drawers), 35 (drawer actions), 43a (HelpPanel "in the List drawer's pattern"). Do before 43a.
- **Value:** ~60 lines of shell + ~40 of parts; demo visibility medium (Escape on the main drawer).
- **Confidence:** high.
- **Catalogue rows:** admin "SlotDrawer", admin "DraftListDrawer", admin "MasterPanel / PanelGrid / PanelSection", admin
  "drawerParts (Section, Row, DrawerLink, ActionBtn)".

### G3: Overlay title, description and close affordance
- **Job:** the heading and optional one-line description at the top of every sheet/dialog.
- **Members:** ~64 hand-typed title divs 18/700 across the 57 seam files (pattern `fontSize: 18, fontWeight: 700` at the top of an
  Overlay body). Outliers: CodePickerSheet.tsx:47 (17/600), ContractRail.tsx:~283 (h2 17/600), AddBookingFlow.tsx:~69
  (h2 `typeScale.title` 22), ListOptionsSheet.tsx:27 (17/700), PwaDemoPanel.tsx:~265 (20/700), MasterPanel.tsx:65 (h2 20/700).
  Representative plain: CancelBookingSheet.tsx:41, ClearConflictSheet.tsx:57.
- **Differences:** 17/18/20/22: DRIFT (`typeScale.title` exists, used once). No visible close on web: DRIFT (seven seam sheets have
  no button at all). Mobile handle as the close: INTENDED (BottomSheet.tsx:96, convention 16). Correction: only MasterPanel names
  its dialog; ContractRail labels an inner group with a hard-coded id.
- **Target:** `OverlayHeader {title, description?}` in `src/shared/surface/`, h2 with `useId`, registers its id so the Overlay sets
  `aria-labelledby`; web Dialog shows the drawer corner X when a header is present. Canonical 18/700 + 13 slate (majority).
- **Behaviour contract:** a name on every dialog (today 1 of ~66).
- **Migration:** ~64 sites, mechanical; text locators still match. Size M.
- **Upcoming phases:** nearly every phase adds a sheet (21 PayerSheet now in progress, 22, 23, 24, 35, 38b, 39, 39b, 41, 42).
  Land before 22 so new sheets start on it.
- **Value:** high leverage for new sheets; visibility medium.
- **Confidence:** high on duplication; canonical size is a question.
- **Catalogue rows:** admin "Dialog (useSurface().Overlay)", web "Dialog (web Overlay)", mobile "BottomSheet", admin
  "ClearConflictSheet", admin "CodePickerSheet", web "CodePickerSheet", mobile "ListOptionsSheet".

### G4: Sheet footer actions
- **Job:** commit/dismiss buttons at the foot of a sheet.
- **Members:** A1 row 50/50 Cancel left (ClearConflictSheet.tsx:~66, HolidaySheet.tsx:~130, ReviewScreen authorise), A2 Cancel
  hugging + primary filling (~12, e.g. AssignListSheet.tsx:84, EditSlotTimesSheet.tsx:64), A3 hugging right in a footer bar
  (ContractEditSheet.tsx:238, PartyPanel), B stacked primary on top (shared: CancelBookingSheet.tsx:~59, RemoveProcedureSheet,
  SubmitListSheet, AlertOfficeSheet, MoveListPrompt), C primary only (~21).
- **Differences:** B in shared sheets vs A in Admin: INTENDED in principle (shared bodies are phone-first, PROGRESS.md:71; stacked
  is the phone idiom; on desktop the primary sits last/right, MasterPanel prop doc). But B is also rendered unchanged inside the web
  Dialog: DRIFT on web. A1 vs A2 vs A3 inside Admin: DRIFT. C on web: DRIFT (pairs with G3's missing X).
- **Target:** `SheetActions {primary, secondary?}` in `src/shared/surface/`; surface decides: mobile stacks primary over secondary,
  web one row with the primary last. Pick A1 or A2 (question 2).
- **Behaviour contract:** none new.
- **Migration:** ~45 sites; button-name locators unchanged. Size M.
- **Upcoming phases:** 35 rewrites almost every edit sheet's primary to "Apply"; 41 CancelBookingSheet. Fold into 35 or land just
  before it.
- **Value:** 4 layouts to 1 per platform; visibility medium.
- **Confidence:** medium-high.
- **Catalogue rows:** admin "ClearConflictSheet", web/mobile "SubmitListSheet", web/mobile "AlertOfficeSheet" (mobile) /
  "AlertOfficeEntry" (web), admin "SlotStatusSheet".

### G5: Anchored popovers and menus
- **Job:** a small panel under a trigger, closed by outside click and Escape.
- **Members:** DemoActionsMenu (shell/DemoActionsMenu.tsx:~118, e2), DemoClockMenu (:~95, e3), DemoResetButton (:~77, e3),
  AppSwitcher (:~124, `radius.panel`, `role=menu`, no Escape), ContractCombo (shared/booking/BillingCard.tsx:~446-529, window
  `mousedown` + window Escape).
- **Differences:** confirmed as written. e2 vs e3, panel vs card radius, mousedown vs pointerdown: DRIFT. Shell vs product:
  harness chrome is INTENDED to look demo-only (convention 13) but only the trigger, not the panel.
- **Target:** `usePopover` + `PopoverPanel` in `src/shared/ui/` as proposed; canonical DemoClockMenu panel.
- **Behaviour contract:** DemoActionsMenu's (Escape returns focus, aria-expanded/controls); AppSwitcher drops `role=menu` (cheaper).
  Escape should defer to the G1 modal stack.
- **Migration:** 5 files; `DemoActionsMenu.test.tsx`, `DemoResetButton.test.tsx`, `visual/shell-clock.spec.ts`,
  `visual/demo-actions.spec.ts`; `data-shot` `contract-combo`, `contract-combo-list`. Size S.
- **Upcoming phases:** 43 touches DemoActionsMenu/DemoResetButton; 43a adds `InfoTip`, the first product popover: land before 43a.
- **Value:** ~100 lines; visibility low except the combo.
- **Confidence:** high.
- **Catalogue rows:** none for the shell popovers; ContractCombo has no own row.

### G6: Confirm steps
- **Job:** ask before a consequential action.
- **Members:** sheet confirms (CancelBookingSheet, RemoveProcedureSheet, SubmitListSheet, ReviewScreen authorise,
  ClearConflictSheet, RemoveDraftListSheet, PairingEndSheet); in-sheet swap (HolidaySheet.tsx:~124, ScheduleSettingsView.tsx:
  ~123/168); in-card row (SeriesList.tsx:44-52, AvailabilitySlotPanel.tsx:~143-152, DemoControlPanel, DemoIntegrations);
  popover (DemoResetButton); direct sheet (PwaDemoPanel.tsx:~262).
- **Differences:** stacked primary-first (shared sheets, phone idiom) vs row Cancel-left (Admin): explained by G4's platform rule,
  not drift in itself. DRIFT: the in-card rows put the primary LEFT of "Keep it" in a row on both web and mobile; SeriesList and
  AvailabilitySlotPanel are the same series-delete confirm in two looks (pill buttons vs `PanelAction` in a `neutral.bg` box).
  "Keep it" / "Keep the booking" / "Cancel": DRIFT in copy. Teal on destructive confirms: INTENDED (teal only action colour,
  convention 17); there is no destructive variant, so destructive vs consequential cannot explain any difference. Popover in the
  harness vs sheet on PWA: INTENDED (PwaDemoPanel comment, thumb reach).
- **Target:** `ConfirmSheet` (G3 + G4 parts) and `InlineConfirm` (AvailabilitySlotPanel block) as proposed; one rule: stacked
  = primary top, row = primary last.
- **Behaviour contract:** initial focus on the safe button; InlineConfirm moves focus in and back to the Delete link (today lost
  when the link unmounts, SeriesList.tsx:41).
- **Migration:** ~15 sites; `data-shot` `availability-series-confirm`, `holiday-delete-confirm`, `scenario-confirm`;
  `DemoResetButton.test.tsx`. Size M.
- **Upcoming phases:** 17a (contact confirms), 23 (Make primary), 35 (unsaved-changes confirm), 41 (Contract-change
  confirmation), 42 (retire/restore). Land `ConfirmSheet` before 23.
- **Value:** 5 idioms to 2; visibility medium.
- **Confidence:** medium-high.
- **Catalogue rows:** admin "ClearConflictSheet", web/mobile "SubmitListSheet"; no row for SeriesList's confirm.

### G8: Callouts and notes (`Notice`; absorbs G11)
- **Job:** a non-blocking warning, info or neutral note inside a form, panel or page.
- **Members:** ConflictCallout (apps/admin/components/conflicts/ConflictCallout.tsx:37), NotPreferredWarning
  (apps/admin/components/pairing/NotPreferredWarning.tsx:18), SoftWarning (apps/admin/flows/AssignDraftListSheet.tsx:173), demo
  `Callout` x2 (DemoIntegrations.tsx:~524, DemoXero.tsx:~808), attention boxes (IntegrationMonitorScreen.tsx:92,
  InvoicesScreen.tsx:110, BillingMonitorScreen.tsx:147), BillingCard needs-destination x2; G11 neutral notes (SlotDrawer
  MovedHereLine ~:441/:462, BookingDetailBody.tsx:~538, AlertOfficeSheet.tsx:58/:182, DraftListDrawer.tsx:~131,
  SessionStatusSheet.tsx:~195, PairingEndSheet.tsx:32, ContractRail/BillingCard outcome) and teal info notes
  (ReassignListFlow.tsx:~126, BookingDetailBody.tsx:544, ScheduleSettingsView.tsx:162, BtmCaptureBlock.tsx:195,
  RecurringBookingSheet.tsx:294 preview).
- **Differences:** three identical warning shells and two identical demo Callouts: DRIFT. Icon/border/radius mix: DRIFT. Teal
  tint for plain information: DRIFT (DL: accent never status; mockups use the teal tint only for hover and selection).
- **Target:** `Notice {tone: 'warning'|'error'|'success'|'neutral', title?, icon?, live?, shot?}` in `src/shared/ui/`, ConflictCallout
  shell canonical; neutral = `neutral.bg` + line + `radius.card` + 10/12 + 13/19. Error tone only for booking-level banners, not
  form errors (G7 owns `FormError`).
- **Migration:** ~25 sites; pass through `data-shot` (`conflict-warning`, `pairing-warning`, `integrations-attention`,
  `drawer-moved-here`, `booking-moved-to-you`, `contract-rail-outcome`, `procedure-additional-note`, ...). Size M.
- **Upcoming phases:** 22, 27, 33, 35, 38b, 42, 43 all add banners; land early (before 22).
- **Value:** high leverage; visibility medium.
- **Confidence:** medium-high (warning members spot-checked, not every note re-read).
- **Catalogue rows:** admin "ConflictCallout", admin "NotPreferredWarning", web/mobile "MovedToYouPanel" (neighbouring note).

### G9: Success / result line
- **Job:** confirm in place that an action happened.
- **Members:** ResultLine (shared/availability/AvailabilityForm.tsx:306) and its hand-rolled teal copies: HolidaySheet.tsx:121,
  AddAnaesthetistFlow.tsx:98 (no role), AddHospitalSheet.tsx:35 (no role), RecurringBookingSheet.tsx:322, DraftListsScreen.tsx:145,
  ConflictsScreen.tsx:169, ReferenceViews.tsx:95; SeriesList.tsx:57 (plain text); green: AaFeesScreen.tsx:575,
  AlertOfficeSheet.tsx:68, BookingDetailBody.tsx:733, ReviewScreen.tsx:247.
- **Differences:** teal vs green: DRIFT (DL accent "never status"; DL complete-tick "success tint floods"; green is already the
  success colour in TickBadge, SuccessOverlay, done steps, the Review banner per `docs/design/Admin Review.dc.html`). Missing role
  on 2: DRIFT. Conditionally mounted `role=status`: DRIFT (UpdatePrompt.tsx does it right).
- **Target:** `ResultLine {line, actions?, onDismiss?, shot?}` in `src/shared/ui/`, always-mounted live region; colour per question 4
  (recommend success tint + `success.onTint`).
- **Migration:** ~11 sites; `data-shot` `availability-result`, `draft-lists-assigned`, `conflicts-confirmation`,
  `recurring-bookings-apply-result`, `review-authorised-banner`. A colour change reshoots availability and Admin capture
  screenshots. Size S.
- **Upcoming phases:** 42 rebuilds masters (ReferenceViews, Holiday): fold those two in there.
- **Value:** 8 copies; visibility medium.
- **Confidence:** high.
- **Catalogue rows:** web "ResultLine", admin "Inline success banner (role=status)".

### G10: In-sheet done step
- **Job:** end state of a multi-step sheet flow.
- **Members:** AddBookingFlow.tsx:98-116, MoveBookingToColleagueSheet.tsx:~266, AlertOfficeSheet.tsx:155-162, MoveListSheet.tsx:~270,
  SessionStatusSheet.tsx:~287 (all: TickBadge 72, title 18/700 `success.onTint`, 13 slate, block button).
- **Differences:** five copies: DRIFT. Primary Done on AddBookingFlow: INTENDED in effect (its Done runs `onCreated`, which opens
  the new Booking; scrim/Escape does not), so `DoneStep` takes the action node as given. Flood vs done step for Admin assign vs
  status: UNSURE (question 7).
- **Target:** `DoneStep {title, detail?, action, shot?}` in `src/shared/ui/`, `role=status`, focus the action on mount.
- **Migration:** 5 sites; `data-shot` `move-booking-done`, `alert-office-done`, `move-done`, `office-status-done`. Size S.
- **Upcoming phases:** none rebuild these; standalone.
- **Value:** ~80 lines; visibility low-medium. **Confidence:** high.
- **Catalogue rows:** mobile "AlertOfficeSheet", web "AlertOfficeEntry".

### G12: Empty states (split)
- **Job:** say "nothing here" where a list or panel would be.
- **Members kept:** E1 inline mist line (~23, e.g. RightRail.tsx:240, WarningsToDo.tsx:66, ReviewQueue.tsx:80, SeriesList.tsx:35,
  AvailabilitySlotPanel.tsx:78) and 3 private `EmptyNote` (DashboardScreen.tsx:380, IntegrationMonitorScreen.tsx:545,
  DemoXero.tsx:898); E3 card (ConflictsScreen.tsx:176, DraftListsScreen.tsx:156, RvgGroupsView.tsx:125, ContractsView.tsx:~140,
  BalancesScreen.tsx:154 `EmptyCard`); E4 centred mobile (ForwardListsScreen.tsx:394, AvailabilityScreen.tsx:~267).
- **Moved out:** E2 table rows to the tables sweep's `EmptyRow`; E5 picker no-match lines stay inside their pickers (part of a
  combobox, styled with the list).
- **Differences:** 12.5 vs 13, mist vs slate, three EmptyNote copies: DRIFT. E3 plain vs titled: DRIFT. E4 centred mobile:
  INTENDED (mobile list screens).
- **Target:** `EmptyState {variant: 'inline'|'card'|'centred', title?, children, action?}` in `src/shared/ui/`; card canonical =
  RvgGroupsView. Agree one owner with G-tables G10.
- **Migration:** ~35 sites; `data-shot` `conflicts-empty`, `draft-lists-empty`, `masters-rvg-groups`, `contract-catalogue` stay on
  the element (note `masters-rvg-groups` is shared with the table it replaces). Size M, low risk.
- **Upcoming phases:** 33 (Matching "starts empty"), 37 (empty states), 42 (masters). Land before 33.
- **Value:** low visibility. **Confidence:** medium-high.
- **Catalogue rows:** mobile "EmptyCard".

## Dropped or rejected
- G11 as a separate group: merged into G8.
- G12's E2 and E5: belong to the tables sweep and to the pickers respectively.
- G2's "disabled teal primary visible in the S-run": not reachable today; keep as a latent fix inside the merge.

## Intended differences to keep
- Bottom sheet on mobile, centred dialog on web/Admin, handle as the mobile close: convention 16 (PROGRESS.md:71, :292).
- MasterPanel 600 vs drawer 440: MasterPanel docblock; ATLAS catch-up 18.
- Stacked primary-on-top in phone sheets; primary last in a desktop row: MasterPanel prop doc; convention 16.
- Teal on destructive confirms (no danger variant): convention 17.
- PWA reset as a bottom sheet: PwaDemoPanel comment.
- AddBookingFlow primary Done (it commits navigation).
- SuccessOverlay flood for Booking complete and List submitted: DL complete-tick; PROGRESS.md P:1606, P:1804.
- Authorised banner in success green: `docs/design/Admin Review.dc.html`.
- Overlays render in place, never portalled, so mobile ones stay inside the scaled PhoneFrame (BottomSheet docblock).

## Questions for the user
1. Sheet title size: 18/700 everywhere, or `typeScale.title` 22? Recommend 18/700 (63 of 64 today; 22 is visibly larger).
2. Desktop footer row: 50/50 or Cancel hugging with primary filling? Recommend Cancel hugging, primary last (12 of 17 Admin sheets).
3. In-card confirms: move the primary to the right of "Keep it" to match the desktop row rule? Recommend yes on web, stacked or
   right on mobile per G4.
4. "It worked" colour: switch the 8 teal result lines to success green, and teal info notes to neutral? Recommend yes (DL rule).
5. Web dialogs with no visible close: add the corner X to the web Dialog? Recommend yes (one change covers ~27 sheets).
6. Admin assign/reassign flood vs status-change done step: pick one? Recommend leave until a phase touches them.
7. BottomSheet Escape for the installed PWA on a keyboard device? Recommend yes, via the G1 stack (cost is nil).

## Bugs found
- **Escape in the RVG code picker closes the whole Contract panel and loses the form.** Certain from code (not run in a
  browser). Path: `ContractPanel` renders `CodePickerSheet` inside `MasterPanel` (apps/admin/flows/ContractEditSheet.tsx:439);
  on Admin the seam Overlay is `Dialog`. Both `Dialog` (shared/surface/Dialog.tsx:48) and `MasterPanel`
  (apps/admin/components/MasterPanel.tsx:43) add a bubble-phase `keydown` listener on `window`. `NameSearchBox`
  (shared/ui/NameSearchBox.tsx:~62) calls React `e.stopPropagation()` only when the box has text; under React 18 (root-container
  delegation) that stops the native event at the root, so neither window listener runs. Otherwise both run for the same event:
  the Dialog sees itself topmost (MasterPanel is not in `OPEN_DIALOGS`) and closes the picker; MasterPanel's listener has no
  topmost check (:41) and calls `onClose`, which in ContractsView.tsx:~215 is `setPanel(null)`, unmounting `ContractPanel` and
  its unsaved `useState` fields. It fires on any Escape with focus on a picker row, or an empty search box; with text, the
  first Escape clears and the second closes both. So the picker can never be closed by Escape alone. Same in the demo catalogue's
  ContractPanel example. PartyPanel opens no nested overlay, so it is unaffected. ContractPriceRanges and ProcedureCodeCard already
  stop propagation for their own Escape. Fix: G1 shared stack (or a one-line interim: register MasterPanel's root in the same
  stack and check topmost).
- **Latent:** SlotDrawer's private `ActionBtn` keeps a disabled primary teal (SlotDrawer.tsx:~422); unreachable today.
