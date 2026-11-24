# Review 03 - Billing Route Resolution & Supporting / Master Data

**RFP source:** `docs/rfp-reference/RFP.md` lines 593-750
**Reviewed:** 2026-07-27
**Lens:** demo-readiness (see `00-SUMMARY.md` for method)
**Note:** MISSING / PARTIAL claims in this file are unverified. `00-SUMMARY.md` carries the
adjudicated verdicts after the adversarial pass.

## Scope of this slice

Two RFP blocks: **Billing Route Resolution** (lines 593-678) and **Supporting / Master Data**
(lines 680-750). The rules were enumerated from the RFP text before opening the app.

A note on the count of master tables: the RFP's own table names **ten** masters (Hospital, List
Status, Anaesthetist, Hospital Holiday Calendar, Anaesthetist Availability, Recurring
("Permanent") Lists, Surgeon, Patient, Insurer, Contract). The Contract row folds in the Type 3
**contract price list**, which `REQUIREMENTS.md` A6 treats as its own screen, so this review checks
**11 rows** and then lists the four further master collections the prototype holds beyond the RFP's
table. All fifteen are accounted for below, so nothing is skipped by a counting argument.

## Coverage table

### Billing Route Resolution (lines 593-678)

| # | RFP feature or rule | Req ID | Status | Where in the app | Evidence |
|---|---|---|---|---|---|
| 1 | Each Procedure resolves to exactly one of three routes: Hospital / Contract Holder, Billable Party, Insurer | D4, B2 | BUILT | `domain/types.ts:409` `BillingRoute`; `shared/flows/EditBillingSetupSheet.tsx:21-25`; `shared/format.ts:37-41` | Three-value union, one field per Procedure (`domain/types.ts:453`); route segmented control has exactly the three options; screenshot `a7-02-review.png` ROUTE column reads "Contract holder" |
| 2 | Route is **set explicitly** (hospital advice, or AA staff where the hospital does not specify), never derived | D4, A2 | BUILT | `domain/types.ts:446-453` (unset until set); `shared/card/OfficeBillingSetup.tsx:65`; `shared/flows/EditBillingSetupSheet.tsx:127` | Field is optional and the validator fails an unset route: `domain/billing/validateCardForBilling.ts:125-126` ("Set a billing route for this procedure."); office editor is the setting surface, screenshot `a-05-override.png` shows the Office billing setup panel with a Route row |
| 3 | Hospital / Contract Holder route: the holder accepts billing; contracts act as billing rules | B2 | BUILT | `domain/billing/invoiceBuild.ts:186-207` `counterpartyForProcedure` | Counterparty is the **resolved contract's holder**, so hospital, surgeon, group and organisation holders all bill correctly; tests `invoiceBuild.test.ts:176` and `store/billingRun.test.ts:189` (surgeon-held bariatric), `:232` (COS organisation) |
| 4 | A Default Contract with no conditions is always present; it is empty and bills at normal (no-contract) rates | B2 | BUILT | `domain/seed/contracts.ts:31-56`; `store/mastersActions.ts:25-47` `defaultType1` | Seeded Type 1 default carries no `type2Detail` and no price rows, so `feeFor` uses the anaesthetist's own unit value (`domain/billing/fee.ts:187`); test `fee.test.ts:80` "Type 1: units x the anaesthetist unit value"; screenshot `a7-02-review.png` shows "St George's standard units (default Type 1)" against $35.00/unit |
| 5 | Billable Party route: patient (or override) billed directly, no contract, standard rate, optional price override | D4, B2 | BUILT | `domain/billing/invoiceBuild.ts:173` (route needs no contract); `shared/flows/EditBillingSetupSheet.tsx:144-166` (payer picker defaults to "Patient (default)") | Test `invoiceBuild.test.ts:155` "the billable party route needs no contract at all (standard rates)"; override typed at `domain/types.ts` `PriceOverride` and edited in `shared/flows/PriceOverrideSheet.tsx`, screenshot `a-05-override.png` |
| 6 | Insurer route: the named insurer is billed directly, only where that Insurer accepts direct claims | D4, M5 | BUILT | `domain/types.ts:166-178` `Insurer.acceptsDirectClaims`; `domain/billing/validateCardForBilling.ts:167-178` | Validator refuses the Insurer route for an insurer that does not accept direct claims; seed holds nib (true) and AIA Health (false) at `domain/seed/cast.ts:122-123`; screenshot `a8-06-invoices-mixed.png` shows the nib invoice with an "Upload portal" status |
| 7 | Rate is governed by the Contract held for that Insurer | B2 | BUILT | `domain/billing/invoiceBuild.ts:163-172` | Insurer route with nothing stored resolves that insurer's default; test `invoiceBuild.test.ts:148` "nothing stored on the insurer route resolves the insurer default", `:98` insurer-held stored contract dated out falls back to the insurer default |
| 8 | Hospital dual role: physical theatre location (always present on an active List) **and** billing counterparty, both via the same Hospital master record, no second reference | D2, D5, B2 | BUILT | `domain/types.ts:155-158` (one `Hospital`); `List.hospitalId` (`domain/types.ts:308`); `Contract.holderId` with `holderType: 'hospital'` (`:221`) | No second hospital field exists on Procedure or Card; the billing run reads the **List** hospital to resolve the default when nothing is stored: `domain/billing/invoiceBuild.ts:153-162`, test `invoiceBuild.test.ts:136` "nothing stored on the hospital route resolves the LIST hospital default"; screenshot `a8-06-invoices-mixed.png` bills counterparty "St George's" off St George's lists |
| 9 | Rate calculation is independent of route: uniform lookup of the governing Contract for the counterparty, then apply its type | B2, B4 | BUILT | `domain/billing/invoiceBuild.ts:113-180` then `domain/billing/fee.ts:180-235` | Resolution and rating are separate functions; `feeFor` takes the resolved contract and never reads the route; test file `invoiceBuild.test.ts:62-173` covers resolution alone, `fee.test.ts:80-150` covers rating alone |
| 10 | Contract Type 1 - reference only, no overrides, standard rate (anaesthetist's own $/base unit, RVG-referenced) | B4 | BUILT | `domain/billing/fee.ts:187` (`unitRate = ctx.anaesthetist.unitValue`) | Test `fee.test.ts:80`; per-anaesthetist unit values are real master data, screenshot `a7-04-masters.png` UNIT $ column (26.50 to 42.00) |
| 11 | Type 1 is also the "contract reference with no pricing impact" case | B2 | BUILT | `domain/types.ts:216-247` (Type 1 carries no pricing detail); `Procedure.billingReference` (`domain/types.ts:475`) | The hospital's own reference is a separate field surfaced on the invoice: screenshot `a8-03-contract-holder-doc.png` "Reference SG-2026-0776"; a Type 1 contract with a name is exactly a reference-only contract |
| 12 | Contract Type 2 - agreed rate or discount % off standard rates | B4 | BUILT | `domain/types.ts:207-210` `ContractType2Detail`; `domain/billing/fee.ts:188-196` | Both bases implemented (agreed $/unit and % discount, discount rate rounded to cents); tests `fee.test.ts:86` and `:93`; end-to-end `store/billingRun.test.ts:124` ($25/unit ACC) and `:177` (Health NZ $23/unit); editor screenshot `a7-05-contract.png` shows the Type 2 basis toggle and "AGREED UNIT RATE ($) 25" |
| 13 | Contract Type 3 - fixed price, independent of standard rates | B4 | BUILT | `domain/types.ts:250-257` `ContractPrice`; `domain/billing/contracts.ts:74-107` `matchContractPrice`; `domain/billing/fee.ts:199-224` | Tests `fee.test.ts:106`, `:119` (ordinal row), `contracts.test.ts:61-100`; end-to-end `store/billingRun.test.ts:189` (bariatric $2,800 + $950 on one invoice); admin price-row editor `apps/admin/flows/ContractEditSheet.tsx:193,225-283` |
| 14 | Every Hospital and every direct-billing Insurer is mandated to hold at least a default Type 1; no "no contract found" branch | B2 | BUILT | `store/mastersActions.ts:49-99` (`createHospital` mints it atomically), `:107-163` (`setInsurerDirectClaims` mints it), `store/contractActions.ts:28-30,111-119,157` (cannot be deleted, end-dated, retyped or moved) | Tests `store/mastersActions.test.ts:242` (blocks delete), `:250` (blocks end-dating), `:258` (allows a name edit), `:265` (blocks retype/holder move); `store/intake.test.ts:172,192`; `store/billingRun.test.ts:445` "a protected default cannot be forward-dated away". Seed holds 6 defaults for 5 hospitals + nib (`domain/seed/contracts.ts:44-55`) and correctly **none** for AIA Health, which is not direct-billing. Screenshot `a7-06-add-hospital.png`: adding "Rangiora Day Surgery" reports its default Type 1 was created |
| 15 | Expired / absent negotiated contract at a hospital or direct insurer falls back to that counterparty's default (the guarantee's practical effect) | B2 | BUILT | `domain/billing/invoiceBuild.ts:87-106` `defaultContractFor`, `:136-146` | Fallback is pre-filtered to `isDefault` so it can never land on another negotiated contract: test `invoiceBuild.test.ts:84` "the fallback target is the DEFAULT, never another surviving negotiated contract"; `store/billingRun.test.ts:317` (hospital Type 2 dated out bills at standard rates, no failure), `:331` (organisation-held dated out is a per-card exception, no mandated default) |
| 16 | Contract is looked up by counterparty, not by procedure type or any other dimension | B2 | PARTIAL | `domain/billing/contracts.ts:32-59` `selectContract`; picker `shared/flows/EditBillingSetupSheet.tsx:169-179` | Automatic resolution filters on holder + effective date only (correct). But the office picker lists **every** contract in the store unfiltered by route or holder, and the billing run then derives the counterparty **from the picked holder**, so an incoherent pick silently redirects the invoice. Known and parked: `PROGRESS.md` handoff item 1 (P1, holder-coherence advisory). See finding 03.1 |
| 17 | Multiple Procedures resolving to the same route and counterparty are billed together on a single invoice; invoice generation is a grouping operation, not 1:1 | B6 | BUILT | `domain/billing/invoiceBuild.ts:398-425` (group by counterparty key) | Tests `invoiceBuild.test.ts:225` "same-counterparty procedures share ONE invoice", `:244` "procedures with DIFFERENT funders split into separate invoices"; `store/billingRun.test.ts:244,259,292`; screenshot `a8-06-invoices-mixed.png` (one authorised list yields 4 invoices: 3 x St George's, 1 x nib, plus patient-layout invoices) and the on-screen copy "Procedures billed to the same counterparty share one invoice per Card" (`apps/admin/screens/InvoicesScreen.tsx:70`) |
| 18 | "Care will be required in the design of the charging of multiple procedures. Various rules apply depending on the nature of the contract." | B4, §11 | BUILT (one reading, labelled) | `domain/billing/fee.ts:199-224`; split-billing time-only rule `domain/billing/fee.ts` `splitBillingUnits` | Type 3 additional procedures take a fixed price only from an ordinal-keyed row, else fall to BTM time-only; tests `fee.test.ts:130,142`, `invoiceBuild.test.ts:335`. Logged as a demo reading (`PROGRESS.md` decision 2026-07-22 "Type 3 second-procedure fallback") and carried as discovery item P2. See tensions below |

### Supporting / Master Data (lines 680-750)

| # | RFP master table | Req ID | Status | Where in the app | Evidence |
|---|---|---|---|---|---|
| M1 | **Hospital** - ID and name, minimal further data, usually but not always the contract holder | D5, A6 | BUILT | `domain/types.ts:155-158`; `apps/admin/screens/MasterData.tsx:44` "Hospitals & holidays", `:286` | Admin tab with Add hospital; 5 seeded (`demo-data.png` counter "5 hospitals"); the not-always-holder case is real via surgeon/organisation holders (`store/billingRun.test.ts:189,232`); screenshot `a7-06-add-hospital.png` |
| M2 | **List Status** - defined set (private, public, pre-op, holiday, unavailable, free); fields description, **colour** | D2, N2, A6 | PARTIAL | `domain/types.ts:53-61` `LIST_STATUS_KEYS`, `:606-610` `ListStatus`; `apps/admin/screens/MasterData.tsx:451-468` | Six-key enumerated master with label and description, browsable in admin (`a7-04-masters.png` nav item "List statuses"). Colour is **not** a field on the master row and is not shown on that screen: it lives in `theme/statusColours.ts:39` and is held 1:1 with the master keys by `domain/statusKeyParity.test.ts`. See finding 03.2 |
| M3 | **Anaesthetist** - basic contact plus registration number (ID) | D5, A6 | BUILT | `domain/types.ts:141-153`; `apps/admin/screens/MasterData.tsx:170-195`; `apps/admin/flows/EditAnaesthetistSheet.tsx`, `AddAnaesthetistFlow.tsx` | Reg number is the primary key; contact, unit value, GST period, HPI id, active flag; editable and addable (adding extends the canvas): tests `store/mastersActions.test.ts:43,56,86,129`; screenshot `a7-04-masters.png` shows all 14 |
| M4 | **Hospital Holiday Calendar** - each hospital's own closures, maintained independently per hospital | D5, A6 | BUILT | `domain/types.ts:598-604`; `apps/admin/screens/MasterData.tsx:277-350`; `apps/admin/flows/AddHolidaySheet.tsx` | Grouped per hospital with Add holiday per row; a new holiday conflict-flags booked lists at that hospital: test `store/mastersActions.test.ts:140,162`; seeded at `domain/seed/availabilityAndHolidays.ts`; screenshot `a7-06-add-hospital.png` shows per-hospital holiday chips |
| M5 | **Anaesthetist Availability** - maintained by each anaesthetist via the mobile app, independent of List assignment, immediately reflected in the Schedule | D5, M9 | BUILT | `domain/types.ts:589-596`; `store/lifecycle.ts:717-816` (writes the master, then reconciles the canvas) | Master write, then free sessions restatus and booked sessions conflict-flag rather than being overwritten (`store/lifecycle.ts:776-816`); mobile surface screenshot `m-05-availability.png` (Free / Block per AM/PM); 80 rows seeded (`demo-data.png` counter "80 availability"). Deliberately not an admin screen: the RFP assigns maintenance to the anaesthetist |
| M6 | **Recurring ("Permanent") Lists** - Hospital, Day of Week, Anaesthetist, AM/PM; populates the rolling schedule | D1, D5, A6 | BUILT | `domain/types.ts:571-587`; `domain/seed/canvas.ts:83` (generation reads the templates); `apps/admin/screens/MasterData.tsx:243-270`; `apps/admin/flows/PermanentListSheet.tsx` | All four RFP fields plus `statusKey`, notes and the picked `surgeonId` reading; admin add/edit tested at `store/mastersActions.test.ts:173,194`; 52 templates seeded, and `domain/seed/seed.test.ts:81` asserts roughly 80% of surgeon-assigned lists derive from them |
| M7 | **Surgeon** - external party called on by AA | D5, A6 | BUILT | `domain/types.ts:160-164`; `apps/admin/screens/MasterData.tsx:345-360` | Read-only reference table, honestly labelled "Reference master (view only in this prototype)"; 10 seeded (`demo-data.png` counter "10 surgeons"); referenced by List, by Type 3 price rows (`ContractPrice.surgeonId`) and as a contract holder |
| M8 | **Patient** - NHI plus demographics, supplied by surgeon/hospital rather than originated by AA | D5, D8, X3 | PARTIAL | `domain/types.ts:103-119`; `store/intake.ts:52` `upsertPatient`, `:145` `editPatient`; patient panel on the shared card detail | Full master with hidden internal ID, optional NHI (both check-digit formats), DOB, contact, NZHIS ethnicity code + quarantine; 151 seeded (`demo-data.png`); editable from the card's PATIENT panel (screenshot `a-04-card.png`, "PATIENT ... Edit"). There is **no browsable Patients tab** in Master data (`apps/admin/screens/MasterData.tsx:40-51`) - consistent with A6, which does not ask for one. See finding 03.3 |
| M9 | **Insurer** - proper reference table, key field `acceptsDirectClaims`, holds a mandatory default Type 1 | D5, A6, B2 | BUILT | `domain/types.ts:166-178`; `apps/admin/screens/MasterData.tsx:363-392`; `store/mastersActions.ts:107-163` | Admin tab flips direct-claims and atomically mints the default Type 1 (on-screen copy says so); test `store/intake.test.ts:192`; two insurers seeded, only nib direct (`domain/seed/cast.ts:122-123`) |
| M10 | **Contract** - governs rate calculation, scoped to a Hospital or an Insurer, mandatory default Type 1, types 2 and 3 where a real arrangement exists | D5, A6, B2, B4 | BUILT | `domain/types.ts:195-247`; `apps/admin/screens/MasterData.tsx:197-240`; `apps/admin/flows/ContractEditSheet.tsx` | Full editor: type 1/2/3, holder type + holder, organisational vs individual scope, Method 3 permission flag, effective dates, protected-default lock; 12 contracts seeded across all three types and five holder kinds; screenshot `a7-05-contract.png`; guard tests `store/mastersActions.test.ts:201-320` |
| M11 | **Contract price list** (the Type 3 rows the Contract row implies; A6 lists it separately) | A6, B4 | BUILT | `domain/types.ts:250-257`; `apps/admin/flows/ContractEditSheet.tsx:193,225-283` `PriceRows` | Rows keyed by RVG base code, surgeon and procedure ordinal; add and inline-edit from the contract sheet, office-only; tests `store/mastersActions.test.ts:300`, `contracts.test.ts:61-100` |

### Master collections the prototype holds beyond the RFP's table

| # | Master | Req ID | Status | Where in the app | Evidence |
|---|---|---|---|---|---|
| M12 | **Contract-holder Organisation** (external groups such as Canterbury Orthopaedic Surgeons) | D5, B2 | BUILT | `domain/types.ts:180-186`; `apps/admin/screens/MasterData.tsx:395-408` | Admin tab (view only); billed as a counterparty in `store/billingRun.test.ts:232` |
| M13 | **Billable Party** (typed non-patient payer, e.g. a guardian) | D4, X3, §11 | BUILT | `domain/types.ts:127-136`; `store/billablePartyActions.ts`; `shared/flows/EditBillingSetupSheet.tsx:147-166` | Created inline from the office billing setup ("New guardian…"); 2 seeded (`demo-data.png` counter "2 billableParties") |
| M14 | **RVG codes** | D5, M4, A6 | BUILT | `domain/types.ts:536-544`; `apps/admin/screens/MasterData.tsx:411-428` | 34 seeded (`demo-data.png`), including range and modifier-absorbing codes; admin tab view-only with honest "Demo-plausible values" labelling |
| M15 | **Modifier codes** | D5, M4, A6 | BUILT | `domain/types.ts:552-561`; `domain/billing/modifierCodes.ts`; `apps/admin/screens/MasterData.tsx:431-448` | 20 seeded across every RFP-named group; admin tab view-only, labelled demo-plausible |

## Findings

### 03.1 - The governing-contract picker is unfiltered by route and holder  [PARTIAL]
- **RFP says:** "Contract is looked up by counterparty (Hospital or Insurer), not by procedure type
  or any other dimension." (line 669-670)
- **Built:** automatic resolution is exactly counterparty-based and effective-dated
  (`domain/billing/invoiceBuild.ts:113-180`, `domain/billing/contracts.ts:32-59`), and the
  counterparty is then derived from the resolved contract's holder
  (`domain/billing/invoiceBuild.ts:186-207`). The office override picker, however, lists every
  contract in the store with no filter on the procedure's route, its List hospital or the holder
  kind - `shared/flows/EditBillingSetupSheet.tsx:169-179` maps `Object.values(contracts)` straight
  into the `<select>`.
- **Gap:** because the run takes the counterparty **from the pick**, one wrong selection silently
  redirects the invoice - e.g. picking the billable-party-held hourly contract on a hospital-route
  procedure bills that clinic on a patient layout. Nothing in `reviewFlags.ts` flags an incoherent
  holder (`apps/admin/reviewFlags.ts:1-19` lists the built flags: completeness, ACC advisory, BTM
  override, pre-payment). This is a known, deliberately parked item: `PROGRESS.md` handoff item 1
  (P1) describes exactly this and the intended fix (an advisory flag plus picker grouping).
- **Would a workshop audience notice:** possibly. Nothing in the scripted demo path opens the
  picker's full option list, but an AA staffer who does will see contracts labelled
  `(billableParty)` and `(surgeon)` offered on a hospital-route procedure, and the natural question
  "what stops me picking the wrong one?" has no in-app answer today.
- **Severity:** notable

### 03.2 - List Status colour is not a field of the master  [PARTIAL]
- **RFP says:** "List Status | Defined set of statuses (e.g. private, public, pre-op, holiday,
  unavailable, free). Fields: description, colour. (to be confirmed)" (lines 692-694)
