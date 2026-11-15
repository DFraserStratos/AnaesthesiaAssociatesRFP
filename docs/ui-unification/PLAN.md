# UI unification: the phased plan

Companion to `README.md` (the audit). The 27 questions in README section 6 were answered on 12 November 2026,
all with the recommended answer, so the order and contents below are approved, including interleaving (question
1). Next, each phase becomes a phase doc and a kick-off prompt in the style of
`docs/prototype-build/catch-up/phases/`.

U-numbers (U01 to U36) are the audit's groups. U1 to U7 (no leading zero) are the phases.

## 1. Order of work

```
21 (in flight)
  U1  Tokens, money and date text        1 session
  U2  Overlays                           2 sessions
  U3  Pills, badges and feedback         2 sessions
21a, 22
  U4  Fields and search                  2 sessions
  U5  Buttons, tabs and toggles          2 sessions
23, 24, 25
  U6  Tables, cards and page chrome      2 sessions
26, 17a, 27, 27a, Intake (33 to 35), Money (36 to 39b), 40 to 43a
  U7  Close out                          1 session
44
```

Why this order:

- **Value first.** U1 fixes the money bug at almost no risk. U2 fixes the Escape bug and gives every later
  phase one sheet header, footer and confirm. U3 gives them one pill, one notice and one error box. Sheets and
  pills are what the remaining phases add most (README section 1, point 3).
- **Risk rises with breadth.** U1 changes no look. U2 and U3 change shared files that carry many call sites
  with no call-site edits. U4 and U5 make visible changes that depend on your answers. U6 is the widest and
  waits until the Contracts track has finished rewriting Review, Invoices and Booking detail.
- **Hard deadlines from the catch-up plan:**

| Must land before | Because that phase | Needs |
|---|---|---|
| 22 | adds `SplitFeeSheet`, status pills and a Review banner | U2 header and footer, U3 Pill and Notice |
| 23 | adds a Make primary confirm; reworks pricing around the step rail | U2 `ConfirmSheet`; U4 contract chooser parts |
| 24 | puts the Booking total in front of the anaesthetist; adds `PriceCard` | U1 `formatMoney`; U4 amount field |
| 26 | builds `ProfileRow`; adds a card to More; makes the WebNav avatar a button | U6 `DefRow` and `Card`; U3 `Avatar` |
| 27 | adds a toggle and disabled-with-reason buttons | U4 `Switch`; U5 `disabledReason` |
| 33, 33a | builds the Matching screen (tables, tabs, badges, empty state); adds `StubMarker` | U6 table kit; U3 `EmptyState`, `AttentionDot` |
| 34 | rewrites the Integrations tabs as routed Intake tabs | U5 `LineTabLink` |
| 35 | rewrites almost every edit sheet; adds "Leave without saving?" | U2 modal layer and `SheetActions` |
| 36, 37 | add filter bars, filter pills, sortable tables | U4 compact select and `FilterDateInput`; U5 `FilterPills`; U6 table kit |
| 38b | adds a Review Events tab with a count | U5 `LineTabLink` with `badge` |
| 39b | adds a minutes stepper and time fields | U4 `NumberStepper`, `TimeRangeFields` |
| 40, 42 | build four-tile summary rows; 42 refits every master view | U6 `StatTile`, `PageHeader`, table kit |
| 43a | adds `InfoTip` (first product popover) and `HelpPanel` | U2 `PopoverPanel`, `SidePanel`; U6 `Eyebrow` |
| 44 | audits labels and regenerates every screenshot | everything |

Interleaving was chosen (README question 1). For the record, the fallback was: finish 21a to 25, then run U1 to U6
back to back before the parallel tracks. The cost is that 21a to 25 add about six sheets, a confirm and many
pills as fresh copies, and Phase 24 ships the ungrouped Booking total to the anaesthetist first.

## 2. The phases

Each phase: build the shared component, migrate the **stable** call sites, leave screens that a catch-up
phase is about to rebuild (section 3), update the catalogue rows, finish green (section 4).

### U1 · Tokens, money and date text (1 session)

**Goal:** fix the two-way money, give every later phase the tokens and text helpers it needs, and clear the
one-line defects. No intended visual change except money grouping.

