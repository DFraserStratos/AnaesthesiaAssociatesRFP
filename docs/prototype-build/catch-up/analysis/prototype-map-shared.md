# Prototype map: aa-prototype/src/shared and src/theme

Orientation. `src/shared` is the code the three apps (mobile, web, admin) and the installable PWA all import. It owns NO routes: there is no `<Route>`, `navigate()` or path in it. Screens live in `src/apps/*`; this folder supplies the Booking detail body (patient, payer, funder, per-procedure capture, billing step rail, completion), every Booking and List sheet or dialog ("flows"), availability editing, the List row and progress words, warnings, audit-trail reading, the demo-trigger registry, and the UI primitives and overlay seam. Everything reads or writes through `useAppStore` and audited store actions (`editProcedure(useAppStore, actor, ...)` style; every action returns `{ok, message}` or `{ok, value}`). Nothing here calls `fetch`. `src/theme` is tokens, motion, status palette, haptics, and the mobile gradient only. Platform differences come through `useSurface()` (`variant: 'mobile' | 'web'`), not branching in bodies. All paths below are under `aa-prototype/src/`. Rules live in `src/domain` (not mapped here); this folder renders them.

## Contents
1. Folder index (what each subfolder is)
2. Booking detail body (the main "screen" shared by three apps)
3. Billing card and step rail (contract choice and price)
4. Capture cards (times, units, modifiers, RVG code, override, lines, notes, completion)
5. Flows (sheets and dialogs), by store action
6. Availability editor
7. Schedule row, progress, lookback, status master
8. Warnings
9. Audit and history reading
10. Surface seam, modal stack, UI primitives
11. Demo triggers and demo affordances
12. Format, terms, labels
13. Theme (tokens only)
14. Hardcoded, stubbed, visual-only and notable absences

## 1. Folder index

| Folder or file | Holds |
|---|---|
| `shared/booking/` | `BookingDetailBody`, `BillingCard`, `ProcedureStack`, `PaidByRow`, `OfficeBillingSetup`, payer and funder views, `HistorySheet`, `HistoryTimeline`, `PartyPicker`, `ContractApprovalLine`, `ProcedureContractRow` |
| `shared/capture/` | per-procedure capture cards, fee assembly (`feeContext.ts`), completion bar and overlay |
| `shared/flows/` | sheets and dialogs: add booking, cancel, patient, payer, funder, split, remove procedure, price override, move list, move booking, alert office, submit list, contract rail |
| `shared/availability/` | availability form, slot panel, series list, outcome wording, month cells |
| `shared/schedule/` | `ListRow`, `ProgressPill`, `ListInvoices`, lookback hooks and copy, out-of-hours moon |
| `shared/status/useSlotStatuses.ts` | the availability status master as hooks |
| `shared/warnings/` | warning hooks, panel, triangle, tone |
| `shared/audit/` | pure audit reading layer (labels, field diffs, coalescing) |
| `shared/surface/` | `SurfaceProvider`, `BottomSheet`, `Dialog`, `ConfirmSheet`, `OverlayHeader`, `SheetActions`, `useModalLayer` |
| `shared/ui/` | Button, Pill, Field, Notice, ResultLine, EmptyState, SlidingSegmentedControl, SuccessOverlay, DoneStep, NameSearchBox, popover, etc. (`ui/README.md` is the component table) |
| `shared/calendar/MonthGrid.tsx` | mobile date-lookup month grid |
| `shared/contracts/` | `ContractSelect` (admin-style dropdown), `labels.ts` (Party, Contract, pricing words) |
| `shared/demoTriggers/` | registry of demo actions, route matching, UI-only context and memory stores |
| `shared/legacy/` | old `/cards/:id` link redirect helpers (`C####` to `BK####`, `HC##` to `HBK##`) |
| `shared/format.ts`, `scheduleTerms.ts`, `outOfHoursTerms.ts`, `demoClockShortcuts.ts`, `DemoBadge.tsx`, `Avatar`, `PersonaChip`, `Logo`, `Wordmark`, `StatusChip`, `StatusBlock`, `StatusLegend` | words and small shared parts |
| `theme/` | `tokens.ts`, `statusColours.ts`, `motion.ts`, `haptics.ts`, `mobileGradient.ts`, `gradientLabGate.ts`, `global.css` |

`shared/index.ts` re-exports only a subset (Logo, Wordmark, Avatar, StatusChip/Block/Legend, status hooks, DemoBadge, SurfaceProvider, Button and Field parts, ListRow, ProgressPill, warnings). Most consumers import deep paths (`shared/booking`, `shared/capture`, `shared/flows`).

## 2. Booking detail body: `shared/booking/BookingDetailBody.tsx`

Mounted by the thin chrome wrappers of mobile `BookingDetailScreen`, web `BookingDetailView` and admin Booking page (those are in `apps/*`, not mapped here). Props: `bookingId`, `actor`, `onBack`, optional `header`. It builds slots and hands them to `useSurface().BookingLayout`.