- **Built:** the six-key enumerated master exists with key, label and description
  (`domain/types.ts:53-61`, `:606-610`) and is browsable in the admin Master data screen
  (`apps/admin/screens/MasterData.tsx:451-468`, nav item visible in `a7-04-masters.png`). Colour is
  modelled separately in `theme/statusColours.ts:39` and held key-for-key against the master by a
  passing parity test (`domain/statusKeyParity.test.ts`), and every seeded colour is exercised
  somewhere on the canvas (`domain/seed/seed.test.ts:74`).
- **Gap:** the master row carries no colour field, and the admin table shows Key / Label /
  Description with no swatch, so there is no place in the app where a status colour is displayed as
  master data or changed. The RFP names colour as a field of this table (marked "to be confirmed").
- **Would a workshop audience notice:** unlikely to block anything - the colours themselves are
  everywhere and consistent across all three apps (N2). The risk is narrow: someone asking "where
  do we set that colour?" gets no answer on the master screen.
- **Severity:** cosmetic

### 03.3 - No browsable Patient master surface  [PARTIAL]
- **RFP says:** "Patient | Identified by NHI number, plus demographics. Patient and billable-party
  details are supplied by the surgeon/hospital as part of the Card, rather than originated by AA."
  (lines 733-736)
- **Built:** the master itself is complete and real - `domain/types.ts:103-119` (hidden internal ID
  as the invariant key, optional NHI, DOB, contact, NZHIS ethnicity code plus a quarantine field),
  151 patients seeded (`demo-data.png` counter), NHI-dedupe on intake (`store/intake.ts:52`), and an
  edit path from the card's PATIENT panel (`store/intake.ts:145` `editPatient`; screenshot
  `a-04-card.png` shows the panel with its Edit action). Patients also appear as Xero contacts in
  the Xero simulator (`apps/demo/DemoXero.tsx:193`) and are inspectable in
  `apps/demo/DemoData.tsx:179`.
