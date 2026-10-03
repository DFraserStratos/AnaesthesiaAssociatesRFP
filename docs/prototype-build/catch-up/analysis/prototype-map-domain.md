# Prototype map: domain layer (aa-prototype/src/domain, excluding seed/)

> Reflects code at commit 3d3a18c (after catch-up Phases 15 and 15a). Phase 15 renamed Card to Booking (cardId is now bookingId, validateCardForBilling is validateBookingForBilling, buildInvoicesForCard is buildInvoicesForBooking).

Orientation. `aa-prototype/src/domain/` is the pure-TypeScript model and rules layer: entity types (`types.ts`), demo clock, seeded RNG, NHI + ethnicity helpers, the billing maths (fee calc, contract selection, booking validation, invoice building), the warning routine (Phase 15a) and the HL7/FHIR translation + canned-message libraries. No React/store/theme imports (enforced by `domainPurity.test.ts`). There are NO routes/screens here; the domain is consumed by `src/store/*` (actions, billingRun, integrationActions) and the three apps. All paths below are relative to `aa-prototype/src/domain/` unless stated. Wired-but-not-here behaviour (store actions, UI) must be checked in the store/app maps. Tests (`*.test.ts`) sit beside each module and are the best executable spec of the rules.

Contents
1. Scalars, ids, lifecycle enums
2. Entities (people, payers, contracts, canvas, procedures, billing, Xero, integrations, settings)
3. Clock, RNG, dates
4. NHI and NZHIS
5. Billing maths (fee, units, modifiers, contracts, validation, invoices, fee)
6. Integrations (HL7, FHIR, feeds, canned messages, PDFs)
6b. Warnings (warnings/, new in Phase 15a)
7. Demo/simulator affordances in this area
8. Stubs, hardcoded and assumed items
9. Gaps visible from the domain model (things the model has NO field for)

## 1. Scalars, ids, lifecycle enums (types.ts)
- IsoDate/IsoDateTime/WallTime strings (22-27). Ids are plain string aliases (29-41). AnaesthetistId IS the registration number.
- `Session` = 'AM'|'PM' only (43). No custom start/end sessions beyond optional `List.startTime/endTime`.
- `ListState` = DRAFT | SUBMITTED | AUTHORISED (46). Comment: no Returned state (convention 6). No CANCELLED/BILLED state; billed is a stamp `List.billedAtISO` (l.301+).
- `ListStatusKey` six values: private, public, preop, holiday, unavailable, free (53-61); must match theme `StatusKey` (`statusKeyParity.test.ts`).
- `ActorRole` anaesthetist|office|system (64). `AuditSource` anaesthetist|office|integration|system|demo (67).
- `CounterpartyRef {kind: hospital|insurer|surgeon|organisation|patient|billableParty, id}` (73-84).
- `CapturedUnits {units, source: 'seeded'|'overridden'}` (86-90): provenance of B/T/M.