- **Tokens** (`src/theme/tokens.ts`, `global.css`, kept in step with `docs/design/Design Language.dc.html`):
  - Add the design-sourced tokens in README section 7: type sizes 12.5, 11.5, 13.5 and the two page titles;
    radius 6, 8, 12; `neutral.gridline`, `brand.onDarkMuted`, `status.free.onFill`; `elevation.thumb`,
    `elevation.cardEdge`; `surface.frosted`; `motion.uiFade`; `--focus-ring`; and, though not design-sourced, a
    `zIndex` scale.
  - Swap the literals that already equal a token (radius 999, 99, 10, 14; e1 to e3 strings; `easing.card`; the
    mono stack; `#FFFFFF` as `neutral.surface`). Font-size literals are swapped only inside the shared
    components each phase touches, not across 180 files.
- **U01 Money:** `formatMoney` in `domain/billing/money.ts`; about 25 display sites and 8 message sites;
  update `visual/contracts-phase19a.spec.ts:27,49,52` and demo guide `03-demo-script.md:811` (and
  `master-demo-guide.html`).
- **U28 Date text:** `domain/dateText.ts` with `dateRange`, `stampText`, `plural`, `hhmm`, re-exported from
  `shared/format.ts`; one `parseAmount`. Migrate the files U1 already touches; the rest move when touched.
- **One-line fixes:** a real button as the keyboard handle in the web List detail Bookings table (U09);
  `aria-hidden` on the DayGrid "!"; `nameWithoutTitle` reuses `TITLE_PREFIX`; drop the inline `outline: none`
  on the Contract combo search; valid list semantics in `ContractRail.tsx:288`; SideNav reads
  `PERSONAS.kirsty`.
- **Also:** write `src/shared/ui/README.md` ("how to add a variant", README section 8) and, if approved,
  retire `ui-library-preview/` and update `docs/ui-library-research/README.md` (README section 10).
- **Risks:** message strings asserted in Vitest (grep for `toFixed`-shaped strings first); the Playwright
  spec and the demo script carry the old figure.

### U2 · Overlays (2 sessions)

**Goal:** one modal behaviour, one sheet header, one footer, one confirm. Fixes the Escape bug.

- **Session 1:**
  - **U02** `useModalLayer` in `shared/surface/`: Dialog, BottomSheet and MasterPanel adopt it with no
    call-site change (about 66 overlays).
  - **U19** `SidePanel` for SlotDrawer, DraftListDrawer and MasterPanel; SlotDrawer imports `drawerParts`.
  - **U30** `usePopover` and `PopoverPanel`; the five popovers adopt it.
- **Session 2:**
  - **U03** `OverlayHeader` (about 64 titles) and the corner X on web dialogs (question 11).
  - **U18** `SheetActions`, `ConfirmSheet`, `InlineConfirm`, `DoneStep` (about 45 footers, 15 confirms, 5 done
    steps).
- **Not migrated here:** sheets that Phases 21a, 22, 24 and 39b delete or replace (`FunderAllocationSheet`,
  `PriceOverrideSheet`, `AddBillingLineSheet`). Phase 35 changes every edit sheet's primary to "Apply": it
  builds on `SheetActions`.
- **Risks:** `role="dialog"` and `aria-modal` are matched by 8 Playwright specs, 4 Vitest files, the SlideStack
  edge-swipe guard and 54 capture selectors scoped to `[data-aa-mobile-product] [role=dialog]`. No portals:
  overlays must stay inside the scaled phone frame. `inert` must preserve SlideStack's parked layers.
  `data-testid="admin-list-drawer"` is used by 9 specs and a CSS rule.
- **Extra done criterion:** a Vitest case and a Playwright step that open the code picker inside the Contract
  panel, press Escape once, and find the panel and its edits still there.

### U3 · Pills, badges and feedback (2 sessions)

**Goal:** the passive vocabulary every phase reuses.

- **Session 1:** **U04** `Pill` (tones, sizes, outline; about 12 stable sites; delete `OutOfHoursPill`);
  **U26** `CountBadge` and `AttentionDot`; **U25** `Avatar` and `PersonaChip`.
- **Session 2:** **U05** `FormError` (about 20 swaps); **U11** `Notice` (about 25 sites); **U12** `ResultLine`
  (about 11 sites, colour per question 14); **U29** `EmptyState` (about 35 sites).
- **Not migrated here:** pills on Review (21a), Invoices and InvoiceDocument (22), Billing monitor (37),
  Integrations (34), Accounts and `AgeChip` (38), DemoXero. Those phases build on the new `Pill`.