- **Gap:** Master data has no Patients tab (`apps/admin/screens/MasterData.tsx:40-51` lists eleven
  entities, patients not among them), so there is no way to browse or search the patient master as a
  master table. This matches `REQUIREMENTS.md` A6, which enumerates the master screens and omits
  Patients, and matches the RFP's own point that patient data is not originated by AA - so it is
  arguably scoped rather than missing.
- **Would a workshop audience notice:** low risk. Patients are visible everywhere they matter
  (cards, invoices, review, overdue accounts, Xero contacts). An AA reviewer walking the master-data
  checklist against the RFP's table could tick nine of ten tabs and stop on this one.
- **Severity:** cosmetic

### 03.4 - An informational insurer cannot be recorded on the Hospital route  [PARTIAL]
- **RFP says:** the Hospital / Contract Holder route is "commonly noted with Contract and insurance
  details" (lines 606-607); the Procedure section immediately above adds that insurer "may otherwise
  be recorded informationally when noted by the hospital under the Hospital route" (lines 576-577).
- **Built:** `Procedure.insurerId` is an independent nullable field (`domain/types.ts:457`), so the
  **model** supports it. The office editor does not: `shared/flows/EditBillingSetupSheet.tsx:109`
  sets `patch.insurerId = route === 'insurer' && insurerId !== '' ? insurerId : undefined`, and the
  insurer picker only renders when the route is Insurer (`:129`). `shared/flows/ManualCardForm.tsx:105`
  behaves the same way, and no seeded card pairs a hospital route with an insurer
  (`domain/seed/cards.ts:369,1114` are both `billingRoute: 'insurer'`).
