> Detail file for `docs/ui-unification/README.md` (audit of 12 November 2026): tables, clickable rows, cards, eyebrows, page headers, tiles.
> Group numbers here (G1, N1 ...) are local to this file; the README's U-numbers point to them. Paths are relative to `aa-prototype/src/` unless they start with `docs/`.

# V-G: verified tables, rows and layout chrome (corrected from G-tables-cards-chrome.md)

Paths are under `aa-prototype/src/` unless they start with `docs/`. Design facts re-read from `docs/design/*.dc.html`.

Three things the sweep missed change several verdicts:
1. **The Web Dashboard mockup has no table.** No mockup contains a `<table>`. The only table anatomy is the CSS grid in
   `Admin Review.dc.html:76-90`: shell radius 14, `overflow:hidden`, **e1**; header `10px 20px` on `#F6F8F7` with a
   `#E2E7E5` rule, labels 11/600/0.06em mist; rows `12px 20px`, `#EDF1EF` (sunken) divider, hover fill. The web tables
   copy this almost exactly. Admin's own tables (10/700, `lineStrong`, `line` dividers, flat shell) drift from it.
2. **The Design Language settles two of the sweep's questions** (`Design Language.dc.html:223,244`): "Desktop table rows
   40 px; admin day-grid rows 32 px" (one desktop row height, for web and admin alike) and "Hover on web rows:
   neutral/sunken fill, no shadow". Missing hover on the web tables is DRIFT, not an open question.
3. **The shadow rule is in the mockups.** The page's main data surface carries e1: the Admin Day grid
   (`Admin Day.dc.html:54`), the Admin Review table (`:76`) and the Web Dashboard panels (`:49,95,110`). Rail cards
   (`Admin Day.dc.html:90,99,108`) and the Review summary tiles (`Admin Review.dc.html:68-71`) are flat. Admin table
   shells being flat is DRIFT. Admin rail cards being flat is INTENDED.

## Verification summary

| Group | Verdict | What I corrected |
|---|---|---|
| G1 Th/Td cells | CONFIRMED WITH CORRECTIONS | The Web Dashboard has no table. Admin Review is the only table mockup and the web tables follow it. Admin's 10/700 header is DRIFT with no ruling: PROGRESS.md has no density entry. The DL gives one 40px desktop row. Empty rows belong to F G12. DemoXero and DemoData are out of scope. |
| G2 Table shell | CONFIRMED WITH CORRECTIONS | The shadow question is answered by the mockups (e1 on the main data surface), so the flat admin shells are DRIFT. 10 hand-rolled shells confirmed. Masters `Table` keeps its signature until Phase 42. |
| G3 Clickable rows | CONFIRMED WITH CORRECTIONS | All three keyboard gaps are confirmed by reading the code. The web hover gap is DRIFT per DL:244, so that is not a question. DemoData is out of scope. 12 product tables, not 14. |
| G4 Titled card | CONFIRMED WITH CORRECTIONS | `ProfileCard` has 6 call sites, not 22. The 80-in-52 composite count includes table shells, empty cards, sheet option cards and shell menus, so the real card duplication is about 30 copies. Shadow rule settled. Radius 16 is DRIFT (mobile mockups use 14 for every card, and 16 never appears). Added `pwa/InstallCoach.tsx:86`. The count pill belongs to family B. |
| G5 Eyebrow section card | CONFIRMED WITH CORRECTIONS | `CaptureSection` already takes `gap`, so gap 10 vs 12 is a prop, not drift. The `capture-` shot prefix is hard-coded, so a merge needs `shotPrefix`. Its members are on files Phases 21 to 25 rewrite: fold it into those phases. |
| G6 Eyebrow label | CONFIRMED WITH CORRECTIONS | Recount: about 51 uppercase sites in 33 files, plus about 10 caps-typed labels with no `textTransform`. That gives about 60 in about 40 files, so H is right and G undercounted. `type.micro` IS read once (`shared/booking/ProcedureStack.tsx:36`). `FieldLabel` is a `div`, not a label. Table `Th` belongs to G1. |
| G7 Label-value rows | CONFIRMED WITH CORRECTIONS | `Fact` has about 10 uses, not 22+. The right-aligned settings row is not "a different job": Phase 26 builds it as `ProfileRow`. Make it a `DefRow` variant. |
| G8 Page header | CONFIRMED WITH CORRECTIONS | Admin has 12 h1s at 24, not 11 (`NotificationsScreen.tsx:49` was missed). Phase 42's `MasterHeader` replaces the masters `Header` (16 sites), so leave those to 42. |
| G9 Stat tile | CONFIRMED WITH CORRECTIONS | Both looks are design-backed, and radius 10 vs 12 is INTENDED. Only the Review `Tile` label (10.5/700) and padding are DRIFT. Value rises to medium: Phases 40 and 42 both build "Admin Review four-tile" rows. |
| G10 Empty states | DROPPED here | Owned by F G12, which has the fuller inventory. G1's `EmptyRow` is F's `variant="row"`. |

