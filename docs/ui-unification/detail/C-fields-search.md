> Detail file for `docs/ui-unification/README.md` (audit of 12 November 2026): fields, search, selects, pickers, checkboxes.
> Group numbers here (G1, N1 ...) are local to this file; the README's U-numbers point to them. Paths are relative to `aa-prototype/src/` unless they start with `docs/`.

# V-C · Verified: form fields, labels, errors, hints, search, selects, steppers, type-aheads

Verification of `C-fields-search.md` against the code on 2026-11-12. Paths are relative to
`aa-prototype/src/` unless they start with `docs/`, `visual/` or `requirements-board/`. Counts are mine, re-run with
`grep` over `apps shared shell pwa`, excluding `apps/demo/catalogue` and `*.test.*`.

## Verification summary

| group | verdict | what I corrected |
|---|---|---|
| G1 Search input | CONFIRMED WITH CORRECTIONS | Canonical fill reversed: the mockup's search field is grey (`neutral.bg`) on a white sheet, and the Phase 05 code picker was grey until Phase 19 moved it onto 32a's white NameSearchBox. The mobile Lists search is grey on the page canvas (wrong under either rule). Renaming the web clear to "Clear search" definitely breaks `ListsScreen.test.tsx:69` (two buttons with that name). Capture recipes `fill` `[data-testid=mobile-lists-search]`, so a `testId` passthrough is required, not optional. Web pill 38 matches its Go to date neighbour (38), so 36 vs 38 is UNSURE, not DRIFT. |
| G2 Error box | CONFIRMED WITH CORRECTIONS | Reconciled count: 24 boxes (20 exact copies + 4 near copies), 17 without `role="alert"`; plus 4 inline refusal lines. C's 29 counted a validation caption (IntegrationMonitor:325) as a refusal; F's "21, 15 without role" omitted 3 near copies and mis-added its own list (it names 16). 4 members are deleted or demoted by phases 22, 24, 34, 39b. The `getByRole('alert')` risk is low: no unscoped query runs on a screen that holds a copy. |
| G3 Select field | CONFIRMED WITH CORRECTIONS | 35 product selects (41 with demo), not 37; `selectControlStyle` imported by 14 files, not 17. 44px is DRIFT (Phase 28; it sits in the same flex row as 48px Segmented controls, so tops are 4px off). Two members are removed by Phase 21 and one by 22. Capture recipes pin `data-shot` ON the `<select>` itself, a literal `aria-label="Hospital"`, accessible names "Hospital" / "Surgeon", and positional `select >> nth=N`. Phase 37 reuses AuditViewer's ~30px filter look and Phase 42 rebuilds every masters toolbar. |
| G4 Text/amount inputs | CONFIRMED WITH CORRECTIONS | FunderAllocation amount goes in Phase 22; Integration monitor is demoted in 34 (skip). "No label at all" is overstated: placeholders give a fallback name. TextField also needs `type="time"` (Phase 35 asks for a time input "styled with the Field primitives") and `number`. |
| G5 Number stepper | CONFIRMED WITH CORRECTIONS | The mockup draws glyph text "−/+", 44x44, radius 12 (`docs/design/Mobile App.dc.html`), so StepperButton is the design and the radius 12 is INTENDED. BookingDetailBody's icon stepper is the drift. Q4 is settled by the mockup and is dropped. Phase 23 removes UnitsCard steppers on additional Procedures; 39b adds a minutes stepper. |
| G6 Chip multi-select | CONFIRMED | Nothing material. |
| G7 Contract chooser parts | CONFIRMED WITH CORRECTIONS | The inline matcher gives the same results today (same four fields, same squash), so it is duplication risk, not a bug. `aa-rail-focus` (10 uses) has no CSS rule, but every element sits inside `.aa-rail-scope` (the popover is not portalled), so focus works, except the combo search input, whose inline `outline: none` beats the scope rule. E-G7 wrongly names `.aa-rail-focus` as the focus mechanism. Phase 21 adds a "Suggested" pill to rail options, in both copies. |
| G8 Radio groups | CONFIRMED | Added a demo member (PwaDemoActions radiogroup, no arrow keys). |
| G9 Type-ahead lists | CONFIRMED WITH CORRECTIONS | Playwright pins two empty lines by text; rewording breaks `rvg-groups-phase19.spec.ts:67` and `booking-moves-phase32a.spec.ts:55`. Style unification is safe; wording is a question. |
| G10 Checkbox and switch | CONFIRMED WITH CORRECTIONS | No global `accent-color` rule exists, so the 4 blue checkboxes are real. Phase 21 (tick), 27 (toggle) and 42 (Show retired toggle) need these, so build them before 21. Switch is shared with E-G7: build one Switch, not two. |
| G11 Focus treatment | CONFIRMED | Canonical is the DL's own token ("focus ring `0 0 0 3px rgba(13,110,99,0.30)`"), which NameSearchBox already uses. |
| G12 Textarea | CONFIRMED WITH CORRECTIONS | "Unnamed" becomes "named only by placeholder". BookingDetailBody's notes textarea is the mockup's notes card exactly, so its chrome is canonical. |
| G13 Hint line | CONFIRMED | `Helper` has 8 uses. |

