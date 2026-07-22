# Phase 02 — Seed data & store

**Requirements covered:** P5, P6, P10, D1–D7 (as live behaviour), N3, N4
**Depends on:** Phase 01.
**Estimated:** 1 session.

## Goal

The fake backend comes alive: a deterministic seeded dataset over the Phase 01 types, the Zustand
store with lifecycle guards and the append-only audit writer, localStorage persistence with reset,
the working demo clock, and a data inspector that makes it all demoable before any real screen
exists.

## Work items

### 1. Seed data (`src/domain/seed/`)

Deterministic (seeded RNG, e.g. mulberry32 — same seed → identical data), fictional, demo-credible,
and **matching the `Design/` mockups' cast and content date** (DEMO_TODAY 2026-07-21) so built screens
line up 1:1 with the design reference:
- **Masters:** the design's 14 anaesthetists — **Dr Melanie Souter (the anaesthetist demo persona)**, Rutherford, Sharma, Ngata, Beaumont, A. Chen, Ropata, Delaney, Fitzgerald, Hughes, Morrison, Whitaker, Ngatai, Strand — with distinct `unitValue`s (Souter $26.50/unit per the mockups; range $26–$42; one GST period other than monthly) and a fictional HPI identifier (`hpiId`) each, for Phase 11's FHIR bundles. Office persona: **Kirsty W.** 5 hospitals (STG, SX, Forte, CES, CPH) each holding a default Type 1 contract plus: one SXAP Type 2, one Health NZ Type 2, one ACC-via-hospital contract, one surgeon-held bariatric Type 3 with a price list incl. a 2nd-procedure rule, one **contract-holder organisation** — Canterbury Orthopaedic Surgeons (COS) — holding an externally-held ACC contract (the RFP's group-held case; non-hospital holders have no mandated default contract), and one contract with **`permitsIndividualArrangement`** (the RFP's Method 3 gate — an agreed hourly rate; exercised by the seeded rate×time card below); 10 surgeons (include the design's Hale, Patel, Whitford, Okafor, Lim, Doyle, Tan, Reid); NIB insurer (`acceptsDirectClaims` + default contract); 6 list statuses wired to the Phase 00 colour tokens; ~30 RVG codes across anatomical sites (≥2 range codes, ≥2 that absorb positioning — include the mockups' 47516 hip code, base 7); the modifier groups the RFP names (PA1–5, A1–2, AS1–4, ASE, OB1–4, P1, AI1, post-op) with unit values taken from the RFP's stated ranges where given — **these are demo-plausible values, not an authoritative NZSA fee schedule** (the RFP itself gives only example ranges, e.g. "PA1–PA5, 1–4 units", and says some figures are clinician judgement at billing time). Label the seed source as `// demo values within RFP-stated ranges — not sourced from an NZSA schedule` and flag it as a discovery item in PROGRESS: the real build needs AA/NZSA to supply the authoritative code and value tables.
- **Design-day fidelity:** on 2026-07-21 Souter has the mockups' day — St George's AM (Mr Hale, done/unbilled) and Southern Cross PM (Ms Patel, 4 cards: Tane ZBC1123 lap chole, Marsh ZAD2210 knee arthroscopy, Chen ZAE0311 hernia, Ellison ZAA0067 THR — the first three complete, Ellison's pending); her Fri 24–Sun 26 annual leave; Beaumont/Ngatai on holiday; Delaney unavailable (ICU call); Hughes free all day; Fitzgerald's PM flagged "surgeon TBC".
- **Permanent lists** sized to the RFP's figure: **~80% of surgeon-assigned Lists** derive from a Permanent List (the RFP's ~80% is the share of surgeon *assignments*, not of all sessions — free/leave/unavailable sessions sit outside the denominator); the rest are office-assigned ad-hoc. Each Permanent List carries its usual **surgeon** (`surgeonId` — this is how the ~80% derivation actually works; the picked reading of the RFP's permanent-list-surgeon gap, see REQUIREMENTS §11). **Hospital holidays** (≥1 upcoming, for Phase 06's conflict flags).
- **The canvas:** for every anaesthetist × every day in the horizon, exactly two Lists (AM/PM), populated from permanent lists + availability; every status colour represented; plenty left free. **At least one all-day booking** on `DEMO_TODAY` (the design's Rutherford/Forte Health/Mr Okafor pattern already fits: same hospital + surgeon on both his AM and PM Lists) — demonstrates the RFP's "all-day bookings simply use both lists" with no special entity, just two Lists sharing context.
- **Cards & procedures:** the past 2 weeks rich, thinning ~10 days out. Include the ready-made states later phases rely on: today's lists mid-capture (DRAFT with partial times), two SUBMITTED lists awaiting authorisation, a multi-procedure card for split billing, a **one-procedure-two-funders card** (its Procedure's BillingLines carry per-line funder overrides, conservation-checked — the office edits this allocation in Phase 06, Phase 08 bills it as two invoices), one **cancelled Card** (audited soft-cancel visible in a list that still submits cleanly), a card billed **rate×time** (an hourly-rate BillingLine under the individual-arrangement contract — RFP Method 3, captured in Phase 04, rated in Phase 08), a guardian-pays-minor case (the guardian as a typed **BillableParty** record — name, relationship, contact details, its own hidden internal ID — not a Patient row), one **provisional no-NHI patient** (arrived via the PDF pathway; renders "NHI pending" — the RFP's "linked to an NHI where available"), patients with **both NHI formats**, an informationally-noted insurer, an **`accRelated` procedure** billed via a hospital's ACC contract (W4's ACC column + the Phase 07 advisory need it), `billingReference` values on most contract-routed procedures with 1–2 **deliberately missing** (feeding Phase 07's reference-completeness flag), 2–3 repeat patients (for Xero dedupe later), and — on the Billable Party route — **all three RFP patient payment categories represented**: a `selfFundedPostProcedure` patient (plain post-op invoice), a `selfFundedPrepayment` patient (its Procedure carrying the typed prepayment detail — full or split + deposit amount, Phase 01's type; the Card-level flag derives from it — the pre-payment-required case Phase 09 exercises), and an `insuredReimbursement` patient (invoice addressed to the patient, who claims back from their own insurer — informational insurer name attached, NOT the direct-claim `Insurer` route). ~150 patients total, each with an **NZHIS Level 4 ethnicity code** from Phase 01's demo subset.

### 2. Store (`src/store/`)

Zustand slices: `schedule` (lists/cards/procedures + selectors by day/anaesthetist/state),
`masters`, `billing` (empty scaffold), `xero` (empty scaffold), `integrations` (empty scaffold),
`shell` (persona, active app — migrate Phase 00's shell state here if separate), `clock`, `audit`.

- **Lifecycle guards** (`src/store/lifecycle.ts`):
  - `completeCard` — sets the Card's Completed state, blocked unless `validateCardForBilling` passes. **Extension point for Phase 09:** this guard gains a second, later-added check — a `selfFundedPrepayment` card whose pre-invoice is unpaid also blocks completion here, liftable only by the office's audited `overridePrepaymentGate`. Design the guard so a second condition slots in without restructuring (e.g. a small ordered list of block-reasons, not a single boolean).
  - `submitList` — acts only on a **DRAFT** List; blocked unless **every non-cancelled Card is marked Completed** (the RFP rule: "a List cannot be marked SUBMITTED unless all its Cards are correctly completed"; validation gates completion, completion gates submission — validation alone is not enough).
  - `authoriseList` — acts only on a **SUBMITTED** List (transitions are strictly ordered — DRAFT can never jump straight to AUTHORISED); locks Cards immutable; emits a `listAuthorised` event Phase 08 will consume.
  - `cancelCard(cardId, reason)` — the **audited soft-cancel** (the legacy app's "Delete Card", modernised per the RFP's audit principle): sets the Card's `cancelled` state with a reason; the Card is retained and visible (struck-through/cancelled chip), excluded from completion/submission validation and from billing. Allowed to the anaesthetist on a DRAFT List, to the office on DRAFT/SUBMITTED; blocked on AUTHORISED. Never a hard delete. Phase 11's S15 cancellation message calls this same guard (source=integration, DRAFT Lists only).
  - `reassignList(listId, toAnaesthetistId)` — the **fixed canvas must survive** (2 Lists per anaesthetist per day, always): the target's session must currently be Free; the incoming List (Cards, status, audit intact) takes over the target's slot, absorbing the target's empty Free List; the vacated slot regenerates as a fresh List (status chosen by the office — default Unavailable for illness cover); one audit entry records from→to on the moved List, and the absorb/regenerate is recorded too.
  - `reassignCard(cardId, toListId)` — the **lighter-weight, more common operation** distinct from `reassignList`: moves one Card (with its Procedures) from its current List to a different List (same anaesthetist's other session, a different anaesthetist, or a different day) without touching either List's status or its other Cards. Models the RFP's routine case — a hospital/surgeon moves a single patient's booking. Guard: blocked if either List is AUTHORISED (Cards immutable once locked); allowed onto a SUBMITTED target (office edit rights) — including a not-yet-completed Card: the all-Cards-completed rule gates the DRAFT→SUBMITTED *transition*, not later office rebooking, and Phase 07's review screen flags any not-completed Card so nothing slips through to authorisation unseen. No hard surgeon/hospital-pairing guard either — the RFP ties a List to its anaesthetist/surgeon pairing for *booking availability*, not reassignment; Phase 06's target picker surfaces a pairing mismatch advisorily and the office decides. Writes an audit entry on the Card (from-List→to-List) — this is what RFP design principle 10 means by "every create, update, and **reassignment**" being logged at Card level, distinct from the List-level reassignment guard above.
  - `setAvailability(anaesthetistId, date, session, status)` — writes the **AnaesthetistAvailability master** (never the List directly); a reconciliation pass reflects it into the canvas: only Lists whose status is **Free** restatus immediately — any List carrying booking context is NOT silently changed, and that means reservation context, not just Cards (RFP design principle 3: "a List's status is meaningful on its own... even with no Cards attached"): a List with a non-Free status, an assigned hospital/surgeon, **or** Cards gets a conflict flag for the office instead of a silent restatus. An empty-but-reserved List is *not* free (RFP design principle 7: independent master calendars reconciled against the canvas, not merged in).
  - Role & source checks: anaesthetist persona cannot edit SUBMITTED cards or authorise; office can edit SUBMITTED; nobody edits AUTHORISED. **Integration-sourced mutations are permitted only while the target Card's List is DRAFT** (the RFP's state table: DRAFT "can be updated by office and integrations", SUBMITTED is "editable only by office") — an integration write against a SUBMITTED/AUTHORISED List is refused by the guard and returned as an exception outcome Phase 11's monitor surfaces as a manual-intervention item. **No Returned transition exists anywhere.**
- **Audit writer:** a single `mutate(entity, action, source, fn)` wrapper — every domain mutation goes through it, appends an AuditEntry `{who, role, source, action, before→after, at}`, **and stamps the entity's `lastModifiedBy`/`lastModifiedAt`** (the RFP requires both the current-change summary fields *and* the full log — the wrapper keeps them in lockstep so no path can update one without the other). Grep-provable: no direct `set` on domain slices outside the wrapper.
- **Patient upsert:** a single `upsertPatient(details)` intake helper used by **every** card-creation path (manual, photo-OCR, HL7, FHIR, PDF — Phases 03/11): match by NHI when present (either format) → enrich and reuse the existing Patient record; no NHI → create a provisional record. The RFP's Appendix 2 places dedupe at intake ("deduplicates against prior episodes regardless of name or address changes") — one person, one Patient row, before Xero contact resolution ever matters.
- **Master-data invariant:** creating a Hospital (or flipping an Insurer to `acceptsDirectClaims`) **atomically creates its default Type 1 contract** — the RFP mandates every such counterparty "always" holds one, so the guarantee must hold from the moment the counterparty exists, not only be protected against deletion (Phase 07's delete/end-date guard is the other half).
- **Persistence:** hydrate from `localStorage` (versioned key so schema changes don't strand stale data); `resetDemo()` rebuilds the pristine seed.
- **Clock:** `advanceDays(n)` store action; expose a subscription point future phases hook (reconciliation poll, archive job). **Advancing the clock rolls the canvas forward:** each advanced day generates the new far-edge day(s) — 2 Lists per anaesthetist, populated from Permanent Lists (incl. their surgeons) and reconciled against availability/holidays with the same deterministic generator the seeder uses — so the rolling 4-month horizon holds (RFP design principle 6: the Permanent List master "populates the rolling canvas with default Lists as the 4-month horizon advances").

### 3. Demo control panel wiring

Reset (with confirm) and clock display + advance controls — **advance day and advance
minutes/hours within the day** (the time-of-day drives Phase 04's Start/Finish Now stamps) — go
live in `/demo/control` (replacing Phase 00's disabled placeholders).

### 4. Data inspector (`/demo/data`)

Temporary demo-badged screen: entity counts, today's lists table, pick-a-card audit-trail view,
lifecycle-state filters. This is how the phase is demoable and how later sessions debug seed state.

### 5. Guard tests (Vitest)

Complete-card-with-invalid-data rejected (validation reasons surfaced); submit-with-any-uncompleted-
card rejected even when all cards would pass validation (a cancelled card doesn't block); submit of
a non-DRAFT list rejected; **authorise of a non-SUBMITTED list rejected** (no DRAFT→AUTHORISED jump);
anaesthetist-edit-of-SUBMITTED rejected;
office-edit-of-SUBMITTED allowed; **integration-sourced edit of a SUBMITTED or AUTHORISED list's
card refused with an exception outcome** (DRAFT allowed); any-edit-of-AUTHORISED rejected;
cancelCard is audited, excludes the card from validation/billing, and is blocked on AUTHORISED;
the mutation wrapper stamps `lastModifiedBy/At` on every write (spot-checked);
`upsertPatient` reuses the existing Patient for a known NHI (both formats covered) and creates a
provisional record without one — two intake paths, one Patient row;
creating a hospital auto-creates its protected default Type 1 contract; List reassignment preserves card
count + audit entries, appends a reassignment entry, and **the canvas invariant holds** (both
anaesthetists still have exactly 2 Lists that day; reassign-to-non-free-target rejected); Card
reassignment (`reassignCard`) moves a Card between Lists without touching either List's other Cards
or status, writes a Card-level audit entry, and is rejected against an AUTHORISED source or target
List; setAvailability restatuses a Free list but flags (not mutates) a booked one — **including an
empty-but-reserved List** (non-Free status or assigned surgeon/hospital, no Cards yet: flagged,
never silently restatused);
**clock roll-forward preserves the canvas** (advance N days → every anaesthetist still has exactly
2 Lists for every day of the new horizon, and the new far-edge Lists derive from Permanent Lists —
same statuses/surgeons a fresh seed would give them); **canvas-generator scale test** — run the
generator at 85 anaesthetists × the full horizon (~20,000 Lists, the RFP's stated production
scale): invariants hold and generation completes within a stated budget (e.g. < 2s), proving
P10's "structure must support 85" without changing the 14-anaesthetist demo seed; reset
determinism (two resets → deep-equal state).

## Out of scope

All real screens; billing/Xero/integration behaviour (empty slices only). Don't build any mobile
UI — Phase 03 starts that.

## Manual test checklist

- [ ] `npx vitest run` green including the new guard tests; `npm run build` green.
- [ ] Data inspector: 2 Lists per anaesthetist per day across the horizon; every status colour in use; the seeded SUBMITTED lists, split-billing card, two-funder card, cancelled card, pre-payment patient, and the all-day booking (both Lists same hospital/surgeon) all findable.
- [ ] Reset → identical data every time (spot-check a known card's details twice); state survives refresh.
- [ ] Advance-day moves `today()` and the inspector reflects it — and the canvas has rolled forward: the new far-edge day exists with 2 Lists per anaesthetist, populated from Permanent Lists.
- [ ] Attempting the forbidden transitions in the inspector's debug actions (or a scratch test) produces the guard messages.

## PROGRESS.md updates

Status row + entry; record seed-shape decisions and any deviations from the inventory above.