- **Gap:** switching a procedure to the Contract holder route silently clears any noted insurer, and
  there is no field for it. The hospital's own reference is captured (`billingReference`, shown on
  the invoice as "Reference SG-2026-0776" in `a8-03-contract-holder-doc.png`), so only the
  "insurance details" half of the RFP sentence is unrepresented.
- **Would a workshop audience notice:** only if AA staff probe the hospital-route setup for where
  they note the insurer the hospital quoted. It has no effect on rating or invoicing - the RFP is
  explicit that this record is informational.
- **Severity:** cosmetic

## Deliberate exclusions in this section

- **No admin screen for Anaesthetist Availability.** The RFP assigns this master to the anaesthetist
  "via the mobile app" (line 713); the prototype implements exactly that (`m-05-availability.png`,
  `store/lifecycle.ts:717-816`) and reconciles it into the canvas rather than merging it into Lists
  (`REQUIREMENTS.md` D5; `PROGRESS.md` 2026-07-22 first external review, ruling 2).
- **No Patients tab in Master data.** `REQUIREMENTS.md` A6 enumerates the master screens and omits
  Patients; see finding 03.3 for the honest caveat.
- **Surgeons, Organisations, RVG codes, Modifier codes and List statuses are view-only.**
  `apps/admin/screens/MasterData.tsx:353,400,415,436,456` label each one as such in on-screen copy.
  A6 asks for "read/edit views"; the prototype ships edit on the masters the demo actually mutates
  (anaesthetists, contracts + price rows, permanent lists, hospitals, holidays, insurer
  direct-claims) and read on the static reference tables.