---

### G1 · Search input
- **Job:** a text box with a magnifier that narrows a list as you type, with a clear (X) button.
- **Members**

| name | file:line | apps | call sites |
|---|---|---|---|
| `NameSearchBox` field (48, white, teal border + focusRing, Escape clears, refocus) | `shared/ui/NameSearchBox.tsx:29` | Admin, Web, Mobile sheets | 9 |
| `NameSearchBox` pill (36) | same | Web `AvailabilityGrid.tsx:153` | 1 |
| `WebSearchField` (38 pill, white, `.aa-search-field` outline, no Escape) | `apps/web/screens/ListsLookback.tsx:28` | Web | 1 (`ListsScreen.tsx:203`) |
| `LookbackSearchRow` input (48, grey `neutral.bg`, 44 clear, no Escape) | `apps/mobile/screens/ListsLookback.tsx:28` | Mobile | 1 (`ForwardListsScreen.tsx:288`) |
| ContractCombo header input (borderless, no focus ring) | `shared/booking/BillingCard.tsx:533` | Admin, Web | 1 (see G7) |

- **Differences**
  - Fill. DRIFT, and the sweep had the canonical backwards. Every field in the mockups is a grey `#F6F8F7` well on
    a white surface: the code picker's search on a white sheet (`docs/design/Mobile App.dc.html:290-293`) and both notes
    textareas in white cards and sheets (`Mobile App.dc.html:272-274`, `Mobile Availability.dc.html:106`). No mockup
    has a field on the page background. Phase 05's `CodePickerSheet` was grey (`git show 7bd4f023`); 32a made
    NameSearchBox white (`780b172a`) and Phase 19 moved the code picker onto it. On page backgrounds the code already
    tends to white: Conflicts deliberately overrides its selects to `neutral.surface` (`ConflictsScreen.tsx:42`), and
    the web Lists search is white. The mobile Lists search is grey on the page canvas, where it disappears.
  - Heights: 36 pill vs 38 web pill. UNSURE: 38 matches `WebGoToDate` (38) beside it on the same row.
    Field 48 vs pill: INTENDED (`NameSearchBox.tsx:13`).
  - Clear button 32 sunken / 30 bare / 44 bare. Mobile 44 is INTENDED (convention 16; `ListsLookback.tsx:7`
    "nothing under 44px tall"). The fill difference is DRIFT. NameSearchBox's 32px clear inside mobile sheets is UNSURE.
  - Escape-to-clear and refocus-on-clear exist only in NameSearchBox: DRIFT. The focus ring (box-shadow vs outline):
    DRIFT. Clear label "Clear search" vs "Clear the search field": DRIFT, but see Migration.
- **Target:** `NameSearchBox` (optional rename to `SearchBox`), `shared/ui/`. Add `fill?: 'well' | 'surface'`
  (well = `neutral.bg`, for white sheets, cards and drawers; surface = white, for page toolbars), `testId?`,
  `clearLabel?`, `touch?` (44 clear on the phone). Keep `size`, `width`, `shot` (on the wrapper, as today). Tokens:
  `neutral.bg/surface/line`, `accent.base`, `accent.focusRing`, `radius.ctl/pill`. Canonical: NameSearchBox's
  behaviour and focus, with the mockup's well fill in sheets.
- **Behaviour contract:** `role=searchbox` with a name; Escape clears and stops propagation; the clear button is
  named and returns focus; autocorrect off. Gain: Escape and refocus on both Lists screens, one focus ring.
- **Migration:** 2 call sites, plus a fill prop on 10. Risks: recipes `US-07.4.1.json:75` and `US-03.1.7.json:28`
  `fill` `[data-testid=mobile-lists-search]`, and ATLAS documents `web-lists-search`, so keep both test ids.
  `ListsScreen.test.tsx:69` clicks `getByRole('button', {name: 'Clear search'})`, which is the results panel's own
  "Clear search" button (`ListsScreen.tsx:229`). If the X is renamed "Clear search" while text is present, the query
  matches two buttons and throws, so keep the web X label or scope the test. Keep the `aria-label` "Search your
  Bookings" (`ForwardListsScreen.test.tsx:132`, `visual/lookback.spec.ts`). No seed or PERSIST_VERSION effect. Size S.
- **Upcoming phases:** 43a sweeps `ForwardListsScreen` and the web dashboard; 33 and 40 add search fields on Admin
  pages. Land this standalone, before 21.
- **Value:** about 70 lines. High visibility: the Lists page search is the most-shown anaesthetist screen.
- **Confidence:** high on behaviour; the fill rule is the user's call (Q1), but the mockups support "well in white containers".
- **Catalogue rows:** admin `NameSearchBox`, `CodePickerSheet`, `AnaesthetistCandidates`, `DraftListCandidates`;
  web `WebSearchField`, `NameSearchBox`, `CodePickerSheet`; mobile `LookbackSearchRow`.

