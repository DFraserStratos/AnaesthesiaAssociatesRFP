# Prototype map: store + seed

Paths below are relative to `aa-prototype/src/` unless stated. Facts come from reading the code (not the old build docs). Line numbers are approximate anchors.

**Orientation.** One Zustand store (`store/appStore.ts`) holds the seeded domain (`masters`, `schedule`, `audit`, `settings`, `appSettings`, `dashboards`, `dayNotes`, `counters`) plus `clock`, `billing`, `xero`, `integrations`, `shell` slices. All domain writes go through `mutate()` (`store/mutate.ts`), which applies a recipe patch, appends append-only `AuditEntry` rows (id from counter, time from demo clock) and stamps `lastModifiedBy/At` on the touched Booking in ONE `setState`. Guards are plain functions `(api, actor, ...) => Outcome` (refusals are data: `{ok:false, code, message}`); no thrown errors. Roles: `anaesthetist | office | system`; sources: `anaesthetist | office | integration | system | demo`. The store persists to localStorage key `aa-demo`, `PERSIST_VERSION = 16`. The seed (`domain/seed/`) is deterministic (SEED 20260721, `DEMO_TODAY` 2026-07-21 08:00): 14 anaesthetists, 5 hospitals, 10 surgeons, 2 insurers, 1 contract-holder org, 12 contracts, 34 RVG codes, 20 modifier codes, ~150 patients, a 14-days-back to 4-months-forward canvas of 2 Lists/anaesthetist/day, scenario Bookings for S1 to S5, and a seeded billing/Xero history. There are NO screens in `store/` or `domain/seed/`; the only screens touching this area are `/demo/data` (inspector) and `/demo/control` (scenario jumps), mapped in section 8.

## Contents
1. Store architecture (state shape, mutate, ids, events, wiring)
2. Persistence
3. Lifecycle guards and edit-rights matrix
4. Store actions by file (name, what, guard)
5. Selectors / hooks
6. Warnings (catch-up 15a)
7. Seed (cast, contracts, RVG, canvas, scenarios S1 to S5, time-relative content)
8. Demo and simulator affordances in this area
9. Stubbed / hardcoded / visual-only
10. Gaps worth knowing for requirement review

---
## 1. Store architecture

- State: `AppState = SeedState + {clock, billing, xero, integrations, shell}` (`store/appStore.ts:~70`).
  - `masters`: anaesthetists, surgeons, hospitals, insurers, organisations, contracts, contractPrices, rvgCodes, modifierCodes, listStatuses, permanentLists, availability, holidays, patients, billableParties.
  - `schedule`: lists, bookings, procedures, billingLines, `warningClearances`.
  - `billing`: invoices, invoiceLines, cases (BillingCase), receipts, contactIdCache. `xero`: contacts, accRecs, accPays, payments, disbursements. `integrations`: feeds, messages. `shell.currentApp`.
  - `settings` (DemoSettings: `contactArchiveInactivityDays`=90, `failNextHandoff`, `volumeStory`), `appSettings` (warning rule switches/params, `domain/warnings/settings.ts`), `dashboards` (seeded W1 figures), `dayNotes`, `counters`.
