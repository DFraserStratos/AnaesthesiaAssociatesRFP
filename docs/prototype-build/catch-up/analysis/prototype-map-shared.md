# Prototype map: `aa-prototype/src/shared` + `src/theme`

All paths relative to `aa-prototype/src/` unless prefixed. Line numbers are approximate anchors from the code as read.

**Orientation.** `shared/` holds UI and logic used by two or three of the apps (mobile, web anaesthetist, admin/office). It has NO routes of its own. Its centrepiece is the **Card detail** (`shared/card/CardDetailBody.tsx`): one component that renders a booked case ("Card") with patient, times, attachments, notes, per-procedure BTM (Base/Time/Modifier units) capture, billing lines, price override, copy/cancel/post-op, pre-payment gate and mark-complete. Mobile (`apps/mobile/screens/CardDetailScreen`), web (`apps/web/screens/CardDetailView`) and admin (`apps/admin/screens/AdminCardDetail`) are thin chrome wrappers. Platform differences (bottom sheet vs dialog, one column vs two-column grid, whether a fee is shown) are injected via `useSurface()` (`shared/surface`). The actor's role (`anaesthetist` / `office`) decides what is editable and whether money is shown. All writes call audited store actions in `store/` (`editCard`, `editProcedure`, `completeCard` ...); maths is pure in `domain/billing`. Also here: Add-card flows (manual form + simulated photo OCR + simulated NHI lookup), audit-trail presentation (`shared/audit`), formatting helpers, demo-clock shortcuts. `theme/` = tokens, status colours, motion, haptics, mobile gradient (visual only).

**Contents**
1. Routes/screens (none) and who mounts what
2. Surface seam (`shared/surface`)
3. Card detail body (`shared/card`)
4. Capture blocks (`shared/capture`)
5. Flows and sheets (`shared/flows`)
6. Audit presentation (`shared/audit`)
7. Schedule row, status components, UI primitives, format
8. Demo/simulator affordances
9. Business rules and validations index
10. Stubbed / hardcoded / visual-only
11. Theme (tokens only)

---
## 1. Routes / screens
`shared/` defines no routes. Consumers (from grep of `apps/`, `shell/`, `pwa/`):
- `CardDetailBody`: `apps/mobile/screens/CardDetailScreen.tsx`, `apps/web/screens/CardDetailView.tsx`, `apps/admin/screens/AdminCardDetail.tsx`.
- `AddCardFlow`: `apps/web/screens/ListDetailView.tsx`, `apps/admin/flows/PhoneAdviceBooking.tsx`, `apps/mobile/routes.tsx`, `apps/mobile/components/SlideStack.tsx`.
- `RequestCoverSheet`: `apps/web/WebApp.tsx`, `apps/mobile/routes.tsx`, `apps/mobile/screens/AvailabilityScreen.tsx`, `SlideStack.tsx`.
- `SubmitListSheet`: `apps/web/screens/ListDetailView.tsx`, `apps/mobile/screens/ListDetailScreen.tsx`.
- `HistorySheet`: `apps/admin/screens/ReviewScreen.tsx`, `apps/admin/components/ListDrawer.tsx` (and inside CardDetailBody, so all three apps).
- `ListRow`: `apps/admin/screens/BillingMonitorScreen.tsx`, `apps/mobile/screens/ForwardListsScreen.tsx`.
- `StatusLegend`: `apps/web/screens/ListsScreen.tsx`, `apps/admin/components/DayGrid.tsx`.
- `SuccessOverlay`: mobile `ListDetailScreen`, admin `flows/ReassignListFlow.tsx`.
- `demoClockShortcuts`: `apps/demo/DemoControlPanel.tsx`, `shell/DemoClockMenu.tsx`, `pwa/PwaDemoPanel.tsx`.
- Audit helpers (`coalesceAudit`, `actionLabel`...): `apps/admin/screens/AuditViewer.tsx` + `HistoryTimeline`.
- `SurfaceProvider` mounted in `apps/web/WebApp.tsx`, `apps/admin/AdminApp.tsx`; mobile uses the default mobile surface.