### G2 · Error box (FormError and its hand copies); owns F-G7
- **Job:** show a store refusal or a validation message, in plain words, inside a sheet or form.
- **Members** (reconciled count: 24 boxes, 17 without a role; plus 4 inline lines)

| kind | count | role=alert | representative paths |
|---|---|---|---|
| `FormError` | 46 uses | yes | `shared/ui/Field.tsx:59` |
| exact copy (ctl, 10px 12px, 13) | 16 | no | `admin/screens/ReviewScreen.tsx:272`, `admin/screens/BillingMonitorScreen.tsx:179`, `admin/flows/AddAnaesthetistFlow.tsx:94`, `shared/flows/ManualBookingForm.tsx:328`, `shared/flows/CancelBookingSheet.tsx:48`, `shared/flows/EditPatientSheet.tsx:63` (and 10 more, listed in C and F) |
| exact copy | 4 | yes | `admin/components/SlotDrawer.tsx:353`, `admin/flows/EditAnaesthetistSheet.tsx:108`, `shared/flows/MoveListSheet.tsx:258`, `shared/flows/MoveBookingToColleagueSheet.tsx:249` |
| near copy | 4 | 3 yes, 1 no | `shared/flows/ContractRail.tsx:327` (13.5), `shared/booking/BillingCard.tsx:310` (8/12, 13.5), `admin/screens/AaFeesScreen.tsx:570` (8/12, 12.5), `admin/screens/InvoiceDocument.tsx:304` (9/10, 12.5, no role) |
| inline refusal line | 4 | 3 yes | `admin/screens/IntegrationMonitorScreen.tsx:406` (no role), `shared/flows/AlertOfficeSheet.tsx:188`, `shared/warnings/WarningsPanel.tsx:156`, `admin/components/WarningsToDo.tsx:123` (slate text) |

- **Count reconciliation:** C's 29 = 24 boxes + 5 lines, but `IntegrationMonitorScreen.tsx:325` is a live NHI
  verdict caption, not a refusal, so the correct figure is 28. F's 21 = 20 exact copies + ContractRail; F lists 16
  role-less names but says 15 (an arithmetic slip), and it treats BillingCard, AaFees and InvoiceDocument as
  "variants" rather than copies. The correct figure is 17 without a role.
- **Differences:** the missing role is DRIFT and an a11y defect (the refusal is silent to a screen reader). The
  padding and size variants are DRIFT. Inline lines next to compact row controls are plausibly INTENDED (Q6).
  WarningsToDo's slate text is DRIFT. `FailureNotes` (`shared/capture/ui.tsx:143`, plus the `BillingLinesCard.tsx:134`
  copy) is a different job: live rule captions. The three `BookingDetailBody.tsx:539/555/560` panels (radius card)
  are page notices for F-G8 `Notice`; they are not members here.
- **Target:** existing `FormError` (`shared/ui/Field.tsx`). Add `variant?: 'box' | 'inline'` (inline = 12px
  `error.onTint`, still `role="alert"`) and `shot?`. Canonical: the current box.
- **Behaviour contract:** `role="alert"`, and nothing rendered for null (the alert node mounts with its text, so it
  announces). Gain: 17 refusals become audible.
- **Migration:** 20 to 24 mechanical swaps. Skip the members about to go: FunderAllocationSheet (deleted in 22),
  PriceOverrideSheet (becomes PricingSheet in 24), AddBillingLineSheet (removed in 39b), and the Integration monitor
  (demoted to Future scope in 34). Tests: every unscoped `getByRole('alert')` (`AaFeesScreen.test.tsx:65`,
  `specialtiesTags.test.tsx:63/98`, `mastersPages.test.tsx:118-244`, `pairingPickers.test.tsx:102`,
  `visual/admin-phase18a.spec.ts:32/70`) runs on a screen with no copy, so no new collisions. Recipes use only scoped
  `[data-shot=contract-detail] [role=alert]` and `surgeon-edit-sheet >> role=alert`. No `data-shot` sits on any copy.
  No seed effect. Size S.
- **Upcoming phases:** almost every new sheet (21, 22, 24, 35, 38b, 39, 39b, 41) adds a refusal. Do it before 21.
- **Value:** 20 duplicates gone. Low visual change; real a11y gain. Medium.
- **Confidence:** high (I opened every hit of `error.tint`).
- **Catalogue rows:** admin `FieldLabel / FormError`; mobile `FormError`.

### G3 · Labelled select field (the missing `SelectField`)
- **Job:** a labelled native `<select>` in a form or a filter bar.
- **Members:** 35 product `<select>` (plus 6 demo: `DemoData.tsx` x5, `DemoActionsMenu.tsx:168`).