## 2. Entities (types.ts, line = start)
People/payers
- `Patient` 103: hiddenInternalId (key; goes to Xero as ContactNumber, NHI never does), optional nhi, name, dobISO, phone, email, address, ethnicityCode (validated only), `ethnicityPending {receivedCode, reason}` quarantine. No gender/sex, no GP, no next of kin, no allergies/weight/height/BMI fields on the patient.
- `BillableParty` 127: hiddenInternalId, name, relationshipToPatient, phone/email/address. Separate from Patient (guardian payer).
- `Anaesthetist` 141: registrationNumber, name, phone, email, unitValue ($ per unit), gstPeriod (monthly|biMonthly|sixMonthly), hpiId, active. No bank account, no GST number, no employment/contract terms, no clinical preferences, no service-fee rate per anaesthetist.
- `Hospital` 155 (id, name only), `Surgeon` 160 (id, name, specialty?), `Insurer` 166 (id, name, acceptsDirectClaims), `ContractHolderOrganisation` 180 (id, name, description). No addresses, contacts, billing emails, or Xero mapping fields on any of them.
Contracts
- `Contract` 216: type 1|2|3, holderType (hospital|insurer|surgeon|organisation|billableParty), holderId, scope (organisation | individualAnaesthetist{anaesthetistId}), permitsIndividualArrangement (Method 3 gate), isDefault (protected default Type 1), effectiveFromISO / effectiveToISO?, type2Detail (agreedUnitRate{unitRate} | percentDiscount{percent}).
- `ContractPrice` 250 (Type 3 fixed price row): contractId, rvgBaseCode?, surgeonId?, procedureOrdinal?, price. RVG base code stands in for "procedure type" (labelled demo simplification).
Canvas
- `List` 301 (state lifecycle `ListState` 46): id, dateISO, anaesthetistId, session, state, statusKey, hospitalId?, surgeonId?, startTime/endTime?, conflicts[] (`ListConflict` kind availability|holiday, message; 265), coverRequest? (`CoverRequest` 277: by, kind offer|request, targetAnaesthetistId, message, atISO, status 'pending' only), phoneNotes[] (`ListPhoneNote` 295), billedAtISO?, notes?, attachments? (`Attachment[]` on the List as a whole, US-03.1.3, added Phase 15, optional/absent=empty).
- `Booking` 373 (was Card): id, listId, patientId (hidden id, never NHI), scheduledTime?, completed, completedAtISO?, copiedFromBookingId (Copy = additional procedure), bookingType 'postOpAddendum' + addendumOfBookingId, correlationRef (`IntegrationCorrelationRef {sourceFeedId, externalAppointmentId}` 340), `source?: BookingSource` 371 (hospitalDownload|surgeonPdf|admin|anaesthetistAdHoc|anaesthetistPhoto|copy; DM-39; DISPLAY-ONLY, nothing reads it, absent = not recorded), cancellation (`BookingCancellation` 350: reason, by, role, source, atISO; soft cancel, never deleted), attachments[] (`Attachment` 358: id, name, kind photo|pdf|other, dataUrl?; shared type, also used by `List.attachments`), notes?, lastModifiedBy/AtISO. REMOVED in 15a: `prepaymentOverride` / `PrepaymentOverride` (hard completion gate replaced by a non-blocking warning, see 6b). No time-of-arrival, no theatre, no anaesthetic type fields.
- `PermanentList` 575: id, hospitalId|null, anaesthetistId, dayOfWeek 0..6, session, surgeonId|null, statusKey, notes?. No effective-from/to, no frequency (every week only), no per-week-of-month pattern.
- `AnaesthetistAvailability` 593: id, anaesthetistId, dateISO, session, kind available|unavailable|holiday, note?. Per-date/session only; no date ranges/recurrence at model level.
- `HospitalHoliday` 602 (hospitalId, dateISO, name). `ListStatus` 610 (key, label, description). `DayNote` 625 (per-date office note: id, atISO, by, initials, text, flagged).
Procedures & billing capture
- `Procedure` 444: bookingId, description, billingRoute? (hospital|billableParty|insurer; `BillingRoute` 409; 'hospital' means contract-holder route), governingContractId?, insurerId?, billablePartyId? (override; default payer = patient), patientPaymentCategory? (selfFundedPostProcedure|selfFundedPrepayment|insuredReimbursement; 416), prepaymentDetail? (`PrepaymentDetail` 426: full|split + depositAmount), accRelated (informational only), billingReference?, isAdditional, asaClass? (AS1..AS4), selectedModifierCodes[], rvgBaseCode? (one), baseUnitsSelected?, base/time/modifierUnitsCaptured?, anaestheticStartISO?, handoverISO?, priceOverride? (`PriceOverride` 434: fixedFee|dollarAdjustment|percentAdjustment, each with mandatory reason), intNotes?, opNotes?. Note: no surgeon/theatre/anaesthetic-type/technique/complication fields on Procedure; no patient weight/height/BMI; no drug or clinical record fields.
- `BillingLine` 518: procedureId, chargeBasis rvg|fixed|rateTime (509), units?, rate?, hours?, amount, description, funderOverride? (CounterpartyRef; one procedure two funders).
- `RvgCode` 540 (code, description, anatomicalSite, baseUnits single{units}|range{min,max}, absorbsModifierCodes[]); `ModifierCode` 556 (code, group, units, description); `ModifierGroup` 549 = PA|A|AS|ASE|OB|P|AI|POSTOP.
Audit
- `AuditEntry` 645: id, entityType (free string), entityId, who, role, source, action, before?, after?, atISO. Append-only; convention 7. No IP/device/session field.
Billing pipeline
- `Invoice` 672: invoiceNumber, caseReference, bookingId, counterparty, layout contractHolder|patient, kind standard|prePayment, subtotal, gst, total, raisedAtISO?, emailedAtISO?. `InvoiceLine` 678 (procedureId?, description, units?, amount). No due date, no PDF/document field, no credit-note kind.
- `BillingCase` 707 (bookingId) + `BillingPipelineStatus` 697 = pending|invoiced|handedOff|partPaid|paid|disbursed|failed. Money truth = receivedAmount / authorisedAmount / disbursedAmount (status is derived label). Also accRecId, accPayId, paidInAtISO, disbursedAtISO, handoffFailure {code,message}, failure {code,message,procedureId}.
- `BillingReceipt` 742: GST report source + payment idempotency set (caseId, anaesthetistId, accRecId, grossAmount, gstAmount, atISO, idempotencyKey, source webhook|poll).
Xero simulation shapes
- `XeroContact` 758 (contactId, contactNumber=hidden id, name, type organisation|patient|billableParty, archived), `XeroAccRec` 769 (amountDue, cumulative amountReceived, status awaitingPayment|paid|voided), `XeroAccPay` 780 (accRecId, grossAmount, serviceFeeRate, serviceFeeAmount, amountPayable, amountAuthorised, amountDisbursed, status draft|authorised|paid), `PaymentIn` 799, `Disbursement` 809 (payablesRunId).
Integration shapes
- `IntegrationFeed` 822 (hospitalId, transport hl7v2|fhir|pdf, fieldMapping). `IntegrationMessageStatus` 834 = pending|processed|retrying|deadLetter|manualIntervention|duplicate. `IntegrationMessage` 842 (feedId, messageControlId MSH-10, eventType, correlationRef, status, attempts, receivedAtISO, updatedAtISO, raw, failureReason, resultBookingId, patientRef).
Settings
- `DemoSettings` 886: contactArchiveInactivityDays (seeded 90), failNextHandoff? (demo trigger), volumeStory `XeroVolumeStory` 874 (invoicesPerYear, oneTimePct, activeContacts, softLimit; narrated counters, not real records).

