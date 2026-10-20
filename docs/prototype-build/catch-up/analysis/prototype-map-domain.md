# Prototype map: aa-prototype/src/domain (excluding seed/)

Orientation. `aa-prototype/src/domain/` is the pure-TypeScript domain layer: one big types file (`types.ts`, 1448 lines, the whole entity model), the demo clock and seeded RNG, scheduling rules (Slots, availability statuses, series, conflicts, Draft Lists, recurring-booking projection, list moves, pairing preferences), billing maths (`billing/`), integration translation (`integrations/`: HL7 v2, FHIR R4, canned messages, PDFs), NHI/NZHIS helpers and a tiny warning framework. It has NO routes/screens, no store, no React (enforced by `domainPurity.test.ts`). Lifecycle TRANSITIONS (ACTIVE to SUBMITTED to AUTHORISED, assign, detach) are in `src/store/` (`lifecycle.ts:257-300`, `slotActions.ts`, `draftListActions.ts`, `listMoveActions.ts`); the domain holds only the state enum, guards and pure rules. Domain functions return plain data/refusals; the store applies them through `mutate()`. Many modules are consumed by name from the apps (consumer pointers per section). Barrel `domain/index.ts` re-exports only types, clock, slots, listPairing, draftLists, rng, nhi, nzhis, billing, seed, warnings; every other module (conflicts, slotStatus, availabilitySeries, listMoves, notifications, pairingPreferences, recurringBookingProjection, surgeons, integrations, xeroContact, dateDays, names) is imported by direct path.

## Contents
1. File index
2. Entity model (types.ts) and enums
3. Lifecycles and statuses
4. Scheduling rules (slots, statuses, series, conflicts, drafts, recurring, moves, notifications)
5. Pairing preferences and priority tiers (office-private)
6. Billing maths
7. Integrations (HL7, FHIR, feeds, canned messages, PDFs)
8. NHI, NZHIS, ethnicity, Xero contact, HPI, clock, RNG
9. Warnings framework
10. Demo/simulator affordances in this area
11. Stubbed, hardcoded, visual-only, assumptions
12. Gotchas for reviewers