- **Risks:** `data-tier`, `data-unassigned`, `data-list-state`, `data-progress`, `list-row-badge`,
  `admin-notifications-count`, `booking-warning`, `data-strength`; the result-line colour change reshoots
  availability and Admin capture screenshots.

### U4 · Fields and search (2 sessions)

**Goal:** one field chrome, one fill rule, one focus ring. Depends on questions 4 to 6.

- **Session 1:** the fill rule and `.aa-field:focus-visible` (**U15**); **U07** `SelectField` (about 30
  selects; native select kept); `TextField` gains number, time, `min`, `max`, `invalid`, `size`, `fill`;
  `Checkbox`, `Switch`, `FieldHint`, `TextArea` counter; **U06** `NameSearchBox` fill and the two Lists search
  swaps.
- **Session 2:** **U27** `FilterDateInput`, `DateJumpInput`, `TimeRangeFields`; **U34** `NumberStepper`,
  `useRovingRadio`, `ChipMultiSelect` in `ContractEditSheet`; **U33** `useCalendarKeys`, `MonthHeaderRow`;
  **U24** contract chooser parts (`OtherPriceCard`, `RailOptionGroup`, `StepRail`).
- **Not migrated here:** `FunderAllocationSheet` (deleted in 22), the Integration monitor (34), the capture
  cards' internals (21a, 23, 24 rebuild them; they take the new parts there), the hospital calendar (42).
- **Risks:** 58 capture `select` steps and their pinned forms (`data-shot` on the `<select>`, literal
  `aria-label="Hospital"`, `nth` positions); Playwright reads `input[type="date"]` by position in five specs;
  `mobile-lists-search` and `web-lists-search` test ids; `ListsScreen.test.tsx:69`; the PWA 16px input rule;
  `contract-rail-*` shots; the demo guide calls "Other price" the step rail's toggle (label unchanged).

### U5 · Buttons, tabs and toggles (2 sessions)

**Goal:** every command, link and switch-between control on one component each. Depends on questions 3, 7
to 10, 17, 18.

- **Session 1:** **U08** `Button` sizes, `outline`, `disabledReason` (about 35 product sites; demo and shell
  per question 2); **U13** `TextAction` (about 85 sites); **U21** `BackLink` (15); **U36** danger per
  question 8.
- **Session 2:** **U20** `IconButton` and `CloseButton` (about 35 sites; update the two specs that click "›");
  **U16** `SortToggle` onto the segmented control, Balances per question 17; **U17** `LineTabs`; **U32**
  `FilterPills`, `ProgressBar`, `aria-current` on the three navs.
- **Not migrated here:** buttons on Integrations (34), Billing monitor (37), InvoiceDocument (22, and its 40px
  buttons are a decision), the Review header (21a), masters `TextAction` (42 unless done first), the
  Integrations `TabButton` (34), Accounts sub-tabs (38).
- **Risks:** about 68 Playwright clicks, 11 group selectors and 27 capture steps find these controls as
  buttons (keep the role); `visual/admin-phase06.spec.ts:60` and `admin-phase09.spec.ts:47` click by the name
  "›"; `WebCatalogue.test.tsx` asserts a nav tab's font weight; press feedback stays in `global.css`.

### U6 · Tables, cards and page chrome (2 sessions)

**Goal:** the page skeleton. Depends on questions 19, 20, 23. Runs after Phase 25.

- **Session 1:** **U10** `shared/table/` (`Th`, `Td`, `GroupRow`, `TableShell`, density); re-point the
  internals of the masters `Table` and `tableStyles.ts` with no call-site change; **U09** `ClickableRow` and
  `RowOpenButton` (12 tables, including the Draft Lists keyboard handle).
- **Session 2:** **U14** `Card` (about 30 copies; mobile radius 16 to 14); **U22** `Eyebrow` (about 45 sites);
  **U31** `PageHeader`, `StatTile`, `DefRow`; **U23** `StatusBlock` everywhere through `blockFill`; the small
  repeats in **U35** that sit in files this phase opens.
- **Not migrated here:** the masters `Header`, table API rename, group rows and empty cards (42 does them on
  the kit); `CaptureSection` and `BookingDetailBody` sections (35); DemoXero and DemoData.
