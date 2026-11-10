# Phase 18 · Parties and flat Contracts

**Requirements covered** (status and grade at catalogue `efe123c`):
[US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md) Typical Contract arrangements (Verify; **Contradicts**: Type 1/2/3, holder types, scope and a protected default Type 1 per hospital and insurer, where the catalogue has one flat Contract shape),
[US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) Create, edit and disable Contracts (Verify; **Contradicts**: effective dates, hard delete, the type editable after creation, no Active or holder filter),
[US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) AA identifier for every Contract (Verify; Missing: a unique AA code and a holder reference code),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) Parties (Verify; **Contradicts**: no Party record, no billing details or delivery, an Insurer master with the dropped direct-claims flag),
[US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) Holder, who is billed, and where a Contract is offered (Verify; **Contradicts**: who is billed follows the billing route; no bills-holder-or-payer setting, no surgeon links);
[DM-48](../analysis/domain-model-delta.md#dm-48) (the Party master),
[DM-07](../analysis/domain-model-delta.md#dm-07) (the flat Contract);
[RV-06](../analysis/reverse-check.md#rv-06-protected-default-type-1-contract-per-hospital-and-direct-claim-insurer-auto-created-and-used-as-a-fallback) (the protected default Type 1s),
[RV-32](../analysis/reverse-check.md#rv-32-contracts-carry-effective-dates-and-can-be-deleted-an-expired-contract-falls-back-or-fails-billing-the-s4-beat-depends-on-it) (effective dates, delete, the S4 beat that ends a Contract),
[RV-37](../analysis/reverse-check.md#rv-37-review-flag-acc-should-not-bill-the-patient-directly) (the ACC review flag),
[RV-39](../analysis/reverse-check.md#rv-39-insurer-master-with-an-accepts-direct-claims-flag-an-insurer-billing-route-gated-on-it-and-delivery-hard-wired-by-insurer) (the Insurer master and its flag; FT-11.4, US-11.4.1 and US-11.4.2 Retired).

**Left this phase on 2026-11-10:** [DM-49](../analysis/domain-model-delta.md#dm-49) goes to **18a**
(the open-price fallbacks complete it; this phase still stores No contract · RVG under RV-06), and
FT-04.1 is now a grouping (its substance is in the stories above). With the 5 November flat model
(Donald's D1 to D11, built as decided, not yet confirmed by AA or Greg) the dated version records,
"New version", Retire, the version module and OQ-131's provisional default are **not built**:
US-04.2.10, US-04.1.6 and US-04.2.4 are Retired.

**Carried across without regression** (they Match today only through the old model; parity proves
each): [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) (a fixed rate:
Type 2's `agreedUnitRate` becomes the RVG-at-the-Contract's-rate kind),
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) (a fixed price: today's
`ContractPrice` rows stay as the fixed-price interim until 19a),
[FT-05.5](../../../../requirements-board/requirements/stories/FT-05.5.md) and
[US-05.5.1](../../../../requirements-board/requirements/stories/US-05.5.1.md) (ACC priced as an
ordinary Contract; the ACC funding tag is 18a's).

**Questions** (ROADMAP owner decisions; keep each reading in one place and log it for the owner):
- **Answered, built as answered:** [OQ-131](../../../../requirements-board/requirements/questions/OQ-131.md)
  (D77: no versions and no lines; each priced item its own Contract, edited in place and audited; a
  setting that must change from a date is a new Contract, the old one disabled),
  [OQ-105](../../../../requirements-board/requirements/questions/OQ-105.md) (D48: one Contract linked to
  any number of surgeons, never rooms), [OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md)
  and [OQ-117](../../../../requirements-board/requirements/questions/OQ-117.md) (D30, D65, D50 extended:
  the override exists only on RVG kinds, so never on a fixed price or a prepaid Contract; refused here),
  [OQ-107](../../../../requirements-board/requirements/questions/OQ-107.md) (D50: the override setting is
  AA's, per Contract; 24 acts on it), [OQ-25](../../../../requirements-board/requirements/questions/OQ-25.md)
  (D64: prepaid a setting, fixed for the Contract's life; 27 acts on it),
  [OQ-66](../../../../requirements-board/requirements/questions/OQ-66.md) (D16: a unique AA code; the
  step rail's typing search is 20's), [OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md)
  (D17: each Contract bills its holder or the payer; stored here, acted on by 21),
  [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (No contract · RVG the one
  built-in; the fallbacks beside it are 18a's), [OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md)
  (D42: office only). Moot: OQ-98 (D32), OQ-48 (D45 superseded). Not built: OQ-100 (D34, no upload).
- **At Confirm, built as its reading:** [OQ-73](../../../../requirements-board/requirements/questions/OQ-73.md)
  (D23: a prepaid Contract always bills the payer; labelled once in the editor, see work item 13).
- **Open, built as their defaults:** [OQ-114](../../../../requirements-board/requirements/questions/OQ-114.md)
  (D55's new default: delivery on the Party is email or post; no portal value, so nib's Party delivers by
  email; one `PROVISIONAL (OQ-114, D55)` doc comment on the type, no UI note),
  [OQ-133](../../../../requirements-board/requirements/questions/OQ-133.md) (D79: no list of affected
  Procedures; Procedures stay on the old Contract until someone moves them; nothing to label),
  [OQ-135](../../../../requirements-board/requirements/questions/OQ-135.md) (D81: no review flag; a
  Procedure on a Disabled Contract keeps it and bills as normal; nothing to label).
- **Our readings from the proposal** (AR-58 section 11.1; build them, one doc comment each in the model
  module, log them): a funder is a kind apart from an insurer (A42); a Party's billing details are
  required only once a Contract bills it (A43); AA- and anaesthetist-held Contracts bill the payer
  (A40); unlinked AA, insurer and funder Contracts are offered on every List (A38, A39); the pricing
  kind is fixed at creation (A36); the override seeded on No contract · RVG only (A18).

**Depends on:** Phase 17 (built: surgeon groups, `SG-COS` and its member surgeons, rooms). Built
before it: 14 to 17 and 28 to 32; the run order puts 32a, 32b, 38a and 32c before this phase, so take
the `PERSIST_VERSION`, List states and names you find.
**Estimated:** 2 sessions, with a cut line (see "Risks and the session cut line").

## Goal

Rebuild the Contract master to Donald's flat model of 5 November (D1 to D11 for the build;
[AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md) sections 2.1 to 2.3, 5.5, 5.8
and 5.10; [AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md) `#party`, `#contract`,
`#pricing-kind`, `#linked-practitioners`, `#who-is-billed`). AR-28, AR-29 and AR-30 are Retired: never
build from them. This phase changes the shape and keeps every fee and counterparty.

- **The Party** (DM-48, US-04.1.5, [AR-44](../../../../requirements-board/requirements/artifacts/AR-44.md#contract-holder))
  replaces the contract holder: one shared record for anyone who holds Contracts. Its kind is `aa`
  (exactly one), `hospital` (pointing at the hospital master, required), `insurer`, `funder` (apart
  from insurer, A42), `surgeon` or `surgeonGroup`, or `anaesthetist`. It holds a short name (what
  lists show), a billing name, an email or postal address and how its invoices are delivered, email or
  post (D55; other outputs wait on OQ-114). The billing name, delivery and the contact that delivery
  needs are required only once a Contract bills it (A43). The Party is itself the billing record: no
  "is billed" setting and no billable-party link on it, and no practitioner link (links are on the
  Contract). AA's rooms are never a Party.
- **The Insurer master folds in** (RV-39): its `acceptsDirectClaims` flag, the Insurers tab, its
  "Turn on" and the default Contract it minted go. Each seeded insurer and funder becomes a Party;
  Organisation and Surgeon Group holders become surgeon-group Parties. Creating a Party creates no
  Contract.
- **The Contract is one priced item** (DM-07, US-04.1.1, [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md)
  2.2 and 2.3): a unique **AA code** from one generator (US-04.1.4) and an optional **holder reference
  code** (searchable, not unique, A23); a name; its holder Party; **who it bills**, its holder or the
  payer on the Booking (US-04.2.1; an AA- or anaesthetist-held Contract and every prepaid Contract
  bill the payer, A40 and D23); **linked practitioners** (any number of surgeons, at most one
  anaesthetist; required on a surgeon-, surgeon-group- or anaesthetist-held Contract; never on a
  hospital-held one); **prepaid** (fixed for life); one of **five pricing kinds**, fixed after
  creation (RVG at the anaesthetist's rate, RVG at the Contract's rate, RVG less a discount, fixed
  price, open price; the rate and discount are undated settings; open price only on 18a's system
  fallbacks, never chosen by the office, A3); the **override** setting, on RVG kinds only (D50
  extended); a **status**, Active or Disabled; and a system role for No contract · RVG. 18a adds
  specialties and the funding tag; 19a price ranges, the invoice description and the default RVG
  code.
- **Edited in place, audited, never deleted** (US-04.1.2, RV-32, D77): every create and edit of a
  Party or Contract, a disable and a re-enable included, is audited with values before and after
  (US-04.1.3's part; 25 shows the history). Disable replaces end dates, retire and delete: a Disabled
  Contract leaves the default Active list (and 20's step rail); a Procedure already on it keeps it and
  bills as normal (D81). A setting that must change from a date is a new Contract, the old one
  disabled, with no list of affected Procedures (D79).
- **Save guards in one place** (AR-58 5.10, items 1, 3 to 6 and 8 to 14 that this phase's fields
  reach): unique AA code; the rate above zero and the discount between 0 and 100; prepaid refuses an
  RVG kind, the override and billing the holder; the override only on an RVG kind (so never on a fixed
  price); the office never creates an open-price Contract; AA- and anaesthetist-held Contracts bill
  the payer; links where required, none on a hospital-held Contract, at most one anaesthetist; a Party
  billed by a Contract has its billing details; the prepaid setting and pricing kind are fixed after
  creation; a system Contract is never disabled and only its name and AA code change.
- **The Admin Contracts screen**: search over name, holder reference code and AA code (19a adds the
  invoice description and default RVG code), filters Active by default, by status and by holder
  Party; office only (D42). Hundreds of Contracts after 19a: search, never a bare flat list.
- **No contract · RVG** (RV-06, OQ-78), held by AA, system role, RVG at the anaesthetist's rate,
  override allowed, bills the payer, never disabled, replaces the protected default Type 1 per
  hospital and insurer: their auto-creation, protection and `invoiceBuild` fallback go. Each seeded
  default becomes its holder's own hospital- or insurer-billed RVG Contract at the same price and
  counterparty, so no fee moves.
- **The ACC review flag goes** (RV-37); the ACC chip, column and `accRelated` stay.
- **Interims, so no fee or counterparty moves:** today's `ContractPrice` rows price the fixed kind
  until 19a; the billing route still decides the counterparty until 20 and 21, through one interim
  helper from a Party to today's counterparty record; the Method 3 gate (`permitsIndividualArrangement`)
  stays until 24.

**One place.** The Party and Contract types and every rule about them (save guards, the AA code
generator, the search matcher, the link rule, the No contract · RVG lookup, the pricing-kind reads,
the interim counterparty helper) live in `aa-prototype/src/domain/billing/contracts.ts` (split into
`parties.ts` beside it if it grows), behind types the UI reads; doc comments name AR-58's fields and
mark ours (`codePrefix`, `legacyCounterparty`, `permitsRateTime`).

## Risks and the session cut line

- **Rewrite, not trim.** The holder model ("is billed", billable-party link, practitioner link on
  the holder), dated versions and Retire from the 2026-11-04 plan are superseded; build none of them.
- **Breadth:** about 10 non-test files read `holderType` and 26 touch `governingContractId` or
  `billingRoute` (the route stays until 20). The parity fixture on every S3 to S5 figure and
  counterparty is the guard.
- **Readings to label once:** D23 (prepaid bills the payer), A42 (funder a kind of its own), A43
  (billing details once billed). Log each.
- **Not here:** specialties, funding tags and the open-price fallbacks are 18a's, so until then a
  hospital-billed Contract has no tag.
- **Bump `PERSIST_VERSION`** in each session that changes the seed's shape.
- **Cut line (2 sessions).** **Session 1:** the parity baseline; the Party type, guards and store;
  the seeded holders, insurers and funders migrated into Parties (the Insurer master, its flag and
  "Turn on" gone, RV-39); today's Contracts re-pointed at their holder Party (type 1/2/3 and dates
  still in place); the Admin Parties tab and editor; green with the parity fixture matching unchanged.
  **Session 2:** the flat Contract (AA code, holder reference code, who it bills, links, prepaid,
  pricing kind, override, status), its save guards and audit, the fee and resolver on the new shape,
  the Admin Contracts screen and editor with search and filters, No contract · RVG replacing the
  default Type 1s (RV-06), the billing-failure demo re-based, the ACC flag gone (RV-37), copy and the
  demo guide. If session 1 runs long, stop green after work item 5 and start session 2 at item 6.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `efe123c` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-04.1.1,US-04.1.2,US-04.1.3,US-04.1.4,US-04.1.5,US-04.2.1,US-04.2.2,US-04.2.14,US-04.2.18,US-04.3.2,US-04.3.3,US-04.3.8,US-04.3.9,US-05.2.5,US-05.2.6,US-05.4.2,US-05.4.3,US-05.5.1,US-06.4.1,US-11.2.2,OQ-25,OQ-66,OQ-67,OQ-73,OQ-78,OQ-91,OQ-96,OQ-105,OQ-107,OQ-114,OQ-117,OQ-131,OQ-133,OQ-135
   ```

   Read any hunks for the covered items, the context stories (pricing kinds US-04.2.2, price lists
   US-04.2.14, holder reference code US-04.2.18, the step rail US-04.3.8 and US-04.3.9, No contract ·
   RVG US-04.3.3, the office price change US-05.4.2, the payer US-11.2.2) and the questions, plus the
   Party and Contract parts of `requirements-board/requirements/domain-model.md`. At the 2026-11-10
   plan update (`a68f09b..efe123c`) the 5 November flat model rewrote every covered story (change log
   `requirements-board/requirements/changes/2026-11-05-flat-contract-model-and-ben-vanessa-meeting.md`);
   this doc is written from it.
   - If an item changed, re-read it and adjust the work items before building.
   - If an item is now Retired or Future, drop it and say so in PROGRESS.
   - A new item that touches the Party or Contract record joins only if it is shape-only:
     specialties and tags are 18a's, ranges 19a's, the rail 20's, who is billed 21's, prices 24's.
2. **OQ-73 (D23, at Confirm).** If confirmed, drop the editor's one "awaiting confirmation" helper; if
   reopened for a holder-billed prepaid Contract, relax that one guard.
3. **OQ-114, OQ-133, OQ-135 (open).** If OQ-114 names other outputs, extend the one `deliveryMethod`
   type and hand the values to 22. If OQ-133 asks for a list, it is a read-only query (hand it to
   19a). If OQ-135 asks for a flag, it is one entry in 21a's list (hand it on); nothing here changes.
4. **AA and Greg's confirmation of D1 to D11.** If AA or Greg reverse a decision before you start,
   stop and record it; do not build around it.
5. **Read the PROGRESS entries of 17, 32a, 32b, 38a and 32c**: `SG-COS` and its member surgeon ids,
   whether `ContractHolderOrganisation` and `masters.organisations` still exist, and the
   `PERSIST_VERSION` you start from.
6. **Capture the parity baseline** (work item 1) before any edit to `types.ts`.

## Reference

**Design (convention 17):** `docs/design/Design Language.dc.html` (tokens, tint and on-tint pills, mono
tabular-nums for codes and money, teal the only action colour, crimson identity only);
`docs/design/Admin Review.dc.html` (admin table and side-panel anatomy; its CONTRACT field is how a
Contract is named on a Booking); `docs/design/Admin Day.dc.html` (admin chrome). No mockup covers
Master data: extend the admin's own table, panel and pill patterns, with a wide desktop side panel.

**Catalogue:** the covered stories; `domain-model.md` (Party, Contract, No contract · RVG); OQ-73,
OQ-114, OQ-131, OQ-133, OQ-135 and the answered questions above. Evidence:
`npm --prefix requirements-board run source -- --item <ID> --text` (Node 22.18 or newer), chiefly the
2026-11-05 notes (Donald's contract model decisions; the AA meeting with Ben and Vanessa).

**Artifacts:** [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md) (the proposal
snapshot: 2.1 Party, 2.2 Contract, 2.3 pricing kinds, 5.5 built-ins, 5.8 who may change what, 5.10
validation, 8.2 naming and codes, 11.1 assumptions; the working copy
`docs/prototype-build/contract-model-proposal.md` gives the reasoning);
[AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md) (the flat ERD: `#party`,
`#contract`, `#pricing-kind`, `#linked-practitioners`, `#who-is-billed`);
[AR-44](../../../../requirements-board/requirements/artifacts/AR-44.md) (`#contract-holder`,
`#holder-setting`, `#arrangements`, `#billable-party`; read with AR-58 where they differ, AR-58 wins).

**Analysis:** `gaps.json` entries for DM-48, DM-07, RV-06, RV-32, RV-37, RV-39 and the five stories
(evidence lines there); [domain-model-delta.md](../analysis/domain-model-delta.md) DM-48, DM-07 (DM-49
for 18a's context); [reverse-check.md](../analysis/reverse-check.md) RV-06, RV-32, RV-37, RV-39;
[epics/EP-04.md](../epics/EP-04.md).

**Code entry points** (check the lines you find):
- `domain/types.ts`: `Insurer` (`acceptsDirectClaims`), `ContractHolderOrganisation`,
  `ContractHolderType`, `ContractScope`, `ContractType2Detail`, `Contract`, `ContractPrice`,
  `CounterpartyRef`.
- `domain/billing/contracts.ts` (`isEffectiveOn`, `rank`, `selectContract`, `matchContractPrice`),
  `fee.ts` (the `type === 2` and `type === 3` branches), `invoiceBuild.ts` (`HOLDER_LABEL`,
  `defaultContractFor`, `resolveContractForProcedure`, `counterpartyForProcedure`),
  `validateBookingForBilling.ts` (the Insurer route gate, `feeContextFor`, the rate x time gate),
  `fixtures.ts` (`mkContract`).
- Seed: `seed/contracts.ts` (`CONTRACT`, `defaultType1`, `CONTRACTS`, `CONTRACT_PRICES`),
  `seed/cast.ts` (`HOSPITALS`, `INSURERS`, `ORG`, `ORGANISATIONS`, `SURGEON_GROUPS`, `BP`),
  `seed/bookings.ts` (`DEFAULT_CONTRACT_BY_HOSPITAL` and the stored `governingContractId`s),
  `seed/index.ts` (masters, counters, scenario markers naming "Type 2" and "Type 3").
- Store: `contractActions.ts` (`isProtectedDefault`, `createContract`, `editContract`,
  `deleteContract`, the price-row actions), `mastersActions.ts` (`createHospital` minting a default,
  `setInsurerDirectClaims`), `mutate.ts` (id formats; `PT` is the patient prefix, so Parties use `PY`),
  `selectors.ts` (`counterpartyName`), `billingRun.ts` (`markInvoiceEmailed`, the insurer-kind
  refusal: 22's), `appStore.ts` (`PERSIST_VERSION`).
- Admin: `screens/masters/MasterData.tsx` and `ReferenceViews.tsx` (`ContractsView`, `InsurersView`,
  `OrganisationsView`, the Hospitals "default Type 1" copy), `flows/ContractEditSheet.tsx`,
  `screens/BillingMonitorScreen.tsx` (`resolveAndRetry` un-end-dating a Contract),
  `reviewFlags.ts` (the ACC flag).
- Shared: `flows/{EditBillingSetupSheet,ManualBookingForm,EditProcedureSheet}.tsx` (the
  governing-contract and insurer selects), `booking/OfficeBillingSetup.tsx`, `capture/feeContext.ts`,
  `audit/fieldLabels.ts`, `audit/auditNarrative.ts`, `demoTriggers/registry.ts` (`billing-failure`).
- Demo: `apps/demo/DemoControlPanel.tsx`, `DemoData.tsx`; `visual/admin-phase07.spec.ts` ("default
  Type 1").
- Tests reading the old fields: `domain/billing/{contracts,fee,invoiceBuild,validateBookingForBilling,prePaymentInvoice}.test.ts`,
  `domain/seed/seed.test.ts`, `store/{billingRun,billingRetry,mastersActions,intake,prepayment,bookingActions}.test.ts`,
  `shared/demoTriggers/demoTriggers.test.ts`, `apps/admin/reviewFlags.test.ts`. There is no
  `contractActions.test.ts` yet; create it.

## Work items

### Session 1: Parties

1. **Parity baseline first** (`domain/billing/feeParity.test.ts`, new), written and green before any
   model change. For every seeded procedure: `feeFor(...).total`, `lines` (basis, amount) and
   `billableUnits`, built as the app builds them (List date, stored Contract); for every seeded Booking:
   the `buildInvoicesForBooking` draft totals per counterparty (kind and id). Amounts, units, bases and
   counterparties only. Fixture `domain/billing/__parity__/phase-18-baseline.json` via
   `toMatchFileSnapshot`; only the context-building code may change after, never the fixture; never
   `-u`. Pin explicitly: SXAP $26.50 per unit, Health NZ $23, St George's ACC $25, COS ACC $24, the S3
   Holt and Prentice figures as they stand, the bariatric $2,800 and second-procedure $950, Aria
   3.0 h x $480 = $1,440.
2. **The Party** (`domain/types.ts` re-exporting from the model module; AR-58 2.1, AR-61 `#party`).
   - `PartyId` (seed `PY-...`, allocated `PYN-nnn`). `Party`: `id`, `kind: 'aa' | 'hospital' |
     'insurer' | 'funder' | 'surgeon' | 'surgeonGroup' | 'anaesthetist'`, `name`, `codePrefix` (ours:
     the AA code prefix, 2 to 6 capitals, unique, for example `CES`, `NIB`), `billingName?`, `email?`,
     `postalAddress?`, `deliveryMethod?: 'email' | 'post'` (`PROVISIONAL (OQ-114, D55)` doc comment),
     `hospitalId?` (hospital kind only, required there), and `legacyCounterparty?: CounterpartyRef`
     (ours, INTERIM until 21: the record today's invoices go to, so counterparties and Xero contacts do
     not move).
   - Pure guards `partyRefusal(party, { parties, billedByAContract })`: a hospital Party names a
     hospital that is not AA's rooms; exactly one `aa` Party, never created or re-kinded; unique
     `codePrefix`; once billed by a Contract, a billing name and a delivery method, with an email for
     email and a postal address for post (A43); the kind fixed once the Party holds a Contract. One
     sentence each, single-sourced.
   - `routeCounterpartyForParty(party)`: `legacyCounterparty`, else a hospital Party's hospital, else
     undefined (a plain billing exception at run time, never a throw). Reads no billing setting; 21
     deletes it.
   - Tests for each guard and the helper.
3. **Seed the Parties** (`seed/parties.ts`, `masters.parties`; billing details and delivery email
   where a Contract bills them):
   - `PY-AA` Anaesthesia Associates (`aa`).
   - Hospitals St George's, Southern Cross, Forte Health, Christchurch Eye Surgery, Christchurch
     Public, each pointing at its hospital, billing name and email from the hospital record.
   - Insurers: nib (legacy `{ insurer, I-NIB }`, delivery email, D55), Southern Cross Health Society
     and AIA Health (legacy `I-AIA`), neither billed. Funders: ACC, Health NZ, NZDF, Veterans Affairs,
     holding nothing (18a's tags point at them).
   - Surgeon groups: Canterbury Orthopaedic Surgeons (legacy `{ organisation, O-COS }`), Aria Skin and
     Laser Clinic (legacy `{ billableParty, BP.ariaClinic }`), Unisports Ortho (the S5 Beat 4 rate),
     Merivale Plastic Surgery (no Contracts; 19a seeds them).
   - Surgeon: Mr P. Doyle (legacy `{ surgeon, S-DOYLE }`). Anaesthetist: Dr Melanie Souter (no
     Contracts; 19a's price list).
   - `INSURERS` loses `acceptsDirectClaims`; `masters.insurers` and `masters.organisations` stay only as
     the interim identities a Party's `legacyCounterparty` and `Procedure.insurerId` point at (no view,
     no flag; 20 and 21 retire them).
4. **Re-point today's Contracts and fold in the Insurer master** (shape only; types 1/2/3 and dates
   stay until session 2).
   - `Contract.holderType` and `holderId` become `holderId: PartyId`; `ContractHolderType` and
     `ContractScope` go (every seeded scope is organisational). `HOLDER_LABEL` reads the Party's kind;
     `defaultContractFor` finds a hospital's or insurer's default by its Party; the contract-holder
     route bills `routeCounterpartyForParty` of the resolved Contract's holder.
   - RV-39: `setInsurerDirectClaims`, the Insurers tab and its "Turn on" go; the Insurer route's gate
     asks that the Procedure's insurer has an insurer Party (one sentence); the three insurer selects
     list insurer Parties. `markInvoiceEmailed`'s insurer-kind refusal and the portal queue are 22's.
   - `createHospital` also creates its hospital Party (it still mints the default until item 9).
   - Re-express the tests that read the flag (`validateBookingForBilling.test.ts`, `intake.test.ts`:
     "an insurer with no insurer Party is refused").
5. **Store and Admin Parties** (`store/partyActions.ts`; `apps/admin/flows/PartyPanel.tsx`; a
   "Parties" tab in Master data replacing Insurers and Organisations; run the frontend-design skill
   first).
   - `createParty`, `editParty`: office only, through `mutate()`, audited with before and after,
     refusing every `partyRefusal`; the `aa` Party is read-only; no delete.
   - Table: Name, Kind ("Hospital", "Insurer", "Funder", "Surgeon", "Surgeon group", "Anaesthetist"),
     Billing name, Delivery ("Email" or "Post"), Contracts (active count, a link to the Contracts list
     filtered to it). Panel: name, kind (with the hospital picker for a hospital), billing name, email,
     postal address, delivery; the missing-details refusal shown with the store's sentence once a
     Contract bills it. Hooks `data-shot="parties"`, `data-shot="party-panel"`.
   - Bump `PERSIST_VERSION`. Re-green: `npx vitest run` (parity fixture unchanged), `npm run build`,
     `npm run build:pwa`. End of session 1: PROGRESS IN PROGRESS with what remains.

### Session 2: flat Contracts

6. **The flat Contract** (AA code, holder reference code, who it bills, links, prepaid, pricing kind,
   override, status; AA code from one generator).
   - `Contract`: `id`, `aaCode`, `holderReference?`, `name`, `holderId`, `billsTo: 'holder' | 'payer'`,
     `linkedSurgeonIds: SurgeonId[]`, `linkedAnaesthetistId?`, `prepaid`,
     `anaesthetistMayOverridePrice`, `pricing: { kind: 'rvgAnaesthetistRate' } | { kind:
     'rvgContractRate'; unitRate } | { kind: 'rvgDiscount'; discountPct } | { kind: 'fixed' } | { kind:
     'open' }` (19a adds `ranges` to `fixed`), `status: 'active' | 'disabled'`,
     `systemRole?: 'noContractRvg'`, and `permitsRateTime` (INTERIM: today's
     `permitsIndividualArrangement`, the Method 3 gate, until 24). `type`, `isDefault`, the effective
     dates and `type2Detail` go. `ContractPrice` stays unchanged as the fixed kind's interim rows
     (19a replaces it).
   - Pure helpers in the model module, Vitest-covered: `contractRefusal(next, { prev?, parties,
     contracts, actor })` (the Goal's save guards, one sentence each, typed codes); `nextAaCode(prefix,
     existingCodes)` = `<prefix>-<nnn>`, the next free number per prefix over every Contract (nothing
     is deleted, so nothing is reused; 18a may add a tag segment); `contractMatchesQuery` and
     `contractSearch(query, { contracts, parties, filters })` over name, holder reference code and AA
     code, case- and space-insensitive, with the Active (default), Disabled or All and holder
     filters; `noContractRvg(contracts)` by `systemRole`, asserting exactly one; `isRvgKind`;
     `linkFits(contract, holder, { hospitalId, surgeonId, anaesthetistId })` (US-04.2.1: a
     hospital-held Contract only on its hospital's Lists; a linked one on its surgeons' or
     anaesthetist's; an unlinked AA, insurer or funder Contract everywhere; A38, A39), which 20's
     candidates call and nothing here does.
7. **Fee and resolver on the new shape** (fees unchanged).
   - `fee.ts` branches on `pricing.kind`: `rvgContractRate` prices at `unitRate`, `rvgDiscount` at the
     anaesthetist's unit value less `discountPct` (cents rounding as today), `fixed` through
     `matchContractPrice` over the interim rows, the RVG kinds otherwise. Keep `FeeResult`, the
     ordinal rule and the 2026-07-22 fixed-price fallback exactly; every `fee.test.ts` case keeps its
     expected number.
   - `resolveContractForProcedure`: the stored Contract resolves whatever its status (D81); a dangling
     id stays `contractMissing`. Nothing stored on the hospital or insurer route resolves, INTERIM
     until 20, to that Party's plain RVG Contract (one lookup, `interimRouteContract`), else
     `noContract`. A primary Procedure on a `fixed` Contract with no interim row for it is
     `contractIneffective` "No price in force for this procedure under <name>." (the interim of 19a's
     "no range in force"; the parity fixture proves no seeded Procedure reaches it). The ended-Contract
     fallback, `defaultContractFor` and the "protected default Type 1" message go.
   - `validateBookingForBilling`: the rate x time gate reads `permitsRateTime`; the same
     "No price in force" sentence.
   - `fixtures.ts`: `mkContract` defaults to a hospital-held, holder-billed RVG Contract; add
     `mkParty`.
8. **Seed in the flat shape** (keep every Contract id, so no `governingContractId` moves):
   - **No contract · RVG** (new `CT-NO-CONTRACT`, `AA-RVG`): AA, payer, RVG at the anaesthetist's
     rate, override on (A18), system role. It governs no seeded procedure.
   - **The six ex-defaults** become their holders' plain Contracts, `isDefault` gone: St George's RVG,
     Southern Cross RVG, Forte Health RVG, Christchurch Eye Surgery RVG, Christchurch Public RVG, nib
     RVG: RVG at the anaesthetist's rate, bills the holder, override off. Rename the seed constants
     (`stgDefault` to `stgRvg`) and `DEFAULT_CONTRACT_BY_HOSPITAL` to
     `PLAIN_RVG_CONTRACT_BY_HOSPITAL`; delete `defaultType1`.
   - **Rate Contracts** (RVG at the Contract's rate, bills the holder, override off): Southern Cross
     Affiliated Provider $26.50 (Southern Cross), Health NZ agreed rate $23 (Christchurch Public),
     ACC elective services via St George's $25, ACC orthopaedic services, Canterbury Orthopaedic
     Surgeons $24 (linked to `SG-COS`'s member surgeons, copied), Aria Skin and Laser Clinic hourly
     rate $26.50 with `permitsRateTime` (linked to the surgeon on its seeded Booking; log it),
     Unisports Ortho $93.47 (AR-58 8.3; linked to a seeded orthopaedic surgeon, log it; no Procedure on
     it).
   - **Fixed** (interim rows unchanged): Bariatric fixed prices, Mr P. Doyle (Doyle's Party, linked to
     Doyle, **bills the payer**, though the route still bills Doyle until 21; log it), rows `CP-BAR-1`
     to `CP-BAR-3` ($2,800, $2,400, ordinal-2 $950). Plus **COS ACC fixed fees** (new, Canterbury
     Orthopaedic Surgeons, linked as above, bills the holder, **no rows**): only the billing-failure
     demo points a Procedure at it (item 12); 19a gives it a range starting after 16 Jul 2026 so 20's
     "no range in force" holds (a 19a handoff).
   - Names drop "(Type n)"; scenario markers drop "Type 2" and "Type 3". AA codes from `nextAaCode` in
     seed order, `<codePrefix>-<nnn>` (for example `STG-001`, `COS-001`); pin the table in
     `seed.test.ts` with a uniqueness assertion. Holder reference codes stay empty until 19a. Nothing is
     prepaid; no seeded Contract breaks a guard (a seed test runs `contractRefusal` over all).
   - Id formats: `party: PY`, `contract: CTN` and `contractPrice: CPN` as today. Bump
     `PERSIST_VERSION`.
9. **Store** (`store/contractActions.ts`; office only, `mutate()`, audited before and after, refusals
   as data from `contractRefusal`).
   - `createContract`: the store stamps `aaCode` from `nextAaCode(holder.codePrefix)`; the office may
     not choose `open` or a system role.
   - `editContract` in place: name, AA code (unique), holder reference code, who it bills, links,
     the override and the rate or discount; `prepaid` and `pricing.kind` refused after creation;
     `disableContract` and `enableContract` (audited `contract.disable`, `contract.enable`), refused on
     a system Contract. **`deleteContract` is removed** with its tests and button.
   - No contract · RVG: only its name and AA code change.
   - `createHospital` no longer mints a Contract (RV-06); `isProtectedDefault` and its message go.
   - Tests (`contractActions.test.ts`, new; `mastersActions.test.ts` re-expressed): each guard on create
     and edit, the AA code stamped and unique, prepaid and kind fixed, disable and enable, no delete,
     a new hospital or insurer Party creating no Contract. Tests the new rules refuse are re-expressed,
     never loosened: `billingRun.test.ts`'s Health NZ end-date case and its protected-default case go
     with the dates; its "snapshot immunity" case edits Health NZ's rate in place after billing and
     proves the issued invoice unchanged; `billingRetry.test.ts` moves to item 12's path.
10. **Admin Contracts screen and editor** (`ContractsView`; `ContractEditSheet` rebuilt as a wide side
    panel; frontend-design skill first).
    - **List:** one search field "Search by name, code or AA code" with a result count
      (`data-shot="contract-search"`); filters Active (default), Disabled, All, and a holder Party
      select. Results under holder headings, No contract · RVG first under Anaesthesia Associates.
      Columns: AA code (mono), Name, Bills ("Holder" or "Payer"), Pricing ("RVG at the anaesthetist's
      rate", "RVG at $26.50 per unit", "RVG less 10%", "Fixed price", "Open price"), Prepaid and
      Override tags where set, Status pill (Disabled neutral). `data-shot="contract-catalogue"`.
    - **Editor:** AA code (mono, "Assigned on save" when new, editable after), name, holder reference
      code; Holder Party (searchable; fixed after save); "Bills" Holder or Payer (forced Payer and
      read-only for an AA- or anaesthetist-held or prepaid Contract, with D23's helper "A prepaid
      Contract always bills the payer, awaiting AA's confirmation."); Linked surgeons (multi-select)
      and Linked anaesthetist (one), hidden for a hospital holder; Prepaid and Pricing kind (rate or
      discount input beside it), both read-only after save with "Set when the Contract is created";
      "Anaesthetist may override the price" shown only on an RVG kind; Save (teal); "Disable" (error
      treatment) or "Make active". No Delete. No contract · RVG shows its fixed notice.
      Hooks `data-shot="contract-detail"`, `contract-settings`, `contract-links`.
11. **Office billing setup** (`EditBillingSetupSheet`, `OfficeBillingSetup`): the governing-contract
    select lists No contract · RVG first, then Active Contracts as "<AA code> · <name>" under holder
    groups; a Disabled one only when already selected, as "(disabled)". Narrowing by the Booking is
    20's step rail. The read view names "<AA code> · <name>".
12. **The billing-failure demo without dates** (RV-32; built default, logged; 25 re-bases it again).
    "Trigger billing failure" on `SEED_LIST_IDS.billingFailure` (Ropata Thu 16 Jul): submit if
    ACTIVE, then as the office point Losa Tuilagi's Procedure at COS ACC fixed fees through the
    ordinary office action, then authorise: her Booking fails with "No price in force" while Hemi
    Walker's sibling invoices. "Resolve & retry" no longer edits a Contract: for `contractIneffective`
    or `contractMissing` it opens the office billing setup to choose a Contract (here ACC orthopaedic
    services), then retries; check the edit is allowed on the failed, unbilled Booking of an authorised
    List and add only that narrow allowance, tested. Same label and place; new description. Re-express
    `billingRetry.test.ts` and the `demoTriggers` test on this path.
13. **ACC flag, copy, labels, tests.**
    - Delete review flag (c) "ACC should not bill the patient directly" and its test (RV-37); the ACC
      chip, the web Accounts ACC column, `accRelated` and the ACC pre-op help text stay.
    - `src/shared/contracts/labels.ts` (new, nothing admin-only, so the PWA purity test holds):
      `PARTY_KIND_LABEL`, `DELIVERY_LABEL`, `PRICING_KIND_LABEL`, `BILLS_LABEL`, `STATUS_LABEL`.
    - `fieldLabels.ts` and `auditNarrative.ts`: every new field narrated in English ("Rate changed from
      $93.47 to $95.00", "Disabled", "Bills the payer"); the type, holder type, scope, effective-date
      and `acceptsDirectClaims` labels go. A Contract's entries name it by AA code and name.
    - Master data: the Hospitals copy loses "default Type 1"; the Insurers and Organisations tabs are
      gone.
    - Grep `aa-prototype/src` rendered strings for "Type 1", "Type 2", "Type 3", "default Type 1",
      "protected default", "contract holder", "first party", "third party", "Effective to" and fix them
      (app copy says "Party", never "contract holder").
    - `DemoControlPanel.tsx`, `DemoData.tsx`: new names, S4 Beat 3's cause, S5 Beat 4's in-place edit.
    - `visual/admin-phase07.spec.ts`: update its assertions and shot; add shots of Parties, the
      Contracts list with a search, the editor's settings and the save-guard refusal.
    - No en or em dashes in new copy; no build-phase references in the UI.

## Demo triggers

This phase adds **no new button**: everything is a product action, and "Trigger billing failure" is
re-based in place.

| Trigger | Screen | Effect |
|---|---|---|
| Parties (product) | Admin, Master data, Parties | Create an insurer and a funder Party; it saves without billing details, and once a Contract bills it, saving it without a billing name or delivery is refused. No Insurers tab; creating a Party makes no Contract |
| "Disable" (product) | Admin, Master data, Contracts, Health NZ agreed rate | It leaves the default Active list and shows under Disabled; the Procedure already on it (Hemi Walker, Dr Whitaker's Fri 17 Jul List) keeps it and its invoice is unchanged; "Make active" restores it |
| Save guards (product) | Admin, Contracts, "New contract" | A prepaid Contract with an RVG pricing kind, or the override on a fixed price, is refused with the store's sentence; after save the pricing kind and prepaid are read-only |
| In-place edit with audit (product) | Admin, Contracts, Unisports Ortho | Rate $93.47 to $95.00 saved in place; Admin Audit shows the entry with before and after (25 adds the History tab) |
| "Trigger billing failure" (existing, re-based) | Admin, Billing monitor | Points Losa Tuilagi's Procedure at COS ACC fixed fees and authorises Ropata Thu 16: she fails with "No price in force", Walker's sibling bills; "Resolve & retry" asks the office to choose a Contract |

- **PWA:** none needed; the effects are Admin-only and mobile fees are unchanged.
- **15a's "Raise sample warnings":** no change; no warning rule is registered.

## Out of scope

Specialties, funding tags, surgeon specialties and the open-price fallbacks (18a). RVG groups (19).
Price ranges replacing `ContractPrice`, the invoice description, the default RVG code, holder
reference codes seeded, Merivale's and Souter's Contracts (19a). The step rail and its candidates
(calling `linkFits`), removing the route, the payment category and `Procedure.insurerId` (20). Who is
billed acting on `billsTo`, the payer on the Booking, the funder on the Booking (21). Delivery sent by
the Party's setting, the portal queue and `markInvoiceEmailed`'s insurer-kind refusal removed (22).
The override acting and the Method 3 gate's removal (24). The pricing snapshot and each Contract's
history tab (25). Prepayment from the prepaid setting (27). Loads of Parties and Contracts (42). Never
built: versions, Contract lines, staged changes, a schedule upload (D34).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence (ROADMAP.md "Owner
review: agents test themselves").

- [ ] Parties: every seeded Party shows its kind, billing name and delivery; nib "Email"; ACC, Health
      NZ, NZDF and Veterans Affairs as funders; Anaesthesia Associates read-only. No Insurers or
      Organisations tab. A new insurer and a new funder save with no billing details and create no
      Contract; a billed Party saved without its billing name, or with email delivery and no email, is
      refused; a hospital Party needs its hospital.
- [ ] Contracts list: No contract · RVG first; every row has a mono AA code matching the seed test;
      no "Type n", "default" or "contract holder" anywhere. Active by default; Disabled and All work;
      the holder filter narrows; `COS-001`, "affiliated" and "Unisports" each find their Contract; no
      match shows an empty state.
- [ ] Editor: a new Contract reads "Assigned on save" and gets the next code for its holder; prepaid
      with an RVG kind, the override on a fixed price, a surgeon-group Contract with no link, links on a
      hospital-held one and a holder-billed prepaid are each refused with one sentence; prepaid and the
      pricing kind are read-only after save; the D23 helper shows once on a prepaid Contract.
- [ ] Unisports rate $93.47 to $95.00: saved in place; Admin Audit shows before and after.
- [ ] Disable Health NZ agreed rate: gone from Active, shown under Disabled, Hemi Walker's invoice and
      fee unchanged; Make active restores it; No contract · RVG offers no Disable and the store refuses
      it.
- [ ] Adding a hospital, or an insurer Party, creates no Contract.
- [ ] Office billing setup: No contract · RVG first, then "<AA code> · <name>" under holder groups.
- [ ] Every seeded fee and counterparty unchanged (parity fixture matched): S3 figures, S5's Health NZ
      invoice, mobile (framed and PWA) and web Booking detail; the Aria rate x time line still adds on
      Souter's Mon 27 Booking.
- [ ] S4 Beat 3: "Trigger billing failure" fails only Losa Tuilagi's Booking; "Resolve & retry" opens
      the billing setup, choosing ACC orthopaedic services and retrying bills COS as the same
      organisation counterparty. No Contract is edited.
- [ ] Admin Review shows no ACC flag; the mobile ACC chip and web ACC column remain.
- [ ] `npm run shots` green; catalogue screenshots done (below), a full `npm run capture` with no failed
      recipe and the covered items' shots checked by eye; `npm run build`, `npm run build:pwa`,
      `npx vitest run` and `npm run verify:board` green.

## Demo guide updates

Patch these in the same session and mirror each in `docs/demo-guide/master-demo-guide.html`:

- **`04-presenter-cheat-sheet.md`, "Contracts":** replace the Type 1/2/3 lines, "protected default
  Type 1" and the surgeon-held fallback line with: every Contract is one priced item held by a Party (a
  hospital, insurer, funder, surgeon or surgeon group, an anaesthetist, or AA); it bills its holder or
  the payer on the Booking (a prepaid Contract always the payer); it has a pricing kind, an optional
  override on RVG kinds, prepaid or not, and is Active or Disabled; it is edited in place with an
  audit, never deleted, and a change from a date is a new Contract; No contract · RVG, held by AA, is
  always there; every Contract has AA's own code. Replace the "Direct Insurer route" line: "nib is an
  insurer Party; there is no insurer master or direct-claims flag." Tip: "find a Contract: type its
  name or AA code in the Contracts search."
- **`03-demo-script.md`:** **S5 Beat 4** becomes "Contract edits are audited": Admin, Master data,
  Contracts, search "Unisports", rate $93.47 to $95.00, Save; open Admin Audit. Say: a Contract is
  edited in place and every change is recorded with before and after; a change that must start on a
  date is a new Contract, and the old one is disabled, never deleted. Expected: the audit entry; no
  invoice changes. The S5 "Serves" line's "contract effective-dating" becomes "audited Contract
  edits". **S4 Beat 3:** the cause becomes "the Booking was pointed at a fixed-price COS Contract with
  no price for the procedure"; "Resolve & retry" becomes "choose the right Contract and retry". S3:
  figures unchanged; check its wording for "Type".
- **`01-personas-and-responsibilities.md`:** drop "ACC route warnings"; the "Direct-claim insurer" row
  becomes "Insurer: a Party; invoiced only where a Contract bills it".
- **`02-workflows-and-handoffs.md`:** drop "ACC advisory flags"; "Selects the governing Contract and
  rating method" becomes "Selects the Contract"; "direct-claim Insurer" becomes "an insurer Party".
- Control Panel scenario text and seed markers as in work item 13.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after
the review pass. Re-run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 18`
first. All shots are Admin, Master data.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md) Typical Contract arrangements | partial · admin-contract-types | `partial`, reason "Funding tags arrive in Phase 18a, price ranges in 19a and the invoice destination on the step rail in 20." Rename the shot `contract-settings` on `[data-shot=contract-settings]`: who it bills, pricing kind, prepaid and override, plus a second state with the prepaid-with-RVG refusal. Caption "Every arrangement is a Contract with the same settings: who it bills, its pricing kind, prepaid, and whether the anaesthetist may override" |
| [US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) Create, edit and disable Contracts | partial · admin-contracts, admin-edit-contract | `partial`, reason "A fixed price changes by a price range from Phase 19a." Re-shoot `admin-contracts` with the Active, Disabled, All and holder filters highlighted; `admin-edit-contract` on `[data-shot=contract-detail]` (Health NZ agreed rate) with Disable and no Delete highlighted; add a `disabled` state (the list under Disabled). Captions "Contracts filtered by status and holder; Active by default" and "A Contract is edited in place and disabled, never deleted" |
| [US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) AA identifier for every Contract | absent | `partial`, reason "Found by typing on the step rail from Phase 20; holder reference codes are seeded in 19a." Shots `aa-code` (the mono AA code column) and `search` (typing `COS-001` on `[data-shot=contract-search]`). Caption "Every Contract has AA's own unique code, searchable with its name" |
| [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) Parties | none (create it) | Create it, `captured`. Shots `parties` (`[data-shot=parties]`, Kind, Billing name and Delivery highlighted, nib and the funders visible) and `party-panel` (a hospital Party open: its hospital, billing name, email, delivery). Caption "Each Party holds its billing name, contact and how its invoices are delivered" |
| [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) Holder, who is billed, and where a Contract is offered | partial · admin-contract-holder | `partial`, reason "Who is billed acts in Phase 21; where a Contract is offered narrows the step rail in Phase 20; specialties arrive in 18a." Re-shoot `admin-contract-holder` on the COS ACC Contract's `[data-shot=contract-links]` (holder, Bills, linked surgeons highlighted); drop its scope states, and remove the two `assets/US-04.2.9/admin-contract-scope-*.png` entries from its `images` only, then `npm run check`. Caption "A Contract names its holder Party, whether it bills the holder or the payer, and the surgeons it is offered for" |
| [US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md) Contract audit | as found | No change here (Phase 25 owns it). |
| [FT-11.4](../../../../requirements-board/requirements/stories/FT-11.4.md), [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md), [US-11.4.2](../../../../requirements-board/requirements/stories/US-11.4.2.md) Insurers (Retired) | none; captured · insurers; captured · insured-reimbursement | `absent` on all three, reason "Retired: removed in Phase 18", no shots (create FT-11.4's recipe as absent) |

**Recipes this phase breaks:** `US-04.2.2` (24) and `US-04.2.5`: re-point row names and the "Agreed
unit rate" label to the new editor, keep state names, caption by pricing kind. `US-04.2.4`,
`US-04.1.6`, `US-04.2.10` (Retired 5 November), `US-04.4.1` and `US-04.2.9`: `absent`, reason
"Retired: the flat Contract model has no lines, versions or defaults". `US-04.3.2`: options become
"<AA code> · <name>"; the "Governing contract" highlight must still match. `US-04.3.3` (20): its
`default-contract` shots now show "St George's RVG"; caption accordingly. `US-05.2.5`, `US-04.2.3`,
`US-05.5.1`, `US-05.5.2`: "Type 3" becomes "fixed price". Recipes with a `billing-failure` setup step:
re-check shots and captions for the new cause. `US-13.4.1` and recipes opening Master data: the
Insurers and Organisations tabs are gone and a Parties tab exists; re-point whatever `--dry` fails on.

**ATLAS.md:** Party ids and Contract names and AA codes (`CT-NO-CONTRACT`, the COS fixed fees, Unisports),
seed notes (the billing-failure cause), overlays (the wide Party and Contract panels) and hooks
(`parties`, `party-panel`, `contract-catalogue`, `contract-search`, `contract-detail`,
`contract-settings`, `contract-links`; `contract-price-rows` kept).

## Adversarial review (after build)

After the checklist and a green build, before the PROGRESS entry: the standard review-and-fix pass
(PROGRESS convention 18) with four Opus lenses (quality, fee-maths and parity, store and lifecycle,
plan and catalogue adherence); verify each finding, fix the confirmed ones, re-green. Do not re-raise
anything settled in the Decisions log.

**Steer this phase's reviewers at:**
- **Parity is real:** the fixture predates the reshape and matches unchanged; recompute SXAP $26.50,
  Health NZ $23, St George's ACC $25, COS $24, the bariatric rows, Aria $1,440 by hand.
- **Who is billed did not move:** every seeded invoice keeps its counterparty kind and id; no billing
  path reads `billsTo`; `routeCounterpartyForParty`, `legacyCounterparty` and `interimRouteContract`
  are the only bridges, each labelled INTERIM.
- **Flat, not versioned (D77, RV-32):** no dates, versions, Retire or delete anywhere (code, copy,
  tests); edits in place, each audited with before and after; a Disabled Contract still prices and
  bills; `prepaid` and `pricing.kind` immutable even through a raw patch.
- **Guards in one place:** `contractRefusal` and `partyRefusal` are the only rule sources, applied by
  the store on every path, never only in the UI; no seeded record breaks one; the override exists only
  on RVG kinds; open price never chosen by the office.
- **No contract · RVG:** exactly one, found by `systemRole`, never disabled; the default Type 1s,
  their auto-create, protection and fallback gone, copy included.
- **No Insurer master (RV-39):** no `acceptsDirectClaims`, `setInsurerDirectClaims`, Insurers tab or
  insurer-created Contract; no portal value on the Party.
- **Readings labelled once:** D23 in one helper line; OQ-114, A42, A43 in one doc comment each; no
  other provisional text.
- **Copy and design:** "Party" in app copy; teal the only action colour; Disable in the error
  treatment; mono tabular-nums for codes and money; desktop panels; no en or em dashes; the PWA purity
  test holds; `PERSIST_VERSION` bumped.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry): D23 built as its reading; D55's default (email
  or post, no portal; nib by email); D79 and D81 defaults; A42 (funder apart from insurer), A43 (billing
  details once billed), A40, A38 and A39, A36, A18 (override seeded on No contract · RVG only); the
  AA code format (`<codePrefix>-<nnn>`) and the `codePrefix` field we added; Doyle's Contract set to
  bill the payer while the route still bills Doyle until 21; the Aria and Unisports links; the COS ACC
  fixed fees Contract and the re-based failure demo; the interim identities behind nib, AIA and COS;
  screens worth a look (Parties; Contracts with search, filters and Disable; the editor's guards; the
  Billing monitor failure), each with route and persona.
- **Catalogue screenshots result:** recipes created (US-04.1.5), filled (US-04.1.4), changed and
  re-pointed; `REPORT.md` counts before and after; the partial reasons handed on (US-04.1.1 to 18a,
  19a and 20; US-04.1.2 to 19a; US-04.1.4 to 19a and 20; US-04.2.1 to 18a, 20 and 21).
- **Status row:** Phase 18 (Parties and flat Contracts) DONE with the date, or IN PROGRESS after
  session 1 with what remains.
- **Phase entry:** the drift-check result against `efe123c`; the Party and AA code tables as seeded;
  the parity fixture path and result; `PERSIST_VERSION` old to new; the review pass; handoffs: **18a**
  (tags and specialties on the Contract; fallbacks by `ensureFallbacks`; any tag segment in
  `nextAaCode`), **19a** (ranges replace `ContractPrice` and the `fixed` interim; a range after 16 Jul
  2026 on COS ACC fixed fees; holder reference codes, invoice description and default RVG code join
  the search; Souter's and Merivale's Contracts on their Parties), **20** (candidates call `linkFits`;
  `interimRouteContract` and the route go), **21** (`billsTo` decides; `routeCounterpartyForParty`,
  `legacyCounterparty` and the insurer and organisation identities go; Doyle billed to the payer),
  **22** (delivery read from the Party; the portal queue and insurer-kind refusal go), **24** (the
  override acts; `permitsRateTime` goes), **25** (the History tab; the failure demo re-based again),
  **27** (prepaid acts), **42** (loads of Parties and Contracts).
- **Decisions log** (each names what it supersedes):
  - (a) **Supersedes "protected default Type 1 per hospital and insurer"** (3rd review #9, 7th review
    B14): one No contract · RVG held by AA; the seeded defaults are their holders' plain RVG Contracts;
    nothing is created with a hospital or an insurer.
  - (b) **Supersedes Contract effective dates and deletion** (the Phase 08 maintenance, the Phase 08
    build decision (1)'s ended-Contract fallback and its "$23 vs $28.50" test, the Phase 09 failure demo
    that ended COS ACC): Active or Disabled, edited in place with audit, never deleted (D77, RV-32).
  - (c) **Supersedes Contract types 1/2/3** (US-04.1.1): five pricing kinds fixed at creation; SXAP
    $26.50 and the 2026-07-22 fixed-price fallback kept.
  - (d) **Supersedes the holder's "is billed" and "Contract-holder placements (seed)" (2026-07-23):**
    the Party master; each Contract bills its holder or the payer; COS, Aria and Unisports surgeon
    groups, Doyle a surgeon, all linked on the Contract.
  - (e) **Supersedes the insurer master and its direct-claims flag** (RV-39; the 2026-07 insurer
    rulings, 6th review #2).
  - (f) **Supersedes the ACC review flag** (6th review #3, 7th review A5/B3): removed (RV-37).
  - (g) **The AA code** (US-04.1.4): `<codePrefix>-<nnn>` from one generator, editable by the office,
    unique.
