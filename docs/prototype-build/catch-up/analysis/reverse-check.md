# Reverse check: what the prototype does that is now wrong or unwanted

Scope: the opposite of the gap analysis. Four checks: Retired items still implemented, Future Work items still showcased, Decisions-log rulings the catalogue has since overturned, and prototype behaviour with no catalogue backing that would mislead. The code is the truth; the old build docs were used only as leads. Catalogue links are relative to this file. Paths are under the repo root (`aa-prototype/src/...`). Statuses were ignored as instructed (the 20 October recode turned them into codes); every finding rests on the item's text, notes and linked answers.

This run replaces the one made on 8 October. It re-checks the prototype at HEAD `d4db277` (catch-up Phases 14 to 17, 28 to 32 built) against the catalogue as it stands on 20 October, including the 14, 16 and 19 October Greg meetings, the v6 pricing model and the 20 October edit to [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md). Finding IDs are renumbered from RV-01; the old numbers do not carry over.

## What changed since the 8 October run

- **Resolved by the build, no longer findings:** Copy a Booking (removed, Phase 15b), the AA fee netting from the payable (Phase 16), the 5% "illustrative fee" cards, the stale Xero NHI callout, the DRAFT/ACTIVE state naming, the Slot/List split, the cover request flow (replaced by own-List move), availability as a status on the Slot, series, Draft Lists, the horizon setting and the notification pool. Photo capture left the Add a booking sheet (now only a badged demo action).
- **New since 8 October (catalogue moved):** attachments Retired ([US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md), 16 October); procedure master dropped ([US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md)); prepayment trigger moved from the anaesthetist profile to a Contract flag and the 19 October holding account ([FT-06.1](../../../../requirements-board/requirements/stories/FT-06.1.md), [EP-06](../../../../requirements-board/requirements/stories/EP-06.md), [OQ-80](../../../../requirements-board/requirements/questions/OQ-80.md)); GST period and prepaid list removed from the profile ([US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md), [US-12.1.3](../../../../requirements-board/requirements/stories/US-12.1.3.md)); the anaesthetist's edit window runs to AUTHORISED ([US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md)); NHI mandatory ([US-11.1.4](../../../../requirements-board/requirements/stories/US-11.1.4.md)); the anaesthetist adjustment is a per-Contract flag with no reason ([US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md), [OQ-107](../../../../requirements-board/requirements/questions/OQ-107.md)); no ASA pre-fill ([US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md)); unavailability is never a conflict ([US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md), [OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md)); a single Booking moves only to a free colleague as a new List ([US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md), [OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md)); Contracts are dated versions, never backdated or deleted ([US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md)).
- **Carried over from 8 October:** the Retired and Future behaviours that the code still has (attachments are new; rate x time, protected defaults, ordinal rows, prepayment estimate and deposit, additional-procedure units, P1 absorption, ranged base bound, surgeon PDFs, HL7 and FHIR tooling, dashboard productivity and leave, ageing buckets, ACC flag, prior balance, modifier values).

## Verification pass (adversarial, 20 October)

