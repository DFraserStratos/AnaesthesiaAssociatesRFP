# Beyond the RFP · workshop talking points

The reverse sweep. Slices 01 to 10 asked "does the prototype answer the RFP?". This file asks the
opposite question: **what does the prototype carry that the RFP never asked for, and what does each
of those things prove about the architecture behind it?**

Every item below was verified against the source before it was written up. Each is framed the way a
presenter needs it: **what to show**, then **what it demonstrates**. Nothing here is a feature list
for its own sake. If an item cannot be shown on a screen or proved by a green test in front of an
audience, it is not in this file.

A note on how to pitch these. Almost all of them exist because building the RFP's requirement
honestly forced a decision the RFP left open, and the prototype took a position rather than papering
over it. That is the story worth telling: not "we added extras", but "we found the questions the RFP
implies and answered them, visibly, so you can disagree with our answer".

---

## 1. Guarantees, not assertions

The RFP asks for behaviours. In several places the prototype turns the behaviour into something
mechanically provable, so the claim survives a sceptical evaluator.

### The store-discipline source scan

- **Show:** `aa-prototype/src/store/mutate.test.ts:115-140`. Run `npx vitest run src/store/mutate.test.ts`.
- **What it is:** a test that reads the whole `src/store` tree as raw text and asserts that no module
  except `mutate.ts` ever calls `setState` on a domain slice (with `clockActions.ts` allowed to write
  the clock only, and `appStore.ts`'s initialiser the shell slice only).
- **What it demonstrates:** the RFP's design principle 10 says "no mutation without an audit entry".
  In most systems that is a code-review convention that decays. Here it is a build-time guarantee:
  because `mutate()` is the only writer and `mutate()` throws on a write with no audit meta
  (`mutate.ts:150-209`, test at `:91`), an unaudited mutation is not something a future developer can
  accidentally add. It also makes Card immutability at AUTHORISED structural rather than enforced at
  each of the roughly twenty call sites.

### The money-view purity scan

- **Show:** `aa-prototype/src/apps/moneyViewPurity.test.ts`.
- **What it is:** the same technique applied to the Xero boundary. No file under `src/apps/mobile` or
  `src/apps/web` may reference the `xero` slice; comments are stripped first so a comment mentioning
  it cannot trip or satisfy the scan. The Admin app and the Xero sim are exempt by design.
- **What it demonstrates:** the RFP is explicit that the mobile app never queries Xero and reads the
  Billing Engine's own database. That is an architectural boundary, and here it is enforced by a test
  rather than by discipline. It is also the cleanest answer to "what happens when Xero is down?".

### Status-colour key parity

- **Show:** `aa-prototype/src/domain/statusKeyParity.test.ts`, then the legends on
  `visual/shots/m-01-home.png`, `w-02-lists.png` and `a-01-day.png`.
- **What it demonstrates:** N2 asks for a status language consistent across three apps. Colour is
  defined exactly once (`src/theme/statusColours.ts`) and a test holds the theme's key set identical
  to the domain's, so the three apps cannot drift apart. A colour inconsistency across apps is a
  compile-or-test failure, not a QA finding.

### Slot-hashed deterministic generation

- **Show:** `aa-prototype/src/domain/seed/slotHash.ts`, then `src/store/canvasRoll.test.ts:62`.
- **What it is:** each canvas slot derives its own RNG stream from
  `hash(SEED, anaesthetistId, dateISO, session)`, so generation is order-independent.
- **What it demonstrates:** the RFP asks for a canvas that rolls forward as the horizon advances. Most
  demos assert that. Because generation is order-independent, rolling the horizon forward one day at
  a time is **byte-identical** to seeding the whole horizon at once, and the test deep-equals the two.
  The rolling canvas is therefore a proved property, not a claim. This is also what makes the
  85-anaesthetist scale test meaningful (`canvasRoll.test.ts:198`: 85 anaesthetists across the full
  horizon, roughly 23,000 Lists, invariants intact, inside a 2-second budget).

### The canvas invariant, checkable on screen

- **Show:** the Data inspector at `/demo/data` (`visual/shots/demo-data.png`).
- **What it is:** the inspector states "Canvas invariant holds: exactly 2 Lists per anaesthetist
  today" over 3,877 Lists, and prints today's whole canvas with status, hospital, surgeon, times,
  card count and lifecycle state, plus a live census of every master collection.
- **What it demonstrates:** design principle 1 can be **shown** rather than described. It also answers
  "are the master tables real, or is this a mockup?" in one glance.

---

## 2. The demo harness (reproducibility as a feature)

`REQUIREMENTS.md` section 1 defines these as prototype requirements, so they are not RFP features at
all. They are worth naming in the workshop because they are what makes the rest demonstrable.

### A pinned, deterministic clock with a time of day

- **Show:** the clock pill in the demo control panel; `src/domain/clock.ts:31` (`DEMO_TODAY`,
  2026-07-21, the mockups' content date) and `:56` (`now()`).
- **What it demonstrates:** BTM capture needs real times for Start Now / Finish Now and elapsed
  minutes; the rolling horizon needs a stable "today"; the "invoice appears next day" rule needs a
  next day. The clock carries a time of day and advances by days or by minutes, and no domain code
  ever calls `Date.now()`. Every demo runs identically, every time, on any machine.

### Reset to a pristine seed, and S1 to S5 scenario jumps

- **Show:** `src/apps/demo/DemoControlPanel.tsx:226-295`. "Reset demo data" plus five one-click
  scenario jumps (booking to theatre, office changes, money end to end, integrations, audit and
  compliance), each of which resets first and then stages exactly the state that beat needs.
- **What it demonstrates:** a workshop can be re-run, interrupted, backed out of and resumed. It also
  means a difficult question can be answered by jumping to the relevant state rather than clicking
  through six screens. The jumps are proved from reset by `src/store/demoScenarios.test.ts`.

### Fault injection as a first-class control

- **Show:** "Trigger billing failure", "Fail the next Xero handoff", the deliberately malformed
  integration message, and the seeded missed webhook.
- **What it demonstrates:** error paths in this prototype are produced by real mechanisms, not
  hand-set states. A failed billing Card really is a `failed` BillingCase; the retry really re-runs
  the run and then the Xero handoff. That is the difference between a demo of error handling and a
  screenshot of an error.

### The guard console

- **Show:** the Data inspector's guard console (`src/apps/demo/DemoData.tsx:115-240`).
- **What it is:** fire any lifecycle action (complete, cancel, submit, authorise) against any Card or
  List as any actor, and see the store's typed `Outcome` verbatim, including the refusal message.
- **What it demonstrates:** the lifecycle rules are real guards in the store, not UI states. An
  evaluator can try to break them live. It is also the recovery path for any beat that goes off
  script, including the two the review flagged (findings 04.3 and 05.1).

---

## 3. Data-model additions the RFP does not model

Each of these exists because implementing an RFP requirement exposed a state the RFP has no name for.

| Addition | Where | The gap it fills |
|---|---|---|
| `ListConflict` (`src/domain/types.ts:265-268`) | Amber badge, border and tooltip on the admin day grid (`visual/shots/a-06-wed.png`) | The RFP says availability and hospital holidays are "expected to be reconciled" against the canvas but never says what a collision **is**. This makes it a typed, inspectable artefact with a message, and takes the position that it is advisory and never a hard block |
| `CoverRequest` (`:277-284`) | Mobile "Offer cover" bottom sheet, web "Ask to cover" | The Free status had a colour but no action. The RFP asks for an availability view "used to find locum cover at short notice"; this closes the loop from seeing a free session to asking for it |
| `ListPhoneNote` (`:295-299`) | Review screen and the List's audit trail (`src/store/lifecycle.ts:322`) | The RFP has no Returned state and says issues are resolved by phone. A SUBMITTED List therefore needs a forward-only way to record "we rang the hospital about this", which the RFP names as practice but not as data |
| `DayNote` (`:621-629`) | Day view right rail, internal notes | Gives the RFP's Day level real data of its own instead of being only a key |
| `IntegrationCorrelationRef` (`:333`) | Integration monitor's Appointment ID column | The RFP's own sample carries both MSH-10 and SCH-2 but never distinguishes their jobs. The prototype separates them: MSH-10 dedupes **messages**, SCH-2 correlates **appointments**, and the monitor shows both columns, so a later reschedule can find its Card |
| Contract-holder Organisation (`:180-186`) | Master data tab; billed as a counterparty in `src/store/billingRun.test.ts:232` | The RFP's "held externally instead" case (Canterbury Orthopaedic Surgeons) had no home in its own master list |

Also worth naming: **`BillingLine.funderOverride` with a conservation rule**
(`src/domain/billing/validateCardForBilling.ts:248-258`, office editor
`src/shared/flows/FunderAllocationSheet.tsx`). The RFP has one Procedure with one route, and also a
Split Billing section describing one procedure split across two funders. The per-line funder override
is the smallest representation that satisfies both, and the conservation rule (line amounts must sum
to the cent against the computed fee) makes the split safe rather than free-form.

---

## 4. Money integrity beyond the ask

The RFP specifies the calculation. It does not specify what protects the calculation.

- **Rate snapshotting for reproducibility.** `InvoiceLine` deliberately carries no rate field; the
  rate is written into the line description ("7 units at $35.00 per unit",
  `src/domain/billing/invoiceBuild.ts:243-252`). **Show:** `src/store/billingRun.test.ts:367`, which
  mutates a contract and its price list after billing and asserts the raised invoice is unchanged.
  **Demonstrates:** the RFP's design principle 10 requirement that an invoice be reproducible against
  what was true when it was raised, made impossible to violate rather than merely observed.
- **Contract effective dating against the service date.** `src/domain/billing/contracts.ts:22-25`
  resolves against the **List** date, not today. **Demonstrates:** a renegotiation cannot retro-price
  an old list.
- **Rate rounding discipline.** A Type 2 percent discount rounds the derived dollars-per-unit to
  cents **before** multiplying (`src/domain/billing/fee.ts:192-195`). **Demonstrates:** a displayed
  "$27.00 per unit" can never disagree with the charged amount, which is the sort of penny that ends
  up in a dispute.
- **A negative-fee belt.** A price override that would drive a procedure below zero is refused
  (`validateCardForBilling.ts:235-243`), because a negative invoice is a credit note and credit notes
  are a separate decision.
- **Three pre-payment belts the RFP never mentions:** refusal when a pre-invoiced procedure's payer
  changed (`prepaidCounterpartyChanged`), refusal of a funder split on a pre-invoiced procedure
  (`prepaidFunderOverride`), and a billing-time re-check of a funder allocation against the fee under
  the resolved contract (`allocationStale`, `invoiceBuild.ts:344`). All test-pinned at
  `billingRun.test.ts:455-489`.
- **Idempotent billing run.** A second run on an already-billed List is refused
  (`billingRun.test.ts:81`), so a double authorise cannot double-invoice.
- **Increment-only payables.** A partial payment arriving **after** a payables run raises the payable
  without touching prior disbursements (`src/store/payablesActions.ts:98-120`, test
  `payablesActions.test.ts:107`). **Demonstrates:** the RFP's "operates as a Trust account would",
  with no double-pay reachable.
- **A protected default-contract invariant.** Every Hospital and every direct-billing Insurer gets its
  default Type 1 created **atomically** with the counterparty (`src/store/mastersActions.ts:49-163`),
  and it cannot then be deleted, end-dated, forward-dated, retyped or moved to another holder
  (`src/store/contractActions.ts:28-30,111-119,157`), with the lock explained in the admin UI.
  **Show:** `visual/shots/a7-06-add-hospital.png`, where adding "Rangiora Day Surgery" reports its
  default Type 1 was created in the same commit. **Demonstrates:** the RFP calls this "a simple,
  one-off admin step". Making it a store invariant means the "no contract found" branch does not exist
  by construction, and it is scoped exactly as the RFP scopes it, so an expired surgeon-held contract
  becomes a demonstrable per-card billing exception rather than a silent fallback.
- **Typed price override with a mandatory reason** (`src/domain/types.ts:433-437`: reason required in
  every arm), snapshotted onto the invoice as a visible deduction line. The RFP asks only that designs
  "allow for" discretionary overrides.
- **Unit provenance as a first-class concept.** Every B, T and M component carries `seeded` or
  `overridden` (`fee.ts:28-31`), which powers the "Adjusted manually · Use seeded value" affordance
  and the admin review's "B adjusted +2 manually" flag with the delta against the natural value
  (`src/apps/admin/reviewFlags.ts:93-107`). The RFP asks only that seeded values be overridable; the
  prototype also records **that** they were.

---

## 5. Reliability and failure handling beyond the ask

- **Per-card failure isolation with resolve-and-retry.** A failed Card yields a `failed` BillingCase
  and blocks only its own invoice; the List still completes its run, and the monitor's retry rebuilds
  the invoice **and then re-runs the Xero handoff**, so a recovered case becomes payable
  (`src/apps/admin/screens/BillingMonitorScreen.tsx:65-99`, test `billingRun.test.ts:347`).
  **Show:** `visual/shots/p9-02-monitor.png`, one Failed card and one Handed off card on the same List.
- **A triggerable Xero handoff fault with pair-atomic, idempotent retry**
  (`src/store/xeroHandoff.ts:172-191`). The RFP never asks what happens when the handoff itself fails.
  The answer here is that a fault leaves **neither** half of the pair and the retry creates exactly
  one pair, both test-pinned.
- **A dedicated "Xero handoff" pipeline stage** with pending, partial and failed states and detail
  text (`src/store/selectors.ts:525-544`), giving the office the completion-and-errors view in more
  detail than the RFP specifies.
- **A manual "Run reconciliation poll" button with a result count**
  (`src/apps/demo/DemoControlPanel.tsx:779-822`), so the daily safety net can be shown without
  advancing the clock.
- **An end-to-end automated audit trail.** The billing run, the Xero handoff, the payment webhook, the
  ACCPAY flip and the payables run are all `source: 'system'` and reconstructable in one filtered view
  of the audit trail, pinned by `payablesActions.test.ts` ("reconstructs one invoice automated trail
  end-to-end, all source=system"). **Demonstrates:** the NFR asks for audit trails of manual **and
  automated** actions. This is the automated half, end to end, in one place.
- **"Start live feed" drip** (`src/apps/demo/DemoIntegrations.tsx:58-72`): streams a whole feed one
  message per second into the schedule. **Demonstrates:** the RFP's move from SFTP batch latency to
  near-real-time processing, made visible instead of narrated.
- **A load-bearing per-feed mapping editor, audited.** The two HL7 feeds genuinely differ (St George's
  sends the NHI in PID-2, Christchurch Public in PID-3), the mapping is office-only and writes a
  `feed.update` audit entry, and the failure-fix flow **is** a mapping edit: a message dead-letters
  under the wrong mapping, the office corrects PID-2 to PID-3, Reprocess recovers it and creates the
  Card (`src/store/integrationActions.ts:348-377`, test `integrationActions.test.ts:201`).
  **Demonstrates:** configurable field mapping is not a config screen with no consequences. An
  onboarding misconfiguration and its fix are both traceable.
- **Completion blockers as an ordered list, not a boolean.** `completionBlockersFor`
  (`src/store/lifecycle.ts:93-127`) returns every outstanding Card with its specific failure, so the
  submit sheet names them (`visual/shots/m4-09-blockers-sheet.png`), and the blocked submit button
  explains itself ("Mark list completed · 1 to finish · Tap to see what is left"). The RFP requires
  only that submission be blocked.
- **Audited "Amend" (`uncompleteCard`).** A completed Card can be re-opened while the List is DRAFT
  (office also on SUBMITTED), and an integration can never take a completion back
  (`src/store/lifecycle.ts:179-214`). The RFP describes completion but not its reversal.

---

## 6. Identity and data quality beyond the ask

- **Ethnicity quarantine.** An inbound code outside the NZHIS Level 4 set never persists: the Card
  still books, the code is held "pending correction" in both the FHIR extension and the patient
  record, and a Data quality queue lets the office supply a valid code
  (`src/domain/integrations/fhir.ts:132-144`, `src/store/intake.ts:38-48`,
  `src/store/integrationActions.ts:389-418`, UI at `IntegrationMonitorScreen.tsx:354-397`).
  **Demonstrates:** the RFP mandates the code set but says nothing about what to do with a bad one.
  The prototype refuses to store non-conforming data without refusing the booking.
- **Three-way validator honesty.** `validateEthnicityCode` distinguishes **malformed** from
  **well-formed but outside this demo's curated subset** (`src/domain/nzhis.ts:44-78`), so a real
  Level 4 code the demo does not carry is never labelled invalid. A small thing that buys a lot of
  credibility with a clinical audience.
- **A deterministic valid-NHI generator.** `generateNhi` (`src/domain/nhi.ts:132-154`) produces
  checksum-valid fictional NHIs in either format from a seeded RNG, regenerating on the
  never-assigned remainder-0 case, so all roughly 150 seeded patients carry real-shaped NHIs
  (`seed.test.ts:148`) and the seed is reproducible. Every character is drawn from the RNG, so nothing
  in the seed is sequential.
- **A deliberately wrong NHI in the demo data.** The surgeon-PDF pathway ships a mistyped check digit
  (`ZAA0068`, `src/domain/integrations/pdfSamples.ts:111-120`) beside an already-booked row, so read,
  edit, catch-a-bad-NHI and do-not-duplicate are all demonstrable from **one** document. Ingest of the
  bad row is refused (`integrationActions.ts:443-445`).
- **Dual-format validation without a patient-facing badge.** Both NHI formats remain validated in the
  shared domain logic and demonstrated on the integration validator. The earlier "Current format" /
  "New format" patient-block badge was removed on 27 July 2026 after user review because the RFP does
  not require it and it added noise and poor wrapping to ordinary card detail.
- **Guardian identity treated as a real party.** A BillableParty gets its own hidden internal ID, its
  own Xero contact distinct from the patient's, and archives on the same rules
  (`src/store/xeroHandoff.ts:59-60`, `archiveActions.test.ts`). Appendix 2 discusses patients only.
- **Organisational contacts are archive-exempt by type** (`src/store/archiveActions.ts:39`), so
  hospitals, insurers, surgeon groups and anaesthetist payees never fall into the one-time-client
  sweep. This is also the structural answer to the RFP's "about 50% of invoices go to a small number
  of major contract holders".
- **The archive window is real, audited master data, not a constant.** Admin to Master data to "Xero &
  archiving" shows the window, a live eligibility count and a manual "run the nightly job now" action
  (`src/apps/admin/screens/MasterData.tsx:479-545`), with a test proving that changing the window
  changes next-run eligibility (90 to 150 to 50 days).
- **A patient contact ships already archived in the pristine seed** (Riley), so the
  archived-contact-returns path demos from a reset with no setup.

---

## 7. Honest labelling as a product surface

This is the one that most consistently surprises reviewers, and it is worth making explicit in the
workshop because it is a statement about how the vendor works, not about the software.

Where the prototype made an assumption, the assumption is printed **on the screen**, not buried in a
document:

- "Part intervals round up (assumption to confirm with AA)" on the BTM capture screen
  (`src/shared/capture/TimesCard.tsx:132`, visible in `visual/shots/m4-04-finish-stamped.png`).
- "Modifier values are demo-plausible within the RFP's stated ranges, not an authoritative NZSA
  schedule" beneath the modifier picker (`ModifierChips.tsx:167`) and on both master-data tabs.
- "One row per outstanding ACCPAY invoice, ordered by date raised. No rollup (per the RFP)."
  on the Overdue table (`visual/shots/w-09-overdue.png`).
- "Scale is narrated with counters, not simulated as records." in the Xero sim
  (`src/apps/demo/DemoXero.tsx:158`).
- The GST treatment labelled a demo assumption and a discovery item on every invoice document
  (`InvoiceDocument.tsx:204`).
- The reassignment mechanism labelled a **replaceable proposal** in its own confirm dialog:
  "Proposed reading: the RFP leaves the precise reassignment mechanism open... This mechanism is
  replaceable." (`src/apps/admin/flows/ReassignListFlow.tsx:102`).
- The split-billing invoice-count reading stated in the Invoices screen header and held as a discovery
  question (`InvoicesScreen.tsx:70-75`).
- The billing-monitor's own placement named as a picked reading of an open RFP question
  (`BillingMonitorScreen.tsx:104-109`).
- The NHI-in-Xero contradiction between Appendix 1 and Appendix 2 stated as an item needing an AA
  ruling, on the very surface where it would have been implemented (`DemoXero.tsx:59-64`).
- The Xero duplicate-invoice-number org setting flagged as an open configuration item
  (`DemoXero.tsx:65-69`).
- The RFP's "Modulus 24" NHI label named as a discrepancy, with the algorithm actually used stated
  next to it (`IntegrationMonitorScreen.tsx:414-418`).

**What it demonstrates:** the prototype distinguishes what the RFP said, what we inferred, and what
still needs AA's decision, and it does so where the audience is looking rather than in an appendix.
Every one of those callouts is an invitation to correct us in the workshop, which is exactly what a
scoping and design phase is for.

---

## 8. Operational affordances the RFP does not name

Small things, but they are what an office user notices first.

- **Admin day view:** a Roster-order / A to Z toggle, `-4w / -1w / Today / +1w / +4w` navigation, and a
  live day summary ("14 anaesthetists · 17 sessions · 5 free · 0 submitted"). The legacy screen in
  Appendix 4 had a mini calendar plus Today / 1 Week / 4 Weeks and nothing else.
- **An "Awaiting review" rail and a Review-queue count badge** on the day view, tying the day the
  office is looking at to the authorisation work waiting on it.
- **Per-day internal notes and needs-attention badges** on the day grid.
- **Vacated-slot status is the office's choice** (Unavailable / Free / Holiday) in the reassign confirm
  step (`ReassignListFlow.tsx:17-21`), with `list.absorb` and `list.regenerate` as first-class audit
  actions so the reassignment mechanics are inspectable in the trail rather than implicit.
- **List-header completion progress** ("3 of 4 complete" with a bar) on mobile, where the legacy app
  had only a per-card Completed toggle.
- **A per-card History affordance on every card surface, mobile included**
  (`src/shared/card/CardDetailBody.tsx:276-284`), so the audit trail is one tap away in context rather
  than a detour into the admin Audit screen.
- **Receivables aging buckets and an over-60-days count** on the anaesthetist dashboard and the Overdue
  table (`src/store/selectors.ts:667-682`), above the RFP's flat list.
- **A "Prior balance" intake badge** on the billing-monitor row when a returning patient has an unpaid
  prior episode (`BillingMonitorScreen.tsx:196-203`).
- **Read-only master views of the RVG and modifier tables, with an "Absorbs" column**
  (`MasterData.tsx:410-449`), which makes the P1 absorption rule inspectable live during a workshop
  instead of being explained.
- **Refusal reasons as user-facing copy.** `modifierUnits` returns `{ code, reason }` and the UI renders
  the sentence verbatim rather than silently zeroing a chip
  (`ModifierChips.tsx:72-75`: "Base code 47516 already includes P1; its units are not added.").
- **Structural disabling on an additional procedure.** On an `isAdditional` procedure the B and M
  steppers, the seeded-value reset, the ASA selector and the modifier chips are all disabled with an
  explanatory banner (`UnitsCard.tsx:54-81`, `BtmCaptureBlock.tsx:164-171`), so the RFP's
  no-double-charge rule cannot be bypassed by stepping units, on top of the engine already ignoring
  those values.

---

## 9. Presentation craft

Not architecture, but it is part of what is being evaluated.

- **A dedicated design language.** `docs/design/Design Language.dc.html` is the token source of truth:
  palette, six status colours with tint and on-tint values, the hatched Unavailable and dashed Free
  treatments, type (Schibsted Grotesk for UI, Spline Sans Mono with tabular numerals for data), 4pt
  spacing, radii, elevations, and four named motion patterns with reduced-motion fallbacks. Two hard
  rules hold throughout: AA crimson is identity only (masthead, active nav, avatars), and deep teal is
  the only action colour.
- **Genuinely mobile-first mobile.** Bottom sheets and slide-in cards rather than desktop modals in a
  phone shell; steppers, chips and segmented controls rather than dropdowns and free text; a bottom
  tab bar; micro-delight in the complete-tick, the fee value ticking up and the submit settling, none
  of which delays a task (convention 16).
- **A committed visual regression suite.** 11 Playwright specs and 76 screenshots under
  `aa-prototype/visual/`, which is both a regression harness and the evidence base this whole review
  was verified against.
- **Presenter material that exists.** `docs/demo-guide/` carries personas and responsibilities,
  workflows and handoffs, a beat-by-beat demo script, a presenter cheat sheet including ten RFP
  ambiguities prepared as discovery decisions, and a single consolidated HTML build of all of it.

---

## Two caveats worth holding in mind

1. **Everything here is prototype-grade.** The extras are real behaviours over a fake in-browser
   backend, not production components. The right framing is "this is the shape of the answer and here
   is it working", not "this is built".
2. **Two of the items above are the mitigation for findings in `00-SUMMARY.md`.** The Data inspector's
   guard console and the billing monitor's per-Card invoice count are how a presenter recovers from
   findings 04.3 and 05.1 respectively. Read the summary's headline verdict before the workshop, not
   only this file.