Reads: booking, lists, procedures, billingLines, masters, audit, `prepaymentStatusFor`, `useBookingWarnings`, `useToday`. Writes via store actions: `editBooking` (notes on blur; scheduled time +/-5 min stepper `stepTime`, line 372 region, clamps 00:00 to 23:55, starts from 08:00 if unset), `addProcedure` (then `setRailAnswers` to seed the new procedure's rail with the first procedure's answers or its Contract if still on offer, lines 322-345, 392), `completeBooking` (line 398), `uncompleteBooking` (Amend), `addPostOpAddendum` (line 485), `raisePreProcedureInvoice` (line 481), plus sheets below.

Sections shown (office and anaesthetist alike unless noted):
- Banners (line 500s): `WarningsPanel` first (US-13.7.3); "moved to you by" notice (`useBookingMovedToMeNotice`); cancelled notice (reason; "excluded from completion count and billing"); post-op addendum note; prepayment received (green) when `prepaymentStatus === 'paid'`; action error; completion-refusal notice with booking-level failures after the validation latch; for anaesthetists, "office puts the Contract or price right ... Alert the office" note when any failure has `fixableBy === 'office'`.
- Patient: NHI badge (`nhiBadge`: "NHI ABC1234" or "NHI pending"), DOB and age (`ageYears` against demo today), phone, Scheduled time with +/-5 steppers; Edit opens `EditPatientSheet`.
- Payer section (`PayerDetailsView`): name, relationship, email, postal address; chips "Email or postal address needed" (`payerContactMissing`), "Under 18" (`childPayerOn`); office alone sees "Not invoiced: every procedure bills its Contract's holder" (`onlyHoldersBilled`). Change opens `PayerSheet`.
- Insurer or funder (`FunderDetailsView`): name, kind, approval number, or chip "No approval number" (`approvalNumberMissing`), or "None, the patient pays". Opens `FunderSheet`.
- Source line: `BOOKING_SOURCE_LABELS` (display only, DM-39).
- Notes for the office: textarea, saved on blur.
- Capture column: DRAFT list shows procedure labels with RVG code and "The fee shows once an anaesthetist is assigned" (no capture on a Draft List). Otherwise one `BtmCaptureBlock` per procedure (ordinal order) plus, for office actor, `OfficeBillingSetup`; "Add another procedure" button when `canCapture`.
- Actions: `AlertOfficeEntry` (anaesthetist) or `OfficeAlertLine` (office); "Move to a colleague" (`canMove`); "Cancel booking" (reason sheet); "Add post-op event" only when `list.state === 'AUTHORISED'`, not a backdrop list (`isBackdropList`) and not itself an addendum.
- History link opens `HistorySheet` with the Booking's own id plus its procedure ids, billing line ids and ids of removed procedures and their lines recovered from `procedure.remove` audit snapshots (lines 289-330, so removals stay reachable).
- Summary (`BookingTotal`): office only (`actor.role !== 'anaesthetist'`, line 158; anaesthetist Booking shows no money), hidden when cancelled, no procedures, or DRAFT. Totals from `bookingFee`; breakdown rows per procedure (multi) or per fee line (single procedure with several lines); rate label "FIXED CONTRACT PRICE" or "FEE @ $x/UNIT" shown only when every procedure agrees; per-row note "Time units only" for an additional procedure on a unit-rate; `needsPrice` flag; override note "Override applied, was $x" (lines 218-285).
- Complete bar (`CompleteBar`) and completion overlay (1050 ms auto-dismiss, tap to dismiss; line 451).

Rules in this file:
- `canEdit = !cancelled && editRefusal(actor, list) === null` (line 359): store gate; office edits ACTIVE and SUBMITTED not AUTHORISED; anaesthetist edits own Lists until authorised (catch-up Phase 38a). `canCapture = canEdit && !booking.completed`.
- `canMove` (line 363): anaesthetist, `actor.source !== 'integration'`, `bookingMoveRefusal(...) === null` (own ACTIVE List, today or later).
- Completion rule: `completeBooking` store action decides; live per-field failures come from `completionFailuresFor(booking, procedures, completionContextFor(...))` (domain/billing/completion). Failures render only after the first refused Mark complete (latch `showValidation`), then live-clear. On refusal the first failing field is found by `[data-validation-fields]` and `data-validation-procedure-id`, focused and scrolled (lines 398-440).
- Overlay dismisses before `onBack()` (mobile keeps the screen mounted).

## 3. Billing card and step rail

