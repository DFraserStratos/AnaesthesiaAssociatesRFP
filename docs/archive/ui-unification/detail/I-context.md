> Detail file for `docs/ui-unification/README.md` (audit of 12 November 2026): context: remaining catch-up phases, decisions that make a difference intended, what must not break.
> Group numbers here (G1, N1 ...) are local to this file; the README's U-numbers point to them. Paths are relative to `aa-prototype/src/` unless they start with `docs/`.

# I · Context for a UI-component consolidation track

Read-only research, 2026-11-12. Repo root `/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP`
(paths below are from it). Catch-up plan folder: `docs/prototype-build/catch-up/` (`CU/` below).

---

## PART 1 · Remaining catch-up phases and the UI they build

### Done vs not done

DONE (PROGRESS.md status table, lines 25 to 46): 14, 15, 15a, 15b, 16, 17, 18, 18a, 19, 19a, 19b, 20, 20a,
28, 29, 30, 31, 32, 32a, 32b, 32c, 38a (22 phases). `CU/status.json` agrees: in_progress empty, next = **21**
("Start 21 now", as_of 2026-11-12). Note: 20 and 20a rows in PROGRESS have no Vitest/Playwright counts.

NOT DONE (28 phases, about 52 sessions): 17a, 21, 21a, 22, 23, 24, 25, 26, 27, 27a, 33, 33a, 34, 35, 36,
37, 38, 38b, 39, 39a, 39b, 40, 40a, 41, 42, 43, 43a, 44.

Run order from here (plan.json `sequencing_rules`): **21, 21a, 22, 23, 24, 25 strictly in order**, then 26
(before 38), 17a (before 35, 40, 42), 27 then 27a, then Intake (33, 33a, 34, 35) and Money (36; 37 and 38
after 36; 38b after 36+38a; 39 after 38b; 39a after 37+39), 39b after 24+38a+38b, 40 after
15a/17a/33a/34/36/39, 40a after 26+40, 41 after 27a/32a/39, 42 after 17a/18/18a/19/19a/19b/29/30, 43 after
34/36/37/42, 43a after 20a/21/21a/24/31/39b, 44 last (depends on every phase).

Parallel-capable tracks once the Contracts track (21 to 25) is done: **Profile/Master data** (26, 17a, then
42), **Intake** (33, 33a, 34, 35), **Prepayment** (27, 27a, 41), **Money** (36, 37, 38, 38b, 39, 39a). status.json
today says run 21 alone.

### Per phase: screens/files and the UI building blocks