- `mutate(api, actor, metas, recipe)` `store/mutate.ts:~150`: throws if zero metas (programming error). Audit entry = `{id, entityType, entityId, who, role, source, action, atISO, before?, after?}`. Booking stamp derived from entity (booking, procedure, billingLine) or `stampBookingId` (null = none). `DomainPatch` may replace masters, schedule, settings, appSettings, counters, billing, xero, integrations, dayNotes only (never audit/clock).
- Discipline: `storeDiscipline` test (`store/mutate.test.ts:~115`) source-scans all of `src/` so nothing outside `mutate.ts` raw-writes a domain slice. Exceptions: `setCurrentApp` (shell) and clock writes (`clockActions.applyClock`).
- `Outcome<T>`, `ok()`, `refuse(code, message, details?)` `store/mutate.ts:~35`. `Actor = {who, role, source, anaesthetistId?}`.
- Ids: `allocateId(counters, kind)` `store/mutate.ts:~85`; formats: A#### audit, BK#### booking, AT#### attachment, P#### procedure, BL#### billingLine, PT#### patient, BP#### billableParty, AV#### availability, DN#### dayNote, LG#### list (regenerated), HN### hospital, CTN### contract, CPN### contractPrice, PLN### permanentList, HHN### holiday, INV####, IL####, BC####, `AA-2026-####` invoiceNumber (year pinned), XC/XR/XP (xero contact/ACCREC/ACCPAY), PMT, DSB, PR (payables run), RCT (receipt), IM (integration message). Seed history uses disjoint prefixes (HBK, HINV, H-...).
- Named actors `store/demoActors.ts`: `OFFICE_ACTOR` Kirsty W. (office), `SOUTER_ACTOR` Dr Melanie Souter (anaesthetist id 34821), `OFFICE_SIMULATION_ACTOR` "AA office (simulated)" (office role, passes officeOnly guards), `OFFICE_ACCOUNT_ID`. Billing run actors `Billing run` / `Billing run (retry)` (system); integration actor label per feed (`FEED_META.actorLabel`, role system, source integration); payment actors by source (webhook/poll, source system); `Demo control` (system/demo) for clock.
- Events `store/events.ts`: `listAuthorised{listId}`, `dayAdvanced{todayISO}`; listener errors are swallowed+logged. Wiring at bootstrap (`main.tsx`, `pwa/main.tsx`): `wireBillingRun` (listAuthorised -> `runBillingForList` -> `handoffListCases`), `wireReconciliationPoll` (dayAdvanced), `wireArchiveJob` (dayAdvanced), `wireIntegrationRetry` (900 ms timer re-attempts `retrying` messages).
- Reset: `resetDemo` -> `resetDomainState` (`mutate.ts:~205`) replaces all domain slices + clock + billing/xero/integrations with the seed, keeps `shell`. Not audited.

## 2. Persistence (`store/appStore.ts`, `store/persistStorage.ts`)

- `persist` middleware, key `aa-demo`, version **16**, `createJSONStorage(() => resilientLocalStorage)`.
- `migrate` (version mismatch) returns `freshAppState()` i.e. discards stale state and reseeds. `merge` = `backfillMerge`: overlays persisted on fresh one level deep (missing sub-keys backfilled), plus one second level for `appSettings.warningRules`. Record maps taken wholesale from persisted state.
- Version history comment at `appStore.ts:~125-160` (v16 warning settings/clearances, prepayment override removed; v15 Booking.source + List attachments; v14 Card renamed Booking, BK ids, `booking.*` audit; v13..v2 earlier phases).
- `persistStorage.ts`: 250 ms trailing coalesced write; on QuotaExceeded or blocked storage latches `persistDisabled` (session continues in memory, no throw into handlers); flushes on `pagehide` and `visibilitychange=hidden`; `flushPersist()`, `persistStatus()` ({disabled, reason}), `bytes()`, `STORAGE_BUDGET_BYTES` 5 MB. Pristine payload about 1.17 MB.
- Practical effect: no server, no auth; the "database" is the browser. Reset button + `PERSIST_VERSION` bump are the only ways to reseed. Test coverage: `persistMigrate.test.ts`, `persistStorage.test.ts`.

## 3. Lifecycle guards and edit-rights matrix (`store/lifecycle.ts`)

- List state: `DRAFT -> SUBMITTED -> AUTHORISED`, strictly ordered, no Returned/reject transition anywhere (`lifecycle.ts:1-12`).
- `editRefusal(actor, list)` `lifecycle.ts:48` is the shared gate used by Booking/Procedure/Attachment/BillingLine/Patient/createBooking writes:
  - AUTHORISED: refuse `listAuthorised` for everyone.
  - source integration: allowed only on DRAFT, else `integrationImmutable`.
  - anaesthetist: own List only (`notOwnList`), DRAFT only (`listSubmitted`).
  - office/system: DRAFT and SUBMITTED editable.