`shared/booking/BillingCard.tsx` (1030 lines): "the step rail, inline on the Booking, one card per Procedure" (US-04.3.8, 04.3.9, 04.3.2, 04.3.3, 03.4.1). `BillingCard` picks `MobileBillingCard` (summary: Invoice to, Contract, Price, plus a Paid by row; tap opens a Billing sheet with the same steps) or `InlineBillingCard` (web and admin: rail left, current question right). Core is `BillingSteps` (line 161).
- Three steps: 1 "Invoice to" (destination: patient / hospital / holder-type answers), 2 narrowing step (patient: "Standard or prepaid?"; hospital: "Under which of X's funding tags?"; other: "Which holder?"), 3 Contract and price. All options and auto-fills come from `contractRailFor(...)` (domain/billing/contractRail), which owns every rule; UI draws `view.destination`, `view.narrow`, `view.contract` (rows, `autoPick`, `otherPrice`, `rvgBackstop`).
- Store calls: `setRailAnswers` (answers saved as given, `{releaseContract: true}` when an answer leaves the Contract's path), `setProcedureContract` (with `{enteredPrice}`), `railContextForList`, `railStartFor`, `railMastersOf`, `railActorOf`, `procedureStackViewFor`.
- A lone Contract on a path is auto-picked as the answer is given (line 190). Price block: "RVG code | Fixed price" toggle for the destination's "Other price" (an `open` pricing Contract with a typed amount); RVG code field (`RvgCodeField`), "Add an RVG code for reference" on a fixed price; hidden RVG field when a rate x time billing line exists. Copy notes: "Any typed price was cleared for the new Contract"; "This List does not offer X. The Booking keeps it; the office checks it at review" (`keptOffList`, US-04.3.11); "Set by the office" for the anaesthetist on a prepaid Contract (`officeOnly`, A17: she cannot change it); `CONTRACT_CHANGE_CAPTION` "The office sees any change to the Contract at review".
- `priceSummary` (line 704): open: "Fixed price $x" or `NEEDS_PRICE_LABEL`; RVG kinds: "RVG H6a", "To the anaesthetist" (office view) or "RVG code to fill in"; fixed: "Agreed fee $x" or "Prepaid $x" from `rangeInForce(contract, listDate)`, else "Needs a price".
- `BILLING_FAILURE_FIELDS = governingContractId, enteredPrice, prepaymentDetail` (line 75): Mark complete focuses this card for them.
- `ContractCombo` (line 576): searchable Contract dropdown; backstops "No contract: RVG" and "No contract: Fixed price" listed under a "No contract" heading.

`shared/flows/ContractRail.tsx`: older overlay version of the same rail ("Invoice to / Payment type / Contract", "Other price" toggle, RVG code now), used by `ManualBookingForm` (add booking) via `ContractRailPick`; exports `contractPriceText`. `shared/contracts/ContractSelect.tsx` is a plain dropdown (No contract first, Active Contracts grouped by holder Party, Disabled shown only if already chosen with "(disabled)"; excludes open-price fallbacks; `contractChoosableForProcedure`), used by office billing monitor surfaces. `ProcedureContractRow` is the older one-line "Change/Choose" row, now only inside `EditBillingSetupSheet` (read-only there). `ContractApprovalLine`: anaesthetist-only text "Awaiting office approval" / "Approved by the office <stamp>" from `contractChangeFor` over the audit (US-03.4.1, US-07.2.2).

`PaidByRow` (US-08.2.3): "Paid by" line from `procedureStackViewFor().contract.invoiced/split`; opens `SplitFeeSheet`; marks a split that does not fit in warning colour (`data-split="doesNotFit"`).

`ProcedureStack.tsx` (US-02.5.7, 03.1.9): renders a `ProcedureStackView` only. Full: latest procedure text as received, with source and when, three lines then "Show all"; "No procedure text received yet". Compact (admin review cells, drawers): text, Contract with pricing basis, RVG code as single lines. Heading "Procedure n" when more than one; Remove action on `ordinal > 1` only.

`OfficeBillingSetup.tsx` (office only, per procedure): rows Reference (warning "Missing" via `billingReferenceMissing`), Override (None / Fixed fee / Adjustment $ / Adjustment %), Prepayment ("Not required" / "Required, prepaid Contract" / "Required, $x seeded"; read only, marked INTERIM until Phase 27 in code comments); buttons "Edit billing setup" (`EditBillingSetupSheet`) and "Price override" (`PriceOverrideSheet`).

`PartyPicker.tsx`: type-ahead party chooser, groups "On this Booking" and "Parties" (`filterPartyOptions`, `partyOptionsFor`); creates no party. `PayerDetailsView`, `FunderDetailsView`: see section 2.

## 4. Capture cards: `shared/capture/`

`BtmCaptureBlock.tsx` composes one procedure, always in this order: `ProcedureStack`, `BillingCard`, `ContractApprovalLine` (anaesthetist), contract failure notes, additional-procedure note, price-status notice, then (only if `rvgDetailFor(contract, nonRvgLines).times !== 'hidden'`) `TimesCard` and `UnitsCard`, then a `Pair` of `OverrideCard` and `BillingLinesCard`, `NotesCard`, and any "Also outstanding" unanchored failures. On a fixed or open price the Times/Units/Modifiers cards are not rendered (US-03.3.9; recorded data kept). "Needs a price" is a notice via `needsPriceMessage(contract, listDate)`, never a figure. Additional procedure note: "bills for time units only; base and modifier units stay on the first procedure" (catch-up 19a). Write strategy: write-through per tap (steppers, removals, nudges, stamps), commit-on-blur for free text, never debounced.

- `feeContext.ts`: `procedureFee` (assembles `FeeContext`: anaesthetist rates, list date, `masters.rvgTimeRule`, patient DOB for age modifier, `masters.modifiers`, stored non-RVG lines, governing Contract, RVG group; calls `domain/billing/fee.feeFor`) and `bookingFee` (sums units and total, `needsPrice` OR, rounds to cents). Throws if the List's anaesthetist is missing. A Disabled Contract still prices a Procedure already on it. RVG-basis stored lines are never fee inputs.
- `TimesCard.tsx`: big mono Start/Finish stamps; one travelling teal action ("Start now" then "Finish now"); stamps use the demo clock (`clockISO(store.clock)`); Finish now falls back to start + 5 min if the clock is earlier; nudges +/-5 keep at least 5 minutes between start and finish (`timeIso.ts` string maths, never `Date`). Writes `anaestheticStartISO`, `handoverISO` via `editProcedure`. No "Required" caption; a missing time shows as a red outline only.
- `UnitsCard.tsx`: B/T/M stepper rows from the calculator's `BtmBreakdown`; step writes the whole `CapturedUnits` as `{units: resolved +/- 1, source: 'overridden'}`, floor 0; no auto-clear on equality; explicit "Use seeded value" resets. On an additional procedure B and M show value and caption "Not charged on an additional procedure" with no buttons. T caption words the time tier rule (`describeTimeRule`, `masters.rvgTimeRule`). B caption from `baseSource`; M caption lists modifier items ("A1 age +1 · P1 included 0 · AS3 +2"). Includes `ModifiersSection`.
- `ModifiersSection.tsx` (US-03.3.4/3.3.8/3.3.9/5.1.4): ledger of pre-applied rows (age modifier, modifiers included in the RVG base units; shown selected, removable, "Put back" via `restoreModifier`), claimed rows with explanation, "Add a modifier" (opens `ModifierPickerSheet`), and "None apply" (`confirmNoModifiers`) with a "Required" caption until answered on an RVG kind (`modifiersStepAnswered`, `MODIFIERS_STEP_MESSAGE`). Actions: `removeModifier`, `restoreModifier`. `claimCompletionProblems` messages show per row.
- `ModifierPickerSheet.tsx`: RVG modifier table plus AA's own, in printed order, searchable by code and factor. Tapping a row opens an inline explanation (required) and units (stepper within `enteredUnitsBounds`) when `needsEnteredUnits`; Claim writes via `claimModifier` / `editModifierExplanation`; row states Applied, Claimed, Put back.
- `ProcedureCodeCard.tsx` (exports `RvgCodeField`, `OUTSIDE_GUIDE_CAPTION`): RVG code type-ahead (`RvgTypeahead` inline on web, row opening `CodePickerSheet` on mobile; `RvgCodeList` groups by anatomy heading with pinned headings, `searchRvgGroups`). Pick via `pickRvgGroup` (clears chosen or typed base value, never touches the procedure text). A ranged group's base units via `RangeUnitsRow`: value starts at starting figure, stepper floor 0 no ceiling, value outside guide accepted with caption "Outside the guide range. The office will see a warning after the procedure." (D3: warn, never block; matches warning rule `baseUnitsOutsideGuide`). Never suggests a code from the procedure text.
- `OverrideCard.tsx` (anaesthetist-side capture): None / Adjustment $ / Charge $ (typed `priceOverride` of kind `dollarAdjustment` / `fixedFee`) with mandatory reason, saved on Save; renders office % overrides read-only. Validation: charge amount > 0, adjustment non-zero, reason non-blank. Full editor with % is `flows/PriceOverrideSheet.tsx`.
- `BillingLinesCard.tsx` and `AddBillingLineSheet.tsx`: non-RVG lines. "Ancillary fixed amount" always offered; "Rate x time (hourly)" only if the Contract has `permitsRateTime`, otherwise disabled showing `INDIVIDUAL_ARRANGEMENT_MESSAGE`; hours x rate preview via `roundToCents`; Remove via `removeBillingLine`. Hardcoded caption about ACC pre-op flat-fee codes CS250, CS260, CS70 (AddBillingLineSheet).
- `NotesCard.tsx`: Int Notes and Op Notes via `editProcedure` on blur.
- `BookingTotalPanel.tsx` (desktop money panel; ticking figures via `useTickingValue`, 320 ms cubic ease-out and green flash, reduced-motion jumps). `CompleteBar.tsx` ("Mark complete" teal CTA; once completed a green "Booking complete" bar with Amend while editable). `CompletionOverlay.tsx` (tick pop, units and fee line only for office). `capture/ui.tsx`: `CaptureSection`, steppers, `FailureNotes` (failures verbatim), `RequiredCaption`.

## 5. Flows: `shared/flows/` (all through `useSurface().Overlay`: bottom sheet on mobile, dialog on web and admin)

| Component | What the user does | Store action(s) |
|---|---|---|
| `AddBookingFlow` | "Add a booking": opens straight on manual form; source stamped `admin` (office) or `anaesthetistAdHoc`; success state | via `ManualBookingForm` |
| `ManualBookingForm` | NHI (optional) with "Look up NHI" (`lookupNhi`, demo-badged "NHI FHIR lookup · Digital Services Hub"), name, DOB, phone, ethnicity, procedure description (stored exactly as typed; office adds "Told by" phone or email), optional RVG code, scheduled time, optional Contract via step rail (never preselected), different payer (`PayerFields`), office-only billing reference. Name and DOB required (UI); procedure text or RVG code checked in `createBooking`. Saved without a Contract waits on "Needs an invoice destination" (`SAVED_WITHOUT_CONTRACT`). Reports whether the patient was reused (reads last `patient.reuse` audit) | `createBooking` |
| `PhotoCaptureFlow` + `sampleExtractions.ts` | Future-scope demo: pick one of two canned paper cards (A: Wiremu Tane, NHI ZBC1123, RVG a3; B: Losa Tuilagi, NHI JKL1188, RVG ll1), 900 ms fake processing, prefilled form. No OCR. Badged `DemoBadge tone="future"`. Only reachable from a demo trigger | `createBooking` |
| `CancelBookingSheet` | reason required | `cancelBooking` |
| `EditPatientSheet` | demographics | `editPatient` |
| `PayerSheet` | "different payer" tick; patient pays (record email or address, can add for this Booking only) or other payer (name, relationship, email, NZ postal address, phone); a billed payer with no contact is asked but still saves (Review flags). Child hint "Under 18. Check whether a parent or guardian should be the payer." (`isMinorOn`) | `setBookingPayer` |
| `FunderSheet` | chips: None the patient pays, insurers, funders; approval number. "It never changes who is invoiced" | `setBookingInsurance` |
| `SplitFeeSheet` (US-08.2.3, RV-31) | rows of party (`PartyPicker`) plus share typed as $ or % (`parseShare`), one row at most "takes the rest"; live `resolveSplit(fee, shares)`; save or remove split | `setProcedureSplit` (null clears) |
| `RemoveProcedureSheet` | confirm, names procedure and billing-line count going with it; no reason; first procedure never removable | `removeProcedure` |
| `EditBillingSetupSheet` | "Contract and reference": Contract read only, billing reference | `editProcedure` |
| `PriceOverrideSheet` | office: None / fixed fee / $ adjust / % adjust, reason mandatory | `editProcedure` |
| `EditInvoiceDescriptionSheet` | office edit of invoice description (D73: edit always wins over later description or Contract change) | `setInvoiceDescription` |
| `SubmitListSheet` | mode `blockers`: lists each not-complete, non-cancelled Booking with its failures (via `completionBlockersFor`); mode `confirm`: "Submit this list to the office?" explains SUBMITTED, changes allowed until authorised | `submitList` |
| `MoveListSheet` (US-01.4.3, 01.4.5, 01.5.5) | anaesthetist moves own List: where (return to office / hand on to colleague), colleague (flat name-ordered `pushTargets`, no tier or preference shown), confirm with `VacatedSessionChoice` (what her vacated session becomes), optional message, done. Takes effect at once, no acceptance (D7). Modes: plain, `toSlotId`, `unavailable` (marking session not available) | `moveListToOffice`, `pushListToSlot`, `markUnavailableAndMoveList` |
| `MoveListPrompt` | host provider mounted once per anaesthetist app; lets a form open the move sheet above other sheets; also a prompt before a range or series covers several of her Lists (one prompt each) | via `MoveListSheet` |
| `MoveBookingToColleagueSheet` (US-01.4.7, D61) | find colleagues free that session (`NameSearchBox`; away or already holding a List shown as neutral unpickable rows), confirm (lands as a NEW List in their session, never an existing one; honour-system line for prepaid), optional message, optional "Tell the office" tick, done | `moveBookingToAnaesthetist` |
| `MovedToYouPanel`, `useListMoves.ts` | receiving notices for Lists or Bookings moved to her in the last week (window `movedToMeNotice`), neutral; `useOwnBookingInView` (Booking route only shows own-List Bookings, with a latch so the move's done step survives) | read hooks `movedToMe`, `bookingsMovedToMe`, `bookingMoveEntries` |
| `AlertOfficeSheet` (+ `AlertOfficeEntry`, `OfficeAlertLine`) (US-03.6.3, 13.8.3) | anaesthetist alerts office with note (one active alert per target); states: alert open, resolved ("The office has dealt with this", ask again); office sees "Alert from Dr X" with a tick | `alertOffice`, `resolveNotification` |
| `VacatedSessionChoice` (+ `StatusChoiceGroup`) | radiogroup of status chips; plain move offers Free then Unavailable; store validates (`vacatedStatusRefusal`) | none (value passed up) |
| `PayerFields`, `PostalAddressFields`, `moveSheetParts` | shared form parts | none |

## 6. Availability editor: `shared/availability/`

`AvailabilityEditor` (mobile bottom sheet, web right rail; single day opens `AvailabilitySlotPanel`, range or "Add days off" opens `AvailabilityForm`). `AvailabilityForm`: status chips (`useAnaesthetistStatusChoices`, settable by anaesthetist only), sessions AM / PM / Both (OOH session shown fixed "Out-of-hours session"; never repeating), quick span chips day / week / fortnight capped at `scheduleHorizon` end, Repeat none / every week / every 2 / More 3 or 4 weeks with weekday chips and Until, note, Save. Actions: `setAvailabilityRange`, `createAvailabilitySeries` (`adoptSlotIds`, `skipSlotIds` for moved Lists and sessions kept Free). A closed status over a session holding a List first asks where the List goes (move sheet). `AvailabilitySlotPanel`: per-session status or List; one-off day off: Change and Remove (`clearAvailability`); series instance: Change this one, Delete this one, Delete the series (`deleteAvailabilitySeries`); past sessions read only. `SeriesList`: running series in words with Delete. `describeAvailabilityOutcome` (pure): result line ("n sessions set to X", "Series saved ...", "The List stays in place"; never claims the office was told). `useAvailability.ts`: month and day reads, `activeSeriesFor`, `scheduleHorizon`. Uses `weekdayOf`, `seriesLine` from `domain/availabilitySeries`. A closed status is never written over a List (D59).

## 7. Schedule row, progress, lookback, status master

- `schedule/ListRow.tsx`: the Forward Lists row (status rail, AM/PM/OOH column with mono start time, hospital and surgeon line, booking count, right-hand cluster). Right states: `ListRowRight` kinds including progress (`LIST_PROGRESS_LABEL`: "Done · unbilled", "Ready to submit", "Authorised", "Invoiced"), "n to finish", "New" pill on a List moved to her; `quiet` for SUBMITTED Lists (US-07.4.2); open session takes status fill (dashed Free), closed takes tint. OOH row shows moon and "Out-of-hours" in subtitle (`OutOfHoursMark`, `sessionText`).
- `schedule/ProgressPill.tsx`: `progressTone` / `progressLabel` single source (done tick for submitted and ready to submit).
- `schedule/ListInvoices.tsx`: `useListInvoices(listId)` via `invoicesForListView` (number, who, when, total, paid; read only; backdrop invoices included; US-07.4.1, US-03.1.6).
- `schedule/useLookback.ts`, `lookbackCopy.ts`: `useBookingSearch` (`searchBookingsFor`, own Bookings only), `useLookbackBounds` (`lookbackBoundsFor`), `useFieldText` (query kept in step with URL `?q=`); copy `searchCountLine` ("Showing 50 of 64. Add more of the name or the NHI."), `SEARCH_EMPTY`, `DAY_EMPTY`. (Catch-up 38a.)
- `calendar/MonthGrid.tsx`: Monday-first bounded month grid, year and month jump, Today, roving keyboard (arrows, Home/End, PageUp/Down, Shift for year), `renderDay` supplied by caller.
- `status/useSlotStatuses.ts` (US-01.2.2): `resolveDisplayStatus(key, records)` for a List kind (fixed label and colour, `LIST_KIND_LABELS`) or an availability status id from `masters.slotStatuses` (label, longLabel, description, colour token and treatment solid / hatched / dashed); unknown id renders "Unknown status" neutral. Hooks `useSlotStatuses`, `useAnaesthetistStatusChoices`, `useDefaultStatus`, `useDisplayStatus`; `emptySessionLine` ("Free / open for cover", note, or long label). `StatusChip`, `StatusBlock`, `StatusLegend` (List types then active statuses in order, default Free last; optional filter toggle) read these. Colour palette fixed (`theme/statusColours.ts`); status list is master data.

## 8. Warnings: `shared/warnings/`

Hooks `useBookingWarnings(bookingId)` and `useListWarnings(listId)` call `warningsForBooking(...)` over schedule, billing, appSettings, clock, masters. `WarningsPanel`: one row per warning with text, kind (`Before procedure` / `After procedure`), strength (`Mild` / `Strong`); cleared rows show who and when; office gets a teal Clear (`clearWarning`; mild is "Clear (optional)"); anaesthetist never sees Clear; `extra` slot. `WarningTriangle` / `AttentionDot`: non-interactive marker in strongest open colour (mild amber, strong red, cleared mist) with count. Rules live in `domain/warnings/rules/`: `prepaymentUnpaid` (strong, before), `approvalNumberMissing` (mild, before), `childPayer` (mild, before), `baseUnitsOutsideGuide` (mild, after), `splitDoesNotFit` (mild, after). Capture hooks: `booking-prepayment`, `booking-child-warning`, `booking-approval-warning`.

## 9. Audit and history reading: `shared/audit/`, `booking/History*`

Pure read layer over the append-only trail (store unchanged). `actionLabels.ts` (about 139 action codes to English; every code emitted under `store/` or `domain/seed/` must have a label), `fieldLabels.ts` (patch key to label; unknown keys sentence-cased; ISO suffix dropped), `auditNarrative.ts`: `auditFieldChanges` (diff over the union of keys, "not set", cleared B/T/M reads "back to the seeded value"), `formatAuditValue` (never JSON), `sortAuditNewestFirst` (time then sequential id tiebreak because demo clock is pinned), `coalesceAudit` (consecutive single-field edits by one actor at one timestamp on one entity collapse to net change with "n changes" and show/hide steps), `summariseAuditChanges`, `formatAuditStamp`. `HistorySheet` merges entries for given entity ids (also Draft-List batch rows naming a list in `after.draftListIds`); `HistoryTimeline` renders day headings, coalesced rows, ledger. Used by Booking detail, admin review row, admin List drawer. Tests: `auditNarrative.test.ts`.

## 10. Surface seam, modal stack, UI primitives

- `surface/context.ts`: `Surface { variant, Overlay, BookingLayout, BookingTotal, Pair }`; `BookingLayoutSlots` = header, history, banners, context, capture, actions, summary, completeBar, overlay. `SurfaceProvider.tsx`: mobile = one scroll column, masthead folds past 24 px scroll (unfolds below 6), pinned frosted dock reading `--aa-inset-bottom`; web = 12-column grid (banners span 12, capture span 8, sticky commit rail span 4 with Booking total and separate matching-width complete bar, then patient, time, notes, actions). Mobile `BookingTotal` renders nothing. `Pair` stacked on phone, equal columns on web.
- `BottomSheet` (z 70, slide up 320 ms, scrim tap or handle closes, `aa-sheet-in/out`), `Dialog` (fixed, `min(520px)` or wide `min(760px)`, `role=dialog aria-modal`, corner X when an `OverlayHeader` is present), `ConfirmSheet` (focus on safe button, primary runs once), `OverlayHeader`, `SheetActions` (phone stacked, web row), `sheetPresence` (chip steps aside while a sheet is open), `CornerClose`.
- `useModalLayer.ts`: one stack, Escape closes only the top layer through its one `onClose`; focus trap, focus returns; background `inert` within closest `[data-aa-modal-scope]`; popovers join as `kind: 'popover'`.
- `ui/`: `Button` (primary teal, secondary, danger, pill; 44 px), `Pill` (tones neutral/success/warning/error, sizes sm/md/lg), `Field` parts (`FieldLabel`, `TextField`, `TextArea`, `Segmented`, `FormError role=alert`), `Notice`, `ResultLine` (`role=status`), `EmptyState`, `CountBadge`, `SlidingSegmentedControl`, `TickBadge`, `TickButton`, `SuccessOverlay` (tick pop, haptic; `onDismiss` safety valve), `DoneStep`, `InlineConfirm`, `NameSearchBox` (uses `matchesNameQuery`), `usePopover` and `PopoverPanel`, `DockSpacer`, `visuallyHidden`. Hook convention: components emit `data-shot` and pass `data-*` through (capture and Playwright targets).

## 11. Demo triggers and demo affordances

`demoTriggers/registry.ts` (about 1400 lines) holds `DEMO_TRIGGERS`: every demo action keyed to a route pattern and surface (`bar` = framed build harness menu, `pwa` = installed PWA Demo sheet). Types: `DemoTrigger {id,label,description,screen,routes,surfaces,badge,when,choices,disabledReason,run,indexPath}`. `match.ts` `demoTriggersFor(state, pathname, surface, published)` uses react-router `matchPath`. UI-only stores: `context.ts` (`useDemoTriggerContext` publishes screen state such as integrations tab, selected message, fee month, Admin Day slot, open Draft List, masters view, open picker list) and `memory.ts` (last message, last webhook and counter, pending photo-capture request). No domain state, not persisted. `InlineDemoTrigger` runs an entry from inside a dialog (Assign picker, colleague row). `useDemoTriggers.ts` gives the shared behaviour for both surfaces. Badges: `future-scope`, `office-stand-in`, `colleague-stand-in`.

Entries (id: screen, routes, surface, store action):
- Billing monitor `/admin/billing` (bar): `billing-failure` (authoriseList, setProcedureContract, submitList), `arm-handoff-fault` (armHandoffFault), `run-reconciliation-poll`, `run-archive-job` (also on Xero sim routes `/demo/xero...`).
- `simulate-sign-in`: `/admin/audit` (simulateSignInAttempts). `ingest-pdf-row`: `/admin/integrations` (ingestPdfRow). `fire-hospital-message` and `replay-hospital-message (dedupe)` (processMessage; mobile lists, web and admin Booking, integrations and `/demo/integrations`; bar and pwa; future-scope badge). `hospital-description-arrives`: Admin Booking (replaceProcedureText, AR-35 wordings). `stage-post-op`: admin review and Booking (authoriseList, submitList).
- Payments: `payment-full`, `payment-half`, `payment-replay` (admin Invoice; sendPaymentWebhook, receivePayment); `pwa-payment-full`, `pwa-payment-half` (`/mobile/balances`). AA fee: `run-scheduled-fee-run` (runMonthlyFeeInvoices), `seed-month-of-bctis` (seedMonthOfBctis), `record-fee-payment` (recordAaFeePayment) on `/admin/billing/aa-fees` and the Xero fee pair.
- Office stand-ins on the PWA (office-stand-in): `office-authorises-list`, `office-assigns-next-free`, `office-adds-out-of-hours-list`, `office-assigns-draft-list`, `office-resolves-alert`, `office-approves-contract-change`, `office-sets-booking-contract`, `office-clears-warning`.
- Scheduling: `simulate-sickness` (admin Day and Conflicts; `simulateSickness` with routes), `ask-colleague-make-available` (colleague-stand-in), `colleague-moves-list-to-office`, `colleague-moves-list-to-me`, `colleague-hands-booking-to-souter`, `colleague-moves-booking-to-me`, `simulate-incoming-request`, `add-draft-list-for-day`, `stage-recurring-clash`.
- Warnings: `raise-sample-warnings`, `clear-sample-warnings` (bar and pwa).
- `photo-capture-future`: `/mobile/lists/:listId` (requests the photo prong through memory).
- `demoClockShortcuts.ts`: +15 min, +1 hour, Next day, Next morning, +7 days, "Procedure day · 28 Jul" (`S1_PROCEDURE_DAY = 2026-07-28`, disabled when today is on or after it); calls `clockActions` (forward-only clock).
- `DemoBadge`: amber "Demo simulation" or neutral "Future scope" tone; used on NHI lookup, photo capture, harness.
- Tests: `demoTriggers.test.ts` (744 lines), `procedureTextTriggers.test.ts`, `context.test.tsx`.

## 12. Format, terms, labels

- `format.ts`: money via `formatMoney`/`formatCurrency` ("$3,100.00"), `parseAmount`; dates re-exported from `domain/dateText`; `ageYears`, `nhiBadge`, `drSurname`/`surnameOf`/`initialsOf`/`nameWithoutTitle`, `waitingLabel` ("45 min", "16 h", "3 d 22 h"), `locationName`, `pairingLine`, `BOOKING_SOURCE_LABELS` (Hospital download, Surgeon PDF, Office entry, Added by anaesthetist), `PROCEDURE_TEXT_SOURCE_LABELS`, `INVOICE_DESCRIPTION_ORIGIN_LABELS`.
- `scheduleTerms.ts`: all Draft List words ("Draft List", "Unassigned", origin and request-source labels). `outOfHoursTerms.ts`: "Out-of-hours", "Open/Close out-of-hours session". Comment in `scheduleTerms.ts` says it is office only; anaesthetist apps use `outOfHoursTerms`.
- `contracts/labels.ts`: `PARTY_KIND_LABEL`, `PRICING_KIND_LABEL` (rvgAnaesthetistRate, rvgContractRate, rvgDiscount, fixed, open), `pricingLabel`, `formatPricingBasis` ("RVG at your rate", "Fixed price $x", "Other price, amount to enter"), `contractLabel` ("<AA code> · <name>"), `BILLS_LABEL`, `DELIVERY_LABEL`.
- `legacy/`: redirects `…/cards/:id` to `…/bookings/BK…`.

## 13. Theme (tokens only)

`tokens.ts`: neutrals, `brand` crimson #A91E3E (identity only), `accent` teal #0D6E63 (only action colour), `semantic` success/warning/error triples, fonts (Schibsted Grotesk, Spline Sans Mono, Georgia), type scale, spacing, radius (ctl 10, card 14, panel 20, sheet 24), elevation e0 to e3, z-index (popover 30, drawer 41, sticky 45, overlay 60, sheet 70). `statusColours.ts`: six status tokens (private, public, preop, holiday, unavailable, free) with hatched and dashed treatments; `LIST_KIND_VISUAL`. `motion.ts`: sheetIn, cardAdvance, completeTick, valueTick, etc. `haptics.ts`: completion vibrate at 200 ms (no-op on iOS). `mobileGradient.ts` and `gradientLabGate.ts` (`GRADIENT_LAB_ENABLED = true`, the only feature flag). `global.css`: safe-area inset variables `--aa-inset-*`, keyframes (sheet, fade, tick, circle pop).

## 14. Hardcoded, stubbed, visual-only, and absences

- No routes, no screens of its own; no persistence concerns (demo-trigger stores are in-memory, outside `PERSIST_VERSION`).
- Photo capture is a canned demo: two hardcoded samples with paper-card images, fake 900 ms processing (`PhotoCaptureFlow.tsx:30`), badged Future scope. `lookupNhi` is the simulated NHI Hub (`domain/nzhis`).
- Prepayment on Booking is read-only text "INTERIM until Phase 27" (`OfficeBillingSetup.tsx`); the only office actions are "Raise pre-procedure invoice" (warning row) in `BookingDetailBody`.
- "Office stand-in" and "colleague stand-in" triggers play other personas; they exist only as demo triggers, not product UI.
- Hardcoded copy: ACC pre-op code set CS250/CS260/CS70 in `AddBillingLineSheet`; "(the RFP immutability answer)" in post-op notices; `S1_PROCEDURE_DAY`.
- Completion overlay auto-dismiss is a 1050 ms `setTimeout` in `BookingDetailBody.tsx:451` (real timers, not demo clock, by design).
- Anaesthetist Booking carries no money by design (`showBookingTotal`), office Booking shows fee, units, rate, override note.
- Not found in this area: any invoice, billing monitor, Xero, review (Admin Review), Draft List assignment, master-data editing, notifications, reports, user or role management, or sign-in UI (all in `apps/*`); no acceptance flow for moves (immediate by D7).