| style | where | height / fill / font |
|---|---|---|
| `selectControlStyle` | `apps/admin/flows/fieldChrome.ts:12`; 14 importing files (ContractEditSheet, PartyPanel, RecurringBookingSheet, HolidaySheet, SurgeonEditSheet, PairingAddSheet, ChipMultiSelect, ContractsView, RvgGroupsView, FundingTagsView, HospitalsView, ConflictsScreen, ContractPriceRanges, BillingMonitorScreen) | 48 / bg / 15 |
| local copies | `apps/admin/flows/EditListSheet.tsx:19`, `shared/flows/EditBillingSetupSheet.tsx:16`, inline `shared/flows/ManualBookingForm.tsx:311` | 48 / bg / 15 |
| `assignSelectStyle` | `apps/admin/flows/AssignListFields.tsx:36` (Assign, DraftList, Finder, Redate, SessionTimes, ScheduleSettings) | 44 / bg / 14 |
| inline | `shared/flows/FunderAllocationSheet.tsx:147` | 44 / bg / 14 |
| toolbar | `ConflictsScreen.tsx:42` (36 / surface / 13), `HospitalsView.tsx:161` (36 / bg / 13.5), `AuditViewer.tsx:17` (~30 / surface / 13 / lineStrong), `IntegrationMonitorScreen.tsx:298` (~28) | |
| caller-styled | `shared/contracts/ContractSelect.tsx:58`, `apps/admin/components/pairing/SurgeonPicker.tsx:47` | |

- **Differences**
  - 44 vs 48 in admin sheets: DRIFT. No Decisions-log entry; it arrived with Phase 28 (`b9840cb9`, 2026-10-09). In
    `DraftListSheet.tsx:132-137` and `AvailabilityFinderSheet.tsx:76-83`, a 44px date or select shares an
    `alignItems: flex-end` row with a `Segmented` that is 48px (40 + 2x4 padding), so their tops are 4px apart. The
    same sheet's TextField is 48.
  - Toolbar filters: 36 white (Conflicts), 48 grey (masters), ~30 white (AuditViewer). DRIFT. The grey 48 selects on
    the page background sit beside a white NameSearchBox in ContractsView and RvgGroupsView.
  - Unnamed selects: `FunderAllocationSheet.tsx:146` and ContractEditSheet's private `SurgeonPicker` (`:492`) put the
    FieldLabel in a `<div>`. DRIFT, a11y.
