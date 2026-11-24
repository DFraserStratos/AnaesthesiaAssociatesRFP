# Reverse check: what the prototype does that is now wrong or unwanted

Scope: the opposite of the gap analysis. Four checks: Retired items still implemented, Future Work items still showcased, Decisions-log rulings the catalogue has since overturned, and prototype behaviour with no catalogue backing that would mislead. The code is the truth; the old build docs were used only as leads. Catalogue links are relative to this file; code paths are under the repo root (`aa-prototype/src/...`).

This run (18 November 2026) replaces the one made on 10 November. It re-checks the prototype at HEAD `0fe12f06` (code as of `63a44902`) against the catalogue as committed there. **Both sides moved a long way.** The prototype gained catch-up Phases 18 to 25 (the flat Contract model, the step rail, RVG groups and modifiers, completion by pricing kind, payer on each Procedure, the primary Procedure, pricing kinds, Contract history and the AUTHORISED lock), 17a (rooms), 22a, 32a to 32c, 38a and the UI unification track U1 to U6. The catalogue gained the 10 November accountant meeting, Donald's payer-per-Procedure decision (17 November), thirteen board answers (17 and 18 November) and his surgeon-contacts decision (18 November), which retires the surgeons' rooms record.

**Every 10 November finding was re-tested against the current code.** Of the 39 that stood, 23 are now fixed and are dropped; 16 still stand (some narrowed); 2 are new. 18 findings stand. Finding IDs stay stable: a surviving finding keeps its number, so the gaps in the sequence are fixed or unused numbers. New findings take RV-42 and up. This run's findings have been through a separate adversarial pass (18 November): all 18 stand; eight were corrected (RV-02, RV-05, RV-13, RV-24, RV-27, RV-40, RV-42, RV-23, recorded in the entries below) and none was dropped or added.

## What changed since the 10 November run

**Fixed in the prototype (dropped):**