## 2. Surface seam: `shared/surface/`
- `context.ts`: `Surface { variant: 'mobile'|'web'; Overlay; Footer; CardLayout; CardTotal; Pair }`; `useSurface()` throws outside a provider. Types `CardLayoutSlots` (header, history, banners, context, capture, actions, summary, completeBar, overlay), `CardTotalProps { units, fee, lines, rateLabel, overrideNote, action }`, `CardTotalLine`.
- `SurfaceProvider.tsx`: two bundles. Mobile (~l.301): `Overlay=BottomSheet`, `CardTotal: () => null` (phone never shows a fee), `Pair=MobilePair` (stack). Web (~l.309): `Overlay=Dialog`, `CardTotal=CardTotalPanel`, `Pair=WebPair` (side by side). `MobileCardLayout` (l.42): single scroll column, masthead folds on scroll (thresholds), pinned completion dock, publishes `--aa-dock-height` CSS var, reads `--aa-inset-bottom`. `WebCardLayout` (l.184): 12-col grid, banners span 12, capture span 8, sticky commit rail span 4 (calculation + complete bar + patient/time/attachments/notes + actions).
- `BottomSheet.tsx` (slide-up 320ms, scrim, drag handle), `Dialog.tsx` (centred, Escape/scrim closes).
- Stale comments mention "Fee / Units / Off" calculation modes (`context.ts` l.96/122, `BtmCaptureBlock` l.57). No such mode switch exists in code (grep found none): the fee is shown by role only.

## 3. Card detail body: `shared/card/CardDetailBody.tsx`
Props `{cardId, actor, onBack, onCopied, header?}`. Reads store: card, lists, procedures, billingLines, masters, `prepaymentStatusFor`, audit, `useToday`.

**Permission/state model (l.314):** `canEdit = !cancelled && list.state !== 'AUTHORISED' && (list.state==='DRAFT' || actor.role==='office')`; `canCapture = canEdit && !card.completed`. So: anaesthetist edits own DRAFT only; office edits DRAFT and SUBMITTED; AUTHORISED locked for all. Mirrors `store/lifecycle.ts:48 editRefusal` (also blocks non-owner anaesthetist, integration on non-DRAFT). `showCardTotal = actor.role !== 'anaesthetist'` (l.134): anaesthetist sees no fee/units calculation.

**Sections (slots):**
- Banners (l.487+): Card cancelled (shows `card.cancellation.reason`; excluded from list completion count and billing); Post-op addendum note (`cardType==='postOpAddendum'`); Pre-payment banner by `prepaymentStatus` (`none|required|outstanding|overridden|paid`, from `store/selectors.ts:372`), with note "timing vs AUTHORISED trigger is an RFP open question"; office-only buttons "Raise pre-procedure invoice" (`raisePreProcedureInvoice`, when `required`) and "Override gate" (opens `PrepaymentOverrideSheet`); generic `error` box; post-latch validation box (`completeError` + card-level failures).
- Context: Patient (NHI badge via `nhiBadge`, name, DOB + age via `ageYears`/`formatDob`, phone as "Contact"; Edit link opens `EditPatientSheet`); Scheduled time with -5/+5 min steppers (`stepTime` -> `editCard {scheduledTime}`, `shiftTime` clamps 00:00 to 23:55, default base 08:00); Attachments (Add = `addPhoto`, always adds hardcoded `PAPER_CARD_A` sample image named "Photo n", id `${cardId}-A${n}` with n = highest existing +1; Remove per attachment via `editCard {attachments}`); "Notes for the office" textarea saved on blur via `editCard {notes}`.
- Capture: per procedure a `BtmCaptureBlock` (ordinal = position sorted by procedure id), plus for office actor `OfficeBillingSetup`; "Add another procedure" (`addProcedure`) when `canCapture`.
- Actions: "Copy for an additional procedure" (`copyCard`), "Cancel card" (opens `CancelCardSheet`) when `canEdit`; "Add post-op event" (`addPostOpAddendum`) shown on cards in an AUTHORISED list that are not already addenda: creates a new linked card on "today's free session for this anaesthetist"; original stays immutable.
- History: button opens `HistorySheet` with entity ids = card + procedures + billing lines + removed procedures/lines recovered from `procedure.remove` audit snapshots (l.260); multi-procedure cards label rows "Procedure n · desc".
- Summary: `CardTotal` (web office only) with `cardFee`/`procedureFee` totals, per-procedure lines (or per fee line for one procedure), rate label ("FEE @ $x/UNIT" or "FIXED CONTRACT PRICE", only if all procedures agree), override note ("Override applied · was $x").
- Complete bar + `CompletionOverlay`.