- **Cross-card invoice grouping.** `REQUIREMENTS.md` B6 scopes grouping to "per Card" (one Card,
  potentially many invoices); the RFP's grouping example - two uninsured procedures for the same
  patient - is a single-Card case, and the app says so on screen
  (`apps/admin/screens/InvoicesScreen.tsx:70`).
- **Modifier unit values and RVG base units are labelled demo-plausible, not an NZSA schedule**
  (`PROGRESS.md` decision 2026-07-22; on-screen copy on both master tabs).

## RFP tensions in this section, and the choice made

| Tension | RFP lines | Resolution in the prototype | Decision ref |
|---|---|---|---|
| Billable Party route: "No Contract applies" vs Method 3's "a Billable Party, Hospital, or Insurer must hold a Contract that explicitly permits an individually-arranged structure" | 616-617 vs 1163-1165 | Contract is **optional** on that route (`domain/billing/invoiceBuild.ts:173`, test `invoiceBuild.test.ts:155`); a billable-party-held contract exists only to carry `permitsIndividualArrangement`, gating rate x time capture (`domain/types.ts:195-199`, seeded `CT-ARIA-HOURLY`, `store/billingRun.test.ts:206`) | `REQUIREMENTS.md` §11 "billable-party contract nullability"; B2; `PROGRESS.md` 2026-07-22 fifth review #1/#2 |
| "Contract is looked up by counterparty ... not by any other dimension" vs "the hierarchy of selection ... should allow for both individual contracts and organisational contracts" | 669-670 vs 1151-1153 | `selectContract` filters on holder + effective date, then ranks an individual-anaesthetist-scoped contract above an organisational one, and a negotiated one above the protected default (`domain/billing/contracts.ts:29-59`, tests `contracts.test.ts:31,41,51`). All seeded contracts remain organisational, as the RFP states is true today | `PROGRESS.md` 2026-07-22 fifth external review, ruling #3 (recorded in the `contracts.ts` docblock) |
| Same-counterparty procedures "billed together on a single invoice" vs Split Billing's "two separate invoices must be generated" | 672-675 vs the Split Billing section | Group by resolved counterparty; the two-invoice split-billing outcome arises because the additional procedure has a different funder (per-line `funderOverride`), tested both ways (`invoiceBuild.test.ts:225` and `:244`, `store/billingRun.test.ts:244,259,292`) | `REQUIREMENTS.md` §11 "split-billing invoice count"; B6 |
| "Various rules apply depending on the nature of the contract" for multiple procedures | 677-678 | One labelled reading: a Type 3 additional procedure takes a fixed price only from an ordinal-keyed row, otherwise it falls to the BTM path where the time-only rule applies (`domain/billing/fee.ts:199-224`, tests `fee.test.ts:130,142`) | `PROGRESS.md` decision 2026-07-22 "Type 3 second-procedure fallback (demo reading)"; carried forward as handoff item 2 (P2) |
| The Insurer route's rate is "governed by the Contract held for that Insurer", but the only insurer contract that exists is a Type 1 default | 620-622, 739-741 | Built literally: nib holds a default Type 1 and the insurer route resolves it, so nib bills at standard rates (`invoiceBuild.test.ts:148`; nib invoice AA-2026-0003 in `a8-06-invoices-mixed.png`). Whether the route eventually needs its own rate structure is carried as an open question for AA, not solved | `REQUIREMENTS.md` §11 "Pure discovery items" (insurer rate structure) |
| Is the Hospital route final once resolved, or does non-payment fall back to the Billable Party? | implicit in 601-613 | Not solved. The route is set explicitly and stays set; no fallback path exists in the engine | `REQUIREMENTS.md` §11 "Pure discovery items" (hospital-route non-payment fallback) |