- **Target:** `SelectField` in `shared/ui/Field.tsx` (shared, so `shared/` stops copying admin's chrome; pwaPurity
  safe). API: `{ label, value, onChange, children, hint?, disabled?, size?: 'field' | 'compact', fill?: 'well' |
  'surface', hideLabel?, shot?, labelShot? }`. Rules: `shot` lands on the `<select>` itself; `labelShot` lands on
  the wrapper (ContractSelect's `contract-holder-filter` style); `hideLabel` emits a literal `aria-label`. Move
  `controlStyle` / `selectControlStyle` into `shared/ui` and re-export it from fieldChrome. Canonical: 48 / 15
  (TextField); compact for toolbars (Q2).
- **Behaviour contract:** a `<label>` ties the visible label; the hint uses `aria-describedby`. Gain: two unnamed
  selects get a name.
- **Migration:** about 30 selects in about 20 files. Keep it a native `<select>`: the 58 capture `select` steps call
  `selectOption` (`requirements-board/scripts/capture.ts:329`, `.first()` match). The pinned forms:
  `[data-shot=assign-hospital]`, `select[data-shot=surgeon-picker]`, `[data-shot=finder-surgeon]`,
  `[data-shot=draft-list-hospital|surgeon]` (all on the select element); `[aria-label="Hospital"]`
  (HospitalsView, `US-01.5.1.json:63`); `role=combobox[name="Hospital"|"Surgeon"]` (`US-04.3.4.json:80,84`), so the
  label text stays; positional `[data-shot="recurring-booking-sheet"] select >> nth=0..3` and
  `[data-shot=admin-assign-list] select >> nth=1`, so select order stays. Skip ManualBookingForm's payer select and
  EditBillingSetupSheet's guardian select (Phase 21 removes both) and FunderAllocation (22). 44 to 48 reflows the
  Assign, Draft List and Finder sheets slightly. Size M.
- **Upcoming phases:** 21 (party select), 36 and 37 (filter bars; 37 says it reuses "AuditViewer's `Filter`
  pattern", so settle the compact look first), 38 (month select), 42 (rebuilds every masters toolbar). Land before 21.
- **Value:** about 35 wrapper blocks and 5 style copies. Medium visibility.
- **Confidence:** high on the duplication; the toolbar size is Q2.
- **Catalogue rows:** admin `ContractSelect (fieldChrome select)`, `SurgeonPicker`, `AuditViewer`,
  `SessionTimesFields`, `ContractPanel (ContractEditSheet)`.

### G4 · Text and amount inputs outside TextField
- **Job:** a single-line text, number or amount input with field chrome.
- **Members:** `TextField` (88 uses). Bypasses: `AaFeesScreen.tsx:485` (40/bg, decimal, right-aligned),
  `ContractPriceRanges.tsx:24` (36, in-table), `ContractRail.tsx:611` and `BillingCard.tsx:244` (amount, G7),
  `ScheduleSettingsView.tsx:141` (number, 44), `RvgGroupsView.tsx:225` (datalist, 48), `ProcedureCodeCard.tsx:228`
  (stepper typed edit), `IntegrationMonitorScreen.tsx` (5 inputs), `FunderAllocationSheet.tsx:161`.
- **Differences:** heights 36/40/44/48 and fills for the same job in sheets: DRIFT. In-table compact
  (ContractPriceRanges) is INTENDED desktop density. The Integration monitor inputs are named only by placeholder
  (HTML-AAM uses that as a fallback name): weak, not absent.
- **Target:** extend `TextField`: `type` adds `'number' | 'time'`, plus `inputMode?`, `align?: 'right'`,
  `invalid?` (sets `aria-invalid` and the error border), `list?`, `size?: 'field' | 'compact'`, `hideLabel?`,
  `width?`, `shot?`, `fill?`. Canonical: TextField's chrome.
- **Behaviour contract:** label tied; `aria-invalid`; hint via `aria-describedby`; `inputMode="decimal"` for money.
- **Migration:** about 6 inputs in 4 files (skip FunderAllocation, deleted in 22, and IntegrationMonitor, demoted in
  34). Risks: `AaFeesScreen.test.tsx` label queries; `data-shot="contract-rail-amount"` (G7). Size S.
- **Upcoming phases:** 21 (approval number, postal address group), 24 (PriceCard amount: build `inputMode` first),
  35 (`type="time"` "styled with the Field primitives"), 40 and 40a (NHI with as-typed validation: `invalid` + hint),
  42 (threshold field). Land before 21.
- **Value:** medium; it mostly enables the next phases.
- **Confidence:** medium.
- **Catalogue rows:** admin `TextField`, `Native date input (TextField type=date)`, `RVG anatomy datalist`,
  `ContractPriceRanges`; web `OverrideCard`; mobile `TextField`.

### G5 · Number stepper
- **Job:** nudge a whole number with 44px − / + buttons, with the value between them.
- **Members:** `StepperButton` `shared/capture/ui.tsx:70` (6 uses: `UnitsCard.tsx:190/194`,
  `ProcedureCodeCard.tsx:226/283`, `ModifierPickerSheet.tsx:300/304`); private `Stepper` in
  `shared/booking/BookingDetailBody.tsx:855` (2 uses, Lucide icons, admin time nudge); `NudgeButton` (TimesCard).
- **Differences:** the mockup draws exactly StepperButton (44x44, radius 12, white, line border, glyph 20/600,
  `docs/design/Mobile App.dc.html`), so the glyphs and radius 12 are INTENDED. BookingDetailBody's icons are DRIFT.
  The UnitsCard and ProcedureCodeCard buttons have no `label`, so they are named "−" and "+": a11y DRIFT. The value
  width and size (36/20 vs 32/18) are minor DRIFT.
- **Target:** `NumberStepper` in `shared/capture/ui.tsx`: `{ value, onChange, min?, max?, label, typeable? }`.
  Buttons are named "Fewer {label}" / "More {label}", the value is `aria-live="polite"`, with ProcedureCodeCard's
  typed edit as an option. Add a radius token for 12 (or keep the literal, citing the mockup).
- **Behaviour contract:** ModifierPickerSheet's (named, live, disabled at bounds), plus ProcedureCodeCard's typed
  edit (Enter saves, Escape cancels).
- **Migration:** 3 rows + 2 buttons. Risks: `data-shot` `rvg-range-units`, `modifier-units`; `UnitsCard.test.tsx`
  queries. Size S.
- **Upcoming phases:** 23 removes UnitsCard B/M steppers on additional Procedures (fold in); 35 keeps the admin time
  steppers; 39b adds a minutes stepper (needs this component); 43a sweeps `capture/ui.tsx`.
- **Value:** small code saving; real a11y gain. Medium.
- **Confidence:** high.
- **Catalogue rows:** mobile `StepperButton`, `NudgeButton`, `TimesCard`; web `UnitsCard`, `ProcedureCodeCard`,
  `TimesCard`.

### G6 · Multi-select with removable chips
- **Job:** pick several items; the chosen ones show as chips with an X.
- **Members:** `ChipMultiSelect` `apps/admin/components/ChipMultiSelect.tsx:20` (2 uses); private `SurgeonPicker`
  in `apps/admin/flows/ContractEditSheet.tsx:480` (1 use, "Linked surgeons").
- **Differences:** the private one has an unnamed select, no hint, no refocus after remove, and chips below rather
  than above. DRIFT (ChipMultiSelect's comment says it copies this anatomy). Name collision with
  `components/pairing/SurgeonPicker.tsx`.
- **Target:** existing ChipMultiSelect.
- **Behaviour contract:** ChipMultiSelect's (label `htmlFor`, hint, `role=list` chips, named removes, refocus).
- **Migration:** 1 site. Recipe `US-04.1.1.json:49` selects `[data-shot=contract-links] select` (the first select,
  the holder), so keep linked surgeons after it in DOM order. Size S.
- **Upcoming phases:** 24 touches ContractEditSheet; 17a adds an ordered rooms multi-select (extend this component).
- **Value:** small; free. **Confidence:** high.
- **Catalogue rows:** admin `ChipMultiSelect`, `ContractPanel (ContractEditSheet)`.

### G7 · Contract chooser parts built twice (ContractRail vs BillingCard); cross-ref E-G7, E-G8
- **Job:** the step rail's answer options, the Contract search, and "Other price" with a typed amount.
- **Members**

| piece | `shared/flows/ContractRail.tsx` | `shared/booking/BillingCard.tsx` |
|---|---|---|
| answers | `OptionList` :450, named radiogroup | `ChoiceTiles` :400, radiogroup with no `aria-label` |
| search + list | NameSearchBox :233 + `role=radiogroup` rows | `ContractCombo` :446, own borderless input + `role=listbox`, own matcher :483 |
| Other price | `OtherPriceToggle` :569 (44px amount, `aria-invalid`, hint) | inline :221 (40px, no `aria-invalid`, no hint), same `data-shot`s |

- **Differences:** the two layouts (inline desktop vs sheet) are INTENDED (PROGRESS.md:368, Phase 20 (7)). The
  duplicated sub-parts are DRIFT. Matcher: BillingCard re-implements `contractMatchesQuery`
  (`domain/billing/contracts.ts:389`) with the same fields and the same whitespace squash, so results are identical
  today: a divergence risk, not a bug. Focus: `className="aa-rail-focus"` on 10 elements has no CSS rule, but every
  one sits inside `.aa-rail-scope` (`global.css:796`; the popover is not portalled), so the scope rule gives them a
  2px teal outline. The exception is the combo's search input: its inline `outline: 'none'` beats the stylesheet, so
  it shows no focus. The scope rule uses the literal `#0d6e63`, not `var(--color-accent)`.
- **Target:** a `shared/contracts/railParts.tsx` with `OtherPriceCard` (built on E's `Switch` and G4's
  `TextField` amount with `invalid`), `RailOptionGroup` `{ layout: 'list' | 'tiles' }` with a required label, and
  ContractCombo filtering through `contractMatchesQuery`. Delete `aa-rail-focus`; drop the inline `outline: none`.
  Canonical: ContractRail's parts (44 amount, hint, `aria-invalid`).
- **Behaviour contract:** named radiogroups, `aria-invalid` + hint, roving arrows (G8).
- **Migration:** BillingCard only. Keep `contract-combo`, `contract-combo-list`, `contract-rail-amount`,
  `contract-rail-other-price`, `contract-picker`, `data-rail-option`, `data-contract-id`. "Other price" is narrated
  as a toggle (demo guide 04 line 21; label unchanged). Size M.
- **Upcoming phases:** 21 adds a "Suggested" pill (`rail-suggested`) to rail options, which today would be built
  twice: consolidate before 21, or as 21's first item. 24 reworks price-after-Contract.
- **Value:** about 120 lines. Medium visibility (Phase 20 showcase).
- **Confidence:** high.
- **Catalogue rows:** none (no row shows ContractRail or BillingCard).

### G8 · Single-choice groups (radio keyboard)
- **Job:** pick one of a few visible options.
- **Members:** `StatusRadioGroup` `shared/flows/VacatedSessionChoice.tsx:87` (roving tabindex and arrows: the only
  correct one); `ContractRail.tsx:234` and `:457`; `BillingCard.tsx:402`; `pwa/PwaDemoActions.tsx:109` (demo);
  native radios in `PairingAddSheet`.
- **Differences:** visuals differ by job: INTENDED. Keyboard (every option tabbable, no arrows): DRIFT.
- **Target:** a `useRovingRadio` hook in `shared/ui/`. No visual change.
- **Behaviour contract:** StatusRadioGroup's. Gain: one Tab stop instead of up to 50 Contract rows.
- **Migration:** 3 groups (4 with the demo). Recipes click `[role=radio]` in the PWA demo sheet (unaffected). Size S.
- **Upcoming phases:** 21 (rail), 33 (radio cards). **Value:** medium a11y. **Confidence:** high.
- **Catalogue rows:** admin `VacatedSessionChoice / StatusRadioGroup`.

### G9 · Type-ahead list sheets: count line and empty line
- **Job:** the live "N matches" line and the empty-result line under a search box.
- **Members:** CodePickerSheet:49 and ModifierPickerSheet:129 (live count lines); masters count lines
  (`ContractsView.tsx:101`, slate, not live); about 9 empty lines (CodePicker, ModifierPicker, BillingCard:578,
  MoveBookingToColleagueSheet:185, AnaesthetistCandidates:104, DraftListCandidates:179, MoveListSheet, masters).
- **Differences:** style and wording DRIFT; wording may be per audience (Q5).
- **Target:** `SearchStatus` and `EmptyResult` in `shared/ui/`, style only, with wording passed in.
- **Migration:** about 11 lines. Risks: `visual/rvg-groups-phase19.spec.ts:67` ("No RVG codes match that search.")
  and `visual/booking-moves-phase32a.spec.ts:55` ("No anaesthetist matches") pin the text. Size S.
- **Upcoming phases:** 33, 40, 42 add lists with search. **Value:** low to medium. **Confidence:** medium.
- **Catalogue rows:** admin `CodePickerSheet`, `AnaesthetistCandidates`, `DraftListCandidates`, `RvgGroupsView
  (grouped rows)`; web `CodePickerSheet`.

### G10 · Checkbox and switch (Switch shared with E-G7)
- **Job:** a boolean option.
- **Members:** 7 product checkboxes. 4 are browser blue (no `accentColor`, no global `accent-color`):
  `ConflictsScreen.tsx:163`, `NotificationsScreen.tsx:60`, `RvgGroupsView.tsx:237`, `RightRail.tsx:259`. 3 are teal:
  `SurgeonGroupSheet.tsx:42`, `SlotStatusSheet.tsx:182`, `MoveBookingToColleagueSheet.tsx:237` (20px). Switches:
  ContractRail / BillingCard (36x20), `pwa/PwaDemoPanel.tsx` ToggleRow (52x32).
- **Differences:** blue vs teal is DRIFT against the teal-only rule (convention 17). 20px on mobile and the 52x32 PWA
  switch are INTENDED (convention 16).
- **Target:** `Checkbox` `{ checked, onChange, children, hint?, size? }` (native, `accentColor: accent.base`) and
  one `Switch` `{ checked, onChange, label, description?, size: 'sm' | 'lg' }` (E-G7 spec). No new look.
- **Migration:** 7 checkboxes, 3 switches. Keep `admin-notifications-show-resolved`, `move-booking-tell-office`. Size S.
- **Upcoming phases:** 21 ("Different payer" tick), 27 (approval toggle), 38b (Same as tick), 42 (Show retired
  toggle). Land before 21.
- **Value:** medium (blue boxes show on Conflicts, Notifications and the Day rail). **Confidence:** high.
- **Catalogue rows:** mobile `ToggleRow (switch)`; admin `SlotStatusSheet`, `MiniCalendar (RightRail)` (RightRail).

### G11 · Field focus treatment
- **Job:** show keyboard focus on a field.
- **Members:** NameSearchBox (teal border + `accent.focusRing`); `.aa-search-field` 3px outline (`global.css:747`);
  `.aa-rail-scope` 2px literal teal (`:796`); ModifierPickerSheet textarea `outlineColor`; every TextField, TextArea
  and select (browser default).
- **Differences:** DRIFT. The DL defines the ring ("focus ring `0 0 0 3px rgba(13,110,99,0.30)`"), which is
  NameSearchBox's.
- **Target:** one `.aa-field:focus-visible` rule (teal border + `--focus-ring`) that TextField, TextArea, SelectField,
  NameSearchBox and Checkbox put on their control.
- **Migration:** comes with G1, G3, G4 and G12. Must still work under `.aa-inset-device input { font-size: 16px
  !important }` (`global.css:604`). Size S.
- **Value:** medium (visible when tabbing in a demo). **Confidence:** high.
- **Catalogue rows:** admin `TextField`, `TextArea`; mobile `TextField`, `TextArea`.

### G12 · Textarea
- **Job:** multi-line free text.
- **Members:** `TextArea` (12 uses); bypasses `BookingDetailBody.tsx:621` (named only by placeholder; the Section
  heading is a div), `RightRail.tsx:251` (60px, 12.5, placeholder name), `ModifierPickerSheet.tsx:258` (counter,
  Enter submits); AlertOfficeSheet's own counter.
- **Differences:** BookingDetailBody's notes field is the mockup's "NOTES FOR THE OFFICE" card exactly (grey well in
  a white card, `Mobile App.dc.html:272-274`), so its look is canonical and only the missing label is DRIFT.
  RightRail's density is INTENDED (admin rail). Two hand-made counters: DRIFT.
- **Target:** `TextArea` gains `ariaLabel?`, `maxLength?` with a built-in counter, `rows?`, `onKeyDown?`,
  `size?: 'compact'`, `hint?`.
- **Migration:** 3 sites + 1 counter. Size S.
- **Upcoming phases:** 35 and 43a edit BookingDetailBody (fold the notes field in there); 39 (reason text), 41
  (letter editor).
- **Value:** low to medium. **Confidence:** high.
- **Catalogue rows:** admin `TextArea`; mobile `TextArea`, `BookingDetailBody`, `AlertOfficeSheet`.

### G13 · Hint line under a field
- **Job:** one quiet line explaining a field.
- **Members:** TextField hint (12, tied); ChipMultiSelect (12.5, tied); `FundingTagsView.tsx:106` (12, tied,
  `marginTop: -8`); `PairingAddSheet.tsx:133` (12, tied); ContractEditSheet `Helper` (`:463`, 12.5, not tied, 8 uses).
- **Differences:** 12 vs 12.5, tied vs untied: DRIFT.
- **Target:** `FieldHint` in `Field.tsx` (12, mist, takes `id`); fields take `hint`.
- **Migration:** 8 Helper uses + 3 inline. Size S.
- **Upcoming phases:** 24 and 42 touch ContractEditSheet and the masters. **Value:** low; a11y gain. **Confidence:** high.
- **Catalogue rows:** admin `ContractPanel (ContractEditSheet)`, `ChipMultiSelect`.

---

## Dropped or rejected
- Members to skip because a phase deletes or replaces them: `FunderAllocationSheet` (22), `PriceOverrideSheet` and
  `OverrideCard` (24), `AddBillingLineSheet` and `BillingLinesCard` (39b), ManualBookingForm's payer select and
  EditBillingSetupSheet's guardian select (21). `IntegrationMonitorScreen` inputs and its inline error are demoted to
  Future scope in 34: leave them.
- `IntegrationMonitorScreen.tsx:325` is not a refusal (a live NHI verdict caption); it is out of G2.
- `BookingDetailBody.tsx:539/555/560` error panels: F-G8 `Notice`, not FormError.
- Q4 (stepper glyphs vs icons): settled by the mockup (glyphs).
- GradientLab, DemoData and DemoActionsMenu controls: demo or temporary chrome.

## Intended differences to keep
- Field 48 vs pill toolbar sizes for search (`NameSearchBox.tsx:13`).
- Mobile 44px clear target and the 20px tick card (convention 16, PROGRESS.md:71; `ListsLookback.tsx:7`).
- The 52x32 PWA demo switch (touch size, its own comment).
- StepperButton's glyph, 44x44 and radius 12 (`docs/design/Mobile App.dc.html`).
- In-table compact inputs (ContractPriceRanges 36): desktop table density.
- The inline vs sheet layouts of the step rail (PROGRESS.md:368).
- The iOS 16px font rule (`global.css:604`); `useFieldText` stays in the Lists callers (`useLookback.ts:24`).
- The mockups draw fields at radius 12; the code uses `radius.ctl` 10, per the Design Language token table (DL wins).

## Questions for the user
- **Q1. Field fill:** grey well (`neutral.bg`) inside white sheets, cards and drawers, and white on the page or
  phone canvas? Recommended: yes. The mockups show grey on white; Conflicts already uses white on the page. This turns
  NameSearchBox grey in its 8 sheet and drawer uses, and the masters toolbar selects and the mobile Lists search white.
- **Q2. Heights:** 48 for every admin sheet control (dropping the 44s), and one compact toolbar filter at 36 white
  for Conflicts, masters and the AuditViewer / Phase 37 filter bar? Recommended: yes to both.
- **Q3. ContractCombo search header:** keep it borderless inside the popover (with a visible focus restored), or use
  the search box? Recommended: keep it borderless and restore the focus.
- **Q4. Web Lists search pill height:** 36 (the NameSearchBox pill) with Go to date at 36 too, or keep 38?
  Recommended: 36 for both.
- **Q5. Empty-result wording:** one pattern everywhere (and update the two Playwright specs), or keep each line's
  words and unify only the style? Recommended: style only for now.
- **Q6. Inline refusals:** may compact row controls keep a one-line error as `FormError variant="inline"`?
  Recommended: yes.

## Bugs found
- **The combo search has no visible focus** (`BillingCard.tsx:540`): the inline `outline: 'none'` beats
  `.aa-rail-scope input:focus-visible`. Sure.
- **`aa-rail-focus` is a dead class** on 10 elements (no rule in `global.css`). Harmless today, because the scope
  rule covers them. Sure.
- **Unnamed form controls:** the FunderAllocation select and amount input (`FunderAllocationSheet.tsx:147,161`) and
  ContractEditSheet's Linked surgeons select (`:493`). Sure. (FunderAllocation goes in 22.)
- **Stepper buttons named "−" / "+"** in UnitsCard (`:190/194`) and ProcedureCodeCard (`:226/283`). Sure.
- **17 refusal boxes without `role="alert"`** (G2 list). Sure.
- **Misalignment:** 44px controls beside 48px Segmented in one flex row (`DraftListSheet.tsx:132-137`,
  `AvailabilityFinderSheet.tsx:76-83`), 4px off. Sure from the code; not checked on screen.
- **4 browser-blue checkboxes** against the teal-only rule (G10). Sure.