- `completionBlockersFor` / `completeBooking` (`:94`, `:115`): blocks cancelled, integration source, edit-rights, already-complete, and `validateBookingForBilling` failures (`domain/billing/validateBookingForBilling.ts`; code `validationFailed`). Warnings (prepayment) never block (15a).
- `uncompleteBooking` `:164`: same rights, refuses cancelled/not-completed/integration.
- `submitList` `:210`: DRAFT only; not integration/system; anaesthetist own List; every non-cancelled Booking must be completed (`bookingsNotCompleted`). Cancelled bookings never block.
- `authoriseList` `:262`: SUBMITTED only (`listNotSubmitted`), office role only (`officeOnly`); emits `listAuthorised` AFTER commit (drives billing run + Xero handoff).
- `logListNote` `:307`: office only, any state, non-empty text; appends `ListPhoneNote`.
- `cancelBooking` `:348`: reason required, not already cancelled, edit-rights; soft cancel (retained, excluded from validation and billing).
- `editBooking` `:402`: only `scheduledTime` and `notes` patchable (attachments via their own actions). `editProcedure` `:438`: any Procedure field except id/bookingId, edit-rights. `editList` `:491`: hospital/surgeon/times/notes only; status and anaesthetist only via availability/reassign.
- `reassignList` `:543`: office only, not AUTHORISED, different target anaesthetist, vacated status in {free, unavailable, holiday}, target slot must exist and be genuinely Free (status free, DRAFT, no Bookings, no attachments); absorbs target List, regenerates a vacated List (id LG####), drops availability-kind conflicts. Audits `list.reassign`, `list.absorb`, `list.regenerate`.
- `reassignBooking` `:635`: moves one Booking; neither List AUTHORISED; edit-rights on source (and target); a SUBMITTED target is allowed for office.
- `setAvailability` `:698`: writes `masters.availability` row, then reconciles the slot's List: truly Free -> restatus (holiday/unavailable) else conflict flag `ListConflict{kind:'availability'}` (replace, never stack); un-block symmetric. Refuses integration source, other anaesthetists' availability. Audits `availability.set|update`, `list.restatus`, `list.conflict`.
- `requestCover` `:843`: anaesthetist only; Free List only; `offer` on own session, `request` on someone else's; one pending at a time. Marker only (`List.coverRequest`), no notification.

## 4. Store actions by file

| Action | File | What it does | Guard / refusal codes |
|---|---|---|---|
| completeBooking, uncompleteBooking | lifecycle.ts | complete / re-open Booking | editRefusal; validationFailed; integrationForbidden |
| submitList, authoriseList, logListNote | lifecycle.ts | List transitions + phone note | see section 3 |
| cancelBooking, editBooking, editProcedure, editList | lifecycle.ts | guarded patches | editRefusal |
| reassignList, reassignBooking, setAvailability, requestCover | lifecycle.ts | canvas moves, availability, cover | section 3 |
| createBooking | bookingActions.ts:78 | ad hoc Booking + first Procedure + patient upsert; input has billingRoute (set explicitly), insurer, billable party, patientPaymentCategory, billingReference, notes, attachment, correlationRef, `source` | editRefusal; operationRequired; invalidNhi (via upsertPatient) |
| copyBooking | bookingActions.ts:196 | skeleton copy (same List + patient + billingReference); route defaults `hospital`; audit `booking.copy` | editRefusal on source List |
| addPostOpAddendum | bookingActions.ts:290 | new Booking `bookingType:'postOpAddendum'` + `addendumOfBookingId` onto anaesthetist's free empty DRAFT session today (AM then PM) | original List must be AUTHORISED (`notAuthorised`); `noOpenSession` |
| addProcedure / removeProcedure | bookingActions.ts:422 / 502 | additional Procedure (`isAdditional:true`); remove additional only (cascades billing lines) | not cancelled, not completed, editRefusal |
| upsertPatient | intake.ts:52 | NHI dedupe (reuse + enrich) or create (provisional if no NHI); ethnicity code validated (invalid is quarantined into `ethnicityPending`) | validateNhi -> invalidNhi |
| editPatient | intake.ts:145 | name/dob/phone/email/address; with `viaBookingId` applies List edit-rights | notFound; editRefusal |
| addAttachment / removeAttachment | attachmentActions.ts:69/115 | Booking or List attachments (AT ids; audit omits dataUrl) | editRefusal; bookingCancelled; attachmentNameRequired |
| addBillingLine | billingLineActions.ts:46 | non-RVG line: `fixed` (amount>0) or `rateTime` (hours x rate, rounded to cents) | editRefusal; Method 3 rateTime only if governing Contract `permitsIndividualArrangement` (`individualArrangementNotPermitted`) |
| setBillingLineAllocation, setProcedureFunderAllocation | billingLineActions.ts:138/218 | per-line funder override + amount (one procedure two funders) | office only (`funderAllocationOfficeOnly`); conservation to the cent vs computed fee |
| removeBillingLine | billingLineActions.ts:300 | delete stored line | editRefusal; lines with funder override: office only |
| createBillableParty | billablePartyActions.ts:21 | guardian/payer record (BP ids) | nameRequired; relationshipRequired |
| addDayNote | dayNoteActions.ts:22 | per-day internal office note + initials | textRequired |
| raisePreProcedureInvoice | prepaymentActions.ts:51 | pre-payment invoice for selfFundedPrepayment procedure (split deposit or full) | office only; not cancelled; List not AUTHORISED/billed (`listBilled`); `notPrepayment`; `alreadyRaised` |
| clearWarning | warnings.ts | office clearance stored in `schedule.warningClearances` | office only; warning must still be raised |
| createHospital | mastersActions.ts:45 | hospital + protected default Type 1 contract (effective 2020-01-01) | office; nameRequired; duplicateName |
| setInsurerDirectClaims | mastersActions.ts:102 | toggle direct claims; mints default Type 1 when turned on and none exists | office |
| editAnaesthetist | mastersActions.ts:185 | unitValue, phone, email, gstPeriod, active | office; unitValue>0 |
| addAnaesthetist | mastersActions.ts:241 | new anaesthetist + canvas Lists today..horizon via slot RNG; audits `anaesthetist.create` + `canvas.generate` | office; registration required+unique; unitValue>0 |
| addHospitalHoliday | mastersActions.ts:320 | holiday row + `holiday` conflict flags on booked Lists that date | office; unique per hospital/date |
| addPermanentList, editPermanentList | mastersActions.ts:398/443 | weekly template rows (do not retro-change generated Lists) | office |
| createContract / editContract / deleteContract | contractActions.ts:53/106/152 | any type 1/2/3, any holder; Type 2 needs rate or % detail | office; protected default Type 1 cannot be end-dated, re-typed, re-held, re-dated or deleted (`defaultContractProtected`); delete refused if governing procedures (`contractInUse`) |
| addContractPrice / editContractPrice | contractActions.ts:200/235 | Type 3 price rows (rvgBaseCode, optional procedureOrdinal) | office; price>0 |
| runBillingForList | billingRun.ts:68 | per-List billing run on AUTHORISED List: per Booking builds invoices + BillingCase (status invoiced) or failed case; nets off pre-payment; stamps `List.billedAtISO`; one atomic mutate, source system | listNotAuthorised; alreadyBilled; per-Booking failures isolated, never thrown |
| retryBillingCase | billingRun.ts:285 | rebuild one failed Booking | office; case must be `failed` |
| markInvoiceEmailed | billingRun.ts:398 | stamp emailed (audit `invoice.email`) | office; once only |
| handoffCase / handoffCasesForBooking | xeroHandoff.ts:153 | creates ACCREC + DRAFT ACCPAY pair; contact resolution cache -> ContactNumber lookup -> create; unarchives archived contact; idempotent on `accRecId`; `settings.failNextHandoff` records `handoffFailure` and clears flag | noInvoice; noAnaesthetist |
| receivePayment | paymentActions.ts:78 | webhook/poll payment on ACCREC: PaymentIn, ACCREC received, pro-rata authorise ACCPAY, mirror to case (status partPaid/paid), append Receipt (GST = gross x 3/23); idempotent by idempotencyKey | invalidAmount; noCase; clamped to balance |
| runReconciliationPoll | reconciliationPoll.ts:19 | re-detects Xero payments with no receipt (seeded missed webhook) | none |
| runPayables / disbursePayable | payablesActions.ts:146/160 | disburse `authorised - disbursed` per ACCPAY; audits `xero.disbursed` | office |
| runArchiveJob | archiveActions.ts:66 | archive fully-paid inactive patient/billable-party contacts older than window (90 d default); org contacts exempt; decrements `volumeStory.activeContacts` | none (system) |
| setArchiveWindowDays, armHandoffFault | demoSettingsActions.ts | config + one-shot fault flag | office; days>=0 |
| processMessage, retryMessage, reprocessMessage | integrationActions.ts:309/334/339 | canned HL7/FHIR message through feed mapping then S12 createBooking / S13 retime or reassign / S14 edit / S15 cancel (all with integration actor); statuses pending/processed/retrying/deadLetter/manualIntervention/duplicate; MAX_ATTEMPTS 3; MSH-10 dedupe | locked/unmatched/missing List parks as manualIntervention; other failures retry then dead-letter |
| setFeedMapping | integrationActions.ts:351 | edit one field mapping (e.g. nhi PID-2 -> PID-3) | office |
| correctEthnicityCode | integrationActions.ts:392 | fix quarantined ethnicity | validateEthnicityCode |
| ingestPdfRow | integrationActions.ts:434 | PDF row: update existing Booking by NHI on that List, or createBooking `source:'surgeonPdf'` | invalidNhi; notFound |
| advanceClockMinutes/Days/ToNextMorning/ToDate, resetDemo | clockActions.ts | forward-only demo clock; day gain generates far-edge canvas Lists (audit `canvas.rollForward`, source demo) and emits `dayAdvanced` | n/a |
| simulateSignInAttempts | authDemoActions.ts:24 | writes 5 audit rows only (`account.provisioned`, `auth.signIn`, `auth.signInFailed`, `auth.passwordReset`, social sign-in) with empty patch | none |
| authoriseAsSimulatedOffice | officeStandIn.ts:28 | authorises a SUBMITTED List as simulated office then ensures billing run + handoff | `Submit the List first` / `Already authorised` |
| setCurrentApp | appStore.ts | shell only, unaudited | n/a |

## 5. Selectors / hooks (`store/selectors.ts`, re-exported from `store/index.ts`)

- Lookup: `listForSlot` (id or scan), `listsForDate`, `bookingsForList`, `proceduresForBooking`, `auditForEntity`, `dayNotesFor`, `findBookingByCorrelation`, `bookingsOnListByNhi`, `feedsForHospital`.
- Review/billing: `submittedLists` + `submittedListCount` (review badge), `isListBilled` (`billedAtISO`), `billedLists`, `invoicesForList`, `invoiceLinesFor`, `invoiceCountsByList`, `casesForBooking/List`, `failedCases`, `handoffFailedCases`, `billingAttentionCount`, `billingMonitor` (per AUTHORISED List: stages authorised, run, invoices, emailed, xero; per-Booking rows with money mirror), `counterpartyName`, `billingContextForBooking` (feeds `validateBookingForBilling` and invoice build).
- Prepayment: `bookingRequiresPrepayment` (any procedure billingRoute billableParty + `selfFundedPrepayment`), `prePaymentInvoicesForBooking`, `paidPrePaymentCaseForBooking` (money-based), `prePaidByProcedure`, `prepaymentStatusFor` = none | required | outstanding | paid; `patientHasOutstandingPriorEpisode` (WI2a repeat-patient check).
- Money/anaesthetist views: `openAccRecs` (demo payment picker), `caseOutstandingAmount`, `accpayInvoicesFor`, `outstandingAccpayInvoicesFor`, `overdueAccountsFor`, `receivablesAgingFor` (buckets current/31-60/61-90/90+), `gstActivityFor`, `paymentHistoryFor`; `dashboardFiguresFor` (seeded productivity/leave; receivables derived).
- Backdrop filter: `isBackdropList` (`L-HIST*`) and `isBackdropInvoice` (`HINV*`) exclude seeded history from office pipeline views but include it in anaesthetist money views.
- Integrations: `integrationMonitor`, `integrationAttentionCount`, `dataQualityItems` (quarantined ethnicity).
- Misc: `entityCounts`, `clockTimeLabel`, hooks `useToday()`, `useClockTimeLabel()`. Warning selectors in `warnings.ts` (section 6). Rule: components must select raw slices and memoise; never return fresh arrays from a zustand selector.

## 6. Warnings (catch-up 15a; `store/warnings.ts`, `domain/warnings/`)

- Derived, not stored. Rule registry `domain/warnings/rules/index.ts`; ONE rule registered: `prepaymentUnpaid` (`rules/prepaymentUnpaid.ts`): `prepaymentStatus==='required'` -> strong "Prepayment required. No prepayment invoice has been raised yet."; `'outstanding'` -> strong "Prepayment invoice unpaid...". kind `beforeProcedure`; strengths mild|strong. Types (`domain/warnings/types.ts`): `WarningRule{id,label,defaultParams,evaluate}`; `WarningClearance{key,bookingId,ruleId,strength,by,role,atISO}`.
- `evaluateWarnings` (`routine.ts`) applies `appSettings.warningRules[id].active/params` and a clearance only covers the strength it was cleared at.
- Selectors: `warningFactsFor`, `warningsForBooking`, `warningsForList`, `openWarnings` (dashboard to-do; sorted date, strong first, session, time), `warningSummaryByList` (Day outline), `clearWarning` (office, any List state incl. AUTHORISED; audit `booking.warningCleared`, no Booking stamp).
- No screen edits `appSettings` (US-13.7.4 future). Warnings never block completion/submission.

## 7. Seed (`domain/seed/`)

**Assembly** `index.ts buildSeedInternal`: canvas generate (`canvas.ts`) -> `applyDesignFixups` (Tue 21 design day times/free sessions, Wed 22 Souter PM free, Thu 23 availability grid) -> `applyPhase06Conflicts` (one holiday-kind and one availability-kind advisory conflict on two booked Wed 22 non-Souter Lists) -> `applyPhase09Slots` -> `buildBookings` (`bookings.ts`, 1266 lines) -> mark 6 Lists SUBMITTED -> `buildPatients` -> `buildHistory` (`history.ts`) -> theatre-list PDF attachment AT0001 on Souter Tue 28 Jul AM -> `buildSeedAudit` (`audit.ts`) -> `buildSeedBillingSlice` (`billing.ts`). Built once at module load, shared (`SEED_BUILD`). `SEED_LIST_IDS` and `SEED_MARKERS` (about 33 named finders) exported.

**Cast** (`cast.ts`): 14 anaesthetists (reg no = id; Souter 34821 is the persona; unit values $26 to $42, Souter $26.50; only Whitaker `sixMonthly` GST, rest monthly; `hpiId` set; all `active`). 10 surgeons (id `S-NAME`, name, specialty). Hospitals `H-STG` St George's, `H-SX` Southern Cross, `H-FORTE`, `H-CES` Christchurch Eye Surgery, `H-CPH` Christchurch Public. Insurers: nib (direct claims true), AIA Health (false). Organisation `O-COS` Canterbury Orthopaedic Surgeons. List statuses: private, public, preop, holiday, unavailable, free (`LIST_STATUSES`). Hospitals/insurers carry only id+name (no addresses, contacts, billing details).

**Contracts** (`contracts.ts`, `CONTRACT` ids): protected default Type 1 for each hospital and nib (effective 2020-01-01; `isDefault`); Type 2: `CT-SXAP` Southern Cross affiliated $26.50 (from 2024-07-01), `CT-HNZ` Health NZ at CPH $23, `CT-STG-ACC` ACC via St George's $25, `CT-COS-ACC` COS-held ACC $24 (holder type organisation, no default fallback), `CT-ARIA-HOURLY` held by billable party Aria clinic with `permitsIndividualArrangement:true`; Type 3 `CT-DOYLE-BAR` held by surgeon Doyle with `CONTRACT_PRICES` (20880 $2800, 20882 $2400, 49120 ordinal 2 $950). Holder types hospital|insurer|surgeon|organisation|billableParty; scope `{kind:'organisation'}` only (no per-anaesthetist scope seeded). Seed says "demo values within RFP ranges, not an NZSA schedule".

**RVG** (`rvgCodes.ts`): 34 codes across sites, base units single or range, `absorbsModifierCodes` (e.g. `P1` absorbed for hip/shoulder/spine). `EYE_CODES` and `GENERAL_CODES` pools for filler. Modifier master (`domain/billing/modifierCodes.ts`): PA1-PA5, A1-A2, AS1-AS4, ASE, OB1-OB4, P1, AI1, PO1-PO2 (one per band selectable). Time units, fee maths and contract selection live in `domain/billing/*` (not in this map).

**Canvas** (`canvas.ts`): exactly 2 Lists (AM/PM) per anaesthetist per date; precedence: availability master row > Permanent List template (weekday, Mon-Fri) > slot-hashed RNG (`slotHash.ts`; order independent so roll-forward equals fresh seed) ; hospital holidays flag (not restatus) booked Lists. Ids `L-{reg}-{date}-{AM|PM}`. 14 anaesthetists only (a scale test exercises 85). `permanentLists.ts` (templates PL###; Souter's design week Mon Forte/Okafor + STG/Lim, Tue STG/Hale + SX/Patel, Wed CES/Whitford AM, Thu CPH acute AM + preop PM). Availability (`availabilityAndHolidays.ts`): Souter leave Fri 24 to Sun 26 Jul, Beaumont 13 to 26 Jul, Ngatai 16 to 28 Jul, Ngata unavailable Tue 21, Delaney unavailable Thu 23, Ropata leave 24 to 28 Aug, Sharma 14 to 16 Sep. Hospital holidays: Labour Day 26 Oct, Canterbury Anniversary 13 Nov (each hospital).

**Patients** (`patients.ts`): ~150 fictional, 19 pinned (`PAT`), one provisional no-NHI (Noah Prescott, PT0010), NHI old and new formats, every patient with a demo-subset NZHIS ethnicity code. Billable parties: BP0001 Hana Park (mother of Grace Park, 12), BP0002 Aria Skin and Laser Clinic.

**Scenario Bookings** (`bookings.ts` ~320-1266; `BookingScenarioIds`):
- Design day Tue 21 Jul: Souter AM STG/Hale 5 complete DRAFT (done, unbilled); PM Southern Cross/Patel 4 bookings incl. Ellison (hip replacement, left uncaptured for live Finish-now); Chen (overridden time units).
- Submitted Lists awaiting review: Morrison Mon 20 STG/Tan (6 complete + 1 cancelled), Whitaker Fri 17 CPH acute (5 complete), Souter Mon 20 AM Forte/Okafor (split billing multi-procedure + a missing billing reference), Souter Mon 20 PM STG/Lim (one procedure two funders: B4+T4+AS1 = 8 units, $212, nib override), Ropata Thu 16 AM STG/Hale (billing failure exemplar), Delaney Fri 17 AM STG/Doyle (locked integration target).
- Other: bariatric Type 3 (Fitzgerald Tue 14), rate x time (billable-party-held contract), insured reimbursement (AIA, patient pays), COS ACC (Rutherford Thu 9), ACC-related via STG ACC Type 2, repeat patients Mitchell and Walker (two episodes each; Mitchell carries seeded unpaid prior balance), guardian pays minor (Chen Fri 24 CES), prepayment split unpaid (Souter Fri 24 AM, $800 deposit on $1,200), prepayment mixed+full seeded PAID (Souter Fri 24 PM), rate x time capture booking (Souter Mon 27), provisional no-NHI patient booking, near-future filler (Wed 22 CES x6, Thu 23 CPH x8 + preop x6), generic filler (rich 2 weeks back, thinning about 10 days out).
- Integration-origin Bookings with `correlationRef`: S13 same-List (Souter Tue 4 Aug AM), S13 move (Mon 3 Aug PM), S14, S15 (Tue 4 Aug AM), locked target (Delaney Fri 17). `Booking.source` assigned by rule: correlationRef or feed hospital (STG, SX, CPH) -> `hospitalDownload`; PDF hospital (Forte, CES) -> `surgeonPdf`; else `admin`.
- S1 destination: Souter Tue 28 Jul AM STG/Hale: 3 booked uncaptured Bookings + List attachment; S12 message `MSG-STG-1001` lands Sarah Mitchell as the 4th.

**Seeded billing/Xero** (`billing.ts`, `history.ts`): one PAID pre-payment invoice (INV0001/BC0001) for the mixed+full booking; historical backdrop Lists `L-HIST*`, Bookings `HBK*`, invoices `HINV*` with cases carrying money, ACCREC/ACCPAY/payments/disbursements: 8 unpaid accounts across aging buckets, some PAID for GST, one MISSED WEBHOOK payment (caught by the poll on next day advance), Riley's Xero contact seeded ARCHIVED (unarchive on return). ACCPAY nets an illustrative 5% AA service fee (`domain/billing/agencyFee.ts`, assumption not in RFP). `settings`: archive window 90 d; `volumeStory` {28000 invoices/yr, 99% one-time, 9820 active contacts, soft limit 10000}. Integration feeds (`domain/integrations/feeds.ts`): `FEED-STG` (mapping correct, nhi PID-2), `FEED-CPH` (nhi misconfigured PID-2, real NHI in PID-3 -> dead-letters until fixed), `FEED-SX` (FHIR). Canned messages `MSG-STG-1001..1014`, `MSG-CPH-2001` (`domain/integrations/messages.ts`); PDF samples for Forte/CES.

**Other seeds**: day notes Tue 21 (DN0001-3, Kirsty W./Rachel T., one flagged); anaesthetist dashboard figures for Souter only (units 274, 21 lists, fees $7,261, leave rows incl. NZSA conference pending); audit history (`audit.ts`): every Booking gets booking/procedure/capture/fee/completion rows in chronological order.

**Time-relative content** (everything pinned, never real time): `DEMO_TODAY` 2026-07-21 and `INITIAL_CLOCK` 08:00 (`domain/clock.ts`); horizon 14 days back, 4 months forward (`HORIZON_PAST_DAYS`, `HORIZON_FUTURE_MONTHS`); seeded audit timestamps relative to Tue 21; invoice numbers `AA-2026-####`; contract effective dates; leave/holiday windows; aging buckets computed against the demo clock. Advancing the clock never rewinds; DST on Sun 27 Sep 2026 is handled.

## 8. Demo / simulator affordances touching this area

- Routes: `/demo/control` (`apps/demo/DemoControlPanel.tsx`): clock controls (+minutes, next morning, advance days, procedure day jump), Reset, and `ScenarioJumps`. Each S-jump calls `resetDemo` first then stages:
  - S1 Booking to theatre: reset only; present HL7/FHIR as illustration (copy says Future scope); nav to Mobile and Integrations.
  - S2 Office day: reset; Admin script (phone-book Sharma Tue 21 PM, reassign Rutherford Wed 22 AM, authorise Morrison).
  - S3 Money end to end: reset; asserts Souter Mon 20 AM/PM are SUBMITTED; authorise both in Admin.
  - S4 Exceptions: reset; prepayment warning, post-op addendum (stage-post-op trigger), billing failure + retry, dead-letter + fix, partial payment.
  - S5 Compliance tour: reset + three staged audit edits on Chen (editProcedure AS2/AS1, editBooking note) + authorises Whitaker Fri 17 List.
- `/demo/data` (`apps/demo/DemoData.tsx`): entity counts, persisted bytes + persistence-paused flag, today's Lists, `SEED_MARKERS` finder, per-entity audit trail, lifecycle guard console (complete/cancel/edit/submit/authorise as chosen actor).
- Demo triggers (`shared/demoTriggers/registry.ts`, per-screen "Demo actions" menu): `billing-failure` (end-dates COS contract via editContract, submits + authorises Ropata Thu 16), `arm-handoff-fault`, `run-reconciliation-poll`, `run-archive-job`, `simulate-sign-in`, `stage-post-op` (submit + authorise Sharma Tue 14 AM List), `ingest-pdf-row`, `payment-full|half|replay` (+ `pwa-payment-*`), `office-authorises-list`, `fire-hospital-message`, `replay-hospital-message`.
- Other demo routes: `/demo/xero` (+ `/invoices/:accRecId`), `/demo/integrations` (mapped by other agents).

## 9. Stubbed / hardcoded / visual-only (this area)

- No backend; persistence is localStorage only; IDs/timestamps from counters and demo clock.
- Auth/MFA/password reset/social login: audit rows only (`authDemoActions.ts`); no accounts master. Office staff are not modelled (Kirsty W. is a constant).
- Cover offers/requests: marker on List, no notification, no accept flow.
- AA service fee 5% and GST maths are illustrative (`agencyFee.ts`).
- Xero is a store simulation (contacts, ACCREC/ACCPAY, payments); NHI never crosses to Xero.
- Integration feed processing is canned messages with simulated transient faults; S12 create stands in for the "hospital download"; no real matching screen (comment cites later phase).
- Dashboard productivity/leave figures are seeded Souter-only constants; leave has no master/approval workflow.
- Warnings: one rule only; `appSettings` has no edit UI.
- `Booking.source` display-only; no rule reads it.
- Hospitals/insurers/surgeons are name-only masters; no surgeon preferences, no per-anaesthetist contract scope.
- Seed has 14 anaesthetists (RFP says about 85); `addAnaesthetist` can extend.
- Reset/demo clock writes are unaudited (clock) or audited as source `demo`.

## 10. Gaps worth knowing for requirement review

- No user/account/role model beyond `Actor` role+source (no permissions matrix, no admin-user management).
- No reject/return path for a SUBMITTED List (deliberate rule), and no un-authorise.
- No hospital-download matching screen, no surgeon-preference or Contract-per-anaesthetist data, no leave approval workflow, no notifications of any kind.
- Tests worth reading for behaviour specs: `store/lifecycle.test.ts`, `bookingActions.test.ts`, `billingRun.test.ts`, `paymentActions.test.ts`, `integrationActions.test.ts`, `demoScenarios.test.ts`, `domain/seed/seed.test.ts`.