## 3. Clock, RNG, dates
- `clock.ts`: pure over `DemoClockState {todayISO, minutesSinceMidnight}`. `DEMO_TODAY='2026-07-21'` (l.32), label 'Tuesday 21 July 2026', `INITIAL_CLOCK` = 08:00 (40). Functions `today`, `now` (57, builds Date from parts), `advanceMinutes` (67, rolls midnight), `advanceDays` (78), `horizonFor` (100: 14 days back to 4 months forward, consts 86/88), `enumerateDatesISO` (109). Control-panel advance uses these via store.
- `rng.ts`: `mulberry32(seed)`. `dateDays.ts`: `epochDayOf`, `daysBetween`, `bucketForAgingDays` (current <=30, d31_60, d61_90, d90plus) used by receivables aging.

## 4. NHI and NZHIS
- `nhi.ts` `validateNhi` (l.~55): 7 chars, no I/O, two formats: current AAANNNC (weights 7..2, mod 11, remainder 0 = never assigned, check 11-r, 10 => 0) and new AAANNAX (mod 23, check letter). Returns {normalised, format, valid, reason} (reason text rendered verbatim). `generateNhi(format, rng)` deterministic. Alphabet A-Z minus I,O.
- `nzhis.ts`: `ETHNICITY_DEMO_SUBSET` = 12 Level-4 codes across 6 Level-1 groups (labelled demo subset, not the real code table). `validateEthnicityCode` three verdicts: valid | outsideDemoSubset (never called invalid) | malformed (not 5 digits). `lookupNhi(nhi)` = canned map of 6 fictional patients (CQY9304, WQS3635, JKL1188, MYY54SL, RUE29KR, DEM1239 scenario patient); returns {found:false} otherwise. Simulated NHI FHIR lookup, no network.

