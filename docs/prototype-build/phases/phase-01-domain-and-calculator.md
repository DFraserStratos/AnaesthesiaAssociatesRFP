# Phase 01 — Domain model & billing calculator

**Requirements covered:** D1–D9 (as types), B3 (calculator), parts of N5
**Depends on:** Phase 00.
**Estimated:** 1 session.

## Goal

The pure, React-free foundation: the complete typed domain model, the demo clock, NHI validation
for both formats, and the fully unit-tested BTM billing calculator. Nothing visual changes this
phase — the deliverable is `src/domain/` compiling strictly and a green Vitest suite that proves
the RFP's hardest business rules before any screen depends on them.

## Work items

### 1. Domain types (`src/domain/types.ts`)

Model exactly the entities in `Data-Model-and-Flow.html` §1–§2 (read it before writing types):
Schedule/Day (implicit — derive days from the horizon), List, Card (incl. an optional
**integration correlation ref** — `{sourceFeedId, externalAppointmentId}`, from the HL7 SCH
appointment ID (the RFP sample's `1661243`) or the FHIR Appointment identifier — how S13/S14/S15
updates locate the booking they modify: MSH-10 dedupes *messages*, this key correlates
*appointments*), Procedure (add
`patientPaymentCategory?: 'selfFundedPostProcedure' | 'selfFundedPrepayment' | 'insuredReimbursement'`,
set only when `billingRoute = BillableParty` — the RFP's three patient categories, each with a
different expected payment workflow: post-procedure invoicing, pre-payment full/split, or
insured-patient-claims-back — distinct from the `Insurer` route, which is AA billing a
direct-claim insurer like nib itself; also add an informational **`accRelated` flag** — it sources
W4's ACC column and the review's ACC-route advisory, since the RFP says ACC patients "are never
billed directly" yet ACC is otherwise "invisible to the billing engine" — and an optional
**`billingReference`** — the hospital's contract/approval reference noted with the booking, the
concrete object of the office's "reference completeness" sanity check), BillingLine (chargeBasis RVG | fixed | rate×time,
units/amount, description, and an optional **funder override** — when set, the line bills to that
counterparty instead of the Procedure's resolved route, which is how the RFP's
one-procedure-two-funders split is represented; a per-procedure conservation rule — line amounts
reconcile to the procedure fee — is validator-checked),
Anaesthetist (per the RFP's master: **registration number as the ID**, name, **contact details**,
plus `unitValue`, GST period, `hpiId`, active flag), Hospital, Surgeon, Patient (**`hiddenInternalId`
as the invariant key; `nhi` optional** — the RFP's integration requirements link records to an NHI
"where available", vs the schedule section's "unique identifier: NHI" (tension recorded in
REQUIREMENTS §11); validate the NHI whenever present), **BillableParty** (non-patient payer
override, most commonly a guardian paying for a minor: name, relationship to patient,
contact/billing details, its own `hiddenInternalId` — deliberately not a Patient row: guardians
hold no NHI, and the RFP treats "Patient and Billable Party records" as parallel classes),
Insurer, **ContractHolderOrganisation** (external groups that hold contracts, e.g. Canterbury
Orthopaedic Surgeons — the RFP's ACC contracts "held externally instead"), Contract (types 1/2/3,
holderType spanning hospital | insurer | surgeon | organisation | **billableParty** (the RFP:
"a Billable Party, Hospital, or Insurer must hold a Contract that explicitly permits an
individually-arranged structure" — the billableParty variant exists only for such
individual-arrangement contracts), a **`permitsIndividualArrangement` flag** (the Method 3 gate:
rate×time capture is offered only under a contract carrying it), effective dates, and a
`scope` field with **selection precedence**: `organisation` (all seeds today) or
`individualAnaesthetist` (+ `anaesthetistId`) — when both match, the individual-scoped contract
wins (the RFP: the hierarchy "should allow for both individual contracts and organisational
contracts"; "currently all contracts are at the organisational level")) + ContractPrice
(**matching keys explicit**: contractId + optional rvgBaseCode + optional surgeonId + optional
procedureOrdinal — the RFP's "keyed by some combination of contract holder, surgeon, and/or
procedure type"; in the prototype's curated set the RVG base code stands in for "procedure type"
— a labelled demo simplification, a real build may need non-RVG procedure identifiers — with
2nd-procedure rules), ListStatus, PermanentList (hospital, anaesthetist,
dayOfWeek, session, **`surgeonId` nullable** — the RFP says surgeon assignment is "usually
(approximately 80%) defined in the anaesthetist's Permanent List", though its design-principle-6
field list omits surgeon; reading recorded in REQUIREMENTS §11),
AnaesthetistAvailability, HospitalHoliday, RvgCode (`baseUnits` single or range, `absorbsModifiers`),
ModifierCode, AuditEntry, Invoice/InvoiceLine/BillingCase, XeroContact/XeroAccRec/XeroAccPay,
PaymentIn/Disbursement, IntegrationMessage. Billing/Xero/integration entities are typed now
(phases 08–11 fill behaviour) so the store shape never churns later.

### 2. Demo clock (`src/domain/clock.ts`)

`DEMO_TODAY` (2026-07-21 — the design mockups' content date) as the pinned origin; helpers `today()`, `advanceDays(n)` designed to be
driven by store state in Phase 02. All domain logic uses this, never the real date. Export date
helpers (horizon generation: `DEMO_TODAY − 14d … +4 months`) the seeder will need.

### 3. NHI validation (`src/domain/nhi.ts`)

Both formats per RFP Appendix 1: current AAANNNC (mod-24 numeric check digit) and new AAANNAX
(mod-23 alphabetic check digit). `validateNhi` (returns format + verdict + reason) and
`generateNhi(format, rng)` (the Phase 02 seeder needs valid fictional NHIs). Unit tests with
known-good and known-bad values for both formats, including wrong-check-digit cases each way.

### 3a. Ethnicity coding (`src/domain/nzhis.ts`)

A small **demo subset** of NZHIS Level 4 ethnicity codes (e.g. the well-documented Level 1 groups
— European, Māori, Pacific Peoples, Asian, MELAA, Other — each with 1–2 Level 4 codes) as a typed
lookup table, explicitly commented `// demo subset — not the authoritative HISO/Ministry of Health
code table`. `validateEthnicityCode(code)` returns a verdict + the human-readable group name.
`lookupNhi(nhi)` — a **simulated** patient lookup (canned, keyed by seeded NHIs; framed in its
call-site comment as "simulates the NHI FHIR API via the Digital Services Hub — no real network
call") returning `{ name, dob, ethnicityCode }` for the ad-hoc card-creation flow (Phase 03) to
consume. Unit tests: known ethnicity codes validate, an unknown code fails with a clear reason;
`lookupNhi` returns seeded data for a known NHI and a not-found result for an unseeded one.

### 4. Billing calculator (`src/domain/billing/`) — pure functions + Vitest

- `timeUnits(start, end)`: 1u/15min for the first 2 hours, 1u/10min from the third hour. **The RFP
  defines the tier boundaries but is silent on partial-interval rounding** — this is a genuine
  discovery question, not something to invent as fact. Implement round-UP-per-started-interval as
  a clearly labelled **assumption** (a named constant, e.g. `PARTIAL_INTERVAL_ROUNDING = 'up'`,
  with a comment stating it's unconfirmed and a UI surface — e.g. the demo control panel or a
  tooltip on the T stepper — noting "assumption: rounds up, to confirm with AA"). Record it in the
  PROGRESS Decisions log as an open discovery item, not a settled rule.
- `modifierUnits(codes, baseCode)`: refuses/zeroes P1 when the base code absorbs positioning;
  ASA maps AS1–AS4 to unit values; all modifier groups from the RFP table (PA1–5, A1–2, ASE,
  OB1–4, AI1, post-op).
- `feeFor(procedure, anaesthetist, contract)`: BTM total × the anaesthetist's own `unitValue`;
  contract type 2 agreed rate / % discount; type 3 fixed price (+ price-list lookup incl.
  2nd-procedure ordinal rules); rate×time billing lines; typed overrides (fixed / $ adj / % adj).
- `splitBillingUnits(procedures)`: procedures flagged `isAdditional` yield **time units only**.
- `validateCardForBilling(card)`: minimum-data rules (route resolved; RVG base code or a non-RVG
  billing line; start/handover times when RVG; billable party present when route=BillableParty;
  insurer present **and `acceptsDirectClaims`** when route=Insurer — the RFP: that route is "only
  available where that Insurer accepts direct claims from AA").
  Returns structured failures (field + message) — the mobile UI will render these verbatim.
- **Tests**: tiered-time boundaries (exactly 2h, 2h01m, a 5h case), P1 absorption vs non-absorbing
  base, range base codes, each contract type, each override type, split billing, **two-funder line
  allocation conserves the procedure fee** (and a non-conserving allocation fails validation),
  validation failure shapes (incl. Insurer route without an insurer / with a non-direct-claims
  insurer rejected), NHI both formats.

## Out of scope

Seed data, the Zustand store, persistence, any UI (all Phase 02+). No React imports anywhere in
`src/domain/` — enforce with an ESLint rule or a comment-pinned convention.

## Manual test checklist

- [ ] `npx vitest run` green with the full calculator + NHI + ethnicity/lookup suites listed above present (not just passing — actually covering the named cases).
- [ ] `npm run build` green; `src/domain/` contains no React/DOM imports.
- [ ] Spot-check by hand in a scratch test: a 2h30m case at $30/unit with base 10 + AS3 computes to the value you calculate on paper ((10 + 8+3 + 3) × 30 — verify the T maths).
- [ ] The Decisions log records the time-rounding rule and any type-level readings of RFP ambiguities.

## PROGRESS.md updates

Status row → DONE with date; Phase 01 entry; Decisions log entries for rounding + ambiguity readings.
