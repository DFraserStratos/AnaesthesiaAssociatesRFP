# UI unification audit: the components that should be one

**Status: done, 23 November 2026.** U1 to U7 are built (16 to 23 November 2026). The audit below is the
12 November 2026 picture; `RESULTS.md` gives, per group, that count, the count after U7 and what was left and
why, with the "after" catalogue shots in `shots-after/`. The rule now lives in `CLAUDE.md` ("One component per
job") and is enforced by `aa-prototype/src/apps/oneComponentPerJob.test.ts`. All 27 questions in section 6
were answered by Donald on 12 November 2026, each with the recommended answer.

**Decision behind this:** we are not adopting shadcn or any component library (section 10). We keep our own
design and code, and make it one component per job.

## 1. Summary

The prototype has about 211 hand-built components. This audit found **36 groups** where the same job was
built more than once, plus **design token gaps** and **nine confirmed bugs** that fall out of the duplication.

The five that matter most:

1. **Money prints three ways in one demo beat.** The office Booking total shows "$3100.00", Accounts and
   Invoices show "$3,100.00", and the procedure stack shows "Fixed price $3,100". A Playwright spec and the
   demo script both carry the ungrouped figure. (U01)
2. **One Escape can lose a Contract form.** In the Contract panel, with the RVG code picker open and its search
   empty, one Escape closes the picker and the whole panel. Reproduced in the running app on 12 November. It
   happens because four overlays each handle Escape on their own. (U02)
3. **Sheets, pills and notices are the families every remaining phase adds to.** 64 sheet titles are typed by
   hand, about 30 pills copy the shared `Pill`, and 24 error boxes copy `FormError` (17 of them silent to
   screen readers). The 28 remaining catch-up phases add about ten more sheets and pills in 22 phases.
   Consolidating these first stops new copies. (U03, U04, U05, U11)
4. **"White here, sunken there" has one cause.** The design files draw every field as a grey well on a white
   sheet or card. The shared search box went white in Phase 32a and admin toolbars now mix white search boxes
   with grey selects on a grey page. One fill rule fixes search, selects and inputs together. (U06, U07, U15)
5. **Tables and cards are the largest duplication by volume.** Seven table cell implementations, ten
   hand-rolled table shells and about 30 card copies. Two product tables cannot be opened by keyboard, one of
   them on a scripted demo screen. (U09, U10, U14)

What the verification pass changed:

- **Much of what looked like drift is copied from the mockups.** Pill sizes, avatar sizes, stepper sizes and
  glyphs, the mobile tab bar's teal, the teal "today" in the mobile date sheet, and the completion dock heights
  all trace to `docs/design/` or a Decisions-log entry. Section 5 lists them. They stay.
- **"About 150 hand-rolled buttons" is really about 55.** The rest are text actions, icon buttons or other jobs.
- **The five calendars are two jobs**, so they share a keyboard hook and a header, not one component.
- **Four groups were dropped**: the completion dock, status-tinted labels without a dot, small dots, and the
  billing pipeline stepper.

The plan (section 9, full version in `PLAN.md`) is seven owner-added phases, U1 to U7, about 12 sessions,
interleaved with the catch-up phases, plus a list of items folded into the catch-up phases that already
rebuild a screen.

## 2. Files in this folder

| File | What it holds |
|---|---|
| `README.md` | This report. |
| `PLAN.md` | The phased consolidation plan: U1 to U7, what folds into which catch-up phase, done criteria, how to register the phases. |
| `index.html` | The visual companion: every group with its members side by side (screenshots of the live catalogue), the proposed canonical version and the call-site counts. Open it in a browser. |
| `detail/A` to `G` | The verified per-family findings: every member with file and line, each difference marked intended or drift, target API, behaviour contract, migration risks. The U-numbers below point into these. |
| `detail/H-tokens.md` | The token gap sweep with reproducible ripgrep commands. |
| `detail/I-context.md` | The remaining catch-up phases and the UI each builds; the decisions that make a difference intended (with PROGRESS.md line numbers); what must not break. |
| `detail/J-completeness.md` | The check of all 170 catalogue rows and every source folder, ten families the sweeps missed, and the token spot-check. |
| `shots/` | Screenshots of all 170 live catalogue rows taken on 12 November 2026 (`shots/index.json` maps row names to files; `shots/shoot.mjs` retakes them). They double as the "before" baseline for each phase. |

## 3. The ranked groups

Ranked by value: duplication removed, how visible the inconsistency is in a demo, and how many remaining
phases need the component. **Phase** is the plan phase that builds it (section 9). **Q** marks a group that
waits on a question in section 6. **Bug** marks a group that fixes a confirmed defect.

| Rank | Group | Today | Size | Demo visibility | Phase | Flags |
|---|---|---|---|---|---|---|
| 1 | **U01 Money formatting** | 3 helpers, ~25 display sites, 8 message sites | S to M | High | U1 | Bug |
| 2 | **U02 Modal behaviour (Escape, focus, trap)** | 4 implementations behind about 66 overlays | M | High | U2 | Bug |
| 3 | **U03 Sheet title and close** | 64 sites | M | Medium | U2 |  |
| 4 | **U04 Label pill** | ~30 definitions; 20 uses of the shared Pill | M | Medium | U3 |  |
| 5 | **U05 Error box** | 24 copies, 4 inline refusal lines | S | Low (a11y) | U3 |  |
| 6 | **U06 Search box** | 3 implementations; 2 call sites to swap, a fill prop on 10 | S | High | U4 | Q |
| 7 | **U07 Select field** | 35 selects in ~20 files | M | Medium | U4 | Q |
| 8 | **U08 Action button** | 145 Button uses; ~55 hand-rolled copies | M | High | U5 | Q |
| 9 | **U09 Clickable table rows** | 12 tables | S to M | Medium (a11y) | U6 | Bug |
| 10 | **U10 Table cells and shell** | 7 cell implementations, 10 shells | M | Medium | U6 | Q |
| 11 | **U11 Notice (callouts and notes)** | ~25 sites | M | Medium | U3 |  |
| 12 | **U12 Result line** | ~11 sites | S | Medium | U3 | Q |
| 13 | **U13 Text action** | ~85 sites | M | Medium | U5 |  |
| 14 | **U14 Card and panel** | ~30 copies | M | Medium | U6 | Q |
| 15 | **U15 Inputs, checkbox, switch and focus** | ~10 inputs, 7 checkboxes, 3 switches, 3 textareas, 11 hints | S to M | Medium | U4 |  |
| 16 | **U16 Segmented control** | 1 hand-built copy, 3 override sites | S | Medium | U5 | Q |
| 17 | **U17 Underline tabs and page switch** | 4 definitions, 13 sites; 2 page switches | S | Medium | U5 | Q |
| 18 | **U18 Sheet footer, confirm and done step** | ~45 footers, ~15 confirms, 5 done steps | M | Medium | U2 | Q |
| 19 | **U19 Side panel (drawers)** | 4 shells | M | Medium | U2 |  |
| 20 | **U20 Icon button** | ~35 sites | M | Medium | U5 | Bug, Q |
| 21 | **U21 Back link** | 15 sites | S | High | U5 |  |
| 22 | **U22 Eyebrow label** | ~60 sites in ~40 files | M | Medium | U6 |  |
| 23 | **U23 Session status block** | 7 builds, 4 bypassing `blockFill` | M | Medium | U6 | Bug |
| 24 | **U24 Contract chooser parts and step rail** | 2 builds of 4 parts | M | Medium | U4 | Bug |
| 25 | **U25 Avatar and persona chip** | 7 definitions, ~13 sites | S | Medium | U3 |  |
| 26 | **U26 Count badge and attention dot** | 5 counts, ~8 discs | S | Medium | U3 |  |
| 27 | **U27 Date fields, jump to date, time entry** | 20 date inputs, 2 jump inputs, 3 time pairs | M | Medium | U4 |  |
| 28 | **U28 Date text, timestamps, plurals** | ~90 date sites, ~15 timestamps, 86 plurals | M | Low to medium | U1 | Q |
| 29 | **U29 Empty state** | ~35 sites | M | Low | U3 |  |
| 30 | **U30 Popover** | 5 copies | S | Low | U2 |  |
| 31 | **U31 Page header, stat tile, label and value rows** | 20 headers, 2 tile builds, 7 row builds | S each | Low to medium | U6 |  |
| 32 | **U32 Filter pills, navigation state, progress bar** | 2 + 3 + 2 sites | S | Low | U5 |  |
| 33 | **U33 Calendar keyboard and month header** | 2 pickers, 3 content grids | S | Low | U4 |  |
| 34 | **U34 Number stepper, radio keyboard, chip multi-select** | 5 + 4 + 1 | S | Low (a11y) | U4 |  |
| 35 | **U35 Smaller repeats** | ~30 sites in all | S each | Low | U6 |  |
| 36 | **U36 Destructive button** | 4 sites | S | Medium | U5 | Q |

### Group by group

Each entry gives the job, what exists today, the single target, which existing look becomes canonical, what
must not break, and when it has to land. Members with file and line, the full list of differences, the API
sketch and the behaviour contract are in the detail file named at the end of each entry.

#### U01 · Money formatting

- **Job:** Show an NZD amount.
- **Today:** Three helpers plus about 25 hand-written `$${x.toFixed(2)}` display sites and 8 message sites. The office Booking total and the capture billing lines print "$3100.00"; Accounts and Invoices print "$3,100.00"; the procedure stack prints "Fixed price $3,100". All three appear in one scripted demo beat.
- **Target:** `formatMoney(n, { cents, sign })` in the existing `domain/billing/money.ts`, re-exported from `shared/format.ts` as `formatCurrency`. Grouped thousands everywhere.
- **Canonical look:** The Accounts and Invoices format: "$3,100.00".
- **Must not break:** `visual/contracts-phase19a.spec.ts` asserts the ungrouped figure and the demo script (03, line 811) tells the presenter to expect "$3200.00": update both in the same change.
- **When:** Before Phase 24, which puts the Booking total in front of the anaesthetist. Phase U1, size S to M.
- **Detail:** `detail/D-dates-formatting.md`, G9 Money formatting.

#### U02 · Modal behaviour (Escape, focus, trap)

- **Job:** A surface that takes over the screen until dismissed.
- **Today:** Four separate Escape and focus implementations (Dialog, BottomSheet, MasterPanel, three drawer shells). Only MasterPanel moves focus in and back. Nothing traps focus or makes the background inert. Two window listeners both fire on one Escape.
- **Target:** `useModalLayer({ open, onClose, rootRef })` in `shared/surface/`: one stack, one key listener that closes only the top layer, focus in and back, Tab trap, scoped `inert`. No visual change. No portals (the phone frame is scaled).
- **Canonical look:** MasterPanel's focus handling plus Dialog's topmost check.
- **Must not break:** Keep `role="dialog"` and `aria-modal` (8 Playwright specs, 4 Vitest files, the SlideStack edge-swipe guard). `inert` must preserve SlideStack's own parked layers.
- **When:** Before Phase 35, whose "Leave without saving?" needs one close path. Phase U2, size M.
- **Detail:** `detail/F-overlays-feedback.md`, G1 Modal shell behaviour.

#### U03 · Sheet title and close

- **Job:** The heading and one-line description at the top of every sheet and dialog.
- **Today:** 64 titles typed by hand at 18/700 (strays at 17, 20, 22). Only one overlay gives its dialog an accessible name. No web dialog has a visible close.
- **Target:** `OverlayHeader { title, description }` in `shared/surface/`: an h2 whose id names the dialog; the web Dialog shows the drawer's corner X when a header is present.
- **Canonical look:** 18/700 title with a 13px slate description (63 of 64 today); the drawer corner X.
- **Must not break:** Text locators still match. Mechanical.
- **When:** Before Phase 22 so every new sheet starts on it (21 to 42 add about ten sheets). Phase U2, size M.
- **Detail:** `detail/F-overlays-feedback.md`, G3 Overlay title, description and close affordance.

#### U04 · Label pill

- **Job:** A short passive word on a tint: record status, kind or tag, attention flag, small metric.
- **Today:** About 30 private or inline pills beside the shared `Pill`, in nine paddings and three weights. They exist because `Pill` has only neutral and success tones. Four outlined marker pills use two border alphas. `OutOfHoursPill` is dead code.
- **Target:** Extend `shared/ui/Pill.tsx`: `tone` neutral, success, warning, error; `size` sm, md, lg; `variant` tint or outline; `leading` slot. Named one-line wrappers stay where they own a data attribute (TierPill, UnassignedPill).
- **Canonical look:** Today's Pill for inline use; the Admin Review mockup's 4px 10px 11/600 pill for table cells.
- **Must not break:** `data-tier`, `data-unassigned`, `data-list-state`, `data-progress`, `list-row-badge` are queried by tests. Migrate about 12 stable sites now; leave Review, Invoices, Billing monitor and Accounts to the phases that rebuild them.
- **When:** As early as possible: 23 of the 28 remaining phases (21 included) add pills. Phase U3, size M.
- **Detail:** `detail/B-pills-avatars.md`, G1 Tone label pill, G2 Outlined warning marker pill, G3 Teal-tint labels.

#### U05 · Error box

- **Job:** Show a store refusal or validation message inside a sheet or form.
- **Today:** `FormError` exists, yet 24 hand copies repeat its look (20 exact, 4 near). 17 of them have no `role="alert"`, so a screen reader never hears the refusal.
- **Target:** The existing `FormError` (`shared/ui/Field.tsx`) with `variant` box or inline, and `shot`.
- **Canonical look:** The current FormError box.
- **Must not break:** Low. No unscoped `getByRole('alert')` runs on a screen that holds a copy. Skip members deleted by Phases 22, 24, 34, 39b.
- **When:** Early: almost every new sheet adds a refusal. Phase U3, size S.
- **Detail:** `detail/C-fields-search.md`, G2 Error box.

#### U06 · Search box

- **Job:** A text box with a magnifier that narrows a list as you type, with a clear button.
- **Today:** Three implementations in five looks. The anaesthetist's Lists page search is a grey box on the phone and a white 38px pill on the web; the shared `NameSearchBox` is a white 48px field. Focus ring, clear button and Escape-to-clear all differ.
- **Target:** `NameSearchBox` with `fill` well or surface, `testId`, `clearLabel`, a 44px touch clear.
- **Canonical look:** NameSearchBox, filled per the field fill rule (grey well inside white containers, white on the page).
- **Must not break:** Keep `data-testid` `mobile-lists-search` and `web-lists-search` (capture recipes). Renaming the web clear button breaks `ListsScreen.test.tsx:69`.
- **When:** Standalone. Phases 33 and 40 add search fields. Phase U4, size S.
- **Detail:** `detail/C-fields-search.md`, G1 Search input.

#### U07 · Select field

- **Job:** A labelled native select in a form or a filter bar.
- **Today:** 35 selects in about 9 style variants (heights 48, 44, 36, about 30; grey or white fill), two local copies of the field chrome and about 35 hand-written label wrappers. Admin toolbars put a white search box beside selects filled with the page colour. 44px selects sit 4px off beside 48px segmented controls.
- **Target:** `SelectField` in `shared/ui/Field.tsx`: label, hint, `size` field or compact, `fill`, `hideLabel`, `shot` on the select itself. Stays a native `<select>`.
- **Canonical look:** The field chrome TextField already uses, at 48px in sheets and one 36px compact toolbar size.
- **Must not break:** 58 capture steps call `selectOption`, and recipes pin `data-shot` on the select, literal `aria-label="Hospital"` and positional `nth` selectors.
- **When:** Before Phase 37 (filter bars) and 42 (every masters toolbar). Phase U4, size M.
- **Detail:** `detail/C-fields-search.md`, G3 Labelled select field.

#### U08 · Action button

- **Job:** A labelled command button: filled teal primary, outlined secondary, teal-outlined secondary, tinted pill.
- **Today:** The shared `Button` has 145 uses, almost all in Admin and shared flows; the web app, demo tools and shell never use it. About 35 product buttons and 20 demo or shell buttons re-type it. `ActionBtn` exists twice. The teal-outlined secondary the mockups draw has no variant, so it is hand-rolled six times. Four disabled treatments.
- **Target:** Extend `shared/ui/Button.tsx`: `variant` adds outline (and danger if kept); `size` touch (default, unchanged), desktop (44, radius 12), compact (36); `disabledReason` printed beside the button; `shot`.
- **Canonical look:** Today's Button for touch; the Admin Review mockup for desktop; Admin Day's Today button for compact.
- **Must not break:** Default stays touch, so no existing call site changes size. Keep `data-validation-*` on Add billing line. Mobile press feedback stays in global.css.
- **When:** `disabledReason` and the desktop size before Phase 27. Skip Integrations, Billing monitor, InvoiceDocument and the Review header (rebuilt by 34, 37, 22, 21a). Phase U5, size M.
- **Detail:** `detail/A-buttons.md`, Action button (G1 + G6).

#### U09 · Clickable table rows

- **Job:** The mouse clicks a row to open a record; one real button or link in the row is the keyboard handle.
- **Today:** 12 product tables, two different ways of ignoring clicks on inner controls, web rows without the shared hover. The web List detail Bookings table and the Draft Lists table have no keyboard way to open a row.
- **Target:** `ClickableRow` and `RowOpenButton` in `shared/table/`, using the existing `.aa-clickable-table-row` class and `isInteractiveRowTarget`.
- **Canonical look:** Admin's ClickableTableRows pattern (already pinned by a test).
- **Must not break:** Pass through `data-list-id`, `data-slot-id`, `data-booking-id` and the row shot names.
- **When:** The List detail keyboard handle is a one-line fix on a scripted screen: do it in U1. The rest with the table kit. Phase U6, size S to M.
- **Detail:** `detail/G-tables-cards-chrome.md`, G3 Clickable table rows.

#### U10 · Table cells and shell

- **Job:** Header cell, body cell, group row, and the bordered card around a table.
- **Today:** Private `Th`/`Td` in four files plus style-object versions and admin's `tableChrome`: seven cell implementations, four group rows, ten hand-rolled table shells. Web tables follow the Admin Review mockup; admin's own tables (10/700 headers, heavier rule, no shadow) drift from it.
- **Target:** `shared/table/`: `Th`, `Td`, `GroupRow`, `TableShell`, with a density context (comfortable for web, compact for admin).
- **Canonical look:** The Admin Review mockup header (11/600 mist, line rule, sunken row dividers) with e1 on the shell.
- **Must not break:** `ClickableTableRows.test.tsx`, `columnheader` queries, the catalogue row "Lists table (Th · Td · GroupRow)". Masters go through `tableStyles.ts` internals only.
- **When:** After Phase 25 and before 33, 36, 37, 42 (all table-heavy). Phase U6, size M.
- **Detail:** `detail/G-tables-cards-chrome.md`, G1 Table header and body cells, G2 Table shell.

#### U11 · Notice (callouts and notes)

- **Job:** A non-blocking warning, info or neutral note inside a form, panel or page.
- **Today:** Three identical warning shells, two copies of a private demo `Callout`, several near variants (attention boxes, the needs-destination boxes), and about 13 neutral notes in several box styles.
- **Target:** `Notice { tone, title, icon, live, shot }` in `shared/ui/`.
- **Canonical look:** The ConflictCallout shell.
- **Must not break:** Pass through `conflict-warning`, `pairing-warning`, `drawer-moved-here`, `booking-moved-to-you`, `contract-rail-outcome` and friends.
- **When:** Before Phase 22; phases 22, 27, 33, 35, 38b, 42, 43 all add banners. Phase U3, size M.
- **Detail:** `detail/F-overlays-feedback.md`, G8 Callouts and notes.

#### U12 · Result line

- **Job:** Confirm in place that an action happened.
- **Today:** About 11 result lines. Eight are teal tint; everything else that says "it worked" (done steps, TickBadge, the success overlay, the Review banner) is green. The live region is mounted together with its text, so screen readers may not announce it.
- **Target:** `ResultLine { line, actions, onDismiss, shot }` in `shared/ui/`, with an always-mounted live region.
- **Canonical look:** The success tint (the Design Language says teal is never status).
- **Must not break:** A colour change reshoots the availability and Admin capture screenshots.
- **When:** Standalone. Fold the masters ones into Phase 42. Phase U3, size S.
- **Detail:** `detail/F-overlays-feedback.md`, G9 Success / result line.

#### U13 · Text action

- **Job:** A borderless teal word that does one thing: Edit, Open, Clear, Show all, Remove.
- **Today:** Two different components both named `TextAction` (shared and masters), plus `textActionStyle`, `LinkButton`, two `linkStyle`s and about 40 inline copies. Font sizes run from 11.5 to 15.
- **Target:** The shared `TextAction` with `size` sm, md, lg, `flush`, `inline`, `disabledReason`, `shot`.
- **Canonical look:** Shared TextAction; 12.5 in tables, 14 in cards, 15 with a 44px target on mobile.
- **Must not break:** Keep the shot names and the row `aria-label`s. Masters views are refit by Phase 42: migrate them first or inside it.
- **When:** Standalone; mechanical. Phase U5, size M.
- **Detail:** `detail/A-buttons.md`, Text action (G2).

#### U14 · Card and panel

- **Job:** A white bordered card grouping content, with an optional heading and action.
- **Today:** Web `Panel`, admin `ProfileCard`, the right rail's `Card` and four rail cards copying it, about 18 admin section cards and five mobile cards at radius 16 (the mockups use 14). About 30 real copies.
- **Target:** `Card` in `shared/ui/`: `title`, `action`, `elevation` flat or e1, `padding` panel or card, `flush`, `shot`. A real heading element.
- **Canonical look:** Web Panel (20px padding, e1) for main surfaces; the rail card (16px, flat) for rails and mobile.
- **Must not break:** Keep the rail and profile shot names and `useResolveWithTick` focus return.
- **When:** After Phase 25. Fix the mobile radius 16 before Phase 26 adds a card to More. Phase U6, size M.
- **Detail:** `detail/G-tables-cards-chrome.md`, G4 Titled card / panel.

#### U15 · Inputs, checkbox, switch and focus

- **Job:** Single-line inputs, multi-line text, a boolean option, and how a field shows keyboard focus.
- **Today:** About 10 inputs bypass `TextField` at heights 36 to 48. Four of seven checkboxes render browser blue. Three switches. Four focus looks, with the browser's blue ring on TextField and every select. Three textareas bypass `TextArea`. Hints at 12 and 12.5px, eight not tied to their field.
- **Target:** `TextField` gains number, time, `min`, `max`, `invalid`, `size`, `fill`; new `Checkbox` and `Switch`; one `.aa-field:focus-visible` rule; `FieldHint`; `TextArea` gains a counter and `ariaLabel`.
- **Canonical look:** TextField's chrome; the Design Language focus ring that NameSearchBox already uses; teal `accent-color`.
- **Must not break:** Must still work under the PWA 16px input rule. Keep `admin-notifications-show-resolved`, `move-booking-tell-office`.
- **When:** Checkbox and Switch are needed by Phases 21, 27, 38b, 42. Phase U4, size S to M.
- **Detail:** `detail/C-fields-search.md`, G4, G10, G11, G12, G13.

#### U16 · Segmented control

- **Job:** Pick exactly one of two to five short options in a joined track with a sliding highlight.
- **Today:** `SlidingSegmentedControl` is shared and used 27 times through `Segmented`. `SortToggle` on Admin Day is a hand-built copy with no slide, no ARIA state and no design source. Balances overrides the control into an ink look whose 0.18 shadow appears in no design file.
- **Target:** Keep `SlidingSegmentedControl`; add `size` sm, `shape`; `SortToggle` becomes a call site.
- **Canonical look:** Today's teal segmented control.
- **Must not break:** Keep the segments as buttons with `aria-pressed`: 13 Playwright clicks, 11 group selectors and 16 capture steps find them that way.
- **When:** Standalone; cheap. Phases 22, 33, 36, 39b add segmented choices. Phase U5, size S.
- **Detail:** `detail/E-segmented-tabs-nav.md`, G1 Segmented control.

#### U17 · Underline tabs and page switch

- **Job:** Switch between sibling views of one page.
- **Today:** The underline tab strip is defined four times, identically (13 call sites); routes and local panels are marked inconsistently. Page switches are drawn three ways: segmented look (Web Availability), tint pills (Draft Lists), underline tabs (Accounts, AA fees).
- **Target:** `LineTabs`, `LineTabLink` (routes, `aria-current`) and `LineTab` (local panels) in `shared/ui/`, with a `badge` slot.
- **Canonical look:** Today's ink underline tab.
- **Must not break:** `data-draft-tab` must stay; `availability-phase29.spec.ts:85` finds the page switch as a group of buttons.
- **When:** Before Phase 34 (Intake tabs) and 38b (Review Events tab with a count). Phase U5, size S.
- **Detail:** `detail/E-segmented-tabs-nav.md`, G3 Underline tab strip, G4 Page-view switch.

#### U18 · Sheet footer, confirm and done step

- **Job:** The commit and dismiss buttons at the foot of a sheet; asking before a consequential action; the end state of a flow.
- **Today:** Four desktop footer layouts across about 45 sheets. Five confirm idioms; in-card confirms put the primary on the left. Five near-identical "done" steps.
- **Target:** `SheetActions { primary, secondary }` (the surface decides: stacked on the phone, one row on desktop), `ConfirmSheet`, `InlineConfirm`, `DoneStep`.
- **Canonical look:** Stacked with the primary on top on the phone (Mobile Availability mockup); one row with the primary last on desktop (MasterPanel).
- **Must not break:** Button-name locators unchanged. Keep `availability-series-confirm`, `holiday-delete-confirm`, `scenario-confirm`, the done-step shots.
- **When:** Before Phase 23 (Make primary confirm) and 35 (which rewrites almost every edit sheet). Phase U2, size M.
- **Detail:** `detail/F-overlays-feedback.md`, G4, G6, G10; A-buttons.md Sheet footer pair (G9).

#### U19 · Side panel (drawers)

- **Job:** A right-docked desktop panel: scrim, header, scrolling body, actions.
- **Today:** Three identical drawer shells plus MasterPanel. `SlotDrawer` re-declares all four `drawerParts` pieces privately, with drift. The drawers have no Escape and no focus handling (already logged in PROGRESS).
- **Target:** `SidePanel` in `apps/admin/components/` on the modal layer; SlotDrawer imports `drawerParts`. (Moved to `shared/surface/SidePanel.tsx` in catch-up Phase 43b, for the support panel on web and Admin; 43a's planned `HelpPanel` was never built and 43b's `SupportPanel` replaces it.)
- **Canonical look:** The drawer header with MasterPanel's h2, `aria-labelledby` and e3.
- **Must not break:** Keep `data-testid="admin-list-drawer"` (9 specs), the drawer shots, `data-slot-id` and `data-list-id`. Adding `role="dialog"` adds matches to broad `[role=dialog]` locators.
- **When:** Before Phase 43a (HelpPanel uses the drawer pattern); 33a and 35 edit the drawers. Phase U2, size M.
- **Detail:** `detail/F-overlays-feedback.md`, G2 Right-docked side panel.

#### U20 · Icon button

- **Job:** A button holding only an icon: bordered steppers and month or day navigation; borderless close and clear.
- **Today:** 13 private stepper definitions (WeekNavButton, IconBtn, NavButton, SquareBtn, MonthButton, RoundButton and more) and 9 close or clear buttons. Admin Day's previous and next buttons have no accessible name. Three clear or remove buttons drop focus when they disappear.
- **Target:** `IconButton { label (required), size, shape, tone, bordered }` and a `CloseButton` preset in `shared/ui/`.
- **Canonical look:** WeekNavButton and IconBtn on desktop (white, 1px line, slate icon); MonthButton on mobile.
- **Must not break:** Two Playwright specs click the Admin Day button by the name "›"; update them with the label.
- **When:** Standalone. Phase U5, size M.
- **Detail:** `detail/A-buttons.md`, Icon button (G4 + G5).

#### U21 · Back link

- **Job:** Return to the parent screen.
- **Today:** 15 sites: five byte-identical desktop copies, three matching mobile copies, and two components both named `BackLink` (slate and teal).
- **Target:** `BackLink { to | onClick, size }` in `shared/ui/`: a real link where a route exists.
- **Canonical look:** The five identical desktop copies; the mobile 15px, 44px target version.
- **Must not break:** Playwright finds them by name ("Lists", "List", "Back to queue", "All invoices").
- **When:** Standalone; small. Phase U5, size S.
- **Detail:** `detail/A-buttons.md`, Back link (G3).

#### U22 · Eyebrow label

- **Job:** The 11px caps tracked label above a value, a section or a field.
- **Today:** About 60 hand-written copies in about 40 files, at 11, 10.5 and 10px and weights 600 and 700. The shared `FieldLabel` already has the design's look; the `type.micro` token is read by one file.
- **Target:** `Eyebrow { as, tone }` in `shared/ui/` reading `type.micro`; `FieldLabel` re-exports it.
- **Canonical look:** FieldLabel: 11/600, 0.06em caps.
- **Must not break:** Style only. Admin eyebrows at 700 lighten slightly.
- **When:** Before Phase 43a (InfoTip sits beside section labels). Phase U6, size M.
- **Detail:** `detail/G-tables-cards-chrome.md`, G6 Eyebrow / micro-cap label.

#### U23 · Session status block

- **Job:** Show one session in its status colour with the right treatment: solid with a left bar, hatched for Unavailable, dashed for Free.
- **Today:** Built seven times. `blockFill()` is the one home for the rule, yet four sites re-derive the fill with three different left-bar treatments. The web week strip uses the plain tint, so a hatched status would show flat there.
- **Target:** `StatusBlock` with `size`, `lines`, `as`; at minimum every site calls `blockFill`.
- **Canonical look:** `blockFill()` in `shared/StatusBlock.tsx` (Design Language section 02).
- **Must not break:** DayGrid adds conflict and attention outlines on purpose: keep them. `data-slot-id` on blocks.
- **When:** After Phase 25; not on any phase's path except DayGrid (33a, 43, 43a). Phase U6, size M.
- **Detail:** `detail/J-completeness.md`, N1 Session status block.

#### U24 · Contract chooser parts and step rail

- **Job:** The step rail's answer options, the Contract search, "Other price" with a typed amount, and the numbered step markers.
- **Today:** Built twice: `ContractRail` (phone sheet, Add booking dialog) and `BillingCard` (inline on Admin and web). The "Other price" card, the amount input, the option tiles and the step markers differ; the Contract matcher is copied inline. The combo search shows no keyboard focus.
- **Target:** `shared/contracts/railParts.tsx`: `OtherPriceCard`, `RailOptionGroup`, `StepRail`; one `contractMatchesQuery`.
- **Canonical look:** ContractRail's parts for the fields; the inline Billing card's step markers (the mock's look).
- **Must not break:** Keep `contract-combo`, `contract-rail-amount`, `contract-rail-other-price`, `contract-rail-step-{n}`, `data-rail-option`.
- **When:** Before Phase 23. Phase 21 is editing both files now and adds a "Suggested" pill to both copies. Phase U4, size M.
- **Detail:** `detail/C-fields-search.md`, G7; E-segmented-tabs-nav.md G7, G8.

#### U25 · Avatar and persona chip

- **Job:** A person's initials in a disc beside a printed name.
- **Today:** Seven definitions over about 13 sites, five inline. `Initials` (at 36 and 44px) and the shared `Avatar`'s font rule (at 30 and 36px) are off the mockup sizes. The admin side nav types "KW / Kirsty W. / Office" as literals.
- **Target:** One `shared/Avatar.tsx`: `name`, `size`, `variant` elevated, tint or neutral, with the mockup font steps; `PersonaChip` for the dark bars.
- **Canonical look:** Per mockup: elevated white on mobile (a Decisions-log ruling), crimson tint on web and admin.
- **Must not break:** No test selectors. Small pixel changes on the move sheets.
- **When:** Before Phase 26 (WebNav avatar becomes a button) and 36. Phase U3, size S.
- **Detail:** `detail/B-pills-avatars.md`, G5 Avatar, G6 Persona chip.

#### U26 · Count badge and attention dot

- **Job:** A small count beside a heading; a small warning disc or triangle.
- **Today:** Three identical 18px rail count bubbles plus a 22px outlier that also shows "0". The "!" disc is drawn inline in five places beside `ConflictDot`; the grid's "!" is read aloud into the block's name.
- **Target:** `CountBadge { count, tone, srNoun, hideAtZero }` and `AttentionDot` (from `ConflictDot`), which `WarningTriangle` composes.
- **Canonical look:** The 18px rail bubble; the Admin Day mockup's 13px disc.
- **Must not break:** `admin-notifications-count`, `booking-warning`, `data-strength`, `daygrid-block-warnings`.
- **When:** Before Phase 33a (StubMarker reuses the triangle anatomy). Phase U3, size S.
- **Detail:** `detail/B-pills-avatars.md`, G4 Count bubble, G7 "!" disc and warning markers.

#### U27 · Date fields, jump to date, time entry

- **Job:** A date in a form or filter bar; a toolbar control that jumps to a day; start and end times.
- **Today:** 20 native date inputs in seven style variants (44 and 48px in neighbouring admin sheets). `TextField` has no `min` or `max`, so horizon-bounded fields bypass it. Admin Day's jump input has no label. Three hand-built start and end time pairs.
- **Target:** `TextField` gains `min`, `max`, `mono`, `density`; `FilterDateInput`; `DateJumpInput`; `TimeRangeFields` (from SessionTimesFields). All stay native inputs.
- **Canonical look:** TextField's date field at 48px.
- **Must not break:** Playwright reads `input[type="date"]` by position in five specs; keep order and `draft-list-date`, `admin-add-anaesthetist-start`.
- **When:** `FilterDateInput` before Phase 37; `TimeRangeFields` before 39b. Phase U4, size M.
- **Detail:** `detail/D-dates-formatting.md`, G2, G3, G5.

#### U28 · Date text, timestamps, plurals

- **Job:** Turn a date, a timestamp, a count or a duration into words.
- **Today:** `'EEE d MMM'` is typed out 34 times though `shortDay` exists; five date-range shapes; five timestamp shapes (two in one file); 86 inline plural ternaries; minutes to HH:MM at 6 sites; `parseAmount` exists in three versions with three rules.
- **Target:** Pure helpers in `domain/dateText.ts` (allowed by the domain-purity test), re-exported from `shared/format.ts`: `dateRange`, `stampText`, `plural`, `hhmm`.
- **Canonical look:** Existing helpers in `shared/format.ts`; shapes per the questions below.
- **Must not break:** Most migrations change no output; Vitest string asserts unchanged.
- **When:** Land the helpers first; migrate as files are touched. Phase U1, size M.
- **Detail:** `detail/D-dates-formatting.md`, G7, G8, G10, G11; J-completeness.md Task 1(b) for `parseAmount`.

#### U29 · Empty state

- **Job:** Say "nothing here" where a list or panel would be.
- **Today:** About 35 sites in three looks (inline line, card, centred on mobile), including three private `EmptyNote` copies. Table empty rows and picker no-match lines are separate jobs.
- **Target:** `EmptyState { variant, title, action }` in `shared/ui/`; table rows use the table kit's `EmptyRow`.
- **Canonical look:** The RvgGroupsView empty card.
- **Must not break:** Low. Keep `conflicts-empty`, `draft-lists-empty`.
- **When:** Before Phase 33 (the Matching screen starts empty). Phase U3, size M.
- **Detail:** `detail/F-overlays-feedback.md`, G12 Empty states.

#### U30 · Popover

- **Job:** A small panel under a trigger, closed by an outside click or Escape.
- **Today:** The open, outside-click and Escape code is written five times (DemoActionsMenu, DemoClockMenu, DemoResetButton, AppSwitcher, the Contract combo). The combo does not return focus.
- **Target:** `usePopover` and `PopoverPanel` in `shared/ui/`, consulting the modal stack.
- **Canonical look:** The DemoClockMenu panel.
- **Must not break:** `DemoActionsMenu.test.tsx`, `DemoResetButton.test.tsx`, `shell-clock.spec.ts`, `demo-actions.spec.ts`.
- **When:** Before Phase 43a: its InfoTip is the product's first popover. Phase U2, size S.
- **Detail:** `detail/F-overlays-feedback.md`, G5 Anchored popovers and menus.

#### U31 · Page header, stat tile, label and value rows

- **Job:** A page title row; a summary figure tile; "label value" pairs in drawers and detail screens.
- **Today:** 20 page headers typed by hand (plus the masters `Header`, 16 uses). Two stat tile builds (plus the Balances hero card). Label and value rows built seven times with label columns from 72 to 96px.
- **Target:** `PageHeader`, `StatTile` (quiet and outlined), `DefRow` in a `DefList`.
- **Canonical look:** Per mockup: 28/34 title on web, 24/30 on admin; both tile looks stay; drawerParts `Row` at 80px.
- **Must not break:** Style only.
- **When:** `DefRow` before Phase 26 (which would otherwise build `ProfileRow`); `StatTile` before 40 and 42; `PageHeader` before 42 wraps it as `MasterHeader`. Phase U6, size S each.
- **Detail:** `detail/G-tables-cards-chrome.md`, G7, G8, G9.

#### U32 · Filter pills, navigation state, progress bar

- **Job:** Choose one list filter from a row of pills; mark the active nav item; show "n of N complete".
- **Today:** Web `FilterChip` and the mobile Lists pills are one job built twice; the web one has no `aria-pressed`. None of the three main navs marks the active item for assistive tech. The progress bar is built twice (200px in the web header, full width on the phone) with no `role="progressbar"`.
- **Target:** `FilterPills`, `ProgressBar` in `shared/ui/`; `aria-current="page"` on nav items in place.
- **Canonical look:** The mockups' solid teal filter pill; today's bar.
- **Must not break:** 43 Playwright clicks find nav items as buttons: keep the role.
- **When:** `FilterPills` before Phase 36. Phase U5, size S.
- **Detail:** `detail/E-segmented-tabs-nav.md`, G2a, G5, G6.

#### U33 · Calendar keyboard and month header

- **Job:** Arrow-key movement inside a month calendar; the weekday header and month buttons.
- **Today:** The admin MiniCalendar copies MonthGrid's keyboard model. The three month content grids (web and mobile My availability, hospital closures) share nothing and have no arrow keys. The five calendars are two jobs, so they do not become one component.
- **Target:** `useCalendarKeys` and `MonthHeaderRow` in `shared/calendar/`.
- **Canonical look:** MonthGrid's key model. Colours stay per calendar.
- **Must not break:** `data-date`, `data-calendar-day`, the "Next month" role name; catalogue rows asserted by name.
- **When:** Standalone. The hospital calendar fixes fold into Phase 42. Phase U4, size S.
- **Detail:** `detail/D-dates-formatting.md`, G1a, G1b.

#### U34 · Number stepper, radio keyboard, chip multi-select

- **Job:** Nudge a whole number; pick one of a few visible options; pick several items shown as chips.
- **Today:** `StepperButton` plus a private icon stepper in BookingDetailBody; stepper buttons are named "−" and "+". Four radio groups, one with arrow keys. `ContractEditSheet` re-builds `ChipMultiSelect` in the same file without its list semantics.
- **Target:** `NumberStepper`; a `useRovingRadio` hook; the existing `ChipMultiSelect`.
- **Canonical look:** StepperButton (the mockup's 44px, radius 12); StatusRadioGroup's keyboard model.
- **Must not break:** `rvg-range-units`, `modifier-units`; `UnitsCard.test.tsx`.
- **When:** `NumberStepper` before Phase 39b (minutes stepper). Phase U4, size S.
- **Detail:** `detail/C-fields-search.md`, G5, G6, G8.

#### U35 · Smaller repeats

- **Job:** Small things built two to eight times each.
- **Today:** Frosted sticky dock (3 identical; two do not publish their height); notice row (5); colleague pick rows (2 + 2); dashed "Add a booking" (2); the brand tick SVG pasted into 3 files; disclosure (8 sites, 3 mechanisms, one without `aria-expanded`); money totals block (4); day chip (2); ProgressPill labels repeated in ListRow.
- **Target:** `StickyDock`, `NoticeLine`, `PickRow`, `AddRowButton`, `TickGlyph`, `Disclosure`, `TotalsBlock`, `DayChip`.
- **Canonical look:** The existing best version of each (named in the detail file).
- **Must not break:** Low; each is a few call sites.
- **When:** Opportunistic: when a phase touches the file. Phase U6, size S each.
- **Detail:** `detail/J-completeness.md`, N2 to N6, N8, N9; B-pills-avatars.md G8, G11.

#### U36 · Destructive button

- **Job:** End or remove something.
- **Today:** Two identical red-outline buttons ("Disable" on a Contract, "Cancel booking") and two red "Remove" text links, beside teal "Remove" links elsewhere. No ruling covers red; the design rule says teal is the only action colour.
- **Target:** `Button variant="danger"` if you keep red; otherwise `secondary`.
- **Canonical look:** Your call (question 8).
- **Must not break:** None.
- **When:** With U5. Phase U5, size S.
- **Detail:** `detail/A-buttons.md`, Destructive button (G8).

## 4. Bugs found along the way

Confirmed by reading the full code path; the first was also reproduced in the running app.

| # | Bug | Where | Fixed by |
|---|---|---|---|
| 1 | **Escape in the RVG code picker closes the whole Contract panel and loses the form.** Any Escape with focus on a picker row or an empty search box closes both. Reproduced 12 Nov: two dialogs open, one Escape, none open (`shots/escape-bug-before.png`, `shots/escape-bug-after.png`). | `shared/surface/Dialog.tsx:48`, `apps/admin/components/MasterPanel.tsx:43` | U02 |
| 2 | **Money without a thousands separator** on the office Booking total and the capture billing lines, beside grouped money elsewhere. | `shared/capture/BookingTotalPanel.tsx:65,124`, `shared/booking/BookingDetailBody.tsx:145,761` | U01 |
| 3 | **No keyboard way to open a Booking from the web List detail table** (a scripted demo screen), or to open the Draft List drawer from the Draft Lists table. | `apps/web/screens/ListDetailView.tsx:238-284`, `apps/admin/screens/DraftListsScreen.tsx:180-186` | U09 (first one in U1) |
| 4 | **17 refusal boxes are never announced** to a screen reader (no `role="alert"`). | list in `detail/C-fields-search.md` G2 | U05 |
| 5 | **Admin Day's previous and next buttons have no accessible name** (the glyphs `‹` `›` only). | `apps/admin/components/DayNav.tsx:90` | U20 |
| 6 | **The Contract combo's search box shows no keyboard focus** (an inline `outline: none` beats the scope rule); `aa-rail-focus` is a dead class on 10 elements. | `shared/booking/BillingCard.tsx:540` | U24 |
| 7 | **The web week strip would draw a hatched (Unavailable) session as a flat tint**: it uses the plain tint instead of `blockFill()`. From the code; needs a look with an Unavailable session on screen. | `apps/web/components/WeekStrip.tsx:199` | U23 |
| 8 | **Four checkboxes render browser blue** against the teal-only rule; 44px controls sit 4px off beside 48px segmented controls in two admin sheets. | `detail/C-fields-search.md` G10, G3 | U15, U07 |
| 9 | **Three clear or remove buttons drop keyboard focus** when they disappear; the Contract picker does not return focus on Escape. | `ContractEditSheet.tsx:512`, both `ListsLookback.tsx`, `BillingCard.tsx:466` | U20, U30 |

Smaller accessibility gaps (invalid `role="list"` in `ContractRail.tsx:288`, the DayGrid "!" read aloud,
stepper buttons named "−" and "+", unnamed nav state, a `div` as the web Panel title) are listed per group in
the detail files. Latent only, nothing shows today: `nameWithoutTitle` strips only "Dr"; SlotDrawer's private
`ActionBtn` would keep a disabled primary teal.

## 5. Intended differences we keep

These looked like duplicates or drift and are not. Each has a source.

| Difference | Why it stays | Source |
|---|---|---|
| Bottom sheets on mobile, centred dialogs on web and admin | The overlay seam chooses per surface | PROGRESS.md convention 16 (line 71); `useSurface()` decision (line 292) |
| Admin Party and Contract editors are a 600px right-docked panel, not a dialog | Admin pattern for master records | ATLAS.md, catch-up Phase 18 |
| Press feedback on every enabled control inside the phone, none on desktop | Named motion pattern | Design Language section 05 `motion/control-press`; pinned by `visual/mobile-interactions.spec.ts` |
| Touch sizes on mobile (44 to 56px targets) against 32 to 44px on desktop | Touch rule | Design Language section 04 |
| Mark complete 56px and the List dock 54px; a grey dock you can still tap | Each copies its mockup; the grey dock is the Phase 04 blockers flow | `Mobile App.dc.html`; PROGRESS.md line 650 |
| Elevated white avatar on mobile, crimson tint on web and admin | Mobile blended into the wash; web and admin follow their mockups | Decisions log 2026-07-24 (line 232); Web Dashboard and Admin Day mockups |
| Admin mini calendar marks today, selection and focus in crimson | Your visual pick | PROGRESS.md lines 1047 to 1051; preview decision 2026-11-11 |
| Mobile "Go to a date" marks today in teal | Recorded in Phase 38a | PROGRESS.md lines 1990, 1994 |
| Mobile tab bar's active tab is teal; admin and web active nav is crimson | Each follows its mockup | `Mobile App.dc.html`; convention 17 |
| Solid teal filter pills and teal-tint option chips are two looks | Two jobs, two mockup sources | Web Availability and Mobile App mockups |
| Status chips are flat tints; hatched and dashed belong to blocks | The six status colours copy AA's Solutions Plus legend | Convention 10; RFP (AR-15) p.46 |
| Pill sizes on Review, the web Dashboard and mobile List rows | Copied from the mockups | Admin Review, Web Dashboard, Mobile App mockups |
| Desktop step buttons at 32, 36 and 38px with `‹ ›` glyphs (question 10) | Each matches its screen's mockup | Web Dashboard, Admin Day, Web Availability mockups |
| Capture steppers at 44px with radius 12; the "−5 / +5" nudge buttons | The mockup's own | `Mobile App.dc.html` |
| Admin page title 24/30, web page title 28/34 | Per mockup | Admin Day and Web Dashboard mockups |
| `Logo` image on web, `Wordmark` text on the admin dark nav | Crimson on ink does not read | PROGRESS.md lines 256, 258, 293; CLAUDE.md |
| InvoiceDocument's 40px Email and Print buttons and its print typography | Your decision; printed document voice | PROGRESS.md line 228 |
| The admin calendar pages past the schedule horizon | Lands on Phase 28's "Beyond the schedule horizon" page | Phase 28 |
| The warning triangle is a marker, never a control; no confirm step for warnings | Ruling | PROGRESS.md line 205 (Phase 15a) |
| Selects stay native `<select>` | The admin SurgeonPicker ruling; 58 capture steps depend on it | PROGRESS.md line 1484 |
| Segmented controls, tabs and nav items are plain buttons | Capture ATLAS rule; about 68 Playwright clicks | `REQ/capture/ATLAS.md` |
| The mobile price override form has no "%" mode | Deliberate subset | comments in `OverrideCard.tsx` |
| Demo simulators (Xero, Data, Control Panel, PWA panel) look plainer | Not product UI; marked by `DemoBadge` | Convention 13 (line 68) |

## 6. Questions, and Donald's answers

**Answered 12 November 2026: the recommended answer was chosen for all 27.** Read each "Recommended" below as
the decision. Each becomes a Decisions-log entry in PROGRESS.md when the phase that puts it into effect lands.
Smaller questions that only matter inside one group are in that group's detail file and are settled in its
phase.

**Plan and scope**

1. **Run the work as seven owner-added phases (U1 to U7), with U1 to U3 before Phase 21a, U4 and U5 after 22
   and before Phase 23, U6 after Phase 25, U7 before Phase 44?** The alternative is to finish the Contracts track (21a to
   25) first and start after it, which adds about six more sheets and many pills as copies to migrate later.
   *Recommended: yes, interleave.*
2. **Leave the demo simulators (DemoXero, DemoData, Control Panel, PWA demo panel) out, and adopt the shared
   parts there only when Phases 41 or 43 touch them?** *Recommended: yes.*
3. **Keep segmented controls, tabs and nav items as buttons and add `aria-pressed` / `aria-current`, instead
   of changing them to radio, tab or link roles?** Changing roles rewrites about 68 Playwright clicks, 11 group
   selectors and 27 capture steps. *Recommended: keep buttons.*

**Fields**

4. **Field fill: a grey well inside white sheets, cards and drawers, and white on the page or phone canvas?**
   This is what the mockups draw. It turns `NameSearchBox` grey in its 8 sheet and drawer uses, and the masters
   toolbar selects and the mobile Lists search white. *Recommended: yes.*
5. **Field heights: 48px for every admin sheet control (dropping the 44s), and one compact 36px toolbar size
   for Conflicts, masters and the audit and Phase 37 filter bars?** *Recommended: yes to both.*
6. **One focus ring: the Design Language's teal ring (`0 0 0 3px rgba(13,110,99,0.30)`) on every field and
   button?** Today there are seven outline rules and the browser's blue on text fields and selects. The admin
   calendar's crimson ring stays (your pick, PROGRESS.md lines 1047 to 1051). *Recommended: yes.*

**Buttons**

7. **Admin and web sheet footers use the 54px mobile primary button. Keep that, or move to the 44px desktop
   size the Admin Review mockup draws?** Moving changes the look of every admin sheet (104 buttons).
   *Recommended: keep 54 in sheet footers; use the new desktop size only where buttons are hand-rolled today.*
8. **Red: keep a red outline for "Cancel booking" only and make the red "Remove" links teal?** No ruling covers
   red today. *Recommended: yes.*
9. **Review and Invoices show a breadcrumb and a back link to the same place. Drop the back link?** The
   breadcrumb is the mockup's. *Recommended: yes.*
10. **Desktop step buttons: one component, keeping each screen's mockup size (32, 36, 38px) and the `‹ ›`
    glyph?** The two verifiers split on this; the other option was one 36px size everywhere.
    *Recommended: keep the mockup sizes, one glyph.*

**Overlays and feedback**

11. **Add the corner X to web dialogs?** No web dialog has a visible close today; one change covers about 27
    sheets. *Recommended: yes.*
12. **Sheet title 18/700 everywhere** (63 of 64 today), not the type scale's 22? *Recommended: 18/700.*
13. **Desktop footer row: Cancel hugging its label and the primary last, filling the rest** (12 of 17 admin
    sheets), and in-card confirms move the primary to the right of "Keep it"? *Recommended: yes.*
14. **"It worked" colour: change the 8 teal result lines to success green, and teal info notes to neutral?**
    The Design Language says teal is never status. *Recommended: yes.*

**Pills and tabs**

15. **The "Preferred" pill is teal tint (built on purpose in Phase 17); later rulings in Phases 11 and 18 say
    no teal on labels. Follow the later rule (success tint)?** *Recommended: yes, unless Preferred should read
    as a selection.*
16. **Table pills: adopt the Admin Review mockup's `4px 10px` 11/600 as the one table size, with `1px 8px` as
    the inline size?** *Recommended: yes.*
17. **Balances uses an ink segmented look (from your commit `30877ba6`) whose shadow is in no design file.
    Switch it to the standard teal control?** *Recommended: yes.*
18. **Page switches (Web Availability's two pages, Draft Lists, the coming Review Events tab and Intake tabs):
    all on the underline tab strip, as links? And read Phase 34's "selection-slide for the Intake tabs" as that
    underline strip?** *Recommended: yes to both.*

**Tables and cards**

19. **Admin tables take the Admin Review mockup header (11/600, lighter rule), keep their tighter padding as a
    "compact" density, and their shells get the e1 shadow** like the Review table and the Day grid?
    *Recommended: yes.*
20. **Mobile cards at radius 16 (Balances, More, PWA panels) go to the mockups' 14, before Phase 26 adds a card
    to More?** *Recommended: yes.*

**Type, money and dates**

21. **Money: grouped "$3,100.00" everywhere, and drop the whole-dollar "Fixed price $3,100" in the procedure
    stack, as Phase 24 already plans?** This also changes two Playwright assertions in one spec and two demo guide lines
    (`03-demo-script.md:811`, `master-demo-guide.html:1175`).
    *Recommended: yes.*
22. **Add the sizes the mockups use (12.5, 11.5, 13.5, 18 sheet title, 24 and 28 page titles) to the type
    scale as tokens, rather than rounding screens to today's scale?** *Recommended: add them.*
23. **Eyebrow: one size and weight, 11/600?** With question 19, the 10 and 10.5px admin table heads go away.
    *Recommended: yes.*
24. **Date ranges and timestamps: "Tue 21 Jul to Fri 24 Jul" in the apps, "1 Oct 2026 to 1 Nov 2026" for money
    and contracts, and "Tue 21 Jul, 08:00" for timestamps?** Today there are five shapes of each.
    *Recommended: yes.*
25. **Touch target floor: the Design Language says 48px; the code has used 44px as the floor in several
    fixes.** Raising them is a visible change across mobile. *Recommended: keep 44 and record it in the
    Decisions log.*

**Housekeeping**

26. **Approve the library decision note for `docs/ui-library-research/README.md`, and retire
    `ui-library-preview/`** (section 10)?
27. **CLAUDE.md says "four named motion patterns"; the Design Language and `motion.ts` have six. Correct the
    wording?** *Recommended: yes.*

## 7. Token gaps

Colour is well controlled: only 19 distinct hex values appear outside `src/theme`. The gaps are in type,
radius and the things that have no scale at all. Counts are reproducible from `detail/H-tokens.md`; the
spot-check in `detail/J-completeness.md` re-ran 17 of them and found none materially wrong.

**A token already exists and is bypassed** (no visual change to fix):

| Literal | Token | Count |
|---|---|---|
| `borderRadius: 999` / `99` | `radius.pill` | 85 + 33 |
| `borderRadius: 10` / `14` | `radius.ctl` / `radius.card` | 27 + 9 |
| `fontSize` 11 to 17, 22 typed as numbers | `type.*.size` | about 940 in about 180 files |
| `letterSpacing: '0.06em'` / `'-0.01em'` | `type.micro.tracking` / `type.title.tracking` | 54 + 19 |
| `color: '#FFFFFF'` | `neutral.surface` | 36 |
| e1, e2, e3 shadow strings | `elevation.e1` / `e2` / `e3` | 4 |
| `cubic-bezier(0.2,0.8,0.2,1)` | `easing.card` | 4 |
| the mono font stack as a string | `fontFamily.mono` | 4 |

**No token exists, and the value is in the design files** (add the token):

| Proposed token | Value | Replaces | Design source |
|---|---|---|---|
| `type.small` | 12.5 / 18 | 211 uses in 79 files | mockups, 17 uses |
| `type.captionSm`, `type.labelLg` | 11.5, 13.5 | 56 and 44 uses | mockups |
| `type.pageTitle`, `type.pageTitleWeb` | 24/30/700, 28/34/700 | 14 and 8 uses | Admin Day, Web Dashboard |
| `radius.sm`, `radius.md`, `radius.xs` | 8, 12, 6 | 13, 13 and 8 uses | Web Dashboard, Mobile App, Design Language |
| `neutral.gridline` | `#F1F4F2` | 3 (DayGrid) | Admin Day |
| `brand.onDarkMuted` | `#D89AA9` | 1 (admin "ADMIN" eyebrow) | Admin Day, Admin Review |
| `status.free.onFill` | `#8FE3B4` | 1 (free dot on a teal day chip) | Mobile Availability |
| `STATUS_PALETTE.holiday.edge` | `#F2D5DC` | 1 (already one home) | Mobile App |
| `elevation.thumb` | `0 1px 3px rgba(23,35,32,0.2)` | 3 (segmented highlight; 0.15 on the surface variant is also a mockup value) | Design Language, Mobile Availability |
| `elevation.cardEdge` | `-16px 0 32px rgba(23,35,32,0.12)` | 1 (SlideStack) | Mobile App |
| `surface.frosted` | `rgba(246,248,247,0.92)` | 3 (sticky docks) | Mobile App |
| `motion.uiFade` | 150ms | 9 uses, plus 120 and 160ms in `global.css` for the same job | Mobile App, Mobile Availability, Web Availability |

**No token exists, and the value is not in the design files** (your call whether to name it):

| Proposed token | Value | Note |
|---|---|---|
| `type.sheetTitle` | 18 / 24 / 700 | 70 uses in 58 files; the app's own convention, not the design's (question 12) |
| `brand.onDark` | `#C25B72` | 1 use (Wordmark divider); explained in the Decisions log, 2026-07-22 |
| `elevation.drawer` | `-8px 0 24px rgba(23,35,32,0.16)` | 3 uses (admin drawers) |
| on-ink white ladder | white at 0.7, 0.55, 0.45, 0.22, 0.14, 0.08 | 30 uses in 14 files (shell bars, side nav, total panel); 0.45, 0.22 and 0.14 are not in the design |
| `zIndex` scale | raised 1, popover 30, drawer 40/41, sticky 45, overlay 60, sheet 70, shell menu 120, dialog 200 | 31 literals, 16 distinct values; Dialog and PhoneFrame both use 200, four unrelated layers share 60 |
| the segmented `ink` shadow | alpha 0.18 | code only; goes away with question 17 |

**Drift to remove, not to name:** radius 9, 7 and 16; font sizes 14.5, 9.5, 19, 23, 26 and 7; the Review
success circle at 320ms against the shared overlay's 420ms; `global.css:798` and `:327` typing `#0d6e63` and
`#172320` instead of their CSS variables.

The `space` scale is imported nowhere; spacing is all literal and mostly design-sourced (6, 10 and 14 are in
the mockups). Not proposed for this effort.

## 8. Guardrails for future phases

Candidate rules for `CLAUDE.md` and for the "While working" block of every catch-up phase prompt. Wording to
adopt once the shared components exist (each rule switches on when its U phase lands).

**For CLAUDE.md, a new section "One component per job":**

> - **Before writing a new button, pill, chip, field, select, search box, sheet, dialog, notice, table, card
>   or tab, use the shared one.** Shared UI lives in `src/shared/ui/` (controls and feedback),
>   `src/shared/surface/` (sheets, dialogs, modal behaviour), `src/shared/table/` (tables) and
>   `src/shared/calendar/`. `docs/ui-unification/README.md` lists what exists and why.
> - **If the shared component cannot do what you need, extend it with a variant or prop; never copy it into a
>   screen file.** A variant must match a pattern in `docs/design/`; name the mockup in the commit notes.
> - **No private component may repeat a shared one's job or name.** No local `Pill`, `TextAction`, `Th`/`Td`,
>   `BackLink`, `Section`, `Row`, `Card` or `Avatar` in a screen file.
> - **No raw `<button>`, `<input>`, `<select>` or `<textarea>` with its own style object in a screen** unless
>   the element is part of a stays-custom surface (DayGrid, SlideStack, the invoice document, the phone frame).
> - **Tokens only.** No hex, radius, font size, shadow or z-index literal where a token exists
>   (`src/theme/tokens.ts`). A new value needs a token and a design source.
> - **Formatting has one home.** Money through `formatMoney`, dates and timestamps through the helpers in
>   `shared/format.ts`, person names through `drSurname` and friends. No `toFixed(2)` or `format(...,
>   'EEE d MMM')` in a component.
> - **A shared component keeps its hooks.** Every shared component takes `shot` and emits `data-shot` on the
>   element recipes target; pass `data-*` attributes through.
> - **Keep the catalogue in step.** Adding, renaming or removing a shared component updates its row in
>   `/demo/catalogue/*` in the same change.

**For each catch-up phase doc** (a line in "Work items" for UI items, and in the adversarial review steer):

> - UI in this phase is built from the shared components (list the ones this phase needs). A new private copy
>   of a shared component is a review finding.
> - This phase also migrates these existing copies on the screens it rebuilds: (list from `PLAN.md` section 3).

**How to add a variant** (for the README of `src/shared/ui/`, written in U1):

1. Find the pattern in `docs/design/`. If it is not there, it is a design question, not a variant.
2. Add the prop to the shared component, defaulting to today's look so no existing call site changes.
3. Add or extend the catalogue row so the variant is visible beside the others.
4. Add a Vitest case for the new prop's behaviour or ARIA state.

**A test that enforces it** (proposed for U7): a source-scan test in the style of `pwaPurity.test.ts` that
fails when an app or shared screen file defines a component named like a shared one, or contains a raw
styled `<button>` outside an allow-list.

## 9. The plan in brief

Full version, with contents, call sites, done criteria and registration steps, in `PLAN.md`.

| Phase | What | Sessions | Runs |
|---|---|---|---|
| **U1** Tokens, money and date text | New and bypassed tokens (no visual change), `formatMoney`, date and plural helpers, six one-line bug fixes | 1 | After Phase 21 lands, before 21a |
| **U2** Overlays | Modal layer (fixes the Escape bug), sheet header and close, sheet footer, confirm, done step, side panel, popover | 2 | Before 21a; must precede 22 and 35 |
| **U3** Pills, badges and feedback | Pill, count badge, attention dot, avatar, FormError, Notice, result line, empty state | 2 | Before 21a; must precede 22 |
| **U4** Fields and search | Fill rule, select field, text field, checkbox, switch, focus ring, search box, date and time fields, contract chooser parts | 2 | After 22; must precede 23, 24, 26 and 27 |
| **U5** Buttons, tabs and toggles | Button sizes and outline, text action, back link, icon button, segmented, underline tabs, filter pills, nav state | 2 | After 22, before 23; must precede 27 and 34 |
| **U6** Tables, cards and page chrome | Table kit, clickable rows, card, eyebrow, page header, stat tile, label and value rows, status block | 2 | After 25; must precede 26, 33, 36, 42 |
| **U7** Close out | Migrate leftovers, regroup the catalogue by family, the guardrail test, CLAUDE.md rules | 1 | After the parallel tracks, before 44 |

Screens that upcoming phases rebuild are **not** migrated standalone. Their copies move inside the phase
that rebuilds them: `ReviewScreen` (21a), `InvoiceDocument` and `OfficeBillingSetup` (22), the capture cards
(21a, 23, 24), `BookingDetailBody` (35), Integrations (34), `BillingMonitorScreen` (37), Accounts (38), Master
data (42), the anaesthetist screens (43a). `PLAN.md` section 3 gives the list per phase.

Every phase finishes on the catch-up done criteria: `npm run build`, `npm run build:pwa`, `npx vitest run`,
`npm run shots` and `npm run verify:board` green; catalogue rows in step; capture recipes for touched hooks
re-run; the demo guide checked; no `PERSIST_VERSION` change (none of this touches the seed); and a before and
after comparison of the catalogue screenshots in `shots/`, listing every intended pixel change.

## 10. The library decision (note applied 12 November 2026)

The replacement for the status block at the top of `docs/ui-library-research/README.md`:

> **Status: closed, 12 November 2026. We are not adopting shadcn/ui or any component library.**
>
> - The side-by-side preview scored library fit for our look at 2.6 to 2.8 out of 5 (Admin 2.8, Web 2.7,
>   Mobile 2.6); no row scored 5.
> - The kit had to rewrite Button, Badge, Tabs, the segmented control and the toast to match the design.
> - The dev team is comfortable keeping custom controls and advised against bending shadcn to our look.
>
> The research surfaced a problem worth fixing on its own: the same component built more than once. That work
> continues as the unification effort in `docs/ui-unification/` (one component per job, our own design and
> code). The inventories, the fit notes and the component map in this folder remain as evidence; the
> provisional decisions and the "How to resume" prompt below are historical.

**`ui-library-preview/`: to be retired in U1, keeping its evidence.**

- It imports prototype source through `@proto` without type-checking, so it breaks at runtime as soon as a
  shared component is renamed or moved, which U1 onwards does constantly. Its own README already says it
  fails while the prototype is mid-edit.
- Its left column is the live catalogue (`/demo/catalogue/*`), which stays, and `shots/` here now holds all
  170 current rows.
- Proposed: move `rows.json`, `ROWS.md`, `PLAN.md`, `src/rows/fit/` and `src/rows/recommendations.ts` into
  `docs/ui-library-research/preview-archive/`, delete the workspace, and remove `dev:preview` and its `setup`
  step from the root `package.json` and its paragraph from `CLAUDE.md`. (It was untracked when this was written;
  it was committed as `af41706e` before U1, so it is in git history too.)
- Decided: retire it at the start of U1 (question 26). Done in U1 (16 Nov 2026): the five paths are in
  `docs/ui-library-research/preview-archive/` and the workspace is deleted. It had been committed by then
  (`af41706e`), so it is also in git history.

**The live catalogue stays and changes role.** Its rows are grouped by replacement library (shadcn, Sonner,
TanStack ...) and its tests assert those section ids. U7 regroups it by family (buttons, pills, fields ...),
turns the "Replace with" column into "Shared component", and updates the three catalogue tests.

## 11. Method and limits

- **Sweeps:** seven family sweeps (by name, by look, by behaviour, across apps), a token sweep and a context
  sweep (remaining phases, decisions, what must not break), run independently.
- **Verification:** each family sweep was then checked by a second reader who had not written it, told to
  break it: open every member, re-run the counts, check each "drift" against `docs/design/` and the Decisions
  log, and check each claimed bug by reading the full code path. That pass dropped 4 groups, split 4, and
  reversed several conclusions (section 1).
- **Completeness:** all 170 catalogue rows and every folder of `src/shared`, `src/apps/*`, `src/shell` and
  `src/pwa` were walked against the groups. Four rows had been missed outright and ten families had fallen
  between sweeps; they are U23 and U35 here and N1 to N10 in `detail/J-completeness.md`.
- **Fact-check:** this README and `PLAN.md` were then checked statement by statement against the detail
  files by a reader who had not written them (about 340 statements, 22 corrections applied).
- **Limits:**
  - Only the Escape bug was reproduced in a browser. The other findings come from reading code and from the
    catalogue screenshots.
  - Counts are from ripgrep over the tree as it stood on 12 November 2026 while Phase 21 was being built in
    another session; a few line numbers will have moved.
  - Call-site counts above about 30 are estimates to within a few.
  - Phase 21's own new UI (`PayerSheet`, the Payer and Funder rows) is not in the audit.
