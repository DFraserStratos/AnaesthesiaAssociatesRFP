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
Schedule/Day (implicit — derive days from the horizon), List, Card, Procedure (add
`patientPaymentCategory?: 'selfFundedPostProcedure' | 'selfFundedPrepayment' | 'insuredReimbursement'`,
set only when `billingRoute = BillableParty` — the RFP's three patient categories, each with a
different expected payment workflow: post-procedure invoicing, pre-payment full/split, or
insured-patient-claims-back — distinct from the `Insurer` route, which is AA billing a
direct-claim insurer like nib itself), BillingLine,
Anaesthetist (per the RFP's master: **registration number as the ID**, name, **contact details**,
plus `unitValue`, GST period, `hpiId`, active flag), Hospital, Surgeon, Patient (NHI +
`hiddenInternalId`), Insurer, Contract (types 1/2/3, holderType, effective dates, and a
`scope` field — `organisation` today, `individualAnaesthetist` reserved: the RFP asks the
selection hierarchy to allow individual as well as organisational contracts) + ContractPrice
(**matching keys explicit**: contractId + optional rvgBaseCode + optional surgeonId + optional
procedureOrdinal — the RFP's "keyed by some combination of contract holder, surgeon, and/or
procedure type", with 2nd-procedure rules), ListStatus, PermanentList,
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
  billing line; start/handover times when RVG; billable party present when route=BillableParty).
  Returns structured failures (field + message) — the mobile UI will render these verbatim.
- **Tests**: tiered-time boundaries (exactly 2h, 2h01m, a 5h case), P1 absorption vs non-absorbing
  base, range base codes, each contract type, each override type, split billing, validation
  failure shapes, NHI both formats.

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