## 5. Billing maths (billing/)
- `money.ts`: `roundToCents`, `toCents`. All comparisons in cents.
- `agencyFee.ts`: `AA_SERVICE_FEE_RATE = 0.05` (illustrative; RFP silent), `aaServiceFeeFor(gross)` -> {grossAmount, serviceFeeRate, serviceFeeAmount, amountPayable}. Used for Xero ACCPAY net.
- `timeUnits.ts`: `timeUnitsFromMinutes`: <=0 => 0; <=120 min => ceil(min/15); beyond => 8 + ceil((min-120)/10). Partial intervals round UP (assumption, `PARTIAL_INTERVAL_ROUNDING`). `timeUnits(start,end)`.
- `modifierCodes.ts`: `MODIFIER_CODES` 20 rows (l.17): PA1-PA5 (1,2,3,4,1 units), A1(1) A2(2), AS1-4 (0,1,3,4), ASE(2), OB1-4 (0,1,2,3), P1(2), AI1(2), PO1(1) PO2(2). Values demo-plausible, NOT authoritative NZSA schedule. Band rule (l.74-137): exclusive groups PA, A, AS, OB (one code per group); PA5 exempt (stacks). `modifierBandOf`, `modifierBandLabel`, `toggleModifierCode` (tap swaps siblings), `ASA_SEED_UNITS`.
- `modifierUnits.ts`: `modifierUnits(codes, baseCode)` sums units; refuses unknown codes, same-band collisions (first wins), and codes absorbed by the base code (`absorbsModifierCodes`); returns {units, refused[{code,reason}]}.
- `contracts.ts`: `isEffectiveOn` (from/to inclusive); `selectContract(candidates, {holder, anaesthetistId, dateISO})` rank: individualAnaesthetist scope (2) > specific org contract (1) > protected default (0); `matchContractPrice` most-specific-match (rvgBaseCode, surgeonId, procedureOrdinal keys count as specificity).
- `fee.ts` (`feeFor`, l.180): `resolveBtm` (58) B from range/single or overridden capture; T from captured start/handover minutes unless overridden; M via `modifierUnits` plus the ASA class code auto-added; `splitBillingUnits` (107): isAdditional => time units only. Pricing: Type 1 units x anaesthetist.unitValue; Type 2 agreedUnitRate or unitValue*(1-percent/100) rounded to cents; Type 3 fixed price via `matchContractPrice` (additional procedure only takes a fixed price if the row has a procedureOrdinal; no match falls back to BTM); non-RVG lines (fixed, rateTime hours*rate); typed price override (fixedFee replaces / dollarAdjustment / percentAdjustment) applied to subtotal. Returns FeeResult {btm, billableUnits, chargeBasis, unitRate, lines, subtotal, override, total}. No contract => Type 1.
- `validateBookingForBilling.ts` (`validateBookingForBilling`, l.104): skips cancelled Bookings. Field failures: billingRoute unset; no RVG code and no non-RVG line; RVG code not in master; start/handover missing; handover <= start; range base needs in-range `baseUnitsSelected`; insurer route: insurer required and must `acceptsDirectClaims`; billableParty route: `patientPaymentCategory` required, billablePartyId must resolve; selfFundedPrepayment needs `prepaymentDetail`, split needs deposit > 0; rateTime line needs contract with `permitsIndividualArrangement` (`INDIVIDUAL_ARRANGEMENT_MESSAGE`, l.39); price override needs reason and must not make fee negative; funder-override conservation (lines must sum to fee to the cent). Also `billingReferenceMissing` (49; hospital route with blank reference), `feeContextFor` (77), `BookingBillingContext` (56). Messages are user-facing copy.
- `invoiceBuild.ts`: `GST_RATE = 0.15` (39, assumption GST-exclusive lines + 15%). `resolveContractForProcedure` (114): stored contract if effective on List date; expired hospital/insurer-held contract falls back to that holder's protected default Type 1; surgeon/org-held expired => exception `contractIneffective`; missing => `contractMissing`; nothing stored resolves by route (hospital from List hospital, insurer from procedure, billableParty needs none, none => `noBillingRoute`, `noContract`). `counterpartyForProcedure` (192), `layoutFor` (216: patient/billableParty => 'patient' layout). `buildInvoicesForBooking` (264): rates each procedure with resolved contract, funder-override lines allocation (re-checks conservation => `allocationStale`), price override as separate line, deducts prepaid deposit as negative line ("Less pre-payment deposit already invoiced", errors `prepaidFunderOverride`, `prepaidCounterpartyChanged`), groups by counterparty (one invoice per Booking per counterparty), negative subtotal => `negativeTotal` exception, $0 group raises no invoice. Rate detail snapshotted into line description text ("N units at $x per unit"). `buildPrePaymentInvoiceForBooking` (456): only billableParty + selfFundedPrepayment procedures; split = flat deposit line (ex-GST), full = estimated full fee via `feeFor`; always patient layout.
- `fixtures.ts`: test-only. `index.ts` re-exports all billing modules.