---

### G1: Table header and body cells (`Th` / `Td` / `GroupRow`)
- **Job:** a header cell (micro-cap label), a body cell (padding, divider, mono, alignment) and a group row.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| `Th`/`Td`/`GroupRow` | `apps/web/screens/ListsScreen.tsx:289,299,307` | Web | 1 table |
| `Th`/`Td` (`align`) | `apps/web/screens/ListDetailView.tsx:405,413` | Web | 1 table + totals row |
| `Th`/`Td` (`right`/`center`/`bold`) | `apps/web/screens/AccountsScreen.tsx:494,502` | Web | 4 tables |
| `th`/`td` consts + `GroupRow` | `apps/web/screens/ListsLookback.tsx:95-98` | Web | 2 tables |
| `cellStyle`/`headCellStyle` factories | `apps/admin/tableChrome.ts:10,20` | Admin | 9 screens (Review, ReviewQueue, DraftLists, Integration, Invoices, BillingMonitor, Conflicts, AaFees, Audit) + 4 components/flows |
| compact re-export + `rowCellStyle` | `apps/admin/screens/masters/tableStyles.ts:7-10` | Admin | 12 masters files + `flows/ContractPriceRanges.tsx` |
| admin `<td colSpan>` group rows | `masters/ContractsView.tsx:164`, `masters/RvgGroupsView.tsx:~137` | Admin | 2 |
| (out of scope) `Th`/`Td` | `apps/demo/DemoXero.tsx:882,890`; `apps/demo/DemoData.tsx:64,72` | Demo | 3 + 2 tables |

- **Differences**
  - Four private web pairs that are near-identical: DRIFT.
  - Accounts `12px 16px` / `11px 16px` vs `12px 20px` elsewhere on web: DRIFT.
  - Admin header 10/700, `lineStrong`, on `bg` vs the mockup's 11/600, `line`, on `bg`: DRIFT. The mockup is
    `Admin Review.dc.html:77-87`, and PROGRESS.md has no density or compact ruling (grepped).
  - Web header has no `bg` band, where the mockup has one: DRIFT, small.
  - Admin cell padding `10px 10px` (compact `8px 10px`) vs the mockup's `12px 20px`: UNSURE. `tableChrome.ts:4-9` calls
    compact deliberate for "dense audit + master tables", and DL:223 sets 40px rows, which the admin default roughly meets.
  - Row divider: `line` on admin `td` vs `sunken` in the mockup and on web: DRIFT.
  - Alignment is spelled four ways (`right`, `align`, `rightAlign[]`, `numCell`): DRIFT.
  - Group rows: web `<th scope="colgroup">` vs admin `<td>`: DRIFT with an a11y cost.
- **Target:** `src/shared/table/` (not `apps/admin`: web imports it, and `pwaPurity` is unaffected).
  - `Th({align?, width?})` and `Td({align?, mono?, bold?, clip?, nowrap?, style?})`.
  - `GroupRow({span})`, always `<th scope="colgroup">`.
  - A `TableDensity` context: `comfortable` = 12px 20px (web) and `compact` = today's admin padding. No row changes height.
  - Header canonical: the mockup's 11/600/0.06em mist on `neutral.bg` with a `line` rule; dividers `sunken`. Reads
    `type.micro`. Keep `tableChrome.ts` as a thin re-export, because Phase 43's doc says the `Pager` "reuses its cell styles".
- **Behaviour contract:** `Th` emits `scope="col"`, and `GroupRow` uses the web `scope="colgroup"` form. Gain: the
  admin grouped tables (Contracts by holder, RVG by anatomy) get header semantics.
- **Migration**
  - Scope: web 4 files and admin 9 screens. Masters only through `tableStyles.ts` (internals only; see Phase 42).
  - Risks:
    - `ClickableTableRows.test.tsx:35` asserts `td` `verticalAlign: middle`.
    - `AccountsScreen.test.tsx` and `ListsScreen.test.tsx` query `columnheader`.
    - Catalogue row "Lists table (Th · Td · GroupRow)" is asserted by `WebCatalogue.test.tsx`.
    - No Playwright style assertions on tables (grepped `toHaveCSS`).
  - No seed or `PERSIST_VERSION` effect. Admin headers visibly lighten. Size M.