**Validation latch (l.175, l.375):** live `validateCardForBilling(card, procedures, ctx)` (domain/billing) runs always; failures shown only after a refused "Mark complete" (`showValidation` latch), then live-clear; on refusal scrolls/focuses the first failing control via `data-validation-procedure-id`/`data-validation-fields` attributes. `completeCard` (`store/lifecycle.ts:130`) refuses using `completionBlockersFor` (l.93): (1) billing validation failures, (2) pre-payment gate unpaid (`prepaymentUnpaid`, when status `required|outstanding`). Amend = `uncompleteCard`. Overlay auto-dismiss timer then `onBack`.

**`OfficeBillingSetup.tsx`** (office only, per procedure): rows Route (`ROUTE_LABELS`), Insurer (`(informational)` if route hospital), Category and Payer (billableParty route; payer shown with relationship, default "Patient (default)"), Contract, Reference (flagged "Missing" via `billingReferenceMissing`), Override (fixed fee / +-$ / +-%), Funders ("n of m lines reallocated"). Buttons open `EditBillingSetupSheet`, `PriceOverrideSheet`, `FunderAllocationSheet` when `canEdit`.

**`HistorySheet.tsx` / `HistoryTimeline.tsx`**: Overlay listing merged audit entries for the entity ids, newest first (`sortAuditNewestFirst`), day headings, "who . role . source" line (collapsed if role==source), change ledger `LABEL old -> new`, coalesced groups with count chip and toggle. Read-only. Empty state names subject ("card"/"list").

## 4. Capture: `shared/capture/`
`BtmCaptureBlock.tsx` composes per procedure: header ("PROCEDURE n" only if >1 procedures; description or "Operation to capture"); **Edit** button only when `list.state==='DRAFT'` (l.119; so office cannot open EditProcedureSheet on SUBMITTED, they use OfficeBillingSetup) and **Remove** only for ordinal>1 and `canCapture`; read-only billing context line (route chip: "Hospital / contract holder", "Billable party", "Insurer (direct claim)" or "Route not set", + contract . insurer . billable party . reference); additional-procedure note ("bills for time units only; base and modifier units stay on the first procedure"). Then `AsaCard` + `ProcedureCodeCard` (Pair), `TimesCard`, `UnitsCard`, `OverrideCard` + `BillingLinesCard` (Pair), `NotesCard`, and "Also outstanding" unanchored failures. Write policy: write-through audited `editProcedure` per tap for steppers/chips/ASA/nudges/stamps; free text on blur/Save.