## Beyond the RFP

- **The default-Type-1 guarantee is a store invariant, not a convention.** It is created atomically
  with the counterparty (`store/mastersActions.ts:49-163`) and defended on every edit path
  (`store/contractActions.ts:28-30,111-119,157`): the default cannot be deleted, end-dated,
  forward-dated, retyped or moved to another holder, and the admin UI shows the lock with an
  explanatory banner (`apps/admin/flows/ContractEditSheet.tsx:150`).
- **Scoped exactly as the RFP scopes it.** Surgeon-, group- and organisation-held contracts carry
  **no** mandated default, so an expired one is a genuine per-card billing exception surfaced in the
  billing monitor rather than a silent fallback (`domain/billing/invoiceBuild.ts:140-146`,
  `store/billingRun.test.ts:331`). This turns the RFP's fine print into a demonstrable failure case.
- **Contract effective dating** with resolution against the **List (service) date**, so a contract
  renegotiated after the fact cannot retro-price an old list (`domain/billing/contracts.ts:22-25`,
  `invoiceBuild.ts:133`), plus snapshot immunity after billing (`store/billingRun.test.ts:367`).
- **Per-line funder override** (`BillingLine.funderOverride`) with a conservation rule, giving the
  RFP's one-procedure-two-funders split a real representation, plus an office allocation editor
  (`shared/flows/FunderAllocationSheet.tsx`, `store/billingLineActions.ts`).
- **Individual-anaesthetist contract scope** and the **`permitsIndividualArrangement`** gate, both
  future-proofing the RFP asks for but has no current instance of.
- **A contract-holder Organisation master** (M12) for the RFP's "held externally instead" case.
- **A visible master-data census.** The demo Data inspector shows live counts for every master
  collection (`demo-data.png`), which makes "all eleven tables are real" checkable on screen in one
  glance rather than asserted.
- **Typed price override** (fixed fee / $ adjustment / % adjustment) with a mandatory reason,
  snapshotted onto the invoice as a visible deduction line (`a-05-override.png`,
  `store/billingRun.test.ts:351`) - the RFP asks only that designs "allow for" this.