(Files from the phase docs' own paths; "UI" = the building blocks the doc asks for.)

| Phase | Title | Sessions | Screens / files (A = admin, W = web, M = mobile, S = shared) | UI building blocks created or changed |
|---|---|---|---|---|
| 17a | Rooms without an email, surgeons at more than one room, PM and PA contacts | 2 | A `flows/SurgeonRoomSheet`, `SurgeonEditSheet`, `screens/SurgeonProfile` (ProfileCard), SurgeonsView, SurgeonRoomsView | ordered multi-select of rooms (main room first), "No email held" empty-value text, a contacts list on a ProfileCard with a **neutral role pill**, add/edit/remove contact sheet, confirms |
| 21 | Payer, insurer or funder, and who is billed | 2 | S `flows/PayerSheet` (new), `flows/EditPatientSheet`, `flows/EditBillingSetupSheet`, `booking/BookingDetailBody` (Payer and Funder rows), `flows/ManualBookingForm`; A `reviewFlags.ts`; step rail "Suggested" mark | **sheet on mobile / dialog on web+admin** via `useSurface()`, "Different payer" **tick (checkbox)**, NZ Post postal-address field group, Payer/Funder **detail rows** with Change, **warning chip** on the row, party picker (Party of kind insurer/funder), approval-number text field, "Suggested" **pill** on the rail |
| 21a | RVG detail by pricing kind, completion and office review | 2 | S `capture/*` (TimesCard, UnitsCard, ProcedureCodeCard, OverrideCard), `flows/SubmitListSheet`; A `screens/ReviewScreen`, `reviewFlags` moved to domain, `flows/MoveBookingFlow`; PWA `PwaDemoActions` | capture cards collapsing by pricing kind, "no modifiers" confirm control, **review-flag rows/chips**, teal **Approve** button + **Correct** text link + "Approved {time}" caption, Review screen restructure inside the mockup anatomy |
| 22 | Invoice presentation, delivery and the split | 1 | A `InvoiceDocument`, `InvoicesScreen`, `BillingMonitorScreen`, `ReviewScreen` (banner), `MasterData`, `EditAnaesthetistSheet`, `AddAnaesthetistFlow`; S `flows/SplitFeeSheet` (new, replaces `FunderAllocationSheet`), `booking/PartyPicker`, `booking/OfficeBillingSetup`, `capture/BillingLinesCard`; demo `DemoXero`/`AccPayCard` | **status pills** ("To post", "Emailed", heavy pill use: 23 mentions), Review **banner**, **Split sheet** with $ / % entry (a segmented $/% toggle likely), invoice layout blocks, a GST-number column in the Anaesthetists table |
| 23 | Primary Procedure and the multi-procedure rule | 2 | S `booking/ProcedureStack`, `capture/BookingTotalPanel`, `capture/UnitsCard`, `capture/BtmCaptureBlock`, new `flows/MakePrimarySheet`, `flows/RemoveProcedureSheet`; W `ListDetailView`; A `ReviewScreen` | "Primary" **pill** (20 mentions), **Make primary** action + confirm sheet, a Booking total panel showing per-Procedure allocation, review column |
| 24 | Pricing kinds, the price following its Contract, who may change it | 2 | S `capture/PriceCard`, `capture/OverrideCard`, `capture/BookingTotalPanel`, `BookingTotalStrip`, `CompletionOverlay`, `flows/PriceOverrideSheet` (becomes "Change price"), `capture/AddBillingLineSheet`; W `ListDetailView`; A `ContractEditSheet`, `ReviewScreen` | the anaesthetist's **price line card** (mobile + web), the office's **Change price sheet**, "Needs a price" chip, discount line, $0 no-charge state; removes rate x time line and the override reason field |
| 25 | Contract history and the AUTHORISED lock | 1 | S `capture/feeContext`, `booking/BookingDetailBody`; A `ReviewScreen`, `InvoiceDocument`, Contract panel **History tab**, `BillingMonitorScreen` | **neutral lock pill** "Contract locked at authorise", a History tab (rows who/what/when/before to after), "Regenerate from locked data" action + compare result |
| 26 | Anaesthetist profile and bank details | 1 | M `MoreScreen` (Profile card, rate sheet); W new `ProfileScreen`, `WebNav`, `routes`; A `AnaesthetistsView` columns, `EditAnaesthetistSheet`; S new `shared/profile/` with shared `ProfileRow` (label, mono value, optional lock glyph) | **ProfileRow** (shared label/value row), masked bank field, a new web page and nav tab, table column changes, read-only vs editable field treatment |
| 27 | Prepayment lifecycle | 2 | S new `booking/PrepaymentPanel`, `booking/BookingDetailBody`, `warnings/WarningsPanel`, `flows/EditBillingSetupSheet`; A `InvoicesScreen`, `BillingMonitorScreen`, RightRail, Review chip | a **panel/card** with status, "Approve and send" button, a switch (AA can turn the approval step off: **toggle**), escalating **warning chips**, review chip |
| 27a | AA Holding account and the transfer | 1 | A `BillingMonitorScreen` (Holding account card, like `AaFeePanel`); W `AccountsScreen` payments table; M Balances | a balance **card** with an entries **table**, "Held until the List is authorised" **status chip** in tables |
| 33 | Hospital download and the matching screen | 2 | A new `screens/MatchingScreen` + `apps/admin/matching/` (ImportRow, RowField, decide panel), `SideNav` (nav item + badge), `ListDrawer`, `flows/PhoneAdviceBooking`, `tableChrome`; S `booking/HistorySheet`, `ProcedureStack`; PWA `PwaDemoActions` | the biggest new admin screen: **tables of rows** (38 mentions), **badges/pills** (source, decision, 37 "badge"), **tabs** (26), field-difference rows with approve ticks, **banners** (10), Contract/Code picker sheets reused, empty state ("screen starts empty on a reset"), decision buttons Match/Create/Reject |
| 33a | Stubs on a List | 1 | S new `shared/stubs/` (`StubRow`, `StubMarker`, `StubSheet`, `ListStubNote`); A `SlotDrawer`, `DayGrid`, `DashboardScreen`; M `ListDetailScreen`; W `ListDetailView`; Matching screen | **a dashed-border warning-tint row** in Booking order reusing 15a's triangle anatomy (`warningTone('mild')`), a sheet, "Add NHI" teal button + Reject, a mist caption |
| 34 | Hospital sync, the rooms' PDF lists and the S1 rebuild | 2 | A new Intake home (`/admin/intake/...`, one nav item), PDF lists screen, `IntegrationMonitorScreen` demoted to Future scope, `SideNav`, `routes`; shell `appConfig` | **tabs** (Messages, Feed config, Validators, Data quality, Surgeon PDFs), "Sync · St George's"/"Rooms PDF" **source micro-caps/badges** (27 badge mentions), **upload** control (19), PDF row correction table, DemoBadge tone="future" |
| 35 | Explicit save and the update email | 2 | A `AdminBookingDetail` (draft-then-save), new `flows/UpdateEmailComposer`, `ListDrawer`, `MasterData` (email templates), `AuditViewer`; S new `booking/draft/`, `booking/HistorySheet`, `flows/ManualBookingForm`, `EditPatientSheet`, almost every edit sheet (`EditProcedureSheet`, `EditListSheet`, `EditInvoiceDescriptionSheet`, `CancelBookingSheet`, `SplitFeeSheet` ...); shell `AppShell` | **unsaved-changes bar** (sticky, Save/Discard), unsaved-warning **confirm dialog**, **banners** (12), history list with an as-at view, a change **picker with ticks** (24 tick mentions), email composer (mailto), **dialogs** (12). Touches the widest set of sheets in the plan |
| 36 | Internal ledger and balance views | 2 | A new `screens/LedgerScreen` + nav; W `AccountsScreen`, `DashboardScreen`; M `BalancesScreen`; demo `DemoXero` | ledger **tables** with filters (per anaesthetist), imbalance indicator **badge/chip**, cards, optional variance panel |
| 37 | Xero mirror resilience and the processing monitor | 2 | A `BillingMonitorScreen` (restyled for a large list: grouped by anaesthetist, sorting, **filtering** (55 mentions), problems-only view), new `ReconciliationCard` on Admin Day RightRail, `InvoiceDocument` rail, `ReviewQueue`, `AuditViewer`; demo `DemoXero` | **filter chips / segmented** "problems only", sortable **tables**, queue panel with Retry now, **empty states**, **status pills/badges**, a rail card (books square / out of balance) |
| 38 | Web accounts, outstanding list and monthly GST report | 2 | W `AccountsScreen` (sub-tabs Outstanding, GST report), `DashboardScreen`; M `BalancesScreen`; A `BillingMonitorScreen` | **sub-tabs**, a **month picker**, an outstanding table (removes `AgeChip`), download/email/print actions, financial-position cards |
| 38b | Events on a Procedure and the additional invoice | 2 | S new `booking/ProcedureEventsList`, `procedureEventCopy.ts`, `booking/BookingDetailBody`; A Review **Events tab** + `EventReviewSheet`, `AdditionalInvoiceSheet`/Form, `AdminBookingDetail` Booking total, `InvoiceDocument`/`InvoicesScreen`; M `BookingDetailScreen`; W `BookingDetailView` | events **list rows** under each Procedure, **tabs** (31), a **review sheet** (approve/decline), "same as" **tick** (43 tick mentions), free-form invoice form (description, quantity, amount), "Waiting for the next billing run" panel, **banners** (7) |
| 39 | Credit notes, credit-and-rebill and the combined split | 2 | A shared admin flows `CreditSheet`/`CreditForm`, `SplitCombinedSheet`, `LedgerScreen`, `InvoicesScreen`, `InvoiceDocument`, `AuditViewer`; M `BookingDetailScreen`; W `BookingDetailView` | credit **sheet/form** (64 "sheet"), status **chips** (14), invoice rail cards, rebill from copied lines (editable line **table**) |
| 39a | Payment runs, BCTI approval, netting, remittance | 2 | A `BillingMonitorScreen` payment-cycle panel, run detail, `LedgerScreen`, `InvoiceDocument` (remittance advice); W `AccountsScreen` Remittances sub-tab | cycle **stepper/timeline** (Friday close, Monday checks, Tuesday schedule), approval **tables**, status **pills**, signed currency formatting, sub-tab |
| 39b | Pre-op, post-op and billing events | 2 | S `booking/BookingDetailBody`, `capture/AddBillingLineSheet` (removed), `BillingLinesCard` (removed); new `AddPrePostOpEventSheet`, `AddBillingEventSheet`; A `ReviewQueue`, Contract event fees, invoices | two new **sheets** (66 "sheet"), invoice **tick**, date + time fields, fixed-fee vs time **segmented choice**, events list rows |
| 40 | Patients: mandatory NHI, balance warning, patient view | 2 | A new `screens/patients/` (patient record, waiting rows), S `flows/EditPatientSheet`, `ManualBookingForm`, new `shared/notes/SharedNotes`, `shared/patients/balanceAlert`, `warnings/`; M `ListDetailScreen`; W `ListDetailView`, `BookingDetailView` | `nhiBadge`, `BalanceAlertChip` (mild/strong **chips**, 18 pill mentions), new patient screens (tables, tabs), shared notes component, NHI field with Save disabled, one Master data threshold field |
| 40a | NHI lookup and identity standards | 1 | S `flows/ManualBookingForm` (8 mentions), `flows/AddBookingFlow`, `PayerSheet`, new `shared/nhiHub/`; A `ListDrawer`, `PhoneAdviceBooking`, `EditAnaesthetistSheet` | NHI **field with as-typed validation** and lookup states (Hub states: **badges** 14, chips 7), manual fallback, **type-ahead** (13), HPI CPN one label and formatter |
| 41 | Prepayment letter, cancellation, differences by hand | 2 | S `flows/CancelBookingSheet`, `booking/` PrepaymentPanel; A letter templates (Master data), `BillingMonitorScreen`, RightRail; credit sheets reused from 39 | letter template editor with merge fields, reminder action, **dialogs** (15: rebook dialog, Contract-change confirmation), settled-panel states |
| 42 | Reference data and controlled loads | 2 | A `screens/MasterData.tsx` + `screens/masters/*` (new `masterViews.ts` registry with `catalogueRows`, `GoLiveLoadView`, `SeedLoadView`, `LoadResultPanel`, `RetireSection`, `ShowRetiredToggle`), many master sheets (`HolidaySheet`, `PublicHolidaySheet`, `RvgGroupSheet`, `EditHospitalSheet`, `SurgeonRoomSheet` ...), `tableChrome` | **"One pattern for every view"** of Master data: shared master table, sub-nav registry, retire/restore section with reason, Show retired **toggle**, **upload** (16) + load result panel/**banner**, active-only pickers. Heaviest table phase (61 "table") |
| 43 | Scale and privacy | 2 | A `DayGrid` (pages at 85), `Pager`, `InvoicesScreen`, `AuditViewer`, `BillingMonitorScreen` at 28,000 rows, `SideNav`, `MatchingScreen` + `matching/RawRowSheet`; W `WebNav`; M `MoreScreen`; shell `AppShell`, `DemoActionsMenu`, `DemoResetButton`; new `shared/scale/ScaleBanner`, `shared/SyntheticDataBadge` | **pagination**, **filters** (28), **banners** (29: ScaleBanner), **badges** (SyntheticDataBadge everywhere), restricted raw-row sheet |
| 43a | Sign-in and ease of use | 2 | M new `SignInScreen`, `MobileApp` gate, `MoreScreen`, `ForwardListsScreen`, `ListDetailScreen`; W `DashboardScreen`, `ListDetailView`; A new `components/HelpPanel`, `SideNav`, `DayNav`, `ReviewScreen`; S new `shared/help/InfoTip`, `FirstRunHint`, `helpTopics`, `shared/viewer.ts`, `capture/PriceCard`, `capture/ui.tsx`, `booking/ProcedureStack`, `BookingDetailBody`; PWA `PwaDemoPanel`, `InstallCoach` | **InfoTip** (a new shared tooltip/popover on section labels in all three apps), **first-run hint card** per app, sign-in form, Help **panel**, ticket list with status **pills** (30 pill mentions), a two-way render-scan guard test over every anaesthetist component. Sweeps the anaesthetist screens wholesale |
| 44 | Demo guide rewrite and final sweep | 2 | demo `DemoControlPanel` (scenario jumps from a pure module), `shared/demoTriggers` audit tests (`demoGuideSync.test.ts`, `demoTriggerAudit.test.ts` new), stale copy sweep across `reviewFlags`, `InvoiceDocument`, `BillingMonitorScreen` ...; `docs/demo-guide/*` | no new components; it audits labels, triggers and copy against the guide, so any consolidation must land before it |

### Summary for the consolidation plan

**Component families with the most upcoming demand** (consolidate these first so new phases reuse them):

1. **Sheets / dialogs through `useSurface()`**: almost every phase adds one (21 PayerSheet, 22 SplitFeeSheet,
   23 MakePrimary, 24 Change price, 35 composer + unsaved confirm, 38b review + additional invoice, 39
   CreditSheet, 39b two event sheets, 41 rebook + letter, 42 master sheets). A single sheet/dialog scaffold
   (title, body, footer actions, refusal line, success state) is the highest-leverage target.
2. **Pills / chips / badges** (status pills, neutral info pills, warning chips, source badges, lock pill,
   "Suggested", "Primary", "To post", tier/role pills, Hub states, Synthetic data badge): 21, 22, 23, 25, 27,
   27a, 33, 34, 37, 40, 40a, 43, 43a all add some. Existing homes: `shared/ui/Pill.tsx`,
   `shared/StatusChip.tsx`, `shared/DemoBadge.tsx`, `apps/admin/screens/masters/chrome` (MasterPills),
   `TierPill`.
3. **Admin tables** (head/cell chrome, clickable rows, filters, sort, empty state, pagination): 33, 36, 37,
   38, 39a, 40, 42, 43. Existing: `apps/admin/tableChrome.ts` (`cellStyle`, `headCellStyle`,
   `isInteractiveRowTarget`), `MasterTable`, `Pager`.
4. **Detail rows / label-value rows** on the Booking and profiles: 21 (Payer, Funder rows), 25, 26
   (`ProfileRow`), 27 (PrepaymentPanel), 38b (events rows).
5. **Banners / inline notices and result lines**: 22, 33, 35, 37, 38b, 42, 43 (ScaleBanner).
6. **Tabs / sub-tabs / segmented controls**: 33, 34 (Intake tabs), 37 (problems-only), 38 and 39a (Accounts
   sub-tabs), 38b (Review Events tab), 39b. Existing: `shared/ui/SlidingSegmentedControl`, admin
   `SegmentedExample`, `TabLink`, masters sub-nav.
7. **Form fields** (text, NHI, postal address group, amount/percent, date/time, ticks): 21, 24, 35, 39, 39b,
   40, 40a, 42. Existing: `shared/ui/Field.tsx`, `NameSearchBox`, admin `DateField`/`TextField` examples.
8. **Tooltips/popovers**: new in 43a (`InfoTip`); a consolidated popover primitive should exist before it.

**Screens about to be heavily reworked** (fold consolidation into that phase rather than doing it standalone):

- `shared/booking/BookingDetailBody.tsx` and the capture suite (`shared/capture/*`): 21, 21a, 23, 24, 25,
  27, 35, 38b, 39b, 43a all edit it. 35 routes every Booking read/write through a draft context.
- Admin `ReviewScreen.tsx`: 21a (restructured), 22, 23, 24, 25, 38b (Events tab), 43a.
- Admin `BillingMonitorScreen.tsx`: 22, 25, 27, 27a, 36, 37 (full restyle), 39, 39a, 43.
- Admin `InvoiceDocument.tsx` / `InvoicesScreen.tsx`: 22, 25, 36, 37, 38b, 39, 39a, 43.
- Admin Master data (`screens/masters/*`): 17a, 22, 26, 41, **42 rebuilds every view on one pattern**.
- Admin Matching/Intake: new in 33, reshaped in 34, 40, 43 (build it on consolidated parts from the start).
- Web `AccountsScreen` and mobile `BalancesScreen`: 27a, 36, 38, 39a.
- Mobile/Web profile (`MoreScreen`, new web `ProfileScreen`): 26, 43a.

Standalone consolidation is safest for primitives no phase is reworking (Button, Field set, Pill/Chip,
Avatar, Logo/Wordmark, SlidingSegmentedControl, sheet/dialog shell, table chrome) and should land
**before 21** or between 25 and the parallel tracks, so the 28 remaining phases consume them.

### Phase doc and kick-off prompt house style

**Phase doc** (`CU/phases/phase-NN-<slug>.md`), e.g. phase-21 (688 lines), phase-17a (160):

- Title: `# Phase NN · <Title>` (middot).
- Header block (bold labels, links relative to the catalogue): **Requirements covered** (status and gap
  verdict at catalogue `<sha>`), **Joined / Left at `<sha>`**, **Carried across without regression**,
  **Touches, without closing**, **Answered, built as answered**, **Still open, built as defaults**,
  **Depends on**, **Estimated** (N sessions, with the session cut line and what to finish first if it runs
  long).
- Sections, in order: `## Goal`, `## Before you start: drift check` (numbered: diff the catalogue with
  `plan-state.mjs --diff`, questions, "read what earlier phases actually left", pin parity, deliberate
  changes), `## Reference`, `## Work items` (grouped `**Session 1: ...**` / `**Session 2: ...**`, numbered
  bold-titled items naming files; UI items say "frontend-design applies"), `## Demo triggers`,
  `## Out of scope`, `## Manual test checklist` ("The agent runs every item itself in the running app and
  reports it with evidence; none is handed to the owner", `- [ ] **Name (story AC).** steps ...`),
  `## Demo guide updates`, `## Catalogue screenshots` (Item / Recipe now / When this phase is done table,
  "Recipes this phase breaks", ATLAS.md), `## Adversarial review (after build)` (or "Adversarial review
  steer" in shorter docs) with "Steer this phase's reviewers at:" bullets, `## PROGRESS.md updates` (For the
  owner's review list, status row, phase entry, Decisions log, handoff list, catalogue screenshots counts).
- **Required for tooling**: every unbuilt phase doc must contain the exact heading
  `## Catalogue screenshots` naming each story it owns, and its prompt must contain `npm run capture`, or
  `recipe-status.mjs --check` fails (`requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs`
  lines 7 to 9, 77 to 92). A UI-only phase can state that it covers no stories but must still keep the
  section and the capture run ("Recipes this phase breaks" is the real content).

**Kick-off prompt** (`phase-NN-<slug>.prompt.md`, about 40 to 55 lines), fixed shape:
1. "Please run catch-up Phase NN (Title) of the Anaesthesia Associates prototype." + the paths/quoting note.
2. "Before doing anything else, read these in order:" numbered list (ROADMAP sections, the phase doc,
   GAP-ANALYSIS parts, catalogue items, artifacts, design files "AUTHORITATIVE layout reference
   (convention 17)", ATLAS.md, PROGRESS.md conventions/decisions/earlier entries, prototype maps).
3. "Then do the drift check ..." then "Then write a plan ... start building without waiting for my approval
   (ROADMAP.md "Owner review: agents test themselves")."
4. "While working:" bullets: invoke `/frontend-design:frontend-design` before any UI ("inside this repo's
   design system ... never for a new palette, typeface or visual language"), session cut line, the
   one-place rules, house rules ("every write through mutate() ...; bottom sheets on mobile, dialogs on web
   and admin; teal is the only action colour and crimson identity only; no en or em dashes in app copy;
   never commit").
5. "When done:" bullets: run the manual checklist yourself; confirm `npm run build`, `npm run build:pwa`,
   `npx vitest run`, `npm run shots` and `npm run verify:board` are green; adversarial review-and-fix pass
   (convention 18, Opus reviewers per lens, verify each finding, fix, re-green); Catalogue screenshots step
   (`node scripts/capture.ts --dry`, then full `npm run capture`, look at shots, ATLAS, verify:board);
   update PROGRESS.md (status row, entry, Decisions log, handoffs); patch the demo guide in the same
   session; "Give me short, clear notes, ending with the "For the owner's review" list".
6. Last line: "Phase goal: ..." one long sentence.

### Numbering and registration; can hand-written phases be added?

- Registered in four places: `CU/plan.json` (`phases[]`: num, slug, title, track, goal, delivers,
  depends_on, est_sessions, covers, demo_triggers, blocked_by_oqs, risks, file, prompt_file, goal_short,
  checks; plus `sequencing_rules`, `milestones`, `parked`), `CU/ROADMAP.md` (Tracks section line 319, Phases
  table line 359, Sequencing rules line 415, Milestones), the phase doc + prompt in `CU/phases/`, and
  `CU/index.html`, **generated** by `node requirements-board/agent/skills/update-build-plan/tools/build-index.mjs`
  from plan.json, status.json, gaps.json and the prompt files (warns if a phase `covers` an id not in
  gaps.json, or status.json names a phase not in plan.json). `CU/status.json` holds next/in_progress/guidance
  (the PROGRESS status table wins once a row exists). `CU/plan.config.json` holds plan settings (firstPhase
  "14", standing rules, greenCommands); it has no phase list.
- Numbering: integers by track, letter suffix (27a) "if order matters more"; the outline agent is told
  "Keep phase numbers; add new phases at the end of their track with the next free number, or a letter
  suffix" (`workflow-plan-outline.js` line 107).
- **Generator risk:** `/update-build-plan` in Update mode runs `apply-plan-update.mjs`, which "rebuilds
  plan.json exactly from the runs" (SKILL.md line 251; the script writes `phases` = the outline agent's
  phases). The outline architect is given the old plan.json and told to return "the full updated outline
  (all phases, built ones unchanged)" (outline line 125), so a hand-added phase survives only if the Opus
  architect carries it; a critic also asks "Is any phase now ... empty?", and coverage checks look only at
  gap/DM/RV units, so a phase with `covers: []` is a candidate for removal. Phase **docs** are only rewritten
  for phases in the "affected" list; a doc is never deleted by the script, but its plan.json row can vanish.
  The "Small updates" path (hand edits, as done on 2026-11-10) does not run the outline. **Mitigation**: add
  the phases to plan.json/ROADMAP by hand (with a `track` such as "UI consolidation", empty `covers`, a
  ROADMAP sequencing rule stating they are owner-added and outside the gap analysis), regenerate
  index.html, and when running `/update-build-plan` pass an owner directive to keep them (the skill takes
  "any owner directives the user gave for this update", SKILL.md line ~152). Built phases are frozen and
  safe once their PROGRESS row says DONE.

---

## PART 2 · Decisions and conventions that settle UI differences

`P` = `docs/prototype-build/PROGRESS.md` (line numbers as of today). `DL` = `docs/design/Design Language.dc.html`
(v1.2, Jul 2026).

### Tokens, colour, identity

- **Crimson identity only, teal the only action colour.** P:72 (convention 17) "AA crimson #A91E3E is
  identity only: masthead, active nav, avatars; never buttons, never status; deep teal #0D6E63 is the only
  action colour." DL: "BRAND, AA CRIMSON · identity only: masthead, wordmark, active nav, avatars"; "ACCENT,
  DEEP TEAL · primary actions & selection only, never status"; accent hover #0A5A51, pressed #084A43, tint
  #E1F0ED; focus ring `0 0 0 3px rgba(13,110,99,0.30)`. CLAUDE.md "Design" repeats it.
- **Exception, intended: admin mini-calendar uses crimson for today, selection and focus.** P:1047 to 1051
  (Post-phase fixes 2026-07-28): "Today remains the crimson identity marker ... All three visible states now
  share AA crimson: solid fill for today, a thin border for the selected date, and a solid outer ring for
  keyboard focus ... (user visual pick, superseding the initial teal/grey treatments)". The
  ui-library-preview README also records "the admin calendar's crimson today is kept by decision".
- **Web dashboard today marker is crimson around the AM/PM pair.** P:226 (2026-07-29).
- **Design files authoritative; extend, don't invent.** P:72 (convention 17); P:65 (convention 11 "Ease of
  use wins arguments ... choose simpler, keep the IA recognisable"); ROADMAP "Front-end design" (CU/ROADMAP.md
  1322 to 1331): frontend-design shapes "layout, hierarchy, spacing, states and finish, never a new palette,
  typeface or visual language".
- **Stack is fixed; "No additional UI framework without a decisions-log entry".** P:54 (convention 2).
  Tokens: TS modules in `src/theme/` are the runtime source of truth, `global.css @theme` mirrors them;
  most components style via inline styles reading TS tokens (P:254, Phase 00 decision (2)).
- **Six status colours, defined once, identical in all apps; hatched Unavailable, dashed Free.** P:62 to 63
  (convention 10, amended by catch-up 29: `STATUS_PALETTE`, `resolveStatusVisual` "same hexes, same hatch
  and dash strings"); P:238; P:168 (Free default dashed, Unavailable hatched); DL section 02 "Colour is never
  the only signal: every block carries its label". Conflict colour: P:150 (warning tint + 1.5px warning
  border, kind's left bar kept, "No new hex").
- **Radii / chips:** DL "r-ctl 10, r-card 14, r-panel 20, r-sheet 24, r-pill 999. Chips and status pills
  always r-pill. Sheets round the top corners only." Also P:72.
- **Elevation / hover:** DL "Scrim under sheets rgba(23,35,32,0.32). Hover on web rows: neutral/sunken fill,
  no shadow."
- **Type:** Schibsted Grotesk UI + Spline Sans Mono data, tabular-nums "so values tick without jitter" (DL
  03, P:72, P:243). Body 15/22 desktop, 16/24 mobile (DL): an intended size difference between apps.
- **Labels over icons** (DL principle line 1).

### Sizes and touch

- **Touch targets >= 48px on mobile; desktop table rows 40px; admin day-grid rows 32px.** DL section 04.
  (So row heights differing between web tables and the admin day grid are intended.) Note: individual
  fixes in P cite 44px (P:336 History "now has a 44px touch target"; P:1235, 1242 Phase 15 review "now
  shown, 44px", "Mobile 'Add attachment' under 44px"; P:970 masthead folds to a 44px nav row): the DL says
  48, the code has used 44 as the floor in places. Not settled by a decision: a consolidation should pick
  one (DL wins under convention 17).
- **Invoice workspace geometry**: P:228 (760px invoice, 24px gap, 264px rail, 40px Email/Print buttons).
- **Web anaesthetist total + Mark complete widths and halo**: P:224 (desktop only; "Mobile remains unchanged").

### Motion and press feedback

- DL section 05 lists **six** named patterns (CLAUDE.md and P:72 say four): `motion/control-press` (90ms, 1px
  dip, 0.985 scale; **"Enabled controls inside the phone only"**, so press feedback on mobile and none on
  web/admin is intended), `motion/selection-slide` (180ms, "One highlight travels between contiguous
  segments": the segmented control), `sheet-in` (320/260ms, "Bottom sheets, pickers"), `card-advance`,
  `complete-tick`, `value-tick`. Reduced motion collapses to 80ms fades. All six are in
  `aa-prototype/src/theme/motion.ts` (`controlPress`, `selectionSlide`, ...).
- **Write-through per tap** for steppers/chips; commit-on-blur/Save for free text; showValidation latch
  (failures only after a refused Mark complete). P:289 (Phase 04 capture-UX, "Phase 05's web capture must
  mirror").

### Overlays: sheets vs dialogs vs panels

- **Mobile: bottom sheets and slide-in cards, never centred modals; web/admin: desktop layouts.** P:71
  (convention 16: "steppers/chips/segmented controls over dropdowns and free text"; "Micro-delight lives in
  action feedback"). Early phase 03 rule: P:624 "every modal is a BottomSheet ... show a TickBadge animate
  success state, and render guard refusals verbatim".
- **The seam is `useSurface()`.** P:292 (2026-07-23): "returns {variant, Overlay, Footer, Body}; mobile's
  provider returns BottomSheet ..., web's returns a centred Dialog ...; no per-platform branching in the
  bodies". Amended P:316 (2026-07-27): Surface loses Body/Footer, gains `CardLayout` (eight named slots)
  and `Pair` (stacked on phone, side by side on desktop). P:330: `Pair` stretches by default;
  `CaptureSection` gains a `footer` slot. P:291: the shared-library extraction ("Phases 06/07 reuse from
  here, do NOT re-extract").
- **Admin Party and Contract editors are a 600px right-docked panel, not a centred Dialog** (ATLAS.md
  "Overlays that need clicks", from catch-up 18): intended admin pattern for master records.
- **The step rail is inline on the Booking**, a Billing card per Procedure on Admin and web, Billing rows
  opening a sheet on the phone. P:368 (Phase 20 (7), owner review 2026-11-11; supersedes "bottom sheet on
  mobile, Dialog on web and Admin").
- **One ProcedureStack component** at full and compact density. P:372 (Phase 20a (3)).
- **Mobile navigation**: real routes, slide stack (P:328 reverses P:281); sheets and drawers deliberately not
  in the URL (demo-guide 03 line 104).
- **Dock clearance is an in-flow `DockSpacer`**, never trailing padding. P:346.
- **Phone pins the total; masthead folds to a 44px nav row.** P:334, P:970. Superseded in part: P:220
  (anaesthetist Booking shows no calculation/fee; office Admin keeps the fee panel, an intended difference),
  amended by 20a (pricing basis shows).
- **Mobile History in the masthead status row; admin falls back to a standalone row.** P:336 (intended
  difference).
- **Web Booking/List detail are desktop layouts, not the mobile stack widened.** P:316.

### Confirms, success, warnings

- **No confirm step and no tap-to-read for warnings**; triangle is a marker (`span role="img"`); the submit
  sheet stays. P:205 (catch-up 15a); P:79 (convention 20: a warning is a rule, shown by "the shared
  triangle, the Booking's warnings panel, the Day view outline and the To-do card ... with no UI change").
  P:1298: tapping the triangle on mobile opens nothing, the row opens the Booking.
- **Own moves need no confirmation** (D7; P:124, P:127: "the confirm step has no warning").
- **Vacated-session choice**: one control `VacatedSessionChoice` on shared `StatusRadioGroup`, on every path.
  P:108.
- **Success**: TickBadge animate success state in sheets (P:624); a one-second success overlay
  (`SuccessOverlay`; P:1606, P:1804); admin Review authorised-state choreography "green tick banner, table
  dims, per-row lock icons, queue badge decrements, 'Next in queue'" (P:241). No toast library: nothing in
  P adopts toasts (the ui-library preview offers Sonner as an option only).
- **Refused completion moves focus to the first incomplete control** (P:225) via `data-validation-*`
  (see Part 3).

### Search, pickers, dates

- **One shared type-ahead `NameSearchBox`** (controlled, no filter of its own) and one matcher
  `matchesNameQuery`; "always filtering after ranking, never reordering". P:122 (catch-up 32a). No decision
  on search-box background was found.
- **Capture picker is a type-ahead on code and description** (`CodePickerSheet`, name kept, flat list).
  P:96 (catch-up 19).
- **Modifier picker**: itemised ledger + picker with inline explanation, superseding segmented bands and
  "Also applies" chips. P:91 (19b) superseding P:332.
- **Admin SurgeonPicker is a native select with optgroups** (P:1484, catch-up 17). Capture recipes use
  `select` steps that call Playwright `selectOption` (58 steps), which only works on native `<select>`
  (Part 3).
- **Date picking**: admin mini calendar keyboard model and crimson states (P:1043 to 1051); shared
  `MonthGrid` from catch-up 38a (P:46 row: "shared MonthGrid, mobile search and date sheet, web search and
  Go to date"); mobile date sheet vs web Go to date is an intended difference. Native `type=time` kept for
  session times (ui-library-preview README "Known gaps").
- **Segmented controls**: "Everyone/Free-only segmented filters on availability (mobile + web)" adopted from
  the design (P:241); DL `selection-slide`; shared `SlidingSegmentedControl` (shared/ui). Note ATLAS:
  "Tabs and segmented controls are usually plain `<button>`s, not role=tab" (recipes depend on this).

### Tables

- Web/admin: "proper desktop layouts (hover states, keyboard-friendly tables)" P:71; DL row heights and
  hover fill. Clickable rows are pinned by `src/apps/admin/screens/ClickableTableRows.test.tsx` and
  `apps/admin/tableChrome.ts isInteractiveRowTarget`; P:1491 (catch-up 17): "the name is a link and the row
  opens the record; the Edit link ... kept as named".

### Avatars, names, wordmark, logo

- **Avatar: elevated-white chip, crimson initials, no ring, e1 shadow** (shared `Avatar`), replacing the
  crimson-tint avatar on mobile because it blended into the wash. P:232 (Phase 13, 2026-07-24), P:24
  status row; original crimson-tint P:237. Whether web/admin avatars also use the white chip is not
  stated; P:232 says "Applied to the header, the More profile ..." (mobile).
- **Names**: one home `shared/format.ts`; full name / `drSurname` / `initialsOf` (avatars). P:314.
- **Logo vs Wordmark**: web top nav uses the `Logo` image (h24); admin dark side nav uses the `Wordmark` text
  component (tone prop) because crimson on ink does not read. P:256, P:258, P:293; CLAUDE.md "Copy &
  typography". An intended difference.
- **Mobile atmosphere** crimson wash from `AA_DEFAULT_GRADIENT`, "Brand whisper". P:232, P:233.

### Copy

- No en/em dashes in app copy (CLAUDE.md; enforced by tests such as the catalogue tests). Vocabulary:
  Booking, Party, etc. (plan.json sequencing rules "Vocabulary"). `noSlotCopy.test.ts` and
  `scheduleTerms.test.ts` scan source for banned words.

### Demo-only chrome

- **Demo-only surfaces are visibly demo-only** with `DemoBadge` ("demo simulation" / "Demo trigger"; tone
  "future"). P:68 (convention 13). Demo triggers only in the harness "Demo actions" pill and PWA Demo sheet;
  Control Panel is an index with no trigger buttons. P:56 (convention 4), P:216.

---

## PART 3 · What must not break

### (a) Attributes tests and capture target

Counts in `aa-prototype/src` (excluding tests):

| Attribute | Occurrences | Files | Notes |
|---|---:|---:|---|
| `data-shot="..."` literal | 444 (`data-shot=` incl. expressions); 284 distinct literal values | 129 | plus a **`shot` prop** passed to shared components (459 `shot=` occurrences in 139 files, 365 distinct values). Components that accept `shot?: string` and emit `data-shot`: `shared/ui/TickButton`, `Pill`, `TextAction`, `NameSearchBox`, `shared/capture/ui.tsx` (CaptureSection), `shared/booking/ProcedureContractRow`, `shared/contracts/ContractSelect`, `shared/availability/AvailabilityForm`, `AvailabilityEditor`, `shared/flows/VacatedSessionChoice`, `apps/web/screens/AvailabilityGrid`, admin `drawerParts`, `masters/chrome`, `MasterPanel`, `SlotDrawer`, `ChipMultiSelect`, `ProfileChrome`, `pairing/NotPreferredWarning`, `conflicts/ConflictCallout`, and demo surfaces. **Any merged component must keep the `shot` prop and emit `data-shot` on the same element.** |
| `data-testid` | 78 (81 `=`) | 30 | used by 111 `getByTestId` in Playwright and 185 recipe selectors |
| `data-validation-procedure-id` / `data-validation-fields` (+ `data-validation-focus`) | 16 | 8 | set in `shared/capture/BillingLinesCard`, `ModifiersSection`, `ProcedureCodeCard`, `TimesCard`, `BtmCaptureBlock`, `capture/ui.tsx`; consumed by `shared/booking/BookingDetailBody.tsx` lines 413 to 428 (scroll and focus to the first failure) and styled in `theme/global.css` 380 to 385 |
| `data-aa-mobile-product` | 29 `data-aa-*` in 8 files | 8 | recipes scope mobile dialogs as `[data-aa-mobile-product] [role=dialog]` (54 recipe uses) |
| other data hooks | `data-list-id` 34, `data-slot-id` 13, `data-catalogue-row`, `data-date`, `data-status-choice`, `data-modifier-code`, `data-day-grid-row`, `data-notification-row`, `data-contract`, `data-rail-option`, `data-candidate*`, `data-tier`, `data-weekday`, `data-swatch`, `data-status-row`, `data-masters-view` ... | | targeted by Playwright and recipes |

No `data-demo*` or `data-trigger*` attributes: demo triggers are found by `data-shot="demo-actions"`,
`demo-action-<id>`, `pwa-demo-actions`, `pwa-demo-action-<id>` (set in `src/shell/DemoActionsMenu.tsx` lines 91,
149 and `src/pwa/PwaDemoActions.tsx` lines 39, 99), `scenario-s1..s5`, `scenario-confirm`, `index-<id>`.

**Consumers:**

- **Playwright** (`aa-prototype/visual/`, config `aa-prototype/playwright.config.ts`): 37 spec files, about
  171 `test(` calls; two projects (`prototype` on 5173 at 1440x900, `pwa-device` iPhone 14 Pro on 5174 for
  `pwa-device.spec.ts`). Selectors: 486 `data-shot`, 616 `getByRole`, 223 `getByText`, 111 `getByTestId`,
  740 `locator(`. **No visual baselines**: no `toHaveScreenshot`/`toMatchSnapshot` anywhere; `npm run shots`
  writes PNGs to `visual/shots/` (gitignored) for eyeballing. So screenshots never fail a run; selectors,
  roles, texts and some geometry/style assertions do (e.g. `mobile-insets.spec.ts` locks framed pixels,
  P:67; the invoice workspace geometry and admin rail alignment assertions, P:1018, P:1111).
- **Requirements-board capture**: 285 recipes in `requirements-board/requirements/capture/recipes/*.json`
  (631 screenshots; REPORT.md: 165 captured, 50 partial, 0 failed). Steps: 1021 wait, 837 click, 631
  highlight, 151 fill, 58 **select** (Playwright `selectOption`, native `<select>` only;
  `requirements-board/scripts/capture.ts` line 329), 53 trigger, 5 press, 5 hover. Selectors: 1069
  `[data-shot`, 185 `[data-testid`, 637 `role=`, 115 `text=`, 119 `has-text`, plus `[role=dialog]`,
  `[role=radio]` (PWA demo sheet choices), `button[data-date=...]`. ATLAS rules: `data-shot="<area>-<thing>"`
  unique per screen, "move hooks with the code they follow", "Tabs and segmented controls are usually plain
  `<button>`s, not role=tab", "A dialog or sheet is `[role=dialog]`". Project steps in
  `requirements-board/requirements/capture/steps.ts`: `trigger` (opens `[data-shot=demo-actions]`, row
  `[data-shot=demo-action-<id>]`, its `select` for choices, Run button by role, waits for `role=status`;
  on mobile the amber chip, radio rows, closes by tapping the scrim at (12,12) and waiting 400ms) and
  `scenario` (`[data-shot=scenario-<id>]`, `[data-shot=scenario-confirm]`). Shot names are kept across
  phases (a rename deletes the old image).
- **Demo trigger registry**: `aa-prototype/src/shared/demoTriggers/` (`registry.ts` about 37 entries,
  `types.ts`, `match.ts`, `context.ts`, `useDemoTriggers.ts`, `InlineDemoTrigger.tsx`,
  `DemoTriggerBadge.tsx`, `procedureTextTriggers.ts`; tests `demoTriggers.test.ts`, `context.test.tsx`,
  `procedureTextTriggers.test.ts`). Rendered by `shell/DemoActionsMenu.tsx`, `pwa/PwaDemoActions.tsx`,
  `apps/demo/DemoControlPanel.tsx` (index) and inline on admin screens (`InlineDemoTrigger` in
  `AnaesthetistCandidates`; `useDemoTriggers` users: SlotDrawer, DraftListDrawer, AssignDraftListSheet,
  SessionStatusSheet, ReassignListFlow, MasterData, AaFeesScreen, IntegrationMonitorScreen, DemoXero,
  DemoIntegrations). Phase 44 will add `demoGuideSync.test.ts` and `demoTriggerAudit.test.ts`.

### (b) Vitest suites

- 183 test files in `aa-prototype/src` (45 `.test.tsx`), about 1,971 `it`/`test` calls (PROGRESS: 1897 at
  Phase 19b; the run below reports the live count). jsdom + Testing Library (`vite.config.ts` environment
  jsdom).
- Component tests that render and query markup (46 files render): `src/shared` 18 (`StatusChip`,
  `surface/BottomSheet`, `surface/Dialog`, `ui/SlidingSegmentedControl`, `ui/SuccessOverlay`,
  `calendar/MonthGrid`, `capture/CompletionOverlay`, `TimesCard`, `UnitsCard`, `booking/ProcedureStack`,
  `BookingDetailSource`, `MoveToColleague`, `flows/AddBookingFlow`, `AlertOfficeSheet`, `SubmitListSheet`,
  `useOwnBookingInView`, `warnings/warnings`, `demoTriggers/context`); `src/apps/admin` 16 (DayGrid,
  SlotDrawer, WarningsToDo, AssignDraftListSheet, AvailabilityFinderSheet, pairingPickers,
  ReassignListFlow, SessionStatusSheet, AaFeesScreen, **ClickableTableRows**, mastersPages,
  specialtiesTags, NotificationsScreen, ReviewChangedSinceSubmitted, ReviewScreen, useSuggestionKey);
  `src/apps/web` 2 (AccountsScreen, ListsScreen); `src/apps/mobile` 2 (SlideStack, ForwardListsScreen);
  `src/apps/outOfHoursScreens.test.tsx`; `src/apps/demo` 4 (DemoXero + three catalogue tests); `src/shell` 2
  (DemoActionsMenu, DemoResetButton). 28 of the tsx tests assert on `className`, `querySelector`, inline
  `style`/`toHaveStyle` (e.g. WebCatalogue asserts `fontWeight: '600'` on the WebNav tab), so restyling can
  break them, not just renaming.
- **Source-scan tests that depend on file location** (moving a component can change their verdict):
  `src/pwa/pwaPurity.test.ts` (the PWA import graph from `pwa/main.tsx` must not reach `apps/web`,
  `apps/admin`, `apps/demo`: **a component shared with mobile must live in `src/shared`, never in an app
  folder, and must not import admin code**); `src/apps/moneyViewPurity.test.ts` (no `xero` state in
  mobile/web); `src/apps/officePrivacy.test.ts` (office-private data); `src/apps/draftListBoundary.test.ts`
  (mobile, web, pwa); `src/apps/noSlotCopy.test.ts` and `src/shared/scheduleTerms.test.ts` (copy scans over
  `apps/**`, `shared/**`, `shell/**`, `pwa/**` tsx); `src/domain/domainPurity.test.ts`;
  `src/shell/gradientLab/gradientLabPurity.test.ts`. Phase 43a adds `src/apps/anaesthetistSimplicity.test.tsx`
  (a two-way render scan of anaesthetist components).

### (c) PWA build

`npm run build:pwa` (`vite.pwa.config.ts`, root `pwa/`, entry `pwa/main.tsx`) ships the Anaesthetist Mobile
App alone. Shared with the framed build: `src/apps/mobile/`, `src/shared/`, `src/theme/`, `src/store/`,
`src/domain/`; PWA-only: `src/pwa/` (9 files) and `pwa/main.tsx`. Never shipped to the PWA: `src/shell/`
(AppShell, app switcher, harness bar, PhoneFrame, Gradient Lab), `src/apps/web`, `src/apps/admin`,
`src/apps/demo` (README "Second build target", lines 179 to 210: 163 modules, 139 shared). Mobile layout
reads `--aa-inset-*` variables, never the viewport (P:67, `visual/mobile-insets.spec.ts`). Several phase
docs require "PWA-safe" shared modules (no import from `apps/*` or `shell/*`).

### (d) Demo guide beats naming controls

`docs/demo-guide/` (01 personas 332 lines, 02 workflows 599, 03 demo script 877, 04 cheat sheet 552,
`master-demo-guide.html` 1678). The script names controls by **label and place**, about 264 distinct bold
labels in 03. Ones a unification could alter: the "Demo actions" **pill** in the top bar and the amber
**Demo chip** opening a sheet (03 lines 36 to 38; 04 lines 306 to 309); **Mark complete** "pinned to the
bottom of the phone" and "the masthead folds to a nav row" (03 lines 186, 199 to 201); the **Bookings still
to finish** sheet (03 line 196); **Save** and **Done** in the mobile calendar (03 lines 229 to 233); the Admin
List **drawer** and its texts (03 lines 289, 332, 398, 438, 466 to 484); **tier pills** and "See everyone"
(03 lines 275, 333, 496); the **Theatre maintenance closure pill** on Master data (03 line 365); the
**authorisation banner**, rows locking and the Review queue count (03 line 514); **Authorise for billing →
Confirm** (03 line 510); the **AA fee chip** (03 line 629); the mobile calendar button and Lists tab scroll
(03 lines 645, 650); "Other price" described as the step rail's **toggle** (04 line 21); sheet questions such
as "Where does this List go?" (03 line 352). Sheets and drawers are "deliberately not in the URL" (03 line
104). No test reads `docs/demo-guide` today (Phase 44 adds `demoGuideSync.test.ts`). CLAUDE.md: behaviour
changes that affect a scripted beat must be mirrored in the guide and `master-demo-guide.html`.

### (e) Component catalogue and ui-library-preview

- **Catalogue** `aa-prototype/src/apps/demo/catalogue/` (routes `/demo/catalogue/admin|web|mobile`, URL only):
  `AdminCatalogue.tsx` 64 `<CatalogueRow>`, `WebCatalogue.tsx` 52, `MobileCatalogue.tsx` 54 (170 rows),
  grouped under replacement-library sections (`#lib-shadcn`, `#lib-sonner`, `#lib-tanstack`, `#lib-forms`,
  `#lib-daypicker`, `#lib-motion`, `#lib-numberflow`, `#lib-custom`), with examples in `admin/`, `web/`,
  `mobile/` and `CatalogueKit.tsx`. **Tests assert row names and counts**: AdminCatalogue.test.tsx requires
  rows `Button`, `SlotDrawer`, `DayGrid`, `CodePickerSheet`, `SuccessOverlay`, `InvoiceDocument`,
  `MiniCalendar (RightRail)`, `AuditViewer`, `Dialog (useSurface().Overlay)` and `>= 35` rows; MobileCatalogue
  requires `BottomSheet`, `ListOptionsSheet`, `SlideStack`, `BottomTabBar`, `MonthGrid (LookbackDateSheet)`,
  `SuccessOverlay`, `UpdatePrompt`, `BookingDetailBody`, `HalfBlock`, `useTickingValue`, `>= 30` rows and no
  en/em dashes; WebCatalogue requires `WebNav`, `Panel`, `SlidingSegmentedControl`, `StatusLegend (toggle
  mode)`, `Dialog (web Overlay)`, `Lists table (Th · Td · GroupRow)`, `WeekStrip`, `BookingTotalPanel ·
  useTickingValue`, `TickBadge`, `HistoryTimeline`, `SubmitAction`, `>= 40` rows, and the library section
  ids. Renaming, merging or removing these components means editing the rows and the tests in step
  (CLAUDE.md: "Keep its rows in step when components are added, renamed or removed"). The library-group
  framing (shadcn, Sonner ...) reflects the parked library migration; an own-component consolidation would
  need either to keep it or to re-group and update the tests. Phase 42's `masterViews.ts` registry also
  carries `catalogueRows: string[]`.
- **ui-library-preview/** (port 5182; `ui-library-preview/README.md`): throwaway, demo-only, "a deliberate
  exception to one prototype folder ... It never changes aa-prototype/ and is never deployed"; listed as
  untracked (`?? ui-library-preview/`) in git status. `@proto` aliases `../aa-prototype/src`
  (`vite.config.ts` line 86), compiled by the preview's own Vite with React 19, never type-checked
  (`src/proto.d.ts` declares it loosely), so **a rename or move breaks at runtime, not at tsc**. 93 files
  import 66 distinct `@proto/...` paths, mostly barrels (`@proto/store` 60, `@proto/shared/format` 36,
  `@proto/shared` 25, catalogue fixtures `web/fixtures` 22 and `admin/adminData` 16, `@proto/shared/ui`,
  `@proto/shared/flows`, `@proto/shared/capture`, `@proto/shared/warnings/useBookingWarnings`,
  `@proto/shared/flows/MovedToYouPanel`, `@proto/apps/admin/components/pairing/DraftListCandidates`,
  `@proto/apps/admin/util` ...). A Vite plugin redirects the catalogue's `./CatalogueKit` import to
  `src/kit/ProtoKitShim.tsx`, and replacements are keyed by (app, catalogue row name): **renaming a
  catalogue row orphans its replacement; moving a file or dropping a barrel export breaks that slice's
  rows** (the registry loads slices one by one, so the error stays on those rows). `rows.json` (170 names)
  and `ROWS.md` list the rows. Its README "Known gaps" already says it fails to load while the prototype
  is mid-edit; being throwaway, the consolidation need not keep it working, but should say so.

### Done-criteria commands

From `aa-prototype/` (`aa-prototype/package.json` scripts):

- `npm run build` (`tsc -b && vite build`, framed prototype to `dist/`)
- `npm run build:pwa` (`tsc -b && vite build --config vite.pwa.config.ts`, to `dist-pwa/`)
- `npx vitest run` (or `npm test`)
- `npm run shots` (`playwright test`; boots 5173 and 5174 itself with `reuseExistingServer`)
- `npm run lint` (oxlint; used in the July fixes, not in the catch-up green list)

From the repo root (`package.json`):

- `npm run verify:board` (board typecheck, Vitest, catalogue check), required by every catch-up phase
- `npm run dev` (prototype 5173 + PWA 5174 + board 5180) before capture; then in `requirements-board/`:
  `node scripts/capture.ts --dry`, then `npm run capture`
- Plan checks if phases are added: `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs --check`,
  `node requirements-board/agent/skills/update-build-plan/tools/build-index.mjs`,
  `node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --coverage`

Timings: `npx vitest run` measured today on the current working tree: **183 files, 2,023 tests, all
green, 83s (about 88s wall)**. Build, PWA build, shots and capture were not run (read-only task; they
write `dist/`, `dist-pwa/`, `visual/shots/`); no timings are recorded in PROGRESS or the READMEs.