- `AsaCard`: ASA class segmented control (sets `asaClass`); caption from `ASA_SEED_UNITS`; none-selected allowed; disabled on additional procedures.
- `ProcedureCodeCard` + `CodePickerSheet`: RVG base code picker (search code/name, grouped by anatomical site). Pick clears `baseUnitsSelected` and `baseUnitsCaptured`. Range codes (`baseUnits.kind` != single) show an in-range stepper writing `baseUnitsSelected`. If code absorbs P1: caption "Includes positioning; P1 is not added separately." Validation fields `rvgBaseCode`, `baseUnitsSelected`.
- `TimesCard` (+ `timeIso.ts`): "Start now"/"Finish now" stamp the demo clock (`clockISO`); Finish stamp falls back to start+5 min if clock earlier; -5/+5 nudges keep >=5 minutes between start and finish. String maths on local-naive ISO (no UTC, NZ DST note). Fields `anaestheticStartISO`, `handoverISO`.
- `UnitsCard` (l.42): B/T/M rows read the resolved `BtmBreakdown`; a step writes `{units: resolved+-1, source:'overridden'}` (floor 0); "Adjusted manually . Use seeded value" resets (no auto-clear on equality). On additional procedures B and M are not steppable ("Not charged on an additional procedure"). T caption "part intervals round up (assumption)". M caption lists composition e.g. "AS1 +0 . A1 very old +1", omitting refused modifiers.
- `ModifierChips` (+ `modifierLabels.ts`): three exclusive bands (PA, A, OB) as segmented controls (from domain `modifierBandOf`), free-stacking codes (PA5, ASE, P1, AI1, PO1, PO2) as chips ("Also applies"); writes `selectedModifierCodes` via `toggleModifierCode`; absorbed codes shown struck through with domain refusal text.
- `OverrideCard`: modes none / adjustment ($, non-zero, negative reduces) / charge (fixed fee, >0); MANDATORY reason; writes typed `priceOverride` `{kind: dollarAdjustment|fixedFee, amount, reason}`. Percent variant is office-only (`PriceOverrideSheet`).
- `BillingLinesCard` + `AddBillingLineSheet`: lists non-RVG lines; Remove hidden for anaesthetist on `funderOverride` lines ("Billed to <counterparty>"); Add sheet: basis Fixed amount (`amount>0`) or Rate x time (hours x rate, previewed with `roundToCents`), latter only if governing `contract.permitsIndividualArrangement` (else disabled with validator sentence). Calls `addBillingLine`/`removeBillingLine` (`store/billingLineActions.ts`).
- `NotesCard`: Int notes and Op notes, commit on blur.
- `feeContext.ts`: `procedureFee` (feeFor with governing contract = stored explicit `governingContractId`, ordinal, non-rvg lines, surgeon) and `cardFee` (sums billable units and fee, rounds 2dp). `CardTotalPanel.tsx`: desktop ink panel with ticking numbers (`useTickingValue`: 320ms tween, green flash). `CompleteBar.tsx`: "Mark complete" / completed bar + "Amend" (only when `canAmend`). `CompletionOverlay.tsx`: tick pop; `N units . $X` line only if `showCalculation` (office). `ui.tsx`: `CaptureSection`, `Caption`, `FailureNotes`.

## 5. Flows/sheets: `shared/flows/` (all via `useSurface().Overlay`)
| Component | What the user does | Store call / notes |
|---|---|---|
| `AddCardFlow` | "Add a card": chooser -> Manual form or Photo path -> "Card added" (says if patient reused) | Back chevron between prongs |
| `ManualCardForm` | Patient (NHI w/ "Look up NHI" button, name, DOB, phone, ethnicity code from lookup), Operation (RVG code picker, operation text, scheduled time free text e.g. "15:30"), Billing route (hospital/insurer/billableParty; insurer dropdown; payer dropdown "The patient pays"; payment category; billing reference) | `createCard(api, actor, listId, {...})` (`store/cardActions.ts:70`); patient dedupe by NHI (`patient.reuse` audit); optional `attachment` |
| `PhotoCaptureFlow` | Pick sample paper card A or B, 900ms simulated processing, review pre-filled form | DemoBadges "Simulated capture", "Simulated OCR"; canned data `sampleExtractions.ts` (A: Wiremu Tane, RVG 20941, hospital, NHI ZBC1123; B: Losa Tuilagi, 49558, insurer I-NIB, NHI JKL1188) |
| `CancelCardSheet` | Reason required | `cancelCard` (`lifecycle.ts:363`) |
| `PrepaymentOverrideSheet` | Mandatory reason to lift pre-pay gate | `overridePrepaymentGate` (`prepaymentActions.ts:181`) |
| `RequestCoverSheet` | kind `offer` (hand over own free session) or `request` (ask colleague), optional message | `requestCover` (`lifecycle.ts:844`); copy addresses "Dr Surname" |
| `EditPatientSheet` | name, DOB, phone, email, address | `editPatient` (`store/intake.ts:145`) |
| `EditProcedureSheet` | operation, billing route, insurer, payment category, billing reference | `editProcedure` |
| `RemoveProcedureSheet` | confirm; states billing lines removed; no reason field | `removeProcedure` (`cardActions.ts:474`; first procedure refused) |
| `EditBillingSetupSheet` | office: route, insurer, category, governing contract, reference, billable party incl. "New guardian" (name, relationship, contact) which creates a BillableParty first | `editProcedure` (+ billable-party create) |
| `PriceOverrideSheet` | office: fixed fee / $ adj / % adj, reason required | `editProcedure {priceOverride}` |
| `FunderAllocationSheet` | office: per billing line choose funder + amount; shows allocated vs fee; Save blocked unless reconciles | `setProcedureFunderAllocation` (`billingLineActions.ts:218`, atomic; `allocationNotConserved` backstop) |
| `SubmitListSheet` | mode `blockers`: lists incomplete non-cancelled cards with verbatim validation messages (via `completionBlockersFor`) or "Ready to complete"; mode `confirm`: explains SUBMITTED then confirms | `submitList` (`lifecycle.ts:225`) |
Billing route labels: `ROUTE_LABELS` in `format.ts` (hospital="Contract holder", billableParty, insurer). Payment categories: selfFundedPostProcedure "Self-funded", selfFundedPrepayment "Pre-payment", insuredReimbursement "Reimbursement".