- **Risks:** `ClickableTableRows.test.tsx` (class and `verticalAlign`), `columnheader` queries in
  `AccountsScreen.test.tsx` and `ListsScreen.test.tsx`, `DemoXero.test.tsx`, the catalogue row "Lists table
  (Th · Td · GroupRow)" asserted by name, table shell test ids (`review-queue-table-shell`,
  `invoice-list-table-shell`), row `data-*` attributes, geometry assertions on the invoice workspace and the
  admin rail.

### U7 · Close out (1 session)

- Migrate what is left: any stable call site skipped earlier, and the U35 small repeats.
- Regroup the live catalogue by family, change "Replace with" to "Shared component", update the three
  catalogue tests and `masterViews.ts` `catalogueRows`.
- Add the guardrail source-scan test (README section 8) and the "One component per job" section to
  `CLAUDE.md`.
- Re-run the audit's counts (`detail/H-tokens.md` commands) and record the before and after in this folder.
- Runs before Phase 44, which regenerates every screenshot and audits labels against the demo guide.

## 3. What folds into the catch-up phases

These phases rebuild a screen that holds copies. Each gets one added work item ("build on the shared
components; migrate these copies") and one added line in its adversarial review steer ("a new private copy
of a shared component is a finding").

| Phase | Builds on | Migrates while it is there |
|---|---|---|
| 21a | Pill, Notice, Button | Review pills (`FlagPill`, "Submitted", "Not complete", "Changed"); Review header buttons; `TimesCard` nudge labels; capture stepper names |
| 22 | OverlayHeader, SheetActions, Pill, Notice | Invoices `StatusPill`, InvoiceDocument `StateChip`; the Office billing setup card's teal tint (decide there); deletes `FunderAllocationSheet` with its unnamed controls |
| 23 | ConfirmSheet, StepRail | `MakePrimarySheet` on `ConfirmSheet`; removes `UnitsCard` steppers on additional Procedures |
| 24 | formatMoney, TextField amount | `PriceCard` on the amount field; replaces `OverrideCard` and `PriceOverrideSheet` (one set of override fields, not two) |
| 25 | LineTab, DefRow, Pill | The Contract panel's History tab is the first local tablist; the lock pill |
| 26 | DefRow, Card, Avatar | Builds `ProfileRow` as `DefRow`; the More card at radius 14 |
| 27, 27a | Switch, Button `disabledReason`, Card, CountBadge | `PrepaymentPanel`; the Pre-payments rail count; deletes `officeActionStyle` |
| 33, 33a | Table kit, LineTabs, Pill, EmptyState, AttentionDot | The Matching screen is built on the kit from the start; `StubMarker` on `AttentionDot` |
| 34 | LineTabLink | Deletes Integrations `TabButton`; Intake tabs on the underline strip (question 18) |
| 35 | Modal layer close guard, SheetActions | Every edit sheet's footer; `BookingDetailBody` sections onto `SectionCard`; the notes textarea |
| 36, 37 | SelectField compact, FilterDateInput, FilterPills, table kit | Billing monitor pills, buttons and filter bar; the pipeline's a11y note |
| 38, 38b, 39a | LineTabLink with badge, table kit | Accounts sub-tabs; deletes `AgeChip`; Review Events tab |
| 39b | NumberStepper, TimeRangeFields | Deletes `AddBillingLineSheet` and `BillingLinesCard` |
| 40, 42 | StatTile, PageHeader, table kit, EmptyState | 42: `MasterHeader` over `PageHeader`, masters table rename, `GroupRow`, `ClickableRow`, empty cards, the hospital calendar's today marker and header, the Master data sub-nav |
| 43, 43a | PopoverPanel, SidePanel, Eyebrow | `InfoTip`, `HelpPanel`; SideNav persona through `shared/viewer.ts`; DemoData tables when touched |

## 4. Done criteria (every U phase)

From `aa-prototype/`:

- `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.
- `pwaPurity.test.ts` still passes: anything mobile uses lives in `src/shared`, never in an app folder.

From the repo root:

- `npm run verify:board` green.
- Capture: `node scripts/capture.ts --dry` in `requirements-board/`, then `npm run capture` for the recipes
  whose hooks the phase touched; look at the shots; update ATLAS if a hook moved.

For the unification itself:

- **No hook lost.** Every `shot` prop, `data-shot`, `data-testid`, `data-validation-*` and row `data-*`
  attribute that existed on a migrated element is still on the element recipes and specs target. Check with
  `git diff` for removed `data-` lines.
- **Screenshot comparison.** Retake the catalogue shots (`node docs/ui-unification/shots/shoot.mjs
  <aa-prototype path> <out folder>` with the dev server running) and compare with the 12 November baseline in
  `docs/ui-unification/shots/`. Every pixel change is either listed in the phase notes as intended (with the
  question that approved it) or fixed.
- **Catalogue in step.** Rows for renamed, merged or removed components are updated with their tests.
- **Demo guide checked.** The S1 to S5 run sheet and cheat sheet are read against the changes; any changed
  label, figure or control is patched in the same session, in the Markdown and in `master-demo-guide.html`.
- **No seed change.** `PERSIST_VERSION` is untouched (stays at its current value); if a phase finds it needs
  to change the seed, that is out of scope.
- **Copies gone.** The private components the phase replaced are deleted, not left beside the shared one;
  the phase notes give the before and after count.
- **Adversarial review** (convention 18) with one added lens: "find a private copy of a shared component
  that this phase left or added".
- **PROGRESS.md:** a status row, a short entry, and a Decisions-log entry for each README question the phase
  put into effect.

## 5. Registering the phases

The catch-up plan is generated, so hand-added phases need care (`detail/I-context.md`, "Numbering and
registration").

- **Names.** `U1` to `U7`, in a new track "UI unification", so they cannot be confused with catch-up numbers.
  Files: `docs/prototype-build/catch-up/phases/phase-U1-tokens-money-date-text.md` and its `.prompt.md`.
- **Where they are listed.** `plan.json` (`phases[]` with `track`, empty `covers`, `depends_on`,
  `est_sessions`, and a `sequencing_rules` line for each "must land before" in section 1), `ROADMAP.md`
  (Tracks, Phases table, Sequencing rules), then regenerate `index.html` with `build-index.mjs`.
- **The generator risk.** `/update-build-plan` rebuilds `plan.json` from its planner's output, and a phase
  that covers no requirement is a candidate for removal. Mitigation: a ROADMAP sequencing rule stating the U
  phases are owner-added and outside the gap analysis, and an owner directive ("keep the UI unification
  track") passed on every `/update-build-plan` run. A built phase is safe once its PROGRESS row says DONE.
- **Tooling requirements for each phase doc.** It must keep the exact heading `## Catalogue screenshots`
  (stating it owns no stories and listing "Recipes this phase breaks"), and its prompt must contain
  `npm run capture`, or `recipe-status.mjs --check` fails.
- **Phase doc shape.** Same sections as a catch-up phase doc. "Requirements covered" becomes "Groups covered"
  (the U-numbers, linking to `docs/ui-unification/`). "Reference" points at the group's detail file, the
  mockups named there and the README question that settled the look. The manual checklist is the group's
  behaviour contract (keyboard, focus, Escape, ARIA) run in the live app.
- **Prompt shape.** Same as a catch-up kick-off prompt, with the reading list: this README, the phase doc,
  the detail files, `docs/design/`, PROGRESS conventions and Decisions log. "While working" adds: default
  props keep today's look; never drop a hook; no redesign.
- **Fold-ins.** The rows of section 3 are added to the affected catch-up phase docs by hand as "Small
  updates" (the path that does not re-run the planner), and to `plan.config.json` standing rules so later
  regenerated docs carry the one-component rule.

## 6. Risks across the whole effort

| Risk | How the plan handles it |
|---|---|
| A parallel catch-up session edits the same shared file | U phases run between catch-up phases, not beside them. |
| A "unification" becomes a redesign | Default props keep today's look. A visible change needs a README question answered and a mockup named. The screenshot comparison catches the rest. |
| Capture recipes and Playwright selectors break | Hooks pass through; roles stay (question 3); selects stay native; each phase lists the selectors it touches and re-runs their recipes. |
| The plan generator drops the U phases | Section 5: sequencing rule plus owner directive. |
| Migrating a screen a later phase rebuilds | Section 3: those copies move inside that phase. |
| The demo script drifts from the app | Each phase reads the run sheet; U1 patches the money figure; Phase 44 adds `demoGuideSync.test.ts`. |
| The preview workspace stops loading | It is retired in U1, or accepted as frozen (README section 10). |