## 6. Integrations (integrations/)
- `hl7.ts`: `parseHl7` (split segments/fields), `readField` (MSH offset), `resolvePath` (e.g. PID-2, PID-5.2), `extractViaMapping(raw, mapping)` -> neutral `ParsedMessage` {eventType, messageControlId, appointmentId, operation, scheduledDateISO, scheduledTime, cancelReason, note, patient{nhi,name,dobISO,ethnicityCode}}. Mapping-driven (`HL7_MAPPING_KEYS`: nhi, patientName, dob, ethnicity, appointmentId, scheduledDateTime, operation). Fixed positions: MSH-9.2 event, MSH-10 control id, SCH-6 cancel reason, NTE-3 note. Only SIU S12/S13/S14/S15 segments MSH/SCH/AIS/PID/NTE; not a general parser.
- `fhir.ts`: `toFhirBundle(parsed, practitioner)` builds MessageHeader + Patient (NHI identifier, NZ ethnicity extension; invalid code => `valueString:'pending correction'`) + Practitioner (HPI) + Appointment (status booked|cancelled); `extractFromFhir(bundle, mapping)`; `practitionerHpiOf`. Constants NHI_SYSTEM, HPI_SYSTEM, ETHNICITY_EXT_URL, ETHNICITY_CODE_SYSTEM. Practitioner HPI extracted but display-only (not applied).
- `feeds.ts`: `FEED` ids FEED-STG, FEED-CPH, FEED-SX; `FEED_META`; `INTEGRATION_FEEDS`: A St George's (HL7, mapping correct, NHI=PID-2), B Christchurch Public (HL7, mapping misconfigured NHI=PID-2 but sender uses PID-3; fix constant `CPH_NHI_FIX='PID-3'`), C Southern Cross (FHIR-native, FHIR-path mapping). Imports HOSP from `../seed/cast` (domain depends on seed here).
- `messages.ts`: `CANNED_MESSAGES` (12): S12 x6 (MSG-STG-1001 repeat patient reuse; -1002 new-format NHI; -1003 out-of-range ethnicity 77777 quarantined; -1004 transient fault `simulatedFault:'transient'` auto-retry; MSG-CPH-2001 dead-letter under bad mapping; FHIR-SX-2001 FHIR-native create), S13 x2 (-1010 same-list time change, -1011 move to other day), S14 x2 (-1012 modify + note; -1014 targets a SUBMITTED list => manualIntervention), S15 (-1013 soft-cancel). `APPT` correlation ids (SCH-2, e.g. 1661243 from RFP sample). Each has `routing` (which Souter List a create lands on: hard-coded 2026-07-28 AM/PM, 2026-07-30 AM) - demo binding, not extracted from wire. `cannedMessage(id)`, `CANNED_BY_ID`.
- `pdfSamples.ts`: `SURGEON_PDFS` (2): PDF-OKAFOR-0729 (Forte Health, 3 rows; row R3 deliberately mistyped NHI ZAA0068 => corrected ZAA0067; R1 matches existing patient), PDF-WHITFORD-0729 (Christchurch Eye Surgery, 2 rows). Facsimile is a generated SVG data URL; "parsing" = pre-baked rows (no OCR). `PDF_BY_ID`.
- Apply-effects (create/update/cancel Booking, dedupe by MSH-10, retry, dead-letter) live in `src/store/integrationActions.ts`, NOT here.