## 6. Audit presentation: `shared/audit/`
Read-only view layer over `AuditEntry {id, entityType, entityId, who, role, source, action, before?, after?, atISO}` (`domain/types.ts:645`). `actionLabels.ts` (`ACTION_LABELS`, ~100 action codes such as `card.*`, `list.*`, `procedure.*`, `billingLine.*`, `xero.*`, `invoice.*`, `settings.*`; unmapped codes get a derived label), `fieldLabels.ts` (`FIELD_LABELS`, ~170), `auditNarrative.ts`: `auditFieldChanges` (diff over union of keys; "not set"; seeded-fallback keys show "back to the seeded value"; money keys formatted), `formatAuditValue`, `sortAuditNewestFirst`, `coalesceAudit` (l.308: merges consecutive single-field edits by same actor/entity/timestamp into one net row with steps), `formatAuditStamp` ("d MMM HH:mm"), `summariseAuditChanges`. Has Vitest coverage. Never writes.

## 7. Schedule row, status components, UI primitives, format
- `schedule/ListRow.tsx`: mobile-style list row; `ListRowRight` kinds `doneUnbilled | toFinish(count) | count(statusKey) | offerCover | chip | custom`; variants default/free/holiday; session AM/PM + mono time.
- `StatusChip`, `StatusBlock`, `StatusLegend` (variant `full`|`chips`, optional toggle filter): six statuses (private, public, preop, holiday, unavailable [hatched], free [dashed]) from `theme/statusColours.ts`. `Avatar` (initials), `Logo`, `Wordmark`, `DemoBadge` (warning-tint "Demo simulation" pill).
- `ui/`: `Button` (variants incl. secondary, pill; block), `TickBadge`, `SuccessOverlay` (circle pop + tick + haptic; tap-to-dismiss safety valve), `Field` (`FieldLabel`, `TextField`, `TextArea`, `Segmented`), `SlidingSegmentedControl`, `DockSpacer` (scroll tail spacer under floating dock/tab bar).
- `format.ts`: `dayMicroCap` ("TUE 21 JUL"), `hhmm`, `dateTimeMicroCap`, `dayHeading` (TODAY prefix), `formatDob`, `ageYears`, `sessionTimeRange` (uses list's actual startTime/endTime else "Morning"/"Afternoon"), `sessionStart`, `nhiBadge` ("NHI ABC1234" or "NHI pending" using `domain/nhi validateNhi`), `mondayOf`/`weekDays`/`shiftWeeks` (Monday-anchored), `formatCurrency` (NZD 2dp, no GST logic), `routeLabel`, name helpers `nameWithoutTitle`, `surnameOf`, `drSurname`, `initialsOf`. Tests in `format.test.ts`.

## 8. Demo / simulator affordances in this area
- `demoClockShortcuts.ts`: shortcut list used by presenter clock surfaces: +15 min, +1 hour, Next day, Next morning, +7 days, "Procedure day . 28 Jul" (`S1_PROCEDURE_DAY='2026-07-28'`, disabled once today >= that date). Calls `store/clockActions`. Clock is forward-only.
- `ManualCardForm`: "Look up NHI" button with DemoBadge "NHI FHIR lookup . Digital Services Hub", calls `domain/nzhis.ts:116 lookupNhi` (canned fictional patients; hit fills name, DOB, phone, ethnicity; can prefill a whole booking via `emptyLookupPrefill`).
- `PhotoCaptureFlow`: fake OCR (900ms timer), two canned sample cards.
- `DemoBadge` used to mark simulators elsewhere. Phone Advice booking uses `AddCardFlow` (admin).
- `theme/gradientLabGate.ts`: `GRADIENT_LAB_ENABLED = true`, the only feature flag (temporary Gradient Lab UI in `shell/gradientLab`).

## 9. Business rules / validations index (visible in this area)
- Edit rights: `CardDetailBody:314` + `store/lifecycle.ts:48` (see section 3).
- Completion blockers: billing validation + pre-payment gate (`lifecycle.ts:93`). Refusal text rendered verbatim.
- Pre-payment states and office actions: `prepaymentStatusFor` (`selectors.ts:372`); B7 gate; override needs reason and is audited.
- Cancel: reason required; card stays visible, excluded from completion count and billing.
- Copy card for additional procedure; additional procedure bills time units only (B and M locked).
- Post-op addendum on authorised card (B8): new linked card, original immutable.
- Type 3 (fixed-price contract) second-procedure pricing depends on ordinal (`feeContext.ts`); governing contract is stored explicit, not auto-selected.
- Billing lines: Method 3 rate x time only if contract `permitsIndividualArrangement`; funder allocation must conserve procedure total; anaesthetist cannot remove funder-override lines.
- Price override: reason mandatory; kinds fixedFee / dollarAdjustment / percentAdjustment (% office only).
- BTM provenance (`source: 'overridden'`) kept until explicit reset.
- Time capture: demo clock authoritative; min 5-minute gap; first procedure cannot be removed.
- Billing reference: `billingReferenceMissing(procedure)` flagged for hospital route in OfficeBillingSetup.
- NHI: `validateNhi`, "NHI pending" provisional state.
- Attachments: photos only (kind 'photo').

## 10. Stubbed / hardcoded / visual-only
- Attachment "Add" always inserts the same sample image `PAPER_CARD_A` (no camera/file upload). Photo OCR is canned, not real.
- NHI lookup is a canned in-memory table.
- Calculation shown only for office role on web/admin; phone never shows fee (`CardTotal: () => null`).
- Stale "Fee/Units/Off mode" comments with no matching code.
- Pre-payment banner text hardcodes "RFP open question" wording.
- Post-op addendum copy hardcodes "today's free session" placement.
- Scheduled time is a free-text/stepper field (no calendar validation in ManualCardForm; typed "e.g. 15:30").
- `formatCurrency` has no GST/rounding rules; GST handled elsewhere (domain).
- Haptics: `navigator.vibrate` no-op on iOS.
- Read-only CardDetail patient section shows only phone; email/address editable in `EditPatientSheet` but not displayed in the body.

## 11. Theme (tokens only)
`theme/tokens.ts`: neutrals (ink #172320 ... surface), `brand` crimson #A91E3E (identity only), `accent` teal #0D6E63 (only action colour), `semantic` success/warning/error triples, radii, elevations. `statusColours.ts`: six statuses (solid/tint/onTint/label/treatment), `STATUS_ORDER`, `freeDashedBorder`, `unavailableHatchTint`. `motion.ts`: four named patterns (sheetIn 320/260ms, value tick, complete tick, card advance) + easings. `haptics.ts`: complete-tick vibrate 12ms at `hapticAt`. `mobileGradient.ts`: `AA_DEFAULT_GRADIENT` phone atmosphere. `global.css`: Tailwind `@theme` mirror, keyframes, reduced-motion, inset vars. No requirement-relevant behaviour.