- **Upcoming phases:** 33 (Matching tables), 36 (Ledger), 37 (BillingMonitor restyle), 38/39a (Accounts sub-tabs),
  40 (Patients tables), 42 (every master view), 43 (Pager). Land standalone **after 25, before the parallel tracks**.
  21a to 25 rewrite ReviewScreen, InvoicesScreen and BillingMonitor, so migrating those now is churn.
- **Value:** 4 web copies + 2 admin factories become one; medium visibility (web and admin headers differ on app switch).
- **Confidence:** high.
- **Catalogue rows:**
  - web: "Lists table (Th · Td · GroupRow)", "WebResultsTable", "WebDayTable", "Accounts tables (tfoot totals)", "List detail Bookings table"
  - admin: "Table / Header / TextAction / EditCell", "ReviewQueue (clickable rows)", "RvgGroupsView (grouped rows)", "AuditViewer"

### G2: Table shell
- **Job:** the bordered white card with a horizontal scroller around a table.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| masters `Table` (shell + thead) | `apps/admin/screens/masters/chrome.tsx:18` | Admin | 15 (11 files) |
| hand-rolled copies | `DraftListsScreen.tsx:160,246`, `ReviewQueue.tsx:84`, `ReviewScreen.tsx:276`, `InvoicesScreen.tsx:128`, `IntegrationMonitorScreen.tsx:99`, `NotificationsScreen.tsx:66`, `ConflictsScreen.tsx:189`, `AuditViewer.tsx:121`, `flows/ContractPriceRanges.tsx:104` | Admin | 10 |
| web `Panel flush` + scroller | `ListsScreen.tsx:250`, `ListDetailView.tsx:210`, `AccountsScreen.tsx:114,206,303,427` | Web | 6 |
| nested (`radius.ctl`, no bg) | `BillingMonitorScreen.tsx:286` | Admin | 1 |
| (out of scope) `TableShell` | `apps/demo/DemoXero.tsx:874` | Demo | 2 |

- **Differences**
  - Admin flat vs e1 on the mockup table and the Day grid: DRIFT (see fact 3).
  - The mockup also uses `overflow:hidden`. The code needs `overflowX:auto`, which clips the same way.
  - The Review shell dims at authorise: INTENDED (`Admin Review.dc.html:76`, `opacity:{{tableOpacity}}`).
  - The nested `radius.ctl` table: UNSURE, kept as a `nested` variant.
- **Target:** `src/shared/table/TableShell({minWidth?, density?, shot?, testId?, nested?, style?})`, with e1 by
  default. Canonical: masters `Table` + e1. Keep the masters `Table({heads, rightAlign, shot})` signature as a
  wrapper over it.
- **Behaviour contract:** none today. Add `role="region"`, `aria-label` and `tabIndex={0}` on the scroller **only when
  it overflows**, so keyboard users can scroll the 1140 to 1380px tables. Small gain.
- **Migration**
  - Pass these through:
    - `data-shot`: `draft-lists-table`, `draft-lists-history`, `admin-notifications-table`, every masters `shot`.
    - `data-testid`: `review-queue-table-shell`, `review-detail-table-shell`, `invoice-list-table-shell`.
    - `ReviewScreen`'s opacity transition, through `style`.
  - Size S. No seed effect.
- **Upcoming phases:** as G1. Do the masters `heads[]` to column-object rename inside 42.
- **Value:** 10 copies removed; medium visibility only if e1 is adopted.
- **Confidence:** high.
- **Catalogue rows:**
  - admin: "Table / Header / TextAction / EditCell", "ReviewQueue (clickable rows)", "AuditViewer", "ContractPriceRanges"
  - web: "Accounts tables (tfoot totals)"

### G3: Clickable table rows
- **Job:** the mouse clicks the row to open a record, and one real button or link in the row is the keyboard handle.
- **Members** (12 product tables)

| table | file:line | apps | hover | keyboard handle |
|---|---|---|---|---|
| Review queue, Invoices, Anaesthetists, Surgeons, Parties, Contracts, AA fees | `ReviewQueue.tsx:108`, `InvoicesScreen.tsx:156`, `masters/AnaesthetistsView.tsx:40`, `SurgeonsView.tsx:58`, `PartiesView.tsx:74`, `ContractsView.tsx:174`, `AaFeesScreen.tsx:298` | Admin | `.aa-clickable-table-row` | yes |
| Draft Lists | `DraftListsScreen.tsx:180-186` | Admin | inline cursor only | **none for the drawer** |
| Web Lists, Lookback results, Lookback day | `ListsScreen.tsx:149`, `ListsLookback.tsx:137,195` | Web | inline cursor only | date/session button with `aria-label` |
| List detail Bookings | `ListDetailView.tsx:238-243` | Web | inline cursor only | **none** |
| (out of scope) Xero invoices, DemoData slots | `DemoXero.tsx:168`, `DemoData.tsx:355` | Demo | class / none | link / **none** |