- RV-01 attachments (no attachment code, panel or seed remains); RV-03 rate x time line and the Method 3 gate, RV-04 mandatory adjustment reason, RV-29 no price for the anaesthetist (Phase 24: the `PriceCard` replaces `OverrideCard`, no reason is asked, every actor sees the total).
- RV-06, RV-07, RV-18, RV-30, RV-32, RV-37, RV-39 (Phases 18 to 20 and 22a: Parties and flat Contracts, no route or Type 1/2/3, no default Contract per hospital or insurer, no Contract lines or ordinals, no effective dates or deletion, ACC as a funding tag, no insurer flag, one payer on each Procedure).
- RV-08 modifier split above four (Phase 23, `domain/billing/multiProcedure.ts`); RV-09, RV-22, RV-38, RV-41 (Phases 19 and 19b: the NZSA RVG groups and modifier table as printed, P1 included on the right codes, age modifier pre-applied, no ASA seeding); RV-10 (any base value accepted, a mild after-procedure warning).
- RV-11 and RV-32 (Phase 25: the billing run reads a lock snapshotted at AUTHORISED); RV-21 (Phase 21a: completion follows the Contract's pricing kind).
- RV-19 (Phase 38a: the anaesthetist edits a SUBMITTED List until AUTHORISED); RV-25 and RV-26 (Phase 32b: unavailability is never a conflict, notices are active or resolved, the vacated-session choice is asked); RV-31 (the split is typed in $ or % on the Paid by line, for any actor).

**New catalogue movement that creates findings:**

- **Surgeons' rooms are retired** ([US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md), 18 November). Phase 17a built exactly what was retired the next day: RV-42.
- **Public is a Slot status, not a List kind** ([OQ-139](../../../../requirements-board/requirements/questions/OQ-139.md), 18 November): RV-43.
- **No automatic hospital sync in the first release** ([OQ-109](../../../../requirements-board/requirements/questions/OQ-109.md)); [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) is now Future Work: folded into RV-14 and RV-16.
- Reinforced, not new: payments are made in Xero (RV-40); a credit note is always for the whole invoice ([OQ-97](../../../../requirements-board/requirements/questions/OQ-97.md)) and is the correction path for a wrong price after invoicing (a gap, not drift).

## Key facts that shape the result

- **The Contract model is no longer the biggest drift.** It is now built to the 5 November model. What is left is the **prepayment and money-movement family** (RV-05, RV-24, RV-40, RV-33): the prototype's prepayment is still the interim shape (full or split deposit, netted from the final invoice, no settlement on cancel, paid out through an ordinary receivable and payable pair), and the office still presses a button that pays anaesthetists. Phase 27 and the Xero phases are where these close.
- **Most Retired stories are merges**, so "Retired but still implemented" is reported only where the code does the opposite of the merged text, or the retirement was a real withdrawal: [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md) (RV-02), the prepayment items ([US-06.2.3](../../../../requirements-board/requirements/stories/US-06.2.3.md), [US-06.2.4](../../../../requirements-board/requirements/stories/US-06.2.4.md), [US-06.4.2](../../../../requirements-board/requirements/stories/US-06.4.2.md), [FT-06.4](../../../../requirements-board/requirements/stories/FT-06.4.md); RV-05) and [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md) (RV-42).
- **Integrations are still the largest Future Work area** (RV-13 to RV-16). The Messages and Feed tabs, the simulator and the fire and replay actions carry Future badges; what misleads is the pushed-and-applied model, the cross-List move and the absence of the in-scope matching screen.
- **Money views still follow the original RFP** (RV-33 to RV-36): receipts as GST activity, ageing buckets and age chips, seeded Productivity and Leave panels, a prior-balance tag with no threshold.

Size key: S under a day, M 1 to 3 days, L up to a week, XL more.

## Retired items checked (51)

| Item | Verdict | Note |
| --- | --- | --- |
| [US-01.3.4](../../../../requirements-board/requirements/stories/US-01.3.4.md) | Honoured | AM and PM Lists are independent records. |
| [US-02.2.2](../../../../requirements-board/requirements/stories/US-02.2.2.md) | Honoured | Correct-then-ingest of a PDF row is built (`ingestPdfRow`); its target [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md) is in scope. |
| [US-02.4.2](../../../../requirements-board/requirements/stories/US-02.4.2.md) | Handled | Photo capture is built but reachable only as a badged Future-scope demo action ([US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md) is Future Work). |
| [US-02.4.3](../../../../requirements-board/requirements/stories/US-02.4.3.md) | Honoured | Copy a Booking is gone. |
| [US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md) | Honoured | Attachments are gone from Bookings, Lists, the seed and the drawers (RV-01 fixed). |
| [US-03.3.2](../../../../requirements-board/requirements/stories/US-03.3.2.md) | Honoured | Any base value is accepted; outside the guide range a mild after-procedure warning shows, never a block (`baseUnitsOutsideGuide`). |
| [US-03.3.5](../../../../requirements-board/requirements/stories/US-03.3.5.md) | Honoured | Modifiers are itemised, each with an explanation. |
| [US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md) | Handled | Rate x time is gone. Fixed ancillary lines remain until billing events replace them (code comment "until 39b"). |
| [US-03.3.7](../../../../requirements-board/requirements/stories/US-03.3.7.md) | Honoured | The hours x hourly-rate line and the Method 3 gate are gone (RV-03 fixed). |
| [US-03.5.3](../../../../requirements-board/requirements/stories/US-03.5.3.md) | Honoured | No reason is asked for a price change (RV-04 fixed). |
| [FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md) | Honoured | No default Contract is created with a hospital or insurer; each destination gets system-made backstops ([US-04.3.9](../../../../requirements-board/requirements/stories/US-04.3.9.md)). |
| [US-04.1.6](../../../../requirements-board/requirements/stories/US-04.1.6.md) | Honoured | Contracts are edited in place with an audited history. |
| [US-04.2.3](../../../../requirements-board/requirements/stories/US-04.2.3.md) | Honoured | A Contract has no base-unit override. |
| [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) | Honoured | No Contract lines; each priced item is its own Contract. |
| [US-04.2.5](../../../../requirements-board/requirements/stories/US-04.2.5.md) | Honoured | No ordinal-keyed second-procedure prices; the RVG rule applies. |
| [US-04.2.6](../../../../requirements-board/requirements/stories/US-04.2.6.md) | Honoured | The override is a setting on RVG-priced Contracts only. |
| [US-04.2.7](../../../../requirements-board/requirements/stories/US-04.2.7.md) | Honoured | No Contract declares per-Booking inputs; the billing reference is a review hint only. |
| [US-04.2.9](../../../../requirements-board/requirements/stories/US-04.2.9.md) | Honoured | Contracts are held by a Party and linked to surgeons and one anaesthetist. |
| [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) | Honoured | A Contract has no dates; only a fixed price has dated ranges. |
| [US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md) | Honoured | Retired 5 October: no "full or split" setting on a Contract or Procedure; the fee split is a typed Paid by action on the Booking. (The prototype's split deposit is a different thing, see RV-05 under [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md).) |
| [US-04.4.1](../../../../requirements-board/requirements/stories/US-04.4.1.md) | Honoured | No mandatory default Contract. |
| [US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md) | Honoured | No per-procedure default Contracts. |
| [US-05.1.2](../../../../requirements-board/requirements/stories/US-05.1.2.md) | Honoured | AA's own RVG rows are added through the RVG master (`createRvgGroup`). |
| [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) | Honoured | No procedure master; procedure text is free text with an optional RVG code. |
| [US-05.2.3](../../../../requirements-board/requirements/stories/US-05.2.3.md) | Honoured | P1 is included, pre-applied at 0 and removable, on the right codes (RV-09 fixed). |
| [US-05.2.4](../../../../requirements-board/requirements/stories/US-05.2.4.md) | Honoured | A Contract rate or discount is a pricing kind. |
| [US-05.3.2](../../../../requirements-board/requirements/stories/US-05.3.2.md) | Honoured | Time units are per Procedure from its own times. |
| [US-05.3.3](../../../../requirements-board/requirements/stories/US-05.3.3.md) | Honoured | Modifier units split equally above four across RVG-priced Procedures, remainder to the primary (RV-08 fixed). |
| [US-05.3.4](../../../../requirements-board/requirements/stories/US-05.3.4.md) | Honoured | No Contract-specific second-procedure rule. |
| [FT-06.1](../../../../requirements-board/requirements/stories/FT-06.1.md) | Honoured | No prepaid setting on the profile; prepaid is a Contract setting. |
| [FT-06.4](../../../../requirements-board/requirements/stories/FT-06.4.md) | See RV-05 | The final invoice still nets the deposit and bills the balance. |
| [US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md) | Honoured | No prepaid list on the profile. |
| [US-06.1.2](../../../../requirements-board/requirements/stories/US-06.1.2.md) | Honoured | Same. |
| [US-06.2.3](../../../../requirements-board/requirements/stories/US-06.2.3.md) | See RV-05 | A full prepayment is still worded "estimated full fee". |
| [US-06.2.4](../../../../requirements-board/requirements/stories/US-06.2.4.md) | See RV-05 | A split-deposit variant remains beside the full fee. |
| [US-06.2.5](../../../../requirements-board/requirements/stories/US-06.2.5.md) | Honoured | No estimated-duration field. |
| [US-06.3.3](../../../../requirements-board/requirements/stories/US-06.3.3.md) | Honoured | An unpaid prepayment warns and never blocks. |
| [US-06.4.2](../../../../requirements-board/requirements/stories/US-06.4.2.md) | See RV-05 | An overpaid prepayment fails the Booking (`negativeTotal`) instead of leaving it. |
| [US-07.1.2](../../../../requirements-board/requirements/stories/US-07.1.2.md) | Honoured | `submitList` refuses while a live Booking is incomplete and lists what is missing. |
| [US-08.1.2](../../../../requirements-board/requirements/stories/US-08.1.2.md) | Honoured | The billing run reads the lock only (RV-11 fixed). |
| [US-09.1.2](../../../../requirements-board/requirements/stories/US-09.1.2.md) | Honoured | The invoice number is the engine's own; the case reference is separate. |
| [US-09.3.2](../../../../requirements-board/requirements/stories/US-09.3.2.md) | Honoured | Contacts in the Xero mirror carry no NHI or name ("Patient PT0001"). |
| [US-10.2.2](../../../../requirements-board/requirements/stories/US-10.2.2.md) | Honoured | The payable equals what was received; AA's fee is its own monthly invoice. |
| [FT-11.4](../../../../requirements-board/requirements/stories/FT-11.4.md) | Honoured | No insurer master or flag; an insurer is a Party (RV-39 fixed). |
| [US-11.1.3](../../../../requirements-board/requirements/stories/US-11.1.3.md) | Honoured | `upsertPatient` matches on NHI (the no-NHI case is RV-20). |
| [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) | Honoured | Same as FT-11.4. |
| [US-11.4.2](../../../../requirements-board/requirements/stories/US-11.4.2.md) | Honoured | An insured patient who claims back is the Procedure's payer. |
| [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md) | See RV-02 | GST period is still stored per anaesthetist and chosen on the report. |
| [US-12.1.3](../../../../requirements-board/requirements/stories/US-12.1.3.md) | Honoured | No prepaid list on the profile. |
| [US-12.1.5](../../../../requirements-board/requirements/stories/US-12.1.5.md) | Not implemented | No bank details on the anaesthetist (a gap, not drift). |
| [US-13.2.3](../../../../requirements-board/requirements/stories/US-13.2.3.md) | Not implemented | No per-anaesthetist ledger view for the office (a gap). |
| [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md) | See RV-42 | The surgeons' rooms master record is built in full. |

## Future Work items checked (24)

| Item | Result |
| --- | --- |
| [US-02.2.3](../../../../requirements-board/requirements/stories/US-02.2.3.md) | Not present (no removal detection). |
| [US-02.3.5](../../../../requirements-board/requirements/stories/US-02.3.5.md) | Not present (only the simulated invoice email, which is in scope). |
| [US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md) | Handled: photo capture is badged and reachable only through a Future-scope demo action. |
| [US-02.5.1](../../../../requirements-board/requirements/stories/US-02.5.1.md), [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md), [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md), [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md), [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md) | RV-13: applied automatically; a day move applied as a cross-List move; submitted Lists refuse inbound changes; a cancelled prepaid Booking settles nothing. |
| [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) | RV-16: Future since 18 November ([OQ-109](../../../../requirements-board/requirements/questions/OQ-109.md)); the prototype auto-applies three feeds. |
| [US-04.2.13](../../../../requirements-board/requirements/stories/US-04.2.13.md) | Not present (no Contract upload or export). |
| [US-04.3.6](../../../../requirements-board/requirements/stories/US-04.3.6.md), [US-04.3.7](../../../../requirements-board/requirements/stories/US-04.3.7.md) | Not showcased: messages carry no Contract; no "confirm with hospital" flag. |
| [US-13.7.4](../../../../requirements-board/requirements/stories/US-13.7.4.md) | Not showcased: rule settings exist only as state, no UI. |
| [FT-14.1](../../../../requirements-board/requirements/stories/FT-14.1.md), [FT-14.2](../../../../requirements-board/requirements/stories/FT-14.2.md), [FT-14.3](../../../../requirements-board/requirements/stories/FT-14.3.md), [US-14.1.1](../../../../requirements-board/requirements/stories/US-14.1.1.md), [US-14.2.1](../../../../requirements-board/requirements/stories/US-14.2.1.md), [US-14.3.1](../../../../requirements-board/requirements/stories/US-14.3.1.md) | RV-14: HL7 to FHIR simulator, live feed and Scenario S1. |
| [FT-14.5](../../../../requirements-board/requirements/stories/FT-14.5.md), [US-14.5.1](../../../../requirements-board/requirements/stories/US-14.5.1.md) | RV-15: retries, dead-letter queue, patient names in the log. |
| [FT-14.6](../../../../requirements-board/requirements/stories/FT-14.6.md), [US-14.6.1](../../../../requirements-board/requirements/stories/US-14.6.1.md), [US-14.6.2](../../../../requirements-board/requirements/stories/US-14.6.2.md) | RV-16: Christchurch Public feed and messages applied with no matching step. |

## 1. RetiredStillImplemented

### RV-02 GST period is a per-anaesthetist setting and a selector on the report
- Action: Remove. Size S.
- Catalogue: [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md), [US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md), [FT-12.2](../../../../requirements-board/requirements/stories/FT-12.2.md).
- Why: [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md) was Retired on 16 October ("No GST period on the profile ... all they have is a unit rate"); the GST report is monthly and lists payments passed to the anaesthetist. The prototype stores `gstPeriod` (monthly, bi-monthly, six-monthly) on every anaesthetist, asks for it on add and edit, seeds Dr Whitaker six-monthly, and the web GST report has a three-way period switch that defaults from it.
- Prototype evidence:
  - `aa-prototype/src/domain/types.ts:294` Anaesthetist.gstPeriod
  - `aa-prototype/src/apps/web/screens/AccountsScreen.tsx:39,385-412` period switch and rolling window in the GST report
  - `aa-prototype/src/apps/admin/flows/AddAnaesthetistFlow.tsx:33,63,87`, `EditAnaesthetistSheet.tsx:40,108`; `domain/seed/cast.ts:62`; also shown on `apps/admin/screens/AnaesthetistRecord.tsx` and `masters/AnaesthetistsView.tsx`, written by `store/mastersActions.ts`
- Verifier note: the body of [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md) still describes the retired behaviour (and its two screenshots show it); only its Notes line and status 6 record the retirement. A catalogue tidy, not a prototype fact.

### RV-05 Prepayment still carries a split deposit, a netting final invoice, a failing overrun, no approval step and no settlement on cancel
- Action: Rework. Size L.
- Catalogue: [FT-06.1](../../../../requirements-board/requirements/stories/FT-06.1.md), [FT-06.4](../../../../requirements-board/requirements/stories/FT-06.4.md), [US-06.2.3](../../../../requirements-board/requirements/stories/US-06.2.3.md), [US-06.2.4](../../../../requirements-board/requirements/stories/US-06.2.4.md), [US-06.4.2](../../../../requirements-board/requirements/stories/US-06.4.2.md), [FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md), [US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md), [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md), [US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md), [US-06.3.7](../../../../requirements-board/requirements/stories/US-06.3.7.md), [US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md), [US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md), [US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md), [US-04.3.8](../../../../requirements-board/requirements/stories/US-04.3.8.md), [OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md), [OQ-97](../../../../requirements-board/requirements/questions/OQ-97.md), [OQ-115](../../../../requirements-board/requirements/questions/OQ-115.md), [OQ-116](../../../../requirements-board/requirements/questions/OQ-116.md), [OQ-119](../../../../requirements-board/requirements/questions/OQ-119.md), [OQ-134](../../../../requirements-board/requirements/questions/OQ-134.md).
- Why: the trigger is now right (since Phase 20 a Procedure needs prepayment when its Contract is prepaid and bills the payer, and the prepaid Contract cannot carry the override). What is left is the interim shape the Retired items describe. The live model: the prepayment is always the full amount above zero (no deposit, no estimate: [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) says "no partial prepayment or deposit"), raised when an admin approves the invoice (an optional gate AA can switch off), and read-only once raised; after the procedure the prepaid Procedure is left off the final invoice, nothing is deducted and nothing further is invoiced or credited ([US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md), [US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md)); cancelling credits an unpaid prepayment invoice or refunds a paid one ([US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md)); a credit note is always for the whole invoice ([OQ-97](../../../../requirements-board/requirements/questions/OQ-97.md)). The prototype still lets a Procedure carry a `split` prepayment (a flat typed deposit) beside `full`, words a full prepayment "Pre-payment, estimated full fee", lets the office press "Raise pre-procedure invoice" with no approval step, deducts the deposit from the final invoice ("Less pre-payment deposit already invoiced") and bills the balance, fails a Booking whose prepayment exceeds the fee (`negativeTotal`: "an overpaid pre-payment needs a manual credit"), and raises no credit or refund on cancel. Prepayment and balance alerts are not shown side by side ([OQ-134](../../../../requirements-board/requirements/questions/OQ-134.md), a gap).
- Verifier note: [US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md) was removed from this finding's basis; its retired "full or split" is a fee split between parties, not a deposit. The deposit is contradicted by [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) and [US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md). Phase 27 replaces this.
- Prototype evidence:
  - `aa-prototype/src/domain/types.ts:882-885,1008` `PrepaymentDetail` full | split ("INTERIM ... Phase 27 removes it")
  - `aa-prototype/src/domain/billing/invoiceBuild.ts:76-132` split deposit line and "Pre-payment, estimated full fee"
  - `aa-prototype/src/domain/billing/lock.ts:375` deposit netted off the final invoice; `:522` `negativeTotal`
  - `aa-prototype/src/store/prepaymentActions.ts:45-140` office raise with no approval, sent as raised; `shared/booking/BookingDetailBody.tsx:561` "Raise pre-procedure invoice"
  - `aa-prototype/src/domain/seed/bookings.ts:862` seeded split ($800 on $1,200); no prepayment handling in `store/lifecycle.ts` `cancelBooking`

### RV-42 The surgeons' rooms master record is built in full (new)
- Action: Rework. Size M.
- Catalogue: [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md), [US-13.6.5](../../../../requirements-board/requirements/stories/US-13.6.5.md), [US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md), [FT-13.6](../../../../requirements-board/requirements/stories/FT-13.6.md), [US-02.2.4](../../../../requirements-board/requirements/stories/US-02.2.4.md), [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md), [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md), [OQ-126](../../../../requirements-board/requirements/questions/OQ-126.md), [OQ-127](../../../../requirements-board/requirements/questions/OQ-127.md), [OQ-128](../../../../requirements-board/requirements/questions/OQ-128.md), [OQ-129](../../../../requirements-board/requirements/questions/OQ-129.md).
- Why: [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md) was Retired on 18 November: "for now we don't have a room, and we record this information just against the surgeon's profile". A surgeon holds one personal contact and one or more office contacts ([US-13.6.5](../../../../requirements-board/requirements/stories/US-13.6.5.md)), the practice name is plain text, the HPI CPN is filled in by admin staff and a surgeon can be saved without one ([US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md), [OQ-129](../../../../requirements-board/requirements/questions/OQ-129.md)), and the office's emails go back to the List's sender, falling back to the surgeon's first office contact ([US-02.2.4](../../../../requirements-board/requirements/stories/US-02.2.4.md)). Phase 17a (finished the day before) built the opposite, on top of the Phase 17 rulings of 9 October ("One room per surgeon", "The HPI CPN is one required `hpiId`"), which this retirement overturns: a Surgeons' rooms master view and sheet, a room contact email and phone, practice manager and PA contacts held on the room, a surgeon linked to one or more rooms (room required), a room card on the surgeon profile, an HPI CPN that is required (the unique part stays right: [US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md) refuses a duplicate), and roughly 130 seeded directory surgeons with their room contacts. These are Donald's 18 November decisions for the build, not yet seen by AA, so the retirement sits at Verify; the plan's Phase 17a notes will move when `/update-build-plan` next runs.
- Prototype evidence:
  - `aa-prototype/src/domain/types.ts:375-406` `SurgeonRoom`, `RoomContact`; `:362` `Surgeon.roomIds`
  - `aa-prototype/src/apps/admin/screens/masters/view.ts:37` "Surgeons' rooms" view; `SurgeonsView.tsx:88` `SurgeonRoomsView`; `apps/admin/components/RoomContactsList.tsx`
  - `aa-prototype/src/apps/admin/screens/SurgeonProfile.tsx:86-110` "Surgeons' room" card per room
  - `aa-prototype/src/store/surgeonActions.ts:52-63,205` `roomRequired`, `duplicateHpiCpn`, `createSurgeonRoom`; `store/roomContactActions.ts`; `domain/roomContacts.ts`
  - `aa-prototype/src/apps/admin/flows/SurgeonEditSheet.tsx:71` "HPI CPN (required)"; `domain/seed/specialistDirectory.ts:41` `DIRECTORY_ROOM_CONTACTS`

## 2. FutureStillShowcased

### RV-13 Automated modify, reschedule and cancel from hospital messages is shown working, with a day move applied as a move
- Action: Hide from demo. Size S.
- Catalogue: [US-02.5.1](../../../../requirements-board/requirements/stories/US-02.5.1.md), [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md), [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md), [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md), [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md), [US-14.1.1](../../../../requirements-board/requirements/stories/US-14.1.1.md).
- Why: all Future Work; until then a change arrives through the admin's review. The canned S13 to S15 messages are applied by an integration actor with no admin: a same-List retime, a cross-List move on S13 (only where the target session already holds a List; otherwise it parks, an interim until Phase 33), a modification and a cancellation. [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md) says a List never moves day: a Booking moved to another day is a cancellation plus a new Booking, so the cross-List S13 move contradicts it. [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) wants inbound changes accepted until the List is AUTHORISED; the prototype refuses an integration write once the List is SUBMITTED and parks it for manual intervention. [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md) says a cancelled prepaid Booking settles its prepayment; the S15 cancel settles nothing (RV-05). The fire and replay demo actions and the Messages tab already carry the Future badge, so the issue is the behaviour shown, mainly the cross-List move. Keep S13 to S15 out of the scripted demo.
- Prototype evidence:
  - `aa-prototype/src/store/integrationActions.ts:243-265` S13 reassign across Lists; `:292` S15 cancel; `:338-357` locked target parks as manual intervention
  - `aa-prototype/src/store/lifecycle.ts:67-75` `integrationImmutable`; `domain/integrations/messages.ts:265-283` canned S13 messages

### RV-14 HL7 v2 to FHIR simulator, live drip, and Scenario S1 built on them
- Action: Rework. Size S.
- Catalogue: [FT-14.1](../../../../requirements-board/requirements/stories/FT-14.1.md), [FT-14.2](../../../../requirements-board/requirements/stories/FT-14.2.md), [FT-14.3](../../../../requirements-board/requirements/stories/FT-14.3.md), [US-14.1.1](../../../../requirements-board/requirements/stories/US-14.1.1.md), [US-14.2.1](../../../../requirements-board/requirements/stories/US-14.2.1.md), [US-14.3.1](../../../../requirements-board/requirements/stories/US-14.3.1.md), [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md), [US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md), [OQ-108](../../../../requirements-board/requirements/questions/OQ-108.md), [OQ-109](../../../../requirements-board/requirements/questions/OQ-109.md).
- Why: HL7 v2, FHIR R4 and near-real-time are Future, and since 18 November so is any automatic hospital sync ([OQ-109](../../../../requirements-board/requirements/questions/OQ-109.md)): the first release imports St George's and Southern Cross files into one matching screen, an admin deciding every row. The simulator, Messages and Feed tabs and demo actions are badged and S1's text calls the beat a Future-scope illustration. What remains unbadged is the Integrations page intro ("HL7 v2 messages are translated to FHIR R4 and applied to the schedule"), a one-per-second "Start live feed", and S1 still opening the presenter story with a pushed message creating a Booking. Rework S1 around the matching screen (Phase 34).
- Prototype evidence:
  - `aa-prototype/src/apps/admin/screens/IntegrationMonitorScreen.tsx:53-58` unbadged intro; `:515-524` interim Future-scope note on two tabs only
  - `aa-prototype/src/apps/demo/DemoIntegrations.tsx:62-77,202-206` live drip; `apps/demo/DemoControlPanel.tsx` Scenario S1

### RV-15 Reliability tooling (retries, dead-letter queue, manual intervention): unbadged nav badge, patient names in the log
- Action: Keep as demo scaffold. Size S.
- Catalogue: [FT-14.5](../../../../requirements-board/requirements/stories/FT-14.5.md), [US-14.5.1](../../../../requirements-board/requirements/stories/US-14.5.1.md), [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md).
- Why: Future. The prototype retries three times on a timer, dead-letters, shows an amber badge on the Integrations nav item, offers Reprocess, and lists the patient's name on every log row where [US-14.5.1](../../../../requirements-board/requirements/stories/US-14.5.1.md) wants a restricted working view. The Messages tab is badged; what stays is the unbadged nav badge and the Patient column, which fall away when Phase 34 demotes the tab.
- Prototype evidence:
  - `aa-prototype/src/store/integrationActions.ts:45` `MAX_ATTEMPTS`; `main.tsx:20` `wireIntegrationRetry`
  - `aa-prototype/src/apps/admin/AdminApp.tsx:225` nav badge; `IntegrationMonitorScreen.tsx:102` Patient column

### RV-16 Further hospital feeds and automatic application with no matching step
- Action: Rework. Size L.
- Catalogue: [FT-14.6](../../../../requirements-board/requirements/stories/FT-14.6.md), [US-14.6.1](../../../../requirements-board/requirements/stories/US-14.6.1.md), [US-14.6.2](../../../../requirements-board/requirements/stories/US-14.6.2.md), [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md), [US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md), [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md), [US-02.6.1](../../../../requirements-board/requirements/stories/US-02.6.1.md), [OQ-109](../../../../requirements-board/requirements/questions/OQ-109.md).
- Why: further feeds and automatic matching are Future, and [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) (the automatic St George's and Southern Cross sync) joined them on 18 November; the first release keeps a manual matching review with an unmatched queue (and a stub on the List for a row that cannot post). The prototype has three feeds, one of them Christchurch Public (not an integrated hospital) and one a FHIR-native Southern Cross feed, and creates the Booking straight onto the target List with no review queue, last-synced display or unmatched queue. `applyEffect` is already commented as interim until the matching screen; the gap is the missing screen, not an unlabelled showcase.
- Prototype evidence:
  - `aa-prototype/src/domain/integrations/feeds.ts:8-22`; `store/integrationActions.ts:196-215` `createBooking` onto the target List
  - `aa-prototype/src/domain/types.ts` Booking.source `hospitalDownload`

## 3. DecisionSuperseded

### RV-20 A patient without an NHI is allowed (provisional record, "NHI pending")
- Supersedes: the Phase 03 and 10 provisional-patient rulings and the 2026-07-22 NHI handling.
- Action: Rework. Size M.
- Catalogue: [US-11.1.4](../../../../requirements-board/requirements/stories/US-11.1.4.md), [US-11.1.1](../../../../requirements-board/requirements/stories/US-11.1.1.md), [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md), [US-03.1.5](../../../../requirements-board/requirements/stories/US-03.1.5.md), [FT-02.6](../../../../requirements-board/requirements/stories/FT-02.6.md), [US-02.6.1](../../../../requirements-board/requirements/stories/US-02.6.1.md), [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md), [OQ-49](../../../../requirements-board/requirements/questions/OQ-49.md), [OQ-118](../../../../requirements-board/requirements/questions/OQ-118.md).
- Why: the NHI is mandatory: every patient record has one from creation and a Booking cannot be saved without it. A booking that arrives without one waits on the unmatched queue and creates no patient record; a stub stands in its place on its List, seen by the anaesthetist and the office, until the office adds the NHI ([OQ-118](../../../../requirements-board/requirements/questions/OQ-118.md), Donald for the build). The prototype's add-booking form takes the NHI as optional, `upsertPatient` creates a provisional record with no NHI, screens show "NHI pending", and the seed has a no-NHI patient. Do not extend the "NHI pending" path; build the stub.
- Prototype evidence:
  - `aa-prototype/src/shared/flows/ManualBookingForm.tsx:122,157-167`; `store/intake.ts:98-128` `createdProvisional`
  - `aa-prototype/src/shared/format.ts:56-63` "NHI pending"; `domain/seed/bookings.ts:874`

### RV-23 Post-op addendum is a new linked Booking on today's free session
- Supersedes: the Phase 09 post-op addendum reading ("the RFP immutability answer").
- Action: Rework. Size L.
- Catalogue: [FT-03.7](../../../../requirements-board/requirements/stories/FT-03.7.md), [US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md), [US-03.7.2](../../../../requirements-board/requirements/stories/US-03.7.2.md), [US-03.7.3](../../../../requirements-board/requirements/stories/US-03.7.3.md), [FT-08.6](../../../../requirements-board/requirements/stories/FT-08.6.md), [US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md), [US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md), [OQ-121](../../../../requirements-board/requirements/questions/OQ-121.md).
- Why: a pre-op or post-op event is an event on the original Procedure (a time or a fixed fee with its own date); the original Booking stays immutable. Events appear on no List or schedule and are billed in the next run, bundled with the same party's lines where possible, never held for the Procedure's invoice ([OQ-121](../../../../requirements-board/requirements/questions/OQ-121.md) answered 4 November). The prototype creates a second linked Booking on a free session of the original anaesthetist today, which sits on a List and runs a full capture, submit and authorise cycle, and says so in app copy citing "the RFP immutability answer"; the code already marks the whole action INTERIM until Phase 38b. A new Booking is still allowed for significant work, but not as the standard path.
- Prototype evidence:
  - `aa-prototype/src/store/bookingActions.ts:261` `addPostOpAddendum`; `shared/booking/BookingDetailBody.tsx:517,581,818-822`
  - `aa-prototype/src/shared/demoTriggers/registry.ts:588` `stage-post-op`; `domain/types.ts` Booking.bookingType

### RV-24 A prepaid invoice gets a full receivable and payable pair that pays the anaesthetist; the catalogue pays it into the AA Holding account
- Supersedes: Phase 09/10 decision D-pre-invoice-pair.
- Action: Rework. Size L.
- Catalogue: [US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md), [US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md), [US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md), [US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md), [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md), [FT-06.3](../../../../requirements-board/requirements/stories/FT-06.3.md), [FT-06.5](../../../../requirements-board/requirements/stories/FT-06.5.md), [US-09.1.3](../../../../requirements-board/requirements/stories/US-09.1.3.md), [OQ-80](../../../../requirements-board/requirements/questions/OQ-80.md), [OQ-111](../../../../requirements-board/requirements/questions/OQ-111.md), [OQ-115](../../../../requirements-board/requirements/questions/OQ-115.md), [OQ-125](../../../../requirements-board/requirements/questions/OQ-125.md).
- Why: a prepayment is held in the AA Holding account, a payables creditor beside each anaesthetist (not a bank or Xero account), not paid to the anaesthetist. The pair is created when an admin approves the prepayment invoice (an optional step); its other side is the Holding account, so a move changes nothing; after the procedure the money moves to whoever did the List as an accounting move, not a payment ([US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md); how Xero posts it is open after the 10 November meeting). Payments are made in Xero and tracked by the system ([OQ-111](../../../../requirements-board/requirements/questions/OQ-111.md)). The prototype hands the pre-invoice to Xero as an ordinary receivable and payable pair "so a fully-prepaid procedure still has a disbursement path", authorises the payable to the anaesthetist as the patient pays, and has no holding account, no transfer and no cancel refund.
- Prototype evidence:
  - `aa-prototype/src/store/xeroHandoff.ts:360-367` `handoffCasesForBooking`; `store/prepaymentActions.ts` handoff after the raise
  - the AA Holding account is named only in comments (`store/listMoveActions.ts:163,375,445`, `slotActions.ts:448`, `prepaymentActions.ts:56`); there is no holding account in the model, the ledger or the Xero mirror

### RV-27 The office moves a single Booking to any List on any day (lower confidence)
- Supersedes: the 2026-07-22 third review #3; logged as scaffold in Phase 32a ("RV-27 left as scaffold").
- Action: Keep as demo scaffold. Size S.
- Catalogue: [US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md), [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md), [OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md), [OQ-87](../../../../requirements-board/requirements/questions/OQ-87.md), [FT-01.4](../../../../requirements-board/requirements/stories/FT-01.4.md).
- Verifier note: lower confidence. [FT-01.4](../../../../requirements-board/requirements/stories/FT-01.4.md) lets "a List, or a single Booking from it" move between anaesthetists, and no story forbids the office doing so in an existing List or on another day by hand; [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md) and [OQ-87](../../../../requirements-board/requirements/questions/OQ-87.md) describe what arrives from the rooms. Treat the day picker as unbacked scaffold rather than a flat contradiction.
- Why: a List never moves day; a Booking on another day is a cancellation plus a new Booking. The anaesthetist's own single-Booking move goes to a colleague free in that Slot, creating a List for it, and is now built (Phase 32a). The office's "Move booking" flow still lets it pick any day and any existing List. The catalogue states the move rule for the anaesthetist only ([OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md)), so moving into an existing List is an owner question for the office; picking another day is contradicted outright by [OQ-87](../../../../requirements-board/requirements/questions/OQ-87.md) and [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md) (any actor), so drop the day picker when the move is reworked.
- Prototype evidence:
  - `aa-prototype/src/apps/admin/flows/MoveBookingFlow.tsx:1-40`; `store/lifecycle.ts:799` `reassignBooking`

### RV-28 Office edits to a Booking write through on every tap, with no Save
- Supersedes: 2026-07-23 Phase 04 capture-UX ruling, for the office only.
- Action: Rework. Size M.
- Catalogue: [US-02.3.2](../../../../requirements-board/requirements/stories/US-02.3.2.md), [US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md), [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md), [US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md), [OQ-69](../../../../requirements-board/requirements/questions/OQ-69.md).
- Why: an admin edit applies only on an explicit Save, warns on leaving with unsaved edits, and records the changed fields for the update email. The anaesthetist keeps write-through. The Admin Booking detail wraps the same shared body, so every control writes at once with no Save, Discard or unsaved warning (no such control exists in `apps/admin` or `shared/booking`).
- Prototype evidence:
  - `aa-prototype/src/shared/booking/BookingDetailBody.tsx:390` `canEdit`; `apps/admin/screens/AdminBookingDetail.tsx`

### RV-33 The GST report lists customer receipts, not the payments passed to the anaesthetist
- Supersedes: 2026-07-24 Phase 10 GST-activity reading.
- Action: Rework. Size S.
- Catalogue: [US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md), [US-10.1.2](../../../../requirements-board/requirements/stories/US-10.1.2.md), [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md), [OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md).
- Why: [US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md) is a monthly list of the payments AA has passed to the anaesthetist with the GST component of each (cash basis). The prototype lists receipts on the day the customer pays, before any payout, on mobile (GST this month) and web.
- Prototype evidence:
  - `aa-prototype/src/store/selectors.ts:1116-1139` `gstActivityFor` reads `billing.receipts`; `apps/web/screens/AccountsScreen.tsx:385-412`; `apps/mobile/screens/BalancesScreen.tsx:46`

### RV-40 The office's "Run payables" makes the payment to anaesthetists; the catalogue says Xero pays and the system only tracks it
- Supersedes: the Phase 10 payables-run reading (the system disburses).
- Action: Rework. Size S.
- Catalogue: [OQ-111](../../../../requirements-board/requirements/questions/OQ-111.md), [FT-10.2](../../../../requirements-board/requirements/stories/FT-10.2.md), [US-09.2.4](../../../../requirements-board/requirements/stories/US-09.2.4.md), [US-10.2.7](../../../../requirements-board/requirements/stories/US-10.2.7.md), [US-10.1.2](../../../../requirements-board/requirements/stories/US-10.1.2.md), [US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md).
- Why: "Xero is assumed to handle all payments. Our system tracks them" ([OQ-111](../../../../requirements-board/requirements/questions/OQ-111.md), Donald for the build). The ACCPAY is paid in Xero's payables run and the engine learns of it from a webhook or the daily poll and records the disbursement; the system does not make the payment, and payments follow a weekly cycle ([US-10.2.7](../../../../requirements-board/requirements/stories/US-10.2.7.md), Proposed). The Admin billing monitor has a "Payables run" card whose "Run payables" button disburses every authorised payable not yet paid, inside the app; the demo registry deliberately leaves it out as "the monitor's own product button" (the S4 run-sheet step 5 and the Control Panel note at `apps/demo/DemoControlPanel.tsx:292,488` tell the presenter to press it), and the Xero simulator's "Settle invoice" also calls `disbursePayable`. The two-state money model (paid into AA, disbursed) is right; the actor is not. Keep the action as a Xero stand-in behind the Xero simulator with the demo badge, and let the product screen show detection, not a button.
- Prototype evidence:
  - `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx:129-146` "Payables run" card and "Run payables" button
  - `aa-prototype/src/store/payablesActions.ts:147,161` `runPayables`, `disbursePayable` (office-only)

### RV-43 Public is a kind of List with a hospital, surgeon and Bookings; the catalogue makes it a Slot status with no List detail (new)
- Supersedes: the Phase 31 reading "Pre-op and acute Lists name a surgeon" and the original three List kinds (private, public, pre-op).
- Action: Rework. Size M.
- Catalogue: [US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md), [US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md), [US-13.1.1](../../../../requirements-board/requirements/stories/US-13.1.1.md), [US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md), [OQ-139](../../../../requirements-board/requirements/questions/OQ-139.md), [OQ-64](../../../../requirements-board/requirements/questions/OQ-64.md).
- Why: [OQ-139](../../../../requirements-board/requirements/questions/OQ-139.md) was answered on 18 November (Donald, for the build, not yet discussed with AA): Public marks a session the anaesthetist works at the public hospital. It is a value in the Slot status list that works like Unavailable (not open for bookings, set by the anaesthetist or the office), shows "Public" with an optional note, and carries no List detail: no surgeon, hospital, theatre or kind of session. AA does not book or bill public work, and there is no public roster or feed. The prototype has "Public" as a List kind: about a dozen standing recurring bookings create Public Lists at Christchurch Public with the "Acute on call" and "Elective ortho" templates, the office can assign or draft a Public List, the day view and the anaesthetist's Lists show it with a hospital, and the seeded status master holds only Free, Holiday and Unavailable (no Public status).
- Prototype evidence:
  - `aa-prototype/src/domain/types.ts:128-136` `LIST_KINDS` and labels include `public`
  - `aa-prototype/src/domain/seed/recurringBookings.ts:67-124` public recurring bookings at CPH; `recordedWindow.ts:216` public Lists
  - `aa-prototype/src/apps/admin/flows/AssignListFields.tsx:42`, `RecurringBookingSheet.tsx:50`, `DraftListSheet.tsx:22` "Public" as a kind to pick
  - `aa-prototype/src/domain/slotStatus.ts:37-40` `SEED_STATUS` has no `public`

## 4. UnbackedBehaviour

### RV-34 Dashboard Productivity and Leave panels
- Action: Hide from demo. Size S.
- Catalogue: [US-12.2.3](../../../../requirements-board/requirements/stories/US-12.2.3.md), [US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md), [US-08.3.5](../../../../requirements-board/requirements/stories/US-08.3.5.md).
- Why: the dashboard summarises the calendar, the financial position and locum availability. Productivity tiles (units, lists, fees, six-month trend) have no backing, and the Leave rows (Approved, Pending) imply an approval workflow while availability is something the anaesthetist sets herself. Both are seeded for one persona, not derived from Bookings or Slots.
- Prototype evidence:
  - `aa-prototype/src/apps/web/screens/DashboardScreen.tsx:226-277`; `domain/seed/anaesthetistDashboard.ts`

### RV-35 Receivables ageing buckets, age chips and an Overdue view
- Action: Rework. Size M.
- Catalogue: [US-12.2.1](../../../../requirements-board/requirements/stories/US-12.2.1.md), [US-08.3.5](../../../../requirements-board/requirements/stories/US-08.3.5.md), [OQ-59](../../../../requirements-board/requirements/questions/OQ-59.md).
- Why: [OQ-59](../../../../requirements-board/requirements/questions/OQ-59.md) is answered: a flat list of unpaid payables, oldest first, no ageing buckets, no age chips, no Overdue view; each line links back to its Booking. The prototype has Current / 31 to 60 / 61 to 90 / 90+ bars on the web Dashboard, an Overdue tab with bucket columns, and an age chip on every mobile Balances row (amber over 60 days); rows open nothing.
- Prototype evidence:
  - `aa-prototype/src/store/selectors.ts` `receivablesAgingFor`; `apps/web/screens/DashboardScreen.tsx:32,188-225`; `AccountsScreen.tsx:32,122-150`; `apps/mobile/screens/BalancesScreen.tsx:100,138`

### RV-36 "Prior balance" tag has no threshold and sits on the billing monitor after authorisation
- Action: Rework. Size M.
- Catalogue: [US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md), [US-11.3.1](../../../../requirements-board/requirements/stories/US-11.3.1.md), [US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md), [OQ-74](../../../../requirements-board/requirements/questions/OQ-74.md), [OQ-33](../../../../requirements-board/requirements/questions/OQ-33.md).
- Why: the alert fires when a Booking is created or matched, for an invoice unpaid beyond a configurable 90-day threshold (mild or strong, never blocking), and the anaesthetist also sees it on the Booking in their List ([US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md), Agreed). The prototype tags any open prior episode with no threshold, only on the billing monitor and only after authorisation, and shows the anaesthetist nothing.
- Prototype evidence:
  - `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx:215-222`; `store/selectors.ts:611,877`

## Decisions-log rulings checked and still consistent (no finding)

Dual-format NHI validation and NHI never in Xero ([US-11.1.2](../../../../requirements-board/requirements/stories/US-11.1.2.md), [US-09.3.1](../../../../requirements-board/requirements/stories/US-09.3.1.md)); forward-only ACTIVE to SUBMITTED to AUTHORISED with no Returned state ([EP-07](../../../../requirements-board/requirements/stories/EP-07.md)); the Draft List state ([FT-01.6](../../../../requirements-board/requirements/stories/FT-01.6.md)); tiered time units with round up ([US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md)); GST-exclusive lines with GST at the foot ([US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md)); AA as agent ([US-08.4.5](../../../../requirements-board/requirements/stories/US-08.4.5.md)); "-P" payable numbers ([US-08.4.3](../../../../requirements-board/requirements/stories/US-08.4.3.md)); the payable equals what was received and AA's fee is its own monthly invoice ([FT-10.3](../../../../requirements-board/requirements/stories/FT-10.3.md), [US-10.2.1](../../../../requirements-board/requirements/stories/US-10.2.1.md)); 90-day contact archive ([US-09.3.3](../../../../requirements-board/requirements/stories/US-09.3.3.md)); append-only audit ([US-13.5.2](../../../../requirements-board/requirements/stories/US-13.5.2.md)); an unpaid prepayment warns and never blocks ([US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md)); an own-List move recalculates nothing ([US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md)); no preference warning on an anaesthetist's own move ([US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md)); Draft List re-date and removal ([US-01.6.4](../../../../requirements-board/requirements/stories/US-01.6.4.md)); recurring bookings landing on a closed Slot become Draft Lists ([US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md)); statuses as a user-maintained master ([US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md)); an own move ordered by availability alone ([OQ-113](../../../../requirements-board/requirements/questions/OQ-113.md)); per-Booking billing failure ([US-08.5.2](../../../../requirements-board/requirements/stories/US-08.5.2.md)); Contracts edited in place with an audit trail ([US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md)). Rulings the catch-up phases superseded and logged themselves (the ASA seed, absorbed P1, the SUBMITTED edit lock, kept notices, accept-and-flag onto a closed session) are not listed.

## Impact on the S1 to S5 run sheet

- S1 (booking to theatre): RV-14, RV-13, RV-16 (the pushed-and-applied story; no matching screen), RV-20 (the no-NHI path). The attachment beat is gone (RV-01 fixed).
- S2 (office day): RV-27 (office Booking move by day), RV-43 (Public Lists on the day grid). The sickness beat is now correct (RV-25 fixed).
- S3 (money end to end): RV-33, RV-35, RV-40 (the Run payables button and the Xero "Settle invoice"), RV-24.
- S4 (exceptions): RV-05 (prepayment, including the balance invoice and the missing refund on cancel), RV-23 (post-op). The billing-failure beat now rests on a Procedure that "Needs a price", which the catalogue backs.
- S5 (compliance): RV-28 (no Save on office edits). The locked-record and contract-history beats match the catalogue.