## 6b. Warnings (warnings/, Phase 15a; FT-13.7, US-13.7.1, US-06.3.2, DM-31). Pure, never blocks.
- `warnings/types.ts`: `WarningKind` beforeProcedure|afterProcedure; `WarningStrength` mild|strong; `WarningRuleId` currently only 'prepaymentUnpaid' (comment: Phases 19/21/27/40 widen); `WarningPrepaymentStatus` none|required|outstanding|paid (derived by store `prepaymentStatusFor`); `WarningFacts` {booking, list, procedures, prepaymentStatus, todayISO} (store builds via `warningFactsFor`); `WarningRule` {id, label, defaultParams, evaluate(facts, params)}; `WarningFinding`; `Warning` (key `${bookingId}:${ruleId}[:${procedureId}]`, optional clearance); `WarningClearance` {key, bookingId, ruleId, strength, by, role, atISO} (stored by store in `schedule.warningClearances`, outside the Booking); `AppSettings {warningRules: {[ruleId]: {active, params}}}` (DM-31; no UI, US-13.7.4 Future); `warningKey()`.
- `warnings/routine.ts` `evaluateWarnings(facts, rules, settings, clearances)` (l.~37): cancelled Booking => []; skips inactive rules; params = defaults + settings; clearance hides a warning only if stored strength >= current strength (a strengthened warning re-opens); sorted strong first, then rule order, then key. `strongerOf`, `strengthRank`, `isOpen`.
- `warnings/rules/index.ts`: `WARNING_RULES` registry (one rule). `rules/prepaymentUnpaid.ts`: status 'required' => strong beforeProcedure "Prepayment required. No prepayment invoice has been raised yet."; 'outstanding' => strong "Prepayment invoice unpaid. Check with the patient before surgery starts." Strength is a provisional reading (no date escalation yet; Phase 27).
- `warnings/settings.ts` `defaultAppSettings()` seeds every rule active with defaults.
- Tests: `routine.test.ts`, `rules/prepaymentUnpaid.test.ts`. Warnings are the only mechanism in domain replacing the old July prepayment completion gate. No other warning rules exist (no cover/availability/clash warnings in domain).

## 7. Demo / simulator affordances in this area
- Demo clock advance (clock.ts) and `DemoSettings.failNextHandoff` / `contactArchiveInactivityDays` / `volumeStory` (types.ts 884-905).
- Canned HL7/FHIR messages and PDFs (section 6) drive the integration simulator (UI in `src/apps/demo`, not mapped here).
- `lookupNhi` canned patients incl. DEM1239 scenario patient (S2 phone-advice).
- Partial-interval rounding, modifier unit values, service fee rate, GST rate, ethnicity subset: all labelled demo assumptions.

## 8. Stubs, hardcoded, assumed
- Modifier unit values, RVG behaviours, ethnicity subset, service fee 5%, GST 15% on invoices, T-unit round-up: all assumptions flagged in comments as pending AA confirmation.
- Type 3 "procedure type" = RVG base code (demo simplification).
- Canned messages route to hard-coded Souter lists/dates; PDF parse is pre-baked; NHI lookup is a 6-entry map.
- Practitioner HPI on FHIR is not used in store effect.
- `Invoice.emailedAtISO`, `raisedAtISO` are optional stamps; no document/PDF generation in domain (invoice document rendering is UI/other layer).
- Monetary types are JS numbers rounded to cents (no decimal type).

## 8b. Notes
- Lifecycle definitions in domain are types only: `ListState` DRAFT>SUBMITTED>AUTHORISED (types.ts 46; guards and transitions live in `src/store/`, not here); Booking has `completed` boolean, soft `cancellation`; billing pipeline `BillingPipelineStatus` (types.ts 697); integration message status (844). Pure test files beside modules are the executable spec. `statusKeyParity.test.ts` and `domainPurity.test.ts` are guards.
- `domain/index.ts` re-exports types, clock, rng, nhi, nzhis, billing, seed, warnings (NOT integrations; import from `integrations/index.ts`).
- Canned HL7 messages create on hard-coded Souter lists 2026-07-28 AM/PM, 2026-07-30 AM, modify list 2026-08-04 AM (`messages.ts` 125-128).

## 9. Gaps visible from the domain model (no field/rule exists)
- No user/role/permission entity in domain (roles only as `ActorRole` on audit). No notification, message, task, reminder, or document/file entity (only Booking/List attachments as data URLs). No credit note, refund, write-off, or dispute entity; negative invoices are refused. No statement, reconciliation, or remittance entity. No patient clinical record beyond intNotes/opNotes. No recurring availability rule; no leave/roster entity beyond per-session availability. No hospital/surgeon contact or address data. No multi-currency or multi-tenant concepts. No report/dashboard entity (dashboards are computed in seed/store selectors: `seed/anaesthetistDashboard.ts` not mapped here).