- **Differences**
  - Web rows have no hover: DRIFT per DL:244 ("Hover on web rows: neutral/sunken fill").
  - Two guards (`isInteractiveRowTarget` vs `stopPropagation`) for one job: DRIFT.
  - Keyboard gaps, confirmed by reading the full code path:
    - **List detail:** the only row action is `<tr onClick>`. "Capture" is a `span` (`:281`), and `WarningTriangle` is
      `span role="img"`.
    - **Draft Lists:** Assign, Change date and Remove are buttons, but none opens the drawer. The Admin Day rail
      (`DraftListsCard.tsx:52`) reaches the drawer only for the first `RAIL_ROWS = 5`.
    - **DemoData:** the row sets the audit entity to a List or slot id, and the select below offers Bookings only.
  - Today-row tint and quiet rows: INTENDED screen logic, kept as props.
- **Target:** `src/shared/table/ClickableRow({onOpen, tone?, style?, ...data-*})` renders the existing class and
  `isInteractiveRowTarget` (moved to `src/shared/table/`). Add `RowOpenButton({label, onOpen})`, the unstyled text
  button web already hand-rolls 3 times (`ListsScreen.tsx:168`, `ListsLookback.tsx:143,199`). Keep the today tint on
  `td`, because hover paints `td`.
- **Behaviour contract:** row click for the mouse, one real button or link with a full `aria-label` (web's form) as
  the keyboard handle, no focusable rows. This is already chosen in `ui-library-preview/src/rows/recommendations.ts:39,66-69`.
  Gain: List detail and Draft Lists become keyboard-operable.
- **Migration**
  - Pass these data attributes through: `data-list-id`, `data-slot-id`, `data-booking-id`, `data-quiet`,
    `data-shot="out-of-hours-row"`, `data-draft-list-row`, `data-contract`, `data-surgeon`, `data-anaesthetist`.
  - Keep the class: `ClickableTableRows.test.tsx:34` and `DemoXero.test.tsx:37` assert it.
  - Playwright `admin-draft-lists.spec.ts` clicks rows.
  - Size M.
- **Upcoming phases:** 40a and 43a touch `ListDetailView`. Fix the List detail handle now: it is a 1-line a11y fix on a
  scripted screen, so do not wait for the kit. The rest go with G1.
- **Value:** 2 guard mechanisms become 1, plus 2 real a11y fixes; medium visibility (web gains hover).
- **Confidence:** high.
- **Catalogue rows:**
  - admin: "ReviewQueue (clickable rows)"
  - web: "Lists table (Th · Td · GroupRow)", "WebResultsTable", "WebDayTable", "List detail Bookings table"
  - Draft Lists has no row.

### G4: Titled card / panel
- **Job:** a white bordered card grouping content, with an optional heading and action.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| `Panel` | `apps/web/components/Panel.tsx:20` | Web | 20 |
| `ProfileCard` | `apps/admin/components/ProfileChrome.tsx:52` | Admin | **6** (AnaesthetistRecord 2, SurgeonProfile 4) |
| RightRail `Card` + 4 rail cards | `RightRail.tsx:66`; `NotificationsCard.tsx:138`, `WarningsToDo.tsx:45`, `draftLists/DraftListsCard.tsx:34`, `NeedsInvoiceDestinationCard.tsx:28` | Admin | 3 + 4 |
| admin page section cards | `AaFeesScreen.tsx:136,269,499`, `BillingMonitorScreen.tsx:155,262,413`, `IntegrationMonitorScreen.tsx` (x5), `masters/HospitalsView.tsx:61,159`, `ReferenceViews.tsx:173,189`, `ReviewQueue.tsx:152`, `InvoicesScreen.tsx:95` | Admin | about 18 |
| mobile cards at radius 16 | `mobile/screens/BalancesScreen.tsx:93,119,156`, `MoreScreen.tsx:36,55` | Mobile | 5 |
| (presenter chrome) | `pwa/PwaDemoPanel.tsx:48`, `pwa/InstallCoach.tsx:86`, `apps/demo/DemoData.tsx:38`, `DemoControlPanel.tsx:29` | PWA/Demo | about 12 |

  Composite recount (sweep's `scan.py`): 81 in 53 files with the catalogue, **76 in 50 without**. That number also
  covers the 10 table shells (G2), 5 empty cards (F G12), sheet option cards (`shared/flows/*`) and shell menus, so it
  is not the G4 size.
- **Differences**
  - e1 on web panels vs flat admin rail cards: INTENDED (fact 3). Admin section cards are flat:
    INTENDED-by-analogy (rail-like), UNSURE.
  - Literal `14`: bypass. Radius 16 is DRIFT: Mobile App and Mobile Availability use 14 for every card, and 16 never
    appears. `PwaDemoPanel` is "presenter chrome" (`PwaDemoPanel.tsx:43-45`).
  - Headings: rail 14/600 matches `Admin Day.dc.html:100,109`. Admin section cards at 14/700 or 15/700: DRIFT. Web
    17/600 matches `Web Dashboard.dc.html:111`.
  - Web `Panel` title is a `div`, not a heading: DRIFT (a11y).
  - Padding: 20 (web) and 16 (admin rail, mobile) are design. `16px 18px` (ProfileCard) and 14 are DRIFT.
- **Target:** `src/shared/ui/Card({as?, title?, titleLevel?, headingRef?, action?, elevation?: 'flat'|'e1', padding?: 'panel'|'card', flush?, tone?, shot?, style?})`.
  - `panel` = 20 / gap 14 + e1 (web `Panel`). `card` = 16 / gap 10, flat (rail, mobile).
  - The title renders `h2`/`h3` with `aria-labelledby`, following the rail cards. The count pill goes to family B.
- **Behaviour contract:** from `NotificationsCard.tsx:136-140`: `section` + `aria-labelledby` + a heading with a
  `ref`/`tabIndex=-1` for focus return after a tick.
- **Migration**
  - Keep these `data-shot` values: `admin-notifications-rail`, `admin-warnings-todo`, `admin-draft-lists-rail`,
    `admin-needs-invoice-destination`, `tier-card`, `anaesthetist-details`, `surgeon-*`, `billing-*`.
  - Keep `useResolveWithTick` focus return.
  - Panel titles are few ("Invoices", "Leave", "Legend", "Your series"), so turning them into `h2` does not collide
    with the `getByRole('heading', {name: 'Lists'})` checks.
  - Size L, in slices.
- **Upcoming phases**
  - 26 adds a Profile card to `MoreScreen`. It will copy radius 16 unless fixed first.
  - New cards in 27 (PrepaymentPanel), 27a (holding card), 37 (ReconciliationCard rail) and 43a (FirstRunHint).
  - Land `Card` after 25. Fix the mobile radius before 26.
- **Value:** about 30 copies; medium visibility (radius 16, mixed heading weights).
- **Confidence:** high on duplication and the shadow rule.
- **Catalogue rows:**
  - web: "Panel"
  - admin: "ProfileChrome", "NotificationsCard", "WarningsToDo", "MiniCalendar (RightRail)"
  - mobile: "Hero figure card", "EmptyCard", "InstallCoach"

### G5: Eyebrow section card
- **Job:** a detail-screen section, as a card with an 11px caps label, an optional action and a footer.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| `CaptureSection` | `shared/capture/ui.tsx:17` | all 3 | capture suite |
| `BookingDetailBody` `Section` | `shared/booking/BookingDetailBody.tsx:81` | all 3 | 3 |
| `OfficeBillingSetup` card | `shared/booking/OfficeBillingSetup.tsx:56` | Admin | 1 |
| mobile List detail Invoices | `apps/mobile/screens/ListDetailScreen.tsx:~331` | Mobile | 1 |

- **Differences**
  - Gap 10 vs 12: already a `gap` prop. The mockup uses 10, 12 and 14 (`Mobile App.dc.html:190-272`), so INTENDED.
  - Mobile Invoices `14px 16px`: DRIFT.
  - Office card in `accent.tint` with a 700 `accent.pressed` eyebrow: UNSURE. There is no ruling, and DL reserves teal tint
    for "actions & selection". The 700 weight is DRIFT.
- **Target:** extend `CaptureSection` with `action?` and `shotPrefix?` (it hard-codes `capture-`, and
  `BookingDetailBody` needs `booking-`), and re-export it as `SectionCard`.
- **Behaviour contract:** keep `tabIndex=-1`, `data-validation-procedure-id` and `data-validation-fields` (consumed at
  `BookingDetailBody.tsx:~413-428`).
- **Migration:** size S. The `booking-*`, `capture-*` and `office-billing-setup-*` shot slugs must be byte-identical.
- **Upcoming phases:** `BookingDetailBody` is edited by 21 (in flight), 21a, 23, 24, 25, 27, 35, 38b, 39b and 43a.
  `OfficeBillingSetup` is edited by 22. **Fold in; do not run it standalone.**
- **Value:** low.
- **Confidence:** high.
- **Catalogue rows:** mobile "CaptureSection", "BookingDetailBody".

### G6: Eyebrow / micro-cap label
- **Job:** the 11px caps tracked label above a value, a section or a field.
- **Members**
  - `FieldLabel` (`shared/ui/Field.tsx:5`, a `div`): 66 uses in 28 files.
  - Hand-rolled: about 51 `textTransform:'uppercase'` sites in 33 files, plus caps-typed labels with no transform
    (`web/screens/DashboardScreen.tsx:357`, `admin/components/DayGrid.tsx:209`, `DraftListBand.tsx:55`). That is about
    60 in 40 files.
  - Not eyebrows, so excluded: table `Th` (G1), `DemoBadge`, pill styles (`DraftListParts.tsx:43`) and harness chrome.
  - Representative:
    - `admin/components/drawerParts.tsx:13`, `SlotDrawer.tsx:393`, `ReviewScreen.tsx:430` (10.5/700)
    - `InvoicesScreen.tsx:96` (10.5/700), `AuditViewer.tsx:168` (10.5/700), `IntegrationMonitorScreen.tsx:290` (11/700)
    - `shared/booking/HistoryTimeline.tsx:125`, `mobile/components/MobileHeader.tsx:17`
- **Differences**
  - Every mockup eyebrow is 11/600/0.06em: the counts are 14, 10, 10, 8, 3 and 2 per file. There are none at 10 or
    10.5, and the 10px labels in the mockups are calendar weekday cells. So the 10.5/700 and 11/700 variants are DRIFT.
  - Crimson or warning tones: INTENDED (`Mobile App.dc.html` crimson eyebrow; semantic tone).
  - `InvoiceDocument` 10/0.08em: UNSURE (print surface).
  - `type.micro` is read once (`ProcedureStack.tsx:36`).
- **Target:** `src/shared/ui/Eyebrow({as?, tone?: 'mist'|'slate'|'warning'|'brand', id?})` reading `type.micro`.
  `FieldLabel` becomes a re-export.
- **Behaviour contract:** `as="h3"` where it titles a section.
- **Migration:** about 45 sites, style only. Admin eyebrows lighten visibly. Size M.
- **Upcoming phases:** 43a adds `InfoTip` beside section labels ("tips placed across ... section labels"), so land it
  before 43a.
- **Value:** medium.
- **Confidence:** high.
- **Catalogue rows:** admin "FieldLabel / FormError", "Review summary tiles (ReviewScreen)"; mobile "MobileHeader".

### G7: Label-value rows
- **Job:** "Label  value" pairs in drawers, Booking detail and profiles.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| `drawerParts.Row` (label 80) | `apps/admin/components/drawerParts.tsx:19` | Admin | DraftListDrawer |
| `SlotDrawer` `Row` (72) + private `Section`/`DrawerLink`/`ActionBtn` | `SlotDrawer.tsx:390-416` | Admin | 8 |
| `BookingDetailBody` `Row` (96) | `shared/booking/BookingDetailBody.tsx:846` | all 3 | 3 |
| `OfficeBillingSetup` `Row` (84) | `shared/booking/OfficeBillingSetup.tsx:86` | Admin | 4 |
| `ConfirmRow` (96) | `apps/admin/flows/AssignDraftListSheet.tsx:164` | Admin | n |
| stacked `Fact` | `ProfileChrome.tsx:65` | Admin | about 10 |
| right-aligned settings row | `pwa/PwaDemoPanel.tsx:73` | PWA | 14 |

- **Differences**
  - Label widths 72, 80, 84 and 96: DRIFT.
  - Inline vs stacked: INTENDED.
  - The right-aligned row is the same pattern Phase 26 specifies as `ProfileRow` (label, mono value, lock glyph), so it
    is a variant, not out of scope.
- **Target:** `src/shared/ui/DefRow({label, labelWidth?=80, tone?, layout?: 'inline'|'stacked'|'settings', mono?, note?, trailing?})`
  inside a `DefList` (`dl`).
- **Behaviour contract:** `dl`/`dt`/`dd`, following `InvoiceDocument.tsx:331`.
- **Migration:** SlotDrawer (`SlotDrawer.test.tsx` queries by text and role, which is safe). Size S.
- **Upcoming phases**
  - 21 (Payer/Funder rows, in flight, uses the local `Row`), 25 and 38b.
  - **26 builds `ProfileRow` in `src/shared/profile/`.** Land `DefRow` before 26, or tell 26 to build it as `DefRow`.
- **Value:** low visibility, high reuse.
- **Confidence:** high.
- **Catalogue rows:**
  - admin: "drawerParts (Section, Row, DrawerLink, ActionBtn)", "SlotDrawer", "DraftListDrawer", "ProfileChrome"
  - mobile: "BookingDetailBody"

### G8: Page header
- **Job:** an `h1` title, a slate sub-line and right-aligned actions.
- **Members**
  - Web h1 at 28: 7 screens (`ListsScreen`, `AccountsScreen`, `MyAvailabilityCalendar`, `DashboardScreen`,
    `ListDetailView`, `BookingDetailView`, `AvailabilityGrid`) + `apps/demo/DemoSurface.tsx`.
  - Admin h1 at 24: **12** (adds `NotificationsScreen.tsx:49`), including `ProfileChrome.tsx:32` and `DayNav.tsx:28`.
  - Outliers: `AdminBookingDetail.tsx:64` at 26, and `masters/MasterData.tsx:47` at 20.
  - masters `Header` (`masters/chrome.tsx:6`): 16 sites. `MobileHeader` is separate.
- **Differences**
  - 28 vs 24: INTENDED (`Web Dashboard.dc.html` vs `Admin Day.dc.html` / `Admin Review.dc.html`).
  - 26 on AdminBookingDetail: DRIFT.
  - `MobileHeader`: INTENDED.
- **Target:** `src/shared/ui/PageHeader({title, sub?, actions?, size: 'web'|'admin'|'section', level?, count?})`.
- **Migration:** 20 sites, style only. Size S.
- **Upcoming phases:** **42 creates `MasterHeader`** (title, subtitle, count, teal Add) for every master view. Build
  `PageHeader` first and make `MasterHeader` a wrapper. Leave the 16 masters `Header` sites to 42.
- **Value:** low.
- **Confidence:** high.
- **Catalogue rows:** admin "Table / Header / TextAction / EditCell", "ProfileChrome", "DayNav (with SortToggle)"; mobile "MobileHeader".

### G9: Stat tile
- **Job:** a summary figure tile.
- **Members:** `StatTile` (`apps/web/screens/DashboardScreen.tsx:354`, 4 uses) and `Tile`
  (`apps/admin/screens/ReviewScreen.tsx:427`, 4 uses). `MoneyStat` (DemoXero) is out of scope.
- **Differences**
  - `StatTile` matches `Web Dashboard.dc.html:116-119` exactly: `bg`, radius 10 (= `radius.ctl`), `12px 14px`, 11/600
    caps-typed, mono 24/700.
  - `Tile` matches `Admin Review.dc.html:68-71` (white, `line`, radius 12, mono 22/700) except two DRIFTs: label
    10.5/700 caps (the mockup has 11/600) and padding `12px 14px` (the mockup has `14px 16px`).
  - Radius 10 vs 12: INTENDED.
- **Target:** `src/shared/ui/StatTile({variant: 'quiet'|'outlined', label, value, sub?, pill?, tone?})`. Both looks
  stay as they are, and the label goes through `Eyebrow`. Radius 12 needs a token (H proposes `radius.md`).
- **Migration:** 8 call sites, size S.
- **Upcoming phases:** 21a restructures Review. **40** ("three balance tiles, Admin Review anatomy") and **42** ("four
  summary tiles, Admin Review four-tile row") both need the outlined tile, so land it before 40 and 42.
- **Value:** medium (prevents two more copies).
- **Confidence:** high.
- **Catalogue rows:** web "StatTile"; admin "Review summary tiles (ReviewScreen)".

---

## Phase 42 (`MasterViewChrome`): before vs inside

- **Land before 42** (consolidation slot after 25):
  - The `src/shared/table/` kit (G1 to G3).
  - Re-point the **internals** of masters `Table` and `tableStyles.ts` onto it, with zero call-site change: every
    master view gets the unified header and shell at once.
  - `PageHeader`, `StatTile` outlined, `Card` and `Eyebrow`.
  - 42's doc already says "do not invent new chrome", and it points at Admin Review for "the Admin table, header ...
    four-tile summary row", so it will consume these.
- **Inside 42:**
  - `MasterHeader` as a wrapper over `PageHeader`, replacing the 16 masters `Header` sites.
  - The masters `Table` API rename (`heads[]` to columns).
  - `GroupRow` for Contracts and RVG.
  - `ClickableRow` on Anaesthetists, Surgeons, Parties and Contracts.
  - The masters empty cards (`ContractsView.tsx:142`, `RvgGroupsView.tsx:126`, `ModifiersView.tsx:72`) to F G12's `EmptyState`.
  - `ShowRetiredToggle`, `RetireSection` and `LoadResultBanner` on shared primitives.
  - `masterViews.ts` `catalogueRows` must use the post-rename catalogue row names.

## Demo-only screens: my view
DemoXero, DemoData, DemoControlPanel, PwaDemoPanel and InstallCoach should be **out of scope** for migration and left
out of the duplication counts.
- Convention 13 (PROGRESS.md:68) makes them distinct by a `DemoBadge`, not by a different visual language. So they
  are not deliberately different; they just are not product UI.
- `PwaDemoPanel.tsx:43-45` says "None of it is proposed product UI".
- Migrating them buys no demo value and puts `DemoXero.test.tsx:56-61` at risk (6 `columnheader`s, an inner
  `minWidth: 0`, the class).
- Adopt the kit opportunistically: Phase 43 adds a Timings table and a Privacy checks panel to DemoData, and 41 adds
  Xero refund rows. Those should use it.

## Dropped or rejected
- **G10 Empty states:** owned by F G12 (cross-reference only). G1's `EmptyRow` is F's `variant="row"`.
- The sweep's rejections stand: mobile booking card vs `ListRow`, `ListInvoices`, `MasterPanel`, `InvoiceDocument`,
  dividers, toolbars and the SideNav `ADMIN` eyebrow.

## Intended differences to keep
- Page title 28 (web) vs 24 (admin): `Web Dashboard.dc.html`, `Admin Day.dc.html`, `Admin Review.dc.html`.
- e1 on the main data surface (Day grid, Review table, web panels) and flat rail cards and tiles: `Admin Day.dc.html:54,90-108`,
  `Admin Review.dc.html:68-76`, `Web Dashboard.dc.html:49,95`.
- Quiet `bg` stat tile (radius 10) on web vs outlined tile (radius 12) on admin: the same two mockups.
- One desktop table row height (40px) and admin day-grid rows at 32px: `Design Language.dc.html:223`.
- Row click plus one real handle, no focusable rows: `ui-library-preview/src/rows/recommendations.ts:39,66-69`.
- `CaptureSection` gap 10 to 14 per card: `Mobile App.dc.html:190-272`.
- Review table dims at authorise: `Admin Review.dc.html:76`.
- `MobileHeader` large title; inline drawer rows vs stacked profile facts.

## Questions for the user
1. Should admin tables take the Admin Review mockup header (11/600 mist on `bg`, `line` rule, `sunken` row dividers)
   while keeping their tighter padding as a `compact` density? **Recommend: yes.**
2. Should admin table shells get e1 like the Review mockup table and the Day grid, with rail cards and tiles staying
   flat? **Recommend: yes.**
3. Should the mobile radius-16 cards (Balances, More, PWA panels) go to 14 before Phase 26 adds a More card?
   **Recommend: yes, all of them.**
4. Should the demo simulators (DemoXero, DemoData, Control Panel, PWA panel) be left out of the consolidation?
   **Recommend: yes, but adopt the kit when 41 or 43 touch them.**
5. The Office billing setup card uses teal tint, which DL reserves for actions and selection. Keep it or make it
   neutral? **Recommend: decide in Phase 22, which reworks the card; fix the 700 eyebrow weight now.**
6. Should the table, card, eyebrow and tile kit land in one owner-added phase after 25 and before the parallel tracks,
   with `DefRow` before 26? **Recommend: yes.** 21 is in flight, and 21a to 25 rewrite Review, Invoices and Booking detail.

## Bugs found
- **Web List detail Bookings table has no keyboard route to open a Booking** (`apps/web/screens/ListDetailView.tsx:238-284`).
  The row `onClick` is the only handle: "Capture" is a `span`, and `WarningTriangle` is `span role="img"`.
  Sure: high. This is on a scripted demo screen.
- **Draft Lists screen has no keyboard route to the Draft List drawer** (`apps/admin/screens/DraftListsScreen.tsx:180-186`).
  The row's three buttons open other sheets. The Admin Day rail reaches the drawer for only 5 rows. Sure: high.
- **DemoData "Today's sessions" rows have no keyboard route** to show a List or slot audit (`apps/demo/DemoData.tsx:355-358`).
  The select at `:467` lists Bookings only. Sure: high. Demo-only, low priority.
- Minor a11y:
  - The web `Panel` title is a `div`, not a heading (`apps/web/components/Panel.tsx:44`).
  - Admin group rows use `td`, not `th scope="colgroup"` (`masters/ContractsView.tsx:164`, `masters/RvgGroupsView.tsx`).
  - Sure: high.