Every finding was re-checked against the code and the cited catalogue items. All 38 survive; none dropped, none added. Corrected after verification: RV-09 (the chip is struck through with a caption, not silent, and the catalogue says P1 is not locked), RV-13, RV-14, RV-15 (Messages tab and demo actions are already badged Future; RV-14 wrongly said the nav leads with Integrations; RV-15 downgraded to Keep as demo scaffold), RV-16 (acknowledged interim until Phase 33), RV-27 (office half not backed by the catalogue, size S, treat as an owner question). Upheld unchanged: the other 32. Lower confidence stays on RV-22 (OQ-95 open) and RV-29 (Donald's own 28 September decision; confirm with him).

## Key facts that shape the result

- **Most Retired stories are merges**, so "Retired but still implemented" is reported only where the code does the opposite of the merged text, or the retirement was a real withdrawal ([US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md), [US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md), [US-03.3.7](../../../../requirements-board/requirements/stories/US-03.3.7.md), [US-04.2.5](../../../../requirements-board/requirements/stories/US-04.2.5.md), [US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md), [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md), [FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md), [FT-06.1](../../../../requirements-board/requirements/stories/FT-06.1.md), [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md), [US-12.1.3](../../../../requirements-board/requirements/stories/US-12.1.3.md)).
- **The biggest drift is still the Contract model** ([EP-04](../../../../requirements-board/requirements/stories/EP-04.md)): route, Type 1/2/3, protected defaults, patient payment category, deposit and estimate prepayment and the per-Procedure billable party record all leak into billing, validation, UI and seed (RV-05, RV-06, RV-18, RV-24, RV-30). They are one rework family (Phases 18 to 27 of the plan); keep them as "labelled simplification" in the demo until then.
- **The Schedule track (Phases 28 to 32) was built against the 8 October catalogue.** The 19 October meeting answered several of its provisional readings differently ([OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md), [OQ-84](../../../../requirements-board/requirements/questions/OQ-84.md), [OQ-79](../../../../requirements-board/requirements/questions/OQ-79.md), [OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md), [OQ-87](../../../../requirements-board/requirements/questions/OQ-87.md)); RV-25 to RV-27 record that.
- **Integrations are the largest Future Work area** (RV-12 to RV-16): the HL7, FHIR, reliability and feed items are demonstrated, but since Phase 14 the Messages and Feed config tabs, the simulator and the Fire and Replay demo actions carry Future badges and S1 calls its beat an illustration. What still misleads is the unbadged Surgeon PDFs tab (RV-12), the Integrations page intro, the missing matching screen, and the cross-List move semantics (RV-13). The Admin nav item sits eighth of ten, it does not lead.

Size key: S under a day, M 1 to 3 days, L up to a week, XL more.

## Retired items checked (44)

| Item | Verdict | Note |
| --- | --- | --- |
| [US-01.3.4](../../../../requirements-board/requirements/stories/US-01.3.4.md) | Honoured | AM and PM Lists are independent records. |
| [US-02.2.2](../../../../requirements-board/requirements/stories/US-02.2.2.md) | See RV-12 | Correct then ingest of a PDF row is built; it is Future Work. |
| [US-02.4.2](../../../../requirements-board/requirements/stories/US-02.4.2.md) | See RV-17 | Photo capture still built, reachable only as a badged demo action. |
| [US-02.4.3](../../../../requirements-board/requirements/stories/US-02.4.3.md) | Honoured | Copy a Booking is gone (no `copyBooking`, no copy source; Phase 15b). |
| [US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md) | See RV-01 | Attachments on Bookings and on Lists are fully built. |
| [US-03.3.2](../../../../requirements-board/requirements/stories/US-03.3.2.md) | See RV-10 | Ranged base code is still hard-bounded. |
| [US-03.3.5](../../../../requirements-board/requirements/stories/US-03.3.5.md) | Honoured | Modifiers are itemised chips. The required explanation per modifier is a gap, not drift. |
| [US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md) | See RV-03 | Rate x time line built; fixed lines remain until events replace them. |
| [US-03.3.7](../../../../requirements-board/requirements/stories/US-03.3.7.md) | See RV-03 | Hourly rate x time line with the Method 3 gate. |
| [US-03.5.3](../../../../requirements-board/requirements/stories/US-03.5.3.md) | See RV-04 | A reason is mandatory; the catalogue now says no reason. |
| [FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md) | See RV-06 | Protected default Contract per hospital and insurer. |
| [US-04.2.3](../../../../requirements-board/requirements/stories/US-04.2.3.md) | Not implemented | No Contract base-unit override (gap, not drift). |
| [US-04.2.5](../../../../requirements-board/requirements/stories/US-04.2.5.md) | See RV-07 | Ordinal-keyed second-procedure price rows. |
| [US-04.2.6](../../../../requirements-board/requirements/stories/US-04.2.6.md) | See RV-04 | Adjustment is offered on every Contract; no flag. |
| [US-04.2.7](../../../../requirements-board/requirements/stories/US-04.2.7.md) | Honoured | No Contract declares per-Booking inputs; billing reference is a review flag only. |
| [US-04.2.9](../../../../requirements-board/requirements/stories/US-04.2.9.md) | Honoured | Contract scope exists; nothing wrong. |
| [US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md) | See RV-05, RV-31 | Prepayment typed full or split; office-only funder editor instead of the Booking split. |
| [US-04.4.1](../../../../requirements-board/requirements/stories/US-04.4.1.md) | See RV-06 | Default Contract auto-created with every hospital and direct-claim insurer. |
| [US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md) | Honoured | No per-procedure default Contracts exist. |
| [US-05.1.2](../../../../requirements-board/requirements/stories/US-05.1.2.md) | Not implemented | RVG master is view-only; no add-AA-code UI (gap). |
| [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) | Honoured | No procedure master; the Booking's procedure is free text with an optional RVG code. |
| [US-05.2.3](../../../../requirements-board/requirements/stories/US-05.2.3.md) | See RV-09 | P1 "absorbed" on the wrong codes and by silent refusal. |
| [US-05.2.4](../../../../requirements-board/requirements/stories/US-05.2.4.md) | Honoured | Agreed rate or percent discount applies instead of the unit value. |
| [US-05.3.2](../../../../requirements-board/requirements/stories/US-05.3.2.md) | Honoured | Time units are per Procedure from its own times. |
| [US-05.3.3](../../../../requirements-board/requirements/stories/US-05.3.3.md) | See RV-08 | Modifier split above four is missing; M is locked on additional procedures. |
| [US-05.3.4](../../../../requirements-board/requirements/stories/US-05.3.4.md) | See RV-07 | Contract-specific second-procedure pricing (ordinal rows). |
| [FT-06.1](../../../../requirements-board/requirements/stories/FT-06.1.md) | See RV-05 | No profile setting exists, but the trigger is a per-Booking payment category, not a Contract flag. |
| [US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md) | Not implemented | No prepaid list on the profile (correct); see RV-05 for the trigger. |
| [US-06.1.2](../../../../requirements-board/requirements/stories/US-06.1.2.md) | Not implemented | Same. |
| [US-06.2.3](../../../../requirements-board/requirements/stories/US-06.2.3.md) | See RV-05 | Full prepayment is still an estimate from the BTM calculator. |
| [US-06.2.4](../../../../requirements-board/requirements/stories/US-06.2.4.md) | See RV-05 | Estimated full fee via `feeFor`; a split deposit variant also exists. |
| [US-06.2.5](../../../../requirements-board/requirements/stories/US-06.2.5.md) | Not implemented | No estimated-duration field (correct). |
| [US-06.3.3](../../../../requirements-board/requirements/stories/US-06.3.3.md) | Honoured | Unpaid prepayment is a warning, never a block. |
| [US-06.4.2](../../../../requirements-board/requirements/stories/US-06.4.2.md) | See RV-05 | Deposit nets automatically and an overrun fails the Booking (`negativeTotal`). |
| [US-07.1.2](../../../../requirements-board/requirements/stories/US-07.1.2.md) | Honoured | `submitList` refuses while a live Booking is incomplete and lists what is missing. |
| [US-08.1.2](../../../../requirements-board/requirements/stories/US-08.1.2.md) | See RV-11 | Engine re-resolves route, payer and an expired-Contract fallback; no lock. |
| [US-09.1.2](../../../../requirements-board/requirements/stories/US-09.1.2.md) | Honoured | Invoice number and case reference both go to the Xero pair. |
| [US-09.3.2](../../../../requirements-board/requirements/stories/US-09.3.2.md) | Honoured | NHI never crosses to Xero; individuals are named "Patient PT0001". |
| [US-10.2.2](../../../../requirements-board/requirements/stories/US-10.2.2.md) | Honoured | Phase 16: the payable equals what was received; AA's fee is its own monthly invoice. |
| [US-11.1.3](../../../../requirements-board/requirements/stories/US-11.1.3.md) | Honoured | `upsertPatient` matches on NHI (see RV-20 for the no-NHI case). |
| [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md) | See RV-02 | GST period still set per anaesthetist and chosen on the report. |
| [US-12.1.3](../../../../requirements-board/requirements/stories/US-12.1.3.md) | Not implemented | No prepaid list on the profile (correct). |
| [US-12.1.5](../../../../requirements-board/requirements/stories/US-12.1.5.md) | Not implemented | No bank details on the anaesthetist (gap). |
| [US-13.2.3](../../../../requirements-board/requirements/stories/US-13.2.3.md) | Not implemented | No per-anaesthetist ledger view for the office (gap). |

## Future Work items checked (25)

| Item | Result |
| --- | --- |
| [FT-02.2](../../../../requirements-board/requirements/stories/FT-02.2.md), [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md) | RV-12: Surgeon PDFs tab is unbadged product. |
| [US-02.2.3](../../../../requirements-board/requirements/stories/US-02.2.3.md) | Not present (no removal detection). |
| [US-02.3.5](../../../../requirements-board/requirements/stories/US-02.3.5.md) | Not present (only the simulated invoice email, which is in scope). |
| [US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md) | RV-17: photo capture, badged and demo-only. |
| [US-02.5.1](../../../../requirements-board/requirements/stories/US-02.5.1.md), [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md), [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md), [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) | RV-13: applied automatically; a day move is applied as a cross-List move; submitted Lists refuse inbound changes. |
| [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md) | Not present. |
| [US-04.2.13](../../../../requirements-board/requirements/stories/US-04.2.13.md) | Not present (no Contract schedule upload). |
| [US-04.3.6](../../../../requirements-board/requirements/stories/US-04.3.6.md), [US-04.3.7](../../../../requirements-board/requirements/stories/US-04.3.7.md) | Not showcased: messages carry no Contract; no "confirm with hospital" flag. |
| [US-13.7.4](../../../../requirements-board/requirements/stories/US-13.7.4.md) | Not showcased: rule settings exist only as state, no UI. |
| [FT-14.1](../../../../requirements-board/requirements/stories/FT-14.1.md), [FT-14.2](../../../../requirements-board/requirements/stories/FT-14.2.md), [FT-14.3](../../../../requirements-board/requirements/stories/FT-14.3.md), [US-14.1.1](../../../../requirements-board/requirements/stories/US-14.1.1.md), [US-14.2.1](../../../../requirements-board/requirements/stories/US-14.2.1.md), [US-14.3.1](../../../../requirements-board/requirements/stories/US-14.3.1.md) | RV-14: HL7 to FHIR simulator, live feed and Scenario S1. |
| [FT-14.5](../../../../requirements-board/requirements/stories/FT-14.5.md), [US-14.5.1](../../../../requirements-board/requirements/stories/US-14.5.1.md) | RV-15: retries, dead-letter queue, manual intervention, patient names in the log. |
| [FT-14.6](../../../../requirements-board/requirements/stories/FT-14.6.md), [US-14.6.1](../../../../requirements-board/requirements/stories/US-14.6.1.md), [US-14.6.2](../../../../requirements-board/requirements/stories/US-14.6.2.md) | RV-16: Christchurch Public feed and messages applied with no matching step. |

## 1. RetiredStillImplemented

### RV-01 Attachments on Bookings and Lists are fully built
- Action: Remove. Size M.
- Catalogue: [US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md), [US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md), [US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md).
- Why: [US-03.1.3](../../../../requirements-board/requirements/stories/US-03.1.3.md) was Retired on 16 October (Donald and Greg: no requirement for it; Ben does not want the rooms' PDFs on a Booking) and references to it were removed from other items. The prototype still lets the anaesthetist attach a photo or file to any Booking, and to a whole List, on mobile and web; the office sees List attachments read-only in the session drawer; a theatre-list PDF is seeded on Dr Souter's Tue 28 Jul List and the S1 script touches it.
- Prototype evidence:
  - `aa-prototype/src/shared/booking/BookingDetailBody.tsx:559-564` Attachments section with add and remove
  - `aa-prototype/src/shared/attachments/` AddAttachmentSheet, AttachmentStrip, AddAttachmentButton; `store/attachmentActions.ts` (`addAttachment`, `removeAttachment`); `domain/types.ts:646,724`
  - `aa-prototype/src/apps/web/screens/ListDetailView.tsx:273` "List attachments" panel; `apps/mobile/screens/ListDetailScreen.tsx:263-283`; `apps/admin/components/SlotDrawer.tsx:222`
  - `aa-prototype/src/domain/seed/index.ts:338-340` seeded attachment AT0001

### RV-02 GST period is a per-anaesthetist setting and a selector on the report
- Action: Remove. Size S.
- Catalogue: [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md), [US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md), [FT-12.2](../../../../requirements-board/requirements/stories/FT-12.2.md), [EP-12](../../../../requirements-board/requirements/stories/EP-12.md).
- Why: [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md) Retired 16 October ("No GST period on the profile ... all they have is a unit rate"); the GST report is monthly. The prototype stores `gstPeriod` (monthly, bi-monthly, six-monthly) on every anaesthetist, asks for it when adding or editing one, seeds Dr Whitaker as six-monthly, and the web GST report has a Monthly / Bi-monthly / Six-monthly switch.
- Prototype evidence:
  - `aa-prototype/src/domain/types.ts:215,237` Anaesthetist.gstPeriod, GstPeriod
  - `aa-prototype/src/apps/web/screens/AccountsScreen.tsx:39,386-411` period switch in GstReport
  - `aa-prototype/src/apps/admin/flows/AddAnaesthetistFlow.tsx:30,82` and `EditAnaesthetistSheet.tsx:37` GST period field
  - `aa-prototype/src/domain/seed/cast.ts:61` Whitaker `sixMonthly`

### RV-03 Rate x time billing line and the Method 3 "individual arrangement" gate
- Action: Remove. Size M.
- Catalogue: [US-03.3.7](../../../../requirements-board/requirements/stories/US-03.3.7.md), [US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md), [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [FT-03.7](../../../../requirements-board/requirements/stories/FT-03.7.md), [OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md).
- Why: [US-03.3.7](../../../../requirements-board/requirements/stories/US-03.3.7.md) is Retired into [US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md), which is itself Retired (other billing lines merge into events, [FT-03.7](../../../../requirements-board/requirements/stories/FT-03.7.md)) and states that a fixed-rate Contract prices the whole Procedure at BTM units x the Contract's rate, so it needs no billing line ([US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md)). The prototype still offers an hours x hourly rate line, gated by a "permits individual arrangement" flag on the Contract, with a seeded hourly Contract held by a billable party and seeded rate x time Bookings. Fixed-amount ancillary lines also remain; they can stay until events are built.
- Prototype evidence:
  - `aa-prototype/src/shared/capture/AddBillingLineSheet.tsx:10,30,96-98` "rateTime" basis, enabled only when `contract.permitsIndividualArrangement`
  - `aa-prototype/src/domain/billing/validateBookingForBilling.ts:222-229` Method 3 gate; `store/billingLineActions.ts` `individualArrangementNotPermitted`
  - `aa-prototype/src/domain/types.ts:400` Contract.permitsIndividualArrangement; `domain/seed/contracts.ts:119-132` Aria hourly Contract
  - `aa-prototype/src/apps/admin/flows/ContractEditSheet.tsx` "Permits individual arrangement (Method 3)" switch

### RV-04 Anaesthetist price adjustment: reason mandatory, offered on every Contract, no per-Contract flag
- Action: Rework. Size M.
- Catalogue: [US-03.5.3](../../../../requirements-board/requirements/stories/US-03.5.3.md), [US-04.2.6](../../../../requirements-board/requirements/stories/US-04.2.6.md), [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md), [US-05.4.1](../../../../requirements-board/requirements/stories/US-05.4.1.md), [US-05.4.2](../../../../requirements-board/requirements/stories/US-05.4.2.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [FT-03.5](../../../../requirements-board/requirements/stories/FT-03.5.md), [OQ-107](../../../../requirements-board/requirements/questions/OQ-107.md).
- Why: [US-03.5.3](../../../../requirements-board/requirements/stories/US-03.5.3.md) (the reason) is Retired into [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md), which since 16 and 19 October says the opposite: no reason is needed (the change is audited and flagged at office review; only modifiers need an explanation), and what the anaesthetist can change depends on a flag on each Contract ([OQ-107](../../../../requirements-board/requirements/questions/OQ-107.md) answered No to a global rule). The office's change is just the last edit, no reason ([US-05.4.2](../../../../requirements-board/requirements/stories/US-05.4.2.md)). The prototype demands a reason from the anaesthetist and the office on every override, offers dollar adjustment and fixed charge on every Contract, withholds percentage from the anaesthetist, and has no flag.
- Prototype evidence:
  - `aa-prototype/src/shared/capture/OverrideCard.tsx:29,57` mandatory reason; modes None / Adjustment $ / Charge $ for every anaesthetist
  - `aa-prototype/src/domain/billing/validateBookingForBilling.ts:235-239` "Give a reason for the price override"
  - `aa-prototype/src/shared/flows/PriceOverrideSheet.tsx` office override with mandatory reason
  - `aa-prototype/src/domain/types.ts` Contract has no editable-price flag

### RV-05 Prepayment is a per-Booking payment category, with a split deposit or an estimated full fee, netted automatically
- Action: Rework. Size L.
- Catalogue: [FT-06.1](../../../../requirements-board/requirements/stories/FT-06.1.md), [US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md), [US-12.1.3](../../../../requirements-board/requirements/stories/US-12.1.3.md), [US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md), [US-06.2.3](../../../../requirements-board/requirements/stories/US-06.2.3.md), [US-06.2.4](../../../../requirements-board/requirements/stories/US-06.2.4.md), [US-06.2.5](../../../../requirements-board/requirements/stories/US-06.2.5.md), [US-06.4.2](../../../../requirements-board/requirements/stories/US-06.4.2.md), [EP-06](../../../../requirements-board/requirements/stories/EP-06.md), [FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md), [US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md), [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md), [US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md), [OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md).
- Why: all of these are Retired. The live model: prepayment is triggered by a Contract flagged as prepaid (the office picks it, usually the anaesthetist's own price-list Contract); the prepaid amount is always the fixed price on that Contract's line, never an estimate, deposit or part; nothing is invoiced or credited automatically afterwards ([US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md)). The prototype keys prepayment on the Booking's billable-party route plus a "Pre-payment" patient payment category the office or anaesthetist sets, then asks for full or split; split is a flat deposit, full is an estimate calculated by the BTM calculator with no contract; the final invoice deducts the deposit and the balance is invoiced automatically; a prepayment above the final fee fails the Booking (`negativeTotal`). The unpaid-prepayment warning itself (not a block) is correct.
- Prototype evidence:
  - `aa-prototype/src/store/selectors.ts:574-579` `bookingRequiresPrepayment` = billableParty route and `selfFundedPrepayment`
  - `aa-prototype/src/domain/types.ts:796-848` PatientPaymentCategory, PrepaymentDetail full | split
  - `aa-prototype/src/domain/billing/validateBookingForBilling.ts:204-221` requires full or split and a positive deposit
  - `aa-prototype/src/domain/billing/invoiceBuild.ts:447-491` "Pre-payment, estimated full fee"; `:390` "Less pre-payment deposit already invoiced"; `:417` `negativeTotal`
  - `aa-prototype/src/domain/seed/bookings.ts:837-838,919-920` seeded split ($800 on $1,200) and full-estimate Bookings; `apps/admin/screens/InvoiceDocument.tsx:520` "estimated fee" wording

### RV-06 Protected default Type 1 Contract per hospital and direct-claim insurer, auto-created and used as a fallback
- Action: Rework. Size L.
- Catalogue: [FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md), [US-04.4.1](../../../../requirements-board/requirements/stories/US-04.4.1.md), [US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md), [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md), [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md), [EP-04](../../../../requirements-board/requirements/stories/EP-04.md).
- Why: [FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md) and [US-04.4.1](../../../../requirements-board/requirements/stories/US-04.4.1.md) (Retired) mandated a default Contract for every hospital and insurer. [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) replaces it: no hospital, insurer or procedure defaults, nothing derived from the List's location; the one default is No contract (RVG), billed to the payer on the Booking. The prototype mints a protected Type 1 default when a hospital is added or an insurer starts taking direct claims, forbids deleting or end-dating it, and falls an expired or missing Contract back to the holder's default taken from the List's hospital.
- Prototype evidence:
  - `aa-prototype/src/store/mastersActions.ts:52,100,225` default Contract created with the hospital and the insurer
  - `aa-prototype/src/store/contractActions.ts:24,119,157` `defaultContractProtected`
  - `aa-prototype/src/domain/billing/invoiceBuild.ts:86,140,161,171` `defaultContractFor` fallback from the List's hospital
  - `aa-prototype/src/domain/seed/contracts.ts:40` default Type 1 per hospital and nib

### RV-07 Second-procedure pricing keyed on the procedure ordinal
- Action: Rework. Size S.
- Catalogue: [US-04.2.5](../../../../requirements-board/requirements/stories/US-04.2.5.md), [US-05.3.4](../../../../requirements-board/requirements/stories/US-05.3.4.md), [US-05.3.1](../../../../requirements-board/requirements/stories/US-05.3.1.md), [OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md), [OQ-90](../../../../requirements-board/requirements/questions/OQ-90.md).
- Why: both Retired (Donald, 5 October): Contracts do not define how second or additional procedures are priced; the RVG default applies ([OQ-90](../../../../requirements-board/requirements/questions/OQ-90.md) answered 19 October: keep the default). The prototype lets an admin key a Type 3 price row to a procedure ordinal, prices an additional procedure from a fixed price only when that row has an ordinal (a plain row is discarded for an add-on), and seeds a $950 second-procedure price.
- Prototype evidence:
  - `aa-prototype/src/domain/types.ts:428` ContractPrice.procedureOrdinal; `domain/billing/contracts.ts:66,96-97`
  - `aa-prototype/src/domain/billing/fee.ts:204-217`; `shared/capture/feeContext.ts:55`
  - `aa-prototype/src/apps/admin/flows/ContractEditSheet.tsx` price rows with an "ord" input; `domain/seed/contracts.ts:143` CP-BAR-3

### RV-08 Additional procedures carry no modifier share; the above-four split is missing
- Action: Rework. Size M.
- Catalogue: [US-05.3.3](../../../../requirements-board/requirements/stories/US-05.3.3.md), [US-05.3.2](../../../../requirements-board/requirements/stories/US-05.3.2.md), [US-05.3.1](../../../../requirements-board/requirements/stories/US-05.3.1.md), [FT-05.3](../../../../requirements-board/requirements/stories/FT-05.3.md), [OQ-90](../../../../requirements-board/requirements/questions/OQ-90.md).
- Why: Retired into [US-05.3.1](../../../../requirements-board/requirements/stories/US-05.3.1.md), whose rule Greg confirmed on 19 October: base units on the primary only, time units on every Procedure from its own times, modifier units all on the primary while the Booking total is four or fewer, then divided equally with the remainder to the primary (7 over 3 = 3 / 2 / 2). The prototype gives an additional procedure time units only, locks B and M with "Not charged on an additional procedure", and has no split. Greg and Donald agreed on 19 October that the prototype's additional-procedure entry is wrong (Phase 23).
- Prototype evidence:
  - `aa-prototype/src/domain/billing/fee.ts:103-109` `splitBillingUnits` returns time units only for an additional procedure
  - `aa-prototype/src/shared/capture/UnitsCard.tsx:59,77` locked B and M rows
  - `aa-prototype/src/shared/capture/BtmCaptureBlock.tsx` "bills for time units only" note

### RV-09 P1 "absorbed" by the wrong codes, and struck through instead of shown selected at 0 units
- Action: Rework. Size M.
- Catalogue: [US-05.2.3](../../../../requirements-board/requirements/stories/US-05.2.3.md), [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md), [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md), [OQ-94](../../../../requirements-board/requirements/questions/OQ-94.md).
- Why: [US-05.2.3](../../../../requirements-board/requirements/stories/US-05.2.3.md) was Retired 2 October, but [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) and [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) bring the idea back correctly: P1 is included in the six Neurosurgery codes (H7A to H9b) and the fourteen Spine codes, shown selected at 0 units so it cannot be added twice. The catalogue is internally split on removal: [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) and Donald's 20 October decision say nothing is locked (she can turn it off), while the first paragraph of [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) still says it cannot be unselected; build to the 20 October decision and flag the leftover wording. The prototype marks seven demo codes as absorbing P1, five of them (hip x3, shoulder x2) not in the RVG included-modifier list; Neurosurgery codes are not in the seed; the behaviour is a visible but inert struck-through chip with a refusal caption, not a selected 0-unit pill. (Verifier correction: the old text said "silent" and "locked"; the caption is shown, and the catalogue does not lock.)
- Prototype evidence:
  - `aa-prototype/src/domain/seed/rvgCodes.ts:23-25,32-33` hip and shoulder codes absorb P1; `:36-37` lumbar (Spine, right in concept)
  - `aa-prototype/src/domain/billing/modifierUnits.ts:58-62` refusal text; `shared/capture/ModifierChips.tsx` struck-through chip; `ProcedureCodeCard.tsx:60-64` caption
  - Source of truth: `requirements-board/requirements/artifacts/files/NZSA RVG 2021 included modifiers.csv`

### RV-10 Ranged base code is hard-bounded to the published range
- Action: Rework. Size S.
- Catalogue: [US-03.3.2](../../../../requirements-board/requirements/stories/US-03.3.2.md), [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md), [OQ-32](../../../../requirements-board/requirements/questions/OQ-32.md), [OQ-56](../../../../requirements-board/requirements/questions/OQ-56.md).
- Why: Retired into [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md): the anaesthetist may enter any base units, including outside the range; an out-of-range value warns the office after the procedure and is never blocked ([OQ-56](../../../../requirements-board/requirements/questions/OQ-56.md) answered). The prototype clamps the stepper to the range and refuses completion outside it. Drop the guard together with adding the office warning.
- Prototype evidence:
  - `aa-prototype/src/domain/billing/validateBookingForBilling.ts:152-162` completion blocked unless `baseUnitsSelected` is within min..max
  - `aa-prototype/src/shared/capture/ProcedureCodeCard.tsx:48-58,125` `selectRangeUnits` clamps

### RV-11 The engine re-resolves Contract and payer at billing time; nothing is locked at AUTHORISED
- Action: Rework. Size L.
- Catalogue: [US-08.1.2](../../../../requirements-board/requirements/stories/US-08.1.2.md), [US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md), [US-04.3.5](../../../../requirements-board/requirements/stories/US-04.3.5.md), [US-07.3.1](../../../../requirements-board/requirements/stories/US-07.3.1.md), [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md).
- Why: [US-08.1.2](../../../../requirements-board/requirements/stories/US-08.1.2.md) (Retired into [US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md)): the engine does not resolve a route or payer; it reads the Contract already locked to each Procedure, snapshotted at AUTHORISED. The prototype's stored Contract is authoritative only while in effect on the List date; otherwise it falls back to the holder's default or resolves by route; the payer is derived from route and holder; nothing is snapshotted, so a later master edit (or the Resolve and retry button) changes what a re-run prices.
- Prototype evidence:
  - `aa-prototype/src/domain/billing/invoiceBuild.ts:114-190` `resolveContractForProcedure`; `:192-212` `counterpartyForProcedure`
  - `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx:85` Resolve and retry un-end-dates the master Contract
  - No Contract-version snapshot on the Procedure in `domain/` or `store/`

## 2. FutureStillShowcased

### RV-12 Surgeon PDF upload and ingest is shown unbadged as product
- Action: Hide from demo. Size S.
- Catalogue: [FT-02.2](../../../../requirements-board/requirements/stories/FT-02.2.md), [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md), [US-02.2.2](../../../../requirements-board/requirements/stories/US-02.2.2.md), [US-02.2.3](../../../../requirements-board/requirements/stories/US-02.2.3.md), [OQ-108](../../../../requirements-board/requirements/questions/OQ-108.md).
- Why: [US-02.2.1](../../../../requirements-board/requirements/stories/US-02.2.1.md) is Future Work ("not at the stage of thinking that will be in scope for MVP"); [FT-02.2](../../../../requirements-board/requirements/stories/FT-02.2.md) ranks it second to the hospital download. The Admin Integrations "Surgeon PDFs" tab carries no Future badge while the Messages and Feed tabs do: a facsimile beside editable rows, NHI correction, per-row and Ingest all, plus an "Ingest PDF row" demo action and Bookings seeded with source surgeonPdf. Data quality and Validators (NHI, ethnicity) are in scope and stay.
- Prototype evidence:
  - `aa-prototype/src/apps/admin/screens/IntegrationMonitorScreen.tsx:64,72` tab without `future`; `:62-63` Messages and Feed use `future`
  - `aa-prototype/src/store/integrationActions.ts:453` `ingestPdfRow`; `domain/integrations/pdfSamples.ts`
  - `aa-prototype/src/shared/demoTriggers/registry.ts` `ingest-pdf-row`

### RV-13 Automated modify, reschedule and cancel from hospital messages is shown working, with a day move applied as a move
- Action: Hide from demo. Size S.
- Catalogue: [US-02.5.1](../../../../requirements-board/requirements/stories/US-02.5.1.md), [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md), [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md), [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md), [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md), [US-14.1.1](../../../../requirements-board/requirements/stories/US-14.1.1.md).
- Why: all Future Work. Until then a change arrives through the admin's review. The canned S13 to S15 messages are applied by an integration actor with no admin: a same-List retime, a cross-List move on S13, a modification and a cancellation. [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md) (19 October) says a List never moves day: a Booking moved to another day is a cancellation plus a new Booking, so the cross-List S13 move contradicts it. [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md) wants inbound changes accepted until the List is AUTHORISED; the prototype refuses an integration write once the List is SUBMITTED and parks it for manual intervention. [US-02.5.6](../../../../requirements-board/requirements/stories/US-02.5.6.md) (concurrent edits) is not present. Keep S13 to S15 out of the scripted demo. (Verifier correction: the `fire-hospital-message` and `replay-hospital-message` demo actions already carry the Future-scope badge and the Messages tab is badged, so the issue is the behaviour they demonstrate, mainly the cross-List move, not a missing badge.)
- Prototype evidence:
  - `aa-prototype/src/store/integrationActions.ts:186-224` S13 reassign across Lists, S14, S15; `:258-285` locked target parks as manual intervention
  - `aa-prototype/src/store/lifecycle.ts:57-66` `integrationImmutable` once not ACTIVE
  - `aa-prototype/src/domain/integrations/messages.ts` canned S13 x2, S14 x2, S15, offered by the `fire-hospital-message` demo action

### RV-14 HL7 v2 to FHIR simulator, live drip, and Scenario S1 built on them
- Action: Rework. Size S.
- Catalogue: [FT-14.1](../../../../requirements-board/requirements/stories/FT-14.1.md), [FT-14.2](../../../../requirements-board/requirements/stories/FT-14.2.md), [FT-14.3](../../../../requirements-board/requirements/stories/FT-14.3.md), [US-14.1.1](../../../../requirements-board/requirements/stories/US-14.1.1.md), [US-14.2.1](../../../../requirements-board/requirements/stories/US-14.2.1.md), [US-14.3.1](../../../../requirements-board/requirements/stories/US-14.3.1.md), [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md).
- Why: HL7 v2, FHIR R4 and near-real-time are Future; the in-scope release is the St George's and Southern Cross download into a manual matching screen ([US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md)). Phase 14 badged the simulator, the Messages and Feed config tabs and the demo actions, and S1's text calls the beat a Future-scope illustration. What remains: the Integrations page intro (unbadged) says HL7 messages are "translated to FHIR R4 and applied to the schedule", the simulator offers a one-per-second "Start live feed" and raw HL7 PID segments, and Scenario S1 still opens the presenter story with a pushed message creating a Booking (its text admits the in-scope path "arrives in a later build"). Rework S1 around sync into a matching screen (Phases 33, 34). (Verifier correction: the earlier claim that the Admin nav "leads with" Integrations is wrong, it is the eighth of ten items; and the S1 beat is already labelled Future.) Size cut from M to S for the residual copy; the S1 rework rides with Phases 33 and 34.
- Prototype evidence:
  - `aa-prototype/src/apps/admin/screens/IntegrationMonitorScreen.tsx:49-57` intro text
  - `aa-prototype/src/apps/demo/DemoIntegrations.tsx:62-77` live feed; raw HL7 and FHIR bundle panes
  - `aa-prototype/src/apps/demo/DemoControlPanel.tsx:254-262` S1 on MSG-STG-1001
  - `aa-prototype/src/apps/admin/components/SideNav.tsx:45` Integrations in the product nav (eighth of ten items, with an attention badge; see RV-15)

### RV-15 Reliability tooling (retries, dead-letter queue, manual intervention): residual unbadged nav badge, patient names in the log
- Action: Keep as demo scaffold. Size S.
- Catalogue: [FT-14.5](../../../../requirements-board/requirements/stories/FT-14.5.md), [US-14.5.1](../../../../requirements-board/requirements/stories/US-14.5.1.md), [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md).
- Why: Future ([FT-14.5](../../../../requirements-board/requirements/stories/FT-14.5.md), [US-14.5.1](../../../../requirements-board/requirements/stories/US-14.5.1.md)). The prototype retries a message three times on a timer, dead-letters it, shows an amber attention badge in the side nav, offers Reprocess, and lists the patient's name on every log row, while [US-14.5.1](../../../../requirements-board/requirements/stories/US-14.5.1.md) wants a restricted working view that carries only what is needed. (Verifier correction: the Messages tab that holds the log, banner and Reprocess is already badged Future with a Future-scope note, so this is no longer an unbadged showcase. What stays is the amber attention badge on the side nav item, which has no Future marking, and the Patient column; both fall away when Phase 34 demotes the tab. Downgraded from Hide from demo to Keep as demo scaffold.)
- Prototype evidence:
  - `aa-prototype/src/store/integrationActions.ts:42` `MAX_ATTEMPTS = 3`; `:513` `wireIntegrationRetry`
  - `aa-prototype/src/apps/admin/screens/IntegrationMonitorScreen.tsx` attention banner, Reprocess, Patient column
  - `aa-prototype/src/main.tsx:11-20` wires the retry job

### RV-16 Further hospital feeds and automatic application with no matching step
- Action: Rework. Size L.
- Catalogue: [FT-14.6](../../../../requirements-board/requirements/stories/FT-14.6.md), [US-14.6.1](../../../../requirements-board/requirements/stories/US-14.6.1.md), [US-14.6.2](../../../../requirements-board/requirements/stories/US-14.6.2.md), [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md), [US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md), [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md).
- Why: further feeds and automatic matching are Future; the first release keeps a manual matching review, and a row with no NHI waits on the unmatched queue ([US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md), [US-11.1.4](../../../../requirements-board/requirements/stories/US-11.1.4.md)). The prototype has three feeds, one of them Christchurch Public (not one of the two integrated hospitals), and creates the Booking straight onto the target List with no review queue, no last-synced display and no unmatched queue. The in-scope matching screen does not exist, so the demo shows the Future end state instead. (Verifier note: `applyEffect` in `integrationActions.ts` is already commented as interim until Phase 33's matching screen, and the Feed config tab is badged Future; the gap is the missing matching screen, not an unlabelled showcase.)
- Prototype evidence:
  - `aa-prototype/src/domain/integrations/feeds.ts` FEED-STG, FEED-CPH, FEED-SX
  - `aa-prototype/src/store/integrationActions.ts:137-158` S12 `createBooking` for an integration actor
  - `aa-prototype/src/domain/types.ts` Booking.source `hospitalDownload` stamped on integration-created Bookings

### RV-17 Photo of the booking card still exists as a badged demo action
- Action: Keep as demo scaffold. Size S.
- Catalogue: [US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md), [US-02.4.2](../../../../requirements-board/requirements/stories/US-02.4.2.md), [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md).
- Why: Future Work. Phase 15b removed the chooser from Add a booking; photo capture is now reachable only through the "Photo capture (Future scope)" demo action, with a Future-scope badge on the demo action and "Simulated capture" badges on the flow. Low risk of misleading. If it is ever shown, keep the badge.
- Prototype evidence:
  - `aa-prototype/src/shared/flows/AddBookingFlow.tsx:42-58` photo prong only via `initialMode="photo"`
  - `aa-prototype/src/shared/flows/PhotoCaptureFlow.tsx`, `sampleExtractions.ts`; `shared/demoTriggers/registry.ts` `photo-capture-future`

## 3. DecisionSuperseded

### RV-18 Billing route plus Type 1/2/3 Contracts, instead of one Contract per Procedure
- Supersedes: Phase 08 route resolution and governing-Contract rulings; the 2026-07-22 7th review billing-route rulings.
- Action: Rework. Size XL.
- Catalogue: [EP-04](../../../../requirements-board/requirements/stories/EP-04.md), [US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [US-04.3.1](../../../../requirements-board/requirements/stories/US-04.3.1.md), [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md), [US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md), [FT-03.4](../../../../requirements-board/requirements/stories/FT-03.4.md), [US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md), [OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md), [OQ-93](../../../../requirements-board/requirements/questions/OQ-93.md).
- Why: each Procedure selects exactly one Contract, which sets the price and who is invoiced (its holder when it pays AA, else the payer on the Booking); Contract behaviour is set by flags (billed holder, editable price, prepaid), not kinds; the anaesthetist can change the Contract until AUTHORISED; a Booking cannot complete without one. The prototype is built on a per-Procedure billing route (Contract holder / Billable party / Insurer), Type 1/2/3 Contracts the office picks in a billing setup sheet (the anaesthetist cannot), a patient payment category that drives funding, and completion that needs a route, not a Contract. Keep as a labelled simplification until Phases 18 to 21.
- Prototype evidence:
  - `aa-prototype/src/domain/types.ts` Procedure.billingRoute, patientPaymentCategory, Contract.type
  - `aa-prototype/src/domain/billing/validateBookingForBilling.ts:125` route required for completion
  - `aa-prototype/src/shared/flows/ManualBookingForm.tsx` route chosen when adding a Booking; `EditBillingSetupSheet.tsx` office-only Contract choice
  - `aa-prototype/src/shared/format.ts` `ROUTE_LABELS`; `apps/admin/screens/masters/ReferenceViews.tsx` Type 1 / 2 / 3 list

### RV-19 The anaesthetist's edit rights end at SUBMITTED
- Supersedes: binding convention 6 and the Phase 03 and 07 guards ("SUBMITTED strips anaesthetist edit rights").
- Action: Rework. Size M.
- Catalogue: [US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md), [FT-07.2](../../../../requirements-board/requirements/stories/FT-07.2.md), [US-02.5.4](../../../../requirements-board/requirements/stories/US-02.5.4.md), [EP-07](../../../../requirements-board/requirements/stories/EP-07.md), [EP-03](../../../../requirements-board/requirements/stories/EP-03.md), [US-07.2.3](../../../../requirements-board/requirements/stories/US-07.2.3.md).
- Why: reversed on 16 October and confirmed on 19 October: the anaesthetist can still edit a submitted List until the office AUTHORISES it, and the last edit stands. The prototype refuses any anaesthetist write on a SUBMITTED List ("Only the office can change it now") and the UI hides every edit control; the submit confirm sheet tells her she will not be able to change the Bookings afterwards.
- Prototype evidence:
  - `aa-prototype/src/store/lifecycle.ts:71-73` `listSubmitted` refusal in `editRefusal` (also `:602`)
  - `aa-prototype/src/shared/booking/BookingDetailBody.tsx:313` `canEdit` requires ACTIVE for the anaesthetist
  - `aa-prototype/src/shared/flows/SubmitListSheet.tsx:109-110` confirm wording

### RV-20 A patient without an NHI is allowed (provisional record, "NHI pending")
- Supersedes: the Phase 03 and 10 provisional-patient rulings and the 2026-07-22 NHI handling.
- Action: Rework. Size M.
- Catalogue: [US-11.1.4](../../../../requirements-board/requirements/stories/US-11.1.4.md), [US-11.1.1](../../../../requirements-board/requirements/stories/US-11.1.1.md), [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md), [US-03.1.5](../../../../requirements-board/requirements/stories/US-03.1.5.md), [OQ-49](../../../../requirements-board/requirements/questions/OQ-49.md).
- Why: the NHI is mandatory (Greg 19 October: "It's mandatory now, so that's that"): a Booking cannot be saved without one; an incoming row without one waits at intake until the office adds it, and no patient record is made from it. The prototype's add-booking form takes the NHI as optional, `upsertPatient` creates a provisional record with no NHI, screens show "NHI pending", and the seed has a no-NHI patient (Noah Prescott).
- Prototype evidence:
  - `aa-prototype/src/shared/flows/ManualBookingForm.tsx:113` NHI sent only when typed
  - `aa-prototype/src/store/intake.ts:97-127` `createdProvisional`
  - `aa-prototype/src/shared/format.ts:86-89` "NHI pending"; `domain/seed/patients.ts` provisional patient

### RV-21 Completion rules follow the RFP's route and times, not the Contract, with no modifier explanation
- Supersedes: the Phase 04 completion-validation ruling (RVG code or billing line, times whenever an RVG code is set).
- Action: Rework. Size M.
- Catalogue: [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md), [US-03.5.2](../../../../requirements-board/requirements/stories/US-03.5.2.md), [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md), [US-03.3.3](../../../../requirements-board/requirements/stories/US-03.3.3.md), [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md), [FT-03.6](../../../../requirements-board/requirements/stories/FT-03.6.md).
- Why: a Procedure completes when it has a Contract, its times (only where the Contract prices from time, not on a fixed price) and a short explanation for each modifier claimed; the RVG code is optional; the holder's references are the office's job. The prototype requires a billing route, an RVG code or a billing line, and start and handover whenever an RVG code is set (even on a fixed price), asks for no modifier explanation and has no Contract check.
- Prototype evidence:
  - `aa-prototype/src/domain/billing/validateBookingForBilling.ts:125-131,139-149`
  - `aa-prototype/src/shared/capture/ModifierChips.tsx` no explanation field

### RV-22 ASA class auto-seeds modifier units
- Supersedes: 2026-07-22 "ASA seeding values" (AS1 0, AS2 1, AS3 3, AS4 4) and the design's ASA card.
- Action: Rework. Size M.
- Catalogue: [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md), [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md), [US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md), [US-03.3.8](../../../../requirements-board/requirements/stories/US-03.3.8.md), [OQ-95](../../../../requirements-board/requirements/questions/OQ-95.md).
- Why: [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) (edited 20 October): the system pre-applies only the age modifier and modifiers the base units already include, none locked; "no other modifier is selected for the anaesthetist, whatever the patient's ASA grade"; the ASA grade is chosen like any other modifier, with an explanation. The prototype adds the AS code to M automatically from a dedicated ASA control, with "ASA III seeds +3 modifier units". The final answer still waits on Ben ([OQ-95](../../../../requirements-board/requirements/questions/OQ-95.md)), so treat as a labelled simplification.
- Prototype evidence:
  - `aa-prototype/src/domain/billing/fee.ts:79-84` ASA class added to the modifier codes
  - `aa-prototype/src/domain/billing/modifierCodes.ts:132-145` `ASA_SEED_UNITS`
  - `aa-prototype/src/shared/capture/AsaCard.tsx:27,47`; `UnitsCard.tsx:102-106`

### RV-23 Post-op addendum is a new linked Booking on today's free session
- Supersedes: the Phase 09 post-op addendum reading.
- Action: Rework. Size L.
- Catalogue: [FT-03.7](../../../../requirements-board/requirements/stories/FT-03.7.md), [US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md), [US-03.7.2](../../../../requirements-board/requirements/stories/US-03.7.2.md), [US-03.7.3](../../../../requirements-board/requirements/stories/US-03.7.3.md), [FT-08.6](../../../../requirements-board/requirements/stories/FT-08.6.md), [US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md), [US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md), [OQ-24](../../../../requirements-board/requirements/questions/OQ-24.md), [OQ-63](../../../../requirements-board/requirements/questions/OQ-63.md).
- Why: a pre-op or post-op event is an event on the original Procedure (a charge or credit with free text), billed through the normal review and the next run; the original Booking stays immutable ([US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md)). The prototype creates a second linked Booking on a free session of the original anaesthetist today, which then runs a full capture, submit, authorise cycle. A new Booking is still allowed for significant work ([US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md) notes this), but not as the standard path. Other billing lines now merge into the same events.
- Prototype evidence:
  - `aa-prototype/src/store/bookingActions.ts:199` `addPostOpAddendum` (needs an open session today)
  - `aa-prototype/src/shared/booking/BookingDetailBody.tsx:431` "Add post-op event"; `domain/types.ts` Booking.bookingType, addendumOfBookingId; `shared/demoTriggers/registry.ts` `stage-post-op`

### RV-24 A prepaid invoice gets a full receivable and payable pair that pays the anaesthetist; the catalogue pays it into a holding account
- Supersedes: Phase 09/10 decision D-pre-invoice-pair and the Phase 41 "payee repoint" seam comments.
- Action: Rework. Size L.
- Catalogue: [OQ-80](../../../../requirements-board/requirements/questions/OQ-80.md), [EP-06](../../../../requirements-board/requirements/stories/EP-06.md), [US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md), [US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md), [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md), [FT-06.4](../../../../requirements-board/requirements/stories/FT-06.4.md), [US-09.1.3](../../../../requirements-board/requirements/stories/US-09.1.3.md), [US-01.4.6](../../../../requirements-board/requirements/stories/US-01.4.6.md), [OQ-70](../../../../requirements-board/requirements/questions/OQ-70.md).
- Why: 19 October: a prepayment is held in a prepay holding account, not paid to the anaesthetist; the pair is created when an admin approves the prepayment invoice, its other side is the holding account, a move changes nothing in the ledger, and a second pair pays whoever did the List at authorisation. The prototype lets the office press "Raise pre-procedure invoice" (no approval step), hands the invoice to Xero as an ordinary receivable and payable pair "so a fully-prepaid procedure still has a disbursement path", and the payable is authorised to the anaesthetist as the patient pays. The settlement trigger itself ("confirmed and submitted") is still to confirm.
- Prototype evidence:
  - `aa-prototype/src/store/xeroHandoff.ts:309-318` `handoffCasesForBooking` (pre-invoice gets the full pair)
  - `aa-prototype/src/store/prepaymentActions.ts:52-150` raise action, no approval step
  - `aa-prototype/src/store/slotActions.ts:458` and `store/listMoveActions.ts:142` "Phase 41 seam" comments (payee repoint on a move, now void)

### RV-25 Unavailability (including sickness) still produces a conflict flag, and the office path keeps the List
- Supersedes: Phase 30 ("Reassigning from a closed session keeps its status", conflicts derived from facts for an unavailable Slot) and Phase 31 ("anaesthetist unavailability is not converted automatically"); the office's sickness entry.
- Action: Rework. Size M.
- Catalogue: [OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md), [US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md), [US-01.5.4](../../../../requirements-board/requirements/stories/US-01.5.4.md), [US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md), [US-01.6.3](../../../../requirements-board/requirements/stories/US-01.6.3.md), [US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md).
- Why: since 19 October an anaesthetist never keeps a List on a Slot marked unavailable, planned or short-notice sickness: the transfer or return is forced when the Slot is marked, and the conflict flag covers hospital closures only. The prototype's conflict rule still raises an "Anaesthetist unavailable" availability conflict for any closed Slot, the office's "Simulate sickness" demo action writes Unavailable over a List that keeps its Bookings, the office assign and phone-advice paths accept a closed session and flag it, and the Conflicts screen and Admin Day grid show those flags. The catalogue itself notes that [US-01.6.3](../../../../requirements-board/requirements/stories/US-01.6.3.md) (office assigns onto an unavailable Slot with a warning) is a tension left open.
- Prototype evidence:
  - `aa-prototype/src/domain/conflicts.ts:114` `expectedConflicts` raises `availability` conflicts; `CONFLICT_REASONS` includes "Anaesthetist unavailable"
  - `aa-prototype/src/store/demoSimulations.ts:49` `simulateSickness` (registered as a demo action on the Day view and Conflicts)
  - `aa-prototype/src/store/slotActions.ts` `assignListToSlot` accepts a closed session

### RV-26 Provisional readings answered on 19 October are still built as provisional
- Supersedes: Phase 32 OQ-84 recommendation ("Free by default, still being confirmed"), Phase 32 notification pool (keep every notice, paginated, "still being confirmed").
- Action: Rework. Size S.
- Catalogue: [OQ-84](../../../../requirements-board/requirements/questions/OQ-84.md), [US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md), [US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md), [OQ-79](../../../../requirements-board/requirements/questions/OQ-79.md), [FT-13.8](../../../../requirements-board/requirements/stories/FT-13.8.md), [US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md), [US-13.8.3](../../../../requirements-board/requirements/stories/US-13.8.3.md), [US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md), [US-03.6.3](../../../../requirements-board/requirements/stories/US-03.6.3.md).
- Why: OQ-84 is answered: whoever moves a List, the anaesthetist or the office, is asked whether the vacated Slot becomes free or unavailable; the prototype carries a provisional hint and footnote and the office flow already asks, so only the label is stale. OQ-79 is answered: notices and to-dos are active or resolved, cleared by a tick for the whole team, never expire, and Lists and Bookings get an "alert the office" option; the prototype keeps every notice with no resolve state and the page caption says what shows "is still being confirmed".
- Prototype evidence:
  - `aa-prototype/src/domain/listMoves.ts:45-48` `VACATED_SESSION_DEFAULT`; `shared/flows/MoveListSheet.tsx:261` provisional hint
  - `aa-prototype/src/domain/notifications.ts` `NOTIFICATION_POOL_RULE`; `apps/admin/screens/NotificationsScreen.tsx:41`

### RV-27 The office moves a single Booking to any List on any day (lower confidence)
- Supersedes: the 2026-07-22 third review #3 (single-Booking move across any List).
- Action: Rework. Size S.
- Catalogue: [US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md), [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md), [OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md), [OQ-87](../../../../requirements-board/requirements/questions/OQ-87.md), [FT-01.4](../../../../requirements-board/requirements/stories/FT-01.4.md).
- Why: a List never moves day; a Booking on another day is a cancellation plus a new Booking ([OQ-87](../../../../requirements-board/requirements/questions/OQ-87.md)). A single Booking moves only to a colleague who is free in that Slot, which creates a List for it, never into another anaesthetist's existing List, with a type-ahead search ([OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md)). The prototype's office "Move booking" flow lets the office pick any target day and any existing List, with an advisory pairing flag, and there is no anaesthetist-side single-Booking move. The office rule is not spelled out separately in the catalogue, so lower confidence on the office half. (Verifier correction: [US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md) and [OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md) state the rule for the anaesthetist's own move; [FT-01.4](../../../../requirements-board/requirements/stories/FT-01.4.md) and [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) say the office also moves a Booking, through a finder of colleagues free in that Slot, so a same-Slot, free-colleague target is the safest reading. Nothing forbids the office moving a Booking to another day or into an existing List, so treat that half as a question for the owner, not a defect. The missing anaesthetist-side single-Booking move is a gap, not drift. Size cut from M to S.)
- Prototype evidence:
  - `aa-prototype/src/apps/admin/flows/MoveBookingFlow.tsx:1-40` target day then any candidate List
  - `aa-prototype/src/store/lifecycle.ts:574` `reassignBooking`

### RV-28 Office edits to a Booking write through on every tap, with no Save
- Supersedes: 2026-07-23 Phase 04 capture-UX ruling ("write-through per tap, never debounce"), for the office only.
- Action: Rework. Size M.
- Catalogue: [US-02.3.2](../../../../requirements-board/requirements/stories/US-02.3.2.md), [US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md), [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md), [US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md), [OQ-69](../../../../requirements-board/requirements/questions/OQ-69.md).
- Why: an admin edit in the Admin App applies only on an explicit Save, warns on leaving with unsaved edits, and records the changed fields for the update email. The anaesthetist keeps write-through. The Admin Booking detail wraps the same shared body, so every control writes at once and there is no Save, Discard or unsaved warning.
- Prototype evidence:
  - `aa-prototype/src/shared/booking/BookingDetailBody.tsx:313` same body for the office actor
  - `aa-prototype/src/apps/admin/screens/AdminBookingDetail.tsx` wraps it unchanged

### RV-29 The anaesthetist's Booking shows no calculation, units or price
- Supersedes: 2026-09-28 owner decision "Anaesthetist Card shows no calculation; the Off / Units / Fee control is removed".
- Action: Rework. Size S.
- Catalogue: [US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md), [FT-03.5](../../../../requirements-board/requirements/stories/FT-03.5.md), [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md), [US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md).
- Why: the anaesthetist sees the Contract's pricing basis with the figure, and changes the price, rate or discount where the Contract allows ([US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md), [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md)); they also see the prepaid amount ([US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md)). That needs the price on screen. It was an owner (Donald) decision, so confirm with him before changing; the demo fee is also inconsistent today because the web List table shows units and fee per Booking while the Booking detail hides them.
- Prototype evidence:
  - `aa-prototype/src/shared/booking/BookingDetailBody.tsx:133` `showBookingTotal = actor.role !== 'anaesthetist'`
  - `aa-prototype/src/apps/web/screens/ListDetailView.tsx` Units and Fee columns still visible to the anaesthetist

### RV-30 The payer is a per-Procedure billable-party record tied to a "Billable party" route
- Supersedes: 2026-07-22 3rd and 7th review billable-party rulings.
- Action: Rework. Size M.
- Catalogue: [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md), [FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md), [US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md), [US-08.2.1](../../../../requirements-board/requirements/stories/US-08.2.1.md), [OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md), [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md).
- Why: the payer is one per Booking, a plain name and email prefilled from the patient and editable by the office or the anaesthetist to a parent or guardian; whether a billable-party table backs it is unsettled. Every other arrangement, including a hospital taking the invoice, is a Contract. The outcome (guardian pays) is kept; the scope (Procedure, not Booking), the fields (no email) and the route coupling are not. The prototype creates a billable-party master through a "New guardian" sheet (name, relationship, phone), reachable by the office after add time and only on the Billable party route.
- Prototype evidence:
  - `aa-prototype/src/domain/types.ts` Procedure.billablePartyId; `store/billablePartyActions.ts:21`
  - `aa-prototype/src/shared/flows/EditBillingSetupSheet.tsx` "New guardian"; `ManualBookingForm.tsx` billable party fields

### RV-31 Funding split is an office-only per-line editor, not a Booking action with typed $ or %
- Supersedes: 2026-07-22 7th review A4/B4 (per-billing-line funder allocation).
- Action: Rework. Size M.
- Catalogue: [US-08.2.3](../../../../requirements-board/requirements/stories/US-08.2.3.md), [US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md), [OQ-68](../../../../requirements-board/requirements/questions/OQ-68.md), [OQ-77](../../../../requirements-board/requirements/questions/OQ-77.md), [US-08.6.4](../../../../requirements-board/requirements/stories/US-08.6.4.md).
- Why: any user presses a split button on a Procedure's Contract line and types each party's share as $ or %; each party gets its own invoice; no setting on the Contract or Procedure ([US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md) Retired). Before the combined invoice is sent a split is a normal edit; after, a credit and rebill ([OQ-77](../../../../requirements-board/requirements/questions/OQ-77.md), 19 October). The prototype's editor is office-only, per billing line, amounts only, must sum to the fee, and stores a funder override on each line. The two-funder outcome (insurer plus patient gap) is kept.
- Prototype evidence:
  - `aa-prototype/src/shared/flows/FunderAllocationSheet.tsx`; `store/billingLineActions.ts:138,218` (office only)
  - `aa-prototype/src/domain/types.ts` BillingLine.funderOverride; `shared/booking/OfficeBillingSetup.tsx` "Funder allocation"; seeded two-funder Booking

### RV-32 Contracts are edited in place, deletable, and the billing monitor un-end-dates one to retry
- Supersedes: Phase 08 contract maintenance and the S4 "billing failure" beat.
- Action: Rework. Size M.
- Catalogue: [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md), [US-04.1.6](../../../../requirements-board/requirements/stories/US-04.1.6.md), [FT-04.1](../../../../requirements-board/requirements/stories/FT-04.1.md), [EP-04](../../../../requirements-board/requirements/stories/EP-04.md), [US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md).
- Why: each Contract is a series of dated versions; every change creates a new version from a date the office chooses, never in the past; nothing is backdated and nothing is deleted; changes are staged, reviewed and submitted. The prototype edits a Contract's dates and terms in place, lets the office delete an unreferenced one, and the billing monitor's "Resolve and retry" clears a Contract's end date to make a failed Booking price again; the S4 demo action ends a Contract in the past to cause the failure.
- Prototype evidence:
  - `aa-prototype/src/store/contractActions.ts:106,152` `editContract`, `deleteContract`
  - `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx:85` `editContract(... { effectiveToISO: undefined })`
  - `aa-prototype/src/shared/demoTriggers/registry.ts` `billing-failure`

### RV-33 The GST report lists customer receipts, not the payments passed to the anaesthetist
- Supersedes: 2026-07-24 Phase 10 GST-activity reading.
- Action: Rework. Size S.
- Catalogue: [US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md), [US-10.1.2](../../../../requirements-board/requirements/stories/US-10.1.2.md), [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md), [OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md).
- Why: [US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md) is a monthly list of the payments AA has passed to the anaesthetist with the GST component of each (cash basis); an invoice part-paid falls into later months. The prototype lists receipts on the day the customer pays, before any payout, on both mobile (GST this month) and web.
- Prototype evidence:
  - `aa-prototype/src/store/selectors.ts:975` `gstActivityFor` reads `billing.receipts`
  - `aa-prototype/src/apps/web/screens/AccountsScreen.tsx:391` GstReport; `apps/mobile/screens/BalancesScreen.tsx` GST this month

## 4. UnbackedBehaviour

### RV-34 Dashboard Productivity and Leave panels
- Action: Hide from demo. Size S.
- Catalogue: [US-12.2.3](../../../../requirements-board/requirements/stories/US-12.2.3.md), [US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md), [US-08.3.5](../../../../requirements-board/requirements/stories/US-08.3.5.md).
- Why: the dashboard summarises the calendar, the financial position and locum availability. Productivity tiles (units, lists, fees, six-month trend) have no backing, and the Leave rows (Approved, Pending) imply an approval workflow while availability is something the anaesthetist sets herself ([US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md)). Both are seeded for one persona and not derived from Bookings or Slots.
- Prototype evidence:
  - `aa-prototype/src/apps/web/screens/DashboardScreen.tsx:230-277`
  - `aa-prototype/src/domain/seed/anaesthetistDashboard.ts:44-60`

### RV-35 Receivables ageing buckets, age chips and an Overdue view
- Action: Rework. Size M.
- Catalogue: [US-12.2.1](../../../../requirements-board/requirements/stories/US-12.2.1.md), [US-08.3.5](../../../../requirements-board/requirements/stories/US-08.3.5.md), [OQ-59](../../../../requirements-board/requirements/questions/OQ-59.md).
- Why: [OQ-59](../../../../requirements-board/requirements/questions/OQ-59.md) is answered: a flat list of unpaid payables, oldest first, with no ageing buckets, no age chips and no Overdue view; invoices have no due date. The prototype has Current / 31 to 60 / 61 to 90 / 90+ bars on the web Dashboard, an Overdue tab with bucket columns, and an age chip on every mobile Balances row (amber over 60 days).
- Prototype evidence:
  - `aa-prototype/src/store/selectors.ts:945` `receivablesAgingFor`
  - `aa-prototype/src/apps/web/screens/DashboardScreen.tsx:193-220`; `AccountsScreen.tsx:32,65` Overdue tab
  - `aa-prototype/src/apps/mobile/screens/BalancesScreen.tsx` age chip

### RV-36 "Prior balance" tag has no threshold and sits on the billing monitor after authorisation
- Action: Rework. Size M.
- Catalogue: [US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md), [US-11.3.1](../../../../requirements-board/requirements/stories/US-11.3.1.md), [US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md), [OQ-74](../../../../requirements-board/requirements/questions/OQ-74.md), [OQ-33](../../../../requirements-board/requirements/questions/OQ-33.md).
- Why: the alert fires when a Booking is created or matched, for an invoice unpaid beyond a configurable 90-day threshold counted from the invoice date (mild or strong, yellow or red, never blocking); a credit balance is mild. The prototype tags any open prior episode with no threshold, only on the billing monitor and only after authorisation.
- Prototype evidence:
  - `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx:210` "Prior balance" chip
  - `aa-prototype/src/store/selectors.ts:552` `patientHasOutstandingPriorEpisode`

### RV-37 Review flag "ACC should not bill the patient directly"
- Action: Remove. Size S.
- Catalogue: [US-05.5.1](../../../../requirements-board/requirements/stories/US-05.5.1.md), [FT-05.5](../../../../requirements-board/requirements/stories/FT-05.5.md), [US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md).
- Why: an ACC-funded Procedure is an ordinary Procedure priced by the contract holder's ACC Contract; ACC is invisible to the engine. The flag implies an ACC rule the engine does not have and is derived from the billing route, so it falls away with RV-18. The ACC chips on the money lists are informational and harmless.
- Prototype evidence:
  - `aa-prototype/src/apps/admin/reviewFlags.ts:75-88`; test `reviewFlags.test.ts:58`

### RV-38 Modifier master is demo values and codes that differ from the transcribed RVG table
- Action: Rework. Size M.
- Catalogue: [US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md), [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md), [US-03.3.8](../../../../requirements-board/requirements/stories/US-03.3.8.md), [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md), [OQ-95](../../../../requirements-board/requirements/questions/OQ-95.md).
- Why: the modifier master is the RVG table plus AA's own list, every value "as the RVG prints it". The prototype's table is labelled demo-plausible and now disagrees: AS3 is 3 (RVG 2), PA3 and PA4 differ, PA5 is 1 (RVG 2 max), OB2 and OB4 bands are shifted, AS2, PO1 and PO2 do not exist in the RVG, and VM1, TTE, PACU, EAA and POC are missing. Age codes A1 and A2 are ordinary chips the anaesthetist picks and removes ("very old", "very young") where [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) and [US-03.3.8](../../../../requirements-board/requirements/stories/US-03.3.8.md) pre-apply them from the date of birth. Pinned seed fees depend on AS3 = 3, so change the master with the Phase 19 and 20 work.
- Prototype evidence:
  - `aa-prototype/src/domain/billing/modifierCodes.ts:17-60` (20 invented rows)
  - `aa-prototype/src/shared/capture/ModifierChips.tsx:177` "demo-plausible" caption
  - Source: `requirements-board/requirements/artifacts/files/NZSA RVG 2021 modifiers.md`

## Decisions-log rulings checked and still consistent (no finding)

Dual-format NHI validation and NHI never in Xero ([US-11.1.2](../../../../requirements-board/requirements/stories/US-11.1.2.md), [US-09.3.1](../../../../requirements-board/requirements/stories/US-09.3.1.md)); forward-only ACTIVE to SUBMITTED to AUTHORISED with no Returned state ([EP-07](../../../../requirements-board/requirements/stories/EP-07.md)); the Draft List state and no anaesthetist on it ([FT-01.6](../../../../requirements-board/requirements/stories/FT-01.6.md)); tiered time units with round up ([US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md)); GST-exclusive lines with GST at the foot ([US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md)); AA as agent ([US-08.4.5](../../../../requirements-board/requirements/stories/US-08.4.5.md)); "-P" payable numbers ([US-08.4.3](../../../../requirements-board/requirements/stories/US-08.4.3.md)); the payable equals what was received and AA's fee is its own monthly invoice, never netted ([FT-10.3](../../../../requirements-board/requirements/stories/FT-10.3.md), [US-10.2.1](../../../../requirements-board/requirements/stories/US-10.2.1.md)); 90-day contact archive ([US-09.3.3](../../../../requirements-board/requirements/stories/US-09.3.3.md)); append-only audit ([US-13.5.2](../../../../requirements-board/requirements/stories/US-13.5.2.md)); an unpaid prepayment warns and never blocks ([US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md)); an own-List move recalculates nothing ([US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md)); no preference warning on an anaesthetist's own move ([US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md)); Draft List re-date and removal ([US-01.6.4](../../../../requirements-board/requirements/stories/US-01.6.4.md)); recurring bookings that land on a closed Slot become Draft Lists ([US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md)); statuses as a user-maintained master ([US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md)).

## Impact on the S1 to S5 run sheet

S1 (booking to theatre): RV-14, RV-13, RV-12, RV-16, RV-01 (the seeded theatre-list attachment). S2 (office day): RV-25 (sickness), RV-27, RV-26. S3 (money end to end): RV-33, RV-35, RV-31, RV-24. S4 (exceptions): RV-05 (prepayment warning), RV-23 (post-op), RV-32 (billing failure). S5 (compliance): RV-11, RV-22 (the staged ASA regrade), RV-28.