## 1. File index (all under aa-prototype/src/domain/)
| File | What |
|---|---|
| types.ts | All entity types, enums, label maps (see s2) |
| clock.ts | Demo clock, horizon helpers |
| dateDays.ts | `daysBetween`, aging buckets |
| rng.ts | `mulberry32` seeded RNG |
| names.ts | `titledSurname` ("Ms A. Reid" to "Ms Reid") |
| slots.ts | Slot ids, default schedule settings, effective times, `displayStatusKey` |
| slotStatus.ts | Availability-status master helpers + validators, range validation |
| availabilitySeries.ts | Repeating days-off (series) maths |
| conflicts.ts | Derived List conflicts (holiday/availability) |
| draftLists.ts | Draft List guards, ordering, waiting time, availability, recurring clash |
| listPairing.ts | Hospital+surgeon pairing rule, AA-rooms billing exception |
| recurringBookingProjection.ts | Plan of Lists a recurring booking creates/updates/removes |
| listMoves.ts | Anaesthetist own-move rules, colleague targets |
| notifications.ts | "List moved" pool text, paging |
| pairingPreferences.ts | Not-preferred/preferred pairings, tiers, ranking (office private) |
| surgeons.ts | Surname sort, rooms/groups, email + HPI CPN checks |
| nhi.ts / nzhis.ts | NHI validate/generate; ethnicity codes; canned NHI lookup |
| xeroContact.ts | Neutral Xero names for individuals |
| billing/* | fee, contracts, timeUnits, modifierCodes/Units, validate, invoiceBuild, bcti, aaFee, payableRelease, money (fixtures.ts is test-only) |
| integrations/* | hl7, fhir, feeds, messages, pdfSamples |
| warnings/* | types, routine, settings, rules/prepaymentUnpaid |
| *.test.ts | Vitest per module; `domainPurity.test.ts`, `statusTokenParity.test.ts` (domain tokens vs `theme/statusColours`) |

## 2. Entity model (types.ts; line numbers are the declaration)
IDs are plain string aliases (types.ts:29-45). Dates `IsoDate` YYYY-MM-DD, `IsoDateTime`, `WallTime` HH:mm. `Session` = 'AM'|'PM' (:47).

People/payers/masters
- Patient :171: hiddenInternalId (the key; goes to Xero as ContactNumber), nhi? (optional, "where available"), name, dobISO, phone/email/address?, ethnicityCode? (validated only), ethnicityPending? {receivedCode, reason} (quarantine of an invalid inbound code).
- BillableParty :195: hiddenInternalId, name, relationshipToPatient, contact fields. Payer OVERRIDE only; default payer on that route is the patient.
- Anaesthetist :209: registrationNumber (= id), name, phone, email, unitValue ($/unit), gstPeriod (:237 'monthly'|'biMonthly'|'sixMonthly'), hpiId (CPN, may be blank), startDateISO (no Slots before), active (inactive = no Slots).
- Hospital :246: id, name, locationType ('hospital'|'aaRooms', :244), contactEmail?. AA rooms = pre-op clinic location; never a contract holder/feed.
- Surgeon :260: id, name, specialty?, roomId, hpiId, medicalRegistrationNumber?. SurgeonRoom :278 {name, contactEmail, phone}. SurgeonGroup :286 {name, description?, memberSurgeonIds}.
- Insurer :338: id, name, acceptsDirectClaims. ContractHolderOrganisation :352.
- PairingPreference :307 and OfficePrivateSlice :332 (pairingPreferences + priorityTiers record, kept OUT of `masters`; PriorityTier 1-4 :322).
- RvgCode :919 {code, description, anatomicalSite, baseUnits: single{units}|range{min,max}, absorbsModifierCodes}; ModifierCode :935 {code, group, units, description}; ModifierGroup :928 'PA'|'A'|'AS'|'ASE'|'OB'|'P'|'AI'|'POSTOP'.
- HospitalHoliday :1000 {id, hospitalId, dateISO, name}. ScheduleSettings :995 {horizonMonths, defaultTimes AM/PM}. SeedLeaveWindow :982 (seed-only).

Contracts
- Contract :388: type 1|2|3 (1 standard units x anaesthetist unitValue; 2 agreed unit rate or % discount, `type2Detail` :384; 3 fixed price list), holderType :367 ('hospital'|'insurer'|'surgeon'|'organisation'|'billableParty'), holderId, scope :379 (organisation | individualAnaesthetist), permitsIndividualArrangement (gate for rate x time lines), isDefault (protected default Type 1, hospitals + direct-claim insurers only), effectiveFromISO/ToISO.
- ContractPrice :422: contractId, rvgBaseCode?, surgeonId?, procedureOrdinal?, price. RVG base code stands in for "procedure type" (labelled demo simplification).
- No Contract-level split/extra-invoice config exists in types.

Scheduling
- Slot :530: id (`S-<reg>-<date>-<AM|PM>`), anaesthetistId, dateISO, session, status (SlotStatusKey string), note?, startTime?/endTime? (override), seriesId?. Every Slot stored; UI says "session", never "slot".
- SlotStatus :1012 (master record): key, label, longLabel, description, colour (StatusColourToken: private, public, preop, holiday, unavailable, free :90), treatment (solid|hatched|dashed :94), bookable, anaesthetistCanSet, isDefault?, order, retiredAtISO?. Seeded keys 'free'|'holiday'|'unavailable' (`slotStatus.ts:37`).
- ListKind :113 'private'|'public'|'preop' (labels :117; "Pre-op Assessment" long label). DisplayKey = ListKind | SlotStatusKey.
- ListBase :610: id, dateISO, session, kind, hospitalId, surgeonId, conflicts: ListConflict[] :446 {kind 'availability'|'holiday', cause, raisedAtISO, holidayId?, slotId?, statusKey?}, conflictClears? :461, recurringBookingId?, recurringOrigin?, phoneNotes? :516, billedAtISO?, notes?, attachments? :724 {id,name,kind photo|pdf|other,dataUrl?}, draft? DraftTrail :578, removedAtISO/removedBy/removeReason/removeCause? (soft removal of Draft Lists).
- AssignedList :673 (state ACTIVE|SUBMITTED|AUTHORISED, anaesthetistId, slotId required) | DraftList :691 (state DRAFT, no anaesthetist/slot, `draft` required) = List :698.
- DraftTrail :578: origin (:558 'request'|'recurringClash'|'movedToOffice'|'unavailableReturn'|'hospitalRow'), source? (:571 phone|email|pdf|other), sinceISO, by, fromAnaesthetistId?, projectedFor? {recurringBookingId,dateISO,session,anaesthetistId?}, assignedAtISO?/assignedBy?.
- RecurringBooking :953 (renamed from Permanent List): id, hospitalId, anaesthetistId, dayOfWeek 0-6, session, surgeonId, kind, startTime?/endTime?, notes?, effectiveFromISO?/ToISO?, retiredAtISO?.
- AvailabilitySeries :1048: anaesthetistId, statusKey, sessions 'AM'|'PM'|'both', note?, weekdays 1-7[], everyWeeks 1-4, startISO, untilISO?, exceptions Record<`date-session`, {deleted}|{edited,statusKey,note?}>, createdAtISO, endedAtISO?.
- DayNote :1075 {by, initials, text, flagged}. Notification :487 (kind only 'listMoved'; route 'office'|'colleague'; cause 'move'|'unavailable'; snapshot of date/session/hospital/surgeon; from/toAnaesthetistId).

Bookings/procedures/billing capture
- Booking :744: id, listId, patientId (hidden id, never NHI), scheduledTime?, completed, completedAtISO?, bookingType?/addendumOfBookingId? (post-op addendum = new Booking), correlationRef? {sourceFeedId, externalAppointmentId}, source? ('hospitalDownload'|'surgeonPdf'|'admin'|'anaesthetistAdHoc'; DISPLAY-ONLY), cancellation? {reason,by,role,source,atISO}, attachments, notes?, lastModifiedBy/At.
- Procedure :822: description, billingRoute? ('hospital' = contract-holder route | 'billableParty' | 'insurer'), governingContractId?, insurerId?, billablePartyId?, patientPaymentCategory? ('selfFundedPostProcedure'|'selfFundedPrepayment'|'insuredReimbursement'), prepaymentDetail? {type full|split, depositAmount?}, accRelated (informational), billingReference?, isAdditional (time units only), asaClass? AS1-AS4, selectedModifierCodes[], rvgBaseCode?, baseUnitsSelected?, baseUnitsCaptured/timeUnitsCaptured/modifierUnitsCaptured? {units, source 'seeded'|'overridden'}, anaestheticStartISO?/handoverISO?, priceOverride? (:812 fixedFee|dollarAdjustment|percentAdjustment, each with reason), intNotes?/opNotes?.
- BillingLine :897: chargeBasis 'rvg'|'fixed'|'rateTime', units?, rate?, hours?, amount, description, funderOverride? CounterpartyRef (:141 hospital|insurer|surgeon|organisation|patient|billableParty).

Billing pipeline / Xero sim
- Invoice :1112 (invoiceNumber, caseReference, counterparty, layout 'contractHolder'|'patient', kind 'standard'|'prePayment', subtotal/gst/total, raised/emailedAtISO) + InvoiceLine :1128.
- BillingCase :1147: status BillingPipelineStatus :1137 ('pending'|'invoiced'|'handedOff'|'partPaid'|'paid'|'disbursed'|'failed'), receivedAmount/authorisedAmount/disbursedAmount (authoritative money; status is a derived label), paidInAtISO, disbursedAtISO, handoffFailure?, failure?, invoiceId/accRecId/accPayId.
- BillingReceipt :1192 (GST-report source + idempotency keys; source webhook|poll). XeroContact :1208 (type organisation|patient|billableParty, archived). XeroAccRec :1219 (kind 'procedure'|'aaFee', amountDue, cumulative amountReceived, paidAtISO, status awaitingPayment|paid|voided). XeroAccPay :1244 (invoiceNumber = ACCREC number + "-P", anaesthetistId payee, amountPayable = ACCREC amountDue, amountAuthorised, amountDisbursed, status draft|authorised|paid). PaymentIn :1271 (source webhook|poll|aaFee). Disbursement :1361 (payablesRunId).
- AaFeeSettings :1305 {fixedItems[], perBctiCharge} ex GST; AaFeeInvoice :1335 (monthISO, settings snapshot, lines, bctis[], bctiCount, subtotal/gst/total, raisedBy 'office'|'scheduled', accRecId, amountReceived, paidAtISO).
- IntegrationFeed :1374 (transport 'hl7v2'|'fhir'|'pdf', fieldMapping); IntegrationMessage :1394 (status :1386 'pending'|'processed'|'retrying'|'deadLetter'|'manualIntervention'|'duplicate'; attempts, raw, failureReason, resultBookingId, patientRef).
- DemoSettings :1438 (contactArchiveInactivityDays, failNextHandoff?, volumeStory {invoicesPerYear, oneTimePct, activeContacts, softLimit}).
- AuditEntry :1095 (entityType string, who, role ActorRole 'anaesthetist'|'office'|'system', source AuditSource 'anaesthetist'|'office'|'integration'|'system'|'demo', action, before?/after?, atISO).
- NOT in types (absent here): no credit note, no Contract-level split config, no ledger, no event invoices, no "Returned" list state.

## 3. Lifecycles and statuses
- ListState :59 = DRAFT | ACTIVE | SUBMITTED | AUTHORISED (labels uppercase, `LIST_STATE_LABELS` :72). No Returned state. DRAFT = no anaesthetist, no Slot. ACTIVE = all five of anaesthetist, surgeon, hospital, day, session. An ACTIVE List returned to the office goes back to DRAFT (store `detachListToDraft`, `slotActions.ts:333-359`). Forward-only SUBMITTED then AUTHORISED (`lifecycle.ts:257`, `:294`). Empty session = Slot with no List, no state.
- `listPairing.isActivePairing(list)` (:58) = the ACTIVE invariant test. NB `pairingPreferences.isActivePairing(entry)` is a different function (entry not ended).
- Availability statuses are master data (`masters.slotStatuses`), by fixed id, never label. Exactly one default; default must be bookable; retire blocked for default or when an active series uses it (`validateRetireSlotStatus` slotStatus.ts:234). A status may not be named a List state or List kind (`validateSlotStatusDraft` :199; "slot" word and long dashes refused; limits 16/32/160 chars :173).
- Displayed session status: List kind if a List is in the Slot, else the Slot status (`slots.ts:55 displayStatusKey`). "Open slot" = no List AND status bookable (`slotStatus.ts:131 isOpenSlot`); unknown status counts as closed.
- BillingPipelineStatus, XeroAccRec/AccPay statuses, IntegrationMessageStatus: enums above; transitions in `src/store/` (billingRun.ts, paymentActions.ts, payablesActions.ts, integrationActions.ts).
- Contract lifecycle: effective-dated (`contracts.ts:22 isEffectiveOn`); default Type 1 protected (store invariant).
- Booking: completed flag then submission gated by completion (validation gate = `validateBookingForBilling`); cancellation retains Booking, excluded from validation/billing.

## 4. Scheduling rules
**slots.ts**: `defaultScheduleSettings` (:21: 4 months; AM 07:30-12:30, PM 13:00-17:30); `slotIdFor` (:32); `projectedListId` (:43 `L-<reg>-<date>-<AM|PM>`, birth id only, never parsed); `effectiveSlotTimes` (:71 slot override else default); `slotDatesFor` (:85, no Slots before start date); `isWallTime` (:90).
**clock.ts**: see s8.
**slotStatus.ts**: lookups (`statusFor`, `activeStatuses`, `anaesthetistChoices` = active AND anaesthetistCanSet :71, `defaultSlotStatus` :81), behaviour by id (`isOpenForBooking`, `isClosed`, `displayStatusLabel` :150), `validateAvailabilityRange` (:272: to>=from, not before today, within horizon end; copy "Past sessions cannot be changed"), `slotsInRange`, `sessionsOf`.
**availabilitySeries.ts** (repeating days off, US-01.5.3): `validateSeriesDraft` :59 (>=1 weekday; every 1-4 weeks; AM/PM/both; start today..horizon end; status must be active, anaesthetist-settable by default, and NOT bookable: series are for closed statuses only), `seriesOccurrences` :107 (weeks counted from Monday of start week, modulo everyWeeks), `seriesInstances` :129 (exceptions: deleted dropped, edited carries own status/note), `planSeriesWrite` :157 (a series fills only Slots still at default status and not owned by another series; others returned as `leftAsIs`; `skipped` = no Slot), `describeSeries`/`seriesLine` :191/:205, `isSeriesActive`, `activeSeriesUsing` (retire guard). Series WRITES status onto Slots; nothing reads availability from a series. Consumers: store `slotActions.ts`, `availabilityActions.ts`, `slotStatusActions.ts`; `shared/availability/*`.
**conflicts.ts** (soft warning, never blocks): conflict derived from facts, not stamped. `expectedConflicts` :114: holiday (hospital closed that date) and availability (List's Slot has a closed status). AUTHORISED Lists, removed Lists, and backdrop Lists (ids starting `L-HIST` or `L-RB-`, `isBackdropList` :40) never conflict. `reconcileListConflicts` :153 diffs stored vs expected, honours `conflictClears` (a clear is keyed by cause `holiday:<id>` / `availability:<slotId>:<statusKey>` and survives only while the cause still holds). `describeConflict` :243 builds wording ("Hospital closed" / "Anaesthetist unavailable", with slot note). `conflictPreview` :272 (pre-save preview). Store runs reconcile in `mutate()` (`store/conflictReconcile.ts`). UI: `apps/admin/screens/ConflictsScreen.tsx`, `components/conflicts/*`.
**draftLists.ts** (FT-01.6): guards `isDraftList` (DRAFT and not removed), `isAssignedList`, `isRemoved`; order `compareDraftLists` :48 (date, AM before PM, longer wait first, id); `waitingMinutes` :62 (stops growing at assignment/removal); `draftListAvailability` :99 (active anaesthetists with a Slot that day: `free` open, `notAvailable` closed (selectable with warning), `occupied` never selectable; no preference/tier knowledge); `recurringClashDraft` :158 (OQ-81 part 2: recurring booking landing on a closed session becomes a Draft List, null for past days or inactive arrangement); `recurringClashListId` `LD-<rbId>-<date>-<AM|PM>`; `answeringLists` :200 (days a Draft/assigned-from-draft List answers for, so projection never makes a second List); `DRAFT_ASSIGN_WARNINGS` (closed session; hospital holiday: warn, never refuse); `removeBlockedReason` (Draft with active Bookings cannot be removed); `nextWeekday`. UI: `apps/admin/screens/DraftListsScreen.tsx`, `components/DraftListDrawer.tsx`, `flows/AssignDraftListSheet.tsx`; actions `store/draftListActions.ts`.
**listPairing.ts**: `pairingIssues` (:40; hospital required then surgeon required, plus unknown checks; the ONE implementation of US-01.3.1), `isAaRooms`, `billingHospitalId`/`listHospitalFor` (AA rooms resolves as "no hospital" for billing/contract).
**recurringBookingProjection.ts** (US-01.3.2): `activeOn`/`coversDate` (weekday via `getDay`, weekends included), `projectRecurringBookingChange` :209 and `projectAllRecurringBookings` :315 return a plan {create, update, remove, kept, skipped, draftUpdate, draftRemove}. Rules: only touches own empty ACTIVE Lists; keeps (with `KeptReason` labels :97-108) Lists with Bookings (cancelled count), notes/attachments/clears, SUBMITTED/AUTHORISED, office-edited (no recurringBookingId), another RB's, moved by office, Drafts; closed-status session becomes `skipped` (store then makes a Draft List); created Lists ACTIVE; time overrides reset when RB no longer sets them. Fields projected: kind, hospital, surgeon, notes, times. `firstAffectedDate` for "show on day grid". Consumers: store `mastersActions.ts`, `slotActions.ts`, `draftListDemo.ts`; `apps/admin/flows/RecurringBookingSheet.tsx`.
**listMoves.ts** (anaesthetist moves own List, US-01.4.3/4.5/1.5.5): `receiveRefusal` :68 (single receive rule: exists, not same slot, same day+session, target slot empty, and for own moves `requireOpen`: colleague active and session open); `ownMoveRefusal` :102 (refuses Draft, not own, SUBMITTED, AUTHORISED, past date); `pushTargets` :139 (colleagues passing the rule, surname order, availability only, no preferences/tiers); `movableListsFor` :156; `VACATED_SESSION_DEFAULT`='free' and `VACATED_SESSION_CHOICES` free/unavailable (OQ-84 open: provisional). Consumers: `shared/flows/MoveListSheet.tsx`, `useListMoves.ts`, store `listMoveActions.ts`.
**notifications.ts**: `NOTIFICATION_POOL_RULE` {sources ['listMoved'], never expires, not actionable, pageSize 6}; `MOVED_TO_ME_DAYS`=7; `notificationText` ("<X> returned/moved <date session (hospital, surgeon)> to <Y>" + " when marking the session not available"); `pageOf` newest-first paging. Store: `store/notifications.ts`.
**surgeons.ts**: `compareBySurname`, `surgeonsInRoom`, `groupsForSurgeon`, `isPlausibleEmail`, `normaliseHpiCpn` (trim+upper), `isPlausibleHpiCpn` (`^\d{2}[A-Z]{4}$`), `hpiCpnHolder` (one CPN unique across surgeons AND anaesthetists).

## 5. Pairing preferences and priority tiers (pairingPreferences.ts; office private)
- Private by design: only Admin app and store office paths import it; `apps/officePrivacy.test.ts` enforces. `OFFICE_PRIVATE_AUDIT_ACTIONS` (:107: pairing.add, pairing.end, anaesthetist.tierSet, list.pairingAcknowledged, recurringBooking.pairingAcknowledged).
- Labels single-sourced (`PAIRING_LABELS` :40, `TIER_LABELS` Tier 1-4, `TIER_NAMES_PROVISIONAL = true` since OQ-102 open). `DEFAULT_PRIORITY_TIER` 4.
- Kinds NOT_PREFERRED/PREFERRED, raised by SURGEON or ANAESTHETIST; entries are ended not deleted (endedAtISO, endReason).
- `pairingStatus` (:156: not preferred on either side beats preferred); `pairingAcknowledgement` :183 (what a write path records when it proceeds anyway); `groupSurgeonsForAnaesthetist` :260 (clear vs not-preferred groups, surname order); `rankAnaesthetistCandidates` :293 (tier ascending; within-tier deterministic shuffle seeded by `requestKey` via mulberry32+hashStringToSeed; optional tier filter; splits clear vs notPreferred); `notPreferredWarning` :353 (message names both people and side; "have each asked not to be paired" when both sides). Warning only, never blocks.

## 6. Billing maths (domain/billing/)
- money.ts: `roundToCents`, `toCents`.
- timeUnits.ts: `timeUnitsFromMinutes` :26 tiered: 1 unit per 15 min for first 120 min (8 units), then 1 per 10 min; partial interval rounds UP (`PARTIAL_INTERVAL_ROUNDING='up'`, ASSUMPTION flagged). 120 min=8, 121=9.
- modifierCodes.ts: master table (19 codes: PA1-5, A1-2, AS1-4, ASE, OB1-4, P1, AI1, PO1-2; units are DEMO-PLAUSIBLE, not an NZSA schedule; AS1/2/3/4 = 0/1/3/4, `ASA_SEED_UNITS`). One-code-per-band: exclusive groups PA, A, AS, OB (`EXCLUSIVE_MODIFIER_GROUPS` :74); PA5 stacks (deviation, PA can reach 5); ASE, P, AI, POSTOP stack freely. `toggleModifierCode` :124 swaps within band (picker rule).
- modifierUnits.ts: sums codes; refuses unknown, same-band second code, and codes absorbed by the base (`absorbsModifierCodes`); returns refusal reasons verbatim for UI. First code wins a band even if absorbed.
- contracts.ts: `selectContract` :34 (holder match + effective on List date; rank individual-anaesthetist 2 > specific org 1 > default 0); `matchContractPrice` :77 (most-specific-wins over rvgBaseCode/surgeonId/procedureOrdinal; none = undefined).
- fee.ts: `resolveBtm` :58 (B/T/M with `overridden` captured units winning; ASA class seeds its AS modifier; range base uses baseUnitsSelected), `splitBillingUnits` :107 (additional procedure = time units only), `feeFor` :180: Type 1 units x anaesthetist unitValue; Type 2 agreed unit rate or `unitValue x (1 - pct/100)` rounded to cents; Type 3 fixed price via match, FALLS BACK to BTM when no row (and an additional procedure takes a fixed price only if the row has an explicit ordinal); no contract = Type 1; adds non-RVG lines (fixed; rateTime = hours x rate); then typed override (fixedFee replaces, dollar adds, percent scales). Returns structured `FeeResult` {btm, billableUnits, chargeBasis, unitRate, lines, subtotal, override, total}.
- validateBookingForBilling.ts: `validateBookingForBilling` :~110 returns field-level failures (copy rendered verbatim): route set; something to charge; RVG code exists; start/handover recorded and handover after start; range base needs in-range selection; insurer route needs insurer that `acceptsDirectClaims` (else directed to Billable Party + insuredReimbursement); billableParty route needs a category (payer defaults to patient); selfFundedPrepayment needs full/split and positive deposit when split; rateTime line needs governing contract with `permitsIndividualArrangement` (`INDIVIDUAL_ARRANGEMENT_MESSAGE`); price override needs reason and may not make fee negative; if any line has `funderOverride`, line amounts must sum (to the cent) to the fee. Cancelled bookings skipped. `billingReferenceMissing` (hospital route with blank reference; shared with authorisation-review flags). `feeContextFor`.
- invoiceBuild.ts: `GST_RATE` 0.15 (GST-exclusive lines plus GST; ASSUMPTION). `resolveContractForProcedure` :114 (stored governing contract authoritative while effective on List date; expired hospital/insurer-held falls back to that counterparty's protected default Type 1; expired surgeon/org/billableParty-held = exception 'contractIneffective'; missing = 'contractMissing'; no stored contract: hospital route to hospital default, insurer to insurer default, billableParty needs none, no route = 'noBillingRoute'). `counterpartyForProcedure` :192 (insurer; billableParty override else patient; else contract HOLDER, so surgeon/group/org holders bill themselves). `layoutFor` (patient/billableParty get 'patient' layout). `buildInvoicesForBooking` :264: rate each procedure with resolved contract, tag lines by funder, ONE invoice per Booking per distinct counterparty (first-appearance order); stored lines with funderOverride are the explicit allocation (re-checked for conservation, else 'allocationStale'); price override emitted as its own line; pre-payment deduction line "Less pre-payment deposit already invoiced" (exceptions 'prepaidFunderOverride', 'prepaidCounterpartyChanged'); negative group = exception 'negativeTotal'; zero group = no invoice. Any exception fails the whole Booking (per-booking isolation). `buildPrePaymentInvoiceForBooking` :456: only billableParty + selfFundedPrepayment procedures; split = flat agreed deposit line (ex GST); full = estimated fee via `feeFor` with no contract; always patient layout.
- bcti.ts: BCTI = the procedure ACCPAY (one per receivable invoice; OQ-29 per-procedure still open). `bctisFor` :93 counts per anaesthetist (ACCPAY.anaesthetistId), not voided, once, in the month the receivable was PAID (`BCTI_COUNT_RULE.paidOnly = true`, a one-switch rule), carried to the next not-yet-invoiced month; never charged twice (`bctiFeeHistory`). `bctiRecordsFrom` builds records from Xero slice (AA-fee ACCRECs excluded). Fee never netted against payables (rule, no code path).
- aaFee.ts: `aaFeeFor` (fixed items + perBctiCharge x count, ex GST; GST once at foot = subtotal x 0.15), `validateAaFeeSettings`, `aaFeeBctiLineLabel` ("BCTIs paid in July 2026"), `buildAaFeeInvoice` (snapshots settings and counted BCTIs; kind 'aaFee' ACCREC, no ACCPAY; raisedBy office|scheduled; seed can pass paidAtISO). Store: `store/aaFeeActions.ts`.
- payableRelease.ts: `payableReleasedFor(received, payable)` = min(received, payable) (cent-exact); payable released exactly as received.
- Consumers: `shared/capture/feeContext.ts`, `shared/booking/BookingDetailBody.tsx`, `store/lifecycle.ts`, `store/billingRun.ts`, `store/billingLineActions.ts`, `store/selectors.ts`.

## 7. Integrations (domain/integrations/)
- hl7.ts: demo-grade parser (MSH/SCH/PID/AIS/NTE only; not a general HL7 parser). `parseHl7`, `readField` (MSH off-by-one), `resolvePath` ("PID-3", "PID-5.2"), `extractViaMapping(raw, mapping)` is genuinely mapping-driven for nhi, patientName, dob, ethnicity, appointmentId, scheduledDateTime, operation (`HL7_MAPPING_KEYS`); eventType MSH-9.2, controlId MSH-10, cancel reason SCH-6, note NTE-3 fixed positions. Neutral `ParsedMessage`.
- fhir.ts: `toFhirBundle(parsed, practitioner)` builds Appointment+Patient+Practitioner+MessageHeader with NHI system, NZHIS ethnicity extension (validated), HPI on Practitioner; `extractFromFhir(bundle, mapping)`; `practitionerHpiOf`. System URIs are plausible stand-ins.
- feeds.ts: 3 seeded feeds: FEED-STG St George's (HL7, correct mapping nhi<-PID-2), FEED-CPH Christchurch Public (HL7, MISCONFIGURED nhi<-PID-2 but it sends PID-3; fix `CPH_NHI_FIX`='PID-3'), FEED-SX Southern Cross (FHIR paths). `FEED_META` actor labels. Transport 'pdf' exists in type but no pdf feed row.
- messages.ts: 10 canned messages (CANNED_MESSAGES): STG-1001 S12 new (repeat patient), 1002 new-format NHI, 1003 out-of-range ethnicity, 1004 transient fault (`simulatedFault:'transient'`, retries then succeeds), CPH-2001 malformed under mapping (dead-letter), FHIR-SX-2001 FHIR create, STG-1010 S13 reschedule same list, 1011 S13 moves day, 1012 S14 modify, 1013 S15 cancel, 1014 S14 locked target (manual intervention). Each has `correlationAppointmentId` (SCH-2, `APPT` map; modify targets match seeded Bookings' `correlationRef`) and creates have `routing` to hardcoded Souter Lists (28 Jul AM/PM, 30 Jul AM; 4 Aug AM). MSH-10 dedupes messages; SCH-2 correlates appointments.
- pdfSamples.ts: 2 canned surgeon-list PDFs (Okafor/Forte 27 Jul AM: row R1 matches existing patient (update not duplicate), R3 deliberate bad NHI ZAA0068 corrected ZAA0067; Whitford cataract list), SVG-data-URL facsimiles; "parsing" = the stored rows (no OCR).
- Behaviour applying messages to the schedule is NOT here: `store/integrationActions.ts`, `store/intake.ts`; UI `apps/admin/screens/IntegrationMonitorScreen.tsx`, `apps/demo/DemoIntegrations.tsx`.

## 8. NHI, NZHIS, Xero contact, HPI, clock, RNG
- nhi.ts: `validateNhi` (7 chars; letters I and O banned; formats current `AAANNNC` mod 11 and new `AAANNAX` mod 23; weights 7..2; remainder 0 = never assigned; plain-English reasons), `generateNhi(format, rng)`. RFP's "Modulus 24" label corrected (ZAA0067 valid under mod 11). Used by `shared/format.ts`, `ManualBookingForm.tsx`, store intake.
- nzhis.ts: `ETHNICITY_DEMO_SUBSET` (12 Level 4 codes across 6 groups, demo subset), `validateEthnicityCode` three-way verdict valid | outsideDemoSubset (never called "invalid") | malformed (not 5 digits). `lookupNhi` = simulated Digital Services Hub lookup over 6 canned patients (CQY9304, WQS3635, JKL1188, MYY54SL, RUE29KR, DEM1239 scenario-only).
- xeroContact.ts: `xeroIndividualContactName` = "Patient PT0001" / "Billable party BP0001" (no personal info to Xero). Used by `store/xeroHandoff.ts`.
- clock.ts: `DEMO_TODAY='2026-07-21'` (Tuesday), `INITIAL_CLOCK` 08:00, pure `DemoClockState` {todayISO, minutesSinceMidnight}; `today`, `now` (string-built, DST-safe), `advanceMinutes` (rolls days), `advanceDays`, `HORIZON_PAST_DAYS=14`, `DEFAULT_HORIZON_MONTHS=4`, `horizonFor`, `horizonDatesBetween`, `addDaysISO`, `enumerateDatesISO`. Store owns the state (`store/clockActions.ts`).
- dateDays.ts: `daysBetween`, `bucketForAgingDays` (current <=30, 31-60, 61-90, 90+).
- rng.ts: mulberry32. names.ts: `titledSurname`.

## 9. Warnings framework (domain/warnings/)
Phase 15a, derived never stored; a warning never blocks. `WarningRule` {id, label, defaultParams, evaluate(facts, params)}; `evaluateWarnings` (routine.ts: skips cancelled Bookings; honours `active` setting; strong before mild, then rule order; a stored `WarningClearance` hides a warning only at equal/greater strength, so mild-cleared turning strong re-opens). Only ONE rule registered (`WARNING_RULES = [prepaymentUnpaidRule]`, rules/index.ts): 'beforeProcedure', strong, when prepaymentStatus is 'required' ("Prepayment required. No prepayment invoice has been raised yet.") or 'outstanding' ("Prepayment invoice unpaid. Check with the patient before surgery starts."). `WarningRuleId` union holds only 'prepaymentUnpaid'; types say later phases widen it. `AppSettings` {warningRules, aaFee, schedule} (`defaultAppSettings` settings.ts). Facts built by the store (`warningFactsFor`); clearances in store `schedule.warningClearances`.

## 10. Demo/simulator affordances touching this area
- `DemoSettings.failNextHandoff` (types:1445): next Xero handoff fails once (badged demo-only), `contactArchiveInactivityDays` (90), `XeroVolumeStory` counters (narrated, not simulated).
- Canned integration messages with built-in faults (transient, dead-letter via misconfigured CPH mapping, locked target, out-of-range ethnicity) and PDFs with a deliberate NHI error: the integration demo script lives in these data.
- `lookupNhi` canned patients incl. DEM1239 for scenario S2 phone-advice.
- `BctiRecord` seed path "Seed a month of BCTIs" (history Lists `L-RB-`; backdrop treated as non-pipeline, `conflicts.ts:40`); `L-HIST` seeded history for money views.
- `PARTIAL_INTERVAL_ROUNDING`, `TIER_NAMES_PROVISIONAL`, `VACATED_SESSION_DEFAULT` are provisional-rule switches the demo surfaces call out.
- Demo triggers and data in apps: `shared/demoTriggers/registry.ts`, `apps/demo/*` (other maps).

## 11. Stubbed, hardcoded, visual-only, assumptions
- Modifier unit values, RVG-code stand-in for "procedure type", ethnicity subset, canned NHI lookup: demo data, labelled as such in code.
- GST 15% on top of ex-GST lines; partial-interval time rounding up; Type 3 no-match falls back to BTM; one-code-per-modifier-band (PA5 exception): all recorded assumptions, not catalogue rules.
- Pairing/tier labels provisional (OQ-102); vacated-session default provisional (OQ-84); BCTI per-procedure count open (OQ-29); `paidOnly` BCTI rule unconfirmed with accountant.
- Integration routing is hardcoded to specific seeded Souter Lists and dates (2026-07-28, 07-30, 08-04); PDF "parse" is canned rows.
- `Booking.source` display-only; `Procedure.accRelated` informational; `Anaesthetist.gstPeriod` is stored data (consumed by GST report elsewhere).
- `IntegrationFeed.transport` includes 'pdf' but no such feed is seeded.
- Warning framework has a single rule; no UI to edit rule params (US-13.7.4 future).
- `OfficePrivateSlice` privacy is an import-boundary convention (test), not enforcement at runtime.
- Types present but behaviour absent in this area: no credit notes, split/extra invoice Contract config, event invoices, ledger, re-issue after credit (comments in bcti.ts mention future phases 22, 36, 38b, 39, 39b).

## 12. Gotchas for reviewers
- Two functions named `isActivePairing` (listPairing: List invariant; pairingPreferences: entry not ended).
- Slot "status" string may be any master key; code must compare by `SEED_STATUS` or flags (`bookable`), never label.
- `fee.ts`/`validateBookingForBilling.ts` use `Date.parse` on stored ISO strings (deterministic); no `Date.now()`/`new Date()` in domain.
- Invoice grouping is "one per Booking per counterparty", derived from funders (not a Contract setting).
- Date-fns `getDay()` (0 Sun) used for recurring bookings; `getISODay` (1 Mon..7) for series; both conventions exist (`RecurringBooking.dayOfWeek` 0-6, `Weekday` 1-7).
- Tests (`*.test.ts`) next to each module are good executable specs for rules above.
